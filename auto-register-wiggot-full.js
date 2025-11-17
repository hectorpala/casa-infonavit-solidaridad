const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const axios = require('axios');
const fs = require('fs');

// Función para obtener número temporal de API pública
async function getTempPhone() {
    console.log('📱 Buscando número temporal gratuito...\n');

    // Backup: usar número hardcoded público conocido
    const backupPhones = [
        '+14152386789',
        '+12013547241',
        '+17205929190',
        '+13126414440'
    ];

    const randomPhone = backupPhones[Math.floor(Math.random() * backupPhones.length)];
    console.log('📱 Usando número público:', randomPhone);
    console.log('⚠️  Nota: Este número es público, otros pueden ver los SMS');
    return { phone: randomPhone, service: 'público' };
}

async function autoRegisterWiggotFull() {
    console.log('🤖 REGISTRO AUTOMÁTICO COMPLETO DE WIGGOT\n');
    console.log('='.repeat(50) + '\n');

    const randomStr1 = Math.random().toString(36).substring(7);
    const randomStr2 = Math.random().toString(36).substring(7);
    const email = `wiggot_${randomStr1}@temporary-mail.net`;
    const password = `Wiggot2025!${randomStr2}`;

    console.log('📧 Email generado:', email);
    console.log('🔑 Password generado:', password);

    // Obtener número temporal
    const { phone, service } = await getTempPhone();
    console.log('🌐 Servicio:', service);
    console.log('\n⏳ Iniciando navegador...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox']
    });

    const page = await browser.newPage();

    try {
        // Ir a registro
        await page.goto('https://new.wiggot.com/register', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        console.log('✅ Página cargada\n');
        console.log('🔄 Intentando llenar formulario automáticamente...\n');

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Intentar detectar y llenar campos
        const filled = await page.evaluate((email, password, phone) => {
            try {
                // Buscar campos de email
                const emailInputs = Array.from(document.querySelectorAll('input[type="email"], input[name*="email"], input[placeholder*="email"]'));
                if (emailInputs.length > 0) {
                    emailInputs[0].value = email;
                    emailInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                    emailInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                }

                // Buscar campos de password
                const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
                if (passwordInputs.length > 0) {
                    passwordInputs[0].value = password;
                    passwordInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                    passwordInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                }

                // Buscar campos de teléfono
                const phoneInputs = Array.from(document.querySelectorAll('input[type="tel"], input[name*="phone"], input[placeholder*="phone"], input[placeholder*="Phone"]'));
                if (phoneInputs.length > 0) {
                    phoneInputs[0].value = phone;
                    phoneInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                    phoneInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                }

                return {
                    emailFilled: emailInputs.length > 0,
                    passwordFilled: passwordInputs.length > 0,
                    phoneFilled: phoneInputs.length > 0
                };
            } catch (e) {
                return { error: e.message };
            }
        }, email, password, phone);

        console.log('📋 Auto-llenado:', JSON.stringify(filled, null, 2));

        console.log('\n' + '='.repeat(50));
        console.log('⚠️  VERIFICACIÓN MANUAL REQUERIDA');
        console.log('='.repeat(50));
        console.log('\n📋 Credenciales (ya en los campos):');
        console.log('   Email:', email);
        console.log('   Password:', password);
        console.log('   Phone:', phone);
        console.log('\n👉 PASOS MANUALES:');
        console.log('   1. Verifica campos estén llenos');
        console.log('   2. Acepta términos (checkbox)');
        console.log('   3. Click "Sign Up"');
        console.log('\n🤖 AUTO-DETECCIÓN DE CÓDIGO:');
        console.log('   ✅ Monitoreando receive-smss.com cada 10 seg');
        console.log('   ✅ Completaré el código automáticamente');
        console.log('   ✅ Solo haz click en Sign Up y espera...\n');

        // Función para buscar código en receive-smss
        async function checkForVerificationCode() {
            try {
                const response = await axios.get('https://receive-smss.com/sms/12013547241/');
                const html = response.data;

                // Buscar código de Wiggot (6 dígitos típicamente)
                const codeMatch = html.match(/Wiggot.*?(\d{4,6})/i) ||
                                 html.match(/verification.*?(\d{4,6})/i) ||
                                 html.match(/code.*?(\d{4,6})/i);

                if (codeMatch) {
                    return codeMatch[1];
                }
            } catch (error) {
                // Silencioso
            }
            return null;
        }

        // Monitorear código durante 3 minutos
        console.log('🔍 Iniciando monitoreo de SMS...\n');
        let codeFound = false;
        const maxAttempts = 18; // 3 minutos (18 * 10 seg)

        for (let attempt = 1; attempt <= maxAttempts && !codeFound; attempt++) {
            console.log(`   [${attempt}/${maxAttempts}] Buscando código...`);

            const code = await checkForVerificationCode();

            if (code) {
                console.log(`\n✅ ¡CÓDIGO ENCONTRADO!: ${code}\n`);
                console.log('🤖 Completando código automáticamente...\n');

                // Buscar campo de código y completarlo
                const filled = await page.evaluate((code) => {
                    try {
                        // Buscar inputs de código/verificación
                        const codeInputs = Array.from(document.querySelectorAll(
                            'input[type="text"], input[type="number"], input[name*="code"], input[placeholder*="code"], input[placeholder*="verification"]'
                        ));

                        for (const input of codeInputs) {
                            if (input.value === '' || input.value.length < 6) {
                                input.value = code;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                                return true;
                            }
                        }
                        return false;
                    } catch (e) {
                        return false;
                    }
                }, code);

                if (filled) {
                    console.log('✅ Código completado en el formulario');
                    console.log('🔍 Buscando botón de confirmación...\n');

                    // Buscar y clickear botón de verificar/continuar
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        for (const btn of buttons) {
                            const text = (btn.textContent || '').toLowerCase();
                            if (text.includes('verify') || text.includes('confirm') || text.includes('continue')) {
                                btn.click();
                                return true;
                            }
                        }
                    });

                    console.log('✅ Click en botón de verificación');
                }

                codeFound = true;
            }

            if (!codeFound && attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
            }
        }

        if (!codeFound) {
            console.log('\n⚠️  No se detectó código automáticamente');
            console.log('📱 Verifica manualmente en: https://receive-smss.com/sms/12013547241/');
        }

        // Esperar 2 minutos más para completar registro
        console.log('\n⏸️  Esperando finalización del registro (2 min)...\n');
        await new Promise(resolve => setTimeout(resolve, 120000));

        // Guardar en .env
        console.log('\n💾 Guardando credenciales en .env...');
        let envContent = fs.readFileSync('.env', 'utf8');
        envContent = envContent.replace(/WIGGOT_EMAIL=.*/, `WIGGOT_EMAIL=${email}`);
        envContent = envContent.replace(/WIGGOT_PASSWORD=.*/, `WIGGOT_PASSWORD=${password}`);
        fs.writeFileSync('.env', envContent);

        console.log('✅ Credenciales guardadas en .env');
        console.log('\n🎉 PROCESO COMPLETADO\n');
        console.log('📋 Resumen Final:');
        console.log('   Email:', email);
        console.log('   Password:', password);
        console.log('   Phone:', phone);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\n📋 Usa estos datos manualmente:');
        console.log('   Email:', email);
        console.log('   Password:', password);
        console.log('   Phone:', phone);

        // Guardar de todas formas
        try {
            let envContent = fs.readFileSync('.env', 'utf8');
            envContent = envContent.replace(/WIGGOT_EMAIL=.*/, `WIGGOT_EMAIL=${email}`);
            envContent = envContent.replace(/WIGGOT_PASSWORD=.*/, `WIGGOT_PASSWORD=${password}`);
            fs.writeFileSync('.env', envContent);
            console.log('✅ Credenciales guardadas en .env');
        } catch (e) {
            console.log('⚠️  No se pudo guardar en .env');
        }
    }
}

autoRegisterWiggotFull().catch(console.error);
