/**
 * Normalizador de Direcciones para Culiacán
 *
 * Módulo que limpia y normaliza direcciones scrapeadas de Inmuebles24,
 * eliminando ruido y extrayendo componentes útiles para geocodificación.
 *
 * @module geo-address-normalizer
 * @author Claude Code
 * @date 2025-10-22
 */

const { gazetteer } = require('./geo-gazetteer-culiacan');

// ============================================
// PATRONES DE LIMPIEZA
// ============================================

// Palabras/frases de ruido que se eliminan (ordenados, case-insensitive)
const NOISE_PATTERNS = [
    // Patrones principales de ruido
    /\b(casa|departamento|depa|local|terreno)\s+(en\s+)?(venta|renta)\b/gi,
    /\bsinaloa\s+culiac[aá]n\b/gi,
    /\b(zona|area|área)\s+(comercial|residencial|industrial)\b/gi,
    /\bdesarrollo\s+urbano\b/gi,
    /\bzona\s+dorada\b/gi,

    // Patrones de ubicación relativa
    /\ba\s+un\s+costado\s+de\b/gi,
    /\bfrente\s+a\b/gi,
    /\bentre\b/gi,
    /\bpor\b/gi,
    /\bcerca\s+de\b/gi,
    /\batr[aá]s\s+de\b/gi,

    // Patrones legacy (mantener compatibilidad)
    /privada\s+en\s+/gi,
    /casa\s+en\s+(venta|renta)\s+en\s+/gi,
    /inmuebles24\s*/gi,

    // Limpieza de formato
    /\s+,\s+/g,  // Comas con espacios extra
    /,\s*,+/g,   // Comas duplicadas
    /^\s*,\s*/,  // Coma al inicio
    /\s*,\s*$/   // Coma al final
];

// Abreviaturas comunes
const ABBREVIATIONS = {
    'avenida': 'Av.',
    'av.': 'Av.',
    'av': 'Av.',
    'boulevard': 'Blvd.',
    'blvd.': 'Blvd.',
    'blvd': 'Blvd.',
    'calle': 'Calle',
    'c.': 'Calle',
    'c': 'Calle',
    'fraccionamiento': 'Fracc.',
    'fracc.': 'Fracc.',
    'fracc': 'Fracc.',
    'colonia': 'Col.',
    'col.': 'Col.',
    'col': 'Col.',
    'privada': 'Priv.',
    'priv.': 'Priv.',
    'priv': 'Priv.',
    'prolongación': 'Prol.',
    'prol.': 'Prol.',
    'prol': 'Prol.'
};

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Clase AddressNormalizer
 */
class AddressNormalizer {
    constructor() {
        this.gazetteer = gazetteer;
    }

    /**
     * Normaliza una dirección completa
     * @param {string} rawAddress - Dirección cruda desde scraper
     * @returns {object} Dirección normalizada con componentes
     */
    normalize(rawAddress) {
        if (!rawAddress || typeof rawAddress !== 'string') {
            return this._emptyResult();
        }

        console.log(`\n🔧 Normalizando: "${rawAddress}"`);

        // PARCHE: Colapsar puntos repetidos (anti "Fracc..")
        rawAddress = rawAddress.replace(/\.{2,}/g, '.');

        const steps = {
            original: rawAddress,
            afterNoise: this._removeNoise(rawAddress),
            afterDedup: '',
            afterAbbrev: '',
            components: null,
            variations: []
        };

        // Paso 1: Eliminar ruido
        steps.afterDedup = this._deduplicateTokens(steps.afterNoise);

        // Paso 2: Normalizar abreviaturas
        steps.afterAbbrev = this._normalizeAbbreviations(steps.afterDedup);

        // Paso 3: Extraer componentes
        steps.components = this._extractComponents(steps.afterAbbrev);

        // Paso 4: Construir variaciones según componentes disponibles
        steps.variations = this._buildVariations(steps.components);

        console.log(`   ✅ Dirección limpia: "${steps.afterAbbrev}"`);
        console.log(`   📍 Colonia detectada: "${steps.components.neighborhood || '(ninguna)'}"`);
        console.log(`   🏠 Calle: "${steps.components.street || '(ninguna)'}"`);
        console.log(`   🔢 Número: "${steps.components.streetNumber || '(ninguno)'}"`);

        return {
            original: steps.original,
            cleaned: steps.afterAbbrev,
            components: steps.components,
            variations: steps.variations,
            precision: this._determinePrecision(steps.components)
        };
    }

