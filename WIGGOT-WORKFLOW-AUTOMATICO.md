# 🤖 WIGGOT WORKFLOW AUTOMÁTICO

## 🎯 COMANDO SIMPLE - SOLO PEGA LA URL

**Tú haces:**
```
https://new.wiggot.com/search/property-detail/pXXXXXX
```

**Yo hago TODO automáticamente:**

---

## 📋 PROCESO COMPLETO AUTOMÁTICO

### 1️⃣ DETECCIÓN (Automático)
- ✅ Detecto que es URL de Wiggot (contiene `wiggot.com`)
- ✅ Activo workflow automático sin preguntar

### 2️⃣ SCRAPING (Automático)
```bash
node wiggot-scraper-y-publicar.js "[URL]"
```
- ✅ Auto-login a Wiggot
- ✅ Click en "Ver más fotos"
- ✅ Scrapeo de datos:
  - Título
  - Precio
  - Ubicación
  - Recámaras, baños, estacionamientos
  - M² construcción y terreno
  - Descripción completa
  - TODAS las fotos (URLs)

### 3️⃣ DESCARGA DE FOTOS (Automático)
- ✅ Crear carpeta `culiacan/[slug]/images/`
- ✅ Descargar TODAS las fotos
- ✅ Renombrar: foto-1.jpg, foto-2.jpg, ..., foto-N.jpg
- ✅ Crear subcarpetas: webp/ y optimized/

### 4️⃣ GENERACIÓN HTML (Automático)
- ✅ Leer template base (Bugambilias)
- ✅ Reemplazar todos los datos
- ✅ Generar carrusel dinámico con N fotos:
  - N slides HTML
  - N dots de navegación
  - N entradas en lightbox array
  - totalSlides = N
- ✅ Corregir features:
  - Recámaras
  - Baños
  - Estacionamientos
  - **M² construcción** (nuevo ícono fa-home)
  - M² terreno
- ✅ **Agregar mapa de ubicación Google Maps**:
  - URL encoding automático
  - Zoom 15
  - Oculto en móvil
- ✅ Actualizar Schema.org con todas las fotos
- ✅ Copiar logos y styles.css

### 5️⃣ GENERACIÓN DE TARJETA (Automático)
- ✅ Crear tarjeta para `culiacan/index.html`
- ✅ Badge verde con precio
- ✅ Carrusel de 3 fotos
- ✅ Features con iconos SVG
- ✅ Botón "Ver Detalles"

### 6️⃣ REVISIÓN LOCAL (Yo abro, tú revisas)
```bash
open culiacan/[slug]/index.html
```
- 🔍 Yo abro la página en tu navegador
- 👀 Tú revisas que todo esté bien
- ✅ Yo pregunto: **"¿Está todo bien o hay que corregir algo?"**

### 7️⃣ CORRECCIONES (Si es necesario)
**Si dices:** "corrige [X]" o "falta [Y]"
- 🛠️ Yo corrijo lo que pidas
- 🔄 Vuelvo a abrir para revisión
- ✅ Repito hasta que digas "bien"

**Si dices:** "bien" o "listo" o "guarda"
- ✅ Procedo al paso 8

### 8️⃣ GUARDAR COMMITS (Cuando dices "bien")
```bash
git add culiacan/[slug]/
git commit -m "Add: Casa [Ubicación] - Wiggot [propertyId]"
```
- ✅ Commit de la propiedad completa
- ✅ **NO publico todavía**
- ✅ Espero tu orden

### 9️⃣ PUBLICAR (Cuando dices "publica ya")
```bash
gitops-publicador → PUBLICA YA
```
- ✅ Merge directo a main
- ✅ GitHub Pages deployment
- ✅ URL: `https://casasenventa.info/culiacan/[slug]/`
- ⏱️ Live en 1-2 minutos

---

## ✅ CHECKLIST DE VALIDACIÓN AUTOMÁTICA

Antes de mostrarte la página, yo verifico:

### Carrusel:
- [ ] N slides HTML (data-slide 0 a N-1)
- [ ] N dots de navegación
- [ ] N entradas en lightboxImages array
- [ ] totalSlidesHero = N
- [ ] Flechas de navegación presentes
- [ ] Primera foto con loading="eager", resto "lazy"

