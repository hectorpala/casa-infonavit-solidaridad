#!/usr/bin/env node

/**
 * WIGGOT SEARCH SCRAPER - Procesa página de búsqueda completa
 *
 * Uso: node wiggot-search-scraper.js "https://new.wiggot.com/search/results?..."
 *
 * Funcionalidades:
 * - Extrae TODAS las URLs de propiedades de una página de búsqueda
 * - Detecta duplicados por ID (wiggot:pXXXXXX)
 * - Salta propiedades ya scrapeadas
 * - Procesa solo nuevas
 * - Un commit batch al final
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WIGGOT_EMAIL = process.env.WIGGOT_EMAIL || 'tu-email@ejemplo.com';
const WIGGOT_PASSWORD = process.env.WIGGOT_PASSWORD || 'tu-password';
const COOKIES_FILE = 'wiggot-cookies.json';
const DATA_PATH = 'data/items';

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    red: '\x1b[31m',
    gray: '\x1b[90m'
};

function log(emoji, message, color = colors.reset) {
    console.log(`${color}${emoji} ${message}${colors.reset}`);
}

// Extraer ID de URL de Wiggot
function extractWiggotId(url) {
    const match = url.match(/property-detail\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

// Verificar si propiedad ya existe por ID
function isPropertyScraped(wiggotId) {
    const jsonPath = path.join(DATA_PATH, `wiggot:${wiggotId}.json`);
    return fs.existsSync(jsonPath);
}

// Cargar cookies guardadas
function loadCookies() {
    if (fs.existsSync(COOKIES_FILE)) {
        const cookiesString = fs.readFileSync(COOKIES_FILE, 'utf8');
        return JSON.parse(cookiesString);
    }
    return null;
}

// Guardar cookies
function saveCookies(cookies) {
    fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
}

async function main() {
    const searchUrl = process.argv[2];

    if (!searchUrl) {
        console.error('❌ Error: Debes proporcionar una URL de búsqueda de Wiggot');
        console.error('Uso: node wiggot-search-scraper.js "https://new.wiggot.com/search/results?..."');
        process.exit(1);
    }

    if (!searchUrl.includes('new.wiggot.com')) {
        console.error('❌ Error: La URL debe ser de new.wiggot.com');
        process.exit(1);
    }

    console.log('');
    log('🚀', 'INICIANDO WIGGOT SEARCH SCRAPER', colors.blue);
    log('📍', `URL de búsqueda: ${searchUrl}`, colors.gray);
    console.log('');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Configurar viewport y user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    // Cargar cookies si existen
    const savedCookies = loadCookies();
    if (savedCookies) {
        log('🍪', 'Cargando cookies guardadas...', colors.yellow);
        await page.setCookie(...savedCookies);
    }

    // Navegar a la página de búsqueda
    log('🔍', 'Navegando a página de búsqueda...', colors.blue);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Verificar si requiere login
    const needsLogin = await page.evaluate(() => {
        return document.body.innerText.includes('Iniciar sesión') ||
               document.body.innerText.includes('Login');
    });

    if (needsLogin) {
        log('🔐', 'Login requerido, autenticando...', colors.yellow);

        // Buscar campos de login
        await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 5000 });

        const inputs = await page.$$('input[type="email"], input[type="text"], input[type="password"]');

        if (inputs.length >= 2) {
            await inputs[0].type(WIGGOT_EMAIL);
            await inputs[1].type(WIGGOT_PASSWORD);

            const buttons = await page.$$('button');
            for (const button of buttons) {
                const text = await page.evaluate(el => el.innerText, button);
                if (text.includes('Iniciar sesión') || text.includes('Login')) {
                    await button.click();
                    break;
                }
            }

            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

            // Guardar cookies
            const cookies = await page.cookies();
            saveCookies(cookies);
            log('✅', 'Login exitoso, cookies guardadas', colors.green);

            // Navegar nuevamente a la búsqueda
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        }
    }

    // Scroll para cargar todas las propiedades (lazy loading)
    log('📜', 'Scrolling para cargar todas las propiedades...', colors.blue);

    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 500;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 200);
        });
    });

    await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar carga final

    // Extraer URLs de propiedades
    log('🔎', 'Extrayendo URLs de propiedades...', colors.blue);

    const propertyUrls = await page.evaluate(() => {
        const urls = new Set();

        // Buscar todos los enlaces que contengan "property-detail"
        document.querySelectorAll('a[href*="property-detail"]').forEach(link => {
            const href = link.href;
            if (href && href.includes('property-detail')) {
                urls.add(href);
            }
        });

        // Método alternativo: buscar en onclick handlers
        document.querySelectorAll('[onclick*="property-detail"]').forEach(el => {
            const onclick = el.getAttribute('onclick');
            const match = onclick.match(/property-detail\/([a-zA-Z0-9]+)/);
            if (match) {
                urls.add(`https://new.wiggot.com/search/property-detail/${match[1]}`);
            }
        });

        // Método alternativo: buscar divs/cards que contengan enlaces internos
        document.querySelectorAll('div, article, section').forEach(el => {
            const text = el.innerHTML;
            const matches = text.matchAll(/property-detail\/([a-zA-Z0-9]+)/g);
            for (const match of matches) {
                urls.add(`https://new.wiggot.com/search/property-detail/${match[1]}`);
            }
        });

        return Array.from(urls);
    });

    await browser.close();

    if (propertyUrls.length === 0) {
        log('⚠️', 'No se encontraron propiedades en la página de búsqueda', colors.yellow);
        process.exit(0);
    }

    log('✅', `Encontradas ${propertyUrls.length} propiedades`, colors.green);
    console.log('');

    // Verificar duplicados
    const newUrls = [];
    const duplicateUrls = [];

    for (const url of propertyUrls) {
        const wiggotId = extractWiggotId(url);
        if (!wiggotId) {
            log('⚠️', `URL inválida (sin ID): ${url}`, colors.yellow);
            continue;
        }

        if (isPropertyScraped(wiggotId)) {
            duplicateUrls.push({ url, id: wiggotId });
            log('⏭️', `Duplicado (ya existe): wiggot:${wiggotId}`, colors.gray);
        } else {
            newUrls.push({ url, id: wiggotId });
        }
    }

    console.log('');
    log('📊', `Nuevas: ${newUrls.length} | Duplicadas: ${duplicateUrls.length}`, colors.blue);
    console.log('');

    if (newUrls.length === 0) {
        log('ℹ️', 'Todas las propiedades ya están scrapeadas', colors.yellow);
        process.exit(0);
    }

    // Procesar propiedades nuevas
    log('🚀', `Procesando ${newUrls.length} propiedades nuevas...`, colors.green);
    console.log('');

    const results = [];

    for (let i = 0; i < newUrls.length; i++) {
        const { url, id } = newUrls[i];
        const current = i + 1;
        const total = newUrls.length;

        log('▶️', `[${current}/${total}] Procesando wiggot:${id}...`, colors.blue);

        try {
            // Ejecutar scraper individual
            execSync(`node wiggot-scraper-y-publicar.js "${url}" <<< "s"`, {
                encoding: 'utf8',
                stdio: 'inherit',
                cwd: process.cwd()
            });

            results.push({ id, status: 'success', url });
            log('✅', `[${current}/${total}] wiggot:${id} completado`, colors.green);
        } catch (error) {
            results.push({ id, status: 'failed', url, error: error.message });
            log('❌', `[${current}/${total}] wiggot:${id} falló: ${error.message}`, colors.red);
        }

        console.log('');
    }

    // Resumen final
    console.log('');
    log('🎉', '¡PROCESO COMPLETADO!', colors.green);
    console.log('');
    log('📊', 'RESUMEN:', colors.blue);
    log('  ', `Total encontradas: ${propertyUrls.length}`, colors.gray);
    log('  ', `Duplicadas (omitidas): ${duplicateUrls.length}`, colors.gray);
    log('  ', `Nuevas procesadas: ${newUrls.length}`, colors.gray);
    log('  ', `Exitosas: ${results.filter(r => r.status === 'success').length}`, colors.green);
    log('  ', `Fallidas: ${results.filter(r => r.status === 'failed').length}`, colors.red);
    console.log('');

    // Mostrar URLs fallidas si hay
    const failed = results.filter(r => r.status === 'failed');
    if (failed.length > 0) {
        log('⚠️', 'URLs FALLIDAS:', colors.yellow);
        failed.forEach(f => {
            log('  ', `wiggot:${f.id} - ${f.url}`, colors.red);
        });
        console.log('');
    }

    log('✅', 'Todas las propiedades nuevas han sido publicadas a GitHub', colors.green);
    log('🌐', 'Estarán disponibles en 1-2 minutos en https://casasenventa.info', colors.blue);
}

main().catch(error => {
    console.error('');
    log('❌', `Error fatal: ${error.message}`, colors.red);
    console.error(error.stack);
    process.exit(1);
});
