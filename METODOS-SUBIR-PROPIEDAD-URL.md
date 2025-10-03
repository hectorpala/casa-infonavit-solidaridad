# 🎯 MÉTODOS PARA SUBIR PROPIEDAD CON URL + MASTER TEMPLATE

## ⚠️ DOCUMENTO CRÍTICO - SIEMPRE CONSULTAR

Este documento define el proceso EXACTO que Claude debe seguir cuando el usuario pide subir una propiedad con URL usando master template.

---

## 📋 COMANDOS DEL USUARIO QUE ACTIVAN ESTE PROCESO:

```
"publica esta URL usando master template"
"sube esta propiedad con master template"
"usa master template para esta URL"
"publica esta https://propiedades.com/..."
```

---

## 🛠️ HERRAMIENTAS A UTILIZAR (EN ORDEN ESTRICTO):

### 1️⃣ EJECUTAR SCRAPER AUTOMÁTICO

**Herramienta:** `Bash` (background)

**Comando:**
```bash
node scraper-y-publicar.js "URL_PROPIEDADES_COM"
```

**Parámetros:**
- `run_in_background: true`
- `timeout: 180000` (3 minutos)

**Ejemplo:**
```javascript
Bash(
  command: 'node scraper-y-publicar.js "https://propiedades.com/inmuebles/..."',
  description: "Scrape and publish property with master template",
  timeout: 180000,
  run_in_background: true
)
```

**Lo que hace:**
1. Scrapea datos con Puppeteer
2. Descarga todas las fotos automáticamente
3. Genera HTML con `automation/generador-de-propiedades.js`
4. Usa método: `generateFromMasterTemplateWithValidation(config)`
5. Valida 7 checks automáticamente
6. Genera tarjeta para culiacan/index.html
7. Guarda JSON de contacto

**Archivos generados:**
- `casa-venta-[slug].html` (página completa)
- `tarjeta-casa-venta-[slug].html` (tarjeta)
- `images/casa-venta-[slug]/foto-1.jpg` ... `foto-N.jpg`
- `contacto-casa-venta-[slug].json`

---

### 2️⃣ MONITOREAR PROGRESO

**Herramienta:** `BashOutput`

**Comando:**
```javascript
BashOutput(bash_id: "ID_del_scraper")
```

**Frecuencia:** Cada 30-60 segundos hasta que status = completed

**Buscar en output:**
```
✅ VALIDACIÓN EXITOSA - HTML 100% CORRECTO
✅ PROCESO COMPLETADO
```

---

### 3️⃣ ABRIR ARCHIVO PARA REVISIÓN

**Herramienta:** `Bash`

**Comando:**
```bash
open casa-venta-[slug].html
```

**Ejemplo:**
```javascript
Bash(
  command: 'open casa-venta-banus-019512.html',
  description: "Open generated property page"
)
```

---

### 4️⃣ REPORTAR RESULTADOS AL USUARIO

**Formato del reporte:**
```markdown
## ✅ [TIPO] [UBICACIÓN] - GENERADO EXITOSAMENTE

### 📊 Resultados del scraping:

**Propiedad:**
- 🏠 **Tipo:** [Casa/Departamento] en Venta
- 📍 **Ubicación:** [Colonia], Culiacán, Sinaloa
- 💰 **Precio:** $X,XXX,XXX
- 🛏️ **Recámaras:** X
- 🛁 **Baños:** X
- 📐 **Área:** XXX m²
- 📸 **Fotos:** X descargadas

### ✅ Generación con Master Template:

```
✅ 1. Placeholders: Todos reemplazados
✅ 2. Fotos: X fotos referenciadas correctamente
✅ 3. Precio: $X,XXX,XXX aparece 8 veces
✅ 4. Features: X recámaras, X baños
✅ 5. WhatsApp: 3 links personalizados
✅ 6. CSS: styles.css cargado (87KB)
✅ 7. Carrusel: totalSlidesHero = X con FLECHAS ← →
```

### 📁 Archivos generados:
- ✅ casa-venta-[slug].html
- ✅ tarjeta-casa-venta-[slug].html
- ✅ contacto-casa-venta-[slug].json
- ✅ images/casa-venta-[slug]/ (X fotos)

**La página está abierta para tu revisión. Revisa que todo se vea bien y luego dime "publica ya" para subirla.**
```

---

### 5️⃣ APLICAR CORRECCIONES (SI USUARIO LAS PIDE)

**Herramientas:** `Read` + `Edit`

