#!/usr/bin/env node

/**
 * TEST AGENTE #12 - GUARDIA PRE-PUBLICACIÓN
 * SPEC: props-v3.3 - Casos feliz y forzado
 */

const PipelineAgentes = require('./pipeline-agentes.js');
const fs = require('fs');
const path = require('path');

// Brief válido para pruebas
const briefValido = {
    tipo: 'renta',
    nombre: 'Casa Test Agente 12',
    ubicacion: 'Test Valley, Culiacán',
    precio_visible: '$8,500/mes',
    descripcion: 'Casa de prueba para agente 12',
    recamaras: 2,
    banos: 1,
    whatsapp_e164: '+528111652545',
    mensaje_wa: 'Hola, me interesa Casa Test Agente 12 por $8,500 mensual',
    fotos_origen: '/test/path'
};

/**
 * Preparar ambiente completo para test
 */
function prepararAmbienteCompleto(slug, conCover = true, numFotos = 6) {
    const rutaImagenes = path.join(__dirname, '..', `images/${slug}/`);
    
    // Crear directorio de imágenes
    if (!fs.existsSync(rutaImagenes)) {
        fs.mkdirSync(rutaImagenes, { recursive: true });
    }
    
    // Crear imágenes de prueba
    for (let i = 1; i <= numFotos; i++) {
        const nombreImg = `test-foto-${String(i).padStart(2, '0')}.jpg`;
        const rutaImg = path.join(rutaImagenes, nombreImg);
        fs.writeFileSync(rutaImg, 'fake-image-data');
    }
    
    // Crear cover.jpg si se solicita
    if (conCover) {
        fs.writeFileSync(path.join(rutaImagenes, 'cover.jpg'), 'fake-cover-data');
    }
    
    console.log(`✅ Ambiente preparado: ${numFotos} fotos${conCover ? ' + cover.jpg' : ''}`);
    return slug;
}

/**
 * Limpiar archivos de prueba
 */
function limpiarAmbiente(slug) {
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
    
    console.log(`🧹 Ambiente limpiado`);
}

/**
 * CASO FELIZ: Todo configurado correctamente
 */
async function casoFeliz() {
    console.log('✅ CASO FELIZ: Configuración completa correcta');
    console.log('═'.repeat(70));
    
    // Generar el slug como lo hace el pipeline
    const nombreSlug = briefValido.nombre.toLowerCase()
        .replace(/casa\s+(renta|venta)\s*/i, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 30);
    const slug = nombreSlug; // Solo la parte del nombre, sin prefijo
    prepararAmbienteCompleto(slug, true, 6); // Con cover y 6 fotos
    
    try {
        const pipeline = new PipelineAgentes();
        
        // Simular estado previo (#2-#11 exitosos)
        pipeline.registrarMetricas(2, { photos_found: 6, validas: 6, descartadas: 0 });
        pipeline.registrarMetricas(3, { photos_found: 6, N: 6, optimizadas: 6 });
        
        console.log('\\n🔄 Ejecutando Pipeline Completo #6-#12...\\n');
        
        // Ejecutar agentes #6-#11 para preparar ambiente
        await pipeline.agente6_generadorGoldenSource(briefValido);
        await pipeline.agente7_carouselDoctor(briefValido);
        await pipeline.agente8_integradorDoble(briefValido);
        await pipeline.agente9_whatsappLink(briefValido);
        await pipeline.agente10_seoSchema(briefValido);
        await pipeline.agente11_compositorDiffs(briefValido);
        
        // Ejecutar agente #12
        const resultado12 = await pipeline.agente12_guardiaPrePublicacion(briefValido);
        console.log(`🛡️ Agente #12: ${resultado12 ? 'PASS' : 'FAIL'}`);
        
        // Generar reporte final
        const reporte = pipeline.generarReporteTurno();
        console.log('\\n📊 REPORTE FINAL (una línea):');
        console.log(reporte.reporteFases);
        
        const exito = resultado12 && reporte.reporteFases.includes('#12 OK');
        console.log(`\\n📋 CASO FELIZ: ${exito ? '✅ SUCCESS' : '❌ FAIL'}`);
        
        return { exito, reporte: reporte.reporteFases };
        
    } catch (error) {
        console.error('💥 ERROR:', error.message);
        return { exito: false, reporte: null };
    } finally {
        limpiarAmbiente(slug);
    }
}

/**
 * CASO FORZADO: Sin cover.jpg (debe fallar)
 */
