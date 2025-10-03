const fs = require('fs');
let html = fs.readFileSync('culiacan/index.html', 'utf8');

console.log('🔧 Cambiando TODOS los badges de VENTA a verde...\n');

// Obtener todas las tarjetas
const allCardsPattern = /<!-- BEGIN CARD-ADV ([^>]+?) -->([\s\S]*?)<!-- END CARD-ADV \1 -->/g;

let ventaCount = 0;
let rentaCount = 0;
let matches = [];

// Primero recolectar todos los matches
let match;
while ((match = allCardsPattern.exec(html)) !== null) {
  matches.push(match);
}

// Procesar de atrás hacia adelante para no afectar los índices
for (let i = matches.length - 1; i >= 0; i--) {
  const [fullMatch, slug, cardContent] = matches[i];

  // Verificar si es RENTA (tiene /mes o casa-renta en el slug)
  const isRenta = cardContent.includes('/mes') || slug.includes('casa-renta');

  if (isRenta) {
    // Asegurar que las rentas tengan bg-orange-500
    if (!cardContent.includes('bg-orange-500')) {
      const updatedCard = cardContent.replace(/bg-green-600/g, 'bg-orange-500');
      html = html.replace(fullMatch, `<!-- BEGIN CARD-ADV ${slug} -->${updatedCard}<!-- END CARD-ADV ${slug} -->`);
    }
    rentaCount++;
  } else {
    // Es VENTA - cambiar a bg-green-600
    if (cardContent.includes('bg-orange-500')) {
      const updatedCard = cardContent.replace(/bg-orange-500/g, 'bg-green-600');
      html = html.replace(fullMatch, `<!-- BEGIN CARD-ADV ${slug} -->${updatedCard}<!-- END CARD-ADV ${slug} -->`);
      ventaCount++;
      console.log(`✅ VENTA: ${slug} → bg-green-600`);
    }
  }
}

console.log(`\n📊 Resumen:`);
console.log(`   - Badges VENTA (verde): ${ventaCount}`);
console.log(`   - Badges RENTA (naranja): ${rentaCount}`);

// Actualizar filtro
const oldFilterCode = `const priceText = card.querySelector('.bg-orange-500')?.textContent || '';`;
const newFilterCode = `const priceText = card.querySelector('.bg-orange-500, .bg-green-600')?.textContent || '';`;

if (html.includes(oldFilterCode)) {
  html = html.replace(oldFilterCode, newFilterCode);
  console.log('\n✅ Filtro actualizado para detectar ambos colores');
}

fs.writeFileSync('culiacan/index.html', html);
console.log('✅ Cambios guardados en culiacan/index.html\n');
