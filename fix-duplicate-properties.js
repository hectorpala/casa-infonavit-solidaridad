#!/usr/bin/env node

/**
 * Script para eliminar propiedades duplicadas en culiacan/index.html
 * Mantiene la PRIMERA ocurrencia y elimina las subsecuentes
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'culiacan/index.html');

console.log('🔧 Eliminando propiedades duplicadas en culiacan/index.html...\n');

// Leer archivo
let html = fs.readFileSync(filePath, 'utf8');
const originalLength = html.length;

// Patrón para encontrar bloques completos de propiedades
// Busca desde "const XXXProperty = {" hasta el siguiente "window.allCuliacanMarkers.push(XXXMarker);"
const propertyBlockPattern = /\/\/ ([^\n]+)\n\s+const ([a-zA-Z0-9_]+)Property = \{[\s\S]*?window\.allCuliacanMarkers\.push\(\2Marker\);\s*\n\s+console\.log\([^)]+\);\s*\n/g;

// Extraer todos los bloques
const blocks = [];
let match;
while ((match = propertyBlockPattern.exec(html)) !== null) {
    blocks.push({
        name: match[2], // Nombre de la propiedad (sin "Property")
        comment: match[1], // Comentario descriptivo
        fullMatch: match[0], // Bloque completo
        index: match.index // Posición en el HTML
    });
}

console.log(`📊 Estadísticas:\n`);
console.log(`   Total de bloques encontrados: ${blocks.length}`);

// Identificar duplicados
const seen = new Map();
const duplicates = [];
const unique = [];

blocks.forEach(block => {
    if (seen.has(block.name)) {
        duplicates.push(block);
        console.log(`   ❌ DUPLICADO: ${block.name} (línea ~${Math.floor(block.index / 80)})`);
    } else {
        seen.set(block.name, block);
        unique.push(block);
    }
});

console.log(`\n   ✅ Bloques únicos: ${unique.length}`);
console.log(`   ❌ Bloques duplicados: ${duplicates.length}\n`);

if (duplicates.length === 0) {
    console.log('✅ No se encontraron duplicados. El archivo está limpio.\n');
    process.exit(0);
}

// Eliminar duplicados (de atrás hacia adelante para no afectar índices)
duplicates.sort((a, b) => b.index - a.index);

let removedCount = 0;
duplicates.forEach(dup => {
    // Buscar y eliminar el bloque exacto
    const indexOfDup = html.indexOf(dup.fullMatch, dup.index - 100);
    if (indexOfDup !== -1) {
        html = html.slice(0, indexOfDup) + html.slice(indexOfDup + dup.fullMatch.length);
        removedCount++;
        console.log(`   🗑️  Eliminado: ${dup.name} en posición ${indexOfDup}`);
    }
});

console.log(`\n📝 Resumen:\n`);
console.log(`   Bloques eliminados: ${removedCount}`);
console.log(`   Tamaño original: ${(originalLength / 1024).toFixed(2)} KB`);
console.log(`   Tamaño nuevo: ${(html.length / 1024).toFixed(2)} KB`);
console.log(`   Reducción: ${((originalLength - html.length) / 1024).toFixed(2)} KB\n`);

// Guardar archivo
fs.writeFileSync(filePath, html, 'utf8');

console.log('✅ Archivo guardado: culiacan/index.html\n');
console.log('🔍 Ejecuta "node verify-culiacan-map-modal.js" para verificar.\n');
