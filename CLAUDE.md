# PROYECTO: Hector es Bienes Raíces - Website

## 🏠 CONTEXTO DEL PROYECTO
Sitio web de bienes raíces con propiedades en Culiacán, Sinaloa. Especializado en compra, remodelación y venta/renta de propiedades.

## 🎯 COMANDOS PRINCIPALES

### ⚡ SCRAPER AUTOMÁTICO - MÉTODO MÁS RÁPIDO (3 MINUTOS) ✨
**Comando usuario:** Pasa la URL de propiedades.com
**Ejemplo:** "https://propiedades.com/inmuebles/casa-en-venta-culiacan-..."
**Script:** `node scraper-y-publicar.js "URL"`
**Tiempo:** ~3 minutos (¡TODO automatizado!)

**Proceso 100% automático:**
1. ✅ Scrapea datos de propiedades.com con Puppeteer
2. ✅ Descarga TODAS las fotos automáticamente
3. ✅ Genera HTML con PropertyPageGenerator
4. ✅ Corrige TODOS los badges automáticamente (recámaras, baños, m²)
5. ✅ Corrige TODOS los metadatos (title, description, Schema.org, OG, hero)
6. ✅ Genera tarjeta para culiacan/index.html
7. ✅ Listo para "publica ya"

**Documentación completa:** Ver `INSTRUCCIONES_SCRAPER.md`

### 🚀 AGREGAR PROPIEDAD DESDE PROYECTOS (5-7 MIN)
**Comando:** `node add-property.js`
**Cuándo usar:** Cuando tienes fotos en carpeta PROYECTOS (no en propiedades.com)
**Tiempo:** 5-7 minutos
**Incluye:**
- ✅ Auto-detecta fotos en PROYECTOS
- ✅ Optimiza automáticamente
- ✅ Genera página HTML
- ✅ Inserta en listings
- ✅ Commit y push automático

**Documentación completa:** Ver `ADD-PROPERTY-README.md`

### PUBLICAR CAMBIOS
**Comando usuario:** "publica ya"
**Acción:** Usar gitops-publicador para deployment directo

## 🔧 SISTEMA DE AUTOMATIZACIÓN

### PropertyPageGenerator - **OPCIÓN 1: INTEGRACIÓN INTELIGENTE + MODERN FEATURES** ✅
- **Ubicación:** `automation/property-page-generator.js`
- **Templates:** `automation/templates/rental-template.html` y `property-template.html`
- **Modern Features:** `automation/templates/modern-features.js` (nuevo)
- **🤖 AUTOMÁTICO:** Auto-detecta fotos en carpeta PROYECTOS
- **🤖 AUTOMÁTICO:** Ejecuta `automation/optimizar-fotos.sh` sin intervención
- **🤖 AUTOMÁTICO:** Ejecuta `verificar-optimizaciones.sh` pre-publicación
- **🔧 INTEGRACIÓN:** Sistema que preserva todas las propiedades existentes
- **🔧 INTEGRACIÓN:** Detecta estructura dual (clásica vs Tailwind CSS) automáticamente
- **🔧 INTEGRACIÓN:** Validación pre-deploy para evitar pérdida de propiedades

#### ✨ MODERN FEATURES (Actualización 2025) - AUTOMÁTICO
Todas las nuevas propiedades generadas incluyen automáticamente:

1. **📌 Sticky Price Bar**
   - Barra fija superior con precio + botón WhatsApp
   - Aparece al hacer scroll pasado el hero
   - Responsive: mobile muestra solo ícono WhatsApp
   - Vibración al clickear (50ms)

2. **🎬 Scroll Animations**
   - Fade-in suave para todas las secciones
   - Animaciones escalonadas (features, badges)
   - Intersection Observer API (alto rendimiento)
   - Vibración sutil al entrar en vista (20ms)

3. **📳 Haptic Feedback (Vibración)**
   - Carrusel de fotos: 40ms al cambiar
   - Lightbox: 50ms al abrir, 40ms al navegar
   - Calculadora: 30ms en sliders y inputs
   - Compatible con Android, limitado en iOS

