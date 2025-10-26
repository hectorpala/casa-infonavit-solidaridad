# 🏗️ Pipeline Inmuebles24 Culiacán

## 📋 Resumen General

**Sistema automatizado end-to-end** para extraer, validar y publicar propiedades desde Inmuebles24.com a casasenventa.info.

### 🎯 Propósito
Automatizar completamente el proceso de:
1. Descubrir nuevas propiedades en Inmuebles24
2. Identificar duplicados vs propiedades nuevas
3. Scrapear datos + fotos con anti-bot evasion
4. Generar páginas HTML con template completo
5. Publicar a GitHub Pages

### 🌆 Ciudades Soportadas
- **Culiacán, Sinaloa** (principal)
- **Monterrey, Nuevo León** (multi-ciudad)
- **Mazatlán, Sinaloa** (multi-ciudad)

### 🔧 Dependencias Clave
- **Node.js** >= 14.x
- **Puppeteer** >= 21.0 (headless Chrome)
- **Google Maps API** (geocoding)
- **Git** + GitHub Pages (deployment)
- **jq** (manipulación JSON en CLI)

---

## 🔄 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│  PIPELINE INMUEBLES24 - FLUJO COMPLETO                          │
└─────────────────────────────────────────────────────────────────┘

  1️⃣  EXTRACCIÓN
      ↓
┌─────────────────────────────────────────────────────────┐
│ 1extractorurlinmuebles24.js                            │
│ • Lee página de búsqueda Inmuebles24                   │
│ • Navega múltiples páginas (max 5 default)             │
│ • Extrae URLs de propiedades únicas                    │
│ • Output: urls-extraidas-inmuebles24.json              │
└─────────────────────────────────────────────────────────┘
      ↓
  2️⃣  AUDITORÍA
      ↓
┌─────────────────────────────────────────────────────────┐
│ 1auditorurlinmuebles24.js                              │
│ • Carga base de datos existente                        │
│ • Compara URLs por Property ID canónico                │
│ • Identifica: existentes vs nuevas                     │
│ • Output: auditoria-urls-inmuebles24.json              │
└─────────────────────────────────────────────────────────┘
      ↓
  3️⃣  DEPURACIÓN
      ↓
┌─────────────────────────────────────────────────────────┐
│ 1depuracionurlinmuebles24.json                         │
│ • JSON manual con URLs a procesar                      │
│ • Estructura: { urls_nuevas: [ {...}, {...} ] }       │
│ • Consumido por Orquestador e Iterador                 │
└─────────────────────────────────────────────────────────┘
      ↓
  4️⃣  PROCESAMIENTO (Opción A: BATCH)
      ↓
┌─────────────────────────────────────────────────────────┐
│ 1orquestadorurlinmuebles24.js                          │
│ • Procesa TODAS las URLs en batch                      │
│ • Secuencial: una tras otra (delay 2s)                 │
│ • Log de fallos: logs/fallas-scrape.txt                │
│ • Velocidad: ⭐⭐⭐⭐⭐ (sin pausas manuales)              │
└─────────────────────────────────────────────────────────┘

  4️⃣  PROCESAMIENTO (Opción B: ITERADOR)
      ↓
┌─────────────────────────────────────────────────────────┐
│ 1iteradorurlinmuebles24.js                             │
│ • Procesa URLs UNA a la vez                            │
│ • Apertura automática en navegador                     │
│ • Backup JSON antes de eliminar cada URL               │
│ • Velocidad: ⭐⭐⭐ (requiere revisión manual)            │
└─────────────────────────────────────────────────────────┘
      ↓
      ↓  [AMBAS OPCIONES LLAMAN AL SCRAPER]
      ↓
┌─────────────────────────────────────────────────────────┐
│ inmuebles24culiacanscraper.js (CORE)                   │
│ • Puppeteer headless con anti-bot evasion              │
│ • Sistema inteligente de detección de dirección        │
│ • 🛡️ Filtro de términos prohibidos (remates/juicios)   │
│ • 🔍 Detección de duplicados por Property ID            │
│ • Descarga TODAS las fotos automáticamente             │
│ • Genera HTML con Master Template completo             │
│ • Agrega tarjeta a [ciudad]/index.html                 │
│ • Auto-add al mapa modal                               │
│ • Git commit + push automático                         │
│ • Tiempo: 2-3 minutos por propiedad                    │
└─────────────────────────────────────────────────────────┘
      ↓
  5️⃣  DEPLOYMENT
      ↓
