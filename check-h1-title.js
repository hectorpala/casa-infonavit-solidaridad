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

    await new Promise(resolve => setTimeout(resolve, 3000));

    const pageInfo = await page.evaluate(() => {
        return {
            h1Text: document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : 'NO H1 FOUND',
            title: document.title,
            url: window.location.href,
            allH1s: Array.from(document.querySelectorAll('h1')).map(h1 => h1.textContent.trim())
        };
    });

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📝 INFORMACIÓN DE LA PÁGINA\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`URL final: ${pageInfo.url}\n`);
    console.log(`Document title: ${pageInfo.title}\n`);
    console.log(`H1 principal: ${pageInfo.h1Text}\n`);
    console.log(`\nTodos los H1 encontrados (${pageInfo.allH1s.length}):`);
    pageInfo.allH1s.forEach((h1, idx) => {
        console.log(`  ${idx + 1}. "${h1}"`);
    });
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('💡 Presiona Ctrl+C para cerrar\n');

    await new Promise(() => {});
})();
