# 💼 CRM Dashboard - Hector BR CRM

Dashboard profesional single-page para búsqueda rápida de propiedades y gestión de contactos de vendedores.

## 🚀 Inicio Rápido

### Opción 1: Abrir directo en el navegador (recomendado)
```bash
open crm-dashboard/index.html
```

### Opción 2: Con servidor local (para desarrollo)
```bash
# Desde la raíz del proyecto
cd crm-dashboard

# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080

# Node.js (si tienes http-server)
npx http-server -p 8080
```

Luego abre: http://localhost:8080

## 🎨 Diseño Profesional

### Paleta de Colores
- **Naranja corporativo**: `#FF6A00` (primary)
- **Naranja oscuro**: `#E55F00` (hover)
- **Gris oscuro**: `#1F2933` (textos)
- **Gris medio**: `#52606D` (subtextos)
- **Gris claro**: `#F5F7FA` (fondos)

### Tipografía
- **Fuente**: Inter (Google Fonts)
- Diseño limpio y profesional
- Jerarquía visual clara

## 📊 Características

### Barra de Navegación Superior
- Logo corporativo (gradiente naranja)
- Título "Hector BR CRM"
- Indicador de estado (online/offline)
- Contador de propiedades totales

### Dashboard de Estadísticas
- **Tarjeta de Propiedades**: Gradiente naranja con contador total
- **Tarjeta de Vendedores**: Total de vendedores registrados
- **Última Actualización**: Fecha y hora del último scrapeo

### Búsqueda y Filtros Combinados
- **Campo de búsqueda**: Buscar por ID, título, colonia, o nombre del vendedor
- **Filtro de Ciudad**: Selector dropdown (Todas las ciudades, Culiacán, Mazatlán, Monterrey)
- **Filtro de Tipo**: Selector dropdown (Venta y Renta, Venta, Renta)
- **Filtro de Colonia**: Autocomplete con catálogo de 631 colonias/fraccionamientos
  - Catálogo completo de Culiacán (224 colonias + 407 fraccionamientos)
  - Búsqueda inteligente sin acentos
  - Se activa al seleccionar ciudad "Culiacán"
  - Muestra resultados mientras escribes
  - Activa vista especial orientada por colonia
- **Contador de Resultados**: "Mostrando X de Y propiedades"
- **Botón Limpiar Filtros**: Restaurar búsqueda completa
- Los filtros se actualizan en tiempo real

### Lista de Propiedades
- **Tarjetas modernas**: Diseño card-based con elevación y hover effects
- **Foto placeholder**: Icono de casa con gradiente gris
- **Información completa**:
  - Título de la propiedad (truncado a 2 líneas)
  - Colonia, ciudad, y ID
  - Badge de tipo (VENTA verde / RENTA amarillo)
  - Precio destacado (formato $X,XXX,XXX)
  - Nombre del vendedor
- **Interacción**: Click en cualquier tarjeta para ver detalles
- **Límite**: Muestra primeras 50 propiedades filtradas
- **Scroll suave**: Auto-scroll en móvil al seleccionar

### Panel de Detalles (Sticky en Desktop)
Al seleccionar una propiedad muestra:

**Sección Superior:**
- Imagen de propiedad (placeholder gradiente)
- Badge de tipo (VENTA / RENTA)
- Título completo
- Ubicación (colonia, ciudad)
- Precio destacado (tamaño grande, color naranja)

**Sección de Contacto:**
- Nombre completo del vendedor
- Teléfono con botón "Copiar" (clipboard)
- Canal de origen (Inmuebles24, etc.)

**Botones de Acción:**
- **Ver Página**: Botón naranja con gradiente - Abre propiedad en casasenventa.info
- **WhatsApp**: Botón verde - Chat directo con mensaje pre-llenado

**Otras Propiedades:**
- Lista de otras propiedades del mismo vendedor (máximo 5)
- Click en cualquier propiedad para cambiar la vista
- Precio y título de cada propiedad

**Estados:**
- **Inicial**: "Selecciona una propiedad para ver sus detalles"
- **Sin resultados**: "No encontramos coincidencias para tu búsqueda en [Ciudad]"
- **Error**: Mensaje de error con icono rojo

