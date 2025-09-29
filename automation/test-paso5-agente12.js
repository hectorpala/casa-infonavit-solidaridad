#!/usr/bin/env node

/**
 * TEST PASO 5 - AGENTE #12 GUARDIA PRE-PUBLICACIÓN
 * SPEC: props-v3.3 - Casos feliz y forzado con pipeline completo
 */

const PipelineAgentes = require('./pipeline-agentes.js');
const fs = require('fs');
const path = require('path');

// Brief válido para pruebas
const briefFeliz = {
    tipo: 'renta',
    nombre: 'Casa Test Guardia',
    ubicacion: 'Test Valley, Culiacán',
    precio_visible: '$8,500/mes',
    descripcion: 'Casa de prueba para guardia pre-publicación',
    recamaras: 2,
    banos: 1,
    whatsapp_e164: '+528111652545',
    mensaje_wa: 'Hola, me interesa Casa Test Guardia por $8,500 mensual',
    fotos_origen: '/test/path'
};

/**
 * Preparar ambiente completo con cover.jpg
 */
function prepararAmbienteCompleto() {
    // Calcular slug como lo hace el pipeline
    const nombreSlug = briefFeliz.nombre.toLowerCase()
        .replace(/casa\s+(renta|venta)\s*/i, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 30);
    
    const rutaImagenes = path.join(__dirname, '..', `images/${nombreSlug}/`);
    
    // Crear directorio de imágenes
    if (!fs.existsSync(rutaImagenes)) {
        fs.mkdirSync(rutaImagenes, { recursive: true });
    }
    
    // Crear 6 imágenes de prueba
    for (let i = 1; i <= 6; i++) {
        const nombreImg = `test-foto-${String(i).padStart(2, '0')}.jpg`;
        const rutaImg = path.join(rutaImagenes, nombreImg);
        fs.writeFileSync(rutaImg, 'fake-image-data');
    }
    
    // Crear cover.jpg OBLIGATORIO
    fs.writeFileSync(path.join(rutaImagenes, 'cover.jpg'), 'fake-cover-data');
    
    console.log(`✅ Ambiente preparado: 6 fotos + cover.jpg en ${nombreSlug}`);
    return nombreSlug;
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
 * CASO FELIZ COMPLETO: Con cover.jpg y 6 fotos
 */
async function casoFelizCompleto() {
    console.log('✅ CASO FELIZ COMPLETO: Con cover.jpg y 6 fotos');
    console.log('═'.repeat(70));
    
    const slug = prepararAmbienteCompleto();
    
    try {
        const pipeline = new PipelineAgentes();
        
        // Simular estado previo (#2, #3 exitosos)
        pipeline.registrarMetricas(2, { photos_found: 6, validas: 6, descartadas: 0 });
        pipeline.registrarMetricas(3, { photos_found: 6, N: 6, optimizadas: 6 });
        
        console.log('\\n🔄 Ejecutando Pipeline Completo #6-#12...\\n');
        
        // Ejecutar secuencia completa
        const resultado6 = await pipeline.agente6_generadorGoldenSource(briefFeliz);
        console.log(`🏗️ Agente #6: ${resultado6 ? 'PASS' : 'FAIL'}`);
        
        const resultado7 = await pipeline.agente7_carouselDoctor(briefFeliz);
        console.log(`🎠 Agente #7: ${resultado7 ? 'PASS' : 'FAIL'}`);
        
        const resultado8 = await pipeline.agente8_integradorDoble(briefFeliz);
        console.log(`🔗 Agente #8: ${resultado8 ? 'PASS' : 'FAIL'}`);
        
        const resultado9 = await pipeline.agente9_whatsappLink(briefFeliz);
        console.log(`📱 Agente #9: ${resultado9 ? 'PASS' : 'FAIL'}`);
        
        const resultado10 = await pipeline.agente10_seoSchema(briefFeliz);
        console.log(`🔍 Agente #10: ${resultado10 ? 'PASS' : 'FAIL'}`);
        
        const resultado11 = await pipeline.agente11_compositorDiffs(briefFeliz);
        console.log(`📝 Agente #11: ${resultado11 ? 'PASS' : 'FAIL'}`);
        
        // EJECUTAR AGENTE #12 GUARDIA
        const resultado12 = await pipeline.agente12_guardiaPrePublicacion(briefFeliz);
        console.log(`🛡️ Agente #12: ${resultado12 ? 'PASS' : 'FAIL'}`);
        
        // Generar reporte final
        const reporte = pipeline.generarReporteTurno();
        console.log('\\n📊 REPORTE FINAL (una línea):');
        console.log(reporte.reporteFases);
        
        return { 
            exito: resultado12, 
            reporte: reporte.reporteFases,
            pipeline 
        };
        
    } catch (error) {
        console.error('💥 ERROR:', error.message);
        return { exito: false, reporte: null, error: error.message };
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
    
    // Crear ambiente sin cover.jpg
    const nombreSlug = 'test-guardia-sin-cover';
    const rutaImagenes = path.join(__dirname, '..', `images/${nombreSlug}/`);
    
    if (!fs.existsSync(rutaImagenes)) {
        fs.mkdirSync(rutaImagenes, { recursive: true });
    }
    
    // Solo 6 fotos, SIN cover.jpg
    for (let i = 1; i <= 6; i++) {
        const nombreImg = `test-foto-${String(i).padStart(2, '0')}.jpg`;
        fs.writeFileSync(path.join(rutaImagenes, nombreImg), 'fake-image-data');
    }
    
    console.log(`✅ Ambiente preparado: 6 fotos SIN cover.jpg`);
    
    try {
        const pipeline = new PipelineAgentes();
        
        // Simular estado previo
        pipeline.registrarMetricas(2, { photos_found: 6, validas: 6, descartadas: 0 });
        pipeline.registrarMetricas(3, { photos_found: 6, N: 6, optimizadas: 6 });
        
        console.log('\\n🔄 Ejecutando Pipeline Completo #6-#12...\\n');
        
        // Brief modificado para usar slug específico
        const briefSinCover = { ...briefFeliz, nombre: 'Casa Test Guardia Sin Cover' };
        
        // Ejecutar secuencia #6-#11
        await pipeline.agente6_generadorGoldenSource(briefSinCover);
        await pipeline.agente7_carouselDoctor(briefSinCover);
        await pipeline.agente8_integradorDoble(briefSinCover);
        await pipeline.agente9_whatsappLink(briefSinCover);
        await pipeline.agente10_seoSchema(briefSinCover);
        await pipeline.agente11_compositorDiffs(briefSinCover);
        
        // EJECUTAR AGENTE #12 (debe fallar)
        const resultado12 = await pipeline.agente12_guardiaPrePublicacion(briefSinCover);
        console.log(`🛡️ Agente #12: ${resultado12 ? 'PASS (INESPERADO)' : 'FAIL (ESPERADO)'}`);
        
        // Generar reporte final
        const reporte = pipeline.generarReporteTurno();
        console.log('\\n📊 REPORTE FINAL (una línea):');
        console.log(reporte.reporteFases);
        
        return { 
            exito: !resultado12, // Éxito si falla como esperado
            reporte: reporte.reporteFases 
        };
        
    } catch (error) {
        console.error('💥 ERROR:', error.message);
        return { exito: false, reporte: null, error: error.message };
    } finally {
        limpiarAmbiente(nombreSlug);
    }
}

/**
 * Ejecutar ambos casos del Paso 5
 */
async function ejecutarPaso5() {
    console.log('🧪 PRUEBAS PASO 5 - AGENTE #12 GUARDIA PRE-PUBLICACIÓN');
    console.log('═'.repeat(70));
    
    const casoFelizResult = await casoFelizCompleto();
    const casoForzadoResult = await casoForzadoSinCover();
    
    console.log('\\n✅ RESUMEN PASO 5:');
    console.log(`  Caso Feliz: ${casoFelizResult.exito ? '✅ SUCCESS' : '❌ FAIL'}`);
    console.log(`  Caso Forzado: ${casoForzadoResult.exito ? '✅ SUCCESS' : '❌ FAIL'}`);
    
    console.log('\\n📊 REPORTES FINALES:');
    console.log(`  Feliz: ${casoFelizResult.reporte || 'N/A'}`);
    console.log(`  Forzado: ${casoForzadoResult.reporte || 'N/A'}`);
    
    const implementacionCorrecta = casoFelizResult.exito && casoForzadoResult.exito;
    console.log(`\\n🎯 PASO 5: ${implementacionCorrecta ? '✅ COMPLETADO' : '❌ REQUIERE AJUSTES'}`);
    
    return {
        felizOk: casoFelizResult.exito,
        forzadoOk: casoForzadoResult.exito,
        reporteFeliz: casoFelizResult.reporte,
        reporteForzado: casoForzadoResult.reporte
    };
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarPaso5().catch(console.error);
}

module.exports = { casoFelizCompleto, casoForzadoSinCover };