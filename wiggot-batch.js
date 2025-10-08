#!/usr/bin/env node

/**
 * WIGGOT BATCH SCRAPER - Procesa múltiples URLs desde archivo
 *
 * Uso:
 *   1. Crea archivo wiggot-urls.txt con URLs (una por línea)
 *   2. node wiggot-batch.js
 *
 * Funcionalidades:
 * - Lee URLs desde wiggot-urls.txt
 * - Detecta duplicados por ID (wiggot:pXXXXXX)
 * - Salta propiedades ya scrapeadas
 * - Procesa solo nuevas
 * - Muestra progreso en tiempo real
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const URLS_FILE = 'wiggot-urls.txt';
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

async function main() {
    console.log('');
    log('🚀', 'WIGGOT BATCH SCRAPER', colors.blue);
    console.log('');

    // Verificar que existe el archivo
    if (!fs.existsSync(URLS_FILE)) {
        log('❌', `Archivo ${URLS_FILE} no encontrado`, colors.red);
        console.log('');
        log('ℹ️', 'Crea el archivo wiggot-urls.txt con URLs (una por línea):', colors.yellow);
        console.log('');
        console.log('   Ejemplo:');
        console.log('   https://new.wiggot.com/search/property-detail/pABC123');
        console.log('   https://new.wiggot.com/search/property-detail/pDEF456');
        console.log('   https://new.wiggot.com/search/property-detail/pGHI789');
        console.log('');
        process.exit(1);
    }

    // Leer URLs del archivo
    const content = fs.readFileSync(URLS_FILE, 'utf8');
    const allUrls = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && line.includes('wiggot.com'));

    if (allUrls.length === 0) {
        log('⚠️', `No se encontraron URLs válidas en ${URLS_FILE}`, colors.yellow);
        process.exit(0);
    }

    log('📋', `Encontradas ${allUrls.length} URLs en ${URLS_FILE}`, colors.blue);
    console.log('');

    // Verificar duplicados
    const newUrls = [];
    const duplicateUrls = [];

    for (const url of allUrls) {
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
    log('  ', `Total en archivo: ${allUrls.length}`, colors.gray);
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
    console.log('');
}

main().catch(error => {
    console.error('');
    log('❌', `Error fatal: ${error.message}`, colors.red);
    console.error(error.stack);
    process.exit(1);
});
