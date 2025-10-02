#!/usr/bin/env node

/**
 * Scraper propiedades.com V2 - Mejorado
 * Detecta automáticamente la estructura del sitio
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function scrape() {
    log('\n🕷️  Scraper propiedades.com V2\n', 'cyan');

    const browser = await puppeteer.launch({
        headless: false, // Siempre visible para ver qué pasa
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        // PASO 1: Ir a la página principal
        log('📍 Paso 1: Navegando a propiedades.com...', 'yellow');
        await page.goto('https://propiedades.com', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'paso1-home.png' });

        // PASO 2: Buscar Culiacán en el buscador
        log('🔍 Paso 2: Buscando Culiacán...', 'yellow');

        // Esperar el input de búsqueda (pueden ser varios selectores)
        const searchSelectors = [
            'input[type="text"]',
            'input[placeholder*="buscar"]',
            'input[placeholder*="ciudad"]',
            '#search',
            '[data-testid="search-input"]'
        ];

        let searchInput = null;
        for (const selector of searchSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 3000 });
                searchInput = selector;
                log(`✅ Input encontrado: ${selector}`, 'green');
                break;
            } catch (e) {
                continue;
            }
        }

        if (searchInput) {
            // Escribir "Culiacán" en el buscador
            await page.type(searchInput, 'Culiacán', { delay: 100 });
            await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar sugerencias

            log('🎯 Paso 2.1: Haciendo click en primera sugerencia...', 'yellow');

            // Hacer click en la primera sugerencia del dropdown
            try {
                await page.keyboard.press('ArrowDown'); // Seleccionar primera opción
                await new Promise(resolve => setTimeout(resolve, 500));
                await page.keyboard.press('Enter'); // Confirmar
                log('✅ Sugerencia seleccionada con flechas', 'green');
            } catch (e) {
                log('⚠️ No se pudo usar flechas, presionando Enter directo', 'yellow');
                await page.keyboard.press('Enter');
            }

            await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar que cargue resultados
            await page.screenshot({ path: 'paso2-busqueda.png' });

            // PASO 3: Extraer propiedades
            log('📊 Paso 3: Extrayendo propiedades...', 'yellow');

            const properties = await page.evaluate(() => {
                // Buscar todas las posibles tarjetas de propiedades
                const possibleSelectors = [
                    'article',
                    '[data-testid*="property"]',
                    '[class*="PropertyCard"]',
                    '[class*="property-card"]',
                    '[class*="listing"]',
                    'a[href*="/inmueble/"]',
                    'a[href*="/propiedad/"]'
                ];

                let cards = [];
                for (const selector of possibleSelectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        cards = Array.from(elements);
                        console.log(`Encontradas ${cards.length} con selector: ${selector}`);
                        break;
                    }
                }

                return cards.slice(0, 10).map((card, index) => {
                    const getText = (selectors) => {
                        for (const sel of selectors) {
                            const el = card.querySelector(sel);
                            if (el) return el.textContent.trim();
                        }
                        return null;
                    };

                    const getAttr = (selectors, attr) => {
                        for (const sel of selectors) {
                            const el = card.querySelector(sel);
                            if (el && el.getAttribute(attr)) return el.getAttribute(attr);
                        }
                        return null;
                    };

                    return {
                        index: index + 1,
                        title: getText(['h2', 'h3', '[class*="title"]', '[class*="Title"]']),
                        price: getText(['[class*="price"]', '[class*="Price"]', 'span:has-text("$")']),
                        location: getText(['[class*="location"]', '[class*="address"]', '[class*="Address"]']),
                        url: getAttr(['a'], 'href') || card.querySelector('a')?.href,
                        image: getAttr(['img'], 'src') || getAttr(['img'], 'data-src'),
                        bedrooms: getText(['[class*="bedroom"]', '[class*="recamara"]']),
                        bathrooms: getText(['[class*="bathroom"]', '[class*="baño"]']),
                        area: getText(['[class*="area"]', '[class*="superficie"]', '[class*="m²"]']),
                        outerHTML: card.outerHTML.slice(0, 500) + '...' // Primeros 500 chars
                    };
                });
            });

            if (properties.length > 0) {
                log(`✅ ${properties.length} propiedades encontradas\n`, 'green');

                // Guardar resultados
                const filename = `propiedades-culiacan-${Date.now()}.json`;
                fs.writeFileSync(filename, JSON.stringify(properties, null, 2));
                log(`💾 Guardado en: ${filename}`, 'green');

                // Mostrar preview
                log('\n📋 Preview:', 'cyan');
                properties.slice(0, 3).forEach(p => {
                    console.log(`\n${p.index}. ${p.title || 'Sin título'}`);
                    console.log(`   💰 ${p.price || 'N/A'}`);
                    console.log(`   📍 ${p.location || 'N/A'}`);
                    console.log(`   🔗 ${p.url || 'N/A'}`);
                });
            } else {
                log('⚠️  No se encontraron propiedades', 'yellow');
                log('💡 Revisa paso2-busqueda.png para ver qué cargó', 'yellow');
            }

        } else {
            log('❌ No se encontró el input de búsqueda', 'red');
            log('💡 Revisa paso1-home.png', 'yellow');
        }

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, 'red');
        await page.screenshot({ path: 'error.png' });
    }

    log('\n⏸️  Presiona Ctrl+C para cerrar el navegador\n', 'cyan');
    // No cerrar automáticamente para que puedas inspeccionar
    // await browser.close();
}

scrape();
