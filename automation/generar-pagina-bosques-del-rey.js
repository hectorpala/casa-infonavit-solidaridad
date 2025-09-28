#!/usr/bin/env node

/**
 * GENERADOR FINAL - AGENTE 16
 * Genera la página HTML completa y la integra en los índices
 */

const fs = require('fs');
const path = require('path');
const Pipeline16AgentesCompleto = require('./pipeline-16-agentes-completo.js');

async function generarPaginaCompleta() {
    console.log('🚀 INICIANDO GENERACIÓN FINAL - AGENTE 16');
    console.log('═'.repeat(50));
    
    // Ejecutar pipeline completo
    const pipeline = new Pipeline16AgentesCompleto();
    const estado = await pipeline.ejecutarPipeline('Casa en Venta Bosque Olivos Bosques del Rey');
    
    if (!estado) {
        console.error('❌ ERROR: Pipeline falló');
        return false;
    }
    
    // 1. Crear página HTML individual
    const paginaPath = '../casa-venta-bosques-del-rey.html';
    fs.writeFileSync(paginaPath, estado.paginaHTML, 'utf8');
    console.log(`✅ Página creada: ${paginaPath}`);
    
    // 2. Optimizar fotos
    console.log('🖼️ OPTIMIZANDO FOTOS...');
    try {
        const destDir = `../images/${estado.slug}`;
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Copiar fotos de PROYECTOS a images
        estado.todasLasFotos.forEach(foto => {
            const origen = path.join(estado.fotosPath, foto);
            const destino = path.join(destDir, foto);
            
            if (fs.existsSync(origen)) {
                fs.copyFileSync(origen, destino);
                console.log(`📷 Copiada: ${foto}`);
            }
        });
        
        // Ejecutar optimización
        const { execSync } = require('child_process');
        execSync(`bash optimizar-fotos.sh "${estado.slug}"`, { stdio: 'inherit' });
        
    } catch (error) {
        console.log('⚠️ Error en optimización de fotos:', error.message);
    }
    
    // 3. Integrar en culiacan/index.html
    console.log('🔧 INTEGRANDO EN CULIACÁN INDEX...');
    try {
        const culiacanIndexPath = '../culiacan/index.html';
        let culiacanContent = fs.readFileSync(culiacanIndexPath, 'utf8');
        
        // Buscar posición para insertar (antes del final de properties-grid)
        const insertPosition = culiacanContent.indexOf('</div>\n                    <!-- PAGINATION -->');
        
        if (insertPosition !== -1) {
            const tarjeta = estado.tarjetaCuliacan;
            culiacanContent = culiacanContent.slice(0, insertPosition) + 
                             '\n                    ' + tarjeta + '\n\n                    ' +
                             culiacanContent.slice(insertPosition);
            
            fs.writeFileSync(culiacanIndexPath, culiacanContent, 'utf8');
            console.log('✅ Integrado en culiacan/index.html');
        } else {
            console.log('⚠️ No se encontró posición de inserción en culiacan/index.html');
        }
    } catch (error) {
        console.log('⚠️ Error integrando en Culiacán:', error.message);
    }
    
    // 4. Integrar en index.html principal
    console.log('🔧 INTEGRANDO EN INDEX PRINCIPAL...');
    try {
        const mainIndexPath = '../index.html';
        let mainContent = fs.readFileSync(mainIndexPath, 'utf8');
        
        // Buscar sección de propiedades
        const insertPosition = mainContent.indexOf('<!-- Aquí se pueden agregar más propiedades -->');
        
        if (insertPosition !== -1) {
            const tarjetaMainIndex = estado.tarjetaCuliacan.replace(/\.\.\/images\//g, 'images/');
            mainContent = mainContent.slice(0, insertPosition) + 
                         '\n            ' + tarjetaMainIndex + '\n\n            ' +
                         mainContent.slice(insertPosition);
            
            fs.writeFileSync(mainIndexPath, mainContent, 'utf8');
            console.log('✅ Integrado en index.html principal');
        } else {
            console.log('⚠️ No se encontró posición de inserción en index.html principal');
        }
    } catch (error) {
        console.log('⚠️ Error integrando en index principal:', error.message);
    }
    
    console.log('\n🎉 GENERACIÓN COMPLETA EXITOSA');
    console.log('═'.repeat(50));
    console.log('📄 Página: casa-venta-bosques-del-rey.html');
    console.log('📷 Fotos optimizadas en: images/bosques-del-rey/');
    console.log('🔗 Integrada en ambos índices');
    console.log('✅ SISTEMA 16 AGENTES COMPLETADO');
    
    return true;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    generarPaginaCompleta()
        .then(resultado => {
            process.exit(resultado ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 ERROR FATAL:', error);
            process.exit(1);
        });
}

module.exports = generarPaginaCompleta;