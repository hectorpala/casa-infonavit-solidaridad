# 🏠 TEMPLATE CORRECTO DE WIGGOT

⚠️ **IMPORTANTE: NO BORRAR ESTA CARPETA**

Este es el template oficial con el estilo correcto para generar propiedades desde Wiggot.

## ✅ Características del Template

- ✅ **Carrusel en abanico** (estilo correcto)
- ✅ **Descripción completa visible**
- ✅ **Hero compacto** (50% más pequeño)
- ✅ **Calculadora Zillow reducida** (70%)
- ✅ **Sticky Price Bar**
- ✅ **Scroll Animations**
- ✅ **Haptic Feedback (vibración móvil)**
- ✅ **17 fotos** (estructura completa)

## 🎯 Cómo Usar Este Template

### Método Manual:

1. **Copiar template:**
   ```bash
   cp -r culiacan/wiggot-template-correcto culiacan/casa-renta-[slug]
   ```

2. **Descargar fotos de Wiggot** (17 fotos):
   ```bash
   cd culiacan/casa-renta-[slug]/images
   # Usar comando curl para descargar desde media.wiggot.mx
   ```

3. **Actualizar datos con script:**
   ```bash
   node actualizar-datos-wiggot.js wiggot-datos-[ID].json culiacan/casa-renta-[slug]/index.html
   ```

### Método Automático (Recomendado):

```bash
node wiggot-scraper-y-publicar.js "https://new.wiggot.com/search/property-detail/XXXXX"
```

## 📝 Datos que se Reemplazan

El script `actualizar-datos-wiggot.js` reemplaza automáticamente:

1. ✅ Precio (todos los lugares)
2. ✅ Título de la propiedad
3. ✅ Ubicación / Zona
4. ✅ Recámaras
5. ✅ Baños
6. ✅ m² construcción
7. ✅ m² terreno
8. ✅ Estacionamientos
9. ✅ Niveles/plantas
10. ✅ Descripción completa (hero + section)
11. ✅ Coordenadas GPS
12. ✅ Enlaces WhatsApp (3 lugares)
13. ✅ Meta tags y Schema.org
14. ✅ Email share text

## 🔧 Estructura de Archivos

```
wiggot-template-correcto/
├── index.html          # Template HTML con estructura correcta
├── images/             # Carpeta para fotos (vacía en template)
└── README.md          # Este archivo
```

## ⚠️ NO Modificar Directamente

Este template es la **fuente de verdad** para todas las propiedades de Wiggot.

**Si necesitas actualizar TODAS las propiedades futuras:**
1. Editar `culiacan/wiggot-template-correcto/index.html`
2. Hacer cambios (ej: agregar nueva sección)
3. ¡Listo! Todas las NUEVAS propiedades usarán la versión actualizada

## 📊 Basado en

Template creado desde: **Infonavit Solidaridad** (estructura que funciona 100%)

## 🎉 Última Actualización

**Fecha:** 7 de octubre de 2025
**Propiedad de prueba:** Barrio San Alberto (pgtrrTw)
**Estado:** ✅ Verificado y funcionando
