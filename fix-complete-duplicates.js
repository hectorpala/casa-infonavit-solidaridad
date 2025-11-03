#!/usr/bin/env node

/**
 * Script para eliminar bloques COMPLETOS duplicados
 * (Position, MarkerClass, Marker, push)
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'culiacan/index.html');

console.log('🔧 Eliminando bloques COMPLETOS duplicados...\n');

let html = fs.readFileSync(filePath, 'utf8');
const lines = html.split('\n');

// Encontrar todos los bloques completos (comentario + Position + MarkerClass + Marker + push + console.log)
const completeBlocks = [];
let i = 0;

while (i < lines.length) {
    const line = lines[i];

    // Detectar inicio de bloque: // Casa XXX - Coordenadas finales
    const commentMatch = line.match(/\/\/\s*(.+?)\s*-\s*Coordenadas finales/);

    if (commentMatch) {
        const blockName = commentMatch[1];
        const startLine = i;

        // Buscar las siguientes 5 líneas para confirmar que es un bloque completo
        if (i + 5 < lines.length) {
            const posLine = lines[i + 1];
            const markerClassLine = lines[i + 2];
            const markerLine = lines[i + 3];
            const pushLine = lines[i + 4];
            const logLine = lines[i + 5];

            // Extraer nombre de variable
            const posMatch = posLine.match(/const\s+([a-zA-Z0-9_]+)Position/);

            if (posMatch) {
                const varName = posMatch[1];

                // Verificar que las 5 líneas forman un bloque completo
                const isComplete =
                    markerClassLine.includes(`const ${varName}MarkerClass`) &&
                    markerLine.includes(`const ${varName}Marker = new`) &&
                    pushLine.includes(`window.allCuliacanMarkers.push(${varName}Marker)`) &&
                    logLine.includes('console.log');

                if (isComplete) {
                    // Extraer coordenadas
                    const coordsMatch = posLine.match(/LatLng\(([0-9.-]+),\s*([0-9.-]+)\)/);
                    const coords = coordsMatch ? `${coordsMatch[1]},${coordsMatch[2]}` : 'unknown';

                    completeBlocks.push({
                        varName,
                        blockName,
                        startLine,
                        endLine: i + 5,
                        coords
                    });
                }
            }
        }
    }

    i++;
}

console.log(`📊 Bloques completos encontrados: ${completeBlocks.length}\n`);

// Agrupar por varName
const grouped = {};
completeBlocks.forEach(block => {
    if (!grouped[block.varName]) {
        grouped[block.varName] = [];
    }
    grouped[block.varName].push(block);
});

// Identificar duplicados
const toRemove = [];

Object.keys(grouped).forEach(varName => {
    const blocks = grouped[varName];

    if (blocks.length > 1) {
        console.log(`🔍 ${varName} - ${blocks.length} bloques completos:`);

        blocks.forEach((block, index) => {
            const status = index === 0 ? '✅ MANTENER' : '❌ ELIMINAR';
            console.log(`   ${status} - Línea ${block.startLine + 1} - Coords: ${block.coords}`);

            if (index > 0) {
                toRemove.push(block);
            }
        });
        console.log('');
    }
});

console.log(`📝 Resumen: ${toRemove.length} bloques a eliminar\n`);

if (toRemove.length === 0) {
    console.log('✅ No hay duplicados completos.\n');
    process.exit(0);
}

// Eliminar de atrás hacia adelante
toRemove.sort((a, b) => b.startLine - a.startLine);

toRemove.forEach(block => {
    console.log(`🗑️  Eliminando ${block.varName} (líneas ${block.startLine + 1}-${block.endLine + 1})`);

    // Marcar líneas para eliminación (incluir línea vacía siguiente si existe)
    for (let i = block.startLine; i <= block.endLine + 1 && i < lines.length; i++) {
        lines[i] = null;
    }
});

// Reconstruir HTML
const newHtml = lines.filter(line => line !== null).join('\n');

const originalSize = html.length;
const newSize = newHtml.length;

console.log(`\n   Tamaño original: ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`   Tamaño nuevo: ${(newSize / 1024).toFixed(2)} KB`);
console.log(`   Reducción: ${((originalSize - newSize) / 1024).toFixed(2)} KB\n`);

fs.writeFileSync(filePath, newHtml, 'utf8');

console.log('✅ Archivo guardado: culiacan/index.html\n');
console.log('🔍 Ejecuta "node verify-culiacan-map-modal.js" para verificar.\n');
