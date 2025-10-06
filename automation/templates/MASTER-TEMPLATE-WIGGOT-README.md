# 📄 MASTER TEMPLATE WIGGOT

**Archivo:** `master-template-wiggot.html`

## 🎯 ¿QUÉ ES ESTE TEMPLATE?

Este es el **template HTML completo y perfecto** basado en Casa Portalegre que incluye TODAS las características funcionando al 100%.

## ✨ CARACTERÍSTICAS INCLUIDAS

### 1. **Carrusel de Fotos Funcionando Perfectamente**
- ✅ Soporte para 16+ fotos
- ✅ Flechas naranjas (#ff4e00) visibles
- ✅ Navegación con flechas ← →
- ✅ Dots de navegación
- ✅ Transiciones suaves (opacity fade)
- ✅ Touch/swipe en móvil
- ✅ CSS inline con `!important` para evitar conflictos

### 2. **Lightbox Funcionando**
- ✅ Se abre al clickear foto o flecha
- ✅ Muestra todas las fotos (no negro)
- ✅ Navegación dentro del lightbox
- ✅ Contador "Foto X de Y"
- ✅ Cierre con X o tecla ESC

### 3. **Descripción Completa**
- ✅ Título: "Casa en Venta [Nombre] Premium"
- ✅ Descripción detallada con todas las características
- ✅ Formato limpio y legible

### 4. **Calculadora de Hipoteca**
- ✅ Título con clase `section-title` (mismo estilo que otras secciones)
- ✅ Gradiente negro-naranja
- ✅ Línea decorativa debajo
- ✅ Calculadora Zillow style funcional

### 5. **Mapa de Ubicación (Desktop Only)**
- ✅ Google Maps interactivo
- ✅ Marcador en ubicación exacta
- ✅ Oculto en móvil (< 768px)
- ✅ Bordes redondeados y sombra elegante

### 6. **Estilos Visuales**
- ✅ Flechas carrusel: Naranja con hover effect
- ✅ Botones: Gradientes verdes (VENTA)
- ✅ Fuente: Poppins
- ✅ Iconos: Font Awesome 6.0.0
- ✅ Responsive design completo

### 7. **SEO y Metadata**
- ✅ Meta tags completos
- ✅ Open Graph
- ✅ Schema.org structured data
- ✅ Canonical URL
- ✅ Favicon y PWA icons

## 🔧 CÓMO USAR ESTE TEMPLATE

### Opción 1: Manual (Buscar y Reemplazar)

1. Copia `master-template-wiggot.html`
2. Buscar y reemplazar:
   - `casa-venta-portalegre-045360` → tu slug
   - `Portalegre` → tu ubicación
   - `$1,750,000` → tu precio
   - `Casa en Venta Portalegre Premium` → tu título
   - Descripción completa

### Opción 2: Automático (Usar script)

```bash
node scraper-y-publicar.js "URL_DE_WIGGOT"
```

El script usa este template como base y hace todos los reemplazos automáticamente.

## 📋 CHECKLIST DE VALIDACIÓN

Después de crear una página desde este template, verifica:

- [ ] Carrusel muestra todas las fotos (no solo la primera)
- [ ] Flechas naranjas son visibles
- [ ] Lightbox se abre y muestra fotos (no negro)
- [ ] Descripción completa visible en hero
- [ ] Calculadora con título grande (section-title)
- [ ] Mapa visible en desktop
- [ ] Precio correcto en todos lados
- [ ] Meta tags actualizados
- [ ] Schema.org con todas las imágenes

## 🎨 ESTRUCTURA DEL TEMPLATE

```
├── Hero Section
│   ├── Título + Descripción
│   ├── Carrusel (16 fotos)
│   │   ├── Slides
│   │   ├── Flechas naranjas
│   │   └── Dots navegación
│   └── Price Badge
│
├── Action Bar (Compartir/Imprimir)
│
├── Features Compact (Recámaras, Baños, etc.)
│
├── Details Section (Badges info)
│
├── Calculadora de Hipoteca
│   ├── Título section-title
│   └── Calculadora Zillow
│
├── Mapa de Ubicación (Desktop)
│
├── Contact Section
│   ├── WhatsApp
│   └── Teléfono
│
├── Lightbox Modal
│
└── Scripts
    ├── Carrusel Hero
    ├── Lightbox
    ├── Calculadora
    └── Vibración móvil
```

## 🔥 VENTAJAS DE ESTE TEMPLATE

1. **100% Probado:** Todo funciona perfectamente
2. **Sin conflictos CSS:** Estilos inline con `!important`
3. **Responsive:** Se ve bien en desktop, tablet, móvil
4. **SEO Optimizado:** Meta tags + Schema.org completos
5. **Modern Features:** Scroll animations, haptic feedback
6. **Fácil de mantener:** Código limpio y comentado

## 📝 NOTAS IMPORTANTES

### Flechas Carrusel
Las flechas tienen CSS inline con `!important` en el `<head>`:
```css
.hero-image .carousel-arrow {
    background: rgba(255, 78, 0, 0.9) !important;
    color: white !important;
    /* ... más estilos */
}
```

**NO ELIMINAR** estos estilos o las flechas dejarán de funcionar.

### Lightbox
El JavaScript del lightbox usa:
```javascript
lightboxImg.src = lightboxImages[index]; // String directo, NO .src
```

**NO CAMBIAR** a `.src` o `.alt` o el lightbox mostrará negro.

### Fotos
El template espera fotos nombradas:
- `images/foto-1.jpg`
- `images/foto-2.jpg`
- ...
- `images/foto-N.jpg`

**La foto-1.jpg SIEMPRE debe ser la fachada.**

## 🚀 COMANDOS ÚTILES

### Crear nueva propiedad desde este template:
```bash
node scraper-y-publicar.js "URL_WIGGOT"
```

### Validar que todo funciona:
```bash
open culiacan/casa-venta-SLUG/index.html
```

### Ver diferencias con template:
```bash
diff master-template-wiggot.html culiacan/casa-venta-SLUG/index.html
```

---

**Última actualización:** Octubre 2025
**Versión:** 1.0 (Portalegre Base)
**Autor:** Sistema automatizado basado en Casa Portalegre
