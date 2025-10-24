#!/usr/bin/env node

/**
 * Script para re-scrapear automáticamente propiedades con Google Geocoding API
 *
 * Proceso:
 * 1. Lee propiedades de inmuebles24-scraped-properties.json y mazatlan
 * 2. Excluye propiedades que ya tienen Google API (Casa en Cnop)
 * 3. Re-scrapea cada una con confirmación automática
 * 4. Genera reporte final con métricas
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
    culiacanFile: 'inmuebles24-scraped-properties.json',
    mazatlanFile: 'inmuebles24-scraped-properties-mazatlan.json',
    scraperScript: 'inmuebles24culiacanscraper.js',
    delayBetweenScrapes: 5000, // 5 segundos entre cada scraping
    excludeIds: ['146849328'], // Casa en Cnop ya tiene Google API
    logFile: 'batch-rescrape-log.json'
};

// Estado del proceso
const state = {
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    startTime: Date.now(),
    results: []
};

/**
 * Carga propiedades desde archivos JSON
 */
function loadProperties() {
    console.log('📚 Cargando propiedades...\n');

    const properties = [];

    // Culiacán
    if (fs.existsSync(CONFIG.culiacanFile)) {
        const culiacanProps = JSON.parse(fs.readFileSync(CONFIG.culiacanFile, 'utf8'));
        properties.push(...culiacanProps.map(p => ({ ...p, ciudad: 'Culiacán' })));
        console.log(`   ✅ Culiacán: ${culiacanProps.length} propiedades`);
    }

    // Mazatlán
    if (fs.existsSync(CONFIG.mazatlanFile)) {
        const mazatlanProps = JSON.parse(fs.readFileSync(CONFIG.mazatlanFile, 'utf8'));
        properties.push(...mazatlanProps.map(p => ({ ...p, ciudad: 'Mazatlán' })));
        console.log(`   ✅ Mazatlán: ${mazatlanProps.length} propiedades`);
    }

    // Filtrar excluidas
    const filtered = properties.filter(p => !CONFIG.excludeIds.includes(p.propertyId));

    console.log(`\n   📊 Total: ${properties.length} propiedades`);
    console.log(`   ⚠️  Excluidas: ${properties.length - filtered.length} (ya tienen Google API)`);
    console.log(`   🎯 Para procesar: ${filtered.length} propiedades\n`);

    return filtered;
}

/**
 * Re-scrapea una propiedad individual
 */