## 🎯 Flujos de Uso

### Caso 1: Buscar por ID de Propiedad
```
1. Escribir ID en campo de búsqueda (ej: "143508352")
2. Resultados se filtran automáticamente en tiempo real
3. Click en la tarjeta de la propiedad
4. Panel derecho muestra detalles completos + contacto del vendedor
5. Click "Copiar teléfono" → número copiado al clipboard
6. Click "WhatsApp" → abre chat directo con mensaje pre-llenado
```

### Caso 2: Buscar por Título o Colonia
```
1. Escribir texto en búsqueda (ej: "Privanzas Natura")
2. Sistema busca en título, colonia, ID, y nombre de vendedor
3. Resultados se actualizan instantáneamente
4. Click en cualquier tarjeta para ver detalles
5. Panel derecho muestra ubicación completa y contacto
```

### Caso 3: Filtrar por Ciudad
```
1. Seleccionar ciudad en dropdown (ej: "Monterrey")
2. Se filtran solo propiedades de Monterrey
3. Contador muestra "Mostrando X de Y propiedades"
4. Combinar con búsqueda de texto si se necesita
5. Click "Limpiar filtros" para restaurar vista completa
```

### Caso 4: Filtrar por Tipo (Venta/Renta)
```
1. Seleccionar tipo en dropdown (ej: "Venta")
2. Se muestran solo propiedades en venta (badge verde)
3. Combinar con filtro de ciudad para búsqueda específica
4. Ver otras propiedades del vendedor en panel derecho
```

### Caso 5: Explorar Propiedades de un Vendedor
```
1. Buscar y seleccionar cualquier propiedad
2. En panel derecho, ver sección "Otras propiedades"
3. Click en cualquier propiedad de la lista (máximo 5)
4. Vista cambia automáticamente a esa propiedad
5. Scroll automático en móvil para mejor UX
```

### Caso 6: Buscar por Colonia (Vista Especializada) ✨ **[NUEVO - Oct 2025]**
```
1. Seleccionar ciudad "Culiacán" en filtro de ciudad
2. Aparece campo autocomplete "Buscar colonia"
3. Escribir nombre de colonia (ej: "Las Quintas")
4. Seleccionar colonia de la lista (631 opciones disponibles)
5. Vista cambia automáticamente a layout orientado por colonia:
   - Header: "Propiedades en Las Quintas" con contador
   - Grid: 2 columnas desktop, 1 columna móvil
   - Tarjetas profesionales con:
     * Foto destacada grande (256px altura)
     * Badge tipo VENTA/RENTA en esquina
     * Información completa de vendedor inline
     * Teléfono copiable con feedback visual
     * Botones "Ver página" y "WhatsApp"
     * Chip clickeable del vendedor para filtrar todas sus propiedades
6. Click "Ver todas" en vendedor para ver su inventario completo
7. Click "Limpiar filtros" para regresar a vista general
```

## 📂 Estructura de Archivos

```
crm-dashboard/
├── index.html          # CRM single-page completo
└── README.md          # Este archivo
```

## 🔧 Fuente de Datos

El CRM lee datos de múltiples fuentes:

### 1. Datos de Vendedores y Propiedades
**Archivo:** `../crm-vendedores.json`

### Estructura del JSON
```json
{
  "vendedores": [
    {
      "id": "v001",
      "nombre": "Alejandra",
      "telefono": "6671603643",
      "telefonoFormateado": "667-160-3643",
      "whatsapp": "https://wa.me/526671603643",
      "fuente": "Inmuebles24",
      "propiedades": [
        {
          "id": "143508352",
          "titulo": "Casa en Venta...",
          "precio": "MN 4,000,000",
          "url": "https://...",
          "fechaScrapeo": "2025-10-08",
          "fechaPublicacion": "Publicado hace 30 días"
        }
      ]
    }
  ],
  "estadisticas": {
    "totalVendedores": 19,
    "totalPropiedades": 36,
    "ultimaActualizacion": "2025-10-22T02:37:16.546Z"
  }
}
```

