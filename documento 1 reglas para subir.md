# 📋 REGLAS PARA SUBIR PROPIEDADES NUEVAS

## 🎯 Proceso Completo Automatizado

### 1. PREPARACIÓN DE FOTOS ⚡ OPTIMIZACIÓN 100% AUTOMÁTICA
```bash
# ✅ COMPLETAMENTE AUTOMÁTICO: Al invocar las reglas del documento 1
# 🤖 PropertyPageGenerator hace TODO automáticamente:
# 1. Auto-detecta fotos en carpeta PROYECTOS
# 2. Ejecuta optimizar-fotos.sh automáticamente  
# 3. Convierte PNG → JPG automáticamente
# 4. Reduce calidad a 85% (balance perfecto)
# 5. Redimensiona a máximo 1200px (responsive)
# 6. Ejecuta verificar-optimizaciones.sh automáticamente
# 7. Muestra "READY TO PUBLISH" si todo está correcto

# 📂 Solo ubicar fotos en: /Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/[nombre-propiedad]/
# 🎯 EL RESTO ES 100% AUTOMÁTICO - NO REQUIERE ACCIÓN MANUAL
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
- `casa-[venta/renta]-[nombre-slug].html` (página individual completa)
- `images/[nombre-slug]/` (carpeta de fotos)
- **OBLIGATORIO:** Actualización automática en `culiacan/index.html` (tarjeta con carrusel)
- **OBLIGATORIO:** Actualización automática en `index.html` (tarjeta principal grid)

#### 📋 REGLA CRÍTICA: DOBLE INTEGRACIÓN OBLIGATORIA
**⚠️ TODA nueva propiedad DEBE aparecer en AMBAS páginas:**

1. **Página Principal (`index.html`)**: 
   - Tarjeta simple en grid principal de propiedades
   - Imagen de fachada como preview
   - Precio, ubicación y características básicas
   - Enlace directo a página individual

2. **Página Culiacán (`culiacan/index.html`)**: 
   - Tarjeta avanzada con carrusel funcional (6+ imágenes)
   - SVG icons para características
   - Botones modernos con gradiente
   - Dots indicators y navegación arrows

**🔧 PROCEDIMIENTO ESPECÍFICO DE INTEGRACIÓN:**
```
1. Crear página individual casa-[tipo]-[nombre].html
2. Agregar tarjeta AVANZADA en culiacan/index.html (con carrusel completo)
3. Agregar tarjeta SIMPLE en index.html (imagen única + datos básicos)
4. Verificar enlaces bidireccionales funcionando correctamente
5. Testear carrusel y navegación en ambas páginas
6. Verificar WhatsApp links personalizados
7. Publicar cambios con "PUBLICA YA"
8. Verificar ambas páginas live en producción
```

**✅ VERIFICACIÓN POST-INTEGRACIÓN (OBLIGATORIA):**
- [ ] La propiedad aparece en https://casasenventa.info (página principal)
- [ ] La propiedad aparece en https://casasenventa.info/culiacan (página Culiacán)
- [ ] El carrusel funciona correctamente en página Culiacán (arrows + dots)
- [ ] Los enlaces entre páginas funcionan bidireccionales
- [ ] WhatsApp abre con mensaje personalizado correcto
- [ ] Precio es consistente en todas las ubicaciones
- [ ] Características y ubicación son precisas
- [ ] Responsive design funciona en móvil y desktop
- [ ] Lazy loading está activo en todas las imágenes
- [ ] Price badge naranja visible en carrusel

**⚠️ CASOS DE ÉXITO DOCUMENTADOS:**
- **Casa Stanza Corcega**: ✅ Integrada exitosamente en ambas páginas (Commit: f95e56b)
  - Tarjeta principal: Imagen fachada, $1,690,000, características básicas
  - Tarjeta Culiacán: Carrusel 6 imágenes, SVG icons, botones modernos
  - ✅ Verificación completa: Ambas páginas funcionando, carrusel operativo, enlaces correctos

#### 🎨 FORMATOS DE TARJETAS ESPECÍFICOS:

**A) TEMPLATE EXACTO TARJETA PÁGINA PRINCIPAL (`index.html`):**
```html
<!-- INSERTAR EN SECCIÓN: <div class="properties-grid"> -->
<a href="casa-venta-[nombre].html" class="property-card">
    <img src="images/[nombre]/fachada.jpg" alt="Casa Venta [Nombre]" class="property-image" loading="lazy">
    <div class="property-content">
        <div class="property-badge sale">VENTA</div>
        <h3 class="property-title">Casa [Descripción] en [Zona]</h3>
        <p class="property-location">
            <i class="fas fa-map-marker-alt"></i>
            [Dirección específica]
        </p>
        <div class="property-price">$[Precio]</div>
        <div class="property-features">
            <span class="feature">[X] Recámaras</span>
            <span class="feature">[X] Baños</span>
            <span class="feature">[Característica]</span>
            <span class="feature">[Característica]</span>
        </div>
        <div class="property-cta">Ver Detalles Completos</div>
    </div>