### Features:
- [ ] 5 features presentes (rec, baños, autos, m² const, m² terreno)
- [ ] Datos coinciden con JSON scraped
- [ ] Iconos Font Awesome correctos
- [ ] Ícono m² construcción (fa-home) incluido

### Mapa:
- [ ] Sección de mapa presente
- [ ] URL con ubicación correcta (encoded)
- [ ] Google Maps API key válida
- [ ] Zoom level = 15
- [ ] Oculto en móvil (CSS correcto)

### Metadatos:
- [ ] Título correcto en <title>
- [ ] Meta description completa
- [ ] Schema.org con todas las fotos
- [ ] Open Graph tags correctos
- [ ] WhatsApp links con mensaje personalizado

### Estructura:
- [ ] Hero Section con carrusel
- [ ] Features Section (5 iconos)
- [ ] Calculator Section
- [ ] **Location Map Section (NUEVO)**
- [ ] Contact Section
- [ ] Footer

---

## 🚨 MANEJO DE ERRORES

### Error: Scraper falla
- 🔄 Yo reintento automáticamente 1 vez
- ❌ Si falla de nuevo, te aviso el error exacto
- 💡 Te sugiero solución

### Error: Fotos no descargan
- 🔄 Reintentar descarga de foto específica
- ⚠️ Avisar si alguna foto falla
- ✅ Continuar con las que sí descargaron

### Error: Duplicado detectado
- ⚠️ Yo te aviso que ya existe
- ❓ Te pregunto si quieres sobrescribir
- ✅ Si dices "sí" → continúo
- ❌ Si dices "no" → cancelo

### Error: Datos vacíos (título, ubicación)
- 🛠️ Yo corrijo manualmente desde descripción
- 📝 Te muestro qué datos usé
- ✅ Continúo con esos datos

---

## 📁 ARCHIVOS GENERADOS

```
culiacan/
└── [slug]/
    ├── index.html                 (Página completa)
    ├── styles.css                 (CSS copiado)
    └── images/
        ├── foto-1.jpg             (Fachada - primera foto)
        ├── foto-2.jpg
        ├── ...
        ├── foto-N.jpg
        ├── optimized/
        │   └── Logo-hector-es-bienes-raices.jpg
        └── webp/
            └── Logo-hector-es-bienes-raices.webp
```

---

## 🎨 TEMPLATES USADOS AUTOMÁTICAMENTE

### 1. Template Base:
- **Archivo:** `culiacan/casa-venta-casa-en-venta-bugambilias-zona-aeropuert-pYowL0a/index.html`
- **Razón:** Estructura completa y validada

### 2. Carrusel (Dinámico):
- **Referencia:** `WIGGOT-CARRUSEL-HTML-COMPLETO.html`
- **Slides:** Generados según photoCount
- **Dots:** Generados según photoCount

### 3. Features:
- **Referencia:** `WIGGOT-FEATURES-SECTION.html`
- **5 features:** rec, baños, autos, m² const, m² terreno

### 4. Mapa:
- **Referencia:** `WIGGOT-MAPA-UBICACION.html`
- **API Key:** AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8
- **Zoom:** 15

### 5. Styles:
- **Origen:** `culiacan/casa-venta-la-rioja-477140/styles.css`
- **Incluye:** Carrusel, lightbox, features, mapa, responsive

---

## 💬 COMANDOS QUE TÚ USAS

### Para iniciar:
```
https://new.wiggot.com/search/property-detail/pXXXXXX
```
(Solo la URL, yo detecto automáticamente)

### Durante revisión:
```
"bien"           → Guardar commits
"listo"          → Guardar commits
"guarda"         → Guardar commits
"publica ya"     → Deployment directo
"corrige [X]"    → Hago corrección específica
"falta [X]"      → Agrego lo que falta
```

---

## 🔧 SCRIPT EJECUTADO

**Ubicación:** `wiggot-scraper-y-publicar.js`

**Comando interno:**
```bash
node wiggot-scraper-y-publicar.js "[URL]"
```

**Pasos del script:**
1. Scrapear Wiggot con Puppeteer
2. Verificar duplicados
3. Crear carpetas
4. Descargar fotos
5. Generar HTML con template
6. Agregar mapa de ubicación (NUEVO)
7. Agregar tarjeta a culiacan/index.html
8. Listo para revisión

---

