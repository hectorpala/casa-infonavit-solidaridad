#!/usr/bin/env node

const AgenteConstructorPaginas = require('./agente-constructor-paginas.js');

// Crear instancia del agente con datos predefinidos
class CreadorVillasRio extends AgenteConstructorPaginas {
    async construirPaginaAutomatica() {
        try {
            console.log('🏗️  CREANDO CASA VILLAS DEL RIO ELITE AUTOMÁTICAMENTE...\n');
            
            // Datos predefinidos
            const datos = {
                tipo: 'venta',
                nombre: 'Casa en venta en privada Villas del Rio Elite',
                ubicacion: 'Privada Villas del Rio Elite, Sector Norte, Culiacán, Sinaloa',
                precio: '$2,600,000',
                descripcion: 'Estrena tu casa sin enganche! Sector norte a solo 5 minutos de Plaza Ceiba y la USE. Privada con acceso controlado, la seguridad que estás buscando! Totalmente remodelada y con ampliación.',
                recamaras: 3,
                banos: 2.5,
                extras: [
                    'Cochera techada',
                    'Cocina de cuarzo blanco equipada', 
                    'Minisplits incluidos',
                    'Recámaras con closet',
                    'Piso rectificado',
                    'Área de lavado techada',
                    'Patio bardeado con vitro piso',
                    'Privada con área común con juegos infantiles',
                    '206 M2 de construcción',
                    '104 M2 de superficie'
                ],
                carpetaFotos: 'casa villas del rio elite en venta',
                rutaFotos: '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/casa villas del rio elite en venta',
                whatsapp: '',  // Se generará automáticamente
                slug: '',      // Se generará automáticamente
                slugDir: ''    // Se generará automáticamente
            };
            
            // Generar slug
            datos.slug = this.generarSlug(datos.tipo, datos.nombre);
            datos.slugDir = datos.slug.replace('casa-venta-', '').replace('casa-renta-', '');
            
            // Generar WhatsApp
            datos.whatsapp = this.generarWhatsAppDefault(datos);
            
            console.log('📊 DATOS RECOPILADOS:');
            console.log(`   🏠 Tipo: ${datos.tipo}`);
            console.log(`   📍 Nombre: ${datos.nombre}`);
            console.log(`   🗺️  Ubicación: ${datos.ubicacion}`);
            console.log(`   💰 Precio: ${datos.precio}`);
            console.log(`   🛏️  Recámaras: ${datos.recamaras}`);
            console.log(`   🚿 Baños: ${datos.banos}`);
            console.log(`   ✨ Extras: ${datos.extras.length} características`);
            console.log(`   📁 Slug: ${datos.slug}`);
            console.log('');
            
            // Procesar fotos con detección de fachada
            await this.procesarFotos(datos);
            
            // Generar página individual
            await this.generarPaginaIndividual(datos);
            
            // Actualizar index.html
            await this.actualizarIndexPrincipal(datos);
            
            // Actualizar culiacan/index.html
            await this.actualizarIndexCuliacan(datos);
            
            console.log('✅ ¡PÁGINA CREADA EXITOSAMENTE!');
            console.log('================================');
            console.log(`📄 Página: ${datos.slug}.html`);
            console.log(`🖼️  Fotos: images/${datos.slugDir}/ (${datos.fotos.length} fotos)`);
            console.log(`🏠 Fachada principal: ${datos.fotos[0].archivo}`);
            console.log(`🔗 URL: https://casasenventa.info/${datos.slug}/`);
            
            return datos;
            
        } catch (error) {
            console.error('❌ Error:', error.message);
            throw error;
        }
    }
}

// Ejecutar
if (require.main === module) {
    const creador = new CreadorVillasRio();
    creador.construirPaginaAutomatica()
        .then((datos) => {
            console.log('\n🎉 PROCESO COMPLETADO');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 ERROR FATAL:', error.message);
            process.exit(1);
        });
}