</a>
```

**B) TEMPLATE EXACTO TARJETA PÁGINA CULIACÁN (`culiacan/index.html`):**
```html
<!-- INSERTAR EN SECCIÓN: <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> -->
<div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative" 
     data-href="../casa-venta-[nombre].html">
    <div class="relative aspect-video">
        <!-- PRICE BADGE OBLIGATORIO -->
        <div class="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
            $[Precio]
        </div>
        
        <!-- CAROUSEL CONTAINER CON NAVEGACIÓN -->
        <div class="carousel-container" data-current="0">
            <div class="carousel-track" style="transform: translateX(0%)">
                <!-- MÍNIMO 6 IMÁGENES -->
                <img src="images/[nombre]/foto1.jpg" alt="[Descripción]" class="carousel-slide w-full h-full object-cover" loading="lazy">
                <img src="images/[nombre]/foto2.jpg" alt="[Descripción]" class="carousel-slide w-full h-full object-cover" loading="lazy">
                <!-- ... más imágenes -->
            </div>
            
            <!-- NAVIGATION ARROWS -->
            <button class="carousel-btn prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
            </button>
            <button class="carousel-btn next absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>
        </div>
        
        <!-- DOTS INDICATORS -->
        <div class="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            <!-- GENERAR DOTS DINÁMICAMENTE SEGÚN NÚMERO DE FOTOS -->
        </div>
        
        <!-- FAVORITE ICON -->
        <button class="absolute top-3 left-3 bg-white/80 hover:bg-white rounded-full p-2 transition-colors z-10">
            <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
        </button>
    </div>
    
    <!-- CONTENT SECTION -->
    <div class="p-6">
        <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">$[Precio]</h3>
        <p class="text-gray-600 mb-4 font-poppins">Casa [Descripción] en [Zona] · [Ciudad]</p>
        
        <!-- PROPERTY DETAILS CON SVG ICONS -->
        <div class="flex flex-wrap gap-3 mb-6">
            <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                </svg>
                [X] Recámaras
            </div>
            <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l3-3 3 3M5 10v11a1 1 0 001 1h3M20 10v11a1 1 0 01-1 1h-3"></path>
                </svg>
                [X] Baños
            </div>
            <!-- MÁS CARACTERÍSTICAS SEGÚN LA PROPIEDAD -->
        </div>
        
        <!-- WHATSAPP BUTTON -->
        <a href="https://wa.me/526671234567?text=Hola%2C%20me%20interesa%20la%20casa%20en%20[zona]%20por%20$[precio]" 
           class="w-full btn-primary text-center block" 
           target="_blank" rel="noopener noreferrer">
            <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"></path>
            </svg>
            Solicitar tour
        </a>
    </div>
</div>
```

### 4. OPTIMIZACIONES 100% AUTOMÁTICAS INCLUIDAS
✅ SEO completo (meta tags, structured data, Open Graph)
✅ Performance (preloading, font optimization, DNS prefetch)
✅ **🤖 AUTOMÁTICO: Detección de fotos en PROYECTOS**
✅ **🤖 AUTOMÁTICO: Optimización de fotos** (PNG→JPG, calidad 85%, 1200px max)
✅ **🤖 AUTOMÁTICO: Verificación pre-publicación** (./verificar-optimizaciones.sh)
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

### 6. ✅ VERIFICACIÓN PRE-PUBLICACIÓN (100% AUTOMÁTICA)
**🤖 COMPLETAMENTE AUTOMÁTICO: PropertyPageGenerator ejecuta automáticamente**

```bash
# ✅ YA NO NECESITAS EJECUTAR MANUALMENTE
# 🤖 PropertyPageGenerator ejecuta automáticamente:
# ./verificar-optimizaciones.sh casa-[tipo]-[nombre].html

