# 🔍 INSTRUCCIONES SCRAPER AUTOMÁTICO

## 📋 Proceso Actualizado

### ANTES (Manual - 18 minutos)
1. Scrapear propiedad
2. Descargar fotos manualmente
3. Generar HTML con PropertyPageGenerator
4. Corregir metadatos manualmente (title, description, Schema.org, Open Graph, hero)
5. Generar tarjeta para culiacan/index.html
6. Publicar

### AHORA (Automático - 3 minutos)
```bash
node scraper-y-publicar.js <URL_PROPIEDADES_COM>
```

## 🚀 Uso

### Comando
```bash
node scraper-y-publicar.js "https://propiedades.com/inmuebles/casa-en-venta-culiacan-sinaloa-..."
```

### Lo que hace automáticamente:
1. ✅ Scrapea datos de propiedades.com con Puppeteer
2. ✅ Descarga TODAS las fotos con curl
3. ✅ Genera HTML con PropertyPageGenerator (template Solidaridad)
4. ✅ Corrige AUTOMÁTICAMENTE:
   - Title tag
   - Meta description
   - Meta keywords
   - Canonical URL
   - Open Graph (title, description, url, image)
   - Schema.org COMPLETO (name, description, address, bedrooms, bathrooms)
   - Hero section (h1 title + subtitle description)
5. ✅ Genera tarjeta lista para insertar en culiacan/index.html
6. ✅ Lista para "publica ya"

## 📦 Output

El script genera:
- `casa-venta-[colonia].html` - Página completa con metadatos corregidos
- `tarjeta-casa-venta-[colonia].html` - Tarjeta para listings
- `images/casa-venta-[colonia]/foto-*.jpg` - Fotos descargadas

## 🎯 Ejemplo Completo

```bash
# 1. Ejecutar scraper
node scraper-y-publicar.js "https://propiedades.com/inmuebles/casa-en-venta-culiacan-sinaloa-sn-la-conquista-sinaloa-30395849"

# Output:
# 🚀 SCRAPER Y PUBLICADOR AUTOMÁTICO
#
# 🔍 Scrapeando: https://propiedades.com/...
# ✅ Datos scrapeados: { title: 'Venta casa...', price: '$1,600,000 MXN', fotos: 9 }
#
# 📸 Descargando 9 fotos...
#    ✅ foto-1.jpg
#    ✅ foto-2.jpg
#    ...
# ✅ 9 fotos descargadas en images/casa-venta-la-conquista
#
# 📄 Generando HTML con PropertyPageGenerator...
# 🔧 Corrigiendo metadatos automáticamente...
#    ✅ Title corregido
#    ✅ Meta description corregida
#    ✅ Open Graph corregido
#    ✅ Schema.org corregido
#    ✅ Hero section corregido
# ✅ HTML generado: casa-venta-la-conquista.html
#
# 🎴 Generando tarjeta para culiacan/index.html...
# ✅ Tarjeta generada: tarjeta-casa-venta-la-conquista.html
#
# ✅ PROCESO COMPLETADO
#
# 📦 Archivos generados:
#    - casa-venta-la-conquista.html
#    - tarjeta-casa-venta-la-conquista.html
#    - images/casa-venta-la-conquista/ (9 fotos)
#
# 🎯 Próximo paso:
#    1. Revisar: open casa-venta-la-conquista.html
#    2. Publicar: dile "publica ya"

# 2. Revisar página
open casa-venta-la-conquista.html

# 3. Publicar (comando al asistente)
"publica ya"
```

## ✅ Correcciones Automáticas Incluidas

El script ahora corrige automáticamente:

### 1. Title Tag
```html
<!-- ANTES -->
<title>Casa en Venta $1,600,000 - Infonavit Solidaridad, Culiacán | Hector es Bienes Raíces</title>

<!-- DESPUÉS -->
<title>Casa en Venta $1,600,000 - La Conquista, Culiacán | Hector es Bienes Raíces</title>
```

### 2. Meta Description
```html
<!-- ANTES -->
<meta name="description" content="Casa remodelada en venta en Infonavit Solidaridad...">

<!-- DESPUÉS -->
<meta name="description" content="Casa en venta en La Conquista, Culiacán. 2 recámaras, 1 baño, 140m² terreno. ¡Contáctanos!">
```

### 3. Schema.org
```json
// ANTES
"name": "Casa Remodelada en Infonavit Solidaridad",
"description": "Casa remodelada en venta en Infonavit Solidaridad...",
"numberOfBedrooms": 2,
"numberOfBathroomsTotal": 2,

// DESPUÉS
"name": "Casa en Venta La Conquista",
"description": "Hermosa casa cuenta con dos recámaras, un baño completo...",
"numberOfBedrooms": 2,
"numberOfBathroomsTotal": 1,
```

### 4. Hero Section
```html
<!-- ANTES -->
<h1 class="hero-title">Tu Nuevo Hogar Te Está Esperando</h1>
<p class="hero-subtitle">Se vende Casa en Infonavit Solidaridad...</p>

<!-- DESPUÉS -->
<h1 class="hero-title">Casa en Venta La Conquista</h1>
<p class="hero-subtitle">Hermosa casa con 2 recámaras, 1 baño completo, patio amplio...</p>
```

## 🔧 Configuración

No requiere configuración adicional. Solo asegúrate de tener:
- Node.js instalado
- Puppeteer instalado: `npm install puppeteer`
- PropertyPageGenerator funcional

## 📝 Notas

- El scraper usa Puppeteer para bypass anti-bot
- Las fotos se descargan con curl (más confiable que http)
- Todos los metadatos se corrigen automáticamente
- La tarjeta está lista para copiar/pegar en culiacan/index.html

## 🎉 Resultado

**De 18 minutos a 3 minutos** - Todo automatizado desde URL hasta "publica ya"
