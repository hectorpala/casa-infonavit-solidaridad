# 🗺️ Código para Agregar Propiedades al Mapa Modal Automáticamente

## 📍 Función Principal: `addPropertyToMap()`

Esta función agrega automáticamente propiedades al mapa modal de Culiacán/Monterrey/Mazatlán cuando se scrapean de Inmuebles24.

### Ubicación en el código:
- **Archivo:** `inmuebles24culiacanscraper.js`
- **Líneas:** ~2408-2555 (aproximado, puede variar)
- **Llamada:** En `main()` después de generar HTML

### ✅ Correcciones Aplicadas (Octubre 2025)
- **Array de marcadores dinámico** - Usa `allCuliacanMarkers`, `allMonterreyMarkers`, o `allMazatlanMarkers` según ciudad
- **Patrones de inserción genéricos** - Funcionan en TODAS las ciudades (no solo Culiacán)
- **Fallback robusto** - 4 patrones de búsqueda para cada inserción (definición + marcador)

---

## 🔧 CÓDIGO COMPLETO

```javascript
function addPropertyToMap(data, slug, photoCount, cityConfig) {
    console.log(`🗺️  Agregando propiedad al mapa modal de ${cityConfig.name}...\n`);

    const indexPath = cityConfig.indexPath;
    let indexHtml = fs.readFileSync(indexPath, 'utf8');

    // ═══════════════════════════════════════════════════════════════════
    // PASO 1: Verificar que tengamos coordenadas del JSON-LD
    // ═══════════════════════════════════════════════════════════════════
    if (!data.latitude || !data.longitude) {
        console.log(`   ⚠️  No se encontraron coordenadas en JSON-LD`);
        console.log(`   ℹ️  La propiedad NO se agregará al mapa modal automáticamente`);
        console.log(`   ℹ️  Puedes agregarla manualmente después con coordenadas aproximadas\n`);
        return;
    }

    console.log(`   ✅ Coordenadas encontradas: ${data.latitude}, ${data.longitude}`);

    // ═══════════════════════════════════════════════════════════════════
    // PASO 2: Generar array de fotos dinámicamente
    // ═══════════════════════════════════════════════════════════════════
    const photosArray = [];
    for (let i = 1; i <= photoCount; i++) {
        photosArray.push(`"${slug}/images/foto-${i}.jpg"`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PASO 3: Formatear precio corto (ej: $3.55M, $2.5K)
    // ═══════════════════════════════════════════════════════════════════
    const priceNum = parseFloat(data.price.replace(/[^0-9.]/g, ''));
    const priceShort = priceNum >= 1000000
        ? `$${(priceNum / 1000000).toFixed(2)}M`.replace('.00M', 'M')
        : `$${(priceNum / 1000).toFixed(0)}K`;

    // ═══════════════════════════════════════════════════════════════════
    // PASO 4: Normalizar ubicación según ciudad
    // ═══════════════════════════════════════════════════════════════════
    const normalizedLocation = normalizeLocationForCity(data.location, cityConfig.name, cityConfig.state);
    const locationShort = normalizedLocation.primary;

    // ═══════════════════════════════════════════════════════════════════
    // PASO 5: Detectar tipo (RENTA o VENTA)
    // ═══════════════════════════════════════════════════════════════════
    const tipoPropiedad = data.price.toLowerCase().includes('renta') ||
                          data.title.toLowerCase().includes('renta') ? 'renta' : 'venta';

    // Variable name sanitizada (ej: casa-venta-solidaridad → casa_venta_solidaridad)
    const varName = slug.replace(/-/g, '_');

    // ═══════════════════════════════════════════════════════════════════
    // PASO 6: Generar código de definición de propiedad
    // ═══════════════════════════════════════════════════════════════════
    const newPropertyCode = `
            // ${tipoPropiedad.toUpperCase()}: ${data.title}
            const ${varName}Property = {
                address: "${normalizedLocation.mapLocation}",
                priceShort: "${priceShort}",
                priceFull: "${formatPrice(data.price)}",
                title: "${data.title}",
                location: "${normalizedLocation.display}",
                bedrooms: ${data.bedrooms || 'null'},
                bathrooms: ${data.bathrooms || 'null'},
                area: "${data.construction_area ? data.construction_area + 'm²' : 'N/D'}",
                type: "${tipoPropiedad}",
                url: "https://casasenventa.info/${cityConfig.folder}/${slug}/",
                whatsapp: "${cityConfig.whatsapp}",
                photos: [
                    ${photosArray.join(',\n                    ')}
                ]
            };
