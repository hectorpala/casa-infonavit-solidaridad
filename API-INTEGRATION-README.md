# Pipeline API Integration - README

## 📖 Descripción General

Sistema backend REST API + Dashboard web integrado que permite ejecutar scripts del pipeline Inmuebles24 Culiacán desde una interfaz web, sin necesidad de acceso directo a la terminal.

## 🎯 Características Principales

✅ **Backend API RESTful** - Servidor Express.js en Node.js
✅ **Autenticación con API Key** - Seguridad básica integrada
✅ **Streaming de logs en tiempo real** - SSE (Server-Sent Events)
✅ **Control de concurrencia** - Solo 1 job a la vez
✅ **Dashboard web interactivo** - Tablero Kanban con botones ejecutables
✅ **Manejo de timeouts** - Configurables por endpoint
✅ **Gestión de errores** - Manejo robusto con mensajes claros

---

## 🚀 Inicio Rápido

### 1. Iniciar el API Server

```bash
# Opción 1: Usar npm
npm start

# Opción 2: Comando directo
node pipeline-api-server.js

# Opción 3: Usar el script package.json
npm run pipeline-api
```

**Salida esperada:**
```
╔═══════════════════════════════════════════════════════════════╗
║  🚀 Pipeline API Server                                       ║
╚═══════════════════════════════════════════════════════════════╝

✅ Server running on http://localhost:3001
🔑 API Key: pipeline-secret-key-2025

📡 Endpoints:
   POST   /api/extract-urls     - Extract URLs from Inmuebles24
   POST   /api/scrape-batch     - Run batch scraping
   POST   /api/run-command      - Run custom command
   GET    /api/status/:jobId    - Get job status
   GET    /api/logs/:jobId      - Stream logs (SSE)
   GET    /api/jobs             - List all jobs
   DELETE /api/jobs/:jobId      - Cancel job
   GET    /health               - Health check

🔒 Authentication: Add header "X-API-Key: pipeline-secret-key-2025"
```

### 2. Abrir el Dashboard

```bash
open docs/pipeline-inmuebles24-culiacan.html
```

O navega a: `file:///[ruta-completa]/docs/pipeline-inmuebles24-culiacan.html`

### 3. Usar el Dashboard

1. **Extraer URLs:**
   - Pega una URL de búsqueda de Inmuebles24 en el campo de texto
   - Configura los días de antigüedad (default: 35)
   - Click en "🚀 Extraer URLs Ahora"
   - Los logs aparecerán en tiempo real en el panel inferior

2. **Verificar duplicados:**
   - Click en "🚀 Ejecutar verificación (API)" en la tarjeta de Verificación Rápida
   - Verá el progreso en tiempo real

3. **Scraping batch:**
   - Click en "🚀 Procesar batch (API - 30 URLs)" para procesar 30 URLs de prueba
   - O click en "⚡ Procesar todas las URLs" para procesar el archivo completo

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:3001
```

### Autenticación
Todos los endpoints (excepto `/health`) requieren autenticación:

**Header:**
```
X-API-Key: pipeline-secret-key-2025
```

**Query param alternativo:**
```
?apiKey=pipeline-secret-key-2025
```

---

### POST `/api/extract-urls`
Extrae URLs de propiedades recientes desde Inmuebles24.

**Request Body:**
```json
{
  "maxDays": 35
}
```

**Response (Success):**
```json
{
  "success": true,
  "jobId": "job-1730000000000-abc123",
  "message": "URL extraction started",
  "logsUrl": "/api/logs/job-1730000000000-abc123"
}
```

**Response (Error - Job running):**
```json
{
  "error": "Another job is running",
  "currentJobId": "job-1730000000000-xyz789"
}
```

---

### POST `/api/scrape-batch`
Ejecuta scraping batch desde archivo de URLs.

**Request Body:**
```json
{
  "concurrency": 3,
  "test": 30,
  "checkOnly": false
}
```

**Parámetros:**
- `concurrency` (number): Workers paralelos (default: 3)
- `test` (number | null): Limitar a N URLs (null = todas)
- `checkOnly` (boolean): Solo verificar duplicados sin scrapear

**Response:**
```json
{
  "success": true,
  "jobId": "job-1730000000000-def456",
  "message": "Batch scraping started",
  "logsUrl": "/api/logs/job-1730000000000-def456"
}
```

---

### GET `/api/logs/:jobId` (SSE)
Streaming de logs en tiempo real usando Server-Sent Events.

**URL:**
```
http://localhost:3001/api/logs/job-123?apiKey=pipeline-secret-key-2025
```

**Event types:**
```javascript
// Stdout del comando
data: {"type":"stdout","message":"Procesando URL 1/30...","timestamp":"2025-10-25T..."}

