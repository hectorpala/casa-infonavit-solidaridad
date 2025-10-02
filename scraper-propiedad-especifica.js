#!/usr/bin/env node
/**
 * Scraper para una propiedad específica + conversión a PropertyPageGenerator
 * Descarga fotos, extrae datos, genera página automáticamente
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');
const PropertyPageGenerator = require('./automation/property-page-generator');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    bright: '\x1b[1m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

// URL de la propiedad
const propertyURL = process.argv[2] || 'https://propiedades.com/inmuebles/casa-en-venta-culiacan-sinaloa-sn-la-conquista-sinaloa-30395849#remates=2&pagina=1&tipos=residencial-venta&area=culiacan&pos=24';

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        protocol.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

async function scrapeProperty() {
    log('\n╔═══════════════════════════════════════════════════════╗', 'bright');
    log('║   🕷️  Scraper + PropertyPageGenerator Automático    ║', 'bright');
    log('╚═══════════════════════════════════════════════════════╝\n', 'bright');

    log(`🌐 URL: ${propertyURL}\n`, 'cyan');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        log('📍 Paso 1: Navegando a la propiedad...', 'yellow');
        await page.goto(propertyURL, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: 'propiedad-screenshot.png' });
        log('✅ Página cargada', 'green');

        log('\n📊 Paso 2: Extrayendo datos...', 'yellow');

        const propertyData = await page.evaluate(() => {
            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.textContent.trim() : null;
            };

            const getAll = (selector) => {
                return Array.from(document.querySelectorAll(selector)).map(el => el.textContent.trim());
            };

            const getImages = () => {
                const imgs = document.querySelectorAll('img[src*="http"], img[data-src*="http"]');
                return Array.from(imgs)
                    .map(img => img.src || img.getAttribute('data-src'))
                    .filter(src => src && !src.includes('logo') && !src.includes('icon'))
                    .filter((src, i, arr) => arr.indexOf(src) === i); // Únicos
            };

            return {
                title: getText('h1') || getText('[class*="title"]') || getText('[class*="Title"]'),
                price: getText('[class*="price"]') || getText('[class*="Price"]') || getText('h2'),
                location: getText('[class*="location"]') || getText('[class*="address"]') || getText('[class*="Address"]'),
                description: getText('[class*="description"]') || getText('[class*="Description"]') || getText('p'),
                bedrooms: getText('[class*="bedroom"]') || getText('[class*="recamara"]'),
                bathrooms: getText('[class*="bathroom"]') || getText('[class*="baño"]'),
                area: getText('[class*="area"]') || getText('[class*="superficie"]') || getText('[class*="m²"]'),
                features: getAll('li').filter(t => t.length > 0 && t.length < 100),
                images: getImages(),
                fullHTML: document.body.innerHTML
            };
        });

        log('✅ Datos extraídos:', 'green');
        console.log(`   📝 Título: ${propertyData.title || 'N/A'}`);
        console.log(`   💰 Precio: ${propertyData.price || 'N/A'}`);
        console.log(`   📍 Ubicación: ${propertyData.location || 'N/A'}`);
        console.log(`   🛏️  Recámaras: ${propertyData.bedrooms || 'N/A'}`);
        console.log(`   🚿 Baños: ${propertyData.bathrooms || 'N/A'}`);
        console.log(`   📏 Área: ${propertyData.area || 'N/A'}`);
        console.log(`   📸 Imágenes: ${propertyData.images.length}`);
        console.log(`   📋 Características: ${propertyData.features.length}`);

        // Guardar datos raw
        fs.writeFileSync('propiedad-raw-data.json', JSON.stringify(propertyData, null, 2));
        log('\n💾 Datos guardados en: propiedad-raw-data.json', 'green');

        // Cerrar navegador
        await browser.close();

        // PASO 3: Descargar fotos
        if (propertyData.images.length > 0) {
            log(`\n📸 Paso 3: Descargando ${propertyData.images.length} fotos...`, 'yellow');

            const slug = 'casa-conquista-culiacan-scraped';
            const photosDir = `images/${slug}`;

            if (!fs.existsSync(photosDir)) {
                fs.mkdirSync(photosDir, { recursive: true });
            }

            for (let i = 0; i < Math.min(propertyData.images.length, 15); i++) {
                try {
                    const imgURL = propertyData.images[i];
                    const filepath = path.join(photosDir, `foto-${i + 1}.jpg`);
                    await downloadImage(imgURL, filepath);
                    log(`   ✓ foto-${i + 1}.jpg`, 'green');
                } catch (error) {
                    log(`   ✗ Error en foto ${i + 1}: ${error.message}`, 'red');
                }
            }

            log(`✅ ${Math.min(propertyData.images.length, 15)} fotos descargadas`, 'green');

            // PASO 4: Convertir a formato PropertyPageGenerator
            log('\n🔄 Paso 4: Convirtiendo a formato PropertyPageGenerator...', 'yellow');

            // Parsear datos
            const priceMatch = propertyData.price?.match(/[\d,]+/);
            const priceNumber = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
            const price = `$${priceNumber.toLocaleString('es-MX')}`;

            const bedroomsMatch = propertyData.bedrooms?.match(/\d+/);
            const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[0]) : 3;

            const bathroomsMatch = propertyData.bathrooms?.match(/[\d.]+/);
            const bathrooms = bathroomsMatch ? parseFloat(bathroomsMatch[0]) : 2;

            const areaMatch = propertyData.area?.match(/\d+/);
            const area = areaMatch ? parseInt(areaMatch[0]) : 100;

            const generatorData = {
                title: propertyData.title || 'Casa en Venta La Conquista',
                location: propertyData.location || 'La Conquista, Culiacán',
                price: price,
                priceNumber: priceNumber,
                bedrooms: bedrooms,
                bathrooms: bathrooms,
                parking: 2,
                area: area,
                landArea: area,
                yearBuilt: 'N/D',
                slug: slug,
                key: slug,
                propertyType: 'venta',
                description: propertyData.description || `Propiedad en venta en ${propertyData.location || 'Culiacán'}`,
                features: propertyData.features.slice(0, 8).length > 0 ? propertyData.features.slice(0, 8) : [
                    `${bedrooms} Recámaras`,
                    `${bathrooms} Baños`,
                    `${area} m² de Construcción`
                ],
                whatsappMessage: `Hola, me interesa la propiedad en La Conquista de ${price}`,
                photoCount: Math.min(propertyData.images.length, 15)
            };

            log('✅ Datos convertidos:', 'green');
            console.log(JSON.stringify(generatorData, null, 2));

            // PASO 5: Generar página HTML
            log('\n📄 Paso 5: Generando página HTML...', 'yellow');

            const generator = new PropertyPageGenerator(false);
            const htmlContent = generator.generateFromSolidaridadTemplate(generatorData);

            fs.writeFileSync(`${slug}.html`, htmlContent);
            log(`✅ Página generada: ${slug}.html`, 'green');

            // Guardar config para referencia
            fs.writeFileSync(`${slug}-config.json`, JSON.stringify(generatorData, null, 2));

            log('\n╔═══════════════════════════════════════════════════════╗', 'green');
            log('║              ✅ PROCESO COMPLETADO                    ║', 'green');
            log('╚═══════════════════════════════════════════════════════╝', 'green');

            log(`\n📁 Archivos generados:`, 'cyan');
            log(`   📄 ${slug}.html - Página lista para publicar`, 'cyan');
            log(`   📸 images/${slug}/ - ${generatorData.photoCount} fotos`, 'cyan');
            log(`   💾 ${slug}-config.json - Configuración`, 'cyan');
            log(`   💾 propiedad-raw-data.json - Datos originales scraped`, 'cyan');

            log(`\n🚀 Próximo paso:`, 'yellow');
            log(`   Ejecuta: open ${slug}.html`, 'yellow');
            log(`   O publica con: git add ${slug}.html images/${slug}/ && git commit && git push\n`, 'yellow');

        } else {
            log('❌ No se encontraron imágenes', 'red');
        }

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, 'red');
        console.error(error);
        await page.screenshot({ path: 'error-scraping.png' });
        await browser.close();
    }
}

scrapeProperty();