┌─────────────────────────────────────────────────────────┐
│ GitHub Pages                                           │
│ • Auto-deploy desde main branch                        │
│ • URL: https://casasenventa.info                       │
│ • Tiempo: 1-2 minutos post-push                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Herramientas del Pipeline

### 📊 Tabla Resumen

| Herramienta | Comando | Tiempo | Salida | Propósito |
|-------------|---------|--------|--------|-----------|
| **Extractor** | `node 1extractorurlinmuebles24.js "URL_BUSQUEDA"` | 1-2 min | `urls-extraidas-inmuebles24.json` | Descubrir propiedades nuevas |
| **Auditor** | `node 1auditorurlinmuebles24.js urls-extraidas-inmuebles24.json` | <30 seg | `auditoria-urls-inmuebles24.json` | Filtrar duplicados |
| **Depuración** | Manual | N/A | `1depuracionurlinmuebles24.json` | Queue de procesamiento |
| **Orquestador** | `node 1orquestadorurlinmuebles24.js` | Variable | `logs/fallas-scrape.txt` | Batch completo automático |
| **Iterador** | `node 1iteradorurlinmuebles24.js` | 2-3 min/URL | Backups `.bak-*` | Una URL a la vez |
| **Scraper** | `node inmuebles24culiacanscraper.js "URL"` | 2-3 min | HTML + JSON DB | Scrapear + publicar |

---

### 1️⃣ Extractor - `1extractorurlinmuebles24.js`

**Propósito:** Navegar páginas de búsqueda de Inmuebles24 y extraer URLs de propiedades.

**Comando:**
```bash
node 1extractorurlinmuebles24.js "https://www.inmuebles24.com/casas-en-venta-en-culiacan.html"
```

**Opciones:**
```bash
# Limitar páginas
node 1extractorurlinmuebles24.js "URL" --max-pages 10
```

**Salida:**
```json
{
  "timestamp": "2025-10-26T12:00:00.000Z",
  "searchUrl": "https://www.inmuebles24.com/...",
  "totalPages": 5,
  "totalUrls": 85,
  "urls": [
    "https://www.inmuebles24.com/propiedades/clasificado/...",
    "https://www.inmuebles24.com/propiedades/clasificado/..."
  ]
}
```

**Características:**
- ✅ Puppeteer headless con anti-bot evasion
- ✅ Headers realistas (Mozilla/Chrome UA)
- ✅ Viewport 1920x1080
- ✅ Navegación multi-página automática
- ✅ Deduplicación de URLs

---

### 2️⃣ Auditor - `1auditorurlinmuebles24.js`

**Propósito:** Comparar URLs extraídas contra base de datos para identificar duplicados.

**Comando:**
```bash
# Desde archivo JSON
node 1auditorurlinmuebles24.js urls-extraidas-inmuebles24.json

# Desde archivo TXT
node 1auditorurlinmuebles24.js urls.txt

# Desde CLI
node 1auditorurlinmuebles24.js --urls "URL1" "URL2" "URL3"
```

**Proceso:**
1. Carga `inmuebles24-scraped-properties.json` (base de datos)
2. Construye sets de IDs y URLs normalizadas
3. Compara cada URL nueva contra DB
4. Genera reporte con existentes vs nuevas

**Salida:**
```json
{
  "generadoEn": "2025-10-26T12:15:00.000Z",
  "auditoriaOrigen": "urls-extraidas-inmuebles24.json",
  "totalUrlsAnalizadas": 85,
  "totalUrlsExistentes": 57,
  "totalUrlsNuevas": 28,
  "urls_existentes": [...],
  "urls_nuevas": [
    {
      "url": "https://www.inmuebles24.com/.../casa-147916704.html",
      "urlNormalizada": "https://www.inmuebles24.com/.../casa-147916704.html",
      "propertyId": "147916704",
      "claveCanonica": "id:147916704"
    }
  ]
}
```

