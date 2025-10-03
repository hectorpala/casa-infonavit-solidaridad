const fs = require('fs');

console.log('🔧 PARTE 2: Convirtiendo BODY del master-template...\n');

let html = fs.readFileSync('automation/templates/master-template.html', 'utf8');

// ============================================
// PASO 2: HERO SECTION
// ============================================

// Hero subtitle (descripción corta)
html = html.replace(
    /<p class="hero-subtitle">Casa nueva en San Javier La Primavera\. 362 m² construcción, 3 recámaras, 3 baños completos, cochera techada para 2 autos<\/p>/,
    '<p class="hero-subtitle">{{HERO_SUBTITLE}}</p>'
);

// Carrusel slides (se reemplazará dinámicamente)
const slidesSection = html.match(/<div class="carousel-wrapper">([\s\S]*?)<\/div>\s*<!-- Price Badge -->/);
if (slidesSection) {
    html = html.replace(
        slidesSection[0],
        `<div class="carousel-wrapper">
{{CAROUSEL_SLIDES}}
                </div>

                <!-- Price Badge -->`
    );
}

// Price badge amount
html = html.replace(
    /<span class="price-amount">\$13,859,000<\/span>/g,
    '<span class="price-amount">{{PRECIO}}</span>'
);

// Carousel dots (se reemplazará dinámicamente)
const dotsSection = html.match(/<div class="carousel-dots">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/);
if (dotsSection) {
    html = html.replace(
        /<div class="carousel-dots">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/,
        `<div class="carousel-dots">
{{CAROUSEL_DOTS}}
                </div>
            </div>
        </div>
    </section>`
    );
}

console.log('✅ Hero section convertido\n');

// ============================================
// PASO 3: FEATURES COMPACT
// ============================================

// Recámaras
html = html.replace(
    /<span class="feature-value">3<\/span>\s*<span class="feature-label">rec<\/span>/,
    '<span class="feature-value">{{BEDROOMS}}</span>\n                    <span class="feature-label">rec</span>'
);

// Baños
html = html.replace(
    /<span class="feature-value">3<\/span>\s*<span class="feature-label">baños<\/span>/,
    '<span class="feature-value">{{BATHROOMS}}</span>\n                    <span class="feature-label">baños</span>'
);

// Autos (parking)
html = html.replace(
    /<span class="feature-value">2<\/span>\s*<span class="feature-label">autos<\/span>/,
    '<span class="feature-value">{{PARKING_SPACES}}</span>\n                    <span class="feature-label">autos</span>'
);

// M² (area)
html = html.replace(
    /<span class="feature-value">362<\/span>\s*<span class="feature-label">m²<\/span>/,
    '<span class="feature-value">{{CONSTRUCTION_AREA}}</span>\n                    <span class="feature-label">m²</span>'
);

console.log('✅ Features compact convertido\n');

// ============================================
// PASO 4: DETAILS SECTION - Info Badges
// ============================================

// Badge construcción
html = html.replace(
    /<span>91\.6 m² construcción<\/span>/,
    '<span>{{CONSTRUCTION_AREA}} m² construcción</span>'
);

// Badge terreno
html = html.replace(
    /<span>112\.5 m² terreno<\/span>/,
    '<span>{{LAND_AREA}} m² terreno</span>'
);

// Badge plantas
html = html.replace(
    /<span>1 planta<\/span>/,
    '<span>{{FLOORS}} planta(s)</span>'
);

// Price Card - precio
html = html.replace(
    /<span class="price-value">\$13,859,000<\/span>/g,
    '<span class="price-value">{{PRECIO}}</span>'
);

console.log('✅ Details section convertido\n');

// ============================================
// PASO 5: CALCULADORA ZILLOW
// ============================================

// Precio inicial calculadora
html = html.replace(
    /<input type="text" id="precio-zil" value="\$13,859,000"/,
    '<input type="text" id="precio-zil" value="{{PRECIO}}"'
);

// JavaScript calcularZillow - precio default
html = html.replace(
    /const precio = parseFloat\(precioInput\.replace\(\/\[\\^\\d\]\/g, ''\)\) \|\| 1750000;/,
    'const precio = parseFloat(precioInput.replace(/[^\\d]/g, \'\')) || {{PRICE_NUMERIC}};'
);

console.log('✅ Calculadora Zillow convertida\n');

// ============================================
// PASO 6: STICKY PRICE BAR
// ============================================

// Sticky label
html = html.replace(
    /<span class="sticky-price-label">Casa San Javier La Primavera<\/span>/,
    '<span class="sticky-price-label">{{TITLE_SHORT}}</span>'
);

// Sticky amount
html = html.replace(
    /<span class="sticky-price-amount">\$13,859,000<\/span>/g,
    '<span class="sticky-price-amount">{{PRECIO}}</span>'
);

// Sticky WhatsApp link
html = html.replace(
    /https:\/\/wa\.me\/528111652545\?text=Me%20interesa%20la%20casa%20en%20San%20Javier%20La%20Primavera%20de%20%243%2C500%2C000/g,
    'https://wa.me/528111652545?text={{WHATSAPP_MESSAGE_ENCODED}}'
);

console.log('✅ Sticky price bar convertido\n');

// ============================================
// PASO 7: CONTACT SECTION
// ============================================

