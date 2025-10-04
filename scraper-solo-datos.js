#!/usr/bin/env node
/**
 * SCRAPER PASO 1: SOLO EXTRAE DATOS (NO GENERA HTML)
 *
 * Uso:
 *   node scraper-solo-datos.js "URL"
 *
 * Output:
 *   - scraped-data/[slug]-data.json (datos)
 *   - images/[slug]/foto-X.jpg (fotos descargadas)
 *
 * Después ejecutar:
 *   node generar-desde-json.js scraped-data/[slug]-data.json
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Detectar sitio
function detectarSitio(url) {
    if (url.includes('propiedades.com')) return 'propiedades.com';
    if (url.includes('inmuebles24.com')) return 'inmuebles24.com';
    throw new Error('❌ Sitio no soportado. Solo propiedades.com o inmuebles24.com');
}

// Scraper propiedades.com (simplificado)
async function scrapePropiedadesCom(url, browser, page) {
    console.log('🔍 Scrapeando propiedades.com...');

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const data = await page.evaluate(() => {
        const getText = (selector) => document.querySelector(selector)?.textContent?.trim() || '';

        return {
            title: getText('h1'),
            price: getText('[class*="price"]'),
            location: getText('[class*="location"], [class*="address"]'),
            bedrooms: getText('[class*="bedroom"]').match(/\d+/)?.[0] || 0,
            bathrooms: getText('[class*="bathroom"]').match(/\d+/)?.[0] || 0,
            area: getText('[class*="area"], [class*="superficie"]').match(/\d+/)?.[0] || 0,
            description: getText('[class*="description"]'),
        };
    });

    // Extraer fotos
    const photos = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
            .map(img => img.src)
            .filter(src => src.includes('http') && !src.includes('logo') && !src.includes('icon'));
    });

    return { ...data, photos: [...new Set(photos)] };
}

// Scraper inmuebles24.com (simplificado)
async function scrapeInmuebles24(url, browser, page) {
    console.log('🔍 Scrapeando inmuebles24.com...');

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const data = await page.evaluate(() => {
        const getText = (selector) => document.querySelector(selector)?.textContent?.trim() || '';

        // Bing tracker metadata
        const bingImg = Array.from(document.querySelectorAll('img')).find(img =>
            img.src && img.src.includes('bat.bing.com')
        );

        let bedrooms = 0, bathrooms = 0, area = 0;

        if (bingImg) {
            const keywords = new URLSearchParams(bingImg.src.split('?')[1]).get('kw') || '';
            const bedroomsMatch = keywords.match(/Recámaras?\s+(\d+)/i);
            const fullBathsMatch = keywords.match(/Baños?\s+(\d+)/i);
            const halfBathsMatch = keywords.match(/Medios?\s+baños?\s+(\d+)/i);
            const areaMatch = keywords.match(/Construidos?\s+(\d+)/i);

            bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : 0;
            bathrooms = (fullBathsMatch ? parseInt(fullBathsMatch[1]) : 0) +
                       (halfBathsMatch ? parseInt(halfBathsMatch[1]) * 0.5 : 0);
            area = areaMatch ? parseInt(areaMatch[1]) : 0;
        }

        return {
            title: getText('h1'),
            price: getText('[class*="price"]'),
            location: getText('[class*="location"], [class*="address"]'),
            bedrooms,
            bathrooms,
            area,
            description: getText('[class*="description"]'),
        };
    });

    // Extraer fotos
    const photos = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
            .map(img => img.src)
            .filter(src => src.includes('http') && !src.includes('logo') && !src.includes('bat.bing'));
    });

    return { ...data, photos: [...new Set(photos)] };
}

// Descargar foto
async function downloadPhoto(url, filepath, page) {
    try {
        const viewSource = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const buffer = await viewSource.buffer();
        fs.writeFileSync(filepath, buffer);
        return true;
    } catch (e) {
        return false;
    }
}

// MAIN
(async () => {
    const url = process.argv[2];

    if (!url) {
        console.error('❌ Proporciona una URL');
        console.log('\nUso: node scraper-solo-datos.js "URL"\n');
        process.exit(1);
    }

    console.log('🚀 SCRAPER - SOLO DATOS (PASO 1/2)\n');

    const sitio = detectarSitio(url);
    console.log(`📍 Sitio detectado: ${sitio}\n`);

    // Launch browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Scrapear según sitio
    let data;
    if (sitio === 'propiedades.com') {
        data = await scrapePropiedadesCom(url, browser, page);
    } else {
        data = await scrapeInmuebles24(url, browser, page);
    }

    console.log('\n✅ Datos scrapeados:');
    console.log(`   Título: ${data.title}`);
    console.log(`   Precio: ${data.price}`);
    console.log(`   Ubicación: ${data.location}`);
    console.log(`   Recámaras: ${data.bedrooms}`);
    console.log(`   Baños: ${data.bathrooms}`);
    console.log(`   Área: ${data.area}m²`);
    console.log(`   Fotos: ${data.photos.length}\n`);

    // Crear slug
    const slugBase = (data.location || data.title || 'propiedad')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .substring(0, 30);

    const randomId = Date.now().toString().slice(-6);
    const slug = `casa-venta-${slugBase}-${randomId}`;

    // Detectar tipo
    const esRenta = url.includes('-renta-') || url.includes('/renta/');
    data.tipo = esRenta ? 'RENTA' : 'VENTA';
    data.slug = slug;
    data.url = url;
    data.sitio = sitio;

    // Crear directorios
    const scrapedDir = 'scraped-data';
    const imagesDir = `images/${slug}`;

    if (!fs.existsSync(scrapedDir)) fs.mkdirSync(scrapedDir);
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    // Descargar fotos
    console.log(`📸 Descargando ${data.photos.length} fotos...\n`);
    const fotosDescargadas = [];

    for (let i = 0; i < data.photos.length; i++) {
        const fotoPath = path.join(imagesDir, `foto-${i + 1}.jpg`);
        const success = await downloadPhoto(data.photos[i], fotoPath, page);

        if (success) {
            console.log(`   ✅ foto-${i + 1}.jpg`);
            fotosDescargadas.push(`foto-${i + 1}.jpg`);
        } else {
            console.log(`   ❌ Error descargando foto-${i + 1}.jpg`);
        }
    }

    await browser.close();

    // Filtrar fotos pequeñas (< 30KB)
    console.log(`\n🧹 Filtrando fotos pequeñas...`);
    const fotosReales = fotosDescargadas.filter(foto => {
        const stats = fs.statSync(path.join(imagesDir, foto));
        if (stats.size < 30000) {
            fs.unlinkSync(path.join(imagesDir, foto));
            return false;
        }
        return true;
    });

    console.log(`   ✅ ${fotosReales.length} fotos reales guardadas\n`);

    // Actualizar data
    data.photoCount = fotosReales.length;
    data.photos = fotosReales;

    // Guardar JSON
    const jsonFile = path.join(scrapedDir, `${slug}-data.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));

    console.log('═══════════════════════════════════════════════════════\n');
    console.log('✅ PASO 1 COMPLETADO - DATOS GUARDADOS\n');
    console.log(`📁 Archivo JSON: ${jsonFile}`);
    console.log(`📁 Fotos: ${imagesDir}/ (${fotosReales.length} fotos)\n`);
    console.log('📝 SIGUIENTE PASO:\n');
    console.log(`   1. Revisa/edita el JSON si es necesario`);
    console.log(`   2. Ejecuta: node generar-desde-json.js ${jsonFile}\n`);
    console.log('═══════════════════════════════════════════════════════\n');

})();
