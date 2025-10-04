const fs = require('fs');
const PropertyPageGenerator = require('./automation/generador-de-propiedades');

const config = {
    key: 'san-francisco-la-primavera',
    title: 'Casa en Renta San Francisco Sur La Primavera',
    price: '$28,000',
    bedrooms: 3,
    bathrooms: 3.5,
    area: 182,
    landArea: 170,
    locationShort: 'San Francisco Sur, La Primavera',
    photoCount: 22
};

const generator = new PropertyPageGenerator(true); // isRental = true
const card = generator.generatePropertyCard(config, 'culiacan/index.html');

// Leer culiacan/index.html
const htmlPath = 'culiacan/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// Insertar tarjeta al inicio del grid (después de <div id="properties-container" class="grid...)
const insertPoint = html.indexOf('<div id="properties-container" class="grid');
const gridEnd = html.indexOf('>', insertPoint) + 1;

// Insertar después del opening tag del grid
html = html.slice(0, gridEnd) + '\n            ' + card + '\n' + html.slice(gridEnd);

fs.writeFileSync(htmlPath, html, 'utf8');

console.log('✅ Tarjeta insertada en culiacan/index.html');
console.log(`   • Tipo: RENTA (badge naranja bg-orange-500)`);
console.log(`   • Precio: ${config.price}/mes`);
console.log(`   • Link: ../casa-renta-san-francisco-la-primavera-$28,000.html`);
