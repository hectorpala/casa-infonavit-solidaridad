# 📋 CHECKLIST DE QA - PIXEL-PERFECT VERIFICATION

**Fecha:** 30 octubre 2025
**Proyecto:** Formulario Inmuebles - Clon TuHabi Pixel-Perfect

---

## ✅ 1. CONTRASTE Y ACCESIBILIDAD (WCAG)

### 1.1 Prueba de Contraste de Colores

**Herramientas:**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools > Lighthouse > Accessibility

**Verificaciones obligatorias:**

| Elemento | Color Texto | Color Fondo | Ratio Mínimo | ✓ |
|----------|-------------|-------------|--------------|---|
| `.step-header__title` | #252129 | #FFFFFF | 4.5:1 (AA) | |
| `.form-label` | #252129 | #FFFFFF | 4.5:1 (AA) | |
| `.btn--primary` | #FFFFFF | #7C01FF | 4.5:1 (AA) | |
| `.btn--secondary` | #7C01FF | #FFFFFF | 4.5:1 (AA) | |
| `.form-error` | #E51717 | #FFFFFF | 4.5:1 (AA) | |
| `.autocomplete-option` (hover) | #FFFFFF | #9634FF | 4.5:1 (AA) | |

**Comando para verificar en Chrome DevTools:**
```javascript
// Pegar en Console:
const elements = document.querySelectorAll('.step-header__title, .form-label, .btn--primary');
elements.forEach(el => {
  const styles = getComputedStyle(el);
  console.log(`${el.className}: ${styles.color} on ${styles.backgroundColor}`);
});
```

### 1.2 Navegación por Teclado

**Prueba manual (NO herramientas):**

| Acción | Tecla | Comportamiento Esperado | ✓ |
|--------|-------|------------------------|---|
| Navegar a siguiente input | `Tab` | Focus visible con borde azul #3483FA | |
| Navegar a input anterior | `Shift + Tab` | Focus visible sin saltos | |
| Abrir select | `Space` / `Enter` | Dropdown se despliega | |
| Cerrar autocomplete | `Escape` | Lista desaparece, input mantiene focus | |
| Seleccionar sugerencia | `Enter` | Se llena input, lista se cierra | |
| Navegar sugerencias | `ArrowDown` / `ArrowUp` | Cursor se mueve, highlight visual | |
| Enviar formulario | `Enter` (en botón) | Submit se ejecuta | |
| **NO** enviar en input | `Enter` (en input) | Nada pasa (prevención activa) | |

**Verificar con:**
```bash
# Desconecta el mouse y usa SOLO teclado durante 5 minutos
# Si te frustras = hay un bug de UX
```

### 1.3 Screen Readers

**Herramientas:**
- macOS: VoiceOver (`Cmd + F5`)
- Windows: NVDA (gratuito)

**Verificaciones:**

| Elemento | ARIA Attribute | Lectura Esperada | ✓ |
|----------|----------------|------------------|---|
| Progress bar | `role="progressbar"` + `aria-valuenow` | "Progreso: 25 por ciento" | |
| Input con error | `aria-invalid="true"` + `aria-describedby` | "Campo requerido: Este campo es requerido" | |
| Autocomplete | `role="listbox"` | "Lista de sugerencias, 5 opciones" | |
| Botón deshabilitado | `aria-disabled="true"` | "Botón Continuar, deshabilitado" | |
| Select estado | `aria-required="true"` | "Estado / Ciudad, requerido" | |

---

## 📐 2. RESPONSIVE - BREAKPOINT VERIFICATION

### 2.1 Breakpoints Críticos

**Herramienta:** Chrome DevTools > Device Toolbar (`Cmd + Shift + M`)

| Dispositivo | Ancho | Verificaciones Visuales | ✓ |
|-------------|-------|------------------------|---|
| **iPhone SE** | 375px | - Inputs ocupan 100% ancho<br>- Progress bar: 4px alto<br>- Logo: centrado y visible<br>- Botones: full-width | |
| **iPhone 12 Pro** | 390px | - Igual que iPhone SE<br>- Sin scroll horizontal | |
| **iPad Mini** | 768px | - Progress bar: 12px alto<br>- Grid: 2 columnas en cards<br>- Botones: inline (no full-width) | |
| **iPad Pro** | 1024px | - Form max-width: 540px centrado<br>- Footer: fixed al fondo | |
| **Desktop** | 1280px+ | - Hero title: 2.6rem visible<br>- Labels: 16.5px<br>- Espaciado máximo | |

