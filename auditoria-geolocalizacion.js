#!/usr/bin/env node

/**
 * AUDITORÍA PIPELINE DE GEOLOCALIZACIÓN V1.5
 *
 * Este script identifica propiedades que NO están usando el nuevo pipeline:
 * - data.lat, data.lng guardados en JSON
 * - locationPrecision y locationSource
 * - MARKER_CONFIG con coordenadas en HTML
 * - JSON-LD Schema.org con nodo geo
 */

const fs = require('fs');
const path = require('path');

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════════════════════════╗
║          🔍 AUDITORÍA PIPELINE DE GEOLOCALIZACIÓN V1.5                        ║
╚════════════════════════════════════════════════════════════════════════════════╝
${colors.reset}`);

// Bases de datos a revisar
const databases = [
    {
        name: 'Culiacán',
        file: 'inmuebles24-scraped-properties.json',
        htmlFolder: 'culiacan'
    },
    {
        name: 'Mazatlán',
        file: 'inmuebles24-scraped-properties-mazatlan.json',
        htmlFolder: 'mazatlan'
    }
];

// Estadísticas globales
const stats = {
    total: 0,
    conNuevoPipeline: 0,
    sinNuevoPipeline: 0,
    sinHTML: 0,
    erroresHTML: 0
};

const propiedadesPorActualizar = [];

// Función para verificar si una propiedad tiene el nuevo pipeline en JSON
function tieneNuevoPipelineJSON(property) {
    const checks = {
        tieneLatLng: property.lat !== undefined && property.lng !== undefined,
        tienePrecision: property.locationPrecision !== undefined,
        tieneFuente: property.locationSource !== undefined,
        coordenadasValidas: false
    };

    // Verificar que las coordenadas sean válidas (no 0,0 ni undefined)
    if (checks.tieneLatLng) {
        checks.coordenadasValidas =
            property.lat !== 0 &&
            property.lng !== 0 &&
            property.lat !== null &&
            property.lng !== null &&
            Math.abs(property.lat) <= 90 &&
            Math.abs(property.lng) <= 180;
    }

    checks.completo = checks.tieneLatLng && checks.tienePrecision && checks.tieneFuente && checks.coordenadasValidas;

    return checks;
}

// Función para verificar si el HTML tiene el nuevo pipeline
function tieneNuevoPipelineHTML(htmlPath) {
    const checks = {
        existe: false,
        tieneMarkerConfig: false,
        tieneCoordenadasMarker: false,
        tieneJSONLD: false,
        tieneGeoJSONLD: false
    };

    if (!fs.existsSync(htmlPath)) {
        return checks;
    }

    checks.existe = true;

    try {
        const html = fs.readFileSync(htmlPath, 'utf8');

        // Verificar MARKER_CONFIG
        checks.tieneMarkerConfig = html.includes('const MARKER_CONFIG');

        // Verificar coordenadas en MARKER_CONFIG
        const markerConfigMatch = html.match(/const MARKER_CONFIG\s*=\s*{[\s\S]*?position:\s*{\s*lat:\s*(-?\d+\.\d+),\s*lng:\s*(-?\d+\.\d+)/);
        if (markerConfigMatch) {
            const lat = parseFloat(markerConfigMatch[1]);
            const lng = parseFloat(markerConfigMatch[2]);
            checks.tieneCoordenadasMarker = lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
        }

        // Verificar JSON-LD
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        if (jsonLdMatch) {
            checks.tieneJSONLD = true;
            try {
                const jsonLd = JSON.parse(jsonLdMatch[1]);
                checks.tieneGeoJSONLD = jsonLd.geo !== undefined &&
                                       jsonLd.geo.latitude !== undefined &&
                                       jsonLd.geo.longitude !== undefined;
            } catch (e) {
                // JSON-LD inválido
            }
        }

        checks.completo = checks.tieneMarkerConfig && checks.tieneCoordenadasMarker && checks.tieneGeoJSONLD;

    } catch (error) {
        console.error(`${colors.red}Error leyendo HTML ${htmlPath}: ${error.message}${colors.reset}`);
        stats.erroresHTML++;
    }

    return checks;
}

// Procesar cada base de datos
databases.forEach(db => {
    console.log(`\n${colors.blue}╔═══════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║  📍 ${db.name.toUpperCase().padEnd(73)} ║`);
    console.log(`╚═══════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    if (!fs.existsSync(db.file)) {
        console.log(`${colors.yellow}⚠️  Base de datos no encontrada: ${db.file}${colors.reset}\n`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(db.file, 'utf8'));
    const properties = Array.isArray(data) ? data : (data.properties || []);

    console.log(`Total de propiedades: ${properties.length}\n`);

    properties.forEach((property, index) => {
        stats.total++;

        const checksJSON = tieneNuevoPipelineJSON(property);

        // Construir ruta del HTML
        const slug = property.slug || property.propertyId;
        const htmlPath = path.join(db.htmlFolder, slug, 'index.html');
        const checksHTML = tieneNuevoPipelineHTML(htmlPath);

        // Determinar estado
        const completo = checksJSON.completo && checksHTML.completo;

        if (completo) {
            stats.conNuevoPipeline++;
        } else {
            stats.sinNuevoPipeline++;

            // Agregar a lista de propiedades por actualizar
            propiedadesPorActualizar.push({
                database: db.name,
                propertyId: property.propertyId,
                title: property.title || property.propertyId,
                slug: slug,
                htmlPath: htmlPath,
                checksJSON: checksJSON,
                checksHTML: checksHTML,
                url: property.url
            });

            // Mostrar detalles
            console.log(`${colors.red}❌ ${property.title || property.propertyId}${colors.reset}`);
            console.log(`   ID: ${property.propertyId}`);
            console.log(`   Slug: ${slug}`);

            console.log(`\n   ${colors.yellow}JSON Database:${colors.reset}`);
            console.log(`   ${checksJSON.tieneLatLng ? '✅' : '❌'} lat/lng: ${property.lat || 'N/A'}, ${property.lng || 'N/A'}`);
            console.log(`   ${checksJSON.coordenadasValidas ? '✅' : '❌'} Coordenadas válidas`);
            console.log(`   ${checksJSON.tienePrecision ? '✅' : '❌'} locationPrecision: ${property.locationPrecision || 'N/A'}`);
            console.log(`   ${checksJSON.tieneFuente ? '✅' : '❌'} locationSource: ${property.locationSource || 'N/A'}`);

            console.log(`\n   ${colors.yellow}HTML Generado:${colors.reset}`);
            console.log(`   ${checksHTML.existe ? '✅' : '❌'} Archivo existe: ${htmlPath}`);
            if (checksHTML.existe) {
                console.log(`   ${checksHTML.tieneMarkerConfig ? '✅' : '❌'} MARKER_CONFIG`);
                console.log(`   ${checksHTML.tieneCoordenadasMarker ? '✅' : '❌'} Coordenadas en MARKER_CONFIG`);
                console.log(`   ${checksHTML.tieneJSONLD ? '✅' : '❌'} JSON-LD Schema.org`);
                console.log(`   ${checksHTML.tieneGeoJSONLD ? '✅' : '❌'} Nodo geo en JSON-LD`);
            }

            console.log('');
        }
    });

    console.log(`${colors.green}✅ Propiedades con nuevo pipeline: ${stats.conNuevoPipeline}${colors.reset}`);
    console.log(`${colors.red}❌ Propiedades SIN nuevo pipeline: ${stats.sinNuevoPipeline}${colors.reset}\n`);
});

