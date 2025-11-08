/**
 * Results Panel Manager
 * Maneja el panel lateral de resultados con sincronización mapa⇄lista
 */

class ResultsPanelManager {
    constructor() {
        this.resultsContainer = document.getElementById('results-items');
        this.resultsCount = document.getElementById('results-count');
        this.resultsShowing = document.getElementById('results-showing');
        this.resultsList = document.getElementById('results-list');
        this.resultsSkeleton = document.getElementById('results-skeleton');
        this.resultsEmpty = document.getElementById('results-empty');

        this.selectedRowId = null;
        this.results = [];
    }

    /**
     * Muestra el estado de carga (skeleton)
     */
    showLoading() {
        this.resultsSkeleton.style.display = 'block';
        this.resultsEmpty.style.display = 'none';
        this.resultsContainer.innerHTML = '';
    }

    /**
     * Muestra el estado vacío
     */
    showEmpty() {
        this.resultsSkeleton.style.display = 'none';
        this.resultsEmpty.style.display = 'block';
        this.resultsContainer.innerHTML = '';
        this.updateCounts(0);
    }

    /**
     * Actualiza los contadores
     */
    updateCounts(count) {
        this.resultsCount.textContent = count;
        this.resultsShowing.textContent = count;
    }

    /**
     * Genera HTML para una fila de resultado
     */
    generateRowHTML(result, index) {
        const {
            id,
            address,
            colonia,
            zipCode,
            municipio,
            precision,
            distance,
            value,
            type = 'Casa'
        } = result;

        const precisionText = precision === 'ROOFTOP' ? 'Alta' :
                             precision === 'RANGE_INTERPOLATED' ? 'Media' : 'Baja';

        const distanceText = distance ? `${Math.round(distance)} m` : '--';
        const valueFormatted = value ? `$${value.toLocaleString('es-MX')}` : '--';

        return `
            <article class="group cursor-pointer px-4 py-3 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--accent)] transition-colors"
                     tabindex="0"
                     data-result-id="${id}"
                     data-index="${index}">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                        <h4 class="truncate text-[15px] font-medium text-zinc-900">${address}</h4>
                        <p class="truncate text-[13px] text-zinc-600">${colonia}, ${zipCode} · ${municipio}</p>
                        <div class="mt-1 flex items-center gap-2 text-[12px] text-zinc-500 flex-wrap">
                            <span class="inline-flex items-center gap-1 rounded-full bg-zinc-100 text-zinc-700 px-2 py-0.5 text-[11px]">
                                <span class="opacity-70">📍</span> ${type}
                            </span>
                            <span>Precisión: ${precisionText}</span>
                            ${distance ? `<span>•</span><span>${distanceText}</span>` : ''}
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <p class="text-[12px] text-zinc-500">Valor</p>
                        <p class="text-[15px] font-semibold text-zinc-900">${valueFormatted}</p>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Renderiza la lista de resultados
     */
    renderResults(results) {
        this.results = results;

        if (!results || results.length === 0) {
            this.showEmpty();
            return;
        }

        this.resultsSkeleton.style.display = 'none';
        this.resultsEmpty.style.display = 'none';

        const html = results.map((result, index) =>
            this.generateRowHTML(result, index)
        ).join('');

        this.resultsContainer.innerHTML = html;
        this.updateCounts(results.length);

        // Agregar event listeners a las filas
        this.attachRowListeners();
    }

    /**
     * Agrega event listeners a las filas
     */
    attachRowListeners() {
        const rows = this.resultsContainer.querySelectorAll('article[data-result-id]');

        rows.forEach(row => {
            const resultId = row.dataset.resultId;
            const index = parseInt(row.dataset.index);

            // Click: seleccionar y centrar en mapa
            row.addEventListener('click', () => {
                this.selectRow(resultId);
                this.onRowClick(this.results[index]);
            });

            // Enter key: mismo comportamiento que click
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.selectRow(resultId);
                    this.onRowClick(this.results[index]);
                }
            });

            // Hover: highlight pin en mapa (sin seleccionar)
            row.addEventListener('mouseenter', () => {
                this.onRowHover(this.results[index], true);
            });

            row.addEventListener('mouseleave', () => {
                this.onRowHover(this.results[index], false);
            });
        });
    }

    /**
     * Selecciona una fila visualmente
     */
    selectRow(resultId) {
        // Remover selección previa
        const prevSelected = this.resultsContainer.querySelector('.result-row--selected');
        if (prevSelected) {
            prevSelected.classList.remove('result-row--selected');
        }

        // Agregar selección a la nueva fila
        const row = this.resultsContainer.querySelector(`[data-result-id="${resultId}"]`);
        if (row) {
            row.classList.add('result-row--selected');
            this.selectedRowId = resultId;

            // Scroll suave a la fila seleccionada (centrada en el viewport)
            row.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    /**
     * Selecciona una fila desde el mapa (por ID de marker)
     */
    selectFromMap(markerId) {
        // Buscar el resultado correspondiente
        const result = this.results.find(r => r.id === markerId);
        if (result) {
            this.selectRow(markerId);
        }
    }

    /**
     * Callback cuando se hace click en una fila
     * Debe ser implementado externamente para centrar el mapa
     */
    onRowClick(result) {
        // Este método será sobrescrito por el código principal
        console.log('Row clicked:', result);
    }

    /**
     * Callback cuando se hace hover en una fila
     * Debe ser implementado externamente para highlight del pin
     */
    onRowHover(result, isEntering) {
        // Este método será sobrescrito por el código principal
        console.log('Row hover:', result, isEntering);
    }

    /**
     * Limpia la selección actual
     */
    clearSelection() {
        const prevSelected = this.resultsContainer.querySelector('.result-row--selected');
        if (prevSelected) {
            prevSelected.classList.remove('result-row--selected');
        }
        this.selectedRowId = null;
    }

    /**
     * Filtra resultados por texto de búsqueda
     */
    filterResults(searchText) {
        const filtered = this.results.filter(result => {
            const searchIn = `${result.address} ${result.colonia} ${result.municipio}`.toLowerCase();
            return searchIn.includes(searchText.toLowerCase());
        });

        this.renderResults(filtered);
    }

    /**
     * Ordena resultados por cercanía (requiere punto de referencia)
     */
    sortByDistance(referencePoint) {
        // Implementar cálculo de distancia haversine si es necesario
        console.log('Sort by distance:', referencePoint);
    }

    /**
     * Ordena resultados por fecha (más recientes primero)
     */
    sortByRecent() {
        const sorted = [...this.results].sort((a, b) => {
            return (b.timestamp || 0) - (a.timestamp || 0);
        });
        this.renderResults(sorted);
    }
}

// Exportar como global para uso en otros scripts
window.ResultsPanelManager = ResultsPanelManager;