    /**
     * Elimina patrones de ruido
     */
    _removeNoise(text) {
        let cleaned = text;

        NOISE_PATTERNS.forEach(pattern => {
            cleaned = cleaned.replace(pattern, ' ');
        });

        // Limpiar espacios múltiples
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
    }

    /**
     * Deduplica tokens/palabras repetidas usando slugs
     */
    _deduplicateTokens(text) {
        // Dividir por comas
        const parts = text.split(',').map(p => p.trim()).filter(p => p);

        // Eliminar duplicados usando slug (normalización NFD)
        const deduped = [];
        const seenSlugs = new Set();

        parts.forEach(part => {
            // Generar slug: lowercase, sin acentos, sin espacios
            const slug = part
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
                .replace(/\s+/g, '');

            if (!seenSlugs.has(slug)) {
                deduped.push(part);
                seenSlugs.add(slug);
            }
        });

        // Si solo quedó 1 parte y es "Culiacán" o similar, mantener formato mínimo
        if (deduped.length === 1 && /^culiac[aá]n$/i.test(deduped[0])) {
            return 'Culiacán, Sinaloa';
        }

        return deduped.join(', ');
    }

    /**
     * Normaliza abreviaturas comunes
     */
    _normalizeAbbreviations(text) {
        let normalized = text;

        const entries = Object.entries(ABBREVIATIONS)
            .sort((a, b) => b[0].length - a[0].length);

        entries.forEach(([key, replacement]) => {
            const escapedKey = escapeRegex(key);
            const needsDotGuard = !key.includes('.');
            const pattern = needsDotGuard
                ? new RegExp(`\\b${escapedKey}\\b(?!\\.)`, 'gi')
                : new RegExp(`\\b${escapedKey}\\b`, 'gi');

            normalized = normalized.replace(pattern, () => replacement);
        });

        // Colapsar puntos repetidos generados por abreviaciones
        normalized = normalized.replace(/\.{2,}/g, '.');

        return normalized;
    }

    /**
     * Extrae componentes de la dirección
     */
    _extractComponents(text) {
        const components = {
            street: null,
            streetNumber: null,
            neighborhood: null,
            city: 'Culiacán',
            state: 'Sinaloa',
            country: 'México',
            postalCode: null
        };

        const parts = text.split(',').map(p => p.trim()).filter(p => p);

        // Detectar número de calle (primero que tenga dígitos)
        const numberPattern = /\b(\d+[A-Z]?)\b/i;
        let streetPart = null;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const numberMatch = part.match(numberPattern);

            if (numberMatch && !streetPart) {
                components.streetNumber = numberMatch[1];
                components.street = part;
                streetPart = i;
                break;
            }
        }

        // Detectar calle (si tiene palabras de vía)
        const streetKeywords = /^(Av\.|Blvd\.|Calle|Priv\.|Prol\.|Internacional)/i;
        if (!streetPart) {
            for (let i = 0; i < parts.length; i++) {
                if (streetKeywords.test(parts[i])) {
                    components.street = parts[i];
                    streetPart = i;
                    break;
                }
            }
        }

        // Detectar colonia/fraccionamiento
        const neighborhoodKeywords = /^(Fracc\.|Col\.|Fraccionamiento|Colonia|Residencial)/i;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            // Saltar si es la parte de calle
            if (i === streetPart) continue;