// Stderr del comando
data: {"type":"stderr","message":"Warning: ...","timestamp":"2025-10-25T..."}

// Completado exitosamente
data: {"type":"complete","exitCode":0}

// Error
data: {"type":"error","message":"Command failed: ..."}
```

---

### GET `/api/status/:jobId`
Consulta el estado de un job.

**Response:**
```json
{
  "id": "job-123",
  "type": "extract-urls",
  "status": "running",
  "params": { "maxDays": 35 },
  "startTime": "2025-10-25T12:00:00.000Z",
  "endTime": null,
  "exitCode": null,
  "error": null,
  "logsCount": 45
}
```

**Estados posibles:**
- `pending` - Job creado, esperando ejecución
- `running` - Ejecutando
- `completed` - Completado exitosamente (exitCode === 0)
- `failed` - Completado con error (exitCode !== 0)
- `error` - Error al ejecutar el comando
- `cancelled` - Cancelado por el usuario

---

### GET `/api/jobs`
Lista todos los jobs (últimos 50).

**Response:**
```json
{
  "jobs": [
    {
      "id": "job-123",
      "type": "extract-urls",
      "status": "completed",
      "startTime": "2025-10-25T12:00:00.000Z",
      "endTime": "2025-10-25T12:05:00.000Z"
    },
    ...
  ],
  "currentJobId": null
}
```

---

### DELETE `/api/jobs/:jobId`
Cancela un job en ejecución.

**Response (Success):**
```json
{
  "success": true,
  "message": "Job cancelled"
}
```

**Response (Error):**
```json
{
  "error": "Job is not running"
}
```

---

### GET `/health`
Health check endpoint (sin autenticación).

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600.5,
  "currentJob": null,
  "totalJobs": 15
}
```

---

## 📄 Archivos Clave

### Backend
- **`pipeline-api-server.js`** - Servidor API principal (450 líneas)
- **`package.json`** - Scripts npm: `start`, `pipeline-api`

### Frontend
- **`docs/pipeline-inmuebles24-culiacan.html`** - Dashboard Kanban integrado (1840 líneas)

---

## 🎨 Dashboard Features

### 1. Panel de Logs en Tiempo Real
- **Toggle button:** 📜 (esquina inferior derecha)
- **Streaming SSE:** Logs actualizados automáticamente
- **Colores:**
  - Blanco: stdout normal
  - Naranja: stderr/warnings
  - Verde: proceso completado
  - Rojo: errores
- **Auto-scroll:** Se desplaza automáticamente al final
- **Limpieza:** Botón "🗑️ Limpiar" para resetear

### 2. Botones Ejecutables
- **"🚀 Extraer URLs Ahora"** - Ejecuta extracción de URLs
- **"🚀 Ejecutar verificación (API)"** - Check de duplicados
- **"🚀 Procesar batch (API - 30 URLs)"** - Batch de prueba
- **"⚡ Procesar todas las URLs"** - Batch completo (5 workers)

### 3. Indicadores Visuales
- **Botón de logs pulsa** cuando hay actividad
- **Panel se abre automáticamente** al ejecutar comandos
- **Logs persistentes** hasta limpieza manual

---

## 🔧 Configuración

### Variables de Entorno
Crear archivo `.env` (opcional):
```bash
PORT=3001
API_KEY=pipeline-secret-key-2025
```

### Cambiar Puerto
Editar `pipeline-api-server.js`:
```javascript
const PORT = process.env.PORT || 3001;  // Cambiar 3001
```

Editar `docs/pipeline-inmuebles24-culiacan.html`:
```javascript
const API_BASE_URL = 'http://localhost:3001';  // Cambiar 3001
```

### Cambiar API Key
Editar `pipeline-api-server.js`:
```javascript
const API_KEY = process.env.API_KEY || 'tu-nueva-api-key';
```

Editar `docs/pipeline-inmuebles24-culiacan.html`:
```javascript
const API_KEY = 'tu-nueva-api-key';
```

---

## 🛡️ Seguridad

### Whitelist de Comandos
Solo comandos permitidos pueden ejecutarse:

```javascript
const allowedCommands = [
    'node extraer-urls-recientes-culiacan.js',
    'node scrapear-batch-urls.js',
    'node rebuild-property-database-from-html.js',
    './daily-scraping.sh'
];
```

### Autenticación
- API key validada en cada request
- Sin API key válida → HTTP 401 Unauthorized

### Concurrencia
- Solo 1 job puede ejecutarse a la vez
- Requests concurrentes reciben HTTP 409 Conflict

---

## ⚠️ Troubleshooting

### Error: "Failed to connect"
**Problema:** Dashboard no puede conectar al API server

