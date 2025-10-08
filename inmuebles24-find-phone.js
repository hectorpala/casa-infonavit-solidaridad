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
    
    // Buscar en TODO el HTML incluyendo scripts
    const phoneData = await page.evaluate(() => {
        // Buscar en HTML completo
        const html = document.documentElement.innerHTML;
        
        // Buscar 6671603643 o variantes
        const patterns = [
            /6671603643/g,
            /667\s*1\s*60\s*36\s*43/g,
            /667-1-60-36-43/g,
            /"phone":\s*"([^"]+)"/g,
            /"telefono":\s*"([^"]+)"/g
        ];
        
        const found = [];
        patterns.forEach((pattern, i) => {
            const matches = html.match(pattern);
            if (matches) {
                found.push({ pattern: i, matches: matches });
            }
        });
        
        return found;
    });
    
    console.log('🔍 Búsqueda de teléfono en HTML:');
    if (phoneData.length > 0) {
        phoneData.forEach(item => {
            console.log(`\n   Patrón ${item.pattern}:`);
            item.matches.forEach(m => console.log('   -', m));
        });
    } else {
        console.log('   ❌ Teléfono NO encontrado en HTML');
        console.log('   ℹ️  Probablemente se carga dinámicamente al hacer clic');
    }
    
    await browser.close();
})();
