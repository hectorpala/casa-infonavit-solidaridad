/**
 * MARKER-MANAGER.JS - Sistema de Gestión de Marcadores de Propiedades
 * Permite etiquetar, persistir y eliminar marcadores de propiedades en el mapa
 */

console.log('🔵 marker-manager.js CARGADO');

const MarkerManager = {
    // Configuración
    STORAGE_KEY: 'property_markers',

    // Catálogo de etiquetas (extensible) - Paleta unificada
    TAGS: [
        { value: '', label: 'Sin etiqueta', color: '#64748b', bgColor: '#f1f5f9' },
        { value: 'revision', label: 'En revisión', color: '#ff6a00', bgColor: '#fff7ed' },
        { value: 'compra', label: 'Compra', color: '#10b981', bgColor: '#d1fae5' },
        { value: 'venta', label: 'Venta', color: '#3b82f6', bgColor: '#dbeafe' },
        { value: 'flip', label: 'Posible flip', color: '#a855f7', bgColor: '#f3e8ff' },
        { value: 'descartada', label: 'Descartada', color: '#ef4444', bgColor: '#fee2e2' }
    ],

    // Estado actual
    currentMarker: null,

    /**
     * Formatear número a moneda (solo número con comas, sin símbolo $)
     */
    formatCurrency(value) {
        if (!value) return '';
        // Convertir a número si es string
        const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
        if (isNaN(num)) return '';
        // Formatear con comas (sin símbolo de peso)
        return num.toLocaleString('es-MX', { maximumFractionDigits: 0 });
    },

    /**
     * Parsear moneda formateada a número
     */
    parseCurrency(formattedValue) {
        if (!formattedValue) return null;
        // Remover comas y convertir a número
        const cleaned = formattedValue.replace(/,/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
    },

    /**
     * Inicializar el sistema de gestión de marcadores
     */
    init() {
        console.log('🏷️ Inicializando sistema de gestión de marcadores...');

        // Setup event listeners
        this.setupEventListeners();

        // Setup panel lateral
        this.setupTaggedPanel();

        // Actualizar contador inicial
        this.renderTaggedPropertiesPanel();

        console.log('✅ Sistema de marcadores inicializado');
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Escuchar geocodificación exitosa
        document.addEventListener('geocodingSuccess', (e) => {
            const { addressData, result } = e.detail;
            this.onNewMarker(addressData, result);
        });

        // Event delegation para panel de gestión
        document.addEventListener('click', (e) => {
            // Guardar etiqueta
            if (e.target.closest('#save-marker-tag')) {
                e.preventDefault();
                this.saveMarkerTag();
                return;
            }

            // Eliminar marcador
            if (e.target.closest('#delete-marker')) {
                e.preventDefault();
                this.confirmDeleteMarker();
                return;
            }
        });

        // Escuchar cambio de etiqueta
        document.addEventListener('change', (e) => {
            if (e.target.id === 'marker-tag-select') {
                this.updateTagPreview();
            }
        });
    },

    /**
     * Cuando se crea un nuevo marcador
     */
    onNewMarker(addressData, result) {
        console.log('📍 Nuevo marcador detectado:', result);

        // Generar ID único para el marcador
        const markerId = this.generateMarkerId(result.latitude, result.longitude);

        // Guardar referencia del marcador actual
        this.currentMarker = {
            id: markerId,
            lat: result.latitude,
            lng: result.longitude,
            address: result.formattedAddress,
            addressData: addressData,
            timestamp: Date.now()
        };

        // Cargar datos persistidos si existen
        const savedData = this.getMarkerData(markerId);
        if (savedData) {
            this.currentMarker.tag = savedData.tag;
            this.currentMarker.keepMarker = savedData.keepMarker !== false;
            this.currentMarker.contact = savedData.contact || '';
            this.currentMarker.estimatedValue = savedData.estimatedValue || null;
            this.currentMarker.offerAmount = savedData.offerAmount || null;
        }

        // Mostrar panel de gestión
        this.showManagementPanel();
    },

    /**
     * Generar ID único basado en coordenadas
     */
    generateMarkerId(lat, lng) {
        // Redondear a 6 decimales para evitar duplicados por precisión
        const latKey = lat.toFixed(6);
        const lngKey = lng.toFixed(6);
        return `marker_${latKey}_${lngKey}`;
    },

    /**
     * Obtener datos guardados de un marcador
     */
    getMarkerData(markerId) {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            const markers = stored ? JSON.parse(stored) : {};
            return markers[markerId] || null;
        } catch (error) {
            console.error('❌ Error al cargar datos de marcador:', error);
            return null;
        }
    },

    /**
     * Guardar datos de un marcador
     */
    saveMarkerData(markerId, data) {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            const markers = stored ? JSON.parse(stored) : {};

            markers[markerId] = {
                ...data,
                lastUpdated: Date.now()
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(markers));
            console.log('✅ Datos de marcador guardados:', markerId);
            console.log('📊 Datos guardados:', { contact: data.contact, phone: data.phone, estimatedValue: data.estimatedValue, offerAmount: data.offerAmount });
            return true;
        } catch (error) {
            console.error('❌ Error al guardar datos de marcador:', error);
            return false;
        }
    },

    /**
     * Eliminar datos de un marcador
     */
    deleteMarkerData(markerId) {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            const markers = stored ? JSON.parse(stored) : {};

            delete markers[markerId];

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(markers));
            console.log('✅ Datos de marcador eliminados:', markerId);
            return true;
        } catch (error) {
            console.error('❌ Error al eliminar datos de marcador:', error);
            return false;
        }
    },

    /**
     * Obtener etiqueta por valor
     */
    getTagByValue(value) {
        return this.TAGS.find(tag => tag.value === value) || this.TAGS[0];
    },

    /**
     * Mostrar panel de gestión de marcador
     */
    showManagementPanel() {
        const panel = document.getElementById('marker-management-panel');
        if (!panel) {
            console.warn('⚠️ Panel de gestión no encontrado');
            return;
        }

        // Renderizar panel
        panel.innerHTML = this.renderManagementPanel();
        panel.style.display = 'block';

        // Restaurar valores guardados
        if (this.currentMarker.tag) {
            const select = document.getElementById('marker-tag-select');
            if (select) {
                select.value = this.currentMarker.tag;
                this.updateTagPreview();
            }
        }

        // Checkbox de mantener marcador
        const keepCheckbox = document.getElementById('keep-marker-checkbox');
        if (keepCheckbox && this.currentMarker.keepMarker !== undefined) {
            keepCheckbox.checked = this.currentMarker.keepMarker;
        }

        // Restaurar campos de negociación
        const contactInput = document.getElementById('property-contact');
        const phoneInput = document.getElementById('property-phone');
        const valueInput = document.getElementById('property-value');
        const offerInput = document.getElementById('property-offer');

        if (contactInput && this.currentMarker.contact) {
            contactInput.value = this.currentMarker.contact;
        }
        if (phoneInput && this.currentMarker.phone) {
            phoneInput.value = this.currentMarker.phone;
        }
        if (valueInput && this.currentMarker.estimatedValue) {
            valueInput.value = this.formatCurrency(this.currentMarker.estimatedValue);
        }
        if (offerInput && this.currentMarker.offerAmount) {
            offerInput.value = this.formatCurrency(this.currentMarker.offerAmount);
        }

        // 💰 Agregar event listeners para formatear moneda mientras escribe
        this.setupCurrencyFormatting(valueInput, offerInput);
    },

    /**
     * Configurar formateo automático de campos de moneda
     */
    setupCurrencyFormatting(valueInput, offerInput) {
        const formatInputOnBlur = (input) => {
            if (!input) return;

            input.addEventListener('blur', () => {
                const parsed = this.parseCurrency(input.value);
                if (parsed !== null) {
                    input.value = this.formatCurrency(parsed);
                }
            });

            input.addEventListener('focus', () => {
                // Mantener formateado al hacer focus
            });

            // Permitir solo números y comas mientras escribe
            input.addEventListener('input', (e) => {
                let value = e.target.value;
                // Remover todo excepto números
                value = value.replace(/[^\d]/g, '');
                if (value) {
                    // Formatear con comas mientras escribe
                    const num = parseInt(value, 10);
                    e.target.value = this.formatCurrency(num);
                }
            });
        };

        formatInputOnBlur(valueInput);
        formatInputOnBlur(offerInput);
    },

    /**
     * Ocultar panel de gestión
     */
    hideManagementPanel() {
        const panel = document.getElementById('marker-management-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    },

    /**
     * Renderizar panel de gestión
     */
    renderManagementPanel() {
        const currentTag = this.currentMarker.tag ? this.getTagByValue(this.currentMarker.tag) : this.TAGS[0];

        return `
            <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div class="bg-gradient-to-r from-purple-50 to-purple-100/50 px-6 py-4 border-b border-purple-200">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-neutral-900">
                            <i class="fas fa-tags text-purple-600 mr-2"></i>
                            Gestión de Marcador
                        </h3>
                        <span class="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                            ${this.currentMarker.address.substring(0, 30)}...
                        </span>
                    </div>
                    <p class="text-xs text-neutral-600 mt-1">Asigna una etiqueta y gestiona la persistencia del marcador</p>
                </div>

                <div class="p-6 space-y-4">
                    <!-- Selector de etiqueta -->
                    <div>
                        <label for="marker-tag-select" class="block text-sm font-medium text-neutral-700 mb-2">
                            <i class="fas fa-tag mr-1"></i>
                            Etiqueta de Propiedad
                        </label>
                        <select
                            id="marker-tag-select"
                            class="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                            ${this.TAGS.map(tag => `
                                <option value="${tag.value}" ${tag.value === currentTag.value ? 'selected' : ''}>
                                    ${tag.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Preview de etiqueta -->
                    <div id="tag-preview" class="p-3 rounded-lg" style="background-color: ${currentTag.bgColor};">
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style="background-color: ${currentTag.color}; color: white;">
                                <i class="fas fa-tag mr-1.5"></i>
                                ${currentTag.label}
                            </span>
                            <span class="text-xs text-neutral-600">Vista previa de la etiqueta</span>
                        </div>
                    </div>

                    <!-- Información de Negociación (condicional) -->
                    <div id="negotiation-fields" class="space-y-3" style="display: ${currentTag.value ? 'block' : 'none'};">
                        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                            <h4 class="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                <i class="fas fa-handshake"></i>
                                Información de Negociación
                            </h4>

                            <!-- Nombre del Propietario -->
                            <div class="mb-3">
                                <label for="property-contact" class="block text-xs font-medium text-neutral-700 mb-1.5">
                                    <i class="fas fa-user mr-1"></i>
                                    Nombre del Propietario <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    id="property-contact"
                                    placeholder="Ej: Juan Pérez (dueño), María López (agente)"
                                    value="${this.currentMarker.contact || ''}"
                                    class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                >
                            </div>

                            <!-- Teléfono -->
                            <div class="mb-3">
                                <label for="property-phone" class="block text-xs font-medium text-neutral-700 mb-1.5">
                                    <i class="fas fa-phone mr-1"></i>
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    id="property-phone"
                                    placeholder="Ej: 667 123 4567"
                                    value="${this.currentMarker.phone || ''}"
                                    class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                >
                            </div>

                            <!-- Valor Estimado -->
                            <div class="mb-3">
                                <label for="property-value" class="block text-xs font-medium text-neutral-700 mb-1.5">
                                    <i class="fas fa-dollar-sign mr-1"></i>
                                    Valor Estimado
                                </label>
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">$</span>
                                    <input
                                        type="text"
                                        id="property-value"
                                        placeholder="2,500,000"
                                        value="${this.currentMarker.estimatedValue ? this.formatCurrency(this.currentMarker.estimatedValue) : ''}"
                                        class="w-full rounded-lg border border-neutral-300 pl-8 pr-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    >
                                </div>
                            </div>

                            <!-- Oferta Realizada -->
                            <div>
                                <label for="property-offer" class="block text-xs font-medium text-neutral-700 mb-1.5">
                                    <i class="fas fa-hand-holding-dollar mr-1"></i>
                                    Oferta Realizada
                                </label>
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">$</span>
                                    <input
                                        type="text"
                                        id="property-offer"
                                        placeholder="2,200,000"
                                        value="${this.currentMarker.offerAmount ? this.formatCurrency(this.currentMarker.offerAmount) : ''}"
                                        class="w-full rounded-lg border border-neutral-300 pl-8 pr-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    >
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Opciones de persistencia -->
                    <div class="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                        <div class="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="keep-marker-checkbox"
                                checked
                                class="mt-1 h-4 w-4 rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
                            >
                            <div class="flex-1">
                                <label for="keep-marker-checkbox" class="text-sm font-medium text-neutral-900 cursor-pointer">
                                    Mantener marcador en el mapa
                                </label>
                                <p class="text-xs text-neutral-600 mt-0.5">
                                    Si está marcado, el marcador se restaurará al recargar la página
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Botones de acción -->
                    <div class="flex gap-3 pt-2">
                        <button
                            id="save-marker-tag"
                            class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 active:bg-purple-800 transition-all"
                        >
                            <i class="fas fa-save"></i>
                            Guardar Etiqueta
                        </button>

                        <button
                            id="delete-marker"
                            class="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:bg-red-800 transition-all"
                        >
                            <i class="fas fa-trash-alt"></i>
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Actualizar preview de etiqueta
     */
    updateTagPreview() {
        const select = document.getElementById('marker-tag-select');
        const preview = document.getElementById('tag-preview');
        const negotiationFields = document.getElementById('negotiation-fields');

        if (!select || !preview) return;

        const selectedTag = this.getTagByValue(select.value);

        preview.style.backgroundColor = selectedTag.bgColor;
        preview.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style="background-color: ${selectedTag.color}; color: white;">
                    <i class="fas fa-tag mr-1.5"></i>
                    ${selectedTag.label}
                </span>
                <span class="text-xs text-neutral-600">Vista previa de la etiqueta</span>
            </div>
        `;

        // Mostrar/ocultar campos de negociación según si hay etiqueta seleccionada
        if (negotiationFields) {
            negotiationFields.style.display = selectedTag.value ? 'block' : 'none';
        }
    },

    /**
     * Guardar etiqueta del marcador
     */
    saveMarkerTag() {
        if (!this.currentMarker) {
            console.warn('⚠️ No hay marcador actual');
            return;
        }

        const select = document.getElementById('marker-tag-select');
        const keepCheckbox = document.getElementById('keep-marker-checkbox');
        const contactInput = document.getElementById('property-contact');
        const phoneInput = document.getElementById('property-phone');
        const valueInput = document.getElementById('property-value');
        const offerInput = document.getElementById('property-offer');

        if (!select || !keepCheckbox) {
            console.error('❌ Elementos del formulario no encontrados');
            return;
        }

        const tag = select.value;
        const keepMarker = keepCheckbox.checked;

        // Capturar datos de negociación (solo si hay etiqueta seleccionada)
        let negotiationData = {};
        if (tag) {
            const contactValue = contactInput ? contactInput.value.trim() : '';

            // ⚠️ VALIDACIÓN: Nombre del propietario es OBLIGATORIO si hay etiqueta
            if (!contactValue) {
                alert('⚠️ El campo "Nombre del Propietario" es obligatorio.\n\nPor favor ingresa el nombre antes de guardar.');
                if (contactInput) {
                    contactInput.focus();
                    contactInput.classList.add('border-red-500');
                    setTimeout(() => contactInput.classList.remove('border-red-500'), 2000);
                }
                return;
            }

            negotiationData = {
                contact: contactValue,
                phone: phoneInput ? phoneInput.value.trim() : '',
                estimatedValue: valueInput && valueInput.value ? this.parseCurrency(valueInput.value) : null,
                offerAmount: offerInput && offerInput.value ? this.parseCurrency(offerInput.value) : null
            };
        }

        // Actualizar marcador actual
        this.currentMarker.tag = tag;
        this.currentMarker.keepMarker = keepMarker;
        this.currentMarker.contact = negotiationData.contact;
        this.currentMarker.phone = negotiationData.phone;
        this.currentMarker.estimatedValue = negotiationData.estimatedValue;
        this.currentMarker.offerAmount = negotiationData.offerAmount;

        // Guardar en localStorage
        const success = this.saveMarkerData(this.currentMarker.id, {
            lat: this.currentMarker.lat,
            lng: this.currentMarker.lng,
            address: this.currentMarker.address,
            addressData: this.currentMarker.addressData,
            tag: tag,
            keepMarker: keepMarker,
            contact: negotiationData.contact,
            phone: negotiationData.phone,
            estimatedValue: negotiationData.estimatedValue,
            offerAmount: negotiationData.offerAmount,
            timestamp: this.currentMarker.timestamp
        });

        if (success) {
            // Notificación de éxito
            if (typeof GeocodingMapApp !== 'undefined' && GeocodingMapApp.showNotification) {
                const tagLabel = this.getTagByValue(tag).label;
                GeocodingMapApp.showNotification(
                    `Etiqueta "${tagLabel}" guardada correctamente`,
                    'success'
                );
            }

            // 🔧 ACTUALIZAR MARCADORES EN MAPA
            // Solo refrescar si se marcó "Mantener marcador en el mapa"
            if (keepMarker && typeof GeocodingMapApp !== 'undefined' && GeocodingMapApp.refreshSavedMarkers) {
                // Delay pequeño para asegurar que localStorage se actualizó
                setTimeout(() => {
                    GeocodingMapApp.refreshSavedMarkers();
                }, 50);
            }

            // Disparar evento para que search-history se actualice
            document.dispatchEvent(new CustomEvent('markerTagUpdated', {
                detail: {
                    markerId: this.currentMarker.id,
                    tag: tag,
                    keepMarker: keepMarker,
                    contact: negotiationData.contact,
                    phone: negotiationData.phone,
                    estimatedValue: negotiationData.estimatedValue,
                    offerAmount: negotiationData.offerAmount
                }
            }));
        } else {
            if (typeof GeocodingMapApp !== 'undefined' && GeocodingMapApp.showNotification) {
                GeocodingMapApp.showNotification(
                    'Error al guardar la etiqueta',
                    'error'
                );
            }
        }
    },

    /**
     * Confirmar eliminación de marcador
     */
    confirmDeleteMarker() {
        if (!this.currentMarker) return;

        const confirmed = confirm(
            '¿Estás seguro de que deseas eliminar este marcador?\n\n' +
            'Esta acción eliminará:\n' +
            '• El marcador del mapa\n' +
            '• La etiqueta guardada\n' +
            '• Los datos de persistencia\n\n' +
            'No podrás recuperar esta información.'
        );

        if (confirmed) {
            this.deleteMarker();
        }
    },

    /**
     * Eliminar marcador
     */
    deleteMarker() {
        if (!this.currentMarker) return;

        // Eliminar de localStorage
        this.deleteMarkerData(this.currentMarker.id);

        // Remover marcador del mapa
        if (typeof GeocodingMapApp !== 'undefined' && GeocodingMapApp.marker) {
            GeocodingMapApp.map.removeLayer(GeocodingMapApp.marker);
            GeocodingMapApp.marker = null;
        }

        // Ocultar panel de gestión
        this.hideManagementPanel();

        // Ocultar panel de resultados
        const resultsPanel = document.getElementById('results-panel');
        if (resultsPanel) {
            resultsPanel.style.display = 'none';
        }

        // Notificación
        if (typeof GeocodingMapApp !== 'undefined' && GeocodingMapApp.showNotification) {
            GeocodingMapApp.showNotification(
                'Marcador eliminado correctamente',
                'success'
            );
        }

        // Limpiar referencia
        this.currentMarker = null;

        // Disparar evento
        document.dispatchEvent(new CustomEvent('markerDeleted'));
    },

    /**
     * Obtener todos los marcadores guardados
     */
    getAllMarkers() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('❌ Error al cargar marcadores:', error);
            return {};
        }
    },

    /**
     * Restaurar marcadores guardados (para usar al cargar el mapa)
     */
    restoreMarkers() {
        const markers = this.getAllMarkers();
        const toRestore = Object.entries(markers)
            .filter(([id, data]) => data.keepMarker !== false)
            .map(([id, data]) => data);

        console.log(`🔄 Restaurando ${toRestore.length} marcadores guardados...`);
        return toRestore;
    },

    /**
     * Obtener todas las propiedades etiquetadas (solo con tag)
     */
    getTaggedProperties() {
        const markers = this.getAllMarkers();
        return Object.entries(markers)
            .filter(([id, data]) => data.tag && data.tag !== '' && data.keepMarker !== false)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Más recientes primero
    },

    /**
     * Renderizar panel lateral de propiedades etiquetadas - Estilo Alberto Cabanillas
     */
    renderTaggedPropertiesPanel() {
        const taggedProperties = this.getTaggedProperties();
        const content = document.getElementById('tagged-panel-content');
        const countBadge = document.getElementById('tagged-count');
        const countHeader = document.getElementById('tagged-count-header');

        if (!content) return;

        // Actualizar contador
        const count = taggedProperties.length;
        if (countBadge) countBadge.textContent = count;
        if (countHeader) countHeader.textContent = count;

        // Si no hay propiedades
        if (count === 0) {
            content.innerHTML = `
                <div class="tagged-panel-empty">
                    <i class="fas fa-tags"></i>
                    <p>
                        <strong>No hay propiedades etiquetadas</strong><br>
                        Geocodifica una propiedad y asígnale una etiqueta para verla aquí.
                    </p>
                </div>
            `;
            return;
        }

        // Renderizar tarjetas estilo Alberto Cabanillas
        content.innerHTML = taggedProperties.map(property => {
            const tag = this.getTagByValue(property.tag);
            const formattedDate = new Date(property.timestamp).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Generar iniciales para el avatar
            const contactName = property.contact || 'Propiedad';
            const initials = contactName
                .split(' ')
                .map(word => word[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

            // Extraer rol si existe (lo que está entre paréntesis)
            const roleMatch = contactName.match(/\((.*?)\)/);
            const role = roleMatch ? roleMatch[1] : 'Contacto';
            const cleanName = contactName.replace(/\s*\(.*?\)\s*/g, '').trim() || contactName;

            return `
                <div class="tagged-property-card" data-property-id="${property.id}">
                    <!-- Header clickeable -->
                    <div class="card-header" onclick="MarkerManager.toggleCard('${property.id}')">
                        <!-- Avatar con iniciales -->
                        <div class="contact-avatar" style="background: linear-gradient(135deg, ${tag.color} 0%, ${tag.color}dd 100%);">
                            ${initials}
                        </div>

                        <!-- Info de contacto -->
                        <div class="contact-info">
                            <div class="contact-name">
                                ${this.escapeHtml(cleanName)}
                                <span class="tag-badge" style="background-color: ${tag.bgColor}; color: ${tag.color}; font-size: 0.625rem; padding: 0.125rem 0.5rem;">
                                    ${tag.label}
                                </span>
                            </div>
                            <div class="contact-role">${this.escapeHtml(role)}</div>
                            <div class="property-timestamp">
                                <i class="far fa-clock"></i>
                                ${formattedDate}
                            </div>
                        </div>

                        <!-- Quick actions (siempre visible) -->
                        <div class="quick-actions" onclick="event.stopPropagation()">
                            <button class="quick-action-btn edit" onclick="MarkerManager.openEditModal('${property.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="quick-action-btn" onclick="MarkerManager.centerOnProperty('${property.id}')" title="Centrar en mapa">
                                <i class="fas fa-crosshairs"></i>
                            </button>
                        </div>

                        <!-- Expand indicator -->
                        <div class="expand-indicator">
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>

                    <!-- Body expandible con detalles completos -->
                    <div class="card-body">
                        <div class="card-body-content">
                            <!-- Dirección completa -->
                            <div style="margin-bottom: 1rem;">
                                <div class="detail-label">Dirección</div>
                                <div class="detail-value" style="color: #374151;">
                                    <i class="fas fa-map-marker-alt"></i>
                                    ${this.escapeHtml(property.address)}
                                </div>
                            </div>

                            <!-- Grid de detalles -->
                            <div class="property-details-grid">
                                ${property.estimatedValue ? `
                                    <div class="detail-item">
                                        <div class="detail-label">Valor Estimado</div>
                                        <div class="detail-value">
                                            <i class="fas fa-dollar-sign"></i>
                                            ${this.formatCurrency(property.estimatedValue)}
                                        </div>
                                    </div>
                                ` : ''}
                                ${property.offerAmount ? `
                                    <div class="detail-item">
                                        <div class="detail-label">Oferta Realizada</div>
                                        <div class="detail-value">
                                            <i class="fas fa-hand-holding-dollar"></i>
                                            ${this.formatCurrency(property.offerAmount)}
                                        </div>
                                    </div>
                                ` : ''}
                                ${property.phone ? `
                                    <div class="detail-item">
                                        <div class="detail-label">Teléfono</div>
                                        <div class="detail-value">
                                            <i class="fas fa-phone"></i>
                                            ${this.escapeHtml(property.phone)}
                                        </div>
                                    </div>
                                ` : ''}
                                ${property.email ? `
                                    <div class="detail-item">
                                        <div class="detail-label">Email</div>
                                        <div class="detail-value" style="font-size: 0.75rem;">
                                            <i class="fas fa-envelope"></i>
                                            ${this.escapeHtml(property.email)}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>

                            ${property.notes ? `
                                <div style="margin-top: 1rem;">
                                    <div class="detail-label">Notas</div>
                                    <div style="font-size: 0.8125rem; color: #374151; line-height: 1.5; padding: 0.75rem; background: #f9fafb; border-radius: 6px;">
                                        ${this.escapeHtml(property.notes)}
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Botones de acción expandidos -->
                            <div class="property-actions" style="margin-top: 1rem;">
                                <button class="property-action-btn" onclick="MarkerManager.centerOnProperty('${property.id}')">
                                    <i class="fas fa-crosshairs"></i>
                                    Centrar en Mapa
                                </button>
                                <button class="property-action-btn" onclick="MarkerManager.openEditModal('${property.id}')">
                                    <i class="fas fa-edit"></i>
                                    Editar Detalles
                                </button>
                                <button class="property-action-btn danger" onclick="MarkerManager.deletePropertyFromPanel('${property.id}')">
                                    <i class="fas fa-trash"></i>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Setup event listeners para los cards después de renderizar
        this.setupCardEventListeners();
    },

    /**
     * Centrar mapa en una propiedad
     */
    centerOnProperty(propertyId) {
        const markers = this.getAllMarkers();
        const property = markers[propertyId];

        if (!property) {
            console.warn('⚠️ Propiedad no encontrada:', propertyId);
            return;
        }

        // Usar la función de geocoding-map.js para centrar
        if (typeof GeocodingMapApp !== 'undefined' && GeocodingMapApp.jumpToMarker) {
            GeocodingMapApp.jumpToMarker(property.lat, property.lng);
        } else if (window.map) {
            window.map.setView([property.lat, property.lng], 18, {
                animate: true,
                duration: 1
            });
        }

        // Cerrar panel
        this.closeTaggedPanel();

        // Highlight temporal del marcador
        this.highlightMarker(propertyId);
    },

    /**
     * Editar propiedad desde el panel
     */
    editProperty(propertyId) {
        const markers = this.getAllMarkers();
        const property = markers[propertyId];

        if (!property) return;

        // Establecer como marcador actual
        this.currentMarker = {
            id: propertyId,
            lat: property.lat,
            lng: property.lng,
            address: property.address,
            addressData: property.addressData,
            tag: property.tag,
            keepMarker: property.keepMarker,
            contact: property.contact,
            estimatedValue: property.estimatedValue,
            offerAmount: property.offerAmount,
            timestamp: property.timestamp
        };

        // Mostrar panel de gestión
        this.showManagementPanel();

        // Centrar en la propiedad
        this.centerOnProperty(propertyId);

        // Scroll al panel de gestión
        setTimeout(() => {
            const panel = document.getElementById('marker-management-panel');
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 500);
    },

    /**
     * Eliminar propiedad desde el panel
     */
    deletePropertyFromPanel(propertyId) {
        const markers = this.getAllMarkers();
        const property = markers[propertyId];

        if (!property) return;

        if (!confirm(`¿Eliminar "${property.address}"?`)) return;

        // Eliminar de localStorage
        delete markers[propertyId];
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(markers));
        } catch (error) {
            console.error('❌ Error al eliminar:', error);
            return;
        }

        // Notificar
        if (typeof GeocodingMapApp !== 'undefined' && GeocodingMapApp.showNotification) {
            GeocodingMapApp.showNotification('Propiedad eliminada', 'success');
        }

        // Disparar evento para que el mapa elimine el marcador
        document.dispatchEvent(new CustomEvent('markerDeleted', {
            detail: { markerId: propertyId }
        }));

        // Actualizar panel
        this.renderTaggedPropertiesPanel();
    },

    /**
     * Highlight temporal de un marcador
     */
    highlightMarker(propertyId) {
        // Disparar evento para que el mapa haga highlight
        document.dispatchEvent(new CustomEvent('highlightMarker', {
            detail: { markerId: propertyId }
        }));
    },

    /**
     * Abrir panel lateral
     */
    openTaggedPanel() {
        const panel = document.getElementById('tagged-properties-sidebar');
        if (panel) {
            panel.classList.add('open');
            this.renderTaggedPropertiesPanel();
        }
    },

    /**
     * Cerrar panel lateral
     */
    closeTaggedPanel() {
        const panel = document.getElementById('tagged-properties-sidebar');
        if (panel) {
            panel.classList.remove('open');
        }
    },

    /**
     * Toggle panel lateral
     */
    toggleTaggedPanel() {
        const panel = document.getElementById('tagged-properties-sidebar');
        if (panel && panel.classList.contains('open')) {
            this.closeTaggedPanel();
        } else {
            this.openTaggedPanel();
        }
    },

    /**
     * Formatear moneda
     */
    formatCurrency(amount) {
        if (!amount) return '';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Toggle expand/collapse de una tarjeta
     */
    toggleCard(propertyId) {
        const card = document.querySelector(`[data-property-id="${propertyId}"]`);
        if (card) {
            card.classList.toggle('expanded');
        }
    },

    /**
     * Setup event listeners para las tarjetas
     */
    setupCardEventListeners() {
        // Ya están implementados con onclick inline
        // Este método está para futuras mejoras
    },

    /**
     * Abrir modal de edición
     */
    openEditModal(propertyId) {
        const markers = this.getAllMarkers();
        const property = markers[propertyId];

        if (!property) {
            console.warn('⚠️ Propiedad no encontrada:', propertyId);
            return;
        }

        // Guardar ID de propiedad siendo editada
        this.editingPropertyId = propertyId;

        // Renderizar formulario
        const modalBody = document.getElementById('edit-modal-body');
        if (!modalBody) return;

        const tag = this.getTagByValue(property.tag || '');

        modalBody.innerHTML = `
            <div class="edit-form-section">
                <h4>
                    <i class="fas fa-user"></i>
                    Información de Contacto
                </h4>
                <div class="edit-form-group">
                    <label class="edit-form-label">Nombre/Contacto *</label>
                    <input
                        type="text"
                        class="edit-form-input"
                        id="edit-contact"
                        value="${this.escapeHtml(property.contact || '')}"
                        placeholder="Ej: Juan Pérez (dueño)"
                    >
                </div>
                <div class="edit-form-group">
                    <label class="edit-form-label">Teléfono</label>
                    <input
                        type="tel"
                        class="edit-form-input"
                        id="edit-phone"
                        value="${this.escapeHtml(property.phone || '')}"
                        placeholder="Ej: 6671234567"
                    >
                </div>
                <div class="edit-form-group">
                    <label class="edit-form-label">Email</label>
                    <input
                        type="email"
                        class="edit-form-input"
                        id="edit-email"
                        value="${this.escapeHtml(property.email || '')}"
                        placeholder="Ej: contacto@ejemplo.com"
                    >
                </div>
            </div>

            <div class="edit-form-section">
                <h4>
                    <i class="fas fa-dollar-sign"></i>
                    Información Financiera
                </h4>
                <div class="edit-form-group">
                    <label class="edit-form-label">Valor Estimado (MXN)</label>
                    <input
                        type="number"
                        class="edit-form-input"
                        id="edit-estimated-value"
                        value="${property.estimatedValue || ''}"
                        placeholder="Ej: 2500000"
                        min="0"
                        step="1000"
                    >
                </div>
                <div class="edit-form-group">
                    <label class="edit-form-label">Oferta Realizada (MXN)</label>
                    <input
                        type="number"
                        class="edit-form-input"
                        id="edit-offer-amount"
                        value="${property.offerAmount || ''}"
                        placeholder="Ej: 2200000"
                        min="0"
                        step="1000"
                    >
                </div>
            </div>

            <div class="edit-form-section">
                <h4>
                    <i class="fas fa-sticky-note"></i>
                    Notas Adicionales
                </h4>
                <div class="edit-form-group">
                    <label class="edit-form-label">Notas</label>
                    <textarea
                        class="edit-form-textarea"
                        id="edit-notes"
                        placeholder="Agregar observaciones, condiciones especiales, etc."
                    >${this.escapeHtml(property.notes || '')}</textarea>
                </div>
            </div>

            <div class="edit-form-section">
                <h4>
                    <i class="fas fa-map-marker-alt"></i>
                    Ubicación
                </h4>
                <div class="edit-form-group">
                    <label class="edit-form-label">Dirección</label>
                    <input
                        type="text"
                        class="edit-form-input"
                        id="edit-address"
                        value="${this.escapeHtml(property.address || '')}"
                        readonly
                        style="background: #f9fafb; color: #6b7280;"
                    >
                    <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">
                        <i class="fas fa-info-circle"></i>
                        La dirección no puede editarse. Para cambiarla, geocodifica nuevamente.
                    </p>
                </div>
            </div>
        `;

        // Mostrar modal
        const overlay = document.getElementById('edit-modal-overlay');
        if (overlay) {
            overlay.classList.add('active');
            // Focus en primer input
            setTimeout(() => {
                const firstInput = document.getElementById('edit-contact');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    },

    /**
     * Cerrar modal de edición
     */
    closeEditModal() {
        const overlay = document.getElementById('edit-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        this.editingPropertyId = null;
    },

    /**
     * Guardar ediciones del modal
     */
    saveEditedProperty() {
        if (!this.editingPropertyId) return;

        const markers = this.getAllMarkers();
        const property = markers[this.editingPropertyId];

        if (!property) return;

        // Capturar valores del formulario
        const contact = document.getElementById('edit-contact')?.value.trim() || '';
        const phone = document.getElementById('edit-phone')?.value.trim() || '';
        const email = document.getElementById('edit-email')?.value.trim() || '';
        const estimatedValue = document.getElementById('edit-estimated-value')?.value || null;
        const offerAmount = document.getElementById('edit-offer-amount')?.value || null;
        const notes = document.getElementById('edit-notes')?.value.trim() || '';

        // Validación básica
        if (!contact) {
            alert('El nombre/contacto es obligatorio');
            return;
        }

        // Actualizar propiedad
        property.contact = contact;
        property.phone = phone;
        property.email = email;
        property.estimatedValue = estimatedValue ? parseFloat(estimatedValue) : null;
        property.offerAmount = offerAmount ? parseFloat(offerAmount) : null;
        property.notes = notes;
        property.lastModified = Date.now();

        // Guardar en localStorage
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(markers));
        } catch (error) {
            console.error('❌ Error al guardar:', error);
            alert('Error al guardar los cambios');
            return;
        }

        // Notificar
        if (typeof GeocodingMapApp !== 'undefined' && GeocodingMapApp.showNotification) {
            GeocodingMapApp.showNotification('Cambios guardados exitosamente', 'success');
        }

        // Actualizar panel
        this.renderTaggedPropertiesPanel();

        // Actualizar marcador en el mapa (recargar todos)
        if (typeof GeocodingMapApp !== 'undefined' && GeocodingMapApp.refreshSavedMarkers) {
            GeocodingMapApp.refreshSavedMarkers();
        }

        // Cerrar modal
        this.closeEditModal();

        console.log('✅ Propiedad actualizada:', this.editingPropertyId);
    },

    /**
     * Configurar panel lateral de propiedades etiquetadas
     */
    setupTaggedPanel() {
        // Toggle button
        const toggleBtn = document.getElementById('toggle-tagged-panel');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleTaggedPanel();
            });
        }

        // Close button
        const closeBtn = document.getElementById('close-tagged-panel');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeTaggedPanel();
            });
        }

        // Actualizar panel cuando se guarde un marcador
        document.addEventListener('markerTagUpdated', () => {
            setTimeout(() => {
                this.renderTaggedPropertiesPanel();
            }, 100);
        });

        // Actualizar panel cuando se elimine un marcador
        document.addEventListener('markerDeleted', () => {
            setTimeout(() => {
                this.renderTaggedPropertiesPanel();
            }, 100);
        });

        // Event listeners para el modal de edición
        const editModalClose = document.getElementById('edit-modal-close');
        if (editModalClose) {
            editModalClose.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        const editModalCancel = document.getElementById('edit-modal-cancel');
        if (editModalCancel) {
            editModalCancel.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        const editModalSave = document.getElementById('edit-modal-save');
        if (editModalSave) {
            editModalSave.addEventListener('click', () => {
                this.saveEditedProperty();
            });
        }

        // Cerrar modal al hacer click fuera del contenido
        const editModalOverlay = document.getElementById('edit-modal-overlay');
        if (editModalOverlay) {
            editModalOverlay.addEventListener('click', (e) => {
                if (e.target === editModalOverlay) {
                    this.closeEditModal();
                }
            });
        }

        // Cerrar modal con tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && editModalOverlay && editModalOverlay.classList.contains('active')) {
                this.closeEditModal();
            }
        });
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MarkerManager.init());
} else {
    MarkerManager.init();
}

// Exportar para uso global
window.MarkerManager = MarkerManager;
