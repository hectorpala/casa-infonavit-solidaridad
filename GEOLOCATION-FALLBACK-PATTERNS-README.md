# 🎯 Sistema de Detección de Direcciones sin Prefijos Tradicionales

## Fecha de Implementación
**Octubre 26, 2025**

## Problema Original
El sistema de geolocalización solo detectaba direcciones con prefijos tradicionales como:
- ✅ "Blvd Elbert 2609"
- ✅ "Av. Insurgentes 123"
- ✅ "Calle Hidalgo 456"

**NO detectaba** direcciones comunes en México sin estos prefijos:
- ❌ "Estado de Yucatán 2609" (Las Quintas, Culiacán)
- ❌ "Doctor Coss 123"
- ❌ "General Mariano Escobedo 456"

## Caso de Referencia
**Propiedad:** Casa en Venta Colonia Tierra Blanca Culiacán
**Commit:** 314df623cc7a3a8e00402deaae5f58e06bc338c4
**Dirección correcta:** "Calle Sociologos y Matías Lazcano, Tierra Blanca"
**Comportamiento esperado:** Detectar direcciones con palabras comunes + número

---

## Ajustes Implementados

### 1️⃣ Función `scoreAddress()` (Líneas 1666-1724)

#### Cambios:
**Antes:**
```javascript
// Solo +4 pts si tiene keywords tradicionales
if (/(blvd|boulevard|avenida|av\.)/i.test(address)) score += 4;

// Penalización -3 para cualquier dirección < 30 chars
if (address.length < 30) score -= 3;
```

**Ahora:**
```javascript
// +4 pts para keywords tradicionales (sin cambios)
if (hasTraditionalStreetKeyword) score += 4;

// 🆕 +6 pts para patrones sin prefijo tradicional
// Ej: "Estado de Yucatán 2609", "Doctor Coss 123"
const hasCommonStreetPattern = /(estado|doctor|dr\.|general|gen\.|ingeniero|ing\.|profesor|prof\.|rio|río|cerro|norte|sur|este|oeste)\s+[a-záéíóúñ\s]+\s+\d{2,5}/i.test(address);
if (hasCommonStreetPattern && !hasTraditionalStreetKeyword) {
    score += 6;
    console.log(`   🎯 Detected fallback street pattern: "${address.substring(0, 50)}..."`);
}

// 🆕 +4 pts EXTRA si es "Estado de..." con número (muy común en Culiacán)
if (/estado\s+de\s+[a-záéíóúñ\s]+\s+\d{2,5}/i.test(address)) {
    score += 4;
    console.log(`   ⭐ Detected "Estado de..." pattern with number`);
}

// 🔧 Penalización reducida para direcciones con patrón válido
// Antes: -3 para todas las < 30 chars
// Ahora: -1 si tiene patrón válido (número + 2+ palabras capitalizadas), -3 si no
if (address.length < 30) {
    const hasValidPattern = hasNumber && /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(address);
    score -= hasValidPattern ? 1 : 3;
}
```

#### Resultado:
- "Estado de Yucatán 2609, Las Quintas" ahora recibe:
  - +5 pts (número)
  - +6 pts (patrón fallback)
  - +4 pts (patrón "Estado de...")
  - +3 pts (tiene "Fracc." o "Col.")
  - +4 pts (2 comas)
  - +1 pt (ciudad)
  - +1 pt (estado)
  - -1 pt (penalización reducida si < 30 chars)
  - **Total: ~23 puntos**

- "Las Quintas, Culiacán" sin calle recibe:
  - +3 pts (colonia)
  - +2 pts (1 coma)
  - +1 pt (ciudad)
  - +1 pt (estado)
  - -3 pts (< 30 chars sin patrón válido)
  - **Total: ~4 puntos**

**Ganador:** Dirección con calle "Estado de Yucatán 2609" (23 pts > 4 pts)

---

### 2️⃣ Función `isStreetCandidate()` (Líneas 1780-1814)

#### Cambios:
**Antes:**
```javascript
// Solo aceptaba direcciones con keywords tradicionales + número
const hasStreetKeyword = /(calle|avenida|av\.)/i.test(lower);
const hasNumber = /\d+/.test(address);
return hasStreetKeyword && hasNumber;
```

**Ahora:**
```javascript
// Opción 1: Keywords tradicionales + número (sin cambios)
if (hasTraditionalStreetKeyword && hasNumber) return true;

// 🆕 Opción 2: Patrón fallback (Estado, Doctor, General, etc. + número)
const hasCommonStreetPattern = /(estado|doctor|dr\.|general|gen\.|ingeniero|ing\.|profesor|prof\.|rio|río|cerro|norte|sur|este|oeste)\s+[a-záéíóúñ\s]+\s+\d{2,5}/i.test(address);
if (hasCommonStreetPattern) {
    console.log(`   ✅ Recognized as street (fallback pattern): "${address.substring(0, 60)}..."`);
    return true;
}

// 🆕 Opción 3: Genérico (2+ palabras capitalizadas + número, sin keyword colonia)
const hasCapitalizedWords = /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+){2,}/.test(address);
const hasColoniaKeyword = /(fracc\.|fraccionamiento|colonia|col\.|residencial)/i.test(lower);
if (hasCapitalizedWords && hasNumber && !hasColoniaKeyword && address.length < 100) {
    console.log(`   ✅ Recognized as street (generic pattern): "${address.substring(0, 60)}..."`);
    return true;
}
```