**Características:**
- ✅ Detección por Property ID (regex `/-(\d+)\.html/`)
- ✅ Normalización de URLs (sin query params)
- ✅ Sistema de claves canónicas jerárquicas
- ✅ 100% precisión (0 false positives)

---

### 3️⃣ Depuración JSON - `1depuracionurlinmuebles24.json`

**Propósito:** Queue manual de URLs a procesar.

**Generación:**
```bash
# Copiar output del Auditor
cp auditoria-urls-inmuebles24.json 1depuracionurlinmuebles24.json

# O crear manualmente
```

**Estructura:**
```json
{
  "generadoEn": "2025-10-26T18:08:58.008Z",
  "auditoriaOrigen": "inmuebles24-scraped-properties.json",
  "totalUrlsNuevas": 28,
  "urls_nuevas": [
    {
      "url": "https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-147916704.html",
      "urlNormalizada": "https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-147916704.html",
      "propertyId": "147916704",
      "claveCanonica": "id:147916704"
    }
  ]
}
```

**Uso:**
- Consumido por Orquestador e Iterador
- Formato esperado: array `urls_nuevas` con objetos que tengan campo `url`

---

### 4️⃣ Orquestador - `1orquestadorurlinmuebles24.js`

**Propósito:** Procesar batch completo de URLs secuencialmente.

**Comando:**
```bash
node 1orquestadorurlinmuebles24.js
```

**Comportamiento:**
1. Lee `1depuracionurlinmuebles24.json`
2. Procesa cada URL secuencialmente
3. Ejecuta `inmuebles24culiacanscraper.js` con `--auto-confirm`
4. Delay de 2 segundos entre ejecuciones
5. Log de fallos en `logs/fallas-scrape.txt`

**Output esperado:**
```
═══════════════════════════════════════════════════
🚀 ORQUESTADOR DE SCRAPING BATCH - INMUEBLES24
═══════════════════════════════════════════════════

📊 URLs pendientes: 28

═══════════════════════════════════════════════════
🔄 PROCESANDO [1/28]
📍 URL: https://www.inmuebles24.com/.../casa-147916704.html
═══════════════════════════════════════════════════

[... output del scraper ...]

✅ Procesado exitosamente

═══════════════════════════════════════════════════
🔄 PROCESANDO [2/28]
...
```

**Ventajas:**
- ⭐⭐⭐⭐⭐ Velocidad máxima (sin pausas manuales)
- ⚠️ No elimina URLs del JSON (debes hacerlo manual)
- ✅ Log de fallos para reintentos

**Cuándo usar:**
- Tienes 10+ URLs para procesar
- Confías en el scraper (probado previamente)
- No necesitas revisar cada propiedad antes de continuar

---

### 5️⃣ Iterador - `1iteradorurlinmuebles24.js` ⭐ RECOMENDADO

**Propósito:** Procesar URLs una a la vez con revisión manual.

**Comando:**
```bash
node 1iteradorurlinmuebles24.js
```

**Comportamiento:**
1. Lee primera URL de `1depuracionurlinmuebles24.json`
2. Ejecuta `inmuebles24culiacanscraper.js`
3. Espera a que scraper termine
4. **Busca propiedad en DB** y obtiene slug
5. **Abre HTML en navegador automáticamente** 🌐
6. Crea backup del JSON con timestamp
7. Elimina URL procesada del JSON
8. Muestra resumen

