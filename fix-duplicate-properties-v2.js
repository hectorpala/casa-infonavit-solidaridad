#!/usr/bin/env node

/**
 * Script para eliminar bloques de propiedades duplicados INCOMPLETOS
 * Mantiene solo los bloques COMPLETOS (con Position, MarkerClass, Marker, push)
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'culiacan/index.html');

console.log('🔧 Analizando propiedades en culiacan/index.html...\n');

let html = fs.readFileSync(filePath, 'utf8');
const lines = html.split('\n');

// Paso 1: Encontrar todos los bloques const XXXProperty
const propertyBlocks = [];
let currentBlock = null;

lines.forEach((line, index) => {
    // Detectar inicio de bloque Property
    const propMatch = line.match(/const\s+([a-zA-Z0-9_]+)Property\s*=\s*\{/);
    if (propMatch) {
        if (currentBlock) {
            // Guardar bloque anterior
            propertyBlocks.push(currentBlock);
        }
        currentBlock = {
            name: propMatch[1],
            startLine: index,
            endLine: null,
            hasPosition: false,
            hasMarkerClass: false,
            hasMarker: false,
            hasPush: false,
            complete: false
        };
    }

    // Detectar cierre del objeto Property
    if (currentBlock && !currentBlock.endLine && line.match(/^\s+\};\s*$/)) {
        currentBlock.endLine = index;
    }

    // Detectar componentes del bloque completo
    if (currentBlock && currentBlock.endLine) {
        const posMatch = line.match(new RegExp(`const\\s+${currentBlock.name}Position`));
        const markerClassMatch = line.match(new RegExp(`const\\s+${currentBlock.name}MarkerClass`));
        const markerMatch = line.match(new RegExp(`const\\s+${currentBlock.name}Marker\\s*=\\s*new`));
        const pushMatch = line.match(new RegExp(`window\\.allCuliacanMarkers\\.push\\(${currentBlock.name}Marker\\)`));

        if (posMatch) currentBlock.hasPosition = true;
        if (markerClassMatch) currentBlock.hasMarkerClass = true;
        if (markerMatch) currentBlock.hasMarker = true;
        if (pushMatch) {
            currentBlock.hasPush = true;
            currentBlock.complete = true;
            // Terminar bloque aquí
            propertyBlocks.push(currentBlock);
            currentBlock = null;
        }
    }
});

// Guardar último bloque si existe
if (currentBlock) {
    propertyBlocks.push(currentBlock);
}

console.log(`📊 Análisis:\n`);
console.log(`   Total de bloques Property: ${propertyBlocks.length}`);

// Agrupar por nombre
const grouped = {};
propertyBlocks.forEach(block => {
    if (!grouped[block.name]) {
        grouped[block.name] = [];
    }
    grouped[block.name].push(block);
});

// Identificar duplicados
const toRemove = [];
Object.keys(grouped).forEach(name => {
    const blocks = grouped[name];
    if (blocks.length > 1) {
        console.log(`\n   🔍 ${name} - ${blocks.length} ocurrencias:`);

        // Encontrar el bloque completo
        const completeBlock = blocks.find(b => b.complete);
        const incompleteBlocks = blocks.filter(b => !b.complete);

        if (completeBlock) {
            console.log(`      ✅ Completo en línea ${completeBlock.startLine + 1}`);
        }

        incompleteBlocks.forEach(block => {
            console.log(`      ❌ Incompleto en línea ${block.startLine + 1} (ELIMINAR)`);
            toRemove.push(block);
        });

        // Si hay múltiples completos, mantener solo el primero
        const completeBlocks = blocks.filter(b => b.complete);
        if (completeBlocks.length > 1) {
            console.log(`      ⚠️  ADVERTENCIA: ${completeBlocks.length} bloques completos`);
            // Mantener solo el primero
            completeBlocks.slice(1).forEach(block => {
                console.log(`      ❌ Duplicado completo en línea ${block.startLine + 1} (ELIMINAR)`);
                toRemove.push(block);
            });
        }
    }
});

console.log(`\n📝 Resumen:\n`);
console.log(`   Bloques a eliminar: ${toRemove.length}\n`);

if (toRemove.length === 0) {
    console.log('✅ No hay bloques duplicados para eliminar.\n');
    process.exit(0);
}

// Ordenar de mayor a menor línea para eliminar sin afectar índices
toRemove.sort((a, b) => b.startLine - a.startLine);

// Eliminar bloques
toRemove.forEach(block => {
    // Buscar el comentario anterior (// VENTA: XXX)
    let commentLine = block.startLine - 1;
    while (commentLine >= 0 && !lines[commentLine].match(/\/\/\s*(VENTA|RENTA):/)) {
        commentLine--;
    }

    // Si hay comentario justo antes, incluirlo en la eliminación
    const startDel = (block.startLine - commentLine === 1) ? commentLine : block.startLine;
    const endDel = block.endLine + 1; // +1 para incluir la línea de cierre

    console.log(`   🗑️  Eliminando ${block.name} (líneas ${startDel + 1}-${endDel + 1})`);

    // Marcar líneas para eliminación
    for (let i = startDel; i <= endDel; i++) {
        lines[i] = null;
    }
});

// Reconstruir HTML sin las líneas eliminadas
const newHtml = lines.filter(line => line !== null).join('\n');

const originalSize = html.length;
const newSize = newHtml.length;

console.log(`\n   Tamaño original: ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`   Tamaño nuevo: ${(newSize / 1024).toFixed(2)} KB`);
console.log(`   Reducción: ${((originalSize - newSize) / 1024).toFixed(2)} KB\n`);

// Guardar
fs.writeFileSync(filePath, newHtml, 'utf8');

console.log('✅ Archivo guardado: culiacan/index.html\n');
console.log('🔍 Ejecuta "node verify-culiacan-map-modal.js" para verificar.\n');
