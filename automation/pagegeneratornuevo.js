#!/usr/bin/env node

/**
 * PAGE GENERATOR NUEVO - Sistema de Clonación Inteligente
 *
 * FUNCIONALIDAD:
 * 1. Detecta carpeta de fotos en PROYECTOS automáticamente
 * 2. Copia estructura de propiedad existente (venta o renta)
 * 3. Sustituye fotos automáticamente
 * 4. Actualiza descripción, precio, ubicación
 * 5. Integra en culiacan/index.html automáticamente
 * 6. Optimiza fotos (PNG→JPG, 85%, 1200px)
 *
 * USO: node automation/pagegeneratornuevo.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class PageGeneratorNuevo {
    constructor() {
        this.proyectosPath = '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS';
        this.culiacanPath = './culiacan';
        this.imagesBasePath = './culiacan';

        // Templates de referencia
        this.templates = {
            venta: 'infonavit-solidaridad', // Casa de referencia para ventas
            renta: 'privanzas-natura' // Casa de referencia para rentas (ajustar según tengas)
        };
    }

    /**
     * Función principal
     */
    async ejecutar() {
        console.log('🏠 PAGE GENERATOR NUEVO - Sistema de Clonación Inteligente\n');

        try {
            // 1. Detectar carpeta de fotos en PROYECTOS
            const carpetaProyecto = await this.detectarCarpetaProyecto();

            // 2. Preguntar tipo de propiedad
            const tipo = await this.preguntarTipo();

            // 3. Recopilar datos de la propiedad
            const datos = await this.recopilarDatos(carpetaProyecto, tipo);

            // 4. Detectar y optimizar fotos
            console.log('\n📸 Optimizando fotos...');
            const fotos = await this.optimizarFotos(carpetaProyecto, datos.slug);

            // 5. Clonar estructura de propiedad existente
            console.log('\n📋 Clonando estructura de propiedad existente...');
            await this.clonarEstructura(tipo, datos, fotos);

            // 6. Integrar en culiacan/index.html
            console.log('\n🔗 Integrando en listado principal...');
            await this.integrarEnListado(datos, fotos);

            console.log('\n✅ PROCESO COMPLETADO EXITOSAMENTE\n');
            console.log(`📁 Carpeta: culiacan/${datos.slug}/`);
            console.log(`📄 Página: culiacan/${datos.slug}/index.html`);
            console.log(`📸 Fotos: ${fotos.length} optimizadas`);
            console.log(`\n🎯 NEXT: Ejecuta "git add -A && git commit && git push"`);

        } catch (error) {
            console.error('\n❌ ERROR:', error.message);
            process.exit(1);
        }
    }

    /**
     * Detectar carpeta de proyecto en PROYECTOS
     */
    async detectarCarpetaProyecto() {
        console.log('🔍 Detectando carpetas en PROYECTOS...\n');

        const carpetas = fs.readdirSync(this.proyectosPath)
            .filter(item => {
                const fullPath = path.join(this.proyectosPath, item);
                return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
            })
            .slice(0, 10); // Mostrar últimas 10

        console.log('Carpetas disponibles:');
        carpetas.forEach((carpeta, index) => {
            console.log(`  ${index + 1}. ${carpeta}`);
        });

        const respuesta = await this.preguntar('\n¿Qué carpeta contiene las fotos? (número o nombre): ');
        const numero = parseInt(respuesta);

        let carpetaSeleccionada;
        if (!isNaN(numero) && numero > 0 && numero <= carpetas.length) {
            carpetaSeleccionada = carpetas[numero - 1];
        } else {
            carpetaSeleccionada = respuesta;
        }

        const carpetaCompleta = path.join(this.proyectosPath, carpetaSeleccionada);

        if (!fs.existsSync(carpetaCompleta)) {
            throw new Error(`Carpeta no encontrada: ${carpetaSeleccionada}`);
        }

        console.log(`✅ Carpeta seleccionada: ${carpetaSeleccionada}\n`);
        return carpetaCompleta;
    }

    /**
     * Preguntar tipo de propiedad
     */
    async preguntarTipo() {
        console.log('📋 Tipo de propiedad:');
        console.log('  1. Venta');
        console.log('  2. Renta');

        const respuesta = await this.preguntar('\nSelecciona (1 o 2): ');
        return respuesta === '2' ? 'renta' : 'venta';
    }

    /**
     * Recopilar datos de la propiedad
     */
    async recopilarDatos(carpetaProyecto, tipo) {
        console.log('\n📝 Datos de la propiedad:\n');

        const titulo = await this.preguntar('Título (ej: Casa Moderna en Privada): ');
        const ubicacion = await this.preguntar('Ubicación (ej: Privada Las Palmas, Culiacán): ');
        const precio = await this.preguntar(tipo === 'venta' ? 'Precio venta (ej: 2500000): ' : 'Precio renta mensual (ej: 15000): ');

        // Generar slug
        const slug = this.generarSlug(titulo);

        const recamaras = await this.preguntar('Recámaras: ') || '3';
        const banos = await this.preguntar('Baños: ') || '2';
        const terreno = await this.preguntar('Terreno m² (ej: 120): ') || '100';
        const construccion = await this.preguntar('Construcción m² (ej: 90): ') || '80';

        const descripcion = await this.preguntar('Descripción corta: ') ||
            `${tipo === 'venta' ? 'Casa en venta' : 'Casa en renta'} en ${ubicacion}`;

        return {
            titulo,
            ubicacion,
            precio: parseInt(precio),
            slug,
            tipo,
            recamaras: parseInt(recamaras),
            banos: parseInt(banos),
            terreno: parseFloat(terreno),
            construccion: parseFloat(construccion),
            descripcion
        };
    }

    /**
     * Generar slug desde título
     */
    generarSlug(titulo) {
        return titulo
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Optimizar fotos
     */
    async optimizarFotos(carpetaProyecto, slug) {
        const carpetaFotos = fs.existsSync(path.join(carpetaProyecto, 'fotos'))
            ? path.join(carpetaProyecto, 'fotos')
            : carpetaProyecto;

        const destinoFotos = path.join(this.culiacanPath, slug, 'images');

        // Crear carpeta de destino
        if (!fs.existsSync(destinoFotos)) {
            fs.mkdirSync(destinoFotos, { recursive: true });
        }

        // Ejecutar script de optimización
        const scriptOptimizar = './automation/optimizar-fotos.sh';

        if (fs.existsSync(scriptOptimizar)) {
            execSync(`bash ${scriptOptimizar} "${carpetaFotos}" "${destinoFotos}"`, {
                stdio: 'inherit'
            });
        } else {
            // Fallback: copiar sin optimizar
            console.log('⚠️  Script de optimización no encontrado, copiando fotos...');
            const archivos = fs.readdirSync(carpetaFotos)
                .filter(f => /\.(jpg|jpeg|png)$/i.test(f));

            archivos.forEach(archivo => {
                fs.copyFileSync(
                    path.join(carpetaFotos, archivo),
                    path.join(destinoFotos, archivo)
                );
            });
        }

        // Listar fotos optimizadas
        const fotos = fs.readdirSync(destinoFotos)
            .filter(f => /\.jpg$/i.test(f))
            .sort();

        console.log(`✅ ${fotos.length} fotos optimizadas`);
        return fotos;
    }

    /**
     * Clonar estructura de propiedad existente
     */
    async clonarEstructura(tipo, datos, fotos) {
        const templatePath = path.join(this.culiacanPath, this.templates[tipo], 'index.html');

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template no encontrado: ${templatePath}`);
        }

        // Leer template
        let html = fs.readFileSync(templatePath, 'utf8');

        // Sustituir datos
        html = this.sustituirDatos(html, datos, fotos, tipo);

        // Crear carpeta de destino
        const destinoPath = path.join(this.culiacanPath, datos.slug);
        if (!fs.existsSync(destinoPath)) {
            fs.mkdirSync(destinoPath, { recursive: true });
        }

        // Copiar estilos si existen
        const stylesOrigen = path.join(this.culiacanPath, this.templates[tipo], 'styles.css');
        if (fs.existsSync(stylesOrigen)) {
            fs.copyFileSync(stylesOrigen, path.join(destinoPath, 'styles.css'));
        }

        // Copiar scripts si existen
        const scriptsOrigen = path.join(this.culiacanPath, this.templates[tipo], 'script.js');
        if (fs.existsSync(scriptsOrigen)) {
            fs.copyFileSync(scriptsOrigen, path.join(destinoPath, 'script.js'));
        }

        // Guardar HTML
        fs.writeFileSync(path.join(destinoPath, 'index.html'), html, 'utf8');

        console.log(`✅ Página creada: ${destinoPath}/index.html`);
    }

    /**
     * Sustituir datos en HTML
     */
    sustituirDatos(html, datos, fotos, tipo) {
        const fotoFachada = fotos.find(f => /fachada/i.test(f)) || fotos[0];
        const precioFormateado = `$${datos.precio.toLocaleString('es-MX')}`;
        const precioLabel = tipo === 'venta' ? 'En Venta' : 'Renta Mensual';

        // Reemplazos básicos
        html = html.replace(/<title>.*?<\/title>/i,
            `<title>${datos.titulo} - ${precioFormateado} | Hector es Bienes Raíces</title>`);

        html = html.replace(/<meta name="description" content=".*?">/i,
            `<meta name="description" content="${datos.descripcion}">`);

        // Open Graph
        html = html.replace(/property="og:title" content=".*?"/i,
            `property="og:title" content="${datos.titulo} - ${precioFormateado}"`);

        html = html.replace(/property="og:image" content=".*?"/i,
            `property="og:image" content="https://casasenventa.info/culiacan/${datos.slug}/images/${fotoFachada}"`);

        // Preload de imagen principal
        html = html.replace(/<link rel="preload" href="images\/[^"]*" as="image">/i,
            `<link rel="preload" href="images/${fotoFachada}" as="image">`);

        // Título del hero
        html = html.replace(/<h1[^>]*class="hero-title"[^>]*>.*?<\/h1>/is,
            `<h1 class="hero-title">${datos.titulo}</h1>`);

        // Precio badge
        html = html.replace(/<span class="price-amount">.*?<\/span>/i,
            `<span class="price-amount">${precioFormateado}</span>`);

        html = html.replace(/<span class="price-label">.*?<\/span>/i,
            `<span class="price-label">${precioLabel}</span>`);

        // Carruseles - sustituir fotos
        html = this.sustituirCarruseles(html, fotos, datos.slug);

        // WhatsApp
        const whatsappMsg = tipo === 'venta'
            ? `Hola! Me interesa la casa en venta "${datos.titulo}" por ${precioFormateado}`
            : `Hola! Me interesa la casa en renta "${datos.titulo}" por ${precioFormateado}/mes`;

        html = html.replace(/wa\.me\/[0-9]+\?text=[^"]*/g,
            `wa.me/528111652545?text=${encodeURIComponent(whatsappMsg)}`);

        return html;
    }

    /**
     * Sustituir carruseles con nuevas fotos
     */
    sustituirCarruseles(html, fotos, slug) {
        // Generar slides del carousel
        const slidesHtml = fotos.map((foto, index) => {
            const active = index === 0 ? 'active' : '';
            const loading = index === 0 ? 'eager' : 'lazy';
            return `                    <div class="carousel-slide ${active}" data-slide="${index}">
                        <img src="images/${foto}" alt="Foto ${index + 1}" class="carousel-image gallery-image main-image" loading="${loading}" decoding="async" width="800" height="600">
                    </div>`;
        }).join('\n');

        // Generar dots
        const dotsHtml = fotos.map((_, index) => {
            const active = index === 0 ? 'active' : '';
            return `                    <button class="carousel-dot ${active}" onclick="goToSlideHero(${index})" aria-label="Ir a foto ${index + 1}"></button>`;
        }).join('\n');

        // Reemplazar carousel del hero
        html = html.replace(
            /(<div class="carousel-wrapper">)(.*?)(<\/div>\s*<!-- Navigation arrows -->)/s,
            `$1\n${slidesHtml}\n                    $3`
        );

        // Reemplazar dots del hero
        html = html.replace(
            /(<div class="carousel-dots">)(.*?)(<\/div>\s*<\/div>\s*<\/div>\s*<\/section>)/s,
            `$1\n${dotsHtml}\n                $3`
        );

        // Reemplazar carousel de galería (similar)
        html = html.replace(
            /(<!-- Gallery Carousel Section -->.*?<div class="carousel-wrapper">)(.*?)(<\/div>\s*<!-- Navigation arrows -->)/s,
            `$1\n${slidesHtml.replace(/main-image/g, '')}\n                    $3`
        );

        // Actualizar JavaScript totalSlides
        html = html.replace(/const totalSlides = \d+;/g, `const totalSlides = ${fotos.length};`);
        html = html.replace(/const totalSlidesHero = \d+;/g, `const totalSlidesHero = ${fotos.length};`);

        return html;
    }

    /**
     * Integrar en culiacan/index.html
     */
    async integrarEnListado(datos, fotos) {
        const indexPath = path.join(this.culiacanPath, 'index.html');
        let html = fs.readFileSync(indexPath, 'utf8');

        const fotoFachada = fotos.find(f => /fachada/i.test(f)) || fotos[0];
        const precioFormateado = `$${datos.precio.toLocaleString('es-MX')}`;
        const badgeLabel = datos.tipo === 'venta' ? 'VENTA' : 'RENTA';
        const badgeColor = datos.tipo === 'venta' ? 'bg-green-600' : 'bg-blue-600';

        // Generar tarjeta
        const tarjetaHtml = `
            <!-- BEGIN CARD-ADV ${datos.slug} -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
                 data-href="${datos.slug}/index.html">
                <div class="relative aspect-video">
                    <div class="carousel-container" data-current="0">
                        ${fotos.slice(0, 5).map((foto, index) => `
                        <img src="${datos.slug}/images/${foto}"
                             alt="${datos.titulo} - Foto ${index + 1}"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image ${index === 0 ? 'active' : 'hidden'}">`).join('')}
                    </div>

                    <!-- Carousel controls -->
                    <button class="carousel-prev" aria-label="Imagen anterior">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="carousel-next" aria-label="Siguiente imagen">
                        <i class="fas fa-chevron-right"></i>
                    </button>

                    <!-- Carousel dots -->
                    <div class="carousel-indicators">
                        ${fotos.slice(0, 5).map((_, index) =>
                            `<button class="indicator ${index === 0 ? 'active' : ''}"></button>`
                        ).join('')}
                    </div>

                    <!-- Badge -->
                    <div class="absolute top-4 right-4 ${badgeColor} text-white px-3 py-1 rounded-full text-sm font-semibold">
                        ${badgeLabel}
                    </div>
                </div>

                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${datos.titulo}</h3>
                    <p class="text-gray-600 mb-4 flex items-center">
                        <i class="fas fa-map-marker-alt mr-2 text-hector"></i>
                        ${datos.ubicacion}
                    </p>

                    <div class="flex justify-between items-center mb-4">
                        <div class="text-2xl font-bold text-hector">${precioFormateado}</div>
                        <div class="text-sm text-gray-500">${datos.tipo === 'venta' ? '' : '/mes'}</div>
                    </div>

                    <div class="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div>
                            <i class="fas fa-bed text-gray-400 mb-1"></i>
                            <div class="text-sm font-semibold">${datos.recamaras} rec</div>
                        </div>
                        <div>
                            <i class="fas fa-bath text-gray-400 mb-1"></i>
                            <div class="text-sm font-semibold">${datos.banos} baños</div>
                        </div>
                        <div>
                            <i class="fas fa-ruler-combined text-gray-400 mb-1"></i>
                            <div class="text-sm font-semibold">${datos.terreno}m²</div>
                        </div>
                    </div>

                    <button class="w-full bg-hector hover:bg-hector-dark text-white font-semibold py-3 rounded-lg transition-colors">
                        Ver Detalles
                    </button>
                </div>
            </div>
            <!-- END CARD-ADV ${datos.slug} -->`;

        // Buscar dónde insertar (después del último card)
        const lastCardMatch = html.match(/<!-- END CARD-ADV [^\s]+ -->/g);
        if (lastCardMatch) {
            const lastCard = lastCardMatch[lastCardMatch.length - 1];
            html = html.replace(lastCard, lastCard + '\n' + tarjetaHtml);
        } else {
            // Si no hay cards, insertar antes del cierre del grid
            html = html.replace(/(<\/div>\s*<!-- End Properties Grid -->)/, tarjetaHtml + '\n$1');
        }

        fs.writeFileSync(indexPath, html, 'utf8');
        console.log('✅ Tarjeta integrada en culiacan/index.html');
    }

    /**
     * Utilidad para preguntar en CLI
     */
    preguntar(pregunta) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => {
            rl.question(pregunta, respuesta => {
                rl.close();
                resolve(respuesta.trim());
            });
        });
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const generator = new PageGeneratorNuevo();
    generator.ejecutar().catch(error => {
        console.error('\n❌ ERROR FATAL:', error);
        process.exit(1);
    });
}

module.exports = PageGeneratorNuevo;
