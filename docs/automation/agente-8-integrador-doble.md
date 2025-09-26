# Agente 8 — Integrador Doble (Home + Culiacán)

**SPEC:** integrador-doble-v1.0  
**Referencias obligatorias:** Documento 1 (SPEC props-v3.3), Agente #6 (Golden Source) y Agente #7 (CarouselDoctor aprobado)  
**Función:** Insertar tarjetas de propiedad en ambas vistas del sitio con enlaces funcionales

---

## Propósito

Insertar, en ambas vistas del sitio, los bloques de la propiedad y dejar enlaces vivos: Home/index (tarjeta simple) y Culiacán/culiacan/index (tarjeta avanzada con carrusel). Verificar navegación tarjeta → página de detalle y retorno cuando aplique.

## Alcance

### ✅ Qué SÍ hace:
- Integrar bloques estándar de #6 en archivos destino
- Respetar marcadores de inserción definidos
- Asegurar enlaces funcionales entre tarjetas y página individual
- Garantizar presencia simultánea en Home y Culiacán
- Evitar duplicación de tarjetas existentes
- Coordinar con #11 para construcción de diffs si requerido

### ❌ Qué NO hace:
- Generar los bloques originales (función del #6)
- Corregir carruseles (función del #7)
- Publicar cambios finales (función del #13)
- Modificar estructura base de páginas

## Entradas Requeridas

### Del #6 Golden Source aprobado:
- **Bloque tarjeta Home** - Card simple para `index.html`
- **Bloque tarjeta Culiacán** - Card avanzada con carrusel para `culiacan/index.html`
- **Identificador/slug final** - Para enlaces y referencias

### Del #7 CarouselDoctor:
- **Certificación PASS** - Carrusel validado para tarjeta avanzada
- **Estructura funcional** - Navegación operativa confirmada

### Del Documento 1:
- **Rutas y marcadores** - Zonas exactas de inserción
- **Convenciones de integración** - Formato y estructura requeridos

## Salidas (Entregables)

### Integración Confirmada:
- **Card en Home** - Presente una sola vez en `index.html`
- **Card-adv en Culiacán** - Presente una sola vez en `culiacan/index.html`

### Validación de Enlaces:
- **Links verificados** - Tarjetas → `casa-<tipo>-<slug>.html`
- **Navegación bidireccional** - Retorno funcional cuando aplique

### Control de Flujo:
- **Semáforo** - OK (doble integración) / NO OK (motivo y ubicación)
- **Orden siguiente** - #10 SEO&Schema o #11 CompositorDiffs según flujo

## Fases de Trabajo (Orden)

### 1. VERIFICACIÓN PREVIA
- Confirmar PASS del #7 (carrusel funcional)
- Validar disponibilidad de bloques #6
- Verificar marcadores en archivos destino

### 2. INTEGRACIÓN HOME
- Insertar card en zona definida por marcadores `index.html`
- Asegurar no duplicación de tarjeta existente
- Validar estructura y formato correcto

### 3. INTEGRACIÓN CULIACÁN
- Insertar card-adv en zona correspondiente `culiacan/index.html`
- Asegurar no duplicación de tarjeta existente
- Verificar carrusel embebido funcional

### 4. VALIDACIÓN DE ENLACES
- Comprobar que ambas tarjetas enlazan al detalle correcto
- Verificar formato URLs: `casa-<tipo>-<slug>.html`
- Testear navegación funcional

### 5. CHEQUEO DE COEXISTENCIA
- Confirmar presencia simultánea (Home + Culiacán)
- Validar consistencia de datos entre tarjetas
- Verificar no conflictos de slug

### 6. REPORTE Y SEMÁFORO
- Generar reporte de integración
- Emitir semáforo y pase a siguiente fase

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si:
- ❌ Falta PASS del #7 CarouselDoctor
- ❌ Ausencia de alguna de las dos tarjetas integradas
- ❌ Duplicados de la misma tarjeta en cualquier página
- ❌ Enlace roto o mal formado hacia página de detalle
- ❌ Inserción fuera de marcadores definidos en Documento 1
- ❌ **NUEVO:** Badge de precio NO usa `bg-orange-500` en Culiacán
- ❌ **NUEVO:** Botón WhatsApp NO usa clase `btn-primary` en Culiacán
- ❌ **NUEVO:** Carrusel usa divs anidados en lugar de imágenes directas
- ❌ **NUEVO:** JavaScript NO usa `changeImage()` en controles de carrusel
- ❌ **NUEVO:** Iconos usan Font Awesome en lugar de SVG

### GO Permitido si:
- ✅ PASS #7 confirmado para carrusel
- ✅ Bloques #6 disponibles y válidos
- ✅ Marcadores de inserción identificados
- ✅ Archivos destino accesibles para modificación
- ✅ **NUEVO:** Template de Culiacán sigue patrón exacto definido
- ✅ **NUEVO:** Validación de estilos y colores correctos

## Criterios de "OK" / "NO OK"

### OK:
- Card en Home + card-adv en Culiacán presentes
- Cada tarjeta una sola vez (sin duplicación)
- Ambos links al detalle correctos y funcionales
- Coexistencia verificada en ambas páginas

### NO OK:
- Falta una tarjeta en cualquier página
- Duplicación detectada
- Enlaces incorrectos o rotos
- Inserción fuera de marcadores

## Zonas de Inserción Específicas

### Home (`index.html`):
```html
<!-- MARCADOR: INICIO PROPERTIES GRID -->
<div class="properties-grid">
    <!-- INSERCIÓN: tarjetas simples aquí -->
</div>
<!-- MARCADOR: FIN PROPERTIES GRID -->
```

### Culiacán (`culiacan/index.html`):
```html
<!-- MARCADOR: INICIO GRID PROPIEDADES -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- INSERCIÓN: tarjetas avanzadas aquí -->
</div>
<!-- MARCADOR: FIN GRID PROPIEDADES -->
```

## PATRONES OBLIGATORIOS PARA TARJETAS CULIACÁN

### Template de Tarjeta Avanzada (OBLIGATORIO):
```html
<!-- BEGIN CARD-ADV casa-[tipo]-[slug] -->
<div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative" 
     data-href="../casa-[tipo]-[slug].html">
    <div class="relative aspect-video">
        <!-- PRICE BADGE OBLIGATORIO - COLOR FIJO NARANJA -->
        <div class="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
            $[PRECIO]/[PERIODO]
        </div>
        
        <!-- CAROUSEL CONTAINER - ESTRUCTURA OBLIGATORIA -->
        <div class="carousel-container" data-current="0">
            <img src="../images/[slug]/[foto-01].jpeg" 
                 alt="[Descripción Foto 1]" 
                 loading="lazy" 
                 decoding="async"
                 class="w-full h-full object-cover carousel-image active">
            <img src="../images/[slug]/[foto-02].jpeg" 
                 alt="[Descripción Foto 2]" 
                 loading="lazy" 
                 decoding="async"
                 class="w-full h-full object-cover carousel-image hidden">
            <!-- MÁS IMÁGENES SEGÚN DISPONIBLES -->
            
            <!-- Navigation arrows - FUNCIONES OBLIGATORIAS -->
            <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)" aria-label="Imagen anterior">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)" aria-label="Siguiente imagen">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        
        <!-- Favoritos button - OBLIGATORIO -->
        <button class="favorite-btn absolute top-3 left-3 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all duration-300 z-20">
            <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
        </button>
    </div>
    
    <!-- CONTENT SECTION - ESTRUCTURA OBLIGATORIA -->
    <div class="p-6">
        <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">$[PRECIO]/[PERIODO]</h3>
        <p class="text-gray-600 mb-4 font-poppins">[Título Propiedad] · Culiacán</p>
        
        <!-- PROPERTY DETAILS CON SVG ICONS - OBLIGATORIO -->
        <div class="flex flex-wrap gap-3 mb-6">
            <!-- RECÁMARAS -->
            <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                </svg>
                [X] Recámaras
            </div>
            <!-- BAÑOS -->
            <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l3-3 3 3M5 10v11a1 1 0 001 1h3M20 10v11a1 1 0 01-1 1h-3"></path>
                </svg>
                [X] Baños
            </div>
            <!-- ESTACIONAMIENTOS -->
            <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-5H8z"></path>
                </svg>
                [X] Estacionamientos
            </div>
            <!-- CARACTERÍSTICA ADICIONAL OPCIONAL -->
        </div>
        
        <!-- WHATSAPP BUTTON - CLASE OBLIGATORIA -->
        <a href="https://wa.me/528111652545?text=[MENSAJE_URL_ENCODED]" 
           class="w-full btn-primary text-center block" 
           target="_blank" rel="noopener noreferrer">
            <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"></path>
            </svg>
            Solicitar tour
        </a>
    </div>
</div>
<!-- END CARD-ADV casa-[tipo]-[slug] -->
```

### REGLAS CRÍTICAS PARA EVITAR ERRORES:

1. **Badge de precio:** SIEMPRE `bg-orange-500` (nunca azul)
2. **Botón WhatsApp:** SIEMPRE `btn-primary` (nunca colores personalizados)
3. **Carrusel:** Imágenes directas con `changeImage()` (no divs anidados)
4. **JavaScript:** SIEMPRE `onclick="changeImage(this.parentElement, -1)"` 
5. **Iconos:** SIEMPRE SVG (nunca Font Awesome en características)
6. **Estructura:** NUNCA inventar, SIEMPRE usar el template exacto

## Interfaz con Otros Agentes

### Recibe de #6/#7:
- **Bloques certificados** - Tarjetas listas para inserción
- **Certificación carrusel** - PASS para funcionalidad avanzada
- **Datos técnicos** - Slug, rutas, enlaces

### Entrega a #10 SEO&Schema:
- **Propiedad visible** y accesible en ambas páginas
- **Lista para metadatos** y JSON-LD adicional
- **Estructura integrada** para optimización

### Puede solicitar a #11 CompositorDiffs:
- **Construcción de parches** si integración requiere DIFFs formales
- **Documentación cambios** para trazabilidad

## Reglas de Operación

### Fuente de Verdad Única:
- **Usar exactamente** los bloques de #6 aprobados
- **No modificar** contenido de las tarjetas
- **Respetar estructura** definida en Documento 1

### Integridad de UI:
- **No inventar UI** - respetar marcadores existentes
- **Mantener consistencia** visual con páginas actuales
- **Preservar funcionalidad** existente

### Idempotencia:
- **Si propiedad ya existía** - actualizar, no duplicar
- **Operación repetible** - mismo resultado en múltiples ejecuciones
- **Control de versiones** - manejar actualizaciones

## Modo Autónomo

### Operación Automática:
- Con entradas válidas → integra y reporta sin confirmación
- Si NO OK → detalla exactamente: archivo, zona, motivo
- Si OK → anuncia "doble integración completa" y pasa a siguiente etapa
- **No requiere** intervención humana para integraciones estándar

## Plantilla Única de Entrega

```
## REPORTE AGENTE #8 - INTEGRADOR DOBLE
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Slug procesado:** [nombre-slug]

### Verificación Previa:
- **PASS Agente #7:** [CONFIRMADO/FALTANTE]
- **Bloques disponibles:** [COMPLETOS/INCOMPLETOS]
- **Marcadores destino:** [ENCONTRADOS/AUSENTES]

### Integración Home (index.html):
- **Presente:** [SÍ/NO]
- **Duplicado:** [SÍ/NO]
- **Link detalle OK:** [SÍ/NO]
- **Zona inserción:** [dentro/fuera de marcadores]

### Integración Culiacán (culiacan/index.html):
- **Presente:** [SÍ/NO]
- **Duplicado:** [SÍ/NO]
- **Link detalle OK:** [SÍ/NO]
- **Carrusel funcional:** [SÍ/NO]
- **Zona inserción:** [dentro/fuera de marcadores]

### Validaciones Críticas Culiacán:
- **Badge precio bg-orange-500:** [✅/❌]
- **Botón btn-primary:** [✅/❌]
- **Carrusel imágenes directas:** [✅/❌]
- **JavaScript changeImage():** [✅/❌]
- **Iconos SVG (no FontAwesome):** [✅/❌]
- **Template exacto seguido:** [✅/❌]

### Validación de Enlaces:
- **URL generada:** casa-[tipo]-[slug].html
- **Link Home → detalle:** [FUNCIONAL/ROTO]
- **Link Culiacán → detalle:** [FUNCIONAL/ROTO]
- **Formato correcto:** [SÍ/NO]

### Coexistencia Verificada:
- **Ambas páginas actualizadas:** [SÍ/NO]
- **Datos consistentes:** [SÍ/NO]
- **Sin conflictos slug:** [SÍ/NO]

### Semáforo: 
[OK / NO OK]

**Motivo si NO OK:** [archivo específico, zona exacta, problema detectado]

### Siguiente paso:
[#10 SEO & Schema / #11 Compositor de Diffs] - [razón de selección]

### Archivos Modificados:
- **index.html:** [MODIFICADO/SIN CAMBIOS]
- **culiacan/index.html:** [MODIFICADO/SIN CAMBIOS]
```

## Checklist Interno (Auto-verificación)

### Validaciones Generales:
- [ ] PASS de #7 CarouselDoctor confirmado
- [ ] Bloques #6 disponibles y validados
- [ ] Marcadores de inserción localizados
- [ ] Card Home integrada (una sola vez)
- [ ] Card-adv Culiacán integrada (una sola vez)
- [ ] Enlaces a detalle verificados y funcionales
- [ ] Sin duplicación en ninguna página
- [ ] Coexistencia Home + Culiacán confirmada
- [ ] Zona inserción dentro de marcadores
- [ ] Datos consistentes entre tarjetas

### Validaciones Específicas Culiacán (CRÍTICAS):
- [ ] **Badge precio:** Contiene `bg-orange-500` (NO azul/blue)
- [ ] **Botón WhatsApp:** Usa clase `btn-primary` (NO colores custom)
- [ ] **Carrusel:** Imágenes directas (NO `<div class="carousel-slide">`)
- [ ] **JavaScript:** Usa `changeImage(this.parentElement, -1)` 
- [ ] **Iconos características:** Todos son SVG (NO `<i class="fas`)
- [ ] **Estructura:** Sigue template exacto definido
- [ ] **Botón favoritos:** Presente en tarjeta avanzada
- [ ] **Clases CSS:** Correctas (`carousel-image active/hidden`)

### Finalización:
- [ ] Reporte completo generado
- [ ] Semáforo asignado con justificación
- [ ] Validaciones específicas documentadas
- [ ] Pase a siguiente agente emitido

## Riesgos y Mitigaciones

### Riesgo: Duplicación de tarjetas existentes
**Mitigación:** Verificación idempotencia antes de inserción

### Riesgo: Enlaces rotos por slug incorrecto
**Mitigación:** Validación cruzada con #5 GeneradorSlug

### Riesgo: Inserción fuera de marcadores
**Mitigación:** Localización estricta de zonas definidas en Documento 1

### Riesgo: Conflictos con tarjetas existentes
**Mitigación:** Análisis pre-inserción y actualización vs creación

### Riesgo: Carrusel no funcional en tarjeta avanzada
**Mitigación:** Dependencia estricta de PASS #7 CarouselDoctor

---

**Guardar como:** docs/automation/agente-8-integrador-doble.md