#!/usr/bin/env node

/**
 * BATCH WIGGOT TIMER - Sin input manual
 *
 * FLUJO:
 * 1. 🤖 Login automático (10 seg)
 * 2. 👤 TÚ tienes 60 segundos para hacer búsqueda manual
 * 3. 🤖 Script extrae propertyIds automáticamente
 * 4. 🤖 Valida duplicados, scrapea, commit
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const { execSync } = require('child_process');

const WIGGOT_EMAIL = 'hector.test.1759769906975@gmail.com';
const WIGGOT_PASSWORD = 'Wiggot2025!drm36';
const BATCH_SIZE = 12;
const MANUAL_SEARCH_TIME = 60000; // 60 segundos

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

function loadCRM() {
    try {
        return JSON.parse(fs.readFileSync('crm-propiedades.json', 'utf-8'));
    } catch (e) {
        return [];
    }
}

function isDuplicate(propertyId, crm) {
    return crm.some(prop => prop.propertyId === propertyId);
}

async function scrapeProperty(propertyId) {
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
        execSync(`node generadorwiggot.js "wiggot-datos-${propertyId}.json"`, { stdio: 'inherit' });
        return true;
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
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
        const images = jsonData.data.images || [];

        log(`   📸 Descargando ${images.length} fotos...`, 'cyan');
        images.forEach((url, index) => {
            try {
                execSync(`curl -s "${url}" -o "${folderPath}/foto-${index + 1}.jpg"`, { stdio: 'pipe' });
            } catch (e) {}
        });
        log(`   ✅ ${images.length} fotos descargadas`, 'green');
        return true;
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        return false;
    }
}

async function main() {
    log('\n🏠 BATCH WIGGOT TIMER - 60 segundos para búsqueda manual', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();

    try {
        // PASO 1: Login
        log('🤖 PASO 1: Login automático...', 'blue');
        await page.goto('https://new.wiggot.com/search', { waitUntil: 'networkidle2' });
        await wait(5000);

        const inputs = await page.$$('input');
        if (inputs.length >= 2) {
            await inputs[0].click();
            await page.keyboard.type(WIGGOT_EMAIL, { delay: 50 });
            await inputs[1].click();
            await page.keyboard.type(WIGGOT_PASSWORD, { delay: 50 });
            await wait(1000);

            const buttons = await page.$$('button');
            for (const button of buttons) {
                const text = await page.evaluate(el => el.innerText, button);
                if (text.includes('Iniciar')) {
                    await button.click();
                    break;
                }
            }
            await wait(10000);
            log('✅ Login exitoso\n', 'green');
        }

        // PASO 2: Countdown 60 segundos
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'magenta');
        log('👤 PASO 2: TIENES 60 SEGUNDOS PARA HACER LA BÚSQUEDA', 'magenta');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'magenta');

        log('📋 PASOS:', 'yellow');
        log('1. Bolsa → Culiacán Sinaloa', 'cyan');
        log('2. Presupuesto: $0 - $6M', 'cyan');
        log('3. Tipo: Casa', 'cyan');
        log('4. Click en lupa buscar\n', 'cyan');

        // Countdown visual
        for (let i = 60; i > 0; i -= 10) {
            log(`⏰ ${i} segundos restantes...`, 'yellow');
            await wait(10000);
        }

        log('\n🤖 PASO 3: Script retoma control...', 'blue');

        // PASO 3: Extraer propertyIds - CON MÁS TIEMPO
        await wait(5000); // Más tiempo inicial

        log('   📜 Scroll lazy loading (lento para cargar imágenes)...', 'cyan');

        // Scroll muy lento para activar lazy load
        await page.evaluate(() => window.scrollTo(0, 300));
        await wait(3000);
        await page.evaluate(() => window.scrollTo(0, 600));
        await wait(3000);
        await page.evaluate(() => window.scrollTo(0, 1000));
        await wait(3000);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await wait(5000); // Más tiempo
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await wait(5000); // Más tiempo
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(5000); // Más tiempo para que recargue arriba

        await page.screenshot({ path: 'batch-final.png', fullPage: true });
        log('   📸 Screenshot: batch-final.png', 'cyan');

        // Intentar múltiples selectores
        const propertyIds = await page.evaluate(() => {
            const ids = [];

            // Selector 1: Links directos
            document.querySelectorAll('a[href*="property-detail"]').forEach(link => {
                const match = link.href.match(/property-detail\/([a-zA-Z0-9]+)/);
                if (match && match[1]) ids.push(match[1]);
            });

            // Selector 2: Buscar en todo el HTML (backup)
            if (ids.length === 0) {
                const html = document.body.innerHTML;
                const matches = html.matchAll(/property-detail\/([a-zA-Z0-9]+)/g);
                for (const match of matches) {
                    if (match[1]) ids.push(match[1]);
                }
            }

            return [...new Set(ids)];
        });

        log(`✅ Encontradas ${propertyIds.length} propiedades\n`, 'green');

        if (propertyIds.length === 0) {
            log('❌ No se encontraron propiedades', 'red');
            await wait(30000);
            throw new Error('Sin resultados');
        }

        await browser.close();

        const batchIds = propertyIds.slice(0, BATCH_SIZE);
        const crm = loadCRM();
        const newProperties = [];
        const duplicates = [];

        // PASO 4: Validar duplicados
        log('🤖 PASO 4: Validando duplicados...', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

        batchIds.forEach((id, i) => {
            if (isDuplicate(id, crm)) {
                duplicates.push(id);
                log(`${i + 1}. ⚠️  ${id} - DUPLICADA`, 'yellow');
            } else {
                newProperties.push(id);
                log(`${i + 1}. ✅ ${id} - NUEVA`, 'green');
            }
        });

        log(`\n✅ Nuevas: ${newProperties.length} | ⚠️  Duplicadas: ${duplicates.length}\n`, 'bright');

        if (newProperties.length === 0) {
            log('🎉 Sin propiedades nuevas', 'cyan');
            process.exit(0);
        }

        // PASO 5: Scrapear
        log('🤖 PASO 5: Scrapeando nuevas...', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

        const successful = [];
        const failed = [];

        for (let i = 0; i < newProperties.length; i++) {
            const id = newProperties[i];
            log(`\n[${i + 1}/${newProperties.length}] ${id}...`, 'cyan');

            try {
                await scrapeProperty(id);
                log(`   ✅ Scraping OK`, 'green');

                generatePage(id);
                log(`   ✅ Página generada`, 'green');

                downloadPhotos(id);

                successful.push(id);
            } catch (error) {
                log(`   ❌ Error: ${error.message}`, 'red');
                failed.push(id);
            }
        }

        // PASO 6: Commit
        log('\n\n📊 RESUMEN:', 'bright');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');
        log(`✅ Exitosas: ${successful.length}`, 'green');
        log(`❌ Fallidas: ${failed.length}`, 'red');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

        if (successful.length > 0) {
            log('💾 Creando commit...', 'blue');
            execSync('git add .', { stdio: 'inherit' });

            const commitMsg = `Add: Batch ${successful.length} propiedades Wiggot

${successful.map((id, i) => `${i + 1}. ${id}`).join('\n')}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

            execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
            log('\n✅ Commit creado', 'green');
            log('🚀 Ejecuta: git push', 'cyan');
        }

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        if (browser.isConnected && browser.isConnected()) await browser.close();
        process.exit(1);
    }
}

main().catch(error => {
    log(`\n❌ Fatal: ${error.message}`, 'red');
    process.exit(1);
});
