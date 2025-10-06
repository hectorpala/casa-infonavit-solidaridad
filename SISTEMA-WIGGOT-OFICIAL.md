# 🏠 SISTEMA WIGGOT OFICIAL - MÉTODO PERMANENTE

## ✅ MÉTODO QUE FUNCIONA (GUARDAR PARA SIEMPRE)

Este es el **método oficial y permanente** para crear propiedades desde Wiggot.

---

## 🎯 WORKFLOW COMPLETO (2 COMANDOS - 5 MINUTOS)

### ⚡ COMANDO 1: Scrapear propiedad
```bash
node wiggot-scraper-con-login.js [propertyID]
```

**Ejemplo:**
```bash
node wiggot-scraper-con-login.js pODipRm
```

**Resultado:**
- ✅ Login automático con credenciales
- ✅ Click en "Ver todas las fotos" (14+ fotos)
- ✅ Genera: `wiggot-datos-pODipRm.json`

### 🏗️ COMANDO 2: Generar página
```bash
node generador-wiggot-universal.js wiggot-datos-[ID].json
```

**Ejemplo:**
```bash
node generador-wiggot-universal.js wiggot-datos-pODipRm.json
```

**Resultado:**
- ✅ Copia estructura de Portalegre (template que funciona)
- ✅ Reemplaza TODOS los datos de Portalegre → Datos nuevos
- ✅ Genera: `culiacan/casa-venta-[slug]/index.html`
- ✅ Muestra comando curl para descargar las 14 fotos

---

## 📋 ESTRUCTURA DEL SISTEMA

### Archivos principales:

1. **`wiggot-scraper-con-login.js`** - Scraper con auto-login
   - Credenciales en: `wiggot-credentials.txt`
   - Extrae: título, precio, ubicación, recámaras, baños, áreas, fotos
   - Output: `wiggot-datos-[ID].json`

2. **`generador-wiggot-universal.js`** - Generador con método que funciona
   - Copia: `culiacan/casa-venta-portalegre-045360/`
   - Buscar/Reemplazar: Portalegre → Nueva propiedad
   - Output: `culiacan/casa-venta-[slug]/index.html`

3. **`culiacan/casa-venta-portalegre-045360/`** - Template base
   - ⚠️ **NO BORRAR NUNCA** - Es la estructura que funciona
   - Todas las nuevas propiedades se copian de aquí

---

## 🔧 ¿POR QUÉ ESTE MÉTODO?

### ❌ Intentos anteriores que NO funcionaron:
- Template con placeholders {{}} - Generó HTML roto
- Sistema de llenar huecos - Problemas con CSS
- Copiar otras propiedades - Datos inconsistentes

### ✅ Método actual que SÍ funciona:
1. Copiar Portalegre (estructura perfecta ya probada)
2. Buscar/Reemplazar textos específicos
3. Resultado: Página IDÉNTICA a Portalegre con datos nuevos
4. CSS, JavaScript, estructura: TODO funciona garantizado

---

## 📸 DESCARGAR FOTOS

El generador muestra el comando exacto para descargar las fotos:

```bash
cd "culiacan/casa-venta-[slug]/images" && \
curl -s "https://media.wiggot.mx/..." -o "foto-1.jpg" && \
curl -s "https://media.wiggot.mx/..." -o "foto-2.jpg" && \
...
```

**Solo copiar y pegar el comando que aparece en la terminal.**

---

## ✅ CHECKLIST DESPUÉS DE GENERAR

1. [ ] Descargar las 14 fotos con el comando curl
2. [ ] Abrir página localmente: `open culiacan/[slug]/index.html`
3. [ ] Verificar:
   - [ ] Fotos se ven correctamente
   - [ ] Carrusel funciona (flechas + dots)
   - [ ] Precio correcto
   - [ ] m² construcción y terreno correctos
   - [ ] Calculadora con precio correcto
   - [ ] Botones WhatsApp funcionan
4. [ ] Crear tarjeta en `culiacan/index.html`
5. [ ] Publicar: `git add . && git commit && git push`

---

