#!/usr/bin/env node

/**
 * GEO QA - Script de Quality Assurance para Geocodificación con Gazetteer
 *
 * Prueba 20 direcciones problemáticas reales del CRM y genera tabla de resultados
 * con scoring robusto, cache, y validaciones exhaustivas.
 */

const fs = require('fs');
const crypto = require('crypto');

// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

const GAZETTEER_PATH = './culiacan-colonias-completo.json';

const CULIACAN_COORDS = { lat: 24.8091, lng: -107.3940 };
const CULIACAN_BOUNDS = {
    north: 24.95,
    south: 24.67,
    east: -107.25,
    west: -107.54
};

// Patrones de ruido EXPANDIDOS
const NOISE_PATTERNS = [
    /privada\s+en\s+/gi,
    /casa\s+en\s+(venta|renta)\s+en\s+/gi,
    /inmuebles24\s*/gi,
    /zona\s+comercial\s*/gi,
    /desarrollo\s+urbano\s*/gi,
    /cerca\s+de\s+/gi,
    /frente\s+a\s+/gi,
    /entre\s+/gi,
    /por\s+/gi,
    /atr[áa]s\s+de\s+/gi,
    /a\s+un\s+costado\s+de\s+/gi,
    /zona\s+dorada\s*/gi,
    /fraccionamiento\s+fraccionamiento\s+/gi,  // Duplicados
    /culiac[áa]n\s+culiac[áa]n/gi,             // Duplicados ciudad
    /,\s*,+/g,                                  // Comas múltiples
    /^\s*,\s*/,                                 // Coma inicial
    /\s*,\s*$/                                  // Coma final
];

// ============================================
// CLASE GAZETTEER MEJORADA
// ============================================

class GazetteerMejorado {
    constructor() {
        this.data = null;
        this.indexBySlug = new Map();
        this.indexByCP = new Map();
        this.cache = new Map();
        this.loaded = false;
    }

    load() {
        if (this.loaded) return;

        const raw = fs.readFileSync(GAZETTEER_PATH, 'utf8');
        this.data = JSON.parse(raw);

        // Construir índices
        this.data.colonias.forEach(col => {
            const slug = this._slug(col.nombre);

            if (!this.indexBySlug.has(slug)) {
                this.indexBySlug.set(slug, []);
            }
            this.indexBySlug.get(slug).push(col);

            if (col.codigoPostal) {
                if (!this.indexByCP.has(col.codigoPostal)) {
                    this.indexByCP.set(col.codigoPostal, []);
                }
                this.indexByCP.get(col.codigoPostal).push(col);
            }

            // Alias automáticos
            this._generateAliases(col.nombre).forEach(alias => {
                const aliasSlug = this._slug(alias);
                if (aliasSlug !== slug) {
                    if (!this.indexBySlug.has(aliasSlug)) {
                        this.indexBySlug.set(aliasSlug, []);
                    }
                    this.indexBySlug.get(aliasSlug).push(col);
                }
            });
        });

        this.loaded = true;
        console.log(`✅ Gazetteer cargado: ${this.data.metadata.totalEntradas} entradas`);
    }

    _slug(text) {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
    }

    _generateAliases(nombre) {
        const aliases = [];

        // Sin "Fraccionamiento" / "Colonia"
        if (nombre.includes('Fraccionamiento')) {
            aliases.push(nombre.replace(/Fraccionamiento\s+/gi, ''));
            aliases.push(nombre.replace(/Fraccionamiento\s+/gi, 'Fracc. '));
        }
        if (nombre.includes('Colonia')) {
            aliases.push(nombre.replace(/Colonia\s+/gi, ''));
            aliases.push(nombre.replace(/Colonia\s+/gi, 'Col. '));
        }

        // Sin acentos
        const sinAcentos = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (sinAcentos !== nombre) aliases.push(sinAcentos);

        // Tres Ríos variants
        if (/tres.*r[íi]os/i.test(nombre)) {
            aliases.push(nombre.replace(/Tres Ríos/gi, '3 Ríos'));
            aliases.push(nombre.replace(/Tres Ríos/gi, 'Sector Tres Ríos'));
        }

        return aliases;
    }

