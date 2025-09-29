#!/usr/bin/env node

/**
 * Script para corregir placeholders faltantes en casa-renta-espacios-marsella.html
 */

const fs = require('fs');
const path = require('path');

const archivoHTML = './casa-renta-espacios-marsella.html';

console.log('🔧 CORRIGIENDO PLACEHOLDERS ESPACIOS MARSELLA');
console.log('═'.repeat(50));

try {
    // Leer archivo
    let contenidoHTML = fs.readFileSync(archivoHTML, 'utf8');
    
    // Definir correcciones
    const correcciones = [
        {
            buscar: '{{PROPERTY_PRICE_NUMBER}}',
            reemplazar: '12000',
            descripcion: 'Precio numérico para Schema'
        },
        {
            buscar: '{{PROPERTY_SUBTITLE}}', 
            reemplazar: 'Casa de 2 habitaciones en renta en Privada Espacios Marsella - Cerca de UAS',
            descripcion: 'Subtítulo de la propiedad'
        },
        {
            buscar: 'images/casa-renta-espacios-marsella/',
            reemplazar: 'images/espacios-marsella/',
            descripcion: 'Rutas de imágenes en Open Graph'
        }
    ];
    
    // Aplicar correcciones
    let cambiosRealizados = 0;
    for (const correccion of correcciones) {
        const ocurrencias = (contenidoHTML.match(new RegExp(correccion.buscar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        
        if (ocurrencias > 0) {
            contenidoHTML = contenidoHTML.replace(new RegExp(correccion.buscar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correccion.reemplazar);
            console.log(`✅ ${correccion.descripcion}: ${ocurrencias} ocurrencias corregidas`);
            cambiosRealizados += ocurrencias;
        } else {
            console.log(`ℹ️  ${correccion.descripcion}: No encontrado`);
        }
    }
    
    // Verificar estructura carousel-wrapper
    const tieneCarouselContainer = contenidoHTML.includes('carousel-container');
    const tieneCarouselWrapper = contenidoHTML.includes('carousel-wrapper');
    
    console.log('\n📋 VERIFICACIÓN DE ESTRUCTURA:');
    console.log(`Carousel Container: ${tieneCarouselContainer ? '✅' : '❌'}`);
    console.log(`Carousel Wrapper: ${tieneCarouselWrapper ? '✅' : '⚠️  Faltante (será agregado)'}`);
    
    // Si falta carousel-wrapper, agregarlo
    if (tieneCarouselContainer && !tieneCarouselWrapper) {
        // Agregar carousel-wrapper después de carousel-container
        contenidoHTML = contenidoHTML.replace(
            /<div class="carousel-container">/g,
            '<div class="carousel-container">\n                <div class="carousel-wrapper">'
        );
        
        // Cerrar carousel-wrapper antes de cerrar carousel-container  
        contenidoHTML = contenidoHTML.replace(
            /(\s*)<\/div>\s*<\/div>\s*<\/section>/g,
            '$1</div>\n            </div>\n        </div>\n    </section>'
        );
        
        console.log('✅ Estructura carousel-wrapper agregada');
        cambiosRealizados++;
    }
    
    // Escribir archivo corregido
    if (cambiosRealizados > 0) {
        fs.writeFileSync(archivoHTML, contenidoHTML);
        console.log(`\n🎉 ARCHIVO CORREGIDO: ${cambiosRealizados} cambios aplicados`);
    } else {
        console.log('\n✅ ARCHIVO YA ESTÁ CORRECTO');
    }
    
    // Verificaciones finales
    console.log('\n📊 VERIFICACIONES FINALES:');
    
    const verificaciones = [
        {
            patron: /images\/espacios-marsella\/.*\.jpg/g,
            nombre: 'Rutas de imágenes',
            esperado: 20 // 10 en hero + 10 en gallery
        },
        {
            patron: /changeImage\(/g,
            nombre: 'Función JavaScript',
            esperado: 4 // 2 botones en hero + 2 en gallery
        },
        {
            patron: /calcularRenta/g,
            nombre: 'Calculadora de renta',
            esperado: 4 // función + llamadas
        },
        {
            patron: /\$12,000/g,
            nombre: 'Precio visible',
            esperado: 2 // en contenido
        }
    ];
    
    for (const verificacion of verificaciones) {
        const coincidencias = (contenidoHTML.match(verificacion.patron) || []).length;
        const estado = coincidencias >= verificacion.esperado ? '✅' : '⚠️';
        console.log(`${estado} ${verificacion.nombre}: ${coincidencias}/${verificacion.esperado}`);
    }
    
    console.log('\n🚀 ARCHIVO LISTO PARA PUBLICACIÓN');
    console.log(`📄 Archivo: ${archivoHTML}`);
    console.log(`🔗 URL: https://casasenventa.info/casa-renta-espacios-marsella.html`);
    
} catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
}