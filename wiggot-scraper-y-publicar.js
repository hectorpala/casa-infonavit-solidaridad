#!/usr/bin/env node

/**
 * SCRAPER Y PUBLICADOR AUTOMÁTICO DE PROPIEDADES
 *
 * USO: node scraper-y-publicar.js "URL_DE_WIGGOT"
 *
 * PROCESO COMPLETO:
 * 1. Scrapea datos de Wiggot (título, precio, fotos, descripción)
 * 2. Descarga todas las fotos
 * 3. Genera página HTML desde template La Rioja
 * 4. Agrega tarjeta a culiacan/index.html
 * 5. Listo para "publica ya"
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

// ============================================
// BLOQUE 1: VARIABLES Y SEGURIDAD (.env)
// ============================================

// Cargar variables de entorno desde .env
require('dotenv').config();

// Configuración con modo degradado
const CONFIG = {
    wiggot: {
        email: process.env.WIGGOT_EMAIL || null,
        password: process.env.WIGGOT_PASSWORD || null
    },
    googleMaps: {
        key: process.env.GOOGLE_MAPS_KEY || null
    },
    degradedMode: {
        errors: []
    }
};

// Validación de variables críticas
if (!CONFIG.wiggot.email || !CONFIG.wiggot.password) {
    CONFIG.degradedMode.errors.push({
        type: 'CREDENTIALS_MISSING',
        message: 'Wiggot credentials not found in .env',
        impact: 'Auto-login will fail'
    });
    console.warn('⚠️  MODO DEGRADADO: Credenciales Wiggot no encontradas en .env');
}

if (!CONFIG.googleMaps.key) {
    CONFIG.degradedMode.errors.push({
        type: 'MAPS_KEY_MISSING',
        message: 'Google Maps API key not found in .env',
        impact: 'Maps will not load'
    });
    console.warn('⚠️  MODO DEGRADADO: Google Maps API key no encontrada en .env');
}

// Aliases para compatibilidad con código existente
const WIGGOT_EMAIL = CONFIG.wiggot.email;
const WIGGOT_PASSWORD = CONFIG.wiggot.password;
const GOOGLE_MAPS_KEY = CONFIG.googleMaps.key;

// ============================================
// FIN BLOQUE 1
// ============================================

// ============================================
// BLOQUE 2: MODOS DE EJECUCIÓN (prod/test/shadow)
// ============================================

// Detectar modo desde --mode=prod|test|shadow o variable de entorno MODE
const MODE = (() => {
    // Buscar en argumentos --mode=xxx
    const modeArg = process.argv.find(arg => arg.startsWith('--mode='));
    if (modeArg) {
        return modeArg.split('=')[1];
    }
    // Buscar en variable de entorno MODE
    if (process.env.MODE) {
        return process.env.MODE;
    }
    // Default: prod
    return 'prod';
})();

// Validar modo
if (!['prod', 'test', 'shadow'].includes(MODE)) {
    console.error(`❌ ERROR: Modo inválido "${MODE}". Usa: prod, test, o shadow`);
    process.exit(1);
}

// Configuración de rutas según modo
const PATHS = {
    prod: {
        data: 'data/items',
        media: 'culiacan',
        html: 'culiacan'
    },
    test: {
        data: 'data/items_test',
        media: 'data/media_test',
        html: 'data/html_test'
    },
    shadow: {
        data: 'data/items_test',      // Escribe JSON en test
        media: 'culiacan',             // Publica normal
        html: 'culiacan'               // Publica normal
    }
};

// Agregar configuración de modo a CONFIG
CONFIG.mode = {
    current: MODE,
    paths: PATHS[MODE],
    isTest: MODE === 'test',
    isShadow: MODE === 'shadow',
    isProd: MODE === 'prod'
};

// Crear directorios necesarios
if (MODE === 'test' || MODE === 'shadow') {
    ['data/items_test', 'data/media_test', 'data/html_test'].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// ============================================
// FIN BLOQUE 2
// ============================================

// ============================================
// BLOQUE 3: CARPETERÍA Y FALLBACKS EN MAC
// ============================================

// Crear estructura de carpetas completa en runtime
const REQUIRED_DIRS = [
    'data',
    'data/items',
    'data/items_test',
    'data/media',
    'data/media_test',
    'data/html_test',
    'culiacan',
    'images',
    'css'
];

// Crear todas las carpetas necesarias
REQUIRED_DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Carpeta creada: ${dir}/`);
    }
});

// Fallback: Verificar y crear culiacan/index.html mínimo si no existe
function ensureCuliacanIndex() {
    const culiacanIndexPath = 'culiacan/index.html';

    if (!fs.existsSync(culiacanIndexPath)) {
        console.log('⚠️  culiacan/index.html no existe, creando versión mínima...');

        const minimalHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Propiedades en Culiacán | Hector es Bienes Raíces</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Poppins', sans-serif; }
        .property-card { cursor: pointer; }
        .property-card:hover { transform: translateY(-4px); transition: all 0.3s; }
    </style>
</head>
<body class="bg-gray-50">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-8">Propiedades en Culiacán</h1>

        <!-- Properties Grid Container - Las tarjetas se insertan aquí -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="properties-grid">
            <!-- Las propiedades se agregarán aquí automáticamente -->
        </div>
    </div>

    <script>
        // Hacer tarjetas clickeables
        document.addEventListener('click', function(e) {
            const card = e.target.closest('[data-href]');
            if (card) {
                window.location.href = card.dataset.href;
            }
        });
    </script>
</body>
</html>`;

        fs.writeFileSync(culiacanIndexPath, minimalHTML);
        console.log('✅ culiacan/index.html creado con estructura mínima');
    }
}

// Fallback: Template HTML mínimo embebido si no existe archivo
function getMinimalTemplate() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} | Hector es Bienes Raíces</title>
    <meta name="description" content="{{DESCRIPTION}}">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 20px; text-align: center; }
        .hero h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .price { font-size: 3rem; font-weight: bold; margin: 20px 0; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 40px 0; }
        .feature { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .cta-button { display: inline-block; background: #25D366; color: white; padding: 15px 40px; border-radius: 50px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .cta-button:hover { background: #1ea952; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>{{TITLE}}</h1>
        <p>{{LOCATION}}</p>
        <div class="price">{{PRICE}}</div>
    </div>

    <div class="container">
        <div class="features">
            <div class="feature">
                <i class="fas fa-bed"></i>
                <h3>{{BEDROOMS}} Recámaras</h3>
            </div>
            <div class="feature">
                <i class="fas fa-bath"></i>
                <h3>{{BATHROOMS}} Baños</h3>
            </div>
            <div class="feature">
                <i class="fas fa-car"></i>
                <h3>{{PARKING}} Estacionamientos</h3>
            </div>
            <div class="feature">
                <i class="fas fa-ruler-combined"></i>
                <h3>{{CONSTRUCTION_AREA}}m² Construcción</h3>
            </div>
        </div>

        <p>{{DESCRIPTION}}</p>

        <div style="text-align: center; margin: 40px 0;">
            <a href="https://wa.me/526677234048?text=Hola%2C%20me%20interesa%20{{TITLE}}" class="cta-button">
                <i class="fas fa-whatsapp"></i> Contactar por WhatsApp
            </a>
        </div>
    </div>
</body>
</html>`;
}

// Ejecutar fallbacks al inicio
ensureCuliacanIndex();

// ============================================
// FIN BLOQUE 3
// ============================================

// ============================================
// BLOQUE 4: ID ESTABLE Y SLUG
// ============================================

/**
 * Extrae el listing ID de la URL de Wiggot
 * Formato esperado: https://new.wiggot.com/search/property-detail/{listingId}
 * @param {string} url - URL de Wiggot
 * @returns {string|null} - Listing ID o null si no se encuentra
 */
