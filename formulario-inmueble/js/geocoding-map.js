/**
 * GEOCODING-MAP.JS - Sistema de Geocodificación con Mapa Interactivo
 * Página dedicada para obtener coordenadas de direcciones con visualización en mapa
 */

const GeocodingMapApp = {
    // Estado de la aplicación
    map: null,
    marker: null,
    currentMunicipality: 'culiacan',
    currentResult: null,
    autocompleteColonia: null,
    autocompleteCalle: null,

    /**
     * Inicializar la aplicación
     */
    async init() {
        console.log('🗺️ Inicializando Geocoding Map App...');

        // Inicializar mapa
        this.initMap();

        // Inicializar autocompletes (async)
        await this.initAutocompletes();

        // Event listeners
        this.setupEventListeners();

        console.log('✅ Geocoding Map App inicializado');
    },

    /**
     * Inicializar mapa de Leaflet (OpenStreetMap)
     */
    initMap() {
        console.log('🗺️ Inicializando mapa...');

        // Obtener municipio seleccionado (default: culiacan)
        const municipalitySelect = document.getElementById('municipality');
        const municipality = municipalitySelect && municipalitySelect.value ? municipalitySelect.value : 'culiacan';
        this.currentMunicipality = municipality;
        console.log(`   Municipio inicial: ${this.currentMunicipality}`);

        // Coordenadas por municipio
        const coordsByMunicipality = {
            'culiacan': [24.8091, -107.3940],
            'los-mochis': [25.7934, -108.9962],
            'mazatlan': [23.2494, -106.4111],
            'garcia': [25.8105, -100.5866]
        };

        const initialCoords = coordsByMunicipality[municipality] || coordsByMunicipality['culiacan'];
        const initialZoom = 13;

        // Crear mapa
        this.map = L.map('map').setView(initialCoords, initialZoom);

        // Agregar capa de tiles de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Agregar control de escala
        L.control.scale({
            imperial: false,
            metric: true
        }).addTo(this.map);

        console.log(`✅ Mapa inicializado en ${municipality}`);
    },

    /**
     * Inicializar sistemas de autocomplete
     */
    async initAutocompletes() {
        console.log('🔍 Inicializando autocompletes...');

        // El objeto Autocomplete ya está disponible globalmente desde autocomplete.js
        // Inicializar con el municipio actual
        // Pasamos true para que configure los listeners de estado y municipio
        if (typeof Autocomplete !== 'undefined') {
            await Autocomplete.init(this.currentMunicipality, true);
            console.log(`✅ Autocompletes inicializados para ${this.currentMunicipality}`);
        } else {
            console.error('❌ Autocomplete no está disponible. Verifica que autocomplete.js esté cargado.');
        }
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Form submit
        const form = document.getElementById('geocoding-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGeocode();
        });

        // Clear form
        const clearBtn = document.getElementById('clear-form');
        clearBtn.addEventListener('click', () => this.clearForm());

        // Municipality change
        const municipalitySelect = document.getElementById('municipality');
        municipalitySelect.addEventListener('change', async (e) => {
            const newMunicipality = e.target.value;
            console.log(`🏙️ Municipio cambiado a: ${newMunicipality}`);
            console.log(`   Municipio anterior: ${this.currentMunicipality}`);

            this.currentMunicipality = newMunicipality;
            console.log(`   Llamando updateMapCenter()...`);
            this.updateMapCenter();

            // Recargar datos del autocomplete
            if (typeof Autocomplete !== 'undefined' && Autocomplete.reloadData) {
                console.log(`   Recargando datos de autocomplete para ${newMunicipality}...`);
                await Autocomplete.reloadData(newMunicipality);
            }
        });

        // Copy coordinates button
        const copyBtn = document.getElementById('copy-coords');
        copyBtn.addEventListener('click', () => this.copyCoordinates());

        // Escuchar cambios de municipio desde autocomplete.js
        document.addEventListener('municipalityChanged', (e) => {
            const newMunicipality = e.detail.municipality;
            console.log(`📡 Evento 'municipalityChanged' recibido: ${newMunicipality}`);

            this.currentMunicipality = newMunicipality;
            this.updateMapCenter();
        });
    },

    /**
     * Manejar geocodificación
     */
    async handleGeocode() {
        console.log('🔍 Iniciando geocodificación...');

        // Mostrar loading
        this.showLoading();

        // Obtener datos del formulario
        const addressData = this.getFormData();

        // Validar datos mínimos
        if (!this.validateFormData(addressData)) {
            this.hideLoading();
            this.showNotification('Por favor completa los campos requeridos (Colonia, Calle, Número Exterior)', 'error');
            return;
        }

        try {
            // Geocodificar usando el sistema existente
            const result = await Geocoding.geocodeAddress(addressData);

            if (result) {
                console.log('✅ Geocodificación exitosa:', result);
                this.currentResult = result;

                // Actualizar mapa
                this.updateMap(result.latitude, result.longitude, addressData);

                // Mostrar resultados
                this.showResults(result, addressData);

                // Notificación de éxito
                this.showNotification(`Ubicación encontrada con ${result.service}`, 'success');
            } else {
                console.error('❌ No se pudo geocodificar');
                this.showNotification('No se pudo encontrar la ubicación. Verifica la dirección e intenta nuevamente.', 'error');
            }
        } catch (error) {
            console.error('❌ Error en geocodificación:', error);
            this.showNotification('Error al procesar la dirección. Intenta nuevamente.', 'error');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * Obtener datos del formulario
     */
    getFormData() {
        return {
            street: document.getElementById('address').value.trim(),
            number: document.getElementById('exterior-number').value.trim(),
            interiorNumber: document.getElementById('interior-number').value.trim(),
            colonia: document.getElementById('colonia').value.trim(),
            zipCode: document.getElementById('zip-code').value.trim(),
            state: document.getElementById('state')?.value || 'sinaloa',
            municipality: this.currentMunicipality
        };
    },

    /**
     * Validar datos del formulario
     */
    validateFormData(data) {
        return data.colonia && data.street && data.number;
    },

    /**
     * Actualizar mapa con marcador
     */
    updateMap(lat, lng, addressData) {
        console.log('📍 Actualizando mapa:', lat, lng);

        // Remover marcador anterior si existe
        if (this.marker) {
            this.map.removeLayer(this.marker);
        }

        // Crear custom icon
        const customIcon = L.divIcon({
            className: 'custom-marker-icon',
            html: '<i class="fas fa-map-marker-alt"></i>',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        // Agregar nuevo marcador
        this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);

        // Popup con información
        const popupContent = this.createPopupContent(addressData, lat, lng);
        this.marker.bindPopup(popupContent).openPopup();

        // Centrar y hacer zoom al marcador
        this.map.setView([lat, lng], 17, {
            animate: true,
            duration: 1
        });
    },

    /**
     * Crear contenido del popup
     */
    createPopupContent(addressData, lat, lng) {
        return `
            <div class="custom-popup">
                <h3><i class="fas fa-map-marker-alt"></i> Ubicación Encontrada</h3>
                <p><strong>Dirección:</strong><br>${addressData.street} ${addressData.number}, ${addressData.colonia}</p>
                <p><strong>Coordenadas:</strong><br>${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                ${addressData.zipCode ? `<p><strong>CP:</strong> ${addressData.zipCode}</p>` : ''}
            </div>
        `;
    },

    /**
     * Mostrar resultados en el panel
     */
    showResults(result, addressData) {
        const resultsPanel = document.getElementById('results-panel');

        // Construir dirección completa
        const fullAddress = Geocoding.buildFullAddress(addressData);

        // Actualizar valores
        document.getElementById('result-address').textContent = fullAddress;
        document.getElementById('result-lat').textContent = result.latitude.toFixed(6);
        document.getElementById('result-lng').textContent = result.longitude.toFixed(6);
        document.getElementById('result-zip').textContent = addressData.zipCode || 'No disponible';
        document.getElementById('result-accuracy').textContent = result.accuracy || 'No disponible';
        document.getElementById('result-service').textContent = result.service || 'No disponible';

        // Actualizar link de Google Maps
        const mapsLink = document.getElementById('open-in-maps');
        mapsLink.href = `https://www.google.com/maps?q=${result.latitude},${result.longitude}`;

        // Mostrar panel
        resultsPanel.style.display = 'block';

        // Scroll suave al panel de resultados
        setTimeout(() => {
            resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    },

    /**
     * Actualizar centro del mapa según municipio
     */
    updateMapCenter() {
        console.log(`🗺️ updateMapCenter() llamado para: ${this.currentMunicipality}`);

        const centers = {
            culiacan: [24.8091, -107.3940],
            'los-mochis': [25.7934, -108.9962],
            mazatlan: [23.2494, -106.4111],
            garcia: [25.8105, -100.5866]
        };

        const coords = centers[this.currentMunicipality] || centers.culiacan;
        console.log(`   Coordenadas encontradas: [${coords[0]}, ${coords[1]}]`);
        console.log(`   Objeto mapa existe: ${!!this.map}`);

        if (this.map) {
            this.map.setView(coords, 13, {
                animate: true,
                duration: 1
            });
            console.log(`✅ Mapa actualizado a: ${this.currentMunicipality}`);
        } else {
            console.error('❌ El mapa no está inicializado');
        }
    },

    /**
     * Copiar coordenadas al portapapeles
     */
    async copyCoordinates() {
        if (!this.currentResult) {
            this.showNotification('No hay coordenadas para copiar', 'warning');
            return;
        }

        const coordsText = `${this.currentResult.latitude}, ${this.currentResult.longitude}`;

        try {
            await navigator.clipboard.writeText(coordsText);
            this.showNotification('Coordenadas copiadas al portapapeles', 'success');

            // Efecto visual en el botón
            const btn = document.getElementById('copy-coords');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copiado';
            btn.style.background = '#2A9D8F';

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
            }, 2000);
        } catch (error) {
            console.error('Error al copiar:', error);
            this.showNotification('No se pudo copiar. Copia manualmente las coordenadas.', 'error');
        }
    },

    /**
     * Limpiar formulario y resultados
     */
    clearForm() {
        // Limpiar inputs
        document.getElementById('geocoding-form').reset();
        document.getElementById('colonia-value').value = '';
        document.getElementById('zip-code').value = '';

        // Ocultar resultados
        document.getElementById('results-panel').style.display = 'none';

        // Remover marcador
        if (this.marker) {
            this.map.removeLayer(this.marker);
            this.marker = null;
        }

        // Reset estado
        this.currentResult = null;

        // Volver al centro del municipio
        this.updateMapCenter();

        this.showNotification('Formulario limpiado', 'success');
    },

    /**
     * Mostrar overlay de loading
     */
    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = 'flex';
    },

    /**
     * Ocultar overlay de loading
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = 'none';
    },

    /**
     * Mostrar notificación
     */
    showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };

        notification.innerHTML = `
            <i class="fas ${iconMap[type]}"></i>
            <span class="notification-message">${message}</span>
        `;

        container.appendChild(notification);

        // Auto-remove después de 5 segundos
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                container.removeChild(notification);
            }, 300);
        }, 5000);
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    GeocodingMapApp.init();
});

// Exportar para uso global
window.GeocodingMapApp = GeocodingMapApp;
