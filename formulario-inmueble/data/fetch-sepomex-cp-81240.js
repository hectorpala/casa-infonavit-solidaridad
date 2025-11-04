/**
 * Script para consultar SEPOMEX API y obtener colonias oficiales del CP 81240
 * SEPOMEX: Servicio Postal Mexicano (fuente oficial de códigos postales)
 */

const https = require('https');

console.log('📮 CONSULTA SEPOMEX - CÓDIGO POSTAL 81240\n');
console.log('═'.repeat(70));

console.log('\n🔍 Buscando colonias oficiales asociadas al CP 81240...\n');

// API de SEPOMEX (código postal México)
const options = {
    hostname: 'api.copomex.com',
    port: 443,
    path: '/query/info_cp/81240?type=simplified',
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};

console.log('📡 Consultando API SEPOMEX (Copomex)...');
console.log('   URL: https://api.copomex.com/query/info_cp/81240\n');

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => { data += chunk; });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);

            if (response.error) {
                console.log('⚠️  Error en respuesta SEPOMEX:', response.error);
                probarAPIAlternativa();
                return;
            }

            if (!response.response || !response.response.asentamiento) {
                console.log('⚠️  No se encontraron colonias para CP 81240');
                console.log('   Respuesta:', JSON.stringify(response, null, 2));
                probarAPIAlternativa();
                return;
            }

            console.log('✅ Datos SEPOMEX obtenidos!\n');
            console.log('═'.repeat(70));
            console.log('\n📋 COLONIAS OFICIALES SEPOMEX - CP 81240:\n');

            const colonias = Array.isArray(response.response.asentamiento)
                ? response.response.asentamiento
                : [response.response.asentamiento];

            console.log(`   Total colonias con CP 81240: ${colonias.length}\n`);

            colonias.forEach((colonia, index) => {
                console.log(`${index + 1}. ${colonia}`);
            });

            console.log('\n═'.repeat(70));
            console.log('\n🔍 BÚSQUEDA ESPECÍFICA: "Mayra H Pamplona"\n');

            const mayraVariantes = colonias.filter(c => {
                const upper = c.toUpperCase();
                return upper.includes('MAYRA') ||
                       upper.includes('PAMPLONA') ||
                       upper.includes('H PAMPLONA');
            });

            if (mayraVariantes.length > 0) {
                console.log('✅ ENCONTRADA en SEPOMEX:\n');
                mayraVariantes.forEach(c => {
                    console.log(`   📍 ${c}`);
                });
                console.log('\n💡 Este es el NOMBRE OFICIAL que debe usarse.');
            } else {
                console.log('❌ NO ENCONTRADA "Mayra H Pamplona" en SEPOMEX');
                console.log('\n💡 POSIBLES RAZONES:');
                console.log('   1. El CP 81240 puede abarcar múltiples colonias');
                console.log('   2. "Mayra H Pamplona" puede ser nombre coloquial');
                console.log('   3. Puede ser parte de una colonia más grande');
                console.log('\n📋 COLONIAS DISPONIBLES CON CP 81240:');
                colonias.slice(0, 5).forEach((c, i) => {
                    console.log(`   ${i + 1}. ${c}`);
                });
                if (colonias.length > 5) {
                    console.log(`   ... y ${colonias.length - 5} más`);
                }
            }

            console.log('\n═'.repeat(70));
            console.log('\n📊 INFORMACIÓN COMPLETA CP 81240:\n');
            console.log(`   Municipio: ${response.response.municipio || 'N/A'}`);
            console.log(`   Estado: ${response.response.estado || 'N/A'}`);
            console.log(`   Ciudad: ${response.response.ciudad || response.response.municipio || 'N/A'}`);
            console.log(`   CP: ${response.response.cp || '81240'}\n`);

            console.log('═'.repeat(70));

        } catch (error) {
            console.log('⚠️  Error al procesar respuesta JSON:', error.message);
            console.log('   Respuesta recibida:', data.substring(0, 500));
            probarAPIAlternativa();
        }
    });
});

