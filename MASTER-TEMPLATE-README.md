# 🏗️ SISTEMA MASTER TEMPLATE - GENERADOR DE PROPIEDADES

## 📋 DESCRIPCIÓN

Sistema actualizado (Octubre 2025) para generar páginas de propiedades con **estructura 100% fija** y **solo datos variables**. Garantiza que todas las propiedades generadas tengan exactamente la misma estructura HTML/CSS/JS que Casa Solidaridad.

### ⚠️ CORRECCIONES CRÍTICAS APLICADAS (OCT 2025)
1. ✅ **Flechas del carrusel agregadas** - Navegación ← → funcionando
2. ✅ **Lightbox array dinámico** - Se genera según photoCount (no hardcodeado)
3. ✅ **Textos personalizados** - 15+ replacements para eliminar textos de Casa Solidaridad
4. ✅ **CSS actualizado en ROOT** - `styles.css` (87KB) copiado desde Casa Solidaridad

**Documentación completa:** Ver `CORRECCIONES-MASTER-TEMPLATE-OCT-2025.md`

## 🎯 VENTAJAS

✅ **Consistencia total**: Todas las propiedades usan la misma estructura
✅ **Sin errores**: No se pierde código al copiar/modificar templates
✅ **Mantenible**: Solo actualizar master-template.html para cambiar todas las propiedades futuras
✅ **Limpio**: Sistema de placeholders `{{VARIABLE}}` fácil de entender
✅ **Completo**: Incluye todas las modern features (sticky bar, animations, haptic, calculadora)

## 📂 ARCHIVOS CLAVE

```
automation/
├── templates/
│   └── master-template.html          # ⭐ Template base con placeholders
├── generador-de-propiedades.js       # Generador actualizado
├── convert-to-template.js            # Script conversión Parte 1 (HEAD)
├── convert-to-template-PART2.js      # Script conversión Parte 2 (BODY)
└── test-master-template.js           # Script de prueba
```

## 🔧 USO BÁSICO

### Opción 1: Usar método `generateFromMasterTemplate()`

```javascript
const PropertyPageGenerator = require('./automation/generador-de-propiedades');

const generator = new PropertyPageGenerator(false); // false = venta

const config = {
    key: 'casa-venta-mi-propiedad',
    title: 'Casa Mi Propiedad',
    price: '$5,000,000',
    location: 'Fracc. Mi Fracc, Culiacán',
    bedrooms: 3,
    bathrooms: 2,
    construction_area: 200,
    land_area: 250,
    photoCount: 8  // Número de fotos disponibles
};

const html = generator.generateFromMasterTemplate(config);
fs.writeFileSync('casa-venta-mi-propiedad.html', html);
```

### Opción 2: Ejecutar script de prueba

```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"
node automation/test-master-template.js
```

## 📝 PLACEHOLDERS DISPONIBLES

### Meta Tags y SEO
- `{{PRECIO}}` - Precio formateado ($X,XXX,XXX)
- `{{LOCATION_FULL}}` - Ubicación completa
- `{{LOCATION_SHORT}}` - Ubicación corta (primer segmento)
- `{{SLUG}}` - Slug de la propiedad
- `{{META_DESCRIPTION}}` - Meta description SEO
- `{{META_KEYWORDS}}` - Keywords SEO
- `{{OG_DESCRIPTION}}` - Open Graph description

### Schema.org (JSON-LD)
- `{{SCHEMA_NAME}}` - Nombre de la propiedad
- `{{SCHEMA_DESCRIPTION}}` - Descripción completa
- `{{STREET_ADDRESS}}` - Dirección
- `{{LOCALITY}}` - Localidad/ciudad
- `{{POSTAL_CODE}}` - Código postal
- `{{LATITUDE}}` - Latitud GPS
- `{{LONGITUDE}}` - Longitud GPS
- `{{CONSTRUCTION_AREA}}` - M² construcción
- `{{LAND_AREA}}` - M² terreno
- `{{TOTAL_ROOMS}}` - Total habitaciones
- `{{BEDROOMS}}` - Recámaras
- `{{BATHROOMS}}` - Baños
- `{{FULL_BATHROOMS}}` - Baños completos
- `{{YEAR_BUILT}}` - Año construcción
- `{{PRICE_NUMERIC}}` - Precio numérico (sin formato)
- `{{AMENITIES_JSON}}` - Array de amenidades (JSON)

### Hero Section
- `{{HERO_SUBTITLE}}` - Subtítulo del hero (ej: "3 rec • 2 baños • 200m²")
- `{{CAROUSEL_SLIDES}}` - Slides del carrusel (generado dinámicamente)
- `{{CAROUSEL_DOTS}}` - Dots del carrusel (generado dinámicamente)

