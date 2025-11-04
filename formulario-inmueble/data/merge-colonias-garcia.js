/**
 * Script para fusionar colonias de García desde múltiples fuentes
 * Estrategia: INEGI primero (base), luego complementar con SEPOMEX
 *
 * Prioridad de fuentes:
 * 1. INEGI - Marco Geoestadístico Nacional (OFICIAL)
 * 2. SEPOMEX - Servicio Postal Mexicano (complemento)
 */

const fs = require('fs');

console.log('🔀 FUSIÓN DE COLONIAS - GARCÍA, NUEVO LEÓN\n');
console.log('═'.repeat(70));

// Cargar datos de cada fuente
const inegiData = JSON.parse(fs.readFileSync('colonias-inegi-garcia.json', 'utf8'));
const sepomexData = JSON.parse(fs.readFileSync('colonias-sepomex-garcia.json', 'utf8'));

const inegiColonias = inegiData.colonias || [];
const sepomexColonias = sepomexData.colonias || [];

console.log('\n📊 DATOS ORIGINALES:');
console.log(`   INEGI:   ${inegiColonias.length} colonias`);
console.log(`   SEPOMEX: ${sepomexColonias.length} colonias`);

// Normalizar nombre para comparación
function normalizar(nombre) {
    return nombre
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .trim();
}

// Paso 1: Usar INEGI como base (fuente oficial)
const coloniasMap = new Map();
const fuenteCount = {
    'INEGI': 0,
    'INEGI + SEPOMEX (Fusionado)': 0,
    'SEPOMEX': 0
};

console.log('\n═'.repeat(70));
console.log('\n🔄 PROCESANDO FUSIÓN...\n');

// Agregar todas las colonias de INEGI primero
inegiColonias.forEach(colonia => {
    const nombreNorm = normalizar(colonia.nombre);
    coloniasMap.set(nombreNorm, {
        tipo: colonia.tipo,
        nombre: colonia.nombre, // Mantener nombre original de INEGI
        codigoPostal: colonia.codigoPostal || null,
        ciudad: 'García',
        estado: 'Nuevo León',
        zona: colonia.zona,
        fuente: 'INEGI'
    });
    fuenteCount['INEGI']++;
});

console.log(`✅ Base INEGI agregada: ${fuenteCount['INEGI']} colonias`);

// Paso 2: Complementar con SEPOMEX
let complementadas = 0;
let nuevasSepomex = 0;

sepomexColonias.forEach(colonia => {
    const nombreNorm = normalizar(colonia.nombre);

    if (coloniasMap.has(nombreNorm)) {
        // Ya existe en INEGI - complementar CP si falta
        const existente = coloniasMap.get(nombreNorm);
        if (!existente.codigoPostal && colonia.codigoPostal) {
            existente.codigoPostal = colonia.codigoPostal;
            existente.fuente = 'INEGI + SEPOMEX (Fusionado)';
            fuenteCount['INEGI']--;
            fuenteCount['INEGI + SEPOMEX (Fusionado)']++;
            complementadas++;
        }
    } else {
        // Nueva colonia de SEPOMEX (no existe en INEGI)
        coloniasMap.set(nombreNorm, {
            tipo: colonia.tipo || 'COLONIA',
            nombre: colonia.nombre,
            codigoPostal: colonia.codigoPostal || null,
            ciudad: 'García',
            estado: 'Nuevo León',
            zona: colonia.zona || 'Urbano',
            fuente: 'SEPOMEX'
        });
        fuenteCount['SEPOMEX']++;
        nuevasSepomex++;
    }
});

console.log(`✅ SEPOMEX procesado:`);
console.log(`   - Colonias complementadas con CP: ${complementadas}`);
console.log(`   - Colonias nuevas agregadas: ${nuevasSepomex}`);

// Convertir a array y ordenar
const coloniasFusionadas = Array.from(coloniasMap.values())
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

// Estadísticas por tipo
const tiposCount = coloniasFusionadas.reduce((acc, col) => {
    acc[col.tipo] = (acc[col.tipo] || 0) + 1;
    return acc;
}, {});

// Crear archivo final
const output = {
    metadata: {
        origen: 'Fusión INEGI + SEPOMEX',
        municipio: 'García',
        estado: 'Nuevo León',
        claveGeoestadistica: '19/018',
        fecha: new Date().toISOString().split('T')[0],
        totalColonias: coloniasFusionadas.length,
        fuentes: {
            'INEGI': fuenteCount['INEGI'],
            'INEGI + SEPOMEX (Fusionado)': fuenteCount['INEGI + SEPOMEX (Fusionado)'],
            'SEPOMEX': fuenteCount['SEPOMEX']
        },
        tipos: tiposCount,
        nota: 'Base INEGI complementada con SEPOMEX (siguiendo metodología Los Mochis/Mazatlán)'
    },
    colonias: coloniasFusionadas
};

// Guardar archivo fusionado
const outputPath = 'colonias-garcia.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

console.log('\n═'.repeat(70));
console.log('\n📊 RESULTADO FINAL:\n');
console.log(`   Total colonias fusionadas: ${coloniasFusionadas.length}`);
console.log('\n📈 Por fuente:');
console.log(`   - INEGI (base):                ${fuenteCount['INEGI']}`);
console.log(`   - INEGI + SEPOMEX (fusionado): ${fuenteCount['INEGI + SEPOMEX (Fusionado)']}`);
console.log(`   - SEPOMEX (nuevo):             ${fuenteCount['SEPOMEX']}`);

console.log('\n📊 Por tipo:');
Object.entries(tiposCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([tipo, count]) => {
        console.log(`   - ${tipo}: ${count}`);
    });

console.log(`\n💾 Archivo generado: ${outputPath}`);
console.log(`   Tamaño: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);

console.log('\n═'.repeat(70));
console.log('\n✅ FUSIÓN COMPLETADA\n');
console.log('═'.repeat(70));
