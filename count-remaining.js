const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    const url = 'https://propiedades.com/venta/sinaloa/culiacan?precio_desde=1000000&precio_hasta=2000000';
    console.log('🔍 Analizando URL original...');
    console.log(url);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Esperar que cargue el contenido
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Contar total de resultados
    const totalResults = await page.evaluate(() => {
        // Buscar el contador de resultados
        const counter = document.querySelector('[class*="result"], [class*="total"], h1, h2');
        if (counter) return counter.textContent;
        
        // Contar tarjetas de propiedades
        const cards = document.querySelectorAll('[class*="card"], [class*="listing"], [class*="propiedad"]');
        return `${cards.length} propiedades en esta página`;
    });
    
    console.log('\n📊 Resultados:');
    console.log(totalResults);
    
    await browser.close();
})();
