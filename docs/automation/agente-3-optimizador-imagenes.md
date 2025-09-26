# Agente 3 — Optimizador de Imágenes

**SPEC:** imgopt-v1.0  
**Referencia obligatoria:** Documento 1 (SPEC props-v3.3)  
**Función:** Producir versiones web optimizadas y ordenadas para el sitio

---

## Propósito

Tomar las fotos validadas por el #2 y producir versiones web optimizadas y ordenadas para el sitio, sin tocar los originales.

## Alcance

### ✅ Qué SÍ hace:
- Convertir formatos según reglas (PNG→JPG)
- Ajustar tamaño/calidad (1200px máx, 85% calidad)
- Crear set web en carpeta destino `images/[slug]/`
- Nombrar/ordenar archivos (1.jpg…N.jpg + cover.jpg)
- Proponer cover.jpg si el #2 no lo fijó
- Dejar todo listo para carrusel

### ❌ Qué NO hace:
- Buscar fotos (función del #2)
- Corregir HTML o código
- Integrar tarjetas en páginas
- Publicar cambios
- Modificar archivos originales

## Entradas Requeridas

### Del #2 Revisor de Fotos:
- **Ruta de origen confirmada** (dentro de PROYECTOS)
- **Lista ordenada de fotos** (1…N) y cover propuesta
- **Conteos** (válidas/descartadas) y notas de riesgo

### Del Documento 1:
- **Reglas de optimización**: PNG→JPG, ancho máx 1200px, calidad 85% por defecto
- **Destino**: `images/[slug]/`

### Del flujo general:
- **Slug confirmado** (del #5 si existe; si no, usar propuesto)

## Salidas (Entregables Estándar)

### Estructura Web Creada:
- **Carpeta web**: `images/[slug]/` con estructura completa
- **Set optimizado**: `1.jpg…N.jpg` + `cover.jpg` en orden correcto

### Análisis de Conversión:
- **Reporte de conversión**: cuántas convertidas, redimensionadas, descartes finales
- **Motivos específicos** de descarte o problema

### Control de Calidad:
- **Verificación mínimos**: N ≥ 6 para carrusel
- **Cumplimiento reglas**: tamaño, formato, calidad según Documento 1

### Control de Flujo:
- **Semáforo**: OK (listo para carrusel) o NO OK (motivo)
- **Orden al siguiente**: set disponible para Golden Source y posterior integración

## Fases de Trabajo (Orden Estricto)

### 1. PREPARACIÓN
- Confirmar ruta de origen válida
- Verificar/crear destino `images/[slug]/` según Documento 1

### 2. CONVERSIÓN/REDUCCIÓN
- Aplicar reglas obligatorias:
  - PNG→JPG conversion
  - Máx 1200px de ancho
  - Calidad 85% (por defecto)

### 3. ORDEN/NOMBRES
- Generar `1.jpg…N.jpg` siguiendo orden del #2
- Fijar `cover.jpg` como imagen principal

### 4. VERIFICACIÓN
- Comprobar N ≥ 6 (mínimo para carrusel)
- Verificar ausencia de archivos corruptos
- Validar tamaño reducido razonable

### 5. REPORTE
- Emitir conteos, riesgos y semáforo
- Dar pase al siguiente agente

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si:
- ❌ No existe carpeta destino o no se pudo crear
- ❌ Set optimizado queda con < 6 imágenes válidas
- ❌ Incumple reglas de Documento 1 (no convierte, excede 1200px, calidad incorrecta)
- ❌ Archivos corruptos o ilegibles en resultado

### GO Permitido si:
- ✅ `images/[slug]/` contiene `cover.jpg` + `1.jpg…N.jpg` (N ≥ 6)
- ✅ Todos ≤1200px de ancho, calidad aplicada
- ✅ Sin corrupción, orden correcto
- ✅ Cumplimiento total de reglas

## Criterios de "OK" / "NO OK"

### OK:
- Carpeta destino con estructura completa
- Cover.jpg + 1.jpg…N.jpg (N ≥ 6) presentes
- Todos ≤1200px ancho, calidad 85% aplicada
- Sin corrupción, orden correcto
- Cumplimiento reglas Documento 1

### NO OK:
- Cualquier bloqueante presente
- Incoherencias graves (nombres perdidos, formatos no soportados)
- Imposibilidad de cumplir mínimos técnicos

## Reglas de Calidad Mínimas (Previas al Carrusel)

### Preservación de Imagen:
- **Respetar proporción** original (sin deformar)
- **Mantener nitidez** razonable (marcar riesgo si fuente muy pequeña)
- **Conservar orientación** correcta (rotaciones EXIF)

### Protección de Originales:
- **No sobreescribir** archivos fuente
- **Solo copias optimizadas** en destino
- **Trazabilidad** de transformaciones

### Excepciones Documentadas:
- Si Documento 1 define excepciones (ej: cover.jpg a 1600px/calidad 90%)
- **Aplicar solo** a casos específicos
- **Anotar en reporte** las excepciones aplicadas

## Interfaz con Otros Agentes

### Entrega al #6 GeneradorGoldenSource / #7 CarouselDoctor:
- **Set completo**: `images/[slug]/` con `cover.jpg` + `1.jpg…N.jpg`
- **Conteos definitivos**: número final de imágenes (N)
- **Nota de riesgos**: imágenes muy verticales/panorámicas, baja resolución, etc.
- **Confirmación cumplimiento**: reglas Documento 1 aplicadas

## Reglas de Operación

### Fuente de Verdad Única:
- **Parámetros técnicos** salen del Documento 1
- **No inventar** criterios adicionales

### Trazabilidad Obligatoria:
- **Registrar** cuántas convertidas y redimensionadas
- **Documentar** motivos de descarte
- **Anotar** excepciones aplicadas

### Criterio de Portada:
- **Usar cover** propuesta por #2
- **Si no existe**: elegir fachada o imagen más representativa
- **Marcar como**: "sujeto a reemplazo"

## Modo Autónomo (Sin Intervención del Creador)

### Operación Automática:
- Al recibir insumo del #2 → procesa y reporta sin confirmación
- Si es NO OK → detalla motivos y no da pase
- Si es OK → anuncia listo para Golden Source
- **No requiere OK humano** (autorización solo en Publicación #13)

## Plantilla Única de Entrega

```
## REPORTE AGENTE #3 - OPTIMIZADOR DE IMÁGENES
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Slug procesado:** [nombre-slug]

### Carpeta destino creada:
images/[slug]/

### Conteo final:
- **Optimizadas:** [N] imágenes procesadas exitosamente
- **Descartadas:** [N] archivos (motivos: [lista específica])

### Set resultante:
- **Cover principal:** cover.jpg ([dimensiones], [tamaño archivo])
- **Carrusel:** 1.jpg…[N].jpg (N=[número total])

### Cumplimiento de reglas (Documento 1):
- **Ancho máximo:** ≤1200px ✅
- **Calidad:** 85% aplicada ✅
- **Conversión:** PNG→JPG aplicada ✅
- **Excepciones:** [si aplican / "Ninguna"]

### Transformaciones aplicadas:
- **Redimensionadas:** [N] imágenes
- **Convertidas PNG→JPG:** [N] imágenes
- **Calidad ajustada:** [N] imágenes

### Riesgos identificados:
[imágenes muy verticales/panorámicas, baja resolución, etc. / "Sin riesgos detectados"]

### Semáforo: 
[OK / NO OK]

**Motivo si NO OK:** [descripción específica del bloqueante]

### Pase al siguiente:
**Listo para:** Golden Source (#6) / CarouselDoctor (#7)
**Set disponible en:** images/[slug]/
**Imágenes listas:** [N] total para carrusel
```

## Checklist Interno (Auto-verificación)

- [ ] Ruta de origen confirmada (del #2)
- [ ] Carpeta destino `images/[slug]/` creada exitosamente
- [ ] Conversión PNG→JPG aplicada según reglas
- [ ] Ancho máx ≤1200px y calidad 85% (o excepciones Documento 1)
- [ ] `cover.jpg` presente y set `1…N.jpg` completo (N ≥ 6)
- [ ] Sin archivos corruptos en resultado final
- [ ] Reporte emitido (conteos + riesgos + transformaciones)
- [ ] Pase anunciado al siguiente agente (#6/#7)

## Riesgos y Mitigaciones

### Riesgo: Pérdida de calidad excesiva en optimización
**Mitigación:** Parámetros conservadores 85% calidad, validación visual

### Riesgo: Archivos corruptos en conversión
**Mitigación:** Verificación post-proceso obligatoria

### Riesgo: Incumplimiento especificaciones Documento 1
**Mitigación:** Validación estricta contra reglas documentadas

### Riesgo: Pérdida de archivos originales
**Mitigación:** Solo copias optimizadas, nunca sobreescribir fuente

---

**Guardar como:** docs/automation/agente-3-optimizador-imagenes.md