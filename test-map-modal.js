const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Diagnosticando botón "Ver mapa"...\n');

    const browser = await puppeteer.launch({
        headless: false,
        devtools: true
    });

    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.log('❌ PAGE ERROR:', error.message));

    console.log('📄 Cargando página local...');
    await page.goto('file:///Users/hectorpc/Documents/Hector%20Palazuelos/Google%20My%20Business/landing%20casa%20solidaridad/culiacan/index.html', {
        waitUntil: 'networkidle0',
        timeout: 60000
    });

    console.log('⏳ Esperando 3 segundos...\n');
    await page.waitForTimeout(3000);

    const functionExists = await page.evaluate(() => {
        return typeof openMapModal !== 'undefined';
    });

    console.log('openMapModal existe:', functionExists ? '✅' : '❌');

    const buttonExists = await page.evaluate(() => {
        const button = document.querySelector('button[onclick="openMapModal()"]');
        return button !== null;
    });

    console.log('Botón "Ver mapa" existe:', buttonExists ? '✅' : '❌\n');

    if (buttonExists) {
        console.log('🖱️  Haciendo clic en "Ver mapa"...\n');

        const result = await page.evaluate(() => {
            try {
                const button = document.querySelector('button[onclick="openMapModal()"]');
                button.click();

                setTimeout(() => {
                    const modal = document.getElementById('mapModal');
                    const isVisible = modal && !modal.classList.contains('hidden');
                    console.log('Modal visible:', isVisible);
                }, 1000);

                return { success: true, error: null };
            } catch(e) {
                return { success: false, error: e.message };
            }
        });

        if (result.success) {
            console.log('✅ Click ejecutado sin errores');
        } else {
            console.log('❌ Error al hacer click:', result.error);
        }
    }

    console.log('\n⏸️  Manteniendo navegador abierto 30 segundos...');
    console.log('   Revisa la consola del navegador (DevTools) para ver errores');

    await page.waitForTimeout(30000);
    await browser.close();
})().catch(e => console.error('❌ Error fatal:', e.message));