4. **💰 Calculadora Zillow Reducida**
   - Tamaño: 70% del original
   - Estilo moderno vertical
   - Input de precio con formato $X,XXX,XXX
   - Sliders naranjas interactivos

5. **📦 Hero Compacto**
   - Description box 50% más pequeño
   - Título: 4rem → 2rem
   - Subtítulo: 1.3rem → 0.65rem
   - Botón CTA reducido proporcionalmente

6. **🎨 Características Mejoradas**
   - Iconos 15% más grandes (mejor visibilidad)
   - Layout horizontal compacto
   - Badges Zillow-style para detalles

#### 🆕 MÉTODO DE COPIA EXACTA (2025)
**USO:** Para propiedades que necesitan EXACTAMENTE la misma estructura que Casa Solidaridad

**Función:** `generateFromSolidaridadTemplate(config)`

**Proceso:**
1. **Copia completa** de `culiacan/infonavit-solidaridad/index.html`
2. **Cambios SOLO de datos** (preserva toda la estructura, código, estilos)
3. **Auto-adaptación** de carrusel según número de fotos

**Qué cambia automáticamente:**
- ✅ Precio (todos los formatos: $X,XXX,XXX y números)
- ✅ Título de propiedad (todos los lugares)
- ✅ Ubicación (dirección completa y corta)
- ✅ Recámaras (cantidad + singular/plural)
- ✅ Baños (cantidad + singular/plural)
- ✅ M² construcción y terreno
- ✅ Mensajes WhatsApp personalizados
- ✅ `totalSlidesHero` según número de fotos
- ✅ Rutas de imágenes → `images/[slug]/foto-X.jpg`
- ✅ Elimina slides/dots extras si hay menos de 14 fotos
- ✅ **LIMPIA array lightboxImages** automáticamente (solo fotos existentes)

**Qué se preserva 100%:**
- ✅ Sticky Price Bar
- ✅ Scroll Animations
- ✅ Haptic Feedback
- ✅ Calculadora Zillow
- ✅ Hero reducido
- ✅ Características compactas
- ✅ Estructura HTML completa
- ✅ Todo el CSS y JavaScript

**Config mínima requerida:**
```javascript
{
    key: 'casa-venta-nombre-slug',
    title: 'Casa Nombre Completo',
    price: '$X,XXX,XXX',
    location: 'Colonia, CP',
    bedrooms: 2,
    bathrooms: 2,
    construction_area: 100.5,
    land_area: 120.0,
    photoCount: 7  // Número de fotos disponibles
}
```

**Llamada:**
```javascript
const generator = new PropertyPageGenerator();
const html = generator.generateFromSolidaridadTemplate(config);
fs.writeFileSync('casa-venta-nueva.html', html);
```

**VENTAJA:** Garantiza consistencia total con Casa Solidaridad (todas las features modernas)

- **Función:** PROCESO 100% AUTOMÁTICO - Solo requiere fotos en PROYECTOS

### 📸 Estructura de Fotos - **CRÍTICO**

#### VENTA:
- **Origen:** `/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/[carpeta]/`
- **Destino:** `culiacan/[slug]/images/`
- **Archivo HTML:** `culiacan/[slug]/index.html`
- **⚠️ REGLA FACHADA:** La foto-1.jpg SIEMPRE debe ser la fachada de la casa
- **Proceso optimización:**
  1. Auto-detecta carpeta en PROYECTOS
  2. Optimiza: PNG→JPG, 85% calidad, 1200px max
  3. Renombra: foto-1.jpg, foto-2.jpg, ... foto-N.jpg
  4. **VERIFICAR**: Identificar manualmente cuál es la fachada
  5. **REORGANIZAR**: Swap de fotos para poner fachada como foto-1.jpg

#### RENTA:
- **Origen:** `/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/[carpeta]/`
- **Destino:** `images/[slug]/`
- **Archivo HTML:** `casa-renta-[slug].html` (ROOT)
- **⚠️ REGLA FACHADA:** La foto-1.jpg SIEMPRE debe ser la fachada de la casa

