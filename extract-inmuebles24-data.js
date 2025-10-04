const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('https://www.inmuebles24.com/propiedades/clasificado/alclcain-se-renta-casa-en-san-francisco-sur-la-primavera-147631841.html', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    const data = await page.evaluate(() => {
        const extractText = (selector) => {
            const el = document.querySelector(selector);
            return el ? el.textContent.trim() : null;
        };
        
        return {
            allH1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
            allH2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()),
            allH3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim()),
            allPrices: Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent.match(/\$\s*[\d,\.]+/)
            ).map(el => el.textContent.trim()).slice(0, 10),
            bodyText: document.body.textContent.substring(0, 2000)
        };
    });
    
    console.log(JSON.stringify(data, null, 2));
    
    await browser.close();
})();
