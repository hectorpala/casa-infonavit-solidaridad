/**
 * APP.JS - Inicialización Principal del Formulario
 * Formulario Multi-Paso de Valuación de Inmuebles
 */

// Estado global de la aplicación
const AppState = {
    currentStep: 1,
    currentSubstep: 1,
    totalSteps: 4,
    formData: {},
    isSubmitting: false,

    // Configuración de pasos
    stepsConfig: {
        1: { substeps: 6, name: 'Ubicación' },
        2: { substeps: 1, name: 'Tipo de Inmueble' },
        3: { substeps: 1, name: 'Características' },
        4: { substeps: 1, name: 'Contacto' }
    }
};

/**
 * Inicialización de la aplicación
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando formulario de valuación...');

    // Inicializar módulos
    initializeModules();

    // Configurar event listeners
    setupEventListeners();

    // Mostrar primer paso
    showStep(1);
    showSubstep(1);

    // Actualizar barra de progreso
    updateProgressBar();

    console.log('✅ Formulario inicializado correctamente');
});

/**
 * Inicializar todos los módulos
 */
function initializeModules() {
    // Cargar datos desde localStorage si existen
    loadSavedData();

    // Inicializar validaciones
    if (typeof FormValidation !== 'undefined') {
        FormValidation.init();
    }

    // Inicializar geolocalización
    if (typeof Geolocation !== 'undefined') {
        Geolocation.init();
    }

    // Inicializar autocomplete de colonias
    if (typeof Autocomplete !== 'undefined') {
        Autocomplete.init();
    }
}

/**
 * Configurar todos los event listeners
 */
function setupEventListeners() {
    // Botones de navegación
    const btnContinue = document.getElementById('btn-continue');
    const btnBack = document.getElementById('btn-back');
    const btnSubmit = document.getElementById('btn-submit');

    if (btnContinue) {
        btnContinue.addEventListener('click', handleContinue);
    }

    if (btnBack) {
        btnBack.addEventListener('click', handleBack);
    }

    if (btnSubmit) {
        btnSubmit.addEventListener('click', handleSubmit);
    }

    // Property type cards
    const propertyCards = document.querySelectorAll('.property-type-card');
    propertyCards.forEach(card => {
        card.addEventListener('click', function() {
            selectPropertyType(this);
        });
    });

    // Inputs - guardar en tiempo real
    const allInputs = document.querySelectorAll('.form-control');
    allInputs.forEach(input => {
        input.addEventListener('change', function() {
            saveFormData(this.name || this.id, this.value);
        });

        // Autosave en inputs de texto
        if (input.type === 'text' || input.type === 'email' || input.tagName === 'TEXTAREA') {
            input.addEventListener('input', debounce(function() {
                saveFormData(this.name || this.id, this.value);
            }, 500));
        }
    });

    // Character counter para textarea
    const commentsField = document.getElementById('comments');
    if (commentsField) {
        commentsField.addEventListener('input', updateCharCounter);
    }

    // Checkbox de términos
    const termsCheckbox = document.getElementById('terms');
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', function() {
            const error = document.getElementById('terms-error');
            if (this.checked && error) {
                error.classList.remove('active');
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        // Enter para continuar (excepto en textarea)
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            handleContinue();
        }

        // Escape para retroceder
        if (e.key === 'Escape' && AppState.currentStep > 1) {
            handleBack();
        }
    });
}

/**
 * Manejar clic en botón Continuar
 */
function handleContinue() {
    console.log('→ Continuar desde paso', AppState.currentStep, 'substep', AppState.currentSubstep);

    // Validar substep actual
    if (!validateCurrentSubstep()) {
        console.warn('⚠️ Validación fallida');
        return;
    }

    // Guardar datos del substep actual
    saveCurrentSubstepData();

    // Determinar siguiente substep o paso
    const totalSubsteps = AppState.stepsConfig[AppState.currentStep].substeps;

    if (AppState.currentSubstep < totalSubsteps) {
        // Siguiente substep
        AppState.currentSubstep++;
        showSubstep(AppState.currentSubstep);
    } else {
        // Siguiente paso
        if (AppState.currentStep < AppState.totalSteps) {
            AppState.currentStep++;
            AppState.currentSubstep = 1;

            showStep(AppState.currentStep);
            showSubstep(1);

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Último paso completado, preparar submit
            prepareSubmit();
        }
    }

    // Actualizar UI
    updateNavigationButtons();
    updateProgressBar();
    updateStepIndicator();
}

/**
 * Manejar clic en botón Atrás
 */
