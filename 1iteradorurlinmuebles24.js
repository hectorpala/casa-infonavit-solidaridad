#!/usr/bin/env node

/**
 * ITERADOR DE SCRAPING - INMUEBLES24
 *
 * Procesa UNA URL a la vez desde 1depuracionurlinmuebles24.json
 * Al terminar exitosamente, abre el HTML en el navegador y elimina la URL del JSON
 *
 * USO:
 *   node 1iteradorurlinmuebles24.js
 *
 * WORKFLOW:
 *   1. Lee primera URL de 1depuracionurlinmuebles24.json
 *   2. Extrae propertyId
 *   3. Ejecuta inmuebles24culiacanscraper.js
 *   4. Si éxito: busca propiedad en DB, abre HTML en navegador
 *   5. Elimina URL procesada del JSON
 *   6. Muestra resumen
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// ============================================
// CONFIGURACIÓN
// ============================================

const JSON_INPUT = '1depuracionurlinmuebles24.json';
const DATABASE_FILE = 'inmuebles24-scraped-properties.json';
const SCRAPER_SCRIPT = 'inmuebles24culiacanscraper.js';

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Lee el JSON con URLs pendientes
 */
function loadPendingUrls() {
    if (!fs.existsSync(JSON_INPUT)) {
        throw new Error(`No se encontró ${JSON_INPUT}`);
    }

    const content = fs.readFileSync(JSON_INPUT, 'utf8');
    const data = JSON.parse(content);

    if (!data.urls_nuevas || !Array.isArray(data.urls_nuevas)) {
        throw new Error('El JSON no contiene un array "urls_nuevas"');
    }

    return data;
}

/**
 * Extrae Property ID desde URL
 */
function extractPropertyId(url) {
    const match = url.match(/-(\d+)\.html/);
    return match ? match[1] : null;
}

/**
 * Normaliza URL (elimina query params)
 */
function normalizeUrl(url) {
    try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch (e) {
        return url;
    }
}

/**
 * Ejecuta el scraper para una URL
 */
function executeScraper(url) {
    console.log('');
    console.log('═'.repeat(80));
    console.log('🚀 EJECUTANDO SCRAPER');
    console.log('═'.repeat(80));
    console.log(`📍 URL: ${url}`);
    console.log('');

    const result = spawnSync(
        'node',
        [SCRAPER_SCRIPT, url, '--auto-confirm'],
        {
            cwd: __dirname,
            stdio: 'inherit',
            shell: true
        }
    );

    if (result.error) {
        throw new Error(`No se pudo ejecutar el scraper: ${result.error.message}`);
    }

    if (result.status !== 0) {
        throw new Error(`El scraper terminó con código de salida ${result.status}`);
    }

    return true;
}

/**
 * Busca la propiedad recién scrapeada en la base de datos
 */
function findPropertyInDatabase(propertyId, urlNormalizada) {
    if (!fs.existsSync(DATABASE_FILE)) {
        throw new Error(`No se encontró ${DATABASE_FILE}`);
    }

    const properties = JSON.parse(fs.readFileSync(DATABASE_FILE, 'utf8'));

    // Buscar primero por propertyId
    let property = properties.find(prop => prop.propertyId === propertyId);

    // Si no se encuentra, buscar por URL normalizada
    if (!property && urlNormalizada) {
        property = properties.find(prop =>
            prop.url && normalizeUrl(prop.url) === urlNormalizada
        );
    }

    return property;
}

/**
 * Construye ruta al HTML final
 */
function buildHtmlPath(property) {
    if (!property.slug) {
        return null;
    }

    // Por defecto asumimos Culiacán
    const city = 'culiacan';
    const htmlPath = path.join(__dirname, city, property.slug, 'index.html');

    return htmlPath;
}

/**
 * Abre archivo en el navegador (macOS)
 */
function openInBrowser(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  El archivo no existe: ${filePath}`);
        return false;
    }

    console.log('');
    console.log('🌐 Abriendo en el navegador...');
    console.log(`   📄 ${filePath}`);

    const result = spawnSync('open', [filePath], {
        stdio: 'inherit'
    });

    if (result.error) {
        console.log(`⚠️  No se pudo abrir el archivo: ${result.error.message}`);
        return false;
    }

    return true;
}

/**
 * Crea backup del JSON con timestamp
 */
function backupJson() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${JSON_INPUT}.bak-${timestamp}`;

    fs.copyFileSync(JSON_INPUT, backupPath);
    console.log(`💾 Backup creado: ${backupPath}`);
}

