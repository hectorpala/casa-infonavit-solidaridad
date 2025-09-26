# Agente 14 — AuditorLog

**SPEC:** auditlog-v1.0  
**Referencias obligatorias:** Documento 1 (SPEC props-v3.3), #0 Orquestador, #11 Compositor de Diffs, #13 Publicador  
**Función:** Registrar de forma completa y trazable todo lo ocurrido en la publicación

---

## Propósito

Registrar de forma completa, ordenada y trazable todo lo ocurrido en la publicación de una propiedad: qué se hizo, cuándo, con qué reglas, qué archivos cambió, y el resultado final. Facilita auditorías y revertir si hiciera falta.

## Alcance

### ✅ Qué SÍ hace:
- Recopilar datos de ejecución completos (fases, aprobaciones, diffs aplicados)
- Registrar token humano y post-deploy checks
- Formatear reporte único de auditoría por publicación
- Archivar en ubicación acordada con confirmación
- Facilitar trazabilidad para rollbacks y auditorías

### ❌ Qué NO hace:
- Aplicar cambios en archivos
- Componer diffs (función del #11)
- Corregir QA o validaciones
- Publicar o modificar contenido

## Entradas Requeridas

### Del #13 Publicador:
- **Informe final** - Estado (ÉXITO/FALLO), etiqueta/hash, hora
- **Post-deploy checks** - Resultados verificación en vivo
- **Datos aplicación** - Archivos modificados, tiempo deploy

### Del #11 Compositor de Diffs:
- **Paquete de diffs** - Lista archivos impactados y motivo
- **Mapa de impacto** - Operaciones específicas ejecutadas

### Del #12 Guardia Pre-publicación:
- **Semáforo final** - OK/NO OK con incidencias detectadas
- **Validación completa** - Resultados por categoría

### Del pipeline general:
- **Metadatos SPEC** - props-v3.3, versión Orquestador
- **Slug propiedad** - Identificador único procesado
- **Token humano** - `OK_TO_APPLY=true` con quién/cuándo

## Salidas (Entregables)

### Registro de Auditoría Completo:
- **Documento texto/MD** - Reporte estructurado por publicación
- **Datos básicos** - Propiedad, slug, nombre, fecha/hora
- **SPEC vigentes** - Documento 1 y versiones de agentes utilizados

### Trazabilidad de Proceso:
- **Aprobaciones previas** - PASS de #7, #8, #9, #10, OK de #12
- **Token humano** - `OK_TO_APPLY=true` con autorización específica
- **Diffs aplicados** - Archivos, propósito, tamaño/impacto

### Resultados de Verificación:
- **Post-deploy checks** - Detalle/home/culiacán/whatsapp/SEO
- **Estado final** - ÉXITO/FALLO con etiqueta/hash
- **Observaciones** - Riesgos y notas relevantes

### Archivo y Confirmación:
- **Ubicación clara** - Ruta acordada para auditorías
- **Confirmación guardado** - Verificación archivo creado exitosamente

## Fases de Trabajo (Orden)

### 1. RECOLECCIÓN
- Juntar todos los datos de #11, #12, #13 y Orquestador
- Validar completitud de información requerida
- Identificar faltantes críticos

### 2. NORMALIZACIÓN
- Poner todo en formato estándar con campos fijos
- Estructurar según template de auditoría
- Homogeneizar fechas, horas y formatos

### 3. CONSOLIDACIÓN
- Crear informe único (1 archivo por publicación)
- Integrar todos los datos en reporte coherente
- Verificar consistencia de información

### 4. ARCHIVO
- Guardar en carpeta de auditorías designada
- Confirmar ruta y permisos de acceso
- Verificar integridad de archivo guardado

### 5. AVISO
- Notificar a Orquestador (#0) que auditoría quedó registrada
- Informar ruta específica del reporte
- Alertar a #15 si hubo fallos para posible rollback

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si:
- ❌ Falta informe final de #13 Publicador
- ❌ No existe paquete de diffs o mapa de impacto
- ❌ No consta OK de #12 o token humano registrado

### GO Permitido si:
- ✅ Informe #13 completo con estado final
- ✅ Paquete diffs #11 disponible con detalles
- ✅ Validación #12 documentada
- ✅ Token autorización humana registrado

## Criterios de "OK" / "NO OK"

### OK:
- Informe completo con rutas y etiqueta/hash
- Todos los datos requeridos presentes
- Archivo guardado y notificado exitosamente
- Trazabilidad completa documentada

### NO OK:
- Falta información clave para auditoría
- Datos inconsistentes entre fuentes
- **Acción**: Detalla qué falta y exige reintento tras completar

## Estructura del Registro de Auditoría

### Cabecera:
```
REGISTRO DE AUDITORÍA - PUBLICACIÓN PROPIEDAD
==============================================
Slug: [nombre-slug]
Nombre: [nombre-propiedad]
Fecha/Hora: [YYYY-MM-DD HH:MM:SS UTC]
```

### Especificaciones Utilizadas:
```
SPEC Documento 1: props-v3.3
SPEC Orquestación: orchestration-v1.0
Agentes: [lista versiones utilizadas]
```

### Proceso de Aprobación:
```
#7 CarouselDoctor: PASS - [timestamp]
#8 IntegradorDoble: PASS - [timestamp]
#9 WhatsAppLink: PASS - [timestamp]
#10 SEO&Schema: PASS - [timestamp]
#12 GuardiaPrePublicación: OK - [timestamp]
```

### Autorización Humana:
```
Token: OK_TO_APPLY=true
Autorizado por: [usuario/proceso]
Timestamp: [YYYY-MM-DD HH:MM:SS UTC]
```

## Interfaz con Otros Agentes

### Recibe de múltiples fuentes:
- **#13 Publicador** - Resultado final y verificación post-deploy
- **#12 Guardia** - Validación completa y semáforo final
- **#11 Diffs** - Mapa de impacto y archivos modificados
- **#0 Orquestador** - Datos generales de proceso

### Entrega a #0 Orquestador:
- **Confirmación archivo** - Auditoría completada y ubicación
- **Estado registro** - Éxito/fallo de documentación
- **Ruta específica** - Para acceso posterior a auditoría

### Informa a #15 RollbackManager:
- **Si estado final FALLO** - Para considerar reversión
- **Incidentes mayores** - Detectados durante proceso
- **Datos rollback** - Información para restauración

## Reglas de Operación

### Fuente de Verdad Única:
- **Lo registrado** debe corresponder a informes previos
- **No inventar** datos faltantes
- **Mantener coherencia** con reportes de agentes

### Trazabilidad y Privacidad:
- **Registrar mínimo necesario** para auditar
- **No almacenar** datos sensibles innecesarios
- **Información técnica** suficiente para debugging

### Inmutabilidad:
- **Una vez guardado** - Registro considerado final
- **Cambios posteriores** - Requieren addendum con fecha
- **Integridad** - No modificar registros existentes

## Modo Autónomo

### Operación Automática:
- Tras publicar (#13) → genera y archiva informe sin confirmaciones
- Si falta insumo → emite NO OK con faltantes y espera para reintentar
- **No requiere** intervención humana para consolidación estándar

## Plantilla Única de Entrega

```
## REPORTE AGENTE #14 - AUDITOR LOG
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Registro:** [ID único auditoría]

### Datos de Publicación:
- **Propiedad/Slug:** [nombre-slug]
- **Nombre propiedad:** [nombre-completo]
- **Fecha/Hora publicación:** [YYYY-MM-DD HH:MM:SS UTC]
- **Proceso ID:** [identificador único]

### SPEC Utilizados:
- **Documento 1:** props-v3.3
- **Orquestación:** [versión]
- **Agentes relevantes:** [lista con versiones]

### Trazabilidad de Aprobaciones:
- **#7 CarouselDoctor:** [PASS/FAIL] - [timestamp]
- **#8 IntegradorDoble:** [PASS/FAIL] - [timestamp]
- **#9 WhatsAppLink:** [PASS/FAIL] - [timestamp]
- **#10 SEO&Schema:** [PASS/FAIL] - [timestamp]
- **#12 GuardiaPrePublicación:** [OK/NO OK] - [timestamp]

### Autorización Humana:
- **Token:** OK_TO_APPLY=true [PRESENTE/AUSENTE]
- **Autorizado por:** [usuario/proceso/sistema]
- **Timestamp autorización:** [YYYY-MM-DD HH:MM:SS UTC]

### Archivos Impactados (Diffs):
[Lista detallada con motivo por archivo]
- **[archivo1]:** [operación] - [motivo]
- **[archivo2]:** [operación] - [motivo]

### Resultados Post-Deploy:
- **Página detalle:** [OK/NO] - [URL verificada]
- **Tarjeta Home:** [OK/NO] - [funcionalidad]
- **Tarjeta Culiacán:** [OK/NO] - [carrusel]
- **WhatsApp:** [OK/NO] - [botones/flotante]
- **SEO básico:** [OK/NO] - [elementos verificados]

### Estado Final:
- **Resultado:** [✅ ÉXITO / ❌ FALLO]
- **Etiqueta/Hash:** [identificador versión]
- **Tiempo total:** [duración proceso]

### Archivo de Auditoría:
- **Ruta guardado:** [path específico]
- **Tamaño archivo:** [KB/MB]
- **Verificación integridad:** [checksum/hash]

### Observaciones/Riesgos:
[Lista de notas relevantes o "Sin observaciones críticas"]

### Próximos Pasos:
[✅ Auditoría completada - Archivo disponible en [ruta]]
[❌ Informar #15 RollbackManager - Fallo detectado]
[📢 Notificar #0 Orquestador - Registro consolidado]
```

## Checklist Interno (Auto-verificación)

- [ ] Informe #13 recibido (ÉXITO/FALLO + hash/etiqueta)
- [ ] Mapa de diffs (#11) incluido con detalles completos
- [ ] OK de #12 verificado con timestamp
- [ ] Token humano `OK_TO_APPLY=true` registrado
- [ ] SPEC utilizados documentados (props-v3.3)
- [ ] Aprobaciones previas todas verificadas
- [ ] Post-deploy checks registrados por categoría
- [ ] Archivos impactados listados con motivos
- [ ] Reporte consolidado en formato estándar
- [ ] Archivo guardado en ubicación acordada
- [ ] Ruta confirmada y accesible
- [ ] Notificación enviada a #0 Orquestador
- [ ] Alerta #15 RollbackManager si aplica

## Riesgos y Mitigaciones

### Riesgo: Información incompleta afectando trazabilidad
**Mitigación:** Validación exhaustiva de insumos antes de consolidar

### Riesgo: Pérdida de registros de auditoría
**Mitigación:** Verificación integridad archivo + confirmación guardado

### Riesgo: Datos inconsistentes entre fuentes
**Mitigación:** Cruce de información y detección de discrepancias

### Riesgo: Acceso no autorizado a registros sensibles
**Mitigación:** Ubicación controlada y mínima información necesaria

### Riesgo: Imposibilidad de rollback por falta de detalles
**Mitigación:** Documentación completa de cambios y versiones

---

**Guardar como:** docs/automation/agente-14-auditor.md