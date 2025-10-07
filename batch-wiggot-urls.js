#!/usr/bin/env node

/**
 * BATCH WIGGOT URLS - Input de archivo JSON
 *
 * FLUJO:
 * 1. Lee archivo JSON con URLs: urls-batch.json
 * 2. Extrae propertyIds
 * 3. Valida duplicados contra CRM
 * 4. Scrapea solo nuevas
 * 5. Genera páginas y descarga fotos
 * 6. Auto-commit
 *
 * Formato urls-batch.json:
 * {
 *   "urls": [
 *     "https://new.wiggot.com/search/property-detail/ABC123",
 *     "https://new.wiggot.com/search/property-detail/XYZ789"
 *   ]
 * }
 */

const fs = require('fs');
const { execSync } = require('child_process');

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

function loadURLs() {
    try {
        const data = JSON.parse(fs.readFileSync('urls-batch.json', 'utf-8'));
        return data.urls || [];
    } catch (e) {
        log('❌ Error: No se pudo leer urls-batch.json', 'red');
        log('   Formato esperado: { "urls": ["https://new.wiggot.com/search/property-detail/..."] }', 'yellow');
        process.exit(1);
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

        // Descarga en paralelo con curl
        const downloadCommands = images.map((url, index) =>
            `curl -s "${url}" -o "${folderPath}/foto-${index + 1}.jpg"`
        ).join(' & ');

        try {
            execSync(downloadCommands + ' & wait', { stdio: 'pipe', shell: '/bin/bash' });
        } catch (e) {}

        log(`   ✅ ${images.length} fotos descargadas`, 'green');
        return true;
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        return false;
    }
}

async function main() {
    log('\n🏠 BATCH WIGGOT URLS - Procesamiento desde JSON', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'bright');

    // Cargar URLs
    const urls = loadURLs();
    log(`📋 URLs cargadas: ${urls.length}`, 'cyan');

    if (urls.length === 0) {
        log('\n❌ No hay URLs en urls-batch.json', 'red');
        process.exit(0);
    }

    // Extraer propertyIds
    log('\n🔍 Extrayendo propertyIds...', 'blue');
    const propertyIds = [];
    urls.forEach((url, i) => {
        const id = extractPropertyId(url);
        if (id) {
            propertyIds.push(id);
            log(`${i + 1}. ✅ ${id} <- ${url}`, 'green');
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
