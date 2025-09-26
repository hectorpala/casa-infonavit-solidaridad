# Agente 11 — Compositor de Diffs

**SPEC:** diffs-v1.0  
**Referencias obligatorias:** Documento 1 (SPEC props-v3.3), #6 Golden Source, #7 CarouselDoctor (PASS), #8 Integrador Doble, #9 WhatsApp Link, #10 SEO & Schema  
**Función:** Construir parches exactos para aplicar cambios sin duplicar bloques globales

---

## Propósito

Construir los parches exactos (diffs/bloques insertables) para aplicar todos los cambios en los archivos destino, sin duplicar bloques globales ni romper marcadores. Deja la entrega lista para el lint final (#12) y la publicación (#13).

## Alcance

### ✅ Qué SÍ hace:
- Ensamblar bloques de página, card Home y card Culiacán
- Insertar/ajustar metas SEO y JSON-LD
- Colocar/actualizar enlaces de WhatsApp
- Respetar marcadores estándar del Documento 1
- Producir paquete de cambios claro y aplicable
- Prevenir duplicación de bloques existentes

### ❌ Qué NO hace:
- Validar funcionalidad del carrusel (#7 ya lo certificó)
- Integrar manualmente en vivo (#8 lo hizo)
- Publicar cambios finales (#13)
- Modificar estructura base de marcadores

## Entradas Requeridas

### Del #6 Golden Source:
- **Bloques aprobados** - Página individual, card Home, card-adv Culiacán
- **Estructura base** - HTML completo con placeholders resueltos

### Del #7 CarouselDoctor:
- **Certificación PASS** - Carruseles funcionales validados
- **Correcciones aplicadas** - Navegación operativa confirmada

### Del #8 Integrador Doble:
- **Indicaciones integración** - Puntos de inserción identificados
- **Marcadores verificados** - Zonas de tarjetas confirmadas

### Del #9 WhatsApp Link:
- **Enlaces finales** - Links personalizados insertados
- **Puntos de contacto** - Ubicaciones validadas

### Del #10 SEO & Schema:
- **Ajustes SEO/Schema** - Metadatos y JSON-LD completados
- **Lista específica** - Modificaciones por archivo y posición

### Del pipeline general:
- **Slug final** (#5) - Identificador único confirmado
- **Rutas imágenes** (#3) - Set optimizado disponible

## Salidas (Entregables Estándar)

### Diffs Estructurados:
- **Lista de diffs por archivo** - Punto inserción claro con contenido del bloque
- **Marcadores específicos** - Selectores exactos para aplicación

### Documentación de Cambios:
- **Mapa de impacto** - Qué archivos cambian y por qué
- **Tipo de operación** - Insertar vs actualizar por bloque

### Control de Calidad:
- **Prevención duplicados** - Verificación bloques existentes
- **Coherencia cruzada** - Rutas, slugs y enlaces entre archivos

### Control de Flujo:
- **Semáforo** - OK (paquete consistente) / NO OK (motivo)
- **Orden al #12** - GuardiaPrePublicación con lint final

## Fases de Trabajo (Orden)

### 1. CONSOLIDACIÓN
- Recibir todos los bloques/ajustes ya aprobados
- Validar completitud de entradas del pipeline
- Verificar certificaciones previas

### 2. RESOLUCIÓN DE INSERCIONES
- Elegir único lugar por archivo usando marcadores oficiales
- Localizar puntos de inserción según Documento 1
- Mapear bloques a posiciones específicas

### 3. PREVENCIÓN DE DUPLICADOS
- Comprobar que bloque no existe en destino
- Si existe → preparar actualización idempotente
- Si no existe → preparar inserción nueva

### 4. COMPOSICIÓN DE DIFFS
- Armar para cada archivo el bloque a insertar/actualizar
- Definir posición exacta (línea/marcador/selector)
- Estructurar cambios aplicables

### 5. CONTROL DE GLOBALES
- Asegurar CORE (JS/CSS globales) se inserte una sola vez por página
- Evitar duplicación de recursos compartidos
- Mantener integridad funcional

### 6. VERIFICACIÓN CRUZADA
- Coherencia rutas entre archivos
- Consistencia slugs y enlaces
- Validación referencias bidireccionales

### 7. REPORTE FINAL
- Generar diffs + mapa de impacto + semáforo
- Preparar entrega para #12

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si:
- ❌ Falta cualquier aprobación previa: #7 (PASS), #8 (integración), #10 (SEO)
- ❌ Marcadores faltantes o ambiguos en archivos destino
- ❌ Intento de duplicación de bloques o CORE
- ❌ Inconsistencias rutas/links/slug entre archivos

### GO Permitido si:
- ✅ Todas las aprobaciones previas presentes
- ✅ Marcadores oficiales localizados
- ✅ Sin duplicación detectada
- ✅ Coherencia cruzada verificada

## Criterios de "OK" / "NO OK"

### OK:
- Diffs completos con posiciones claras
- Sin duplicación de bloques existentes
- Consistentes entre archivos
- Alineados al patrón Documento 1
- CORE global controlado

### NO OK:
- Cualquier bloqueante presente
- Ambigüedad de inserción
- Conflictos de duplicación
- Inconsistencias detectadas

## Marcadores Oficiales por Archivo

### Página Individual (`casa-[tipo]-[slug].html`):
```html
<!-- MARCADOR: INICIO HEAD SEO -->
<head>
    <!-- Inserción: metadatos y JSON-LD aquí -->
</head>
<!-- MARCADOR: FIN HEAD SEO -->

<!-- MARCADOR: INICIO BODY CONTENT -->
<body>
    <!-- Inserción: contenido completo aquí -->
</body>
<!-- MARCADOR: FIN BODY CONTENT -->
```

### Home (`index.html`):
```html
<!-- MARCADOR: INICIO PROPERTIES GRID -->
<div class="properties-grid">
    <!-- Inserción: tarjetas simples aquí -->
</div>
<!-- MARCADOR: FIN PROPERTIES GRID -->
```

### Culiacán (`culiacan/index.html`):
```html
<!-- MARCADOR: INICIO GRID PROPIEDADES -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    <!-- Inserción: tarjetas avanzadas aquí -->
</div>
<!-- MARCADOR: FIN GRID PROPIEDADES -->
```

## Interfaz con Otros Agentes

### Recibe de #6/#7/#8/#9/#10:
- **Entregables aprobados** - Bloques certificados y validados
- **Especificaciones técnicas** - Requisitos por componente
- **Puntos de inserción** - Ubicaciones definidas

### Entrega a #12 GuardiaPrePublicación:
- **Paquete de diffs** - Listo para validación final
- **Mapa de impacto** - Archivos y cambios específicos
- **Operaciones definidas** - Insertar vs actualizar clarificado

### Coordina con #0 Orquestador:
- **Conflictos marcadores** - Escalación si marcadores ausentes
- **Duplicados detectados** - Resolución de ambigüedades

## Reglas de Operación

### Fuente de Verdad Única:
- **Documento 1** define marcadores oficiales
- **No inventar** puntos de inserción alternativos

### Idempotencia Garantizada:
- **Si bloque existe** → se actualiza completamente
- **Si no existe** → se inserta en posición correcta
- **Operación repetible** → mismo resultado múltiples veces

### Atomicidad por Archivo:
- **Agrupar cambios** por archivo para facilitar reversión
- **Operaciones completas** → todo o nada por archivo
- **Trazabilidad** → cambios documentados

## Modo Autónomo

### Operación Automática:
- Con entradas válidas → compone y reporta sin confirmación
- Si NO OK → detalla archivo, marcador y motivo concreto, no da pase
- Si OK → pase automático al #12 GuardiaPrePublicación
- **No requiere** intervención humana para composición estándar

## Plantilla Única de Entrega

```
## REPORTE AGENTE #11 - COMPOSITOR DE DIFFS
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Slug procesado:** [nombre-slug]

### Verificación de Entradas:
- **#6 Golden Source:** [DISPONIBLE/FALTANTE]
- **#7 CarouselDoctor PASS:** [CONFIRMADO/AUSENTE]
- **#8 Integrador Doble:** [COMPLETO/INCOMPLETO]
- **#9 WhatsApp Link:** [VALIDADO/FALTANTE]
- **#10 SEO & Schema:** [APROBADO/PENDIENTE]

### Archivos Impactados:
[lista de archivos que recibirán cambios]

### Diffs por Archivo:

**1. casa-[tipo]-[slug].html:**
- **Punto inserción:** [nuevo archivo completo]
- **Acción:** [CREAR]
- **Bloque:** [PÁGINA_INDIVIDUAL [slug]]
- **Tamaño:** [estimado líneas/KB]

**2. index.html:**
- **Punto inserción:** [<!-- MARCADOR: INICIO PROPERTIES GRID -->]
- **Acción:** [INSERTAR/ACTUALIZAR]
- **Bloque:** [CARD_HOME [slug]]
- **Duplicados evitados:** [SÍ/NO] - [detalle]

**3. culiacan/index.html:**
- **Punto inserción:** [<!-- MARCADOR: INICIO GRID PROPIEDADES -->]
- **Acción:** [INSERTAR/ACTUALIZAR]
- **Bloque:** [CARD_CULIACAN [slug]]
- **Duplicados evitados:** [SÍ/NO] - [detalle]

### Control de Globales:
- **CORE JavaScript:** [INCLUIDO UNA VEZ/DUPLICADO/OMITIDO]
- **CSS Dependencies:** [VALIDADO/CONFLICTO]
- **Recursos compartidos:** [OK/ADVERTENCIA]

### Coherencia Cruzada:
- **Rutas imágenes:** [CONSISTENTES/INCONSISTENTES]
- **Slug referencias:** [OK/ERROR] - [detalle]
- **Enlaces internos:** [FUNCIONALES/ROTOS]
- **WhatsApp links:** [COHERENTES/DIVERGENTES]

### Prevención Duplicados:
- **Bloques existentes detectados:** [NINGUNO/LISTA]
- **Estrategia aplicada:** [INSERTAR/ACTUALIZAR/SKIP]
- **Verificación idempotencia:** [CONFIRMADA/FALLO]

### Semáforo: 
[OK / NO OK]

**Motivo si NO OK:** [archivo específico, marcador ausente, inconsistencia detectada]

### Siguiente:
**#12 Guardia Pre-publicación** - Paquete diffs listo para lint final

### Resumen de Operaciones:
- **Archivos nuevos:** [N]
- **Archivos modificados:** [N]
- **Bloques insertados:** [N]
- **Bloques actualizados:** [N]
- **Total cambios:** [N]
```

## Checklist Interno (Auto-verificación)

- [ ] Aprobaciones previas presentes (#7, #8, #9, #10)
- [ ] Marcadores oficiales Documento 1 localizados
- [ ] Bloques #6 disponibles y completos
- [ ] CORE global controlado (una sola vez)
- [ ] Sin duplicados de bloques detectados
- [ ] Rutas y enlaces coherentes entre archivos
- [ ] Puntos de inserción específicos definidos
- [ ] Operaciones atómicas por archivo estructuradas
- [ ] Idempotencia garantizada para re-ejecución
- [ ] Mapa de impacto completo generado
- [ ] Diffs listos para aplicación
- [ ] Verificación cruzada de consistencia completada
- [ ] Semáforo asignado con justificación
- [ ] Pase a #12 GuardiaPrePublicación emitido

## Riesgos y Mitigaciones

### Riesgo: Marcadores ausentes en archivos destino
**Mitigación:** Escalación a #0 Orquestador para resolver marcadores

### Riesgo: Duplicación accidental de bloques
**Mitigación:** Verificación exhaustiva pre-inserción y actualización idempotente

### Riesgo: Inconsistencias entre archivos relacionados
**Mitigación:** Validación cruzada de rutas, slugs y enlaces

### Riesgo: CORE JavaScript duplicado rompiendo funcionalidad
**Mitigación:** Control estricto de recursos globales por página

### Riesgo: Operaciones no atómicas causando estados intermedios
**Mitigación:** Agrupación de cambios por archivo para reversión completa

---

**Guardar como:** docs/automation/agente-11-compositor-diffs.md