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
    
    const allPrices = await page.evaluate(() => {
        // Buscar en TODO el HTML incluyendo descripción
        const bodyText = document.body.innerText;
        
        // Regex para encontrar todos los precios en formato MN, $, o texto
        const pricePatterns = [
            /MN\s*[\d,]+/gi,
            /\$\s*[\d,]+/gi,
            /Venta\s*\$?\s*([\d,]+)/gi,
            /Precio\s*\$?\s*([\d,]+)/gi
        ];
        
        const found = new Set();
        
        pricePatterns.forEach(pattern => {
            const matches = bodyText.matchAll(pattern);
            for (const match of matches) {
                found.add(match[0]);
            }
        });
        
        return Array.from(found);
    });
    
    console.log('💰 TODOS los precios/menciones encontrados en la página:');
    allPrices.forEach((price, i) => {
        console.log(`${i+1}. ${price}`);
    });
    
    await browser.close();
})();
