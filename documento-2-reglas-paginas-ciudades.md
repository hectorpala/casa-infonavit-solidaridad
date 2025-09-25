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

### Propiedades con Carrusel Implementado
- **Casa Infonavit Solidaridad**: 5 imágenes (fachada, exterior, sala, cocina, recámara)
- **Casa Barcelona Villa**: 8 imágenes (fachada, interior, sala, cocina, recámara, baño, patio, área social)

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

### Problemas Comunes Resueltos
- **Error 404 en propiedades**: Verificar que los archivos HTML individuales existen y están deployados
- **Cache del navegador**: Usar Ctrl+Shift+R o ventana incógnita para probar después de deployment
- **Rutas incorrectas**: Validar que `data-href` apunta a archivos existentes
- **Alineación rota**: El CSS uniforme debe aplicarse ANTES de agregar funcionalidad clickeable
- **Dots no aparecen**: Verificar que hay múltiples imágenes en el carousel (auto-hide si hay solo 1)
- **Dots no clickeables**: Asegurar que tienen `e.stopPropagation()` para no activar navegación de tarjeta
- **Dots desincronizados**: Verificar que `showImage()` actualiza tanto imágenes como dots

---

**IMPORTANTE**: Estas reglas garantizan consistencia visual y funcional en todas las páginas de ciudad del sitio.