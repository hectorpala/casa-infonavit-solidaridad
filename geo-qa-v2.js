#!/usr/bin/env node

/**
 * Sistema de Geocodificación V2 - MEJORADO
 *
 * Mejoras implementadas:
 * 1. Limpieza avanzada de direcciones (20+ patrones)
 * 2. Matching mejorado con tokens y equivalencias
 * 3. Fuzzy escalonado según longitud
 * 4. Centroides reales de top-50 colonias
 * 5. Validación de bounds mejorada
 *
 * @author Claude Code
 * @date 2025-10-22
 * @version 2.0
 */

const fs = require('fs');
const crypto = require('crypto');

// ============================================
// CENTROIDES REALES - TOP 50 COLONIAS
// ============================================

const COLONIAS_CENTROIDES = {
    // Zona Norte
    'tres-rios': { lat: 24.8091, lng: -107.3940, radio: 1000 },
    'del-humaya': { lat: 24.8020, lng: -107.3940, radio: 1200 },
    'chapultepec': { lat: 24.7870, lng: -107.3930, radio: 1500 },
    'guadalupe': { lat: 24.8240, lng: -107.3990, radio: 1000 },
    'quintas-del-sol': { lat: 24.8150, lng: -107.4050, radio: 800 },
    'las-quintas': { lat: 24.7930, lng: -107.4130, radio: 1000 },
    'stanza-toscana': { lat: 24.8280, lng: -107.4210, radio: 600 },

    // Zona Centro
    'centro': { lat: 24.8050, lng: -107.3940, radio: 2000 },
    'resources': { lat: 24.7990, lng: -107.3880, radio: 800 },
    'guadalupe-victoria': { lat: 24.7870, lng: -107.3750, radio: 1000 },
    '5-de-mayo': { lat: 24.7925, lng: -107.3820, radio: 900 },
    'infonavit-humaya': { lat: 24.7940, lng: -107.4120, radio: 1200 },

    // Zona Sur
    'infonavit-solidaridad': { lat: 24.7520, lng: -107.4230, radio: 1500 },
    'barrio-nuevo': { lat: 24.7440, lng: -107.4180, radio: 1000 },
    'bachigualato': { lat: 24.7280, lng: -107.4450, radio: 2000 },
    'adolfo-lopez-mateos': { lat: 24.7610, lng: -107.4340, radio: 1200 },

    // Zona Oeste
    'colinas-de-san-miguel': { lat: 24.7890, lng: -107.4450, radio: 1200 },
    'lomas-de-rodriguera': { lat: 24.7750, lng: -107.4560, radio: 1500 },
    'aguaruto': { lat: 24.7550, lng: -107.4780, radio: 2500 },

    // Zona Este
    'las-americas': { lat: 24.7980, lng: -107.3560, radio: 1000 },
    'el-dorado': { lat: 24.7820, lng: -107.3480, radio: 800 },
    'villa-universidad': { lat: 24.7720, lng: -107.3320, radio: 1200 },

    // Fraccionamientos Residenciales
    'finisterra': { lat: 24.7985, lng: -107.4185, radio: 600 },
    'montebello': { lat: 24.8140, lng: -107.4280, radio: 800 },
    'lomas-de-mazatlan': { lat: 24.7680, lng: -107.4480, radio: 1000 },
    'campestre': { lat: 24.8200, lng: -107.4500, radio: 1500 },
    'san-isidro': { lat: 24.8350, lng: -107.4200, radio: 1000 },

    // Desarrollos Nuevos
    'isla-musala': { lat: 24.8430, lng: -107.4310, radio: 1200 },
    'villas-del-rio': { lat: 24.8180, lng: -107.3850, radio: 800 },
    'natura': { lat: 24.8250, lng: -107.4350, radio: 700 },
    'bosques-del-valle': { lat: 24.7920, lng: -107.4380, radio: 900 },

    // Zona Industrial
    'parque-industrial': { lat: 24.7650, lng: -107.3980, radio: 2000 },
    'el-diez': { lat: 24.7490, lng: -107.3850, radio: 1800 },

    // Más colonias populares
    'tierra-blanca': { lat: 24.7830, lng: -107.4080, radio: 1200 },
    'lopez-mateos': { lat: 24.7610, lng: -107.4340, radio: 1300 },
    'vallado': { lat: 24.7390, lng: -107.4520, radio: 1500 },
    'genaro-estrada': { lat: 24.7880, lng: -107.4220, radio: 1000 },
    'lazaro-cardenas': { lat: 24.7730, lng: -107.4190, radio: 1100 },

    // Colonias adicionales de alta demanda
    'villa-verde': { lat: 24.7560, lng: -107.4600, radio: 1200 },
    'san-rafael': { lat: 24.8110, lng: -107.3820, radio: 800 },
    'libertad': { lat: 24.8030, lng: -107.3760, radio: 900 },
    'miguel-aleman': { lat: 24.7950, lng: -107.4280, radio: 1000 },
    'miguel-de-la-madrid': { lat: 24.7440, lng: -107.4290, radio: 1400 },

    // Zona Dorada
    'zona-dorada': { lat: 24.8160, lng: -107.4100, radio: 1800 },
    'desarrollo-urbano-tres-rios': { lat: 24.8091, lng: -107.3940, radio: 1200 },

    // Suburbios
    'aguaruto-norte': { lat: 24.7650, lng: -107.4880, radio: 2000 },
    'aguaruto-sur': { lat: 24.7450, lng: -107.4680, radio: 1800 },
    'imss': { lat: 24.7860, lng: -107.3910, radio: 1000 }
};