function extractWiggotListingId(url) {
    // Intentar extraer el ID de la URL
    // Formato 1: /property-detail/{id}
    const match1 = url.match(/property-detail\/([a-zA-Z0-9_-]+)/);
    if (match1) return match1[1];

    // Formato 2: Final de la URL después del último /
    const parts = url.split('/').filter(p => p.length > 0);
    const lastPart = parts[parts.length - 1];

    // Verificar que sea un ID válido (alfanumérico, guiones, guiones bajos)
    if (/^[a-zA-Z0-9_-]+$/.test(lastPart) && lastPart.length >= 5) {
        return lastPart;
    }

    return null;
}

/**
 * Genera un ID estable para la propiedad
 * Formato: wiggot:{listingId} o wiggot:sha256(url)[:16] si no se puede extraer
 * @param {string} url - URL de la propiedad
 * @returns {string} - ID estable en formato wiggot:{id}
 */
function generateStableId(url) {
    const listingId = extractWiggotListingId(url);

    if (listingId) {
        return `wiggot:${listingId}`;
    }

    // Fallback: SHA256 de la URL (primeros 16 caracteres)
    const hash = crypto.createHash('sha256').update(url).digest('hex').substring(0, 16);
    console.log(`   ⚠️  No se pudo extraer listing ID, usando hash: wiggot:${hash}`);
    return `wiggot:${hash}`;
}

/**
 * Calcula hash SHA256 del contenido para detectar cambios
 * @param {object} data - Datos de la propiedad
 * @returns {string} - Hash SHA256 (primeros 16 caracteres)
 */
