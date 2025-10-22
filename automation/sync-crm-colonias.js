#!/usr/bin/env node

/**
 * Script de Enriquecimiento CRM - Sync Colonias y Fotos
 *
 * Este script enriquece crm-vendedores.json con datos extraídos de las páginas HTML publicadas:
 * - Colonia (desde MARKER_CONFIG.location o location-subtitle)
 * - Ciudad (detectada desde slug/URL)
 * - Foto principal (images/foto-1.jpg)
 * - Recámaras, baños, construcción, terreno (desde HTML)
 *
 * Uso:
 *   node automation/sync-crm-colonias.js
 *
 * Genera:
 *   crm-vendedores.json (actualizado con campos enriquecidos)
 *   automation/sync-log.txt (log de ejecución)
 */

const fs = require('fs');
const path = require('path');

// Paths
const CRM_JSON_PATH = path.join(__dirname, '../crm-vendedores.json');
const CULIACAN_DIR = path.join(__dirname, '../culiacan');
const MAZATLAN_DIR = path.join(__dirname, '../mazatlan');
const MONTERREY_DIR = path.join(__dirname, '../monterrey');
const LOG_PATH = path.join(__dirname, 'sync-log.txt');

// Log helper
let logMessages = [];
function log(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);
    logMessages.push(logLine);
}

/**
 * Normaliza ubicación para extraer colonia limpia
 */
function normalizeLocationForCity(location) {
    if (!location) return null;

    // Eliminar prefijos comunes
    let cleaned = location
        .replace(/Inmuebles24\s+Casa\s+(Venta|Renta)\s+Sinaloa\s+Culiacán\s+/gi, '')
        .replace(/Inmuebles24\s+Casa\s+(Venta|Renta)\s+Sinaloa\s+/gi, '')
        .replace(/Fraccionamiento\s+/gi, '')
        .replace(/Colonia\s+/gi, '')
        .trim();

    // Tomar solo la primera parte (antes de coma)
    const parts = cleaned.split(',');
    if (parts.length > 0) {
        return parts[0].trim();
    }

    return cleaned;
}

/**
 * Detecta ciudad desde URL o slug
 */
function detectCityFromUrl(url) {
    if (!url) return 'culiacan';
    const urlLower = url.toLowerCase();
    if (urlLower.includes('monterrey')) return 'monterrey';
    if (urlLower.includes('mazatlan') || urlLower.includes('mazatlán')) return 'mazatlan';
    return 'culiacan';
}

/**
 * Encuentra el archivo HTML de una propiedad
 */
function findPropertyHtmlPath(propertyId, url, ciudad) {
    // Determinar directorio base según ciudad
    let baseDir;
    switch (ciudad) {
        case 'monterrey':
            baseDir = MONTERREY_DIR;
            break;
        case 'mazatlan':
            baseDir = MAZATLAN_DIR;
            break;
        default:
            baseDir = CULIACAN_DIR;
    }

    if (!fs.existsSync(baseDir)) {
        return null;
    }

    // Buscar carpeta que contenga el ID de la propiedad
    const subdirs = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const subdir of subdirs) {
        const htmlPath = path.join(baseDir, subdir, 'index.html');
        if (fs.existsSync(htmlPath)) {
            // Verificar si el HTML contiene el ID de la propiedad
            const html = fs.readFileSync(htmlPath, 'utf8');
            if (html.includes(propertyId) || subdir.includes(propertyId)) {
                return htmlPath;
            }
        }
    }

    return null;
}

/**
 * Extrae datos desde el HTML publicado
 */
