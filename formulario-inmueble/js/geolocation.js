/**
 * GEOLOCATION.JS - Sistema de Geolocalización
 * Obtiene ubicación del usuario y autocompleta direcciones
 */

const Geolocation = {
    /**
     * Inicializar módulo de geolocalización
     */
    init() {
        console.log('📍 Inicializando módulo de geolocalización...');

        // Buscar botón de geolocalización
        const geoButton = document.getElementById('btn-geolocate');

        if (geoButton) {
            geoButton.addEventListener('click', () => {
                this.getCurrentLocation();
            });
        }

        // Verificar soporte del navegador
        if (!navigator.geolocation) {
            console.warn('⚠️ Geolocalización no soportada en este navegador');
            if (geoButton) {
                geoButton.disabled = true;
                geoButton.title = 'Tu navegador no soporta geolocalización';
            }
        }

        console.log('✅ Módulo de geolocalización inicializado');
    },

    /**
     * Obtener ubicación actual del usuario
     */
    getCurrentLocation() {
        console.log('📍 Solicitando ubicación del usuario...');

        const geoButton = document.getElementById('btn-geolocate');

        // Mostrar estado de carga
        if (geoButton) {
            geoButton.disabled = true;
            geoButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        // Opciones de geolocalización
        const options = {
            enableHighAccuracy: true,  // Precisión alta
            timeout: 10000,            // 10 segundos timeout
            maximumAge: 0              // No usar caché
        };

        // Solicitar ubicación
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.onLocationSuccess(position);
            },
            (error) => {
                this.onLocationError(error);
            },
            options
        );
    },

    /**
     * Éxito al obtener ubicación
     */
    onLocationSuccess(position) {
        console.log('✅ Ubicación obtenida:', position.coords);

        const { latitude, longitude, accuracy } = position.coords;

        // Mostrar coordenadas en consola
        console.log(`Latitud: ${latitude}, Longitud: ${longitude}, Precisión: ${accuracy}m`);

        // Hacer reverse geocoding
        this.reverseGeocode(latitude, longitude);

        // Restaurar botón
        const geoButton = document.getElementById('btn-geolocate');
        if (geoButton) {
            geoButton.disabled = false;
            geoButton.innerHTML = '<i class="fas fa-location-arrow"></i>';
        }

        // Guardar coordenadas en AppState (si está disponible)
        if (typeof AppState !== 'undefined') {
            AppState.formData.latitude = latitude;
            AppState.formData.longitude = longitude;
            AppState.formData.accuracy = accuracy;
        }
    },

    /**
     * Error al obtener ubicación
     */
    onLocationError(error) {
        console.error('❌ Error al obtener ubicación:', error);

        let errorMessage = '';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Permiso denegado. Por favor, habilita el acceso a tu ubicación en la configuración del navegador.';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Ubicación no disponible. Verifica tu conexión GPS o Wi-Fi.';
                break;
            case error.TIMEOUT:
                errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
                break;
            default:
                errorMessage = 'Error desconocido al obtener ubicación.';
        }

        // Mostrar mensaje de error
        this.showGeolocationError(errorMessage);

        // Restaurar botón
        const geoButton = document.getElementById('btn-geolocate');
        if (geoButton) {
            geoButton.disabled = false;
            geoButton.innerHTML = '<i class="fas fa-location-arrow"></i>';
        }
    },

    /**
     * Reverse Geocoding - Obtener dirección desde coordenadas
     */
    async reverseGeocode(lat, lng) {
        console.log('🌍 Obteniendo dirección desde coordenadas...');

        try {
            // Usar API de OpenStreetMap Nominatim (gratis, sin API key)
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'es-MX',
                    'User-Agent': 'FormularioInmueble/1.0'
                }
            });

            if (!response.ok) {
                throw new Error('Error en la respuesta de Nominatim');
            }

            const data = await response.json();
            console.log('📍 Dirección obtenida:', data);

            // Autocompletar campos
            this.fillAddressFields(data);

        } catch (error) {
            console.error('❌ Error en reverse geocoding:', error);
            this.showGeolocationError('No se pudo obtener la dirección automáticamente. Por favor, ingrésala manualmente.');
        }
    },

    /**
     * Autocompletar campos de dirección
     */
    fillAddressFields(data) {
        console.log('📝 Autocompletando campos de dirección...');

        const address = data.address || {};

        // Calle y número
        let street = '';
        if (address.road) {
            street = address.road;
            if (address.house_number) {
                street += ` ${address.house_number}`;
            }
        }

        // Colonia/Fraccionamiento
        let colonia = address.suburb || address.neighbourhood || address.quarter || '';

        // Código Postal
        let zipCode = address.postcode || '';

        // Actualizar inputs
        const streetInput = document.getElementById('street');
        const coloniaSelect = document.getElementById('colonia');
        const zipCodeInput = document.getElementById('zip-code');

        // Llenar calle
        if (streetInput && street) {
            streetInput.value = street;
            streetInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Intentar seleccionar colonia
        if (coloniaSelect && colonia) {
            const normalizedColonia = this.normalizeString(colonia);
            const options = coloniaSelect.querySelectorAll('option');

            let matchFound = false;
            for (let option of options) {
                const normalizedOption = this.normalizeString(option.textContent);

                // Buscar coincidencia exacta o parcial
                if (normalizedOption.includes(normalizedColonia) || normalizedColonia.includes(normalizedOption)) {
                    coloniaSelect.value = option.value;
                    coloniaSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    matchFound = true;
                    console.log('✅ Colonia encontrada:', option.textContent);
                    break;
                }
            }

            if (!matchFound) {
                console.log('⚠️ No se encontró coincidencia para colonia:', colonia);
                this.showGeolocationWarning(`Colonia "${colonia}" no encontrada. Por favor, selecciónala manualmente.`);
            }
        }

        // Llenar código postal
        if (zipCodeInput && zipCode) {
            zipCodeInput.value = zipCode;
            zipCodeInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Mostrar mensaje de éxito
        this.showGeolocationSuccess('¡Ubicación detectada! Verifica los datos autocompletados.');
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
     * Mostrar mensaje de error
     */
    showGeolocationError(message) {
        // Buscar o crear contenedor de notificación
        let notification = document.getElementById('geo-notification');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'geo-notification';
            notification.className = 'geo-notification geo-notification-error';
            document.body.appendChild(notification);
        }

        notification.className = 'geo-notification geo-notification-error active';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;

        // Auto-ocultar después de 6 segundos
        setTimeout(() => {
            notification.classList.remove('active');
        }, 6000);
    },

    /**
     * Mostrar mensaje de advertencia
     */
    showGeolocationWarning(message) {
        let notification = document.getElementById('geo-notification');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'geo-notification';
            notification.className = 'geo-notification geo-notification-warning';
            document.body.appendChild(notification);
        }

        notification.className = 'geo-notification geo-notification-warning active';
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;

        setTimeout(() => {
            notification.classList.remove('active');
        }, 5000);
    },

    /**
     * Mostrar mensaje de éxito
     */
    showGeolocationSuccess(message) {
        let notification = document.getElementById('geo-notification');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'geo-notification';
            notification.className = 'geo-notification geo-notification-success';
            document.body.appendChild(notification);
        }

        notification.className = 'geo-notification geo-notification-success active';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;

        setTimeout(() => {
            notification.classList.remove('active');
        }, 4000);
    }
};

// Exportar para uso global
window.Geolocation = Geolocation;
