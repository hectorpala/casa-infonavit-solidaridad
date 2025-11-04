const fs = require('fs');

const data = JSON.parse(fs.readFileSync('colonias-los-mochis.json', 'utf8'));

console.log('LOS MOCHIS - DESGLOSE POR TIPO:\n');

const porTipo = data.colonias.reduce((acc, col) => {
    acc[col.tipo] = (acc[col.tipo] || 0) + 1;
    return acc;
}, {});

console.log('TOTALES:');
Object.entries(porTipo)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tipo, count]) => {
        console.log(`  ${tipo}: ${count}`);
    });

const colonias = porTipo['COLONIA'] || 0;
const fraccionamientos = porTipo['FRACCIONAMIENTO'] || 0;
const otros = data.colonias.length - colonias - fraccionamientos;

console.log('\nRESUMEN:');
console.log(`  Colonias: ${colonias}`);
console.log(`  Fraccionamientos: ${fraccionamientos}`);
console.log(`  Otros: ${otros}`);
console.log(`  ──────────`);
console.log(`  TOTAL: ${data.colonias.length}`);
