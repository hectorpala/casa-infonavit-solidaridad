# 🏠 SCRAPER AUTOMÁTICO INMUEBLES24

## 📋 DESCRIPCIÓN

Sistema automatizado para scrapear propiedades de **Inmuebles24.com** y publicarlas automáticamente en casasenventa.info con el formato Master Template completo.

## ⚡ USO RÁPIDO

```bash
node inmuebles24-scraper-y-publicar.js "URL_DE_INMUEBLES24"
```

### Ejemplo:
```bash
node inmuebles24-scraper-y-publicar.js "https://www.inmuebles24.com/propiedades/clasificado/casa-en-venta-lomas-de-anahuac-145949789.html"
```

## 🔄 PROCESO AUTOMÁTICO (2-3 MINUTOS)

1. ✅ **Scrapea datos** de Inmuebles24:
   - Título de la propiedad
   - Precio
   - Ubicación
   - Recámaras, baños, estacionamiento
   - Área de construcción y terreno
   - Descripción completa
   - Características/amenidades

2. ✅ **Descarga TODAS las fotos** automáticamente
   - Detecta imágenes en alta resolución (1200x900)
   - Las guarda como `foto-1.jpg`, `foto-2.jpg`, etc.
   - Típicamente 10-30 fotos por propiedad

3. ✅ **Genera HTML** con Master Template
   - Sticky Price Bar con WhatsApp
   - Scroll Animations (fade-in)
   - Haptic Feedback (vibración móvil)
   - Calculadora Zillow reducida 70%
   - Hero compacto
   - Lightbox gallery
   - Carrusel hero interactivo
   - SEO completo (Schema.org + Open Graph)

4. ✅ **Genera tarjeta** en culiacan/index.html
   - Badge verde para VENTA
   - Carrusel de fotos
   - Características (recámaras, baños, m²)
   - Botón "Ver Detalles"

5. ✅ **Commit y push automático** a GitHub
   - Mensaje descriptivo
   - Deploy a GitHub Pages
   - Disponible en 1-2 minutos

## 📦 REQUISITOS

### Node.js y paquetes:
```bash
npm install puppeteer dotenv
```

### Variables de entorno (opcional):
Crear archivo `.env` en la raíz:
```env
GOOGLE_MAPS_KEY=tu_api_key_aqui
```

## 🎯 CARACTERÍSTICAS SCRAPEADAS

| Dato | Selector | Fallback |
|------|----------|----------|
| Título | `h1.title, h1[data-qa="POSTING_CARD_TITLE"]` | - |
| Precio | `.price-value, [data-qa="POSTING_CARD_PRICE"]` | - |
| Ubicación | `.location-data, [data-qa="POSTING_CARD_LOCATION"]` | - |
| Recámaras | `.features-item` (regex: `/(\d+)/`) | 3 |
| Baños | `.features-item` (regex: `/(\d+)/`) | 2 |
| Estacionamiento | `.features-item` (regex: `/(\d+)/`) | 2 |
| M² construcción | `.features-item` (regex: `/(\d+(?:\.\d+)?)\s*m/`) | 150 |
| M² terreno | `.features-item` (regex: `/(\d+(?:\.\d+)?)\s*m/`) | 200 |
| Descripción | `.description, [data-qa="POSTING_DESCRIPTION"]` | Auto-generada |
| Imágenes | `img[src*="cloudfront"]` (versión 1200x900) | - |

## 🛡️ PROTECCIONES ANTI-SCRAPING

El scraper incluye técnicas para evitar detección:

1. **User Agent real**: Chrome 120 en macOS
2. **Viewport desktop**: 1920x1080
3. **Headers personalizados**: Accept-Language español
4. **Oculta webdriver**: `navigator.webdriver = false`
5. **Modo headless desactivado**: Muestra navegador real (opcional)
6. **Delays naturales**: Espera 3 segundos entre acciones

## 📁 ESTRUCTURA GENERADA

```
culiacan/
└── casa-venta-lomas-anahuac-145949789/
    ├── index.html (Master Template completo)
    └── images/
        ├── foto-1.jpg
        ├── foto-2.jpg
        ├── foto-3.jpg
        └── ... (hasta foto-N.jpg)
```

## 🎨 FORMATO DE SALIDA

### HTML generado incluye:
- ✅ Hero section con carrusel de fotos
- ✅ Sticky Price Bar (aparece al scroll)
- ✅ Features section compacta
- ✅ Details section estilo Zillow
- ✅ Calculadora hipoteca reducida 70%
- ✅ Mapa Google Maps (con coordenadas)
- ✅ Contact section con WhatsApp
- ✅ Lightbox gallery expandible
- ✅ SEO completo (meta tags, Schema.org, Open Graph)