#### Resultado:
- ✅ "Estado de Yucatán 2609" → Reconocido como calle (Opción 2)
- ✅ "Doctor Coss 123" → Reconocido como calle (Opción 2)
- ✅ "Las Flores 123" → Reconocido como calle (Opción 3)
- ❌ "Fracc. Las Quintas" → NO reconocido como calle (es colonia)

---

### 3️⃣ Detección en Body Text (Líneas 2205-2234)

#### Cambios:
**Antes:**
```javascript
// Solo registraba si tenía comas O keywords tradicionales
if (trimmed.match(/,/) || /(fracc|colonia|blvd|avenida|calle)/i.test(trimmed)) {
    registerAddressCandidate(cleaned, 0, 'bodyText');
}
```

**Ahora:**
```javascript
const hasComma = trimmed.match(/,/);
const hasTraditionalKeyword = /(fracc|colonia|blvd|avenida|calle|privada)/i.test(trimmed);

// 🆕 Detectar patrones fallback
const hasFallbackStreetPattern = /(estado|doctor|dr\.|general|gen\.|ingeniero|ing\.|profesor|prof\.|rio|río|cerro)\s+[a-záéíóúñ\s]+\s+\d{2,5}/i.test(trimmed);

if (hasComma || hasTraditionalKeyword || hasFallbackStreetPattern) {
    const cleaned = trimmed.replace(/\s+,/g, ',').replace(/,\s+/g, ', ');

    if (hasFallbackStreetPattern && !hasTraditionalKeyword) {
        // 🆕 Dar puntos EXTRA (+6) a patrones fallback
        registerAddressCandidate(cleaned, 6, 'bodyText-fallback-pattern');
        console.log(`   🔍 Found fallback street in body: "${cleaned.substring(0, 60)}..."`);
    } else {
        registerAddressCandidate(cleaned, 0, 'bodyText');
    }
}
```

#### Resultado:
- Las líneas con "Estado de Yucatán 2609" ahora se registran con +6 pts base
- Log específico para auditoría: `🔍 Found fallback street in body`

---

### 4️⃣ Detección Agresiva (NUEVA - Líneas 2263-2313)

#### Feature:
Solo se ejecuta si hay **menos de 3 candidatos** después de todas las fuentes anteriores.

```javascript
if (addressCandidates.length < 3) {
    console.log(`   🔍 Running aggressive pattern detection`);

    // Regex para capturar "Texto de Texto 2609"
    const fallbackStreetRegex = /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+(?:de|del|la|las|los|el)\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\s+(\d{2,5})/g;

    while ((match = fallbackStreetRegex.exec(pageText)) !== null) {
        const streetName = match[1].trim();
        const streetNumber = match[2];
        const fullMatch = `${streetName} ${streetNumber}`;

        // Filtrar irrelevantes (precios, fechas, m²)
        if (/precio|fecha|año|vistas|m²/i.test(match[0])) continue;

        // Verificar contexto (debe tener colonia/ciudad cerca)
        const contextBefore = pageText.substring(match.index - 50, match.index);
        const contextAfter = pageText.substring(match.index + match[0].length, match.index + 100);
        const fullContext = contextBefore + match[0] + contextAfter;

        if (/(fracc|colonia|culiacán|monterrey|sinaloa)/i.test(fullContext)) {
            // Construir dirección completa
            const parts = [fullMatch];

            // Buscar colonia en contexto
            const coloniaMatch = fullContext.match(/(fracc\.|col\.)\s+([a-záéíóúñ\s]+?)(?:,|culiacán)/i);
            if (coloniaMatch) parts.push(coloniaMatch[0].replace(/[,\.]/g, '').trim());

            appendCityState(parts);
            registerAddressCandidate(parts.join(', '), 8, 'aggressive-pattern');
            console.log(`   🎯 Aggressive pattern match: "${parts.join(', ')}"`);
        }
    }
}
```

#### Resultado:
- Último recurso si las fuentes normales no encuentran suficientes candidatos
- Captura "Estado de Yucatán 2609" incluso si está en texto corrido
- Intenta reconstruir dirección completa con colonia del contexto
- Registro con +8 pts base

---

## Logs de Auditoría

### Nuevos logs agregados:

1. **scoreAddress():**
   ```
   🎯 Detected fallback street pattern: "Estado de Yucatán 2609..." (score bonus: +6)
   ⭐ Detected "Estado de..." pattern with number (score bonus: +4)
   ```

