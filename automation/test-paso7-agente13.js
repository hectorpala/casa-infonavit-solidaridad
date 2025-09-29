#!/usr/bin/env node

/**
 * TEST PASO 7 - AGENTE #13 PUBLICADOR
 * SPEC: props-v3.3 - Casos feliz (con token) y NO-GO (sin token)
 */

const PipelineAgentes = require('./pipeline-agentes.js');
const fs = require('fs');
const path = require('path');

// Brief válido para pruebas
const briefPublicador = {
    tipo: 'renta',
    nombre: 'Casa Test Publicador',
    ubicacion: 'Publicador Valley, Culiacán',
    precio_visible: '$10,500/mes',
    descripcion: 'Casa de prueba para publicador con autorización',
    recamaras: 3,
    banos: 2,
    whatsapp_e164: '+528111652545',
    mensaje_wa: 'Hola, me interesa Casa Test Publicador por $10,500 mensual',
    fotos_origen: '/test/path'
};

/**
 * Preparar ambiente completo para Agente #13
 */
function prepararAmbientePublicador() {
    const nombreSlug = briefPublicador.nombre.toLowerCase()
        .replace(/casa\s+(renta|venta)\s*/i, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 30);
    
    const rutaImagenes = path.join(__dirname, '..', `images/${nombreSlug}/`);
    
    // Crear directorio de imágenes
    if (!fs.existsSync(rutaImagenes)) {
        fs.mkdirSync(rutaImagenes, { recursive: true });
    }
    
    // Crear 7 imágenes de prueba
    for (let i = 1; i <= 7; i++) {
        const nombreImg = `pub-foto-${String(i).padStart(2, '0')}.jpg`;
        const rutaImg = path.join(rutaImagenes, nombreImg);
        fs.writeFileSync(rutaImg, 'fake-pub-image-data');
    }
    
    // Crear cover.jpg OBLIGATORIO
    fs.writeFileSync(path.join(rutaImagenes, 'cover.jpg'), 'fake-cover-data');
    
    // Crear archivos HTML básicos si no existen
    const rutaHome = path.join(__dirname, '..', 'index.html');
    if (!fs.existsSync(rutaHome)) {
        fs.writeFileSync(rutaHome, `<!DOCTYPE html>
<html>
<head><title>Home Test Publicador</title></head>
<body>
    <div class="grid-properties">
    </div>
</body>
</html>`);
    }
    
    const rutaCuliacan = path.join(__dirname, '..', 'culiacan', 'index.html');
    const dirCuliacan = path.join(__dirname, '..', 'culiacan');
    if (!fs.existsSync(dirCuliacan)) {
        fs.mkdirSync(dirCuliacan, { recursive: true });
    }
    if (!fs.existsSync(rutaCuliacan)) {
        fs.writeFileSync(rutaCuliacan, `<!DOCTYPE html>
<html>
<head><title>Culiacán Test Publicador</title></head>
<body>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    </div>
</body>
</html>`);
    }
    
    console.log(`✅ Ambiente publicador preparado: 7 fotos + cover.jpg en ${nombreSlug}`);
    return nombreSlug;
}

/**
 * Limpiar archivos de prueba del publicador
 */
function limpiarAmbientePublicador(slug) {
    const archivosALimpiar = [
        `casa-renta-${slug}.html`,
        `images/${slug}/`
    ];
    
    for (const archivo of archivosALimpiar) {
        const rutaCompleta = path.join(__dirname, '..', archivo);
        if (fs.existsSync(rutaCompleta)) {
            if (fs.statSync(rutaCompleta).isDirectory()) {
                fs.rmSync(rutaCompleta, { recursive: true, force: true });
            } else {
                fs.unlinkSync(rutaCompleta);
            }
        }
    }
    
    // Limpiar archivos HTML de prueba creados
    const archivosPrueba = [
        'index.html',
        'culiacan/index.html',
        'culiacan/'
    ];
    
    for (const archivo of archivosPrueba) {
        const rutaCompleta = path.join(__dirname, '..', archivo);
        if (fs.existsSync(rutaCompleta) && 
            (archivo.includes('Test') || 
             (fs.statSync(rutaCompleta).isFile() && 
              fs.readFileSync(rutaCompleta, 'utf8').includes('Test')))) {
            if (fs.statSync(rutaCompleta).isDirectory()) {
                fs.rmSync(rutaCompleta, { recursive: true, force: true });
            } else {
                fs.unlinkSync(rutaCompleta);
            }
        }
    }
    
    console.log(`🧹 Ambiente publicador limpiado`);
}

/**
 * CASO FELIZ: Con token "OK_TO_APPLY=true"
 */
