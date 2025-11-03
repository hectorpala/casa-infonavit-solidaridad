#!/usr/bin/env node

/**
 * Elimina bloques de propiedades con coordenadas undefined
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'culiacan/index.html');

console.log('🗑️  Eliminando bloques con coordenadas undefined...\n');

let html = fs.readFileSync(filePath, 'utf8');
const lines = html.split('\n');

const toRemove = [];

// Buscar todos los bloques con undefined
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('LatLng(undefined, undefined)')) {
        // Buscar el inicio del bloque (comentario // XXX - address)
        let startLine = i;
        while (startLine > 0 && !lines[startLine].match(/\/\/\s+\w+\s+-\s+.*-\s*Coordenadas/)) {
            startLine--;
        }

        // Buscar el final del bloque (console.log)
        let endLine = i;
        while (endLine < lines.length && !lines[endLine].includes('console.log')) {
            endLine++;
        }

        if (lines[startLine].match(/\/\/\s+(\w+)\s+-/)) {
            const propName = lines[startLine].match(/\/\/\s+(\w+)\s+-/)[1];

            toRemove.push({
                propertyName: propName,
                startLine: startLine,
                endLine: endLine
            });

            console.log(`❌ ${propName} (líneas ${startLine + 1}-${endLine + 1})`);
        }
    }
}

console.log(`\n📊 Total a eliminar: ${toRemove.length} bloques\n`);

// Eliminar de atrás hacia adelante
toRemove.sort((a, b) => b.startLine - a.startLine);

toRemove.forEach(block => {
    // Marcar líneas para eliminación
    for (let i = block.startLine; i <= block.endLine + 1; i++) {
        lines[i] = null;
    }
});

// Reconstruir HTML
const newHtml = lines.filter(line => line !== null).join('\n');

const originalSize = html.length;
const newSize = newHtml.length;

console.log(`📝 Estadísticas:\n`);
console.log(`   Tamaño original: ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`   Tamaño nuevo: ${(newSize / 1024).toFixed(2)} KB`);
console.log(`   Reducción: ${((originalSize - newSize) / 1024).toFixed(2)} KB\n`);

// Guardar
fs.writeFileSync(filePath, newHtml, 'utf8');

console.log(`✅ Archivo guardado: culiacan/index.html\n`);
console.log(`🎉 Solo quedan propiedades con coordenadas válidas!\n`);
