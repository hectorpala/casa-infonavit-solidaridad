/**
 * SCRAPER INMUEBLES24 - TEST VERSION (SOLO 1 PÁGINA)
 *
 * Test rápido para verificar que:
 * - Mac despierta automáticamente
 * - WiFi se conecta
 * - Puppeteer funciona en headless
 * - Scraper completa exitosamente
 *
 * Uso:
 * node inmuebles24-scraper-TEST.js
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const path = require('path');

// =============== CONFIGURACIÓN TEST ===============
const CONFIG = {
    BASE_URL: 'https://www.inmuebles24.com/casas-en-venta-en-culiacan.html',
    TOTAL_PAGES: 1, // ✅ SOLO 1 PÁGINA PARA TEST
    STORAGE_FILE: 'inmuebles24-TEST-result.json',
    DELAY_BETWEEN_PAGES: 2000, // 2 segundos
    USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// =============== FUNCIONES AUXILIARES ===============

/**
 * Scrapea una página de inmuebles24
 */
async function scrapePage(page, pageNumber) {
    // Formato URL: página 1 no lleva sufijo
    let url = CONFIG.BASE_URL;

    console.log(`📄 Scrapeando página ${pageNumber}: ${url}`);

    try {
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Esperar a que la página cargue completamente
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Extraer URLs
        const properties = await page.evaluate(() => {
            const links = document.querySelectorAll('a[href]');
            const results = [];
            const seen = new Set();

            links.forEach(link => {
                const href = link.href;

                // Solo enlaces que contienen IDs de propiedades (7+ dígitos)
                if (href.includes('inmuebles24.com') &&
                    (href.match(/-(\d{7,})-/) || href.match(/(\d{7,})\.html/))) {

                    if (!seen.has(href)) {
                        seen.add(href);

                        const title = link.textContent?.trim() ||
                                     link.querySelector('[class*="title"]')?.textContent?.trim() ||
                                     'Sin título';

                        // Buscar precio en el contexto del enlace
                        const parent = link.closest('[class*="card"], [class*="posting"], article, li');
                        const priceEl = parent?.querySelector('[class*="price"], [class*="Price"]');

                        results.push({
                            url: href,
                            title: title.substring(0, 150), // Limitar longitud
                            price: priceEl?.textContent?.trim() || 'Consultar',
                            scrapedAt: new Date().toISOString()
                        });
                    }
                }
            });

            return results;
        });

        console.log(`   ✅ ${properties.length} propiedades encontradas`);
        return properties;

    } catch (error) {
        console.error(`   ❌ Error en página ${pageNumber}:`, error.message);
        return [];
    }
}

/**
 * Genera reporte de test
 */
function generateTestReport(properties, startTime, endTime) {
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('🧪 REPORTE DE TEST - INMUEBLES24');
    console.log('='.repeat(60));

    console.log(`\n⏱️  Tiempo de ejecución: ${duration} segundos`);
    console.log(`📊 Propiedades encontradas: ${properties.length}`);
    console.log(`📅 Fecha: ${new Date().toLocaleString('es-MX')}`);

    if (properties.length > 0) {
        console.log(`\n✅ TEST EXITOSO - Primeras 5 propiedades:`);
        properties.slice(0, 5).forEach((prop, i) => {
            console.log(`   ${i + 1}. ${prop.title.substring(0, 80)}...`);
            console.log(`      💰 ${prop.price}`);
            console.log(`      🔗 ${prop.url.substring(0, 80)}...`);
        });
    } else {
        console.log('\n❌ TEST FALLIDO - No se encontraron propiedades');
        console.log('   Posibles causas:');
        console.log('   1. Sin conexión WiFi');
        console.log('   2. Inmuebles24 bloqueó las requests');
        console.log('   3. Cambió estructura del sitio');
    }

    console.log('\n' + '='.repeat(60));
}

// =============== FUNCIÓN PRINCIPAL ===============

async function main() {
    const startTime = Date.now();

    console.log('🧪 INMUEBLES24 SCRAPER - TEST MODE (1 página)');
    console.log('⏰ Inicio: ' + new Date().toLocaleString('es-MX'));
    console.log('');

    // 1. Iniciar Puppeteer
    console.log('🌐 Iniciando navegador headless...');
    const browser = await puppeteer.launch({
        headless: "new", // ✅ HEADLESS para test automático
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(CONFIG.USER_AGENT);

    // 2. Scrapear página
    const properties = await scrapePage(page, 1);

    await browser.close();

    const endTime = Date.now();

    // 3. Generar reporte
    generateTestReport(properties, startTime, endTime);

    // 4. Guardar resultado
    const testResult = {
        success: properties.length > 0,
        timestamp: new Date().toISOString(),
        duration: ((endTime - startTime) / 1000).toFixed(1),
        propertiesFound: properties.length,
        properties: properties.slice(0, 10), // Solo primeras 10 para no saturar
        environment: {
            hostname: require('os').hostname(),
            platform: process.platform,
            nodeVersion: process.version
        }
    };

    fs.writeFileSync(CONFIG.STORAGE_FILE, JSON.stringify(testResult, null, 2), 'utf-8');
    console.log(`\n✅ Resultado guardado en ${CONFIG.STORAGE_FILE}`);

    // 5. Exit code
    process.exit(properties.length > 0 ? 0 : 1);
}

// =============== EJECUCIÓN ===============

main().catch(error => {
    console.error('❌ Error fatal:', error);

    // Guardar error
    fs.writeFileSync(CONFIG.STORAGE_FILE, JSON.stringify({
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
    }, null, 2), 'utf-8');

    process.exit(1);
});
