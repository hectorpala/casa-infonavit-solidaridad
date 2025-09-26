# DOCUMENTO 2: Reglas para Crear Páginas de Propiedades por Ciudad

## 🏙️ CONTEXTO
Este documento establece las reglas para crear páginas de listado de propiedades por ciudad (como la página de Mazatlán) que sirvan como hub de propiedades para cada ubicación.

## 📋 REGLAS OBLIGATORIAS

### REGLA #1: ESTRUCTURA HTML BASE
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[CIUDAD] · Propiedades en venta y renta | Hector es Bienes Raíces</title>
    <meta name="description" content="Explora propiedades en [CIUDAD] con fotos, precios y tours por WhatsApp.">
    
    <!-- Open Graph -->
    <meta property="og:title" content="[CIUDAD] · Propiedades en venta y renta | Hector es Bienes Raíces">
    <meta property="og:description" content="Explora propiedades en [CIUDAD] con fotos, precios y tours por WhatsApp.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://casasenventa.info/propiedades-[ciudad-slug].html">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
```

### REGLA #2: CONFIGURACIÓN TAILWIND OBLIGATORIA
```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                'primary': '#ff4e00',
                'info': '#e63900',
                'hector': '#ff4e00',
                'hector-dark': '#e63900',
            },
            fontFamily: {
                'system': ['system-ui', 'Arial', 'Inter', 'sans-serif'],
            }
        }
    }
}
```

### REGLA #3: CSS UNIFORME OBLIGATORIO PARA TARJETAS CLICKEABLES
**SIEMPRE incluir este CSS para tarjetas uniformes y clickeables:**
```css
<style>
    .property-card {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        cursor: pointer;
    }
    
    /* Clickable card approach - make entire card clickable except WhatsApp button */
    .property-card a[href*="wa.me"] {
        position: relative !important;
        z-index: 10 !important;
    }
    
    /* Carousel dots styling - OBLIGATORIO */
    .carousel-dot {
        opacity: 0.6;
    }
    
    .carousel-dot.active {
        opacity: 1;
        background-color: white !important;
    }
    
    /* Uniform image areas */
    .property-card .aspect-video {
        height: 240px !important;
        min-height: 240px !important;
        max-height: 240px !important;
        width: 100% !important;
    }
    
    .property-card .carousel-image {
        width: 100% !important;
        height: 240px !important;
        object-fit: cover !important;
        object-position: center !important;
    }
    
    /* Content area with structured layout */
    .property-card .p-6 {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        padding: 24px !important;
    }
    
    /* Uniform text sections */
    .property-card h3 {
        height: 36px !important;
        line-height: 36px !important;
        margin-bottom: 8px !important;
        font-size: 24px !important;
        font-weight: 700 !important;
    }
    
    .property-card p {
        height: 44px !important;
        line-height: 22px !important;
        margin-bottom: 16px !important;
        overflow: hidden !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
    }
    
    /* Uniform chips area */
    .property-details-chips {
        min-height: 72px !important;
        margin-bottom: 20px !important;
        align-items: flex-start !important;
        align-content: flex-start !important;
    }
    
    .property-details-chips span {
        height: 32px !important;
        display: flex !important;
        align-items: center !important;
        padding: 0 12px !important;
        white-space: nowrap !important;
    }
    
    /* CTA button always at bottom */
    .property-card a[href*="wa.me"] {
        margin-top: auto !important;
        height: 48px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }
    
    /* Grid layout for uniform distribution */
    .grid.grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 {
        grid-template-rows: 1fr !important;
        align-items: stretch !important;
    }
    
    @media (min-width: 768px) {
        .grid.grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 {
            grid-template-columns: repeat(2, 1fr) !important;
        }
    }
    
    @media (min-width: 1024px) {
        .grid.grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 {
            grid-template-columns: repeat(3, 1fr) !important;
        }
    }
</style>
```

### REGLA #4: HEADER ESTÁNDAR
```html
<header class="bg-white shadow-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
                <div class="bg-hector/10 p-2 rounded-lg">
                    <svg class="w-6 h-6 text-hector" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.8L18 11v8h-2v-6h-6v6H8v-8l4-5.2z"/>
                    </svg>
                </div>
                <div>
                    <h1 class="text-xl font-bold text-gray-900">Hector es Bienes Raíces</h1>
                    <p class="text-sm text-gray-600">Propiedades en [CIUDAD]</p>
                </div>
            </div>
            
            <div class="hidden md:flex items-center space-x-4">
                <a href="#" class="text-gray-600 hover:text-hector">Inicio</a>
                <a href="#" class="text-gray-600 hover:text-hector">Contacto</a>
                <a href="https://wa.me/526671631231" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                    WhatsApp
                </a>
            </div>
        </div>
        
        <!-- Buscador y filtros -->
        <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1 relative">
                <input 
                    type="text" 
                    placeholder="Buscar en [CIUDAD], Sinaloa..." 
                    class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-hector focus:border-transparent"
                >
                <svg class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="m21 20-5.6-5.6A7.5 7.5 0 1 0 9.5 17a7.45 7.45 0 0 0 4.9-1.8L20 21l1-1ZM4 9.5A5.5 5.5 0 1 1 9.5 15 5.51 5.51 0 0 1 4 9.5Z"/>
                </svg>
            </div>
            
            <div class="flex gap-2">
                <button class="px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium">En Venta</button>
                <button class="px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium">En Renta</button>
                <button class="px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium">Filtros</button>
                <button class="px-4 py-3 bg-hector text-white rounded-xl hover:bg-hector-dark font-medium">Guardar búsqueda</button>
            </div>
        </div>
    </div>
</header>
```

### REGLA #5: ESTRUCTURA MAIN CONTENT
```html
<main class="max-w-7xl mx-auto px-4 py-8">
    <!-- Results header -->
    <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Propiedades en [CIUDAD]</h2>
        <p class="text-gray-600">[NÚMERO] propiedades disponibles · Ordenado por más recientes</p>
    </div>

    <!-- Properties Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Property Cards aquí -->
    </div>

    <!-- Load more button -->
    <div class="text-center mt-12">
        <button class="bg-white border border-gray-300 hover:bg-gray-50 px-8 py-3 rounded-xl font-medium">
            Ver más propiedades
        </button>
    </div>
