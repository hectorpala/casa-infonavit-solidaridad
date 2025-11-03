const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('🚀 Extrayendo URLs de Inmuebles24...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  console.log('📍 Navegando a la página de búsqueda...');
  await page.goto('https://www.inmuebles24.com/casas-en-venta-en-culiacan-de-4300000-a-4400000-pesos.html', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });
  
  // Esperar a que cargue el contenido
  await page.waitForTimeout(5000);
  
  // Intentar múltiples selectores
  const urls = await page.evaluate(() => {
    const selectors = [
      'a[data-qa="posting PROPERTY"]',
      'a[data-id*="classified"]',
      'a[href*="veclcain"]',
      'a[href*="/propiedades/"]',
      '.postings-container a',
      '[data-to-posting] a'
    ];
    
    let allLinks = [];
    
    for (const selector of selectors) {
      const links = Array.from(document.querySelectorAll(selector));
      if (links.length > 0) {
        console.log('Selector funcionó:', selector, '→', links.length, 'links');
        allLinks = allLinks.concat(links.map(l => l.href));
      }
    }
    
    // Filtrar solo URLs de propiedades
    const propertyUrls = allLinks.filter(url => 
      url.includes('/propiedades/clasificado/') || 
      url.includes('veclcain')
    );
    
    return [...new Set(propertyUrls)];
  });
  
  await browser.close();
  
  console.log('\n📊 URLs extraídas:', urls.length, '\n');
  
  if (urls.length === 0) {
    console.log('❌ No se encontraron URLs. Verifica manualmente la página.');
    return;
  }
  
  // Cargar base de datos
  const db = JSON.parse(fs.readFileSync('inmuebles24-scraped-properties.json', 'utf8'));
  
  const results = { nuevas: [], duplicadas: [] };
  
  urls.forEach(url => {
    const match = url.match(/-(\d+)\.html/);
    if (!match) return;
    
    const propertyId = match[1];
    const exists = db.find(p => p.propertyId === propertyId);
    
    if (exists) {
      results.duplicadas.push({ url, propertyId, title: exists.title, slug: exists.slug });
    } else {
      results.nuevas.push({ url, propertyId });
    }
  });
  
  console.log('═══════════════════════════════════════');
  console.log('📊 AUDITORÍA');
  console.log('═══════════════════════════════════════\n');
  console.log('✅ Nuevas:', results.nuevas.length);
  console.log('🔄 Ya tenemos:', results.duplicadas.length);
  console.log('');
  
  if (results.nuevas.length > 0) {
    console.log('\n🆕 PROPIEDADES NUEVAS:\n');
    results.nuevas.forEach((p, i) => {
      console.log(`${i+1}. ID: ${p.propertyId}`);
      console.log(`   ${p.url}\n`);
    });
    
    fs.writeFileSync('urls-nuevas-4.3M-4.4M.json', JSON.stringify({
      metadata: { generadoEn: new Date().toISOString(), totalNuevas: results.nuevas.length },
      urls_nuevas: results.nuevas.map(p => p.url)
    }, null, 2));
    
    console.log('💾 Guardado en: urls-nuevas-4.3M-4.4M.json');
  }
  
  if (results.duplicadas.length > 0) {
    console.log('\n🔄 YA TENEMOS:\n');
    results.duplicadas.forEach((p, i) => {
      console.log(`${i+1}. ${p.title} (ID: ${p.propertyId})`);
    });
  }
})();
