#!/usr/bin/env node
/**
 * Genera página HTML desde datos scrapeados de Wiggot usando Master Template
 */

const fs = require('fs');
const path = require('path');
const PropertyPageGenerator = require('./automation/generador-de-propiedades');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    bright: '\x1b[1m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

// Leer datos scrapeados
const wiggotData = JSON.parse(fs.readFileSync('wiggot-datos-extraidos.json', 'utf8'));

log('\n╔═══════════════════════════════════════════════════════╗', 'bright');
log('║   🏗️  Generador Master Template desde Wiggot        ║', 'bright');
log('╚═══════════════════════════════════════════════════════╝\n', 'bright');

log('📊 Datos de entrada:', 'yellow');
log(`  Título: ${wiggotData.data.title}`, 'cyan');
log(`  Precio: $1,750,000`, 'cyan');
log(`  Ubicación: Avenida De Los Poetas 1435, Portalegre`, 'cyan');
log(`  Recámaras: ${wiggotData.data.bedrooms}`, 'cyan');
log(`  Baños: ${wiggotData.data.bathrooms}`, 'cyan');
log(`  Terreno: ${wiggotData.data.area} m²`, 'cyan');
log(`  Fotos: ${wiggotData.data.images.length}`, 'cyan');

// Crear configuración para el generador
const config = {
    key: 'casa-venta-portalegre-045360',
    title: 'Casa en Venta Portalegre Premium',
    price: '$1,750,000',
    location: 'Fracc. Portalegre, Culiacán',
    bedrooms: 2,
    bathrooms: 1.5,
    construction_area: 65,
    land_area: 139,
    parking: 3,
    floors: 2,
    yearBuilt: 2024,
    postalCode: '80200',
    latitude: 24.8091,
    longitude: -107.3940,
    photoCount: 16, // Fotos scrapeadas de Wiggot

    // Descripción completa
    description: `Casa en Venta con Excedente Portalegre Premium

Excelente ubicación en el Fraccionamiento Portalegre, una de las zonas más exclusivas de Culiacán.

📍 Características Principales:
• Terreno de 8.2 m x 17 m (139 m²)
• Área construida: 65 m²
• Cochera destapada para 3 autos
• Dos Recámaras amplias
• 1.5 baños (1 completo + medio baño)
• 2 Niveles
• Equipada con minisplit en sala y las dos recámaras

🏡 Amenidades del Fraccionamiento:
• Ubicación privilegiada en Portalegre
• Cercanía a centros comerciales
• Excelente conectividad vial
• Zona tranquila y segura

💰 Información Financiera:
• Precio: $1,750,000 MXN
• Mantenimiento: $0
• Comisión: 2%

Esta propiedad es ideal para familias que buscan comodidad, ubicación estratégica y una excelente inversión.

¡Agenda tu cita hoy mismo!`,

    amenities: [
        'Minisplit en sala',
        'Minisplit en recámaras',
        'Cochera para 3 autos',
        '2 Niveles',
        'Fracc. Portalegre Premium',
        'Excelente ubicación'
    ]
};

log('\n🔧 Generando página HTML con Master Template...', 'yellow');

const generator = new PropertyPageGenerator(false); // false = venta
const html = generator.generateFromMasterTemplate(config);

// Crear carpeta
const outputDir = `culiacan/${config.key}`;
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    log(`✅ Carpeta creada: ${outputDir}`, 'green');
}

// Crear carpeta de imágenes
const imagesDir = `${outputDir}/images`;
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    log(`✅ Carpeta de imágenes creada: ${imagesDir}`, 'green');
}

// Copiar fotos de wiggot-fotos a la carpeta de la propiedad
log('\n📸 Copiando fotos de Wiggot...', 'yellow');
const { execSync } = require('child_process');

try {
    execSync(`cp wiggot-fotos/foto-*.jpg "${imagesDir}/"`, { stdio: 'inherit' });
    log(`✅ ${config.photoCount} fotos copiadas`, 'green');
} catch (error) {
    log(`❌ Error copiando fotos: ${error.message}`, 'red');
}

// Guardar HTML
const htmlPath = `${outputDir}/index.html`;
fs.writeFileSync(htmlPath, html);
log(`✅ HTML generado: ${htmlPath}`, 'green');

log('\n✅ GENERACIÓN COMPLETADA', 'bright');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
log(`📁 Carpeta: ${outputDir}/`, 'cyan');
log(`📄 HTML: ${htmlPath}`, 'cyan');
log(`📸 Fotos: ${imagesDir}/ (${config.photoCount} fotos)`, 'cyan');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

log('🌐 URL local: http://localhost:8000/culiacan/' + config.key + '/', 'yellow');
log('🌐 URL producción: https://casasenventa.info/culiacan/' + config.key + '/', 'yellow');

log('\n💡 Próximo paso: Revisar la página generada', 'yellow');
log('💡 Si está bien, ejecuta: "publica ya"', 'yellow');
