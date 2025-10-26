#!/usr/bin/env node

/**
 * DEPURADOR Y PROCESADOR BATCH - INMUEBLES24.COM
 *
 * Lee URLs nuevas del auditor y las procesa una por una con inmuebles24culiacanscraper.js
 *
 * PROCESO:
 * 1. Lee archivo de auditoría (auditoria-*.json)
 * 2. Extrae solo urls_nuevas (sin duplicados)
 * 3. Genera JSON limpio para el lote pendiente
 * 4. Itera y ejecuta scraper para cada URL
 * 5. Registra progreso y errores
 *
 * USO:
 *   node 1depuracioninmuebles24.js auditoria-rango-ampliado.json
 *   node 1depuracioninmuebles24.js auditoria-rango-ampliado.json --dry-run
 *   node 1depuracioninmuebles24.js auditoria-rango-ampliado.json --concurrency 3
 *
 * FLAGS:
 *   --dry-run: Solo genera el JSON limpio sin ejecutar scraping
 *   --concurrency N: Número de scrapers en paralelo (default: 1)
 *   --start-from N: Comenzar desde la URL N (útil si se interrumpe)
 *
 * SALIDA:
 *   - lote-pendiente-{timestamp}.json: URLs limpias listas para procesar
 *   - lote-progreso-{timestamp}.json: Estado de cada URL procesada
 *   - Console log con progreso en tiempo real
 */

const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
    scraperScript: './inmuebles24culiacanscraper.js',
    concurrency: 1, // Número de scrapers en paralelo
    delayBetweenRuns: 2000, // Delay entre cada scraper (ms)
    timeout: 600000 // 10 minutos por propiedad
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Lee archivo de auditoría y extrae URLs nuevas
 */
function loadAuditResults(auditFile) {
    if (!fs.existsSync(auditFile)) {
        throw new Error(`Archivo de auditoría no encontrado: ${auditFile}`);
    }

    const content = fs.readFileSync(auditFile, 'utf8');
    const audit = JSON.parse(content);

    return audit;
}

/**
 * Genera JSON limpio con URLs pendientes
 */
function generateCleanBatch(audit) {
    const timestamp = new Date().toISOString();

    const batch = {
        generadoEn: timestamp,
        auditoriaOrigen: audit.baseDatos.archivo,
        totalUrlsNuevas: audit.loteAnalizado.urlsNuevas,
        totalUrlsExistentes: audit.loteAnalizado.urlsExistentes,
        propiedadesPendientes: audit.urls_nuevas.map((item, index) => ({
            index: index + 1,
            propertyId: item.propertyId,
            url: item.urlNormalizada,
            claveCanonica: item.claveCanonica,
            status: 'pending',
            intentos: 0,
            ultimoIntento: null,
            error: null
        }))
    };

    return batch;
}

/**
 * Guarda batch limpio
 */
function saveBatch(batch, outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(batch, null, 2), 'utf8');
    console.log(`💾 Lote limpio guardado en: ${outputFile}`);
    console.log('');
}

/**
 * Ejecuta scraper para una URL
 */
