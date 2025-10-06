const fs = require('fs');
const path = require('path');

/**
 * GENERADOR AUTOMÁTICO DE PÁGINAS DESDE JSON WIGGOT
 *
 * USO: node generador-pagina-wiggot.js wiggot-datos-pODipRm.json
 *
 * GENERA:
 * - Carpeta completa: culiacan/casa-venta-[slug]/
 * - HTML con TODOS los datos correctos
 * - Descarga automática de las 14 fotos
 * - Sin necesidad de copiar templates antiguos
 */

function generarSlug(titulo) {
    return titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
}

function generarHTML(datos, slug) {
    const photoCount = datos.images.length;

    // Generar slides del carrusel hero
    const carouselSlides = datos.images.map((img, i) => `
                <div class="carousel-slide${i === 0 ? ' active' : ''}" data-slide="${i}">
                    <img src="images/foto-${i + 1}.jpg" alt="Foto ${i + 1} - ${datos.title}">
                </div>`).join('');

    // Generar dots del carrusel
    const carouselDots = datos.images.map((img, i) => `
                <span class="carousel-dot${i === 0 ? ' active' : ''}" data-slide="${i}"></span>`).join('');

    // Generar array de imágenes para lightbox
    const lightboxArray = datos.images.map((img, i) => `        'images/foto-${i + 1}.jpg'`).join(',\n');

    // Generar Schema.org image array
    const schemaImages = datos.images.map((img, i) =>
        `        "https://casasenventa.info/culiacan/${slug}/images/foto-${i + 1}.jpg"`
    ).join(',\n');

    // Descripción limpia para meta tags
    const descriptionClean = datos.description
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 150);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Casa en Venta $${datos.price} - ${datos.location} | Hector es Bienes Raíces</title>
    <meta name="description" content="${descriptionClean}">
    <meta name="keywords" content="casa venta Culiacán, ${datos.location}, ${datos.bedrooms} recámaras, ${datos.bathrooms} baños">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://casasenventa.info/culiacan/${slug}/">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="../../favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="../../favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="../../favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../../apple-touch-icon.png">

    <!-- PWA Meta Tags -->
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="HectorBR">
    <meta name="theme-color" content="#ff4e00">
    <meta name="msapplication-TileColor" content="#ff4e00">
    <meta name="msapplication-TileImage" content="../../pwa-icon-144x144.png">
    <link rel="manifest" href="../../manifest.json">

    <!-- Open Graph -->
    <meta property="og:title" content="Casa en Venta $${datos.price} - ${datos.location}">
    <meta property="og:description" content="${descriptionClean}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://casasenventa.info/culiacan/${slug}/">
    <meta property="og:image" content="https://casasenventa.info/culiacan/${slug}/images/foto-1.jpg">

    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SingleFamilyResidence",
      "name": "${datos.title}",
      "description": "${descriptionClean}",
      "url": "https://casasenventa.info/culiacan/${slug}/",
      "image": [
${schemaImages}
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "${datos.location}",
        "addressLocality": "Culiacán",
        "addressRegion": "Sinaloa",
        "postalCode": "80000",
        "addressCountry": "MX"
      },
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": ${datos.area_terreno},
        "unitCode": "MTK"
      },
      "numberOfBedrooms": ${datos.bedrooms},
      "numberOfBathroomsTotal": ${datos.bathrooms},
      "offers": {
        "@type": "Offer",
        "price": "${datos.price.replace(/,/g, '')}",
        "priceCurrency": "MXN"
      }
    }
    </script>

    <!-- Preload critical resources -->
    <link rel="preload" href="../../styles.css" as="style">
    <link rel="preload" href="images/foto-1.jpg" as="image">

    <link rel="stylesheet" href="../../styles.css">

    <!-- Optimized font loading -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap"></noscript>

    <!-- Font Awesome -->
    <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"></noscript>

    <style>
        /* Carrusel fix crítico */
        .hero-image .carousel-wrapper {
            position: relative !important;
            overflow: hidden !important;
        }
        .hero-image .carousel-slide {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            opacity: 0 !important;
            transition: opacity 0.5s ease-in-out !important;
        }
        .hero-image .carousel-slide.active {
            opacity: 1 !important;
            z-index: 1 !important;
        }
        .hero-image .carousel-arrow {
            background: rgba(255, 78, 0, 0.9) !important;
            color: white !important;
            border: none !important;
            width: 50px !important;
            height: 50px !important;
            border-radius: 50% !important;
            font-size: 20px !important;
            cursor: pointer !important;
            z-index: 10 !important;
            transition: all 0.3s ease !important;
        }
        .hero-image .carousel-arrow:hover {
            background: rgba(255, 78, 0, 1) !important;
            transform: scale(1.1) !important;
        }
    </style>
