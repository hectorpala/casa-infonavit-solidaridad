#!/usr/bin/env node

/**
 * TEST PASO 3 - HAPPY PATH AGENTES #6-#11
 * Verificar que el flujo completo funciona con bloques reales
 */

const PipelineAgentes = require('./pipeline-agentes.js');
const fs = require('fs');
const path = require('path');

// Brief válido para happy path
const briefHappyPath = {
    tipo: 'renta',
    nombre: 'Casa Test Golden Source',
    ubicacion: 'Test Valley, Culiacán',
    precio_visible: '$9,500/mes',
    descripcion: 'Casa de prueba para validar pipeline completo',
    recamaras: 3,
    banos: 2,
    whatsapp_e164: '+528111652545',
    mensaje_wa: 'Hola, me interesa Casa Test Golden Source por $9,500 mensual',
    fotos_origen: '/test/path'
};

/**
 * Preparar ambiente de prueba
 */
function prepararAmbiente() {
    const slug = 'casa-test-golden-source';
    const rutaImagenes = `images/${slug}/`;
    
    // Crear directorio de imágenes simuladas
    if (!fs.existsSync(rutaImagenes)) {
        fs.mkdirSync(rutaImagenes, { recursive: true });
    }
    
    // Crear 6 imágenes de prueba
    for (let i = 1; i <= 6; i++) {
        const nombreImg = `test-foto-${String(i).padStart(2, '0')}.jpg`;
        const rutaImg = path.join(rutaImagenes, nombreImg);
        if (!fs.existsSync(rutaImg)) {
            fs.writeFileSync(rutaImg, 'fake-image-data');
        }
    }
    
    console.log(`✅ Ambiente preparado: ${rutaImagenes} con 6 imágenes`);
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
        if (fs.existsSync(archivo)) {
            if (fs.statSync(archivo).isDirectory()) {
                fs.rmSync(archivo, { recursive: true, force: true });
            } else {
                fs.unlinkSync(archivo);
            }
        }
    }
    
    console.log(`🧹 Ambiente limpiado`);
}

/**
 * CASO HAPPY PATH: Ejecutar pipeline completo #6-#11
 */
async function happyPathCompleto() {
    console.log('✅ HAPPY PATH COMPLETO: Agentes #6-#11');
    console.log('═'.repeat(70));
    
    const slug = prepararAmbiente();
    
    try {
        const pipeline = new PipelineAgentes();
        
        // Simular estado previo (#2, #3 exitosos)
        pipeline.registrarMetricas(2, { photos_found: 6, validas: 6, descartadas: 0 });
        pipeline.registrarMetricas(3, { photos_found: 6, N: 6, optimizadas: 6 });
        
        console.log('\n🔄 Ejecutando Agentes #6-#11...\n');
        
        // Ejecutar secuencia completa
        const resultado6 = await pipeline.agente6_generadorGoldenSource(briefHappyPath);
        console.log(`🏗️ Agente #6: ${resultado6 ? 'PASS' : 'FAIL'}`);
        
        const resultado7 = await pipeline.agente7_carouselDoctor(briefHappyPath);
        console.log(`🎠 Agente #7: ${resultado7 ? 'PASS' : 'FAIL'}`);
        
        const resultado8 = await pipeline.agente8_integradorDoble(briefHappyPath);
        console.log(`🔗 Agente #8: ${resultado8 ? 'PASS' : 'FAIL'}`);
        
        const resultado9 = await pipeline.agente9_whatsappLink(briefHappyPath);
        console.log(`📱 Agente #9: ${resultado9 ? 'PASS' : 'FAIL'}`);
        
        const resultado10 = await pipeline.agente10_seoSchema(briefHappyPath);
        console.log(`🔍 Agente #10: ${resultado10 ? 'PASS' : 'FAIL'}`);
        
        const resultado11 = await pipeline.agente11_compositorDiffs(briefHappyPath);
        console.log(`📝 Agente #11: ${resultado11 ? 'PASS' : 'FAIL'}`);
        
        // Generar reporte final esperado
        const reporte = pipeline.generarReporteTurno();
        console.log('\n📊 REPORTE FINAL ESPERADO:');
        console.log(reporte.reporteFases);
        
        // Verificar criterios específicos de Paso 3
        console.log('\n🎯 VERIFICACIÓN CRITERIOS PASO 3:');
        
        const metricas6 = pipeline.estado.orquestador.fases.fase6?.metricas;
        const metricas7 = pipeline.estado.orquestador.fases.fase7?.metricas;
        const metricas8 = pipeline.estado.orquestador.fases.fase8?.metricas;
        const metricas10 = pipeline.estado.orquestador.fases.fase10?.metricas;
        const metricas11 = pipeline.estado.orquestador.fases.fase11?.metricas;
        
        console.log(`  📋 #6 placeholders_ok: ${metricas6?.placeholders_ok} (req: 1)`);
        console.log(`  🎠 #7 slides: ${metricas7?.slides} (req: ≥6), core: ${metricas7?.core_unico} (req: 1)`);
        console.log(`  🏠 #8 cards_home: ${metricas8?.cards_home} (req: 1), cards_culiacan: ${metricas8?.cards_culiacan} (req: 1)`);
        console.log(`  📊 #10 jsonld: ${metricas10?.json_ld_valido} (req: 1)`);
        console.log(`  📁 #11 files: ${metricas11?.archivos_impactados} (req: ≥3), core: ${metricas11?.core_unico} (req: 1)`);
        
        // Resultado final
        const todosOk = resultado6 && resultado7 && resultado8 && resultado9 && resultado10 && resultado11;
        console.log(`\n📋 RESULTADO HAPPY PATH: ${todosOk ? '✅ SUCCESS' : '❌ FAIL'}`);
        
        // Verificar archivos creados
        console.log('\n📄 ARCHIVOS CREADOS:');
        console.log(`  📄 Página: ${fs.existsSync(`casa-renta-${slug}.html`) ? '✅' : '❌'}`);
        console.log(`  🏠 Home integrado: ${metricas8?.cards_home === 1 ? '✅' : '❌'}`);
        console.log(`  🎯 Culiacán integrado: ${metricas8?.cards_culiacan === 1 ? '✅' : '❌'}`);
        
        return todosOk;
        
    } catch (error) {
        console.error('💥 ERROR:', error.message);
        return false;
    } finally {
        limpiarAmbiente(slug);
    }
}

