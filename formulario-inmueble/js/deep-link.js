/**
 * DEEP-LINK.JS - Sistema de Deep Linking para Geocoding Map
 * Permite compartir y restaurar ubicaciones mediante URLs con parámetros
 *
 * Features:
 * - Restaurar mapa desde URL (lat, lng, zoom)
 * - Sincronización automática al mover marcador o cambiar zoom
 * - Botón "Copiar enlace" para compartir ubicación
 * - Integración con reverse geocoding para llenar formulario
 * - Validación robusta de coordenadas
 */

const DeepLink = {
    // ============================================
    // CONSTANTES Y CONFIGURACIÓN
    // ============================================

    PARAMS: {
        LAT: 'lat',
        LNG: 'lng',
        ZOOM: 'z'
    },

    // Límites válidos de coordenadas
    BOUNDS: {
        LAT_MIN: -90,
        LAT_MAX: 90,
        LNG_MIN: -180,
        LNG_MAX: 180,
        ZOOM_MIN: 1,
        ZOOM_MAX: 20
    },

    // Estado interno
    _lastURL: '',
    _syncTimeout: null,
    _initialized: false,

    // ============================================
    // VALIDACIÓN
    // ============================================

    /**
     * Validar coordenadas
     */
    isValidCoords(lat, lng) {
        return !isNaN(lat) && !isNaN(lng) &&
               lat >= this.BOUNDS.LAT_MIN && lat <= this.BOUNDS.LAT_MAX &&
               lng >= this.BOUNDS.LNG_MIN && lng <= this.BOUNDS.LNG_MAX;
    },

    /**
     * Validar zoom level
     */
    isValidZoom(zoom) {
        return !isNaN(zoom) &&
               zoom >= this.BOUNDS.ZOOM_MIN && zoom <= this.BOUNDS.ZOOM_MAX;
    },

    // ============================================
    // RESTAURACIÓN DESDE URL
    // ============================================

    /**
     * Parsear parámetros de URL
     */
    parseURLParams() {
        const qs = new URLSearchParams(location.search);

        const lat = parseFloat(qs.get(this.PARAMS.LAT));
        const lng = parseFloat(qs.get(this.PARAMS.LNG));
        const zoom = parseInt(qs.get(this.PARAMS.ZOOM) || '17', 10);

        return { lat, lng, zoom };
    },

    /**
     * Esperar a que el mapa esté inicializado
     */
    async waitForMap() {
        const maxAttempts = 50; // 5 segundos máximo
        let attempts = 0;

        while (!GeocodingMapApp?.map || !GeocodingMapApp?.marker) {
            if (attempts >= maxAttempts) {
                console.error('❌ Timeout esperando inicialización del mapa');
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        return true;
    },

    /**
     * Restaurar ubicación desde URL
     */
    async restore() {
        console.log('🔗 Deep-link: Verificando parámetros en URL...');

        const { lat, lng, zoom } = this.parseURLParams();

        // Validar coordenadas
        if (!this.isValidCoords(lat, lng)) {
            console.log('ℹ️ No hay coordenadas válidas en URL');
            return false;
        }

        console.log('🔗 Coordenadas encontradas en URL:', lat, lng, `(zoom: ${zoom})`);

        // Esperar a que el mapa esté listo
        const mapReady = await this.waitForMap();
        if (!mapReady) {
            console.error('❌ No se pudo esperar al mapa');
            return false;
        }

        // Validar zoom
        const validZoom = this.isValidZoom(zoom) ? zoom : 17;

        console.log('📍 Restaurando marcador en:', lat, lng);

        // Posicionar marcador y mapa
        GeocodingMapApp.marker.setLatLng([lat, lng]);
        GeocodingMapApp.map.setView([lat, lng], validZoom);

        // Mostrar notificación
        GeocodingMapApp.showNotification('Ubicación restaurada desde enlace compartido', 'success');

        // Reverse geocoding para llenar formulario automáticamente
        console.log('🔄 Ejecutando reverse geocoding para llenar formulario...');

        try {
            const result = await Geocoding.reverseGeocode(lat, lng);

            if (result && !result.aborted) {
                console.log('✅ Reverse geocoding exitoso:', result);

                // Actualizar popup del marcador
                const popupContent = `
                    <div class="custom-popup">
                        <h3><i class="fas fa-map-marker-alt"></i> Ubicación Compartida</h3>
                        <p><strong>Dirección:</strong><br>${result.formattedAddress}</p>
                        <p><strong>Coordenadas:</strong><br>${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}</p>
                        ${result._fromCache ? '<p class="text-green-600 text-xs">⚡ Desde caché</p>' : ''}
                    </div>
                `;
                GeocodingMapApp.marker.bindPopup(popupContent).openPopup();

                // Actualizar panel de resultados
                GeocodingMapApp.showReverseResults(result);

            } else {
                console.warn('⚠️ No se pudo obtener dirección de las coordenadas');

                // Al menos mostrar coordenadas en el popup
                const popupContent = `
                    <div class="custom-popup">
                        <h3><i class="fas fa-map-marker-alt"></i> Ubicación Compartida</h3>
                        <p><strong>Coordenadas:</strong><br>${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                    </div>
                `;
                GeocodingMapApp.marker.bindPopup(popupContent).openPopup();
            }
        } catch (error) {
            console.error('❌ Error en reverse geocoding:', error);
        }

        return true;
    },

    // ============================================
    // SINCRONIZACIÓN A URL
    // ============================================

    /**
     * Construir query string desde estado actual
     */
    buildQueryString() {
        if (!GeocodingMapApp?.marker || !GeocodingMapApp?.map) {
            return '';
        }

        const latlng = GeocodingMapApp.marker.getLatLng();
        const zoom = GeocodingMapApp.map.getZoom();

        const params = new URLSearchParams();
        params.set(this.PARAMS.LAT, latlng.lat.toFixed(6));
        params.set(this.PARAMS.LNG, latlng.lng.toFixed(6));
        params.set(this.PARAMS.ZOOM, String(zoom));

        return params.toString();
    },

    /**
     * Sincronizar estado actual a URL (debounced)
     */
    sync() {
        // Limpiar timeout anterior
        if (this._syncTimeout) {
            clearTimeout(this._syncTimeout);
        }

        // Programar sincronización
        this._syncTimeout = setTimeout(() => {
            const queryString = this.buildQueryString();
            if (!queryString) return;

            const newURL = `${location.pathname}?${queryString}`;

            // Solo actualizar si cambió
            if (newURL !== this._lastURL && newURL !== location.href) {
                history.replaceState(null, '', newURL);
                this._lastURL = newURL;
                console.log('🔗 URL actualizada:', queryString);
            }
        }, 500); // Debounce de 500ms
    },

    /**
     * Forzar sincronización inmediata (sin debounce)
     */
    syncNow() {
        if (this._syncTimeout) {
            clearTimeout(this._syncTimeout);
            this._syncTimeout = null;
        }

        const queryString = this.buildQueryString();
        if (!queryString) return;

        const newURL = `${location.pathname}?${queryString}`;

        if (newURL !== this._lastURL) {
            history.replaceState(null, '', newURL);
            this._lastURL = newURL;
            console.log('🔗 URL sincronizada inmediatamente');
        }
    },

    // ============================================
    // COPIAR ENLACE
    // ============================================

    /**
     * Copiar enlace actual al portapapeles
     */
    async copyLink() {
        console.log('📋 Copiando enlace al portapapeles...');

        // Forzar sincronización inmediata
        this.syncNow();

        // Esperar un frame para que la URL se actualice
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            await navigator.clipboard.writeText(location.href);
            console.log('✅ Enlace copiado:', location.href);

            if (GeocodingMapApp?.showNotification) {
                GeocodingMapApp.showNotification('Enlace copiado al portapapeles ✓', 'success');
            }

            return true;
        } catch (error) {
            console.error('❌ Error al copiar al portapapeles:', error);

            // Fallback: prompt para copiar manualmente
            const copied = prompt('Copia este enlace:', location.href);

            if (copied !== null && GeocodingMapApp?.showNotification) {
                GeocodingMapApp.showNotification('Enlace disponible para copiar', 'warning');
            }

            return false;
        }
    },

    // ============================================
    // INICIALIZACIÓN Y EVENT LISTENERS
    // ============================================

    /**
     * Setup event listeners para sincronización automática
     */
    setupEventListeners() {
        console.log('🔗 Configurando event listeners de deep-linking...');

        // Sync al mover marcador (ya tiene evento dragend en geocoding-map.js)
        // Lo haremos mediante el evento dragend existente

        // Sync al cambiar zoom del mapa
        if (GeocodingMapApp?.map) {
            GeocodingMapApp.map.on('zoomend', () => {
                console.log('🔍 Zoom cambiado, sincronizando URL...');
                this.sync();
            });
        }

        // Listener para botón "Copiar enlace" (se agregará al HTML)
        const btnShare = document.getElementById('btn-share-link');
        if (btnShare) {
            btnShare.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyLink();
            });
            console.log('✅ Botón "Copiar enlace" conectado');
        }
    },

    /**
     * Integrar con evento dragend existente
     */
    hookMarkerDragend() {
        if (!GeocodingMapApp?.marker) return;

        // El marcador ya tiene un evento dragend en geocoding-map.js
        // Solo agregamos la sincronización de URL al final
        const originalDragendHandler = GeocodingMapApp.marker._events?.dragend?.[0]?.fn;

        if (originalDragendHandler) {
            // Agregar nuestro handler después del original
            GeocodingMapApp.marker.on('dragend', () => {
                console.log('🔗 Marcador movido, sincronizando URL...');
                this.sync();
            });
        }
    },

    /**
     * Inicializar deep-linking
     */
    async init() {
        if (this._initialized) {
            console.warn('⚠️ Deep-link ya inicializado');
            return;
        }

        console.log('🔗 Inicializando sistema de deep-linking...');

        // Esperar a que GeocodingMapApp esté disponible
        const mapReady = await this.waitForMap();

        if (!mapReady) {
            console.error('❌ No se pudo inicializar deep-linking (mapa no disponible)');
            return;
        }

        // Setup event listeners
        this.setupEventListeners();

        // Hook marker dragend
        this.hookMarkerDragend();

        // Restaurar desde URL si hay parámetros
        const restored = await this.restore();

        if (!restored) {
            console.log('ℹ️ No hay ubicación en URL, esperando geocodificación del usuario');
        }

        this._initialized = true;
        console.log('✅ Deep-linking inicializado correctamente');
    }
};

// Exportar para uso global
window.DeepLink = DeepLink;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Esperar un poco más para que GeocodingMapApp se inicialice primero
        setTimeout(() => DeepLink.init(), 500);
    });
} else {
    // DOM ya está listo
    setTimeout(() => DeepLink.init(), 500);
}
