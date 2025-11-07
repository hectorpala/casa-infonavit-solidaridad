/**
 * POI-NEARBY.JS - Sistema de Puntos de Interés Cercanos
 * Busca y muestra POIs (escuelas, hospitales, etc.) cerca de una ubicación
 */

console.log('🔵 poi-nearby.js CARGADO');

const POINearby = {
    // Configuración
    DEFAULT_RADIUS: 1000, // 1km en metros

    // Categorías de POI con iconos y colores
    CATEGORIES: {
        school: {
            label: 'Escuelas',
            icon: '🏫',
            color: '#3b82f6', // blue-500
            markerColor: 'blue'
        },
        hospital: {
            label: 'Hospitales',
            icon: '🏥',
            color: '#ef4444', // red-500
            markerColor: 'red'
        },
        supermarket: {
            label: 'Supermercados',
            icon: '🏪',
            color: '#10b981', // emerald-500
            markerColor: 'green'
        },
        bank: {
            label: 'Bancos',
            icon: '🏦',
            color: '#f59e0b', // amber-500
            markerColor: 'orange'
        },
        gas_station: {
            label: 'Gasolineras',
            icon: '⛽',
            color: '#8b5cf6', // violet-500
            markerColor: 'purple'
        },
        restaurant: {
            label: 'Restaurantes',
            icon: '🍽️',
            color: '#ec4899', // pink-500
            markerColor: 'pink'
        }
    },

    // Estado
    currentLocation: null,
    poiMarkers: [],
    poiData: {},

    /**
     * Inicializar el sistema de POIs
     */
    init() {
        console.log('📍 Inicializando sistema de POIs...');

        // Escuchar evento de geocodificación exitosa
        document.addEventListener('geocodingSuccess', (e) => {
            const { result } = e.detail;
            this.loadNearbyPOIs(result.latitude, result.longitude);
        });

        console.log('✅ Sistema de POIs inicializado');
    },

    /**
     * Cargar POIs cercanos para una ubicación
     */
    async loadNearbyPOIs(lat, lng) {
        console.log(`🔍 Buscando POIs cerca de ${lat}, ${lng}...`);

        this.currentLocation = { lat, lng };

        // Limpiar markers anteriores
        this.clearPOIMarkers();

        // Limpiar datos anteriores
        this.poiData = {};

        // Mostrar loading en el panel
        this.showLoadingPanel();

        // Buscar cada categoría de POI
        const categories = Object.keys(this.CATEGORIES);
        const promises = categories.map(type => this.fetchPOIsByType(lat, lng, type));

        try {
            const results = await Promise.all(promises);

            // Procesar resultados
            let totalPOIs = 0;
            results.forEach((data, index) => {
                const type = categories[index];
                if (data && data.results) {
                    this.poiData[type] = data.results;
                    totalPOIs += data.results.length;
                }
            });

            console.log(`✅ Total POIs encontrados: ${totalPOIs}`);

            // Mostrar POIs en el mapa y panel
            this.displayPOIs();

        } catch (error) {
            console.error('❌ Error cargando POIs:', error);
            this.showErrorPanel();
        }
    },

    /**
     * Buscar POIs por tipo usando Netlify Function
     */
    async fetchPOIsByType(lat, lng, type) {
        try {
            // Detectar si estamos en localhost
            const isLocalhost = window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1';

            if (isLocalhost) {
                console.log(`⚠️ Localhost - Simulando POIs para tipo: ${type}`);
                return this.getMockPOIs(type);
            }

            // Llamar a Netlify Function
            const response = await fetch('/.netlify/functions/places-nearby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lat,
                    lng,
                    radius: this.DEFAULT_RADIUS,
                    type
                })
            });

            if (!response.ok) {
                console.warn(`⚠️ Error en POI ${type}:`, response.status);
                return { results: [] };
            }

            const data = await response.json();
            console.log(`  ✓ ${type}: ${data.count} encontrados`);
            return data;

        } catch (error) {
            console.error(`❌ Error fetching ${type}:`, error);
            return { results: [] };
        }
    },

    /**
     * Mock data para localhost
     */
    getMockPOIs(type) {
        const mockData = {
            school: [
                { name: 'Escuela Primaria Benito Juárez', vicinity: 'Calle Principal 123', location: { lat: 24.8095, lng: -107.3945 }, rating: 4.2 },
                { name: 'Colegio La Salle', vicinity: 'Av. Universidad 456', location: { lat: 24.8088, lng: -107.3935 }, rating: 4.5 }
            ],
            hospital: [
                { name: 'Hospital General', vicinity: 'Blvd. Madero 789', location: { lat: 24.8100, lng: -107.3950 }, rating: 4.0 }
            ],
            supermarket: [
                { name: 'Soriana', vicinity: 'Av. Obregón 321', location: { lat: 24.8085, lng: -107.3930 }, rating: 4.3 },
                { name: 'Walmart', vicinity: 'Blvd. Clouthier 654', location: { lat: 24.8105, lng: -107.3955 }, rating: 4.1 }
            ]
        };

        return {
            success: true,
            status: 'OK',
            count: mockData[type]?.length || 0,
            results: mockData[type] || []
        };
    },

    /**
     * Mostrar POIs en el mapa y panel
     */
    displayPOIs() {
        const panel = document.getElementById('poi-panel');
        if (!panel) {
            console.warn('⚠️ Panel de POIs no encontrado');
            return;
        }

        // Contar total de POIs
        const totalPOIs = Object.values(this.poiData).reduce((sum, pois) => sum + pois.length, 0);

        if (totalPOIs === 0) {
            panel.innerHTML = this.renderEmptyPanel();
            panel.style.display = 'block';
            return;
        }

        // Renderizar panel
        panel.innerHTML = this.renderPOIPanel();
        panel.style.display = 'block';

        // Agregar markers al mapa
        this.addPOIMarkersToMap();
    },

    /**
     * Renderizar panel de POIs
     */
    renderPOIPanel() {
        const totalPOIs = Object.values(this.poiData).reduce((sum, pois) => sum + pois.length, 0);

        let categoriesHTML = '';

        Object.entries(this.CATEGORIES).forEach(([type, config]) => {
            const pois = this.poiData[type] || [];
            if (pois.length === 0) return;

            categoriesHTML += `
                <div class="poi-category">
                    <div class="poi-category-header">
                        <span class="poi-icon">${config.icon}</span>
                        <h4 class="poi-category-title">${config.label}</h4>
                        <span class="poi-count">${pois.length}</span>
                    </div>
                    <div class="poi-list">
                        ${pois.slice(0, 5).map(poi => this.renderPOIItem(poi, config)).join('')}
                    </div>
                </div>
            `;
        });

        return `
            <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div class="bg-gradient-to-r from-emerald-50 to-emerald-100/50 px-6 py-4 border-b border-emerald-200">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-neutral-900">
                            <i class="fas fa-map-marked-alt text-emerald-600 mr-2"></i>
                            Lugares Cercanos
                        </h3>
                        <span class="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                            ${totalPOIs} encontrados
                        </span>
                    </div>
                    <p class="text-xs text-neutral-600 mt-1">Radio de búsqueda: 1 km</p>
                </div>

                <div class="p-6 space-y-4 max-h-96 overflow-y-auto">
                    ${categoriesHTML}
                </div>
            </div>
        `;
    },

    /**
     * Renderizar item individual de POI
     */
    renderPOIItem(poi, config) {
        const distance = this.calculateDistance(
            this.currentLocation.lat,
            this.currentLocation.lng,
            poi.location.lat,
            poi.location.lng
        );

        const ratingHTML = poi.rating
            ? `<span class="text-xs text-amber-500">★ ${poi.rating.toFixed(1)}</span>`
            : '';

        return `
            <div class="poi-item">
                <div class="flex items-start gap-3">
                    <div class="poi-marker-icon" style="background-color: ${config.color}20; color: ${config.color};">
                        ${config.icon}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-neutral-900 truncate">${this.escapeHtml(poi.name)}</p>
                        <p class="text-xs text-neutral-600 truncate">${this.escapeHtml(poi.vicinity || '')}</p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-neutral-500">${distance}</span>
                            ${ratingHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Renderizar panel vacío
     */
    renderEmptyPanel() {
        return `
            <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div class="bg-gradient-to-r from-neutral-50 to-neutral-100/50 px-6 py-4 border-b border-neutral-200">
                    <h3 class="text-lg font-semibold text-neutral-900">
                        <i class="fas fa-map-marked-alt text-neutral-600 mr-2"></i>
                        Lugares Cercanos
                    </h3>
                </div>
                <div class="p-8 text-center">
                    <i class="fas fa-search text-neutral-300 text-4xl mb-3"></i>
                    <p class="text-sm text-neutral-500">No se encontraron lugares cercanos</p>
                </div>
            </div>
        `;
    },

    /**
     * Mostrar panel de loading
     */
    showLoadingPanel() {
        const panel = document.getElementById('poi-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div class="bg-gradient-to-r from-indigo-50 to-indigo-100/50 px-6 py-4 border-b border-indigo-200">
                    <h3 class="text-lg font-semibold text-neutral-900">
                        <i class="fas fa-map-marked-alt text-indigo-600 mr-2"></i>
                        Lugares Cercanos
                    </h3>
                </div>
                <div class="p-8 text-center">
                    <div class="inline-block h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                    <p class="text-sm text-neutral-600">Buscando lugares cercanos...</p>
                </div>
            </div>
        `;
        panel.style.display = 'block';
    },

    /**
     * Mostrar panel de error
     */
    showErrorPanel() {
        const panel = document.getElementById('poi-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div class="p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-3"></i>
                    <p class="text-sm text-neutral-600">Error al cargar lugares cercanos</p>
                </div>
            </div>
        `;
        panel.style.display = 'block';
    },

    /**
     * Agregar markers de POIs al mapa
     */
    addPOIMarkersToMap() {
        if (typeof GeocodingMapApp === 'undefined' || !GeocodingMapApp.map) {
            console.warn('⚠️ Mapa no disponible');
            return;
        }

        const map = GeocodingMapApp.map;

        // Agregar marker para cada POI
        Object.entries(this.CATEGORIES).forEach(([type, config]) => {
            const pois = this.poiData[type] || [];

            pois.forEach(poi => {
                // Crear icono personalizado
                const icon = L.divIcon({
                    className: 'poi-custom-marker',
                    html: `<div style="background-color: ${config.color}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${config.icon}</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                    popupAnchor: [0, -16]
                });

                // Crear marker
                const marker = L.marker([poi.location.lat, poi.location.lng], { icon })
                    .addTo(map);

                // Popup con información
                const popupContent = `
                    <div style="min-width: 200px;">
                        <h4 style="margin: 0 0 8px 0; font-weight: 600;">${config.icon} ${this.escapeHtml(poi.name)}</h4>
                        <p style="margin: 0 0 4px 0; font-size: 0.875rem; color: #666;">${this.escapeHtml(poi.vicinity || '')}</p>
                        ${poi.rating ? `<p style="margin: 0; font-size: 0.875rem; color: #f59e0b;">★ ${poi.rating.toFixed(1)}</p>` : ''}
                    </div>
                `;
                marker.bindPopup(popupContent);

                this.poiMarkers.push(marker);
            });
        });

        console.log(`✅ ${this.poiMarkers.length} markers de POI agregados al mapa`);
    },

    /**
     * Limpiar markers de POIs del mapa
     */
    clearPOIMarkers() {
        if (typeof GeocodingMapApp === 'undefined' || !GeocodingMapApp.map) {
            return;
        }

        const map = GeocodingMapApp.map;

        this.poiMarkers.forEach(marker => {
            map.removeLayer(marker);
        });

        this.poiMarkers = [];
        console.log('🧹 Markers de POI limpiados');
    },

    /**
     * Calcular distancia entre dos coordenadas (fórmula Haversine)
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Formatear distancia
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        } else {
            return `${distance.toFixed(1)}km`;
        }
    },

    /**
     * Convertir grados a radianes
     */
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    /**
     * Escape HTML para prevenir XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Exportar para uso global
window.POINearby = POINearby;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => POINearby.init());
} else {
    POINearby.init();
}
