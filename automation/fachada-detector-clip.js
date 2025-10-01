#!/usr/bin/env node

/**
 * Fachada Detector CLIP - Detección automática de fachada SIN API
 * Usa @xenova/transformers (CLIP offline) + sharp
 * 100% local, sin costos de API
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración
const FACHADA_SCORE_MIN = 0.60;
const COVER_MAX = 1600;
const COVER_QUALITY = 85;

// Prompts para clasificación
const POS_PROMPTS = [
    "a wide photo of a house exterior front facade, street and driveway visible",
    "a photo of a residential building front with garage or gate",
    "a photo of a house from the street with sky visible"
];

const NEG_PROMPTS = [
    "an indoor kitchen photo",
    "an indoor bedroom photo",
    "a bathroom interior photo",
    "a living room interior photo",
    "a closet interior photo",
    "a corridor or hallway interior photo"
];

// Heurísticas por nombre
const POS_HINTS = ["fachada", "frente", "front", "exterior", "portada"];
const NEG_HINTS = ["interior", "bath", "baño", "kitchen", "cocina", "room", "recamara", "recámara"];

// Extensiones soportadas
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Cache del modelo CLIP
let clipModel = null;
let clipProcessor = null;
let clipTokenizer = null;
let positiveEmbeddings = null;
let negativeEmbeddings = null;

/**
 * Carga el modelo CLIP (primera vez es lento, después usa cache)
 */
async function loadClip() {
    if (clipModel) return { model: clipModel, processor: clipProcessor, tokenizer: clipTokenizer };

    try {
        console.log('📦 Cargando modelo CLIP (primera vez puede tardar ~1 min)...');

        const { AutoTokenizer, CLIPTextModelWithProjection, AutoProcessor, CLIPVisionModelWithProjection } = require('@xenova/transformers');

        // Cargar modelos
        clipTokenizer = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch32');
        clipModel = await CLIPTextModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32');
        clipProcessor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch32');
        const visionModel = await CLIPVisionModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32');

        clipModel.visionModel = visionModel;

        console.log('✅ Modelo CLIP cargado\n');

        return { model: clipModel, processor: clipProcessor, tokenizer: clipTokenizer };
    } catch (error) {
        throw new Error(`Error cargando CLIP: ${error.message}`);
    }
}

/**
 * Genera embeddings de texto para múltiples prompts
 */
async function embedTextBatch(prompts) {
    const { model, tokenizer } = await loadClip();

    const inputs = await tokenizer(prompts, { padding: true, truncation: true });
    const output = await model(inputs);

    return output.text_embeds.tolist();
}

/**
 * Genera embedding de una imagen
 */
async function embedImage(imagePath) {
    const { model, processor } = await loadClip();

    // Leer y preprocesar imagen
    const imageBuffer = await fs.promises.readFile(imagePath);
    const image = await sharp(imageBuffer)
        .resize(224, 224, { fit: 'cover' })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { data, info } = image;

    // Convertir a tensor
    const pixelData = new Float32Array(3 * 224 * 224);
    for (let i = 0; i < 224 * 224; i++) {
        pixelData[i] = data[i * 3] / 255.0;                    // R
        pixelData[224 * 224 + i] = data[i * 3 + 1] / 255.0;    // G
        pixelData[224 * 224 * 2 + i] = data[i * 3 + 2] / 255.0; // B
    }

    const inputTensor = {
        pixel_values: {
            data: pixelData,
            dims: [1, 3, 224, 224]
        }
    };

    const output = await model.visionModel(inputTensor);

    return output.image_embeds.tolist()[0];
}

/**
 * Calcula similitud coseno entre dos vectores
 */
function cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Heurísticas por nombre de archivo
 */
