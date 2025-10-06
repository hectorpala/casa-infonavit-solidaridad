#!/usr/bin/env node
/**
 * Scraper para Wiggot.com con LOGIN AUTOMÁTICO
 * Hace login, navega a la propiedad, extrae datos y descarga fotos
 *
 * Uso: node scraper-wiggot-auto-login.js "URL_DE_WIGGOT"
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

const propertyURL = process.argv[2];

if (!propertyURL) {
    log('❌ ERROR: Debes proporcionar una URL de Wiggot', 'red');
    log('Uso: node scraper-wiggot-auto-login.js "https://new.wiggot.com/..."', 'yellow');
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

async function scrapeProperty() {
    log('\n╔═══════════════════════════════════════════════════════╗', 'bright');
    log('║   🕷️  Scraper Wiggot con LOGIN AUTOMÁTICO          ║', 'bright');
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
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Cargar cookies guardadas si existen (para mantener sesión)
    const cookiesPath = 'wiggot-cookies.json';
    if (fs.existsSync(cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath));
        await page.setCookie(...cookies);
        log('✅ Cookies de sesión cargadas', 'green');
    }

    try {
        log('📍 Paso 1: Navegando directamente a la propiedad...', 'yellow');
        await page.goto(propertyURL, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Verificar si nos redirigió a login
        const currentURL = page.url();
        log(`📍 URL actual: ${currentURL}`, 'cyan');

        if (currentURL.includes('login') || currentURL.includes('auth')) {
            log('\n🔐 LOGIN REQUERIDO - Iniciando sesión automática...', 'yellow');

            // Intentar llenar formulario de login
            try {
                // Buscar y llenar email
                log('📧 Buscando campo de email...', 'yellow');
                await page.waitForSelector('input[type="email"], input[name*="email"], input[id*="email"]', { timeout: 10000 });

                const emailField = await page.$('input[type="email"], input[name*="email"], input[id*="email"]');
                if (emailField) {
                    await emailField.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await emailField.type(WIGGOT_EMAIL, { delay: 100 });
                    log(`✅ Email ingresado: ${WIGGOT_EMAIL}`, 'green');
                }

                await new Promise(resolve => setTimeout(resolve, 1000));

                // Buscar y llenar password
                log('🔒 Buscando campo de password...', 'yellow');
                const passwordField = await page.$('input[type="password"], input[name*="password"], input[id*="password"]');
                if (passwordField) {
                    await passwordField.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await passwordField.type(WIGGOT_PASSWORD, { delay: 100 });
                    log('✅ Password ingresado', 'green');
                }

                await new Promise(resolve => setTimeout(resolve, 1000));

                // Buscar y clickear botón de login
                log('🔘 Buscando botón de login...', 'yellow');
                const loginClicked = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a'));
                    for (const btn of buttons) {
                        const text = (btn.textContent || btn.value || '').toLowerCase();
                        if (text.includes('login') || text.includes('entrar') ||
                            text.includes('iniciar') || text.includes('sign in') ||
                            text.includes('ingresar')) {
                            console.log('Clickeando botón:', text);
                            btn.click();
                            return true;
                        }
                    }
                    return false;
                });

                if (loginClicked) {
                    log('✅ Botón de login clickeado', 'green');
                    log('⏳ Esperando autenticación...', 'yellow');
                    await new Promise(resolve => setTimeout(resolve, 5000));

                    // Guardar cookies para futuros scrapes
                    const cookies = await page.cookies();
                    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
                    log('✅ Cookies guardadas para futuras sesiones', 'green');

                    // Navegar de nuevo a la propiedad después de login
                    log('\n📍 Paso 2: Navegando a la propiedad después de login...', 'yellow');
                    await page.goto(propertyURL, { waitUntil: 'networkidle2', timeout: 60000 });
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    log('✅ Página de propiedad cargada', 'green');
                } else {
                    log('⚠️ No se encontró botón de login - intentando manualmente...', 'yellow');
                    log('💡 Por favor completa el login manualmente en el navegador', 'cyan');
                    log('💡 Presiona ENTER cuando hayas iniciado sesión...', 'cyan');

                    // Esperar input del usuario
                    await new Promise(resolve => {
                        process.stdin.once('data', () => resolve());
                    });

                    log('\n📍 Navegando a la propiedad...', 'yellow');
                    await page.goto(propertyURL, { waitUntil: 'networkidle2', timeout: 60000 });
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

            } catch (loginError) {
                log(`❌ Error en login automático: ${loginError.message}`, 'red');
                log('💡 Por favor completa el login manualmente', 'cyan');
                log('💡 Presiona ENTER cuando hayas iniciado sesión...', 'cyan');

                await new Promise(resolve => {
                    process.stdin.once('data', () => resolve());
                });

                await page.goto(propertyURL, { waitUntil: 'networkidle2', timeout: 60000 });
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } else {
            log('✅ Ya estamos en la página de la propiedad (sin login requerido)', 'green');
        }

        await page.screenshot({ path: 'wiggot-propiedad-screenshot.png' });

        // Clickear botón "Ver todas las fotos" si existe
        log('\n📸 Buscando galería de fotos...', 'yellow');
        try {
            const galeriaClicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
                for (const btn of buttons) {
                    const text = (btn.textContent || '').toLowerCase();
                    if (text.includes('ver todas') || text.includes('ver fotos') ||
                        text.includes('galería') || text.includes('gallery') ||
                        text.includes('see all')) {
                        console.log('Clickeando:', text);
                        btn.click();
                        return true;
                    }
                }
                return false;
            });

            if (galeriaClicked) {
                log('✅ Galería de fotos abierta', 'green');
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                log('ℹ️ No se encontró botón de galería (puede que ya estén visibles)', 'cyan');
            }
        } catch (e) {
            log('ℹ️ No se pudo abrir galería', 'cyan');
        }

        log('\n📊 Paso 3: Extrayendo datos de la propiedad...', 'yellow');

        const propertyData = await page.evaluate(() => {
            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.textContent.trim() : null;
            };

            const getAll = (selector) => {
                return Array.from(document.querySelectorAll(selector)).map(el => el.textContent.trim());
            };

            const getImages = () => {
                const imageUrls = new Set();

                // 1. Buscar todas las imágenes IMG
                const imgs = document.querySelectorAll('img');
                imgs.forEach(img => {
                    const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
                    if (src) imageUrls.add(src);
                });

                // 2. Buscar en backgrounds de DIV/SECTION
                const allElements = document.querySelectorAll('div, section, article');
                allElements.forEach(el => {
                    const bg = window.getComputedStyle(el).backgroundImage;
                    if (bg && bg !== 'none') {
                        const match = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
                        if (match && match[1]) {
                            imageUrls.add(match[1]);
                        }
                    }
                });

                // 3. Buscar en atributos style inline
                const styledElements = document.querySelectorAll('[style*="background"]');
                styledElements.forEach(el => {
                    const style = el.getAttribute('style');
                    const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
                    if (match && match[1]) {
                        imageUrls.add(match[1]);
                    }
                });

                // 4. Buscar srcset (imágenes responsive)
                const srcsetImgs = document.querySelectorAll('img[srcset]');
                srcsetImgs.forEach(img => {
                    const srcset = img.getAttribute('srcset');
                    if (srcset) {
                        srcset.split(',').forEach(src => {
                            const url = src.trim().split(' ')[0];
                            if (url) imageUrls.add(url);
                        });
                    }
                });

                // 5. Filtrar solo URLs válidas de fotos (no logos, iconos, etc)
                return Array.from(imageUrls).filter(src =>
                    src &&
                    src.startsWith('http') &&
                    !src.includes('logo') &&
                    !src.includes('icon') &&
                    !src.includes('Frame.svg') &&
                    !src.includes('avatar') &&
                    !src.includes('placeholder') &&
                    (src.includes('media.wiggot') ||
                     src.includes('cloudinary') ||
                     src.includes('imgur') ||
                     src.match(/\.(jpg|jpeg|png|webp)/i))
                );
            };

            // Extraer TODOS los textos estructurados de la página
            const allTexts = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, label, td, th'))
                .map(el => el.textContent.trim())
                .filter(t => t.length > 0 && t.length < 300);

            // Buscar título (generalmente es el primer h1 o h2 grande después de las fotos)
            const title = getText('h1') || getText('h2') || allTexts.find(t => t.includes('Casa') || t.includes('Departamento'));

            // Buscar precio (puede tener formato $X,XXX,XXX o MXN)
            const price = allTexts.find(t => t.match(/\$[\d,]+/) || t.includes('MXN')) || getText('[class*="price"]');

            // Buscar ubicación/dirección (está cerca del mapa)
            const location = allTexts.find(t => t.includes('Avenida') || t.includes('Calle') || t.includes('Culiacán')) ||
                            getText('[class*="address"]');

            // Buscar características (recámaras, baños, m²)
            const caracteristicas = allTexts.filter(t =>
                t.includes('recámara') || t.includes('Recámara') ||
                t.includes('baño') || t.includes('Baño') ||
                t.includes('m²') || t.includes('m2') ||
                t.includes('estacionamiento') || t.includes('Estacionamiento')
            );

            // Extraer números de características
            const bedroomsText = caracteristicas.find(t => t.includes('recámara') || t.includes('Recámara'));
            const bathroomsText = caracteristicas.find(t => t.includes('baño') || t.includes('Baño'));
            const areaText = caracteristicas.find(t => t.match(/\d+\s*m[²2]/));

            const bedrooms = bedroomsText ? bedroomsText.match(/\d+/)?.[0] : null;
            const bathrooms = bathroomsText ? bathroomsText.match(/[\d.]+/)?.[0] : null;
            const area = areaText ? areaText.match(/[\d,]+/)?.[0] : null;

            // Buscar descripción (suele ser un párrafo largo)
            const description = allTexts.find(t => t.length > 100 && !t.includes('InicioBolsa') && !t.includes('Menú')) ||
                               getText('[class*="description"]');

            return {
                title,
                price,
                location,
                description,
                bedrooms,
                bathrooms,
                area,
                caracteristicas, // Todas las características encontradas
                features: getAll('li').filter(t => t.length > 0 && t.length < 100),
                images: getImages(),
                allText: allTexts.slice(0, 100) // Primeros 100 textos para debug
            };
        });

        log('\n📊 DATOS EXTRAÍDOS:', 'bright');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
        log(`Título: ${propertyData.title || 'N/A'}`, 'cyan');
        log(`Precio: ${propertyData.price || 'N/A'}`, 'cyan');
        log(`Ubicación: ${propertyData.location || 'N/A'}`, 'cyan');
        log(`Recámaras: ${propertyData.bedrooms || 'N/A'}`, 'cyan');
        log(`Baños: ${propertyData.bathrooms || 'N/A'}`, 'cyan');
        log(`Área: ${propertyData.area || 'N/A'} m²`, 'cyan');
        log(`Descripción: ${propertyData.description ? propertyData.description.substring(0, 100) + '...' : 'N/A'}`, 'cyan');
        log(`Fotos encontradas: ${propertyData.images.length}`, 'cyan');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

        if (propertyData.caracteristicas && propertyData.caracteristicas.length > 0) {
            log('🏠 Características encontradas:', 'yellow');
            propertyData.caracteristicas.forEach((car, i) => {
                log(`  ${i + 1}. ${car}`, 'cyan');
            });
            log('');
        }

        // Mostrar textos encontrados para debug
        if (propertyData.allText.length > 0) {
            log('📝 Textos encontrados en la página (debug):', 'yellow');
            propertyData.allText.slice(0, 20).forEach((text, i) => {
                log(`  ${i + 1}. ${text}`, 'cyan');
            });
            log('');
        }

        // Guardar datos
        const outputData = {
            url: propertyURL,
            scrapedAt: new Date().toISOString(),
            data: propertyData
        };

        const outputFile = 'wiggot-datos-extraidos.json';
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
        } else {
            log('⚠️ No se encontraron fotos para descargar', 'yellow');
        }

        log('\n✅ SCRAPING COMPLETADO', 'bright');
        log('📁 Archivos generados:', 'yellow');
        log('  - wiggot-datos-extraidos.json (datos JSON)', 'cyan');
        log('  - wiggot-propiedad-screenshot.png (screenshot)', 'cyan');
        if (propertyData.images.length > 0) {
            log('  - wiggot-fotos/ (fotos descargadas)', 'cyan');
        }

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        console.error(error);
    } finally {
        log('\n💡 Navegador permanecerá abierto por 10 segundos para verificar...', 'yellow');
        await new Promise(resolve => setTimeout(resolve, 10000));

        log('🔄 Cerrando navegador...', 'yellow');
        await browser.close();
        log('✅ Navegador cerrado\n', 'green');
    }
}

scrapeProperty();
