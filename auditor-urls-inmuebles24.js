#!/usr/bin/env node

/**
 * AUDITOR DE URLs - INMUEBLES24
 *
 * Herramienta para auditar lotes de URLs extraídas, detectar duplicados,
 * URLs tumbadas, y mantener histórico de corridas.
 *
 * USO:
 *   node auditor-urls-inmuebles24.js urls-inmuebles24-2025-10-26-16-35-21-valid.txt
 *   node auditor-urls-inmuebles24.js urls-inmuebles24-2025-10-26-16-35-21-valid.txt --auto-discard
 *   node auditor-urls-inmuebles24.js urls-inmuebles24-2025-10-26-16-35-21-valid.txt --skip-http-check
 *
 * FLAGS:
 *   --auto-discard    Descarta automáticamente URLs tumbadas (404, redirect home, sin título)
 *   --skip-http-check Omite verificación HTTP (más rápido pero menos preciso)
 *
 * SALIDA:
 *   - JSON: audit-YYYY-MM-DD-HH-MM-SS.json (resultados detallados)
 *   - CSV: audit-history.csv (histórico acumulativo)
 *   - TXT: audit-YYYY-MM-DD-HH-MM-SS-nuevas.txt (URLs listas para scrapear)
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
    scrapedPropertiesDB: 'inmuebles24-scraped-properties.json',
    auditHistoryCSV: 'audit-history.csv',
    timeout: 8000,
    batchSize: 5
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Extrae Property ID desde URL de Inmuebles24
 */
function extractPropertyId(url) {
    const match = url.match(/-(\d+)\.html/);
    return match ? match[1] : null;
}

/**
 * Carga base de datos de propiedades scrapeadas
 */
function loadScrapedPropertiesDB() {
    if (!fs.existsSync(CONFIG.scrapedPropertiesDB)) {
        console.log(`⚠️  Base de datos no encontrada: ${CONFIG.scrapedPropertiesDB}`);
        console.log('   Creando base de datos vacía...');
        fs.writeFileSync(CONFIG.scrapedPropertiesDB, JSON.stringify([], null, 2), 'utf8');
        return [];
    }

    const data = JSON.parse(fs.readFileSync(CONFIG.scrapedPropertiesDB, 'utf8'));
    return data;
}

/**
 * Verifica si una URL ya fue scrapeada (duplicado)
 */
function isDuplicate(propertyId, scrapedProperties) {
    if (!propertyId) return false;
    return scrapedProperties.some(prop => prop.propertyId === propertyId);
}

/**
 * Obtiene información del duplicado
 */
function getDuplicateInfo(propertyId, scrapedProperties) {
    return scrapedProperties.find(prop => prop.propertyId === propertyId);
}

// ============================================
// VERIFICACIÓN HTTP
// ============================================

/**
 * Verifica estado de URLs usando HEAD requests
 * Detecta URLs tumbadas (404, redirect al home, etc.)
 */