function filenameHeuristics(name) {
    const lower = name.toLowerCase();
    let bonus = 0;

    if (POS_HINTS.some(hint => lower.includes(hint))) {
        bonus += 0.10;
    }

    if (NEG_HINTS.some(hint => lower.includes(hint))) {
        bonus -= 0.20;
    }

    return bonus;
}

/**
 * Detecta si hay cielo en la banda superior de la imagen (heurística simple)
 */
async function hasSkyTopBand(imagePath) {
    try {
        const { data, info } = await sharp(imagePath)
            .resize(100, 100, { fit: 'cover' })
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Analizar top 20% (primeras 20 filas de 100)
        let bluePixels = 0;
        const totalPixels = 20 * 100;

        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 100; x++) {
                const idx = (y * 100 + x) * 3;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // Heurística simple: azul dominante indica cielo
                if (b > r && b > g && b > 100) {
                    bluePixels++;
                }
            }
        }

        return bluePixels / totalPixels >= 0.20; // 20% o más de píxeles azules
    } catch (error) {
        return false;
    }
}

/**
 * Calcula score de una imagen
 */
async function scoreImage(imagePath, posEmb, negEmb) {
    try {
        const filename = path.basename(imagePath);
        console.log(`  🔍 Analizando: ${filename}`);

        // Obtener embedding de la imagen
        const imgEmb = await embedImage(imagePath);

        // Calcular similitudes con prompts positivos y negativos
        const posSimilarities = posEmb.map(p => cosineSimilarity(imgEmb, p));
        const negSimilarities = negEmb.map(n => cosineSimilarity(imgEmb, n));

        const posAvg = posSimilarities.reduce((a, b) => a + b, 0) / posSimilarities.length;
        const negAvg = negSimilarities.reduce((a, b) => a + b, 0) / negSimilarities.length;

        // Score base
        let score = posAvg - negAvg;

        // Heurística de nombre
        const nameBonus = filenameHeuristics(filename);
        score += nameBonus;

        // Heurística panorámica
        const metadata = await sharp(imagePath).metadata();
        const aspectRatio = metadata.width / metadata.height;
        const panoramicBonus = aspectRatio >= 1.3 ? 0.05 : 0;
        score += panoramicBonus;

        // Heurística de cielo
        const hasSky = await hasSkyTopBand(imagePath);
        const skyBonus = hasSky ? 0.05 : 0;
        score += skyBonus;

        return {
            file: filename,
            score: Math.max(0, Math.min(1, score)), // Clamp 0-1
            positives_avg: posAvg,
            negatives_avg: negAvg,
            name_bonus: nameBonus,
            panoramic_bonus: panoramicBonus,
            sky_bonus: skyBonus,
            has_sky: hasSky
        };

    } catch (error) {
        console.error(`  ❌ Error en ${path.basename(imagePath)}: ${error.message}`);
        return null;
    }
}

/**
 * Selecciona la mejor fachada de un conjunto de imágenes
 */
async function pickFachada(imagePaths) {
    console.log(`\n🎯 Analizando ${imagePaths.length} imágenes con CLIP offline...\n`);

    // Cargar modelo y generar embeddings de texto (una sola vez)
    await loadClip();

    if (!positiveEmbeddings) {
        console.log('📝 Generando embeddings de prompts...');
        positiveEmbeddings = await embedTextBatch(POS_PROMPTS);
        negativeEmbeddings = await embedTextBatch(NEG_PROMPTS);
        console.log('✅ Embeddings listos\n');
    }

    // Analizar cada imagen
    const results = [];
    for (const imagePath of imagePaths) {
        const result = await scoreImage(imagePath, positiveEmbeddings, negativeEmbeddings);
        if (result) {
            results.push(result);
        }
    }

    if (results.length === 0) {
        throw new Error('No se pudo analizar ninguna imagen');
    }

    // Ordenar por score
    results.sort((a, b) => b.score - a.score);

    const winner = results[0];
    const fallback = winner.score < FACHADA_SCORE_MIN;

    return {
        winner,
        fallback,
        ranked: results
    };
}