async function casoForzadoSinCover() {
    console.log('❌ CASO FORZADO: Sin cover.jpg (debe fallar)');
    console.log('═'.repeat(70));
    
    const slug = 'test-agente-12-fail'; // Solo la parte del nombre
    prepararAmbienteCompleto(slug, false, 6); // Sin cover pero con 6 fotos
    
    try {
        const pipeline = new PipelineAgentes();
        
        // Simular estado previo
        pipeline.registrarMetricas(2, { photos_found: 6, validas: 6, descartadas: 0 });
        pipeline.registrarMetricas(3, { photos_found: 6, N: 6, optimizadas: 6 });
        
        console.log('\\n🔄 Ejecutando Pipeline Completo #6-#12...\\n');
        
        // Ejecutar agentes #6-#11
        await pipeline.agente6_generadorGoldenSource(briefValido);
        await pipeline.agente7_carouselDoctor(briefValido);
        await pipeline.agente8_integradorDoble(briefValido);
        await pipeline.agente9_whatsappLink(briefValido);
        await pipeline.agente10_seoSchema(briefValido);
        await pipeline.agente11_compositorDiffs(briefValido);
        
        // Ejecutar agente #12 (debe fallar)
        const resultado12 = await pipeline.agente12_guardiaPrePublicacion(briefValido);
        console.log(`🛡️ Agente #12: ${resultado12 ? 'PASS (INESPERADO)' : 'FAIL (ESPERADO)'}`);
        
        // Generar reporte final
        const reporte = pipeline.generarReporteTurno();
        console.log('\\n📊 REPORTE FINAL (una línea):');
        console.log(reporte.reporteFases);
        
        const exito = !resultado12 && reporte.reporteFases.includes('#12 FAIL');
        console.log(`\\n📋 CASO FORZADO: ${exito ? '✅ FAIL ESPERADO' : '❌ RESULTADO INESPERADO'}`);
        
        return { exito, reporte: reporte.reporteFases };
        
    } catch (error) {
        console.error('💥 ERROR:', error.message);
        return { exito: false, reporte: null };
    } finally {
        limpiarAmbiente(slug);
    }
}

/**
 * CASO FORZADO: Solo 5 slides (debe fallar)
 */
async function casoForzadoSlides5() {
    console.log('❌ CASO FORZADO: Solo 5 fotos (debe fallar con slides=5)');
    console.log('═'.repeat(70));
    
    const slug = 'test-agente-12-slides'; // Solo la parte del nombre
    prepararAmbienteCompleto(slug, true, 5); // Con cover pero solo 5 fotos
    
    try {
        const pipeline = new PipelineAgentes();
        
        // Simular estado previo con solo 5 fotos
        pipeline.registrarMetricas(2, { photos_found: 5, validas: 5, descartadas: 0 });
        pipeline.registrarMetricas(3, { photos_found: 5, N: 5, optimizadas: 5 });
        
        console.log('\\n🔄 Ejecutando Pipeline Completo #6-#12...\\n');
        
        // Ejecutar agentes #6-#11
        await pipeline.agente6_generadorGoldenSource(briefValido);
        await pipeline.agente7_carouselDoctor(briefValido);
        await pipeline.agente8_integradorDoble(briefValido);
        await pipeline.agente9_whatsappLink(briefValido);
        await pipeline.agente10_seoSchema(briefValido);
        await pipeline.agente11_compositorDiffs(briefValido);
        
        // Ejecutar agente #12 (debe fallar)
        const resultado12 = await pipeline.agente12_guardiaPrePublicacion(briefValido);
        console.log(`🛡️ Agente #12: ${resultado12 ? 'PASS (INESPERADO)' : 'FAIL (ESPERADO)'}`);
        
        // Generar reporte final
        const reporte = pipeline.generarReporteTurno();
        console.log('\\n📊 REPORTE FINAL (una línea):');
        console.log(reporte.reporteFases);
        
        const tieneSlides5 = reporte.reporteFases.includes('slides=5');
        const exito = !resultado12 && reporte.reporteFases.includes('#12 FAIL') && tieneSlides5;
        console.log(`\\n📋 CASO SLIDES=5: ${exito ? '✅ FAIL CON MOTIVO NUMÉRICO' : '❌ RESULTADO INESPERADO'}`);
        
        return { exito, reporte: reporte.reporteFases };
        
    } catch (error) {
        console.error('💥 ERROR:', error.message);
        return { exito: false, reporte: null };
    } finally {
        limpiarAmbiente(slug);
    }
}

/**
 * Ejecutar todas las pruebas
 */
async function ejecutarPruebas() {
    console.log('🧪 PRUEBAS AGENTE #12 - GUARDIA PRE-PUBLICACIÓN');
    console.log('═'.repeat(70));
    
    const casoFelizResult = await casoFeliz();
    const casoSinCoverResult = await casoForzadoSinCover();
    const casoSlides5Result = await casoForzadoSlides5();
    
    console.log('\\n✅ RESUMEN PRUEBAS AGENTE #12:');
    console.log(`  Caso Feliz: ${casoFelizResult.exito ? '✅ SUCCESS' : '❌ FAIL'}`);
    console.log(`  Caso Sin Cover: ${casoSinCoverResult.exito ? '✅ SUCCESS' : '❌ FAIL'}`);
    console.log(`  Caso Slides=5: ${casoSlides5Result.exito ? '✅ SUCCESS' : '❌ FAIL'}`);
    
    console.log('\\n📊 REPORTES FINALES:');
    console.log(`  Feliz: ${casoFelizResult.reporte || 'N/A'}`);
    console.log(`  Sin Cover: ${casoSinCoverResult.reporte || 'N/A'}`);
    console.log(`  Slides=5: ${casoSlides5Result.reporte || 'N/A'}`);
    
    const todosExitosos = casoFelizResult.exito && casoSinCoverResult.exito && casoSlides5Result.exito;
    console.log(`\\n🎯 AGENTE #12: ${todosExitosos ? '✅ IMPLEMENTADO CORRECTAMENTE' : '❌ REQUIERE AJUSTES'}`);
    
    return {
        feliz: casoFelizResult.reporte,
        sinCover: casoSinCoverResult.reporte,
        slides5: casoSlides5Result.reporte
    };
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarPruebas().catch(console.error);
}

module.exports = { casoFeliz, casoForzadoSinCover, casoForzadoSlides5 };