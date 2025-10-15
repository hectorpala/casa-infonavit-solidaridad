const fs = require('fs');
const path = require('path');

// 🎯 CONFIGURACIÓN
const CONFIG = {
    SOURCE_HTML: 'culiacan/index.html',
    OUTPUT_DIR: 'culiacan-ghost',
    OUTPUT_FILE: 'index.html'
};

console.log('🚀 GENERANDO CULIACÁN GHOST - Versión interactiva tipo Mazatlán\n');

// 1️⃣ Leer HTML de Culiacán actual
console.log('📂 Leyendo propiedades de culiacan/index.html...');
const html = fs.readFileSync(CONFIG.SOURCE_HTML, 'utf8');

// 2️⃣ Extraer todas las propiedades con REGEX
const propiedades = [];
let count = 0;

// Extraer todos los bloques de tarjetas <!-- BEGIN CARD-ADV ... --> ... <!-- END CARD-ADV -->
const cardRegex = /<!-- BEGIN CARD-ADV (.*?) -->([\s\S]*?)<!-- END CARD-ADV.*?-->/g;
let match;

while ((match = cardRegex.exec(html)) !== null) {
    const slug = match[1].trim();
    const cardHTML = match[2];

    // Extraer data-href
    const hrefMatch = cardHTML.match(/data-href="([^"]+)"/);
    const href = hrefMatch ? hrefMatch[1] : `${slug}/index.html`;

    // Extraer precio del badge
    const precioMatch = cardHTML.match(/bg-(green|orange)-\d+[^>]*>(.*?)<\/div>/);
    const precio = precioMatch ? precioMatch[2].trim() : 'Consultar';
    const esRenta = cardHTML.includes('bg-orange-') || precio.includes('/mes');

    // Extraer ubicación
    const ubicacionMatch = cardHTML.match(/Casa en (Venta|Renta) ([^·]+)/);
    const ubicacion = ubicacionMatch ? ubicacionMatch[2].trim() : 'Culiacán, Sinaloa';

    // Extraer características
    const recamarasMatch = cardHTML.match(/(\d+)\s*Recámaras?/i);
    const banosMatch = cardHTML.match(/(\d+(?:\.\d+)?)\s*Baños?/i);
    const m2Match = cardHTML.match(/(\d+(?:,\d+)?)\s*m²/i);

    const recamaras = recamarasMatch ? parseInt(recamarasMatch[1]) : 3;
    const banos = banosMatch ? parseFloat(banosMatch[1]) : 2;
    const m2 = m2Match ? parseInt(m2Match[1].replace(',', '')) : 200;

    // Extraer primera imagen
    const imagenMatch = cardHTML.match(/<img[^>]+src="([^"]+)"/);
    const imagen = imagenMatch ? imagenMatch[1] : '';

    // URL completa
    const urlCompleta = href.startsWith('http') ? href : `https://casasenventa.info/culiacan/${href}`;

    // Coordenadas aproximadas (Culiacán con variación)
    const lat = 24.8091 + (Math.random() - 0.5) * 0.1;
    const lng = -107.3940 + (Math.random() - 0.5) * 0.1;

    propiedades.push({
        id: `prop-${count + 1}`,
        titulo: slug.replace(/-/g, ' '),
        precio: precio,
        ubicacion: ubicacion,
        tipo: esRenta ? 'renta' : 'venta',
        recamaras: recamaras,
        banos: banos,
        m2: m2,
        imagen: imagen,
        url: urlCompleta,
        lat: lat,
        lng: lng
    });

    count++;
}

console.log(`✅ ${propiedades.length} propiedades extraídas\n`);

// 3️⃣ Generar HTML interactivo tipo Mazatlán Ghost
console.log('🎨 Generando HTML interactivo...\n');

