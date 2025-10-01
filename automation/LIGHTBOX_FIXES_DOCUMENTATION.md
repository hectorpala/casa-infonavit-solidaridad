# Documentación de Fixes de Lightbox para Propiedades

## Problema Identificado
Las flechas de los carousels (hero y galería) cambian las fotos pero NO abren el lightbox automáticamente.

## Solución Aplicada

### 1. Estructura HTML Requerida

#### Carousel Hero (sección principal)
```html
<div class="carousel-slide active" data-slide="0">
    <img src="images/property/foto1.jpg" onclick="openLightbox(0)">
</div>
<div class="carousel-slide" data-slide="1">
    <img src="images/property/foto2.jpg" onclick="openLightbox(1)">
</div>
<!-- ... más slides ... -->

<!-- Flechas con llamadas a funciones helper -->
<button class="carousel-arrow carousel-prev" onclick="changeSlideHero(-1); openLightboxFromCarousel();">‹</button>
<button class="carousel-arrow carousel-next" onclick="changeSlideHero(1); openLightboxFromCarousel();">›</button>
```

#### Carousel Galería
```html
<div class="carousel-slide active" data-slide="0">
    <img src="images/property/foto1.jpg" onclick="openLightbox(0)">
</div>
<!-- ... más slides con data-slide="1", "2", etc. ... -->

<!-- Flechas con llamadas a funciones helper -->
<button class="carousel-arrow carousel-prev" onclick="changeSlideGallery(-1); openLightboxFromGallery();">‹</button>
<button class="carousel-arrow carousel-next" onclick="changeSlideGallery(1); openLightboxFromGallery();">›</button>
```

### 2. JavaScript Requerido

#### Funciones Helper
```javascript
// Helper para abrir lightbox desde carousel hero
function openLightboxFromCarousel() {
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        const activeSlide = heroSection.querySelector('.carousel-slide.active');
        if (activeSlide) {
            const slideIndex = parseInt(activeSlide.getAttribute('data-slide'));
            setTimeout(() => {
                openLightbox(slideIndex);
            }, 50);
        }
    }
}

// Helper para abrir lightbox desde galería
function openLightboxFromGallery() {
    const gallerySection = document.querySelector('.gallery');
    if (gallerySection) {
        const activeSlide = gallerySection.querySelector('.carousel-slide.active');
        if (activeSlide) {
            const slideIndex = parseInt(activeSlide.getAttribute('data-slide'));
            setTimeout(() => {
                openLightbox(slideIndex);
            }, 50);
        }
    }
}
```

#### Array de Imágenes del Lightbox
```javascript
const lightboxImages = [
    { src: 'images/property/foto1.jpg', alt: 'Foto 1' },
    { src: 'images/property/foto2.jpg', alt: 'Foto 2' },
    // ... todas las fotos
];

function openLightbox(index) {
    if (typeof index === 'number') {
        currentLightboxIndex = index;
    }
    // ... resto del código lightbox
}
```

### 3. Errores Comunes a Evitar

#### ❌ Error 1: DOMContentLoaded Duplicado
```javascript
// MAL - causa que todo el JavaScript falle
document.addEventListener("DOMContentLoaded", function() {
document.addEventListener("DOMContentLoaded", function() {
    // código...
});
```

```javascript
// BIEN - un solo DOMContentLoaded
document.addEventListener("DOMContentLoaded", function() {
    // código...
});
```

#### ❌ Error 2: Falta totalSlides
```javascript
// MAL - totalSlides no definido
let currentSlide = 0;
function showSlide(n) {
    if (n >= totalSlides) currentSlide = 0; // ERROR: totalSlides no existe
}

// BIEN - totalSlides definido
let currentSlide = 0;
const totalSlides = 10; // número de slides
```

#### ❌ Error 3: Flechas de galería sin helper
```html
<!-- MAL - solo cambia slide, no abre lightbox -->
<button onclick="changeSlideGallery(-1);">‹</button>

<!-- BIEN - cambia slide Y abre lightbox -->
<button onclick="changeSlideGallery(-1); openLightboxFromGallery();">‹</button>
```

