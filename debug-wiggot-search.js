const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('🔍 Navegando a búsqueda...');
    await page.goto('https://new.wiggot.com/search?constructionType=house&priceTo=6000000&operation=SALE', {
        waitUntil: 'networkidle2'
    });

    await wait(10000); // Esperar 10 segundos para que cargue

    console.log('\n📸 Tomando screenshot...');
    await page.screenshot({ path: 'debug-search.png', fullPage: true });

    console.log('\n🔍 Buscando property-detail links...');
    const links = await page.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll('a'));
        return allLinks
            .filter(a => a.href && a.href.includes('property-detail'))
            .map(a => a.href);
    });

    console.log(`\n✅ Encontrados ${links.length} links:`);
    links.forEach((link, i) => {
        console.log(`${i + 1}. ${link}`);
    });

    console.log('\n⏸️  Dejando navegador abierto 30 segundos para inspección...');
    await wait(30000);

    await browser.close();
})();
