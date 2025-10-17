# PROYECTO: Hector es Bienes Raíces - Website

## 🏠 CONTEXTO DEL PROYECTO
Sitio web de bienes raíces con propiedades en Culiacán, Sinaloa. Especializado en compra, remodelación y venta/renta de propiedades.

## 🚀 RESUMEN RÁPIDO - GENERACIÓN DE PÁGINAS

### **VENTA (Badge Verde)**
- **Método:** `generateFromMasterTemplateWithValidation(config)`
- **Template:** `automation/templates/master-template.html`
- **Color:** Verde `#10b981`
- **Incluye:** Calculadora hipotecaria + todas las features

### **RENTA (Badge Naranja)** ⭐ **[NUEVO - Oct 2025]**
- **Método:** `generateFromMasterTemplateRental(config)`
- **Template:** `automation/templates/master-template-rental.html`
- **Color:** Naranja `#ff6a00`
- **Diferencia:** Sin calculadora + badge "Amueblada/Sin amueblar"
- **Modern Features:** TODAS incluidas (sticky bar, animations, lightbox, share)

**Ver sección "Generador de Propiedades" más abajo para detalles completos.**

---

## 🎯 COMANDOS PRINCIPALES

### ⚡ SCRAPER AUTOMÁTICO - MÉTODO MÁS RÁPIDO (3 MINUTOS) ✨ **[RECOMENDADO]**
**Comando usuario:** Pasa la URL de propiedades.com
**Ejemplo:** "https://propiedades.com/inmuebles/casa-en-venta-culiacan-..."
**Script:** `node scraper-y-publicar.js "URL"`
**Tiempo:** ~3 minutos (¡TODO automatizado!)

**Proceso 100% automático:**
1. ✅ Scrapea datos de propiedades.com con Puppeteer
2. ✅ Descarga TODAS las fotos automáticamente
3. ✅ Genera HTML con Master Template corregido
4. ✅ Valida automáticamente (7 checks)
5. ✅ Corrige TODOS los metadatos (title, description, Schema.org, OG, hero)
6. ✅ Genera tarjeta para culiacan/index.html
7. ✅ Listo para "publica ya"

**⚠️ IMPORTANTE - El scraper NO se detiene después de scrapear:**
- El sistema continúa automáticamente hasta generar el HTML completo
- Solo se detiene cuando está 100% listo para revisar
- **Razón:** Ahorra tiempo y garantiza validación automática
- **Workflow:** URL → 3 min → Revisar → "publica ya"

**Documentación completa:** Ver `INSTRUCCIONES_SCRAPER.md`

### 🔥 SCRAPER INMUEBLES24 - MÉTODO MULTI-CIUDAD (2-3 MIN) ✨ **[TEMPLATE COMPLETO]**
**Comando usuario:** Pasa SOLO la URL de Inmuebles24
**Ejemplo:** "https://www.inmuebles24.com/propiedades/clasificado/..."
**Script:** `node inmuebles24-scraper-y-publicar.js "URL"`
**Archivo:** `inmuebles24-scraper-y-publicar.js` (100KB)
**Tiempo:** ~2-3 minutos (¡TODO 100% automatizado!)

**⚠️ TEMPLATE COMPLETO GUARDADO - Octubre 2025:**
Este scraper contiene el **TEMPLATE MASTER** con TODAS las features:
- ✅ **InfoWindow con carrusel completo** (función `showPropertyCard()` 170 líneas)
- ✅ **CURRENT_PROPERTY_DATA** con array de fotos dinámico
- ✅ **Botones "Ver Detalles" + "WhatsApp"** siempre visibles
- ✅ **Location subtitle limpio** ("Colonia, Ciudad")
- ✅ **Multi-ciudad** (Monterrey, Mazatlán, Culiacán)
- ✅ **Sistema inteligente de direcciones** (puntuación automática)
- ✅ **Auto-add al mapa modal** de la ciudad
- ✅ **Coordenadas por ciudad** (fallback correcto)

### 🔥 SCRAPER WIGGOT - MÉTODO ALTERNATIVO (2-3 MIN)
**Comando usuario:** Pasa SOLO la URL de Wiggot
**Ejemplo:** "https://new.wiggot.com/search/property-detail/pXXXXXX"
**Script:** `node wiggot-scraper-y-publicar.js "URL"`
**Tiempo:** ~2-3 minutos (¡TODO 100% automatizado!)