**Comando para verificar alturas:**
```javascript
// En Console de Chrome:
window.addEventListener('resize', () => {
  const progressBar = document.querySelector('.progress__container');
  const height = getComputedStyle(progressBar).height;
  console.log(`Ancho: ${window.innerWidth}px | Progress Bar: ${height}`);
});
// Resize manual y ver cambios en tiempo real
```

### 2.2 Orientación Móvil

| Orientación | Verificación | ✓ |
|-------------|--------------|---|
| Portrait | - Progress bar visible<br>- Inputs accesibles<br>- Footer no oculta botones | |
| Landscape | - Scroll suave<br>- Header sigue fixed<br>- Botones accesibles | |

---

## 🌐 3. CROSS-BROWSER TESTING

### 3.1 Navegadores Soportados

**Últimas 2 versiones de:**
- Chrome/Edge (Chromium)
- Safari (macOS + iOS)
- Firefox

**Verificaciones por navegador:**

| Feature | Chrome | Safari | Firefox | ✓ |
|---------|--------|--------|---------|---|
| CSS Custom Properties (`:root`) | ✓ | ✓ | ✓ | |
| `backdrop-filter: blur()` | ✓ | ✓ | ⚠️ (requiere flag) | |
| Google Maps API | ✓ | ✓ | ✓ | |
| LocalStorage | ✓ | ✓ | ✓ | |
| Geolocation API | ✓ | ✓ | ✓ | |
| `@keyframes` animations | ✓ | ✓ | ✓ | |

**Comando para detectar navegador:**
```javascript
// Pegar en Console:
console.log(navigator.userAgent);
// Verificar que todos los estilos se vean igual
```

---

## ⚡ 4. PERFORMANCE BENCHMARKS

### 4.1 Lighthouse Audit

**Herramienta:** Chrome DevTools > Lighthouse

**Métricas mínimas aceptables:**

| Métrica | Valor Mínimo | ✓ |
|---------|--------------|---|
| **Performance** | 90+ | |
| **Accessibility** | 95+ | |
| **Best Practices** | 90+ | |
| **SEO** | 90+ | |
| **First Contentful Paint (FCP)** | < 1.8s | |
| **Largest Contentful Paint (LCP)** | < 2.5s | |
| **Cumulative Layout Shift (CLS)** | < 0.1 | |

**Comando:**
```bash
# Instalar Lighthouse CLI:
npm install -g lighthouse

# Auditar localmente:
lighthouse http://localhost:8080 --view

# Auditar en producción:
lighthouse https://tu-dominio.netlify.app --view
```

### 4.2 Tamaño de Archivos

| Archivo | Tamaño Máximo | ✓ |
|---------|---------------|---|
| `css/tokens.css` | < 5 KB | |
| `css/layout.css` | < 10 KB | |
| `css/form.css` | < 15 KB | |
| `js/app.js` (sin Google Maps) | < 10 KB | |
| Total CSS (minificado) | < 50 KB | |
| Total JS (minificado) | < 30 KB | |

**Comando para verificar:**
```bash
ls -lh css/*.css js/*.js | awk '{print $9, $5}'
```

---

## 🎨 5. PIXEL-PERFECT VERIFICATION

### 5.1 CSS Diff Comparison

**Método:** Overlay con screenshot de TuHabi

**Pasos:**
1. Abrir TuHabi: https://tuhabi.mx/formulario-inmueble/inicio
2. Screenshot completo del paso 1 (`Cmd + Shift + 5` en macOS)
3. Guardar como `tuhabi-original.png`
4. Abrir tu implementación local
5. Screenshot idéntico (mismo breakpoint)
6. Guardar como `hector-clon.png`

**Comparar con:**
```bash
# macOS: Preview > Tools > Show Inspector > Colors
# Hacer clic en elementos de ambas imágenes y comparar hex values
```

### 5.2 Chrome DevTools Overlay

**Método más preciso:**

1. Abrir tu implementación local
2. `F12` > Elements > Copiar HTML completo del `<body>`
3. Abrir TuHabi real
4. `F12` > Console > Pegar:

