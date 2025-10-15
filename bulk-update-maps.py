#!/usr/bin/env python3
import os
import re
import json

# Properties to update
properties = [
    "casa-venta-casa-remodelada-en-infonavit-solidaridad-INFONAVIT-SOLIDARIDAD",
    "casa-venta-centro-089732",
    "casa-venta-centro-277608",
    "casa-venta-centro-sinaloa-367869",
    "casa-venta-chapultepec",
    "casa-venta-colinas-san-miguel-culiacan-8-450-000",
    "casa-venta-country-del-rio-iv-093670",
    "casa-venta-culiacan-culiacan-196364",
    "casa-venta-emiliano-zapata-581422"
]

base_path = "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/culiacan"

# Map template to inject
map_template = '''    <!-- Location Map Section - Desktop Only -->
    <section class="location-map scroll-animate" id="location">
        <div class="container">
            <h2 class="section-title">Ubicación</h2>
            <p class="location-subtitle">{subtitle}</p>

    <!-- Mapa con Marcador Personalizado -->
    <div id="map-container" style="width: 100%; height: 450px; border-radius: 12px; overflow: hidden;"></div>

    <script>
        // Variables globales para el mapa
        let map;
        let marker;
        let geocoder;

        // Configuración del marcador personalizado
        const MARKER_CONFIG = {{
            location: "{location}",
            priceShort: "{price_short}",
            title: "{title}",
            precision: "generic",
            latOffset: 0,
            lngOffset: 0
        }};

        // Función para crear marcador personalizado
        function createPropertyMarker(property, map, isCurrent = false) {{
            const markerHTML = `
                <div style="
                    background: ${{isCurrent ? 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}};
                    color: white;
                    padding: ${{isCurrent ? '8px 14px' : '6px 10px'}};
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: ${{isCurrent ? '14px' : '12px'}};
                    border: 3px solid white;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    cursor: pointer;
                    white-space: nowrap;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    ${{property.priceShort}}
                </div>
            `;

            const CustomMarker = function(position, map, property, isCurrent) {{
                this.position = position;
                this.property = property;
                this.isCurrent = isCurrent;
                this.div = null;
                this.setMap(map);
            }};

            CustomMarker.prototype = new google.maps.OverlayView();

            CustomMarker.prototype.onAdd = function() {{
                const div = document.createElement('div');
                div.style.position = 'absolute';
                div.innerHTML = markerHTML;

                div.addEventListener('click', () => {{
                    const infoWindow = new google.maps.InfoWindow({{
                        content: `
                            <div style="padding: 0; max-width: 260px;">
                                <img src="${{this.property.image}}"
                                     alt="${{this.property.title}}"
                                     style="width: 100%; height: 160px; object-fit: cover; display: block; border-radius: 4px 4px 0 0;">
                                <div style="padding: 8px 10px;">
                                    <h4 style="margin: 0 0 4px 0; color: ${{this.isCurrent ? '#FF6B35' : '#10b981'}}; font-size: 14px; font-weight: 600;">${{this.property.priceShort}}</h4>
                                    <h5 style="margin: 0 0 3px 0; color: #1f2937; font-size: 12px; font-weight: 600;">${{this.property.title}}</h5>
                                    <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 11px; line-height: 1.3;">${{this.property.location}}</p>
                                </div>
                            </div>
                        `
                    }});
                    infoWindow.setPosition(this.position);
                    infoWindow.open(map);
                }});

                this.div = div;
                const panes = this.getPanes();
                panes.overlayMouseTarget.appendChild(div);
            }};

            CustomMarker.prototype.draw = function() {{
                const overlayProjection = this.getProjection();
                const position = overlayProjection.fromLatLngToDivPixel(this.position);
                const div = this.div;
                div.style.left = (position.x - (this.isCurrent ? 40 : 30)) + 'px';
                div.style.top = (position.y - (this.isCurrent ? 20 : 16)) + 'px';
            }};

            CustomMarker.prototype.onRemove = function() {{
                if (this.div) {{
                    this.div.parentNode.removeChild(this.div);
                    this.div = null;
                }}
            }};

            return CustomMarker;
        }}

        // Inicializar mapa
        function initMap() {{
            geocoder = new google.maps.Geocoder();

            // Geocodificar la dirección
            geocoder.geocode({{ address: MARKER_CONFIG.location }}, function(results, status) {{
                if (status === 'OK' && results[0]) {{
                    const position = {{
                        lat: results[0].geometry.location.lat() + MARKER_CONFIG.latOffset,
                        lng: results[0].geometry.location.lng() + MARKER_CONFIG.lngOffset
                    }};

                    // Crear mapa
                    map = new google.maps.Map(document.getElementById('map-container'), {{
                        center: position,
                        zoom: MARKER_CONFIG.precision === 'exact' ? 17 :
                              MARKER_CONFIG.precision === 'street' ? 16 : 15,
                        mapTypeId: 'roadmap',
                        styles: [
                            {{
                                featureType: 'poi',
                                elementType: 'labels',
                                stylers: [{{ visibility: 'off' }}]
                            }}
                        ],
                        disableDefaultUI: false,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: true,
                        fullscreenControl: true
                    }});

                    // Crear marcador de la propiedad actual (naranja)
                    const currentProperty = {{
                        priceShort: MARKER_CONFIG.priceShort,
                        title: MARKER_CONFIG.title,
                        location: MARKER_CONFIG.location,
                        image: 'images/foto-1.jpg'
                    }};

                    const CustomMarkerClass = createPropertyMarker(currentProperty, map, true);
                    marker = new CustomMarkerClass(position, map, currentProperty, true);

                }} else {{
                    console.error('Geocode error:', status);
                    // Fallback: mostrar mapa en ubicación genérica
                    const fallbackCenter = {{ lat: 24.8091, lng: -107.3940 }}; // Culiacán centro
                    map = new google.maps.Map(document.getElementById('map-container'), {{
                        center: fallbackCenter,
                        zoom: 12
                    }});
                }}
            }});
        }}
    </script>

    <!-- Cargar Google Maps API -->
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk&callback=initMap&libraries=places" async defer></script>

        </div>
    </section>'''