function executeScraper(url, propertyId) {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 Iniciando scraper para Property ID: ${propertyId}`);
        console.log(`   URL: ${url}`);

        const startTime = Date.now();

        const scraper = spawn('node', [CONFIG.scraperScript, url, '--auto-confirm'], {
            cwd: __dirname,
            stdio: 'inherit' // Mostrar output en consola
        });

        scraper.on('close', (code) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            if (code === 0) {
                console.log(`✅ Completado en ${duration}s - Property ID: ${propertyId}`);
                resolve({
                    success: true,
                    propertyId,
                    url,
                    duration: parseFloat(duration),
                    exitCode: code
                });
            } else {
                console.log(`❌ Error (exit code ${code}) - Property ID: ${propertyId}`);
                reject({
                    success: false,
                    propertyId,
                    url,
                    duration: parseFloat(duration),
                    exitCode: code,
                    error: `Scraper exited with code ${code}`
                });
            }
        });

        scraper.on('error', (error) => {
            console.log(`❌ Error al ejecutar scraper: ${error.message}`);
            reject({
                success: false,
                propertyId,
                url,
                error: error.message
            });
        });

        // Timeout
        setTimeout(() => {
            scraper.kill('SIGTERM');
            reject({
                success: false,
                propertyId,
                url,
                error: 'Timeout excedido (10 minutos)'
            });
        }, CONFIG.timeout);
    });
}

/**
 * Procesa batch de URLs
 */
async function processBatch(batch, startFrom = 1) {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🔄 PROCESADOR BATCH - INMUEBLES24.COM                      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📊 Total propiedades a procesar: ${batch.propiedadesPendientes.length}`);
    console.log(`🚀 Comenzando desde: #${startFrom}`);
    console.log(`⚙️  Concurrencia: ${CONFIG.concurrency}`);
    console.log('');

    const results = {
        timestamp: new Date().toISOString(),
        totalPropiedades: batch.propiedadesPendientes.length,
        procesadas: 0,
        exitosas: 0,
        fallidas: 0,
        detalles: []
    };

    // Filtrar desde startFrom
    const toProcess = batch.propiedadesPendientes.slice(startFrom - 1);

    for (let i = 0; i < toProcess.length; i++) {
        const prop = toProcess[i];

        console.log('');
        console.log('─'.repeat(60));
        console.log(`📦 PROPIEDAD ${prop.index} de ${batch.propiedadesPendientes.length}`);
        console.log('─'.repeat(60));

        try {
            const result = await executeScraper(prop.url, prop.propertyId);

            results.procesadas++;
            results.exitosas++;
            results.detalles.push({
                ...result,
                index: prop.index,
                timestamp: new Date().toISOString()
            });

            // Delay antes del siguiente
            if (i < toProcess.length - 1) {
                console.log(`⏳ Esperando ${CONFIG.delayBetweenRuns}ms antes del siguiente...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRuns));
            }

        } catch (error) {
            results.procesadas++;
            results.fallidas++;
            results.detalles.push({
                ...error,
                index: prop.index,
                timestamp: new Date().toISOString()
            });

            console.log(`⚠️  Continuando con la siguiente propiedad...`);

            // Delay antes del siguiente (incluso si hay error)
            if (i < toProcess.length - 1) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRuns));
            }
        }
    }

    return results;
}

/**
 * Guarda resultados del procesamiento
 */
function saveResults(results, outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf8');
    console.log('');
    console.log('═'.repeat(60));
    console.log('📊 RESUMEN FINAL');
    console.log('═'.repeat(60));
    console.log(`✅ Exitosas: ${results.exitosas}`);
    console.log(`❌ Fallidas: ${results.fallidas}`);
    console.log(`📊 Total procesadas: ${results.procesadas} de ${results.totalPropiedades}`);
    console.log('');
    console.log(`💾 Resultados guardados en: ${outputFile}`);
    console.log('');
}

// ============================================
// EJECUCIÓN DESDE CLI
// ============================================

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('');
        console.log('❌ Error: Debes proporcionar un archivo de auditoría');
        console.log('');
        console.log('USO:');
        console.log('  node 1depuracioninmuebles24.js auditoria-rango-ampliado.json');
        console.log('  node 1depuracioninmuebles24.js auditoria-rango-ampliado.json --dry-run');
        console.log('  node 1depuracioninmuebles24.js auditoria-rango-ampliado.json --start-from 5');
        console.log('');
        console.log('FLAGS:');
        console.log('  --dry-run          Solo genera JSON limpio sin scrapear');
        console.log('  --start-from N     Comenzar desde la URL N');
        console.log('  --concurrency N    Scrapers en paralelo (default: 1)');
        console.log('');
        process.exit(1);
    }

    const auditFile = args[0];
    const dryRun = args.includes('--dry-run');

    let startFrom = 1;
    const startFromIndex = args.indexOf('--start-from');
    if (startFromIndex !== -1 && args[startFromIndex + 1]) {
        startFrom = parseInt(args[startFromIndex + 1], 10) || 1;
    }

    let concurrency = CONFIG.concurrency;
    const concurrencyIndex = args.indexOf('--concurrency');
    if (concurrencyIndex !== -1 && args[concurrencyIndex + 1]) {
        concurrency = parseInt(args[concurrencyIndex + 1], 10) || CONFIG.concurrency;
        CONFIG.concurrency = concurrency;
    }

    // Ejecutar
    (async () => {
        try {
            // 1. Leer auditoría
            console.log('📂 Cargando archivo de auditoría...');
            const audit = loadAuditResults(auditFile);
            console.log(`   ✅ ${audit.loteAnalizado.urlsNuevas} URLs nuevas encontradas`);
            console.log('');

            // 2. Generar batch limpio
            const timestamp = Date.now();
            const batch = generateCleanBatch(audit);
            const batchFile = `lote-pendiente-${timestamp}.json`;
            saveBatch(batch, batchFile);

            if (dryRun) {
                console.log('🏁 Modo --dry-run: Solo se generó el JSON limpio');
                console.log('   Para procesar el lote, ejecuta sin --dry-run');
                process.exit(0);
            }

            // 3. Procesar batch
            const results = await processBatch(batch, startFrom);

            // 4. Guardar resultados
            const resultsFile = `lote-progreso-${timestamp}.json`;
            saveResults(results, resultsFile);

            // Exit code según resultados
            const exitCode = results.fallidas > 0 ? 1 : 0;
            process.exit(exitCode);

        } catch (error) {
            console.error('');
            console.error('❌ ERROR:', error.message);
            console.error('');
            process.exit(1);
        }
    })();
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

module.exports = {
    loadAuditResults,
    generateCleanBatch,
    saveBatch,
    executeScraper,
    processBatch
};
