const puppeteer = require('puppeteer');

(async () => {
    console.log('🤖 Script para llenar formulario automáticamente\n');

    // Conectar al navegador ya abierto
    const browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: null
    });

    const pages = await browser.pages();
    const page = pages[pages.length - 1]; // Última página abierta

    console.log('📸 Tomando captura del modal...\n');

    // Tomar screenshot
    await page.screenshot({ path: 'modal-registro.png', fullPage: false });
    console.log('✅ Captura guardada en: modal-registro.png\n');

    // Analizar el formulario
    console.log('🔍 Analizando campos del formulario...\n');

    const formData = await page.evaluate(() => {
        const data = {
            inputs: [],
            buttons: [],
            checkboxes: []
        };

        // Buscar todos los inputs
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="tel"]'));
        inputs.forEach(input => {
            data.inputs.push({
                type: input.type,
                name: input.name || '',
                id: input.id || '',
                placeholder: input.placeholder || '',
                className: input.className
            });
        });

        // Buscar checkboxes
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        checkboxes.forEach(cb => {
            data.checkboxes.push({
                name: cb.name || '',
                id: cb.id || '',
                required: cb.required
            });
        });

        // Buscar botones
        const buttons = Array.from(document.querySelectorAll('button[type="submit"], button'));
        buttons.forEach(btn => {
            const text = btn.textContent.trim().toLowerCase();
            if (text.includes('registr') || text.includes('crear') || text.includes('continuar')) {
                data.buttons.push({
                    text: btn.textContent.trim(),
                    className: btn.className,
                    type: btn.type
                });
            }
        });

        return data;
    });

    console.log('📋 Campos encontrados:\n');
    console.log('Inputs:', JSON.stringify(formData.inputs, null, 2));
    console.log('\nCheckboxes:', JSON.stringify(formData.checkboxes, null, 2));
    console.log('\nBotones:', JSON.stringify(formData.buttons, null, 2));

    // Llenar el formulario automáticamente
    console.log('\n✍️  Llenando formulario automáticamente...\n');

    const filled = await page.evaluate((email, password) => {
        const results = { success: false, steps: [] };

        try {
            // Buscar campo de email
            const emailInput = document.querySelector('input[type="email"]') ||
                             document.querySelector('input[name*="email" i]') ||
                             document.querySelector('input[placeholder*="email" i]') ||
                             document.querySelector('input[id*="email" i]');

            if (emailInput) {
                emailInput.value = email;
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                results.steps.push('✅ Email llenado');
            } else {
                results.steps.push('❌ No se encontró campo de email');
            }

            // Buscar campo de password
            const passwordInput = document.querySelector('input[type="password"]') ||
                                document.querySelector('input[name*="password" i]') ||
                                document.querySelector('input[id*="password" i]');

            if (passwordInput) {
                passwordInput.value = password;
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                results.steps.push('✅ Password llenado');
            } else {
                results.steps.push('❌ No se encontró campo de password');
            }

            // Buscar campo de nombre (si existe)
            const nameInput = document.querySelector('input[name*="name" i]') ||
                            document.querySelector('input[name*="nombre" i]') ||
                            document.querySelector('input[placeholder*="nombre" i]') ||
                            document.querySelector('input[id*="name" i]');

            if (nameInput) {
                nameInput.value = 'Juan Pérez';
                nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                nameInput.dispatchEvent(new Event('change', { bubbles: true }));
                results.steps.push('✅ Nombre llenado');
            }

            // Buscar campo de teléfono (si existe)
            const phoneInput = document.querySelector('input[type="tel"]') ||
                             document.querySelector('input[name*="phone" i]') ||
                             document.querySelector('input[name*="telefono" i]') ||
                             document.querySelector('input[placeholder*="teléfono" i]');

            if (phoneInput) {
                phoneInput.value = '6671234567';
                phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
                phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
                results.steps.push('✅ Teléfono llenado');
            }

            // Aceptar términos y condiciones
            const checkbox = document.querySelector('input[type="checkbox"]');
            if (checkbox && !checkbox.checked) {
                checkbox.click();
                results.steps.push('✅ Términos aceptados');
            }

            results.success = true;
            return results;

        } catch (e) {
            results.steps.push(`❌ Error: ${e.message}`);
            return results;
        }
    }, 'casae15eba2fc0c9cc66@guerrillamail.com', 'CasaCuliacane15eba2025!');

    console.log('Resultados:');
    filled.steps.forEach(step => console.log(`   ${step}`));

    if (filled.success) {
        console.log('\n✅ Formulario llenado correctamente');
        console.log('\n🎯 Ahora puedes hacer clic en el botón de "Registrarse" en el navegador');
        console.log('   O presiona ENTER aquí y yo lo haré automáticamente...\n');

        // Esperar ENTER
        await new Promise((resolve) => {
            process.stdin.once('data', () => resolve());
        });

        // Click en botón de registro
        console.log('👆 Haciendo clic en botón de registro...\n');

        const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const submitBtn = buttons.find(btn => {
                const text = btn.textContent.toLowerCase();
                return text.includes('registr') || text.includes('crear') || text.includes('continuar') || text.includes('enviar');
            });

            if (submitBtn) {
                submitBtn.click();
                return true;
            }
            return false;
        });

        if (clicked) {
            console.log('✅ Clic realizado. Esperando respuesta...\n');
            await new Promise(r => setTimeout(r, 5000));

            // Verificar si el registro fue exitoso
            const loggedIn = await page.evaluate(() => {
                // Buscar indicadores de login exitoso
                const userMenu = document.querySelector('[class*="user"]') ||
                               document.querySelector('[class*="profile"]') ||
                               document.querySelector('[class*="cuenta"]');
                return !!userMenu;
            });

            if (loggedIn) {
                console.log('✅ ¡Registro exitoso! Cuenta creada y logueada.\n');
            } else {
                console.log('⚠️  No se pudo confirmar el login. Verifica manualmente.\n');
            }
        } else {
            console.log('❌ No se encontró botón de submit\n');
        }
    }

    await browser.disconnect();
    console.log('✅ Script completado\n');
})();
