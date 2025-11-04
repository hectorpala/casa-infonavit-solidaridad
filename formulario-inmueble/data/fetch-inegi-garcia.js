/**
 * Script para obtener colonias y vialidades de INEGI para García, Nuevo León
 * Clave geoestadística: 19/018 (Estado 19 = Nuevo León, Municipio 018 = García)
 * API: https://gaia.inegi.org.mx/wscatgeo/v2/
 */

const https = require('https');
const fs = require('fs');

console.log('🏛️  EXTRACCIÓN INEGI - GARCÍA, NUEVO LEÓN\n');
console.log('═'.repeat(70));
console.log('\n📍 Clave geoestadística: 19/018');
console.log('   Estado: 19 (Nuevo León)');
console.log('   Municipio: 018 (García)\n');

// Variables para almacenar datos
let colonias = [];
let calles = [];

// Función para consultar asentamientos (colonias)
function fetchAsentamientos() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'gaia.inegi.org.mx',
            port: 443,
            path: '/wscatgeo/v2/asentamiento/19/018',
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

        console.log('═'.repeat(70));
        console.log('\n📥 Consultando asentamientos (colonias) de INEGI...\n');

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => { data += chunk; });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);

                    if (response.datos && Array.isArray(response.datos)) {
                        colonias = response.datos.map(item => ({
                            tipo: item.tipo_asentamiento || 'COLONIA',
                            nombre: item.nombre_asentamiento,
                            codigoPostal: item.codigo_postal || null,
                            ciudad: 'García',
                            estado: 'Nuevo León',
                            zona: item.ambito || 'Urbano',
                            fuente: 'INEGI'
                        }));

                        console.log(`✅ Asentamientos obtenidos: ${colonias.length}\n`);
                        resolve();
                    } else {
                        console.log('⚠️  No se obtuvieron asentamientos de INEGI\n');
                        resolve();
                    }
                } catch (error) {
                    console.log('❌ Error al procesar asentamientos:', error.message);
                    resolve();
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Error de conexión (asentamientos):', error.message);
            resolve();
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.log('⏱️  Timeout en asentamientos');
            resolve();
        });

        req.end();
    });
}

// Función para consultar vialidades (calles)
function fetchVialidades() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'gaia.inegi.org.mx',
            port: 443,
            path: '/wscatgeo/v2/vialidades/19/018',
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

        console.log('═'.repeat(70));
        console.log('\n📥 Consultando vialidades (calles) de INEGI...\n');

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => { data += chunk; });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);

                    if (response.datos && Array.isArray(response.datos)) {
                        const callesSet = new Set();

                        response.datos.forEach(item => {
                            const tipo = item.tipo_vialidad || 'Calle';
                            const nombre = item.nombre_vialidad;
                            const calleCompleta = `${tipo} ${nombre}`;
                            callesSet.add(calleCompleta);
                        });

                        calles = Array.from(callesSet).sort((a, b) => a.localeCompare(b));

                        console.log(`✅ Vialidades obtenidas: ${calles.length}\n`);
                        resolve();
                    } else {
                        console.log('⚠️  No se obtuvieron vialidades de INEGI\n');
                        resolve();
                    }
                } catch (error) {
                    console.log('❌ Error al procesar vialidades:', error.message);
                    resolve();
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Error de conexión (vialidades):', error.message);
            resolve();
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.log('⏱️  Timeout en vialidades');
            resolve();
        });

        req.end();
    });
}

// Ejecutar ambas consultas
async function main() {
    await fetchAsentamientos();
    await fetchVialidades();

    console.log('═'.repeat(70));
    console.log('\n📊 ESTADÍSTICAS FINALES INEGI:\n');
    console.log(`   Colonias: ${colonias.length}`);
    console.log(`   Calles: ${calles.length}\n`);

    // Guardar colonias
    if (colonias.length > 0) {
        // Contar tipos
        const tiposCount = {};
        colonias.forEach(col => {
            tiposCount[col.tipo] = (tiposCount[col.tipo] || 0) + 1;
        });

        const coloniasOutput = {
            metadata: {
                origen: 'INEGI - Marco Geoestadístico Nacional',
                municipio: 'García',
                estado: 'Nuevo León',
                codigoGeoestadistico: '19/018',
                fecha: new Date().toISOString().split('T')[0],
                totalColonias: colonias.length,
                nota: 'Asentamientos oficiales del Marco Geoestadístico Nacional',
                tipos: tiposCount
            },
            colonias: colonias
        };

        fs.writeFileSync('colonias-inegi-garcia.json', JSON.stringify(coloniasOutput, null, 2), 'utf8');
        console.log('💾 Archivo generado: colonias-inegi-garcia.json');
        console.log(`   Tamaño: ${(fs.statSync('colonias-inegi-garcia.json').size / 1024).toFixed(1)} KB\n`);
    }

    // Guardar calles
    if (calles.length > 0) {
        // Contar tipos
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

        calles.forEach(calle => {
            if (calle.includes('Avenida') || calle.includes('Av.')) {
                tiposCount['Avenida']++;
            } else if (calle.includes('Boulevard') || calle.includes('Blvd')) {
                tiposCount['Boulevard']++;
            } else if (calle.includes('Privada')) {
                tiposCount['Privada']++;
            } else if (calle.includes('Circuito')) {
                tiposCount['Circuito']++;
            } else if (calle.includes('Andador')) {
                tiposCount['Andador']++;
            } else if (calle.includes('Callejón')) {
                tiposCount['Callejón']++;
            } else if (calle.includes('Retorno')) {
                tiposCount['Retorno']++;
            } else if (calle.includes('Calle')) {
                tiposCount['Calle']++;
            } else {
                tiposCount['Otros']++;
            }
        });

        const callesOutput = {
            metadata: {
                origen: 'INEGI - Catálogo de Vialidades',
                municipio: 'García',
                estado: 'Nuevo León',
                codigoGeoestadistico: '19/018',
                fecha: new Date().toISOString().split('T')[0],
                totalCalles: calles.length,
                nota: 'Vialidades oficiales del Catálogo Nacional',
                tipos: tiposCount
            },
            calles: calles
        };

        fs.writeFileSync('calles-inegi-garcia.json', JSON.stringify(callesOutput, null, 2), 'utf8');
        console.log('💾 Archivo generado: calles-inegi-garcia.json');
        console.log(`   Tamaño: ${(fs.statSync('calles-inegi-garcia.json').size / 1024).toFixed(1)} KB\n`);
    }

    console.log('═'.repeat(70));
    console.log('\n✅ EXTRACCIÓN INEGI COMPLETADA\n');
    console.log('═'.repeat(70));
}

main();
