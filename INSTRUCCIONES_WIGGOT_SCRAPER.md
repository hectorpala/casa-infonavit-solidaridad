# 📚 INSTRUCCIONES: WIGGOT SCRAPER Y PUBLICADOR

## 🎯 SISTEMA AUTOMATIZADO PARA AGREGAR PROPIEDADES DESDE WIGGOT

---

## 📁 ARCHIVOS PRINCIPALES

### 1. **Script Automatizado**
```
wiggot-scraper-y-publicar.js
```
**Descripción:** Script todo-en-uno que scrapea, descarga fotos, genera página y agrega tarjeta.

### 2. **Template HTML Maestro**
```
automation/templates/master-template-wiggot.html
```
**Descripción:** Template HTML completo con TODO funcionando perfectamente (carrusel 16+ fotos, lightbox, calculadora, mapa).

### 3. **Documentación Template**
```
automation/templates/MASTER-TEMPLATE-WIGGOT-README.md
```
**Descripción:** Documentación completa del template maestro.

---

## 🚀 USO RÁPIDO (3 MINUTOS)

### **Comando único:**
```bash
node wiggot-scraper-y-publicar.js "URL_DE_WIGGOT"
```

### **Ejemplo:**
```bash
node wiggot-scraper-y-publicar.js "https://new.wiggot.com/search/property-detail/pvGkgpH"
```

### **Resultado automático:**
- ✅ Scrapea datos (título, precio, fotos, descripción)
- ✅ Descarga TODAS las fotos
- ✅ Genera página HTML completa
- ✅ Agrega tarjeta a culiacan/index.html
- ✅ **Listo para "publica ya"**

---

## 📋 PROCESO DETALLADO (5 PASOS AUTOMÁTICOS)

### **PASO 1: Scraping de Datos** 📥
- Login automático a Wiggot (cookies guardadas)
- Extrae: título, precio, ubicación, recámaras, baños, m²
- Abre galería de fotos ("Ver todas las fotos")
- Detecta TODAS las imágenes (img tags + backgrounds + srcsets)

### **PASO 2: Estructura de Carpetas** 📁
Crea automáticamente:
```
culiacan/casa-venta-[SLUG]/
├── index.html
├── styles.css
└── images/
    ├── foto-1.jpg
    ├── foto-2.jpg
    ├── ...
    ├── foto-N.jpg
    ├── webp/
    │   └── Logo-hector-es-bienes-raices.webp
    └── optimized/
        └── Logo-hector-es-bienes-raices.jpg
```

### **PASO 3: Descarga de Fotos** 📸
- Descarga todas las fotos de Wiggot
- Renombra: `foto-1.jpg`, `foto-2.jpg`, etc.
- **⚠️ IMPORTANTE:** Verificar que foto-1 sea la fachada

### **PASO 4: Generación de Página HTML** 📄
Usa `master-template-wiggot.html` como base:
- Reemplaza datos (título, precio, descripción)
- Agrega TODAS las fotos al carrusel
- Actualiza JavaScript (`totalSlidesHero = N`)
- Actualiza lightbox array con todas las fotos
- Actualiza Schema.org con URLs de fotos
- Copia `styles.css` desde template
- Copia logos (webp + jpg)

### **PASO 5: Tarjeta en culiacan/index.html** 🎴
Genera e inserta automáticamente:
```html
<!-- BEGIN CARD-ADV [slug] -->
<div class="property-card">
    <!-- Badge verde con precio -->
    <!-- Carrusel 3 fotos -->
    <!-- Info (recámaras, baños, m²) -->
    <!-- Botón "Ver Detalles" verde -->
</div>
<!-- END CARD-ADV [slug] -->
```

---

## ✨ CARACTERÍSTICAS DEL TEMPLATE GENERADO

