#!/usr/bin/env node

/**
 * EJEMPLO DE USO PIPELINE - SPEC props-v3.3
 * 
 * Depreca el uso de strings en favor de Brief estructurado.
 * Demuestra el uso correcto del pipeline alineado al SPEC.
 */

const PipelineAgentes = require('./pipeline-agentes.js');

// ===== EJEMPLO 1: USO CORRECTO CON BRIEF ESTRUCTURADO =====
async function ejemploUsoCorreto() {
    console.log('✅ EJEMPLO 1: Brief estructurado válido');
    
    const pipeline = new PipelineAgentes();
    
    const brief = {
        tipo: 'renta',
        nombre: 'Casa Ejemplo Valle Alto',
        ubicacion: 'Valle Alto, Culiacán',
        precio_visible: '$8,500/mes',
        descripcion: 'Casa en renta ideal para familia pequeña',
        recamaras: 2,
        banos: 1,
        whatsapp_e164: '+528111652545',
        mensaje_wa: 'Hola, me interesa Casa Ejemplo Valle Alto por $8,500 mensual',
        fotos_origen: '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/casa ejemplo'
    };
    
    try {
        const resultado = await pipeline.ejecutarPipeline(brief);
        console.log('🎯 RESULTADO:', resultado ? '✅ ÉXITO' : '❌ FALLÓ');
    } catch (error) {
        console.error('💥 ERROR:', error.message);
    }
    
    console.log('═'.repeat(60));
}

// ===== EJEMPLO 2: USO INCORRECTO - STRING DEPRECADO =====
async function ejemploUsoIncorrecto() {
    console.log('❌ EJEMPLO 2: String deprecado (debe fallar)');
    
    const pipeline = new PipelineAgentes();
    
    try {
        // Esto debe fallar con "Brief inválido: usa objeto estructurado"
        const resultado = await pipeline.ejecutarPipeline("Casa Renta Ejemplo: $8,500 : 2 : 1");
        console.log('⚠️ INESPERADO: String fue aceptado (BUG)');
    } catch (error) {
        console.log('✅ ESPERADO:', error.message);
    }
    
    console.log('═'.repeat(60));
}

// ===== EJEMPLO 3: BRIEF INCOMPLETO =====
async function ejemploBriefIncompleto() {
    console.log('❌ EJEMPLO 3: Brief incompleto (debe fallar)');
    
    const pipeline = new PipelineAgentes();
    
    const briefIncompleto = {
        tipo: 'renta',
        nombre: 'Casa Incompleta',
        // Faltan campos requeridos: ubicacion, precio_visible, etc.
    };
    
    try {
        const resultado = await pipeline.ejecutarPipeline(briefIncompleto);
        console.log('⚠️ INESPERADO: Brief incompleto fue aceptado (BUG)');
    } catch (error) {
        console.log('✅ ESPERADO:', error.message);
    }
    
    console.log('═'.repeat(60));
}

// ===== EJEMPLO 4: SIMULACIÓN SPEC INVÁLIDO =====
async function ejemploSpecInvalido() {
    console.log('❌ EJEMPLO 4: SPEC inválido (debe fallar)');
    
    const pipeline = new PipelineAgentes();
    
    // Cambiar la versión del SPEC para simular incompatibilidad
    pipeline.specVersion = 'props-v2.0'; // Versión incorreta
    
    const brief = {
        tipo: 'renta',
        nombre: 'Casa SPEC Inválido',
        ubicacion: 'Ejemplo, Culiacán',
        precio_visible: '$7,000/mes',
        descripcion: 'Ejemplo de SPEC inválido',
        recamaras: 2,
        banos: 1,
        whatsapp_e164: '+528111652545',
        mensaje_wa: 'Mensaje de ejemplo',
        fotos_origen: '/ruta/ejemplo'
    };
    
    try {
        const resultado = await pipeline.ejecutarPipeline(brief);
        console.log('⚠️ INESPERADO: SPEC inválido fue aceptado (BUG)');
    } catch (error) {
        console.log('✅ ESPERADO:', error.message);
    }
    
    console.log('═'.repeat(60));
}

// ===== EJECUTAR TODOS LOS EJEMPLOS =====
async function ejecutarEjemplos() {
    console.log('🧪 EJEMPLOS DE USO PIPELINE - SPEC props-v3.3');
    console.log('═'.repeat(60));
    
    await ejemploUsoCorreto();
    await ejemploUsoIncorrecto();
    await ejemploBriefIncompleto();
    await ejemploSpecInvalido();
    
    console.log('✅ TODOS LOS EJEMPLOS COMPLETADOS');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarEjemplos().catch(console.error);
}

module.exports = {
    ejemploUsoCorreto,
    ejemploUsoIncorrecto,
    ejemploBriefIncompleto,
    ejemploSpecInvalido
};