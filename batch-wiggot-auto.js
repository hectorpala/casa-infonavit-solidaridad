#!/usr/bin/env node

/**
 * BATCH WIGGOT AUTO-SCRAPER
 *
 * Automatiza el scraping de 12 propiedades de Wiggot:
 * 1. Login automático
 * 2. Extrae los primeros 12 propertyIds de la búsqueda
 * 3. Valida duplicados contra CRM
 * 4. Scrapea solo propiedades nuevas
 * 5. Genera páginas y descarga fotos
 * 6. Commit automático
 * 7. Pregunta si publicar
 *
 * Uso: node batch-wiggot-auto.js "URL_DE_BUSQUEDA_WIGGOT"
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const { execSync } = require('child_process');

// Configuración
const WIGGOT_EMAIL = 'hector.test.1759769906975@gmail.com';
const WIGGOT_PASSWORD = 'Wiggot2025!drm36';
const SEARCH_URL = process.argv[2] || 'https://new.wiggot.com/search?page=1&limit=12&propertyType=casa&operationType=venta&minPrice=1000000&maxPrice=2000000&location=Culiac%C3%A1n,%20Sinaloa,%20M%C3%A9xico';
const BATCH_SIZE = 12;

// Helper para wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Cargar CRM para validar duplicados
function loadCRM() {
    try {
        const crmData = fs.readFileSync('crm-propiedades.json', 'utf-8');
        return JSON.parse(crmData);
    } catch (e) {
        return [];
    }
}

// Verificar si una propiedad ya existe
function isDuplicate(propertyId, crm) {
    return crm.some(prop => prop.propertyId === propertyId);
}

// Extraer propertyIds de la página de búsqueda
async function extractPropertyIds(page) {
    log('\n📋 Extrayendo propertyIds de la búsqueda...', 'cyan');

    // Esperar a que carguen elementos de la página
    log('   ⏳ Esperando que carguen los resultados...', 'cyan');
    await wait(8000);

    // Hacer scroll para activar lazy loading
    log('   📜 Haciendo scroll para cargar resultados...', 'cyan');
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await wait(3000);

    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    await wait(3000);

    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
    await wait(2000);

    // Tomar screenshot para debug
    await page.screenshot({ path: 'batch-search-results.png', fullPage: true });
    log('   📸 Screenshot guardado en batch-search-results.png', 'cyan');

    const propertyIds = await page.evaluate(() => {
        const ids = [];
        // Buscar todos los links que contienen property-detail
        const links = document.querySelectorAll('a[href*="property-detail"]');

        links.forEach(link => {
            const match = link.href.match(/property-detail\/([a-zA-Z0-9]+)/);
            if (match && match[1]) {
                ids.push(match[1]);
            }
        });

        // Eliminar duplicados
        return [...new Set(ids)];
    });

    return propertyIds;
}

// Login en Wiggot
async function loginWiggot(page, url) {
    log('\n🔐 Iniciando sesión en Wiggot...', 'blue');

    await page.goto(url, { waitUntil: 'networkidle2' });
    await wait(5000); // Más tiempo para que cargue

    // Detectar si necesita login
    const needsLogin = await page.evaluate(() => {
        return document.body.innerText.includes('Iniciar sesión') ||
               document.body.innerText.includes('Inicia sesión') ||
               document.body.innerText.includes('Nos alegra verte');
    });

    if (!needsLogin) {
        log('✅ Ya estás autenticado', 'green');
        return true;
    }

    log('🔑 Detectado formulario de login, ingresando credenciales...', 'yellow');

    // Buscar campos de login (exactamente como en wiggotscraper.js)
    const inputs = await page.$$('input');

    if (inputs.length >= 2) {
        log('   ✍️  Escribiendo email...', 'cyan');
        await inputs[0].click();
        await page.keyboard.type(WIGGOT_EMAIL, { delay: 50 });

        log('   ✍️  Escribiendo password...', 'cyan');
        await inputs[1].click();
        await page.keyboard.type(WIGGOT_PASSWORD, { delay: 50 });

        await wait(1000);

        // Buscar botón de login
        const buttons = await page.$$('button');
        log(`   Encontrados ${buttons.length} botones`, 'cyan');

        for (const button of buttons) {
            const text = await page.evaluate(el => el.innerText, button);
            if (text.includes('Iniciar')) {
                log('   🖱️  Clickeando botón "Iniciar sesión"...', 'cyan');
                await button.click();
                break;
            }
        }

        // Esperar navegación después del login
        log('   ⏳ Esperando login...', 'cyan');
        try {
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
            log('✅ Login exitoso', 'green');
            return true;
        } catch (e) {
            log('⚠️  Timeout en navegación, verificando si está autenticado...', 'yellow');
            await wait(5000);
            // Verificar si ya está en la página de resultados
            const isLoggedIn = !(await page.evaluate(() => {
                return document.body.innerText.includes('Iniciar sesión');
            }));
            if (isLoggedIn) {
                log('✅ Login exitoso (detectado después de timeout)', 'green');
                return true;
            }
            log('❌ Login falló', 'red');
            return false;
        }
    }

    log('❌ No se encontraron campos de login', 'red');
    return false;
}

// Scrapear una propiedad individual
async function scrapeProperty(propertyId) {
    return new Promise((resolve, reject) => {
        try {
            const output = execSync(`node wiggotscraper.js "${propertyId}"`, {
                encoding: 'utf-8',
                stdio: 'pipe'
            });

            // Verificar si el scraping fue exitoso
            if (output.includes('SCRAPING COMPLETADO CON ÉXITO')) {
                resolve(true);
            } else {
                reject(new Error('Scraping falló'));
            }
        } catch (error) {
            reject(error);
        }
    });
}

// Generar página HTML
function generatePage(propertyId) {
    try {
        const jsonFile = `wiggot-datos-${propertyId}.json`;
        execSync(`node generadorwiggot.js "${jsonFile}"`, {
            encoding: 'utf-8',
            stdio: 'inherit'
        });
        return true;
    } catch (error) {
        log(`❌ Error generando página: ${error.message}`, 'red');
        return false;
    }
}

// Descargar fotos
function downloadPhotos(propertyId) {
    try {
        const jsonData = JSON.parse(fs.readFileSync(`wiggot-datos-${propertyId}.json`, 'utf-8'));
        const slug = jsonData.data.title
            .toLowerCase()
            .replace(/[áéíóúñ]/g, m => ({'á':'a','é':'e','í':'i','ó':'o','ú':'u','ñ':'n'}[m]))
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const folderPath = `culiacan/casa-venta-${slug}-${propertyId}/images`;

        if (!fs.existsSync(folderPath)) {
            log(`❌ Carpeta no existe: ${folderPath}`, 'red');
            return false;
        }

        const images = jsonData.data.images || [];

        log(`   📸 Descargando ${images.length} fotos...`, 'cyan');

        images.forEach((url, index) => {
            const filename = `foto-${index + 1}.jpg`;
            try {
                execSync(`curl -s "${url}" -o "${folderPath}/${filename}"`, { stdio: 'pipe' });
            } catch (e) {
                log(`   ⚠️  Error descargando foto ${index + 1}`, 'yellow');
            }
        });

        log(`   ✅ ${images.length} fotos descargadas`, 'green');
        return true;
    } catch (error) {
        log(`❌ Error descargando fotos: ${error.message}`, 'red');
        return false;
    }
}

// Función principal
async function main() {
    log('\n🏠 BATCH WIGGOT AUTO-SCRAPER', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        // PASO 1: Login en página principal
        log('🔐 PASO 1: Login en Wiggot...', 'blue');
        const loginSuccess = await loginWiggot(page, 'https://new.wiggot.com/search');
        if (!loginSuccess) {
            throw new Error('Login falló');
        }

        // PASO 2: Navegar a la URL de búsqueda específica
        log('\n🔍 PASO 2: Navegando a búsqueda personalizada...', 'blue');
        log(`   URL: ${SEARCH_URL}`, 'cyan');
        await page.goto(SEARCH_URL, { waitUntil: 'networkidle2' });
        await wait(8000); // Esperar a que carguen los resultados
        log('✅ Página de búsqueda cargada', 'green');

        // PASO 3: Extraer propertyIds
        const propertyIds = await extractPropertyIds(page);
        log(`✅ Encontradas ${propertyIds.length} propiedades`, 'green');

        if (propertyIds.length === 0) {
            throw new Error('No se encontraron propiedades');
        }

        // Limitar a BATCH_SIZE
        const batchIds = propertyIds.slice(0, BATCH_SIZE);
        log(`📦 Procesando batch de ${batchIds.length} propiedades\n`, 'cyan');

        // Cerrar navegador para liberar recursos
        await browser.close();

        // PASO 4: Validar duplicados
        const crm = loadCRM();
        const newProperties = [];
        const duplicates = [];

        log('\n📊 VALIDANDO DUPLICADOS:', 'yellow');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'yellow');

        batchIds.forEach((id, index) => {
            if (isDuplicate(id, crm)) {
                duplicates.push(id);
                log(`${index + 1}. ⚠️  ${id} - YA EXISTE (omitida)`, 'yellow');
            } else {
                newProperties.push(id);
                log(`${index + 1}. ✅ ${id} - NUEVA`, 'green');
            }
        });

        // PASO 5: Resumen
        log('\n📋 RESUMEN:', 'bright');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');
        log(`✅ Nuevas: ${newProperties.length} propiedades`, 'green');
        log(`⚠️  Duplicadas: ${duplicates.length} propiedades`, 'yellow');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

        if (newProperties.length === 0) {
            log('🎉 No hay propiedades nuevas para procesar', 'cyan');
            process.exit(0);
        }

        // PASO 6: Scrapear propiedades nuevas
        log('\n🚀 SCRAPEANDO PROPIEDADES NUEVAS:', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

        const successful = [];
        const failed = [];

        for (let i = 0; i < newProperties.length; i++) {
            const id = newProperties[i];
            log(`\n[${i + 1}/${newProperties.length}] Procesando ${id}...`, 'cyan');

            try {
                // Scrapear
                await scrapeProperty(id);
                log(`   ✅ Scraping completado`, 'green');

                // Generar página
                log(`   🔧 Generando página HTML...`, 'cyan');
                generatePage(id);

                // Descargar fotos
                downloadPhotos(id);

                successful.push(id);
                log(`   ✅ Propiedad ${id} completada`, 'green');

            } catch (error) {
                log(`   ❌ Error: ${error.message}`, 'red');
                failed.push(id);
            }
        }

        // PASO 7: Resumen final
        log('\n\n📊 RESUMEN FINAL:', 'bright');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');
        log(`✅ Exitosas: ${successful.length}`, 'green');
        log(`❌ Fallidas: ${failed.length}`, 'red');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

        if (successful.length > 0) {
            // PASO 8: Commit automático
            log('💾 Creando commit...', 'blue');

            execSync('git add .', { stdio: 'inherit' });

            const commitMsg = `Add: Batch ${successful.length} propiedades Wiggot

Propiedades agregadas:
${successful.map((id, i) => `${i + 1}. ${id}`).join('\n')}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

            execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });

            log('\n✅ Commit creado exitosamente', 'green');
            log('\n🚀 Para publicar ejecuta: git push && "publica ya"', 'cyan');
        }

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        await browser.close();
        process.exit(1);
    }
}

// Ejecutar
main().catch(error => {
    log(`\n❌ Error fatal: ${error.message}`, 'red');
    process.exit(1);
});
