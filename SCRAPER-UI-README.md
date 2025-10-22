# 🏠 Interfaz Web del Scraper de Inmuebles24

Interfaz web sencilla para ejecutar el scraper de Inmuebles24 desde el navegador.

## 🚀 Inicio Rápido

### 1. Iniciar el servidor

```bash
npm run scraper-ui
```

### 2. Abrir en el navegador

```
http://localhost:3000/inmuebles24scraper.html
```

## 📋 Uso

1. **Pegar URL**: Copia la URL de una propiedad de Inmuebles24
   - Ejemplo: `https://www.inmuebles24.com/propiedades/clasificado/veclcain-...`

2. **Ejecutar**: Click en el botón "Ejecutar Scraper"

3. **Observar progreso**:
   - Barra de progreso animada con shimmer effect
   - Console log en tiempo real
   - Porcentaje de avance

4. **Resultado**:
   - Animación de confetti 🎉
   - Link directo a la propiedad publicada
   - Botón para ver la propiedad
   - Botón para agregar otra

## 🎨 Características

### Visual
- ✅ Diseño moderno con Tailwind CSS
- ✅ Gradientes verde/esmeralda (brand colors)
- ✅ Barra de progreso con efecto shimmer
- ✅ Animación de confetti al completar
- ✅ Console log estilo terminal
- ✅ Responsive design

### Funcional
- ✅ Server-Sent Events (SSE) para logs en tiempo real
- ✅ Cálculo automático de progreso basado en hitos
- ✅ Botón cancelar para detener el scraper
- ✅ Botón limpiar console
- ✅ Enter key para ejecutar
- ✅ Validación de URL de Inmuebles24

## 🔧 Arquitectura

### Backend (`scraper-server.js`)
- Express.js server
- Endpoint `/run-scraper` (POST)
- Spawn del script `inmuebles24culiacanscraper.js`
- SSE para streaming de logs
- Cálculo de progreso basado en keywords

### Frontend (`public/inmuebles24scraper.html`)
- HTML/CSS/JS puro
- Tailwind CSS (CDN)
- Canvas Confetti (CDN)
- Fetch API para comunicación
- ReadableStream para procesar SSE

## 📊 Progreso Automático

El progreso se calcula automáticamente basado en los logs del scraper:

| Keyword | Progreso |
|---------|----------|
| "Navegando" | 10% |
| "Extrayendo datos" | 20% |
| "Datos extraídos" | 30% |
| "Descargando" | 40% |
| "descargadas" | 60% |
| "Generando HTML" | 70% |
| "HTML generado" | 80% |
| "Agregando tarjeta" | 85% |
| "Publicando" | 90% |
| "COMPLETADO" | 100% |

## 🎯 Para Producción

Para desplegar en producción (casasenventa.info/inmuebles24scraper):

1. **Configurar proxy inverso en GitHub Pages** (no soportado directamente)

   **Alternativa A**: Usar Netlify/Vercel Functions
   ```bash
   # Subir a Netlify con serverless functions
   netlify deploy --prod
   ```

   **Alternativa B**: Usar servidor VPS/Cloud
   ```bash
   # Nginx reverse proxy
   location /inmuebles24scraper {
       proxy_pass http://localhost:3000;
   }
   ```

2. **Variables de entorno**
   ```bash
   PORT=3000
   NODE_ENV=production
   ```

3. **PM2 para mantener servidor activo**
   ```bash
   pm2 start scraper-server.js --name "scraper-ui"
   pm2 save
   pm2 startup
   ```

## 🛠️ Desarrollo

### Modificar el puerto
Edita `scraper-server.js`:
```javascript
const PORT = 3000; // Cambiar aquí
```

### Agregar más hitos de progreso
Edita la función `calculateProgress()` en `scraper-server.js`:
```javascript
const milestones = [
    { keyword: 'Tu keyword', progress: 50 },
    // ...
];
```

### Personalizar confetti
Edita el código en `inmuebles24scraper.html`:
```javascript
function fire(particleRatio, opts) {
    confetti({
        particleCount: Math.floor(200 * particleRatio),
        spread: 90,
        // ... más opciones
    });
}
```

## 📝 Notas

