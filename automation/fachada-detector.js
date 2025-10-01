#!/usr/bin/env node

/**
 * Fachada Detector - Detección automática de fachada usando Claude Vision
 * Analiza imágenes y clasifica cuál es la mejor fachada para usar como cover.jpg
 */

const Anthropic = require('@anthropic-ai/sdk');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración
const FACHADA_SCORE_MIN = 0.72;
const MAX_COVER_SIZE = 1600;
const COVER_QUALITY = 85;
const MODEL = 'claude-3-5-sonnet-20241022';

// Extensiones soportadas
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// System prompt para Claude
const SYSTEM_PROMPT = `Eres un clasificador experto en bienes raíces especializado en identificar fachadas de casas.

SEÑALES POSITIVAS de fachada (aumentan score):
- Cielo visible
- Calle, banqueta o acera visible
- Cochera, portón o entrada principal
- Número de casa visible
- Volúmenes exteriores completos de la construcción
- Vista frontal clara y centrada
- Sin obstáculos que bloqueen la vista

SEÑALES NEGATIVAS (descartan como fachada):
- Espacios interiores: cocina, recámara, baño, sala, comedor
- Closets, pasillos interiores, escaleras interiores
- Acabados de detalle (pisos, techos, ventanas de cerca)
- Muebles o decoración interior
- Fotos muy cercanas de detalles

INSTRUCCIONES:
1. Analiza la imagen cuidadosamente
2. Identifica si es una fachada exterior o espacio interior
3. Detecta las señales positivas y negativas
4. Asigna un score de 0.0 a 1.0 (1.0 = fachada perfecta)
5. Devuelve SOLO el JSON solicitado, sin texto adicional

IMPORTANTE: El JSON debe ser válido y contener exactamente los campos especificados.`;

/**
 * Inicializa el cliente de Anthropic
 */
function initAnthropicClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        throw new Error('❌ ANTHROPIC_API_KEY no encontrada en variables de entorno');
    }

    return new Anthropic({ apiKey });
}

/**
 * Lee una imagen y la convierte a base64
 */
async function imageToBase64(imagePath) {
    try {
        const buffer = await fs.promises.readFile(imagePath);
        const base64 = buffer.toString('base64');

        // Detectar tipo de media
        const ext = path.extname(imagePath).toLowerCase();
        let mediaType = 'image/jpeg';

        if (ext === '.png') mediaType = 'image/png';
        else if (ext === '.webp') mediaType = 'image/webp';

        return { base64, mediaType };
    } catch (error) {
        throw new Error(`Error leyendo imagen ${imagePath}: ${error.message}`);
    }
}

/**
 * Aplica heurísticas por nombre de archivo
 */
function getFilenameBonus(filename) {
    const lower = filename.toLowerCase();
    let bonus = 0;

    // Bonus por nombres que indican fachada
    const positiveKeywords = ['fachada', 'frente', 'front', 'exterior', 'portada', 'cover'];
    if (positiveKeywords.some(kw => lower.includes(kw))) {
        bonus += 0.10;
    }

    // Penalización por nombres que indican interior
    const negativeKeywords = ['interior', 'bath', 'baño', 'kitchen', 'cocina', 'room', 'recamara', 'recámara', 'sala', 'comedor'];
    if (negativeKeywords.some(kw => lower.includes(kw))) {
        bonus -= 0.20;
    }

    return bonus;
}

/**
 * Calcula bonus por señales detectadas
 */
function calculateDetectionBonus(detected) {
    let count = 0;
    if (detected.sky) count++;
    if (detected['calle/banqueta']) count++;
    if (detected['cochera/portón']) count++;
    if (detected.volumen_exterior) count++;

    return count >= 2 ? 0.05 : 0;
}

/**
 * Calcula penalización por anti-señales
 */
function calculateAntiSignalPenalty(antiSignals) {
    return antiSignals && antiSignals.length > 0 ? -0.10 : 0;
}

/**
 * Clasifica una imagen usando Claude Vision
 */
