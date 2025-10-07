#!/usr/bin/env node

/**
 * CLICK EN TARJETAS - Extrae URLs haciendo click
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
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
    log('\n🖱️  CLICK EN TARJETAS - Extractor de URLs', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();

    try {
        // Login
        log('🔐 Login...', 'blue');
        await page.goto('https://new.wiggot.com/search', { waitUntil: 'networkidle2' });
        await wait(5000);

        try { await page.keyboard.press('Escape'); await wait(1000); } catch (e) {}

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
            log('✅ Login OK\n', 'green');
        }

        // Búsqueda
        log('🔍 Configurando búsqueda...', 'blue');
        await page.goto('https://new.wiggot.com/search', { waitUntil: 'networkidle2' });
        await wait(5000);

        // Ubicación - MEJORADO: Seleccionar del dropdown
        log('📍 Ubicación: Culiacán...', 'cyan');
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input');
            for (const input of inputs) {
                const placeholder = input.placeholder || '';
                if (placeholder.includes('Dónde') || placeholder.includes('buscar')) {
                    input.click();
                    return;
                }
            }
        });

        await wait(2000);
        await page.keyboard.type('Culiacan', { delay: 100 });
        await wait(3000);

        // Click en primera opción del dropdown "Culiacán, Sin., México"
        await page.evaluate(() => {
            const allElements = document.querySelectorAll('div, li, a');
            for (const el of allElements) {
                const text = el.innerText || '';
                if (text.includes('Culiacán, Sin., México')) {
                    el.click();
                    return;
                }
            }
        });

        await wait(3000);

        // Precio: $0-$3M
        log('💰 Precio: $0-$3,000,000...', 'cyan');
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, div[role="button"]');
            for (const btn of buttons) {
                const text = btn.innerText || '';
                if (text.includes('presupuesto') || text.includes('Precio')) {
                    btn.click();
                    break;
                }
            }
        });

        await wait(3000);

        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
            for (const input of inputs) {
                const label = input.placeholder || input.getAttribute('aria-label') || '';
                if (label.toLowerCase().includes('hasta') || label.toLowerCase().includes('máximo')) {
                    input.focus();
                    input.value = '3000000';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        });

        await wait(2000);
        await page.keyboard.press('Escape');
        await wait(2000);

        // Tipo: Casa
        log('🏠 Tipo: Casa...', 'cyan');
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, div[role="button"]');
            for (const btn of buttons) {
                const text = btn.innerText || '';
                if (text.includes('Tipo de propiedad') || text.includes('tipo de pr')) {
                    btn.click();
                    break;
                }
            }
        });

        await wait(3000);

        await page.evaluate(() => {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            for (const checkbox of checkboxes) {
                const parent = checkbox.closest('div, label');
                if (parent && parent.innerText.includes('Casa')) {
                    checkbox.click();
                    return true;
                }
            }
        });

        await wait(2000);
        await page.keyboard.press('Escape');
        await wait(2000);

        // Buscar
        log('🔎 Buscando...', 'blue');
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.innerText || '';
                if (text.includes('Buscar')) {
                    btn.click();
                    return;
                }
            }
        });

        await wait(15000);

        // Scroll
        log('📜 Cargando...', 'cyan');
        for (let i = 0; i < 10; i++) {
            await page.evaluate((offset) => window.scrollTo(0, offset), 500 * (i + 1));
            await wait(2000);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(5000);

        // CLICK EN TARJETAS
        log('\n🖱️  Haciendo click en tarjetas...', 'blue');

        const urls = [];

        for (let i = 0; i < 12; i++) {
            log(`\n[${i + 1}/12] Tarjeta ${i + 1}...`, 'cyan');

            // Encontrar todas las tarjetas (divs con precio)
            const cardClicked = await page.evaluate((index) => {
                const allDivs = Array.from(document.querySelectorAll('div'));

                // Buscar divs que contengan precios (formato $X.XXX.XXX)
                const priceCards = allDivs.filter(div => {
                    const text = div.innerText || '';
                    return /\$[\d.]+\.[\d]{3}MXN/.test(text);
                });

                if (priceCards[index]) {
                    priceCards[index].click();
                    return true;
                }

                return false;
            }, i);

            if (!cardClicked) {
                log(`   ⚠️  No se encontró tarjeta ${i + 1}`, 'yellow');
                break;
            }

            await wait(5000);

            // Capturar URL actual
            const url = page.url();

            if (url.includes('property-detail')) {
                urls.push(url);
                const id = url.match(/property-detail\/([a-zA-Z0-9]+)/)?.[1];
                log(`   ✅ ${id}`, 'green');

                // Volver atrás
                await page.goBack();
                await wait(5000);
            } else {
                log(`   ⚠️  URL no cambió: ${url}`, 'yellow');
            }
        }

        log(`\n✅ URLs capturadas: ${urls.length}\n`, 'green');

        if (urls.length > 0) {
            log('📋 URLs CAPTURADAS:', 'bright');
            log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

            urls.forEach((url, i) => {
                const id = url.match(/property-detail\/([a-zA-Z0-9]+)/)?.[1];
                log(`${i + 1}. ${id}`, 'cyan');
            });

            fs.writeFileSync('urls-batch.json', JSON.stringify({ urls }, null, 2));
            log('\n✅ urls-batch.json guardado', 'green');
            log('\n🚀 SIGUIENTE:', 'bright');
            log('   node batch-wiggot-urls.js\n', 'cyan');
        }

        await wait(5000);
        await browser.close();

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        await wait(30000);
        await browser.close();
        process.exit(1);
    }
}

main();