`;

    // ═══════════════════════════════════════════════════════════════════
    // PASO 7: Determinar variable del mapa según ciudad
    // ═══════════════════════════════════════════════════════════════════
    const mapVarName = cityConfig.city === 'monterrey' ? 'mapMonterrey' :
                       cityConfig.city === 'mazatlan' ? 'mapMazatlan' :
                       'mapCuliacan';

    // ═══════════════════════════════════════════════════════════════════
    // PASO 7.5: Determinar array de marcadores según ciudad (FIX MULTI-CIUDAD)
    // ═══════════════════════════════════════════════════════════════════
    const markersArrayName = cityConfig.city === 'monterrey' ? 'allMonterreyMarkers' :
                             cityConfig.city === 'mazatlan' ? 'allMazatlanMarkers' :
                             'allCuliacanMarkers';

    // ═══════════════════════════════════════════════════════════════════
    // PASO 8: Generar código del marcador con coordenadas EXACTAS
    // ═══════════════════════════════════════════════════════════════════
    // IMPORTANTE: Usa coordenadas del JSON-LD (más rápido que geocodificación)
    // CORREGIDO: Usa markersArrayName dinámico (no hardcodeado a Culiacán)
    const newMarkerCode = `
            // ${data.title} - Coordenadas exactas del JSON-LD
            const ${varName}Position = new google.maps.LatLng(${data.latitude}, ${data.longitude});
            const ${varName}MarkerClass = createZillowPropertyMarker(${varName}Property, window.${mapVarName});
            const ${varName}Marker = new ${varName}MarkerClass(${varName}Position, window.${mapVarName}, ${varName}Property);
            window.${markersArrayName}.push(${varName}Marker);
            console.log('Marcador ${data.title} (${tipoPropiedad.toUpperCase()}) creado en:', ${varName}Position.lat(), ${varName}Position.lng());
