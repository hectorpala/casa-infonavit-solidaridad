# Agente 6 — Generador Golden Source

**SPEC:** goldensource-v1.0  
**Referencia obligatoria:** Documento 1 (SPEC props-v3.3) y patrón Golden Source Urbivilla del Roble  
**Función:** Generar código base completo siguiendo estructura exacta del Golden Source

---

## Propósito

Generar el código HTML completo de la página individual y tarjetas de integración, siguiendo fielmente la estructura del Golden Source Urbivilla del Roble, aplicando solo los datos específicos de la nueva propiedad sin modificar elementos críticos.

## Alcance

### ✅ Qué SÍ hace:
- Generar página individual completa basada en Golden Source
- Crear tarjetas para doble integración (Home + Culiacán)
- Mantener estructura exacta de carruseles duales (hero + gallery)
- Preservar calculadora de hipoteca (solo para venta)
- Aplicar SEO completo + structured data + Open Graph
- Conservar optimizaciones de performance y lazy loading
- Preparar enlaces para doble integración posterior

### ❌ Qué NO hace:
- Modificar estructura base del Golden Source
- Optimizar imágenes (función del #3)
- Integrar directamente en páginas principales (función del #8)
- Publicar cambios finales

## Entradas Requeridas

### Del pipeline anterior:
- **Datos normalizados** (#4) - Ficha completa con campos validados
- **Slug confirmado** (#5) - Identificador único generado
- **Set de imágenes optimizado** (#3) - `images/[slug]/cover.jpg` + `1.jpg...N.jpg`

### Del Documento 1:
- **Regla Crítica #7** - Código debe ser idéntico al Golden Source
- **Especificaciones técnicas** - SEO, performance, estructura

### Golden Source de referencia:
- **Urbivilla del Roble** - Template base completo y funcional
- **Elementos críticos** - Carruseles, calculadora, WhatsApp, SEO

## Salidas (Entregables)

### Código Completo:
- **BLOQUE_PAGINA** - Página individual `casa-[tipo]-[slug].html` completa
- **BLOQUE_CARD_HOME** - Tarjeta simple para `index.html`
- **BLOQUE_CARD_CULIACAN** - Tarjeta avanzada para `culiacan/index.html`

### Documentación:
- **RESUMEN_GS** - Elementos generados y placeholders utilizados
- **QA_FUNCIONAL** - Checklist numérico de validación

### Control de Calidad:
- **Elementos críticos** - Carruseles, calculadora, SEO validados
- **Fidelidad al patrón** - Estructura idéntica confirmada

## Fases de Trabajo (Orden Estricto)

### 1. PREPARACIÓN
- Cargar Golden Source Urbivilla del Roble como template base
- Validar datos normalizados del #4
- Confirmar slug y rutas de imágenes

### 2. SUSTITUCIÓN DE DATOS
- Reemplazar textos específicos de Urbivilla por datos de nueva propiedad
- Actualizar rutas de imágenes a `images/[slug]/`
- Ajustar precios, características, ubicación
- Personalizar mensajes WhatsApp

### 3. ADAPTACIÓN POR TIPO
- **Si VENTA**: Mantener calculadora de hipoteca completa
- **Si RENTA**: Omitir calculadora, ajustar textos de precio
- Adaptar structured data JSON-LD según tipo

### 4. GENERACIÓN DE TARJETAS
- Crear tarjeta simple para página principal
- Generar tarjeta avanzada con carrusel para Culiacán
- Asegurar enlaces correctos a página individual

### 5. VALIDACIÓN TÉCNICA
- Verificar SEO completo (title, meta, OG, canonical)
- Confirmar structured data válido
- Validar lazy loading optimizado
- Asegurar carruseles duales separados

### 6. ENTREGA
- Generar bloques listos para #7 CarouselDoctor
- Emitir QA funcional y semáforo

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si:
- ❌ Golden Source Urbivilla del Roble no disponible como referencia
- ❌ Datos normalizados incompletos (#4 NO LISTO)
- ❌ Slug no confirmado (#5 NO LISTO)
- ❌ Set de imágenes insuficiente (<6 fotos optimizadas)
- ❌ Imposibilidad de mantener estructura crítica

### GO Permitido si:
- ✅ Golden Source disponible y validado
- ✅ Datos completos para sustitución
- ✅ Slug único confirmado
- ✅ ≥6 imágenes optimizadas disponibles
- ✅ Estructura crítica preservable

## Elementos Críticos a Conservar

### Carruseles Obligatorios:
- **Hero carousel** - Carrusel principal con price badge
- **Gallery carousel** - Carrusel secundario de fotos
- **Funciones separadas** - JavaScript independiente por carrusel
- **Touch support** - Navegación móvil operativa

### SEO y Performance:
- **Meta tags completos** - Title, description, keywords, robots
- **Open Graph** - Compartido en redes sociales
- **Structured data** - JSON-LD para propiedades
- **Lazy loading** - Primera imagen sin lazy, resto con lazy
- **Preload crítico** - Recursos esenciales

### Funcionalidad Específica:
- **Calculadora hipoteca** - Solo para tipo VENTA
- **WhatsApp personalizado** - Botones y flotante con mensajes específicos
- **Price badge naranja** - Visible en carrusel hero
- **Responsive design** - Funcional en todos los dispositivos

## Interfaz con Otros Agentes

### Recibe del pipeline:
- **#4 NormalizadorDatos** - Ficha normalizada completa
- **#5 GeneradorSlug** - Slug único confirmado
- **#3 OptimizadorImágenes** - Set de fotos web-ready

### Entrega al #7 CarouselDoctor:
- **BLOQUE_PAGINA** - Código HTML con carruseles embebidos
- **Datos técnicos** - Slug, rutas, conteo de imágenes
- **Estructura base** - Lista para validación y corrección

### Prepara para #8 IntegradorDoble:
- **Tarjetas listas** - Bloques para inserción en páginas principales
- **Enlaces correctos** - Referencias a página individual

## Reglas de Operación

### Fidelidad Absoluta:
- **Documento 1 Regla #7** - Código idéntico a Golden Source
- **Solo cambiar contenido** - Textos, rutas, datos específicos
- **Conservar estructura** - HTML, CSS classes, JavaScript

### Sustitución Inteligente:
- **Placeholders sistemáticos** - [[slug]], [[NOMBRE]], [[PRECIO]], etc.
- **Datos contextuales** - Adaptar según tipo venta/renta
- **Mensajes personalizados** - WhatsApp específico por propiedad

### Control de Calidad:
- **Validación automática** - Elementos críticos presentes
- **QA numérico** - Conteos de slides, botones, enlaces
- **Estructura DOM** - Compatible con CSS existente

## Modo Autónomo

### Operación Automática:
- Al recibir datos del pipeline → genera código completo automáticamente
- Aplica sustituciones según tipo (venta/renta)
- Si es NO GO → detalla elementos faltantes específicos
- Si es OK → entrega bloques listos para #7
- **No requiere** confirmación humana

## Plantilla Única de Entrega

```
## REPORTE AGENTE #6 - GENERADOR GOLDEN SOURCE
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Slug procesado:** [nombre-slug]
**Tipo propiedad:** [VENTA/RENTA]

### RESUMEN_GS - Bloques Generados:
• **BLOQUE_PAGINA:** página individual completa basada en Golden Source
• **BLOQUE_CARD_HOME:** tarjeta simple para index.html
• **BLOQUE_CARD_CULIACAN:** tarjeta avanzada con carrusel
• **Placeholders aplicados:** [[slug]], [[NOMBRE]], [[PRECIO]], [[REC]], [[BAN]]
• **Adaptaciones tipo:** [calculadora incluida/omitida según venta/renta]

### Elementos Críticos Conservados:
- **Carruseles duales:** hero + gallery con funciones separadas ✅
- **Price badge naranja:** presente en carrusel hero ✅
- **Calculadora hipoteca:** [incluida para venta/omitida para renta] ✅
- **SEO completo:** meta tags + OG + JSON-LD ✅
- **WhatsApp personalizado:** botones + flotante con mensajes específicos ✅
- **Lazy loading optimizado:** primera sin lazy, resto con lazy ✅

### Sustituciones Aplicadas:
- **Textos:** Urbivilla → [datos nueva propiedad]
- **Rutas imágenes:** villa-del-roble → [slug]
- **Precios:** $1,550,000 → [precio específico]
- **Características:** 1 rec, 1 baño → [rec] rec, [ban] baños
- **WhatsApp:** mensajes personalizados para [nombre propiedad]

### QA_FUNCIONAL - Validación Técnica:
- **hero.slides>=6:** [1/0]
- **gallery.slides>=6:** [1/0]
- **hero.first_img_lazy=0:** [1/0]
- **gallery.first_img_lazy=0:** [1/0]
- **arrows=2:** [1/0] (hero+gallery separados)
- **dots=1:** [1/0] (en ambos carruseles)
- **seo.has_title=1:** [1/0]
- **seo.has_meta=1:** [1/0]
- **seo.has_og=1:** [1/0]
- **seo.has_canonical=1:** [1/0]
- **json_ld_valid=1:** [1/0]
- **whatsapp_links=2+:** [1/0] (botones contact + floating)
- **calculator_present:** [1 si venta, 0 si renta]
- **carousels_separated=1:** [1/0] (funciones JS independientes)
- **price_badge_hero=1:** [1/0]
- **structure_fidelity=1:** [1/0] (idéntica a Golden Source)

### Semáforo: 
[OK / NO GO]

**Motivo si NO GO:** [datos faltantes específicos/estructura no preservable]

### Orden para #7 CarouselDoctor:
**BLOQUE_PAGINA listo:** código HTML con carruseles para validación
**Set imágenes confirmado:** images/[slug]/ con [N] fotos
**Estructura base:** siguiendo patrón Golden Source Urbivilla
**Elementos críticos:** carruseles duales + navegación + lazy loading
```

## Checklist Interno (Auto-verificación)

- [ ] Golden Source Urbivilla del Roble cargado como template
- [ ] Datos normalizados (#4) validados y completos
- [ ] Slug confirmado (#5) aplicado en rutas
- [ ] Set de imágenes (#3) ≥6 fotos confirmado
- [ ] Sustituciones de texto aplicadas correctamente
- [ ] Rutas de imágenes actualizadas a images/[slug]/
- [ ] Tipo venta/renta aplicado (calculadora incluida/omitida)
- [ ] SEO completo generado (title, meta, OG, JSON-LD)
- [ ] WhatsApp personalizado con mensajes específicos
- [ ] Carruseles duales mantenidos con funciones separadas
- [ ] Lazy loading optimizado (primera sin lazy)
- [ ] Price badge naranja conservado en hero
- [ ] Tarjetas doble integración generadas
- [ ] QA funcional completado
- [ ] Estructura fidelidad 100% al Golden Source
- [ ] Bloques listos para #7 CarouselDoctor

## Riesgos y Mitigaciones

### Riesgo: Pérdida de funcionalidad al modificar Golden Source
**Mitigación:** Fidelidad estricta - solo cambiar contenido, nunca estructura

### Riesgo: Incompatibilidad con CSS existente
**Mitigación:** Conservar clases CSS exactas del template Urbivilla

### Riesgo: Carruseles no funcionales tras sustitución
**Mitigación:** Mantener JavaScript functions separadas intactas

### Riesgo: SEO incompleto por datos faltantes
**Mitigación:** Validación exhaustiva datos normalizados antes de proceder

### Riesgo: WhatsApp links incorrectos
**Mitigación:** Encoding URL automático y validación formato E.164

---

**Guardar como:** docs/automation/agente-6-generador-golden-source.md