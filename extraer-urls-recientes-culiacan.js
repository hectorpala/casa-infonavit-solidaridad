// Puppeteer con Stealth Plugin para evitar detección
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');

/**
 * Scraper ligero que solo extrae antigüedad y URLs
 * de propiedades en Culiacán con antigüedad configurable
 *
 * USO:
 *   node extraer-urls-recientes-culiacan.js <url-base> [--max-days N]
 *
 * EJEMPLOS:
 *   # URL básica de Culiacán (35 días por defecto)
 *   node extraer-urls-recientes-culiacan.js "https://www.inmuebles24.com/venta/sinaloa/culiacan/"
 *
 *   # Listado filtrado por precio (35 días por defecto)
 *   node extraer-urls-recientes-culiacan.js "https://www.inmuebles24.com/casas-en-venta-en-culiacan-de-1000000-a-3000000-pesos.html"
 *
 *   # Con antigüedad personalizada (50 días)
 *   node extraer-urls-recientes-culiacan.js "https://www.inmuebles24.com/venta/sinaloa/culiacan/" --max-days 50
 *
 *   # Listado filtrado con 60 días
 *   node extraer-urls-recientes-culiacan.js "https://www.inmuebles24.com/casas-en-venta-en-culiacan-de-1000000-a-3000000-pesos.html" --max-days 60
 */

class InmueblesCuliacanURLExtractor {
    constructor(baseURL = null, maxDays = 35) {
        this.baseURL = baseURL || 'https://www.inmuebles24.com/venta/sinaloa/culiacan/';
        this.maxDays = maxDays;
        this.outputFile = 'urls-propiedades-recientes-culiacan.txt';
        this.outputJSON = 'propiedades-recientes-culiacan.json';
    }

