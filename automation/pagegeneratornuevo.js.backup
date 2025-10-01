#!/usr/bin/env node

/**
 * PAGE GENERATOR NUEVO - Sistema de Clonación Inteligente
 *
 * LECCIONES APRENDIDAS DE CASA COLINAS SAN MIGUEL:
 *
 * RENTAS (CRÍTICO):
 * - Archivo va en ROOT: casa-renta-[slug].html (NO en carpeta culiacan/)
 * - Fotos en: images/[slug]/ (NO en culiacan/[slug]/images/)
 * - Badge NARANJA OBLIGATORIO: bg-orange-500 con precio (para detección de filtro)
 * - Formato precio: $50,000/mes EN UN SOLO ELEMENTO (no separar /mes)
 * - Tarjeta debe tener onclick="changeImage()" en arrows
 * - Debe incluir botón de favoritos con SVG
 * - Usar font-poppins en título y descripción
 * - SVG icons para recámaras/baños/m² (no FontAwesome)
 * - Botón CTA con gradiente naranja
 * - Rutas relativas: ../images/[slug]/ y ../casa-renta-[slug].html
 *
 * FILTRO JAVASCRIPT:
 * - Busca elemento con clase .bg-orange-500 para extraer precio
 * - Detecta RENTA con regex: /\/mes|mes|renta|mensual/.test(priceText)
 * - Sin badge naranja = NO se detecta como RENTA = aparece en VENTA
 *
 * VENTAS (ACTUALIZADO):
 * - Archivo en carpeta: culiacan/[slug]/index.html
 * - Fotos en: culiacan/[slug]/images/
 * - Badge VERDE OBLIGATORIO: bg-green-600 con precio (para detección de filtro)
 * - Formato precio: $2,500,000 EN UN SOLO ELEMENTO (sin /mes)
 * - Tarjeta debe tener onclick="changeImage()" en arrows
 * - Debe incluir botón de favoritos con SVG
 * - Usar font-poppins en título y descripción
 * - SVG icons para recámaras/baños/m² (no FontAwesome)
 * - Botón CTA con gradiente verde
 * - Rutas relativas: ${datos.slug}/images/ y ${datos.slug}/index.html
 *
 * FILTRO JAVASCRIPT:
 * - VENTA: Badge verde bg-green-600 SIN "/mes" en el texto
 * - RENTA: Badge naranja bg-orange-500 CON "/mes" en el texto
 * - El filtro detecta por clase de badge y presencia de "/mes"
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

        // Templates de referencia
        this.templates = {
            venta: 'infonavit-solidaridad',
            renta: 'casa-renta-privanzas-natura.html' // Template en ROOT
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
            const fotos = await this.optimizarFotos(carpetaProyecto, datos.slug, tipo);

            // 5. Crear página HTML
            console.log('\n📋 Creando página HTML...');
            await this.crearPagina(tipo, datos, fotos);

            // 6. Integrar en culiacan/index.html
            console.log('\n🔗 Integrando en listado principal...');
            await this.integrarEnListado(datos, fotos);

            console.log('\n✅ PROCESO COMPLETADO EXITOSAMENTE\n');
            if (tipo === 'renta') {
                console.log(`📄 Página: casa-renta-${datos.slug}.html`);
                console.log(`📸 Fotos: images/${datos.slug}/ (${fotos.length} optimizadas)`);
            } else {
                console.log(`📁 Carpeta: culiacan/${datos.slug}/`);
                console.log(`📄 Página: culiacan/${datos.slug}/index.html`);
                console.log(`📸 Fotos: ${fotos.length} optimizadas`);
            }
            console.log(`\n🎯 NEXT: Ejecuta "publica ya" para deployar`);

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
        const direccion = await this.preguntar('Dirección completa: ');
        const precio = await this.preguntar(tipo === 'venta' ? 'Precio venta (ej: 2500000): ' : 'Precio renta mensual (ej: 15000): ');

        // Generar slug
        const slug = this.generarSlug(titulo);

        const recamaras = await this.preguntar('Recámaras: ') || '3';
        const banos = await this.preguntar('Baños: ') || '2';
        const terreno = await this.preguntar('Terreno m² (ej: 120): ') || '100';

        const descripcion = await this.preguntar('Descripción corta: ') ||
            `${tipo === 'venta' ? 'Casa en venta' : 'Casa en renta'} en ${ubicacion}`;

        return {
            titulo,
            ubicacion,
            direccion,
            precio: parseInt(precio),
            slug,
            tipo,
            recamaras: parseInt(recamaras),
            banos: parseFloat(banos),
            terreno: parseFloat(terreno),
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
    async optimizarFotos(carpetaProyecto, slug, tipo) {
        const carpetaFotos = fs.existsSync(path.join(carpetaProyecto, 'fotos'))
            ? path.join(carpetaProyecto, 'fotos')
            : carpetaProyecto;

        // RENTA: fotos en images/[slug]/ (ROOT)
        // VENTA: fotos en culiacan/[slug]/images/
        const destinoFotos = tipo === 'renta'
            ? path.join('./images', slug)
            : path.join('./culiacan', slug, 'images');

        // Crear carpeta de destino
        if (!fs.existsSync(destinoFotos)) {
            fs.mkdirSync(destinoFotos, { recursive: true });
        }

        // Renombrar fotos a foto-1.jpg, foto-2.jpg, etc.
        const archivosOriginales = fs.readdirSync(carpetaFotos)
            .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
            .sort();

        console.log(`📸 Encontradas ${archivosOriginales.length} fotos, optimizando...`);

        // Ejecutar script de optimización
        const scriptOptimizar = './automation/optimizar-fotos.sh';

        if (fs.existsSync(scriptOptimizar)) {
            execSync(`bash ${scriptOptimizar} "${carpetaFotos}" "${destinoFotos}"`, {
                stdio: 'inherit'
            });
        }

        // Renombrar a foto-X.jpg
        const fotosOptimizadas = fs.readdirSync(destinoFotos)
            .filter(f => /\.jpg$/i.test(f))
            .sort();

        fotosOptimizadas.forEach((foto, index) => {
            const nuevoNombre = `foto-${index + 1}.jpg`;
            fs.renameSync(
                path.join(destinoFotos, foto),
                path.join(destinoFotos, nuevoNombre)
            );
        });

        const fotos = Array.from({ length: fotosOptimizadas.length }, (_, i) => `foto-${i + 1}.jpg`);
        console.log(`✅ ${fotos.length} fotos optimizadas y renombradas`);
        return fotos;
    }

    /**
     * Crear página HTML
     */
    async crearPagina(tipo, datos, fotos) {
        if (tipo === 'renta') {
            // RENTA: copiar template del ROOT
            const templatePath = this.templates.renta;

            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template no encontrado: ${templatePath}`);
            }

            let html = fs.readFileSync(templatePath, 'utf8');

            // Reemplazar datos
            html = this.sustituirDatosRenta(html, datos, fotos);

            // Guardar en ROOT como casa-renta-[slug].html
            const destinoPath = `casa-renta-${datos.slug}.html`;
            fs.writeFileSync(destinoPath, html, 'utf8');

            console.log(`✅ Página RENTA creada: ${destinoPath}`);
        } else {
            // VENTA: crear en carpeta culiacan/[slug]/
            const templatePath = path.join('./culiacan', this.templates.venta, 'index.html');

            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template no encontrado: ${templatePath}`);
            }

            let html = fs.readFileSync(templatePath, 'utf8');
            html = this.sustituirDatosVenta(html, datos, fotos);

            const destinoPath = path.join('./culiacan', datos.slug);
            if (!fs.existsSync(destinoPath)) {
                fs.mkdirSync(destinoPath, { recursive: true });
            }

            fs.writeFileSync(path.join(destinoPath, 'index.html'), html, 'utf8');
            console.log(`✅ Página VENTA creada: ${destinoPath}/index.html`);
        }
    }

    /**
     * Sustituir datos para RENTA
     */
    sustituirDatosRenta(html, datos, fotos) {
        const precioFormateado = `$${datos.precio.toLocaleString('es-MX')}`;

        // Reemplazos globales de texto
        const replacements = {
            'Privanzas Natura': datos.ubicacion.split(',')[0].trim(),
            'privanzas-natura': datos.slug,
            'Vialidad del Congreso 2361': datos.direccion,
            '$27,000': precioFormateado,
            '"price": "27000"': `"price": "${datos.precio}"`,
            '"numberOfBedrooms": 4': `"numberOfBedrooms": ${datos.recamaras}`,
            '"numberOfBathroomsTotal": 4.5': `"numberOfBathroomsTotal": ${datos.banos}`,
            '4 recámaras': `${datos.recamaras} recámaras`,
            '4.5 baños': `${datos.banos} baños`,
        };

        for (const [old, nuevo] of Object.entries(replacements)) {
            html = html.split(old).join(nuevo);
        }

        // Reemplazar TODAS las imágenes con foto-1.jpg, foto-2.jpg, etc.
        let fotoCounter = 1;
        html = html.replace(/images\/casa-renta-[^\/]+\/[^"]+\.jpeg/g, () => {
            const result = `images/${datos.slug}/foto-${fotoCounter}.jpg`;
            fotoCounter++;
            if (fotoCounter > fotos.length) fotoCounter = 1;
            return result;
        });

        return html;
    }

    /**
     * Sustituir datos para VENTA
     */
    sustituirDatosVenta(html, datos, fotos) {
        const precioFormateado = `$${datos.precio.toLocaleString('es-MX')}`;

        // Reemplazos de meta tags
        html = html.replace(/<title>.*?<\/title>/i,
            `<title>${datos.titulo} - ${precioFormateado} | Hector es Bienes Raíces</title>`);

        html = html.replace(/<meta name="description" content=".*?">/i,
            `<meta name="description" content="${datos.descripcion}">`);

        // Carruseles
        html = this.sustituirCarrouselesVenta(html, fotos);

        return html;
    }

    /**
     * Sustituir carruseles para VENTA
     */
    sustituirCarrouselesVenta(html, fotos) {
        const slidesHtml = fotos.map((foto, index) => {
            const active = index === 0 ? 'active' : '';
            const loading = index === 0 ? 'eager' : 'lazy';
            return `                    <div class="carousel-slide ${active}" data-slide="${index}">
                        <img src="images/${foto}" alt="Foto ${index + 1}" class="carousel-image gallery-image main-image" loading="${loading}" decoding="async" width="800" height="600">
                    </div>`;
        }).join('\n');

        html = html.replace(/const totalSlides = \d+;/g, `const totalSlides = ${fotos.length};`);
        html = html.replace(/const totalSlidesHero = \d+;/g, `const totalSlidesHero = ${fotos.length};`);

        return html;
    }

    /**
     * Integrar en culiacan/index.html
     */
    async integrarEnListado(datos, fotos) {
        const indexPath = './culiacan/index.html';
        let html = fs.readFileSync(indexPath, 'utf8');

        const precioFormateado = `$${datos.precio.toLocaleString('es-MX')}`;

        let tarjetaHtml;

        if (datos.tipo === 'renta') {
            // TARJETA RENTA - ESTRUCTURA EXACTA CON BADGE NARANJA OBLIGATORIO
            tarjetaHtml = `
            <!-- BEGIN CARD-ADV ${datos.slug} -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
                 data-href="../casa-renta-${datos.slug}.html">
                <div class="relative aspect-video">
                    <!-- PRICE BADGE OBLIGATORIO (estructura EXACTA La Campiña) -->
                    <div class="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        ${precioFormateado}/mes
                    </div>

                    <!-- CAROUSEL CONTAINER - ESTRUCTURA COMPATIBLE CON JS EXISTENTE -->
                    <div class="carousel-container" data-current="0">
                        ${fotos.slice(0, 8).map((foto, index) => `
                        <img src="../images/${datos.slug}/${foto}"
                 alt="Casa en Renta ${datos.ubicacion} - Foto ${index + 1}"
                 loading="lazy"
                 decoding="async"
                 class="w-full h-full object-cover carousel-image ${index === 0 ? 'active' : 'hidden'}">`).join('')}

                        <!-- Navigation arrows - FUNCIONES EXISTENTES -->
                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)" aria-label="Imagen anterior">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)" aria-label="Siguiente imagen">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    <!-- Favoritos button -->
                    <button class="favorite-btn absolute top-3 left-3 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all duration-300 z-20">
                        <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                </div>

                <!-- CONTENT SECTION -->
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">${precioFormateado}/mes</h3>
                    <p class="text-gray-600 mb-4 font-poppins">Casa en Renta ${datos.ubicacion} · Culiacán</p>

                    <!-- PROPERTY DETAILS CON SVG ICONS (estructura EXACTA La Campiña) -->
                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            </svg>
                            ${datos.recamaras} Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            ${datos.banos} Baños
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                            </svg>
                            ${datos.terreno}m²
                        </div>
                    </div>

                    <!-- CTA BUTTON -->
                    <a href="../casa-renta-${datos.slug}.html"
                       class="block w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-center font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
                        Ver Detalles
                    </a>
                </div>
            </div>
            <!-- END CARD-ADV ${datos.slug} -->`;
        } else {
            // TARJETA VENTA - ESTRUCTURA EXACTA CON BADGE VERDE OBLIGATORIO
            tarjetaHtml = `
            <!-- BEGIN CARD-ADV ${datos.slug} -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
                 data-href="${datos.slug}/index.html">
                <div class="relative aspect-video">
                    <!-- PRICE BADGE VERDE OBLIGATORIO para VENTA -->
                    <div class="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        ${precioFormateado}
                    </div>

                    <!-- CAROUSEL CONTAINER - ESTRUCTURA COMPATIBLE CON JS EXISTENTE -->
                    <div class="carousel-container" data-current="0">
                        ${fotos.slice(0, 8).map((foto, index) => `
                        <img src="${datos.slug}/images/${foto}"
                 alt="Casa en Venta ${datos.ubicacion} - Foto ${index + 1}"
                 loading="lazy"
                 decoding="async"
                 class="w-full h-full object-cover carousel-image ${index === 0 ? 'active' : 'hidden'}">`).join('')}

                        <!-- Navigation arrows - FUNCIONES EXISTENTES -->
                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)" aria-label="Imagen anterior">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)" aria-label="Siguiente imagen">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    <!-- Favoritos button -->
                    <button class="favorite-btn absolute top-3 left-3 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all duration-300 z-20">
                        <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                </div>

                <!-- CONTENT SECTION -->
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">${precioFormateado}</h3>
                    <p class="text-gray-600 mb-4 font-poppins">Casa en Venta ${datos.ubicacion} · Culiacán</p>

                    <!-- PROPERTY DETAILS CON SVG ICONS (estructura EXACTA) -->
                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            </svg>
                            ${datos.recamaras} Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            ${datos.banos} Baños
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                            </svg>
                            ${datos.terreno}m²
                        </div>
                    </div>

                    <!-- CTA BUTTON CON GRADIENTE VERDE -->
                    <a href="${datos.slug}/index.html"
                       class="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
                        Ver Detalles
                    </a>
                </div>
            </div>
            <!-- END CARD-ADV ${datos.slug} -->`;
        }

        // Buscar dónde insertar (después del último card)
        const lastCardMatch = html.match(/<!-- END CARD-ADV [^\s]+ -->/g);
        if (lastCardMatch) {
            const lastCard = lastCardMatch[lastCardMatch.length - 1];
            html = html.replace(lastCard, lastCard + '\n' + tarjetaHtml);
        } else {
            throw new Error('No se encontró dónde insertar la tarjeta');
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
