#!/usr/bin/env node

/**
 * Script para Agregar Propiedades de Monterrey y Mazatlán al CRM
 *
 * Extrae propiedades directamente desde las carpetas monterrey/ y mazatlan/
 * y las agrega al CRM bajo el vendedor "Hector BR".
 */

const fs = require('fs');
const path = require('path');

// Paths
const CRM_JSON_PATH = path.join(__dirname, '../crm-vendedores.json');
const MONTERREY_DIR = path.join(__dirname, '../monterrey');
const MAZATLAN_DIR = path.join(__dirname, '../mazatlan');

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Extrae datos de una propiedad desde su HTML
 */
function extractPropertyData(htmlPath, ciudad) {
    try {
        const html = fs.readFileSync(htmlPath, 'utf8');

        // Extraer título desde <title>
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        let titulo = titleMatch ? titleMatch[1].split('|')[0].trim() : 'Sin título';

        // Extraer precio desde meta og:price:amount o desde el HTML
        const priceMetaMatch = html.match(/<meta[^>]*property=["\']og:price:amount["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i);
        let precio = priceMetaMatch ? priceMetaMatch[1] : '';

        // Formatear precio si es necesario
        if (precio && !precio.startsWith('$')) {
            const numericPrice = precio.replace(/[^\d]/g, '');
            if (numericPrice) {
                precio = `$${parseInt(numericPrice, 10).toLocaleString('en-US')}`;
            }
        }

        // Extraer slug desde path
        const slug = path.basename(path.dirname(htmlPath));

        // Construir URL
        const url = `${ciudad}/${slug}/index.html`;

        // Detectar tipo (venta/renta)
        const tituloLower = titulo.toLowerCase();
        const tipo = tituloLower.includes('renta') || tituloLower.includes('alquiler') ? 'renta' : 'venta';

        return {
            id: `PROP-${slug.slice(0, 8)}`,
            titulo,
            precio: precio || '$0',
            tipo,
            url,
            ciudad,
            ubicacion: '',
            colonia: null,
            recamaras: null,
            banos: null,
            construccion: null,
            terreno: null,
            fotoPrincipal: null,
            fechaAgregada: new Date().toISOString()
        };
    } catch (error) {
        log(`  ❌ Error al procesar ${htmlPath}: ${error.message}`);
        return null;
    }
}

/**
 * Escanea un directorio de ciudad y extrae propiedades
 */
function scanCityDirectory(cityDir, cityName) {
    const properties = [];

    if (!fs.existsSync(cityDir)) {
        log(`⚠️  Directorio no encontrado: ${cityDir}`);
        return properties;
    }

    const subdirs = fs.readdirSync(cityDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    log(`📂 Escaneando ${cityName}: ${subdirs.length} carpetas`);

    for (const subdir of subdirs) {
        const htmlPath = path.join(cityDir, subdir, 'index.html');

        if (fs.existsSync(htmlPath)) {
            const propData = extractPropertyData(htmlPath, cityName);
            if (propData) {
                properties.push(propData);
                log(`  ✅ ${propData.titulo}`);
            }
        }
    }

    return properties;
}

async function main() {
    log('🚀 Iniciando importación de Monterrey y Mazatlán...');
    log('');

    // Leer CRM
    const crmData = JSON.parse(fs.readFileSync(CRM_JSON_PATH, 'utf8'));
    log(`✅ CRM cargado: ${crmData.vendedores.length} vendedores`);

    // Buscar vendedor Hector BR
    let vendedorHector = crmData.vendedores.find(v => v.nombre === 'Hector BR');
    if (!vendedorHector) {
        log('❌ No se encontró vendedor "Hector BR"');
        process.exit(1);
    }

    log(`✅ Vendedor encontrado con ${vendedorHector.propiedades.length} propiedades`);
    log('');

    // Crear set de URLs existentes
    const existingUrls = new Set();
    crmData.vendedores.forEach(v => {
        v.propiedades.forEach(p => {
            if (p.url) existingUrls.add(p.url);
        });
    });

    log(`📦 URLs existentes en CRM: ${existingUrls.size}`);
    log('');

    // Extraer propiedades de Monterrey
    const monterreyProps = scanCityDirectory(MONTERREY_DIR, 'monterrey');
    log('');

    // Extraer propiedades de Mazatlán
    const mazatlanProps = scanCityDirectory(MAZATLAN_DIR, 'mazatlan');
    log('');

    // Agregar propiedades nuevas
    let added = 0;
    const allNewProps = [...monterreyProps, ...mazatlanProps];

    for (const prop of allNewProps) {
        if (!existingUrls.has(prop.url)) {
            vendedorHector.propiedades.push(prop);
            added++;
        }
    }

    log('📊 RESUMEN');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`Monterrey extraídas: ${monterreyProps.length}`);
    log(`Mazatlán extraídas: ${mazatlanProps.length}`);
    log(`Propiedades nuevas agregadas: ${added}`);
    log(`Total propiedades "Hector BR": ${vendedorHector.propiedades.length}`);
    log('');

    // Actualizar estadísticas
    crmData.ultimaActualizacion = new Date().toISOString();

    // Guardar
    fs.writeFileSync(CRM_JSON_PATH, JSON.stringify(crmData, null, 2), 'utf8');
    log('💾 CRM actualizado');
    log('✅ Importación completada!');
}

main().catch(error => {
    log(`❌ Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
});