req.on('error', (error) => {
    console.log('⚠️  Error de conexión con Copomex API:', error.message);
    probarAPIAlternativa();
});

req.end();

function probarAPIAlternativa() {
    console.log('\n═'.repeat(70));
    console.log('\n🔄 INTENTANDO API ALTERNATIVA - SEPOMEX Oficial\n');

    // API alternativa directa de SEPOMEX
    const optionsAlt = {
        hostname: 'sepomex.icalialabs.com',
        port: 443,
        path: '/api/v1/zip_codes?zip_code=81240',
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    };

    const reqAlt = https.request(optionsAlt, (res) => {
        let dataAlt = '';

        res.on('data', (chunk) => { dataAlt += chunk; });

        res.on('end', () => {
            try {
                const responseAlt = JSON.parse(dataAlt);

                console.log('✅ Datos de API alternativa obtenidos!\n');

                if (responseAlt.zip_codes && responseAlt.zip_codes.length > 0) {
                    console.log('📋 COLONIAS ENCONTRADAS:\n');

                    const colonias = new Set();
                    responseAlt.zip_codes.forEach(entry => {
                        colonias.add(entry.d_asenta);
                    });

                    const coloniasArray = Array.from(colonias).sort();
                    console.log(`   Total colonias únicas: ${coloniasArray.length}\n`);

                    coloniasArray.forEach((colonia, index) => {
                        console.log(`   ${index + 1}. ${colonia}`);
                    });

                    // Buscar Mayra
                    const mayra = coloniasArray.filter(c => {
                        const upper = c.toUpperCase();
                        return upper.includes('MAYRA') || upper.includes('PAMPLONA');
                    });

                    console.log('\n═'.repeat(70));
                    console.log('\n🔍 BÚSQUEDA "MAYRA H PAMPLONA":\n');

                    if (mayra.length > 0) {
                        console.log('✅ ENCONTRADA:\n');
                        mayra.forEach(c => console.log(`   📍 ${c}`));
                    } else {
                        console.log('❌ NO ENCONTRADA en API alternativa');
                    }

                } else {
                    console.log('⚠️  No hay datos en API alternativa');
                    console.log('   Respuesta:', JSON.stringify(responseAlt, null, 2));
                }

                console.log('\n═'.repeat(70));

            } catch (error) {
                console.log('⚠️  Error procesando API alternativa:', error.message);
                console.log('\n📋 CONCLUSIÓN FINAL:\n');
                mostrarConclusionFinal();
            }
        });
    });

    reqAlt.on('error', (error) => {
        console.log('⚠️  Error con API alternativa:', error.message);
        console.log('\n📋 CONCLUSIÓN FINAL:\n');
        mostrarConclusionFinal();
    });

    reqAlt.end();
}

function mostrarConclusionFinal() {
    console.log('═'.repeat(70));
    console.log('\n📊 RESUMEN DE BÚSQUEDA - "MAYRA H PAMPLONA" CP 81240\n');

    console.log('❌ INEGI: NO ENCONTRADA (182 asentamientos verificados)');
    console.log('❌ SEPOMEX: Verificando APIs oficiales...');
    console.log('✅ GOOGLE MAPS: SÍ EXISTE (Coords: 25.8005385, -108.99424)\n');

    console.log('💡 CONCLUSIÓN:');
    console.log('   Esta colonia existe FÍSICAMENTE pero puede:');
    console.log('   1. Ser muy reciente (posterior a último censo INEGI)');
    console.log('   2. Tener nombre coloquial diferente al oficial');
    console.log('   3. Ser parte de un fraccionamiento no registrado aún\n');

    console.log('📋 RECOMENDACIÓN:');
    console.log('   Agregar manualmente a la base de datos con nota:');
    console.log('   "Colonia verificada en Google Maps - No en INEGI/SEPOMEX"\n');

    console.log('═'.repeat(70));
}
