const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugWiggot(propertyId) {
    console.log('🔍 DEBUG COMPLETO WIGGOT');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    try {
        // Cargar cookies
        const cookiesPath = './wiggot-cookies.json';
        if (fs.existsSync(cookiesPath)) {
            const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
            await page.setCookie(...cookies);
        }

        // Navegar
        const url = `https://new.wiggot.com/search/property-detail/${propertyId}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Esperar 5 segundos
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Verificar login
        const isLogin = await page.evaluate(() => {
            return document.body.innerText.includes('Iniciar sesión');
        });

        if (isLogin) {
            console.log('⚠️  PÁGINA DE LOGIN DETECTADA');
            console.log('🔴 POR FAVOR INICIA SESIÓN MANUALMENTE');
            console.log('⏳ Esperando 90 segundos...');
            await new Promise(resolve => setTimeout(resolve, 90000));

            // Navegar de nuevo
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Guardar screenshot
        await page.screenshot({ path: `wiggot-screenshot-${propertyId}.png`, fullPage: true });
        console.log('✅ Screenshot guardado');

        // Guardar HTML completo
        const html = await page.content();
        fs.writeFileSync(`wiggot-html-${propertyId}.html`, html);
        console.log('✅ HTML completo guardado');

        // Extraer TODO el texto
        const allText = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync(`wiggot-text-${propertyId}.txt`, allText);
        console.log('✅ Texto completo guardado');

        // Actualizar cookies
        const cookies = await page.cookies();
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));

        console.log('\n🎉 DEBUG COMPLETADO - Archivos generados:');
        console.log(`  📸 wiggot-screenshot-${propertyId}.png`);
        console.log(`  📄 wiggot-html-${propertyId}.html`);
        console.log(`  📝 wiggot-text-${propertyId}.txt`);
        console.log('\n⏸️  El navegador permanecerá abierto por 30 segundos más para inspección...');

        await new Promise(resolve => setTimeout(resolve, 30000));
        await browser.close();

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        await browser.close();
        throw error;
    }
}

const propertyId = process.argv[2] || 'pODipRm';
debugWiggot(propertyId)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
