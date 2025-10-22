#!/usr/bin/env node

/**
 * Script de Importación Masiva al CRM
 *
 * Este script importa TODAS las propiedades publicadas desde complete-properties-database.json
 * al CRM (crm-vendedores.json), asignándolas a un vendedor genérico "Hector BR".
 *
 * Uso:
 *   node automation/import-all-to-crm.js
 *
 * Genera:
 *   crm-vendedores.json (actualizado con todas las propiedades)
 *   automation/import-log.txt (log de ejecución)
 */

const fs = require('fs');
const path = require('path');

// Paths
const COMPLETE_DB_PATH = path.join(__dirname, '../complete-properties-database.json');
const CRM_JSON_PATH = path.join(__dirname, '../crm-vendedores.json');
const LOG_PATH = path.join(__dirname, 'import-log.txt');

// Log helper
let logMessages = [];
function log(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);
    logMessages.push(logLine);
}

/**
 * Detecta ciudad desde href
 */
function detectCityFromHref(href) {
    if (!href) return 'culiacan';
    const hrefLower = href.toLowerCase();
    if (hrefLower.includes('monterrey') || href.startsWith('monterrey/')) return 'monterrey';
    if (hrefLower.includes('mazatlan') || hrefLower.includes('mazatlán') || href.startsWith('mazatlan/')) return 'mazatlan';
    return 'culiacan';
}

/**
 * Genera ID único para propiedad
 */
function generatePropertyId(slug, index) {
    // Intentar extraer ID numérico del slug si existe
    const numMatch = slug.match(/\d+/);
    if (numMatch) {
        return `PROP-${numMatch[0]}`;
    }
    // Fallback: usar hash del slug
    const hash = slug.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return `PROP-${Math.abs(hash).toString().slice(0, 8)}`;
}

/**
 * Formatea precio con símbolo $
 */
function formatPrice(price) {
    if (!price) return '$0';
    if (price.toString().startsWith('$')) return price;
    return `$${price.toString().replace(/,/g, '')}`;
}

/**
 * Construye URL completa de la propiedad
 */
function buildPropertyUrl(href, ciudad) {
    if (!href) return '';

    // Si ya tiene el prefijo de ciudad, retornar tal cual
    if (href.startsWith('culiacan/') || href.startsWith('monterrey/') || href.startsWith('mazatlan/')) {
        return href;
    }

    // Si es solo el slug, agregar prefijo de ciudad
    if (!href.includes('/')) {
        return `${ciudad}/${href}/index.html`;
    }

    return href;
}

/**
 * Main function
 */