</head>
<body>

    <!-- Hero Section con Carrusel -->
    <section class="hero-image">
        <div class="carousel-wrapper">
${carouselSlides}

            <!-- Navigation arrows -->
            <button class="carousel-arrow carousel-prev" onclick="changeSlideHero(-1); openLightboxFromCarousel();">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="carousel-arrow carousel-next" onclick="changeSlideHero(1); openLightboxFromCarousel();">
                <i class="fas fa-chevron-right"></i>
            </button>

            <!-- Dots Navigation -->
            <div class="carousel-dots">
${carouselDots}
            </div>
        </div>

        <div class="hero-overlay">
            <div class="description-box">
                <h1>${datos.title}</h1>
                <p class="subtitle">${datos.location}</p>
                <p class="price">$${datos.price} MXN</p>
                <a href="https://wa.me/526677093648?text=Hola,%20me%20interesa%20la%20propiedad%20en%20${encodeURIComponent(datos.location)}%20por%20$${datos.price}" class="cta-button" target="_blank">
                    <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                </a>
            </div>
        </div>
    </section>

    <!-- Sticky Price Bar -->
    <div class="sticky-price-bar" id="stickyPriceBar">
        <div class="container-sticky">
            <span class="sticky-price">$${datos.price}</span>
            <a href="https://wa.me/526677093648?text=Hola,%20me%20interesa%20esta%20propiedad%20por%20$${datos.price}" class="sticky-whatsapp" target="_blank">
                <i class="fab fa-whatsapp"></i>
                <span class="sticky-whatsapp-text">Contactar</span>
            </a>
        </div>
    </div>

    <!-- Features Section -->
    <section class="features scroll-animate">
        <div class="container">
            <div class="features-grid">
                <div class="feature-card">
                    <i class="fas fa-bed"></i>
                    <h3>${datos.bedrooms}</h3>
                    <p>Recámaras</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-bath"></i>
                    <h3>${datos.bathrooms}</h3>
                    <p>Baños</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-ruler-combined"></i>
                    <h3>${datos.area_construida}m²</h3>
                    <p>Construcción</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-vector-square"></i>
                    <h3>${datos.area_terreno}m²</h3>
                    <p>Terreno</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-car"></i>
                    <h3>${datos.estacionamientos}</h3>
                    <p>Estacionamientos</p>
                </div>
                <div class="feature-card">
                    <i class="fas fa-building"></i>
                    <h3>${datos.niveles}</h3>
                    <p>${datos.niveles > 1 ? 'Niveles' : 'Nivel'}</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Description Section -->
    <section class="description scroll-animate">
        <div class="container">
            <h2 class="section-title">Descripción de la Propiedad</h2>
            <div class="description-content">
                <p>${datos.description.replace(/\n/g, '<br>')}</p>
            </div>
        </div>
    </section>

    <!-- Calculator Section -->
    <section class="calculator scroll-animate">
        <div class="container">
            <h2 class="section-title">Calculadora de Hipoteca</h2>
            <div class="calculator-container">
                <div class="calculator-input-group">
                    <label for="precio">Precio de la Propiedad</label>
                    <input type="number" id="precio" value="${datos.price.replace(/,/g, '')}" step="1000">
                </div>
                <div class="calculator-input-group">
                    <label for="enganche">Enganche (%)</label>
                    <input type="range" id="enganche" min="0" max="50" value="20" step="5">
                    <span id="engancheDisplay">20% = $${Math.round(parseInt(datos.price.replace(/,/g, '')) * 0.2).toLocaleString()}</span>
                </div>
                <div class="calculator-input-group">
                    <label for="plazo">Plazo (años)</label>
                    <select id="plazo">
                        <option value="5">5 años</option>
                        <option value="10">10 años</option>
                        <option value="15">15 años</option>
                        <option value="20" selected>20 años</option>
                        <option value="25">25 años</option>
                        <option value="30">30 años</option>
                    </select>
                </div>
                <div class="calculator-input-group">
                    <label for="interes">Tasa de Interés Anual (%)</label>
                    <input type="range" id="interes" min="5" max="15" value="10.5" step="0.5">
                    <span id="interesDisplay">10.5%</span>
                </div>
                <div class="calculator-result">
                    <h3>Pago Mensual Estimado</h3>
                    <p class="monthly-payment" id="pagoMensual">$0</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section class="contact scroll-animate">
        <div class="container">
            <h2 class="section-title">¿Interesado en esta propiedad?</h2>
            <p class="contact-subtitle">Contáctanos para agendar una visita</p>
            <div class="contact-buttons">
                <a href="https://wa.me/526677093648?text=Hola,%20me%20interesa%20la%20propiedad%20en%20${encodeURIComponent(datos.location)}%20por%20$${datos.price}" class="contact-button whatsapp" target="_blank">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
                <a href="tel:+526677093648" class="contact-button phone">
                    <i class="fas fa-phone"></i> Llamar
                </a>
            </div>
        </div>
    </section>

    <!-- WhatsApp Floating Button -->
    <a href="https://wa.me/526677093648?text=Hola,%20me%20interesa%20la%20propiedad%20en%20${encodeURIComponent(datos.location)}%20por%20$${datos.price}"
       class="whatsapp-float" target="_blank" aria-label="Contactar por WhatsApp">
        <i class="fab fa-whatsapp"></i>
    </a>

    <!-- Lightbox -->
    <div id="lightbox" class="lightbox">
        <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
        <button class="lightbox-arrow lightbox-prev" onclick="changeLightboxImage(-1)">
            <i class="fas fa-chevron-left"></i>
        </button>
        <img id="lightbox-img" src="" alt="Imagen ampliada">
        <button class="lightbox-arrow lightbox-next" onclick="changeLightboxImage(1)">
            <i class="fas fa-chevron-right"></i>
        </button>
        <div class="lightbox-counter" id="lightbox-counter"></div>
    </div>

    <script>
        // ============ CARRUSEL HERO ============
        let currentSlideHero = 0;
        const totalSlidesHero = ${photoCount};

        function changeSlideHero(direction) {
            const slides = document.querySelectorAll('.hero-image .carousel-slide');
            const dots = document.querySelectorAll('.hero-image .carousel-dot');

            slides[currentSlideHero].classList.remove('active');
            dots[currentSlideHero].classList.remove('active');

            currentSlideHero = (currentSlideHero + direction + totalSlidesHero) % totalSlidesHero;

            slides[currentSlideHero].classList.add('active');
            dots[currentSlideHero].classList.add('active');

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(40);
            }
        }

        // Dots navigation
        document.querySelectorAll('.hero-image .carousel-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => {
                const slides = document.querySelectorAll('.hero-image .carousel-slide');
                const dots = document.querySelectorAll('.hero-image .carousel-dot');

                slides[currentSlideHero].classList.remove('active');
                dots[currentSlideHero].classList.remove('active');

                currentSlideHero = index;

                slides[currentSlideHero].classList.add('active');
                dots[currentSlideHero].classList.add('active');
            });
        });

        // Auto-advance carousel
        setInterval(() => changeSlideHero(1), 5000);

        // ============ LIGHTBOX ============
        const lightboxImages = [
${lightboxArray}
        ];

        let currentLightboxIndex = 0;

        function openLightbox(index) {
            currentLightboxIndex = index;
            updateLightboxImage();
            document.getElementById('lightbox').style.display = 'flex';
            document.body.style.overflow = 'hidden';
            if ('vibrate' in navigator) navigator.vibrate(50);
        }

        function openLightboxFromCarousel() {
            openLightbox(currentSlideHero);
        }

        function closeLightbox() {
            document.getElementById('lightbox').style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        function changeLightboxImage(direction) {
            currentLightboxIndex = (currentLightboxIndex + direction + lightboxImages.length) % lightboxImages.length;
            updateLightboxImage();
            if ('vibrate' in navigator) navigator.vibrate(40);
        }

        function updateLightboxImage() {
            document.getElementById('lightbox-img').src = lightboxImages[currentLightboxIndex];
            document.getElementById('lightbox-counter').textContent = \`\${currentLightboxIndex + 1} / \${lightboxImages.length}\`;
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const lightbox = document.getElementById('lightbox');
            if (lightbox.style.display === 'flex') {
                if (e.key === 'ArrowLeft') changeLightboxImage(-1);
                if (e.key === 'ArrowRight') changeLightboxImage(1);
                if (e.key === 'Escape') closeLightbox();
            }
        });

        // ============ STICKY PRICE BAR ============
        window.addEventListener('scroll', () => {
            const stickyBar = document.getElementById('stickyPriceBar');
            if (window.scrollY > 600) {
                stickyBar.classList.add('visible');
            } else {
                stickyBar.classList.remove('visible');
            }
        });

        // ============ CALCULADORA ============
        function calcularHipoteca() {
            const precio = parseFloat(document.getElementById('precio').value);
            const enganchePorcentaje = parseFloat(document.getElementById('enganche').value);
            const plazoAnios = parseFloat(document.getElementById('plazo').value);
            const tasaAnual = parseFloat(document.getElementById('interes').value);

            const enganche = precio * (enganchePorcentaje / 100);
            const monto = precio - enganche;
            const tasaMensual = tasaAnual / 100 / 12;
            const plazoMeses = plazoAnios * 12;

            const pagoMensual = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / (Math.pow(1 + tasaMensual, plazoMeses) - 1);

            document.getElementById('pagoMensual').textContent = '$' + Math.round(pagoMensual).toLocaleString() + ' MXN';
            document.getElementById('engancheDisplay').textContent = enganchePorcentaje + '% = $' + Math.round(enganche).toLocaleString();
            document.getElementById('interesDisplay').textContent = tasaAnual + '%';

            if ('vibrate' in navigator) navigator.vibrate(30);
        }

        document.getElementById('precio').addEventListener('input', calcularHipoteca);
        document.getElementById('enganche').addEventListener('input', calcularHipoteca);
        document.getElementById('plazo').addEventListener('change', calcularHipoteca);
        document.getElementById('interes').addEventListener('input', calcularHipoteca);

        calcularHipoteca();

        // ============ SCROLL ANIMATIONS ============
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    if ('vibrate' in navigator) navigator.vibrate(20);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
    </script>
</body>
</html>`;

    return html;
}

async function descargarFotos(datos, carpetaImagenes) {
    console.log(`\n📸 Descargando ${datos.images.length} fotos...`);

    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    for (let i = 0; i < datos.images.length; i++) {
        const url = datos.images[i];
        const filename = `foto-${i + 1}.jpg`;
        const filepath = path.join(carpetaImagenes, filename);

        try {
            await execPromise(`curl -s "${url}" -o "${filepath}"`);
            console.log(`   ✅ ${filename}`);
        } catch (error) {
            console.log(`   ❌ Error descargando ${filename}:`, error.message);
        }
    }

    console.log('✅ Fotos descargadas\n');
}

async function generarPropiedad(jsonPath) {
    console.log('🚀 GENERADOR AUTOMÁTICO DE PÁGINAS WIGGOT\n');

    // Leer JSON
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const datos = jsonData.data;

    // Generar slug
    const slug = `casa-venta-${generarSlug(datos.title)}-${jsonData.propertyId}`;
    console.log('📌 Slug:', slug);
    console.log('💰 Precio: $' + datos.price);
    console.log('📍 Ubicación:', datos.location);
    console.log('');

    // Crear carpetas
    const carpetaPropiedad = path.join('culiacan', slug);
    const carpetaImagenes = path.join(carpetaPropiedad, 'images');

    if (!fs.existsSync(carpetaPropiedad)) {
        fs.mkdirSync(carpetaPropiedad, { recursive: true });
    }
    if (!fs.existsSync(carpetaImagenes)) {
        fs.mkdirSync(carpetaImagenes, { recursive: true });
    }

    console.log('📁 Carpeta creada:', carpetaPropiedad);

    // Descargar fotos
    await descargarFotos(datos, carpetaImagenes);

    // Generar HTML
    const html = generarHTML(datos, slug);
    const htmlPath = path.join(carpetaPropiedad, 'index.html');
    fs.writeFileSync(htmlPath, html);

    console.log('✅ HTML generado:', htmlPath);
    console.log('\n🎉 ¡PÁGINA GENERADA CON ÉXITO!');
    console.log('\n📂 Archivos creados:');
    console.log(`   - ${htmlPath}`);
    console.log(`   - ${carpetaImagenes}/ (${datos.images.length} fotos)`);
    console.log('\n🌐 Para revisar localmente:');
    console.log(`   open "${htmlPath}"`);
}

// Ejecutar
const jsonFile = process.argv[2];

if (!jsonFile) {
    console.log('❌ ERROR: Debes proporcionar el archivo JSON');
    console.log('\nUSO: node generador-pagina-wiggot.js wiggot-datos-pODipRm.json');
    process.exit(1);
}

if (!fs.existsSync(jsonFile)) {
    console.log('❌ ERROR: Archivo no encontrado:', jsonFile);
    process.exit(1);
}

generarPropiedad(jsonFile)
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    });
