# Sistema de Gestión de Marcadores de Propiedades

## 📋 Descripción General

Sistema completo para etiquetar, gestionar y persist marcadores de propiedades en el mapa de geocodificación. Permite asignar estados/etiquetas a propiedades, decidir si mantenerlas en el mapa, y eliminarlas de forma permanente.

## 🎯 Funcionalidades Implementadas

### 1. **Panel de Gestión de Marcador**
- Aparece automáticamente después de geocodificar una dirección
- Selector desplegable con catálogo de etiquetas
- Vista previa en tiempo real de la etiqueta seleccionada
- Checkbox "Mantener marcador en el mapa" para persistencia
- Botón "Guardar Etiqueta" para persistir cambios
- Botón "Eliminar" para remover marcador completamente

### 2. **Catálogo de Etiquetas (Extensible)**
El sistema incluye las siguientes etiquetas por defecto:

| Etiqueta | Color | Descripción |
|----------|-------|-------------|
| Sin etiqueta | Gris | Estado inicial |
| En revisión | Naranja | Propiedad bajo evaluación |
| Compra | Verde | Propiedad seleccionada para compra |
| Venta | Azul | Propiedad en proceso de venta |
| Posible flip | Púrpura | Candidata para inversión/flip |
| Descartada | Rojo | Propiedad descartada |

**Para agregar más etiquetas:**
Edita el array `TAGS` en `js/marker-manager.js`:

```javascript
TAGS: [
    // ... etiquetas existentes
    { value: 'nueva', label: 'Nueva Etiqueta', color: '#hex', bgColor: '#hexbg' }
]
```

### 3. **Persistencia en localStorage**
- Los datos se guardan automáticamente en `property_markers`
- Incluye: coordenadas, dirección, etiqueta, y preferencia de persistencia
- Sincronización automática con el historial de búsquedas
- Restauración automática al recargar la página (si keepMarker=true)

### 4. **Integración con Historial de Búsquedas**
- Las etiquetas aparecen como badges en el panel de "Búsquedas Recientes"
- Al cargar una búsqueda del historial, se restaura su etiqueta
- Sincronización bidireccional: cambiar etiqueta actualiza el historial

### 5. **Eliminación de Marcadores**
- Confirmación obligatoria antes de eliminar
- Elimina: marcador del mapa + datos en localStorage + panel de gestión
- Acción irreversible (con advertencia clara)

## 📁 Archivos Modificados/Creados

### Nuevos Archivos:
1. **`js/marker-manager.js`** (550 líneas)
   - Módulo principal de gestión de marcadores
   - Sistema de etiquetas extensible
   - Persistencia en localStorage
   - Renderizado del panel de gestión

2. **`MARKER-MANAGEMENT-README.md`** (este archivo)
   - Documentación completa del sistema
   - Instrucciones de prueba
   - Guía de uso

### Archivos Modificados:
1. **`geocoding-map.html`**
   - Agregado `<div id="marker-management-panel">` (línea ~241)
   - Agregado `<script src="js/marker-manager.js">` (línea ~405)

2. **`js/search-history.js`**
   - Agregado listener `markerTagUpdated` (línea ~58-62)
   - Nuevo método `updateHistoryTag()` (línea ~347-373)
   - Actualizado `renderHistoryItem()` para mostrar etiquetas (línea ~223-235)

## 🧪 Cómo Probar el Sistema

### Paso 1: Iniciar Servidor Local
El sistema requiere servidor HTTP (no funciona con `file://` por CORS):

```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/formulario-inmueble"
python3 -m http.server 8000
```

Abrir: http://localhost:8000/geocoding-map.html

### Paso 2: Geocodificar una Dirección
1. Seleccionar **Estado:** Sinaloa
2. Seleccionar **Municipio:** Culiacán
3. Escribir **Colonia:** Centro (aparecerá autocompletado)
4. Escribir **Calle:** Blvd Elbert
5. Escribir **Número Exterior:** 2609
6. Click en **"Geocodificar"**

**Resultado esperado:**
- ✅ Aparece marcador naranja 3D en el mapa
- ✅ Panel "Resultados de Geocodificación" se muestra
- ✅ Panel "Gestión de Marcador" aparece debajo (NUEVO)
- ✅ Panel "Lugares Cercanos" muestra POIs
- ✅ Entrada agregada a "Búsquedas Recientes"

