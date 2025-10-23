const puppeteer = require('puppeteer');

(async () => {
    console.log('📞 Obteniendo teléfono real de DAVID GONZALEZ...\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--window-size=1920,1080'
        ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('🌐 Cargando página de Inmuebles24...\n');

    try {
        await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-guadalupe-146847493.html', {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });

        console.log('⏳ Esperando 5 segundos para que cargue...\n');
        await new Promise(r => setTimeout(r, 5000));

        // Buscar botón "Ver teléfono"
        console.log('🔍 Buscando botón "Ver teléfono"...\n');

        const buttonSelectors = [
            'button:has-text("Ver teléfono")',
            'button[class*="phone"]',
            'a[class*="phone"]',
            'button:has-text("teléfono")',
            'button:has-text("Teléfono")',
            '[class*="btn-phone"]',
            '[class*="show-phone"]',
            '[class*="reveal-phone"]'
        ];

        // Encontrar todos los botones y links que podrían ser el botón de teléfono
        const phoneButton = await page.evaluate(() => {
            const allButtons = Array.from(document.querySelectorAll('button, a'));
            const phoneBtn = allButtons.find(btn => {
                const text = btn.textContent.toLowerCase();
                return text.includes('teléfono') || text.includes('telefono') || text.includes('ver tel');
            });

            if (phoneBtn) {
                return {
                    found: true,
                    text: phoneBtn.textContent.trim(),
                    className: phoneBtn.className,
                    id: phoneBtn.id,
                    tagName: phoneBtn.tagName
                };
            }
            return { found: false };
        });

        if (phoneButton.found) {
            console.log(`✅ Botón encontrado: "${phoneButton.text}"`);
            console.log(`   Tag: ${phoneButton.tagName}, Class: ${phoneButton.className}\n`);

            // Hacer clic en el botón
            console.log('👆 Haciendo clic en el botón...\n');

            await page.evaluate(() => {
                const allButtons = Array.from(document.querySelectorAll('button, a'));
                const phoneBtn = allButtons.find(btn => {
                    const text = btn.textContent.toLowerCase();
                    return text.includes('teléfono') || text.includes('telefono');
                });
                if (phoneBtn) phoneBtn.click();
            });

            // Esperar a que se revele el teléfono
            console.log('⏳ Esperando 3 segundos para que se revele el número...\n');
            await new Promise(r => setTimeout(r, 3000));

            // Extraer el teléfono después del clic
            const phoneData = await page.evaluate(() => {
                const data = {
                    telefonosVisibles: [],
                    textoBoton: '',
                    htmlCompleto: document.documentElement.innerHTML
                };

                // Buscar el botón actualizado
                const allButtons = Array.from(document.querySelectorAll('button, a'));
                const phoneBtn = allButtons.find(btn => {
                    const text = btn.textContent.toLowerCase();
                    return text.includes('teléfono') || text.includes('telefono') || text.match(/\d{3}[\s-]?\d{3}[\s-]?\d{4}/);
                });

                if (phoneBtn) {
                    data.textoBoton = phoneBtn.textContent.trim();
                }

                // Buscar teléfonos en todo el HTML
                const phoneRegex = /\b(52\s?)?(667|668|669)\s?\d{3}\s?\d{4}\b/g;
                let match;
                while ((match = phoneRegex.exec(data.htmlCompleto)) !== null) {
                    data.telefonosVisibles.push(match[0]);
                }

                // También buscar formato con guiones
                const phoneRegex2 = /\b(667|668|669)[-\s]?\d{3}[-\s]?\d{4}\b/g;
                while ((match = phoneRegex2.exec(data.htmlCompleto)) !== null) {
                    data.telefonosVisibles.push(match[0]);
                }

                return data;
            });

            console.log('📞 RESULTADOS:\n');
            console.log(`Texto del botón después de clic: "${phoneData.textoBoton}"`);
            console.log(`\nTeléfonos de Culiacán encontrados (${phoneData.telefonosVisibles.length}):`);

            const uniquePhones = [...new Set(phoneData.telefonosVisibles)];
            uniquePhones.forEach(p => console.log(`   📞 ${p}`));

            if (uniquePhones.length === 0) {
                console.log('\n⚠️  No se encontraron teléfonos de Culiacán (667/668/669)');
                console.log('Buscando TODOS los teléfonos de 10 dígitos...\n');

                const allPhones = await page.evaluate(() => {
                    const html = document.documentElement.innerHTML;
                    const phones = [];

                    // Buscar todos los números de 10 dígitos
                    const regex = /\b\d{10}\b/g;
                    let match;
                    while ((match = regex.exec(html)) !== null) {
                        phones.push(match[0]);
                    }

                    return [...new Set(phones)];
                });

                console.log('Todos los teléfonos de 10 dígitos:');
                allPhones.forEach(p => console.log(`   📞 ${p}`));
            }

        } else {
            console.log('❌ No se encontró botón "Ver teléfono"\n');
            console.log('Buscando teléfonos directamente en el HTML...\n');

            const phones = await page.evaluate(() => {
                const html = document.documentElement.innerHTML;
                const phoneList = [];

                // Buscar teléfonos de Culiacán
                const regex1 = /\b(667|668|669)\d{7}\b/g;
                let match;
                while ((match = regex1.exec(html)) !== null) {
                    phoneList.push(match[0]);
                }

                return [...new Set(phoneList)];
            });

            if (phones.length > 0) {
                console.log('Teléfonos encontrados:');
                phones.forEach(p => console.log(`   📞 ${p}`));
            } else {
                console.log('❌ No se encontraron teléfonos de Culiacán');
            }
        }

        console.log('\n⏳ Mantener navegador abierto 30 segundos para inspección manual...\n');
        await new Promise(r => setTimeout(r, 30000));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await browser.close();
    console.log('\n✅ Proceso completado');
})();
