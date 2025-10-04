# 🔧 SISTEMA DE 2 PASOS: Scraping + Master Template

## 🎯 VENTAJAS

✅ **Separación clara:** Scraping ≠ Generación HTML
✅ **Revisión de datos:** Puedes editar el JSON antes de generar
✅ **Método Master Template garantizado:** Siempre usa el método correcto
✅ **Sin errores:** Validación automática antes de generar
✅ **Organizado:** Todos los JSONs en `scraped-data/`

---

## 📋 USO PASO A PASO

### PASO 1: Scrapear y Guardar Datos

```bash
node scraper-solo-datos.js "URL"
```

**Ejemplos:**
```bash
# Propiedades.com
node scraper-solo-datos.js "https://propiedades.com/inmuebles/casa-en-venta-..."

# Inmuebles24.com
node scraper-solo-datos.js "https://www.inmuebles24.com/propiedades/..."
```

**Output:**
- `scraped-data/[slug]-data.json` → Datos scrapeados
- `images/[slug]/foto-X.jpg` → Fotos descargadas y filtradas

---

### PASO 1.5: Revisar/Editar JSON (Opcional)

Abre el JSON y edita si es necesario:

```json
{
  "title": "Casa en Venta",
  "price": "$3,500,000",      ← Editar si está mal
  "location": "La Primavera",
  "bedrooms": 3,              ← Corregir
  "bathrooms": 2.5,           ← Corregir
  "area": 200,
  "description": "...",
  "tipo": "VENTA",            ← O "RENTA"
  "slug": "casa-venta-...",
  "photoCount": 15,
  "photos": ["foto-1.jpg", ...]
}
```

---

### PASO 2: Generar HTML con Master Template

```bash
node generar-desde-json.js scraped-data/[slug]-data.json
```

**El script automáticamente:**

1. ✅ Lee el JSON
2. ✅ Detecta tipo (VENTA o RENTA)
3. ✅ Usa el método Master Template correcto:
   - **VENTA** → `generateFromMasterTemplateWithValidation()`
   - **RENTA** → `generateFromSolidaridadTemplate()`
4. ✅ Valida estructura (7 checks)
5. ✅ Guarda HTML en ubicación correcta
6. ✅ Abre en navegador para revisión

---

## 🔄 WORKFLOW COMPLETO

```
┌─────────────────────────────────────────────────────────┐
│  PASO 1: Scrapear                                       │
│  node scraper-solo-datos.js "URL"                       │
│                                                          │
│  Output:                                                 │
│  - scraped-data/casa-venta-xxx-123456-data.json         │
│  - images/casa-venta-xxx-123456/foto-1.jpg...           │
└─────────────────────────────────────────────────────────┘
                           │
                           │ (Revisar/editar JSON si es necesario)
                           ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 2: Generar HTML con Master Template              │
│  node generar-desde-json.js scraped-data/xxx.json       │
│                                                          │
│  Si VENTA:                                               │
│  → generateFromMasterTemplateWithValidation()           │
│  → culiacan/casa-venta-xxx-123456/index.html            │
│                                                          │
│  Si RENTA:                                               │
│  → generateFromSolidaridadTemplate()                    │
│  → casa-renta-xxx-123456.html                           │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ✅ Página abierta
                    📝 Revisar
                    🚀 "publica ya"
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
landing casa solidaridad/
├── scraper-solo-datos.js          # PASO 1: Solo scrapea
├── generar-desde-json.js           # PASO 2: Genera HTML
├── scraped-data/                   # JSONs scrapeados
│   ├── casa-venta-xxx-data.json
│   └── casa-renta-yyy-data.json
├── images/                         # Fotos temporales
│   └── casa-venta-xxx/
│       └── foto-1.jpg...
└── culiacan/                       # VENTA (destino final)
    └── casa-venta-xxx/
        ├── index.html
        ├── styles.css
        └── images/
            └── foto-1.jpg...
```

---

## 🛠️ MÉTODOS MASTER TEMPLATE USADOS

### Para VENTA:
```javascript
generator.generateFromMasterTemplateWithValidation(config)
```
- ✅ Validación automática (7 checks)
- ✅ Estructura completa: Hero + Contact + Modern Features
- ✅ Flechas del carrusel
- ✅ Lightbox dinámico
- ✅ Sticky Price Bar
- ✅ Calculadora hipoteca

### Para RENTA:
```javascript
generator.generateFromSolidaridadTemplate(config)
```
- ✅ Estructura EXACTA a Casa Solidaridad
- ✅ Solo 2 secciones: Hero + Contact
- ✅ Tamaño: ~66KB
- ✅ 100% idéntica a referencia

---

## 🔍 VALIDACIONES AUTOMÁTICAS

Paso 2 valida automáticamente:

1. ✅ Sin placeholders sin reemplazar
2. ✅ Fotos referenciadas correctamente
3. ✅ Carrusel con flechas
4. ✅ Lightbox incluido
5. ✅ Sticky Price Bar
6. ✅ Precio aparece múltiples veces
7. ✅ Datos correctos (recámaras, baños)

---

## 📝 CASOS DE USO

### Caso 1: Scrapear y generar directo (todo OK)
```bash
node scraper-solo-datos.js "URL"
node generar-desde-json.js scraped-data/[slug]-data.json
```

### Caso 2: Scrapear, revisar, corregir, generar
```bash
# 1. Scrapear
node scraper-solo-datos.js "URL"

# 2. Editar JSON
nano scraped-data/casa-venta-xxx-data.json

# 3. Generar con datos corregidos
node generar-desde-json.js scraped-data/casa-venta-xxx-data.json
```

### Caso 3: Regenerar después de cambios
```bash
# Solo ejecutar paso 2 de nuevo
node generar-desde-json.js scraped-data/casa-venta-xxx-data.json
```

---

## ⚡ VENTAJAS vs MÉTODO ANTIGUO

| Aspecto | Método Antiguo | Sistema 2 Pasos |
|---------|---------------|-----------------|
| **Scraping** | Scrapea + genera todo junto | Solo scrapea y guarda JSON |
| **Edición** | Difícil, requiere re-scrapear | Fácil, editas JSON |
| **Método** | A veces usa método incorrecto | SIEMPRE usa método correcto |
| **Validación** | No siempre | Siempre (paso 2) |
| **Organización** | Archivos dispersos | Todo en scraped-data/ |
| **Regenerar** | Re-scrapear todo | Solo paso 2 |

---

## 🚀 PRÓXIMOS PASOS

**Después de generar:**

1. Abre la página en navegador (se abre automáticamente)
2. Verifica:
   - ✅ Carrusel funciona con flechas
   - ✅ Lightbox abre al click
   - ✅ Sticky bar aparece al scroll
   - ✅ Fotos correctas
   - ✅ Datos correctos
3. Si todo OK → `publica ya`

---

## ❓ FAQ

**P: ¿Puedo usar el método antiguo (scraper-inmuebles24.js)?**
R: Sí, pero el sistema de 2 pasos es mejor porque garantiza método Master Template correcto.

**P: ¿Qué pasa si el scraping falla?**
R: Revisa el JSON generado, edita manualmente los datos faltantes, y ejecuta paso 2.

**P: ¿Puedo scrapear múltiples propiedades?**
R: Sí, ejecuta paso 1 varias veces, luego paso 2 para cada JSON.

**P: ¿Dónde están los JSONs?**
R: En `scraped-data/` - nunca se borran, puedes regenerar HTML cuando quieras.

---

**Última actualización:** Octubre 3, 2025
**Status:** ✅ Sistema funcionando - Método Master Template garantizado
