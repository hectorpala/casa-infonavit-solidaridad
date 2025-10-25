/**
 * Test para validar las correcciones del geocoder
 * Prueba las 4 propiedades que tenían problemas de matching
 */

const { geocoder } = require('./geo-geocoder-culiacan');

async function testGeocoderFixes() {
    console.log('='.repeat(80));
    console.log('🧪 TEST DE CORRECCIONES DEL GEOCODER');
    console.log('='.repeat(80));

    const testCases = [
        {
            name: 'Casa en Antonio Rosales',
            address: 'Casa en Rosales, Culiacán, Sinaloa',
            expectedColonia: 'Antonio Rosales',
            description: 'Debe hacer match parcial: "Rosales" → "Antonio Rosales"'
        },
        {
            name: 'Casa en Adolfo López Mateos',
            address: 'Casa en Adolfo Lopez Mateos, Culiacán, Sinaloa',
            expectedColonia: 'Adolfo López Mateos',
            description: 'Debe normalizar acento: "Lopez" → "López"'
        },
        {
            name: 'Casa en Fraccionamiento Terranova',
            address: 'Casa en Fraccionamiento Terranova, Culiacán, Sinaloa',
            expectedColonia: 'Terranova',
            description: 'Debe limpiar "Casa en Fraccionamiento"'
        }
    ];

    for (const testCase of testCases) {
        console.log('\n' + '─'.repeat(80));
        console.log(`📍 TEST: ${testCase.name}`);
        console.log(`   Dirección: "${testCase.address}"`);
        console.log(`   Esperado: "${testCase.expectedColonia}"`);
        console.log(`   Descripción: ${testCase.description}`);
        console.log('─'.repeat(80));

        try {
            const result = await geocoder.geocode(testCase.address);

            console.log('\n📊 RESULTADO:');
            console.log(`   Colonia detectada: ${result.colonia ? result.colonia.nombre : 'null'}`);
            console.log(`   Match type: ${result.colonia ? result.colonia.matchType : 'N/A'}`);
            console.log(`   Match score: ${result.colonia ? (result.colonia.matchScore * 100).toFixed(0) + '%' : 'N/A'}`);
            console.log(`   Coordenadas: ${result.coordinates.lat}, ${result.coordinates.lng}`);
            console.log(`   Precisión: ${result.precision}`);
            console.log(`   Fuente: ${result.validation.source}`);

            // Validación
            if (result.colonia && result.colonia.nombre === testCase.expectedColonia) {
                console.log(`\n   ✅ ÉXITO: Match correcto con "${testCase.expectedColonia}"`);
            } else {
                console.log(`\n   ❌ FALLO: Se esperaba "${testCase.expectedColonia}" pero se obtuvo "${result.colonia ? result.colonia.nombre : 'null'}"`);
            }

        } catch (error) {
            console.log(`\n   ❌ ERROR: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TESTS COMPLETADOS');
    console.log('='.repeat(80));
}

// Ejecutar tests
testGeocoderFixes()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Error en tests:', error);
        process.exit(1);
    });
