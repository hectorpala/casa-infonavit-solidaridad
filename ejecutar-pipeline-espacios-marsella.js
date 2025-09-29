#!/usr/bin/env node

/**
 * PIPELINE COMPLETO PARA ESPACIOS MARSELLA
 * SPEC orchestration-v1.1 + props-v3.3
 * Casa en Renta Colonia Espacios Marsella - ID: 30044981
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Importar Pipeline16AgentesCompletoV2
const Pipeline16AgentesCompletoV2 = require('./automation/pipeline-16-agentes-completo-v2.js');

class PipelineEspaciosMarsella extends Pipeline16AgentesCompletoV2 {
    constructor() {
        super();
        
        // Override rutas específicas para Espacios Marsella
        this.proyectosPath = '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS';
        this.carpetaFotos = 'casa en retan colonia espacios marsella';
        this.rutaFotosCompleta = path.join(this.proyectosPath, this.carpetaFotos);
        
        // Datos específicos de la propiedad
        this.datosPropiedad = {
            nombre: 'Casa en Renta Colonia Espacios Marsella',
            ubicacion: 'Privada Espacios Marsella, a 5 minutos de la escuela de medicina UAS',
            precio: '$12,000',
            precioNumero: 12000,
            tipo: 'renta',
            idInmueble: '30044981',
            recamaras: '2',
            banos: '2',
            caracteristicas: '2 Habitaciones, 2 Baños, Cuarto de lavado, Cocina equipada, 2 Estacionamientos, Privada con acceso controlado, Pasillo de servicio, Área de sala, Área de comedor',
            amenidades: 'Privada con acceso controlado, Estacionamientos cubiertos, Cerca de UAS',
            edad: 'Nuevo',
            incluye: 'Incluye mantenimiento de privada'
        };
    }

    /**
     * AGENTE 2 OVERRIDE - ESCÁNER FOTOS (Espacios Marsella específico)
     */
    async agente2_escanerFotos() {
        this.log(2, 'Escaneando fotos específicas de Espacios Marsella');
        
        // Verificar carpeta específica
        if (!fs.existsSync(this.rutaFotosCompleta)) {
            this.log(2, `Carpeta no encontrada: ${this.rutaFotosCompleta}`, 'ERROR');
            return false;
        }
        
        this.handoffData.fotosPath = this.rutaFotosCompleta;
        this.log(2, `Carpeta confirmada: ${this.carpetaFotos}`);
        
        // Validar fotos
        const archivos = fs.readdirSync(this.handoffData.fotosPath)
            .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
            .sort();
        
        this.log(2, `Fotos encontradas: ${archivos.join(', ')}`);
        
        if (archivos.length < 6) {
            this.log(2, `Solo ${archivos.length} fotos encontradas, mínimo 6 requerido`, 'ERROR');
            return false;
        }
        
        this.handoffData.fotosValidas = archivos;
        
        // Detectar fachada - buscar foto-01 o primera foto
        this.handoffData.fachada = archivos.find(f => f.includes('foto-01')) || archivos[0];
        
        this.log(2, `${archivos.length} fotos válidas detectadas`, 'SUCCESS');
        this.log(2, `Fachada principal: ${this.handoffData.fachada}`);
        
        return true;
    }

    /**
     * AGENTE 5 OVERRIDE - DETECTOR DUPLICADOS (slug específico)
     */
    async agente5_detectorDuplicados() {
        this.log(5, 'Generando slug único para Espacios Marsella');
        
        const slugBase = 'casa-renta-espacios-marsella';
        
        // Verificar si existe
        const archivoExistente = `${slugBase}.html`;
        const slugExiste = fs.existsSync(archivoExistente);
        
        if (slugExiste) {
            this.log(5, `Slug ${slugBase} ya existe - generando variante`, 'ERROR');
            // Podríamos generar casa-renta-espacios-marsella-2, etc.
            return false;
        }
        
        this.handoffData.slug = slugBase;
        this.handoffData.slugUnico = true;
        
        this.log(5, `Slug único confirmado: ${slugBase}`, 'SUCCESS');
        return true;
    }

    /**
     * AGENTE 12 OVERRIDE - GUARDIA PRE-PUBLICACIÓN (validación específica)
     */
    async agente12_guardiaPrePublicacion() {
        this.log(12, 'Ejecutando verificaciones específicas Espacios Marsella');
        
        let score = 0;
        const checks = [];
        
        // Verificar página HTML generada
        if (this.handoffData.paginaHTML && this.handoffData.paginaHTML.length > 1000) {
            score += 20;
            checks.push('✅ Página HTML generada correctamente');
            
            // Verificar template de renta específico
            if (this.handoffData.paginaHTML.includes('Renta Mensual') && 
                this.handoffData.paginaHTML.includes('Calculadora de Renta')) {
                score += 10;
                checks.push('✅ Template de renta aplicado correctamente');
            } else {
                checks.push('❌ Template de renta no detectado');
            }
        } else {
            checks.push('❌ Página HTML faltante o incompleta');
        }
        
        // Verificar imágenes físicas con slug correcto
        const slug = this.handoffData.slug; // casa-renta-espacios-marsella
        const slugImagenes = 'espacios-marsella'; // Para directorio de imágenes
        const directorioImagenes = `./images/${slugImagenes}`;
        
        if (fs.existsSync(directorioImagenes)) {
            const imagenesEnDisco = fs.readdirSync(directorioImagenes);
            if (imagenesEnDisco.length >= 10) {
                score += 20;
                checks.push(`✅ ${imagenesEnDisco.length} imágenes optimizadas en disco`);
                
                // Verificar fotos específicas de Espacios Marsella
                const tieneFoto01 = imagenesEnDisco.some(img => img.includes('foto-01'));
                if (tieneFoto01) {
                    score += 5;
                    checks.push('✅ Fachada principal (foto-01) detectada');
                }
            } else {
                checks.push(`❌ Solo ${imagenesEnDisco.length} imágenes en disco, esperado ≥10`);
            }
        } else {
            checks.push(`❌ Directorio de imágenes no existe: ${directorioImagenes}`);
        }
        
        // Verificar carruseles con estructura carousel-container > carousel-wrapper
        if (this.handoffData.paginaHTML) {
            const tieneCarouselContainer = this.handoffData.paginaHTML.includes('carousel-container');
            const tieneCarouselWrapper = this.handoffData.paginaHTML.includes('carousel-wrapper');
            
            if (tieneCarouselContainer && tieneCarouselWrapper) {
                score += 15;
                checks.push('✅ Estructura carrusel container > wrapper correcta');
            } else {
                checks.push('❌ Estructura carrusel incorrecta o faltante');
            }
        }
        
        // Verificar calculadora de renta
        if (this.handoffData.paginaHTML && 
            this.handoffData.paginaHTML.includes('calcularRenta') &&
            this.handoffData.paginaHTML.includes('PROPERTY_PRICE_NUMBER')) {
            score += 10;
            checks.push('✅ Calculadora de renta integrada');
        } else {
            checks.push('❌ Calculadora de renta faltante');
        }
        
        // Verificar WhatsApp con mensaje específico
        if (this.handoffData.whatsappConfigurado) {
            score += 10;
            checks.push('✅ Enlaces WhatsApp E.164 configurados');
        } else {
            checks.push('❌ Enlaces WhatsApp faltantes');
        }
        
        // Verificar SEO para propiedad de renta
        if (this.handoffData.seoCompleto && this.handoffData.schemaMarkup) {
            score += 10;
            checks.push('✅ SEO y Schema markup para renta aplicados');
        } else {
            checks.push('❌ SEO o Schema markup faltantes');
        }
        
        // Verificar actualizaciones índices
        if (this.handoffData.ambosIndicesActualizados) {
            score += 10;
            checks.push('✅ Ambos índices actualizados');
        } else {
            checks.push('❌ Índices no actualizados');
        }
        
        this.handoffData.scoreCalidad = score;
        this.handoffData.verificacionesFinales = score >= 85;
        this.handoffData.readyToPublish = score >= 85;
        
        // Mostrar resultados específicos
        console.log('\n📊 REPORTE VERIFICACIONES ESPACIOS MARSELLA:');
        console.log('═'.repeat(55));
        checks.forEach(check => console.log(check));
        console.log(`\n🎯 SCORE DE CALIDAD: ${score}/100`);
        
        if (this.handoffData.readyToPublish) {
            this.log(12, `✅ ESPACIOS MARSELLA READY TO PUBLISH - Score: ${score}/100`, 'SUCCESS');
            return true;
        } else {
            this.log(12, `❌ Espacios Marsella NO READY - Score: ${score}/100`, 'ERROR');
            return false;
        }
    }

    // Override generador de slug temporal
    generarSlugTemporal() {
        return 'espacios-marsella';
    }
    
    generarSlugImagenes() {
        return 'espacios-marsella';
    }

    /**
     * Override de generación de WhatsApp URL con mensaje específico
     */
    generarWhatsAppURL() {
        const mensaje = `Hola, me interesa la Casa en Renta Colonia Espacios Marsella por $12,000 mensual. ID: 30044981. ¿Podrías darme más información?`;
        return `https://wa.me/528111652545?text=${encodeURIComponent(mensaje)}`;
    }

    /**
     * MÉTODO PRINCIPAL ESPECÍFICO PARA ESPACIOS MARSELLA
     */
    async ejecutarPipelineEspaciosMarsella(okToApply = false) {
        console.log('🏠 EJECUTANDO PIPELINE ESPACIOS MARSELLA');
        console.log('📋 SPEC: orchestration-v1.1 + props-v3.3 + rental-v2.1');
        console.log('🆔 ID Inmueble: 30044981');
        console.log('💰 Renta: $12,000 mensual (incluye mantenimiento)');
        console.log('═'.repeat(60));
        
        // Usar datos específicos de la propiedad
        const resultado = await this.ejecutarPipelineCompleto(this.datosPropiedad, okToApply);
        
        if (resultado.success) {
            console.log('\n🎉 PIPELINE ESPACIOS MARSELLA COMPLETADO');
            console.log('═'.repeat(50));
            console.log(`📄 Archivo: ${this.handoffData.slug}.html`);
            console.log(`📊 Score: ${this.handoffData.scoreCalidad}/100`);
            console.log(`🔗 URL: https://casasenventa.info/${this.handoffData.slug}.html`);
            console.log(`📱 WhatsApp: ${this.generarWhatsAppURL()}`);
            
            if (this.handoffData.readyToPublish) {
                console.log('\n✅ ESTADO: READY TO PUBLISH');
                if (okToApply) {
                    console.log('🚀 PUBLICACIÓN AUTORIZADA');
                } else {
                    console.log('⏳ Esperando OK_TO_APPLY=true para publicar');
                }
            } else {
                console.log('\n⚠️ ESTADO: NEEDS REVIEW');
            }
        }
        
        return resultado;
    }
}

// Ejecutar pipeline si se llama directamente
if (require.main === module) {
    const pipeline = new PipelineEspaciosMarsella();
    const okToApply = process.argv.includes('--apply');
    
    pipeline.ejecutarPipelineEspaciosMarsella(okToApply)
        .then(resultado => {
            if (resultado.success) {
                console.log('\n🎯 RESULTADO FINAL: ÉXITO');
                if (okToApply && resultado.readyToPublish) {
                    console.log('📝 Archivo HTML creado y listo para commit');
                    console.log('\n🚀 Siguiente paso: ejecutar "publica ya"');
                }
            } else {
                console.log(`\n❌ PIPELINE FALLÓ EN AGENTE ${resultado.stoppedAt}`);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 ERROR FATAL:', error);
            process.exit(1);
        });
}

module.exports = PipelineEspaciosMarsella;