</main>
```

### REGLA #6: ESTRUCTURA PROPERTY CARD CLICKEABLE OBLIGATORIA
**IMPORTANTE: Las tarjetas deben ser clickeables para navegar a las páginas individuales.**

```html
<div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative" 
     data-href="[RUTA_PAGINA_INDIVIDUAL]">
    <div class="relative aspect-video">
        <div class="carousel-container" data-current="0">
            <img src="[RUTA_IMAGEN]" 
                 alt="[NOMBRE_PROPIEDAD] [CIUDAD]" 
                 loading="lazy" 
                 decoding="async"
                 class="w-full h-full object-cover carousel-image active">
            <!-- Más imágenes si existen -->
        </div>
        
        <!-- Carousel controls (solo si hay múltiples imágenes) -->
        <button class="carousel-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-md">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
        </button>
        <button class="carousel-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-1 rounded-full shadow-md">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
        </button>
        
        <!-- Carousel dots - OBLIGATORIO para múltiples imágenes -->
        <div class="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1">
            <button class="w-2 h-2 bg-white/60 hover:bg-white rounded-full transition-colors carousel-dot active"></button>
            <button class="w-2 h-2 bg-white/60 hover:bg-white rounded-full transition-colors carousel-dot"></button>
            <button class="w-2 h-2 bg-white/60 hover:bg-white rounded-full transition-colors carousel-dot"></button>
            <button class="w-2 h-2 bg-white/60 hover:bg-white rounded-full transition-colors carousel-dot"></button>
            <!-- Agregar más dots según el número de imágenes -->
        </div>
        
        <!-- Badges -->
        <div class="absolute top-3 left-3 flex gap-2">
            <span class="bg-[COLOR] text-white px-2 py-1 rounded-lg text-xs font-medium">[ESTADO]</span>
            <span class="bg-hector text-white px-2 py-1 rounded-lg text-xs font-medium">Disponible</span>
        </div>
        
        <!-- Favorite icon -->
        <button class="favorite-btn absolute top-3 right-3 bg-white/80 hover:bg-white p-2 rounded-full shadow-md">
            <svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21s-6.7-3.9-9.3-8A5.5 5.5 0 0 1 12 6.2 5.5 5.5 0 0 1 21.3 13c-2.6 4.1-9.3 8-9.3 8Z"/>
            </svg>
        </button>
    </div>
    
    <div class="p-6">
        <h3 class="text-2xl font-bold text-gray-900 mb-1">[PRECIO]</h3>
        <p class="text-gray-600 mb-4">[NOMBRE_PROPIEDAD] · [DIRECCION], [CIUDAD]</p>
        
        <!-- Property details chips -->
        <div class="flex flex-wrap gap-2 mb-4 property-details-chips">
            <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium">[RECAMARAS] rec</span>
            <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium">[BAÑOS] baños</span>
            <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium">[M2] m²</span>
            <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium">[CARACTERISTICA_EXTRA]</span>
        </div>
        
        <!-- CTA Button - No se activa con el click de tarjeta -->
        <a href="https://wa.me/526671631231?text=[MENSAJE_WHATSAPP_ENCODED]" 
           class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl text-center block transition-colors"
           onclick="event.stopPropagation()">
            Solicitar tour
        </a>
    </div>
</div>
```

### REGLA #7: FOOTER ESTÁNDAR
```html
<footer class="bg-gray-900 text-white py-12 mt-16">
    <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <h3 class="font-bold text-lg mb-4">Hector es Bienes Raíces</h3>
                <p class="text-gray-400 mb-4">Especialistas en propiedades en [CIUDAD] y Culiacán</p>
                <div class="flex space-x-4">
                    <a href="https://wa.me/526671631231" class="text-green-400 hover:text-green-300">WhatsApp</a>
                </div>
            </div>
            <div>
                <h4 class="font-semibold mb-4">Propiedades</h4>
                <ul class="space-y-2 text-gray-400">
                    <li><a href="#" class="hover:text-white">En Venta</a></li>
                    <li><a href="#" class="hover:text-white">En Renta</a></li>
                    <li><a href="#" class="hover:text-white">Comerciales</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold mb-4">Ubicaciones</h4>
                <ul class="space-y-2 text-gray-400">
                    <li><a href="#" class="hover:text-white">[CIUDAD]</a></li>
                    <li><a href="#" class="hover:text-white">Culiacán</a></li>
                    <li><a href="#" class="hover:text-white">Otras ciudades</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold mb-4">Contacto</h4>
                <ul class="space-y-2 text-gray-400">
                    <li>+52 667 163 1231</li>
                    <li>hector.palazuelos@gmail.com</li>
                    <li>[CIUDAD], Sinaloa</li>
                </ul>
            </div>
        </div>
        <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Hector es Bienes Raíces. Todos los derechos reservados.</p>
        </div>
    </div>
