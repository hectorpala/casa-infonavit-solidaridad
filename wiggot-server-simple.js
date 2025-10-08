#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Handle POST to /generate
    if (req.method === 'POST' && req.url === '/generate') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { url } = JSON.parse(body);

                if (!url || !url.includes('wiggot.com/search/property-detail/')) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'URL inválida'
                    }));
                    return;
                }

                console.log('🚀 Procesando:', url);

                // Ejecutar el scraper
                const command = `node wiggot-scraper-y-publicar.js "${url}"`;

                exec(command, {
                    cwd: __dirname,
                    maxBuffer: 10 * 1024 * 1024
                }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('❌ Error:', error.message);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            message: error.message
                        }));
                        return;
                    }

                    // Extraer información del output
                    const priceMatch = stdout.match(/💰 Precio: ([\d,]+)/);
                    const titleMatch = stdout.match(/🏠 Propiedad: (.+)/);
                    const locationMatch = stdout.match(/📍 Ubicación: (.+)/);
                    const photosMatch = stdout.match(/📸 Fotos: (\d+)/);
                    const slugMatch = stdout.match(/🏷️\s+Slug: (.+)/);

                    const price = priceMatch ? priceMatch[1] : 'N/A';
                    const title = titleMatch ? titleMatch[1] : 'N/A';
                    const location = locationMatch ? locationMatch[1] : 'N/A';
                    const photos = photosMatch ? photosMatch[1] : '0';
                    const slug = slugMatch ? slugMatch[1].trim() : '';

                    const localPath = slug ? path.join(__dirname, 'culiacan', slug, 'index.html') : '';
                    const productionUrl = slug ? `https://casasenventa.info/culiacan/${slug}/` : '';

                    console.log('✅ Completado:', title);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Propiedad generada exitosamente',
                        title,
                        price,
                        location,
                        photos,
                        localPath,
                        productionUrl,
                        slug
                    }));

                    // Abrir la página automáticamente
                    if (localPath) {
                        exec(`open "${localPath}"`);
                    }
                });

            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Error parseando JSON'
                }));
            }
        });

        return;
    }

    // 404 para otras rutas
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log('\n🌐 Servidor Wiggot corriendo en http://localhost:' + PORT);
    console.log('📄 Abre: wiggot-genera-propiedad.html');
    console.log('💡 Para detener: Ctrl+C\n');
});