#### ❌ Error 4: Slides sin data-slide
```html
<!-- MAL - helper no puede leer índice -->
<div class="carousel-slide active">
    <img src="..." onclick="openLightbox(this)">
</div>

<!-- BIEN - helper lee data-slide -->
<div class="carousel-slide active" data-slide="0">
    <img src="..." onclick="openLightbox(0)">
</div>
```

### 4. Propiedades Arregladas (Historial)

✅ **Casa 3 Ríos** - Agregados data-slide a galería
✅ **Casa Bosque Monarca** - Agregado openLightboxFromGallery() a flechas
✅ **Casa Portabelo Privada** - Eliminado DOMContentLoaded duplicado

### 5. Template para Nuevas Propiedades

```javascript
// En property-page-generator.js, agregar al template:

// 1. HTML de carousel con data-slide
generateCarouselHTML(photos) {
    let html = '';
    photos.forEach((photo, index) => {
        html += `
        <div class="carousel-slide${index === 0 ? ' active' : ''}" data-slide="${index}">
            <img src="images/\${propertyKey}/${photo}"
                 onclick="openLightbox(${index})"
                 alt="Foto ${index + 1}">
        </div>`;
    });
    return html;
}

// 2. Flechas con helpers
<button class="carousel-arrow carousel-prev"
        onclick="changeSlideHero(-1); openLightboxFromCarousel();">‹</button>
<button class="carousel-arrow carousel-next"
        onclick="changeSlideHero(1); openLightboxFromCarousel();">›</button>

// 3. JavaScript con helpers incluidos
<script>
document.addEventListener("DOMContentLoaded", function() {
    // Funciones carousel...

    // IMPORTANTE: Agregar helpers
    window.openLightboxFromCarousel = function() {
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            const activeSlide = heroSection.querySelector('.carousel-slide.active');
            if (activeSlide) {
                const slideIndex = parseInt(activeSlide.getAttribute('data-slide'));
                setTimeout(() => openLightbox(slideIndex), 50);
            }
        }
    };

    window.openLightboxFromGallery = function() {
        const gallerySection = document.querySelector('.gallery');
        if (gallerySection) {
            const activeSlide = gallerySection.querySelector('.carousel-slide.active');
            if (activeSlide) {
                const slideIndex = parseInt(activeSlide.getAttribute('data-slide'));
                setTimeout(() => openLightbox(slideIndex), 50);
            }
        }
    };
});
</script>
```

### 6. Checklist para Verificar Propiedad

- [ ] Carousel hero tiene `data-slide="0"` hasta `data-slide="N-1"`
- [ ] Carousel galería tiene `data-slide="0"` hasta `data-slide="N-1"`
- [ ] Imágenes tienen `onclick="openLightbox(0)"` con índices numéricos
- [ ] Flechas hero llaman `changeSlideHero()` + `openLightboxFromCarousel()`
- [ ] Flechas galería llaman `changeSlideGallery()` + `openLightboxFromGallery()`
- [ ] Existe `const totalSlides = N` para galería
- [ ] Existe `const totalSlidesHero = N` para hero
- [ ] Solo UN `DOMContentLoaded` en el script
- [ ] Funciones helper están definidas y expuestas globalmente
- [ ] Array `lightboxImages` está definido con todas las fotos

### 7. Comando de Fix Rápido (sed)

```bash
# Agregar openLightboxFromGallery a flechas de galería
sed -i '' 's/onclick="changeSlideGallery(-1);"/onclick="changeSlideGallery(-1); openLightboxFromGallery();"/g' casa-*.html
sed -i '' 's/onclick="changeSlideGallery(1);"/onclick="changeSlideGallery(1); openLightboxFromGallery();"/g' casa-*.html

# Agregar data-slide a slides (manual por número de fotos)
# Ver ejemplo en casa-renta-3-rios.html líneas 367-399
```

---
**Última actualización:** Diciembre 2024
**Propiedades verificadas:** 12 de 42
**Pendiente:** Continuar verificación sistemática propiedad por propiedad
