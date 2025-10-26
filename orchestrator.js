#!/usr/bin/env node

/**
 * ORQUESTADOR DE SCRAPING - INMUEBLES24
 * =====================================
 *
 * Sistema inteligente de procesamiento batch con:
 * - Reintentos automáticos (2-3) con backoff exponencial
 * - Reportes detallados en reports/
 * - Notificaciones opcionales (Email/Slack)
 * - Integración completa con lote-manager
 *
 * Uso:
 *   node orchestrator.js                    # Procesar lote actual
 *   node orchestrator.js --max-retries 3    # Personalizar reintentos
 *   node orchestrator.js --notify email     # Notificar por email
 *   node orchestrator.js --notify slack     # Notificar por Slack
 *   node orchestrator.js --dry-run          # Simular sin scrapear
 *
 * Configuración:
 *   - Editar .env para credenciales de notificación
 *   - MAX_RETRIES: número de reintentos (default: 2)
 *   - INITIAL_BACKOFF: backoff inicial en segundos (default: 5)
 *
 * @author Claude + Hector Palazuelos
 * @version 3.0
 * @date Octubre 2025
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config(); // Para credenciales de notificación

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
    LOTE_FILE: '1depuracionurlinmuebles24.json',
    SCRAPER_SCRIPT: 'inmuebles24culiacanscraper.js',
    REPORTS_DIR: 'reports',
    MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 2,
    INITIAL_BACKOFF: parseInt(process.env.INITIAL_BACKOFF) || 5, // segundos
    SCRAPER_TIMEOUT: parseInt(process.env.SCRAPER_TIMEOUT) || 180000, // 3 minutos

    // Notificaciones
    EMAIL_ENABLED: process.env.EMAIL_ENABLED === 'true',
    EMAIL_TO: process.env.EMAIL_TO,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,

    SLACK_ENABLED: process.env.SLACK_ENABLED === 'true',
    SLACK_WEBHOOK: process.env.SLACK_WEBHOOK,
};

// Argumentos CLI
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const NOTIFY_TYPE = args.includes('--notify')
    ? args[args.indexOf('--notify') + 1]
    : null;

if (args.includes('--max-retries')) {
    CONFIG.MAX_RETRIES = parseInt(args[args.indexOf('--max-retries') + 1]) || 2;
}

// ============================================================================
// UTILIDADES
// ============================================================================

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
};

function log(message, color = 'reset') {
    const timestamp = new Date().toLocaleTimeString('es-MX');
    console.log(`${colors.gray}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// LECTURA DE LOTE
// ============================================================================

async function loadLote() {
    try {
        const data = await fs.readFile(CONFIG.LOTE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error(`No se pudo leer el lote: ${error.message}`);
    }
}

function getPendingUrls(lote) {
    return lote.urls.filter(url => url.estado === 'pendiente');
}

// ============================================================================
// SCRAPER EXECUTION CON REINTENTOS
// ============================================================================

async function runScraper(url, propertyId, attempt = 1) {
    log(`Ejecutando scraper (intento ${attempt})...`, 'cyan');

    return new Promise((resolve, reject) => {
        const scraper = spawn('node', [CONFIG.SCRAPER_SCRIPT, url], {
            stdio: 'pipe',
            timeout: CONFIG.SCRAPER_TIMEOUT
        });

        let stdout = '';
        let stderr = '';

        scraper.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        scraper.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        scraper.on('close', (code) => {
            if (code === 0) {
                // Extraer slug del output
                const slugMatch = stdout.match(/Slug generado: ([\w-]+)/);
                const slug = slugMatch ? slugMatch[1] : null;

                resolve({
                    success: true,
                    slug,
                    output: stdout
                });
            } else {
                reject({
                    success: false,
                    code,
                    stdout,
                    stderr,
                    error: stderr || `Scraper falló con código ${code}`
                });
            }
        });

        scraper.on('error', (error) => {
            reject({
                success: false,
                error: error.message,
                stdout,
                stderr
            });
        });

        // Timeout manual
        setTimeout(() => {
            scraper.kill('SIGTERM');
            reject({
                success: false,
                error: 'Timeout: Scraper tardó más de 3 minutos',
                stdout,
                stderr
            });
        }, CONFIG.SCRAPER_TIMEOUT);
    });
}

async function processUrlWithRetries(urlObj) {
    const { url, propertyId } = urlObj;
    const startTime = Date.now();
    let lastError = null;

    log(`\n${'='.repeat(70)}`, 'bright');
    log(`📍 Procesando: ${propertyId}`, 'bright');
    log(`🔗 URL: ${url.substring(0, 80)}...`, 'gray');

    for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES + 1; attempt++) {
        try {
            if (DRY_RUN) {
                log(`[DRY RUN] Simulando scraper...`, 'yellow');
                await sleep(2000); // Simular delay

                // Simular 70% éxito
                if (Math.random() > 0.3) {
                    return {
                        propertyId,
                        url,
                        status: 'success',
                        attempts: attempt,
                        duration: formatDuration(Date.now() - startTime),
                        durationMs: Date.now() - startTime,
                        error: null,
                        slug: `test-slug-${propertyId}`,
                        timestamp: new Date().toISOString()
                    };
                } else {
                    throw new Error('Simulación de fallo para testing');
                }
            }

            const result = await runScraper(url, propertyId, attempt);

            log(`✅ Éxito en intento ${attempt}`, 'green');

            // Actualizar lote-manager
            await updateLoteManager(propertyId, 'success');

            return {
                propertyId,
                url,
                status: 'success',
                attempts: attempt,
                duration: formatDuration(Date.now() - startTime),
                durationMs: Date.now() - startTime,
                error: null,
                slug: result.slug,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            lastError = error;
            log(`❌ Fallo en intento ${attempt}: ${error.error || error.message}`, 'red');

            // Si no es el último intento, aplicar backoff
            if (attempt <= CONFIG.MAX_RETRIES) {
                const backoffTime = CONFIG.INITIAL_BACKOFF * Math.pow(2, attempt - 1);
                log(`⏳ Esperando ${backoffTime}s antes de reintentar...`, 'yellow');
                await sleep(backoffTime * 1000);
            }
        }
    }

    // Todos los intentos fallaron
    log(`💥 Falló después de ${CONFIG.MAX_RETRIES + 1} intentos`, 'red');

    // Actualizar lote-manager con fallo
    const errorMsg = lastError?.error || lastError?.message || 'Error desconocido';
    await updateLoteManager(propertyId, 'failed', errorMsg);

    return {
        propertyId,
        url,
        status: 'failed',
        attempts: CONFIG.MAX_RETRIES + 1,
        duration: formatDuration(Date.now() - startTime),
        durationMs: Date.now() - startTime,
        error: errorMsg,
        slug: null,
        timestamp: new Date().toISOString()
    };
}

// ============================================================================
// INTEGRACIÓN CON LOTE-MANAGER
// ============================================================================

async function updateLoteManager(propertyId, status, errorMsg = null) {
    if (DRY_RUN) {
        log(`[DRY RUN] Actualizaría lote-manager: ${propertyId} → ${status}`, 'gray');
        return;
    }

    return new Promise((resolve, reject) => {
        const args = status === 'success'
            ? ['lote-manager.js', 'mark-processed', propertyId]
            : ['lote-manager.js', 'mark-failed', propertyId, errorMsg || 'Error en scraper'];

        const manager = spawn('node', args, { stdio: 'pipe' });

        manager.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Lote manager falló con código ${code}`));
            }
        });

        manager.on('error', reject);
    });
}

// ============================================================================
// REPORTE FINAL
// ============================================================================

async function generateReport(results, loteInfo, startTime, endTime) {
    // Crear directorio reports si no existe
    try {
        await fs.mkdir(CONFIG.REPORTS_DIR, { recursive: true });
    } catch (error) {
        // Directorio ya existe
    }

    const totalDuration = endTime - startTime;
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const totalRetries = results.reduce((sum, r) => sum + (r.attempts - 1), 0);

    const report = {
        metadata: {
            startTime: new Date(startTime).toISOString(),
            startTimeReadable: new Date(startTime).toLocaleString('es-MX'),
            endTime: new Date(endTime).toISOString(),
            endTimeReadable: new Date(endTime).toLocaleString('es-MX'),
            totalDuration: formatDuration(totalDuration),
            totalDurationMs: totalDuration,
            configUsed: {
                maxRetries: CONFIG.MAX_RETRIES,
                initialBackoff: CONFIG.INITIAL_BACKOFF,
                scraperTimeout: CONFIG.SCRAPER_TIMEOUT
            },
            loteInfo: {
                rangoPrecio: loteInfo.metadata.rangoPrecio,
                ciudad: loteInfo.metadata.ciudad,
                tipo: loteInfo.metadata.tipo,
                notas: loteInfo.metadata.notas
            }
        },
        summary: {
            totalUrls: results.length,
            successful,
            failed,
            successRate: `${((successful / results.length) * 100).toFixed(2)}%`,
            totalRetries,
            avgDuration: formatDuration(
                results.reduce((sum, r) => sum + r.durationMs, 0) / results.length
            )
        },
        results: results.map(r => ({
            propertyId: r.propertyId,
            url: r.url,
            status: r.status,
            attempts: r.attempts,
            duration: r.duration,
            error: r.error,
            slug: r.slug,
            timestamp: r.timestamp
        }))
    };

    // Guardar reporte
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
    const dateStr = timestamp[0];
    const timeStr = timestamp[1].substring(0, 8);
    const reportFile = path.join(
        CONFIG.REPORTS_DIR,
        `orchestrator-${dateStr}-${timeStr}.json`
    );

    await fs.writeFile(reportFile, JSON.stringify(report, null, 2), 'utf8');

    return { report, reportFile };
}

// ============================================================================
// NOTIFICACIONES
// ============================================================================

async function sendEmailNotification(report, reportFile) {
    if (!CONFIG.EMAIL_ENABLED || NOTIFY_TYPE !== 'email') {
        return;
    }

    // Nota: Requiere instalar nodemailer: npm install nodemailer
    try {
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
            host: CONFIG.SMTP_HOST,
            port: 587,
            secure: false,
            auth: {
                user: CONFIG.SMTP_USER,
                pass: CONFIG.SMTP_PASS
            }
        });

        const { successful, failed, totalUrls } = report.summary;

        await transporter.sendMail({
            from: CONFIG.EMAIL_FROM,
            to: CONFIG.EMAIL_TO,
            subject: `✅ Scraping completado: ${successful}/${totalUrls} exitosas`,
            html: `
                <h2>Reporte de Scraping - Inmuebles24</h2>
                <p><strong>Fecha:</strong> ${report.metadata.endTimeReadable}</p>
                <p><strong>Duración total:</strong> ${report.metadata.totalDuration}</p>

                <h3>Resumen:</h3>
                <ul>
                    <li>✅ Exitosas: ${successful}</li>
                    <li>❌ Fallidas: ${failed}</li>
                    <li>🔄 Reintentos totales: ${report.summary.totalRetries}</li>
                    <li>📊 Tasa de éxito: ${report.summary.successRate}</li>
                </ul>

                <h3>Lote procesado:</h3>
                <ul>
                    <li>Rango de precio: ${report.metadata.loteInfo.rangoPrecio}</li>
                    <li>Ciudad: ${report.metadata.loteInfo.ciudad}</li>
                    <li>Tipo: ${report.metadata.loteInfo.tipo}</li>
                </ul>

                <p>Reporte completo guardado en: <code>${reportFile}</code></p>
            `
        });

        log(`📧 Notificación enviada por email a ${CONFIG.EMAIL_TO}`, 'green');
    } catch (error) {
        log(`⚠️  Error enviando email: ${error.message}`, 'yellow');
    }
}

async function sendSlackNotification(report, reportFile) {
    if (!CONFIG.SLACK_ENABLED || NOTIFY_TYPE !== 'slack') {
        return;
    }

    try {
        const { successful, failed, totalUrls } = report.summary;
        const emoji = failed === 0 ? ':white_check_mark:' : ':warning:';

        await axios.post(CONFIG.SLACK_WEBHOOK, {
            text: `${emoji} Scraping Inmuebles24 completado`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: `${emoji} Scraping completado`,
                        emoji: true
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Exitosas:*\n${successful}/${totalUrls}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Fallidas:*\n${failed}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Duración:*\n${report.metadata.totalDuration}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Tasa éxito:*\n${report.summary.successRate}`
                        }
                    ]
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Lote:* ${report.metadata.loteInfo.ciudad} · ${report.metadata.loteInfo.rangoPrecio}`
                    }
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `Reporte: \`${reportFile}\``
                        }
                    ]
                }
            ]
        });

        log(`💬 Notificación enviada a Slack`, 'green');
    } catch (error) {
        log(`⚠️  Error enviando a Slack: ${error.message}`, 'yellow');
    }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

async function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🎯 ORQUESTADOR DE SCRAPING - INMUEBLES24                    ║
╚═══════════════════════════════════════════════════════════════╝
`);

    if (DRY_RUN) {
        log('⚠️  MODO DRY RUN - No se scrapeará ni actualizará nada', 'yellow');
    }

    const startTime = Date.now();

    try {
        // 1. Cargar lote
        log('📋 Cargando lote actual...', 'cyan');
        const lote = await loadLote();
        const pendingUrls = getPendingUrls(lote);

        if (pendingUrls.length === 0) {
            log('✅ No hay URLs pendientes en el lote', 'green');
            return;
        }

        log(`📊 URLs pendientes: ${pendingUrls.length}`, 'bright');
        log(`🔄 Reintentos máximos: ${CONFIG.MAX_RETRIES}`, 'gray');
        log(`⏱️  Backoff inicial: ${CONFIG.INITIAL_BACKOFF}s`, 'gray');

        // 2. Procesar cada URL
        const results = [];

        for (let i = 0; i < pendingUrls.length; i++) {
            log(`\n📦 Progreso: ${i + 1}/${pendingUrls.length}`, 'magenta');

            const result = await processUrlWithRetries(pendingUrls[i]);
            results.push(result);

            // Pequeño delay entre propiedades para evitar rate limiting
            if (i < pendingUrls.length - 1) {
                await sleep(3000);
            }
        }

        // 3. Generar reporte
        const endTime = Date.now();
        log('\n📄 Generando reporte final...', 'cyan');

        const { report, reportFile } = await generateReport(results, lote, startTime, endTime);

        // 4. Mostrar resumen
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  📊 RESUMEN FINAL                                            ║
╚═══════════════════════════════════════════════════════════════╝

⏱️  Duración total: ${report.metadata.totalDuration}
📊 URLs procesadas: ${report.summary.totalUrls}

✅ Exitosas: ${report.summary.successful} (${report.summary.successRate})
❌ Fallidas: ${report.summary.failed}
🔄 Reintentos totales: ${report.summary.totalRetries}
⏱️  Duración promedio: ${report.summary.avgDuration}

📁 Reporte guardado en:
   ${reportFile}
`);

        // 5. Enviar notificaciones
        if (NOTIFY_TYPE) {
            log('📬 Enviando notificaciones...', 'cyan');
            await sendEmailNotification(report, reportFile);
            await sendSlackNotification(report, reportFile);
        }

        log('✅ Orquestación completada exitosamente', 'green');

    } catch (error) {
        log(`💥 Error fatal: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

if (require.main === module) {
    main().catch(error => {
        console.error('Error no manejado:', error);
        process.exit(1);
    });
}

module.exports = { processUrlWithRetries, generateReport };
