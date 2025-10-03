const fs = require('fs');

let html = fs.readFileSync('culiacan/casa-venta-san-javier/index.html', 'utf8');

// 1. Replace all prices
html = html.replace(/\$1,750,000/g, '$3,500,000');

// 2. Meta tags
html = html.replace(
    /<title>Casa en Venta \$1,750,000 - Infonavit Solidaridad, Culiacán \| Hector es Bienes Raíces<\/title>/,
    '<title>Casa en Venta $3,500,000 - San Javier La Primavera, Culiacán | Hector es Bienes Raíces</title>'
);

html = html.replace(
    /Casa remodelada en venta en Infonavit Solidaridad, Culiacán\. 2 recámaras, 2 baños completos, cochera techada\. 112\.5m² terreno/,
    'Casa nueva en venta en San Javier La Primavera, Culiacán. 3 recámaras, 3 baños, cochera techada. 362m² construcción'
);

html = html.replace(
    /casa venta Culiacán, Infonavit Solidaridad, casa remodelada, 2 recámaras, cochera techada, Blvrd Elbert/,
    'casa venta Culiacán, San Javier La Primavera, casa nueva, 3 recámaras, cochera techada'
);

html = html.replace(
    /https:\/\/casasenventa\.info\/culiacan-infonavit-solidaridad\//g,
    'https://casasenventa.info/culiacan/casa-venta-san-javier/'
);

// 3. Open Graph
html = html.replace(/Casa en Venta \$\d+,\d+,\d+ - Infonavit Solidaridad/g, 'Casa en Venta $3,500,000 - San Javier La Primavera');
html = html.replace(/Hermosa casa remodelada con 2 recámaras, 2 baños completos y cochera techada para 2 autos\./,
    'Casa nueva con 3 recámaras, 3 baños y cochera techada para 2 autos.');

html = html.replace(/culiacan\/infonavit-solidaridad\/images\/fachada1\.jpg/g, 'culiacan/casa-venta-san-javier/images/foto-1.jpg');

// 4. Schema.org
html = html.replace(/Casa Remodelada en Infonavit Solidaridad/, 'Casa Nueva en San Javier La Primavera');
html = html.replace(/Casa remodelada en venta en Infonavit Solidaridad, Culiacán\. 2 recámaras, 2 baños completos, cochera techada\. 112\.5m² terreno\./,
    'Casa nueva en venta en San Javier La Primavera, Culiacán. 3 recámaras, 3 baños, cochera techada. 362m² construcción.');

html = html.replace(/"streetAddress": "Blvrd Elbert 2609",/, '"streetAddress": "Barrio San Javier",');
html = html.replace(/"addressLocality": "Infonavit Solidaridad",/, '"addressLocality": "La Primavera",');
html = html.replace(/"postalCode": "80058",/, '"postalCode": "80199",');

html = html.replace(/"value": 91\.60,/, '"value": 362,');
html = html.replace(/"value": 112\.5,/, '"value": 362,');

html = html.replace(/"numberOfBedrooms": 2,/, '"numberOfBedrooms": 3,');
html = html.replace(/"numberOfBathroomsTotal": 2,/, '"numberOfBathroomsTotal": 3,');
html = html.replace(/"numberOfFullBathrooms": 2,/, '"numberOfFullBathrooms": 3,');
html = html.replace(/"numberOfRooms": 4,/, '"numberOfRooms": 6,');

html = html.replace(/"yearBuilt": 2020,/, '"yearBuilt": 2024,');
html = html.replace(/"price": "1750000",/, '"price": "3500000",');

// 5. CSS paths
html = html.replace(/href="styles\.css"/g, 'href="../infonavit-solidaridad/styles.css"');
html = html.replace(/href="images\/fachada1\.jpg"/g, 'href="images/foto-1.jpg"');

// 6. Hero subtitle
html = html.replace(/Se vende Casa en Infonavit Solidaridad.*?cuarto tv una sola planta/s,
    'Casa nueva en San Javier La Primavera. 362 m² construcción, 3 recámaras, 3 baños completos, cochera techada para 2 autos');

// 7. Sticky price label
html = html.replace(/Casa Infonavit Solidaridad/, 'Casa San Javier La Primavera');

// 8. Contact location
html = html.replace(/Blvrd Elbert 2609, Infonavit Solidaridad, Solidaridad, 80058 Culiacán Rosales/,
    'Barrio San Javier, La Primavera, 80199 Culiacán');

// 9. Feature badges
html = html.replace(/<span class="feature-value">2<\/span>\s*<span class="feature-label">rec<\/span>/,
    '<span class="feature-value">3</span>\n                    <span class="feature-label">rec</span>');

