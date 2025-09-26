# Agente 0 — Orquestador (Coordinador de Turno)

**SPEC:** orchestration-v1.0  
**Referencia:** Documento 1 – Reglas para Subir Propiedades (props-v3.3)  
**Función:** Coordinador maestro del pipeline de propiedades inmobiliarias

---

## Propósito

Asegurar que cada puesto de trabajo ejecute en orden secuencial sin avanzar hasta que el anterior esté completamente listo. Garantizar que toda operación cumpla con SPEC props-v3.3 y mantener trazabilidad completa del proceso.

## Alcance

### ✅ Qué SÍ hace:
- Verificar cumplimiento de SPEC props-v3.3 en Documento 1
- Coordinar secuencia estricta de 13 agentes especializados
- Aplicar compuertas Go/No-Go en cada fase
- Detener pipeline ante cualquier falla de validación
- Generar bitácora completa de turnos y decisiones
- Solicitar token de autorización para fases de modificación

### ❌ Qué NO hace:
- Ejecutar trabajo técnico de otros agentes
- Tomar decisiones de diseño o contenido
- Saltarse validaciones por urgencia
- Proceder sin token OK_TO_APPLY=true en fases críticas

## Entradas Requeridas

1. **Documento 1** - Reglas para Subir Propiedades (SPEC props-v3.3)
2. **Brief de propiedad** - Tipo, nombre, ubicación, precio, descripción, ruta fotos origen
3. **Versión SPEC** - Confirmación props-v3.3
4. **Token autorización** - "OK_TO_APPLY=true" para fases de modificación

## Salidas

- **Resumen de fases** - Estado LISTO/NO LISTO por agente
- **Registro de turnos** - Quién pasó/falló y motivos específicos
- **Puntos de detención** - Razones exactas de No-Go
- **Bitácora completa** - Trazabilidad de decisiones y validaciones
- **Próximos pasos** - Qué agente sigue y qué requiere

## Flujo Ordenado 0→13

**0. Orquestador** - Verificar SPEC props-v3.3 en Documento 1  
**1. IntakeReglas** - Validar rutas, límites, doble integración, archivos destino  
**2. EscánerFotos** - Confirmar carpeta origen, ≥6 fotos válidas, propuesta cover  
**3. OptimizadorImágenes** - Ejecutar compresión PNG→JPG, resize 1200px, calidad 85%  
**4. NormalizadorDatos** - Estructurar información propiedad según templates  
**5. GeneradorSlug** - Crear identificador único casa-[tipo]-[nombre]  
**6. GeneradorGoldenSource** - Producir página individual optimizada  
**7. CarouselDoctor** - Implementar carruseles hero/gallery con navegación  
**8. IntegradorDoble** - Actualizar index.html + culiacan/index.html  
**9. WhatsAppLink** - Configurar mensajes personalizados por propiedad  
**10. SEO&Schema** - Aplicar meta tags, structured data, Open Graph  
**11. CompositorCambios** - Generar diffs y resumen de modificaciones  
**12. GuardiaPrePublicación** - Ejecutar verificaciones finales automáticas  
**13. Publicador** - Deploy a GitHub Pages (solo con OK_TO_APPLY=true)

## Compuertas Go/No-Go

### STOP Obligatorio si:
- Documento 1 no contiene SPEC props-v3.3
- #1 IntakeReglas reporta NO LISTO (rutas faltantes, límites incorrectos)
- #2 EscánerFotos falla validación (carpeta inexistente, <6 fotos)
- Cualquier agente reporta error crítico
- Fases de modificación sin token OK_TO_APPLY=true

### GO Permitido si:
- Documento 1 confirmado props-v3.3
- #1 semáforo LISTO (todas las rutas y límites correctos)
- #2 validación OK (carpeta existe, ≥6 fotos válidas)
- Cada agente reporta completado exitoso
- Token autorización recibido para fases críticas

## Interfaz Entre Agentes

**0→1:** SPEC confirmado + brief de propiedad  
**1→2:** Rutas validadas + límites confirmados + destinos verificados  
**2→3:** Lista fotos válidas + imagen cover propuesta + carpeta confirmada  
**3→4:** Fotos optimizadas + rutas destino + verificación calidad  
**4→5:** Datos estructurados + template seleccionado + información normalizada  
**5→6:** Slug generado + estructura URLs + identificadores únicos  
**6→7:** Página base creada + contenido estructurado + assets ubicados  
**7→8:** Carruseles implementados + navegación funcional + JavaScript activo  
**8→9:** Ambas páginas actualizadas + listings agregados + enlaces verificados  
**9→10:** WhatsApp configurado + mensajes personalizados + botones activos  
**10→11:** SEO completo + schema markup + meta tags optimizados  
**11→12:** Diffs generados + resumen cambios + archivos listados  
**12→13:** Verificaciones passed + score calidad + ready-to-publish confirmado

## Reglas de Operación

### Fuente de Verdad Única:
- **Documento 1** es autoridad absoluta para todas las decisiones
- Cualquier conflicto se resuelve consultando Documento 1
- Si Documento 1 no cubre caso específico: STOP y escalar

