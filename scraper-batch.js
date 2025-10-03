#!/usr/bin/env node

/**
 * SCRAPER BATCH - MÚLTIPLES PROPIEDADES
 *
 * Este script procesa múltiples URLs de propiedades.com de forma secuencial
 * Usa: node scraper-batch.js
 *
 * Configura las URLs en el array URLS_TO_SCRAPE abajo
 */

const { execSync } = require('child_process');
const fs = require('fs');

// ============================================
// CONFIGURACIÓN - CARGADA DESDE urls-para-batch-*.js
// ============================================
const URLS_TO_SCRAPE = require('./urls-para-batch-1759460786164.js');

// ============================================
// PROCESO BATCH
// ============================================

async function procesarBatch() {
    console.log('\n🚀 SCRAPER BATCH - MÚLTIPLES PROPIEDADES\n');
    console.log(`📊 Total de URLs a procesar: ${URLS_TO_SCRAPE.length}\n`);

    if (URLS_TO_SCRAPE.length === 0) {
        console.error('❌ No hay URLs configuradas.');
        console.log('\n📝 Edita scraper-batch.js y agrega URLs en el array URLS_TO_SCRAPE');
        process.exit(1);
    }

    const resultados = {
        exitosos: [],
        fallidos: []
    };

    for (let i = 0; i < URLS_TO_SCRAPE.length; i++) {
        const url = URLS_TO_SCRAPE[i];
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📍 Procesando ${i + 1}/${URLS_TO_SCRAPE.length}`);
        console.log(`🔗 URL: ${url}`);
        console.log(`${'='.repeat(80)}\n`);

        try {
            // Ejecutar scraper-y-publicar.js para esta URL
            execSync(`node scraper-y-publicar.js "${url}"`, {
                stdio: 'inherit',
                timeout: 120000 // 2 minutos timeout
            });

            resultados.exitosos.push({
                url,
                index: i + 1
            });

            console.log(`\n✅ Propiedad ${i + 1}/${URLS_TO_SCRAPE.length} completada exitosamente\n`);

            // Pausa de 3 segundos entre scrapes (evitar rate limiting)
            if (i < URLS_TO_SCRAPE.length - 1) {
                console.log('⏳ Esperando 3 segundos antes de continuar...\n');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

        } catch (err) {
            console.error(`\n❌ Error procesando propiedad ${i + 1}/${URLS_TO_SCRAPE.length}`);
            console.error(`   URL: ${url}`);
            console.error(`   Error: ${err.message}\n`);

            resultados.fallidos.push({
                url,
                index: i + 1,
                error: err.message
            });

            // Continuar con la siguiente URL a pesar del error
            console.log('⏭️  Continuando con la siguiente propiedad...\n');
        }
    }

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL DEL BATCH');
    console.log('='.repeat(80));
    console.log(`\n✅ Exitosos: ${resultados.exitosos.length}/${URLS_TO_SCRAPE.length}`);
    console.log(`❌ Fallidos: ${resultados.fallidos.length}/${URLS_TO_SCRAPE.length}\n`);

    if (resultados.exitosos.length > 0) {
        console.log('✅ Propiedades scrapeadas exitosamente:');
        resultados.exitosos.forEach(r => {
            console.log(`   ${r.index}. ${r.url}`);
        });
        console.log('');
    }

    if (resultados.fallidos.length > 0) {
        console.log('❌ Propiedades con errores:');
        resultados.fallidos.forEach(r => {
            console.log(`   ${r.index}. ${r.url}`);
            console.log(`       Error: ${r.error}`);
        });
        console.log('');
    }

    // Guardar resumen en JSON
    const resumenFile = `batch-resumen-${Date.now()}.json`;
    fs.writeFileSync(resumenFile, JSON.stringify({
        fecha: new Date().toISOString(),
        total: URLS_TO_SCRAPE.length,
        exitosos: resultados.exitosos.length,
        fallidos: resultados.fallidos.length,
        detalles: resultados
    }, null, 2));

    console.log(`📄 Resumen guardado en: ${resumenFile}\n`);

    if (resultados.exitosos.length > 0) {
        console.log('🎯 Próximos pasos:');
        console.log('   1. Revisar propiedades generadas');
        console.log('   2. Insertar tarjetas en culiacan/index.html');
        console.log('   3. Publicar: dile "publica ya"\n');
    }

    // Exit code según resultados
    process.exit(resultados.fallidos.length > 0 ? 1 : 0);
}

// Ejecutar
procesarBatch().catch(err => {
    console.error('❌ Error fatal en batch:', err);
    process.exit(1);
});
