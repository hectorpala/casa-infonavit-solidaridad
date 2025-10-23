const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 DEBUG: Analizando detección de dirección\n');
    console.log('URL: https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-en-culiacan-sinaloa.-91269633.html\n');
    console.log('Dirección esperada: Internacional 2660, Fraccionamiento Del Humaya, Culiacán\n');
    console.log('='.repeat(80) + '\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    const page = await browser.newPage();

    try {
        await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-en-culiacan-sinaloa.-91269633.html', {
            waitUntil: 'networkidle2',
            timeout: 90000
        });

        await new Promise(r => setTimeout(r, 5000));

        const analysis = await page.evaluate(() => {
            const results = {
                mapAbove: [],
                dataTestId: null,
                mapSection: null,
                bodyLines: [],
                allMaps: []
            };

            // 1. Buscar TODOS los iframes de mapa
            const iframes = Array.from(document.querySelectorAll('iframe[src*="google.com/maps"]'));
            results.allMaps = iframes.map((iframe, i) => {
                const rect = iframe.getBoundingClientRect();
                return {
                    index: i,
                    src: iframe.src.substring(0, 100),
                    position: `top: ${rect.top}px, left: ${rect.left}px`,
                    parent: iframe.parentElement.className
                };
            });

            // 2. Buscar elementos ARRIBA del primer mapa
            if (iframes.length > 0) {
                const firstIframe = iframes[0];
                let current = firstIframe.parentElement;

                // Subir 3 niveles en el DOM
                for (let i = 0; i < 3 && current; i++) {
                    const allTextElements = Array.from(current.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, li, address'));

                    allTextElements.forEach(el => {
                        // Solo elementos ANTES del iframe
                        if (el.compareDocumentPosition(firstIframe) & Node.DOCUMENT_POSITION_FOLLOWING) {
                            const text = el.textContent.trim();
                            if (text.length > 10 && text.length < 300) {
                                results.mapAbove.push({
                                    tag: el.tagName.toLowerCase(),
                                    className: el.className,
                                    text: text,
                                    length: text.length,
                                    hasCommas: (text.match(/,/g) || []).length,
                                    hasNumber: /\d+/.test(text),
                                    hasStreetKeyword: /(calle|avenida|blvd|boulevard|privada|internacional)/i.test(text)
                                });
                            }
                        }
                    });
                    current = current.parentElement;
                }
            }

            // 3. data-testid="address-text"
            const addressTestId = document.querySelector('[data-testid="address-text"]');
            if (addressTestId) {
                results.dataTestId = addressTestId.textContent.trim();
            }

            // 4. #mapSection
            const mapSection = document.querySelector('#mapSection li span, section[data-testid="property-features"] li span');
            if (mapSection) {
                results.mapSection = mapSection.textContent.trim();
            }

            // 5. Body lines con "Internacional"
            const bodyText = document.body.innerText;
            const lines = bodyText.split('\n');
            lines.forEach(line => {
                if (/internacional/i.test(line) && line.length > 15) {
                    results.bodyLines.push(line.trim());
                }
            });

            return results;
        });

        console.log('📍 MAPAS ENCONTRADOS:', analysis.allMaps.length);
        analysis.allMaps.forEach((m, i) => {
            console.log(`   ${i + 1}. ${m.position}`);
            console.log(`      Padre: ${m.parent}`);
        });

        console.log('\n📋 ELEMENTOS ARRIBA DEL MAPA:', analysis.mapAbove.length);
        analysis.mapAbove.forEach((el, i) => {
            console.log(`\n   ${i + 1}. <${el.tag}> (${el.length} chars, ${el.hasCommas} comas)`);
            console.log(`      Clase: ${el.className || '(sin clase)'}`);
            console.log(`      Tiene número: ${el.hasNumber ? '✅' : '❌'}`);
            console.log(`      Tiene calle: ${el.hasStreetKeyword ? '✅' : '❌'}`);
            console.log(`      Texto: "${el.text.substring(0, 100)}${el.text.length > 100 ? '...' : ''}"`);
        });

        console.log('\n🎯 data-testid="address-text":', analysis.dataTestId || '❌ NO ENCONTRADO');
        console.log('\n🗺️  #mapSection:', analysis.mapSection || '❌ NO ENCONTRADO');

        console.log('\n📝 LÍNEAS CON "INTERNACIONAL":', analysis.bodyLines.length);
        analysis.bodyLines.forEach((line, i) => {
            console.log(`   ${i + 1}. "${line.substring(0, 150)}"`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('✅ Análisis completado. Navegador abierto 30 segundos...\n');

        await new Promise(r => setTimeout(r, 30000));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await browser.close();
})();
