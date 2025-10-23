const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 SCRIPT 100% AUTOMÁTICO - Obtener teléfono de DAVID GONZALEZ\n');
    console.log('⏱️  Sin intervención manual requerida\n');
    console.log('='.repeat(80) + '\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--window-size=1920,1080'
        ]
    });

    const page = await browser.newPage();

    // User agent real
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Remover marcas de automatización
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        window.navigator.chrome = { runtime: {} };
    });

    try {
        // ============================================
        // MÉTODO 1: Intentar obtener teléfono SIN LOGIN
        // ============================================
        console.log('📞 Método 1: Intentando obtener teléfono sin login...\n');

        await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-guadalupe-146847493.html', {
            waitUntil: 'networkidle2',
            timeout: 90000
        });

        await new Promise(r => setTimeout(r, 3000));

        // Buscar si el teléfono está visible en la página
        const phoneVisible = await page.evaluate(() => {
            const data = { found: false, phone: '', method: '' };

            // Método 1: Buscar en elementos visibles
            const allElements = Array.from(document.querySelectorAll('*'));
            for (const el of allElements) {
                const text = el.textContent || '';
                const phoneMatch = text.match(/\b(667|668|669)\s?\d{3}\s?\d{4}\b/);
                if (phoneMatch && !el.className.includes('blur')) {
                    data.found = true;
                    data.phone = phoneMatch[0];
                    data.method = 'visible-text';
                    break;
                }
            }

            // Método 2: Buscar en data attributes
            if (!data.found) {
                const dataElements = document.querySelectorAll('[data-phone], [data-telefono], [data-contact]');
                dataElements.forEach(el => {
                    const dataPhone = el.dataset.phone || el.dataset.telefono || el.dataset.contact;
                    if (dataPhone && /\d{10}/.test(dataPhone)) {
                        data.found = true;
                        data.phone = dataPhone;
                        data.method = 'data-attribute';
                    }
                });
            }

            return data;
        });

        if (phoneVisible.found) {
            console.log('✅ ¡Teléfono encontrado sin login!\n');
            console.log('='.repeat(80));
            console.log('📞 RESULTADO FINAL:\n');
            console.log(`   Vendedor: DAVID GONZALEZ`);
            console.log(`   Teléfono: ${phoneVisible.phone}`);
            console.log(`   Método: ${phoneVisible.method}`);
            console.log('='.repeat(80) + '\n');

            await new Promise(r => setTimeout(r, 10000));
            await browser.close();
            return;
        }

        console.log('   ⚠️  Teléfono no visible sin login. Continuando con Método 2...\n');

        // ============================================
        // MÉTODO 2: Buscar en el código fuente de la página
        // ============================================
        console.log('🔍 Método 2: Analizando código fuente de la página...\n');

        const html = await page.content();

        // Buscar teléfonos de Culiacán en el HTML
        const phoneRegex = /\b(667|668|669)[\s-]?\d{3}[\s-]?\d{4}\b/g;
        const phonesFound = [];
        let match;

        while ((match = phoneRegex.exec(html)) !== null) {
            const phone = match[0].replace(/\s|-/g, '');
            if (!phonesFound.includes(phone)) {
                phonesFound.push(phone);
            }
        }

        // Filtrar el teléfono correcto (excluir el de Monterrey 815028902)
        const validPhones = phonesFound.filter(p => !p.startsWith('81'));

        if (validPhones.length > 0) {
            console.log('✅ Teléfono(s) de Culiacán encontrado(s) en el código fuente:\n');
            validPhones.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));

            console.log('\n='.repeat(80));
            console.log('📞 RESULTADO FINAL:\n');
            console.log(`   Vendedor: DAVID GONZALEZ`);
            console.log(`   Teléfono: ${validPhones[0]}`);
            console.log(`   Método: html-source-code`);
            console.log('='.repeat(80) + '\n');

            await new Promise(r => setTimeout(r, 10000));
            await browser.close();
            return;
        }

        console.log('   ⚠️  No se encontraron teléfonos de Culiacán en el código fuente.\n');

        // ============================================
        // MÉTODO 3: Click en "Ver teléfono" y capturar cambios
        // ============================================
        console.log('👆 Método 3: Haciendo clic en "Ver teléfono" y capturando cambios...\n');

        // Capturar el HTML ANTES del clic
        const htmlBefore = await page.content();

        // Hacer clic en "Ver teléfono"
        const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const phoneBtn = buttons.find(btn => {
                const text = btn.textContent.toLowerCase();
                return text.includes('teléfono') || text.includes('telefono');
            });

            if (phoneBtn) {
                phoneBtn.click();
                return true;
            }
            return false;
        });

        if (!clicked) {
            console.log('❌ No se encontró botón "Ver teléfono"\n');
            await browser.close();
            return;
        }

        console.log('   ✅ Botón clickeado. Esperando cambios...\n');

        // Esperar 5 segundos para que se actualice
        await new Promise(r => setTimeout(r, 5000));

        // Capturar el HTML DESPUÉS del clic
        const htmlAfter = await page.content();

        // Buscar diferencias (nuevo contenido que apareció)
        console.log('🔍 Analizando diferencias en el HTML...\n');

        const phoneAfterClick = await page.evaluate(() => {
            const data = { found: false, phone: '', location: '' };

            // Buscar teléfonos recién revelados
            const allText = document.body.textContent;
            const phoneMatch = allText.match(/\b(667|668|669)\s?\d{3}\s?\d{4}\b/);

            if (phoneMatch) {
                data.found = true;
                data.phone = phoneMatch[0];

                // Buscar elemento que contiene el teléfono
                const allElements = Array.from(document.querySelectorAll('*'));
                for (const el of allElements) {
                    if (el.textContent.includes(phoneMatch[0])) {
                        data.location = el.className || el.tagName;
                        break;
                    }
                }
            }

            return data;
        });

        if (phoneAfterClick.found) {
            console.log('✅ ¡Teléfono revelado después del clic!\n');
            console.log('='.repeat(80));
            console.log('📞 RESULTADO FINAL:\n');
            console.log(`   Vendedor: DAVID GONZALEZ`);
            console.log(`   Teléfono: ${phoneAfterClick.phone}`);
            console.log(`   Ubicación: ${phoneAfterClick.location}`);
            console.log(`   Método: click-reveal`);
            console.log('='.repeat(80) + '\n');

            await new Promise(r => setTimeout(r, 10000));
            await browser.close();
            return;
        }

        // ============================================
        // RESULTADO FINAL: No se pudo obtener
        // ============================================
        console.log('❌ No se pudo obtener el teléfono con métodos automáticos.\n');
        console.log('📋 CONCLUSIÓN:\n');
        console.log('   El teléfono de DAVID GONZALEZ requiere autenticación en Inmuebles24.');
        console.log('   Necesitas crear una cuenta manualmente para verlo.\n');
        console.log('💡 RECOMENDACIÓN:\n');
        console.log('   1. Llama directamente a Inmuebles24 y pide el contacto del vendedor');
        console.log('   2. O crea una cuenta en inmuebles24.com con tu email personal\n');

        console.log('⏳ Navegador permanecerá abierto 30 segundos para inspección manual...\n');
        await new Promise(r => setTimeout(r, 30000));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await browser.close();
    console.log('✅ Script completado\n');
})();
