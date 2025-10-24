const fs = require('fs');

// Read the database
const db = JSON.parse(fs.readFileSync('inmuebles24-scraped-properties.json', 'utf8'));

// Filter out property 147711585
const filtered = db.filter(p => p.propertyId != '147711585');

// Write back
fs.writeFileSync('inmuebles24-scraped-properties.json', JSON.stringify(filtered, null, 2));

console.log(`✅ Removed property 147711585. Count: ${db.length} → ${filtered.length}`);