### 🎨 TEMPLATES DE REFERENCIA

#### Template VENTA - **La Perla Premium** ✅
- **Archivo:** `casa-venta-casa-en-venta-privada-la-perla-premium.html`
- **Ubicación:** ROOT
- **Estructura completa:**
  - ✅ Hero Section con dual carousel (10 fotos) + price badge
  - ✅ Features Section (6 tarjetas Font Awesome icons)
  - ✅ Gallery Carousel (independiente del hero)
  - ✅ Details Section (info grid + price card)
  - ✅ Calculator Section (hipoteca completa)
  - ✅ Contact Section (WhatsApp + teléfono)
  - ✅ WhatsApp Floating Button
  - ✅ Footer
  - ✅ Dual Carousel JavaScript (hero + gallery separados)
  - ✅ Touch/swipe support móvil

#### Template RENTA - **Privanzas Natura** ✅
- **Archivo:** `casa-renta-privanzas-natura.html`
- **Ubicación:** ROOT
- **Estructura:** Similar a VENTA pero con badge naranja

## 📄 ARCHIVOS CRÍTICOS

### Páginas Principales
- `culiacan/index.html` - **PÁGINA PRINCIPAL QUE SIRVE EL SITIO**
- `index.html` - Backup/landing principal
- **VENTA:** `culiacan/[slug]/index.html`
- **RENTA:** `casa-renta-[slug].html` (ROOT)

### Estilos y Scripts
- `culiacan/infonavit-solidaridad/styles.css` - CSS principal compartido
- Carruseles JavaScript embebidos en cada página
- Font: Poppins (Google Fonts)
- Icons: Font Awesome 6.0.0

## ⚙️ OPTIMIZACIONES IMPLEMENTADAS
- SEO completo (meta tags, structured data Schema.org, Open Graph)
- Performance (preloading, DNS prefetch, lazy loading)
- WhatsApp integration con mensajes personalizados URL-encoded
- Dual carousel system (hero + gallery independientes)
- Responsive design mobile-first
- Calculadoras hipoteca/renta interactivas
- PWA meta tags y manifest.json

## 🚀 DEPLOYMENT
- **Servicio:** GitHub Pages
- **URL Principal:** https://casasenventa.info (NO zasakitchenstudio.mx)
- **Comando:** "publica ya" → gitops-publicador → merge directo a main
- **Tiempo deploy:** 1-2 minutos
- **Verificación:** Siempre verificar en casasenventa.info después del deployment

## 📱 CARACTERÍSTICAS ESPECIALES
- Botones WhatsApp flotantes personalizados por propiedad
- Calculadoras de renta/hipoteca interactivas
- Carruseles touch/swipe para móvil
- Optimización de imágenes automática (sips)
- Cache busting para actualizaciones (?v=hash)

## 🎨 CONVENCIONES DE CÓDIGO

### Archivos y Carpetas:
- **VENTA:** `culiacan/[slug]/index.html` + `culiacan/[slug]/images/`
- **RENTA:** `casa-renta-[slug].html` (ROOT) + `images/[slug]/`
- **Slug:** lowercase, sin acentos, guiones (ej: "san-agustin-primavera")

### Tarjetas en culiacan/index.html:

#### VENTA (badge verde):
```html
<!-- BEGIN CARD-ADV [slug] -->
<div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
     data-href="[slug]/index.html">
    <div class="relative aspect-video">
        <!-- PRICE BADGE VERDE OBLIGATORIO -->
        <div class="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
            $X,XXX,XXX
        </div>

        <!-- CAROUSEL con onclick="changeImage()" -->
        <div class="carousel-container" data-current="0">
            <img src="[slug]/images/foto-1.jpg" ... class="carousel-image active">
            <!-- ... más fotos ... -->
            <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)">
            <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)">
        </div>

        <!-- Favoritos SVG -->
        <button class="favorite-btn absolute top-3 left-3 ...">
            <svg class="w-5 h-5 text-gray-600 hover:text-red-500" ...>
        </button>
    </div>

    <div class="p-6">
        <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">$X,XXX,XXX</h3>
        <p class="text-gray-600 mb-4 font-poppins">Casa en Venta [Ubicación] · Culiacán</p>

        <!-- SVG ICONS (NO Font Awesome en tarjetas) -->
        <div class="flex flex-wrap gap-3 mb-6">
            <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                <svg class="w-4 h-4" ...><!-- bed icon --></svg>
                X Recámaras
            </div>
            <!-- ... baños, m² ... -->
        </div>

        <!-- CTA VERDE -->
        <a href="[slug]/index.html"
           class="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center font-semibold py-3 px-6 rounded-lg ...">
            Ver Detalles
        </a>
    </div>
</div>
<!-- END CARD-ADV [slug] -->
```

#### RENTA (badge naranja):
```html
<!-- Igual estructura pero: -->
- Badge: bg-orange-500
- Precio: $XX,XXX/mes
- CTA: from-orange-500 to-orange-600
- href: ../casa-renta-[slug].html
- images: ../images/[slug]/foto-X.jpg
```

### Filtros JavaScript Automáticos:
- **VENTA**: Detecta badge `bg-green-600` + precio SIN "/mes"
- **RENTA**: Detecta badge `bg-orange-500` + precio CON "/mes"
- El sistema filtra automáticamente por clase CSS del badge

## 📋 PROCESO VERIFICACIÓN - **CHECKLIST OBLIGATORIO**

### Antes de crear propiedad:
1. ✅ Fotos en carpeta PROYECTOS
2. ✅ Identificar cuál foto es la FACHADA
3. ✅ Datos completos: título, ubicación, precio, recámaras, baños, m²

### Durante creación:
1. ✅ Optimizar fotos (automation/optimizar-fotos.sh)
2. ✅ Renombrar a foto-1.jpg, foto-2.jpg, etc.
3. ✅ **CRÍTICO:** Poner FACHADA como foto-1.jpg (swap si es necesario)
4. ✅ Crear página con template correcto (La Perla Premium para VENTA)
5. ✅ Verificar meta tags, Schema.org, WhatsApp links
6. ✅ Agregar tarjeta en culiacan/index.html con badge correcto

### Después de publicar:
1. ✅ Verificar en https://casasenventa.info/culiacan/[slug]/
2. ✅ Confirmar fachada como imagen principal
3. ✅ Validar aparición en filtro correcto (VENTA o RENTA)
4. ✅ Verificar WhatsApp links funcionan
5. ✅ Probar carruseles (flechas + dots + swipe móvil)
6. ✅ Validar calculadora hipoteca con precio correcto

## 🔧 COMANDOS CLAVE
- **Invocar instrucciones**: "Lee INSTRUCCIONES_AGREGAR_PROPIEDADES.md"
- **Identificar fotos**: "puedes identificar las fotos osea saber que son?"
- **Reorganizar fachada**: "pon la fachada como foto-1"
- **Crear propiedad**: "sube esta nueva propiedad en venta/renta"
- **Publicar**: "publica ya"

## 🧠 SISTEMA INTEGRACIÓN INTELIGENTE - DETALLES TÉCNICOS

### Funciones Críticas Implementadas:
- **`extractExistingProperties()`**: Extrae propiedades existentes de HTML usando regex dual
- **`generateIntegratedListing()`**: Combina nueva propiedad con existentes preservando formato
- **`generatePropertyCard()`**: Genera tarjetas con estructura específica por página
- **`validatePropertyCount()`**: Validación pre-deploy para evitar pérdida de datos

### Detección Automática de Estructura:
```javascript
const isCuliacanPage = htmlFilePath.includes('culiacan');
// Estructura Tailwind CSS: <!-- BEGIN CARD-ADV [key] -->
// Estructura clásica: <a href="..." class="property-card">
```

