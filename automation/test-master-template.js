#!/usr/bin/env node

/**
 * TEST: Generador de Propiedades con Master Template
 * Prueba el nuevo método generateFromMasterTemplate()
 */

const fs = require('fs');
const PropertyPageGenerator = require('./generador-de-propiedades');

console.log('🧪 PRUEBA: Generador con Master Template\n');

// Configuración de prueba (Casa San Javier como ejemplo)
const testConfig = {
    key: 'casa-venta-test-master',
    title: 'Casa Test Master Template',
    price: '$5,000,000',
    location: 'Fracc. Test, Culiacán',
    bedrooms: 3,
    bathrooms: 2.5,
    construction_area: 250,
    land_area: 300,
    parking: 2,
    floors: 2,
    photoCount: 5,
    yearBuilt: 2024,
    postalCode: '80100',
    latitude: 24.8091,
    longitude: -107.3940
};

try {
    // Crear instancia del generador
    const generator = new PropertyPageGenerator(false); // false = venta (no renta)

    // Generar HTML usando master template CON VALIDACIÓN AUTOMÁTICA 🛡️
    console.log('📄 Generando HTML con validación automática...\n');
    const html = generator.generateFromMasterTemplateWithValidation(testConfig);

    // Guardar archivo de prueba
    const outputPath = './test-master-template-output.html';
    fs.writeFileSync(outputPath, html, 'utf8');

    console.log('✅ PRUEBA EXITOSA - HTML VALIDADO');
    console.log(`📁 Archivo generado: ${outputPath}`);
    console.log('\n🛡️  VALIDACIONES AUTOMÁTICAS PASADAS:');
    console.log('   ✅ Sin placeholders {{...}} sin reemplazar');
    console.log('   ✅ Todas las 5 fotos referenciadas');
    console.log('   ✅ Precio consistente en todos los lugares');
    console.log('   ✅ Recámaras/baños correctos');
    console.log('   ✅ Links WhatsApp válidos');
    console.log('   ✅ CSS cargado');
    console.log('   ✅ Carrusel configurado correctamente');
    console.log('\n🚀 SEGURO PARA PUBLICAR');

} catch (error) {
    console.error('\n❌ ERROR EN PRUEBA:', error.message);
    console.error(error.stack);
    process.exit(1);
}
