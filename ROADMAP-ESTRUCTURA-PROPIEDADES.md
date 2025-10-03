# 🏗️ ROADMAP: Estructura Estándar para Propiedades
**Basado en:** `culiacan/casa-venta-san-javier/index.html`
**Fecha:** Octubre 2025
**Propósito:** Template universal para todas las nuevas propiedades

---

## 📋 ÍNDICE DE SECCIONES

1. [HEAD: Meta Tags y SEO](#1-head-meta-tags-y-seo)
2. [HEADER: Logo y Navegación](#2-header-logo-y-navegación)
3. [HERO SECTION: Carrusel Principal](#3-hero-section-carrusel-principal)
4. [ACTION BAR: Compartir e Imprimir](#4-action-bar-compartir-e-imprimir)
5. [FEATURES COMPACT: Badges Horizontales](#5-features-compact-badges-horizontales)
6. [DETAILS SECTION: Info Badges y Price Card](#6-details-section-info-badges-y-price-card)
7. [CALCULADORA ZILLOW: Hipoteca](#7-calculadora-zillow-hipoteca)
8. [STICKY PRICE BAR: Barra Fija Superior](#8-sticky-price-bar-barra-fija-superior)
9. [CONTACT SECTION: WhatsApp y Teléfono](#9-contact-section-whatsapp-y-teléfono)
10. [FOOTER](#10-footer)
11. [JAVASCRIPT: Funcionalidades](#11-javascript-funcionalidades)
12. [CSS COMPARTIDO](#12-css-compartido)

---

## 1. HEAD: Meta Tags y SEO

### ✅ Elementos OBLIGATORIOS

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- SEO Básico -->
    <title>Casa en Venta $[PRECIO] - [UBICACIÓN], Culiacán | Hector es Bienes Raíces</title>
    <meta name="description" content="[DESCRIPCIÓN: recámaras, baños, amenidades]">
    <meta name="keywords" content="casa venta Culiacán, [ubicación], [características]">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://casasenventa.info/culiacan/[slug]/">

    <!-- Favicons -->
    <link rel="icon" type="image/x-icon" href="../favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="../favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png">

    <!-- PWA Meta Tags -->
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#ff4e00">
    <link rel="manifest" href="../manifest.json">

    <!-- Open Graph -->
    <meta property="og:title" content="Casa en Venta $[PRECIO] - [UBICACIÓN]">
    <meta property="og:description" content="[DESCRIPCIÓN CORTA]">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://casasenventa.info/culiacan/[slug]/">
    <meta property="og:image" content="https://casasenventa.info/culiacan/[slug]/images/foto-1.jpg">

    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SingleFamilyResidence",
      "name": "[TÍTULO PROPIEDAD]",
      "description": "[DESCRIPCIÓN COMPLETA]",
      "url": "https://casasenventa.info/culiacan/[slug]/",
      "image": [
        "https://casasenventa.info/culiacan/[slug]/images/foto-1.jpg",
        "https://casasenventa.info/culiacan/[slug]/images/foto-2.jpg",
        "https://casasenventa.info/culiacan/[slug]/images/foto-3.jpg"
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "[CALLE/BARRIO]",
        "addressLocality": "[COLONIA]",
        "addressRegion": "Sinaloa",
        "postalCode": "[CP]",
        "addressCountry": "MX"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": [LAT],
        "longitude": [LON]
      },
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": [M2_CONSTRUCCION],
        "unitCode": "MTK"
      },
      "lotSize": {
        "@type": "QuantitativeValue",
        "value": [M2_TERRENO],
        "unitCode": "MTK"
      },
      "numberOfRooms": [TOTAL_HABITACIONES],
      "numberOfBedrooms": [RECAMARAS],
      "numberOfBathroomsTotal": [BANOS],
      "petsAllowed": false,
      "yearBuilt": [AÑO],
      "offers": {
        "@type": "Offer",
        "price": "[PRECIO_NUMERICO]",
        "priceCurrency": "MXN",
        "availability": "https://schema.org/InStock",
        "priceValidUntil": "2025-12-31",
        "seller": {
          "@type": "RealEstateAgent",
          "name": "Hector es Bienes Raíces",
          "telephone": "+52 811 165 2545",
          "email": "hector@bienesraices.mx",
          "url": "https://casasenventa.info"
        }
      },
      "amenityFeature": [
        {
          "@type": "LocationFeatureSpecification",
          "name": "[AMENIDAD_1]",
          "value": true
        }
      ]
    }
    </script>

    <!-- Preload critical resources -->
    <link rel="preload" href="../infonavit-solidaridad/styles.css" as="style">
    <link rel="preload" href="images/foto-1.jpg" as="image">

    <link rel="stylesheet" href="../infonavit-solidaridad/styles.css">

    <!-- Optimized font loading -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap"></noscript>

    <!-- Font Awesome optimizado con preload -->
    <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"></noscript>
</head>
```

**Variables dinámicas:**
- `[PRECIO]`: $13,859,000
- `[UBICACIÓN]`: San Javier La Primavera
- `[slug]`: casa-venta-san-javier
- `[M2_CONSTRUCCION]`: 362
- `[M2_TERRENO]`: 362
- `[RECAMARAS]`: 3
- `[BANOS]`: 3
- `[AÑO]`: 2024
- `[CP]`: 80199

---

## 2. HEADER: Logo y Navegación

```html
<header class="header">
    <div class="container">
        <div class="header-content">
            <picture>
                <source srcset="images/webp/Logo-hector-es-bienes-raices.webp" type="image/webp">
                <img src="images/optimized/Logo-hector-es-bienes-raices.jpg" alt="Hector es Bienes Raíces" class="logo">
            </picture>
            <a href="#contact" class="cta-button">Contactar</a>
        </div>
    </div>
</header>
```

**Características:**
- Logo responsive con WebP fallback
- CTA button directo a #contact
- Sticky opcional (CSS)

---

## 3. HERO SECTION: Carrusel Principal

### Estructura

```html
<section class="hero">
    <div class="hero-content">
        <h1 class="hero-title">Tu Nuevo Hogar Te Está Esperando</h1>
        <p class="hero-subtitle">[DESCRIPCIÓN_CORTA: ej. "Casa nueva en San Javier La Primavera. 362 m² construcción, 3 recámaras, 3 baños completos"]</p>
        <a href="#contact" class="hero-cta">Contactar</a>
    </div>
    <div class="hero-image">
        <div class="carousel-container">
            <!-- Main carousel display -->
            <div class="carousel-wrapper">
                <!-- SLIDES DINÁMICOS (1 por foto) -->
                <div class="carousel-slide active" data-slide="0">
                    <img src="images/foto-1.jpg" alt="Fachada Principal"
                         class="carousel-image gallery-image main-image"
                         loading="eager" decoding="async" width="800" height="600"
                         onclick="openLightbox(0)">
                </div>
                <div class="carousel-slide" data-slide="1">
                    <img src="images/foto-2.jpg" alt="Fachada Vista 2"
                         class="carousel-image gallery-image main-image"
                         loading="lazy" decoding="async" width="800" height="600"
                         onclick="openLightbox(1)">
                </div>
                <!-- ... MÁS SLIDES SEGÚN photoCount ... -->

                <!-- Navigation arrows -->
                <button class="carousel-arrow carousel-prev"
                        onclick="changeSlideHero(-1); openLightboxFromCarousel();"
                        aria-label="Foto anterior">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-arrow carousel-next"
                        onclick="changeSlideHero(1); openLightboxFromCarousel();"
                        aria-label="Siguiente foto">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <!-- Price Badge -->
            <div class="price-badge">
                <span class="price-amount">$[PRECIO]</span>
                <span class="price-label">En Venta</span>
            </div>

            <!-- Dots indicators (DINÁMICOS según photoCount) -->
            <div class="carousel-dots">
                <button class="carousel-dot active" onclick="goToSlideHero(0)" aria-label="Ir a foto 1"></button>
                <button class="carousel-dot" onclick="goToSlideHero(1)" aria-label="Ir a foto 2"></button>
                <!-- ... MÁS DOTS ... -->
            </div>
        </div>
    </div>
</section>
```

**Características:**
- Carrusel con arrows + dots
- Primera imagen loading="eager", resto lazy
- onclick para abrir lightbox
- Price badge flotante
- Responsive touch/swipe

---

## 4. ACTION BAR: Compartir e Imprimir

```html
<section class="action-bar">
    <div class="container">
        <div class="action-bar-content">
            <button onclick="toggleShareOptions()" class="action-btn share-btn">
                <i class="fas fa-share-alt"></i>
                <span>Compartir</span>
            </button>
            <button onclick="window.print()" class="action-btn print-btn">
                <i class="fas fa-print"></i>
                <span>Imprimir</span>
            </button>
        </div>

        <!-- Share Options Dropdown -->
        <div id="shareOptions" class="share-dropdown" style="display: none;">
            <button onclick="shareWhatsApp()" class="share-option">
                <i class="fab fa-whatsapp"></i>
                <span>WhatsApp</span>
            </button>
            <button onclick="shareFacebook()" class="share-option">
                <i class="fab fa-facebook-f"></i>
                <span>Facebook</span>
            </button>
            <button onclick="shareEmail()" class="share-option">
                <i class="fas fa-envelope"></i>
                <span>Email</span>
            </button>
            <button onclick="copyLink()" class="share-option copy-link">
                <i class="fas fa-link"></i>
                <span>Copiar enlace</span>
            </button>
        </div>
    </div>
</section>
```

**Funcionalidades:**
- Dropdown de compartir (WhatsApp, Facebook, Email, Copy Link)
- Botón imprimir (window.print())
- Requiere JavaScript functions

---

## 5. FEATURES COMPACT: Badges Horizontales

### HTML + CSS Embebido

```html
<section class="features-compact scroll-animate" id="features">
    <div class="container">
        <div class="features-inline">
            <div class="feature-item">
                <i class="fas fa-bed"></i>
                <span class="feature-value">[RECAMARAS]</span>
                <span class="feature-label">rec</span>
            </div>
            <div class="feature-item">
                <i class="fas fa-bath"></i>
                <span class="feature-value">[BANOS]</span>
                <span class="feature-label">baños</span>
            </div>
            <div class="feature-item">
                <i class="fas fa-car"></i>
                <span class="feature-value">[AUTOS]</span>
                <span class="feature-label">autos</span>
            </div>
            <div class="feature-item">
                <i class="fas fa-ruler-combined"></i>
                <span class="feature-value">[M2]</span>
                <span class="feature-label">m²</span>
            </div>
        </div>
    </div>
</section>

<style>
    .features-compact {
        padding: 20px 0;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
    }

    .features-inline {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
        flex-wrap: wrap;
    }

    .feature-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'Poppins', sans-serif;
    }

    .feature-item i {
        font-size: 20.7px;
        color: #ff4e00;
    }

    .feature-value {
        font-size: 18.4px;
        font-weight: 600;
        color: #1f2937;
    }

    .feature-label {
        font-size: 16.1px;
        color: #6b7280;
    }

    @media (max-width: 640px) {
        .features-inline {
            gap: 16px;
        }

        .feature-item {
            gap: 6px;
        }

        .feature-item i {
            font-size: 18.4px;
        }

        .feature-value {
            font-size: 17.25px;
        }

        .feature-label {
            font-size: 14.95px;
        }
    }
</style>
```

**Estilo:**
- Zillow-inspired compact horizontal layout
- Iconos Font Awesome naranjas
- Responsive con tamaños reducidos en móvil

---

## 6. DETAILS SECTION: Info Badges y Price Card

```html
<section class="details-zillow scroll-animate">
    <div class="container">
        <!-- Info Badges Horizontal -->
        <div class="info-badges">
            <div class="badge-item">
                <i class="fas fa-ruler-combined"></i>
                <span>[M2_CONSTRUCCION] m² construcción</span>
            </div>
            <div class="badge-item">
                <i class="fas fa-border-all"></i>
                <span>[M2_TERRENO] m² terreno</span>
            </div>
            <div class="badge-item">
                <i class="fas fa-building"></i>
                <span>[PLANTAS] planta(s)</span>
            </div>
            <div class="badge-item">
                <i class="fas fa-tint"></i>
                <span>Servicios completos</span>
            </div>
            <div class="badge-item">
                <i class="fas fa-file-contract"></i>
                <span>Documentos en regla</span>
            </div>
        </div>

        <!-- Price Card Compact -->
        <div class="price-card-compact">
            <div class="price-info">
                <span class="price-label">Precio</span>
                <span class="price-value">$[PRECIO]</span>
                <span class="price-detail">Se acepta contado y todos los créditos</span>
            </div>
            <a href="#contact" class="cta-button">Contactar</a>
        </div>
    </div>
</section>
```

**CSS embebido incluido** (ver archivo original líneas 388-526)

**Características:**
- Badges con hover effect (naranja)
- Price card con gradiente naranja
- CTA button con shadow y hover
- Responsive móvil (stacked)

---

## 7. CALCULADORA ZILLOW: Hipoteca

### Estructura Completa

```html
<section class="zillow-calculator scroll-animate" id="calculadora">
    <div class="container" style="max-width: 600px;">
        <h2 style="text-align: center; font-size: 1.75rem; font-weight: 700; color: #1f2937; margin-bottom: 8px; font-family: 'Poppins', sans-serif;">Calculadora de Hipoteca</h2>
        <p style="text-align: center; color: #6b7280; margin-bottom: 32px; font-size: 0.95rem; font-family: 'Poppins', sans-serif;">Estima tu pago mensual</p>

        <div class="calc-zillow-card">
            <!-- Precio de Casa -->
            <div class="zil-input-group">
                <label class="zil-label">Precio de la casa</label>
                <div class="zil-input-wrapper">
                    <input type="text" id="precio-zil" value="$[PRECIO]" class="zil-input" oninput="formatPrecio(this); calcularZillow()">
                </div>
            </div>

            <!-- Enganche Slider -->
            <div class="zil-input-group">
                <div class="zil-label-row">
                    <label class="zil-label">Enganche</label>
                    <span class="zil-value" id="enganche-display">$87,500</span>
                </div>
                <input type="range" id="enganche-zil" min="5" max="50" value="5" class="zil-slider" oninput="calcularZillow()">
                <div class="zil-slider-labels">
                    <span id="enganche-percent">5%</span>
                    <span>50%</span>
                </div>
            </div>

            <!-- Plazo Slider -->
            <div class="zil-input-group">
                <div class="zil-label-row">
                    <label class="zil-label">Plazo del préstamo</label>
                    <span class="zil-value" id="anos-display">20 años</span>
                </div>
                <input type="range" id="anos-zil" min="5" max="30" value="20" step="5" class="zil-slider" oninput="calcularZillow()">
                <div class="zil-slider-labels">
                    <span>5</span>
                    <span>30 años</span>
                </div>
            </div>

            <!-- Tasa de Interés -->
            <div class="zil-input-group">
                <label class="zil-label">Tasa de interés</label>
                <select id="banco-zil" class="zil-select" oninput="calcularZillow()">
                    <option value="3.76">INFONAVIT Bajo - 3.76%</option>
                    <option value="6.5">INFONAVIT Medio - 6.5%</option>
                    <option value="10.45" selected>INFONAVIT Alto - 10.45%</option>
                    <option value="9.9">FOVISSSTE - 9.9%</option>
                    <option value="10.45">HSBC - 10.45%</option>
                    <option value="11.75">Banamex - 11.75%</option>
                    <option value="13.25">Santander - 13.25%</option>
                </select>
            </div>

            <!-- Resultado Principal -->
            <div class="zil-result-main">
                <div class="zil-result-label">Pago mensual estimado</div>
                <div class="zil-result-value" id="pago-mensual-zil">$0</div>
            </div>

            <!-- Desglose -->
            <div class="zil-breakdown">
                <div class="zil-breakdown-item">
                    <span class="zil-breakdown-label">Principal e interés</span>
                    <span class="zil-breakdown-value" id="principal-interes">$0</span>
                </div>
                <div class="zil-breakdown-item">
                    <span class="zil-breakdown-label">Monto del crédito</span>
                    <span class="zil-breakdown-value" id="monto-credito">$0</span>
                </div>
                <div class="zil-breakdown-item">
                    <span class="zil-breakdown-label">Total a pagar</span>
                    <span class="zil-breakdown-value" id="total-pagar">$0</span>
                </div>
            </div>
        </div>
    </div>
</section>
```

**CSS:** Ver líneas 608-792 del archivo original

**JavaScript requerido:**
- `formatPrecio(input)`: Formateo con comas
- `calcularZillow()`: Cálculo de hipoteca
- Vibración haptic feedback (opcional)

**Características:**
- Diseño Zillow reducido al 70%
- Sliders naranjas interactivos
- Bancos mexicanos predefinidos
- Desglose automático

---

## 8. STICKY PRICE BAR: Barra Fija Superior

```html
<!-- Sticky Price Bar (hidden by default, shows on scroll) -->
<div id="sticky-price-bar" class="sticky-price-bar">
    <div class="sticky-price-content">
        <div class="sticky-price-info">
            <span class="sticky-price-label">[TÍTULO_CORTO]</span>
            <span class="sticky-price-amount">$[PRECIO]</span>
        </div>
        <a href="https://wa.me/528111652545?text=[MENSAJE_WHATSAPP_ENCODED]"
           class="sticky-whatsapp-btn" target="_blank" onclick="vibrate(50)">
            <i class="fab fa-whatsapp"></i>
            <span>Contactar</span>
        </a>
    </div>
</div>
```

**CSS:** Líneas 849-951

**JavaScript:**
- Aparece al hacer scroll pasado el hero
- `initStickyPriceBar()` function required

**Comportamiento:**
- Fixed top position
- Transform translateY animation
- Responsive: móvil muestra solo icono WhatsApp

---

## 9. CONTACT SECTION: WhatsApp y Teléfono

```html
<section class="contact scroll-animate" id="contact">
    <div class="container">
        <h2 class="section-title">¿Interesado?</h2>
        <p class="contact-subtitle">Contáctanos para más información o para agendar una visita</p>
        <div class="contact-buttons">
            <a href="https://wa.me/528111652545?text=[MENSAJE_WHATSAPP_ENCODED]"
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
            <p><i class="fas fa-map-marker-alt"></i> [DIRECCIÓN_COMPLETA]</p>
            <p><i class="fas fa-phone"></i> +52 811 165 2545</p>
            <p><i class="fas fa-envelope"></i> hector@bienesraices.mx</p>
        </div>
    </div>
</section>
```

**Mensaje WhatsApp:**
```javascript
const mensaje = encodeURIComponent('Me interesa la casa en [UBICACIÓN] de $[PRECIO]');
```

---

## 10. FOOTER

```html
<footer class="footer">
    <div class="container">
        <p>&copy; 2024 Hector es Bienes Raíces. Todos los derechos reservados.</p>
    </div>
</footer>
```

---

## 11. JAVASCRIPT: Funcionalidades

### A. Haptic Feedback

```javascript
function vibrate(duration = 50) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}
```

**Usos:**
- Clicks en carrusel: 40ms
- Lightbox: 50ms abrir, 40ms navegar
- Calculadora inputs/sliders: 30ms
- Scroll animations: 20ms

### B. Calculadora Zillow

```javascript
function formatPrecio(input) {
    let value = input.value.replace(/[^\d]/g, '');
    if (value) {
        const numValue = parseInt(value);
        input.value = '$' + numValue.toLocaleString('es-MX');
    }
    vibrate(30);
}

function calcularZillow() {
    const precioInput = document.getElementById('precio-zil').value;
    const precio = parseFloat(precioInput.replace(/[^\d]/g, '')) || [PRECIO_NUMERICO];

    const enganchePorcentaje = parseFloat(document.getElementById('enganche-zil').value) || 5;
    const anos = parseInt(document.getElementById('anos-zil').value) || 20;
    const tasaAnual = parseFloat(document.getElementById('banco-zil').value) || 10.45;

    // Cálculos...
    const engancheMonto = precio * (enganchePorcentaje / 100);
    const montoCredito = precio - engancheMonto;
    const tasaMensual = tasaAnual / 100 / 12;
    const numeroPagos = anos * 12;

    let pagoMensual;
    if (tasaMensual === 0) {
        pagoMensual = montoCredito / numeroPagos;
    } else {
        pagoMensual = montoCredito * (tasaMensual * Math.pow(1 + tasaMensual, numeroPagos)) / (Math.pow(1 + tasaMensual, numeroPagos) - 1);
    }

    const totalPagar = pagoMensual * numeroPagos;

    // Update DOM
    document.getElementById('pago-mensual-zil').textContent = '$' + Math.round(pagoMensual).toLocaleString('es-MX');
    document.getElementById('monto-credito').textContent = '$' + Math.round(montoCredito).toLocaleString('es-MX');
    document.getElementById('total-pagar').textContent = '$' + Math.round(totalPagar).toLocaleString('es-MX');

    vibrate(30);
}
```

### C. Scroll Animations

```javascript
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.scroll-animate');

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                vibrate(20);
            }
        });
    }, observerOptions);

    animatedElements.forEach(element => {
        observer.observe(element);
    });
}
```

**CSS Animations:**
```css
.scroll-animate {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.scroll-animate.animated {
    opacity: 1;
    transform: translateY(0);
}
```

**Staggered animations:** Features y badges (ver líneas 807-845)

### D. Sticky Price Bar

```javascript
function initStickyPriceBar() {
    const stickyBar = document.getElementById('sticky-price-bar');
    const heroSection = document.querySelector('.hero');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        const heroHeight = heroSection ? heroSection.offsetHeight : 500;

        // Show sticky bar after scrolling past hero section
        if (currentScroll > heroHeight && currentScroll > lastScroll) {
            stickyBar.classList.add('visible');
        } else if (currentScroll < 100) {
            stickyBar.classList.remove('visible');
        }

        lastScroll = currentScroll;
    });
}
```

### E. Carrusel Hero

```javascript
let currentSlideHero = 0;
const totalSlidesHero = [PHOTO_COUNT]; // Dinámico

function changeSlideHero(direction) {
    currentSlideHero += direction;
    if (currentSlideHero >= totalSlidesHero) currentSlideHero = 0;
    if (currentSlideHero < 0) currentSlideHero = totalSlidesHero - 1;

    updateCarouselHero();
    vibrate(40);
}

function goToSlideHero(n) {
    currentSlideHero = n;
    updateCarouselHero();
    vibrate(40);
}

function updateCarouselHero() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlideHero);
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlideHero);
    });
}
```

### F. Share Functions

```javascript
function toggleShareOptions() {
    const shareOptions = document.getElementById('shareOptions');
    shareOptions.style.display = shareOptions.style.display === 'none' ? 'flex' : 'none';
    vibrate(40);
}

