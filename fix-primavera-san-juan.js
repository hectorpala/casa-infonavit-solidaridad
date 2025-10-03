const fs = require('fs');

let html = fs.readFileSync('culiacan/casa-venta-primavera-san-juan/index.html', 'utf8');

// 1. Replace ALL prices $1,750,000 → $13,300,000
html = html.replace(/\$1,750,000/g, '$13,300,000');
html = html.replace(/1750000/g, '13300000');

// 2. Replace title
html = html.replace(/Casa en Venta \$1,750,000 - Infonavit Solidaridad, Culiacán.*?<\/title>/,
    'Casa en Venta $13,300,000 - La Primavera San Juan, Culiacán | Hector es Bienes Raíces</title>');

// 3. Replace meta description
html = html.replace(/<meta name="description" content="[^"]+"/,
    '<meta name="description" content="Casa nueva en venta en La Primavera San Juan, Culiacán. 3 recámaras, 4.5 baños, 398m² construidos, 370m² terreno. A estrenar. ¡Contáctanos!"');

// 4. Replace canonical
html = html.replace(/https:\/\/casasenventa\.info\/culiacan\/infonavit-solidaridad\//g,
    'https://casasenventa.info/culiacan/casa-venta-primavera-san-juan/');

// 5. Replace Schema.org property name
html = html.replace(/"name": "Casa en Venta Infonavit Solidaridad - Culiacán, Sinaloa"/,
    '"name": "Casa en Venta La Primavera San Juan - Culiacán, Sinaloa"');

// 6. Replace Schema.org bathrooms (2 → 4.5)
html = html.replace(/"numberOfBathroomsTotal": 2/g, '"numberOfBathroomsTotal": 4.5');

// 7. Replace Schema.org bedrooms (2 → 3)
html = html.replace(/"numberOfBedrooms": 2/g, '"numberOfBedrooms": 3');

// 8. Replace Schema.org price
html = html.replace(/"price": "1750000"/g, '"price": "13300000"');

// 9. Replace Schema.org area (100 → 398 construidos, 370 terreno)
html = html.replace(/"value": 100,/g, '"value": 398,');
html = html.replace(/"value": 112\.5,/g, '"value": 370,');

// 10. Replace OG tags
html = html.replace(/og:title" content="Casa en Venta Infonavit Solidaridad.*?"/,
    'og:title" content="Casa en Venta La Primavera San Juan - $13,300,000"');

html = html.replace(/og:url" content="https:\/\/casasenventa\.info\/culiacan\/infonavit-solidaridad\/"/,
    'og:url" content="https://casasenventa.info/culiacan/casa-venta-primavera-san-juan/"');

// 11. Hero subtitle
html = html.replace(/Se vende Casa en Infonavit Solidaridad.*?cuarto tv una sola planta/s,
    'Casa nueva en La Primavera San Juan. 398 m² construidos, 370 m² terreno, 3 recámaras, 4.5 baños (4 completos + 1 medio baño). A estrenar');

// 12. Badges (2 rec → 3 rec, 2 baños → 4.5 baños, 100 m² → 398 m²)
html = html.replace(/<span class="feature-value">2<\/span>\s*<span class="feature-label">rec<\/span>/g,
    '<span class="feature-value">3</span>\n                    <span class="feature-label">rec</span>');

html = html.replace(/<span class="feature-value">2<\/span>\s*<span class="feature-label">baños<\/span>/g,
    '<span class="feature-value">4.5</span>\n                    <span class="feature-label">baños</span>');

html = html.replace(/<span class="feature-value">112\.5<\/span>\s*<span class="feature-label">m²<\/span>/g,
    '<span class="feature-value">398</span>\n                    <span class="feature-label">m²</span>');

// 13. WhatsApp links (encode correctly)
const whatsappMsg = encodeURIComponent('Me interesa la casa en La Primavera San Juan de $13,300,000');
html = html.replace(/Me%20interesa%20la%20casa%20en%20Infonavit%20Solidaridad%20de%20%24[^"&]+/g, whatsappMsg);

// 14. totalSlidesHero (14 fotos)
html = html.replace(/const totalSlidesHero = 14;/, 'const totalSlidesHero = 14;'); // Ya son 14

// 15. lightboxImages array - 14 photos
const newLightboxImages = `const lightboxImages = [
    { src: 'images/foto-1.jpg', alt: 'Fachada Principal' },
    { src: 'images/foto-2.jpg', alt: 'Vista Exterior' },
    { src: 'images/foto-3.jpg', alt: 'Interior 1' },
    { src: 'images/foto-4.jpg', alt: 'Sala' },
    { src: 'images/foto-5.jpg', alt: 'Comedor' },
    { src: 'images/foto-6.jpg', alt: 'Cocina' },
    { src: 'images/foto-7.jpg', alt: 'Recámara Principal' },
    { src: 'images/foto-8.jpg', alt: 'Recámara 2' },
    { src: 'images/foto-9.jpg', alt: 'Recámara 3' },
    { src: 'images/foto-10.jpg', alt: 'Baño 1' },
    { src: 'images/foto-11.jpg', alt: 'Baño 2' },
    { src: 'images/foto-12.jpg', alt: 'Patio' },
    { src: 'images/foto-13.jpg', alt: 'Jardín' },
    { src: 'images/foto-14.jpg', alt: 'Detalles' }
];`;

html = html.replace(/const lightboxImages = \[[\s\S]*?\];/, newLightboxImages);

// 16. Photo replacements in HTML (fachada1-14 + old fotos → foto-1 to foto-14)
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
    ['20250915_134718.jpg', 'foto-11.jpg'],
    ['20250915_134734.jpg', 'foto-12.jpg'],
    ['20250915_134752.jpg', 'foto-13.jpg'],
    ['20250915_134815.jpg', 'foto-14.jpg']
];

photoMappings.forEach(([old, newP]) => {
    html = html.replace(new RegExp(`images/${old}`, 'g'), `images/${newP}`);
});

// 17. Update location references
html = html.replace(/Infonavit Solidaridad/g, 'La Primavera San Juan');
html = html.replace(/Blvrd Elbert 2609/g, 'La Primavera San Juan');
html = html.replace(/80058/g, '80199');

fs.writeFileSync('culiacan/casa-venta-primavera-san-juan/index.html', html);

console.log('✅ Casa La Primavera San Juan creada con método Casa Solidaridad:');
console.log('   💰 Precio: $13,300,000');
console.log('   🏠 Ubicación: La Primavera San Juan, Culiacán');
console.log('   🛏️  Recámaras: 3');
console.log('   🛁 Baños: 4.5 (4 completos + 1 medio baño)');
console.log('   📐 Construidos: 398 m²');
console.log('   📐 Terreno: 370 m²');
console.log('   📸 Fotos: 14');
console.log('   ✅ totalSlidesHero: 14');
console.log('   ✅ lightboxImages: 14 fotos');
