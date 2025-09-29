#!/usr/bin/env node

/**
 * PROCESAMIENTO PROPIEDAD: Casa Renta Villa Andalucía
 * SPEC: props-v3.3 - Pipeline completo #0, #6-#13 con autorización
 */

const PipelineAgentes = require('./pipeline-agentes.js');
const path = require('path');
const fs = require('fs');

/**
 * Brief estructurado para Casa Renta Villa Andalucía
 */
const briefVillaAndalucia = {
    tipo: 'renta',
    nombre: 'Casa disponible en renta en Villa Andalucía',
    ubicacion: 'Villa Andalucía, Culiacán, Sinaloa, C.P. 80130',
    precio_visible: '$12,500/mes',
    descripcion: 'Casa en renta en Villa Andalucía, colonia tranquila y residencial. Cuenta con 2.5 baños, perfecta para familia pequeña.',
    recamaras: 3,
    banos: 2.5,
    whatsapp_e164: '+528111652545',
    mensaje_wa: 'Hola, me interesa la casa en renta en Villa Andalucía por $12,500 mensual. ¿Podemos agendar una visita?',
    fotos_origen: '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/casa renta villa andalucia'
};

/**
 * Procesar propiedad completa con pipeline autorizado
 */
async function procesarVillaAndalucia() {
    console.log('🏠 PROCESANDO: Casa Renta Villa Andalucía');
    console.log('═'.repeat(70));
    console.log(`📍 Ubicación: ${briefVillaAndalucia.ubicacion}`);
    console.log(`💰 Precio: ${briefVillaAndalucia.precio_visible}`);
    console.log(`🛏️ Recámaras: ${briefVillaAndalucia.recamaras}`);
    console.log(`🚿 Baños: ${briefVillaAndalucia.banos}`);
    console.log(`📂 Fotos: ${briefVillaAndalucia.fotos_origen}`);
    console.log('═'.repeat(70));
    
    try {
        const pipeline = new PipelineAgentes();
        
        // ===== PREPARAR FOTOS ANTES DEL PIPELINE =====
        console.log('\n📸 COPIANDO FOTOS AL DIRECTORIO DESTINO...');
        
        // Calcular slug como lo hace Agent #6
        const nombreSlug = briefVillaAndalucia.nombre.toLowerCase()
            .replace(/casa\s+(renta|venta)\s*/i, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .substring(0, 30);
        
        const rutaDestino = path.join(__dirname, '..', `images/${nombreSlug}/`);
        const rutaOrigen = briefVillaAndalucia.fotos_origen;
        
        // Crear directorio destino
        if (!fs.existsSync(rutaDestino)) {
            fs.mkdirSync(rutaDestino, { recursive: true });
        }
        
        // Copiar fotos desde PROYECTOS
        if (fs.existsSync(rutaOrigen)) {
            const archivos = fs.readdirSync(rutaOrigen);
            const fotos = archivos.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
            
            console.log(`📂 Encontradas ${fotos.length} fotos en ${rutaOrigen}`);
            
            fotos.forEach((foto, index) => {
                const origenCompleto = path.join(rutaOrigen, foto);
                const destinoCompleto = path.join(rutaDestino, foto);
                fs.copyFileSync(origenCompleto, destinoCompleto);
            });
            
            // Crear cover.jpg (copia de la primera foto)
            if (fotos.length > 0) {
                const primeraFoto = path.join(rutaDestino, fotos[0]);
                const coverPath = path.join(rutaDestino, 'cover.jpg');
                fs.copyFileSync(primeraFoto, coverPath);
            }
            
            console.log(`✅ ${fotos.length} fotos copiadas a ${rutaDestino}`);
            console.log(`✅ cover.jpg creado desde ${fotos[0]}`);
        } else {
            console.log(`❌ No se encontró carpeta origen: ${rutaOrigen}`);
            return false;
        }
        
        // ===== CREAR ARCHIVOS BASE SI NO EXISTEN =====
        console.log('\n📄 VERIFICANDO ARCHIVOS BASE...');
        
        // Crear index.html si no existe
        const rutaHome = path.join(__dirname, '..', 'index.html');
        if (!fs.existsSync(rutaHome)) {
            const htmlHome = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hector es Bienes Raíces - Propiedades en Culiacán</title>
    <meta name="description" content="Encuentra las mejores propiedades en Culiacán con Hector es Bienes Raíces">
</head>
<body>
    <h1>Hector es Bienes Raíces</h1>
    <h2>Propiedades Destacadas</h2>
    
    <div class="grid-properties">
        <!-- Las propiedades se insertan aquí automáticamente -->
    </div>
</body>
</html>`;
            fs.writeFileSync(rutaHome, htmlHome);
            console.log('✅ index.html creado');
        } else {
            console.log('📄 index.html ya existe');
        }
        
        // Crear culiacan/index.html si no existe
        const dirCuliacan = path.join(__dirname, '..', 'culiacan');
        const rutaCuliacan = path.join(dirCuliacan, 'index.html');
        
        if (!fs.existsSync(dirCuliacan)) {
            fs.mkdirSync(dirCuliacan, { recursive: true });
        }
        
        if (!fs.existsSync(rutaCuliacan)) {
            const htmlCuliacan = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Propiedades en Culiacán - Hector es Bienes Raíces</title>
    <meta name="description" content="Propiedades disponibles en Culiacán, Sinaloa">
</head>
<body>
    <h1>Propiedades en Culiacán</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Las propiedades se insertan aquí automáticamente -->
    </div>
</body>
</html>`;
            fs.writeFileSync(rutaCuliacan, htmlCuliacan);
            console.log('✅ culiacan/index.html creado');
        } else {
            console.log('📄 culiacan/index.html ya existe');
        }
        
        // ===== PIPELINE COMPLETO CON BRIEF VALIDATION (AGENTE #0) =====
        console.log('\n🚀 EJECUTANDO PIPELINE COMPLETO (Agente #0 + #6-#13)...\n');
        console.log('🔍 AGENTE #0: Validación de brief y entrada al pipeline...');
        
        // El método ejecutarPipeline incluye la validación del brief (Agente #0)
        // y ejecuta todos los agentes #6-#12 automáticamente
        const resultadoPipeline = await pipeline.ejecutarPipeline(briefVillaAndalucia);
        
        if (!resultadoPipeline) {
            console.log('\n❌ PIPELINE #0-#12 FALLÓ: No se puede proceder a publicación');
            
            // Generar reporte de fallos
            const reporte = pipeline.generarReporteTurno();
            console.log('\n📊 REPORTE FINAL:');
            console.log(reporte.reporteFases);
            return false;
        }
        
        console.log('\n✅ PIPELINE #0-#12: Todos OK, proceder a publicación');
        
        // ===== AGENTE #13: PUBLICADOR CON AUTORIZACIÓN =====
        console.log('\n🚀 AGENTE #13: Publicador con autorización...');
        console.log('🔐 Token de autorización: OK_TO_APPLY=true');
        
        const resultado13 = await pipeline.agente13_publicador(briefVillaAndalucia, "OK_TO_APPLY=true");
        console.log(`${resultado13 ? '✅' : '❌'} Agente #13: ${resultado13 ? 'PUBLICADO' : 'FALLO'}`);
        
        // ===== REPORTE FINAL COMPLETO =====
        const reporte = pipeline.generarReporteTurno();
        console.log('\n📊 REPORTE FINAL COMPLETO:');
        console.log('═'.repeat(70));
        console.log(reporte.reporteFases);
        console.log('═'.repeat(70));
        
        const procesamientoExitoso = resultado13 && resultadoPipeline;
        
        if (procesamientoExitoso) {
            console.log('\n🎉 PROCESAMIENTO COMPLETO: Villa Andalucía PUBLICADA');
            console.log('🌐 Verificar en: https://casasenventa.info');
            console.log('📱 WhatsApp: Botón flotante configurado');
            console.log('🔍 SEO: Meta tags y schema implementados');
            console.log('📊 Carousels: Hero y galería configurados');
        } else {
            console.log('\n❌ PROCESAMIENTO FALLIDO: Revisar errores');
        }
        
        return procesamientoExitoso;
        
    } catch (error) {
        console.error('\n💥 ERROR EN PROCESAMIENTO:', error.message);
        console.error('📋 Stack:', error.stack);
        return false;
    }
}

/**
 * Función auxiliar para mostrar progreso
 */
function mostrarProgreso(paso, total, descripcion) {
    const porcentaje = Math.round((paso / total) * 100);
    const barra = '█'.repeat(Math.floor(porcentaje / 5)) + '░'.repeat(20 - Math.floor(porcentaje / 5));
    console.log(`\n[${barra}] ${porcentaje}% - ${descripcion}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
    procesarVillaAndalucia()
        .then(exito => {
            console.log(`\n🏁 RESULTADO FINAL: ${exito ? '✅ ÉXITO COMPLETO' : '❌ FALLÓ'}`);
            process.exit(exito ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 ERROR CRÍTICO:', error.message);
            process.exit(1);
        });
}

module.exports = { procesarVillaAndalucia, briefVillaAndalucia };