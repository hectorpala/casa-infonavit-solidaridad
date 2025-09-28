#!/usr/bin/env node

/**
 * INTEGRADOR DE TARJETA - Casa Bosques del Rey
 * Integra la tarjeta en los índices siguiendo las reglas oficiales del Agente 8
 */

const fs = require('fs');

// Tarjeta oficial generada por Agente 8
const tarjetaBosquesDelRey = `
            <!-- BEGIN CARD-ADV casa-venta-bosques-del-rey -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative" 
                 data-href="../casa-venta-bosques-del-rey.html">
                <div class="relative aspect-video">
                    <!-- PRICE BADGE OBLIGATORIO - COLOR FIJO NARANJA -->
                    <div class="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        $2,250,000
                    </div>
                    
                    <!-- CAROUSEL CONTAINER - ESTRUCTURA OBLIGATORIA -->
                    <div class="carousel-container" data-current="0">
                        <img src="../images/bosques-del-rey/1546374147.jpg" 
                             alt="Fachada Casa en Venta Bosque Olivos Bosques del Rey" 
                             loading="lazy" 
                             decoding="async"
                             class="w-full h-full object-cover carousel-image active">
                        
                        <img src="../images/bosques-del-rey/1546374155.jpg" 
                             alt="Casa en Venta Bosque Olivos Bosques del Rey - Foto 2" 
                             loading="lazy" 
                             decoding="async"
                             class="w-full h-full object-cover carousel-image hidden">
                        <img src="../images/bosques-del-rey/1546374157.jpg" 
                             alt="Casa en Venta Bosque Olivos Bosques del Rey - Foto 3" 
                             loading="lazy" 
                             decoding="async"
                             class="w-full h-full object-cover carousel-image hidden">
                        
                        <!-- Navigation arrows - FUNCIONES OBLIGATORIAS -->
                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)" aria-label="Imagen anterior">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)" aria-label="Siguiente imagen">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                
                <!-- CONTENT SECTION - ESTRUCTURA OBLIGATORIA -->
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">$2,250,000</h3>
                    <p class="text-gray-600 mb-4 font-poppins">Casa en Venta Bosque Olivos Bosques del Rey · Culiacán</p>
                    
                    <!-- PROPERTY DETAILS CON SVG ICONS - OBLIGATORIO -->
                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            </svg>
                            3 Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l3-3 3 3M5 10v11a1 1 0 001 1h3M20 10v11a1 1 0 01-1 1h-3"></path>
                            </svg>
                            2.5 Baños
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-5H8z"></path>
                            </svg>
                            Cochera
                        </div>
                    </div>
                    
                    <!-- WHATSAPP BUTTON - CLASE OBLIGATORIA -->
                    <a href="https://wa.me/528111652545?text=Hola%2C%20me%20interesa%20Casa%20en%20Venta%20Bosque%20Olivos%20Bosques%20del%20Rey%20por%20%242%2C250%2C000" 
                       class="w-full btn-primary text-center block" 
                       target="_blank" rel="noopener noreferrer">
                        <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"></path>
                        </svg>
                        Solicitar tour
                    </a>
                </div>
            </div>
            <!-- END CARD-ADV casa-venta-bosques-del-rey -->`;

