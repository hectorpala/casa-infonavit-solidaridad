const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // User agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('🔍 Accediendo a página 5...');
    await page.goto('https://propiedades.com/culiacan/residencial-venta/de-1000000-a-2000000-pesos?pagina=5', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Esperar a que carguen los listings
    await page.waitForSelector('a[href*="/inmuebles/"]', { timeout: 30000 });

    console.log('📋 Extrayendo URLs de propiedades...');
    const urls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links
            .map(a => a.href)
            .filter(href => href && href.includes('/inmuebles/'))
            .filter((v, i, a) => a.indexOf(v) === i) // Únicos
            .map(url => url.split('#')[0]); // Limpiar hash
    });

    console.log(`✅ Encontradas ${urls.length} URLs`);

    // Filtrar terrenos
    const casasDeptos = urls.filter(url => !url.includes('terreno'));
    console.log(`✅ Filtradas ${casasDeptos.length} casas/departamentos (excluidos ${urls.length - casasDeptos.length} terrenos)`);

    // Guardar
    fs.writeFileSync('page5-urls.json', JSON.stringify(casasDeptos, null, 2));
    console.log('💾 Guardado en page5-urls.json');

    await browser.close();
})();
