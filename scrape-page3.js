const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    const url = 'https://propiedades.com/culiacan/residencial-venta/de-1000000-a-2000000-pesos?pagina=3#remates=2';
    console.log('🔍 Scrapeando página 3...');
    console.log(url);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const urls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links
            .map(a => a.href)
            .filter(href => href && href.includes('/inmuebles/'))
            .filter((v, i, a) => a.indexOf(v) === i);
    });
    
    console.log(`\n✅ Encontradas ${urls.length} URLs únicas:`);
    urls.forEach((url, i) => console.log(`${i+1}. ${url}`));
    
    fs.writeFileSync('page3-urls.json', JSON.stringify(urls, null, 2));
    console.log('\n💾 URLs guardadas en page3-urls.json');
    
    await browser.close();
})();
