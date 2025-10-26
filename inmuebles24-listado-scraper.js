const puppeteer = require('puppeteer');
const fs = require('fs');

class Inmuebles24ListingScraper {
    constructor() {
        this.baseURL = 'https://www.inmuebles24.com/venta/sinaloa/culiacan/';
        this.maxDays = 20;
        this.historicFile = 'inmuebles24-historic-culiacan.json';
        this.newPropertiesFile = 'inmuebles24-new-properties-culiacan.json';
        this.allPropertiesFile = 'inmuebles24-all-recent-culiacan.json';
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
            /publicado hace (\d+) minuto/i,
            /hace (\d+) minuto/i,
            /hoy/i,
            /ayer/i
        ];

        // Casos especiales
        if (/hoy|hora|minuto/i.test(text)) return 0;
        if (/ayer/i.test(text)) return 1;

        // Buscar número de días
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

    // Scrapear listados con detección de antigüedad
    async scrapeListings(maxPages = 15) {
        console.log('═'.repeat(80));
        console.log('🏠 INMUEBLES24 - SCRAPER DE PROPIEDADES RECIENTES');
        console.log('📍 Ciudad: Culiacán, Sinaloa');
        console.log(`📅 Criterio: Menos de ${this.maxDays} días`);
        console.log('═'.repeat(80));
        console.log('\n🚀 Iniciando scraper de listados...\n');

        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // User agent para evitar bloqueos
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const allProperties = [];
        let shouldStop = false;
        let currentPage = 1;
        let totalScraped = 0;
        let tooOldCount = 0;

        while (currentPage <= maxPages && !shouldStop) {
            const url = currentPage === 1
                ? this.baseURL
                : `${this.baseURL}pagina-${currentPage}.html`;

            console.log(`\n${'─'.repeat(80)}`);
            console.log(`📄 PÁGINA ${currentPage}`);
            console.log(`🔗 ${url}`);
            console.log('─'.repeat(80));

            try {
                await page.goto(url, {
                    waitUntil: 'networkidle2',
                    timeout: 60000
                });

                // Esperar que carguen las tarjetas (múltiples selectores)
                await Promise.race([
                    page.waitForSelector('[data-posting-type]', { timeout: 10000 }),
                    page.waitForSelector('.posting-card', { timeout: 10000 }),
                    page.waitForSelector('[class*="PropertyCard"]', { timeout: 10000 })
                ]).catch(() => {
                    console.log('⚠️  No se encontraron tarjetas con los selectores esperados');
                });

                // Scroll para cargar lazy content
                await page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight / 2);
                });
                await new Promise(r => setTimeout(r, 1000));

                // Extraer propiedades del listado
                const properties = await page.evaluate(() => {
                    const cards = Array.from(document.querySelectorAll('[data-posting-type], .posting-card, [class*="PropertyCard"]'));

                    return cards.map(card => {
                        // Link a la propiedad
                        const link = card.querySelector('a[href*="/propiedades/"], a[href*="clasificado"]');

                        // Precio
                        const priceEl = card.querySelector('[data-price], [class*="price"]');

                        // Título
                        const titleEl = card.querySelector('h2, h3, [class*="title"], [class*="Title"]');

                        // Antigüedad - buscar en múltiples lugares
                        let ageText = '';
                        const ageSelectors = [
                            '[class*="age"]',
                            '[class*="date"]',
                            '[class*="published"]',
                            '[class*="time"]',
                            'span:has-text("Publicado")',
                            'div:has-text("Publicado")',
                            'small',
                            '.text-muted'
                        ];

                        for (const sel of ageSelectors) {
                            const el = card.querySelector(sel);
                            if (el && el.textContent) {
                                const text = el.textContent.toLowerCase();
                                if (text.includes('publicado') || text.includes('hace') || text.includes('día') || text.includes('hora')) {
                                    ageText = el.textContent;
                                    break;
                                }
                            }
                        }

                        // Si no se encontró en elementos específicos, buscar en todo el card
                        if (!ageText) {
                            const cardText = card.textContent || '';
                            const match = cardText.match(/(publicado hace[^\.]+|hace \d+ día[s]?)/i);
                            if (match) {
                                ageText = match[0];
                            }
                        }

                        // Ubicación
                        const locationEl = card.querySelector('[class*="location"], [class*="Location"], [class*="address"]');

                        return {
                            url: link?.href || '',
                            title: titleEl?.textContent?.trim() || '',
                            price: priceEl?.textContent?.trim() || '',
                            location: locationEl?.textContent?.trim() || '',
                            ageText: ageText.trim(),
                            propertyId: null,
                            daysOld: null
                        };
                    }).filter(p => p.url && p.url.includes('inmuebles24.com'));
                });