**⚠️ REGLA CRÍTICA - COMPORTAMIENTO AUTOMÁTICO:**
Cuando el usuario pega una URL de Wiggot (`https://new.wiggot.com/search/property-detail/...`):
1. **NO preguntar nada** - Ejecutar `wiggot-scraper-y-publicar.js` inmediatamente
2. **NO pedir confirmación** - El usuario ya decidió al pegar la URL
3. **Abrir localmente** - Después de publicar, abrir con `open "culiacan/[slug]/index.html"`

**Proceso 100% automático (TODO en un comando):**
1. ✅ Scrapea datos de Wiggot con Puppeteer (auto-login)
2. ✅ Descarga TODAS las fotos (16-37 fotos típicamente)
3. ✅ **m² con decimales** - Captura 328.14, 227.5 correctamente
4. ✅ **Ubicación limpia** - Elimina ". ," y basura automáticamente
5. ✅ **Mapa correcto** - Usa dirección real (no hardcodeada)
6. ✅ **Un solo mapa** - Sin duplicados
7. ✅ Genera HTML con Master Template Wiggot
8. ✅ Valida automáticamente
9. ✅ Genera tarjeta para culiacan/index.html
10. ✅ **Auto-publica a GitHub** - Commit + push automático
11. ✅ Listo en 2-3 minutos

**Correcciones aplicadas (Oct 2025):**
- ✅ Regex m²: `(\d+(?:\.\d+)?)` - Soporta decimales
- ✅ Normalización: `parseFloat()` en vez de `parseInt()`
- ✅ Ubicación: Limpia ". ," automáticamente
- ✅ Mapa: Reemplaza iframe hardcodeado con Google Maps Embed API dinámico
- ✅ Sin duplicados: Eliminado código que agregaba mapa extra

**Workflow típico:**
```
Usuario: https://new.wiggot.com/search/property-detail/pABC123
Claude:  [ejecuta wiggot-scraper-y-publicar.js → publica → abre localmente]
         ✅ Publicado en https://casasenventa.info/culiacan/[slug]/
```

**Documentación completa:** Ver commits b7e3b90, aec91ef, 6db6fbe

### 🏢 SCRAPER INMUEBLES24 - MULTI-CIUDAD (2-3 MIN) ✨ **[CONFIRMACIÓN MANUAL]**
**Comando usuario:** Pasa SOLO la URL de Inmuebles24
**Ejemplo:** "https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-..."
**Script:** `node inmuebles24-scraper-y-publicar.js "URL"`
**Tiempo:** ~2-3 minutos

**⚠️ FLUJO CRÍTICO - CONFIRMACIÓN DE CIUDAD:**
1. **Usuario pega URL** de Inmuebles24
2. **Scraper detecta ciudad** automáticamente desde URL
3. **PAUSA para confirmar** - Muestra menú interactivo:
   ```
   ╔═══════════════════════════════════════════════╗
   ║  🌆 CONFIRMACIÓN DE CIUDAD (IMPORTANTE)      ║
   ╚═══════════════════════════════════════════════╝

   📍 Ciudad detectada automáticamente: Monterrey, Nuevo León

   ¿Es correcta esta ciudad?

     1️⃣  Culiacán, Sinaloa
     2️⃣  Monterrey, Nuevo León
     3️⃣  Mazatlán, Sinaloa

   👉 Selecciona el número (1/2/3) o presiona Enter para confirmar:
   ```
4. **Usuario confirma o corrige** la ciudad
5. **Continúa automáticamente** - Scrapea, genera HTML, publica

**¿Por qué confirmación manual?**
- ✅ Evita errores de metadata incorrecta en Inmuebles24
- ✅ 100% de precisión en ubicación
- ✅ Solo 5 segundos extra por propiedad
- ✅ Previene publicar en carpeta incorrecta

**Proceso automático después de confirmar:**
1. ✅ Scrapea datos de Inmuebles24 con Puppeteer
2. ✅ **Sistema inteligente de dirección** - Detecta automáticamente la dirección MÁS COMPLETA
3. ✅ Descarga TODAS las fotos automáticamente
4. ✅ Genera HTML con Master Template (ciudad correcta)
5. ✅ Agrega tarjeta a [ciudad]/index.html
6. ✅ **Auto-publica a GitHub** - Commit + push automático
7. ✅ **Actualiza CRM** - Registra vendedor y propiedad
8. ✅ Listo en 2-3 minutos

**🧠 Sistema Inteligente de Detección de Dirección (Commit f8e91b9):**
El scraper analiza TODA la página y selecciona automáticamente la dirección más completa usando un sistema de puntuación:

