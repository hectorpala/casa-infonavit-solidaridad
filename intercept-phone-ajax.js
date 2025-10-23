const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Interceptando peticiones AJAX para capturar teléfono...\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080'
        ]
    });

    const page = await browser.newPage();

    // User agent real
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Interceptar TODAS las peticiones de red
    const capturedResponses = [];

    page.on('response', async (response) => {
        const url = response.url();

        // Capturar respuestas que podrían contener el teléfono
        if (url.includes('phone') || url.includes('contact') || url.includes('publisher') || url.includes('api')) {
            try {
                const contentType = response.headers()['content-type'] || '';
                if (contentType.includes('json') || contentType.includes('text')) {
                    const body = await response.text();

                    // Buscar teléfonos en la respuesta
                    const phoneMatches = body.match(/(\d{10})/g);

                    if (phoneMatches || body.toLowerCase().includes('phone') || body.toLowerCase().includes('telefono')) {
                        capturedResponses.push({
                            url: url,
                            body: body.substring(0, 500),
                            phones: phoneMatches ? [...new Set(phoneMatches)] : []
                        });

                        console.log('📡 Capturada respuesta AJAX:');
                        console.log(`   URL: ${url}`);
                        console.log(`   Teléfonos encontrados: ${phoneMatches ? phoneMatches.join(', ') : 'ninguno'}`);
                        console.log(`   Body (preview): ${body.substring(0, 200)}...\n`);
                    }
                }
            } catch (e) {
                // Ignorar errores de parsing
            }
        }
    });

    console.log('🌐 Cargando página...\n');

    try {
        await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-guadalupe-146847493.html', {
            waitUntil: 'networkidle0',
            timeout: 90000
        });

        console.log('⏳ Esperando 5 segundos iniciales...\n');
        await new Promise(r => setTimeout(r, 5000));

        // Buscar y hacer clic en el botón "Ver teléfono"
        console.log('🔍 Buscando botón "Ver teléfono"...\n');

        const buttonFound = await page.evaluate(() => {
            const allButtons = Array.from(document.querySelectorAll('button, a'));
            const phoneBtn = allButtons.find(btn => {
                const text = btn.textContent.toLowerCase();
                return text.includes('teléfono') || text.includes('telefono') || text.includes('ver tel');
            });

            if (phoneBtn) {
                console.log('✅ Botón encontrado:', phoneBtn.textContent.trim());
                phoneBtn.click();
                return true;
            }
            return false;
        });

        if (buttonFound) {
            console.log('👆 Clic realizado. Esperando respuesta AJAX...\n');

            // Esperar 10 segundos para que lleguen las respuestas AJAX
            await new Promise(r => setTimeout(r, 10000));

            // Extraer teléfono después del clic
            const phoneData = await page.evaluate(() => {
                const data = {
                    textoBoton: '',
                    telefonosEnPagina: [],
                    elementosConTelefono: []
                };

                // Buscar botón actualizado
                const allButtons = Array.from(document.querySelectorAll('button, a'));
                const phoneBtn = allButtons.find(btn => {
                    const text = btn.textContent.toLowerCase();
                    return text.includes('teléfono') || text.includes('telefono') || /\d{3}[\s-]?\d{3}[\s-]?\d{4}/.test(text);
                });

                if (phoneBtn) {
                    data.textoBoton = phoneBtn.textContent.trim();
                }

                // Buscar teléfonos en elementos específicos
                const phoneSelectors = [
                    '[class*="phone"]',
                    '[class*="contact"]',
                    '[class*="publisher"]',
                    'a[href*="tel:"]',
                    'span', 'div', 'p'
                ];

                phoneSelectors.forEach(sel => {
                    try {
                        const elements = document.querySelectorAll(sel);
                        elements.forEach(el => {
                            const text = el.textContent.trim();
                            // Buscar patrón de teléfono mexicano
                            const phoneMatch = text.match(/(\d{3}[\s-]?\d{3}[\s-]?\d{4}|\d{10})/);
                            if (phoneMatch) {
                                data.elementosConTelefono.push({
                                    selector: sel,
                                    text: text.substring(0, 100),
                                    phone: phoneMatch[0]
                                });
                            }
                        });
                    } catch(e) {}
                });

                // Buscar en TODO el HTML
                const html = document.documentElement.innerHTML;
                const phoneRegex = /\b(667|668|669|81|33|55)\d{7,8}\b/g;
                let match;
                while ((match = phoneRegex.exec(html)) !== null) {
                    data.telefonosEnPagina.push(match[0]);
                }

                return data;
            });

            console.log('='.repeat(80));
            console.log('📞 RESULTADOS:\n');

            console.log('1️⃣ TEXTO DEL BOTÓN DESPUÉS DE CLIC:');
            console.log(`   "${phoneData.textoBoton}"\n`);

            console.log('2️⃣ ELEMENTOS CON TELÉFONO:');
            if (phoneData.elementosConTelefono.length > 0) {
                phoneData.elementosConTelefono.forEach((el, i) => {
                    console.log(`   ${i + 1}. [${el.selector}] ${el.phone}`);
                    console.log(`      Texto: ${el.text}\n`);
                });
            } else {
                console.log('   ❌ Ninguno encontrado\n');
            }

            console.log('3️⃣ TELÉFONOS EN HTML:');
            const uniquePhones = [...new Set(phoneData.telefonosEnPagina)];
            if (uniquePhones.length > 0) {
                uniquePhones.forEach(p => console.log(`   📞 ${p}`));
            } else {
                console.log('   ❌ Ninguno encontrado');
            }

            console.log('\n4️⃣ PETICIONES AJAX CAPTURADAS:');
            if (capturedResponses.length > 0) {
                capturedResponses.forEach((resp, i) => {
                    console.log(`\n   ${i + 1}. ${resp.url}`);
                    console.log(`      Teléfonos: ${resp.phones.join(', ') || 'ninguno'}`);
                    console.log(`      Body: ${resp.body.substring(0, 150)}...`);
                });
            } else {
                console.log('   ⚠️  Ninguna petición AJAX capturada');
            }

            console.log('\n' + '='.repeat(80));
        } else {
            console.log('❌ No se encontró botón "Ver teléfono"\n');
        }

        console.log('\n⏳ Mantener navegador abierto 30 segundos para inspección manual...\n');
        await new Promise(r => setTimeout(r, 30000));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await browser.close();
    console.log('✅ Proceso completado\n');
})();
