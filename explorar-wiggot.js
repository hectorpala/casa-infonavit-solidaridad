const puppeteer = require('puppeteer');
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const WIGGOT_EMAIL = 'hector.test.1759769906975@gmail.com';
const WIGGOT_PASSWORD = 'Wiggot2025!drm36';

(async () => {
    console.log('\n🔍 EXPLORADOR WIGGOT - Búsqueda Interactiva\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--start-maximized']
    });

    const page = await browser.newPage();

    // Login
    console.log('🔐 Haciendo login...');
    await page.goto('https://new.wiggot.com/search');
    await wait(5000);

    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
        await inputs[0].click();
        await page.keyboard.type(WIGGOT_EMAIL, { delay: 50 });
        await inputs[1].click();
        await page.keyboard.type(WIGGOT_PASSWORD, { delay: 50 });

        const buttons = await page.$$('button');
        for (const button of buttons) {
            const text = await page.evaluate(el => el.innerText, button);
            if (text.includes('Iniciar')) {
                await button.click();
                break;
            }
        }

        await wait(10000);
        console.log('✅ Login exitoso\n');
    }

    // Esperar búsqueda manual
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 INSTRUCCIONES:');
    console.log('1. Usa la interfaz de Wiggot para hacer tu búsqueda');
    console.log('2. Filtra por: Casas en venta, Culiacán, hasta $6M');
    console.log('3. Espera a que carguen los resultados');
    console.log('4. El navegador se cerrará automáticamente en 60 segundos');
    console.log('5. La URL con resultados se mostrará en consola');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Monitorear URL cada 5 segundos
    let lastUrl = '';
    const monitor = setInterval(async () => {
        const currentUrl = page.url();
        if (currentUrl !== lastUrl && currentUrl.includes('search')) {
            lastUrl = currentUrl;
            console.log(`🔗 URL actual: ${currentUrl}\n`);

            // Verificar si hay resultados
            const hasResults = await page.evaluate(() => {
                const links = document.querySelectorAll('a[href*="property-detail"]');
                return links.length > 0;
            });

            if (hasResults) {
                const count = await page.evaluate(() => {
                    return document.querySelectorAll('a[href*="property-detail"]').length;
                });
                console.log(`✅ ¡Encontrados ${count} resultados!`);
                console.log(`📋 Usa esta URL para batch scraper:\n`);
                console.log(`node batch-wiggot-auto.js "${currentUrl}"\n`);
            }
        }
    }, 5000);

    // Esperar 60 segundos
    await wait(60000);

    clearInterval(monitor);
    console.log('\n⏰ Tiempo agotado. Cerrando navegador...');
    await browser.close();
})();
