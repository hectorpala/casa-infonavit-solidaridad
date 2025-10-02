#!/usr/bin/env node

/**
 * Scraper para propiedades.com
 * Usa Puppeteer para simular navegador real y bypassar protecciones
 *
 * Instalación:
 *   npm install puppeteer
 *
 * Uso:
 *   node scraper-propiedades.js --city culiacan --state sinaloa --type venta --limit 20
 */

const fs = require('fs');
const path = require('path');

// Check if puppeteer is installed
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (error) {
    console.error('❌ Puppeteer no está instalado.');
    console.error('   Ejecuta: npm install puppeteer');
    process.exit(1);
}

// Configuración
const config = {
    city: process.argv.includes('--city') ? process.argv[process.argv.indexOf('--city') + 1] : 'culiacan',
    state: process.argv.includes('--state') ? process.argv[process.argv.indexOf('--state') + 1] : 'sinaloa',
    type: process.argv.includes('--type') ? process.argv[process.argv.indexOf('--type') + 1] : 'venta',
    limit: process.argv.includes('--limit') ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) : 20,
    outputFormat: process.argv.includes('--format') ? process.argv[process.argv.indexOf('--format') + 1] : 'json',
    headless: !process.argv.includes('--show-browser')
};

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function scrapeProperties() {
    log('\n╔═══════════════════════════════════════════════════════╗', 'bright');
    log('║         🕷️  Scraper propiedades.com                  ║', 'bright');
    log('╚═══════════════════════════════════════════════════════╝\n', 'bright');

    log(`📍 Ciudad: ${config.city}, ${config.state}`, 'cyan');
    log(`🏠 Tipo: ${config.type}`, 'cyan');
    log(`📊 Límite: ${config.limit} propiedades`, 'cyan');
    log(`💾 Formato: ${config.outputFormat}\n`, 'cyan');

    const browser = await puppeteer.launch({
        headless: config.headless,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();

    // Configurar User-Agent real
    await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Configurar viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Interceptar requests para ver APIs
    const apiCalls = [];
    page.on('response', async response => {
        const url = response.url();
        if (url.includes('/api/') || url.includes('/graphql') || url.includes('.json')) {
            try {
                const contentType = response.headers()['content-type'];
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    apiCalls.push({ url, data });
                }
            } catch (error) {
                // Ignorar errores de parsing
            }
        }
    });

    try {
        // Construir URL de búsqueda
        const searchUrl = `https://propiedades.com/${config.type}/${config.state}/${config.city}`;
        log(`🌐 Navegando a: ${searchUrl}`, 'yellow');

        await page.goto(searchUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        log('⏳ Esperando que cargue el contenido...', 'yellow');

        // Esperar a que carguen las propiedades (ajustar selector según el sitio)
        const possibleSelectors = [
            '[data-testid="property-card"]',
            '.property-card',
            '[class*="PropertyCard"]',
            '[class*="listing"]',
            'article',
            '[data-id*="property"]'
        ];

        let loadedSelector = null;
        for (const selector of possibleSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                loadedSelector = selector;
                log(`✅ Encontrado contenido con selector: ${selector}`, 'green');
                break;
            } catch (error) {
                continue;
            }
        }

        if (!loadedSelector) {
            log('⚠️  No se encontró selector de propiedades. Analizando APIs...', 'yellow');

            if (apiCalls.length > 0) {
                log(`\n📡 APIs detectadas (${apiCalls.length}):`, 'cyan');
                apiCalls.forEach((call, i) => {
                    console.log(`\n${i + 1}. ${call.url}`);
                    if (call.data && call.data.length) {
                        console.log(`   Datos: ${call.data.length} items`);
                    }
                });

                // Guardar APIs para análisis
                fs.writeFileSync(
                    'apis-detected.json',
                    JSON.stringify(apiCalls, null, 2)
                );
                log('\n💾 APIs guardadas en apis-detected.json', 'green');
            }

            // Hacer screenshot para debug
            await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
            log('📸 Screenshot guardado en debug-screenshot.png', 'cyan');
        } else {
            // Extraer propiedades del DOM
            log('\n🔍 Extrayendo datos de propiedades...', 'yellow');

            const properties = await page.evaluate((selector, limit) => {
                const cards = Array.from(document.querySelectorAll(selector)).slice(0, limit);

                return cards.map(card => {
                    // Intentar extraer datos comunes
                    const extractText = (selectors) => {
                        for (const sel of selectors) {
                            const el = card.querySelector(sel);
                            if (el) return el.textContent.trim();
                        }
                        return null;
                    };

                    const extractAttr = (selectors, attr) => {
                        for (const sel of selectors) {
                            const el = card.querySelector(sel);
                            if (el && el.getAttribute(attr)) return el.getAttribute(attr);
                        }
                        return null;
                    };

                    return {
                        title: extractText(['h2', 'h3', '[class*="title"]', '[class*="Title"]']),
                        price: extractText([
                            '[class*="price"]',
                            '[class*="Price"]',
                            '[data-testid*="price"]'
                        ]),
                        location: extractText([
                            '[class*="location"]',
                            '[class*="Location"]',
                            '[class*="address"]'
                        ]),
                        bedrooms: extractText([
                            '[class*="bedroom"]',
                            '[class*="Bedroom"]',
                            '[data-testid*="bedroom"]'
                        ]),
                        bathrooms: extractText([
                            '[class*="bathroom"]',
                            '[class*="Bathroom"]',
                            '[data-testid*="bathroom"]'
                        ]),
                        area: extractText([
                            '[class*="area"]',
                            '[class*="Area"]',
                            '[class*="surface"]'
                        ]),
                        image: extractAttr(['img'], 'src') || extractAttr(['img'], 'data-src'),
                        url: extractAttr(['a'], 'href'),
                        html: card.outerHTML
                    };
                });
            }, loadedSelector, config.limit);

            log(`✅ ${properties.length} propiedades extraídas`, 'green');

            // Guardar resultados
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `propiedades-${config.city}-${timestamp}`;

            if (config.outputFormat === 'json') {
                fs.writeFileSync(
                    `${filename}.json`,
                    JSON.stringify(properties, null, 2)
                );
                log(`\n💾 Datos guardados en: ${filename}.json`, 'green');
            } else if (config.outputFormat === 'csv') {
                const csv = convertToCSV(properties);
                fs.writeFileSync(`${filename}.csv`, csv);
                log(`\n💾 Datos guardados en: ${filename}.csv`, 'green');
            }

            // Mostrar preview
            log('\n📋 Preview (primeras 3 propiedades):', 'cyan');
            properties.slice(0, 3).forEach((prop, i) => {
                console.log(`\n${i + 1}. ${prop.title || 'Sin título'}`);
                console.log(`   💰 ${prop.price || 'Precio no disponible'}`);
                console.log(`   📍 ${prop.location || 'Ubicación no disponible'}`);
                console.log(`   🛏️  ${prop.bedrooms || 'N/A'} | 🚿 ${prop.bathrooms || 'N/A'}`);
            });
        }

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, 'red');
        console.error(error);

        // Screenshot de error
        try {
            await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
            log('📸 Screenshot de error: error-screenshot.png', 'yellow');
        } catch {}
    } finally {
        await browser.close();
    }
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]).filter(k => k !== 'html');
    const rows = data.map(item => {
        return headers.map(header => {
            const value = item[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}

// Ejecutar
scrapeProperties().catch(error => {
    log(`\n❌ Error fatal: ${error.message}`, 'red');
    process.exit(1);
});
