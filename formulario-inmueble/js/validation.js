/**
 * VALIDATION.JS - Sistema de Validación de Formularios
 * Validación en tiempo real con mensajes de error personalizados
 */

const FormValidation = {
    // Mensajes de error
    errorMessages: {
        required: 'Este campo es requerido',
        email: 'Ingresa un correo electrónico válido',
        phone: 'El teléfono debe tener 10 dígitos',
        zipCode: 'El código postal debe tener 5 dígitos',
        minLength: 'Mínimo {min} caracteres',
        maxLength: 'Máximo {max} caracteres',
        pattern: 'El formato ingresado no es válido',
        number: 'Ingresa un número válido',
        min: 'El valor mínimo es {min}',
        max: 'El valor máximo es {max}'
    },

    /**
     * Inicializar validaciones
     */
    init() {
        console.log('🔍 Inicializando sistema de validación...');

        // Event listeners para validación en tiempo real
        const allInputs = document.querySelectorAll('.form-control');

        allInputs.forEach(input => {
            // Validar en blur (al perder foco)
            input.addEventListener('blur', function() {
                FormValidation.validateField(this);
            });

            // Validar en input (mientras escribe) para inputs de texto
            if (input.type === 'text' || input.type === 'email' || input.type === 'tel') {
                input.addEventListener('input', debounce(function() {
                    if (this.value.length > 0) {
                        FormValidation.validateField(this);
                    }
                }, 300));
            }

            // Limpiar error en focus
            input.addEventListener('focus', function() {
                FormValidation.clearError(this);
            });
        });

        console.log('✅ Sistema de validación inicializado');
    },

    /**
     * Validar un campo específico
     */
    validateField(field) {
        // Limpiar error previo
        this.clearError(field);

        let isValid = true;
        let errorMessage = '';

        // 1. Validar campo requerido
        if (field.hasAttribute('required')) {
            if (field.type === 'checkbox') {
                if (!field.checked) {
                    isValid = false;
                    errorMessage = this.errorMessages.required;
                }
            } else {
                if (!field.value || field.value.trim() === '') {
                    isValid = false;
                    errorMessage = this.errorMessages.required;
                }
            }
        }

        // Si el campo está vacío y no es requerido, no validar más
        if (!field.value && !field.hasAttribute('required')) {
            return true;
        }

        // 2. Validar por tipo de input
        if (isValid && field.value) {
            switch (field.type) {
                case 'email':
                    if (!this.isValidEmail(field.value)) {
                        isValid = false;
                        errorMessage = this.errorMessages.email;
                    }
                    break;

                case 'tel':
                    if (!this.isValidPhone(field.value)) {
                        isValid = false;
                        errorMessage = this.errorMessages.phone;
                    }
                    break;

                case 'number':
                    if (!this.isValidNumber(field.value)) {
                        isValid = false;
                        errorMessage = this.errorMessages.number;
                    }
                    break;
            }
        }

        // 3. Validar patrón (pattern attribute)
        if (isValid && field.hasAttribute('pattern') && field.value) {
            const pattern = new RegExp(field.getAttribute('pattern'));
            if (!pattern.test(field.value)) {
                isValid = false;
                errorMessage = this.errorMessages.pattern;

                // Mensajes específicos por ID
                if (field.id === 'zip-code') {
                    errorMessage = this.errorMessages.zipCode;
                } else if (field.id === 'phone') {
                    errorMessage = this.errorMessages.phone;
                }
            }
        }

        // 4. Validar longitud mínima
        if (isValid && field.hasAttribute('minlength') && field.value) {
            const minLength = parseInt(field.getAttribute('minlength'));
            if (field.value.length < minLength) {
                isValid = false;
                errorMessage = this.errorMessages.minLength.replace('{min}', minLength);
            }
        }

        // 5. Validar longitud máxima
        if (isValid && field.hasAttribute('maxlength') && field.value) {
            const maxLength = parseInt(field.getAttribute('maxlength'));
            if (field.value.length > maxLength) {
                isValid = false;
                errorMessage = this.errorMessages.maxLength.replace('{max}', maxLength);
            }
        }

        // 6. Validar rango numérico
        if (isValid && field.type === 'number' && field.value) {
            if (field.hasAttribute('min')) {
                const min = parseFloat(field.getAttribute('min'));
                if (parseFloat(field.value) < min) {
                    isValid = false;
                    errorMessage = this.errorMessages.min.replace('{min}', min);
                }
            }

            if (field.hasAttribute('max')) {
                const max = parseFloat(field.getAttribute('max'));
                if (parseFloat(field.value) > max) {
                    isValid = false;
                    errorMessage = this.errorMessages.max.replace('{max}', max);
                }
            }
        }

        // Mostrar error si no es válido
        if (!isValid) {
            this.showError(field, errorMessage);
            return false;
        }

        // Marcar como válido
        this.markAsValid(field);
        return true;
    },

    /**
     * Mostrar mensaje de error
     */
    showError(field, message) {
        // Agregar clase error al input
        field.classList.add('error');
        field.classList.remove('valid');

        // Buscar elemento de error
        const errorId = field.id ? `${field.id}-error` : `${field.name}-error`;
        const errorElement = document.getElementById(errorId);

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('active');
        }

        // Agregar animación shake
        field.classList.add('shake');
        setTimeout(() => {
            field.classList.remove('shake');
        }, 300);
    },

    /**
     * Limpiar error
     */
    clearError(field) {
        field.classList.remove('error');

        const errorId = field.id ? `${field.id}-error` : `${field.name}-error`;
        const errorElement = document.getElementById(errorId);

        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('active');
        }
    },

    /**
     * Marcar campo como válido
     */
    markAsValid(field) {
        field.classList.remove('error');
        field.classList.add('valid');
    },

    /**
     * Validar email
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Validar teléfono (10 dígitos)
     */
    isValidPhone(phone) {
        const regex = /^\d{10}$/;
        return regex.test(phone.replace(/\s/g, ''));
    },

    /**
     * Validar número
     */
    isValidNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    /**
     * Validar código postal (5 dígitos)
     */
    isValidZipCode(zipCode) {
        const regex = /^\d{5}$/;
        return regex.test(zipCode);
    },

    /**
     * Validar formulario completo
     */
    validateForm() {
        let isValid = true;
        const allRequiredFields = document.querySelectorAll('[required]');

        allRequiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    },

    /**
     * Validar paso específico
     */
    validateStep(stepNumber) {
        const stepElement = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
        if (!stepElement) return false;

        let isValid = true;
        const requiredFields = stepElement.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }
};

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
window.FormValidation = FormValidation;
