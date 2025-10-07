#!/usr/bin/env node

/**
 * EXTRACTOR AUTOMÁTICO - 12 URLs Wiggot
 * Hace la búsqueda completa automáticamente
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
    log('\n🚀 EXTRACTOR AUTOMÁTICO - 12 URLs Wiggot', 'bright');
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

        // Cerrar modal
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

        // Click en barra de búsqueda (input de ubicación)
        log('📍 Escribiendo ubicación: Culiacán Sinaloa...', 'cyan');

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

        // Seleccionar primera opción del dropdown
        await page.keyboard.press('ArrowDown');
        await wait(500);
        await page.keyboard.press('Enter');
        await wait(3000);

        log('💰 Configurando precio máximo: $6,000,000...', 'cyan');

        // Click en filtro de precio
        await page.evaluate(() => {
            const allText = document.body.innerText;
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

        // Ingresar precio máximo
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

        // Cerrar modal de precio
        await page.keyboard.press('Escape');
        await wait(2000);

        log('🏠 Configurando tipo: Casa...', 'cyan');

        // Click en filtro de tipo de propiedad
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

        // Seleccionar "Casa"
        await page.evaluate(() => {
            const allElements = document.querySelectorAll('div, button, label');
            for (const el of allElements) {
                const text = el.innerText || '';
                if (text.trim() === 'Casa' || text.includes('Casa')) {
                    el.click();
                    break;
                }
            }
        });

        await wait(2000);
        await page.keyboard.press('Escape');
        await wait(2000);

        // Click en botón buscar (lupa azul)
        log('🔎 Ejecutando búsqueda...', 'blue');

        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                const hasIcon = btn.querySelector('svg, i');
                const classes = btn.className || '';
                if (hasIcon && (classes.includes('blue') || classes.includes('primary'))) {
                    btn.click();
                    break;
                }
            }
        });

        await wait(10000);

        // Scroll para cargar resultados
        log('📜 Cargando propiedades (lazy loading)...', 'cyan');

        for (let i = 0; i < 5; i++) {
            await page.evaluate((offset) => {
                window.scrollTo(0, offset);
            }, 500 * (i + 1));
            await wait(2000);
        }

        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(5000);

        await page.screenshot({ path: 'wiggot-resultados.png', fullPage: true });
        log('📸 Screenshot: wiggot-resultados.png', 'yellow');

        // Extraer URLs - Estrategia múltiple
        log('\n🎯 Extrayendo URLs...', 'blue');

        const urls = await page.evaluate(() => {
            const found = new Set();

            // 1. Links directos
            document.querySelectorAll('a').forEach(link => {
                if (link.href.includes('property-detail')) {
                    found.add(link.href);
                }
            });

            // 2. Divs clickeables con data attributes
            document.querySelectorAll('[data-property-id], [data-id]').forEach(el => {
                const id = el.getAttribute('data-property-id') || el.getAttribute('data-id');
                if (id && id.length > 5) {
                    found.add(`https://new.wiggot.com/search/property-detail/${id}`);
                }
            });

            // 3. Buscar en onclick handlers
            document.querySelectorAll('[onclick]').forEach(el => {
                const onclick = el.getAttribute('onclick') || '';
                const match = onclick.match(/property-detail\/([a-zA-Z0-9]+)/);
                if (match) {
                    found.add(`https://new.wiggot.com/search/property-detail/${match[1]}`);
                }
            });

            // 4. Buscar en todo el HTML
            const html = document.body.innerHTML;
            const regex = /property-detail\/([a-zA-Z0-9]{7,})/g;
            let match;
            while ((match = regex.exec(html)) !== null) {
                found.add(`https://new.wiggot.com/search/property-detail/${match[1]}`);
            }

            // 5. Buscar en __NEXT_DATA__ (React state)
            try {
                const nextData = document.getElementById('__NEXT_DATA__');
                if (nextData) {
                    const data = JSON.parse(nextData.textContent);
                    const dataStr = JSON.stringify(data);
                    const matches = dataStr.matchAll(/"id":"([a-zA-Z0-9]{7,})"/g);
                    for (const m of matches) {
                        found.add(`https://new.wiggot.com/search/property-detail/${m[1]}`);
                    }
                }
            } catch (e) {}

            return Array.from(found);
        });

        log(`✅ Encontradas: ${urls.length} URLs\n`, 'green');

        if (urls.length === 0) {
            log('⚠️  No se encontraron URLs', 'red');
            log('💡 Esperando 60s para inspección manual...', 'yellow');
            await wait(60000);
        } else {
            const top12 = urls.slice(0, 12);

            log('📋 TOP 12 URLs:', 'bright');
            log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

            top12.forEach((url, i) => {
                const id = url.match(/property-detail\/([a-zA-Z0-9]+)/)?.[1];
                log(`${i + 1}. ${id}`, 'cyan');
            });

            // Guardar
            fs.writeFileSync('urls-batch.json', JSON.stringify({ urls: top12 }, null, 2));
            log('\n✅ Guardado: urls-batch.json', 'green');
            log('\n🚀 SIGUIENTE PASO:', 'bright');
            log('   node batch-wiggot-urls.js\n', 'cyan');

            await wait(5000);
        }

        await browser.close();

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        console.error(error.stack);
        await page.screenshot({ path: 'error-screenshot.png' });
        log('📸 Error screenshot: error-screenshot.png', 'yellow');
        await wait(30000);
        await browser.close();
        process.exit(1);
    }
}

main().catch(error => {
    log(`\n❌ Fatal: ${error.message}`, 'red');
    process.exit(1);
});
