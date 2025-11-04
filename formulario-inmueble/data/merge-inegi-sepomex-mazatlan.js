/**
 * Script para fusionar colonias INEGI + SEPOMEX de Mazatlán
 * Resultado: Base de datos COMPLETA de Mazatlán
 */

const fs = require('fs');

console.log('🔄 FUSIÓN INEGI + SEPOMEX - MAZATLÁN\n');
console.log('═'.repeat(70));

// Cargar datos INEGI
const inegiData = JSON.parse(fs.readFileSync('colonias-mazatlan.json', 'utf8'));
const sepomexData = JSON.parse(fs.readFileSync('colonias-sepomex-mazatlan.json', 'utf8'));

console.log('\n📊 DATOS CARGADOS:\n');
console.log(`   INEGI: ${inegiData.colonias.length} colonias`);
console.log(`   SEPOMEX: ${sepomexData.colonias.length} colonias\n`);

// Crear map de colonias INEGI por nombre (normalizado)
const inegiMap = new Map();
inegiData.colonias.forEach(colonia => {
    const key = colonia.nombre.toUpperCase().trim();
    inegiMap.set(key, colonia);
});

console.log('═'.repeat(70));
console.log('\n🔍 IDENTIFICANDO COLONIAS FALTANTES:\n');

// Identificar colonias que SOLO están en SEPOMEX
const coloniasParaAgregar = [];
const coloniasYaExistentes = [];

sepomexData.colonias.forEach(sepomexColonia => {
    const key = sepomexColonia.nombre.toUpperCase().trim();

    if (inegiMap.has(key)) {
        coloniasYaExistentes.push(sepomexColonia.nombre);
    } else {
        // Esta colonia NO está en INEGI, agregar
        coloniasParaAgregar.push({
            tipo: sepomexColonia.tipo || 'Colonia',
            nombre: sepomexColonia.nombre,
            codigoPostal: sepomexColonia.codigoPostal || '82000', // CP genérico
            ciudad: 'Mazatlán',
            zona: 'Urbano',
            fuente: 'SEPOMEX'
        });
    }
});

console.log(`   Colonias coincidentes: ${coloniasYaExistentes.length}`);
console.log(`   Colonias NUEVAS (solo SEPOMEX): ${coloniasParaAgregar.length}\n`);

console.log('═'.repeat(70));
console.log('\n📋 MUESTRA DE COLONIAS NUEVAS A AGREGAR (primeras 30):\n');

coloniasParaAgregar.slice(0, 30).forEach((colonia, index) => {
    console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${colonia.nombre}`);
});

if (coloniasParaAgregar.length > 30) {
    console.log(`   ... y ${coloniasParaAgregar.length - 30} más`);
}

// Combinar todas las colonias
const todasLasColonias = [
    ...inegiData.colonias,
    ...coloniasParaAgregar
];

// Ordenar alfabéticamente
todasLasColonias.sort((a, b) => a.nombre.localeCompare(b.nombre));

console.log('\n═'.repeat(70));
console.log('\n📊 ESTADÍSTICAS FINALES:\n');
console.log(`   INEGI original: ${inegiData.colonias.length} colonias`);
console.log(`   SEPOMEX nuevas: ${coloniasParaAgregar.length} colonias`);
console.log(`   ─────────────────────────────────────────`);
console.log(`   TOTAL FUSIONADO: ${todasLasColonias.length} colonias ✅\n`);

// Contar por fuente
const porFuente = {
    INEGI: inegiData.colonias.length,
    SEPOMEX: coloniasParaAgregar.length
};

// Crear metadata mejorada
const metadataFusionada = {
    origen: 'INEGI + SEPOMEX (Fusionado)',
    municipio: 'Mazatlán',
    estado: 'Sinaloa',
    codigoGeoestadistico: '25/012',
    fecha: new Date().toISOString().split('T')[0],
    totalColonias: todasLasColonias.length,
    fuentes: {
        INEGI: {
            colonias: porFuente.INEGI,
            descripcion: 'Marco Geoestadístico Nacional (oficial)'
        },
        SEPOMEX: {
            colonias: porFuente.SEPOMEX,
            descripcion: 'Servicio Postal Mexicano (oficial)'
        }
    },
    nota: 'Base de datos completa fusionando INEGI y SEPOMEX para máxima cobertura',
    tipos: {}
};

// Contar tipos
const tiposCount = {};
todasLasColonias.forEach(colonia => {
    const tipo = colonia.tipo || 'Colonia';
    tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
});
metadataFusionada.tipos = tiposCount;

// Crear archivo fusionado
const archivoFusionado = {
    metadata: metadataFusionada,
    colonias: todasLasColonias
};

// Guardar
const outputFile = 'colonias-mazatlan-completo.json';
fs.writeFileSync(outputFile, JSON.stringify(archivoFusionado, null, 2), 'utf8');

console.log('═'.repeat(70));
console.log(`\n💾 ARCHIVO GENERADO: ${outputFile}`);
console.log(`   Tamaño: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB\n`);

console.log('═'.repeat(70));
console.log('\n✅ FUSIÓN COMPLETADA\n');

console.log('═'.repeat(70));
console.log('\n📂 ARCHIVOS GENERADOS:\n');
console.log('   1. colonias-mazatlan.json (original INEGI)');
console.log('   2. colonias-sepomex-mazatlan.json (completo SEPOMEX)');
console.log('   3. colonias-faltantes-inegi-mazatlan.json (diferencias)');
console.log('   4. colonias-mazatlan-completo.json (FUSIONADO) ⭐\n');

console.log('💡 PRÓXIMO PASO:\n');
console.log('   Reemplazar colonias-mazatlan.json con colonias-mazatlan-completo.json');
console.log('   Comando: cp colonias-mazatlan-completo.json colonias-mazatlan.json\n');

console.log('═'.repeat(70));
