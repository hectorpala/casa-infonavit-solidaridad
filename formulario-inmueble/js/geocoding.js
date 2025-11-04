/**
 * GEOCODING.JS - Sistema de Geocodificación de Direcciones
 * Convierte direcciones completas en coordenadas precisas
 */

const Geocoding = {
    // API Keys removidos - ahora se usan vía Netlify Functions (proxy seguro)
    // La API key de Google Maps está protegida en variables de entorno

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

        // 1. Intentar Google Maps via proxy (mejor precisión, seguro)
        result = await this.geocodeWithGoogle(fullAddress);
        if (result) {
            console.log('✅ Coordenadas obtenidas con Google Maps');
            return result;
        }

        // 2. Fallback a Nominatim (gratis, menor precisión)
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

        // Ciudad - Usar municipio seleccionado por el usuario
        const municipalityMap = {
            'culiacan': 'Culiacán',
            'los-mochis': 'Los Mochis',
            'mazatlan': 'Mazatlán'
        };
        const municipality = data.municipality || 'culiacan'; // default: Culiacán
        const cityName = municipalityMap[municipality] || 'Culiacán';
        parts.push(cityName);

        // Estado (siempre Sinaloa para ambos municipios)
        parts.push('Sinaloa');

        // País
        parts.push('México');

        return parts.join(', ');
    },

    /**
     * Geocodificar con Google Maps Geocoding API via Netlify Function (proxy seguro)
     */
    async geocodeWithGoogle(address) {
        try {
            console.log('🔒 Usando proxy seguro de Netlify para Google Maps...');

            // Llamar a Netlify Function en lugar de Google Maps directamente
            const response = await fetch('/.netlify/functions/geocode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ address })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.warn('⚠️ Error en proxy de geocodificación:', errorData.error);
                return null;
            }

            const data = await response.json();

            if (data.success && data.result) {
                const result = data.result;
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
            zipCode: document.getElementById('zip-code')?.value,
            municipality: document.getElementById('municipality')?.value // ✅ Incluir municipio seleccionado
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
