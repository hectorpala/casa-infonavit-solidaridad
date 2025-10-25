# Pipeline de Scraping y Publicación Inmuebles24 Culiacán

**Sistema automatizado de extracción, procesamiento y publicación de propiedades inmobiliarias desde Inmuebles24 a casasenventa.info**

---

## 📋 Descripción

El **Pipeline Inmuebles24 Culiacán** es un sistema completo que automatiza el proceso de:
1. Extraer URLs de propiedades recientes desde las páginas de búsqueda de Inmuebles24
2. Scrapear datos, fotos y ubicación de cada propiedad
3. Geocodificar direcciones con sistema de 5 niveles de fallback
4. Generar páginas HTML individuales con mapas interactivos
5. Integrar al sitio principal (tarjetas + marcadores en mapa)
6. Publicar automáticamente a GitHub Pages

**Estado actual:** Procesando ~30 propiedades nuevas cada ejecución con detección automática de duplicados.

---

## 🛠️ Scripts Principales

### 1. **Extractor de URLs**
**Script:** `extraer-urls-recientes-culiacan.js`

**Función:**
- Extrae URLs de propiedades publicadas hace ≤20 días desde Inmuebles24
- Navega páginas de búsqueda con Puppeteer
- Filtra por antigüedad y ubicación (Culiacán)

**Outputs:**
- `urls-propiedades-recientes-culiacan.txt` - Lista de URLs (texto plano)
- `propiedades-recientes-culiacan.json` - URLs con metadata (días publicado, título, etc.)

**Uso:**
```bash
node extraer-urls-recientes-culiacan.js
```

---

### 2. **Procesador Batch**
**Script:** `scrapear-batch-urls.js`

**Función:**
- Lee archivo de URLs (`urls-propiedades-recientes-culiacan.txt`)
- Procesa múltiples propiedades en paralelo
- Llama a `inmuebles24culiacanscraper.js` para cada URL

**Flags clave:**
- `--check-only` - Solo verifica qué propiedades son nuevas (no scrapea)
- `--concurrency N` - Número de workers concurrentes (default: 3)
- `--test N` - Limita a las primeras N URLs (útil para pruebas)

**Ejemplos:**
```bash
# Verificar duplicados sin scrapear
node scrapear-batch-urls.js --check-only

# Procesar 30 URLs con 3 workers
node scrapear-batch-urls.js --concurrency 3 --test 30

# Procesar TODAS las URLs del archivo
node scrapear-batch-urls.js --concurrency 5
```

**Logs:**
- Genera archivo de log en `/tmp/batch-test-N.log`
- Muestra progreso en tiempo real con estadísticas

---

### 3. **Scraper de Propiedades**
**Script:** `inmuebles24culiacanscraper.js`

**Función:**
- Scrapea datos completos de una propiedad individual
- Descarga todas las fotos
- Geocodifica la dirección (ver sección Geocoding)
- Genera página HTML desde master template
- Integra tarjeta + marcador en `culiacan/index.html`
- Registra en base de datos JSON

**Proceso interno:**
1. Extrae Property ID para detección de duplicados
2. Verifica en `inmuebles24-scraped-properties.json`
3. Si es duplicado → ⚠️ Advertencia y exit
4. Si es nueva → Continúa con scraping completo
5. Descarga fotos a `culiacan/[slug]/images/`
6. Geocodifica con sistema de 5 niveles
7. Genera HTML personalizado
8. Agrega a base de datos con timestamp

**Uso directo:**
```bash
node inmuebles24culiacanscraper.js "https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-147711585.html"
```

**Detección de duplicados:**
- Usa Property ID único extraído de la URL
- 100% de precisión (0 falsos positivos)
- Ver `DUPLICATE-DETECTION-README.md` para detalles

---

### 4. **Sistema de Geocodificación**

#### 4.1 `geo-address-normalizer.js`
**Función:**
- Limpia direcciones scrapeadas (elimina ruido)
- Normaliza abreviaturas (Fracc., Col., Av., etc.)
- Extrae componentes (calle, número, colonia, ciudad)

