# 🚀 BATCH WIGGOT SCRAPER - Documentación

## 📋 Resumen

Sistema automatizado para scrapear múltiples propiedades de Wiggot en batch, validar duplicados contra CRM, generar páginas HTML y hacer commit automático.

## 🎯 Scripts Disponibles

### 1. ⭐ `batch-wiggot-urls.js` - **RECOMENDADO**

**Método más fácil y confiable.**

#### Ventajas:
- ✅ No requiere interacción con navegador
- ✅ Lee URLs desde archivo JSON
- ✅ Valida duplicados automáticamente
- ✅ Procesa en batch de 12 propiedades
- ✅ Auto-commit al final

#### Uso:

**Paso 1**: Crear archivo `urls-batch.json` con las URLs:
```json
{
  "urls": [
    "https://new.wiggot.com/search/property-detail/ABC123",
    "https://new.wiggot.com/search/property-detail/XYZ789",
    "https://new.wiggot.com/search/property-detail/QWE456"
  ]
}
```

**Paso 2**: Ejecutar:
```bash
node batch-wiggot-urls.js
```

**Resultado**:
- ✅ Scrapea solo propiedades nuevas (no duplicadas)
- ✅ Genera páginas HTML con generadorwiggot.js
- ✅ Descarga fotos en paralelo
- ✅ Crea commit automático con lista de IDs procesados

---

### 2. `batch-wiggot-timer.js` - **HÍBRIDO MANUAL/AUTO**

**Para usar la búsqueda de Wiggot y extraer IDs automáticamente.**

#### Ventajas:
- ✅ Login automático
- ✅ 60 segundos para búsqueda manual
- ✅ Extracción automática de propertyIds
- ✅ Validación de duplicados
- ✅ Auto-commit

#### Flujo:
1. 🤖 Script hace login automático
2. ⏰ 60 segundos para que TÚ hagas la búsqueda manualmente
3. 🤖 Script extrae propertyIds de los resultados
4. 🤖 Valida duplicados contra CRM
5. 🤖 Scrapea solo nuevas
6. 🤖 Auto-commit

#### Uso:
```bash
node batch-wiggot-timer.js
```

**Durante los 60 segundos**:
1. Ve a "Bolsa" en menú izquierdo
2. Escribe: "Culiacán Sinaloa"
3. Presupuesto: $0 - $6,000,000
4. Tipo: Casa
5. Click en lupa buscar
6. Espera a que carguen resultados

