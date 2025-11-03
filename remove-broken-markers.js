#!/usr/bin/env node

/**
 * Elimina bloques de marcadores que referencian Property objects inexistentes
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'culiacan/index.html');

console.log('🗑️  Eliminando marcadores con referencias rotas...\n');

let html = fs.readFileSync(filePath, 'utf8');
const lines = html.split('\n');

// Lista de propiedades sin definición
const brokenProps = [
    'casa_en_venta',
    'casa_en_interlomas',
    'casa_en_venta_interlomas_culiacan',
    'casa_en_venta_en_fraccionamiento_interlomas',
    'casa_en_los_pinos',
    'casa_en_venta_en_priv_valle_alto',
    'tu_hogar_ideal_casa_en_venta_moderna_en_privada',
    'casa_en_venta_6_recamaras_culiacan',
    'casa_en_nuevo_culiacan',
    'se_vende_casa',
    'casa_en_fraccionamiento_hacienda_los_huertos'
];

const toRemove = [];

// Buscar cada propiedad
brokenProps.forEach(propName => {
    // Verificar si existe la definición
    const defPattern = new RegExp(`const\\s+${propName}Property\\s*=\\s*\\{`);
    if (html.match(defPattern)) {
        console.log(`✅ ${propName} - Definición existe, no eliminar`);
        return;
    }

    console.log(`❌ ${propName} - Sin definición`);

    // Buscar líneas del bloque de marcador
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detectar línea Position
        const posPattern = new RegExp(`const\\s+${propName}Position`);
        if (posPattern.test(line)) {
            // Buscar el comentario anterior
            let startLine = i - 1;
            while (startLine >= 0 && !lines[startLine].includes('//')) {
                startLine--;
            }

            if (startLine < 0) startLine = i;

            // Buscar el console.log siguiente
            let endLine = i;
            while (endLine < lines.length && !lines[endLine].includes('console.log')) {
                endLine++;
            }

            toRemove.push({
                propertyName: propName,
                startLine: startLine,
                endLine: endLine
            });

            console.log(`   🔍 Encontrado en líneas ${startLine + 1}-${endLine + 1}`);
            break;
        }
    }
});

console.log(`\n📊 Total a eliminar: ${toRemove.length} bloques\n`);

// Ordenar de mayor a menor para no afectar índices
toRemove.sort((a, b) => b.startLine - a.startLine);

// Eliminar bloques
toRemove.forEach(block => {
    console.log(`🗑️  Eliminando ${block.propertyName} (líneas ${block.startLine + 1}-${block.endLine + 1})`);

    for (let i = block.startLine; i <= block.endLine + 1; i++) {
        lines[i] = null;
    }
});

// Reconstruir HTML
const newHtml = lines.filter(line => line !== null).join('\n');

const originalSize = html.length;
const newSize = newHtml.length;

console.log(`\n📝 Estadísticas:\n`);
console.log(`   Bloques eliminados: ${toRemove.length}`);
console.log(`   Tamaño original: ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`   Tamaño nuevo: ${(newSize / 1024).toFixed(2)} KB`);
console.log(`   Reducción: ${((originalSize - newSize) / 1024).toFixed(2)} KB\n`);

// Guardar
fs.writeFileSync(filePath, newHtml, 'utf8');

console.log('✅ Archivo guardado: culiacan/index.html\n');
console.log('🎉 Referencias rotas eliminadas!\n');
