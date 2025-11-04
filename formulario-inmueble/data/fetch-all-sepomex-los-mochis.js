/**
 * Script para obtener TODAS las colonias de SEPOMEX para Los Mochis
 * Rango de CPs: 81200 - 81299
 */

const https = require('https');
const fs = require('fs');

console.log('📮 EXTRACCIÓN COMPLETA SEPOMEX - LOS MOCHIS\n');
console.log('═'.repeat(70));

// Rango de CPs de Los Mochis según validación previa
const cpsLosMochis = [
    81200, 81203, 81204, 81205, 81206, 81207, 81208, 81209,
    81210, 81213, 81214, 81215, 81216, 81217, 81218, 81219,
    81220, 81223, 81224, 81225, 81226, 81227, 81228, 81229,
    81230, 81233, 81234, 81235, 81236, 81237, 81238, 81239,
    81240, 81243, 81244, 81245, 81246, 81247, 81248, 81249,
    81250, 81253, 81254, 81255, 81256, 81257, 81258, 81259,
    81260, 81263, 81264, 81265, 81266, 81267, 81268, 81269,
    81270, 81273, 81274, 81275, 81276, 81277, 81278, 81279,
    81280, 81283, 81284, 81285, 81286, 81287, 81288, 81289,
    81290, 81293, 81294, 81295, 81296, 81297, 81298, 81299
];

console.log(`\n📊 Consultando ${cpsLosMochis.length} códigos postales...`);
console.log('   (Esto puede tardar 1-2 minutos)\n');

const todasLasColonias = new Set();
const coloniasPorCP = {};
let cpsConsultados = 0;
let errores = 0;

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

                    response.zip_codes.forEach(entry => {
                        const colonia = entry.d_asenta;
                        todasLasColonias.add(colonia);
                        colonias.add(colonia);
                    });

                    coloniasPorCP[cp] = {
                        colonias: Array.from(colonias),
                        count: colonias.size
                    };

                    if (colonias.size > 0) {
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
    if (index >= cpsLosMochis.length) {
        // Terminado
        mostrarResultados();
        return;
    }

    const cp = cpsLosMochis[index];
    index++;

    consultarCP(cp, () => {
        // Pequeño delay entre requests
        setTimeout(procesarSiguiente, 100);
    });
}

function mostrarResultados() {
    console.log('\n\n═'.repeat(70));
    console.log('\n✅ CONSULTA COMPLETADA\n');

    console.log(`📊 ESTADÍSTICAS:\n`);
    console.log(`   CPs consultados: ${cpsConsultados}/${cpsLosMochis.length}`);
    console.log(`   Errores/timeouts: ${errores}`);
    console.log(`   Total colonias únicas SEPOMEX: ${todasLasColonias.size}\n`);

    // Convertir a array y ordenar
    const coloniasArray = Array.from(todasLasColonias).sort();

    console.log('═'.repeat(70));
    console.log('\n📋 TODAS LAS COLONIAS SEPOMEX:\n');

    coloniasArray.forEach((colonia, index) => {
        console.log(`   ${(index + 1).toString().padStart(3, ' ')}. ${colonia}`);
    });

    // Guardar a archivo JSON
    const output = {
        metadata: {
            origen: 'SEPOMEX - Servicio Postal Mexicano',
            municipio: 'Los Mochis (Ahome)',
            estado: 'Sinaloa',
            fecha: new Date().toISOString().split('T')[0],
            totalColonias: coloniasArray.length,
            rangoCPs: '81200 - 81299',
            totalCPs: cpsLosMochis.length
        },
        colonias: coloniasArray.map(nombre => ({
            tipo: 'COLONIA', // SEPOMEX no distingue tipos
            nombre: nombre,
            codigoPostal: null, // Se llenará después
            ciudad: 'Los Mochis',
            zona: 'Urbano',
            fuente: 'SEPOMEX'
        })),
        coloniasPorCP: coloniasPorCP
    };

    const filename = 'colonias-sepomex-los-mochis.json';
    fs.writeFileSync(filename, JSON.stringify(output, null, 2), 'utf8');

    console.log('\n═'.repeat(70));
    console.log(`\n💾 Archivo generado: ${filename}`);
    console.log(`   Tamaño: ${(fs.statSync(filename).size / 1024).toFixed(1)} KB\n`);

    // Cargar colonias INEGI para comparación
    try {
        const inegiData = JSON.parse(fs.readFileSync('colonias-los-mochis.json', 'utf8'));
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
            console.log('📋 COLONIAS EN SEPOMEX QUE NO ESTÁN EN INEGI:\n');
            faltantesEnINEGI.forEach((colonia, index) => {
                console.log(`   ${(index + 1).toString().padStart(3, ' ')}. ${colonia}`);
            });

            // Guardar faltantes
            const faltantesOutput = {
                metadata: {
                    origen: 'Diferencia SEPOMEX - INEGI',
                    fecha: new Date().toISOString().split('T')[0],
                    totalFaltantes: faltantesEnINEGI.length
                },
                coloniasFaltantes: faltantesEnINEGI
            };

            const faltantesFile = 'colonias-faltantes-inegi.json';
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
