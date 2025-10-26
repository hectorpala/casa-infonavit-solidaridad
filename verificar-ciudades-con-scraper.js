const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');

/**
 * Verifica la ciudad real de cada URL usando inmuebles24culiacanscraper.js
 * Este script usa OXYLABS para bypasear Cloudflare y obtener datos reales
 */

(async () => {
    console.log('🔍 VERIFICACIÓN DE CIUDADES CON SCRAPER OXYLABS\n');
    console.log('═'.repeat(100));

    // Leer URLs del archivo
    const urlsContent = fs.readFileSync('urls-propiedades-recientes-culiacan.txt', 'utf8');
    const urls = urlsContent.split('\n').map(line => line.trim()).filter(line => line && line.startsWith('http'));

    // MUESTRA: Solo verificar primeras 5 URLs
    const urlsToCheck = urls.slice(0, 5);

    console.log(`📋 Total de URLs disponibles: ${urls.length}`);
    console.log(`🎯 Verificando MUESTRA de: ${urlsToCheck.length} URLs\n`);

    const results = [];
    let culiacanCount = 0;
    let otrasCiudadesCount = 0;
    let erroresCount = 0;

    for (let i = 0; i < urlsToCheck.length; i++) {
        const url = urlsToCheck[i];
        const propertyIdMatch = url.match(/-(\d+)\.html/);
        const propertyId = propertyIdMatch ? propertyIdMatch[1] : 'UNKNOWN';

        console.log(`\n[${ i + 1}/${urlsToCheck.length}] ID: ${propertyId}`);
        console.log(`URL: ${url.substring(0, 80)}...`);

        try {
            // Ejecutar scraper en modo "dry-run" solo para extraer metadatos
            // Usamos --auto-confirm para bypasear prompt de ciudad
            // Timeout de 180 segundos por propiedad (3 minutos)
            const command = `timeout 180 node inmuebles24culiacanscraper.js "${url}" --auto-confirm 2>&1`;

            const { stdout, stderr } = await execPromise(command, {
                maxBuffer: 10 * 1024 * 1024,
                timeout: 185000 // 185 segundos total (5s más que el timeout interno)
            });

            // Buscar la ciudad en el output del scraper
            // El scraper imprime la ciudad detectada
            const lines = stdout.split('\n');

            let ciudadDetectada = null;
            let ubicacion = null;

            // Buscar líneas con información de ciudad
            for (const line of lines) {
                // Buscar "Ciudad detectada automáticamente:" o similar
                if (line.includes('Ciudad detectada') || line.includes('📍')) {
                    ciudadDetectada = line;
                }

                // Buscar dirección/ubicación
                if (line.includes('Dirección') || line.includes('Ubicación') || line.includes('📍')) {
                    ubicacion = line;
                }

                // Si encontramos "Culiacán" en cualquier línea relevante
                if (line.toLowerCase().includes('culiacán') || line.toLowerCase().includes('culiacan')) {
                    if (!ciudadDetectada) ciudadDetectada = line;
                }

                // Otras ciudades comunes
                if (line.toLowerCase().includes('mazatlán') || line.toLowerCase().includes('mazatlan')) {
                    if (!ciudadDetectada) ciudadDetectada = line;
                }
                if (line.toLowerCase().includes('monterrey')) {
                    if (!ciudadDetectada) ciudadDetectada = line;
                }
            }

            // Determinar si es Culiacán basándose en el output completo
            const outputLower = stdout.toLowerCase();
            const esCuliacan = outputLower.includes('culiacán') || outputLower.includes('culiacan');

            // Extraer ciudad específica
            let ciudad = 'No detectada';
            if (outputLower.includes('culiacán') || outputLower.includes('culiacan')) {
                ciudad = 'Culiacán, Sinaloa';
                culiacanCount++;
            } else if (outputLower.includes('mazatlán') || outputLower.includes('mazatlan')) {
                ciudad = 'Mazatlán, Sinaloa';
                otrasCiudadesCount++;
            } else if (outputLower.includes('monterrey')) {
                ciudad = 'Monterrey, Nuevo León';
                otrasCiudadesCount++;
            } else {
                // Intentar extraer de la ubicación
                if (ubicacion) {
                    ciudad = ubicacion.replace(/📍|Ubicación:|Dirección:/gi, '').trim();
                }
                otrasCiudadesCount++;
            }

            console.log(`   ${esCuliacan ? '✅' : '⚠️'} ${ciudad}`);

            results.push({
                num: i + 1,
                propertyId,
                url,
                ciudad,
                esCuliacan: esCuliacan ? '✅ SÍ' : '⚠️ NO',
                ubicacionCompleta: ubicacion || ciudadDetectada || 'No detectada'
            });

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            erroresCount++;

            results.push({
                num: i + 1,
                propertyId,
                url,
                ciudad: 'ERROR',
                esCuliacan: '❌ ERROR',
                ubicacionCompleta: error.message
            });
        }

        // Delay de 2 segundos entre propiedades para no sobrecargar
        if (i < urls.length - 1) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // Generar reporte final
    console.log('\n' + '═'.repeat(100));
    console.log('📊 REPORTE FINAL\n');

    console.log('═'.repeat(100));
    console.log('NUM | ID         | CIUDAD                        | CULIACÁN? | UBICACIÓN COMPLETA');
    console.log('═'.repeat(100));

    results.forEach(r => {
        const idShort = r.propertyId.substring(0, 10).padEnd(10);
        const ciudadShort = r.ciudad.substring(0, 29).padEnd(29);
        const ubicacionShort = r.ubicacionCompleta.substring(0, 50);
        console.log(`${String(r.num).padStart(3)} | ${idShort} | ${ciudadShort} | ${r.esCuliacan.padEnd(9)} | ${ubicacionShort}`);
    });

    console.log('═'.repeat(100));
    console.log(`\n📈 RESUMEN:`);
    console.log(`   ✅ Propiedades en CULIACÁN: ${culiacanCount}`);
    console.log(`   ⚠️  Propiedades en OTRAS CIUDADES: ${otrasCiudadesCount}`);
    console.log(`   ❌ Errores: ${erroresCount}`);
    console.log(`   📊 Total verificadas: ${results.length}`);

    // Guardar JSON con resultados completos
    fs.writeFileSync('/tmp/verificacion-ciudades-scraper.json', JSON.stringify(results, null, 2));
    console.log(`\n💾 Reporte completo guardado en: /tmp/verificacion-ciudades-scraper.json`);

    // Listar propiedades que NO son de Culiacán
    const noculiacan = results.filter(r => r.esCuliacan === '⚠️ NO');
    if (noculiacan.length > 0) {
        console.log(`\n⚠️  PROPIEDADES QUE NO SON DE CULIACÁN (${noculiacan.length}):\n`);
        noculiacan.forEach(r => {
            console.log(`   ${r.num}. ID ${r.propertyId} - ${r.ciudad}`);
            console.log(`      ${r.url}`);
            console.log(`      ${r.ubicacionCompleta}\n`);
        });
    }

    console.log('═'.repeat(100));

})().catch(e => {
    console.error('❌ Error fatal:', e.message);
    process.exit(1);
});