    find(text) {
        const slug = this._slug(text);

        // Exacto
        if (this.indexBySlug.has(slug)) {
            return {
                matches: this.indexBySlug.get(slug),
                score: 1.0,
                type: 'exact'
            };
        }

        // Fuzzy
        const fuzzy = this._fuzzyMatch(text, 0.7);
        if (fuzzy.length > 0) {
            return {
                matches: [fuzzy[0]],
                score: fuzzy[0].matchScore,
                type: 'fuzzy'
            };
        }

        return { matches: [], score: 0, type: 'none' };
    }

    _fuzzyMatch(text, threshold) {
        const results = [];
        const searchSlug = this._slug(text);

        this.data.colonias.forEach(col => {
            const colSlug = this._slug(col.nombre);
            const similarity = this._tokenSetRatio(searchSlug, colSlug);

            if (similarity >= threshold) {
                results.push({
                    ...col,
                    matchScore: similarity
                });
            }
        });

        return results.sort((a, b) => b.matchScore - a.matchScore);
    }

    _tokenSetRatio(str1, str2) {
        const tokens1 = new Set(str1.split('-'));
        const tokens2 = new Set(str2.split('-'));
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        return intersection.size / union.size;
    }
}

// ============================================
// NORMALIZADOR MEJORADO
// ============================================

class NormalizadorMejorado {
    normalize(raw) {
        if (!raw) return { clean: '', components: {}, score: 0 };

        let text = raw;

        // 1. Quitar ruido
        NOISE_PATTERNS.forEach(p => {
            text = text.replace(p, ' ');
        });

        // 2. Deduplicar tokens
        const parts = text.split(',').map(p => p.trim()).filter(p => p);
        const seen = new Set();
        const deduped = [];

        parts.forEach(part => {
            const normalized = part.toLowerCase().replace(/\s+/g, '');
            if (!seen.has(normalized) && normalized.length > 2) {
                seen.add(normalized);
                deduped.push(part);
            }
        });

        text = deduped.join(', ');

        // 3. Normalizar abreviaturas
        text = text
            .replace(/\b(blvd|boulevard)\b\.?/gi, 'Blvd.')
            .replace(/\b(av|avenida)\b\.?/gi, 'Av.')
            .replace(/\b(fracc|fraccionamiento)\b\.?/gi, 'Fracc.')
            .replace(/\b(col|colonia)\b\.?/gi, 'Col.')
            .replace(/\.{2,}/g, '.');  // Limpiar puntos dobles

        // 4. Extraer componentes
        const components = this._extractComponents(text);

        // 5. Score de la dirección
        const addressScore = this._scoreAddress(text, components);

        return {
            clean: text.trim(),
            components,
            score: addressScore
        };
    }

    _extractComponents(text) {
        const parts = text.split(',').map(p => p.trim()).filter(p => p);

        const components = {
            street: null,
            streetNumber: null,
            neighborhood: null,
            city: 'Culiacán',
            state: 'Sinaloa'
        };

        const numberPattern = /\b(\d+[A-Z]?)\b/i;
        const streetKeywords = /^(Av\.|Blvd\.|Calle|Priv\.|Prol\.|Internacional|C\.)/i;

        // Detectar calle con número
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const numberMatch = part.match(numberPattern);

            if (numberMatch || streetKeywords.test(part)) {
                components.street = part;
                if (numberMatch) components.streetNumber = numberMatch[1];
                break;
            }
        }

        // Detectar colonia (primer parte que no sea calle ni ciudad)
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (part === components.street) continue;
            if (/culiac[áa]n|sinaloa|m[ée]xico/i.test(part)) continue;

            // Esta es la colonia
            components.neighborhood = part.replace(/^(Fracc\.|Col\.)\s+/i, '').trim();
            break;
        }

        return components;
    }

    _scoreAddress(text, components) {
        let score = 0;

        // +10 calle + número
        if (components.street && components.streetNumber) score += 10;
        // +5 solo calle
        else if (components.street) score += 5;

        // +4 colonia presente
        if (components.neighborhood) score += 4;

        // -6 si contiene ruido
        const hasNoise = NOISE_PATTERNS.some(p => p.test(text));
        if (hasNoise) score -= 6;

        // -4 si muy larga (>100 chars) o muchas comas
        if (text.length > 100) score -= 2;
        const commas = (text.match(/,/g) || []).length;
        if (commas > 4) score -= 2;

        return Math.max(0, score);  // No negativo
    }
}

