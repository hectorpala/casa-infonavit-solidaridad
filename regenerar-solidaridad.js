#!/usr/bin/env node

/**
 * Script para regenerar Casa Solidaridad con Master Template formato Wiggot
 */

const fs = require('fs');
const path = require('path');
const PropertyPageGenerator = require('./automation/generador-de-propiedades');

// Configuración de Casa Solidaridad
const config = {
    key: 'infonavit-solidaridad',
    title: 'Casa Remodelada en Infonavit Solidaridad',
    price: '$1,750,000',
    priceNumeric: 1750000,
    location: 'Blvrd Elbert 2609, Infonavit Solidaridad, Culiacán',
    neighborhood: 'Infonavit Solidaridad',
    bedrooms: 2,
    bathrooms: 2,
    construction_area: 91.60,
    land_area: 112.5,
    parking: 2,
    floors: 1,
    yearBuilt: 2020,
    postalCode: '80058',
    latitude: 24.824491,
    longitude: -107.4287297,
    photoCount: 16, // Número de fotos disponibles

    // Descripción detallada
    description: 'Hermosa casa remodelada en Infonavit Solidaridad. Cuenta con 2 recámaras amplias, 2 baños completos, cochera techada para 2 autos, cuarto de TV, y acabados de calidad. Ubicación privilegiada cerca de escuelas, comercios y servicios.',

    // Amenidades
    amenities: [
        'Cochera techada para 2 autos',
        'Cuarto de TV',
        '2 Baños completos',
        'Recámaras amplias',
        'Acabados de calidad',
        'Excelente ubicación'
    ]
};

console.log('🏠 Regenerando Casa Solidaridad con Master Template...\n');

// Crear generador
const generator = new PropertyPageGenerator(false); // false = venta

// Generar HTML con Master Template
console.log('📄 Generando HTML...');
const html = generator.generateFromMasterTemplate(config);

// Guardar archivo
const outputPath = 'culiacan/infonavit-solidaridad/index.html';
fs.writeFileSync(outputPath, html, 'utf8');

console.log(`✅ Página regenerada: ${outputPath}`);
console.log('\n📊 Características incluidas:');
console.log('  ✅ Sticky Price Bar con WhatsApp');
console.log('  ✅ Scroll Animations (fade-in)');
console.log('  ✅ Haptic Feedback (vibración móvil)');
console.log('  ✅ Calculadora Zillow reducida 70%');
console.log('  ✅ Hero compacto (50% más pequeño)');
console.log('  ✅ Features compactas (iconos 15% más grandes)');
console.log('  ✅ Lightbox gallery con 16 fotos');
console.log('  ✅ Carrusel hero interactivo');
console.log('  ✅ SEO completo (Schema.org + Open Graph)');

console.log('\n🎯 Siguiente paso:');
console.log('  Verifica localmente: open culiacan/infonavit-solidaridad/index.html');
console.log('  Publica: "publica ya"');
