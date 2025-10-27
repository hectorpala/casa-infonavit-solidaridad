# 🔍 PRE-FLIGHT CHECK - VERIFICACIÓN PREVIA AL SCRAPING

Sistema de verificación HTTP ligera para detectar URLs inválidas antes de lanzar el scraper pesado.

---

## 🎯 Objetivo

Evitar gastar tiempo y recursos en URLs que sabemos que fallarán:
- **Ahorro de tiempo:** 3 minutos por URL fallida (timeout del scraper)
- **Ahorro de recursos:** No lanzar Puppeteer innecesariamente
- **Mejor logging:** Registro detallado de URLs saltadas con razón específica

---

## 🔍 Funcionamiento

### **1. Verificación HTTP Ligera (8 segundos)**

Antes de lanzar el scraper completo, el orquestador hace un `GET` request simple:

```javascript
await axios.get(url, {
    maxRedirects: 5,
    timeout: 8000, // 8 segundos (vs 3 minutos del scraper)
    headers: {
        'User-Agent': 'Mozilla/5.0...',
        'Accept': 'text/html...'
    }
});
```

### **2. Detección de Problemas**

El pre-flight check detecta:

#### ❌ **URL Inválida (SE SALTA)**

**Redirección al Home:**
```
URL original:  https://www.inmuebles24.com/propiedades/clasificado/casa-123.html
URL final:     https://www.inmuebles24.com/

Razón: redirects_to_home
Detalles: "Redirige a https://www.inmuebles24.com/"
```

**Redirección a Búsqueda:**
```
URL original:  https://www.inmuebles24.com/propiedades/clasificado/casa-456.html
URL final:     https://www.inmuebles24.com/venta/casas/culiacan/

Razón: redirects_to_home
Detalles: "Redirige a https://www.inmuebles24.com/venta/casas/culiacan/"
```

**404 Not Found:**
```
Status Code: 404
Razón: 404_not_found
Detalles: "Propiedad no encontrada (404)"
```

**Propiedad Removida (en HTML):**
```
HTML contiene: "Propiedad no encontrada"
HTML contiene: "La publicación que buscás no está disponible"

Razón: 404_not_found
Detalles: "Propiedad no encontrada (404)"
```

#### ✅ **URL Válida (CONTINÚA AL SCRAPER)**

**403 Cloudflare (bloqueado, pero temporal):**
```
Status Code: 403
Razón: cloudflare_403
Detalles: "Bloqueado por Cloudflare (403) - se intentará con scraper"

Acción: Permitir reintento con Puppeteer (más robusto)
```

**5xx Error del Servidor:**
```
Status Code: 500, 502, 503
Razón: server_error_5xx
Detalles: "Error del servidor (500) - se intentará con scraper"

Acción: Permitir reintento (puede ser temporal)
```

**Error de Red/Timeout:**
```
Error: ECONNREFUSED, ETIMEDOUT, etc.
Razón: network_error
Detalles: [Mensaje del error]

Acción: Permitir reintento con scraper más robusto
```

**200 OK (válida):**
```
Status Code: 200
Razón: ok
Detalles: "URL válida"

Acción: Proceder con scraping normal
```

---

## 📝 Logging de URLs Saltadas

### **Archivo de Log**

```
orchestrator-skipped.log
```

Cada URL saltada genera una línea en el log:

```
TIMESTAMP                    | PROPERTY_ID | REASON              | DETAILS                                    | URL
2025-10-27T00:10:15.000Z     | 147696056   | redirects_to_home   | Redirige a https://inmuebles24.com/       | https://www.inmuebles24.com/propiedades/...
2025-10-27T00:10:18.500Z     | 147661732   | 404_not_found       | Propiedad no encontrada (404)             | https://www.inmuebles24.com/propiedades/...
2025-10-27T00:10:22.800Z     | 147708671   | redirects_to_home   | Redirige a https://inmuebles24.com/venta/ | https://www.inmuebles24.com/propiedades/...
```

### **Formato del Log**

```
ISO_TIMESTAMP | PROPERTY_ID | SKIP_REASON | DETAILS | FULL_URL
```

