const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🔍 DEBUG: Buscando DAVID GONZALEZ en Inmuebles24\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--window-size=1920,1080'
        ]
    });

    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('📄 Cargando https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-guadalupe-146847493.html\n');

    try {
        await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-guadalupe-146847493.html', {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });

        // Esperar a que cargue
        console.log('⏳ Esperando 8 segundos para que cargue completamente...\n');
        await new Promise(r => setTimeout(r, 8000));

        // Extraer todo el HTML
        const html = await page.content();

        // Guardar HTML completo
        fs.writeFileSync('debug-guadalupe-full.html', html, 'utf8');
        console.log('✅ HTML guardado en: debug-guadalupe-full.html\n');

        // Buscar DAVID en el HTML
        console.log('🔎 Buscando "DAVID" en el HTML...\n');
        const davidMatches = [];
        const davidRegex = /(david|DAVID|David)(\s+[A-ZÁ-Ú][a-zá-ú]+)?/gi;
        let match;
        while ((match = davidRegex.exec(html)) !== null) {
            const context = html.substring(Math.max(0, match.index - 100), Math.min(html.length, match.index + match[0].length + 100));
            davidMatches.push({
                match: match[0],
                context: context.replace(/\n/g, ' ').replace(/\s+/g, ' ')
            });
        }

        if (davidMatches.length > 0) {
            console.log(`✅ Encontradas ${davidMatches.length} coincidencias con "DAVID":\n`);
            davidMatches.forEach((m, i) => {
                console.log(`${i + 1}. "${m.match}"`);
                console.log(`   Contexto: ${m.context.substring(0, 150)}...`);
                console.log('');
            });
        } else {
            console.log('❌ NO se encontró "DAVID" en el HTML\n');
        }

        // Buscar teléfonos
        console.log('📞 Buscando teléfonos...\n');
        const phoneRegex = /\b(667|668|669|81|33|55)\d{7,8}\b/g;
        const phones = [];
        let phoneMatch;
        while ((phoneMatch = phoneRegex.exec(html)) !== null) {
            phones.push(phoneMatch[0]);
        }

        const uniquePhones = [...new Set(phones)];
        console.log(`✅ Encontrados ${uniquePhones.length} teléfonos únicos:\n`);
        uniquePhones.forEach(p => console.log(`   📞 ${p}`));
        console.log('');

        // Buscar elementos de vendedor
        console.log('👤 Buscando elementos de vendedor...\n');
        const vendedorInfo = await page.evaluate(() => {
            const data = { elementos: [], scripts: [] };

            // Selectores posibles
            const selectors = [
                '.publisherCard-module__info-name___2T6ft',
                'a[class*="info-name"]',
                '[class*="publisher"]',
                '[class*="contact"]',
                'h3', 'h4'
            ];

            selectors.forEach(sel => {
                try {
                    const elements = document.querySelectorAll(sel);
                    elements.forEach(el => {
                        const text = el.textContent.trim();
                        if (text && text.length < 200) {
                            data.elementos.push({
                                selector: sel,
                                text: text.substring(0, 100),
                                clase: el.className
                            });
                        }
                    });
                } catch(e) {}
            });

            // Buscar en scripts JSON
            const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
            scripts.forEach(s => {
                try {
                    const json = JSON.parse(s.textContent);
                    data.scripts.push(json);
                } catch(e) {}
            });

            return data;
        });

        console.log(`✅ Encontrados ${vendedorInfo.elementos.length} elementos:\n`);
        vendedorInfo.elementos.slice(0, 20).forEach((el, i) => {
            console.log(`${i + 1}. [${el.selector}] → "${el.text}"`);
        });
        console.log('');

        if (vendedorInfo.scripts.length > 0) {
            console.log(`✅ Encontrados ${vendedorInfo.scripts.length} scripts JSON-LD\n`);
            fs.writeFileSync('debug-guadalupe-jsonld.json', JSON.stringify(vendedorInfo.scripts, null, 2), 'utf8');
            console.log('✅ JSON-LD guardado en: debug-guadalupe-jsonld.json\n');
        }

        console.log('='.repeat(80));
        console.log('✅ DEBUG COMPLETADO\n');
        console.log('Archivos generados:');
        console.log('  - debug-guadalupe-full.html (HTML completo)');
        console.log('  - debug-guadalupe-jsonld.json (Scripts JSON-LD)');
        console.log('\nMantener navegador abierto 20 segundos...\n');

        await new Promise(r => setTimeout(r, 20000));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await browser.close();
})();
