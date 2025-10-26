# ✅ CHECKLIST - Automatización Completa del Scraping

## 🎯 Pre-requisitos

### 1. Configuración Inicial
- [ ] Node.js instalado (v14+)
- [ ] Repositorio clonado localmente
- [ ] Dependencias instaladas: `npm install`
- [ ] Git configurado con permisos de push

### 2. Archivos Necesarios
- [ ] `.env` existe y tiene la estructura correcta
- [ ] `daily-scraping.sh` es ejecutable (`chmod +x`)
- [ ] Todos los scripts Node.js están presentes:
  - [ ] `extraer-urls-stealth.js`
  - [ ] `scrapear-batch-urls.js`
  - [ ] `property-history.js`
  - [ ] `proxy-pool.js`
  - [ ] `inmuebles24culiacanscraper.js`

---

## 🔧 MODO MANUAL ($0/mes) - Sin Proxies

### Configuración
- [ ] Archivo `.env` existe (puede estar vacío o sin proxies)
- [ ] `urls-propiedades-recientes-culiacan.txt` creado

### Pasos de Verificación

#### 1. Preparar URLs Manualmente
```bash
nano urls-propiedades-recientes-culiacan.txt
# Pegar 2-3 URLs de prueba
# Guardar: Ctrl+X → Y → Enter
```

**Verificar:**
- [ ] Archivo contiene URLs válidas (una por línea)
- [ ] URLs comienzan con `https://www.inmuebles24.com/`

#### 2. Ejecutar Script Diario
```bash
./daily-scraping.sh
```

**Salida esperada:**
```
ℹ️  Modo MANUAL (Sin proxies configurados)
ℹ️  Para automatización completa, configura proxies en .env
ℹ️  PASO 1: Extrayendo URLs de propiedades
✅ Archivo de URLs encontrado: X URLs
ℹ️  PASO 2: Limpiando histórico antiguo
✅ Histórico limpio
ℹ️  PASO 3: Procesando URLs con batch processor
ℹ️  Concurrencia: 1 worker (modo MANUAL)
✅ Batch processing completado
📊 ESTADÍSTICAS FINALES
✅ SCRAPING DIARIO COMPLETADO
```

**Verificar:**
- [ ] Script detecta "Modo MANUAL"
- [ ] Concurrencia = 1 worker
- [ ] Batch processor termina exitosamente
- [ ] Log generado en `logs/daily-scraping-YYYYMMDD.log`
- [ ] `batch-scraping-log.txt` contiene resultados

#### 3. Revisar Resultados
```bash
# Ver estadísticas finales
cat logs/daily-scraping-$(date +%Y%m%d).log | grep -A 10 "ESTADÍSTICAS"

# Contar éxitos vs errores
echo "Éxitos: $(grep -c SUCCESS batch-scraping-log.txt)"
echo "Errores: $(grep -c ERROR batch-scraping-log.txt)"
```

**Verificar:**
- [ ] Total propiedades procesadas coincide con URLs
- [ ] Tasa de éxito > 80%
- [ ] Errores documentados claramente

#### 4. Validar Property History
```bash
node -e "
const PropertyHistory = require('./property-history');
const history = new PropertyHistory();
const stats = history.getStats();
console.log('Total:', stats.total);
console.log('Recientes (≤20d):', stats.recent20);
console.log('Scrapeadas:', stats.scraped);
"
```

**Verificar:**
- [ ] Propiedades agregadas al histórico
- [ ] Duplicados detectados correctamente
- [ ] Timestamps `firstSeen` y `lastSeen` actualizados

---

## 🚀 MODO AUTO ($49/mes) - Con Proxies

### Configuración ScraperAPI (Recomendado)

#### 1. Crear Cuenta
- [ ] Cuenta creada en https://www.scraperapi.com/signup
- [ ] Email verificado
- [ ] API Key copiada desde dashboard

#### 2. Configurar .env
```bash
nano .env
```

Agregar línea:
```
SCRAPERAPI_KEY=tu_api_key_de_50_caracteres
```

**Verificar:**
- [ ] API Key pegada completa (50+ caracteres)
- [ ] Sin espacios al inicio/final
- [ ] Línea descomentada (sin `#` al inicio)

**Validar configuración:**
```bash
grep SCRAPERAPI_KEY .env
# Debe mostrar: SCRAPERAPI_KEY=abc123...
```

#### 3. Verificar Detección de Modo
```bash
./daily-scraping.sh 2>&1 | head -10
```

**Salida esperada:**
```
ℹ️  Modo AUTO detectado (ScraperAPI configurado)
```

**Verificar:**
- [ ] Script detecta "Modo AUTO"
- [ ] No muestra advertencia de modo MANUAL

#### 4. Ejecutar Pipeline Completo
```bash
# Test rápido (sin ejecutar completo)
./daily-scraping.sh 2>&1 | head -50

# Ejecución completa (cuando estés listo)
./daily-scraping.sh
```