### 2. Catálogo de Colonias (Autocomplete) ✨ **[NUEVO - Oct 2025]**
**Archivo:** `../culiacan_colonias.json`
**Tamaño:** 28KB
**Total registros:** 631

**Estructura:**
```json
{
  "colonias": [
    { "name": "10 de Abril" },
    { "name": "Barrio San Francisco" },
    { "name": "Centro" },
    // ... 224 colonias en total
  ],
  "fraccionamientos": [
    { "name": "Acanto" },
    { "name": "Las Quintas" },
    { "name": "Privanzas Natura" },
    // ... 407 fraccionamientos en total
  ]
}
```

**Características del Catálogo:**
- ✅ **631 opciones totales** - Combinación de colonias (224) y fraccionamientos (407)
- ✅ **Autocomplete inteligente** - Búsqueda sin acentos (normalización NFD)
- ✅ **Ordenado alfabéticamente** - Fácil navegación
- ✅ **Actualización automática** - Se carga al seleccionar ciudad "Culiacán"
- ✅ **Requiere servidor HTTP** - Usar `http://localhost:8080` para evitar CORS

**Uso:**
1. El usuario selecciona "Culiacán" en filtro de ciudad
2. Aparece campo autocomplete "Buscar colonia"
3. El sistema carga `culiacan_colonias.json` vía fetch
4. Combina ambas secciones (colonias + fraccionamientos) en un solo array
5. Ordena alfabéticamente para mejor UX
6. Muestra resultados mientras el usuario escribe

**Nota CORS:**
Si abres el CRM con `file://` protocol, el fetch del catálogo fallará por restricciones CORS. Usa servidor local:
```bash
cd crm-dashboard
python3 -m http.server 8080
# Abre: http://localhost:8080
```

## 🎨 Stack Tecnológico

- **HTML5** + **Vanilla JavaScript** (sin frameworks)
- **Tailwind CSS 3.4** (CDN) con configuración custom extendida
- **Font Awesome 6.5** para iconos
- **Google Fonts** - Inter (400, 500, 600, 700)
- **Fetch API** para cargar JSON
- **CSS Custom Properties** para tema corporativo

## 🚀 Características Técnicas

### Extracción Inteligente de Datos
- **Colonia**: Extrae colonia/fraccionamiento desde campo `ubicacion` o título
  - Limpia prefijos automáticos ("Inmuebles24 Casa Venta Sinaloa")
  - Extrae primera parte significativa antes de comas
  - Fallback: "Colonia no registrada"
- **Ciudad**: Detecta Monterrey, Mazatlán, Culiacán desde título, ubicación, y URL
- **Tipo**: Detecta "venta" o "renta" desde título y URL
- **Precio**: Extrae y formatea números desde strings ("MN 4,000,000" → "$4,000,000")

### Sistema de Filtros en Tiempo Real
- **Búsqueda de texto**: Normalización NFD para búsquedas sin acentos
- **Filtros combinados**: Ciudad + Tipo + Colonia + Búsqueda de texto
- **Autocomplete de Colonias** ✨ **[NUEVO]**:
  - Carga dinámica desde `culiacan_colonias.json`
  - 631 opciones (224 colonias + 407 fraccionamientos)
  - Búsqueda sin acentos (normalización NFD)
  - Se activa solo en ciudad "Culiacán"
  - Resultados en tiempo real mientras escribes
- **Actualización instantánea**: Event listeners en inputs
- **Contador dinámico**: "Mostrando X de Y propiedades"
- **Sin recargas**: Todo en memoria (alto rendimiento)

### Responsive Design
- **Mobile-first**: Diseño optimizado para móviles
- **Breakpoints**: lg (1024px+) para layout desktop
- **Grid adaptable**: 1 col móvil, 2 cols desktop (lista + panel)
- **Sticky panel**: Panel de detalles fijo en desktop
- **Auto-scroll**: Scroll automático a panel en móvil al seleccionar

### Performance
- **Carga única**: JSON cargado una sola vez al inicio
- **Filtros en memoria**: Sin peticiones al servidor
- **Límite de 50**: Máximo 50 propiedades renderizadas (evita lag)
- **Skeleton loading**: Estado de carga con animación
- **Lazy evaluation**: Solo renderiza propiedades visibles