</footer>
```

### REGLA #8: JAVASCRIPT CAROUSEL OBLIGATORIO
```javascript
<script>
    // Carousel functionality
    document.addEventListener('DOMContentLoaded', function() {
        const carouselContainers = document.querySelectorAll('.carousel-container');
        
        carouselContainers.forEach(container => {
            const images = container.querySelectorAll('.carousel-image');
            const prevBtn = container.parentNode.querySelector('.carousel-prev');
            const nextBtn = container.parentNode.querySelector('.carousel-next');
            const dots = container.parentNode.querySelectorAll('.carousel-dot');
            let currentIndex = 0;
            
            // Hide carousel controls if only one image
            if (images.length <= 1) {
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
                dots.forEach(dot => dot.style.display = 'none');
                return;
            }
            
            function showImage(index) {
                images.forEach((img, i) => {
                    if (i === index) {
                        img.classList.remove('hidden');
                        img.classList.add('active');
                    } else {
                        img.classList.add('hidden');
                        img.classList.remove('active');
                    }
                });
                
                // Update dots - OBLIGATORIO
                dots.forEach((dot, i) => {
                    if (i === index) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
            }
            
            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                    showImage(currentIndex);
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                    showImage(currentIndex);
                });
            }
            
            // Add dot functionality - OBLIGATORIO
            dots.forEach((dot, index) => {
                dot.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentIndex = index;
                    showImage(currentIndex);
                });
            });
        });
        
        // Favorite functionality
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const heart = this.querySelector('svg');
                if (heart.classList.contains('text-gray-400')) {
                    heart.classList.remove('text-gray-400');
                    heart.classList.add('text-red-500');
                } else {
                    heart.classList.remove('text-red-500');
                    heart.classList.add('text-gray-400');
                }
            });
        });
        
        // Search functionality
        const searchInput = document.querySelector('input[placeholder*="[CIUDAD]"]');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    alert('Buscando: ' + this.value);
                }
            });
        }
        
        // Property card click functionality - OBLIGATORIO
        const propertyCards = document.querySelectorAll('.property-card[data-href]');
        propertyCards.forEach(card => {
            card.addEventListener('click', function(e) {
                // Don't navigate if clicking on WhatsApp button, carousel controls, or dots
                if (e.target.closest('a[href*="wa.me"]') || 
                    e.target.closest('.carousel-prev') || 
                    e.target.closest('.carousel-next') ||
                    e.target.closest('.carousel-dot') ||
                    e.target.closest('.favorite-btn')) {
                    return;
                }
                
                const href = this.getAttribute('data-href');
                if (href) {
                    window.location.href = href;
                }
            });
        });
    });
</script>
```

## 🎯 CONVENCIONES DE NOMENCLATURA

### ARCHIVOS
- **Nombre archivo**: `propiedades-[ciudad-slug].html`
- **Ejemplos**: 
  - `propiedades-mazatlan.html`
  - `propiedades-guadalajara.html`
  - `propiedades-tijuana.html`

### VARIABLES REEMPLAZABLES
- `[CIUDAD]` → Nombre completo de ciudad (ej: "Mazatlán")
- `[ciudad-slug]` → Slug para URLs (ej: "mazatlan")
- `[NÚMERO]` → Cantidad de propiedades disponibles
- `[PRECIO]` → Precio formateado (ej: "$1,750,000")
- `[NOMBRE_PROPIEDAD]` → Nombre descriptivo
- `[DIRECCION]` → Dirección específica
- `[RECAMARAS]` → Número de recámaras
- `[BAÑOS]` → Número de baños
- `[M2]` → Metros cuadrados
- `[CARACTERISTICA_EXTRA]` → Característica destacada
- `[MENSAJE_WHATSAPP_ENCODED]` → Mensaje WhatsApp URL-encoded
- `[RUTA_PAGINA_INDIVIDUAL]` → Ruta al archivo HTML de la propiedad individual

### RUTAS TÍPICAS DE PROPIEDADES
- Casa Infonavit Solidaridad: `culiacan/infonavit-solidaridad/index.html`
- Casa Valle Alto Verde: `casa-venta-valle-alto-verde.html`
- Casa Privada Acacia: `casa-privada-acacia-zona-norte.html`
- Casa Barcelona Villa (renta): `culiacan-casaenrenta-barcelona-villa.html`

## 🔥 SOLUCIÓN DEFINITIVA: FLECHAS CARRUSEL EN PÁGINAS DE CIUDADES
**⚠️ PROBLEMA CRÍTICO RESUELTO - Sept 25 2025 - v3.0**

### 🚨 REGLA OBLIGATORIA PARA CARRUSELES EN TODAS LAS PÁGINAS DE CIUDADES
**SIEMPRE usar esta estructura EXACTA para que las flechas sean VISIBLES:**

```html
<!-- ✅ CORRECTO - FLECHAS VISIBLES -->
<button class="carousel-prev" aria-label="Imagen anterior">
    <i class="fas fa-chevron-left"></i>
</button>
<button class="carousel-next" aria-label="Siguiente imagen">
    <i class="fas fa-chevron-right"></i>
</button>
```

### ❌ NUNCA USAR EN PÁGINAS DE CIUDADES (NO FUNCIONA)
```html
<!-- ❌ INCORRECTO - FLECHAS INVISIBLES -->
<button class="carousel-btn-index prev-btn-index" onclick="previousImage(this)">
<button class="carousel-btn-index next-btn-index" onclick="nextImage(this)">
```

### ✅ VERIFICACIÓN OBLIGATORIA PARA CARRUSELES
- **CSS requerido:** `.carousel-prev` y `.carousel-next` con estilos `!important`
- **Iconos obligatorios:** Font Awesome `fas fa-chevron-left/right`
- **Sin onclick:** Las clases CSS manejan la funcionalidad automáticamente
- **Estilo consistente:** Naranja (rgba(255, 78, 0, 0.95)) con bordes blancos
- **Tamaño estándar:** 50px × 50px con z-index alto

### 🎯 CASOS DE ÉXITO VERIFICADOS
- **Página Culiacán**: ✅ Todas las propiedades funcionan con `.carousel-prev/.carousel-next`
- **Casa Circuito Canarias**: ✅ Flechas completamente visibles
- **Casa Los Pinos**: ✅ Flechas completamente visibles
- **Todas las casas de venta**: ✅ Estructura estándar que siempre funciona

### 💡 REGLA DE ORO: COPIAR DE LO QUE FUNCIONA
**Siempre usar la misma estructura que las casas de venta exitosas. NO inventar nuevas clases o métodos JavaScript complejos.**

### 🔧 CSS NECESARIO PARA FLECHAS (YA DISPONIBLE)
El CSS ya está implementado en `styles.css` con máxima prioridad:
```css
.carousel-prev, .carousel-next {
    position: absolute !important;
    background: rgba(255, 78, 0, 0.95) !important;
    color: white !important;
    border: 3px solid white !important;
    border-radius: 50% !important;
    width: 50px !important;
    height: 50px !important;
    z-index: 9999 !important;
    opacity: 1 !important;
    visibility: visible !important;
}
```

**⭐ NOTA CRÍTICA:** Esta solución se aplicó tras identificar que las propiedades de renta tenían clases diferentes que causaban invisibilidad de flechas. La solución fue estandarizar con las clases que YA funcionaban en propiedades de venta.

## 🏷️ BADGES OBLIGATORIOS PARA PROPIEDADES DE RENTA
**⚠️ REGLA CRÍTICA - Sept 26 2025 - v3.1**

### 🚨 BADGES REQUERIDOS EN PROPIEDADES DE RENTA
**TODAS las propiedades de renta DEBEN tener estos badges en la esquina superior izquierda:**

```html
<!-- ✅ ESTRUCTURA OBLIGATORIA PARA RENTAS -->
<div class="absolute top-3 left-3 flex gap-2">
    <span class="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium font-poppins">RENTA</span>
    <span class="bg-hector text-white px-2 py-1 rounded-lg text-xs font-medium font-poppins">Disponible</span>
