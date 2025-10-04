const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://www.inmuebles24.com/propiedades/clasificado/alclcain-se-renta-casa-en-san-francisco-sur-la-primavera-147631841.html', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
    } catch(e) {}
    
    await new Promise(r => setTimeout(r, 10000));
    
    console.log('\n⏸️  Navegador abierto. Presiona ENTER cuando veas el precio...');
    await new Promise(r => process.stdin.once('data', r));
    
    const precio = await page.evaluate(() => {
        const text = document.body.textContent;
        const match = text.match(/\$\s*([\d,]+)/);
        return match ? match[0] : 'NO ENCONTRADO';
    });
    
    console.log(`\n💰 Precio encontrado: ${precio}`);
    
    await browser.close();
})();
