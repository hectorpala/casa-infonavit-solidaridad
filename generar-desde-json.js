#!/usr/bin/env node
/**
 * GENERADOR PASO 2: GENERA HTML DESDE JSON CON MASTER TEMPLATE
 *
 * Uso:
 *   node generar-desde-json.js scraped-data/[slug]-data.json
 *
 * Usa el método correcto automáticamente:
 *   - VENTA: generateFromMasterTemplateWithValidation()
 *   - RENTA: generateFromSolidaridadTemplate()
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const PropertyPageGenerator = require('./automation/generador-de-propiedades');

const jsonFile = process.argv[2];

if (!jsonFile) {
    console.error('❌ Proporciona el archivo JSON');
    console.log('\nUso: node generar-desde-json.js scraped-data/[slug]-data.json\n');
    process.exit(1);
}

if (!fs.existsSync(jsonFile)) {
    console.error(`❌ Archivo no encontrado: ${jsonFile}`);
    process.exit(1);
}

console.log('🚀 GENERADOR - MASTER TEMPLATE (PASO 2/2)\n');

// Leer JSON
const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

console.log('📋 Datos cargados:');
console.log(`   Título: ${data.title}`);
console.log(`   Tipo: ${data.tipo}`);
console.log(`   Precio: ${data.price}`);
console.log(`   Slug: ${data.slug}`);
console.log(`   Fotos: ${data.photoCount}\n`);

// Detectar tipo
const esRenta = data.tipo === 'RENTA';

// Preparar config para PropertyPageGenerator
const config = {
    key: data.slug,
    slug: data.slug,
    title: data.title,
    price: data.price,
    location: data.location || 'Culiacán',
    bedrooms: parseInt(data.bedrooms) || 2,
    bathrooms: parseFloat(data.bathrooms) || 2,
    construction_area: parseInt(data.area) || 100,
    land_area: parseInt(data.area) || 100,
    photoCount: data.photoCount || data.photos.length,
    photos: data.photos
};

console.log('📄 Generando HTML con MÉTODO MASTER TEMPLATE...\n');

if (esRenta) {
    console.log('   🏠 RENTA → generateFromSolidaridadTemplate()');
    console.log('   ✅ Estructura: Hero + Contact (2 secciones)');
    console.log('   ✅ 100% idéntica a Casa Solidaridad\n');
} else {
    console.log('   🏢 VENTA → generateFromMasterTemplateWithValidation()');
    console.log('   ✅ Estructura: Hero + Contact + Modern Features');
    console.log('   ✅ Validación automática (7 checks)\n');
}

const generator = new PropertyPageGenerator(esRenta);
let htmlContent;

try {
    if (esRenta) {
        htmlContent = generator.generateFromSolidaridadTemplate(config);
        console.log('✅ HTML RENTA generado (estructura idéntica a Casa Solidaridad)\n');
    } else {
        htmlContent = generator.generateFromMasterTemplateWithValidation(config);
        console.log('✅ HTML VENTA generado y validado (100% correcto)\n');
    }
} catch (error) {
    console.error('❌ Error generando HTML:', error.message);
    process.exit(1);
}

// Guardar archivo
let outputFile;
if (esRenta) {
    outputFile = `casa-renta-${data.slug}.html`;
    fs.writeFileSync(outputFile, htmlContent, 'utf-8');
} else {
    // Para VENTA crear estructura culiacan/[slug]/
    const propertyDir = `culiacan/${data.slug}`;
    if (!fs.existsSync(propertyDir)) {
        fs.mkdirSync(propertyDir, { recursive: true });
    }

    // Mover fotos a culiacan/[slug]/images/
    const srcImagesDir = `images/${data.slug}`;
    const destImagesDir = `${propertyDir}/images`;

    if (fs.existsSync(srcImagesDir)) {
        execSync(`mv "${srcImagesDir}" "${destImagesDir}"`);
        console.log(`📸 Fotos movidas a ${destImagesDir}\n`);
    }

    // Copiar CSS
    execSync(`cp culiacan/infonavit-solidaridad/styles.css ${propertyDir}/styles.css`);
    console.log(`✅ styles.css copiado\n`);

    outputFile = `${propertyDir}/index.html`;
    fs.writeFileSync(outputFile, htmlContent, 'utf-8');
}

console.log(`💾 Archivo guardado: ${outputFile}\n`);

// Validaciones
console.log('🔍 VALIDACIONES:\n');

const placeholders = htmlContent.match(/\{\{[^}]+\}\}/g);
console.log(`   ${!placeholders ? '✅' : '❌'} 1. Sin placeholders sin reemplazar`);

const fotoCount = (htmlContent.match(/foto-\d+\.jpg/g) || []).length;
console.log(`   ${fotoCount > 0 ? '✅' : '❌'} 2. Fotos: ${fotoCount} referencias`);

const hasFlechas = htmlContent.includes('carousel-arrow');
console.log(`   ${hasFlechas ? '✅' : '❌'} 3. Carrusel con flechas`);

const hasLightbox = htmlContent.includes('id="lightbox"');
console.log(`   ${hasLightbox ? '✅' : '❌'} 4. Lightbox incluido`);

const hasStickyBar = htmlContent.includes('sticky-price-bar');
console.log(`   ${hasStickyBar ? '✅' : '❌'} 5. Sticky Price Bar`);

const tamaño = Math.round(htmlContent.length / 1024);
console.log(`\n📊 Tamaño: ${tamaño}KB\n`);

// Abrir en navegador
execSync(`open "${outputFile}"`);
console.log(`✅ Página abierta en navegador\n`);

console.log('═══════════════════════════════════════════════════════\n');
console.log('✅ GENERACIÓN COMPLETADA CON MASTER TEMPLATE\n');
console.log(`📁 HTML: ${outputFile}`);
console.log(`📁 JSON: ${jsonFile}\n`);
console.log('📝 SIGUIENTE PASO:\n');
console.log('   1. Verifica la página en el navegador');
console.log('   2. Si todo está bien: "publica ya"\n');
console.log('═══════════════════════════════════════════════════════\n');
