#!/usr/bin/env node

/**
 * DEBUG WIGGOT DOM STRUCTURE
 *
 * Inspecciona el DOM para encontrar cómo extraer propertyIds
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const WIGGOT_EMAIL = 'hector.test.1759769906975@gmail.com';
const WIGGOT_PASSWORD = 'Wiggot2025!drm36';

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
    log('\n🔍 DEBUG WIGGOT DOM STRUCTURE', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();

    try {
        // Login
        log('🤖 Login automático...', 'blue');
        await page.goto('https://new.wiggot.com/search', { waitUntil: 'networkidle2' });
        await wait(5000);

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

        // Countdown 60 segundos
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'magenta');
        log('👤 TIENES 60 SEGUNDOS PARA HACER LA BÚSQUEDA', 'magenta');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'magenta');

        for (let i = 60; i > 0; i -= 10) {
            log(`⏰ ${i} segundos restantes...`, 'yellow');
            await wait(10000);
        }

        log('\n🤖 Script retoma control - Inspeccionando DOM...', 'blue');
        await wait(5000);

        // Scroll lento
        log('   📜 Scroll lazy loading...', 'cyan');
        await page.evaluate(() => window.scrollTo(0, 300));
        await wait(3000);
        await page.evaluate(() => window.scrollTo(0, 600));
        await wait(3000);
        await page.evaluate(() => window.scrollTo(0, 1000));
        await wait(3000);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await wait(5000);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await wait(5000);
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(5000);

        // Inspeccionar DOM
        const domDebug = await page.evaluate(() => {
            const debug = {
                allLinks: [],
                allDivs: [],
                allButtons: [],
                firstCardHTML: '',
                firstCardOuterHTML: '',
                allDataAttributes: [],
                reactProps: []
            };

            // 1. Buscar todos los links
            document.querySelectorAll('a').forEach((link, i) => {
                if (i < 20) { // Primeros 20 links
                    debug.allLinks.push({
                        href: link.href,
                        className: link.className,
                        innerHTML: link.innerHTML.substring(0, 100)
                    });
                }
            });

            // 2. Buscar divs que contengan "property" en clases
            document.querySelectorAll('div').forEach((div, i) => {
                if (div.className && div.className.toLowerCase().includes('property') && i < 10) {
                    debug.allDivs.push({
                        className: div.className,
                        innerHTML: div.innerHTML.substring(0, 200),
                        attributes: Array.from(div.attributes).map(attr => ({
                            name: attr.name,
                            value: attr.value
                        }))
                    });
                }
            });

            // 3. Buscar todos los data-* attributes
            document.querySelectorAll('[data-id], [data-property-id], [data-key]').forEach(el => {
                debug.allDataAttributes.push({
                    tagName: el.tagName,
                    className: el.className,
                    attributes: Array.from(el.attributes)
                        .filter(attr => attr.name.startsWith('data-'))
                        .map(attr => ({ name: attr.name, value: attr.value }))
                });
            });

            // 4. Buscar en todo el HTML el patrón property-detail
            const htmlBody = document.body.innerHTML;
            const matches = htmlBody.match(/property-detail[\/\w-]{0,50}/g);
            debug.propertyDetailMatches = matches ? [...new Set(matches)].slice(0, 20) : [];

            // 5. Primera tarjeta completa
            const firstCard = document.querySelector('div[class*="property"], div[class*="card"]');
            if (firstCard) {
                debug.firstCardHTML = firstCard.innerHTML.substring(0, 1000);
                debug.firstCardOuterHTML = firstCard.outerHTML.substring(0, 1000);
            }

            return debug;
        });

        // Guardar resultado
        fs.writeFileSync('debug-wiggot-dom.json', JSON.stringify(domDebug, null, 2));
        log('✅ DOM structure guardada en debug-wiggot-dom.json', 'green');

        // Mostrar resumen
        log('\n📋 RESUMEN:', 'bright');
        log(`   Links encontrados: ${domDebug.allLinks.length}`, 'cyan');
        log(`   Divs con "property": ${domDebug.allDivs.length}`, 'cyan');
        log(`   Data attributes: ${domDebug.allDataAttributes.length}`, 'cyan');
        log(`   Matches "property-detail": ${domDebug.propertyDetailMatches.length}`, 'cyan');

        if (domDebug.propertyDetailMatches.length > 0) {
            log('\n🎯 Matches encontrados:', 'green');
            domDebug.propertyDetailMatches.slice(0, 5).forEach(match => {
                log(`   - ${match}`, 'yellow');
            });
        }

        log('\n⏸️  Dejando navegador abierto 30 segundos para inspección manual...', 'yellow');
        await wait(30000);

        await browser.close();

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        if (browser.isConnected && browser.isConnected()) await browser.close();
        process.exit(1);
    }
}

main().catch(error => {
    log(`\n❌ Fatal: ${error.message}`, 'red');
    process.exit(1);
});