**Campos:**
- `ISO_TIMESTAMP`: Fecha/hora en formato ISO 8601
- `PROPERTY_ID`: ID único de la propiedad
- `SKIP_REASON`: Razón por la cual se saltó (ver tabla abajo)
- `DETAILS`: Descripción detallada
- `FULL_URL`: URL completa

---

## 📊 Razones de Salto (Skip Reasons)

| Razón | Descripción | Acción |
|-------|-------------|--------|
| `redirects_to_home` | Redirige al home o página de búsqueda | ❌ Saltar (propiedad removida) |
| `404_not_found` | HTTP 404 o mensaje "no encontrada" | ❌ Saltar (propiedad no existe) |
| `cloudflare_403` | Bloqueado por Cloudflare | ✅ Continuar (temporal) |
| `server_error_5xx` | Error del servidor (500-599) | ✅ Continuar (temporal) |
| `network_error` | Error de red o timeout | ✅ Continuar (temporal) |
| `ok` | URL válida | ✅ Continuar (normal) |

---

## 📈 Reporte del Orquestador

El reporte final incluye estadísticas de URLs saltadas:

```json
{
  "summary": {
    "totalUrls": 50,
    "successful": 40,
    "failed": 5,
    "skipped": 5,
    "successRate": "80.00%",
    "totalRetries": 8,
    "avgDuration": "2m 30s",
    "avgDurationNonSkipped": "3m 15s",
    "timeSaved": "15m 0s"
  },
  "results": [
    {
      "propertyId": "147696056",
      "url": "https://...",
      "status": "skipped",
      "attempts": 0,
      "duration": "2s",
      "error": "Redirige a https://www.inmuebles24.com/",
      "skipReason": "redirects_to_home",
      "timestamp": "2025-10-27T00:10:15.000Z"
    }
  ]
}
```

### **Métricas de Tiempo Ahorrado**

```
Tiempo ahorrado = URLs_saltadas × SCRAPER_TIMEOUT

Ejemplo:
  5 URLs saltadas × 3 minutos = 15 minutos ahorrados
```

---

## 🚀 Uso

El pre-flight check está **activado automáticamente** en el orquestador:

```bash
# Procesar lote (pre-flight check automático)
node orchestrator.js

# Dry-run (simular pre-flight check)
node orchestrator.js --dry-run
```

### **Output del Pre-Flight Check**

```bash
╔═══════════════════════════════════════════════════════════════╗
║  📍 Procesando: 147696056                                    ║
╚═══════════════════════════════════════════════════════════════╝

🔗 URL: https://www.inmuebles24.com/propiedades/clasificado/...
🔍 Pre-flight check...
⏭️  SALTANDO: Redirige a https://www.inmuebles24.com/
📝 Registrado en: orchestrator-skipped.log
📦 Lote actualizado: mark-failed 147696056 "Pre-flight: Redirige a..."
```

```bash
╔═══════════════════════════════════════════════════════════════╗
║  📍 Procesando: 147661732                                    ║
╚═══════════════════════════════════════════════════════════════╝

🔗 URL: https://www.inmuebles24.com/propiedades/clasificado/...
🔍 Pre-flight check...
✅ Pre-flight OK (Bloqueado por Cloudflare (403) - se intentará con scraper)
🚀 Lanzando scraper...
```

---

## ⚙️ Configuración

### **Variables de Entorno (.env)**

```env
# Timeout del pre-flight check (default: 8000ms = 8 segundos)
PREFLIGHT_TIMEOUT=8000
```

### **Personalizar Timeout**

```bash
# Aumentar timeout para conexiones lentas
PREFLIGHT_TIMEOUT=15000 node orchestrator.js

# Reducir timeout para conexiones rápidas
PREFLIGHT_TIMEOUT=5000 node orchestrator.js
```

---

## 📊 Análisis del Log

### **Ver URLs Saltadas**

```bash
# Ver todo el log
cat orchestrator-skipped.log

# Últimas 10 URLs saltadas
tail -10 orchestrator-skipped.log

# Filtrar por razón específica
grep "redirects_to_home" orchestrator-skipped.log

# Filtrar por Property ID
grep "147696056" orchestrator-skipped.log

# Contar URLs saltadas por razón
awk -F'|' '{print $3}' orchestrator-skipped.log | sort | uniq -c
```

