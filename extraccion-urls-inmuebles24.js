#!/usr/bin/env node

/**
 * EXTRACTOR RÁPIDO DE URLs - INMUEBLES24.COM
 *
 * Herramienta optimizada para extraer URLs de propiedades desde páginas de búsqueda de Inmuebles24.
 * Usa la misma configuración anti-bot que inmuebles24culiacanscraper.js para evitar bloqueos.
 *
 * USO:
 *   node extraccion-urls-inmuebles24.js "URL_BUSQUEDA"
 *   node extraccion-urls-inmuebles24.js "URL_BUSQUEDA" --max-pages 10
 *
 * EJEMPLO:
 *   node extraccion-urls-inmuebles24.js "https://www.inmuebles24.com/casas-en-venta-en-culiacan-de-3500000-a-3550000-pesos-inmobiliaria.html"
 *
 * SALIDA:
 *   - JSON con lista de URLs únicas de propiedades
 *   - Archivo: urls-extraidas-inmuebles24.json
 *   - Console log con progreso
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
    timeout: 60000,
    maxPages: 5, // Máximo de páginas a procesar
    delay: 2000  // Delay después de page.goto para asegurar DOM cargado
};

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function extractURLs(searchUrl, maxPages = CONFIG.maxPages) {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 EXTRACTOR RÁPIDO DE URLs - INMUEBLES24.COM              ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📋 URL de búsqueda: ${searchUrl}`);
    console.log(`📄 Páginas máximas: ${maxPages}`);
    console.log('');

    const browser = await puppeteer.launch({
        headless: 'new', // Modo headless (invisible)
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-web-security',
            '--flag-switches-begin',
            '--disable-site-isolation-trials',
            '--flag-switches-end'
        ],
        ignoreDefaultArgs: ['--enable-automation']
    });

    const page = await browser.newPage();

    // Configurar viewport realista
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
    });

    // Headers realistas
    await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    });

    // User agent realista
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Evasiones adicionales
    await page.evaluateOnNewDocument(() => {
        // Override del lenguaje
        Object.defineProperty(navigator, 'language', {
            get: () => 'es-MX'
        });
        Object.defineProperty(navigator, 'languages', {
            get: () => ['es-MX', 'es', 'en-US', 'en']
        });

        // Chrome runtime
        window.chrome = {
            runtime: {}
        };

        // Permisos
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
    });

    const allUrls = new Set(); // Usar Set para eliminar duplicados automáticamente
    let currentPage = 1;
    let currentUrl = searchUrl;

    // Loop para procesar múltiples páginas
    while (currentPage <= maxPages) {
        console.log(`\n────────────────────────────────────────────────────────────────`);
        console.log(`📄 PÁGINA ${currentPage}: ${currentUrl}`);
        console.log(`────────────────────────────────────────────────────────────────`);

        try {
            // Navegar a la página
            console.log('🌐 Navegando...');
            await page.goto(currentUrl, {
                waitUntil: 'networkidle2',
                timeout: CONFIG.timeout
            });

            // Delay para asegurar que DOM esté completamente cargado
            console.log(`⏳ Esperando ${CONFIG.delay}ms para carga completa del DOM...`);
            await new Promise(res => setTimeout(res, CONFIG.delay));

            // Extraer URLs en un único page.evaluate
            console.log('🔍 Extrayendo URLs de propiedades...');
            const urls = await page.evaluate(() => {
                // Obtener todos los links
                const links = Array.from(document.querySelectorAll('a'));

                // Extraer href, normalizar y filtrar
                const propertyUrls = links
                    .map(link => {
                        const href = link.getAttribute('href');
                        if (!href) return null;

                        try {
                            // Normalizar URL (resolver relativas)
                            return new URL(href, location.href).href;
                        } catch (e) {
                            return null;
                        }
                    })
                    .filter(url => {
                        // Filtrar solo URLs de propiedades de inmuebles24
                        return url && url.includes('inmuebles24.com/propiedades');
                    });

                // Eliminar duplicados usando Set y convertir a array
                return [...new Set(propertyUrls)];
            });

            console.log(`   ✅ Encontradas ${urls.length} URLs únicas en esta página`);

            // Agregar URLs al set global
            urls.forEach(url => allUrls.add(url));

            console.log(`   📊 Total acumulado: ${allUrls.size} URLs únicas`);

            // Buscar link a la siguiente página
            const nextPageUrl = await page.evaluate(() => {
                // Buscar botón/link de "siguiente" o "página X+1"
                const nextButton = document.querySelector('a[rel="next"]') ||
                                 document.querySelector('a[aria-label="Siguiente"]') ||
                                 document.querySelector('.pagination a.next') ||
                                 document.querySelector('[data-qa="pagination-next"]');

                if (nextButton) {
                    const href = nextButton.getAttribute('href');
                    if (href) {
                        return new URL(href, location.href).href;
                    }
                }
                return null;
            });

            if (nextPageUrl && currentPage < maxPages) {
                console.log(`   ➡️  Siguiente página detectada: ${nextPageUrl.substring(0, 80)}...`);
                currentUrl = nextPageUrl;
                currentPage++;
            } else {
                if (!nextPageUrl) {
                    console.log('   ℹ️  No hay más páginas disponibles');
                } else {
                    console.log(`   ℹ️  Límite de páginas alcanzado (${maxPages})`);
                }
                break;
            }

        } catch (error) {
            console.error(`❌ Error en página ${currentPage}:`, error.message);
            break;
        }
    }

    // Cerrar navegador
    await browser.close();

    // Convertir Set a Array
    const finalUrls = [...allUrls];

    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ EXTRACCIÓN COMPLETADA                                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📊 RESULTADOS:`);
    console.log(`   • Total de URLs únicas: ${finalUrls.length}`);
    console.log(`   • Páginas procesadas: ${currentPage}`);
    console.log('');

    return finalUrls;
}

// ============================================
// GUARDAR RESULTADOS
// ============================================

async function saveResults(urls, outputFile = 'urls-extraidas-inmuebles24.json') {
    const data = {
        timestamp: new Date().toISOString(),
        totalUrls: urls.length,
        urls: urls
    };

    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`💾 URLs guardadas en: ${outputFile}`);
    console.log('');

    // También guardar en formato texto plano
    const txtFile = outputFile.replace('.json', '.txt');
    fs.writeFileSync(txtFile, urls.join('\n'), 'utf8');
    console.log(`💾 URLs guardadas en texto plano: ${txtFile}`);
    console.log('');

    // Mostrar primeras 10 URLs como muestra
    console.log('📋 PRIMERAS 10 URLs EXTRAÍDAS:');
    urls.slice(0, 10).forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
    });

    if (urls.length > 10) {
        console.log(`   ... y ${urls.length - 10} más`);
    }
    console.log('');
}

// ============================================
// EJECUCIÓN DESDE CLI
// ============================================

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('');
        console.log('❌ Error: Debes proporcionar una URL de búsqueda');
        console.log('');
        console.log('USO:');
        console.log('  node extraccion-urls-inmuebles24.js "URL_BUSQUEDA"');
        console.log('  node extraccion-urls-inmuebles24.js "URL_BUSQUEDA" --max-pages 10');
        console.log('');
        console.log('EJEMPLO:');
        console.log('  node extraccion-urls-inmuebles24.js "https://www.inmuebles24.com/casas-en-venta-en-culiacan-de-3500000-a-3550000-pesos-inmobiliaria.html"');
        console.log('');
        process.exit(1);
    }

    const searchUrl = args[0];
    let maxPages = CONFIG.maxPages;

    // Buscar flag --max-pages
    const maxPagesIndex = args.indexOf('--max-pages');
    if (maxPagesIndex !== -1 && args[maxPagesIndex + 1]) {
        maxPages = parseInt(args[maxPagesIndex + 1], 10) || CONFIG.maxPages;
    }

    // Ejecutar extracción
    extractURLs(searchUrl, maxPages)
        .then(urls => {
            return saveResults(urls);
        })
        .then(() => {
            console.log('✅ Proceso completado exitosamente');
            process.exit(0);
        })
        .catch(error => {
            console.error('');
            console.error('❌ ERROR:', error.message);
            console.error('');
            process.exit(1);
        });
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

module.exports = {
    extractURLs,
    saveResults
};