### Paso 3: Asignar Etiqueta
1. En el panel **"Gestión de Marcador"**, abrir el select
2. Seleccionar una etiqueta (ej: "Compra")
3. Ver vista previa actualizada en tiempo real
4. Verificar checkbox **"Mantener marcador en el mapa"** (debe estar marcado)
5. Click en **"Guardar Etiqueta"**

**Resultado esperado:**
- ✅ Notificación verde: "Etiqueta 'Compra' guardada correctamente"
- ✅ Badge verde "Compra" aparece en "Búsquedas Recientes"

### Paso 4: Verificar Persistencia
1. **Recargar la página** (Cmd+R / Ctrl+R)
2. Verificar que el panel "Búsquedas Recientes" muestra la búsqueda con su badge de etiqueta
3. Click en la búsqueda del historial

**Resultado esperado:**
- ✅ Formulario se llena automáticamente
- ✅ Geocodificación se ejecuta automáticamente
- ✅ Panel "Gestión de Marcador" aparece con la etiqueta "Compra" pre-seleccionada
- ✅ Checkbox "Mantener marcador" está marcado

### Paso 5: Cambiar Etiqueta
1. En el panel de gestión, cambiar etiqueta a "Posible flip"
2. Click en "Guardar Etiqueta"
3. Verificar que el badge en "Búsquedas Recientes" cambia a púrpura "Posible flip"

**Resultado esperado:**
- ✅ Notificación: "Etiqueta 'Posible flip' guardada correctamente"
- ✅ Badge actualizado en historial

### Paso 6: Desmarcar "Mantener marcador"
1. Desmarcar checkbox "Mantener marcador en el mapa"
2. Click en "Guardar Etiqueta"
3. Recargar página

**Resultado esperado:**
- ✅ Búsqueda sigue en historial (con etiqueta)
- ✅ Marcador NO se restaura automáticamente al recargar
- ✅ Al hacer click en la búsqueda, se geocodifica nuevamente

### Paso 7: Eliminar Marcador
1. Geocodificar una nueva dirección (diferente)
2. Click en botón rojo **"Eliminar"**
3. Confirmar en el diálogo de alerta

**Resultado esperado:**
- ✅ Diálogo de confirmación con advertencia clara
- ✅ Marcador desaparece del mapa
- ✅ Panel "Gestión de Marcador" se oculta
- ✅ Panel "Resultados de Geocodificación" se oculta
- ✅ Notificación: "Marcador eliminado correctamente"
- ✅ Datos eliminados de localStorage

## 🔍 Inspección de localStorage

Para verificar los datos guardados:

### En la Consola del Navegador:
```javascript
// Ver todos los marcadores guardados
JSON.parse(localStorage.getItem('property_markers'))

// Ver historial de búsquedas (incluye etiquetas)
JSON.parse(localStorage.getItem('geocoding_search_history'))

// Limpiar todos los marcadores
localStorage.removeItem('property_markers')

// Limpiar historial
localStorage.removeItem('geocoding_search_history')
```

### Estructura de Datos en localStorage:

**`property_markers`:**
```json
{
  "marker_24.809100_-107.394000": {
    "lat": 24.8091,
    "lng": -107.394,
    "address": "Blvd Elbert 2609, Centro, Culiacán",
    "addressData": { ... },
    "tag": "compra",
    "keepMarker": true,
    "timestamp": 1730952000000,
    "lastUpdated": 1730952100000
  }
}
```

**`geocoding_search_history` (con etiqueta):**
```json
[
  {
    "timestamp": 1730952000000,
    "addressData": { ... },
    "result": {
      "latitude": 24.8091,
      "longitude": -107.394,
      "formattedAddress": "...",
      "service": "Google Geocoding API"
    },
    "displayText": "Blvd Elbert 2609, Centro",
    "tag": "compra",
    "keepMarker": true
  }
]
```

## 📊 Flujo de Datos

```
1. Usuario geocodifica dirección
   ↓
2. GeocodingMapApp dispara evento 'geocodingSuccess'
   ↓
3. MarkerManager.onNewMarker() captura evento
   ↓
4. Se genera markerId único (basado en coordenadas)
   ↓
5. Se verifica si existe en localStorage
   ↓
6. Se muestra panel de gestión (con datos guardados si existen)
   ↓
7. Usuario selecciona etiqueta y guarda
   ↓
8. MarkerManager.saveMarkerData() guarda en localStorage
   ↓
9. Se dispara evento 'markerTagUpdated'
   ↓
10. SearchHistory.updateHistoryTag() actualiza historial
   ↓
11. Se re-renderiza historial con badge de etiqueta
```

