#!/usr/bin/env node

/**
 * Encuentra y elimina bloques de marcadores que referencian
 * objetos Property que ya no existen
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'culiacan/index.html');

console.log('🔍 Buscando referencias rotas...\n');

const html = fs.readFileSync(filePath, 'utf8');

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

console.log(`📋 Propiedades sin definición: ${brokenProps.length}\n`);

let newHtml = html;
let removedCount = 0;

brokenProps.forEach((propName, index) => {
    // Verificar si existe la definición const XXXProperty = {
    const propDefPattern = new RegExp(`const\\s+${propName}Property\\s*=\\s*\\{`, 'm');
    const hasDefinition = propDefPattern.test(html);

    if (hasDefinition) {
        console.log(`✅ [${index + 1}/${brokenProps.length}] ${propName} - Definición EXISTE (no eliminar)`);
        return;
    }

    console.log(`❌ [${index + 1}/${brokenProps.length}] ${propName} - Sin definición, buscando usos...`);

    // Buscar bloques que usan esta propiedad
    // Patrón: desde comentario hasta console.log
    const blockPattern = new RegExp(
        `// ${propName.replace(/_/g, '[_ ]')}[^\\n]*\\n` +
        `[\\s\\S]*?` +
        `const ${propName}Marker = new ${propName}MarkerClass[^;]+;\\s*\\n` +
        `\\s*window\\.allCuliacanMarkers\\.push\\(${propName}Marker\\);\\s*\\n` +
        `\\s*console\\.log\\([^)]+\\);`,
        'g'
    );

    const matches = newHtml.match(blockPattern);

    if (matches) {
        matches.forEach(match => {
            newHtml = newHtml.replace(match, '');
            removedCount++;
            console.log(`   🗑️  Eliminado bloque de uso (${match.length} chars)`);
        });
    } else {
        console.log(`   ⚠️  No se encontraron bloques de uso con el patrón estándar`);
    }
});

console.log(`\n📊 Resumen:\n`);
console.log(`   Bloques eliminados: ${removedCount}`);

const originalSize = html.length;
const newSize = newHtml.length;

console.log(`   Tamaño original: ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`   Tamaño nuevo: ${(newSize / 1024).toFixed(2)} KB`);
console.log(`   Reducción: ${((originalSize - newSize) / 1024).toFixed(2)} KB\n`);

if (removedCount > 0) {
    fs.writeFileSync(filePath, newHtml, 'utf8');
    console.log('✅ Archivo guardado: culiacan/index.html\n');
} else {
    console.log('⚠️  No se encontraron bloques para eliminar.\n');
    console.log('💡 Intentando método alternativo...\n');
}
