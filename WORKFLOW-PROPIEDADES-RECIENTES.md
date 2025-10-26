# 🏠 Workflow: Scrapear Propiedades Recientes de Inmuebles24 Culiacán

## 📋 Descripción

Sistema de 2 pasos para identificar y scrapear propiedades de Inmuebles24 con menos de 20 días de antigüedad en Culiacán, Sinaloa.

---

## 🎯 Workflow Completo

### **PASO 1: Extraer URLs de Propiedades Recientes** 🔍

```bash
node extraer-urls-recientes-culiacan.js
```

**¿Qué hace este script?**
- ✅ Scrapea la página de listados de Inmuebles24 Culiacán
- ✅ Extrae **solo** URL + antigüedad de cada propiedad
- ✅ Filtra propiedades con ≤20 días
- ✅ Para automáticamente cuando encuentra propiedades viejas
- ✅ Guarda URLs en 2 archivos:
  - `urls-propiedades-recientes-culiacan.txt` (lista simple)
  - `propiedades-recientes-culiacan.json` (con metadatos)

**Tiempo estimado:** 2-3 minutos

**Output esperado:**
```
═══════════════════════════════════════════════════════════
🔍 EXTRACTOR DE URLs RECIENTES - INMUEBLES24 CULIACÁN
📅 Criterio: Propiedades con ≤20 días de antigüedad
📄 Páginas a scrapear: hasta 5
═══════════════════════════════════════════════════════════

🚀 Iniciando extracción...

────────────────────────────────────────────────────────────
📄 PÁGINA 1: https://www.inmuebles24.com/venta/sinaloa/culiacan/
────────────────────────────────────────────────────────────
⏳ Esperando 10 segundos para que JavaScript renderice...
   ✅ Encontradas 15 URLs en la página

   ✅ 2 días                  | Casa en Venta Barrio San Francisco
   ✅ 5 días                  | Casa en Venta Colinas San Miguel
   ✅ 8 días                  | Casa en Venta Privanzas del Valle
   ❌ 25 días (>20)           | Casa en Venta Guadalupe Victoria

   📊 Resumen página 1:
      ✅ Válidas: 12
      ❌ Muy viejas: 3
      ⚠️  Sin fecha: 0

═══════════════════════════════════════════════════════════
📊 RESUMEN FINAL
═══════════════════════════════════════════════════════════
   📄 Páginas scrapeadas: 2
   ✅ URLs válidas (≤20 días): 24
═══════════════════════════════════════════════════════════

💾 Guardadas 24 URLs en: urls-propiedades-recientes-culiacan.txt
💾 Guardado JSON detallado en: propiedades-recientes-culiacan.json

═══════════════════════════════════════════════════════════
✅ EXTRACCIÓN COMPLETADA
═══════════════════════════════════════════════════════════
   ⏱️  Tiempo total: 3.2 segundos
   📊 Total propiedades: 24

📁 Archivos generados:
   • urls-propiedades-recientes-culiacan.txt - Lista simple de URLs
   • propiedades-recientes-culiacan.json - Datos completos en JSON

🔄 SIGUIENTE PASO: Procesar URLs con el scraper completo
   node scrapear-batch-urls.js
═══════════════════════════════════════════════════════════
```

---

### **PASO 2: Procesar URLs con Scraper Completo** 🤖

#### **Opción A: Modo Testing (recomendado primero)** 🧪

```bash
node scrapear-batch-urls.js --test
```

**¿Qué hace?**
- ✅ Procesa solo las **primeras 3 URLs** del archivo
- ✅ Para cada URL, ejecuta el scraper completo:
  - Descarga fotos
  - Genera HTML
  - Agrega a culiacan/index.html
  - Hace commit y push
- ✅ Permite verificar que todo funciona antes de procesar todas

**Tiempo estimado:** 5-10 minutos (3 propiedades × 2-3 min c/u)

**Procesar N propiedades específicas:**
```bash
node scrapear-batch-urls.js --test 5    # Procesa las primeras 5
```

#### **Opción B: Procesar TODAS las URLs** 🚀

```bash
node scrapear-batch-urls.js
```

