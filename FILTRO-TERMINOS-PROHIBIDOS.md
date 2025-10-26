# 🛡️ Filtro de Términos Prohibidos - Inmuebles24 Scraper

## 📋 Descripción

Sistema de filtrado automático que detecta y descarta propiedades con términos sensibles relacionados con problemas legales o situaciones irregulares.

---

## 🎯 Propósito

Proteger la reputación del sitio evitando publicar propiedades con:
- Remates bancarios
- Juicios en proceso
- Embargos
- Invasiones
- Adjudicaciones

---

## 🔍 Términos Detectados

El sistema busca los siguientes términos (case-insensitive):

| Término | Categoría |
|---------|-----------|
| `remate` | Remates bancarios |
| `remates` | Remates bancarios |
| `juicio` | Problemas legales |
| `juicio bancario` | Problemas legales |
| `casa invadida` | Invasiones |
| `invadida` | Invasiones |
| `invadido` | Invasiones |
| `embargo` | Problemas legales |
| `embargada` | Problemas legales |
| `adjudicada` | Adjudicaciones |
| `adjudicación` | Adjudicaciones |

---

## 📊 Campos Analizados

El filtro busca en todos estos campos de la propiedad:

1. ✅ **title** - Título de la propiedad
2. ✅ **description** - Descripción completa
3. ✅ **location** - Ubicación
4. ✅ **address_clean** - Dirección normalizada
5. ✅ **features** - Array de características
6. ✅ **tags** - Array de etiquetas

---

## 🔄 Flujo de Ejecución

```
┌─────────────────────────────────────┐
│  1. Scrapear datos de Inmuebles24  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Verificar términos prohibidos   │ ⭐ NUEVO
│     detectForbiddenTerm(data)       │
└──────────────┬──────────────────────┘
               │
         ┌─────┴─────┐
         │           │
    Detectado    No detectado
         │           │
         ▼           ▼
   🛑 Descartar  ✅ Continuar
   Exit(0)       │
                 ▼
         Verificar duplicados
                 │
                 ▼
         Generar slug
                 │
                 ▼
         Descargar fotos
                 │
                 ▼
         Publicar a GitHub
```

---

## 💻 Implementación

### Función Auxiliar

```javascript
function detectForbiddenTerm(data) {
    const FORBIDDEN_TERMS = [
        'remate', 'remates', 'juicio', 'juicio bancario',
        'casa invadida', 'invadida', 'invadido',
        'embargo', 'embargada', 'adjudicada', 'adjudicación'
    ];

    const searchableText = [
        data.title || '',
        data.description || '',
        data.location || '',
        data.address_clean || '',
        ...(data.features || []),
        ...(data.tags || [])
    ].join(' ').toLowerCase();

    for (const term of FORBIDDEN_TERMS) {
        if (searchableText.includes(term.toLowerCase())) {
            return term;
        }
    }

    return null;
}
```

### Uso en Main

```javascript
// Después de scrapear
const data = await scrapeInmuebles24(url, cityMeta);

// Verificar términos prohibidos
const forbiddenTerm = detectForbiddenTerm(data);
if (forbiddenTerm) {
    console.log(`🛑 Propiedad descartada: se detectó la palabra "${forbiddenTerm}"`);
    process.exit(0);
}

// Continuar con el flujo normal...
```

---

## 📺 Ejemplo de Output

### Propiedad Descartada

```
🚀 Iniciando scraper de Inmuebles24...

📍 URL: https://www.inmuebles24.com/propiedades/clasificado/...

🌐 Navegando a la página...
📊 Extrayendo datos...

✅ Datos extraídos exitosamente:
   📝 Título: Casa en Remate Bancario - Excelente Oportunidad
   💰 Precio: MN 1,200,000
   📍 Ubicación: Col. Centro, Culiacán, Sinaloa
   🛏️  3 recámaras
   🛁 2 baños

🛑 Propiedad descartada: se detectó la palabra "remate" en la información.
   → No se generará contenido ni se harán commits.
```

