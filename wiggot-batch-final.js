#!/usr/bin/env node

/**
 * WIGGOT BATCH FINAL
 * Búsqueda: Culiacán, $1M-$3M, Casas
 * Click en 12 tarjetas para extraer URLs
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
    log('\n🏠 WIGGOT BATCH - Culiacán $1M-$3M', 'bright');
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

        // Ir a búsqueda
        log('🔍 Abriendo búsqueda...', 'blue');
        await page.goto('https://new.wiggot.com/search', { waitUntil: 'networkidle2' });
        await wait(5000);

        // 1. DIRECCIÓN O LUGAR
        log('📍 Dirección: Culiacán...', 'cyan');

        // Click en campo de ubicación
        await page.click('input[placeholder*="Dónde"]');
        await wait(2000);

        // Escribir "culiacan"
        await page.keyboard.type('culiacan', { delay: 100 });
        await wait(3000);

        // Seleccionar del dropdown: "Culiacán, Sin., México"
        await page.keyboard.press('ArrowDown');
        await wait(500);
        await page.keyboard.press('Enter');
        await wait(3000);

        log('   ✅ Culiacán seleccionado', 'green');

        // 2. PRECIO: $1,000,000 - $3,000,000
        log('💰 Precio: $1M - $3M...', 'cyan');

        // Click en campo de precio
        const precioInput = await page.evaluateHandle(() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            return inputs.find(inp => {
                const ph = inp.placeholder || '';
                return ph.includes('presupuesto') || ph.includes('Precio');
            });
        });

        if (precioInput) {
            await precioInput.click();
            await wait(3000);
        }

        // Ingresar precio DESDE: $1,000,000
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
            for (const input of inputs) {
                const label = input.placeholder || input.getAttribute('aria-label') || '';
                if (label.toLowerCase().includes('desde') || label.toLowerCase().includes('mínimo')) {
                    input.focus();
                    input.value = '1000000';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        });

        await wait(2000);

        // Ingresar precio HASTA: $3,000,000
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

        log('   ✅ Precio $1M-$3M configurado', 'green');

        // 3. TIPO: Casa
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

        log('   ✅ Casa seleccionada', 'green');

        // 4. BUSCAR
        log('\n🔎 Ejecutando búsqueda...', 'blue');

        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.innerText || '';
                const classes = btn.className || '';
                if (text.includes('Buscar') || (classes.includes('blue') && btn.querySelector('svg'))) {
                    btn.click();
                    return;
                }
            }
        });

        await wait(20000); // Esperar resultados

        // 5. SCROLL LAZY LOADING
        log('📜 Cargando propiedades...', 'cyan');

        for (let i = 0; i < 15; i++) {
            await page.evaluate((offset) => window.scrollTo(0, offset), 400 * (i + 1));
            await wait(2000);
        }

        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(5000);

        await page.screenshot({ path: 'wiggot-busqueda.png', fullPage: true });
        log('📸 wiggot-busqueda.png\n', 'yellow');

        // 6. HACER CLICK EN 12 TARJETAS
        log('🖱️  Extrayendo URLs (click en tarjetas)...', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

        const urls = [];

        for (let i = 0; i < 12; i++) {
            log(`[${i + 1}/12] Tarjeta ${i + 1}...`, 'cyan');

            try {
                // Estrategia: Click en div que contiene precio
                const cardClicked = await page.evaluate((index) => {
                    // Buscar todos los divs
                    const allDivs = Array.from(document.querySelectorAll('div'));

                    // Filtrar divs que contienen precio en formato $X.XXX.XXXMXN
                    const priceCards = allDivs.filter(div => {
                        const text = div.innerText || '';
                        return /\$[\d.,]+MXN/.test(text) && (div.onclick || div.style.cursor === 'pointer');
                    });

                    if (priceCards[index]) {
                        priceCards[index].click();
                        return true;
                    }

                    // Alternativa: Buscar por clases comunes de tarjetas
                    const cards = document.querySelectorAll('[class*="card"], [class*="property"], [class*="item"]');
                    if (cards[index]) {
                        cards[index].click();
                        return true;
                    }

                    return false;
                }, i);

                if (!cardClicked) {
                    log(`   ⚠️  No se encontró`, 'yellow');
                    continue;
                }

                await wait(7000);

                // Capturar URL
                const url = page.url();

                if (url.includes('property-detail')) {
                    urls.push(url);
                    const id = url.match(/property-detail\/([a-zA-Z0-9]+)/)?.[1];
                    log(`   ✅ ${id}`, 'green');

                    // Volver
                    await page.goBack();
                    await wait(5000);
                } else {
                    log(`   ⚠️  URL no cambió`, 'yellow');
                }

            } catch (error) {
                log(`   ❌ Error: ${error.message}`, 'red');
            }
        }

        log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'bright');
        log(`✅ URLs capturadas: ${urls.length}\n`, urls.length > 0 ? 'green' : 'red');

        if (urls.length > 0) {
            log('📋 URLS CAPTURADAS:', 'bright');
            log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

            urls.forEach((url, i) => {
                const id = url.match(/property-detail\/([a-zA-Z0-9]+)/)?.[1];
                log(`${i + 1}. ${id}`, 'cyan');
            });

            fs.writeFileSync('urls-batch.json', JSON.stringify({ urls }, null, 2));
            log('\n✅ urls-batch.json guardado', 'green');
            log('\n🚀 SIGUIENTE PASO:', 'bright');
            log('   node batch-wiggot-urls.js\n', 'cyan');
        } else {
            log('⚠️  No se capturaron URLs', 'red');
            log('💡 Revisa wiggot-busqueda.png\n', 'yellow');
        }

        await wait(5000);
        await browser.close();

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        console.error(error.stack);
        await page.screenshot({ path: 'error.png' });
        await wait(30000);
        await browser.close();
        process.exit(1);
    }
}

main();
