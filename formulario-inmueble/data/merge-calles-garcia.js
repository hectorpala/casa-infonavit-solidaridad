/**
 * Script para fusionar calles de García desde múltiples fuentes
 * Estrategia: INEGI primero (base oficial), luego complementar con OSM
 *
 * Prioridad de fuentes:
 * 1. INEGI - Catálogo de Vialidades (OFICIAL)
 * 2. OpenStreetMap - Datos de comunidad (complemento)
 */

const fs = require('fs');

console.log('🔀 FUSIÓN DE CALLES - GARCÍA, NUEVO LEÓN\n');
console.log('═'.repeat(70));

// Cargar datos de cada fuente
const inegiData = JSON.parse(fs.readFileSync('calles-inegi-garcia.json', 'utf8'));
const osmData = JSON.parse(fs.readFileSync('calles-osm-garcia.json', 'utf8'));

const inegiCalles = inegiData.calles || [];
const osmCalles = osmData.calles || [];

console.log('\n📊 DATOS ORIGINALES:');
console.log(`   INEGI: ${inegiCalles.length} calles`);
console.log(`   OSM:   ${osmCalles.length} calles`);

// Normalizar nombre para comparación
function normalizar(nombre) {
    return nombre
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/\./g, '') // Quitar puntos (Av. → Av)
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
}

// Paso 1: Usar INEGI como base (fuente oficial)
const callesSet = new Set();
const fuenteCount = {
    'INEGI': 0,
    'OSM': 0,
    'Duplicados evitados': 0
};

console.log('\n═'.repeat(70));
console.log('\n🔄 PROCESANDO FUSIÓN...\n');

// Agregar todas las calles de INEGI primero
const callesNormalizadas = new Map();
inegiCalles.forEach(calle => {
    const nombreNorm = normalizar(calle);
    callesSet.add(calle); // Mantener nombre original de INEGI
    callesNormalizadas.set(nombreNorm, calle);
    fuenteCount['INEGI']++;
});

console.log(`✅ Base INEGI agregada: ${fuenteCount['INEGI']} calles`);

// Paso 2: Complementar con OSM
let nuevasOSM = 0;

osmCalles.forEach(calle => {
    const nombreNorm = normalizar(calle);

    if (callesNormalizadas.has(nombreNorm)) {
        // Ya existe en INEGI - no agregar
        fuenteCount['Duplicados evitados']++;
    } else {
        // Nueva calle de OSM (no existe en INEGI)
        callesSet.add(calle);
        callesNormalizadas.set(nombreNorm, calle);
        fuenteCount['OSM']++;
        nuevasOSM++;
    }
});

console.log(`✅ OSM procesado:`);
console.log(`   - Calles nuevas agregadas: ${nuevasOSM}`);
console.log(`   - Duplicados evitados: ${fuenteCount['Duplicados evitados']}`);

// Convertir a array y ordenar
const callesFusionadas = Array.from(callesSet)
    .sort((a, b) => a.localeCompare(b, 'es'));

// Clasificar por tipo para estadísticas
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

callesFusionadas.forEach(calle => {
    const calleUpper = calle.toUpperCase();
    if (calleUpper.includes('AVENIDA') || calleUpper.startsWith('AV.')) {
        tiposCount['Avenida']++;
    } else if (calleUpper.includes('BOULEVARD') || calleUpper.includes('BLVD')) {
        tiposCount['Boulevard']++;
    } else if (calleUpper.includes('PRIVADA')) {
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

// Crear archivo final
const output = {
    metadata: {
        origen: 'Fusión INEGI + OSM',
        municipio: 'García',
        estado: 'Nuevo León',
        claveGeoestadistica: '19/018',
        fecha: new Date().toISOString().split('T')[0],
        totalCalles: callesFusionadas.length,
        fuentes: {
            'INEGI': fuenteCount['INEGI'],
            'OSM': fuenteCount['OSM'],
            'Duplicados evitados': fuenteCount['Duplicados evitados']
        },
        tipos: tiposCount,
        nota: 'Base INEGI complementada con OSM (siguiendo metodología Los Mochis/Mazatlán)'
    },
    calles: callesFusionadas
};

// Guardar archivo fusionado
const outputPath = 'calles-garcia.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

console.log('\n═'.repeat(70));
console.log('\n📊 RESULTADO FINAL:\n');
console.log(`   Total calles fusionadas: ${callesFusionadas.length}`);
console.log('\n📈 Por fuente:');
console.log(`   - INEGI (base):        ${fuenteCount['INEGI']}`);
console.log(`   - OSM (nuevas):        ${fuenteCount['OSM']}`);
console.log(`   - Duplicados evitados: ${fuenteCount['Duplicados evitados']}`);

console.log('\n📊 Por tipo:');
Object.entries(tiposCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tipo, count]) => {
        console.log(`   - ${tipo}: ${count}`);
    });

console.log(`\n💾 Archivo generado: ${outputPath}`);
console.log(`   Tamaño: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);

console.log('\n═'.repeat(70));
console.log('\n✅ FUSIÓN COMPLETADA\n');
console.log('═'.repeat(70));
