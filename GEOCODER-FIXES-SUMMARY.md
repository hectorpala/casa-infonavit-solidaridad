# Correcciones del Sistema de Geocodificación
**Fecha:** Octubre 2025
**Problema:** Propiedades con coordenadas incorrectas o idénticas debido a fallas en el matching de colonias

## 🔍 Problema Identificado

**Síntomas:**
- 4 propiedades compartiendo coordenadas idénticas (24.8116, -107.3949)
- Colonias existentes en el gazetteer no siendo detectadas
- Uso de fallback coordinates genéricos de Inmuebles24

**Propiedades afectadas:**
1. Casa en Rancho o Rancheria La Guasima (rural - ignorar)
2. Casa en Rosales → No matcheaba con "Antonio Rosales"
3. Casa en Adolfo Lopez Mateos → No matcheaba con "Adolfo López Mateos"
4. Casa en Fraccionamiento Terranova → No matcheaba con "Terranova"

**Root cause:**
1. Normalizer no eliminaba prefijos como "Casa en", "Fraccionamiento"
2. Geocoder no hacía matching parcial ("Rosales" vs "Antonio Rosales")
3. Normalización de acentos solo para matching, no para nombres

---

## ✅ Correcciones Aplicadas

### 1. **Mejoras al Normalizer** (`geo-address-normalizer.js`)

**Líneas modificadas:** 270-292

**Cambios:**
```javascript
// ANTES: Solo limpiaba "Fracc.", "Col."
let neighborhood = part
    .replace(/^(Fracc\.|Col\.|Fraccionamiento|Colonia)\s+/i, '')
    .trim();

// AHORA: Limpia múltiples prefijos comunes
let neighborhood = part
    .replace(/^(Fracc\.|Col\.|Fraccionamiento|Colonia|Residencial)\s+/i, '')
    .replace(/^(Casa|Departamento|Depa|Local|Terreno)\s+(en|de)\s+/i, '')  // ⭐ NUEVO
    .replace(/^(en|de)\s+/i, '')  // ⭐ NUEVO
    .trim();
```

**Resultado:**
- ✅ "Casa en Rosales" → "Rosales"
- ✅ "Casa en Adolfo Lopez Mateos" → "Adolfo Lopez Mateos"
- ✅ "Casa en Fraccionamiento Terranova" → "Terranova"

---

### 2. **Matching Parcial en Geocoder** (`geo-geocoder-culiacan.js`)

**Líneas añadidas:** 144-204

**Nueva función `_findPartialMatch()`:**
```javascript
_findPartialMatch(searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    const searchSlug = searchTerm
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Eliminar acentos
        .replace(/\s+/g, '-');

    const colonias = this.gazetteer.data.colonias;

    for (const colonia of colonias) {
        const coloniaLower = colonia.nombre.toLowerCase();
        const coloniaSlug = colonia.nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');

        // Si el término está contenido en el nombre de la colonia
        if (coloniaLower.includes(searchLower) || coloniaSlug.includes(searchSlug)) {
            return colonia;
        }

        // Si el nombre de la colonia está contenido en el término
        if (searchLower.includes(coloniaLower) || searchSlug.includes(coloniaSlug)) {
            return colonia;
        }
    }

    return null;
}
```

**Integración en `matchColonia()`:**
```javascript
// Intento 3: Matching parcial (NUEVO)
const partialMatch = this._findPartialMatch(neighborhood);
if (partialMatch) {
    console.log(`   ✅ Match parcial: "${neighborhood}" → "${partialMatch.nombre}"`);
    return {
        ...partialMatch,
        matchScore: 0.85,
        matchType: 'partial'
    };
}
```

**Orden de matching ahora:**
1. Búsqueda exacta por slug
2. Búsqueda exacta por nombre
3. **Matching parcial** ⭐ NUEVO
4. Fuzzy matching (Levenshtein)

**Resultado:**
- ✅ "Rosales" → "Antonio Rosales" (85% match)
- ✅ "Lopez" → "López" (normalización de acentos)
- ✅ "Terranova" → "Terranova" (85% match)

---

## 🧪 Validación

**Script de test:** `test-geocoder-fixes.js`

**Resultados:**

| Test | Input | Output | Match Type | Score | Status |
|------|-------|--------|------------|-------|--------|
| 1 | "Casa en Rosales" | Antonio Rosales | partial | 85% | ✅ |
| 2 | "Casa en Adolfo Lopez Mateos" | Adolfo López Mateos | exact-slug | 100% | ✅ |
| 3 | "Casa en Fracc. Terranova" | Terranova | partial | 85% | ✅ |

**Comando:**
```bash
node test-geocoder-fixes.js
```

---

## 📊 Impacto

**Antes:**
- Colonias existentes no detectadas → fallback a coordenadas genéricas
- Múltiples propiedades con coordenadas idénticas (24.8116, -107.3949)
- Precisión marcada como "street" cuando en realidad era "city"

**Después:**
- ✅ Colonias detectadas correctamente con matching parcial
- ✅ Coordenadas de centroides específicos cuando están disponibles
- ✅ Fallback a centroide de ciudad (no coordenadas genéricas)
- ✅ Precisión marcada correctamente como "neighborhood"

---

## 📝 Archivos Modificados

1. **`geo-address-normalizer.js`**
   - Líneas 270-292: Mejora limpieza de prefijos en `_extractComponents()`

2. **`geo-geocoder-culiacan.js`**
   - Líneas 110-166: Actualización de `matchColonia()` con matching parcial
   - Líneas 168-204: Nueva función `_findPartialMatch()`

3. **`test-geocoder-fixes.js`** (NUEVO)
   - Script de validación de correcciones

---

## 🔮 Próximos Pasos (Opcional)

**Mejoras potenciales:**
1. Agregar más centroides específicos de colonias al gazetteer
2. Mejorar fuzzy matching con algoritmo Jaro-Winkler (mejor para nombres propios)
3. Agregar variaciones comunes de nombres de colonias (ej: "Infonavit" vs "INFONAVIT")

**Mantenimiento:**
- Las correcciones son **backward compatible**
- No requiere re-procesar propiedades existentes
- Aplica automáticamente a todas las nuevas propiedades scrapeadas

---

## ✅ Conclusión

El sistema de geocodificación ahora tiene:
- ✅ Mejor limpieza de direcciones (normalizer)
- ✅ Matching parcial para nombres de colonias (geocoder)
- ✅ Normalización de acentos automática
- ✅ Orden de matching más inteligente (exacto → parcial → fuzzy)

**Estado:** FUNCIONANDO CORRECTAMENTE ✅
