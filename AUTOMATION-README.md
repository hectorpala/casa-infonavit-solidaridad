# 🤖 Sistema de Scraping Automático - Guía Completa

## 🎯 Resumen

Sistema 100% automático para scrapear propiedades recientes de Inmuebles24 Culiacán. Funciona CON o SIN proxies.

**Tiempo de setup**: 5 minutos  
**Tiempo diario (manual)**: 3 min copiar URLs + 50 min automático = 53 min  
**Tiempo diario (auto)**: 0 min = 100% manos libres

---

## 🚀 Quick Start - Modo Manual ($0/mes)

### Paso 1: Configurar Archivo de URLs (3 minutos)

```bash
nano urls-propiedades-recientes-culiacan.txt
```

Pegar URLs de Inmuebles24 (una por línea), guardar con **Ctrl+X → Y → Enter**

### Paso 2: Ejecutar Script de Automatización

```bash
./daily-scraping.sh
```

¡Eso es todo! El script:
- ✅ Procesa todas las URLs
- ✅ Limpia histórico antiguo
- ✅ Genera estadísticas
- ✅ Publica automáticamente a GitHub

**Resultado**: 20 propiedades procesadas en ~50 minutos, 100% automático después de copiar URLs.

---

## 🔥 Modo Automático CON Proxies ($5-49/mes)

### Paso 1: Configurar Credenciales

```bash
nano .env
```

Agregar tu API key de ScraperAPI (recomendado):

```bash
SCRAPERAPI_KEY=tu_api_key_aqui
```

O configurar otro proveedor (Oxylabs, BrightData, Zyte).

### Paso 2: Ejecutar Modo Auto

```bash
./daily-scraping.sh
```

El script detecta automáticamente si hay proxies y:
- ✅ Extrae URLs automáticamente de Inmuebles24
- ✅ Procesa con 3 workers paralelos
- ✅ Publica todo automáticamente

**Resultado**: 100% manos libres, ~60 propiedades/hora.

---

## ⏰ Configurar Cron Job (Ejecución Diaria Automática)

### Paso 1: Abrir Crontab

```bash
crontab -e
```

### Paso 2: Agregar Línea (Ejecutar todos los días a las 7 AM)

```bash
0 7 * * * /Users/hectorpc/Documents/Hector\ Palazuelos/Google\ My\ Business/landing\ casa\ solidaridad/daily-scraping.sh >> /tmp/daily-scraping-cron.log 2>&1
```

**Importante**: Cambiar la ruta a tu directorio real.

### Paso 3: Verificar Cron

```bash
crontab -l
```

¡Listo! El sistema scrapeará automáticamente todos los días a las 7 AM.

---

## 📊 Monitoreo y Logs

### Ver Logs del Día

```bash
cat logs/daily-scraping-$(date +%Y%m%d).log
```

### Ver Estadísticas del Histórico

```bash
node -e "
const PropertyHistory = require('./property-history');
const history = new PropertyHistory();
const stats = history.getStats();
console.log('📊 ESTADÍSTICAS');
console.log('═'.repeat(50));
console.log(\`Total propiedades: \${stats.total}\`);
console.log(\`Recientes (≤20 días): \${stats.recent20}\`);
console.log(\`Cambios de precio: \${stats.priceChanges}\`);
console.log(\`Scrapeadas: \${stats.scraped}\`);
console.log('═'.repeat(50));
"
```

### Ver Resultados del Batch

```bash
# Últimas 20 líneas del log
tail -20 batch-scraping-log.txt

# Contar éxitos vs errores
echo "Éxitos: $(grep -c SUCCESS batch-scraping-log.txt)"
echo "Errores: $(grep -c ERROR batch-scraping-log.txt)"
```

---

## 🔧 Configuración Avanzada

### Cambiar Concurrencia (Workers Paralelos)

Editar `.env`:

```bash
# Sin proxies: 1-2 workers
MAX_CONCURRENT_WORKERS=1

# Con proxies: 3-5 workers
MAX_CONCURRENT_WORKERS=3
```

### Cambiar Delay Entre Propiedades

Editar `.env`:

```bash
# Sin proxies: 5-10 segundos recomendado
DELAY_BETWEEN_PROPS_MS=5000

# Con proxies: 2-5 segundos
DELAY_BETWEEN_PROPS_MS=2000
```

### Limpieza Automática del Histórico

Por defecto, el script limpia propiedades no vistas en 30+ días. Para cambiar:

Editar `daily-scraping.sh` línea 90:

```bash
const removed = history.cleanOldProperties(30);  # Cambiar 30 por días deseados
```

---

## 🔔 Notificaciones (Opcional)

