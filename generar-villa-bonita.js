const fs = require('fs');

// Leer datos del JSON
const datos = JSON.parse(fs.readFileSync('wiggot-datos-pODipRm.json', 'utf8')).data;

// Leer template
let html = fs.readFileSync('culiacan/casa-venta-villa-bonita-pODipRm/index.html', 'utf8');

// REEMPLAZOS GLOBALES
const replacements = {
    // Precios
    '$1,750,000': `$${datos.price}`,
    '1750000': datos.price.replace(/,/g, ''),
    '1,750,000': datos.price,

    // Títulos y nombres
    'Casa en Venta Portalegre': 'Casa en Venta Villa Bonita',
    'Portalegre': 'Villa Bonita',
    'portalegre': 'villa-bonita',
    'casa-venta-portalegre-045360': 'casa-venta-villa-bonita-pODipRm',

    // Ubicación
    'Avenida De Los Poetas 1435': 'Calle Este 220',
    'De Los Poetas 1435': 'Este 220',
    'Los Poetas 1435': 'Este 220',
    '1435': '220',

    // Áreas (Portalegre: 98m² terreno, 65m² construcción)
    '98 m²': `${datos.area_terreno} m²`,
    '98m²': `${datos.area_terreno}m²`,
    '65 m²': `${datos.area_construida} m²`,
    '65m²': `${datos.area_construida}m²`,

    // Baños (Portalegre: 1.5)
    '1.5': datos.bathrooms,

    // Recámaras (ambos tienen 2, no cambiar)

    // Descripción
    'Venta hermosa casa en venta': 'Casa en venta en Villa Bonita',
    '2 plantas': `${datos.niveles} planta${datos.niveles > 1 ? 's' : ''}`,
    '2 recamaras': `${datos.bedrooms} recámaras`,
    '1baño completo': '1 baño completo',
    '1medio baño': '1 medio baño',
    'espacio concina, sala y comedor': 'cocina integral con parrilla y campana',
    'amplio patio': 'patio trasero y pasillo lateral',
    'cochera para 2 autos': `cochera para ${datos.estacionamientos} autos`,

    // Número de fotos en carrusel (Portalegre: 14 → Villa Bonita: 14)
    'const totalSlidesHero = 14;': 'const totalSlidesHero = 14;',

    // WhatsApp message
    'Hola,%20me%20interesa%20esta%20propiedad%20en%20Portalegre': 'Hola,%20me%20interesa%20esta%20propiedad%20en%20Villa%20Bonita',
    'casa%20en%20Portalegre': 'casa%20en%20Villa%20Bonita'
};

// Aplicar todos los reemplazos
for (const [old, nuevo] of Object.entries(replacements)) {
    const regex = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    html = html.replace(regex, nuevo);
}

// Guardar HTML actualizado
fs.writeFileSync('culiacan/casa-venta-villa-bonita-pODipRm/index.html', html);

console.log('✅ Página HTML generada con éxito!');
console.log('📌 Título: Casa en Venta Villa Bonita');
console.log('💰 Precio: $' + datos.price);
console.log('📍 Ubicación: Calle Este 220, Villa Bonita, Culiacán');
console.log('🛏️  Recámaras:', datos.bedrooms);
console.log('🚿 Baños:', datos.bathrooms);
console.log('📏 Construcción:', datos.area_construida, 'm²');
console.log('📐 Terreno:', datos.area_terreno, 'm²');
console.log('📸 Fotos: 14');