## 🚀 EJEMPLO COMPLETO

### Propiedad: Villa Bonita (pODipRm)

```bash
# 1. Scrapear
node wiggot-scraper-con-login.js pODipRm
# Resultado: wiggot-datos-pODipRm.json ✅

# 2. Generar
node generador-wiggot-universal.js wiggot-datos-pODipRm.json
# Resultado: culiacan/casa-venta-villa-bonita-pODipRm/ ✅

# 3. Descargar fotos (copiar comando de la terminal)
cd "culiacan/casa-venta-villa-bonita-pODipRm/images" && \
curl -s "https://media.wiggot.mx/ixPskTs-l.jpg" -o "foto-1.jpg" && \
curl -s "https://media.wiggot.mx/idIPNfu-l.jpg" -o "foto-2.jpg" && \
...
# 14 fotos descargadas ✅

# 4. Revisar
open "culiacan/casa-venta-villa-bonita-pODipRm/index.html"
# Verificar que todo se vea bien ✅

# 5. Publicar
git add .
git commit -m "Add: Casa Villa Bonita desde Wiggot ✅"
git push
```

---

## 📊 DATOS IMPORTANTES

### Template base (Portalegre):
- **Precio:** $1,750,000
- **Construcción:** 65 m²
- **Terreno:** 98 m²
- **Recámaras:** 2
- **Baños:** 1.5
- **Estacionamientos:** 2
- **Niveles:** 2

**Estos valores se reemplazan automáticamente** por los de la nueva propiedad.

### Campos que se reemplazan:
- ✅ Precio (con y sin comas)
- ✅ Título completo
- ✅ Ubicación (calle + fraccionamiento)
- ✅ m² construcción
- ✅ m² terreno
- ✅ Recámaras
- ✅ Baños
- ✅ Estacionamientos
- ✅ Niveles/plantas
- ✅ Slug en todas las URLs
- ✅ Enlaces de WhatsApp
- ✅ Meta tags y Schema.org

---

## ⚠️ REGLAS IMPORTANTES

1. **NUNCA borrar** `culiacan/casa-venta-portalegre-045360/`
   - Es el template maestro
   - Todas las propiedades se copian de ahí

2. **SIEMPRE usar** `generador-wiggot-universal.js`
   - No copiar manualmente
   - No usar otros generadores
   - Este es el método oficial

3. **VERIFICAR localmente** antes de publicar
   - Abrir HTML en navegador
   - Probar carrusel, lightbox, calculadora
   - Verificar datos (especialmente m²)

4. **Descargar TODAS las fotos**
   - El scraper obtiene 14+ fotos
   - Usar el comando curl que muestra el generador
   - Verificar que todas se descargaron

---

## 🔄 MANTENIMIENTO

### Si necesitas actualizar TODAS las propiedades futuras:
1. Editar: `culiacan/casa-venta-portalegre-045360/index.html`
2. Hacer cambios (ej: agregar nueva sección)
3. ¡Listo! Todas las NUEVAS propiedades usarán la versión actualizada

**Portalegre es la fuente de verdad** para la estructura.

---

## 📚 ARCHIVOS DE REFERENCIA

- `wiggot-scraper-con-login.js` - Scraper oficial
- `generador-wiggot-universal.js` - Generador oficial
- `wiggot-credentials.txt` - Credenciales de login
- `culiacan/casa-venta-portalegre-045360/` - Template base (NO TOCAR)
- `SISTEMA-WIGGOT-OFICIAL.md` - Este documento

---

## ✅ ÚLTIMA PROPIEDAD GENERADA

- **Nombre:** Casa Villa Bonita
- **ID:** pODipRm
- **Precio:** $1,750,000
- **Slug:** casa-venta-villa-bonita-pODipRm
- **Fotos:** 14 imágenes
- **Estado:** ✅ Verificada y funcionando
- **Fecha:** Octubre 2025

---

**🔒 ESTE ES EL MÉTODO OFICIAL Y PERMANENTE**

No cambiar a menos que sea absolutamente necesario.
Si funciona, no lo toques.
