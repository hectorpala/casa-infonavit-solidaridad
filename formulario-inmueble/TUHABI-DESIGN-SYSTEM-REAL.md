# 🎨 TUHABI - SISTEMA DE DISEÑO REAL (Extraído del Sitio)

**Fuente:** https://tuhabi.mx/formulario-inmueble/inicio
**Fecha extracción:** 30 octubre 2025

---

## COLORES EXACTOS

### Morados (Primarios)
```css
--tuhabi-purple-primary: #7C01FF;    /* Morado principal */
--tuhabi-purple-light: #9634FF;      /* Morado claro */
--tuhabi-purple-dark: #6301CC;       /* Morado oscuro */
--tuhabi-purple-darker: #320066;     /* Morado muy oscuro */
```

### Textos
```css
--tuhabi-text-primary: #252129;      /* Casi negro */
--tuhabi-text-secondary: #6D6970;    /* Gris oscuro */
--tuhabi-text-tertiary: #78747B;     /* Gris medio */
```

### Bordes y Elementos
```css
--tuhabi-border: #949494;            /* Border estándar */
--tuhabi-border-light: #96939a;      /* Border claro */
```

### Fondos
```css
--tuhabi-bg-white: #FFFFFF;          /* Blanco puro */
--tuhabi-bg-gray: #f3f3f3;           /* Gris claro */
--tuhabi-bg-gray-light: #f5f5f5;     /* Gris muy claro */
```

### Estados
```css
--tuhabi-error: #E51717;             /* Rojo error */
--tuhabi-focus: #3483FA;             /* Azul focus */
```

---

## TIPOGRAFÍA

### Familias
```css
--font-heading: 'Montserrat', sans-serif;
--font-body: 'Roboto', sans-serif;
```

### Tamaños Exactos
```css
/* Headings */
--text-hero: 2.6rem;         /* 41.6px - Título principal */
--text-h2: 30px;             /* Títulos secundarios */
--text-h3: 24px;             /* Títulos pequeños */

/* Body */
--text-label: 16.5px;        /* Labels principales */
--text-label-small: 14px;    /* Labels secundarios */
--text-caption: 13px;        /* Captions y hints */

/* Botones */
--text-button: 14px;         /* Texto de botones (bold) */
```

### Pesos
```css
--weight-regular: 400;
--weight-semibold: 600;
--weight-bold: 700;
```

---

## SPACING (Valores Exactos)

### Inputs
```css
padding-left: 16px;
padding-right: 16px;
padding-top: 12px;
padding-bottom: 12px;
```

### Margins
```css
margin-bottom: 24px;         /* Estándar entre elementos */
margin-bottom: 32px;         /* Entre secciones */
```

### Heights
```css
min-height: 40px;            /* Inputs pequeños */
min-height: 44px;            /* Inputs medianos */
min-height: 48px;            /* Inputs grandes */
```

---

## BORDER RADIUS

```css
border-radius: 6px;          /* Inputs */
border-radius: 8px;          /* Cards */
```

---

## SOMBRAS

```css
drop-shadow(0px 7px 14px rgba(23, 42, 92, 0.13));
```

---

## ESTADOS DE INPUTS

### Normal
```css
border: 1px solid #949494;
background: #FFFFFF;
```

### Focus
```css
border: 1px solid #3483FA;
background: #FFFFFF;
```

### Disabled
```css
background: #f3f3f3;
border: 1px dashed #949494;
```

### Error
```css
border: 1px solid #E51717;
background: #FFFFFF;
```

---

## TRANSICIONES

```css
transition: all 0.7s ease;                  /* Transiciones largas */
transition: width 0.2s ease-in-out;         /* Progress bar */
```

---

## HERO SECTION

### Estructura
- Título bicolor: parte normal + `<span>` morado (#7C01FF)
- Subtítulo descriptivo
- Formulario progresivo (4 pasos)
- Progress bar visual (width inicial: 2.94%)

---

## DIFERENCIAS CON MI IMPLEMENTACIÓN ANTERIOR

| Elemento | Mi Implementación | TuHabi Real | Error |
|----------|-------------------|-------------|-------|
| **Morado principal** | #6C5CE7 | #7C01FF | ❌ Tono incorrecto |
| **Tipografía heading** | Sora | Montserrat | ❌ Fuente incorrecta |
| **Tipografía body** | Inter | Roboto | ❌ Fuente incorrecta |
| **Input height** | 56px | 40-48px | ❌ Muy alto |
| **Border radius** | 12px | 6-8px | ❌ Muy redondeado |
| **Border width** | 2px | 1px | ❌ Muy grueso |
| **Sombras** | Muchas variantes | Una sola | ❌ Over-engineered |
| **Transiciones** | 300ms | 700ms | ❌ Muy rápidas |
| **Focus color** | Morado | Azul #3483FA | ❌ Color incorrecto |

---

## PRÓXIMO PASO

Aplicar ESTOS valores exactos a Hector es Bienes Raíces:
1. Actualizar paleta de colores (#7C01FF, #9634FF, etc.)
2. Cambiar tipografía a Montserrat + Roboto
3. Ajustar inputs: height 40-48px, border 1px, radius 6px
4. Simplificar sombras a una sola
5. Ajustar transiciones a 0.7s
6. Focus color azul #3483FA (no morado)
