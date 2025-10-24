const acorn = require('acorn');
const fs = require('fs');

console.log('🔍 Validando JavaScript con Acorn (parser preciso)...\n');

// Extraer solo el script problemático
const html = fs.readFileSync('culiacan/index.html', 'utf8');
const lines = html.split('\n');

// Encontrar el script que va de línea 18448 a 19185
const scriptStart = 18447; // 0-indexed
const scriptEnd = 19185;

const scriptContent = lines.slice(scriptStart, scriptEnd).join('\n');

// Intentar parsear
try {
    acorn.parse(scriptContent, {
        ecmaVersion: 2020,
        sourceType: 'script',
        locations: true
    });
    console.log('✅ JavaScript es válido!\n');
} catch (error) {
    console.log('❌ ERROR DE SINTAXIS ENCONTRADO:\n');
    console.log(`Tipo: ${error.name}`);
    console.log(`Mensaje: ${error.message}`);

    if (error.loc) {
        const errorLine = scriptStart + error.loc.line;
        const errorColumn = error.loc.column;

        console.log(`\nLínea en archivo: ${errorLine}`);
        console.log(`Columna: ${errorColumn}\n`);

        // Mostrar contexto
        const contextStart = Math.max(0, error.loc.line - 3);
        const contextEnd = Math.min(lines.length, error.loc.line + 2);

        console.log('Contexto:');
        for (let i = contextStart; i < contextEnd; i++) {
            const lineNum = scriptStart + i + 1;
            const marker = (i === error.loc.line - 1) ? '>>> ' : '    ';
            console.log(`${marker}${lineNum}: ${lines[scriptStart + i].substring(0, 100)}`);
        }
    }

    console.log('\n' + '='.repeat(80));
}
