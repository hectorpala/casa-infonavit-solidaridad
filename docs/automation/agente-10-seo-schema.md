# Agente 10 — SEO & Schema

**SPEC:** seo-schema-v1.0  
**Referencias obligatorias:** Documento 1 (SPEC props-v3.3), Agente #6 (Golden Source), Agente #7 (CarouselDoctor PASS), Agente #8 (Integración Doble), Agente #9 (WhatsApp Link)  
**Función:** Validar y completar SEO mínimo y marcado estructurado antes de publicación

---

## Propósito

Asegurar que cada propiedad cumpla el SEO mínimo completo y el marcado estructurado correcto antes de componer diffs y publicar.

## Alcance

### ✅ Qué SÍ hace:
- Validar y completar metadatos (Title, Meta Description, Canonical, Open Graph/Twitter)
- Crear/verificar JSON-LD adecuado para propiedades
- Revisar indexabilidad y enlaces internos clave
- Asegurar coherencia entre página individual y tarjetas
- Verificar presencia de enlaces de contacto

### ❌ Qué NO hace:
- Maquetar UI nueva (estructura ya definida)
- Generar carruseles (función del #6/#7)
- Integrar tarjetas (función del #8)
- Publicar cambios finales (función del #13)

## Entradas Requeridas

### Del #8 Integración Doble:
- **Bloques integrados** - Página individual + cards en ambas vistas
- **Estructura completa** - HTML con todos los elementos

### Del #4 Datos Normalizados:
- **Datos específicos** - Nombre, ubicación, precio, rec/baños, tipo, slug
- **Información completa** - Para metadatos y structured data

### Del #3 OptimizadorImágenes:
- **Rutas de imágenes finales** - Para og:image y portada
- **Set optimizado** - cover.jpg y secuencia disponible

### Del #9 WhatsApp Link:
- **Enlaces de contacto** - Links finales verificados
- **Puntos de contacto** - Ubicaciones y funcionalidad

## Salidas (Entregables Estándar)

### Metadatos SEO Completos:
- **Title** - Incluye nombre + ubicación + precio visible/estado
- **Meta Description** - Clara, ≤160 caracteres aproximadamente
- **Canonical** - URL absoluta pública esperada
- **Open Graph/Twitter** - title/description/url/image completos

### Structured Data:
- **JSON-LD válido** - Formato aprobado en Documento 1
- **Campos críticos** - Nombre, dirección, oferta, características, URL

### Validación de Coherencia:
- **Informe indexabilidad** - robots/meta robots canónicas coherentes
- **Consistencia tarjetas** - Alineación página ↔ cards

### Control de Flujo:
- **Semáforo** - OK / NO OK (con motivos y campos faltantes)
- **Orden a #11** - CompositorDiffs con ajustes específicos

## Fases de Trabajo (Orden)

### 1. REVISIÓN PÁGINA INDIVIDUAL (DETALLE)
#### Title:
- Incluye nombre + ubicación + precio visible/estado
- Formato: "Casa en [TIPO] [PRECIO] - [NOMBRE], [UBICACION] | Hector es Bienes Raíces"

#### Meta Description:
- Descripción clara ≤160 caracteres aproximadamente
- Incluye características principales y llamada a acción

#### Canonical:
- URL absoluta correcta: `https://casasenventa.info/casa-[tipo]-[slug]/`

#### Open Graph/Twitter:
- `og:title`, `og:description`, `og:image`, `og:url` completos
- `twitter:card`, `twitter:title`, `twitter:description`

#### JSON-LD:
- Estructura SingleFamilyResidence correcta según Documento 1
- Campos críticos: nombre, address, offers, amenityFeature

### 2. COHERENCIA CON TARJETAS (HOME Y CULIACÁN)
- **Imagen portada consistente** - Misma cover.jpg en todos lados
- **Texto básico alineado** - Nombre, ubicación, precio coherentes
- **Enlaces funcionales** - Tarjetas → página individual operativos

### 3. ENLACES DE CONTACTO (#9)
- **WhatsApp presente** donde corresponda
- **Mensaje correcto** y personalizado por contexto
- **Formato funcional** - Links operativos

### 4. INDEXABILIDAD
- **Verificar no noindex** accidental
- **Canonical única** - Sin duplicación
- **Robots.txt compatible** - Indexación permitida

### 5. REPORTE Y PASE
- Generar informe completo de validación
- Emitir semáforo y orden a #11

## Compuertas Go/No-Go (Bloqueantes)

### STOP Obligatorio si:
- ❌ Falta Title o Meta Description
- ❌ Canonical ausente o errónea
- ❌ Open Graph/Twitter incompletos (sin image o url)
- ❌ JSON-LD inválido o campos críticos vacíos
- ❌ Inconsistencia grave entre página y tarjetas

### GO Permitido si:
- ✅ Metadatos completos y coherentes
- ✅ JSON-LD válido con campos obligatorios
- ✅ Enlaces de contacto verificados
- ✅ Canonical correcto y único

## Criterios de "OK" / "NO OK"

### OK:
- Todos los metadatos presentes y coherentes
- JSON-LD válido con estructura completa
- Enlaces de contacto verificados y funcionales
- Canonical correcto y sin duplicación
- Coherencia total página ↔ tarjetas

### NO OK:
- Cualquier bloqueante presente
- Discrepancias que afecten indexabilidad/preview social
- Campos críticos faltantes en structured data

## Estructura JSON-LD Requerida

### Campos Obligatorios:
```json
{
  "@context": "https://schema.org",
  "@type": "SingleFamilyResidence",
  "name": "[NOMBRE PROPIEDAD]",
  "description": "[DESCRIPCION COMPLETA]",
  "url": "https://casasenventa.info/casa-[tipo]-[slug]/",
  "image": ["[ARRAY DE IMAGENES]"],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[DIRECCION]",
    "addressLocality": "[CIUDAD]",
    "addressRegion": "[ESTADO]",
    "addressCountry": "MX"
  },
  "numberOfBedrooms": [NUMERO],
  "numberOfBathroomsTotal": [NUMERO],
  "offers": {
    "@type": "Offer",
    "price": "[PRECIO_NUMERICO o null si Consultar]",
    "priceCurrency": "MXN",
    "availability": "https://schema.org/InStock"
  }
}
```

## Interfaz con Otros Agentes

### Recibe de #8 y #9:
- **Bloques integrados** - Página + tarjetas completamente funcionales
- **Links de contacto** - WhatsApp insertados y verificados
- **Estructura final** - HTML listo para validación SEO

### Entrega a #11 CompositorDiffs:
- **Lista concreta** - Ajustes/insertos SEO & JSON-LD por archivo y posición
- **Especificaciones técnicas** - Qué modificar exactamente
- **Prioridades** - Cambios críticos vs opcionales

### Informa al #12 GuardiaPrePublicación:
- **Campos SEO mínimos** - Lista de validaciones para lint final
- **Criterios indexabilidad** - Qué verificar antes de publicar

## Reglas de Operación

### Fuente de Verdad Única:
- **Datos vienen de #4/#6** - Información normalizada y estructura base
- **Reglas de Documento 1** - Formatos y especificaciones SEO

### Consistencia Absoluta:
- **Visible ↔ Declarativo** - Cards/página y metas/JSON-LD deben coincidir
- **Precio coherente** - Mismo formato en todos los puntos
- **Imagen consistente** - cover.jpg en metadatos y tarjetas

### Criterio Conservador:
- **Si hay duda en precio** - Usar "Consultar precio" también en metas/JSON-LD
- **Campos opcionales** - Incluir solo si datos confirmados
- **Structured data** - Validar contra schema.org estricto

## Modo Autónomo

### Operación Automática:
- Completa y valida SEO/Schema sin pedir confirmaciones
- Si NO OK → lista exactamente campos faltantes/erróneos y no da pase
- Si OK → da pase automático a #11 CompositorDiffs
- **No requiere** intervención humana para validaciones estándar

## Plantilla Única de Entrega

```
## REPORTE AGENTE #10 - SEO & SCHEMA
**Timestamp:** [YYYY-MM-DD HH:MM:SS]
**Slug procesado:** [nombre-slug]

### Página Detalle - Metadatos:
- **Title:** [presente/ausente] - "[título generado]"
- **Meta Description:** [presente/ausente] - [longitud] chars
- **Canonical:** [presente/ausente] - "[URL canónica]"

### Open Graph & Twitter:
- **OG Title:** [OK/NO] - [contenido]
- **OG Description:** [OK/NO] - [contenido]
- **OG URL:** [OK/NO] - [URL]
- **OG Image:** [OK/NO] - [ruta imagen]
- **Twitter Cards:** [OK/NO] - [formato]

### JSON-LD Structured Data:
- **Válido:** [SÍ/NO]
- **Campos críticos presentes:** [SÍ/NO]
  - **Nombre:** [presente/ausente]
  - **Ubicación:** [presente/ausente]
  - **Oferta/Precio:** [presente/ausente o "Consultar"]
  - **Recámaras/Baños:** [números confirmados]
  - **URL:** [presente/ausente]

### Coherencia Tarjetas:
- **Home (index.html):**
  - **Portada consistente:** [SÍ/NO]
  - **Textos básicos coherentes:** [SÍ/NO]
  - **Enlace funcional:** [SÍ/NO]

- **Culiacán (culiacan/index.html):**
  - **Portada consistente:** [SÍ/NO]
  - **Textos básicos coherentes:** [SÍ/NO]
  - **Enlace funcional:** [SÍ/NO]

### WhatsApp (CTA):
- **Presente y correcto:** [SÍ/NO]
- **Página individual:** [SÍ/NO]
- **Botón flotante:** [SÍ/NO]
- **Tarjetas:** [SÍ/NO/NO APLICA]

### Indexabilidad:
- **NoIndex accidental:** [NO/SÍ]
- **Canonical única:** [SÍ/NO]
- **Robots.txt compatible:** [SÍ/NO]

### Semáforo: 
[OK / NO OK]

**Motivo si NO OK:** [campo específico faltante/error de formato/inconsistencia]

### Orden para #11 CompositorDiffs:
**Lista de inserciones/ajustes por archivo:**
- **[archivo1]:** [ajuste específico línea/sección]
- **[archivo2]:** [ajuste específico línea/sección]
[... o "Sin ajustes necesarios"]
```

## Checklist Interno (Auto-verificación)

- [ ] Title + Meta Description presentes y completos
- [ ] Canonical absoluta correcta (https://casasenventa.info/...)
- [ ] Open Graph completo (title, desc, url, image)
- [ ] Twitter Cards configurado correctamente
- [ ] JSON-LD válido con estructura SingleFamilyResidence
- [ ] Campos críticos JSON-LD: nombre, ubicación, oferta, características
- [ ] Coherencia página ↔ tarjeta Home verificada
- [ ] Coherencia página ↔ tarjeta Culiacán verificada
- [ ] WhatsApp verificado en todos los puntos
- [ ] Indexabilidad OK (sin noindex, canonical única)
- [ ] Consistencia de precios en todos los elementos
- [ ] Imagen cover.jpg consistente en metadatos y tarjetas
- [ ] Reporte completo generado
- [ ] Semáforo asignado con justificación específica
- [ ] Orden a #11 emitido con lista de ajustes

## Riesgos y Mitigaciones

### Riesgo: Metadatos incompletos afectando indexación
**Mitigación:** Validación exhaustiva de campos obligatorios

### Riesgo: JSON-LD inválido no reconocido por motores
**Mitigación:** Validación contra schema.org y testing estructurado

### Riesgo: Inconsistencia entre página y tarjetas
**Mitigación:** Verificación cruzada de datos en todos los puntos

### Riesgo: Enlaces de contacto no funcionales
**Mitigación:** Dependencia de #9 WhatsApp Link confirmado

### Riesgo: Canonical duplicado o incorrecto
**Mitigación:** Validación URL absoluta única por propiedad

---

**Guardar como:** docs/automation/agente-10-seo-schema.md