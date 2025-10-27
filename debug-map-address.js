#!/usr/bin/env node

const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('🌐 Navegando a Los Pinos...\n');
    await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-los-pinos-142636213.html', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const debug = await page.evaluate(() => {
        const result = {
            iframeFound: false,
            iframeSelector: '',
            elementsBeforeMap: []
        };

        // Buscar iframe del mapa
        const iframes = [
            document.querySelector('iframe[src*="google.com/maps"]'),
            document.querySelector('iframe[src*="maps.google"]'),
            document.querySelector('iframe[title*="map"]'),
            document.querySelector('iframe[title*="mapa"]')
        ].filter(Boolean);

        if (iframes.length > 0) {
            const iframe = iframes[0];
            result.iframeFound = true;
            result.iframeSelector = iframe.src ? `iframe[src*="${iframe.src.substring(0, 50)}"]` : 'iframe';

            // Buscar elementos ANTES del mapa
            const allElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, p, span, div, li'));

            allElements.forEach(el => {
                // Verificar si el elemento está ANTES del iframe
                if (el.compareDocumentPosition(iframe) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    const text = el.textContent.trim();

                    // Solo elementos con texto razonable
                    if (text.length > 10 && text.length < 200) {
                        result.elementsBeforeMap.push({
                            tag: el.tagName.toLowerCase(),
                            text: text,
                            className: el.className || '',
                            id: el.id || '',
                            hasComma: text.includes(','),
                            hasColonia: /(col\.|colonia|fracc|fraccionamiento)/i.test(text),
                            hasCuliacan: /culiacán|culiacan/i.test(text)
                        });
                    }
                }
            });

            // Tomar solo los últimos 10 elementos antes del mapa
            result.elementsBeforeMap = result.elementsBeforeMap.slice(-10);
        }

        return result;
    });

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📍 DEBUG - DETECCIÓN DE DIRECCIÓN ARRIBA DEL MAPA\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (!debug.iframeFound) {
        console.log('❌ NO SE ENCONTRÓ IFRAME DEL MAPA\n');
        console.log('Selectores probados:');
        console.log('  - iframe[src*="google.com/maps"]');
        console.log('  - iframe[src*="maps.google"]');
        console.log('  - iframe[title*="map"]');
        console.log('  - iframe[title*="mapa"]');
    } else {
        console.log('✅ IFRAME ENCONTRADO\n');
        console.log(`Selector: ${debug.iframeSelector}\n`);
        console.log('─────────────────────────────────────────────────────────\n');
        console.log(`📝 ELEMENTOS ANTES DEL MAPA (últimos 10):\n`);

        if (debug.elementsBeforeMap.length === 0) {
            console.log('❌ NO SE ENCONTRARON ELEMENTOS ANTES DEL MAPA\n');
        } else {
            debug.elementsBeforeMap.forEach((el, idx) => {
                console.log(`${idx + 1}. [${el.tag}] ${el.text.substring(0, 100)}${el.text.length > 100 ? '...' : ''}`);
                console.log(`   className: "${el.className}"`);
                console.log(`   id: "${el.id}"`);
                console.log(`   hasComma: ${el.hasComma}`);
                console.log(`   hasColonia: ${el.hasColonia}`);
                console.log(`   hasCuliacan: ${el.hasCuliacan}`);
                console.log('');
            });
        }
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('💡 Presiona Ctrl+C para cerrar\n');

    // Mantener el navegador abierto
    await new Promise(() => {});
})();
