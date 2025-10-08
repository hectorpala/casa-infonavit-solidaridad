const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-venta-de-casa-por-calle-mariano-escobedo-centro-de-la-143508352.html', {
        waitUntil: 'networkidle2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const specs = await page.evaluate(() => {
        const results = {};
        
        // Buscar TODOS los elementos de texto que puedan contener especificaciones
        const allText = document.body.innerText;
        
        // Buscar m² totales (lote/terreno)
        const totalMatch = allText.match(/(\d+(?:[.,]\d+)?)\s*m²?\s*totales?/i);
        if (totalMatch) results.lote = totalMatch[1];
        
        // Buscar m² cubiertos (construcción)
        const cubiertosMatch = allText.match(/(\d+(?:[.,]\d+)?)\s*m²?\s*cubiertos?/i);
        if (cubiertosMatch) results.construccion = cubiertosMatch[1];
        
        // Buscar recámaras/dormitorios
        const recamarasMatch = allText.match(/(\d+)\s*(?:recámaras?|dormitorios?)/i);
        if (recamarasMatch) results.recamaras = recamarasMatch[1];
        
        // Buscar baños
        const banosMatch = allText.match(/(\d+)\s*baños?/i);
        if (banosMatch) results.banos = banosMatch[1];
        
        // Buscar estacionamiento/cochera
        const estacionamientoMatch = allText.match(/(\d+)\s*(?:estacionamientos?|cocheras?)/i);
        if (estacionamientoMatch) results.estacionamiento = estacionamientoMatch[1];
        
        // Buscar edad (para descartar)
        const edadMatch = allText.match(/(\d+)\s*años?/i);
        if (edadMatch) results.edad = edadMatch[1];
        
        return results;
    });
    
    console.log('\n📊 ESPECIFICACIONES ENCONTRADAS (debajo del mapa):');
    console.log(`🏞️  m² Lote (totales): ${specs.lote || 'NO ENCONTRADO'}`);
    console.log(`📐 m² Construcción (cubiertos): ${specs.construccion || 'NO ENCONTRADO'}`);
    console.log(`🛏️  Recámaras: ${specs.recamaras || 'NO ENCONTRADO'}`);
    console.log(`🛁 Baños: ${specs.banos || 'NO ENCONTRADO'}`);
    console.log(`🚗 Estacionamiento: ${specs.estacionamiento || 'NO ENCONTRADO'}`);
    console.log(`⚠️  Edad (DESCARTAR): ${specs.edad || 'NO ENCONTRADO'}`);
    
    await browser.close();
})();
