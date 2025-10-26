# 🔄 Iterador de Scraping - Inmuebles24

## 📄 Script: `1iteradorurlinmuebles24.js`

Procesa URLs de Inmuebles24 **una a la vez**, con apertura automática en el navegador.

---

## 🎯 Características

### ✅ Ventajas sobre el Orquestador
| Característica | Iterador | Orquestador |
|---------------|----------|-------------|
| **Control** | ✅ Una URL a la vez | ❌ Batch completo |
| **Apertura navegador** | ✅ Automática | ❌ Manual |
| **Revisión inmediata** | ✅ Después de cada scrape | ❌ Al final |
| **Backup JSON** | ✅ Antes de cada cambio | ❌ No |
| **Reintentos** | ✅ Fácil (URL no se elimina si falla) | ⚠️ Manual |
| **Progreso visible** | ✅ URLs restantes | ✅ N de N |

### 🎨 Flujo de Trabajo

```
📂 Leer JSON
   ↓
🔍 Tomar primera URL
   ↓
🆔 Extraer propertyId
   ↓
🚀 Ejecutar scraper (2-3 min)
   ↓
🔍 Buscar en DB
   ↓
🌐 Abrir HTML en navegador ← ⭐ AUTOMÁTICO
   ↓
💾 Backup JSON
   ↓
🗑️ Eliminar URL procesada
   ↓
📊 Mostrar resumen
```

---

## 🚀 Uso

### Procesamiento Normal

```bash
# Procesar siguiente URL
node 1iteradorurlinmuebles24.js
```

### Procesamiento Continuo

```bash
# Procesar todas las URLs (una por una)
while jq -e '.urls_nuevas | length > 0' 1depuracionurlinmuebles24.json > /dev/null; do
    node 1iteradorurlinmuebles24.js
    echo ""
    echo "⏸️  Presiona Enter para continuar con la siguiente..."
    read
done
```

---

## 📊 Output Esperado

### Caso: Scraping Exitoso

```
╔═══════════════════════════════════════════════════════════════╗
║  🔄 ITERADOR DE SCRAPING - INMUEBLES24                      ║
╚═══════════════════════════════════════════════════════════════╝

📂 Cargando URLs pendientes...
   ✅ 28 URLs pendientes

📍 URL seleccionada:
   https://www.inmuebles24.com/.../interlomas-147916704.html

🆔 Property ID detectado: 147916704

════════════════════════════════════════════════════════════════
🚀 EJECUTANDO SCRAPER
════════════════════════════════════════════════════════════════
📍 URL: https://www.inmuebles24.com/.../interlomas-147916704.html

[... output del scraper ...]

✅ Scraping completado exitosamente

🔍 Buscando propiedad en la base de datos...
   ✅ Propiedad encontrada: Casa en Venta en Fraccionamiento Interlomas
   📝 Slug: casa-en-venta-en-fraccionamiento-interlomas
   📄 HTML: culiacan/casa-en-venta-en-fraccionamiento-interlomas/index.html

🌐 Abriendo en el navegador...
   📄 culiacan/casa-en-venta-en-fraccionamiento-interlomas/index.html
   ✅ HTML abierto en el navegador

🗑️ Eliminando URL procesada del JSON...
💾 Backup creado: 1depuracionurlinmuebles24.json.bak-2025-10-26T18-30-00-000Z
   ✅ URL eliminada
   📊 URLs restantes: 27

════════════════════════════════════════════════════════════
📊 RESUMEN
════════════════════════════════════════════════════════════
✅ URL procesada: https://www.inmuebles24.com/.../interlomas-147916704.html
🆔 Property ID: 147916704
📄 HTML: culiacan/casa-en-venta-en-fraccionamiento-interlomas/index.html
🌐 Abierto en navegador: Sí
📊 URLs restantes: 27

💡 Ejecuta nuevamente el script para procesar la siguiente URL
```

### Caso: Duplicado Detectado

```
✅ Scraping completado exitosamente

🔍 Buscando propiedad en la base de datos...
⚠️  No se encontró la propiedad en la base de datos
   (Esto es normal si ya existía como duplicado)

🗑️ Eliminando URL procesada del JSON...
💾 Backup creado: 1depuracionurlinmuebles24.json.bak-2025-10-26T18-32-00-000Z
   ✅ URL eliminada
   📊 URLs restantes: 26

════════════════════════════════════════════════════════════
📊 RESUMEN
════════════════════════════════════════════════════════════
✅ URL procesada: https://www.inmuebles24.com/.../casa-146818616.html
🆔 Property ID: 146818616
📄 HTML: N/A
🌐 Abierto en navegador: No (duplicado o no encontrado)
📊 URLs restantes: 26
```

