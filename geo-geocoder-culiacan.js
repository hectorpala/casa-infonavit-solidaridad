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
const https = require('https');
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
        this.googleMapsKey = process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_API_KEY || null;

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
    async geocode(rawAddress, options = {}) {
        const mergedOptions = { ...options };
        if (!mergedOptions.googleMapsKey && this.googleMapsKey) {
            mergedOptions.googleMapsKey = this.googleMapsKey;
        }

        console.log(`\n🌍 === GEOCODIFICACIÓN INICIADA ===`);
        console.log(`   Dirección original: "${rawAddress}"`);

        // Paso 1: Normalizar dirección
        const normalized = this.normalizer.normalize(rawAddress);

        // Paso 2: Buscar colonia en gazetteer
        const coloniaMatch = this.matchColonia(normalized);

        // Paso 3: Geocodificar con degradación controlada
        const geoResult = await this._geocodeWithFallback(normalized, coloniaMatch, mergedOptions);

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
    async _geocodeWithFallback(normalized, coloniaMatch, options = {}) {
        const { variations } = normalized;
        const fallbackCoords = options.fallbackCoordinates &&
            typeof options.fallbackCoordinates.lat === 'number' &&
            typeof options.fallbackCoordinates.lng === 'number'
            ? options.fallbackCoordinates
            : null;
        const apiKey = options.googleMapsKey || this.googleMapsKey || null;
        const attemptedGoogleAddresses = new Set();

        console.log(`\n📍 Probando ${variations.length} variaciones de dirección...`);

        // Probar cada variación en orden de confianza
        for (let i = 0; i < variations.length; i++) {
            const variation = variations[i];
            console.log(`\n   ${i + 1}. [${variation.type}] "${variation.address}"`);

            if (fallbackCoords && (variation.type === 'street' || variation.type === 'street_no_number')) {
                const precision = variation.type === 'street' ? 'street' : 'street';
                const confidence = variation.type === 'street' ? 0.85 : 0.75;
                console.log(`      💡 Usando coordenadas embebidas de la página (street-level)`);
                return {
                    lat: fallbackCoords.lat,
                    lng: fallbackCoords.lng,
                    precision,
                    confidence,
                    formatted: variation.address,
                    source: 'page-embedded-coords'
                };
            }

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
                    if (fallbackCoords) {
                        console.log(`      💡 Sin centroide, usando coordenadas embebidas de la página`);
                        return {
                            lat: fallbackCoords.lat,
                            lng: fallbackCoords.lng,
                            precision: 'neighborhood',
                            confidence: 0.7,
                            formatted: `${coloniaMatch.nombre}, Culiacán, Sinaloa`,
                            source: 'page-embedded-coords'
                        };
                    }
                    if (apiKey && !attemptedGoogleAddresses.has(variation.address)) {
                        attemptedGoogleAddresses.add(variation.address);
                        const googleNeighborhood = await this._geocodeWithGoogle(variation.address, apiKey);
                        if (googleNeighborhood) {
                            return googleNeighborhood;
                        }
                    }
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
                if (fallbackCoords) {
                    console.log(`      💡 Variación city, reforzando con coordenadas embebidas`);
                    return {
                        lat: fallbackCoords.lat,
                        lng: fallbackCoords.lng,
                        precision: 'neighborhood',
                        confidence: 0.6,
                        formatted: variation.address,
                        source: 'page-embedded-coords'
                    };
                }
                if (apiKey && !attemptedGoogleAddresses.has(variation.address)) {
                    attemptedGoogleAddresses.add(variation.address);
                    const googleCity = await this._geocodeWithGoogle(variation.address, apiKey);
                    if (googleCity) {
                        return googleCity;
                    }
                }
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

            if (apiKey && !attemptedGoogleAddresses.has(variation.address)) {
                attemptedGoogleAddresses.add(variation.address);
                const googleResult = await this._geocodeWithGoogle(variation.address, apiKey);
                if (googleResult) {
                    return googleResult;
                }
            }

            // Sin solución específica: continuar al siguiente fallback
            console.log(`      ⚠️  Geocodificación interna no disponible para esta variación`);
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
    async geocodeBatch(addresses, options = {}) {
        const results = [];

        console.log(`\n📦 Geocodificando ${addresses.length} direcciones en batch...\n`);

        for (let i = 0; i < addresses.length; i++) {
            console.log(`[${i + 1}/${addresses.length}]`);
            const result = await this.geocode(addresses[i], options);
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

    /**
     * Configura la API key de Google Maps para geocodificación externa
     * @param {string} key
     */
    setGoogleMapsKey(key) {
        if (typeof key === 'string' && key.trim()) {
            this.googleMapsKey = key.trim();
        }
    }

    /**
     * Llama a Google Maps Geocoding API para obtener coordenadas precisas
     * @param {string} address
     * @param {string} apiKey
     * @returns {Promise<object|null>}
     */
    async _geocodeWithGoogle(address, apiKey) {
        if (!apiKey) return null;
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=es&region=mx`;
            console.log(`      🌐 Consultando Google Geocoding API...`);
            const response = await this._fetchJson(url);

            if (!response || response.status !== 'OK' || !Array.isArray(response.results) || response.results.length === 0) {
                console.log(`      ⚠️  Google Geocoding sin resultados (status: ${response?.status || 'desconocido'})`);
                return null;
            }

            const best = response.results[0];
            if (!best.geometry || !best.geometry.location) {
                console.log('      ⚠️  Google Geocoding sin geometry.location');
                return null;
            }

            const { lat, lng } = best.geometry.location;
            if (typeof lat !== 'number' || typeof lng !== 'number') {
                console.log('      ⚠️  Coordenadas inválidas desde Google Geocoding');
                return null;
            }

            const types = best.types || [];
            let precision = 'city';
            let confidence = 0.6;

            if (types.includes('street_address') || types.includes('premise') || types.includes('subpremise')) {
                precision = 'street';
                confidence = 0.9;
            } else if (types.includes('route')) {
                precision = 'street';
                confidence = 0.85;
            } else if (types.includes('neighborhood') || types.includes('sublocality') || types.includes('postal_code')) {
                precision = 'neighborhood';
                confidence = 0.75;
            } else if (types.includes('administrative_area_level_2') || types.includes('locality')) {
                precision = 'city';
                confidence = 0.6;
            }

            console.log(`      ✅ Google Geocoding OK: ${lat}, ${lng} (${precision})`);

            return {
                lat,
                lng,
                precision,
                confidence,
                formatted: best.formatted_address || address,
                source: 'google-maps-geocoding'
            };
        } catch (error) {
            console.warn(`      ⚠️  Error en Google Geocoding API: ${error.message}`);
            return null;
        }
    }

    /**
     * Helper para realizar peticiones HTTPS y devolver JSON
     * @param {string} url
     * @returns {Promise<any>}
     */
    _fetchJson(url) {
        return new Promise((resolve, reject) => {
            https.get(url, res => {
                let rawData = '';

                res.on('data', chunk => {
                    rawData += chunk;
                });

                res.on('end', () => {
                    try {
                        resolve(JSON.parse(rawData));
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
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
