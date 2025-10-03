#!/usr/bin/env node

const fs = require('fs');
const PropertyPageGenerator = require('./automation/generador-de-propiedades') // ✅ Actualizado;

const propertyData = {
    title: "Casa en Venta Stanza Toscana",
    location: "Stanza Toscana, Culiacán",
    price: "$1,990,000",
    priceNumber: 1990000,
    bedrooms: 3,
    bathrooms: 1.5, // 1 completo + 1 medio
    parking: 2,
    area: 78,
    landArea: 110,
    yearBuilt: "N/D",
    slug: "casa-venta-stanza-toscana",
    key: "casa-venta-stanza-toscana",
    propertyType: "venta",
    description: "Moderna casa en venta lista para habitar localizada en Stanza Toscana, Culiacán Rosales. Cuenta con 3 recámaras, 1 baño completo, 1 medio baño, 78 m² de construcción sobre 110 m² de terreno. La propiedad cuenta con 2 pisos, ubicada en privada con aire acondicionado y 2 cajones de estacionamiento.",
    features: [
        "3 Recámaras",
        "1 Baño + 1 Medio Baño",
        "78 m² de Construcción",
        "110 m² de Terreno",
        "2 Pisos",
        "Privada",
        "Aire Acondicionado",
        "2 Estacionamientos"
    ],
    whatsappMessage: "Hola, me interesa la casa en venta en Stanza Toscana de $1,990,000",
    photosFolder: "casa venta paseo toscana",
    photoCount: 7
};

const generator = new PropertyPageGenerator(false);
const htmlContent = generator.generateFromMasterTemplateWithValidation(propertyData);

// Guardar archivo HTML
const outputPath = `${propertyData.slug}.html`;
fs.writeFileSync(outputPath, htmlContent);
console.log(`\n✅ Página generada exitosamente: ${outputPath}`);
