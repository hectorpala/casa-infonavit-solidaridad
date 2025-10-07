#!/usr/bin/env node

/**
 * EXTRACTOR 12 URLs MÁS NUEVAS DE WIGGOT
 *
 * Navega a búsqueda de Wiggot y extrae las primeras 12 URLs
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const WIGGOT_EMAIL = 'hector.test.1759769906975@gmail.com';
const WIGGOT_PASSWORD = 'Wiggot2025!drm36';
const SEARCH_URL = 'https://new.wiggot.com/search?constructionType=house&priceTo=6000000&operation=SALE';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
    log('\n🔍 EXTRACTOR 12 URLs MÁS NUEVAS - WIGGOT', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();

    try {
        // Login
        log('🤖 Haciendo login...', 'blue');
        await page.goto('https://new.wiggot.com/search', { waitUntil: 'networkidle2' });
        await wait(5000);

        // Intentar cerrar modal si existe
        try {
            await page.keyboard.press('Escape');
            await wait(1000);
        } catch (e) {}

        const inputs = await page.$$('input');
        if (inputs.length >= 2) {
            await inputs[0].click();
            await page.keyboard.type(WIGGOT_EMAIL, { delay: 50 });
            await inputs[1].click();
            await page.keyboard.type(WIGGOT_PASSWORD, { delay: 50 });
            await wait(1000);

            const buttons = await page.$$('button');
            for (const button of buttons) {
                const text = await page.evaluate(el => el.innerText, button);
                if (text.includes('Iniciar')) {
                    await button.click();
                    break;
                }
            }
            await wait(10000);
            log('✅ Login exitoso\n', 'green');
        }

        // Navegar a búsqueda
        log('🔍 Navegando a búsqueda: Casas $0-$6M...', 'blue');
        await page.goto(SEARCH_URL, { waitUntil: 'networkidle2' });
        await wait(10000);

        // Scroll para cargar lazy loading
        log('📜 Cargando resultados (scroll lazy loading)...', 'cyan');

        await page.evaluate(() => window.scrollTo(0, 500));
        await wait(3000);

        await page.evaluate(() => window.scrollTo(0, 1000));
        await wait(3000);

        await page.evaluate(() => window.scrollTo(0, 1500));
        await wait(3000);

        await page.evaluate(() => window.scrollTo(0, 2000));
        await wait(5000);

        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(5000);

        // Screenshot para debug
        await page.screenshot({ path: 'wiggot-search-results.png', fullPage: true });
        log('📸 Screenshot guardado: wiggot-search-results.png', 'yellow');

        // Extraer URLs - Múltiples estrategias
        log('\n🎯 Extrayendo URLs de propiedades...', 'blue');

        const urls = await page.evaluate(() => {
            const foundUrls = [];

            // Estrategia 1: Buscar todos los links con property-detail
            document.querySelectorAll('a[href*="property-detail"]').forEach(link => {
                foundUrls.push(link.href);
            });

            // Estrategia 2: Buscar en todo el HTML
            if (foundUrls.length === 0) {
                const html = document.body.innerHTML;
                const matches = html.matchAll(/href="([^"]*property-detail\/[a-zA-Z0-9]+[^"]*)"/g);
                for (const match of matches) {
                    let url = match[1];
                    if (!url.startsWith('http')) {
                        url = 'https://new.wiggot.com' + (url.startsWith('/') ? '' : '/') + url;
                    }
                    foundUrls.push(url);
                }
            }

            // Estrategia 3: Buscar onclick o data-href
            if (foundUrls.length === 0) {
                document.querySelectorAll('[onclick*="property-detail"], [data-href*="property-detail"]').forEach(el => {
                    const onclick = el.getAttribute('onclick') || '';
                    const dataHref = el.getAttribute('data-href') || '';
                    const combined = onclick + dataHref;
                    const match = combined.match(/property-detail\/([a-zA-Z0-9]+)/);
                    if (match) {
                        foundUrls.push(`https://new.wiggot.com/search/property-detail/${match[1]}`);
                    }
                });
            }

            return [...new Set(foundUrls)]; // Remove duplicates
        });

        log(`✅ URLs encontradas: ${urls.length}\n`, 'green');

        if (urls.length === 0) {
            log('⚠️  No se encontraron URLs automáticamente', 'yellow');
            log('💡 Inspeccionando DOM manualmente...', 'cyan');

            // Dump completo del DOM para debug
            const domInfo = await page.evaluate(() => {
                const info = {
                    allLinks: [],
                    allDivClasses: [],
                    bodyHTML: document.body.innerHTML.substring(0, 5000)
                };

                document.querySelectorAll('a').forEach((link, i) => {
                    if (i < 30) {
                        info.allLinks.push({
                            href: link.href,
                            text: link.innerText.substring(0, 50),
                            className: link.className
                        });
                    }
                });

                document.querySelectorAll('div').forEach((div, i) => {
                    if (i < 50 && div.className) {
                        info.allDivClasses.push(div.className);
                    }
                });

                return info;
            });

            fs.writeFileSync('wiggot-dom-debug.json', JSON.stringify(domInfo, null, 2));
            log('📄 DOM info guardado en wiggot-dom-debug.json', 'yellow');

            log('\n⏸️  Navegador permanece abierto 120 segundos para inspección manual...', 'magenta');
            log('💡 Copia manualmente las URLs que veas en la página', 'cyan');
            await wait(120000);

        } else {
            // Tomar las primeras 12
            const top12 = urls.slice(0, 12);

            log('📋 LAS 12 URLS MÁS NUEVAS:', 'bright');
            log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

            top12.forEach((url, i) => {
                const id = url.match(/property-detail\/([a-zA-Z0-9]+)/)?.[1] || 'unknown';
                log(`${i + 1}. ${id} <- ${url}`, 'cyan');
            });

            // Guardar en urls-batch.json
            const batchData = { urls: top12 };
            fs.writeFileSync('urls-batch.json', JSON.stringify(batchData, null, 2));

            log('\n✅ URLs guardadas en urls-batch.json', 'green');
            log('\n🚀 SIGUIENTE PASO:', 'bright');
            log('   node batch-wiggot-urls.js', 'cyan');

            await wait(5000);
        }

        await browser.close();

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        console.error(error);
        if (browser.isConnected && browser.isConnected()) {
            log('\n⏸️  Navegador permanece abierto para debug...', 'yellow');
            await wait(60000);
            await browser.close();
        }
        process.exit(1);
    }
}

main().catch(error => {
    log(`\n❌ Fatal: ${error.message}`, 'red');
    process.exit(1);
});
