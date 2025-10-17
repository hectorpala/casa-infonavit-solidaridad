# 🗺️ AGREGAR PROPIEDAD AL MAPA MODAL - GUÍA COMPLETA

## 📍 CUÁNDO USAR

Cuando se sube una nueva propiedad a Monterrey y se quiere que aparezca en el mapa modal (botón "Ver en Mapa" en la página principal).

---

## ⚡ COMANDO RÁPIDO (Copiar/Pegar)

Cuando tengas los datos de la nueva propiedad, ejecuta esto **DESPUÉS** de que el scraper haya creado la propiedad:

```bash
# 1. Abrir monterrey/index.html en el editor
# 2. Buscar la última propiedad (ej: realCumbresProperty)
# 3. Agregar DESPUÉS de la última propiedad:

            // [NÚMERO]. propiedad: [TÍTULO]
            const [nombreVariable]Property = {
                address: "[DIRECCIÓN COMPLETA]",
                priceShort: "$[PRECIO_CORTO]M",
                priceFull: "$[PRECIO_COMPLETO]",
                title: "[TÍTULO COMPLETO]",
                location: "[UBICACIÓN CORTA]",
                bedrooms: [NÚMERO],
                bathrooms: [NÚMERO],
                area: "[ÁREA]m²",
                url: "https://casasenventa.info/monterrey/[SLUG]/",
                photos: [
                    "[SLUG]/images/foto-1.jpg",
                    "[SLUG]/images/foto-2.jpg",
                    // ... todas las fotos
                ]
            };

# 4. Agregar ANTES de "window.mapMonterreyInitialized = true;":

            // Geocodificar [TÍTULO]
            geocoder.geocode({ address: [nombreVariable]Property.address }, function(results, status) {
                if (status === 'OK' && results[0]) {
                    const position = results[0].geometry.location;
                    const CustomMarkerClass = createZillowPropertyMarkerMty([nombreVariable]Property, mapMonterrey);
                    const marker = new CustomMarkerClass(position, mapMonterrey, [nombreVariable]Property);
                    monterreyMarkers.push(marker);
                    console.log('Marcador [TÍTULO] creado en:', position.lat(), position.lng());
                } else {
                    console.error('Geocode error [TÍTULO]:', status);
                }
            });
```

---

## 📋 EJEMPLO REAL (Última propiedad agregada)

### Propiedad: Cumbres de 3 Niveles con 6 Paneles Solares

**Paso 1: Agregar definición de propiedad** (línea ~2333)

```javascript
// Sexta propiedad: Cumbres 3 Niveles con Paneles Solares
const cumbres3NivelesPanelesProperty = {
    address: "PASEO DE LOS LEONES, Cumbres, Monterrey",
    priceShort: "$3.8M",
    priceFull: "$3,785,250",
    title: "Cumbres de 3 Niveles, Incluye Cocina Integral y 6 Paneles Solares",
    location: "PASEO DE LOS LEONES, Cumbres, Monterrey",
    bedrooms: 1,
    bathrooms: 2,
    area: "204m²",
    url: "https://casasenventa.info/monterrey/cumbres-de-3-niveles-incluye-cocina-integral-y-6-paneles-sol/",
    photos: [
        "cumbres-de-3-niveles-incluye-cocina-integral-y-6-paneles-sol/images/foto-1.jpg",
        "cumbres-de-3-niveles-incluye-cocina-integral-y-6-paneles-sol/images/foto-2.jpg",
        // ... 19 fotos total
    ]
};
```

**Paso 2: Agregar geocodificación** (línea ~2447, ANTES de `window.mapMonterreyInitialized = true;`)

```javascript
// Geocodificar Cumbres 3 Niveles con Paneles Solares
geocoder.geocode({ address: cumbres3NivelesPanelesProperty.address }, function(results, status) {
    if (status === 'OK' && results[0]) {
        const position = results[0].geometry.location;
        const CustomMarkerClass = createZillowPropertyMarkerMty(cumbres3NivelesPanelesProperty, mapMonterrey);
        const marker = new CustomMarkerClass(position, mapMonterrey, cumbres3NivelesPanelesProperty);
        monterreyMarkers.push(marker);
        console.log('Marcador Cumbres 3 Niveles Paneles creado en:', position.lat(), position.lng());
    } else {
        console.error('Geocode error Cumbres 3 Niveles Paneles:', status);
    }
});
```

---

## 🔍 UBICACIONES EXACTAS EN EL CÓDIGO

### Archivo: `monterrey/index.html`

**1. Definiciones de propiedades:**
- Inicio: Línea ~2200 (`const casaZonaCumbresProperty`)
- Fin: Línea ~2365 (última propiedad)
- **AGREGAR AQUÍ:** Después de la última propiedad, antes de los geocodes

**2. Geocodificaciones:**
- Inicio: Línea ~2367 (`geocoder.geocode({ address: casaZonaCumbresProperty...`)
- Fin: Línea ~2458 (última geocodificación)
- **AGREGAR AQUÍ:** Después de la última geocodificación, ANTES de `window.mapMonterreyInitialized = true;`

---

## 📊 ESTRUCTURA DEL OBJETO DE PROPIEDAD

```javascript
const [nombreCamelCase]Property = {
    address: "Calle Número, Colonia, Monterrey",     // Dirección COMPLETA para geocoding
    priceShort: "$X.XM",                              // Formato corto para marcador
    priceFull: "$X,XXX,XXX",                          // Formato completo con comas
    title: "Título Completo de la Propiedad",        // Título que aparece en InfoWindow
    location: "Colonia, Monterrey, N.L.",            // Ubicación corta para subtitle
    bedrooms: 3,                                      // Número entero
    bathrooms: 2,                                     // Número entero
    area: "XXXm²",                                    // String con m²
    url: "https://casasenventa.info/monterrey/slug/", // URL completa de la propiedad
    photos: [                                         // Array de paths relativos
        "slug/images/foto-1.jpg",
        "slug/images/foto-2.jpg",
        // ... todas las fotos disponibles
    ]
};
```