</div>
```

### 🔄 BOTÓN DE FAVORITOS OBLIGATORIO
**Agregar también el botón de favoritos (esquina superior derecha):**

```html
<!-- Favorite icon -->
<button class="btn-icon absolute top-3 right-3">
    <svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21s-6.7-3.9-9.3-8A5.5 5.5 0 0 1 12 6.2 5.5 5.5 0 0 1 21.3 13c-2.6 4.1-9.3 8-9.3 8Z"/>
    </svg>
</button>
```

### ✅ CONSISTENCIA CON PROPIEDADES DE VENTA
**Las propiedades de venta tienen esta estructura (para comparar):**
```html
<div class="absolute top-3 left-3 flex gap-2">
    <span class="badge-venta">VENTA</span>
    <span class="bg-hector text-white px-2 py-1 rounded-lg text-xs font-medium font-poppins">Disponible</span>
</div>
```

### 🎯 CASOS DE ÉXITO VERIFICADOS
- **Casa Circuito Canarias**: ✅ Badges RENTA + Disponible + favoritos implementados
- **Casa Los Pinos**: ✅ Badges RENTA + Disponible + favoritos implementados
- **Página Culiacán**: ✅ Consistencia visual completa entre ventas y rentas

### ❌ NO USAR BADGES CON EMOJIS
**Reemplazar estos badges obsoletos:**
```html
<!-- ❌ OBSOLETO - NO USAR -->
<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium font-poppins">
    🏠 RENTA
</span>
```

**Por estos badges profesionales:**
```html
<!-- ✅ CORRECTO - USAR SIEMPRE -->
<span class="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium font-poppins">RENTA</span>
<span class="bg-hector text-white px-2 py-1 rounded-lg text-xs font-medium font-poppins">Disponible</span>
```

### 💡 REGLA DE CONSISTENCIA
**TODAS las propiedades (venta y renta) deben tener:**
1. **Badge de tipo** (VENTA o RENTA)
2. **Badge de estado** (Disponible)  
3. **Botón de favoritos**
4. **Misma posición** (top-3 left-3 y top-3 right-3)
5. **Mismos estilos** de badges

## 🔗 INTEGRACIÓN CON INDEX PRINCIPAL

### REGLA #9: ENLACE EN INDEX.HTML
Actualizar el enlace de ciudad en `index.html`:
```html
<a href="propiedades-[ciudad-slug].html" class="city-card">
    <!-- Contenido de la tarjeta de ciudad -->
    <h3>[CIUDAD]</h3>
</a>
```

## 📋 CHECKLIST FINAL

Antes de publicar una página de ciudad, verificar:

✅ **SEO**: Título y meta description personalizados
✅ **Header**: Logo y navegación correctos  
✅ **Propiedades**: Solo propiedades reales, no placeholders
✅ **Imágenes**: Rutas correctas a carpetas existentes
✅ **WhatsApp**: Links personalizados por propiedad
✅ **CSS**: Tarjetas uniformes aplicadas
✅ **JavaScript**: Carruseles funcionando
✅ **Carousel Dots**: Indicadores visuales funcionando (bolitas)
✅ **Clickeable**: Tarjetas navegan a páginas individuales correctamente
✅ **Footer**: Información de contacto actualizada
✅ **Index**: Enlace desde página principal agregado
✅ **Responsive**: Funciona en móvil y desktop
✅ **Cache**: Verificar que no hay problemas de cache después del deployment

## 🚀 EJEMPLO COMPLETO
Ver `propiedades-mazatlan.html` como referencia completa de implementación.

## 🎛️ ESPECIFICACIONES TÉCNICAS CARRUSEL

### CSS Obligatorio para Carruseles Funcionales
```css
/* Carousel Controls Styling - OBLIGATORIO */
.carousel-prev, .carousel-next {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.carousel-prev {
    left: 10px;
}

.carousel-next {
    right: 10px;
}

.carousel-prev:hover, .carousel-next:hover {
    background: white;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.carousel-prev i, .carousel-next i {
    color: #ff4e00;
    font-size: 16px;
}

/* Carousel Indicators (Dots) */
.carousel-indicators {
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 10;
}

.indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
}

.indicator.active {
    background: white;
    transform: scale(1.2);
}

.indicator:hover {
    background: rgba(255, 255, 255, 0.9);
}
```

### JavaScript Handlers para Múltiples Tipos de Dots
```javascript
// Handle indicators (dots) para carruseles con clase .indicator
const indicators = document.querySelectorAll('.indicator');
indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const container = this.closest('.property-card').querySelector('.carousel-container');
        const images = container.querySelectorAll('.carousel-image');
        const allIndicators = this.closest('.carousel-indicators').querySelectorAll('.indicator');
        
        // Update images
        images.forEach((img, i) => {
            if (i === index) {
                img.classList.remove('hidden');
                img.classList.add('active');
            } else {
                img.classList.add('hidden');
                img.classList.remove('active');
            }
        });
        
        // Update indicators
        allIndicators.forEach((ind, i) => {
            if (i === index) {
                ind.classList.add('active');
            } else {
                ind.classList.remove('active');
            }
        });
    });
});
```

### Propiedades con Carrusel Implementado - TODAS FUNCIONALES
- **Casa Infonavit Solidaridad**: 5 imágenes (fachada, exterior, sala, cocina, recámara)
- **Casa Barcelona Villa**: 8 imágenes (fachada, interior, sala, cocina, recámara, baño, patio, área social)
- **Casa Urbivilla del Roble**: 8 imágenes (fachada, interior, sala, cocina, recámara, baño, patio, área común)
- **Casa Valle Alto Verde**: 6 imágenes (fachada, interior, sala, cocina, recámara, baño)
- **Casa Lázaro Cárdenas**: 5 imágenes (fachada, interior, sala, cocina, recámara)
- **Casa Zona Dorada**: 6 imágenes (fachada, interior, sala, cocina, recámara, vista exterior)
- **Casa Santa Fe**: 5 imágenes (fachada, interior, sala, cocina, recámara)
- **Casa Privada Acacia Cotos**: 7 imágenes (fachada, exterior, sala, recámara principal, cocina, cochera, patio)
- ✅ **Casa Hacienda de La Mora**: 6 imágenes (fachada, interior, sala, cocina, recámara, patio)
- ✅ **Casa La Estancia I**: 8 imágenes (fachada, interior, sala, cocina, recámara, baño, patio, área social)
- ✅ **Casa Infonavit Barrancos**: 7 imágenes (fachada, interior, sala, cocina, recámara, baño, patio)

## 🔍 REGLAS DE VALIDACIÓN Y CONSISTENCIA

### REGLA #10: VALIDACIÓN OBLIGATORIA DE PRECIOS
**IMPORTANTE: Los precios en las tarjetas DEBEN coincidir exactamente con las páginas individuales.**

#### Proceso de Validación:
```bash
# 1. Leer página individual para obtener precio real
Read(file_path: "casa-[nombre-propiedad].html")
# Buscar: <title>Casa en Venta $X,XXX,XXX</title>
# O buscar: <div class="price">$X,XXX,XXX</div>

