// Puppeteer con Stealth Plugin para evitar detección
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');

// Función para extraer días desde texto
function extractDays(text) {
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
        if (match && match[1]) {
            return parseInt(match[1]);
        }
    }

    return null;
}

(async () => {
    console.log('═'.repeat(80));
    console.log('🔍 VERIFICADOR DE FECHAS INDIVIDUALES - INMUEBLES24');
    console.log('═'.repeat(80));
    console.log();

    // Leer URLs del archivo
    const urls = fs.readFileSync('urls-propiedades-unicas.txt', 'utf8')
        .split('\n')
        .filter(url => url.trim().length > 0);

    console.log(`📄 Total URLs a verificar: ${urls.length}`);
    console.log(`📅 Criterio: ≤30 días de antigüedad\n`);

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1920,1080'
        ]
    });

    const page = await browser.newPage();

    const results = [];
    let validCount = 0;
    let tooOldCount = 0;
    let noDateCount = 0;

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const propertyId = url.match(/-(\d+)\.html/)?.[1] || 'unknown';

        console.log('─'.repeat(80));
        console.log(`${i + 1}/${urls.length} | ID: ${propertyId}`);
        console.log(`🌐 ${url.substring(0, 80)}...`);

        try {
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 60000
            });

            // Esperar 3 segundos para carga dinámica
            await new Promise(r => setTimeout(r, 3000));

            // Buscar fecha en el HTML
            const dateInfo = await page.evaluate(() => {
                const bodyText = document.body.textContent;

                // Buscar "publicado hace X días" o similar
                const patterns = [
                    /publicado hace (\d+) día/gi,
                    /hace (\d+) día/gi,
                    /publicado hace (\d+) hora/gi,
                    /hace (\d+) hora/gi,
                    /\bhoy\b/gi,
                    /\bayer\b/gi
                ];

                const matches = [];
                patterns.forEach(pattern => {
                    const found = bodyText.match(pattern);
                    if (found) {
                        matches.push(...found);
                    }
                });

                // Buscar visualizaciones
                const viewsPattern = /(\d+)\s*visualizaciones?/i;
                const viewsMatch = bodyText.match(viewsPattern);
                const views = viewsMatch ? viewsMatch[1] : null;

                return {
                    dateTexts: matches,
                    views: views
                };
            });

            // Procesar fecha
            let days = null;
            let dateText = 'Sin fecha';

            if (dateInfo.dateTexts.length > 0) {
                // Tomar la primera coincidencia
                dateText = dateInfo.dateTexts[0];
                days = extractDays(dateText);
            }

            const result = {
                url,
                propertyId,
                dateText,
                days,
                views: dateInfo.views,
                valid: days !== null && days <= 30
            };

            results.push(result);

            // Logging
            if (days !== null) {
                if (days <= 30) {
                    console.log(`✅ ${dateText} (${days} días) | ${dateInfo.views || '?'} visualizaciones`);
                    validCount++;
                } else {
                    console.log(`❌ ${dateText} (${days} días > 30) | ${dateInfo.views || '?'} visualizaciones`);
                    tooOldCount++;
                }
            } else {
                console.log(`⚠️  Sin fecha detectada | ${dateInfo.views || '?'} visualizaciones`);
                noDateCount++;
            }

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            results.push({
                url,
                propertyId,
                error: error.message
            });
        }

        // Pausa entre requests
        await new Promise(r => setTimeout(r, 2000));
    }

    await browser.close();

    console.log();
    console.log('═'.repeat(80));
    console.log('📊 RESUMEN FINAL');
    console.log('═'.repeat(80));
    console.log(`   📄 Total verificadas: ${urls.length}`);
    console.log(`   ✅ Válidas (≤30 días): ${validCount}`);
    console.log(`   ❌ Muy antiguas (>30 días): ${tooOldCount}`);
    console.log(`   ⚠️  Sin fecha: ${noDateCount}`);
    console.log('═'.repeat(80));

    // Guardar URLs válidas
    const validUrls = results
        .filter(r => r.valid)
        .map(r => r.url);

    if (validUrls.length > 0) {
        fs.writeFileSync('urls-validas-30-dias.txt', validUrls.join('\n'), 'utf8');
        console.log();
        console.log(`💾 Guardadas ${validUrls.length} URLs válidas en: urls-validas-30-dias.txt`);
    } else {
        console.log();
        console.log('⚠️  No se encontraron URLs válidas (≤30 días)');
    }

    // Guardar JSON detallado
    fs.writeFileSync('verificacion-fechas-detallada.json', JSON.stringify(results, null, 2), 'utf8');
    console.log(`💾 Guardado JSON detallado en: verificacion-fechas-detallada.json`);
    console.log('═'.repeat(80));

})().catch(e => console.error('❌ Error:', e.message));