# 🎯 El sistema muestra automáticamente:
# "✅ VERIFICACIÓN PASSED - READY TO PUBLISH" o 
# "⚠️ VERIFICACIÓN FAILED - REVIEW REQUIRED"
```

**🎯 CRITERIOS AUTOMÁTICOS:**
- **6/6 puntos:** ✅ "READY TO PUBLISH" 
- **5/6 puntos:** ✅ "READY TO PUBLISH"
- **<5/6 puntos:** ⚠️ "REVIEW REQUIRED"

**📊 El sistema verifica automáticamente:**
- 📸 **Lazy Loading** (>5 imágenes)
- 📏 **Dimensiones** especificadas (>5 imágenes)  
- ⚡ **Preload** de imagen crítica (>0)
- ⚙️ **JavaScript defer** (>0 scripts)
- 🌐 **Open Graph** completo (≥4 tags)
- 🎨 **Alt text descriptivo** (>3 imágenes)

**✅ Si muestra "READY TO PUBLISH", proceder con publicación:**

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
- **✅ NUEVO: Optimización automática de fotos** (optimizar-fotos.sh)
- **Detección automática** de fotos en directorio
- **Template de renta** vs **template de venta**
- **Generación automática** de carruseles y JavaScript
- **Verificación pre-publicación** obligatoria
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

### 🚫 REGLA #5: NO ELEMENTOS EXTRA
**PROHIBIDO agregar elementos que NO estén en las especificaciones:**
1. **NO Google Maps** embeds, links o iframes
2. **NO secciones de amenidades del área** (educación, salud, comercios)
3. **NO estadísticas del área** (habitantes, comercios, etc.)
4. **NO property cards** de otras propiedades
5. **NO carruseles duplicados** - solo UN carrusel principal
6. **NO secciones informativas extra** no especificadas

**✅ ELEMENTOS PERMITIDOS ÚNICAMENTE:**
- SEO completo (meta tags, structured data, Open Graph)
- Carrusel único de fotos (máximo 12-15)
- WhatsApp floating button personalizado  
- Calculadora de hipoteca (venta) o renta
- Sección de contacto básica
- Price badge naranja
- Optimizaciones de performance

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

## 👤 REGLA #6: CRM INTERNO OBLIGATORIO
**ANTES de generar cualquier propiedad, SIEMPRE preguntar y guardar:**

### 📋 INFORMACIÓN OBLIGATORIA DEL PROPIETARIO:
1. **Nombre completo del dueño** de la propiedad
2. **Número de celular** (con formato +52 si es México)
3. **Correo electrónico** (si lo tiene)

### ⚠️ PROCESO OBLIGATORIO:
```
ANTES de crear la página, SIEMPRE preguntar:
"Para el CRM interno necesito:
- Nombre del propietario: 
- Celular: 
- Email (opcional): "

GUARDAR en archivo: propietarios-crm.md
FORMATO:
## [Nombre de Propiedad]
- **Propietario:** [Nombre Completo]  
- **Celular:** [Número con formato]
- **Email:** [correo@ejemplo.com o "No proporcionado"]
- **Fecha:** [YYYY-MM-DD]
- **Propiedad:** [URL de la página generada]
```

### 🚫 NO PROCEDER SIN ESTA INFORMACIÓN
- **Si no proporcionan el nombre:** NO crear la propiedad
- **Si no proporcionan celular:** NO crear la propiedad  
- **Email es opcional** pero preguntar siempre

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
Lee documento 1 reglas para subir.md
```

### NUEVO: Para CRM obligatorio (SIEMPRE PRIMERO):
```
Para el CRM interno necesito:
- Nombre del propietario: 
- Celular: 
- Email (opcional):
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

## 🔥 SOLUCIÓN DEFINITIVA: FLECHAS CARRUSEL PÁGINA CULIACÁN
**⚠️ PROBLEMA CRÍTICO RESUELTO - Sept 25 2025 - v3.0**

### 🚨 REGLA OBLIGATORIA PARA CARRUSELES EN PÁGINA CULIACÁN
**SIEMPRE usar esta estructura EXACTA para que las flechas sean VISIBLES:**

```html
<!-- CORRECTO - FLECHAS VISIBLES -->
<button class="carousel-prev" aria-label="Imagen anterior">
    <i class="fas fa-chevron-left"></i>
</button>
<button class="carousel-next" aria-label="Siguiente imagen">
    <i class="fas fa-chevron-right"></i>
</button>
```

### ❌ NUNCA USAR (NO FUNCIONA)
```html
<!-- INCORRECTO - FLECHAS INVISIBLES -->
<button class="carousel-btn-index prev-btn-index" onclick="..." style="...">
<button class="carousel-btn-index next-btn-index" onclick="...">
```

### ✅ VERIFICACIÓN OBLIGATORIA
- **CSS disponible:** `.carousel-prev` y `.carousel-next` ya están en styles.css con `!important`
- **Estilos**: Naranja (rgba(255, 78, 0, 0.95)) con bordes blancos
- **Tamaño**: 50px × 50px con z-index 9999
- **Iconos**: Font Awesome `fas fa-chevron-left/right`
- **Sin JavaScript**: Las clases funcionan automáticamente

### 🎯 CASOS DE ÉXITO DOCUMENTADOS
- **Casa Circuito Canarias**: ✅ Flechas visibles usando `.carousel-prev/.carousel-next`
- **Casa Los Pinos**: ✅ Flechas visibles usando `.carousel-prev/.carousel-next`
- **Todas las casas de venta**: ✅ Funcionan perfecto con esta estructura

**💡 NOTA:** Esta estructura es IDÉNTICA a la que usan las casas de venta que siempre han funcionado correctamente.

## 🎯 CONVENCIONES FINALES
- **Archivos HTML:** casa-[venta/renta]-[slug].html
- **Carpetas imágenes:** images/[property-slug]/
- **URLs:** Todas apuntan a https://casasenventa.info
- **WhatsApp:** Mensajes URL-encoded específicos por propiedad
- **Deployment:** Siempre a rama main → GitHub Pages → casasenventa.info
- **⭐ FLECHAS CARRUSEL:** SIEMPRE usar `.carousel-prev/.carousel-next` en página Culiacán