# 🎯 Filtros Interior - Pendiente de Actualización

**Fecha:** 10 de Octubre, 2025
**Status:** ⚠️ **CAMBIOS PENDIENTES**

---

## 📋 RESUMEN DE CAMBIOS NECESARIOS

Tu página actual tiene **5 filtros:**
1. Precio
2. Recámaras
3. Baños
4. Zona
5. Limpiar

**Zillow tiene 4 filtros:**
1. **For Sale** (tipo de listado)
2. **Price** (precio)
3. **Beds & Baths** (combinado en uno)
4. **More** (incluye zona y otros)

---

## ✅ CAMBIOS YA APLICADOS

### 1. **Botones de filtro (chips) actualizados:**
```html
<!-- ANTES -->
[Precio] [Recámaras] [Baños] [Zona] [Limpiar]

<!-- AHORA -->
[For Sale] [Price] [Beds & Baths] [More]
```

---

## ⚠️ CAMBIOS PENDIENTES (INTERIOR DE FILTROS)

### **1. For Sale (Nuevo filtro)**

**Contenido:**
```
┌────────────────────────┐
│ Listing Type       [X] │
│                        │
│ [For Sale] [For Rent] │
│                        │
│         [Done]         │
└────────────────────────┘
```

**HTML necesario:**
```html
<div class="bottom-sheet" id="sheet-type">
  <div class="sheet-header">
    <button class="sheet-close" onclick="closeBottomSheet()">
      <i class="fas fa-times"></i>
    </button>
    <h3>Listing Type</h3>
    <button class="sheet-apply" onclick="applyFilter('type')">
      Done
    </button>
  </div>
  <div class="sheet-content">
    <div class="button-group">
      <button class="option-btn selected" data-value="sale"
              onclick="selectOption(this, 'type', 'sale')">
        For Sale
      </button>
      <button class="option-btn" data-value="rent"
              onclick="selectOption(this, 'type', 'rent')">
        For Rent
      </button>
    </div>
  </div>
</div>
```

---

### **2. Price (actualizar textos)**

**ANTES:**
```
┌────────────────────────┐
│ Rango de Precio    [X] │
│                        │
│ [Todos]                │
│ [Hasta $2.5M]          │
│ [$2.5M - $3.0M]        │
│ [$3.0M - $3.5M]        │
│ [Más de $3.5M]         │
│                        │
│       [Aplicar]        │
└────────────────────────┘
```

**DESPUÉS (ZILLOW):**
```
┌────────────────────────┐
│ Price              [X] │
│                        │
│ [No Min - No Max]      │
│ [$0 - $2.5M]           │
│ [$2.5M - $3.0M]        │
│ [$3.0M - $3.5M]        │
│ [$3.5M+]               │
│                        │
│         [Done]         │
└────────────────────────┘
```

**Cambios:**
- Título: "Rango de Precio" → **"Price"**
- Botón: "Aplicar" → **"Done"**
- Opciones:
  - "Todos" → **"No Min - No Max"**
  - "Hasta $2.5M" → **"$0 - $2.5M"**
  - "Más de $3.5M" → **"$3.5M+"**

---

### **3. Beds & Baths (combinar 2 filtros en 1)**

**ANTES (2 filtros separados):**
```
Filtro 1: Recámaras
┌────────────────────────┐
│ Recámaras          [X] │
│ [Todas] [2+] [3+] [4+] │
│       [Aplicar]        │
└────────────────────────┘

Filtro 2: Baños
┌────────────────────────┐
│ Baños              [X] │
│ [Todos] [1+] [2+] [3+] │
│       [Aplicar]        │
└────────────────────────┘
```

**DESPUÉS (ZILLOW - 1 filtro combinado):**
```
┌────────────────────────────────┐
│ Beds & Baths               [X] │
│                                │
│ Bedrooms                       │
│ [Any] [1+] [2+] [3+] [4+] [5+]│
│                                │
│ Bathrooms                      │
│ [Any] [1+] [2+] [3+] [4+]     │
│                                │
│            [Done]              │
└────────────────────────────────┘
```

**Cambios:**
- **Combinar** ambos filtros en un solo bottom sheet
- Título: **"Beds & Baths"**
- Secciones separadas dentro del mismo sheet
- Botón: "Aplicar" → **"Done"**
- "Todas/Todos" → **"Any"**
- Agregar opción **"5+"** en bedrooms

---

### **4. More (nuevo filtro que incluye Zona + Clear All)**

**ANTES (Zona separada):**
```
┌────────────────────────┐
│ Zona               [X] │
│                        │
│ [Todas]                │
│ [Real del Valle]       │
│ [Zona Marina]          │
│ [Centro]               │
│ [Otras zonas]          │
│                        │
│       [Aplicar]        │
└────────────────────────┘
```

