#!/usr/bin/env node

/**
 * Extrae todas las direcciones que necesitan geocodificación
 * y las guarda en un archivo JSON
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'culiacan/index.html');
const outputFile = path.join(__dirname, 'addresses-to-geocode.json');

console.log('📍 Extrayendo direcciones para geocodificar...\n');

const html = fs.readFileSync(filePath, 'utf8');
const lines = html.split('\n');

const addresses = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detectar comentario: // Geocodificar <propertyName>
    const commentMatch = line.match(/\/\/\s*Geocodificar\s+(\w+)/);

    if (commentMatch) {
        const propertyName = commentMatch[1];

        // La siguiente línea debe contener geocoder.geocode
        if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const addressMatch = nextLine.match(/geocoder\.geocode\(\s*\{\s*address:\s*"([^"]+)"\s*\}/);

            if (addressMatch) {
                addresses.push({
                    propertyName: propertyName,
                    address: addressMatch[1],
                    lineNumber: i + 2 // +2 porque los arrays empiezan en 0 y queremos línea del archivo
                });
            }
        }
    }
}

console.log(`✅ Direcciones encontradas: ${addresses.length}\n`);

addresses.forEach((item, index) => {
    console.log(`${index + 1}. ${item.propertyName}`);
    console.log(`   ${item.address}`);
});

// Guardar en JSON
fs.writeFileSync(outputFile, JSON.stringify(addresses, null, 2), 'utf8');

console.log(`\n💾 Guardado en: addresses-to-geocode.json\n`);
