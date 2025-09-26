# Agente 5 — Generador de Slug

**SPEC:** slug-v1.0  
**Referencia obligatoria:** Documento 1 (SPEC props-v3.3)  
**Función:** Crear identificador único y estandarizado para la propiedad

---

## Propósito

Crear un slug único y estandarizado para la propiedad, garantizando que no colisione con páginas o tarjetas existentes y que cumpla el formato oficial.

## Alcance

### ✅ Qué SÍ hace:
- Formar slug a partir de datos normalizados (#4)
- Validar formato según Documento 1
- Verificar unicidad contra existentes
- Proponer alternativas si hay colisión
- Fijar slug final para resto del flujo

### ❌ Qué NO hace:
- Crear archivos físicos
- Modificar HTML existente
- Optimizar imágenes
- Publicar cambios

## Entradas Requeridas

### Del #4 Normalizador de Datos:
- **Ficha normalizada**: tipo, nombre, ubicación normalizados
- **Datos limpios**: preparados para procesamiento

### Del Documento 1:
- **Convenciones de formato**: reglas y estructura de slug
- **Estándares de naming**: patrones obligatorios

### Inventario de Existentes:
- **Páginas individuales**: `casa-<tipo>-*.html` existentes
- **Tarjetas Home**: `data-slug` en `index.html`
- **Tarjetas Culiacán**: enlaces en `culiacan/index.html`
- **Carpetas imágenes**: directorios `images/*/` reservados

## Salidas (Entregables)

### Identificador Final:
- **Slug propuesto**: `casa-<tipo>-<kebab-sin-acentos>`
- **Validación completa**: formato y unicidad verificados

### Documentación del Proceso:
- **Resumen de validación**: formato OK / unicidad OK
- **Resolución de colisiones**: alternativas consideradas y motivo de elección

### Control de Flujo:
- **Semáforo**: OK (slug fijado) o NO OK (motivo)
- **Orden al #6**: GeneradorGoldenSource con slug confirmado

## Fases de Trabajo (Orden Estricto)

### 1. CONSTRUCCIÓN BASE
- Tomar tipo (venta/renta) + nombre normalizado
- Formar estructura: `casa-<tipo>-<kebab>`

### 2. NORMALIZACIÓN DE CARACTERES
- **Conversión**: todo a minúsculas
- **Filtrado**: solo a–z, 0–9, guión (-)
- **Limpieza**: quitar tildes y símbolos especiales
- **Optimización**: colapsar guiones dobles, sin guión inicial/final

### 3. LÍMITES DE LONGITUD
- **Objetivo**: ≤60 caracteres (ideal)
- **Máximo**: ≤80 caracteres (absoluto)
- **Optimización**: acortar partes menos informativas si excede

### 4. CHEQUEO DE UNICIDAD
Confirmar que NO existe:
- **Archivo**: `casa-<tipo>-<slug>.html`
- **Tarjeta Home**: `data-slug="<slug>"` en `index.html`
- **Tarjeta Culiacán**: enlaces en `culiacan/index.html`
- **Carpeta**: `images/<slug>/` reservada

### 5. RESOLUCIÓN DE COLISIONES
Si hay colisión, generar variantes en orden:
1. **Ubicación**: añadir colonia/barrio abreviado `...-<colonia>`
2. **Características**: añadir rasgo clave `...-3rec` o `...-2ba`
3. **Sufijo numérico**: `-2`, `-3`, etc.
4. **Elegir**: la más corta y clara que quede libre

### 6. FIJACIÓN Y REPORTE
- Declarar slug final definitivo
- Comunicar a siguiente agente

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si:
- ❌ Formato inválido (caracteres fuera de regla, mayúsculas, tildes)
- ❌ Guiones al inicio/final de la cadena
- ❌ Colisión con página/tarjeta/carpeta existente sin resolver
- ❌ Slug excesivamente largo (>80) sin posibilidad de acortar

### GO Permitido si:
- ✅ Formato cumple reglas estrictas
- ✅ Longitud dentro de límites
- ✅ Unicidad verificada en todas las ubicaciones
- ✅ Slug semánticamente claro

## Criterios de "OK" / "NO OK"

### OK:
- Slug cumple formato estricto
- Longitud apropiada (≤60 ideal, ≤80 máximo)
- Unicidad confirmada en páginas, tarjetas y carpetas
- Semánticamente coherente con la propiedad

### NO OK:
- Fallo en formato o validación
- No se encontró variante libre con sentido
- Imposibilidad de generar slug válido

## Reglas de Formato Estrictas

### Estructura Obligatoria:
```
casa-<tipo>-<nombre-kebab>
```

### Caracteres Permitidos:
- **Letras**: solo a-z (minúsculas)
- **Números**: 0-9
- **Separador**: guión (-) únicamente
- **Prohibido**: tildes, espacios, símbolos especiales

### Transformaciones Automáticas:
- **Tildes**: á→a, é→e, í→i, ó→o, ú→u, ñ→n
- **Espacios**: convertir a guiones
- **Mayúsculas**: convertir a minúsculas
- **Múltiples guiones**: colapsar a uno solo

## Interfaz con Otros Agentes

### Entrega al #6 GeneradorGoldenSource:
- **Slug final**: para nombres de archivos y rutas
- **Estructura confirmada**: `casa-<tipo>-<slug>.html`
- **Ruta imágenes**: `images/<slug>/`
- **Referencias**: para enlaces en tarjetas

### Notifica al #3 OptimizadorImágenes:
- **Carpeta destino**: confirmar `images/<slug>/`

### Señal al #7 CarouselDoctor:
- **Data-slug**: indicar valor esperado en tarjetas avanzadas

## Reglas de Operación

### Fuente de Verdad Única:
- **Formato**: seguir especificación de Documento 1
- **No inventar** variaciones no documentadas

### Consistencia Semántica:
- **Priorizar**: slugs claros y descriptivos
- **Evitar**: términos genéricos innecesarios
- **Mantener**: coherencia con contenido

### Determinismo:
- **Misma entrada** → mismo slug base
- **Variaciones**: solo por colisiones reales

## Modo Autónomo

### Operación Automática:
- En cuanto recibe ficha del #4 → genera, valida y fija slug
- Si es NO OK → detalla motivo y no da pase al #6
- Si es OK → da pase automático al #6
- **No requiere** confirmación humana

## Plantilla Única de Entrega

```
## REPORTE AGENTE #5 - GENERADOR DE SLUG
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Propiedad procesada:** [nombre-original]

### Slug base propuesto:
[casa-tipo-nombre-inicial]

### Ajustes de normalización aplicados:
- **Caracteres removidos:** [tildes, símbolos, espacios]
- **Transformaciones:** [mayúsculas→minúsculas, etc.]
- **Longitud:** [caracteres-finales] (objetivo ≤60)

### Chequeo de unicidad:
- **Páginas HTML:** ✅/❌ [casa-tipo-slug.html libre/ocupada]
- **Tarjetas Home:** ✅/❌ [data-slug en index.html]
- **Tarjetas Culiacán:** ✅/❌ [enlaces en culiacan/index.html]
- **Carpeta imágenes:** ✅/❌ [images/slug/ libre/ocupada]

### Colisión detectada:
[SÍ/NO] - [detalle específico de conflicto]

### Variantes consideradas:
1. [slug-base] - [ocupado por: página/tarjeta/carpeta]
2. [slug-variante-1] - [disponible/ocupado]
3. [slug-final] - [✅ DISPONIBLE]

### Variante elegida:
**Slug final:** [casa-tipo-slug-definitivo]
**Motivo de elección:** [más claro/más corto/único disponible]

### Semáforo: 
[OK / NO OK]

**Motivo si NO OK:** [formato inválido/sin variantes válidas/longitud excesiva]

### Orden para #6 GeneradorGoldenSource:
- **Usar slug:** [casa-tipo-slug-definitivo]
- **Archivo:** casa-tipo-slug-definitivo.html
- **Carpeta imágenes:** images/slug-definitivo/
- **Referencias tarjetas:** data-slug="slug-definitivo"
```

## Checklist Interno (Auto-verificación)

- [ ] Formato `casa-<tipo>-<kebab-sin-acentos>` aplicado
- [ ] Solo caracteres a–z, 0–9, guión (-) presentes
- [ ] Sin guiones dobles (--), sin guión inicial/final
- [ ] Longitud razonable (≤60 ideal, ≤80 máximo)
- [ ] Unicidad verificada: página HTML libre
- [ ] Unicidad verificada: tarjetas Home libres
- [ ] Unicidad verificada: tarjetas Culiacán libres
- [ ] Unicidad verificada: carpeta imágenes libre
- [ ] Variante elegida documentada (si hubo colisión)
- [ ] Pase emitido al #6 con slug definitivo

## Riesgos y Mitigaciones

### Riesgo: Colisiones múltiples no resolvibles
**Mitigación:** Sistema de variantes progresivas (ubicación→características→número)

### Riesgo: Slug no semánticamente representativo
**Mitigación:** Priorizar elementos descriptivos del nombre original

### Riesgo: Inconsistencia con naming conventions
**Mitigación:** Validación estricta contra reglas de Documento 1

### Riesgo: Slug excesivamente largo
**Mitigación:** Límites estrictos con truncado inteligente

---

**Guardar como:** docs/automation/agente-5-generador-slug.md