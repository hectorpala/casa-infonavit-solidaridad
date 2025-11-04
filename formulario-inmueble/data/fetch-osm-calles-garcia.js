/**
 * Script para obtener TODAS las calles de OpenStreetMap de García, Nuevo León
 */

const https = require('https');
const fs = require('fs');

console.log('🗺️  EXTRACCIÓN COMPLETA OSM - CALLES GARCÍA, NUEVO LEÓN\n');
console.log('═'.repeat(70));

// Bbox de García, Nuevo León (zona urbana completa)
// Coordenadas aproximadas del municipio
const bbox = {
    south: 25.7500,
    west: -100.6500,
    north: 25.8500,
    east: -100.5000
};

console.log('📍 ÁREA DE CONSULTA OSM:');
console.log(`   Bbox: ${bbox.south}, ${bbox.west}, ${bbox.north}, ${bbox.east}`);
console.log('   (Toda la zona urbana de García, N.L.)\n');

// Query Overpass API
const query = `[out:json][timeout:30];
(
  way["highway"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out body;
>;
out skel qt;`;

const options = {
    hostname: 'overpass-api.de',
    port: 443,
    path: '/api/interpreter',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength('data=' + encodeURIComponent(query))
    }
};

console.log('═'.repeat(70));
console.log('\n📥 Consultando Overpass API de OpenStreetMap...');
console.log('   (Esto puede tardar 15-30 segundos)\n');

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => { data += chunk; });

    res.on('end', () => {
        try {
            const osmData = JSON.parse(data);

            if (!osmData.elements || osmData.elements.length === 0) {
                console.log('⚠️  No se obtuvieron datos de OSM\n');
                return;
            }

            console.log('✅ Datos OSM obtenidos!\n');
            console.log('═'.repeat(70));

            // Extraer nombres únicos de calles
            const osmCallesSet = new Set();
            osmData.elements.forEach(element => {
                if (element.tags && element.tags.name) {
                    osmCallesSet.add(element.tags.name);
                }
            });

            const osmCallesArray = Array.from(osmCallesSet).sort();

            console.log('\n📊 CALLES OPENSTREETMAP:\n');
            console.log(`   Total calles únicas: ${osmCallesArray.length}\n`);

            console.log('═'.repeat(70));
            console.log('\n📋 MUESTRA DE CALLES OSM (primeras 50):\n');

            osmCallesArray.slice(0, 50).forEach((calle, index) => {
                console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${calle}`);
            });

            if (osmCallesArray.length > 50) {
                console.log(`   ... y ${osmCallesArray.length - 50} más\n`);
            }

            // Clasificar por tipo
            const tiposCount = {
                'Avenida': 0,
                'Boulevard': 0,
                'Calle': 0,
                'Privada': 0,
                'Circuito': 0,
                'Andador': 0,
                'Callejón': 0,
                'Retorno': 0,
                'Otros': 0
            };

            osmCallesArray.forEach(calle => {
                const calleUpper = calle.toUpperCase();
                if (calleUpper.includes('AV') || calleUpper.includes('AVENIDA')) {
                    tiposCount['Avenida']++;
                } else if (calleUpper.includes('BOULEVARD') || calleUpper.includes('BLVD')) {
                    tiposCount['Boulevard']++;
                } else if (calleUpper.includes('PRIVADA') || calleUpper.includes('PRIV')) {
                    tiposCount['Privada']++;
                } else if (calleUpper.includes('CIRCUITO')) {
                    tiposCount['Circuito']++;
                } else if (calleUpper.includes('ANDADOR')) {
                    tiposCount['Andador']++;
                } else if (calleUpper.includes('CALLEJÓN') || calleUpper.includes('CALLEJON')) {
                    tiposCount['Callejón']++;
                } else if (calleUpper.includes('RETORNO')) {
                    tiposCount['Retorno']++;
                } else if (calleUpper.includes('CALLE')) {
                    tiposCount['Calle']++;
                } else {
                    tiposCount['Otros']++;
                }
            });

            // Generar lista con prefijos
            const callesConPrefijo = osmCallesArray.map(calle => {
                const calleUpper = calle.toUpperCase();
                if (calleUpper.startsWith('AV') || calleUpper.startsWith('AVENIDA')) {
                    return calle;
                } else if (calleUpper.startsWith('BOULEVARD') || calleUpper.startsWith('BLVD')) {
                    return calle;
                } else if (calleUpper.startsWith('PRIVADA') || calleUpper.startsWith('PRIV')) {
                    return calle;
                } else if (calleUpper.startsWith('CIRCUITO')) {
                    return calle;
                } else if (calleUpper.startsWith('ANDADOR')) {
                    return calle;
                } else if (calleUpper.startsWith('CALLEJÓN') || calleUpper.startsWith('CALLEJON')) {
                    return calle;
                } else if (calleUpper.startsWith('RETORNO')) {
                    return calle;
                } else if (calleUpper.startsWith('CALLE')) {
                    return calle;
                } else {
                    // Agregar prefijo "Calle" si no tiene ninguno
                    return `Calle ${calle}`;
                }
            });

            const archivoOSM = {
                metadata: {
                    origen: 'OpenStreetMap - Vialidades mapeadas por comunidad',
                    municipio: 'García',
                    estado: 'Nuevo León',
                    codigoGeoestadistico: '19/020',
                    fecha: new Date().toISOString().split('T')[0],
                    totalCalles: callesConPrefijo.length,
                    bbox: bbox,
                    nota: 'Vialidades extraídas de OpenStreetMap Overpass API',
                    tipos: tiposCount
                },
                calles: callesConPrefijo.sort((a, b) => a.localeCompare(b))
            };

            const outputFile = 'calles-osm-garcia.json';
            fs.writeFileSync(outputFile, JSON.stringify(archivoOSM, null, 2), 'utf8');

            console.log('═'.repeat(70));
            console.log(`\n💾 ARCHIVO GENERADO: ${outputFile}`);
            console.log(`   Tamaño: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB\n`);

            console.log('═'.repeat(70));
            console.log('\n📊 ESTADÍSTICAS FINALES:\n');
            console.log(`   Total calles OSM: ${osmCallesArray.length}\n`);

            console.log('📊 Distribución por tipo:\n');
            Object.entries(tiposCount).forEach(([tipo, count]) => {
                console.log(`   ${tipo}: ${count}`);
            });

            console.log('\n═'.repeat(70));
            console.log('\n✅ EXTRACCIÓN COMPLETADA\n');
            console.log('═'.repeat(70));

        } catch (error) {
            console.log('⚠️  Error al procesar datos OSM:', error.message);
        }
    });
});

req.on('error', (error) => {
    console.log('⚠️  Error de conexión con OSM:', error.message);
});

req.write('data=' + encodeURIComponent(query));
req.end();
