#!/usr/bin/env node

/**
 * Extrae TODAS las propiedades que aún usan geocoder.geocode()
 * Incluye tanto las que usan string literal como PropertyName.address
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'culiacan/index.html');
const outputFile = path.join(__dirname, 'remaining-addresses.json');

console.log('📍 Extrayendo TODAS las direcciones restantes...\n');

const html = fs.readFileSync(filePath, 'utf8');
const lines = html.split('\n');

const addresses = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detectar: // Geocodificar <propertyName>
    const commentMatch = line.match(/\/\/\s*Geocodificar\s+(\w+)/);

    if (commentMatch) {
        const propertyName = commentMatch[1];

        // Siguiente línea contiene geocoder.geocode
        if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];

            // Caso 1: String literal
            const literalMatch = nextLine.match(/geocoder\.geocode\(\s*\{\s*address:\s*"([^"]+)"\s*\}/);

            if (literalMatch) {
                addresses.push({
                    propertyName: propertyName,
                    address: literalMatch[1],
                    type: 'literal',
                    lineNumber: i + 2
                });
                continue;
            }

            // Caso 2: Property.address
            const propertyMatch = nextLine.match(/geocoder\.geocode\(\s*\{\s*address:\s*(\w+)Property\.address\s*\}/);

            if (propertyMatch) {
                // Buscar el objeto Property hacia atrás en el HTML
                const propertyObjectPattern = new RegExp(`const ${propertyName}Property\\s*=\\s*\\{[\\s\\S]*?address:\\s*"([^"]+)"`, 'm');
                const objectMatch = html.match(propertyObjectPattern);

                if (objectMatch) {
                    addresses.push({
                        propertyName: propertyName,
                        address: objectMatch[1],
                        type: 'property',
                        lineNumber: i + 2
                    });
                } else {
                    addresses.push({
                        propertyName: propertyName,
                        address: 'NOT_FOUND',
                        type: 'property_error',
                        lineNumber: i + 2
                    });
                }
            }
        }
    }
}

console.log(`✅ Direcciones encontradas: ${addresses.length}\n`);

// Mostrar resumen por tipo
const byType = addresses.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
}, {});

console.log('📊 Por tipo:');
Object.keys(byType).forEach(type => {
    console.log(`   ${type}: ${byType[type]}`);
});

console.log('\n📋 Propiedades:\n');
addresses.forEach((item, index) => {
    const status = item.address === 'NOT_FOUND' ? '❌' : '✅';
    console.log(`${status} ${index + 1}. ${item.propertyName}`);
    console.log(`   ${item.address}`);
});

// Guardar
fs.writeFileSync(outputFile, JSON.stringify(addresses, null, 2), 'utf8');

console.log(`\n💾 Guardado en: remaining-addresses.json\n`);
