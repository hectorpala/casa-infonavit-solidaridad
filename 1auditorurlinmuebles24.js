#!/usr/bin/env node

/**
 * AUDITOR DE URLs - INMUEBLES24.COM
 *
 * Compara URLs extraídas contra la base de datos existente para identificar
 * propiedades nuevas vs duplicadas.
 *
 * PROCESO:
 * 1. Carga inmuebles24-scraped-properties.json (base de datos existente)
 * 2. Construye set de IDs y URLs normalizadas
 * 3. Analiza URLs nuevas desde archivo
 * 4. Genera listas: existentes vs nuevas
 * 5. Detecta inconsistencias
 *
 * USO:
 *   node 1auditorurlinmuebles24.js urls-extraidas-inmuebles24.txt
 *   node 1auditorurlinmuebles24.js --input urls-extraidas-inmuebles24.json
 *   node 1auditorurlinmuebles24.js --urls "URL1" "URL2" "URL3"
 *
 * SALIDA:
 *   - JSON con urls_existentes y urls_nuevas
 *   - Archivo: auditoria-urls-inmuebles24.json
 *   - Console log con estadísticas
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
    database: 'inmuebles24-scraped-properties.json',
    outputFile: 'auditoria-urls-inmuebles24.json'
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Normaliza una URL removiendo query strings y anchors
 * @param {string} url - URL a normalizar
 * @returns {string} - URL normalizada
 */
function normalizeUrl(url) {
    try {
        const urlObj = new URL(url);
        // Retornar solo protocol + host + pathname (sin query ni hash)
        return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch (e) {
        // Si no es una URL válida, retornar tal cual
        return url;
    }
}

/**
 * Extrae el Property ID de una URL de Inmuebles24
 * Formato: .../clasificado/veclcain-titulo-12345678.html
 * @param {string} url - URL de la propiedad
 * @returns {string|null} - Property ID o null si no se encuentra
 */
function extractPropertyId(url) {
    const match = url.match(/-(\d+)\.html/);
    return match ? match[1] : null;
}

/**
 * Genera una clave canónica para una propiedad
 * Prioridad: propertyId > URL normalizada > slug|price|fecha
 * @param {Object} property - Objeto de propiedad
 * @returns {string} - Clave canónica única
 */
function generateCanonicalKey(property) {
    // 1. Si tiene propertyId, usarlo (más confiable)
    if (property.propertyId) {
        return `id:${property.propertyId}`;
    }

    // 2. Si tiene URL, usar URL normalizada
    if (property.url) {
        return `url:${normalizeUrl(property.url)}`;
    }

    // 3. Fallback: combinar slug + precio + fecha (primeros 10 chars de scrapedAt)
    const slug = property.slug || 'unknown';
    const price = property.price || '0';
    const date = property.scrapedAt ? property.scrapedAt.slice(0, 10) : 'unknown';

    return `slug:${slug}|${price}|${date}`;
}

/**
 * Carga la base de datos de propiedades scrapeadas
 * @param {string} dbPath - Path al archivo JSON
 * @returns {Object} - Objeto con sets de IDs, URLs, claves canónicas y data completa
 */
function loadDatabase(dbPath) {
    if (!fs.existsSync(dbPath)) {
        console.log(`⚠️  Base de datos no encontrada: ${dbPath}`);
        console.log('   Asumiendo que no hay propiedades previas registradas.');
        return {
            propertyIds: new Set(),
            normalizedUrls: new Set(),
            canonicalKeys: new Set(),
            properties: []
        };
    }

    const content = fs.readFileSync(dbPath, 'utf8');
    const properties = JSON.parse(content);

    const propertyIds = new Set();
    const normalizedUrls = new Set();
    const canonicalKeys = new Set();

    properties.forEach(prop => {
        // Agregar Property ID si existe
        if (prop.propertyId) {
            propertyIds.add(prop.propertyId);
        }

        // Agregar URL normalizada si existe
        if (prop.url) {
            normalizedUrls.add(normalizeUrl(prop.url));
        }

        // Agregar clave canónica (SIEMPRE, para cubrir los 204 registros)
        const canonicalKey = generateCanonicalKey(prop);
        canonicalKeys.add(canonicalKey);
    });

    return {
        propertyIds,
        normalizedUrls,
        canonicalKeys,
        properties
    };
}

/**
 * Lee URLs desde un archivo (txt o json)
 * @param {string} filePath - Path al archivo
 * @returns {Array<string>} - Array de URLs
 */
function readUrlsFromFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Si es JSON
    if (filePath.endsWith('.json')) {
        const data = JSON.parse(content);
        // Buscar el array de URLs (puede estar en data.urls o ser el root)
        return data.urls || data;
    }

    // Si es TXT (una URL por línea)
    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.startsWith('http'));
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Audita URLs contra la base de datos
 * @param {Array<string>} urls - URLs a auditar
 * @returns {Object} - Resultados de la auditoría
 */
