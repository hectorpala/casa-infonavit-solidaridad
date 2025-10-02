#!/usr/bin/env node
/**
 * Scraper propiedades.com - Versión Final
 * Estrategia: Usar el menú "Comprar" directamente
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const log = (msg, color) => {
    const colors = { green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', red: '\x1b[31m', reset: '\x1b[0m' };
    console.log(`${colors[color] || colors.reset}${msg}${colors.reset}`);
};

async function scrape() {
    log('\n🕷️  Scraper propiedades.com - Test Final\n', 'cyan');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        // ESTRATEGIA: Ir directo al menú Comprar
        log('📍 Navegando a propiedades.com...', 'yellow');
        await page.goto('https://propiedades.com', { waitUntil: 'networkidle2' });

        // Click en "Comprar"
        log('🖱️  Haciendo click en Comprar...', 'yellow');
        await page.click('a:has-text("Comprar"), button:has-text("Comprar"), [href*="comprar"]');
        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: 'paso1-comprar.png' });

        // Buscar Culiacán en esta nueva página
        log('🔍 Buscando Culiacán...', 'yellow');
        const searchInput = await page.$('input[type="text"]');

        if (searchInput) {
            await searchInput.type('Culiacán, Sinaloa', { delay: 100 });
            await new Promise(r => setTimeout(r, 2000));

            // Intentar click en primera sugerencia
            try {
                await page.click('li:first-child, [role="option"]:first-child');
                log('✅ Click en sugerencia', 'green');
            } catch {
                await page.keyboard.press('Enter');
                log('✅ Enter presionado', 'green');
            }

            await new Promise(r => setTimeout(r, 8000)); // Esperar que cargue
            await page.screenshot({ path: 'paso2-resultados.png' });

            // Extraer propiedades
            log('📊 Extrayendo propiedades...', 'yellow');

            const properties = await page.evaluate(() => {
                const selectors = ['article', '[class*="Card"]', '[data-testid*="card"]', 'a[href*="/inmueble"]'];
                let elements = [];

                for (const sel of selectors) {
                    elements = Array.from(document.querySelectorAll(sel));
                    if (elements.length > 0) break;
                }

                return elements.slice(0, 10).map((el, i) => ({
                    index: i + 1,
                    title: el.querySelector('h2, h3, [class*="title"]')?.textContent?.trim(),
                    price: el.querySelector('[class*="price"], [class*="Price"]')?.textContent?.trim(),
                    location: el.querySelector('[class*="location"], [class*="address"]')?.textContent?.trim(),
                    url: el.querySelector('a')?.href || el.href,
                    html: el.outerHTML.slice(0, 300)
                }));
            });

            if (properties.length > 0) {
                log(`\n✅ ${properties.length} propiedades encontradas`, 'green');
                const filename = `propiedades-${Date.now()}.json`;
                fs.writeFileSync(filename, JSON.stringify(properties, null, 2));
                log(`💾 Guardado: ${filename}\n`, 'green');

                properties.slice(0, 3).forEach(p => {
                    console.log(`${p.index}. ${p.title || 'N/A'}`);
                    console.log(`   💰 ${p.price || 'N/A'}`);
                    console.log(`   📍 ${p.location || 'N/A'}\n`);
                });
            } else {
                log('⚠️  No se encontraron propiedades', 'yellow');
                log('Verifica paso2-resultados.png', 'yellow');
            }
        }

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, 'red');
        await page.screenshot({ path: 'error-final.png' });
    }

    log('\n⏸️  Navegador abierto - Presiona Ctrl+C para cerrar\n', 'cyan');
}

scrape();
