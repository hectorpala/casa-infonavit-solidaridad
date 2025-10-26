const fs = require('fs');
const db = JSON.parse(fs.readFileSync('inmuebles24-scraped-properties.json', 'utf8'));

// Filtrar propiedades SIN coordenadas
const sinCoords = db.filter(p => !p.lat || !p.lng);

// Identificar ciudad por URL o ubicación
const culiacanProps = sinCoords.filter(p => {
    const url = p.url || '';
    const location = p.location || '';
    const title = p.title || '';

    // Detectar Culiacán por URL o texto
    const isCuliacan =
        url.includes('culiacan') ||
        location.includes('Culiacán') ||
        location.includes('Culiacan') ||
        location.includes('Sinaloa') ||
        title.includes('Culiacán') ||
        title.includes('Culiacan');

    // Excluir Monterrey y Mazatlán
    const isMonterrey =
        url.includes('monterrey') ||
        location.includes('Monterrey') ||
        location.includes('Nuevo León');

    const isMazatlan =
        url.includes('mazatlan') ||
        location.includes('Mazatlán') ||
        location.includes('Mazatlan');

    return isCuliacan && !isMonterrey && !isMazatlan;
});

const monterreyProps = sinCoords.filter(p => {
    const url = p.url || '';
    const location = p.location || '';
    return url.includes('monterrey') || location.includes('Monterrey');
});

const mazatlanProps = sinCoords.filter(p => {
    const url = p.url || '';
    const location = p.location || '';
    return url.includes('mazatlan') || location.includes('Mazatlán');
});

console.log('📊 RESUMEN DE PROPIEDADES SIN COORDENADAS:\n');
console.log(`🏙️  Culiacán: ${culiacanProps.length} propiedades`);
console.log(`🏙️  Monterrey: ${monterreyProps.length} propiedades`);
console.log(`🏙️  Mazatlán: ${mazatlanProps.length} propiedades`);
console.log(`📦 Total: ${sinCoords.length}\n`);

console.log('=' .repeat(80));
console.log('🏠 PROPIEDADES DE CULIACÁN SIN COORDENADAS:\n');

culiacanProps.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
    console.log(`   🆔 ID: ${p.propertyId}`);
    console.log(`   📍 Ubicación: ${p.location || 'N/A'}`);
    console.log(`   🔗 URL: ${p.url}`);
    console.log('');
});

console.log('=' .repeat(80));
console.log(`\n✅ ${culiacanProps.length} propiedades de Culiacán listas para re-scrapear con Gazetteer V1.5\n`);
