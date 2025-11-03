#!/usr/bin/env node

/**
 * Reemplaza las llamadas a geocoder.geocode() con coordenadas hardcodeadas
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

    // Patrón para encontrar el bloque completo de geocoder.geocode
    // Desde el comentario hasta el cierre de la función
    const pattern = new RegExp(
        `// Geocodificar ${propName}\\s+` +
        `geocoder\\.geocode\\(\\s*\\{\\s*address:\\s*"[^"]*"\\s*\\},\\s*function\\(results, status\\)\\s*\\{[\\s\\S]*?` +
        `console\\.log\\('Marcador ${propName} creado[^}]+\\}\\s*\\}\\);`,
        'g'
    );

    // Código de reemplazo con coordenadas hardcodeadas
    const replacement = `// ${propName} - ${item.address} - Coordenadas finales (hardcoded)
            const ${propName}Position = new google.maps.LatLng(${item.lat}, ${item.lng});
            const ${propName}MarkerClass = createZillowPropertyMarker(${propName}Property, window.mapCuliacan);
            const ${propName}Marker = new ${propName}MarkerClass(${propName}Position, window.mapCuliacan, ${propName}Property);
            window.allCuliacanMarkers.push(${propName}Marker);
            console.log('Marcador ${propName} creado en:', ${propName}Position.lat(), ${propName}Position.lng());`;

    const beforeLength = html.length;
    html = html.replace(pattern, replacement);
    const afterLength = html.length;

    if (beforeLength !== afterLength) {
        replacedCount++;
        console.log(`✅ [${index + 1}/${coords.length}] ${propName} - Reemplazado`);
    } else {
        console.log(`⚠️  [${index + 1}/${coords.length}] ${propName} - NO encontrado (puede ya estar hardcoded)`);
    }
});

console.log(`\n📊 Resumen:\n`);
console.log(`   Bloques reemplazados: ${replacedCount}/${coords.length}`);

// Guardar
fs.writeFileSync(filePath, html, 'utf8');

console.log(`\n✅ Archivo guardado: culiacan/index.html\n`);
console.log(`🎉 Ahora el mapa carga instantáneamente con todas las propiedades!\n`);