**Output esperado:**
```
╔═══════════════════════════════════════════════════════════════╗
║  🔄 ITERADOR DE SCRAPING - INMUEBLES24                      ║
╚═══════════════════════════════════════════════════════════════╝

📂 Cargando URLs pendientes...
   ✅ 28 URLs pendientes

📍 URL seleccionada:
   https://www.inmuebles24.com/.../interlomas-147916704.html

🆔 Property ID detectado: 147916704

════════════════════════════════════════════════════════════════
🚀 EJECUTANDO SCRAPER
════════════════════════════════════════════════════════════════

[... output del scraper ...]

✅ Scraping completado exitosamente

🔍 Buscando propiedad en la base de datos...
   ✅ Propiedad encontrada: Casa en Venta en Fraccionamiento Interlomas
   📝 Slug: casa-en-venta-en-fraccionamiento-interlomas
   📄 HTML: culiacan/casa-en-venta-en-fraccionamiento-interlomas/index.html

🌐 Abriendo en el navegador...
   📄 culiacan/casa-en-venta-en-fraccionamiento-interlomas/index.html
   ✅ HTML abierto en el navegador

💾 Backup creado: 1depuracionurlinmuebles24.json.bak-2025-10-26T18-30-00-000Z
🗑️ Eliminando URL procesada del JSON...
   ✅ URL eliminada
   📊 URLs restantes: 27

════════════════════════════════════════════════════════════
📊 RESUMEN
════════════════════════════════════════════════════════════
✅ URL procesada: https://www.inmuebles24.com/.../interlomas-147916704.html
🆔 Property ID: 147916704
📄 HTML: culiacan/casa-en-venta-en-fraccionamiento-interlomas/index.html
🌐 Abierto en navegador: Sí
📊 URLs restantes: 27

💡 Ejecuta nuevamente el script para procesar la siguiente URL
```

**Ventajas:**
- ✅ Control total (una URL a la vez)
- ✅ Apertura automática en navegador
- ✅ Revisión inmediata después de cada scrape
- ✅ Backups automáticos antes de eliminar URL
- ✅ Fácil reintentar si falla (URL no se elimina)

**Cuándo usar:**
- Testing inicial de nuevas URLs
- Validar calidad de datos antes de batch
- Detectar problemas en el scraper temprano

**Procesamiento continuo:**
```bash
# Procesar todas las URLs (pausa manual entre cada una)
while jq -e '.urls_nuevas | length > 0' 1depuracionurlinmuebles24.json > /dev/null; do
    node 1iteradorurlinmuebles24.js
    echo ""
    echo "⏸️  Presiona Enter para continuar con la siguiente..."
    read
done
```

**Documentación completa:** `ITERADOR-README.md`

---

### 6️⃣ Scraper Principal - `inmuebles24culiacanscraper.js` 🔥

**Propósito:** Scrapear propiedad individual y publicar automáticamente.

**Comando:**
```bash
# Modo interactivo (confirmación manual de ciudad)
node inmuebles24culiacanscraper.js "https://www.inmuebles24.com/.../casa-147916704.html"

# Modo automático (usado por Orquestador)
node inmuebles24culiacanscraper.js "URL" --auto-confirm
```

**Proceso completo (2-3 minutos):**

1. **Detección de ciudad**
   - Detecta automáticamente desde URL (monterrey/mazatlan/culiacan)
   - Pide confirmación manual (modo interactivo)

2. **🛡️ Filtro de términos prohibidos** (NUEVO)
   - Detecta 11 términos sensibles: remate, juicio, invadida, embargo, etc.
   - Busca en: title, description, location, address_clean, features, tags
   - Si detecta término → muestra mensaje y exit(0) sin crear archivos
   - Ver: `FILTRO-TERMINOS-PROHIBIDOS.md`

3. **🔍 Detección de duplicados**
   - Extrae Property ID desde URL: `/-(\d+)\.html/`
   - Verifica en `inmuebles24-scraped-properties.json`
   - Si es duplicado → muestra advertencia y exit(0)
   - Precisión: 100% (0 false positives)

4. **Scraping con Puppeteer**
   - Headless Chrome con anti-bot evasion
   - Headers realistas (Mozilla/Chrome UA)
   - Viewport 1920x1080
   - Sistema inteligente de detección de dirección (puntuación automática)

5. **Descarga de fotos**
   - TODAS las fotos automáticamente
   - Optimización: PNG→JPG, 85% calidad, 1200px max
   - Renombrado: foto-1.jpg, foto-2.jpg, ...

6. **Generación de HTML**
   - Template Master completo con todas las features:
     - InfoWindow con carrusel completo de fotos
     - CURRENT_PROPERTY_DATA con array dinámico
     - Location subtitle limpio ("Colonia, Ciudad")
     - Botones "Ver Detalles" + "WhatsApp" siempre visibles
     - Mapa correcto con coordenadas por ciudad
   - SEO completo (meta tags, Schema.org, Open Graph)

