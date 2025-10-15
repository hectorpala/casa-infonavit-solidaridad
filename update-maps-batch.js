const fs = require('fs');
const path = require('path');

// Configuración de propiedades
const properties = [
    {
        folder: 'casa-en-venta-privada-avila-pKprKDP-TEMP',
        location: 'Bugambilias, Culiacán',
        priceShort: '$1.8M',
        title: 'Casa en Venta Bugambilias',
        subtitle: 'Bugambilias, Culiacán'
    },
    {
        folder: 'casa-en-venta-terreno-excedente-stanza-valle-alto',
        location: 'Stanza Valle Alto, Culiacán',
        priceShort: '$2.5M',
        title: 'Casa en Venta Valle Alto',
        subtitle: 'Valle Alto, Culiacán'
    },
    {
        folder: 'casa-en-venta-valles-del-sol-sector-terranova-culiacan-sinal',
        location: 'Valles del Sol, Culiacán',
        priceShort: '$1.25M',
        title: 'Casa en Venta Valles del Sol',
        subtitle: 'Valles del Sol, Culiacán'
    },
    {
        folder: 'casa-en-venta-y-renta-en-carpatos-en-valle-alto-en-culiacan-sinaloa',
        location: 'Carpatos, Valle Alto, Culiacán',
        priceShort: '$2.8M',
        title: 'Casa en Venta Valle Alto',
        subtitle: 'Carpatos, Valle Alto, Culiacán'
    },
    {
        folder: 'casa-espacios-barcelona-como-nueva-acabados-de-primera',
        location: 'Gerona 3057, Culiacán',
        priceShort: '$2.9M',
        title: 'Casa en Venta Gerona',
        subtitle: 'Gerona 3057, Culiacán'
    },
    {
        folder: 'casa-renta-barrio-san-alberto-pgtrrTw',
        location: 'Barrio San Alberto, La Primavera, Culiacán',
        priceShort: '$8M',
        title: 'Casa en Renta Barrio San Alberto',
        subtitle: 'Barrio San Alberto, Culiacán'
    },
    {
        folder: 'casa-venta--pNq7XzY',
        location: 'Alamedas, Culiacán',
        priceShort: '$1.9M',
        title: 'Casa en Venta Alamedas',
        subtitle: 'Alamedas, Culiacán'
    }
];

const newMapCode = (location, priceShort, title) => `
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
`;

properties.forEach(prop => {
    const filePath = path.join(__dirname, 'culiacan', prop.folder, 'index.html');
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ No encontrado: ${prop.folder}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Buscar y reemplazar la sección del mapa
    const mapSectionRegex = /<div class="map-container">[\s\S]*?<\/iframe>\s*<\/div>/;
    
    if (mapSectionRegex.test(content)) {
        content = content.replace(
            mapSectionRegex,
            newMapCode(prop.location, prop.priceShort, prop.title).trim()
        );
        
        // Actualizar subtitle si es necesario
        content = content.replace(
            /<p class="location-subtitle">.*?<\/p>/,
            `<p class="location-subtitle">${prop.subtitle}</p>`
        );
        
        // Eliminar el viejo .map-container CSS si existe
        content = content.replace(
            /\.map-container\s*\{[^}]*\}/,
            ''
        );
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${prop.folder} - ${prop.priceShort} - ${prop.location}`);
    } else {
        console.log(`⚠️  No se encontró mapa en: ${prop.folder}`);
    }
});

console.log('\n🎉 Actualización completada!');
