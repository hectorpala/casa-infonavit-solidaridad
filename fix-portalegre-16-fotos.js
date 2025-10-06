#!/usr/bin/env node
/**
 * Fix Casa Portalegre: Agregar las 16 fotos al carrusel
 */

const fs = require('fs');

console.log('🔧 Arreglando Casa Portalegre con 16 fotos...\n');

// Leer HTML actual
let html = fs.readFileSync('culiacan/casa-venta-portalegre-045360/index.html', 'utf8');

// 1. Agregar slides 6-16 después del slide 5
const slidesHTML = `
                <div class="carousel-slide" data-slide="5">
                    <img src="images/foto-6.jpg" alt="casa-venta-portalegre-045360 - Vista 6" loading="lazy" decoding="async" onclick="openLightbox(5)">
                </div>
                <div class="carousel-slide" data-slide="6">
                    <img src="images/foto-7.jpg" alt="casa-venta-portalegre-045360 - Vista 7" loading="lazy" decoding="async" onclick="openLightbox(6)">
                </div>
                <div class="carousel-slide" data-slide="7">
                    <img src="images/foto-8.jpg" alt="casa-venta-portalegre-045360 - Vista 8" loading="lazy" decoding="async" onclick="openLightbox(7)">
                </div>
                <div class="carousel-slide" data-slide="8">
                    <img src="images/foto-9.jpg" alt="casa-venta-portalegre-045360 - Vista 9" loading="lazy" decoding="async" onclick="openLightbox(8)">
                </div>
                <div class="carousel-slide" data-slide="9">
                    <img src="images/foto-10.jpg" alt="casa-venta-portalegre-045360 - Vista 10" loading="lazy" decoding="async" onclick="openLightbox(9)">
                </div>
                <div class="carousel-slide" data-slide="10">
                    <img src="images/foto-11.jpg" alt="casa-venta-portalegre-045360 - Vista 11" loading="lazy" decoding="async" onclick="openLightbox(10)">
                </div>
                <div class="carousel-slide" data-slide="11">
                    <img src="images/foto-12.jpg" alt="casa-venta-portalegre-045360 - Vista 12" loading="lazy" decoding="async" onclick="openLightbox(11)">
                </div>
                <div class="carousel-slide" data-slide="12">
                    <img src="images/foto-13.jpg" alt="casa-venta-portalegre-045360 - Vista 13" loading="lazy" decoding="async" onclick="openLightbox(12)">
                </div>
                <div class="carousel-slide" data-slide="13">
                    <img src="images/foto-14.jpg" alt="casa-venta-portalegre-045360 - Vista 14" loading="lazy" decoding="async" onclick="openLightbox(13)">
                </div>
                <div class="carousel-slide" data-slide="14">
                    <img src="images/foto-15.jpg" alt="casa-venta-portalegre-045360 - Vista 15" loading="lazy" decoding="async" onclick="openLightbox(14)">
                </div>
                <div class="carousel-slide" data-slide="15">
                    <img src="images/foto-16.jpg" alt="casa-venta-portalegre-045360 - Vista 16" loading="lazy" decoding="async" onclick="openLightbox(15)">
                </div>
`;

html = html.replace(
    `                </div>

                    <!-- Navigation arrows -->`,
    slidesHTML + `
                    <!-- Navigation arrows -->`
);

// 2. Agregar dots 6-16
const dotsHTML = `
                <button class="carousel-dot" onclick="goToSlideHero(5)" aria-label="Foto 6"></button>
                <button class="carousel-dot" onclick="goToSlideHero(6)" aria-label="Foto 7"></button>
                <button class="carousel-dot" onclick="goToSlideHero(7)" aria-label="Foto 8"></button>
                <button class="carousel-dot" onclick="goToSlideHero(8)" aria-label="Foto 9"></button>
                <button class="carousel-dot" onclick="goToSlideHero(9)" aria-label="Foto 10"></button>
                <button class="carousel-dot" onclick="goToSlideHero(10)" aria-label="Foto 11"></button>
                <button class="carousel-dot" onclick="goToSlideHero(11)" aria-label="Foto 12"></button>
                <button class="carousel-dot" onclick="goToSlideHero(12)" aria-label="Foto 13"></button>
                <button class="carousel-dot" onclick="goToSlideHero(13)" aria-label="Foto 14"></button>
                <button class="carousel-dot" onclick="goToSlideHero(14)" aria-label="Foto 15"></button>
                <button class="carousel-dot" onclick="goToSlideHero(15)" aria-label="Foto 16"></button>
`;

html = html.replace(
    `                <button class="carousel-dot" onclick="goToSlideHero(4)" aria-label="Foto 5"></button>
                </div>`,
    `                <button class="carousel-dot" onclick="goToSlideHero(4)" aria-label="Foto 5"></button>` + dotsHTML + `
                </div>`
);

// 3. Actualizar JavaScript: totalSlidesHero de 5 a 16
html = html.replace(/const totalSlidesHero = 5;/g, 'const totalSlidesHero = 16;');

// 4. Actualizar lightbox array con 16 fotos
const lightboxArray = `const lightboxImages = [
        'images/foto-1.jpg',
        'images/foto-2.jpg',
        'images/foto-3.jpg',
        'images/foto-4.jpg',
        'images/foto-5.jpg',
        'images/foto-6.jpg',
        'images/foto-7.jpg',
        'images/foto-8.jpg',
        'images/foto-9.jpg',
        'images/foto-10.jpg',
        'images/foto-11.jpg',
        'images/foto-12.jpg',
        'images/foto-13.jpg',
        'images/foto-14.jpg',
        'images/foto-15.jpg',
        'images/foto-16.jpg'
    ];`;

html = html.replace(/const lightboxImages = \[[^\]]+\];/s, lightboxArray);

// 5. Actualizar Schema.org images array
const schemaImages = `      "image": [
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-1.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-2.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-3.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-4.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-5.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-6.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-7.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-8.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-9.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-10.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-11.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-12.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-13.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-14.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-15.jpg",
        "https://casasenventa.info/culiacan/casa-venta-portalegre-045360/images/foto-16.jpg"
      ],`;

html = html.replace(/"image": \[[^\]]+\],/s, schemaImages);

// Guardar HTML actualizado
fs.writeFileSync('culiacan/casa-venta-portalegre-045360/index.html', html);

console.log('✅ HTML actualizado con 16 fotos');
console.log('✅ Carrusel: 16 slides agregados');
console.log('✅ Dots: 16 indicadores');
console.log('✅ JavaScript: totalSlidesHero = 16');
console.log('✅ Lightbox: 16 imágenes');
console.log('✅ Schema.org: 16 imágenes\n');

console.log('🌐 Abre: culiacan/casa-venta-portalegre-045360/index.html');
