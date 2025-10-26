#!/usr/bin/env node

/**
 * Pipeline API Server
 *
 * Servicio backend que expone endpoints REST para ejecutar scripts del pipeline
 * Inmuebles24 Culiacán desde el dashboard web.
 *
 * Features:
 * - Ejecuta comandos de manera segura con child_process
 * - Streaming de logs en tiempo real (SSE - Server-Sent Events)
 * - Autenticación con API key
 * - Manejo de timeouts largos
 * - Control de concurrencia (solo 1 job a la vez)
 *
 * Endpoints:
 * - POST /api/extract-urls - Extrae URLs recientes
 * - POST /api/verify-dates - Verifica fechas con Puppeteer (100% accuracy)
 * - POST /api/scrape-batch - Ejecuta scraping batch
 * - GET /api/status/:jobId - Consulta estado de un job
 * - GET /api/logs/:jobId - Streaming de logs (SSE)
 *
 * Uso:
 *   node pipeline-api-server.js
 *   # Server running on http://localhost:3001
 */

const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'pipeline-secret-key-2025'; // Cambiar en producción

// Middleware
app.use(cors());
app.use(express.json());

// Autenticación middleware
function authenticate(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    if (apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
    }

    next();
}

// Estado de jobs
const jobs = new Map();
let currentJobId = null;