**¿Qué hace?**
- ✅ Procesa **todas las URLs** del archivo
- ✅ Con delay de 5 segundos entre cada propiedad
- ✅ Log detallado de éxitos/errores en `batch-scraping-log.txt`
- ✅ Resumen final con estadísticas

**Tiempo estimado:** Variable según cantidad (ej: 20 props × 2.5 min = 50 minutos)

**Output esperado:**
```
═══════════════════════════════════════════════════════════
🚀 BATCH PROCESSOR - INMUEBLES24 CULIACÁN
═══════════════════════════════════════════════════════════

📊 URLs encontradas: 24
📅 Fecha extracción: 2025-10-24
⏰ Criterio: ≤20 días

⚙️  Configuración:
   • Scraper: node inmuebles24culiacanscraper.js
   • Delay entre propiedades: 5s
   • Log file: batch-scraping-log.txt

🔄 Iniciando procesamiento...

═══════════════════════════════════════════════════════════
🏠 PROPIEDAD 1/24
🔗 https://www.inmuebles24.com/propiedades/clasificado/...
═══════════════════════════════════════════════════════════
⚙️  Ejecutando: echo "" | node inmuebles24culiacanscraper.js "..."

🚀 Iniciando scraper de Inmuebles24...
✅ Datos extraídos exitosamente
✅ Fotos descargadas: 18
✅ HTML generado
✅ Tarjeta agregada a culiacan/index.html
✅ Commit y push completados

✅ Completada en 2.3s

⏳ Esperando 5 segundos antes de la siguiente propiedad...

[...]

═══════════════════════════════════════════════════════════
✅ PROCESAMIENTO COMPLETADO
═══════════════════════════════════════════════════════════

📊 RESUMEN:
   • Total URLs: 24
   • Exitosas: 22
   • Errores: 2
   • Tiempo total: 52.5 minutos
   • Promedio: 131s por propiedad

📁 Log completo guardado en: batch-scraping-log.txt
═══════════════════════════════════════════════════════════
```

---

## 📁 Archivos Generados

### **Por el Extractor (Paso 1):**

1. **`urls-propiedades-recientes-culiacan.txt`**
   - Lista simple de URLs (una por línea)
   - Formato:
     ```
     https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-...
     https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-...
     ```

2. **`propiedades-recientes-culiacan.json`**
   - Datos completos en JSON
   - Formato:
     ```json
     {
       "fecha": "2025-10-24",
       "timestamp": "2025-10-24T20:15:30.123Z",
       "criterio": "≤20 días",
       "total": 24,
       "propiedades": [
         {
           "url": "https://...",
           "propertyId": "147711585",
           "title": "Casa en Venta...",
           "daysOld": 5,
           "ageText": "Publicado hace 5 días"
         }
       ]
     }
     ```

### **Por el Batch Processor (Paso 2):**

1. **`batch-scraping-log.txt`**
   - Log detallado de cada URL procesada
   - Formato:
     ```
     [2025-10-24T20:30:15.123Z] SUCCESS | 2.3s | https://...
     [2025-10-24T20:30:22.456Z] ERROR | 1.5s | https://... | Timeout
     ```

2. **Propiedades completas:**
   - HTML en `culiacan/[slug]/index.html`
   - Fotos en `culiacan/[slug]/images/`
   - Tarjeta en `culiacan/index.html`

---

## 🔧 Comandos Útiles

### Ver URLs extraídas:
```bash
cat urls-propiedades-recientes-culiacan.txt
```

### Contar cuántas URLs hay:
```bash
wc -l urls-propiedades-recientes-culiacan.txt
```

### Ver primeras 5 URLs:
```bash
head -5 urls-propiedades-recientes-culiacan.txt
```

### Ver log de procesamiento:
```bash
tail -f batch-scraping-log.txt
```

### Ver solo errores en log:
```bash
grep "ERROR" batch-scraping-log.txt
```

### Ayuda del batch processor:
```bash
node scrapear-batch-urls.js --help
```

---

## 🎛️ Configuración

### Cambiar criterio de días:
Edita `extraer-urls-recientes-culiacan.js`:
```javascript
this.maxDays = 30;  // Cambiar de 20 a 30 días
```

