# FIX: Photo Count Bug - Lote 7

## PROBLEMA IDENTIFICADO

**Fecha:** 2025-10-17
**Lote Afectado:** Lote 7 (propiedad Las Quintas $5.6M)

### Síntoma
Al abrir el mapa modal y hacer clic en la propiedad "Casa en Quinta Americana sector Las Quintas", las fotos 1-33 se veían bien, pero las fotos 34-112 aparecían rotas (404).

### Causa Raíz
El script de extracción `/tmp/extract-lote7-full.js` contaba **ocurrencias en HTML** en vez de **archivos reales en disco**:

```javascript
// ❌ CÓDIGO INCORRECTO (líneas 35-37 del script original)
const photoRegex = new RegExp('images/foto-\\d+\\.jpg', 'g');
const photoMatches = html.match(photoRegex);
const photoCount = photoMatches ? photoMatches.length : 0;
```

**Por qué fallaba:**
- La regex `images/foto-\d+\.jpg` busca en TODO el HTML
- Las fotos aparecen múltiples veces:
  - En Schema.org JSON-LD
  - En el carrusel del hero
  - En la galería lightbox
  - En diferentes secciones
- Resultado: Contaba 112 ocurrencias cuando solo existían 33 archivos

### Impacto
- Propiedad `quintaamericanasectorlasquintasProperty` tenía array de 112 fotos
- Solo existían 33 fotos reales en `culiacan/casa-en-venta-en-quinta-americana-sector-las-quintas/images/`
- Fotos 34-112 generaban errores 404 en el navegador

---

## SOLUCIÓN APLICADA

### 1. Fix Inmediato - Reparar La Propiedad Las Quintas

**Script:** `/tmp/fix-quintas-photos.js`

```javascript
const fs = require('fs');

const htmlPath = 'culiacan/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8');

// Generar array correcto con solo 33 fotos
const correctPhotos = [];
for (let i = 1; i <= 33; i++) {
    correctPhotos.push(`"casa-en-venta-en-quinta-americana-sector-las-quintas/images/foto-${i}.jpg"`);
}
const correctPhotoArray = correctPhotos.join(',');

// Encontrar y reemplazar solo el array de fotos
const propertyStart = html.indexOf('const quintaamericanasectorlasquintasProperty = {');
const photosStart = html.indexOf('photos: [', propertyStart);
const photosEnd = html.indexOf(']', photosStart) + 1;
const closingBrace = html.indexOf('};', photosEnd);

const before = html.substring(0, photosStart);
const after = html.substring(closingBrace);

const correctedPhotosSection = `photos: [\n                    ${correctPhotoArray}\n                ]\n            `;

const corrected = before + correctedPhotosSection + after;

fs.writeFileSync(htmlPath, corrected, 'utf-8');

console.log('✅ Fixed Las Quintas property - reduced from 112 to 33 photos');
```

**Resultado:**
- Array reducido de 112 a 33 fotos
- Todas las fotos ahora existen en disco
- No más errores 404

### 2. Script Corregido - Prevenir Futuro Errores

**Archivo:** `/tmp/extract-properties-fixed.js`

```javascript
// ✅ CORRECCIÓN: Contar archivos REALES en el directorio images/
let photoCount = 0;
if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    // Filtrar solo archivos que coincidan con el patrón foto-N.jpg
    const photoFiles = files.filter(f => /^foto-\d+\.jpg$/.test(f));
    photoCount = photoFiles.length;
}
```

**Ventajas:**
1. ✅ Lee el directorio `images/` directamente
2. ✅ Cuenta archivos reales en disco
3. ✅ Filtra solo archivos `foto-N.jpg`
4. ✅ Ignora duplicados en HTML
5. ✅ 100% preciso

**Uso:**
```bash
node /tmp/extract-properties-fixed.js casa-en-venta-en-quinta-americana-sector-las-quintas
```

**Output:**
```
Extrayendo datos de: casa-en-venta-en-quinta-americana-sector-las-quintas

Slug: casa-en-venta-en-quinta-americana-sector-las-quintas
Variable: quintaamericanasectorlasquintasProperty
Título: Casa en venta en Quinta Americana sector Las Quintas
Precio: $5,600,000 ($5.6M)
Ubicación: Las Quintas, Culiacán
Fotos: 33 (contadas en disco)
```

---

## VERIFICACIÓN

