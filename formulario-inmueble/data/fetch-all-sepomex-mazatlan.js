/**
 * Script para obtener TODAS las colonias de SEPOMEX para Mazatlán
 * Rango de CPs: 82000 - 82499 (Mazatlán, Sinaloa)
 * Código geoestadístico: 25/012
 */

const https = require('https');
const fs = require('fs');

console.log('📮 EXTRACCIÓN COMPLETA SEPOMEX - MAZATLÁN\n');
console.log('═'.repeat(70));

// Rango de CPs de Mazatlán
// Basado en rangos oficiales de SEPOMEX para Mazatlán, Sinaloa
const cpsMazatlan = [];
for (let cp = 82000; cp <= 82499; cp++) {
    cpsMazatlan.push(cp);
}

console.log(`\n📊 Consultando ${cpsMazatlan.length} códigos postales...`);
console.log('   Rango: 82000 - 82499');
console.log('   (Esto puede tardar 3-5 minutos)\n');

const todasLasColonias = new Set();
const coloniasPorCP = {};
let cpsConsultados = 0;
let errores = 0;
let cpsConDatos = 0;

function consultarCP(cp, callback) {
    const options = {
        hostname: 'sepomex.icalialabs.com',
        port: 443,
        path: `/api/v1/zip_codes?zip_code=${cp}`,
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => { data += chunk; });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);

                if (response.zip_codes && response.zip_codes.length > 0) {
                    const colonias = new Set();
                    let esMazatlan = false;

                    response.zip_codes.forEach(entry => {
                        // Verificar que sea Mazatlán
                        if (entry.d_mnpio && entry.d_mnpio.toUpperCase().includes('MAZATL')) {
                            esMazatlan = true;
                            const colonia = entry.d_asenta;
                            todasLasColonias.add(colonia);
                            colonias.add(colonia);
                        }
                    });

                    if (esMazatlan && colonias.size > 0) {
                        coloniasPorCP[cp] = {
                            colonias: Array.from(colonias),
                            count: colonias.size
                        };
                        cpsConDatos++;
                        process.stdout.write(`✓`);
                    } else {
                        process.stdout.write(`·`);
                    }
                } else {
                    process.stdout.write(`·`);
                }

                cpsConsultados++;
                callback();

            } catch (error) {
                errores++;
                process.stdout.write(`✗`);
                cpsConsultados++;
                callback();
            }
        });
    });

    req.on('error', (error) => {
        errores++;
        process.stdout.write(`✗`);
        cpsConsultados++;
        callback();
    });

    req.setTimeout(5000, () => {
        req.destroy();
        errores++;
        process.stdout.write(`T`);
        cpsConsultados++;
        callback();
    });

    req.end();
}

// Procesar CPs con delay para evitar rate limiting
let index = 0;

function procesarSiguiente() {
    if (index >= cpsMazatlan.length) {
        // Terminado
        mostrarResultados();
        return;
    }

    const cp = cpsMazatlan[index];
    index++;

    // Newline cada 50 CPs para legibilidad
    if (index % 50 === 0) {
        process.stdout.write(`\n`);
    }

    consultarCP(cp, () => {
        // Pequeño delay entre requests
        setTimeout(procesarSiguiente, 120);
    });
}

