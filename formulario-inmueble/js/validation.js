/**
 * VALIDATION.JS - Sistema de Validación UX en Tiempo Real
 * Validación accesible con ARIA y feedback visual inmediato
 */

(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        console.log('🔍 Sistema de validación inicializado');
        setupValidation();
    }

    function setupValidation() {
        // Utilidades
        const $ = (selector, context = document) => context.querySelector(selector);

        const setError = (input, msgEl, message) => {
            if (message) {
                input.classList.add('border-red-500', 'focus:ring-red-500');
                input.classList.remove('border-neutral-300', 'focus:ring-indigo-500');
                input.setAttribute('aria-invalid', 'true');
                msgEl.textContent = message;
                msgEl.classList.remove('hidden');
            } else {
                input.classList.remove('border-red-500', 'focus:ring-red-500');
                input.classList.add('border-neutral-300', 'focus:ring-indigo-500');
                input.removeAttribute('aria-invalid');
                msgEl.textContent = '';
                msgEl.classList.add('hidden');
            }
        };

        // Validadores
        const required = v => v && v.trim().length > 0;
        const isCP = v => /^\d{5}$/.test(v.trim());
        const isNumExt = v => /^[A-Za-z0-9\-\s]{1,10}$/.test(v.trim());

        // Referencias a elementos del formulario
        const state = $('#state');
        const municipality = $('#municipality');
        const colonia = $('#colonia');
        const address = $('#address');
        const numExt = $('#exterior-number');
        const zipCode = $('#zip-code');
        const btnGeocode = $('#btn-geocode');

        // Referencias a mensajes de error
        const errState = $('#err-state');
        const errMunicipality = $('#err-municipality');
        const errColonia = $('#err-colonia');
        const errAddress = $('#err-address');
        const errNumExt = $('#err-exterior-number');
        const errZipCode = $('#err-zip-code');

        // Verificar que todos los elementos existen
        if (!state || !municipality || !colonia || !address || !numExt || !zipCode || !btnGeocode) {
            console.warn('⚠️ No se encontraron todos los elementos del formulario para validación');
            return;
        }

        // Validador central
        function validateAll() {
            let isValid = true;

            // Validar Estado
            if (!state.value || state.value === '') {
                setError(state, errState, 'Selecciona un estado.');
                isValid = false;
            } else {
                setError(state, errState, '');
            }

            // Validar Municipio (solo si no está disabled)
            if (!municipality.disabled) {
                if (!municipality.value || municipality.value === '') {
                    setError(municipality, errMunicipality, 'Selecciona un municipio.');
                    isValid = false;
                } else {
                    setError(municipality, errMunicipality, '');
                }
            }

            // Validar Colonia
            if (!required(colonia.value)) {
                setError(colonia, errColonia, 'La colonia es obligatoria.');
                isValid = false;
            } else {
                setError(colonia, errColonia, '');
            }

            // Validar Calle
            if (!required(address.value)) {
                setError(address, errAddress, 'La calle es obligatoria.');
                isValid = false;
            } else {
                setError(address, errAddress, '');
            }

            // Validar Número Exterior
            if (!required(numExt.value)) {
                setError(numExt, errNumExt, 'El número exterior es obligatorio.');
                isValid = false;
            } else if (!isNumExt(numExt.value)) {
                setError(numExt, errNumExt, 'Número exterior inválido (máx. 10 caracteres alfanuméricos).');
                isValid = false;
            } else {
                setError(numExt, errNumExt, '');
            }

            // Validar Código Postal
            if (!required(zipCode.value)) {
                setError(zipCode, errZipCode, 'El código postal es obligatorio.');
                isValid = false;
            } else if (!isCP(zipCode.value)) {
                setError(zipCode, errZipCode, 'El C.P. debe tener exactamente 5 dígitos.');
                isValid = false;
            } else {
                setError(zipCode, errZipCode, '');
            }

            // Habilitar/deshabilitar botón
            btnGeocode.disabled = !isValid;

            return isValid;
        }

        // Eventos de validación en tiempo real
        ['input', 'blur', 'change'].forEach(eventType => {
            state.addEventListener(eventType, validateAll);
            municipality.addEventListener(eventType, validateAll);
            colonia.addEventListener(eventType, validateAll);
            address.addEventListener(eventType, validateAll);
            numExt.addEventListener(eventType, validateAll);
            zipCode.addEventListener(eventType, validateAll);
        });

        // Trim automático en blur
        [colonia, address, numExt, zipCode].forEach(input => {
            input.addEventListener('blur', () => {
                input.value = input.value.trim();
            });
        });

        // Solo permitir números en código postal
        zipCode.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });

        // Gate de acción en submit
        const form = $('#geocoding-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                if (!validateAll()) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Focus al primer campo con error
                    const firstError = document.querySelector('[aria-invalid="true"]');
                    if (firstError) {
                        firstError.focus({ preventScroll: false });

                        // Scroll suave al primer error
                        firstError.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }

                    // Notificación visual
                    showValidationError();

                    return false;
                }
                // Si la validación pasa, el formulario continúa con su flujo normal
            });
        }

        // Validación inicial (deshabilitar botón al cargar)
        validateAll();

        console.log('✅ Validación en tiempo real configurada');
    }

    /**
     * Mostrar notificación de error de validación
     */
    function showValidationError() {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = 'notification error bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-slideInRight';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle text-red-500 text-xl"></i>
            <div class="notification-message text-red-900">
                <strong>Formulario incompleto</strong><br>
                <span class="text-sm text-red-700">Por favor, corrige los campos marcados en rojo.</span>
            </div>
        `;

        container.appendChild(notification);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Animación CSS para notificaciones
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .animate-slideInRight {
            animation: slideInRight 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);

})();