function shareWhatsApp() {
    const url = window.location.href;
    const text = encodeURIComponent(`Mira esta casa en venta: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    vibrate(50);
}

function shareFacebook() {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    vibrate(50);
}

function shareEmail() {
    const url = window.location.href;
    const subject = encodeURIComponent('Casa en Venta - Hector es Bienes Raíces');
    const body = encodeURIComponent(`Te comparto esta casa en venta: ${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    vibrate(50);
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('¡Enlace copiado!');
        vibrate(60);
    });
}
```

### G. DOMContentLoaded Initialization

```javascript
window.addEventListener('DOMContentLoaded', () => {
    calcularZillow();
    addSliderVibration();
    initStickyPriceBar();
    initScrollAnimations();
});
```

---

## 12. CSS COMPARTIDO

**Archivo:** `../infonavit-solidaridad/styles.css`

**Secciones embebidas adicionales:**
- Features Compact (líneas 288-346)
- Details Zillow (líneas 388-526)
- Calculadora Zillow (líneas 608-792)
- Scroll Animations (líneas 794-846)
- Sticky Price Bar (líneas 848-951)

---

## 📊 CHECKLIST DE GENERACIÓN

### Variables Dinámicas Requeridas

```javascript
const propertyData = {
    // Básicos
    slug: 'casa-venta-nombre',
    title: 'Casa Nombre Completo',
    location: 'Colonia, CP',
    price: '$13,859,000',
    priceNumeric: 13859000,

    // Características
    bedrooms: 3,
    bathrooms: 3,
    constructionArea: 362,
    landArea: 362,
    parkingSpaces: 2,
    floors: 1,
    yearBuilt: 2024,

    // Fotos
    photoCount: 11,

    // SEO
    description: 'Casa nueva en venta...',
    keywords: 'casa venta, Culiacán, ...',

    // Ubicación
    street: 'Barrio San Javier',
    postalCode: '80199',
    latitude: 24.824491,
    longitude: -107.4287297,

    // Amenidades
    amenities: [
        { name: 'Cochera techada', value: '2 autos' },
        { name: 'Cuarto TV', value: true },
        { name: 'Una planta', value: true }
    ],

    // Contact
    whatsappMessage: 'Me interesa la casa en San Javier La Primavera de $13,859,000'
};
```

### Proceso de Generación

1. ✅ Cargar template base
2. ✅ Reemplazar todas las variables `[VARIABLE]`
3. ✅ Generar slides dinámicamente (photoCount)
4. ✅ Generar dots dinámicamente (photoCount)
5. ✅ Actualizar `totalSlidesHero = photoCount`
6. ✅ Generar lightboxImages array
7. ✅ URL-encode mensajes WhatsApp
8. ✅ Actualizar Schema.org con datos reales
9. ✅ Verificar rutas de imágenes (images/foto-X.jpg)
10. ✅ Guardar en `culiacan/[slug]/index.html`

---

## 🎯 PRÓXIMOS PASOS

1. **Actualizar `generador-de-propiedades.js`** para usar esta estructura completa
2. **Crear método `generateFromSanJavierTemplate(config)`** que:
   - Carga este template
   - Reemplaza todas las variables
   - Genera carrusel dinámico
   - Actualiza JavaScript con photoCount
3. **Probar con una propiedad real**
4. **Documentar diferencias entre VENTA y RENTA**

---

## 📝 NOTAS FINALES

**Ventajas de esta estructura:**
- ✅ Diseño moderno Zillow-style
- ✅ 100% responsive
- ✅ SEO optimizado (Schema.org completo)
- ✅ Performance (lazy loading, preload)
- ✅ Interactiva (haptic feedback, animations)
- ✅ Calculadora funcional
- ✅ Social sharing integrado
- ✅ Lightbox para fotos

**Diferencias con Casa Solidaridad:**
- Features más compactos (horizontal vs vertical)
- Calculadora Zillow reducida 70%
- Sticky price bar moderna
- Scroll animations con Intersection Observer
- Action bar con social sharing

**Esta es la ESTRUCTURA ESTÁNDAR para todas las nuevas propiedades en adelante.**
