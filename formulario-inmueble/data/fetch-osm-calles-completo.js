/**
 * Script para obtener TODAS las calles de OpenStreetMap de Los Mochis
 * y fusionarlas con las calles de INEGI
 */

const https = require('https');
const fs = require('fs');

console.log('🗺️  EXTRACCIÓN COMPLETA OSM - CALLES LOS MOCHIS\n');
console.log('═'.repeat(70));

// Cargar calles INEGI
const inegiData = JSON.parse(fs.readFileSync('calles-los-mochis.json', 'utf8'));
console.log(`\n📊 Calles INEGI: ${inegiData.calles.length}\n`);

// Bbox de Los Mochis (zona urbana completa)
const bbox = {
    south: 25.7000,
    west: -109.1000,
    north: 25.9000,
    east: -108.9000
};

console.log('📍 ÁREA DE CONSULTA OSM:');
console.log(`   Bbox: ${bbox.south}, ${bbox.west}, ${bbox.north}, ${bbox.east}`);
console.log('   (Toda la zona urbana de Los Mochis)\n');

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

            // Normalizar calles INEGI para comparación
            const inegiNormalizadas = new Set();
            inegiData.calles.forEach(calle => {
                // Quitar prefijos como "Calle ", "Av. ", "Blvd. "
                const normalizada = calle
                    .replace(/^(Calle|Av\.|Avenida|Blvd\.|Boulevard|Privada|Callejón)\s+/i, '')
                    .toUpperCase()
                    .trim();
                inegiNormalizadas.add(normalizada);
            });

            // Encontrar calles que SOLO están en OSM
            const callesNuevas = [];
            const callesCoincidentes = [];

            osmCallesArray.forEach(osmCalle => {
                const osmNormalizada = osmCalle.toUpperCase().trim();

                // Buscar coincidencia en INEGI
                let encontrada = false;
                for (let inegiNorm of inegiNormalizadas) {
                    if (osmNormalizada === inegiNorm ||
                        osmNormalizada.includes(inegiNorm) ||
                        inegiNorm.includes(osmNormalizada)) {
                        encontrada = true;
                        callesCoincidentes.push(osmCalle);
                        break;
                    }
                }

                if (!encontrada) {
                    callesNuevas.push(osmCalle);
                }
            });

            console.log('═'.repeat(70));
            console.log('\n🔍 ANÁLISIS DE COBERTURA:\n');
            console.log(`   Calles en INEGI: ${inegiData.calles.length}`);
            console.log(`   Calles en OSM: ${osmCallesArray.length}`);
            console.log(`   Coincidencias: ${callesCoincidentes.length}`);
            console.log(`   NUEVAS (solo OSM): ${callesNuevas.length}\n`);

            console.log('═'.repeat(70));
            console.log('\n📋 MUESTRA DE CALLES NUEVAS (primeras 30):\n');

            callesNuevas.slice(0, 30).forEach((calle, index) => {
                console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${calle}`);
            });

            if (callesNuevas.length > 30) {
                console.log(`   ... y ${callesNuevas.length - 30} más\n`);
            }

            // Crear archivo fusionado
            const todasLasCalles = [
                ...inegiData.calles,
                ...callesNuevas.map(c => `Calle ${c}`) // Agregar prefijo genérico
            ];

            todasLasCalles.sort((a, b) => a.localeCompare(b));

            const archivoFusionado = {
                metadata: {
                    origen: 'INEGI + OpenStreetMap (Fusionado)',
                    municipio: 'Los Mochis (Ahome)',
                    estado: 'Sinaloa',
                    codigoGeoestadistico: '25/011',
                    fecha: new Date().toISOString().split('T')[0],
                    totalCalles: todasLasCalles.length,
                    fuentes: {
                        INEGI: {
                            calles: inegiData.calles.length,
                            descripcion: 'Vialidades oficiales del Marco Geoestadístico Nacional'
                        },
                        OpenStreetMap: {
                            calles: callesNuevas.length,
                            descripcion: 'Vialidades adicionales mapeadas por la comunidad'
                        }
                    },
                    nota: 'Base de datos completa con vialidades oficiales (INEGI) y comunitarias (OSM)',
                    tipos: inegiData.metadata.tipos
                },
                calles: todasLasCalles
            };

            const outputFile = 'calles-los-mochis-completo.json';
            fs.writeFileSync(outputFile, JSON.stringify(archivoFusionado, null, 2), 'utf8');

            console.log('═'.repeat(70));
            console.log(`\n💾 ARCHIVO GENERADO: ${outputFile}`);
            console.log(`   Tamaño: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB\n`);

            console.log('═'.repeat(70));
            console.log('\n📊 ESTADÍSTICAS FINALES:\n');
            console.log(`   INEGI original: ${inegiData.calles.length} calles`);
            console.log(`   OSM nuevas: ${callesNuevas.length} calles`);
            console.log(`   ─────────────────────────────────────────`);
            console.log(`   TOTAL FUSIONADO: ${todasLasCalles.length} calles ✅\n`);

            console.log('═'.repeat(70));
            console.log('\n💡 PRÓXIMO PASO:\n');
            console.log('   Reemplazar calles-los-mochis.json con calles-los-mochis-completo.json');
            console.log('   Comando: cp calles-los-mochis-completo.json calles-los-mochis.json\n');
            console.log('═'.repeat(70));

            // Guardar solo las calles nuevas
            const callesNuevasOutput = {
                metadata: {
                    origen: 'OpenStreetMap (no en INEGI)',
                    total: callesNuevas.length,
                    fecha: new Date().toISOString().split('T')[0]
                },
                callesNuevas: callesNuevas
            };

            fs.writeFileSync('calles-osm-nuevas.json', JSON.stringify(callesNuevasOutput, null, 2), 'utf8');
            console.log(`\n💾 Archivo adicional: calles-osm-nuevas.json (${callesNuevas.length} calles)\n`);
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