```javascript
// Guardar HTML original
const originalHTML = document.body.innerHTML;

// Reemplazar con tu implementación
document.body.innerHTML = `<!-- PEGAR TU HTML AQUÍ -->`;

// Toggle para comparar
let showOriginal = false;
document.addEventListener('keydown', (e) => {
  if (e.key === 'x') {
    showOriginal = !showOriginal;
    document.body.innerHTML = showOriginal ? originalHTML : `<!-- TU HTML -->`;
  }
});
// Presionar "X" para alternar entre original y clon
```

### 5.3 Measurement Verification

**Herramienta:** Chrome DevTools > Elements > Computed

**Verificar valores exactos:**

| Elemento | Propiedad | Valor TuHabi | Tu Implementación | ✓ |
|----------|-----------|--------------|-------------------|---|
| `.step-header__title` | `font-size` | `30px` | | |
| `.form-select` | `height` | `40px` | | |
| `.form-select` | `border` | `1px solid #78747B` | | |
| `.form-label` | `font-size` | `16.5px` (desktop) | | |
| `.progress__container` | `height` | `4px` (mobile) | | |
| `.progress__container` | `height` | `12px` (768px+) | | |
| `.progress__bar` | `background` | `#9634FF` | | |
| `.form-input:focus` | `border-color` | `#3483FA` | | |

**Comando para extraer todas las medidas:**
```javascript
// En Console de tu implementación:
const verify = {
  title: getComputedStyle(document.querySelector('.step-header__title')).fontSize,
  select: getComputedStyle(document.querySelector('.form-select')).height,
  selectBorder: getComputedStyle(document.querySelector('.form-select')).border,
  label: getComputedStyle(document.querySelector('.form-label')).fontSize,
  progress: getComputedStyle(document.querySelector('.progress__container')).height,
  progressBg: getComputedStyle(document.querySelector('.progress__bar')).backgroundColor
};
console.table(verify);
```

---

## 🔍 6. VALIDACIÓN FUNCIONAL

### 6.1 Formulario Multi-Paso

| Paso | Verificación | ✓ |
|------|--------------|---|
| **Paso 1 (Ubicación)** | - Select estado funciona<br>- Autocomplete responde en <300ms<br>- Geolocalización detecta ubicación<br>- Validación inline al blur | |
| **Paso 2 (Tipo)** | - Cards seleccionables con checkmark<br>- Animación bounce al seleccionar<br>- Progreso: 50% | |
| **Paso 3 (Características)** | - Inputs numéricos aceptan solo números<br>- Validación de rangos (min/max)<br>- Progreso: 75% | |
| **Paso 4 (Contacto)** | - Email validation (formato)<br>- Teléfono validation (10 dígitos)<br>- Progreso: 100% | |

### 6.2 Google Places API

**Verificaciones:**

| Feature | Comportamiento Esperado | ✓ |
|---------|------------------------|---|
| **Autocomplete** | - Mínimo 3 caracteres para activar<br>- Máximo 5 sugerencias<br>- Debounce 300ms | |
| **Geolocalización** | - Botón muestra spinner al activar<br>- Timeout 10 segundos<br>- Reverse geocoding llena input | |
| **Keyboard Nav** | - Flechas ↑↓ navegan lista<br>- Enter selecciona<br>- Escape cierra | |

### 6.3 LocalStorage

```javascript
// Verificar en Console:
const saved = localStorage.getItem('tuhabi-form-progress');
console.log(JSON.parse(saved));

// Debe contener:
// { currentStep: X, formData: {...} }
```

---

## ✅ RESUMEN FINAL

### Checklist Pre-Deploy:

- [ ] Contraste WCAG AA (todas las combinaciones)
- [ ] Navegación por teclado 100% funcional
- [ ] Screen reader lee correctamente
- [ ] Responsive 375px - 1920px
- [ ] Cross-browser (Chrome, Safari, Firefox)
- [ ] Lighthouse scores 90+
- [ ] Pixel-perfect con TuHabi (overlay)
- [ ] Medidas exactas verificadas
- [ ] Formulario multi-paso funcional
- [ ] Google Places API operativo
- [ ] LocalStorage guarda progreso

### Tiempo Estimado QA:

- **Contraste y a11y:** 15 minutos
- **Responsive:** 20 minutos
- **Cross-browser:** 15 minutos
- **Performance:** 10 minutos
- **Pixel-perfect:** 30 minutos
- **Funcional:** 20 minutos

**TOTAL:** ~2 horas

---

**Última actualización:** 30 octubre 2025
**Versión:** 1.0
**Compatibilidad:** Chrome 90+, Safari 14+, Firefox 88+