**Mejoras recientes (Oct 2025):**
- Elimina prefijos: "Casa en", "Departamento de", "Fracc."
- Normalización de acentos automática
- Matching parcial: "Rosales" → "Antonio Rosales"

**Ejemplo:**
```
Input:  "Casa en Fraccionamiento Terranova, Culiacán, Sinaloa"
Output: "Terranova, Culiacán, Sinaloa"
```

#### 4.2 `geo-geocoder-culiacan.js`
**Función:**
- Geocodificador principal con sistema de 5 niveles de fallback
- Busca colonias en gazetteer local
- Matching: exacto → parcial → fuzzy

**5 Niveles de fallback:**
1. **Coordenadas embebidas** de Inmuebles24 (si hay calle completa)
2. **Centroide del gazetteer** (si la colonia tiene centroide definido)
3. **Google Maps API** (si hay API key configurada)
4. **Centroide de ciudad** (24.8091, -107.394)
5. **Default Culiacán**

**Resultado:**
```javascript
{
  coordinates: { lat: 24.7610, lng: -107.4340 },
  colonia: "Antonio Rosales",
  precision: "neighborhood",
  confidence: 0.85,
  source: "gazetteer-centroid-real"
}
```

#### 4.3 `geo-gazetteer-culiacan.js`
**Función:**
- Base de datos local de colonias y fraccionamientos de Culiacán
- 631 entradas totales (224 colonias + 407 fraccionamientos)
- Índices por: slug, nombre, código postal

**Archivos de datos:**
- `culiacan_colonias.json` - Lista completa (631 entradas)
- `data/colonias_centroides.json` - Top 50 colonias con coordenadas exactas

**Búsquedas:**
- `findBySlug()` - Búsqueda exacta por slug normalizado
- `findByName()` - Búsqueda exacta por nombre
- `findFuzzy()` - Matching fuzzy con Levenshtein distance

**Documentación completa:** `GEOCODER-FIXES-SUMMARY.md`

---

### 5. **Bases de Datos JSON**

#### 5.1 `inmuebles24-scraped-properties.json`
**Propósito:** Base de datos principal de propiedades scrapeadas

**Estructura:**
```json
{
  "propertyId": "147711585",
  "title": "Casa en Venta Antonio Rosales",
  "slug": "casa-en-venta-antonio-rosales",
  "url": "https://www.inmuebles24.com/...",
  "price": "$1,500,000",
  "bedrooms": 3,
  "bathrooms": 2,
  "constructionArea": 150,
  "landArea": 200,
  "location": "Antonio Rosales, Culiacán, Sinaloa",
  "lat": 24.7610,
  "lng": -107.4340,
  "colonia": "Antonio Rosales",
  "locationPrecision": "neighborhood",
  "locationSource": "gazetteer-centroid-real",
  "photoCount": 18,
  "scrapedAt": "2025-10-24T15:30:00.000Z",
  "city": "culiacan",
  "published": true
}
```

**Uso:**
- Detección de duplicados (por Property ID)
- Historial de scraping
- Inventario completo de propiedades

**Ubicación:** Root del repositorio

#### 5.2 `property-history.json`
**Propósito:** Historial de operaciones por propiedad

**Estructura:**
```json
{
  "147711585": {
    "propertyId": "147711585",
    "title": "Casa en Venta Antonio Rosales",
    "url": "https://www.inmuebles24.com/...",
    "operations": [
      {
        "timestamp": "2025-10-24T15:30:00.000Z",
        "operation": "scraped",
        "details": {
          "photoCount": 18,
          "geocoded": true,
          "published": true
        }
      }
    ],
    "lastUpdated": "2025-10-24T15:30:00.000Z"
  }
}
```

**Operaciones trackeadas:**
- `scraped` - Primera vez scrapeada
- `updated` - Datos actualizados (re-scraping)
- `published` - Publicada a producción
- `unpublished` - Removida del sitio

**Ubicación:** Root del repositorio

---

### 6. **Automatización Diaria**
**Script:** `daily-scraping.sh`