## 🎨 Estilos y UI

### Componentes Visuales:
- **Panel de Gestión:** Estilo consistente con otros paneles (fondo blanco, bordes redondeados)
- **Header Púrpura:** Gradiente de-purple-50 to purple-100/50
- **Select de Etiqueta:** Tailwind rounded-xl con focus ring púrpura
- **Vista Previa:** Fondo dinámico según etiqueta seleccionada
- **Badges en Historial:** Colores según etiqueta (verde, naranja, azul, etc.)
- **Botones:**
  - Guardar: bg-purple-600
  - Eliminar: bg-red-600

### Responsive:
- Diseño adaptable a móviles
- Checkboxes accesibles con labels clickeables
- Focus states para navegación por teclado

## 🛠️ Mantenimiento y Extensión

### Agregar Nueva Etiqueta:
1. Editar `js/marker-manager.js`
2. Agregar objeto al array `TAGS`:
```javascript
{
    value: 'alquilada',  // ID único
    label: 'Alquilada',  // Texto visible
    color: '#059669',    // Color del texto
    bgColor: '#d1fae5'   // Color del fondo
}
```
3. Guardar y recargar página

### Personalizar Colores:
Usar paleta de Tailwind CSS:
- Azul: `#3b82f6` / `#dbeafe`
- Verde: `#10b981` / `#d1fae5`
- Naranja: `#f59e0b` / `#fef3c7`
- Rojo: `#ef4444` / `#fee2e2`
- Púrpura: `#8b5cf6` / `#ede9fe`

### Debugging:
Todos los módulos tienen console.log con prefijos:
- 🔵 Carga del módulo
- 🏷️ Gestión de etiquetas
- 📝 Historial
- ✅ Éxito
- ❌ Error

## ⚠️ Consideraciones Importantes

1. **Requiere Servidor HTTP:**
   - NO funciona con `file://` (CORS bloquea JSON de colonias)
   - Usar `python3 -m http.server 8000` en desarrollo
   - En producción (casasenventa.info) funciona sin problemas

2. **Límites de localStorage:**
   - Límite típico: 5-10MB
   - El sistema no tiene límite de marcadores, pero es buena práctica limpiar datos antiguos

3. **Unicidad de Marcadores:**
   - Los marcadores se identifican por coordenadas (lat/lng redondeadas a 6 decimales)
   - Dos direcciones muy cercanas (< 1m) compartirían markerId

4. **Sincronización:**
   - Los eventos son síncronos, no hay race conditions
   - localStorage es sincrónico en el mismo tab

## 🚀 Deploy a Producción

### Archivos que Suben a GitHub/Netlify:
```
formulario-inmueble/
├── js/
│   ├── marker-manager.js          (NUEVO)
│   ├── search-history.js          (MODIFICADO)
│   ├── geocoding-map.js
│   └── ...
├── geocoding-map.html             (MODIFICADO)
└── MARKER-MANAGEMENT-README.md    (NUEVO)
```

### Comandos Git:
```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"
git add formulario-inmueble/js/marker-manager.js
git add formulario-inmueble/js/search-history.js
git add formulario-inmueble/geocoding-map.html
git add formulario-inmueble/MARKER-MANAGEMENT-README.md

git commit -m "feat: Sistema completo de gestión de marcadores con etiquetas

- Agregar marker-manager.js con etiquetado extensible
- Panel de gestión con select, preview, y persistencia
- Integración con search-history para sincronización
- 6 etiquetas iniciales (En revisión, Compra, Venta, Flip, Descartada)
- localStorage con keepMarker checkbox
- Función eliminar marcador con confirmación
- Badges de etiquetas en historial de búsquedas
- Documentación completa en MARKER-MANAGEMENT-README.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
git push netlify main
```

## 📞 Soporte

Si encuentras errores o tienes preguntas:
1. Revisar console del navegador (F12)
2. Verificar que el servidor local esté corriendo
3. Limpiar localStorage si hay datos corruptos
4. Revisar que todos los archivos JS estén cargados (pestaña Network)

---

**Versión:** 1.0
**Fecha:** Noviembre 2025
**Autor:** Sistema automatizado con Claude Code
