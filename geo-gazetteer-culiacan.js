/**
 * Gazetteer de Culiacán - Sistema de Geocodificación con Validación Local
 *
 * Módulo que carga el catálogo oficial de 631 colonias y fraccionamientos de Culiacán
 * y proporciona funciones de búsqueda, normalización y validación para direcciones.
 *
 * @module geo-gazetteer-culiacan
 * @author Claude Code
 * @date 2025-10-22
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN Y CARGA DEL GAZETTEER
// ============================================

const GAZETTEER_PATH = path.join(__dirname, 'culiacan-colonias-completo.json');

// Coordenadas centrales de Culiacán
const CULIACAN_COORDS = {
    lat: 24.8091,
    lng: -107.3940,
    name: 'Culiacán, Sinaloa, México'
};

// Bounding box de Culiacán (aproximadamente 25km de radio)
const CULIACAN_BOUNDS = {
    north: 24.95,   // ~16km norte
    south: 24.67,   // ~16km sur
    east: -107.25,  // ~16km este
    west: -107.54   // ~16km oeste
};

/**
 * Clase Gazetteer - Gestor del catálogo de colonias
 */
class GazetteerCuliacan {
    constructor() {
        this.data = null;
        this.indexBySlug = new Map();
        this.indexByName = new Map();
        this.indexByCP = new Map();
        this.loaded = false;
    }

    /**
     * Carga el gazetteer desde archivo JSON
     */
    load() {
        if (this.loaded) return;

        try {
            const raw = fs.readFileSync(GAZETTEER_PATH, 'utf8');
            this.data = JSON.parse(raw);

            console.log(`📚 Gazetteer cargado: ${this.data.metadata.totalEntradas} entradas`);
            console.log(`   Colonias: ${this.data.metadata.tipos.colonias}`);
            console.log(`   Fraccionamientos: ${this.data.metadata.tipos.fraccionamientos}`);

            this._buildIndexes();
            this.loaded = true;
        } catch (error) {
            console.error('❌ Error cargando gazetteer:', error.message);
            throw error;
        }
    }

    /**
     * Construye índices para búsqueda rápida
     */
    _buildIndexes() {
        this.data.colonias.forEach(colonia => {
            // Slug normalizado (sin acentos, lowercase, sin espacios extras)
            const slug = this._createSlug(colonia.nombre);

            // Índice principal por slug
            if (!this.indexBySlug.has(slug)) {
                this.indexBySlug.set(slug, []);
            }
            this.indexBySlug.get(slug).push(colonia);

            // Índice por nombre original (case-insensitive)
            const nameLower = colonia.nombre.toLowerCase();
            if (!this.indexByName.has(nameLower)) {
                this.indexByName.set(nameLower, []);
            }
            this.indexByName.get(nameLower).push(colonia);

            // Índice por código postal
            if (colonia.codigoPostal) {
                if (!this.indexByCP.has(colonia.codigoPostal)) {
                    this.indexByCP.set(colonia.codigoPostal, []);
                }
                this.indexByCP.get(colonia.codigoPostal).push(colonia);
            }

            // Generar alias/variantes
            const aliases = this._generateAliases(colonia.nombre);
            aliases.forEach(alias => {
                const aliasSlug = this._createSlug(alias);
                if (aliasSlug !== slug) {
                    if (!this.indexBySlug.has(aliasSlug)) {
                        this.indexBySlug.set(aliasSlug, []);
                    }
                    this.indexBySlug.get(aliasSlug).push(colonia);
                }
            });
        });

        console.log(`   Índice por slug: ${this.indexBySlug.size} entradas`);
        console.log(`   Índice por nombre: ${this.indexByName.size} entradas`);
        console.log(`   Índice por CP: ${this.indexByCP.size} códigos postales`);
    }

    /**
     * Crea slug normalizado (sin acentos, lowercase, guiones)
     */
    _createSlug(text) {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
    }

