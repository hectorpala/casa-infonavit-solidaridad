/**
 * Script de diagnóstico para investigar por qué se captura 3 recámaras en vez de 2
 * en Real del Valle Coto 14
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const URL = 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-de-real-del-valle-coto-14-147303199.html';

async function debugRecamaras() {
    console.log('🔍 Iniciando diagnóstico de recámaras...\n');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('🌐 Navegando a la página...');
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click en "Leer más"
    console.log('📝 Expandiendo descripción...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, span[role="button"]'));
        const expandBtn = buttons.find(btn => btn.textContent.toLowerCase().includes('leer más'));
        if (expandBtn) expandBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Capturar TODOS los elementos que mencionen "recámara"
    console.log('\n📊 Buscando TODOS los elementos que mencionen "recámara"...\n');

    const elements = await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const results = [];

        allElements.forEach((el, idx) => {
            const text = el.textContent?.trim().toLowerCase() || '';

            if (text.match(/\d+\s*(recámara|dormitorio)/i)) {
                const match = text.match(/(\d+)\s*(recámara|dormitorio)/i);
                if (match) {
                    // Obtener info del elemento
                    const tagName = el.tagName.toLowerCase();
                    const className = el.className || '';
                    const id = el.id || '';
                    const textLength = text.length;
                    const hasIcon = !!(el.querySelector('svg, i, img[class*="icon"]') ||
                                      el.parentElement?.querySelector('svg, i, img[class*="icon"]'));
                    const childrenCount = el.children.length;

                    results.push({
                        index: idx,
                        numero: match[1],
                        tagName,
                        className: className.toString().substring(0, 50),
                        id,
                        textLength,
                        hasIcon,
                        childrenCount,
                        textPreview: text.substring(0, 100),
                        innerHTML: el.innerHTML.substring(0, 200)
                    });
                }
            }
        });

        return results;
    });

    console.log(`✅ Encontrados ${elements.length} elementos con mención de recámaras:\n`);

    elements.forEach((el, i) => {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Elemento ${i + 1}/${elements.length}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🔢 Número capturado:  ${el.numero} recámaras`);
        console.log(`📌 Tag:               <${el.tagName}>`);
        console.log(`🏷️  Class:             ${el.className || '(ninguna)'}`);
        console.log(`🆔 ID:                ${el.id || '(ninguno)'}`);
        console.log(`📏 Longitud texto:    ${el.textLength} caracteres`);
        console.log(`🖼️  Tiene ícono:       ${el.hasIcon ? '✅ SÍ' : '❌ NO'}`);
        console.log(`👶 Hijos:             ${el.childrenCount}`);
        console.log(`📝 Preview texto:     "${el.textPreview}"`);
        console.log(`🔧 HTML:              ${el.innerHTML.substring(0, 100)}...`);
        console.log('');
    });

    // Análisis de cuál sería capturado por el scraper actual
    console.log('\n🤖 ANÁLISIS DEL SCRAPER ACTUAL:\n');

    const filtered = await page.evaluate((elements) => {
        // Aplicar los mismos filtros que el scraper ACTUALIZADO
        return elements.filter((el, idx) => {
            const passesLengthFilter = el.textLength <= 50;
            const passesChildrenFilter = el.childrenCount <= 3;

            // Obtener el elemento real del DOM para verificar href
            const domElement = document.querySelectorAll('*')[el.index];

            // Filtro anti-menú
            const isMenuLink = domElement.tagName === 'A' && domElement.href &&
                              (domElement.href.includes('/inmuebles-en-venta-con-') ||
                               domElement.href.includes('/inmuebles-en-renta-con-'));

            const hasMenuLinkChild = !!domElement.querySelector('a[href*="/inmuebles-en-venta-con-"], a[href*="/inmuebles-en-renta-con-"]');

            if (isMenuLink || hasMenuLinkChild) return false;

            const passesIconFilter = el.hasIcon || el.textLength <= 20;

            return passesLengthFilter && passesChildrenFilter && passesIconFilter;
        });
    }, elements);

    console.log(`📊 Elementos que PASAN los filtros: ${filtered.length}/${elements.length}\n`);

    if (filtered.length > 0) {
        console.log('Elementos que el scraper TOMARÍA EN CUENTA:\n');
        filtered.forEach((el, i) => {
            console.log(`   ${i + 1}. ${el.numero} recámaras (${el.tagName}, ${el.textLength} chars, ícono: ${el.hasIcon ? 'SÍ' : 'NO'})`);
        });

        console.log(`\n🎯 VALOR FINAL (último en orden reverso): ${filtered[filtered.length - 1].numero} recámaras\n`);
    } else {
        console.log('⚠️  NINGÚN elemento pasa los filtros actuales!\n');
    }

    await browser.close();
}

debugRecamaras().catch(console.error);
