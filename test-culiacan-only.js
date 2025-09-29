#!/usr/bin/env node

/**
 * Test Script: Solo Culiacán Integration
 */

const PropertyPageGenerator = require('./automation/property-page-generator');

// Configuración simple para test
const testConfig = {
    key: 'villa-andalucia-test',
    title: 'Casa en Renta $12,500 - Villa Andalucía',
    subtitle: 'Casa de 2 pisos con 2.5 baños en privada exclusiva',
    description: 'Hermosa casa en Villa Andalucía, Colonia Villa Andalucía, C.P. 80130.',
    price: 12500,
    location: 'Villa Andalucía, Culiacán, Sinaloa, C.P. 80130',
    bedrooms: 3,
    bathrooms: 2.5,
    features: ['2 pisos', 'Aire acondicionado'],
    canonicalURL: 'https://casasenventa.info/casa-renta-villa-andalucia-test.html',
    whatsapp_e164: '+528111652545'
};

console.log('🧪 TESTING: Culiacán Integration Only');
console.log('===================================');

async function testCuliacanIntegration() {
    try {
        const generator = new PropertyPageGenerator(true); // isRental = true
        
        // 1. Contar propiedades ANTES
        console.log('\n📊 BEFORE: Counting Culiacán properties...');
        const existingBefore = generator.extractExistingProperties('./culiacan/index.html');
        console.log(`   Found: ${existingBefore.length} properties`);
        
        // 2. Intentar integración solo en Culiacán
        console.log('\n🚀 Attempting Culiacán integration...');
        const result = generator.generateIntegratedListing(testConfig, existingBefore, './culiacan/index.html');
        console.log(`   Integration reports: ${result} total properties`);
        
        // 3. Contar propiedades DESPUÉS
        console.log('\n📊 AFTER: Counting Culiacán properties...');
        const existingAfter = generator.extractExistingProperties('./culiacan/index.html');
        console.log(`   Found: ${existingAfter.length} properties`);
        
        // 4. Análisis
        console.log('\n🔍 ANALYSIS:');
        console.log(`   Expected: ${existingBefore.length + 1} = ${existingBefore.length} + 1`);
        console.log(`   Actual: ${existingAfter.length}`);
        
        if (existingAfter.length === existingBefore.length + 1) {
            console.log('✅ SUCCESS: Culiacán integration working!');
        } else {
            console.log('❌ PROBLEM: Culiacán integration failed!');
        }
        
    } catch (error) {
        console.error('\n❌ ERROR during test:', error.message);
        process.exit(1);
    }
}

// Ejecutar test
testCuliacanIntegration();