### Features Compact
- `{{PARKING_SPACES}}` - Espacios de estacionamiento
- `{{FLOORS}}` - Número de pisos

### Contact/WhatsApp
- `{{WHATSAPP_MESSAGE_ENCODED}}` - Mensaje WhatsApp URL-encoded
- `{{FULL_ADDRESS}}` - Dirección completa
- `{{TITLE_SHORT}}` - Título corto (30 caracteres)

### JavaScript
- `{{PHOTO_COUNT}}` - Total de fotos
- `{{LIGHTBOX_IMAGES_ARRAY}}` - Array de imágenes lightbox (generado dinámicamente)

### Share Functions
- `{{SHARE_WHATSAPP_TEXT}}` - Texto para compartir WhatsApp
- `{{SHARE_EMAIL_SUBJECT}}` - Subject del email
- `{{SHARE_EMAIL_BODY}}` - Body del email

## 🔄 PROCESO DE CONVERSIÓN (YA COMPLETADO)

El master template fue creado automáticamente desde Casa San Javier:

```bash
# Parte 1: HEAD y Schema.org
node automation/convert-to-template.js

# Parte 2: BODY (hero, features, contact, etc.)
node automation/convert-to-template-PART2.js
```

**Resultado:** `automation/templates/master-template.html` ✅

## 📊 COMPARACIÓN: NUEVO vs ANTIGUO

| Aspecto | Método Antiguo (`generateFromSolidaridadTemplate`) | Método Nuevo (`generateFromMasterTemplate`) |
|---------|---------------------------------------------------|-------------------------------------------|
| **Template** | Copia Casa Solidaridad completa | Usa master-template.html con placeholders |
| **Mantenimiento** | Difícil (buscar/reemplazar hardcoded) | Fácil (solo actualizar placeholders) |
| **Errores** | Alto riesgo (regex frágiles) | Bajo riesgo (reemplazo simple) |
| **Legibilidad** | Baja (código complejo) | Alta (placeholders claros) |
| **Extensible** | Difícil | Fácil (agregar nuevo placeholder) |
| **Status** | DEPRECATED ⚠️ | RECOMENDADO ✅ |

## 🎨 CARACTERÍSTICAS INCLUIDAS

Todas las páginas generadas incluyen automáticamente:

✅ **Sticky Price Bar** - Barra fija con precio + WhatsApp
✅ **Scroll Animations** - Animaciones fade-in suaves
✅ **Haptic Feedback** - Vibración en móviles (Android)
✅ **Calculadora Zillow** - Hipoteca reducida 70%
✅ **Hero Compacto** - Description box 50% más pequeño
✅ **Features Compactas** - Iconos 15% más grandes
✅ **Lightbox Gallery** - Galería de fotos expandible
✅ **Share Buttons** - WhatsApp, Facebook, Email, Copy Link
✅ **SEO Completo** - Meta tags, Schema.org, Open Graph

## 🚀 WORKFLOW COMPLETO

### Agregar Nueva Propiedad

1. **Preparar fotos** en carpeta PROYECTOS
2. **Crear config** con datos de la propiedad
3. **Generar HTML** con `generateFromMasterTemplate(config)`
4. **Guardar archivo** en `culiacan/[slug]/index.html`
5. **Agregar tarjeta** en `culiacan/index.html`
6. **Publicar** con "publica ya"

### Ejemplo Completo

```javascript
#!/usr/bin/env node
const fs = require('fs');
const PropertyPageGenerator = require('./automation/generador-de-propiedades');

// 1. Config de la propiedad
const config = {
    key: 'casa-venta-mi-nueva-casa',
    title: 'Casa Mi Nueva Casa',
    price: '$8,500,000',
    location: 'Fracc. La Primavera, Culiacán, 80199',
    bedrooms: 4,
    bathrooms: 3.5,
    construction_area: 350,
    land_area: 400,
    parking: 3,
    floors: 2,
    photoCount: 12,
    yearBuilt: 2023,
    postalCode: '80199',
    latitude: 24.8245,
    longitude: -107.4315,
    amenities: [
        { "@type": "LocationFeatureSpecification", "name": "Alberca", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Jardín amplio", "value": true },
        { "@type": "LocationFeatureSpecification", "name": "Cocina integral", "value": true }
    ]
};

// 2. Generar HTML
const generator = new PropertyPageGenerator(false);
const html = generator.generateFromMasterTemplate(config);

// 3. Guardar archivo
const outputDir = `./culiacan/${config.key}`;
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(`${outputDir}/index.html`, html);

console.log(`✅ Propiedad generada: ${outputDir}/index.html`);
```

## 🔍 VALIDACIÓN POST-GENERACIÓN

Después de generar una propiedad, verificar:

```bash
# 1. Buscar placeholders sin reemplazar
grep -o '{{[^}]*}}' culiacan/mi-nueva-casa/index.html

# 2. Verificar referencias a fotos
grep -o 'images/foto-[0-9]*.jpg' culiacan/mi-nueva-casa/index.html | sort | uniq

# 3. Verificar links de WhatsApp
grep -o 'wa.me/[^"]*' culiacan/mi-nueva-casa/index.html

# 4. Validar HTML (opcional)
# Usar validator.w3.org
```

## 📚 DOCUMENTACIÓN RELACIONADA

- `ROADMAP-ESTRUCTURA-PROPIEDADES.md` - Análisis completo de estructura
- `CLAUDE.md` - Instrucciones generales del proyecto
- `ADD-PROPERTY-README.md` - Workflow agregar propiedades
- `INSTRUCCIONES_SCRAPER.md` - Scraper automático propiedades.com

## 🐛 TROUBLESHOOTING

### Error: "Master template no encontrado"

**Solución:**
```bash
# Verificar que existe
ls -la automation/templates/master-template.html

# Si no existe, regenerar
node automation/convert-to-template.js
node automation/convert-to-template-PART2.js
```

### Placeholders sin reemplazar

**Solución:**
1. Verificar que el placeholder existe en `master-template.html`
2. Agregar el placeholder a `generateFromMasterTemplate()` en `generador-de-propiedades.js`
3. Ejecutar `test-master-template.js` para validar

### Carrusel no funciona

**Solución:**
1. Verificar que `totalSlidesHero = {{PHOTO_COUNT}}` fue reemplazado
2. Verificar que array `lightboxImages` tiene todas las fotos
3. Verificar CSS cargado: `culiacan/infonavit-solidaridad/styles.css`

## 📝 NOTAS IMPORTANTES

⚠️ **NUNCA modificar** `master-template.html` manualmente (solo con scripts)
⚠️ **SIEMPRE usar** `generateFromMasterTemplate()` para nuevas propiedades
⚠️ **DEPRECADO:** `generateFromSolidaridadTemplate()` (usar solo legacy)
⚠️ **CRITICAL:** Fachada debe ser `foto-1.jpg` siempre

## 🎯 PRÓXIMOS PASOS

1. ✅ Master template creado
2. ✅ Generador actualizado con `generateFromMasterTemplate()`
3. ✅ Script de prueba funcional
4. ⏳ Integrar con `add-property.js` para workflow completo
5. ⏳ Integrar con scraper automático
6. ⏳ Actualizar CLAUDE.md con nuevas instrucciones

---

**Última actualización:** 2025-01-XX
**Autor:** Sistema automatizado PropertyPageGenerator
**Status:** ✅ PRODUCCIÓN READY

---

## ⚠️ REQUISITO CRÍTICO: CSS ACTUALIZADO EN ROOT

### El Problema
Si el archivo `styles.css` en ROOT está desactualizado (versión vieja de 20KB), las propiedades generadas mostrarán:
- ❌ Fotos gigantes apiladas verticalmente
- ❌ Carrusel NO funciona
- ❌ Flechas invisibles o sin funcionar
- ❌ Lightbox roto

### La Solución
**SIEMPRE** mantener el CSS actualizado desde Casa Solidaridad:

```bash
cp culiacan/infonavit-solidaridad/styles.css styles.css
```

### Verificación
```bash
$ ls -lh styles.css
-rw-r--r--  87734  styles.css  # ✅ CORRECTO - 87KB (CSS completo)
```

Si ves solo 20KB → ❌ ESTÁ DESACTUALIZADO

### ¿Por qué?
El `styles.css` en `culiacan/infonavit-solidaridad/` contiene TODOS los estilos necesarios:
- ✅ `.carousel-slide` - Estilos del carrusel
- ✅ `.carousel-arrow` - Botones de navegación
- ✅ `.carousel-dot` - Indicadores
- ✅ `#lightbox` - Modal expandible
- ✅ `.sticky-price-bar` - Barra fija superior
- ✅ Animaciones scroll
- ✅ Haptic feedback
- ✅ Responsive design completo

**IMPORTANTE:** Después de actualizar Casa Solidaridad, SIEMPRE copiar el CSS actualizado al ROOT.

---

## 📚 DOCUMENTACIÓN RELACIONADA

- `CORRECCIONES-MASTER-TEMPLATE-OCT-2025.md` - Detalles completos de correcciones aplicadas
- `CLAUDE.md` - Instrucciones principales del proyecto
- `SISTEMA-PROTECCION-GENERADOR.md` - Sistema de validación automática
- `automation/validador-master-template.js` - Código de validación

---

**Última actualización:** Octubre 3, 2025
**Estado:** ✅ Sistema funcionando correctamente con todas las correcciones aplicadas