// Resumen final
console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════════════════════════╗
║                           📊 RESUMEN GENERAL                                   ║
╚════════════════════════════════════════════════════════════════════════════════╝
${colors.reset}`);

console.log(`Total propiedades analizadas: ${stats.total}`);
console.log(`${colors.green}✅ Con nuevo pipeline: ${stats.conNuevoPipeline} (${((stats.conNuevoPipeline/stats.total)*100).toFixed(1)}%)${colors.reset}`);
console.log(`${colors.red}❌ Sin nuevo pipeline: ${stats.sinNuevoPipeline} (${((stats.sinNuevoPipeline/stats.total)*100).toFixed(1)}%)${colors.reset}`);
if (stats.erroresHTML > 0) {
    console.log(`${colors.yellow}⚠️  Errores leyendo HTML: ${stats.erroresHTML}${colors.reset}`);
}

// Guardar reporte detallado
const reporte = {
    timestamp: new Date().toISOString(),
    stats: stats,
    propiedadesPorActualizar: propiedadesPorActualizar.map(p => ({
        database: p.database,
        propertyId: p.propertyId,
        title: p.title,
        slug: p.slug,
        url: p.url,
        faltantes: {
            json: {
                latLng: !p.checksJSON.tieneLatLng,
                coordenadasValidas: !p.checksJSON.coordenadasValidas,
                precision: !p.checksJSON.tienePrecision,
                fuente: !p.checksJSON.tieneFuente
            },
            html: {
                archivoExiste: !p.checksHTML.existe,
                markerConfig: !p.checksHTML.tieneMarkerConfig,
                coordenadasMarker: !p.checksHTML.tieneCoordenadasMarker,
                jsonLd: !p.checksHTML.tieneJSONLD,
                geoJsonLd: !p.checksHTML.tieneGeoJSONLD
            }
        }
    }))
};

const reportePath = 'auditoria-geolocalizacion-reporte.json';
fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));

console.log(`\n${colors.green}✅ Reporte guardado en: ${reportePath}${colors.reset}`);

// Generar resumen por categoría de problema
console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════════════════════════╗`);
console.log(`║                      🔧 CATEGORÍAS DE PROBLEMAS                                ║`);
console.log(`╚════════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

const categorias = {
    sinLatLng: propiedadesPorActualizar.filter(p => !p.checksJSON.tieneLatLng).length,
    coordenadasInvalidas: propiedadesPorActualizar.filter(p => p.checksJSON.tieneLatLng && !p.checksJSON.coordenadasValidas).length,
    sinPrecision: propiedadesPorActualizar.filter(p => !p.checksJSON.tienePrecision).length,
    sinFuente: propiedadesPorActualizar.filter(p => !p.checksJSON.tieneFuente).length,
    sinHTML: propiedadesPorActualizar.filter(p => !p.checksHTML.existe).length,
    sinMarkerConfig: propiedadesPorActualizar.filter(p => p.checksHTML.existe && !p.checksHTML.tieneMarkerConfig).length,
    sinCoordenadasMarker: propiedadesPorActualizar.filter(p => p.checksHTML.existe && !p.checksHTML.tieneCoordenadasMarker).length,
    sinGeoJSONLD: propiedadesPorActualizar.filter(p => p.checksHTML.existe && !p.checksHTML.tieneGeoJSONLD).length
};

console.log(`${colors.yellow}JSON Database:${colors.reset}`);
console.log(`  Sin lat/lng: ${categorias.sinLatLng}`);
console.log(`  Coordenadas inválidas (0,0 o fuera de rango): ${categorias.coordenadasInvalidas}`);
console.log(`  Sin locationPrecision: ${categorias.sinPrecision}`);
console.log(`  Sin locationSource: ${categorias.sinFuente}`);

console.log(`\n${colors.yellow}HTML Generado:${colors.reset}`);
console.log(`  Sin archivo HTML: ${categorias.sinHTML}`);
console.log(`  Sin MARKER_CONFIG: ${categorias.sinMarkerConfig}`);
console.log(`  Sin coordenadas en MARKER_CONFIG: ${categorias.sinCoordenadasMarker}`);
console.log(`  Sin nodo geo en JSON-LD: ${categorias.sinGeoJSONLD}`);

// Lista de propiedades que requieren re-scrapeo
const requierenReScrapeo = propiedadesPorActualizar.filter(p =>
    !p.checksJSON.tieneLatLng ||
    !p.checksJSON.coordenadasValidas ||
    !p.checksHTML.existe ||
    !p.checksHTML.tieneMarkerConfig
);

if (requierenReScrapeo.length > 0) {
    console.log(`\n${colors.red}╔════════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║           ⚠️  PROPIEDADES QUE REQUIEREN RE-SCRAPEO (${requierenReScrapeo.length})                        ║`);
    console.log(`╚════════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    requierenReScrapeo.forEach(p => {
        console.log(`${colors.yellow}${p.title}${colors.reset}`);
        console.log(`  Database: ${p.database}`);
        console.log(`  ID: ${p.propertyId}`);
        console.log(`  URL: ${p.url || 'N/A'}`);
        console.log(`  Comando: node inmuebles24culiacanscraper.js "${p.url}"`);
        console.log('');
    });

    // Generar script de re-scrapeo
    const reScrapeoScript = requierenReScrapeo
        .filter(p => p.url)
        .map(p => `echo "Re-scrapeando ${p.title}..."\nnode inmuebles24culiacanscraper.js "${p.url}"\n`)
        .join('\n');

    fs.writeFileSync('re-scrapear-propiedades.sh', `#!/bin/bash\n\n# Script generado automáticamente\n# Re-scrapeo de propiedades sin geolocalización V1.5\n\n${reScrapeoScript}`);
    fs.chmodSync('re-scrapear-propiedades.sh', '755');

    console.log(`${colors.green}✅ Script de re-scrapeo generado: re-scrapear-propiedades.sh${colors.reset}`);
}

console.log(`\n${colors.cyan}✅ Auditoría completada.${colors.reset}\n`);
