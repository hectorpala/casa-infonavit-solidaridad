/**
 * GEOCODING.JS - Sistema de Geocodificación de Direcciones
 * Convierte direcciones completas en coordenadas precisas
 */

// Orden de precisión de Google Maps (mejor → peor)
const GOOGLE_ACCURACY_PRIORITY = ['ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER', 'APPROXIMATE'];

const Geocoding = {
    // API Keys removidos - ahora se usan vía Netlify Functions (proxy seguro)
    // La API key de Google Maps está protegida en variables de entorno

    /**
     * Normalizar texto: minúsculas, sin acentos, sin puntuación, sin dobles espacios
     */
    normalizeText(str) {
        if (!str) return '';

        return str
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[^\w\s]/g, ' ') // Eliminar puntuación
            .replace(/\s+/g, ' ') // Eliminar dobles espacios
            .trim();
    },

    /**
     * Extraer tokens significativos eliminando palabras comunes
     */
    extractTokens(str) {
        const normalized = this.normalizeText(str);
        const stopWords = new Set([
            'calle', 'av', 'avenida', 'blvd', 'boulevard', 'andador',
            'la', 'el', 'de', 'del', 'los', 'las',
            'fracc', 'fraccionamiento', 'col', 'colonia'
        ]);

        return normalized
            .split(' ')
            .filter(token => token.length > 0 && !stopWords.has(token));
    },

    /**
     * Validar que los componentes de Google Maps coincidan con los datos ingresados
     */
    googleComponentsMatch(rawResult, data, enforceStreet = true, enforceColonia = true) {
        if (!rawResult || !rawResult.address_components) {
            return false;
        }

        const components = rawResult.address_components;

        // Extraer tokens de calle y colonia
        const streetTokens = data.street ? this.extractTokens(data.street) : [];
        const coloniaTokens = data.colonia ? this.extractTokens(data.colonia) : [];

        // Validar calle (solo si enforceStreet es true)
        if (enforceStreet && streetTokens.length > 0) {
            const routeComponent = components.find(c =>
                c.types.includes('route') ||
                c.types.includes('premise') ||
                c.types.includes('point_of_interest')
            );

            if (!routeComponent) {
                console.warn('⚠️ No se encontró componente route en Google Maps');
                return false;
            }

            const routeNormalized = this.normalizeText(routeComponent.long_name);
            const allStreetTokensMatch = streetTokens.every(token =>
                routeNormalized.includes(token)
            );

            if (!allStreetTokensMatch) {
                console.warn('⚠️ Tokens de calle no coinciden', {
                    esperado: streetTokens,
                    encontrado: routeNormalized
                });
                return false;
            }
        }

        // Validar colonia (solo si enforceColonia es true)
        if (enforceColonia && coloniaTokens.length > 0) {
            const coloniaComponent = components.find(c =>
                c.types.includes('sublocality') ||
                c.types.includes('sublocality_level_1') ||
                c.types.includes('neighborhood') ||
                c.types.includes('political')
            );

            if (!coloniaComponent) {
                console.warn('⚠️ No se encontró componente colonia en Google Maps');
                return false;
            }

            const coloniaNormalized = this.normalizeText(coloniaComponent.long_name);
            const allColoniaTokensMatch = coloniaTokens.every(token =>
                coloniaNormalized.includes(token)
            );

            if (!allColoniaTokensMatch) {
                console.warn('⚠️ Tokens de colonia no coinciden', {
                    esperado: coloniaTokens,
                    encontrado: coloniaNormalized
                });
                return false;
            }
        }

        return true;
    },

    /**
     * Validar que el resultado de Nominatim coincida con los datos ingresados
     */
    nominatimMatch(rawResult, data, enforceStreet = true, enforceColonia = true) {
        if (!rawResult || !rawResult.display_name) {
            return false;
        }

        const displayNameNormalized = this.normalizeText(rawResult.display_name);

        // Extraer tokens
        const streetTokens = data.street ? this.extractTokens(data.street) : [];
        const coloniaTokens = data.colonia ? this.extractTokens(data.colonia) : [];

        // Validar calle (solo si enforceStreet es true)
        if (enforceStreet && streetTokens.length > 0) {
            const allStreetTokensMatch = streetTokens.every(token =>
                displayNameNormalized.includes(token)
            );

            if (!allStreetTokensMatch) {
                console.warn('⚠️ Tokens de calle no coinciden en Nominatim', {
                    esperado: streetTokens,
                    encontrado: displayNameNormalized
                });
                return false;
            }
        }

        // Validar colonia (solo si enforceColonia es true)
        if (enforceColonia && coloniaTokens.length > 0) {
            const allColoniaTokensMatch = coloniaTokens.every(token =>
                displayNameNormalized.includes(token)
            );

            if (!allColoniaTokensMatch) {
                console.warn('⚠️ Tokens de colonia no coinciden en Nominatim', {
                    esperado: coloniaTokens,
                    encontrado: displayNameNormalized
                });
                return false;
            }
        }

        return true;
    },

    /**
     * Geocodificar dirección completa con evaluación de múltiples candidatos
     */
    async geocodeAddress(addressData) {
        console.log('🗺️ Geocodificando dirección completa...');

        // Construir variantes de dirección ordenadas por especificidad
        const addressVariants = this.buildAddressVariants(addressData);
        const hasNumber = addressData.number && addressData.number.trim();

        console.log(`📍 Variantes a probar: ${addressVariants.length}`);

        // Intentar cada variante con Google Maps evaluando múltiples candidatos
        let result = null;
        let usedVariant = null;
        let bestFallbackResult = null;

        for (let i = 0; i < addressVariants.length; i++) {
            const variant = addressVariants[i];
            console.log(`\nIntentando geocoding con variante ${i + 1}/${addressVariants.length}: ${variant.query}`);
            console.log(`   Flags: enforceStreet=${variant.enforceStreet}, enforceColonia=${variant.enforceColonia}`);

            const candidates = await this.geocodeWithGoogle(variant.query);

            if (candidates.length === 0) {
                console.log('   Sin resultados de Google Maps');
                continue;
            }

            // Evaluar cada candidato
            for (let j = 0; j < candidates.length; j++) {
                const candidate = candidates[j];
                const locationType = candidate.locationType;
                const partialMatch = candidate.partialMatch;

                console.log(`   Evaluando candidato ${j + 1}/${candidates.length}:`, {
                    locationType,
                    partialMatch,
                    address: candidate.formattedAddress.substring(0, 80)
                });

                const isPrecise = locationType === 'ROOFTOP' || locationType === 'RANGE_INTERPOLATED';

                // ✅ PRIORIDAD 1: Si es ROOFTOP con número de calle, aceptar SIN validar colonia
                // (Google Maps puede usar nombre oficial de colonia diferente al ingresado)
                if (isPrecise && hasNumber && variant.enforceStreet) {
                    const streetOnlyValid = this.googleComponentsMatch(
                        candidate.raw,
                        addressData,
                        true,   // enforceStreet = true (validar calle)
                        false   // enforceColonia = false (NO validar colonia)
                    );

                    if (streetOnlyValid) {
                        result = candidate;
                        usedVariant = variant.query;
                        console.log(`✅ Candidato ROOFTOP aceptado (calle validada, colonia ignorada)`);
                        break;
                    }
                }

                // ✅ PRIORIDAD 2: Validación completa (calle + colonia)
                const isValid = this.googleComponentsMatch(
                    candidate.raw,
                    addressData,
                    variant.enforceStreet,
                    variant.enforceColonia
                );

                if (isValid) {
                    // Coincidencia válida encontrada
                    if (!hasNumber || isPrecise) {
                        // Retornar inmediatamente si:
                        // 1. No hay número (cualquier coincidencia válida es buena)
                        // 2. Hay número Y la precisión es alta (ROOFTOP/RANGE_INTERPOLATED)
                        result = candidate;
                        usedVariant = variant.query;
                        console.log(`✅ Candidato aceptado (locationType: ${locationType}, partialMatch: ${partialMatch})`);
                        break;
                    } else {
                        // Hay número pero precisión es baja (GEOMETRIC_CENTER/APPROXIMATE)
                        // Guardar como fallback pero seguir buscando
                        if (!bestFallbackResult) {
                            bestFallbackResult = {
                                ...candidate,
                                fallbackReason: 'PRECISION_BAJA',
                                usedVariant: variant.query
                            };
                            console.log(`💾 Guardado como fallback (locationType: ${locationType})`);
                        }
                    }
                } else {
                    // No coincide, pero guardar primer resultado como fallback débil
                    if (!bestFallbackResult && j === 0) {
                        bestFallbackResult = {
                            ...candidate,
                            fallbackReason: 'NO_MATCH',
                            usedVariant: variant.query
                        };
                        console.log(`💾 Guardado como fallback débil (sin coincidencia exacta)`);
                    }

                    const routeComponent = candidate.raw?.address_components?.find(c =>
                        c.types.includes('route') ||
                        c.types.includes('premise') ||
                        c.types.includes('point_of_interest')
                    );
                    const coloniaComponent = candidate.raw?.address_components?.find(c =>
                        c.types.includes('sublocality') ||
                        c.types.includes('sublocality_level_1') ||
                        c.types.includes('neighborhood')
                    );

                    console.warn(`   ⚠️ Candidato descartado por mismatch:`, {
                        enforceStreet: variant.enforceStreet,
                        enforceColonia: variant.enforceColonia,
                        locationType,
                        partialMatch,
                        routeFound: routeComponent?.long_name || 'N/A',
                        coloniaFound: coloniaComponent?.long_name || 'N/A'
                    });
                }
            }

            // Si encontramos resultado válido, salir del loop de variantes
            if (result) break;
        }

        // Si no hay resultado válido pero tenemos fallback, usarlo
        if (!result && bestFallbackResult) {
            console.log(`\n🔄 Usando fallback (razón: ${bestFallbackResult.fallbackReason})`);
            result = bestFallbackResult;
            usedVariant = bestFallbackResult.usedVariant;
        }

        // Si Google falló completamente, intentar Nominatim solo si no hay fallback
        if (!result && addressVariants.length > 0) {
            const lastVariant = addressVariants[addressVariants.length - 1];
            console.log(`\nIntentando geocoding con Nominatim usando: ${lastVariant.query}`);
            console.log(`   Flags: enforceStreet=${lastVariant.enforceStreet}, enforceColonia=${lastVariant.enforceColonia}`);

            result = await this.geocodeWithNominatim(lastVariant.query);
            if (result) {
                const isValid = this.nominatimMatch(
                    result.raw,
                    addressData,
                    lastVariant.enforceStreet,
                    lastVariant.enforceColonia
                );

                if (isValid) {
                    usedVariant = lastVariant.query;
                    console.log('✅ Coordenadas obtenidas con Nominatim (OpenStreetMap)');
                } else {
                    console.warn('⚠️ Nominatim descartado por mismatch:', {
                        variant: lastVariant.query,
                        enforceStreet: lastVariant.enforceStreet,
                        enforceColonia: lastVariant.enforceColonia,
                        displayName: result.raw?.display_name || 'N/A'
                    });
                    result = null;
                }
            }
        }

        // Agregar metadata de aproximación según el caso
        if (result) {
            const fallbackReason = result.fallbackReason;

            if (!hasNumber) {
                // Sin número exterior
                result.approximate = true;
                result.approximationReason = 'SIN_NUMERO';
                result.accuracy = result.accuracy + ' · sin número exterior';
                console.log('⚠️ Ubicación aproximada (sin número exterior)');
            } else if (fallbackReason === 'PRECISION_BAJA') {
                // Hay número pero precisión baja
                result.approximate = true;
                result.approximationReason = 'PRECISION_BAJA';
                result.accuracy = result.accuracy + ' · coincidencia aproximada (sin número exacto)';
                console.log('⚠️ Ubicación aproximada (precisión baja con número exterior)');
            } else if (fallbackReason === 'NO_MATCH') {
                // Fallback por no coincidir exactamente
                result.approximate = true;
                result.approximationReason = 'FALLBACK_GOOGLE';
                result.accuracy = result.accuracy + ' · coincidencia aproximada';
                console.log('⚠️ Ubicación aproximada (fallback - sin coincidencia exacta)');
            }

            return result;
        }

        console.error('❌ No se pudieron obtener coordenadas con ningún servicio');
        return null;
    },

    /**
     * Construir dirección completa desde los datos del formulario
     */
    buildFullAddress(data) {
        console.log('🏗️ buildFullAddress() recibió datos:', data);

        const parts = [];

        // Calle + Número + Número interior (opcional)
        // NOTA: Ahora construye calle incluso sin número
        if (data.street) {
            let streetPart = data.street.trim();
            if (data.number && data.number.trim()) {
                streetPart += ` ${data.number.trim()}`;
            }
            if (data.interiorNumber && data.interiorNumber.trim()) {
                streetPart += `, Int. ${data.interiorNumber.trim()}`;
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
            'mazatlan': 'Mazatlán',
            'garcia': 'García'
        };
        const municipality = data.municipality || 'culiacan'; // default: Culiacán
        const cityName = municipalityMap[municipality] || 'Culiacán';
        console.log(`   Municipio: ${municipality} → ${cityName}`);
        parts.push(cityName);

        // Estado - Mapear estado desde el selector
        const stateMap = {
            'sinaloa': 'Sinaloa',
            'nuevo-leon': 'Nuevo León'
        };

        // Obtener estado desde data o inferir desde municipio
        let stateName = 'Sinaloa'; // default

        if (data.state) {
            // Si viene el estado en los datos, usarlo
            stateName = stateMap[data.state] || data.state;
            console.log(`   Estado desde data.state: ${data.state} → ${stateName}`);
        } else if (municipality === 'garcia') {
            // Si es García, usar Nuevo León
            stateName = 'Nuevo León';
            console.log(`   Estado inferido desde municipio García: ${stateName}`);
        }

        parts.push(stateName);

        // País
        parts.push('México');

        const fullAddress = parts.join(', ');
        console.log(`✅ Dirección construida: ${fullAddress}`);

        return fullAddress;
    },

    /**
     * Construir variantes de dirección ordenadas por especificidad (más específico → menos específico)
     * Retorna objetos con metadata para filtrado condicional
     */
    buildAddressVariants(data) {
        console.log('🔄 buildAddressVariants() recibió datos:', data);

        const variants = [];

        // Mapas de ciudad y estado
        const municipalityMap = {
            'culiacan': 'Culiacán',
            'los-mochis': 'Los Mochis',
            'mazatlan': 'Mazatlán',
            'garcia': 'García'
        };
        const stateMap = {
            'sinaloa': 'Sinaloa',
            'nuevo-leon': 'Nuevo León'
        };

        const municipality = data.municipality || 'culiacan';
        const cityName = municipalityMap[municipality] || 'Culiacán';

        let stateName = 'Sinaloa';
        if (data.state) {
            stateName = stateMap[data.state] || data.state;
        } else if (municipality === 'garcia') {
            stateName = 'Nuevo León';
        }

        // Variante A: calle + número + colonia + CP + ciudad + estado + México (solo si hay número)
        if (data.street && data.number && data.number.trim()) {
            let streetPart = `${data.street.trim()} ${data.number.trim()}`;
            if (data.interiorNumber && data.interiorNumber.trim()) {
                streetPart += `, Int. ${data.interiorNumber.trim()}`;
            }
            const query = [
                streetPart,
                data.colonia,
                data.zipCode,
                cityName,
                stateName,
                'México'
            ].filter(Boolean).join(', ');

            variants.push({
                query,
                enforceStreet: true,
                enforceColonia: !!data.colonia
            });
        }

        // Variante B: calle + colonia + CP + ciudad + estado + México (sin número)
        if (data.street) {
            const query = [
                data.street.trim(),
                data.colonia,
                data.zipCode,
                cityName,
                stateName,
                'México'
            ].filter(Boolean).join(', ');

            variants.push({
                query,
                enforceStreet: true,
                enforceColonia: !!data.colonia
            });
        }

        // Variante C: colonia + ciudad + estado + México (sin calle)
        const query = [
            data.colonia,
            cityName,
            stateName,
            'México'
        ].filter(Boolean).join(', ');

        variants.push({
            query,
            enforceStreet: false,  // No validar calle en esta variante
            enforceColonia: !!data.colonia
        });

        console.log(`📋 Variantes generadas (${variants.length}):`, variants.map(v => ({
            query: v.query,
            enforceStreet: v.enforceStreet,
            enforceColonia: v.enforceColonia
        })));
        return variants;
    },

    /**
     * Geocodificar con Google Maps Geocoding API via Netlify Function (proxy seguro)
     * Retorna array de candidatos ordenados por precisión
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
                return [];
            }

            const data = await response.json();

            // ✅ Tolerancia de AMBOS formatos de respuesta:
            // - Formato nuevo (netlify/functions/geocode.js): { success: true, results: [...] }
            // - Formato viejo (api/geocode.js): { status: "OK", results: [...] }
            const statusOk = (data.success === true) || (data.status === 'OK');
            const hasResults = Array.isArray(data.results) && data.results.length > 0;

            if (statusOk && hasResults) {
                console.log(`📍 Google Maps retornó ${data.results.length} resultado(s)`);

                // Normalizar y ordenar resultados por precisión
                const candidates = data.results.map(result => {
                    const location = result.geometry.location;
                    const locationType = result.geometry.location_type;

                    return {
                        latitude: location.lat,
                        longitude: location.lng,
                        formattedAddress: result.formatted_address,
                        placeId: result.place_id,
                        accuracy: this.getGoogleAccuracy(locationType),
                        locationType: locationType,
                        partialMatch: result.partial_match === true,
                        service: 'Google Maps',
                        raw: result // Incluir resultado completo para validación
                    };
                });

                // Ordenar por precisión (mejor → peor)
                candidates.sort((a, b) => {
                    const indexA = GOOGLE_ACCURACY_PRIORITY.indexOf(a.locationType);
                    const indexB = GOOGLE_ACCURACY_PRIORITY.indexOf(b.locationType);
                    return indexA - indexB;
                });

                console.log(`   Candidatos ordenados por precisión:`, candidates.map(c => ({
                    locationType: c.locationType,
                    partialMatch: c.partialMatch,
                    address: c.formattedAddress.substring(0, 60) + '...'
                })));

                return candidates;
            }

            console.warn('⚠️ Google Maps no encontró resultados');
            return [];

        } catch (error) {
            console.error('❌ Error en Google Maps Geocoding:', error);
            return [];
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
                    service: 'Nominatim (OpenStreetMap)',
                    raw: result // Incluir resultado completo para validación
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
            state: document.getElementById('state')?.value, // ✅ Incluir estado seleccionado
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
