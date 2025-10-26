const fs = require('fs');
const db = JSON.parse(fs.readFileSync('inmuebles24-scraped-properties.json', 'utf8'));

const sinCoords = db.filter(p => !p.lat || !p.lng);
const conCoords = db.filter(p => p.lat && p.lng);

console.log('📊 RESUMEN DE PROPIEDADES:\n');
console.log(`✅ Con coordenadas: ${conCoords.length}`);
console.log(`❌ Sin coordenadas: ${sinCoords.length}`);
console.log(`📦 Total: ${db.length}\n`);

if (sinCoords.length > 0) {
    console.log('🏠 PROPIEDADES SIN COORDENADAS:\n');
    sinCoords.forEach((p, i) => {
        console.log(`${i + 1}. ${p.title}`);
        console.log(`   🆔 ID: ${p.propertyId}`);
        console.log(`   📍 Ubicación: ${p.location}`);
        console.log(`   🔗 URL: ${p.url}`);
        console.log('');
    });
} else {
    console.log('✅ Todas las propiedades tienen coordenadas');
}
