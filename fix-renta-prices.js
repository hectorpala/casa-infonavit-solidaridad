const fs = require('fs');

const html = fs.readFileSync('culiacan/index.html', 'utf8');

const replacements = [
  { slug: 'valle-alto-712258', price: '$14,000' },
  { slug: 'portabelo-742687', price: '$11,000' },
  { slug: 'desarrollo-urbano-3-rios-806900', price: '$13,500' },
  { slug: 'culiacan-tres-rios-937431', price: '$13,000' },
  { slug: 'la-altea-i-839267', price: '$28,500' },
  { slug: 'portalegre-871021', price: '$14,000' },
  { slug: 'villa-del-cedro-983772', price: '$10,800' }
];

let result = html;

replacements.forEach(({slug, price}) => {
  // Buscar el patrón en el badge de la tarjeta específica
  const regex = new RegExp(
    `(BEGIN CARD-ADV casa-renta-${slug}[\\s\\S]{1,500}bg-orange-500[^>]+>\\s*)${price.replace('$', '\\$')}(<)`,
    'g'
  );
  result = result.replace(regex, `$1${price}/mes$2`);
});

fs.writeFileSync('culiacan/index.html', result);
console.log('✅ Agregado /mes a 7 tarjetas de renta');