### Interactividad
- **Hover effects**: Elevación de tarjetas con transform + shadow
- **Copy to clipboard**: Copia de teléfono con feedback visual
- **WhatsApp integration**: Links directos con mensaje pre-llenado
- **Empty states**: Mensajes contextuales según filtros activos
- **Error handling**: Manejo de errores de red con mensajes amigables

## 💡 Decisiones de Diseño

### ¿Por qué Selectores en lugar de Chips?
- **Claridad**: El usuario ve exactamente qué ciudad/tipo está filtrando
- **Accesibilidad**: Más fácil de usar en móviles
- **Espacio**: Ocupa menos espacio vertical que chips
- **Consistencia**: Patrón estándar de filtros en dashboards

### ¿Por qué Extracción de Colonia en lugar de Autocomplete?
- **Datos reales**: Muestra colonias reales desde propiedades scrapeadas
- **Sin mantenimiento**: No requiere actualizar JSON de colonias manualmente
- **Transparencia**: Muestra "Colonia no registrada" cuando no hay datos
- **Rendimiento**: Evita cargar JSON adicional de colonias

### ¿Por qué Panel Sticky en Desktop?
- **Productividad**: El usuario siempre ve detalles mientras explora
- **Workflow**: Evita scroll constante arriba-abajo
- **Multi-tasking**: Puede comparar propiedades fácilmente

## 📝 Próximas Mejoras Propuestas

### Funcionalidades
- [ ] Integración con fotos reales de propiedades (desde casasenventa.info)
- [ ] Export a Excel/CSV de resultados filtrados
- [ ] Historial de búsquedas recientes (LocalStorage)
- [ ] Notas por vendedor/propiedad (persistentes)
- [ ] Sistema de favoritos con localStorage
- [ ] Estadísticas avanzadas (gráficas de precios por ciudad)
- [ ] Integración con Google Calendar (recordatorios de seguimiento)
- [ ] Modo edición inline (agregar/editar vendedores)

### Mejoras Técnicas
- [ ] Service Worker para uso offline
- [ ] LocalStorage para cache de búsquedas y filtros
- [ ] Paginación infinita (scroll) para más de 50 resultados
- [ ] Exportar contacto a vCard (.vcf)
- [ ] Dark mode con toggle
- [ ] Compresión de imágenes con WebP
- [ ] Analytics de búsquedas más frecuentes
- [ ] Sincronización con CRM externo (API)

## 🐛 Troubleshooting

### No se cargan los datos
**Síntoma**: Pantalla en blanco o mensaje "Error al cargar los datos"

**Soluciones**:
1. Verificar que `crm-vendedores.json` existe en la raíz del proyecto
2. Abrir consola del navegador (F12 → Console) para ver errores específicos
3. Si usas `file://` protocol, algunos navegadores bloquean fetch local
   - **Solución**: Usar servidor local (Python/Node.js)
