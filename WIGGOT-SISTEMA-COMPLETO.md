# 🏠 SISTEMA COMPLETO WIGGOT - MÉTODO DE PLACEHOLDERS

## 🎯 WORKFLOW COMPLETO (3 PASOS - 5 MINUTOS)

### ⚡ PASO 1: Scrapear Propiedad de Wiggot
```bash
node wiggot-scraper-con-login.js pODipRm
```

**✅ Resultado:**
- Login automático con credenciales guardadas
- Click en "Ver todas las fotos" para cargar 14+ imágenes
- Genera: `wiggot-datos-pODipRm.json`

### 🏗️ PASO 2: Generar Página con Template
```bash
node llenar-template-wiggot.js wiggot-datos-pODipRm.json
```

**✅ Resultado:**
- Lee template: `automation/templates/template-wiggot-placeholders.html`
- Llena TODOS los placeholders {{}} con datos del JSON
- Descarga las 14 fotos automáticamente
- Crea: `culiacan/casa-venta-[slug]/index.html`
- Abre automáticamente en navegador para revisar

### 📦 PASO 3: Publicar (después de revisar)
```bash
# Crear tarjeta en culiacan/index.html (manual o con script)
# Luego publicar:
git add .
git commit -m "Add: Casa [Nombre] desde Wiggot ✅"
git push
```

---

## 📋 TEMPLATE SYSTEM

### Archivo Master:
`automation/templates/template-wiggot-placeholders.html`

**Características:**
- ✅ Estructura FIJA - No cambia entre propiedades
- ✅ Placeholders {{VARIABLE}} para rellenar
- ✅ CSS paths correctos (../../styles.css)
- ✅ Todas las modern features incluidas
- ✅ Carrusel, lightbox, calculadora funcionando

### Placeholders Disponibles:
```
{{SLUG}}                  - Slug URL de la propiedad
{{TITULO}}                - Título completo
{{PRECIO}}                - Precio con comas (1,750,000)
{{PRECIO_SIN_COMAS}}      - Precio sin comas (1750000)
{{UBICACION}}             - Dirección completa
{{RECAMARAS}}             - Número de recámaras
{{BANOS}}                 - Número de baños (puede ser 1.5)
{{AREA_CONSTRUIDA}}       - Metros cuadrados construcción
{{AREA_TERRENO}}          - Metros cuadrados terreno
{{ESTACIONAMIENTOS}}      - Número de cajones
{{NIVELES}}               - Número de pisos
{{NIVELES_TEXTO}}         - "Nivel" o "Niveles"
{{DESCRIPCION_CORTA}}     - Primera línea para meta
{{DESCRIPCION_HTML}}      - Descripción completa con <br>
{{TITULO_URL}}            - Título URL-encoded para WhatsApp
{{ENGANCHE_20}}           - 20% del precio formateado
{{TOTAL_FOTOS}}           - Cantidad de fotos
{{CAROUSEL_SLIDES}}       - HTML de slides generados
{{CAROUSEL_DOTS}}         - HTML de dots generados
{{LIGHTBOX_ARRAY}}        - Array JavaScript de imágenes
{{SCHEMA_IMAGES}}         - Array Schema.org de URLs
```

---

## 🔧 SCRIPTS PRINCIPALES

### 1. `wiggot-scraper-con-login.js`
**Función:** Scrapear datos de Wiggot con login automático

**Características:**
- Login con credenciales de `wiggot-credentials.txt`
- Click automático en "Ver todas las fotos"
- Extrae: título, precio, ubicación, recámaras, baños, áreas
- Descarga JSON + screenshot + HTML completo

**Salida:** `wiggot-datos-[propertyId].json`

### 2. `llenar-template-wiggot.js`
**Función:** Llenar template con datos del JSON

**Proceso:**
1. Lee JSON de Wiggot
2. Genera slug: `casa-venta-[titulo]-[propertyId]`
3. Crea carpetas: `culiacan/[slug]/` y `/images/`
4. Descarga TODAS las fotos (foto-1.jpg, foto-2.jpg, ...)
5. Lee template de placeholders
6. Reemplaza TODOS los {{PLACEHOLDERS}}
7. Genera HTML final
8. Abre en navegador automáticamente