function rescrapeProperty(property) {
    return new Promise((resolve) => {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🔄 [${state.processed + 1}/${state.total}] ${property.title}`);
        console.log(`   🆔 ID: ${property.propertyId}`);
        console.log(`   🏙️  Ciudad: ${property.ciudad}`);
        console.log(`   🔗 URL: ${property.url}`);
        console.log(`${'='.repeat(80)}\n`);

        const startTime = Date.now();

        // Spawn scraper process con stdin automático
        const scraper = spawn('node', [CONFIG.scraperScript, property.url], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        // Capturar stdout
        scraper.stdout.on('data', (data) => {
            const text = data.toString();
            process.stdout.write(text);
            output += text;
        });

        // Capturar stderr
        scraper.stderr.on('data', (data) => {
            const text = data.toString();
            process.stderr.write(text);
            errorOutput += text;
        });

        // Enviar confirmación automática de ciudad (Enter)
        setTimeout(() => {
            scraper.stdin.write('\n');
        }, 3000);

        // Timeout de 5 minutos por propiedad
        const timeout = setTimeout(() => {
            console.log('\n⚠️  Timeout - Matando proceso...');
            scraper.kill();
        }, 300000);

        scraper.on('close', (code) => {
            clearTimeout(timeout);

            const duration = Date.now() - startTime;
            const durationMin = (duration / 1000 / 60).toFixed(1);

            const result = {
                propertyId: property.propertyId,
                title: property.title,
                ciudad: property.ciudad,
                url: property.url,
                duration: duration,
                exitCode: code,
                success: code === 0,
                timestamp: new Date().toISOString()
            };

            state.results.push(result);
            state.processed++;

            if (code === 0) {
                state.success++;
                console.log(`\n✅ Completado en ${durationMin} min`);
            } else {
                state.failed++;
                console.log(`\n❌ Falló con código ${code} después de ${durationMin} min`);
            }

            // Mostrar progreso
            const remaining = state.total - state.processed;
            const avgDuration = duration;
            const estimatedRemaining = (remaining * avgDuration / 1000 / 60).toFixed(0);

            console.log(`\n📊 Progreso: ${state.processed}/${state.total} (${(state.processed/state.total*100).toFixed(1)}%)`);
            console.log(`   ✅ Exitosos: ${state.success}`);
            console.log(`   ❌ Fallidos: ${state.failed}`);
            console.log(`   ⏱️  Tiempo estimado restante: ~${estimatedRemaining} minutos\n`);

            resolve(result);
        });
    });
}

/**
 * Delay entre scrapes
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Guarda log de resultados
 */
function saveLog() {
    const log = {
        ...state,
        endTime: Date.now(),
        totalDuration: Date.now() - state.startTime
    };

    fs.writeFileSync(CONFIG.logFile, JSON.stringify(log, null, 2), 'utf8');
    console.log(`\n📝 Log guardado en: ${CONFIG.logFile}`);
}

/**
 * Genera reporte final
 */
function printFinalReport() {
    const totalDuration = Date.now() - state.startTime;
    const totalMin = (totalDuration / 1000 / 60).toFixed(1);
    const avgDuration = (totalDuration / state.processed / 1000 / 60).toFixed(1);

    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📊 REPORTE FINAL - BATCH RE-SCRAPING');
    console.log(`${'='.repeat(80)}\n`);

    console.log(`✅ Propiedades exitosas: ${state.success}/${state.total} (${(state.success/state.total*100).toFixed(1)}%)`);
    console.log(`❌ Propiedades fallidas: ${state.failed}/${state.total} (${(state.failed/state.total*100).toFixed(1)}%)`);
    console.log(`⏱️  Tiempo total: ${totalMin} minutos`);
    console.log(`⏱️  Tiempo promedio por propiedad: ${avgDuration} minutos`);

    if (state.failed > 0) {
        console.log(`\n❌ Propiedades que fallaron:`);
        state.results
            .filter(r => !r.success)
            .forEach(r => {
                console.log(`   - [${r.propertyId}] ${r.title} (${r.ciudad})`);
                console.log(`     URL: ${r.url}`);
            });
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ Proceso completado. Ahora ejecuta:`);
    console.log(`   node geo-monitor.js --alert`);
    console.log(`${'='.repeat(80)}\n`);
}

/**
 * Main
 */
async function main() {
    console.log('\n🚀 BATCH RE-SCRAPING CON GOOGLE GEOCODING API\n');
    console.log('Este proceso tomará aproximadamente 1.5-2.5 horas.\n');

    // Cargar propiedades
    const properties = loadProperties();
    state.total = properties.length;

    if (state.total === 0) {
        console.log('⚠️  No hay propiedades para procesar.');
        process.exit(0);
    }

    console.log(`⏰ Hora de inicio: ${new Date().toLocaleTimeString()}\n`);
    console.log('Presiona Ctrl+C para cancelar en cualquier momento.\n');

    // Esperar 5 segundos antes de empezar
    console.log('Iniciando en 5 segundos...\n');
    await delay(5000);

    // Procesar cada propiedad
    for (const property of properties) {
        await rescrapeProperty(property);

        // Delay entre scrapes
        if (state.processed < state.total) {
            console.log(`\n⏸️  Esperando ${CONFIG.delayBetweenScrapes/1000} segundos antes de la siguiente...\n`);
            await delay(CONFIG.delayBetweenScrapes);
        }
    }

    // Guardar log y mostrar reporte
    saveLog();
    printFinalReport();

    process.exit(state.failed > 0 ? 1 : 0);
}

// Manejar Ctrl+C
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Proceso cancelado por el usuario.');
    saveLog();
    printFinalReport();
    process.exit(1);
});

// Ejecutar
main().catch(error => {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error.stack);
    saveLog();
    process.exit(1);
});
