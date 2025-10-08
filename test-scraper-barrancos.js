const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const url = 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-en-inf.-barrancos-146675321.html';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    console.log('🚀 Testeando extracción de m² con nuevo método...\n');

    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    const data = await page.evaluate(() => {
        const result = {
            construction_area: 0,
            land_area: 0,
            bedrooms: 0,
            bathrooms: 0
        };

        const bodyText = document.body.innerText;

        // MÉTODO 1: Buscar patrón "X m² lote Y m² constr" (formato principal Inmuebles24)
        const loteConstruccionMatch = bodyText.match(/(\d+)\s*m²\s*lote\s+(\d+)\s*m²\s*constr/i);
        if (loteConstruccionMatch) {
            result.land_area = parseInt(loteConstruccionMatch[1]);
            result.construction_area = parseInt(loteConstruccionMatch[2]);
            console.log(`   ✅ M² detectados: ${result.land_area}m² lote, ${result.construction_area}m² construcción`);
        }

        // MÉTODO 2 (fallback): Buscar "Mts de terreno X.XX" en descripción
        if (!result.land_area) {
            const terrenoMatch = bodyText.match(/Mts?\s+de\s+terreno\s+([\d.,]+)/i);
            if (terrenoMatch) {
                result.land_area = parseFloat(terrenoMatch[1].replace(',', '.'));
            }
        }

        // MÉTODO 3 (fallback): Buscar "Construcción X" en descripción
        if (!result.construction_area) {
            const construccionMatch = bodyText.match(/Construcción\s+([\d.,]+)/i);
            if (construccionMatch) {
                result.construction_area = parseFloat(construccionMatch[1].replace(',', '.'));
            }
        }

        // Recámaras y baños
        const allTextElements = Array.from(document.querySelectorAll('li, span, div, p')).reverse();
        allTextElements.forEach(el => {
            const text = el.textContent.trim().toLowerCase();
            if (text.length > 100 || el.children.length > 3) return;

            if (!result.bedrooms && (text.match(/(\d+)\s*(recámara|dormitorio)/i))) {
                const match = text.match(/(\d+)\s*(recámara|dormitorio)/i);
                if (match) result.bedrooms = parseInt(match[1]);
            }

            if (!result.bathrooms && text.match(/(\d+)\s*baño/i)) {
                const match = text.match(/(\d+)\s*baño/i);
                if (match) result.bathrooms = parseInt(match[1]);
            }
        });

        return result;
    });

    console.log('\n📊 RESULTADOS DE EXTRACCIÓN:\n');
    console.log(`   🏞️  Terreno: ${data.land_area || 'N/A'}m²`);
    console.log(`   📐 Construcción: ${data.construction_area || 'N/A'}m²`);
    console.log(`   🛏️  Recámaras: ${data.bedrooms || 'N/A'}`);
    console.log(`   🛁 Baños: ${data.bathrooms || 'N/A'}`);

    console.log('\n✅ VALIDACIÓN:');
    console.log(`   Terreno: ${data.land_area === 56 ? '✅ CORRECTO (56m²)' : '❌ INCORRECTO (esperado: 56m², obtenido: ' + data.land_area + 'm²)'}`);
    console.log(`   Construcción: ${data.construction_area === 77 ? '✅ CORRECTO (77m²)' : '❌ INCORRECTO (esperado: 77m², obtenido: ' + data.construction_area + 'm²)'}`);
    console.log(`   Recámaras: ${data.bedrooms === 2 ? '✅ CORRECTO (2)' : '❌ INCORRECTO (esperado: 2, obtenido: ' + data.bedrooms + ')'}`);

    await browser.close();
})();
