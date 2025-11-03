#!/usr/bin/env node

/**
 * Script para agregar throttling a las llamadas de geocoder
 * Convierte 62 llamadas síncronas en una cola con delay de 200ms
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'culiacan/index.html');

console.log('🔧 Agregando throttling al geocoder en culiacan/index.html...\n');

let html = fs.readFileSync(filePath, 'utf8');

// Buscar dónde comienzan las llamadas al geocoder
const geocoderStartPattern = /\/\/ Geocodificar solidaridad\s+geocoder\.geocode/;
const match = html.match(geocoderStartPattern);

if (!match) {
    console.log('❌ No se encontró el inicio de las llamadas al geocoder.\n');
    process.exit(1);
}

console.log('✅ Encontradas llamadas al geocoder.\n');

// Extraer todas las llamadas al geocoder
const geocodePattern = /\/\/ Geocodificar (\w+)\s+geocoder\.geocode\(\s*\{\s*address:\s*"([^"]+)"\s*\},\s*function\(results, status\)\s*\{[\s\S]*?console\.log\('Marcador \1 creado en:[^}]+\}\s*\}\);/g;

const geocodeCalls = [];
let geocodeMatch;

while ((geocodeMatch = geocodePattern.exec(html)) !== null) {
    geocodeCalls.push({
        propertyName: geocodeMatch[1],
        address: geocodeMatch[2],
        fullMatch: geocodeMatch[0]
    });
}

console.log(`📊 Llamadas al geocoder encontradas: ${geocodeCalls.length}\n`);

if (geocodeCalls.length === 0) {
    console.log('⚠️  No se encontraron llamadas al geocoder con el patrón esperado.\n');
    process.exit(0);
}

// Generar código throttled
const throttledCode = `
            // ═══════════════════════════════════════════════════════════════
            // THROTTLED GEOCODING - Prevenir OVER_QUERY_LIMIT
            // ═══════════════════════════════════════════════════════════════

            // Cola de geocodificación con throttling (200ms entre llamadas)
            const geocodeQueue = [
${geocodeCalls.map(call => `                { name: '${call.propertyName}', address: "${call.address}", property: ${call.propertyName}Property }`).join(',\n')}
            ];

            // Función para procesar la cola con delay
            function processGeocodeQueue(queue, delay = 200) {
                let index = 0;

                function processNext() {
                    if (index >= queue.length) {
                        console.log(\`✅ Geocodificación completa: \${window.allCuliacanMarkers.length} marcadores\`);

                        // Actualizar contador de propiedades
                        const countElement = document.querySelector('.property-count');
                        if (countElement && window.allCuliacanMarkers) {
                            countElement.textContent = \`\${window.allCuliacanMarkers.length} propiedades\`;
                        }

                        return;
                    }

                    const item = queue[index];

                    geocoder.geocode({ address: item.address }, function(results, status) {
                        if (status === 'OK' && results[0]) {
                            const position = results[0].geometry.location;
                            const CustomMarkerClass = createZillowPropertyMarker(item.property, window.mapCuliacan);
                            const marker = new CustomMarkerClass(position, window.mapCuliacan, item.property);
                            window.allCuliacanMarkers.push(marker);
                            console.log(\`✅ [\${index + 1}/\${queue.length}] Marcador \${item.name} creado en: \${position.lat()}, \${position.lng()}\`);
                        } else {
                            console.error(\`❌ [\${index + 1}/\${queue.length}] Geocode error \${item.name}: \${status}\`);
                        }

                        // Procesar siguiente después del delay
                        index++;
                        setTimeout(processNext, delay);
                    });
                }

                // Iniciar procesamiento
                console.log(\`🗺️  Iniciando geocodificación throttled: \${queue.length} propiedades (200ms delay)\`);
                processNext();
            }

            // Iniciar cola de geocodificación
            processGeocodeQueue(geocodeQueue);
`;

// Reemplazar todas las llamadas al geocoder con el código throttled
let newHtml = html;

// Encontrar el inicio y fin del bloque de geocoder
const firstGeocodeIndex = newHtml.indexOf(geocodeCalls[0].fullMatch);
const lastGeocodeIndex = newHtml.indexOf(geocodeCalls[geocodeCalls.length - 1].fullMatch);
const lastGeocodeEnd = lastGeocodeIndex + geocodeCalls[geocodeCalls.length - 1].fullMatch.length;

if (firstGeocodeIndex !== -1 && lastGeocodeEnd > firstGeocodeIndex) {
    // Reemplazar todo el bloque
    newHtml = newHtml.slice(0, firstGeocodeIndex) + throttledCode + newHtml.slice(lastGeocodeEnd);

    console.log('✅ Código throttled insertado.\n');
    console.log('📝 Características:\n');
    console.log('   • Cola de geocodificación: 200ms entre llamadas');
    console.log('   • Previene OVER_QUERY_LIMIT de Google Maps');
    console.log('   • Progreso en consola: [X/62] por cada propiedad');
    console.log('   • Actualiza contador al finalizar\n');

    // Guardar
    fs.writeFileSync(filePath, newHtml, 'utf8');

    const originalSize = html.length;
    const newSize = newHtml.length;

    console.log(`📊 Estadísticas:\n`);
    console.log(`   Tamaño original: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Tamaño nuevo: ${(newSize / 1024).toFixed(2)} KB`);
    console.log(`   Diferencia: ${((newSize - originalSize) / 1024).toFixed(2)} KB\n`);
    console.log(`✅ Archivo guardado: culiacan/index.html\n`);
    console.log(`⏱️  Tiempo estimado de carga: ${geocodeCalls.length * 0.2}s (~${Math.ceil(geocodeCalls.length * 0.2 / 60)} min)\n`);
} else {
    console.log('❌ No se pudo localizar el bloque de geocoder para reemplazar.\n');
}