    // Convertir "Publicado hace X días" a número
    extractDaysFromText(text) {
        if (!text) return null;

        const patterns = [
            /publicado hace (\d+) día/i,
            /hace (\d+) día/i,
            /(\d+) día/i,
            /publicado hace (\d+) hora/i,
            /hace (\d+) hora/i,
            /hoy/i,
            /ayer/i
        ];

        if (/hoy|hora|minuto/i.test(text)) return 0;
        if (/ayer/i.test(text)) return 1;

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return parseInt(match[1]);
            }
        }

        return null;
    }

    // Extraer Property ID desde URL
    extractPropertyId(url) {
        const match = url.match(/-(\d+)\.html/);
        return match ? match[1] : null;
    }

    // Construir URL para una página específica
    buildPageURL(pageNumber) {
        // Si es página 1, usar la URL base tal cual
        if (pageNumber === 1) {
            return this.baseURL;
        }

        // Detectar el patrón de la URL base
        const url = this.baseURL;

        // Caso 1: URL termina con / (ej: .../culiacan/)
        if (url.endsWith('/')) {
            return `${url}pagina-${pageNumber}.html`;
        }

        // Caso 2: URL termina con .html (ej: .../culiacan-de-1000000-a-3000000-pesos.html)
        if (url.endsWith('.html')) {
            // Remover el .html y agregar -pagina-N.html
            const base = url.replace(/\.html$/, '');
            return `${base}-pagina-${pageNumber}.html`;
        }

        // Caso 3: URL sin / ni .html final (agregar /)
        return `${url}/pagina-${pageNumber}.html`;
    }

    async extractURLs(maxPages = 5) {
        console.log('═'.repeat(80));
        console.log('🔍 EXTRACTOR DE URLs RECIENTES - INMUEBLES24 CULIACÁN');
        console.log(`📅 Criterio: Propiedades con ≤${this.maxDays} días de antigüedad`);
        console.log(`📄 Páginas a scrapear: hasta ${maxPages}`);
        console.log('═'.repeat(80));
        console.log('\n🚀 Iniciando extracción con anti-detección avanzada...\n');

        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--window-size=1920,1080',
                '--start-maximized'
            ]
        });

        const page = await browser.newPage();

        // Anti-detección AVANZADA
        await page.evaluateOnNewDocument(() => {
            // Ocultar webdriver
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });

            // Agregar plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });

            // Agregar lenguajes
            Object.defineProperty(navigator, 'languages', {
                get: () => ['es-MX', 'es', 'en-US', 'en'],
            });

            // Chrome runtime
            window.chrome = {
                runtime: {},
            };

            // Permisos
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        });

        // User agent más realista
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Headers adicionales
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
        });

        const allProperties = [];
        let shouldStop = false;
        let currentPage = 1;

        while (currentPage <= maxPages && !shouldStop) {
            const url = this.buildPageURL(currentPage);

            console.log(`\n${'─'.repeat(80)}`);
            console.log(`📄 PÁGINA ${currentPage}: ${url}`);
            console.log('─'.repeat(80));

            try {
                console.log('🌐 Navegando a la página...');
                await page.goto(url, {
                    waitUntil: 'networkidle2',
                    timeout: 90000
                });

                console.log('⏳ Esperando 15 segundos para que JavaScript renderice completamente...');
                await new Promise(r => setTimeout(r, 15000));

                // Simular movimiento del mouse (comportamiento humano)
                console.log('🖱️  Simulando movimientos del mouse...');
                await page.mouse.move(100, 200);
                await new Promise(r => setTimeout(r, 500));
                await page.mouse.move(400, 300);
                await new Promise(r => setTimeout(r, 700));
                await page.mouse.move(800, 400);

                // Scroll gradual MÁS LENTO (más humano)
                console.log('📜 Haciendo scroll gradual (simulando humano)...');
                await page.evaluate(async () => {
                    await new Promise((resolve) => {
                        let totalHeight = 0;
                        const distance = 200; // Más lento
                        const timer = setInterval(() => {
                            window.scrollBy(0, distance);
                            totalHeight += distance;

                            if (totalHeight >= document.body.scrollHeight / 2) {
                                clearInterval(timer);
                                resolve();
                            }
                        }, 200); // 200ms entre scrolls (más lento)
                    });
                });

                await new Promise(r => setTimeout(r, 5000)); // Espera más larga

                // Extraer URLs y antigüedad
                console.log('🔍 Extrayendo URLs de propiedades...');
                const properties = await page.evaluate(() => {
                    const result = [];

                    // ESTRATEGIA 1: Buscar por múltiples selectores
                    const selectors = [
                        'a[href*="/propiedades/"]',
                        'a[href*="clasificado"]',
                        'a[data-to-posting]',
                        'a[data-id]',
                        '[class*="posting"] a',
                        '[class*="card"] a',
                        '[class*="item"] a'
                    ];

                    const allLinks = new Set();
                    selectors.forEach(selector => {
                        try {
                            const elements = document.querySelectorAll(selector);
                            elements.forEach(a => {
                                if (a.href && a.href.includes('inmuebles24')) {
                                    allLinks.add(a);
                                }
                            });
                        } catch(e) {
                            console.log('Selector failed:', selector);
                        }
                    });

                    const links = Array.from(allLinks);
                    console.log(`   → Encontrados ${links.length} links totales`);

                    // Filtrar solo links válidos de Inmuebles24
                    const propertyLinks = links.filter(a =>
                        a.href.includes('inmuebles24.com') &&
                        (a.href.includes('/propiedades/') || a.href.includes('clasificado')) &&
                        a.href.match(/-\d+\.html/)  // Debe tener ID numérico
                    );

                    console.log(`   → Filtrados a ${propertyLinks.length} links de propiedades válidas`);

                    // Para cada link, buscar la antigüedad en el padre más cercano
                    propertyLinks.forEach(link => {
                        // Buscar el contenedor padre (card)
                        let parent = link.parentElement;
                        let maxLevelsUp = 5;
                        let currentLevel = 0;

                        while (parent && currentLevel < maxLevelsUp) {
                            // Buscar texto de antigüedad en este nivel
                            const text = parent.textContent.toLowerCase();

                            if (text.includes('publicado') || text.includes('hace') || text.includes('día') || text.includes('hora')) {
                                // Encontramos un contenedor con texto de antigüedad
                                result.push({
                                    url: link.href,
                                    title: link.textContent.substring(0, 80).trim() || 'Sin título',
                                    ageText: parent.textContent.substring(0, 200).trim()
                                });
                                break;
                            }

                            parent = parent.parentElement;
                            currentLevel++;
                        }

                        // Si no encontramos antigüedad, agregar igual (asumimos reciente)
                        if (currentLevel >= maxLevelsUp) {
                            const existsAlready = result.some(p => p.url === link.href);
                            if (!existsAlready) {
                                result.push({
                                    url: link.href,
                                    title: link.textContent.substring(0, 80).trim() || 'Sin título',
                                    ageText: ''
                                });
                            }
                        }
                    });

                    // Deduplicar por URL
                    const unique = [];
                    const seen = new Set();
                    result.forEach(p => {
                        if (!seen.has(p.url)) {
                            seen.add(p.url);
                            unique.push(p);
                        }
                    });

                    return unique;
                });

                console.log(`   ✅ Encontradas ${properties.length} URLs en la página\n`);

                if (properties.length === 0) {
                    console.log('⚠️  No se encontraron propiedades. Deteniendo.');
                    shouldStop = true;
                    break;
                }

                // Procesar cada propiedad
                let validCount = 0;
                let tooOldCount = 0;

                for (const prop of properties) {
                    prop.propertyId = this.extractPropertyId(prop.url);
                    const days = this.extractDaysFromText(prop.ageText);
                    prop.daysOld = days;

                    // Determinar si incluir
                    let shouldInclude = false;
                    let status = '';

                    if (days === null) {
                        // Sin fecha detectada - incluir (probablemente reciente)
                        shouldInclude = true;
                        status = '⚠️  Sin fecha (incluida)';
                    } else if (days <= this.maxDays) {
                        shouldInclude = true;
                        status = `✅ ${days} día${days !== 1 ? 's' : ''}`;
                        validCount++;
                    } else {
                        status = `❌ ${days} días (>${this.maxDays})`;
                        tooOldCount++;
                    }

                    const titleShort = prop.title.substring(0, 50).padEnd(50);
                    console.log(`   ${status.padEnd(25)} | ${titleShort}`);

                    if (shouldInclude) {
                        allProperties.push(prop);
                    }

                    // Si encontramos 5+ propiedades viejas consecutivas, parar
                    if (days !== null && days > this.maxDays) {
                        if (tooOldCount >= 5) {
                            console.log(`\n🛑 Encontradas ${tooOldCount} propiedades consecutivas con >${this.maxDays} días.`);
                            console.log('   Deteniendo extracción.');
                            shouldStop = true;
                            break;
                        }
                    }
                }

                console.log(`\n   📊 Resumen página ${currentPage}:`);
                console.log(`      ✅ Válidas: ${validCount}`);
                console.log(`      ❌ Muy viejas: ${tooOldCount}`);
                console.log(`      ⚠️  Sin fecha: ${properties.length - validCount - tooOldCount}`);

                if (shouldStop) break;

            } catch (error) {
                console.error(`\n❌ Error en página ${currentPage}:`, error.message);
                break;
            }

            currentPage++;
            await new Promise(r => setTimeout(r, 3000));
        }

        await browser.close();

        console.log('\n' + '═'.repeat(80));
        console.log('📊 RESUMEN FINAL');
        console.log('═'.repeat(80));
        console.log(`   📄 Páginas scrapeadas: ${currentPage - 1}`);
        console.log(`   ✅ URLs válidas (≤${this.maxDays} días): ${allProperties.length}`);
        console.log('═'.repeat(80));

        return allProperties;
    }

    // Guardar URLs en formato de texto (una por línea)
    saveURLsToFile(properties) {
        const urls = properties.map(p => p.url).filter(Boolean);

        fs.writeFileSync(this.outputFile, urls.join('\n'), 'utf8');

        console.log(`\n💾 Guardadas ${urls.length} URLs en: ${this.outputFile}`);
        console.log('   📝 Formato: Una URL por línea');
    }

    // Guardar en JSON con toda la info
    saveToJSON(properties) {
        const data = {
            fecha: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            criterio: `≤${this.maxDays} días`,
            total: properties.length,
            propiedades: properties.map(p => ({
                url: p.url,
                propertyId: p.propertyId,
                title: p.title,
                daysOld: p.daysOld,
                ageText: p.ageText
            }))
        };

        fs.writeFileSync(this.outputJSON, JSON.stringify(data, null, 2), 'utf8');

        console.log(`💾 Guardado JSON detallado en: ${this.outputJSON}`);
    }

    // Ejecutar proceso completo
    async run() {
        const startTime = Date.now();

        // 1. Extraer URLs
        const properties = await this.extractURLs(5);

        if (properties.length === 0) {
            console.log('\n⚠️  No se encontraron propiedades válidas.');
            return;
        }

        // 2. Guardar en archivo de texto
        this.saveURLsToFile(properties);

        // 3. Guardar en JSON
        this.saveToJSON(properties);

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log('\n' + '═'.repeat(80));
        console.log('✅ EXTRACCIÓN COMPLETADA');
        console.log('═'.repeat(80));
        console.log(`   ⏱️  Tiempo total: ${elapsedTime} segundos`);
        console.log(`   📊 Total propiedades: ${properties.length}`);
        console.log(`\n📁 Archivos generados:`);
        console.log(`   • ${this.outputFile} - Lista simple de URLs`);
        console.log(`   • ${this.outputJSON} - Datos completos en JSON`);
        console.log('\n🔄 SIGUIENTE PASO: Procesar URLs con el scraper completo');
        console.log(`   node scrapear-batch-urls.js`);
        console.log('═'.repeat(80));

        return properties;
    }
}

