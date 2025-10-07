#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getAllPhotos() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Login
    await page.goto('https://new.wiggot.com/search/property-detail/pbglmJT');
    await wait(5000);

    const inputs = await page.$$('input');
    await inputs[0].type('hector.test.1759769906975@gmail.com');
    await inputs[1].type('Wiggot2025!drm36');
    await wait(1000);

    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.includes('Iniciar')) {
            await btn.click();
            break;
        }
    }

    await wait(10000);

    // Navegar a la propiedad
    await page.goto('https://new.wiggot.com/search/property-detail/pbglmJT');
    await wait(5000);

    // Scroll masivo
    for (let i = 0; i < 20; i++) {
        await page.evaluate(() => window.scrollBy(0, 300));
        await wait(1000);
    }

    await wait(10000);

    // Extraer TODAS las URLs de fotos
    const photos = await page.evaluate(() => {
        const urls = new Set();

        // Buscar en img tags
        document.querySelectorAll('img').forEach(img => {
            if (img.src && img.src.includes('media.wiggot.mx') && img.src.includes('-l.jpg')) {
                urls.add(img.src);
            }
        });

        // Buscar en style background-image
        document.querySelectorAll('[style*="background-image"]').forEach(el => {
            const style = el.getAttribute('style') || '';
            const match = style.match(/url\(['"]?(https:\/\/media\.wiggot\.mx\/[^'")\s]+)/);
            if (match && match[1].includes('-l.jpg')) {
                urls.add(match[1]);
            }
        });

        return Array.from(urls);
    });

    console.log(`✅ Fotos encontradas: ${photos.length}\n`);
    photos.forEach((url, i) => {
        console.log(`${i + 1}. ${url}`);
    });

    // Guardar JSON
    const jsonData = {
        propertyId: 'pbglmJT',
        totalPhotos: photos.length,
        images: photos
    };

    fs.writeFileSync('photos-pbglmJT.json', JSON.stringify(jsonData, null, 2));
    console.log(`\n✅ Guardado en photos-pbglmJT.json`);

    await wait(10000);
    await browser.close();
}

getAllPhotos();
