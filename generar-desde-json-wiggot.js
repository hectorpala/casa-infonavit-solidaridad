#!/usr/bin/env node

/**
 * GENERADOR DESDE JSON WIGGOT CON TEMPLATE LA RIOJA
 * USO: node generar-desde-json-wiggot.js wiggot-datos-XXXXX.json
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

function generarSlug(titulo) {
    return titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
}

async function descargarImagen(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        protocol.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => reject(err));
        });
    });
}

async function main() {
    const jsonFile = process.argv[2];

    if (!jsonFile) {
        console.error('❌ ERROR: Proporciona el archivo JSON');
        console.log('💡 USO: node generar-desde-json-wiggot.js wiggot-datos-XXXXX.json');
        process.exit(1);
    }

    // Leer JSON
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    const datos = data.data;
    const slug = `${generarSlug(datos.title)}-${data.propertyId}`;

    console.log(`🚀 GENERADOR CON TEMPLATE LA RIOJA\n`);
    console.log(`📌 Slug: ${slug}`);
    console.log(`💰 Precio: $${datos.price}`);
    console.log(`📍 Ubicación: ${datos.location}\n`);

    // Crear carpetas
    const carpetaPropiedad = `culiacan/${slug}`;
    const carpetaImagenes = `${carpetaPropiedad}/images`;

    if (!fs.existsSync(carpetaPropiedad)) {
        fs.mkdirSync(carpetaPropiedad, { recursive: true });
    }
    if (!fs.existsSync(carpetaImagenes)) {
        fs.mkdirSync(carpetaImagenes, { recursive: true });
    }
    if (!fs.existsSync(`${carpetaImagenes}/webp`)) {
        fs.mkdirSync(`${carpetaImagenes}/webp`);
    }
    if (!fs.existsSync(`${carpetaImagenes}/optimized`)) {
        fs.mkdirSync(`${carpetaImagenes}/optimized`);
    }

    console.log(`📁 Carpeta creada: ${carpetaPropiedad}\n`);

    // Descargar fotos
    console.log(`📸 Descargando ${datos.images.length} fotos...`);
    for (let i = 0; i < datos.images.length; i++) {
        const url = datos.images[i];
        const filename = `foto-${i + 1}.jpg`;
        const filepath = path.join(carpetaImagenes, filename);

        await descargarImagen(url, filepath);
        console.log(`   ✅ ${filename}`);
    }
    console.log(`✅ Fotos descargadas\n`);

    // Leer template La Rioja
    let html = fs.readFileSync('culiacan/casa-venta-la-rioja-477140/index.html', 'utf8');

    // Reemplazos básicos
    html = html.replace(/casa-venta-la-rioja-477140/g, slug);
    html = html.replace(/La Rioja/g, datos.location.split(',')[0].trim());
    html = html.replace(/\$1,800,000/g, `$${datos.price}`);
    html = html.replace(/"1800000"/g, `"${datos.price.replace(/,/g, '')}"`);
    html = html.replace(/1800000/g, datos.price.replace(/,/g, ''));

    // Título
    html = html.replace(
        /<h1 class="hero-title">.*?<\/h1>/,
        `<h1 class="hero-title">${datos.title}</h1>`
    );

    // Descripción (hero subtitle)
    html = html.replace(
        /<p class="hero-subtitle">.*?<\/p>/s,
        `<p class="hero-subtitle">${datos.description}</p>`
    );

    // Meta description (150 chars)
    const metaDesc = datos.description.substring(0, 150).trim();
    html = html.replace(
        /<meta name="description" content=".*?">/,
        `<meta name="description" content="${metaDesc}">`
    );

    // OG description - reemplazar todo el bloque
    html = html.replace(
        /<meta property="og:description" content="[\s\S]*?">/,
        `<meta property="og:description" content="${metaDesc}">`
    );

    // Schema.org description
    html = html.replace(
        /"description": ".*?",/s,
        `"description": "${datos.description.replace(/"/g, '\\"')}",`
    );

    // Schema.org images - generar array correcto
    const schemaImages = datos.images.map((img, i) =>
        `        "https://casasenventa.info/culiacan/${slug}/images/foto-${i + 1}.jpg"`
    ).join(',\n');

    html = html.replace(
        /"image": \[[\s\S]*?\],/,
        `"image": [\n${schemaImages}\n      ],`
    );

    // Schema.org floorSize
    html = html.replace(
        /"value": \d+,\s*"unitCode": "MTK"\s*\}/,
        `"value": ${datos.area_construida},\n        "unitCode": "MTK"\n      }`
    );

    // Schema.org lotSize
    html = html.replace(
        /"lotSize": \{[\s\S]*?"unitCode": "MTK"\s*\}/,
        `"lotSize": {\n        "@type": "QuantitativeValue",\n        "value": ${datos.area_terreno},\n        "unitCode": "MTK"\n      }`
    );

    // Schema.org bedrooms
    html = html.replace(
        /"numberOfBedrooms": \d+/,
        `"numberOfBedrooms": ${datos.bedrooms}`
    );

    // Schema.org bathrooms
    html = html.replace(
        /"numberOfBathroomsTotal": [\d.]+/,
        `"numberOfBathroomsTotal": ${datos.bathrooms}`
    );
    html = html.replace(
        /"numberOfFullBathrooms": \d+/,
        `"numberOfFullBathrooms": ${Math.floor(parseFloat(datos.bathrooms))}`
    );

    // Keywords
    html = html.replace(
        /<meta name="keywords" content=".*?">/,
        `<meta name="keywords" content="casa venta Culiacán, ${datos.location.split(',')[0].trim()}, ${datos.bedrooms} recámaras, ${datos.bathrooms} baños">`
    );

    // Actualizar características en el texto
    html = html.replace(/3 recámaras/gi, `${datos.bedrooms} recámaras`);
    html = html.replace(/2 baños/gi, `${datos.bathrooms} baños`);
    html = html.replace(/2\.5 baños/gi, `${datos.bathrooms} baños`);
    html = html.replace(/120m²/g, `${datos.area_construida}m²`);
    html = html.replace(/150m²/g, `${datos.area_terreno}m²`);

    // Actualizar total de slides
    html = html.replace(/const totalSlidesHero = \d+;/, `const totalSlidesHero = ${datos.images.length};`);

    // Guardar HTML
    fs.writeFileSync(`${carpetaPropiedad}/index.html`, html);
    console.log(`✅ HTML generado: ${carpetaPropiedad}/index.html\n`);

    console.log(`🎉 ¡PÁGINA GENERADA CON ÉXITO!\n`);
    console.log(`📂 Archivos creados:`);
    console.log(`   - ${carpetaPropiedad}/index.html`);
    console.log(`   - ${carpetaPropiedad}/images/ (${datos.images.length} fotos)\n`);
    console.log(`🌐 Para revisar localmente:`);
    console.log(`   open "${carpetaPropiedad}/index.html"\n`);
}

main().catch(console.error);
