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
    municipalitiesWithDatasetError: new Set(), // Evitar notificaciones repetidas
    _listenerAttached: false,

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

        // Restaurar marcadores guardados
        this.restoreSavedMarkers();

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

            // Configurar listener de evento autocompleteDataLoaded
            if (!this._listenerAttached) {
                document.addEventListener('autocompleteDataLoaded', (evt) => {
                    const { municipality, coloniasCount } = evt.detail;
                    console.log('ℹ️ autocompleteDataLoaded', evt.detail);
                    if (coloniasCount === 0 && !this.municipalitiesWithDatasetError.has(municipality)) {
                        this.municipalitiesWithDatasetError.add(municipality);
                        this.showNotification('No se pudieron cargar las colonias. Revisa la ruta de datos.', 'error');
                    }
                });
                this._listenerAttached = true;
            }

            // Validar que se cargaron las colonias (chequeo inmediato)
            if (Autocomplete.colonias.length === 0) {
                console.error('❌ No se cargaron colonias para', this.currentMunicipality);
                if (!this.municipalitiesWithDatasetError.has(this.currentMunicipality)) {
                    this.municipalitiesWithDatasetError.add(this.currentMunicipality);
                    this.showNotification('No se pudieron cargar las colonias. Revisa la ruta de datos.', 'error');
                }
            }
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

        // State change - populate municipalities
        const stateSelect = document.getElementById('state');
        if (stateSelect) {
            stateSelect.addEventListener('change', (e) => {
                const state = e.target.value;
                console.log(`🏛️ Estado cambiado a: ${state}`);
                this.populateMunicipalities(state);
            });

            // Populate municipalities on load
            const initialState = stateSelect.value || 'sinaloa';
            this.populateMunicipalities(initialState);
        }

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

                // Validar que se cargaron las colonias
                if (Autocomplete.colonias.length === 0) {
                    console.error('❌ No se cargaron colonias para', newMunicipality);
                    if (!this.municipalitiesWithDatasetError.has(newMunicipality)) {
                        this.municipalitiesWithDatasetError.add(newMunicipality);
                        this.showNotification('No se pudieron cargar las colonias. Revisa la ruta de datos.', 'error');
                    }
                }
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

        // Escuchar eliminación de marcador desde MarkerManager
        document.addEventListener('markerDeleted', (e) => {
            const { markerId } = e.detail;
            this.removeMarkerFromMap(markerId);
        });

        // Escuchar highlight de marcador desde MarkerManager
        document.addEventListener('highlightMarker', (e) => {
            const { markerId } = e.detail;
            this.highlightMarkerOnMap(markerId);
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
            this.showNotification('Por favor completa los campos requeridos (Colonia y Calle)', 'error');
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

                // ✅ DEEP-LINK: Sincronizar URL después de geocodificación exitosa
                if (typeof DeepLink !== 'undefined' && DeepLink.sync) {
                    DeepLink.sync();
                }

                // ✅ SEARCH HISTORY: Disparar evento para guardar en historial
                document.dispatchEvent(new CustomEvent('geocodingSuccess', {
                    detail: { addressData, result }
                }));

                // Notificación de éxito
                const successMsg = result.approximate
                    ? `Dirección aproximada (sin número exterior) - ${result.service}`
                    : `Ubicación encontrada con ${result.service}`;
                this.showNotification(successMsg, 'success');
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
     * NOTA: El número exterior es opcional - solo requiere colonia y calle
     */
    validateFormData(data) {
        return data.colonia && data.street;
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

        // Crear custom icon 3D con SVG (naranja llamativo)
        const customIcon = L.divIcon({
            className: 'property-marker-3d',
            html: `
                <div class="marker-circle">
                    <svg class="marker-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                </div>
                <div class="marker-shadow"></div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            popupAnchor: [0, -24]
        });

        // Agregar nuevo marcador (DRAGGABLE para reverse geocoding)
        this.marker = L.marker([lat, lng], {
            icon: customIcon,
            draggable: true // ✅ Hacer marcador arrastrable
        }).addTo(this.map);

        // Popup con información
        const popupContent = this.createPopupContent(addressData, lat, lng);
        this.marker.bindPopup(popupContent).openPopup();

        // ✅ EVENTO DRAGEND: Reverse geocoding cuando se mueve el marcador
        this.marker.on('dragend', async (event) => {
            const newPos = event.target.getLatLng();
            console.log('🔄 Marcador movido a:', newPos.lat, newPos.lng);

            // Mostrar loading en el panel de resultados
            this.showNotification('Obteniendo dirección de nuevas coordenadas...', 'warning');

            try {
                // ✅ Llamar al nuevo método reverseGeocode() con cache + abort
                const reverseResult = await Geocoding.reverseGeocode(newPos.lat, newPos.lng);

                if (reverseResult && !reverseResult.aborted) {
                    console.log('✅ Reverse geocoding exitoso:', reverseResult);

                    // Actualizar panel de resultados con nueva dirección
                    this.showReverseResults(reverseResult);

                    // Actualizar popup del marcador
                    const reversePopup = `
                        <div class="custom-popup">
                            <h3><i class="fas fa-search-location"></i> Ubicación Actualizada</h3>
                            <p><strong>Dirección encontrada:</strong><br>${reverseResult.formattedAddress}</p>
                            <p><strong>Coordenadas:</strong><br>${reverseResult.latitude.toFixed(6)}, ${reverseResult.longitude.toFixed(6)}</p>
                            ${reverseResult._fromCache ? '<p class="text-green-600 text-xs">⚡ Desde caché</p>' : ''}
                        </div>
                    `;
                    this.marker.bindPopup(reversePopup).openPopup();

                    this.showNotification('Dirección actualizada correctamente', 'success');
                } else if (reverseResult && reverseResult.aborted) {
                    console.log('🚫 Reverse geocoding cancelado por nuevo movimiento');
                } else {
                    console.warn('⚠️ No se pudo obtener dirección de las coordenadas');
                    this.showNotification('No se pudo obtener la dirección de estas coordenadas', 'error');
                }
            } catch (error) {
                console.error('❌ Error en reverse geocoding:', error);
                this.showNotification('Error al obtener dirección', 'error');
            }

            // ✅ DEEP-LINK: Sincronizar URL después de mover marcador
            if (typeof DeepLink !== 'undefined' && DeepLink.sync) {
                DeepLink.sync();
            }
        });

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
        // Construir dirección mostrando solo datos disponibles
        let addressLine = addressData.street;
        if (addressData.number && addressData.number.trim()) {
            addressLine += ` ${addressData.number}`;
        }
        addressLine += `, ${addressData.colonia}`;

        return `
            <div class="custom-popup">
                <h3><i class="fas fa-map-marker-alt"></i> Ubicación Encontrada</h3>
                <p><strong>Dirección:</strong><br>${addressLine}</p>
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

        // Mostrar/ocultar advertencia de ubicación aproximada
        const approximateWarning = document.getElementById('approximate-warning');
        if (approximateWarning) {
            if (result.approximate) {
                approximateWarning.style.display = 'block';
            } else {
                approximateWarning.style.display = 'none';
            }
        }

        // Actualizar link de Google Maps
        const mapsLink = document.getElementById('open-in-maps');
        mapsLink.href = `https://www.google.com/maps?q=${result.latitude},${result.longitude}`;

        // Actualizar información de negociación desde el marcador guardado
        this.updateNegotiationInfo(result.latitude, result.longitude);

        // Mostrar panel
        resultsPanel.style.display = 'block';

        // Scroll suave al panel de resultados
        setTimeout(() => {
            resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    },

    /**
     * Mostrar resultados de reverse geocoding en el panel
     */
    showReverseResults(result) {
        const resultsPanel = document.getElementById('results-panel');

        // Actualizar valores con datos de reverse geocoding
        document.getElementById('result-address').textContent = result.formattedAddress;
        document.getElementById('result-lat').textContent = result.latitude.toFixed(6);
        document.getElementById('result-lng').textContent = result.longitude.toFixed(6);
        document.getElementById('result-zip').textContent = result.postalCode || 'No disponible';
        document.getElementById('result-accuracy').textContent = result.accuracy || 'Reverse Geocoding';
        document.getElementById('result-service').textContent = result.service || 'Nominatim (Reverse)';

        // Ocultar advertencia de ubicación aproximada para reverse geocoding
        const approximateWarning = document.getElementById('approximate-warning');
        if (approximateWarning) {
            approximateWarning.style.display = 'none';
        }

        // Actualizar link de Google Maps
        const mapsLink = document.getElementById('open-in-maps');
        mapsLink.href = `https://www.google.com/maps?q=${result.latitude},${result.longitude}`;

        // Mostrar badge de caché si aplica
        if (result._fromCache) {
            console.log('⚡ Mostrando resultado desde caché');
        }

        // Actualizar información de negociación desde el marcador guardado
        this.updateNegotiationInfo(result.latitude, result.longitude);

        // Mostrar panel (ya debería estar visible)
        resultsPanel.style.display = 'block';
    },

    /**
     * Actualizar información de negociación en la tarjeta de resultados
     */
    updateNegotiationInfo(lat, lng) {
        // Buscar marcador guardado con estas coordenadas
        if (typeof MarkerManager === 'undefined') {
            console.warn('⚠️ MarkerManager no disponible');
            return;
        }

        const markers = MarkerManager.getAllMarkers();
        let foundMarker = null;

        // Buscar marcador que coincida con las coordenadas (con tolerancia pequeña)
        for (const [id, markerData] of Object.entries(markers)) {
            const latDiff = Math.abs(markerData.lat - lat);
            const lngDiff = Math.abs(markerData.lng - lng);

            if (latDiff < 0.00001 && lngDiff < 0.00001) {
                foundMarker = markerData;
                break;
            }
        }

        const negotiationSection = document.getElementById('result-negotiation-section');
        const contactContainer = document.getElementById('result-contact-container');
        const estimatedValueContainer = document.getElementById('result-estimated-value-container');
        const offerContainer = document.getElementById('result-offer-container');
        const tagContainer = document.getElementById('result-tag-container');

        // Si no hay marcador guardado, ocultar toda la sección
        if (!foundMarker) {
            if (negotiationSection) negotiationSection.style.display = 'none';
            return;
        }

        // Formatear moneda
        const formatCurrency = (amount) => {
            if (!amount) return '';
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 0
            }).format(amount);
        };

        let hasData = false;

        // Actualizar contacto
        if (foundMarker.contact) {
            document.getElementById('result-contact').textContent = foundMarker.contact;
            contactContainer.style.display = 'block';
            hasData = true;
        } else {
            contactContainer.style.display = 'none';
        }

        // Actualizar valor estimado
        if (foundMarker.estimatedValue) {
            document.getElementById('result-estimated-value').textContent = formatCurrency(foundMarker.estimatedValue);
            estimatedValueContainer.style.display = 'block';
            hasData = true;
        } else {
            estimatedValueContainer.style.display = 'none';
        }

        // Actualizar oferta
        if (foundMarker.offerAmount) {
            document.getElementById('result-offer').textContent = formatCurrency(foundMarker.offerAmount);
            offerContainer.style.display = 'block';
            hasData = true;
        } else {
            offerContainer.style.display = 'none';
        }

        // Actualizar etiqueta
        if (foundMarker.tag) {
            const tagInfo = MarkerManager.getTagByValue(foundMarker.tag);
            if (tagInfo) {
                const tagBadge = document.getElementById('result-tag-badge');
                tagBadge.textContent = tagInfo.label;
                tagBadge.style.backgroundColor = tagInfo.bgColor;
                tagBadge.style.color = tagInfo.color;
                tagContainer.style.display = 'block';
                hasData = true;
            } else {
                tagContainer.style.display = 'none';
            }
        } else {
            tagContainer.style.display = 'none';
        }

        // Mostrar u ocultar sección completa según si hay datos
        if (negotiationSection) {
            negotiationSection.style.display = hasData ? 'block' : 'none';
        }
    },

    /**
     * Popular municipios según el estado seleccionado
     */
    populateMunicipalities(state) {
        const municipalitySelect = document.getElementById('municipality');

        if (!municipalitySelect) {
            console.warn('⚠️ Select de municipio no encontrado');
            return;
        }

        // Definir municipios por estado
        const municipalitiesByState = {
            'sinaloa': [
                { value: 'culiacan', label: 'Culiacán' },
                { value: 'los-mochis', label: 'Los Mochis' },
                { value: 'mazatlan', label: 'Mazatlán' }
            ],
            'nuevo-leon': [
                { value: 'garcia', label: 'García' },
                { value: 'monterrey', label: 'Monterrey' }
            ]
        };

        // Obtener municipios del estado
        const municipalities = municipalitiesByState[state] || [];

        // Limpiar opciones actuales
        municipalitySelect.innerHTML = '<option value="">Selecciona un municipio</option>';

        // Agregar nuevas opciones
        municipalities.forEach((mun, index) => {
            const option = document.createElement('option');
            option.value = mun.value;
            option.textContent = mun.label;

            // Seleccionar el primero por default
            if (index === 0) {
                option.selected = true;
            }

            municipalitySelect.appendChild(option);
        });

        // Habilitar el select
        municipalitySelect.disabled = false;

        // Trigger change event en el primer municipio
        if (municipalities.length > 0) {
            this.currentMunicipality = municipalities[0].value;
            municipalitySelect.dispatchEvent(new Event('change'));
        }

        console.log(`✅ Municipios poblados para ${state}:`, municipalities.map(m => m.label).join(', '));
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
    },

    /**
     * Restaurar marcadores guardados desde localStorage
     */
    restoreSavedMarkers() {
        console.log('🔄 Restaurando marcadores guardados...');

        // Obtener marcadores desde MarkerManager
        if (typeof MarkerManager === 'undefined') {
            console.warn('⚠️ MarkerManager no disponible, no se pueden restaurar marcadores');
            return;
        }

        const savedMarkers = MarkerManager.getAllMarkers();
        const markersToRestore = Object.entries(savedMarkers)
            .filter(([id, data]) => data.keepMarker !== false)
            .map(([id, data]) => ({ id, ...data }));

        if (markersToRestore.length === 0) {
            console.log('ℹ️ No hay marcadores guardados para restaurar');
            return;
        }

        console.log(`📍 Restaurando ${markersToRestore.length} marcador(es)...`);

        // Restaurar cada marcador
        markersToRestore.forEach((markerData, index) => {
            setTimeout(() => {
                this.addSavedMarker(markerData);
            }, index * 100); // Pequeño delay entre marcadores para animación
        });
    },

    /**
     * Agregar un marcador guardado al mapa
     */
    addSavedMarker(markerData) {
        const { lat, lng, address, tag, id, contact, estimatedValue, offerAmount } = markerData;

        console.log(`📌 Agregando marcador: ${address.substring(0, 40)}...`);

        // Obtener información de la etiqueta
        let tagInfo = null;
        if (tag && typeof MarkerManager !== 'undefined') {
            tagInfo = MarkerManager.getTagByValue(tag);
        }

        // Crear marcador con icono personalizado
        const markerIcon = L.divIcon({
            className: 'saved-property-marker',
            html: `
                <div class="saved-marker-container">
                    <div class="saved-marker-circle" style="background: linear-gradient(135deg, ${tagInfo ? tagInfo.color : '#6366f1'} 0%, ${tagInfo ? tagInfo.color : '#4f46e5'} 100%);">
                        <i class="fas fa-home" style="color: white; font-size: 14px;"></i>
                    </div>
                    ${tagInfo && tagInfo.value ? `
                        <div class="saved-marker-badge" style="background-color: ${tagInfo.bgColor}; color: ${tagInfo.color};">
                            ${tagInfo.label}
                        </div>
                    ` : ''}
                </div>
            `,
            iconSize: [40, tagInfo && tagInfo.value ? 70 : 40],
            iconAnchor: [20, tagInfo && tagInfo.value ? 70 : 40],
            popupAnchor: [0, tagInfo && tagInfo.value ? -70 : -40]
        });

        // Crear marcador
        const marker = L.marker([lat, lng], {
            icon: markerIcon,
            title: address
        }).addTo(this.map);

        // Generar sección de datos de negociación
        let negotiationHTML = '';
        if (contact || estimatedValue || offerAmount) {
            const formatCurrency = (amount) => {
                if (!amount) return '';
                return new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0
                }).format(amount);
            };

            negotiationHTML = `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                    <div style="font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 6px;">
                        <i class="fas fa-handshake"></i> Información de Negociación
                    </div>
                    ${contact ? `
                        <p style="margin: 4px 0; font-size: 12px; color: #374151;">
                            <i class="fas fa-user" style="color: #8b5cf6; margin-right: 4px; width: 14px;"></i>
                            <strong>${contact}</strong>
                        </p>
                    ` : ''}
                    ${estimatedValue ? `
                        <p style="margin: 4px 0; font-size: 12px; color: #374151;">
                            <i class="fas fa-dollar-sign" style="color: #10b981; margin-right: 4px; width: 14px;"></i>
                            Valor: <strong>${formatCurrency(estimatedValue)}</strong>
                        </p>
                    ` : ''}
                    ${offerAmount ? `
                        <p style="margin: 4px 0; font-size: 12px; color: #374151;">
                            <i class="fas fa-hand-holding-dollar" style="color: #3b82f6; margin-right: 4px; width: 14px;"></i>
                            Oferta: <strong>${formatCurrency(offerAmount)}</strong>
                        </p>
                    ` : ''}
                </div>
            `;
        }

        // Crear popup con información
        const popupContent = `
            <div style="min-width: 220px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <i class="fas fa-map-marker-alt" style="color: ${tagInfo ? tagInfo.color : '#6366f1'};"></i>
                    <strong style="font-size: 14px;">Propiedad Guardada</strong>
                </div>
                ${tagInfo && tagInfo.value ? `
                    <div style="margin-bottom: 8px;">
                        <span style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background-color: ${tagInfo.bgColor}; color: ${tagInfo.color};">
                            <i class="fas fa-tag" style="font-size: 9px;"></i> ${tagInfo.label}
                        </span>
                    </div>
                ` : ''}
                <p style="margin: 8px 0; font-size: 13px; color: #374151;">
                    <i class="fas fa-location-dot" style="color: #9ca3af; margin-right: 4px;"></i>
                    ${address}
                </p>
                <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
                    <i class="fas fa-crosshairs" style="color: #9ca3af; margin-right: 4px;"></i>
                    ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </p>
                ${negotiationHTML}
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                    <button onclick="GeocodingMapApp.jumpToMarker(${lat}, ${lng})" style="width: 100%; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        <i class="fas fa-crosshairs"></i> Centrar aquí
                    </button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);

        // Guardar referencia
        if (!this.savedMarkers) {
            this.savedMarkers = [];
        }
        this.savedMarkers.push({
            marker: marker,
            data: markerData
        });

        console.log(`✅ Marcador agregado: ${address.substring(0, 30)}...`);
    },

    /**
     * Saltar a un marcador específico
     */
    jumpToMarker(lat, lng) {
        this.map.setView([lat, lng], 18, {
            animate: true,
            duration: 1
        });
        console.log(`🎯 Saltando a marcador: ${lat}, ${lng}`);
    },

    /**
     * Eliminar marcador del mapa
     */
    removeMarkerFromMap(markerId) {
        if (!this.savedMarkers) return;

        const index = this.savedMarkers.findIndex(m => m.data.id === markerId);
        if (index !== -1) {
            const savedMarker = this.savedMarkers[index];
            this.map.removeLayer(savedMarker.marker);
            this.savedMarkers.splice(index, 1);
            console.log(`🗑️ Marcador eliminado del mapa: ${markerId}`);
        }
    },

    /**
     * Highlight temporal de un marcador
     */
    highlightMarkerOnMap(markerId) {
        if (!this.savedMarkers) return;

        const savedMarker = this.savedMarkers.find(m => m.data.id === markerId);
        if (savedMarker) {
            // Abrir popup
            savedMarker.marker.openPopup();

            // Efecto de pulse temporal
            const element = savedMarker.marker.getElement();
            if (element) {
                element.style.animation = 'pulse 1s ease-in-out 3';
                setTimeout(() => {
                    element.style.animation = '';
                }, 3000);
            }

            console.log(`✨ Destacando marcador: ${markerId}`);
        }
    },

    /**
     * Refrescar todos los marcadores guardados (después de editar)
     */
    refreshSavedMarkers() {
        console.log('🔄 Refrescando marcadores guardados...');

        // Remover todos los marcadores actuales del mapa
        if (this.savedMarkers && this.savedMarkers.length > 0) {
            this.savedMarkers.forEach(({marker}) => {
                this.map.removeLayer(marker);
            });
            this.savedMarkers = [];
        }

        // Restaurar marcadores con datos actualizados
        this.restoreSavedMarkers();
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    GeocodingMapApp.init();
});

// Exportar para uso global
window.GeocodingMapApp = GeocodingMapApp;
