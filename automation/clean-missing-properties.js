#!/usr/bin/env node

/**
 * Script para Limpiar Propiedades Faltantes del CRM
 *
 * Elimina propiedades que tienen URLs locales pero cuyos archivos no existen.
 * Mantiene propiedades con URLs externas (Inmuebles24).
 */

const fs = require('fs');
const path = require('path');

// Paths
const CRM_JSON_PATH = path.join(__dirname, '../crm-vendedores.json');
const BASE_DIR = path.join(__dirname, '..');

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

async function main() {
    log('🚀 Iniciando limpieza de propiedades faltantes...');
    log('');

    // Leer CRM
    const crmData = JSON.parse(fs.readFileSync(CRM_JSON_PATH, 'utf8'));
    log(`✅ CRM cargado: ${crmData.vendedores.length} vendedores`);
    log('');

    let totalPropiedades = 0;
    let eliminadas = 0;
    const eliminadasList = [];

    // Procesar cada vendedor
    for (const vendedor of crmData.vendedores) {
        const propiedadesOriginales = vendedor.propiedades.length;

        vendedor.propiedades = vendedor.propiedades.filter(prop => {
            totalPropiedades++;

            // Si es URL externa, mantener
            if (!prop.url || prop.url.startsWith('http')) {
                return true;
            }

            // Verificar si existe el archivo
            const fullPath = path.join(BASE_DIR, prop.url);
            const exists = fs.existsSync(fullPath);

            if (!exists) {
                log(`❌ ELIMINANDO: ${prop.titulo}`);
                log(`   URL faltante: ${prop.url}`);
                log(`   Ciudad: ${prop.ciudad}`);
                log('');

                eliminadas++;
                eliminadasList.push({
                    titulo: prop.titulo,
                    url: prop.url,
                    ciudad: prop.ciudad
                });
            }

            return exists;
        });

        if (propiedadesOriginales !== vendedor.propiedades.length) {
            log(`👤 ${vendedor.nombre}: ${propiedadesOriginales} → ${vendedor.propiedades.length} propiedades`);
        }
    }

    log('');
    log('📊 RESUMEN DE LIMPIEZA');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`Total propiedades procesadas: ${totalPropiedades}`);
    log(`Propiedades eliminadas: ${eliminadas}`);
    log(`Propiedades restantes: ${totalPropiedades - eliminadas}`);
    log('');

    if (eliminadas > 0) {
        // Actualizar timestamp
        crmData.ultimaActualizacion = new Date().toISOString();

        // Guardar JSON actualizado
        fs.writeFileSync(CRM_JSON_PATH, JSON.stringify(crmData, null, 2), 'utf8');
        log('💾 crm-vendedores.json actualizado');
        log('✅ Limpieza completada exitosamente!');
        log('');
        log('⚠️  PROPIEDADES ELIMINADAS:');
        eliminadasList.forEach(prop => {
            log(`   - ${prop.titulo} (${prop.ciudad})`);
        });
    } else {
        log('✅ No se encontraron propiedades faltantes. El CRM está limpio!');
    }
}

main().catch(error => {
    log(`❌ Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
});
