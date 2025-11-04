/**
 * Script para fusionar colonias de García con códigos postales incluidos
 * Estrategia: INEGI primero (base), luego complementar con SEPOMEX incluyendo CPs
 *
 * Prioridad de fuentes:
 * 1. INEGI - Marco Geoestadístico Nacional (OFICIAL)
 * 2. SEPOMEX - Servicio Postal Mexicano (complemento + CPs)
 */

const fs = require('fs');

console.log('🔀 FUSIÓN DE COLONIAS CON CÓDIGOS POSTALES - GARCÍA, NUEVO LEÓN\n');
console.log('═'.repeat(70));

// Cargar datos de cada fuente
const inegiData = JSON.parse(fs.readFileSync('colonias-inegi-garcia.json', 'utf8'));
const sepomexData = JSON.parse(fs.readFileSync('colonias-sepomex-garcia.json', 'utf8'));

const inegiColonias = inegiData.colonias || [];
const coloniasPorCP = sepomexData.coloniasPorCP || {};

console.log('\n📊 DATOS ORIGINALES:');
console.log(`   INEGI colonias:     ${inegiColonias.length}`);
console.log(`   SEPOMEX CPs:        ${Object.keys(coloniasPorCP).length}`);

// Normalizar nombre para comparación
function normalizar(nombre) {
    return nombre
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .trim();
}

// Crear mapa de CPs desde SEPOMEX: nombre normalizado → CPs
const nombreACPs = new Map();

Object.entries(coloniasPorCP).forEach(([cp, data]) => {
    data.colonias.forEach(nombreColonia => {
        const nombreNorm = normalizar(nombreColonia);
        if (!nombreACPs.has(nombreNorm)) {
            nombreACPs.set(nombreNorm, []);
        }
        nombreACPs.get(nombreNorm).push(cp);
    });
});

console.log(`   Mapping nombre→CP:  ${nombreACPs.size} nombres únicos en SEPOMEX`);

// Paso 1: Usar INEGI como base y agregar CPs desde SEPOMEX
const coloniasMap = new Map();
const stats = {
    'INEGI sin CP': 0,
    'INEGI con 1 CP': 0,
    'INEGI con múltiples CPs': 0,
    'SEPOMEX nuevas': 0
};

console.log('\n═'.repeat(70));
console.log('\n🔄 PROCESANDO FUSIÓN...\n');

// Agregar todas las colonias de INEGI primero
inegiColonias.forEach(colonia => {
    const nombreNorm = normalizar(colonia.nombre);

    // Buscar CPs en SEPOMEX
    const cpsEncontrados = nombreACPs.get(nombreNorm) || [];

    let cp = null;
    let fuente = 'INEGI';

    if (cpsEncontrados.length > 0) {
        cp = cpsEncontrados[0]; // Usar primer CP encontrado
        fuente = 'INEGI + SEPOMEX (Fusionado)';

        if (cpsEncontrados.length === 1) {
            stats['INEGI con 1 CP']++;
        } else {
            stats['INEGI con múltiples CPs']++;
        }
    } else {
        stats['INEGI sin CP']++;
    }

    coloniasMap.set(nombreNorm, {
        tipo: colonia.tipo,
        nombre: colonia.nombre, // Mantener nombre original de INEGI
        codigoPostal: cp,
        ciudad: 'García',
        estado: 'Nuevo León',
        zona: colonia.zona,
        fuente: fuente,
        cpsAlternativos: cpsEncontrados.length > 1 ? cpsEncontrados.slice(1) : []
    });
});

console.log(`✅ Base INEGI procesada: ${inegiColonias.length} colonias`);
console.log(`   - Con 1 CP:          ${stats['INEGI con 1 CP']}`);
console.log(`   - Con múltiples CPs: ${stats['INEGI con múltiples CPs']}`);
console.log(`   - Sin CP:            ${stats['INEGI sin CP']}`);

// Paso 2: Agregar colonias de SEPOMEX que NO existen en INEGI
Object.entries(coloniasPorCP).forEach(([cp, data]) => {
    data.colonias.forEach(nombreColonia => {
        const nombreNorm = normalizar(nombreColonia);

        if (!coloniasMap.has(nombreNorm)) {
            // Nueva colonia de SEPOMEX (no existe en INEGI)
            coloniasMap.set(nombreNorm, {
                tipo: 'COLONIA',
                nombre: nombreColonia,
                codigoPostal: cp,
                ciudad: 'García',
                estado: 'Nuevo León',
                zona: 'Urbano',
                fuente: 'SEPOMEX',
                cpsAlternativos: []
            });
            stats['SEPOMEX nuevas']++;
        }
    });
});

console.log(`\n✅ SEPOMEX procesado:`);
console.log(`   - Colonias nuevas:   ${stats['SEPOMEX nuevas']}`);

// Convertir a array y ordenar
const coloniasFusionadas = Array.from(coloniasMap.values())
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

// Estadísticas finales
const conCP = coloniasFusionadas.filter(c => c.codigoPostal !== null).length;
const sinCP = coloniasFusionadas.length - conCP;

const fuenteCount = coloniasFusionadas.reduce((acc, c) => {
    acc[c.fuente] = (acc[c.fuente] || 0) + 1;
    return acc;
}, {});

const tiposCount = coloniasFusionadas.reduce((acc, col) => {
    acc[col.tipo] = (acc[col.tipo] || 0) + 1;
    return acc;
}, {});

// Crear archivo final
const output = {
    metadata: {
        origen: 'Fusión INEGI + SEPOMEX con CPs',
        municipio: 'García',
        estado: 'Nuevo León',
        claveGeoestadistica: '19/018',
        fecha: new Date().toISOString().split('T')[0],
        totalColonias: coloniasFusionadas.length,
        conCodigoPostal: conCP,
        sinCodigoPostal: sinCP,
        porcentajeConCP: ((conCP / coloniasFusionadas.length) * 100).toFixed(1),
        fuentes: fuenteCount,
        tipos: tiposCount,
        nota: 'Base INEGI complementada con SEPOMEX (CPs mapeados desde coloniasPorCP)'
    },
    colonias: coloniasFusionadas.map(c => ({
        tipo: c.tipo,
        nombre: c.nombre,
        codigoPostal: c.codigoPostal,
        ciudad: c.ciudad,
        estado: c.estado,
        zona: c.zona,
        fuente: c.fuente
    }))
};

// Guardar archivo fusionado
const outputPath = 'colonias-garcia.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

console.log('\n═'.repeat(70));
console.log('\n📊 RESULTADO FINAL:\n');
console.log(`   Total colonias:      ${coloniasFusionadas.length}`);
console.log(`   Con código postal:   ${conCP} (${output.metadata.porcentajeConCP}%)`);
console.log(`   Sin código postal:   ${sinCP}`);

console.log('\n📈 Por fuente:');
Object.entries(fuenteCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([fuente, count]) => {
        console.log(`   - ${fuente}: ${count}`);
    });

console.log('\n📊 Por tipo (top 5):');
Object.entries(tiposCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([tipo, count]) => {
        console.log(`   - ${tipo}: ${count}`);
    });

console.log(`\n💾 Archivo generado: ${outputPath}`);
console.log(`   Tamaño: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);

console.log('\n═'.repeat(70));
console.log('\n✅ FUSIÓN COMPLETADA CON CÓDIGOS POSTALES\n');
console.log('═'.repeat(70));
