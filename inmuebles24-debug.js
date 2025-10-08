#!/usr/bin/env node

/**
 * Script de debug para inspeccionar estructura HTML de Inmuebles24
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugInmuebles24(url) {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('🌐 Navegando...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Screenshot
    await page.screenshot({ path: 'inmuebles24-screenshot.png', fullPage: true });
    console.log('📸 Screenshot guardado: inmuebles24-screenshot.png');

    // Extraer HTML completo
    const html = await page.content();
    fs.writeFileSync('inmuebles24-page.html', html, 'utf8');
    console.log('📄 HTML guardado: inmuebles24-page.html');

    // Inspeccionar selectores
    const selectors = await page.evaluate(() => {
        const result = {};

        // Buscar h1
        const h1s = Array.from(document.querySelectorAll('h1')).map(el => ({
            text: el.textContent.trim().substring(0, 100),
            class: el.className,
            id: el.id
        }));
        result.h1s = h1s;

        // Buscar precios
        const prices = Array.from(document.querySelectorAll('[class*="price"], [class*="precio"]')).map(el => ({
            text: el.textContent.trim().substring(0, 50),
            class: el.className,
            id: el.id
        }));
        result.prices = prices;

        // Buscar imágenes grandes
        const images = Array.from(document.querySelectorAll('img')).filter(img => {
            const src = img.src || img.getAttribute('data-src') || '';
            return src.includes('http') && img.naturalWidth > 300;
        }).map(img => ({
            src: img.src.substring(0, 100),
            class: img.className,
            width: img.naturalWidth
        }));
        result.images = images.slice(0, 10);

        return result;
    });

    console.log('\n🔍 SELECTORES ENCONTRADOS:\n');
    console.log('H1s:', JSON.stringify(selectors.h1s, null, 2));
    console.log('\nPRECIOS:', JSON.stringify(selectors.prices, null, 2));
    console.log('\nIMAGENES:', JSON.stringify(selectors.images, null, 2));

    fs.writeFileSync('inmuebles24-selectors.json', JSON.stringify(selectors, null, 2));
    console.log('\n💾 Selectores guardados: inmuebles24-selectors.json');

    console.log('\n✅ Debug completado. Presiona Ctrl+C para cerrar el navegador.');
    // No cerrar browser para que puedas inspeccionar manualmente
}

const url = process.argv[2] || 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-venta-de-casa-por-calle-mariano-escobedo-centro-de-la-143508352.html';
debugInmuebles24(url);