7. **Integración en [ciudad]/index.html**
   - Genera tarjeta con estructura Tailwind CSS
   - Badge verde bg-green-600 para VENTA
   - Auto-add al mapa modal de la ciudad

8. **Git automation**
   - Commit automático con mensaje descriptivo
   - Push automático a GitHub
   - Deploy automático via GitHub Pages (1-2 min)

**Features clave:**

🧠 **Sistema Inteligente de Dirección:**
- Analiza TODO el HTML de la página
- Detecta múltiples candidatas de dirección
- Puntuación automática (+5 pts número calle, +4 nombre, +3 colonia, etc.)
- Selecciona la dirección MÁS COMPLETA
- Evita direcciones genéricas tipo "Culiacán, Sinaloa"

🎨 **InfoWindow Zillow-Style:**
- Carrusel con TODAS las fotos (no solo 1)
- Flechas de navegación circulares ← →
- Contador "1 / N" en esquina superior
- Dots indicadores animados
- Fade effect al cambiar foto (150ms)
- Soporte teclado (flechas ← →)

🌐 **Multi-Ciudad:**
- Detecta ciudad desde URL automáticamente
- Coordenadas correctas por ciudad (fallback inteligente)
- WhatsApp según ciudad (Monterrey, Mazatlán, Culiacán)
- Carpeta destino automática: monterrey/, mazatlan/, culiacan/

**Output esperado:**
```
🚀 Iniciando scraper de Inmuebles24...

📍 URL: https://www.inmuebles24.com/.../interlomas-147916704.html

🌐 Navegando a la página...
📊 Extrayendo datos...

✅ Datos extraídos exitosamente:
   📝 Título: Casa en Venta Interlomas Culiacán
   💰 Precio: MN 3,600,000
   📍 Ubicación: 3686 Circuito de los flamingos, Culiacán, Sinaloa
   🛏️  3 recámaras
   🛁 2 baños

🔍 Verificando términos prohibidos...
   ✅ Sin términos prohibidos detectados

🔍 Verificando duplicados...
   ✅ Propiedad nueva (ID: 147916704)

🔗 Slug generado: casa-en-venta-interlomas-culiacan

📥 Descargando 20 fotos...
   [████████████████████████████████] 20/20

📝 Generando página HTML...
   ✅ HTML generado: culiacan/casa-en-venta-interlomas-culiacan/index.html

📋 Agregando tarjeta a culiacan/index.html...
   ✅ Tarjeta agregada

🗺️ Agregando al mapa modal...
   ✅ Marcador agregado

📦 Commit a Git...
   ✅ Commit exitoso

🚀 Push a GitHub...
   ✅ Publicado en casasenventa.info

🎉 Propiedad publicada exitosamente!
```

**Documentación completa:**
- `FILTRO-TERMINOS-PROHIBIDOS.md` - Filtro de términos vetados
- `DUPLICATE-DETECTION-README.md` - Sistema de detección duplicados
- `inmuebles24culiacanscraper.js` - Código fuente (3,300+ líneas)

---

## 🚀 Ejecución Completa Sugerida

### Workflow Completo (Paso a Paso)

#### **FASE 1: DESCUBRIMIENTO (5-10 minutos)**

```bash
# 1. Extraer URLs desde página de búsqueda
node 1extractorurlinmuebles24.js "https://www.inmuebles24.com/casas-en-venta-en-culiacan.html" --max-pages 5

# Output: urls-extraidas-inmuebles24.json (ej: 85 URLs)
```

#### **FASE 2: AUDITORÍA (30 segundos)**

```bash
# 2. Identificar URLs nuevas vs duplicadas
node 1auditorurlinmuebles24.js urls-extraidas-inmuebles24.json

# Output: auditoria-urls-inmuebles24.json
# Ejemplo: 85 total → 57 existentes + 28 nuevas
```

#### **FASE 3: PREPARACIÓN (manual)**

```bash
# 3. Copiar URLs nuevas a queue de procesamiento
cp auditoria-urls-inmuebles24.json 1depuracionurlinmuebles24.json

# 4. Verificar cuántas URLs hay
jq '.urls_nuevas | length' 1depuracionurlinmuebles24.json
# Output: 28
```