async function main() {
    log('🚀 Iniciando importación masiva al CRM...');
    log('');

    // Leer complete-properties-database.json
    if (!fs.existsSync(COMPLETE_DB_PATH)) {
        log('❌ No se encontró complete-properties-database.json');
        process.exit(1);
    }

    const completeDb = JSON.parse(fs.readFileSync(COMPLETE_DB_PATH, 'utf8'));
    log(`✅ Base de datos completa cargada: ${completeDb.length} propiedades`);
    log('');

    // Leer crm-vendedores.json
    let crmData;
    if (fs.existsSync(CRM_JSON_PATH)) {
        crmData = JSON.parse(fs.readFileSync(CRM_JSON_PATH, 'utf8'));
        log(`✅ CRM actual cargado: ${crmData.vendedores.length} vendedores`);
    } else {
        crmData = {
            version: "1.0",
            ultimaActualizacion: new Date().toISOString(),
            vendedores: [],
            estadisticas: {}
        };
        log('⚠️  No se encontró CRM existente, creando nuevo');
    }
    log('');

    // Buscar o crear vendedor genérico "Hector BR"
    let vendedorGenerico = crmData.vendedores.find(v => v.nombre === 'Hector BR');

    if (!vendedorGenerico) {
        vendedorGenerico = {
            id: "VEND-HECTOR-BR",
            nombre: "Hector BR",
            telefono: "6671234567",
            telefonoFormateado: "(667) 123-4567",
            whatsapp: "https://wa.me/526671234567",
            email: "contacto@casasenventa.info",
            fuente: "Propietario",
            propiedades: []
        };
        crmData.vendedores.push(vendedorGenerico);
        log('✅ Vendedor genérico "Hector BR" creado');
    } else {
        log(`✅ Vendedor genérico encontrado con ${vendedorGenerico.propiedades.length} propiedades`);
    }
    log('');

    // Crear set de propiedades ya existentes (por slug)
    const existingSlugs = new Set();
    crmData.vendedores.forEach(vendedor => {
        vendedor.propiedades.forEach(prop => {
            if (prop.url) {
                // Extraer slug desde URL
                const slugMatch = prop.url.match(/([^\/]+)\/index\.html$/);
                if (slugMatch) {
                    existingSlugs.add(slugMatch[1]);
                }
            }
        });
    });

    log(`📦 Propiedades ya existentes en CRM: ${existingSlugs.size}`);
    log('');

    // Importar propiedades faltantes
    let propiedadesImportadas = 0;
    let propiedadesDuplicadas = 0;

    completeDb.forEach((prop, index) => {
        const slug = prop.slug || prop.href?.replace('/index.html', '').split('/').pop();

        if (!slug) {
            log(`⚠️  Propiedad sin slug en índice ${index}, saltando...`);
            return;
        }

        // Verificar si ya existe
        if (existingSlugs.has(slug)) {
            propiedadesDuplicadas++;
            return;
        }

        // Detectar ciudad
        const ciudad = detectCityFromHref(prop.href);

        // Construir objeto propiedad para CRM
        const nuevaPropiedad = {
            id: generatePropertyId(slug, index),
            titulo: prop.title || 'Sin título',
            precio: formatPrice(prop.price),
            tipo: prop.type || 'venta',
            url: buildPropertyUrl(prop.href, ciudad),
            ciudad: ciudad,
            ubicacion: prop.location || '',
            colonia: null, // Se llenará con sync-crm-colonias.js
            recamaras: prop.bedrooms || null,
            banos: prop.bathrooms || null,
            construccion: prop.constructionArea || null,
            terreno: prop.landArea || null,
            estacionamientos: prop.parkingSpaces || null,
            fotoPrincipal: null, // Se llenará con sync-crm-colonias.js
            fechaAgregada: new Date().toISOString()
        };

        // Agregar a vendedor genérico
        vendedorGenerico.propiedades.push(nuevaPropiedad);
        propiedadesImportadas++;

        if (propiedadesImportadas % 20 === 0) {
            log(`  📊 Progreso: ${propiedadesImportadas} propiedades importadas...`);
        }
    });

    log('');
    log('📊 RESUMEN DE IMPORTACIÓN');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`Total propiedades en base de datos completa: ${completeDb.length}`);
    log(`Propiedades ya existentes en CRM: ${propiedadesDuplicadas}`);
    log(`Propiedades importadas: ${propiedadesImportadas}`);
    log(`Total propiedades en CRM ahora: ${vendedorGenerico.propiedades.length}`);
    log('');

    // Actualizar estadísticas
    crmData.ultimaActualizacion = new Date().toISOString();
    crmData.estadisticas = {
        ultimaActualizacion: new Date().toISOString(),
        totalVendedores: crmData.vendedores.length,
        totalPropiedades: crmData.vendedores.reduce((sum, v) => sum + v.propiedades.length, 0)
    };

    // Guardar JSON actualizado
    fs.writeFileSync(CRM_JSON_PATH, JSON.stringify(crmData, null, 2), 'utf8');
    log('💾 crm-vendedores.json actualizado');
    log('');

    // Guardar log
    fs.writeFileSync(LOG_PATH, logMessages.join('\n'), 'utf8');
    log(`📝 Log guardado en: ${LOG_PATH}`);
    log('');
    log('✅ Importación completada exitosamente!');
    log('');
    log('📌 PRÓXIMO PASO:');
    log('   Ejecuta: node automation/sync-crm-colonias.js');
    log('   Para enriquecer las propiedades con colonia, ciudad y fotos.');
}

// Ejecutar
main().catch(error => {
    log(`❌ Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
});
