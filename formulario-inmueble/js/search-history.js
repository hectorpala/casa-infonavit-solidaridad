/**
 * SEARCH-HISTORY.JS - Sistema de Historial de Búsquedas
 * Guarda y muestra las últimas búsquedas de geocodificación para reutilizarlas
 */

console.log('🔵 search-history.js CARGADO');

const SearchHistory = {
    // Configuración
    STORAGE_KEY: 'geocoding_search_history',
    MAX_ENTRIES: 20,

    /**
     * Inicializar el sistema de historial
     */
    init() {
        console.log('📚 Inicializando sistema de historial de búsquedas...');

        // Cargar y mostrar historial al inicio
        this.renderHistory();

        // Setup event listeners
        this.setupEventListeners();

        console.log('✅ Sistema de historial inicializado');
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Event delegation para clicks en historial
        document.addEventListener('click', (e) => {
            // Click en item del historial
            const historyItem = e.target.closest('.history-item');
            if (historyItem) {
                e.preventDefault();
                const index = parseInt(historyItem.dataset.index);
                this.loadFromHistory(index);
                return;
            }

            // Click en botón limpiar historial
            const clearBtn = e.target.closest('#clear-history-btn');
            if (clearBtn) {
                e.preventDefault();
                this.clearHistory();
                return;
            }
        });

        // Escuchar evento de geocodificación exitosa
        document.addEventListener('geocodingSuccess', (e) => {
            const { addressData, result } = e.detail;
            this.addToHistory(addressData, result);
        });
    },

    /**
     * Obtener historial desde localStorage
     */
    getHistory() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('❌ Error al cargar historial:', error);
            return [];
        }
    },

    /**
     * Guardar historial en localStorage
     */
    saveHistory(history) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('❌ Error al guardar historial:', error);
        }
    },

    /**
     * Agregar búsqueda al historial
     */
    addToHistory(addressData, result) {
        console.log('📝 Agregando al historial:', addressData);

        const history = this.getHistory();

        // Crear entrada de historial
        const entry = {
            timestamp: Date.now(),
            addressData: {
                street: addressData.street || '',
                number: addressData.number || '',
                interiorNumber: addressData.interiorNumber || '',
                colonia: addressData.colonia || '',
                zipCode: addressData.zipCode || '',
                state: addressData.state || 'sinaloa',
                municipality: addressData.municipality || 'culiacan'
            },
            result: {
                latitude: result.latitude,
                longitude: result.longitude,
                formattedAddress: result.formattedAddress,
                service: result.service
            },
            // Display text para mostrar en el dropdown
            displayText: this.buildDisplayText(addressData)
        };

        // Verificar si ya existe una entrada idéntica (evitar duplicados)
        const existingIndex = history.findIndex(item =>
            item.displayText === entry.displayText
        );

        if (existingIndex !== -1) {
            // Ya existe, actualizarla (mover al inicio)
            history.splice(existingIndex, 1);
        }

        // Agregar al inicio del array (más reciente primero)
        history.unshift(entry);

        // Limitar a MAX_ENTRIES
        if (history.length > this.MAX_ENTRIES) {
            history.length = this.MAX_ENTRIES;
        }

        // Guardar
        this.saveHistory(history);

        // Re-renderizar
        this.renderHistory();

        console.log(`✅ Historial actualizado (${history.length} entradas)`);
    },

    /**
     * Construir texto de display para una entrada de historial
     */
    buildDisplayText(addressData) {
        const parts = [];

        // Calle + número
        if (addressData.street) {
            let streetPart = addressData.street.trim();
            if (addressData.number && addressData.number.trim()) {
                streetPart += ` ${addressData.number.trim()}`;
            }
            parts.push(streetPart);
        }

        // Colonia
        if (addressData.colonia) {
            parts.push(addressData.colonia);
        }

        return parts.join(', ') || 'Búsqueda sin nombre';
    },

    /**
     * Renderizar historial en la UI
     */
    renderHistory() {
        const history = this.getHistory();
        const container = document.getElementById('history-panel');

        if (!container) {
            console.warn('⚠️ Panel de historial no encontrado');
            return;
        }

        if (history.length === 0) {
            // Sin historial - ocultar panel
            container.style.display = 'none';
            return;
        }

        // Mostrar panel
        container.style.display = 'block';

        // Renderizar lista con mismo estilo que otros paneles
        const html = `
            <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div class="bg-gradient-to-r from-indigo-50 to-indigo-100/50 px-6 py-4 border-b border-indigo-200">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-neutral-900">
                            <i class="fas fa-history text-indigo-600 mr-2"></i>
                            Búsquedas Recientes
                        </h3>
                        <button id="clear-history-btn" class="text-xs text-red-600 hover:text-red-700 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50" title="Limpiar todo el historial">
                            <i class="fas fa-trash-alt mr-1"></i>
                            Limpiar
                        </button>
                    </div>
                </div>

                <div class="p-6">
                    <div class="space-y-2 max-h-80 overflow-y-auto">
                        ${history.map((entry, index) => this.renderHistoryItem(entry, index)).join('')}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * Renderizar un item del historial
     */
    renderHistoryItem(entry, index) {
        const timeAgo = this.formatTimeAgo(entry.timestamp);

        return `
            <div class="history-item group" data-index="${index}" role="button" tabindex="0">
                <div class="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-indigo-300 transition-all cursor-pointer">
                    <div class="flex-shrink-0 mt-0.5">
                        <i class="fas fa-map-marker-alt text-indigo-500 text-sm"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-neutral-900 group-hover:text-indigo-600 transition-colors">
                            ${this.escapeHtml(entry.displayText)}
                        </p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-neutral-500">
                                <i class="far fa-clock mr-1"></i>
                                ${timeAgo}
                            </span>
                            <span class="text-xs text-neutral-400">•</span>
                            <span class="text-xs text-neutral-500">
                                ${entry.result.service}
                            </span>
                        </div>
                    </div>
                    <div class="flex-shrink-0">
                        <i class="fas fa-chevron-right text-neutral-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"></i>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Formatear timestamp a tiempo relativo
     */
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes}m`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days < 7) return `Hace ${days}d`;

        return new Date(timestamp).toLocaleDateString('es-MX', {
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Cargar entrada del historial en el formulario y geocodificar
     */
    async loadFromHistory(index) {
        console.log(`📂 Cargando búsqueda del historial: ${index}`);

        const history = this.getHistory();
        const entry = history[index];

        if (!entry) {
            console.error('❌ Entrada de historial no encontrada');
            return;
        }

        const addressData = entry.addressData;

        // Llenar formulario
        document.getElementById('state').value = addressData.state || 'sinaloa';

        // Trigger change en estado para popular municipios
        document.getElementById('state').dispatchEvent(new Event('change'));

        // Esperar un tick para que los municipios se pueblen
        await new Promise(resolve => setTimeout(resolve, 100));

        document.getElementById('municipality').value = addressData.municipality || 'culiacan';
        document.getElementById('colonia').value = addressData.colonia || '';
        document.getElementById('colonia-value').value = addressData.colonia || '';
        document.getElementById('address').value = addressData.street || '';
        document.getElementById('exterior-number').value = addressData.number || '';
        document.getElementById('interior-number').value = addressData.interiorNumber || '';
        document.getElementById('zip-code').value = addressData.zipCode || '';

        // Trigger change en municipio para actualizar mapa
        document.getElementById('municipality').dispatchEvent(new Event('change'));

        // Notificación
        if (typeof GeocodingMapApp !== 'undefined' && GeocodingMapApp.showNotification) {
            GeocodingMapApp.showNotification('Búsqueda cargada desde historial', 'success');
        }

        // Auto-geocodificar después de un pequeño delay
        setTimeout(() => {
            const form = document.getElementById('geocoding-form');
            if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
        }, 300);

        console.log('✅ Búsqueda cargada y geocodificación iniciada');
    },

    /**
     * Limpiar todo el historial
     */
    clearHistory() {
        if (!confirm('¿Estás seguro que deseas borrar todo el historial de búsquedas?')) {
            return;
        }

        localStorage.removeItem(this.STORAGE_KEY);
        this.renderHistory();

        if (typeof GeocodingMapApp !== 'undefined' && GeocodingMapApp.showNotification) {
            GeocodingMapApp.showNotification('Historial de búsquedas eliminado', 'success');
        }

        console.log('🗑️ Historial limpiado');
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
window.SearchHistory = SearchHistory;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SearchHistory.init());
} else {
    SearchHistory.init();
}
