const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Diagnóstico del Mapa Modal\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    });

    const page = await browser.newPage();

    // Capturar errores de consola
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ ERROR CONSOLA:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('❌ ERROR PÁGINA:', error.message);
    });

    console.log('📄 Abriendo culiacan/index.html...\n');
    await page.goto(`file://${__dirname}/culiacan/index.html`, {
        waitUntil: 'networkidle2'
    });

    // Esperar que cargue
    await page.waitForTimeout(2000);

    console.log('🔍 Verificando elementos:\n');

    const diagnostics = await page.evaluate(() => {
        const result = {
            modal: null,
            button: null,
            function: null,
            errors: []
        };

        // Verificar modal
        const modal = document.getElementById('mapModal');
        if (modal) {
            result.modal = {
                exists: true,
                classes: modal.className,
                display: window.getComputedStyle(modal).display
            };
        } else {
            result.errors.push('Modal con ID "mapModal" no encontrado');
        }

        // Verificar botón
        const button = document.querySelector('button[onclick="openMapModal()"]');
        if (button) {
            result.button = {
                exists: true,
                text: button.textContent.trim()
            };
        } else {
            result.errors.push('Botón "Ver mapa" no encontrado');
        }

        // Verificar función
        if (typeof openMapModal === 'function') {
            result.function = { exists: true };
        } else {
            result.errors.push('Función openMapModal() no definida');
        }

        return result;
    });

    console.log('📊 RESULTADOS:\n');
    console.log('Modal:', diagnostics.modal ? '✅ Existe' : '❌ No existe');
    if (diagnostics.modal) {
        console.log('  Clases:', diagnostics.modal.classes);
        console.log('  Display:', diagnostics.modal.display);
    }

    console.log('\nBotón:', diagnostics.button ? '✅ Existe' : '❌ No existe');
    console.log('\nFunción openMapModal():', diagnostics.function ? '✅ Definida' : '❌ No definida');

    if (diagnostics.errors.length > 0) {
        console.log('\n🚨 ERRORES:');
        diagnostics.errors.forEach(err => console.log('  -', err));
    }

    // Intentar abrir el modal
    console.log('\n🖱️  Simulando clic en botón "Ver mapa"...\n');

    try {
        await page.click('button[onclick="openMapModal()"]');
        await page.waitForTimeout(1000);

        const modalVisible = await page.evaluate(() => {
            const modal = document.getElementById('mapModal');
            return modal && !modal.classList.contains('hidden');
        });

        console.log('Resultado:', modalVisible ? '✅ Modal abierto exitosamente' : '❌ Modal NO se abrió');
    } catch (error) {
        console.log('❌ Error al hacer clic:', error.message);
    }

    console.log('\n✅ Diagnóstico completado. Navegador permanecerá abierto 15 segundos...\n');
    await page.waitForTimeout(15000);

    await browser.close();
})().catch(console.error);