/**
 * Genera cover.jpg optimizado
 */
async function writeCover(fromPath, outDir) {
    try {
        const outputPath = path.join(outDir, 'cover.jpg');

        await sharp(fromPath)
            .resize(COVER_MAX, COVER_MAX, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: COVER_QUALITY })
            .toFile(outputPath);

        const stats = await fs.promises.stat(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(1);

        console.log(`  ✅ Cover generado: ${outputPath} (${sizeKB} KB)`);
        return outputPath;

    } catch (error) {
        throw new Error(`Error generando cover: ${error.message}`);
    }
}

/**
 * Función principal: Analiza un lote de fotos y genera cover.jpg
 */
async function setCoverFromBatch(inDir, outDir) {
    try {
        console.log('\n🏠 === DETECCIÓN AUTOMÁTICA DE FACHADA (CLIP OFFLINE) ===\n');
        console.log(`📂 Carpeta entrada: ${inDir}`);
        console.log(`📂 Carpeta salida: ${outDir}`);

        // Escanear carpeta
        const files = await fs.promises.readdir(inDir);
        const imagePaths = files
            .filter(f => VALID_EXTENSIONS.includes(path.extname(f).toLowerCase()))
            .map(f => path.join(inDir, f));

        if (imagePaths.length === 0) {
            console.error(`\n❌ No se encontraron imágenes en ${inDir}\n`);
            return null;
        }

        console.log(`\n📸 Encontradas ${imagePaths.length} imágenes`);

        // Analizar y seleccionar fachada
        const { winner, fallback, ranked } = await pickFachada(imagePaths);

        // Mostrar TOP 5
        console.log('\n🏆 === TOP 5 CANDIDATOS ===\n');
        ranked.slice(0, 5).forEach((r, idx) => {
            const icon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
            console.log(`${icon} ${idx + 1}. ${r.file}`);
            console.log(`   Score: ${r.score.toFixed(3)} (pos: ${r.positives_avg.toFixed(2)}, neg: ${r.negatives_avg.toFixed(2)})`);
            console.log(`   Bonus: nombre=${r.name_bonus.toFixed(2)}, panorámico=${r.panoramic_bonus.toFixed(2)}, cielo=${r.sky_bonus.toFixed(2)}`);
            console.log('');
        });

        // Generar cover.jpg
        const winnerPath = path.join(inDir, winner.file);
        const coverPath = await writeCover(winnerPath, outDir);

        // Generar resultados.json
        const resultsPath = path.join(outDir, 'resultados.json');
        const resultsData = {
            cover: 'cover.jpg',
            selected_from: winner.file,
            fallback,
            threshold: FACHADA_SCORE_MIN,
            ranked: ranked.map(r => ({
                file: r.file,
                score: r.score,
                positives_avg: r.positives_avg,
                negatives_avg: r.negatives_avg
            }))
        };

        await fs.promises.writeFile(resultsPath, JSON.stringify(resultsData, null, 2));
        console.log(`  ✅ Resultados guardados: ${resultsPath}`);

        // Mensaje final
        if (fallback) {
            console.log(`\n⚠️  FALLBACK: Score ${winner.score.toFixed(3)} < ${FACHADA_SCORE_MIN}`);
            console.log('💡 Se seleccionó la mejor imagen disponible\n');
        } else {
            console.log(`\n✅ ÉXITO: Fachada detectada con score ${winner.score.toFixed(3)}\n`);
        }

        return {
            coverPath,
            winner,
            fallback,
            ranked
        };

    } catch (error) {
        console.error(`\n❌ ERROR: ${error.message}\n`);
        throw error;
    }
}

module.exports = {
    setCoverFromBatch,
    loadClip,
    embedTextBatch,
    embedImage,
    filenameHeuristics,
    hasSkyTopBand,
    scoreImage,
    pickFachada,
    writeCover
};
