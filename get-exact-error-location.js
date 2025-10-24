const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Capturando ubicación EXACTA del error...\n');

    const browser = await puppeteer.launch({
        headless: false,
        devtools: true
    });

    const page = await browser.newPage();

    // Capturar TODOS los errores con detalles completos
    page.on('console', msg => {
        console.log(`[${msg.type()}] ${msg.text()}`);

        if (msg.type() === 'error') {
            const location = msg.location();
            if (location) {
                console.log(`   📍 Ubicación: ${location.url || 'inline'}`);
                console.log(`   📍 Línea: ${location.lineNumber}`);
                console.log(`   📍 Columna: ${location.columnNumber}\n`);
            }
        }
    });

    page.on('pageerror', error => {
        console.log('\n❌ PAGE ERROR DETAILS:');
        console.log(`   Mensaje: ${error.message}`);
        console.log(`   Stack:`);
        console.log(error.stack || '   (no stack trace)');
        console.log('');
    });

    console.log('📄 Cargando página...\n');
    await page.goto('https://casasenventa.info/culiacan/', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n⏸️  Mantener navegador abierto por 15 segundos para inspección manual...\n');
    await new Promise(resolve => setTimeout(resolve, 15000));

    await browser.close();
})().catch(e => console.error('❌ Error fatal:', e.message));