async function casoFelizConToken() {
    console.log('✅ CASO FELIZ: Con token "OK_TO_APPLY=true"');
    console.log('═'.repeat(70));
    
    const slug = prepararAmbientePublicador();
    
    try {
        const pipeline = new PipelineAgentes();
        
        // Simular estado previo exitoso (#2, #3)
        pipeline.registrarMetricas(2, { photos_found: 7, validas: 7, descartadas: 0 });
        pipeline.registrarMetricas(3, { photos_found: 7, N: 7, optimizadas: 7 });
        
        console.log('\\n🔄 Ejecutando Pipeline Completo #6-#12...\\n');
        
        // Ejecutar pipeline completo #6-#12
        await pipeline.agente6_generadorGoldenSource(briefPublicador);
        await pipeline.agente7_carouselDoctor(briefPublicador);
        await pipeline.agente8_integradorDoble(briefPublicador);
        await pipeline.agente9_whatsappLink(briefPublicador);
        await pipeline.agente10_seoSchema(briefPublicador);
        await pipeline.agente11_compositorDiffs(briefPublicador);
        const resultado12 = await pipeline.agente12_guardiaPrePublicacion(briefPublicador);
        
        console.log(`\\n🛡️ Agente #12 resultado: ${resultado12 ? 'OK' : 'FAIL'}`);
        
        if (!resultado12) {
            console.log('❌ PREREQ FALLO: #12 no pasó, #13 debería ser NO-GO');
        }
        
        // EJECUTAR AGENTE #13 CON TOKEN
        console.log('\\n🚀 Ejecutando Agente #13 con token autorizado...');
        const resultado13 = await pipeline.agente13_publicador(briefPublicador, "OK_TO_APPLY=true");
        
        console.log(`\\n🚦 Agente #13: ${resultado13 ? 'EXITO' : 'FALLO'}`);
        
        // Generar reporte final
        const reporte = pipeline.generarReporteTurno();
        console.log('\\n📊 REPORTE FINAL (una línea):');
        console.log(reporte.reporteFases);
        
        const exito = resultado13 && reporte.reporteFases.includes('#13 OK');
        console.log(`\\n📋 CASO FELIZ: ${exito ? '✅ SUCCESS' : '❌ FAIL'}`);
        
        return {
            exito: exito,
            resultado13: resultado13,
            reporte: reporte.reporteFases
        };
        
    } catch (error) {
        console.error('💥 ERROR EN CASO FELIZ:', error.message);
        return { exito: false, error: error.message };
    } finally {
        limpiarAmbientePublicador(slug);
    }
}

/**
 * CASO NO-GO: Sin token de autorización
 */
async function casoNoGoSinToken() {
    console.log('❌ CASO NO-GO: Sin token de autorización');
    console.log('═'.repeat(70));
    
    const slug = prepararAmbientePublicador();
    
    try {
        const pipeline = new PipelineAgentes();
        
        // Simular estado previo exitoso (#2, #3)
        pipeline.registrarMetricas(2, { photos_found: 7, validas: 7, descartadas: 0 });
        pipeline.registrarMetricas(3, { photos_found: 7, N: 7, optimizadas: 7 });
        
        console.log('\\n🔄 Ejecutando Pipeline Completo #6-#12...\\n');
        
        // Ejecutar pipeline completo #6-#12
        await pipeline.agente6_generadorGoldenSource(briefPublicador);
        await pipeline.agente7_carouselDoctor(briefPublicador);
        await pipeline.agente8_integradorDoble(briefPublicador);
        await pipeline.agente9_whatsappLink(briefPublicador);
        await pipeline.agente10_seoSchema(briefPublicador);
        await pipeline.agente11_compositorDiffs(briefPublicador);
        const resultado12 = await pipeline.agente12_guardiaPrePublicacion(briefPublicador);
        
        console.log(`\\n🛡️ Agente #12 resultado: ${resultado12 ? 'OK' : 'FAIL'}`);
        
        // EJECUTAR AGENTE #13 SIN TOKEN
        console.log('\\n🚀 Ejecutando Agente #13 SIN token autorizado...');
        const resultado13 = await pipeline.agente13_publicador(briefPublicador, ""); // Sin token
        
        console.log(`\\n🚦 Agente #13: ${resultado13 ? 'INESPERADO' : 'NO-GO (ESPERADO)'}`);
        
        // Generar reporte final
        const reporte = pipeline.generarReporteTurno();
        console.log('\\n📊 REPORTE FINAL (una línea):');
        console.log(reporte.reporteFases);
        
        const exito = !resultado13 && (reporte.reporteFases.includes('#13 FAIL') || reporte.reporteFases.includes('#13 PEND'));
        console.log(`\\n📋 CASO NO-GO: ${exito ? '✅ NO-GO ESPERADO' : '❌ RESULTADO INESPERADO'}`);
        
        return {
            exito: exito,
            resultado13: resultado13,
            reporte: reporte.reporteFases
        };
        
    } catch (error) {
        console.error('💥 ERROR EN CASO NO-GO:', error.message);
        return { exito: false, error: error.message };
    } finally {
        limpiarAmbientePublicador(slug);
    }
}

/**
 * Ejecutar ambos casos del Paso 7
 */
async function ejecutarPaso7() {
    console.log('🧪 PRUEBAS PASO 7 - AGENTE #13 PUBLICADOR');
    console.log('═'.repeat(70));
    
    const casoFelizResult = await casoFelizConToken();
    const casoNoGoResult = await casoNoGoSinToken();
    
    console.log('\\n✅ RESUMEN PASO 7:');
    console.log(`  Caso Feliz: ${casoFelizResult.exito ? '✅ SUCCESS' : '❌ FAIL'}`);
    console.log(`  Caso NO-GO: ${casoNoGoResult.exito ? '✅ SUCCESS' : '❌ FAIL'}`);
    
    console.log('\\n📊 REPORTES FINALES:');
    console.log(`  Feliz: ${casoFelizResult.reporte || 'N/A'}`);
    console.log(`  NO-GO: ${casoNoGoResult.reporte || 'N/A'}`);
    
    const implementacionCorrecta = casoFelizResult.exito && casoNoGoResult.exito;
    console.log(`\\n🎯 PASO 7: ${implementacionCorrecta ? '✅ COMPLETADO' : '❌ REQUIERE AJUSTES'}`);
    
    return {
        felizOk: casoFelizResult.exito,
        noGoOk: casoNoGoResult.exito,
        reporteFeliz: casoFelizResult.reporte,
        reporteNoGo: casoNoGoResult.reporte
    };
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarPaso7().catch(console.error);
}

module.exports = { casoFelizConToken, casoNoGoSinToken };