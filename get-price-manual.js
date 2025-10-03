const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcapa-se-vende-casa-en-san-javier-la-primavera-147562939.html', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    console.log('\n🔍 Buscando precio abajo de las fotos...\n');

    // Wait for content
    await page.waitForTimeout(3000);

    // Extract ALL text that contains "Venta" and numbers
    const priceData = await page.evaluate(() => {
        const results = [];

        // Find all elements containing "Venta"
        const ventaElements = Array.from(document.querySelectorAll('*')).filter(el =>
            el.textContent.includes('Venta') && el.children.length === 0
        );

        ventaElements.forEach(el => {
            const parent = el.parentElement;
            const siblings = parent ? Array.from(parent.children) : [];

            results.push({
                element: el.textContent.trim(),
                parent: parent ? parent.textContent.trim() : '',
                siblings: siblings.map(s => s.textContent.trim()).join(' | ')
            });
        });

        // Also search for price patterns
        const pricePattern = /\$\s*([\d,\.]+)/g;
        const bodyText = document.body.textContent;
        const matches = [...bodyText.matchAll(pricePattern)];

        return {
            ventaElements: results.slice(0, 5), // First 5 matches
            priceMatches: matches.slice(0, 10).map(m => m[0])
        };
    });

    console.log('📊 Elementos con "Venta":');
    priceData.ventaElements.forEach((item, i) => {
        console.log(`\n${i + 1}. Element: ${item.element}`);
        console.log(`   Parent: ${item.parent.substring(0, 200)}`);
    });

    console.log('\n\n💰 Precios encontrados en la página:');
    priceData.priceMatches.forEach((price, i) => {
        console.log(`${i + 1}. ${price}`);
    });

    await browser.close();
})();
