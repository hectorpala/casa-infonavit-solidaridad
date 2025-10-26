const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🔍 VERIFICACIÓN DE CIUDADES - INMUEBLES24\n');
    console.log('═'.repeat(100));

    // Leer URLs del archivo
    const urlsContent = fs.readFileSync('urls-propiedades-recientes-culiacan.txt', 'utf8');
    const urls = urlsContent.split('\n').map(line => line.trim()).filter(line => line && line.startsWith('http'));

    console.log(`📋 Total de URLs a verificar: ${urls.length}\n`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Configurar timeout
    page.setDefaultNavigationTimeout(30000);

    const results = [];
    let culiacanCount = 0;
    let noculiacanCount = 0;

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];

        console.log(`\n[${i + 1}/${urls.length}] Verificando: ${url.substring(0, 80)}...`);

        try {
            // Navegar a la página
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Esperar a que cargue el contenido principal
            await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {});

            // Extraer datos de metadatos Y contenido visible
            const metadata = await page.evaluate(() => {
                // Buscar en Open Graph tags
                const ogCity = document.querySelector('meta[property="og:locality"]')?.content;
                const ogRegion = document.querySelector('meta[property="og:region"]')?.content;
                const ogStreetAddress = document.querySelector('meta[property="og:street-address"]')?.content;

                // Buscar en meta tags normales
                const metaLocation = document.querySelector('meta[name="geo.placename"]')?.content;

                // Buscar en JSON-LD
                let jsonLdLocation = '';
                const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                for (const script of jsonLdScripts) {
                    try {
                        const data = JSON.parse(script.textContent);
                        if (data.address) {
                            jsonLdLocation = data.address.addressLocality || data.address.addressRegion || '';
                        }
                    } catch (e) {}
                }

                // Buscar en breadcrumbs
                const breadcrumb = document.querySelector('[class*="breadcrumb"]')?.textContent || '';

                // Buscar en title y h1
                const title = document.title;
                const h1 = document.querySelector('h1')?.textContent || '';

                // NUEVO: Buscar ubicación en el contenido visible
                // Buscar elementos con "icono de ubicación" o textos comunes
                let locationFromContent = '';

                // Buscar todos los elementos de texto visible
                const allTextElements = Array.from(document.querySelectorAll('p, span, div, a')).map(el => el.textContent.trim());

                // Patrones de ubicación (colonia, fraccionamiento, ciudad)
                const locationPatterns = [
                    /(?:en|ubicado en|ubicación:?)\s*([^,.]+,\s*[^,.]+)/i,
                    /(Fracc?\.|Fraccionamiento|Colonia|Col\.)\s+([^,.]+)/i,
                    /([A-Z][a-záéíóúñ\s]+),\s*(Culiacán|Mazatlán|Monterrey|Sinaloa|Nuevo León)/i
                ];

                // Buscar en todos los elementos
                for (const text of allTextElements) {
                    for (const pattern of locationPatterns) {
                        const match = text.match(pattern);
                        if (match && match[0].length > 10 && match[0].length < 150) {
                            locationFromContent = match[0];
                            break;
                        }
                    }
                    if (locationFromContent) break;
                }

                // También buscar en elementos específicos de Inmuebles24
                const addressElement = document.querySelector('[class*="address"], [class*="location"], [class*="ubicacion"]');
                if (addressElement && !locationFromContent) {
                    locationFromContent = addressElement.textContent.trim();
                }

                return {
                    ogCity,
                    ogRegion,
                    ogStreetAddress,
                    metaLocation,
                    jsonLdLocation,
                    breadcrumb,
                    title,
                    h1,
                    locationFromContent
                };
            });

            // Combinar todos los datos para detectar la ciudad
            const allText = [
                metadata.ogCity || '',
                metadata.ogRegion || '',
                metadata.ogStreetAddress || '',
                metadata.metaLocation || '',
                metadata.jsonLdLocation || '',
                metadata.breadcrumb || '',
                metadata.title || '',
                metadata.h1 || '',
                metadata.locationFromContent || ''
            ].join(' ').toLowerCase();

            // Determinar la dirección más completa (priorizar contenido visible)
            let direccion = metadata.locationFromContent || metadata.ogStreetAddress || metadata.metaLocation || metadata.jsonLdLocation || metadata.breadcrumb || metadata.title || 'No detectada';

            // Verificar si es Culiacán
            const esCuliacan = allText.includes('culiacán') || allText.includes('culiacan');

            if (esCuliacan) {
                culiacanCount++;
                console.log(`   ✅ CULIACÁN`);
            } else {
                noculiacanCount++;
                console.log(`   ⚠️  NO ES CULIACÁN - Ciudad detectada: ${direccion}`);
            }

            results.push({
                num: i + 1,
                url: url,
                direccion: direccion,
                esCuliacan: esCuliacan ? '✅ SÍ' : '⚠️ NO',
                metadata: metadata
            });

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            results.push({
                num: i + 1,
                url: url,
                direccion: 'ERROR AL VERIFICAR',
                esCuliacan: '❌ ERROR',
                metadata: null
            });
        }

        // Pequeño delay para no sobrecargar el servidor
        await new Promise(r => setTimeout(r, 500));
    }

    await browser.close();

    // Generar reporte
    console.log('\n' + '═'.repeat(100));
    console.log('📊 REPORTE FINAL\n');

    console.log('═'.repeat(100));
    console.log('NUM | URL (primeros 60 chars)                                   | DIRECCIÓN                                    | CULIACÁN?');
    console.log('═'.repeat(100));

    results.forEach(r => {
        const urlShort = r.url.substring(0, 60).padEnd(60);
        const direccionShort = r.direccion.substring(0, 44).padEnd(44);
        console.log(`${String(r.num).padStart(3)} | ${urlShort} | ${direccionShort} | ${r.esCuliacan}`);
    });

    console.log('═'.repeat(100));
    console.log(`\n📈 RESUMEN:`);
    console.log(`   ✅ Propiedades en CULIACÁN: ${culiacanCount}`);
    console.log(`   ⚠️  Propiedades NO en Culiacán: ${noculiacanCount}`);
    console.log(`   📊 Total verificadas: ${results.length}`);

    // Guardar JSON con resultados completos
    fs.writeFileSync('/tmp/verificacion-ciudades.json', JSON.stringify(results, null, 2));
    console.log(`\n💾 Reporte completo guardado en: /tmp/verificacion-ciudades.json`);

    // Si hay propiedades que NO son de Culiacán, listarlas
    if (noculiacanCount > 0) {
        console.log('\n⚠️  PROPIEDADES QUE NO SON DE CULIACÁN:\n');
        results.filter(r => r.esCuliacan === '⚠️ NO').forEach(r => {
            console.log(`   ${r.num}. ${r.url}`);
            console.log(`      Dirección: ${r.direccion}\n`);
        });
    }

    console.log('═'.repeat(100));

})().catch(e => {
    console.error('❌ Error fatal:', e.message);
    process.exit(1);
});