### Tarjeta en culiacan/index.html:
- ✅ Badge verde con precio
- ✅ Carrusel de fotos con flechas
- ✅ Botón de favoritos
- ✅ Características en badges
- ✅ Botón CTA verde "Ver Detalles"

## ⚙️ CONFIGURACIÓN AVANZADA

### Modo headless:
Editar en el archivo `inmuebles24-scraper-y-publicar.js`:
```javascript
const CONFIG = {
    headless: true, // Cambiar a false para ver el navegador
    timeout: 60000
};
```

### Personalizar template:
El scraper usa `automation/generador-de-propiedades.js` con el Master Template. Para personalizar:
1. Editar `automation/templates/master-template.html`
2. Los cambios se aplicarán a todas las propiedades futuras

## 🐛 TROUBLESHOOTING

### Error: "No se descargaron fotos"
- **Causa**: Inmuebles24 cambió estructura de imágenes
- **Solución**: Inspeccionar página y actualizar selectores en línea 136-146

### Error 403 Forbidden
- **Causa**: Inmuebles24 detectó scraping
- **Solución**:
  1. Cambiar `headless: false` para mostrar navegador
  2. Agregar delays más largos: `await page.waitForTimeout(5000)`
  3. Usar proxy/VPN

### Error: "Características no detectadas"
- **Causa**: Selectores desactualizados
- **Solución**: Inspeccionar HTML y actualizar selectores en línea 118-155

### Error: "Slug muy largo"
- **Causa**: Título de propiedad muy extenso
- **Solución**: El slug se trunca automáticamente a 60 caracteres

## 📊 COMPARACIÓN CON WIGGOT SCRAPER

| Característica | Wiggot | Inmuebles24 |
|----------------|---------|-------------|
| Auto-login | ✅ Sí (requiere .env) | ❌ No requiere |
| Fotos promedio | 16-37 | 10-30 |
| M² con decimales | ✅ Sí | ✅ Sí |
| Ubicación limpia | ✅ Sí | ✅ Sí |
| Mapa dinámico | ✅ Sí | ✅ Sí |
| Protección anti-scraping | Media | Alta |
| Velocidad | 2-3 min | 2-3 min |

## 🚀 EJEMPLO COMPLETO

```bash
# 1. Copiar URL de Inmuebles24
# Ejemplo: https://www.inmuebles24.com/propiedades/clasificado/casa-venta-145949789.html

# 2. Ejecutar scraper
node inmuebles24-scraper-y-publicar.js "https://www.inmuebles24.com/propiedades/clasificado/casa-venta-145949789.html"

# 3. Esperar 2-3 minutos
# ✅ Datos extraídos
# ✅ 15 fotos descargadas
# ✅ HTML generado
# ✅ Tarjeta agregada
# ✅ Publicado a GitHub

# 4. Verificar en navegador
open culiacan/casa-venta-lomas-anahuac-145949789/index.html

# 5. URL producción disponible en 1-2 minutos
# https://casasenventa.info/culiacan/casa-venta-lomas-anahuac-145949789/
```

## 📝 NOTAS IMPORTANTES

1. **Headless mode**: Por defecto está en `false` para evitar detección. Cambiar a `true` si Inmuebles24 permite scraping sin restricciones.

2. **Rate limiting**: No hacer más de 1 request por segundo para evitar baneos.

3. **Imágenes 404**: Algunas imágenes pueden fallar si Inmuebles24 usa lazy loading avanzado. El scraper continúa con las que sí descargó.

4. **Coordenadas GPS**: Por defecto usa coordenadas de Culiacán (24.8091, -107.3940). Para ubicación exacta, extraer del mapa de Inmuebles24.

5. **Precio con formato**: El scraper normaliza precios a formato `$1,234,567` automáticamente.

## 🔄 ACTUALIZACIÓN DE SELECTORES

Si Inmuebles24 cambia su HTML, actualizar estos selectores:

```javascript
// Línea 116-120: Título, precio, ubicación
const titleEl = document.querySelector('h1.title, h1[data-qa="POSTING_CARD_TITLE"]');
const priceEl = document.querySelector('.price-value, [data-qa="POSTING_CARD_PRICE"]');

// Línea 136-146: Imágenes
const imgElements = document.querySelectorAll('img[src*="cloudfront"], img[data-src*="cloudfront"]');

// Línea 127-155: Características (recámaras, baños, etc.)
const features = document.querySelectorAll('.features-item, .amenities-item, [data-qa*="FEATURE"]');
```

## 📞 SOPORTE

Si el scraper falla:
1. Verificar que la URL sea válida
2. Revisar logs de error en consola
3. Inspeccionar HTML de Inmuebles24 manualmente
4. Actualizar selectores si es necesario

---

**Versión:** 1.0.0
**Última actualización:** Octubre 2025
**Compatibilidad:** Node.js 14+, Puppeteer 21+