async function classifyWithClaude(client, imagePath) {
    try {
        const filename = path.basename(imagePath);
        console.log(`  🔍 Analizando: ${filename}`);

        // Leer imagen como base64
        const { base64, mediaType } = await imageToBase64(imagePath);

        // Llamar a Claude Vision API
        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType,
                                data: base64
                            }
                        },
                        {
                            type: 'text',
                            text: `Analiza esta imagen y devuelve SOLO este JSON (sin markdown, sin explicaciones):

{
  "is_fachada": boolean,
  "score": number,
  "reasons": "explicación breve",
  "detected": {
    "sky": boolean,
    "calle/banqueta": boolean,
    "cochera/portón": boolean,
    "numero_casa": boolean,
    "volumen_exterior": boolean
  },
  "anti_signals": ["lista", "de", "señales", "negativas"]
}`
                        }
                    ]
                }
            ]
        });

        // Extraer respuesta
        const textContent = response.content.find(c => c.type === 'text');
        if (!textContent) {
            throw new Error('No se recibió respuesta de texto de Claude');
        }

        // Parsear JSON (limpiar markdown si existe)
        let jsonText = textContent.text.trim();
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

        const result = JSON.parse(jsonText);

        // Aplicar heurísticas
        const filenameBonus = getFilenameBonus(filename);
        const detectionBonus = calculateDetectionBonus(result.detected);
        const antiPenalty = calculateAntiSignalPenalty(result.anti_signals);

        let finalScore = result.score + filenameBonus + detectionBonus + antiPenalty;
        finalScore = Math.max(0, Math.min(1, finalScore)); // Clamp 0-1

        return {
            file: filename,
            rawScore: result.score,
            filenameBonus,
            detectionBonus,
            antiPenalty,
            finalScore,
            raw: result
        };

    } catch (error) {
        console.error(`  ❌ Error clasificando ${imagePath}: ${error.message}`);
        return null;
    }
}

/**
 * Selecciona la mejor fachada de un conjunto de imágenes
 */
async function pickFachada(client, imagePaths) {
    console.log(`\n🎯 Analizando ${imagePaths.length} imágenes...`);

    const results = [];

    // Clasificar cada imagen
    for (const imagePath of imagePaths) {
        const result = await classifyWithClaude(client, imagePath);
        if (result) {
            results.push(result);
        }
    }

    if (results.length === 0) {
        throw new Error('No se pudo clasificar ninguna imagen');
    }

    // Ordenar por score final
    results.sort((a, b) => b.finalScore - a.finalScore);

    // Determinar ganador y fallback
    const winner = results[0];
    const fallback = winner.finalScore < FACHADA_SCORE_MIN;

    return {
        winner,
        fallback,
        ranked: results
    };
}

/**
 * Genera cover.jpg optimizado usando sharp
 */
async function writeCover(fromPath, outDir) {
    try {
        const outputPath = path.join(outDir, 'cover.jpg');

        await sharp(fromPath)
            .resize(MAX_COVER_SIZE, MAX_COVER_SIZE, {
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
        console.log('\n🏠 === DETECCIÓN AUTOMÁTICA DE FACHADA ===\n');
        console.log(`📂 Carpeta entrada: ${inDir}`);
        console.log(`📂 Carpeta salida: ${outDir}`);

        // Verificar API key
        if (!process.env.ANTHROPIC_API_KEY) {
            console.error('\n❌ ERROR: ANTHROPIC_API_KEY no encontrada');
            console.error('💡 Configura la variable de entorno antes de continuar\n');
            return null;
        }

        // Inicializar cliente
        const client = initAnthropicClient();

        // Escanear carpeta de entrada
        const files = await fs.promises.readdir(inDir);
        const imagePaths = files
            .filter(f => VALID_EXTENSIONS.includes(path.extname(f).toLowerCase()))
            .map(f => path.join(inDir, f));

        if (imagePaths.length === 0) {
            console.error(`\n❌ No se encontraron imágenes en ${inDir}\n`);
            return null;
        }

        console.log(`\n📸 Encontradas ${imagePaths.length} imágenes`);

        // Clasificar y seleccionar fachada
        const { winner, fallback, ranked } = await pickFachada(client, imagePaths);

        // Mostrar TOP 5
        console.log('\n🏆 === TOP 5 CANDIDATOS ===\n');
        ranked.slice(0, 5).forEach((r, idx) => {
            const icon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
            console.log(`${icon} ${idx + 1}. ${r.file}`);
            console.log(`   Score: ${r.finalScore.toFixed(3)} (raw: ${r.rawScore.toFixed(2)}, bonus: ${r.filenameBonus.toFixed(2)}, detect: ${r.detectionBonus.toFixed(2)}, penalty: ${r.antiPenalty.toFixed(2)})`);
            console.log(`   Razón: ${r.raw.reasons}`);
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
                score: r.finalScore,
                raw: r.raw
            }))
        };

        await fs.promises.writeFile(resultsPath, JSON.stringify(resultsData, null, 2));
        console.log(`  ✅ Resultados guardados: ${resultsPath}`);

        // Mensaje final
        if (fallback) {
            console.log(`\n⚠️  FALLBACK: Score ${winner.finalScore.toFixed(3)} < ${FACHADA_SCORE_MIN}`);
            console.log('💡 Se seleccionó la mejor imagen disponible pero puede no ser fachada ideal\n');
        } else {
            console.log(`\n✅ ÉXITO: Fachada detectada con score ${winner.finalScore.toFixed(3)}\n`);
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
    classifyWithClaude,
    pickFachada,
    writeCover
};
