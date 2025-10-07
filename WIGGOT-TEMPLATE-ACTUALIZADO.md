# 🎨 TEMPLATE CORRECTO DE WIGGOT - ACTUALIZACIÓN

**Fecha:** 7 de octubre de 2025

## 🎯 Problema Resuelto

**Problema anterior:**
- El generador `generar-desde-json-wiggot.js` usaba template "La Rioja"
- Estructura incorrecta: fotos una detrás de otra (NO en abanico)
- Descripción recortada (no completa)
- Estilo diferente al resto del sitio

**Solución:**
✅ Creado nuevo template basado en **Infonavit Solidaridad** (estructura correcta)
✅ Carrusel en abanico funcional
✅ Descripción completa visible
✅ Script automatizado para reemplazar datos

---

## 📁 Ubicación del Template

```
culiacan/wiggot-template-correcto/
```

⚠️ **NO BORRAR ESTA CARPETA** - Es el template oficial

---

## 🔧 Sistema de Actualización

### Script: `actualizar-datos-wiggot.js`

**Uso:**
```bash
node actualizar-datos-wiggot.js <json-file> <html-file>
```

**Ejemplo:**
```bash
node actualizar-datos-wiggot.js wiggot-datos-pgtrrTw.json culiacan/casa-renta-barrio-san-alberto-pgtrrTw/index.html
```

**Qué hace:**
1. Lee datos del JSON scraped
2. Busca y reemplaza TODOS los datos en el HTML:
   - Precio (11+ lugares)
   - Título
   - Ubicación
   - Recámaras, baños, m², estacionamientos, niveles
   - Descripción completa (hero + sección)
   - Coordenadas GPS
   - Enlaces WhatsApp (3 lugares)
   - Meta tags y Schema.org
   - Email share text

---

## 🚀 Workflow Completo

### Paso 1: Scrapear Propiedad

```bash
node wiggotscraper.js <propertyID>
```

**Resultado:** `wiggot-datos-<ID>.json`

### Paso 2: Copiar Template

```bash
cp -r culiacan/wiggot-template-correcto culiacan/casa-renta-<slug>
```

### Paso 3: Descargar Fotos

Las fotos ya se descargan automáticamente en el scraper, o manualmente:

```bash
cd culiacan/casa-renta-<slug>/images
# Usar comandos curl desde el JSON
```

### Paso 4: Actualizar Datos

```bash
node actualizar-datos-wiggot.js wiggot-datos-<ID>.json culiacan/casa-renta-<slug>/index.html
```

### Paso 5: Verificar Localmente

```bash
open "culiacan/casa-renta-<slug>/index.html"
```

**Checklist:**
- [ ] Precio correcto: $X,XXX,XXX
- [ ] Título y ubicación correctos
- [ ] Specs correctos (rec, baños, m²)
- [ ] Descripción completa visible
- [ ] 17 fotos en carrusel tipo abanico
- [ ] Calculadora con precio correcto
- [ ] Botones WhatsApp funcionan

---

## 📊 Ejemplo Real: Barrio San Alberto

**ID Wiggot:** pgtrrTw
**URL:** https://new.wiggot.com/search/property-detail/pgtrrTw

**Datos:**
- 💰 Precio: $8,000,000
- 🛏️ 3 recámaras
- 🚿 4.5 baños
- 📏 235m² construcción
- 📐 406m² terreno
- 🚗 4 estacionamientos
- 🏢 2 plantas
- 📸 17 fotos

**Carpeta creada:** `culiacan/casa-renta-barrio-san-alberto-pgtrrTw/`

**Estado:** ✅ Verificada 100% correcta

---

## 🔄 Comparación de Templates

| Característica | La Rioja (Viejo) | Wiggot Template Correcto (Nuevo) |
|----------------|------------------|----------------------------------|
| Carrusel | ❌ Fotos apiladas | ✅ Fotos en abanico |
| Descripción | ❌ Recortada | ✅ Completa visible |
| Estilo | ⚠️ Diferente | ✅ Igual a Solidaridad |
| Hero | ❌ Grande | ✅ Compacto (50%) |
| Calculadora | ❌ Grande | ✅ Reducida (70%) |
| Animaciones | ❌ No | ✅ Scroll + Haptic |
| Sticky Bar | ❌ No | ✅ Sí |

---

## 📝 Reemplazos Realizados (14 lugares)

1. ✅ `<title>` - Título de página
2. ✅ `<meta name="description">` - Meta description
3. ✅ `<meta property="og:description">` - Open Graph
4. ✅ Schema.org `"description"` - Structured data
5. ✅ Hero subtitle - Descripción completa
6. ✅ Feature terreno - Badge m²
7. ✅ Badge terreno - Info horizontal
8. ✅ Badge construcción - Info horizontal
9. ✅ Badge plantas - Info horizontal
10. ✅ WhatsApp sticky bar - Enlace + texto
11. ✅ WhatsApp contact section - Enlace + texto
12. ✅ WhatsApp floating button - Enlace + texto
13. ✅ Email share - Subject + body
14. ✅ Calculadora - Valor precio input

---

## ⚠️ Reglas Importantes

1. **NUNCA borrar** `culiacan/wiggot-template-correcto/`
   - Es el template maestro
   - Todas las propiedades se copian de aquí

2. **SIEMPRE usar** `actualizar-datos-wiggot.js`
   - No reemplazar manualmente
   - Garantiza que TODOS los lugares se actualicen

3. **VERIFICAR localmente** antes de publicar
   - Abrir HTML en navegador
   - Probar carrusel, calculadora, WhatsApp
   - Verificar descripción completa

4. **Mantener descripción completa**
   - El script usa `data.description` del JSON
   - Si Wiggot no tiene descripción completa, agregarla manualmente al JSON

---

## 🎉 Resultado Final

✅ **Template 100% funcional** con estilo correcto
✅ **Script automatizado** para actualización de datos
✅ **Documentación completa** para replicar el proceso
✅ **Propiedad de prueba verificada** (Barrio San Alberto)

---

## 📚 Archivos Relacionados

- `culiacan/wiggot-template-correcto/` - Template oficial
- `actualizar-datos-wiggot.js` - Script de actualización
- `wiggotscraper.js` - Scraper de Wiggot
- `wiggot-datos-*.json` - Datos scraped
- `WIGGOT-TEMPLATE-ACTUALIZADO.md` - Este documento

---

**Autor:** Hector es Bienes Raíces + Claude
**Versión:** 1.0
**Estado:** ✅ Producción