    /**
     * Genera variantes/alias de un nombre
     */
    _generateAliases(nombre) {
        const aliases = [];

        // Sin "Fraccionamiento"
        if (nombre.includes('Fraccionamiento')) {
            aliases.push(nombre.replace(/Fraccionamiento\s+/gi, ''));
            aliases.push(nombre.replace(/Fraccionamiento\s+/gi, 'Fracc. '));
        }

        // Sin "Colonia"
        if (nombre.includes('Colonia')) {
            aliases.push(nombre.replace(/Colonia\s+/gi, ''));
            aliases.push(nombre.replace(/Colonia\s+/gi, 'Col. '));
        }

        // Variantes con/sin acentos
        const sinAcentos = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (sinAcentos !== nombre) {
            aliases.push(sinAcentos);
        }

        // Variantes de "Tres Ríos"
        if (/tres.*r[íi]os/i.test(nombre)) {
            aliases.push(nombre.replace(/Tres Ríos/gi, '3 Ríos'));
            aliases.push(nombre.replace(/Tres Ríos/gi, 'Tres Rios'));
            aliases.push(nombre.replace(/Tres Ríos/gi, 'Sector Tres Ríos'));
            aliases.push(nombre.replace(/Tres Ríos/gi, 'Sector Tres Rios'));
        }

        return aliases;
    }

    /**
     * Búsqueda exacta por slug
     */
    findBySlug(text) {
        const slug = this._createSlug(text);
        return this.indexBySlug.get(slug) || [];
    }

    /**
     * Búsqueda exacta por nombre
     */
    findByName(text) {
        const nameLower = text.toLowerCase();
        return this.indexByName.get(nameLower) || [];
    }

    /**
     * Búsqueda por código postal
     */
    findByCP(cp) {
        return this.indexByCP.get(cp) || [];
    }

    /**
     * Búsqueda fuzzy usando Levenshtein distance simplificada
     */
    findFuzzy(text, threshold = 0.8) {
        const results = [];
        const searchSlug = this._createSlug(text);

        this.data.colonias.forEach(colonia => {
            const coloniaSlug = this._createSlug(colonia.nombre);
            const similarity = this._tokenSetRatio(searchSlug, coloniaSlug);

            if (similarity >= threshold) {
                results.push({
                    ...colonia,
                    matchScore: similarity,
                    matchType: 'fuzzy'
                });
            }
        });

        // Ordenar por score descendente
        results.sort((a, b) => b.matchScore - a.matchScore);

        return results;
    }

    /**
     * Token Set Ratio simplificado (similar a fuzzywuzzy)
     */
    _tokenSetRatio(str1, str2) {
        const tokens1 = new Set(str1.split('-'));
        const tokens2 = new Set(str2.split('-'));

        // Intersección
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));

        // Unión
        const union = new Set([...tokens1, ...tokens2]);

        // Jaccard similarity
        return intersection.size / union.size;
    }

    /**
     * Obtiene estadísticas del gazetteer
     */
    getStats() {
        if (!this.loaded) this.load();

        return {
            total: this.data.metadata.totalEntradas,
            colonias: this.data.metadata.tipos.colonias,
            fraccionamientos: this.data.metadata.tipos.fraccionamientos,
            codigosPostales: this.indexByCP.size,
            origen: this.data.metadata.origen
        };
    }

    /**
     * Obtiene bounding box de Culiacán
     */
    getCityBounds() {
        return CULIACAN_BOUNDS;
    }

    /**
     * Obtiene coordenadas centrales de Culiacán
     */
    getCityCoords() {
        return CULIACAN_COORDS;
    }

    /**
     * Verifica si un punto está dentro de los límites de Culiacán
     */
    isWithinCityBounds(lat, lng) {
        return lat >= CULIACAN_BOUNDS.south &&
               lat <= CULIACAN_BOUNDS.north &&
               lng >= CULIACAN_BOUNDS.west &&
               lng <= CULIACAN_BOUNDS.east;
    }

    /**
     * Calcula distancia entre dos puntos (Haversine)
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this._toRad(lat2 - lat1);
        const dLon = this._toRad(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    }

    _toRad(degrees) {
        return degrees * Math.PI / 180;
    }
}

// ============================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================

const gazetteer = new GazetteerCuliacan();

module.exports = {
    gazetteer,
    CULIACAN_COORDS,
    CULIACAN_BOUNDS
};
