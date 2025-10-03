const fs = require('fs');

let html = fs.readFileSync('culiacan/casa-venta-chapultepec/index.html', 'utf8');

// 1. Fix bedrooms/bathrooms badges (features section)
html = html.replace(/<span class="feature-value">2<\/span>\s*<span class="feature-label">rec<\/span>/,
    '<span class="feature-value">3</span>\n                    <span class="feature-label">rec</span>');

html = html.replace(/<span class="feature-value">2<\/span>\s*<span class="feature-label">baños<\/span>/,
    '<span class="feature-value">2.5</span>\n                    <span class="feature-label">baños</span>');

html = html.replace(/<span class="feature-value">112\.5<\/span>\s*<span class="feature-label">m²<\/span>/,
    '<span class="feature-value">284</span>\n                    <span class="feature-label">m²</span>');

// 2. Fix construction area badge
html = html.replace(/91\.6 m² construcción/, '284 m² construcción');

// 3. Fix Schema.org data
html = html.replace(/"numberOfBedrooms": 2,/, '"numberOfBedrooms": 3,');
html = html.replace(/"numberOfBathroomsTotal": 2,/, '"numberOfBathroomsTotal": 2.5,');
html = html.replace(/"numberOfFullBathrooms": 2,/, '"numberOfFullBathrooms": 2,');
html = html.replace(/"value": 91\.60,/, '"value": 284,');
html = html.replace(/"value": 112\.5,/, '"value": 470,');
html = html.replace(/"price": "1750000",/, '"price": "2800000",');

// 4. Fix photo paths (fachada1.jpg → foto-1.jpg, etc)
for (let i = 1; i <= 14; i++) {
    const fachada = i <= 3 ? `fachada${i}.jpg` : `20250915_13${String(4400 + i).slice(-4)}.jpg`;
    html = html.replace(new RegExp(`images/${fachada}`, 'g'), `images/foto-${Math.min(i, 5)}.jpg`);
}

// 5. Update lightboxImages array (only 5 photos)
const lightboxSection = html.match(/const lightboxImages = \[([\s\S]*?)\];/);
if (lightboxSection) {
    const newLightbox = `const lightboxImages = [
            { src: 'images/foto-1.jpg', alt: 'Fachada Principal' },
            { src: 'images/foto-2.jpg', alt: 'Vista Exterior' },
            { src: 'images/foto-3.jpg', alt: 'Interior' },
            { src: 'images/foto-4.jpg', alt: 'Sala' },
            { src: 'images/foto-5.jpg', alt: 'Cocina' }
        ];`;
    html = html.replace(/const lightboxImages = \[[\s\S]*?\];/, newLightbox);
}

// 6. Remove slides 6-14 (keep only 5)
for (let i = 6; i <= 14; i++) {
    const slideRegex = new RegExp(`<div class="carousel-slide" data-slide="${i-1}">\\s*<img[^>]+>\\s*</div>\\s*`, 'g');
    html = html.replace(slideRegex, '');
}

// 7. Remove dots 6-14
for (let i = 6; i <= 14; i++) {
    const dotRegex = new RegExp(`<button class="carousel-dot"[^>]*onclick="goToSlideHero\\(${i-1}\\)"[^>]*></button>\\s*`, 'g');
    html = html.replace(dotRegex, '');
}

// 8. Fix WhatsApp links
html = html.replace(/Me%20interesa%20la%20casa%20en%20Infonavit%20Solidaridad%20de%20%241%2C750%2C000/g,
    'Me%20interesa%20la%20casa%20en%20Chapultepec%20de%20%242%2C800%2C000');

html = html.replace(/Me%20interesan%20informes%20de%20la%20casa%20remodelada%20en%20Infonavit%20Solidaridad/g,
    'Me%20interesan%20informes%20de%20la%20casa%20en%20Chapultepec');

fs.writeFileSync('culiacan/casa-venta-chapultepec/index.html', html);
console.log('✅ Chapultepec HTML actualizado');
