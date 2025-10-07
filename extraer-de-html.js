#!/usr/bin/env node

/**
 * EXTRAER IDs del HTML completo de Wiggot
 * Guarda el HTML y busca todos los IDs de propiedades
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
    log('\n🔍 EXTRACTOR DE HTML COMPLETO', 'bright');
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

        // Búsqueda
        log('🔍 Configurando búsqueda...', 'blue');
        await page.goto('https://new.wiggot.com/search', { waitUntil: 'networkidle2' });
        await wait(5000);

        // Ubicación
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

        // Precio - CAMBIADO A 3M
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

        // Tipo Casa
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
                    return;
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

        // Scroll masivo
        log('📜 Cargando resultados...', 'cyan');
        for (let i = 0; i < 10; i++) {
            await page.evaluate((offset) => window.scrollTo(0, offset), 500 * (i + 1));
            await wait(2000);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(5000);

        // Guardar HTML completo
        log('💾 Guardando HTML...', 'yellow');
        const html = await page.content();
        fs.writeFileSync('wiggot-page.html', html);
        log('✅ wiggot-page.html guardado', 'green');

        // Extraer IDs del HTML
        log('\n🎯 Extrayendo IDs...', 'blue');

        const propertyIds = [];

        // Regex para encontrar IDs de 7+ caracteres alfanuméricos
        const regex = /['"\/]([a-zA-Z][a-zA-Z0-9]{6,})['"\/]/g;
        let match;

        while ((match = regex.exec(html)) !== null) {
            const id = match[1];

            // Filtrar IDs que parecen ser de propiedades
            // - Empiezan con 'p' (común en Wiggot)
            // - Longitud 7-10 caracteres
            // - Mix de letras y números

            if (
                id.length >= 7 &&
                id.length <= 10 &&
                /^p[a-zA-Z0-9]+$/.test(id) &&
                /[0-9]/.test(id) && // Contiene al menos un número
                /[a-zA-Z]/.test(id)  // Contiene al menos una letra
            ) {
                propertyIds.push(id);
            }
        }

        // Deduplicar
        const uniqueIds = [...new Set(propertyIds)];

        log(`✅ IDs encontrados: ${uniqueIds.length}\n`, uniqueIds.length > 0 ? 'green' : 'red');

        if (uniqueIds.length > 0) {
            const top12 = uniqueIds.slice(0, 12);

            log('📋 TOP 12 IDs:', 'bright');
            log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

            const urls = top12.map(id => `https://new.wiggot.com/search/property-detail/${id}`);

            urls.forEach((url, i) => {
                const id = url.match(/property-detail\/([a-zA-Z0-9]+)/)?.[1];
                log(`${i + 1}. ${id}`, 'cyan');
            });

            fs.writeFileSync('urls-batch.json', JSON.stringify({ urls }, null, 2));
            log('\n✅ urls-batch.json guardado', 'green');
            log('\n🚀 SIGUIENTE:', 'bright');
            log('   node batch-wiggot-urls.js\n', 'cyan');

        } else {
            log('⚠️  No se encontraron IDs', 'red');
            log('💡 Analiza wiggot-page.html manualmente', 'yellow');
        }

        await page.screenshot({ path: 'wiggot-final-3m.png', fullPage: true });
        log('📸 wiggot-final-3m.png', 'yellow');

        await wait(5000);
        await browser.close();

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        await page.screenshot({ path: 'error.png' });
        await wait(10000);
        await browser.close();
        process.exit(1);
    }
}

main();