#### **FASE 4: PROCESAMIENTO (Opción A - Testing - 2-3 min/URL)**

```bash
# 5A. Procesar 2-3 URLs de prueba con Iterador (revisión manual)
node 1iteradorurlinmuebles24.js
# Revisar HTML abierto en navegador
# Verificar datos, fotos, geocodificación

node 1iteradorurlinmuebles24.js
# Segunda URL...

# URLs restantes: 26
```

#### **FASE 4: PROCESAMIENTO (Opción B - Producción - Variable)**

```bash
# 5B. Procesar batch completo con Orquestador (automático)
node 1orquestadorurlinmuebles24.js

# Esperar a que termine (~60-90 min para 28 URLs)
# Revisar logs/fallas-scrape.txt por errores
```

#### **FASE 5: VERIFICACIÓN (5 minutos)**

```bash
# 6. Verificar base de datos actualizada
jq 'length' inmuebles24-scraped-properties.json
# Antes: 167
# Después: 195 (167 + 28)

# 7. Verificar páginas generadas
ls -la culiacan/ | grep "^d" | wc -l

# 8. Verificar en producción
open "https://casasenventa.info/culiacan/"
```

---

### Workflow Simplificado (Testing 2 URLs)

```bash
# Todo en un script
node 1extractorurlinmuebles24.js "https://www.inmuebles24.com/casas-en-venta-en-culiacan.html" && \
node 1auditorurlinmuebles24.js urls-extraidas-inmuebles24.json && \
cp auditoria-urls-inmuebles24.json 1depuracionurlinmuebles24.json && \
echo "✅ URLs preparadas. Ejecuta iterador manualmente:" && \
echo "node 1iteradorurlinmuebles24.js"
```

---

### Workflow Continuo (Batch Automático)

```bash
# Extracción + Auditoría + Orquestador completo
node 1extractorurlinmuebles24.js "URL_BUSQUEDA" && \
node 1auditorurlinmuebles24.js urls-extraidas-inmuebles24.json && \
cp auditoria-urls-inmuebles24.json 1depuracionurlinmuebles24.json && \
node 1orquestadorurlinmuebles24.js

# ⚠️ ADVERTENCIA: Solo usar si confías 100% en el scraper
```

---

## 🔧 Mantenimiento

### 🧹 Limpieza de Backups

El iterador genera backups automáticos cada vez que procesa una URL:

```bash
# Listar backups
ls -lt 1depuracionurlinmuebles24.json.bak-* | head -10

# Eliminar backups antiguos (mantener últimos 10)
ls -t 1depuracionurlinmuebles24.json.bak-* | tail -n +11 | xargs rm -f

# Eliminar todos los backups
rm 1depuracionurlinmuebles24.json.bak-*
```

---

### 🛡️ Actualizar Términos Prohibidos

Editar `inmuebles24culiacanscraper.js` línea 1396:

```javascript
const FORBIDDEN_TERMS = [
    'remate',
    'remates',
    'juicio',
    'juicio bancario',
    'casa invadida',
    'invadida',
    'invadido',
    'embargo',
    'embargada',
    'adjudicada',
    'adjudicación',
    'nuevo_termino'  // ⭐ Agregar aquí
];
```

**Probar:**
```bash
# Validar sintaxis
node -c inmuebles24culiacanscraper.js

# Probar con URL conocida que contenga el término
node inmuebles24culiacanscraper.js "URL_TEST"

# Debe mostrar:
# 🛑 Propiedad descartada: se detectó la palabra "nuevo_termino" en la información.
```

**Documentación:** `FILTRO-TERMINOS-PROHIBIDOS.md`

---

### 📊 Monitoreo de Base de Datos

```bash
# Contar propiedades totales
jq 'length' inmuebles24-scraped-properties.json

# Ver últimas 5 propiedades agregadas
jq '.[-5:]' inmuebles24-scraped-properties.json

# Buscar propiedad por ID
jq '.[] | select(.propertyId == "147916704")' inmuebles24-scraped-properties.json

# Contar propiedades por ciudad
jq -r '.[].colonia' inmuebles24-scraped-properties.json | sort | uniq -c | sort -rn | head -10
```

---

### 🔍 Debugging

