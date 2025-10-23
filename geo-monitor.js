#!/usr/bin/env node

/**
 * GEO-MONITOR - Sistema de Monitoreo de Geocodificación
 *
 * Analiza las propiedades scrapeadas de Inmuebles24 y genera métricas
 * de calidad de geocodificación.
 *
 * USO:
 *   node geo-monitor.js                    # Analiza todas las propiedades
 *   node geo-monitor.js --export           # Genera CSV de métricas
 *   node geo-monitor.js --alert            # Solo muestra alertas si aplican
 *
 * MÉTRICAS:
 *   - % street, % neighborhood, % city
 *   - % needs_review (precision=city OR confidence<0.5)
 *   - Confianza promedio
 *
 * ALERTAS:
 *   - city > 60%
 *   - needs_review > 60%
 *
 * OUTPUT:
 *   - Console: Tabla de métricas
 *   - CSV: geo-metrics-YYYYMMDD.csv (con --export)
 *
 * @author Claude Code
 * @date 2025-10-22
 */

const fs = require('fs');
const { geocoder } = require('./geo-geocoder-culiacan');

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
    scrapedPropertiesFile: 'inmuebles24-scraped-properties.json',
    scrapedPropertiesFileMazatlan: 'inmuebles24-scraped-properties-mazatlan.json',
    metricsFilePattern: 'geo-metrics-YYYYMMDD.csv',
    alertThresholds: {
        cityPercent: 60,  // Alerta si city > 60%
        needsReviewPercent: 60  // Alerta si needs_review > 60%
    }
};

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Carga propiedades scrapeadas desde JSON
 */
function loadScrapedProperties() {
    const properties = [];

    // Cargar Culiacán
    if (fs.existsSync(CONFIG.scrapedPropertiesFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(CONFIG.scrapedPropertiesFile, 'utf8'));
            if (Array.isArray(data)) {
                properties.push(...data.map(p => ({ ...p, ciudad: 'Culiacán' })));
            }
        } catch (error) {
            console.warn(`⚠️  Error al cargar ${CONFIG.scrapedPropertiesFile}: ${error.message}`);
        }
    }

    // Cargar Mazatlán
    if (fs.existsSync(CONFIG.scrapedPropertiesFileMazatlan)) {
        try {
            const data = JSON.parse(fs.readFileSync(CONFIG.scrapedPropertiesFileMazatlan, 'utf8'));
            if (Array.isArray(data)) {
                properties.push(...data.map(p => ({ ...p, ciudad: 'Mazatlán' })));
            }
        } catch (error) {
            console.warn(`⚠️  Error al cargar ${CONFIG.scrapedPropertiesFileMazatlan}: ${error.message}`);
        }
    }

    return properties;
}

/**
 * Geocodifica una propiedad si no tiene datos de geocodificación
 */
async function geocodeProperty(property) {
    // Si ya tiene datos de geocodificación, retornarlos
    if (property.locationPrecision && property.locationConfidence !== undefined) {
        return {
            precision: property.locationPrecision,
            confidence: property.locationConfidence,
            colonia: property.colonia,
            lat: property.lat,
            lng: property.lng,
            source: 'cached'
        };
    }

    // Si no tiene ubicación, no se puede geocodificar
    if (!property.location) {
        return {
            precision: 'city',
            confidence: 0.2,
            colonia: null,
            lat: 24.8091,
            lng: -107.3940,
            source: 'no-location'
        };
    }

    // Geocodificar (solo para Culiacán por ahora)
    if (property.ciudad === 'Culiacán') {
        try {
            const result = await geocoder.geocode(property.location);
            return {
                precision: result.precision,
                confidence: result.confidence,
                colonia: result.colonia?.nombre || null,
                lat: result.coordinates.lat,
                lng: result.coordinates.lng,
                source: 'geocoded'
            };
        } catch (error) {
            console.warn(`⚠️  Error geocodificando "${property.location}": ${error.message}`);
            return {
                precision: 'city',
                confidence: 0.2,
                colonia: null,
                lat: 24.8091,
                lng: -107.3940,
                source: 'error'
            };
        }
    } else {
        // Otras ciudades: retornar city-level
        return {
            precision: 'city',
            confidence: 0.3,
            colonia: null,
            lat: property.lat || 0,
            lng: property.lng || 0,
            source: 'other-city'
        };
    }
}

/**
 * Analiza propiedades y genera métricas
 */