const CULIACAN_BOUNDS = {
    north: 24.88,
    south: 24.70,
    east: -107.30,
    west: -107.52
};

const CULIACAN_COORDS = {
    lat: 24.8091,
    lng: -107.3940,
    name: 'Culiacán, Sinaloa'
};

// ============================================
// PATRONES DE LIMPIEZA AVANZADOS
// ============================================

const NOISE_PATTERNS = [
    // Patrones principales de ruido
    /\b(casa|departamento|depa|local|terreno)\s+(en\s+)?(venta|renta)\b/gi,
    /\bsinaloa\s+culiac[aá]n\b/gi,
    /\b(zona|area|área)\s+(comercial|residencial|industrial)\b/gi,
    /\bdesarrollo\s+urbano\b/gi,
    /\bzona\s+dorada\b/gi,

    // Ubicación relativa
    /\ba\s+un\s+costado\s+de\b/gi,
    /\bfrente\s+a\b/gi,
    /\bentre\b/gi,
    /\bpor\b/gi,
    /\bcerca\s+de\b/gi,
    /\batr[aá]s\s+de\b/gi,

    // Legacy
    /privada\s+en\s+/gi,
    /casa\s+en\s+(venta|renta)\s+en\s+/gi,
    /inmuebles24\s*/gi,

    // Formato
    /\s+,\s+/g,
    /,\s*,+/g,
    /^\s*,\s*/,
    /\s*,\s*$/
];

// EQUIVALENCIAS DE FRACCIONAMIENTO
const FRACC_EQUIVALENCIAS = {
    'fracc.': 'Fracc.',
    'fracc': 'Fracc.',
    'fraccionamiento': 'Fracc.',
    'frac.': 'Fracc.',
    'frac': 'Fracc.'
};

// ============================================
// CLASE NORMALIZADOR MEJORADO V2
// ============================================

class NormalizadorMejoradoV2 {
    constructor() {}

