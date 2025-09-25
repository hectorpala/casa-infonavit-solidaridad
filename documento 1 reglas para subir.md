# 📋 REGLAS PARA SUBIR PROPIEDADES NUEVAS

## 🎯 Proceso Completo Automatizado

### 1. PREPARACIÓN DE FOTOS
```bash
# Ubicar fotos en: /Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/[nombre-propiedad]/
# Copiar fotos al proyecto:
mkdir -p "images/[nombre-propiedad]"
cp "/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/[carpeta-origen]"/*.jpg "images/[nombre-propiedad]/"
```

### 2. COMANDO PARA INVOCAR REGLAS
**Antes de empezar, siempre escribir:**
```
Lee REGLAS_SUBIR_PROPIEDADES.md
```

### 3. COMANDO PARA CLAUDE
**Estructura exacta del mensaje (usar el formato que proporciones):**
```
🏠SE VENDE/RENTA CASA EN [DESCRIPCIÓN]

💲💰Precio De [Venta/Renta] $[PRECIO]💰💲

✅ [Característica 1]
✅ [Característica 2]  
✅ [Característica 3]
✅ [etc...]

Las fotos están en proyectos [nombre-carpeta]
```

**O estructura alternativa:**
```
Vamos a subir una nueva propiedad:

TIPO: [VENTA/RENTA]
NOMBRE: [Nombre de la propiedad]
UBICACIÓN: [Dirección completa]
PRECIO: [Precio o "Consultar precio"]
DESCRIPCIÓN: [Descripción detallada de la propiedad]

CARACTERÍSTICAS:
- [Número] recámaras
- [Número] baños
- [Características especiales]
- [Amenidades]

FOTOS: Las fotos están en /Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/[carpeta-origen]

Quiero la misma estructura y optimización que las otras propiedades.
```

### 3. ESTRUCTURA DE ARCHIVOS GENERADOS
- `casa-[venta/renta]-[nombre-slug].html` (página principal)
- `images/[nombre-slug]/` (carpeta de fotos)
- Actualización automática en `culiacan/index.html`
- Actualización automática en `index.html`

### 4. OPTIMIZACIONES INCLUIDAS
✅ SEO completo (meta tags, structured data, Open Graph)
✅ Performance (preloading, font optimization, DNS prefetch)
✅ Carrusel dual (hero + galería) con navegación
✅ WhatsApp floating button personalizado
✅ Calculadora de renta (para propiedades de renta)
✅ Calculadora de hipoteca (para propiedades de venta)
✅ Price badge visible en carrusel de fotos (overlay en esquina superior derecha)
✅ Responsive design completo
✅ Lazy loading de imágenes

### 5. VERIFICACIÓN POST-CREACIÓN
- [ ] Verificar que la fachada sea la imagen principal
- [ ] Confirmar descripciones precisas de cada foto
- [ ] Revisar información de contacto y WhatsApp
- [ ] Validar que aparezca en ambas páginas de listings
- [ ] **IMPORTANTE: Verificar que el price badge naranja aparezca en la esquina superior derecha del carrusel de fotos**
- [ ] Si el badge no aparece: refrescar página (Cmd+R) o forzar recarga (Cmd+Shift+R)

### 6. ✅ VERIFICACIÓN PRE-PUBLICACIÓN (OBLIGATORIA)
**⚠️ PASO CRÍTICO: Verificar optimizaciones ANTES de publicar**

```bash
# SIEMPRE ejecutar ANTES de "publica ya":
./verificar-optimizaciones.sh casa-[tipo]-[nombre].html
```

**Ejemplo:**
```bash
./verificar-optimizaciones.sh casa-venta-valle-alto-verde.html
```

**🎯 CRITERIOS PARA PUBLICAR:**
- **6/6 puntos:** ✅ LISTO PARA PUBLICAR
- **5/6 puntos:** ✅ LISTO PARA PUBLICAR  
- **<5/6 puntos:** ❌ NO PUBLICAR - Corregir optimizaciones