// ============================================
// GEOCODER ROBUSTO CON CACHE
// ============================================

class GeocoderRobusto {
    constructor() {
        this.gazetteer = new GazetteerMejorado();
        this.normalizer = new NormalizadorMejorado();
        this.cache = new Map();

        this.gazetteer.load();
    }

    async geocode(rawAddress) {
        // Cache check
        const hash = this._hash(rawAddress);
        if (this.cache.has(hash)) {
            return { ...this.cache.get(hash), cached: true };
        }

        // 1. Normalizar
        const normalized = this.normalizer.normalize(rawAddress);

        // 2. Buscar colonia en gazetteer
        const coloniaResult = normalized.components.neighborhood
            ? this.gazetteer.find(normalized.components.neighborhood)
            : { matches: [], score: 0, type: 'none' };

        const colonia = coloniaResult.matches[0] || null;

        // 3. Determinar precisión y coordenadas
        let precision, lat, lng, source, confidence;

        if (normalized.components.street && normalized.components.streetNumber && colonia) {
            // Street-level (requeriría API de Google)
            precision = 'street';
            lat = CULIACAN_COORDS.lat;
            lng = CULIACAN_COORDS.lng;
            source = 'centroid-approx';
            confidence = 0.8;
        } else if (colonia) {
            // Neighborhood-level
            precision = 'neighborhood';
            lat = CULIACAN_COORDS.lat;  // Placeholder - usar centroide de colonia
            lng = CULIACAN_COORDS.lng;
            source = 'gazetteer-centroid';
            confidence = 0.7;
        } else {
            // City-level
            precision = 'city';
            lat = CULIACAN_COORDS.lat;
            lng = CULIACAN_COORDS.lng;
            source = 'city-center';
            confidence = 0.3;
        }

        // 4. Validar bounds
        const boundsOk = this._withinBounds(lat, lng);
        if (!boundsOk) {
            // Degradar a ciudad
            lat = CULIACAN_COORDS.lat;
            lng = CULIACAN_COORDS.lng;
            precision = 'city';
            source = 'bounds-fallback';
        }

        // 5. Calcular confidence total
        const addressScoreN = normalized.score / 14;  // Normalizado 0-1
        const matchScore = coloniaResult.score;
        const geocodeScore = boundsOk ? 1.0 : 0.5;

        confidence = 0.5 * addressScoreN + 0.3 * matchScore + 0.2 * geocodeScore;

        // Resultado
        const result = {
            address_raw: rawAddress,
            address_clean: normalized.clean,
            precision,
            lat,
            lng,
            colonia: colonia ? {
                nombre: colonia.nombre,
                tipo: colonia.tipo,
                cp: colonia.codigoPostal,
                zona: colonia.zona,
                matchScore: coloniaResult.score,
                matchType: coloniaResult.type
            } : null,
            confidence,
            bounds_ok: boundsOk,
            source,
            needs_review: confidence < 0.5 || !boundsOk || precision === 'city'
        };

        // Guardar en cache
        this.cache.set(hash, result);

        return result;
    }

    _hash(text) {
        return crypto.createHash('md5').update(text).digest('hex');
    }

    _withinBounds(lat, lng) {
        return lat >= CULIACAN_BOUNDS.south &&
               lat <= CULIACAN_BOUNDS.north &&
               lng >= CULIACAN_BOUNDS.west &&
               lng <= CULIACAN_BOUNDS.east;
    }
}

// ============================================
// SCRIPT QA PRINCIPAL
// ============================================

