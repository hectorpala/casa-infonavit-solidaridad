const puppeteer = require('puppeteer');
const crypto = require('crypto');

(async () => {
    console.log('🚀 SCRIPT AUTOMÁTICO: Obtener teléfono de DAVID GONZALEZ\n');
    console.log('⏱️  Tiempo estimado: 2-3 minutos\n');
    console.log('='.repeat(80) + '\n');

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

    // Remover marcas de automatización
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    try {
        // ============================================
        // PASO 1: Generar email temporal
        // ============================================
        console.log('📧 PASO 1: Generando email temporal...\n');

        const randomString = crypto.randomBytes(8).toString('hex');
        const tempEmail = `casa${randomString}@guerrillamail.com`;
        const tempPassword = `CasaCuliacan${randomString.substring(0, 6)}2025!`;

        console.log(`   ✅ Email generado: ${tempEmail}`);
        console.log(`   ✅ Password generada: ${tempPassword}\n`);

        // ============================================
        // PASO 2: Ir a la propiedad directamente
        // ============================================
        console.log('🏠 PASO 2: Cargando página de la propiedad...\n');

        await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-guadalupe-146847493.html', {
            waitUntil: 'networkidle2',
            timeout: 90000
        });

        console.log('   ✅ Página cargada\n');

        await new Promise(r => setTimeout(r, 3000));

        // ============================================
        // PASO 3: Buscar y hacer clic en "Ver teléfono"
        // ============================================
        console.log('📞 PASO 3: Buscando botón "Ver teléfono"...\n');

        const phoneButtonFound = await page.evaluate(() => {
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

        if (!phoneButtonFound) {
            console.log('   ❌ No se encontró botón "Ver teléfono"\n');
            await browser.close();
            return;
        }

        console.log('   ✅ Botón encontrado y clickeado\n');

        await new Promise(r => setTimeout(r, 2000));

        // ============================================
        // PASO 4: Verificar si requiere login
        // ============================================
        console.log('🔐 PASO 4: Verificando si requiere autenticación...\n');

        const requiresLogin = await page.evaluate(() => {
            // Buscar modal de login o registro
            const loginModal = document.querySelector('[class*="login"]') ||
                              document.querySelector('[class*="registro"]') ||
                              document.querySelector('[class*="auth"]');
            return !!loginModal;
        });

        if (requiresLogin) {
            console.log('   ⚠️  Requiere autenticación. Creando cuenta...\n');

            // ============================================
            // PASO 5: Crear cuenta en Inmuebles24
            // ============================================
            console.log('📝 PASO 5: Registrando cuenta temporal...\n');

            // Buscar formulario de registro
            const registerFormFound = await page.evaluate(() => {
                const registerButtons = Array.from(document.querySelectorAll('button, a'));
                const registerBtn = registerButtons.find(btn => {
                    const text = btn.textContent.toLowerCase();
                    return text.includes('registr') || text.includes('crear cuenta') || text.includes('sign up');
                });

                if (registerBtn) {
                    registerBtn.click();
                    return true;
                }
                return false;
            });

            if (registerFormFound) {
                console.log('   ✅ Formulario de registro encontrado\n');

                await new Promise(r => setTimeout(r, 3000));

                // Llenar formulario de registro
                const registered = await page.evaluate((email, password) => {
                    try {
                        // Buscar campos de email y password
                        const emailInput = document.querySelector('input[type="email"]') ||
                                         document.querySelector('input[name*="email"]') ||
                                         document.querySelector('input[id*="email"]');

                        const passwordInput = document.querySelector('input[type="password"]') ||
                                            document.querySelector('input[name*="password"]') ||
                                            document.querySelector('input[id*="password"]');

                        if (emailInput && passwordInput) {
                            emailInput.value = email;
                            passwordInput.value = password;

                            // Buscar botón de submit
                            const submitButton = document.querySelector('button[type="submit"]') ||
                                               Array.from(document.querySelectorAll('button')).find(btn =>
                                                   btn.textContent.toLowerCase().includes('registr') ||
                                                   btn.textContent.toLowerCase().includes('crear')
                                               );

                            if (submitButton) {
                                submitButton.click();
                                return true;
                            }
                        }
                        return false;
                    } catch(e) {
                        return false;
                    }
                }, tempEmail, tempPassword);

                if (registered) {
                    console.log('   ✅ Formulario enviado. Esperando confirmación...\n');

                    await new Promise(r => setTimeout(r, 5000));

                    // Verificar si el registro fue exitoso
                    const loginSuccessful = await page.evaluate(() => {
                        // Buscar indicadores de login exitoso
                        const userMenu = document.querySelector('[class*="user-menu"]') ||
                                       document.querySelector('[class*="profile"]') ||
                                       document.querySelector('[class*="logged"]');
                        return !!userMenu;
                    });

                    if (loginSuccessful) {
                        console.log('   ✅ Registro exitoso. Cuenta creada y logueada.\n');
                    } else {
                        console.log('   ⚠️  No se pudo confirmar el registro. Continuando...\n');
                    }
                }
            } else {
                console.log('   ❌ No se encontró formulario de registro automático\n');
                console.log('   📋 INSTRUCCIONES MANUALES:\n');
                console.log(`   1. Crea cuenta manualmente en el navegador abierto`);
                console.log(`   2. Usa este email: ${tempEmail}`);
                console.log(`   3. Usa este password: ${tempPassword}`);
                console.log(`   4. Después de crear cuenta, presiona ENTER aquí para continuar...\n`);

                // Esperar que el usuario presione enter
                await new Promise((resolve) => {
                    process.stdin.once('data', () => resolve());
                });
            }

            // ============================================
            // PASO 6: Volver a la propiedad y obtener teléfono
            // ============================================
            console.log('🔄 PASO 6: Volviendo a la propiedad para obtener teléfono...\n');

            await page.goto('https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-guadalupe-146847493.html', {
                waitUntil: 'networkidle2',
                timeout: 90000
            });

            await new Promise(r => setTimeout(r, 3000));

            // Hacer clic nuevamente en "Ver teléfono"
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, a'));
                const phoneBtn = buttons.find(btn => {
                    const text = btn.textContent.toLowerCase();
                    return text.includes('teléfono') || text.includes('telefono');
                });
                if (phoneBtn) phoneBtn.click();
            });

            await new Promise(r => setTimeout(r, 3000));
        }

        // ============================================
        // PASO 7: Extraer teléfono revelado
        // ============================================
        console.log('📞 PASO 7: Extrayendo teléfono de DAVID GONZALEZ...\n');

        const phoneData = await page.evaluate(() => {
            const data = {
                telefono: '',
                textoBoton: '',
                elementosEncontrados: []
            };

            // Buscar en el botón actualizado
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const phoneBtn = buttons.find(btn => {
                const text = btn.textContent.toLowerCase();
                return text.includes('teléfono') || text.includes('telefono') || /\d{3}[\s-]?\d{3}[\s-]?\d{4}/.test(text);
            });

            if (phoneBtn) {
                data.textoBoton = phoneBtn.textContent.trim();

                // Extraer número del texto del botón
                const phoneMatch = data.textoBoton.match(/(\d{3}[\s-]?\d{3}[\s-]?\d{4}|\d{10})/);
                if (phoneMatch) {
                    data.telefono = phoneMatch[0];
                }
            }

            // Buscar en elementos con clase de teléfono
            const phoneElements = document.querySelectorAll('[class*="phone"]:not([class*="blur"])');
            phoneElements.forEach(el => {
                const text = el.textContent.trim();
                const phoneMatch = text.match(/(\d{3}[\s-]?\d{3}[\s-]?\d{4}|\d{10})/);
                if (phoneMatch) {
                    data.elementosEncontrados.push({
                        selector: el.className,
                        phone: phoneMatch[0],
                        text: text.substring(0, 50)
                    });
                }
            });

            // Buscar en TODO el HTML (sin blur)
            const html = document.documentElement.innerHTML;
            const htmlWithoutBlur = html.replace(/phone-blur[^>]*>/g, '');
            const phoneRegex = /\b(667|668|669)\s?\d{3}\s?\d{4}\b/g;
            let match;
            const phonesFound = [];
            while ((match = phoneRegex.exec(htmlWithoutBlur)) !== null) {
                phonesFound.push(match[0]);
            }

            if (phonesFound.length > 0 && !data.telefono) {
                data.telefono = phonesFound[0];
            }

            return data;
        });

        console.log('='.repeat(80));
        console.log('✅ RESULTADOS FINALES:\n');

        if (phoneData.telefono) {
            console.log(`📞 TELÉFONO DE DAVID GONZALEZ: ${phoneData.telefono}\n`);
            console.log(`   Vendedor: DAVID GONZALEZ`);
            console.log(`   Property ID: 146847493`);
            console.log(`   Teléfono: ${phoneData.telefono}`);
        } else {
            console.log(`⚠️  No se pudo extraer el teléfono automáticamente\n`);
            console.log(`Texto del botón: "${phoneData.textoBoton}"\n`);

            if (phoneData.elementosEncontrados.length > 0) {
                console.log('Elementos encontrados:');
                phoneData.elementosEncontrados.forEach((el, i) => {
                    console.log(`   ${i + 1}. ${el.phone} - ${el.text}`);
                });
            }

            console.log('\n📋 INSTRUCCIÓN MANUAL:');
            console.log('   El navegador permanecerá abierto 60 segundos.');
            console.log('   Por favor, busca visualmente el teléfono revelado y cópialo.\n');
        }

        console.log('='.repeat(80) + '\n');
        console.log('⏳ Navegador abierto por 60 segundos para verificación manual...\n');
        console.log(`💾 CREDENCIALES DE LA CUENTA TEMPORAL:\n`);
        console.log(`   Email: ${tempEmail}`);
        console.log(`   Password: ${tempPassword}\n`);

        await new Promise(r => setTimeout(r, 60000));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await browser.close();
    console.log('✅ Proceso completado\n');
})();
