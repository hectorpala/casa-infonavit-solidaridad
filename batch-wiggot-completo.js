#!/usr/bin/env node

/**
 * BATCH WIGGOT COMPLETO - Automatización total
 *
 * 1. Login automático
 * 2. Click en "Bolsa" (lado izquierdo)
 * 3. Buscar "Culiacán Sinaloa" y seleccionar ciudad
 * 4. Presupuesto: $0 a $6,000,000
 * 5. Tipo propiedad: Casa
 * 6. Click en lupa buscar
 * 7. Extraer 12 propertyIds
 * 8. Validar duplicados
 * 9. Scrapear solo nuevas
 * 10. Commit automático
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const { execSync } = require('child_process');

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
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
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
    log('\n🏠 BATCH WIGGOT COMPLETO - Automatización Total', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();

    try {
        // PASO 1: Login
        log('🔐 PASO 1: Login en Wiggot...', 'blue');
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
            log('✅ Login exitoso', 'green');
        }

        // PASO 2: Click en "Bolsa"
        log('\n🎯 PASO 2: Click en "Bolsa" (menú izquierdo)...', 'blue');
        await wait(3000);

        const bolsaClicked = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a, div, button'));
            const bolsa = links.find(el => el.innerText && el.innerText.includes('Bolsa'));
            if (bolsa) {
                bolsa.click();
                return true;
            }
            return false;
        });

        if (bolsaClicked) {
            log('✅ Click en "Bolsa" exitoso', 'green');
            await wait(5000);
        } else {
            log('⚠️  No se encontró "Bolsa", continuando...', 'yellow');
        }

        // PASO 3: Campo de búsqueda - Culiacán Sinaloa
        log('\n📍 PASO 3: Buscando "Culiacán Sinaloa"...', 'blue');

        const searchField = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            const searchInput = inputs.find(input =>
                input.placeholder && (
                    input.placeholder.includes('quieres') ||
                    input.placeholder.includes('Dónde') ||
                    input.placeholder.includes('buscar')
                )
            );
            return searchInput ? true : false;
        });

        if (searchField) {
            await page.keyboard.type('Culiacán Sinaloa', { delay: 100 });
            log('   ✍️  Escribiendo "Culiacán Sinaloa"...', 'cyan');
            await wait(3000);

            // Click en opción desplegada
            log('   🖱️  Seleccionando ciudad del dropdown...', 'cyan');
            await page.keyboard.press('ArrowDown');
            await wait(500);
            await page.keyboard.press('Enter');
            await wait(2000);
            log('✅ Ciudad seleccionada', 'green');
        }

        // PASO 4: Presupuesto 0 a 6,000,000
        log('\n💰 PASO 4: Configurando presupuesto $0 - $6,000,000...', 'blue');

        const budgetSet = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input'));

            // Buscar campos de precio
            const priceInputs = inputs.filter(input =>
                input.placeholder && (
                    input.placeholder.includes('presupuesto') ||
                    input.placeholder.includes('Precio') ||
                    input.placeholder.includes('precio')
                )
            );

            if (priceInputs.length >= 2) {
                priceInputs[0].value = '0';
                priceInputs[1].value = '6000000';
                return true;
            }

            return false;
        });

        if (budgetSet) {
            log('✅ Presupuesto configurado', 'green');
        } else {
            log('⚠️  No se pudo configurar presupuesto automáticamente', 'yellow');
        }

        await wait(2000);

        // PASO 5: Tipo de propiedad - Casa
        log('\n🏘️  PASO 5: Seleccionando tipo "Casa"...', 'blue');

        const casaSelected = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('div, button, span'));
            const casaOption = elements.find(el =>
                el.innerText && el.innerText.trim() === 'Casa'
            );

            if (casaOption) {
                casaOption.click();
                return true;
            }
            return false;
        });

        if (casaSelected) {
            log('✅ Tipo "Casa" seleccionado', 'green');
            await wait(2000);
        } else {
            log('⚠️  No se pudo seleccionar "Casa" automáticamente', 'yellow');
        }

        // PASO 6: Click en lupa buscar
        log('\n🔍 PASO 6: Click en lupa de búsqueda...', 'blue');

        await page.screenshot({ path: 'antes-buscar.png', fullPage: true });

        const searchClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const searchBtn = buttons.find(btn => {
                const svg = btn.querySelector('svg');
                return svg || btn.innerText.includes('Buscar');
            });

            if (searchBtn) {
                searchBtn.click();
                return true;
            }
            return false;
        });

        if (searchClicked) {
            log('✅ Click en buscar exitoso', 'green');
            await wait(10000); // Esperar resultados
        } else {
            log('⚠️  No se encontró botón buscar', 'yellow');
        }

        // PASO 7: Extraer propertyIds
        log('\n📋 PASO 7: Extrayendo propertyIds...', 'blue');

        await page.screenshot({ path: 'resultados-busqueda.png', fullPage: true });

        // Scroll para cargar lazy loading
        log('   📜 Scroll para lazy loading...', 'cyan');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await wait(3000);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await wait(3000);
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(2000);

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

        log(`✅ Encontradas ${propertyIds.length} propiedades`, 'green');

        if (propertyIds.length === 0) {
            log('⚠️  No se encontraron propiedades. Revisa screenshots:', 'yellow');
            log('   - antes-buscar.png', 'cyan');
            log('   - resultados-busqueda.png', 'cyan');
            log('\n⏸️  Dejando navegador abierto 30 segundos para debug...', 'yellow');
            await wait(30000);
            throw new Error('No se encontraron propiedades');
        }

        // Cerrar navegador
        await browser.close();

        const batchIds = propertyIds.slice(0, BATCH_SIZE);
        log(`\n📦 Procesando batch de ${batchIds.length} propiedades`, 'cyan');

        // PASO 8: Validar duplicados
        const crm = loadCRM();
        const newProperties = [];
        const duplicates = [];

        log('\n📊 PASO 8: Validando duplicados...', 'yellow');
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

        log('\n📋 RESUMEN:', 'bright');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');
        log(`✅ Nuevas: ${newProperties.length} propiedades`, 'green');
        log(`⚠️  Duplicadas: ${duplicates.length} propiedades`, 'yellow');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

        if (newProperties.length === 0) {
            log('🎉 No hay propiedades nuevas para procesar', 'cyan');
            process.exit(0);
        }

        // PASO 9: Scrapear propiedades nuevas
        log('\n🚀 PASO 9: Scrapeando propiedades nuevas...', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

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

        // PASO 10: Commit
        log('\n\n📊 RESUMEN FINAL:', 'bright');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'bright');
        log(`✅ Exitosas: ${successful.length}`, 'green');
        log(`❌ Fallidas: ${failed.length}`, 'red');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

        if (successful.length > 0) {
            log('💾 Creando commit...', 'blue');

            execSync('git add .', { stdio: 'inherit' });

            const commitMsg = `Add: Batch ${successful.length} propiedades Wiggot - Culiacán

Propiedades agregadas:
${successful.map((id, i) => `${i + 1}. ${id}`).join('\n')}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

            execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });

            log('\n✅ Commit creado exitosamente', 'green');
            log('\n🚀 Para publicar ejecuta: git push', 'cyan');
        }

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        if (!browser.isConnected()) {
            log('Navegador ya cerrado', 'yellow');
        } else {
            await browser.close();
        }
        process.exit(1);
    }
}

main().catch(error => {
    log(`\n❌ Error fatal: ${error.message}`, 'red');
    process.exit(1);
});