function auditUrls(urls) {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 AUDITOR DE URLs - INMUEBLES24.COM                       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // 1. Cargar base de datos existente
    console.log('📂 Cargando base de datos existente...');
    const db = loadDatabase(CONFIG.database);
    console.log(`   ✅ ${db.properties.length} propiedades en base de datos`);
    console.log(`   ✅ ${db.propertyIds.size} Property IDs únicos`);
    console.log(`   ✅ ${db.normalizedUrls.size} URLs normalizadas`);
    console.log(`   ✅ ${db.canonicalKeys.size} Claves canónicas únicas (TOTAL COBERTURA)`);
    console.log('');

    // 2. Analizar URLs nuevas
    console.log('🔍 Analizando URLs del lote nuevo...');
    console.log(`   📊 Total URLs a analizar: ${urls.length}`);
    console.log('');

    const urlsExistentes = [];
    const urlsNuevas = [];
    const observaciones = [];

    urls.forEach((url, index) => {
        const normalizedUrl = normalizeUrl(url);
        const propertyId = extractPropertyId(url);

        // Generar clave canónica para esta URL nueva
        // (simulando cómo se almacenaría si fuera scrapeada)
        const newPropCanonicalKey = propertyId
            ? `id:${propertyId}`
            : `url:${normalizedUrl}`;

        let isExisting = false;
        let matchReason = null;

        // Verificar por Property ID (método más confiable)
        if (propertyId && db.propertyIds.has(propertyId)) {
            isExisting = true;
            matchReason = `Property ID: ${propertyId}`;

            // Verificar si el ID existe pero con URL diferente (inconsistencia)
            const existingProp = db.properties.find(p => p.propertyId === propertyId);
            if (existingProp) {
                const existingNormalizedUrl = existingProp.url ? normalizeUrl(existingProp.url) : null;
                if (existingNormalizedUrl && existingNormalizedUrl !== normalizedUrl) {
                    observaciones.push({
                        tipo: 'inconsistencia_url',
                        propertyId: propertyId,
                        urlExistente: existingProp.url,
                        urlNueva: url,
                        mensaje: `Property ID ${propertyId} existe pero con URL diferente`
                    });
                }
            }
        }

        // Verificar por URL normalizada
        if (!isExisting && db.normalizedUrls.has(normalizedUrl)) {
            isExisting = true;
            matchReason = `URL normalizada: ${normalizedUrl}`;
        }

        // Verificar por clave canónica (captura propiedades sin ID/URL)
        if (!isExisting && db.canonicalKeys.has(newPropCanonicalKey)) {
            isExisting = true;
            matchReason = `Clave canónica: ${newPropCanonicalKey}`;
        }

        // Clasificar
        if (isExisting) {
            urlsExistentes.push({
                url: url,
                urlNormalizada: normalizedUrl,
                propertyId: propertyId,
                claveCanonica: newPropCanonicalKey,
                razonMatch: matchReason
            });
        } else {
            urlsNuevas.push({
                url: url,
                urlNormalizada: normalizedUrl,
                propertyId: propertyId,
                claveCanonica: newPropCanonicalKey
            });
        }
    });

    // 3. Generar resultados
    const results = {
        timestamp: new Date().toISOString(),
        baseDatos: {
            archivo: CONFIG.database,
            totalPropiedades: db.properties.length,
            propertyIdsUnicos: db.propertyIds.size,
            urlsNormalizadas: db.normalizedUrls.size,
            clavesCanonicalUnicas: db.canonicalKeys.size
        },
        loteAnalizado: {
            totalUrls: urls.length,
            urlsExistentes: urlsExistentes.length,
            urlsNuevas: urlsNuevas.length
        },
        urls_existentes: urlsExistentes,
        urls_nuevas: urlsNuevas,
        observaciones: observaciones
    };

    return results;
}

/**
 * Muestra resultados en consola
 * @param {Object} results - Resultados de la auditoría
 */