**Función:**
- Script bash para ejecución diaria automática
- Ejecuta pipeline completo: extracción → batch → publicación

**Proceso:**
```bash
#!/bin/bash
# 1. Extraer URLs recientes
node extraer-urls-recientes-culiacan.js

# 2. Procesar en batch (todas las URLs)
node scrapear-batch-urls.js --concurrency 3

# 3. Commit y push automático
git add .
git commit -m "Daily scraping: $(date)"
git push origin main
```

**Configuración cron (ejemplo):**
```bash
# Ejecutar todos los días a las 2:00 AM
0 2 * * * cd /path/to/repo && ./daily-scraping.sh >> /tmp/daily-scraping.log 2>&1
```

**Logs:**
- Output en `/tmp/daily-scraping.log`
- Ver últimas 80 líneas: `./daily-scraping.sh 2>&1 | head -80`

---

## 🔄 Flujo Completo de 6 Pasos

### **PASO 1: Extracción de URLs** 📋
```
Script: extraer-urls-recientes-culiacan.js
Input:  Páginas de búsqueda de Inmuebles24
Output: urls-propiedades-recientes-culiacan.txt
        propiedades-recientes-culiacan.json
```

### **PASO 2: Procesamiento Batch** 🔧
```
Script: scrapear-batch-urls.js --concurrency 3 --test 30
Input:  urls-propiedades-recientes-culiacan.txt
Output: Llama a inmuebles24culiacanscraper.js para cada URL
```

### **PASO 3: Scraping Individual** 🏠
```
Script: inmuebles24culiacanscraper.js (por cada URL)

Proceso:
├─ Scraping de datos (título, precio, descripción, características)
├─ Descarga de fotos → culiacan/[slug]/images/
├─ Geocodificación:
│  ├─ geo-address-normalizer.js → Limpia dirección
│  ├─ geo-geocoder-culiacan.js  → Busca coordenadas
│  └─ geo-gazetteer-culiacan.js → Base de datos de colonias
├─ Generación HTML → culiacan/[slug]/index.html
├─ Integración al sitio:
│  ├─ Tarjeta en culiacan/index.html
│  └─ Marcador en mapa modal
└─ Registro en JSONs:
   ├─ inmuebles24-scraped-properties.json
   └─ property-history.json
```

### **PASO 4: Revisión Local** 👀
```
Comando: open culiacan/[slug]/index.html

Verificar:
✓ Fotos cargan correctamente
✓ Información completa y precisa
✓ Mapa con coordenadas correctas
✓ Calculadora hipotecaria funciona
✓ Botones WhatsApp/Compartir funcionan
```

### **PASO 5: Publicación** 🚀
```
Comando usuario: "publica ya"
Script: gitops-publicador (agente automático)

Proceso:
├─ git add culiacan/[slug]/ culiacan/index.html *.json
├─ git commit -m "Add: Casa en Venta [Título] $XXX,XXX"
├─ git push origin main
└─ GitHub Pages deploy (1-2 minutos)
```

### **PASO 6: Verificación en Producción** ✅
```
URL: https://casasenventa.info/culiacan/[slug]/

Verificar:
✓ Página accesible públicamente
✓ Fotos se muestran correctamente
✓ Mapa funciona con coordenadas
✓ Aparece en culiacan/index.html (tarjeta)
✓ Aparece en mapa modal al hacer clic
```

---

## 📊 JSON Involucrados en el Pipeline

### Durante Extracción (Paso 1):
- **Output:** `propiedades-recientes-culiacan.json` - URLs con metadata temporal

### Durante Scraping (Paso 3):
- **Input:** `culiacan_colonias.json` - Gazetteer de colonias
- **Input:** `data/colonias_centroides.json` - Coordenadas de colonias
- **Update:** `inmuebles24-scraped-properties.json` - Agrega nueva propiedad
- **Update:** `property-history.json` - Registra operación de scraping

### Durante Publicación (Paso 5):
- **Commit:** Todos los JSON actualizados se publican junto con el HTML