# 2. Comparar con precio en tarjeta de ciudad
# 3. Corregir si hay discrepancia
# 4. Actualizar también WhatsApp links, descripciones y especificaciones
```

#### Discrepancias Críticas Encontradas y Corregidas:
- **Casa Valle Alto Verde**: $1,350,000 → $1,300,000 ✅
- **Casa Lázaro Cárdenas**: $980,000 → $2,100,000 ✅ (diferencia de $1.12M)
- **Casa Zona Dorada**: $2,450,000 → $1,300,000 ✅ (diferencia de $1.15M)  
- **Casa Privada Acacia Cotos**: $1,950,000 → $4,100,000 ✅ (diferencia de $2.15M)

### REGLA #11: ACTUALIZACIÓN INTEGRAL POR PRECIO
**Cuando se corrige un precio, actualizar TODOS los elementos relacionados:**

```html
<!-- 1. Precio principal -->
<h3>$X,XXX,XXX</h3>

<!-- 2. Descripción (puede cambiar según el rango de precio) -->
<p>Casa [Económica/Familiar/Premium/Espectacular] en [Ubicación]</p>

<!-- 3. WhatsApp link -->
<a href="https://wa.me/526671631231?text=...de%20$X,XXX,XXX...">

<!-- 4. Especificaciones si corresponden -->
<span>X rec</span>
<span>X baños</span>
<span>X m²</span>

<!-- 5. Badge apropiado -->
<span>Disponible/Premium/Económica</span>
```

### REGLA #12: CLASIFICACIÓN POR RANGOS DE PRECIO
**Usar descripciones apropiadas según el rango:**

- **$800k - $1.2M**: "Casa Económica" / Badge: "Disponible"
- **$1.3M - $2M**: "Casa Familiar" / Badge: "Disponible" 
- **$2.1M - $3M**: "Casa Espectacular" / Badge: "Disponible"
- **$3M+**: "Casa Premium/Modelo" / Badge: "Premium"

## 📝 ACTUALIZACIONES RECIENTES

### Septiembre 2025
- ✅ **Tarjetas Clickeables**: Se agregó funcionalidad para que las tarjetas de propiedades redirijan a las páginas individuales
- ✅ **Validación de Rutas**: Se corrigieron rutas incorrectas (Casa Barcelona Villa: `culiacan-casaenrenta-barcelona-villa.html`)  
- ✅ **Uniformidad Visual**: Se mantuvo la alineación perfecta mientras se agregó clickeabilidad
- ✅ **Exclusión de Elementos**: WhatsApp buttons y carousel controls no activan la navegación
- ✅ **JavaScript Optimizado**: Click handlers limpios sin conflictos con otros elementos
- ✅ **Carousel Dots**: Se agregaron indicadores visuales (bolitas) para mostrar múltiples fotos
- ✅ **Navegación por Dots**: Funcionalidad clickeable en bolitas para navegación directa
- ✅ **Auto-hide**: Dots se ocultan automáticamente cuando hay solo 1 imagen
- ✅ **Sincronización**: Dots y flechas mantienen el estado sincronizado
- ✅ **Casa Infonavit Solidaridad**: Implementado carrusel completo con 5 imágenes y estructura uniforme
- ✅ **Casa Barcelona Villa**: Agregado carrusel con 8 imágenes disponibles, flechas y dots funcionales
- ✅ **CSS Carrusel Uniforme**: Botones circulares blancos con iconos naranjas, hover effects
- ✅ **Estructura Consistente**: Todas las propiedades con múltiples imágenes usan la misma estructura
- ✅ **Sistema JavaScript Unificado**: Un solo sistema maneja .carousel-dot y .indicator
- ✅ **12 Propiedades Completas**: Página de Culiacán con todas las propiedades y carruseles funcionales
- ✅ **Casa Urbivilla del Roble**: Carrusel implementado con 8 imágenes (era la única que faltaba)
- ✅ **Corrección Precios Críticos**: 4 propiedades tenían precios incorrectos, todas corregidas
- ✅ **Validación de Precios**: Sistema para verificar consistencia entre tarjetas y páginas individuales
- ✅ **Iconos SVG Minimalistas**: Implementados iconos vectoriales monoline en chips de propiedades
- ✅ **Sistema de Iconos Unificado**: 4 iconos SVG aplicados a todas las 12 propiedades de Culiacán

## 🎨 REGLA #13: SISTEMA DE ICONOS SVG PARA PROPERTY CHIPS

### Especificaciones de Iconos Obligatorias
**IMPORTANTE: Usar estos iconos SVG exactos con estilo monoline para todas las property chips.**

#### 1. Icono RECÁMARAS (rec)
```html
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1C1B" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 7v4"/>
    <path d="M18 7v4"/>
    <rect x="4" y="11" width="16" height="6" rx="1"/>
    <path d="M6 17v3"/>
    <path d="M18 17v3"/>
