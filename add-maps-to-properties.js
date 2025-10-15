#!/usr/bin/env node

/**
 * Script para agregar mapas personalizados a propiedades sin mapa
 * Extrae información de meta tags y agrega sección completa de mapa con CustomMarker
 */

const fs = require('fs');
const path = require('path');

// Propiedades a procesar - Lote 2 (propiedades 6-15)
const PROPERTIES_TO_PROCESS = [
    'casa-venta-la-primavera-412528',
    'casa-venta-la-primavera-521867',
    'casa-venta-la-primavera-588180',
    'casa-venta-la-rioja-477140',
    'casa-venta-la-rioja-594408',
    'casa-venta-las-moras-421156',
    'casa-venta-libertad-249209',
    'casa-venta-loma-linda-062215',
    'casa-venta-nueva-galicia-348109',
    'casa-venta-privada-perisur'
];

function extractPropertyData(html) {
    const data = {};

    // Extraer precio del título
    const titleMatch = html.match(/<title>.*?\$([0-9,]+).*?-\s*([^|]+)/);
    if (titleMatch) {
        const rawPrice = titleMatch[1].replace(/,/g, '');
        data.price = formatPrice(rawPrice);
        data.locationFromTitle = titleMatch[2].trim();
    }

    // Extraer título completo
    const titleFullMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleFullMatch) {
        data.fullTitle = titleFullMatch[1].replace(' | Hector es Bienes Raíces', '').trim();
    }

    // Extraer ubicación de Schema.org
    const addressMatch = html.match(/"addressLocality":\s*"([^"]+)"/);
    if (addressMatch) {
        data.locality = addressMatch[1];
    }

    // Extraer nombre de Schema.org
    const nameMatch = html.match(/"name":\s*"([^"]+)"/);
    if (nameMatch) {
        data.schemaName = nameMatch[1];
    }

    return data;
}

function formatPrice(rawPrice) {
    const numPrice = parseInt(rawPrice.toString().replace(/[^0-9]/g, ''));

    if (isNaN(numPrice)) return '$0M';

    if (numPrice >= 1000000) {
        const millions = numPrice / 1000000;
        return `$${millions.toFixed(1)}M`.replace('.0M', 'M');
    } else if (numPrice >= 1000) {
        const thousands = numPrice / 1000;
        return `$${thousands.toFixed(0)}K`;
    } else {
        return `$${numPrice.toLocaleString('en-US')}`;
    }
}

const MAP_TEMPLATE = `
    <!-- Location Map Section - Desktop Only -->
    <section class="location-map scroll-animate" id="location">
        <div class="container">
            <h2 class="section-title">Ubicación</h2>
            <p class="location-subtitle">{{FULL_TITLE}}</p>

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
                if (this.div) {
                    const overlayProjection = this.getProjection();
                    const position = overlayProjection.fromLatLngToDivPixel(this.position);
                    this.div.style.left = position.x - 40 + 'px';
                    this.div.style.top = position.y - 20 + 'px';
                }
            };

            CustomMarker.prototype.onRemove = function() {
                if (this.div) {
                    this.div.parentNode.removeChild(this.div);
                    this.div = null;
                }
            };

            return CustomMarker;
        }

        // Inicializar el mapa
        async function initMap() {
            const { Map } = await google.maps.importLibrary("maps");
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

            // Crear el mapa
            map = new Map(document.getElementById("map-container"), {
                zoom: 15,
                center: { lat: 24.8091, lng: -107.3940 },
                mapId: "8e0a97af9386fef",
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true
            });

            geocoder = new google.maps.Geocoder();

            // Geocodificar la ubicación
            const fullAddress = \`\${MARKER_CONFIG.location}, Sinaloa, México\`;

            geocoder.geocode({ address: fullAddress }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    const lat = location.lat() + MARKER_CONFIG.latOffset;
                    const lng = location.lng() + MARKER_CONFIG.lngOffset;
                    const position = { lat, lng };

                    map.setCenter(position);

                    const currentProperty = {
                        priceShort: MARKER_CONFIG.priceShort,
                        title: MARKER_CONFIG.title,
                        location: MARKER_CONFIG.location,
                        image: 'images/foto-1.jpg'
                    };

                    const CustomMarkerClass = createPropertyMarker(currentProperty, map, true);
                    marker = new CustomMarkerClass(position, map, currentProperty, true);
                } else {
                    console.error('Geocoding failed:', status);
                }
            });
        }

        // Cargar el script de Google Maps
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk&callback=initMap&libraries=marker&v=beta';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    </script>
        </div>
    </section>
`;

function addMapToProperty(propertySlug) {
    const htmlPath = path.join(__dirname, 'culiacan', propertySlug, 'index.html');

    if (!fs.existsSync(htmlPath)) {
        console.log(`❌ ${propertySlug} → Archivo no encontrado`);
        return { success: false, reason: 'not-found' };
    }

    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Verificar si ya tiene MARKER_CONFIG
    if (html.includes('MARKER_CONFIG')) {
        console.log(`⏭️  ${propertySlug} → Ya tiene mapa`);
        return { success: false, reason: 'already-has-map' };
    }

    // Extraer datos de la propiedad
    const data = extractPropertyData(html);

    if (!data.price || !data.locationFromTitle) {
        console.log(`⚠️  ${propertySlug} → No se pudo extraer información`);
        return { success: false, reason: 'no-data' };
    }

    // Preparar el template del mapa
    let mapSection = MAP_TEMPLATE
        .replace(/\{\{FULL_TITLE\}\}/g, data.fullTitle || data.schemaName || 'Casa en Venta')
        .replace(/\{\{LOCATION\}\}/g, data.locationFromTitle)
        .replace(/\{\{PRICE_SHORT\}\}/g, data.price)
        .replace(/\{\{TITLE\}\}/g, data.schemaName || data.fullTitle || 'Casa en Venta');

    // Buscar dónde insertar el mapa (antes del footer)
    const footerMatch = html.match(/<!-- Footer -->|<footer/i);

    if (!footerMatch) {
        console.log(`⚠️  ${propertySlug} → No se encontró footer`);
        return { success: false, reason: 'no-footer' };
    }

    // Insertar el mapa antes del footer
    const insertIndex = html.indexOf(footerMatch[0]);
    const updatedHTML = html.slice(0, insertIndex) + mapSection + '\n\n    ' + html.slice(insertIndex);

    // Guardar archivo
    fs.writeFileSync(htmlPath, updatedHTML, 'utf-8');

    console.log(`✅ ${propertySlug} → Mapa agregado (${data.price}, ${data.locationFromTitle})`);
    return { success: true, data };
}

function main() {
    console.log(`🗺️  Agregando mapas a ${PROPERTIES_TO_PROCESS.length} propiedades...\n`);

    const results = {
        success: [],
        alreadyHasMap: [],
        failed: []
    };

    PROPERTIES_TO_PROCESS.forEach(slug => {
        const result = addMapToProperty(slug);

        if (result.success) {
            results.success.push(slug);
        } else if (result.reason === 'already-has-map') {
            results.alreadyHasMap.push(slug);
        } else {
            results.failed.push({ slug, reason: result.reason });
        }
    });

    console.log('\n📊 RESUMEN:');
    console.log(`✅ Mapas agregados: ${results.success.length}`);
    console.log(`⏭️  Ya tenían mapa: ${results.alreadyHasMap.length}`);
    console.log(`❌ Fallidos: ${results.failed.length}`);

    if (results.failed.length > 0) {
        console.log('\n❌ Propiedades fallidas:');
        results.failed.forEach(item => console.log(`   - ${item.slug} (${item.reason})`));
    }
}

main();
