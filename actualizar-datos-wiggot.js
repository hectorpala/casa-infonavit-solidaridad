#!/usr/bin/env node

/**
 * Script para actualizar TODOS los datos de una propiedad Wiggot
 * Reemplaza datos de Infonavit Solidaridad por los nuevos
 */

const fs = require('fs');
const path = require('path');

const jsonFile = process.argv[2];
const htmlFile = process.argv[3];

if (!jsonFile || !htmlFile) {
    console.error('❌ Uso: node actualizar-datos-wiggot.js <json-file> <html-file>');
    process.exit(1);
}

// Leer datos
const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8')).data;
let html = fs.readFileSync(htmlFile, 'utf8');

console.log('🔄 Actualizando datos...\n');

// Reemplazos en meta tags y título
html = html.replace(/\$1,750,000/g, `$${data.price}`);
html = html.replace(/Infonavit Solidaridad/g, data.location || 'Barrio San Alberto, La Primavera');
html = html.replace(/Casa Remodelada en Infonavit Solidaridad/g, data.title || 'Casa en Renta Barrio San Alberto');
html = html.replace(/Blvrd Elbert 2609/g, data.location || 'Barrio San Alberto, La Primavera');

// Reemplazar recámaras, baños, áreas
html = html.replace(/"numberOfBedrooms": 2/g, `"numberOfBedrooms": ${data.bedrooms}`);
html = html.replace(/"numberOfBathroomsTotal": 2/g, `"numberOfBathroomsTotal": ${data.bathrooms}`);
html = html.replace(/"value": 91\.60/g, `"value": ${data.area_construida}`);
html = html.replace(/"value": 112\.5/g, `"value": ${data.area_terreno}`);
html = html.replace(/1750000/g, data.price.replace(/,/g, ''));

// Coordenadas
if (data.latitude && data.longitude) {
    html = html.replace(/"latitude": 24\.824491/g, `"latitude": ${data.latitude}`);
    html = html.replace(/"longitude": -107\.4287297/g, `"longitude": ${data.longitude}`);
}

// Descripción completa
if (data.description) {
    const desc = data.description.replace(/"/g, '\\"');
    html = html.replace(/Casa remodelada en venta en Infonavit Solidaridad[^"]*/g, desc.substring(0, 160));
}

// Reemplazar en el body (precio grande)
html = html.replace(/<h2 class="text-6xl[^>]*>\$1,750,000<\/h2>/g,
    `<h2 class="text-6xl md:text-8xl font-extrabold mb-6 text-white drop-shadow-2xl animate-fade-in">$${data.price}</h2>`);

// Reemplazar título principal
html = html.replace(/<h1[^>]*>Casa Remodelada[^<]*<\/h1>/g,
    `<h1 class="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg animate-fade-in-up">${data.title || 'Casa en Renta Barrio San Alberto'}</h1>`);

// Reemplazar ubicación
html = html.replace(/<p class="text-xl[^>]*>📍[^<]*<\/p>/g,
    `<p class="text-xl md:text-2xl text-white/90 mb-8 animate-fade-in-up"style="animation-delay: 0.2s;">📍 ${data.location || 'Barrio San Alberto, La Primavera, Culiacán'}</p>`);

// Actualizar specs (recámaras, baños, m²)
html = html.replace(/<i class="fas fa-bed"><\/i>\s*2 Recámaras/g,
    `<i class="fas fa-bed"></i> ${data.bedrooms} Recámaras`);
html = html.replace(/<i class="fas fa-bath"><\/i>\s*2 Baños/g,
    `<i class="fas fa-bath"></i> ${data.bathrooms} Baños`);
html = html.replace(/91\.60 m² Construcción/g,
    `${data.area_construida} m² Construcción`);
html = html.replace(/112\.5 m² Terreno/g,
    `${data.area_terreno} m² Terreno`);
html = html.replace(/<i class="fas fa-car"><\/i>\s*2 Estacionamientos/g,
    `<i class="fas fa-car"></i> ${data.estacionamientos} Estacionamientos`);
html = html.replace(/<i class="fas fa-layer-group"><\/i>\s*2 Niveles/g,
    `<i class="fas fa-layer-group"></i> ${data.niveles} Niveles`);

// Actualizar calculadora con precio correcto
html = html.replace(/value="1750000"/g, `value="${data.price.replace(/,/g, '')}"`);
html = html.replace(/\$1,750,000/g, `$${data.price}`);

// Descripción completa en section
if (data.description) {
    html = html.replace(/<p class="text-lg leading-relaxed">Casa remodelada[^<]*<\/p>/g,
        `<p class="text-lg leading-relaxed">${data.description}</p>`);
}

// Guardar
fs.writeFileSync(htmlFile, html);

console.log('✅ Datos actualizados:');
console.log(`   💰 Precio: $${data.price}`);
console.log(`   🛏️  Recámaras: ${data.bedrooms}`);
console.log(`   🚿 Baños: ${data.bathrooms}`);
console.log(`   📏 Construcción: ${data.area_construida}m²`);
console.log(`   📐 Terreno: ${data.area_terreno}m²`);
console.log(`   🚗 Estacionamientos: ${data.estacionamientos}`);
console.log(`   🏢 Niveles: ${data.niveles}`);
console.log(`\n🎉 Archivo actualizado: ${htmlFile}`);
