# ESTRUCTURA CORRECTA DE FOTOS - PROPIEDADES WIGGOT

## 📸 CARRUSEL HERO - ESTRUCTURA HTML

### Slides del Carrusel (16 fotos)
Cada slide debe seguir esta estructura:

```html
<div class="carousel-slide" data-slide="0">
    <img src="images/foto-1.jpg" alt="Fachada Principal" class="carousel-image gallery-image main-image" loading="eager" decoding="async" width="800" height="600" onclick="openLightbox(0)">
</div>
<div class="carousel-slide" data-slide="1">
    <img src="images/foto-2.jpg" alt="Fachada Vista 2" class="carousel-image gallery-image main-image" loading="lazy" decoding="async" width="800" height="600" onclick="openLightbox(1)">
</div>
<!-- ... continuar hasta slide 15 (foto-16.jpg) -->
<div class="carousel-slide" data-slide="15">
    <img src="images/foto-16.jpg" alt="Interior" class="carousel-image gallery-image main-image" loading="lazy" decoding="async" width="800" height="600" onclick="openLightbox(15)">
</div>
```

**IMPORTANTE:**
- `data-slide` empieza en 0 y termina en 15 (16 fotos total)
- `onclick="openLightbox(X)"` debe coincidir con el índice del slide
- Primera foto: `loading="eager"`, resto: `loading="lazy"`

### Dots de Navegación (16 dots)

```html
<div class="carousel-dots">
    <button class="carousel-dot active" onclick="goToSlideHero(0)" aria-label="Ir a foto 1"></button>
    <button class="carousel-dot" onclick="goToSlideHero(1)" aria-label="Ir a foto 2"></button>
    <button class="carousel-dot" onclick="goToSlideHero(2)" aria-label="Ir a foto 3"></button>
    <button class="carousel-dot" onclick="goToSlideHero(3)" aria-label="Ir a foto 4"></button>
    <button class="carousel-dot" onclick="goToSlideHero(4)" aria-label="Ir a foto 5"></button>
    <button class="carousel-dot" onclick="goToSlideHero(5)" aria-label="Ir a foto 6"></button>
    <button class="carousel-dot" onclick="goToSlideHero(6)" aria-label="Ir a foto 7"></button>
    <button class="carousel-dot" onclick="goToSlideHero(7)" aria-label="Ir a foto 8"></button>
    <button class="carousel-dot" onclick="goToSlideHero(8)" aria-label="Ir a foto 9"></button>
    <button class="carousel-dot" onclick="goToSlideHero(9)" aria-label="Ir a foto 10"></button>
    <button class="carousel-dot" onclick="goToSlideHero(10)" aria-label="Ir a foto 11"></button>
    <button class="carousel-dot" onclick="goToSlideHero(11)" aria-label="Ir a foto 12"></button>
    <button class="carousel-dot" onclick="goToSlideHero(12)" aria-label="Ir a foto 13"></button>
    <button class="carousel-dot" onclick="goToSlideHero(13)" aria-label="Ir a foto 14"></button>
    <button class="carousel-dot" onclick="goToSlideHero(14)" aria-label="Ir a foto 15"></button>
    <button class="carousel-dot" onclick="goToSlideHero(15)" aria-label="Ir a foto 16"></button>
</div>
```

**IMPORTANTE:**
- Total de 16 botones (índices 0-15)
- Primer dot tiene clase `active`
- `aria-label` usa numeración humana (1-16)

### Lightbox Images Array (16 fotos)

