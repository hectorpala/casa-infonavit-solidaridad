#!/usr/bin/env node

const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('🌐 Navegando a Los Pinos...\n');
    await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-los-pinos-142636213.html', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const iframesInfo = await page.evaluate(() => {
        const allIframes = Array.from(document.querySelectorAll('iframe'));

        return allIframes.map((iframe, idx) => ({
            index: idx + 1,
            src: iframe.src || '(sin src)',
            title: iframe.title || '(sin title)',
            id: iframe.id || '(sin id)',
            className: iframe.className || '(sin class)',
            width: iframe.width || iframe.style.width || '(auto)',
            height: iframe.height || iframe.style.height || '(auto)',
            loading: iframe.loading || 'eager'
        }));
    });

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📍 TODOS LOS IFRAMES EN LA PÁGINA (${iframesInfo.length} encontrados)\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (iframesInfo.length === 0) {
        console.log('❌ NO SE ENCONTRARON IFRAMES EN LA PÁGINA\n');
    } else {
        iframesInfo.forEach(iframe => {
            console.log(`${iframe.index}. IFRAME`);
            console.log(`   src: ${iframe.src.substring(0, 100)}${iframe.src.length > 100 ? '...' : ''}`);
            console.log(`   title: "${iframe.title}"`);
            console.log(`   id: "${iframe.id}"`);
            console.log(`   class: "${iframe.className}"`);
            console.log(`   dimensions: ${iframe.width} x ${iframe.height}`);
            console.log(`   loading: ${iframe.loading}`);
            console.log('');
        });
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('💡 Presiona Ctrl+C para cerrar\n');

    // Mantener el navegador abierto
    await new Promise(() => {});
})();
