#!/usr/bin/env node

/**
 * 🏗️ AGENTE CONSTRUCTOR DE PÁGINAS
 * 
 * Sistema automatizado para crear páginas de propiedades inmobiliarias
 * siguiendo el proceso exacto usado para Casa Portabelo.
 * 
 * Uso: node agente-constructor-paginas.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colores para terminal
const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

class AgenteConstructorPaginas {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.projectPath = process.cwd();
        this.imagesPath = path.join(this.projectPath, 'images');
        this.proyectosPath = '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS';
        
        console.log(`${colors.cyan}${colors.bold}`);
        console.log('🏗️  AGENTE CONSTRUCTOR DE PÁGINAS');
        console.log('=====================================');
        console.log(`${colors.reset}`);
    }

    async construirPagina() {
        try {
            console.log(`${colors.blue}📋 Iniciando construcción de nueva página...${colors.reset}\n`);
            
            // Recopilar datos de la propiedad
            const datos = await this.recopilarDatos();
            
            console.log(`${colors.yellow}🔄 Procesando datos...${colors.reset}`);
            
            // Validar y procesar fotos
            await this.procesarFotos(datos);
            
            // Generar página individual
            await this.generarPaginaIndividual(datos);
            
            // Actualizar index.html
            await this.actualizarIndexPrincipal(datos);
            
            // Actualizar culiacan/index.html
            await this.actualizarIndexCuliacan(datos);
            
            console.log(`${colors.green}${colors.bold}`);
            console.log('✅ ¡PÁGINA CREADA EXITOSAMENTE!');
            console.log('================================');
            console.log(`📄 Página: ${datos.slug}.html`);
            console.log(`🖼️  Fotos: images/${datos.slugDir}/ (${datos.fotos.length} fotos)`);
            console.log(`🏠 Fachada principal: ${datos.fotos[0].archivo}`);
            console.log(`🔗 URL: https://casasenventa.info/${datos.slug}/`);
            console.log(`${colors.reset}`);
            
            const abrir = await this.pregunta('¿Quieres abrir la página para verificar? (s/n): ');
            if (abrir.toLowerCase() === 's' || abrir.toLowerCase() === 'si') {
                require('child_process').exec(`open ${datos.slug}.html`);
            }
            
        } catch (error) {
            console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
        } finally {
            this.rl.close();
        }
    }

    async recopilarDatos() {
        console.log(`${colors.cyan}📝 Recopilando información de la propiedad...${colors.reset}\n`);
        
        const datos = {};
        
        // Tipo de propiedad
        datos.tipo = await this.pregunta('🏠 Tipo (venta/renta): ');
        if (!['venta', 'renta'].includes(datos.tipo.toLowerCase())) {
            throw new Error('Tipo debe ser "venta" o "renta"');
        }
        datos.tipo = datos.tipo.toLowerCase();
        
        // Nombre de la propiedad
        datos.nombre = await this.pregunta('📍 Nombre de la propiedad: ');
        
        // Ubicación
        datos.ubicacion = await this.pregunta('🗺️  Ubicación completa: ');
        
        // Precio
        datos.precio = await this.pregunta('💰 Precio (ej: $2,800,000 o "Consultar precio"): ');
        
        // Descripción
        datos.descripcion = await this.pregunta('📝 Descripción de la propiedad: ');
        if (datos.descripcion.length < 40) {
            throw new Error('La descripción debe tener al menos 40 caracteres');
        }
        
        // Características
        datos.recamaras = parseInt(await this.pregunta('🛏️  Número de recámaras: '));
        datos.banos = parseFloat(await this.pregunta('🚿 Número de baños: '));
        
        // Características extras
        console.log('✨ Características adicionales (presiona Enter sin texto para terminar):');
        datos.extras = [];
        let extra;
        do {
            extra = await this.pregunta('   - ');
            if (extra.trim()) datos.extras.push(extra.trim());
        } while (extra.trim());
        
        // Carpeta de fotos
        datos.carpetaFotos = await this.pregunta('📁 Nombre de la carpeta en PROYECTOS: ');
        datos.rutaFotos = path.join(this.proyectosPath, datos.carpetaFotos);
        
        // Generar slug
        datos.slug = this.generarSlug(datos.tipo, datos.nombre);
        datos.slugDir = datos.slug.replace('casa-venta-', '').replace('casa-renta-', '');
        
        // WhatsApp (opcional)
        const whatsapp = await this.pregunta('📱 WhatsApp personalizado (opcional, Enter para usar default): ');
        datos.whatsapp = whatsapp || this.generarWhatsAppDefault(datos);
        
        return datos;
    }

    async procesarFotos(datos) {
        console.log(`${colors.yellow}📸 Procesando fotos...${colors.reset}`);
        
        // Verificar que existe la carpeta de fotos
        if (!fs.existsSync(datos.rutaFotos)) {
            throw new Error(`No se encontró la carpeta: ${datos.rutaFotos}`);
        }
        
        // Leer fotos
        const archivos = fs.readdirSync(datos.rutaFotos);
        const fotos = archivos.filter(archivo => 
            /\.(jpg|jpeg|png)$/i.test(archivo)
        );
        
        if (fotos.length < 6) {
            throw new Error(`Se encontraron ${fotos.length} fotos, mínimo requerido: 6`);
        }
        
        console.log(`   ✅ Encontradas ${fotos.length} fotos`);
        
        // 🏠 DETECTAR FACHADA AUTOMÁTICAMENTE
        console.log(`${colors.cyan}   🔍 Detectando fachada automáticamente...${colors.reset}`);
        const fachada = this.detectarFachada(fotos);
        
        if (fachada.encontrada) {
            console.log(`   ✅ Fachada detectada: ${fachada.archivo}`);
        } else {
            console.log(`   ⚠️  Fachada no detectada, usando primera foto como fallback`);
        }
        
        // Reordenar fotos con fachada primera
        const fotosOrdenadas = this.organizarFotosConFachada(fotos, fachada);
        
        // Crear directorio de destino
        const destinoDir = path.join(this.imagesPath, datos.slugDir);
        if (!fs.existsSync(destinoDir)) {
            fs.mkdirSync(destinoDir, { recursive: true });
        }
        
        // Copiar y optimizar fotos (simulado - en producción usaría ImageMagick)
        datos.fotos = [];
        fotosOrdenadas.forEach((foto, index) => {
            const origen = path.join(datos.rutaFotos, foto);
            const destino = path.join(destinoDir, foto);
            
            // Copiar archivo
            fs.copyFileSync(origen, destino);
            
            datos.fotos.push({
                archivo: foto,
                ruta: `images/${datos.slugDir}/${foto}`,
                alt: this.generarAltText(foto, datos.nombre, index),
                esFachada: index === 0 // La primera siempre es la fachada
            });
        });
        
        console.log(`   ✅ ${fotosOrdenadas.length} fotos copiadas y optimizadas (fachada primera)`);
    }

    async generarPaginaIndividual(datos) {
        console.log(`${colors.yellow}📄 Generando página individual...${colors.reset}`);
        
        const template = this.obtenerTemplateCompleto(datos);
        const nombreArchivo = `${datos.slug}.html`;
        
        fs.writeFileSync(nombreArchivo, template, 'utf8');
        console.log(`   ✅ Página creada: ${nombreArchivo}`);
    }

    obtenerTemplateCompleto(datos) {
        const fotosCarrusel = datos.fotos.map((foto, index) => `
                    <div class="slide"><img src="${foto.ruta}" width="1200" height="800" decoding="async" ${index === 0 ? '' : 'loading="lazy" '}alt="${foto.alt}"></div>`).join('');
        
        const caracteristicasHTML = datos.extras.map(extra => 
            `                <div class="feature-card">
                    <i class="fas fa-check-circle"></i>
                    <h3>${extra}</h3>
                    <p>Incluido en esta propiedad</p>
                </div>`).join('\n');
        
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${datos.nombre} | Hector es Bienes Raíces</title>
    <meta name="description" content="${datos.descripcion}. ${datos.recamaras} recámaras, ${datos.banos} baños. Ubicada en ${datos.ubicacion}. ¡Contáctanos!">
    <meta name="keywords" content="casa ${datos.tipo} ${datos.ubicacion}, ${datos.recamaras} recámaras, ${datos.banos} baños">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://casasenventa.info/${datos.slug}/">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
    
    <!-- PWA Meta Tags -->
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="HectorBR">
    <meta name="theme-color" content="#ff4e00">
    <meta name="msapplication-TileColor" content="#ff4e00">
    <meta name="msapplication-TileImage" content="pwa-icon-144x144.png">
    <link rel="manifest" href="manifest.json">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${datos.nombre}">
    <meta property="og:description" content="${datos.descripcion}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://casasenventa.info/${datos.slug}/">
    <meta property="og:image" content="https://casasenventa.info/${datos.fotos[0].ruta}">
    
    <!-- Schema.org Structured Data for Property -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SingleFamilyResidence",
      "name": "${datos.nombre}",
      "description": "${datos.descripcion}",
      "url": "https://casasenventa.info/${datos.slug}/",
      "image": "https://casasenventa.info/${datos.fotos[0].ruta}",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "${datos.ubicacion}",
        "addressLocality": "Culiacán",
        "addressRegion": "Sinaloa",
        "addressCountry": "MX"
      },
      "numberOfRooms": "${datos.recamaras + datos.banos}",
      "numberOfBedrooms": "${datos.recamaras}",
      "numberOfBathroomsTotal": "${datos.banos}",
      "offers": {
        "@type": "Offer",
        "price": "${datos.precio.replace(/[$,]/g, '')}",
        "priceCurrency": "MXN",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "RealEstateAgent",
          "name": "Hector es Bienes Raíces",
          "telephone": "+52 811 165 2545",
          "email": "hector@bienesraices.mx",
          "url": "https://casasenventa.info"
        }
      }
    }
    </script>
    
    <!-- Performance Optimizations -->
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="dns-prefetch" href="//wa.me">
    <link rel="dns-prefetch" href="//api.whatsapp.com">
    
    <!-- Preload critical resources -->
    <link rel="preload" href="culiacan/infonavit-solidaridad/styles.css" as="style">
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" as="style">
    
    <!-- Styles -->
    <link rel="stylesheet" href="culiacan/infonavit-solidaridad/styles.css">
    
    <!-- Optimized font loading -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet" media="print" onload="this.media='all'; this.onload=null;">
    <noscript>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet">
    </noscript>
    
    <!-- Font Awesome optimizado -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <picture>
                    <img src="images/optimized/Logo-hector-es-bienes-raices.png" alt="Hector es Bienes Raíces" class="logo">
                </picture>
                <a href="#contact" class="cta-button">Contactar</a>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-content">
            <h1 class="hero-title">${datos.nombre}</h1>
            <p class="hero-subtitle">${datos.descripcion}</p>
            <a href="#gallery" class="hero-cta">Ver Fotos</a>
        </div>
        <div class="hero-image">
            <div class="carousel" data-count="${datos.fotos.length}">
                <button class="arrow prev" aria-label="Anterior">‹</button>
                <div class="carousel-track">${fotosCarrusel}
                </div>
                <button class="arrow next" aria-label="Siguiente">›</button>
                <div class="dots"></div>
            </div>
            
            <!-- Price Badge -->
            <div class="price-badge">
                <span class="price-amount">${datos.precio}</span>
                <span class="price-label">En ${datos.tipo.charAt(0).toUpperCase() + datos.tipo.slice(1)}</span>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
        <div class="container">
            <h2 class="section-title">Características Principales</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <i class="fas fa-bed"></i>
                    <h3>${datos.recamaras} Recámara${datos.recamaras > 1 ? 's' : ''}</h3>
                    <p>Habitacion${datos.recamaras > 1 ? 'es' : ''} espaciosa${datos.recamaras > 1 ? 's' : ''} con excelente iluminación natural</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-bath"></i>
                    <h3>${datos.banos} Baño${datos.banos > 1 ? 's' : ''}</h3>
                    <p>Baño${datos.banos > 1 ? 's' : ''} completo${datos.banos > 1 ? 's' : ''} con acabados de calidad</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>Ubicación Privilegiada</h3>
                    <p>Excelente ubicación en ${datos.ubicacion}</p>
                </div>
${caracteristicasHTML}
            </div>
        </div>
    </section>

    <!-- Gallery Carousel Section -->
    <section class="gallery" id="gallery">
        <div class="container">
            <h2 class="section-title">Galería de Fotos</h2>
            <div class="carousel" data-count="${datos.fotos.length}">
                <button class="arrow prev" aria-label="Anterior">‹</button>
                <div class="carousel-track">${fotosCarrusel}
                </div>
                <button class="arrow next" aria-label="Siguiente">›</button>
                <div class="dots"></div>
            </div>
        </div>
    </section>

    <!-- Details Section -->
    <section class="details">
        <div class="container">
            <div class="details-content">
                <div class="details-info">
                    <h2>Información Detallada</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Ubicación:</strong>
                            <span>${datos.ubicacion}</span>
                        </div>
                        <div class="info-item">
                            <strong>Recámaras:</strong>
                            <span>${datos.recamaras}</span>
                        </div>
                        <div class="info-item">
                            <strong>Baños:</strong>
                            <span>${datos.banos}</span>
                        </div>
                        <div class="info-item">
                            <strong>Estado:</strong>
                            <span>Lista para habitar</span>
                        </div>
                    </div>
                </div>
                <div class="price-card">
                    <h3>Precio de ${datos.tipo.charAt(0).toUpperCase() + datos.tipo.slice(1)}</h3>
                    <div class="price">${datos.precio}</div>
                    <p class="price-note">${datos.descripcion.substring(0, 100)}...</p>
                    <a href="#contact" class="price-cta">Más Información</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Calculator Section -->
    <section class="simple-calc" id="calculadora">
        <div class="container">
            <h2>🏠 Calculadora de ${datos.tipo === 'venta' ? 'Hipoteca' : 'Renta'}</h2>
            <div class="calc-box">
                ${datos.tipo === 'venta' ? this.getCalculadoraVenta(datos.precio) : this.getCalculadoraRenta(datos.precio)}
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section class="contact" id="contact">
        <div class="container">
            <h2 class="section-title">¿Interesado?</h2>
            <p class="contact-subtitle">Contáctanos para más información o para agendar una visita</p>
            <div class="contact-buttons">
                <a href="${datos.whatsapp}" 
                   class="whatsapp-button" target="_blank">
                    <i class="fab fa-whatsapp"></i>
                    Contactar por WhatsApp
                </a>
                <a href="tel:+528111652545" class="phone-button">
                    <i class="fas fa-phone"></i>
                    Llamar Ahora
                </a>
            </div>
            <div class="contact-info">
                <p><i class="fas fa-map-marker-alt"></i> ${datos.ubicacion}</p>
                <p><i class="fas fa-phone"></i> +52 811 165 2545</p>
                <p><i class="fas fa-envelope"></i> hector@bienesraices.mx</p>
            </div>
        </div>
    </section>

    <!-- WhatsApp Floating Button -->
    <a href="${datos.whatsapp}" 
       class="whatsapp-float" target="_blank" rel="noopener noreferrer">
        <i class="fab fa-whatsapp"></i>
        <span class="whatsapp-text">Escríbenos en WhatsApp</span>
    </a>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Hector es Bienes Raíces. Todos los derechos reservados.</p>
        </div>
    </footer>

    <!-- BEGIN: CAROUSEL CORE -->
    <style>
    .carousel { position: relative; overflow: hidden; }
    .carousel-track { display: flex; transition: transform .35s ease; will-change: transform; }
    .slide { flex: 0 0 100%; min-width: 100%; }
    .arrow { position:absolute; top:50%; transform:translateY(-50%); border:0; background:#0008; color:#fff; width:36px; height:36px; border-radius:999px; display:grid; place-items:center; cursor:pointer; z-index: 10; }
    .arrow.prev { left:8px; } .arrow.next { right:8px; }
    .dots { position:absolute; left:0; right:0; bottom:8px; display:flex; gap:6px; justify-content:center; z-index: 11; }
    .dots button { width:8px; height:8px; border-radius:999px; border:0; background:#fff8; cursor:pointer; }
    .dots button[aria-current="true"] { background:#fff; }
    </style>
    <script>
    (function(){
      if (window.__carouselCoreLoaded__) return;
      window.__carouselCoreLoaded__ = true;

      function initCarousel(root){
        const track = root.querySelector('.carousel-track');
        const slides = Array.from(root.querySelectorAll('.slide'));
        const prev = root.querySelector('.arrow.prev');
        const next = root.querySelector('.arrow.next');
        const dotsWrap = root.querySelector('.dots');
        if(!track || slides.length===0 || !prev || !next || !dotsWrap) return;

        dotsWrap.innerHTML = '';
        slides.forEach((_,i)=>{
          const b=document.createElement('button');
          b.type='button';
          b.setAttribute('aria-label','Ir a foto '+(i+1));
          b.addEventListener('click',()=>go(i));
          dotsWrap.appendChild(b);
        });

        let idx=0, w=0, rafId=null;

        function measure(){
          w = root.clientWidth;
          slides.forEach(s=>s.style.minWidth = w+'px');
          move();
        }

        function move(){
          track.style.transform = 'translateX(' + (-idx*w) + 'px)';
          dotsWrap.querySelectorAll('button').forEach((d,i)=>d.setAttribute('aria-current', i===idx ? 'true':'false'));
        }

        function go(i){
          idx = (i+slides.length)%slides.length;
          move();
        }

        prev.addEventListener('click', ()=>go(idx-1));
        next.addEventListener('click', ()=>go(idx+1));

        let sx=0, dx=0, dragging=false;
        track.addEventListener('pointerdown', e=>{ dragging=true; sx=e.clientX; track.setPointerCapture(e.pointerId); });
        track.addEventListener('pointermove', e=>{
          if(!dragging) return;
          dx=e.clientX - sx;
          track.style.transition='none';
          track.style.transform = 'translateX(' + (-idx*w + (-dx)) + 'px)';
        });
        track.addEventListener('pointerup', e=>{
          track.style.transition='';
          dragging=false;
          if(Math.abs(dx)>w*0.2) go(idx + (dx<0?1:-1)); else move();
          dx=0;
        });

        window.addEventListener('resize', ()=>{
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(measure);
        });

        const firstImg = slides[0].querySelector('img');
        if (firstImg && firstImg.complete) measure();
        else firstImg && firstImg.addEventListener('load', measure, {once:true});
        setTimeout(measure, 300);
      }

      function autoInit(){
        document.querySelectorAll('.carousel').forEach(initCarousel);
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
      else autoInit();

      document.addEventListener('DOMContentLoaded', function() {
        ${datos.tipo === 'venta' ? this.getCalculadoraJS('venta') : this.getCalculadoraJS('renta')}
      });
    })();
    </script>
    <!-- END: CAROUSEL CORE -->

</body>
</html>`;
    }

    getCalculadoraVenta(precio) {
        const precioNumerico = precio.replace(/[$,]/g, '') || '2800000';
        return `
                <div class="input-group">
                    <label>Precio de la casa:</label>
                    <input type="number" id="precio" value="${precioNumerico}" min="100000" step="10000">
                </div>
                
                <div class="input-group">
                    <label>Enganche (%):</label>
                    <input type="range" id="enganche" min="5" max="50" value="5" oninput="updateEnganche()">
                    <span id="engancheDisplay">5% = $140,000</span>
                </div>
                
                <div class="input-group">
                    <label>Años:</label>
                    <select id="anos">
                        <option value="10">10 años</option>
                        <option value="15">15 años</option>
                        <option value="20" selected>20 años</option>
                        <option value="25">25 años</option>
                        <option value="30">30 años</option>
                    </select>
                </div>
                
                <div class="input-group">
                    <label>Banco:</label>
                    <select id="banco">
                        <option value="3.76">INFONAVIT Bajo - 3.76%</option>
                        <option value="6.5">INFONAVIT Medio - 6.5%</option>
                        <option value="10.45">INFONAVIT Alto - 10.45%</option>
                        <option value="9.9">FOVISSSTE - 9.9%</option>
                        <option value="10.45" selected>HSBC - 10.45%</option>
                        <option value="11.75">Banamex - 11.75%</option>
                        <option value="13.25">Santander - 13.25%</option>
                    </select>
                </div>
                
                <button onclick="calcular()" class="calc-btn">🧮 CALCULAR</button>
                
                <div class="result-box">
                    <h3>💳 Pago Mensual: <span id="resultado">$0</span></h3>
                    <p>📊 Monto del crédito: <span id="credito">$0</span></p>
                    <p>📈 Tasa: <span id="tasa">0%</span></p>
                    <p>💎 Total a pagar: <span id="total">$0</span></p>
                </div>`;
    }

    getCalculadoraRenta(precio) {
        return `
                <div class="input-group">
                    <label>Renta mensual estimada:</label>
                    <input type="number" id="renta" value="25000" min="5000" step="1000">
                </div>
                
                <div class="input-group">
                    <label>Depósito (meses):</label>
                    <select id="deposito">
                        <option value="1">1 mes</option>
                        <option value="2" selected>2 meses</option>
                        <option value="3">3 meses</option>
                    </select>
                </div>
                
                <button onclick="calcularRenta()" class="calc-btn">🧮 CALCULAR</button>
                
                <div class="result-box">
                    <h3>💰 Costo inicial: <span id="inicial">$0</span></h3>
                    <p>🏠 Renta mensual: <span id="mensual">$0</span></p>
                    <p>🔐 Depósito: <span id="depositoMonto">$0</span></p>
                    <p>📋 Total para ingresar: <span id="totalInicio">$0</span></p>
                </div>`;
    }

    getCalculadoraJS(tipo) {
        if (tipo === 'venta') {
            return `
        function updateEnganche() {
            const precio = document.getElementById('precio').value || 2800000;
            const porcentaje = document.getElementById('enganche').value;
            const monto = precio * (porcentaje / 100);
            document.getElementById('engancheDisplay').textContent = 
                porcentaje + '% = $' + monto.toLocaleString('es-MX');
        }

        function calcular() {
            const precio = parseFloat(document.getElementById('precio').value) || 2800000;
            const enganchePorcentaje = parseFloat(document.getElementById('enganche').value) || 5;
            const anos = parseInt(document.getElementById('anos').value) || 20;
            const tasaAnual = parseFloat(document.getElementById('banco').value) || 10.45;

            const engancheMonto = precio * (enganchePorcentaje / 100);
            const montoCredito = precio - engancheMonto;
            const tasaMensual = tasaAnual / 100 / 12;
            const numeroPageos = anos * 12;

            let pagoMensual;
            if (tasaMensual === 0) {
                pagoMensual = montoCredito / numeroPageos;
            } else {
                pagoMensual = montoCredito * 
                    (tasaMensual * Math.pow(1 + tasaMensual, numeroPageos)) / 
                    (Math.pow(1 + tasaMensual, numeroPageos) - 1);
            }

            const totalPagar = pagoMensual * numeroPageos;

            document.getElementById('resultado').textContent = '$' + Math.round(pagoMensual).toLocaleString('es-MX');
            document.getElementById('credito').textContent = '$' + Math.round(montoCredito).toLocaleString('es-MX');
            document.getElementById('tasa').textContent = tasaAnual + '%';
            document.getElementById('total').textContent = '$' + Math.round(totalPagar).toLocaleString('es-MX');
        }

        updateEnganche();
        calcular();
        window.updateEnganche = updateEnganche;
        window.calcular = calcular;`;
        } else {
            return `
        function calcularRenta() {
            const renta = parseFloat(document.getElementById('renta').value) || 25000;
            const mesesDeposito = parseInt(document.getElementById('deposito').value) || 2;
            
            const deposito = renta * mesesDeposito;
            const inicial = renta + deposito; // primer mes + depósito
            
            document.getElementById('mensual').textContent = '$' + renta.toLocaleString('es-MX');
            document.getElementById('depositoMonto').textContent = '$' + deposito.toLocaleString('es-MX');
            document.getElementById('inicial').textContent = '$' + renta.toLocaleString('es-MX');
            document.getElementById('totalInicio').textContent = '$' + inicial.toLocaleString('es-MX');
        }
        
        calcularRenta();
        window.calcularRenta = calcularRenta;`;
        }
    }

    async actualizarIndexPrincipal(datos) {
        console.log(`${colors.yellow}🔄 Actualizando index.html...${colors.reset}`);
        
        const indexPath = 'index.html';
        if (!fs.existsSync(indexPath)) {
            console.log(`   ⚠️  ${indexPath} no encontrado, saltando...`);
            return;
        }
        
        const contenido = fs.readFileSync(indexPath, 'utf8');
        const tarjetaSimple = this.generarTarjetaSimple(datos);
        
        // Buscar donde insertar (después de properties-grid o similar)
        const patron = /(<div[^>]*class="properties-grid"[^>]*>)/i;
        if (patron.test(contenido)) {
            const nuevoContenido = contenido.replace(patron, `$1\n${tarjetaSimple}`);
            fs.writeFileSync(indexPath, nuevoContenido, 'utf8');
            console.log(`   ✅ Tarjeta agregada a index.html`);
        } else {
            console.log(`   ⚠️  No se encontró properties-grid en index.html`);
        }
    }

    async actualizarIndexCuliacan(datos) {
        console.log(`${colors.yellow}🔄 Actualizando culiacan/index.html...${colors.reset}`);
        
        const culiacanPath = 'culiacan/index.html';
        if (!fs.existsSync(culiacanPath)) {
            console.log(`   ⚠️  ${culiacanPath} no encontrado, saltando...`);
            return;
        }
        
        const contenido = fs.readFileSync(culiacanPath, 'utf8');
        const tarjetaAvanzada = this.generarTarjetaAvanzada(datos);
        
        // Buscar donde insertar (grid de Culiacán)
        const patron = /(<div[^>]*class="grid[^"]*grid-cols[^>]*>)/i;
        if (patron.test(contenido)) {
            const nuevoContenido = contenido.replace(patron, `$1\n${tarjetaAvanzada}`);
            fs.writeFileSync(culiacanPath, nuevoContenido, 'utf8');
            console.log(`   ✅ Tarjeta avanzada agregada a culiacan/index.html`);
        } else {
            console.log(`   ⚠️  No se encontró grid en culiacan/index.html`);
        }
    }

    generarTarjetaSimple(datos) {
        return `
        <!-- BEGIN CARD ${datos.slugDir} -->
        <a href="${datos.slug}.html" class="property-card">
            <img src="${datos.fotos[0].ruta}" alt="Fachada ${datos.nombre}" class="property-image" loading="lazy">
            <div class="property-content">
                <div class="property-badge ${datos.tipo}">${datos.tipo.toUpperCase()}</div>
                <h3 class="property-title">${datos.nombre}</h3>
                <p class="property-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${datos.ubicacion}
                </p>
                <div class="property-price">${datos.precio}</div>
                <div class="property-features">
                    <span class="feature">${datos.recamaras} Recámaras</span>
                    <span class="feature">${datos.banos} Baños</span>
                    ${datos.extras.slice(0, 2).map(extra => `<span class="feature">${extra}</span>`).join('\n                    ')}
                </div>
                <div class="property-cta">Ver Detalles Completos</div>
            </div>
        </a>
        <!-- END CARD ${datos.slugDir} -->`;
    }

    generarTarjetaAvanzada(datos) {
        // ⚠️ CRÍTICO: Usar estructura .carousel-container para consistencia con culiacan/index.html
        // LECCIÓN APRENDIDA: No usar .carousel + .carousel-track (incompatible con JS existente)
        // 
        // 🎨 ESTÁNDARES DE BADGES DE PRECIO:
        // - VENTA: bg-orange-500 (naranja)
        // - RENTA: bg-green-500 (verde)
        // Para consistencia visual en toda la plataforma
        const fotosLimitadas = datos.fotos.slice(0, 6); // Máximo 6 fotos para performance
        
        const fotosCarrusel = fotosLimitadas.map((foto, index) => 
            `<img src="../${foto.ruta}" 
                 alt="${foto.alt}" 
                 loading="lazy" 
                 decoding="async"
                 class="w-full h-full object-cover carousel-image ${index === 0 ? 'active' : 'hidden'}">`
        ).join('\n                        ');
        
        const dotsCarrusel = fotosLimitadas.map((_, index) => 
            `<button class="carousel-dot ${index === 0 ? 'active' : ''}" onclick="goToImage(this.parentElement.parentElement, ${index})" aria-label="Ir a imagen ${index + 1}"></button>`
        ).join('\n                            ');
        
        return `
            <!-- BEGIN CARD-ADV ${datos.slugDir} -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative" 
                 data-href="../${datos.slug}.html">
                <div class="relative aspect-video">
                    <!-- PRICE BADGE OBLIGATORIO -->
                    <div class="absolute top-3 right-3 ${datos.tipo === 'venta' ? 'bg-orange-500' : 'bg-green-500'} text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        ${datos.precio}
                    </div>
                    
                    <!-- CAROUSEL CONTAINER - ESTRUCTURA COMPATIBLE CON JS EXISTENTE -->
                    <div class="carousel-container" data-current="0">
                        ${fotosCarrusel}
                        
                        <!-- Navigation arrows - FUNCIONES EXISTENTES -->
                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)" aria-label="Imagen anterior">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)" aria-label="Siguiente imagen">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        
                        <!-- Dot indicators - FUNCIONES EXISTENTES -->
                        <div class="carousel-dots">
                            ${dotsCarrusel}
                        </div>
                    </div>
                    
                    <!-- FAVORITE ICON -->
                    <button class="absolute top-3 left-3 bg-white/80 hover:bg-white rounded-full p-2 transition-colors z-10">
                        <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                </div>
                
                <!-- CONTENT SECTION -->
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">${datos.precio}</h3>
                    <p class="text-gray-600 mb-4 font-poppins">${this.acortarTitulo(datos.nombre)} · ${this.acortarUbicacion(datos.ubicacion)}</p>
                    
                    <!-- PROPERTY DETAILS CON SVG ICONS -->
                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            </svg>
                            ${datos.recamaras} Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l3-3 3 3M5 10v11a1 1 0 001 1h3M20 10v11a1 1 0 01-1 1h-3"></path>
                            </svg>
                            ${datos.banos} Baños
                        </div>
                        ${datos.extras.slice(0, 2).map(extra => 
                            `<div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                ${this.acortarCaracteristica(extra)}
                            </div>`).join('\n                        ')}
                    </div>
                    
                    <!-- WHATSAPP BUTTON -->
                    <a href="${datos.whatsapp}" 
                       class="w-full btn-primary text-center block" 
                       target="_blank" rel="noopener noreferrer">
                        <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"></path>
                        </svg>
                        Solicitar tour
                    </a>
                </div>
            </div>
            <!-- END CARD-ADV ${datos.slugDir} -->`;
    }

    generarSlug(tipo, nombre) {
        const slug = nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        
        return `casa-${tipo}-${slug}`;
    }

    generarAltText(archivo, nombrePropiedad, index) {
        const nombre = archivo.toLowerCase();
        
        // La primera foto siempre es la fachada (ya organizada)
        if (index === 0) {
            return `Fachada ${nombrePropiedad}`;
        }
        
        // Detectar tipo de habitación por nombre de archivo
        if (nombre.includes('sala') || nombre.includes('living')) {
            return `Sala ${nombrePropiedad}`;
        } else if (nombre.includes('cocina') || nombre.includes('kitchen')) {
            return `Cocina ${nombrePropiedad}`;
        } else if (nombre.includes('comedor') || nombre.includes('dining')) {
            return `Comedor ${nombrePropiedad}`;
        } else if (nombre.includes('recamara') || nombre.includes('bedroom') || nombre.includes('dormit')) {
            return `Recámara ${nombrePropiedad}`;
        } else if (nombre.includes('bano') || nombre.includes('baño') || nombre.includes('bath')) {
            return `Baño ${nombrePropiedad}`;
        } else if (nombre.includes('garage') || nombre.includes('cochera') || nombre.includes('estacion')) {
            return `Cochera ${nombrePropiedad}`;
        } else if (nombre.includes('patio') || nombre.includes('jardin') || nombre.includes('garden')) {
            return `Patio ${nombrePropiedad}`;
        } else if (nombre.includes('pasillo') || nombre.includes('hall')) {
            return `Pasillo ${nombrePropiedad}`;
        } else if (nombre.includes('escalera') || nombre.includes('stair')) {
            return `Escaleras ${nombrePropiedad}`;
        } else if (nombre.includes('terraza') || nombre.includes('balcon')) {
            return `Terraza ${nombrePropiedad}`;
        } else if (nombre.includes('exterior') || nombre.includes('frente')) {
            return `Vista exterior ${nombrePropiedad}`;
        } else {
            // Para fotos sin patrón específico, usar numeración
            return `Vista interior ${nombrePropiedad} - Foto ${index + 1}`;
        }
    }

    generarWhatsAppDefault(datos) {
        const mensaje = `Hola%2C%20me%20interesa%20la%20casa%20en%20${datos.tipo}%20en%20${encodeURIComponent(datos.ubicacion)}%20por%20${encodeURIComponent(datos.precio)}.%20%C2%BFPodr%C3%ADa%20darme%20m%C3%A1s%20informaci%C3%B3n%3F`;
        return `https://wa.me/528111652545?text=${mensaje}`;
    }

    /**
     * 🏠 DETECTOR AUTOMÁTICO DE FACHADA
     * Basado en los patrones exitosos del documento 1
     */
    detectarFachada(fotos) {
        console.log(`${colors.blue}   📋 Analizando ${fotos.length} fotos para detectar fachada...${colors.reset}`);
        
        // PATRONES DE DETECCIÓN (en orden de prioridad)
        const patrones = [
            // Patrones principales
            { patron: /fachada/i, prioridad: 1, descripcion: 'Contains "fachada"' },
            { patron: /exterior/i, prioridad: 2, descripcion: 'Contains "exterior"' },
            { patron: /frente/i, prioridad: 3, descripcion: 'Contains "frente"' },
            { patron: /-01\./i, prioridad: 4, descripcion: 'Ends with "-01."' },
            { patron: /foto-01/i, prioridad: 5, descripcion: 'Contains "foto-01"' },
            
            // Patrones secundarios
            { patron: /^01/i, prioridad: 6, descripcion: 'Starts with "01"' },
            { patron: /entrada/i, prioridad: 7, descripcion: 'Contains "entrada"' },
            { patron: /casa/i, prioridad: 8, descripcion: 'Contains "casa"' }
        ];
        
        let mejorCoincidencia = null;
        
        // Buscar la mejor coincidencia
        for (const foto of fotos) {
            for (const { patron, prioridad, descripcion } of patrones) {
                if (patron.test(foto)) {
                    console.log(`   🎯 Coincidencia encontrada: "${foto}" (${descripcion})`);
                    
                    if (!mejorCoincidencia || prioridad < mejorCoincidencia.prioridad) {
                        mejorCoincidencia = {
                            archivo: foto,
                            prioridad,
                            descripcion,
                            encontrada: true
                        };
                    }
                }
            }
        }
        
        // Si no se encontró ningún patrón, usar fallback
        if (!mejorCoincidencia) {
            console.log(`   📍 Usando fallback: primera foto alfabéticamente`);
            const primeraFoto = fotos.sort()[0];
            return {
                archivo: primeraFoto,
                prioridad: 99,
                descripcion: 'Primera foto alfabéticamente (fallback)',
                encontrada: false
            };
        }
        
        console.log(`   ✅ Mejor coincidencia: "${mejorCoincidencia.archivo}" (${mejorCoincidencia.descripcion})`);
        return mejorCoincidencia;
    }

    /**
     * 📁 ORGANIZADOR DE FOTOS CON FACHADA PRIMERA
     * Coloca la fachada detectada como primera foto
     */
    organizarFotosConFachada(fotos, fachada) {
        const fotosOrganizadas = [...fotos];
        
        // Si se detectó una fachada específica, moverla al inicio
        if (fachada.encontrada && fachada.archivo) {
            // Remover la fachada de su posición actual
            const indiceFachada = fotosOrganizadas.indexOf(fachada.archivo);
            if (indiceFachada > 0) {
                fotosOrganizadas.splice(indiceFachada, 1);
                // Insertar al inicio
                fotosOrganizadas.unshift(fachada.archivo);
                console.log(`   🔄 Fachada movida a posición principal`);
            } else if (indiceFachada === 0) {
                console.log(`   ✅ Fachada ya está en primera posición`);
            }
        } else {
            // Fallback: ordenar alfabéticamente para consistencia
            fotosOrganizadas.sort();
            console.log(`   📋 Fotos ordenadas alfabéticamente (fallback)`);
        }
        
        console.log(`   📊 Orden final: ${fotosOrganizadas.slice(0, 3).join(', ')}${fotosOrganizadas.length > 3 ? '...' : ''}`);
        return fotosOrganizadas;
    }

    async pregunta(texto) {
        return new Promise((resolve) => {
            this.rl.question(`${colors.cyan}${texto}${colors.reset}`, (respuesta) => {
                resolve(respuesta.trim());
            });
        });
    }
}

// Ejecutar el agente
if (require.main === module) {
    const agente = new AgenteConstructorPaginas();
    agente.construirPagina().catch(error => {
        console.error(`${colors.red}Error fatal:${colors.reset}`, error.message);
        process.exit(1);
    });
}

module.exports = AgenteConstructorPaginas;