            // Saltar si es claramente ciudad/estado/país
            if (/culiac[áa]n|sinaloa|m[ée]xico/i.test(part)) {
                if (/culiac[áa]n/i.test(part)) components.city = 'Culiacán';
                if (/sinaloa/i.test(part)) components.state = 'Sinaloa';
                if (/m[ée]xico/i.test(part)) components.country = 'México';
                continue;
            }

            // Detectar colonia
            if (neighborhoodKeywords.test(part) || (!components.neighborhood && i > 0)) {
                // Limpiar prefijos comunes (MEJORADO)
                let neighborhood = part
                    .replace(/^(Fracc\.|Col\.|Fraccionamiento|Colonia|Residencial)\s+/i, '')
                    .replace(/^(Casa|Departamento|Depa|Local|Terreno)\s+(en|de)\s+/i, '')
                    .replace(/^(en|de)\s+/i, '')
                    .trim();

                if (neighborhood) {
                    components.neighborhood = neighborhood;
                }
            }
        }

        // Si no se detectó colonia, intentar con todo el texto
        if (!components.neighborhood && parts.length > 0) {
            // Usar la primera parte que no sea calle
            for (let i = 0; i < parts.length; i++) {
                if (i !== streetPart && !/(culiac[áa]n|sinaloa|m[ée]xico)/i.test(parts[i])) {
                    let cleaned = parts[i]
                        .replace(/^(Fracc\.|Col\.|Fraccionamiento|Colonia|Residencial)\s+/i, '')
                        .replace(/^(Casa|Departamento|Depa|Local|Terreno)\s+(en|de)\s+/i, '')
                        .replace(/^(en|de)\s+/i, '')
                        .trim();

                    if (cleaned) {
                        components.neighborhood = cleaned;
                        break;
                    }
                }
            }
        }

        return components;
    }

    /**
     * Construye variaciones de dirección según componentes
     */
    _buildVariations(components) {
        const variations = [];

        // Variación 1: Dirección completa (street-level)
        if (components.street && components.streetNumber && components.neighborhood) {
            variations.push({
                type: 'street',
                address: `${components.street}, ${components.neighborhood}, ${components.city}, ${components.state}, ${components.country}`,
                confidence: 1.0
            });
        }

        // Variación 2: Calle sin número (street-level degradado)
        if (components.street && components.neighborhood) {
            variations.push({
                type: 'street_no_number',
                address: `${components.street}, ${components.neighborhood}, ${components.city}, ${components.state}, ${components.country}`,
                confidence: 0.8
            });
        }

        // Variación 3: Solo colonia (neighborhood-level)
        if (components.neighborhood) {
            variations.push({
                type: 'neighborhood',
                address: `${components.neighborhood}, ${components.city}, ${components.state}, ${components.country}`,
                confidence: 0.6
            });
        }

        // Variación 4: Solo ciudad (city-level fallback)
        variations.push({
            type: 'city',
            address: `${components.city}, ${components.state}, ${components.country}`,
            confidence: 0.3
        });

        return variations;
    }

    /**
     * Determina nivel de precisión esperado
     */
    _determinePrecision(components) {
        if (components.street && components.streetNumber) return 'street';
        if (components.street) return 'street_no_number';
        if (components.neighborhood) return 'neighborhood';
        return 'city';
    }

    /**
     * Resultado vacío
     */
    _emptyResult() {
        return {
            original: '',
            cleaned: '',
            components: {
                street: null,
                streetNumber: null,
                neighborhood: null,
                city: 'Culiacán',
                state: 'Sinaloa',
                country: 'México',
                postalCode: null
            },
            variations: [{
                type: 'city',
                address: 'Culiacán, Sinaloa, México',
                confidence: 0.1
            }],
            precision: 'city'
        };
    }
}

// ============================================
// EXPORTAR INSTANCIA
// ============================================

const normalizer = new AddressNormalizer();

module.exports = {
    normalizer,
    AddressNormalizer
};
