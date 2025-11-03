# 🎨 TUHABI - ESTILOS EXACTOS (Extracción Completa)

**Fuente:** https://tuhabi.mx/formulario-inmueble/inicio
**Fecha:** 30 octubre 2025

---

## 📐 HEADER

```css
.header {
    height: 64px;
    position: fixed;
    top: 0;
    z-index: 101;
    background: #FFFFFF;
}

.logo h1 {
    font-family: 'Montserrat', sans-serif;
    font-size: 43px;                    /* mobile */
    font-size: 56px;                    /* 1280px+ */
    font-weight: 700;
    color: #252129;
}
```

---

## 📊 PROGRESS BAR

```css
.progress-bar-container {
    height: 4px;                        /* mobile */
    height: 12px;                       /* 768px+ */
    background: #f3f3f3;
    position: fixed;
    top: 64px;
}

.progress-bar {
    background: #9634FF;
    width: 2.94%;                       /* inicial */
    transition: width 0.2s ease-in-out;
}
```

---

## 🎯 MAIN CONTENT

```css
.main-container {
    padding-top: 33px;                  /* mobile */
    padding-top: 25px;                  /* tablet */
    padding-top: 55px;                  /* desktop */
    background: #FFFFFF;
}

.form-wrapper {
    max-width: 540px;                   /* mobile */
}
```

---

## 📝 TÍTULOS

```css
.hero-title,
.step-title {
    font-size: 30px;                    /* NO 2.6rem! */
    font-weight: 700;
    color: #252129;
    letter-spacing: -0.01em;
    margin-bottom: 24px;
    font-family: 'Montserrat', sans-serif;
}

.hero-subtitle {
    font-size: 18px;                    /* desktop */
    font-size: 14px;                    /* mobile */
    font-weight: 400;
    color: #252129;
    line-height: 150%;
}
```

---

## 🔤 INPUTS

```css
.form-control {
    height: 40px;                       /* NO 48px! */
    border: 1px solid #78747B;          /* Gris medio #78747B */
    border-radius: 8px;
    font-size: 16px;
    padding-left: 16px;
    padding-right: 16px;
    background: transparent;
    font-family: 'Roboto', sans-serif;
    color: #252129;
}

.form-control:focus {
    border: 1px solid #3483FA;          /* Azul focus */
    outline: none;
}

.form-control:disabled {
    background: #f3f3f3;
    border: 1px solid #949494;
}
```

---

## 🏷️ LABELS

```css
.form-label {
    font-size: 16.5px;                  /* desktop */
    font-size: 14.5px;                  /* mobile */
    font-weight: 400;
    color: #252129;
    margin-bottom: 4px;
    font-family: 'Roboto', sans-serif;
}
```

---

## 🎨 COLORES EXACTOS

```css
/* Morados */
--tuhabi-purple-primary: #7C01FF;
--tuhabi-purple-light: #9634FF;

/* Textos */
--tuhabi-text-primary: #252129;       /* Casi negro */
--tuhabi-text-medium: #78747B;        /* Gris medio */
--tuhabi-border-default: #949494;     /* Border inputs */
--tuhabi-border-icon: #96939a;        /* Border iconos */

/* Fondos */
--tuhabi-bg-white: #FFFFFF;
--tuhabi-bg-gray: #f3f3f3;

/* Estados */
--tuhabi-focus: #3483FA;              /* Azul focus */
--tuhabi-error: #E51717;
```

---

## 📏 ESPACIADO

```css
/* Vertical spacing */
margin-bottom: 4px;                   /* Label a input */
margin-bottom: 24px;                  /* Entre inputs */
margin-bottom: 16px;                  /* Mobile secciones */

/* Padding inputs */
padding-left: 16px;
padding-right: 16px;
```

---

## 🔍 DIFERENCIAS CRÍTICAS CON MI IMPLEMENTACIÓN

| Elemento | Mi Implementación | TuHabi REAL | Diferencia |
|----------|-------------------|-------------|------------|
| **Título font-size** | 2.6rem (41.6px) | 30px | ❌ 11.6px más grande |
| **Input height** | 48px | 40px | ❌ 8px más alto |
| **Input border color** | #949494 | #78747B | ❌ Color incorrecto |
| **Label font-size** | 16px | 16.5px/14.5px | ❌ Tamaño fijo |
| **Progress bar height** | 12px fijo | 4px mobile, 12px desktop | ❌ Sin responsive |
| **Main padding-top** | 64px fijo | 33/25/55px responsive | ❌ Sin variación |

---

## ✅ PRIORIDADES DE CORRECCIÓN

1. **Título: 30px** (no 2.6rem)
2. **Input height: 40px** (no 48px)
3. **Input border: #78747B** (no #949494)
4. **Labels: 16.5px desktop, 14.5px mobile**
5. **Progress bar: 4px mobile, 12px desktop**
6. **Main padding-top responsive**