**Limitación**: La extracción de IDs puede fallar si Wiggot usa React dinámico (ver issue #1).

---

### 3. `batch-wiggot-simple.js` - **INPUT INTERACTIVO**

**Modo interactivo con readline.**

#### Ventajas:
- ✅ Pega URLs una por una en terminal
- ✅ Validación en tiempo real
- ✅ No requiere crear archivo JSON

#### Uso:
```bash
node batch-wiggot-simple.js
```

Pega URLs cuando se solicite (Enter 2 veces para terminar).

---

## 📊 Workflow Completo

### Opción A: Usando `batch-wiggot-urls.js` (Recomendado)

```bash
# 1. Crear urls-batch.json con las URLs de Wiggot
cat > urls-batch.json <<'EOF'
{
  "urls": [
    "https://new.wiggot.com/search/property-detail/pxPskTs",
    "https://new.wiggot.com/search/property-detail/pidIPNf"
  ]
}
EOF

# 2. Ejecutar batch scraper
node batch-wiggot-urls.js

# 3. Revisar resultado
git log -1
git push
```

### Opción B: Usando `batch-wiggot-timer.js` (Híbrido)

```bash
# 1. Ejecutar script
node batch-wiggot-timer.js

# 2. Login automático (10 segundos)

# 3. Tienes 60 segundos para hacer búsqueda manual en Wiggot

# 4. Script retoma control y procesa todo automáticamente

# 5. Revisar resultado
git log -1
git push
```

---

## 🔍 Validación de Duplicados

Todos los scripts validan contra `crm-propiedades.json`:

```javascript
{
  "slug": "casa-venta-...",
  "propertyId": "pYowL0a"  // ← Este ID se valida
}
```

Si el `propertyId` ya existe en CRM:
- ⚠️ Se marca como **DUPLICADA**
- ❌ **NO se scrapea** nuevamente
- ✅ Solo se procesan propiedades **NUEVAS**

---

## 📸 Descarga de Fotos

Las fotos se descargan en paralelo usando curl:

```bash
curl -s "https://media.wiggot.mx/..." -o "culiacan/casa-venta-.../images/foto-1.jpg"
curl -s "https://media.wiggot.mx/..." -o "culiacan/casa-venta-.../images/foto-2.jpg"
# ... etc
```

**Ventaja**: Descarga de 10-14 fotos en ~3 segundos en lugar de ~30 segundos secuencial.

---

## 🤖 Auto-Commit

Si hay propiedades exitosas, se crea commit automático:

```
Add: Batch 3 propiedades Wiggot

1. pxPskTs
2. pidIPNf
3. pIRoBFh

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## ⚠️ Issues Conocidos

### Issue #1: Extracción de IDs con Puppeteer

**Problema**: `batch-wiggot-timer.js` extrae 0 propertyIds a pesar de que hay resultados visibles.

**Causa**: Wiggot usa React/Next.js con rendering dinámico. Los links `property-detail/...` no están en el DOM de forma accesible.

**Workaround**: Usar `batch-wiggot-urls.js` con archivo JSON (método recomendado).

**Solución pendiente**: Investigar estructura DOM de Wiggot para encontrar selector correcto o usar API directa.

---

## 📄 Archivos Generados

Para cada propiedad exitosa:

```
wiggot-datos-[ID].json          # Datos scrapeados
culiacan/casa-venta-[slug]-[ID]/
  index.html                     # Página generada
  images/
    foto-1.jpg                   # Fotos descargadas
    foto-2.jpg
    ...
```

---

## 🎓 Ejemplos

### Ejemplo 1: Scrapear 3 propiedades

**urls-batch.json**:
```json
{
  "urls": [
    "https://new.wiggot.com/search/property-detail/pxPskTs",
    "https://new.wiggot.com/search/property-detail/pidIPNf",
    "https://new.wiggot.com/search/property-detail/pIRoBFh"
  ]
}
```

**Comando**:
```bash
node batch-wiggot-urls.js
```

**Output**:
```
🏠 BATCH WIGGOT URLS - Procesamiento desde JSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 URLs cargadas: 3

🔍 Extrayendo propertyIds...
1. ✅ pxPskTs <- https://new.wiggot.com/search/property-detail/pxPskTs
2. ✅ pidIPNf <- https://new.wiggot.com/search/property-detail/pidIPNf
3. ✅ pIRoBFh <- https://new.wiggot.com/search/property-detail/pIRoBFh

🤖 Validando duplicados contra CRM...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✅ pxPskTs - NUEVA
2. ⚠️  pidIPNf - DUPLICADA
3. ✅ pIRoBFh - NUEVA

✅ Nuevas: 2 | ⚠️  Duplicadas: 1

🤖 Scrapeando nuevas propiedades...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/2] pxPskTs...
   ✅ Scraping OK
   ✅ Página generada
   📸 Descargando 14 fotos...
   ✅ 14 fotos descargadas

[2/2] pIRoBFh...
   ✅ Scraping OK
   ✅ Página generada
   📸 Descargando 12 fotos...
   ✅ 12 fotos descargadas

📊 RESUMEN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Exitosas: 2
❌ Fallidas: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Creando commit...
✅ Commit creado
🚀 Ejecuta: git push
```

---

## 🚀 Recomendación Final

**Para uso diario**: `batch-wiggot-urls.js`

**Ventajas**:
- Sin navegador
- 100% confiable
- Rápido
- Fácil de usar

**Workflow**:
1. Navega en Wiggot manualmente
2. Copia URLs de propiedades interesantes
3. Pega en `urls-batch.json`
4. `node batch-wiggot-urls.js`
5. `git push`

**Tiempo total**: ~2-3 minutos para 12 propiedades.