// Función para generar ID único
function generateJobId() {
    return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Ejecuta un comando y captura output en tiempo real
 */
function executeCommand(jobId, command, args, options = {}) {
    const job = jobs.get(jobId);
    if (!job) return;

    job.status = 'running';
    job.startTime = new Date();
    job.logs = [];

    console.log(`[${jobId}] Executing: ${command} ${args.join(' ')}`);

    const process = spawn(command, args, {
        cwd: __dirname,
        shell: true,
        ...options
    });

    job.process = process;

    // Capturar stdout
    process.stdout.on('data', (data) => {
        const log = data.toString();
        job.logs.push({ type: 'stdout', message: log, timestamp: new Date() });

        // Broadcast a clientes SSE
        if (job.sseClients) {
            job.sseClients.forEach(client => {
                client.write(`data: ${JSON.stringify({ type: 'stdout', message: log })}\n\n`);
            });
        }
    });

    // Capturar stderr
    process.stderr.on('data', (data) => {
        const log = data.toString();
        job.logs.push({ type: 'stderr', message: log, timestamp: new Date() });

        // Broadcast a clientes SSE
        if (job.sseClients) {
            job.sseClients.forEach(client => {
                client.write(`data: ${JSON.stringify({ type: 'stderr', message: log })}\n\n`);
            });
        }
    });

    // Cuando termina
    process.on('close', (code) => {
        job.status = code === 0 ? 'completed' : 'failed';
        job.endTime = new Date();
        job.exitCode = code;
        currentJobId = null;

        console.log(`[${jobId}] Finished with exit code ${code}`);

        // Notificar a clientes SSE
        if (job.sseClients) {
            job.sseClients.forEach(client => {
                client.write(`data: ${JSON.stringify({ type: 'complete', exitCode: code })}\n\n`);
                client.end();
            });
        }

        // Limpiar después de 1 hora
        setTimeout(() => jobs.delete(jobId), 3600000);
    });

    // Manejo de errores
    process.on('error', (error) => {
        job.status = 'error';
        job.error = error.message;
        job.endTime = new Date();
        currentJobId = null;

        console.error(`[${jobId}] Error:`, error);

        // Notificar a clientes SSE
        if (job.sseClients) {
            job.sseClients.forEach(client => {
                client.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
                client.end();
            });
        }
    });
}

/**
 * POST /api/extract-urls
 * Extrae URLs recientes desde Inmuebles24
 */
app.post('/api/extract-urls', authenticate, (req, res) => {
    if (currentJobId) {
        return res.status(409).json({
            error: 'Another job is running',
            currentJobId
        });
    }

    const { searchUrl, maxDays = 35 } = req.body;
    const jobId = generateJobId();

    // Validar URL si se proporciona
    const baseURL = searchUrl && searchUrl.trim() !== ''
        ? searchUrl.trim()
        : 'https://www.inmuebles24.com/venta/sinaloa/culiacan/';

    jobs.set(jobId, {
        id: jobId,
        type: 'extract-urls',
        status: 'pending',
        params: { searchUrl: baseURL, maxDays },
        logs: [],
        sseClients: []
    });

    currentJobId = jobId;

    // Ejecutar en background
    setImmediate(() => {
        const args = ['extraer-urls-recientes-culiacan.js', baseURL, '--max-days', maxDays.toString()];
        executeCommand(
            jobId,
            'node',
            args,
            { timeout: 300000 } // 5 minutos
        );
    });

    res.json({
        success: true,
        jobId,
        message: 'URL extraction started',
        logsUrl: `/api/logs/${jobId}`
    });
});

/**
 * POST /api/scrape-batch
 * Ejecuta scraping batch desde archivo de URLs
 */
app.post('/api/scrape-batch', authenticate, (req, res) => {
    if (currentJobId) {
        return res.status(409).json({
            error: 'Another job is running',
            currentJobId
        });
    }

    const { concurrency = 3, test = null, checkOnly = false } = req.body;
    const jobId = generateJobId();

    const args = ['scrapear-batch-urls.js', '--concurrency', concurrency.toString()];

    if (test) {
        args.push('--test', test.toString());
    }

    if (checkOnly) {
        args.push('--check-only');
    }

    jobs.set(jobId, {
        id: jobId,
        type: 'scrape-batch',
        status: 'pending',
        params: { concurrency, test, checkOnly },
        logs: [],
        sseClients: []
    });

    currentJobId = jobId;

    // Ejecutar en background
    setImmediate(() => {
        executeCommand(
            jobId,
            'node',
            args,
            { timeout: 3600000 } // 1 hora
        );
    });

    res.json({
        success: true,
        jobId,
        message: 'Batch scraping started',
        logsUrl: `/api/logs/${jobId}`
    });
});

/**
 * POST /api/verify-dates
 * Verifica fechas de publicación abriendo cada página individual con Puppeteer
 * Usa verificar-fechas-individuales.js (100% accuracy)
 */
app.post('/api/verify-dates', authenticate, (req, res) => {
    if (currentJobId) {
        return res.status(409).json({
            error: 'Another job is running',
            currentJobId
        });
    }

    const jobId = generateJobId();

    jobs.set(jobId, {
        id: jobId,
        type: 'verify-dates',
        status: 'pending',
        params: {},
        logs: [],
        sseClients: []
    });

    currentJobId = jobId;

    // Ejecutar verificar-fechas-individuales.js (abre páginas con Puppeteer)
    setImmediate(() => {
        executeCommand(
            jobId,
            'node',
            ['verificar-fechas-individuales.js'],
            { timeout: 3600000 } // 1 hora
        );
    });

    res.json({
        success: true,
        jobId,
        message: 'Date verification started (opening pages with Puppeteer)',
        logsUrl: `/api/logs/${jobId}`
    });
});

/**
 * POST /api/run-command
 * Endpoint genérico para ejecutar cualquier comando
 */
app.post('/api/run-command', authenticate, (req, res) => {
    if (currentJobId) {
        return res.status(409).json({
            error: 'Another job is running',
            currentJobId
        });
    }

    const { command, args = [] } = req.body;

    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }

    // Whitelist de comandos permitidos (seguridad)
    const allowedCommands = [
        'node extraer-urls-recientes-culiacan.js',
        'node scrapear-batch-urls.js',
        'node rebuild-property-database-from-html.js',
        './daily-scraping.sh'
    ];

    const fullCommand = `${command} ${args.join(' ')}`;
    const isAllowed = allowedCommands.some(cmd => fullCommand.startsWith(cmd));

    if (!isAllowed) {
        return res.status(403).json({ error: 'Command not allowed' });
    }

    const jobId = generateJobId();

    jobs.set(jobId, {
        id: jobId,
        type: 'custom-command',
        status: 'pending',
        params: { command, args },
        logs: [],
        sseClients: []
    });

    currentJobId = jobId;

    // Ejecutar en background
    setImmediate(() => {
        executeCommand(jobId, command, args, { timeout: 3600000 });
    });

    res.json({
        success: true,
        jobId,
        message: 'Command started',
        logsUrl: `/api/logs/${jobId}`
    });
});

/**
 * GET /api/status/:jobId
 * Consulta el estado de un job
 */
app.get('/api/status/:jobId', authenticate, (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
        id: job.id,
        type: job.type,
        status: job.status,
        params: job.params,
        startTime: job.startTime,
        endTime: job.endTime,
        exitCode: job.exitCode,
        error: job.error,
        logsCount: job.logs.length
    });
});

/**
 * GET /api/logs/:jobId
 * Streaming de logs en tiempo real (SSE)
 */
app.get('/api/logs/:jobId', authenticate, (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Enviar logs históricos
    job.logs.forEach(log => {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
    });

    // Agregar cliente a la lista
    if (!job.sseClients) {
        job.sseClients = [];
    }
    job.sseClients.push(res);

    // Limpiar cuando el cliente se desconecta
    req.on('close', () => {
        const index = job.sseClients.indexOf(res);
        if (index > -1) {
            job.sseClients.splice(index, 1);
        }
    });
});

/**
 * GET /api/jobs
 * Lista todos los jobs (últimos 50)
 */
