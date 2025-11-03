const fs = require('fs');

// Cargar URLs extraídas
const extracted = JSON.parse(fs.readFileSync('urls-inmuebles24-2025-10-27-20-23-44.json', 'utf8'));
const urls = [...extracted.urls.valid, ...extracted.urls.blocked];

// Cargar base de datos
const db = JSON.parse(fs.readFileSync('inmuebles24-scraped-properties.json', 'utf8'));

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  🔍 AUDITORÍA DE URLs EXTRAÍDAS                              ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const results = {
  nuevas: [],
  duplicadas: []
};

urls.forEach(urlObj => {
  const url = urlObj.url;
  const match = url.match(/-(\d+)\.html/);

  if (!match) {
    console.log('⚠️  No se pudo extraer ID de:', url);
    return;
  }

  const propertyId = match[1];
  const exists = db.find(p => p.propertyId === propertyId);

  if (exists) {
    results.duplicadas.push({
      url,
      propertyId,
      title: exists.title,
      slug: exists.slug,
      price: exists.price
    });
  } else {
    results.nuevas.push({
      url,
      propertyId
    });
  }
});

console.log('═══════════════════════════════════════');
console.log('📊 RESUMEN:');
console.log('═══════════════════════════════════════');
console.log('Total URLs extraídas:', urls.length);
console.log('✅ URLs nuevas:', results.nuevas.length);
console.log('🔄 Ya tenemos:', results.duplicadas.length);
console.log('');

if (results.nuevas.length > 0) {
  console.log('═══════════════════════════════════════');
  console.log('🆕 PROPIEDADES NUEVAS PARA SCRAPEAR:');
  console.log('═══════════════════════════════════════\n');
  results.nuevas.forEach((prop, i) => {
    console.log(`${i+1}. Property ID: ${prop.propertyId}`);
    console.log(`   ${prop.url}\n`);
  });

  // Guardar en formato para iterador
  fs.writeFileSync('urls-nuevas-auditadas.json', JSON.stringify({
    metadata: {
      generadoEn: new Date().toISOString(),
      rangoPrecios: '$4,300,000 - $4,400,000',
      totalNuevas: results.nuevas.length
    },
    totalUrlsNuevas: results.nuevas.length,
    urls_nuevas: results.nuevas.map(p => p.url)
  }, null, 2));

  console.log('💾 URLs nuevas guardadas en: urls-nuevas-auditadas.json');
  console.log('💡 Usar con: node 1iteradorurlinmuebles24.js (renombra archivo a 1depuracionurlinmuebles24.json)\n');
}

if (results.duplicadas.length > 0) {
  console.log('\n═══════════════════════════════════════');
  console.log('🔄 YA TENEMOS ESTAS PROPIEDADES:');
  console.log('═══════════════════════════════════════\n');
  results.duplicadas.forEach((prop, i) => {
    console.log(`${i+1}. ${prop.title}`);
    console.log(`   Precio: ${prop.price}`);
    console.log(`   Slug: ${prop.slug}`);
    console.log(`   ID: ${prop.propertyId}\n`);
  });
}

console.log('═══════════════════════════════════════');
console.log(`Tasa de duplicación: ${((results.duplicadas.length / urls.length) * 100).toFixed(1)}%`);
console.log(`Tasa de propiedades nuevas: ${((results.nuevas.length / urls.length) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════════');