function mostrarResultados() {
    console.log('\n\n═'.repeat(70));
    console.log('\n✅ CONSULTA COMPLETADA\n');

    console.log(`📊 ESTADÍSTICAS:\n`);
    console.log(`   CPs consultados: ${cpsConsultados}/${cpsMazatlan.length}`);
    console.log(`   CPs con datos: ${cpsConDatos}`);
    console.log(`   Errores/timeouts: ${errores}`);
    console.log(`   Total colonias únicas SEPOMEX: ${todasLasColonias.size}\n`);

    // Convertir a array y ordenar
    const coloniasArray = Array.from(todasLasColonias).sort();

    console.log('═'.repeat(70));
    console.log('\n📋 TODAS LAS COLONIAS SEPOMEX (primeras 50):\n');

    coloniasArray.slice(0, 50).forEach((colonia, index) => {
        console.log(`   ${(index + 1).toString().padStart(3, ' ')}. ${colonia}`);
    });

    if (coloniasArray.length > 50) {
        console.log(`   ... y ${coloniasArray.length - 50} más\n`);
    }

    // Guardar a archivo JSON
    const output = {
        metadata: {
            origen: 'SEPOMEX - Servicio Postal Mexicano',
            municipio: 'Mazatlán',
            estado: 'Sinaloa',
            codigoGeoestadistico: '25/012',
            fecha: new Date().toISOString().split('T')[0],
            totalColonias: coloniasArray.length,
            rangoCPs: '82000 - 82499',
            totalCPsConsultados: cpsMazatlan.length,
            cpsConDatos: cpsConDatos
        },
        colonias: coloniasArray.map(nombre => ({
            tipo: 'COLONIA', // SEPOMEX no distingue tipos
            nombre: nombre,
            codigoPostal: null, // Se llenará después con el mapeo correcto
            ciudad: 'Mazatlán',
            zona: 'Urbano',
            fuente: 'SEPOMEX'
        })),
        coloniasPorCP: coloniasPorCP
    };

    const filename = 'colonias-sepomex-mazatlan.json';
    fs.writeFileSync(filename, JSON.stringify(output, null, 2), 'utf8');

    console.log('═'.repeat(70));
    console.log(`\n💾 Archivo generado: ${filename}`);
    console.log(`   Tamaño: ${(fs.statSync(filename).size / 1024).toFixed(1)} KB\n`);

    // Cargar colonias INEGI para comparación
    try {
        const inegiData = JSON.parse(fs.readFileSync('colonias-mazatlan.json', 'utf8'));
        const inegiColonias = new Set(inegiData.colonias.map(c => c.nombre.toUpperCase()));

        const faltantesEnINEGI = coloniasArray.filter(c =>
            !inegiColonias.has(c.toUpperCase())
        );

        console.log('═'.repeat(70));
        console.log('\n🔍 COMPARACIÓN SEPOMEX vs INEGI:\n');
        console.log(`   Colonias INEGI: ${inegiData.colonias.length}`);
        console.log(`   Colonias SEPOMEX: ${coloniasArray.length}`);
        console.log(`   Faltantes en INEGI: ${faltantesEnINEGI.length}\n`);

        if (faltantesEnINEGI.length > 0) {
            console.log('📋 COLONIAS EN SEPOMEX QUE NO ESTÁN EN INEGI (primeras 30):\n');
            faltantesEnINEGI.slice(0, 30).forEach((colonia, index) => {
                console.log(`   ${(index + 1).toString().padStart(3, ' ')}. ${colonia}`);
            });

            if (faltantesEnINEGI.length > 30) {
                console.log(`   ... y ${faltantesEnINEGI.length - 30} más\n`);
            }

            // Guardar faltantes
            const faltantesOutput = {
                metadata: {
                    origen: 'Diferencia SEPOMEX - INEGI',
                    fecha: new Date().toISOString().split('T')[0],
                    totalFaltantes: faltantesEnINEGI.length
                },
                coloniasFaltantes: faltantesEnINEGI
            };

            const faltantesFile = 'colonias-faltantes-inegi-mazatlan.json';
            fs.writeFileSync(faltantesFile, JSON.stringify(faltantesOutput, null, 2), 'utf8');

            console.log(`\n💾 Archivo faltantes: ${faltantesFile}\n`);
        }

        console.log('═'.repeat(70));

    } catch (error) {
        console.log('\n⚠️  No se pudo comparar con INEGI:', error.message);
    }

    console.log('\n✅ PROCESO COMPLETADO\n');
    console.log('═'.repeat(70));
}

// Iniciar proceso
procesarSiguiente();
