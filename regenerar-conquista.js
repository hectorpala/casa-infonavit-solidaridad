#!/usr/bin/env node

const fs = require('fs');
const PropertyPageGenerator = require('./automation/property-page-generator');

const propertyData = {
    title: "Casa en Venta La Conquista",
    location: "La Conquista, Culiacán, Sinaloa",
    price: "$1,600,000",
    priceNumber: 1600000,
    bedrooms: 2,
    bathrooms: 1,
    parking: 2,
    area: 140,
    landArea: 140,
    yearBuilt: "2023",
    slug: "casa-venta-la-conquista-culiacan",
    key: "casa-venta-la-conquista-culiacan",
    propertyType: "venta",
    description: "Hermosa casa cuenta con dos recámaras, un baño completo, un patio amplio con corredor lateral, un área de descanso y espacio para sala-comedor. Está como se entregó por la constructora y tiene construcción de calidad.",
    features: [
        "2 Recámaras",
        "1 Baño Completo",
        "140 m² de Terreno",
        "Patio Amplio",
        "Corredor Lateral",
        "Área de Descanso",
        "Sala-Comedor",
        "2 Estacionamientos",
        "Como Nueva",
        "Entrega Inmediata"
    ],
    whatsappMessage: "Hola, me interesa la casa en La Conquista de $1,600,000",
    photoCount: 5
};

console.log('🏠 Regenerando Casa La Conquista con template de VENTA estándar...\n');

const generator = new PropertyPageGenerator(false);

// Usar template de VENTA estándar (NO Solidaridad)
const htmlContent = generator.generateSaleTemplate(propertyData);

fs.writeFileSync(`${propertyData.slug}.html`, htmlContent);

console.log('✅ Archivo generado: casa-venta-la-conquista-culiacan.html');
console.log('\n📋 Datos usados:');
console.log('   Título:', propertyData.title);
console.log('   Precio:', propertyData.price);
console.log('   Descripción:', propertyData.description);
console.log('   Features:', propertyData.features.length, 'características');
console.log('   Fotos:', propertyData.photoCount, 'imágenes');
