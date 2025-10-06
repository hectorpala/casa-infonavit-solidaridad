#!/usr/bin/env node
/**
 * Scraper para Wiggot.com
 * Descarga fotos, extrae datos de propiedades
 *
 * Uso: node scraper-wiggot.js "URL_DE_WIGGOT"
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

// Credenciales de la cuenta creada
const WIGGOT_EMAIL = 'hector.test.1759769906975@gmail.com';
const WIGGOT_PASSWORD = 'Wiggot2025!drm36';

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
const propertyURL = process.argv[2];

if (!propertyURL) {
    log('❌ ERROR: Debes proporcionar una URL de Wiggot', 'red');
    log('Uso: node scraper-wiggot.js "https://wiggot.com/propiedad/..."', 'yellow');
    process.exit(1);
}

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

async function loginToWiggot(page) {
    log('\n🔐 Iniciando sesión en Wiggot...', 'yellow');

    try {
        // Buscar campo de email
        await page.waitForSelector('input[type="email"], input[name*="email"]', { timeout: 10000 });
        await page.type('input[type="email"], input[name*="email"]', WIGGOT_EMAIL);
        log('✅ Email ingresado', 'green');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Buscar campo de password
        await page.type('input[type="password"]', WIGGOT_PASSWORD);
        log('✅ Password ingresado', 'green');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Buscar y clickear botón de login
        const loginClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
            for (const btn of buttons) {
                const text = (btn.textContent || btn.value || '').toLowerCase();
                if (text.includes('login') || text.includes('entrar') || text.includes('iniciar')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });

        if (loginClicked) {
            log('✅ Botón de login clickeado', 'green');
            await new Promise(resolve => setTimeout(resolve, 3000));
            log('✅ Sesión iniciada exitosamente', 'green');
            return true;
        } else {
            log('⚠️ No se encontró botón de login', 'yellow');
            return false;
        }
    } catch (error) {
        log(`⚠️ Error en login: ${error.message}`, 'yellow');
        return false;
    }
}

async function scrapeProperty() {
    log('\n╔═══════════════════════════════════════════════════════╗', 'bright');
    log('║       🕷️  Scraper Wiggot.com Automático             ║', 'bright');
    log('╚═══════════════════════════════════════════════════════╝\n', 'bright');

    log(`🌐 URL: ${propertyURL}\n`, 'cyan');

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // User-Agent realista
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        log('📍 Paso 1: Navegando a Wiggot...', 'yellow');
        await page.goto('https://wiggot.com', { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Intentar login
        const loggedIn = await loginToWiggot(page);

        if (loggedIn) {
            log('\n📍 Paso 2: Navegando a la propiedad...', 'yellow');
            await page.goto(propertyURL, { waitUntil: 'networkidle2', timeout: 60000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
            log('⚠️ Continuando sin login...', 'yellow');
            await page.goto(propertyURL, { waitUntil: 'networkidle2', timeout: 60000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        await page.screenshot({ path: 'wiggot-screenshot.png' });
        log('✅ Página cargada', 'green');

        log('\n📊 Paso 3: Extrayendo datos...', 'yellow');

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
                fullHTML: document.body.innerHTML.substring(0, 5000) // Primeros 5000 chars para debug
            };
        });

        log('\n📊 DATOS EXTRAÍDOS:', 'bright');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
        log(`Título: ${propertyData.title || 'N/A'}`, 'cyan');
        log(`Precio: ${propertyData.price || 'N/A'}`, 'cyan');
        log(`Ubicación: ${propertyData.location || 'N/A'}`, 'cyan');
        log(`Recámaras: ${propertyData.bedrooms || 'N/A'}`, 'cyan');
        log(`Baños: ${propertyData.bathrooms || 'N/A'}`, 'cyan');
        log(`Área: ${propertyData.area || 'N/A'}`, 'cyan');
        log(`Fotos encontradas: ${propertyData.images.length}`, 'cyan');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

        // Guardar datos
        const outputData = {
            url: propertyURL,
            scrapedAt: new Date().toISOString(),
            data: propertyData
        };

        const outputFile = 'wiggot-scrape-result.json';
        fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
        log(`✅ Datos guardados en: ${outputFile}`, 'green');

        // Descargar fotos
        if (propertyData.images.length > 0) {
            log(`\n📸 Paso 4: Descargando ${propertyData.images.length} fotos...`, 'yellow');

            const outputDir = './wiggot-fotos';
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            let downloaded = 0;
            for (let i = 0; i < propertyData.images.length; i++) {
                try {
                    const imageUrl = propertyData.images[i];
                    const filename = `foto-${i + 1}.jpg`;
                    const filepath = path.join(outputDir, filename);

                    await downloadImage(imageUrl, filepath);
                    downloaded++;
                    log(`✅ ${filename} descargada (${downloaded}/${propertyData.images.length})`, 'green');
                } catch (error) {
                    log(`❌ Error descargando foto ${i + 1}: ${error.message}`, 'red');
                }
            }

            log(`\n✅ ${downloaded}/${propertyData.images.length} fotos descargadas en: ${outputDir}`, 'green');
        }

        log('\n✅ SCRAPING COMPLETADO', 'bright');
        log('📁 Archivos generados:', 'yellow');
        log('  - wiggot-scrape-result.json (datos JSON)', 'cyan');
        log('  - wiggot-screenshot.png (screenshot)', 'cyan');
        log('  - wiggot-fotos/ (fotos descargadas)', 'cyan');

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        console.error(error);
    } finally {
        log('\n🔄 Cerrando navegador...', 'yellow');
        await browser.close();
        log('✅ Navegador cerrado\n', 'green');
    }
}

scrapeProperty();