async function verifyUrls(urls, skipHttpCheck = false) {
    if (skipHttpCheck) {
        console.log('⚠️  Verificación HTTP omitida (--skip-http-check)');
        console.log('');
        return urls.map(url => ({
            url,
            status: 'unknown',
            statusCode: null,
            isTaken: false
        }));
    }

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 VERIFICACIÓN HTTP DE URLs                                ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📊 Verificando ${urls.length} URLs...`);
    console.log('');

    const results = [];
    const batches = [];

    for (let i = 0; i < urls.length; i += CONFIG.batchSize) {
        batches.push(urls.slice(i, i + CONFIG.batchSize));
    }

    let processed = 0;

    for (const batch of batches) {
        const promises = batch.map(async (url) => {
            try {
                const response = await axios.head(url, {
                    timeout: CONFIG.timeout,
                    maxRedirects: 5,
                    validateStatus: (status) => status < 500,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                        'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    }
                });

                // Verificar si redirigió al home (propiedad removida)
                const finalUrl = response.request?.res?.responseUrl || url;
                const isHomePage = finalUrl.endsWith('inmuebles24.com/') ||
                                  finalUrl === 'https://www.inmuebles24.com/';

                let status = 'ok';
                let isTaken = false;

                if (response.status === 404) {
                    status = 'not-found';
                    isTaken = true;
                } else if (isHomePage) {
                    status = 'redirect-home';
                    isTaken = true;
                } else if (response.status === 403) {
                    status = 'blocked';
                    isTaken = false; // Cloudflare block, probablemente válida
                }

                return {
                    url,
                    status,
                    statusCode: response.status,
                    isTaken
                };

            } catch (error) {
                // Error de red o timeout
                let isTaken = false;
                let status = 'error';

                if (error.response?.status === 404) {
                    status = 'not-found';
                    isTaken = true;
                }

                return {
                    url,
                    status,
                    statusCode: error.response?.status || 0,
                    isTaken
                };
            }
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);

        processed += batch.length;
        process.stdout.write(`\r   ⏳ Progreso: ${processed}/${urls.length} URLs verificadas...`);
    }

    console.log('\n');

    const taken = results.filter(r => r.isTaken).length;
    const ok = results.filter(r => r.status === 'ok').length;
    const blocked = results.filter(r => r.status === 'blocked').length;
    const errors = results.filter(r => r.status === 'error').length;

    console.log('📊 RESULTADOS VERIFICACIÓN HTTP:');
    console.log(`   ✅ URLs OK: ${ok}`);
    console.log(`   🔒 URLs bloqueadas (Cloudflare): ${blocked}`);
    console.log(`   ❌ URLs tumbadas (404/redirect): ${taken}`);
    console.log(`   ⚠️  Errores de red: ${errors}`);
    console.log('');

    return results;
}

// ============================================
// AUDITORÍA PRINCIPAL
// ============================================

/**
 * Audita un lote de URLs contra la base de datos
 */
async function auditUrls(urlsFile, autoDiscard = false, skipHttpCheck = false) {
    const startTime = new Date();

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  📊 AUDITOR DE URLs - INMUEBLES24                            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📁 Archivo de entrada: ${urlsFile}`);
    console.log(`⚙️  Auto-descartar URLs tumbadas: ${autoDiscard ? 'SÍ' : 'NO'}`);
    console.log(`⚙️  Verificación HTTP: ${skipHttpCheck ? 'OMITIDA' : 'ACTIVA'}`);
    console.log('');

    // Leer URLs del archivo
    if (!fs.existsSync(urlsFile)) {
        throw new Error(`Archivo no encontrado: ${urlsFile}`);
    }

    const urlsContent = fs.readFileSync(urlsFile, 'utf8');
    const urls = urlsContent.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.startsWith('http'));

    console.log(`📊 URLs cargadas: ${urls.length}`);
    console.log('');

    // Cargar base de datos de propiedades scrapeadas
    console.log('📚 Cargando base de datos de propiedades scrapeadas...');
    const scrapedProperties = loadScrapedPropertiesDB();
    console.log(`   ✅ ${scrapedProperties.length} propiedades en base de datos`);
    console.log('');

    // Clasificar URLs por duplicado
    console.log('🔍 Clasificando URLs...');
    const classification = {
        nuevas: [],
        duplicadas: []
    };

    for (const url of urls) {
        const propertyId = extractPropertyId(url);
        if (!propertyId) {
            console.log(`   ⚠️  URL sin ID de propiedad: ${url.substring(0, 80)}...`);
            continue;
        }

        if (isDuplicate(propertyId, scrapedProperties)) {
            const duplicateInfo = getDuplicateInfo(propertyId, scrapedProperties);
            classification.duplicadas.push({
                url,
                propertyId,
                duplicateInfo
            });
        } else {
            classification.nuevas.push({
                url,
                propertyId
            });
        }
    }

    console.log(`   ✅ URLs nuevas: ${classification.nuevas.length}`);
    console.log(`   ⚠️  URLs duplicadas: ${classification.duplicadas.length}`);
    console.log('');

    // Verificar URLs nuevas por HTTP
    let httpResults = [];
    if (classification.nuevas.length > 0) {
        const nuevasUrls = classification.nuevas.map(item => item.url);
        httpResults = await verifyUrls(nuevasUrls, skipHttpCheck);
    }

    // Combinar clasificación con verificación HTTP
    classification.nuevas = classification.nuevas.map((item, index) => {
        const httpResult = httpResults[index] || { status: 'unknown', statusCode: null, isTaken: false };
        return {
            ...item,
            httpStatus: httpResult.status,
            httpStatusCode: httpResult.statusCode,
            isTaken: httpResult.isTaken
        };
    });

    // Aplicar auto-discard si está habilitado
    let descartadas = [];
    if (autoDiscard) {
        console.log('🗑️  AUTO-DESCARTE ACTIVADO...');
        descartadas = classification.nuevas.filter(item => item.isTaken);
        classification.nuevas = classification.nuevas.filter(item => !item.isTaken);
        console.log(`   ❌ URLs descartadas: ${descartadas.length}`);
        console.log('');
    }

    // Resumen final
    const tumbadas = classification.nuevas.filter(item => item.isTaken).length;
    const usables = classification.nuevas.filter(item => !item.isTaken).length;

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  📊 RESUMEN DE AUDITORÍA                                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📊 CLASIFICACIÓN FINAL:`);
    console.log(`   🆕 URLs nuevas usables: ${usables}`);
    console.log(`   ❌ URLs nuevas tumbadas: ${tumbadas}`);
    console.log(`   ⚠️  URLs duplicadas: ${classification.duplicadas.length}`);
    if (autoDiscard) {
        console.log(`   🗑️  URLs auto-descartadas: ${descartadas.length}`);
    }
    console.log('');

    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Guardar resultados
    const results = {
        metadata: {
            timestampISO: startTime.toISOString(),
            timestampReadable: startTime.toLocaleString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            inputFile: urlsFile,
            autoDiscard,
            skipHttpCheck,
            durationSeconds: parseFloat(duration)
        },
        statistics: {
            totalUrls: urls.length,
            nuevas: classification.nuevas.length,
            nuevasUsables: usables,
            nuevasTumbadas: tumbadas,
            duplicadas: classification.duplicadas.length,
            autoDescartadas: autoDiscard ? descartadas.length : 0
        },
        urls: {
            nuevas: classification.nuevas,
            duplicadas: classification.duplicadas,
            descartadas: autoDiscard ? descartadas : []
        }
    };

    return results;
}

// ============================================
// GUARDAR RESULTADOS
// ============================================

/**
 * Guarda resultados en JSON, CSV y TXT
 */
async function saveResults(results) {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const baseFileName = `audit-${dateString}-${timeString}`;

    // 1. Guardar JSON completo
    const jsonFile = `${baseFileName}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2), 'utf8');
    console.log(`💾 Resultados JSON: ${jsonFile}`);

    // 2. Guardar URLs nuevas usables en TXT
    const nuevasUsables = results.urls.nuevas.filter(item => !item.isTaken);
    if (nuevasUsables.length > 0) {
        const txtFile = `${baseFileName}-nuevas.txt`;
        const urlsList = nuevasUsables.map(item => item.url).join('\n');
        fs.writeFileSync(txtFile, urlsList, 'utf8');
        console.log(`💾 URLs nuevas usables: ${txtFile}`);
    }

    // 3. Actualizar CSV histórico
    const csvFile = CONFIG.auditHistoryCSV;
    const csvHeaders = 'timestamp,inputFile,totalUrls,nuevas,nuevasUsables,nuevasTumbadas,duplicadas,autoDescartadas,durationSeconds,autoDiscard,skipHttpCheck\n';

    const csvRow = [
        results.metadata.timestampISO,
        results.metadata.inputFile,
        results.statistics.totalUrls,
        results.statistics.nuevas,
        results.statistics.nuevasUsables,
        results.statistics.nuevasTumbadas,
        results.statistics.duplicadas,
        results.statistics.autoDescartadas,
        results.metadata.durationSeconds,
        results.metadata.autoDiscard,
        results.metadata.skipHttpCheck
    ].join(',') + '\n';

    if (!fs.existsSync(csvFile)) {
        fs.writeFileSync(csvFile, csvHeaders + csvRow, 'utf8');
        console.log(`💾 CSV histórico creado: ${csvFile}`);
    } else {
        fs.appendFileSync(csvFile, csvRow, 'utf8');
        console.log(`💾 CSV histórico actualizado: ${csvFile}`);
    }

    console.log('');

    return {
        jsonFile,
        txtFile: nuevasUsables.length > 0 ? `${baseFileName}-nuevas.txt` : null,
        csvFile
    };
}

