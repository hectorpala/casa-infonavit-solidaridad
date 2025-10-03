#!/usr/bin/env node

const fs = require('fs');
const PropertyPageGenerator = require('./automation/generador-de-propiedades') // ✅ Actualizado;

// Datos scrapeados de propiedades.com
const propertyData = {
    title: "Casa en Venta La Conquista",
    location: "La Conquista, Culiacán, Sinaloa",
    price: "$1,600,000",
    priceNumber: 1600000,
    bedrooms: 2, // De la descripción: "dos recamaras"
    bathrooms: 1, // De la descripción: "un baño completo"
    parking: 2, // Del scraping
    area: 140, // Del HTML: "140 m2"
    landArea: 140,
    yearBuilt: "2023", // "1 años" de edad
    slug: "casa-venta-la-conquista-culiacan",
    key: "casa-venta-la-conquista-culiacan",
    propertyType: "venta",
    description: "Hermosa casa cuenta con dos recamaras, un baño completo, un patio amplio con corredor lateral, un area de descanso y espacio para sala-comedor, esta como se entrego por la constructora",
    features: [
        "2 Recámaras",
        "1 Baño Completo",
        "140 m² de Terreno",
        "Patio Amplio",
        "Corredor Lateral",
        "Área de Descanso",
        "Sala-Comedor",
        "2 Estacionamientos"
    ],
    whatsappMessage: "Hola, me interesa la casa en La Conquista de $1,600,000",
    photoCount: 5 // Tenemos 5 URLs de fotos
};

console.log('\n📄 Generando página HTML con PropertyPageGenerator...\n');

const generator = new PropertyPageGenerator(false);
const htmlContent = generator.generateFromMasterTemplateWithValidation(propertyData);

const filename = `${propertyData.slug}.html`;
fs.writeFileSync(filename, htmlContent);

console.log(`✅ Página generada: ${filename}`);
console.log(`\n📋 Datos de la propiedad:`);
console.log(JSON.stringify(propertyData, null, 2));

console.log(`\n🎯 Próximo paso:`);
console.log(`   1. Descargar fotos manualmente de:`);
console.log(`      - https://cdn.propiedades.com/files/1200x507/fd2af381-9fb2-11f0-964a-83f460a796ec.jpeg`);
console.log(`      - https://cdn.propiedades.com/files/1200x507/047156ef-9fb3-11f0-be14-83f460a796ec.jpeg`);
console.log(`      - https://cdn.propiedades.com/files/1200x507/0470d9cf-9fb3-11f0-b207-83f460a796ec.jpeg`);
console.log(`      - https://cdn.propiedades.com/files/1200x507/0471339e-9fb3-11f0-8c0d-83f460a796ec.jpeg`);
console.log(`      - https://cdn.propiedades.com/files/1200x507/047147b0-9fb3-11f0-87a7-83f460a796ec.jpeg`);
console.log(`\n   2. Guardar en: images/${propertyData.slug}/foto-1.jpg hasta foto-5.jpg`);
console.log(`\n   3. Optimizar con: ./optimize-toscana.sh modificado para esta propiedad`);
console.log(`\n   4. Abrir página: open ${filename}\n`);
