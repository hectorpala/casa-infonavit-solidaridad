#!/usr/bin/env node

/**
 * Script para regenerar Casa Infonavit Solidaridad usando el template de La Primavera
 * (el mismo que usa inmuebles24-scraper-y-publicar.js)
 */

const fs = require('fs');
const path = require('path');

// Datos de la propiedad
const data = {
    title: 'Casa Remodelada en Infonavit Solidaridad',
    price: '$1,650,000',
    location: 'Infonavit Solidaridad, Culiacán',
    bedrooms: 2,
    bathrooms: 2,
    construction_area: 91.6,
    land_area: 112.5,
    parking: 2,
    description: 'Casa totalmente remodelada en Infonavit Solidaridad. 2 recámaras, 2 baños completos, cochera techada para 2 autos. Excelente ubicación.'
};

const slug = 'infonavit-solidaridad';
const photoCount = 14;

// Leer template de La Primavera
const templatePath = 'culiacan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/index.html';
console.log('📄 Leyendo template de La Primavera...');
let html = fs.readFileSync(templatePath, 'utf8');

// Extraer precio numérico
const priceNumeric = data.price.replace(/[^0-9]/g, '');
const neighborhood = data.location.split(',')[0].trim();

console.log('🔄 Aplicando reemplazos...\n');

// METADATA Y HEAD
html = html.replace(/<title>.*?<\/title>/s,
    `<title>Casa en Venta ${data.price} - Blvrd Elbert 2609 2609, Culiacán | Hector es Bienes Raíces</title>`);

html = html.replace(/<meta name="description" content=".*?">/,
    `<meta name="description" content="${data.description}">`);

html = html.replace(/<meta name="keywords" content=".*?">/,
    `<meta name="keywords" content="casa venta Culiacán, Infonavit Solidaridad, casa remodelada, ${data.bedrooms} recámaras, cochera techada, Blvrd Elbert 2609">`);

html = html.replace(/<link rel="canonical" href=".*?">/,
    `<link rel="canonical" href="https://casasenventa.info/culiacan/${slug}/">`);

// Open Graph
html = html.replace(/<meta property="og:title" content=".*?">/,
    `<meta property="og:title" content="Casa en Venta ${data.price} - ${neighborhood}">`);

html = html.replace(/<meta property="og:description" content=".*?">/s,
    `<meta property="og:description" content="${data.bedrooms} recámaras • ${data.bathrooms} baños • ${data.construction_area}m² construcción • ${data.land_area}m² terreno">`);

html = html.replace(/<meta property="og:url" content=".*?">/,
    `<meta property="og:url" content="https://casasenventa.info/culiacan/${slug}/">`);

html = html.replace(/<meta property="og:image" content=".*?">/,
    `<meta property="og:image" content="https://casasenventa.info/culiacan/${slug}/images/foto-1.jpg">`);

