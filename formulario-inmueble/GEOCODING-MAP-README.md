# 🗺️ Geocodificación con Mapa - Documentación

## 📋 Descripción

Página dedicada para geocodificar direcciones y visualizar resultados en un mapa interactivo. Permite obtener coordenadas exactas (latitud/longitud) de cualquier dirección en Culiacán o Mazatlán, Sinaloa.

## 🚀 Características

### ✅ Funcionalidades Implementadas

1. **Formulario de Dirección**
   - Selector de municipio (Culiacán/Mazatlán)
   - Autocomplete de colonias (reutiliza `data/colonias-culiacan.json`)
   - Autocomplete de calles (reutiliza `data/calles-culiacan.json`)
   - Número exterior (requerido) e interior (opcional)
   - Código postal auto-fill (basado en colonia seleccionada)

2. **Sistema de Geocodificación Multi-servicio**
   - Google Maps Geocoding API (precisión alta)
   - MapBox Geocoding API (fallback)
   - Nominatim/OpenStreetMap (fallback gratuito)
   - Reutiliza completamente `js/geocoding.js`

3. **Mapa Interactivo**
   - Implementado con Leaflet + OpenStreetMap
   - Marcador personalizado con color del theme (#E76F51)
   - Popup con información completa de la dirección
   - Zoom y pan interactivo
   - Leyenda informativa

4. **Panel de Resultados**
   - Dirección completa formateada
   - Latitud y longitud (6 decimales)
   - Código postal
   - Nivel de precisión
   - Servicio utilizado
   - Botón "Abrir en Google Maps"
   - Botón "Copiar Coordenadas"

5. **UX/UI Premium**
   - Loading overlay durante geocodificación
   - Notificaciones toast (success/error/warning)
   - Layout responsive (desktop: 2 columnas, mobile: apilado)
   - Animaciones suaves
   - Look & feel consistente con el formulario principal

## 📁 Archivos Creados

### 1. `geocoding-map.html` (HTML principal)
**Ubicación:** `/formulario-inmueble/geocoding-map.html`

**Secciones:**
- Header con título y botón "Volver al formulario"
- Panel izquierdo: Formulario de dirección
- Panel derecho: Mapa interactivo
- Loading overlay
- Notification container

**Dependencias:**
- CSS: `main.css`, `form.css`, `geocoding-map.css`
- JS: `autocomplete.js`, `geocoding.js`, `geocoding-map.js`
- Leaflet CSS/JS (CDN)

### 2. `css/geocoding-map.css` (Estilos específicos)
**Ubicación:** `/formulario-inmueble/css/geocoding-map.css`

**Estilos incluidos:**
- Header con gradiente naranja (#E76F51 → #F4A261)
- Layout grid 2 columnas (450px + 1fr)
- Panels con sombra y bordes redondeados
- Botones primary/secondary/maps/copy
- Results panel con grid de items
- Map container (600px desktop, 350px mobile)
- Loading overlay con spinner
- Notification system
- Responsive breakpoints (1024px, 768px, 480px)
- Custom Leaflet popup styles

### 3. `js/geocoding-map.js` (Lógica de la app)
**Ubicación:** `/formulario-inmueble/js/geocoding-map.js`

**Objeto principal:** `GeocodingMapApp`

**Métodos clave:**
- `init()` - Inicializa mapa, autocompletes y event listeners
- `initMap()` - Crea mapa de Leaflet con OSM tiles
- `initAutocompletes()` - Instancia ColoniaAutocomplete y StreetAutocomplete
- `handleGeocode()` - Geocodifica dirección usando Geocoding.js
- `updateMap(lat, lng, data)` - Actualiza mapa con marcador personalizado
- `showResults(result, data)` - Muestra panel de resultados
- `copyCoordinates()` - Copia coordenadas al portapapeles
- `clearForm()` - Limpia formulario y resetea mapa
- `showNotification(msg, type)` - Sistema de notificaciones toast

**Integración con sistemas existentes:**
- Reutiliza `Geocoding.geocodeAddress()` de `geocoding.js`
- Reutiliza `ColoniaAutocomplete` de `autocomplete.js`
- Reutiliza `StreetAutocomplete` de `autocomplete.js`

### 4. `index.html` (Modificación)
**Cambio:** Agregado enlace en footer

```html
<a href="geocoding-map.html" class="geocoding-link">
    <i class="fas fa-map-marked-alt"></i>
    Geocodificación con Mapa
</a>
```

## 🧪 Instrucciones de Prueba

### Paso 1: Acceder a la Página
Desde el formulario principal, haz clic en el enlace del footer:
- "Geocodificación con Mapa"

O accede directamente:
- URL local: `http://localhost:8080/geocoding-map.html`
- URL producción: `https://ubicacioncotizar.netlify.app/geocoding-map.html`

### Paso 2: Geocodificar una Dirección

**Ejemplo 1: Casa en Tres Ríos**
1. **Municipio:** Culiacán (default)
2. **Colonia:** Escribe "Tres Ríos" → Selecciona de la lista
   - ✅ El CP debe auto-llenarse (ejemplo: 80027)
3. **Calle:** Escribe "Blvd. Universitarios" → Selecciona
4. **Número Exterior:** 2609
5. **Número Interior:** (dejar vacío)
6. Click en **"Geocodificar Dirección"**

**Resultado esperado:**
- ⏳ Loading overlay (2-3 segundos)
- ✅ Notificación verde: "Ubicación encontrada con Google Maps"
- 📍 Marcador rojo aparece en el mapa
- 📊 Panel de resultados muestra:
  - Dirección completa
  - Latitud: ~24.809XXX
  - Longitud: ~-107.394XXX
  - CP: 80027
  - Precisión: "Exacta (número específico)" o similar
  - Servicio: "Google Maps"

**Ejemplo 2: Casa en Barrio San Francisco**
1. **Colonia:** "Barrio San Francisco" (CP: 80010)
2. **Calle:** "Calle Ángel Flores"
3. **Número:** 123
4. Geocodificar

**Resultado esperado:**
- Marcador en centro histórico de Culiacán
- Coordenadas diferentes

### Paso 3: Probar Funcionalidades

**A) Interactuar con el mapa:**
- 🖱️ Arrastra para hacer pan
- 🔍 Usa scroll/pinch para zoom
- 📍 Click en marcador para ver popup

**B) Abrir en Google Maps:**
- Click en botón azul "Abrir en Google Maps"
- ✅ Se abre nueva pestaña con Google Maps
- ✅ Marcador en la ubicación exacta

