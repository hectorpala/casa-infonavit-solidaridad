const fs = require('fs');
let html = fs.readFileSync('culiacan/index.html', 'utf8');

console.log('🔧 Unificando badges de VENTA y RENTA...\n');

// PASO 1: Cambiar todos los badges de propiedades de VENTA a verde
// Buscar tarjetas que NO son de renta (no tienen /mes en el precio)
const cardPattern = /<!-- BEGIN CARD-ADV (casa-venta-[^>]+?) -->([\s\S]*?)<!-- END CARD-ADV \1 -->/g;

let ventaCount = 0;
let match;

while ((match = cardPattern.exec(html)) !== null) {
  const [fullMatch, slug, cardContent] = match;

  // Solo cambiar si NO tiene /mes (es venta)
  if (!cardContent.includes('/mes')) {
    // Cambiar bg-orange-500 a bg-green-600 en esta tarjeta
    const updatedCard = cardContent.replace(/bg-orange-500/g, 'bg-green-600');
    html = html.replace(fullMatch, `<!-- BEGIN CARD-ADV ${slug} -->${updatedCard}<!-- END CARD-ADV ${slug} -->`);
    ventaCount++;
    console.log(`✅ ${slug}: bg-orange-500 → bg-green-600`);
  }
}

console.log(`\n📊 Total badges de VENTA cambiados a verde: ${ventaCount}`);

// PASO 2: Actualizar la función de filtro para buscar AMBOS colores
const oldFilterCode = `const priceText = card.querySelector('.bg-orange-500')?.textContent || '';`;
const newFilterCode = `const priceText = card.querySelector('.bg-orange-500, .bg-green-600')?.textContent || '';`;

if (html.includes(oldFilterCode)) {
  html = html.replace(oldFilterCode, newFilterCode);
  console.log('✅ Filtro actualizado para detectar ambos colores (verde y naranja)');
} else {
  console.log('⚠️  Código de filtro no encontrado o ya actualizado');
}

fs.writeFileSync('culiacan/index.html', html);
console.log('\n✅ Unificación completa - cambios guardados en culiacan/index.html');