// Schema.org - reemplazar bloque completo
const schemaStart = html.indexOf('<script type="application/ld+json">');
const schemaEnd = html.indexOf('</script>', schemaStart) + 9;
const newSchema = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SingleFamilyResidence",
  "name": "${data.title}",
  "description": "${data.description}",
  "url": "https://casasenventa.info/culiacan/${slug}/",
  "image": [
    ${Array.from({length: Math.min(photoCount, 10)}, (_, i) =>
        `"https://casasenventa.info/culiacan/${slug}/images/foto-${i+1}.jpg"`).join(',\n    ')}
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Blvrd Elbert 2609 2609",
    "addressLocality": "${data.location}",
    "addressRegion": "Sinaloa",
    "postalCode": "80134",
    "addressCountry": "MX"
  },
  "floorSize": {
    "@type": "QuantitativeValue",
    "value": ${data.construction_area},
    "unitCode": "MTK"
  },
  "lotSize": {
    "@type": "QuantitativeValue",
    "value": ${data.land_area},
    "unitCode": "MTK"
  },
  "numberOfBedrooms": ${data.bedrooms},
  "numberOfBathroomsTotal": ${data.bathrooms},
  "numberOfFullBathrooms": ${data.bathrooms},
  "offers": {
    "@type": "Offer",
    "price": "${priceNumeric}",
    "priceCurrency": "MXN"
  },
  "amenityFeature": [
      {
                "@type": "LocationFeatureSpecification",
                "name": "Cochera techada",
                "value": true
      },
      {
                "@type": "LocationFeatureSpecification",
                "name": "Casa remodelada",
                "value": true
      }
]
}
</script>`;
html = html.substring(0, schemaStart) + newSchema + html.substring(schemaEnd);

// HERO SECTION
html = html.replace(/<h1 class="hero-title">.*?<\/h1>/s,
    `<h1 class="hero-title">${data.title}</h1>`);

html = html.replace(/<p class="hero-subtitle">.*?<\/p>/,
    `<p class="hero-subtitle">${data.description}</p>`);

// CAROUSEL SLIDES
const carouselStart = html.indexOf('<div class="carousel-slide active"');
const carouselEnd = html.lastIndexOf('</div>', html.indexOf('<!-- Navigation arrows -->')) + 6;

let carouselSlides = '';
for (let i = 0; i < photoCount; i++) {
    const activeClass = i === 0 ? ' active' : '';
    const loading = i === 0 ? 'eager' : 'lazy';
    carouselSlides += `
                <div class="carousel-slide${activeClass}" data-slide="${i}">
                    <img src="images/foto-${i + 1}.jpg"
                         alt="${slug} - Vista ${i + 1}"
                         loading="${loading}"
                         decoding="async"
                         onclick="openLightbox(${i})">
                </div>`;
}
html = html.substring(0, carouselStart) + carouselSlides.trim() + '\n                ' + html.substring(carouselEnd);

// CAROUSEL DOTS
const dotsStart = html.indexOf('<div class="carousel-dots">');
const dotsEnd = html.indexOf('</div>', dotsStart) + 6;
let carouselDots = '<div class="carousel-dots">\n';
for (let i = 0; i < photoCount; i++) {
    const activeClass = i === 0 ? ' active' : '';
    carouselDots += `                    <span class="carousel-dot${activeClass}" onclick="goToSlide(${i})"></span>\n`;
}
carouselDots += '                </div>';
html = html.substring(0, dotsStart) + carouselDots + html.substring(dotsEnd);

// LIGHTBOX IMAGES ARRAY
const lightboxArrayMatch = html.match(/const lightboxImages = \[[\s\S]*?\];/);
if (lightboxArrayMatch) {
    const newLightboxArray = `const lightboxImages = [
        ${Array.from({length: photoCount}, (_, i) => `'images/foto-${i+1}.jpg'`).join(',\n        ')}
    ];`;
    html = html.replace(lightboxArrayMatch[0], newLightboxArray);
}

// TOTAL SLIDES
html = html.replace(/const totalSlides = \d+;/, `const totalSlides = ${photoCount};`);

// FEATURES SECTION
html = html.replace(/🛏️\s*\d+\s*recámaras?/g, `🛏️ ${data.bedrooms} recámaras`);
html = html.replace(/🛁\s*\d+(\.\d+)?\s*baños?/g, `🛁 ${data.bathrooms} baños`);
html = html.replace(/📐\s*\d+(\.\d+)?\s*m²\s*construcción/g, `📐 ${data.construction_area}m² construcción`);
html = html.replace(/🏞️\s*\d+(\.\d+)?\s*m²\s*terreno/g, `🏞️ ${data.land_area}m² terreno`);

// FEATURES COMPACT SECTION
html = html.replace(/(<i class="fas fa-bed"><\/i>\s*<span class="feature-value">)\d+(<\/span>)/g,
    `$1${data.bedrooms}$2`);

html = html.replace(/(<i class="fas fa-bath"><\/i>\s*<span class="feature-value">)\d+(\.\d+)?(<\/span>)/g,
    `$1${data.bathrooms}$3`);

html = html.replace(/(<i class="fas fa-car"><\/i>\s*<span class="feature-value">)\d+(<\/span>)/g,
    `$1${data.parking}$2`);

html = html.replace(/(<i class="fas fa-ruler-combined"><\/i>\s*<span class="feature-value">)\d+(\.\d+)?(<\/span>)/g,
    `$1${data.construction_area}$3`);

html = html.replace(/(<i class="fas fa-vector-square"><\/i>\s*<span class="feature-value">)\d+(\.\d+)?(<\/span>)/g,
    `$1${data.land_area}$3`);

// INFO BADGES
html = html.replace(/(<i class="fas fa-ruler-combined"><\/i>\s*<span>)\d+(\.\d+)?\s*m²\s*construcción(<\/span>)/g,
    `$1${data.construction_area}m² construcción$3`);

html = html.replace(/(<i class="fas fa-border-all"><\/i>\s*<span>)\d+(\.\d+)?\s*m²\s*terreno(<\/span>)/g,
    `$1${data.land_area}m² terreno$3`);

// DETAILS SECTION
html = html.replace(/<div class="detail-value price">\$[\d,]+<\/div>/g,
    `<div class="detail-value price">${data.price}</div>`);

html = html.replace(/<div class="detail-value">.*?<\/div>.*?<!-- ubicación -->/s,
    `<div class="detail-value">${data.location}</div> <!-- ubicación -->`);

// PRICE BADGE
html = html.replace(/<span class="price-amount">\$[\d,]+<\/span>/g,
    `<span class="price-amount">${data.price}</span>`);

// PRICE CARD
html = html.replace(/<span class="price-value">\$[\d,]+<\/span>/g,
    `<span class="price-value">${data.price}</span>`);

// STICKY PRICE BAR
html = html.replace(/<span class="sticky-price-amount">\$[\d,]+<\/span>/g,
    `<span class="sticky-price-amount">${data.price}</span>`);

html = html.replace(/<span class="sticky-price-label">Casa [^<]+<\/span>/g,
    `<span class="sticky-price-label">Casa Infonavit Solidaridad</span>`);

// CALCULATOR
html = html.replace(/id="precio-zil"\s+value="[^"]+"/g, `id="precio-zil" value="${data.price}"`);
html = html.replace(/value="[^"]+"\s+id="precio-zil"/g, `value="${data.price}" id="precio-zil"`);
html = html.replace(/const precio = parseFloat\(precioInput\.replace\(\/\[^\d\]\/g, ''\)\) \|\| \d+;/g,
    `const precio = parseFloat(precioInput.replace(/[^\\d]/g, '')) || ${priceNumeric};`);

// LOCATION SUBTITLE
html = html.replace(/<p class="location-subtitle">.*?<\/p>/g,
    `<p class="location-subtitle">${data.title}, ${data.location}</p>`);

// FOOTER
html = html.replace(/<p><i class="fas fa-map-marker-alt"><\/i>\s*[^<]+<\/p>/g,
    `<p><i class="fas fa-map-marker-alt"></i> Blvrd Elbert 2609 2609, ${data.location}</p>`);

// SHARE TEXT
html = html.replace(/const text = encodeURIComponent\('¡Mira esta increíble casa en venta en [^']+'\);/g,
    `const text = encodeURIComponent('¡Mira esta increíble casa en venta en ${neighborhood}! ${data.price}');`);

// WHATSAPP LINKS
const whatsappMsg = encodeURIComponent(
    `Hola! Me interesa la propiedad:\n${data.title}\n${data.price}\n${data.location}\nhttps://casasenventa.info/culiacan/${slug}/`
);
html = html.replace(/https:\/\/wa\.me\/[^"?]+\?text=[^"]+/g,
    `https://wa.me/528111652545?text=${whatsappMsg}`);

// MAPA MARKER CONFIG
html = html.replace(/const MARKER_CONFIG = \{[^}]+\};/s, `const MARKER_CONFIG = {
            location: "${data.location}",
            priceShort: "$1.65M",
            title: "${data.title}",
            precision: "generic",
            latOffset: 0,
            lngOffset: 0
        };`);

// Guardar archivo
const outputPath = `culiacan/${slug}/index.html`;
fs.writeFileSync(outputPath, html, 'utf8');

console.log(`✅ Archivo generado: ${outputPath}`);
console.log(`\n📋 Resumen:`);
console.log(`   - Precio: ${data.price}`);
console.log(`   - Recámaras: ${data.bedrooms}`);
console.log(`   - Baños: ${data.bathrooms}`);
console.log(`   - Construcción: ${data.construction_area}m²`);
console.log(`   - Terreno: ${data.land_area}m²`);
console.log(`   - Fotos: ${photoCount}`);
console.log(`\n🌐 URL: https://casasenventa.info/culiacan/${slug}/`);
