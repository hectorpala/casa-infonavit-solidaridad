/**
 * AUTOCOMPLETE.JS - Sistema de Autocompletado para Colonias
 * Permite buscar y seleccionar colonias de Culiacán con sugerencias
 */

/**
 * Utility: Debounce function
 * Evita ejecutar una función múltiples veces en rápida sucesión
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const Autocomplete = {
    colonias: [],
    calles: [],
    currentIndex: -1,
    selectedColonia: null,
    selectedCalle: null,
    currentMunicipality: 'culiacan', // default
    _basePaths: null,

    /**
     * Calcular rutas base absolutas desde ubicacion del script
     */
    _getBasePaths() {
        if (this._basePaths) return this._basePaths;

        const script = document.currentScript || [...document.getElementsByTagName('script')].find(s => s.src.includes('js/autocomplete.js'));
        const scriptUrl = script ? new URL(script.src, window.location.href) : new URL(window.location.href);

        // scriptUrl.pathname termina en /js/autocomplete.js; obtener carpeta base
        const scriptDir = scriptUrl.pathname.replace(/\/js\/[^/]+$/, '/');
        const baseFolder = new URL('.', `${scriptUrl.origin}${scriptDir}`).href;
        const rootFolder = new URL('.', window.location.origin + window.location.pathname).href;

        this._basePaths = { baseFolder, rootFolder, origin: scriptUrl.origin };
        return this._basePaths;
    },

    /**
     * Resolver rutas candidatas para datasets (con fallback para produccion/local)
     */
    resolveDatasetPaths(resource, municipality) {
        const { baseFolder, rootFolder } = this._getBasePaths();

        const candidates = [
            new URL(`data/${resource}-${municipality}.json`, baseFolder).href,
            new URL(`data/${resource}-${municipality}.json`, rootFolder).href,
            new URL(`formulario-inmueble/data/${resource}-${municipality}.json`, baseFolder).href,
            new URL(`formulario-inmueble/data/${resource}-${municipality}.json`, rootFolder).href,
            new URL(`../data/${resource}-${municipality}.json`, baseFolder).href,
            new URL(`../formulario-inmueble/data/${resource}-${municipality}.json`, baseFolder).href,
            `https://casasenventa.info/formulario-inmueble/data/${resource}-${municipality}.json`
        ];

        // Eliminar duplicados usando Set
        return [...new Set(candidates)];
    },

    /**
     * Fetch JSON con fallback a multiples rutas
     */
    async fetchJsonWithFallback(paths) {
        const attempted = [];

        for (const path of paths) {
            attempted.push(path);
            try {
                const response = await fetch(path, { cache: 'no-store' });
                if (response.ok) {
                    return await response.json();
                }
                console.warn('⚠️ Dataset no encontrado', { path, status: response.status });
            } catch (error) {
                console.warn('⚠️ Dataset no encontrado', { path, error: error.message });
            }
        }

        throw new Error('DATASET_NOT_FOUND:' + attempted.join('|'));
    },

    /**
     * Inicializar módulo de autocomplete
     */
    async init(municipality = 'culiacan', setupMunicipalityListener = true) {
        console.log('🔍 Inicializando autocomplete para:', municipality);

        this.currentMunicipality = municipality;

        // Cargar datos de colonias y calles según municipio
        await Promise.all([
            this.loadColonias(municipality),
            this.loadCalles(municipality)
        ]);

        // Setup event listeners
        this.setupEventListeners();
        this.setupStreetListeners();

        // Solo configurar listener de municipio si se solicita (default: true)
        if (setupMunicipalityListener) {
            this.setupMunicipalityListener();
        }

        console.log('✅ Autocomplete inicializado con', this.colonias.length, 'colonias y', this.calles.length, 'calles');
    },

    /**
     * Cargar datos de colonias según municipio
     */
    async loadColonias(municipality = 'culiacan') {
        try {
            const paths = this.resolveDatasetPaths('colonias', municipality);
            console.log('📥 Cargando colonias desde rutas candidatas...');
            console.log('📂 Rutas probadas colonias:', paths);

            const data = await this.fetchJsonWithFallback(paths);

            // Extraer array de colonias
            this.colonias = data.colonias.map(col => ({
                nombre: col.nombre,
                tipo: col.tipo,
                codigoPostal: col.codigoPostal,
                zona: col.zona,
                // Generar slug para value
                slug: this.generateSlug(col.nombre)
            }));

            console.log(`✅ Cargadas ${this.colonias.length} colonias de ${municipality}`);

            if (this.colonias.length === 0) {
                console.warn('⚠️ No hay colonias para', municipality);
            }
        } catch (error) {
            console.error('❌ Error al cargar colonias:', error);
            this.showError('No se pudieron cargar las colonias. Por favor, recarga la página.');
        }
    },

    /**
     * Generar slug desde nombre
     */
    generateSlug(nombre) {
        return nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^a-z0-9\s]/g, '')      // Remover caracteres especiales
            .trim()
            .replace(/\s+/g, '-');             // Espacios a guiones
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const input = document.getElementById('colonia');
        const suggestionsBox = document.getElementById('colonia-suggestions');

        if (!input || !suggestionsBox) {
            console.warn('⚠️ Elementos de autocomplete no encontrados');
            return;
        }

        // Input event - buscar mientras escribe
        input.addEventListener('input', debounce((e) => {
            const query = e.target.value.trim();

            // Si el usuario está modificando el campo, limpiar código postal anterior
            if (this.selectedColonia && this.selectedColonia.nombre !== query) {
                console.log('🔄 Usuario está cambiando colonia, limpiando CP anterior');
                this.clearZipCode();
                this.selectedColonia = null;
            }

            if (query.length < 2) {
                this.hideSuggestions();
                this.selectedColonia = null;
                this.clearZipCode(); // Limpiar CP si se borra el campo
                return;
            }

            this.searchColonias(query);
        }, 200));

        // Focus event - mostrar todas si no hay query
        input.addEventListener('focus', (e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                this.searchColonias(query);
            }
        });

        // Blur event - ocultar sugerencias (con delay para permitir click)
        input.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideSuggestions();
            }, 200);
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Click fuera para cerrar
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    },

    /**
     * Buscar colonias que coincidan con el query (sistema casasenventa.info)
     */
    searchColonias(query) {
        const normalizedQuery = this.normalizeString(query);
        const queryTokens = normalizedQuery.split(' ').filter(Boolean);

        // Filtrar colonias que coincidan con el patrón
        const matches = this.colonias.filter(col => {
            const normalizedNombre = this.normalizeString(col.nombre);

            // Método 1: Contiene el query completo
            if (normalizedNombre.includes(normalizedQuery)) {
                return true;
            }

            // Método 2: Todos los tokens del query están en el nombre
            if (queryTokens.length > 0 && queryTokens.every(token => normalizedNombre.includes(token))) {
                return true;
            }

            return false;
        });

        // Ordenar por relevancia (igual que casasenventa.info)
        matches.sort((a, b) => {
            const aNorm = this.normalizeString(a.nombre);
            const bNorm = this.normalizeString(b.nombre);

            // 1. Los que empiezan con el query van primero
            const aStarts = aNorm.startsWith(normalizedQuery);
            const bStarts = bNorm.startsWith(normalizedQuery);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            // 2. Los que tienen el query al inicio de una palabra
            const aWordStart = aNorm.split(' ').some(word => word.startsWith(normalizedQuery));
            const bWordStart = bNorm.split(' ').some(word => word.startsWith(normalizedQuery));

            if (aWordStart && !bWordStart) return -1;
            if (!aWordStart && bWordStart) return 1;

            // 3. Orden alfabético
            return a.nombre.localeCompare(b.nombre);
        });

        // Limitar resultados
        const limited = matches.slice(0, 8);

        this.showSuggestions(limited, query);
    },

    /**
     * Mostrar sugerencias
     */
    showSuggestions(suggestions, query) {
        const suggestionsBox = document.getElementById('colonia-suggestions');

        if (suggestions.length === 0) {
            suggestionsBox.innerHTML = '<div class="autocomplete-no-results">No se encontraron resultados</div>';
            suggestionsBox.classList.add('active');
            return;
        }

        suggestionsBox.innerHTML = suggestions.map((col, index) => {
            const highlighted = this.highlightMatch(col.nombre, query);

            return `
                <div class="autocomplete-item" data-index="${index}" data-nombre="${col.nombre}" data-slug="${col.slug}" data-cp="${col.codigoPostal}">
                    <div class="autocomplete-item-title">${highlighted}</div>
                    <div class="autocomplete-item-meta">
                        <span class="autocomplete-badge">${col.tipo}</span>
                        <span class="autocomplete-cp">CP: ${col.codigoPostal}</span>
                    </div>
                </div>
            `;
        }).join('');

        suggestionsBox.classList.add('active');
        this.currentIndex = -1;

        // Event listeners para cada sugerencia
        const items = suggestionsBox.querySelectorAll('.autocomplete-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                this.selectColonia(
                    item.dataset.nombre,
                    item.dataset.slug,
                    item.dataset.cp
                );
            });
        });
    },

    /**
     * Resaltar coincidencias
     */
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong style="background:transparent!important;background-color:transparent!important;box-shadow:none!important;text-shadow:none!important;font-weight:600!important;padding:0!important;margin:0!important;">$1</strong>');
    },

    /**
     * Limpiar código postal
     */
    clearZipCode() {
        const zipCodeInput = document.getElementById('zip-code');

        if (!zipCodeInput) {
            console.warn('⚠️ Campo zip-code no encontrado para limpiar');
            return;
        }

        console.log('🧹 Limpiando código postal anterior');

        // Limpiar el input
        zipCodeInput.value = '';

        // Disparar eventos
        zipCodeInput.dispatchEvent(new Event('input', { bubbles: true }));
        zipCodeInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Limpiar AppState
        if (typeof AppState !== 'undefined' && AppState.formData) {
            AppState.formData.zipCode = '';
            console.log('🧹 AppState.zipCode limpiado');
        }

        // Limpiar localStorage
        try {
            const savedData = JSON.parse(localStorage.getItem('formProgress') || '{}');
            savedData.zipCode = '';
            savedData.codigoPostal = '';
            localStorage.setItem('formProgress', JSON.stringify(savedData));
            console.log('🧹 localStorage zipCode limpiado');
        } catch (e) {
            console.warn('⚠️ No se pudo limpiar localStorage:', e);
        }

        // Limpiar validación
        if (typeof FormValidation !== 'undefined') {
            FormValidation.clearError(zipCodeInput);
        }
    },

    /**
     * Ocultar sugerencias
     */
    hideSuggestions() {
        const suggestionsBox = document.getElementById('colonia-suggestions');
        suggestionsBox.classList.remove('active');
        suggestionsBox.innerHTML = '';
        this.currentIndex = -1;
    },

    /**
     * Seleccionar colonia
     */
    selectColonia(nombre, slug, codigoPostal) {
        console.log('🔍 selectColonia llamada con:', { nombre, slug, codigoPostal });

        const input = document.getElementById('colonia');
        const hiddenInput = document.getElementById('colonia-value');
        const zipCodeInput = document.getElementById('zip-code');

        console.log('🔍 Elementos encontrados:', {
            input: !!input,
            hiddenInput: !!hiddenInput,
            zipCodeInput: !!zipCodeInput
        });

        // Actualizar inputs
        input.value = nombre;
        hiddenInput.value = slug;

        // Autocompletar código postal SIEMPRE (sobrescribir o limpiar)
        if (zipCodeInput) {
            // Si hay código postal, llenarlo; si no, limpiar el campo
            if (codigoPostal && codigoPostal.trim() !== '') {
                console.log('✅ Llenando código postal:', codigoPostal);
                zipCodeInput.value = codigoPostal;

                // Actualizar AppState si existe
                if (typeof AppState !== 'undefined' && AppState.formData) {
                    AppState.formData.zipCode = codigoPostal;
                    console.log('✅ AppState actualizado con CP:', codigoPostal);
                }

                // Actualizar localStorage
                try {
                    const savedData = JSON.parse(localStorage.getItem('formProgress') || '{}');
                    savedData.zipCode = codigoPostal;
                    savedData.codigoPostal = codigoPostal;
                    localStorage.setItem('formProgress', JSON.stringify(savedData));
                    console.log('✅ localStorage actualizado con CP:', codigoPostal);
                } catch (e) {
                    console.warn('⚠️ No se pudo actualizar localStorage:', e);
                }

                // Validar el campo de código postal
                if (typeof FormValidation !== 'undefined') {
                    FormValidation.clearError(zipCodeInput);
                    if (codigoPostal.length === 5) {
                        FormValidation.markAsValid(zipCodeInput);
                    }
                }
            } else {
                // Si no hay código postal, limpiar el campo
                console.log('⚠️ Colonia sin código postal, limpiando campo');
                this.clearZipCode();
            }

            // Disparar eventos para que otros sistemas detecten el cambio
            zipCodeInput.dispatchEvent(new Event('input', { bubbles: true }));
            zipCodeInput.dispatchEvent(new Event('change', { bubbles: true }));

            console.log('✅ Valor final del CP:', zipCodeInput.value || '(vacío)');
        } else {
            console.error('❌ No se encontró el campo zip-code');
        }

        // Marcar como seleccionada
        this.selectedColonia = { nombre, slug, codigoPostal };

        // Validar campo de colonia
        if (typeof FormValidation !== 'undefined') {
            FormValidation.clearError(input);
            FormValidation.markAsValid(input);
        }

        // Ocultar sugerencias
        this.hideSuggestions();

        console.log('✅ Colonia seleccionada:', nombre, '- CP:', codigoPostal);
    },

    /**
     * Manejar teclado (flechas, enter, escape)
     */
    handleKeyboard(e) {
        const suggestionsBox = document.getElementById('colonia-suggestions');
        const items = suggestionsBox.querySelectorAll('.autocomplete-item');

        if (items.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.currentIndex = Math.min(this.currentIndex + 1, items.length - 1);
                this.highlightItem(items);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.currentIndex = Math.max(this.currentIndex - 1, -1);
                this.highlightItem(items);
                break;

            case 'Enter':
                e.preventDefault();
                if (this.currentIndex >= 0 && items[this.currentIndex]) {
                    const item = items[this.currentIndex];
                    this.selectColonia(
                        item.dataset.nombre,
                        item.dataset.slug,
                        item.dataset.cp
                    );
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.hideSuggestions();
                break;
        }
    },

    /**
     * Resaltar item con teclado
     */
    highlightItem(items) {
        items.forEach((item, index) => {
            if (index === this.currentIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    },

    /**
     * Normalizar string para comparación
     */
    normalizeString(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^a-z0-9\s]/g, '')      // Remover caracteres especiales
            .trim();
    },

    /**
     * Mostrar error
     */
    showError(message) {
        const input = document.getElementById('colonia');
        const errorElement = document.getElementById('colonia-error');

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('active');
        }

        if (input) {
            input.classList.add('error');
        }
    },

    /**
     * Cargar datos de calles desde JSON
     */
    /**
     * Cargar datos de calles según municipio
     */
    async loadCalles(municipality = 'culiacan') {
        try {
            const paths = this.resolveDatasetPaths('calles', municipality);
            console.log('📥 Cargando calles desde rutas candidatas...');
            console.log('📂 Rutas probadas calles:', paths);

            const data = await this.fetchJsonWithFallback(paths);

            // Extraer array de calles (puede venir como array directo o en propiedad)
            const callesArray = Array.isArray(data) ? data : (data.calles || []);

            this.calles = callesArray.map(calle => {
                // Manejar tanto strings como objetos
                const nombre = typeof calle === 'string' ? calle : (calle.nombre || calle);
                return {
                    nombre: nombre,
                    slug: this.generateSlug(nombre)
                };
            });

            console.log(`✅ Cargadas ${this.calles.length} calles de ${municipality}`);

            if (this.calles.length === 0) {
                console.warn('⚠️ No hay calles para', municipality);
            }
        } catch (error) {
            console.error('❌ Error al cargar calles:', error);
            this.showError('No se pudieron cargar las calles. Por favor, recarga la página.');
        }
    },

    /**
     * Recargar datos cuando cambia el municipio
     */
    async reloadData(municipality) {
        console.log('🔄 Recargando datos para:', municipality);

        this.currentMunicipality = municipality;

        // Limpiar inputs y selecciones
        const coloniaInput = document.getElementById('colonia');
        const addressInput = document.getElementById('address');
        const zipCodeInput = document.getElementById('zip-code');

        if (coloniaInput) {
            coloniaInput.value = '';
            this.selectedColonia = null;
        }
        if (addressInput) addressInput.value = '';
        if (zipCodeInput) zipCodeInput.value = '';

        // Recargar datos
        await Promise.all([
            this.loadColonias(municipality),
            this.loadCalles(municipality)
        ]);

        console.log('✅ Datos recargados:', this.colonias.length, 'colonias,', this.calles.length, 'calles');

        // Emitir evento para facilitar QA
        document.dispatchEvent(new CustomEvent('autocompleteDataLoaded', {
            detail: {
                municipality: municipality,
                coloniasCount: this.colonias.length,
                callesCount: this.calles.length
            }
        }));
    },

    /**
     * Setup listener para cambio de municipio
     */
    setupMunicipalityListener() {
        const municipalitySelect = document.getElementById('municipality');

        if (!municipalitySelect) {
            console.warn('⚠️ Select de municipio no encontrado');
            return;
        }

        municipalitySelect.addEventListener('change', async (e) => {
            const newMunicipality = e.target.value;
            console.log('🏙️ Municipio cambiado a:', newMunicipality);

            await this.reloadData(newMunicipality);
        });

        console.log('✅ Listener de municipio configurado');
    },

    /**
     * Setup event listeners para calles
     */
    setupStreetListeners() {
        const input = document.getElementById('address');
        const suggestionsBox = document.getElementById('address-suggestions');

        if (!input || !suggestionsBox) {
            console.warn('⚠️ Elementos de autocomplete de calles no encontrados');
            return;
        }

        // Input event - buscar mientras escribe
        input.addEventListener('input', debounce((e) => {
            const query = e.target.value.trim();

            if (query.length < 2) {
                this.hideStreetSuggestions();
                this.selectedCalle = null;
                return;
            }

            this.searchCalles(query);
        }, 200));

        // Focus event
        input.addEventListener('focus', (e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                this.searchCalles(query);
            }
        });

        // Blur event
        input.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideStreetSuggestions();
            }, 200);
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            this.handleStreetKeyboard(e);
        });

        // Click fuera para cerrar
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
                this.hideStreetSuggestions();
            }
        });
    },

    /**
     * Buscar calles que coincidan con el query
     */
    searchCalles(query) {
        const normalizedQuery = this.normalizeString(query);
        const queryTokens = normalizedQuery.split(' ').filter(Boolean);

        // Filtrar calles que coincidan
        const matches = this.calles.filter(calle => {
            const normalizedNombre = this.normalizeString(calle.nombre);

            // Método 1: Contiene el query completo
            if (normalizedNombre.includes(normalizedQuery)) {
                return true;
            }

            // Método 2: Todos los tokens del query están en el nombre
            if (queryTokens.length > 0 && queryTokens.every(token => normalizedNombre.includes(token))) {
                return true;
            }

            return false;
        });

        // Ordenar por relevancia
        matches.sort((a, b) => {
            const aNorm = this.normalizeString(a.nombre);
            const bNorm = this.normalizeString(b.nombre);

            // 1. Los que empiezan con el query van primero
            const aStarts = aNorm.startsWith(normalizedQuery);
            const bStarts = bNorm.startsWith(normalizedQuery);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            // 2. Los que tienen el query al inicio de una palabra
            const aWordStart = aNorm.split(' ').some(word => word.startsWith(normalizedQuery));
            const bWordStart = bNorm.split(' ').some(word => word.startsWith(normalizedQuery));

            if (aWordStart && !bWordStart) return -1;
            if (!aWordStart && bWordStart) return 1;

            // 3. Orden alfabético
            return a.nombre.localeCompare(b.nombre);
        });

        // Limitar resultados
        const limited = matches.slice(0, 8);

        this.showStreetSuggestions(limited, query);
    },

    /**
     * Mostrar sugerencias de calles
     */
    showStreetSuggestions(suggestions, query) {
        const suggestionsBox = document.getElementById('address-suggestions');

        if (suggestions.length === 0) {
            suggestionsBox.innerHTML = '<div class="autocomplete-no-results">No se encontraron calles</div>';
            suggestionsBox.classList.add('active');
            return;
        }

        suggestionsBox.innerHTML = suggestions.map((calle, index) => {
            const highlighted = this.highlightMatch(calle.nombre, query);

            return `
                <div class="autocomplete-item autocomplete-street-item" data-index="${index}" data-nombre="${calle.nombre}" data-slug="${calle.slug}">
                    <div class="autocomplete-item-title">${highlighted}</div>
                </div>
            `;
        }).join('');

        suggestionsBox.classList.add('active');
        this.currentIndex = -1;

        // Event listeners para cada sugerencia
        const items = suggestionsBox.querySelectorAll('.autocomplete-street-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                this.selectCalle(item.dataset.nombre, item.dataset.slug);
            });
        });
    },

    /**
     * Ocultar sugerencias de calles
     */
    hideStreetSuggestions() {
        const suggestionsBox = document.getElementById('address-suggestions');
        suggestionsBox.classList.remove('active');
        suggestionsBox.innerHTML = '';
        this.currentIndex = -1;
    },

    /**
     * Seleccionar calle
     */
    selectCalle(nombre, slug) {
        const input = document.getElementById('address');

        // Actualizar input
        input.value = nombre;

        // Marcar como seleccionada
        this.selectedCalle = { nombre, slug };

        // Validar campo
        if (typeof FormValidation !== 'undefined') {
            FormValidation.clearError(input);
            FormValidation.markAsValid(input);
        }

        // Ocultar sugerencias
        this.hideStreetSuggestions();

        console.log('✅ Calle seleccionada:', nombre);
    },

    /**
     * Manejar teclado para calles
     */
    handleStreetKeyboard(e) {
        const suggestionsBox = document.getElementById('address-suggestions');
        const items = suggestionsBox.querySelectorAll('.autocomplete-street-item');

        if (items.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.currentIndex = Math.min(this.currentIndex + 1, items.length - 1);
                this.highlightItem(items);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.currentIndex = Math.max(this.currentIndex - 1, -1);
                this.highlightItem(items);
                break;

            case 'Enter':
                e.preventDefault();
                if (this.currentIndex >= 0 && items[this.currentIndex]) {
                    const item = items[this.currentIndex];
                    this.selectCalle(item.dataset.nombre, item.dataset.slug);
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.hideStreetSuggestions();
                break;
        }
    }
};

// Exportar para uso global
window.Autocomplete = Autocomplete;
