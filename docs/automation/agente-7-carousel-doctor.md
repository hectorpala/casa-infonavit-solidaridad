# Agente 7 — CarouselDoctor

**SPEC:** carouseldoc-v1.0  
**Referencia obligatoria:** Documento 1 (SPEC props-v3.3) y patrón Golden Source (#6)  
**Función:** Diagnosticar, corregir y validar carruseles antes de integración

---

## Propósito

Garantizar que todos los carruseles funcionen correctamente según el patrón Golden Source, con navegación operativa, lazy loading optimizado y estructura DOM válida antes de pasar a integración.

## Alcance

### ✅ Qué SÍ hace:
- Escanear estructura DOM de carruseles generados por #6
- Diagnosticar problemas de navegación, lazy loading y layout
- Aplicar correcciones automáticas según patrón Golden Source
- Validar funcionamiento de flechas, dots y touch support
- Verificar separación correcta entre carruseles (hero vs gallery)
- Asegurar optimización de carga (primera imagen sin lazy)

### ❌ Qué NO hace:
- Generar código inicial (función del #6)
- Integrar en páginas principales (función del #8)
- Optimizar imágenes (función del #3)
- Publicar cambios finales

## Entradas Requeridas

### Del #6 GeneradorGoldenSource:
- **BLOQUE_PAGINA** - Código HTML completo con carruseles embebidos
- **Set de imágenes** - Confirmación de `images/[slug]/cover.jpg` + `1.jpg...N.jpg`
- **Slug confirmado** - Para validar rutas de imágenes

### Del patrón Golden Source:
- **Estructura de referencia** - Urbivilla del Roble como template base
- **Funciones JavaScript** - Separación hero vs gallery obligatoria
- **Navegación estándar** - Flechas + dots + touch support

### Validación de mínimos:
- **≥6 imágenes** por carrusel requerido
- **Rutas válidas** a archivos optimizados

## Salidas (Entregables)

### Diagnóstico Técnico:
- **SCAN** - Inventario de carruseles detectados
- **DIAGNOSE** - Problemas identificados por categoría
- **PATCH** - Recetas de corrección aplicadas

### Control de Calidad:
- **QA numérico** - Conteos de elementos validados
- **Funcionalidad** - Navegación, lazy loading, responsive

### Control de Flujo:
- **Semáforo** - OK (funcional) o NO GO (bloqueantes)
- **Orden a #8** - IntegradorDoble con carruseles certificados

## Fases de Trabajo (Orden Estricto)

### 1. SCAN
- Detectar carruseles presentes (hero, gallery, otros)
- Inventariar elementos: slides, arrows, dots, track
- Contar imágenes por carrusel
- Verificar rutas de archivos

### 2. DIAGNOSE
- Validar estructura DOM según Golden Source
- Detectar problemas de navegación
- Verificar lazy loading en secuencia correcta
- Identificar conflictos entre carruseles
- Analizar responsive behavior

### 3. PATCH
- Aplicar correcciones automáticas
- Separar funciones JavaScript si están mezcladas
- Corregir lazy loading (primera sin lazy, resto con lazy)
- Ajustar ancho de slides (100% por slide)
- Reparar navegación flechas/dots

### 4. QA
- Validar funcionamiento post-corrección
- Contar elementos críticos
- Verificar separación hero vs gallery
- Testear navegación básica

### 5. HANDOFF
- Generar reporte final
- Emitir semáforo y orden al #8

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si:
- ❌ `.carousel-track` ausente o malformado
- ❌ Slides <6 por carrusel requerido
- ❌ Primera imagen con `loading="lazy"` (performance crítica)
- ❌ Flechas (2) o dots (1) ausentes/no clicables
- ❌ JavaScript CORE duplicado entre carruseles
- ❌ Ancho no 100% por slide (múltiples fotos simultáneas)
- ❌ Rutas de imágenes inválidas o archivos faltantes

### GO Permitido si:
- ✅ Estructura DOM válida según Golden Source
- ✅ ≥6 slides funcionales por carrusel
- ✅ Lazy loading optimizado correctamente
- ✅ Navegación completa operativa
- ✅ Carruseles separados funcionalmente
- ✅ Responsive behavior confirmado

## Criterios de Validación Específicos

### Estructura DOM Requerida:
```
.carousel-container
  .carousel-wrapper
    .carousel-slide.active (primera)
    .carousel-slide (resto)
  .carousel-arrow.carousel-prev
  .carousel-arrow.carousel-next
  .carousel-dots
    .carousel-dot.active (primera)
    .carousel-dot (resto)
```

### JavaScript Obligatorio:
- **Funciones separadas**: `changeSlide()` vs `changeSlideHero()`
- **Variables independientes**: `currentSlide` vs `currentSlideHero`
- **Touch support**: eventos separados por carrusel
- **Global exposure**: funciones en `window` para onclick

### Lazy Loading Optimizado:
- **Primera imagen**: sin `loading="lazy"`
- **Resto de imágenes**: con `loading="lazy"`
- **Performance**: preload crítico funcionando

## Interfaz con Otros Agentes

### Recibe del #6 GeneradorGoldenSource:
- **Código HTML** con carruseles embebidos
- **Estructura base** siguiendo patrón Golden Source
- **JavaScript** con funciones separadas

### Entrega al #8 IntegradorDoble:
- **BLOQUE_PAGINA** con carruseles certificados
- **Diagnóstico técnico** de funcionalidad
- **QA confirmado** con todos los elementos operativos

### Notifica al #11 CompositorCambios:
- **Correcciones aplicadas** para incluir en diffs
- **Elementos validados** para documentación

## Reglas de Operación

### Fidelidad al Golden Source:
- **Estructura exacta** de Urbivilla del Roble como referencia
- **No inventar** variaciones no documentadas
- **Mantener separación** funcional entre carruseles

### Autocorrección Inteligente:
- **Parches automáticos** para problemas comunes
- **Preservar lógica** original del #6
- **No modificar** rutas de imágenes o slugs

### Criterio de Fallo:
- **Si no puede autocorregir** → NO GO con motivos específicos
- **Problemas estructurales** → escalar a revisión manual
- **Mantener trazabilidad** de todas las correcciones

## Modo Autónomo

### Operación Automática:
- Al recibir bloques del #6 → escanea, diagnostica y corrige automáticamente
- Si es NO GO → detalla problemas específicos sin resolución
- Si es OK → entrega carruseles certificados al #8
- **No requiere** intervención humana para correcciones estándar

## Plantilla Única de Entrega

```
## REPORTE AGENTE #7 - CAROUSEL DOCTOR
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Slug procesado:** [nombre-slug]

### SCAN - Inventario de Carruseles:
- **Carruseles detectados:** [hero/gallery/otros]
- **Slides hero:** [N] imágenes
- **Slides gallery:** [N] imágenes
- **Elementos navegación:** flechas=[N], dots=[N]

### DIAGNOSE - Problemas Identificados:
- **Estructura DOM:** [OK/ISSUES] - [detalles específicos]
- **Lazy loading:** [OK/ISSUES] - [primera imagen, secuencia]
- **Navegación:** [OK/ISSUES] - [flechas, dots, touch]
- **Separación carruseles:** [OK/ISSUES] - [funciones JS independientes]
- **Responsive:** [OK/ISSUES] - [ancho slides, layout móvil]

### PATCH - Correcciones Aplicadas:
1. [Corrección específica realizada]
2. [Otra corrección aplicada]
[... o "Sin correcciones necesarias"]

### QA - Validación Post-Corrección:
- **carousel-track presente:** [1/0]
- **slides>=6 por carrusel:** [1/0]
- **primera imagen sin lazy:** [1/0]
- **flechas clicables:** [2/X]
- **dots funcionales:** [1/0]
- **JS core único:** [1/0]
- **ancho 100% por slide:** [1/0]
- **rutas imágenes válidas:** [1/0]

### Carruseles Funcionales:
- **Hero carousel:** [OPERATIONAL/FAILED]
- **Gallery carousel:** [OPERATIONAL/FAILED]
- **Touch support:** [ENABLED/DISABLED]
- **Keyboard navigation:** [ENABLED/DISABLED]

### Semáforo: 
[OK / NO GO]

**Motivo si NO GO:** [problemas específicos sin resolución automática]

### Orden para #8 IntegradorDoble:
**Carruseles certificados:** [hero+gallery] listos para integración
**Estructura validada:** cumple patrón Golden Source
**Navegación operativa:** flechas, dots, touch confirmados
**Performance optimizada:** lazy loading correcto aplicado
```

## Checklist Interno (Auto-verificación)

- [ ] Inventario completo de carruseles realizado
- [ ] Estructura DOM validada contra Golden Source
- [ ] ≥6 slides confirmados por carrusel requerido
- [ ] Primera imagen sin `loading="lazy"` verificada
- [ ] Flechas (2) y dots (1) operativos confirmados
- [ ] JavaScript functions separadas validadas
- [ ] Touch support implementado correctamente
- [ ] Ancho 100% por slide confirmado
- [ ] Rutas de imágenes validadas contra set optimizado
- [ ] Correcciones automáticas aplicadas exitosamente
- [ ] QA numérico completado
- [ ] Semáforo asignado con justificación
- [ ] Orden al #8 emitido con carruseles certificados

## Riesgos y Mitigaciones

### Riesgo: Conflictos entre carruseles hero/gallery
**Mitigación:** Validación estricta de separación funcional JavaScript

### Riesgo: Performance degradada por lazy loading incorrecto
**Mitigación:** Verificación automática primera imagen sin lazy

### Riesgo: Navegación no funcional en móviles
**Mitigación:** Validación touch support y responsive behavior

### Riesgo: Estructura DOM incompatible con CSS existente
**Mitigación:** Fidelidad estricta al patrón Golden Source

### Riesgo: Correcciones automáticas rompiendo funcionalidad
**Mitigación:** QA post-corrección obligatorio antes de dar pase

---

**Guardar como:** docs/automation/agente-7-carousel-doctor.md