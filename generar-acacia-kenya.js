#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const PropertyPageGenerator = require('./automation/generador-de-propiedades');

console.log('🏠 GENERANDO CASA ACACIA KENYA - MÉTODO MASTER TEMPLATE (VENTA)\n');

// 1. CONFIGURACIÓN
const randomId = Date.now().toString().slice(-6);
const slug = `casa-venta-acacia-kenya-${randomId}`;

const config = {
    key: slug,
    slug: slug,
    title: 'Casa Acacia Kenya',
    price: '$3,700,000',
    location: 'Acacia Kenya, Culiacán',
    bedrooms: 5,
    bathrooms: 4,
    construction_area: 200,
    land_area: 200,
    photoCount: 22
};

console.log('📋 Datos de la propiedad:');
console.log(`   Título: ${config.title}`);
console.log(`   Precio: ${config.price}`);
console.log(`   Ubicación: ${config.location}`);
console.log(`   ${config.bedrooms} recámaras, ${config.bathrooms} baños`);
console.log(`   ${config.construction_area}m² construcción`);
console.log(`   Slug: ${slug}\n`);

// 2. COPIAR FOTOS DESDE PROYECTOS
const proyectosDir = '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/casa acacia kenya';
const imagesDir = `culiacan/${slug}/images`;

console.log('📸 Procesando fotos...');

// Crear directorio
if (!fs.existsSync(imagesDir)) {
    execSync(`mkdir -p "${imagesDir}"`);
    console.log(`   ✅ Creado: ${imagesDir}`);
}

// Copiar fotos (solo JPG, no PNG)
const fotos = fs.readdirSync(proyectosDir)
    .filter(f => /\.(jpg|jpeg)$/i.test(f))
    .sort();

console.log(`   📁 ${fotos.length} fotos encontradas`);

fotos.forEach((foto, i) => {
    const src = path.join(proyectosDir, foto);
    const dest = path.join(imagesDir, `foto-${i + 1}.jpg`);
    fs.copyFileSync(src, dest);
});

console.log(`   ✅ ${fotos.length} fotos copiadas\n`);

// 3. OPTIMIZAR FOTOS
console.log('🔧 Optimizando fotos...');
try {
    execSync(`cd "${imagesDir}" && for f in *.jpg; do sips -s format jpeg -s formatOptions 85 -Z 1200 "$f" --out "$f" 2>/dev/null; done`);
    console.log('   ✅ Fotos optimizadas (JPEG 85%, max 1200px)\n');
} catch(e) {
    console.log('   ⚠️  Error optimizando, continuando...\n');
}

// Actualizar photoCount real
config.photoCount = fotos.length;

// 4. GENERAR HTML CON MÉTODO MASTER TEMPLATE
console.log('📄 Generando HTML con generateFromMasterTemplateWithValidation()...');
console.log('   🎯 Método Master Template para VENTA\n');

const generator = new PropertyPageGenerator(false); // false = VENTA

let htmlContent;
try {
    htmlContent = generator.generateFromMasterTemplateWithValidation(config);
    console.log('✅ HTML generado y validado (100% correcto)\n');
} catch (error) {
    console.error('❌ Error en validación:', error.message);
    process.exit(1);
}

// 5. GUARDAR ARCHIVO
const outputFile = `culiacan/${slug}/index.html`;
fs.writeFileSync(outputFile, htmlContent, 'utf-8');
console.log(`💾 Archivo guardado: ${outputFile}\n`);

// 6. COPIAR CSS
execSync(`cp culiacan/infonavit-solidaridad/styles.css culiacan/${slug}/styles.css`);
console.log(`✅ styles.css copiado\n`);

// 7. VALIDACIONES
console.log('🔍 VALIDACIONES MASTER TEMPLATE:\n');

const placeholders = htmlContent.match(/\{\{[^}]+\}\}/g);
console.log(`   ${!placeholders ? '✅' : '❌'} 1. Sin placeholders sin reemplazar`);

const fotoCount = (htmlContent.match(/images\/foto-\d+\.jpg/g) || []).length;
console.log(`   ${fotoCount > 0 ? '✅' : '❌'} 2. Fotos: ${fotoCount} referencias`);

const precioCount = (htmlContent.match(/3,700,000|3700000/g) || []).length;
console.log(`   ${precioCount >= 3 ? '✅' : '❌'} 3. Precio aparece: ${precioCount} veces`);

const hasFlechas = htmlContent.includes('carousel-arrow');
console.log(`   ${hasFlechas ? '✅' : '❌'} 4. Carrusel con flechas`);

const hasLightbox = htmlContent.includes('id="lightbox"');
console.log(`   ${hasLightbox ? '✅' : '❌'} 5. Lightbox incluido`);

const hasStickyBar = htmlContent.includes('sticky-price-bar');
console.log(`   ${hasStickyBar ? '✅' : '❌'} 6. Sticky Price Bar`);

const hasCalculadora = htmlContent.includes('calculadora') || htmlContent.includes('calculator');
console.log(`   ${hasCalculadora ? '✅' : '❌'} 7. Calculadora incluida\n`);

// 8. TAMAÑO
const tamaño = Math.round(htmlContent.length / 1024);
console.log(`📊 Tamaño: ${tamaño}KB\n`);

// 9. ABRIR EN NAVEGADOR
execSync(`open "${outputFile}"`);
console.log(`✅ Página abierta en navegador\n`);

console.log('📝 Verifica:');
console.log('   1. Carrusel funcionando con flechas');
console.log('   2. Lightbox al hacer click en fotos');
console.log('   3. Sticky price bar al hacer scroll');
console.log('   4. Calculadora de hipoteca con precio correcto');
console.log('   5. Todas las fotos son de Acacia Kenya\n');

console.log(`✅ CASA ACACIA KENYA GENERADA CON MASTER TEMPLATE`);
console.log(`📁 Archivo: ${outputFile}\n`);
