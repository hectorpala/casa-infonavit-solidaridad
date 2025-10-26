const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// Agregar stealth plugin (evasión avanzada de detección)
puppeteer.use(StealthPlugin());

/**
 * Scraper ULTRA con puppeteer-extra-plugin-stealth
 * Bypasea detección de bots de Inmuebles24
 */

class InmueblesCuliacanURLExtractorStealth {
    constructor() {
        this.baseURL = 'https://www.inmuebles24.com/venta/sinaloa/culiacan/';
        this.maxDays = 20;
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

    async extractURLs(maxPages = 5) {
        console.log('═'.repeat(80));
        console.log('🔥 EXTRACTOR ULTRA - STEALTH MODE ACTIVADO');
        console.log('📅 Criterio: Propiedades con ≤' + this.maxDays + ' días');
        console.log('📄 Páginas a scrapear: hasta ' + maxPages);
        console.log('═'.repeat(80));
        console.log('\n🚀 Lanzando navegador con máxima evasión...\n');

        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--window-size=1920,1080',
                '--start-maximized',
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-infobars',
                '--disable-notifications'
            ],
            ignoreDefaultArgs: ['--enable-automation'],
        });

        const page = await browser.newPage();

        // Headers realistas
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Sec-Ch-Ua': '"Google Chrome";v="120", "Chromium";v="120", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"macOS"'
        });

        const allProperties = [];
        let shouldStop = false;
        let currentPage = 1;

        while (currentPage <= maxPages && !shouldStop) {
            const url = currentPage === 1
                ? this.baseURL
                : `${this.baseURL}pagina-${currentPage}.html`;

            console.log(`\n${'─'.repeat(80)}`);
            console.log(`📄 PÁGINA ${currentPage}: ${url}`);
            console.log('─'.repeat(80));

            try {
                console.log('🌐 Navegando (stealth mode activo)...');
                await page.goto(url, {
                    waitUntil: 'networkidle2',
                    timeout: 90000
                });

                console.log('⏳ Esperando 20 segundos (comportamiento humano)...');
                await new Promise(r => setTimeout(r, 20000));

                // Movimientos aleatorios del mouse
                console.log('🖱️  Simulando actividad humana...');
                for (let i = 0; i < 5; i++) {
                    const x = Math.floor(Math.random() * 1000) + 100;
                    const y = Math.floor(Math.random() * 600) + 100;
                    await page.mouse.move(x, y);
                    await new Promise(r => setTimeout(r, Math.random() * 1000 + 500));
                }

                // Scroll super gradual
                console.log('📜 Scroll gradual (MUY humano)...');
                await page.evaluate(async () => {
                    await new Promise((resolve) => {
                        let totalHeight = 0;
                        const distance = 150;
                        const timer = setInterval(() => {
                            window.scrollBy(0, distance);
                            totalHeight += distance;

                            if (totalHeight >= document.body.scrollHeight * 0.8) {
                                clearInterval(timer);
                                resolve();
                            }
                        }, 300); // MUY lento
                    });
                });

                await new Promise(r => setTimeout(r, 10000)); // Espera LARGA

                // Screenshot para debugging
                await page.screenshot({ path: `debug-page-${currentPage}.png`, fullPage: false });
                console.log(`📸 Screenshot guardado: debug-page-${currentPage}.png`);

                // Extraer TODAS las propiedades con estrategia agresiva
                console.log('🔍 Extrayendo URLs (búsqueda exhaustiva)...');
                const properties = await page.evaluate(() => {
                    const result = [];

                    // TODOS los links del DOM
                    const allLinks = Array.from(document.querySelectorAll('a'));

                    console.log(`   📊 Total de links en DOM: ${allLinks.length}`);

                    // Filtrar solo Inmuebles24
                    const inmuebles24Links = allLinks.filter(a =>
                        a.href &&
                        a.href.includes('inmuebles24.com') &&
                        a.href.match(/-\d+\.html/)
                    );

                    console.log(`   ✅ Links de Inmuebles24: ${inmuebles24Links.length}`);

                    // Para cada link, buscar antigüedad
                    inmuebles24Links.forEach(link => {
                        let parent = link;
                        let found = false;

                        // Subir hasta 10 niveles buscando fecha
                        for (let level = 0; level < 10 && !found; level++) {
                            parent = parent.parentElement;
                            if (!parent) break;

                            const text = parent.textContent.toLowerCase();
                            if (text.includes('publicado') || text.includes('hace') ||
                                text.includes('día') || text.includes('hora')) {
                                result.push({
                                    url: link.href,
                                    title: link.textContent.substring(0, 80).trim() || 'Sin título',
                                    ageText: parent.textContent.substring(0, 200).trim()
                                });
                                found = true;
                            }
                        }

                        // Si no encontró fecha, agregar igual (asumir reciente)
                        if (!found) {
                            const exists = result.some(p => p.url === link.href);
                            if (!exists) {
                                result.push({
                                    url: link.href,
                                    title: link.textContent.substring(0, 80).trim() || 'Sin título',
                                    ageText: ''
                                });
                            }
                        }
                    });

                    // Deduplicar
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

                console.log(`   ✅ Propiedades extraídas: ${properties.length}\n`);

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

                    let shouldInclude = false;
                    let status = '';

                    if (days === null) {
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

                    // Si encontramos muchas propiedades viejas, parar
                    if (days !== null && days > this.maxDays && tooOldCount >= 5) {
                        console.log(`\n🛑 Encontradas ${tooOldCount} propiedades con >${this.maxDays} días.`);
                        console.log('   Deteniendo extracción.');
                        shouldStop = true;
                        break;
                    }
                }

                console.log(`\n   📊 Resumen página ${currentPage}:`);
                console.log(`      ✅ Válidas: ${validCount}`);
                console.log(`      ❌ Muy viejas: ${tooOldCount}`);

                if (shouldStop) break;

            } catch (error) {
                console.error(`\n❌ Error en página ${currentPage}:`, error.message);
                break;
            }

            currentPage++;

            // Delay aleatorio entre páginas
            const delayMs = Math.floor(Math.random() * 5000) + 5000; // 5-10 segundos
            console.log(`\n⏸️  Esperando ${(delayMs / 1000).toFixed(1)}s antes de siguiente página...`);
            await new Promise(r => setTimeout(r, delayMs));
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

    // Guardar URLs en archivo de texto
    saveURLsToFile(properties) {
        const urls = properties.map(p => p.url).filter(Boolean);
        fs.writeFileSync(this.outputFile, urls.join('\n'), 'utf8');
        console.log(`\n💾 Guardadas ${urls.length} URLs en: ${this.outputFile}`);
    }

    // Guardar en JSON
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
        console.log(`💾 Guardado JSON en: ${this.outputJSON}`);
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

        // 2. Guardar archivos
        this.saveURLsToFile(properties);
        this.saveToJSON(properties);

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log('\n' + '═'.repeat(80));
        console.log('✅ EXTRACCIÓN COMPLETADA');
        console.log('═'.repeat(80));
        console.log(`   ⏱️  Tiempo total: ${elapsedTime} segundos`);
        console.log(`   📊 Total propiedades: ${properties.length}`);
        console.log(`\n📁 Archivos generados:`);
        console.log(`   • ${this.outputFile}`);
        console.log(`   • ${this.outputJSON}`);
        console.log('\n🔄 SIGUIENTE PASO:');
        console.log(`   node scrapear-batch-urls.js --test 3`);
        console.log('═'.repeat(80));

        return properties;
    }
}

// Ejecutar
if (require.main === module) {
    (async () => {
        const extractor = new InmueblesCuliacanURLExtractorStealth();
        await extractor.run();
    })().catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

module.exports = InmueblesCuliacanURLExtractorStealth;
