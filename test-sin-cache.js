const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Probando botón Ver mapa (SIN CACHE)...\n');

    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        args: ['--disable-cache', '--disable-application-cache', '--disable-offline-load-stale-cache']
    });

    const page = await browser.newPage();

    // Deshabilitar cache
    await page.setCacheEnabled(false);

    // Capturar errores
    const errors = [];
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            errors.push(text);
            console.log('❌ ERROR:', text);
        }
    });

    page.on('pageerror', error => {
        errors.push(error.message);
        console.log('❌ PAGE ERROR:', error.message);
    });

    console.log('📄 Cargando página (sin cache)...');
    await page.goto('file:///Users/hectorpc/Documents/Hector%20Palazuelos/Google%20My%20Business/landing%20casa%20solidaridad/culiacan/index.html', {
        waitUntil: 'networkidle0',
        timeout: 60000
    });

    // Esperar con setTimeout en lugar de waitForTimeout
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n📊 VERIFICANDO...\n');

    const diagnostics = await page.evaluate(() => {
        return {
            openMapModalExists: typeof openMapModal !== 'undefined',
            mapModalExists: !!document.getElementById('mapModal'),
            buttonExists: !!document.querySelector('button[onclick="openMapModal()"]')
        };
    });

    console.log('1. openMapModal() existe:', diagnostics.openMapModalExists ? '✅' : '❌');
    console.log('2. mapModal element existe:', diagnostics.mapModalExists ? '✅' : '❌');
    console.log('3. Botón existe:', diagnostics.buttonExists ? '✅' : '❌');
    console.log('\n4. Errores de JavaScript:', errors.length);

    if (errors.length === 0) {
        console.log('   ✅ Sin errores de JavaScript');
    } else {
        errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }

    if (diagnostics.buttonExists && diagnostics.openMapModalExists && errors.length === 0) {
        console.log('\n🖱️  Intentando click en el botón...\n');

        const clickResult = await page.evaluate(() => {
            try {
                const button = document.querySelector('button[onclick="openMapModal()"]');
                button.click();

                return new Promise(resolve => {
                    setTimeout(() => {
                        const modal = document.getElementById('mapModal');
                        const isVisible = modal && !modal.classList.contains('hidden');
                        resolve({
                            success: true,
                            modalVisible: isVisible,
                            modalClasses: modal ? Array.from(modal.classList) : []
                        });
                    }, 1000);
                });
            } catch(e) {
                return { success: false, error: e.message };
            }
        });

        console.log('Resultado:');
        console.log('   Click ejecutado:', clickResult.success ? '✅' : '❌');
        if (clickResult.modalVisible !== undefined) {
            console.log('   Modal visible:', clickResult.modalVisible ? '✅ FUNCIONA!' : '❌');
            console.log('   Classes:', clickResult.modalClasses.join(', '));
        }
        if (clickResult.error) {
            console.log('   Error:', clickResult.error);
        }
    }

    console.log('\n⏸️  Navegador abierto por 20 segundos (verifica manualmente)...\n');

    await new Promise(resolve => setTimeout(resolve, 20000));
    await browser.close();
})().catch(e => console.error('❌ Error fatal:', e.message));