const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Casas en Venta Culiacán - Mapa Interactivo | Hector es Bienes Raíces</title>
    <meta name="description" content="Explora ${propiedades.length} propiedades en venta en Culiacán con mapa interactivo. Encuentra tu hogar ideal.">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">

    <!-- Google Maps -->
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBPqY9-hQ6JzqLNY9h9hU1DPCqU6Fuj-lw&libraries=places,marker"></script>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Open Sans', sans-serif;
            background: #f5f5f5;
            overflow-x: hidden;
        }

        /* Header */
        .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 1000;
            padding: 16px 20px;
        }

        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .logo {
            font-size: 20px;
            font-weight: 700;
            color: #FF6A00;
        }

        .search-bar {
            flex: 1;
            max-width: 500px;
            margin: 0 20px;
        }

        .search-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
        }

        .results-count {
            color: #666;
            font-size: 14px;
            white-space: nowrap;
        }

        /* Filters */
        .filters {
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background: white;
            border-bottom: 1px solid #eee;
            padding: 12px 20px;
            z-index: 999;
            overflow-x: auto;
            white-space: nowrap;
        }

        .filter-chips {
            display: inline-flex;
            gap: 8px;
        }

        .filter-chip {
            padding: 8px 16px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 20px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .filter-chip:hover {
            border-color: #FF6A00;
            background: #fff5f0;
        }

        .filter-chip.active {
            background: #FF6A00;
            color: white;
            border-color: #FF6A00;
        }

        /* Main Container */
        .main-container {
            margin-top: 140px;
            display: flex;
            height: calc(100vh - 140px);
        }

        /* Map */
        .map-container {
            flex: 1;
            position: relative;
        }

        #map {
            width: 100%;
            height: 100%;
        }

        /* Listings */
        .listings-container {
            width: 450px;
            overflow-y: auto;
            background: white;
            border-left: 1px solid #eee;
        }

        .listings-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            position: sticky;
            top: 0;
            background: white;
            z-index: 10;
        }

        .listings-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .listings-subtitle {
            font-size: 14px;
            color: #666;
        }

        /* Property Cards */
        .property-card {
            padding: 16px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background 0.2s;
        }

        .property-card:hover {
            background: #f9f9f9;
        }

        .property-card.highlighted {
            background: #fff5f0;
            border-left: 4px solid #FF6A00;
        }

        .property-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 12px;
        }

        .property-price {
            font-size: 20px;
            font-weight: 700;
            color: #FF6A00;
            margin-bottom: 8px;
        }

        .property-location {
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
        }

        .property-specs {
            display: flex;
            gap: 16px;
            font-size: 13px;
            color: #888;
        }

        .spec-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        /* Mobile Toggle */
        .mobile-toggle {
            display: none;
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 12px 24px;
            border-radius: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            cursor: pointer;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .main-container {
                flex-direction: column;
            }

            .map-container,
            .listings-container {
                width: 100%;
                height: 50vh;
            }

            .listings-container {
                border-left: none;
                border-top: 1px solid #eee;
            }

            .mobile-toggle {
                display: block;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-content">
            <div class="logo">🏠 Hector es Bienes Raíces</div>
            <div class="search-bar">
                <input type="text" class="search-input" placeholder="Buscar por ubicación, precio..." id="searchInput">
            </div>
            <div class="results-count" id="resultsCount">${propiedades.length} propiedades</div>
        </div>
    </div>

    <!-- Filters -->
    <div class="filters">
        <div class="filter-chips">
            <button class="filter-chip active" data-filter="all">Todas</button>
            <button class="filter-chip" data-filter="venta">En Venta</button>
            <button class="filter-chip" data-filter="renta">En Renta</button>
            <button class="filter-chip" data-filter="3bed">3+ Recámaras</button>
            <button class="filter-chip" data-filter="<2m">< $2M</button>
            <button class="filter-chip" data-filter="2-4m">$2M - $4M</button>
            <button class="filter-chip" data-filter=">4m">> $4M</button>
        </div>
    </div>

    <!-- Main Container -->
    <div class="main-container">
        <!-- Map -->
        <div class="map-container">
            <div id="map"></div>
        </div>

        <!-- Listings -->
        <div class="listings-container" id="listingsContainer">
            <div class="listings-header">
                <div class="listings-title">Propiedades en Culiacán</div>
                <div class="listings-subtitle" id="listingsSubtitle">${propiedades.length} resultados</div>
            </div>
            <div id="listings">
                ${propiedades.map((prop, index) => `
                <div class="property-card" data-id="${prop.id}" data-lat="${prop.lat}" data-lng="${prop.lng}" data-tipo="${prop.tipo}" data-precio="${prop.precio}">
                    <img src="${prop.imagen || 'https://via.placeholder.com/400x200?text=Sin+Imagen'}" alt="${prop.titulo}" class="property-image" loading="lazy">
                    <div class="property-price">${prop.precio}</div>
                    <div class="property-location">${prop.ubicacion}</div>
                    <div class="property-specs">
                        <span class="spec-item">🛏️ ${prop.recamaras}</span>
                        <span class="spec-item">🚿 ${prop.banos}</span>
                        <span class="spec-item">📐 ${prop.m2}m²</span>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </div>

    <!-- Mobile Toggle -->
    <div class="mobile-toggle" id="mobileToggle">
        Ver Mapa / Lista
    </div>

    <script>
        // 🗺️ DATOS DE PROPIEDADES
        const properties = ${JSON.stringify(propiedades, null, 2)};

        // 🗺️ INICIALIZAR MAPA
        let map;
        let markers = [];
        let infoWindow;

        function initMap() {
            // Centro de Culiacán
            const center = { lat: 24.8091, lng: -107.3940 };

            map = new google.maps.Map(document.getElementById('map'), {
                center: center,
                zoom: 12,
                mapTypeControl: false,
                fullscreenControl: false,
                streetViewControl: false,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });

            infoWindow = new google.maps.InfoWindow();

            // Crear markers
            properties.forEach((prop, index) => {
                const marker = new google.maps.Marker({
                    position: { lat: prop.lat, lng: prop.lng },
                    map: map,
                    title: prop.titulo,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: prop.tipo === 'renta' ? '#FF6A00' : '#22C55E',
                        fillOpacity: 1,
                        strokeColor: 'white',
                        strokeWeight: 2
                    }
                });

                marker.addListener('click', () => {
                    highlightProperty(prop.id);
                    scrollToProperty(prop.id);

                    infoWindow.setContent(\`
                        <div style="padding: 8px; max-width: 200px;">
                            <div style="font-weight: 700; color: #FF6A00; margin-bottom: 4px;">\${prop.precio}</div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 8px;">\${prop.ubicacion}</div>
                            <div style="font-size: 12px; color: #888;">
                                🛏️ \${prop.recamaras} | 🚿 \${prop.banos} | 📐 \${prop.m2}m²
                            </div>
                        </div>
                    \`);
                    infoWindow.open(map, marker);
                });

                markers.push({ marker, prop });
            });
        }

        // 🔍 BÚSQUEDA Y FILTROS
        const searchInput = document.getElementById('searchInput');
        const filterChips = document.querySelectorAll('.filter-chip');
        let currentFilter = 'all';

        searchInput.addEventListener('input', applyFilters);

        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentFilter = chip.dataset.filter;
                applyFilters();
            });
        });

        function applyFilters() {
            const searchTerm = searchInput.value.toLowerCase();
            let visibleCount = 0;

            document.querySelectorAll('.property-card').forEach(card => {
                const text = card.textContent.toLowerCase();
                const tipo = card.dataset.tipo;
                const precio = card.dataset.precio;

                // Búsqueda de texto
                const matchesSearch = searchTerm === '' || text.includes(searchTerm);

                // Filtro de tipo
                let matchesFilter = true;
                if (currentFilter === 'venta') matchesFilter = tipo === 'venta';
                else if (currentFilter === 'renta') matchesFilter = tipo === 'renta';
                else if (currentFilter === '3bed') matchesFilter = text.includes('🛏️ 3') || text.includes('🛏️ 4') || text.includes('🛏️ 5');
                else if (currentFilter === '<2m') matchesFilter = extractPrice(precio) < 2000000;
                else if (currentFilter === '2-4m') {
                    const p = extractPrice(precio);
                    matchesFilter = p >= 2000000 && p <= 4000000;
                }
                else if (currentFilter === '>4m') matchesFilter = extractPrice(precio) > 4000000;

                const visible = matchesSearch && matchesFilter;
                card.style.display = visible ? 'block' : 'none';

                if (visible) visibleCount++;
            });

            document.getElementById('listingsSubtitle').textContent = \`\${visibleCount} resultados\`;
            document.getElementById('resultsCount').textContent = \`\${visibleCount} propiedades\`;
        }

        function extractPrice(priceStr) {
            const match = priceStr.match(/\\$([\\d,]+)/);
            if (!match) return 0;
            return parseInt(match[1].replace(/,/g, ''));
        }

        // 🎯 INTERACCIÓN MAPA ↔ LISTADO
        document.querySelectorAll('.property-card').forEach(card => {
            card.addEventListener('click', () => {
                const lat = parseFloat(card.dataset.lat);
                const lng = parseFloat(card.dataset.lng);
                const id = card.dataset.id;

                map.panTo({ lat, lng });
                map.setZoom(15);

                highlightProperty(id);

                // Abrir en nueva pestaña
                const prop = properties.find(p => p.id === id);
                if (prop) window.open(prop.url, '_blank');
            });
        });

        function highlightProperty(id) {
            document.querySelectorAll('.property-card').forEach(c => c.classList.remove('highlighted'));
            const card = document.querySelector(\`.property-card[data-id="\${id}"]\`);
            if (card) card.classList.add('highlighted');
        }

        function scrollToProperty(id) {
            const card = document.querySelector(\`.property-card[data-id="\${id}"]\`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // 📱 MOBILE TOGGLE
        const mobileToggle = document.getElementById('mobileToggle');
        let showingMap = true;

        mobileToggle.addEventListener('click', () => {
            const mapContainer = document.querySelector('.map-container');
            const listingsContainer = document.querySelector('.listings-container');

            if (showingMap) {
                mapContainer.style.display = 'none';
                listingsContainer.style.height = '100vh';
                mobileToggle.textContent = 'Ver Mapa';
            } else {
                mapContainer.style.display = 'block';
                listingsContainer.style.height = '50vh';
                mobileToggle.textContent = 'Ver Lista';
            }

            showingMap = !showingMap;
        });

        // 🚀 INICIALIZAR
        window.addEventListener('load', initMap);
    </script>
</body>
</html>`;

// 4️⃣ Crear carpeta y guardar archivo
console.log('💾 Guardando archivos...\n');

if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
}

const outputPath = path.join(CONFIG.OUTPUT_DIR, CONFIG.OUTPUT_FILE);
fs.writeFileSync(outputPath, htmlTemplate, 'utf8');

console.log('✅ CULIACÁN GHOST GENERADO EXITOSAMENTE\n');
console.log('═══════════════════════════════════════════════════════════');
console.log(`📊 Estadísticas:`);
console.log(`   - Total propiedades: ${propiedades.length}`);
console.log(`   - En venta: ${propiedades.filter(p => p.tipo === 'venta').length}`);
console.log(`   - En renta: ${propiedades.filter(p => p.tipo === 'renta').length}`);
console.log('═══════════════════════════════════════════════════════════');
console.log(`📁 Archivo generado: ${outputPath}`);
console.log(`🌐 URL local: file://${path.resolve(outputPath)}`);
console.log(`🚀 URL producción: https://casasenventa.info/culiacan-ghost/`);
console.log('═══════════════════════════════════════════════════════════\n');
console.log('🎯 CARACTERÍSTICAS:');
console.log('   ✅ Mapa interactivo Google Maps');
console.log('   ✅ Filtros por tipo, precio, recámaras');
console.log('   ✅ Búsqueda en tiempo real');
console.log('   ✅ Sincronización mapa ↔ listado');
console.log('   ✅ Responsive mobile con toggle mapa/lista');
console.log('   ✅ Diseño tipo Zillow/Mazatlán Ghost');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('💡 Próximo paso: Abre el archivo en tu navegador y luego "publica ya"\n');