function extractDataFromHtml(htmlPath, propertyId) {
    try {
        const html = fs.readFileSync(htmlPath, 'utf8');

        const data = {
            colonia: null,
            ciudad: null,
            fotoPrincipal: null,
            recamaras: null,
            banos: null,
            construccion: null,
            terreno: null
        };

        // Extraer colonia desde MARKER_CONFIG.location
        const scriptMatch = html.match(/const\s+MARKER_CONFIG\s*=\s*{[\s\S]*?location:\s*["']([^"']+)["']/);
        if (scriptMatch && scriptMatch[1]) {
            const location = scriptMatch[1];
            data.colonia = normalizeLocationForCity(location);
            log(`  📍 Colonia desde MARKER_CONFIG: "${data.colonia}"`);
        }

        // Fallback: location-subtitle usando regex
        if (!data.colonia) {
            const locationSubtitleMatch = html.match(/<p\s+class=["']location-subtitle["'][^>]*>([^<]+)<\/p>/i);
            if (locationSubtitleMatch && locationSubtitleMatch[1]) {
                const locationSubtitle = locationSubtitleMatch[1].trim();
                data.colonia = normalizeLocationForCity(locationSubtitle);
                log(`  📍 Colonia desde location-subtitle: "${data.colonia}"`);
            }
        }

        // Extraer ciudad desde location-subtitle o MARKER_CONFIG
        const locationTextMatch = html.match(/<p\s+class=["']location-subtitle["'][^>]*>([^<]+)<\/p>/i);
        const locationText = locationTextMatch ? locationTextMatch[1] : '';
        if (locationText.includes('Monterrey')) {
            data.ciudad = 'monterrey';
        } else if (locationText.includes('Mazatlán')) {
            data.ciudad = 'mazatlan';
        } else {
            data.ciudad = 'culiacan';
        }

        // Extraer foto principal
        const htmlDir = path.dirname(htmlPath);
        const imagesDir = path.join(htmlDir, 'images');
        const foto1Path = path.join(imagesDir, 'foto-1.jpg');

        if (fs.existsSync(foto1Path)) {
            // Guardar path relativo desde la raíz del proyecto
            const relativePath = path.relative(path.join(__dirname, '..'), foto1Path);
            data.fotoPrincipal = relativePath;
            log(`  📷 Foto principal: ${relativePath}`);
        } else {
            log(`  ⚠️  No se encontró foto-1.jpg en ${imagesDir}`);
        }

        // Extraer recámaras, baños, construcción, terreno
        const bedroomsMatch = html.match(/"numberOfBedrooms":\s*(\d+)/);
        if (bedroomsMatch) {
            data.recamaras = parseInt(bedroomsMatch[1], 10);
        }

        const bathroomsMatch = html.match(/"numberOfBathroomsTotal":\s*([\d.]+)/);
        if (bathroomsMatch) {
            data.banos = parseFloat(bathroomsMatch[1]);
        }

        const floorSizeMatch = html.match(/"floorSize":\s*{\s*"value":\s*(\d+)/);
        if (floorSizeMatch) {
            data.construccion = parseInt(floorSizeMatch[1], 10);
        }

        // Terreno desde HTML
        const terrenoMatch = html.match(/(\d+)\s*m²\s+de\s+terreno/i);
        if (terrenoMatch) {
            data.terreno = parseInt(terrenoMatch[1], 10);
        }

        return data;

    } catch (error) {
        log(`  ❌ Error al procesar HTML: ${error.message}`);
        return null;
    }
}

/**
 * Main function
 */
async function main() {
    log('🚀 Iniciando sincronización CRM...');
    log('');

    // Leer crm-vendedores.json
    if (!fs.existsSync(CRM_JSON_PATH)) {
        log('❌ No se encontró crm-vendedores.json');
        process.exit(1);
    }

    const crmData = JSON.parse(fs.readFileSync(CRM_JSON_PATH, 'utf8'));
    log(`✅ CRM cargado: ${crmData.vendedores.length} vendedores`);
    log('');

    let totalPropiedades = 0;
    let propiedadesEnriquecidas = 0;
    let propiedadesNoEncontradas = 0;

    // Procesar cada vendedor
    for (const vendedor of crmData.vendedores) {
        log(`👤 Procesando vendedor: ${vendedor.nombre} (${vendedor.propiedades.length} propiedades)`);

        for (const propiedad of vendedor.propiedades) {
            totalPropiedades++;
            log(`  🏠 ${propiedad.id}: ${propiedad.titulo}`);

            // Detectar ciudad
            const ciudad = detectCityFromUrl(propiedad.url);
            log(`  🌆 Ciudad detectada: ${ciudad}`);

            // Buscar HTML
            const htmlPath = findPropertyHtmlPath(propiedad.id, propiedad.url, ciudad);

            if (!htmlPath) {
                log(`  ⚠️  No se encontró HTML publicado para ${propiedad.id}`);
                propiedadesNoEncontradas++;

                // Agregar campos vacíos
                propiedad.colonia = propiedad.colonia || null;
                propiedad.ciudad = ciudad;
                propiedad.fotoPrincipal = null;
                continue;
            }

            log(`  📄 HTML encontrado: ${htmlPath}`);

            // Extraer datos del HTML
            const extractedData = extractDataFromHtml(htmlPath, propiedad.id);

            if (extractedData) {
                // Enriquecer propiedad
                propiedad.colonia = extractedData.colonia;
                propiedad.ciudad = extractedData.ciudad;
                propiedad.fotoPrincipal = extractedData.fotoPrincipal;

                // Actualizar datos numéricos solo si no existen
                if (extractedData.recamaras !== null && !propiedad.recamaras) {
                    propiedad.recamaras = extractedData.recamaras;
                }
                if (extractedData.banos !== null && !propiedad.banos) {
                    propiedad.banos = extractedData.banos;
                }
                if (extractedData.construccion !== null && !propiedad.construccion) {
                    propiedad.construccion = extractedData.construccion;
                }
                if (extractedData.terreno !== null && !propiedad.terreno) {
                    propiedad.terreno = extractedData.terreno;
                }

                propiedadesEnriquecidas++;
                log(`  ✅ Propiedad enriquecida exitosamente`);
            }

            log('');
        }

        log('');
    }

    // Actualizar estadísticas
    if (!crmData.estadisticas) {
        crmData.estadisticas = {};
    }
    crmData.estadisticas.ultimaActualizacion = new Date().toISOString();
    crmData.estadisticas.totalVendedores = crmData.vendedores.length;
    crmData.estadisticas.totalPropiedades = totalPropiedades;

    // Guardar JSON actualizado
    fs.writeFileSync(CRM_JSON_PATH, JSON.stringify(crmData, null, 2), 'utf8');
    log('💾 crm-vendedores.json actualizado');
    log('');

    // Resumen
    log('📊 RESUMEN DE SINCRONIZACIÓN');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`Total propiedades procesadas: ${totalPropiedades}`);
    log(`Propiedades enriquecidas: ${propiedadesEnriquecidas}`);
    log(`Propiedades no encontradas: ${propiedadesNoEncontradas}`);
    log(`Tasa de éxito: ${((propiedadesEnriquecidas / totalPropiedades) * 100).toFixed(1)}%`);
    log('');

    // Guardar log
    fs.writeFileSync(LOG_PATH, logMessages.join('\n'), 'utf8');
    log(`📝 Log guardado en: ${LOG_PATH}`);
    log('');
    log('✅ Sincronización completada exitosamente!');
}

// Ejecutar
main().catch(error => {
    log(`❌ Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
});
