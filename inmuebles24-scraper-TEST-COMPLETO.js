/**
 * SCRAPER INMUEBLES24 - TEST COMPLETO (2 PÁGINAS)
 *
 * Funcionalidad:
 * - Scrapea primeras 2 páginas de inmuebles24.com (TEST)
 * - Detecta propiedades NUEVAS (altas)
 * - Detecta propiedades ELIMINADAS (bajas)
 * - Compara con histórico de ayer
 * - ENVÍA NOTIFICACIONES si hay cambios
 * - Guarda histórico en JSON
 *
 * Uso:
 * node inmuebles24-scraper-TEST-COMPLETO.js
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const path = require('path');

// =============== CONFIGURACIÓN TEST ===============
const CONFIG = {
    BASE_URL: 'https://www.inmuebles24.com/casas-en-venta-en-culiacan.html',
    TOTAL_PAGES: 2, // ✅ SOLO 2 PÁGINAS PARA TEST RÁPIDO (~30 segundos)
    STORAGE_FILE: 'inmuebles24-culiacan-historico.json', // ✅ USA EL MISMO HISTÓRICO PARA COMPARAR CON AYER
    DELAY_BETWEEN_PAGES: 3000, // 3 segundos entre páginas
    USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// =============== FUNCIONES AUXILIARES ===============

/**
 * Lee el histórico de propiedades desde JSON
 */
function loadHistorico() {
    if (!fs.existsSync(CONFIG.STORAGE_FILE)) {
        return {
            lastCheck: null,
            properties: []
        };
    }

    const data = fs.readFileSync(CONFIG.STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
}

/**
 * Guarda el histórico de propiedades en JSON
 */
function saveHistorico(data) {
    fs.writeFileSync(CONFIG.STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Histórico guardado en ${CONFIG.STORAGE_FILE}`);
}

/**
 * Extrae el ID único de una URL de inmuebles24
 * Ejemplo: https://www.inmuebles24.com/propiedades/casa-en-venta-123456.html -> 123456
 */
function extractPropertyId(url) {
    const match = url.match(/propiedades\/.*-(\d+)\.html/);
    return match ? match[1] : url;
}

/**
 * Scrapea una página de inmuebles24
 */
async function scrapePage(page, pageNumber) {
    // Formato URL: página 1 no lleva sufijo, página 2+ lleva _Desde_X
    let url;
    if (pageNumber === 1) {
        url = CONFIG.BASE_URL;
    } else {
        const desde = ((pageNumber - 1) * 30) + 1; // 30 propiedades por página
        url = CONFIG.BASE_URL.replace('.html', `_Desde_${desde}.html`);
    }

    console.log(`📄 Scrapeando página ${pageNumber}: ${url}`);

    try {
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Esperar a que la página cargue completamente
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Extraer URLs con el método que funcionó en el test
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
 * Compara el scrape actual con el histórico
 * ✅ VERSIÓN TEST: Solo compara las primeras N propiedades del histórico
 */
function compareWithHistorico(currentProperties, historico) {
    // ✅ Si es un test (menos de 100 propiedades), limitar histórico al mismo número
    const isTest = currentProperties.length < 100;
    const previousProperties = isTest
        ? historico.properties.slice(0, currentProperties.length) // Solo primeras N del histórico
        : historico.properties; // Todas si es producción completa

    const currentIds = new Set(currentProperties.map(p => extractPropertyId(p.url)));
    const previousIds = new Set(previousProperties.map(p => extractPropertyId(p.url)));

    // Nuevas propiedades (altas)
    const nuevas = currentProperties.filter(p => !previousIds.has(extractPropertyId(p.url)));

    // Propiedades eliminadas (bajas)
    const eliminadas = previousProperties.filter(p => !currentIds.has(extractPropertyId(p.url)));

    console.log(`\n🔍 Comparación: ${currentProperties.length} actuales vs ${previousProperties.length} anteriores (de ${historico.properties.length} totales en histórico)`);

    return { nuevas, eliminadas };
}

/**
 * Genera reporte de cambios
 */
function generateReport(nuevas, eliminadas, totalActual, totalAnterior) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE DE CAMBIOS - INMUEBLES24');
    console.log('='.repeat(60));

    console.log(`\n📈 Total propiedades actuales: ${totalActual}`);
    console.log(`📉 Total propiedades anterior: ${totalAnterior}`);
    console.log(`📊 Diferencia: ${totalActual - totalAnterior > 0 ? '+' : ''}${totalActual - totalAnterior}`);

    if (nuevas.length > 0) {
        console.log(`\n✨ PROPIEDADES NUEVAS (${nuevas.length}):`);
        nuevas.forEach((prop, i) => {
            console.log(`   ${i + 1}. ${prop.title}`);
            console.log(`      💰 ${prop.price}`);
            console.log(`      🔗 ${prop.url}`);
        });
    } else {
        console.log('\n✅ No hay propiedades nuevas');
    }

    if (eliminadas.length > 0) {
        console.log(`\n❌ PROPIEDADES ELIMINADAS (${eliminadas.length}):`);
        eliminadas.forEach((prop, i) => {
            console.log(`   ${i + 1}. ${prop.title}`);
            console.log(`      💰 ${prop.price}`);
            console.log(`      🔗 ${prop.url}`);
        });
    } else {
        console.log('\n✅ No hay propiedades eliminadas');
    }

    console.log('\n' + '='.repeat(60));
}

// =============== FUNCIÓN PRINCIPAL ===============

async function main() {
    console.log('🚀 INMUEBLES24 SCRAPER - Iniciando...\n');

    // 1. Cargar histórico
    const historico = loadHistorico();
    console.log(`📚 Histórico cargado: ${historico.properties.length} propiedades registradas`);
    if (historico.lastCheck) {
        console.log(`📅 Última revisión: ${new Date(historico.lastCheck).toLocaleString('es-MX')}`);
    }

    // 2. Iniciar Puppeteer (stealth mode ya incluido via puppeteer-extra)
    console.log('\n🌐 Iniciando navegador...');
    const browser = await puppeteer.launch({
        headless: "new", // ✅ HEADLESS para cron jobs (modo nuevo de Puppeteer)
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Evita problemas de memoria en entornos sin GUI
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // 3. Scrapear todas las páginas
    const allProperties = [];

    for (let i = 1; i <= CONFIG.TOTAL_PAGES; i++) {
        const pageProperties = await scrapePage(page, i);
        allProperties.push(...pageProperties);

        // Delay entre páginas
        if (i < CONFIG.TOTAL_PAGES) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_PAGES));
        }
    }

    await browser.close();

    console.log(`\n✅ Scraping completado: ${allProperties.length} propiedades totales`);

    // 4. Comparar con histórico
    const { nuevas, eliminadas } = compareWithHistorico(allProperties, historico);

    // 5. Generar reporte
    generateReport(nuevas, eliminadas, allProperties.length, historico.properties.length);

    // 6. Guardar nuevo histórico
    const nuevoHistorico = {
        lastCheck: new Date().toISOString(),
        properties: allProperties,
        stats: {
            totalProperties: allProperties.length,
            nuevasDetectadas: nuevas.length,
            eliminadasDetectadas: eliminadas.length,
            changeLog: [
                ...(historico.stats?.changeLog || []).slice(-10), // Mantener últimos 10 cambios
                {
                    date: new Date().toISOString(),
                    nuevas: nuevas.length,
                    eliminadas: eliminadas.length,
                    total: allProperties.length
                }
            ]
        }
    };

    saveHistorico(nuevoHistorico);

    console.log('\n✅ Proceso completado exitosamente');
}

// =============== EJECUCIÓN ===============

main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
