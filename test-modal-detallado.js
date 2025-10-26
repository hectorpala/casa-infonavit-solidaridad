const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Diagnóstico Detallado del Modal de Mapa\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    const page = await browser.newPage();

    // Capturar todos los errores
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(`ERROR CONSOLA: ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        errors.push(`ERROR PÁGINA: ${error.message}`);
    });

    console.log('📄 Cargando culiacan/index.html...\n');
    await page.goto(`file://${__dirname}/culiacan/index.html`, {
        waitUntil: 'networkidle2'
    });

    // Esperar 3 segundos
    await new Promise(r => setTimeout(r, 3000));

    console.log('🔍 Verificando elementos y funciones:\n');

    const diagnostics = await page.evaluate(() => {
        const result = {
            modal: null,
            button: null,
            openMapModalExists: false,
            openMapModalCode: null,
            buttonOnclick: null,
            modalClasses: null,
            allJSErrors: []
        };

        // Verificar modal
        const modal = document.getElementById('mapModal');
        if (modal) {
            result.modal = {
                exists: true,
                display: window.getComputedStyle(modal).display,
                classes: modal.className
            };
            result.modalClasses = modal.className;
        }

        // Verificar botón
        const buttons = document.querySelectorAll('button');
        let mapButton = null;
        for (let btn of buttons) {
            if (btn.textContent.includes('Ver mapa')) {
                mapButton = btn;
                break;
            }
        }

        if (mapButton) {
            result.button = {
                exists: true,
                text: mapButton.textContent.trim(),
                onclick: mapButton.getAttribute('onclick'),
                hasOnclick: mapButton.onclick !== null
            };
            result.buttonOnclick = mapButton.getAttribute('onclick');
        }

        // Verificar función openMapModal
        if (typeof openMapModal === 'function') {
            result.openMapModalExists = true;
            result.openMapModalCode = openMapModal.toString().substring(0, 200);
        }

        return result;
    });

    console.log('═'.repeat(80));
    console.log('📊 RESULTADOS DEL DIAGNÓSTICO:\n');

    console.log('1️⃣ MODAL:');
    if (diagnostics.modal) {
        console.log('   ✅ Existe');
        console.log(`   Display: ${diagnostics.modal.display}`);
        console.log(`   Classes: ${diagnostics.modal.classes}`);
    } else {
        console.log('   ❌ NO existe');
    }

    console.log('\n2️⃣ BOTÓN "Ver mapa":');
    if (diagnostics.button) {
        console.log('   ✅ Existe');
        console.log(`   Texto: "${diagnostics.button.text}"`);
        console.log(`   onclick attribute: ${diagnostics.buttonOnclick}`);
        console.log(`   Tiene onclick handler: ${diagnostics.button.hasOnclick}`);
    } else {
        console.log('   ❌ NO existe');
    }

    console.log('\n3️⃣ FUNCIÓN openMapModal():');
    if (diagnostics.openMapModalExists) {
        console.log('   ✅ Definida');
        console.log(`   Código (primeros 200 chars):\n   ${diagnostics.openMapModalCode}`);
    } else {
        console.log('   ❌ NO definida');
    }

    console.log('\n4️⃣ ERRORES JAVASCRIPT:');
    if (errors.length > 0) {
        errors.forEach((err, i) => {
            console.log(`   ${i + 1}. ${err}`);
        });
    } else {
        console.log('   ✅ No hay errores JavaScript');
    }

    // Intentar simular clic
    console.log('\n═'.repeat(80));
    console.log('🖱️  SIMULANDO CLIC EN BOTÓN "Ver mapa"...\n');

    try {
        const clickResult = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            let mapButton = null;
            for (let btn of buttons) {
                if (btn.textContent.includes('Ver mapa')) {
                    mapButton = btn;
                    break;
                }
            }

            if (!mapButton) {
                return { error: 'Botón no encontrado' };
            }

            // Intentar hacer clic
            try {
                mapButton.click();

                // Verificar si el modal se abrió después de 500ms
                return new Promise(resolve => {
                    setTimeout(() => {
                        const modal = document.getElementById('mapModal');
                        resolve({
                            modalExists: modal !== null,
                            modalDisplay: modal ? window.getComputedStyle(modal).display : null,
                            modalClasses: modal ? modal.className : null,
                            hasHiddenClass: modal ? modal.classList.contains('hidden') : null,
                            hasFlexClass: modal ? modal.classList.contains('flex') : null
                        });
                    }, 500);
                });
            } catch (e) {
                return { error: e.message };
            }
        });

        console.log('Resultado del clic:');
        console.log(JSON.stringify(clickResult, null, 2));

        if (clickResult.error) {
            console.log(`\n❌ Error: ${clickResult.error}`);
        } else if (clickResult.hasHiddenClass) {
            console.log('\n❌ Modal sigue con clase "hidden" - NO se abrió');
        } else if (clickResult.hasFlexClass && clickResult.modalDisplay === 'flex') {
            console.log('\n✅ Modal se abrió correctamente');
        } else {
            console.log('\n⚠️  Estado indeterminado del modal');
        }

    } catch (error) {
        console.log(`❌ Error al simular clic: ${error.message}`);
    }

    console.log('\n═'.repeat(80));
    console.log('✅ Diagnóstico completado. Navegador permanecerá abierto 20 segundos...\n');

    await new Promise(r => setTimeout(r, 20000));
    await browser.close();
})().catch(console.error);
