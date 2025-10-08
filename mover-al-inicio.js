const fs = require('fs');

const indexPath = 'culiacan/index.html';
let html = fs.readFileSync(indexPath, 'utf8');

// IDs de las propiedades a mover al inicio
const slugsToMove = [
    'venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad',
    'casa-en-venta-la-cantera-culiacan'
];

// Extraer tarjetas
const cards = [];
slugsToMove.forEach(slug => {
    const startComment = `<!-- BEGIN CARD-ADV ${slug} -->`;
    const endComment = `<!-- END CARD-ADV ${slug} -->`;

    const startIndex = html.indexOf(startComment);
    const endIndex = html.indexOf(endComment, startIndex);

    if (startIndex !== -1 && endIndex !== -1) {
        const card = html.substring(startIndex, endIndex + endComment.length);
        cards.push(card);

        // Remover del HTML
        html = html.replace(card + '\n\n', '');
        console.log(`✅ Extraída tarjeta: ${slug}`);
    } else {
        console.log(`❌ No encontrada: ${slug}`);
    }
});

// Encontrar el primer BEGIN CARD-ADV
const firstCardMatch = html.match(/<!-- BEGIN CARD-ADV [a-z0-9-]+ -->/);
if (firstCardMatch) {
    const firstCardIndex = html.indexOf(firstCardMatch[0]);

    // Insertar las tarjetas ANTES de la primera tarjeta
    const cardsToInsert = cards.join('\n\n') + '\n\n            ';
    html = html.substring(0, firstCardIndex) + cardsToInsert + html.substring(firstCardIndex);

    console.log(`\n✅ Tarjetas movidas al inicio (antes de "${firstCardMatch[0]}")\n`);
} else {
    console.log('❌ No se encontró la primera tarjeta');
}

// Guardar
fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ Archivo guardado: culiacan/index.html\n');