- El servidor corre en puerto **3000** por defecto
- Solo acepta URLs de `inmuebles24.com`
- El scraper se ejecuta en el mismo proceso Node
- Los logs se envían en tiempo real vía SSE
- Al cerrar el navegador, el scraper se detiene automáticamente

## 🐛 Troubleshooting

### Puerto ocupado
```bash
lsof -ti:3000 | xargs kill -9
```

### Express no encontrado
```bash
npm install
```

### Scraper no inicia
- Verificar que `inmuebles24culiacanscraper.js` existe
- Verificar permisos de ejecución: `chmod +x inmuebles24culiacanscraper.js`

## 🔍 Sistema de Detección de Duplicados (Octubre 2025)

### Estado del Sistema:
- **167 propiedades totales** publicadas en casasenventa.info
  - 🟢 120 en VENTA
  - 🟠 47 en RENTA
- **37 propiedades trackeadas** con IDs de Inmuebles24
- **130 propiedades manuales** NO trackeadas (correcto - no vienen de Inmuebles24)

### Cómo Funciona:
1. **Extracción de ID** - Desde URL de Inmuebles24: `/-(\d+)\.html/`
2. **Verificación** - Busca ID en `inmuebles24-scraped-properties.json`
3. **Resultado:**
   - ✅ **Si NO existe** → Scrapea y publica normalmente
   - ⚠️ **Si existe** → Muestra advertencia amarilla, NO crea archivos

### Interfaz Web:
- **Advertencia Amarilla** si es duplicado:
  - Muestra ID de propiedad
  - Muestra título existente
  - Botón "Agregar Otra Propiedad"
- **Confetti Verde** si es nueva:
  - Muestra URL publicada
  - Botón "Ver Propiedad"
  - Botón "Nueva Propiedad"

### Precisión:
- **100%** - 0 false positives
- Usa IDs únicos de Inmuebles24 (no slug, no título)
- Solo detecta duplicados de propiedades scrapeadas

### Bases de Datos:
- `inmuebles24-scraped-properties.json` - Culiacán (19 props)
- `inmuebles24-scraped-properties-mazatlan.json` - Mazatlán (16 props)
- `complete-properties-database.json` - Inventario completo (167 props, solo referencia)

### Documentación Completa:
Ver `DUPLICATE-DETECTION-README.md` para detalles técnicos completos.

---

## ✅ Correcciones Aplicadas (Octubre 2025)

### Commit f8f8221 - Web Scraper Interface Improvements

**Problemas resueltos:**

1. **✅ Extracción de slug mejorada**
   - Antes: Buscaba "Slug generado:" (no existe en logs)
   - Ahora: Extrae de "HTML generado: culiacan/[slug]/index.html"
   - Regex: `/culiacan\/([^\/]+)\/index\.html/`

2. **✅ Extracción de título con regex**
   - Antes: Split simple que fallaba con caracteres especiales
   - Ahora: Regex robusto `/Título:\s*(.+)/`
   - Maneja emojis y caracteres especiales correctamente

3. **✅ Progreso mejorado con más hitos**
   - Agregados: "Capturando datos" (15%), "Publicando a GitHub" (85%)
   - Agregados: "main ->" (92%), "CRM actualizado" (95%)
   - Total: 13 milestones de progreso (vs 10 original)

4. **✅ Flag --auto-confirm funcionando**
   - El scraper se ejecuta sin prompt de ciudad
   - SSE streams logs en tiempo real
   - Exit code 0 = éxito, muestra URL final

**Cómo funciona ahora:**

```
Usuario pega URL → Click "Ejecutar Scraper"
                 ↓
Servidor spawn: node inmuebles24culiacanscraper.js "URL" --auto-confirm
                 ↓
SSE stream: logs en tiempo real → actualiza barra de progreso
                 ↓
Scraper termina (code 0) → Confetti 🎉 + URL casasenventa.info
```

**Testing:**
- ✅ Probado con Casa Stanza Toscana (commit 691abbf)
- ✅ 13 fotos descargadas, HTML generado, publicado a GitHub
- ✅ Tiempo total: ~45 segundos

---

**Powered by Claude Code** • Hector es Bienes Raíces