</svg>
```

#### 2. Icono BAÑOS
```html
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1C1B" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="3" width="14" height="5" rx="1"/>
    <path d="M8 5.5h8"/>
    <path d="M10.5 9h3"/>
    <path d="M12 9v2"/>
    <path d="M9 11h6"/>
    <path d="M7 14a5 5 0 0 0 10 0"/>
    <path d="M12 14v5"/>
    <path d="M10.5 19h3"/>
</svg>
```

#### 3. Icono METROS CUADRADOS (m²)
```html
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1C1B" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <text x="7" y="15" font-size="8" font-family="Inter, Arial, sans-serif" fill="none" stroke="#1C1C1B" stroke-width="1.2" paint-order="stroke">m</text>
    <text x="14.6" y="10" font-size="5" font-family="Inter, Arial, sans-serif" fill="none" stroke="#1C1C1B" stroke-width="1.2" paint-order="stroke">2</text>
    <path d="M6 19v-1 M9 19v-1 M12 19v-1 M15 19v-1 M18 19v-1"/>
</svg>
```

#### 4. Icono SEGURIDAD/CARACTERÍSTICAS
```html
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1C1B" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3l6 2v6c0 5-3.5 7.5-6 9c-2.5-1.5-6-4-6-9V5l6-2z"/>
</svg>
```

### Estructura HTML Obligatoria para Chips con Iconos
```html
<div class="flex flex-wrap gap-2 mb-4 property-details-chips">
    <!-- RECÁMARAS -->
    <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium font-poppins flex items-center gap-1.5">
        [ICONO RECÁMARAS SVG]
        X rec
    </span>
    
    <!-- BAÑOS -->
    <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium font-poppins flex items-center gap-1.5">
        [ICONO BAÑOS SVG]
        X baños
    </span>
    
    <!-- METROS CUADRADOS -->
    <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium font-poppins flex items-center gap-1.5">
        [ICONO M² SVG]
        X m²
    </span>
    
    <!-- CARACTERÍSTICAS -->
    <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium font-poppins flex items-center gap-1.5">
        [ICONO SEGURIDAD SVG]
        [CARACTERÍSTICA]
    </span>
</div>
```

### Características de los Iconos SVG
- **Estilo**: Monoline minimalista con contorno fino uniforme
- **Color**: #1C1C1B (negro marca)
- **Grosor**: stroke-width="1.75" para consistencia
- **Sin rellenos**: fill="none" en todos
- **Tamaño**: 14x14px con viewBox 24x24
- **Spacing**: gap-1.5 entre icono y texto

### Propiedades con Iconos SVG Implementados
**Página Culiacán (12/12 propiedades actualizadas):**
- ✅ **Casa Infonavit Solidaridad**: 2 rec, 2 baños, 112.5 m², Cochera
- ✅ **Casa Barcelona Villa**: 3 rec, 2 baños, 198 m², Amueblada  
- ✅ **Casa Urbivilla del Roble**: 1 rec, 1 baño, 77 m², Cochera
- ✅ **Casa Hacienda de La Mora**: 1 baño, 55 m², Estacionamiento, A/A
- ✅ **Casa La Estancia I**: 2 rec, 1.5 baños, 82 m², Seguridad
- ✅ **Casa Infonavit Barrancos**: 1.5 baños, 79 m², 2 Autos, A/A
- ✅ **Casa Valle Alto Verde**: 2 rec, 1 baño, 120 m², Seguridad
- ✅ **Casa Lázaro Cárdenas**: 3 rec, 2.5 baños, 225 m², 2 Autos
- ✅ **Casa Zona Dorada**: 2 rec, 1.5 baños, 90 m², Cochera
- ✅ **Casa Santa Fe**: 3 rec, 2.5 baños, 145 m², Jardín
- ✅ **Casa Privada Acacia Cotos**: 3 rec, 3.5 baños, 2 Autos, Vigilancia

## 📋 REGLA #14: CHECKLIST OBLIGATORIO PARA NUEVAS PROPIEDADES

### ⚠️ PROCESO MANDATORIO PARA CADA NUEVA PROPIEDAD
**SIEMPRE seguir este checklist COMPLETO antes de agregar cualquier propiedad nueva:**

#### ✅ **1. ESTRUCTURA BASE DE TARJETA**
```html
<div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative" 
     data-href="../[ruta-archivo-individual].html">
    
    <!-- IMAGEN CON CARRUSEL -->
    <div class="relative aspect-video">
        <div class="carousel-container" data-current="0">
            <!-- MÍNIMO 1 imagen, óptimo 3-8 imágenes -->
            <img src="[ruta-imagen]" alt="[Descripción detallada]" loading="lazy" decoding="async" class="w-full h-full object-cover carousel-image active">
            <!-- Más imágenes si están disponibles -->
        </div>
        
        <!-- CONTROLES CARRUSEL (solo si >1 imagen) -->
        <button class="carousel-prev" aria-label="Imagen anterior">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button class="carousel-next" aria-label="Siguiente imagen">
            <i class="fas fa-chevron-right"></i>
        </button>
        
        <!-- DOTS CARRUSEL (solo si >1 imagen) -->
        <div class="carousel-indicators">
            <!-- Un button.indicator por cada imagen -->
        </div>
        
        <!-- BADGES OBLIGATORIOS -->
        <div class="absolute top-3 left-3 flex gap-2">
            <span class="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium font-poppins">[VENTA/RENTA]</span>
            <span class="bg-hector text-white px-2 py-1 rounded-lg text-xs font-medium font-poppins">Disponible</span>
        </div>
        
        <!-- BOTÓN FAVORITOS -->
        <button class="favorite-btn absolute top-3 right-3 bg-white/80 hover:bg-white p-2 rounded-full shadow-md">
            <svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21s-6.7-3.9-9.3-8A5.5 5.5 0 0 1 12 6.2 5.5 5.5 0 0 1 21.3 13c-2.6 4.1-9.3 8-9.3 8Z"/>
            </svg>
        </button>
    </div>
