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
    
    const priceDebug = await page.evaluate(() => {
        const results = [];
        
        // Buscar TODOS los elementos que contengan "MN" o "$"
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const text = el.textContent.trim();
            if ((text.includes('MN') || text.includes('$')) && text.length < 50) {
                results.push({
                    tag: el.tagName,
                    class: el.className,
                    text: text,
                    children: el.children.length
                });
            }
        });
        
        return results;
    });
    
    console.log('💰 TODOS los precios encontrados:');
    priceDebug.forEach((item, i) => {
        console.log(`\n${i+1}. <${item.tag}> class="${item.class}"`);
        console.log(`   Text: "${item.text}"`);
        console.log(`   Children: ${item.children}`);
    });
    
    await browser.close();
})();
