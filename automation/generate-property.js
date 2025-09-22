#!/usr/bin/env node

/**
 * Quick Property Page Generator Script
 * Usage: node generate-property.js [property-name]
 */

const PropertyPageGenerator = require('./property-page-generator');
const fs = require('fs');
const path = require('path');

// Predefined property configurations
const propertyConfigs = {
    'casa-ejemplo': {
        key: 'casa-ejemplo',
        title: 'Casa en Venta $1,500,000 - Nueva Propiedad',
        subtitle: 'Hermosa casa en excelente ubicación con todas las comodidades',
        description: 'Casa funcional con acabados de calidad en zona privilegiada. Ideal para familias que buscan comodidad y tranquilidad.',
        price: 1500000,
        location: 'Culiacán, Sinaloa',
        bedrooms: 3,
        bathrooms: 2,
        features: ['Cochera', 'Jardín', 'Cocina integral', 'Área de servicio'],
        canonicalURL: 'https://casasenventa.info/casa-venta-casa-ejemplo/'
    },

    'casa-alameda': {
        key: 'casa-alameda',
        title: 'Casa en Venta $1,800,000 - Alameda',
        subtitle: 'Casa moderna en Alameda con excelentes acabados',
        description: 'Hermosa casa en una de las mejores zonas de Culiacán. Construcción reciente con materiales de primera calidad.',
        price: 1800000,
        location: 'Alameda, Culiacán',
        bedrooms: 4,
        bathrooms: 2.5,
        features: ['2 niveles', 'Cochera techada', 'Jardín amplio', 'Cocina integral'],
        canonicalURL: 'https://casasenventa.info/casa-venta-alameda-culiacan/'
    },

    'casa-montebello': {
        key: 'casa-montebello',
        title: 'Casa en Venta $2,200,000 - Montebello',
        subtitle: 'Casa de lujo en Montebello con amenidades exclusivas',
        description: 'Residencia de alta calidad en fraccionamiento exclusivo. Amplios espacios y acabados premium.',
        price: 2200000,
        location: 'Montebello, Culiacán',
        bedrooms: 4,
        bathrooms: 3,
        features: ['3 niveles', 'Alberca', 'Garage para 2 autos', 'Área de BBQ'],
        canonicalURL: 'https://casasenventa.info/casa-venta-montebello-culiacan/'
    }
};

function showUsage() {
    console.log(`
🏠 Generador Rápido de Páginas de Propiedades

Uso:
  node generate-property.js [nombre-propiedad]

Propiedades predefinidas:
${Object.keys(propertyConfigs).map(key => `  - ${key}`).join('\n')}

Ejemplos:
  node generate-property.js casa-ejemplo
  node generate-property.js casa-alameda

Para crear una nueva configuración:
  1. Edita este archivo y agrega tu configuración
  2. Crea el directorio de fotos: images/[nombre-propiedad]/
  3. Ejecuta: node generate-property.js [nombre-propiedad]
`);
}

function createDirectoryStructure() {
    const dirs = [
        './automation',
        './automation/templates',
        './images'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
}

function generateProperty(propertyName) {
    const config = propertyConfigs[propertyName];
    
    if (!config) {
        console.error(`❌ Property configuration not found: ${propertyName}`);
        console.log('\nAvailable properties:');
        Object.keys(propertyConfigs).forEach(key => {
            console.log(`  - ${key}`);
        });
        process.exit(1);
    }

    console.log(`🚀 Generating property page: ${propertyName}`);
    console.log(`📋 Title: ${config.title}`);
    console.log(`💰 Price: $${config.price.toLocaleString('es-MX')}`);
    console.log(`📍 Location: ${config.location}`);

    // Check if photos directory exists
    const photosDir = `./images/${config.key}`;
    if (!fs.existsSync(photosDir)) {
        console.warn(`⚠️  Photo directory not found: ${photosDir}`);
        console.log(`📸 Please create the directory and add property photos`);
        
        // Create empty directory
        fs.mkdirSync(photosDir, { recursive: true });
        console.log(`📁 Created empty directory: ${photosDir}`);
        
        // Create example files list
        const exampleFiles = [
            'fachada.jpg',
            'sala.jpg', 
            'cocina.jpg',
            'recamara1.jpg',
            'recamara2.jpg',
            'bano.jpg'
        ];
        
        console.log('\n📝 Suggested photo filenames:');
        exampleFiles.forEach(file => console.log(`  - ${file}`));
        console.log('\nAdd your photos and run the command again.');
        return;
    }

    try {
        const generator = new PropertyPageGenerator();
        const filepath = generator.generate(config);
        
        console.log('\n✅ Property page generated successfully!');
        console.log(`📄 File: ${filepath}`);
        console.log(`🌐 You can now open the file in a browser to preview`);
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        showUsage();
        return;
    }

    const command = args[0];
    
    if (command === '--help' || command === '-h') {
        showUsage();
        return;
    }

    if (command === '--init') {
        createDirectoryStructure();
        console.log('✅ Directory structure created');
        return;
    }

    // Ensure directories exist
    createDirectoryStructure();
    
    // Generate property
    generateProperty(command);
}

if (require.main === module) {
    main();
}

module.exports = { propertyConfigs, generateProperty };