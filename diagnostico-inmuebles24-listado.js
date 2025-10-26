const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Diagnóstico de estructura HTML - Inmuebles24 Culiacán\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    const page = await browser.newPage();

    console.log('📄 Cargando página de listados...');
    await page.goto('https://www.inmuebles24.com/venta/sinaloa/culiacan/', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    console.log('✅ Página cargada. Esperando 5 segundos...\n');
    await new Promise(r => setTimeout(r, 5000));

    // Scroll para cargar contenido lazy
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('═'.repeat(80));
    console.log('🔍 ANÁLISIS DE ESTRUCTURA HTML');
    console.log('═'.repeat(80));

    const analysis = await page.evaluate(() => {
        const result = {
            totalElements: 0,
            cards: [],
            possibleSelectors: [],
            links: [],
            ageTexts: []
        };

        // 1. Buscar todos los links a propiedades
        const allLinks = Array.from(document.querySelectorAll('a[href*="/propiedades/"], a[href*="clasificado"]'));
        result.links = allLinks.slice(0, 10).map(a => ({
            href: a.href,
            text: a.textContent.substring(0, 50),
            classes: a.className
        }));

        // 2. Intentar múltiples selectores para tarjetas
        const selectors = [
            '[data-posting-type]',
            '.posting-card',
            '[class*="PropertyCard"]',
            '[class*="property-card"]',
            '[class*="Card"]',
            'article',
            '[data-id]',
            '[data-property]',
            'li[class*="result"]',
            'div[class*="listing"]'
        ];

        for (const sel of selectors) {
            const elements = document.querySelectorAll(sel);
            if (elements.length > 0) {
                result.possibleSelectors.push({
                    selector: sel,
                    count: elements.length,
                    firstClasses: elements[0]?.className || 'N/A'
                });
            }
        }

        // 3. Buscar elementos con texto de antigüedad
        const bodyText = document.body.innerHTML;
        const ageMatches = bodyText.match(/(publicado hace|hace \d+|días|horas)/gi);
        if (ageMatches) {
            result.ageTexts = [...new Set(ageMatches)].slice(0, 10);
        }

        // 4. Analizar primera "tarjeta" encontrada (si existe)
        if (result.possibleSelectors.length > 0) {
            const bestSelector = result.possibleSelectors[0].selector;
            const firstCard = document.querySelector(bestSelector);

            if (firstCard) {
                result.cards.push({
                    selector: bestSelector,
                    outerHTML: firstCard.outerHTML.substring(0, 500),
                    childrenCount: firstCard.children.length,
                    textContent: firstCard.textContent.substring(0, 200)
                });
            }
        }

        return result;
    });

    console.log('\n1️⃣ LINKS A PROPIEDADES ENCONTRADOS:');
    console.log(`   Total: ${analysis.links.length}`);
    analysis.links.forEach((link, i) => {
        console.log(`\n   ${i + 1}. ${link.text.trim()}`);
        console.log(`      URL: ${link.href}`);
        console.log(`      Classes: ${link.classes}`);
    });

    console.log('\n2️⃣ SELECTORES POSIBLES PARA TARJETAS:');
    if (analysis.possibleSelectors.length > 0) {
        analysis.possibleSelectors.forEach(s => {
            console.log(`   ✅ "${s.selector}" → ${s.count} elementos`);
            console.log(`      Classes: ${s.firstClasses}`);
        });
    } else {
        console.log('   ❌ No se encontraron selectores conocidos');
    }

    console.log('\n3️⃣ TEXTOS DE ANTIGÜEDAD ENCONTRADOS:');
    if (analysis.ageTexts.length > 0) {
        analysis.ageTexts.forEach(text => {
            console.log(`   • "${text}"`);
        });
    } else {
        console.log('   ❌ No se encontraron textos de antigüedad');
    }

    console.log('\n4️⃣ EJEMPLO DE TARJETA (HTML):');
    if (analysis.cards.length > 0) {
        console.log(analysis.cards[0].outerHTML);
    } else {
        console.log('   ❌ No se pudo extraer HTML de tarjeta');
    }

    console.log('\n' + '═'.repeat(80));
    console.log('🖼️  Navegador permanecerá abierto 30 segundos para inspección manual...');
    console.log('═'.repeat(80));

    await new Promise(r => setTimeout(r, 30000));
    await browser.close();

    console.log('\n✅ Diagnóstico completado');
})().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
