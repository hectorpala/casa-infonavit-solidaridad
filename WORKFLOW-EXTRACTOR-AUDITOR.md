# 🔄 Workflow: Extractor → Auditor → Scraper

Pipeline completo para extracción, auditoría y scraping de propiedades de Inmuebles24.

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Paso 1: Extractor de URLs](#paso-1-extractor-de-urls)
3. [Paso 2: Auditor de URLs](#paso-2-auditor-de-urls)
4. [Paso 3: Scraper Masivo](#paso-3-scraper-masivo)
5. [Histórico y Análisis](#histórico-y-análisis)
6. [Casos de Uso](#casos-de-uso)

---

## 🎯 Visión General

### Arquitectura del Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  PASO 1: EXTRACTOR                                              │
│  ─────────────────────                                          │
│  Input:  URL de búsqueda Inmuebles24                            │
│  Output: urls-inmuebles24-YYYY-MM-DD-HH-MM-SS-valid.txt         │
│          urls-inmuebles24-YYYY-MM-DD-HH-MM-SS.json              │
│                                                                  │
│  • Extrae URLs de múltiples páginas                             │
│  • Verifica HTTP (HEAD requests)                                │
│  • Separa válidas/bloqueadas/removidas                          │
│  • Genera metadata (timestamp, criterio, stats)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASO 2: AUDITOR                                                │
│  ─────────────────────                                          │
│  Input:  urls-inmuebles24-...-valid.txt                         │
│  Output: audit-YYYY-MM-DD-HH-MM-SS-nuevas.txt                   │
│          audit-YYYY-MM-DD-HH-MM-SS.json                         │
│          audit-history.csv (acumulativo)                        │
│                                                                  │
│  • Detecta duplicados vs base de datos                          │
│  • Re-verifica URLs tumbadas (opcional)                         │
│  • Auto-descarta URLs obsoletas (opcional)                      │
│  • Genera histórico CSV de corridas                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASO 3: SCRAPER MASIVO                                         │
│  ─────────────────────────                                      │
│  Input:  audit-...-nuevas.txt                                   │
│  Output: Propiedades publicadas en casasenventa.info            │
│          inmuebles24-scraped-properties.json (actualizado)      │
│                                                                  │
│  • Scrapea solo URLs nuevas y válidas                           │
│  • Descarga fotos, genera HTML, publica GitHub                  │
│  • Actualiza base de datos de duplicados                        │
│  • Actualiza CRM de vendedores                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Ventajas del Pipeline

✅ **Trazabilidad completa** - Cada paso genera archivos con timestamp
✅ **Evita duplicados** - Auditor detecta propiedades ya scrapeadas
✅ **Detecta URLs obsoletas** - Verifica HTTP antes de scrapear
✅ **Histórico acumulativo** - CSV con todas las corridas
✅ **Optimización de recursos** - Solo scrapea URLs nuevas y válidas
✅ **Análisis de rendimiento** - Métricas de cada corrida

---

## 🔍 Paso 1: Extractor de URLs

### Comando

```bash
node 1extractorurlinmuebles24.js "URL_BUSQUEDA" [--max-pages N]
```

### Ejemplo

```bash
# Extraer 5 páginas de casas en venta en Culiacán
node 1extractorurlinmuebles24.js \
  "https://www.inmuebles24.com/casas-en-venta-en-culiacan.html" \
  --max-pages 5
```

### Salida Generada

```
urls-inmuebles24-2025-10-26-16-35-21.json         (metadata completa)
urls-inmuebles24-2025-10-26-16-35-21-valid.txt    (URLs usables)
urls-inmuebles24-2025-10-26-16-35-21-removed.txt  (URLs removidas, si existen)
```

### Contenido JSON

```json
{
  "metadata": {
    "timestampISO": "2025-10-26T23:35:21.349Z",
    "timestampReadable": "26 de octubre de 2025, 04:35:21 p.m.",
    "searchCriteria": {
      "type": "Casas",
      "operation": "Venta",
      "city": "Culiacán",
      "priceRange": "$3,500,000 - $3,550,000",
      "fullUrl": "https://www.inmuebles24.com/..."
    },
    "pagesProcessed": 5
  },
  "statistics": {
    "totalExtracted": 150,
    "validUrls": 10,
    "blockedUrls": 120,
    "totalUsableUrls": 130,
    "removedUrls": 15,
    "errorUrls": 5,
    "usablePercentage": "86.67%"
  },
  "urls": {
    "valid": [...],
    "blocked": [...],
    "removed": [...],
    "errors": [...]
  }
}
```

### Interpretación de Resultados

- **valid**: URLs con HTTP 200-399 (verificadas como activas)
- **blocked**: URLs con HTTP 403 (Cloudflare, probablemente válidas)
- **removed**: URLs que redirigen al home (propiedades removidas)
- **errors**: URLs con errores de red o timeout

**Nota:** URLs bloqueadas se incluyen en `-valid.txt` porque son probablemente válidas (el scraper completo las manejará).

---

## 📊 Paso 2: Auditor de URLs

### Comandos

```bash
# Básico (verifica HTTP y detecta duplicados)
node auditor-urls-inmuebles24.js urls-inmuebles24-...-valid.txt

# Auto-descartar URLs tumbadas
node auditor-urls-inmuebles24.js urls-inmuebles24-...-valid.txt --auto-discard

# Omitir verificación HTTP (más rápido)
node auditor-urls-inmuebles24.js urls-inmuebles24-...-valid.txt --skip-http-check
```

### Ejemplo

```bash
node auditor-urls-inmuebles24.js \
  urls-inmuebles24-2025-10-26-16-35-21-valid.txt \
  --auto-discard
```

### Salida Generada

```
audit-2025-10-26-16-41-36.json         (resultados detallados)
audit-2025-10-26-16-41-36-nuevas.txt   (URLs listas para scrapear)
audit-history.csv                       (histórico acumulativo)
```

### Output Console

```
╔═══════════════════════════════════════════════════════════════╗
║  📊 AUDITOR DE URLs - INMUEBLES24                            ║
╚═══════════════════════════════════════════════════════════════╝

📁 Archivo de entrada: urls-inmuebles24-2025-10-26-16-35-21-valid.txt
⚙️  Auto-descartar URLs tumbadas: SÍ
⚙️  Verificación HTTP: ACTIVA

📊 URLs cargadas: 130

📚 Cargando base de datos de propiedades scrapeadas...
   ✅ 234 propiedades en base de datos

🔍 Clasificando URLs...
   ✅ URLs nuevas: 85
   ⚠️  URLs duplicadas: 45

╔═══════════════════════════════════════════════════════════════╗
║  🔍 VERIFICACIÓN HTTP DE URLs                                ║
╚═══════════════════════════════════════════════════════════════╝

📊 Verificando 85 URLs...

   ⏳ Progreso: 85/85 URLs verificadas...

📊 RESULTADOS VERIFICACIÓN HTTP:
   ✅ URLs OK: 12
   🔒 URLs bloqueadas (Cloudflare): 68
   ❌ URLs tumbadas (404/redirect): 5
   ⚠️  Errores de red: 0

🗑️  AUTO-DESCARTE ACTIVADO...
   ❌ URLs descartadas: 5

╔═══════════════════════════════════════════════════════════════╗
║  📊 RESUMEN DE AUDITORÍA                                     ║
╚═══════════════════════════════════════════════════════════════╝

📊 CLASIFICACIÓN FINAL:
   🆕 URLs nuevas usables: 80
   ❌ URLs nuevas tumbadas: 0
   ⚠️  URLs duplicadas: 45
   🗑️  URLs auto-descartadas: 5

💾 Resultados JSON: audit-2025-10-26-16-41-36.json
💾 URLs nuevas usables: audit-2025-10-26-16-41-36-nuevas.txt
💾 CSV histórico actualizado: audit-history.csv
```

### Contenido JSON

```json
{
  "metadata": {
    "timestampISO": "2025-10-26T23:41:36.411Z",
    "timestampReadable": "26 de octubre de 2025, 04:41:36 p.m.",
    "inputFile": "urls-inmuebles24-2025-10-26-16-35-21-valid.txt",
    "autoDiscard": true,
    "skipHttpCheck": false,
    "durationSeconds": 18.5
  },
  "statistics": {
    "totalUrls": 130,
    "nuevas": 80,
    "nuevasUsables": 80,
    "nuevasTumbadas": 0,
    "duplicadas": 45,
    "autoDescartadas": 5
  },
  "urls": {
    "nuevas": [
      {
        "url": "https://www.inmuebles24.com/propiedades/...",
        "propertyId": "147696056",
        "httpStatus": "blocked",
        "httpStatusCode": 403,
        "isTaken": false
      }
    ],
    "duplicadas": [
      {
        "url": "https://www.inmuebles24.com/propiedades/...",
        "propertyId": "147916704",
        "duplicateInfo": {
          "propertyId": "147916704",
          "title": "Casa en Venta en Fraccionamiento Interlomas",
          "slug": "casa-en-venta-en-fraccionamiento-interlomas",
          "price": "MN 3,600,000",
          "publishedDate": "Publicado hace 10 días",
          "url": "https://www.inmuebles24.com/...",
          "lat": 24.8392706,
          "lng": -107.4116021,
          "scrapedAt": "2025-10-26T22:16:10.644Z"
        }
      }
    ],
    "descartadas": [...]
  }
}
```

### CSV Histórico

Archivo: `audit-history.csv`

```csv
timestamp,inputFile,totalUrls,nuevas,nuevasUsables,nuevasTumbadas,duplicadas,autoDescartadas,durationSeconds,autoDiscard,skipHttpCheck
2025-10-26T23:35:00.000Z,urls-inmuebles24-...-valid.txt,130,85,80,5,45,5,18.5,true,false
2025-10-27T10:15:00.000Z,urls-inmuebles24-...-valid.txt,95,60,58,2,35,2,12.3,true,false
2025-10-27T14:22:00.000Z,urls-inmuebles24-...-valid.txt,110,70,68,2,40,2,15.1,true,false
```

**Uso del CSV:**
- Análisis de tendencias (duplicados crecientes = saturación)
- Métricas de rendimiento (durationSeconds por URL)
- Validación de corridas (totalUrls != nuevas + duplicadas = error)

---

## 🤖 Paso 3: Scraper Masivo

### Opción 1: Iterador Manual

```bash
# Leer archivo línea por línea y scrapear
while IFS= read -r url; do
  echo ""
  node inmuebles24culiacanscraper.js "$url"
done < audit-2025-10-26-16-41-36-nuevas.txt
```

### Opción 2: Script Automatizado (Recomendado)

Crear `scraper-batch.sh`:

```bash
#!/bin/bash

# Configuración
INPUT_FILE="$1"
MAX_URLS="${2:-10}"

if [ -z "$INPUT_FILE" ]; then
  echo "Uso: ./scraper-batch.sh <archivo-urls> [max-urls]"
  exit 1
fi

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🤖 SCRAPER BATCH - INMUEBLES24                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📁 Archivo: $INPUT_FILE"
echo "📊 Límite: $MAX_URLS URLs"
echo ""

count=0
while IFS= read -r url && [ $count -lt $MAX_URLS ]; do
  count=$((count + 1))
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "  PROCESANDO URL $count/$MAX_URLS"
  echo "════════════════════════════════════════════════════════════════"
  echo ""

  echo "" | node inmuebles24culiacanscraper.js "$url"

  # Esperar 5 segundos entre propiedades
  if [ $count -lt $MAX_URLS ]; then
    echo ""
    echo "⏳ Esperando 5 segundos antes de la siguiente..."
    sleep 5
  fi
done < "$INPUT_FILE"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ BATCH COMPLETADO                                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Total procesadas: $count URLs"
echo ""
```

Uso:

```bash
chmod +x scraper-batch.sh
./scraper-batch.sh audit-2025-10-26-16-41-36-nuevas.txt 20
```

---

## 📈 Histórico y Análisis

### Consultar CSV Histórico

```bash
# Ver todas las corridas
cat audit-history.csv

# Estadísticas básicas
echo "Total corridas:"
tail -n +2 audit-history.csv | wc -l

echo "URLs procesadas totales:"
tail -n +2 audit-history.csv | cut -d',' -f3 | awk '{sum+=$1} END {print sum}'

echo "Duplicados promedio:"
tail -n +2 audit-history.csv | cut -d',' -f7 | awk '{sum+=$1; count++} END {print sum/count}'
```

### Análisis Avanzado (Python)

```python
import pandas as pd

# Cargar histórico
df = pd.read_csv('audit-history.csv')

# Convertir timestamp
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Métricas
print("Resumen por corrida:")
print(df[['timestamp', 'totalUrls', 'nuevas', 'duplicadas']].to_string())

# Tasa de duplicados
df['tasa_duplicados'] = (df['duplicadas'] / df['totalUrls']) * 100
print(f"\nTasa de duplicados promedio: {df['tasa_duplicados'].mean():.2f}%")

# URLs por segundo
df['urls_por_segundo'] = df['totalUrls'] / df['durationSeconds']
print(f"\nVelocidad promedio: {df['urls_por_segundo'].mean():.2f} URLs/seg")
```

---

## 💡 Casos de Uso

### Caso 1: Scraping Diario Automatizado

```bash
#!/bin/bash
# daily-scraping.sh

DATE=$(date +%Y-%m-%d)
LOG_FILE="logs/scraping-$DATE.log"

echo "🚀 Inicio scraping diario: $DATE" | tee -a $LOG_FILE

# 1. Extraer URLs (5 páginas)
echo "📥 Extrayendo URLs..." | tee -a $LOG_FILE
node 1extractorurlinmuebles24.js \
  "https://www.inmuebles24.com/casas-en-venta-en-culiacan.html" \
  --max-pages 5 >> $LOG_FILE 2>&1

# 2. Auditar y auto-descartar
URLS_FILE=$(ls -t urls-inmuebles24-*.txt | head -1)
echo "🔍 Auditando: $URLS_FILE" | tee -a $LOG_FILE
node auditor-urls-inmuebles24.js $URLS_FILE --auto-discard >> $LOG_FILE 2>&1

# 3. Scrapear (máximo 20 nuevas)
AUDIT_FILE=$(ls -t audit-*-nuevas.txt | head -1)
echo "🤖 Scrapeando: $AUDIT_FILE" | tee -a $LOG_FILE
./scraper-batch.sh $AUDIT_FILE 20 >> $LOG_FILE 2>&1

echo "✅ Scraping diario completado: $DATE" | tee -a $LOG_FILE
```

### Caso 2: Scraping por Rango de Precio

```bash
# Extraer casas de $3M - $4M
node 1extractorurlinmuebles24.js \
  "https://www.inmuebles24.com/casas-en-venta-en-culiacan-de-3000000-a-4000000-pesos.html" \
  --max-pages 10

# Auditar sin HTTP check (más rápido)
node auditor-urls-inmuebles24.js \
  urls-inmuebles24-2025-10-26-18-00-00-valid.txt \
  --skip-http-check

# Scrapear todas las nuevas
./scraper-batch.sh audit-2025-10-26-18-01-00-nuevas.txt 999
```

### Caso 3: Análisis de Saturación

```bash
# Verificar si ya scrapeamos la mayoría de un rango
node 1extractorurlinmuebles24.js \
  "https://www.inmuebles24.com/casas-en-venta-en-culiacan-de-3500000-a-3550000-pesos.html" \
  --max-pages 5

node auditor-urls-inmuebles24.js \
  urls-inmuebles24-2025-10-26-19-00-00-valid.txt

# Si duplicadas > 80%, ese rango está saturado
```

---

## 🔧 Troubleshooting

### Problema: Muchas URLs bloqueadas (403)

**Causa:** Cloudflare bloqueando HEAD requests del auditor
**Solución:** Usar `--skip-http-check` en auditor (el scraper las manejará)

```bash
node auditor-urls-inmuebles24.js urls-...-valid.txt --skip-http-check
```

### Problema: CSV histórico corrupto

**Causa:** Interrupción durante escritura
**Solución:** Regenerar desde JSONs individuales

```bash
# Backup
cp audit-history.csv audit-history.csv.backup

# Recrear
echo "timestamp,inputFile,totalUrls,nuevas,nuevasUsables,nuevasTumbadas,duplicadas,autoDescartadas,durationSeconds,autoDiscard,skipHttpCheck" > audit-history.csv

# Agregar datos desde JSONs
for f in audit-*.json; do
  # Extraer y agregar fila (script personalizado)
  node extract-json-to-csv.js $f >> audit-history.csv
done
```

### Problema: Alta tasa de duplicados

**Causa:** Ya scrapeamos la mayoría de propiedades en ese rango
**Solución:** Cambiar criterio de búsqueda o ampliar rango de precio

---

## 📚 Referencias

- **Extractor:** `1extractorurlinmuebles24.js`
- **Auditor:** `auditor-urls-inmuebles24.js`
- **Scraper:** `inmuebles24culiacanscraper.js`
- **Base de datos:** `inmuebles24-scraped-properties.json`

---

## ✅ Checklist Workflow Completo

- [ ] Ejecutar extractor con URL de búsqueda
- [ ] Verificar stats en JSON generado (usablePercentage > 50%)
- [ ] Ejecutar auditor con archivo `-valid.txt`
- [ ] Revisar CSV histórico (tasa de duplicados < 80%)
- [ ] Ejecutar scraper batch con archivo `-nuevas.txt`
- [ ] Verificar propiedades publicadas en casasenventa.info
- [ ] Backup de audit-history.csv (semanal)

---

**Última actualización:** 26 de octubre de 2025
**Versión:** 1.0
