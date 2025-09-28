const PipelineAgentes = require('./automation/pipeline-agentes.js');
const fs = require('fs');

async function ejecutarBarrancos() {
    console.log('🚀 EJECUTANDO PIPELINE PARA CASA VENTA BARRANCOS');
    console.log('═'.repeat(60));
    
    // Cargar datos específicos de la propiedad
    const datosPropiedad = JSON.parse(fs.readFileSync('./datos-propiedad-barrancos.json', 'utf8'));
    
    console.log('📋 DATOS DE LA PROPIEDAD:');
    console.log(`   • Nombre: ${datosPropiedad.nombre}`);
    console.log(`   • Precio: ${datosPropiedad.precio}`);
    console.log(`   • Ubicación: ${datosPropiedad.ubicacion}`);
    console.log(`   • Carpeta fotos: ${datosPropiedad.carpeta_fotos}`);
    
    const pipeline = new PipelineAgentes();
    
    // Configurar datos específicos en el estado inicial
    pipeline.estado = {
        ...pipeline.estado,
        datosPropiedad: datosPropiedad,
        carpetaFotosOverride: datosPropiedad.carpeta_fotos
    };
    
    try {
        const resultado = await pipeline.ejecutarPipeline(datosPropiedad.nombre, datosPropiedad);
        
        if (resultado) {
            console.log('\n✅ PIPELINE COMPLETADO EXITOSAMENTE');
            console.log('🎯 Casa Venta Barrancos procesada correctamente');
        } else {
            console.log('\n❌ PIPELINE FALLÓ');
            console.log('🔧 Revisar logs para detalles');
        }
        
        return resultado;
    } catch (error) {
        console.error('💥 ERROR FATAL:', error);
        return false;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarBarrancos()
        .then(resultado => {
            process.exit(resultado ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 ERROR:', error);
            process.exit(1);
        });
}

module.exports = ejecutarBarrancos;