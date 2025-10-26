// Puppeteer con Stealth Plugin para evitar detección
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    console.log('🔍 DIAGNÓSTICO DE FECHAS - INMUEBLES24');
    console.log('═'.repeat(80));

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    const page = await browser.newPage();

    console.log('\n📄 Navegando a página de Culiacán...');
    await page.goto('https://www.inmuebles24.com/venta/sinaloa/culiacan/', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    console.log('⏳ Esperando 5 segundos para carga completa...\n');
    await new Promise(r => setTimeout(r, 5000));

    console.log('═'.repeat(80));
    console.log('🔎 BUSCANDO ELEMENTOS CON FECHAS\n');

    const results = await page.evaluate(() => {
        const data = {
            allLinks: [],
            dateElements: [],
            textWithFecha: [],
            classesWithAge: []
        };

        // 1. Todos los links de propiedades
        const links = Array.from(document.querySelectorAll('a[href*="/propiedades/"], a[href*="/clasificado/"]'));
        data.allLinks = links.slice(0, 5).map(l => ({
            href: l.href,
            text: l.textContent.substring(0, 80).trim()
        }));

        // 2. Elementos que contienen "publicado", "hace", "día", "hora"
        const bodyText = document.body.textContent;
        const patterns = [
            /publicado hace (\d+) día/gi,
            /hace (\d+) día/gi,
            /publicado hace (\d+) hora/gi,
            /hace (\d+) hora/gi,
            /\bhoy\b/gi,
            /\bayer\b/gi
        ];

        patterns.forEach(pattern => {
            const matches = bodyText.match(pattern);
            if (matches) {
                data.textWithFecha.push(...matches);
            }
        });

        // 3. Buscar elementos con clases que sugieren fechas/edad
        const possibleSelectors = [
            '[class*="age"]',
            '[class*="date"]',
            '[class*="published"]',
            '[class*="time"]',
            '[class*="publicado"]'
        ];

        possibleSelectors.forEach(selector => {
            const els = document.querySelectorAll(selector);
            els.forEach(el => {
                if (el.textContent.length < 200) {
                    data.dateElements.push({
                        selector,
                        class: el.className,
                        text: el.textContent.trim()
                    });
                }
            });
        });

        // 4. Buscar clases comunes en las tarjetas de propiedades
        const cards = document.querySelectorAll('[class*="card"], [class*="listing"], [class*="property"], [data-*="property"]');
        data.classesWithAge = Array.from(cards).slice(0, 3).map(card => ({
            classes: card.className,
            html: card.outerHTML.substring(0, 500)
        }));

        return data;
    });

    console.log('1️⃣ PRIMEROS 5 LINKS DE PROPIEDADES:');
    results.allLinks.forEach((l, i) => {
        console.log(`\n   ${i + 1}. ${l.href}`);
        console.log(`      Texto: ${l.text}`);
    });

    console.log('\n2️⃣ TEXTOS CON FECHA ENCONTRADOS:');
    if (results.textWithFecha.length > 0) {
        results.textWithFecha.forEach((t, i) => {
            console.log(`   ${i + 1}. "${t}"`);
        });
    } else {
        console.log('   ❌ NO SE ENCONTRÓ NINGÚN TEXTO CON FECHA');
    }

    console.log('\n3️⃣ ELEMENTOS CON CLASES DE FECHA:');
    if (results.dateElements.length > 0) {
        results.dateElements.slice(0, 10).forEach((el, i) => {
            console.log(`\n   ${i + 1}. ${el.selector}`);
            console.log(`      Class: ${el.class}`);
            console.log(`      Text: ${el.text.substring(0, 100)}`);
        });
    } else {
        console.log('   ❌ NO SE ENCONTRARON ELEMENTOS CON CLASES DE FECHA');
    }

    console.log('\n4️⃣ HTML DE LAS PRIMERAS 3 TARJETAS:');
    results.classesWithAge.forEach((card, i) => {
        console.log(`\n   ${i + 1}. Classes: ${card.classes}`);
        console.log(`      HTML: ${card.html}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('✅ Diagnóstico completado. Navegador abierto 30 segundos...\n');

    await new Promise(r => setTimeout(r, 30000));
    await browser.close();
})().catch(e => console.error('❌ Error:', e.message));
