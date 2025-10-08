const fs = require('fs');

const indexPath = 'culiacan/index.html';
let html = fs.readFileSync(indexPath, 'utf8');

// Propiedades a actualizar (las 3 más recientes sin flechas)
const slugsToFix = [
    'casa-en-adolfo-lopez-mateos',
    'casa-en-privada-monaco-paseos-del-rey',
    'venta-de-casa-3-recamaras-en-portalegre-en-culiacan'
];

slugsToFix.forEach(slug => {
    console.log(`\n🔧 Actualizando: ${slug}`);

    // Buscar el carrusel de esta propiedad
    const carouselRegex = new RegExp(
        `(<div class="carousel-container" data-current="0">\\s*<img src="${slug}/images/foto-1.jpg"[^>]+class="[^"]*carousel-image active">)\\s*(<button class="carousel-arrow)`,
        'g'
    );

    const carouselWithImages = `$1
                <img src="${slug}/images/foto-2.jpg"
                     alt="Propiedad"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image hidden">
                <img src="${slug}/images/foto-3.jpg"
                     alt="Propiedad"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image hidden">
                <img src="${slug}/images/foto-4.jpg"
                     alt="Propiedad"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image hidden">
                <img src="${slug}/images/foto-5.jpg"
                     alt="Propiedad"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image hidden">
                $2`;

    const before = html.length;
    html = html.replace(carouselRegex, carouselWithImages);
    const after = html.length;

    if (after > before) {
        console.log(`   ✅ Carrusel actualizado (${after - before} caracteres agregados)`);
    } else {
        console.log(`   ⚠️  No se encontró o ya está actualizado`);
    }
});

fs.writeFileSync(indexPath, html, 'utf8');
console.log(`\n✅ Archivo guardado: ${indexPath}\n`);
