#!/usr/bin/env node

const PropertyPageGenerator = require('./automation/property-page-generator.js');

// Configuración específica para Casa Bosques del Rey
const casaBosquesDelRey = {
    key: 'bosques-del-rey',
    title: 'Casa en Venta - Bosques del Rey',
    subtitle: 'Hermosa casa en fraccionamiento exclusivo',
    description: 'Elegante casa en el fraccionamiento Bosques del Rey, una de las zonas residenciales más privilegiadas de Culiacán. Cuenta con excelente ubicación, seguridad y todas las comodidades para tu familia.',
    price: 2800000,
    location: 'Bosques del Rey, Culiacán, Sinaloa',
    bedrooms: 3,
    bathrooms: 2,
    features: [
        'Fraccionamiento privado',
        'Seguridad 24/7',
        'Cocina integral',
        'Cochera techada',
        'Jardín amplio',
        'Área social',
        'Ubicación privilegiada'
    ],
    canonicalURL: 'https://casasenventa.info/casa-venta-bosques-del-rey/'
};

console.log('🏠 INICIANDO PIPELINE AUTOMÁTICO PARA CASA BOSQUES DEL REY');
console.log('🎯 SPEC props-v3.3 - SISTEMA DE DETECCIÓN DE FACHADA MEJORADO');
console.log('=' * 60);

// Crear generador para venta (no rental)
const generator = new PropertyPageGenerator(false);

try {
    // Ejecutar pipeline completo automático
    const generatedFile = generator.generate(casaBosquesDelRey);
    
    console.log('🎉 PIPELINE AUTOMÁTICO COMPLETADO CON ÉXITO');
    console.log(`📁 Archivo generado: ${generatedFile}`);
    console.log('✅ READY TO PUBLISH');
    
} catch (error) {
    console.error('❌ ERROR EN PIPELINE AUTOMÁTICO:', error.message);
    process.exit(1);
}