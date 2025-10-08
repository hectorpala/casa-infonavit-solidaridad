const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const url = 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-en-inf.-barrancos-146675321.html';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    const data = await page.evaluate(() => {
        const result = {
            m2Terreno: null,
            m2Construccion: null,
            telefono: null
        };

        // Buscar m² en descripción
        const bodyText = document.body.innerText;
        console.log('=== TEXTO COMPLETO (primeros 2000 caracteres) ===');
        console.log(bodyText.substring(0, 2000));

        // Buscar m² terreno
        const terrenoMatch = bodyText.match(/Mts?\s+de\s+terreno\s+([\d.,]+)/i);
        if (terrenoMatch) result.m2Terreno = terrenoMatch[1];

        // Buscar m² construcción
        const construccionMatch = bodyText.match(/Construcci[oó]n\s+([\d.,]+)/i);
        if (construccionMatch) result.m2Construccion = construccionMatch[1];

        // Buscar teléfono en HTML
        const html = document.documentElement.innerHTML;
        const phoneMatch = html.match(/(66[67]\d{7})/);
        if (phoneMatch) result.telefono = phoneMatch[1];

        return result;
    });

    console.log('\n=== DATOS ENCONTRADOS ===');
    console.log('m² Terreno:', data.m2Terreno);
    console.log('m² Construcción:', data.m2Construccion);
    console.log('Teléfono:', data.telefono);

    await browser.close();
})();