function handleBack() {
    console.log('← Atrás desde paso', AppState.currentStep, 'substep', AppState.currentSubstep);

    if (AppState.currentSubstep > 1) {
        // Substep anterior
        AppState.currentSubstep--;
        showSubstep(AppState.currentSubstep);
    } else if (AppState.currentStep > 1) {
        // Paso anterior
        AppState.currentStep--;
        const previousStepSubsteps = AppState.stepsConfig[AppState.currentStep].substeps;
        AppState.currentSubstep = previousStepSubsteps;

        showStep(AppState.currentStep);
        showSubstep(AppState.currentSubstep);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Actualizar UI
    updateNavigationButtons();
    updateProgressBar();
    updateStepIndicator();
}

/**
 * Preparar envío del formulario
 */
function prepareSubmit() {
    console.log('📝 Preparando envío del formulario...');

    // Ocultar botón continuar, mostrar botón submit
    const btnContinue = document.getElementById('btn-continue');
    const btnSubmit = document.getElementById('btn-submit');

    if (btnContinue) btnContinue.style.display = 'none';
    if (btnSubmit) btnSubmit.style.display = 'inline-flex';
}

/**
 * Manejar envío del formulario
 */
async function handleSubmit() {
    console.log('📤 Enviando formulario...');

    // Validar todo el formulario
    if (!validateCurrentSubstep()) {
        return;
    }

    // Verificar términos y condiciones
    const termsCheckbox = document.getElementById('terms');
    if (termsCheckbox && !termsCheckbox.checked) {
        const error = document.getElementById('terms-error');
        if (error) {
            error.textContent = 'Debes aceptar los términos y condiciones';
            error.classList.add('active');
        }
        return;
    }

    // Evitar envíos múltiples
    if (AppState.isSubmitting) {
        return;
    }

    AppState.isSubmitting = true;

    // Mostrar loading overlay
    showLoadingOverlay();

    try {
        // Geocodificar dirección completa para obtener coordenadas exactas
        console.log('🗺️ Geocodificando dirección...');
        let geocodingResult = null;

        if (typeof Geocoding !== 'undefined') {
            geocodingResult = await Geocoding.geocodeOnSubmit();
        }

        // Recopilar todos los datos del formulario
        const formData = collectAllFormData();

        // Agregar resultado de geocodificación
        if (geocodingResult) {
            formData.coordinates = {
                latitude: geocodingResult.latitude,
                longitude: geocodingResult.longitude,
                accuracy: geocodingResult.accuracy,
                service: geocodingResult.service,
                formattedAddress: geocodingResult.formattedAddress
            };
        }

        console.log('📦 Datos del formulario:', formData);

        // Simular envío (reemplazar con API real)
        await submitFormData(formData);

        // Éxito
        hideLoadingOverlay();
        showSuccessMessage();

        // Limpiar localStorage
        clearSavedData();

    } catch (error) {
        console.error('❌ Error al enviar formulario:', error);
        hideLoadingOverlay();
        alert('Hubo un error al enviar el formulario. Por favor, intenta de nuevo.');
        AppState.isSubmitting = false;
    }
}

/**
 * Validar substep actual
 */
function validateCurrentSubstep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${AppState.currentStep}"]`);
    if (!currentStepElement) return false;

    const currentSubstepElement = currentStepElement.querySelector(`.substep[data-substep="${AppState.currentSubstep}"]`);
    if (!currentSubstepElement) return false;

    // Obtener todos los campos requeridos del substep actual
    const requiredFields = currentSubstepElement.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!FormValidation.validateField(field)) {
            isValid = false;
        }
    });

    return isValid;
}

/**
 * Guardar datos del substep actual
 */
function saveCurrentSubstepData() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${AppState.currentStep}"]`);
    if (!currentStepElement) return;

    const currentSubstepElement = currentStepElement.querySelector(`.substep[data-substep="${AppState.currentSubstep}"]`);
    if (!currentSubstepElement) return;

    const fields = currentSubstepElement.querySelectorAll('.form-control');
    fields.forEach(field => {
        const name = field.name || field.id;
        const value = field.value;
        if (name && value) {
            saveFormData(name, value);
        }
    });
}

/**
 * Mostrar paso específico
 */
function showStep(stepNumber) {
    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Mostrar paso actual
    const stepElement = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (stepElement) {
        stepElement.classList.add('active');
    }
}

/**
 * Mostrar substep específico
 */
function showSubstep(substepNumber) {
    const currentStepElement = document.querySelector(`.form-step[data-step="${AppState.currentStep}"]`);
    if (!currentStepElement) return;

    // Ocultar todos los substeps del paso actual
    currentStepElement.querySelectorAll('.substep').forEach(substep => {
        substep.classList.remove('active');
    });

    // Mostrar substep actual
    const substepElement = currentStepElement.querySelector(`.substep[data-substep="${substepNumber}"]`);
    if (substepElement) {
        substepElement.classList.add('active');
    }
}

/**
 * Actualizar botones de navegación
 */
function updateNavigationButtons() {
    const btnBack = document.getElementById('btn-back');
    const btnContinue = document.getElementById('btn-continue');

    // Mostrar/ocultar botón Atrás
    if (btnBack) {
        if (AppState.currentStep === 1 && AppState.currentSubstep === 1) {
            btnBack.style.display = 'none';
        } else {
            btnBack.style.display = 'inline-flex';
        }
    }

    // Actualizar texto del botón continuar
    if (btnContinue) {
        const isLastSubstep = AppState.currentSubstep === AppState.stepsConfig[AppState.currentStep].substeps;
        const isLastStep = AppState.currentStep === AppState.totalSteps;

        if (isLastStep && isLastSubstep) {
            btnContinue.textContent = 'Revisar y Enviar';
        } else {
            btnContinue.textContent = 'Continuar';
        }
    }
}

