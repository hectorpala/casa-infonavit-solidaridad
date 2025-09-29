#!/usr/bin/env node

/**
 * Generación Casa en Renta Fracc Terracota usando Opción 1: Integración Inteligente
 */

const PropertyPageGenerator = require('./automation/property-page-generator');

// Configuración de la nueva propiedad
const terracotaConfig = {
    key: 'fracc-terracota',
    title: 'Casa en Renta Fracc Terracota',
    subtitle: 'Casa moderna de 3 años en fraccionamiento residencial',
    description: 'Hermosa casa en Fraccionamiento Terracota con excelente ubicación y acabados de calidad. Ideal para familias que buscan comodidad y tranquilidad.',
    price: 16000,
    location: 'Fraccionamiento Terracota, Culiacán, Sinaloa',
    bedrooms: 2,
    bathrooms: 2,
    features: ['2 Estacionamientos', '160 m² construidos', '3 años de antigüedad', 'Fraccionamiento cerrado'],
    canonicalURL: 'https://casasenventa.info/casa-renta-fracc-terracota.html',
    whatsapp_e164: '+528111652545',
    
    // Auto-detección de fotos en PROYECTOS
    fotos_origen: '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/casa en renta fracc terracota'
};

console.log('🏠 GENERACIÓN: Casa en Renta Fracc Terracota');
console.log('🔧 SISTEMA: Opción 1 - Integración Inteligente');
console.log('📸 FOTOS: Auto-detección en PROYECTOS');
console.log('===============================================');

async function generateTerracotaProperty() {
    try {
        // Crear instancia para propiedades de renta
        const generator = new PropertyPageGenerator(true); // isRental = true
        
        // Ejecutar generación con integración inteligente
        const result = generator.generate(terracotaConfig);
        
        console.log('✅ Generación completada exitosamente');
        console.log(`📄 Página individual: ${result}`);
        console.log('🔗 Integrado en index.html y culiacan/index.html');
        console.log('✅ Sistema Opción 1 funcionando correctamente');
        
    } catch (error) {
        console.error('❌ Error durante la generación:', error.message);
        process.exit(1);
    }
}

// Ejecutar generación
generateTerracotaProperty();