                console.log(`   ✅ Encontradas ${properties.length} tarjetas en la página\n`);

                if (properties.length === 0) {
                    console.log('⚠️  No se encontraron propiedades. Deteniendo scraping.');
                    shouldStop = true;
                    break;
                }

                // Procesar cada propiedad
                let validPropsInPage = 0;
                let tooOldInPage = 0;

                for (const prop of properties) {
                    prop.propertyId = this.extractPropertyId(prop.url);
                    const days = this.extractDaysFromText(prop.ageText);
                    prop.daysOld = days;

                    totalScraped++;

                    // Determinar status
                    let status = '';
                    let shouldInclude = false;

                    if (days === null) {
                        status = '⚠️  Sin fecha';
                        shouldInclude = true; // Incluir propiedades sin fecha (probablemente recientes)
                    } else if (days <= this.maxDays) {
                        status = `✅ ${days} día${days !== 1 ? 's' : ''}`;
                        shouldInclude = true;
                        validPropsInPage++;
                    } else {
                        status = `❌ ${days} días (>${this.maxDays})`;
                        tooOldInPage++;
                        tooOldCount++;
                    }

                    // Log detallado
                    const titleShort = prop.title.substring(0, 50).padEnd(50);
                    console.log(`   ${status.padEnd(20)} | ID: ${prop.propertyId || 'N/A'.padEnd(10)} | ${titleShort}`);

                    if (prop.ageText && days !== null) {
                        console.log(`      └─ Texto original: "${prop.ageText}"`);
                    }

                    // Agregar si cumple criterio
                    if (shouldInclude) {
                        allProperties.push(prop);
                    }

                    // Si encontramos 3+ propiedades > maxDays consecutivas, parar
                    if (days !== null && days > this.maxDays) {
                        if (tooOldInPage >= 3) {
                            console.log(`\n🛑 Encontradas ${tooOldInPage} propiedades consecutivas con >${this.maxDays} días.`);
                            console.log('   Asumiendo que las siguientes páginas serán más viejas. Deteniendo scraping.');
                            shouldStop = true;
                            break;
                        }
                    }
                }

                console.log(`\n   📊 Resumen página ${currentPage}:`);
                console.log(`      ✅ Válidas: ${validPropsInPage}`);
                console.log(`      ❌ Muy viejas: ${tooOldInPage}`);
                console.log(`      ⚠️  Sin fecha: ${properties.length - validPropsInPage - tooOldInPage}`);

                if (shouldStop) break;

                // Verificar si hay "siguiente página"
                const hasNextPage = await page.evaluate(() => {
                    const nextBtn = document.querySelector('[rel="next"], .pagination-next, [class*="next"]');
                    return nextBtn !== null && !nextBtn.classList.contains('disabled');
                });

