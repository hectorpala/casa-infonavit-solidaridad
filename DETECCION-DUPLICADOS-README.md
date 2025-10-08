# 🔍 Sistema de Detección de Duplicados - Inmuebles24

## ✅ Funcionalidad

El scraper de Inmuebles24 ahora detecta automáticamente propiedades repetidas **ANTES** de scrapear, evitando duplicados en el sitio.

## 📊 Metadatos Capturados

El scraper ahora extrae 3 metadatos adicionales para identificar propiedades:

### 1. 🆔 ID de Propiedad
- **Fuente:** URL de Inmuebles24
- **Patrón:** `-(\d+)\.html$`
- **Ejemplo:**
  ```
  URL: https://www.inmuebles24.com/.../143508352.html
  ID extraído: 143508352
  ```

### 2. 📅 Fecha de Publicación
- **Fuente:** Elemento HTML con clase `.userViews-module__post-antiquity-views___8Zfch`
- **Ejemplos:**
  - "Publicado hace más de 1 año"
  - "Publicado hace 3 meses"
  - "Publicado hace 15 días"

### 3. 👁️ Visualizaciones
- **Fuente:** Texto en body con patrón `(\d+)\s+visualizaciones?`
- **Ejemplo:** "28 visualizaciones" → `28`

## 🔧 Funciones Implementadas

### `checkIfPropertyExists(propertyId)`
Verifica si una propiedad ya fue scrapeada anteriormente.

**Retorna:**
- `null` si NO existe (continuar scraping)
- `object` con datos si SÍ existe (detener scraping)

**Warning mostrado:**
```
⚠️  ============================================
⚠️  PROPIEDAD DUPLICADA DETECTADA
⚠️  ============================================
   🆔 ID: 143508352
   📝 Título: Venta de Casa por Calle Mariano Escobedo
   💰 Precio: MN 4,000,000
   📅 Publicada: Publicado hace más de 1 año
   🕐 Scrapeada: 2025-10-08T19:45:32.123Z
   🔗 Slug: venta-de-casa-por-calle-mariano-escobedo

   ❌ Esta propiedad ya fue scrapeada anteriormente.
   💡 Si quieres re-scrapear, elimina la entrada del archivo:
      inmuebles24-scraped-properties.json
```

### `saveScrapedProperty(propertyData)`
Guarda los datos de una propiedad scrapeada en el registro JSON.

**Formato guardado:**
```json
{
  "propertyId": "143508352",
  "title": "Venta de Casa por Calle Mariano Escobedo",
  "slug": "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad",
  "price": "MN 4,000,000",
  "publishedDate": "Publicado hace más de 1 año",
  "scrapedAt": "2025-10-08T19:45:32.123Z",
  "url": "https://www.inmuebles24.com/propiedades/clasificado/..."
}
```

### `loadScrapedProperties()`
Lee el archivo JSON de propiedades scrapeadas.

**Retorna:** Array de objetos con propiedades

## 📁 Archivo de Registro

### `inmuebles24-scraped-properties.json`

**Ubicación:** Raíz del proyecto

**Estructura:**
```json
[
  {
    "propertyId": "143508352",
    "title": "Venta de Casa por Calle Mariano Escobedo",
    "slug": "venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad",
    "price": "MN 4,000,000",
    "publishedDate": "Publicado hace más de 1 año",
    "scrapedAt": "2025-10-08T19:45:32.123Z",
    "url": "https://www.inmuebles24.com/propiedades/clasificado/..."
  },
  {
    "propertyId": "147661732",
    "title": "Casa en Venta, La Cantera, Culiacan",
    "slug": "casa-en-venta-la-cantera-culiacan",
    "price": "$7,950,000",
    "publishedDate": "Publicado hace 2 meses",
    "scrapedAt": "2025-10-08T20:12:15.456Z",
    "url": "https://www.inmuebles24.com/propiedades/clasificado/..."
  }
]
```

## 🔄 Flujo de Verificación

```
1. Usuario ejecuta: node inmuebles24-scraper-y-publicar.js "URL"
                          ↓
2. Scraper extrae datos básicos de la página
                          ↓
3. Extrae ID de URL: match(/-(\d+)\.html$/)
                          ↓
4. Llama checkIfPropertyExists(propertyId)
                          ↓
5a. SI EXISTE              5b. NO EXISTE
    → Muestra warning          → Continúa scraping
    → Detiene scraper          → Descarga fotos
    → Exit 0                   → Genera HTML
                               → Commit + push
                               → saveScrapedProperty()
                               → Exit 0
```

## 🛠️ Cómo Re-scrapear una Propiedad

Si necesitas actualizar una propiedad que ya fue scrapeada:

1. Abre `inmuebles24-scraped-properties.json`
2. Busca la entrada con el `propertyId` correspondiente
3. Elimina esa entrada del array
4. Guarda el archivo
5. Ejecuta el scraper nuevamente

**Ejemplo:**
```bash
# Antes de eliminar
[
  { "propertyId": "143508352", ... },  ← Eliminar esta línea
  { "propertyId": "147661732", ... }
]

# Después de eliminar
[
  { "propertyId": "147661732", ... }
]
```

## 📋 Logs del Scraper

### Extracción de Metadatos
```
✅ Datos extraídos exitosamente:
   📝 Título: Venta de Casa por Calle Mariano Escobedo
   💰 Precio: MN 4,000,000
   📍 Ubicación: Sinaloa
   🛏️  5 recámaras
   🛁 2 baños
   📸 22 imágenes encontradas
   👤 Vendedor: Alejandra
   📞 Tel: 6671603643

   🔍 METADATOS (para detección de duplicados):
   🆔 ID Propiedad: 143508352
   📅 Fecha: Publicado hace más de 1 año
   👁️  Vistas: 28
```

### Guardado en Registro
```
   ✅ Propiedad guardada en registro (ID: 143508352)
```

## ⚙️ Configuración

**Archivo:** `inmuebles24-scraper-y-publicar.js`

**Línea 42:**
```javascript
const CONFIG = {
    // ...
    scraped_properties_file: 'inmuebles24-scraped-properties.json'
};
```

Para cambiar ubicación del archivo de registro, modifica esta línea.

## 🔍 Ventajas

✅ **Evita duplicados** - No scrapeará la misma propiedad dos veces
✅ **Ahorra tiempo** - Detiene el scraper antes de descargar fotos
✅ **Historial completo** - Registro de todas las propiedades scrapeadas
✅ **Fácil re-scrapear** - Solo eliminar entrada del JSON
✅ **Información útil** - Fecha de publicación y visualizaciones

## 📝 Notas

- El ID de propiedad es **único** en Inmuebles24
- El archivo JSON se actualiza **después** del commit y push
- Si el JSON se corrompe, se creará uno nuevo automáticamente
- El scraper muestra warning pero **NO** genera error (exit 0)

---

**Commit:** 0f2c354
**Fecha:** Octubre 8, 2025
