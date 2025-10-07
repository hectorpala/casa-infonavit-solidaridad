#!/usr/bin/env node

/**
 * EXTRAER URLs desde las TARJETAS de propiedades visibles
 * Analiza la estructura específica de las tarjetas de Wiggot
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function extractFromOpenBrowser() {
    console.log('\n🔍 Conectando al navegador abierto...\n');

    // Conectar al navegador que ya está abierto
    const browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222'
    });

    const pages = await browser.pages();
    const page = pages[pages.length - 1]; // Última pestaña

    // Extraer URLs
    const data = await page.evaluate(() => {
        const results = {
            urls: [],
            htmlSnippets: [],
            debug: {}
        };

        // Buscar en divs clickeables
        const clickableDivs = document.querySelectorAll('div[onclick], div[role="button"]');
        results.debug.clickableDivs = clickableDivs.length;

        clickableDivs.forEach(div => {
            const onclick = div.getAttribute('onclick') || '';
            const html = div.outerHTML.substring(0, 500);

            if (html.includes('property-detail') || onclick.includes('property-detail')) {
                results.htmlSnippets.push(html);

                const match = (html + onclick).match(/property-detail\/([a-zA-Z0-9]+)/);
                if (match) {
                    results.urls.push(`https://new.wiggot.com/search/property-detail/${match[1]}`);
                }
            }
        });

        // Buscar en todo el DOM
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const element = node;

            // Buscar en todos los atributos
            for (const attr of element.attributes || []) {
                if (attr.value.includes('property-detail')) {
                    const match = attr.value.match(/property-detail\/([a-zA-Z0-9]+)/);
                    if (match) {
                        results.urls.push(`https://new.wiggot.com/search/property-detail/${match[1]}`);
                    }
                }
            }
        }

        // Deduplicar
        results.urls = [...new Set(results.urls)];

        return results;
    });

    console.log(`✅ URLs encontradas: ${data.urls.length}`);

    if (data.urls.length > 0) {
        const top12 = data.urls.slice(0, 12);

        console.log('\n📋 TOP 12 URLs:\n');
        top12.forEach((url, i) => {
            const id = url.match(/property-detail\/([a-zA-Z0-9]+)/)?.[1];
            console.log(`${i + 1}. ${id}`);
        });

        fs.writeFileSync('urls-batch.json', JSON.stringify({ urls: top12 }, null, 2));
        console.log('\n✅ urls-batch.json guardado\n');
    } else {
        console.log('\n⚠️ No se encontraron URLs');
        console.log('\nDebug info:');
        console.log(JSON.stringify(data.debug, null, 2));

        if (data.htmlSnippets.length > 0) {
            console.log('\nHTML snippets encontrados:');
            data.htmlSnippets.slice(0, 3).forEach((html, i) => {
                console.log(`\n${i + 1}. ${html.substring(0, 200)}...`);
            });
        }
    }

    await browser.disconnect();
}

// Ejecutar
extractFromOpenBrowser().catch(err => {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Asegúrate de que el navegador esté abierto en modo debug:');
    console.log('   puppeteer.launch({ args: ["--remote-debugging-port=9222"] })');
    process.exit(1);
});