**Proceso esperado:**
1. ✅ **PASO 1**: Extractor ejecuta `extraer-urls-stealth.js`
   - Debe generar `urls-propiedades-recientes-culiacan.txt`
   - Contiene 20-40 URLs típicamente
2. ✅ **PASO 2**: Limpia histórico (>30 días)
3. ✅ **PASO 3**: Batch processor con **concurrency 3**
   - Muestra "[Worker 1]", "[Worker 2]", "[Worker 3]" en paralelo
4. ✅ **PASO 4**: Genera estadísticas finales

**Verificar:**
- [ ] Extractor no falla (usa proxies correctamente)
- [ ] Batch processor muestra 3 workers en paralelo
- [ ] Tiempo total < 30 min para 30-40 propiedades
- [ ] Log completo en `logs/daily-scraping-YYYYMMDD.log`

#### 5. Monitorear Uso de ScraperAPI
- [ ] Login en https://www.scraperapi.com/dashboard
- [ ] Verificar requests usados hoy
- [ ] Confirmar tasa de éxito > 95%
- [ ] Revisar costos del mes

**Plan Gratuito (1000 requests):**
- ~30-40 propiedades = 100-150 requests
- Plan gratuito dura ~6-7 ejecuciones diarias

**Plan Hobby ($49/mo, 100K requests):**
- ~3,000 propiedades/mes
- ~100 propiedades/día sin preocupaciones

---

## ⏰ AUTOMATIZACIÓN CON CRON

### 1. Preparar Entrada de Cron
```bash
# Obtener ruta absoluta del script
SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)/daily-scraping.sh"
echo $SCRIPT_PATH
```

### 2. Editar Crontab
```bash
crontab -e
```

**Agregar línea (ejecutar a las 7 AM diariamente):**
```cron
0 7 * * * /Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/daily-scraping.sh >> /tmp/daily-scraping-cron.log 2>&1
```

**⚠️ IMPORTANTE:** Reemplazar la ruta con tu `$SCRIPT_PATH` real.

**Otros horarios comunes:**
```cron
0 7 * * *     # 7:00 AM diario
0 12 * * *    # 12:00 PM diario
0 19 * * *    # 7:00 PM diario
0 7 * * 1     # 7:00 AM solo lunes
0 7 * * 1,4   # 7:00 AM lunes y jueves
```

### 3. Verificar Cron Configurado
```bash
crontab -l
```

**Verificar:**
- [ ] Línea agregada correctamente
- [ ] Ruta absoluta sin espacios problemáticos
- [ ] Output redirigido a `/tmp/daily-scraping-cron.log`

### 4. Probar Ejecución Manual (Simular Cron)
```bash
# Ejecutar como si fuera cron
/bin/sh -c "cd /path/to/landing\ casa\ solidaridad && ./daily-scraping.sh >> /tmp/test-cron.log 2>&1"

# Ver resultado
tail -50 /tmp/test-cron.log
```

**Verificar:**
- [ ] Script ejecuta correctamente desde cron context
- [ ] Sin errores de permisos
- [ ] Sin errores de rutas relativas

### 5. Monitorear Ejecuciones Diarias
```bash
# Ver log del cron más reciente
tail -100 /tmp/daily-scraping-cron.log

# Ver logs diarios del script
ls -lht logs/daily-scraping-*.log | head -5
cat logs/daily-scraping-$(date +%Y%m%d).log
```

**Verificar cada semana:**
- [ ] Cron ejecuta a la hora correcta
- [ ] Logs generados diariamente
- [ ] Tasa de éxito consistente
- [ ] Property history crece progresivamente

---

## 📊 VALIDACIÓN FINAL

### Modo Manual - Checklist Completo
- [ ] ✅ Script detecta "Modo MANUAL"
- [ ] ✅ Concurrency = 1 worker
- [ ] ✅ Procesa URLs desde archivo TXT
- [ ] ✅ Genera log exitosamente
- [ ] ✅ Property history actualizado
- [ ] ✅ Duplicados detectados
- [ ] ✅ Tiempo: ~50 min para 20 propiedades

### Modo Auto - Checklist Completo
- [ ] ✅ Script detecta "Modo AUTO"
- [ ] ✅ SCRAPERAPI_KEY configurado correctamente
- [ ] ✅ Extractor genera URLs automáticamente
- [ ] ✅ Concurrency = 3 workers (paralelo)
- [ ] ✅ Workers se ejecutan simultáneamente
- [ ] ✅ Genera log completo
- [ ] ✅ Property history actualizado
- [ ] ✅ Dashboard ScraperAPI muestra uso
- [ ] ✅ Tiempo: ~20-30 min para 30-40 propiedades

### Cron - Checklist Completo
- [ ] ✅ Crontab configurado correctamente
- [ ] ✅ Ejecuta a la hora programada
- [ ] ✅ Logs generados en `/tmp/` y `logs/`
- [ ] ✅ Sin errores de permisos
- [ ] ✅ Property history crece diariamente

---

## 🆘 TROUBLESHOOTING

