#!/usr/bin/env node

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

async function inspect(url) {
    console.log('🔍 Inspeccionando estructura HTML...\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreDefaultArgs: ['--enable-automation']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('🌐 Navegando...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    console.log('📊 Extrayendo selectores...\n');

    const data = await page.evaluate(() => {
        const result = {
            title: { selector: '', text: '' },
            price: { selector: '', text: '' },
            location: { selector: '', text: '' },
            features: [],
            images: []
        };

        // Título (h1)
        const h1 = document.querySelector('h1');
        if (h1) {
            result.title.text = h1.textContent.trim();
            result.title.selector = 'h1';
        }

        // Precio - buscar elementos con "MN" o "$"
        const priceElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const text = el.textContent;
            return text.includes('MN') || (text.includes('$') && text.match(/\d{1,3}(,\d{3})+/));
        });

        if (priceElements.length > 0) {
            const priceEl = priceElements.find(el =>
                el.children.length <= 3 && el.textContent.length < 100
            );
            if (priceEl) {
                result.price.text = priceEl.textContent.trim();
                result.price.selector = priceEl.className ? `.${priceEl.className.split(' ')[0]}` : priceEl.tagName.toLowerCase();
            }
        }

        // Ubicación
        const locationKeywords = ['culiacán', 'sinaloa', 'colonia', 'calle'];
        const locationElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const text = el.textContent.toLowerCase();
            return locationKeywords.some(kw => text.includes(kw)) &&
                   el.children.length <= 5 &&
                   text.length > 10 && text.length < 200;
        });

        if (locationElements.length > 0) {
            result.location.text = locationElements[0].textContent.trim();
            result.location.selector = locationElements[0].className ?
                `.${locationElements[0].className.split(' ')[0]}` :
                locationElements[0].tagName.toLowerCase();
        }

        // Características (recámaras, baños, m²)
        const featureElements = Array.from(document.querySelectorAll('[class*="feature"], [class*="amenity"], [class*="characteristic"], li, span')).filter(el => {
            const text = el.textContent.toLowerCase();
            return (text.includes('recámara') || text.includes('baño') || text.includes('m²') ||
                    text.includes('estacionamiento')) && text.length < 100;
        });

        featureElements.slice(0, 10).forEach(el => {
            result.features.push({
                text: el.textContent.trim(),
                selector: el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase()
            });
        });

        // Imágenes
        const images = Array.from(document.querySelectorAll('img')).filter(img => {
            const src = img.src || img.getAttribute('data-src') || '';
            return src.length > 20 && !src.includes('logo') && !src.includes('icon');
        });

        images.slice(0, 5).forEach(img => {
            result.images.push({
                src: img.src.substring(0, 80),
                selector: img.className ? `.${img.className.split(' ')[0]}` : 'img',
                parent: img.parentElement ? img.parentElement.className : ''
            });
        });

        return result;
    });

    console.log('📋 RESULTADOS:\n');
    console.log('TÍTULO:');
    console.log(`  Selector: ${data.title.selector}`);
    console.log(`  Texto: ${data.title.text}\n`);

    console.log('PRECIO:');
    console.log(`  Selector: ${data.price.selector}`);
    console.log(`  Texto: ${data.price.text}\n`);

    console.log('UBICACIÓN:');
    console.log(`  Selector: ${data.location.selector}`);
    console.log(`  Texto: ${data.location.text}\n`);

    console.log('CARACTERÍSTICAS:');
    data.features.forEach((f, i) => {
        console.log(`  ${i + 1}. [${f.selector}] ${f.text}`);
    });

    console.log('\nIMÁGENES:');
    data.images.forEach((img, i) => {
        console.log(`  ${i + 1}. [${img.selector}] ${img.src}...`);
    });

    // Guardar HTML para inspección manual
    const html = await page.content();
    fs.writeFileSync('inmuebles24-page-stealth.html', html, 'utf8');
    console.log('\n💾 HTML guardado: inmuebles24-page-stealth.html');

    await browser.close();
}

const url = process.argv[2] || 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-venta-de-casa-por-calle-mariano-escobedo-centro-de-la-143508352.html';
inspect(url);