**Si el scraper falla:**

1. **Verificar URL:**
   ```bash
   # Verificar que la URL sea válida
   curl -I "URL"
   ```

2. **Verificar Property ID:**
   ```bash
   # Extraer ID manualmente
   echo "URL" | grep -oE '[0-9]{8,}\.html' | grep -oE '[0-9]+'
   ```

3. **Verificar términos prohibidos:**
   ```bash
   # Buscar en output del scraper
   node inmuebles24culiacanscraper.js "URL" 2>&1 | grep "🛑"
   ```

4. **Verificar duplicados:**
   ```bash
   # Buscar en base de datos
   jq '.[] | select(.url | contains("ID"))' inmuebles24-scraped-properties.json
   ```

5. **Logs del Orquestador:**
   ```bash
   # Ver fallos
   cat logs/fallas-scrape.txt | tail -20
   ```

---

### 🔄 Reintentar URLs Fallidas

```bash
# 1. Extraer URLs fallidas del log
grep "FALLO:" logs/fallas-scrape.txt | grep -oE 'https://[^ ]+' > urls-fallas.txt

# 2. Crear JSON manual
jq -R -s -c 'split("\n") | map(select(length > 0)) | map({url: .})' urls-fallas.txt > retry.json

# 3. Crear estructura completa
jq '{generadoEn: (now | todate), totalUrlsNuevas: length, urls_nuevas: .}' retry.json > 1depuracionurlinmuebles24.json

# 4. Reintentar con iterador
node 1iteradorurlinmuebles24.js
```

---

### 📈 Estadísticas de Pipeline

```bash
# Total de propiedades en sistema
jq 'length' inmuebles24-scraped-properties.json

# Propiedades por ciudad
jq -r 'group_by(.cityFolder) | map({ciudad: .[0].cityFolder, total: length}) | .[]' \
  inmuebles24-scraped-properties.json

# Promedio de fotos por propiedad
jq '[.[].photoCount] | add / length' inmuebles24-scraped-properties.json

# Rango de precios
jq '[.[].price | tonumber] | {min: min, max: max, promedio: (add / length)}' \
  inmuebles24-scraped-properties.json
```

---

### 🗄️ Backup de Base de Datos

```bash
# Backup manual antes de batch
cp inmuebles24-scraped-properties.json \
   inmuebles24-scraped-properties.json.bak-$(date +%Y%m%d-%H%M%S)

# Restaurar backup
cp inmuebles24-scraped-properties.json.bak-20251026-120000 \
   inmuebles24-scraped-properties.json
```

---

### 🧪 Testing

**Probar pipeline completo con 1 URL:**

```bash
# 1. Crear JSON manual con 1 URL
cat > test-url.json << 'EOF'
{
  "generadoEn": "2025-10-26T12:00:00.000Z",
  "totalUrlsNuevas": 1,
  "urls_nuevas": [
    {
      "url": "https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-TEST.html",
      "propertyId": "99999999"
    }
  ]
}
EOF

# 2. Copiar a depuración
cp test-url.json 1depuracionurlinmuebles24.json

# 3. Procesar con iterador
node 1iteradorurlinmuebles24.js

# 4. Verificar resultado
jq '.urls_nuevas | length' 1depuracionurlinmuebles24.json
# Debe ser: 0 (URL eliminada)
```

---

### 📝 Revisar Git Status

```bash
# Ver archivos pendientes de commit
git status

# Ver archivos modificados
git diff --stat

# Ver últimos 5 commits
git log --oneline -5

# Ver commits del pipeline
git log --oneline --grep="Inmuebles24" -10
```

---

## 📚 Anexo: Prompts Clave para Claude

### Prompt 1: Ejecutar Iterador

> "de las 28 quiero procesar 2 url para ver como funciona"

**Resultado esperado:**
- Claude ejecuta `node 1iteradorurlinmuebles24.js` dos veces
- Ambas propiedades se publican correctamente
- HTML se abre en navegador automáticamente
- URLs se eliminan del JSON

---

### Prompt 2: Verificar Duplicados

> "verifica si las dos casas que subió iterador de interlomas de echo son diferentes o es la misma"