const TEST_ADDRESSES = [
    { id: '147903309', ubicacion: 'Privada en Sector Tres Rios, Culiacán, Sinaloa, Mexico, Zona comercial Desarrollo Urbano 3 Ríos' },
    { id: '91269633', ubicacion: 'Internacional 2660, Culiacán, Sinaloa, Mexico, Fraccionamiento Del Humaya' },
    { id: '146847493', ubicacion: 'C. Salvador Elizondo 5839, Culiacán, Sinaloa, Mexico, Fraccionamiento Finisterra' },
    { id: '142723254', ubicacion: 'Las Quintas, Edo Yucatán, Culiacán, Sinaloa, Mexico, Fraccionamiento Las Quintas' },
    { id: '144439344', ubicacion: 'Casa en Venta en Pisa, Stanza Toscana BR9, Culiacán, Sinaloa, Mexico, Stanza Toscana' },
    { id: '147055011', ubicacion: 'Avenida Juan Escutia Norte, Culiacán, Sinaloa, Mexico, Fraccionamiento Chapultepec Del Rio' },
    { id: '146839974', ubicacion: 'BLVD. UNIVERSO 17, Bosques del Rey, 80058 Culiacán, Sinaloa, México, Culiacán, Sinaloa, Mexico, Ejido Empaque del Valle' },
    { id: '144422903', ubicacion: '29 DE DICIEMBRE 1429, 5 de Mayo, 80230 Culiacán, Sinaloa, México, Culiacán, Sinaloa, Mexico, 5 de Mayo' },
    { id: '147564220', ubicacion: 'Inmuebles24  Casa  Renta  Sinaloa  Culiacán  Lomas Del Magisterio  Casa en Renta Colonia Lomas del Pedregal Culiacan Sinaloa' },
    { id: '147928773', ubicacion: 'Inmuebles24  Casa  Renta  Sinaloa  Culiacán  Fraccionamiento Portalegre  Casa en Renta en Portalegre Valley Totalmente Equipada' },
    { id: '147682613', ubicacion: 'Inmuebles24  Casa  Renta  Sinaloa  Culiacán  Fraccionamiento Villa del Cedro  Casa en Renta 3 Habitaciones 2 Plantas, Vitia Granada' },
    { id: 'PROP-0', ubicacion: 'Casa en Venta Bugambilias, Zona Aeropuerto, habitación en Plata Baja ¡Lista para habitarse! · Culiacán' },
    { id: 'PROP-2', ubicacion: 'Casa en Venta Lomas del Sol en esquina, 2 Recámaras con terreno Excedente · Culiacán' },
    { id: 'PROP-4', ubicacion: 'Casa en Venta en Privada con Excedente 4 Recámaras sector La Conquista. · Culiacán' },
    { id: 'PROP-62945410', ubicacion: 'Hermosa casa en venta en Belcantto Residencial, lista para habitar · Culiacán' },
    { id: 'PROP-01-A', ubicacion: 'Residencia en venta en Barrio San Francisco la Primavera .01 * · Culiacán' },
    { id: 'PROP-01-B', ubicacion: 'CASA EN VENTA EN LA PRIMAVERA. BARRIO SAN FRANCISCO SUR. (01) · Culiacán' },
    { id: 'PROP-73552214', ubicacion: 'Departamento en Renta Álamos-Tec Monterrey · Zona Álamos-Tec, Monterrey' },
    { id: 'TEST-1', ubicacion: 'Tres Ríos, Culiacán, Sinaloa' },
    { id: 'TEST-2', ubicacion: 'Sector Tres Rios, Culiacán' }
];