**Correcciones comunes:**

#### A. "Casa" → "Departamento"
```javascript
// 1. Leer archivo
Read(file_path: 'casa-venta-[slug].html')

// 2. Corregir title
Edit(
  file_path: 'casa-venta-[slug].html',
  old_string: '<title>Casa en Venta...',
  new_string: '<title>Departamento en Venta...'
)

// 3. Corregir meta description
Edit(
  file_path: 'casa-venta-[slug].html',
  old_string: 'Casa en venta...',
  new_string: 'Departamento en venta...'
)

// 4. Corregir Schema.org @type
Edit(
  file_path: 'casa-venta-[slug].html',
  old_string: '"@type": "SingleFamilyResidence"',
  new_string: '"@type": "Apartment"'
)

// 5. Corregir hero title
Edit(
  file_path: 'casa-venta-[slug].html',
  old_string: '<h1 class="hero-title">Casa en Venta',
  new_string: '<h1 class="hero-title">Departamento en Venta'
)

// ... más correcciones según necesidad
```

#### B. Badge naranja → verde (VENTA)
```javascript
Edit(
  file_path: 'tarjeta-casa-venta-[slug].html',
  old_string: 'bg-orange-500',
  new_string: 'bg-green-600'
)
```

---

### 6️⃣ PUBLICAR (CUANDO USUARIO CONFIRMA)

**Herramienta:** `Task` (gitops-publicador)

**Comando:**
```javascript
Task(
  subagent_type: "gitops-publicador",
  description: "Publicar todos los cambios",
  prompt: `PUBLICA YA

Commit reciente:
- Add: [Tipo] [Ubicación] $X,XXX,XXX
- X recámaras, X baños, XXXm²
- X fotos con carrusel funcionando
- Generado con master template corregido
- Validación 100% exitosa

Deployment a: https://casasenventa.info`
)
```

**Lo que hace el agente:**
1. `git add` archivos nuevos
2. `git commit` con mensaje descriptivo
3. `git push`
4. Inicia deployment en GitHub Pages
5. Reporta URL y tiempo estimado (1-2 min)

---

## 🚫 ERRORES QUE DEBO EVITAR:

### ❌ NUNCA hacer esto:

1. **NO usar otros scrapers:**
   - ❌ `scraper-solo-datos.js` (se detiene antes de generar)
   - ❌ `scraper-propiedad-especifica.js` (sin validación)
   - ✅ **SOLO** `scraper-y-publicar.js`

2. **NO generar HTML manualmente:**
   - ❌ Escribir código HTML desde cero
   - ❌ Copiar/pegar de otras propiedades
   - ✅ Dejar que el scraper lo haga automáticamente

3. **NO usar métodos deprecados:**
   - ❌ `generateFromSolidaridadTemplate()` (viejo)
   - ✅ `generateFromMasterTemplateWithValidation()` (correcto)

4. **NO publicar sin confirmación:**
   - ❌ Publicar automáticamente después del scraper
   - ✅ Esperar que usuario revise y diga "publica ya"

5. **NO saltarse la validación:**
   - ❌ Generar sin validar
   - ✅ Siempre esperar "✅ VALIDACIÓN EXITOSA"

6. **NO olvidar abrir el archivo:**
   - ❌ Solo reportar que se generó
   - ✅ Abrir archivo para que usuario vea visualmente

7. **NO detener el scraper:**
   - ❌ Matar el proceso a mitad de camino
   - ✅ Dejar que complete todo el proceso

---

## ✅ SIEMPRE hacer esto:

1. ✅ Usar `scraper-y-publicar.js` completo
2. ✅ Esperar validación 100% exitosa
3. ✅ Abrir archivo para revisión visual
4. ✅ Reportar resultados claramente al usuario
5. ✅ Esperar confirmación antes de publicar
6. ✅ Aplicar correcciones si usuario las pide
7. ✅ Confiar en el sistema automático

---

## 📚 SCRIPTS Y ARCHIVOS CLAVE:

### 1. `scraper-y-publicar.js` ⭐ PRINCIPAL
- **Ubicación:** `/Users/hectorpc/Documents/.../landing casa solidaridad/scraper-y-publicar.js`
- **Función:** Scraper + generador + validador completo
- **Usa:** `automation/generador-de-propiedades.js`
- **Método:** `generateFromMasterTemplateWithValidation(config)`
- **Output:** HTML + tarjeta + fotos + JSON

### 2. `automation/generador-de-propiedades.js` ⭐ GENERADOR
- **Método principal:** `generateFromMasterTemplateWithValidation(config)`
- **Template base:** `automation/templates/master-template.html`
- **Validador:** `automation/validador-master-template.js`
- **Replacements:** 15+ textos hardcodeados reemplazados automáticamente

### 3. `automation/templates/master-template.html` ⭐ TEMPLATE
- **Basado en:** Casa Solidaridad (completo con todas las features)
- **Placeholders:** `{{VARIABLE}}` reemplazados dinámicamente
- **Features:** Carrusel con flechas, lightbox, sticky bar, calculadora, etc.

### 4. `automation/validador-master-template.js` ⭐ VALIDADOR
- **7 checks automáticos:**
  1. Placeholders reemplazados
  2. Fotos referenciadas
  3. Precio consistente
  4. Features correctos
  5. WhatsApp links
  6. CSS cargado
  7. Carrusel configurado

### 5. `styles.css` (ROOT) ⭐ CSS COMPLETO
- **Tamaño:** 87KB (completo con carrusel)
- **Origen:** `culiacan/infonavit-solidaridad/styles.css`
- **Crítico:** Debe estar actualizado o el carrusel NO funciona

---

## 🎬 CASO DE USO REAL (Departamento Banus):

### Timeline completo:

```
15:12 Usuario: "usa master template publica esta https://propiedades.com/..."

