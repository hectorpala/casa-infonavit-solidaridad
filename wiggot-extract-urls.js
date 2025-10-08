#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

const COOKIES_FILE = 'wiggot-cookies.json';

async function extractUrls(searchUrl) {
    console.log('🚀 Extrayendo URLs de:', searchUrl);

    const browser = await puppeteer.launch({
        headless: false,  // Visible para ver qué pasa
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Cargar cookies si existen
    if (fs.existsSync(COOKIES_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf8'));
        await page.setCookie(...cookies);
        console.log('✅ Cookies cargadas');
    }

    // Navegar
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Página cargada');

    // Esperar 10 segundos para que TODO cargue
    console.log('⏳ Esperando 10 segundos...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Hacer scroll
    console.log('📜 Haciendo scroll...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Tomar screenshot
    await page.screenshot({ path: 'wiggot-search-page.png', fullPage: true });
    console.log('📸 Screenshot: wiggot-search-page.png');

    // Guardar HTML
    const html = await page.content();
    fs.writeFileSync('wiggot-search-page.html', html);
    console.log('💾 HTML guardado: wiggot-search-page.html');

    // Intentar extraer URLs con múltiples métodos
    const urls = await page.evaluate(() => {
        const results = {
            method1: [],
            method2: [],
            method3: [],
            method4: []
        };

        // Método 1: Links directos
        document.querySelectorAll('a').forEach(a => {
            if (a.href && a.href.includes('property-detail')) {
                results.method1.push(a.href);
            }
        });

        // Método 2: Onclick
        document.querySelectorAll('[onclick]').forEach(el => {
            const onclick = el.getAttribute('onclick') || '';
            if (onclick.includes('property-detail')) {
                results.method2.push(onclick);
            }
        });

        // Método 3: Data attributes
        document.querySelectorAll('[data-id], [data-property], [data-href]').forEach(el => {
            const attrs = {};
            for (const attr of el.attributes) {
                attrs[attr.name] = attr.value;
            }
            results.method3.push(attrs);
        });

        // Método 4: Regex en innerHTML
        const bodyHtml = document.body.innerHTML;
        const matches = bodyHtml.matchAll(/property-detail\/([a-zA-Z0-9]+)/g);
        for (const match of matches) {
            results.method4.push(match[1]);
        }

        return results;
    });

    console.log('\n📊 RESULTADOS:');
    console.log('Método 1 (links):', urls.method1.length, 'URLs');
    console.log('Método 2 (onclick):', urls.method2.length, 'eventos');
    console.log('Método 3 (data attrs):', urls.method3.length, 'elementos');
    console.log('Método 4 (regex IDs):', urls.method4.length, 'IDs únicos');

    if (urls.method4.length > 0) {
        const uniqueIds = [...new Set(urls.method4)];
        console.log('\n✅ IDs encontrados:', uniqueIds.length);
        console.log('\n📝 URLs para wiggot-urls.txt:');
        console.log('─'.repeat(60));
        uniqueIds.forEach(id => {
            console.log(`https://new.wiggot.com/search/property-detail/${id}`);
        });
        console.log('─'.repeat(60));

        // Guardar en archivo
        const urlsList = uniqueIds.map(id =>
            `https://new.wiggot.com/search/property-detail/${id}`
        ).join('\n');

        fs.writeFileSync('wiggot-urls-extracted.txt', urlsList);
        console.log('\n💾 URLs guardadas en: wiggot-urls-extracted.txt');
    }

    console.log('\n⏸️  Navegador abierto. Presiona Ctrl+C para cerrar...');

    // No cerrar automáticamente para inspeccionar
    // await browser.close();
}

const searchUrl = process.argv[2] || 'https://new.wiggot.com/search?priceTo=7000000&priceFrom=6000000&operation=SALE&constructionType=house';
extractUrls(searchUrl).catch(console.error);
