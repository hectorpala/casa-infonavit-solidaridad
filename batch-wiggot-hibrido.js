#!/usr/bin/env node

/**
 * BATCH WIGGOT HÍBRIDO - Mejor de ambos mundos
 *
 * FLUJO:
 * 1. 🤖 Script: Login automático
 * 2. 👤 TÚ: Navegas manualmente a búsqueda y aplicas filtros
 * 3. 🤖 Script: Extrae propertyIds automáticamente
 * 4. 🤖 Script: Valida duplicados
 * 5. 🤖 Script: Scrapea solo nuevas
 * 6. 🤖 Script: Commit automático
 *
 * Uso: node batch-wiggot-hibrido.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

const WIGGOT_EMAIL = 'hector.test.1759769906975@gmail.com';
const WIGGOT_PASSWORD = 'Wiggot2025!drm36';
const BATCH_SIZE = 12;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function askUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(`${colors.cyan}${question}${colors.reset}`, answer => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
}

function loadCRM() {
    try {
        const crmData = fs.readFileSync('crm-propiedades.json', 'utf-8');
        return JSON.parse(crmData);
    } catch (e) {
        return [];
    }
}

function isDuplicate(propertyId, crm) {
    return crm.some(prop => prop.propertyId === propertyId);
}

function scrapeProperty(propertyId) {
    return new Promise((resolve, reject) => {
        try {
            const output = execSync(`node wiggotscraper.js "${propertyId}"`, {
                encoding: 'utf-8',
                stdio: 'pipe'
            });

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

async function main() {
    log('\n🏠 BATCH WIGGOT HÍBRIDO - Login Auto + Control Manual', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();

    try {
        // PASO 1: Login automático
        log('🤖 PASO 1: Login automático en Wiggot...', 'blue');
        await page.goto('https://new.wiggot.com/search', { waitUntil: 'networkidle2' });
        await wait(5000);

        const inputs = await page.$$('input');
        if (inputs.length >= 2) {
            log('   ✍️  Ingresando credenciales...', 'cyan');
            await inputs[0].click();
            await page.keyboard.type(WIGGOT_EMAIL, { delay: 50 });
            await inputs[1].click();
            await page.keyboard.type(WIGGOT_PASSWORD, { delay: 50 });

            await wait(1000);

            const buttons = await page.$$('button');
            for (const button of buttons) {
                const text = await page.evaluate(el => el.innerText, button);
                if (text.includes('Iniciar')) {
                    log('   🖱️  Click en "Iniciar sesión"...', 'cyan');
                    await button.click();
                    break;
                }
            }

            await wait(10000);
            log('✅ Login exitoso\n', 'green');
        }

        // PASO 2: Control manual del usuario
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'magenta');
        log('👤 PASO 2: AHORA TOMAS TÚ EL CONTROL', 'magenta');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'magenta');

        log('📋 INSTRUCCIONES:', 'yellow');
        log('1. Ve al menú izquierdo y haz clic en "Bolsa"', 'cyan');
        log('2. En "¿Dónde quieres buscar?" escribe: Culiacán Sinaloa', 'cyan');
        log('3. En "¿Cuál es el presupuesto?" pon: $0 - $6,000,000', 'cyan');
        log('4. En "Tipo de propiedad" selecciona: Casa', 'cyan');
        log('5. Haz clic en la lupa de búsqueda', 'cyan');
        log('6. Espera a que carguen los resultados\n', 'cyan');

        const answer = await askUser('¿Ya hiciste la búsqueda y hay resultados? (escribe "si" cuando termines): ');

        if (answer !== 'si' && answer !== 'sí' && answer !== 's') {
            log('\n❌ Operación cancelada', 'red');
            await browser.close();
            process.exit(0);
        }

        // PASO 3: Script retoma control - Extraer propertyIds
        log('\n🤖 PASO 3: Script retoma control - Extrayendo propertyIds...', 'blue');

        await wait(3000);

        // Scroll para lazy loading
        log('   📜 Scroll para lazy loading...', 'cyan');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await wait(3000);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await wait(3000);
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(2000);

        // Screenshot para debug
        await page.screenshot({ path: 'batch-resultados-manuales.png', fullPage: true });
        log('   📸 Screenshot guardado: batch-resultados-manuales.png', 'cyan');

        const propertyIds = await page.evaluate(() => {
            const ids = [];
            const links = document.querySelectorAll('a[href*="property-detail"]');

            links.forEach(link => {
                const match = link.href.match(/property-detail\/([a-zA-Z0-9]+)/);
                if (match && match[1]) {
                    ids.push(match[1]);
                }
            });

            return [...new Set(ids)];
        });

        log(`✅ Encontradas ${propertyIds.length} propiedades\n`, 'green');

        if (propertyIds.length === 0) {
            log('❌ No se encontraron propiedades. Revisa screenshot: batch-resultados-manuales.png', 'red');
            log('\n⏸️  Dejando navegador abierto 30 segundos para debug...', 'yellow');
            await wait(30000);
            throw new Error('No se encontraron propiedades');
        }

        // Cerrar navegador
        await browser.close();

        const batchIds = propertyIds.slice(0, BATCH_SIZE);
        log(`📦 Procesando batch de ${batchIds.length} propiedades\n`, 'cyan');

        // PASO 4: Validar duplicados
        const crm = loadCRM();
        const newProperties = [];
        const duplicates = [];

        log('🤖 PASO 4: Validando duplicados contra CRM...', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

        batchIds.forEach((id, index) => {
            if (isDuplicate(id, crm)) {
                duplicates.push(id);
                log(`${index + 1}. ⚠️  ${id} - YA EXISTE (omitida)`, 'yellow');
            } else {
                newProperties.push(id);
                log(`${index + 1}. ✅ ${id} - NUEVA`, 'green');
            }
        });

        log('\n📋 RESUMEN:', 'bright');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');
        log(`✅ Nuevas: ${newProperties.length} propiedades`, 'green');
        log(`⚠️  Duplicadas: ${duplicates.length} propiedades`, 'yellow');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

        if (newProperties.length === 0) {
            log('🎉 No hay propiedades nuevas para procesar', 'cyan');
            process.exit(0);
        }

        // PASO 5: Scrapear propiedades nuevas
        log('🤖 PASO 5: Scrapeando propiedades nuevas...', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

        const successful = [];
        const failed = [];

        for (let i = 0; i < newProperties.length; i++) {
            const id = newProperties[i];
            log(`\n[${i + 1}/${newProperties.length}] Procesando ${id}...`, 'cyan');

            try {
                await scrapeProperty(id);
                log(`   ✅ Scraping completado`, 'green');

                log(`   🔧 Generando página HTML...`, 'cyan');
                generatePage(id);

                downloadPhotos(id);

                successful.push(id);
                log(`   ✅ Propiedad ${id} completada`, 'green');

            } catch (error) {
                log(`   ❌ Error: ${error.message}`, 'red');
                failed.push(id);
            }
        }

        // PASO 6: Commit
        log('\n\n📊 RESUMEN FINAL:', 'bright');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');
        log(`✅ Exitosas: ${successful.length}`, 'green');
        log(`❌ Fallidas: ${failed.length}`, 'red');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

        if (successful.length > 0) {
            log('💾 Creando commit...', 'blue');

            execSync('git add .', { stdio: 'inherit' });

            const commitMsg = `Add: Batch ${successful.length} propiedades Wiggot - Culiacán hasta $6M

Propiedades agregadas:
${successful.map((id, i) => `${i + 1}. ${id}`).join('\n')}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

            execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });

            log('\n✅ Commit creado exitosamente', 'green');
            log('🚀 Para publicar ejecuta: git push', 'cyan');
        }

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        if (browser.isConnected && browser.isConnected()) {
            await browser.close();
        }
        process.exit(1);
    }
}

main().catch(error => {
    log(`\n❌ Error fatal: ${error.message}`, 'red');
    process.exit(1);
});