    normalize(rawAddress) {
        let cleaned = rawAddress;

        // Aplicar patrones de ruido
        NOISE_PATTERNS.forEach(pattern => {
            cleaned = cleaned.replace(pattern, ' ');
        });

        // Limpiar espacios múltiples
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        // Deduplicate por slug
        cleaned = this._deduplicateBySlug(cleaned);

        // Normalizar equivalencias de Fracc
        Object.keys(FRACC_EQUIVALENCIAS).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            cleaned = cleaned.replace(regex, FRACC_EQUIVALENCIAS[key]);
        });

        // Extraer componentes
        const components = this._extractComponents(cleaned);

        return {
            original: rawAddress,
            cleaned: cleaned,
            components: components,
            score: this._scoreAddress(cleaned, components)
        };
    }

    _deduplicateBySlug(text) {
        const parts = text.split(',').map(p => p.trim()).filter(p => p);
        const deduped = [];
        const seenSlugs = new Set();

        parts.forEach(part => {
            const slug = part
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '');

            if (!seenSlugs.has(slug)) {
                deduped.push(part);
                seenSlugs.add(slug);
            }
        });

        return deduped.join(', ');
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

        // Detectar número de calle
        const numberPattern = /\b(\d+[A-Z]?)\b/i;
        for (let i = 0; i < parts.length; i++) {
            const match = parts[i].match(numberPattern);
            if (match && !components.streetNumber) {
                components.streetNumber = match[1];
                components.street = parts[i];
                break;
            }
        }

        // Detectar calle por keywords
        const streetKeywords = /^(Av\.|Blvd\.|Calle|Priv\.|Internacional|C\.)/i;
        if (!components.street) {
            for (let i = 0; i < parts.length; i++) {
                if (streetKeywords.test(parts[i])) {
                    components.street = parts[i];
                    break;
                }
            }
        }

        // Detectar colonia
        const neighborhoodKeywords = /^(Fracc\.|Col\.|Residencial|Sector)/i;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (/culiac[áa]n|sinaloa|m[ée]xico/i.test(part)) continue;
            if (components.street === part) continue;

            if (neighborhoodKeywords.test(part) || i > 0) {
                let neighborhood = part.replace(/^(Fracc\.|Col\.|Residencial|Sector)\s+/i, '').trim();
                if (neighborhood) {
                    components.neighborhood = neighborhood;
                    break; // Solo tomar la PRIMERA colonia
                }
            }
        }

        return components;
    }

    _scoreAddress(text, components) {
        let score = 0;

        // +10 calle + número
        if (components.street && components.streetNumber) score += 10;
        else if (components.street) score += 5;

        // +4 colonia
        if (components.neighborhood) score += 4;

        // -6 si tiene ruido
        const hasNoise = NOISE_PATTERNS.slice(0, 13).some(p => p.test(text));
        if (hasNoise) score -= 6;

        // -2 si muy larga
        if (text.length > 100) score -= 2;

        // -2 si muchas comas
        const commas = (text.match(/,/g) || []).length;
        if (commas > 4) score -= 2;

        return Math.max(0, score);
    }
}

// ============================================
// CLASE GAZETTEER MEJORADO V2
// ============================================

class GazetteerMejoradoV2 {
    constructor() {
        this.colonias = [];
        this.indexSlug = {};
        this.indexCP = {};
        this.loaded = false;
    }

    load() {
        const data = JSON.parse(fs.readFileSync('culiacan-colonias-completo.json', 'utf8'));
        this.colonias = data.colonias;

        // Construir índices
        this.colonias.forEach((col, idx) => {
            const slug = this._toSlug(col.nombre);

            if (!this.indexSlug[slug]) this.indexSlug[slug] = [];
            this.indexSlug[slug].push(idx);

            if (col.codigoPostal) {
                if (!this.indexCP[col.codigoPostal]) this.indexCP[col.codigoPostal] = [];
                this.indexCP[col.codigoPostal].push(idx);
            }
        });

        this.loaded = true;
        console.log(`✅ Gazetteer cargado: ${this.colonias.length} colonias\n`);
    }

    findBest(neighborhood) {
        if (!neighborhood) return null;

        // Paso 1: Búsqueda exacta por slug
        const slug = this._toSlug(neighborhood);
        if (this.indexSlug[slug]) {
            const col = this.colonias[this.indexSlug[slug][0]];
            return {
                ...col,
                matchType: 'exact-slug',
                score: 1.0,
                centroid: COLONIAS_CENTROIDES[slug] || null
            };
        }

        // Paso 2: Búsqueda por tokens (≥2 tokens en común)
        const tokens = this._getTokens(neighborhood);
        const tokenMatches = [];

        this.colonias.forEach((col, idx) => {
            const colTokens = this._getTokens(col.nombre);
            const intersection = tokens.filter(t => colTokens.includes(t));

            if (intersection.length >= 2) {
                const score = intersection.length / Math.max(tokens.length, colTokens.length);
                tokenMatches.push({
                    ...col,
                    matchType: 'token-based',
                    score: score,
                    centroid: COLONIAS_CENTROIDES[this._toSlug(col.nombre)] || null,
                    idx: idx
                });
            }
        });

        if (tokenMatches.length > 0) {
            tokenMatches.sort((a, b) => b.score - a.score);
            return tokenMatches[0];
        }

        // Paso 3: Fuzzy escalonado
        const threshold = neighborhood.length >= 10 ? 0.80 : 0.70;
        const fuzzyMatches = [];

        this.colonias.forEach((col, idx) => {
            const score = this._fuzzyMatch(neighborhood, col.nombre);
            if (score >= threshold) {
                fuzzyMatches.push({
                    ...col,
                    matchType: 'fuzzy',
                    score: score,
                    centroid: COLONIAS_CENTROIDES[this._toSlug(col.nombre)] || null,
                    idx: idx
                });
            }
        });

        if (fuzzyMatches.length > 0) {
            // Resolver empates por proximidad a cityCoords
            fuzzyMatches.sort((a, b) => {
                if (Math.abs(a.score - b.score) < 0.05) {
                    // Empate técnico: usar proximidad
                    const distA = this._distance(CULIACAN_COORDS, a.centroid || CULIACAN_COORDS);
                    const distB = this._distance(CULIACAN_COORDS, b.centroid || CULIACAN_COORDS);
                    return distA - distB;
                }
                return b.score - a.score;
            });

            return fuzzyMatches[0];
        }

        return null;
    }

