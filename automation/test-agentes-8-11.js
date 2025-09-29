#!/usr/bin/env node

/**
 * TEST AGENTES #8-#11 - SPEC props-v3.3
 * Pruebas de criterios de aceptación con casos feliz y fallido
 */

const PipelineAgentes = require('./pipeline-agentes.js');

// Brief válido para pruebas
const briefValido = {
    tipo: 'renta',
    nombre: 'Casa Test Valle Alto',
    ubicacion: 'Valle Alto, Culiacán',
    precio_visible: '$8,500/mes',
    descripcion: 'Casa en renta ideal para familia pequeña',
    recamaras: 2,
    banos: 1,
    whatsapp_e164: '+528111652545',
    mensaje_wa: 'Hola, me interesa Casa Test Valle Alto por $8,500 mensual',
    fotos_origen: '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/casa ejemplo'
};

/**
 * CASO FELIZ: Brief válido + 9 fotos + Valle Alto integrado
 */
async function casoFeliz() {
    console.log('✅ CASO FELIZ: Brief válido + 9 fotos + Valle Alto integrado');
    console.log('═'.repeat(70));
    
    const pipeline = new PipelineAgentes();
    
    // Simular estado previo (fases #2, #3 exitosas)
    pipeline.estado.slug = 'valle-alto-oaxaca'; // Usar Valle Alto existente
    pipeline.estado.tipo = 'renta';
    
    // Métricas previas
    pipeline.registrarMetricas(2, { photos_found: 9, validas: 9, descartadas: 0 });
    pipeline.registrarMetricas(3, { photos_found: 9, N: 9, optimizadas: 9 });
    
    try {
        // Ejecutar agentes #8-#11
        console.log('\n🔄 Ejecutando Agentes #8-#11...\n');
        
        const resultado8 = await pipeline.agente8_integradorDoble(briefValido);
        const resultado9 = await pipeline.agente9_whatsappLink(briefValido);
        const resultado10 = await pipeline.agente10_seoSchema(briefValido);
        const resultado11 = await pipeline.agente11_compositorDiffs(briefValido);
        
        // Generar reporte final
        const reporte = pipeline.generarReporteTurno();
        console.log('\n📊 REPORTE FINAL (una línea):');
        console.log(reporte.reporteFases);
        console.log('');
        console.log('📋 RESULTADO CASO FELIZ:', resultado8 && resultado9 && resultado10 && resultado11 ? '✅ SUCCESS' : '❌ FAIL');
        
    } catch (error) {
        console.error('💥 ERROR:', error.message);
    }
    
    console.log('═'.repeat(70));
}

/**
 * CASO FALLIDO: Sin tarjeta Culiacán (debe fallar en #8)
 */
async function casoFallido() {
    console.log('❌ CASO FALLIDO: Sin tarjeta Culiacán (debe fallar en #8)');
    console.log('═'.repeat(70));
    
    const pipeline = new PipelineAgentes();
    
    // Simular slug que NO existe en Culiacán
    pipeline.estado.slug = 'propiedad-inexistente-test';
    pipeline.estado.tipo = 'renta';
    
    // Brief con teléfono no E.164 para forzar falla en #9 también
    const briefFallido = {
        ...briefValido,
        whatsapp_e164: '528111652545', // Sin + (no E.164)
    };
    
    // Métricas previas
    pipeline.registrarMetricas(2, { photos_found: 9, validas: 9, descartadas: 0 });
    pipeline.registrarMetricas(3, { photos_found: 9, N: 9, optimizadas: 9 });
    
    try {
        // Ejecutar agentes #8-#11
        console.log('\n🔄 Ejecutando Agentes #8-#11 (esperando fallas)...\n');
        
        const resultado8 = await pipeline.agente8_integradorDoble(briefFallido);
        console.log(`🔍 Agente #8 resultado: ${resultado8 ? 'PASS' : 'FAIL (esperado)'}`);
        
        const resultado9 = await pipeline.agente9_whatsappLink(briefFallido);
        console.log(`🔍 Agente #9 resultado: ${resultado9 ? 'PASS' : 'FAIL (esperado)'}`);
        
        // Continuar con #10 y #11 aunque fallen los anteriores
        try {
            const resultado10 = await pipeline.agente10_seoSchema(briefFallido);
            console.log(`🔍 Agente #10 resultado: ${resultado10 ? 'PASS' : 'FAIL'}`);
        } catch (e) {
            console.log(`🔍 Agente #10 resultado: ERROR (${e.message})`);
        }
        
        const resultado11 = await pipeline.agente11_compositorDiffs(briefFallido);
        console.log(`🔍 Agente #11 resultado: ${resultado11 ? 'PASS' : 'FAIL'}`);
        
        // Generar reporte final
        const reporte = pipeline.generarReporteTurno();
        console.log('\n📊 REPORTE FINAL (una línea):');
        console.log(reporte.reporteFases);
        console.log('');
        console.log('📋 RESULTADO CASO FALLIDO:', !resultado8 || !resultado9 ? '✅ FAIL ESPERADO' : '❌ UNEXPECTED PASS');
        
    } catch (error) {
        console.error('💥 ERROR:', error.message);
    }
    
    console.log('═'.repeat(70));
}

/**
 * CASO E.164 FALLIDO: Teléfono inválido
 */
async function casoE164Fallido() {
    console.log('❌ CASO E.164 FALLIDO: Teléfono inválido');
    console.log('═'.repeat(70));
    
    const pipeline = new PipelineAgentes();
    pipeline.estado.slug = 'valle-alto-oaxaca';
    pipeline.estado.tipo = 'renta';
    
    const briefE164Malo = {
        ...briefValido,
        whatsapp_e164: '5281116525451234567890', // Demasiado largo (>15 dígitos)
    };
    
    try {
        const resultado9 = await pipeline.agente9_whatsappLink(briefE164Malo);
        console.log('📊 Métricas #9:', pipeline.estado.orquestador.fases.fase9?.metricas);
        console.log('📋 phone_e164_ok debe ser 0:', resultado9 ? '❌ UNEXPECTED PASS' : '✅ FAIL ESPERADO');
    } catch (error) {
        console.error('💥 ERROR:', error.message);
    }
    
    console.log('═'.repeat(70));
}

/**
 * Ejecutar todas las pruebas
 */
async function ejecutarPruebas() {
    console.log('🧪 PRUEBAS AGENTES #8-#11 - SPEC props-v3.3');
    console.log('Validaciones reales: integración, E.164, SEO, CORE único');
    console.log('═'.repeat(70));
    
    await casoFeliz();
    await casoFallido();
    await casoE164Fallido();
    
    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarPruebas().catch(console.error);
}

module.exports = { casoFeliz, casoFallido, casoE164Fallido };