html = html.replace(/<span class="feature-value">2<\/span>\s*<span class="feature-label">baños<\/span>/,
    '<span class="feature-value">3</span>\n                    <span class="feature-label">baños</span>');

html = html.replace(/<span class="feature-value">112\.5<\/span>\s*<span class="feature-label">m²<\/span>/,
    '<span class="feature-value">362</span>\n                    <span class="feature-label">m²</span>');

// 10. totalSlidesHero
html = html.replace(/const totalSlidesHero = 14;/, 'const totalSlidesHero = 10;');

// 11. WhatsApp links
html = html.replace(/Me%20interesa%20la%20casa%20en%20Infonavit%20Solidaridad%20de%20%24\d+%2C\d+%2C\d+/g,
    'Me%20interesa%20la%20casa%20en%20San%20Javier%20La%20Primavera%20de%20%243%2C500%2C000');

html = html.replace(/Me%20interesan%20informes%20de%20la%20casa%20remodelada%20en%20Infonavit%20Solidaridad/g,
    'Me%20interesan%20informes%20de%20la%20casa%20nueva%20en%20San%20Javier%20La%20Primavera');

html = html.replace(/¡Mira esta increíble casa en venta en Infonavit Solidaridad! \$\d+,\d+,\d+/,
    '¡Mira esta increíble casa en venta en San Javier La Primavera! $3,500,000');

html = html.replace(/Casa en Infonavit Solidaridad\\nPrecio: \$\d+,\d+,\d+\\n2 recámaras, 2 baños completos\\n112\.5 m² terreno/,
    'Casa en San Javier La Primavera\\nPrecio: $3,500,000\\n3 recámaras, 3 baños\\n362 m² construcción');

html = html.replace(/Casa en venta - Infonavit Solidaridad/, 'Casa en venta - San Javier La Primavera');

// 12. Replace all photo paths (fachada + old photos → foto-1 to foto-10)
const photoMappings = [
    ['fachada1.jpg', 'foto-1.jpg'],
    ['fachada2.jpg', 'foto-2.jpg'],
    ['fachada3.jpg', 'foto-3.jpg'],
    ['20250915_134401.jpg', 'foto-4.jpg'],
    ['20250915_134444.jpg', 'foto-5.jpg'],
    ['20250915_134455.jpg', 'foto-6.jpg'],
    ['20250915_134516.jpg', 'foto-7.jpg'],
    ['20250915_134637.jpg', 'foto-8.jpg'],
    ['20250915_134648.jpg', 'foto-9.jpg'],
    ['20250915_134702.jpg', 'foto-10.jpg'],
    ['20250915_134718.jpg', 'foto-10.jpg'],
    ['20250915_134734.jpg', 'foto-10.jpg'],
    ['20250915_134752.jpg', 'foto-10.jpg'],
    ['20250915_134815.jpg', 'foto-10.jpg']
];

photoMappings.forEach(([old, newP]) => {
    html = html.replace(new RegExp(`images/${old}`, 'g'), `images/${newP}`);
});

// 13. Update lightboxImages array to 10 photos
html = html.replace(/const lightboxImages = \[[\s\S]*?\];/, `const lightboxImages = [
            { src: 'images/foto-1.jpg', alt: 'Fachada Principal' },
            { src: 'images/foto-2.jpg', alt: 'Vista Exterior' },
            { src: 'images/foto-3.jpg', alt: 'Interior 1' },
            { src: 'images/foto-4.jpg', alt: 'Sala' },
            { src: 'images/foto-5.jpg', alt: 'Comedor' },
            { src: 'images/foto-6.jpg', alt: 'Recámara 1' },
            { src: 'images/foto-7.jpg', alt: 'Recámara 2' },
            { src: 'images/foto-8.jpg', alt: 'Baño' },
            { src: 'images/foto-9.jpg', alt: 'Cocina' },
            { src: 'images/foto-10.jpg', alt: 'Detalles' }
        ];`);

// 14. Remove carousel slides 11-14
for (let i = 11; i <= 14; i++) {
    const slideRegex = new RegExp(`\\s*<div class="carousel-slide" data-slide="${i}">\\s*<img[^>]+>\\s*</div>`, 'gs');
    html = html.replace(slideRegex, '');
}

// 15. Remove dots 11-14
for (let i = 11; i <= 14; i++) {
    const dotRegex = new RegExp(`\\s*<button class="carousel-dot"[^>]*onclick="goToSlideHero\\(${i}\\)"[^>]*></button>`, 'gs');
    html = html.replace(dotRegex, '');
}

fs.writeFileSync('culiacan/casa-venta-san-javier/index.html', html);
console.log('✅ San Javier HTML actualizado (método Casa Solidaridad)');
