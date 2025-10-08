#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/generate', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes('wiggot.com/search/property-detail/')) {
        return res.json({
            success: false,
            message: 'URL inválida'
        });
    }

    try {
        console.log('🚀 Procesando:', url);

        // Ejecutar el scraper
        const output = execSync(
            `node wiggot-scraper-y-publicar.js "${url}"`,
            {
                encoding: 'utf8',
                cwd: __dirname,
                maxBuffer: 10 * 1024 * 1024 // 10MB
            }
        );

        // Extraer información del output
        const priceMatch = output.match(/💰 Precio: ([\d,]+)/);
        const titleMatch = output.match(/🏠 Propiedad: (.+)/);
        const locationMatch = output.match(/📍 Ubicación: (.+)/);
        const photosMatch = output.match(/📸 Fotos: (\d+)/);
        const slugMatch = output.match(/🏷️\s+Slug: (.+)/);

        const price = priceMatch ? priceMatch[1] : 'N/A';
        const title = titleMatch ? titleMatch[1] : 'N/A';
        const location = locationMatch ? locationMatch[1] : 'N/A';
        const photos = photosMatch ? photosMatch[1] : '0';
        const slug = slugMatch ? slugMatch[1].trim() : '';

        const localUrl = slug ? path.join(__dirname, 'culiacan', slug, 'index.html') : '';
        const productionUrl = slug ? `https://casasenventa.info/culiacan/${slug}/` : '';

        res.json({
            success: true,
            message: 'Propiedad generada exitosamente',
            title,
            price,
            location,
            photos,
            localUrl,
            productionUrl,
            output: output.split('\n').slice(-20).join('\n') // Últimas 20 líneas
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.json({
            success: false,
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log('🌐 Servidor corriendo en http://localhost:' + PORT);
    console.log('📄 Abre: wiggot-genera-propiedad.html');
    console.log('');
});