**DESPUÉS (ZILLOW - More Filters):**
```
┌────────────────────────────────┐
│ More Filters               [X] │
│                                │
│ Neighborhood                   │
│ [Any] [Real del Valle]         │
│ [Marina] [Centro]              │
│                                │
│ [Clear All Filters]            │
│                                │
│            [Done]              │
└────────────────────────────────┘
```

**Cambios:**
- Título: "Zona" → **"More Filters"**
- Subsección: **"Neighborhood"**
- Botón "Limpiar" movido aquí: **"Clear All Filters"**
- Botón: "Aplicar" → **"Done"**
- "Todas" → **"Any"**
- Remover "Otras zonas"

---

## 🎨 TEXTO EN INGLÉS (ZILLOW)

Zillow usa **inglés** en toda su interfaz:

| Tu texto (Español) | **Zillow (Inglés)** |
|-------------------|---------------------|
| Rango de Precio | **Price** |
| Recámaras | **Bedrooms** |
| Baños | **Bathrooms** |
| Zona | **Neighborhood** |
| Aplicar | **Done** |
| Todas/Todos | **Any** |
| Más de | **+** (ej: $3.5M+) |
| Limpiar | **Clear All Filters** |

**Opción:** Puedes mantener español si lo prefieres, pero para ser **100% Zillow** deberían estar en inglés.

---

## 📐 ESTRUCTURA ZILLOW DE BOTTOM SHEETS

### **Header (sheet-header):**
```html
<div class="sheet-header">
  <button class="sheet-close">X</button>  <!-- Izquierda -->
  <h3>Título</h3>                        <!-- Centro -->
  <button class="sheet-apply">Done</button> <!-- Derecha -->
</div>
```

### **Content (sheet-content):**
```html
<div class="sheet-content">
  <!-- Sección 1 (si aplica) -->
  <h4>Subsección</h4>
  <div class="button-group">
    <button class="option-btn">Opción</button>
    ...
  </div>

  <!-- Sección 2 (si aplica) -->
  <h4>Subsección 2</h4>
  <div class="button-group">
    ...
  </div>

  <!-- Botones extra (si aplica) -->
  <button>Clear All</button>
</div>
```

---

## 🔧 ARCHIVOS A MODIFICAR

### **1. HTML (mazatlan/index.html)**

**Líneas 1275-1343:** Reemplazar bottom sheets actuales con los 4 nuevos:
- `sheet-type` (nuevo)
- `sheet-price` (actualizar textos)
- `sheet-beds-baths` (combinar bedrooms + bathrooms)
- `sheet-more` (actualizar zone + agregar clear all)

### **2. JavaScript**

**Funciones a actualizar:**
- `openBottomSheet()` - Agregar caso 'type', 'beds-baths', 'more'
- `applyFilter()` - Lógica para nuevos filtros
- `selectOption()` - Manejar múltiples selecciones en 'beds-baths'
- `resetFilters()` - Limpiar todos los filtros (llamado desde 'more')

---

## 🎯 PRIORIDAD DE CAMBIOS

### **Alta prioridad:**
1. ✅ **Chips de filtros** (ya actualizado)
2. ⚠️ **Textos "Aplicar" → "Done"** (fácil, gran impacto)
3. ⚠️ **Price: "Todos" → "No Min - No Max"** (fácil)

### **Media prioridad:**
4. ⚠️ **Combinar Beds & Baths** (requiere JavaScript)
5. ⚠️ **Agregar filtro "For Sale"** (nuevo)

### **Baja prioridad:**
6. ⚠️ **Traducir todo a inglés** (opcional, si quieres 100% Zillow)
7. ⚠️ **Reorganizar "More" con Clear All** (mejora UX)

---

## 📝 PRÓXIMOS PASOS

1. **Actualizar textos simples:**
   - "Aplicar" → "Done" en todos los sheets
   - "Todas/Todos" → "Any"
   - "Rango de Precio" → "Price"

2. **Combinar Beds & Baths:**
   - Crear nuevo `sheet-beds-baths`
   - Eliminar `sheet-bedrooms` y `sheet-bathrooms` separados
   - Actualizar JavaScript

3. **Crear filtro "For Sale":**
   - Nuevo `sheet-type`
   - Agregar lógica JavaScript

4. **Reorganizar "More":**
   - Renombrar `sheet-zone` a `sheet-more`
   - Agregar botón "Clear All Filters"

---

## 🎉 RESULTADO ESPERADO

Después de estos cambios, los filtros serán **100% idénticos a Zillow:**

```
[For Sale ▼] [Price ▼] [Beds & Baths ▼] [More ▼]
     ↓            ↓            ↓              ↓
  2 options   5 ranges   2 sections    Neighborhood
  (Sale/Rent) (prices)  (Beds+Baths)   + Clear All
```

**Tu página:** ✅ Chips actualizados
**Interior:** ⚠️ Pendiente de actualizar

---

**Estado:** Chips de filtros ya están como Zillow. Falta actualizar el interior de cada filtro para que coincidan exactamente.