// ============================================
// CLI
// ============================================

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log('');
        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║  📊 AUDITOR DE URLs - INMUEBLES24                            ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log('USO:');
        console.log('  node auditor-urls-inmuebles24.js <archivo-urls> [flags]');
        console.log('');
        console.log('FLAGS:');
        console.log('  --auto-discard    Descarta automáticamente URLs tumbadas');
        console.log('  --skip-http-check Omite verificación HTTP (más rápido)');
        console.log('');
        console.log('EJEMPLO:');
        console.log('  node auditor-urls-inmuebles24.js urls-inmuebles24-2025-10-26-16-35-21-valid.txt');
        console.log('  node auditor-urls-inmuebles24.js urls-inmuebles24-2025-10-26-16-35-21-valid.txt --auto-discard');
        console.log('');
        console.log('SALIDA:');
        console.log('  • audit-YYYY-MM-DD-HH-MM-SS.json       (resultados detallados)');
        console.log('  • audit-YYYY-MM-DD-HH-MM-SS-nuevas.txt (URLs listas para scrapear)');
        console.log('  • audit-history.csv                     (histórico acumulativo)');
        console.log('');
        process.exit(0);
    }

    const urlsFile = args[0];
    const autoDiscard = args.includes('--auto-discard');
    const skipHttpCheck = args.includes('--skip-http-check');

    auditUrls(urlsFile, autoDiscard, skipHttpCheck)
        .then(results => saveResults(results))
        .then(files => {
            console.log('╔═══════════════════════════════════════════════════════════════╗');
            console.log('║  ✅ AUDITORÍA COMPLETADA                                     ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝');
            console.log('');
            console.log('📁 ARCHIVOS GENERADOS:');
            console.log(`   • ${files.jsonFile}`);
            if (files.txtFile) {
                console.log(`   • ${files.txtFile}`);
            }
            console.log(`   • ${files.csvFile} (histórico)`);
            console.log('');
            process.exit(0);
        })
        .catch(error => {
            console.error('');
            console.error('╔═══════════════════════════════════════════════════════════════╗');
            console.error('║  ❌ ERROR                                                     ║');
            console.error('╚═══════════════════════════════════════════════════════════════╝');
            console.error('');
            console.error(`💥 ${error.message}`);
            console.error('');
            if (error.stack) {
                console.error('Stack trace:');
                console.error(error.stack);
            }
            console.error('');
            process.exit(1);
        });
}

// ============================================
// EXPORTAR
// ============================================

module.exports = {
    auditUrls,
    saveResults,
    verifyUrls,
    extractPropertyId,
    isDuplicate
};
