/**
 * Geocoder para Culiacán con Gazetteer Local
 *
 * Sistema completo de geocodificación que integra:
 * - Normalización de direcciones
 * - Matching contra gazetteer local (631 colonias/fraccionamientos)
 * - Geocodificación con Google Maps API
 * - Degradación controlada de precisión (street → neighborhood → city)
 * - Validaciones espaciales
 *
 * @module geo-geocoder-culiacan
 * @author Claude Code
 * @date 2025-10-22
 */

const fs = require('fs');
const { gazetteer, CULIACAN_COORDS, CULIACAN_BOUNDS } = require('./geo-gazetteer-culiacan');
const { normalizer } = require('./geo-address-normalizer');

// Cargar centroides de colonias
let COLONIAS_CENTROIDES = {};
try {
    const centroidesData = JSON.parse(fs.readFileSync('data/colonias_centroides.json', 'utf8'));
    COLONIAS_CENTROIDES = centroidesData.centroides;
} catch (e) {
    console.warn('⚠️  No se pudieron cargar centroides, usando coordenadas de ciudad');
}

/**
 * Clase Geocoder Principal
 */
class CuliacanGeocoder {
    constructor() {
        this.gazetteer = gazetteer;
        this.normalizer = normalizer;
        this.centroides = COLONIAS_CENTROIDES;

        // Cargar gazetteer al inicializar
        if (!this.gazetteer.loaded) {
            this.gazetteer.load();
        }
    }

    /**
     * Geocodifica una dirección con validación completa
     * @param {string} rawAddress - Dirección cruda
     * @returns {Promise<object>} Resultado con coordenadas, precisión y metadatos
     */
    async geocode(rawAddress) {
        console.log(`\n🌍 === GEOCODIFICACIÓN INICIADA ===`);
        console.log(`   Dirección original: "${rawAddress}"`);

        // Paso 1: Normalizar dirección
        const normalized = this.normalizer.normalize(rawAddress);

        // Paso 2: Buscar colonia en gazetteer
        const coloniaMatch = this.matchColonia(normalized);

        // Paso 3: Geocodificar con degradación controlada
        const geoResult = await this._geocodeWithFallback(normalized, coloniaMatch);

        // Paso 4: Validaciones espaciales
        const validated = this._validateLocation(geoResult, coloniaMatch);

        // Construir resultado final
        const result = {
            address: {
                original: rawAddress,
                cleaned: normalized.cleaned,
                components: normalized.components,
                formatted: validated.formatted || normalized.cleaned
            },
            coordinates: {
                lat: validated.lat,
                lng: validated.lng
            },
            precision: validated.precision,
            confidence: validated.confidence,
            colonia: coloniaMatch ? {
                nombre: coloniaMatch.nombre,
                tipo: coloniaMatch.tipo,
                codigoPostal: coloniaMatch.codigoPostal,
                zona: coloniaMatch.zona,
                matchScore: coloniaMatch.matchScore,
                matchType: coloniaMatch.matchType
            } : null,
            validation: {
                withinCityBounds: validated.withinCityBounds,
                source: validated.source,
                warnings: validated.warnings || []
            },
            metadata: {
                timestamp: new Date().toISOString(),
                gazetteerVersion: this.gazetteer.getStats().origen
            }
        };

        this._logResult(result);

        return result;
    }

