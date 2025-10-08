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
            method1_description: null,
            method2_icons: null,
            method3_text: null,
            method4_structured: null,
            allText: ''
        };

        const bodyText = document.body.innerText;
        result.allText = bodyText;

        // MÉTODO 1: Buscar patrón "X m² lote Y m² constr"
        const loteConstruccionMatch = bodyText.match(/(\d+)\s*m²\s*lote\s+(\d+)\s*m²\s*constr/i);
        if (loteConstruccionMatch) {
            result.method1_description = {
                land: parseInt(loteConstruccionMatch[1]),
                construction: parseInt(loteConstruccionMatch[2])
            };
        }

        // MÉTODO 2: Buscar en icons con clase específica
        const icons = document.querySelectorAll('.icon-feature');
        const iconData = { land: null, construction: null };
        icons.forEach(icon => {
            const text = icon.textContent.trim();
            if (text.includes('m² totales')) {
                const match = text.match(/(\d+)\s*m²/);
                if (match) iconData.land = parseInt(match[1]);
            }
            if (text.includes('m² cubiertos')) {
                const match = text.match(/(\d+)\s*m²/);
                if (match) iconData.construction = parseInt(match[1]);
            }
        });
        if (iconData.land || iconData.construction) {
            result.method2_icons = iconData;
        }

        // MÉTODO 3: Buscar patrón "Casa · XXXm² · X recámaras"
        const casaHeaderMatch = bodyText.match(/Casa\s*·\s*(\d+)m²/i);
        if (casaHeaderMatch) {
            result.method3_text = {
                header_m2: parseInt(casaHeaderMatch[1])
            };
        }

        // MÉTODO 4: Buscar datos estructurados cerca del precio
        // Buscar bloques que contengan "m²"
        const allM2Mentions = [];
        const m2Regex = /(\d+)\s*m²/g;
        let match;
        while ((match = m2Regex.exec(bodyText)) !== null) {
            allM2Mentions.push({
                value: parseInt(match[1]),
                context: bodyText.substring(Math.max(0, match.index - 50), Math.min(bodyText.length, match.index + 100))
            });
        }
        result.method4_structured = allM2Mentions;

        return result;
    });

    console.log('\n========================================');
    console.log('ANÁLISIS DE EXTRACCIÓN DE M²');
    console.log('========================================\n');

    console.log('📍 URL:', url, '\n');

    console.log('🔍 MÉTODO 1 - Patrón "X m² lote Y m² constr":');
    console.log(data.method1_description || '   ❌ No encontrado');

    console.log('\n🔍 MÉTODO 2 - Icons con clase .icon-feature:');
    console.log(data.method2_icons || '   ❌ No encontrado');

    console.log('\n🔍 MÉTODO 3 - Header "Casa · XXXm²":');
    console.log(data.method3_text || '   ❌ No encontrado');

    console.log('\n🔍 MÉTODO 4 - Todas las menciones de m² con contexto:');
    if (data.method4_structured && data.method4_structured.length > 0) {
        data.method4_structured.forEach((mention, i) => {
            console.log(`\n   [${i + 1}] ${mention.value}m²`);
            console.log(`   Contexto: "${mention.context.replace(/\n+/g, ' ')}"`);
        });
    } else {
        console.log('   ❌ No encontrado');
    }

    console.log('\n\n📝 TEXTO COMPLETO (primeros 1000 caracteres):');
    console.log(data.allText.substring(0, 1000).replace(/\n+/g, '\n'));

    await browser.close();
})();
