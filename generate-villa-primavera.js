#!/usr/bin/env node

const PropertyPageGenerator = require('./automation/property-page-generator');

// Configuration for Villa Primavera rental property
const villaPrimaveraConfig = {
    key: 'villa-primavera',
    title: 'Casa en Renta $11,000 - Villa Primavera',
    subtitle: 'Casa de 2 pisos en privada con alberca comunitaria y aire acondicionado',
    description: 'Hermosa casa de 2 pisos en Privada Villa Primavera. 3 recámaras, 2.5 baños, cocina integral, aire acondicionado en toda la casa y alberca en área común. Contrato mínimo 1 año.',
    price: 11000,
    location: 'Villa Primavera, Culiacán',
    bedrooms: 3,
    bathrooms: 2.5,
    features: ['2 pisos', 'Aire acondicionado', 'Alberca común', 'Cocina integral', 'Privada cerrada'],
    canonicalURL: 'https://casasenventa.info/casa-renta-villa-primavera.html'
};

console.log('🏠 Generando página para Villa Primavera...');
console.log(`📋 Título: ${villaPrimaveraConfig.title}`);
console.log(`💰 Renta: $${villaPrimaveraConfig.price.toLocaleString('es-MX')} mensuales`);
console.log(`📍 Ubicación: ${villaPrimaveraConfig.location}`);
console.log(`🛏️ Recámaras: ${villaPrimaveraConfig.bedrooms}`);
console.log(`🚿 Baños: ${villaPrimaveraConfig.bathrooms}`);

try {
    // Create rental generator (isRental = true)
    const generator = new PropertyPageGenerator(true);
    const filepath = generator.generate(villaPrimaveraConfig);
    
    console.log('\n✅ Página de Villa Primavera generada exitosamente!');
    console.log(`📄 Archivo: ${filepath}`);
    console.log(`🌐 URL: https://casasenventa.info/casa-renta-villa-primavera.html`);
    console.log(`📸 Fotos: ${generator.scanPropertyPhotos(villaPrimaveraConfig.key).length} imágenes`);
    console.log('\n🚀 Características incluidas:');
    console.log('✅ Carousel hero y galería optimizados');
    console.log('✅ Calculadora de renta personalizada');
    console.log('✅ WhatsApp flotante con mensaje de renta');
    console.log('✅ Todas las optimizaciones de performance');
    console.log('✅ SEO y Schema.org para propiedades en renta');
    
} catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
}