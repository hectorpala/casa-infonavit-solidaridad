#!/usr/bin/env node

const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 DEBUG: Analizando selectores de Inmuebles24\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    const url = 'https://www.inmuebles24.com/casas-en-venta-en-culiacan-de-4300000-a-4400000-pesos.html';

    console.log(`📄 Navegando a: ${url}\n`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('⏳ Esperando 5 segundos...\n');
    await new Promise(r => setTimeout(r, 5000));

    const debug = await page.evaluate(() => {
        const results = {};

        // Buscar app-search-card
        results.appSearchCard = {
            count: document.querySelectorAll('app-search-card').length,
            exists: document.querySelector('app-search-card') !== null
        };

        // Buscar enlaces con "propiedades"
        results.propertyLinks = {
            all: document.querySelectorAll('a').length,
            withPropiedades: document.querySelectorAll('a[href*="propiedades"]').length,
            inAppSearchCard: document.querySelectorAll('app-search-card a[href*="propiedades"]').length
        };

        // Buscar clases y data attributes comunes
        results.otherSelectors = {
            propertyCards: document.querySelectorAll('[data-qa*="posting"]').length,
            searchResults: document.querySelectorAll('[class*="result"]').length,
            cardContainers: document.querySelectorAll('[class*="card"]').length
        };

        // Primeros 3 enlaces si existen
        const links = Array.from(document.querySelectorAll('a[href*="inmuebles24.com"]'))
            .slice(0, 5)
            .map(a => a.href);

        results.sampleLinks = links;

        return results;
    });

    console.log('📊 RESULTADOS DEL DEBUG:\n');
    console.log(JSON.stringify(debug, null, 2));

    console.log('\n✅ Debug completo. El browser quedará abierto para inspección manual.');
    console.log('Presiona Ctrl+C para cerrar.');

    // Mantener browser abierto para inspección
    await new Promise(() => {});
})();
