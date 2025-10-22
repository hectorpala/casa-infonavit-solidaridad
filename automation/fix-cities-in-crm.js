#!/usr/bin/env node

/**
 * Script para Corregir Ciudades en el CRM
 *
 * Este script corrige el campo "ciudad" de todas las propiedades en crm-vendedores.json
 * detectando la ciudad desde la URL de cada propiedad.
 *
 * Uso:
 *   node automation/fix-cities-in-crm.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const CRM_JSON_PATH = path.join(__dirname, '../crm-vendedores.json');

// Log helper
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

/**
 * Detecta ciudad desde URL
 */
function detectCityFromUrl(url) {
    if (!url) return 'culiacan';

    const urlLower = url.toLowerCase();

    // Detectar por inicio de path
    if (url.startsWith('monterrey/')) return 'monterrey';
    if (url.startsWith('mazatlan/')) return 'mazatlan';
    if (url.startsWith('culiacan/')) return 'culiacan';

    // Detectar por contenido
    if (urlLower.includes('monterrey')) return 'monterrey';
    if (urlLower.includes('mazatlan') || urlLower.includes('mazatlán')) return 'mazatlan';

    return 'culiacan';
}

/**
 * Main function
 */
async function main() {
    log('🚀 Iniciando corrección de ciudades en CRM...');
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
    let propiedadesCorregidas = 0;
    let estadisticas = {
        culiacan: 0,
        monterrey: 0,
        mazatlan: 0
    };

    // Procesar cada vendedor
    for (const vendedor of crmData.vendedores) {
        for (const propiedad of vendedor.propiedades) {
            totalPropiedades++;

            const ciudadAnterior = propiedad.ciudad;
            const ciudadNueva = detectCityFromUrl(propiedad.url);

            if (ciudadAnterior !== ciudadNueva) {
                log(`  📍 Corrigiendo: ${propiedad.titulo}`);
                log(`     ${ciudadAnterior} → ${ciudadNueva}`);
                log(`     URL: ${propiedad.url}`);
                propiedad.ciudad = ciudadNueva;
                propiedadesCorregidas++;
            }

            // Actualizar estadísticas
            estadisticas[ciudadNueva]++;
        }
    }

    log('');
    log('📊 RESUMEN DE CORRECCIÓN');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`Total propiedades procesadas: ${totalPropiedades}`);
    log(`Propiedades corregidas: ${propiedadesCorregidas}`);
    log('');
    log('Distribución por ciudad:');
    log(`  🏙️  Culiacán:  ${estadisticas.culiacan}`);
    log(`  🏙️  Monterrey: ${estadisticas.monterrey}`);
    log(`  🏙️  Mazatlán:  ${estadisticas.mazatlan}`);
    log('');

    // Actualizar estadísticas en CRM
    crmData.ultimaActualizacion = new Date().toISOString();
    if (!crmData.estadisticas) {
        crmData.estadisticas = {};
    }
    crmData.estadisticas.ultimaActualizacion = new Date().toISOString();
    crmData.estadisticas.totalPropiedades = totalPropiedades;
    crmData.estadisticas.porCiudad = estadisticas;

    // Guardar JSON actualizado
    fs.writeFileSync(CRM_JSON_PATH, JSON.stringify(crmData, null, 2), 'utf8');
    log('💾 crm-vendedores.json actualizado');
    log('');
    log('✅ Corrección completada exitosamente!');
}

// Ejecutar
main().catch(error => {
    log(`❌ Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
});