### **Carrusel de Fotos**
- ✅ Soporte para 16+ fotos
- ✅ Flechas naranjas (#ff4e00) visibles
- ✅ Navegación con flechas ← →
- ✅ Dots de navegación (1 por foto)
- ✅ Transiciones suaves (opacity fade)
- ✅ Touch/swipe en móvil
- ✅ CSS inline con `!important` para evitar conflictos

### **Lightbox**
- ✅ Se abre al clickear foto o flecha
- ✅ Muestra todas las fotos correctamente
- ✅ Navegación dentro del lightbox
- ✅ Contador "Foto X de Y"
- ✅ Cierre con X o tecla ESC
- ✅ JavaScript corregido (usa strings directos, no `.src`)

### **Descripción**
- ✅ Título completo
- ✅ Descripción detallada de Wiggot
- ✅ Formato limpio y legible

### **Calculadora de Hipoteca**
- ✅ Título con clase `section-title` (gradiente negro-naranja)
- ✅ Línea decorativa debajo
- ✅ Calculadora Zillow style
- ✅ Precio pre-cargado

### **Mapa de Ubicación**
- ✅ Google Maps interactivo
- ✅ Marcador en ubicación
- ✅ Solo visible en desktop (>768px)
- ✅ Oculto en móvil

### **SEO Completo**
- ✅ Meta tags (title, description, keywords)
- ✅ Open Graph
- ✅ Schema.org structured data
- ✅ Canonical URL
- ✅ Favicon y PWA

---

## 🔐 CREDENCIALES WIGGOT

**Email:** `hector.test.1759769906975@gmail.com`
**Password:** `Wiggot2025!drm36`
**Usuario:** Carlos Cazarez

**Cookies:** Se guardan en `wiggot-cookies.json` para evitar login repetido.

---

## 📝 SALIDA ESPERADA DEL SCRIPT

```
🚀 INICIANDO SCRAPER Y PUBLICADOR AUTOMÁTICO
📍 URL: https://new.wiggot.com/search/property-detail/pvGkgpH

📥 PASO 1/5: Scrapeando datos de Wiggot...
✅ Datos scrapeados: Casa en venta en Portalegre
   💰 Precio: 1,750,000
   📸 Fotos encontradas: 16

📁 PASO 2/5: Creando estructura de carpetas...
✅ Carpeta creada: culiacan/casa-venta-portalegre-045360

📸 PASO 3/5: Descargando fotos...
   ✅ Descargada: foto-1.jpg
   ✅ Descargada: foto-2.jpg
   ...
✅ Fotos descargadas: 16

📄 PASO 4/5: Generando página HTML...
✅ Página HTML generada: culiacan/casa-venta-portalegre-045360/index.html

🎴 PASO 5/5: Agregando tarjeta a culiacan/index.html...
✅ Tarjeta agregada a culiacan/index.html

🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!

📋 RESUMEN:
   🏠 Propiedad: Casa en venta en Portalegre
   💰 Precio: 1,750,000
   📍 Ubicación: Avenida De Los Poetas 1435, Portalegre
   📁 Carpeta: culiacan/casa-venta-portalegre-045360
   📸 Fotos: 16

🚀 SIGUIENTE PASO: Ejecuta "publica ya" para deployment
```

---

## ✅ CHECKLIST POST-GENERACIÓN

Después de ejecutar el script, verificar:

- [ ] **Abrir página generada:** `open culiacan/casa-venta-[SLUG]/index.html`
- [ ] **Carrusel funciona:** Flechas naranjas visibles y clickeables
- [ ] **Todas las fotos:** Se ven al navegar con flechas (no solo la primera)
- [ ] **Lightbox funciona:** Se abre y muestra fotos (no negro)
- [ ] **Foto-1 es fachada:** Si no, reorganizar fotos manualmente
- [ ] **Descripción completa:** Visible en hero section
- [ ] **Calculadora:** Título grande con gradiente
- [ ] **Mapa:** Visible en desktop
- [ ] **Tarjeta en culiacan/index.html:** Badge verde, precio correcto

---

## 🔧 TROUBLESHOOTING

### **Problema: Lightbox muestra negro**
**Solución:** El template ya tiene el fix. Usa strings directos en lightbox:
```javascript
lightboxImg.src = lightboxImages[index]; // ✅ Correcto
// NO: lightboxImages[index].src ❌
```

### **Problema: Carrusel no cambia fotos**
**Solución:** El template tiene CSS inline con `!important`. Verificar que exista:
```css
.hero-image .carousel-slide {
    opacity: 0 !important;
}
.hero-image .carousel-slide.active {
    opacity: 1 !important;
}
```

### **Problema: Flechas no visibles**
**Solución:** CSS inline con fondo naranja:
```css
.hero-image .carousel-arrow {
    background: rgba(255, 78, 0, 0.9) !important;
    z-index: 100 !important;
}
```

### **Problema: Solo 5 fotos en vez de 16**
**Verificar:**
1. `totalSlidesHero = 16` (no 5)
2. HTML tiene slides 0-15 (no solo 0-4)
3. Lightbox array tiene 16 elementos
4. Schema.org tiene 16 URLs

---

## 🚀 DEPLOYMENT

Después de verificar que todo funciona:

```bash
# Opción 1: Merge directo
publica ya

# Opción 2: Pull Request
PR AUTO

# Opción 3: Verificar status
STATUS
```

El comando invocará `gitops-publicador` para deployment a GitHub Pages.

---

## 📚 ARCHIVOS DE REFERENCIA

- **Script principal:** `wiggot-scraper-y-publicar.js`
- **Template maestro:** `automation/templates/master-template-wiggot.html`
- **Documentación template:** `automation/templates/MASTER-TEMPLATE-WIGGOT-README.md`
- **Ejemplo funcionando:** `culiacan/casa-venta-portalegre-045360/index.html`

---

## 🎯 RESUMEN EJECUTIVO

**1 comando = Propiedad completa lista para publicar**

```bash
node wiggot-scraper-y-publicar.js "URL_WIGGOT"
```

**Tiempo total:** ~3-5 minutos
**Resultado:** Página HTML + Tarjeta + Todo funcionando ✅
**Siguiente paso:** "publica ya" 🚀

---

**Última actualización:** Octubre 2025
**Versión:** 1.0
**Autor:** Sistema automatizado Wiggot → CasasEnVenta.info
