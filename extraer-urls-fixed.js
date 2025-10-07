#!/usr/bin/env node

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
    log('\n🚀 EXTRACTOR URLs Wiggot - FIXED', 'bright');
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
            log('✅ Login OK\n', 'green');
        }

        // Ir a búsqueda
        log('🔍 Abriendo búsqueda...', 'blue');
        await page.goto('https://new.wiggot.com/search', { waitUntil: 'networkidle2' });
        await wait(5000);

        // Ubicación
        log('📍 Escribiendo ubicación...', 'cyan');
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
        await page.keyboard.type('Culiacán Sinaloa', { delay: 100 });
        await wait(3000);
        await page.keyboard.press('ArrowDown');
        await wait(500);
        await page.keyboard.press('Enter');
        await wait(3000);

        // Precio
        log('💰 Configurando precio...', 'cyan');
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
                    input.value = '6000000';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                }
            }
        });

        await wait(2000);
        await page.keyboard.press('Escape');
        await wait(2000);

        // Tipo de propiedad - MEJORADO
        log('🏠 Seleccionando Casa...', 'cyan');
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

        // Click en checkbox de Casa
        const casaClicked = await page.evaluate(() => {
            // Buscar checkbox de Casa
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            for (const checkbox of checkboxes) {
                const parent = checkbox.closest('div, label');
                if (parent && parent.innerText.includes('Casa')) {
                    checkbox.click();
                    return true;
                }
            }

            // Alternativa: buscar div/label con texto "Casa"
            const allDivs = document.querySelectorAll('div, label');
            for (const div of allDivs) {
                const text = div.innerText || '';
                if (text.trim() === 'Casa') {
                    div.click();
                    return true;
                }
            }

            return false;
        });

        log(`   ${casaClicked ? '✅' : '⚠️'} Checkbox Casa ${casaClicked ? 'marcado' : 'no encontrado'}`, casaClicked ? 'green' : 'yellow');
        await wait(2000);

        // Cerrar modal
        await page.keyboard.press('Escape');
        await wait(2000);

        // Buscar
        log('🔎 Ejecutando búsqueda...', 'blue');
        const searchClicked = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.innerText || '';
                const classes = btn.className || '';
                if (text.includes('Buscar') || (classes.includes('blue') && btn.querySelector('svg'))) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });

        log(`   ${searchClicked ? '✅' : '⚠️'} Botón buscar ${searchClicked ? 'clickeado' : 'no encontrado'}`, searchClicked ? 'green' : 'yellow');
        await wait(15000); // Esperar carga de resultados

        // Scroll
        log('📜 Lazy loading...', 'cyan');
        for (let i = 0; i < 8; i++) {
            await page.evaluate((offset) => window.scrollTo(0, offset), 400 * (i + 1));
            await wait(2000);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(5000);

        await page.screenshot({ path: 'wiggot-final.png', fullPage: true });
        log('📸 Screenshot: wiggot-final.png', 'yellow');

        // Extraer URLs con TODAS las estrategias
        log('\n🎯 Extrayendo URLs...', 'blue');

        const urls = await page.evaluate(() => {
            const found = new Set();

            // 1. Links directos
            document.querySelectorAll('a').forEach(link => {
                if (link.href.includes('property-detail')) {
                    found.add(link.href);
                }
            });

            // 2. Data attributes
            document.querySelectorAll('[data-property-id], [data-id], [data-key]').forEach(el => {
                ['data-property-id', 'data-id', 'data-key'].forEach(attr => {
                    const id = el.getAttribute(attr);
                    if (id && id.length >= 7 && /^[a-zA-Z0-9]+$/.test(id)) {
                        found.add(`https://new.wiggot.com/search/property-detail/${id}`);
                    }
                });
            });

            // 3. HTML completo - regex agresivo
            const html = document.body.innerHTML;

            // Buscar hrefs
            const hrefMatches = html.matchAll(/href=["']([^"']*property-detail\/([a-zA-Z0-9]{7,})[^"']*)["']/g);
            for (const match of hrefMatches) {
                let url = match[1];
                if (!url.startsWith('http')) {
                    url = 'https://new.wiggot.com' + (url.startsWith('/') ? '' : '/') + url;
                }
                found.add(url);
            }

            // Buscar IDs sueltos
            const idMatches = html.matchAll(/property-detail\/([a-zA-Z0-9]{7,})/g);
            for (const match of idMatches) {
                found.add(`https://new.wiggot.com/search/property-detail/${match[1]}`);
            }

            // 4. __NEXT_DATA__ (React state)
            try {
                const nextData = document.getElementById('__NEXT_DATA__');
                if (nextData) {
                    const data = JSON.parse(nextData.textContent);
                    const dataStr = JSON.stringify(data);

                    // Buscar IDs en formato común
                    const patterns = [
                        /"id":"([a-zA-Z0-9]{7,})"/g,
                        /"propertyId":"([a-zA-Z0-9]{7,})"/g,
                        /"key":"([a-zA-Z0-9]{7,})"/g
                    ];

                    patterns.forEach(pattern => {
                        const matches = dataStr.matchAll(pattern);
                        for (const m of matches) {
                            found.add(`https://new.wiggot.com/search/property-detail/${m[1]}`);
                        }
                    });
                }
            } catch (e) {}

            // 5. Event handlers
            document.querySelectorAll('[onclick], [onmousedown]').forEach(el => {
                ['onclick', 'onmousedown'].forEach(event => {
                    const handler = el.getAttribute(event) || '';
                    const match = handler.match(/property-detail\/([a-zA-Z0-9]{7,})/);
                    if (match) {
                        found.add(`https://new.wiggot.com/search/property-detail/${match[1]}`);
                    }
                });
            });

            return Array.from(found);
        });

        log(`✅ URLs encontradas: ${urls.length}\n`, urls.length > 0 ? 'green' : 'red');

        if (urls.length > 0) {
            const top12 = urls.slice(0, 12);

            log('📋 TOP 12:', 'bright');
            log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

            top12.forEach((url, i) => {
                const id = url.match(/property-detail\/([a-zA-Z0-9]+)/)?.[1];
                log(`${i + 1}. ${id}`, 'cyan');
            });

            fs.writeFileSync('urls-batch.json', JSON.stringify({ urls: top12 }, null, 2));
            log('\n✅ urls-batch.json guardado', 'green');
            log('\n🚀 SIGUIENTE:', 'bright');
            log('   node batch-wiggot-urls.js\n', 'cyan');
        } else {
            log('⚠️  0 URLs - Ver wiggot-final.png', 'red');
            log('💡 60s para debug manual...', 'yellow');
            await wait(60000);
        }

        await browser.close();

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        await page.screenshot({ path: 'error.png' });
        await wait(30000);
        await browser.close();
        process.exit(1);
    }
}

main();