**📊 El script verifica automáticamente:**
- 📸 **Lazy Loading** (>5 imágenes)
- 📏 **Dimensiones** especificadas (>5 imágenes)
- ⚡ **Preload** de imagen crítica (>0)
- ⚙️ **JavaScript defer** (>0 scripts)
- 🌐 **Open Graph** completo (≥4 tags)
- 🎨 **Alt text descriptivo** (>3 imágenes)

**✅ Solo si la verificación muestra "LISTO PARA PUBLICAR", entonces:**

### 7. COMANDO DE PUBLICACIÓN
```
publica ya
```

### 8. VERIFICACIÓN POST-PUBLICACIÓN
Si no aparece la propiedad inmediatamente:
1. **Refrescar con Ctrl+F5** (o Cmd+Shift+R en Mac)
2. **Borrar caché del navegador**
3. **Probar en modo incógnito**
4. **Verificar URLs directas:**
   - https://casasenventa.info/casa-[venta/renta]-[nombre].html
   - https://casasenventa.info/culiacan/ (listings)

## 🔧 AUTOMATION SYSTEM
El sistema usa:
- **PropertyPageGenerator** con templates optimizados
- **Detección automática** de fotos en directorio
- **Template de renta** vs **template de venta**
- **Generación automática** de carruseles y JavaScript
- **GitHub Pages deployment** automático a casasenventa.info

## 📁 ESTRUCTURA DE CARPETAS
```
/proyecto/
├── images/
│   └── [nombre-propiedad]/
│       ├── foto1.jpg
│       ├── foto2.jpg
│       └── ...
├── casa-[tipo]-[nombre].html
├── culiacan/index.html (actualizado)
└── index.html (actualizado)
```

## ⚠️ NOTAS IMPORTANTES
1. **Siempre revisar las fotos** después de la generación para verificar descripciones
2. **La fachada debe ser la imagen principal** en carruseles y listings
3. **Usar "Consultar precio"** si no se tiene precio específico
4. **Las fotos se copian automáticamente** del directorio PROYECTOS
5. **El sistema detecta automáticamente** si es venta o renta por el comando

## 📸 REGLAS OBLIGATORIAS PARA FOTOS

### 🎯 REGLA #1: IDENTIFICACIÓN VISUAL OBLIGATORIA
**ANTES de escribir las descripciones de fotos, SIEMPRE:**
1. **Visualizar cada foto individualmente** usando la herramienta Read
2. **Identificar el contenido real** de cada imagen
3. **Verificar que coincida** con la descripción que vas a asignar
4. **NO asumir** el contenido basándose solo en el nombre del archivo

### 🏠 REGLA #2: FACHADA COMO IMAGEN PRINCIPAL
**OBLIGATORIO en todos los casos:**
1. **La primera foto del carrusel DEBE ser la fachada** de la casa/departamento
2. **Verificar visualmente** que la primera imagen muestre el exterior/frente
3. **Si la fachada no está primera**, reorganizar el orden de las fotos
4. **En listings principales**, usar siempre la fachada como imagen de preview

### 📝 REGLA #3: SIN DESCRIPCIONES EN IMÁGENES
**NUEVA REGLA OBLIGATORIA:**
1. **NO incluir descripciones de fotos** en los carruseles (sin `<div class="image-caption">`)
2. **Eliminar todos los textos** bajo las imágenes
3. **Las fotos hablan por sí solas** - no necesitan etiquetas
4. **Mantener solo alt text** para SEO y accesibilidad

### 🚫 REGLA #4: FILTRO DE FOTOS INAPROPIADAS  
**ELIMINAR OBLIGATORIAMENTE:**
1. **Fotos de baños con elementos decorativos excesivos** (papel tapiz, diseños llamativos)
2. **Imágenes repetitivas** que no aportan valor
3. **Fotos borrosas** o de mala calidad
4. **Mantener solo 12-15 fotos máximo** de las más importantes y representativas