## 📊 EJEMPLO COMPLETO

### Tú pegas:
```
https://new.wiggot.com/search/property-detail/pMwp1MU
```

### Yo hago:
```
🚀 DETECCIÓN: URL de Wiggot detectada
📥 Scrapeando datos...
✅ Título: Casa en Venta Fraccionamiento Los Pinos
💰 Precio: $5,500,000
📸 Fotos: 12 encontradas
📁 Descargando fotos...
✅ 12 fotos descargadas
🛠️ Generando HTML...
✅ Carrusel: 12 slides + 12 dots
✅ Features: 4 rec, 3 baños, 2 autos, 180 m² const, 200 m² terreno
✅ Mapa: Los Pinos, Culiacán
📝 Tarjeta agregada a culiacan/index.html
🌐 Abriendo página para revisión...
```

### Te pregunto:
```
¿Está todo bien o hay que corregir algo?
```

### Tú respondes:
```
"bien"
```

### Yo hago:
```
✅ Guardando commits...
📦 Commit: Add: Casa Fraccionamiento Los Pinos - Wiggot pMwp1MU
✅ Listo. Di "publica ya" cuando quieras deployment.
```

### Tú dices:
```
"publica ya"
```

### Yo publico:
```
🚀 Publicando...
✅ Deployment completado
🌐 URL: https://casasenventa.info/culiacan/casa-venta-fraccionamiento-los-pinos-pMwp1MU/
⏱️ Live en 1-2 minutos
```

---

## 🎯 REGLAS QUE YO SIGO

### 1. DETECCIÓN AUTOMÁTICA
- Si veo URL con `wiggot.com` → activo workflow automático
- No pregunto nada, solo ejecuto

### 2. TODO AUTOMÁTICO HASTA REVISIÓN
- Scrapeo, descargo, genero, abro
- Solo me detengo para que revises

### 3. CORRECCIONES RÁPIDAS
- Si dices "corrige [X]" → corrijo y reabro
- Si dices "bien" → guardo commits
- Si dices "publica ya" → deployment directo

### 4. GUARDAR TEMPLATES
- Si dices "quedó bien, guárdalo en el archivo" → creo/actualizo template
- Siempre documento lo que quedó bien

### 5. NO PUBLICAR SIN ORDEN
- NUNCA publico sin que digas "publica ya"
- Primero guardar commits, luego esperar orden

---

## 📝 NOTAS IMPORTANTES

### ⚠️ IMPORTANTE:
- **NO modifico código durante scraping** (solo después si pides corrección)
- **NO publico automáticamente** (espero tu orden)
- **SÍ abro página para revisión** (siempre)
- **SÍ guardo templates** (cuando dices que quedó bien)

### 🎨 DIFERENCIAS CON PROPIEDADES.COM:
- Wiggot tiene m² construcción Y terreno separados
- Wiggot usa 5 features (no 4)
- Template base: Bugambilias (no La Rioja)

### 🗺️ MAPA SIEMPRE INCLUIDO:
- Desde Octubre 2025, todas las propiedades Wiggot tienen mapa
- Se inserta automáticamente antes de Contact Section
- URL encoding automático de ubicación

---

## 🚀 INICIO RÁPIDO

1. **Tú:** Pega URL de Wiggot
2. **Yo:** Hago todo automáticamente
3. **Tú:** Revisa página abierta
4. **Tú:** Di "bien" o correcciones
5. **Yo:** Guardo commits
6. **Tú:** Di "publica ya"
7. **Yo:** Deployment directo

**¡Eso es todo! 🎉**

---

## 📚 DOCUMENTACIÓN RELACIONADA

- `WIGGOT-ESTRUCTURA-FOTOS.md` - Estructura del carrusel
- `WIGGOT-CARRUSEL-HTML-COMPLETO.html` - Template del carrusel
- `WIGGOT-FEATURES-SECTION.html` - Template de features
- `WIGGOT-MAPA-UBICACION.html` - Template del mapa
- `INSTRUCCIONES_SCRAPER.md` - Scraper de propiedades.com
- `ADD-PROPERTY-README.md` - Agregar propiedades desde PROYECTOS

---

**Última actualización:** Octubre 2025
**Basado en:** Casa Renta Barrio San Alberto (pgtrrTw)
**Script:** wiggot-scraper-y-publicar.js