- **+5 pts**: Tiene número de calle (ej: "2609", "#123")
- **+4 pts**: Tiene nombre de calle (Blvd, Av, Calle, Privada)
- **+3 pts**: Tiene colonia/fraccionamiento específico
- **+2 pts**: Múltiples componentes (por cada coma)
- **+1 pt**: Incluye municipio/ciudad
- **+1 pt**: Incluye estado
- **-3 pts**: Dirección muy corta (<30 chars)
- **-5 pts**: Solo "Ciudad, Estado" (incompleto)

**Ejemplo de output:**
```
📍 Direcciones detectadas (ordenadas por completitud):
1. [15 pts] Blvd Elbert 2609, Fracc. Las Quintas, Culiacán, Sinaloa
2. [8 pts] Fracc. Las Quintas, Culiacán, Sinaloa
3. [2 pts] Culiacán, Sinaloa
✅ Dirección seleccionada: Blvd Elbert 2609, Fracc. Las Quintas, Culiacán, Sinaloa
```

**Fuentes analizadas:**
- Body text completo (líneas con patrón de dirección)
- Breadcrumbs y elementos de navegación
- Meta tags (og:street-address, name="address")

**Ventajas:**
- ✅ Siempre selecciona la dirección con más información
- ✅ Evita direcciones genéricas tipo "Culiacán, Sinaloa"
- ✅ Transparente: muestra top 5 candidatas con puntuación
- ✅ Elimina duplicados entre diferentes fuentes

**🏷️ Location Subtitle Limpio (Commit c2b9eb7):**
El scraper genera location subtitle en formato corto, igual que Culiacán:

- **Formato:** `"Colonia/Fraccionamiento, Ciudad"`
- **Ejemplo Culiacán:** "Barrio San Francisco, Culiacán"
- **Ejemplo Monterrey:** "Cima de Las Cumbres, Monterrey"
- **Antes (incorrecto):** "Casa en Venta en Cumbres Monterrey, Cima de Las Cumbres, Cima de las Cumbres, Monterrey"
- **Ahora (correcto):** "Cima de Las Cumbres, Monterrey"

**Implementación:**
```javascript
// Extraer solo primera parte de ubicación (antes de coma)
const locationShortForSubtitle = data.location.split(',')[0].trim();
html = html.replace(/<p class="location-subtitle">.*?<\/p>/g,
    `<p class="location-subtitle">${locationShortForSubtitle}, ${cityConfig.name}</p>`);
```

**🎨 InfoWindow con Carrusel Completo de Fotos (Commit 7ae564e):**
El scraper genera InfoWindow estilo Zillow con TODAS las fotos de la propiedad:

**Características:**
- ✅ **Carrusel completo** - Todas las fotos (no solo 1)
- ✅ **Flechas de navegación** - Botones circulares ← →
- ✅ **Contador de fotos** - "1 / 24" en esquina superior
- ✅ **Dots indicadores** - Barra de puntos interactivos
- ✅ **Fade effect** - Transición suave al cambiar foto
- ✅ **Soporte teclado** - Flechas ← → para navegar
- ✅ **Datos completos** - Precio, recámaras, baños, m²
- ✅ **Botón WhatsApp** - Link directo con mensaje pre-llenado
- ✅ **Botón Ver Detalles** - Para otras propiedades (verde)

**Diferencia visual:**
- **Antes:** 1 foto estática, sin navegación
- **Ahora:** Carrusel con 24+ fotos, navegable con flechas/dots/teclado

**Implementación:**
```javascript
// Nueva función showPropertyCard() en generateMapWithCustomMarker
function showPropertyCard(property, position, map, isCurrent = false) {
    // Genera InfoWindow con:
    // - Carrusel de fotos: height 200px
    // - Flechas: rgba(0,0,0,0.6) con hover effect
    // - Contador: top-right corner
    // - Dots: bottom center, animados
    // - Info: precio, datos, botones WhatsApp/Ver Detalles
}

// Objeto CURRENT_PROPERTY_DATA con array completo de fotos
const CURRENT_PROPERTY_DATA = {
    priceShort: "$4M",
    priceFull: "$4,000,000",
    photos: ['images/foto-1.jpg', 'images/foto-2.jpg', ...] // TODAS las fotos
};
```

**Aplicado automáticamente en:**
- ✅ Todas las nuevas propiedades scrapeadas
- ✅ Todas las ciudades (Monterrey, Mazatlán, Culiacán)
- ✅ Compatible con propiedades existentes (requiere re-scrapear)