function integrarEnCuliacan() {
    console.log('🔧 INTEGRANDO EN CULIACÁN INDEX...');
    
    try {
        const culiacanPath = '../culiacan/index.html';
        let content = fs.readFileSync(culiacanPath, 'utf8');
        
        // Buscar diferentes patrones de inserción
        const patrones = [
            '</div>\n                    <!-- PAGINATION -->',
            '<!-- PAGINACIÓN AQUÍ -->',
            '<!-- END PROPERTIES GRID -->',
            '</div>\n            </div>\n        </section>'
        ];
        
        let insertPosition = -1;
        let patronEncontrado = '';
        
        for (const patron of patrones) {
            insertPosition = content.indexOf(patron);
            if (insertPosition !== -1) {
                patronEncontrado = patron;
                break;
            }
        }
        
        if (insertPosition !== -1) {
            content = content.slice(0, insertPosition) + 
                     '\n                    ' + tarjetaBosquesDelRey + '\n\n                    ' +
                     content.slice(insertPosition);
            
            fs.writeFileSync(culiacanPath, content, 'utf8');
            console.log(`✅ Integrado en culiacan/index.html usando patrón: ${patronEncontrado}`);
            return true;
        } else {
            console.log('⚠️ No se encontró posición de inserción en culiacan/index.html');
            console.log('🔍 Buscando propiedades existentes...');
            
            // Buscar propiedades existentes
            const propiedadPattern = /<!-- BEGIN CARD-ADV/;
            if (propiedadPattern.test(content)) {
                const match = content.match(/(<!-- BEGIN CARD-ADV[\s\S]*?<!-- END CARD-ADV[^>]*>)/);
                if (match) {
                    const lastProperty = match[0];
                    const lastPropertyIndex = content.lastIndexOf(lastProperty);
                    const insertAfter = lastPropertyIndex + lastProperty.length;
                    
                    content = content.slice(0, insertAfter) + 
                             '\n\n                    ' + tarjetaBosquesDelRey +
                             content.slice(insertAfter);
                    
                    fs.writeFileSync(culiacanPath, content, 'utf8');
                    console.log('✅ Integrado después de la última propiedad existente');
                    return true;
                }
            }
            
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

function integrarEnIndexPrincipal() {
    console.log('🔧 INTEGRANDO EN INDEX PRINCIPAL...');
    
    try {
        const indexPath = '../index.html';
        let content = fs.readFileSync(indexPath, 'utf8');
        
        // Ajustar paths para index principal
        const tarjetaIndexPrincipal = tarjetaBosquesDelRey.replace(/\.\.\/images\//g, 'images/');
        
        const patrones = [
            '<!-- Aquí se pueden agregar más propiedades -->',
            '<!-- MORE PROPERTIES HERE -->',
            '<!-- END PROPERTIES -->'
        ];
        
        let insertPosition = -1;
        let patronEncontrado = '';
        
        for (const patron of patrones) {
            insertPosition = content.indexOf(patron);
            if (insertPosition !== -1) {
                patronEncontrado = patron;
                break;
            }
        }
        
        if (insertPosition !== -1) {
            content = content.slice(0, insertPosition) + 
                     '\n            ' + tarjetaIndexPrincipal + '\n\n            ' +
                     content.slice(insertPosition);
            
            fs.writeFileSync(indexPath, content, 'utf8');
            console.log(`✅ Integrado en index.html principal usando patrón: ${patronEncontrado}`);
            return true;
        } else {
            console.log('⚠️ No se encontró posición de inserción en index.html principal');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

// Ejecutar integraciones
console.log('🚀 INICIANDO INTEGRACIÓN DE TARJETA BOSQUES DEL REY');
console.log('═'.repeat(50));

const resultadoCuliacan = integrarEnCuliacan();
const resultadoIndex = integrarEnIndexPrincipal();

console.log('\n📊 RESUMEN DE INTEGRACIÓN:');
console.log(`🏢 Culiacán Index: ${resultadoCuliacan ? '✅ EXITOSO' : '❌ FALLÓ'}`);
console.log(`🏠 Index Principal: ${resultadoIndex ? '✅ EXITOSO' : '❌ FALLÓ'}`);

if (resultadoCuliacan && resultadoIndex) {
    console.log('\n🎉 INTEGRACIÓN COMPLETA EXITOSA');
    console.log('✅ Casa Bosques del Rey agregada a ambos índices');
    console.log('🎯 Sistema 16 Agentes: COMPLETADO');
} else {
    console.log('\n⚠️ INTEGRACIÓN PARCIAL - Verificar manualmente');
}