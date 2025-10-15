const fs = require('fs');
const path = require('path');

// Configuración de las 10 propiedades LOTE 2
const properties = [
    {
        folder: 'casa-en-venta-la-cantera-culiacan',
        price: '$7,950,000',
        priceShort: '$7.95M',
        location: 'La Cantera, Culiacán',
        title: 'Casa en Venta La Cantera'
    },
    {
        folder: 'casa-en-venta-la-rioja-modelo-estrella',
        price: '$2,739,000',
        priceShort: '$2.74M',
        location: 'La Rioja, Culiacán',
        title: 'Casa en Venta La Rioja Modelo Estrella'
    },
    {
        folder: 'casa-en-venta-las-americas-br56',
        price: '$1,900,000',
        priceShort: '$1.9M',
        location: 'Las Américas, Culiacán',
        title: 'Casa en Venta Las Américas'
    },
    {
        folder: 'casa-en-venta-privada-avila-pKprKDP-TEMP',
        price: '$1,800,000',
        priceShort: '$1.8M',
        location: 'Bugambilias, Culiacán',
        title: 'Casa en Venta Bugambilias'
    },
    {
        folder: 'casa-en-venta-terreno-excedente-stanza-valle-alto',
        price: '$2,490,000',
        priceShort: '$2.49M',
        location: 'Valle Alto, Culiacán',
        title: 'Casa en Venta Valle Alto'
    },
    {
        folder: 'casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal',
        price: '$1,250,000',
        priceShort: '$1.25M',
        location: 'Valles del Sol, Culiacán',
        title: 'Casa en Venta Valles del Sol'
    },
    {
        folder: 'casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa',
        price: '$2,800,000',
        priceShort: '$2.8M',
        location: 'Carpatos, Valle Alto, Culiacán',
        title: 'Casa en Venta Carpatos'
    },
    {
        folder: 'casa-espacios-barcelona-como-nueva-acabados-de-primera',
        price: '$2,900,000',
        priceShort: '$2.9M',
        location: 'Gerona 3057, Culiacán',
        title: 'Casa en Venta Gerona 3057'
    },
    {
        folder: 'casa-renta-barrio-san-alberto-pgtrrTw',
        price: '$8,000,000',
        priceShort: '$8M',
        location: 'Barrio San Alberto, La Primavera, Culiacán',
        title: 'Casa en Renta Barrio San Alberto'
    },
    {
        folder: 'casa-venta--pNq7XzY',
        price: '$1,900,000',
        priceShort: '$1.9M',
        location: 'Alamedas, Culiacán',
        title: 'Casa en Venta Alamedas'
    }
];

// Código del mapa template (desde casa-en-venta-en-privada-la-cantera)
function getMapCode(location, priceShort, title) {
    return `
    <!-- Location Map Section - Desktop Only -->
    <section class="location-map scroll-animate" id="location">
        <div class="container">
            <h2 class="section-title">Ubicación</h2>
            <p class="location-subtitle">${title}, ${location}</p>

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
`;
}

// Función para actualizar una propiedad
function updateProperty(prop) {
    const basePath = '/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad';
    const htmlPath = path.join(basePath, 'culiacan', prop.folder, 'index.html');

    console.log(`\n🔄 Procesando: ${prop.folder}`);

    try {
        // Leer archivo
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Buscar sección del mapa actual (varias posibles ubicaciones)
        const mapPatterns = [
            // Patrón 1: Google Maps Embed iframe
            /<section[^>]*class="[^"]*location[^"]*"[^>]*>[\s\S]*?<\/section>/i,
            // Patrón 2: Mapa interactivo con script
            /<!-- Location Map Section[\s\S]*?<\/section>/i,
            // Patrón 3: Sección con id="location"
            /<section[^>]*id="location"[^>]*>[\s\S]*?<\/section>/i
        ];

        let mapFound = false;
        let originalSection = '';

        for (const pattern of mapPatterns) {
            const match = html.match(pattern);
            if (match) {
                originalSection = match[0];
                mapFound = true;
                break;
            }
        }

        if (!mapFound) {
            console.log(`   ⚠️  No se encontró sección de mapa existente en ${prop.folder}`);
            return {
                name: prop.folder,
                price: prop.price,
                location: prop.location,
                status: '⚠️  No map section found'
            };
        }

        // Generar nuevo código de mapa
        const newMapCode = getMapCode(prop.location, prop.priceShort, prop.title);

        // Reemplazar
        html = html.replace(originalSection, newMapCode);

        // Guardar
        fs.writeFileSync(htmlPath, html, 'utf8');

        console.log(`   ✅ Mapa actualizado correctamente`);
        console.log(`   📍 Ubicación: ${prop.location}`);
        console.log(`   💰 Precio: ${prop.price}`);

        return {
            name: prop.folder,
            price: prop.price,
            location: prop.location,
            status: '✅'
        };

    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return {
            name: prop.folder,
            price: prop.price,
            location: prop.location,
            status: `❌ ${error.message}`
        };
    }
}

// Ejecutar actualización en lote
console.log('🚀 Iniciando actualización de mapas LOTE 2 (10 propiedades)...\n');
console.log('=' .repeat(70));

const results = properties.map(updateProperty);

console.log('\n' + '='.repeat(70));
console.log('\n📊 RESUMEN DE ACTUALIZACIÓN:\n');
console.log('Propiedad | Precio | Ubicación | Estado');
console.log('-'.repeat(70));

results.forEach(r => {
    const shortName = r.name.substring(0, 30).padEnd(30);
    const shortPrice = r.price.padEnd(12);
    const shortLocation = r.location.substring(0, 25).padEnd(25);
    console.log(`${shortName} | ${shortPrice} | ${shortLocation} | ${r.status}`);
});

const successful = results.filter(r => r.status === '✅').length;
console.log('\n' + '='.repeat(70));
console.log(`\n✅ Completado: ${successful}/${properties.length} propiedades actualizadas\n`);
