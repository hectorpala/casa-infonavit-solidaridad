#!/usr/bin/env node

/**
 * TEST PASO 6 - HAPPY PATH COMPLETO #6-#12
 * SPEC: props-v3.3 - Verificar que todos los agentes devuelven OK
 */

const PipelineAgentes = require('./pipeline-agentes.js');
const fs = require('fs');
const path = require('path');

// Brief válido para pruebas
const briefHappyPath = {
    tipo: 'renta',
    nombre: 'Casa Test Happy Path',
    ubicacion: 'Valle Verde, Culiacán',
    precio_visible: '$9,500/mes',
    descripcion: 'Casa completa para prueba de happy path del pipeline',
    recamaras: 3,
    banos: 2,
    whatsapp_e164: '+528111652545',
    mensaje_wa: 'Hola, me interesa Casa Test Happy Path por $9,500 mensual',
    fotos_origen: '/test/path'
};

/**
 * Preparar ambiente completo para happy path
 */
function prepararAmbienteHappyPath() {
    // Calcular slug como lo hace el pipeline
    const nombreSlug = briefHappyPath.nombre.toLowerCase()
        .replace(/casa\s+(renta|venta)\s*/i, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 30);
    
    const rutaImagenes = path.join(__dirname, '..', `images/${nombreSlug}/`);
    
    // Crear directorio de imágenes
    if (!fs.existsSync(rutaImagenes)) {
        fs.mkdirSync(rutaImagenes, { recursive: true });
    }
    
    // Crear 8 imágenes de prueba (más del mínimo de 6)
    for (let i = 1; i <= 8; i++) {
        const nombreImg = `happy-foto-${String(i).padStart(2, '0')}.jpg`;
        const rutaImg = path.join(rutaImagenes, nombreImg);
        fs.writeFileSync(rutaImg, 'fake-happy-image-data');
    }
    
    // Crear cover.jpg OBLIGATORIO
    fs.writeFileSync(path.join(rutaImagenes, 'cover.jpg'), 'fake-cover-data');
    
    // Crear archivos HTML básicos si no existen
    const rutaHome = path.join(__dirname, '..', 'index.html');
    if (!fs.existsSync(rutaHome)) {
        fs.writeFileSync(rutaHome, `<!DOCTYPE html>
<html>
<head><title>Home Test</title></head>
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
<head><title>Culiacán Test</title></head>
<body>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    </div>
</body>
</html>`);
    }
    
    console.log(`✅ Ambiente happy path preparado: 8 fotos + cover.jpg en ${nombreSlug}`);
    return nombreSlug;
}

/**
 * Limpiar archivos de prueba
 */
function limpiarAmbienteHappyPath(slug) {
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
    
    console.log(`🧹 Ambiente happy path limpiado`);
}

/**
 * HAPPY PATH COMPLETO: Todos los agentes #6-#12 deben devolver OK
 */