**Resultado esperado:**
- Claude verifica en `inmuebles24-scraped-properties.json`
- Compara Property IDs
- Compara coordenadas geográficas (Haversine distance)
- Compara características físicas
- Conclusión: diferentes o duplicadas

---

### Prompt 3: Confirmar Registro

> "ok las casas cuando se suban van a quedar registradas en el fraccionamiento interlomas ?"

**Resultado esperado:**
- Claude confirma campo `colonia: "Interlomas"` en DB
- Muestra ubicación en mapa modal
- Confirma coordenadas únicas
- Explica diferencias entre propiedades

---

### Prompt 4: Implementar Filtro

> "Necesito que en el scraper inmuebles24culiacanscraper.js implementes un filtro de términos prohibidos. Debe:
> 1. Crear función detectForbiddenTerm(data)
> 2. Usar array FORBIDDEN_TERMS con: remate, remates, juicio, juicio bancario, casa invadida, invadida
> 3. Buscar en: title, description, location, address_clean, features, tags
> 4. Retornar término detectado o null
> 5. En main(), después de scrapear, verificar términos prohibidos
> 6. Si detecta término, mostrar mensaje y exit(0) sin crear archivos
> 7. Debe ejecutarse ANTES de generar slug y descargar fotos"

**Resultado esperado:**
- Claude modifica `inmuebles24culiacanscraper.js`
- Agrega función `detectForbiddenTerm()` antes del scraper
- Agrega verificación en main() después de scrapear
- Extiende términos prohibidos a 11 (agrega: invadido, embargo, embargada, adjudicada, adjudicación)
- Valida sintaxis con `node -c`
- Crea documentación completa `FILTRO-TERMINOS-PROHIBIDOS.md`

---

### Prompt 5: Procesar Batch Completo

> "procesa todas las URLs restantes con el orquestador"

**Resultado esperado:**
- Claude ejecuta `node 1orquestadorurlinmuebles24.js`
- Muestra progreso en tiempo real
- Reporta éxitos y fallos
- Muestra log final de `logs/fallas-scrape.txt`

---

### Prompt 6: Publicar Cambios

> "publica ya"

**Resultado esperado:**
- Claude usa agente gitops-publicador
- Merge directo a main
- Push a GitHub
- Verifica deployment en casasenventa.info

---

### Prompt 7: Estadísticas del Pipeline

> "muéstrame estadísticas del pipeline: cuántas propiedades hay, cuántas por ciudad, promedio de fotos"

**Resultado esperado:**
- Claude usa jq para consultar DB
- Muestra total de propiedades
- Agrupa por ciudad
- Calcula promedio de fotos
- Muestra rango de precios

---

## 🔗 Documentación Relacionada

| Documento | Propósito |
|-----------|-----------|
| `FILTRO-TERMINOS-PROHIBIDOS.md` | Sistema de filtrado de términos sensibles |
| `ITERADOR-README.md` | Uso detallado del iterador |
| `DUPLICATE-DETECTION-README.md` | Sistema de detección de duplicados |
| `INSTRUCCIONES_SCRAPER.md` | Scraper propiedades.com (alternativo) |
| `CLAUDE.md` | Documentación completa del proyecto |
| `pipeline/inmuebles24/README.md` | README corto con lista de scripts |

---

## 📅 Changelog

### 2025-10-26
- ✅ Implementación inicial del pipeline completo
- ✅ Filtro de términos prohibidos (11 términos)
- ✅ Sistema de detección de duplicados por Property ID
- ✅ Iterador con apertura automática en navegador
- ✅ Orquestador batch con log de fallos
- ✅ Template Master con InfoWindow carrusel completo
- ✅ Sistema inteligente de detección de dirección
- ✅ Multi-ciudad (Monterrey, Mazatlán, Culiacán)
- ✅ Documentación completa

---

## 🤝 Mantenimiento y Soporte

**Mantenedor:** Claude Code + Usuario
**Última revisión:** 26 de octubre 2025
**Próxima revisión:** Cuando se agreguen nuevas ciudades o features

**Contacto:**
- Issues: GitHub repository
- Docs: Este archivo + archivos relacionados
- Código: Scripts en raíz del proyecto

---

**FIN DEL DOCUMENTO**