async function main() {
    console.log('\n🧪 ========== GEO QA - QUALITY ASSURANCE ==========\n');

    const geocoder = new GeocoderRobusto();
    const results = [];

    console.log(`📋 Probando ${TEST_ADDRESSES.length} direcciones...\n`);

    for (const test of TEST_ADDRESSES) {
        const result = await geocoder.geocode(test.ubicacion);
        results.push({ id: test.id, ...result });
    }

    // ============================================
    // TABLA DE RESULTADOS
    // ============================================

    console.log('\n📊 ========== TABLA DE RESULTADOS ==========\n');
    console.log('| ID | Colonia | Precision | Conf | Bounds | Review |');
    console.log('|----|---------|-----------|------|--------|--------|');

    results.forEach(r => {
        const colonia = r.colonia ? r.colonia.nombre.substring(0, 15).padEnd(15) : '(ninguna)'.padEnd(15);
        const precision = r.precision.padEnd(9);
        const conf = `${(r.confidence * 100).toFixed(0)}%`.padStart(4);
        const bounds = r.bounds_ok ? '✓' : '✗';
        const review = r.needs_review ? '⚠️' : '✓';

        console.log(`| ${r.id.padEnd(14)} | ${colonia} | ${precision} | ${conf} | ${bounds.padStart(6)} | ${review.padStart(6)} |`);
    });

    // ============================================
    // ESTADÍSTICAS
    // ============================================

    const stats = {
        total: results.length,
        byPrecision: {},
        withColonia: 0,
        withinBounds: 0,
        needsReview: 0,
        avgConfidence: 0
    };

    results.forEach(r => {
        stats.byPrecision[r.precision] = (stats.byPrecision[r.precision] || 0) + 1;
        if (r.colonia) stats.withColonia++;
        if (r.bounds_ok) stats.withinBounds++;
        if (r.needs_review) stats.needsReview++;
        stats.avgConfidence += r.confidence;
    });

    stats.avgConfidence /= results.length;

    console.log('\n📈 ========== ESTADÍSTICAS ==========\n');
    console.log(`Total direcciones: ${stats.total}`);
    console.log(`\nPor precisión:`);
    Object.keys(stats.byPrecision).forEach(p => {
        const count = stats.byPrecision[p];
        const pct = (count / stats.total * 100).toFixed(1);
        console.log(`  ${p.padEnd(12)}: ${count.toString().padStart(2)} (${pct}%)`);
    });
    console.log(`\nCon colonia identificada: ${stats.withColonia} (${(stats.withColonia / stats.total * 100).toFixed(1)}%)`);
    console.log(`Dentro de bounds:         ${stats.withinBounds} (${(stats.withinBounds / stats.total * 100).toFixed(1)}%)`);
    console.log(`Requieren revisión:       ${stats.needsReview} (${(stats.needsReview / stats.total * 100).toFixed(1)}%)`);
    console.log(`Confianza promedio:       ${(stats.avgConfidence * 100).toFixed(1)}%`);

    // ============================================
    // CASOS DESTACADOS
    // ============================================

    console.log('\n✅ ========== MEJORES CASOS ==========\n');
    const best = results.filter(r => r.confidence >= 0.7).slice(0, 3);
    best.forEach((r, i) => {
        console.log(`${i + 1}. [${r.id}]`);
        console.log(`   Raw: "${r.address_raw.substring(0, 60)}..."`);
        console.log(`   Clean: "${r.address_clean}"`);
        if (r.colonia) {
            console.log(`   Colonia: ${r.colonia.nombre} (${r.colonia.matchType}, ${(r.colonia.matchScore * 100).toFixed(0)}%)`);
        }
        console.log(`   Precisión: ${r.precision}, Confianza: ${(r.confidence * 100).toFixed(0)}%`);
        console.log('');
    });

    console.log('\n⚠️  ========== CASOS REQUIEREN REVISIÓN ==========\n');
    const review = results.filter(r => r.needs_review).slice(0, 5);
    review.forEach((r, i) => {
        console.log(`${i + 1}. [${r.id}]`);
        console.log(`   Raw: "${r.address_raw.substring(0, 60)}..."`);
        console.log(`   Clean: "${r.address_clean}"`);
        console.log(`   Razón: Precisión=${r.precision}, Confianza=${(r.confidence * 100).toFixed(0)}%, Bounds=${r.bounds_ok}`);
        console.log('');
    });

    console.log('\n✅ QA Completado\n');

    // ============================================
    // EXPORTAR CSV
    // ============================================

    const csvFilename = `QA_V1_5_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`;
    exportToCSV(results, csvFilename);

    return { results, stats };
}

/**
 * Exporta resultados a CSV
 */
function exportToCSV(results, filename) {
    const fs = require('fs');

    // Header
    const header = 'id,raw,clean,colonia,precision,confidence,lat,lng,bounds_ok,needs_review\n';

    // Rows
    const rows = results.map(r => {
        const raw = `"${r.address_raw.replace(/"/g, '""')}"`;  // Escapar comillas
        const clean = `"${r.address_clean.replace(/"/g, '""')}"`;
        const colonia = r.colonia ? `"${r.colonia.nombre.replace(/"/g, '""')}"` : '';
        const precision = r.precision;
        const confidence = r.confidence.toFixed(2);
        const lat = r.lat.toFixed(6);
        const lng = r.lng.toFixed(6);
        const boundsOk = r.bounds_ok ? 'true' : 'false';
        const needsReview = r.needs_review ? 'true' : 'false';

        return `${r.id},${raw},${clean},${colonia},${precision},${confidence},${lat},${lng},${boundsOk},${needsReview}`;
    }).join('\n');

    const csv = header + rows;

    fs.writeFileSync(filename, csv, 'utf8');
    console.log(`📄 CSV exportado: ${filename}\n`);
}

// Ejecutar
main().catch(console.error);
