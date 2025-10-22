const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Endpoint para ejecutar el scraper
app.post('/run-scraper', (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes('inmuebles24.com')) {
        return res.status(400).json({ error: 'URL inválida de Inmuebles24' });
    }

    // Headers para SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Spawn el scraper con flag --auto-confirm
    console.log(`[${new Date().toISOString()}] Iniciando scraper para: ${url}`);
    console.log(`[${new Date().toISOString()}] CWD: ${__dirname}`);
    console.log(`[${new Date().toISOString()}] Comando: node inmuebles24culiacanscraper.js "${url}" --auto-confirm`);

    const scraper = spawn('node', ['inmuebles24culiacanscraper.js', url, '--auto-confirm'], {
        cwd: __dirname,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe']
    });

    // Manejar errores del spawn
    scraper.on('error', (err) => {
        console.error(`[${new Date().toISOString()}] Error al spawn scraper:`, err);
        res.write(`data: ${JSON.stringify({
            type: 'error',
            message: `Error al iniciar scraper: ${err.message}`
        })}\n\n`);
        res.end();
    });

    let outputBuffer = '';
    let propertySlug = '';
    let propertyTitle = '';

    // Capturar stdout
    scraper.stdout.on('data', (data) => {
        console.log('[SCRAPER STDOUT]:', data.toString().substring(0, 100));
        const text = data.toString();
        outputBuffer += text;

        // Enviar logs al cliente
        const lines = text.split('\n').filter(line => line.trim());
        lines.forEach(line => {
            // Extraer información importante
            if (line.includes('HTML generado:')) {
                // Ejemplo: "✅ HTML generado: culiacan/casa-en-venta-en-stanza-toscana/index.html"
                const match = line.match(/culiacan\/([^\/]+)\/index\.html/);
                if (match) {
                    propertySlug = match[1];
                }
            }
            if (line.includes('Título:')) {
                // Ejemplo: "📝 Título: Casa en Venta en Stanza Toscana"
                const match = line.match(/Título:\s*(.+)/);
                if (match) {
                    propertyTitle = match[1].trim();
                }
            }

            // Enviar evento SSE
            res.write(`data: ${JSON.stringify({
                type: 'log',
                message: line,
                progress: calculateProgress(line)
            })}\n\n`);
        });
    });

    // Capturar stderr
    scraper.stderr.on('data', (data) => {
        const text = data.toString();
        console.log('[SCRAPER STDERR]:', text.substring(0, 100));
        res.write(`data: ${JSON.stringify({
            type: 'error',
            message: text
        })}\n\n`);
    });

    // Cuando el scraper termine
    scraper.on('close', (code) => {
        console.log(`[${new Date().toISOString()}] Scraper terminó con código: ${code}`);
        if (code === 0) {
            const propertyUrl = `https://casasenventa.info/culiacan/${propertySlug}/`;
            res.write(`data: ${JSON.stringify({
                type: 'complete',
                slug: propertySlug,
                title: propertyTitle || 'Propiedad',
                url: propertyUrl,
                progress: 100
            })}\n\n`);
        } else {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                message: `Scraper terminó con código ${code}`
            })}\n\n`);
        }
        res.end();
    });

    // Manejar desconexión del cliente
    req.on('close', () => {
        console.log(`[${new Date().toISOString()}] Cliente desconectado, pero dejando scraper corriendo`);
        // NO matar el scraper, dejarlo terminar
        // scraper.kill();
    });
});

// Función para calcular progreso basado en los logs
function calculateProgress(logLine) {
    const milestones = [
        { keyword: 'Navegando', progress: 10 },
        { keyword: 'Capturando datos', progress: 15 },
        { keyword: 'Datos extraídos', progress: 25 },
        { keyword: 'Descargando', progress: 35 },
        { keyword: 'descargadas', progress: 55 },
        { keyword: 'Generando HTML', progress: 65 },
        { keyword: 'HTML generado', progress: 75 },
        { keyword: 'Agregando tarjeta', progress: 80 },
        { keyword: 'Publicando a GitHub', progress: 85 },
        { keyword: 'main ->', progress: 92 },
        { keyword: 'CRM actualizado', progress: 95 },
        { keyword: 'COMPLETADO', progress: 100 },
        { keyword: 'Deployment completado', progress: 100 }
    ];

    for (const milestone of milestones) {
        if (logLine.includes(milestone.keyword)) {
            return milestone.progress;
        }
    }
    return null;
}

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Abre http://localhost:${PORT}/inmuebles24scraper.html`);
});