### **Ejemplo de Output**

```bash
$ awk -F'|' '{print $3}' orchestrator-skipped.log | sort | uniq -c

  12 redirects_to_home
   5 404_not_found
   2 network_error
```

### **Ver URLs Saltadas de Hoy**

```bash
grep "$(date +%Y-%m-%d)" orchestrator-skipped.log
```

---

## 🎯 Casos de Uso

### **Caso 1: Lote con Muchas URLs Removidas**

**Sin pre-flight check:**
```
50 URLs × 3 min timeout = 150 minutos (2.5 horas)
Resultado: 20 exitosas, 30 removidas (timeout)
```

**Con pre-flight check:**
```
50 URLs × 8s pre-flight = 6.6 minutos
30 URLs saltadas (pre-flight)
20 URLs × 3 min scraping = 60 minutos

Total: 66.6 minutos (1.1 horas)
Ahorro: 83.4 minutos (56% más rápido)
```

### **Caso 2: Lote con URLs Válidas**

**Sin pre-flight check:**
```
50 URLs × 3 min = 150 minutos
```

**Con pre-flight check:**
```
50 URLs × 8s pre-flight = 6.6 minutos
50 URLs × 3 min scraping = 150 minutos

Total: 156.6 minutos
Overhead: 6.6 minutos (4% más lento)
```

**Conclusión:** Vale la pena el overhead de 4% para evitar timeouts en lotes con URLs removidas.

---

## 🔧 Troubleshooting

### **Problema: Pre-flight siempre retorna 403**

**Causa:** Cloudflare está bloqueando todos los requests

**Solución:**
```bash
# Aumentar timeout para dar más tiempo a Cloudflare
PREFLIGHT_TIMEOUT=15000 node orchestrator.js

# O deshabilitar pre-flight temporalmente (no recomendado)
# Editar orchestrator.js y comentar la sección pre-flight
```

### **Problema: Pre-flight marca URLs válidas como removidas**

**Causa:** Falso positivo en detección de redirección

**Solución:**
```bash
# Revisar el log para ver la URL final
cat orchestrator-skipped.log | grep "PROPERTY_ID"

# Si es falso positivo, scrapear manualmente
node inmuebles24culiacanscraper.js "URL"

# Reportar el falso positivo para mejorar detección
```

### **Problema: El log crece demasiado**

**Solución:**
```bash
# Rotar el log mensualmente
mv orchestrator-skipped.log orchestrator-skipped-$(date +%Y-%m).log

# Limpiar logs viejos (>30 días)
find . -name "orchestrator-skipped-*.log" -mtime +30 -delete

# Comprimir logs viejos
gzip orchestrator-skipped-2025-*.log
```

---

## 📚 Integración con el Pipeline

El pre-flight check es parte integral del orquestador:

```
Extractor → Auditor → Lote Manager → Orquestador → [PRE-FLIGHT] → Scraper
                                           ↓
                                    ❌ Invalid → Skip
                                    ✅ Valid → Scrape
```

**Workflow:**
1. Orquestador lee URL del lote
2. **Pre-flight check** verifica URL (8s)
3. Si inválida: Saltar + Log + Actualizar lote
4. Si válida: Continuar con scraper (3 min)

---

## 🎉 Beneficios

✅ **Ahorro de tiempo:** 3 minutos por URL removida
✅ **Ahorro de recursos:** No lanzar Puppeteer innecesariamente
✅ **Mejor logging:** Razón específica de cada skip
✅ **Actualizaciones automáticas:** Lote-manager actualizado con razón
✅ **Reportes detallados:** Métricas de URLs saltadas y tiempo ahorrado
✅ **Overhead mínimo:** Solo 8 segundos por URL

---

## 📝 Notas Importantes

- El pre-flight check **NO reemplaza** al scraper completo
- Es una **optimización** para evitar casos obvios de fallo
- Errores temporales (403, 5xx, red) **permiten reintento** con scraper
- Solo URLs claramente removidas (redirect, 404) son **saltadas**

---

**Versión:** 1.0
**Última actualización:** Octubre 2025
**Mantenido por:** Hector Palazuelos + Claude
