const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🔍 Diagnóstico Exhaustivo - Inmuebles24 Culiacán\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();

    // Ocultar que somos un bot
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });

    // User agent real
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('📄 Cargando página de listados Culiacán...');
    const url = 'https://www.inmuebles24.com/venta/sinaloa/culiacan/';

    try {
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log('✅ Página cargada (domcontentloaded)');

        // Esperar más tiempo para JavaScript
        console.log('⏳ Esperando 10 segundos para que JavaScript renderice...');
        await new Promise(r => setTimeout(r, 10000));

        // Screenshot 1: Estado inicial
        await page.screenshot({ path: 'inmuebles24-screenshot-1-initial.png', fullPage: true });
        console.log('📸 Screenshot 1 guardado: inmuebles24-screenshot-1-initial.png');

        // Scroll gradual
        console.log('📜 Haciendo scroll gradual...');
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 300;
                const timer = setInterval(() => {
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= document.body.scrollHeight / 2) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        await new Promise(r => setTimeout(r, 3000));

        // Screenshot 2: Después de scroll
        await page.screenshot({ path: 'inmuebles24-screenshot-2-scrolled.png', fullPage: true });
        console.log('📸 Screenshot 2 guardado: inmuebles24-screenshot-2-scrolled.png');

        // Buscar todos los posibles elementos
        console.log('\n═'.repeat(80));
        console.log('🔍 ANÁLISIS DE ELEMENTOS');
        console.log('═'.repeat(80));

        const analysis = await page.evaluate(() => {
            const result = {
                title: document.title,
                url: window.location.href,
                bodyClasses: document.body.className,
                allLinks: [],
                allImages: [],
                divCount: document.querySelectorAll('div').length,
                articleCount: document.querySelectorAll('article').length,
                listCount: document.querySelectorAll('li').length,
                dataAttributes: [],
                possibleCards: []
            };

            // Links
            const links = Array.from(document.querySelectorAll('a[href]'));
            result.allLinks = links.slice(0, 20).map(a => ({
                href: a.href,
                text: a.textContent.substring(0, 50).trim(),
                class: a.className
            }));

            // Imágenes
            const images = Array.from(document.querySelectorAll('img'));
            result.allImages = images.slice(0, 10).map(img => ({
                src: img.src,
                alt: img.alt
            }));

            // Data attributes
            const allElements = Array.from(document.querySelectorAll('[data-*]'));
            const dataAttrs = new Set();
            allElements.forEach(el => {
                Array.from(el.attributes).forEach(attr => {
                    if (attr.name.startsWith('data-')) {
                        dataAttrs.add(attr.name);
                    }
                });
            });
            result.dataAttributes = Array.from(dataAttrs);

            // Buscar divs con muchas clases (probables cards)
            const divs = Array.from(document.querySelectorAll('div[class]'));
            const complexDivs = divs
                .filter(div => div.className.split(' ').length >= 3)
                .slice(0, 5)
                .map(div => ({
                    classes: div.className,
                    text: div.textContent.substring(0, 100).trim(),
                    children: div.children.length
                }));
            result.possibleCards = complexDivs;

            return result;
        });

        console.log('\n📊 INFORMACIÓN GENERAL:');
        console.log(`   Título: ${analysis.title}`);
        console.log(`   URL: ${analysis.url}`);
        console.log(`   Body classes: ${analysis.bodyClasses}`);
        console.log(`   Total <div>: ${analysis.divCount}`);
        console.log(`   Total <article>: ${analysis.articleCount}`);
        console.log(`   Total <li>: ${analysis.listCount}`);

        console.log('\n🔗 PRIMEROS 10 LINKS:');
        analysis.allLinks.slice(0, 10).forEach((link, i) => {
            console.log(`   ${i + 1}. ${link.text}`);
            console.log(`      URL: ${link.href}`);
        });

        console.log('\n🖼️  PRIMERAS 5 IMÁGENES:');
        analysis.allImages.slice(0, 5).forEach((img, i) => {
            console.log(`   ${i + 1}. ${img.alt || 'Sin alt'}`);
            console.log(`      Src: ${img.src.substring(0, 80)}...`);
        });

        console.log('\n📦 DATA ATTRIBUTES ENCONTRADOS:');
        analysis.dataAttributes.slice(0, 15).forEach(attr => {
            console.log(`   • ${attr}`);
        });

        console.log('\n🎴 POSIBLES CARDS (divs complejos):');
        analysis.possibleCards.forEach((div, i) => {
            console.log(`\n   ${i + 1}. Classes: ${div.classes}`);
            console.log(`      Children: ${div.children}`);
            console.log(`      Text: ${div.text}`);
        });

        // Guardar HTML completo
        const html = await page.content();
        fs.writeFileSync('inmuebles24-page-full.html', html, 'utf8');
        console.log('\n💾 HTML completo guardado: inmuebles24-page-full.html');

        // Buscar específicamente por texto que contiene "publicado" o "días"
        const textMatches = await page.evaluate(() => {
            const result = [];
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let node;
            while (node = walker.nextNode()) {
                const text = node.textContent.toLowerCase();
                if (text.includes('publicado') || text.includes('día') || text.includes('hora')) {
                    const parent = node.parentElement;
                    result.push({
                        text: node.textContent.trim().substring(0, 100),
                        tag: parent.tagName,
                        class: parent.className
                    });
                }
            }
            return result.slice(0, 10);
        });

        console.log('\n📅 TEXTOS CON "PUBLICADO" O "DÍAS":');
        textMatches.forEach((match, i) => {
            console.log(`   ${i + 1}. "${match.text}"`);
            console.log(`      Tag: <${match.tag}> | Class: ${match.class}`);
        });

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await page.screenshot({ path: 'inmuebles24-error.png', fullPage: true });
        console.log('📸 Screenshot de error guardado: inmuebles24-error.png');
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ Diagnóstico completado');
    console.log('📁 Archivos generados:');
    console.log('   • inmuebles24-screenshot-1-initial.png');
    console.log('   • inmuebles24-screenshot-2-scrolled.png');
    console.log('   • inmuebles24-page-full.html');
    console.log('\n🖼️  Navegador permanecerá abierto 30 segundos...');
    console.log('═'.repeat(80));

    await new Promise(r => setTimeout(r, 30000));
    await browser.close();
})().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
