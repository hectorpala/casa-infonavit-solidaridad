const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('🌐 Navegando a Inmuebles24...');
    await page.goto('https://www.inmuebles24.com/casas-en-venta-en-culiacan.html', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('📝 Título:', await page.title());
    console.log('🔗 URL actual:', page.url());
    
    const links = await page.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll('a'));
        return {
            total: allLinks.length,
            withHref: allLinks.filter(a => a.href).length,
            propiedades: allLinks.filter(a => a.href && a.href.includes('propiedades')).length,
            sample: allLinks.slice(0, 10).map(a => ({
                href: a.href,
                text: a.textContent.trim().substring(0, 50)
            }))
        };
    });
    
    console.log('📊 Links encontrados:');
    console.log('   Total:', links.total);
    console.log('   Con href:', links.withHref);
    console.log('   De propiedades:', links.propiedades);
    console.log('\n📋 Muestra de links:');
    links.sample.forEach((link, i) => {
        console.log(`   ${i+1}. ${link.href}`);
        console.log(`      "${link.text}"`);
    });
    
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
})();