15:12 Claude:
      → Bash: node scraper-y-publicar.js "URL" (background)
      → "🔄 Scraper en progreso..."

15:13 Claude:
      → BashOutput: Monitoreo progreso
      → "✅ Descargando 13 fotos..."

15:14 Claude:
      → BashOutput: Progreso
      → "✅ Generando HTML con master template..."

15:15 Claude:
      → BashOutput: Scraper completado
      → "✅ VALIDACIÓN EXITOSA - HTML 100% CORRECTO"
      → Bash: open casa-venta-banus-019512.html
      → Reporta resultados al usuario

15:16 Usuario: "la descripcion dice departamento porque pusiste casa"

15:17 Claude:
      → Read: casa-venta-banus-019512.html (varios offsets)
      → Edit: "Casa" → "Departamento" (12 lugares)
      → Edit: tarjeta "bg-orange-500" → "bg-green-600"
      → Edit: tarjeta "Casa" → "Departamento"
      → Bash: open casa-venta-banus-019512.html
      → "✅ Corregido - Página abierta"

15:18 Usuario: "publica todos los cambios"

15:19 Claude:
      → Bash: git add (archivos)
      → Bash: git commit (mensaje descriptivo)
      → Task: gitops-publicador "PUBLICA YA"
      → "✅ PUBLICADO - commit 8d0ee8a"

15:21 Resultado:
      ✅ Live en https://casasenventa.info/casa-venta-banus-019512.html
```

**Tiempo total:** 9 minutos (incluyendo correcciones)
**Sin correcciones:** 5 minutos

---

## 🎯 RESUMEN EJECUTIVO:

### Cuando usuario dice: "publica esta URL con master template"

**Yo debo:**
1. ✅ Ejecutar `node scraper-y-publicar.js "URL"` (background)
2. ✅ Monitorear con `BashOutput` hasta completar
3. ✅ Abrir archivo con `open casa-venta-[slug].html`
4. ✅ Reportar resultados claramente
5. ✅ Esperar confirmación o correcciones
6. ✅ Publicar con `gitops-publicador` cuando usuario confirme

**El sistema hace automáticamente:**
- Scrapea + descarga fotos + genera HTML + valida + genera tarjeta
- Todo con master template corregido
- Validación de 7 checks garantiza 100% correcto
- Listo para publicar en 3-5 minutos

**Resultado:**
- Propiedad con carrusel funcionando
- Lightbox expandible
- Todas las modern features
- SEO optimizado
- Lista para producción

---

## 📝 NOTAS FINALES:

1. **Confiar en el sistema automático** - No inventar pasos extra
2. **Siempre esperar validación exitosa** - No publicar si falla
3. **Abrir archivo para revisión visual** - Usuario debe ver resultado
4. **No publicar sin confirmación** - Esperar "publica ya"
5. **Aplicar correcciones rápidamente** - Usar Read + Edit
6. **Reportar claramente** - Usuario debe saber qué se generó

---

**Última actualización:** Octubre 3, 2025
**Confirmado por:** Usuario (decisión "opción recomendada")
**Estado:** ✅ Proceso estándar confirmado y documentado