def extract_property_data(html_content):
    """Extract price, title, and location from HTML"""
    # Extract price from title tag
    price_match = re.search(r'<title>Casa en Venta \$([0-9,]+)', html_content)
    price = price_match.group(1) if price_match else "0"

    # Convert to short format (e.g., $1,650,000 -> $1.65M)
    price_num = int(price.replace(',', ''))
    if price_num >= 1000000:
        price_short = f"${price_num / 1000000:.2f}M".replace('.00M', 'M')
    else:
        price_short = f"${price_num / 1000:.0f}K"

    # Extract title from Schema.org or meta tags
    title_match = re.search(r'"name":\s*"([^"]+)"', html_content)
    title = title_match.group(1) if title_match else "Casa en Venta"

    # Extract location from address or location-subtitle
    location_match = re.search(r'location-subtitle[^>]*>([^<]+)<', html_content)
    if not location_match:
        location_match = re.search(r'"streetAddress":\s*"([^"]+)"', html_content)
    location = location_match.group(1).strip() if location_match else "Culiacán"

    # Clean location
    if location and ',' in location:
        location_parts = location.split(',')
        location = f"{location_parts[0].strip()}, Culiacán"
    elif location and 'Culiacán' not in location:
        location = f"{location}, Culiacán"

    return {
        'price': f"${price}",
        'price_short': price_short,
        'title': title,
        'location': location,
        'subtitle': f"{title}, Culiacán"
    }

def update_property(prop_dir):
    """Update a single property's index.html with new map system"""
    index_path = os.path.join(base_path, prop_dir, 'index.html')

    if not os.path.exists(index_path):
        print(f"❌ File not found: {index_path}")
        return None

    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract data
    data = extract_property_data(content)

    # Generate new map section
    new_map = map_template.format(**data)

    # Find and replace old map section
    # Pattern 1: iframe-based map
    iframe_pattern = r'<!-- Location Map Section[^>]*-->\s*<section class="location-map[^>]*>.*?</section>'

    if re.search(iframe_pattern, content, re.DOTALL):
        content = re.sub(iframe_pattern, new_map, content, flags=re.DOTALL)
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated {prop_dir}: {data['price_short']}")
        return data
    else:
        print(f"⚠️  No map section found in {prop_dir}")
        return None

# Process all properties
results = []
for prop in properties:
    result = update_property(prop)
    if result:
        results.append({'dir': prop, **result})

# Output summary
print("\n" + "="*60)
print("SUMMARY:")
print("="*60)
for r in results:
    print(f"✅ {r['dir']}")
    print(f"   Price: {r['price_short']} | Location: {r['location']}")

print(f"\nTotal updated: {len(results)} properties")

# Save results for commit message
with open('lote5-results.json', 'w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