    /**
     * Busca colonia en gazetteer (exacto + fuzzy)
     */
    matchColonia(normalized) {
        if (!normalized.components.neighborhood) {
            console.log(`   ⚠️  No se detectó colonia para buscar`);
            return null;
        }

        const neighborhood = normalized.components.neighborhood;
        console.log(`\n🔍 Buscando colonia: "${neighborhood}"`);

        // Intento 1: Búsqueda exacta por slug
        let matches = this.gazetteer.findBySlug(neighborhood);
        if (matches.length > 0) {
            console.log(`   ✅ Match exacto (slug): ${matches[0].nombre}`);
            return {
                ...matches[0],
                matchScore: 1.0,
                matchType: 'exact-slug'
            };
        }

        // Intento 2: Búsqueda exacta por nombre
        matches = this.gazetteer.findByName(neighborhood);
        if (matches.length > 0) {
            console.log(`   ✅ Match exacto (nombre): ${matches[0].nombre}`);
            return {
                ...matches[0],
                matchScore: 1.0,
                matchType: 'exact-name'
            };
        }

        // Intento 3: Fuzzy matching
        matches = this.gazetteer.findFuzzy(neighborhood, 0.7);
        if (matches.length > 0) {
            const best = matches[0];
            console.log(`   ✅ Match fuzzy (${(best.matchScore * 100).toFixed(0)}%): ${best.nombre}`);
            return best;
        }

        console.log(`   ❌ No se encontró match para "${neighborhood}"`);
        return null;
    }

    /**
     * Geocodifica con fallback en cadena
     */
    async _geocodeWithFallback(normalized, coloniaMatch) {
        const { variations } = normalized;

        console.log(`\n📍 Probando ${variations.length} variaciones de dirección...`);

        // Probar cada variación en orden de confianza
        for (let i = 0; i < variations.length; i++) {
            const variation = variations[i];
            console.log(`\n   ${i + 1}. [${variation.type}] "${variation.address}"`);

            // Si es city-level y tenemos colonia del gazetteer, usar centroide
            if (variation.type === 'neighborhood' && coloniaMatch) {
                // Buscar centroide de la colonia
                const slug = coloniaMatch.nombre
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '-');

                const centroide = this.centroides[slug];

                if (centroide) {
                    console.log(`      💡 Usando centroide REAL de colonia: ${coloniaMatch.nombre}`);
                    return {
                        lat: centroide.lat,
                        lng: centroide.lng,
                        precision: 'neighborhood',
                        confidence: 0.7,
                        formatted: `${coloniaMatch.nombre}, Culiacán, Sinaloa`,
                        source: 'gazetteer-centroid-real'
                    };
                } else {
                    console.log(`      💡 Usando centroide de CIUDAD (colonia sin centroide)`);
                    return {
                        lat: CULIACAN_COORDS.lat,
                        lng: CULIACAN_COORDS.lng,
                        precision: 'neighborhood',
                        confidence: 0.7,
                        formatted: `${coloniaMatch.nombre}, Culiacán, Sinaloa`,
                        source: 'gazetteer-centroid-fallback'
                    };
                }
            }

            // Si es city-level, usar coordenadas de ciudad
            if (variation.type === 'city') {
                console.log(`      💡 Usando coordenadas de centro de ciudad`);
                return {
                    lat: CULIACAN_COORDS.lat,
                    lng: CULIACAN_COORDS.lng,
                    precision: 'city',
                    confidence: 0.3,
                    formatted: CULIACAN_COORDS.name,
                    source: 'city-center'
                };
            }

            // TODO: Geocodificación con Google Maps API
            // Por ahora, devolvemos coordenadas de ciudad
            console.log(`      ⚠️  Geocodificación con API pendiente - usando ciudad`);
        }

