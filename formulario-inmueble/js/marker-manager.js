/**
 * MARKER-MANAGER.JS - Sistema de Gestión de Marcadores de Propiedades
 * Permite etiquetar, persistir y eliminar marcadores de propiedades en el mapa
 */

console.log('🔵 marker-manager.js CARGADO');

const MarkerManager = {
    // Configuración
    STORAGE_KEY: 'property_markers',

    // Catálogo de etiquetas (extensible)
    TAGS: [
        { value: '', label: 'Sin etiqueta', color: '#94a3b8', bgColor: '#f1f5f9' },
        { value: 'revision', label: 'En revisión', color: '#f59e0b', bgColor: '#fef3c7' },
        { value: 'compra', label: 'Compra', color: '#10b981', bgColor: '#d1fae5' },
        { value: 'venta', label: 'Venta', color: '#3b82f6', bgColor: '#dbeafe' },
        { value: 'flip', label: 'Posible flip', color: '#8b5cf6', bgColor: '#ede9fe' },
        { value: 'descartada', label: 'Descartada', color: '#ef4444', bgColor: '#fee2e2' }
    ],

    // Estado actual
    currentMarker: null,

    /**
     * Inicializar el sistema de gestión de marcadores
     */
    init() {
        console.log('🏷️ Inicializando sistema de gestión de marcadores...');

        // Setup event listeners
        this.setupEventListeners();

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

        if (!select || !keepCheckbox) {
            console.error('❌ Elementos del formulario no encontrados');
            return;
        }

        const tag = select.value;
        const keepMarker = keepCheckbox.checked;

        // Actualizar marcador actual
        this.currentMarker.tag = tag;
        this.currentMarker.keepMarker = keepMarker;

        // Guardar en localStorage
        const success = this.saveMarkerData(this.currentMarker.id, {
            lat: this.currentMarker.lat,
            lng: this.currentMarker.lng,
            address: this.currentMarker.address,
            addressData: this.currentMarker.addressData,
            tag: tag,
            keepMarker: keepMarker,
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

            // Disparar evento para que search-history se actualice
            document.dispatchEvent(new CustomEvent('markerTagUpdated', {
                detail: {
                    markerId: this.currentMarker.id,
                    tag: tag,
                    keepMarker: keepMarker
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
