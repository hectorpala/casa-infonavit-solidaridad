const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Procesador batch de URLs de Inmuebles24
 * Lee URLs del archivo generado y las procesa con inmuebles24culiacanscraper.js
 */

class BatchURLProcessor {
    constructor(options = {}) {
        this.inputFile = 'urls-propiedades-recientes-culiacan.txt';
        this.inputJSON = 'propiedades-recientes-culiacan.json';
        this.logFile = 'batch-scraping-log.txt';
        this.scraperCommand = 'node inmuebles24culiacanscraper.js';
        this.delayBetweenProps = parseInt(process.env.DELAY_BETWEEN_PROPS_MS) || 5000;
        this.concurrency = options.concurrency || parseInt(process.env.MAX_CONCURRENT_WORKERS) || 1;
    }

    // Leer URLs del archivo de texto
    loadURLsFromFile() {
        if (!fs.existsSync(this.inputFile)) {
            throw new Error(`Archivo no encontrado: ${this.inputFile}`);
        }

        const content = fs.readFileSync(this.inputFile, 'utf8');
        const urls = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && line.startsWith('http'));

        return urls;
    }

    // Leer datos completos del JSON
    loadDataFromJSON() {
        if (!fs.existsSync(this.inputJSON)) {
            return null;
        }

        return JSON.parse(fs.readFileSync(this.inputJSON, 'utf8'));
    }

    // Ejecutar scraper para una URL
    async scrapeURL(url, index, total) {
        console.log(`\n${'═'.repeat(80)}`);
        console.log(`🏠 PROPIEDAD ${index + 1}/${total}`);
        console.log(`🔗 ${url}`);
        console.log('═'.repeat(80));

        const startTime = Date.now();

        try {
            // Ejecutar scraper (confirmar ciudad automáticamente con echo "")
            const command = `echo "" | ${this.scraperCommand} "${url}"`;

            console.log(`⚙️  Ejecutando: ${command}\n`);

            const { stdout, stderr } = await execPromise(command, {
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                timeout: 120000 // 2 minutos timeout
            });

            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

            // Mostrar output del scraper (últimas 50 líneas)
            const lines = stdout.split('\n');
            const lastLines = lines.slice(-50);
            console.log(lastLines.join('\n'));

            if (stderr) {
                console.log(`\n⚠️  Stderr:\n${stderr}`);
            }

            console.log(`\n✅ Completada en ${elapsedTime}s`);

            // Log success
            this.logResult(url, 'SUCCESS', elapsedTime);

            return { success: true, time: elapsedTime };

        } catch (error) {
            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

            console.error(`\n❌ Error procesando ${url}:`);
            console.error(`   ${error.message}`);

            if (error.stdout) {
                console.log(`\n📄 Output antes del error:`);
                console.log(error.stdout);
            }

            // Log error
            this.logResult(url, 'ERROR', elapsedTime, error.message);

            return { success: false, error: error.message };
        }
    }

    // Registrar resultado en log
    logResult(url, status, time, errorMsg = '') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${status} | ${time}s | ${url}${errorMsg ? ` | ${errorMsg}` : ''}\n`;

        fs.appendFileSync(this.logFile, logEntry, 'utf8');
    }

    // Procesar URLs con control de concurrencia
    async processAllWithConcurrency() {
        console.log('═'.repeat(80));
        console.log('🚀 BATCH PROCESSOR - INMUEBLES24 CULIACÁN');
        console.log('═'.repeat(80));

        // Cargar URLs
        let urls;
        try {
            urls = this.loadURLsFromFile();
        } catch (error) {
            console.error(`\n❌ Error cargando URLs: ${error.message}`);
            console.log('\n💡 INSTRUCCIÓN: Primero ejecuta el extractor:');
            console.log('   node extraer-urls-recientes-culiacan.js');
            return;
        }

        if (urls.length === 0) {
            console.log('\n⚠️  No hay URLs para procesar.');
            return;
        }

        // Cargar datos del JSON (opcional, para mostrar info)
        const jsonData = this.loadDataFromJSON();

        console.log(`\n📊 URLs encontradas: ${urls.length}`);
        if (jsonData) {
            console.log(`📅 Fecha extracción: ${jsonData.fecha}`);
            console.log(`⏰ Criterio: ${jsonData.criterio}`);
        }

        console.log(`\n⚙️  Configuración:`);
        console.log(`   • Scraper: ${this.scraperCommand}`);
        console.log(`   • Concurrencia: ${this.concurrency} workers`);
        console.log(`   • Delay entre propiedades: ${this.delayBetweenProps / 1000}s`);
        console.log(`   • Log file: ${this.logFile}`);

        console.log('\n🔄 Iniciando procesamiento...\n');

        // Limpiar log anterior
        if (fs.existsSync(this.logFile)) {
            fs.unlinkSync(this.logFile);
        }

        const results = {
            total: urls.length,
            success: 0,
            errors: 0,
            startTime: Date.now()
        };

        // Si concurrency = 1, usar procesamiento secuencial
        if (this.concurrency === 1) {
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                const result = await this.scrapeURL(url, i, urls.length);

                if (result.success) {
                    results.success++;
                } else {
                    results.errors++;
                }

                // Delay entre propiedades (excepto la última)
                if (i < urls.length - 1) {
                    const delay = this.delayBetweenProps / 1000;
                    console.log(`\n⏳ Esperando ${delay} segundos antes de la siguiente propiedad...`);
                    await new Promise(r => setTimeout(r, this.delayBetweenProps));
                }
            }
        } else {
            // Procesamiento concurrente con pool de workers
            let currentIndex = 0;
            const workers = [];

            const processNext = async (workerId) => {
                while (currentIndex < urls.length) {
                    const index = currentIndex++;
                    const url = urls[index];

                    console.log(`[Worker ${workerId}] Procesando URL ${index + 1}/${urls.length}`);
                    const result = await this.scrapeURL(url, index, urls.length);

                    if (result.success) {
                        results.success++;
                    } else {
                        results.errors++;
                    }

                    // Delay entre propiedades
                    if (currentIndex < urls.length) {
                        await new Promise(r => setTimeout(r, this.delayBetweenProps));
                    }
                }
            };

            // Crear workers
            for (let i = 0; i < this.concurrency; i++) {
                workers.push(processNext(i + 1));
            }

            // Esperar a que todos los workers terminen
            await Promise.all(workers);
        }

        // Resumen final
        const totalTime = ((Date.now() - results.startTime) / 1000 / 60).toFixed(1);

        console.log('\n' + '═'.repeat(80));
        console.log('✅ PROCESAMIENTO COMPLETADO');
        console.log('═'.repeat(80));
        console.log(`\n📊 RESUMEN:`);
        console.log(`   • Total URLs: ${results.total}`);
        console.log(`   • Exitosas: ${results.success}`);
        console.log(`   • Errores: ${results.errors}`);
        console.log(`   • Tiempo total: ${totalTime} minutos`);
        console.log(`   • Promedio: ${(totalTime * 60 / results.total).toFixed(1)}s por propiedad`);
        console.log(`\n📁 Log completo guardado en: ${this.logFile}`);
        console.log('═'.repeat(80));

        return results;
    }

    // Procesar todas las URLs (alias para compatibilidad)
    async processAll() {
        return this.processAllWithConcurrency();
    }

    // Procesar solo las primeras N URLs (para testing)
    async processFirst(n = 3) {
        console.log(`🧪 MODO TESTING - Procesando solo las primeras ${n} URLs\n`);

        const urls = this.loadURLsFromFile().slice(0, n);

        if (urls.length === 0) {
            console.log('⚠️  No hay URLs para procesar.');
            return;
        }

        for (let i = 0; i < urls.length; i++) {
            await this.scrapeURL(urls[i], i, urls.length);

            if (i < urls.length - 1) {
                await new Promise(r => setTimeout(r, this.delayBetweenProps));
            }
        }

        console.log('\n✅ Testing completado');
    }

    // Verificar duplicados SIN scrapear (ultra-rápido)
    async checkDuplicates(limit = null) {
        console.log('🔍 MODO CHECK-ONLY - Verificando duplicados sin scrapear\n');
        console.log('═'.repeat(80));

        try {
            // Cargar URLs
            const allUrls = this.loadURLsFromFile();
            const urls = limit ? allUrls.slice(0, limit) : allUrls;

            console.log(`📋 URLs a verificar: ${urls.length} (Total en archivo: ${allUrls.length})\n`);

            // Cargar property history
            const PropertyHistory = require('./property-history');
            const history = new PropertyHistory();

            let nuevas = 0;
            let duplicadas = 0;
            const duplicateDetails = [];
            const newDetails = [];

            // Verificar cada URL
            urls.forEach((url, index) => {
                // Extraer property ID
                const propertyIdMatch = url.match(/-(\d+)\.html/);
                const propertyId = propertyIdMatch ? propertyIdMatch[1] : null;

                if (!propertyId) {
                    console.log(`⚠️  URL ${index + 1}: No se pudo extraer ID`);
                    return;
                }

                // Verificar si existe en el histórico
                const existingProp = history.get(propertyId);

                if (existingProp) {
                    duplicadas++;
                    duplicateDetails.push({
                        id: propertyId,
                        title: existingProp.title || 'Sin título',
                        slug: existingProp.slug || 'Sin slug',
                        scrapedAt: existingProp.scrapedAt ? new Date(existingProp.scrapedAt).toLocaleDateString('es-MX') : 'Fecha desconocida'
                    });
                } else {
                    nuevas++;
                    newDetails.push({
                        id: propertyId,
                        url: url.substring(0, 80) + '...'
                    });
                }
            });

            // Mostrar resultados
            console.log('═'.repeat(80));
            console.log('📊 RESULTADO DE VERIFICACIÓN:\n');
            console.log(`✅ Propiedades NUEVAS: ${nuevas} (${((nuevas / urls.length) * 100).toFixed(1)}%)`);
            console.log(`🔄 Propiedades DUPLICADAS: ${duplicadas} (${((duplicadas / urls.length) * 100).toFixed(1)}%)`);
            console.log('═'.repeat(80));

            // Mostrar detalles de duplicados
            if (duplicadas > 0) {
                console.log(`\n🔄 DUPLICADOS DETECTADOS (${duplicadas}):`);
                console.log('─'.repeat(80));
                duplicateDetails.slice(0, 10).forEach((prop, i) => {
                    console.log(`   ${i + 1}. ID ${prop.id} - "${prop.title}"`);
                    console.log(`      Slug: ${prop.slug}`);
                    console.log(`      Scrapeada: ${prop.scrapedAt}`);
                });
                if (duplicadas > 10) {
                    console.log(`   ... y ${duplicadas - 10} más`);
                }
            }

            // Mostrar primeras nuevas
            if (nuevas > 0) {
                console.log(`\n✅ PROPIEDADES NUEVAS (${nuevas}):`);
                console.log('─'.repeat(80));
                newDetails.slice(0, 5).forEach((prop, i) => {
                    console.log(`   ${i + 1}. ID ${prop.id}`);
                    console.log(`      ${prop.url}`);
                });
                if (nuevas > 5) {
                    console.log(`   ... y ${nuevas - 5} más`);
                }
            }

            console.log('\n' + '═'.repeat(80));
            console.log('⏱️  Tiempo: ~3 segundos (solo lectura de JSON)');
            console.log('💡 Para scrapear las propiedades nuevas: node scrapear-batch-urls.js');
            console.log('═'.repeat(80));

            return { nuevas, duplicadas, total: urls.length };

        } catch (error) {
            console.error('\n❌ Error verificando duplicados:', error.message);
            throw error;
        }
    }
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);

    // Parse concurrency from CLI
    let concurrency = 1;
    if (args.includes('--concurrency')) {
        const idx = args.indexOf('--concurrency');
        concurrency = parseInt(args[idx + 1]) || 1;
    }

    const processor = new BatchURLProcessor({ concurrency });

    if (args.includes('--check-only')) {
        // Modo verificación: solo check duplicados (sin scrapear)
        const limit = args.includes('--test') ? parseInt(args[args.indexOf('--test') + 1]) : null;
        processor.checkDuplicates(limit).catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
    } else if (args.includes('--test')) {
        // Modo testing: solo las primeras N
        const n = parseInt(args[args.indexOf('--test') + 1]) || 3;
        processor.processFirst(n).catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
    } else if (args.includes('--help')) {
        console.log(`
