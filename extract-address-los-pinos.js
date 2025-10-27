const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-los-pinos-142636213.html', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    // Esperar a que cargue el contenido
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Screenshot para debugging
    await page.screenshot({ path: '/tmp/los-pinos-debug.png' });

    // Extraer todas las direcciones candidatas
    const addresses = await page.evaluate(() => {
        const iframe = document.querySelector('iframe[src*="google.com/maps"]');
        console.log('Iframe found:', !!iframe);

        const candidates = [];
        const allElements = Array.from(document.querySelectorAll('h3, h4, h5, p'));

        allElements.forEach(el => {
            const text = el.textContent.trim();
            // Buscar textos que parezcan direcciones (tienen comas y no son muy largos)
            if (text.length > 15 && text.length < 150) {
                const hasComa = text.includes(',');
                const hasColoniaOrFracc = /colonia|col\.|fracc|fraccionamiento|los pinos|río/i.test(text);
                const hasCuliacan = /culiacán|culiacan|sinaloa/i.test(text);

                if ((hasComa || hasColoniaOrFracc) && !text.includes('ADVERTENCIA')) {
                    candidates.push({
                        text: text,
                        tag: el.tagName.toLowerCase(),
                        score: (hasCuliacan ? 5 : 0) + (hasColoniaOrFracc ? 3 : 0) + (text.split(',').length * 2)
                    });
                }
            }
        });

        // Ordenar por score
        candidates.sort((a, b) => b.score - a.score);
        return candidates.slice(0, 15);
    });

    console.log('\n📍 DIRECCIONES ENCONTRADAS:', addresses.length);

    if (addresses.length === 0) {
        // Debug: extraer el texto completo de la página
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log('\n⚠️ No se encontraron direcciones. Texto de página (primeros 500 chars):');
        console.log(pageText.substring(0, 500));
    } else {
        console.log('\n');
        addresses.forEach((addr, idx) => {
            console.log(`${idx + 1}. [score:${addr.score}] [${addr.tag}] ${addr.text}`);
        });
    }

    await browser.close();
})();
