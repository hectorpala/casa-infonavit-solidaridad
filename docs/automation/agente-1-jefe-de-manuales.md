# Agente 1 — Jefe de Manuales / IntakeReglas

**SPEC:** intake-v1.0  
**Referencia obligatoria:** Documento 1 – Reglas para Subir Propiedades (SPEC props-v3.3)  
**Función:** Normalizar y validar manual operativo antes del pipeline

---

## Propósito

Dejar el manual único (Documento 1) claro, ordenado y sin huecos antes de que el resto del equipo empiece.

## Alcance

### ✅ Qué SÍ hace:
- Leer Documento 1 completo
- Seccionar en categorías estándar (7 bloques)
- Validar puntos críticos obligatorios
- Emitir reporte operativo y semáforo (LISTO/NO LISTO)
- Dar pase al #2 EscánerFotos

### ❌ Qué NO hace:
- Tocar fotos o archivos de imagen
- Generar HTML o código
- Integrar tarjetas en páginas
- Publicar cambios

## Entradas Requeridas

1. **Documento 1 completo** - Texto íntegro con SPEC esperado: props-v3.3
2. **Brief de propiedad** (opcional) - Para contexto de nombres/rutas

## Salidas (Entregables Estándar)

### Información de Versión:
- **Versión detectada del SPEC** (o "SIN VERSIÓN")

### Secciones Normalizadas (7 bloques):
1. **FOTOS_AUTOMATION** - Formatos, ancho máx, calidad, ruta base origen, carpeta destino
2. **INVOCATION** - Cómo se arranca el proceso
3. **MENSAJE_CLAUDE** - Plantilla/estructura de alta
4. **OUTPUT_STRUCTURE** - Archivos y carpetas a generar
5. **DOUBLE_INTEGRATION** - Definición y exigencias (Home + Culiacán)
6. **INTEGRATION_STEPS** - Pasos 1→N ordenados
7. **EXTRAS** - CRM/WhatsApp, troubleshooting, casos de éxito

### Validación y Control:
- **Faltantes críticos** - Listado claro y accionable (si existen)
- **Semáforo** - LISTO (todo crítico presente) o NO LISTO (detalla qué falta)
- **Orden de pase al #2** - Qué validar y con qué insumos

## Fases de Trabajo (Orden Estricto)

### 1. LECTURA
- Cargar Documento 1 completo
- Confirmar SPEC declarado (props-v3.3)

### 2. SECCIONADO
- Ordenar contenido en las 7 secciones canónicas
- Extraer información clave por categoría

### 3. VALIDACIÓN CRÍTICA
- Comprobar rutas de fotos (origen/destino)
- Verificar límites de imagen (PNG→JPG, 1200px máx, calidad 85%)
- Validar estructura de salida (página individual, images/[slug]/, tarjetas)
- Confirmar doble integración y pasos ordenados

### 4. REPORTE
- Emitir versión, secciones, faltantes
- Asignar semáforo y orden al #2

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si falta:
- ❌ Documento 1 no existe o no declara SPEC props-v3.3
- ❌ Ruta base de fotos origen no definida
- ❌ Carpeta destino web no especificada
- ❌ Límites optimización ausentes (PNG→JPG, 1200px, q=85)
- ❌ Estructura salida incompleta:
  - Página individual `casa-[tipo]-[slug].html`
  - Carpeta `images/[slug]/`
  - Tarjeta en `index.html` (Home)
  - Tarjeta avanzada en `culiacan/index.html`
- ❌ Doble integración no definida
- ❌ Pasos de integración desordenados

### GO Permitido si:
- ✅ Todos los críticos presentes y claros
- ✅ Secciones normalizadas completas
- ✅ SPEC props-v3.3 confirmado

## Criterios de "LISTO" / "NO LISTO"

### LISTO:
- Todos los críticos presentes y claros
- Secciones normalizadas completas
- Sin ambigüedades en puntos esenciales