🚀 BATCH URL PROCESSOR - Inmuebles24 Culiacán

USO:
  node scrapear-batch-urls.js                       Procesar todas las URLs
  node scrapear-batch-urls.js --concurrency 3       Procesar con 3 workers paralelos
  node scrapear-batch-urls.js --check-only          ⚡ Verificar duplicados (3s, sin scrapear)
  node scrapear-batch-urls.js --check-only --test 10  Verificar solo primeras 10
  node scrapear-batch-urls.js --test                Procesar solo las primeras 3 (testing)
  node scrapear-batch-urls.js --test 5              Procesar solo las primeras 5 (testing)
  node scrapear-batch-urls.js --help                Mostrar esta ayuda

OPCIONES:
  --check-only       ⚡ Solo verificar duplicados sin scrapear (ultra-rápido: ~3s)
                     Reporta: cuántas nuevas, cuántas duplicadas, IDs duplicados
  --concurrency N    Número de workers paralelos (1-10, default: 1)
                     - Sin proxies: 1-2 recomendado
                     - Con proxies: 3-5 recomendado
  --test N           Limitar a las primeras N URLs (para testing/verificación)

ARCHIVOS:
  Input:  urls-propiedades-recientes-culiacan.txt
  Output: batch-scraping-log.txt

WORKFLOW COMPLETO:
  1. node extraer-urls-recientes-culiacan.js      (Extraer URLs con ≤20 días)
  2. node scrapear-batch-urls.js --check-only     ⚡ (Verificar cuántas son nuevas: 3s)
  3. node scrapear-batch-urls.js --test 3         (Probar con 3 propiedades)
  4. node scrapear-batch-urls.js --concurrency 3  (Procesar todas, paralelo)
        `);
    } else {
        // Procesar todas
        processor.processAll().catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
    }
}

module.exports = BatchURLProcessor;