`;

    // ═══════════════════════════════════════════════════════════════════
    // PASO 9: Buscar punto de inserción para la DEFINICIÓN
    // ═══════════════════════════════════════════════════════════════════
    // PATRONES GENÉRICOS que funcionan en TODAS las ciudades + FALLBACK ROBUSTO
    const patterns = [
        // Patrón 1: Buscar cualquier propiedad existente (RENTA o VENTA)
        /(\s+)\/\/ (RENTA|VENTA):/,
        // Patrón 2: Buscar const *Property = {
        /(\s+)const \w+Property = \{/,
        // Patrón 3: Buscar comentario de geocodificación
        /(\s+)\/\/ Geocodificar/,
        // Patrón 4: Fallback - buscar window.all*Markers = []
        new RegExp(`(\\s+)window\\.${markersArrayName} = \\[\\];`)
    ];

    let insertionPoint = null;
    for (const pattern of patterns) {
        const match = indexHtml.match(pattern);
        if (match) {
            insertionPoint = indexHtml.indexOf(match[0]);
            console.log(`   ✅ Punto de inserción encontrado (definición)`);
            break;
        }
    }

    if (!insertionPoint) {
        console.log(`   ⚠️  No se encontró punto de inserción para la definición\n`);
        return;
    }

    // Insertar definición de propiedad ANTES del punto encontrado
    indexHtml = indexHtml.substring(0, insertionPoint) +
                newPropertyCode +
                indexHtml.substring(insertionPoint);

    console.log(`   ✅ Definición de propiedad agregada al mapa`);

    // ═══════════════════════════════════════════════════════════════════
    // PASO 10: Buscar punto de inserción para el MARCADOR
    // ═══════════════════════════════════════════════════════════════════
    // PATRONES GENÉRICOS que funcionan en TODAS las ciudades
    const markerPatterns = [
        // Patrón 1: Buscar cualquier console.log('Marcador ...')
        /(\s+)console\.log\('Marcador [^']*'\);/,
        // Patrón 2: Buscar window.all*Markers.push(...)
        new RegExp(`(\\s+)window\\.${markersArrayName}\\.push\\(`),
        // Patrón 3: Buscar comentario de filtros Zillow
        /(\s+)\/\/ Inicializar filtros Zillow cuando el mapa esté listo/,
        // Patrón 4: Fallback - buscar google.maps.event.addListener
        /(\s+)google\.maps\.event\.addListener\(/
    ];

    let markerInsertionPoint = null;
    for (const pattern of markerPatterns) {
        const match = indexHtml.match(pattern);
        if (match) {
            markerInsertionPoint = indexHtml.indexOf(match[0]) + match[0].length;
            console.log(`   ✅ Punto de inserción encontrado (marcador)`);
            break;
        }
    }

    if (!markerInsertionPoint) {
        console.log(`   ⚠️  No se encontró punto de inserción para el marcador\n`);
        return;
    }

    // Insertar código del marcador DESPUÉS del punto encontrado
    indexHtml = indexHtml.substring(0, markerInsertionPoint) +
                newMarkerCode +
                indexHtml.substring(markerInsertionPoint);

    console.log(`   ✅ Marcador con coordenadas exactas agregado al mapa de ${cityConfig.name}\n`);

    // ═══════════════════════════════════════════════════════════════════
    // PASO 11: Guardar archivo index.html actualizado
    // ═══════════════════════════════════════════════════════════════════
    fs.writeFileSync(indexPath, indexHtml, 'utf8');
}
```

---

## 📊 EJEMPLO DE CÓDIGO GENERADO

### Definición de Propiedad:
```javascript
// VENTA: Casa en Venta en Stanza Toscana
const casa_en_venta_en_stanza_toscanaProperty = {
    address: "Stanza Toscana, Culiacán, Sinaloa",
    priceShort: "$2.99M",
    priceFull: "$2,990,000",
    title: "Casa en Venta en Stanza Toscana",
    location: "Stanza Toscana, Culiacán",
    bedrooms: 3,
    bathrooms: 2,
    area: "175m²",
    type: "venta",
    url: "https://casasenventa.info/culiacan/casa-en-venta-en-stanza-toscana/",
    whatsapp: "526677123456",
    photos: [
        "casa-en-venta-en-stanza-toscana/images/foto-1.jpg",
        "casa-en-venta-en-stanza-toscana/images/foto-2.jpg",
        "casa-en-venta-en-stanza-toscana/images/foto-3.jpg",
        // ... más fotos
    ]
};
```

### Código del Marcador:
```javascript
// Casa en Venta en Stanza Toscana - Coordenadas exactas del JSON-LD
const casa_en_venta_en_stanza_toscanaPosition = new google.maps.LatLng(24.8091, -107.3940);
const casa_en_venta_en_stanza_toscanaMarkerClass = createZillowPropertyMarker(casa_en_venta_en_stanza_toscanaProperty, window.mapCuliacan);
const casa_en_venta_en_stanza_toscanaMarker = new casa_en_venta_en_stanza_toscanaMarkerClass(casa_en_venta_en_stanza_toscanaPosition, window.mapCuliacan, casa_en_venta_en_stanza_toscanaProperty);
window.allCuliacanMarkers.push(casa_en_venta_en_stanza_toscanaMarker);
console.log('Marcador Casa en Venta en Stanza Toscana (VENTA) creado en:', casa_en_venta_en_stanza_toscanaPosition.lat(), casa_en_venta_en_stanza_toscanaPosition.lng());
```

---

## 🎯 FLUJO COMPLETO

```
1. Scraper extrae datos de Inmuebles24
   ↓
2. Extrae coordenadas del JSON-LD (latitude, longitude)
   ↓
3. addPropertyToMap() verifica que haya coordenadas
   ↓
4. Genera array de fotos dinámico (foto-1.jpg, foto-2.jpg, ...)
   ↓
5. Formatea precio corto ($3.55M) y completo ($3,550,000)
   ↓
6. Normaliza ubicación para mostrar
   ↓
7. Detecta tipo: RENTA o VENTA
   ↓
8. Genera código JavaScript de la propiedad
   ↓
9. Busca punto de inserción en index.html (antes de propiedades existentes)
   ↓
10. Inserta definición de propiedad
    ↓
11. Busca punto de inserción para marcador (después de marcadores existentes)
    ↓
12. Inserta código del marcador con coordenadas exactas
    ↓
13. Guarda index.html actualizado
    ↓
14. ✅ Propiedad visible en mapa modal automáticamente
```

---

## 🔑 CARACTERÍSTICAS CLAVE

### 1. **Coordenadas Exactas del JSON-LD**
- ✅ NO usa geocodificación (más rápido)
- ✅ Usa coordenadas exactas del structured data de Inmuebles24
- ✅ 100% preciso en ubicación

### 2. **Array de Fotos Dinámico**
- ✅ Genera automáticamente según `photoCount`
- ✅ Formato: `"slug/images/foto-N.jpg"`
- ✅ Todas las fotos disponibles en el carrusel del mapa

### 3. **Multi-Ciudad**
- ✅ Culiacán → `mapCuliacan` + `window.allCuliacanMarkers`
- ✅ Monterrey → `mapMonterrey` + `window.allMonterreyMarkers`
- ✅ Mazatlán → `mapMazatlan` + `window.allMazatlanMarkers`

### 4. **Detección Inteligente de Tipo**
- ✅ Busca "renta" en precio o título
- ✅ Default: VENTA si no encuentra "renta"
- ✅ Badge correcto en mapa (naranja/verde)

### 5. **Inserción Inteligente**
- ✅ Busca múltiples patrones para encontrar punto de inserción
- ✅ Inserta ANTES de propiedades existentes (orden cronológico inverso)
- ✅ Inserta DESPUÉS de marcadores existentes (orden correcto en mapa)

---

## 📂 ARCHIVOS RELACIONADOS

- `inmuebles24culiacanscraper.js:2408-2544` - Función principal
- `culiacan/index.html` - Mapa modal Culiacán
- `monterrey/index.html` - Mapa modal Monterrey
- `mazatlan/index.html` - Mapa modal Mazatlán

---

## 🛠️ USO

Esta función se llama automáticamente cuando se scrapea una propiedad de Inmuebles24:

```javascript
// En main() después de generar HTML y tarjeta
addPropertyToMap(data, slug, photoCount, cityConfig);
```

**Requisitos:**
- ✅ `data.latitude` y `data.longitude` deben existir (del JSON-LD)
- ✅ `cityConfig` debe tener `indexPath` válido
- ✅ El archivo `index.html` debe tener los patrones de inserción

**Si falla:**
- ⚠️ Muestra advertencia en console
- ⚠️ NO rompe el scraper
- ⚠️ Propiedad se puede agregar manualmente después

---

## ✅ VENTAJAS

1. **100% Automático** - No requiere intervención manual
2. **Preciso** - Usa coordenadas exactas de Inmuebles24
3. **Rápido** - No requiere geocodificación
4. **Multi-Ciudad** - Funciona para Culiacán, Monterrey, Mazatlán
5. **Robusto** - Maneja errores sin romper el scraper
6. **Completo** - Incluye TODAS las fotos en el carrusel
7. **Filtrable** - Detecta tipo (RENTA/VENTA) automáticamente

---

## ⚠️ LIMITACIONES Y CONSIDERACIONES

### 1. Requiere Coordenadas del JSON-LD
- ✅ **Ventaja:** No requiere geocodificación (más rápido y preciso)
- ⚠️ **Limitación:** Si Inmuebles24 no incluye coordenadas en JSON-LD, la propiedad NO se agrega al mapa
- 🔧 **Solución:** Agregar manualmente las coordenadas después o usar geocoding API

### 2. Patrones de Inserción Genéricos
- ✅ **Mejorado:** Ahora usa patrones genéricos que funcionan en TODAS las ciudades
- ✅ **Fallback:** 4 patrones diferentes para cada inserción (definición + marcador)
- ⚠️ **Riesgo:** Si el HTML del mapa cambia mucho, los patrones pueden fallar
- 🔧 **Solución:** Los mensajes de warning indican claramente si no se encontró punto de inserción

### 3. Estructura del Mapa Modal
- ✅ **Requisito:** El archivo `index.html` de cada ciudad debe tener:
  - `window.allCuliacanMarkers = []` (o Monterrey/Mazatlán)
  - Al menos una propiedad existente O comentario de geocodificación
  - Función `createZillowPropertyMarker()` disponible
- ⚠️ **Nuevo Mapa:** Si es el PRIMER marcador de una ciudad nueva, necesita setup manual

### 4. Multi-Ciudad Completamente Funcional
- ✅ **CORREGIDO (Octubre 2025):** Ahora usa arrays dinámicos por ciudad
- ✅ `allCuliacanMarkers`, `allMonterreyMarkers`, `allMazatlanMarkers`
- ✅ Patrones de inserción genéricos funcionan en todas las ciudades
- ✅ Ya NO está hardcodeado a Culiacán

### 5. Sin Fallback de Geocoding
- ⚠️ **Decisión de diseño:** Si no hay coordenadas, NO se agrega al mapa
- **Razón:** Evita errores de geocoding API (límites, costos, imprecisión)
- **Recomendación:** Agregar coordenadas manualmente si son críticas

---

## 🔄 HISTORIAL DE CORRECCIONES

### Octubre 2025 - Fix Multi-Ciudad
**Problemas identificados:**
1. ❌ `window.allCuliacanMarkers.push()` estaba hardcodeado
2. ❌ Patrones de inserción solo buscaban propiedades de Culiacán
3. ❌ Sin fallback robusto para ciudades nuevas

**Soluciones aplicadas:**
1. ✅ Agregado `markersArrayName` dinámico según `cityConfig.city`
2. ✅ Patrones de inserción genéricos: `// (RENTA|VENTA):`, `const \w+Property`, etc.
3. ✅ 4 patrones de fallback para cada inserción (definición + marcador)
4. ✅ Documentación actualizada para reflejar comportamiento real

**Commit:** (pendiente)

---

**Última actualización:** Octubre 2025 (Multi-Ciudad Fix)
**Commits relacionados:** 7ae564e, ffe8fe7, 6308642, c2b9eb7
