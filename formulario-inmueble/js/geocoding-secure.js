/**
 * GEOCODING-SECURE.JS - Sistema de Geocodificación SEGURO
 * Usa backend proxy para ocultar API keys
 *
 * PRODUCCIÓN: Renombrar a geocoding.js
 */

const Geocoding = {
    // Configuración
    config: {
        useProxy: true, // TRUE en producción, FALSE en desarrollo
        proxyUrl: '/.netlify/functions/geocode', // Netlify Functions
        fallbackToNominatim: true // Siempre usar Nominatim como fallback
    },

    /**
     * Geocodificar dirección completa con backend seguro
     */
    async geocodeAddress(addressData) {
        console.log('🗺️ Geocodificando dirección completa...');

        // Construir dirección completa
        const fullAddress = this.buildFullAddress(addressData);
        console.log('📍 Dirección a geocodificar:', fullAddress);

        let result = null;

        // 1. Intentar con backend proxy (Google Maps vía servidor)
        if (this.config.useProxy) {
            result = await this.geocodeWithProxy(fullAddress);
            if (result) {
                console.log('✅ Coordenadas obtenidas con Google Maps (vía proxy seguro)');
                return result;
            }
        }

        // 2. Fallback a Nominatim (gratis, sin API key)
        if (this.config.fallbackToNominatim) {
            result = await this.geocodeWithNominatim(fullAddress);
            if (result) {
                console.log('✅ Coordenadas obtenidas con Nominatim (OpenStreetMap)');
                return result;
            }
        }

        console.error('❌ No se pudieron obtener coordenadas con ningún servicio');
        return null;
    },

    /**
     * Construir dirección completa desde los datos del formulario
     */
    buildFullAddress(data) {
        const parts = [];

        // Calle + Número + Número interior (opcional)
        if (data.street && data.number) {
            let streetPart = `${data.street} ${data.number}`;
            if (data.interiorNumber) {
                streetPart += `, Int. ${data.interiorNumber}`;
            }
            parts.push(streetPart);
        }

        // Colonia
        if (data.colonia) {
            parts.push(data.colonia);
        }

        // Código postal
        if (data.zipCode) {
            parts.push(data.zipCode);
        }

        // Ciudad (siempre Culiacán)
        parts.push('Culiacán');

        // Estado (siempre Sinaloa)
        parts.push('Sinaloa');

        // País
        parts.push('México');

        return parts.join(', ');
    },

    /**
     * Geocodificar con backend proxy (SEGURO - oculta API key)
     */
    async geocodeWithProxy(address) {
        try {
            const response = await fetch(this.config.proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ address })
            });

            const data = await response.json();

            if (data.status === 'OK' && data.results && data.results.length > 0) {
                const result = data.results[0];
                const location = result.geometry.location;

                return {
                    latitude: location.lat,
                    longitude: location.lng,
                    formattedAddress: result.formatted_address,
                    placeId: result.place_id,
                    accuracy: this.getGoogleAccuracy(result.geometry.location_type),
                    service: 'Google Maps (Seguro)'
                };
            }

            console.warn('⚠️ Backend proxy no encontró resultados');
            return null;

        } catch (error) {
            console.error('❌ Error en backend proxy:', error);
            return null;
        }
    },

    /**
     * Determinar nivel de precisión de Google Maps
     */
    getGoogleAccuracy(locationType) {
        const accuracyMap = {
            'ROOFTOP': 'Exacta (número específico)',
            'RANGE_INTERPOLATED': 'Interpolada (rango en la calle)',
            'GEOMETRIC_CENTER': 'Aproximada (centro geométrico)',
            'APPROXIMATE': 'Aproximada (área general)'
        };
        return accuracyMap[locationType] || 'Desconocida';
    },

    /**
     * Geocodificar con Nominatim (OpenStreetMap) - GRATIS y SEGURO
     */
    async geocodeWithNominatim(address) {
        try {
            const encodedAddress = encodeURIComponent(address);
            const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=mx`;

            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'es-MX',
                    'User-Agent': 'FormularioInmueble/1.0'
                }
            });

            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];

                return {
                    latitude: parseFloat(result.lat),
                    longitude: parseFloat(result.lon),
                    formattedAddress: result.display_name,
                    placeId: result.place_id,
                    accuracy: this.getNominatimAccuracy(result.type),
                    service: 'Nominatim (OpenStreetMap)'
                };
            }

            console.warn('⚠️ Nominatim no encontró resultados');
            return null;

        } catch (error) {
            console.error('❌ Error en Nominatim Geocoding:', error);
            return null;
        }
    },

    /**
     * Determinar nivel de precisión de Nominatim
     */
    getNominatimAccuracy(type) {
        const accuracyMap = {
            'house': 'Exacta (casa específica)',
            'building': 'Exacta (edificio)',
            'residential': 'Alta (área residencial)',
            'road': 'Media (calle)',
            'suburb': 'Baja (colonia)',
            'city': 'Muy baja (ciudad)'
        };
        return accuracyMap[type] || 'Desconocida';
    },

    /**
     * Geocodificar dirección al enviar formulario
     */
    async geocodeOnSubmit() {
        // Obtener datos del formulario
        const addressData = {
            street: document.getElementById('address')?.value,
            number: document.getElementById('exterior-number')?.value,
            interiorNumber: document.getElementById('interior-number')?.value,
            colonia: document.getElementById('colonia')?.value,
            zipCode: document.getElementById('zip-code')?.value
        };

        // Validar que tengamos los datos mínimos
        if (!addressData.street || !addressData.colonia) {
            console.warn('⚠️ Faltan datos mínimos para geocodificar');
            return null;
        }

        // Geocodificar
        const result = await this.geocodeAddress(addressData);

        if (result) {
            console.log('✅ Geocodificación exitosa:', result);

            // Guardar en AppState si está disponible
            if (typeof AppState !== 'undefined') {
                AppState.formData.geocoding = result;
            }

            // Mostrar notificación al usuario
            this.showGeocodingSuccess(result);
        } else {
            console.warn('⚠️ No se pudo geocodificar la dirección');
            this.showGeocodingWarning();
        }

        return result;
    },

    /**
     * Mostrar notificación de geocodificación exitosa
     */
    showGeocodingSuccess(result) {
        const message = `
            📍 Ubicación encontrada con ${result.service}
            <br><small>Precisión: ${result.accuracy}</small>
        `;

        // Reutilizar sistema de notificaciones de geolocalización
        if (typeof Geolocation !== 'undefined' && Geolocation.showGeolocationSuccess) {
            Geolocation.showGeolocationSuccess(message);
        } else {
            console.log(message);
        }
    },

    /**
     * Mostrar advertencia de geocodificación fallida
     */
    showGeocodingWarning() {
        const message = 'No se pudo determinar la ubicación exacta. Los datos se guardarán de todas formas.';

        if (typeof Geolocation !== 'undefined' && Geolocation.showGeolocationWarning) {
            Geolocation.showGeolocationWarning(message);
        } else {
            console.warn(message);
        }
    }
};

// Exportar para uso global
window.Geocoding = Geocoding;