/**
 * Elimina URL procesada del JSON
 */
function removeProcessedUrl(data, processedUrl) {
    // Crear backup antes de modificar
    backupJson();

    // Filtrar la URL procesada
    const urlsRestantes = data.urls_nuevas.filter(item => {
        const itemUrl = item.url || item.urlNormalizada || item;
        return itemUrl !== processedUrl;
    });

    // Actualizar datos
    data.urls_nuevas = urlsRestantes;
    data.totalUrlsNuevas = urlsRestantes.length;

    // Guardar
    fs.writeFileSync(JSON_INPUT, JSON.stringify(data, null, 2), 'utf8');

    return urlsRestantes.length;
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🔄 ITERADOR DE SCRAPING - INMUEBLES24                      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    try {
        // 1. Cargar JSON con URLs pendientes
        console.log('📂 Cargando URLs pendientes...');
        const data = loadPendingUrls();

        if (data.urls_nuevas.length === 0) {
            console.log('');
            console.log('ℹ️  No hay URLs pendientes para procesar');
            console.log('');
            process.exit(0);
        }

        console.log(`   ✅ ${data.urls_nuevas.length} URLs pendientes`);
        console.log('');

        // 2. Tomar primera URL
        const urlObj = data.urls_nuevas[0];
        const url = urlObj.url || urlObj.urlNormalizada || urlObj;

        console.log('📍 URL seleccionada:');
        console.log(`   ${url}`);
        console.log('');

        // 3. Extraer propertyId
        const propertyId = extractPropertyId(url);
        const urlNormalizada = normalizeUrl(url);

        if (propertyId) {
            console.log(`🆔 Property ID detectado: ${propertyId}`);
        } else {
            console.log('⚠️  No se detectó Property ID en la URL');
        }
        console.log('');

        // 4. Ejecutar scraper
        executeScraper(url);

        console.log('');
        console.log('✅ Scraping completado exitosamente');
        console.log('');

        // 5. Buscar propiedad en la base de datos
        console.log('🔍 Buscando propiedad en la base de datos...');
        const property = findPropertyInDatabase(propertyId, urlNormalizada);

        if (!property) {
            console.log('⚠️  No se encontró la propiedad en la base de datos');
            console.log('   (Esto es normal si ya existía como duplicado)');
        } else {
            console.log(`   ✅ Propiedad encontrada: ${property.title || property.slug}`);
            console.log(`   📝 Slug: ${property.slug}`);

            // 6. Construir ruta al HTML
            const htmlPath = buildHtmlPath(property);

            if (htmlPath) {
                console.log(`   📄 HTML: ${htmlPath}`);

                // 7. Abrir en navegador
                const opened = openInBrowser(htmlPath);

                if (opened) {
                    console.log('   ✅ HTML abierto en el navegador');
                }
            } else {
                console.log('   ⚠️  No se pudo determinar la ruta al HTML');
            }
        }

        console.log('');

        // 8. Eliminar URL procesada del JSON
        console.log('🗑️  Eliminando URL procesada del JSON...');
        const urlsRestantes = removeProcessedUrl(data, url);

        console.log(`   ✅ URL eliminada`);
        console.log(`   📊 URLs restantes: ${urlsRestantes}`);
        console.log('');

        // 9. Resumen final
        console.log('═'.repeat(60));
        console.log('📊 RESUMEN');
        console.log('═'.repeat(60));
        console.log(`✅ URL procesada: ${url}`);
        console.log(`🆔 Property ID: ${propertyId || 'N/A'}`);
        console.log(`📄 HTML: ${property && property.slug ? `culiacan/${property.slug}/index.html` : 'N/A'}`);
        console.log(`🌐 Abierto en navegador: ${property ? 'Sí' : 'No (duplicado o no encontrado)'}`);
        console.log(`📊 URLs restantes: ${urlsRestantes}`);
        console.log('');

        if (urlsRestantes > 0) {
            console.log(`💡 Ejecuta nuevamente el script para procesar la siguiente URL`);
            console.log('');
        } else {
            console.log('🎉 ¡Todas las URLs han sido procesadas!');
            console.log('');
        }

        process.exit(0);

    } catch (error) {
        console.error('');
        console.error('❌ ERROR:', error.message);
        console.error('');
        console.error('💡 La URL NO fue eliminada del JSON');
        console.error('   Puedes intentar nuevamente cuando se resuelva el problema');
        console.error('');
        process.exit(1);
    }
}

// Ejecutar
main();