**Solución:**
```bash
# 1. Verificar que el servidor está corriendo
curl http://localhost:3001/health

# 2. Si no responde, iniciar el servidor
node pipeline-api-server.js

# 3. Verificar puerto correcto en dashboard HTML
```

### Error: "401 Unauthorized"
**Problema:** API key incorrecta

**Solución:**
```bash
# Verificar API key en ambos archivos:
# - pipeline-api-server.js
# - docs/pipeline-inmuebles24-culiacan.html

# Deben coincidir exactamente
```

### Error: "409 Another job is running"
**Problema:** Ya hay un job en ejecución

**Solución:**
```bash
# Opción 1: Esperar a que termine el job actual

# Opción 2: Cancelar el job
curl -X DELETE \
  -H "X-API-Key: pipeline-secret-key-2025" \
  http://localhost:3001/api/jobs/[jobId]

# Opción 3: Reiniciar el servidor (mata todos los jobs)
```

### Logs no aparecen en tiempo real
**Problema:** SSE no está conectando

**Solución:**
1. Verificar que el navegador soporta EventSource
2. Abrir consola del navegador (F12) y buscar errores
3. Verificar que el API server está corriendo
4. Probar en otro navegador

---

## 📊 Ejemplo Completo: Workflow End-to-End

### 1. Iniciar el servidor
```bash
$ node pipeline-api-server.js
✅ Server running on http://localhost:3001
```

### 2. Abrir dashboard
```bash
$ open docs/pipeline-inmuebles24-culiacan.html
```

### 3. Extraer URLs
1. Pegar URL: `https://www.inmuebles24.com/venta/sinaloa/culiacan/`
2. Configurar días: `35`
3. Click "🚀 Extraer URLs Ahora"
4. Ver logs en tiempo real en panel inferior

**Output esperado:**
```
🚀 Iniciando extracción de URLs...
✅ Job iniciado: job-1730000000000-abc123
📡 Conectando a logs en tiempo real...

🔍 Navegando a Inmuebles24...
📄 Extrayendo URLs de la página 1/5...
📄 Extrayendo URLs de la página 2/5...
...
✅ Total URLs extraídas: 147
💾 Guardado en: urls-propiedades-recientes-culiacan.txt

✅ Proceso completado con código de salida: 0
```

### 4. Verificar duplicados
1. Click "🚀 Ejecutar verificación (API)"
2. Ver análisis en tiempo real

**Output esperado:**
```
🚀 Iniciando verificación...
✅ Job iniciado: job-1730000000000-def456
📡 Conectando a logs en tiempo real...

🔍 Leyendo archivo de URLs...
📊 URLs encontradas: 147
🔍 Verificando contra base de datos...

✅ Nuevas propiedades: 32
⏭️ Ya existentes (duplicados): 115

✅ Proceso completado con código de salida: 0
```

### 5. Ejecutar batch scraping
1. Click "🚀 Procesar batch (API - 30 URLs)"
2. Monitorear progreso en tiempo real

**Output esperado:**
```
🚀 Iniciando scraping batch...
✅ Job iniciado: job-1730000000000-ghi789
📡 Conectando a logs en tiempo real...

🔧 Worker 1: Procesando propiedad 1/30...
🔧 Worker 2: Procesando propiedad 2/30...
🔧 Worker 3: Procesando propiedad 3/30...
...
✅ Éxito: 28/30 propiedades procesadas
⚠️ Duplicados: 2/30 propiedades
❌ Errores: 0/30 propiedades

✅ Proceso completado con código de salida: 0
```

---

## 🎯 Ventajas del Sistema

✅ **Sin acceso a terminal** - Todo desde el navegador
✅ **Logs en tiempo real** - Feedback inmediato del progreso
✅ **Interfaz intuitiva** - Tablero Kanban visual
✅ **Control de errores** - Manejo robusto de fallos
✅ **Autenticación** - Protección básica con API key
✅ **Concurrencia controlada** - Evita conflictos de recursos
✅ **Fácil mantenimiento** - Código limpio y documentado

---

## 📚 Referencias

- **Express.js:** https://expressjs.com/
- **Server-Sent Events (SSE):** https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- **Node.js child_process:** https://nodejs.org/api/child_process.html

---

## 🚀 Próximas Mejoras

### Planned Features
- [ ] Historial de jobs con paginación
- [ ] Múltiples jobs concurrentes (queue system)
- [ ] Notificaciones push cuando un job termina
- [ ] Dashboard con estadísticas en tiempo real
- [ ] Autenticación con JWT tokens
- [ ] Soporte para webhooks post-completion
- [ ] Logs persistentes en archivos
- [ ] API para monitoreo externo

---

**Última actualización:** Octubre 25, 2025
**Versión:** 1.0.0
**Estado:** ✅ Integrado y funcionando end-to-end