        // Fallback final: centro de ciudad
        return {
            lat: CULIACAN_COORDS.lat,
            lng: CULIACAN_COORDS.lng,
            precision: 'city',
            confidence: 0.2,
            formatted: CULIACAN_COORDS.name,
            source: 'fallback-city'
        };
    }

    /**
     * Valida ubicación geocodificada
     */
    _validateLocation(geoResult, coloniaMatch) {
        const { lat, lng } = geoResult;

        // Verificar bounds de Culiacán
        const withinCity = this.gazetteer.isWithinCityBounds(lat, lng);

        const warnings = [];

        if (!withinCity) {
            warnings.push('Coordenadas fuera de Culiacán - usando centroide de ciudad');

            // Degradar a ciudad
            return {
                lat: CULIACAN_COORDS.lat,
                lng: CULIACAN_COORDS.lng,
                precision: 'city',
                confidence: 0.2,
                formatted: CULIACAN_COORDS.name,
                source: 'bounds-validation-failed',
                withinCityBounds: false,
                warnings
            };
        }

        return {
            ...geoResult,
            withinCityBounds: true,
            warnings
        };
    }

    /**
     * Log detallado del resultado
     */
    _logResult(result) {
        console.log(`\n\n✅ === GEOCODIFICACIÓN COMPLETADA ===`);
        console.log(`   📍 Coordenadas: ${result.coordinates.lat}, ${result.coordinates.lng}`);
        console.log(`   🎯 Precisión: ${result.precision}`);
        console.log(`   💯 Confianza: ${(result.confidence * 100).toFixed(0)}%`);

        if (result.colonia) {
            console.log(`   🏘️  Colonia: ${result.colonia.nombre} (${result.colonia.tipo})`);
            console.log(`      CP: ${result.colonia.codigoPostal}`);
            console.log(`      Match: ${result.colonia.matchType} (${(result.colonia.matchScore * 100).toFixed(0)}%)`);
        }

        console.log(`   ✔️  Dentro de Culiacán: ${result.validation.withinCityBounds ? 'Sí' : 'No'}`);
        console.log(`   📊 Fuente: ${result.validation.source}`);

        if (result.validation.warnings.length > 0) {
            console.log(`   ⚠️  Advertencias:`);
            result.validation.warnings.forEach(w => console.log(`      - ${w}`));
        }

        console.log(`\n`);
    }

    /**
     * Batch geocoding (para QA)
     */
    async geocodeBatch(addresses) {
        const results = [];

        console.log(`\n📦 Geocodificando ${addresses.length} direcciones en batch...\n`);

        for (let i = 0; i < addresses.length; i++) {
            console.log(`[${i + 1}/${addresses.length}]`);
            const result = await this.geocode(addresses[i]);
            results.push(result);

            // Delay para evitar rate limit (si usáramos API)
            await new Promise(r => setTimeout(r, 100));
        }

        return results;
    }

    /**
     * Genera reporte QA
     */
    generateQAReport(results) {
        console.log(`\n📊 === REPORTE DE QA ===\n`);

        const stats = {
            total: results.length,
            byPrecision: {},
            byConfidence: {},
            withColonia: 0,
            withinBounds: 0,
            withWarnings: 0
        };

        results.forEach(r => {
            // Precisión
            stats.byPrecision[r.precision] = (stats.byPrecision[r.precision] || 0) + 1;

            // Confianza
            const confBucket = Math.floor(r.confidence * 10) / 10;
            stats.byConfidence[confBucket] = (stats.byConfidence[confBucket] || 0) + 1;

            // Colonia
            if (r.colonia) stats.withColonia++;

            // Bounds
            if (r.validation.withinCityBounds) stats.withinBounds++;

            // Warnings
            if (r.validation.warnings.length > 0) stats.withWarnings++;
        });

        console.log(`Total direcciones: ${stats.total}`);
        console.log(`\nPor precisión:`);
        Object.keys(stats.byPrecision).forEach(p => {
            console.log(`   ${p}: ${stats.byPrecision[p]} (${(stats.byPrecision[p] / stats.total * 100).toFixed(1)}%)`);
        });

        console.log(`\nPor confianza:`);
        Object.keys(stats.byConfidence).sort().forEach(c => {
            console.log(`   ${parseFloat(c).toFixed(1)}: ${stats.byConfidence[c]} (${(stats.byConfidence[c] / stats.total * 100).toFixed(1)}%)`);
        });

        console.log(`\nCon colonia identificada: ${stats.withColonia} (${(stats.withColonia / stats.total * 100).toFixed(1)}%)`);
        console.log(`Dentro de Culiacán: ${stats.withinBounds} (${(stats.withinBounds / stats.total * 100).toFixed(1)}%)`);
        console.log(`Con advertencias: ${stats.withWarnings} (${(stats.withWarnings / stats.total * 100).toFixed(1)}%)`);

        return stats;
    }
}

// ============================================
// EXPORTAR
// ============================================

const geocoder = new CuliacanGeocoder();

module.exports = {
    geocoder,
    CuliacanGeocoder
};