async function happyPathCompleto() {
    console.log('🎯 HAPPY PATH COMPLETO: Agentes #6-#12 = OK');
    console.log('═'.repeat(70));
    
    const slug = prepararAmbienteHappyPath();
    
    try {
        const pipeline = new PipelineAgentes();
        
        // Simular estado previo exitoso (#2, #3)
        pipeline.registrarMetricas(2, { photos_found: 8, validas: 8, descartadas: 0 });
        pipeline.registrarMetricas(3, { photos_found: 8, N: 8, optimizadas: 8 });
        
        console.log('\\n🔄 Ejecutando Pipeline Completo #6-#12...\\n');
        
        // Array para trackear resultados
        const resultados = [];
        
        // Ejecutar secuencia completa #6-#12
        const agentes = [
            { id: 6, nombre: 'Generador Golden Source', metodo: () => pipeline.agente6_generadorGoldenSource(briefHappyPath) },
            { id: 7, nombre: 'CarouselDoctor', metodo: () => pipeline.agente7_carouselDoctor(briefHappyPath) },
            { id: 8, nombre: 'Integrador Doble', metodo: () => pipeline.agente8_integradorDoble(briefHappyPath) },
            { id: 9, nombre: 'WhatsApp Link', metodo: () => pipeline.agente9_whatsappLink(briefHappyPath) },
            { id: 10, nombre: 'SEO & Schema', metodo: () => pipeline.agente10_seoSchema(briefHappyPath) },
            { id: 11, nombre: 'Compositor Diffs', metodo: () => pipeline.agente11_compositorDiffs(briefHappyPath) },
            { id: 12, nombre: 'Guardia Pre-publicación', metodo: () => pipeline.agente12_guardiaPrePublicacion(briefHappyPath) }
        ];
        
        for (const agente of agentes) {
            console.log(`\\n🚀 Ejecutando Agente #${agente.id}: ${agente.nombre}...`);
            const resultado = await agente.metodo();
            const status = resultado ? 'OK' : 'FAIL';
            
            console.log(`${resultado ? '✅' : '❌'} Agente #${agente.id}: ${status}`);
            resultados.push({ id: agente.id, nombre: agente.nombre, ok: resultado });
            
            // Si falla, continuar para ver todos los resultados
            if (!resultado) {
                console.log(`⚠️ Agente #${agente.id} falló, continuando para diagnóstico completo...`);
            }
        }
        
        // Generar reporte final
        const reporte = pipeline.generarReporteTurno();
        console.log('\\n📊 REPORTE FINAL (una línea):');
        console.log(reporte.reporteFases);
        
        // Análisis de resultados
        const agentesOK = resultados.filter(r => r.ok).length;
        const agentesFAIL = resultados.filter(r => !r.ok);
        
        console.log('\\n🎯 ANÁLISIS HAPPY PATH:');
        console.log(`  ✅ Agentes OK: ${agentesOK}/7`);
        console.log(`  ❌ Agentes FAIL: ${agentesFAIL.length}/7`);
        
        if (agentesFAIL.length > 0) {
            console.log('\\n❌ AGENTES FALLIDOS:');
            agentesFAIL.forEach(agente => {
                console.log(`  #${agente.id}: ${agente.nombre}`);
            });
        }
        
        const happyPathExitoso = agentesOK === 7;
        console.log(`\\n🎯 PASO 6: ${happyPathExitoso ? '✅ HAPPY PATH COMPLETO' : '❌ REQUIERE CORRECCIONES'}`);
        
        return {
            exito: happyPathExitoso,
            agentesOK: agentesOK,
            agentesFAIL: agentesFAIL.length,
            reporte: reporte.reporteFases,
            resultados: resultados
        };
        
    } catch (error) {
        console.error('💥 ERROR EN HAPPY PATH:', error.message);
        return { exito: false, error: error.message };
    } finally {
        limpiarAmbienteHappyPath(slug);
    }
}

/**
 * Ejecutar test del Paso 6
 */
async function ejecutarPaso6() {
    console.log('🧪 PRUEBA PASO 6 - HAPPY PATH COMPLETO #6-#12');
    console.log('═'.repeat(70));
    
    const resultado = await happyPathCompleto();
    
    console.log('\\n✅ RESUMEN PASO 6:');
    console.log(`  Happy Path: ${resultado.exito ? '✅ SUCCESS' : '❌ FAIL'}`);
    
    if (resultado.agentesOK !== undefined) {
        console.log(`  Agentes OK: ${resultado.agentesOK}/7`);
        console.log(`  Agentes FAIL: ${resultado.agentesFAIL}/7`);
    }
    
    console.log('\\n📊 REPORTE FINAL:');
    console.log(`  ${resultado.reporte || 'N/A'}`);
    
    if (resultado.error) {
        console.log(`\\n💥 ERROR: ${resultado.error}`);
    }
    
    return resultado;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarPaso6().catch(console.error);
}

module.exports = { happyPathCompleto };