#!/usr/bin/env node

/**
 * BATCH HÍBRIDO - El más confiable
 *
 * 1. Script hace login
 * 2. TÚ haces la búsqueda en 60 segundos:
 *    - Dirección: Culiacán
 *    - Precio: $1M - $3M
 *    - Tipo: Casa
 *    - Click en Buscar
 * 3. Script hace click en 12 tarjetas y extrae URLs
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
    log('\n🤖 BATCH HÍBRIDO - Login Auto + Búsqueda Manual', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();

    try {
        // Login automático
        log('🔐 Login automático...', 'blue');
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
        await page.goto('https://new.wiggot.com/search', { waitUntil: 'networkidle2' });
        await wait(5000);

        // Countdown - USUARIO HACE BÚSQUEDA MANUAL
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'magenta');
        log('👤 TIENES 60 SEGUNDOS - HAZ LA BÚSQUEDA MANUAL:', 'magenta');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'magenta');
        log('', '');
        log('   1. Dirección o lugar: Culiacán', 'yellow');
        log('      - Escribe "culiacan"', 'cyan');
        log('      - Selecciona del dropdown "Culiacán, Sin., México"', 'cyan');
        log('', '');
        log('   2. Precio: $1,000,000 - $3,000,000', 'yellow');
        log('      - Desde: 1000000', 'cyan');
        log('      - Hasta: 3000000', 'cyan');
        log('', '');
        log('   3. Tipo de propiedad: Casa', 'yellow');
        log('      - Marca checkbox "Casa"', 'cyan');
        log('', '');
        log('   4. Click en botón BUSCAR (lupa azul)', 'yellow');
        log('      - Espera a que carguen los resultados', 'cyan');
        log('', '');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'magenta');

        for (let i = 60; i > 0; i -= 10) {
            log(`⏰ ${i} segundos restantes...`, 'yellow');
            await wait(10000);
        }

        log('\n🤖 Script retoma control...\n', 'blue');
        await wait(5000);

        // Scroll para asegurar carga completa
        log('📜 Cargando propiedades...', 'cyan');
        for (let i = 0; i < 15; i++) {
            await page.evaluate((offset) => window.scrollTo(0, offset), 400 * (i + 1));
            await wait(2000);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(5000);

        await page.screenshot({ path: 'wiggot-antes-click.png', fullPage: true });
        log('📸 wiggot-antes-click.png\n', 'yellow');

        // CLICK EN 12 TARJETAS
        log('🖱️  Haciendo click en tarjetas...', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

        const urls = [];

        for (let i = 0; i < 12; i++) {
            log(`[${i + 1}/12] Tarjeta ${i + 1}...`, 'cyan');

            try {
                // Estrategia: Buscar divs clickeables con precios
                const cardClicked = await page.evaluate((index) => {
                    // Buscar todos los elementos clickeables
                    const allElements = Array.from(document.querySelectorAll('div, a, article'));

                    // Filtrar los que contienen precios
                    const priceElements = allElements.filter(el => {
                        const text = el.innerText || '';
                        return /\$[\d.,]+\s*MXN/.test(text);
                    });

                    // Encontrar el parent clickeable más cercano
                    const clickableCards = priceElements.map(el => {
                        let current = el;
                        while (current && current !== document.body) {
                            const style = window.getComputedStyle(current);
                            if (style.cursor === 'pointer' || current.onclick) {
                                return current;
                            }
                            current = current.parentElement;
                        }
                        return el;
                    });

                    if (clickableCards[index]) {
                        clickableCards[index].click();
                        return true;
                    }

                    return false;
                }, i);

                if (!cardClicked) {
                    log(`   ⚠️  No encontrada`, 'yellow');
                    continue;
                }

                await wait(8000); // Esperar navegación

                // Capturar URL
                const url = page.url();

                if (url.includes('property-detail')) {
                    urls.push(url);
                    const id = url.match(/property-detail\/([a-zA-Z0-9]+)/)?.[1];
                    log(`   ✅ ${id}`, 'green');

                    // Volver
                    await page.goBack();
                    await wait(6000);
                } else {
                    log(`   ⚠️  URL no cambió: ${url.substring(0, 60)}...`, 'yellow');
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
            log('💡 Revisa wiggot-antes-click.png\n', 'yellow');
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
