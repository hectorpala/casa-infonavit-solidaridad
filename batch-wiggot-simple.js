#!/usr/bin/env node

/**
 * BATCH WIGGOT SIMPLE - Extrae IDs desde clipboard/input
 *
 * FLUJO:
 * 1. Usuario copia URLs de Wiggot manualmente
 * 2. Script extrae propertyIds de las URLs
 * 3. Valida duplicados contra CRM
 * 4. Scrapea solo nuevas
 * 5. Auto-commit
 */

const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

const BATCH_SIZE = 12;

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

function extractPropertyId(url) {
    const match = url.match(/property-detail\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
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

function askInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(`${colors.cyan}${question}${colors.reset}`, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function main() {
    log('\n🏠 BATCH WIGGOT SIMPLE - Input Manual de URLs', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

    log('📋 INSTRUCCIONES:', 'yellow');
    log('1. Ve a https://new.wiggot.com/search', 'cyan');
    log('2. Haz tu búsqueda: Culiacán, Casas, $0-$6M', 'cyan');
    log('3. Copia las URLs de las propiedades que quieres scrapear', 'cyan');
    log('4. Pégalas aquí (una por línea)', 'cyan');
    log('5. Presiona Enter 2 veces cuando termines\n', 'cyan');

    const urls = [];
    log('🔗 Pega URLs (Enter 2 veces para terminar):\n', 'magenta');

    while (true) {
        const input = await askInput('URL: ');
        if (!input) break;
        urls.push(input);
        log(`   ✅ Agregada (${urls.length})`, 'green');
    }

    if (urls.length === 0) {
        log('\n❌ No se ingresaron URLs', 'red');
        process.exit(0);
    }

    // Extraer propertyIds
    log(`\n🔍 Extrayendo propertyIds de ${urls.length} URLs...`, 'blue');
    const propertyIds = [];
    urls.forEach((url, i) => {
        const id = extractPropertyId(url);
        if (id) {
            propertyIds.push(id);
            log(`${i + 1}. ✅ ${id}`, 'green');
        } else {
            log(`${i + 1}. ❌ URL inválida: ${url}`, 'red');
        }
    });

    if (propertyIds.length === 0) {
        log('\n❌ No se extrajeron IDs válidos', 'red');
        process.exit(0);
    }

    const batchIds = propertyIds.slice(0, BATCH_SIZE);
    const crm = loadCRM();
    const newProperties = [];
    const duplicates = [];

    // Validar duplicados
    log('\n🤖 Validando duplicados contra CRM...', 'blue');
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

    // Scrapear
    log('🤖 Scrapeando nuevas propiedades...', 'blue');
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

    // Commit
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
}

main().catch(error => {
    log(`\n❌ Fatal: ${error.message}`, 'red');
    process.exit(1);
});
