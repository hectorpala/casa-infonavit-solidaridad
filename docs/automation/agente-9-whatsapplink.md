# Agente 9 — Constructor de Link de WhatsApp

**SPEC:** whatsapplink-v1.0  
**Referencias obligatorias:** Documento 1 (SPEC props-v3.3), Agente #4 (datos normalizados), Agente #6 (Golden Source), Agente #8 (Integración Doble)  
**Función:** Generar y verificar enlaces de WhatsApp personalizados para contacto inmediato

---

## Propósito

Generar y verificar el/los enlaces de WhatsApp de la propiedad para contacto inmediato, en todos los puntos donde aparece (página individual, botones de contacto, botón flotante, tarjetas si aplica).

## Alcance

### ✅ Qué SÍ hace:
- Construir link con teléfono E.164 y mensaje prellenado (URL-encoded)
- Insertar en todos los lugares definidos por estructura
- Verificar que enlaces abran correctamente
- Personalizar mensaje con datos específicos de propiedad
- Validar formato y funcionalidad de enlaces

### ❌ Qué NO hace:
- Definir copy comercial (viene del Documento 1 o brief)
- Publicar cambios finales (función del #13)
- Maquetar UI nueva (estructura ya definida por #6)
- Modificar estructura de contacto existente

## Entradas Requeridas

### Del #4 Datos Normalizados:
- **Ficha completa** - Nombre, ubicación, tipo, precio normalizada
- **Datos específicos** - Para personalización de mensaje

### Del Documento 1 o Brief:
- **Teléfono E.164** - Formato +521234567890
- **Mensaje base** - Template comercial definido
- **Copy comercial** - Textos aprobados para contacto

### Del #6/#8 Estructura:
- **Ubicaciones inserción** - Botones página, CTA tarjetas, botón flotante
- **Puntos de contacto** - Definidos en Golden Source

### Del #5 GeneradorSlug:
- **Slug final** - Para personalizar mensaje con identificador

## Salidas (Entregables Estándar)

### Enlaces Generados:
- **Links WhatsApp finales** - `https://wa.me/<E164>?text=<MSG_URL>`
- **Mensajes personalizados** - Por tipo de contacto y ubicación

### Documentación:
- **Mapa de inserciones** - Dónde quedó cada enlace (página, flotante, tarjetas)
- **Verificación funcional** - Links validados y operativos

### Control de Flujo:
- **Semáforo** - OK (links funcionales) / NO OK (motivo)
- **Orden a #10** - SEO&Schema con contactos activos

## Fases de Trabajo (Orden)

### 1. VALIDACIÓN DE INSUMOS
- Confirmar teléfono en formato E.164 válido
- Verificar mensaje base sin caracteres problemáticos
- Validar datos normalizados disponibles

### 2. CONSTRUCCIÓN DEL MENSAJE
- Incluir nombre, ubicación, tipo (venta/renta)
- Agregar slug y/o precio según Documento 1
- Aplicar URL-encode completo al mensaje

### 3. GENERACIÓN DE ENLACES

#### TELÉFONO ESTÁNDAR:
- **SIEMPRE:** `+528111652545` (formato E.164)
- **BASE URL:** `https://wa.me/528111652545?text=`

#### MENSAJES ESPECÍFICOS POR CONTEXTO:

**Página Individual (botón principal + flotante):**
```
Hola, me interesa la [casa en renta/casa en venta] en [UBICACIÓN] por $[PRECIO] [mensuales/]. ¿Podría darme más información y agendar una visita?
```

**Tarjeta Home (index.html):**
```
Me interesa la [casa en renta/casa en venta] en [UBICACIÓN] por $[PRECIO] [mensuales/]. ¿Podría agendar una visita?
```

**Tarjeta Culiacán (avanzada):**
```
Hola, me interesa la [casa en renta/casa en venta] en [UBICACIÓN], [BREVE_DESCRIPCIÓN] por $[PRECIO] [mensuales/]. ¿Podría darme más información?
```

#### REGLAS DE URL ENCODING:
- Espacios → `%20`
- Comas → `%2C`
- Interrogaciones → `%3F`
- Acentos → UTF-8 encoded (ó → `%C3%B3`, í → `%C3%AD`)

### 4. INSERCIÓN
- Asignar enlaces en puntos definidos por #6
- Botón principal de página individual
- Botón flotante personalizado
- Enlaces en tarjetas de integración

### 5. VERIFICACIÓN FUNCIONAL
- Validar esquema/URL simulado
- Confirmar cumplimiento E.164 + encoding
- Testear apertura correcta de WhatsApp

### 6. REPORTE Y PASE
- Generar reporte de enlaces insertados
- Emitir semáforo y pase a #10

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si:
- ❌ Teléfono no E.164 o ausente
- ❌ Mensaje no URL-encoded o contiene caracteres problemáticos
- ❌ Faltan inserciones obligatorias (página, botón flotante)
- ❌ Enlace mal formado (no `https://wa.me/...` o `?text=...`)

### GO Permitido si:
- ✅ Teléfono E.164 válido confirmado
- ✅ Mensaje base disponible y codificable
- ✅ Puntos de inserción identificados
- ✅ Datos de personalización completos

## Criterios de "OK" / "NO OK"

### OK:
- Al menos dos puntos de contacto válidos (página + flotante)
- Mensaje personalizado correcto incluido
- Teléfono E.164 verificado y funcional
- Enlaces bien formados y operativos

### NO OK:
- Falla cualquiera de las compuertas críticas
- Falta algún punto de contacto obligatorio
- Formato de enlace incorrecto
- Mensaje no personalizado adecuadamente

## Tipos de Enlaces por Contexto

### Página Individual:
```
https://wa.me/+52XXXXXXXXXX?text=Me%20interesa%20la%20casa%20en%20[TIPO]%20en%20[UBICACION]%20por%20[PRECIO]
```

### Botón Flotante:
```
https://wa.me/+52XXXXXXXXXX?text=Hola%2C%20me%20interesa%20la%20casa%20en%20[NOMBRE]%20por%20[PRECIO].%20%C2%BFPodr%C3%ADa%20darme%20m%C3%A1s%20informaci%C3%B3n%3F
```

### Tarjetas (Home/Culiacán):
```
https://wa.me/+52XXXXXXXXXX?text=Hola%2C%20me%20interesa%20la%20propiedad%20[SLUG]%20en%20[UBICACION]
```

## Interfaz con Otros Agentes

### Recibe de #6/#8:
- **Ubicaciones concretas** - Puntos de inserción definidos
- **Estructura base** - Golden Source con placeholders
- **Integración completada** - Tarjetas en ambas páginas

### Entrega a #10 SEO&Schema:
- **CTAs de contacto activos** - Para enriquecer metadatos
- **Enlaces verificados** - Funcionality confirmada
- **Datos de contacto** - Para structured data

### Informa a #11 CompositorDiffs:
- **Inserciones realizadas** - Si requieren parches formales
- **Cambios aplicados** - Para documentación de modificaciones

## Reglas de Operación

### Fuente de Verdad Única:
- **Formato y copy base** - Definidos en Documento 1
- **No inventar mensajes** - Usar templates aprobados

### Personalización Obligatoria:
- **Incluir identificadores** - Nombre/slug y ubicación en mensaje
- **Contexto específico** - Adaptar según punto de contacto
- **Datos actuales** - Precio y características específicas

### Idempotencia:
- **Si enlaces existían** - Actualizar números y mensajes, no duplicar
- **Operación repetible** - Mismo resultado en múltiples ejecuciones
- **Preservar estructura** - No modificar layout de contacto

## Modo Autónomo

### Operación Automática:
- Con datos válidos → genera e inserta links y reporta sin confirmación
- Si NO OK → detalla campo exacto que falla y no da pase
- Si OK → pase automático a #10 SEO&Schema
- **No requiere** intervención humana para enlaces estándar

## Plantilla Única de Entrega

```
## REPORTE AGENTE #9 - CONSTRUCTOR WHATSAPP LINK
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Slug procesado:** [nombre-slug]

### Validación de Insumos:
- **Teléfono E.164:** [+52XXXXXXXXXX] - [VÁLIDO/INVÁLIDO]
- **Mensaje base disponible:** [SÍ/NO]
- **Datos personalización:** [COMPLETOS/INCOMPLETOS]

### Mensaje Personalizado:
**Base:** [texto mensaje original]
**Variables incluidas:** nombre=[X], ubicación=[X], precio=[X], tipo=[X]
**URL-encoded:** [SÍ/NO]
**Caracteres problemáticos:** [NINGUNO/DETECTADOS: lista]

### Links Generados:
- **Página individual:** [URL completa]
- **Botón flotante:** [URL completa]
- **Tarjetas Home:** [URL completa / NO APLICA]
- **Tarjetas Culiacán:** [URL completa / NO APLICA]

### Inserciones Realizadas:
- **Página:** [SÍ/NO] - [ubicación específica]
- **Flotante:** [SÍ/NO] - [clase/elemento]
- **Tarjetas:** [SÍ/NO] - [cuántas actualizadas]

### Verificación Funcional:
- **Formato URLs:** [CORRECTO/INCORRECTO]
- **E.164 presente:** [SÍ/NO]
- **Parámetro text:** [PRESENTE/AUSENTE]
- **Encoding completo:** [SÍ/NO]
- **Apertura simulada:** [EXITOSA/FALLO]

### Semáforo: 
[OK / NO OK]

**Motivo si NO OK:** [teléfono/encoding/inserciones/formato - detalle específico]

### Siguiente:
**#10 SEO & Schema** - CTAs de contacto activos listos para metadatos
```

## Checklist Interno (Auto-verificación)

- [ ] Teléfono validado en formato E.164 (+52XXXXXXXXXX)
- [ ] Mensaje base disponible y sin caracteres problemáticos
- [ ] Variables personalización aplicadas (nombre, ubicación, precio)
- [ ] URL-encoding completo aplicado al mensaje
- [ ] URLs construidas en formato `https://wa.me/<E164>?text=<MSG>`
- [ ] Inserción página individual realizada
- [ ] Inserción botón flotante realizada
- [ ] Inserciones tarjetas completadas (si aplican)
- [ ] Verificación funcional de enlaces exitosa
- [ ] Sin duplicación de enlaces existentes
- [ ] Reporte completo generado
- [ ] Semáforo asignado con justificación
- [ ] Pase a #10 SEO&Schema emitido

## Riesgos y Mitigaciones

### Riesgo: Teléfono en formato incorrecto
**Mitigación:** Validación estricta E.164 antes de construcción

### Riesgo: Caracteres especiales rompiendo URLs
**Mitigación:** URL-encoding completo y validación post-generación

### Riesgo: Mensajes genéricos sin personalización
**Mitigación:** Variables obligatorias de propiedad en todos los contextos

### Riesgo: Enlaces duplicados o conflictivos
**Mitigación:** Verificación idempotencia y actualización vs creación

### Riesgo: WhatsApp no abriendo correctamente
**Mitigación:** Formato estricto `wa.me` y testing simulado

---

**Guardar como:** docs/automation/agente-9-whatsapplink.md