function displayResults(results) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESULTADOS DE LA AUDITORÍA');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    console.log('📂 BASE DE DATOS EXISTENTE:');
    console.log(`   • Archivo: ${results.baseDatos.archivo}`);
    console.log(`   • Total propiedades: ${results.baseDatos.totalPropiedades}`);
    console.log(`   • Property IDs únicos: ${results.baseDatos.propertyIdsUnicos}`);
    console.log(`   • URLs normalizadas: ${results.baseDatos.urlsNormalizadas}`);
    console.log(`   • Claves canónicas: ${results.baseDatos.clavesCanonicalUnicas} (100% cobertura)`);
    console.log('');

    console.log('🔍 LOTE ANALIZADO:');
    console.log(`   • Total URLs: ${results.loteAnalizado.totalUrls}`);
    console.log(`   • URLs existentes (duplicadas): ${results.loteAnalizado.urlsExistentes}`);
    console.log(`   • URLs nuevas: ${results.loteAnalizado.urlsNuevas}`);
    console.log('');

    if (results.urls_existentes.length > 0) {
        console.log('⚠️  URLS EXISTENTES (YA EN BASE DE DATOS):');
        results.urls_existentes.forEach((item, index) => {
            console.log(`   ${index + 1}. [${item.propertyId}] ${item.url}`);
            console.log(`      Razón: ${item.razonMatch}`);
        });
        console.log('');
    }

    if (results.urls_nuevas.length > 0) {
        console.log('✅ URLS NUEVAS (LISTAS PARA SCRAPEAR):');
        results.urls_nuevas.forEach((item, index) => {
            console.log(`   ${index + 1}. [${item.propertyId}] ${item.url}`);
        });
        console.log('');
    }

    if (results.observaciones.length > 0) {
        console.log('🔔 OBSERVACIONES (INCONSISTENCIAS DETECTADAS):');
        results.observaciones.forEach((obs, index) => {
            console.log(`   ${index + 1}. ${obs.tipo}: ${obs.mensaje}`);
            console.log(`      Property ID: ${obs.propertyId}`);
            console.log(`      URL existente: ${obs.urlExistente}`);
            console.log(`      URL nueva: ${obs.urlNueva}`);
        });
        console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════');
}

/**
 * Guarda resultados en archivo JSON
 * @param {Object} results - Resultados de la auditoría
 * @param {string} outputFile - Path del archivo de salida
 */
function saveResults(results, outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf8');
    console.log(`💾 Resultados guardados en: ${outputFile}`);
    console.log('');
}

// ============================================
// EJECUCIÓN DESDE CLI
// ============================================

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('');
        console.log('❌ Error: Debes proporcionar URLs o un archivo');
        console.log('');
        console.log('USO:');
        console.log('  node 1auditorurlinmuebles24.js urls-extraidas-inmuebles24.txt');
        console.log('  node 1auditorurlinmuebles24.js --input urls-extraidas-inmuebles24.json');
        console.log('  node 1auditorurlinmuebles24.js --urls "URL1" "URL2" "URL3"');
        console.log('');
        console.log('EJEMPLOS:');
        console.log('  node 1auditorurlinmuebles24.js urls-extraidas-inmuebles24.txt');
        console.log('  node 1auditorurlinmuebles24.js --input urls-extraidas-inmuebles24.json --output mi-auditoria.json');
        console.log('');
        process.exit(1);
    }

    let urls = [];
    let outputFile = CONFIG.outputFile;

    // Parsear argumentos
    if (args[0] === '--input') {
        // Leer desde archivo especificado
        const inputFile = args[1];
        if (!inputFile) {
            console.error('❌ Error: --input requiere un archivo');
            process.exit(1);
        }
        urls = readUrlsFromFile(inputFile);

        // Buscar --output si existe
        const outputIndex = args.indexOf('--output');
        if (outputIndex !== -1 && args[outputIndex + 1]) {
            outputFile = args[outputIndex + 1];
        }
    } else if (args[0] === '--urls') {
        // URLs pasadas como argumentos
        urls = args.slice(1);
    } else {
        // Asumir que el primer argumento es un archivo
        const inputFile = args[0];
        urls = readUrlsFromFile(inputFile);

        // Buscar --output si existe
        const outputIndex = args.indexOf('--output');
        if (outputIndex !== -1 && args[outputIndex + 1]) {
            outputFile = args[outputIndex + 1];
        }
    }

    if (urls.length === 0) {
        console.error('❌ Error: No se encontraron URLs para analizar');
        process.exit(1);
    }

    // Ejecutar auditoría
    const results = auditUrls(urls);
    displayResults(results);
    saveResults(results, outputFile);

    console.log('✅ Auditoría completada exitosamente');
    process.exit(0);
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

module.exports = {
    auditUrls,
    normalizeUrl,
    extractPropertyId,
    generateCanonicalKey,
    loadDatabase,
    readUrlsFromFile
};