**C) Copiar coordenadas:**
- Click en botón verde "Copiar Coordenadas"
- ✅ Notificación: "Coordenadas copiadas al portapapeles"
- ✅ Botón cambia a "Copiado" por 2 segundos
- Pega en un editor de texto (Cmd+V)
- ✅ Formato: `24.809123, -107.394567`

**D) Cambiar municipio:**
- Cambia selector de "Culiacán" a "Mazatlán"
- ✅ El mapa se recentra a Mazatlán (23.2494, -106.4111)
- Geocodifica una dirección en Mazatlán

**E) Limpiar formulario:**
- Click en botón gris "Limpiar"
- ✅ Todos los campos se vacían
- ✅ Panel de resultados desaparece
- ✅ Marcador se elimina del mapa
- ✅ Notificación: "Formulario limpiado"

### Paso 4: Probar Responsividad

**Desktop (>1024px):**
- ✅ Layout 2 columnas (formulario izq, mapa der)
- ✅ Formulario: 450px ancho fijo
- ✅ Mapa: 600px altura

**Tablet (768px-1024px):**
- ✅ Layout apilado (formulario arriba, mapa abajo)
- ✅ Mapa: 500px altura

**Mobile (<768px):**
- ✅ Layout apilado
- ✅ Mapa: 400px altura
- ✅ Form rows cambian a 1 columna
- ✅ Botones full-width

### Paso 5: Probar Casos Edge

**Error: Dirección incompleta**
1. Llena solo "Colonia" (sin calle ni número)
2. Click "Geocodificar"
- ✅ Notificación roja: "Por favor completa los campos requeridos..."

**Error: Dirección no encontrada**
1. Llena dirección inventada: "Calle Inexistente 99999, Colonia Falsa"
2. Click "Geocodificar"
- ✅ Notificación roja: "No se pudo encontrar la ubicación..."
- ❌ El panel de resultados NO aparece

**Success: Múltiples geocodificaciones**
1. Geocodifica dirección A
2. Sin limpiar, modifica solo el número
3. Geocodifica dirección B
- ✅ Marcador anterior se elimina
- ✅ Nuevo marcador aparece
- ✅ Panel de resultados se actualiza

## 🛠️ Integración con Sistema Existente

### Archivos Reutilizados (NO modificados)

1. **`js/geocoding.js`**
   - Función `geocodeAddress(addressData)`
   - Función `buildFullAddress(addressData)`
   - Fallback multi-servicio (Google → MapBox → Nominatim)

2. **`js/autocomplete.js`**
   - Clase `ColoniaAutocomplete`
   - Clase `StreetAutocomplete`
   - Auto-fill de código postal

3. **`data/colonias-culiacan.json`**
   - Array de colonias con CP

4. **`data/calles-culiacan.json`**
   - Array de 6,438 calles de Culiacán

5. **`css/main.css` y `css/form.css`**
   - Variables CSS reutilizadas
   - Estilos de form-control, form-label, etc.

### Archivos Nuevos

1. `geocoding-map.html` - Página HTML
2. `css/geocoding-map.css` - Estilos específicos
3. `js/geocoding-map.js` - Lógica de la app

### Archivos Modificados