                if (!hasNextPage) {
                    console.log('\n📄 No hay más páginas disponibles. Finalizando scraping.');
                    break;
                }

            } catch (error) {
                console.error(`\n❌ Error en página ${currentPage}:`, error.message);
                break;
            }

            currentPage++;

            // Pausa entre páginas para evitar bloqueos
            await new Promise(r => setTimeout(r, 3000));
        }

        await browser.close();

        console.log('\n' + '═'.repeat(80));
        console.log('📊 RESUMEN FINAL DEL SCRAPING');
        console.log('═'.repeat(80));
        console.log(`   📄 Páginas scrapeadas: ${currentPage - 1}`);
        console.log(`   🔍 Propiedades analizadas: ${totalScraped}`);
        console.log(`   ✅ Propiedades válidas (≤${this.maxDays} días): ${allProperties.length}`);
        console.log(`   ❌ Propiedades descartadas (>${this.maxDays} días): ${tooOldCount}`);
        console.log('═'.repeat(80));

        return allProperties;
    }

    // Cargar histórico previo
    loadHistoric() {
        if (fs.existsSync(this.historicFile)) {
            return JSON.parse(fs.readFileSync(this.historicFile, 'utf8'));
        }
        return { snapshots: [] };
    }

    // Guardar snapshot diario
    saveSnapshot(properties) {
        const historic = this.loadHistoric();

        const snapshot = {
            date: new Date().toISOString().split('T')[0],  // YYYY-MM-DD
            timestamp: new Date().toISOString(),
            propertyIds: properties.map(p => p.propertyId).filter(Boolean),
            count: properties.length
        };

        historic.snapshots.push(snapshot);

        // Mantener solo últimos 30 días
        if (historic.snapshots.length > 30) {
            historic.snapshots = historic.snapshots.slice(-30);
        }

        fs.writeFileSync(this.historicFile, JSON.stringify(historic, null, 2));
        console.log(`\n💾 Snapshot guardado: ${snapshot.count} propiedades`);
        console.log(`   📅 Fecha: ${snapshot.date}`);
        console.log(`   🕐 Timestamp: ${snapshot.timestamp}`);
    }

    // Detectar propiedades nuevas vs último snapshot
    detectNewProperties(currentProperties) {
        const historic = this.loadHistoric();

        if (historic.snapshots.length === 0) {
            console.log('\n📝 PRIMER SNAPSHOT - todas las propiedades se consideran "nuevas"');
            return currentProperties;
        }

        const lastSnapshot = historic.snapshots[historic.snapshots.length - 1];
        const lastIds = new Set(lastSnapshot.propertyIds);
        const currentIds = currentProperties.map(p => p.propertyId).filter(Boolean);

        const newProperties = currentProperties.filter(p =>
            p.propertyId && !lastIds.has(p.propertyId)
        );

        console.log('\n' + '═'.repeat(80));
        console.log('🆕 ANÁLISIS DE NOVEDADES');
        console.log('═'.repeat(80));
        console.log(`   📅 Último snapshot: ${lastSnapshot.date} a las ${lastSnapshot.timestamp.split('T')[1].substring(0, 8)}`);
        console.log(`   📊 Propiedades en último snapshot: ${lastSnapshot.count}`);
        console.log(`   📊 Propiedades actuales: ${currentIds.length}`);
        console.log(`   🆕 Propiedades NUEVAS detectadas: ${newProperties.length}`);
        console.log('═'.repeat(80));

        if (newProperties.length > 0) {
            console.log('\n📋 LISTADO DE PROPIEDADES NUEVAS:\n');
            newProperties.forEach((p, i) => {
                console.log(`   ${(i + 1).toString().padStart(2)}. ${p.title}`);
                console.log(`       🆔 ID: ${p.propertyId}`);
                console.log(`       💰 Precio: ${p.price}`);
                console.log(`       📍 Ubicación: ${p.location || 'N/A'}`);
                console.log(`       📅 Antigüedad: ${p.daysOld !== null ? `${p.daysOld} días` : 'Desconocida'}`);
                console.log(`       🔗 ${p.url}`);
                console.log('');
            });
        } else {
            console.log('\n   ℹ️  No hay propiedades nuevas desde el último snapshot');
        }

        return newProperties;
    }

    // Ejecutar workflow completo
    async run() {
        const startTime = Date.now();

        // 1. Scrapear listados
        const properties = await this.scrapeListings(15);

        if (properties.length === 0) {
            console.log('\n⚠️  No se encontraron propiedades. Proceso finalizado.');
            return { all: [], new: [] };
        }

        // 2. Detectar nuevas propiedades
        const newProperties = this.detectNewProperties(properties);

        // 3. Guardar snapshot actual
        this.saveSnapshot(properties);

        // 4. Guardar todas las propiedades recientes
        fs.writeFileSync(
            this.allPropertiesFile,
            JSON.stringify(properties, null, 2)
        );
        console.log(`\n💾 Guardadas ${properties.length} propiedades recientes en: ${this.allPropertiesFile}`);

        // 5. Guardar propiedades nuevas en archivo separado
        if (newProperties.length > 0) {
            fs.writeFileSync(
                this.newPropertiesFile,
                JSON.stringify(newProperties, null, 2)
            );
            console.log(`💾 Guardadas ${newProperties.length} propiedades NUEVAS en: ${this.newPropertiesFile}`);
        }

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log('\n' + '═'.repeat(80));
        console.log('✅ PROCESO COMPLETADO');
        console.log('═'.repeat(80));
        console.log(`   ⏱️  Tiempo total: ${elapsedTime} segundos`);
        console.log(`   📁 Archivos generados:`);
        console.log(`      • ${this.allPropertiesFile} (${properties.length} propiedades)`);
        if (newProperties.length > 0) {
            console.log(`      • ${this.newPropertiesFile} (${newProperties.length} nuevas)`);
        }
        console.log(`      • ${this.historicFile} (histórico actualizado)`);
        console.log('═'.repeat(80));

        return { all: properties, new: newProperties };
    }
}

// Ejecutar si se invoca directamente
if (require.main === module) {
    (async () => {
        const scraper = new Inmuebles24ListingScraper();
        await scraper.run();
    })().catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

module.exports = Inmuebles24ListingScraper;
