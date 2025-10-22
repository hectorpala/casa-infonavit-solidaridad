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

    // Spawn el wrapper que auto-confirma la ciudad
    const scraper = spawn('node', ['inmuebles24-wrapper.js', url], {
        cwd: __dirname,
        env: { ...process.env }
    });

    let outputBuffer = '';
    let propertySlug = '';
    let propertyTitle = '';

    // Capturar stdout
    scraper.stdout.on('data', (data) => {
        const text = data.toString();
        outputBuffer += text;

        // Enviar logs al cliente
        const lines = text.split('\n').filter(line => line.trim());
        lines.forEach(line => {
            // Extraer información importante
            if (line.includes('Slug generado:')) {
                propertySlug = line.split('Slug generado:')[1].trim();
            }
            if (line.includes('Título:')) {
                propertyTitle = line.split('Título:')[1].trim();
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
        res.write(`data: ${JSON.stringify({
            type: 'error',
            message: text
        })}\n\n`);
    });

    // Cuando el scraper termine
    scraper.on('close', (code) => {
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
        scraper.kill();
    });
});

// Función para calcular progreso basado en los logs
function calculateProgress(logLine) {
    const milestones = [
        { keyword: 'Navegando', progress: 10 },
        { keyword: 'Extrayendo datos', progress: 20 },
        { keyword: 'Datos extraídos', progress: 30 },
        { keyword: 'Descargando', progress: 40 },
        { keyword: 'descargadas', progress: 60 },
        { keyword: 'Generando HTML', progress: 70 },
        { keyword: 'HTML generado', progress: 80 },
        { keyword: 'Agregando tarjeta', progress: 85 },
        { keyword: 'Publicando', progress: 90 },
        { keyword: 'COMPLETADO', progress: 100 }
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