</div>
```

#### ✅ **2. SECCIÓN DE CONTENIDO OBLIGATORIA**
```html
<div class="p-6">
    <!-- PRECIO (verificado contra página individual) -->
    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">$[PRECIO-EXACTO]</h3>
    
    <!-- DESCRIPCIÓN (según clasificación de precio) -->
    <p class="text-gray-600 mb-4 font-poppins">[Casa Económica/Familiar/Espectacular/Premium] en [Ubicación] · [Detalles adicionales], [Ciudad]</p>
    
    <!-- PROPERTY CHIPS CON ICONOS SVG OBLIGATORIOS -->
    <div class="flex flex-wrap gap-2 mb-4 property-details-chips">
        <!-- RECÁMARAS (si aplica) -->
        <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium font-poppins flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1C1B" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 7v4"/><path d="M18 7v4"/><rect x="4" y="11" width="16" height="6" rx="1"/><path d="M6 17v3"/><path d="M18 17v3"/>
            </svg>
            [#] rec
        </span>
        
        <!-- BAÑOS (siempre incluir) -->
        <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium font-poppins flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1C1B" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="3" width="14" height="5" rx="1"/><path d="M8 5.5h8"/><path d="M10.5 9h3"/><path d="M12 9v2"/><path d="M9 11h6"/><path d="M7 14a5 5 0 0 0 10 0"/><path d="M12 14v5"/><path d="M10.5 19h3"/>
            </svg>
            [#] baños
        </span>
        
        <!-- METROS CUADRADOS (si está disponible) -->
        <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium font-poppins flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1C1B" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><text x="7" y="15" font-size="8" font-family="Inter, Arial, sans-serif" fill="none" stroke="#1C1C1B" stroke-width="1.2" paint-order="stroke">m</text><text x="14.6" y="10" font-size="5" font-family="Inter, Arial, sans-serif" fill="none" stroke="#1C1C1B" stroke-width="1.2" paint-order="stroke">2</text><path d="M6 19v-1 M9 19v-1 M12 19v-1 M15 19v-1 M18 19v-1"/>
            </svg>
            [#] m²
        </span>
        
        <!-- CARACTERÍSTICAS (1-2 principales) -->
        <span class="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium font-poppins flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1C1B" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3l6 2v6c0 5-3.5 7.5-6 9c-2.5-1.5-6-4-6-9V5l6-2z"/>
            </svg>
            [Cochera/Seguridad/Amueblada/A-A/etc]
        </span>
    </div>
    
    <!-- CTA BUTTON CON WHATSAPP PERSONALIZADO -->
    <a href="https://wa.me/526671631231?text=Hola%20Hector,%20me%20interesa%20la%20[Descripción Propiedad]%20de%20$[PRECIO].%20¿Podrías%20darme%20más%20información?" 
       class="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl text-center block transition-colors font-poppins"
       onclick="event.stopPropagation()">
        Solicitar tour
    </a>
</div>
```

#### ✅ **3. VALIDACIONES OBLIGATORIAS ANTES DE PUBLICAR**

##### **A. Validación de Precio**
```bash
# 1. Leer página individual
Read(file_path: "casa-[nombre].html")
# 2. Buscar precio en <title> o <div class="price">
# 3. Comparar con precio en tarjeta
# 4. CORREGIR si hay discrepancia
```

##### **B. Validación de Archivo Individual**
```bash
# Verificar que existe el archivo:
ls casa-[nombre].html
# Verificar que data-href apunta correctamente:
data-href="../casa-[nombre].html"
```

##### **C. Validación de Imágenes**
```bash
# Verificar que existen las imágenes:
ls images/[carpeta-propiedad]/
# Mínimo 1 imagen, óptimo 3-8 imágenes
# Primera imagen = fachada principal
```

##### **D. Validación de Características**
- **Baños**: SIEMPRE incluir (ej: "1 baño", "2.5 baños")  
- **Recámaras**: Solo si aplica (ej: "2 rec", "3 rec")
- **m²**: Incluir si está disponible
- **Características**: Máximo 1-2 principales (Cochera, Seguridad, Amueblada, etc.)

#### ✅ **4. POST-IMPLEMENTACIÓN**
```bash
# 1. Abrir página local para verificar
open culiacan/index.html

# 2. Verificar elementos críticos:
- ✅ Carrusel funcional (flechas + dots)
- ✅ Tarjeta clickeable (excepto WhatsApp)
- ✅ Iconos SVG visibles y alineados
- ✅ Precio correcto
- ✅ WhatsApp link personalizado

# 3. Deploy y verificación final
# 4. Probar en https://casasenventa.info
```

### 🚨 **ELEMENTOS NO NEGOCIABLES**
- **Iconos SVG**: OBLIGATORIOS en todos los chips
- **Precio validado**: DEBE coincidir con página individual  
- **WhatsApp personalizado**: Mensaje específico por propiedad
- **Carrusel funcional**: Si hay >1 imagen
- **Tarjeta clickeable**: Navegación a página individual
- **CSS uniforme**: Usar structure base obligatoria

### ⏱️ **TIEMPO ESTIMADO POR PROPIEDAD**
- **Preparación**: 10 minutos (imágenes, datos)
- **Implementación**: 15 minutos (código, validaciones)  
- **Testing**: 5 minutos (local + deployed)
- **Total**: ~30 minutos por propiedad nueva

## 🎨 REGLA #15: SISTEMA DE BOTONES Y ELEMENTOS UI MODERNOS

### Especificaciones de Diseño Obligatorias
**IMPORTANTE: Usar estos estilos exactos para todos los botones y elementos UI.**

#### CSS Obligatorio para Botones Modernos
```css
/* New Button Styles from JSON */
.btn-primary {
    font-family: 'Inter', system-ui, sans-serif !important;
    font-weight: 600 !important;
    font-size: 16px !important;
    height: 48px !important;
    border-radius: 12px !important;
    background: linear-gradient(135deg, #FF6A1A 0%, #FF8A2B 100%) !important;
    color: #FFFFFF !important;
    border: none !important;
    transition: all 0.2s ease !important;
}

.btn-primary:hover {
    background: linear-gradient(135deg, #E65F17 0%, #FF7C1F 100%) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(255, 106, 26, 0.3) !important;
}

.btn-primary:active {
    background: linear-gradient(135deg, #CC5415 0%, #F36E17 100%) !important;
    transform: translateY(0px) !important;
}

/* Badge Styles from JSON */
.badge-venta {
    font-family: 'Inter', system-ui, sans-serif !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    background: #F97316 !important;
    color: #FFFFFF !important;
    padding: 6px 12px !important;
    border-radius: 20px !important;
}

/* Icon Button (Favorite) Styles from JSON */
.btn-icon {
    width: 40px !important;
    height: 40px !important;
    border-radius: 50% !important;
    background: #FFFFFF !important;
    border: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.btn-icon:hover {
    background: #F6F6F6 !important;
}

.btn-icon:active {
    background: #ECECEC !important;
}

.btn-icon svg {
    color: #1C1C1B !important;
}
```

#### HTML Estructurado para Botones Modernos
```html
<!-- BOTÓN CTA PRINCIPAL -->
<a href="[URL-WHATSAPP]" class="w-full btn-primary text-center block" onclick="event.stopPropagation()">
    Solicitar Tour
</a>

<!-- BADGE VENTA -->
<span class="badge-venta">VENTA</span>

<!-- BOTÓN FAVORITO -->
<button class="btn-icon absolute top-3 right-3">
    <svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21s-6.7-3.9-9.3-8A5.5 5.5 0 0 1 12 6.2 5.5 5.5 0 0 1 21.3 13c-2.6 4.1-9.3 8-9.3 8Z"/>
    </svg>
</button>
```

### Especificaciones Técnicas de Botones

#### 1. **Botón Primary (CTA)**
- **Dimensiones**: 48px altura, border-radius 12px
- **Tipografía**: Inter, peso 600, tamaño 16px
- **Gradiente**: #FF6A1A → #FF8A2B (135° diagonal)
- **Hover**: Gradiente más oscuro + elevación (-1px) + sombra naranja
- **Active**: Gradiente aún más oscuro + posición normal
- **Transición**: 0.2s ease en todas las propiedades

#### 2. **Badge Tag (VENTA)**
- **Forma**: Pill (border-radius 20px)
- **Tipografía**: Inter, peso 700, tamaño 12px
- **Color**: #F97316 fondo, #FFFFFF texto
- **Padding**: 6px horizontal, 12px vertical
- **Sin efectos hover** (elemento informativo)

#### 3. **Icon Button (Favorito)**
- **Forma**: Círculo perfecto (40x40px)
- **Fondo**: #FFFFFF con sombra suave
- **Hover**: #F6F6F6 (gris muy claro)
- **Active**: #ECECEC (gris claro)
- **Icono**: #1C1C1B (negro marca)
- **Sombra**: 0 2px 8px rgba(0,0,0,0.1)

### Implementación en Propiedades Existentes
**Página Culiacán - Botones Modernos Aplicados (32 elementos actualizados):**
- ✅ **11 Botones CTA**: Gradiente naranja con efectos hover
- ✅ **10 Badges VENTA**: Estilo pill moderno
- ✅ **11 Botones Favorito**: Circulares con sombra

### Diferencias con Sistema Anterior
| Elemento | Antes | Ahora |
|----------|-------|-------|
| **CTA Button** | Verde sólido + Tailwind | Gradiente naranja + Inter |
| **Badge** | Rectangular verde | Pill naranja |
| **Favorito** | Semi-transparente | Circular blanco con sombra |
| **Tipografía** | Poppins | Inter (botones) |
| **Efectos** | Básicos | Elevación + sombras |

### Beneficios del Nuevo Sistema
- **Coherencia visual** con especificaciones JSON
- **Mejor UX** con efectos hover/active claros
- **Diseño moderno** con gradientes y sombras
- **Accesibilidad** mejorada con contrastes apropiados
- **Performance** optimizada con transiciones suaves

### Problemas Comunes Resueltos
- **Error 404 en propiedades**: Verificar que los archivos HTML individuales existen y están deployados
- **Cache del navegador**: Usar Ctrl+Shift+R o ventana incógnita para probar después de deployment
- **Rutas incorrectas**: Validar que `data-href` apunta a archivos existentes
- **Alineación rota**: El CSS uniforme debe aplicarse ANTES de agregar funcionalidad clickeable
- **Dots no aparecen**: Verificar que hay múltiples imágenes en el carousel (auto-hide si hay solo 1)
- **Dots no clickeables**: Asegurar que tienen `e.stopPropagation()` para no activar navegación de tarjeta
- **Dots desincronizados**: Verificar que `showImage()` actualiza tanto imágenes como dots
- **Carruseles mixtos no funcionan**: Sistema unificado maneja .carousel-dot Y .indicator
- **Precios inconsistentes**: Validar SIEMPRE contra página individual antes de deployment
- **Discrepancias críticas**: Diferencias de millones pueden ocurrir, verificar 2-3 veces
- **JavaScript duplicado**: Un solo sistema de carrusel elimina conflictos de event listeners

### Procedimientos Técnicos Implementados

#### Solución de Carruseles Mixtos:
```javascript
// ANTES: Dos sistemas separados
const dots1 = container.parentNode.querySelectorAll('.carousel-dot');
const dots2 = container.parentNode.querySelectorAll('.indicator');

// DESPUÉS: Sistema unificado
const dots = container.parentNode.querySelectorAll('.carousel-dot, .indicator');
```

#### Validación de Precios (Proceso Completo):
```bash
1. Read(página individual) → Extraer precio real
2. Grep(página ciudad) → Localizar precio en tarjeta  
3. Edit(correcciones) → Actualizar precio + descripción + WhatsApp + specs
4. Commit → Documentar cambio con diferencia exacta
5. Deploy → Verificar consistencia en producción
```

---

**IMPORTANTE**: Estas reglas garantizan consistencia visual y funcional en todas las páginas de ciudad del sitio.