# 🎯 ORQUESTADOR DE SCRAPING - INMUEBLES24

Sistema inteligente de procesamiento batch para automatizar el scraping de múltiples propiedades con reintentos, reportes y notificaciones.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Instalación](#instalación)
- [Uso Básico](#uso-básico)
- [Configuración Avanzada](#configuración-avanzada)
- [Reintentos y Backoff](#reintentos-y-backoff)
- [Reportes](#reportes)
- [Notificaciones](#notificaciones)
- [Integración con Pipeline](#integración-con-pipeline)
- [Troubleshooting](#troubleshooting)

---

## ✨ Características

### 🔄 **Reintentos Inteligentes**
- Reintentos automáticos (2-3 intentos configurables)
- Backoff exponencial: 5s → 10s → 20s
- Detección automática de errores temporales vs permanentes

### 📊 **Reportes Detallados**
- JSON completo con todos los resultados
- Métricas: éxitos, fallos, tiempos, reintentos
- Guardado automático en `reports/`
- Formato timestamped: `orchestrator-YYYY-MM-DD-HH-MM-SS.json`

### 📬 **Notificaciones Opcionales**
- Email (vía SMTP)
- Slack (vía webhook)
- Resumen ejecutivo automático

### 🔗 **Integración Completa**
- Lee lotes desde `1depuracionurlinmuebles24.json`
- Actualiza automáticamente con `lote-manager.js`
- Compatible con todo el pipeline existente

### 🛡️ **Robusto y Confiable**
- Timeout configurable (default: 3 min por propiedad)
- Error handling completo
- Modo dry-run para testing
- Progress tracking en tiempo real

---

## 🚀 Instalación

### 1. Dependencias Base (ya instaladas)
```bash
# Ya tienes instalado:
# - node, axios, puppeteer, etc.
```

### 2. Dependencias Opcionales (solo para notificaciones)

**Para notificaciones por Email:**
```bash
npm install nodemailer
```

**Para Slack:**
```bash
# No requiere dependencias adicionales (usa axios)
```

### 3. Configurar Variables de Entorno

```bash
# Copiar template de configuración
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

---

## 📖 Uso Básico

### **Comando Simplificado**
```bash
# Procesar el lote actual
node orchestrator.js
```

Esto:
1. ✅ Lee `1depuracionurlinmuebles24.json`
2. ✅ Filtra URLs pendientes
3. ✅ Scrapea cada una con reintentos automáticos
4. ✅ Actualiza el lote con éxitos/fallos
5. ✅ Genera reporte en `reports/`

### **Otros Comandos Útiles**

```bash
# Personalizar número de reintentos
node orchestrator.js --max-retries 3

# Notificar por email al terminar
node orchestrator.js --notify email

# Notificar por Slack al terminar
node orchestrator.js --notify slack

# Modo dry-run (simular sin scrapear)
node orchestrator.js --dry-run

# Combinación
node orchestrator.js --max-retries 3 --notify slack
```

---

## ⚙️ Configuración Avanzada

### **Archivo `.env`**

```env
# Reintentos (default: 2)
MAX_RETRIES=2

# Backoff inicial en segundos (default: 5)
INITIAL_BACKOFF=5

# Timeout del scraper en ms (default: 180000 = 3 min)
SCRAPER_TIMEOUT=180000

# Notificaciones Email
EMAIL_ENABLED=true
EMAIL_TO=tu-email@ejemplo.com
EMAIL_FROM=scraper@casasenventa.info
SMTP_HOST=smtp.gmail.com
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion

# Notificaciones Slack
SLACK_ENABLED=true
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### **Configuraciones Recomendadas**

#### 🐢 **Conservadora** (para testing)
```env
MAX_RETRIES=1
INITIAL_BACKOFF=10
SCRAPER_TIMEOUT=300000  # 5 minutos
```

#### ⚡ **Agresiva** (para producción)
```env
MAX_RETRIES=3
INITIAL_BACKOFF=3
SCRAPER_TIMEOUT=120000  # 2 minutos
```

#### ⚖️ **Balanceada** (recomendada)
```env
MAX_RETRIES=2
INITIAL_BACKOFF=5
SCRAPER_TIMEOUT=180000  # 3 minutos
```

---

## 🔄 Reintentos y Backoff

### **Estrategia de Reintentos**

El orquestador usa **backoff exponencial** para manejar errores temporales:

```
Intento 1: Ejecutar inmediatamente
  ↓ (fallo)
Esperar 5 segundos
  ↓
Intento 2: Ejecutar
  ↓ (fallo)
Esperar 10 segundos
  ↓
Intento 3: Ejecutar
  ↓ (fallo)
Esperar 20 segundos
  ↓
Marcar como fallida
```

### **Tipos de Errores**

| Error | Comportamiento |
|-------|---------------|
| Timeout (>3 min) | ✅ Reintentar |
| 403 Cloudflare | ✅ Reintentar con backoff |
| Propiedad removida | ❌ No reintentar (marcar fallida) |
| Network error | ✅ Reintentar |
| Scraper crash | ✅ Reintentar |

### **Actualización del Lote**

Después de cada URL (éxito o fallo después de todos los reintentos):

```bash
# Éxito
node lote-manager.js mark-processed 147696056

# Fallo
node lote-manager.js mark-failed 147696056 "Timeout después de 3 intentos"
```

---

## 📊 Reportes

### **Estructura del Reporte**

```json
{
  "metadata": {
    "startTime": "2025-10-26T23:50:00.000Z",
    "startTimeReadable": "26/10/2025, 4:50:00 p.m.",
    "endTime": "2025-10-26T23:58:23.456Z",
    "endTimeReadable": "26/10/2025, 4:58:23 p.m.",
    "totalDuration": "8m 23s",
    "totalDurationMs": 503456,
    "configUsed": {
      "maxRetries": 2,
      "initialBackoff": 5,
      "scraperTimeout": 180000
    },
    "loteInfo": {
      "rangoPrecio": "3M-4M",
      "ciudad": "Culiacán, Sinaloa",
      "tipo": "Casas en Venta",
      "notas": "Lote semanal de propiedades premium"
    }
  },
  "summary": {
    "totalUrls": 10,
    "successful": 7,
    "failed": 3,
    "successRate": "70.00%",
    "totalRetries": 5,
    "avgDuration": "50s"
  },
  "results": [
    {
      "propertyId": "147696056",
      "url": "https://www.inmuebles24.com/...",
      "status": "success",
      "attempts": 1,
      "duration": "45s",
      "error": null,
      "slug": "casa-venta-culiacancito",
      "timestamp": "2025-10-26T23:50:45.123Z"
    },
    {
      "propertyId": "147661732",
      "url": "https://www.inmuebles24.com/...",
      "status": "failed",
      "attempts": 3,
      "duration": "2m 35s",
      "error": "Timeout después de 3 minutos",
      "slug": null,
      "timestamp": "2025-10-26T23:53:20.456Z"
    }
  ]
}
```

### **Analizar Reportes**

```bash
# Ver último reporte
cat reports/orchestrator-*.json | tail -1 | jq '.summary'

# Listar todas las fallidas
jq '.results[] | select(.status=="failed")' reports/orchestrator-*.json

# Calcular tasa de éxito promedio
jq -r '.summary.successRate' reports/orchestrator-*.json | awk '{sum+=$1; n++} END {print sum/n "%"}'
```

---

## 📬 Notificaciones

### **Email (SMTP)**

#### 1. **Configurar Gmail**

```bash
# 1. Activar verificación en 2 pasos:
https://myaccount.google.com/security

# 2. Generar contraseña de aplicación:
https://myaccount.google.com/apppasswords

# 3. Configurar .env:
EMAIL_ENABLED=true
EMAIL_TO=hector@ejemplo.com
EMAIL_FROM=scraper@casasenventa.info
SMTP_HOST=smtp.gmail.com
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
```

#### 2. **Ejecutar con Notificación**

```bash
node orchestrator.js --notify email
```

#### 3. **Email Recibido**

```
Asunto: ✅ Scraping completado: 7/10 exitosas

Reporte de Scraping - Inmuebles24
==================================

Fecha: 26/10/2025, 4:58:23 p.m.
Duración total: 8m 23s

Resumen:
- ✅ Exitosas: 7
- ❌ Fallidas: 3
- 🔄 Reintentos totales: 5
- 📊 Tasa de éxito: 70.00%

Lote procesado:
- Rango de precio: 3M-4M
- Ciudad: Culiacán, Sinaloa
- Tipo: Casas en Venta

Reporte completo: reports/orchestrator-2025-10-26-16-58-23.json
```

### **Slack (Webhook)**

#### 1. **Crear Webhook**

```bash
# 1. Ir a: https://api.slack.com/messaging/webhooks
# 2. Crear una app y webhook
# 3. Copiar la URL del webhook
```

#### 2. **Configurar .env**

```env
SLACK_ENABLED=true
SLACK_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

#### 3. **Ejecutar con Notificación**

```bash
node orchestrator.js --notify slack
```

#### 4. **Mensaje en Slack**

```
✅ Scraping completado

Exitosas: 7/10    |    Fallidas: 3
Duración: 8m 23s  |    Tasa éxito: 70.00%

Lote: Culiacán, Sinaloa · 3M-4M

Reporte: `reports/orchestrator-2025-10-26-16-58-23.json`
```

---

## 🔗 Integración con Pipeline

### **Pipeline Completo**

```
1. Extractor → 2. Auditor → 3. Lote Manager → 4. Orquestador → 5. Scraper
```

### **Workflow End-to-End**

```bash
# 1. EXTRAER URLs de Inmuebles24
node 1extractorurlinmuebles24.js "https://www.inmuebles24.com/venta/casas/culiacan/3000000-4000000-pesos"
# Output: urls-inmuebles24-YYYY-MM-DD-HH-MM-SS-valid.txt

# 2. AUDITAR y detectar duplicadas
node auditor-urls-inmuebles24.js urls-inmuebles24-*-valid.txt
# Output: audit-YYYY-MM-DD-HH-MM-SS-nuevas.txt

# 3. CREAR LOTE con metadata
node lote-manager.js init audit-*-nuevas.txt \
    --rango-precio "3M-4M" \
    --ciudad "Culiacán, Sinaloa" \
    --tipo "Casas en Venta" \
    --notas "Lote semanal de propiedades premium"

# 4. ORQUESTAR scraping automático
node orchestrator.js --notify slack

# 5. REVISAR reporte
cat reports/orchestrator-*.json | tail -1 | jq '.summary'

# 6. PUBLICAR
# (Manual: revisar propiedades scrapeadas)
# git add . && git commit -m "..." && git push
```

### **Automatización Completa (Cron)**

```bash
# Agregar a crontab (ejecutar semanalmente)
0 2 * * 1 cd /path/to/project && ./weekly-scraping.sh
```

**Archivo `weekly-scraping.sh`:**
```bash
#!/bin/bash
set -e

# 1. Extraer URLs
node 1extractorurlinmuebles24.js "https://www.inmuebles24.com/venta/casas/culiacan/3000000-4000000-pesos"

# 2. Auditar
LATEST_URLS=$(ls -t urls-inmuebles24-*-valid.txt | head -1)
node auditor-urls-inmuebles24.js "$LATEST_URLS"

# 3. Crear lote
LATEST_AUDIT=$(ls -t audit-*-nuevas.txt | head -1)
node lote-manager.js init "$LATEST_AUDIT" \
    --rango-precio "3M-4M" \
    --ciudad "Culiacán, Sinaloa" \
    --tipo "Casas en Venta" \
    --notas "Lote automático semanal"

# 4. Scrapear con orquestador
node orchestrator.js --notify slack

# 5. Publicar (opcional, requiere revisión manual)
# git add . && git commit -m "Propiedades semana $(date +%Y-%m-%d)" && git push
```

---

## 🔧 Troubleshooting

### **Problema: El orquestador no encuentra el lote**

**Síntoma:**
```
Error: No se pudo leer el lote: ENOENT: no such file or directory
```

**Solución:**
```bash
# Verificar que existe el archivo
ls -lh 1depuracionurlinmuebles24.json

# Si no existe, crear un lote primero
node lote-manager.js init audit-*-nuevas.txt --rango-precio "3M-4M"
```

### **Problema: Todas las URLs fallan con timeout**

**Síntoma:**
```
❌ Fallo en intento 1: Timeout: Scraper tardó más de 3 minutos
❌ Fallo en intento 2: Timeout: Scraper tardó más de 3 minutos
```

**Solución:**
```bash
# Aumentar timeout en .env
SCRAPER_TIMEOUT=300000  # 5 minutos

# O ejecutar con scraper más estable
# Revisar logs del scraper para ver por qué tarda tanto
```

### **Problema: Email no se envía**

**Síntoma:**
```
⚠️  Error enviando email: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solución:**
```bash
# 1. Verificar que tienes verificación en 2 pasos activada
# 2. Generar nueva contraseña de aplicación en:
#    https://myaccount.google.com/apppasswords
# 3. Actualizar .env con la nueva contraseña
```

### **Problema: Slack no recibe notificación**

**Síntoma:**
```
⚠️  Error enviando a Slack: Request failed with status code 404
```

**Solución:**
```bash
# 1. Verificar que el webhook URL es correcto
# 2. Probar el webhook manualmente:
curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test desde curl"}' \
    YOUR_WEBHOOK_URL

# 3. Si funciona, actualizar .env con el URL correcto
```

### **Problema: Modo dry-run no simula correctamente**

**Síntoma:**
```
[DRY RUN] Simulando scraper...
✅ Éxito en intento 1
[DRY RUN] Actualizaría lote-manager: 147696056 → success
```

**Solución:**
```bash
# Esto es el comportamiento ESPERADO en dry-run
# Si quieres probar con scraping real, quita --dry-run:
node orchestrator.js
```

---

## 📚 Comandos de Referencia Rápida

```bash
# ═══════════════════════════════════════════════════════════════
# COMANDOS BÁSICOS
# ═══════════════════════════════════════════════════════════════

# Procesar lote actual
node orchestrator.js

# Dry-run (simular)
node orchestrator.js --dry-run

# Con notificación
node orchestrator.js --notify email
node orchestrator.js --notify slack

# Personalizar reintentos
node orchestrator.js --max-retries 3

# ═══════════════════════════════════════════════════════════════
# ANÁLISIS DE REPORTES
# ═══════════════════════════════════════════════════════════════

# Ver último reporte (resumen)
cat $(ls -t reports/orchestrator-*.json | head -1) | jq '.summary'

# Ver todas las fallidas
jq '.results[] | select(.status=="failed")' reports/orchestrator-*.json

# Contar reintentos totales
jq '.summary.totalRetries' reports/orchestrator-*.json | awk '{sum+=$1} END {print sum}'

# ═══════════════════════════════════════════════════════════════
# MANTENIMIENTO
# ═══════════════════════════════════════════════════════════════

# Limpiar reportes viejos (>30 días)
find reports/ -name "orchestrator-*.json" -mtime +30 -delete

# Ver tamaño de reportes
du -sh reports/

# Listar reportes ordenados por fecha
ls -lht reports/orchestrator-*.json | head -10
```

---

## 🎯 Mejores Prácticas

### ✅ **DO:**
- Usar `--dry-run` antes de procesar lotes grandes
- Configurar notificaciones para lotes de >10 URLs
- Revisar reportes después de cada ejecución
- Mantener `.env` fuera del control de versiones
- Limpiar reportes viejos periódicamente

### ❌ **DON'T:**
- No usar reintentos excesivos (>3) - puede saturar Inmuebles24
- No reducir backoff por debajo de 3 segundos
- No commitear `.env` con credenciales reales
- No ignorar reportes de fallos - investigar causas
- No ejecutar múltiples orquestadores en paralelo

---

## 📈 Estadísticas de Ejemplo

**Reporte real de 50 propiedades:**

```
╔═══════════════════════════════════════════════════════════════╗
║  📊 RESUMEN FINAL                                            ║
╚═══════════════════════════════════════════════════════════════╝

⏱️  Duración total: 42m 15s
📊 URLs procesadas: 50

✅ Exitosas: 43 (86.00%)
❌ Fallidas: 7
🔄 Reintentos totales: 12
⏱️  Duración promedio: 50s

📁 Reporte guardado en:
   reports/orchestrator-2025-10-26-17-42-15.json
```

**Desglose de fallos:**
- 4 URLs removidas de Inmuebles24 (no encontradas)
- 2 Timeouts (>3 min)
- 1 Error de red

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Verificar reportes en `reports/`
3. Probar con `--dry-run` primero
4. Revisar logs del scraper
5. Contactar al administrador del sistema

---

**Versión:** 3.0
**Última actualización:** Octubre 2025
**Mantenido por:** Hector Palazuelos + Claude
