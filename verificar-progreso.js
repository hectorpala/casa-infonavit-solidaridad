const fs = require('fs');
const db = JSON.parse(fs.readFileSync('inmuebles24-scraped-properties.json', 'utf8'));

// Verificar última propiedad
const tabachines = db.find(p => p.propertyId === '147701128');

console.log('✅ Casa Tabachines - Recursos Hidráulicos:\n');
if (tabachines) {
    console.log('📍 Coordenadas:', tabachines.lat, tabachines.lng);
    console.log('🎯 Precisión:', tabachines.locationPrecision);
    console.log('📊 Fuente:', tabachines.locationSource);
    console.log('🏘️  Colonia:', tabachines.colonia);
    console.log('📮 CP:', tabachines.codigoPostal);
} else {
    console.log('❌ No encontrada');
}

console.log('\n📊 PROGRESO TOTAL:');
const conCoords = db.filter(p => p.lat && p.lng).length;
const sinCoords = db.filter(p => !p.lat || !p.lng).length;
console.log(`   ✅ CON coordenadas: ${conCoords}`);
console.log(`   ❌ SIN coordenadas: ${sinCoords}`);
console.log(`   📦 Total: ${db.length}`);

console.log('\n🏙️  PROPIEDADES DE CULIACÁN CON COORDENADAS V1.5:\n');
const culiacanConCoords = db.filter(p => {
    if (!p.lat || !p.lng) return false;
    const hasColonia = !!p.colonia;
    const hasSource = p.locationSource === 'geocoder' || p.locationSource === 'google-geocoding-api-v1.5';
    return hasColonia && hasSource;
});

culiacanConCoords.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
    console.log(`   🏘️  ${p.colonia} (CP: ${p.codigoPostal || 'N/A'})`);
    console.log(`   🎯 ${p.locationPrecision} (${p.locationSource})`);
    console.log('');
});

console.log(`✅ Total Culiacán con coords V1.5: ${culiacanConCoords.length}`);