4. Verificar formato JSON válido con [JSONLint](https://jsonlint.com)

### Error de CORS
**Síntoma**: Error "CORS policy" en consola

**Soluciones**:
1. **Recomendado**: Usar servidor local en vez de `file://`
2. **Solo desarrollo**: Extensión "Allow CORS" en Chrome
3. **Producción**: Servir desde GitHub Pages o servidor web

### No se copian los teléfonos
**Síntoma**: Botón "Copiar" no funciona

**Notas**:
- La API `navigator.clipboard` requiere HTTPS o localhost
- En `file://` puede no funcionar correctamente
- **Solución**: Usar servidor local o copiar manualmente

### Panel de detalles no aparece en móvil
**Síntoma**: Al seleccionar propiedad no se ve el panel

**Solución**:
- El sistema hace auto-scroll automáticamente
- Si no funciona, scroll manual hacia abajo
- Verificar que JavaScript está habilitado

### Filtros no funcionan
**Síntoma**: Cambiar ciudad/tipo no filtra propiedades

**Diagnóstico**:
1. Abrir consola (F12)
2. Verificar errores de JavaScript
3. Recargar página con Cmd+R (Mac) o Ctrl+R (Windows)

### Propiedades sin colonia
**Síntoma**: Muestra "Colonia no registrada" en muchas propiedades

**Explicación**:
- Normal: El campo `ubicacion` en JSON puede estar vacío
- El sistema extrae colonia cuando está disponible
- No es un error, es transparencia de datos reales

## 📞 Soporte y Contacto

Para reportar bugs, sugerir mejoras, o consultas:
- **Desarrollador**: Hector Palazuelos
- **Empresa**: Hector es Bienes Raíces
- **Proyecto**: CRM Dashboard Profesional

## 🎯 Casos de Uso Reales

### Escenario 1: Seguimiento de Lead
1. Cliente llama por propiedad ID 143508352
2. Buscar "143508352" en CRM
3. Ver detalles + contacto del vendedor
4. Click "WhatsApp" para coordinar visita
5. Copiar teléfono para llamada directa

### Escenario 2: Prospección por Zona
1. Filtrar ciudad "Monterrey"
2. Filtrar tipo "Venta"
3. Ver todas las propiedades en venta en Monterrey
4. Explorar colonias disponibles
5. Contactar vendedores con mejores propiedades

### Escenario 3: Gestión de Vendedores
1. Buscar nombre del vendedor (ej: "Alejandra")
2. Ver todas sus propiedades listadas
3. Analizar precios y ubicaciones
4. Identificar vendedores con más inventario
5. Planificar estrategia de contacto

### Escenario 4: Búsqueda Especializada por Colonia ✨ **[NUEVO - Oct 2025]**
1. Cliente específicamente busca propiedad en "Las Quintas"
2. Seleccionar ciudad "Culiacán" en filtro de ciudad
3. Escribir "Las Quintas" en autocomplete de colonias
4. Seleccionar "Las Quintas" de la lista
5. Vista cambia a layout profesional orientado por colonia:
   - Título grande: "Propiedades en Las Quintas" con contador
   - Grid 2 columnas desktop con tarjetas expandidas
   - Información completa del vendedor en cada tarjeta
   - Teléfono copiable con un click
6. Click en "Ver todas" del vendedor para ver su inventario completo
7. Click en botón "WhatsApp" para contactar directamente
8. Si se necesita explorar otra colonia, limpiar filtro y repetir

**Ventajas de esta búsqueda:**
- ✅ 631 colonias disponibles en catálogo completo
- ✅ Autocomplete inteligente (encuentra "quintas" aunque escribas "quinta")
- ✅ Vista especializada con más información visible
- ✅ Contacto directo del vendedor inline (no requiere click extra)
- ✅ Facilita comparar propiedades en misma zona geográfica

---

**Última actualización**: Octubre 2025
**Versión**: 2.1.0 (Profesional + Vista Orientada por Colonia)
**Diseño**: Hector BR CRM

## 🆕 Historial de Versiones

### v2.1.0 - Octubre 2025 ✨
- ✅ **Vista orientada por colonia** - Layout especializado con grid 2 columnas
- ✅ **Autocomplete de colonias** - 631 opciones (224 colonias + 407 fraccionamientos)
- ✅ **Filtro por vendedor** - Chip clickeable para ver todas las propiedades de un vendedor
- ✅ **Teléfono copiable inline** - Copy to clipboard con feedback visual (2 segundos)
- ✅ **Empty state mejorado** - Mensajes contextuales según filtros activos
- ✅ **Catálogo de colonias** - Integración con `culiacan_colonias.json`
- ✅ **Normalización NFD** - Búsqueda sin acentos en autocomplete
- ✅ **Carrusel de fotos** - Todas las tarjetas con navegación de fotos

### v2.0.0 - Octubre 2025
- ✅ Sistema de filtros combinados (Ciudad + Tipo + Búsqueda)
- ✅ Panel de detalles sticky en desktop
- ✅ Tarjetas modernas con carrusel de fotos
- ✅ Integración WhatsApp con mensajes pre-llenados
- ✅ Calculadora hipotecaria inline
- ✅ Responsive design mobile-first
- ✅ SEO completo (meta tags, Schema.org, Open Graph)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