**Salida:**
- `culiacan/[slug]/index.html`
- `culiacan/[slug]/images/foto-*.jpg` (14+ fotos)

### 3. `automation/templates/template-wiggot-placeholders.html`
**Función:** Template maestro con estructura fija

**Ventajas:**
- Solo actualizar este archivo para cambiar TODAS las futuras propiedades
- Sin copiar propiedades viejas
- Sin buscar/reemplazar frágil
- Estructura consistente garantizada

---

## ✅ VENTAJAS DEL SISTEMA DE PLACEHOLDERS

### ❌ ANTES (Sistema Viejo):
- Copiar propiedad existente (ej: Portalegre)
- Borrar fotos viejas manualmente
- Descargar fotos nuevas
- Buscar/reemplazar textos (frágil, se saltan cosas)
- Corregir URLs manualmente
- Corregir CSS paths
- Actualizar mapa manualmente
- **Tiempo:** 15-20 minutos + errores

### ✅ AHORA (Sistema de Placeholders):
- Template limpio con {{PLACEHOLDERS}}
- Script llena TODOS los huecos automáticamente
- Descarga fotos automáticamente
- Genera estructura IDÉNTICA a Villa Bonita
- CSS paths correctos garantizados
- Sin posibilidad de olvidar cambiar algo
- **Tiempo:** 3-5 minutos sin errores

---

## 🔍 EJEMPLO COMPLETO

### Datos de entrada (wiggot-datos-pODipRm.json):
```json
{
  "propertyId": "pODipRm",
  "data": {
    "title": "Casa en Venta VILLA BONITA EN CULIACAN SINALOA",
    "price": "1,750,000",
    "location": "Este 220 , Bonita, Culiacán",
    "bedrooms": "2",
    "bathrooms": "1.5",
    "area_construida": "70",
    "area_terreno": "112",
    "estacionamientos": "2",
    "niveles": "1",
    "description": "PLANTA BAJA:\n- COCHERA PARA 2 AUTOS...",
    "images": ["https://media.wiggot.mx/...", ...]
  }
}
```

### Comando:
```bash
node llenar-template-wiggot.js wiggot-datos-pODipRm.json
```

### Resultado:
- Carpeta: `culiacan/casa-venta-villa-bonita-podirpm/`
- HTML: Estructura EXACTA de Villa Bonita
- Fotos: 14 imágenes descargadas
- Todos los placeholders reemplazados correctamente

---

## 📚 MANTENIMIENTO

### Actualizar template para TODAS las propiedades futuras:
1. Editar: `automation/templates/template-wiggot-placeholders.html`
2. Hacer cambios (ej: agregar nueva sección)
3. ¡Listo! Todas las NUEVAS propiedades usarán la versión actualizada

### Ejemplo: Agregar sección de amenidades
```html
<!-- En template-wiggot-placeholders.html -->
<section class="amenities">
    <h2>Amenidades</h2>
    <ul>
        {{AMENIDADES_HTML}}
    </ul>
</section>
```

```javascript
// En llenar-template-wiggot.js
replacements['{{AMENIDADES_HTML}}'] = generarAmenidades(datos);
```

---

## 🎯 REGLAS DE ORO

1. **NUNCA copiar propiedades viejas** - Siempre usar template
2. **NUNCA editar HTMLs manualmente** - Usar sistema de placeholders
3. **SIEMPRE revisar localmente** antes de publicar
4. **TEMPLATE es la fuente de verdad** - Actualizar ahí para cambiar todo

---

## 🚀 PRÓXIMOS PASOS

### Para automatizar AÚN MÁS:
1. Integrar generación de tarjeta para culiacan/index.html
2. Auto-commit y auto-push después de revisar
3. Script único que haga: scrape → generar → tarjeta → publicar

### Comando futuro ideal:
```bash
node wiggot-completo.js pODipRm
# Hace EVERYTHING automáticamente
```

---

**Creado:** Octubre 2025
**Última actualización:** Villa Bonita (pODipRm) - 14 fotos
