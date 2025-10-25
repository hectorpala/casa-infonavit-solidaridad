#!/usr/bin/env node

/**
 * Rebuild Property Database from Existing HTML Files
 *
 * Este script recorre todas las carpetas en culiacan/ y extrae metadatos
 * de los archivos index.html existentes para completar el JSON de propiedades.
 *
 * Extrae:
 * - propertyId (de Schema.org o comentarios)
 * - title, price, bedrooms, bathrooms, area
 * - location, lat, lng, colonia
 * - photoCount, slug
 * - scrapedAt (fecha del archivo)
 *
 * Uso:
 *   node rebuild-property-database-from-html.js
 *   node rebuild-property-database-from-html.js --dry-run  # Solo mostrar qué haría
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Paths
const CULIACAN_DIR = path.join(__dirname, 'culiacan');
const DB_FILE = path.join(__dirname, 'inmuebles24-scraped-properties.json');

// Parse args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  🔨 Rebuild Property Database from HTML Files               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No escribirá cambios al JSON\n');
}

/**
 * Lee el JSON de propiedades existente
 */
function loadExistingDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        console.log('⚠️  Base de datos no existe, se creará nueva\n');
        return [];
    }

    try {
        const content = fs.readFileSync(DB_FILE, 'utf8');
        const data = JSON.parse(content);
        console.log(`✅ Base de datos cargada: ${data.length} propiedades\n`);
        return data;
    } catch (error) {
        console.error('❌ Error leyendo base de datos:', error.message);
        return [];
    }
}

/**
 * Extrae metadatos del HTML
 */
function extractMetadataFromHTML(htmlPath, slug) {
    try {
        const html = fs.readFileSync(htmlPath, 'utf8');
        const $ = cheerio.load(html);

        // Extraer propertyId de Schema.org
        let propertyId = null;
        const schemaScript = $('script[type="application/ld+json"]').first();
        if (schemaScript.length) {
            try {
                const schema = JSON.parse(schemaScript.html());
                // Buscar en identifier o url
                if (schema.identifier) {
                    const match = schema.identifier.match(/(\d{8,})/);
                    if (match) propertyId = match[1];
                }
                if (!propertyId && schema.url) {
                    const match = schema.url.match(/[-_](\d{8,})\.html/);
                    if (match) propertyId = match[1];
                }
            } catch (e) {}
        }

        // Intentar extraer de comentarios HTML
        if (!propertyId) {
            const commentMatch = html.match(/<!--\s*Property ID:\s*(\d+)\s*-->/i);
            if (commentMatch) propertyId = commentMatch[1];
        }

        // Intentar extraer de la URL canónica
        if (!propertyId) {
            const canonical = $('link[rel="canonical"]').attr('href');
            if (canonical) {
                const match = canonical.match(/[-_](\d{8,})(?:\.html|\/)/);
                if (match) propertyId = match[1];
            }
        }

        // Extraer título
        let title = $('meta[property="og:title"]').attr('content')
                    || $('title').text()
                    || '';
        title = title.replace(/\s*\|\s*.*$/, '').trim(); // Quitar " | Hector..."

        // Extraer precio
        let price = '';
        const priceMatch = html.match(/(?:precio|price)["']?\s*[:=]\s*["']?\$?([\d,]+)/i);
        if (priceMatch) {
            price = '$' + priceMatch[1].replace(/,/g, ',');
        } else {
            // Intentar desde meta description
            const desc = $('meta[name="description"]').attr('content') || '';
            const descPriceMatch = desc.match(/\$?([\d,]+(?:\.\d{2})?)\s*(?:MXN|pesos)?/i);
            if (descPriceMatch) {
                price = '$' + descPriceMatch[1];
            }
        }

        // Extraer ubicación
        const location = $('meta[property="og:description"]').attr('content') || '';
        const locationMatch = location.match(/en\s+([^.]+)/);
        const extractedLocation = locationMatch ? locationMatch[1].trim() : '';

        // Extraer coordenadas del MARKER_CONFIG
        let lat = null, lng = null;
        const markerMatch = html.match(/const\s+MARKER_CONFIG\s*=\s*{[^}]*lat:\s*([-\d.]+)[^}]*lng:\s*([-\d.]+)/);
        if (markerMatch) {
            lat = parseFloat(markerMatch[1]);
            lng = parseFloat(markerMatch[2]);
        }

        // Extraer colonia
        let colonia = '';
        const coloniaMatch = html.match(/colonia["']?\s*:\s*["']([^"']+)["']/i);
        if (coloniaMatch) {
            colonia = coloniaMatch[1];
        } else if (extractedLocation) {
            // Primera parte antes de coma
            colonia = extractedLocation.split(',')[0].trim();
        }

        // Extraer características del Schema.org
        let bedrooms = null, bathrooms = null, constructionArea = null;
        if (schemaScript.length) {
            try {
                const schema = JSON.parse(schemaScript.html());
                bedrooms = schema.numberOfBedrooms || null;
                bathrooms = schema.numberOfBathroomsTotal || null;
                if (schema.floorSize && schema.floorSize.value) {
                    constructionArea = schema.floorSize.value;
                }
            } catch (e) {}
        }

        // Contar fotos
        let photoCount = 0;
        const imagesDir = path.join(path.dirname(htmlPath), 'images');
        if (fs.existsSync(imagesDir)) {
            const files = fs.readdirSync(imagesDir);
            photoCount = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).length;
        }

        // Fecha de scraping (usar mtime del archivo)
        const stats = fs.statSync(htmlPath);
        const scrapedAt = stats.mtime.toISOString();

        return {
            propertyId,
            title,
            slug,
            price,
            location: extractedLocation || colonia,
            lat,
            lng,
            colonia,
            bedrooms,
            bathrooms,
            constructionArea,
            photoCount,
            scrapedAt,
            city: 'culiacan',
            published: true
        };
    } catch (error) {
        console.error(`   ❌ Error procesando ${htmlPath}:`, error.message);
        return null;
    }
}

/**
 * Encuentra todas las carpetas de propiedades en culiacan/
 */
function findPropertyFolders() {
    if (!fs.existsSync(CULIACAN_DIR)) {
        console.error(`❌ Directorio ${CULIACAN_DIR} no existe`);
        return [];
    }

    const entries = fs.readdirSync(CULIACAN_DIR, { withFileTypes: true });
    const folders = [];

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const indexPath = path.join(CULIACAN_DIR, entry.name, 'index.html');
            if (fs.existsSync(indexPath)) {
                folders.push({
                    slug: entry.name,
                    htmlPath: indexPath
                });
            }
        }
    }

    return folders;
}

