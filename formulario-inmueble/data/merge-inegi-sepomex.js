/**
 * Script para fusionar colonias INEGI + SEPOMEX
 * Resultado: Base de datos COMPLETA de Los Mochis
 */

const fs = require('fs');

console.log('🔄 FUSIÓN INEGI + SEPOMEX - LOS MOCHIS\n');
console.log('═'.repeat(70));

// Cargar datos INEGI
const inegiData = JSON.parse(fs.readFileSync('colonias-los-mochis.json', 'utf8'));
const sepomexData = JSON.parse(fs.readFileSync('colonias-sepomex-los-mochis.json', 'utf8'));

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
            tipo: 'COLONIA',
            nombre: sepomexColonia.nombre,
            codigoPostal: '81200', // CP genérico, se puede refinar después
            ciudad: 'Los Mochis',
            zona: 'Urbano',
            fuente: 'SEPOMEX'
        });
    }
});

console.log(`   Colonias coincidentes: ${coloniasYaExistentes.length}`);
console.log(`   Colonias NUEVAS (solo SEPOMEX): ${coloniasParaAgregar.length}\n`);

console.log('═'.repeat(70));
console.log('\n📋 MUESTRA DE COLONIAS NUEVAS A AGREGAR:\n');

coloniasParaAgregar.slice(0, 20).forEach((colonia, index) => {
    console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${colonia.nombre}`);
});

if (coloniasParaAgregar.length > 20) {
    console.log(`   ... y ${coloniasParaAgregar.length - 20} más`);
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
    municipio: 'Los Mochis (Ahome)',
    estado: 'Sinaloa',
    codigoGeoestadistico: '25/011',
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
    tiposCount[colonia.tipo] = (tiposCount[colonia.tipo] || 0) + 1;
});
metadataFusionada.tipos = tiposCount;

// Crear archivo fusionado
const archivoFusionado = {
    metadata: metadataFusionada,
    colonias: todasLasColonias
};

// Guardar
const outputFile = 'colonias-los-mochis-completo.json';
fs.writeFileSync(outputFile, JSON.stringify(archivoFusionado, null, 2), 'utf8');

console.log('═'.repeat(70));
console.log(`\n💾 ARCHIVO GENERADO: ${outputFile}`);
console.log(`   Tamaño: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB\n`);

console.log('═'.repeat(70));
console.log('\n✅ FUSIÓN COMPLETADA\n');

// Mostrar detalles de inclusión de Mayra H Pamplona
const mayraEncontrada = todasLasColonias.find(c =>
    c.nombre.toUpperCase().includes('MAYRA') &&
    c.nombre.toUpperCase().includes('PAMPLONA')
);

if (mayraEncontrada) {
    console.log('🎯 VERIFICACIÓN ESPECIAL:\n');
    console.log('   ✅ "Mayra H Pamplona" INCLUIDA en base de datos');
    console.log(`   📍 Fuente: ${mayraEncontrada.fuente || 'INEGI'}`);
    console.log(`   📮 CP: ${mayraEncontrada.codigoPostal}\n`);
}

console.log('═'.repeat(70));
console.log('\n📂 ARCHIVOS GENERADOS:\n');
console.log('   1. colonias-los-mochis.json (original INEGI)');
console.log('   2. colonias-sepomex-los-mochis.json (completo SEPOMEX)');
console.log('   3. colonias-faltantes-inegi.json (diferencias)');
console.log('   4. colonias-los-mochis-completo.json (FUSIONADO) ⭐\n');

console.log('💡 PRÓXIMO PASO:\n');
console.log('   Reemplazar colonias-los-mochis.json con colonias-los-mochis-completo.json');
console.log('   Comando: cp colonias-los-mochis-completo.json colonias-los-mochis.json\n');

console.log('═'.repeat(70));
