#!/usr/bin/env node

/**
 * Test Script: Villa Andalucía Integration con Opción 1
 * Prueba el sistema de integración inteligente preservando propiedades existentes
 */

const PropertyPageGenerator = require('./automation/property-page-generator');

// Configuración Villa Andalucía para prueba
const villaPrimaveraConfig = {
    key: 'villa-andalucia-test',
    title: 'Casa en Renta $12,500 - Villa Andalucía',
    subtitle: 'Casa de 2 pisos con 2.5 baños en privada exclusiva',
    description: 'Hermosa casa en Villa Andalucía, Colonia Villa Andalucía, C.P. 80130. Ideal para familias que buscan comodidad y tranquilidad en zona segura.',
    price: 12500,
    location: 'Villa Andalucía, Culiacán, Sinaloa, C.P. 80130',
    bedrooms: 3,
    bathrooms: 2.5,
    features: ['2 pisos', 'Aire acondicionado', 'Cocina integral', 'Privada cerrada', 'Área común'],
    canonicalURL: 'https://casasenventa.info/casa-renta-villa-andalucia-test.html',
    whatsapp_e164: '+528111652545',
    fotos_origen: '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/casa renta villa andalucia'
};

console.log('🧪 TESTING: Villa Andalucía Integration with Option 1');
console.log('====================================================');

async function testIntegration() {
    try {
        // 1. Contar propiedades existentes ANTES
        console.log('\n📊 Step 1: Counting existing properties...');
        const generator = new PropertyPageGenerator(true); // isRental = true
        
        const existingIndex = generator.extractExistingProperties('./index.html');
        const existingCuliacan = generator.extractExistingProperties('./culiacan/index.html');
        
        console.log(`   Index.html: ${existingIndex.length} properties`);
        console.log(`   Culiacan/index.html: ${existingCuliacan.length} properties`);
        
        // 2. Ejecutar integración
        console.log('\n🚀 Step 2: Running integration...');
        const result = generator.generate(villaPrimaveraConfig);
        
        // 3. Verificar resultados
        console.log('\n✅ Step 3: Verifying results...');
        const newIndex = generator.extractExistingProperties('./index.html');
        const newCuliacan = generator.extractExistingProperties('./culiacan/index.html');
        
        console.log(`   Index.html: ${newIndex.length} properties (expected: ${existingIndex.length + 1})`);
        console.log(`   Culiacan/index.html: ${newCuliacan.length} properties (expected: ${existingCuliacan.length + 1})`);
        
        // 4. Validación final
        const indexSuccess = newIndex.length === existingIndex.length + 1;
        const culiacanSuccess = newCuliacan.length === existingCuliacan.length + 1;
        
        if (indexSuccess && culiacanSuccess) {
            console.log('\n🎉 SUCCESS: Integration test passed!');
            console.log('✅ All existing properties preserved');
            console.log('✅ New property added successfully');
            console.log(`✅ Individual page created: ${result}`);
            console.log('\n🔗 URLs to verify:');
            console.log('   - https://casasenventa.info/');
            console.log('   - https://casasenventa.info/culiacan/');
            console.log(`   - https://casasenventa.info/${result}`);
        } else {
            console.log('\n❌ FAILED: Integration test failed');
            if (!indexSuccess) console.log(`❌ Index.html: expected ${existingIndex.length + 1}, got ${newIndex.length}`);
            if (!culiacanSuccess) console.log(`❌ Culiacan/index.html: expected ${existingCuliacan.length + 1}, got ${newCuliacan.length}`);
        }
        
    } catch (error) {
        console.error('\n❌ ERROR during test:', error.message);
        process.exit(1);
    }
}

// Ejecutar test
testIntegration();