const fs = require('fs');
const db = JSON.parse(fs.readFileSync('inmuebles24-scraped-properties.json', 'utf8'));
const filtered = db.filter(p => p.propertyId !== '147564220');
fs.writeFileSync('inmuebles24-scraped-properties.json', JSON.stringify(filtered, null, 2));
console.log('✅ Propiedad 147564220 eliminada para re-scrapear');
console.log(`📊 Total propiedades: ${filtered.length}`);
