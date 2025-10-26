const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🔍 Extrayendo propiedades de Inmuebles24...\n');

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Configurar timeout más largo
    page.setDefaultNavigationTimeout(60000);

    const allProperties = [];
    const baseUrl = 'https://www.inmuebles24.com/casas-en-venta-en-culiacan-de-1200000-a-1500000-pesos.html';

    // Función para extraer propiedades de la página actual
    async function extractFromCurrentPage() {
        await page.waitForSelector('a[href*="/propiedades/clasificado/"]', { timeout: 10000 });

        const properties = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="/propiedades/clasificado/"]'));
            const uniqueUrls = new Set();

            return links
                .map(link => {
                    const url = link.href.split('?')[0]; // Limpiar query params
                    const titleEl = link.querySelector('h2, h3, [class*="title"]');
                    const title = titleEl ? titleEl.textContent.trim() : link.textContent.trim().substring(0, 100) || 'Sin título';
                    return { url, title };
                })
                .filter(prop => {
                    if (uniqueUrls.has(prop.url)) return false;
                    uniqueUrls.add(prop.url);
                    return prop.url.includes('/propiedades/clasificado/veclcain-');
                });
        });

        return properties;
    }

    // Navegar a la página 1
    console.log('📄 Cargando página 1...');
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });

    let page1Props = await extractFromCurrentPage();
    allProperties.push(...page1Props);
    console.log(`✅ Página 1: ${page1Props.length} propiedades\n`);

    // Si necesitamos más propiedades, ir a página 2
    if (allProperties.length < 32) {
        try {
            console.log('📄 Buscando página 2...');

            // Buscar el botón de siguiente
            const nextUrl = await page.evaluate(() => {
                const nextLink = document.querySelector('a[title="Siguiente"], a[aria-label="Siguiente"], a.andes-pagination__arrow--next');
                return nextLink ? nextLink.href : null;
            });

            if (nextUrl) {
                console.log('📄 Cargando página 2...');
                await page.goto(nextUrl, { waitUntil: 'networkidle2' });

                let page2Props = await extractFromCurrentPage();
                allProperties.push(...page2Props);
                console.log(`✅ Página 2: ${page2Props.length} propiedades\n`);
            } else {
                console.log('⚠️  No se encontró enlace a página 2\n');
            }
        } catch (e) {
            console.log('⚠️  No hay página 2 o error:', e.message, '\n');
        }
    }

    await browser.close();

    // Limitar a 32 y extraer IDs
    const finalProperties = allProperties.slice(0, 32).map((prop, index) => {
        const idMatch = prop.url.match(/-(\d+)\.html/);
        const id = idMatch ? idMatch[1] : 'SIN_ID';
        return {
            num: index + 1,
            id: id,
            url: prop.url,
            title: prop.title
        };
    });

    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log(`📊 TOTAL EXTRAÍDO: ${finalProperties.length} propiedades`);
    console.log('════════════════════════════════════════════════════════════════════════════════\n');

    // Mostrar en formato tabla
    console.log('📋 LISTA DE PROPIEDADES:\n');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
    console.log('NUM  | ID         | TÍTULO');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');

    finalProperties.forEach(prop => {
        const titleShort = prop.title.substring(0, 60).padEnd(60);
        console.log(`${String(prop.num).padStart(3)} | ${prop.id.padEnd(10)} | ${titleShort}`);
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════\n');

    // Guardar JSON
    fs.writeFileSync('/tmp/propiedades-extraidas.json', JSON.stringify(finalProperties, null, 2));
    console.log('💾 JSON guardado en: /tmp/propiedades-extraidas.json\n');

    // Mostrar solo IDs
    console.log('📝 LISTA DE IDs (para referencia rápida):');
    console.log(finalProperties.map(p => p.id).join(', '));
    console.log('\n');

})().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});