function calculateContentHash(data) {
    const content = JSON.stringify({
        title: data.title,
        price: data.price,
        location: data.location,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        construction_area: data.construction_area,
        land_area: data.land_area,
        description: data.description
    });
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

// ============================================
// FIN BLOQUE 4
// ============================================

// ============================================
// BLOQUE 5: JSON MAESTRO (FUENTE ÚNICA DE VERDAD)
// ============================================

/**
 * Carga el JSON maestro de una propiedad si existe
 * @param {string} id - ID estable de la propiedad
 * @param {string} dataPath - Ruta a la carpeta de datos
 * @returns {object|null} - JSON maestro o null si no existe
 */
function loadMasterJSON(id, dataPath) {
    const jsonPath = `${dataPath}/${id}.json`;

    if (fs.existsSync(jsonPath)) {
        try {
            const content = fs.readFileSync(jsonPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error(`   ❌ Error leyendo JSON maestro: ${error.message}`);
            return null;
        }
    }

    return null;
}

/**
 * Guarda el JSON maestro de forma atómica (archivo .tmp + rename)
 * @param {string} id - ID estable de la propiedad
 * @param {object} masterData - Datos completos del JSON maestro
 * @param {string} dataPath - Ruta a la carpeta de datos
 * @returns {string} - Ruta del archivo guardado
 */
function saveMasterJSON(id, masterData, dataPath) {
    const jsonPath = `${dataPath}/${id}.json`;
    const tmpPath = `${dataPath}/${id}.json.tmp`;

    try {
        // Escribir a archivo temporal
        fs.writeFileSync(tmpPath, JSON.stringify(masterData, null, 2), 'utf8');

        // Rename atómico (POSIX garantiza atomicidad)
        fs.renameSync(tmpPath, jsonPath);

        return jsonPath;
    } catch (error) {
        console.error(`   ❌ Error guardando JSON maestro: ${error.message}`);
        // Limpiar archivo temporal si existe
        if (fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath);
        }
        throw error;
    }
}

/**
 * Crea o actualiza el JSON maestro de una propiedad
 * @param {string} id - ID estable
 * @param {string} url - URL de la propiedad
 * @param {object} scrapedData - Datos scrapeados
 * @param {object} config - Configuración de la propiedad
 * @param {string} dataPath - Ruta a carpeta de datos
 * @param {string} slug - Slug para URL web
 * @returns {object} - JSON maestro actualizado
 */
function createOrUpdateMasterJSON(id, url, scrapedData, config, dataPath, slug) {
    const now = new Date().toISOString();
    const contentHash = calculateContentHash(config);

    // Cargar JSON existente si hay
    let masterJSON = loadMasterJSON(id, dataPath);

    const isNewProperty = !masterJSON;

    if (isNewProperty) {
        // Crear nuevo JSON maestro
        masterJSON = {
            // Identificadores
            id: id,
            source_url: url,
            slug: slug, // Slug solo para rutas web (NO para dedupe)

            // Estado
            state: 'scraped', // scraped | validated | published | failed

            // Datos principales
            data: {
                title: config.title,
                price: config.price,
                location: config.location,
                description: config.description,
                features: {
                    bedrooms: config.bedrooms,
                    bathrooms: config.bathrooms,
                    parking: config.parking,
                    levels: config.levels,
                    construction_area: config.construction_area,
                    land_area: config.land_area
                },
                photos: {
                    count: config.photoCount,
                    urls: scrapedData.images
                }
            },

            // Publicación
            publisher: {
                mode: CONFIG.mode.current,
                html_path: `${CONFIG.mode.paths.html}/${slug}/index.html`,
                images_path: `${CONFIG.mode.paths.html}/${slug}/images/`,
                published_url: `https://casasenventa.info/culiacan/${slug}/`
            },

            // Integridad
            content_hash: contentHash,

            // Errores y logs
            errors: [],
            warnings: [],

            // Timestamps
            created_at: now,
            last_run: now,
            last_success_at: now,
            last_updated: now,

            // Snapshots
            last_good_snapshot: {
                timestamp: now,
                content_hash: contentHash,
                data: { ...config }
            },

            // Retry policy
            retry_policy: {
                max_retries: 3,
                retry_count: 0,
                backoff_seconds: 60
            },

            // Próxima acción
            next_action: null, // null | 'retry_scrape' | 'validate' | 'publish'

            // Versiones de herramientas
            tool_versions: {
                scraper: '3.0.0',
                node: process.version,
                timestamp: now
            },

            // Raw data (respaldo)
            raw_data: scrapedData
        };

        console.log(`   📝 Creando JSON maestro nuevo: ${id}`);
    } else {
        // Actualizar JSON existente
        const hasChanged = masterJSON.content_hash !== contentHash;

        if (hasChanged) {
            console.log(`   🔄 Contenido cambió (hash: ${masterJSON.content_hash} → ${contentHash})`);

            // Guardar snapshot anterior si el contenido cambió
            if (masterJSON.state === 'published') {
                masterJSON.previous_snapshots = masterJSON.previous_snapshots || [];
                masterJSON.previous_snapshots.push({
                    timestamp: masterJSON.last_updated,
                    content_hash: masterJSON.content_hash,
                    data: { ...masterJSON.data }
                });

                // Mantener solo los últimos 5 snapshots
                if (masterJSON.previous_snapshots.length > 5) {
                    masterJSON.previous_snapshots = masterJSON.previous_snapshots.slice(-5);
                }
            }

            // Actualizar datos
            masterJSON.data = {
                title: config.title,
                price: config.price,
                location: config.location,
                description: config.description,
                features: {
                    bedrooms: config.bedrooms,
                    bathrooms: config.bathrooms,
                    parking: config.parking,
                    levels: config.levels,
                    construction_area: config.construction_area,
                    land_area: config.land_area
                },
                photos: {
                    count: config.photoCount,
                    urls: scrapedData.images
                }
            };

            masterJSON.content_hash = contentHash;
            masterJSON.last_good_snapshot = {
                timestamp: now,
                content_hash: contentHash,
                data: { ...config }
            };
        } else {
            console.log(`   ✅ Contenido sin cambios (hash: ${contentHash})`);
        }

        // Actualizar timestamps
        masterJSON.last_run = now;
        masterJSON.last_success_at = now;
        masterJSON.last_updated = now;

        // Resetear retry count en éxito
        masterJSON.retry_policy.retry_count = 0;

        // Actualizar raw_data
        masterJSON.raw_data = scrapedData;
    }

    // Guardar JSON maestro de forma atómica
    const savedPath = saveMasterJSON(id, masterJSON, dataPath);
    console.log(`   💾 JSON maestro guardado: ${savedPath}`);

    return masterJSON;
}

// ============================================
// FIN BLOQUE 5
// ============================================

async function main() {
    const url = process.argv.find(arg => arg.includes('wiggot.com'));

    if (!url) {
        console.error('❌ ERROR: Debes proporcionar una URL de Wiggot');
        console.log('💡 USO: node wiggot-scraper-y-publicar.js "https://new.wiggot.com/search/property-detail/XXXXX" [--mode=prod|test|shadow]');
        console.log('');
        console.log('MODOS:');
        console.log('  prod   → Producción (default): Publica HTML + escribe data/items/{id}.json');
        console.log('  test   → Testing: Solo escribe data/items_test/{id}.json + media_test/');
        console.log('  shadow → Shadow: Publica HTML normal + escribe data/items_test/{id}.json');
        process.exit(1);
    }

    console.log('🚀 INICIANDO SCRAPER Y PUBLICADOR AUTOMÁTICO');
    console.log(`🎯 MODO: ${MODE.toUpperCase()}`);
    console.log('📍 URL:', url);
    console.log('📂 Rutas:');
    console.log(`   - Data: ${CONFIG.mode.paths.data}/`);
    console.log(`   - Media: ${CONFIG.mode.paths.media}/`);
    console.log(`   - HTML: ${CONFIG.mode.paths.html}/`);
    console.log('');

    // PASO 1: Scrapear datos de Wiggot
    console.log('📥 PASO 1/6: Scrapeando datos de Wiggot...');
    const datos = await scrapearWiggot(url);

    // AUTO-CORRECCIÓN: Extraer precio del título si está vacío
    if (!datos.price && datos.title) {
        const priceMatch = datos.title.match(/\$?[\d,]+,\d{3},\d{3}/);
        if (priceMatch) {
            datos.price = priceMatch[0].replace(/\$/g, '').replace(/,/g, '');
            console.log('   🔧 Precio extraído del título:', datos.price);
        }
    }

    // AUTO-CORRECCIÓN: Extraer ubicación de la descripción si está vacía
    if (!datos.location && datos.description) {
        // Buscar patrones como "en [Ubicación]" o "[Ubicación], Culiacán"
        const locationMatch = datos.description.match(/(?:en|ubicada en)\s+([A-ZÁÉÍÓÚ][a-záéíóúñ\s]+?)(?:,|\.|$)/i);
        if (locationMatch) {
            datos.location = locationMatch[1].trim() + ', Culiacán';
            console.log('   🔧 Ubicación extraída de descripción:', datos.location);
        }
    }

    // AUTO-CORRECCIÓN: Extraer datos adicionales del texto completo
    if (datos.description) {
        // Estacionamientos
        const parkingMatch = datos.description.match(/(\d+)\s*(?:estacionamiento|cochera|garage|cajón)/i);
        if (parkingMatch) {
            datos.parking = parkingMatch[1];
            console.log('   🔧 Estacionamientos encontrados:', datos.parking);
        }

        // Niveles
        const levelsMatch = datos.description.match(/(\d+)\s*(?:nivel|planta|piso)/i);
        if (levelsMatch) {
            datos.levels = levelsMatch[1];
            console.log('   🔧 Niveles encontrados:', datos.levels);
        }
    }

    console.log('✅ Datos scrapeados:', datos.title);
    console.log('   💰 Precio:', datos.price);
    console.log('   📍 Ubicación:', datos.location);
    console.log('   📸 Fotos encontradas:', datos.images.length);
    console.log('');

    // PASO 1B: Generar ID estable
    console.log('🔑 PASO 1B/7: Generando ID estable...');
    const stableId = generateStableId(url);
    console.log(`   ✅ ID: ${stableId}`);
    console.log('');

    // PASO 2: Generar slug y verificar duplicados
    console.log('🔍 PASO 2/7: Generando slug y verificando duplicados...');
    const slug = generarSlug(datos.title);
    console.log(`   📝 Slug: ${slug}`);

    // Determinar rutas según modo
    const carpetaPropiedad = `${CONFIG.mode.paths.html}/${slug}`;
    const carpetaData = CONFIG.mode.paths.data;

    // Verificar si existe JSON maestro (dedupe por ID, NO por slug)
    const existingJSON = loadMasterJSON(stableId, carpetaData);
    if (existingJSON) {
        console.log(`   📋 JSON maestro encontrado: ${stableId}`);
        console.log(`   🏷️  Slug anterior: ${existingJSON.slug}`);
        console.log(`   🏷️  Slug nuevo: ${slug}`);

        if (existingJSON.slug !== slug) {
            console.log(`   ⚠️  CAMBIO DE SLUG: ${existingJSON.slug} → ${slug}`);
            console.log(`   💡 Se actualizará el JSON maestro con el nuevo slug`);
        } else {
            console.log(`   ✅ Slug sin cambios`);
        }
    } else {
        console.log(`   ✅ Propiedad nueva (no existe JSON maestro)`);
    }

    const duplicado = await verificarDuplicado(datos, slug);
    if (duplicado) {
        console.log('⚠️  ADVERTENCIA: Propiedad ya existe!');
        console.log('   📁 Carpeta:', duplicado.carpeta);
        console.log('   💰 Precio existente:', duplicado.precio);
        console.log('   📍 URL:', `https://casasenventa.info/${duplicado.carpeta}/`);
        console.log('');

        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const respuesta = await new Promise(resolve => {
            readline.question('¿Deseas continuar y SOBRESCRIBIR? (s/N): ', resolve);
        });
        readline.close();

        if (respuesta.toLowerCase() !== 's') {
            console.log('❌ Proceso cancelado. No se crearon duplicados.');
            process.exit(0);
        }

        console.log('⚡ Continuando... se sobrescribirá la propiedad existente');
        console.log('');
    } else {
        console.log('✅ No se encontraron duplicados');
        console.log('');
    }

    // PASO 3: Crear carpeta
    console.log('📁 PASO 3/6: Creando estructura de carpetas...');
    const carpetaImagenes = `${carpetaPropiedad}/images`;

    if (!fs.existsSync(carpetaPropiedad)) {
        fs.mkdirSync(carpetaPropiedad, { recursive: true });
    }
    if (!fs.existsSync(carpetaImagenes)) {
        fs.mkdirSync(carpetaImagenes, { recursive: true });
    }
    if (!fs.existsSync(`${carpetaImagenes}/webp`)) {
        fs.mkdirSync(`${carpetaImagenes}/webp`, { recursive: true });
    }
    if (!fs.existsSync(`${carpetaImagenes}/optimized`)) {
        fs.mkdirSync(`${carpetaImagenes}/optimized`, { recursive: true });
    }
    console.log('✅ Carpeta creada:', carpetaPropiedad);
    console.log('');

    // PASO 4: Descargar fotos
    console.log('📸 PASO 4/6: Descargando fotos...');
    await descargarFotos(datos.images, carpetaImagenes);
    console.log('✅ Fotos descargadas:', datos.images.length);
    console.log('');

    // PASO 5: Generar página HTML
    console.log('📄 PASO 5/6: Generando página HTML...');
    const config = {
        slug: slug,
        title: datos.title,
        price: datos.price,
        location: datos.location,
        bedrooms: parseInt(datos.bedrooms) || 3,
        bathrooms: parseFloat(datos.bathrooms) || 2,
        parking: parseInt(datos.parking) || 2,
        levels: parseInt(datos.levels) || 1,
        construction_area: parseInt(datos.construction_area) || 100,
        land_area: parseInt(datos.land_area) || 100,
        description: datos.description,
        photoCount: datos.images.length
    };
    await generarPaginaHTML(config, carpetaPropiedad);
    console.log('✅ Página HTML generada:', `${carpetaPropiedad}/index.html`);
    console.log('');

    // PASO 5B: Guardar JSON maestro (fuente única de verdad)
    console.log('💾 PASO 5B/7: Guardando JSON maestro...');
    const masterJSON = createOrUpdateMasterJSON(stableId, url, datos, config, carpetaData, slug);
    console.log(`   ✅ Estado: ${masterJSON.state}`);
    console.log(`   🔐 Content hash: ${masterJSON.content_hash}`);
    console.log('');

    // PASO 6: Agregar tarjeta a culiacan/index.html
    if (!CONFIG.mode.isTest) {
        console.log('🎴 PASO 6/6: Agregando tarjeta a culiacan/index.html...');
    } else {
        console.log('⏭️  PASO 6/6: OMITIDO (modo test - no publicar)');
        console.log('');
        console.log('🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!');
        console.log('');
        console.log('📋 RESUMEN:');
        console.log('   🔑 ID:', stableId);
        console.log('   🏷️  Slug:', slug);
        console.log('   🏠 Propiedad:', datos.title);
        console.log('   💰 Precio:', datos.price);
        console.log('   📍 Ubicación:', datos.location);
        console.log('   📸 Fotos:', datos.images.length);
        console.log('   🔐 Content hash:', masterJSON.content_hash);
        console.log('');
        console.log(`🎯 MODO: ${MODE.toUpperCase()}`);
        console.log('📂 ARCHIVOS ESCRITOS:');
        console.log(`   - JSON Maestro: ${CONFIG.mode.paths.data}/${stableId}.json`);
        console.log(`   - HTML: ${CONFIG.mode.paths.html}/${slug}/`);
        console.log(`   - Imágenes: ${CONFIG.mode.paths.html}/${slug}/images/`);
        console.log('');
        console.log('⚠️  MODO TEST: No se agregó tarjeta a culiacan/index.html');
        console.log('⚠️  Archivos en carpetas _test - NO publicar');
        return;
    }
    console.log('🎴 Agregando tarjeta...');
    await agregarTarjeta(config);
    console.log('✅ Tarjeta agregada a culiacan/index.html');
    console.log('');

    console.log('🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!');
    console.log('');
    console.log('📋 RESUMEN:');
    console.log('   🔑 ID:', stableId);
    console.log('   🏷️  Slug:', slug);
    console.log('   🏠 Propiedad:', datos.title);
    console.log('   💰 Precio:', datos.price);
    console.log('   📍 Ubicación:', datos.location);
    console.log('   📸 Fotos:', datos.images.length);
    console.log('   🔐 Content hash:', masterJSON.content_hash);
    console.log('');
    console.log(`🎯 MODO: ${MODE.toUpperCase()}`);
    console.log('📂 ARCHIVOS ESCRITOS:');
    console.log(`   - JSON Maestro: ${CONFIG.mode.paths.data}/${stableId}.json`);
    console.log(`   - HTML: ${CONFIG.mode.paths.html}/${slug}/`);
    console.log(`   - Imágenes: ${CONFIG.mode.paths.html}/${slug}/images/`)
    console.log('');
    if (!CONFIG.mode.isTest) {
        console.log('🚀 SIGUIENTE PASO: Ejecuta "publica ya" para deployment');
    } else {
        console.log('⚠️  MODO TEST: Archivos generados en carpetas _test (no publicar)');
    }
}

async function scrapearWiggot(url) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    // Cargar cookies si existen
    const cookiesPath = 'wiggot-cookies.json';
    if (fs.existsSync(cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath));
        await page.setCookie(...cookies);
    }

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Auto-login si aparece modal
    await new Promise(resolve => setTimeout(resolve, 3000));

    const loginVisible = await page.evaluate(() => {
        const loginText = document.body.innerText.toLowerCase();
        return loginText.includes('iniciar sesión') || loginText.includes('login');
    });

    if (loginVisible) {
        console.log('   🔐 Login detectado, iniciando sesión...');
        await page.type('input[type="email"]', WIGGOT_EMAIL);
        await page.type('input[type="password"]', WIGGOT_PASSWORD);

        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            for (const btn of buttons) {
                const text = (btn.textContent || '').toLowerCase();
                if (text.includes('login') || text.includes('entrar') || text.includes('iniciar')) {
                    btn.click();
                    return true;
                }
            }
        });

        await new Promise(resolve => setTimeout(resolve, 5000));

        const cookies = await page.cookies();
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies));
    }

    // Abrir galería
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
        for (const btn of buttons) {
            const text = (btn.textContent || '').toLowerCase();
            if (text.includes('ver todas') || text.includes('ver fotos')) {
                btn.click();
                return true;
            }
        }
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extraer datos
    const datos = await page.evaluate(() => {
        const data = {
            title: '',
            price: '',
            location: '',
            bedrooms: '',
            bathrooms: '',
            construction_area: '',
            land_area: '',
            description: '',
            images: []
        };

        // Título
        const titleEl = document.querySelector('h1, h2, .title, [class*="title"]');
        if (titleEl) data.title = titleEl.textContent.trim();

        // Precio
        const priceEl = document.querySelector('[class*="price"], [class*="Price"]');
        if (priceEl) data.price = priceEl.textContent.match(/[\d,]+/)?.[0] || '';

        // Ubicación
        const locationEl = document.querySelector('[class*="location"], [class*="address"]');
        if (locationEl) data.location = locationEl.textContent.trim();

        // Características
        const allText = document.body.innerText;
        const bedroomsMatch = allText.match(/Recámaras?\s*(\d+)/i);
        const bathroomsMatch = allText.match(/Baños?\s*(\d+\.?\d*)/i);

        // Buscar m² construcción y terreno
        const constructionMatch = allText.match(/(?:Área construida|Construcción|Const\.?)\s*:?\s*(\d+)\s*m²/i);
        const landMatch = allText.match(/(?:Área de terreno|Terreno|Lote)\s*:?\s*(\d+)\s*m²/i);

        // Si no encuentra separados, busca cualquier m²
        const anyAreaMatches = allText.match(/(\d+)\s*m²/gi);

        if (bedroomsMatch) data.bedrooms = bedroomsMatch[1];
        if (bathroomsMatch) data.bathrooms = bathroomsMatch[1];
        if (constructionMatch) data.construction_area = constructionMatch[1];
        if (landMatch) data.land_area = landMatch[1];

        // Si no encontró valores separados pero hay m², tomar los primeros dos
        if (!data.construction_area && anyAreaMatches && anyAreaMatches.length > 0) {
            data.construction_area = anyAreaMatches[0].match(/(\d+)/)[1];
        }
        if (!data.land_area && anyAreaMatches && anyAreaMatches.length > 1) {
            data.land_area = anyAreaMatches[1].match(/(\d+)/)[1];
        }
        // Si solo hay uno, usar el mismo para ambos
        if (!data.land_area && data.construction_area) {
            data.land_area = data.construction_area;
        }

        // Descripción - Captura TODO hasta "Ver más" o siguiente sección
        const descMatch = allText.match(/Descripción\s*([\s\S]+?)(?:Ver más|Detalles de operación|Características del inmueble|$)/i);
        if (descMatch) {
            data.description = descMatch[1]
                .trim()
                .replace(/\n+/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/Ver más/g, '')
                .trim();
        }

        // Imágenes
        const imageUrls = new Set();

        document.querySelectorAll('img').forEach(img => {
            const src = img.src || img.getAttribute('data-src');
            if (src && src.includes('wiggot')) imageUrls.add(src);
        });

        document.querySelectorAll('div, section').forEach(el => {
            const bg = window.getComputedStyle(el).backgroundImage;
            if (bg && bg !== 'none') {
                const match = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match && match[1] && match[1].includes('wiggot')) {
                    imageUrls.add(match[1]);
                }
            }
        });

        data.images = Array.from(imageUrls);
        return data;
    });

    await browser.close();
    return datos;
}