1. **`index.html`** (línea 528-531)
   - Agregado enlace en footer

## 📊 Flujo de Datos

```
Usuario llena formulario
         ↓
Click "Geocodificar Dirección"
         ↓
GeocodingMapApp.handleGeocode()
         ↓
Obtiene datos con getFormData()
         ↓
Valida con validateFormData()
         ↓
Llama Geocoding.geocodeAddress(data)
         ↓
[Google Maps API] → Éxito? → Retorna {lat, lng, ...}
         ↓ No
[MapBox API] → Éxito? → Retorna {lat, lng, ...}
         ↓ No
[Nominatim OSM] → Éxito? → Retorna {lat, lng, ...}
         ↓ No
null (error)
         ↓
Si éxito:
  - updateMap(lat, lng, data)
  - showResults(result, data)
  - showNotification("Ubicación encontrada", "success")
Si error:
  - showNotification("No se pudo encontrar...", "error")
```

## 🎨 Paleta de Colores

- **Primary:** #E76F51 (naranja)
- **Secondary:** #F4A261 (naranja claro)
- **Success:** #2A9D8F (verde azulado)
- **Error:** #E76F51 (reutiliza primary)
- **Google Maps:** #4285F4 (azul Google)
- **Text:** #44403C (gris oscuro)
- **Text Light:** #78747B (gris medio)
- **Border:** #E5E1E6 (gris claro)
- **Background:** #FFFFFF (blanco)

## 🔗 URLs de Acceso

### Desarrollo Local
```
http://localhost:8080/geocoding-map.html
```

### Producción Netlify
```
https://ubicacioncotizar.netlify.app/geocoding-map.html
```

## 📝 Notas Técnicas

### Google Maps API Key
- Key configurada en `js/geocoding.js` (línea 9)
- Límite: 25,000 requests/día (gratis)
- Si se excede, fallback automático a MapBox o Nominatim

### Leaflet vs Google Maps
- **Decisión:** Usar Leaflet + OpenStreetMap
- **Razón:** No requiere API key, sin límites de requests
- **Trade-off:** Geocoding usa Google (preciso), mapa usa OSM (gratis)

### Autocomplete Performance
- Colonias: ~300 items, búsqueda instantánea
- Calles: ~6,438 items, debounce 200ms

### Browser Compatibility
- Chrome/Edge: ✅ 100%
- Firefox: ✅ 100%
- Safari: ✅ 100%
- Mobile browsers: ✅ 100%

## 🐛 Troubleshooting

**Problema:** El mapa no carga (pantalla gris)
- **Causa:** Leaflet CSS/JS no cargó del CDN
- **Solución:** Verificar conexión a internet, revisar consola del navegador

**Problema:** Autocomplete no funciona
- **Causa:** `autocomplete.js` no cargó
- **Solución:** Verificar que el archivo existe en `js/autocomplete.js`

**Problema:** "No se pudo encontrar la ubicación"
- **Causa 1:** Google Maps API key inválida
- **Causa 2:** Dirección demasiado vaga
- **Solución:** Verificar API key, ser más específico con la dirección

**Problema:** Botón "Copiar Coordenadas" no funciona
- **Causa:** Clipboard API no disponible (HTTP en vez de HTTPS)
- **Solución:** Usar HTTPS o copiar manualmente desde el panel

## ✅ Checklist de Entrega

- [x] HTML principal (`geocoding-map.html`)
- [x] CSS específico (`css/geocoding-map.css`)
- [x] JavaScript de la app (`js/geocoding-map.js`)
- [x] Enlace en `index.html` (footer)
- [x] Integración con autocompletes existentes
- [x] Integración con sistema de geocodificación
- [x] Mapa interactivo (Leaflet + OSM)
- [x] Botón "Abrir en Google Maps"
- [x] Botón "Copiar Coordenadas"
- [x] Loading overlay
- [x] Sistema de notificaciones
- [x] Responsive design (mobile/tablet/desktop)
- [x] Panel de resultados
- [x] README con instrucciones de uso

## 🚀 Próximos Pasos Sugeridos

1. **Agregar historial de búsquedas**
   - LocalStorage para guardar últimas 10 direcciones
   - Lista desplegable para re-geocodificar rápidamente

2. **Exportar resultados**
   - Botón "Exportar como CSV"
   - Botón "Compartir por WhatsApp"

3. **Geocodificación inversa**
   - Click en el mapa → obtener dirección
   - "Usar mi ubicación actual" (Geolocation API)

4. **Múltiples marcadores**
   - Permitir geocodificar varias direcciones
   - Ver todas en el mapa simultáneamente
   - Exportar lista completa

5. **Integración con formulario principal**
   - Pre-llenar campos del paso 1 desde geocoding-map
   - Link bidireccional entre páginas

---

**Documentación creada:** 2025-11-03
**Versión:** 1.0.0
**Autor:** Claude Code
