const fs = require('fs');
const path = require('path');

const properties = [
    {
        folder: 'casa-venta-country-del-rio-iv-093670',
        location: 'Country del Río IV, Culiacán',
        priceShort: '$2.0M',
        title: 'Casa en Venta Country del Río IV'
    },
    {
        folder: 'casa-venta-culiacan-culiacan-196364',
        location: 'Culiacán, Culiacán',
        priceShort: '$1.2M',
        title: 'Casa en Venta Culiacán'
    },
    {
        folder: 'casa-venta-emiliano-zapata-581422',
        location: 'Emiliano Zapata, Culiacán',
        priceShort: '$2.3M',
        title: 'Casa en Venta Emiliano Zapata'
    },
    {
        folder: 'casa-venta-infonavit-barrancos-295574',
        location: 'INFONAVIT Barrancos, Culiacán',
        priceShort: '$1.7M',
        title: 'Casa en Venta INFONAVIT Barrancos'
    },
    {
        folder: 'casa-venta-infonavit-barrancos-585173',
        location: 'INFONAVIT Barrancos, Culiacán',
        priceShort: '$1.9M',
        title: 'Casa en Venta INFONAVIT Barrancos'
    },
    {
        folder: 'casa-venta-infonavit-barrancos-874501',
        location: 'INFONAVIT Barrancos, Culiacán',
        priceShort: '$1.2M',
        title: 'Casa en Venta INFONAVIT Barrancos'
    }
];

const mapTemplate = (location, priceShort, title) => `
    <!-- Location Map Section - Desktop Only -->
    <section class="location-map scroll-animate" id="location">
        <div class="container">
            <h2 class="section-title">Ubicación</h2>
            <p class="location-subtitle">${title}, Culiacán</p>

    <!-- Mapa con Marcador Personalizado -->
    <div id="map-container" style="width: 100%; height: 450px; border-radius: 12px; overflow: hidden;"></div>

    <script>
        // Variables globales para el mapa
        let map;
        let marker;
        let geocoder;

        // Configuración del marcador personalizado
        const MARKER_CONFIG = {
            location: "${location}",
            priceShort: "${priceShort}",
            title: "${title}",
            precision: "generic",
            latOffset: 0,
            lngOffset: 0
        };

        // Función para crear marcador personalizado
        function createPropertyMarker(property, map, isCurrent = false) {
            const markerHTML = \`
                <div style="
                    background: \${isCurrent ? 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
                    color: white;
                    padding: \${isCurrent ? '8px 14px' : '6px 10px'};
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: \${isCurrent ? '14px' : '12px'};
                    border: 3px solid white;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    cursor: pointer;
                    white-space: nowrap;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    \${property.priceShort}
                </div>
            \`;

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
                        content: \`
                            <div style="padding: 0; max-width: 260px;">
                                <img src="\${this.property.image}"
                                     alt="\${this.property.title}"
                                     style="width: 100%; height: 160px; object-fit: cover; display: block; border-radius: 4px 4px 0 0;">
                                <div style="padding: 8px 10px;">
                                    <h4 style="margin: 0 0 4px 0; color: \${this.isCurrent ? '#FF6B35' : '#10b981'}; font-size: 14px; font-weight: 600;">\${this.property.priceShort}</h4>
                                    <h5 style="margin: 0 0 3px 0; color: #1f2937; font-size: 12px; font-weight: 600;">\${this.property.title}</h5>
                                    <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 11px; line-height: 1.3;">\${this.property.location}</p>
                                </div>
                            </div>
                        \`
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

        // Inicializar mapa
        function initMap() {
            geocoder = new google.maps.Geocoder();

            // Geocodificar la dirección
            geocoder.geocode({ address: MARKER_CONFIG.location }, function(results, status) {
                if (status === 'OK' && results[0]) {
                    const position = {
                        lat: results[0].geometry.location.lat() + MARKER_CONFIG.latOffset,
                        lng: results[0].geometry.location.lng() + MARKER_CONFIG.lngOffset
                    };

                    // Crear mapa
                    map = new google.maps.Map(document.getElementById('map-container'), {
                        center: position,
                        zoom: MARKER_CONFIG.precision === 'exact' ? 17 :
                              MARKER_CONFIG.precision === 'street' ? 16 : 15,
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
                        fullscreenControl: true
                    });

                    // Crear marcador de la propiedad actual (naranja)
                    const currentProperty = {
                        priceShort: MARKER_CONFIG.priceShort,
                        title: MARKER_CONFIG.title,
                        location: MARKER_CONFIG.location,
                        image: 'images/foto-1.jpg'
                    };

                    const CustomMarkerClass = createPropertyMarker(currentProperty, map, true);
                    marker = new CustomMarkerClass(position, map, currentProperty, true);

                } else {
                    console.error('Geocode error:', status);
                    // Fallback: mostrar mapa en ubicación genérica
                    const fallbackCenter = { lat: 24.8091, lng: -107.3940 }; // Culiacán centro
                    map = new google.maps.Map(document.getElementById('map-container'), {
                        center: fallbackCenter,
                        zoom: 12
                    });
                }
            });
        }
    </script>

    <!-- Cargar Google Maps API -->
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk&callback=initMap&libraries=places" async defer></script>

        </div>
    </section>

    <style>
        .location-map {
            padding: 60px 0;
            background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
        }

        .location-subtitle {
            text-align: center;
            color: #6b7280;
            font-size: 1.1rem;
            margin-bottom: 40px;
            font-family: 'Poppins', sans-serif;
        }

        #map-container {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
            .location-map {
                padding: 40px 0;
            }

            #map-container {
                height: 350px !important;
            }
        }
    </style>
`;

// Process each property
properties.forEach(prop => {
    const filePath = path.join(__dirname, 'culiacan', prop.folder, 'index.html');

    if (!fs.existsSync(filePath)) {
        console.error(\`File not found: \${filePath}\`);
        return;
    }

    let html = fs.readFileSync(filePath, 'utf8');

    // Check if map already exists
    if (html.includes('<!-- Location Map Section')) {
        console.log(\`Map already exists in \${prop.folder}, skipping...\`);
        return;
    }

    // Find the pattern and insert the map section
    const oldString = '    </div>\\n\\n    <!-- Contact Section -->';
    const newString = '    </div>\\n' + mapTemplate(prop.location, prop.priceShort, prop.title) + '\\n    <!-- Contact Section -->';

    html = html.replace(oldString, newString);

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(\`✓ Updated \${prop.folder}\`);
});

console.log('\\nAll properties updated successfully!');