async function analyzeProperties(properties) {
    console.log(`\n📊 Analizando ${properties.length} propiedades...\n`);

    const results = [];
    const stats = {
        total: properties.length,
        byPrecision: {
            street: 0,
            street_no_number: 0,
            neighborhood: 0,
            city: 0
        },
        needsReview: 0,
        totalConfidence: 0,
        withColonia: 0,
        byCiudad: {}
    };

    for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        const geoData = await geocodeProperty(property);

        // Clasificar precisión
        if (geoData.precision === 'street' || geoData.precision === 'street_no_number') {
            stats.byPrecision.street++;
        } else if (geoData.precision === 'neighborhood') {
            stats.byPrecision.neighborhood++;
        } else {
            stats.byPrecision.city++;
        }

        // Needs review: city-level OR confidence < 0.5
        const needsReview = geoData.precision === 'city' || geoData.confidence < 0.5;
        if (needsReview) stats.needsReview++;

        // Confianza
        stats.totalConfidence += geoData.confidence;

        // Colonia
        if (geoData.colonia) stats.withColonia++;

        // Por ciudad
        const ciudad = property.ciudad || 'Unknown';
        if (!stats.byCiudad[ciudad]) {
            stats.byCiudad[ciudad] = { total: 0, street: 0, neighborhood: 0, city: 0 };
        }
        stats.byCiudad[ciudad].total++;
        if (geoData.precision === 'street' || geoData.precision === 'street_no_number') {
            stats.byCiudad[ciudad].street++;
        } else if (geoData.precision === 'neighborhood') {
            stats.byCiudad[ciudad].neighborhood++;
        } else {
            stats.byCiudad[ciudad].city++;
        }

        results.push({
            id: property.propertyId || property.id || `prop-${i}`,
            title: property.title,
            location: property.location,
            ciudad: property.ciudad || 'Unknown',
            precision: geoData.precision,
            confidence: geoData.confidence,
            colonia: geoData.colonia,
            needsReview: needsReview,
            source: geoData.source
        });

        // Progress
        if ((i + 1) % 10 === 0 || i === properties.length - 1) {
            process.stdout.write(`\r   Procesadas: ${i + 1}/${properties.length}`);
        }
    }

    console.log('\n');

    // Calcular porcentajes
    stats.avgConfidence = stats.totalConfidence / stats.total;
    stats.percentages = {
        street: (stats.byPrecision.street / stats.total) * 100,
        neighborhood: (stats.byPrecision.neighborhood / stats.total) * 100,
        city: (stats.byPrecision.city / stats.total) * 100,
        needsReview: (stats.needsReview / stats.total) * 100,
        withColonia: (stats.withColonia / stats.total) * 100
    };

    return { results, stats };
}

/**
 * Imprime tabla de métricas
 */
