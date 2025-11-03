#!/usr/bin/env node

/**
 * Reemplaza bloques de geocoder.geocode() con coordenadas hardcodeadas
 * Versión 2: Búsqueda y reemplazo línea por línea
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'culiacan/index.html');
const coordsFile = path.join(__dirname, 'geocoded-coordinates.json');

console.log('🔄 Reemplazando geocoder.geocode() con coordenadas hardcodeadas...\n');

let html = fs.readFileSync(filePath, 'utf8');
const coords = JSON.parse(fs.readFileSync(coordsFile, 'utf8'));

console.log(`📍 Coordenadas a reemplazar: ${coords.length}\n`);

let replacedCount = 0;

coords.forEach((item, index) => {
    const propName = item.propertyName;

    // Buscar el comentario que inicia el bloque
    const commentLine = `            // Geocodificar ${propName}`;
    const commentIndex = html.indexOf(commentLine);

    if (commentIndex === -1) {
        console.log(`⚠️  [${index + 1}/${coords.length}] ${propName} - Comentario NO encontrado`);
        return;
    }

    // Buscar el cierre del bloque geocode (el });)
    const startIndex = commentIndex;
    let endIndex = html.indexOf('            });', startIndex);

    if (endIndex === -1) {
        console.log(`⚠️  [${index + 1}/${coords.length}] ${propName} - Cierre NO encontrado`);
        return;
    }

    // Incluir el cierre });
    endIndex += '            });'.length;

    // Extraer el bloque completo
    const oldBlock = html.substring(startIndex, endIndex);

    // Crear el nuevo bloque con coordenadas hardcodeadas
    const newBlock = `            // ${propName} - ${item.address} - Coordenadas finales (hardcoded)
            const ${propName}Position = new google.maps.LatLng(${item.lat}, ${item.lng});
            const ${propName}MarkerClass = createZillowPropertyMarker(${propName}Property, window.mapCuliacan);
            const ${propName}Marker = new ${propName}MarkerClass(${propName}Position, window.mapCuliacan, ${propName}Property);
            window.allCuliacanMarkers.push(${propName}Marker);
            console.log('Marcador ${propName} creado en:', ${propName}Position.lat(), ${propName}Position.lng());`;

    // Reemplazar
    html = html.slice(0, startIndex) + newBlock + html.slice(endIndex);

    replacedCount++;
    console.log(`✅ [${index + 1}/${coords.length}] ${propName} - Reemplazado (${item.lat}, ${item.lng})`);
});

console.log(`\n📊 Resumen:\n`);
console.log(`   Bloques reemplazados: ${replacedCount}/${coords.length}\n`);

// Guardar
fs.writeFileSync(filePath, html, 'utf8');

console.log(`✅ Archivo guardado: culiacan/index.html\n`);
console.log(`🎉 Ahora el mapa carga instantáneamente con todas las propiedades!\n`);
