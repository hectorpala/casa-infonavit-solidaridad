const fs = require('fs');

const content = fs.readFileSync('/tmp/problematic-script.txt', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
const problems = [];

lines.forEach((line, idx) => {
    const lineNum = idx + 1 + 18447; // Offset to real line number

    // Contar llaves excluyendo strings y comentarios (simple)
    const inString = line.match(/(['"`])/g);

    // Contar llaves
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;

    braceCount += opens - closes;

    if (braceCount < 0) {
        problems.push({
            lineNum,
            line: line.trim().substring(0, 80),
            braceCount,
            message: 'Too many closing braces!'
        });
    }

    // Detectar líneas sospechosas
    if (line.trim().endsWith('};') && braceCount === 0) {
        // OK
    } else if (line.trim() === '});' && braceCount !== 0) {
        problems.push({
            lineNum,
            line: line.trim(),
            braceCount,
            message: `Closing with }); but brace count is ${braceCount}`
        });
    }
});

console.log('\n📊 ANÁLISIS DE LLAVES:\n');
console.log(`Conteo final de llaves: ${braceCount}`);

if (braceCount !== 0) {
    console.log(`\n⚠️  DESBALANCE: ${braceCount > 0 ? 'Faltan ' + braceCount + ' llaves de cierre }' : 'Sobran ' + Math.abs(braceCount) + ' llaves de cierre }'}`);
}

if (problems.length > 0) {
    console.log(`\n❌ ${problems.length} problemas detectados:\n`);
    problems.forEach((p, i) => {
        console.log(`${i + 1}. Línea ${p.lineNum}: ${p.message}`);
        console.log(`   ${p.line}`);
        console.log(`   Brace count at this point: ${p.braceCount}\n`);
    });
} else if (braceCount === 0) {
    console.log('\n✅ No se detectaron problemas obvios con llaves');
}
