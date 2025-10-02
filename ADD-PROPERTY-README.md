# 🚀 CLI Universal - Agregar Propiedades en 5-7 Minutos

Script automatizado que reduce el tiempo de subir propiedades de **18 minutos → 5-7 minutos**.

## ⚡ Uso Rápido

```bash
node add-property.js
```

El script te guiará interactivamente paso a paso.

## 📋 Proceso Automático

| Paso | Acción | Tiempo |
|------|--------|--------|
| 1 | Detecta carpeta de fotos en PROYECTOS | 30 seg |
| 2 | Optimiza todas las fotos (PNG→JPG, 1200px, 85%) | 2 min |
| 3 | Genera página HTML con PropertyPageGenerator | 30 seg |
| 4 | Inserta tarjeta en culiacan/index.html | 30 seg |
| 5 | Commit y push automático a GitHub | 1 min |
| 6 | Verificación en navegador | 1 min |

**Total:** 5-7 minutos ⚡

## 🎯 Ejemplo de Uso

```bash
$ node add-property.js

╔═══════════════════════════════════════════════════════╗
║  🏠 CLI Universal - Agregar Propiedades (5-7 min)   ║
╚═══════════════════════════════════════════════════════╝

¿Tipo de propiedad? (venta/renta) [venta]: venta
Título de la propiedad: Casa en Venta Stanza Toscana
Slug [casa-venta-casa-en-venta-stanza-toscana]: casa-venta-stanza-toscana
Precio (sin $, sin comas): 1990000
Ubicación: Stanza Toscana, Culiacán
Recámaras: 3
Baños: 1.5
M² construcción: 78
M² terreno [mismo]: 110

📂 Buscando carpeta de fotos...

📋 Carpetas encontradas (5):
  1. casa venta paseo toscana (7 fotos)
  2. casa venta privada perla (10 fotos)
  3. casa renta barcelona (8 fotos)

¿Número de carpeta? (o nombre parcial): 1

✅ Carpeta seleccionada: casa venta paseo toscana

📸 Optimizando fotos...
   Encontradas: 7 fotos
   ✓ Optimizadas: 7/7
✅ 7 fotos optimizadas

📄 Generando página HTML...
🏗️  Generando desde template Casa Solidaridad...
   🖼️  Array lightboxImages limpiado: 7 entradas
✅ Página HTML generada

📝 Agregando a listing principal...
✅ Tarjeta agregada a culiacan/index.html

¿Publicar ahora? (s/n) [s]: s

🚀 Publicando cambios...
✅ Cambios publicados en producción

╔═══════════════════════════════════════════════════════╗
║              ✅ PROPIEDAD PUBLICADA                   ║
╚═══════════════════════════════════════════════════════╝

📱 URL: https://casasenventa.info/casa-venta-stanza-toscana.html
📋 Listing: https://casasenventa.info/culiacan/
```

## 🔧 Lo que hace automáticamente

### ✅ Optimización de Fotos
- Detecta automáticamente la carpeta en PROYECTOS
- Convierte PNG → JPG
- Optimiza calidad al 85%
- Redimensiona a máximo 1200px ancho
- Renombra: foto-1.jpg, foto-2.jpg, ..., foto-N.jpg

### ✅ Generación de Página
- Usa PropertyPageGenerator con método Solidaridad
- Copia exacta de estructura de Casa Solidaridad
- Incluye todas las modern features:
  - Sticky Price Bar
  - Scroll Animations
  - Haptic Feedback
  - Calculadora Zillow
  - Hero compacto
- Limpia automáticamente el array lightboxImages
- Corrige rutas de CSS

### ✅ Inserción en Listing
- Genera tarjeta Tailwind CSS compatible
- Inserta automáticamente en culiacan/index.html
- Carrusel con todas las fotos
- Botón WhatsApp personalizado

### ✅ Git Operations
- `git add` de todos los archivos
- Commit con mensaje descriptivo
- Push automático a producción

## 📊 Comparación de Tiempos

| Método | Tiempo | Pasos Manuales |
|--------|--------|----------------|
| **Método Manual (anterior)** | 18 min | 8 pasos |
| **CLI Universal (nuevo)** | 5-7 min | 1 paso |
| **Reducción** | 60% más rápido | 87% menos pasos |

## 🎨 Personalización

El script permite personalizar:
- Tipo de propiedad (venta/renta)
- Título y slug
- Precio
- Ubicación
- Número de recámaras
- Número de baños
- Metros cuadrados (construcción y terreno)

Todo lo demás se genera automáticamente.

## 🐛 Resolución de Problemas

### "No se encontró carpeta de fotos"
- Verifica que la carpeta exista en `/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/`
- El nombre de la carpeta debe contener "casa", "venta" o "renta"

### "Error al insertar en listing"
- Verifica que `culiacan/index.html` tenga el comentario `<!-- Casa Infonavit Barrancos Venta -->`
- Si no existe, el script mostrará advertencia

### "Error en git"
- Verifica que no haya cambios sin commitear
- Ejecuta `git status` para ver el estado del repo

## 📝 Notas

- El script requiere Node.js instalado
- Necesita permisos para ejecutar `sips` (optimización de imágenes)
- Necesita acceso a git configurado
- Las fotos deben estar en formato JPG, JPEG, PNG o WEBP

## 🔗 Archivos Relacionados

- `automation/property-page-generator.js` - Generador de páginas
- `automation/templates/modern-features.js` - Modern features
- `culiacan/infonavit-solidaridad/styles.css` - CSS principal
- `CLAUDE.md` - Documentación del proyecto

## 🎯 Próximas Mejoras

- [ ] Modo batch para múltiples propiedades
- [ ] Auto-detección de fachada con CLIP
- [ ] Preview de la página antes de publicar
- [ ] Rollback automático si falla el deploy
- [ ] Integración con CMS externo
