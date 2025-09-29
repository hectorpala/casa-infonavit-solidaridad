#!/usr/bin/env node

/**
 * Test Script: Solo Index.html - Debug de duplicación
 */

const PropertyPageGenerator = require('./automation/property-page-generator');

// Configuración simple para test
const testConfig = {
    key: 'test-property',
    title: 'Casa Test Villa Andalucía',
    subtitle: 'Casa de prueba para debugging',
    description: 'Esta es una propiedad de prueba para debuggear el sistema.',
    price: 12500,
    location: 'Test Location, Culiacán',
    bedrooms: 3,
    bathrooms: 2.5,
    features: ['Test Feature 1', 'Test Feature 2'],
    canonicalURL: 'https://casasenventa.info/casa-renta-test-property.html',
    whatsapp_e164: '+528111652545'
};

console.log('🧪 DEBUGGING: Index.html Property Integration');
console.log('============================================');

async function debugIndexIntegration() {
    try {
        const generator = new PropertyPageGenerator(true); // isRental = true
        
        // 1. Contar propiedades ANTES
        console.log('\n📊 BEFORE: Counting properties...');
        const existingBefore = generator.extractExistingProperties('./index.html');
        console.log(`   Found: ${existingBefore.length} properties`);
        
        // 2. Generar nueva property card (sin integrar)
        console.log('\n🔧 Generating new property card...');
        const newCard = generator.generatePropertyCard(testConfig, false);
        console.log('New card preview:');
        console.log(newCard.substring(0, 200) + '...');
        
        // 3. Intentar integración
        console.log('\n🚀 Attempting integration...');
        const result = generator.generateIntegratedListing(testConfig, existingBefore, './index.html');
        console.log(`   Integration reports: ${result} total properties`);
        
        // 4. Contar propiedades DESPUÉS
        console.log('\n📊 AFTER: Counting properties...');
        const existingAfter = generator.extractExistingProperties('./index.html');
        console.log(`   Found: ${existingAfter.length} properties`);
        
        // 5. Análisis
        console.log('\n🔍 ANALYSIS:');
        console.log(`   Expected: ${existingBefore.length + 1} = ${existingBefore.length} + 1`);
        console.log(`   Actual: ${existingAfter.length}`);
        console.log(`   Integration function returned: ${result}`);
        
        if (existingAfter.length === existingBefore.length + 1) {
            console.log('✅ SUCCESS: No duplication detected!');
        } else {
            console.log('❌ PROBLEM: Duplication detected!');
            console.log(`   Difference: ${existingAfter.length - existingBefore.length - 1} extra properties`);
        }
        
    } catch (error) {
        console.error('\n❌ ERROR during test:', error.message);
        process.exit(1);
    }
}

// Ejecutar test
debugIndexIntegration();