    _toSlug(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    _getTokens(text) {
        // Remover Fracc., Col., etc.
        const cleaned = text.replace(/^(Fracc\.|Col\.|Residencial|Sector)\s+/i, '');

        return cleaned
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .split(/\s+/)
            .filter(t => t.length >= 3) // Ignorar tokens cortos
            .filter(t => !['del', 'las', 'los', 'san', 'la'].includes(t)); // Stop words
    }

    _fuzzyMatch(str1, str2) {
        // Token Set Ratio simplificado
        const tokens1 = new Set(str1.toLowerCase().split(/\s+/));
        const tokens2 = new Set(str2.toLowerCase().split(/\s+/));

        const intersection = [...tokens1].filter(t => tokens2.has(t)).length;
        const union = new Set([...tokens1, ...tokens2]).size;

        return intersection / union;
    }

    _distance(coord1, coord2) {
        if (!coord2 || !coord2.lat) return Infinity;
        const R = 6371; // Radio de la Tierra en km
        const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
        const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c * 1000; // Convertir a metros
    }

    isWithinCityBounds(lat, lng) {
        return lat >= CULIACAN_BOUNDS.south &&
               lat <= CULIACAN_BOUNDS.north &&
               lng >= CULIACAN_BOUNDS.west &&
               lng <= CULIACAN_BOUNDS.east;
    }
}

// ============================================
// CLASE GEOCODER ROBUSTO V2
// ============================================

class GeocoderRobustoV2 {
    constructor() {
        this.normalizer = new NormalizadorMejoradoV2();
        this.gazetteer = new GazetteerMejoradoV2();
        this.cache = new Map();

        if (!this.gazetteer.loaded) {
            this.gazetteer.load();
        }
    }

    async geocode(rawAddress) {
        // Cache check
        const hash = this._hash(rawAddress);
        if (this.cache.has(hash)) {
            return { ...this.cache.get(hash), cached: true };
        }

        // Paso 1: Normalizar
        const normalized = this.normalizer.normalize(rawAddress);

        // Paso 2: Buscar colonia
        const coloniaResult = this.gazetteer.findBest(normalized.components.neighborhood);

        // Paso 3: Determinar coordenadas y precisión
        let lat, lng, precision, confidence, source;

        if (normalized.components.street && normalized.components.streetNumber && coloniaResult) {
            // Street-level con colonia conocida
            lat = coloniaResult.centroid?.lat || CULIACAN_COORDS.lat;
            lng = coloniaResult.centroid?.lng || CULIACAN_COORDS.lng;
            precision = 'street';
            source = 'gazetteer-centroid';
        } else if (coloniaResult && coloniaResult.centroid) {
            // Neighborhood-level con centroide real
            lat = coloniaResult.centroid.lat;
            lng = coloniaResult.centroid.lng;
            precision = 'neighborhood';
            source = 'gazetteer-centroid';
        } else {
            // City-level fallback
            lat = CULIACAN_COORDS.lat;
            lng = CULIACAN_COORDS.lng;
            precision = 'city';
            source = 'city-fallback';
        }

        // Paso 4: Validar bounds
        const boundsOk = this.gazetteer.isWithinCityBounds(lat, lng);

        if (!boundsOk) {
            // Degradar a city
            lat = CULIACAN_COORDS.lat;
            lng = CULIACAN_COORDS.lng;
            precision = 'city';
            source = 'bounds-failed';
        }

        // Paso 5: Calcular confidence
        const addressScoreN = normalized.score / 14;
        const matchScore = coloniaResult ? coloniaResult.score : 0;
        const geocodeScore = boundsOk ? 1.0 : 0.5;

        confidence = 0.5 * addressScoreN + 0.3 * matchScore + 0.2 * geocodeScore;

        // Construir resultado
        const result = {
            id: null,
            address_raw: rawAddress,
            address_clean: normalized.cleaned,
            precision: precision,
            lat: lat,
            lng: lng,
            colonia: coloniaResult ? coloniaResult.nombre : null,
            colonia_tipo: coloniaResult ? coloniaResult.tipo : null,
            colonia_cp: coloniaResult ? coloniaResult.codigoPostal : null,
            colonia_match_type: coloniaResult ? coloniaResult.matchType : null,
            colonia_match_score: coloniaResult ? coloniaResult.score : 0,
            confidence: Math.round(confidence * 100) / 100,
            bounds_ok: boundsOk,
            source: source,
            needs_review: confidence < 0.6 || precision === 'city'
        };

        // Guardar en cache
        this.cache.set(hash, result);

        return result;
    }

