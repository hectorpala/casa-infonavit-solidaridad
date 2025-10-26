const fs = require('fs');

console.log('🔍 VERIFICACIÓN FINAL - FIX GEOLOCALIZACIÓN V1.5\n');

const db = JSON.parse(fs.readFileSync('inmuebles24-scraped-properties.json', 'utf8'));
const property = db.find(p => p.propertyId === '147501147');

if (!property) {
    console.log('❌ ERROR: Propiedad 147501147 NO encontrada en el JSON\n');
    process.exit(1);
}

console.log('✅ Propiedad encontrada en el JSON\n');
console.log('📊 CAMPOS DE GEOLOCALIZACIÓN V1.5:\n');

const checks = {
    lat: property.lat !== undefined,
    lng: property.lng !== undefined,
    locationPrecision: property.locationPrecision !== undefined,
    locationSource: property.locationSource !== undefined,
    colonia: property.colonia !== undefined,
    codigoPostal: property.codigoPostal !== undefined
};

console.log(`   ${checks.lat ? '✅' : '❌'} lat: ${property.lat || '❌ FALTA'}`);
console.log(`   ${checks.lng ? '✅' : '❌'} lng: ${property.lng || '❌ FALTA'}`);
console.log(`   ${checks.locationPrecision ? '✅' : '❌'} locationPrecision: ${property.locationPrecision || '❌ FALTA'}`);
console.log(`   ${checks.locationSource ? '✅' : '❌'} locationSource: ${property.locationSource || '❌ FALTA'}`);
console.log(`   ${checks.colonia ? '✅' : '❌'} colonia: ${property.colonia || '❌ FALTA'}`);
console.log(`   ${checks.codigoPostal ? '✅' : '❌'} codigoPostal: ${property.codigoPostal || '❌ FALTA'}`);

const allFieldsPresent =
    checks.lat &&
    checks.lng &&
    checks.locationPrecision &&
    checks.locationSource;

console.log(`\n📊 ESTADO: ${allFieldsPresent ? '✅ PIPELINE V1.5 COMPLETO' : '❌ PIPELINE V1.5 INCOMPLETO'}\n`);

if (allFieldsPresent) {
    console.log('🎉 ¡FIX VERIFICADO! Los datos de geolocalización se guardaron correctamente.\n');
    console.log('📋 OBJETO COMPLETO GUARDADO:\n');
    console.log(JSON.stringify(property, null, 2));
} else {
    console.log('❌ ERROR: Algunos campos faltan. El fix NO funcionó correctamente.\n');
    process.exit(1);
}
