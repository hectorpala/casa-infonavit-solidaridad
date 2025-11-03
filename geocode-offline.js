#!/usr/bin/env node

/**
 * Geocodifica direcciones offline usando Google Maps Geocoding API
 * Genera coordenadas hardcodeadas para reemplazar en el HTML
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Cargar direcciones
const addressesFile = path.join(__dirname, 'addresses-to-geocode.json');
const addresses = JSON.parse(fs.readFileSync(addressesFile, 'utf8'));

// API Key de Google Maps (extraída de culiacan/index.html)
const API_KEY = 'AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk';

const results = [];
let index = 0;

console.log('🗺️  Geocodificando direcciones offline...\n');
console.log(`Total: ${addresses.length} direcciones\n`);

function geocodeNext() {
    if (index >= addresses.length) {
        // Todas completadas
        console.log('\n✅ Geocodificación completada!\n');

        // Guardar resultados
        const outputFile = path.join(__dirname, 'geocoded-coordinates.json');
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf8');

        console.log(`💾 Coordenadas guardadas en: geocoded-coordinates.json\n`);

        // Generar código JavaScript para reemplazar
        generateReplacementCode();

        return;
    }

    const item = addresses[index];
    const encodedAddress = encodeURIComponent(item.address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${API_KEY}`;

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);

                if (json.status === 'OK' && json.results[0]) {
                    const location = json.results[0].geometry.location;

                    results.push({
                        propertyName: item.propertyName,
                        address: item.address,
                        lat: location.lat,
                        lng: location.lng,
                        status: 'OK'
                    });

                    console.log(`✅ [${index + 1}/${addresses.length}] ${item.propertyName}`);
                    console.log(`   ${location.lat}, ${location.lng}`);
                } else {
                    results.push({
                        propertyName: item.propertyName,
                        address: item.address,
                        status: json.status,
                        error: true
                    });

                    console.log(`❌ [${index + 1}/${addresses.length}] ${item.propertyName} - ${json.status}`);
                }
            } catch (e) {
                console.log(`❌ [${index + 1}/${addresses.length}] ${item.propertyName} - Parse error`);
                results.push({
                    propertyName: item.propertyName,
                    address: item.address,
                    status: 'PARSE_ERROR',
                    error: true
                });
            }

            // Siguiente con delay de 200ms para respetar rate limit
            index++;
            setTimeout(geocodeNext, 200);
        });
    }).on('error', (e) => {
        console.log(`❌ [${index + 1}/${addresses.length}] ${item.propertyName} - Network error`);
        results.push({
            propertyName: item.propertyName,
            address: item.address,
            status: 'NETWORK_ERROR',
            error: true
        });

        index++;
        setTimeout(geocodeNext, 200);
    });
}

function generateReplacementCode() {
    console.log('📝 Generando código de reemplazo...\n');

    const codeFile = path.join(__dirname, 'replacement-code.js');
    let code = '// Código para reemplazar en culiacan/index.html\n';
    code += '// Reemplazar cada bloque de geocoder.geocode() con:\n\n';

    results.forEach((item, i) => {
        if (!item.error) {
            code += `// ${item.propertyName} - ${item.address}\n`;
            code += `const ${item.propertyName}Position = new google.maps.LatLng(${item.lat}, ${item.lng});\n`;
            code += `const ${item.propertyName}MarkerClass = createZillowPropertyMarker(${item.propertyName}Property, window.mapCuliacan);\n`;
            code += `const ${item.propertyName}Marker = new ${item.propertyName}MarkerClass(${item.propertyName}Position, window.mapCuliacan, ${item.propertyName}Property);\n`;
            code += `window.allCuliacanMarkers.push(${item.propertyName}Marker);\n`;
            code += `console.log('Marcador ${item.propertyName} creado en:', ${item.propertyName}Position.lat(), ${item.propertyName}Position.lng());\n\n`;
        }
    });

    fs.writeFileSync(codeFile, code, 'utf8');

    console.log(`💾 Código guardado en: replacement-code.js\n`);
    console.log('✅ Listo para reemplazar en culiacan/index.html\n');
}

// Iniciar
geocodeNext();
