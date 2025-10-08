#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

const COOKIES_FILE = 'wiggot-cookies.json';

async function interceptAPI(searchUrl) {
    console.log('🚀 Interceptando peticiones API de Wiggot...');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Interceptar peticiones de red
    const apiRequests = [];
    const apiResponses = [];

    await page.setRequestInterception(true);

    page.on('request', request => {
        const url = request.url();

        // Capturar peticiones API
        if (url.includes('api') || url.includes('search') || url.includes('listing') || url.includes('property')) {
            console.log('📡 API Request:', url);
            apiRequests.push({
                url,
                method: request.method(),
                headers: request.headers(),
                postData: request.postData()
            });
        }

        request.continue();
    });

    page.on('response', async response => {
        const url = response.url();

        // Capturar respuestas API
        if (url.includes('api') || url.includes('search') || url.includes('listing') || url.includes('property')) {
            try {
                const contentType = response.headers()['content-type'] || '';
                if (contentType.includes('application/json')) {
                    const data = await response.json();
                    console.log('📥 API Response:', url);
                    apiResponses.push({
                        url,
                        status: response.status(),
                        data
                    });

                    // Guardar respuesta
                    const filename = `api-response-${apiResponses.length}.json`;
                    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
                    console.log(`   💾 Guardado: ${filename}`);
                }
            } catch (e) {
                // Ignorar errores de parsing
            }
        }
    });

    // Cargar cookies
    if (fs.existsSync(COOKIES_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf8'));
        await page.setCookie(...cookies);
        console.log('✅ Cookies cargadas');
    }

    // Navegar
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('✅ Página cargada');

    // Esperar 5 segundos para que haga peticiones
    console.log('⏳ Esperando peticiones API...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Scroll para activar lazy loading
    console.log('📜 Scrolling...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= 2000) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n📊 RESUMEN:');
    console.log(`   Peticiones capturadas: ${apiRequests.length}`);
    console.log(`   Respuestas capturadas: ${apiResponses.length}`);

    if (apiRequests.length > 0) {
        console.log('\n📡 PETICIONES API:');
        apiRequests.forEach((req, i) => {
            console.log(`   ${i + 1}. ${req.method} ${req.url}`);
        });
    }

    if (apiResponses.length > 0) {
        console.log('\n💾 RESPUESTAS GUARDADAS:');
        apiResponses.forEach((res, i) => {
            console.log(`   ${i + 1}. api-response-${i + 1}.json (${res.status})`);
        });

        // Intentar extraer IDs de propiedades de las respuestas
        const propertyIds = new Set();

        apiResponses.forEach(res => {
            const data = res.data;

            // Buscar IDs recursivamente en el objeto
            JSON.stringify(data).matchAll(/"id"\s*:\s*"(p[a-zA-Z0-9]+)"/g).forEach(match => {
                propertyIds.add(match[1]);
            });
        });

        if (propertyIds.size > 0) {
            console.log('\n✅ IDs DE PROPIEDADES ENCONTRADOS:');
            const ids = Array.from(propertyIds);
            console.log(`   Total: ${ids.length} propiedades`);

            console.log('\n📝 URLs para wiggot-urls.txt:');
            console.log('─'.repeat(60));
            ids.forEach(id => {
                console.log(`https://new.wiggot.com/search/property-detail/${id}`);
            });
            console.log('─'.repeat(60));

            // Guardar en archivo
            const urlsList = ids.map(id =>
                `https://new.wiggot.com/search/property-detail/${id}`
            ).join('\n');

            fs.writeFileSync('wiggot-urls-from-api.txt', urlsList);
            console.log('\n💾 URLs guardadas en: wiggot-urls-from-api.txt');
        }
    }

    console.log('\n⏸️  Navegador abierto. Presiona Ctrl+C para cerrar...');
}

const searchUrl = process.argv[2] || 'https://new.wiggot.com/search?priceTo=7000000&priceFrom=6000000&operation=SALE&constructionType=house';
interceptAPI(searchUrl).catch(console.error);
