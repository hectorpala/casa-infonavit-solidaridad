/**
 * Script para obtener TODAS las colonias de SEPOMEX para García, Nuevo León
 * Rango de CPs: 66000 - 66999 (García, Nuevo León)
 * Código geoestadístico: 19/020
 */

const https = require('https');
const fs = require('fs');

console.log('📮 EXTRACCIÓN COMPLETA SEPOMEX - GARCÍA, NUEVO LEÓN\n');
console.log('═'.repeat(70));

// Rango de CPs de García, Nuevo León
// Basado en rangos oficiales de SEPOMEX para García
const cpsGarcia = [];
for (let cp = 66000; cp <= 66999; cp++) {
    cpsGarcia.push(cp);
}

console.log(`\n📊 Consultando ${cpsGarcia.length} códigos postales...`);
console.log('   Rango: 66000 - 66999');
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
                    let esGarcia = false;

                    response.zip_codes.forEach(entry => {
                        // Verificar que sea García, Nuevo León
                        if (entry.d_mnpio && entry.d_mnpio.toUpperCase().includes('GARCÍA') &&
                            entry.d_estado && entry.d_estado.toUpperCase().includes('NUEVO LEÓN')) {
                            esGarcia = true;
                            const colonia = entry.d_asenta;
                            todasLasColonias.add(colonia);
                            colonias.add(colonia);
                        }
                    });

                    if (esGarcia && colonias.size > 0) {
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
    if (index >= cpsGarcia.length) {
        // Terminado
        mostrarResultados();
        return;
    }

    const cp = cpsGarcia[index];
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
    console.log(`   CPs consultados: ${cpsConsultados}/${cpsGarcia.length}`);
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
            municipio: 'García',
            estado: 'Nuevo León',
            codigoGeoestadistico: '19/020',
            fecha: new Date().toISOString().split('T')[0],
            totalColonias: coloniasArray.length,
            rangoCPs: '66000 - 66999',
            totalCPsConsultados: cpsGarcia.length,
            cpsConDatos: cpsConDatos
        },
        colonias: coloniasArray.map(nombre => ({
            tipo: 'COLONIA', // SEPOMEX no distingue tipos
            nombre: nombre,
            codigoPostal: null, // Se llenará después con el mapeo correcto
            ciudad: 'García',
            estado: 'Nuevo León',
            zona: 'Urbano',
            fuente: 'SEPOMEX'
        })),
        coloniasPorCP: coloniasPorCP
    };

    const filename = 'colonias-sepomex-garcia.json';
    fs.writeFileSync(filename, JSON.stringify(output, null, 2), 'utf8');

    console.log('═'.repeat(70));
    console.log(`\n💾 Archivo generado: ${filename}`);
    console.log(`   Tamaño: ${(fs.statSync(filename).size / 1024).toFixed(1)} KB\n`);

    console.log('═'.repeat(70));
    console.log('\n✅ PROCESO COMPLETADO\n');
    console.log('═'.repeat(70));
}

// Iniciar proceso
procesarSiguiente();
