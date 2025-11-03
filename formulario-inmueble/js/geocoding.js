/**
 * GEOCODING.JS - Sistema de Geocodificación de Direcciones
 * Convierte direcciones completas en coordenadas precisas
 */

const Geocoding = {
    // API Keys (configuradas para producción)
    apiKeys: {
        google: 'AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk', // Google Maps API Key
        mapbox: ''  // MapBox API Key (opcional)
    },

    /**
     * Geocodificar dirección completa con múltiples servicios (fallback)
     */
    async geocodeAddress(addressData) {
        console.log('🗺️ Geocodificando dirección completa...');

        // Construir dirección completa
        const fullAddress = this.buildFullAddress(addressData);
        console.log('📍 Dirección a geocodificar:', fullAddress);

        // Intentar servicios en orden de precisión
        let result = null;

        // 1. Intentar Google Maps (mejor precisión)
        if (this.apiKeys.google) {
            result = await this.geocodeWithGoogle(fullAddress);
            if (result) {
                console.log('✅ Coordenadas obtenidas con Google Maps');
                return result;
            }
        }

        // 2. Intentar MapBox (buena precisión, generoso)
        if (this.apiKeys.mapbox) {
            result = await this.geocodeWithMapBox(fullAddress);
            if (result) {
                console.log('✅ Coordenadas obtenidas con MapBox');
                return result;
            }
        }

        // 3. Fallback a Nominatim (gratis, menor precisión)
        result = await this.geocodeWithNominatim(fullAddress);
        if (result) {
            console.log('✅ Coordenadas obtenidas con Nominatim (OpenStreetMap)');
            return result;
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
     * Geocodificar con Google Maps Geocoding API
     */
    async geocodeWithGoogle(address) {
        if (!this.apiKeys.google) {
            console.warn('⚠️ Google Maps API key no configurada');
            return null;
        }

        try {
            const encodedAddress = encodeURIComponent(address);
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.apiKeys.google}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
                const result = data.results[0];
                const location = result.geometry.location;

                return {
                    latitude: location.lat,
                    longitude: location.lng,
                    formattedAddress: result.formatted_address,
                    placeId: result.place_id,
                    accuracy: this.getGoogleAccuracy(result.geometry.location_type),
                    service: 'Google Maps'
                };
            }

            console.warn('⚠️ Google Maps no encontró resultados');
            return null;

        } catch (error) {
            console.error('❌ Error en Google Maps Geocoding:', error);
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
     * Geocodificar con MapBox Geocoding API
     */
    async geocodeWithMapBox(address) {
        if (!this.apiKeys.mapbox) {
            console.warn('⚠️ MapBox API key no configurada');
            return null;
        }

        try {
            const encodedAddress = encodeURIComponent(address);
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${this.apiKeys.mapbox}&country=MX&limit=1`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const result = data.features[0];
                const [longitude, latitude] = result.center;

                return {
                    latitude: latitude,
                    longitude: longitude,
                    formattedAddress: result.place_name,
                    placeId: result.id,
                    accuracy: this.getMapBoxAccuracy(result.relevance),
                    service: 'MapBox'
                };
            }

            console.warn('⚠️ MapBox no encontró resultados');
            return null;

        } catch (error) {
            console.error('❌ Error en MapBox Geocoding:', error);
            return null;
        }
    },

    /**
     * Determinar nivel de precisión de MapBox
     */
    getMapBoxAccuracy(relevance) {
        if (relevance >= 0.99) return 'Exacta';
        if (relevance >= 0.95) return 'Alta';
        if (relevance >= 0.85) return 'Media';
        return 'Baja';
    },

    /**
     * Geocodificar con Nominatim (OpenStreetMap) - GRATIS
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