async function descargarFotos(imageUrls, carpeta) {
    for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const filename = `foto-${i + 1}.jpg`;
        const filepath = path.join(carpeta, filename);

        await descargarImagen(url, filepath);
        console.log(`   ✅ Descargada: ${filename}`);
    }
}

function descargarImagen(url, filepath) {
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

async function generarPaginaHTML(config, carpeta) {
    // Leer template de Bugambilias (con fallback a template mínimo)
    const templatePath = 'culiacan/casa-venta-casa-en-venta-bugambilias-zona-aeropuert-pYowL0a/index.html';
    let html;

    if (fs.existsSync(templatePath)) {
        html = fs.readFileSync(templatePath, 'utf8');
        console.log('   📄 Template: Bugambilias (completo)');
    } else {
        console.log('   ⚠️  Template Bugambilias no encontrado, usando fallback mínimo');
        html = getMinimalTemplate();
        // Aplicar replacements simples para template mínimo
        html = html.replace(/{{TITLE}}/g, config.title);
        html = html.replace(/{{DESCRIPTION}}/g, config.description || '');
        html = html.replace(/{{LOCATION}}/g, config.location);
        html = html.replace(/{{PRICE}}/g, `$${config.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`);
        html = html.replace(/{{BEDROOMS}}/g, config.bedrooms);
        html = html.replace(/{{BATHROOMS}}/g, config.bathrooms);
        html = html.replace(/{{PARKING}}/g, config.parking);
        html = html.replace(/{{CONSTRUCTION_AREA}}/g, config.construction_area);

        // Para template mínimo, guardar y retornar directo
        fs.writeFileSync(`${carpeta}/index.html`, html);
        console.log('   ✅ HTML generado con template mínimo');
        return;
    }

    // Reemplazar datos básicos (desde template Bugambilias)
    html = html.replace(/casa-venta-casa-en-venta-bugambilias-zona-aeropuert-pYowL0a/g, config.slug);
    html = html.replace(/Bugambilias/g, config.location.split(',')[0]);

    // AUTO-CORRECCIÓN: Actualizar TODOS los precios (incluyendo vacíos)
    // Formatear precio con comas
    const precioFormateado = config.price ? config.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';
    const precioSinComas = config.price ? config.price.toString().replace(/,/g, '') : '0';

    // Reemplazar todos los formatos de precio
    html = html.replace(/\$1,800,000/g, `$${precioFormateado}`);
    html = html.replace(/\$1800000/g, `$${precioFormateado}`);
    html = html.replace(/"1800000"/g, `"${precioSinComas}"`);
    html = html.replace(/1,800,000/g, precioFormateado);
    html = html.replace(/1800000/g, precioSinComas);

    // Actualizar price badges (vacíos o con valor)
    html = html.replace(/<span class="price-amount">\$<\/span>/g, `<span class="price-amount">$${precioFormateado}</span>`);
    html = html.replace(/<span class="price-amount">\$[\d,]*<\/span>/g, `<span class="price-amount">$${precioFormateado}</span>`);
    html = html.replace(/<span class="price-value">\$<\/span>/g, `<span class="price-value">$${precioFormateado}</span>`);
    html = html.replace(/<span class="price-value">\$[\d,]*<\/span>/g, `<span class="price-value">$${precioFormateado}</span>`);

    console.log('   ✅ Precio actualizado:', `$${precioFormateado}`);

    // Actualizar título y descripción
    html = html.replace(
        /<h1 class="hero-title">.*?<\/h1>/,
        `<h1 class="hero-title">${config.title}</h1>`
    );
    html = html.replace(
        /<p class="hero-subtitle">.*?<\/p>/s,
        `<p class="hero-subtitle">${config.description}</p>`
    );

    // Reemplazar m² del template Bugambilias (98 construcción, 118 terreno)
    // con los valores correctos de la propiedad
    html = html.replace(/"value": 98,/g, `"value": ${config.construction_area},`);
    html = html.replace(/"value": 118,/g, `"value": ${config.land_area},`);
    html = html.replace(/98m² terreno/g, `${config.land_area}m² terreno`);
    html = html.replace(/125\.81 m² construcción/g, `${config.construction_area} m² construcción`);
    html = html.replace(/133 m² terreno/g, `${config.land_area} m² terreno`);
    html = html.replace(/<span class="feature-value">N\/D<\/span>/g, `<span class="feature-value">${config.construction_area}</span>`);
    html = html.replace(/<span class="feature-value">133<\/span>/g, `<span class="feature-value">${config.land_area}</span>`);

    // AUTO-CORRECCIÓN: Actualizar features section con todos los datos
    // Buscar la sección features-inline y reemplazar valores
    const featuresRegex = /<div class="features-inline">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/;
    const featuresMatch = html.match(featuresRegex);

    if (featuresMatch) {
        let featuresHTML = `<div class="features-inline">
                <div class="feature-item">
                    <i class="fas fa-bed"></i>
                    <span class="feature-value">${config.bedrooms}</span>
                    <span class="feature-label">rec</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-bath"></i>
                    <span class="feature-value">${config.bathrooms}</span>
                    <span class="feature-label">baños</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-car"></i>
                    <span class="feature-value">${config.parking}</span>
                    <span class="feature-label">autos</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-layer-group"></i>
                    <span class="feature-value">${config.levels}</span>
                    <span class="feature-label">nivel${config.levels > 1 ? 'es' : ''}</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-ruler-combined"></i>
                    <span class="feature-value">${config.construction_area}</span>
                    <span class="feature-label">m² const.</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-vector-square"></i>
                    <span class="feature-value">${config.land_area}</span>
                    <span class="feature-label">m² terreno</span>
                </div>
            </div>
        </div>
    </section>`;

        html = html.replace(featuresRegex, featuresHTML);
        console.log('   ✅ Features actualizados:', config.bedrooms, 'rec,', config.bathrooms, 'baños,', config.parking, 'autos,', config.levels, 'nivel(es)');
    }

    // Agregar slides para todas las fotos
    if (config.photoCount > 5) {
        let slidesExtra = '';
        for (let i = 5; i < config.photoCount; i++) {
            slidesExtra += `
                <div class="carousel-slide" data-slide="${i}">
                    <img src="images/foto-${i + 1}.jpg"
                         alt="${config.slug} - Vista ${i + 1}"
                         loading="lazy"
                         decoding="async"
                         onclick="openLightbox(${i})">
                </div>`;
        }

        html = html.replace(
            /(<div class="carousel-slide" data-slide="4">[\s\S]*?<\/div>)\s*<!-- Navigation arrows -->/,
            `$1${slidesExtra}\n                    <!-- Navigation arrows -->`
        );

        // Agregar dots extras
        let dotsExtra = '';
        for (let i = 5; i < config.photoCount; i++) {
            dotsExtra += `\n                <button class="carousel-dot" onclick="goToSlideHero(${i})" aria-label="Foto ${i + 1}"></button>`;
        }

        html = html.replace(
            /(<button class="carousel-dot" onclick="goToSlideHero\(4\)" aria-label="Foto 5"><\/button>)/,
            `$1${dotsExtra}`
        );

        // Actualizar JavaScript
        html = html.replace(/const totalSlidesHero = 5;/, `const totalSlidesHero = ${config.photoCount};`);

        // Actualizar lightbox array
        let lightboxArray = 'const lightboxImages = [\n';
        for (let i = 0; i < config.photoCount; i++) {
            lightboxArray += `        'images/foto-${i + 1}.jpg'`;
            if (i < config.photoCount - 1) lightboxArray += ',';
            lightboxArray += '\n';
        }
        lightboxArray += '    ];';

        html = html.replace(/const lightboxImages = \[[\s\S]*?\];/, lightboxArray);

        // Actualizar Schema.org
        let schemaImages = '"image": [\n';
        for (let i = 0; i < config.photoCount; i++) {
            schemaImages += `        "https://casasenventa.info/culiacan/${config.slug}/images/foto-${i + 1}.jpg"`;
            if (i < config.photoCount - 1) schemaImages += ',';
            schemaImages += '\n';
        }
        schemaImages += '      ],';

        html = html.replace(/"image": \[[\s\S]*?\],/, schemaImages);
    }

    // Copiar logos
    const logoSrc = 'culiacan/infonavit-solidaridad/images';
    fs.copyFileSync(
        `${logoSrc}/optimized/Logo-hector-es-bienes-raices.jpg`,
        `${carpeta}/images/optimized/Logo-hector-es-bienes-raices.jpg`
    );
    fs.copyFileSync(
        `${logoSrc}/webp/Logo-hector-es-bienes-raices.webp`,
        `${carpeta}/images/webp/Logo-hector-es-bienes-raices.webp`
    );

    // Copiar styles.css
    fs.copyFileSync(
        'culiacan/casa-venta-la-rioja-477140/styles.css',
        `${carpeta}/styles.css`
    );

    // Agregar mapa de ubicación antes de Contact Section
    const ubicacionEncoded = encodeURIComponent(config.location + ', Sinaloa');
    const mapaHTML = `
    <!-- Location Map Section -->
    <section class="location-map scroll-animate" id="location">
        <div class="container">
            <h2 class="section-title">Ubicación</h2>
            <p class="location-subtitle">${config.location}</p>
            <div class="map-container">
                <iframe
                    src="https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${ubicacionEncoded}&zoom=15"
                    width="100%"
                    height="450"
                    style="border:0; border-radius: 12px;"
                    allowfullscreen=""
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade">
                </iframe>
            </div>
        </div>
    </section>

    <style>
        .location-map {
            padding: 4rem 0;
            background: #f9fafb;
        }

        .location-subtitle {
            text-align: center;
            color: #6b7280;
            font-size: 1.1rem;
            margin-bottom: 2rem;
            font-family: 'Poppins', sans-serif;
        }

        .map-container {
            max-width: 1000px;
            margin: 0 auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }

        /* Hide map on mobile */
        @media (max-width: 768px) {
            .location-map {
                display: none;
            }
        }
    </style>
`;

    // Insertar mapa antes de Contact Section (solo si no existe ya)
    if (!html.includes('<!-- Location Map Section -->')) {
        html = html.replace(/<!-- Contact Section -->/, mapaHTML + '\n    <!-- Contact Section -->');
        console.log('   ✅ Mapa de ubicación agregado');
    } else {
        // Si ya existe, actualizar solo la ubicación
        html = html.replace(
            /<p class="location-subtitle">.*?<\/p>/,
            `<p class="location-subtitle">${config.location}</p>`
        );
        html = html.replace(
            /src="https:\/\/www\.google\.com\/maps\/embed\/v1\/place\?key=[^"]+"/,
            `src="https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${ubicacionEncoded}&zoom=15"`
        );
        console.log('   ✅ Mapa de ubicación actualizado');
    }

    // Guardar HTML
    fs.writeFileSync(`${carpeta}/index.html`, html);
}