### Caso: Sin URLs Pendientes

```
╔═══════════════════════════════════════════════════════════════╗
║  🔄 ITERADOR DE SCRAPING - INMUEBLES24                      ║
╚═══════════════════════════════════════════════════════════════╝

📂 Cargando URLs pendientes...

ℹ️  No hay URLs pendientes para procesar
```

---

## 🔧 Manejo de Errores

### Si el scraper falla:

```
❌ ERROR: El scraper terminó con código de salida 1

💡 La URL NO fue eliminada del JSON
   Puedes intentar nuevamente cuando se resuelva el problema
```

**Acción:** Corregir el problema y ejecutar nuevamente. La URL seguirá en el JSON.

---

## 📁 Archivos Generados

### Backups Automáticos

Cada vez que se procesa una URL, se crea un backup:

```
1depuracionurlinmuebles24.json.bak-2025-10-26T18-30-00-000Z
1depuracionurlinmuebles24.json.bak-2025-10-26T18-32-15-123Z
1depuracionurlinmuebles24.json.bak-2025-10-26T18-35-42-456Z
...
```

**Formato:** `1depuracionurlinmuebles24.json.bak-<ISO-8601-timestamp>`

### Limpieza de Backups

```bash
# Eliminar backups antiguos (mantener últimos 10)
ls -t 1depuracionurlinmuebles24.json.bak-* | tail -n +11 | xargs rm -f
```

---

## 🎯 Casos de Uso

### 1. Procesar con revisión manual

Ideal para validar cada propiedad antes de continuar:

```bash
node 1iteradorurlinmuebles24.js
# Revisar HTML en navegador
# Verificar datos, fotos, geocodificación
# Presionar Enter para continuar
node 1iteradorurlinmuebles24.js
```

### 2. Procesar batch con pausas

```bash
# Procesar 10 URLs, pausa de 5 min entre cada una
for i in {1..10}; do
    node 1iteradorurlinmuebles24.js
    echo "⏸️  Esperando 5 minutos..."
    sleep 300
done
```

### 3. Reanudar después de interrupción

Si interrumpes el proceso (Ctrl+C), el JSON mantiene las URLs pendientes:

```bash
# Ver cuántas quedaron
jq '.urls_nuevas | length' 1depuracionurlinmuebles24.json

# Continuar desde donde quedó
node 1iteradorurlinmuebles24.js
```

---

## 🔍 Verificación de Progreso

```bash
# URLs restantes
jq '.urls_nuevas | length' 1depuracionurlinmuebles24.json

# Ver siguiente URL
jq -r '.urls_nuevas[0].url' 1depuracionurlinmuebles24.json

# Ver todas las URLs restantes
jq -r '.urls_nuevas[].url' 1depuracionurlinmuebles24.json
```

---

## 🆚 Comparación con Otros Scripts

| Script | Propósito | Velocidad | Control | Apertura Navegador |
|--------|-----------|-----------|---------|-------------------|
| **1iteradorurlinmuebles24.js** | Una URL a la vez | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Automática |
| **1orquestadorurlinmuebles24.js** | Batch completo | ⭐⭐⭐⭐⭐ | ⭐⭐ | ❌ Manual |
| **1depuracioninmuebles24.js** | Batch con progreso | ⭐⭐⭐⭐ | ⭐⭐⭐ | ❌ Manual |

---

## 💡 Tips

1. **Verifica el HTML abierto** antes de continuar con la siguiente URL
2. **Usa los backups** si necesitas recuperar el JSON original
3. **Interrumpe con Ctrl+C** si necesitas pausar (la URL actual NO se elimina)
4. **Monitorea el output** del scraper para detectar errores temprano

---

## 📚 Documentación Relacionada

- `1extractorurlinmuebles24.js` - Extractor de URLs
- `1auditorurlinmuebles24.js` - Auditor de duplicados
- `1orquestadorurlinmuebles24.js` - Orquestador batch
- `inmuebles24culiacanscraper.js` - Scraper principal