### Configurar Webhook (Slack, Discord, etc.)

Editar `.env`:

```bash
NOTIFICATION_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/HERE
```

El script enviará notificación al terminar con resumen de éxitos/errores.

---

## 🛡️ Troubleshooting

### Problema: "Archivo urls-propiedades-recientes-culiacan.txt no encontrado"

**Solución (Modo Manual)**:

```bash
nano urls-propiedades-recientes-culiacan.txt
# Pegar URLs, guardar
```

**Solución (Modo Auto)**:

Configurar proxies en `.env` y ejecutar:

```bash
node extraer-urls-stealth.js
```

### Problema: Script cron no ejecuta

**Verificar permisos**:

```bash
chmod +x daily-scraping.sh
ls -l daily-scraping.sh  # Debe mostrar -rwxr-xr-x
```

**Verificar ruta en crontab**:

```bash
crontab -l  # Ver ruta actual
which node  # Verificar ruta de Node.js

# Si necesario, usar ruta completa:
0 7 * * * /usr/local/bin/node /ruta/completa/daily-scraping.sh
```

### Problema: Demasiados errores 429 (Rate Limited)

**Solución**: Reducir concurrencia en `.env`:

```bash
MAX_CONCURRENT_WORKERS=1
DELAY_BETWEEN_PROPS_MS=10000  # 10 segundos
```

---

## 📈 Comparación de Modos

| Característica | Manual | Auto con Proxies |
|----------------|--------|------------------|
| **Costo** | $0/mes | $5-49/mes |
| **Tiempo setup** | 3 min/día | 0 min/día |
| **Tiempo total** | ~53 min/día | 0 min/día |
| **Propiedades/día** | 20-30 | 50-100+ |
| **Confiabilidad** | 100% | 95-98% |
| **Escalabilidad** | Limitada | Alta |
| **Cron friendly** | ⚠️ Requiere URLs | ✅ 100% auto |

**Recomendación**: Empezar con modo manual, escalar a auto si necesitas más de 30 propiedades/día o 100% manos libres.

---

## 🎯 Workflow Típico

### Día 1 (Setup)

```bash
# 1. Configurar .env (si quieres auto)
cp .env.example .env
nano .env  # Agregar API keys

# 2. Probar modo manual
nano urls-propiedades-recientes-culiacan.txt  # Copiar 2-3 URLs
./daily-scraping.sh

# 3. Verificar resultados
ls culiacan/  # Ver propiedades generadas
```

### Día 2+ (Operación)

**Modo Manual**:
```bash
# Copiar URLs nuevas
nano urls-propiedades-recientes-culiacan.txt

# Ejecutar
./daily-scraping.sh
```

**Modo Auto (con cron)**:
```bash
# No hacer nada - cron se encarga 🎉
# Revisar logs:
cat logs/daily-scraping-$(date +%Y%m%d).log
```

---

## 💡 Tips y Mejores Prácticas

1. **Backups**: El script no hace backups automáticos. Considera:
   ```bash
   cp property-history.json backups/property-history-$(date +%Y%m%d).json
   ```

2. **Monitoreo de Costos**: Si usas ScraperAPI, revisa tu dashboard:
   - https://www.scraperapi.com/dashboard

3. **Optimización**: Ajusta `MAX_DAYS_RECENT` en `.env` según necesidad:
   ```bash
   MAX_DAYS_RECENT=15  # Solo propiedades ≤15 días
   ```

4. **Testing**: Siempre probar en modo manual antes de configurar cron:
   ```bash
   ./daily-scraping.sh  # Ejecutar manualmente primero
   ```

5. **Logs Rotativos**: Los logs se guardan por fecha. Limpiar viejos:
   ```bash
   # Borrar logs de hace 30+ días
   find logs/ -name "daily-scraping-*.log" -mtime +30 -delete
   ```

---

## 📚 Archivos Importantes

- `daily-scraping.sh` - Script principal de automatización
- `.env` - Configuración (API keys, workers, delays)
- `property-history.json` - Histórico de propiedades
- `batch-scraping-log.txt` - Log del último batch
- `logs/daily-scraping-*.log` - Logs diarios rotados

---

## 🆘 Soporte

Si tienes problemas:

1. **Revisar logs**: `cat logs/daily-scraping-$(date +%Y%m%d).log`
2. **Verificar configuración**: `cat .env`
3. **Probar manualmente**: `./daily-scraping.sh`
4. **Ver documentación completa**: `cat PROFESSIONAL-SCRAPING-SYSTEM.md`

---

**Sistema creado**: Octubre 2025  
**Última actualización**: Octubre 2025  
**Versión**: 3.0 Full Auto
