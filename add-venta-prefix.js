const fs = require('fs');

let html = fs.readFileSync('culiacan/index.html', 'utf8');

// Encontrar todos los badges naranjas que NO tengan "/mes" (son VENTA)
// y agregarles el prefijo "VENTA "
let count = 0;

html = html.replace(
  /(bg-orange-500[^>]+>\s*)(\$[\d,]+)\s*(\n)/g,
  (match, before, price, newline) => {
    // Skip si ya tiene VENTA o tiene /mes (es renta)
    if (match.includes('VENTA') || html.indexOf(match + '/mes') !== -1) {
      return match;
    }

    // Verificar que NO sea una línea con /mes inmediatamente después
    const afterMatch = html.substring(html.indexOf(match) + match.length, html.indexOf(match) + match.length + 10);
    if (afterMatch.includes('/mes')) {
      return match;
    }

    count++;
    return `${before}VENTA ${price}${newline}`;
  }
);

fs.writeFileSync('culiacan/index.html', html);
console.log(`✅ Agregado prefijo "VENTA" a ${count} badges de venta naranjas`);