// Función para mostrar ayuda
function showUsage() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║  🔍 EXTRACTOR DE URLs RECIENTES - INMUEBLES24                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝

USO:
  node extraer-urls-recientes-culiacan.js <url-base> [--max-days N]

ARGUMENTOS:
  <url-base>       URL base de Inmuebles24 (requerido)
  --max-days N     Antigüedad máxima en días (default: 35)

EJEMPLOS:
  # URL básica de Culiacán (35 días por defecto)
  node extraer-urls-recientes-culiacan.js "https://www.inmuebles24.com/venta/sinaloa/culiacan/"

  # Listado filtrado por precio (35 días por defecto)
  node extraer-urls-recientes-culiacan.js "https://www.inmuebles24.com/casas-en-venta-en-culiacan-de-1000000-a-3000000-pesos.html"

  # Con antigüedad personalizada (50 días)
  node extraer-urls-recientes-culiacan.js "https://www.inmuebles24.com/venta/sinaloa/culiacan/" --max-days 50

  # Listado filtrado con 60 días
  node extraer-urls-recientes-culiacan.js "https://www.inmuebles24.com/casas-en-venta-en-culiacan-de-1000000-a-3000000-pesos.html" --max-days 60

SALIDAS:
  • urls-propiedades-recientes-culiacan.txt - Lista simple de URLs
  • propiedades-recientes-culiacan.json - Datos completos en JSON