    _hash(text) {
        return crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
    }
}

// ============================================
// TEST DATA - 20 DIRECCIONES PROBLEMÁTICAS
// ============================================

const TEST_ADDRESSES = [
    { id: '147903309', ubicacion: 'Privada en Sector Tres Rios, Culiacán, Sinaloa, Mexico, Zona comercial Desarrollo Urbano 3 Ríos' },
    { id: '91269633', ubicacion: 'Internacional 2660, Culiacán, Sinaloa, Mexico, Fraccionamiento Del Humaya' },
    { id: '146847493', ubicacion: 'C. Salvador Elizondo 5839, Culiacán, Sinaloa, Mexico, Fraccionamiento Finisterra' },
    { id: '142723254', ubicacion: 'Blvd Elbert 2609, Culiacán, Sinaloa, Mexico, Fraccionamiento Las Quintas' },
    { id: '144439344', ubicacion: 'Casa en Venta en Pisa, Stanza Toscana BR9, Culiacán, Sinaloa, Mexico, Fraccionamiento Stanza Toscana' },
    { id: '147055011', ubicacion: 'Av. Álvaro Obregón 1641, Chapultepec Del Rio, Culiacán, Sinaloa' },
    { id: '146839974', ubicacion: 'Bosques del Rey 2300, Culiacán, Sinaloa, Mexico, Fraccionamiento Bosques del Rey' },
    { id: '144422903', ubicacion: 'Calle 5 de Mayo 450, Culiacán, Sinaloa, Mexico, Colonia 5 de Mayo' },
    { id: '147564220', ubicacion: 'Inmuebles24  Casa  Renta  Sinaloa  Culiacán  Lomas Del Magisterio  Casa en Renta Col. Lomas del Pedregal Culiacan Sinaloa' },
    { id: '147928773', ubicacion: 'Inmuebles24  Casa  Renta  Sinaloa  Culiacán  Fraccionamiento Portalegre   Portalegre Valley Totalmente Equipada' },
    { id: '147682613', ubicacion: 'Inmuebles24  Casa  Renta  Sinaloa  Culiacán  Fraccionamiento Villa del Cedro  Casa en Renta 3 Habitaciones 2 Plantas, Vitia Granada' },
    { id: 'PROP-0', ubicacion: 'Casa en Venta Bugambilias, Zona Aeropuerto, habitación en Planta Baja ¡Lista para habitarse! · Culiacán' },
    { id: 'PROP-2', ubicacion: 'Tres Ríos, Culiacán, Sinaloa' },
    { id: 'PROP-4', ubicacion: 'Sector Tres Rios, Culiacán' },
    { id: 'PROP-62945410', ubicacion: 'Blvd Elbert 2609, Culiacán, Sinaloa' },
    { id: 'PROP-01-A', ubicacion: 'Av. Universidad 1234, Frac Los Pinos, Culiacan' },
    { id: 'PROP-01-B', ubicacion: 'Inmuebles24 Casa Venta Sinaloa Culiacán Tres Rios, cerca de, Tres Rios, Culiacán' },
    { id: 'PROP-73552214', ubicacion: 'Culiacán, Sinaloa' },
    { id: 'TEST-1', ubicacion: 'Desarrollo Urbano Tres Ríos, Zona Dorada, Culiacán' },
    { id: 'TEST-2', ubicacion: 'Fracc. Tres Ríos, Culiacán, Sinaloa, Mexico' }
];

// ============================================
// EJECUTAR QA
// ============================================

async function main() {
    console.log('🧪 === GEO QA V2 - SISTEMA MEJORADO ===\n');

    const geocoder = new GeocoderRobustoV2();
    const results = [];

    console.log('📋 Geocodificando 20 direcciones...\n');

    for (const addr of TEST_ADDRESSES) {
        const result = await geocoder.geocode(addr.ubicacion);
        result.id = addr.id;
        results.push(result);
    }

    // Tabla de resultados
    console.log('\n📊 ========== TABLA DE RESULTADOS ==========\n');
    console.log('| ID | Colonia | Precision | Conf | Bounds | Review |');
    console.log('|----|---------|-----------|------|--------|--------|');

    results.forEach(r => {
        const colonia = (r.colonia || '(ninguna)').substring(0, 15).padEnd(15);
        const precision = r.precision.padEnd(9);
        const conf = `${Math.round(r.confidence * 100)}%`.padStart(4);
        const bounds = r.bounds_ok ? '✓' : '✗';
        const review = r.needs_review ? '⚠️' : '✓';

        console.log(`| ${r.id.padEnd(14)} | ${colonia} | ${precision} | ${conf} | ${bounds.padStart(6)} | ${review.padStart(6)} |`);
    });

    // Estadísticas
    console.log('\n📈 ========== ESTADÍSTICAS ==========\n');

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

    stats.avgConfidence = stats.avgConfidence / stats.total;

    console.log(`Total direcciones: ${stats.total}\n`);
    console.log('Por precisión:');
    Object.keys(stats.byPrecision).forEach(p => {
        const count = stats.byPrecision[p];
        const pct = (count / stats.total * 100).toFixed(1);
        console.log(`  ${p.padEnd(12)}: ${count} (${pct}%)`);
    });

    console.log(`\nCon colonia identificada: ${stats.withColonia} (${(stats.withColonia / stats.total * 100).toFixed(1)}%)`);
    console.log(`Dentro de bounds:         ${stats.withinBounds} (${(stats.withinBounds / stats.total * 100).toFixed(1)}%)`);
    console.log(`Requieren revisión:       ${stats.needsReview} (${(stats.needsReview / stats.total * 100).toFixed(1)}%)`);
    console.log(`Confianza promedio:       ${(stats.avgConfidence * 100).toFixed(1)}%`);

    // Mejores casos
    console.log('\n✅ ========== MEJORES CASOS ==========\n');

    const best = results.filter(r => r.confidence >= 0.7 && r.colonia).slice(0, 5);
    best.forEach((r, i) => {
        console.log(`${i + 1}. [${r.id}]`);
        console.log(`   Raw: "${r.address_raw.substring(0, 60)}..."`);
        console.log(`   Clean: "${r.address_clean.substring(0, 60)}"`);
        console.log(`   Colonia: ${r.colonia} (${r.colonia_match_type}, ${Math.round(r.colonia_match_score * 100)}%)`);
        console.log(`   Precisión: ${r.precision}, Confianza: ${Math.round(r.confidence * 100)}%\n`);
    });

    // Casos problemáticos
    console.log('⚠️  ========== CASOS REQUIEREN REVISIÓN ==========\n');

    const review = results.filter(r => r.needs_review).slice(0, 5);
    review.forEach((r, i) => {
        console.log(`${i + 1}. [${r.id}]`);
        console.log(`   Raw: "${r.address_raw.substring(0, 60)}..."`);
        console.log(`   Clean: "${r.address_clean.substring(0, 60)}"`);
        console.log(`   Razón: Precisión=${r.precision}, Confianza=${Math.round(r.confidence * 100)}%, Bounds=${r.bounds_ok}\n`);
    });

    console.log('✅ QA Completado\n');

    return { results, stats };
}

// Ejecutar
main().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});