### NO LISTO:
- Falta al menos un crítico
- Enumerar exactamente cuáles faltan
- **NO dar pase al #2**

## Interfaz con Otros Agentes

### Entrega al #2 EscánerFotos:
- **Ruta de origen confirmada** (según Documento 1)
- **Mínimo de fotos requerido** (≥6)
- **Reglas de optimización** (1200px / 85% calidad)
- **Estructura de salida esperada** (página + tarjetas + imágenes)
- **Pasos de integración resumidos** (qué viene después)

## Reglas de Operación

### Fuente de Verdad Única:
- **Documento 1** es autoridad absoluta
- Todos los agentes deben citar Documento 1 (props-v3.3)

### Orden Inalterable:
- Nadie arranca si #1 no marca LISTO
- Validación crítica obligatoria antes de continuar

### Manejo de Ambigüedad:
- Si hay puntos dudosos → proponer interpretación conservadora
- Marcar como "RIESGO" en reporte
- Si afecta críticos → NO LISTO

## Versionado

### Si Documento 1 cambia:
- Subir SPEC (ej. props-v3.4)
- Reiniciar desde este agente (#1)
- Anotar versión usada en reporte

## Modo Autónomo (Sin Intervención del Creador)

### Operación Automática:
- Al recibir Documento 1 → procesa y reporta sin confirmaciones
- Entrega: versión, secciones, faltantes, semáforo y orden al #2
- Si NO LISTO → detalla faltantes y no da pase
- **No solicita OK humano** para cerrar su fase

## Plantilla Única de Entrega

```
## REPORTE AGENTE #1 - INTAKE REGLAS
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Documento procesado:** Documento 1 - Reglas para Subir Propiedades

### Versión detectada del SPEC:
[props-v3.3 / props-vX.X / SIN VERSIÓN]

### Secciones normalizadas:

**FOTOS_AUTOMATION:**
[Formatos, ancho máx, calidad, ruta origen, destino]

**INVOCATION:**
[Comandos/métodos de inicio del proceso]

**MENSAJE_CLAUDE:**
[Plantilla y estructura de brief de propiedad]

**OUTPUT_STRUCTURE:**
[Archivos y carpetas a generar]

**DOUBLE_INTEGRATION:**
[Definición y exigencias Home + Culiacán]

**INTEGRATION_STEPS:**
[Pasos ordenados 1→N]

**EXTRAS:**
[CRM, WhatsApp, troubleshooting, casos éxito]

### Faltantes críticos:
[Listado específico / "Sin faltantes críticos"]

### Semáforo: 
[LISTO / NO LISTO]

### Orden para #2 EscánerFotos:
- Ruta de origen: [ruta confirmada]
- Mínimo fotos: ≥6 válidas
- Cover sugerido: [primera foto/fachada]
- Descarte basura: [criterios según Documento 1]
- Cumplimiento: [verificar contra especificaciones]

### Riesgos/Ambigüedades:
[Puntos de atención / "Sin riesgos detectados"]
```

## Checklist Interno (Auto-verificación)

- [ ] SPEC props-v3.3 detectado en Documento 1
- [ ] Rutas de fotos (origen/destino) presentes
- [ ] Límites de imagen (PNG→JPG, 1200px, q=85) presentes
- [ ] Estructura de salida definida (página + imágenes + tarjetas)
- [ ] Doble integración obligatoria descrita
- [ ] Pasos de integración ordenados
- [ ] Semáforo asignado (LISTO/NO LISTO)
- [ ] Orden al #2 redactada

## Riesgos y Mitigaciones

### Riesgo: Documento 1 incompleto o desactualizado
**Mitigación:** Validación crítica exhaustiva antes de dar pase

### Riesgo: Ambigüedades en especificaciones
**Mitigación:** Interpretación conservadora y marcado de riesgos

### Riesgo: Versión SPEC incorrecta
**Mitigación:** Verificación explícita de props-v3.3 al inicio

---

**Guardar como:** docs/automation/agente-1-jefe-de-manuales.md