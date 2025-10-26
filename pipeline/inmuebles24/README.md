# 🏗️ Pipeline Inmuebles24

Sistema automatizado end-to-end para extraer, validar y publicar propiedades desde Inmuebles24.com.

## 📖 Documentación Completa

**[Ver documentación completa](../../docs/pipeline-inmuebles24.md)**

---

## 🛠️ Scripts del Pipeline

| Script | Descripción | Comando |
|--------|-------------|---------|
| **1extractorurlinmuebles24.js** | Extrae URLs desde páginas de búsqueda de Inmuebles24 | `node 1extractorurlinmuebles24.js "URL_BUSQUEDA"` |
| **1auditorurlinmuebles24.js** | Compara URLs contra DB para identificar nuevas vs duplicadas | `node 1auditorurlinmuebles24.js urls-extraidas-inmuebles24.json` |
| **1depuracionurlinmuebles24.json** | Queue manual de URLs a procesar | Manual (copiar desde auditor) |
| **1orquestadorurlinmuebles24.js** | Procesa batch completo de URLs secuencialmente | `node 1orquestadorurlinmuebles24.js` |
| **1iteradorurlinmuebles24.js** | Procesa URLs una a la vez con apertura en navegador | `node 1iteradorurlinmuebles24.js` |
| **inmuebles24culiacanscraper.js** | Scraper principal: scrapea + genera HTML + publica | `node inmuebles24culiacanscraper.js "URL"` |

---

## 🚀 Quick Start

### Workflow Completo (28 URLs ejemplo)

```bash
# 1. Extraer URLs (1-2 min)
node 1extractorurlinmuebles24.js "https://www.inmuebles24.com/casas-en-venta-en-culiacan.html"

# 2. Auditar duplicados (30 seg)
node 1auditorurlinmuebles24.js urls-extraidas-inmuebles24.json

# 3. Preparar queue
cp auditoria-urls-inmuebles24.json 1depuracionurlinmuebles24.json

# 4A. Procesar con iterador (recomendado para testing)
node 1iteradorurlinmuebles24.js
# Revisar HTML en navegador, repetir para cada URL

# 4B. Procesar con orquestador (producción)
node 1orquestadorurlinmuebles24.js
# Esperar a que termine el batch completo
```

---

## ✨ Features Clave

- ✅ **Anti-bot evasion** - Puppeteer con headers realistas
- ✅ **🛡️ Filtro de términos prohibidos** - Detecta remates, juicios, invasiones (11 términos)
- ✅ **🔍 Detección de duplicados** - Por Property ID único (100% precisión)
- ✅ **🧠 Direcciones inteligentes** - Sistema de puntuación automática
- ✅ **🎨 InfoWindow carrusel** - TODAS las fotos con navegación
- ✅ **🌐 Multi-ciudad** - Monterrey, Mazatlán, Culiacán
- ✅ **📦 Git automation** - Commit + push automático
- ✅ **📊 Apertura automática** - HTML en navegador (iterador)

---

## 📚 Documentación Relacionada

- **[Pipeline completo](../../docs/pipeline-inmuebles24.md)** - Guía detallada con diagrama de flujo
- **[Filtro de términos](../../FILTRO-TERMINOS-PROHIBIDOS.md)** - Sistema de filtrado
- **[Iterador](../../ITERADOR-README.md)** - Uso detallado del iterador
- **[Detección duplicados](../../DUPLICATE-DETECTION-README.md)** - Sistema de deduplicación

---

## 🔧 Mantenimiento

```bash
# Ver URLs pendientes
jq '.urls_nuevas | length' 1depuracionurlinmuebles24.json

# Limpiar backups antiguos
ls -t 1depuracionurlinmuebles24.json.bak-* | tail -n +11 | xargs rm -f

# Ver estadísticas
jq 'length' inmuebles24-scraped-properties.json

# Ver últimos commits
git log --oneline --grep="Inmuebles24" -5
```

---

**Última actualización:** 26 de octubre 2025
**Versión:** 1.0.0
