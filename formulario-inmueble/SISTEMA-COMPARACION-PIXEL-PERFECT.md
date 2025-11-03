# 🔍 SISTEMA DE COMPARACIÓN PIXEL-PERFECT

**Fecha:** 30 octubre 2025
**Proyecto:** Formulario Inmuebles vs TuHabi.mx
**Metodología:** Overlay, Diff, y Mediciones Exactas

---

## 📋 ÍNDICE

1. [Método 1: Screenshot Overlay](#método-1-screenshot-overlay)
2. [Método 2: Chrome DevTools Computed](#método-2-chrome-devtools-computed)
3. [Método 3: HTML/CSS Injection](#método-3-htmlcss-injection)
4. [Método 4: Visual Regression Testing](#método-4-visual-regression-testing)
5. [Checklist de Verificación](#checklist-de-verificación-pixel-perfect)

---

## MÉTODO 1: SCREENSHOT OVERLAY

### 🎯 Objetivo
Comparar visualmente ambos sitios usando superposición de imágenes.

### 📸 Paso 1: Capturar Screenshots

**TuHabi Original:**
```bash
# Abrir TuHabi:
open "https://tuhabi.mx/formulario-inmueble/inicio"

# macOS:
# Cmd + Shift + 5 → Capturar ventana completa
# Guardar como: tuhabi-original-paso1.png

# O usar Chrome DevTools:
# F12 → Cmd + Shift + P → "Capture full size screenshot"
```

**Tu Implementación:**
```bash
# Abrir tu sitio:
open "http://localhost:8080"

# Mismo proceso:
# Cmd + Shift + 5 → Capturar ventana completa
# Guardar como: hector-clon-paso1.png

# IMPORTANTE: Usar el MISMO tamaño de ventana (1920x1080 recomendado)
```

### 🖼️ Paso 2: Overlay en Preview (macOS)

**Método A: Preview Inspector:**

1. Abrir ambos screenshots en Preview
2. Tools > Show Inspector (`Cmd + I`)
3. Click en "Colors" tab
4. Hacer clic en elementos de ambas imágenes
5. Comparar valores RGB/Hex directamente

**Ejemplo de verificación:**
```
TuHabi - Progress bar:
RGB: (150, 52, 255)
Hex: #9634FF ✅

Tu clon - Progress bar:
RGB: (150, 52, 255)
Hex: #9634FF ✅ MATCH!
```

**Método B: Photoshop/GIMP (Avanzado):**

1. Abrir Photoshop/GIMP
2. File > Open: `tuhabi-original-paso1.png`
3. File > Place: `hector-clon-paso1.png` (nueva capa)
4. Cambiar modo de fusión a "Difference"
5. Bajar opacidad al 50%

**Interpretación:**
- **Negro puro:** Píxeles idénticos ✅
- **Colores visibles:** Diferencias detectadas ❌

### 🔍 Paso 3: Mediciones con Regla

**macOS Preview:**
1. Tools > Show Inspector > Ruler
2. Medir elementos:
   - Alto del header: debe ser 64px
   - Alto progress bar: 4px (mobile) / 12px (desktop)
   - Altura input: 40px

**Photoshop:**
1. Click en Ruler Tool
2. Trazar línea sobre elemento
3. Info panel muestra medida exacta

---

## MÉTODO 2: CHROME DEVTOOLS COMPUTED

### 🛠️ Objetivo
Extraer y comparar valores CSS computados entre ambos sitios.

### Paso 1: Extraer Valores de TuHabi

```javascript
// Abrir https://tuhabi.mx/formulario-inmueble/inicio
// F12 → Console → Pegar:

const extractStyles = () => {
  const measurements = {};

  // Progress bar
  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    measurements.progressBar = {
      background: getComputedStyle(progressBar).backgroundColor,
      height: getComputedStyle(progressBar.parentElement).height
    };
  }

  // Title
  const title = document.querySelector('h1') || document.querySelector('.step-title');
  if (title) {
    measurements.title = {
      fontSize: getComputedStyle(title).fontSize,
      fontWeight: getComputedStyle(title).fontWeight,
      color: getComputedStyle(title).color,
      fontFamily: getComputedStyle(title).fontFamily
    };
  }

  // Labels
  const label = document.querySelector('label');
  if (label) {
    measurements.label = {
      fontSize: getComputedStyle(label).fontSize,
      fontWeight: getComputedStyle(label).fontWeight,
      color: getComputedStyle(label).color,
      marginBottom: getComputedStyle(label).marginBottom
    };
  }

  // Inputs
  const input = document.querySelector('input[type="text"]') || document.querySelector('select');
  if (input) {
    measurements.input = {
      height: getComputedStyle(input).height,
      border: getComputedStyle(input).border,
      borderRadius: getComputedStyle(input).borderRadius,
      paddingLeft: getComputedStyle(input).paddingLeft,
      fontSize: getComputedStyle(input).fontSize
    };
  }

  // Header
  const header = document.querySelector('header') || document.querySelector('.header');
  if (header) {
    measurements.header = {
      height: getComputedStyle(header).height,
      background: getComputedStyle(header).backgroundColor
    };
  }

  return measurements;
};

const tuhabiStyles = extractStyles();
console.table(tuhabiStyles.title);
console.table(tuhabiStyles.label);
console.table(tuhabiStyles.input);
console.table(tuhabiStyles.header);
console.table(tuhabiStyles.progressBar);

// Copiar resultado completo:
copy(tuhabiStyles);
```

**Guardar output en:** `tuhabi-extracted-styles.json`

### Paso 2: Extraer Valores de Tu Implementación

```javascript
// Abrir http://localhost:8080
// F12 → Console → Pegar el MISMO script de arriba

const tuClonStyles = extractStyles();
console.table(tuClonStyles.title);
console.table(tuClonStyles.label);
console.table(tuClonStyles.input);
console.table(tuClonStyles.header);
console.table(tuClonStyles.progressBar);

// Copiar resultado:
copy(tuClonStyles);
```

**Guardar output en:** `hector-clon-extracted-styles.json`

### Paso 3: Comparar JSON

**Script de comparación (Node.js):**

```javascript
// compare-styles.js

const fs = require('fs');

const tuhabi = JSON.parse(fs.readFileSync('tuhabi-extracted-styles.json', 'utf8'));
const clon = JSON.parse(fs.readFileSync('hector-clon-extracted-styles.json', 'utf8'));

function compareObjects(obj1, obj2, path = '') {
  const diffs = [];

  for (const key in obj1) {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof obj1[key] === 'object' && obj1[key] !== null) {
      diffs.push(...compareObjects(obj1[key], obj2[key], currentPath));
    } else {
      if (obj1[key] !== obj2[key]) {
        diffs.push({
          path: currentPath,
          tuhabi: obj1[key],
          clon: obj2[key]
        });
      }
    }
  }

  return diffs;
}

const differences = compareObjects(tuhabi, clon);

if (differences.length === 0) {
  console.log('✅ PIXEL-PERFECT! No se encontraron diferencias.');
} else {
  console.log(`❌ Se encontraron ${differences.length} diferencias:\n`);
  console.table(differences);
}
```

**Ejecutar:**
```bash
node compare-styles.js
```

---

## MÉTODO 3: HTML/CSS INJECTION

### 🔄 Objetivo
Alternar en tiempo real entre ambas implementaciones en el mismo navegador.

### Paso 1: Extraer HTML Completo de Tu Clon

```javascript
// Abrir http://localhost:8080
// F12 → Console:

const htmlCompleto = document.documentElement.outerHTML;
copy(htmlCompleto);
```

**Guardar en:** `hector-clon-full.html`

### Paso 2: Inyectar en TuHabi

```javascript
// Abrir https://tuhabi.mx/formulario-inmueble/inicio
// F12 → Console → Pegar:

// Guardar HTML original de TuHabi
const tuhabiOriginal = document.documentElement.outerHTML;

// Pegar tu HTML completo aquí (entre backticks)
const tuClonHTML = `
<!-- PEGAR CONTENIDO DE hector-clon-full.html AQUÍ -->
`;

// Variable de toggle
let showingClon = false;

// Función para alternar
window.toggleComparison = function() {
  showingClon = !showingClon;
  document.documentElement.innerHTML = showingClon ? tuClonHTML : tuhabiOriginal;
  console.log(showingClon ? '🔵 Mostrando: TU CLON' : '🟢 Mostrando: TUHABI ORIGINAL');
};

// Agregar botón flotante
const btn = document.createElement('button');
btn.textContent = 'Toggle (X)';
btn.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:12px 24px;background:#7C01FF;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;';
btn.onclick = toggleComparison;
document.body.appendChild(btn);

// O usar tecla X:
document.addEventListener('keydown', (e) => {
  if (e.key === 'x' || e.key === 'X') {
    toggleComparison();
  }
});

console.log('✅ Toggle listo! Presiona X para alternar.');
```

### Paso 3: Comparar Visualmente

**Workflow:**
1. Presiona `X` para mostrar tu clon
2. Observa elementos (colores, tamaños, espaciado)
3. Presiona `X` para volver a TuHabi original
4. Repite para detectar diferencias

**Ventajas:**
- ✅ Comparación en el mismo navegador (sin diferencias de rendering)
- ✅ Toggle instantáneo con tecla
- ✅ Detecta diferencias visuales sutiles

---

## MÉTODO 4: VISUAL REGRESSION TESTING

### 🤖 Objetivo
Automatizar comparación con herramientas profesionales.

### Opción A: BackstopJS (Recomendado)

**Instalación:**
```bash
npm install -g backstopjs
```

**Configuración:**
```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/formulario-inmueble"

backstop init
```

**Editar `backstop.json`:**
```json
{
  "id": "formulario-tuhabi-comparison",
  "viewports": [
    {
      "label": "phone",
      "width": 375,
      "height": 667
    },
    {
      "label": "tablet",
      "width": 768,
      "height": 1024
    },
    {
      "label": "desktop",
      "width": 1920,
      "height": 1080
    }
  ],
  "scenarios": [
    {
      "label": "Step 1 - Location",
      "url": "http://localhost:8080",
      "referenceUrl": "https://tuhabi.mx/formulario-inmueble/inicio",
      "selectors": ["document"],
      "delay": 1000,
      "misMatchThreshold": 0.1
    }
  ]
}
```

**Capturar referencia (TuHabi):**
```bash
backstop reference
```

**Ejecutar test (Tu clon):**
```bash
backstop test
```

**Ver reporte:**
```bash
backstop openReport
```

**Output:**
- Screenshots lado a lado
- Diff visual con áreas resaltadas en rosa
- Porcentaje de similitud

### Opción B: Percy (Visual Testing Platform)

**Setup:**
```bash
npm install --save-dev @percy/cli @percy/puppeteer

# Crear cuenta en https://percy.io/
# Obtener PERCY_TOKEN
export PERCY_TOKEN=tu-token-aqui
```

**Script de test:**
```javascript
// percy-test.js

const puppeteer = require('puppeteer');
const percySnapshot = require('@percy/puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // TuHabi Original
  await page.goto('https://tuhabi.mx/formulario-inmueble/inicio');
  await percySnapshot(page, 'TuHabi Original - Step 1');

  // Tu Clon
  await page.goto('http://localhost:8080');
  await percySnapshot(page, 'Hector Clon - Step 1');

  await browser.close();
})();
```

**Ejecutar:**
```bash
npx percy exec -- node percy-test.js
```

**Ver en Percy.io:**
- Comparación automática
- Diffs visuales
- Historial de cambios

### Opción C: Playwright + Pixelmatch

**Instalación:**
```bash
npm install -D @playwright/test pixelmatch
```

**Script de test:**
```javascript
// pixel-comparison.spec.js

const { test, expect } = require('@playwright/test');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');
const fs = require('fs');

test('Compare TuHabi vs Clon', async ({ page }) => {
  // Screenshot TuHabi
  await page.goto('https://tuhabi.mx/formulario-inmueble/inicio');
  await page.screenshot({ path: 'tuhabi-screenshot.png', fullPage: true });

  // Screenshot Tu Clon
  await page.goto('http://localhost:8080');
  await page.screenshot({ path: 'clon-screenshot.png', fullPage: true });

  // Comparar
  const img1 = PNG.sync.read(fs.readFileSync('tuhabi-screenshot.png'));
  const img2 = PNG.sync.read(fs.readFileSync('clon-screenshot.png'));
  const { width, height } = img1;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }
  );

  // Guardar diff
  fs.writeFileSync('diff-output.png', PNG.sync.write(diff));

  console.log(`Píxeles diferentes: ${numDiffPixels}`);
  expect(numDiffPixels).toBeLessThan(1000); // Tolerancia de 1000 píxeles
});
```

**Ejecutar:**
```bash
npx playwright test
```

---

## CHECKLIST DE VERIFICACIÓN PIXEL-PERFECT

### 📐 MEDIDAS EXACTAS

| Elemento | TuHabi | Tu Clon | ✓ |
|----------|--------|---------|---|
| **Header height** | 64px | | |
| **Progress bar height (mobile)** | 4px | | |
| **Progress bar height (desktop)** | 12px | | |
| **Title font-size** | 30px | | |
| **Label font-size (desktop)** | 16.5px | | |
| **Label font-size (mobile)** | 14.5px | | |
| **Input height** | 40px | | |
| **Input border-width** | 1px | | |
| **Input border-radius** | 8px | | |
| **Input padding-left** | 16px | | |
| **Input padding-right** | 16px | | |
| **Main padding-top (mobile)** | 33px | | |
| **Main padding-top (tablet)** | 25px | | |
| **Main padding-top (desktop)** | 55px | | |

### 🎨 COLORES EXACTOS

| Elemento | TuHabi | Tu Clon | ✓ |
|----------|--------|---------|---|
| **Purple primary** | #7C01FF | | |
| **Purple light** | #9634FF | | |
| **Text primary** | #252129 | | |
| **Text medium** | #78747B | | |
| **Border default** | #949494 | | |
| **Border input** | #78747B | | |
| **Focus blue** | #3483FA | | |
| **Error red** | #E51717 | | |
| **Background white** | #FFFFFF | | |
| **Background gray** | #f3f3f3 | | |

### 🔤 TIPOGRAFÍA

| Elemento | TuHabi | Tu Clon | ✓ |
|----------|--------|---------|---|
| **Heading font** | Montserrat | | |
| **Body font** | Roboto | | |
| **Title weight** | 700 | | |
| **Label weight** | 400 | | |
| **Title letter-spacing** | -0.01em | | |

### 📏 ESPACIADO

| Elemento | TuHabi | Tu Clon | ✓ |
|----------|--------|---------|---|
| **Label → Input** | 4px | | |
| **Entre inputs** | 24px | | |
| **Mobile secciones** | 16px | | |
| **Form max-width** | 540px | | |

### ✅ COMPORTAMIENTO

| Feature | Funciona | ✓ |
|---------|----------|---|
| **Progress bar anima** (25%, 50%, 75%, 100%) | | |
| **Focus color azul** (#3483FA) | | |
| **Validación inline** ("Este campo es requerido") | | |
| **Autocomplete max 5** sugerencias | | |
| **Geolocalización** solicita permisos | | |
| **Multi-step** navegación funciona | | |
| **LocalStorage** guarda progreso | | |

---

## 📊 SCORING SYSTEM

### Cálculo de Precisión:

**Formula:**
```
Precisión = (Items Correctos / Total Items) × 100
```

**Categorías:**

- **Medidas exactas:** 14 items
- **Colores exactos:** 10 items
- **Tipografía:** 5 items
- **Espaciado:** 4 items
- **Comportamiento:** 7 items

**Total:** 40 items

**Niveles:**
- 100% = 40/40 → **Pixel-Perfect ✅**
- 95-99% = 38-39/40 → **Casi perfecto** (diferencias menores)
- 90-94% = 36-37/40 → **Muy bueno** (diferencias aceptables)
- < 90% = < 36/40 → **Necesita corrección** ❌

---

## 🛠️ HERRAMIENTAS RECOMENDADAS

### Online:

1. **ColorZilla** (Chrome Extension)
   - Extrae colores exactos de cualquier sitio
   - https://chrome.google.com/webstore/detail/colorzilla/

2. **PerfectPixel** (Chrome Extension)
   - Overlay de screenshots
   - https://chrome.google.com/webstore/detail/perfectpixel-by-welldonec/

3. **Page Ruler Redux** (Chrome Extension)
   - Mediciones precisas en el navegador
   - https://chrome.google.com/webstore/detail/page-ruler-redux/

4. **WhatFont** (Chrome Extension)
   - Identifica fuentes instantáneamente
   - https://chrome.google.com/webstore/detail/whatfont/

### Desktop:

1. **Photoshop** (Pago)
   - Overlay con modo "Difference"
   - Mediciones pixel-perfect

2. **GIMP** (Gratis)
   - Alternativa open-source a Photoshop
   - https://www.gimp.org/

3. **Figma** (Gratis/Pago)
   - Import screenshots
   - Medir diferencias
   - https://www.figma.com/

### Automatizado:

1. **BackstopJS** (Gratis)
   - Visual regression testing
   - https://github.com/garris/BackstopJS

2. **Percy** (Pago)
   - Visual testing platform
   - https://percy.io/

3. **Chromatic** (Pago)
   - Visual testing para Storybook
   - https://www.chromatic.com/

---

## 📝 REPORTE FINAL

### Template de Reporte:

```markdown
# 🔍 REPORTE DE COMPARACIÓN PIXEL-PERFECT

**Fecha:** [fecha]
**TuHabi URL:** https://tuhabi.mx/formulario-inmueble/inicio
**Clon URL:** [tu-url]

## 📊 RESULTADO GENERAL

**Precisión alcanzada:** XX/40 (XX%)
**Nivel:** [Pixel-Perfect / Casi perfecto / Muy bueno / Necesita corrección]

## ✅ ELEMENTOS CORRECTOS (XX/40)

- [x] Header height: 64px
- [x] Progress bar color: #9634FF
- ...

## ❌ DIFERENCIAS DETECTADAS (XX/40)

| Elemento | TuHabi | Tu Clon | Impacto |
|----------|--------|---------|---------|
| Title font-size | 30px | 41.6px | Alto ❌ |
| Input border color | #78747B | #949494 | Medio ⚠️ |
| ... | ... | ... | ... |

## 📸 SCREENSHOTS

### Overlay Comparison
[Adjuntar: diff-output.png]

### Side-by-Side
[Adjuntar: tuhabi-vs-clon.png]

## 🔧 ACCIONES REQUERIDAS

1. [Acción prioritaria 1]
2. [Acción prioritaria 2]
...

## ⏱️ TIEMPO ESTIMADO CORRECCIÓN

**Total:** X horas

---

**Elaborado por:** [nombre]
**Revisado por:** [nombre]
```

---

**Última actualización:** 30 octubre 2025
**Versión:** 1.0
**Metodologías:** 4 métodos (Screenshot, DevTools, Injection, Automated)