### Cambiar delay entre propiedades:
Edita `scrapear-batch-urls.js`:
```javascript
this.delayBetweenProps = 10000;  // 10 segundos en vez de 5
```

### Cambiar número de páginas a scrapear:
Al ejecutar el extractor, modifica el parámetro:
```bash
# En extraer-urls-recientes-culiacan.js línea 234:
await this.extractURLs(10);  // Scrapear 10 páginas en vez de 5
```

---

## ⚠️ Notas Importantes

1. **Bloqueo de Inmuebles24:**
   - El extractor puede fallar si Inmuebles24 bloquea el acceso automatizado
   - En ese caso, usa el approach manual (copiar URLs manualmente)

2. **Duplicados:**
   - El sistema de detección de duplicados está integrado en `inmuebles24culiacanscraper.js`
   - Las propiedades ya scrapeadas se detectan y se saltan automáticamente

3. **Timeout:**
   - Cada propiedad tiene un timeout de 2 minutos
   - Si una propiedad tarda más, se marca como error y continúa con la siguiente

4. **Confirmación de Ciudad:**
   - El batch processor confirma automáticamente Culiacán con `echo ""`
   - No necesitas intervención manual

---

## 🔄 Workflow Diario Recomendado

```bash
# 1. Extraer URLs recientes (cada mañana)
node extraer-urls-recientes-culiacan.js

# 2. Testing con 3 propiedades
node scrapear-batch-urls.js --test

# 3. Si funciona, procesar todas
node scrapear-batch-urls.js

# 4. Verificar resultado
tail -20 batch-scraping-log.txt

# 5. Ver en local
open culiacan/index.html

# 6. Publicar (ya hecho automáticamente por el scraper)
```

---

## 🆘 Solución de Problemas

### Problema: "Archivo no encontrado: urls-propiedades-recientes-culiacan.txt"
**Solución:** Primero ejecuta el extractor (Paso 1)

### Problema: Extractor no encuentra propiedades
**Solución:** Inmuebles24 puede estar bloqueando. Usa approach manual:
```bash
# Copiar URLs manualmente a un archivo
nano urls-propiedades-recientes-culiacan.txt
# Pegar URLs (una por línea)
# Guardar: Ctrl+X → Y → Enter
```

### Problema: Timeout al scrapear
**Solución:** Aumenta el timeout en `scrapear-batch-urls.js` línea 62:
```javascript
timeout: 180000  // 3 minutos en vez de 2
```

### Problema: Demasiados errores
**Solución:**
1. Verifica internet
2. Verifica que `inmuebles24culiacanscraper.js` funciona individualmente
3. Aumenta delay entre propiedades a 10 segundos

---

## 📊 Estadísticas Esperadas

**Para 20-25 propiedades recientes:**
- Extracción URLs: 2-3 minutos
- Procesamiento batch: 45-60 minutos
- Tasa de éxito: 85-95%
- Promedio por propiedad: 2-3 minutos

**Resultado final:**
- 20-25 propiedades nuevas en casasenventa.info
- Automáticamente publicadas en GitHub Pages
- Visibles en https://casasenventa.info/culiacan/

---

## ✅ Ventajas del Sistema

1. **Eficiente:** Solo scrapea propiedades recientes (≤20 días)
2. **Automático:** Batch processing sin intervención manual
3. **Robusto:** Manejo de errores + logs detallados
4. **Flexible:** Testing mode para validar antes de procesar todo
5. **Completo:** De URL a sitio publicado en un solo workflow

---

## 📝 Ejemplo Completo de Ejecución

```bash
# Día 1 - Octubre 24, 2025
$ node extraer-urls-recientes-culiacan.js
✅ Extracción completada: 24 URLs encontradas

$ node scrapear-batch-urls.js --test
✅ Testing completado: 3/3 propiedades exitosas

$ node scrapear-batch-urls.js
✅ Procesamiento completado: 22/24 exitosas, 2 errores

# Resultado:
# - 22 propiedades nuevas publicadas en casasenventa.info
# - Listas para ver en: https://casasenventa.info/culiacan/
```

---

**🎉 Sistema creado:** Octubre 24, 2025
**📍 Ciudad:** Culiacán, Sinaloa
**🏢 Fuente:** Inmuebles24.com
