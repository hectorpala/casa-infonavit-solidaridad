const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Diagnóstico completo del botón "Ver mapa"...\n');

    const browser = await puppeteer.launch({
        headless: false,
        devtools: true
    });

    const page = await browser.newPage();

    // Capturar TODOS los errores
    const errors = [];
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            errors.push(text);
            console.log('❌ CONSOLE ERROR:', text);
        }
    });

    page.on('pageerror', error => {
        errors.push(error.message);
        console.log('❌ PAGE ERROR:', error.message);
    });

    console.log('📄 Cargando página...');
    await page.goto('file:///Users/hectorpc/Documents/Hector%20Palazuelos/Google%20My%20Business/landing%20casa%20solidaridad/culiacan/index.html', {
        waitUntil: 'networkidle0',
        timeout: 60000
    });

    console.log('⏳ Esperando 3 segundos...\n');
    await page.waitForTimeout(3000);

    // Verificar si openMapModal existe
    const diagnostics = await page.evaluate(() => {
        const results = {
            openMapModalExists: typeof openMapModal !== 'undefined',
            openMapModalType: typeof openMapModal,
            mapModalExists: !!document.getElementById('mapModal'),
            buttonExists: !!document.querySelector('button[onclick="openMapModal()"]'),
            initializeCuliacanMapExists: typeof initializeCuliacanMap !== 'undefined',
            windowMapCuliacanInitialized: window.mapCuliacanInitialized,
            allGlobalFunctions: []
        };

        // Listar todas las funciones globales relacionadas con mapa
        for (let key in window) {
            if (typeof window[key] === 'function' && (key.includes('map') || key.includes('Map'))) {
                results.allGlobalFunctions.push(key);
            }
        }

        return results;
    });

    console.log('📊 DIAGNÓSTICO:\n');
    console.log('1️⃣ openMapModal() existe:', diagnostics.openMapModalExists ? '✅' : '❌');
    console.log('   Tipo:', diagnostics.openMapModalType);
    console.log('');
    console.log('2️⃣ mapModal element existe:', diagnostics.mapModalExists ? '✅' : '❌');
    console.log('');
    console.log('3️⃣ Botón "Ver mapa" existe:', diagnostics.buttonExists ? '✅' : '❌');
    console.log('');
    console.log('4️⃣ initializeCuliacanMap() existe:', diagnostics.initializeCuliacanMapExists ? '✅' : '❌');
    console.log('');
    console.log('5️⃣ mapCuliacanInitialized:', diagnostics.windowMapCuliacanInitialized);
    console.log('');
    console.log('6️⃣ Funciones globales con "map":', diagnostics.allGlobalFunctions.length);
    diagnostics.allGlobalFunctions.forEach(fn => console.log('   -', fn));
    console.log('');
    console.log('7️⃣ Errores capturados:', errors.length);
    errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));

    if (diagnostics.buttonExists && diagnostics.openMapModalExists) {
        console.log('\n🖱️  Intentando hacer clic en el botón...\n');

        const clickResult = await page.evaluate(() => {
            try {
                const button = document.querySelector('button[onclick="openMapModal()"]');
                button.click();

                // Esperar un poco y verificar modal
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

        console.log('Resultado del click:');
        console.log('   Success:', clickResult.success ? '✅' : '❌');
        if (clickResult.modalVisible !== undefined) {
            console.log('   Modal visible:', clickResult.modalVisible ? '✅' : '❌');
            console.log('   Modal classes:', clickResult.modalClasses);
        }
        if (clickResult.error) {
            console.log('   Error:', clickResult.error);
        }
    }

    console.log('\n⏸️  Navegador abierto por 30 segundos...');
    console.log('   Revisa DevTools para más detalles\n');

    await page.waitForTimeout(30000);
    await browser.close();
})().catch(e => console.error('❌ Error fatal:', e.message));