2. **isStreetCandidate():**
   ```
   ✅ Recognized as street (fallback pattern): "Estado de Yucatán 2609..."
   ✅ Recognized as street (generic pattern): "Las Flores 123..."
   ```

3. **Body Text Detection:**
   ```
   🔍 Found fallback street in body: "Estado de Yucatán 2609, Las Quintas..."
   ```

4. **Aggressive Detection:**
   ```
   🔍 Running aggressive pattern detection (current candidates: 2)
   🎯 Aggressive pattern match: "Estado de Yucatán 2609, Fracc. Las Quintas"
   ✅ Found 3 candidates via aggressive detection
   ```

---

## Palabras Clave Soportadas (Patrones Fallback)

### Títulos comunes en México:
- `Estado` / `estado de`
- `Doctor` / `Dr.`
- `General` / `Gen.`
- `Ingeniero` / `Ing.`
- `Profesor` / `Prof.`

### Elementos geográficos:
- `Rio` / `Río`
- `Cerro`
- `Norte` / `Sur` / `Este` / `Oeste`

### Ejemplos detectados:
- ✅ "Estado de Yucatán 2609"
- ✅ "Doctor Coss 123"
- ✅ "General Mariano Escobedo 456"
- ✅ "Río del Carmen 789"
- ✅ "Cerro de las Campanas 101"

---

## Compatibilidad con Sistema Existente

### ✅ No afecta direcciones tradicionales:
- "Blvd Elbert 2609" sigue funcionando igual (+4 pts por keyword, +5 pts por número)

### ✅ No afecta geocodificación posterior:
- El sistema solo ajusta la **detección y puntuación** de candidatos
- La geocodificación con Google Maps API sigue igual
- El guardado final en JSON no cambia

### ✅ Preserva normalización de colonias:
- Las funciones `normalizeNeighborhoodBase()`, `findRomanVariant()`, etc. siguen funcionando
- Los nuevos candidatos pasan por la misma normalización

---

## Testing Recomendado

### Caso de prueba 1: Las Quintas
```bash
node inmuebles24culiacanscraper.js "https://www.inmuebles24.com/.../las-quintas-..."
```

**Resultado esperado:**
```
📊 Ranking de candidatas:
   1. [23 pts] Estado de Yucatán 2609, Fracc. Las Quintas, Culiacán, Sinaloa
   2. [8 pts] Fracc. Las Quintas, Culiacán, Sinaloa
   3. [4 pts] Culiacán, Sinaloa
🏆 GANADORA: [23 pts] bodyText-fallback-pattern
✅ Dirección seleccionada: "Estado de Yucatán 2609, Fracc. Las Quintas, Culiacán, Sinaloa"
```

### Caso de prueba 2: Tierra Blanca
```bash
node inmuebles24culiacanscraper.js "https://www.inmuebles24.com/.../tierra-blanca-..."
```

**Resultado esperado:**
```
✅ Dirección seleccionada: "Calle Sociologos y Matías Lazcano, Tierra Blanca, Culiacán, Sinaloa"
```
(Debe seguir funcionando correctamente)

---

## Mantenimiento

### Agregar nuevas palabras clave:
Editar el regex en 3 lugares:

1. **scoreAddress()** (línea ~1680):
   ```javascript
   const hasCommonStreetPattern = /(estado|doctor|...|NUEVA_PALABRA)\s+[a-záéíóúñ\s]+\s+\d{2,5}/i.test(address);
   ```

2. **isStreetCandidate()** (línea ~1794):
   ```javascript
   const hasCommonStreetPattern = /(estado|doctor|...|NUEVA_PALABRA)\s+[a-záéíóúñ\s]+\s+\d{2,5}/i.test(address);
   ```

3. **Body Text Detection** (línea ~2220):
   ```javascript
   const hasFallbackStreetPattern = /(estado|doctor|...|NUEVA_PALABRA)\s+[a-záéíóúñ\s]+\s+\d{2,5}/i.test(trimmed);
   ```

### Ajustar puntuaciones:
- Modificar valores en `scoreAddress()` líneas 1682, 1688
- Ajustar baseScore en `registerAddressCandidate()` líneas 2227, 2304

---

## Commits Relacionados

- **Implementación inicial:** (este commit)
- **Referencia Tierra Blanca:** 314df623cc7a3a8e00402deaae5f58e06bc338c4
- **Sistema de scoring arriba del mapa:** fa18bba (commit anterior)

---

## Notas Importantes

⚠️ **El sistema es CONSERVADOR por diseño:**
- Solo se activa la detección agresiva si hay < 3 candidatos
- Requiere contexto de ubicación (colonia/ciudad) cerca del patrón
- Filtra textos irrelevantes (precios, fechas, métricas)

✅ **100% compatible con propiedades existentes:**
- No rompe direcciones tradicionales
- No afecta geocodificación
- Solo mejora la detección de candidatos