### Propiedad Aceptada

```
🚀 Iniciando scraper de Inmuebles24...

📍 URL: https://www.inmuebles24.com/propiedades/clasificado/...

🌐 Navegando a la página...
📊 Extrayendo datos...

✅ Datos extraídos exitosamente:
   📝 Título: Casa en Venta Interlomas
   💰 Precio: MN 3,600,000
   📍 Ubicación: Fracc. Interlomas, Culiacán, Sinaloa
   🛏️  3 recámaras
   🛁 2 baños

🔗 Slug generado: casa-en-venta-interlomas

📥 Descargando 13 fotos...
[... continúa con el proceso normal ...]
```

---

## ⚙️ Configuración

### Agregar Nuevos Términos

Edita el array `FORBIDDEN_TERMS` en la función `detectForbiddenTerm`:

```javascript
const FORBIDDEN_TERMS = [
    'remate',
    'remates',
    // ... términos existentes ...
    'nuevo_termino',      // ⭐ Agregar aquí
    'otro_termino'        // ⭐ Y aquí
];
```

### Modificar Campos Analizados

Edita el array `searchableText`:

```javascript
const searchableText = [
    data.title || '',
    data.description || '',
    // ... campos existentes ...
    data.nuevo_campo || '',  // ⭐ Agregar nuevo campo
].join(' ').toLowerCase();
```

---

## 🔍 Testing

### Test Manual

```bash
# Buscar una propiedad con términos prohibidos en Inmuebles24
node inmuebles24culiacanscraper.js "URL_CON_REMATE"

# Debe mostrar mensaje de descarte y exit(0)
```

### Test con URL Normal

```bash
# Buscar una propiedad normal
node inmuebles24culiacanscraper.js "URL_NORMAL"

# Debe continuar con el proceso normal
```

---

## 📊 Estadísticas

- **Ubicación código:** `inmuebles24culiacanscraper.js`
- **Función auxiliar:** Línea 1396
- **Verificación main:** Línea 3255-3262
- **Términos detectados:** 11
- **Campos analizados:** 6
- **Exit code:** 0 (sin error)
- **Performance:** Mínimo impacto (<1ms)

---

## 🚀 Integración con Iterador

El filtro funciona automáticamente con el iterador:

```bash
# Procesar URLs una por una
node 1iteradorurlinmuebles24.js

# Si detecta término prohibido:
# - Muestra mensaje de descarte
# - NO elimina URL del JSON (para revisión manual)
# - Exit code 0
# - Continúa con siguiente URL
```

---

## 💡 Notas Importantes

1. ✅ **Case-insensitive:** Detecta "REMATE", "Remate", "remate"
2. ✅ **Substring match:** Detecta "remate" en "remate bancario"
3. ✅ **Exit limpio:** Exit code 0 (no se considera error)
4. ✅ **Sin archivos:** No crea ningún archivo ni descarga fotos
5. ✅ **Sin commits:** No hace commit ni push a GitHub
6. ✅ **Logging claro:** Muestra exactamente qué término se detectó

---

## 📚 Documentación Relacionada

- `inmuebles24culiacanscraper.js` - Scraper principal
- `1iteradorurlinmuebles24.js` - Iterador de URLs
- `1orquestadorurlinmuebles24.js` - Orquestador batch
- `ITERADOR-README.md` - Documentación del iterador

---

## 🔄 Changelog

### 2025-10-26
- ✅ Implementación inicial
- ✅ 11 términos prohibidos agregados
- ✅ 6 campos analizados
- ✅ Documentación completa

---

## 🤝 Mantenimiento

Para mantener el filtro actualizado:

1. **Revisar logs** regularmente para detectar nuevos términos
2. **Agregar términos** según sea necesario
3. **Actualizar documentación** con cada cambio
4. **Testing** después de cada modificación