### Problema: Modo AUTO no detectado
**Síntomas:** Script muestra "Modo MANUAL" aunque hay API key

**Solución:**
```bash
# 1. Verificar archivo .env existe
ls -la .env

# 2. Verificar contenido
cat .env | grep SCRAPERAPI_KEY

# 3. Verificar formato correcto
grep -v "^#" .env | grep "SCRAPERAPI_KEY" | grep "=."
```

**Causas comunes:**
- API key vacía: `SCRAPERAPI_KEY=`
- Línea comentada: `#SCRAPERAPI_KEY=...`
- Espacios extra: `SCRAPERAPI_KEY = abc123`

---

### Problema: Batch processor no usa concurrencia
**Síntomas:** Solo muestra 1 worker aunque modo AUTO detectado

**Solución:**
```bash
# 1. Verificar que daily-scraping.sh pasa el flag
grep "scrapear-batch-urls.js" daily-scraping.sh

# Debe mostrar:
# node scrapear-batch-urls.js --concurrency $CONCURRENCY

# 2. Probar manualmente
node scrapear-batch-urls.js --concurrency 3 --test 3

# Debe mostrar:
# ⚙️  Configuración:
#    • Concurrencia: 3 workers
```

---

### Problema: Extractor falla con proxies
**Síntomas:** "Extractor falló. Continuando con URLs existentes..."

**Solución:**
```bash
# 1. Verificar API key válida
curl "http://api.scraperapi.com/account?api_key=TU_API_KEY"

# Debe retornar JSON con:
# {"requestCount": X, "requestLimit": 1000}

# 2. Probar extractor manualmente
node extraer-urls-stealth.js

# 3. Revisar errores específicos en log
cat logs/daily-scraping-$(date +%Y%m%d).log | grep -i error
```

**Causas comunes:**
- API key inválida
- Plan gratuito agotado (1000 requests)
- Inmuebles24 cambió estructura HTML

---

### Problema: Cron no ejecuta
**Síntomas:** No hay logs en `/tmp/daily-scraping-cron.log`

**Solución:**
```bash
# 1. Verificar cron está corriendo
ps aux | grep cron

# 2. Verificar permisos del script
ls -l daily-scraping.sh
# Debe mostrar: -rwxr-xr-x

# 3. Hacer ejecutable si no lo es
chmod +x daily-scraping.sh

# 4. Probar ejecución desde /bin/sh
/bin/sh -c "./daily-scraping.sh" 2>&1 | head -20

# 5. Verificar logs de sistema
grep CRON /var/log/system.log | tail -20  # macOS
```

---

## 📈 OPTIMIZACIÓN

### Ajustar Concurrencia
```bash
nano .env
```

**Sin proxies:**
```
MAX_CONCURRENT_WORKERS=1   # Recomendado
```

**Con proxies (Plan Gratuito):**
```
MAX_CONCURRENT_WORKERS=2   # Conservador
```

**Con proxies (Plan Hobby):**
```
MAX_CONCURRENT_WORKERS=3   # Balanceado (default)
MAX_CONCURRENT_WORKERS=5   # Agresivo (si tienes muchas URLs)
```

### Ajustar Delays
```bash
nano .env
```

**Sin proxies:**
```
DELAY_BETWEEN_PROPS_MS=10000  # 10 segundos (conservador)
```

**Con proxies:**
```
DELAY_BETWEEN_PROPS_MS=2000   # 2 segundos (agresivo)
DELAY_BETWEEN_PROPS_MS=5000   # 5 segundos (balanceado)
```

---

## 🎯 RESUMEN FINAL

### Estado Actual del Sistema

**Archivos clave:**
- ✅ `.env` - Configuración de proxies y workers
- ✅ `daily-scraping.sh` - Orquestador principal (ejecutable)
- ✅ `scrapear-batch-urls.js` - Batch processor con soporte concurrencia
- ✅ `property-history.js` - Tracking de propiedades con deduplicación
- ✅ `proxy-pool.js` - Pool de proxies rotativos

**Modos operativos:**
1. **MANUAL ($0/mes)** - Copiar URLs manualmente, 1 worker, ~50 min
2. **AUTO ($49/mes)** - Extracción automática, 3 workers, ~25 min
3. **CRON** - 100% manos libres, ejecución diaria programada

**Próximos pasos:**
1. [ ] Configurar .env con SCRAPERAPI_KEY
2. [ ] Probar modo AUTO con `./daily-scraping.sh`
3. [ ] Validar workers paralelos en logs
4. [ ] Configurar cron para ejecución diaria
5. [ ] Monitorear dashboard ScraperAPI semanalmente

**Documentación adicional:**
- `SCRAPERAPI-SETUP.md` - Guía rápida ScraperAPI (5 min)
- `AUTOMATION-README.md` - Documentación completa (15 KB)
- `PROFESSIONAL-SCRAPING-SYSTEM.md` - Arquitectura técnica

---

**Sistema creado:** Octubre 2025
**Última actualización:** Octubre 2025
**Versión:** 3.0 Full Auto + Concurrency