async function agregarTarjeta(config) {
    let html = fs.readFileSync('culiacan/index.html', 'utf8');

    // Formatear precio con comas
    const precioFormateado = config.price ? config.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';

    const tarjeta = `
    <!-- BEGIN CARD-ADV ${config.slug} -->
    <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
         data-href="${config.slug}/index.html">
        <div class="relative aspect-video">
            <div class="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                $${precioFormateado}
            </div>

            <div class="carousel-container" data-current="0">
                <img src="${config.slug}/images/foto-1.jpg"
                     alt="${config.title} - Foto 1"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image active">
                <img src="${config.slug}/images/foto-2.jpg"
                     alt="${config.title} - Foto 2"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image hidden">
                <img src="${config.slug}/images/foto-3.jpg"
                     alt="${config.title} - Foto 3"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image hidden">

                <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1); event.stopPropagation();">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1); event.stopPropagation();">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <button class="favorite-btn absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors z-20" onclick="event.stopPropagation();">
                <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
            </button>
        </div>

        <div class="p-6">
            <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">$${precioFormateado}</h3>
            <p class="text-gray-600 mb-4 font-poppins">${config.title} · Culiacán</p>

            <div class="flex flex-wrap gap-3 mb-6">
                <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
                    ${config.bedrooms} Recámaras
                </div>
                <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" clip-rule="evenodd"></path></svg>
                    ${config.bathrooms} Baños
                </div>
                <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>
                    ${config.construction_area} m²
                </div>
            </div>

            <a href="${config.slug}/index.html"
               class="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                Ver Detalles
            </a>
        </div>
    </div>
    <!-- END CARD-ADV ${config.slug} -->
`;

    // Detectar punto de inserción (soporte para formato completo y mínimo)
    let insertPoint = '<!-- Properties Grid -->\n        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n';

    // Fallback: Si no existe el punto completo, buscar el formato mínimo
    if (!html.includes(insertPoint)) {
        // Buscar el contenedor del formato mínimo
        if (html.includes('id="properties-grid"')) {
            insertPoint = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="properties-grid">\n';
            console.log('   📌 Detectado formato mínimo de culiacan/index.html');
        } else {
            console.error('   ❌ ERROR: No se encontró contenedor de propiedades en culiacan/index.html');
            console.error('   💡 Verifica que exista el comentario "<!-- Properties Grid -->" o id="properties-grid"');
            return;
        }
    }

    const replacement = insertPoint + tarjeta;
    html = html.replace(insertPoint, replacement);

    fs.writeFileSync('culiacan/index.html', html);
}