/**
 * Test específico de #6 con validación de bloques
 */
async function test6GeneradorBloques() {
    console.log('🏗️ TEST ESPECÍFICO: Agente #6 Generador de Bloques');
    console.log('═'.repeat(70));
    
    const slug = prepararAmbiente();
    
    try {
        const pipeline = new PipelineAgentes();
        
        const resultado = await pipeline.agente6_generadorGoldenSource(briefHappyPath);
        
        console.log('📊 VALIDACIÓN BLOQUES GENERADOS:');
        const bloques = pipeline.estado.bloques;
        
        console.log(`  📄 Página: ${bloques?.pagina?.length || 0} chars`);
        console.log(`  🏠 Home: ${bloques?.home?.length || 0} chars`);
        console.log(`  🎯 Culiacán: ${bloques?.culiacan?.length || 0} chars`);
        
        // Validar contenido de bloques
        const validaciones = {
            pagina_tiene_html: bloques?.pagina?.includes('<!DOCTYPE html>'),
            pagina_tiene_jsonld: bloques?.pagina?.includes('@type": "RealEstateListing"'),
            home_tiene_slug: bloques?.home?.includes('data-slug='),
            culiacan_tiene_carrusel: bloques?.culiacan?.includes('carousel-container'),
            culiacan_tiene_6_imgs: (bloques?.culiacan?.match(/carousel-image/g) || []).length >= 6
        };
        
        console.log('🔍 VALIDACIONES CONTENIDO:');
        for (const [key, value] of Object.entries(validaciones)) {
            console.log(`  ${key}: ${value ? '✅' : '❌'}`);
        }
        
        return resultado && Object.values(validaciones).every(v => v);
        
    } catch (error) {
        console.error('💥 ERROR:', error.message);
        return false;
    } finally {
        limpiarAmbiente(slug);
    }
}

/**
 * Ejecutar todas las pruebas
 */
async function ejecutarPruebas() {
    console.log('🧪 PRUEBAS PASO 3 - HAPPY PATH COMPLETO');
    console.log('═'.repeat(70));
    
    const resultadoCompleto = await happyPathCompleto();
    const resultado6 = await test6GeneradorBloques();
    
    console.log('\n✅ RESUMEN PRUEBAS PASO 3:');
    console.log(`  Happy Path Completo: ${resultadoCompleto ? '✅ SUCCESS' : '❌ FAIL'}`);
    console.log(`  Generador Bloques #6: ${resultado6 ? '✅ SUCCESS' : '❌ FAIL'}`);
    
    const exito = resultadoCompleto && resultado6;
    console.log(`\n🎯 PASO 3: ${exito ? '✅ COMPLETADO' : '❌ REQUIERE AJUSTES'}`);
    
    return exito;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarPruebas().catch(console.error);
}

module.exports = { happyPathCompleto, test6GeneradorBloques };