app.get('/api/jobs', authenticate, (req, res) => {
    const jobList = Array.from(jobs.values())
        .slice(-50)
        .map(job => ({
            id: job.id,
            type: job.type,
            status: job.status,
            startTime: job.startTime,
            endTime: job.endTime
        }));

    res.json({ jobs: jobList, currentJobId });
});

/**
 * DELETE /api/jobs/:jobId
 * Cancela un job en ejecución
 */
app.delete('/api/jobs/:jobId', authenticate, (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status === 'running' && job.process) {
        job.process.kill('SIGTERM');
        job.status = 'cancelled';
        currentJobId = null;

        return res.json({ success: true, message: 'Job cancelled' });
    }

    res.status(400).json({ error: 'Job is not running' });
});

/**
 * GET /api/stats
 * Get database statistics
 */
app.get('/api/stats', authenticate, (req, res) => {
    try {
        const dbFile = path.join(__dirname, 'inmuebles24-scraped-properties.json');
        const urlsFile = path.join(__dirname, 'urls-propiedades-recientes-culiacan.txt');
        const recentJsonFile = path.join(__dirname, 'propiedades-recientes-culiacan.json');

        let totalInDB = 0;
        let lastScraped = null;

        if (fs.existsSync(dbFile)) {
            const content = fs.readFileSync(dbFile, 'utf8');
            const data = JSON.parse(content);
            totalInDB = data.length;
            if (data.length > 0 && data[0].scrapedAt) {
                lastScraped = data[0].scrapedAt;
            }
        }

        let extractedUrls = 0;
        if (fs.existsSync(urlsFile)) {
            const content = fs.readFileSync(urlsFile, 'utf8');
            extractedUrls = content.split('\n').filter(line => line.trim()).length;
        }

        let pendingNew = 0;
        let pendingExisting = 0;
        if (fs.existsSync(recentJsonFile)) {
            const content = fs.readFileSync(recentJsonFile, 'utf8');
            const data = JSON.parse(content);
            pendingNew = data.newProperties ? data.newProperties.length : 0;
            pendingExisting = data.existingProperties ? data.existingProperties.length : 0;
        }

        res.json({
            totalInDB,
            extractedUrls,
            pendingNew,
            pendingExisting,
            lastScraped,
            lastExtraction: fs.existsSync(urlsFile) ? fs.statSync(urlsFile).mtime : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/pending-urls
 * Get list of pending URLs to scrape
 */
app.get('/api/pending-urls', authenticate, (req, res) => {
    try {
        const recentJsonFile = path.join(__dirname, 'propiedades-recientes-culiacan.json');

        if (!fs.existsSync(recentJsonFile)) {
            return res.json({ newProperties: [], existingProperties: [] });
        }

        const content = fs.readFileSync(recentJsonFile, 'utf8');
        const data = JSON.parse(content);

        res.json({
            newProperties: data.newProperties || [],
            existingProperties: data.existingProperties || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/scrape-single
 * Scrape a single URL
 */
app.post('/api/scrape-single', authenticate, (req, res) => {
    if (currentJobId) {
        return res.status(409).json({
            error: 'Another job is running',
            currentJobId
        });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    const jobId = generateJobId();

    jobs.set(jobId, {
        id: jobId,
        type: 'scrape-single',
        status: 'pending',
        params: { url },
        logs: [],
        sseClients: []
    });

    currentJobId = jobId;

    // Ejecutar en background
    setImmediate(() => {
        executeCommand(jobId, 'node', ['inmuebles24culiacanscraper.js', url], { timeout: 600000 });
    });

    res.json({
        success: true,
        jobId,
        message: 'Single URL scraping started',
        logsUrl: `/api/logs/${jobId}`
    });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        currentJob: currentJobId,
        totalJobs: jobs.size
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🚀 Pipeline API Server                                       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔑 API Key: ${API_KEY}`);
    console.log('');
    console.log('📡 Endpoints:');
    console.log(`   POST   /api/extract-urls     - Extract URLs from Inmuebles24`);
    console.log(`   POST   /api/verify-dates     - Verify dates with Puppeteer`);
    console.log(`   POST   /api/scrape-batch     - Run batch scraping`);
    console.log(`   POST   /api/run-command      - Run custom command`);
    console.log(`   GET    /api/status/:jobId    - Get job status`);
    console.log(`   GET    /api/logs/:jobId      - Stream logs (SSE)`);
    console.log(`   GET    /api/jobs             - List all jobs`);
    console.log(`   DELETE /api/jobs/:jobId      - Cancel job`);
    console.log(`   GET    /health               - Health check`);
    console.log('');
    console.log('🔒 Authentication: Add header "X-API-Key: pipeline-secret-key-2025"');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');

    // Cancelar jobs en ejecución
    jobs.forEach(job => {
        if (job.process && job.status === 'running') {
            job.process.kill('SIGTERM');
        }
    });

    process.exit(0);
});