### Preservación de Contenido:
- ✅ Lee propiedades existentes ANTES de integrar
- ✅ Combina nueva propiedad con todas las existentes
- ✅ Usa string replacement para evitar corrupción de regex
- ✅ Valida count de propiedades antes de deployment

## 📐 REGLAS DE ESTRUCTURA HTML - VENTA

### Meta Tags OBLIGATORIOS:
```html
<title>Casa en Venta $X,XXX,XXX - [Ubicación] | Hector es Bienes Raíces</title>
<meta name="description" content="[Descripción con recámaras, baños, amenidades]">
<meta name="keywords" content="casa venta [ubicación], X recámaras, X baños, [amenidades]">
<link rel="canonical" href="https://casasenventa.info/culiacan/[slug]/">
```

### Schema.org OBLIGATORIO:
```json
{
  "@context": "https://schema.org",
  "@type": "SingleFamilyResidence",
  "name": "[Título propiedad]",
  "numberOfBedrooms": X,
  "numberOfBathroomsTotal": X.X,
  "floorSize": {"value": XXX, "unitCode": "MTK"},
  "offers": {
    "price": "XXXXXXX",
    "priceCurrency": "MXN"
  },
  "amenityFeature": [...]
}
```

### Carruseles Duales:
```javascript
// HERO CAROUSEL
let currentSlideHero = 0;
const totalSlidesHero = 10; // Actualizar según cantidad de fotos
function changeSlideHero(direction) { ... }

// GALLERY CAROUSEL
let currentSlide = 0;
const totalSlides = 10; // Actualizar según cantidad de fotos
function changeSlide(direction) { ... }
```

### Calculadora Hipoteca:
```javascript
// Precio default debe coincidir con el de la propiedad
<input type="number" id="precio" value="6550000" ...>
<span id="engancheDisplay">5% = $327,500</span>
```

## 📈 HISTORIAL DE ÉXITO

### Propiedades Implementadas:
- **Casa Privada Puntazul**: Commit 48ec161 ✅
- **Casa Zona Dorada**: Commit 7df9bcf ✅
- **Villa Andalucía**: Commit 1e9183c ✅
- **Casa Colinas San Miguel**: RENTA con badge naranja ✅
- **Casa Viñedos de Vascos**: Commit d04e1e3 - RENTA ✅
- **Casa San Agustín La Primavera**: Commits 73e5121 + 70aabb3 + 7c31f60 ✅
  - ✅ Template La Perla Premium replicado
  - ✅ Estructura completa: Hero + Features + Gallery + Calculator
  - ✅ Fachada como foto-1.jpg (reorganizada)
  - ✅ Badge verde bg-green-600 para VENTA
  - ✅ Dual carousel con touch/swipe
  - ✅ Schema.org completo con amenidades

### Lecciones Aprendidas:
- ✅ Sistema de integración inteligente funcionando
- ✅ Preservación de todas las propiedades existentes
- ✅ Estructura dual compatible (clásica + Tailwind CSS)
- ✅ Template La Perla Premium como estándar VENTA
- ✅ **CRÍTICO**: Siempre verificar y poner fachada como foto-1.jpg
- ✅ Badge verde (VENTA) vs naranja (RENTA) para filtros

## 🎯 PRÓXIMAS PROPIEDADES

### Checklist rápido:
1. ✅ Fotos en PROYECTOS
2. ✅ Identificar FACHADA visualmente
3. ✅ Optimizar con `automation/optimizar-fotos.sh`
4. ✅ **Reorganizar**: fachada = foto-1.jpg
5. ✅ Template La Perla Premium (VENTA) o Privanzas (RENTA)
6. ✅ Tarjeta con badge correcto en culiacan/index.html
7. ✅ Commit + "publica ya"
8. ✅ Verificar en casasenventa.info

### Documentación Adicional:
- `automation/RESUMEN_ACTUALIZACION.md` - Guía estructura La Perla Premium
- `automation/pagegeneratornuevo.js` - Generator automatizado
- `automation/pagegeneratornuevo.js.backup` - Respaldo del generator