```javascript
const lightboxImages = [
    { src: 'images/foto-1.jpg', alt: 'Fachada Principal' },
    { src: 'images/foto-2.jpg', alt: 'Fachada Vista 2' },
    { src: 'images/foto-3.jpg', alt: 'Fachada Vista 3' },
    { src: 'images/foto-4.jpg', alt: 'Vista Exterior' },
    { src: 'images/foto-5.jpg', alt: 'Interior 1' },
    { src: 'images/foto-6.jpg', alt: 'Interior 2' },
    { src: 'images/foto-7.jpg', alt: 'Sala' },
    { src: 'images/foto-8.jpg', alt: 'Comedor' },
    { src: 'images/foto-9.jpg', alt: 'Cocina' },
    { src: 'images/foto-10.jpg', alt: 'Recámara Principal' },
    { src: 'images/foto-11.jpg', alt: 'Recámara 2' },
    { src: 'images/foto-12.jpg', alt: 'Baño' },
    { src: 'images/foto-13.jpg', alt: 'Patio' },
    { src: 'images/foto-14.jpg', alt: 'Vista Trasera' },
    { src: 'images/foto-15.jpg', alt: 'Interior' },
    { src: 'images/foto-16.jpg', alt: 'Interior' }
];
```

### Variables JavaScript (16 slides)

```javascript
const totalSlides = 16;
const totalSlidesHero = 16;
```

## 📂 NOMENCLATURA DE ARCHIVOS

### En carpeta images/
- `foto-1.jpg` → Fachada principal (SIEMPRE debe ser la fachada)
- `foto-2.jpg` → Segunda foto
- `foto-3.jpg` → Tercera foto
- ...
- `foto-16.jpg` → Última foto

**REGLA:** Numeración secuencial del 1 al 16, sin gaps

## ✅ CHECKLIST DE VALIDACIÓN

Antes de publicar, verificar que:
- [ ] 16 divs `<div class="carousel-slide">` (data-slide 0-15)
- [ ] 16 botones `<button class="carousel-dot">` (índices 0-15)
- [ ] 16 entradas en array `lightboxImages`
- [ ] `totalSlides = 16` y `totalSlidesHero = 16`
- [ ] 16 archivos físicos: foto-1.jpg hasta foto-16.jpg
- [ ] foto-1.jpg es la FACHADA de la propiedad
- [ ] Todos los onclick coinciden con índices correctos

## 🔧 CORRECCIONES COMUNES

### Si faltan slides en el HTML:
```html
<!-- Agregar después del último slide existente -->
<div class="carousel-slide" data-slide="14">
    <img src="images/foto-15.jpg" alt="Interior" class="carousel-image gallery-image main-image" loading="lazy" decoding="async" width="800" height="600" onclick="openLightbox(14)">
</div>
<div class="carousel-slide" data-slide="15">
    <img src="images/foto-16.jpg" alt="Interior" class="carousel-image gallery-image main-image" loading="lazy" decoding="async" width="800" height="600" onclick="openLightbox(15)">
</div>
```

### Si faltan dots:
```html
<!-- Agregar antes del cierre </div> de carousel-dots -->
<button class="carousel-dot" onclick="goToSlideHero(14)" aria-label="Ir a foto 15"></button>
<button class="carousel-dot" onclick="goToSlideHero(15)" aria-label="Ir a foto 16"></button>
```

### Si falta en lightbox array:
```javascript
// Agregar al final del array, antes del ];
{ src: 'images/foto-15.jpg', alt: 'Interior' },
{ src: 'images/foto-16.jpg', alt: 'Interior' }
```

## 📋 TEMPLATE DE REFERENCIA

**Archivo:** `culiacan/casa-renta-barrio-san-alberto-pgtrrTw/index.html`
**Fecha:** Octubre 2025
**Fotos:** 16 (estructura validada y funcionando)

Este archivo contiene la estructura CORRECTA para el carrusel de 16 fotos.

## 🎯 NOTAS IMPORTANTES

1. **Siempre foto-1.jpg = Fachada**: La primera foto DEBE ser la fachada principal
2. **Índices base 0**: Slides van de 0-15, dots de 0-15, lightbox de 0-15
3. **Labels humanos**: aria-label usa 1-16 (numeración humana)
4. **Sincronización perfecta**: Mismo número en slides, dots, lightbox array y variables JavaScript

---
**Última actualización:** Octubre 2025
**Basado en:** Casa Renta Barrio San Alberto (pgtrrTw)
