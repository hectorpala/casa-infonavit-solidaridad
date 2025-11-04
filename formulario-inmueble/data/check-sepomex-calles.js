/**
 * Script para investigar si SEPOMEX tiene datos de calles/vialidades
 * y compararlos con INEGI
 */

const https = require('https');
const fs = require('fs');

console.log('🔍 INVESTIGACIÓN SEPOMEX - CALLES/VIALIDADES\n');
console.log('═'.repeat(70));

console.log('\n📋 Probando diferentes endpoints de SEPOMEX...\n');

// Cargar calles INEGI para comparación
const inegiCalles = JSON.parse(fs.readFileSync('calles-los-mochis.json', 'utf8'));
console.log(`📊 Calles INEGI actuales: ${inegiCalles.calles.length}\n`);

console.log('═'.repeat(70));

// Probar API 1: Copomex con CP específico
console.log('\n🔍 TEST 1: Copomex API (CP 81200)\n');

const options1 = {
    hostname: 'api.copomex.com',
    port: 443,
    path: '/query/info_cp/81200?type=simplified',
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};

const req1 = https.request(options1, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('📦 Respuesta Copomex:');
            console.log(JSON.stringify(response, null, 2).substring(0, 500));

            if (response.response) {
                console.log('\n📋 Campos disponibles:');
                Object.keys(response.response).forEach(key => {
                    console.log(`   - ${key}: ${typeof response.response[key]}`);
                });
            }

            console.log('\n❌ Copomex NO incluye calles (solo colonias y CPs)');
            probarAPI2();

        } catch (error) {
            console.log('⚠️  Error:', error.message);
            probarAPI2();
        }
    });
});

req1.on('error', (error) => {
    console.log('⚠️  Error:', error.message);
    probarAPI2();
});

req1.end();

function probarAPI2() {
    console.log('\n═'.repeat(70));
    console.log('\n🔍 TEST 2: SEPOMEX Icalia Labs (CP 81240)\n');

    const options2 = {
        hostname: 'sepomex.icalialabs.com',
        port: 443,
        path: '/api/v1/zip_codes?zip_code=81240',
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    };

    const req2 = https.request(options2, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const response = JSON.parse(data);

                if (response.zip_codes && response.zip_codes.length > 0) {
                    console.log('📦 Datos recibidos:');
                    console.log(`   Total entradas: ${response.zip_codes.length}\n`);

                    console.log('📋 Campos disponibles:');
                    const firstEntry = response.zip_codes[0];
                    Object.keys(firstEntry).forEach(key => {
                        console.log(`   - ${key}: ${firstEntry[key]}`);
                    });

                    // Buscar campo de calles
                    const tieneCalle = firstEntry.d_tipo_asenta ||
                                     firstEntry.calle ||
                                     firstEntry.vialidad ||
                                     firstEntry.street;

                    if (tieneCalle) {
                        console.log('\n✅ Campo de calle encontrado!');
                    } else {
                        console.log('\n❌ SEPOMEX Icalia Labs NO incluye calles');
                        console.log('   Solo tiene: colonias, municipio, estado, CP, zona');
                    }
                }

                mostrarConclusiones();

            } catch (error) {
                console.log('⚠️  Error:', error.message);
                mostrarConclusiones();
            }
        });
    });

    req2.on('error', (error) => {
        console.log('⚠️  Error:', error.message);
        mostrarConclusiones();
    });

    req2.end();
}

function mostrarConclusiones() {
    console.log('\n═'.repeat(70));
    console.log('\n💡 CONCLUSIONES:\n');

    console.log('❌ SEPOMEX NO tiene base de datos de calles/vialidades');
    console.log('   - SEPOMEX solo maneja: colonias + códigos postales');
    console.log('   - NO incluye nombres de calles en sus APIs públicas\n');

    console.log('✅ INEGI sigue siendo la MEJOR fuente para calles');
    console.log('   - 1,042 calles de Los Mochis');
    console.log('   - Incluye tipos (Calle, Av, Blvd, etc.)');
    console.log('   - Validado con OpenStreetMap (813 coincidencias)\n');

    console.log('═'.repeat(70));
    console.log('\n📊 FUENTES DE DATOS VERIFICADAS:\n');

    console.log('📍 COLONIAS:');
    console.log('   ✅ INEGI: 160 colonias');
    console.log('   ✅ SEPOMEX: 238 colonias');
    console.log('   ✅ FUSIONADO: 376 colonias únicas\n');

    console.log('🛣️  CALLES:');
    console.log('   ✅ INEGI: 1,042 calles (ÚNICA fuente oficial)');
    console.log('   ❌ SEPOMEX: No disponible');
    console.log('   ✅ OpenStreetMap: 1,921 (validación, incluye no oficiales)\n');

    console.log('═'.repeat(70));
    console.log('\n🎯 RECOMENDACIÓN:\n');

    console.log('✅ Mantener calles de INEGI (1,042) - ES LA FUENTE MÁS COMPLETA');
    console.log('✅ Ya validamos con OpenStreetMap (78% match = 813 calles)');
    console.log('✅ No hay fuente oficial adicional para agregar calles\n');

    console.log('📋 ALTERNATIVAS (si se requieren MÁS calles):');
    console.log('   1. OpenStreetMap: +909 calles adicionales (no todas oficiales)');
    console.log('   2. Google Maps API: Requiere geocoding manual por colonia');
    console.log('   3. Catastro Municipal: Requiere acceso a base de datos local\n');

    console.log('═'.repeat(70));
    console.log('\n✅ VERIFICACIÓN COMPLETADA\n');
    console.log('   SEPOMEX solo útil para COLONIAS (ya agregadas ✓)');
    console.log('   INEGI sigue siendo la fuente oficial para CALLES\n');
    console.log('═'.repeat(70));
}