/**
 * Actualizar barra de progreso
 */
function updateProgressBar() {
    // Calcular progreso total
    let totalSubsteps = 0;
    let completedSubsteps = 0;

    // Contar substeps completados
    for (let step = 1; step <= AppState.totalSteps; step++) {
        const stepSubsteps = AppState.stepsConfig[step].substeps;
        totalSubsteps += stepSubsteps;

        if (step < AppState.currentStep) {
            completedSubsteps += stepSubsteps;
        } else if (step === AppState.currentStep) {
            completedSubsteps += (AppState.currentSubstep - 1);
        }
    }

    const percentage = Math.round((completedSubsteps / totalSubsteps) * 100);

    // Actualizar barra
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }

    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
    }
}

/**
 * Actualizar indicador de paso en header
 */
function updateStepIndicator() {
    const currentStepSpan = document.getElementById('current-step');
    if (currentStepSpan) {
        currentStepSpan.textContent = AppState.currentStep;
    }
}

/**
 * Seleccionar tipo de propiedad
 */
function selectPropertyType(card) {
    // Remover selección previa
    document.querySelectorAll('.property-type-card').forEach(c => {
        c.classList.remove('selected');
    });

    // Seleccionar actual
    card.classList.add('selected');

    // Guardar valor
    const value = card.dataset.value;
    const hiddenInput = document.getElementById('property-type');
    if (hiddenInput) {
        hiddenInput.value = value;
        saveFormData('property-type', value);
    }

    // Remover error si existe
    const error = document.getElementById('property-type-error');
    if (error) {
        error.classList.remove('active');
    }
}

/**
 * Actualizar contador de caracteres
 */
function updateCharCounter() {
    const commentsField = document.getElementById('comments');
    const counter = document.getElementById('comments-count');

    if (commentsField && counter) {
        counter.textContent = commentsField.value.length;
    }
}

/**
 * Guardar datos en localStorage
 */
function saveFormData(key, value) {
    AppState.formData[key] = value;
    localStorage.setItem('formData', JSON.stringify(AppState.formData));
}

/**
 * Cargar datos guardados desde localStorage
 */
function loadSavedData() {
    const savedData = localStorage.getItem('formData');
    if (savedData) {
        try {
            AppState.formData = JSON.parse(savedData);
            console.log('📥 Datos cargados desde localStorage');

            // Restaurar valores en el formulario
            Object.keys(AppState.formData).forEach(key => {
                const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                if (field) {
                    field.value = AppState.formData[key];
                }
            });
        } catch (error) {
            console.error('❌ Error al cargar datos guardados:', error);
        }
    }
}

/**
 * Limpiar datos guardados
 */
function clearSavedData() {
    localStorage.removeItem('formData');
    AppState.formData = {};
}

/**
 * Cargar datos de colonias
 */
async function loadColoniasData() {
    // Este método puede cargar dinámicamente las colonias si es necesario
    // Por ahora las colonias están hardcodeadas en el HTML
    console.log('✅ Colonias cargadas (estáticas en HTML)');
}

/**
 * Recopilar todos los datos del formulario
 */
function collectAllFormData() {
    const formData = {};

    // Recopilar todos los inputs, selects, textareas
    const allFields = document.querySelectorAll('.form-control, input[type="hidden"]');

    allFields.forEach(field => {
        const name = field.name || field.id;
        if (name) {
            if (field.type === 'checkbox') {
                formData[name] = field.checked;
            } else {
                formData[name] = field.value;
            }
        }
    });

    return formData;
}

/**
 * Enviar datos del formulario usando Netlify Forms
 */
async function submitFormData(data) {
    try {
        console.log('📤 Enviando a Netlify Forms:', data);

        // Convertir datos a FormData para Netlify Forms
        const formData = new FormData();
        formData.append('form-name', 'formulario-inmueble');

        // Agregar todos los campos
        Object.keys(data).forEach(key => {
            formData.append(key, data[key] || '');
        });

        // Enviar a Netlify Forms
        const response = await fetch('/', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error al enviar formulario');
        }

        console.log('✅ Formulario enviado exitosamente a Netlify Forms');
        return { success: true, message: 'Formulario enviado correctamente' };

    } catch (error) {
        console.error('❌ Error al enviar formulario:', error);
        throw error;
    }
}

/**
 * Mostrar overlay de carga
 */
function showLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

/**
 * Ocultar overlay de carga
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Mostrar mensaje de éxito
 */
function showSuccessMessage() {
    // Ocultar formulario
    const formWrapper = document.querySelector('.form-wrapper');
    if (formWrapper) {
        formWrapper.style.display = 'none';
    }

    // Mostrar mensaje de éxito
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        successMessage.style.display = 'block';
    }

    // Actualizar barra de progreso a 100%
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');

    if (progressBar) progressBar.style.width = '100%';
    if (progressPercentage) progressPercentage.textContent = '100%';
}

/**
 * Utilidad: Debounce
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

// Exportar para uso global
window.AppState = AppState;
