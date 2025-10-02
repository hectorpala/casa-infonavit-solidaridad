# 🏠 CÓMO AGREGAR UNA PROPIEDAD - GUÍA RÁPIDA

## ⚡ MÉTODO 1: SCRAPER AUTOMÁTICO (3 MIN) - **RECOMENDADO** ✨

### Cuándo usar:
- Cuando encuentres una propiedad en **propiedades.com**
- Es el método MÁS RÁPIDO de todos

### Comando:
```bash
node scraper-y-publicar.js "URL_DE_PROPIEDADES_COM"
```

### Ejemplo real:
```bash
node scraper-y-publicar.js "https://propiedades.com/inmuebles/casa-en-venta-culiacan-sinaloa-los-angeles-sinaloa-30372718"
```

### Qué hace automáticamente:
1. ✅ Scrapea datos (precio, recámaras, baños, m², descripción)
2. ✅ Descarga todas las fotos
3. ✅ Genera página HTML completa
4. ✅ Corrige TODOS los badges (naranjas y grises) con datos reales
5. ✅ Corrige metadatos (title, description, Schema.org, Open Graph, hero)
6. ✅ Genera tarjeta para culiacan/index.html
7. ✅ Te dice que archivos se generaron

### Pasos después del scraper:
1. Revisa los archivos generados
2. Inserta la tarjeta en culiacan/index.html
3. Dile al asistente: **"publica ya"**

---

## 🚀 MÉTODO 2: DESDE CARPETA PROYECTOS (5-7 MIN)

### Cuándo usar:
- Cuando tienes fotos en `/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/`
- No está en propiedades.com

### Comando:
```bash
node add-property.js
```

### Qué hace automáticamente:
1. ✅ Te pregunta datos de la propiedad
2. ✅ Auto-detecta fotos en PROYECTOS
3. ✅ Optimiza fotos automáticamente
4. ✅ Genera página HTML
5. ✅ Inserta en listings
6. ✅ Commit y push automático

---

## 📝 PUBLICAR CAMBIOS

Después de cualquier método, dile al asistente:

```
"publica ya"
```

Esto hace:
1. ✅ Git add de todos los archivos
2. ✅ Git commit con mensaje descriptivo
3. ✅ Git push a GitHub Pages
4. ✅ La propiedad aparece en https://casasenventa.info

---

## 🎯 RESUMEN RÁPIDO

| Método | Tiempo | Cuándo Usar |
|--------|--------|-------------|
| **Scraper** | 3 min | Propiedad de propiedades.com |
| **add-property.js** | 5-7 min | Fotos en PROYECTOS |

**Recomendación:** Usa el scraper siempre que la propiedad esté en propiedades.com

---

## 📚 DOCUMENTACIÓN COMPLETA

- **Scraper:** `INSTRUCCIONES_SCRAPER.md`
- **Add Property:** `ADD-PROPERTY-README.md`
- **Todo el proyecto:** `CLAUDE.md`

---

## ✅ EJEMPLO COMPLETO (SCRAPER)

```bash
# 1. Scraper automático
node scraper-y-publicar.js "https://propiedades.com/inmuebles/departamento-en-venta-arquitectos-tierra-blanca-tierra-blanca-sinaloa-30013963"

# Output:
# ✅ Datos scrapeados: { title: '...', price: '$1,990,000', fotos: 5 }
# ✅ 5 fotos descargadas
# ✅ HTML generado: departamento-venta-tierra-blanca-culiacan.html
# ✅ Tarjeta generada: tarjeta-departamento-venta-tierra-blanca-culiacan.html

# 2. Revisar archivo local
open departamento-venta-tierra-blanca-culiacan.html

# 3. Publicar
# Dile al asistente: "publica ya"
```

---

## 🔍 ARCHIVOS CLAVE

- **Scraper:** `scraper-y-publicar.js`
- **Add Property:** `add-property.js`
- **PropertyPageGenerator:** `automation/property-page-generator.js`
- **Templates:** `automation/templates/`

---

## 💡 TIPS

1. **Scraper es más rápido** que add-property.js
2. **PropertyPageGenerator corrige badges automáticamente** (desde Oct 2025)
3. **Siempre revisa el archivo local** antes de publicar
4. **GitHub Pages tarda ~1-2 min** en actualizar después del push
5. **Usa Cmd+Shift+R** para hard refresh si ves caché viejo
