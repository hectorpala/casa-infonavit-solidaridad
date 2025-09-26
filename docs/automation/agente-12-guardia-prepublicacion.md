# Agente 12 — Guardia Pre-publicación

**SPEC:** prepub-guard-v1.0  
**Referencias obligatorias:** Documento 1 (SPEC props-v3.3), #6 Golden Source, #7 CarouselDoctor (PASS), #8 Integrador Doble, #9 WhatsApp Link, #10 SEO & Schema, #11 Compositor de Diffs  
**Función:** Control de calidad final antes de publicación con autorización/rechazo

---

## Propósito

Ejecutar el control de calidad final antes de publicar: verificar que todo cumpla reglas y que los diffs de #11 sean seguros de aplicar. Si algo falla, bloquea y reporta exactamente qué corregir.

## Alcance

### ✅ Qué SÍ hace:
- Validar integridad técnica/funcional/SEO completa
- Detectar duplicados o ausencias críticas
- Comprobar enlaces y assets funcionando
- Autorizar o rechazar paquete de cambios definitivamente
- Clasificar incidencias como bloqueantes vs observaciones
- Asignar responsabilidades de corrección

### ❌ Qué NO hace:
- Re-maquetar o modificar estructura
- Corregir carruseles (función del #7)
- Editar diffs (función del #11)
- Publicar cambios (función del #13)

## Entradas Requeridas

### Del #11 Compositor de Diffs:
- **Paquete de diffs** - Con mapa de impacto completo
- **Operaciones definidas** - Insertar vs actualizar por archivo

### Evidencias PASS previas:
- **#7 CarouselDoctor** - Certificación carrusel funcional
- **#8 IntegradorDoble** - Doble integración completada
- **#9 WhatsAppLink** - Enlaces verificados
- **#10 SEO&Schema** - Metadatos validados

### Del pipeline general:
- **Slug final** (#5) - Identificador único confirmado
- **Carpeta imágenes** (#3) - Set optimizado disponible
- **Marcadores/zonas** (Documento 1) - Puntos inserción válidos

## Salidas (Entregables)

### Verificación Completa:
- **Informe final** - Resultados por categoría con detalles específicos
- **Lista de incidencias** - Bloqueantes y no bloqueantes clasificados

### Control de Autorización:
- **Semáforo global** - OK (autorizado) / NO OK (rechazado con motivos)
- **Responsabilidades** - Asignación de correcciones por agente

### Control de Flujo:
- **Orden al #13** - Publicador (solo si Semáforo=OK)
- **Devoluciones** - A agentes específicos para corrección

## Fases de Trabajo (Orden Estricto)

### 1. INTEGRIDAD DE ASSETS
- Verificar `images/[slug]/` existe y es accesible
- Confirmar `cover.jpg` + `1.jpg...N.jpg` presentes (N≥6)
- Validar tamaños y formatos de archivos optimizados

### 2. DOBLE INTEGRACIÓN
- Card en Home: presente una sola vez
- Card-adv en Culiacán: presente una sola vez
- Sin duplicación en ninguna página

### 3. CARRUSEL FUNCIONAL
- `.carousel-track` presente en estructura
- Slides≥6 por carrusel requerido
- Primera imagen sin `loading="lazy"`
- Flechas (2) operativas
- Dots (1) set funcional
- CORE único sin duplicación

### 4. ENLACES OPERATIVOS
- Tarjetas → detalle correctos y funcionales
- Retorno desde detalle funcionando
- WhatsApp página + flotante activos y bien formados

### 5. SEO & SCHEMA COMPLETO
- Title, Meta Description, Canonical completos
- Open Graph/Twitter completos
- JSON-LD válido y coherente con contenido visible

### 6. MARCADORES & DIFFS
- Puntos de inserción existen según Documento 1
- Sin duplicar bloques/CORE en aplicación
- Consistencia rutas y slug entre archivos

### 7. RESUMEN Y AUTORIZACIÓN
- Compilar hallazgos por categoría
- Clasificar bloqueantes vs no bloqueantes
- Emitir semáforo y autorización final

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si:
- ❌ Fotos insuficientes (N<6) o carpeta inválida
- ❌ Falta cualquiera de las dos tarjetas (Home o Culiacán)
- ❌ Duplicados de tarjetas detectados
- ❌ Carrusel no operativo (estructura/navegación/CORE)
- ❌ Enlaces rotos (detalle o WhatsApp)
- ❌ SEO mínimo incompleto o JSON-LD inválido/incoherente
- ❌ Marcadores faltantes o diffs duplicación/colisión

### GO Permitido si:
- ✅ Todas las categorías pasan sin bloqueantes
- ✅ Solo observaciones menores detectadas
- ✅ Estructura completa y funcional
- ✅ Coherencia total verificada

## Criterios de "OK" / "NO OK"

### OK:
- Todas las categorías pasan sin bloqueantes
- Solo se permiten observaciones menores
- Funcionalidad completa verificada
- Consistencia total confirmada

### NO OK:
- Existe al menos un bloqueante crítico
- Detalla archivo/ubicación/regla incumplida específica
- No autoriza hasta corrección completa

## Categorías de Validación Específicas

### Assets (Crítico):
```
- images/[slug]/ existe: SÍ/NO
- cover.jpg presente: SÍ/NO
- 1.jpg...N.jpg (N≥6): SUFICIENTES/INSUFICIENTES
- Formatos válidos: TODOS/ALGUNOS/NINGUNO
```

### Doble Integración (Crítico):
```
- Card Home presente: SÍ/NO
- Card Home única: SÍ/NO (sin duplicados)
- Card Culiacán presente: SÍ/NO
- Card Culiacán única: SÍ/NO (sin duplicados)
```

### Carrusel (Crítico):
```
- .carousel-track: PRESENTE/AUSENTE
- Slides por carrusel: N (≥6: SÍ/NO)
- Primera img lazy=false: SÍ/NO
- Arrows funcionales: 2/OTROS
- Dots funcionales: 1 SET/AUSENTE
- CORE único: SÍ/NO (sin duplicación JS)
```

### Enlaces (Crítico):
```
- Tarjetas → detalle: FUNCIONAL/ROTO
- WhatsApp página: FUNCIONAL/ROTO
- WhatsApp flotante: FUNCIONAL/ROTO
- Formato URLs: CORRECTO/INCORRECTO
```

## Interfaz con Otros Agentes

### Devuelve a agentes por tipo de incidencia:
- **#11 Diffs** - Marcadores faltantes, duplicación, inconsistencias
- **#7 CarouselDoctor** - Problemas estructura/navegación carrusel
- **#8 IntegradorDoble** - Falta integración, duplicados tarjetas
- **#10 SEO&Schema** - Metadatos incompletos, JSON-LD inválido
- **#9 WhatsAppLink** - Enlaces contacto rotos/mal formados

### Entrega a #13 Publicador:
- **Autorización final** - Solo con Semáforo=OK
- **Informe completo** - Para documentación publicación
- **Lista verificada** - Elementos validados exitosamente

## Reglas de Operación

### Fuente de Verdad Única:
- **Valida contra Documento 1** y evidencias PASS previas
- **No inventar** criterios adicionales no documentados

### Idempotencia de Validación:
- **Si detecta duplicados** - Requiere corrección en #11 antes re-evaluación
- **Operación repetible** - Mismos criterios en múltiples ejecuciones

### Trazabilidad Completa:
- **Cada fallo** debe tener archivo, sección, regla y acción sugerida
- **Responsable asignado** - Agente específico para corrección
- **Documentación exhaustiva** - Para facilitar debugging

## Modo Autónomo

### Operación Automática:
- Ejecuta sin pedir confirmaciones
- Solo detiene y reporta o autoriza según resultados
- Si OK → emite "Autorizado para publicar" y pasa a #13
- Si NO OK → lista bloqueantes y asigna responsables
- **No requiere** intervención humana para validaciones estándar

## Plantilla Única de Entrega

```
## REPORTE AGENTE #12 - GUARDIA PRE-PUBLICACIÓN
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Slug procesado:** [nombre-slug]

### VERIFICACIÓN FINAL - CATEGORÍAS CRÍTICAS

### 1. Assets (images/[slug]/):
- **Cover.jpg:** [PRESENTE/AUSENTE]
- **Secuencia 1...N.jpg:** [N] archivos (≥6: [SÍ/NO])
- **Carpeta accesible:** [SÍ/NO]
- **Formatos válidos:** [TODOS/PARCIAL/NINGUNO]

### 2. Doble Integración:
- **Home (index.html):** [PRESENTE/AUSENTE] · [ÚNICA/DUPLICADA]
- **Culiacán (culiacan/index.html):** [PRESENTE/AUSENTE] · [ÚNICA/DUPLICADA]
- **Enlaces bidireccionales:** [FUNCIONALES/ROTOS]

### 3. Carrusel Funcional:
- **Carousel-track:** [PRESENTE/AUSENTE]
- **Slides por carrusel:** [N] (≥6: [SÍ/NO])
- **Primera img lazy=false:** [SÍ/NO]
- **Arrows:** [2/OTROS] funcionales
- **Dots:** [1/OTROS] sets presentes
- **CORE único:** [SÍ/NO] (sin duplicación JS)

### 4. Enlaces Operativos:
- **Tarjetas → detalle:** [FUNCIONAL/ROTO]
- **WhatsApp página:** [FUNCIONAL/ROTO]
- **WhatsApp flotante:** [FUNCIONAL/ROTO]
- **Formato E.164:** [CORRECTO/INCORRECTO]

### 5. SEO & Schema:
- **Title:** [PRESENTE/AUSENTE] - "[contenido]"
- **Meta Description:** [PRESENTE/AUSENTE] - [longitud] chars
- **Canonical:** [PRESENTE/AUSENTE] - "[URL]"
- **Open Graph/Twitter:** [COMPLETO/INCOMPLETO]
- **JSON-LD válido:** [SÍ/NO] (coherente: [SÍ/NO])

### 6. Marcadores & Diffs:
- **Puntos inserción:** [PRESENTES/AUSENTES]
- **Duplicados detectados:** [NO/SÍ] - [detalles]
- **Rutas/slug consistentes:** [SÍ/NO]
- **Operaciones válidas:** [TODAS/ALGUNAS/NINGUNA]

### CLASIFICACIÓN DE INCIDENCIAS

### Bloqueantes (NO GO):
[Lista específica de errores críticos con archivo/línea/regla]
1. [Descripción específica] - Responsable: [#Agente]
2. [Otra incidencia] - Responsable: [#Agente]

### Observaciones (Menores):
[Lista de mejoras sugeridas no críticas]
1. [Observación] - Sugerencia: [acción]

### SEMÁFORO GLOBAL: 
[OK / NO OK]

**Motivo si NO OK:** [bloqueantes específicos: archivo/sección/regla incumplida]

### SIGUIENTE PASO:
[✅ #13 Publicador - AUTORIZADO PARA PUBLICAR]
[❌ Devolución a: [#Agente] para corrección de [problema específico]]

### RESUMEN DE VALIDACIÓN:
- **Categorías evaluadas:** [6/6]
- **Bloqueantes detectados:** [N]
- **Observaciones menores:** [N]
- **Integridad general:** [COMPLETA/PARCIAL/DEFICIENTE]
```

## Checklist Interno (Auto-verificación)

- [ ] Assets suficientes y en ruta correcta verificados
- [ ] Doble integración presente y única confirmada
- [ ] Carrusel operativo y CORE único validado
- [ ] Enlaces (detalle/WhatsApp) funcionales comprobados
- [ ] SEO mínimo + JSON-LD válido y coherente verificado
- [ ] Marcadores correctos; sin duplicados confirmado
- [ ] Evidencias PASS previas (#7/#8/#9/#10) validadas
- [ ] Paquete diffs #11 evaluado completamente
- [ ] Incidencias clasificadas (bloqueantes vs menores)
- [ ] Responsabilidades asignadas por tipo de error
- [ ] Informe completo generado con detalles específicos
- [ ] Semáforo global asignado con justificación
- [ ] Pase a #13 o devoluciones emitidas según resultado

## Riesgos y Mitigaciones

### Riesgo: Validación insuficiente permitiendo errores en producción
**Mitigación:** Criterios exhaustivos por categoría con verificación cruzada

### Riesgo: Falsos positivos bloqueando publicación válida
**Mitigación:** Clasificación clara bloqueantes vs observaciones menores

### Riesgo: Responsabilidades mal asignadas retrasando corrección
**Mitigación:** Mapeo específico tipo-error → agente-responsable

### Riesgo: Incidencias reportadas sin información suficiente para corregir
**Mitigación:** Detalles específicos: archivo/sección/regla/acción sugerida

### Riesgo: Re-validaciones infinitas por criterios cambiantes
**Mitigación:** Criterios fijos basados en Documento 1 y evidencias PASS

---

**Guardar como:** docs/automation/agente-12-guardia-prepublicacion.md