### ⚠️ EJEMPLO DE VERIFICACIÓN CORRECTA:
```
✅ CORRECTO:
- Leer imagen: images/propiedad/foto1.jpg
- Ver: Exterior de casa con portón
- Acción: Poner como primera foto SIN descripción
- Resultado: Fachada primera, sin texto bajo la imagen

❌ INCORRECTO:
- NO leer imagen
- Asumir: "Debe ser la fachada"
- Incluir: <div class="image-caption">Fachada Principal</div>
- Mantener: Fotos de baño con papel tapiz
```

## 📞 CONFIGURACIÓN WHATSAPP
- Mensajes personalizados por propiedad
- Botón flotante con texto específico
- Enlaces directos con información pre-llenada

## 🚀 DEPLOYMENT
- **Dominio**: https://casasenventa.info
- **Git commit** automático con cambios
- **Despliegue directo** a GitHub Pages (rama main)
- **Caché busting** automático con URL parameters
- **Verificación de build status** en tiempo real

## 📈 CASOS DE ÉXITO
### ✅ Casa Privada Puntazul (Renta)
- **Commit**: 48ec161
- **Características**: 2 recámaras, 2.5 baños, alberca, gimnasio
- **Status**: ✅ Deployed successfully

### ✅ Casa Zona Dorada (Venta)  
- **Commit**: 7df9bcf
- **Precio**: $1,300,000
- **Características**: 2 recámaras, 1.5 baños, frente área verde
- **Status**: ✅ Deployed successfully

### ✅ Casa Lázaro Cárdenas (Venta)
- **Commit**: bb62f51
- **Precio**: $2,100,000
- **Características**: 3 recámaras, 2.5 baños, cochera 2 autos, 225 m²
- **Status**: ✅ Deployed successfully

### ✅ Casa Valle Alto Verde (Venta)
- **Commit**: 2025413
- **Precio**: $1,300,000
- **Características**: 2 recámaras, 1 baño, 2 pisos, completamente remodelada
- **Status**: ✅ Deployed successfully - ✅ Con calculadora de hipoteca

## 🔧 COMANDOS ESENCIALES

### Para invocar reglas:
```
Lee REGLAS_SUBIR_PROPIEDADES.md
```

### Para identificar fotos:
```
puedes identificar las fotos osea saber que son?
```

### Para corregir descripciones:
```
si (actualiza las descripciones de fotos)
```

### Para verificar antes de publicar:
```
./verificar-optimizaciones.sh casa-[tipo]-[nombre].html
```

### Para publicar (solo si verificación es ✅):
```
publica ya
```

## ⚠️ TROUBLESHOOTING

### Si no aparece la propiedad:
1. **Verificar que el commit se hizo correctamente**
2. **Refrescar navegador con Ctrl+F5**
3. **Probar en modo incógnito**
4. **Verificar URL directa**: https://casasenventa.info/casa-[tipo]-[nombre].html
5. **Revisar listings**: https://casasenventa.info/culiacan/

### Si las fotos no se copian:
```bash
# Verificar nombre exacto de carpeta (puede tener espacios al final)
ls -la "/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/"
# Usar comillas en el comando cp para manejar espacios
```

### Si el carrusel no funciona:
- Verificar que el JavaScript esté incluido
- Comprobar que las funciones estén expuestas globalmente  
- Revisar que el conteo de fotos sea correcto en totalSlides

## 🎯 CONVENCIONES FINALES
- **Archivos HTML:** casa-[venta/renta]-[slug].html
- **Carpetas imágenes:** images/[property-slug]/
- **URLs:** Todas apuntan a https://casasenventa.info
- **WhatsApp:** Mensajes URL-encoded específicos por propiedad
- **Deployment:** Siempre a rama main → GitHub Pages → casasenventa.info