function printMetrics(stats) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           📊 MÉTRICAS DE GEOCODIFICACIÓN                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Total propiedades analizadas: ${stats.total}`);
    console.log('');

    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ PRECISIÓN DE GEOCODIFICACIÓN                            │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│ 🎯 Street-level       : ${stats.byPrecision.street.toString().padStart(3)} (${stats.percentages.street.toFixed(1).padStart(5)}%)   │`);
    console.log(`│ 🏘️  Neighborhood-level: ${stats.byPrecision.neighborhood.toString().padStart(3)} (${stats.percentages.neighborhood.toFixed(1).padStart(5)}%)   │`);
    console.log(`│ 🌆 City-level         : ${stats.byPrecision.city.toString().padStart(3)} (${stats.percentages.city.toFixed(1).padStart(5)}%)   │`);
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('');

    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ CALIDAD                                                  │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│ ⚠️  Requieren revisión: ${stats.needsReview.toString().padStart(3)} (${stats.percentages.needsReview.toFixed(1).padStart(5)}%)   │`);
    console.log(`│ 🏘️  Con colonia      : ${stats.withColonia.toString().padStart(3)} (${stats.percentages.withColonia.toFixed(1).padStart(5)}%)   │`);
    console.log(`│ 💯 Confianza promedio: ${(stats.avgConfidence * 100).toFixed(1).padStart(5)}%          │`);
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('');

    // Métricas por ciudad
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ POR CIUDAD                                               │');
    console.log('├─────────────────────────────────────────────────────────┤');
    Object.keys(stats.byCiudad).forEach(ciudad => {
        const cityStats = stats.byCiudad[ciudad];
        const cityPct = (cityStats.city / cityStats.total * 100).toFixed(1);
        console.log(`│ 📍 ${ciudad.padEnd(15)}: ${cityStats.total.toString().padStart(3)} props (city: ${cityPct}%)  │`);
    });
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('');
}

/**
 * Verifica y muestra alertas
 */
function checkAlerts(stats) {
    const alerts = [];

    // Alerta: city > 60%
    if (stats.percentages.city > CONFIG.alertThresholds.cityPercent) {
        alerts.push({
            level: 'ERROR',
            message: `City-level precision muy alto: ${stats.percentages.city.toFixed(1)}% (umbral: ${CONFIG.alertThresholds.cityPercent}%)`,
            recommendation: 'Revisar normalizador de direcciones y gazetteer'
        });
    }

    // Alerta: needs_review > 60%
    if (stats.percentages.needsReview > CONFIG.alertThresholds.needsReviewPercent) {
        alerts.push({
            level: 'WARNING',
            message: `Propiedades que requieren revisión: ${stats.percentages.needsReview.toFixed(1)}% (umbral: ${CONFIG.alertThresholds.needsReviewPercent}%)`,
            recommendation: 'Revisar manualmente propiedades con baja confianza'
        });
    }

    // Alerta: confianza promedio < 50%
    if (stats.avgConfidence < 0.5) {
        alerts.push({
            level: 'WARNING',
            message: `Confianza promedio baja: ${(stats.avgConfidence * 100).toFixed(1)}%`,
            recommendation: 'Mejorar sistema de matching de colonias'
        });
    }

    if (alerts.length > 0) {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                  🚨 ALERTAS DETECTADAS                     ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('');

        alerts.forEach((alert, i) => {
            const icon = alert.level === 'ERROR' ? '❌' : '⚠️';
            console.log(`${icon} [${alert.level}] ${alert.message}`);
            console.log(`   💡 Recomendación: ${alert.recommendation}`);
            console.log('');
        });
    } else {
        console.log('✅ No se detectaron alertas. Sistema funcionando correctamente.\n');
    }

    return alerts;
}

/**
 * Exporta métricas a CSV
 */
function exportToCSV(results, stats) {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `geo-metrics-${today}.csv`;

    // Header
    const header = 'id,title,location,ciudad,precision,confidence,colonia,needs_review,source\n';

    // Rows
    const rows = results.map(r => {
        const title = `"${(r.title || '').replace(/"/g, '""')}"`;
        const location = `"${(r.location || '').replace(/"/g, '""')}"`;
        const colonia = r.colonia ? `"${r.colonia.replace(/"/g, '""')}"` : '';

        return `${r.id},${title},${location},${r.ciudad},${r.precision},${r.confidence.toFixed(2)},${colonia},${r.needsReview},${r.source}`;
    }).join('\n');

    // Agregar resumen al final
    const summary = `\n\n# RESUMEN\n` +
        `# Total,${stats.total}\n` +
        `# Street,${stats.byPrecision.street},${stats.percentages.street.toFixed(1)}%\n` +
        `# Neighborhood,${stats.byPrecision.neighborhood},${stats.percentages.neighborhood.toFixed(1)}%\n` +
        `# City,${stats.byPrecision.city},${stats.percentages.city.toFixed(1)}%\n` +
        `# Needs Review,${stats.needsReview},${stats.percentages.needsReview.toFixed(1)}%\n` +
        `# Avg Confidence,${(stats.avgConfidence * 100).toFixed(1)}%\n`;

    const csv = header + rows + summary;

    fs.writeFileSync(filename, csv, 'utf8');
    console.log(`📄 Métricas exportadas a: ${filename}\n`);

    return filename;
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('\n🔍 GEO-MONITOR - Sistema de Monitoreo de Geocodificación\n');

    const args = process.argv.slice(2);
    const exportMode = args.includes('--export');
    const alertMode = args.includes('--alert');

    // 1. Cargar propiedades
    const properties = loadScrapedProperties();

    if (properties.length === 0) {
        console.log('⚠️  No se encontraron propiedades scrapeadas.');
        console.log('   Verifica que existan los archivos:');
        console.log(`   - ${CONFIG.scrapedPropertiesFile}`);
        console.log(`   - ${CONFIG.scrapedPropertiesFileMazatlan}`);
        process.exit(1);
    }

    console.log(`✅ Cargadas ${properties.length} propiedades\n`);

    // 2. Analizar propiedades
    const { results, stats } = await analyzeProperties(properties);

    // 3. Mostrar métricas (si no es modo alert-only)
    if (!alertMode) {
        printMetrics(stats);
    }

    // 4. Verificar alertas
    const alerts = checkAlerts(stats);

    // 5. Exportar CSV si se solicitó
    if (exportMode) {
        exportToCSV(results, stats);
    }

    // Exit code según alertas
    if (alerts.some(a => a.level === 'ERROR')) {
        process.exit(1);  // Error si hay alertas críticas
    }

    process.exit(0);
}

// Ejecutar
main().catch(error => {
    console.error(`\n❌ Error fatal: ${error.message}\n`);
    console.error(error.stack);
    process.exit(1);
});