### Orden Inalterable:
- Secuencia 0→13 no puede modificarse
- Ningún agente puede trabajar hasta que anterior esté LISTO
- Paralelización prohibida entre agentes

### No-Go Explícito:
- Toda detención debe especificar razón exacta
- Documentar qué corregir para reanudar
- No asumir causas; validar específicamente

### Trazabilidad Completa:
- Registrar cada decisión Go/No-Go con justificación
- Mantener bitácora de tiempos y estados por agente
- Documentar tokens de autorización y quien los otorgó

## Versionado

### Si Documento 1 cambia:
1. **Detectar cambio** - Comparar SPEC actual vs props-v3.3
2. **Actualizar SPEC** - Incrementar a props-v3.4 o siguiente
3. **Reiniciar pipeline** - Volver a agente #1 con nueva versión
4. **Re-validar todo** - Aplicar nuevas reglas desde inicio
5. **Actualizar orquestador** - Modificar SPEC orchestration si necesario

### Compatibilidad:
- Versiones props diferentes no pueden mezclarse
- Un pipeline iniciado con props-v3.3 debe completarse con props-v3.3
- Cambios durante ejecución requieren reinicio completo

## Ubicación y Nombres Sugeridos

**Archivo principal:** `docs/automation/agente-0-orquestador.md`  
**Documento 1:** `documento 1 reglas para subir.md` (existente)  
**Bitácoras:** `logs/pipeline-[fecha]-[hora].md`  
**Templates reporte:** `templates/reporte-turno-template.md`

## Plantilla de Reporte de Turno

```
## REPORTE TURNO - [FECHA] [HORA]
**Propiedad:** [Nombre]
**SPEC:** props-v3.3
**Estado Pipeline:** [ACTIVO/DETENIDO/COMPLETADO]

### Verificaciones Iniciales:
- [ ] Documento 1 props-v3.3 confirmado
- [ ] Brief completo recibido
- [ ] Rutas origen verificadas

### Estado por Agente:
**#1 IntakeReglas:** [LISTO/NO LISTO/PENDIENTE] - [Motivo]
**#2 EscánerFotos:** [LISTO/NO LISTO/PENDIENTE] - [Motivo]
[... continuar para todos]

### Compuertas Aplicadas:
- [Timestamp] GO/NO-GO: [Razón]

### Tokens Autorizados:
- [Timestamp] OK_TO_APPLY=true por [Usuario]

### Próximos Pasos:
[Qué agente sigue y qué necesita]

### Detenciones:
[Si aplica: qué corregir para continuar]
```

## Modo Autónomo (Sin Intervención del Creador)

### Autoinicio:
Al recibir cualquiera de estos insumos, inicio el flujo sin pedir permiso:
- **Documento 1 (SPEC esperado, ej. props-v3.3) + Brief de la propiedad** → Inicio flujo completo
- **Documento 1 solo** → Corro pre-chequeo y quedo en espera activa del Brief

### Sin Confirmaciones Intermedias:
- Avanzo fase por fase aplicando compuertas Go/No-Go sin pedir OK humano
- **Única autorización humana necesaria:** antes de Publicar (#13) debo recibir exactamente `OK_TO_APPLY=true`
- **Todo lo anterior (#1-#12) es 100% automático**

### Reintentos y Tiempos:
- Si un agente no entrega en 2 intentos o tarda más de 3 min → marco NO-GO
- Registro el motivo y sigo con tareas que no dependan de ese resultado (si procede)
- O pauso en el punto crítico si es dependencia bloqueante

### Autorecuperación de Insumos:
- **Si falta Documento 1** → detengo con "NO-GO: Documento 1 ausente"
- **Si falta Brief** → avanzo hasta donde sea posible (INTAKE listo) y dejo pendiente "Fotos/Slug/Golden Source"

### Versionado Automático:
- Si el Documento 1 declara SPEC diferente al esperado → elevo incidencia
- Uso la versión declarada en modo dry-run
- Quedo en espera de confirmación de versión para ejecución real

### Criterio de Independencia:
- **El Orquestador NO solicita confirmaciones entre #1 y #12**
- **Solo publica con `OK_TO_APPLY=true`**
- Operación completamente autónoma hasta el momento de publicación

## Riesgos y Mitigaciones

### Riesgo: Documento 1 desactualizado
**Mitigación:** Verificar SPEC al inicio de cada pipeline

### Riesgo: Salto de validaciones por urgencia
**Mitigación:** No-Go obligatorio sin excepciones

### Riesgo: Pérdida de trazabilidad
**Mitigación:** Bitácora obligatoria en cada decisión

### Riesgo: Conflictos entre agentes
**Mitigación:** Interface clara de entradas/salidas

### Riesgo: Fases modificación sin autorización
**Mitigación:** Token OK_TO_APPLY=true obligatorio

### Riesgo: Pipeline incompleto
**Mitigación:** Verificar estado #13 antes de considerar exitoso

### Riesgo: Ejecución autónoma sin supervisión
**Mitigación:** Bitácora detallada y pausa obligatoria antes de publicación

---

**Guardar como:** docs/automation/agente-0-orquestador.md