### Verificación de Duplicados:
- **Check:** `inmuebles24-scraped-properties.json` - Verifica Property ID antes de scrapear

---

## 📝 Anotaciones Rápidas

### **Requisitos**

#### Proxies y OxyLabs:
- **OxyLabs Residential Proxies** requerido para evitar bloqueos
- Configuración en `.env`:
  ```
  OXYLABS_USERNAME=tu_usuario
  OXYLABS_PASSWORD=tu_password
  ```
- Documentación: `OXYLABS-SETUP.md`

#### Autenticación Inmuebles24:
- Requiere login manual antes de scrapear
- Script: `/login` (guarda cookies de sesión)
- Cookies válidas por 7 días

#### Otros:
- Node.js v16+
- Puppeteer instalado
- Git configurado con credenciales de GitHub

---

### **Ubicación de Outputs**

#### Archivos de URLs:
- `urls-propiedades-recientes-culiacan.txt` - Lista de URLs (Root)
- `propiedades-recientes-culiacan.json` - URLs con metadata (Root)

#### Bases de Datos JSON:
- `inmuebles24-scraped-properties.json` - Inventario principal (Root)
- `property-history.json` - Historial de operaciones (Root)
- `complete-properties-database.json` - Inventario completo (referencia)

#### HTML y Fotos Generados:
- `culiacan/[slug]/index.html` - Página individual
- `culiacan/[slug]/images/foto-1.jpg` ... `foto-N.jpg` - Fotos descargadas

#### Logs:
- `/tmp/batch-test-N.log` - Logs de batch processing
- `/tmp/daily-scraping.log` - Logs de ejecución diaria
- Console output durante ejecución

---

### **Nombre Oficial del Sistema**

**"Pipeline de Scraping y Publicación Inmuebles24 Culiacán"**

**Alias comunes:**
- Pipeline Inmuebles24
- Sistema de scraping Culiacán
- Inmuebles24 Culiacán Pipeline

---

## 📚 Documentación Relacionada

- `DUPLICATE-DETECTION-README.md` - Sistema de detección de duplicados
- `GEOCODER-FIXES-SUMMARY.md` - Correcciones del geocoder (Oct 2025)
- `OXYLABS-SETUP.md` - Configuración de proxies
- `CLAUDE.md` - Documentación general del proyecto

---

## 🎯 Estadísticas Actuales

- **Propiedades totales:** 167 publicadas en casasenventa.info
  - 🟢 120 en VENTA
  - 🟠 47 en RENTA
- **Propiedades trackeadas:** 37 con IDs de Inmuebles24
- **Colonias en gazetteer:** 631 (224 colonias + 407 fraccionamientos)
- **Tasa de éxito geocoding:** ~95% (con matching parcial)
- **Tiempo promedio por propiedad:** 30-60 segundos

---

## 🔧 Mantenimiento

### Actualizar gazetteer de colonias:
```bash
# Editar culiacan_colonias.json para agregar nuevas colonias
# Agregar centroides en data/colonias_centroides.json si se tienen coordenadas
```

### Limpiar duplicados:
```bash
node scrapear-batch-urls.js --check-only
# Revisa cuáles son duplicados sin scrapear
```

### Re-scrapear propiedades con errores:
```bash
# Editar URLs problemáticas en un archivo temporal
node scrapear-batch-urls.js --concurrency 1 --test 5
```

---

## 📞 Soporte

**Problemas comunes:**

1. **OxyLabs bloqueado:** Verificar créditos y rotación de IPs
2. **Sesión expirada:** Ejecutar `/login` nuevamente
3. **Geocoding fallando:** Verificar gazetteer actualizado
4. **Duplicados:** Revisar `inmuebles24-scraped-properties.json`

**Logs útiles:**
```bash
# Ver últimas ejecuciones del batch
tail -200 /tmp/batch-test-30.log

# Ver errores de geocoding
grep "❌" /tmp/batch-test-30.log
```

---

**Última actualización:** Octubre 2025
**Versión del pipeline:** 2.0 (con matching parcial y detección de duplicados)
