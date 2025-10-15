#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Property data: slug, price short, price full, location, title
const properties = [
    {
        slug: 'casa-venta-casa-en-venta-alameda-pNq7XzY',
        priceShort: '$1.9M',
        priceFull: '$1,900,000',
        location: 'Alamedas, Culiacán',
        title: 'Casa en Venta Alamedas'
    },
    {
        slug: 'casa-venta-casa-en-venta-bugambilias-zona-aeropuert-pYowL0a',
        priceShort: '$1.8M',
        priceFull: '$1,800,000',
        location: 'Bugambilias, Culiacán',
        title: 'Casa en Venta Bugambilias'
    },
    {
        slug: 'casa-venta-casa-en-venta-fracc-capistranosector-sur-pLylwsv',
        priceShort: '$1.5M',
        priceFull: '$1,500,000',
        location: 'Fracc Capistrano, Culiacán',
        title: 'Casa en Venta Fracc Capistrano'
    },
    {
        slug: 'casa-venta-casa-en-venta-fracc-lomas-de-san-isidro-pVj5OFz',
        priceShort: '$1.75M',
        priceFull: '$1,750,000',
        location: 'Fracc Lomas De San Isidro, Culiacán',
        title: 'Casa en Venta Lomas De San Isidro'
    },
    {
        slug: 'casa-venta-casa-en-venta-fracc-portabelo-pvAQsal',
        priceShort: '$1.7M',
        priceFull: '$1,700,000',
        location: 'Fracc Floresta, Culiacán',
        title: 'Casa en Venta Fracc Floresta'
    },
    {
        slug: 'casa-venta-casa-en-venta-fracc-riveras-de-tamazula-pBw6ow5',
        priceShort: '$1.55M',
        priceFull: '$1,550,000',
        location: 'Fracc Riveras De Tamazula, Culiacán',
        title: 'Casa en Venta Riveras De Tamazula'
    },
    {
        slug: 'casa-venta-casa-en-venta-fracc-zona-dorada-pMhspV9',
        priceShort: '$1.29M',
        priceFull: '$1,295,000',
        location: 'Zona Dorada, Culiacán',
        title: 'Casa en Venta Zona Dorada'
    },
    {
        slug: 'casa-venta-casa-en-venta-lomas-del-sol-culiacan-sin-p5FCpYR',
        priceShort: '$1.55M',
        priceFull: '$1,550,000',
        location: 'Lomas Del Sol, Culiacán',
        title: 'Casa en Venta Lomas Del Sol'
    },
    {
        slug: 'casa-venta-casa-en-venta-lomas-del-sol-en-esquina-2-pfnKusE',
        priceShort: '$1.3M',
        priceFull: '$1,300,000',
        location: 'Lomas Del Sol, Culiacán',
        title: 'Casa en Venta Lomas Del Sol Esquina'
    },
    {
        slug: 'casa-venta-casa-en-venta-nuevo-culiacan-la-casa-de--pLr4tUR',
        priceShort: '$1.87M',
        priceFull: '$1,875,000',
        location: 'Nuevo Culiacán, Culiacán',
        title: 'Casa en Venta Nuevo Culiacán'
    }
];

const baseDir = '/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/culiacan';

// Map code template
function generateMapCode(property) {
    return `    <!-- Mapa con Marcador Personalizado -->
    <div id="map-container" style="width: 100%; height: 450px; border-radius: 12px; overflow: hidden;"></div>

    <script>
        // Variables globales para el mapa
        let map;
        let marker;
        let geocoder;

        // Configuración del marcador personalizado
        const MARKER_CONFIG = {
            location: "${property.location}",
            priceShort: "${property.priceShort}",
            title: "${property.title}",
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
}

// Process each property
let updatedCount = 0;
let errorCount = 0;

properties.forEach(property => {
    const filePath = path.join(baseDir, property.slug, 'index.html');

    try {
        if (!fs.existsSync(filePath)) {
            console.log(`❌ File not found: ${filePath}`);
            errorCount++;
            return;
        }

        let html = fs.readFileSync(filePath, 'utf-8');

        // Find the location map section
        const locationSectionStart = html.indexOf('<!-- Location Map Section - Desktop Only -->');

        if (locationSectionStart === -1) {
            console.log(`⚠️  No map section found in ${property.slug}`);
            errorCount++;
            return;
        }

        // Find the closing </section> tag for the location map
        const sectionEnd = html.indexOf('</section>', locationSectionStart);

        if (sectionEnd === -1) {
            console.log(`⚠️  Could not find closing section tag in ${property.slug}`);
            errorCount++;
            return;
        }

        // Extract everything before and after the map section
        const beforeSection = html.substring(0, locationSectionStart);
        const afterSection = html.substring(sectionEnd + '</section>'.length);

        // Generate the new map code
        const newMapCode = `<!-- Location Map Section - Desktop Only -->
    <section class="location-map scroll-animate" id="location">
        <div class="container">
            <h2 class="section-title">Ubicación</h2>
            <p class="location-subtitle">${property.title}, ${property.location}</p>

${generateMapCode(property)}
        </div>
    </section>`;

        // Reconstruct the HTML
        const updatedHtml = beforeSection + newMapCode + afterSection;

        // Write back to file
        fs.writeFileSync(filePath, updatedHtml, 'utf-8');

        console.log(`✅ Updated: ${property.slug}`);
        console.log(`   Price: ${property.priceFull} (${property.priceShort})`);
        console.log(`   Location: ${property.location}`);
        console.log('');
        updatedCount++;

    } catch (error) {
        console.log(`❌ Error updating ${property.slug}:`, error.message);
        errorCount++;
    }
});

console.log('='.repeat(60));
console.log(`✅ Successfully updated: ${updatedCount} properties`);
console.log(`❌ Errors: ${errorCount} properties`);
console.log('='.repeat(60));
