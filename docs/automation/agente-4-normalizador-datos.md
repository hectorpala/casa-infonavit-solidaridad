# Agente 4 — Normalizador de Datos

**SPEC:** datanorm-v1.0  
**Referencia:** Documento 1 (SPEC props-v3.3)  
**Función:** Completar, validar y estandarizar datos de propiedad para el pipeline

---

## Propósito

Dejar todos los datos de la propiedad completos, claros y en formato estándar para que el resto del flujo no falle.

## Alcance

### ✅ Qué SÍ hace:
- Validar/completar campos críticos obligatorios
- Unificar formatos (números, texto, tildes, mayúsculas)
- Verificar coherencia básica entre datos
- Preparar datos para generación de slug
- Estandarizar según convenciones Documento 1

### ❌ Qué NO hace:
- Optimizar imágenes (función del #3)
- Generar HTML o código
- Integrar tarjetas en páginas
- Publicar cambios

## Entradas Requeridas

### Brief de Propiedad Completo:
- **Tipo**: VENTA/RENTA
- **Nombre**: identificación específica
- **Ubicación**: dirección completa
- **Precio**: monto específico o "Consultar precio"
- **Descripción**: texto descriptivo detallado
- **Recámaras**: número específico
- **Baños**: número específico
- **Extras**: características adicionales
- **WhatsApp**: número de contacto

### Del Documento 1:
- **Lineamientos**: mínimos obligatorios y convenciones de estilo
- **Formatos estándar**: estructura de datos requerida

### Del flujo (opcional):
- **Slug propuesto** (del #5 si ya existe)

## Salidas (Entregables)

### Datos Estructurados:
- **Ficha normalizada** con todos los campos obligatorios listos para uso
- **Formatos estandarizados** según convenciones

### Control de Calidad:
- **Observaciones de coherencia** (ej: precio vs "Consultar")
- **Validación de mínimos** (descripción ≥40 caracteres)

### Control de Flujo:
- **Semáforo**: OK (completo) o NO OK (faltantes)
- **Orden para #5**: GeneradorSlug (o confirmación si ya existe)

## Fases de Trabajo (Orden)

### 1. CHEQUEO DE COMPLETITUD
- Verificar presencia de todos los campos obligatorios
- Identificar faltantes críticos

### 2. ESTANDARIZACIÓN
- Aplicar formatos estándar (números, moneda, tildes, mayúsculas)
- Verificar textos mínimos (descripción ≥40 caracteres)
- Limpiar caracteres especiales

### 3. COHERENCIA
- Validar tipo/ubicación/recámaras/baños compatibles
- Confirmar precio "Consultar" permitido si aplica
- Verificar lógica entre campos

### 4. SALIDA
- Generar ficha normalizada
- Emitir semáforo y observaciones

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si:
- ❌ Falta tipo (venta/renta), nombre, ubicación o descripción ≥40 caracteres
- ❌ Recámaras/baños ausentes o inválidos (no numéricos)
- ❌ WhatsApp requerido por Documento 1 y ausente
- ❌ Datos fundamentalmente incoherentes

### GO Permitido si:
- ✅ Todos los campos obligatorios presentes
- ✅ Formatos correctos aplicados
- ✅ Coherencia básica verificada
- ✅ Mínimos cumplidos

## Criterios de "OK" / "NO OK"

### OK:
- Todos los campos obligatorios presentes
- Datos formateados según estándares
- Coherencia verificada entre campos
- Mínimos de calidad cumplidos

### NO OK:
- Cualquier bloqueante presente
- Inconsistencia crítica no resoluble
- Faltantes que impiden continuar pipeline

## Estándares de Normalización

### Formatos de Texto:
- **Nombres**: Capitalización correcta (Casa Villa Bonita)
- **Ubicaciones**: Formato estándar con ciudad/estado
- **Descripciones**: Mínimo 40 caracteres, lenguaje claro

### Formatos Numéricos:
- **Precios**: $1,500,000 o "Consultar precio"
- **Recámaras/Baños**: Números enteros válidos
- **Medidas**: Formato estándar (m², etc.)

### Caracteres Especiales:
- **Para slug**: Limpiar tildes, espacios → guiones
- **Para display**: Mantener tildes y formato legible
- **URLs**: Solo caracteres seguros

## Interfaz con Otros Agentes

### Entrega al #5 GeneradorSlug:
- **Nombre limpio**: sin caracteres especiales para slug
- **Tipo confirmado**: VENTA/RENTA validado
- **Ficha normalizada**: datos completos y formateados

### Notifica al #6 GeneradorGoldenSource:
- **Datos listos**: para inserción en plantilla
- **Formatos aplicados**: según estándares web

## Reglas de Operación

### Fuente de Verdad Única:
- **Documento 1** define mínimos y estilo
- No inventar formatos adicionales

### Convenciones Obligatorias:
- **Kebab-case** sin acentos para elementos técnicos
- **Lenguaje claro** en textos visibles al usuario
- **Consistencia** en toda la ficha

### Manejo de Ambigüedad:
- **Criterio conservador** ante dudas
- **Marcar "RIESGO"** para revisión posterior
- **No bloquear** si no es crítico

## Modo Autónomo

### Operación Automática:
- Procesa en cuanto recibe el brief
- **No pide confirmaciones** humanas
- Si NO OK → lista faltantes precisos y no da pase a #5
- Si OK → da pase automático a #5

## Plantilla Única de Entrega

```
## REPORTE AGENTE #4 - NORMALIZADOR DE DATOS
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Brief procesado:** [nombre-propiedad]

### Campos obligatorios OK:
- **Tipo:** [VENTA/RENTA] ✅/❌
- **Nombre:** [nombre-normalizado] ✅/❌
- **Ubicación:** [dirección-completa] ✅/❌
- **Descripción ≥40:** [caracteres-contados] ✅/❌
- **Recámaras:** [número] ✅/❌
- **Baños:** [número] ✅/❌
- **Precio:** [monto/consultar] coherente ✅/❌
- **WhatsApp:** [presente si aplica] ✅/❌

### Datos normalizados:
```json
{
  "tipo": "[VENTA/RENTA]",
  "nombre": "[nombre-limpio]",
  "ubicacion": "[dirección-completa]",
  "precio": "[formato-estándar]",
  "descripcion": "[texto-normalizado]",
  "recamaras": [número],
  "banos": [número],
  "extras": ["lista-características"],
  "whatsapp": "[número-formateado]"
}
```

### Transformaciones aplicadas:
- **Capitalización:** [casos corregidos]
- **Caracteres especiales:** [limpiezas realizadas]
- **Formatos numéricos:** [estandarizaciones]

### Observaciones de coherencia:
[validaciones específicas / "Sin inconsistencias detectadas"]

### Riesgos identificados:
[puntos de atención / "Sin riesgos detectados"]

### Semáforo: 
[OK / NO OK]

**Motivo si NO OK:** [faltantes específicos]

### Orden para #5 GeneradorSlug:
**Generar slug con:** [tipo] + [nombre-normalizado]
**Datos listos para:** plantilla y estructura web
```

## Checklist Interno

- [ ] Tipo (venta/renta) válido y normalizado
- [ ] Nombre presente y limpio
- [ ] Ubicación completa y formateada
- [ ] Descripción ≥40 caracteres
- [ ] Recámaras (número válido)
- [ ] Baños (número válido)
- [ ] Precio (monto o "Consultar" coherente)
- [ ] Extras listados y organizados
- [ ] WhatsApp presente (si aplica Documento 1)
- [ ] Observaciones/riesgos anotados
- [ ] Semáforo asignado
- [ ] Pase a #5 emitido

## Riesgos y Mitigaciones

### Riesgo: Datos incompletos en brief original
**Mitigación:** Validación exhaustiva de campos obligatorios

### Riesgo: Inconsistencias entre campos
**Mitigación:** Verificación cruzada de coherencia lógica

### Riesgo: Formatos incompatibles con web
**Mitigación:** Estandarización según convenciones documentadas

### Riesgo: Pérdida de información en normalización
**Mitigación:** Preservar datos originales, solo limpiar para uso técnico

---

**Guardar como:** docs/automation/agente-4-normalizador-datos.md