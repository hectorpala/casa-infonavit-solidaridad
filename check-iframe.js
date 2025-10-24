const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('🌐 Navegando a la página...');
    await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-se-vende-casa-en-perisur-ii-culiacan-147711585.html', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    console.log('🔍 Buscando iframes de Google Maps...\n');

    const iframeData = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        return iframes.map(iframe => ({
            src: iframe.src,
            isGoogleMaps: iframe.src && iframe.src.includes('google.com/maps'),
            width: iframe.width,
            height: iframe.height
        }));
    });

    console.log(`📊 Total de iframes encontrados: ${iframeData.length}\n`);

    iframeData.forEach((iframe, i) => {
        console.log(`IFRAME ${i + 1}:`);
        console.log(`  Google Maps: ${iframe.isGoogleMaps ? '✅ SÍ' : '❌ NO'}`);
        console.log(`  Dimensiones: ${iframe.width}x${iframe.height}`);
        console.log(`  URL: ${iframe.src.substring(0, 200)}${iframe.src.length > 200 ? '...' : ''}`);

        if (iframe.isGoogleMaps) {
            // Buscar patrón de coordenadas
            const embedMatch = iframe.src.match(/!2d(-?\d+\.?\d*)!3d(-?\d+\.?\d*)/);
            const qMatch = iframe.src.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
            const centerMatch = iframe.src.match(/[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/);

            if (embedMatch) {
                console.log(`  📍 Coordenadas (!2d/!3d): ${embedMatch[2]}, ${embedMatch[1]}`);
            }
            if (qMatch) {
                console.log(`  📍 Coordenadas (q=): ${qMatch[1]}, ${qMatch[2]}`);
            }
            if (centerMatch) {
                console.log(`  📍 Coordenadas (center=): ${centerMatch[1]}, ${centerMatch[2]}`);
            }

            if (!embedMatch && !qMatch && !centerMatch) {
                console.log(`  ⚠️  No se encontraron coordenadas en patrón conocido`);
            }
        }
        console.log('');
    });

    console.log('✅ Análisis completado. Cerrando en 10 segundos...');
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();
})();
