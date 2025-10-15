const fs = require('fs');
const path = require('path');

// Lista de propiedades del Lote 1
const properties = [
    {
        path: 'culiacan/casa-en-venta-en-inf-barrancos/index.html',
        title: 'Casa en Venta en Inf. Barrancos',
        price: '$1,100,000',
        priceShort: '$1.1M',
        location: 'Inf. Barrancos, Culiacán'
    },
    {
        path: 'culiacan/casa-en-venta-en-isla-musala-culiacan/index.html',
        title: 'Casa en Venta en Isla Musalá',
        price: '$6,000,000',
        priceShort: '$6M',
        location: 'Isla Musalá, Culiacán'
    },
    {
        path: 'culiacan/casa-en-venta-en-la-isla-musala-culiacan-sinaloa/index.html',
        title: 'Casa en Venta Isla Musalá',
        price: '$8,360,000',
        priceShort: '$8.4M',
        location: 'Músala Isla Bonita, Culiacán'
    },
    {
        path: 'culiacan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/index.html',
        title: 'Casa en Venta Barrio San Francisco',
        price: '$6,300,000',
        priceShort: '$6.3M',
        location: 'Barrio San Francisco, Culiacán'
    },
    {
        path: 'culiacan/casa-en-venta-en-privada-con-excedente-4-recamaras-sector-la-conquista/index.html',
        title: 'Casa en Venta La Conquista',
        price: '$0M',
        priceShort: '$0M',
        location: 'La Conquista, Culiacán'
    },
    {
        path: 'culiacan/casa-en-venta-en-quinta-americana-sector-las-quintas/index.html',
        title: 'Casa en Venta Quinta Americana',
        price: '$0M',
        priceShort: '$0M',
        location: 'Las Quintas, Culiacán'
    },
    {
        path: 'culiacan/casa-en-venta-en-recursos-hidraulicos-privada-santa-ines/index.html',
        title: 'Casa en Venta Recursos Hidráulicos',
        price: '$0M',
        priceShort: '$0M',
        location: 'Recursos Hidráulicos, Culiacán'
    },
    {
        path: 'culiacan/casa-en-venta-en-stanza-castilla-privada-avila/index.html',
        title: 'Casa en Venta Stanza Castilla',
        price: '$0M',
        priceShort: '$0M',
        location: 'Stanza Castilla, Culiacán'
    },
    {
        path: 'culiacan/casa-en-venta-en-tierra-blanca/index.html',
        title: 'Casa en Venta Tierra Blanca',
        price: '$0M',
        priceShort: '$0M',
        location: 'Tierra Blanca, Culiacán'
    },
    {
        path: 'culiacan/casa-en-venta-fraccionamineto-urbivilla/index.html',
        title: 'Casa en Venta Urbivilla',
        price: '$0M',
        priceShort: '$0M',
        location: 'Urbivilla, Culiacán'
    }
];

// Código de referencia del mapa (de La Cantera)
const mapCodeTemplate = `
    <!-- Mapa con Marcador Personalizado -->
    <div id="map-container" style="width: 100%; height: 450px; border-radius: 12px; overflow: hidden;"></div>

    <script>
        // Variables globales para el mapa
        let map;
        let marker;
        let geocoder;

        // Configuración del marcador personalizado
        const MARKER_CONFIG = {
            location: "{{LOCATION}}",
            priceShort: "{{PRICE_SHORT}}",
            title: "{{TITLE}}",
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
    `;

// Función para actualizar cada archivo HTML
function updatePropertyMap(property) {
    const fullPath = path.join(__dirname, property.path);

    console.log(`\n📝 Procesando: ${property.path}`);

    // Leer el archivo HTML
    let html = fs.readFileSync(fullPath, 'utf8');

    // Preparar el código del mapa con los datos de la propiedad
    let mapCode = mapCodeTemplate
        .replace(/\{\{LOCATION\}\}/g, property.location)
        .replace(/\{\{PRICE_SHORT\}\}/g, property.priceShort)
        .replace(/\{\{TITLE\}\}/g, property.title);

    // Buscar y reemplazar la sección del mapa
    // Patrón: buscar desde <div class="map-container"> o <iframe hasta </section> de location-map
    const mapSectionRegex = /(<div class="map-container">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>)/;

    // Crear el nuevo contenido del mapa
    const newMapSection = `${mapCode}
        </div>
    </section>`;

    // Intentar reemplazar
    if (html.includes('map-container')) {
        // Encontrar la sección de ubicación
        const locationSectionStart = html.indexOf('<!-- Location Map Section');
        const locationSectionEnd = html.indexOf('</section>', locationSectionStart) + '</section>'.length;

        if (locationSectionStart !== -1 && locationSectionEnd !== -1) {
            const beforeSection = html.substring(0, locationSectionStart);
            const afterSection = html.substring(locationSectionEnd);

            // Reconstruir con el nuevo mapa
            html = beforeSection + `<!-- Location Map Section - Desktop Only -->
    <section class="location-map scroll-animate" id="location">
        <div class="container">
            <h2 class="section-title">Ubicación</h2>
            <p class="location-subtitle">${property.location}</p>
            ` + newMapSection + afterSection;

            // Guardar el archivo actualizado
            fs.writeFileSync(fullPath, html, 'utf8');
            console.log(`✅ Actualizado: ${property.path}`);
            console.log(`   - Título: ${property.title}`);
            console.log(`   - Precio: ${property.price} → ${property.priceShort}`);
            console.log(`   - Ubicación: ${property.location}`);

            return true;
        }
    }

    console.log(`❌ No se pudo actualizar: ${property.path}`);
    return false;
}

// Ejecutar actualizaciones
console.log('🚀 Iniciando actualización de mapas - LOTE 1\n');
console.log('=' .repeat(60));

let successCount = 0;
let failCount = 0;

properties.forEach(property => {
    try {
        if (updatePropertyMap(property)) {
            successCount++;
        } else {
            failCount++;
        }
    } catch (error) {
        console.error(`❌ Error procesando ${property.path}:`, error.message);
        failCount++;
    }
});

console.log('\n' + '='.repeat(60));
console.log('\n📊 RESUMEN:');
console.log(`   ✅ Actualizadas: ${successCount}/10`);
console.log(`   ❌ Fallidas: ${failCount}/10`);
console.log('\n✨ Proceso completado\n');