### Comandos de Verificación

**1. Contar fotos reales en disco:**
```bash
ls "culiacan/casa-en-venta-en-quinta-americana-sector-las-quintas/images/" | grep "foto-" | wc -l
# Output: 33
```

**2. Verificar última foto en array HTML:**
```bash
awk '/const quintaamericanasectorlasquintasProperty/,/\]/' culiacan/index.html | grep -o 'foto-[0-9]*\.jpg' | tail -1
# Output: foto-33.jpg
```

**3. Extraer datos con script corregido:**
```bash
node /tmp/extract-properties-fixed.js casa-en-venta-en-quinta-americana-sector-las-quintas
# Output: Fotos: 33 (contadas en disco)
```

**4. Probar en navegador:**
```bash
open "culiacan/index.html"
# Click en "Ver en Mapa" → Click en marcador Las Quintas
# Verificar que todas las fotos cargan correctamente
```

---

## LECCIONES APRENDIDAS

### ❌ NO HACER
```javascript
// NO contar ocurrencias en HTML
const photoRegex = new RegExp('images/foto-\\d+\\.jpg', 'g');
const photoMatches = html.match(photoRegex);
const photoCount = photoMatches ? photoMatches.length : 0;
```

### ✅ HACER
```javascript
// SÍ contar archivos reales en disco
const imagesDir = 'culiacan/' + slug + '/images/';
const files = fs.readdirSync(imagesDir);
const photoFiles = files.filter(f => /^foto-\d+\.jpg$/.test(f));
const photoCount = photoFiles.length;
```

---

## PREVENCIÓN FUTURA

### 1. Usar el Script Corregido
Para TODOS los lotes futuros (Lote 8, 9, 10, etc.), usar:
```bash
node /tmp/extract-properties-fixed.js [slug]
```

### 2. Validación Automática
Antes de agregar una propiedad al mapa modal, verificar:
```bash
# Contar fotos en disco
DISK_COUNT=$(ls "culiacan/[slug]/images/" | grep "foto-" | wc -l)

# Contar fotos en array HTML
HTML_COUNT=$(awk '/const [varName]Property/,/\]/' culiacan/index.html | grep -o 'foto-[0-9]*\.jpg' | wc -l)

# Comparar
if [ "$DISK_COUNT" != "$HTML_COUNT" ]; then
    echo "ERROR: Mismatch! Disk: $DISK_COUNT, HTML: $HTML_COUNT"
fi
```

### 3. Checklist Pre-Deploy
Antes de cada "publica ya":
- [ ] Contar fotos en disco
- [ ] Verificar array en HTML coincide
- [ ] Probar mapa modal localmente
- [ ] Verificar que todas las fotos cargan (no 404)

---

## HISTORIAL DE CAMBIOS

### 2025-10-17 - Fix Aplicado
- ✅ Corregida propiedad Las Quintas (112→33 fotos)
- ✅ Creado `/tmp/extract-properties-fixed.js`
- ✅ Verificado funcionamiento correcto
- ✅ Documentado en `FIX-PHOTO-COUNT-BUG.md`

### Propiedades Afectadas
- `quintaamericanasectorlasquintasProperty` (Lote 6, posición 32)
  - Antes: 112 fotos en HTML, 33 en disco
  - Ahora: 33 fotos en HTML, 33 en disco ✅

### Propiedades a Revisar (Opcional)
Verificar si otros lotes tienen el mismo problema:
```bash
# Lote 1 (posiciones 1-5)
# Lote 2 (posiciones 6-10)
# Lote 3 (posiciones 11-15)
# Lote 4 (posiciones 16-20)
# Lote 5 (posiciones 21-25)
# Lote 6 (posiciones 26-30)
# Lote 7 (posiciones 31-35) ← Verificado y corregido
```

---

## RESUMEN EJECUTIVO

**Problema:** Script contaba HTML en vez de archivos → 112 fotos en vez de 33
**Solución:** Reemplazar con `fs.readdirSync()` para contar archivos reales
**Resultado:** Array correcto con 33 fotos, todas funcionan ✅
**Prevención:** Usar `/tmp/extract-properties-fixed.js` para futuros lotes

**Estado:** RESUELTO ✅

---

**Última actualización:** 2025-10-17
**Autor:** Claude Code
**Commit relacionado:** (Pendiente de "publica ya")