---

## ⚙️ CÓMO OBTENER LOS DATOS

Después de que el scraper termina, los datos están en:

1. **Dirección:** En el HTML de la propiedad (`monterrey/[slug]/index.html`), busca `MARKER_CONFIG.location`
2. **Precio:** En `CURRENT_PROPERTY_DATA.priceFull` y `.priceShort`
3. **Título:** En `<title>` o `CURRENT_PROPERTY_DATA.title`
4. **Recámaras/Baños:** En `CURRENT_PROPERTY_DATA.bedrooms` y `.bathrooms`
5. **Área:** En `CURRENT_PROPERTY_DATA.area`
6. **Slug:** En el nombre de la carpeta (`monterrey/[SLUG]/`)
7. **Fotos:** Contar archivos en `monterrey/[SLUG]/images/`

---

## 🧪 VALIDACIÓN

Después de agregar la propiedad al mapa modal:

```bash
# 1. Commit y push
git add monterrey/index.html
git commit -m "Add: [Título] al mapa modal de Monterrey"
git push

# 2. Esperar deployment (2 min)
sleep 120

# 3. Abrir y verificar
open "https://casasenventa.info/monterrey/"
# Click en "Ver en Mapa"
# Verificar que aparezca el nuevo marcador naranja en el mapa
```

**Checklist de verificación:**
- [ ] El marcador naranja aparece en la ubicación correcta
- [ ] Al hacer click muestra el InfoWindow con el precio correcto
- [ ] El título y ubicación son correctos
- [ ] El botón "Ver Detalles" lleva a la URL correcta
- [ ] El botón WhatsApp funciona
- [ ] La consola NO muestra errores de geocoding

---

## 🚨 PROBLEMAS COMUNES

### Marcador no aparece

**Causa:** Error de geocodificación (dirección incorrecta)

**Solución:**
1. Verificar que `address` sea específica: "Calle Número, Colonia, Monterrey"
2. Abrir consola del navegador y buscar: `Geocode error [TuPropiedad]`
3. Si falla, probar la dirección en Google Maps manualmente
4. Usar una dirección más genérica: "Colonia, Monterrey, Nuevo León"

### Marcador en ubicación incorrecta

**Causa:** Dirección ambigua o incorrecta

**Solución:**
1. Agregar más detalles: "Calle Número, Entre Calle X y Y, Colonia, Monterrey"
2. O usar coordenadas fijas:
```javascript
// En vez de geocoder.geocode, usar coordenadas directas:
const position = { lat: 25.XXXX, lng: -100.XXXX };
const CustomMarkerClass = createZillowPropertyMarkerMty(tuProperty, mapMonterrey);
const marker = new CustomMarkerClass(position, mapMonterrey, tuProperty);
monterreyMarkers.push(marker);
```

### InfoWindow no muestra fotos

**Causa:** Array de `photos` vacío o paths incorrectos

**Solución:**
1. Verificar que los paths sean relativos: `"slug/images/foto-X.jpg"`
2. NO usar paths absolutos: ~~`"/monterrey/slug/images/foto-X.jpg"`~~
3. Verificar que las fotos existan en el servidor

---

## 📝 CONVENCIONES DE NOMBRES

### Variable de la propiedad:
- Formato: `[descripcionCamelCase]Property`
- Ejemplos:
  - `casaZonaCumbresProperty`
  - `cumbres3NivelesPanelesProperty`
  - `urbivillaColonialProperty`

### Comentarios:
- Formato: `// [Número ordinal] propiedad: [Título]`
- Ejemplos:
  - `// Primera propiedad: Casa en Venta Zona Cumbres`
  - `// Sexta propiedad: Cumbres 3 Niveles con Paneles Solares`

### Console logs:
- Formato: `'Marcador [Título Corto] creado en:', position.lat(), position.lng()`
- Formato error: `'Geocode error [Título Corto]:', status`

---

## 🎯 RESUMEN EJECUTIVO

**Para agregar una propiedad al mapa modal de Monterrey:**

1. ✅ Correr el scraper: `node inmuebles24monterreyscraper.js "[URL]"`
2. ✅ Esperar a que termine (la propiedad ya tiene su página individual)
3. ✅ Abrir `monterrey/index.html`
4. ✅ Buscar última propiedad (ej: `realCumbresProperty`)
5. ✅ Copiar/pegar definición de propiedad DESPUÉS de la última
6. ✅ Llenar datos: address, price, title, location, bedrooms, bathrooms, area, url, photos
7. ✅ Buscar última geocodificación (antes de `window.mapMonterreyInitialized`)
8. ✅ Copiar/pegar geocodificación ANTES de `window.mapMonterreyInitialized = true;`
9. ✅ Commit: `git add monterrey/index.html && git commit -m "Add: [Título] al mapa modal" && git push`
10. ✅ Verificar en producción: https://casasenventa.info/monterrey/ → "Ver en Mapa"

**Tiempo estimado:** 5-7 minutos por propiedad

---

## 📚 DOCUMENTACIÓN RELACIONADA

- **Scraper Monterrey:** `inmuebles24monterreyscraper.js`
- **Template de propiedad:** `automation/templates/master-template.html`
- **Instrucciones principales:** `CLAUDE.md`

---

**Última actualización:** 2025-10-17
**Propiedades en mapa modal:** 6 (casaZonaCumbres, cumbres3Niveles, urbivillaColonial, cumbresEquipada, realCumbres, cumbres3NivelesPaneles)
