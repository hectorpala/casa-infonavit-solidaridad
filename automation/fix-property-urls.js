#!/usr/bin/env node

/**
 * Script para Corregir URLs de Propiedades en el CRM
 *
 * Agrega el prefijo de ciudad (culiacan/, monterrey/, mazatlan/) a las URLs
 * que no lo tienen.
 *
 * Uso:
 *   node automation/fix-property-urls.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const CRM_JSON_PATH = path.join(__dirname, '../crm-vendedores.json');

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Verifica si la URL necesita corrección
 */
function needsCorrection(url, ciudad) {
    if (!url) return false;

    // Si es URL externa (http/https), no necesita corrección
    if (url.startsWith('http')) return false;

    // Si ya tiene el prefijo de ciudad, no necesita corrección
    if (url.startsWith(`${ciudad}/`)) return false;

    // Si es solo el slug sin ciudad, necesita corrección
    return true;
}

/**
 * Corrige la URL agregando el prefijo de ciudad
 */
function fixUrl(url, ciudad) {
    if (!url) return url;

    // Si es URL externa, retornar sin cambios
    if (url.startsWith('http')) return url;

    // Si ya tiene prefijo de ciudad, retornar sin cambios
    if (url.startsWith(`${ciudad}/`)) return url;

    // Agregar prefijo de ciudad
    return `${ciudad}/${url}`;
}

async function main() {
    log('🚀 Iniciando corrección de URLs...');
    log('');

    // Leer CRM
    const crmData = JSON.parse(fs.readFileSync(CRM_JSON_PATH, 'utf8'));
    log(`✅ CRM cargado: ${crmData.vendedores.length} vendedores`);
    log('');

    let totalPropiedades = 0;
    let urlsCorregidas = 0;

    // Procesar cada vendedor
    for (const vendedor of crmData.vendedores) {
        log(`👤 Procesando vendedor: ${vendedor.nombre} (${vendedor.propiedades.length} propiedades)`);

        for (const propiedad of vendedor.propiedades) {
            totalPropiedades++;

            if (needsCorrection(propiedad.url, propiedad.ciudad)) {
                const urlAnterior = propiedad.url;
                propiedad.url = fixUrl(propiedad.url, propiedad.ciudad);

                log(`  📍 ${propiedad.titulo}`);
                log(`     ${urlAnterior} → ${propiedad.url}`);
                urlsCorregidas++;
            }
        }
        log('');
    }

    log('📊 RESUMEN DE CORRECCIÓN');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`Total propiedades procesadas: ${totalPropiedades}`);
    log(`URLs corregidas: ${urlsCorregidas}`);
    log('');

    // Guardar JSON actualizado
    fs.writeFileSync(CRM_JSON_PATH, JSON.stringify(crmData, null, 2), 'utf8');
    log('💾 crm-vendedores.json actualizado');
    log('✅ Corrección completada exitosamente!');
}

main().catch(error => {
    log(`❌ Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
});
