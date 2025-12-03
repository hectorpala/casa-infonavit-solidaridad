#!/usr/bin/env node
/**
 * Convertir imágenes JPG/PNG a WebP
 * Usa Sharp para compresión eficiente
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const QUALITY = 80; // Calidad WebP (0-100)
const TARGET_DIR = 'culiacan';

let converted = 0;
let skipped = 0;
let totalSavedBytes = 0;

async function convertImage(inputPath) {
    const ext = path.extname(inputPath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

    const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

    // Skip si ya existe WebP
    if (fs.existsSync(outputPath)) {
        skipped++;
        return;
    }

    try {
        const inputStats = fs.statSync(inputPath);

        await sharp(inputPath)
            .webp({ quality: QUALITY })
            .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);
        const saved = inputStats.size - outputStats.size;
        totalSavedBytes += saved;

        converted++;
        if (converted % 100 === 0) {
            console.log(`  ✓ ${converted} imágenes convertidas...`);
        }
    } catch (err) {
        console.error(`  ✗ Error: ${inputPath} - ${err.message}`);
    }
}

async function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            await processDirectory(fullPath);
        } else if (entry.isFile()) {
            await convertImage(fullPath);
        }
    }
}

async function main() {
    console.log('🖼️  Convirtiendo imágenes a WebP...\n');
    console.log(`📁 Directorio: ${TARGET_DIR}`);
    console.log(`📊 Calidad: ${QUALITY}%\n`);

    const startTime = Date.now();
    await processDirectory(TARGET_DIR);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    const savedMB = (totalSavedBytes / 1024 / 1024).toFixed(1);

    console.log(`\n✅ Completado en ${elapsed}s`);
    console.log(`   - Convertidas: ${converted}`);
    console.log(`   - Omitidas (ya WebP): ${skipped}`);
    console.log(`   - Espacio ahorrado: ${savedMB} MB`);
}

main().catch(console.error);
