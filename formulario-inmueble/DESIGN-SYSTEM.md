# Design System - Formulario Inmueble
## Paleta Cálida-Contemporánea

---

## 🎨 **Paleta de Colores**

### Colores Principales
```css
--color-base: #FAF7F2;           /* Marfil suave (fondo) */
--color-contrast: #1F1F1F;       /* Carbón (texto principal) */
--color-terracota: #E76F51;      /* Terracota brillante (primario) */
--color-salvia: #2A9D8F;         /* Verde salvia (secundario/éxito) */
```

### Colores Funcionales
```css
--color-border: #DAD7D0;         /* Gris claro (bordes) */
--color-white: #FFFFFF;          /* Blanco puro */
--color-error: #DC2626;          /* Rojo error */
--color-success: #16A34A;        /* Verde éxito */
```

### Escala de Grises
```css
--gray-50: #FAFAF9;   --gray-500: #78716C;
--gray-100: #F5F5F4;  --gray-600: #57534E;
--gray-200: #E7E5E4;  --gray-700: #44403C;
--gray-300: #D6D3D1;  --gray-800: #292524;
--gray-400: #A8A29E;  --gray-900: #1C1917;
```

---

## 📝 **Tipografía**

### Fuentes
- **Títulos**: DM Sans (bold, geométrica, fresca)
- **Cuerpo**: Inter (regular, máxima legibilidad)

### Escala de Tamaños
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 2rem;        /* 32px */
```

### Uso
- **H1**: 32px (títulos principales)
- **H2**: 24px (subtítulos de paso)
- **H3**: 20px (títulos de sección)
- **Body**: 16px (texto general)
- **Small**: 14px (hints, labels secundarios)
- **Microcopy**: 12px (paso actual, uppercase)

### Letter Spacing
- **Títulos**: -0.02em (tracking compacto)
- **Microcopy**: 0.24em (amplio, premium)
- **Body**: normal

---

## 📐 **Espaciado**

### Sistema de Espaciado (4px base)
```css
--space-1: 0.25rem;      /* 4px */
--space-2: 0.5rem;       /* 8px */
--space-3: 0.75rem;      /* 12px */
--space-4: 1rem;         /* 16px */
--space-5: 1.25rem;      /* 20px */
--space-6: 1.5rem;       /* 24px */
--space-8: 2rem;         /* 32px */
--space-10: 2.5rem;      /* 40px */
--space-12: 3rem;        /* 48px */
--space-16: 4rem;        /* 64px */
```

### Paddings Recomendados
- **Tarjetas**: 40px (space-10)
- **Inputs**: 16px vertical, 20px horizontal
- **Botones**: 16px vertical, 32px horizontal
- **Secciones**: 40-64px entre bloques

---

## 🎭 **Border Radius**

```css
--radius-sm: 4px;        /* Checkboxes, pequeños */
--radius-md: 8px;        /* Elementos medianos */
--radius-lg: 12px;       /* Inputs, botones, tarjetas */
--radius-xl: 16px;       /* Hero blocks */
--radius-full: 9999px;   /* Chips, badges circulares */
```

---

## ✨ **Sombras**

```css
--shadow-soft: 0 12px 40px rgba(15, 23, 42, 0.08);
--shadow-glow: 0 0 0 3px rgba(231, 111, 81, 0.1);
--shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
               0 2px 4px -1px rgba(0, 0, 0, 0.06);
```

### Uso
- **Tarjetas**: shadow-soft
- **Focus states**: shadow-glow
- **Elevación ligera**: shadow-card

---

## ⏱️ **Transiciones**

```css
--transition-fast: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Aceleración suave al inicio
- Desaceleración suave al final
- Material Design standard

---

## 📏 **Layout**

### Grid System
```css
--max-width: 1200px;      /* Contenedor máximo */
--sidebar-width: 280px;   /* Progress sidebar */
--content-width: 600px;   /* Ancho del formulario */
```

### Breakpoints
```css
/* Mobile */
< 768px:    Base (1 columna)

/* Tablet */
768px - 1023px:  2 columnas, sidebar visible

/* Desktop */
1024px - 1279px: Contenido más amplio

/* Large Desktop */
1280px+:         Máxima amplitud, 4 columnas en grids
```

---

## 🎯 **Componentes**

### Inputs
```css
/* Estado normal */
background: white
border: 1px solid #DAD7D0
padding: 16px 20px
border-radius: 12px
min-height: 48px

/* Estado focus */
border-color: #E76F51 (terracota)
box-shadow: 0 0 0 3px rgba(231, 111, 81, 0.1)

/* Estado hover */
border-color: #A8A29E (gray-400)

/* Estado readonly */
background: #F5F5F4 (gray-100)
color: #57534E (gray-600)
cursor: not-allowed
```

### Botones

**Primario (Terracota)**
```css
background: #E76F51
color: white
box-shadow: 0 2px 8px rgba(231, 111, 81, 0.3)
hover: #D45A3A + transform: translateY(-2px)
```

**Secundario (Salvia)**
```css
background: #2A9D8F
color: white
box-shadow: 0 2px 8px rgba(42, 157, 143, 0.3)
```

