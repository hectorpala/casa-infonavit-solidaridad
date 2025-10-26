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
const axios = require('axios');

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
        headless: false, // Modo con interfaz visible (para debugging)
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
// VERIFICACIÓN HTTP RÁPIDA
// ============================================

/**
 * Verifica el estado HTTP de las URLs en paralelo usando HEAD requests
 * Marca URLs removidas/caídas antes de guardarlas
 */
async function verifyUrls(urls) {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 VERIFICACIÓN HTTP DE URLs                                ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📊 Verificando ${urls.length} URLs en paralelo...`);
    console.log('');

    const results = {
        valid: [],
        removed: [],
        blocked: [], // 403 Cloudflare
        errors: []
    };

    const batchSize = 5; // Reducir a 5 para evitar rate limiting
    const batches = [];

    for (let i = 0; i < urls.length; i += batchSize) {
        batches.push(urls.slice(i, i + batchSize));
    }

    let processed = 0;

    for (const batch of batches) {
        const promises = batch.map(async (url) => {
            try {
                const response = await axios.head(url, {
                    timeout: 8000,
                    maxRedirects: 5,
                    validateStatus: (status) => status < 500,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                        'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    }
                });

                // Verificar si redirigió al home (propiedad removida)
                const finalUrl = response.request?.res?.responseUrl || url;
                const isHomePage = finalUrl.endsWith('inmuebles24.com/') ||
                                  finalUrl === 'https://www.inmuebles24.com/';

                if (isHomePage) {
                    results.removed.push({
                        url,
                        reason: 'Redirige al home (propiedad removida)',
                        status: response.status
                    });
                } else if (response.status === 403) {
                    // Cloudflare bloqueó, consideramos como válida pero bloqueada
                    results.blocked.push({
                        url,
                        reason: 'Bloqueado por Cloudflare (403)',
                        status: 403
                    });
                } else if (response.status >= 200 && response.status < 400) {
                    results.valid.push(url);
                } else {
                    results.errors.push({
                        url,
                        reason: `HTTP ${response.status}`,
                        status: response.status
                    });
                }
            } catch (error) {
                // Si es 403, lo contamos como bloqueado, no error
                if (error.response && error.response.status === 403) {
                    results.blocked.push({
                        url,
                        reason: 'Bloqueado por Cloudflare (403)',
                        status: 403
                    });
                } else {
                    results.errors.push({
                        url,
                        reason: error.code || error.message,
                        status: error.response?.status || 0
                    });
                }
            }

            processed++;
            if (processed % 10 === 0 || processed === urls.length) {
                process.stdout.write(`\r   ⏳ Progreso: ${processed}/${urls.length} URLs verificadas...`);
            }
        });

        await Promise.all(promises);
    }

    console.log('\n');
    console.log('📊 RESULTADOS DE VERIFICACIÓN:');
    console.log(`   ✅ URLs válidas: ${results.valid.length}`);
    console.log(`   🔒 URLs bloqueadas (Cloudflare): ${results.blocked.length}`);
    console.log(`   ⚠️  URLs removidas/redirect: ${results.removed.length}`);
    console.log(`   ❌ URLs con errores: ${results.errors.length}`);
    console.log('');

    // Nota sobre URLs bloqueadas
    if (results.blocked.length > 0) {
        console.log('💡 NOTA: Las URLs bloqueadas (403) probablemente son válidas pero Cloudflare');
        console.log('   bloquea HEAD requests. Se incluyen en el archivo de salida como válidas.');
        console.log('');
    }

    // Mostrar detalles de URLs removidas (primeras 5)
    if (results.removed.length > 0) {
        console.log('⚠️  URLs REMOVIDAS (primeras 5):');
        results.removed.slice(0, 5).forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.reason} - ${item.url.substring(0, 80)}...`);
        });
        if (results.removed.length > 5) {
            console.log(`   ... y ${results.removed.length - 5} más`);
        }
        console.log('');
    }

    // Mostrar detalles de errores (primeras 5)
    if (results.errors.length > 0) {
        console.log('❌ URLs CON ERRORES (primeras 5):');
        results.errors.slice(0, 5).forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.reason} - ${item.url.substring(0, 80)}...`);
        });
        if (results.errors.length > 5) {
            console.log(`   ... y ${results.errors.length - 5} más`);
        }
        console.log('');
    }

    return results;
}

// ============================================
// GUARDAR RESULTADOS
// ============================================

/**
 * Extrae criterio de búsqueda legible desde la URL
 */
function extractSearchCriteria(searchUrl) {
    try {
        const url = new URL(searchUrl);
        const pathname = url.pathname;

        // Extraer partes del path (ej: /casas-en-venta-en-culiacan-de-3500000-a-3550000-pesos.html)
        const parts = pathname.split('/').pop().replace('.html', '').split('-');

        // Detectar ciudad
        const cityMatch = pathname.match(/en-([a-z]+)/);
        const city = cityMatch ? cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1) : 'N/A';

        // Detectar rango de precio
        const priceMatch = pathname.match(/de-(\d+)-a-(\d+)-pesos/);
        const priceRange = priceMatch ? `$${parseInt(priceMatch[1]).toLocaleString()} - $${parseInt(priceMatch[2]).toLocaleString()}` : 'N/A';

        // Detectar tipo
        const type = pathname.includes('casas') ? 'Casas' : pathname.includes('departamentos') ? 'Departamentos' : 'Propiedades';
        const operation = pathname.includes('venta') ? 'Venta' : pathname.includes('renta') ? 'Renta' : 'N/A';

        return {
            type,
            operation,
            city,
            priceRange,
            fullUrl: searchUrl
        };
    } catch (error) {
        return {
            type: 'N/A',
            operation: 'N/A',
            city: 'N/A',
            priceRange: 'N/A',
            fullUrl: searchUrl
        };
    }
}

async function saveResults(urls, verificationResults, searchUrl, pagesProcessed) {
    const now = new Date();
    const timestamp = now.toISOString();
    const dateFormatted = now.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Generar nombre de archivo con timestamp
    const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const baseFileName = `urls-inmuebles24-${dateString}-${timeString}`;

    // Extraer criterio de búsqueda
    const criteria = extractSearchCriteria(searchUrl);

    // Combinar URLs válidas + bloqueadas (las bloqueadas probablemente son válidas)
    const allValidUrls = [...verificationResults.valid, ...verificationResults.blocked.map(b => b.url)];

    const data = {
        metadata: {
            timestampISO: timestamp,
            timestampReadable: dateFormatted,
            searchCriteria: criteria,
            pagesProcessed: pagesProcessed
        },
        statistics: {
            totalExtracted: urls.length,
            validUrls: verificationResults.valid.length,
            blockedUrls: verificationResults.blocked.length,
            totalUsableUrls: allValidUrls.length,
            removedUrls: verificationResults.removed.length,
            errorUrls: verificationResults.errors.length,
            usablePercentage: urls.length > 0 ? ((allValidUrls.length / urls.length) * 100).toFixed(2) + '%' : '0%'
        },
        urls: {
            valid: verificationResults.valid,
            blocked: verificationResults.blocked,
            removed: verificationResults.removed,
            errors: verificationResults.errors
        }
    };

    // Guardar JSON completo
    const jsonFile = `${baseFileName}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`💾 Datos completos guardados en: ${jsonFile}`);
    console.log('');

    // Guardar URLs válidas + bloqueadas en texto plano
    const txtFile = `${baseFileName}-valid.txt`;
    fs.writeFileSync(txtFile, allValidUrls.join('\n'), 'utf8');
    console.log(`💾 URLs válidas (incluye bloqueadas) guardadas en: ${txtFile}`);
    console.log('');

    // Guardar URLs removidas en archivo separado
    if (verificationResults.removed.length > 0) {
        const removedFile = `${baseFileName}-removed.txt`;
        const removedContent = verificationResults.removed.map(item =>
            `${item.url} | ${item.reason}`
        ).join('\n');
        fs.writeFileSync(removedFile, removedContent, 'utf8');
        console.log(`⚠️  URLs removidas guardadas en: ${removedFile}`);
        console.log('');
    }

    // Mostrar resumen
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  📊 RESUMEN DEL LOTE                                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📅 Fecha: ${dateFormatted}`);
    console.log(`🔍 Criterio: ${criteria.type} en ${criteria.operation} - ${criteria.city}`);
    console.log(`💰 Rango: ${criteria.priceRange}`);
    console.log(`📄 Páginas procesadas: ${pagesProcessed}`);
    console.log('');
    console.log('📊 ESTADÍSTICAS:');
    console.log(`   • URLs extraídas: ${urls.length}`);
    console.log(`   • URLs válidas (verificadas): ${verificationResults.valid.length}`);
    console.log(`   • URLs bloqueadas (probablemente válidas): ${verificationResults.blocked.length}`);
    console.log(`   • URLs usables totales: ${allValidUrls.length} (${data.statistics.usablePercentage})`);
    console.log(`   • URLs removidas: ${verificationResults.removed.length}`);
    console.log(`   • URLs con error: ${verificationResults.errors.length}`);
    console.log('');

    // Mostrar primeras 10 URLs usables como muestra
    console.log('📋 PRIMERAS 10 URLs USABLES:');
    allValidUrls.slice(0, 10).forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
    });

    if (allValidUrls.length > 10) {
        console.log(`   ... y ${allValidUrls.length - 10} más`);
    }
    console.log('');

    return {
        jsonFile,
        txtFile,
        stats: data.statistics
    };
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
    let extractedUrls;
    let pagesProcessed;

    extractURLs(searchUrl, maxPages)
        .then(urls => {
            extractedUrls = urls;
            pagesProcessed = Math.min(maxPages, urls.length > 0 ? maxPages : 1);
            // Verificar URLs
            return verifyUrls(urls);
        })
        .then(verificationResults => {
            // Guardar resultados con verificación
            return saveResults(extractedUrls, verificationResults, searchUrl, pagesProcessed);
        })
        .then((results) => {
            console.log('╔═══════════════════════════════════════════════════════════════╗');
            console.log('║  ✅ PROCESO COMPLETADO EXITOSAMENTE                          ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝');
            console.log('');
            console.log('📁 ARCHIVOS GENERADOS:');
            console.log(`   • ${results.jsonFile} (datos completos)`);
            console.log(`   • ${results.txtFile} (solo URLs válidas)`);
            console.log('');
            process.exit(0);
        })
        .catch(error => {
            console.error('');
            console.error('╔═══════════════════════════════════════════════════════════════╗');
            console.error('║  ❌ ERROR                                                     ║');
            console.error('╚═══════════════════════════════════════════════════════════════╝');
            console.error('');
            console.error(`💥 ${error.message}`);
            console.error('');
            if (error.stack) {
                console.error('Stack trace:');
                console.error(error.stack);
            }
            console.error('');
            process.exit(1);
        });
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

module.exports = {
    extractURLs,
    verifyUrls,
    saveResults,
    extractSearchCriteria
};