function generarSlug(titulo) {
    return titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function guardarDatosJSON(config, datosOriginales, carpetaData, slug) {
    // Crear estructura de datos completa para guardar
    const datosJSON = {
        id: slug,
        timestamp: new Date().toISOString(),
        scraped_from: 'wiggot',
        mode: CONFIG.mode.current,

        // Datos básicos
        title: config.title,
        price: config.price,
        location: config.location,
        description: config.description,

        // Características
        features: {
            bedrooms: config.bedrooms,
            bathrooms: config.bathrooms,
            parking: config.parking,
            levels: config.levels,
            construction_area: config.construction_area,
            land_area: config.land_area
        },

        // Fotos
        photos: {
            count: config.photoCount,
            urls: datosOriginales.images
        },

        // URLs
        urls: {
            html: `${CONFIG.mode.paths.html}/${slug}/index.html`,
            images: `${CONFIG.mode.paths.html}/${slug}/images/`
        },

        // Datos originales del scraper
        raw_data: datosOriginales
    };

    // Guardar JSON
    const jsonPath = `${carpetaData}/${slug}.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(datosJSON, null, 2));

    return jsonPath;
}

async function verificarDuplicado(datos, slug) {
    // Verificar 3 tipos de duplicados:
    // 1. Carpeta ya existe con mismo slug
    // 2. Precio exacto en culiacan/index.html
    // 3. Ubicación/dirección similar

    const carpetaPropiedad = `culiacan/${slug}`;

    // 1. Verificar si la carpeta ya existe
    if (fs.existsSync(carpetaPropiedad)) {
        const indexPath = `${carpetaPropiedad}/index.html`;
        if (fs.existsSync(indexPath)) {
            const html = fs.readFileSync(indexPath, 'utf8');
            const precioMatch = html.match(/\$([0-9,]+)/);
            const precio = precioMatch ? precioMatch[1] : 'Desconocido';

            return {
                carpeta: carpetaPropiedad,
                precio: `$${precio}`,
                tipo: 'carpeta'
            };
        }
    }

    // 2. Verificar precio exacto en culiacan/index.html
    if (fs.existsSync('culiacan/index.html')) {
        const html = fs.readFileSync('culiacan/index.html', 'utf8');
        const precioNormalizado = datos.price.replace(/[^0-9]/g, '');

        // Buscar tarjetas con el mismo precio
        const regexPrecio = new RegExp(`\\$${datos.price}[^0-9]`, 'g');
        const matches = html.match(regexPrecio);

        if (matches && matches.length > 0) {
            // Buscar la carpeta asociada al precio
            const regexCarpeta = new RegExp(`data-href="([^"]+)"[\\s\\S]{0,500}\\$${datos.price.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
            const carpetaMatch = html.match(regexCarpeta);

            if (carpetaMatch) {
                return {
                    carpeta: carpetaMatch[1].replace('/index.html', ''),
                    precio: `$${datos.price}`,
                    tipo: 'precio'
                };
            }
        }
    }

    // 3. Verificar ubicación similar (primeras 20 letras)
    if (datos.location && fs.existsSync('culiacan/index.html')) {
        const html = fs.readFileSync('culiacan/index.html', 'utf8');
        const ubicacionCorta = datos.location.substring(0, 20).toLowerCase();

        const regexUbicacion = new RegExp(ubicacionCorta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        if (regexUbicacion.test(html)) {
            // Intentar encontrar la carpeta asociada
            const lineas = html.split('\n');
            for (let i = 0; i < lineas.length; i++) {
                if (regexUbicacion.test(lineas[i])) {
                    // Buscar hacia atrás para encontrar data-href
                    for (let j = i; j >= Math.max(0, i - 20); j--) {
                        const hrefMatch = lineas[j].match(/data-href="([^"]+)"/);
                        if (hrefMatch) {
                            return {
                                carpeta: hrefMatch[1].replace('/index.html', ''),
                                precio: 'Verificar manualmente',
                                tipo: 'ubicacion'
                            };
                        }
                    }
                }
            }
        }
    }

    return null;
}

// Ejecutar
main().catch(console.error);
