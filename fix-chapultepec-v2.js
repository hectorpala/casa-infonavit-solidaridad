const fs = require('fs');

let html = fs.readFileSync('culiacan/casa-venta-chapultepec/index.html', 'utf8');

// 1. Hero subtitle
html = html.replace(/Se vende Casa en Infonavit Solidaridad.*?cuarto tv una sola planta/s,
    'Casa amplia en Chapultepec. 284 m² de construcción, 470 m² terreno, 3 recámaras, 2.5 baños, cochera techada para 2 autos');

// 2. Sticky price label
html = html.replace(/<span class="sticky-price-label">Casa Infonavit Solidaridad<\/span>/,
    '<span class="sticky-price-label">Casa Chapultepec</span>');

// 3. Contact location
html = html.replace(/Blvrd Elbert 2609, Infonavit Solidaridad, Solidaridad, 80058 Culiacán Rosales/,
    'Psicólogos, Chapultepec, 80040 Culiacán');

// 4. Feature badges (rec, baños, m²)
html = html.replace(/<span class="feature-value">2<\/span>\s*<span class="feature-label">rec<\/span>/,
    '<span class="feature-value">3</span>\n                    <span class="feature-label">rec</span>');

html = html.replace(/<span class="feature-value">2<\/span>\s*<span class="feature-label">baños<\/span>/,
    '<span class="feature-value">2.5</span>\n                    <span class="feature-label">baños</span>');

html = html.replace(/<span class="feature-value">112\.5<\/span>\s*<span class="feature-label">m²<\/span>/,
    '<span class="feature-value">284</span>\n                    <span class="feature-label">m²</span>');

// 5. WhatsApp links
html = html.replace(/Me%20interesa%20la%20casa%20en%20Infonavit%20Solidaridad%20de%20%241%2C750%2C000/g,
    'Me%20interesa%20la%20casa%20en%20Chapultepec%20de%20%242%2C800%2C000');

html = html.replace(/Me%20interesan%20informes%20de%20la%20casa%20remodelada%20en%20Infonavit%20Solidaridad/g,
    'Me%20interesan%20informes%20de%20la%20casa%20en%20Chapultepec');

html = html.replace(/¡Mira esta increíble casa en venta en Infonavit Solidaridad! \$2,800,000/,
    '¡Mira esta increíble casa en venta en Chapultepec! $2,800,000');

html = html.replace(/Casa en Infonavit Solidaridad\\nPrecio: \$2,800,000\\n2 recámaras, 2 baños completos\\n112\.5 m² terreno/,
    'Casa en Chapultepec\\nPrecio: $2,800,000\\n3 recámaras, 2.5 baños\\n284 m² construcción, 470 m² terreno');

html = html.replace(/Casa en venta - Infonavit Solidaridad/,
    'Casa en venta - Chapultepec');

// 6. Replace all photo paths (fachada*.jpg and 202509*.jpg → foto-*.jpg)
const photoMappings = [
    ['fachada1.jpg', 'foto-1.jpg'],
    ['fachada2.jpg', 'foto-2.jpg'],
    ['fachada3.jpg', 'foto-3.jpg'],
    ['20250915_134401.jpg', 'foto-4.jpg'],
    ['20250915_134444.jpg', 'foto-5.jpg'],
    ['20250915_134455.jpg', 'foto-5.jpg'],
    ['20250915_134516.jpg', 'foto-5.jpg'],
    ['20250915_134637.jpg', 'foto-5.jpg'],
    ['20250915_134648.jpg', 'foto-5.jpg'],
    ['20250915_134702.jpg', 'foto-5.jpg'],
    ['20250915_134718.jpg', 'foto-5.jpg'],
    ['20250915_134734.jpg', 'foto-5.jpg'],
    ['20250915_134752.jpg', 'foto-5.jpg'],
    ['20250915_134815.jpg', 'foto-5.jpg']
];

photoMappings.forEach(([old, newP]) => {
    html = html.replace(new RegExp(`images/${old}`, 'g'), `images/${newP}`);
});

// 7. Update lightboxImages array (only 5 photos)
html = html.replace(/const lightboxImages = \[[\s\S]*?\];/, `const lightboxImages = [
            { src: 'images/foto-1.jpg', alt: 'Fachada Principal' },
            { src: 'images/foto-2.jpg', alt: 'Vista Exterior' },
            { src: 'images/foto-3.jpg', alt: 'Interior' },
            { src: 'images/foto-4.jpg', alt: 'Sala' },
            { src: 'images/foto-5.jpg', alt: 'Cocina' }
        ];`);

// 8. Remove carousel slides 6-14 (keep only 5)
for (let i = 5; i <= 13; i++) {
    const slideRegex = new RegExp(`\\s*<div class="carousel-slide" data-slide="${i}">\\s*<img[^>]+>\\s*</div>`, 'gs');
    html = html.replace(slideRegex, '');
}

// 9. Remove dots 6-14
for (let i = 5; i <= 13; i++) {
    const dotRegex = new RegExp(`\\s*<button class="carousel-dot"[^>]*onclick="goToSlideHero\\(${i}\\)"[^>]*></button>`, 'gs');
    html = html.replace(dotRegex, '');
}

fs.writeFileSync('culiacan/casa-venta-chapultepec/index.html', html);
console.log('✅ Chapultepec HTML actualizado (método Casa Solidaridad)');
