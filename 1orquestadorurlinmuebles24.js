#!/usr/bin/env node

/**
 * ORQUESTADOR DE SCRAPING BATCH - INMUEBLES24
 *
 * Lee URLs del JSON de depuración y ejecuta inmuebles24culiacanscraper.js
 * secuencialmente para cada URL nueva.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Configuración
const JSON_INPUT = '1depuracionurlinmuebles24.json';
const LOGS_DIR = 'logs';
const FALLAS_LOG = path.join(LOGS_DIR, 'fallas-scrape.txt');
const DELAY_MS = 2000; // Pausa entre ejecuciones

// Asegurar que existe el directorio de logs
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Carga y valida el JSON de entrada
 */
function loadUrls() {
    if (!fs.existsSync(JSON_INPUT)) {
        console.error(`❌ Error: No se encontró el archivo ${JSON_INPUT}`);
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(JSON_INPUT, 'utf8');
        const data = JSON.parse(content);

        if (!data.urls_nuevas || !Array.isArray(data.urls_nuevas)) {
            console.log('⚠️  El archivo no contiene un array "urls_nuevas" o está vacío.');
            process.exit(0);
        }

        if (data.urls_nuevas.length === 0) {
            console.log('ℹ️  No hay URLs nuevas para procesar.');
            process.exit(0);
        }

        return data.urls_nuevas;
    } catch (error) {
        console.error(`❌ Error al leer ${JSON_INPUT}: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Registra un fallo en el archivo de log
 */
function logFallo(url, error) {
    const timestamp = new Date().toISOString();
    const mensaje = `[${timestamp}] FALLO: ${url}\nError: ${error}\n${'─'.repeat(80)}\n`;

    try {
        fs.appendFileSync(FALLAS_LOG, mensaje, 'utf8');
    } catch (err) {
        console.error(`⚠️  No se pudo escribir en ${FALLAS_LOG}: ${err.message}`);
    }
}

/**
 * Pausa la ejecución
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ejecuta el scraper para una URL
 */
function executeScraper(url, index, total) {
    console.log('');
    console.log('═'.repeat(80));
    console.log(`🔄 PROCESANDO [${index}/${total}]`);
    console.log(`📍 URL: ${url}`);
    console.log('═'.repeat(80));
    console.log('');

    const result = spawnSync(
        'node',
        ['inmuebles24culiacanscraper.js', url, '--auto-confirm'],
        {
            cwd: __dirname,
            stdio: 'inherit', // Heredar stdin, stdout, stderr
            shell: true
        }
    );

    if (result.error) {
        throw new Error(`No se pudo ejecutar el scraper: ${result.error.message}`);
    }

    if (result.status !== 0) {
        throw new Error(`El scraper terminó con código de salida ${result.status}`);
    }

    return true;
}

/**
 * Main
 */
async function main() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🚀 ORQUESTADOR DE SCRAPING BATCH - INMUEBLES24             ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Cargar URLs
    const urls = loadUrls();
    console.log(`📊 Total de URLs a procesar: ${urls.length}`);
    console.log('');

    let exitos = 0;
    let fallos = 0;
    const urlsFallidas = [];

    // Procesar cada URL secuencialmente
    for (let i = 0; i < urls.length; i++) {
        const urlObj = urls[i];
        const url = urlObj.url || urlObj.urlNormalizada || urlObj;

        try {
            executeScraper(url, i + 1, urls.length);
            exitos++;
            console.log('');
            console.log(`✅ [${i + 1}/${urls.length}] Completado exitosamente`);
            console.log('');

            // Pausa antes de la siguiente (excepto en la última)
            if (i < urls.length - 1) {
                console.log(`⏳ Esperando ${DELAY_MS}ms antes de continuar...`);
                await delay(DELAY_MS);
            }

        } catch (error) {
            fallos++;
            urlsFallidas.push(url);

            console.log('');
            console.log(`❌ [${i + 1}/${urls.length}] FALLO: ${error.message}`);
            console.log('');

            logFallo(url, error.message);

            // Pausa incluso después de un fallo
            if (i < urls.length - 1) {
                console.log(`⏳ Esperando ${DELAY_MS}ms antes de continuar...`);
                await delay(DELAY_MS);
            }
        }
    }

    // Resumen final
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  📊 RESUMEN FINAL                                            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Éxitos: ${exitos}`);
    console.log(`❌ Fallos: ${fallos}`);
    console.log(`📊 Total procesadas: ${exitos + fallos} de ${urls.length}`);

    if (fallos > 0) {
        console.log('');
        console.log(`📝 URLs fallidas (${fallos}):`);
        urlsFallidas.forEach((url, idx) => {
            console.log(`   ${idx + 1}. ${url}`);
        });
        console.log('');
        console.log(`📄 Log completo de fallos: ${FALLAS_LOG}`);
    }

    console.log('');

    // Exit code según resultados
    process.exit(fallos > 0 ? 1 : 0);
}

// Ejecutar
main().catch(error => {
    console.error('');
    console.error('❌ ERROR CRÍTICO:', error.message);
    console.error('');
    process.exit(1);
});
