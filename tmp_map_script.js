
        // Variables globales para el mapa de Culiacán
        let mapCuliacan;
        let culiacanMarkers = [];

        function openMapModal() {
            const modal = document.getElementById('mapModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';

            // Inicializar mapa si aún no existe
            if (!window.mapCuliacanInitialized) {
                setTimeout(() => {
                    initializeCuliacanMap();
                }, 100);
            }
        }

        function closeMapModal() {
            const modal = document.getElementById('mapModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }

        // ===== COORDINATE NAVIGATION FUNCTIONS =====

        function jumpToCoordinates() {
            const latInput = document.getElementById('coord-lat');
            const lngInput = document.getElementById('coord-lng');

            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);

            // Validate inputs
            if (isNaN(lat) || isNaN(lng)) {
                alert('Por favor ingresa coordenadas válidas.\nEjemplo: Latitud: 24.824, Longitud: -107.399');
                return;
            }

            // Check if coordinates are in reasonable range for Culiacán
            if (lat < 24.0 || lat > 25.5 || lng < -108.0 || lng > -106.5) {
                const confirmed = confirm('⚠️ Las coordenadas parecen estar fuera del área de Culiacán.\n¿Deseas continuar de todas formas?');
                if (!confirmed) return;
            }

            // Check if map exists
            if (typeof window.mapCuliacan === 'undefined' || !window.mapCuliacan) {
                alert('El mapa aún no está inicializado. Por favor espera unos segundos.');
                return;
            }

            // Create LatLng object
            const position = new google.maps.LatLng(lat, lng);

            // Center map and zoom
            window.mapCuliacan.setCenter(position);
            window.mapCuliacan.setZoom(17); // Zoom level for neighborhood view

            // Add temporary marker
            if (window.tempCoordMarker) {
                window.tempCoordMarker.setMap(null);
            }

            window.tempCoordMarker = new google.maps.Marker({
                position: position,
                map: window.mapCuliacan,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#FF6A00",
                    fillOpacity: 0.8,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 3
                },
                animation: google.maps.Animation.DROP,
                zIndex: 9999
            });

            // Add bounce animation
            window.tempCoordMarker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                if (window.tempCoordMarker) {
                    window.tempCoordMarker.setAnimation(null);
                }
            }, 2000);

            console.log(`🎯 Saltando a coordenadas: ${lat}, ${lng}`);
        }

        function fillCoordinates(lat, lng) {
            document.getElementById('coord-lat').value = lat;
            document.getElementById('coord-lng').value = lng;
            // Auto-jump after filling
            setTimeout(() => jumpToCoordinates(), 100);
        }

        function clearCoordinateSearch() {
            document.getElementById('coord-lat').value = '';
            document.getElementById('coord-lng').value = '';

            // Remove temporary marker
            if (window.tempCoordMarker) {
                window.tempCoordMarker.setMap(null);
                window.tempCoordMarker = null;
            }

            // Reset map to default view (Culiacán center)
            if (window.mapCuliacan) {
                window.mapCuliacan.setCenter(new google.maps.LatLng(24.8091, -107.3940));
                window.mapCuliacan.setZoom(12);
            }
        }

        // ===== ZILLOW: SISTEMA DE FILTROS (GLOBAL SCOPE) =====

        // Active filters con nuevo filtro "type"
        const activeFilters = {
            type: 'venta',  // Default: En Venta
            price: '',
            bedrooms: '',
            bathrooms: '',
            zone: ''
        };

        // Abrir bottom sheet
        function openBottomSheet(filterType) {
            console.log('🔵 openBottomSheet llamada con:', filterType);
            const overlay = document.getElementById('sheet-overlay-culiacan');
            const sheet = document.getElementById(`sheet-${filterType}-culiacan`);

            console.log('Overlay encontrado:', overlay);
            console.log('Sheet encontrado:', sheet);

            if (overlay && sheet) {
                overlay.classList.add('active');
                sheet.classList.add('active');
                document.body.style.overflow = 'hidden';
                console.log('✅ Bottom sheet abierto');
            } else {
                console.error('❌ No se encontraron elementos overlay o sheet');
            }
        }

        // Cerrar bottom sheet
        function closeBottomSheet() {
            const overlay = document.getElementById('sheet-overlay-culiacan');
            const sheets = document.querySelectorAll('.bottom-sheet-culiacan');

            overlay.classList.remove('active');
            sheets.forEach(sheet => sheet.classList.remove('active'));
            document.body.style.overflow = ''; // Restore scroll
        }

        // Seleccionar opción en bottom sheet (bedrooms, bathrooms, zone)
        function selectOption(button, filterType, value) {
            // Remover selected de todos los botones del grupo
            const group = button.parentElement;
            group.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));

            // Marcar como selected
            button.classList.add('selected');

            // Guardar en estado temporal (se aplicará al hacer clic en "Listo")
            activeFilters[filterType] = value;
        }

        // Seleccionar precio (funciona diferente)
  
      function selectPrice(button, value) {
            const group = button.parentElement;
            group.querySelectorAll('.price-btn').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            activeFilters.price = value;
        }
        // Aplicar filtro y cerrar sheet
        function applyFilter(filterType) {
            // ZILLOW: Para "beds-baths", actualizar ambos chips
            if (filterType === 'beds-baths') {
                updateChipState('bedrooms');
                updateChipState('bathrooms');
            } else if (filterType === 'more') {
                // ZILLOW: Para "more", actualizar zone
                updateChipState('zone');
            } else {
                updateChipState(filterType);
            }
            closeBottomSheet();
            applyFiltersToMap();
        }

        // Actualizar estado visual del chip
        function updateChipState(filterType) {
            // ZILLOW: Para "beds-baths" y "more" necesitamos mapear a los chips reales
            let chipId = filterType;

            // ZILLOW: Mapear bedrooms/bathrooms/zone a sus nuevos chips
            if (filterType === 'bedrooms' || filterType === 'bathrooms') {
                chipId = 'beds-baths';
            } else if (filterType === 'zone') {
                chipId = 'more';
            }

            const chip = document.getElementById(`chip-${chipId}-culiacan`);
            const value = activeFilters[filterType];

            if (value) {
                chip.classList.add('active');

                // Actualizar texto del chip con valor seleccionado
                let displayText = '';
                if (filterType === 'type') {
                    displayText = value === 'renta' ? 'En renta' : 'En venta';
                } else if (filterType === 'price') {
                    const ranges = {
                        '0-2500000': '$0 - $2.5M',
                        '2500000-3000000': '$2.5M - $3.0M',
                        '3000000-3500000': '$3.0M - $3.5M',
                        '3500000-999999999': '$3.5M+'
                    };
                    displayText = ranges[value] || 'Precio';
                } else if (filterType === 'bedrooms') {
                    displayText = `${value}+ rec`;
                    
                } else if (filterType === 'bathrooms') {
                    displayText = `${value}+ ba`;
                } else if (filterType === 'zone') {
                    const zones = {
                        'infonavit': 'Infonavit',
                        'centro': 'Centro',
                        'norte': 'North Zone'
                    };
                    displayText = zones[value] || 'Neighborhood';
                }

                // ZILLOW: Para beds-baths, mostrar ambos si están activos
                if (chipId === 'beds-baths') {
                    const bedValue = activeFilters.bedrooms;
                    const bathValue = activeFilters.bathrooms;
                    if (bedValue && bathValue) {
                        displayText = `${bedValue}+ bd, ${bathValue}+ ba`;
                    } else if (bedValue) {
                        displayText = `${bedValue}+ rec`;
                    
                    } else if (bathValue) {
                        displayText = `${bathValue}+ baños`;
                    
                    }
                }

                chip.innerHTML = `
                    <span class="chip-label">${displayText}</span>
                    <i class="fas fa-times chip-icon"></i>
                `;

                // Al hacer clic en chip activo, remover filtro
                chip.onclick = () => removeFilter(filterType);
            } else {
                // ZILLOW: Si es beds-baths, verificar si el otro está activo
                if (chipId === 'beds-baths') {
                    const bedValue = activeFilters.bedrooms;
                    const bathValue = activeFilters.bathrooms;
                    if (!bedValue && !bathValue) {
                        chip.classList.remove('active');
                        resetChipAppearance(chipId);
                    }
                } else if (chipId === 'more') {
                    // ZILLOW: Para "more", verificar si zone está activo
                    if (!activeFilters.zone) {
                        chip.classList.remove('active');
                        resetChipAppearance(chipId);
                    }
                } else {
                    chip.classList.remove('active');
                    resetChipAppearance(filterType);
                }
            }
        }

        // Remover filtro individual
        function removeFilter(filterType) {
            if (filterType === 'bedrooms' || filterType === 'bathrooms') {
                activeFilters.bedrooms = '';
                activeFilters.bathrooms = '';
                resetChipAppearance('beds-baths');
                const sheet = document.getElementById('sheet-beds-baths-culiacan');
                if (sheet) {
                    sheet.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
                }
            } else if (filterType === 'zone') {
                activeFilters.zone = '';
                resetChipAppearance('more');
                const sheet = document.getElementById('sheet-more-culiacan');
                if (sheet) {
                    sheet.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
                }
            } else {
                activeFilters[filterType] = '';
                resetChipAppearance(filterType);
                const sheet = document.getElementById(`sheet-${filterType}-culiacan`);
                if (sheet) {
                    sheet.querySelectorAll('.option-btn, .price-btn').forEach(btn => btn.classList.remove('selected'));
                }
            }

            applyFiltersToMap();
        }

        // Reset apariencia de chip a estado inicial
        function resetChipAppearance(filterType) {
            let chipId = filterType;
            if (filterType === 'bedrooms' || filterType === 'bathrooms') {
                chipId = 'beds-baths';
            } else if (filterType === 'zone') {
                chipId = 'more';
            }

            const chip = document.getElementById(`chip-${chipId}-culiacan`);
            if (!chip) return;

            chip.classList.remove('active');

            const labels = {
                type: 'En venta',
                price: 'Precio',
                'beds-baths': 'Recámaras y baños',
                more: 'Más'
            };

            chip.innerHTML = `
                <span class="chip-label">${labels[chipId]}</span>
                <i class="fas fa-chevron-down chip-icon"></i>
            `;

            chip.onclick = () => openBottomSheet(chipId);
        }

        // Aplicar todos los filtros activos al mapa
        function applyFiltersToMap() {
            try {
                console.log('\n🎯 Aplicando filtros Zillow al mapa...');
                console.log('Filtros activos:', activeFilters);

                if (!window.allCuliacanMarkers || window.allCuliacanMarkers.length === 0) {
                    console.error('❌ ERROR: No hay marcadores en window.allCuliacanMarkers');
                    return;
                }

                let visibleCount = 0;

                window.allCuliacanMarkers.forEach((marker, index) => {
                    if (!marker.property) {
                        marker.setMap(mapCuliacan);
                        visibleCount++;
                        return;
                    }

                    const property = marker.property;
                    let shouldShow = true;

                    // Filtro de tipo (venta/renta)
                    if (activeFilters.type) {
                        const markerType = property.type || 'venta';
                        if (markerType !== activeFilters.type) {
                            shouldShow = false;
                        }
                    }

                    // Filtro de precio
                    if (shouldShow && activeFilters.price) {
                        const [min, max] = activeFilters.price.split('-').map(Number);
                        const priceStr = property.priceFull?.replace(/[$,\/mes]/g, '') || '0';
                        const price = parseInt(priceStr);
                        if (price < min || price > max) {
                            shouldShow = false;
                        }
                    }

                    // Filtro de recámaras (>=)
                    if (shouldShow && activeFilters.bedrooms) {
                        if ((property.bedrooms || 0) < parseInt(activeFilters.bedrooms)) {
                            shouldShow = false;
                        }
                    }

                    // Filtro de baños (>=)
                    if (shouldShow && activeFilters.bathrooms) {
                        if ((property.bathrooms || 0) < parseInt(activeFilters.bathrooms)) {
                            shouldShow = false;
                        }
                    }

                    // Filtro de zona
                    if (shouldShow && activeFilters.zone) {
                        if (property.zone !== activeFilters.zone) {
                            shouldShow = false;
                        }
                    }

                    if (shouldShow) {
                        marker.setMap(mapCuliacan);
                        visibleCount++;
                    } else {
                        marker.setMap(null);
                    }
                });

                console.log(`✅ Filtro: ${visibleCount} de ${window.allCuliacanMarkers.length} propiedades visibles`);

            } catch (error) {
                console.error('❌ ERROR en applyFiltersToMap():', error);
            }
        }

        // Limpiar TODOS los filtros
        function resetFilters() {
            activeFilters.type = 'venta';  // Reset to default "En Venta"
            activeFilters.price = '';
            activeFilters.bedrooms = '';
            activeFilters.bathrooms = '';
            activeFilters.zone = '';

            // Reset visual de todos los chips (usando los nuevos IDs)
            ['type', 'price', 'beds-baths', 'more'].forEach(chipId => {
                resetChipAppearance(chipId);
            });

            // Reset selección en todos los sheets
            ['sheet-type-culiacan', 'sheet-price-culiacan', 'sheet-beds-baths-culiacan', 'sheet-more-culiacan'].forEach(sheetId => {
                const sheet = document.getElementById(sheetId);
                if (sheet) {
                    sheet.querySelectorAll('.option-btn, .price-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    // Reseleccionar "En Venta" por defecto en sheet-type
                    if (sheetId === 'sheet-type-culiacan') {
                        const forSaleBtn = sheet.querySelector('[data-value="venta"]');
                        if (forSaleBtn) forSaleBtn.classList.add('selected');
                    }
                }
            });

            closeBottomSheet();
            applyFiltersToMap();
        }

        // Inicializar filtros Zillow cuando el mapa esté listo
        function initZillowFilters() {
            console.log('🟢 initZillowFilters() LLAMADA');
            const modalMap = document.querySelector('#map-culiacan');

            if (!modalMap) {
                console.error('❌ No se encontró #map-culiacan');
                return;
            }

            // Insertar chips SIN onclick inline
            const filterChipsHTML = `
            <div id="zillow-filters-container" style="
                position: absolute;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999999;
                pointer-events: auto;
                display: flex;
                gap: 10px;
            ">
                <div class="filter-chip" id="chip-type-culiacan">
                    <span>En Venta</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="filter-chip" id="chip-price-culiacan">
                    <span>Precio</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="filter-chip" id="chip-beds-baths-culiacan">
                    <span>Recámaras y Baños</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="filter-chip" id="chip-more-culiacan">
                    <span>Más</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            `;

            modalMap.insertAdjacentHTML('afterbegin', filterChipsHTML);
            console.log('✅ Chips insertados');

            // Event listeners con JavaScript
            setTimeout(() => {
                document.getElementById('chip-type-culiacan')?.addEventListener('click', () => {
                    console.log('CLICK TYPE');
                    openBottomSheet('type');
                });
                document.getElementById('chip-price-culiacan')?.addEventListener('click', () => {
                    console.log('CLICK PRICE');
                    openBottomSheet('price');
                });
                document.getElementById('chip-beds-baths-culiacan')?.addEventListener('click', () => {
                    console.log('CLICK BEDS');
                    openBottomSheet('beds-baths');
                });
                document.getElementById('chip-more-culiacan')?.addEventListener('click', () => {
                    console.log('CLICK MORE');
                    openBottomSheet('more');
                });
                console.log('✅ Listeners agregados');
            }, 200);
        }

        // ===== CÓDIGO VIEJO ELIMINADO - AHORA USAMOS SISTEMA ZILLOW =====

        // Función para crear marcador personalizado (igual que las propiedades individuales)
        function createPropertyMarkerForMap(property, map, isCurrent = false) {
            const markerHTML = `
                <div style="
                    background: ${isCurrent ? 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
                    color: white;
                    padding: ${isCurrent ? '8px 14px' : '6px 10px'};
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: ${isCurrent ? '14px' : '12px'};
                    border: 3px solid white;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    cursor: pointer;
                    white-space: nowrap;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.15)'; this.style.zIndex='1000'" onmouseout="this.style.transform='scale(1)'; this.style.zIndex='auto'">
                    ${property.priceShort}
                </div>
            `;

            const CustomMarker = function(position, map, property, isCurrent) {
                this.position = position;
                this.property = property;
                this.isCurrent = isCurrent;
                this.div = null;
                this.setMap(map);
            };

            CustomMarker.prototype = new google.maps.OverlayView();

            CustomMarker.prototype.onAdd = function() {
                const div = document.createElement('div');
                div.style.position = 'absolute';
                div.innerHTML = markerHTML;

                div.addEventListener('click', () => {
                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div style="padding: 10px; max-width: 280px;">
                                <h4 style="margin: 0 0 8px 0; color: ${this.isCurrent ? '#FF6B35' : '#10b981'}; font-size: 16px; font-weight: 700;">${this.property.priceShort}</h4>
                                <h5 style="margin: 0 0 6px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${this.property.title}</h5>
                                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; line-height: 1.4;">${this.property.location}</p>
                                <div style="display: flex; gap: 8px;">
                                    <a href="${this.property.url}"
                                       style="display: inline-block; background: #FF6A00; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; flex: 1; text-align: center;">
                                        Ver Detalles
                                    </a>
                                    <a href="https://wa.me/528111652545?text=Hola,%20me%20interesa%20${encodeURIComponent(this.property.title)}"
                                       target="_blank"
                                       style="display: inline-block; background: #25D366; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
                                        <svg style="width: 16px; height: 16px; display: inline;" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        `
                    });
                    infoWindow.setPosition(this.position);
                    infoWindow.open(map);
                });

                this.div = div;
                const panes = this.getPanes();
                panes.overlayMouseTarget.appendChild(div);
            };

            CustomMarker.prototype.draw = function() {
                const overlayProjection = this.getProjection();
                const position = overlayProjection.fromLatLngToDivPixel(this.position);
                const div = this.div;
                div.style.left = (position.x - (this.isCurrent ? 40 : 30)) + 'px';
                div.style.top = (position.y - (this.isCurrent ? 20 : 16)) + 'px';
            };

            CustomMarker.prototype.onRemove = function() {
                if (this.div) {
                    this.div.parentNode.removeChild(this.div);
                    this.div = null;
                }
            };

            return CustomMarker;
        }

        function initializeCuliacanMap() {
            // Verificar si Google Maps API está cargada
            if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
                console.log('⏳ Esperando a que Google Maps API se cargue...');
                setTimeout(() => {
                    initializeCuliacanMap();
                }, 200);
                return;
            }

            // Inicializar geocoder
            const geocoder = new google.maps.Geocoder();

            // Coordenadas del centro de Culiacán
            const culiacanCenter = { lat: 24.8091, lng: -107.3940 };

            // Crear mapa centrado en Culiacán
            mapCuliacan = new google.maps.Map(document.getElementById('map-culiacan'), {
                center: culiacanCenter,
                zoom: 13,
                mapTypeId: 'roadmap',
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ],
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: true,
                fullscreenControl: true,
                scrollwheel: true,
                gestureHandling: 'greedy'
            });

            window.mapCuliacan = mapCuliacan;
            
            
            // Inicializar array global de marcadores para el filtro
            window.allCuliacanMarkers = [];

            // Propiedad: Casa en Venta Colonia Guadalupe (COORDENADAS EXACTAS V1.5)
            const guadalupeV15Property = {
                address: "Rio Quelite, Colonia Guadalupe, Culiacán, Sinaloa",
                lat: 24.824,
                lng: -107.399,
                priceShort: "$4.3M",
                priceFull: "$4,300,000",
                title: "Casa en Venta Colonia Guadalupe Culiacán",
                location: "Rio Quelite, Guadalupe, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "261m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-colonia-guadalupe-culiacan/",
                photos: [
                    "casa-en-venta-colonia-guadalupe-culiacan/images/foto-1.jpg",
                    "casa-en-venta-colonia-guadalupe-culiacan/images/foto-2.jpg",
                    "casa-en-venta-colonia-guadalupe-culiacan/images/foto-3.jpg",
                    "casa-en-venta-colonia-guadalupe-culiacan/images/foto-4.jpg",
                    "casa-en-venta-colonia-guadalupe-culiacan/images/foto-5.jpg",
                    "casa-en-venta-colonia-guadalupe-culiacan/images/foto-6.jpg",
                    "casa-en-venta-colonia-guadalupe-culiacan/images/foto-7.jpg",
                    "casa-en-venta-colonia-guadalupe-culiacan/images/foto-8.jpg",
                    "casa-en-venta-colonia-guadalupe-culiacan/images/foto-9.jpg",
                    "casa-en-venta-colonia-guadalupe-culiacan/images/foto-10.jpg"
                ]
            };

            // Propiedad: Casa Colinas de San Miguel
            const colinasSanMiguelProperty = {
                lat: 24.8156, lng: -107.4382, // Fraccionamiento Colinas de San Miguel, Culiacán
                priceShort: "$6.0M",
                priceFull: "$5,990,000",
                title: "Casa con Vista Espectacular en Colinas de San Miguel (Privada)",
                location: "Colinas de San Miguel, Culiacán",
                bedrooms: 4,
                bathrooms: 3,
                area: "226m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/",
                photos: [
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-1.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-2.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-3.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-4.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-5.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-6.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-7.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-8.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-9.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-10.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-11.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-12.jpg",
                    "casa-con-vista-espectacular-en-colinas-de-san-miguel-privada/images/foto-13.jpg"
                ]
            };

            // Propiedad: Casa Colonia Guadalupe
            const coloniaGuadalupeProperty = {
                lat: 24.8250, lng: -107.3950, // Colonia Guadalupe, Culiacán (coordenadas aproximadas)
                priceShort: "$9.9M",
                priceFull: "$9,900,000",
                title: "Vendo Casa en Colonia Guadalupe Culiacán",
                location: "Colonia Guadalupe, Culiacán, Sinaloa",
                bedrooms: 4,
                bathrooms: 4,
                area: "420m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/vendo-casa-en-colonia-guadalupe-culiacan/",
                photos: [
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-1.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-2.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-3.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-4.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-5.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-6.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-7.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-8.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-9.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-10.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-11.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-12.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-13.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-14.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-15.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-16.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-17.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-18.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-19.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-20.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-21.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-22.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-23.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-24.jpg",
                    "vendo-casa-en-colonia-guadalupe-culiacan/images/foto-25.jpg"
                ]
            };

            // Propiedad: Casa Infonavit Solidaridad
            const solidaridadProperty = {
                address: "Blvrd Elbert 2609, Infonavit Solidaridad, Culiacán, Sinaloa",
                priceShort: "$1.65M",
                priceFull: "$1,650,000",
                title: "Casa Infonavit Solidaridad",
                location: "Fraccionamiento Infonavit Solidaridad, Culiacán, Sinaloa",
                bedrooms: 2,
                bathrooms: 2,
                area: "91.6m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/infonavit-solidaridad/",
                photos: [
                    "infonavit-solidaridad/images/foto-1.jpg",
                    "infonavit-solidaridad/images/foto-2.jpg",
                    "infonavit-solidaridad/images/foto-3.jpg",
                    "infonavit-solidaridad/images/foto-4.jpg",
                    "infonavit-solidaridad/images/foto-5.jpg",
                    "infonavit-solidaridad/images/foto-6.jpg",
                    "infonavit-solidaridad/images/foto-7.jpg",
                    "infonavit-solidaridad/images/foto-8.jpg",
                    "infonavit-solidaridad/images/foto-9.jpg",
                    "infonavit-solidaridad/images/foto-10.jpg",
                    "infonavit-solidaridad/images/foto-11.jpg",
                    "infonavit-solidaridad/images/foto-12.jpg",
                    "infonavit-solidaridad/images/foto-13.jpg",
                    "infonavit-solidaridad/images/foto-14.jpg"
                ]
            };

            // Segunda propiedad: Casa La Primavera
            const laPrimaveraProperty = {
                address: "San Agustín 266, Culiacán, Sinaloa",
                priceShort: "$6.0M",
                priceFull: "$6,000,000",
                title: "Casa en Fracc La Primavera",
                location: "Fraccionamiento La Primavera, Culiacán, Sinaloa",
                bedrooms: 2,
                bathrooms: 1,
                area: "220m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-fracc-la-primavera/",
                photos: [
                    "casa-en-venta-en-fracc-la-primavera/images/foto-1.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-2.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-3.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-4.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-5.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-6.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-7.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-8.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-9.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-10.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-11.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-12.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-13.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-14.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-15.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-16.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-17.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-18.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-19.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-20.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-21.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-22.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-23.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-24.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-25.jpg"
                ]
            };

            // Tercera propiedad: Casa Privada Monaco
            const monacoProperty = {
                lat: 24.8245, lng: -107.3755, // Paseos del Rey, Culiacán
                priceShort: "$1.59M",
                priceFull: "$1,590,000",
                title: "Casa Privada Monaco",
                location: "Paseos del Rey, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "52m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-privada-monaco-paseos-del-rey/",
                photos: [
                    "casa-en-privada-monaco-paseos-del-rey/images/foto-1.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-2.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-3.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-4.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-5.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-6.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-7.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-8.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-9.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-10.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-11.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-12.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-13.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-14.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-15.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-16.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-17.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-18.jpg"
                ]
            };

            // Cuarta propiedad: Casa de Lujo Amorada
            const amoradaProperty = {
                lat: 24.8523, lng: -107.4012, // Privada Amorada, zona norte Culiacán
                priceShort: "$6.75M",
                priceFull: "$6,750,000",
                title: "Casa de Lujo Privada Amorada",
                location: "Amorada, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "365m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-de-lujo-en-venta-privada-con-alberca-amorada/",
                photos: [
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-1.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-2.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-3.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-4.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-5.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-6.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-7.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-8.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-9.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-10.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-11.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-12.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-13.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-14.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-15.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-16.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-17.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-18.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-19.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-20.jpg"
                ]
            };

            // Quinta propiedad: Casa Stanza
            const stanzaProperty = {
                lat: 24.7734, lng: -107.4455, // Fracc. Stanza, Culiacán
                priceShort: "$1.58M",
                priceFull: "$1,580,000",
                title: "Casa Fraccionamiento Stanza",
                location: "Stanza, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-fraccionamiento-stanza/",
                photos: [
                    "casa-en-fraccionamiento-stanza/images/foto-1.jpg","casa-en-fraccionamiento-stanza/images/foto-2.jpg","casa-en-fraccionamiento-stanza/images/foto-3.jpg","casa-en-fraccionamiento-stanza/images/foto-4.jpg","casa-en-fraccionamiento-stanza/images/foto-5.jpg","casa-en-fraccionamiento-stanza/images/foto-6.jpg","casa-en-fraccionamiento-stanza/images/foto-7.jpg","casa-en-fraccionamiento-stanza/images/foto-8.jpg","casa-en-fraccionamiento-stanza/images/foto-9.jpg","casa-en-fraccionamiento-stanza/images/foto-10.jpg","casa-en-fraccionamiento-stanza/images/foto-11.jpg"
                ]
            };

            // ===== LOTE 1: 5 NUEVAS PROPIEDADES =====

            // Propiedad 6: Casa en Venta en Privada La Cantera
            const privadaLaCanteraProperty = {
                address: "Privada La Cantera, Culiacán",
                priceShort: "$21.5M",
                priceFull: "$21,496,000",
                title: "Casa en Venta en Privada La Cantera",
                location: "Privada La Cantera",
                bedrooms: 2,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-privada-la-cantera/",
                photos: [
                    "casa-en-venta-en-privada-la-cantera/images/foto-1.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-2.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-3.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-4.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-5.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-6.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-7.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-8.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-9.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-10.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-11.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-12.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-13.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-14.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-15.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-16.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-17.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-18.jpg"
                ]
            };

            // Propiedad 7: Se Vende Casa en Isla del Oeste en La Primavera
            const islaDelOesteProperty = {
                address: "Isla del Oeste, La Primavera, Culiacán",
                priceShort: "$30.1M",
                priceFull: "$30,135,000",
                title: "Se Vende Casa en Isla del Oeste en La Primavera",
                location: "Isla del Oeste, Fraccionamiento La Primavera, Culiacán, Sinaloa",
                bedrooms: 2,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/se-vende-casa-en-isla-del-oeste-en-la-primavera/",
                photos: [
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-1.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-2.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-3.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-4.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-5.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-6.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-7.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-8.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-9.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-10.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-11.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-12.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-13.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-14.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-15.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-16.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-17.jpg"
                ]
            };

            // Propiedad 8: Casa en Venta Stanza Granada Salida Norte
            const stanzaGranadaProperty = {
                address: "Stanza Granada, Salida Norte, Culiacán",
                priceShort: "$1.6M",
                priceFull: "$1,580,000",
                title: "Casa en Venta Stanza Granada Salida Norte",
                location: "Stanza Granada",
                bedrooms: 2,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-stanza-granada-salida-norte/",
                photos: [
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-1.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-2.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-3.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-4.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-5.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-6.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-7.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-8.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-9.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-10.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-11.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-12.jpg",
                    "casa-en-venta-stanza-granada-salida-norte/images/foto-13.jpg"
                ]
            };

            // Propiedad 9: Casa en Venta en Stanza Corcega A2
            const stanzaCorcegaProperty = {
                address: "Stanza Corcega A2, Culiacán",
                priceShort: "$1.29M",
                priceFull: "$1,290,000",
                title: "Casa en Venta en Stanza Corcega A2",
                location: "Stanza Corcega A2",
                bedrooms: 2,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-stanza-corcega-a2/",
                photos: [
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-1.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-2.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-3.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-4.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-5.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-6.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-7.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-8.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-9.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-10.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-11.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-12.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-13.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-14.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-15.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-16.jpg"
                ]
            };

            // Propiedad 10: Casa en Venta en Villas del Río Elite
            const villasDelRioProperty = {
                address: "Villas del Río Elite, Zona Norte, Culiacán",
                priceShort: "$1.65M",
                priceFull: "$1,650,000",
                title: "Casa en Venta en Villas del Río Elite Zona Norte Culiacan, Sinaloa",
                location: "Villas del Río Elite",
                bedrooms: 2,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/",
                photos: [
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-1.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-2.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-3.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-4.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-5.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-6.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-7.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-8.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-9.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-10.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-11.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-12.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-13.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-14.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-15.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-16.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-17.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-18.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-19.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-20.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-21.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-22.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-23.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-24.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-25.jpg",
                    "casa-en-venta-en-villas-del-rio-elite-zona-norte-culiacan-si/images/foto-26.jpg"
                ]
            };

            // ===== LOTE 2: 5 NUEVAS PROPIEDADES =====

            // Propiedad 11: Casa en Venta Fraccionamiento Urbivilla
            const urbivillaProperty = {
                address: "Urbivilla, Culiacán",
                priceShort: "$2.8M",
                priceFull: "$2,800,000",
                title: "Casa en Venta Fraccionamineto Urbivilla",
                location: "Urbivilla",
                bedrooms: 2,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-fraccionamineto-urbivilla/",
                photos: [
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-1.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-2.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-3.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-4.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-5.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-6.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-7.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-8.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-9.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-10.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-11.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-12.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-13.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-14.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-15.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-16.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-17.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-18.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-19.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-20.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-21.jpg",
                    "casa-en-venta-fraccionamineto-urbivilla/images/foto-22.jpg"
                ]
            };

            // Propiedad 12: Casa en Sector Aeropuerto
            const sectorAeropuertoProperty = {
                address: "Sector Aeropuerto, Culiacán",
                priceShort: "$1.56M",
                priceFull: "$1,560,000",
                title: "Casa en Sector Aeropuerto",
                location: "Sector Aeropuerto",
                bedrooms: 2,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-sector-aeropuerto/",
                photos: [
                    "casa-en-sector-aeropuerto/images/foto-1.jpg",
                    "casa-en-sector-aeropuerto/images/foto-2.jpg",
                    "casa-en-sector-aeropuerto/images/foto-3.jpg",
                    "casa-en-sector-aeropuerto/images/foto-4.jpg",
                    "casa-en-sector-aeropuerto/images/foto-5.jpg",
                    "casa-en-sector-aeropuerto/images/foto-6.jpg",
                    "casa-en-sector-aeropuerto/images/foto-7.jpg",
                    "casa-en-sector-aeropuerto/images/foto-8.jpg",
                    "casa-en-sector-aeropuerto/images/foto-9.jpg",
                    "casa-en-sector-aeropuerto/images/foto-10.jpg",
                    "casa-en-sector-aeropuerto/images/foto-11.jpg",
                    "casa-en-sector-aeropuerto/images/foto-12.jpg"
                ]
            };

            // Propiedad 13: Casa Abajo del Valor Avaluó en Nuevo Culiacán
            const nuevoCuliacanProperty = {
                address: "Sinaloa, Culiacán",
                priceShort: "$2.9M",
                priceFull: "$2,900,000",
                title: "Casa Abajo del Valor Avaluó en Nuevo Culiacán",
                location: "Nuevo Culiacán",
                bedrooms: 2,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-abajo-del-valor-avaluo-en-nuevo-culiacan/",
                photos: [
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-1.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-2.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-3.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-4.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-5.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-6.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-7.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-8.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-9.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-10.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-11.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-12.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-13.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-14.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-15.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-16.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-17.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-18.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-19.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-20.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-21.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-22.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-23.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-24.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-25.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-26.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-27.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-28.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-29.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-30.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-31.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-32.jpg",
                    "casa-abajo-del-valor-avaluo-en-nuevo-culiacan/images/foto-33.jpg"
                ]
            };

            // Propiedad 14: Casa en Venta Valles del Sol
            const vallesDelSolProperty = {
                address: "Valles del Sol, Culiacán",
                priceShort: "$1.25M",
                priceFull: "$1,250,000",
                title: "Casa en Venta Valles del Sol, Sector Terranova, Culiacan, Sinaloa",
                location: "Valles del Sol",
                bedrooms: 2,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/",
                photos: [
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-1.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-2.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-3.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-4.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-5.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-6.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-7.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-8.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-9.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-10.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-11.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-12.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-13.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-14.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-15.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-16.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-17.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-18.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-19.jpg",
                    "casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal/images/foto-20.jpg"
                ]
            };

            // Propiedad 15: Casa en Venta en Inf. Barrancos
            const infbarrancosProperty = {
                address: "Fraccionamiento Infonavit Barrancos, Culiacán, Sinaloa",
                priceShort: "$1.1M",
                priceFull: "$1,100,000",
                title: "Casa en Venta en Inf. Barrancos",
                location: "Fraccionamiento Infonavit Barrancos, Culiacán, Sinaloa",
                bedrooms: 2,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-inf-barrancos/",
                photos: [
                    "casa-en-venta-en-inf-barrancos/images/foto-1.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-2.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-3.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-4.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-5.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-6.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-7.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-8.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-9.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-10.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-11.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-12.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-13.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-14.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-15.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-16.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-17.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-18.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-19.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-20.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-21.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-22.jpg",
                    "casa-en-venta-en-inf-barrancos/images/foto-23.jpg"
                ]
            };

            // Propiedad 16: Casa en Fraccionamiento Stanza
            const fraccionamientostanzaProperty = {
                address: "Sinaloa, Culiacán",
                priceShort: "$1.6M",
                priceFull: "$1,580,000",
                title: "Casa en Fraccionamiento Stanza",
                location: "Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-fraccionamiento-stanza/",
                photos: [
"casa-en-fraccionamiento-stanza/images/foto-1.jpg",                    "casa-en-fraccionamiento-stanza/images/foto-2.jpg","casa-en-fraccionamiento-stanza/images/foto-3.jpg","casa-en-fraccionamiento-stanza/images/foto-4.jpg","casa-en-fraccionamiento-stanza/images/foto-5.jpg",
                    "casa-en-fraccionamiento-stanza/images/foto-6.jpg",                    "casa-en-fraccionamiento-stanza/images/foto-7.jpg","casa-en-fraccionamiento-stanza/images/foto-8.jpg","casa-en-fraccionamiento-stanza/images/foto-9.jpg","casa-en-fraccionamiento-stanza/images/foto-10.jpg",
                    "casa-en-fraccionamiento-stanza/images/foto-11.jpg",                    "casa-en-fraccionamiento-stanza/images/foto-12.jpg","casa-en-fraccionamiento-stanza/images/foto-13.jpg","casa-en-fraccionamiento-stanza/images/foto-14.jpg","casa-en-fraccionamiento-stanza/images/foto-15.jpg",
                    "casa-en-fraccionamiento-stanza/images/foto-16.jpg",                    "casa-en-fraccionamiento-stanza/images/foto-17.jpg","casa-en-fraccionamiento-stanza/images/foto-18.jpg","casa-en-fraccionamiento-stanza/images/foto-19.jpg","casa-en-fraccionamiento-stanza/images/foto-20.jpg",
                    "casa-en-fraccionamiento-stanza/images/foto-21.jpg",                    "casa-en-fraccionamiento-stanza/images/foto-22.jpg","casa-en-fraccionamiento-stanza/images/foto-23.jpg","casa-en-fraccionamiento-stanza/images/foto-24.jpg","casa-en-fraccionamiento-stanza/images/foto-25.jpg",
                    "casa-en-fraccionamiento-stanza/images/foto-26.jpg",                    "casa-en-fraccionamiento-stanza/images/foto-27.jpg","casa-en-fraccionamiento-stanza/images/foto-28.jpg","casa-en-fraccionamiento-stanza/images/foto-29.jpg","casa-en-fraccionamiento-stanza/images/foto-30.jpg",
                    "casa-en-fraccionamiento-stanza/images/foto-31.jpg",                    "casa-en-fraccionamiento-stanza/images/foto-32.jpg","casa-en-fraccionamiento-stanza/images/foto-33.jpg","casa-en-fraccionamiento-stanza/images/foto-34.jpg"
                ]
            };

            // Propiedad 17: Casa en Venta Las Américas Br56
            const lasamericasbr56Property = {
                address: "Las Américas, Culiacán",
                priceShort: "$1.9M",
                priceFull: "$1,900,000",
                title: "Casa en Venta Las Américas Br56",
                location: "Las Américas",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-las-americas-br56/",
                photos: [
"casa-en-venta-las-americas-br56/images/foto-1.jpg",                    "casa-en-venta-las-americas-br56/images/foto-2.jpg","casa-en-venta-las-americas-br56/images/foto-3.jpg","casa-en-venta-las-americas-br56/images/foto-4.jpg","casa-en-venta-las-americas-br56/images/foto-5.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-6.jpg",                    "casa-en-venta-las-americas-br56/images/foto-7.jpg","casa-en-venta-las-americas-br56/images/foto-8.jpg","casa-en-venta-las-americas-br56/images/foto-9.jpg","casa-en-venta-las-americas-br56/images/foto-10.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-11.jpg",                    "casa-en-venta-las-americas-br56/images/foto-12.jpg","casa-en-venta-las-americas-br56/images/foto-13.jpg","casa-en-venta-las-americas-br56/images/foto-14.jpg","casa-en-venta-las-americas-br56/images/foto-15.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-16.jpg",                    "casa-en-venta-las-americas-br56/images/foto-17.jpg","casa-en-venta-las-americas-br56/images/foto-18.jpg","casa-en-venta-las-americas-br56/images/foto-19.jpg","casa-en-venta-las-americas-br56/images/foto-20.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-21.jpg",                    "casa-en-venta-las-americas-br56/images/foto-22.jpg","casa-en-venta-las-americas-br56/images/foto-23.jpg","casa-en-venta-las-americas-br56/images/foto-24.jpg","casa-en-venta-las-americas-br56/images/foto-25.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-26.jpg",                    "casa-en-venta-las-americas-br56/images/foto-27.jpg","casa-en-venta-las-americas-br56/images/foto-28.jpg","casa-en-venta-las-americas-br56/images/foto-29.jpg","casa-en-venta-las-americas-br56/images/foto-30.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-31.jpg",                    "casa-en-venta-las-americas-br56/images/foto-32.jpg","casa-en-venta-las-americas-br56/images/foto-33.jpg","casa-en-venta-las-americas-br56/images/foto-34.jpg","casa-en-venta-las-americas-br56/images/foto-35.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-36.jpg",                    "casa-en-venta-las-americas-br56/images/foto-37.jpg","casa-en-venta-las-americas-br56/images/foto-38.jpg","casa-en-venta-las-americas-br56/images/foto-39.jpg","casa-en-venta-las-americas-br56/images/foto-40.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-41.jpg",                    "casa-en-venta-las-americas-br56/images/foto-42.jpg","casa-en-venta-las-americas-br56/images/foto-43.jpg","casa-en-venta-las-americas-br56/images/foto-44.jpg","casa-en-venta-las-americas-br56/images/foto-45.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-46.jpg",                    "casa-en-venta-las-americas-br56/images/foto-47.jpg","casa-en-venta-las-americas-br56/images/foto-48.jpg","casa-en-venta-las-americas-br56/images/foto-49.jpg","casa-en-venta-las-americas-br56/images/foto-50.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-51.jpg",                    "casa-en-venta-las-americas-br56/images/foto-52.jpg","casa-en-venta-las-americas-br56/images/foto-53.jpg","casa-en-venta-las-americas-br56/images/foto-54.jpg","casa-en-venta-las-americas-br56/images/foto-55.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-56.jpg",                    "casa-en-venta-las-americas-br56/images/foto-57.jpg","casa-en-venta-las-americas-br56/images/foto-58.jpg","casa-en-venta-las-americas-br56/images/foto-59.jpg","casa-en-venta-las-americas-br56/images/foto-60.jpg",
                    "casa-en-venta-las-americas-br56/images/foto-61.jpg",                    "casa-en-venta-las-americas-br56/images/foto-62.jpg","casa-en-venta-las-americas-br56/images/foto-63.jpg","casa-en-venta-las-americas-br56/images/foto-64.jpg"
                ]
            };

            // Propiedad 18: Casa en Adolfo Lopez Mateos
            const adolfolopezmateosProperty = {
                address: "Sinaloa, Culiacán",
                priceShort: "$1.4M",
                priceFull: "$1,450,000",
                title: "Casa en Adolfo Lopez Mateos",
                location: "Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-adolfo-lopez-mateos/",
                photos: [
"casa-en-adolfo-lopez-mateos/images/foto-1.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-2.jpg","casa-en-adolfo-lopez-mateos/images/foto-3.jpg","casa-en-adolfo-lopez-mateos/images/foto-4.jpg","casa-en-adolfo-lopez-mateos/images/foto-5.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-6.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-7.jpg","casa-en-adolfo-lopez-mateos/images/foto-8.jpg","casa-en-adolfo-lopez-mateos/images/foto-9.jpg","casa-en-adolfo-lopez-mateos/images/foto-10.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-11.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-12.jpg","casa-en-adolfo-lopez-mateos/images/foto-13.jpg","casa-en-adolfo-lopez-mateos/images/foto-14.jpg","casa-en-adolfo-lopez-mateos/images/foto-15.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-16.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-17.jpg","casa-en-adolfo-lopez-mateos/images/foto-18.jpg","casa-en-adolfo-lopez-mateos/images/foto-19.jpg","casa-en-adolfo-lopez-mateos/images/foto-20.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-21.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-22.jpg","casa-en-adolfo-lopez-mateos/images/foto-23.jpg","casa-en-adolfo-lopez-mateos/images/foto-24.jpg","casa-en-adolfo-lopez-mateos/images/foto-25.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-26.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-27.jpg","casa-en-adolfo-lopez-mateos/images/foto-28.jpg","casa-en-adolfo-lopez-mateos/images/foto-29.jpg","casa-en-adolfo-lopez-mateos/images/foto-30.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-31.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-32.jpg","casa-en-adolfo-lopez-mateos/images/foto-33.jpg","casa-en-adolfo-lopez-mateos/images/foto-34.jpg","casa-en-adolfo-lopez-mateos/images/foto-35.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-36.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-37.jpg","casa-en-adolfo-lopez-mateos/images/foto-38.jpg","casa-en-adolfo-lopez-mateos/images/foto-39.jpg","casa-en-adolfo-lopez-mateos/images/foto-40.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-41.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-42.jpg","casa-en-adolfo-lopez-mateos/images/foto-43.jpg","casa-en-adolfo-lopez-mateos/images/foto-44.jpg","casa-en-adolfo-lopez-mateos/images/foto-45.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-46.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-47.jpg","casa-en-adolfo-lopez-mateos/images/foto-48.jpg","casa-en-adolfo-lopez-mateos/images/foto-49.jpg","casa-en-adolfo-lopez-mateos/images/foto-50.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-51.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-52.jpg","casa-en-adolfo-lopez-mateos/images/foto-53.jpg","casa-en-adolfo-lopez-mateos/images/foto-54.jpg","casa-en-adolfo-lopez-mateos/images/foto-55.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-56.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-57.jpg","casa-en-adolfo-lopez-mateos/images/foto-58.jpg","casa-en-adolfo-lopez-mateos/images/foto-59.jpg","casa-en-adolfo-lopez-mateos/images/foto-60.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-61.jpg",                    "casa-en-adolfo-lopez-mateos/images/foto-62.jpg"
                ]
            };

            // Propiedad 19: Casa en Privada Monaco, Paseos del Rey
            const privadamonacopaseosdelreyProperty = {
                address: "Paseos del Rey, Sinaloa, Culiacán",
                priceShort: "$1.6M",
                priceFull: "$1,590,000",
                title: "Casa en Privada Monaco, Paseos del Rey",
                location: "Paseos del Rey",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-privada-monaco-paseos-del-rey/",
                photos: [
"casa-en-privada-monaco-paseos-del-rey/images/foto-1.jpg",                    "casa-en-privada-monaco-paseos-del-rey/images/foto-2.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-3.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-4.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-5.jpg",
                    "casa-en-privada-monaco-paseos-del-rey/images/foto-6.jpg",                    "casa-en-privada-monaco-paseos-del-rey/images/foto-7.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-8.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-9.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-10.jpg",
                    "casa-en-privada-monaco-paseos-del-rey/images/foto-11.jpg",                    "casa-en-privada-monaco-paseos-del-rey/images/foto-12.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-13.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-14.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-15.jpg",
                    "casa-en-privada-monaco-paseos-del-rey/images/foto-16.jpg",                    "casa-en-privada-monaco-paseos-del-rey/images/foto-17.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-18.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-19.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-20.jpg",
                    "casa-en-privada-monaco-paseos-del-rey/images/foto-21.jpg",                    "casa-en-privada-monaco-paseos-del-rey/images/foto-22.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-23.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-24.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-25.jpg",
                    "casa-en-privada-monaco-paseos-del-rey/images/foto-26.jpg",                    "casa-en-privada-monaco-paseos-del-rey/images/foto-27.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-28.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-29.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-30.jpg",
                    "casa-en-privada-monaco-paseos-del-rey/images/foto-31.jpg",                    "casa-en-privada-monaco-paseos-del-rey/images/foto-32.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-33.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-34.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-35.jpg",
                    "casa-en-privada-monaco-paseos-del-rey/images/foto-36.jpg",                    "casa-en-privada-monaco-paseos-del-rey/images/foto-37.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-38.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-39.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-40.jpg",
                    "casa-en-privada-monaco-paseos-del-rey/images/foto-41.jpg",                    "casa-en-privada-monaco-paseos-del-rey/images/foto-42.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-43.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-44.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-45.jpg",
                    "casa-en-privada-monaco-paseos-del-rey/images/foto-46.jpg",                    "casa-en-privada-monaco-paseos-del-rey/images/foto-47.jpg","casa-en-privada-monaco-paseos-del-rey/images/foto-48.jpg"
                ]
            };

            // Propiedad 20: Venta de Casa 3 Recamaras en Portalegre en Culiacan
            const recamarasenportalegreenculiacanProperty = {
                address: "Fraccionamiento Portalegre, Culiacán, Sinaloa",
                priceShort: "$2.8M",
                priceFull: "$2,800,000",
                title: "Venta de Casa 3 Recamaras en Portalegre en Culiacan",
                location: "Fraccionamiento Portalegre, Culiacán, Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/venta-de-casa-3-recamaras-en-portalegre-en-culiacan/",
                photos: [
"venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-1.jpg",                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-2.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-3.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-4.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-5.jpg",
                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-6.jpg",                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-7.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-8.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-9.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-10.jpg",
                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-11.jpg",                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-12.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-13.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-14.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-15.jpg",
                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-16.jpg",                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-17.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-18.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-19.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-20.jpg",
                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-21.jpg",                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-22.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-23.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-24.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-25.jpg",
                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-26.jpg",                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-27.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-28.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-29.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-30.jpg",
                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-31.jpg",                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-32.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-33.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-34.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-35.jpg",
                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-36.jpg",                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-37.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-38.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-39.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-40.jpg",
                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-41.jpg",                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-42.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-43.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-44.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-45.jpg",
                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-46.jpg",                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-47.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-48.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-49.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-50.jpg",
                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-51.jpg",                    "venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-52.jpg","venta-de-casa-3-recamaras-en-portalegre-en-culiacan/images/foto-53.jpg"
                ]
            };

            // Propiedad 21: Venta de Casa por Calle Mariano Escobedo Centro de La Ciudad
            const callemarianoescobedocentrodelaciudadProperty = {
                address: "Culiacan",
                priceShort: "$4.0M",
                priceFull: "$4,000,000",
                title: "Venta de Casa por Calle Mariano Escobedo Centro de La Ciudad",
                location: "Culiacan",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/",
                photos: [
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-1.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-2.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-3.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-4.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-5.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-6.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-7.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-8.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-9.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-10.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-11.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-12.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-13.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-14.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-15.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-16.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-17.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-18.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-19.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-20.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-21.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-22.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-23.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-24.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-25.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-26.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-27.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-28.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-29.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-30.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-31.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-32.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-33.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-34.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-35.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-36.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-37.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-38.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-39.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-40.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-41.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-42.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-43.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-44.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-45.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-46.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-47.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-48.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-49.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-50.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-51.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-52.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-53.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-54.jpg","venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-55.jpg"
                ]
            };

            // Propiedad 22: Casa en Venta, La Cantera, Culiacan
            const lacanteraculiacanProperty = {
                address: "La Cantera, Culiacán",
                priceShort: "$8.0M",
                priceFull: "$7,950,000",
                title: "Casa en Venta, La Cantera, Culiacan",
                location: "La Cantera",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-la-cantera-culiacan/",
                photos: [
                    "casa-en-venta-la-cantera-culiacan/images/foto-1.jpg","casa-en-venta-la-cantera-culiacan/images/foto-2.jpg","casa-en-venta-la-cantera-culiacan/images/foto-3.jpg","casa-en-venta-la-cantera-culiacan/images/foto-4.jpg","casa-en-venta-la-cantera-culiacan/images/foto-5.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-6.jpg","casa-en-venta-la-cantera-culiacan/images/foto-7.jpg","casa-en-venta-la-cantera-culiacan/images/foto-8.jpg","casa-en-venta-la-cantera-culiacan/images/foto-9.jpg","casa-en-venta-la-cantera-culiacan/images/foto-10.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-11.jpg","casa-en-venta-la-cantera-culiacan/images/foto-12.jpg","casa-en-venta-la-cantera-culiacan/images/foto-13.jpg","casa-en-venta-la-cantera-culiacan/images/foto-14.jpg","casa-en-venta-la-cantera-culiacan/images/foto-15.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-16.jpg","casa-en-venta-la-cantera-culiacan/images/foto-17.jpg","casa-en-venta-la-cantera-culiacan/images/foto-18.jpg","casa-en-venta-la-cantera-culiacan/images/foto-19.jpg","casa-en-venta-la-cantera-culiacan/images/foto-20.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-21.jpg","casa-en-venta-la-cantera-culiacan/images/foto-22.jpg","casa-en-venta-la-cantera-culiacan/images/foto-23.jpg","casa-en-venta-la-cantera-culiacan/images/foto-24.jpg","casa-en-venta-la-cantera-culiacan/images/foto-25.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-26.jpg","casa-en-venta-la-cantera-culiacan/images/foto-27.jpg","casa-en-venta-la-cantera-culiacan/images/foto-28.jpg","casa-en-venta-la-cantera-culiacan/images/foto-29.jpg","casa-en-venta-la-cantera-culiacan/images/foto-30.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-31.jpg","casa-en-venta-la-cantera-culiacan/images/foto-32.jpg","casa-en-venta-la-cantera-culiacan/images/foto-33.jpg","casa-en-venta-la-cantera-culiacan/images/foto-34.jpg","casa-en-venta-la-cantera-culiacan/images/foto-35.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-36.jpg","casa-en-venta-la-cantera-culiacan/images/foto-37.jpg","casa-en-venta-la-cantera-culiacan/images/foto-38.jpg","casa-en-venta-la-cantera-culiacan/images/foto-39.jpg","casa-en-venta-la-cantera-culiacan/images/foto-40.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-41.jpg","casa-en-venta-la-cantera-culiacan/images/foto-42.jpg","casa-en-venta-la-cantera-culiacan/images/foto-43.jpg","casa-en-venta-la-cantera-culiacan/images/foto-44.jpg","casa-en-venta-la-cantera-culiacan/images/foto-45.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-46.jpg","casa-en-venta-la-cantera-culiacan/images/foto-47.jpg","casa-en-venta-la-cantera-culiacan/images/foto-48.jpg","casa-en-venta-la-cantera-culiacan/images/foto-49.jpg","casa-en-venta-la-cantera-culiacan/images/foto-50.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-51.jpg","casa-en-venta-la-cantera-culiacan/images/foto-52.jpg","casa-en-venta-la-cantera-culiacan/images/foto-53.jpg","casa-en-venta-la-cantera-culiacan/images/foto-54.jpg","casa-en-venta-la-cantera-culiacan/images/foto-55.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-56.jpg","casa-en-venta-la-cantera-culiacan/images/foto-57.jpg","casa-en-venta-la-cantera-culiacan/images/foto-58.jpg","casa-en-venta-la-cantera-culiacan/images/foto-59.jpg","casa-en-venta-la-cantera-culiacan/images/foto-60.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-61.jpg","casa-en-venta-la-cantera-culiacan/images/foto-62.jpg","casa-en-venta-la-cantera-culiacan/images/foto-63.jpg","casa-en-venta-la-cantera-culiacan/images/foto-64.jpg","casa-en-venta-la-cantera-culiacan/images/foto-65.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-66.jpg","casa-en-venta-la-cantera-culiacan/images/foto-67.jpg","casa-en-venta-la-cantera-culiacan/images/foto-68.jpg","casa-en-venta-la-cantera-culiacan/images/foto-69.jpg","casa-en-venta-la-cantera-culiacan/images/foto-70.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-71.jpg","casa-en-venta-la-cantera-culiacan/images/foto-72.jpg","casa-en-venta-la-cantera-culiacan/images/foto-73.jpg","casa-en-venta-la-cantera-culiacan/images/foto-74.jpg","casa-en-venta-la-cantera-culiacan/images/foto-75.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-76.jpg","casa-en-venta-la-cantera-culiacan/images/foto-77.jpg","casa-en-venta-la-cantera-culiacan/images/foto-78.jpg","casa-en-venta-la-cantera-culiacan/images/foto-79.jpg","casa-en-venta-la-cantera-culiacan/images/foto-80.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-81.jpg","casa-en-venta-la-cantera-culiacan/images/foto-82.jpg","casa-en-venta-la-cantera-culiacan/images/foto-83.jpg","casa-en-venta-la-cantera-culiacan/images/foto-84.jpg"
                ]
            };

            // Propiedad 23: CASA EN VENTA EN LA PRIMAVERA. BARRIO SAN FRANCISCO SUR. (01)
            const enlaprimaverabarriosanfranciscosur01Property = {
                address: "Barrio San Francisco, Culiacán",
                priceShort: "$6.3M",
                priceFull: "$6,300,000",
                title: "CASA EN VENTA EN LA PRIMAVERA. BARRIO SAN FRANCISCO SUR. (01)",
                location: "Barrio San Francisco",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/",
                photos: [
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-1.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-2.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-3.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-4.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-5.jpg",
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-6.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-7.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-8.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-9.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-10.jpg",
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-11.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-12.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-13.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-14.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-15.jpg",
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-16.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-17.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-18.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-19.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-20.jpg",
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-21.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-22.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-23.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-24.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-25.jpg",
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-26.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-27.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-28.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-29.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-30.jpg",
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-31.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-32.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-33.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-34.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-35.jpg",
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-36.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-37.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-38.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-39.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-40.jpg",
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-41.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-42.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-43.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-44.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-45.jpg",
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-46.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-47.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-48.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-49.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-50.jpg",
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-51.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-52.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-53.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-54.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-55.jpg",
                    "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-56.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-57.jpg","casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-58.jpg"
                ]
            };

            // Propiedad 24: Casa en venta en Fracc Colinas De San Miguel
            const enfracccolinasdesanmiguelProperty = {
                address: "Cerro De La Memoria 1907, Culiacán",
                priceShort: "$7.0M",
                priceFull: "$7,000,000",
                title: "Casa en venta en Fracc Colinas De San Miguel",
                location: "Cerro De La Memoria 1907",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-fracc-colinas-de-san-miguel/",
                photos: [
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-1.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-2.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-3.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-4.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-5.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-6.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-7.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-8.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-9.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-10.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-11.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-12.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-13.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-14.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-15.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-16.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-17.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-18.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-19.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-20.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-21.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-22.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-23.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-24.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-25.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-26.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-27.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-28.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-29.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-30.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-31.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-32.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-33.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-34.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-35.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-36.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-37.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-38.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-39.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-40.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-41.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-42.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-43.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-44.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-45.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-46.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-47.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-48.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-49.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-50.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-51.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-52.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-53.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-54.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-55.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-56.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-57.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-58.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-59.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-60.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-61.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-62.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-63.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-64.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-65.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-66.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-67.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-68.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-69.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-70.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-71.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-72.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-73.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-74.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-75.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-76.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-77.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-78.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-79.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-80.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-81.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-82.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-83.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-84.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-85.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-86.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-87.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-88.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-89.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-90.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-91.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-92.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-93.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-94.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-95.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-96.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-97.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-98.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-99.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-100.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-101.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-102.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-103.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-104.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-105.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-106.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-107.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-108.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-109.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-110.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-111.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-112.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-113.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-114.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-115.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-116.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-117.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-118.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-119.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-120.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-121.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-122.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-123.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-124.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-125.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-126.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-127.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-128.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-129.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-130.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-131.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-132.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-133.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-134.jpg","casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-135.jpg",
                    "casa-en-venta-en-fracc-colinas-de-san-miguel/images/foto-136.jpg"
                ]
            };

            // Propiedad 25: Casa en Venta en Privada con Excedente 4 Recámaras sector La Conquista.
            const enprivadaconexcedente4recamarassectorlaconquistaProperty = {
                address: "La Conquista, Culiacán",
                priceShort: "$6.7M",
                priceFull: "$6,700,000",
                title: "Casa en Venta en Privada con Excedente 4 Recámaras sector La Conquista.",
                location: "La Conquista",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/",
                photos: [
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-1.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-2.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-3.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-4.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-5.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-6.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-7.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-8.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-9.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-10.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-11.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-12.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-13.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-14.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-15.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-16.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-17.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-18.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-19.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-20.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-21.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-22.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-23.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-24.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-25.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-26.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-27.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-28.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-29.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-30.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-31.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-32.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-33.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-34.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-35.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-36.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-37.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-38.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-39.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-40.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-41.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-42.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-43.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-44.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-45.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-46.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-47.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-48.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-49.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-50.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-51.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-52.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-53.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-54.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-55.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-56.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-57.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-58.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-59.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-60.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-61.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-62.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-63.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-64.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-65.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-66.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-67.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-68.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-69.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-70.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-71.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-72.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-73.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-74.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-75.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-76.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-77.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-78.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-79.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-80.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-81.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-82.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-83.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-84.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-85.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-86.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-87.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-88.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-89.jpg","casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-90.jpg",
                    "casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/images/foto-91.jpg"
                ]
            };

            // Propiedad 26: Casa en venta en Tierra Blanca
            const tierrablancaProperty = {
                lat: 24.7830, lng: -107.4080, // Tierra Blanca, Culiacán (Geocoder V1.5)
                address: "Tierra Blanca, Culiacán",
                priceShort: "$6.9M",
                priceFull: "$6,870,000",
                title: "Casa en venta en Tierra Blanca",
                location: "Tierra Blanca",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-tierra-blanca/",
                photos: [
                    "casa-en-venta-en-tierra-blanca/images/foto-1.jpg","casa-en-venta-en-tierra-blanca/images/foto-2.jpg","casa-en-venta-en-tierra-blanca/images/foto-3.jpg","casa-en-venta-en-tierra-blanca/images/foto-4.jpg","casa-en-venta-en-tierra-blanca/images/foto-5.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-6.jpg","casa-en-venta-en-tierra-blanca/images/foto-7.jpg","casa-en-venta-en-tierra-blanca/images/foto-8.jpg","casa-en-venta-en-tierra-blanca/images/foto-9.jpg","casa-en-venta-en-tierra-blanca/images/foto-10.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-11.jpg","casa-en-venta-en-tierra-blanca/images/foto-12.jpg","casa-en-venta-en-tierra-blanca/images/foto-13.jpg","casa-en-venta-en-tierra-blanca/images/foto-14.jpg","casa-en-venta-en-tierra-blanca/images/foto-15.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-16.jpg","casa-en-venta-en-tierra-blanca/images/foto-17.jpg","casa-en-venta-en-tierra-blanca/images/foto-18.jpg","casa-en-venta-en-tierra-blanca/images/foto-19.jpg","casa-en-venta-en-tierra-blanca/images/foto-20.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-21.jpg","casa-en-venta-en-tierra-blanca/images/foto-22.jpg","casa-en-venta-en-tierra-blanca/images/foto-23.jpg","casa-en-venta-en-tierra-blanca/images/foto-24.jpg","casa-en-venta-en-tierra-blanca/images/foto-25.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-26.jpg","casa-en-venta-en-tierra-blanca/images/foto-27.jpg","casa-en-venta-en-tierra-blanca/images/foto-28.jpg","casa-en-venta-en-tierra-blanca/images/foto-29.jpg","casa-en-venta-en-tierra-blanca/images/foto-30.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-31.jpg","casa-en-venta-en-tierra-blanca/images/foto-32.jpg","casa-en-venta-en-tierra-blanca/images/foto-33.jpg","casa-en-venta-en-tierra-blanca/images/foto-34.jpg","casa-en-venta-en-tierra-blanca/images/foto-35.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-36.jpg","casa-en-venta-en-tierra-blanca/images/foto-37.jpg","casa-en-venta-en-tierra-blanca/images/foto-38.jpg","casa-en-venta-en-tierra-blanca/images/foto-39.jpg","casa-en-venta-en-tierra-blanca/images/foto-40.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-41.jpg","casa-en-venta-en-tierra-blanca/images/foto-42.jpg","casa-en-venta-en-tierra-blanca/images/foto-43.jpg","casa-en-venta-en-tierra-blanca/images/foto-44.jpg","casa-en-venta-en-tierra-blanca/images/foto-45.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-46.jpg","casa-en-venta-en-tierra-blanca/images/foto-47.jpg","casa-en-venta-en-tierra-blanca/images/foto-48.jpg","casa-en-venta-en-tierra-blanca/images/foto-49.jpg","casa-en-venta-en-tierra-blanca/images/foto-50.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-51.jpg","casa-en-venta-en-tierra-blanca/images/foto-52.jpg","casa-en-venta-en-tierra-blanca/images/foto-53.jpg","casa-en-venta-en-tierra-blanca/images/foto-54.jpg","casa-en-venta-en-tierra-blanca/images/foto-55.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-56.jpg","casa-en-venta-en-tierra-blanca/images/foto-57.jpg","casa-en-venta-en-tierra-blanca/images/foto-58.jpg","casa-en-venta-en-tierra-blanca/images/foto-59.jpg","casa-en-venta-en-tierra-blanca/images/foto-60.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-61.jpg","casa-en-venta-en-tierra-blanca/images/foto-62.jpg","casa-en-venta-en-tierra-blanca/images/foto-63.jpg","casa-en-venta-en-tierra-blanca/images/foto-64.jpg","casa-en-venta-en-tierra-blanca/images/foto-65.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-66.jpg","casa-en-venta-en-tierra-blanca/images/foto-67.jpg","casa-en-venta-en-tierra-blanca/images/foto-68.jpg","casa-en-venta-en-tierra-blanca/images/foto-69.jpg","casa-en-venta-en-tierra-blanca/images/foto-70.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-71.jpg","casa-en-venta-en-tierra-blanca/images/foto-72.jpg","casa-en-venta-en-tierra-blanca/images/foto-73.jpg","casa-en-venta-en-tierra-blanca/images/foto-74.jpg","casa-en-venta-en-tierra-blanca/images/foto-75.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-76.jpg","casa-en-venta-en-tierra-blanca/images/foto-77.jpg","casa-en-venta-en-tierra-blanca/images/foto-78.jpg","casa-en-venta-en-tierra-blanca/images/foto-79.jpg","casa-en-venta-en-tierra-blanca/images/foto-80.jpg",
                    "casa-en-venta-en-tierra-blanca/images/foto-81.jpg","casa-en-venta-en-tierra-blanca/images/foto-82.jpg"
                ]
            };

            // Propiedad 27: Casa de Lujo en Venta Privada con Alberca AMORADA
            const privadaconalbercaamoradaProperty = {
                address: "Amorada, Culiacán",
                priceShort: "$6.8M",
                priceFull: "$6,750,000",
                title: "Casa de Lujo en Venta Privada con Alberca AMORADA",
                location: "Amorada",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-de-lujo-en-venta-privada-con-alberca-amorada/",
                photos: [
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-1.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-2.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-3.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-4.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-5.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-6.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-7.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-8.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-9.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-10.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-11.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-12.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-13.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-14.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-15.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-16.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-17.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-18.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-19.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-20.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-21.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-22.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-23.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-24.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-25.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-26.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-27.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-28.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-29.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-30.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-31.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-32.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-33.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-34.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-35.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-36.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-37.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-38.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-39.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-40.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-41.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-42.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-43.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-44.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-45.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-46.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-47.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-48.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-49.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-50.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-51.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-52.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-53.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-54.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-55.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-56.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-57.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-58.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-59.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-60.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-61.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-62.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-63.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-64.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-65.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-66.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-67.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-68.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-69.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-70.jpg",
                    "casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-71.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-72.jpg","casa-de-lujo-en-venta-privada-con-alberca-amorada/images/foto-73.jpg"
                ]
            };

            // Propiedad 28: Casa en venta en Fracc La Primavera
            const fracclaprimaveraProperty = {
                address: "San Agustín 266, Culiacán",
                priceShort: "$6.0M",
                priceFull: "$6,000,000",
                title: "Casa en venta en Fracc La Primavera",
                location: "San Agustín 266",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-fracc-la-primavera/",
                photos: [
                    "casa-en-venta-en-fracc-la-primavera/images/foto-1.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-2.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-3.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-4.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-5.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-6.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-7.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-8.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-9.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-10.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-11.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-12.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-13.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-14.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-15.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-16.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-17.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-18.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-19.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-20.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-21.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-22.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-23.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-24.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-25.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-26.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-27.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-28.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-29.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-30.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-31.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-32.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-33.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-34.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-35.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-36.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-37.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-38.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-39.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-40.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-41.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-42.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-43.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-44.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-45.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-46.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-47.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-48.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-49.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-50.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-51.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-52.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-53.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-54.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-55.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-56.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-57.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-58.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-59.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-60.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-61.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-62.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-63.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-64.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-65.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-66.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-67.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-68.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-69.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-70.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-71.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-72.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-73.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-74.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-75.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-76.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-77.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-78.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-79.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-80.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-81.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-82.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-83.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-84.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-85.jpg",
                    "casa-en-venta-en-fracc-la-primavera/images/foto-86.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-87.jpg","casa-en-venta-en-fracc-la-primavera/images/foto-88.jpg"
                ]
            };

            // Propiedad 29: Residencia en venta en Barrio San Francisco la Primavera .01 *
            const barriosanfranciscolaprimavera01Property = {
                address: "San Francisco, Culiacán",
                priceShort: "$6.5M",
                priceFull: "$6,490,000",
                title: "Residencia en venta en Barrio San Francisco la Primavera .01 *",
                location: "Barrio San Francisco, Fraccionamiento La Primavera, Culiacán, Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/residencia-en-venta-en-barrio-san-francisco-la-primavera-01/",
                photos: [
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-1.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-2.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-3.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-4.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-5.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-6.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-7.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-8.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-9.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-10.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-11.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-12.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-13.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-14.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-15.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-16.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-17.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-18.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-19.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-20.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-21.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-22.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-23.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-24.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-25.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-26.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-27.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-28.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-29.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-30.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-31.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-32.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-33.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-34.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-35.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-36.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-37.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-38.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-39.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-40.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-41.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-42.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-43.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-44.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-45.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-46.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-47.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-48.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-49.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-50.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-51.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-52.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-53.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-54.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-55.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-56.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-57.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-58.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-59.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-60.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-61.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-62.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-63.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-64.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-65.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-66.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-67.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-68.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-69.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-70.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-71.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-72.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-73.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-74.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-75.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-76.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-77.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-78.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-79.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-80.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-81.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-82.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-83.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-84.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-85.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-86.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-87.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-88.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-89.jpg","residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-90.jpg",
                    "residencia-en-venta-en-barrio-san-francisco-la-primavera-01/images/foto-91.jpg"
                ]
            };

            // Propiedad 30: VENTA CASA PRIVADA TABACHINES
            const privadatabachinesProperty = {
                address: "Culiacan",
                priceShort: "$6.2M",
                priceFull: "$6,200,000",
                title: "VENTA CASA PRIVADA TABACHINES",
                location: "Culiacan",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/venta-casa-privada-tabachines/",
                photos: [
                    "venta-casa-privada-tabachines/images/foto-1.jpg","venta-casa-privada-tabachines/images/foto-2.jpg","venta-casa-privada-tabachines/images/foto-3.jpg","venta-casa-privada-tabachines/images/foto-4.jpg","venta-casa-privada-tabachines/images/foto-5.jpg",
                    "venta-casa-privada-tabachines/images/foto-6.jpg","venta-casa-privada-tabachines/images/foto-7.jpg","venta-casa-privada-tabachines/images/foto-8.jpg","venta-casa-privada-tabachines/images/foto-9.jpg","venta-casa-privada-tabachines/images/foto-10.jpg",
                    "venta-casa-privada-tabachines/images/foto-11.jpg","venta-casa-privada-tabachines/images/foto-12.jpg","venta-casa-privada-tabachines/images/foto-13.jpg","venta-casa-privada-tabachines/images/foto-14.jpg","venta-casa-privada-tabachines/images/foto-15.jpg",
                    "venta-casa-privada-tabachines/images/foto-16.jpg","venta-casa-privada-tabachines/images/foto-17.jpg","venta-casa-privada-tabachines/images/foto-18.jpg","venta-casa-privada-tabachines/images/foto-19.jpg","venta-casa-privada-tabachines/images/foto-20.jpg",
                    "venta-casa-privada-tabachines/images/foto-21.jpg","venta-casa-privada-tabachines/images/foto-22.jpg","venta-casa-privada-tabachines/images/foto-23.jpg","venta-casa-privada-tabachines/images/foto-24.jpg","venta-casa-privada-tabachines/images/foto-25.jpg",
                    "venta-casa-privada-tabachines/images/foto-26.jpg","venta-casa-privada-tabachines/images/foto-27.jpg","venta-casa-privada-tabachines/images/foto-28.jpg","venta-casa-privada-tabachines/images/foto-29.jpg","venta-casa-privada-tabachines/images/foto-30.jpg",
                    "venta-casa-privada-tabachines/images/foto-31.jpg","venta-casa-privada-tabachines/images/foto-32.jpg","venta-casa-privada-tabachines/images/foto-33.jpg","venta-casa-privada-tabachines/images/foto-34.jpg","venta-casa-privada-tabachines/images/foto-35.jpg",
                    "venta-casa-privada-tabachines/images/foto-36.jpg","venta-casa-privada-tabachines/images/foto-37.jpg","venta-casa-privada-tabachines/images/foto-38.jpg","venta-casa-privada-tabachines/images/foto-39.jpg","venta-casa-privada-tabachines/images/foto-40.jpg",
                    "venta-casa-privada-tabachines/images/foto-41.jpg","venta-casa-privada-tabachines/images/foto-42.jpg","venta-casa-privada-tabachines/images/foto-43.jpg","venta-casa-privada-tabachines/images/foto-44.jpg","venta-casa-privada-tabachines/images/foto-45.jpg",
                    "venta-casa-privada-tabachines/images/foto-46.jpg","venta-casa-privada-tabachines/images/foto-47.jpg","venta-casa-privada-tabachines/images/foto-48.jpg","venta-casa-privada-tabachines/images/foto-49.jpg","venta-casa-privada-tabachines/images/foto-50.jpg",
                    "venta-casa-privada-tabachines/images/foto-51.jpg","venta-casa-privada-tabachines/images/foto-52.jpg","venta-casa-privada-tabachines/images/foto-53.jpg","venta-casa-privada-tabachines/images/foto-54.jpg","venta-casa-privada-tabachines/images/foto-55.jpg",
                    "venta-casa-privada-tabachines/images/foto-56.jpg","venta-casa-privada-tabachines/images/foto-57.jpg","venta-casa-privada-tabachines/images/foto-58.jpg","venta-casa-privada-tabachines/images/foto-59.jpg","venta-casa-privada-tabachines/images/foto-60.jpg",
                    "venta-casa-privada-tabachines/images/foto-61.jpg","venta-casa-privada-tabachines/images/foto-62.jpg","venta-casa-privada-tabachines/images/foto-63.jpg","venta-casa-privada-tabachines/images/foto-64.jpg","venta-casa-privada-tabachines/images/foto-65.jpg",
                    "venta-casa-privada-tabachines/images/foto-66.jpg","venta-casa-privada-tabachines/images/foto-67.jpg","venta-casa-privada-tabachines/images/foto-68.jpg","venta-casa-privada-tabachines/images/foto-69.jpg","venta-casa-privada-tabachines/images/foto-70.jpg",
                    "venta-casa-privada-tabachines/images/foto-71.jpg","venta-casa-privada-tabachines/images/foto-72.jpg"
                ]
            };

            // Propiedad 31: Casa Espacios Barcelona como Nueva, acabados de Primera!
            const barcelonacomonuevaacabadosdeprimeraProperty = {
                address: "Gerona 3057, Culiacán",
                priceShort: "$2.9M",
                priceFull: "$2,900,000",
                title: "Casa Espacios Barcelona como Nueva, acabados de Primera!",
                location: "Gerona 3057",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-espacios-barcelona-como-nueva-acabados-de-primera/",
                photos: [
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-1.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-2.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-3.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-4.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-5.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-6.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-7.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-8.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-9.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-10.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-11.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-12.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-13.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-14.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-15.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-16.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-17.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-18.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-19.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-20.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-21.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-22.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-23.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-24.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-25.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-26.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-27.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-28.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-29.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-30.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-31.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-32.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-33.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-34.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-35.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-36.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-37.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-38.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-39.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-40.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-41.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-42.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-43.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-44.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-45.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-46.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-47.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-48.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-49.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-50.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-51.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-52.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-53.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-54.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-55.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-56.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-57.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-58.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-59.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-60.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-61.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-62.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-63.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-64.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-65.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-66.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-67.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-68.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-69.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-70.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-71.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-72.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-73.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-74.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-75.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-76.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-77.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-78.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-79.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-80.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-81.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-82.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-83.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-84.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-85.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-86.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-87.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-88.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-89.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-90.jpg",
                    "casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-91.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-92.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-93.jpg","casa-espacios-barcelona-como-nueva-acabados-de-primera/images/foto-94.jpg"
                ]
            };

            // Propiedad 32: Casa en venta en Quinta Americana sector Las Quintas
            const quintaamericanasectorlasquintasProperty = {
                address: "Las Quintas, Culiacán",
                priceShort: "$5.6M",
                priceFull: "$5,600,000",
                title: "Casa en venta en Quinta Americana sector Las Quintas",
                location: "Las Quintas",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-quinta-americana-sector-las-quintas/",
                photos: [
                    "casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-1.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-2.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-3.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-4.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-5.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-6.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-7.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-8.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-9.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-10.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-11.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-12.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-13.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-14.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-15.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-16.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-17.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-18.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-19.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-20.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-21.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-22.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-23.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-24.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-25.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-26.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-27.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-28.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-29.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-30.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-31.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-32.jpg","casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-33.jpg"
                ]
            };

            // Propiedad 33: Casa en Venta en Isla Musalá, Culiacán
            const islamusalaculiacanProperty = {
                address: "Isla Musalá, Culiacán",
                priceShort: "$6.0M",
                priceFull: "$6,000,000",
                title: "Casa en Venta en Isla Musalá, Culiacán",
                location: "Isla Musalá",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-isla-musala-culiacan/",
                photos: [
                    "casa-en-venta-en-isla-musala-culiacan/images/foto-1.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-2.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-3.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-4.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-5.jpg",
                    "casa-en-venta-en-isla-musala-culiacan/images/foto-6.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-7.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-8.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-9.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-10.jpg",
                    "casa-en-venta-en-isla-musala-culiacan/images/foto-11.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-12.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-13.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-14.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-15.jpg",
                    "casa-en-venta-en-isla-musala-culiacan/images/foto-16.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-17.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-18.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-19.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-20.jpg",
                    "casa-en-venta-en-isla-musala-culiacan/images/foto-21.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-22.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-23.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-24.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-25.jpg",
                    "casa-en-venta-en-isla-musala-culiacan/images/foto-26.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-27.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-28.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-29.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-30.jpg",
                    "casa-en-venta-en-isla-musala-culiacan/images/foto-31.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-32.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-33.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-34.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-35.jpg",
                    "casa-en-venta-en-isla-musala-culiacan/images/foto-36.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-37.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-38.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-39.jpg","casa-en-venta-en-isla-musala-culiacan/images/foto-40.jpg"
                ]
            };

            // Propiedad 34: Casa en venta en Recursos Hidraulicos privada Santa Inés
            const recursoshidraulicosprivadasantainesProperty = {
                address: "Recursos Hidráulicos, Culiacán",
                priceShort: "$6.1M",
                priceFull: "$6,100,000",
                title: "Casa en venta en Recursos Hidraulicos privada Santa Inés",
                location: "Recursos Hidráulicos",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/",
                photos: [
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-1.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-2.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-3.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-4.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-5.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-6.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-7.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-8.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-9.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-10.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-11.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-12.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-13.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-14.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-15.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-16.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-17.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-18.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-19.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-20.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-21.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-22.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-23.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-24.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-25.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-26.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-27.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-28.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-29.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-30.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-31.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-32.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-33.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-34.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-35.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-36.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-37.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-38.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-39.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-40.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-41.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-42.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-43.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-44.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-45.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-46.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-47.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-48.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-49.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-50.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-51.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-52.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-53.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-54.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-55.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-56.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-57.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-58.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-59.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-60.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-61.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-62.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-63.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-64.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-65.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-66.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-67.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-68.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-69.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-70.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-71.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-72.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-73.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-74.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-75.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-76.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-77.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-78.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-79.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-80.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-81.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-82.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-83.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-84.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-85.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-86.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-87.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-88.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-89.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-90.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-91.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-92.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-93.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-94.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-95.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-96.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-97.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-98.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-99.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-100.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-101.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-102.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-103.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-104.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-105.jpg",
                    "casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-106.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-107.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-108.jpg","casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/images/foto-109.jpg"
                ]
            };

            // Propiedad 35: Hermosa casa en venta en Belcantto Residencial, lista para habitar
            const hermosabelcanttoresidenciallistaparahabitarProperty = {
                address: "Belcantto Residencial - Privada Aprico, Culiacán",
                priceShort: "$5.5M",
                priceFull: "$5,500,000",
                title: "Hermosa casa en venta en Belcantto Residencial, lista para habitar",
                location: "Privada Aprico, Fraccionamiento Belcantto Residencial, Culiacán, Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/",
                photos: [
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-1.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-2.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-3.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-4.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-5.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-6.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-7.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-8.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-9.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-10.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-11.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-12.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-13.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-14.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-15.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-16.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-17.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-18.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-19.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-20.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-21.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-22.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-23.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-24.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-25.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-26.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-27.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-28.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-29.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-30.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-31.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-32.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-33.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-34.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-35.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-36.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-37.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-38.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-39.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-40.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-41.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-42.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-43.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-44.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-45.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-46.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-47.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-48.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-49.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-50.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-51.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-52.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-53.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-54.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-55.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-56.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-57.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-58.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-59.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-60.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-61.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-62.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-63.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-64.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-65.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-66.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-67.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-68.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-69.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-70.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-71.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-72.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-73.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-74.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-75.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-76.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-77.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-78.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-79.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-80.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-81.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-82.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-83.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-84.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-85.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-86.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-87.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-88.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-89.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-90.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-91.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-92.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-93.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-94.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-95.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-96.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-97.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-98.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-99.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-100.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-101.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-102.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-103.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-104.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-105.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-106.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-107.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-108.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-109.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-110.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-111.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-112.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-113.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-114.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-115.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-116.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-117.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-118.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-119.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-120.jpg",
                    "hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-121.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-122.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-123.jpg","hermosa-casa-en-venta-en-belcantto-residencial-lista-para-habitar/images/foto-124.jpg"
                ]
            };
            // Propiedad 36: CASA EN VENTA EN LA ISLA MUSALA , CULIACÀN SINALOA
            const islamusalaculiacansinaloaProperty = {
                address: "La Isla Musalá, Culiacán, Sinaloa",
                priceShort: "$8.4M",
                priceFull: "$8,400,000",
                title: "CASA EN VENTA EN LA ISLA MUSALA , CULIACÀN SINALOA",
                location: "La Isla Musalá",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-la-isla-musala-culiacan-sinaloa/",
                photos: [
                    "casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-1.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-2.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-3.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-4.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-5.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-6.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-7.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-8.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-9.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-10.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-11.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-12.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-13.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-14.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-15.jpg","casa-en-venta-en-la-isla-musala-culiacan-sinaloa/images/foto-16.jpg"
                ]
            };

            // Propiedad 37: Venta casa guadalupe
            const guadalupeProperty = {
                address: "Guadalupe, Culiacán, Sinaloa",
                priceShort: "$8.0M",
                priceFull: "$8,000,000",
                title: "Venta casa guadalupe",
                location: "Guadalupe",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/venta-casa-guadalupe/",
                photos: [
                    "venta-casa-guadalupe/images/foto-1.jpg","venta-casa-guadalupe/images/foto-2.jpg","venta-casa-guadalupe/images/foto-3.jpg","venta-casa-guadalupe/images/foto-4.jpg","venta-casa-guadalupe/images/foto-5.jpg","venta-casa-guadalupe/images/foto-6.jpg","venta-casa-guadalupe/images/foto-7.jpg","venta-casa-guadalupe/images/foto-8.jpg","venta-casa-guadalupe/images/foto-9.jpg","venta-casa-guadalupe/images/foto-10.jpg","venta-casa-guadalupe/images/foto-11.jpg","venta-casa-guadalupe/images/foto-12.jpg","venta-casa-guadalupe/images/foto-13.jpg","venta-casa-guadalupe/images/foto-14.jpg","venta-casa-guadalupe/images/foto-15.jpg","venta-casa-guadalupe/images/foto-16.jpg","venta-casa-guadalupe/images/foto-17.jpg","venta-casa-guadalupe/images/foto-18.jpg","venta-casa-guadalupe/images/foto-19.jpg","venta-casa-guadalupe/images/foto-20.jpg","venta-casa-guadalupe/images/foto-21.jpg","venta-casa-guadalupe/images/foto-22.jpg","venta-casa-guadalupe/images/foto-23.jpg","venta-casa-guadalupe/images/foto-24.jpg","venta-casa-guadalupe/images/foto-25.jpg","venta-casa-guadalupe/images/foto-26.jpg","venta-casa-guadalupe/images/foto-27.jpg","venta-casa-guadalupe/images/foto-28.jpg","venta-casa-guadalupe/images/foto-29.jpg","venta-casa-guadalupe/images/foto-30.jpg","venta-casa-guadalupe/images/foto-31.jpg","venta-casa-guadalupe/images/foto-32.jpg","venta-casa-guadalupe/images/foto-33.jpg","venta-casa-guadalupe/images/foto-34.jpg","venta-casa-guadalupe/images/foto-35.jpg","venta-casa-guadalupe/images/foto-36.jpg"
                ]
            };

            // Propiedad 38: VENTA PROPIEDAD PRIVADA PRIVANZAS
            const privadaprivanzasProperty = {
                address: "Privada Privanzas, Culiacán, Sinaloa",
                priceShort: "$8.0M",
                priceFull: "$8,000,000",
                title: "VENTA PROPIEDAD PRIVADA PRIVANZAS",
                location: "Privada Privanzas",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/venta-propiedad-privada-privanzas/",
                photos: [
                    "venta-propiedad-privada-privanzas/images/foto-1.jpg","venta-propiedad-privada-privanzas/images/foto-2.jpg","venta-propiedad-privada-privanzas/images/foto-3.jpg","venta-propiedad-privada-privanzas/images/foto-4.jpg","venta-propiedad-privada-privanzas/images/foto-5.jpg","venta-propiedad-privada-privanzas/images/foto-6.jpg","venta-propiedad-privada-privanzas/images/foto-7.jpg","venta-propiedad-privada-privanzas/images/foto-8.jpg","venta-propiedad-privada-privanzas/images/foto-9.jpg","venta-propiedad-privada-privanzas/images/foto-10.jpg","venta-propiedad-privada-privanzas/images/foto-11.jpg","venta-propiedad-privada-privanzas/images/foto-12.jpg","venta-propiedad-privada-privanzas/images/foto-13.jpg","venta-propiedad-privada-privanzas/images/foto-14.jpg","venta-propiedad-privada-privanzas/images/foto-15.jpg","venta-propiedad-privada-privanzas/images/foto-16.jpg","venta-propiedad-privada-privanzas/images/foto-17.jpg","venta-propiedad-privada-privanzas/images/foto-18.jpg","venta-propiedad-privada-privanzas/images/foto-19.jpg","venta-propiedad-privada-privanzas/images/foto-20.jpg","venta-propiedad-privada-privanzas/images/foto-21.jpg","venta-propiedad-privada-privanzas/images/foto-22.jpg","venta-propiedad-privada-privanzas/images/foto-23.jpg","venta-propiedad-privada-privanzas/images/foto-24.jpg","venta-propiedad-privada-privanzas/images/foto-25.jpg","venta-propiedad-privada-privanzas/images/foto-26.jpg","venta-propiedad-privada-privanzas/images/foto-27.jpg","venta-propiedad-privada-privanzas/images/foto-28.jpg","venta-propiedad-privada-privanzas/images/foto-29.jpg","venta-propiedad-privada-privanzas/images/foto-30.jpg"
                ]
            };

            // Propiedad 39: Casa Venta Colinas San Miguel Culiacán 8,450,000
            const colinassanmiguelculiacan8450000Property = {
                address: "Fraccionamiento Colinas de San Miguel, Culiacán, Sinaloa",
                priceShort: "$8.5M",
                priceFull: "$8,450,000",
                title: "Casa Venta Colinas San Miguel Culiacán 8,450,000",
                location: "Fraccionamiento Colinas de San Miguel, Culiacán, Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-venta-colinas-san-miguel-culiacan-8-450-000/",
                photos: [
                    "casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-1.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-2.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-3.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-4.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-5.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-6.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-7.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-8.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-9.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-10.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-11.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-12.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-13.jpg","casa-venta-colinas-san-miguel-culiacan-8-450-000/images/foto-14.jpg"
                ]
            };

            // Propiedad 40: Estrene casa en Villa Fontana en esquina
            const villafontanaenesquinaProperty = {
                address: "Villa Fontana, Culiacán, Sinaloa",
                priceShort: "$2.4M",
                priceFull: "$2,400,000",
                title: "Estrene casa en Villa Fontana en esquina",
                location: "Fraccionamiento Villa Fontana, Culiacán, Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/estrene-casa-en-villa-fontana-en-esquina/",
                photos: [
                    "estrene-casa-en-villa-fontana-en-esquina/images/foto-1.jpg","estrene-casa-en-villa-fontana-en-esquina/images/foto-2.jpg","estrene-casa-en-villa-fontana-en-esquina/images/foto-3.jpg","estrene-casa-en-villa-fontana-en-esquina/images/foto-4.jpg","estrene-casa-en-villa-fontana-en-esquina/images/foto-5.jpg","estrene-casa-en-villa-fontana-en-esquina/images/foto-6.jpg","estrene-casa-en-villa-fontana-en-esquina/images/foto-7.jpg"
                ]
            };




            
            // ===== LOTE 8: PROPIEDADES 36-40 =====

            // Propiedad 36: Casa en venta en Stanza Castilla Privada Avila
            const stanzacastillaprivadaavilaProperty = {
                address: "Stanza Castilla, Culiacán",
                priceShort: "$2.2M",
                priceFull: "$2,200,000",
                title: "Casa en venta en Stanza Castilla Privada Avila",
                location: "Stanza Castilla",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-stanza-castilla-privada-avila/",
                photos: [
                    "casa-en-venta-en-stanza-castilla-privada-avila/images/foto-1.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-2.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-3.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-4.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-5.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-6.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-7.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-8.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-9.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-10.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-11.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-12.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-13.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-14.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-15.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-16.jpg","casa-en-venta-en-stanza-castilla-privada-avila/images/foto-17.jpg"
                ]
            };

            // Propiedad 37: CASA EN VENTA TERRENO EXCEDENTE STANZA VALLE ALTO
            const terrenoexcedentestanzavallealtoProperty = {
                address: "Valle Alto, Culiacán",
                priceShort: "$2.5M",
                priceFull: "$2,490,000",
                title: "CASA EN VENTA TERRENO EXCEDENTE STANZA VALLE ALTO",
                location: "Valle Alto",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-terreno-excedente-stanza-valle-alto/",
                photos: [
                    "casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-1.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-2.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-3.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-4.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-5.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-6.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-7.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-8.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-9.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-10.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-11.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-12.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-13.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-14.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-15.jpg","casa-en-venta-terreno-excedente-stanza-valle-alto/images/foto-16.jpg"
                ]
            };

            // Propiedad 38: Casa en Portalegre Misión
            const portalegremisionProperty = {
                address: "Portalegre Misión, Culiacán",
                priceShort: "$2.0M",
                priceFull: "$2,000,000",
                title: "Casa en Portalegre Misión",
                location: "Portalegre Misión",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-portalegre-mision/",
                photos: [
                    "casa-en-portalegre-mision/images/foto-1.jpg","casa-en-portalegre-mision/images/foto-2.jpg","casa-en-portalegre-mision/images/foto-3.jpg","casa-en-portalegre-mision/images/foto-4.jpg","casa-en-portalegre-mision/images/foto-5.jpg","casa-en-portalegre-mision/images/foto-6.jpg","casa-en-portalegre-mision/images/foto-7.jpg","casa-en-portalegre-mision/images/foto-8.jpg","casa-en-portalegre-mision/images/foto-9.jpg","casa-en-portalegre-mision/images/foto-10.jpg","casa-en-portalegre-mision/images/foto-11.jpg","casa-en-portalegre-mision/images/foto-12.jpg","casa-en-portalegre-mision/images/foto-13.jpg","casa-en-portalegre-mision/images/foto-14.jpg","casa-en-portalegre-mision/images/foto-15.jpg","casa-en-portalegre-mision/images/foto-16.jpg"
                ]
            };

            // Propiedad 39: CASA EN VENTA Y RENTA EN CARPATOS EN VALLE ALTO EN CULIACAN SINALOA
            const carpatosvallealtoCuliacanProperty = {
                address: "Carpatos, Valle Alto, Culiacán",
                priceShort: "$2.8M",
                priceFull: "$2,800,000",
                title: "CASA EN VENTA Y RENTA EN CARPATOS EN VALLE ALTO EN CULIACAN SINALOA",
                location: "Carpatos",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/",
                photos: [
                    "casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-1.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-2.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-3.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-4.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-5.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-6.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-7.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-8.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-9.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-10.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-11.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-12.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-13.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-14.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-15.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-16.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-17.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-18.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-19.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-20.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-21.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-22.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-23.jpg","casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa/images/foto-24.jpg"
                ]
            };

            // Propiedad 40: CASA EN VENTA LA RIOJA MODELO ESTRELLA
            const lariojamodeloestrellaProperty = {
                address: "La Rioja, Culiacán",
                priceShort: "$2.7M",
                priceFull: "$2,739,000",
                title: "CASA EN VENTA LA RIOJA MODELO ESTRELLA",
                location: "La Rioja",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-la-rioja-modelo-estrella/",
                photos: [
                    "casa-en-venta-la-rioja-modelo-estrella/images/foto-1.jpg","casa-en-venta-la-rioja-modelo-estrella/images/foto-2.jpg","casa-en-venta-la-rioja-modelo-estrella/images/foto-3.jpg","casa-en-venta-la-rioja-modelo-estrella/images/foto-4.jpg","casa-en-venta-la-rioja-modelo-estrella/images/foto-5.jpg","casa-en-venta-la-rioja-modelo-estrella/images/foto-6.jpg","casa-en-venta-la-rioja-modelo-estrella/images/foto-7.jpg","casa-en-venta-la-rioja-modelo-estrella/images/foto-8.jpg","casa-en-venta-la-rioja-modelo-estrella/images/foto-9.jpg","casa-en-venta-la-rioja-modelo-estrella/images/foto-10.jpg","casa-en-venta-la-rioja-modelo-estrella/images/foto-11.jpg","casa-en-venta-la-rioja-modelo-estrella/images/foto-12.jpg"
                ]
            };



            // ===== LOTE 9: PROPIEDADES 41-45 =====

            // Propiedad 41: CASA EN VENTA EN BARCELONA SELECT
            const barcelonaselectProperty = {
                address: "Villa Barcelona Select, Culiacán",
                priceShort: "$2.5M",
                priceFull: "$2,450,000",
                title: "CASA EN VENTA EN BARCELONA SELECT",
                location: "Villa Barcelona Select",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-barcelona-select/",
                photos: [
                    "casa-en-venta-en-barcelona-select/images/foto-1.jpg","casa-en-venta-en-barcelona-select/images/foto-2.jpg","casa-en-venta-en-barcelona-select/images/foto-3.jpg","casa-en-venta-en-barcelona-select/images/foto-4.jpg","casa-en-venta-en-barcelona-select/images/foto-5.jpg","casa-en-venta-en-barcelona-select/images/foto-6.jpg","casa-en-venta-en-barcelona-select/images/foto-7.jpg","casa-en-venta-en-barcelona-select/images/foto-8.jpg","casa-en-venta-en-barcelona-select/images/foto-9.jpg","casa-en-venta-en-barcelona-select/images/foto-10.jpg","casa-en-venta-en-barcelona-select/images/foto-11.jpg","casa-en-venta-en-barcelona-select/images/foto-12.jpg","casa-en-venta-en-barcelona-select/images/foto-13.jpg"
                ]
            };

            // Propiedad 42: Casa en Venta La Rioja
            const larioja477140Property = {
                address: "La Rioja, Culiacán",
                priceShort: "$1.8M",
                priceFull: "$1,800,000",
                title: "Casa en Venta La Rioja",
                location: "La Rioja",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-venta-la-rioja-477140/",
                photos: [
                    "casa-venta-la-rioja-477140/images/foto-1.jpg","casa-venta-la-rioja-477140/images/foto-2.jpg","casa-venta-la-rioja-477140/images/foto-3.jpg","casa-venta-la-rioja-477140/images/foto-4.jpg","casa-venta-la-rioja-477140/images/foto-5.jpg"
                ]
            };

            // Propiedad 43: Casa en Venta Las Moras
            const lasmoras421156Property = {
                address: "Fraccionamiento Las Moras, Culiacán, Sinaloa",
                priceShort: "$1.9M",
                priceFull: "$1,900,000",
                title: "Casa en Venta Las Moras",
                location: "Fraccionamiento Las Moras, Culiacán, Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-venta-las-moras-421156/",
                photos: [
                    "casa-venta-las-moras-421156/images/foto-1.jpg","casa-venta-las-moras-421156/images/foto-2.jpg","casa-venta-las-moras-421156/images/foto-3.jpg","casa-venta-las-moras-421156/images/foto-4.jpg","casa-venta-las-moras-421156/images/foto-5.jpg"
                ]
            };

            // Propiedad 44: Casa en Venta San Agustin
            const sanagustin349077Property = {
                address: "Fraccionamiento San Agustín, Culiacán, Sinaloa",
                priceShort: "$1.7M",
                priceFull: "$1,690,000",
                title: "Casa en Venta San Agustin",
                location: "Fraccionamiento San Agustín, Culiacán, Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-venta-san-agustin-349077/",
                photos: [
                    "casa-venta-san-agustin-349077/images/foto-1.jpg","casa-venta-san-agustin-349077/images/foto-2.jpg","casa-venta-san-agustin-349077/images/foto-3.jpg","casa-venta-san-agustin-349077/images/foto-4.jpg","casa-venta-san-agustin-349077/images/foto-5.jpg","casa-venta-san-agustin-349077/images/foto-6.jpg","casa-venta-san-agustin-349077/images/foto-7.jpg","casa-venta-san-agustin-349077/images/foto-8.jpg","casa-venta-san-agustin-349077/images/foto-9.jpg","casa-venta-san-agustin-349077/images/foto-10.jpg","casa-venta-san-agustin-349077/images/foto-11.jpg","casa-venta-san-agustin-349077/images/foto-12.jpg","casa-venta-san-agustin-349077/images/foto-13.jpg","casa-venta-san-agustin-349077/images/foto-14.jpg","casa-venta-san-agustin-349077/images/foto-15.jpg"
                ]
            };

            // Propiedad 45: Casa en Venta Centro
            const centro277608Property = {
                address: "Colonia Centro, Culiacán, Sinaloa",
                priceShort: "$1.5M",
                priceFull: "$1,485,000",
                title: "Casa en Venta Centro",
                location: "Colonia Centro, Culiacán, Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-venta-centro-277608/",
                photos: [
                    "casa-venta-centro-277608/images/foto-1.jpg","casa-venta-centro-277608/images/foto-2.jpg","casa-venta-centro-277608/images/foto-3.jpg","casa-venta-centro-277608/images/foto-4.jpg","casa-venta-centro-277608/images/foto-5.jpg","casa-venta-centro-277608/images/foto-6.jpg","casa-venta-centro-277608/images/foto-7.jpg","casa-venta-centro-277608/images/foto-8.jpg","casa-venta-centro-277608/images/foto-9.jpg","casa-venta-centro-277608/images/foto-10.jpg","casa-venta-centro-277608/images/foto-11.jpg","casa-venta-centro-277608/images/foto-12.jpg"
                ]
            };

            // ========== LOTE 10: Propiedades 46-50 ==========

            // Propiedad 46: Casa Lomas Del Sol
            const lomasdelsol1Property = {
                address: "Lomas Del Sol, Culiacán",
                priceShort: "$1.55M",
                priceFull: "$1,550,000",
                title: "Casa Lomas Del Sol",
                location: "Lomas Del Sol",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/",
                photos: [
                    "casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-1.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-2.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-3.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-4.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-5.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-6.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-7.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-8.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-9.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-10.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-11.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-12.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-13.jpg","casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR/images/foto-14.jpg"
                ]
            };

            // Propiedad 47: Casa Lomas Del Sol Esquina
            const lomasdelsol2Property = {
                address: "Lomas Del Sol, Culiacán",
                priceShort: "$1.3M",
                priceFull: "$1,300,000",
                title: "Casa Lomas Del Sol Esquina",
                location: "Lomas Del Sol",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/",
                photos: [
                    "casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-1.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-2.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-3.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-4.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-5.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-6.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-7.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-8.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-9.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-10.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-11.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-12.jpg","casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE/images/foto-13.jpg"
                ]
            };

            // Propiedad 48: Casa Nuevo Culiacán
            const nuevoculiacanProperty = {
                address: "Fraccionamiento Nuevo Culiacán, Culiacán, Sinaloa",
                priceShort: "$1.87M",
                priceFull: "$1,875,000",
                title: "Casa Nuevo Culiacán",
                location: "Fraccionamiento Nuevo Culiacán, Culiacán, Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/",
                photos: [
                    "casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-1.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-2.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-3.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-4.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-5.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-6.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-7.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-8.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-9.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-10.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-11.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-12.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-13.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-14.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-15.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-16.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-17.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-18.jpg","casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR/images/foto-19.jpg"
                ]
            };

            // Propiedad 49: Casa Prados del Sur
            const pradosdelsurProperty = {
                address: "Calle Prados del Sur 2609, Culiacán, Sinaloa",
                priceShort: "$1.55M",
                priceFull: "$1,555,000",
                title: "Casa Prados del Sur",
                location: "Calle Prados del Sur 2609, Culiacán, Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/",
                photos: [
                    "casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-1.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-2.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-3.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-4.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-5.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-6.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-7.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-8.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-9.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-10.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-11.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-12.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-13.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-14.jpg","casa-venta-casa-en-venta-prados-del-sur-pgXLMhK/images/foto-15.jpg"
                ]
            };

            // Propiedad 50: Casa Privada Punta Azul
            const privadapuntaazulProperty = {
                address: "Privada Punta Azul, Culiacán, Sinaloa",
                priceShort: "$1.98M",
                priceFull: "$1,980,000",
                title: "Casa Privada Punta Azul",
                location: "Privada Punta Azul, Culiacán, Sinaloa",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/",
                photos: [
                    "casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-1.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-2.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-3.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-4.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-5.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-6.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-7.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-8.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-9.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-10.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-11.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-12.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-13.jpg","casa-venta-casa-en-venta-privada-punta-azul-pBcIydL/images/foto-14.jpg"
                ]
            };
            // VENTA: Casa en Venta Privada Valles Españoles
            const casa_en_venta_privada_valles_espanolesProperty = {
                address: "Sector Bugambilias, Culiacán, Sinaloa",
                priceShort: "$4.40M",
                priceFull: "$4,400,000",
                title: "Casa en Venta Privada Valles Españoles",
                location: "Sector Bugambilias, Culiacán, Sinaloa, Mexico, Fraccionamiento Valles Españoles",
                bedrooms: 3,
                bathrooms: 3,
                area: "230m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-privada-valles-espanoles/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-privada-valles-espanoles/images/foto-1.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-2.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-3.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-4.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-5.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-6.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-7.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-8.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-9.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-10.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-11.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-12.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-13.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-14.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-15.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-16.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-17.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-18.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-19.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-20.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-21.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-22.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-23.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-24.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-25.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-26.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-27.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-28.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-29.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-30.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-31.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-32.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-33.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-34.jpg",
                    "casa-en-venta-privada-valles-espanoles/images/foto-35.jpg"
                ]
            };

            // VENTA: Casa en Venta Residencial Amorada
            const casa_en_venta_residencial_amoradaProperty = {
                address: "2599 Laurentina, Culiacán, Sinaloa",
                priceShort: "$4.35M",
                priceFull: "$4,350,000",
                title: "Casa en Venta Residencial Amorada",
                location: "2599 Laurentina, Culiacán, Sinaloa, Mexico, Buenavista",
                bedrooms: 3,
                bathrooms: 1,
                area: "180m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-residencial-amorada/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-residencial-amorada/images/foto-1.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-2.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-3.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-4.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-5.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-6.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-7.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-8.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-9.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-10.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-11.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-12.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-13.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-14.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-15.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-16.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-17.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-18.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-19.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-20.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-21.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-22.jpg",
                    "casa-en-venta-residencial-amorada/images/foto-23.jpg"
                ]
            };

            // RENTA: Se Vende o Se Renta Casa en Fraccionamiento Guadalupe Victoria
            const se_vende_o_se_renta_casa_en_fraccionamiento_guadalupe_victorProperty = {
                address: "Juan de Dios Batiz, Culiacán, Sinaloa",
                priceShort: "$4.30M",
                priceFull: "$4,300,000",
                title: "Se Vende o Se Renta Casa en Fraccionamiento Guadalupe Victoria",
                location: "Juan de Dios Batiz, Sinaloa, Mexico, Culiacán",
                bedrooms: 4,
                bathrooms: 2,
                area: "1m²",
                type: "renta",
                url: "https://casasenventa.info/culiacan/se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/",
                whatsapp: "526672317963",
                photos: [
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-1.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-2.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-3.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-4.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-5.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-6.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-7.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-8.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-9.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-10.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-11.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-12.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-13.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-14.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-15.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-16.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-17.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-18.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-19.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-20.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-21.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-22.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-23.jpg",
                    "se-vende-o-se-renta-casa-en-fraccionamiento-guadalupe-victor/images/foto-24.jpg"
                ]
            };

            // VENTA: Casa - Fraccionamiento Espacios Barcelona
            const casa_fraccionamiento_espacios_barcelonaProperty = {
                address: "Privada Vitalia Fraccionamiento Barcelona al 80000, Culiacán, Sinaloa",
                priceShort: "$4.30M",
                priceFull: "$4,300,000",
                title: "Casa - Fraccionamiento Espacios Barcelona",
                location: "Privada Vitalia Fraccionamiento Barcelona al 80000, Culiacán, Sinaloa, Mexico, Fraccionamiento Espacios Barcelona",
                bedrooms: 3,
                bathrooms: 3,
                area: "229m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-fraccionamiento-espacios-barcelona/",
                whatsapp: "526672317963",
                photos: [
                    "casa-fraccionamiento-espacios-barcelona/images/foto-1.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-2.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-3.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-4.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-5.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-6.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-7.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-8.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-9.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-10.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-11.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-12.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-13.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-14.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-15.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-16.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-17.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-18.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-19.jpg",
                    "casa-fraccionamiento-espacios-barcelona/images/foto-20.jpg"
                ]
            };

            // VENTA: Casa en Venta en Colonia Chapultepec Culiacán
            const casa_en_venta_en_colonia_chapultepec_culiacanProperty = {
                address: "Colonia Chapultepec, Culiacán, Sinaloa",
                priceShort: "$6.50M",
                priceFull: "$6,500,000",
                title: "Casa en Venta en Colonia Chapultepec Culiacán",
                location: "Colonia Chapultepec, Culiacán, Sinaloa, Mexico, Chapultepec",
                bedrooms: 3,
                bathrooms: 3,
                area: "250m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-colonia-chapultepec-culiacan/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-1.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-2.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-3.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-4.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-5.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-6.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-7.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-8.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-9.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-10.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-11.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-12.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-13.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-14.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-15.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-16.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-17.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-18.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-19.jpg",
                    "casa-en-venta-en-colonia-chapultepec-culiacan/images/foto-20.jpg"
                ]
            };

            // VENTA: Casa en Venta en La Primavera San Juan
            const casa_en_venta_en_la_primavera_san_juanProperty = {
                address: "La Primavera San Juan, Culiacán, Sinaloa",
                priceShort: "$13.30M",
                priceFull: "$13,300,000",
                title: "Casa en Venta en La Primavera San Juan",
                location: "La Primavera San Juan, Culiacán, Sinaloa, Mexico, La Primavera",
                bedrooms: 3,
                bathrooms: 4,
                area: "398m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-la-primavera-san-juan/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-1.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-2.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-3.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-4.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-5.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-6.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-7.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-8.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-9.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-10.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-11.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-12.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-13.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-14.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-15.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-16.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-17.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-18.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-19.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-20.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-21.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-22.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-23.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-24.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-25.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-26.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-27.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-28.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-29.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-30.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-31.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-32.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-33.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-34.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-35.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-36.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-37.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-38.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-39.jpg",
                    "casa-en-venta-en-la-primavera-san-juan/images/foto-40.jpg"
                ]
            };

            // VENTA: Casa en Venta, La Cantera, Culiacan
            const casa_en_venta_la_cantera_culiacanProperty = {
                address: "Culiacán, Sinaloa",
                priceShort: "$7.95M",
                priceFull: "$7,950,000",
                title: "Casa en Venta, La Cantera, Culiacan",
                location: "Casa en La Cantera, Culiacan. (001 Gris), Culiacán, Sinaloa, Mexico, Fraccionamiento La Cantera",
                bedrooms: 3,
                bathrooms: 3,
                area: "218m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-la-cantera-culiacan/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-la-cantera-culiacan/images/foto-1.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-2.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-3.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-4.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-5.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-6.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-7.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-8.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-9.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-10.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-11.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-12.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-13.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-14.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-15.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-16.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-17.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-18.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-19.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-20.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-21.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-22.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-23.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-24.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-25.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-26.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-27.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-28.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-29.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-30.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-31.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-32.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-33.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-34.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-35.jpg",
                    "casa-en-venta-la-cantera-culiacan/images/foto-36.jpg"
                ]
            };

            // VENTA: Casa en Venta Culiacancito Culiacan Sinaloa
            const casa_en_venta_culiacancito_culiacan_sinaloaProperty = {
                address: "Granados 13, Culiacán, Sinaloa",
                priceShort: "$2.10M",
                priceFull: "$2,100,000",
                title: "Casa en Venta Culiacancito Culiacan Sinaloa",
                location: "Granados 13, Culiacán, Sinaloa, Mexico, Fraccionamiento Valle Alto",
                bedrooms: 4,
                bathrooms: 3,
                area: "231m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-culiacancito-culiacan-sinaloa/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-1.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-2.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-3.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-4.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-5.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-6.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-7.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-8.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-9.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-10.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-11.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-12.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-13.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-14.jpg",
                    "casa-en-venta-culiacancito-culiacan-sinaloa/images/foto-15.jpg"
                ]
            };

            // VENTA: Venta de Casa por Calle Mariano Escobedo Centro de La Ciudad
            const venta_de_casa_por_calle_mariano_escobedo_centro_de_la_ciudadProperty = {
                address: "Mariano escobedo, Culiacán, Sinaloa",
                priceShort: "$4M",
                priceFull: "$4,000,000",
                title: "Venta de Casa por Calle Mariano Escobedo Centro de La Ciudad",
                location: "Mariano escobedo, Culiacán, Sinaloa, Mexico, Centro",
                bedrooms: 5,
                bathrooms: 2,
                area: "252m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/",
                whatsapp: "526672317963",
                photos: [
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-1.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-2.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-3.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-4.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-5.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-6.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-7.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-8.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-9.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-10.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-11.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-12.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-13.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-14.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-15.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-16.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-17.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-18.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-19.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-20.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-21.jpg",
                    "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-22.jpg"
                ]
            };

            // VENTA: Casa en Venta Colonia Morelos Culiacan Sinaloa
            const casa_en_venta_colonia_morelos_culiacan_sinaloaProperty = {
                address: "Río Tehuantepec 1522, Culiacán, Sinaloa",
                priceShort: "$4M",
                priceFull: "$4,000,000",
                title: "Casa en Venta Colonia Morelos Culiacan Sinaloa",
                location: "Río Tehuantepec 1522, Culiacán, Sinaloa, Mexico, Morelos",
                bedrooms: 4,
                bathrooms: 2,
                area: "389m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-colonia-morelos-culiacan-sinaloa/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-1.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-2.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-3.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-4.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-5.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-6.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-7.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-8.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-9.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-10.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-11.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-12.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-13.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-14.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-15.jpg",
                    "casa-en-venta-colonia-morelos-culiacan-sinaloa/images/foto-16.jpg"
                ]
            };

            // VENTA: Casa en Venta Culiacan, Nueva Tres Rios 4 Recamaras
            const casa_en_venta_culiacan_nueva_tres_rios_4_recamarasProperty = {
                address: "Frida Khalo 2440, Culiacán, Sinaloa",
                priceShort: "$12.70M",
                priceFull: "$12,700,000",
                title: "Casa en Venta Culiacan, Nueva Tres Rios 4 Recamaras",
                location: "Frida Khalo 2440, Culiacán, Sinaloa, Mexico, Zona comercial Desarrollo Urbano 3 Ríos",
                bedrooms: 4,
                bathrooms: 4,
                area: "380m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-1.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-2.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-3.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-4.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-5.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-6.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-7.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-8.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-9.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-10.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-11.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-12.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-13.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-14.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-15.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-16.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-17.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-18.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-19.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-20.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-21.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-22.jpg",
                    "casa-en-venta-culiacan-nueva-tres-rios-4-recamaras/images/foto-23.jpg"
                ]
            };

            // VENTA: Casa en Fraccionamiento Villa Universidad
            const casa_en_fraccionamiento_villa_universidadProperty = {
                address: "Villa Universidad Calle Platón al 700, Culiacán, Sinaloa",
                priceShort: "$3.60M",
                priceFull: "$3,600,000",
                title: "Casa en Fraccionamiento Villa Universidad",
                location: "Villa Universidad Calle Platón al 700, Culiacán, Sinaloa, Mexico, Fraccionamiento Villa Universidad",
                bedrooms: 4,
                bathrooms: 3,
                area: "242m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-fraccionamiento-villa-universidad/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-fraccionamiento-villa-universidad/images/foto-1.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-2.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-3.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-4.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-5.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-6.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-7.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-8.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-9.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-10.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-11.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-12.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-13.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-14.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-15.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-16.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-17.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-18.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-19.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-20.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-21.jpg",
                    "casa-en-fraccionamiento-villa-universidad/images/foto-22.jpg"
                ]
            };

            // VENTA: Casa en Venta en El Fracc, Los Almendros, Culiacán, Sinaloa
            const casa_en_venta_en_el_fracc_los_almendros_culiacan_sinaloaProperty = {
                address: "Fracc, Culiacán, Sinaloa",
                priceShort: "$3.59M",
                priceFull: "$3,590,000",
                title: "Casa en Venta en El Fracc, Los Almendros, Culiacán, Sinaloa",
                location: "Fracc, Culiacán",
                bedrooms: 4,
                bathrooms: 4,
                area: "240m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-1.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-2.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-3.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-4.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-5.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-6.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-7.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-8.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-9.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-10.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-11.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-12.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-13.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-14.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-15.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-16.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-17.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-18.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-19.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-20.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-21.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-22.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-23.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-24.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-25.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-26.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-27.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-28.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-29.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-30.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-31.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-32.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-33.jpg",
                    "casa-en-venta-en-el-fracc-los-almendros-culiacan-sinaloa/images/foto-34.jpg"
                ]
            };

            // VENTA: Casa en Venta Colonia Tierra Blanca Culiacán
            const casa_en_venta_colonia_tierra_blanca_culiacanProperty = {
                address: "Calle Sociologos y Matías Lazcano, Culiacán, Sinaloa",
                priceShort: "$3.70M",
                priceFull: "$3,700,000",
                title: "Casa en Venta Colonia Tierra Blanca Culiacán",
                location: "Calle Sociologos y Matías Lazcano, Culiacán",
                bedrooms: 4,
                bathrooms: 2,
                area: "150m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-colonia-tierra-blanca-culiacan/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-colonia-tierra-blanca-culiacan/images/foto-1.jpg",
                    "casa-en-venta-colonia-tierra-blanca-culiacan/images/foto-2.jpg",
                    "casa-en-venta-colonia-tierra-blanca-culiacan/images/foto-3.jpg",
                    "casa-en-venta-colonia-tierra-blanca-culiacan/images/foto-4.jpg",
                    "casa-en-venta-colonia-tierra-blanca-culiacan/images/foto-5.jpg",
                    "casa-en-venta-colonia-tierra-blanca-culiacan/images/foto-6.jpg",
                    "casa-en-venta-colonia-tierra-blanca-culiacan/images/foto-7.jpg",
                    "casa-en-venta-colonia-tierra-blanca-culiacan/images/foto-8.jpg",
                    "casa-en-venta-colonia-tierra-blanca-culiacan/images/foto-9.jpg",
                    "casa-en-venta-colonia-tierra-blanca-culiacan/images/foto-10.jpg",
                    "casa-en-venta-colonia-tierra-blanca-culiacan/images/foto-11.jpg"
                ]
            };

            // VENTA: Casa - Fraccionamiento Infonavit Barrancos
            const casa_fraccionamiento_infonavit_barrancosProperty = {
                address: "Culiacán, Sinaloa",
                priceShort: "$3.70M",
                priceFull: "$3,700,000",
                title: "Casa - Fraccionamiento Infonavit Barrancos",
                location: "Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "182m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-fraccionamiento-infonavit-barrancos/",
                whatsapp: "526672317963",
                photos: [
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-1.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-2.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-3.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-4.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-5.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-6.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-7.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-8.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-9.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-10.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-11.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-12.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-13.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-14.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-15.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-16.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-17.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-18.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-19.jpg",
                    "casa-fraccionamiento-infonavit-barrancos/images/foto-20.jpg"
                ]
            };

            // VENTA: Casa en Venta en Villa Universidad, Culiacán
            const casa_en_venta_en_villa_universidad_culiacanProperty = {
                address: "708 Platon, Culiacán, Sinaloa",
                priceShort: "$3.60M",
                priceFull: "$3,600,000",
                title: "Casa en Venta en Villa Universidad, Culiacán",
                location: "708 Platon, Culiacán",
                bedrooms: 4,
                bathrooms: 3,
                area: "242m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-villa-universidad-culiacan/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-1.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-2.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-3.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-4.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-5.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-6.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-7.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-8.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-9.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-10.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-11.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-12.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-13.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-14.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-15.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-16.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-17.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-18.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-19.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-20.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-21.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-22.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-23.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-24.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-25.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-26.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-27.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-28.jpg",
                    "casa-en-venta-en-villa-universidad-culiacan/images/foto-29.jpg"
                ]
            };

            // VENTA: Casa en Fraccionamiento Perisur
            const casa_en_fraccionamiento_perisurProperty = {
                address: "Prol. Álvaro Obregón 768, Culiacán, Sinaloa",
                priceShort: "$3.76M",
                priceFull: "$3,761,000",
                title: "Casa en Fraccionamiento Perisur",
                location: "Prol. Álvaro Obregón 768, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "145m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-fraccionamiento-perisur/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-fraccionamiento-perisur/images/foto-1.jpg",
                    "casa-en-fraccionamiento-perisur/images/foto-2.jpg",
                    "casa-en-fraccionamiento-perisur/images/foto-3.jpg",
                    "casa-en-fraccionamiento-perisur/images/foto-4.jpg",
                    "casa-en-fraccionamiento-perisur/images/foto-5.jpg",
                    "casa-en-fraccionamiento-perisur/images/foto-6.jpg",
                    "casa-en-fraccionamiento-perisur/images/foto-7.jpg",
                    "casa-en-fraccionamiento-perisur/images/foto-8.jpg",
                    "casa-en-fraccionamiento-perisur/images/foto-9.jpg",
                    "casa-en-fraccionamiento-perisur/images/foto-10.jpg"
                ]
            };

            // VENTA: Casa en Venta en Colonia Las Quintas
            const casa_en_venta_en_colonia_las_quintasProperty = {
                address: "Estado de Yucatán, Culiacán, Sinaloa",
                priceShort: "$3.80M",
                priceFull: "$3,800,000",
                title: "Casa en Venta en Colonia Las Quintas",
                location: "Estado de Yucatán, Culiacán",
                bedrooms: 4,
                bathrooms: 2,
                area: "243m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-colonia-las-quintas/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-colonia-las-quintas/images/foto-1.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-2.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-3.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-4.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-5.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-6.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-7.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-8.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-9.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-10.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-11.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-12.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-13.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-14.jpg",
                    "casa-en-venta-en-colonia-las-quintas/images/foto-15.jpg"
                ]
            };

            // VENTA: Casa en Fraccionamiento La Conquista
            const casa_en_fraccionamiento_la_conquistaProperty = {
                address: "Carretera Culiacancito al 3900, Culiacán, Sinaloa",
                priceShort: "$3.70M",
                priceFull: "$3,700,000",
                title: "Casa en Fraccionamiento La Conquista",
                location: "Carretera Culiacancito al 3900, Culiacán",
                bedrooms: 3,
                bathrooms: 1,
                area: "300m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-fraccionamiento-la-conquista/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-fraccionamiento-la-conquista/images/foto-1.jpg",
                    "casa-en-fraccionamiento-la-conquista/images/foto-2.jpg",
                    "casa-en-fraccionamiento-la-conquista/images/foto-3.jpg",
                    "casa-en-fraccionamiento-la-conquista/images/foto-4.jpg",
                    "casa-en-fraccionamiento-la-conquista/images/foto-5.jpg",
                    "casa-en-fraccionamiento-la-conquista/images/foto-6.jpg",
                    "casa-en-fraccionamiento-la-conquista/images/foto-7.jpg",
                    "casa-en-fraccionamiento-la-conquista/images/foto-8.jpg",
                    "casa-en-fraccionamiento-la-conquista/images/foto-9.jpg",
                    "casa-en-fraccionamiento-la-conquista/images/foto-10.jpg"
                ]
            };

            // VENTA: Casa en Bosques del Rey Br56
            const casa_en_bosques_del_rey_br56Property = {
                address: "Culiacán, Sinaloa",
                priceShort: "$3.60M",
                priceFull: "$3,600,000",
                title: "Casa en Bosques del Rey Br56",
                location: "Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "170m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-bosques-del-rey-br56/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-bosques-del-rey-br56/images/foto-1.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-2.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-3.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-4.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-5.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-6.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-7.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-8.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-9.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-10.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-11.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-12.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-13.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-14.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-15.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-16.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-17.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-18.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-19.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-20.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-21.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-22.jpg",
                    "casa-en-bosques-del-rey-br56/images/foto-23.jpg"
                ]
            };

            // VENTA: Casa en Venta en Interlomas Culiacán
            const casa_en_venta_en_interlomas_culiacanProperty = {
                address: "Cto de los Flamingos 3694, Culiacán, Sinaloa",
                priceShort: "$3.60M",
                priceFull: "$3,600,000",
                title: "Casa en Venta en Interlomas Culiacán",
                location: "Cto de los Flamingos 3694, Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "165m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-interlomas-culiacan/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-interlomas-culiacan/images/foto-1.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-2.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-3.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-4.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-5.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-6.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-7.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-8.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-9.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-10.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-11.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-12.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-13.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-14.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-15.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-16.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-17.jpg",
                    "casa-en-venta-en-interlomas-culiacan/images/foto-18.jpg"
                ]
            };

            // VENTA: Casa en La Costera
            const casa_en_la_costeraProperty = {
                address: "Prol. Álvaro Obregón 768, Culiacán, Sinaloa",
                priceShort: "$3.69M",
                priceFull: "$3,692,000",
                title: "Casa en La Costera",
                location: "Prol. Álvaro Obregón 768, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "187m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-la-costera/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-la-costera/images/foto-1.jpg",
                    "casa-en-la-costera/images/foto-2.jpg",
                    "casa-en-la-costera/images/foto-3.jpg",
                    "casa-en-la-costera/images/foto-4.jpg",
                    "casa-en-la-costera/images/foto-5.jpg",
                    "casa-en-la-costera/images/foto-6.jpg",
                    "casa-en-la-costera/images/foto-7.jpg",
                    "casa-en-la-costera/images/foto-8.jpg",
                    "casa-en-la-costera/images/foto-9.jpg",
                    "casa-en-la-costera/images/foto-10.jpg",
                    "casa-en-la-costera/images/foto-11.jpg",
                    "casa-en-la-costera/images/foto-12.jpg",
                    "casa-en-la-costera/images/foto-13.jpg",
                    "casa-en-la-costera/images/foto-14.jpg",
                    "casa-en-la-costera/images/foto-15.jpg",
                    "casa-en-la-costera/images/foto-16.jpg",
                    "casa-en-la-costera/images/foto-17.jpg",
                    "casa-en-la-costera/images/foto-18.jpg",
                    "casa-en-la-costera/images/foto-19.jpg",
                    "casa-en-la-costera/images/foto-20.jpg",
                    "casa-en-la-costera/images/foto-21.jpg",
                    "casa-en-la-costera/images/foto-22.jpg",
                    "casa-en-la-costera/images/foto-23.jpg",
                    "casa-en-la-costera/images/foto-24.jpg",
                    "casa-en-la-costera/images/foto-25.jpg",
                    "casa-en-la-costera/images/foto-26.jpg",
                    "casa-en-la-costera/images/foto-27.jpg",
                    "casa-en-la-costera/images/foto-28.jpg",
                    "casa-en-la-costera/images/foto-29.jpg",
                    "casa-en-la-costera/images/foto-30.jpg",
                    "casa-en-la-costera/images/foto-31.jpg",
                    "casa-en-la-costera/images/foto-32.jpg"
                ]
            };

            // VENTA: Se Vende Casa en Boulevard Doctor Mora en Las Quintas
            const se_vende_casa_en_boulevard_doctor_mora_en_las_quintasProperty = {
                address: "BLVD DR MORA, Culiacán, Sinaloa",
                priceShort: "$3.80M",
                priceFull: "$3,800,000",
                title: "Se Vende Casa en Boulevard Doctor Mora en Las Quintas",
                location: "BLVD DR MORA, Culiacán",
                bedrooms: 4,
                bathrooms: 2,
                area: "241m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/",
                whatsapp: "526672317963",
                photos: [
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-1.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-2.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-3.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-4.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-5.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-6.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-7.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-8.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-9.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-10.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-11.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-12.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-13.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-14.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-15.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-16.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-17.jpg",
                    "se-vende-casa-en-boulevard-doctor-mora-en-las-quintas/images/foto-18.jpg"
                ]
            };

            // VENTA: Casa en Popular
            const casa_en_popularProperty = {
                address: "Prol. Álvaro Obregón 768, Culiacán, Sinaloa",
                priceShort: "$3.50M",
                priceFull: "$3,500,000",
                title: "Casa en Popular",
                location: "Prol. Álvaro Obregón 768, Culiacán",
                bedrooms: 4,
                bathrooms: 2,
                area: "432m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-popular/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-popular/images/foto-1.jpg",
                    "casa-en-popular/images/foto-2.jpg",
                    "casa-en-popular/images/foto-3.jpg",
                    "casa-en-popular/images/foto-4.jpg",
                    "casa-en-popular/images/foto-5.jpg",
                    "casa-en-popular/images/foto-6.jpg",
                    "casa-en-popular/images/foto-7.jpg",
                    "casa-en-popular/images/foto-8.jpg",
                    "casa-en-popular/images/foto-9.jpg",
                    "casa-en-popular/images/foto-10.jpg",
                    "casa-en-popular/images/foto-11.jpg",
                    "casa-en-popular/images/foto-12.jpg",
                    "casa-en-popular/images/foto-13.jpg",
                    "casa-en-popular/images/foto-14.jpg",
                    "casa-en-popular/images/foto-15.jpg",
                    "casa-en-popular/images/foto-16.jpg",
                    "casa-en-popular/images/foto-17.jpg",
                    "casa-en-popular/images/foto-18.jpg",
                    "casa-en-popular/images/foto-19.jpg"
                ]
            };

            // VENTA: Casa en Fraccionamiento Prados de La Conquista
            const casa_en_fraccionamiento_prados_de_la_conquistaProperty = {
                address: "Privada Bosque Roble (bosques del Rey), Culiacán, Sinaloa",
                priceShort: "$3.50M",
                priceFull: "$3,500,000",
                title: "Casa en Fraccionamiento Prados de La Conquista",
                location: "Privada Bosque Roble (bosques del Rey), Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "150m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-fraccionamiento-prados-de-la-conquista/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-1.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-2.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-3.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-4.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-5.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-6.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-7.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-8.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-9.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-10.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-11.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-12.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-13.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-14.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-15.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-16.jpg",
                    "casa-en-fraccionamiento-prados-de-la-conquista/images/foto-17.jpg"
                ]
            };

            // VENTA: Casa en Residencial Los Olivos
            const casa_en_residencial_los_olivosProperty = {
                address: "Prol. Álvaro Obregón 768, Culiacán, Sinaloa",
                priceShort: "$3.50M",
                priceFull: "$3,500,000",
                title: "Casa en Residencial Los Olivos",
                location: "Prol. Álvaro Obregón 768, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "600m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-residencial-los-olivos/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-residencial-los-olivos/images/foto-1.jpg",
                    "casa-en-residencial-los-olivos/images/foto-2.jpg",
                    "casa-en-residencial-los-olivos/images/foto-3.jpg",
                    "casa-en-residencial-los-olivos/images/foto-4.jpg",
                    "casa-en-residencial-los-olivos/images/foto-5.jpg",
                    "casa-en-residencial-los-olivos/images/foto-6.jpg",
                    "casa-en-residencial-los-olivos/images/foto-7.jpg",
                    "casa-en-residencial-los-olivos/images/foto-8.jpg",
                    "casa-en-residencial-los-olivos/images/foto-9.jpg"
                ]
            };

            // VENTA: Propiedad Para Inversion con Vista Panoramica a La Ciudad
            const propiedad_para_inversion_con_vista_panoramica_a_la_ciudadProperty = {
                address: "1504 pte calle Bahia de Altamira, Culiacán, Sinaloa",
                priceShort: "$3.50M",
                priceFull: "$3,500,000",
                title: "Propiedad Para Inversion con Vista Panoramica a La Ciudad",
                location: "1504 pte calle Bahia de Altamira, Culiacán",
                bedrooms: 4,
                bathrooms: 4,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/",
                whatsapp: "526672317963",
                photos: [
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-1.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-2.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-3.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-4.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-5.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-6.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-7.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-8.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-9.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-10.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-11.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-12.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-13.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-14.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-15.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-16.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-17.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-18.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-19.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-20.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-21.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-22.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-23.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-24.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-25.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-26.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-27.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-28.jpg",
                    "propiedad-para-inversion-con-vista-panoramica-a-la-ciudad/images/foto-29.jpg"
                ]
            };

            // VENTA: Se Vende Casa en Privada Sector Stanza Toscana
            const se_vende_casa_en_privada_sector_stanza_toscanaProperty = {
                address: "Culiacán, Sinaloa",
                priceShort: "$3.55M",
                priceFull: "$3,550,000",
                title: "Se Vende Casa en Privada Sector Stanza Toscana",
                location: "Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "146m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/se-vende-casa-en-privada-sector-stanza-toscana/",
                whatsapp: "526672317963",
                photos: [
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-1.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-2.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-3.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-4.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-5.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-6.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-7.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-8.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-9.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-10.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-11.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-12.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-13.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-14.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-15.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-16.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-17.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-18.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-19.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-20.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-21.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-22.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-23.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-24.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-25.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-26.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-27.jpg",
                    "se-vende-casa-en-privada-sector-stanza-toscana/images/foto-28.jpg"
                ]
            };

            // VENTA: Casa en Venta en El Fracc. Villas del Río, Culiacán, Sinaloa.
            const casa_en_venta_en_el_fracc_villas_del_rio_culiacan_sinaloaProperty = {
                address: "Villas del rio, Culiacán, Sinaloa",
                priceShort: "$3.50M",
                priceFull: "$3,500,000",
                title: "Casa en Venta en El Fracc. Villas del Río, Culiacán, Sinaloa.",
                location: "Villas del rio, Culiacán",
                bedrooms: 4,
                bathrooms: 3,
                area: "275m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-1.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-2.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-3.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-4.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-5.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-6.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-7.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-8.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-9.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-10.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-11.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-12.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-13.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-14.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-15.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-16.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-17.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-18.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-19.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-20.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-21.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-22.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-23.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-24.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-25.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-26.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-27.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-28.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-29.jpg",
                    "casa-en-venta-en-el-fracc-villas-del-rio-culiacan-sinaloa/images/foto-30.jpg"
                ]
            };

            // VENTA: Casa en Venta en Lomas de San Isidro
            const casa_en_venta_en_lomas_de_san_isidroProperty = {
                address: "Culiacán, Sinaloa",
                priceShort: "$1.35M",
                priceFull: "$1,350,000",
                title: "Casa en Venta en Lomas de San Isidro",
                location: "Culiacán",
                bedrooms: 4,
                bathrooms: 1,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-lomas-de-san-isidro/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-1.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-2.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-3.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-4.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-5.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-6.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-7.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-8.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-9.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-10.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-11.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-12.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-13.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-14.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-15.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-16.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-17.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro/images/foto-18.jpg"
                ]
            };

            // VENTA: Casa en Fraccionamiento Terranova
            const casa_en_fraccionamiento_terranovaProperty = {
                address: "Prol. Álvaro Obregón 768, Culiacán, Sinaloa",
                priceShort: "$1.35M",
                priceFull: "$1,350,000",
                title: "Casa en Fraccionamiento Terranova",
                location: "Prol. Álvaro Obregón 768, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "60m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-fraccionamiento-terranova/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-fraccionamiento-terranova/images/foto-1.jpg",
                    "casa-en-fraccionamiento-terranova/images/foto-2.jpg",
                    "casa-en-fraccionamiento-terranova/images/foto-3.jpg",
                    "casa-en-fraccionamiento-terranova/images/foto-4.jpg",
                    "casa-en-fraccionamiento-terranova/images/foto-5.jpg",
                    "casa-en-fraccionamiento-terranova/images/foto-6.jpg",
                    "casa-en-fraccionamiento-terranova/images/foto-7.jpg",
                    "casa-en-fraccionamiento-terranova/images/foto-8.jpg",
                    "casa-en-fraccionamiento-terranova/images/foto-9.jpg",
                    "casa-en-fraccionamiento-terranova/images/foto-10.jpg"
                ]
            };

            // VENTA: Casa Nueva en San Javier
            const casa_nueva_en_san_javierProperty = {
                address: "Monte del Quelite al 9900, Culiacán, Sinaloa",
                priceShort: "$1.36M",
                priceFull: "$1,360,000",
                title: "Casa Nueva en San Javier",
                location: "Monte del Quelite al 9900, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "65m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-nueva-en-san-javier/",
                whatsapp: "526672317963",
                photos: [
                    "casa-nueva-en-san-javier/images/foto-1.jpg",
                    "casa-nueva-en-san-javier/images/foto-2.jpg",
                    "casa-nueva-en-san-javier/images/foto-3.jpg",
                    "casa-nueva-en-san-javier/images/foto-4.jpg",
                    "casa-nueva-en-san-javier/images/foto-5.jpg",
                    "casa-nueva-en-san-javier/images/foto-6.jpg",
                    "casa-nueva-en-san-javier/images/foto-7.jpg",
                    "casa-nueva-en-san-javier/images/foto-8.jpg",
                    "casa-nueva-en-san-javier/images/foto-9.jpg",
                    "casa-nueva-en-san-javier/images/foto-10.jpg",
                    "casa-nueva-en-san-javier/images/foto-11.jpg",
                    "casa-nueva-en-san-javier/images/foto-12.jpg",
                    "casa-nueva-en-san-javier/images/foto-13.jpg",
                    "casa-nueva-en-san-javier/images/foto-14.jpg"
                ]
            };

            // VENTA: Casa - Fraccionamiento Zona Dorada
            const casa_fraccionamiento_zona_doradaProperty = {
                address: "Prol. Álvaro Obregón 768, Culiacán, Sinaloa",
                priceShort: "$1.29M",
                priceFull: "$1,295,000",
                title: "Casa - Fraccionamiento Zona Dorada",
                location: "Prol. Álvaro Obregón 768, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "62m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-fraccionamiento-zona-dorada/",
                whatsapp: "526672317963",
                photos: [
                    "casa-fraccionamiento-zona-dorada/images/foto-1.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-2.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-3.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-4.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-5.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-6.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-7.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-8.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-9.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-10.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-11.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-12.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-13.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-14.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-15.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-16.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-17.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-18.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-19.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-20.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-21.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-22.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-23.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-24.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-25.jpg",
                    "casa-fraccionamiento-zona-dorada/images/foto-26.jpg"
                ]
            };

            // VENTA: Casa - Fraccionamiento Valle Alto
            const casa_fraccionamiento_valle_altoProperty = {
                address: "Culiacán, Sinaloa",
                priceShort: "$1.30M",
                priceFull: "$1,300,000",
                title: "Casa - Fraccionamiento Valle Alto",
                location: "Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-fraccionamiento-valle-alto/",
                whatsapp: "526672317963",
                photos: [
                    "casa-fraccionamiento-valle-alto/images/foto-1.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-2.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-3.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-4.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-5.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-6.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-7.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-8.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-9.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-10.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-11.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-12.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-13.jpg",
                    "casa-fraccionamiento-valle-alto/images/foto-14.jpg"
                ]
            };

            // VENTA: Casa en Venta en Lomas de San Isidro con Cochera Techada Zona Sur
            const casa_en_venta_en_lomas_de_san_isidro_con_cochera_techada_zonProperty = {
                address: "Calle Aguamarina #4576, Culiacán, Sinaloa",
                priceShort: "$1.35M",
                priceFull: "$1,350,000",
                title: "Casa en Venta en Lomas de San Isidro con Cochera Techada Zona Sur",
                location: "Calle Aguamarina #4576, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "97m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-1.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-2.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-3.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-4.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-5.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-6.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-7.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-8.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-9.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-10.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-11.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-12.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-13.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-14.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-15.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-16.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-17.jpg",
                    "casa-en-venta-en-lomas-de-san-isidro-con-cochera-techada-zon/images/foto-18.jpg"
                ]
            };

            // VENTA: Casa en Rosales
            const casa_en_rosalesProperty = {
                address: "Prol. Álvaro Obregón 768, Culiacán, Sinaloa",
                priceShort: "$1.50M",
                priceFull: "$1,499,990",
                title: "Casa en Rosales",
                location: "Prol. Álvaro Obregón 768, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "105m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-rosales/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-rosales/images/foto-1.jpg",
                    "casa-en-rosales/images/foto-2.jpg",
                    "casa-en-rosales/images/foto-3.jpg",
                    "casa-en-rosales/images/foto-4.jpg",
                    "casa-en-rosales/images/foto-5.jpg",
                    "casa-en-rosales/images/foto-6.jpg",
                    "casa-en-rosales/images/foto-7.jpg",
                    "casa-en-rosales/images/foto-8.jpg",
                    "casa-en-rosales/images/foto-9.jpg",
                    "casa-en-rosales/images/foto-10.jpg",
                    "casa-en-rosales/images/foto-11.jpg",
                    "casa-en-rosales/images/foto-12.jpg",
                    "casa-en-rosales/images/foto-13.jpg"
                ]
            };

            // VENTA: Casa en Adolfo Lopez Mateos Remodelada
            const casa_en_adolfo_lopez_mateos_remodeladaProperty = {
                address: "Fortunato Alvares Castro al 1500, Culiacán, Sinaloa",
                priceShort: "$1.45M",
                priceFull: "$1,450,000",
                title: "Casa en Adolfo Lopez Mateos Remodelada",
                location: "Fortunato Alvares Castro al 1500, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "60m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-adolfo-lopez-mateos-remodelada/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-1.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-2.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-3.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-4.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-5.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-6.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-7.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-8.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-9.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-10.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-11.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-12.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-13.jpg",
                    "casa-en-adolfo-lopez-mateos-remodelada/images/foto-14.jpg"
                ]
            };

            // VENTA: Casa en Adolfo Lopez Mateos
            const casa_en_adolfo_lopez_mateosProperty = {
                address: "Prol. Álvaro Obregón 768, Culiacán, Sinaloa",
                priceShort: "$1.45M",
                priceFull: "$1,450,000",
                title: "Casa en Adolfo Lopez Mateos",
                location: "Prol. Álvaro Obregón 768, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "72m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-adolfo-lopez-mateos/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-adolfo-lopez-mateos/images/foto-1.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-2.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-3.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-4.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-5.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-6.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-7.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-8.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-9.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-10.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-11.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-12.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-13.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-14.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-15.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-16.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-17.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-18.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-19.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-20.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-21.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-22.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-23.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-24.jpg",
                    "casa-en-adolfo-lopez-mateos/images/foto-25.jpg"
                ]
            };

            // VENTA: Casa en Rancho o Rancheria La Guasima
            const casa_en_rancho_o_rancheria_la_guasimaProperty = {
                address: "Prol. Álvaro Obregón 768, Culiacán, Sinaloa",
                priceShort: "$1.46M",
                priceFull: "$1,455,000",
                title: "Casa en Rancho o Rancheria La Guasima",
                location: "Prol. Álvaro Obregón 768, Culiacán",
                bedrooms: 2,
                bathrooms: 2,
                area: "70m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-rancho-o-rancheria-la-guasima/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-rancho-o-rancheria-la-guasima/images/foto-1.jpg",
                    "casa-en-rancho-o-rancheria-la-guasima/images/foto-2.jpg",
                    "casa-en-rancho-o-rancheria-la-guasima/images/foto-3.jpg",
                    "casa-en-rancho-o-rancheria-la-guasima/images/foto-4.jpg",
                    "casa-en-rancho-o-rancheria-la-guasima/images/foto-5.jpg"
                ]
            };

            // VENTA: Casa en Venta en Villas del Rio Elite
            const casa_en_venta_en_villas_del_rio_eliteProperty = {
                address: "Cto. Villa San Sebastián, Culiacán, Sinaloa",
                priceShort: "$1.45M",
                priceFull: "$1,450,000",
                title: "Casa en Venta en Villas del Rio Elite",
                location: "Cto. Villa San Sebastián, Culiacán",
                bedrooms: 2,
                bathrooms: 5,
                area: "77m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-villas-del-rio-elite/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-1.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-2.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-3.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-4.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-5.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-6.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-7.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-8.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-9.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-10.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-11.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-12.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-13.jpg",
                    "casa-en-venta-en-villas-del-rio-elite/images/foto-14.jpg"
                ]
            };

            // VENTA: Casa de 2 Pisos en Infonavit Barrancos, Culiacán
            const casa_de_2_pisos_en_infonavit_barrancos_culiacanProperty = {
                address: "Articulo 83 A, Culiacán, Sinaloa",
                priceShort: "$1.50M",
                priceFull: "$1,500,000",
                title: "Casa de 2 Pisos en Infonavit Barrancos, Culiacán",
                location: "Articulo 83 A, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "125m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-de-2-pisos-en-infonavit-barrancos-culiacan/",
                whatsapp: "526672317963",
                photos: [
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-1.jpg",
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-2.jpg",
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-3.jpg",
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-4.jpg",
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-5.jpg",
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-6.jpg",
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-7.jpg",
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-8.jpg",
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-9.jpg",
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-10.jpg",
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-11.jpg",
                    "casa-de-2-pisos-en-infonavit-barrancos-culiacan/images/foto-12.jpg"
                ]
            };

            // VENTA: Casa en Valle Alto Zona Norte
            const casa_en_valle_alto_zona_norteProperty = {
                address: "Privada Valle Alto Verde, Culiacán, Sinaloa",
                priceShort: "$1.30M",
                priceFull: "$1,300,000",
                title: "Casa en Valle Alto Zona Norte",
                location: "Privada Valle Alto Verde, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-valle-alto-zona-norte/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-valle-alto-zona-norte/images/foto-1.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-2.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-3.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-4.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-5.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-6.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-7.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-8.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-9.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-10.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-11.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-12.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-13.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-14.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-15.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-16.jpg",
                    "casa-en-valle-alto-zona-norte/images/foto-17.jpg"
                ]
            };

            // VENTA: Casa - Fraccionamiento Hacienda Arboledas
            const casa_fraccionamiento_hacienda_arboledasProperty = {
                address: "Av Sendero Hacienda Arboledas, Culiacán, Sinaloa",
                priceShort: "$1.25M",
                priceFull: "$1,250,000",
                title: "Casa - Fraccionamiento Hacienda Arboledas",
                location: "Av Sendero Hacienda Arboledas, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "75m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-fraccionamiento-hacienda-arboledas/",
                whatsapp: "526672317963",
                photos: [
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-1.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-2.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-3.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-4.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-5.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-6.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-7.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-8.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-9.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-10.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-11.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-12.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-13.jpg",
                    "casa-fraccionamiento-hacienda-arboledas/images/foto-14.jpg"
                ]
            };

            // VENTA: Casa en Los Ángeles Culiacán Fracc. Las Glorias (Sauces)
            const casa_en_los_angeles_culiacan_fracc_las_glorias_saucesProperty = {
                address: "Fraccionamiento los angeles, Culiacán, Sinaloa",
                priceShort: "$1.30M",
                priceFull: "$1,300,000",
                title: "Casa en Los Ángeles Culiacán Fracc. Las Glorias (Sauces)",
                location: "Fraccionamiento los angeles, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "49m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-1.jpg",
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-2.jpg",
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-3.jpg",
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-4.jpg",
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-5.jpg",
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-6.jpg",
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-7.jpg",
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-8.jpg",
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-9.jpg",
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-10.jpg",
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-11.jpg",
                    "casa-en-los-angeles-culiacan-fracc-las-glorias-sauces/images/foto-12.jpg"
                ]
            };

            // VENTA: Casa en Venta en Fracc Capistrano, Sector Sur de Culiacán.
            const casa_en_venta_en_fracc_capistrano_sector_sur_de_culiacanProperty = {
                address: "Calle Misión San Bernardino 2809, Culiacán, Sinaloa",
                priceShort: "$1.50M",
                priceFull: "$1,500,000",
                title: "Casa en Venta en Fracc Capistrano, Sector Sur de Culiacán.",
                location: "Calle Misión San Bernardino 2809, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "88m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-1.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-2.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-3.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-4.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-5.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-6.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-7.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-8.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-9.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-10.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-11.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-12.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-13.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-14.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-15.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-16.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-17.jpg",
                    "casa-en-venta-en-fracc-capistrano-sector-sur-de-culiacan/images/foto-18.jpg"
                ]
            };

            // VENTA: Casa - Fraccionamiento Santa Elena
            const casa_fraccionamiento_santa_elenaProperty = {
                address: "Culiacán, Sinaloa",
                priceShort: "$1.30M",
                priceFull: "$1,300,000",
                title: "Casa - Fraccionamiento Santa Elena",
                location: "Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "67m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-fraccionamiento-santa-elena/",
                whatsapp: "526672317963",
                photos: [
                    "casa-fraccionamiento-santa-elena/images/foto-1.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-2.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-3.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-4.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-5.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-6.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-7.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-8.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-9.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-10.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-11.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-12.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-13.jpg",
                    "casa-fraccionamiento-santa-elena/images/foto-14.jpg"
                ]
            };

            // VENTA: Casa en Venta en Stanza Corcega A2
            const casa_en_venta_en_stanza_corcega_a2Property = {
                address: "Culiacán, Sinaloa",
                priceShort: "$1.29M",
                priceFull: "$1,290,000",
                title: "Casa en Venta en Stanza Corcega A2",
                location: "Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "68m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-stanza-corcega-a2/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-1.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-2.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-3.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-4.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-5.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-6.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-7.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-8.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-9.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-10.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-11.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-12.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-13.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-14.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-15.jpg",
                    "casa-en-venta-en-stanza-corcega-a2/images/foto-16.jpg"
                ]
            };

            // VENTA: Hermosa Casa en Valle Alto, Culiacán
            const hermosa_casa_en_valle_alto_culiacanProperty = {
                address: "Valle de Hidalgo, Culiacán, Sinaloa",
                priceShort: "$1.49M",
                priceFull: "$1,485,000",
                title: "Hermosa Casa en Valle Alto, Culiacán",
                location: "Valle de Hidalgo, Culiacán",
                bedrooms: 2,
                bathrooms: 2,
                area: "80m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/hermosa-casa-en-valle-alto-culiacan/",
                whatsapp: "526672317963",
                photos: [
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-1.jpg",
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-2.jpg",
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-3.jpg",
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-4.jpg",
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-5.jpg",
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-6.jpg",
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-7.jpg",
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-8.jpg",
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-9.jpg",
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-10.jpg",
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-11.jpg",
                    "hermosa-casa-en-valle-alto-culiacan/images/foto-12.jpg"
                ]
            };

            // VENTA: Se Vende Casa con Terreno
            const se_vende_casa_con_terrenoProperty = {
                address: "CALLE SEPTIMA PONIENTE S/N, Culiacán, Sinaloa",
                priceShort: "$1.20M",
                priceFull: "$1,200,000",
                title: "Se Vende Casa con Terreno",
                location: "CALLE SEPTIMA PONIENTE S/N, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "124m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/se-vende-casa-con-terreno/",
                whatsapp: "526672317963",
                photos: [
                    "se-vende-casa-con-terreno/images/foto-1.jpg",
                    "se-vende-casa-con-terreno/images/foto-2.jpg",
                    "se-vende-casa-con-terreno/images/foto-3.jpg",
                    "se-vende-casa-con-terreno/images/foto-4.jpg",
                    "se-vende-casa-con-terreno/images/foto-5.jpg",
                    "se-vende-casa-con-terreno/images/foto-6.jpg",
                    "se-vende-casa-con-terreno/images/foto-7.jpg",
                    "se-vende-casa-con-terreno/images/foto-8.jpg",
                    "se-vende-casa-con-terreno/images/foto-9.jpg",
                    "se-vende-casa-con-terreno/images/foto-10.jpg",
                    "se-vende-casa-con-terreno/images/foto-11.jpg",
                    "se-vende-casa-con-terreno/images/foto-12.jpg"
                ]
            };

            // VENTA: Se Vende Casa Col. Lazaro Cardenas
            const se_vende_casa_col_lazaro_cardenasProperty = {
                address: "Culiacán, Sinaloa",
                priceShort: "$1.50M",
                priceFull: "$1,500,000",
                title: "Se Vende Casa Col. Lazaro Cardenas",
                location: "Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "190m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/se-vende-casa-col-lazaro-cardenas/",
                whatsapp: "526672317963",
                photos: [
                    "se-vende-casa-col-lazaro-cardenas/images/foto-1.jpg",
                    "se-vende-casa-col-lazaro-cardenas/images/foto-2.jpg",
                    "se-vende-casa-col-lazaro-cardenas/images/foto-3.jpg",
                    "se-vende-casa-col-lazaro-cardenas/images/foto-4.jpg",
                    "se-vende-casa-col-lazaro-cardenas/images/foto-5.jpg",
                    "se-vende-casa-col-lazaro-cardenas/images/foto-6.jpg",
                    "se-vende-casa-col-lazaro-cardenas/images/foto-7.jpg",
                    "se-vende-casa-col-lazaro-cardenas/images/foto-8.jpg",
                    "se-vende-casa-col-lazaro-cardenas/images/foto-9.jpg",
                    "se-vende-casa-col-lazaro-cardenas/images/foto-10.jpg"
                ]
            };

            // VENTA: Se Vende Casa Stanza Albaterra
            const se_vende_casa_stanza_albaterraProperty = {
                address: "San José 3720, Culiacán, Sinaloa",
                priceShort: "$1.26M",
                priceFull: "$1,260,000",
                title: "Se Vende Casa Stanza Albaterra",
                location: "San José 3720, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "55m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/se-vende-casa-stanza-albaterra/",
                whatsapp: "526672317963",
                photos: [
                    "se-vende-casa-stanza-albaterra/images/foto-1.jpg",
                    "se-vende-casa-stanza-albaterra/images/foto-2.jpg",
                    "se-vende-casa-stanza-albaterra/images/foto-3.jpg",
                    "se-vende-casa-stanza-albaterra/images/foto-4.jpg",
                    "se-vende-casa-stanza-albaterra/images/foto-5.jpg",
                    "se-vende-casa-stanza-albaterra/images/foto-6.jpg",
                    "se-vende-casa-stanza-albaterra/images/foto-7.jpg",
                    "se-vende-casa-stanza-albaterra/images/foto-8.jpg",
                    "se-vende-casa-stanza-albaterra/images/foto-9.jpg",
                    "se-vende-casa-stanza-albaterra/images/foto-10.jpg"
                ]
            };

            // VENTA: Se Vende Casa en Perisur II Culiacán
            const se_vende_casa_en_perisur_ii_culiacanProperty = {
                address: "Calle Ahuejote 591, Culiacán, Sinaloa",
                priceShort: "$2.30M",
                priceFull: "$2,300,002",
                title: "Se Vende Casa en Perisur II Culiacán",
                location: "Calle Ahuejote 591, Culiacán",
                bedrooms: 3,
                bathrooms: 1,
                area: "85m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/se-vende-casa-en-perisur-ii-culiacan/",
                whatsapp: "526672317963",
                photos: [
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-1.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-2.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-3.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-4.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-5.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-6.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-7.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-8.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-9.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-10.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-11.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-12.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-13.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-14.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-15.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-16.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-17.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-18.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-19.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-20.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-21.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-22.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-23.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-24.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-25.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-26.jpg",
                    "se-vende-casa-en-perisur-ii-culiacan/images/foto-27.jpg"
                ]
            };

            // VENTA: Casa en Venta Bosque Abundancia Bosques del Rey Culiacan Sinaloa
            const casa_en_venta_bosque_abundancia_bosques_del_rey_culiacan_sinProperty = {
                address: "Bosque Abundancia, Culiacán, Sinaloa",
                priceShort: "$2.52M",
                priceFull: "$2,520,000",
                title: "Casa en Venta Bosque Abundancia Bosques del Rey Culiacan Sinaloa",
                location: "Bosque Abundancia, Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "105m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-1.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-2.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-3.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-4.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-5.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-6.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-7.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-8.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-9.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-10.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-11.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-12.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-13.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-14.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-15.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-16.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-17.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-18.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-19.jpg",
                    "casa-en-venta-bosque-abundancia-bosques-del-rey-culiacan-sin/images/foto-20.jpg"
                ]
            };

            // RENTA: Casa en Renta Colonia Lomas del Pedregal Culiacan Sinaloa
            const casa_en_renta_colonia_lomas_del_pedregal_culiacan_sinaloaProperty = {
                address: "Avenida De Las Lomas, Culiacán, Sinaloa",
                priceShort: "$10K",
                priceFull: "$10,000",
                title: "Casa en Renta Colonia Lomas del Pedregal Culiacan Sinaloa",
                location: "Avenida De Las Lomas, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "100m²",
                type: "renta",
                url: "https://casasenventa.info/culiacan/casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-1.jpg",
                    "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-2.jpg",
                    "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-3.jpg",
                    "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-4.jpg",
                    "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-5.jpg",
                    "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-6.jpg",
                    "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-7.jpg",
                    "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-8.jpg",
                    "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-9.jpg",
                    "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-10.jpg",
                    "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-11.jpg"
                ]
            };

            // VENTA: Casa en Fraccionamiento Rincón Colonial
            const casa_en_fraccionamiento_rincon_colonialProperty = {
                address: "Avenida DEL Cardenal al 4800, Culiacán, Sinaloa",
                priceShort: "$3M",
                priceFull: "$3,000,000",
                title: "Casa en Fraccionamiento Rincón Colonial",
                location: "Avenida DEL Cardenal al 4800, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "174m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-fraccionamiento-rincon-colonial/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-1.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-2.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-3.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-4.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-5.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-6.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-7.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-8.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-9.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-10.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-11.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-12.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-13.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-14.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-15.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-16.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-17.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-18.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-19.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-20.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-21.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-22.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-23.jpg",
                    "casa-en-fraccionamiento-rincon-colonial/images/foto-24.jpg"
                ]
            };

            // VENTA: Se Vende Casa Miguel Hidalgo
            const se_vende_casa_miguel_hidalgoProperty = {
                address: "1624 FRANCISCO GOMEZ FLORES, Culiacán, Sinaloa",
                priceShort: "$2.95M",
                priceFull: "$2,950,000",
                title: "Se Vende Casa Miguel Hidalgo",
                location: "1624 FRANCISCO GOMEZ FLORES, Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "venta",
                url: "https://casasenventa.info/culiacan/se-vende-casa-miguel-hidalgo/",
                whatsapp: "526672317963",
                photos: [
                    "se-vende-casa-miguel-hidalgo/images/foto-1.jpg",
                    "se-vende-casa-miguel-hidalgo/images/foto-2.jpg",
                    "se-vende-casa-miguel-hidalgo/images/foto-3.jpg",
                    "se-vende-casa-miguel-hidalgo/images/foto-4.jpg",
                    "se-vende-casa-miguel-hidalgo/images/foto-5.jpg",
                    "se-vende-casa-miguel-hidalgo/images/foto-6.jpg",
                    "se-vende-casa-miguel-hidalgo/images/foto-7.jpg",
                    "se-vende-casa-miguel-hidalgo/images/foto-8.jpg",
                    "se-vende-casa-miguel-hidalgo/images/foto-9.jpg",
                    "se-vende-casa-miguel-hidalgo/images/foto-10.jpg"
                ]
            };

            // RENTA: Casa en Renta Circuito Tabachines Culiacan Sinaloa
            const casa_en_renta_circuito_tabachines_culiacan_sinaloaProperty = {
                address: "Avenida Federalismo 10, Culiacán, Sinaloa",
                priceShort: "$19K",
                priceFull: "$19,000",
                title: "Casa en Renta Circuito Tabachines Culiacan Sinaloa",
                location: "Avenida Federalismo 10, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "160m²",
                type: "renta",
                url: "https://casasenventa.info/culiacan/casa-en-renta-circuito-tabachines-culiacan-sinaloa/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-1.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-2.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-3.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-4.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-5.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-6.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-7.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-8.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-9.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-10.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-11.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-12.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-13.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-14.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-15.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-16.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-17.jpg"
                ]
            };

            // VENTA: Casa en Venta en Privada La Cantera
            const casa_en_venta_en_privada_la_canteraProperty = {
                address: "Circuito Villa Alegre 2556, Culiacán, Sinaloa",
                priceShort: "$21.50M",
                priceFull: "$21,496,000",
                title: "Casa en Venta en Privada La Cantera",
                location: "Circuito Villa Alegre 2556, Culiacán",
                bedrooms: 3,
                bathrooms: 4,
                area: "547m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-en-privada-la-cantera/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-en-privada-la-cantera/images/foto-1.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-2.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-3.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-4.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-5.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-6.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-7.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-8.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-9.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-10.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-11.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-12.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-13.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-14.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-15.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-16.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-17.jpg",
                    "casa-en-venta-en-privada-la-cantera/images/foto-18.jpg"
                ]
            };

            // VENTA: Se Vende Casa en Isla del Oeste en La Primavera
            const se_vende_casa_en_isla_del_oeste_en_la_primaveraProperty = {
                address: "Isla del Oeste, Culiacán, Sinaloa",
                priceShort: "$30.14M",
                priceFull: "$30,135,000",
                title: "Se Vende Casa en Isla del Oeste en La Primavera",
                location: "Isla del Oeste, Culiacán",
                bedrooms: 4,
                bathrooms: 4,
                area: "736m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/se-vende-casa-en-isla-del-oeste-en-la-primavera/",
                whatsapp: "526672317963",
                photos: [
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-1.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-2.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-3.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-4.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-5.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-6.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-7.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-8.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-9.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-10.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-11.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-12.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-13.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-14.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-15.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-16.jpg",
                    "se-vende-casa-en-isla-del-oeste-en-la-primavera/images/foto-17.jpg"
                ]
            };

            // VENTA: Stanza Toscana Culiacan Sinaloa
            const stanza_toscana_culiacan_sinaloaProperty = {
                address: "Boulevard Paseo Toscana, Culiacán, Sinaloa",
                priceShort: "$2.98M",
                priceFull: "$2,975,000",
                title: "Stanza Toscana Culiacan Sinaloa",
                location: "Boulevard Paseo Toscana, Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "146m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/stanza-toscana-culiacan-sinaloa/",
                whatsapp: "526672317963",
                photos: [
                    "stanza-toscana-culiacan-sinaloa/images/foto-1.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-2.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-3.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-4.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-5.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-6.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-7.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-8.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-9.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-10.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-11.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-12.jpg",
                    "stanza-toscana-culiacan-sinaloa/images/foto-13.jpg"
                ]
            };

            // VENTA: Casa en Fraccionamiento Canaco
            const casa_en_fraccionamiento_canacoProperty = {
                address: "Canaco, Culiacán, Sinaloa",
                priceShort: "$3.20M",
                priceFull: "$3,200,000",
                title: "Casa en Fraccionamiento Canaco",
                location: "Canaco, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "190m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-fraccionamiento-canaco/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-fraccionamiento-canaco/images/foto-1.jpg",
                    "casa-en-fraccionamiento-canaco/images/foto-2.jpg",
                    "casa-en-fraccionamiento-canaco/images/foto-3.jpg",
                    "casa-en-fraccionamiento-canaco/images/foto-4.jpg",
                    "casa-en-fraccionamiento-canaco/images/foto-5.jpg",
                    "casa-en-fraccionamiento-canaco/images/foto-6.jpg",
                    "casa-en-fraccionamiento-canaco/images/foto-7.jpg",
                    "casa-en-fraccionamiento-canaco/images/foto-8.jpg",
                    "casa-en-fraccionamiento-canaco/images/foto-9.jpg",
                    "casa-en-fraccionamiento-canaco/images/foto-10.jpg"
                ]
            };

            // VENTA: Casa en Pueblo Imala
            const casa_en_pueblo_imalaProperty = {
                address: "Prol. Álvaro Obregón 768, Culiacán, Sinaloa",
                priceShort: "$2.50M",
                priceFull: "$2,500,000",
                title: "Casa en Pueblo Imala",
                location: "Prol. Álvaro Obregón 768, Culiacán",
                bedrooms: 2,
                bathrooms: 1,
                area: "93m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-pueblo-imala/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-pueblo-imala/images/foto-1.jpg"
                ]
            };

            // VENTA: Estrena Casa con Acabados de Lujo
            const estrena_casa_con_acabados_de_lujoProperty = {
                address: "Prol. Álvaro Obregón 768, Culiacán, Sinaloa",
                priceShort: "$3.50M",
                priceFull: "$3,500,000",
                title: "Estrena Casa con Acabados de Lujo",
                location: "Prol. Álvaro Obregón 768, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "110m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/estrena-casa-con-acabados-de-lujo/",
                whatsapp: "526672317963",
                photos: [
                    "estrena-casa-con-acabados-de-lujo/images/foto-1.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-2.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-3.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-4.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-5.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-6.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-7.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-8.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-9.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-10.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-11.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-12.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-13.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-14.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-15.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-16.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-17.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-18.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-19.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-20.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-21.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-22.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-23.jpg",
                    "estrena-casa-con-acabados-de-lujo/images/foto-24.jpg"
                ]
            };

            // VENTA: Casa 113 m² con 3 Recámaras en Venta, Fraccionamiento Isla Residencial
            const casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resProperty = {
                address: "Isla Residencial, Culiacán, Sinaloa",
                priceShort: "$3.20M",
                priceFull: "$3,200,000",
                title: "Casa 113 m² con 3 Recámaras en Venta, Fraccionamiento Isla Residencial",
                location: "Isla Residencial, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "184m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/",
                whatsapp: "526672317963",
                photos: [
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-1.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-2.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-3.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-4.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-5.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-6.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-7.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-8.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-9.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-10.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-11.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-12.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-13.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-14.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-15.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-16.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-17.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-18.jpg",
                    "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-19.jpg"
                ]
            };

            // VENTA: Casa en Venta Residencial con Alberca en Real del Valle Mazatlan
            const casa_en_venta_residencial_con_alberca_en_real_del_valle_mazaProperty = {
                address: "San Sebastián 4107, Culiacán, Sinaloa",
                priceShort: "$3.35M",
                priceFull: "$3,350,000",
                title: "Casa en Venta Residencial con Alberca en Real del Valle Mazatlan",
                location: "San Sebastián 4107, Culiacán",
                bedrooms: 4,
                bathrooms: 2,
                area: "130m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-1.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-2.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-3.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-4.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-5.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-6.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-7.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-8.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-9.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-10.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-11.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-12.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-13.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-14.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-15.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-16.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-17.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-18.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-19.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-20.jpg",
                    "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-21.jpg"
                ]
            };

            // VENTA: Casa en Venta de Real del Valle Coto 14
            const casa_en_venta_de_real_del_valle_coto_14Property = {
                address: "Real del Valle, Culiacán, Sinaloa",
                priceShort: "$2.99M",
                priceFull: "$2,990,000",
                title: "Casa en Venta de Real del Valle Coto 14",
                location: "Real del Valle, Culiacán",
                bedrooms: 2,
                bathrooms: 2,
                area: "105m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-de-real-del-valle-coto-14/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-1.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-2.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-3.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-4.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-5.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-6.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-7.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-8.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-9.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-10.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-11.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-12.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-13.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-14.jpg",
                    "casa-en-venta-de-real-del-valle-coto-14/images/foto-15.jpg"
                ]
            };

            // VENTA: Casa de 3 Recámaras y 160 m² en Venta, Valle del Ejido
            const casa_de_3_recamaras_y_160_m_en_venta_valle_del_ejidoProperty = {
                address: "Tierra y Libertad, Culiacán, Sinaloa",
                priceShort: "$2.31M",
                priceFull: "$2,310,000",
                title: "Casa de 3 Recámaras y 160 m² en Venta, Valle del Ejido",
                location: "Tierra y Libertad, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "150m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/",
                whatsapp: "526672317963",
                photos: [
                    "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-1.jpg",
                    "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-2.jpg",
                    "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-3.jpg",
                    "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-4.jpg",
                    "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-5.jpg",
                    "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-6.jpg",
                    "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-7.jpg",
                    "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-8.jpg",
                    "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-9.jpg",
                    "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-10.jpg",
                    "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-11.jpg"
                ]
            };

            // VENTA: Casa de Venta en Rincon de Los Girasoles en Fracc Rincon de Las Plazas
            const casa_de_venta_en_rincon_de_los_girasoles_en_fracc_rincon_de_Property = {
                address: "Rincón de los Girasoles, Culiacán, Sinaloa",
                priceShort: "$3.50M",
                priceFull: "$3,500,000",
                title: "Casa de Venta en Rincon de Los Girasoles en Fracc Rincon de Las Plazas",
                location: "Rincón de los Girasoles, Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "151m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/",
                whatsapp: "526672317963",
                photos: [
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-1.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-2.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-3.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-4.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-5.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-6.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-7.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-8.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-9.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-10.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-11.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-12.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-13.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-14.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-15.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-16.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-17.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-18.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-19.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-20.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-21.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-22.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-23.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-24.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-25.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-26.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-27.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-28.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-29.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-30.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-31.jpg",
                    "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-32.jpg"
                ]
            };

            // VENTA: Casa en Venta Real del Valle
            const casa_en_venta_real_del_valleProperty = {
                address: "Sta. Maria #5315, Culiacán, Sinaloa",
                priceShort: "$3.50M",
                priceFull: "$3,500,000",
                title: "Casa en Venta Real del Valle",
                location: "Sta. Maria #5315, Culiacán",
                bedrooms: 4,
                bathrooms: 2,
                area: "143m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-venta-real-del-valle/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-venta-real-del-valle/images/foto-1.jpg",
                    "casa-en-venta-real-del-valle/images/foto-2.jpg",
                    "casa-en-venta-real-del-valle/images/foto-3.jpg",
                    "casa-en-venta-real-del-valle/images/foto-4.jpg",
                    "casa-en-venta-real-del-valle/images/foto-5.jpg",
                    "casa-en-venta-real-del-valle/images/foto-6.jpg",
                    "casa-en-venta-real-del-valle/images/foto-7.jpg",
                    "casa-en-venta-real-del-valle/images/foto-8.jpg",
                    "casa-en-venta-real-del-valle/images/foto-9.jpg",
                    "casa-en-venta-real-del-valle/images/foto-10.jpg",
                    "casa-en-venta-real-del-valle/images/foto-11.jpg",
                    "casa-en-venta-real-del-valle/images/foto-12.jpg",
                    "casa-en-venta-real-del-valle/images/foto-13.jpg",
                    "casa-en-venta-real-del-valle/images/foto-14.jpg",
                    "casa-en-venta-real-del-valle/images/foto-15.jpg",
                    "casa-en-venta-real-del-valle/images/foto-16.jpg",
                    "casa-en-venta-real-del-valle/images/foto-17.jpg",
                    "casa-en-venta-real-del-valle/images/foto-18.jpg",
                    "casa-en-venta-real-del-valle/images/foto-19.jpg",
                    "casa-en-venta-real-del-valle/images/foto-20.jpg",
                    "casa-en-venta-real-del-valle/images/foto-21.jpg",
                    "casa-en-venta-real-del-valle/images/foto-22.jpg",
                    "casa-en-venta-real-del-valle/images/foto-23.jpg",
                    "casa-en-venta-real-del-valle/images/foto-24.jpg",
                    "casa-en-venta-real-del-valle/images/foto-25.jpg",
                    "casa-en-venta-real-del-valle/images/foto-26.jpg",
                    "casa-en-venta-real-del-valle/images/foto-27.jpg",
                    "casa-en-venta-real-del-valle/images/foto-28.jpg",
                    "casa-en-venta-real-del-valle/images/foto-29.jpg",
                    "casa-en-venta-real-del-valle/images/foto-30.jpg",
                    "casa-en-venta-real-del-valle/images/foto-31.jpg",
                    "casa-en-venta-real-del-valle/images/foto-32.jpg",
                    "casa-en-venta-real-del-valle/images/foto-33.jpg",
                    "casa-en-venta-real-del-valle/images/foto-34.jpg",
                    "casa-en-venta-real-del-valle/images/foto-35.jpg",
                    "casa-en-venta-real-del-valle/images/foto-36.jpg",
                    "casa-en-venta-real-del-valle/images/foto-37.jpg"
                ]
            };

            // VENTA: Casa en Cnop
            const casa_en_cnopProperty = {
                address: "Avenida 15 de Septiembre Cnop, Culiacán, Sinaloa",
                priceShort: "$2.20M",
                priceFull: "$2,200,000",
                title: "Casa en Cnop",
                location: "Avenida 15 de Septiembre Cnop, Culiacán",
                bedrooms: 6,
                bathrooms: 5,
                area: "362m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-cnop/",
                whatsapp: "526672317963",
                photos: [
                    "casa-en-cnop/images/foto-1.jpg",
                    "casa-en-cnop/images/foto-2.jpg",
                    "casa-en-cnop/images/foto-3.jpg",
                    "casa-en-cnop/images/foto-4.jpg",
                    "casa-en-cnop/images/foto-5.jpg",
                    "casa-en-cnop/images/foto-6.jpg",
                    "casa-en-cnop/images/foto-7.jpg",
                    "casa-en-cnop/images/foto-8.jpg",
                    "casa-en-cnop/images/foto-9.jpg",
                    "casa-en-cnop/images/foto-10.jpg",
                    "casa-en-cnop/images/foto-11.jpg",
                    "casa-en-cnop/images/foto-12.jpg",
                    "casa-en-cnop/images/foto-13.jpg",
                    "casa-en-cnop/images/foto-14.jpg",
                    "casa-en-cnop/images/foto-15.jpg",
                    "casa-en-cnop/images/foto-16.jpg",
                    "casa-en-cnop/images/foto-17.jpg",
                    "casa-en-cnop/images/foto-18.jpg"
                ]
            };


            // RENTA: Casa Vitia Granada
            const vitiagranadaProperty = {
                address: "Fraccionamiento Villa del Cedro, Culiacán, Sinaloa",
                priceShort: "$8K",
                priceFull: "$8,000/mes",
                title: "Casa en Renta 3 Habitaciones 2 Plantas, Vitia Granada",
                location: "Fraccionamiento Villa del Cedro, Culiacán",
                bedrooms: 3,
                bathrooms: 1,
                area: "102m²",
                type: "renta",
                url: "https://casasenventa.info/culiacan/casa-en-renta-3-habitaciones-2-plantas-vitia-granada/",
                photos: [
                    "casa-en-renta-3-habitaciones-2-plantas-vitia-granada/images/foto-1.jpg",
                    "casa-en-renta-3-habitaciones-2-plantas-vitia-granada/images/foto-2.jpg",
                    "casa-en-renta-3-habitaciones-2-plantas-vitia-granada/images/foto-3.jpg",
                    "casa-en-renta-3-habitaciones-2-plantas-vitia-granada/images/foto-4.jpg",
                    "casa-en-renta-3-habitaciones-2-plantas-vitia-granada/images/foto-5.jpg",
                    "casa-en-renta-3-habitaciones-2-plantas-vitia-granada/images/foto-6.jpg",
                    "casa-en-renta-3-habitaciones-2-plantas-vitia-granada/images/foto-7.jpg",
                    "casa-en-renta-3-habitaciones-2-plantas-vitia-granada/images/foto-8.jpg",
                    "casa-en-renta-3-habitaciones-2-plantas-vitia-granada/images/foto-9.jpg"
                ]
            };

            // RENTA: Casa 3 Ríos
            const tresRiosProperty = {
                address: "Privada Agua Marina 938, Desarrollo Urbano Tres Ríos, Culiacán, Sinaloa",
                priceShort: "$13K",
                priceFull: "$13,000/mes",
                title: "Casa Renta 3 Ríos - Tres Ríos",
                location: "Tres Ríos, Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "N/D",
                type: "renta",
                url: "https://casasenventa.info/casa-renta-3-rios.html",
                photos: [
                    "../images/3-rios/privada-agua-marina-938-desarrollo-urbano-3-rios-culiacan-sinaloa-30197180-foto-a6d8d746-6a55-4c64-a360-9cd0838dd3d5.jpg",
                    "../images/3-rios/privada-agua-marina-938-desarrollo-urbano-3-rios-culiacan-sinaloa-30197180-foto-8d225114-4f0b-4e81-af9f-ae63b7dadc8e.jpg",
                    "../images/3-rios/agua-marina-938-desarrollo-urbano-3-rios-culiacan-sinaloa-30197180-foto-038ac2f6-e5ac-432a-a6a5-c928154f64b2.jpg",
                    "../images/3-rios/agua-marina-938-desarrollo-urbano-3-rios-culiacan-sinaloa-30197180-foto-04468e80-33bd-4702-af2b-5c07ff1b0055.jpg",
                    "../images/3-rios/agua-marina-938-desarrollo-urbano-3-rios-culiacan-sinaloa-30197180-foto-06b6efa4-aa70-4c08-a018-284826c2b793.jpg",
                    "../images/3-rios/agua-marina-938-desarrollo-urbano-3-rios-culiacan-sinaloa-30197180-foto-25a838c1-bf2a-4c12-bc00-186fcc343709.jpg",
                    "../images/3-rios/agua-marina-938-desarrollo-urbano-3-rios-culiacan-sinaloa-30197180-foto-6546db55-4530-4c66-9f9f-3f3127bf8751.jpg",
                    "../images/3-rios/agua-marina-938-desarrollo-urbano-3-rios-culiacan-sinaloa-30197180-foto-7aeff357-3327-4dff-967b-4fc578df3e8f.jpg",
                    "../images/3-rios/agua-marina-938-desarrollo-urbano-3-rios-culiacan-sinaloa-30197180-foto-7dcc87af-b020-4dee-a059-5114a420073a.jpg",
                    "../images/3-rios/agua-marina-938-desarrollo-urbano-3-rios-culiacan-sinaloa-30197180-foto-9c4f3d3e-4c4c-4b31-bcc5-635b3318d56e.jpg",
                    "../images/3-rios/privada-agua-marina-938-desarrollo-urbano-3-rios-culiacan-sinaloa-30197180-foto-e54f3398-a921-4030-bd65-030a5d37a0d5.jpg"
                ]
            };

            // RENTA: Casa Altluz Residencial
            const altluzProperty = {
                address: "Altluz Residencial, Salida Norte, Culiacán, Sinaloa",
                priceShort: "$15K",
                priceFull: "$15,000/mes",
                title: "Casa en Renta Altluz Residencial",
                location: "Altluz Residencial, Culiacán",
                bedrooms: 3,
                bathrooms: 2.5,
                area: "N/D",
                type: "renta",
                url: "https://casasenventa.info/casa-renta-altluz.html",
                photos: [
                    "../images/casa-renta-altluz/6ecd0fdd-7230-11f0-8f9a-656478b750c8.jpeg",
                    "../images/casa-renta-altluz/6ecd6a55-7230-11f0-bc69-656478b750c8 (1).jpeg",
                    "../images/casa-renta-altluz/6ecd6a55-7230-11f0-bc69-656478b750c8.jpeg",
                    "../images/casa-renta-altluz/6ecd7cda-7230-11f0-8351-656478b750c8.jpeg",
                    "../images/casa-renta-altluz/6ecd8b64-7230-11f0-add7-656478b750c8.jpeg",
                    "../images/casa-renta-altluz/6ecd992a-7230-11f0-956a-656478b750c8.jpeg",
                    "../images/casa-renta-altluz/6ecda6b4-7230-11f0-a249-656478b750c8.jpeg",
                    "../images/casa-renta-altluz/6ecdc472-7230-11f0-be32-656478b750c8.jpeg",
                    "../images/casa-renta-altluz/6ecdd311-7230-11f0-9cbb-656478b750c8.jpeg",
                    "../images/casa-renta-altluz/6ecde0a9-7230-11f0-87d3-656478b750c8.jpeg",
                    "../images/casa-renta-altluz/6ecdedfd-7230-11f0-9694-656478b750c8.jpeg"
                ]
            };

            // RENTA: Casa Avenida de las Aves 826673
            const avenidaAves1Property = {
                address: "Avenida de las Aves, Culiacán, Sinaloa",
                priceShort: "$23K",
                priceFull: "$23,000/mes",
                title: "Casa en Renta Avenida de las Aves",
                location: "Avenida de las Aves, Culiacán",
                bedrooms: 2,
                bathrooms: 3,
                area: "140m²",
                type: "renta",
                url: "https://casasenventa.info/casa-renta-avenida-de-las-aves-826673.html",
                photos: [
                    "../images/casa-renta-avenida-de-las-aves-826673/foto-1.jpg",
                    "../images/casa-renta-avenida-de-las-aves-826673/foto-2.jpg",
                    "../images/casa-renta-avenida-de-las-aves-826673/foto-3.jpg",
                    "../images/casa-renta-avenida-de-las-aves-826673/foto-4.jpg",
                    "../images/casa-renta-avenida-de-las-aves-826673/foto-5.jpg"
                ]
            };

            // RENTA: Casa Avenida de las Aves 883536
            const avenidaAves2Property = {
                address: "Avenida de las Aves, Culiacán, Sinaloa",
                priceShort: "$23K",
                priceFull: "$23,000/mes",
                title: "Casa en Renta Avenida de las Aves",
                location: "Avenida de las Aves, Culiacán",
                bedrooms: 2,
                bathrooms: 3,
                area: "140m²",
                type: "renta",
                url: "https://casasenventa.info/casa-renta-avenida-de-las-aves-883536.html",
                photos: [
                    "../images/casa-renta-avenida-de-las-aves-883536/foto-1.jpg",
                    "../images/casa-renta-avenida-de-las-aves-883536/foto-2.jpg",
                    "../images/casa-renta-avenida-de-las-aves-883536/foto-3.jpg",
                    "../images/casa-renta-avenida-de-las-aves-883536/foto-4.jpg",
                    "../images/casa-renta-avenida-de-las-aves-883536/foto-5.jpg",
                    "../images/casa-renta-avenida-de-las-aves-883536/foto-6.jpg",
                    "../images/casa-renta-avenida-de-las-aves-883536/foto-7.jpg",
                    "../images/casa-renta-avenida-de-las-aves-883536/foto-8.jpg",
                    "../images/casa-renta-avenida-de-las-aves-883536/foto-9.jpg",
                    "../images/casa-renta-avenida-de-las-aves-883536/foto-10.jpg",
                    "../images/casa-renta-avenida-de-las-aves-883536/foto-11.jpg"
                ]
            };

            // RENTA: Casa Belcantto
            const belcanttoProperty = {
                address: "Belcantto, Culiacán, Sinaloa",
                priceShort: "$14K",
                priceFull: "$14,000/mes",
                title: "Casa en Renta Belcantto",
                location: "Belcantto, Culiacán",
                bedrooms: 2,
                bathrooms: 2,
                area: "110m²",
                type: "renta",
                url: "https://casasenventa.info/casa-renta-belcantto-324200.html",
                photos: [
                    "../images/casa-renta-belcantto-324200/foto-1.jpg",
                    "../images/casa-renta-belcantto-324200/foto-2.jpg",
                    "../images/casa-renta-belcantto-324200/foto-3.jpg",
                    "../images/casa-renta-belcantto-324200/foto-4.jpg",
                    "../images/casa-renta-belcantto-324200/foto-5.jpg",
                    "../images/casa-renta-belcantto-324200/foto-6.jpg",
                    "../images/casa-renta-belcantto-324200/foto-7.jpg",
                    "../images/casa-renta-belcantto-324200/foto-8.jpg",
                    "../images/casa-renta-belcantto-324200/foto-9.jpg",
                    "../images/casa-renta-belcantto-324200/foto-10.jpg",
                    "../images/casa-renta-belcantto-324200/foto-11.jpg"
                ]
            };

            // RENTA: Casa Portalegre Valley
            const portalegreValleyProperty = {
                address: "Fraccionamiento Portalegre, Culiacán, Sinaloa",
                priceShort: "$42K",
                priceFull: "$42,000/mes",
                title: "Casa en Renta en Portalegre Valley Totalmente Equipada",
                location: "Fraccionamiento Portalegre, Culiacán",
                bedrooms: 3,
                bathrooms: 4,
                area: "286m²",
                type: "renta",
                url: "https://casasenventa.info/culiacan/casa-en-renta-en-portalegre-valley-totalmente-equipada/",
                photos: [
                    "casa-en-renta-en-portalegre-valley-totalmente-equipada/images/foto-1.jpg",
                    "casa-en-renta-en-portalegre-valley-totalmente-equipada/images/foto-2.jpg",
                    "casa-en-renta-en-portalegre-valley-totalmente-equipada/images/foto-3.jpg",
                    "casa-en-renta-en-portalegre-valley-totalmente-equipada/images/foto-4.jpg",
                    "casa-en-renta-en-portalegre-valley-totalmente-equipada/images/foto-5.jpg",
                    "casa-en-renta-en-portalegre-valley-totalmente-equipada/images/foto-6.jpg",
                    "casa-en-renta-en-portalegre-valley-totalmente-equipada/images/foto-7.jpg",
                    "casa-en-renta-en-portalegre-valley-totalmente-equipada/images/foto-8.jpg",
                    "casa-en-renta-en-portalegre-valley-totalmente-equipada/images/foto-9.jpg",
                    "casa-en-renta-en-portalegre-valley-totalmente-equipada/images/foto-10.jpg",
                    "casa-en-renta-en-portalegre-valley-totalmente-equipada/images/foto-11.jpg"
                ]
            };

            // RENTA: Casa Circuito Tabachines
            const circuitoTabachinesProperty = {
                address: "Avenida Federalismo 10, Recursos Hidráulicos, Culiacán, Sinaloa",
                priceShort: "$19K",
                priceFull: "$19,000/mes",
                title: "Casa en Renta Circuito Tabachines Culiacan Sinaloa",
                location: "Recursos Hidráulicos, Culiacán",
                bedrooms: 3,
                bathrooms: 3,
                area: "160m²",
                type: "renta",
                url: "https://casasenventa.info/culiacan/casa-en-renta-circuito-tabachines-culiacan-sinaloa/",
                photos: [
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-1.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-2.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-3.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-4.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-5.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-6.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-7.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-8.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-9.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-10.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-11.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-12.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-13.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-14.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-15.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-16.jpg",
                    "casa-en-renta-circuito-tabachines-culiacan-sinaloa/images/foto-17.jpg"
                ]
            };

            // VENTA: Casa en Fraccionamiento Cañadas
            const casa_en_fraccionamiento_canadasProperty = {
                address: "Cañadas, Culiacán, Sinaloa, Mexico, Fraccionamiento Cañadas",
                priceShort: "$3M",
                priceFull: "$2,990,000",
                title: "Casa en Fraccionamiento Cañadas",
                location: "Cañadas, Culiacán",
                bedrooms: 3,
                bathrooms: 4,
                area: "185m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-fraccionamiento-canadas/",
                photos: [
                    "casa-en-fraccionamiento-canadas/images/foto-1.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-2.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-3.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-4.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-5.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-6.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-7.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-8.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-9.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-10.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-11.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-12.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-13.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-14.jpg",
                    "casa-en-fraccionamiento-canadas/images/foto-15.jpg"
                ]
            };

            // VENTA: Casa en Fraccionamiento Los Angeles
            const casa_en_fraccionamiento_los_angelesProperty = {
                address: "Coto Trentino, Benevento Residencial al 4800, Culiacán, Sinaloa, Mexico, Fraccionamiento Los Angeles",
                priceShort: "$2.7M",
                priceFull: "$2,700,000",
                title: "Casa en Fraccionamiento Los Angeles",
                location: "Los Angeles, Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "96m²",
                type: "venta",
                url: "https://casasenventa.info/culiacan/casa-en-fraccionamiento-los-angeles/",
                photos: [
                    "casa-en-fraccionamiento-los-angeles/images/foto-1.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-2.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-3.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-4.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-5.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-6.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-7.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-8.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-9.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-10.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-11.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-12.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-13.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-14.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-15.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-16.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-17.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-18.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-19.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-20.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-21.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-22.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-23.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-24.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-25.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-26.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-27.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-28.jpg",
                    "casa-en-fraccionamiento-los-angeles/images/foto-29.jpg"
                ]
            };

            // RENTA: Casa en Renta en Valle Alto A2
            const casa_en_renta_en_valle_alto_a2Property = {
                address: "Casa en Renta en Valle Alto A2, Culiacán, Sinaloa, Mexico, Fraccionamiento Valle Alto",
                priceShort: "$11K",
                priceFull: "$10,500/mes",
                title: "Casa en Renta en Valle Alto A2",
                location: "Valle Alto A2, Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "105m²",
                type: "renta",
                url: "https://casasenventa.info/culiacan/casa-en-renta-en-valle-alto-a2/",
                photos: [
                    "casa-en-renta-en-valle-alto-a2/images/foto-1.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-2.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-3.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-4.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-5.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-6.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-7.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-8.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-9.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-10.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-11.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-12.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-13.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-14.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-15.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-16.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-17.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-18.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-19.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-20.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-21.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-22.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-23.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-24.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-25.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-26.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-27.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-28.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-29.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-30.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-31.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-32.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-33.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-34.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-35.jpg",
                    "casa-en-renta-en-valle-alto-a2/images/foto-36.jpg"
                ]
            };

            // RENTA: Casa Riberas de Tamazula
            const riberasTamazulaProperty = {
                address: "Riberas de Tamazula, Culiacán, Sinaloa, Mexico",
                priceShort: "$13K",
                priceFull: "$12,500/mes",
                title: "Casa Amueblada en Renta en Riberas de Tamazula",
                location: "Riberas de Tamazula, Culiacán",
                bedrooms: 2,
                bathrooms: 2,
                area: "N/D",
                type: "renta",
                url: "https://casasenventa.info/culiacan/casa-amueblada-en-renta-en-riberas-de-tamazula/",
                photos: [
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-1.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-2.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-3.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-4.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-5.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-6.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-7.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-8.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-9.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-10.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-11.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-12.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-13.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-14.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-15.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-16.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-17.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-18.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-19.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-20.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-21.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-22.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-23.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-24.jpg",
                    "casa-amueblada-en-renta-en-riberas-de-tamazula/images/foto-25.jpg"
                ]
            };

            // RENTA: Casa Bosques del Río
            const bosquesDelRioProperty = {
                address: "BLVD. UNIVERSO 17, Bosques del Rey, Culiacán, Sinaloa",
                priceShort: "$11K",
                priceFull: "$11,000/mes",
                title: "Renta de Casa en Privada Bosques del Rio",
                location: "Bosques del Rey, Culiacán",
                bedrooms: 3,
                bathrooms: 1,
                area: "170m²",
                type: "renta",
                url: "https://casasenventa.info/culiacan/renta-de-casa-en-privada-bosques-del-rio/",
                photos: [
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-1.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-2.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-3.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-4.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-5.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-6.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-7.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-8.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-9.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-10.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-11.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-12.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-13.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-14.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-15.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-16.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-17.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-18.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-19.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-20.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-21.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-22.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-23.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-24.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-25.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-26.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-27.jpg",
                    "renta-de-casa-en-privada-bosques-del-rio/images/foto-28.jpg"
                ]
            };

            // RENTA: Casa Valle Alto Kentia
            const casa_en_renta_en_privada_kentia_valle_altoProperty = {
                address: "Privada Kentia, Culiacán, Sinaloa, Mexico",
                priceShort: "$13K",
                priceFull: "$12,500/mes",
                title: "Casa en Renta en Privada Kentia Valle Alto",
                location: "Valle Alto, Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "120m²",
                type: "renta",
                url: "https://casasenventa.info/culiacan/casa-en-renta-en-privada-kentia-valle-alto/",
                photos: [
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-1.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-2.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-3.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-4.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-5.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-6.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-7.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-8.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-9.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-10.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-11.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-12.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-13.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-14.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-15.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-16.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-17.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-18.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-19.jpg",
                    "casa-en-renta-en-privada-kentia-valle-alto/images/foto-20.jpg"
                ]
            };

            // ===== LOTE 1 TEST - Propiedades antiguas RENTA =====

            // RENTA: Casa Pontevedra
            const pontevedraProperty = {
                address: "La Isla Privada Pontevedra, Culiacán, Sinaloa",
                priceShort: "$19K",
                priceFull: "$19,000/mes",
                title: "Casa en Renta Privada Pontevedra",
                location: "La Isla, Culiacán",
                bedrooms: 3,
                bathrooms: 2,
                area: "280m²",
                type: "renta",
                url: "https://casasenventa.info/culiacan/renta-casa-en-la-isla-privada-pontevedra/",
                photos: [
                    "renta-casa-en-la-isla-privada-pontevedra/images/foto-1.jpg",
                    "renta-casa-en-la-isla-privada-pontevedra/images/foto-2.jpg",
                    "renta-casa-en-la-isla-privada-pontevedra/images/foto-3.jpg",
                    "renta-casa-en-la-isla-privada-pontevedra/images/foto-4.jpg",
                    "renta-casa-en-la-isla-privada-pontevedra/images/foto-5.jpg"
                ]
            };

            // RENTA: Casa Privanzas Natura
            const privanzasNaturaProperty = {
                address: "Privanzas Natura, Culiacán, Sinaloa",
                priceShort: "$27K",
                priceFull: "$27,000/mes",
                title: "Casa Amplia Privanzas Natura",
                location: "Privanzas Natura, Culiacán",
                bedrooms: 4,
                bathrooms: 4.5,
                area: "N/D",
                type: "renta",
                url: "https://casasenventa.info/casa-renta-privanzas-natura.html",
                photos: [
                    "../images/casa-renta-privanzas-natura/cover.jpg",
                    "../images/casa-renta-privanzas-natura/00f0d925-8959-11f0-a51d-e9c6bf00a08e.jpeg",
                    "../images/casa-renta-privanzas-natura/00f123c6-8959-11f0-ba94-e9c6bf00a08e.jpeg",
                    "../images/casa-renta-privanzas-natura/1f9c9fb7-8958-11f0-9a54-e9c6bf00a08e.jpeg",
                    "../images/casa-renta-privanzas-natura/3a99f6f7-8958-11f0-9d7e-e9c6bf00a08e.jpeg",
                    "../images/casa-renta-privanzas-natura/4fe9fb63-8958-11f0-b16d-e9c6bf00a08e.jpeg",
                    "../images/casa-renta-privanzas-natura/637c8a03-8958-11f0-a7c7-e9c6bf00a08e.jpeg",
                    "../images/casa-renta-privanzas-natura/7c8f3f91-8958-11f0-8ec2-e9c6bf00a08e.jpeg"
                ]
            };

            // RENTA: Casa Santa Lourdes
            const santaLourdesProperty = {
                address: "Country del Rio, Culiacán, Sinaloa",
                priceShort: "$7.5K",
                priceFull: "$7,500/mes",
                title: "Casa Renta Santa Lourdes",
                location: "Country del Rio, Culiacán",
                bedrooms: 2,
                bathrooms: 1.5,
                area: "N/D",
                type: "renta",
                url: "https://casasenventa.info/casa-renta-santa-lourdes.html",
                photos: [
                    "../images/casa-renta-santa-lourdes/cover.jpg",
                    "../images/casa-renta-santa-lourdes/1a35be01-8dbb-11f0-816c-813b6b24b2ff.jpg",
                    "../images/casa-renta-santa-lourdes/1a35c6ca-8dbb-11f0-9611-813b6b24b2ff.jpg",
                    "../images/casa-renta-santa-lourdes/1a35d473-8dbb-11f0-a346-813b6b24b2ff.jpg",
                    "../images/casa-renta-santa-lourdes/1a3758b6-8dbb-11f0-b9cb-813b6b24b2ff.jpg",
                    "../images/casa-renta-santa-lourdes/f1191fef-8dba-11f0-9a82-813b6b24b2ff.jpg"
                ]
            };

// ===== LOTE 2 - Propiedades antiguas RENTA =====

// RENTA: Casa Lomas del Pedregal
const lomasDelPedregalProperty = {
    address: "Lomas del Pedregal, Culiacán, Sinaloa",
    priceShort: "$10K",
    priceFull: "$10,000/mes",
    title: "Casa en Renta Colonia Lomas del Pedregal",
    location: "Lomas del Pedregal, Culiacán",
    bedrooms: 3,
    bathrooms: 3,
    area: "N/D",
    type: "renta",
    url: "https://casasenventa.info/culiacan/casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/",
    photos: [
        "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-1.jpg",
        "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-2.jpg",
        "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-3.jpg",
        "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-4.jpg",
        "casa-en-renta-colonia-lomas-del-pedregal-culiacan-sinaloa/images/foto-5.jpg"
    ]
};

// RENTA: Casa La Campiña
const laCampinaProperty = {
    address: "La Campiña, Culiacán, Sinaloa",
    priceShort: "$13K",
    priceFull: "$13,000/mes",
    title: "Casa en Renta La Campiña cerca Forum",
    location: "Fraccionamiento La Campiña, Culiacán, Sinaloa",
    bedrooms: 3,
    bathrooms: 2,
    area: "N/D",
    type: "renta",
    url: "https://casasenventa.info/casa-renta-la-campiña-cerca-forum.html",
    photos: [
        "../images/casa-renta-la-campiña-cerca-forum/la-campina-culiacan-sinaloa-30318972-foto-01.jpeg",
        "../images/casa-renta-la-campiña-cerca-forum/la-campina-culiacan-sinaloa-30318972-foto-02.jpeg",
        "../images/casa-renta-la-campiña-cerca-forum/la-campina-culiacan-sinaloa-30318972-foto-03.jpeg",
        "../images/casa-renta-la-campiña-cerca-forum/la-campina-culiacan-sinaloa-30318972-foto-04.jpeg",
        "../images/casa-renta-la-campiña-cerca-forum/la-campina-culiacan-sinaloa-30318972-foto-05.jpeg",
        "../images/casa-renta-la-campiña-cerca-forum/la-campina-culiacan-sinaloa-30318972-foto-06.jpeg",
        "../images/casa-renta-la-campiña-cerca-forum/la-campina-culiacan-sinaloa-30318972-foto-07.jpeg",
        "../images/casa-renta-la-campiña-cerca-forum/la-campina-culiacan-sinaloa-30318972-foto-08.jpeg",
        "../images/casa-renta-la-campiña-cerca-forum/la-campina-culiacan-sinaloa-30318972-foto-09.jpeg"
    ]
};

// RENTA: Casa Privada Americana Perisur
const privadaAmericanaPerisurProperty = {
    address: "Privada Americana, Perisur, Culiacán, Sinaloa",
    priceShort: "$11K",
    priceFull: "$11,000/mes",
    title: "Casa en Renta Privada Americana Perisur",
    location: "Perisur, Culiacán",
    bedrooms: 3,
    bathrooms: 3,
    area: "120m²",
    type: "renta",
    url: "https://casasenventa.info/casa-renta-privada-americana-perisur.html",
    photos: [
        "../images/casa-renta-privada-americana-perisur/americano---la-primavera-culiacan-sinaloa-29975779-foto-32abf906-8729-4f13-90c6-eba6ecf38c55.jpg",
        "../images/casa-renta-privada-americana-perisur/americano---la-primavera-culiacan-sinaloa-29975779-foto-4c011ea9-503b-4fbf-8453-994057161b08.jpg",
        "../images/casa-renta-privada-americana-perisur/americano---la-primavera-culiacan-sinaloa-29975779-foto-54c8e43f-0742-4b62-b3dc-113948fe8674.jpg",
        "../images/casa-renta-privada-americana-perisur/americano---la-primavera-culiacan-sinaloa-29975779-foto-55a87301-c0a1-465d-9a2a-4bb73c8697aa.jpg",
        "../images/casa-renta-privada-americana-perisur/americano---la-primavera-culiacan-sinaloa-29975779-foto-5a76c382-f07d-4a14-83b1-99d2e892d34e.jpg",
        "../images/casa-renta-privada-americana-perisur/americano---la-primavera-culiacan-sinaloa-29975779-foto-5e8c6f51-60be-4530-bad6-4974ec65a98f.jpg",
        "../images/casa-renta-privada-americana-perisur/americano---la-primavera-culiacan-sinaloa-29975779-foto-63ba9e8f-40f9-4801-bf09-05c1aa5c0ade.jpg",
        "../images/casa-renta-privada-americana-perisur/americano---la-primavera-culiacan-sinaloa-29975779-foto-79ead2ed-da91-4dc3-a59e-fa0ad32ce738.jpg",
        "../images/casa-renta-privada-americana-perisur/americano---la-primavera-culiacan-sinaloa-29975779-foto-7ec4a4da-2ab0-462e-862e-ee14a4e94bb0.jpg",
        "../images/casa-renta-privada-americana-perisur/americano---la-primavera-culiacan-sinaloa-29975779-foto-a2ab8584-9f58-414f-9f8c-3c72c2d0e70f.jpg",
        "../images/casa-renta-privada-americana-perisur/americano---la-primavera-culiacan-sinaloa-29975779-foto-a863284f-ff21-4ee4-9b92-6fc2b4c02a89.jpg"
    ]
};

// ===== LOTE 3 - Propiedades antiguas RENTA =====

// RENTA: Casa Rincón Colonial #697816
const rinconColonial697816Property = {
    address: "Rincón Colonial, Culiacán, Sinaloa",
    priceShort: "$12.7K",
    priceFull: "$12,700/mes",
    title: "Casa en Renta Rincón Colonial",
    location: "Rincón Colonial, Culiacán",
    bedrooms: 2,
    bathrooms: 2,
    area: "185m²",
    type: "renta",
    url: "https://casasenventa.info/casa-renta-rincon-colonial-697816.html",
    photos: [
        "../images/casa-renta-rincon-colonial-697816/foto-1.jpg",
        "../images/casa-renta-rincon-colonial-697816/foto-2.jpg",
        "../images/casa-renta-rincon-colonial-697816/foto-3.jpg",
        "../images/casa-renta-rincon-colonial-697816/foto-4.jpg",
        "../images/casa-renta-rincon-colonial-697816/foto-5.jpg",
        "../images/casa-renta-rincon-colonial-697816/foto-6.jpg",
        "../images/casa-renta-rincon-colonial-697816/foto-7.jpg",
        "../images/casa-renta-rincon-colonial-697816/foto-8.jpg",
        "../images/casa-renta-rincon-colonial-697816/foto-9.jpg",
        "../images/casa-renta-rincon-colonial-697816/foto-10.jpg",
        "../images/casa-renta-rincon-colonial-697816/foto-11.jpg",
        "../images/casa-renta-rincon-colonial-697816/foto-12.jpg"
    ]
};

// RENTA: Casa Colina del Rey
const colinaDelReyProperty = {
    address: "Colina del Rey, Culiacán, Sinaloa",
    priceShort: "$12.5K",
    priceFull: "$12,500/mes",
    title: "Casa en Renta Colina del Rey",
    location: "Colina del Rey, Culiacán",
    bedrooms: 2,
    bathrooms: 2,
    area: "212m²",
    type: "renta",
    url: "https://casasenventa.info/casa-renta-colina-del-rey-718158.html",
    photos: [
        "../images/casa-renta-colina-del-rey-718158/foto-1.jpg",
        "../images/casa-renta-colina-del-rey-718158/foto-2.jpg",
        "../images/casa-renta-colina-del-rey-718158/foto-3.jpg",
        "../images/casa-renta-colina-del-rey-718158/foto-4.jpg",
        "../images/casa-renta-colina-del-rey-718158/foto-5.jpg"
    ]
};

// RENTA: Casa Rincón Colonial #295459
const rinconColonial295459Property = {
    address: "Rincón Colonial, Culiacán, Sinaloa",
    priceShort: "$12.7K",
    priceFull: "$12,700/mes",
    title: "Casa en Renta Rincón Colonial",
    location: "Rincón Colonial, Culiacán",
    bedrooms: 2,
    bathrooms: 2,
    area: "185m²",
    type: "renta",
    url: "https://casasenventa.info/casa-renta-rincon-colonial-295459.html",
    photos: [
        "../images/casa-renta-rincon-colonial-295459/foto-1.jpg",
        "../images/casa-renta-rincon-colonial-295459/foto-2.jpg",
        "../images/casa-renta-rincon-colonial-295459/foto-3.jpg",
        "../images/casa-renta-rincon-colonial-295459/foto-4.jpg",
        "../images/casa-renta-rincon-colonial-295459/foto-5.jpg",
        "../images/casa-renta-rincon-colonial-295459/foto-6.jpg",
        "../images/casa-renta-rincon-colonial-295459/foto-7.jpg",
        "../images/casa-renta-rincon-colonial-295459/foto-8.jpg",
        "../images/casa-renta-rincon-colonial-295459/foto-9.jpg",
        "../images/casa-renta-rincon-colonial-295459/foto-10.jpg",
        "../images/casa-renta-rincon-colonial-295459/foto-11.jpg",
        "../images/casa-renta-rincon-colonial-295459/foto-12.jpg"
    ]
};

// ===== LOTE 4 - Propiedades antiguas RENTA (saltando belcantto duplicado) =====

// RENTA: Casa Centenario
const centenarioProperty = {
    address: "Centenario, Culiacán, Sinaloa",
    priceShort: "$18K",
    priceFull: "$18,000/mes",
    title: "Casa en Renta Colonia Centenario",
    location: "Centenario, Culiacán",
    bedrooms: 3,
    bathrooms: 2.5,
    area: "183m²",
    type: "renta",
    url: "https://casasenventa.info/casa-renta-centenario.html",
    photos: [
        "../images/centenario/avenida-astral-4731-4731-centenario-culiacan-sinaloa-30312866-foto-01.jpeg",
        "../images/centenario/avenida-astral-4731-4731-centenario-culiacan-sinaloa-30312866-foto-02 (1).jpeg",
        "../images/centenario/avenida-astral-4731-4731-centenario-culiacan-sinaloa-30312866-foto-02.jpeg",
        "../images/centenario/avenida-astral-4731-4731-centenario-culiacan-sinaloa-30312866-foto-04.jpeg",
        "../images/centenario/avenida-astral-4731-4731-centenario-culiacan-sinaloa-30312866-foto-05 (1).jpeg",
        "../images/centenario/avenida-astral-4731-4731-centenario-culiacan-sinaloa-30312866-foto-05.jpeg",
        "../images/centenario/avenida-astral-4731-4731-centenario-culiacan-sinaloa-30312866-foto-13.jpeg",
        "../images/centenario/avenida-astral-4731-4731-centenario-culiacan-sinaloa-30312866-foto-14.jpeg"
    ]
};

// RENTA: Casa Portareal Camino Real
const portarealCaminoRealProperty = {
    address: "Portareal, Camino del Real, Culiacán, Sinaloa",
    priceShort: "$12K",
    priceFull: "$12,000/mes",
    title: "Casa Remodelada Portareal",
    location: "Portareal, Camino del Real, Culiacán",
    bedrooms: 3,
    bathrooms: 2.5,
    area: "183m²",
    type: "renta",
    url: "https://casasenventa.info/casa-renta-portareal-camino-real.html",
    photos: [
        "../images/portareal-camino-real/calle-santo-domingo-fraccionamiento-camino-real-camino-real-culiacan-sinaloa-30100549-foto-01.jpg",
        "../images/portareal-camino-real/calle-santo-domingo-fraccionamiento-camino-real-camino-real-culiacan-sinaloa-30100549-foto-02.jpg",
        "../images/portareal-camino-real/calle-santo-domingo-fraccionamiento-camino-real-camino-real-culiacan-sinaloa-30100549-foto-03.jpg",
        "../images/portareal-camino-real/calle-santo-domingo-fraccionamiento-camino-real-camino-real-culiacan-sinaloa-30100549-foto-04.jpg",
        "../images/portareal-camino-real/calle-santo-domingo-fraccionamiento-camino-real-camino-real-culiacan-sinaloa-30100549-foto-05.jpg",
        "../images/portareal-camino-real/calle-santo-domingo-fraccionamiento-camino-real-camino-real-culiacan-sinaloa-30100549-foto-06.jpg",
        "../images/portareal-camino-real/calle-santo-domingo-fraccionamiento-camino-real-camino-real-culiacan-sinaloa-30100549-foto-07.jpg",
        "../images/portareal-camino-real/calle-santo-domingo-fraccionamiento-camino-real-camino-real-culiacan-sinaloa-30100549-foto-08.jpg",
        "../images/portareal-camino-real/calle-santo-domingo-fraccionamiento-camino-real-camino-real-culiacan-sinaloa-30100549-foto-09.jpg",
        "../images/portareal-camino-real/calle-santo-domingo-fraccionamiento-camino-real-camino-real-culiacan-sinaloa-30100549-foto-10.jpg",
        "../images/portareal-camino-real/calle-santo-domingo-fraccionamiento-camino-real-camino-real-culiacan-sinaloa-30100549-foto-11.jpg"
    ]
};

// ===== LOTE 5 - Propiedades antiguas RENTA =====

// RENTA: Casa Fracc Terracota
const terracotaProperty = {
    address: "Fraccionamiento Terracota, Culiacán, Sinaloa",
    priceShort: "$16K",
    priceFull: "$16,000/mes",
    title: "Casa en Renta Fracc Terracota",
    location: "Fraccionamiento Terracota, Culiacán",
    bedrooms: 2,
    bathrooms: 2,
    area: "160m²",
    type: "renta",
    url: "https://casasenventa.info/casa-renta-fracc-terracota.html",
    photos: [
        "../images/fracc-terracota/17f5aeaf-8965-11f0-8627-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/1a2386ce-8965-11f0-a80a-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/1e010a47-8965-11f0-93d8-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/214a175b-8965-11f0-a286-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/26729f3e-8965-11f0-a34f-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/2bf3185c-8965-11f0-b370-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/3461f6dd-8965-11f0-9843-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/372899d2-8965-11f0-b670-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/3b4eb4dc-8965-11f0-821a-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/3fd23c79-8965-11f0-af13-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/4412dde1-8965-11f0-a48d-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/489c2002-8965-11f0-a7e8-e9c6bf00a08e.jpeg",
        "../images/fracc-terracota/569af4a9-8965-11f0-bb91-e9c6bf00a08e.jpeg"
    ]
};

// RENTA: Casa Villa Andalucía
const villaAndaluciaProperty = {
    address: "Villa Andalucía, Culiacán, Sinaloa",
    priceShort: "$12.5K",
    priceFull: "$12,500/mes",
    title: "Casa en Renta Villa Andalucía",
    location: "Villa Andalucía, Culiacán",
    bedrooms: 3,
    bathrooms: 2.5,
    area: "N/D",
    type: "renta",
    url: "https://casasenventa.info/casa-renta-villa-andalucia-test.html",
    photos: [
        "../images/villa-andalucia-test/villa-andalucia-culiacan-sinaloa-30097322-foto-01.jpg",
        "../images/villa-andalucia-test/villa-andalucia-culiacan-sinaloa-30097322-foto-02.jpg",
        "../images/villa-andalucia-test/villa-andalucia-culiacan-sinaloa-30097322-foto-03.jpg",
        "../images/villa-andalucia-test/villa-andalucia-culiacan-sinaloa-30097322-foto-04.jpg",
        "../images/villa-andalucia-test/villa-andalucia-culiacan-sinaloa-30097322-foto-05.jpg",
        "../images/villa-andalucia-test/villa-andalucia-culiacan-sinaloa-30097322-foto-06.jpg",
        "../images/villa-andalucia-test/villa-andalucia-culiacan-sinaloa-30097322-foto-07.jpg",
        "../images/villa-andalucia-test/villa-andalucia-culiacan-sinaloa-30097322-foto-08.jpg"
    ]
};

// RENTA: Casa Los Pinos
const losPinosProperty = {
    address: "Los Pinos, Culiacán, Sinaloa",
    priceShort: "$21.5K",
    priceFull: "$21,500/mes",
    title: "Casa en Renta Los Pinos",
    location: "Los Pinos, Culiacán",
    bedrooms: 3,
    bathrooms: 2.5,
    area: "N/D",
    type: "renta",
    url: "https://casasenventa.info/casa-renta-los-pinos.html",
    photos: [
        "../images/los-pinos/cover.jpg",
        "../images/los-pinos/rio-nazas-1249-los-pinos-culiacan-sinaloa-30221373-foto-02.jpg",
        "../images/los-pinos/rio-nazas-1249-los-pinos-culiacan-sinaloa-30221373-foto-03.jpg",
        "../images/los-pinos/rio-nazas-1249-los-pinos-culiacan-sinaloa-30221373-foto-04.jpg",
        "../images/los-pinos/rio-nazas-1249-los-pinos-culiacan-sinaloa-30221373-foto-05.jpg",
        "../images/los-pinos/rio-nazas-1249-los-pinos-culiacan-sinaloa-30221373-foto-06.jpg",
        "../images/los-pinos/rio-nazas-1249-los-pinos-culiacan-sinaloa-30221373-foto-07.jpg",
        "../images/los-pinos/rio-nazas-1249-los-pinos-culiacan-sinaloa-30221373-foto-08.jpg",
        "../images/los-pinos/rio-nazas-1249-los-pinos-culiacan-sinaloa-30221373-foto-09.jpg",
        "../images/los-pinos/rio-nazas-1249-los-pinos-culiacan-sinaloa-30221373-foto-10.jpg",
        "../images/los-pinos/rio-nazas-1249-los-pinos-culiacan-sinaloa-30221373-foto-11.jpg"
    ]
};

// Casa 113 m² con 3 Recámaras en Venta, Fraccionamiento Isla Residencial - Coordenadas finales (geocoder)
            const casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resMarkerClass = createZillowPropertyMarker(casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resProperty, window.mapCuliacan);
            const casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resMarker = new casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resMarkerClass(casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resPosition, window.mapCuliacan, casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resProperty);
            window.allCuliacanMarkers.push(casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resMarker);
            console.log('Marcador Casa 113 m² con 3 Recámaras en Venta, Fraccionamiento Isla Residencial (VENTA) creado en:', casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resPosition.lat(), casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resPosition.lng());

            // Casa en Venta Privada Valles Españoles - Coordenadas finales (geocoder)
            const casa_en_venta_privada_valles_espanolesPosition = new google.maps.LatLng(24.7607794, -107.451648);
            const casa_en_venta_privada_valles_espanolesMarkerClass = createZillowPropertyMarker(casa_en_venta_privada_valles_espanolesProperty, window.mapCuliacan);
            const casa_en_venta_privada_valles_espanolesMarker = new casa_en_venta_privada_valles_espanolesMarkerClass(casa_en_venta_privada_valles_espanolesPosition, window.mapCuliacan, casa_en_venta_privada_valles_espanolesProperty);
            window.allCuliacanMarkers.push(casa_en_venta_privada_valles_espanolesMarker);
            console.log('Marcador Casa en Venta Privada Valles Españoles (VENTA) creado en:', casa_en_venta_privada_valles_espanolesPosition.lat(), casa_en_venta_privada_valles_espanolesPosition.lng());

            // Casa en Venta Residencial Amorada - Coordenadas finales (geocoder)
            const casa_en_venta_residencial_amoradaPosition = new google.maps.LatLng(24.835067, -107.3686679);
            const casa_en_venta_residencial_amoradaMarkerClass = createZillowPropertyMarker(casa_en_venta_residencial_amoradaProperty, window.mapCuliacan);
            const casa_en_venta_residencial_amoradaMarker = new casa_en_venta_residencial_amoradaMarkerClass(casa_en_venta_residencial_amoradaPosition, window.mapCuliacan, casa_en_venta_residencial_amoradaProperty);
            window.allCuliacanMarkers.push(casa_en_venta_residencial_amoradaMarker);
            console.log('Marcador Casa en Venta Residencial Amorada (VENTA) creado en:', casa_en_venta_residencial_amoradaPosition.lat(), casa_en_venta_residencial_amoradaPosition.lng());

            // Casa en Venta - Coordenadas finales (geocoder)
            const casa_en_ventaPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const casa_en_ventaMarkerClass = createZillowPropertyMarker(casa_en_ventaProperty, window.mapCuliacan);
            const casa_en_ventaMarker = new casa_en_ventaMarkerClass(casa_en_ventaPosition, window.mapCuliacan, casa_en_ventaProperty);
            window.allCuliacanMarkers.push(casa_en_ventaMarker);
            console.log('Marcador Casa en Venta (VENTA) creado en:', casa_en_ventaPosition.lat(), casa_en_ventaPosition.lng());

            // Se Vende o Se Renta Casa en Fraccionamiento Guadalupe Victoria - Coordenadas finales (geocoder)
            const se_vende_o_se_renta_casa_en_fraccionamiento_guadalupe_victorPosition = new google.maps.LatLng(24.7894786, -107.3960109);
            const se_vende_o_se_renta_casa_en_fraccionamiento_guadalupe_victorMarkerClass = createZillowPropertyMarker(se_vende_o_se_renta_casa_en_fraccionamiento_guadalupe_victorProperty, window.mapCuliacan);
            const se_vende_o_se_renta_casa_en_fraccionamiento_guadalupe_victorMarker = new se_vende_o_se_renta_casa_en_fraccionamiento_guadalupe_victorMarkerClass(se_vende_o_se_renta_casa_en_fraccionamiento_guadalupe_victorPosition, window.mapCuliacan, se_vende_o_se_renta_casa_en_fraccionamiento_guadalupe_victorProperty);
            window.allCuliacanMarkers.push(se_vende_o_se_renta_casa_en_fraccionamiento_guadalupe_victorMarker);
            console.log('Marcador Se Vende o Se Renta Casa en Fraccionamiento Guadalupe Victoria (RENTA) creado en:', se_vende_o_se_renta_casa_en_fraccionamiento_guadalupe_victorPosition.lat(), se_vende_o_se_renta_casa_en_fraccionamiento_guadalupe_victorPosition.lng());

            // Casa - Fraccionamiento Espacios Barcelona - Coordenadas finales (geocoder)
            const casa_fraccionamiento_espacios_barcelonaPosition = new google.maps.LatLng(24.8328334, -107.4324691);
            const casa_fraccionamiento_espacios_barcelonaMarkerClass = createZillowPropertyMarker(casa_fraccionamiento_espacios_barcelonaProperty, window.mapCuliacan);
            const casa_fraccionamiento_espacios_barcelonaMarker = new casa_fraccionamiento_espacios_barcelonaMarkerClass(casa_fraccionamiento_espacios_barcelonaPosition, window.mapCuliacan, casa_fraccionamiento_espacios_barcelonaProperty);
            window.allCuliacanMarkers.push(casa_fraccionamiento_espacios_barcelonaMarker);
            console.log('Marcador Casa - Fraccionamiento Espacios Barcelona (VENTA) creado en:', casa_fraccionamiento_espacios_barcelonaPosition.lat(), casa_fraccionamiento_espacios_barcelonaPosition.lng());

            // Casa en Venta en Colonia Chapultepec Culiacán - Coordenadas finales (geocoder)
            const casa_en_venta_en_colonia_chapultepec_culiacanPosition = new google.maps.LatLng(24.8171307, -107.3893183);
            const casa_en_venta_en_colonia_chapultepec_culiacanMarkerClass = createZillowPropertyMarker(casa_en_venta_en_colonia_chapultepec_culiacanProperty, window.mapCuliacan);
            const casa_en_venta_en_colonia_chapultepec_culiacanMarker = new casa_en_venta_en_colonia_chapultepec_culiacanMarkerClass(casa_en_venta_en_colonia_chapultepec_culiacanPosition, window.mapCuliacan, casa_en_venta_en_colonia_chapultepec_culiacanProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_colonia_chapultepec_culiacanMarker);
            console.log('Marcador Casa en Venta en Colonia Chapultepec Culiacán (VENTA) creado en:', casa_en_venta_en_colonia_chapultepec_culiacanPosition.lat(), casa_en_venta_en_colonia_chapultepec_culiacanPosition.lng());

            // Casa en Venta en La Primavera San Juan - Coordenadas finales (geocoder)
            const casa_en_venta_en_la_primavera_san_juanPosition = new google.maps.LatLng(24.8091, -107.394);
            const casa_en_venta_en_la_primavera_san_juanMarkerClass = createZillowPropertyMarker(casa_en_venta_en_la_primavera_san_juanProperty, window.mapCuliacan);
            const casa_en_venta_en_la_primavera_san_juanMarker = new casa_en_venta_en_la_primavera_san_juanMarkerClass(casa_en_venta_en_la_primavera_san_juanPosition, window.mapCuliacan, casa_en_venta_en_la_primavera_san_juanProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_la_primavera_san_juanMarker);
            console.log('Marcador Casa en Venta en La Primavera San Juan (VENTA) creado en:', casa_en_venta_en_la_primavera_san_juanPosition.lat(), casa_en_venta_en_la_primavera_san_juanPosition.lng());

            // Casa en Venta, La Cantera, Culiacan - Coordenadas finales (geocoder)
            const casa_en_venta_la_cantera_culiacanPosition = new google.maps.LatLng(24.8000572, -107.4349268);
            const casa_en_venta_la_cantera_culiacanMarkerClass = createZillowPropertyMarker(casa_en_venta_la_cantera_culiacanProperty, window.mapCuliacan);
            const casa_en_venta_la_cantera_culiacanMarker = new casa_en_venta_la_cantera_culiacanMarkerClass(casa_en_venta_la_cantera_culiacanPosition, window.mapCuliacan, casa_en_venta_la_cantera_culiacanProperty);
            window.allCuliacanMarkers.push(casa_en_venta_la_cantera_culiacanMarker);
            console.log('Marcador Casa en Venta, La Cantera, Culiacan (VENTA) creado en:', casa_en_venta_la_cantera_culiacanPosition.lat(), casa_en_venta_la_cantera_culiacanPosition.lng());

            // Casa en Venta Culiacancito Culiacan Sinaloa - Coordenadas finales (geocoder)
            const casa_en_venta_culiacancito_culiacan_sinaloaPosition = new google.maps.LatLng(24.7957618, -107.385929);
            const casa_en_venta_culiacancito_culiacan_sinaloaMarkerClass = createZillowPropertyMarker(casa_en_venta_culiacancito_culiacan_sinaloaProperty, window.mapCuliacan);
            const casa_en_venta_culiacancito_culiacan_sinaloaMarker = new casa_en_venta_culiacancito_culiacan_sinaloaMarkerClass(casa_en_venta_culiacancito_culiacan_sinaloaPosition, window.mapCuliacan, casa_en_venta_culiacancito_culiacan_sinaloaProperty);
            window.allCuliacanMarkers.push(casa_en_venta_culiacancito_culiacan_sinaloaMarker);
            console.log('Marcador Casa en Venta Culiacancito Culiacan Sinaloa (VENTA) creado en:', casa_en_venta_culiacancito_culiacan_sinaloaPosition.lat(), casa_en_venta_culiacancito_culiacan_sinaloaPosition.lng());

            // Venta de Casa por Calle Mariano Escobedo Centro de La Ciudad - Coordenadas finales (geocoder)
            const venta_de_casa_por_calle_mariano_escobedo_centro_de_la_ciudadPosition = new google.maps.LatLng(24.805, -107.394);
            const venta_de_casa_por_calle_mariano_escobedo_centro_de_la_ciudadMarkerClass = createZillowPropertyMarker(venta_de_casa_por_calle_mariano_escobedo_centro_de_la_ciudadProperty, window.mapCuliacan);
            const venta_de_casa_por_calle_mariano_escobedo_centro_de_la_ciudadMarker = new venta_de_casa_por_calle_mariano_escobedo_centro_de_la_ciudadMarkerClass(venta_de_casa_por_calle_mariano_escobedo_centro_de_la_ciudadPosition, window.mapCuliacan, venta_de_casa_por_calle_mariano_escobedo_centro_de_la_ciudadProperty);
            window.allCuliacanMarkers.push(venta_de_casa_por_calle_mariano_escobedo_centro_de_la_ciudadMarker);
            console.log('Marcador Venta de Casa por Calle Mariano Escobedo Centro de La Ciudad (VENTA) creado en:', venta_de_casa_por_calle_mariano_escobedo_centro_de_la_ciudadPosition.lat(), venta_de_casa_por_calle_mariano_escobedo_centro_de_la_ciudadPosition.lng());

            // Casa en Venta Colonia Morelos Culiacan Sinaloa - Coordenadas finales (geocoder)
            const casa_en_venta_colonia_morelos_culiacan_sinaloaPosition = new google.maps.LatLng(24.81713070957, -107.4093825);
            const casa_en_venta_colonia_morelos_culiacan_sinaloaMarkerClass = createZillowPropertyMarker(casa_en_venta_colonia_morelos_culiacan_sinaloaProperty, window.mapCuliacan);
            const casa_en_venta_colonia_morelos_culiacan_sinaloaMarker = new casa_en_venta_colonia_morelos_culiacan_sinaloaMarkerClass(casa_en_venta_colonia_morelos_culiacan_sinaloaPosition, window.mapCuliacan, casa_en_venta_colonia_morelos_culiacan_sinaloaProperty);
            window.allCuliacanMarkers.push(casa_en_venta_colonia_morelos_culiacan_sinaloaMarker);
            console.log('Marcador Casa en Venta Colonia Morelos Culiacan Sinaloa (VENTA) creado en:', casa_en_venta_colonia_morelos_culiacan_sinaloaPosition.lat(), casa_en_venta_colonia_morelos_culiacan_sinaloaPosition.lng());

            // Casa en Venta Culiacan, Nueva Tres Rios 4 Recamaras - Coordenadas finales (geocoder)
            const casa_en_venta_culiacan_nueva_tres_rios_4_recamarasPosition = new google.maps.LatLng(24.832711, -107.4013174);
            const casa_en_venta_culiacan_nueva_tres_rios_4_recamarasMarkerClass = createZillowPropertyMarker(casa_en_venta_culiacan_nueva_tres_rios_4_recamarasProperty, window.mapCuliacan);
            const casa_en_venta_culiacan_nueva_tres_rios_4_recamarasMarker = new casa_en_venta_culiacan_nueva_tres_rios_4_recamarasMarkerClass(casa_en_venta_culiacan_nueva_tres_rios_4_recamarasPosition, window.mapCuliacan, casa_en_venta_culiacan_nueva_tres_rios_4_recamarasProperty);
            window.allCuliacanMarkers.push(casa_en_venta_culiacan_nueva_tres_rios_4_recamarasMarker);
            console.log('Marcador Casa en Venta Culiacan, Nueva Tres Rios 4 Recamaras (VENTA) creado en:', casa_en_venta_culiacan_nueva_tres_rios_4_recamarasPosition.lat(), casa_en_venta_culiacan_nueva_tres_rios_4_recamarasPosition.lng());

            // Casa en Interlomas - Coordenadas finales (geocoder)
            const casa_en_interlomasPosition = new google.maps.LatLng(24.8116349, -107.3949408);
            const casa_en_interlomasMarkerClass = createZillowPropertyMarker(casa_en_interlomasProperty, window.mapCuliacan);
            const casa_en_interlomasMarker = new casa_en_interlomasMarkerClass(casa_en_interlomasPosition, window.mapCuliacan, casa_en_interlomasProperty);
            window.allCuliacanMarkers.push(casa_en_interlomasMarker);
            console.log('Marcador Casa en Interlomas (VENTA) creado en:', casa_en_interlomasPosition.lat(), casa_en_interlomasPosition.lng());

            // Casa en Fraccionamiento Villa Universidad - Coordenadas finales (geocoder)
            const casa_en_fraccionamiento_villa_universidadPosition = new google.maps.LatLng(24.8340803, -107.3856223);
            const casa_en_fraccionamiento_villa_universidadMarkerClass = createZillowPropertyMarker(casa_en_fraccionamiento_villa_universidadProperty, window.mapCuliacan);
            const casa_en_fraccionamiento_villa_universidadMarker = new casa_en_fraccionamiento_villa_universidadMarkerClass(casa_en_fraccionamiento_villa_universidadPosition, window.mapCuliacan, casa_en_fraccionamiento_villa_universidadProperty);
            window.allCuliacanMarkers.push(casa_en_fraccionamiento_villa_universidadMarker);
            console.log('Marcador Casa en Fraccionamiento Villa Universidad (VENTA) creado en:', casa_en_fraccionamiento_villa_universidadPosition.lat(), casa_en_fraccionamiento_villa_universidadPosition.lng());

            // Casa en Venta en El Fracc, Los Almendros, Culiacán, Sinaloa - Coordenadas finales (geocoder)
            const casa_en_venta_en_el_fracc_los_almendros_culiacan_sinaloaPosition = new google.maps.LatLng(24.8290037, -107.4187242);
            const casa_en_venta_en_el_fracc_los_almendros_culiacan_sinaloaMarkerClass = createZillowPropertyMarker(casa_en_venta_en_el_fracc_los_almendros_culiacan_sinaloaProperty, window.mapCuliacan);
            const casa_en_venta_en_el_fracc_los_almendros_culiacan_sinaloaMarker = new casa_en_venta_en_el_fracc_los_almendros_culiacan_sinaloaMarkerClass(casa_en_venta_en_el_fracc_los_almendros_culiacan_sinaloaPosition, window.mapCuliacan, casa_en_venta_en_el_fracc_los_almendros_culiacan_sinaloaProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_el_fracc_los_almendros_culiacan_sinaloaMarker);
            console.log('Marcador Casa en Venta en El Fracc, Los Almendros, Culiacán, Sinaloa (VENTA) creado en:', casa_en_venta_en_el_fracc_los_almendros_culiacan_sinaloaPosition.lat(), casa_en_venta_en_el_fracc_los_almendros_culiacan_sinaloaPosition.lng());

            // Casa en Venta Interlomas Culiacán - Coordenadas finales (geocoder)
            const casa_en_venta_interlomas_culiacanPosition = new google.maps.LatLng(24.8419343, -107.3839938);
            const casa_en_venta_interlomas_culiacanMarkerClass = createZillowPropertyMarker(casa_en_venta_interlomas_culiacanProperty, window.mapCuliacan);
            const casa_en_venta_interlomas_culiacanMarker = new casa_en_venta_interlomas_culiacanMarkerClass(casa_en_venta_interlomas_culiacanPosition, window.mapCuliacan, casa_en_venta_interlomas_culiacanProperty);
            window.allCuliacanMarkers.push(casa_en_venta_interlomas_culiacanMarker);
            console.log('Marcador Casa en Venta Interlomas Culiacán (VENTA) creado en:', casa_en_venta_interlomas_culiacanPosition.lat(), casa_en_venta_interlomas_culiacanPosition.lng());

            // Casa en Venta en Fraccionamiento Interlomas - Coordenadas finales (geocoder)
            const casa_en_venta_en_fraccionamiento_interlomasPosition = new google.maps.LatLng(24.8392706, -107.3819576);
            const casa_en_venta_en_fraccionamiento_interlomasMarkerClass = createZillowPropertyMarker(casa_en_venta_en_fraccionamiento_interlomasProperty, window.mapCuliacan);
            const casa_en_venta_en_fraccionamiento_interlomasMarker = new casa_en_venta_en_fraccionamiento_interlomasMarkerClass(casa_en_venta_en_fraccionamiento_interlomasPosition, window.mapCuliacan, casa_en_venta_en_fraccionamiento_interlomasProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_fraccionamiento_interlomasMarker);
            console.log('Marcador Casa en Venta en Fraccionamiento Interlomas (VENTA) creado en:', casa_en_venta_en_fraccionamiento_interlomasPosition.lat(), casa_en_venta_en_fraccionamiento_interlomasPosition.lng());

            // Casa en Los Pinos - Coordenadas finales (geocoder)
            const casa_en_los_pinosPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const casa_en_los_pinosMarkerClass = createZillowPropertyMarker(casa_en_los_pinosProperty, window.mapCuliacan);
            const casa_en_los_pinosMarker = new casa_en_los_pinosMarkerClass(casa_en_los_pinosPosition, window.mapCuliacan, casa_en_los_pinosProperty);
            window.allCuliacanMarkers.push(casa_en_los_pinosMarker);
            console.log('Marcador Casa en Los Pinos (VENTA) creado en:', casa_en_los_pinosPosition.lat(), casa_en_los_pinosPosition.lng());

            // Casa en Venta Colonia Tierra Blanca Culiacán - Coordenadas finales (geocoder)
            const casa_en_venta_colonia_tierra_blanca_culiacanPosition = new google.maps.LatLng(24.8301398, -107.3925899);
            const casa_en_venta_colonia_tierra_blanca_culiacanMarkerClass = createZillowPropertyMarker(casa_en_venta_colonia_tierra_blanca_culiacanProperty, window.mapCuliacan);
            const casa_en_venta_colonia_tierra_blanca_culiacanMarker = new casa_en_venta_colonia_tierra_blanca_culiacanMarkerClass(casa_en_venta_colonia_tierra_blanca_culiacanPosition, window.mapCuliacan, casa_en_venta_colonia_tierra_blanca_culiacanProperty);
            window.allCuliacanMarkers.push(casa_en_venta_colonia_tierra_blanca_culiacanMarker);
            console.log('Marcador Casa en Venta Colonia Tierra Blanca Culiacán (VENTA) creado en:', casa_en_venta_colonia_tierra_blanca_culiacanPosition.lat(), casa_en_venta_colonia_tierra_blanca_culiacanPosition.lng());

            // Casa - Fraccionamiento Infonavit Barrancos - Coordenadas finales (geocoder)
            const casa_fraccionamiento_infonavit_barrancosPosition = new google.maps.LatLng(24.7553976, -107.4314566);
            const casa_fraccionamiento_infonavit_barrancosMarkerClass = createZillowPropertyMarker(casa_fraccionamiento_infonavit_barrancosProperty, window.mapCuliacan);
            const casa_fraccionamiento_infonavit_barrancosMarker = new casa_fraccionamiento_infonavit_barrancosMarkerClass(casa_fraccionamiento_infonavit_barrancosPosition, window.mapCuliacan, casa_fraccionamiento_infonavit_barrancosProperty);
            window.allCuliacanMarkers.push(casa_fraccionamiento_infonavit_barrancosMarker);
            console.log('Marcador Casa - Fraccionamiento Infonavit Barrancos (VENTA) creado en:', casa_fraccionamiento_infonavit_barrancosPosition.lat(), casa_fraccionamiento_infonavit_barrancosPosition.lng());

            // Casa en Venta en Villa Universidad, Culiacán - Coordenadas finales (geocoder)
            const casa_en_venta_en_villa_universidad_culiacanPosition = new google.maps.LatLng(24.834804, -107.3854893);
            const casa_en_venta_en_villa_universidad_culiacanMarkerClass = createZillowPropertyMarker(casa_en_venta_en_villa_universidad_culiacanProperty, window.mapCuliacan);
            const casa_en_venta_en_villa_universidad_culiacanMarker = new casa_en_venta_en_villa_universidad_culiacanMarkerClass(casa_en_venta_en_villa_universidad_culiacanPosition, window.mapCuliacan, casa_en_venta_en_villa_universidad_culiacanProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_villa_universidad_culiacanMarker);
            console.log('Marcador Casa en Venta en Villa Universidad, Culiacán (VENTA) creado en:', casa_en_venta_en_villa_universidad_culiacanPosition.lat(), casa_en_venta_en_villa_universidad_culiacanPosition.lng());

            // Casa en Fraccionamiento Perisur - Coordenadas finales (geocoder)
            const casa_en_fraccionamiento_perisurPosition = new google.maps.LatLng(24.8116349, -107.3949408);
            const casa_en_fraccionamiento_perisurMarkerClass = createZillowPropertyMarker(casa_en_fraccionamiento_perisurProperty, window.mapCuliacan);
            const casa_en_fraccionamiento_perisurMarker = new casa_en_fraccionamiento_perisurMarkerClass(casa_en_fraccionamiento_perisurPosition, window.mapCuliacan, casa_en_fraccionamiento_perisurProperty);
            window.allCuliacanMarkers.push(casa_en_fraccionamiento_perisurMarker);
            console.log('Marcador Casa en Fraccionamiento Perisur (VENTA) creado en:', casa_en_fraccionamiento_perisurPosition.lat(), casa_en_fraccionamiento_perisurPosition.lng());

            // Casa en Venta en Priv. Valle Alto - Coordenadas finales (geocoder)
            const casa_en_venta_en_priv_valle_altoPosition = new google.maps.LatLng(24.8052781, -107.4625676);
            const casa_en_venta_en_priv_valle_altoMarkerClass = createZillowPropertyMarker(casa_en_venta_en_priv_valle_altoProperty, window.mapCuliacan);
            const casa_en_venta_en_priv_valle_altoMarker = new casa_en_venta_en_priv_valle_altoMarkerClass(casa_en_venta_en_priv_valle_altoPosition, window.mapCuliacan, casa_en_venta_en_priv_valle_altoProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_priv_valle_altoMarker);
            console.log('Marcador Casa en Venta en Priv. Valle Alto (VENTA) creado en:', casa_en_venta_en_priv_valle_altoPosition.lat(), casa_en_venta_en_priv_valle_altoPosition.lng());

            // Casa en Venta en Colonia Las Quintas - Coordenadas finales (geocoder)
            const casa_en_venta_en_colonia_las_quintasPosition = new google.maps.LatLng(24.793, -107.413);
            const casa_en_venta_en_colonia_las_quintasMarkerClass = createZillowPropertyMarker(casa_en_venta_en_colonia_las_quintasProperty, window.mapCuliacan);
            const casa_en_venta_en_colonia_las_quintasMarker = new casa_en_venta_en_colonia_las_quintasMarkerClass(casa_en_venta_en_colonia_las_quintasPosition, window.mapCuliacan, casa_en_venta_en_colonia_las_quintasProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_colonia_las_quintasMarker);
            console.log('Marcador Casa en Venta en Colonia Las Quintas (VENTA) creado en:', casa_en_venta_en_colonia_las_quintasPosition.lat(), casa_en_venta_en_colonia_las_quintasPosition.lng());

            // Casa en Fraccionamiento La Conquista - Coordenadas finales (geocoder)
            const casa_en_fraccionamiento_la_conquistaPosition = new google.maps.LatLng(24.8207681, -107.439959);
            const casa_en_fraccionamiento_la_conquistaMarkerClass = createZillowPropertyMarker(casa_en_fraccionamiento_la_conquistaProperty, window.mapCuliacan);
            const casa_en_fraccionamiento_la_conquistaMarker = new casa_en_fraccionamiento_la_conquistaMarkerClass(casa_en_fraccionamiento_la_conquistaPosition, window.mapCuliacan, casa_en_fraccionamiento_la_conquistaProperty);
            window.allCuliacanMarkers.push(casa_en_fraccionamiento_la_conquistaMarker);
            console.log('Marcador Casa en Fraccionamiento La Conquista (VENTA) creado en:', casa_en_fraccionamiento_la_conquistaPosition.lat(), casa_en_fraccionamiento_la_conquistaPosition.lng());

            // Casa en Bosques del Rey Br56 - Coordenadas finales (geocoder)
            const casa_en_bosques_del_rey_br56Position = new google.maps.LatLng(24.8161574, -107.4455042);
            const casa_en_bosques_del_rey_br56MarkerClass = createZillowPropertyMarker(casa_en_bosques_del_rey_br56Property, window.mapCuliacan);
            const casa_en_bosques_del_rey_br56Marker = new casa_en_bosques_del_rey_br56MarkerClass(casa_en_bosques_del_rey_br56Position, window.mapCuliacan, casa_en_bosques_del_rey_br56Property);
            window.allCuliacanMarkers.push(casa_en_bosques_del_rey_br56Marker);
            console.log('Marcador Casa en Bosques del Rey Br56 (VENTA) creado en:', casa_en_bosques_del_rey_br56Position.lat(), casa_en_bosques_del_rey_br56Position.lng());

            // Casa en Venta en Interlomas Culiacán - Coordenadas finales (geocoder)
            const casa_en_venta_en_interlomas_culiacanPosition = new google.maps.LatLng(24.8420134, -107.3840127);
            const casa_en_venta_en_interlomas_culiacanMarkerClass = createZillowPropertyMarker(casa_en_venta_en_interlomas_culiacanProperty, window.mapCuliacan);
            const casa_en_venta_en_interlomas_culiacanMarker = new casa_en_venta_en_interlomas_culiacanMarkerClass(casa_en_venta_en_interlomas_culiacanPosition, window.mapCuliacan, casa_en_venta_en_interlomas_culiacanProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_interlomas_culiacanMarker);
            console.log('Marcador Casa en Venta en Interlomas Culiacán (VENTA) creado en:', casa_en_venta_en_interlomas_culiacanPosition.lat(), casa_en_venta_en_interlomas_culiacanPosition.lng());

            // Casa en La Costera - Coordenadas finales (geocoder)
            const casa_en_la_costeraPosition = new google.maps.LatLng(24.8116349, -107.3949408);
            const casa_en_la_costeraMarkerClass = createZillowPropertyMarker(casa_en_la_costeraProperty, window.mapCuliacan);
            const casa_en_la_costeraMarker = new casa_en_la_costeraMarkerClass(casa_en_la_costeraPosition, window.mapCuliacan, casa_en_la_costeraProperty);
            window.allCuliacanMarkers.push(casa_en_la_costeraMarker);
            console.log('Marcador Casa en La Costera (VENTA) creado en:', casa_en_la_costeraPosition.lat(), casa_en_la_costeraPosition.lng());

            // "Tu Hogar Ideal: Casa en Venta Moderna en Privada" - Coordenadas finales (geocoder)
            const tu_hogar_ideal_casa_en_venta_moderna_en_privadaPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const tu_hogar_ideal_casa_en_venta_moderna_en_privadaMarkerClass = createZillowPropertyMarker(tu_hogar_ideal_casa_en_venta_moderna_en_privadaProperty, window.mapCuliacan);
            const tu_hogar_ideal_casa_en_venta_moderna_en_privadaMarker = new tu_hogar_ideal_casa_en_venta_moderna_en_privadaMarkerClass(tu_hogar_ideal_casa_en_venta_moderna_en_privadaPosition, window.mapCuliacan, tu_hogar_ideal_casa_en_venta_moderna_en_privadaProperty);
            window.allCuliacanMarkers.push(tu_hogar_ideal_casa_en_venta_moderna_en_privadaMarker);
            console.log('Marcador "Tu Hogar Ideal: Casa en Venta Moderna en Privada" (VENTA) creado en:', tu_hogar_ideal_casa_en_venta_moderna_en_privadaPosition.lat(), tu_hogar_ideal_casa_en_venta_moderna_en_privadaPosition.lng());

            // Casa en Venta 6 Recamaras, Culiacán - Coordenadas finales (geocoder)
            const casa_en_venta_6_recamaras_culiacanPosition = new google.maps.LatLng(24.8170924, -107.3658729);
            const casa_en_venta_6_recamaras_culiacanMarkerClass = createZillowPropertyMarker(casa_en_venta_6_recamaras_culiacanProperty, window.mapCuliacan);
            const casa_en_venta_6_recamaras_culiacanMarker = new casa_en_venta_6_recamaras_culiacanMarkerClass(casa_en_venta_6_recamaras_culiacanPosition, window.mapCuliacan, casa_en_venta_6_recamaras_culiacanProperty);
            window.allCuliacanMarkers.push(casa_en_venta_6_recamaras_culiacanMarker);
            console.log('Marcador Casa en Venta 6 Recamaras, Culiacán (VENTA) creado en:', casa_en_venta_6_recamaras_culiacanPosition.lat(), casa_en_venta_6_recamaras_culiacanPosition.lng());

            // Casa en Nuevo Culiacán - Coordenadas finales (geocoder)
            const casa_en_nuevo_culiacanPosition = new google.maps.LatLng(24.7841029, -107.4099129);
            const casa_en_nuevo_culiacanMarkerClass = createZillowPropertyMarker(casa_en_nuevo_culiacanProperty, window.mapCuliacan);
            const casa_en_nuevo_culiacanMarker = new casa_en_nuevo_culiacanMarkerClass(casa_en_nuevo_culiacanPosition, window.mapCuliacan, casa_en_nuevo_culiacanProperty);
            window.allCuliacanMarkers.push(casa_en_nuevo_culiacanMarker);
            console.log('Marcador Casa en Nuevo Culiacán (VENTA) creado en:', casa_en_nuevo_culiacanPosition.lat(), casa_en_nuevo_culiacanPosition.lng());

            // Se Vende Casa - Coordenadas finales (geocoder)
            const se_vende_casaPosition = new google.maps.LatLng(24.7910578, -107.4005137);
            const se_vende_casaMarkerClass = createZillowPropertyMarker(se_vende_casaProperty, window.mapCuliacan);
            const se_vende_casaMarker = new se_vende_casaMarkerClass(se_vende_casaPosition, window.mapCuliacan, se_vende_casaProperty);
            window.allCuliacanMarkers.push(se_vende_casaMarker);
            console.log('Marcador Se Vende Casa (VENTA) creado en:', se_vende_casaPosition.lat(), se_vende_casaPosition.lng());

            // Se Vende Casa en Boulevard Doctor Mora en Las Quintas - Coordenadas finales (geocoder)
            const se_vende_casa_en_boulevard_doctor_mora_en_las_quintasPosition = new google.maps.LatLng(24.8148213, -107.3718024);
            const se_vende_casa_en_boulevard_doctor_mora_en_las_quintasMarkerClass = createZillowPropertyMarker(se_vende_casa_en_boulevard_doctor_mora_en_las_quintasProperty, window.mapCuliacan);
            const se_vende_casa_en_boulevard_doctor_mora_en_las_quintasMarker = new se_vende_casa_en_boulevard_doctor_mora_en_las_quintasMarkerClass(se_vende_casa_en_boulevard_doctor_mora_en_las_quintasPosition, window.mapCuliacan, se_vende_casa_en_boulevard_doctor_mora_en_las_quintasProperty);
            window.allCuliacanMarkers.push(se_vende_casa_en_boulevard_doctor_mora_en_las_quintasMarker);
            console.log('Marcador Se Vende Casa en Boulevard Doctor Mora en Las Quintas (VENTA) creado en:', se_vende_casa_en_boulevard_doctor_mora_en_las_quintasPosition.lat(), se_vende_casa_en_boulevard_doctor_mora_en_las_quintasPosition.lng());

            // Casa en Popular - Coordenadas finales (geocoder)
            const casa_en_popularPosition = new google.maps.LatLng(24.8116349, -107.3949408);
            const casa_en_popularMarkerClass = createZillowPropertyMarker(casa_en_popularProperty, window.mapCuliacan);
            const casa_en_popularMarker = new casa_en_popularMarkerClass(casa_en_popularPosition, window.mapCuliacan, casa_en_popularProperty);
            window.allCuliacanMarkers.push(casa_en_popularMarker);
            console.log('Marcador Casa en Popular (VENTA) creado en:', casa_en_popularPosition.lat(), casa_en_popularPosition.lng());

            // Casa en Fraccionamiento Prados de La Conquista - Coordenadas finales (geocoder)
            const casa_en_fraccionamiento_prados_de_la_conquistaPosition = new google.maps.LatLng(24.8132779, -107.4416849);
            const casa_en_fraccionamiento_prados_de_la_conquistaMarkerClass = createZillowPropertyMarker(casa_en_fraccionamiento_prados_de_la_conquistaProperty, window.mapCuliacan);
            const casa_en_fraccionamiento_prados_de_la_conquistaMarker = new casa_en_fraccionamiento_prados_de_la_conquistaMarkerClass(casa_en_fraccionamiento_prados_de_la_conquistaPosition, window.mapCuliacan, casa_en_fraccionamiento_prados_de_la_conquistaProperty);
            window.allCuliacanMarkers.push(casa_en_fraccionamiento_prados_de_la_conquistaMarker);
            console.log('Marcador Casa en Fraccionamiento Prados de La Conquista (VENTA) creado en:', casa_en_fraccionamiento_prados_de_la_conquistaPosition.lat(), casa_en_fraccionamiento_prados_de_la_conquistaPosition.lng());

            // Casa en Residencial Los Olivos - Coordenadas finales (geocoder)
            const casa_en_residencial_los_olivosPosition = new google.maps.LatLng(24.8116349, -107.3949408);
            const casa_en_residencial_los_olivosMarkerClass = createZillowPropertyMarker(casa_en_residencial_los_olivosProperty, window.mapCuliacan);
            const casa_en_residencial_los_olivosMarker = new casa_en_residencial_los_olivosMarkerClass(casa_en_residencial_los_olivosPosition, window.mapCuliacan, casa_en_residencial_los_olivosProperty);
            window.allCuliacanMarkers.push(casa_en_residencial_los_olivosMarker);
            console.log('Marcador Casa en Residencial Los Olivos (VENTA) creado en:', casa_en_residencial_los_olivosPosition.lat(), casa_en_residencial_los_olivosPosition.lng());

            // Propiedad Para Inversion con Vista Panoramica a La Ciudad - Coordenadas finales (geocoder)
            const propiedad_para_inversion_con_vista_panoramica_a_la_ciudadPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const propiedad_para_inversion_con_vista_panoramica_a_la_ciudadMarkerClass = createZillowPropertyMarker(propiedad_para_inversion_con_vista_panoramica_a_la_ciudadProperty, window.mapCuliacan);
            const propiedad_para_inversion_con_vista_panoramica_a_la_ciudadMarker = new propiedad_para_inversion_con_vista_panoramica_a_la_ciudadMarkerClass(propiedad_para_inversion_con_vista_panoramica_a_la_ciudadPosition, window.mapCuliacan, propiedad_para_inversion_con_vista_panoramica_a_la_ciudadProperty);
            window.allCuliacanMarkers.push(propiedad_para_inversion_con_vista_panoramica_a_la_ciudadMarker);
            console.log('Marcador Propiedad Para Inversion con Vista Panoramica a La Ciudad (VENTA) creado en:', propiedad_para_inversion_con_vista_panoramica_a_la_ciudadPosition.lat(), propiedad_para_inversion_con_vista_panoramica_a_la_ciudadPosition.lng());

            // Se Vende Casa en Privada Sector Stanza Toscana - Coordenadas finales (geocoder)
            const se_vende_casa_en_privada_sector_stanza_toscanaPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const se_vende_casa_en_privada_sector_stanza_toscanaMarkerClass = createZillowPropertyMarker(se_vende_casa_en_privada_sector_stanza_toscanaProperty, window.mapCuliacan);
            const se_vende_casa_en_privada_sector_stanza_toscanaMarker = new se_vende_casa_en_privada_sector_stanza_toscanaMarkerClass(se_vende_casa_en_privada_sector_stanza_toscanaPosition, window.mapCuliacan, se_vende_casa_en_privada_sector_stanza_toscanaProperty);
            window.allCuliacanMarkers.push(se_vende_casa_en_privada_sector_stanza_toscanaMarker);
            console.log('Marcador Se Vende Casa en Privada Sector Stanza Toscana (VENTA) creado en:', se_vende_casa_en_privada_sector_stanza_toscanaPosition.lat(), se_vende_casa_en_privada_sector_stanza_toscanaPosition.lng());

            // Casa en Venta en El Fracc. Villas del Río, Culiacán, Sinaloa. - Coordenadas finales (geocoder)
            const casa_en_venta_en_el_fracc_villas_del_rio_culiacan_sinaloaPosition = new google.maps.LatLng(24.807644, -107.4506798);
            const casa_en_venta_en_el_fracc_villas_del_rio_culiacan_sinaloaMarkerClass = createZillowPropertyMarker(casa_en_venta_en_el_fracc_villas_del_rio_culiacan_sinaloaProperty, window.mapCuliacan);
            const casa_en_venta_en_el_fracc_villas_del_rio_culiacan_sinaloaMarker = new casa_en_venta_en_el_fracc_villas_del_rio_culiacan_sinaloaMarkerClass(casa_en_venta_en_el_fracc_villas_del_rio_culiacan_sinaloaPosition, window.mapCuliacan, casa_en_venta_en_el_fracc_villas_del_rio_culiacan_sinaloaProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_el_fracc_villas_del_rio_culiacan_sinaloaMarker);
            console.log('Marcador Casa en Venta en El Fracc. Villas del Río, Culiacán, Sinaloa. (VENTA) creado en:', casa_en_venta_en_el_fracc_villas_del_rio_culiacan_sinaloaPosition.lat(), casa_en_venta_en_el_fracc_villas_del_rio_culiacan_sinaloaPosition.lng());

            // Casa en Venta en Lomas de San Isidro - Coordenadas finales (geocoder)
            const casa_en_venta_en_lomas_de_san_isidroPosition = new google.maps.LatLng(24.7634462, -107.3970801);
            const casa_en_venta_en_lomas_de_san_isidroMarkerClass = createZillowPropertyMarker(casa_en_venta_en_lomas_de_san_isidroProperty, window.mapCuliacan);
            const casa_en_venta_en_lomas_de_san_isidroMarker = new casa_en_venta_en_lomas_de_san_isidroMarkerClass(casa_en_venta_en_lomas_de_san_isidroPosition, window.mapCuliacan, casa_en_venta_en_lomas_de_san_isidroProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_lomas_de_san_isidroMarker);
            console.log('Marcador Casa en Venta en Lomas de San Isidro (VENTA) creado en:', casa_en_venta_en_lomas_de_san_isidroPosition.lat(), casa_en_venta_en_lomas_de_san_isidroPosition.lng());

            // Casa en Fraccionamiento Terranova - Coordenadas finales (geocoder)
            const casa_en_fraccionamiento_terranovaPosition = new google.maps.LatLng(24.8116349, -107.3949408);
            const casa_en_fraccionamiento_terranovaMarkerClass = createZillowPropertyMarker(casa_en_fraccionamiento_terranovaProperty, window.mapCuliacan);
            const casa_en_fraccionamiento_terranovaMarker = new casa_en_fraccionamiento_terranovaMarkerClass(casa_en_fraccionamiento_terranovaPosition, window.mapCuliacan, casa_en_fraccionamiento_terranovaProperty);
            window.allCuliacanMarkers.push(casa_en_fraccionamiento_terranovaMarker);
            console.log('Marcador Casa en Fraccionamiento Terranova (VENTA) creado en:', casa_en_fraccionamiento_terranovaPosition.lat(), casa_en_fraccionamiento_terranovaPosition.lng());

            // Casa Nueva en San Javier - Coordenadas finales (geocoder)
            const casa_nueva_en_san_javierPosition = new google.maps.LatLng(24.7706684, -107.4878629);
            const casa_nueva_en_san_javierMarkerClass = createZillowPropertyMarker(casa_nueva_en_san_javierProperty, window.mapCuliacan);
            const casa_nueva_en_san_javierMarker = new casa_nueva_en_san_javierMarkerClass(casa_nueva_en_san_javierPosition, window.mapCuliacan, casa_nueva_en_san_javierProperty);
            window.allCuliacanMarkers.push(casa_nueva_en_san_javierMarker);
            console.log('Marcador Casa Nueva en San Javier (VENTA) creado en:', casa_nueva_en_san_javierPosition.lat(), casa_nueva_en_san_javierPosition.lng());

            // Casa - Fraccionamiento Zona Dorada - Coordenadas finales (geocoder)
            const casa_fraccionamiento_zona_doradaPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const casa_fraccionamiento_zona_doradaMarkerClass = createZillowPropertyMarker(casa_fraccionamiento_zona_doradaProperty, window.mapCuliacan);
            const casa_fraccionamiento_zona_doradaMarker = new casa_fraccionamiento_zona_doradaMarkerClass(casa_fraccionamiento_zona_doradaPosition, window.mapCuliacan, casa_fraccionamiento_zona_doradaProperty);
            window.allCuliacanMarkers.push(casa_fraccionamiento_zona_doradaMarker);
            console.log('Marcador Casa - Fraccionamiento Zona Dorada (VENTA) creado en:', casa_fraccionamiento_zona_doradaPosition.lat(), casa_fraccionamiento_zona_doradaPosition.lng());

            // Casa - Fraccionamiento Valle Alto - Coordenadas finales (geocoder)
            const casa_fraccionamiento_valle_altoPosition = new google.maps.LatLng(24.7998483, -107.4810826);
            const casa_fraccionamiento_valle_altoMarkerClass = createZillowPropertyMarker(casa_fraccionamiento_valle_altoProperty, window.mapCuliacan);
            const casa_fraccionamiento_valle_altoMarker = new casa_fraccionamiento_valle_altoMarkerClass(casa_fraccionamiento_valle_altoPosition, window.mapCuliacan, casa_fraccionamiento_valle_altoProperty);
            window.allCuliacanMarkers.push(casa_fraccionamiento_valle_altoMarker);
            console.log('Marcador Casa - Fraccionamiento Valle Alto (VENTA) creado en:', casa_fraccionamiento_valle_altoPosition.lat(), casa_fraccionamiento_valle_altoPosition.lng());

            // Casa en Venta en Lomas de San Isidro con Cochera Techada Zona Sur - Coordenadas finales (geocoder)
            const casa_en_venta_en_lomas_de_san_isidro_con_cochera_techada_zonPosition = new google.maps.LatLng(24.7634462, -107.3970801);
            const casa_en_venta_en_lomas_de_san_isidro_con_cochera_techada_zonMarkerClass = createZillowPropertyMarker(casa_en_venta_en_lomas_de_san_isidro_con_cochera_techada_zonProperty, window.mapCuliacan);
            const casa_en_venta_en_lomas_de_san_isidro_con_cochera_techada_zonMarker = new casa_en_venta_en_lomas_de_san_isidro_con_cochera_techada_zonMarkerClass(casa_en_venta_en_lomas_de_san_isidro_con_cochera_techada_zonPosition, window.mapCuliacan, casa_en_venta_en_lomas_de_san_isidro_con_cochera_techada_zonProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_lomas_de_san_isidro_con_cochera_techada_zonMarker);
            console.log('Marcador Casa en Venta en Lomas de San Isidro con Cochera Techada Zona Sur (VENTA) creado en:', casa_en_venta_en_lomas_de_san_isidro_con_cochera_techada_zonPosition.lat(), casa_en_venta_en_lomas_de_san_isidro_con_cochera_techada_zonPosition.lng());

            // Casa en Rosales - Coordenadas finales (geocoder)
            const casa_en_rosalesPosition = new google.maps.LatLng(24.8116349, -107.3949408);
            const casa_en_rosalesMarkerClass = createZillowPropertyMarker(casa_en_rosalesProperty, window.mapCuliacan);
            const casa_en_rosalesMarker = new casa_en_rosalesMarkerClass(casa_en_rosalesPosition, window.mapCuliacan, casa_en_rosalesProperty);
            window.allCuliacanMarkers.push(casa_en_rosalesMarker);
            console.log('Marcador Casa en Rosales (VENTA) creado en:', casa_en_rosalesPosition.lat(), casa_en_rosalesPosition.lng());

            // Casa en Adolfo Lopez Mateos Remodelada - Coordenadas finales (geocoder)
            const casa_en_adolfo_lopez_mateos_remodeladaPosition = new google.maps.LatLng(24.8091, -107.394);
            const casa_en_adolfo_lopez_mateos_remodeladaMarkerClass = createZillowPropertyMarker(casa_en_adolfo_lopez_mateos_remodeladaProperty, window.mapCuliacan);
            const casa_en_adolfo_lopez_mateos_remodeladaMarker = new casa_en_adolfo_lopez_mateos_remodeladaMarkerClass(casa_en_adolfo_lopez_mateos_remodeladaPosition, window.mapCuliacan, casa_en_adolfo_lopez_mateos_remodeladaProperty);
            window.allCuliacanMarkers.push(casa_en_adolfo_lopez_mateos_remodeladaMarker);
            console.log('Marcador Casa en Adolfo Lopez Mateos Remodelada (VENTA) creado en:', casa_en_adolfo_lopez_mateos_remodeladaPosition.lat(), casa_en_adolfo_lopez_mateos_remodeladaPosition.lng());

            // Casa en Adolfo Lopez Mateos - Coordenadas finales (geocoder)
            const casa_en_adolfo_lopez_mateosPosition = new google.maps.LatLng(24.8116349, -107.3949408);
            const casa_en_adolfo_lopez_mateosMarkerClass = createZillowPropertyMarker(casa_en_adolfo_lopez_mateosProperty, window.mapCuliacan);
            const casa_en_adolfo_lopez_mateosMarker = new casa_en_adolfo_lopez_mateosMarkerClass(casa_en_adolfo_lopez_mateosPosition, window.mapCuliacan, casa_en_adolfo_lopez_mateosProperty);
            window.allCuliacanMarkers.push(casa_en_adolfo_lopez_mateosMarker);
            console.log('Marcador Casa en Adolfo Lopez Mateos (VENTA) creado en:', casa_en_adolfo_lopez_mateosPosition.lat(), casa_en_adolfo_lopez_mateosPosition.lng());

            // Casa en Fraccionamiento Hacienda Los Huertos - Coordenadas finales (geocoder)
            const casa_en_fraccionamiento_hacienda_los_huertosPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const casa_en_fraccionamiento_hacienda_los_huertosMarkerClass = createZillowPropertyMarker(casa_en_fraccionamiento_hacienda_los_huertosProperty, window.mapCuliacan);
            const casa_en_fraccionamiento_hacienda_los_huertosMarker = new casa_en_fraccionamiento_hacienda_los_huertosMarkerClass(casa_en_fraccionamiento_hacienda_los_huertosPosition, window.mapCuliacan, casa_en_fraccionamiento_hacienda_los_huertosProperty);
            window.allCuliacanMarkers.push(casa_en_fraccionamiento_hacienda_los_huertosMarker);
            console.log('Marcador Casa en Fraccionamiento Hacienda Los Huertos (VENTA) creado en:', casa_en_fraccionamiento_hacienda_los_huertosPosition.lat(), casa_en_fraccionamiento_hacienda_los_huertosPosition.lng());

            // Casa en Rancho o Rancheria La Guasima - Coordenadas finales (geocoder)
            const casa_en_rancho_o_rancheria_la_guasimaPosition = new google.maps.LatLng(24.8116349, -107.3949408);
            const casa_en_rancho_o_rancheria_la_guasimaMarkerClass = createZillowPropertyMarker(casa_en_rancho_o_rancheria_la_guasimaProperty, window.mapCuliacan);
            const casa_en_rancho_o_rancheria_la_guasimaMarker = new casa_en_rancho_o_rancheria_la_guasimaMarkerClass(casa_en_rancho_o_rancheria_la_guasimaPosition, window.mapCuliacan, casa_en_rancho_o_rancheria_la_guasimaProperty);
            window.allCuliacanMarkers.push(casa_en_rancho_o_rancheria_la_guasimaMarker);
            console.log('Marcador Casa en Rancho o Rancheria La Guasima (VENTA) creado en:', casa_en_rancho_o_rancheria_la_guasimaPosition.lat(), casa_en_rancho_o_rancheria_la_guasimaPosition.lng());

            // Casa en Venta en Villas del Rio Elite - Coordenadas finales (geocoder)
            const casa_en_venta_en_villas_del_rio_elitePosition = new google.maps.LatLng(24.807644, -107.4506798);
            const casa_en_venta_en_villas_del_rio_eliteMarkerClass = createZillowPropertyMarker(casa_en_venta_en_villas_del_rio_eliteProperty, window.mapCuliacan);
            const casa_en_venta_en_villas_del_rio_eliteMarker = new casa_en_venta_en_villas_del_rio_eliteMarkerClass(casa_en_venta_en_villas_del_rio_elitePosition, window.mapCuliacan, casa_en_venta_en_villas_del_rio_eliteProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_villas_del_rio_eliteMarker);
            console.log('Marcador Casa en Venta en Villas del Rio Elite (VENTA) creado en:', casa_en_venta_en_villas_del_rio_elitePosition.lat(), casa_en_venta_en_villas_del_rio_elitePosition.lng());

            // Casa de 2 Pisos en Infonavit Barrancos, Culiacán - Coordenadas finales (geocoder)
            const casa_de_2_pisos_en_infonavit_barrancos_culiacanPosition = new google.maps.LatLng(24.7553976, -107.4314566);
            const casa_de_2_pisos_en_infonavit_barrancos_culiacanMarkerClass = createZillowPropertyMarker(casa_de_2_pisos_en_infonavit_barrancos_culiacanProperty, window.mapCuliacan);
            const casa_de_2_pisos_en_infonavit_barrancos_culiacanMarker = new casa_de_2_pisos_en_infonavit_barrancos_culiacanMarkerClass(casa_de_2_pisos_en_infonavit_barrancos_culiacanPosition, window.mapCuliacan, casa_de_2_pisos_en_infonavit_barrancos_culiacanProperty);
            window.allCuliacanMarkers.push(casa_de_2_pisos_en_infonavit_barrancos_culiacanMarker);
            console.log('Marcador Casa de 2 Pisos en Infonavit Barrancos, Culiacán (VENTA) creado en:', casa_de_2_pisos_en_infonavit_barrancos_culiacanPosition.lat(), casa_de_2_pisos_en_infonavit_barrancos_culiacanPosition.lng());

            // Casa en Valle Alto Zona Norte - Coordenadas finales (geocoder)
            const casa_en_valle_alto_zona_nortePosition = new google.maps.LatLng(24.7998483, -107.4810826);
            const casa_en_valle_alto_zona_norteMarkerClass = createZillowPropertyMarker(casa_en_valle_alto_zona_norteProperty, window.mapCuliacan);
            const casa_en_valle_alto_zona_norteMarker = new casa_en_valle_alto_zona_norteMarkerClass(casa_en_valle_alto_zona_nortePosition, window.mapCuliacan, casa_en_valle_alto_zona_norteProperty);
            window.allCuliacanMarkers.push(casa_en_valle_alto_zona_norteMarker);
            console.log('Marcador Casa en Valle Alto Zona Norte (VENTA) creado en:', casa_en_valle_alto_zona_nortePosition.lat(), casa_en_valle_alto_zona_nortePosition.lng());

            // Casa - Fraccionamiento Hacienda Arboledas - Coordenadas finales (geocoder)
            const casa_fraccionamiento_hacienda_arboledasPosition = new google.maps.LatLng(24.8206008, -107.4337829);
            const casa_fraccionamiento_hacienda_arboledasMarkerClass = createZillowPropertyMarker(casa_fraccionamiento_hacienda_arboledasProperty, window.mapCuliacan);
            const casa_fraccionamiento_hacienda_arboledasMarker = new casa_fraccionamiento_hacienda_arboledasMarkerClass(casa_fraccionamiento_hacienda_arboledasPosition, window.mapCuliacan, casa_fraccionamiento_hacienda_arboledasProperty);
            window.allCuliacanMarkers.push(casa_fraccionamiento_hacienda_arboledasMarker);
            console.log('Marcador Casa - Fraccionamiento Hacienda Arboledas (VENTA) creado en:', casa_fraccionamiento_hacienda_arboledasPosition.lat(), casa_fraccionamiento_hacienda_arboledasPosition.lng());

            // Casa en Los Ángeles Culiacán Fracc. Las Glorias (Sauces) - Coordenadas finales (geocoder)
            const casa_en_los_angeles_culiacan_fracc_las_glorias_saucesPosition = new google.maps.LatLng(24.8297034, -107.419258);
            const casa_en_los_angeles_culiacan_fracc_las_glorias_saucesMarkerClass = createZillowPropertyMarker(casa_en_los_angeles_culiacan_fracc_las_glorias_saucesProperty, window.mapCuliacan);
            const casa_en_los_angeles_culiacan_fracc_las_glorias_saucesMarker = new casa_en_los_angeles_culiacan_fracc_las_glorias_saucesMarkerClass(casa_en_los_angeles_culiacan_fracc_las_glorias_saucesPosition, window.mapCuliacan, casa_en_los_angeles_culiacan_fracc_las_glorias_saucesProperty);
            window.allCuliacanMarkers.push(casa_en_los_angeles_culiacan_fracc_las_glorias_saucesMarker);
            console.log('Marcador Casa en Los Ángeles Culiacán Fracc. Las Glorias (Sauces) (VENTA) creado en:', casa_en_los_angeles_culiacan_fracc_las_glorias_saucesPosition.lat(), casa_en_los_angeles_culiacan_fracc_las_glorias_saucesPosition.lng());

            // Casa en Venta en Fracc Capistrano, Sector Sur de Culiacán. - Coordenadas finales (geocoder)
            const casa_en_venta_en_fracc_capistrano_sector_sur_de_culiacanPosition = new google.maps.LatLng(24.7457076, -107.4177646);
            const casa_en_venta_en_fracc_capistrano_sector_sur_de_culiacanMarkerClass = createZillowPropertyMarker(casa_en_venta_en_fracc_capistrano_sector_sur_de_culiacanProperty, window.mapCuliacan);
            const casa_en_venta_en_fracc_capistrano_sector_sur_de_culiacanMarker = new casa_en_venta_en_fracc_capistrano_sector_sur_de_culiacanMarkerClass(casa_en_venta_en_fracc_capistrano_sector_sur_de_culiacanPosition, window.mapCuliacan, casa_en_venta_en_fracc_capistrano_sector_sur_de_culiacanProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_fracc_capistrano_sector_sur_de_culiacanMarker);
            console.log('Marcador Casa en Venta en Fracc Capistrano, Sector Sur de Culiacán. (VENTA) creado en:', casa_en_venta_en_fracc_capistrano_sector_sur_de_culiacanPosition.lat(), casa_en_venta_en_fracc_capistrano_sector_sur_de_culiacanPosition.lng());

            // Casa - Fraccionamiento Santa Elena - Coordenadas finales (geocoder)
            const casa_fraccionamiento_santa_elenaPosition = new google.maps.LatLng(24.8257996, -107.4265684);
            const casa_fraccionamiento_santa_elenaMarkerClass = createZillowPropertyMarker(casa_fraccionamiento_santa_elenaProperty, window.mapCuliacan);
            const casa_fraccionamiento_santa_elenaMarker = new casa_fraccionamiento_santa_elenaMarkerClass(casa_fraccionamiento_santa_elenaPosition, window.mapCuliacan, casa_fraccionamiento_santa_elenaProperty);
            window.allCuliacanMarkers.push(casa_fraccionamiento_santa_elenaMarker);
            console.log('Marcador Casa - Fraccionamiento Santa Elena (VENTA) creado en:', casa_fraccionamiento_santa_elenaPosition.lat(), casa_fraccionamiento_santa_elenaPosition.lng());

            // Casa en Venta en Stanza Corcega A2 - Coordenadas finales (geocoder)
            const casa_en_venta_en_stanza_corcega_a2Position = new google.maps.LatLng(24.7498304, -107.3878399);
            const casa_en_venta_en_stanza_corcega_a2MarkerClass = createZillowPropertyMarker(casa_en_venta_en_stanza_corcega_a2Property, window.mapCuliacan);
            const casa_en_venta_en_stanza_corcega_a2Marker = new casa_en_venta_en_stanza_corcega_a2MarkerClass(casa_en_venta_en_stanza_corcega_a2Position, window.mapCuliacan, casa_en_venta_en_stanza_corcega_a2Property);
            window.allCuliacanMarkers.push(casa_en_venta_en_stanza_corcega_a2Marker);
            console.log('Marcador Casa en Venta en Stanza Corcega A2 (VENTA) creado en:', casa_en_venta_en_stanza_corcega_a2Position.lat(), casa_en_venta_en_stanza_corcega_a2Position.lng());

            // Hermosa Casa en Valle Alto, Culiacán - Coordenadas finales (geocoder)
            const hermosa_casa_en_valle_alto_culiacanPosition = new google.maps.LatLng(24.8052781, -107.4625676);
            const hermosa_casa_en_valle_alto_culiacanMarkerClass = createZillowPropertyMarker(hermosa_casa_en_valle_alto_culiacanProperty, window.mapCuliacan);
            const hermosa_casa_en_valle_alto_culiacanMarker = new hermosa_casa_en_valle_alto_culiacanMarkerClass(hermosa_casa_en_valle_alto_culiacanPosition, window.mapCuliacan, hermosa_casa_en_valle_alto_culiacanProperty);
            window.allCuliacanMarkers.push(hermosa_casa_en_valle_alto_culiacanMarker);
            console.log('Marcador Hermosa Casa en Valle Alto, Culiacán (VENTA) creado en:', hermosa_casa_en_valle_alto_culiacanPosition.lat(), hermosa_casa_en_valle_alto_culiacanPosition.lng());

            // Se Vende Casa con Terreno - Coordenadas finales (geocoder)
            const se_vende_casa_con_terrenoPosition = new google.maps.LatLng(24.780941, -107.5148323);
            const se_vende_casa_con_terrenoMarkerClass = createZillowPropertyMarker(se_vende_casa_con_terrenoProperty, window.mapCuliacan);
            const se_vende_casa_con_terrenoMarker = new se_vende_casa_con_terrenoMarkerClass(se_vende_casa_con_terrenoPosition, window.mapCuliacan, se_vende_casa_con_terrenoProperty);
            window.allCuliacanMarkers.push(se_vende_casa_con_terrenoMarker);
            console.log('Marcador Se Vende Casa con Terreno (VENTA) creado en:', se_vende_casa_con_terrenoPosition.lat(), se_vende_casa_con_terrenoPosition.lng());

            // Se Vende Casa Col. Lazaro Cardenas - Coordenadas finales (geocoder)
            const se_vende_casa_col_lazaro_cardenasPosition = new google.maps.LatLng(24.7776392, -107.3755532);
            const se_vende_casa_col_lazaro_cardenasMarkerClass = createZillowPropertyMarker(se_vende_casa_col_lazaro_cardenasProperty, window.mapCuliacan);
            const se_vende_casa_col_lazaro_cardenasMarker = new se_vende_casa_col_lazaro_cardenasMarkerClass(se_vende_casa_col_lazaro_cardenasPosition, window.mapCuliacan, se_vende_casa_col_lazaro_cardenasProperty);
            window.allCuliacanMarkers.push(se_vende_casa_col_lazaro_cardenasMarker);
            console.log('Marcador Se Vende Casa Col. Lazaro Cardenas (VENTA) creado en:', se_vende_casa_col_lazaro_cardenasPosition.lat(), se_vende_casa_col_lazaro_cardenasPosition.lng());

            // Se Vende Casa Stanza Albaterra - Coordenadas finales (geocoder)
            const se_vende_casa_stanza_albaterraPosition = new google.maps.LatLng(24.8470852, -107.3587957);
            const se_vende_casa_stanza_albaterraMarkerClass = createZillowPropertyMarker(se_vende_casa_stanza_albaterraProperty, window.mapCuliacan);
            const se_vende_casa_stanza_albaterraMarker = new se_vende_casa_stanza_albaterraMarkerClass(se_vende_casa_stanza_albaterraPosition, window.mapCuliacan, se_vende_casa_stanza_albaterraProperty);
            window.allCuliacanMarkers.push(se_vende_casa_stanza_albaterraMarker);
            console.log('Marcador Se Vende Casa Stanza Albaterra (VENTA) creado en:', se_vende_casa_stanza_albaterraPosition.lat(), se_vende_casa_stanza_albaterraPosition.lng());

            // Se Vende Casa en Perisur II Culiacán - Coordenadas finales (geocoder)
            const se_vende_casa_en_perisur_ii_culiacanPosition = new google.maps.LatLng(24.75101, -107.4010395);
            const se_vende_casa_en_perisur_ii_culiacanMarkerClass = createZillowPropertyMarker(se_vende_casa_en_perisur_ii_culiacanProperty, window.mapCuliacan);
            const se_vende_casa_en_perisur_ii_culiacanMarker = new se_vende_casa_en_perisur_ii_culiacanMarkerClass(se_vende_casa_en_perisur_ii_culiacanPosition, window.mapCuliacan, se_vende_casa_en_perisur_ii_culiacanProperty);
            window.allCuliacanMarkers.push(se_vende_casa_en_perisur_ii_culiacanMarker);
            console.log('Marcador Se Vende Casa en Perisur II Culiacán (VENTA) creado en:', se_vende_casa_en_perisur_ii_culiacanPosition.lat(), se_vende_casa_en_perisur_ii_culiacanPosition.lng());

            // Casa en Venta Bosque Abundancia Bosques del Rey Culiacan Sinaloa - Coordenadas finales (geocoder)
            const casa_en_venta_bosque_abundancia_bosques_del_rey_culiacan_sinPosition = new google.maps.LatLng(24.8207681, -107.439959);
            const casa_en_venta_bosque_abundancia_bosques_del_rey_culiacan_sinMarkerClass = createZillowPropertyMarker(casa_en_venta_bosque_abundancia_bosques_del_rey_culiacan_sinProperty, window.mapCuliacan);
            const casa_en_venta_bosque_abundancia_bosques_del_rey_culiacan_sinMarker = new casa_en_venta_bosque_abundancia_bosques_del_rey_culiacan_sinMarkerClass(casa_en_venta_bosque_abundancia_bosques_del_rey_culiacan_sinPosition, window.mapCuliacan, casa_en_venta_bosque_abundancia_bosques_del_rey_culiacan_sinProperty);
            window.allCuliacanMarkers.push(casa_en_venta_bosque_abundancia_bosques_del_rey_culiacan_sinMarker);
            console.log('Marcador Casa en Venta Bosque Abundancia Bosques del Rey Culiacan Sinaloa (VENTA) creado en:', casa_en_venta_bosque_abundancia_bosques_del_rey_culiacan_sinPosition.lat(), casa_en_venta_bosque_abundancia_bosques_del_rey_culiacan_sinPosition.lng());

            // Casa en Renta Colonia Lomas del Pedregal Culiacan Sinaloa - Coordenadas finales (geocoder)
            const casa_en_renta_colonia_lomas_del_pedregal_culiacan_sinaloaPosition = new google.maps.LatLng(24.8397821, -107.3857725);
            const casa_en_renta_colonia_lomas_del_pedregal_culiacan_sinaloaMarkerClass = createZillowPropertyMarker(casa_en_renta_colonia_lomas_del_pedregal_culiacan_sinaloaProperty, window.mapCuliacan);
            const casa_en_renta_colonia_lomas_del_pedregal_culiacan_sinaloaMarker = new casa_en_renta_colonia_lomas_del_pedregal_culiacan_sinaloaMarkerClass(casa_en_renta_colonia_lomas_del_pedregal_culiacan_sinaloaPosition, window.mapCuliacan, casa_en_renta_colonia_lomas_del_pedregal_culiacan_sinaloaProperty);
            window.allCuliacanMarkers.push(casa_en_renta_colonia_lomas_del_pedregal_culiacan_sinaloaMarker);
            console.log('Marcador Casa en Renta Colonia Lomas del Pedregal Culiacan Sinaloa (RENTA) creado en:', casa_en_renta_colonia_lomas_del_pedregal_culiacan_sinaloaPosition.lat(), casa_en_renta_colonia_lomas_del_pedregal_culiacan_sinaloaPosition.lng());

            // Casa en Fraccionamiento Rincón Colonial - Coordenadas finales (geocoder)
            const casa_en_fraccionamiento_rincon_colonialPosition = new google.maps.LatLng(24.8316482, -107.3887891);
            const casa_en_fraccionamiento_rincon_colonialMarkerClass = createZillowPropertyMarker(casa_en_fraccionamiento_rincon_colonialProperty, window.mapCuliacan);
            const casa_en_fraccionamiento_rincon_colonialMarker = new casa_en_fraccionamiento_rincon_colonialMarkerClass(casa_en_fraccionamiento_rincon_colonialPosition, window.mapCuliacan, casa_en_fraccionamiento_rincon_colonialProperty);
            window.allCuliacanMarkers.push(casa_en_fraccionamiento_rincon_colonialMarker);
            console.log('Marcador Casa en Fraccionamiento Rincón Colonial (VENTA) creado en:', casa_en_fraccionamiento_rincon_colonialPosition.lat(), casa_en_fraccionamiento_rincon_colonialPosition.lng());

            // Se Vende Casa Miguel Hidalgo - Coordenadas finales (geocoder)
            const se_vende_casa_miguel_hidalgoPosition = new google.maps.LatLng(24.8011737, -107.3738102);
            const se_vende_casa_miguel_hidalgoMarkerClass = createZillowPropertyMarker(se_vende_casa_miguel_hidalgoProperty, window.mapCuliacan);
            const se_vende_casa_miguel_hidalgoMarker = new se_vende_casa_miguel_hidalgoMarkerClass(se_vende_casa_miguel_hidalgoPosition, window.mapCuliacan, se_vende_casa_miguel_hidalgoProperty);
            window.allCuliacanMarkers.push(se_vende_casa_miguel_hidalgoMarker);
            console.log('Marcador Se Vende Casa Miguel Hidalgo (VENTA) creado en:', se_vende_casa_miguel_hidalgoPosition.lat(), se_vende_casa_miguel_hidalgoPosition.lng());

            // Casa en Renta Circuito Tabachines Culiacan Sinaloa - Coordenadas finales (geocoder)
            const casa_en_renta_circuito_tabachines_culiacan_sinaloaPosition = new google.maps.LatLng(24.7928852, -107.4253803);
            const casa_en_renta_circuito_tabachines_culiacan_sinaloaMarkerClass = createZillowPropertyMarker(casa_en_renta_circuito_tabachines_culiacan_sinaloaProperty, window.mapCuliacan);
            const casa_en_renta_circuito_tabachines_culiacan_sinaloaMarker = new casa_en_renta_circuito_tabachines_culiacan_sinaloaMarkerClass(casa_en_renta_circuito_tabachines_culiacan_sinaloaPosition, window.mapCuliacan, casa_en_renta_circuito_tabachines_culiacan_sinaloaProperty);
            window.allCuliacanMarkers.push(casa_en_renta_circuito_tabachines_culiacan_sinaloaMarker);
            console.log('Marcador Casa en Renta Circuito Tabachines Culiacan Sinaloa (RENTA) creado en:', casa_en_renta_circuito_tabachines_culiacan_sinaloaPosition.lat(), casa_en_renta_circuito_tabachines_culiacan_sinaloaPosition.lng());

            // Casa en Venta en Privada La Cantera - Coordenadas finales (geocoder)
            const casa_en_venta_en_privada_la_canteraPosition = new google.maps.LatLng(24.8000572, -107.4349268);
            const casa_en_venta_en_privada_la_canteraMarkerClass = createZillowPropertyMarker(casa_en_venta_en_privada_la_canteraProperty, window.mapCuliacan);
            const casa_en_venta_en_privada_la_canteraMarker = new casa_en_venta_en_privada_la_canteraMarkerClass(casa_en_venta_en_privada_la_canteraPosition, window.mapCuliacan, casa_en_venta_en_privada_la_canteraProperty);
            window.allCuliacanMarkers.push(casa_en_venta_en_privada_la_canteraMarker);
            console.log('Marcador Casa en Venta en Privada La Cantera (VENTA) creado en:', casa_en_venta_en_privada_la_canteraPosition.lat(), casa_en_venta_en_privada_la_canteraPosition.lng());

            console.log('Marcador Casa 113 m² con 3 Recámaras en Venta, Fraccionamiento Isla Residencial (VENTA) creado en:', casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resPosition.lat(), casa_113_m_con_3_recamaras_en_venta_fraccionamiento_isla_resPosition.lng());

            // Se Vende Casa en Isla del Oeste en La Primavera - Coordenadas correctas La Primavera (Google Geocoding API V1.5)
            const se_vende_casa_en_isla_del_oeste_en_la_primaveraPosition = new google.maps.LatLng(24.7388997, -107.3952321);
            const se_vende_casa_en_isla_del_oeste_en_la_primaveraMarkerClass = createZillowPropertyMarker(se_vende_casa_en_isla_del_oeste_en_la_primaveraProperty, window.mapCuliacan);
            const se_vende_casa_en_isla_del_oeste_en_la_primaveraMarker = new se_vende_casa_en_isla_del_oeste_en_la_primaveraMarkerClass(se_vende_casa_en_isla_del_oeste_en_la_primaveraPosition, window.mapCuliacan, se_vende_casa_en_isla_del_oeste_en_la_primaveraProperty);
            window.allCuliacanMarkers.push(se_vende_casa_en_isla_del_oeste_en_la_primaveraMarker);
            console.log('Marcador Se Vende Casa en Isla del Oeste en La Primavera (VENTA) creado en:', se_vende_casa_en_isla_del_oeste_en_la_primaveraPosition.lat(), se_vende_casa_en_isla_del_oeste_en_la_primaveraPosition.lng());

            // Stanza Toscana Culiacan Sinaloa - Coordenadas finales (geocoder)
            const stanza_toscana_culiacan_sinaloaPosition = new google.maps.LatLng(24.8099252, -107.4575455);
            const stanza_toscana_culiacan_sinaloaMarkerClass = createZillowPropertyMarker(stanza_toscana_culiacan_sinaloaProperty, window.mapCuliacan);
            const stanza_toscana_culiacan_sinaloaMarker = new stanza_toscana_culiacan_sinaloaMarkerClass(stanza_toscana_culiacan_sinaloaPosition, window.mapCuliacan, stanza_toscana_culiacan_sinaloaProperty);
            window.allCuliacanMarkers.push(stanza_toscana_culiacan_sinaloaMarker);
            console.log('Marcador Stanza Toscana Culiacan Sinaloa (VENTA) creado en:', stanza_toscana_culiacan_sinaloaPosition.lat(), stanza_toscana_culiacan_sinaloaPosition.lng());

            // Casa en Fraccionamiento Canaco - Coordenadas finales (geocoder)
            const casa_en_fraccionamiento_canacoPosition = new google.maps.LatLng(24.822311, -107.4240634);
            const casa_en_fraccionamiento_canacoMarkerClass = createZillowPropertyMarker(casa_en_fraccionamiento_canacoProperty, window.mapCuliacan);
            const casa_en_fraccionamiento_canacoMarker = new casa_en_fraccionamiento_canacoMarkerClass(casa_en_fraccionamiento_canacoPosition, window.mapCuliacan, casa_en_fraccionamiento_canacoProperty);
            window.allCuliacanMarkers.push(casa_en_fraccionamiento_canacoMarker);
            console.log('Marcador Casa en Fraccionamiento Canaco (VENTA) creado en:', casa_en_fraccionamiento_canacoPosition.lat(), casa_en_fraccionamiento_canacoPosition.lng());

            // Casa en Pueblo Imala - Coordenadas finales (geocoder)
            const casa_en_pueblo_imalaPosition = new google.maps.LatLng(24.8116349, -107.3949408);
            const casa_en_pueblo_imalaMarkerClass = createZillowPropertyMarker(casa_en_pueblo_imalaProperty, window.mapCuliacan);
            const casa_en_pueblo_imalaMarker = new casa_en_pueblo_imalaMarkerClass(casa_en_pueblo_imalaPosition, window.mapCuliacan, casa_en_pueblo_imalaProperty);
            window.allCuliacanMarkers.push(casa_en_pueblo_imalaMarker);
            console.log('Marcador Casa en Pueblo Imala (VENTA) creado en:', casa_en_pueblo_imalaPosition.lat(), casa_en_pueblo_imalaPosition.lng());

            // Estrena Casa con Acabados de Lujo - Coordenadas finales (geocoder)
            const estrena_casa_con_acabados_de_lujoPosition = new google.maps.LatLng(24.8116349, -107.3949408);
            const estrena_casa_con_acabados_de_lujoMarkerClass = createZillowPropertyMarker(estrena_casa_con_acabados_de_lujoProperty, window.mapCuliacan);
            const estrena_casa_con_acabados_de_lujoMarker = new estrena_casa_con_acabados_de_lujoMarkerClass(estrena_casa_con_acabados_de_lujoPosition, window.mapCuliacan, estrena_casa_con_acabados_de_lujoProperty);
            window.allCuliacanMarkers.push(estrena_casa_con_acabados_de_lujoMarker);
            console.log('Marcador Estrena Casa con Acabados de Lujo (VENTA) creado en:', estrena_casa_con_acabados_de_lujoPosition.lat(), estrena_casa_con_acabados_de_lujoPosition.lng());

            // Casa en Venta Residencial con Alberca en Real del Valle Mazatlan - Coordenadas finales (geocoder)
            const casa_en_venta_residencial_con_alberca_en_real_del_valle_mazaPosition = new google.maps.LatLng(24.8091, -107.394);
            const casa_en_venta_residencial_con_alberca_en_real_del_valle_mazaMarkerClass = createZillowPropertyMarker(casa_en_venta_residencial_con_alberca_en_real_del_valle_mazaProperty, window.mapCuliacan);
            const casa_en_venta_residencial_con_alberca_en_real_del_valle_mazaMarker = new casa_en_venta_residencial_con_alberca_en_real_del_valle_mazaMarkerClass(casa_en_venta_residencial_con_alberca_en_real_del_valle_mazaPosition, window.mapCuliacan, casa_en_venta_residencial_con_alberca_en_real_del_valle_mazaProperty);
            window.allCuliacanMarkers.push(casa_en_venta_residencial_con_alberca_en_real_del_valle_mazaMarker);
            console.log('Marcador Casa en Venta Residencial con Alberca en Real del Valle Mazatlan (VENTA) creado en:', casa_en_venta_residencial_con_alberca_en_real_del_valle_mazaPosition.lat(), casa_en_venta_residencial_con_alberca_en_real_del_valle_mazaPosition.lng());

            // Casa en Venta de Real del Valle Coto 14 - Coordenadas finales (geocoder)
            const casa_en_venta_de_real_del_valle_coto_14Position = new google.maps.LatLng(24.8090649, -107.3940117);
            const casa_en_venta_de_real_del_valle_coto_14MarkerClass = createZillowPropertyMarker(casa_en_venta_de_real_del_valle_coto_14Property, window.mapCuliacan);
            const casa_en_venta_de_real_del_valle_coto_14Marker = new casa_en_venta_de_real_del_valle_coto_14MarkerClass(casa_en_venta_de_real_del_valle_coto_14Position, window.mapCuliacan, casa_en_venta_de_real_del_valle_coto_14Property);
            window.allCuliacanMarkers.push(casa_en_venta_de_real_del_valle_coto_14Marker);
            console.log('Marcador Casa en Venta de Real del Valle Coto 14 (VENTA) creado en:', casa_en_venta_de_real_del_valle_coto_14Position.lat(), casa_en_venta_de_real_del_valle_coto_14Position.lng());

            // Casa de 3 Recámaras y 160 m² en Venta, Valle del Ejido - Coordenadas finales (geocoder)
            const casa_de_3_recamaras_y_160_m_en_venta_valle_del_ejidoPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const casa_de_3_recamaras_y_160_m_en_venta_valle_del_ejidoMarkerClass = createZillowPropertyMarker(casa_de_3_recamaras_y_160_m_en_venta_valle_del_ejidoProperty, window.mapCuliacan);
            const casa_de_3_recamaras_y_160_m_en_venta_valle_del_ejidoMarker = new casa_de_3_recamaras_y_160_m_en_venta_valle_del_ejidoMarkerClass(casa_de_3_recamaras_y_160_m_en_venta_valle_del_ejidoPosition, window.mapCuliacan, casa_de_3_recamaras_y_160_m_en_venta_valle_del_ejidoProperty);
            window.allCuliacanMarkers.push(casa_de_3_recamaras_y_160_m_en_venta_valle_del_ejidoMarker);
            console.log('Marcador Casa de 3 Recámaras y 160 m² en Venta, Valle del Ejido (VENTA) creado en:', casa_de_3_recamaras_y_160_m_en_venta_valle_del_ejidoPosition.lat(), casa_de_3_recamaras_y_160_m_en_venta_valle_del_ejidoPosition.lng());

            // Casa de Venta en Rincon de Los Girasoles en Fracc Rincon de Las Plazas - Coordenadas finales (geocoder)
            const casa_de_venta_en_rincon_de_los_girasoles_en_fracc_rincon_de_Position = new google.maps.LatLng(24.8091, -107.394);
            const casa_de_venta_en_rincon_de_los_girasoles_en_fracc_rincon_de_MarkerClass = createZillowPropertyMarker(casa_de_venta_en_rincon_de_los_girasoles_en_fracc_rincon_de_Property, window.mapCuliacan);
            const casa_de_venta_en_rincon_de_los_girasoles_en_fracc_rincon_de_Marker = new casa_de_venta_en_rincon_de_los_girasoles_en_fracc_rincon_de_MarkerClass(casa_de_venta_en_rincon_de_los_girasoles_en_fracc_rincon_de_Position, window.mapCuliacan, casa_de_venta_en_rincon_de_los_girasoles_en_fracc_rincon_de_Property);
            window.allCuliacanMarkers.push(casa_de_venta_en_rincon_de_los_girasoles_en_fracc_rincon_de_Marker);
            console.log('Marcador Casa de Venta en Rincon de Los Girasoles en Fracc Rincon de Las Plazas (VENTA) creado en:', casa_de_venta_en_rincon_de_los_girasoles_en_fracc_rincon_de_Position.lat(), casa_de_venta_en_rincon_de_los_girasoles_en_fracc_rincon_de_Position.lng());

            // Casa en Venta Real del Valle - Coordenadas finales (geocoder)
            const casa_en_venta_real_del_vallePosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const casa_en_venta_real_del_valleMarkerClass = createZillowPropertyMarker(casa_en_venta_real_del_valleProperty, window.mapCuliacan);
            const casa_en_venta_real_del_valleMarker = new casa_en_venta_real_del_valleMarkerClass(casa_en_venta_real_del_vallePosition, window.mapCuliacan, casa_en_venta_real_del_valleProperty);
            window.allCuliacanMarkers.push(casa_en_venta_real_del_valleMarker);
            console.log('Marcador Casa en Venta Real del Valle (VENTA) creado en:', casa_en_venta_real_del_vallePosition.lat(), casa_en_venta_real_del_vallePosition.lng());

            // Casa en Cnop - Coordenadas finales (geocoder)
            const casa_en_cnopPosition = new google.maps.LatLng(24.7721132, -107.3746854);
            const casa_en_cnopMarkerClass = createZillowPropertyMarker(casa_en_cnopProperty, window.mapCuliacan);
            const casa_en_cnopMarker = new casa_en_cnopMarkerClass(casa_en_cnopPosition, window.mapCuliacan, casa_en_cnopProperty);
            window.allCuliacanMarkers.push(casa_en_cnopMarker);
            console.log('Marcador Casa en Cnop (VENTA) creado en:', casa_en_cnopPosition.lat(), casa_en_cnopPosition.lng());

            // solidaridad - Blvrd Elbert 2609, Infonavit Solidaridad, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const solidaridadPosition = new google.maps.LatLng(24.824491, -107.4287297);
            const solidaridadMarkerClass = createZillowPropertyMarker(solidaridadProperty, window.mapCuliacan);
            const solidaridadMarker = new solidaridadMarkerClass(solidaridadPosition, window.mapCuliacan, solidaridadProperty);
            window.allCuliacanMarkers.push(solidaridadMarker);
            console.log('Marcador solidaridad creado en:', solidaridadPosition.lat(), solidaridadPosition.lng());

            // laPrimavera - San Agustín 266, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const laPrimaveraPosition = new google.maps.LatLng(24.7405444, -107.397057);
            const laPrimaveraMarkerClass = createZillowPropertyMarker(laPrimaveraProperty, window.mapCuliacan);
            const laPrimaveraMarker = new laPrimaveraMarkerClass(laPrimaveraPosition, window.mapCuliacan, laPrimaveraProperty);
            window.allCuliacanMarkers.push(laPrimaveraMarker);
            console.log('Marcador laPrimavera creado en:', laPrimaveraPosition.lat(), laPrimaveraPosition.lng());
            
            // monaco - Paseos del Rey, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const monacoPosition = new google.maps.LatLng(24.7876722, -107.4404946);
            const monacoMarkerClass = createZillowPropertyMarker(monacoProperty, window.mapCuliacan);
            const monacoMarker = new monacoMarkerClass(monacoPosition, window.mapCuliacan, monacoProperty);
            window.allCuliacanMarkers.push(monacoMarker);
            console.log('Marcador monaco creado en:', monacoPosition.lat(), monacoPosition.lng());
            
            // amorada - Amorada, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const amoradaPosition = new google.maps.LatLng(24.8326627, -107.3688748);
            const amoradaMarkerClass = createZillowPropertyMarker(amoradaProperty, window.mapCuliacan);
            const amoradaMarker = new amoradaMarkerClass(amoradaPosition, window.mapCuliacan, amoradaProperty);
            window.allCuliacanMarkers.push(amoradaMarker);
            console.log('Marcador amorada creado en:', amoradaPosition.lat(), amoradaPosition.lng());
            
            // stanza - Fraccionamiento Stanza, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const stanzaPosition = new google.maps.LatLng(24.7621964, -107.395938);
            const stanzaMarkerClass = createZillowPropertyMarker(stanzaProperty, window.mapCuliacan);
            const stanzaMarker = new stanzaMarkerClass(stanzaPosition, window.mapCuliacan, stanzaProperty);
            window.allCuliacanMarkers.push(stanzaMarker);
            console.log('Marcador stanza creado en:', stanzaPosition.lat(), stanzaPosition.lng());
            
            // privadaLaCantera - Privada La Cantera, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const privadaLaCanteraPosition = new google.maps.LatLng(24.8408223, -107.3868425);
            const privadaLaCanteraMarkerClass = createZillowPropertyMarker(privadaLaCanteraProperty, window.mapCuliacan);
            const privadaLaCanteraMarker = new privadaLaCanteraMarkerClass(privadaLaCanteraPosition, window.mapCuliacan, privadaLaCanteraProperty);
            window.allCuliacanMarkers.push(privadaLaCanteraMarker);
            console.log('Marcador privadaLaCantera creado en:', privadaLaCanteraPosition.lat(), privadaLaCanteraPosition.lng());
            
            // islaDelOeste - Isla del Oeste, La Primavera, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const islaDelOestePosition = new google.maps.LatLng(24.7364311, -107.3948625);
            const islaDelOesteMarkerClass = createZillowPropertyMarker(islaDelOesteProperty, window.mapCuliacan);
            const islaDelOesteMarker = new islaDelOesteMarkerClass(islaDelOestePosition, window.mapCuliacan, islaDelOesteProperty);
            window.allCuliacanMarkers.push(islaDelOesteMarker);
            console.log('Marcador islaDelOeste creado en:', islaDelOestePosition.lat(), islaDelOestePosition.lng());
            
            // stanzaGranada - Stanza Granada, Salida Norte, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const stanzaGranadaPosition = new google.maps.LatLng(24.8337898, -107.4305733);
            const stanzaGranadaMarkerClass = createZillowPropertyMarker(stanzaGranadaProperty, window.mapCuliacan);
            const stanzaGranadaMarker = new stanzaGranadaMarkerClass(stanzaGranadaPosition, window.mapCuliacan, stanzaGranadaProperty);
            window.allCuliacanMarkers.push(stanzaGranadaMarker);
            console.log('Marcador stanzaGranada creado en:', stanzaGranadaPosition.lat(), stanzaGranadaPosition.lng());
            
            // stanzaCorcega - Stanza Corcega A2, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const stanzaCorcegaPosition = new google.maps.LatLng(24.7428787, -107.3831794);
            const stanzaCorcegaMarkerClass = createZillowPropertyMarker(stanzaCorcegaProperty, window.mapCuliacan);
            const stanzaCorcegaMarker = new stanzaCorcegaMarkerClass(stanzaCorcegaPosition, window.mapCuliacan, stanzaCorcegaProperty);
            window.allCuliacanMarkers.push(stanzaCorcegaMarker);
            console.log('Marcador stanzaCorcega creado en:', stanzaCorcegaPosition.lat(), stanzaCorcegaPosition.lng());
            
            // villasDelRio - Villas del Río Elite, Zona Norte, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const villasDelRioPosition = new google.maps.LatLng(24.807644, -107.4506798);
            const villasDelRioMarkerClass = createZillowPropertyMarker(villasDelRioProperty, window.mapCuliacan);
            const villasDelRioMarker = new villasDelRioMarkerClass(villasDelRioPosition, window.mapCuliacan, villasDelRioProperty);
            window.allCuliacanMarkers.push(villasDelRioMarker);
            console.log('Marcador villasDelRio creado en:', villasDelRioPosition.lat(), villasDelRioPosition.lng());
            
            // urbivilla - Urbivilla, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const urbivillaPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const urbivillaMarkerClass = createZillowPropertyMarker(urbivillaProperty, window.mapCuliacan);
            const urbivillaMarker = new urbivillaMarkerClass(urbivillaPosition, window.mapCuliacan, urbivillaProperty);
            window.allCuliacanMarkers.push(urbivillaMarker);
            console.log('Marcador urbivilla creado en:', urbivillaPosition.lat(), urbivillaPosition.lng());
            
            // sectorAeropuerto - Sector Aeropuerto, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const sectorAeropuertoPosition = new google.maps.LatLng(24.7761059, -107.4743411);
            const sectorAeropuertoMarkerClass = createZillowPropertyMarker(sectorAeropuertoProperty, window.mapCuliacan);
            const sectorAeropuertoMarker = new sectorAeropuertoMarkerClass(sectorAeropuertoPosition, window.mapCuliacan, sectorAeropuertoProperty);
            window.allCuliacanMarkers.push(sectorAeropuertoMarker);
            console.log('Marcador sectorAeropuerto creado en:', sectorAeropuertoPosition.lat(), sectorAeropuertoPosition.lng());
            
            // nuevoCuliacan - Nuevo Culiacán, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const nuevoCuliacanPosition = new google.maps.LatLng(24.7854968, -107.4077992);
            const nuevoCuliacanMarkerClass = createZillowPropertyMarker(nuevoCuliacanProperty, window.mapCuliacan);
            const nuevoCuliacanMarker = new nuevoCuliacanMarkerClass(nuevoCuliacanPosition, window.mapCuliacan, nuevoCuliacanProperty);
            window.allCuliacanMarkers.push(nuevoCuliacanMarker);
            console.log('Marcador nuevoCuliacan creado en:', nuevoCuliacanPosition.lat(), nuevoCuliacanPosition.lng());
            
            // vallesDelSol - Valles del Sol, Sector Terranova, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const vallesDelSolPosition = new google.maps.LatLng(24.7541715, -107.4578518);
            const vallesDelSolMarkerClass = createZillowPropertyMarker(vallesDelSolProperty, window.mapCuliacan);
            const vallesDelSolMarker = new vallesDelSolMarkerClass(vallesDelSolPosition, window.mapCuliacan, vallesDelSolProperty);
            window.allCuliacanMarkers.push(vallesDelSolMarker);
            console.log('Marcador vallesDelSol creado en:', vallesDelSolPosition.lat(), vallesDelSolPosition.lng());
            
            // infbarrancos - Inf. Barrancos, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const infbarrancosPosition = new google.maps.LatLng(24.7553976, -107.4314566);
            const infbarrancosMarkerClass = createZillowPropertyMarker(infbarrancosProperty, window.mapCuliacan);
            const infbarrancosMarker = new infbarrancosMarkerClass(infbarrancosPosition, window.mapCuliacan, infbarrancosProperty);
            window.allCuliacanMarkers.push(infbarrancosMarker);
            console.log('Marcador infbarrancos creado en:', infbarrancosPosition.lat(), infbarrancosPosition.lng());
            

            // fraccionamientostanza - Sinaloa, Culiacán - Coordenadas finales (hardcoded)
            const fraccionamientostanzaPosition = new google.maps.LatLng(25.1721091, -107.4795173);
            const fraccionamientostanzaMarkerClass = createZillowPropertyMarker(fraccionamientostanzaProperty, window.mapCuliacan);
            const fraccionamientostanzaMarker = new fraccionamientostanzaMarkerClass(fraccionamientostanzaPosition, window.mapCuliacan, fraccionamientostanzaProperty);
            window.allCuliacanMarkers.push(fraccionamientostanzaMarker);
            console.log('Marcador fraccionamientostanza creado en:', fraccionamientostanzaPosition.lat(), fraccionamientostanzaPosition.lng());

            // lasamericasbr56 - Las Américas, Culiacán - Coordenadas finales (hardcoded)
            const lasamericasbr56Position = new google.maps.LatLng(24.8460553, -107.3845135);
            const lasamericasbr56MarkerClass = createZillowPropertyMarker(lasamericasbr56Property, window.mapCuliacan);
            const lasamericasbr56Marker = new lasamericasbr56MarkerClass(lasamericasbr56Position, window.mapCuliacan, lasamericasbr56Property);
            window.allCuliacanMarkers.push(lasamericasbr56Marker);
            console.log('Marcador lasamericasbr56 creado en:', lasamericasbr56Position.lat(), lasamericasbr56Position.lng());

            // adolfolopezmateos - Sinaloa, Culiacán - Coordenadas finales (hardcoded)
            const adolfolopezmateosPosition = new google.maps.LatLng(25.1721091, -107.4795173);
            const adolfolopezmateosMarkerClass = createZillowPropertyMarker(adolfolopezmateosProperty, window.mapCuliacan);
            const adolfolopezmateosMarker = new adolfolopezmateosMarkerClass(adolfolopezmateosPosition, window.mapCuliacan, adolfolopezmateosProperty);
            window.allCuliacanMarkers.push(adolfolopezmateosMarker);
            console.log('Marcador adolfolopezmateos creado en:', adolfolopezmateosPosition.lat(), adolfolopezmateosPosition.lng());

            // privadamonacopaseosdelrey - Paseos del Rey, Sinaloa, Culiacán - Coordenadas finales (hardcoded)
            const privadamonacopaseosdelreyPosition = new google.maps.LatLng(24.7655839, -107.4371668);
            const privadamonacopaseosdelreyMarkerClass = createZillowPropertyMarker(privadamonacopaseosdelreyProperty, window.mapCuliacan);
            const privadamonacopaseosdelreyMarker = new privadamonacopaseosdelreyMarkerClass(privadamonacopaseosdelreyPosition, window.mapCuliacan, privadamonacopaseosdelreyProperty);
            window.allCuliacanMarkers.push(privadamonacopaseosdelreyMarker);
            console.log('Marcador privadamonacopaseosdelrey creado en:', privadamonacopaseosdelreyPosition.lat(), privadamonacopaseosdelreyPosition.lng());

            // recamarasenportalegreenculiacan - Fraccionamiento Portalegre, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const recamarasenportalegreenculiacanPosition = new google.maps.LatLng(24.8254885, -107.4435453);
            const recamarasenportalegreenculiacanMarkerClass = createZillowPropertyMarker(recamarasenportalegreenculiacanProperty, window.mapCuliacan);
            const recamarasenportalegreenculiacanMarker = new recamarasenportalegreenculiacanMarkerClass(recamarasenportalegreenculiacanPosition, window.mapCuliacan, recamarasenportalegreenculiacanProperty);
            window.allCuliacanMarkers.push(recamarasenportalegreenculiacanMarker);
            console.log('Marcador recamarasenportalegreenculiacan creado en:', recamarasenportalegreenculiacanPosition.lat(), recamarasenportalegreenculiacanPosition.lng());


            // callemarianoescobedocentrodelaciudad - Culiacan - Coordenadas finales (hardcoded)
            const callemarianoescobedocentrodelaciudadPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const callemarianoescobedocentrodelaciudadMarkerClass = createZillowPropertyMarker(callemarianoescobedocentrodelaciudadProperty, window.mapCuliacan);
            const callemarianoescobedocentrodelaciudadMarker = new callemarianoescobedocentrodelaciudadMarkerClass(callemarianoescobedocentrodelaciudadPosition, window.mapCuliacan, callemarianoescobedocentrodelaciudadProperty);
            window.allCuliacanMarkers.push(callemarianoescobedocentrodelaciudadMarker);
            console.log('Marcador callemarianoescobedocentrodelaciudad creado en:', callemarianoescobedocentrodelaciudadPosition.lat(), callemarianoescobedocentrodelaciudadPosition.lng());

            // lacanteraculiacan - La Cantera, Culiacán - Coordenadas finales (hardcoded)
            const lacanteraculiacanPosition = new google.maps.LatLng(24.8000572, -107.4349268);
            const lacanteraculiacanMarkerClass = createZillowPropertyMarker(lacanteraculiacanProperty, window.mapCuliacan);
            const lacanteraculiacanMarker = new lacanteraculiacanMarkerClass(lacanteraculiacanPosition, window.mapCuliacan, lacanteraculiacanProperty);
            window.allCuliacanMarkers.push(lacanteraculiacanMarker);
            console.log('Marcador lacanteraculiacan creado en:', lacanteraculiacanPosition.lat(), lacanteraculiacanPosition.lng());

            // enlaprimaverabarriosanfranciscosur01 - Barrio San Francisco, Culiacán - Coordenadas finales (hardcoded)
            const enlaprimaverabarriosanfranciscosur01Position = new google.maps.LatLng(24.7372507, -107.4000371);
            const enlaprimaverabarriosanfranciscosur01MarkerClass = createZillowPropertyMarker(enlaprimaverabarriosanfranciscosur01Property, window.mapCuliacan);
            const enlaprimaverabarriosanfranciscosur01Marker = new enlaprimaverabarriosanfranciscosur01MarkerClass(enlaprimaverabarriosanfranciscosur01Position, window.mapCuliacan, enlaprimaverabarriosanfranciscosur01Property);
            window.allCuliacanMarkers.push(enlaprimaverabarriosanfranciscosur01Marker);
            console.log('Marcador enlaprimaverabarriosanfranciscosur01 creado en:', enlaprimaverabarriosanfranciscosur01Position.lat(), enlaprimaverabarriosanfranciscosur01Position.lng());

            // enfracccolinasdesanmiguel - Cerro De La Memoria 1907, Culiacán - Coordenadas finales (hardcoded)
            const enfracccolinasdesanmiguelPosition = new google.maps.LatLng(24.7820511, -107.397574);
            const enfracccolinasdesanmiguelMarkerClass = createZillowPropertyMarker(enfracccolinasdesanmiguelProperty, window.mapCuliacan);
            const enfracccolinasdesanmiguelMarker = new enfracccolinasdesanmiguelMarkerClass(enfracccolinasdesanmiguelPosition, window.mapCuliacan, enfracccolinasdesanmiguelProperty);
            window.allCuliacanMarkers.push(enfracccolinasdesanmiguelMarker);
            console.log('Marcador enfracccolinasdesanmiguel creado en:', enfracccolinasdesanmiguelPosition.lat(), enfracccolinasdesanmiguelPosition.lng());

            // enprivadaconexcedente4recamarassectorlaconquista - La Conquista, Culiacán - Coordenadas finales (hardcoded)
            const enprivadaconexcedente4recamarassectorlaconquistaPosition = new google.maps.LatLng(24.8207681, -107.439959);
            const enprivadaconexcedente4recamarassectorlaconquistaMarkerClass = createZillowPropertyMarker(enprivadaconexcedente4recamarassectorlaconquistaProperty, window.mapCuliacan);
            const enprivadaconexcedente4recamarassectorlaconquistaMarker = new enprivadaconexcedente4recamarassectorlaconquistaMarkerClass(enprivadaconexcedente4recamarassectorlaconquistaPosition, window.mapCuliacan, enprivadaconexcedente4recamarassectorlaconquistaProperty);
            window.allCuliacanMarkers.push(enprivadaconexcedente4recamarassectorlaconquistaMarker);
            console.log('Marcador enprivadaconexcedente4recamarassectorlaconquista creado en:', enprivadaconexcedente4recamarassectorlaconquistaPosition.lat(), enprivadaconexcedente4recamarassectorlaconquistaPosition.lng());


            // Tierra Blanca - usar coordenadas directas (Geocoder V1.5)
            const tierrablancaPosition = new google.maps.LatLng(tierrablancaProperty.lat, tierrablancaProperty.lng);
            const tierrablancaMarkerClass = createZillowPropertyMarker(tierrablancaProperty, window.mapCuliacan);
            const tierrablancaMarker = new tierrablancaMarkerClass(tierrablancaPosition, window.mapCuliacan, tierrablancaProperty);
            window.allCuliacanMarkers.push(tierrablancaMarker);
            console.log('Marcador Tierra Blanca creado en:', tierrablancaProperty.lat, tierrablancaProperty.lng);

            // privadaconalbercaamorada - Amorada, Culiacán - Coordenadas finales (hardcoded)
            const privadaconalbercaamoradaPosition = new google.maps.LatLng(24.8326627, -107.3688748);
            const privadaconalbercaamoradaMarkerClass = createZillowPropertyMarker(privadaconalbercaamoradaProperty, window.mapCuliacan);
            const privadaconalbercaamoradaMarker = new privadaconalbercaamoradaMarkerClass(privadaconalbercaamoradaPosition, window.mapCuliacan, privadaconalbercaamoradaProperty);
            window.allCuliacanMarkers.push(privadaconalbercaamoradaMarker);
            console.log('Marcador privadaconalbercaamorada creado en:', privadaconalbercaamoradaPosition.lat(), privadaconalbercaamoradaPosition.lng());

            // fracclaprimavera - San Agustín 266, Culiacán - Coordenadas finales (hardcoded)
            const fracclaprimaveraPosition = new google.maps.LatLng(24.7405444, -107.397057);
            const fracclaprimaveraMarkerClass = createZillowPropertyMarker(fracclaprimaveraProperty, window.mapCuliacan);
            const fracclaprimaveraMarker = new fracclaprimaveraMarkerClass(fracclaprimaveraPosition, window.mapCuliacan, fracclaprimaveraProperty);
            window.allCuliacanMarkers.push(fracclaprimaveraMarker);
            console.log('Marcador fracclaprimavera creado en:', fracclaprimaveraPosition.lat(), fracclaprimaveraPosition.lng());

            // barriosanfranciscolaprimavera01 - San Francisco, Culiacán - Coordenadas finales (hardcoded)
            const barriosanfranciscolaprimavera01Position = new google.maps.LatLng(24.8637916, -107.449201);
            const barriosanfranciscolaprimavera01MarkerClass = createZillowPropertyMarker(barriosanfranciscolaprimavera01Property, window.mapCuliacan);
            const barriosanfranciscolaprimavera01Marker = new barriosanfranciscolaprimavera01MarkerClass(barriosanfranciscolaprimavera01Position, window.mapCuliacan, barriosanfranciscolaprimavera01Property);
            window.allCuliacanMarkers.push(barriosanfranciscolaprimavera01Marker);
            console.log('Marcador barriosanfranciscolaprimavera01 creado en:', barriosanfranciscolaprimavera01Position.lat(), barriosanfranciscolaprimavera01Position.lng());

            // privadatabachines - Culiacan - Coordenadas finales (hardcoded)
            const privadatabachinesPosition = new google.maps.LatLng(24.8090649, -107.3940117);
            const privadatabachinesMarkerClass = createZillowPropertyMarker(privadatabachinesProperty, window.mapCuliacan);
            const privadatabachinesMarker = new privadatabachinesMarkerClass(privadatabachinesPosition, window.mapCuliacan, privadatabachinesProperty);
            window.allCuliacanMarkers.push(privadatabachinesMarker);
            console.log('Marcador privadatabachines creado en:', privadatabachinesPosition.lat(), privadatabachinesPosition.lng());


            // barcelonacomonuevaacabadosdeprimera - Gerona 3057, Culiacán - Coordenadas finales (hardcoded)
            const barcelonacomonuevaacabadosdeprimeraPosition = new google.maps.LatLng(24.8325874, -107.4357423);
            const barcelonacomonuevaacabadosdeprimeraMarkerClass = createZillowPropertyMarker(barcelonacomonuevaacabadosdeprimeraProperty, window.mapCuliacan);
            const barcelonacomonuevaacabadosdeprimeraMarker = new barcelonacomonuevaacabadosdeprimeraMarkerClass(barcelonacomonuevaacabadosdeprimeraPosition, window.mapCuliacan, barcelonacomonuevaacabadosdeprimeraProperty);
            window.allCuliacanMarkers.push(barcelonacomonuevaacabadosdeprimeraMarker);
            console.log('Marcador barcelonacomonuevaacabadosdeprimera creado en:', barcelonacomonuevaacabadosdeprimeraPosition.lat(), barcelonacomonuevaacabadosdeprimeraPosition.lng());

            // quintaamericanasectorlasquintas - Las Quintas, Culiacán - Coordenadas finales (hardcoded)
            const quintaamericanasectorlasquintasPosition = new google.maps.LatLng(24.8131513, -107.3745346);
            const quintaamericanasectorlasquintasMarkerClass = createZillowPropertyMarker(quintaamericanasectorlasquintasProperty, window.mapCuliacan);
            const quintaamericanasectorlasquintasMarker = new quintaamericanasectorlasquintasMarkerClass(quintaamericanasectorlasquintasPosition, window.mapCuliacan, quintaamericanasectorlasquintasProperty);
            window.allCuliacanMarkers.push(quintaamericanasectorlasquintasMarker);
            console.log('Marcador quintaamericanasectorlasquintas creado en:', quintaamericanasectorlasquintasPosition.lat(), quintaamericanasectorlasquintasPosition.lng());

            // islamusalaculiacan - Isla Musalá, Culiacán - Coordenadas finales (hardcoded)
            const islamusalaculiacanPosition = new google.maps.LatLng(24.8224699, -107.3686214);
            const islamusalaculiacanMarkerClass = createZillowPropertyMarker(islamusalaculiacanProperty, window.mapCuliacan);
            const islamusalaculiacanMarker = new islamusalaculiacanMarkerClass(islamusalaculiacanPosition, window.mapCuliacan, islamusalaculiacanProperty);
            window.allCuliacanMarkers.push(islamusalaculiacanMarker);
            console.log('Marcador islamusalaculiacan creado en:', islamusalaculiacanPosition.lat(), islamusalaculiacanPosition.lng());

            // recursoshidraulicosprivadasantaines - Recursos Hidráulicos, Culiacán - Coordenadas finales (hardcoded)
            const recursoshidraulicosprivadasantainesPosition = new google.maps.LatLng(24.8069917, -107.4071596);
            const recursoshidraulicosprivadasantainesMarkerClass = createZillowPropertyMarker(recursoshidraulicosprivadasantainesProperty, window.mapCuliacan);
            const recursoshidraulicosprivadasantainesMarker = new recursoshidraulicosprivadasantainesMarkerClass(recursoshidraulicosprivadasantainesPosition, window.mapCuliacan, recursoshidraulicosprivadasantainesProperty);
            window.allCuliacanMarkers.push(recursoshidraulicosprivadasantainesMarker);
            console.log('Marcador recursoshidraulicosprivadasantaines creado en:', recursoshidraulicosprivadasantainesPosition.lat(), recursoshidraulicosprivadasantainesPosition.lng());

            // hermosabelcanttoresidenciallistaparahabitar - Belcantto Residencial - Privada Aprico, Culiacán - Coordenadas finales (hardcoded)
            const hermosabelcanttoresidenciallistaparahabitarPosition = new google.maps.LatLng(24.7404914, -107.4288212);
            const hermosabelcanttoresidenciallistaparahabitarMarkerClass = createZillowPropertyMarker(hermosabelcanttoresidenciallistaparahabitarProperty, window.mapCuliacan);
            const hermosabelcanttoresidenciallistaparahabitarMarker = new hermosabelcanttoresidenciallistaparahabitarMarkerClass(hermosabelcanttoresidenciallistaparahabitarPosition, window.mapCuliacan, hermosabelcanttoresidenciallistaparahabitarProperty);
            window.allCuliacanMarkers.push(hermosabelcanttoresidenciallistaparahabitarMarker);
            console.log('Marcador hermosabelcanttoresidenciallistaparahabitar creado en:', hermosabelcanttoresidenciallistaparahabitarPosition.lat(), hermosabelcanttoresidenciallistaparahabitarPosition.lng());


            // islamusalaculiacansinaloa - La Isla Musalá, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const islamusalaculiacansinaloaPosition = new google.maps.LatLng(24.8224699, -107.3686214);
            const islamusalaculiacansinaloaMarkerClass = createZillowPropertyMarker(islamusalaculiacansinaloaProperty, window.mapCuliacan);
            const islamusalaculiacansinaloaMarker = new islamusalaculiacansinaloaMarkerClass(islamusalaculiacansinaloaPosition, window.mapCuliacan, islamusalaculiacansinaloaProperty);
            window.allCuliacanMarkers.push(islamusalaculiacansinaloaMarker);
            console.log('Marcador islamusalaculiacansinaloa creado en:', islamusalaculiacansinaloaPosition.lat(), islamusalaculiacansinaloaPosition.lng());

            // guadalupe - Guadalupe, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const guadalupePosition = new google.maps.LatLng(24.7934562, -107.3952321);
            const guadalupeMarkerClass = createZillowPropertyMarker(guadalupeProperty, window.mapCuliacan);
            const guadalupeMarker = new guadalupeMarkerClass(guadalupePosition, window.mapCuliacan, guadalupeProperty);
            window.allCuliacanMarkers.push(guadalupeMarker);
            console.log('Marcador guadalupe creado en:', guadalupePosition.lat(), guadalupePosition.lng());

            // privadaprivanzas - Privada Privanzas, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const privadaprivanzasPosition = new google.maps.LatLng(24.8025481, -107.4164226);
            const privadaprivanzasMarkerClass = createZillowPropertyMarker(privadaprivanzasProperty, window.mapCuliacan);
            const privadaprivanzasMarker = new privadaprivanzasMarkerClass(privadaprivanzasPosition, window.mapCuliacan, privadaprivanzasProperty);
            window.allCuliacanMarkers.push(privadaprivanzasMarker);
            console.log('Marcador privadaprivanzas creado en:', privadaprivanzasPosition.lat(), privadaprivanzasPosition.lng());

            // colinassanmiguelculiacan8450000 - Fraccionamiento Colinas de San Miguel, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const colinassanmiguelculiacan8450000Position = new google.maps.LatLng(24.7634181, -107.3970452);
            const colinassanmiguelculiacan8450000MarkerClass = createZillowPropertyMarker(colinassanmiguelculiacan8450000Property, window.mapCuliacan);
            const colinassanmiguelculiacan8450000Marker = new colinassanmiguelculiacan8450000MarkerClass(colinassanmiguelculiacan8450000Position, window.mapCuliacan, colinassanmiguelculiacan8450000Property);
            window.allCuliacanMarkers.push(colinassanmiguelculiacan8450000Marker);
            console.log('Marcador colinassanmiguelculiacan8450000 creado en:', colinassanmiguelculiacan8450000Position.lat(), colinassanmiguelculiacan8450000Position.lng());

            // villafontanaenesquina - Villa Fontana, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const villafontanaenesquinaPosition = new google.maps.LatLng(24.8357983, -107.4163008);
            const villafontanaenesquinaMarkerClass = createZillowPropertyMarker(villafontanaenesquinaProperty, window.mapCuliacan);
            const villafontanaenesquinaMarker = new villafontanaenesquinaMarkerClass(villafontanaenesquinaPosition, window.mapCuliacan, villafontanaenesquinaProperty);
            window.allCuliacanMarkers.push(villafontanaenesquinaMarker);
            console.log('Marcador villafontanaenesquina creado en:', villafontanaenesquinaPosition.lat(), villafontanaenesquinaPosition.lng());

            
            // stanzacastillaprivadaavila - Stanza Castilla, Culiacán - Coordenadas finales (hardcoded)
            const stanzacastillaprivadaavilaPosition = new google.maps.LatLng(24.8267503, -107.4507472);
            const stanzacastillaprivadaavilaMarkerClass = createZillowPropertyMarker(stanzacastillaprivadaavilaProperty, window.mapCuliacan);
            const stanzacastillaprivadaavilaMarker = new stanzacastillaprivadaavilaMarkerClass(stanzacastillaprivadaavilaPosition, window.mapCuliacan, stanzacastillaprivadaavilaProperty);
            window.allCuliacanMarkers.push(stanzacastillaprivadaavilaMarker);
            console.log('Marcador stanzacastillaprivadaavila creado en:', stanzacastillaprivadaavilaPosition.lat(), stanzacastillaprivadaavilaPosition.lng());

            // terrenoexcedentestanzavallealto - Valle Alto, Culiacán - Coordenadas finales (hardcoded)
            const terrenoexcedentestanzavallealtoPosition = new google.maps.LatLng(24.8052781, -107.4625676);
            const terrenoexcedentestanzavallealtoMarkerClass = createZillowPropertyMarker(terrenoexcedentestanzavallealtoProperty, window.mapCuliacan);
            const terrenoexcedentestanzavallealtoMarker = new terrenoexcedentestanzavallealtoMarkerClass(terrenoexcedentestanzavallealtoPosition, window.mapCuliacan, terrenoexcedentestanzavallealtoProperty);
            window.allCuliacanMarkers.push(terrenoexcedentestanzavallealtoMarker);
            console.log('Marcador terrenoexcedentestanzavallealto creado en:', terrenoexcedentestanzavallealtoPosition.lat(), terrenoexcedentestanzavallealtoPosition.lng());

            // portalegremision - Portalegre Misión, Culiacán - Coordenadas finales (hardcoded)
            const portalegremisionPosition = new google.maps.LatLng(24.8310979, -107.4481706);
            const portalegremisionMarkerClass = createZillowPropertyMarker(portalegremisionProperty, window.mapCuliacan);
            const portalegremisionMarker = new portalegremisionMarkerClass(portalegremisionPosition, window.mapCuliacan, portalegremisionProperty);
            window.allCuliacanMarkers.push(portalegremisionMarker);
            console.log('Marcador portalegremision creado en:', portalegremisionPosition.lat(), portalegremisionPosition.lng());

            // carpatosvallealtoCuliacan - Carpatos, Valle Alto, Culiacán - Coordenadas finales (hardcoded)
            const carpatosvallealtoCuliacanPosition = new google.maps.LatLng(24.8052781, -107.4625676);
            const carpatosvallealtoCuliacanMarkerClass = createZillowPropertyMarker(carpatosvallealtoCuliacanProperty, window.mapCuliacan);
            const carpatosvallealtoCuliacanMarker = new carpatosvallealtoCuliacanMarkerClass(carpatosvallealtoCuliacanPosition, window.mapCuliacan, carpatosvallealtoCuliacanProperty);
            window.allCuliacanMarkers.push(carpatosvallealtoCuliacanMarker);
            console.log('Marcador carpatosvallealtoCuliacan creado en:', carpatosvallealtoCuliacanPosition.lat(), carpatosvallealtoCuliacanPosition.lng());


            // barcelonaselect - Villa Barcelona Select, Culiacán - Coordenadas finales (hardcoded)
            const barcelonaselectPosition = new google.maps.LatLng(24.8337327, -107.4332134);
            const barcelonaselectMarkerClass = createZillowPropertyMarker(barcelonaselectProperty, window.mapCuliacan);
            const barcelonaselectMarker = new barcelonaselectMarkerClass(barcelonaselectPosition, window.mapCuliacan, barcelonaselectProperty);
            window.allCuliacanMarkers.push(barcelonaselectMarker);
            console.log('Marcador barcelonaselect creado en:', barcelonaselectPosition.lat(), barcelonaselectPosition.lng());

            // larioja477140 - La Rioja, Culiacán - Coordenadas finales (hardcoded)
            const larioja477140Position = new google.maps.LatLng(24.7591234, -107.451947);
            const larioja477140MarkerClass = createZillowPropertyMarker(larioja477140Property, window.mapCuliacan);
            const larioja477140Marker = new larioja477140MarkerClass(larioja477140Position, window.mapCuliacan, larioja477140Property);
            window.allCuliacanMarkers.push(larioja477140Marker);
            console.log('Marcador larioja477140 creado en:', larioja477140Position.lat(), larioja477140Position.lng());

            // lasmoras421156 - Fraccionamiento Las Moras, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const lasmoras421156Position = new google.maps.LatLng(24.8536475, -107.3518278);
            const lasmoras421156MarkerClass = createZillowPropertyMarker(lasmoras421156Property, window.mapCuliacan);
            const lasmoras421156Marker = new lasmoras421156MarkerClass(lasmoras421156Position, window.mapCuliacan, lasmoras421156Property);
            window.allCuliacanMarkers.push(lasmoras421156Marker);
            console.log('Marcador lasmoras421156 creado en:', lasmoras421156Position.lat(), lasmoras421156Position.lng());

            // sanagustin349077 - Fraccionamiento San Agustín, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const sanagustin349077Position = new google.maps.LatLng(24.7634181, -107.3970452);
            const sanagustin349077MarkerClass = createZillowPropertyMarker(sanagustin349077Property, window.mapCuliacan);
            const sanagustin349077Marker = new sanagustin349077MarkerClass(sanagustin349077Position, window.mapCuliacan, sanagustin349077Property);
            window.allCuliacanMarkers.push(sanagustin349077Marker);
            console.log('Marcador sanagustin349077 creado en:', sanagustin349077Position.lat(), sanagustin349077Position.lng());

            // centro277608 - Colonia Centro, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const centro277608Position = new google.maps.LatLng(24.8090649, -107.3940117);
            const centro277608MarkerClass = createZillowPropertyMarker(centro277608Property, window.mapCuliacan);
            const centro277608Marker = new centro277608MarkerClass(centro277608Position, window.mapCuliacan, centro277608Property);
            window.allCuliacanMarkers.push(centro277608Marker);
            console.log('Marcador centro277608 creado en:', centro277608Position.lat(), centro277608Position.lng());

            // ========== LOTE 10: Geocodificar propiedades 46-50 ==========

            // lomasdelsol1 - Lomas Del Sol, Culiacán - Coordenadas finales (hardcoded)
            const lomasdelsol1Position = new google.maps.LatLng(24.8412577, -107.3856223);
            const lomasdelsol1MarkerClass = createZillowPropertyMarker(lomasdelsol1Property, window.mapCuliacan);
            const lomasdelsol1Marker = new lomasdelsol1MarkerClass(lomasdelsol1Position, window.mapCuliacan, lomasdelsol1Property);
            window.allCuliacanMarkers.push(lomasdelsol1Marker);
            console.log('Marcador lomasdelsol1 creado en:', lomasdelsol1Position.lat(), lomasdelsol1Position.lng());

            // lomasdelsol2 - Lomas Del Sol, Culiacán - Coordenadas finales (hardcoded)
            const lomasdelsol2Position = new google.maps.LatLng(24.8412577, -107.3856223);
            const lomasdelsol2MarkerClass = createZillowPropertyMarker(lomasdelsol2Property, window.mapCuliacan);
            const lomasdelsol2Marker = new lomasdelsol2MarkerClass(lomasdelsol2Position, window.mapCuliacan, lomasdelsol2Property);
            window.allCuliacanMarkers.push(lomasdelsol2Marker);
            console.log('Marcador lomasdelsol2 creado en:', lomasdelsol2Position.lat(), lomasdelsol2Position.lng());

            // nuevoculiacan - Fraccionamiento Nuevo Culiacán, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const nuevoculiacanPosition = new google.maps.LatLng(24.7634181, -107.3970452);
            const nuevoculiacanMarkerClass = createZillowPropertyMarker(nuevoculiacanProperty, window.mapCuliacan);
            const nuevoculiacanMarker = new nuevoculiacanMarkerClass(nuevoculiacanPosition, window.mapCuliacan, nuevoculiacanProperty);
            window.allCuliacanMarkers.push(nuevoculiacanMarker);
            console.log('Marcador nuevoculiacan creado en:', nuevoculiacanPosition.lat(), nuevoculiacanPosition.lng());

            // pradosdelsur - Calle Prados del Sur 2609, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const pradosdelsurPosition = new google.maps.LatLng(24.7513403, -107.3811872);
            const pradosdelsurMarkerClass = createZillowPropertyMarker(pradosdelsurProperty, window.mapCuliacan);
            const pradosdelsurMarker = new pradosdelsurMarkerClass(pradosdelsurPosition, window.mapCuliacan, pradosdelsurProperty);
            window.allCuliacanMarkers.push(pradosdelsurMarker);
            console.log('Marcador pradosdelsur creado en:', pradosdelsurPosition.lat(), pradosdelsurPosition.lng());

            // privadapuntaazul - Privada Punta Azul, Culiacán, Sinaloa - Coordenadas finales (hardcoded)
            const privadapuntaazulPosition = new google.maps.LatLng(24.7481825, -107.4406413);
            const privadapuntaazulMarkerClass = createZillowPropertyMarker(privadapuntaazulProperty, window.mapCuliacan);
            const privadapuntaazulMarker = new privadapuntaazulMarkerClass(privadapuntaazulPosition, window.mapCuliacan, privadapuntaazulProperty);
            window.allCuliacanMarkers.push(privadapuntaazulMarker);
            console.log('Marcador privadapuntaazul creado en:', privadapuntaazulPosition.lat(), privadapuntaazulPosition.lng());

            // Riberas de Tamazula (RENTA) - Coordenadas exactas
            const riberasTamazulaPosition = new google.maps.LatLng(24.829214, -107.37305);
            const riberasTamazulaMarkerClass = createZillowPropertyMarker(riberasTamazulaProperty, window.mapCuliacan);
            const riberasTamazulaMarker = new riberasTamazulaMarkerClass(riberasTamazulaPosition, window.mapCuliacan, riberasTamazulaProperty);
            window.allCuliacanMarkers.push(riberasTamazulaMarker);
            console.log('Marcador Riberas de Tamazula (RENTA) creado en:', riberasTamazulaPosition.lat(), riberasTamazulaPosition.lng());

            // Bosques del Río (RENTA) - Coordenadas exactas
            const bosquesDelRioPosition = new google.maps.LatLng(24.8265, -107.4150);
            const bosquesDelRioMarkerClass = createZillowPropertyMarker(bosquesDelRioProperty, window.mapCuliacan);
            const bosquesDelRioMarker = new bosquesDelRioMarkerClass(bosquesDelRioPosition, window.mapCuliacan, bosquesDelRioProperty);
            window.allCuliacanMarkers.push(bosquesDelRioMarker);
            console.log('Marcador Bosques del Río (RENTA) creado en:', bosquesDelRioPosition.lat(), bosquesDelRioPosition.lng());

            // Valle Alto Kentia (RENTA) - Coordenadas exactas
            const casa_en_renta_en_privada_kentia_valle_altoPosition = new google.maps.LatLng(24.803926, -107.464523);
            const casa_en_renta_en_privada_kentia_valle_altoMarkerClass = createZillowPropertyMarker(casa_en_renta_en_privada_kentia_valle_altoProperty, window.mapCuliacan);
            const casa_en_renta_en_privada_kentia_valle_altoMarker = new casa_en_renta_en_privada_kentia_valle_altoMarkerClass(casa_en_renta_en_privada_kentia_valle_altoPosition, window.mapCuliacan, casa_en_renta_en_privada_kentia_valle_altoProperty);
            window.allCuliacanMarkers.push(casa_en_renta_en_privada_kentia_valle_altoMarker);
            console.log('Marcador Valle Alto Kentia (RENTA) creado en:', casa_en_renta_en_privada_kentia_valle_altoPosition.lat(), casa_en_renta_en_privada_kentia_valle_altoPosition.lng());

            // ===== LOTE 1 TEST - Marcadores con coordenadas fijas =====

            // Pontevedra (RENTA) - Coordenadas aproximadas zona La Isla
            const pontevedraPosition = new google.maps.LatLng(24.795000, -107.420000);
            const pontevedraMarkerClass = createZillowPropertyMarker(pontevedraProperty, window.mapCuliacan);
            const pontevedraMarker = new pontevedraMarkerClass(pontevedraPosition, window.mapCuliacan, pontevedraProperty);
            window.allCuliacanMarkers.push(pontevedraMarker);
            console.log('Marcador Pontevedra (RENTA) creado en:', pontevedraPosition.lat(), pontevedraPosition.lng());

            // Privanzas Natura (RENTA) - Coordenadas aproximadas zona norte Culiacán
            const privanzasNaturaPosition = new google.maps.LatLng(24.825000, -107.425000);
            const privanzasNaturaMarkerClass = createZillowPropertyMarker(privanzasNaturaProperty, window.mapCuliacan);
            const privanzasNaturaMarker = new privanzasNaturaMarkerClass(privanzasNaturaPosition, window.mapCuliacan, privanzasNaturaProperty);
            window.allCuliacanMarkers.push(privanzasNaturaMarker);
            console.log('Marcador Privanzas Natura (RENTA) creado en:', privanzasNaturaPosition.lat(), privanzasNaturaPosition.lng());

            // Santa Lourdes (RENTA) - Coordenadas aproximadas Country del Rio
            const santaLourdesPosition = new google.maps.LatLng(24.768000, -107.445000);
            const santaLourdesMarkerClass = createZillowPropertyMarker(santaLourdesProperty, window.mapCuliacan);
            const santaLourdesMarker = new santaLourdesMarkerClass(santaLourdesPosition, window.mapCuliacan, santaLourdesProperty);
            window.allCuliacanMarkers.push(santaLourdesMarker);
            console.log('Marcador Santa Lourdes (RENTA) creado en:', santaLourdesPosition.lat(), santaLourdesPosition.lng());

            // ===== LOTE 2 - Marcadores con coordenadas fijas =====

            // Lomas del Pedregal (RENTA) - Coordenadas aproximadas zona Lomas del Pedregal
            const lomasDelPedregalPosition = new google.maps.LatLng(24.782000, -107.450000);
            const lomasDelPedregalMarkerClass = createZillowPropertyMarker(lomasDelPedregalProperty, window.mapCuliacan);
            const lomasDelPedregalMarker = new lomasDelPedregalMarkerClass(lomasDelPedregalPosition, window.mapCuliacan, lomasDelPedregalProperty);
            window.allCuliacanMarkers.push(lomasDelPedregalMarker);
            console.log('Marcador Lomas del Pedregal (RENTA) creado en:', lomasDelPedregalPosition.lat(), lomasDelPedregalPosition.lng());

            // La Campiña (RENTA) - Coordenadas aproximadas cerca Forum
            const laCampinaPosition = new google.maps.LatLng(24.810000, -107.395000);
            const laCampinaMarkerClass = createZillowPropertyMarker(laCampinaProperty, window.mapCuliacan);
            const laCampinaMarker = new laCampinaMarkerClass(laCampinaPosition, window.mapCuliacan, laCampinaProperty);
            window.allCuliacanMarkers.push(laCampinaMarker);
            console.log('Marcador La Campiña (RENTA) creado en:', laCampinaPosition.lat(), laCampinaPosition.lng());

            // Privada Americana Perisur (RENTA) - Coordenadas aproximadas zona sur Perisur
            const privadaAmericanaPerisurPosition = new google.maps.LatLng(24.760000, -107.410000);
            const privadaAmericanaPerisurMarkerClass = createZillowPropertyMarker(privadaAmericanaPerisurProperty, window.mapCuliacan);
            const privadaAmericanaPerisurMarker = new privadaAmericanaPerisurMarkerClass(privadaAmericanaPerisurPosition, window.mapCuliacan, privadaAmericanaPerisurProperty);
            window.allCuliacanMarkers.push(privadaAmericanaPerisurMarker);
            console.log('Marcador Privada Americana Perisur (RENTA) creado en:', privadaAmericanaPerisurPosition.lat(), privadaAmericanaPerisurPosition.lng());

            // ===== LOTE 3 - Marcadores con coordenadas fijas =====

            // Rincón Colonial #697816 (RENTA) - Coordenadas aproximadas zona norte cerca UdO
            const rinconColonial697816Position = new google.maps.LatLng(24.825000, -107.405000);
            const rinconColonial697816MarkerClass = createZillowPropertyMarker(rinconColonial697816Property, window.mapCuliacan);
            const rinconColonial697816Marker = new rinconColonial697816MarkerClass(rinconColonial697816Position, window.mapCuliacan, rinconColonial697816Property);
            window.allCuliacanMarkers.push(rinconColonial697816Marker);
            console.log('Marcador Rincón Colonial #697816 (RENTA) creado en:', rinconColonial697816Position.lat(), rinconColonial697816Position.lng());

            // Colina del Rey (RENTA) - Coordenadas aproximadas zona centro norte
            const colinaDelReyPosition = new google.maps.LatLng(24.818000, -107.398000);
            const colinaDelReyMarkerClass = createZillowPropertyMarker(colinaDelReyProperty, window.mapCuliacan);
            const colinaDelReyMarker = new colinaDelReyMarkerClass(colinaDelReyPosition, window.mapCuliacan, colinaDelReyProperty);
            window.allCuliacanMarkers.push(colinaDelReyMarker);
            console.log('Marcador Colina del Rey (RENTA) creado en:', colinaDelReyPosition.lat(), colinaDelReyPosition.lng());

            // Rincón Colonial #295459 (RENTA) - Coordenadas aproximadas zona norte cerca UdO (segunda propiedad)
            const rinconColonial295459Position = new google.maps.LatLng(24.826000, -107.404000);
            const rinconColonial295459MarkerClass = createZillowPropertyMarker(rinconColonial295459Property, window.mapCuliacan);
            const rinconColonial295459Marker = new rinconColonial295459MarkerClass(rinconColonial295459Position, window.mapCuliacan, rinconColonial295459Property);
            window.allCuliacanMarkers.push(rinconColonial295459Marker);
            console.log('Marcador Rincón Colonial #295459 (RENTA) creado en:', rinconColonial295459Position.lat(), rinconColonial295459Position.lng());

            // ===== LOTE 4 - Marcadores con coordenadas fijas (saltando belcantto duplicado) =====

            // Centenario (RENTA) - Coordenadas aproximadas zona Centenario
            const centenarioPosition = new google.maps.LatLng(24.814000, -107.420000);
            const centenarioMarkerClass = createZillowPropertyMarker(centenarioProperty, window.mapCuliacan);
            const centenarioMarker = new centenarioMarkerClass(centenarioPosition, window.mapCuliacan, centenarioProperty);
            window.allCuliacanMarkers.push(centenarioMarker);
            console.log('Marcador Centenario (RENTA) creado en:', centenarioPosition.lat(), centenarioPosition.lng());

            // Portareal Camino Real (RENTA) - Coordenadas aproximadas salida Sanalona
            const portarealCaminoRealPosition = new google.maps.LatLng(24.830000, -107.415000);
            const portarealCaminoRealMarkerClass = createZillowPropertyMarker(portarealCaminoRealProperty, window.mapCuliacan);
            const portarealCaminoRealMarker = new portarealCaminoRealMarkerClass(portarealCaminoRealPosition, window.mapCuliacan, portarealCaminoRealProperty);
            window.allCuliacanMarkers.push(portarealCaminoRealMarker);
            console.log('Marcador Portareal Camino Real (RENTA) creado en:', portarealCaminoRealPosition.lat(), portarealCaminoRealPosition.lng());

            // ===== LOTE 5 - Marcadores con coordenadas fijas =====

            // Terracota (RENTA) - Coordenadas aproximadas Fraccionamiento Terracota
            const terracotaPosition = new google.maps.LatLng(24.795000, -107.435000);
            const terracotaMarkerClass = createZillowPropertyMarker(terracotaProperty, window.mapCuliacan);
            const terracotaMarker = new terracotaMarkerClass(terracotaPosition, window.mapCuliacan, terracotaProperty);
            window.allCuliacanMarkers.push(terracotaMarker);
            console.log('Marcador Terracota (RENTA) creado en:', terracotaPosition.lat(), terracotaPosition.lng());

            // Villa Andalucía (RENTA) - Coordenadas aproximadas zona Villa Andalucía
            const villaAndaluciaPosition = new google.maps.LatLng(24.805000, -107.400000);
            const villaAndaluciaMarkerClass = createZillowPropertyMarker(villaAndaluciaProperty, window.mapCuliacan);
            const villaAndaluciaMarker = new villaAndaluciaMarkerClass(villaAndaluciaPosition, window.mapCuliacan, villaAndaluciaProperty);
            window.allCuliacanMarkers.push(villaAndaluciaMarker);
            console.log('Marcador Villa Andalucía (RENTA) creado en:', villaAndaluciaPosition.lat(), villaAndaluciaPosition.lng());

            // Los Pinos (RENTA) - Coordenadas aproximadas zona Los Pinos
            const losPinosPosition = new google.maps.LatLng(24.800000, -107.410000);
            const losPinosMarkerClass = createZillowPropertyMarker(losPinosProperty, window.mapCuliacan);
            const losPinosMarker = new losPinosMarkerClass(losPinosPosition, window.mapCuliacan, losPinosProperty);
            window.allCuliacanMarkers.push(losPinosMarker);
            console.log('Marcador Los Pinos (RENTA) creado en:', losPinosPosition.lat(), losPinosPosition.lng());

            // Cañadas (VENTA) - Coordenadas aproximadas zona sur Culiacán
            const casa_en_fraccionamiento_canadasPosition = new google.maps.LatLng(24.770000, -107.410000);
            const casa_en_fraccionamiento_canadasMarkerClass = createZillowPropertyMarker(casa_en_fraccionamiento_canadasProperty, window.mapCuliacan);
            const casa_en_fraccionamiento_canadasMarker = new casa_en_fraccionamiento_canadasMarkerClass(casa_en_fraccionamiento_canadasPosition, window.mapCuliacan, casa_en_fraccionamiento_canadasProperty);
            window.allCuliacanMarkers.push(casa_en_fraccionamiento_canadasMarker);
            console.log('Marcador Cañadas (VENTA) creado en:', casa_en_fraccionamiento_canadasPosition.lat(), casa_en_fraccionamiento_canadasPosition.lng());

            // Los Angeles (VENTA) - Coordenadas aproximadas zona noreste Culiacán
            const casa_en_fraccionamiento_los_angelesPosition = new google.maps.LatLng(24.820000, -107.380000);
            const casa_en_fraccionamiento_los_angelesMarkerClass = createZillowPropertyMarker(casa_en_fraccionamiento_los_angelesProperty, window.mapCuliacan);
            const casa_en_fraccionamiento_los_angelesMarker = new casa_en_fraccionamiento_los_angelesMarkerClass(casa_en_fraccionamiento_los_angelesPosition, window.mapCuliacan, casa_en_fraccionamiento_los_angelesProperty);
            window.allCuliacanMarkers.push(casa_en_fraccionamiento_los_angelesMarker);
            console.log('Marcador Los Angeles (VENTA) creado en:', casa_en_fraccionamiento_los_angelesPosition.lat(), casa_en_fraccionamiento_los_angelesPosition.lng());

            // Valle Alto A2 (RENTA) - Coordenadas aproximadas zona Valle Alto
            const casa_en_renta_en_valle_alto_a2Position = new google.maps.LatLng(24.804500, -107.465000);
            const casa_en_renta_en_valle_alto_a2MarkerClass = createZillowPropertyMarker(casa_en_renta_en_valle_alto_a2Property, window.mapCuliacan);
            const casa_en_renta_en_valle_alto_a2Marker = new casa_en_renta_en_valle_alto_a2MarkerClass(casa_en_renta_en_valle_alto_a2Position, window.mapCuliacan, casa_en_renta_en_valle_alto_a2Property);
            window.allCuliacanMarkers.push(casa_en_renta_en_valle_alto_a2Marker);
            console.log('Marcador Valle Alto A2 (RENTA) creado en:', casa_en_renta_en_valle_alto_a2Position.lat(), casa_en_renta_en_valle_alto_a2Position.lng());

            // Colonia Guadalupe (VENTA) - Coordenadas aproximadas
            const coloniaGuadalupePosition = new google.maps.LatLng(coloniaGuadalupeProperty.lat, coloniaGuadalupeProperty.lng);
            const coloniaGuadalupeMarkerClass = createZillowPropertyMarker(coloniaGuadalupeProperty, window.mapCuliacan);
            const coloniaGuadalupeMarker = new coloniaGuadalupeMarkerClass(coloniaGuadalupePosition, window.mapCuliacan, coloniaGuadalupeProperty);
            window.allCuliacanMarkers.push(coloniaGuadalupeMarker);
            console.log('Marcador Colonia Guadalupe (VENTA) creado en:', coloniaGuadalupeProperty.lat, coloniaGuadalupeProperty.lng);

            // Casa en Venta Colonia Guadalupe V1.5 (GEOCODER) - Coordenadas REALES del Geocoder V1.5
            const guadalupeV15Position = new google.maps.LatLng(guadalupeV15Property.lat, guadalupeV15Property.lng);
            const guadalupeV15MarkerClass = createZillowPropertyMarker(guadalupeV15Property, window.mapCuliacan);
            const guadalupeV15Marker = new guadalupeV15MarkerClass(guadalupeV15Position, window.mapCuliacan, guadalupeV15Property);
            window.allCuliacanMarkers.push(guadalupeV15Marker);
            console.log('🌍 Marcador Casa Guadalupe V1.5 (GEOCODER) creado en:', guadalupeV15Property.lat, guadalupeV15Property.lng);

            // Colinas de San Miguel (VENTA) - Se crea AL FINAL para aparecer encima de otros marcadores
            const colinasSanMiguelPosition = new google.maps.LatLng(colinasSanMiguelProperty.lat, colinasSanMiguelProperty.lng);
            const colinasSanMiguelMarkerClass = createZillowPropertyMarker(colinasSanMiguelProperty, window.mapCuliacan);
            const colinasSanMiguelMarker = new colinasSanMiguelMarkerClass(colinasSanMiguelPosition, window.mapCuliacan, colinasSanMiguelProperty);
            window.allCuliacanMarkers.push(colinasSanMiguelMarker);
            console.log('Marcador Colinas de San Miguel creado en:', colinasSanMiguelProperty.lat, colinasSanMiguelProperty.lng);

            // Inicializar filtros Zillow cuando el mapa esté listo
            setTimeout(initZillowFilters, 500);

            // Esperar a que se carguen todos los marcadores y luego actualizar el contador
            setTimeout(() => {
                if (window.allCuliacanMarkers && window.allCuliacanMarkers.length > 0) {
                    const countElement = document.getElementById('map-property-count');
                    if (countElement) {
                        countElement.textContent = `${window.allCuliacanMarkers.length} propiedades`;
                    }
                    console.log(`✅ ${window.allCuliacanMarkers.length} marcadores cargados y visibles en el mapa`);
                }
            }, 3000); // Esperar 3 segundos para que todos los marcadores se geocodifiquen

            window.mapCuliacanInitialized = true;
            console.log('Mapa de Culiacán inicializado correctamente');
        }

        // Función para crear marcador estilo Zillow con tarjeta de fotos en abanico
        function createZillowPropertyMarker(property, map) {
            // Color según tipo: naranja para RENTA, verde para VENTA
            const isRenta = property.type === 'renta';
            const gradientStart = isRenta ? '#FF6B35' : '#10b981'; // Naranja o Verde
            const gradientEnd = isRenta ? '#FF8C42' : '#059669';   // Naranja claro o Verde oscuro

            const markerHTML = `
                <div style="
                    background: linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 14px;
                    font-weight: bold;
                    font-size: 11px;
                    border: 2px solid white;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    cursor: pointer;
                    white-space: nowrap;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    ${property.priceShort}
                </div>
            `;

            const CustomMarker = function(position, map, property) {
                this.position = position;
                this.property = property;
                this.div = null;
                this.setMap(map);
            };

            CustomMarker.prototype = new google.maps.OverlayView();

            CustomMarker.prototype.onAdd = function() {
                const div = document.createElement('div');
                div.style.position = 'absolute';
                div.innerHTML = markerHTML;

                // Al hacer clic, mostrar tarjeta Zillow con fotos en abanico
                div.addEventListener('click', () => {
                    showZillowCard(this.property, this.position, map);
                });

                this.div = div;
                const panes = this.getPanes();
                panes.overlayMouseTarget.appendChild(div);
            };

            CustomMarker.prototype.draw = function() {
                const overlayProjection = this.getProjection();
                const position = overlayProjection.fromLatLngToDivPixel(this.position);
                const div = this.div;
                div.style.left = (position.x - 40) + 'px';
                div.style.top = (position.y - 20) + 'px';
            };

            CustomMarker.prototype.onRemove = function() {
                if (this.div) {
                    this.div.parentNode.removeChild(this.div);
                    this.div = null;
                }
            };

            return CustomMarker;
        }

        // Variable global para controlar el índice de foto actual
        let currentPhotoIndex = 0;
        let currentInfoWindow = null;

        // Función para mostrar tarjeta Zillow con carrusel de fotos
        function showZillowCard(property, position, map) {
            currentPhotoIndex = 0; // Resetear al abrir la tarjeta

            // Crear ID único para este carrusel
            const carouselId = 'carousel-' + Date.now();

            // Generar HTML del carrusel con flechas
            const cardContent = `
                <div id="${carouselId}" style="max-width: 320px; font-family: 'Poppins', sans-serif;">
                    <!-- Carrusel de fotos -->
                    <div style="position: relative; height: 200px; margin-bottom: 10px; overflow: hidden; border-radius: 8px 8px 0 0;">
                        <!-- Imagen actual -->
                        <img id="${carouselId}-img"
                             src="${property.photos[0]}"
                             alt="${property.title}"
                             style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s ease;">

                        <!-- Flechas de navegación -->
                        <button id="${carouselId}-prev"
                                style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; z-index: 10; transition: background 0.2s;"
                                onmouseover="this.style.background='rgba(0,0,0,0.8)'"
                                onmouseout="this.style.background='rgba(0,0,0,0.6)'">
                            ‹
                        </button>
                        <button id="${carouselId}-next"
                                style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; z-index: 10; transition: background 0.2s;"
                                onmouseover="this.style.background='rgba(0,0,0,0.8)'"
                                onmouseout="this.style.background='rgba(0,0,0,0.6)'">
                            ›
                        </button>

                        <!-- Contador de fotos -->
                        <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; z-index: 10;">
                            <span id="${carouselId}-counter">1</span> / ${property.photos.length}
                        </div>

                        <!-- Dots indicadores -->
                        <div id="${carouselId}-dots" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10;">
                            ${property.photos.map((_, index) => `
                                <div class="carousel-dot" data-index="${index}"
                                     style="width: ${index === 0 ? '20px' : '8px'}; height: 8px; border-radius: 4px; background: ${index === 0 ? 'white' : 'rgba(255,255,255,0.5)'}; cursor: pointer; transition: all 0.3s;"></div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Info de la propiedad -->
                    <div style="padding: 12px;">
                        <h3 style="margin: 0 0 8px 0; color: #FF6B35; font-size: 20px; font-weight: 700;">${property.priceFull}</h3>
                        <div style="display: flex; gap: 12px; margin-bottom: 8px; color: #6b7280; font-size: 14px;">
                            <span><i class="fas fa-bed"></i> ${property.bedrooms} rec</span>
                            <span><i class="fas fa-bath"></i> ${property.bathrooms} baños</span>
                            <span><i class="fas fa-ruler-combined"></i> ${property.area}</span>
                        </div>
                        <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 13px; line-height: 1.4;">${property.location}</p>

                        <!-- Botones de acción -->
                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.open('${property.url}', '_blank')"
                               style="flex: 1; background: #FF6A00; color: white; padding: 10px 16px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; text-align: center; cursor: pointer; font-family: 'Poppins', sans-serif;">
                                Ver Detalles
                            </button>
                            <button onclick="window.open('https://wa.me/528111652545?text=Hola,%20me%20interesa%20${encodeURIComponent(property.title)}%20en%20${encodeURIComponent(property.priceFull)}', '_blank')"
                               style="flex: 1; background: #25D366; color: white; padding: 10px 16px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; text-align: center; cursor: pointer; font-family: 'Poppins', sans-serif;">
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const infoWindow = new google.maps.InfoWindow({
                content: cardContent,
                maxWidth: 340
            });

            infoWindow.setPosition(position);
            infoWindow.open(map);

            // Guardar referencia al InfoWindow actual
            currentInfoWindow = infoWindow;

            // Esperar a que el contenido se renderice y agregar event listeners
            google.maps.event.addListenerOnce(infoWindow, 'domready', function() {
                const img = document.getElementById(`${carouselId}-img`);
                const counter = document.getElementById(`${carouselId}-counter`);
                const prevBtn = document.getElementById(`${carouselId}-prev`);
                const nextBtn = document.getElementById(`${carouselId}-next`);
                const dots = document.querySelectorAll(`#${carouselId}-dots .carousel-dot`);

                // Función para actualizar la foto
                function updatePhoto(newIndex) {
                    if (newIndex < 0) newIndex = property.photos.length - 1;
                    if (newIndex >= property.photos.length) newIndex = 0;

                    currentPhotoIndex = newIndex;

                    // Fade effect
                    img.style.opacity = '0';
                    setTimeout(() => {
                        img.src = property.photos[newIndex];
                        img.style.opacity = '1';
                    }, 150);

                    // Actualizar contador
                    counter.textContent = newIndex + 1;

                    // Actualizar dots
                    dots.forEach((dot, index) => {
                        if (index === newIndex) {
                            dot.style.width = '20px';
                            dot.style.background = 'white';
                        } else {
                            dot.style.width = '8px';
                            dot.style.background = 'rgba(255,255,255,0.5)';
                        }
                    });
                }

                // Event listeners para flechas
                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updatePhoto(currentPhotoIndex - 1);
                });

                nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updatePhoto(currentPhotoIndex + 1);
                });

                // Event listeners para dots
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', (e) => {
                        e.stopPropagation();
                        updatePhoto(index);
                    });
                });

                // Soporte para teclado (flechas)
                document.addEventListener('keydown', function handleKeyPress(e) {
                    if (!currentInfoWindow) {
                        document.removeEventListener('keydown', handleKeyPress);
                        return;
                    }
                    if (e.key === 'ArrowLeft') updatePhoto(currentPhotoIndex - 1);
                    if (e.key === 'ArrowRight') updatePhoto(currentPhotoIndex + 1);
                });
            });

            // Limpiar al cerrar
            google.maps.event.addListener(infoWindow, 'closeclick', function() {
                currentInfoWindow = null;
                currentPhotoIndex = 0;
            });
        }

        // Cerrar modal con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('mapModal');
                if (modal && modal.classList.contains('flex')) {
                    closeMapModal();
                }
            }
        });

        // Cerrar modal al hacer clic fuera
        document.addEventListener('DOMContentLoaded', function() {
            const modal = document.getElementById('mapModal');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        closeMapModal();
                    }
                });
            }
        });
    