/**
 * Main
 */
async function main() {
    // Cargar base de datos existente
    const existingDB = loadExistingDatabase();
    const existingIds = new Set(existingDB.map(p => p.propertyId).filter(Boolean));
    const existingSlugs = new Set(existingDB.map(p => p.slug).filter(Boolean));

    console.log(`📊 Base de datos actual:`);
    console.log(`   - ${existingIds.size} propiedades con Property ID`);
    console.log(`   - ${existingSlugs.size} propiedades con slug\n`);

    // Encontrar carpetas
    const folders = findPropertyFolders();
    console.log(`📂 Carpetas encontradas: ${folders.length}\n`);

    if (folders.length === 0) {
        console.log('⚠️  No hay carpetas para procesar');
        return;
    }

    // Procesar cada carpeta
    const newEntries = [];
    const skipped = [];
    const errors = [];

    console.log('🔄 Procesando propiedades...\n');

    for (const { slug, htmlPath } of folders) {
        process.stdout.write(`   📄 ${slug}... `);

        // Extraer metadatos
        const metadata = extractMetadataFromHTML(htmlPath, slug);

        if (!metadata) {
            errors.push(slug);
            console.log('❌ Error');
            continue;
        }

        // Verificar si ya existe
        const alreadyExists = metadata.propertyId
            ? existingIds.has(metadata.propertyId)
            : existingSlugs.has(slug);

        if (alreadyExists) {
            skipped.push(slug);
            console.log(`⏭️  Ya existe (ID: ${metadata.propertyId || 'N/A'})`);
            continue;
        }

        // Agregar a nuevas entradas
        newEntries.push(metadata);
        console.log(`✅ Nueva (ID: ${metadata.propertyId || 'N/A'})`);
    }

    // Resumen
    console.log('\n' + '═'.repeat(70));
    console.log('📊 RESUMEN:');
    console.log(`   ✅ Propiedades nuevas encontradas: ${newEntries.length}`);
    console.log(`   ⏭️  Propiedades ya existentes: ${skipped.length}`);
    console.log(`   ❌ Errores: ${errors.length}`);
    console.log('═'.repeat(70) + '\n');

    if (errors.length > 0) {
        console.log('⚠️  Propiedades con errores:');
        errors.forEach(slug => console.log(`   - ${slug}`));
        console.log('');
    }

    // Mostrar algunas nuevas propiedades
    if (newEntries.length > 0) {
        console.log('🆕 Primeras 5 propiedades nuevas:');
        newEntries.slice(0, 5).forEach((prop, i) => {
            console.log(`\n   ${i + 1}. ${prop.title || prop.slug}`);
            console.log(`      ID: ${prop.propertyId || 'N/A'}`);
            console.log(`      Precio: ${prop.price || 'N/A'}`);
            console.log(`      Ubicación: ${prop.location || 'N/A'}`);
            console.log(`      Fotos: ${prop.photoCount || 0}`);
        });
        console.log('');
    }

    // Guardar si no es dry-run
    if (!isDryRun && newEntries.length > 0) {
        console.log('💾 Guardando cambios...');

        // Combinar con base de datos existente
        const updatedDB = [...existingDB, ...newEntries];

        // Ordenar por fecha de scraping (más recientes primero)
        updatedDB.sort((a, b) => {
            const dateA = new Date(a.scrapedAt || 0);
            const dateB = new Date(b.scrapedAt || 0);
            return dateB - dateA;
        });

        // Guardar
        fs.writeFileSync(DB_FILE, JSON.stringify(updatedDB, null, 2), 'utf8');
        console.log(`✅ Base de datos actualizada: ${updatedDB.length} propiedades totales\n`);

        // Backup
        const backupFile = DB_FILE.replace('.json', `-backup-${Date.now()}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(existingDB, null, 2), 'utf8');
        console.log(`💾 Backup creado: ${path.basename(backupFile)}\n`);
    } else if (isDryRun && newEntries.length > 0) {
        console.log('🔍 DRY RUN - No se guardaron cambios');
        console.log(`   Se agregarían ${newEntries.length} propiedades nuevas\n`);
    } else if (newEntries.length === 0) {
        console.log('ℹ️  No hay propiedades nuevas para agregar\n');
    }

    console.log('✅ Proceso completado\n');
}

// Run
main().catch(err => {
    console.error('\n❌ Error fatal:', err);
    process.exit(1);
});