**Outline**
```css
background: transparent
border: 2px solid #DAD7D0
color: #44403C
hover: border-color: #A8A29E
```

### Tarjetas de Selección
```css
/* Normal */
background: white
border: 2px solid #DAD7D0
padding: 40px
border-radius: 16px

/* Hover */
border-color: #2A9D8F (salvia)
box-shadow: soft
transform: translateY(-4px)

/* Seleccionada */
border-color: #E76F51 (terracota)
background: gradient terracota→salvia (5% opacity)
check icon: terracota, top-right
```

---

## 🎨 **Gradientes**

### Header
```css
linear-gradient(135deg, #E76F51 0%, #2A9D8F 100%)
```

### Barra de Progreso
```css
linear-gradient(90deg, #E76F51 0%, #2A9D8F 100%)
```

### Hero Blocks (fondo)
```css
linear-gradient(135deg,
  rgba(42, 157, 143, 0.05) 0%,
  rgba(231, 111, 81, 0.05) 100%)
```

### Tarjetas Seleccionadas
```css
linear-gradient(135deg,
  rgba(231, 111, 81, 0.05) 0%,
  rgba(42, 157, 143, 0.05) 100%)
```

---

## 🔍 **Estados de Foco**

### Accesibilidad
```css
*:focus-visible {
  outline: 2px solid #E76F51 (terracota)
  outline-offset: 2px
}
```

### Contraste Mínimo
- **4.5:1** para texto normal
- **3:1** para texto grande (18px+)
- **3:1** para componentes UI

---

## 🌓 **Modo Oscuro** (Opcional)

```css
@media (prefers-color-scheme: dark) {
  --color-base: #1C1917;
  --color-contrast: #FAF7F2;
  --color-border: #44403C;
  /* ... grises invertidos ... */
}
```

---

## 📱 **Responsive**

### Mobile (< 768px)
- **1 columna** para form-row
- **1 columna** para property-type-grid
- **Botones apilados** (full-width)
- **Sidebar oculto**
- **Font size**: 16px mínimo (evitar zoom iOS)

### Tablet (768px - 1023px)
- **2 columnas** para form-row
- **2 columnas** para property-type-grid
- **Sidebar visible**
- **Padding lateral**: aumentado

### Desktop (1024px+)
- **Contenido centrado** (max-width: 700-900px)
- **Sidebar fijo** lado izquierdo
- **Inputs más grandes** (56px height)
- **Typography scale up**

### Touch Devices
```css
@media (hover: none) and (pointer: coarse) {
  /* Área de toque mínima: 48-52px */
  .btn { min-height: 52px; }
  .form-control { min-height: 52px; }
  .checkbox-custom { width: 28px; height: 28px; }
}
```

---

## ♿ **Accesibilidad**

### Reducir Movimiento
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

### Alto Contraste
```css
@media (prefers-contrast: high) {
  .form-control { border-width: 2px; }
  .btn { border-width: 2px; font-weight: 700; }
}
```

### ARIA Labels
- **Todos los inputs** tienen labels asociados
- **Errores** con `role="alert"` y `aria-live="polite"`
- **Progress** con `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

---

## 🎯 **Patrones de Diseño**

### Progress Sidebar (Desktop)
```
[1] ● Ubicación          ← Activo (terracota)
    │
[2] ○ Tipo de Inmueble   ← Pendiente (gris)
    │
[3] ○ Características    ← Pendiente
    │
[4] ○ Contacto           ← Pendiente
```

### Barra de Progreso (Mobile)
```
[████████░░░░░░░░] 40%
```

### Chips de Selección
```
[ Seleccionado × ]  [ Normal ]  [ Hover ]
```

---

## 📦 **Assets**

### Iconos
- **Font Awesome 6.4.0** (via CDN)
- **Feather Icons** (lineales, 16-24px)
- **Inline SVG** para iconos custom

### Ilustraciones
- **Vectoriales** planas
- **Monocromáticas** (color salvia)
- **Tamaño**: 150-250px según breakpoint

### Patrones de Fondo
```css
repeating-linear-gradient(
  45deg,
  transparent,
  transparent 10px,
  rgba(42, 157, 143, 0.03) 10px,
  rgba(42, 157, 143, 0.03) 20px
)
```

---

## 🚀 **Performance**

### Optimizaciones
- **Font preconnect** para Google Fonts
- **Lazy loading** de ilustraciones
- **CSS crítico** inline (< 14KB)
- **Transiciones GPU** (transform, opacity)

### Métricas Target
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTI**: < 3.8s

---

## 📝 **Convenciones de Código**

### BEM-like Naming
```css
.form-control          /* Bloque */
.form-control-readonly /* Modificador */
.form-group            /* Bloque contenedor */
```

### Estados
```css
.active                /* Visible/activo */
.selected              /* Seleccionado */
.error                 /* Error de validación */
.valid                 /* Validado correctamente */
.loading               /* Cargando datos */
.disabled              /* Deshabilitado */
```

---

**Última actualización**: 29 de octubre de 2025
**Versión**: 1.0
**Basado en**: Tuhabi + Paleta cálida-contemporánea