**Propiedades actualizadas:**
- ✅ **Casa Monterrey Cumbres** - Actualizada manualmente con carrusel completo (Commit ffe8fe7)
- ✅ **Propiedades nuevas** - Carrusel automático desde commit 7ae564e
- 🔄 **Otras propiedades antiguas** - Requieren re-scrapear o actualizar manualmente

**Botones en InfoWindow (Commit ffe8fe7):**
- ✅ **"Ver Detalles"** - Botón naranja (#FF6A00) lado izquierdo
- ✅ **"WhatsApp"** - Botón verde (#25D366) lado derecho
- ✅ Layout flex 1:1 (ambos botones mismo tamaño)
- ✅ Siempre visibles (sin condición `!isCurrent`)
- ✅ Propiedad `url: "#"` en CURRENT_PROPERTY_DATA

**Ciudades soportadas:**
- `monterrey` → Monterrey, Nuevo León → `monterrey/`
- `mazatlan` → Mazatlán, Sinaloa → `mazatlan/`
- `culiacan` → Culiacán, Sinaloa → `culiacan/` (default)

**Detección automática desde URL:**
- `monterrey` en URL → detecta Monterrey
- `mazatlan` en URL → detecta Mazatlán
- Otros casos → detecta Culiacán (default)

**Workflow típico:**
```
Usuario: https://www.inmuebles24.com/.../monterrey-...
Claude:  [ejecuta inmuebles24-scraper-y-publicar.js]
Scraper: 📍 Ciudad detectada: Monterrey, Nuevo León
Usuario: [Presiona Enter para confirmar]
Scraper: ✅ Scrapeando... → Publicando... → ✅ Listo
```

**Documentación completa:** Ver `inmuebles24-scraper-y-publicar.js`

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

### 🛡️ Generador de Propiedades - **MÉTODOS CORRECTOS POR TIPO** ✅
- **Ubicación:** `automation/generador-de-propiedades.js`

#### 📋 **REGLA DE ORO: Método según tipo de propiedad**

**PARA VENTA:**
- **Método:** `generateFromMasterTemplateWithValidation(config)` ⭐
- **Template:** `automation/templates/master-template.html`
- **Validación:** 7 verificaciones automáticas
- **Estructura:** Hero + Contact + todas las modern features

**PARA RENTA:**
- **Método:** `generateFromMasterTemplateRental(config)` ⭐ **[NUEVO - Octubre 2025]**
- **Template:** `automation/templates/master-template-rental.html`
- **Estructura:** Hero + Features + Details + Contact (sin calculadora)
- **Badge:** Naranja `#ff6a00` (vs Verde `#10b981` para venta)
- **Precio:** `$XX,XXX/mes` (incluye "/mes")
- **Modern Features:** TODAS incluidas (sticky bar, animations, lightbox, share)
- **Schema.org:** Tipo `Accommodation` con `unitText: "MONTH"`
- **Inspirado en:** `inmuebles24culiacanscraper.js` (template más robusto del proyecto)

#### 🟠 **DIFERENCIAS VENTA vs RENTA:**

| Característica | VENTA (Verde) | RENTA (Naranja) |
|---------------|--------------|----------------|
| **Badge color** | `#10b981` (verde) | `#ff6a00` (naranja) |
| **Precio label** | "En Venta" | "Renta Mensual" |
| **Precio format** | `$X,XXX,XXX` | `$XX,XXX/mes` |
| **Price detail** | "Se acepta contado y créditos" | "Depósito y primer mes" |
| **Schema @type** | `SingleFamilyResidence` | `Accommodation` |
| **Calculadora** | ✅ Incluida | ❌ Eliminada |
| **Badge extra** | N/A | ✅ `{{FURNISHED_STATUS}}` |
| **Modern features** | ✅ Todas | ✅ Todas (sin calc) |

#### 📦 **PLACEHOLDERS MASTER TEMPLATE RENTAL:**

**Información Básica:**
- `{{TITLE}}` - Casa en Renta Privanzas Natura
- `{{PRICE}}` - $25,000
- `{{PRICE_NUMBER}}` - 25000 (sin formato)
- `{{SLUG}}` - privanzas-natura-renta

**Ubicación:**
- `{{LOCATION}}` - Privanzas Natura, Culiacán, Sinaloa
- `{{LOCATION_SHORT}}` - Privanzas Natura
- `{{FULL_ADDRESS}}` - Calle Ébano 123, Privanzas Natura, 80000 Culiacán
- `{{STREET_ADDRESS}}` - Calle Ébano 123
- `{{ADDRESS_LOCALITY}}` - Privanzas Natura
- `{{POSTAL_CODE}}` - 80000
- `{{LATITUDE}}` - 24.8091
- `{{LONGITUDE}}` - -107.3940

**Características:**
- `{{BEDROOMS}}` - 3
- `{{BATHROOMS}}` - 2
- `{{PARKING_SPACES}}` - 2
- `{{CONSTRUCTION_AREA}}` - 180
- `{{LAND_AREA}}` - 200
- `{{FLOORS}}` - 2
- `{{TOTAL_ROOMS}}` - 5
- `{{FURNISHED_STATUS}}` - Amueblada / Semi-amueblada / Sin amueblar

**Fotos:**
- `{{PHOTO_COUNT}}` - 12
- `{{CAROUSEL_SLIDES}}` - HTML generado automático
- `{{CAROUSEL_DOTS}}` - HTML generado automático
- `{{LIGHTBOX_IMAGES_ARRAY}}` - Array JS generado

**SEO:**
- `{{META_DESCRIPTION}}` - Meta description
- `{{OG_DESCRIPTION}}` - Open Graph description
- `{{SCHEMA_DESCRIPTION}}` - Schema.org description
- `{{HERO_SUBTITLE}}` - Subtítulo del hero
- `{{AMENITIES_JSON}}` - JSON array amenidades
- `{{WHATSAPP_MESSAGE_ENCODED}}` - Mensaje WhatsApp URL-encoded

#### 🚀 **USO MASTER TEMPLATE RENTAL:**

```javascript
const PropertyPageGenerator = require('./automation/generador-de-propiedades');
const generator = new PropertyPageGenerator(false);

const html = generator.generateFromMasterTemplateRental({
    // Básico
    title: 'Casa en Renta Privanzas Natura',
    price: '$25,000',
    priceNumber: 25000,
    slug: 'privanzas-natura-renta',

    // Ubicación
    location: 'Privanzas Natura, Culiacán, Sinaloa',
    locationShort: 'Privanzas Natura',

    // Características
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 2,
    constructionArea: 180,
    landArea: 200,
    furnishedStatus: 'Amueblada',

    // Fotos
    photoCount: 12,

    // SEO
    metaDescription: 'Casa amueblada en renta en Privanzas Natura, Culiacán.',
    heroSubtitle: 'Casa amueblada en excelente estado...',

    // Amenidades
    amenitiesJson: [
        { "@type": "LocationFeatureSpecification", "name": "Amueblada", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Jardín", "value": true }
    ]
});

fs.writeFileSync('casa-renta-privanzas-natura.html', html, 'utf8');
```

#### 📂 **ESTRUCTURA ARCHIVOS RENTA (ROOT):**
```
/
├── casa-renta-privanzas-natura.html  ← HTML principal
├── images/
│   └── privanzas-natura-renta/
│       ├── foto-1.jpg                ← FACHADA (primera)
│       └── ...
└── styles.css                        ← CSS 87KB (actualizado)
```

#### 🎨 **TARJETA EN INDEX.HTML (BADGE NARANJA):**
```html
<div class="property-card">
    <!-- Badge NARANJA -->
    <div class="absolute top-3 right-3 bg-orange-500 ...">
        $25,000/mes
    </div>

    <!-- CTA NARANJA -->
    <a href="../casa-renta-privanzas-natura.html"
       class="from-orange-500 to-orange-600 ...">
        Ver Detalles
    </a>
</div>
```

#### ⚠️ **MÉTODOS OBSOLETOS - NO USAR:**
- ❌ `generateFromSolidaridadTemplate()` - Template antiguo sin modern features
- ❌ `generateIndividualPage()` - Genera estructura incorrecta (5 secciones)
- ❌ `rental-template-perfect.html` - Template con secciones extra
- ❌ `replaceTemplatePlaceholders()` directo - Requiere trabajo manual

#### 📖 **DOCUMENTACIÓN COMPLETA RENTA:**
- **Template:** `automation/templates/master-template-rental.html`
- **README:** `automation/MASTER-TEMPLATE-RENTAL-README.md` (400+ líneas)
- **Inspiración:** `inmuebles24culiacanscraper.js` (líneas 326-704)

### ⚠️ **REQUISITO CRÍTICO: CSS ACTUALIZADO EN ROOT**
- **Archivo:** `styles.css` (87KB - versión completa con carrusel)
- **Origen:** Debe copiarse desde `culiacan/infonavit-solidaridad/styles.css`
- **Comando:** `cp culiacan/infonavit-solidaridad/styles.css styles.css`
- **¿Por qué?** El CSS en ROOT contiene todos los estilos del carrusel, lightbox, y modern features
- **❌ PROBLEMA:** Si usas el CSS viejo (20KB), las fotos se ven gigantes y el carrusel NO funciona
- **✅ SOLUCIÓN:** Siempre mantener el CSS actualizado desde Casa Solidaridad
- **🤖 AUTOMÁTICO:** Genera carrusel, dots, lightbox dinámicamente según photoCount
- **🔧 INTEGRACIÓN:** Sistema que preserva todas las propiedades existentes
- **✅ TODOS LOS SCRIPTS ACTUALIZADOS:** add-property.js, scraper-y-publicar.js, scraper-propiedad-especifica.js, etc.

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

#### 🆕 MASTER TEMPLATE SYSTEM (2025) - ⭐ RECOMENDADO
**USO:** Método principal para generar TODAS las nuevas propiedades

**Función:** `generateFromMasterTemplate(config)`

**Ventajas:**
- ✅ **Estructura 100% fija** - Basada en `master-template.html` con placeholders
- ✅ **Mantenible** - Solo actualizar master template para cambiar todas las futuras propiedades
- ✅ **Sin errores** - Sistema de reemplazo limpio de placeholders `{{VARIABLE}}`
- ✅ **Completo** - Incluye todas las modern features automáticamente
- ✅ **Extensible** - Fácil agregar nuevos placeholders

**Proceso:**
1. Lee `automation/templates/master-template.html`
2. Reemplaza todos los placeholders `{{VARIABLE}}` con datos del config
3. Genera dinámicamente: carousel slides, dots, lightbox array
4. Retorna HTML completo listo para usar

**Qué incluye automáticamente:**
- ✅ Sticky Price Bar con WhatsApp
- ✅ Scroll Animations (fade-in)
- ✅ Haptic Feedback (vibración móvil)
- ✅ Calculadora Zillow reducida 70%
- ✅ Hero compacto (50% más pequeño)
- ✅ Features compactas (iconos 15% más grandes)
- ✅ Lightbox gallery expandible
- ✅ Share buttons (WhatsApp, Facebook, Email, Copy)
- ✅ SEO completo (meta tags, Schema.org, Open Graph)

**Config mínima requerida:**
```javascript
{
    key: 'casa-venta-nombre-slug',
    title: 'Casa Nombre Completo',
    price: '$X,XXX,XXX',
    location: 'Fracc. Mi Fracc, Culiacán',
    bedrooms: 3,
    bathrooms: 2,
    construction_area: 200,
    land_area: 250,
    photoCount: 8,  // Número de fotos disponibles

    // Opcionales (con valores default)
    parking: 2,
    floors: 2,
    yearBuilt: 2024,
    postalCode: '80000',
    latitude: 24.8091,
    longitude: -107.3940
}
```

**Llamada:**
```javascript
const PropertyPageGenerator = require('./automation/generador-de-propiedades');
const generator = new PropertyPageGenerator(false); // false = venta
const html = generator.generateFromMasterTemplate(config);
fs.writeFileSync('culiacan/mi-propiedad/index.html', html);
```

#### 🔧 **CORRECCIONES APLICADAS AL MASTER TEMPLATE (OCT 2025)**

**Problemas resueltos:**

1. **❌ Flechas del carrusel faltantes**
   - **Solución:** Agregadas dentro del `<div class="carousel-wrapper">` después del placeholder `{{CAROUSEL_SLIDES}}`
   - **Código:**
     ```html
     <!-- Navigation arrows -->
     <button class="carousel-arrow carousel-prev" onclick="changeSlideHero(-1); openLightboxFromCarousel();">
         <i class="fas fa-chevron-left"></i>
     </button>
     <button class="carousel-arrow carousel-next" onclick="changeSlideHero(1); openLightboxFromCarousel();">
         <i class="fas fa-chevron-right"></i>
     </button>
     ```

2. **❌ Lightbox array con 14 imágenes hardcodeadas**
   - **Solución:** Reemplazado con placeholder `{{LIGHTBOX_IMAGES_ARRAY}}`
   - **Antes:** 14 entradas hardcodeadas de Casa Solidaridad
   - **Ahora:** Array dinámico generado según `photoCount`

3. **❌ Textos hardcodeados de "Infonavit Solidaridad"**
   - **Solución:** 15+ replacements en `generador-de-propiedades.js`:
     - "Infonavit Solidaridad" → `config.location.split(',')[0]`
     - "Casa Remodelada en Infonavit Solidaridad" → `config.title`
     - "Blvrd Elbert 2609" → `config.location`
     - "$1,750,000" → `config.price`
     - "91.6m²" → `config.construction_area`
     - "112.5m²" → `config.land_area`
     - "780 mt² de construcción" → `${config.construction_area}m²`
     - Meta description, keywords, Schema.org, WhatsApp links, etc.

4. **❌ CSS desactualizado en ROOT**
   - **Problema:** `styles.css` en ROOT era versión vieja (20KB) sin estilos de carrusel
   - **Solución:** `cp culiacan/infonavit-solidaridad/styles.css styles.css`
   - **Resultado:** CSS actualizado (87KB) con todos los estilos del carrusel, lightbox, modern features

**Archivos actualizados:**
- ✅ `automation/templates/master-template.html` - Flechas agregadas, lightbox placeholder corregido
- ✅ `automation/generador-de-propiedades.js` - 15+ replacements para textos hardcodeados
- ✅ `styles.css` - CSS completo copiado desde Casa Solidaridad

**Validación:**
- ✅ Carrusel funcionando con flechas ← →
- ✅ Lightbox dinámico según photoCount
- ✅ Todos los textos personalizados por propiedad
- ✅ CSS completo en ROOT (87KB)

**Documentación completa:** Ver `MASTER-TEMPLATE-README.md`

**VENTAJA:** Sistema moderno, limpio y mantenible para generar propiedades consistentes

---

#### 🔧 MÉTODO LEGACY: generateFromSolidaridadTemplate() - ⚠️ DEPRECATED
**Status:** Mantener solo para compatibilidad con propiedades antiguas
**Recomendación:** Usar `generateFromMasterTemplate()` para TODAS las nuevas propiedades
**Razón:** Sistema de buscar/reemplazar frágil vs placeholders limpios

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

---

## 📦 TEMPLATE MASTER COMPLETO - INMUEBLES24 SCRAPER

### 🎯 Archivo Principal
**Nombre:** `inmuebles24-scraper-y-publicar.js`
**Tamaño:** 100KB (2,800+ líneas)
**Última actualización:** Octubre 2025
**Commits:** 7ae564e, ffe8fe7, 6308642

### ✨ Componentes del Template (TODOS guardados)

#### 1️⃣ **InfoWindow con Carrusel Completo**
**Función:** `showPropertyCard(property, position, map, isCurrent)`
**Líneas:** 402-556 (170 líneas de código)
**Incluye:**
- ✅ Carrusel de TODAS las fotos (dinámico según photoCount)
- ✅ Flechas de navegación ← → (circulares, hover effect)
- ✅ Contador "1 / N" (esquina superior derecha)
- ✅ Dots indicadores animados (expansión activa)
- ✅ Fade effect al cambiar foto (150ms opacity transition)
- ✅ Event listeners: flechas, dots, teclado (ArrowLeft/Right)
- ✅ Botón "Ver Detalles" (naranja #FF6A00)
- ✅ Botón "WhatsApp" (verde #25D366)
- ✅ Layout responsive 320px max-width
- ✅ Font Poppins integrado

#### 2️⃣ **CURRENT_PROPERTY_DATA**
**Objeto:** Datos completos de la propiedad actual
**Líneas:** 362-373
**Propiedades:**
```javascript
{
    priceShort: "$4M",              // Formato corto (generado automático)
    priceFull: "$4,000,000",        // Formato completo
    title: "Casa en Venta...",      // Título completo
    location: "Colonia, Ciudad",    // Ubicación formateada
    bedrooms: 3,                    // Recámaras (número)
    bathrooms: 2,                   // Baños (número)
    area: "180m²",                  // Área construcción formateada
    whatsapp: "528111652545",       // WhatsApp según ciudad
    url: "#",                       // URL página detalles
    photos: ['images/foto-1.jpg', ...] // Array dinámico completo
}
```

#### 3️⃣ **Location Subtitle Limpio**
**Función:** Extracción de ubicación corta
**Líneas:** 1716-1718
**Lógica:**
```javascript
const locationShortForSubtitle = data.location.split(',')[0].trim();
// Resultado: "Cima de Las Cumbres, Monterrey"
// No: "Casa en Venta en Cumbres Monterrey, Cima de Las Cumbres..."
```

#### 4️⃣ **Sistema Inteligente de Direcciones**
**Función:** `scoreAddress(address)` + detección multi-fuente
**Líneas:** 978-1113
**Puntuación:**
- +5 pts: Número de calle
- +4 pts: Nombre de calle (Blvd, Av, Calle)
- +3 pts: Colonia/fraccionamiento
- +2 pts: Múltiples componentes (por coma)
- +1 pt: Municipio/ciudad
- +1 pt: Estado
- -3 pts: Dirección muy corta
- -5 pts: Solo "Ciudad, Estado"

#### 5️⃣ **Multi-Ciudad con Coordenadas**
**Config:** `cityConfig` object
**Líneas:** 173-210
**Ciudades:**
```javascript
monterrey: {
    coords: { lat: 25.6866, lng: -100.3161, name: 'Monterrey' },
    whatsapp: '528111652545',
    folder: 'monterrey',
    name: 'Monterrey'
}
// + mazatlan, culiacan
```

#### 6️⃣ **Auto-Add al Mapa Modal**
**Función:** `addPropertyToMap(data, slug, photoCount, cityConfig)`
**Líneas:** 1851-1951
**Genera:**
- Definición completa de la propiedad
- Array de TODAS las fotos
- Código geocoder
- Inserta en [ciudad]/index.html antes de markers existentes

#### 7️⃣ **Generación Dinámica de Mapa**
**Función:** `generateMapWithCustomMarker(config)`
**Líneas:** 326-696
**Parámetros:**
```javascript
{
    location, price, title,
    photoCount, bedrooms, bathrooms, area, whatsapp,
    propertyIndex, cityCoords
}
```
**Genera:**
- MARKER_CONFIG
- CURRENT_PROPERTY_DATA con fotos
- función showPropertyCard()
- función createPropertyMarker()
- función initMap()

### 🔄 Workflow Automático del Template

**Input:** URL de Inmuebles24
```bash
node inmuebles24-scraper-y-publicar.js "https://www.inmuebles24.com/..."
```

**Proceso:**
1. ✅ Detecta ciudad desde URL (monterrey/mazatlan/culiacan)
2. ✅ Pide confirmación manual (5 seg)
3. ✅ Scrapea datos con Puppeteer
4. ✅ **Sistema inteligente** selecciona mejor dirección
5. ✅ Descarga TODAS las fotos
6. ✅ Genera HTML con template completo:
   - InfoWindow con carrusel (todas las fotos)
   - CURRENT_PROPERTY_DATA (datos completos)
   - Location subtitle limpio
   - Botones "Ver Detalles" + "WhatsApp"
   - Coordenadas correctas por ciudad
7. ✅ Agrega tarjeta a [ciudad]/index.html
8. ✅ **Auto-add al mapa modal** de la ciudad
9. ✅ Commit + push automático
10. ✅ Abre página localmente

**Output:** Propiedad completa lista para producción

### 📊 Features Garantizadas

Cada nueva propiedad scrapeada tendrá **AUTOMÁTICAMENTE**:

✅ **Carrusel completo** - TODAS las fotos descargadas
✅ **InfoWindow interactivo** - Flechas, dots, teclado, fade
✅ **Botones funcionales** - Ver Detalles (naranja) + WhatsApp (verde)
✅ **Ubicación limpia** - "Colonia, Ciudad" (sin texto extra)
✅ **Dirección inteligente** - Selección automática más completa
✅ **Mapa correcto** - Coordenadas según ciudad
✅ **Mapa modal actualizado** - Auto-add en [ciudad]/index.html
✅ **SEO completo** - Meta tags, Schema.org, Open Graph
✅ **Multi-ciudad** - Monterrey, Mazatlán, Culiacán

### 🎨 Compatibilidad Visual

El template genera propiedades **idénticas** a:
- ✅ Casa en Venta en Cumbres Monterrey (referencia)
- ✅ Casa en Venta Barrio San Francisco (Culiacán)
- ✅ Mapa modal de monterrey/index.html
- ✅ Mapa modal de culiacan/index.html

### 🚀 Uso del Template

**Para nuevas propiedades:**
```bash
# Solo pega la URL cuando el usuario la envíe
node inmuebles24-scraper-y-publicar.js "URL_INMUEBLES24"

# El template se encarga del resto automáticamente
```

**Para actualizar propiedades existentes:**
- Método 1: Re-scrapear con el script
- Método 2: Actualizar manualmente copiando secciones del template

### 📝 Notas Importantes

⚠️ **El template está COMPLETO** - No falta nada
⚠️ **Todas las features están guardadas** - Commits 7ae564e, ffe8fe7, 6308642
⚠️ **Funciona para TODAS las ciudades** - Multi-ciudad integrado
⚠️ **100% automático** - Solo requiere URL de Inmuebles24
⚠️ **Mantenible** - Un solo archivo contiene todo el template

---
