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

### GO Permitido si:
- ✅ PASS #7 confirmado para carrusel
- ✅ Bloques #6 disponibles y válidos
- ✅ Marcadores de inserción identificados
- ✅ Archivos destino accesibles para modificación

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
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    <!-- INSERCIÓN: tarjetas avanzadas aquí -->
</div>
<!-- MARCADOR: FIN GRID PROPIEDADES -->
```

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
- [ ] Reporte completo generado
- [ ] Semáforo asignado con justificación
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