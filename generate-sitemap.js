#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Generador Automático de Sitemap.xml
 * Escanea todas las propiedades y genera sitemap actualizado
 */

const BASE_URL = 'https://casasenventa.info';
const TODAY = new Date().toISOString().split('T')[0];

function getAllProperties() {
    const properties = [];

    // 1. Propiedades en culiacan/*/index.html
    const culiacanDirs = fs.readdirSync('culiacan', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const dir of culiacanDirs) {
        const indexPath = path.join('culiacan', dir, 'index.html');
        if (fs.existsSync(indexPath)) {
            properties.push({
                url: `${BASE_URL}/culiacan/${dir}/`,
                lastmod: getLastModified(indexPath),
                changefreq: 'monthly',
                priority: 0.8
            });
        }
    }

    // 2. Propiedades de renta en ROOT (casa-renta-*.html)
    const rentFiles = fs.readdirSync('.')
        .filter(file => file.startsWith('casa-renta-') && file.endsWith('.html'));

    for (const file of rentFiles) {
        properties.push({
            url: `${BASE_URL}/${file}`,
            lastmod: getLastModified(file),
            changefreq: 'monthly',
            priority: 0.8
        });
    }

    return properties;
}

function getLastModified(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.mtime.toISOString().split('T')[0];
    } catch (err) {
        return TODAY;
    }
}

function generateSitemap() {
    const properties = getAllProperties();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>${BASE_URL}/</loc>
<lastmod>${TODAY}</lastmod>
<changefreq>weekly</changefreq>
<priority>1.0</priority>
</url>
<url>
<loc>${BASE_URL}/culiacan/</loc>
<lastmod>${TODAY}</lastmod>
<changefreq>weekly</changefreq>
<priority>0.9</priority>
</url>
`;

    // Ordenar propiedades por lastmod (más recientes primero)
    properties.sort((a, b) => b.lastmod.localeCompare(a.lastmod));

    for (const prop of properties) {
        xml += `<url>
<loc>${prop.url}</loc>
<lastmod>${prop.lastmod}</lastmod>
<changefreq>${prop.changefreq}</changefreq>
<priority>${prop.priority}</priority>
</url>
`;
    }

    xml += `</urlset>
`;

    return xml;
}

function main() {
    console.log('🗺️  Generando sitemap.xml actualizado...\n');

    const sitemap = generateSitemap();
    const outputPath = 'sitemap.xml';

    fs.writeFileSync(outputPath, sitemap);

    // Contar URLs
    const urlCount = (sitemap.match(/<loc>/g) || []).length;

    console.log(`✅ Sitemap generado exitosamente!`);
    console.log(`📍 Total URLs: ${urlCount}`);
    console.log(`📅 Fecha: ${TODAY}`);
    console.log(`📄 Archivo: ${outputPath}\n`);

    // Mostrar primeras 10 propiedades
    const lines = sitemap.split('\n');
    const propLines = lines.filter(l => l.includes('<loc>') && !l.includes('/culiacan/</loc>') && !l.includes('casasenventa.info/</loc>'));

    console.log('📋 Últimas 10 propiedades agregadas:');
    propLines.slice(0, 10).forEach((line, i) => {
        const url = line.match(/<loc>(.*?)<\/loc>/)[1];
        console.log(`   ${i + 1}. ${url.replace(BASE_URL, '')}`);
    });
}

main();