═══════════════════════════════════════════════════════════════════════════════
`);
}

// Parsear argumentos de línea de comandos
function parseArgs() {
    const args = process.argv.slice(2);

    // Si no hay argumentos o se pide ayuda, mostrar uso
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        showUsage();
        process.exit(0);
    }

    // Primer argumento es la URL base
    const baseURL = args[0];

    // Buscar --max-days
    let maxDays = 35; // Default
    const maxDaysIndex = args.indexOf('--max-days');
    if (maxDaysIndex !== -1 && args[maxDaysIndex + 1]) {
        maxDays = parseInt(args[maxDaysIndex + 1]);
        if (isNaN(maxDays) || maxDays <= 0) {
            console.error('❌ Error: --max-days debe ser un número positivo');
            process.exit(1);
        }
    }

    return { baseURL, maxDays };
}

// Ejecutar
if (require.main === module) {
    (async () => {
        const { baseURL, maxDays } = parseArgs();

        console.log('\n📋 CONFIGURACIÓN:');
        console.log(`   URL Base: ${baseURL}`);
        console.log(`   Antigüedad máxima: ≤${maxDays} días\n`);

        const extractor = new InmueblesCuliacanURLExtractor(baseURL, maxDays);
        await extractor.run();
    })().catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

module.exports = InmueblesCuliacanURLExtractor;
