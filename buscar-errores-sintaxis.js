const fs = require('fs');

const html = fs.readFileSync('culiacan/index.html', 'utf8');
const lines = html.split('\n');

console.log('🔍 Buscando errores de sintaxis JavaScript...\n');

const errors = [];

for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    // Buscar } seguido de const/let/var
    if (line.trim().endsWith('}') && !line.trim().endsWith('};') && !line.trim().endsWith('},')) {
        if (nextLine.trim().match(/^(const|let|var)\s/)) {
            errors.push({
                lineNum: i + 1,
                line: line.trim().substring(Math.max(0, line.trim().length - 60)),
                nextLine: nextLine.trim().substring(0, 60),
                type: 'Missing semicolon after }'
            });
        }
    }
}

console.log(`Encontrados ${errors.length} errores potenciales:\n`);

errors.forEach((err, idx) => {
    console.log(`${idx + 1}. Línea ${err.lineNum}: ${err.type}`);
    console.log(`   Línea actual: ...${err.line}`);
    console.log(`   Línea siguiente: ${err.nextLine}...`);
    console.log('');
});

console.log(`\n✅ Total: ${errors.length} errores encontrados`);