// WhatsApp contact button
html = html.replace(
    /https:\/\/wa\.me\/528111652545\?text=Me%20interesan%20informes%20de%20la%20casa%20nueva%20en%20San%20Javier%20La%20Primavera/g,
    'https://wa.me/528111652545?text={{WHATSAPP_MESSAGE_ENCODED}}'
);

// Contact address
html = html.replace(
    /<p><i class="fas fa-map-marker-alt"><\/i> Barrio San Javier, La Primavera, 80199 Culiacán, Sin\.<\/p>/,
    '<p><i class="fas fa-map-marker-alt"></i> {{FULL_ADDRESS}}</p>'
);

console.log('✅ Contact section convertido\n');

// ============================================
// PASO 8: JAVASCRIPT - Carousel Hero
// ============================================

// totalSlidesHero
html = html.replace(
    /const totalSlidesHero = 10;/g,
    'const totalSlidesHero = {{PHOTO_COUNT}};'
);

// Lightbox images array (se reemplazará dinámicamente)
html = html.replace(
    /const lightboxImages = \[[\s\S]*?{ src: 'images\/foto-10\.jpg', alt: 'Detalles' }\s*\];/,
    '{{LIGHTBOX_IMAGES_ARRAY}}'
);

console.log('✅ JavaScript carrusel convertido\n');

// ============================================
// PASO 9: SHARE FUNCTIONS - URLs y mensajes
// ============================================

// getShareUrl() - canonical URL
html = html.replace(
    /return 'https:\/\/casasenventa\.info\/culiacan\/infonavit-solidaridad\/';/,
    "return 'https://casasenventa.info/culiacan/{{SLUG}}/';"
);

// shareWhatsApp() - mensaje
html = html.replace(
    /const text = encodeURIComponent\('¡Mira esta increíble casa en venta en San Javier La Primavera! \$13,859,000'\);/,
    "const text = encodeURIComponent('{{SHARE_WHATSAPP_TEXT}}');"
);

// shareEmail() - contenido
html = html.replace(
    /const subject = encodeURIComponent\('Casa en venta - San Javier La Primavera'\);/,
    "const subject = encodeURIComponent('{{SHARE_EMAIL_SUBJECT}}');"
);

html = html.replace(
    /const body = encodeURIComponent\(`Hola,\\n\\nQuiero compartir contigo esta casa en venta:\\n\\nCasa en San Javier La Primavera\\nPrecio: \$13,859,000\\n3 recámaras, 3 baños\\n362 m² construcción\\n\\nVer más detalles: \${shareUrl}\\n\\nSaludos!`\);/,
    "const body = encodeURIComponent(`{{SHARE_EMAIL_BODY}}`);"
);

console.log('✅ Share functions convertidas\n');

// ============================================
// PASO 10: WHATSAPP FLOATING BUTTON
// ============================================

// Floating button link (hay una URL antigua de Infonavit Solidaridad)
html = html.replace(
    /https:\/\/wa\.me\/528111652545\?text=Hola%2C%20me%20interesa%20la%20casa%20remodelada%20en%20Infonavit%20Solidaridad%20por%20%241%2C750%2C000\.%20%C2%BFPodr%C3%ADa%20darme%20m%C3%A1s%20informaci%C3%B3n%3F/g,
    'https://wa.me/528111652545?text={{WHATSAPP_MESSAGE_ENCODED}}'
);

console.log('✅ WhatsApp floating button convertido\n');

// ============================================
// PASO 11: LIGHTBOX TOTAL SLIDES
// ============================================

// Lightbox total counter
html = html.replace(
    /<span id="lightbox-total">14<\/span>/,
    '<span id="lightbox-total">{{PHOTO_COUNT}}</span>'
);

console.log('✅ Lightbox convertido\n');

// Guardar archivo completo
fs.writeFileSync('automation/templates/master-template.html', html);

console.log('\n🎉 CONVERSIÓN COMPLETADA - Master template listo con todos los placeholders\n');

console.log('📋 PLACEHOLDERS CREADOS:');
console.log('   META/SEO: {{PRECIO}}, {{LOCATION_FULL}}, {{SLUG}}, {{META_DESCRIPTION}}, {{META_KEYWORDS}}');
console.log('   SCHEMA: {{SCHEMA_NAME}}, {{BEDROOMS}}, {{BATHROOMS}}, {{CONSTRUCTION_AREA}}, {{LAND_AREA}}');
console.log('   HERO: {{HERO_SUBTITLE}}, {{CAROUSEL_SLIDES}}, {{CAROUSEL_DOTS}}');
console.log('   FEATURES: {{BEDROOMS}}, {{BATHROOMS}}, {{PARKING_SPACES}}, {{CONSTRUCTION_AREA}}');
console.log('   DETAILS: {{FLOORS}}, {{LAND_AREA}}');
console.log('   CONTACT: {{FULL_ADDRESS}}, {{WHATSAPP_MESSAGE_ENCODED}}');
console.log('   JAVASCRIPT: {{PHOTO_COUNT}}, {{LIGHTBOX_IMAGES_ARRAY}}');
console.log('   SHARE: {{SHARE_WHATSAPP_TEXT}}, {{SHARE_EMAIL_SUBJECT}}, {{SHARE_EMAIL_BODY}}');
console.log('\n✅ Archivo guardado: automation/templates/master-template.html\n');
