# 🕷️ Scraper para propiedades.com

Scraper con Puppeteer que bypassa protecciones anti-bot usando navegador real.

## 🚀 Instalación

```bash
npm install puppeteer
```

⚠️ **Nota:** Puppeteer descarga Chrome (~170MB) automáticamente en la primera instalación.

## 📖 Uso

### Uso Básico

```bash
node scraper-propiedades.js
```

Por defecto busca: **Culiacán, Sinaloa - Venta - 20 propiedades**

### Uso Avanzado

```bash
node scraper-propiedades.js \
  --city culiacan \
  --state sinaloa \
  --type venta \
  --limit 50 \
  --format json \
  --show-browser
```

## ⚙️ Parámetros

| Parámetro | Descripción | Default | Ejemplo |
|-----------|-------------|---------|---------|
| `--city` | Ciudad a buscar | `culiacan` | `--city mazatlan` |
| `--state` | Estado | `sinaloa` | `--state jalisco` |
| `--type` | Tipo de operación | `venta` | `--type renta` |
| `--limit` | Número de propiedades | `20` | `--limit 100` |
| `--format` | Formato de salida | `json` | `--format csv` |
| `--show-browser` | Mostrar navegador | `false` | Flag sin valor |

## 📊 Datos Extraídos

Para cada propiedad intenta extraer:

- ✅ **Título** - Nombre de la propiedad
- ✅ **Precio** - Precio de venta/renta
- ✅ **Ubicación** - Dirección o colonia
- ✅ **Recámaras** - Número de habitaciones
- ✅ **Baños** - Número de baños
- ✅ **Área** - Metros cuadrados
- ✅ **Imagen** - URL de la foto principal
- ✅ **URL** - Link a la propiedad
- ✅ **HTML** - HTML completo de la tarjeta (para debug)

## 📁 Archivos de Salida

### JSON (default)
```bash
propiedades-culiacan-2025-10-02T13-25-30.json
```

Formato:
```json
[
  {
    "title": "Casa en Venta en Culiacán",
    "price": "$1,990,000",
    "location": "Stanza Toscana, Culiacán",
    "bedrooms": "3 recámaras",
    "bathrooms": "1.5 baños",
    "area": "78 m²",
    "image": "https://...",
    "url": "/propiedad/123456"
  }
]
```

### CSV
```bash
node scraper-propiedades.js --format csv
```

Genera: `propiedades-culiacan-2025-10-02T13-25-30.csv`

## 🔧 Técnicas Anti-Detección

El scraper usa múltiples técnicas para bypassar protecciones:

### 1. **Navegador Real (Puppeteer)**
- Ejecuta Chrome/Chromium completo
- Renderiza JavaScript
- Maneja cookies y localStorage

### 2. **User-Agent Real**
```javascript
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36
```

### 3. **Disable Automation Flags**
```javascript
args: [
  '--disable-blink-features=AutomationControlled',
  '--no-sandbox'
]
```

### 4. **Viewport Normal**
- 1920x1080 (resolución estándar de desktop)

### 5. **API Detection**
- Intercepta llamadas a APIs internas
- Guarda en `apis-detected.json`
- Puedes usar esas APIs directamente (más rápido)

## 🐛 Debug Mode

### Ver navegador en acción

```bash
node scraper-propiedades.js --show-browser
```

Abre Chrome visible para ver qué está pasando.

### Archivos de Debug

El scraper genera automáticamente:

1. **debug-screenshot.png** - Screenshot de la página cargada
2. **error-screenshot.png** - Screenshot si hay error
3. **apis-detected.json** - APIs internas detectadas

## 📡 Detección de APIs

Si el scraper no puede extraer del DOM, busca APIs internas:

```bash
📡 APIs detectadas (3):
1. https://propiedades.com/api/v1/properties/search
   Datos: 20 items
2. https://propiedades.com/graphql
   Datos: estructura GraphQL
```

Puedes usar estas APIs directamente con `curl` o `axios` (mucho más rápido).

## 💡 Ejemplos

### Scrape Mazatlán

```bash
node scraper-propiedades.js \
  --city mazatlan \
  --state sinaloa \
  --type venta \
  --limit 50
```

### Scrape Rentas en CDMX

```bash
node scraper-propiedades.js \
  --city ciudad-de-mexico \
  --state distrito-federal \
  --type renta \
  --limit 100 \
  --format csv
```

### Debug Mode

```bash
node scraper-propiedades.js --show-browser
```

## 🔄 Integración con PropertyPageGenerator

Una vez que tengas los datos scrapeados, puedes:

1. **Convertir a formato del generador:**

```javascript
const scrapedData = require('./propiedades-culiacan-2025-10-02T13-25-30.json');

scrapedData.forEach(prop => {
  const propertyData = {
    title: prop.title,
    price: prop.price,
    location: prop.location,
    bedrooms: parseInt(prop.bedrooms),
    bathrooms: parseFloat(prop.bathrooms),
    area: parseInt(prop.area),
    // ... más datos
  };

  // Generar página automáticamente
  const generator = new PropertyPageGenerator();
  const html = generator.generateFromSolidaridadTemplate(propertyData);
  fs.writeFileSync(`casa-${slug}.html`, html);
});
```

2. **Automatizar subida masiva** con el CLI Universal.

## ⚠️ Consideraciones Legales

- ✅ **Uso personal/investigación**: OK
- ✅ **Comparación de precios**: OK
- ⚠️ **Scraping masivo**: Respetar robots.txt
- ⚠️ **Uso comercial**: Verificar términos de servicio
- ❌ **Reventa de datos**: Probablemente prohibido

### Buenas Prácticas

1. **Rate limiting**: No más de 1 request por segundo
2. **Respeto**: No sobrecargar el servidor
3. **Identificación**: Usar User-Agent identificable
4. **robots.txt**: Respetar reglas del sitio

## 🚨 Troubleshooting

### Error: "Puppeteer no está instalado"

```bash
npm install puppeteer
```

### Error: "Timeout waiting for selector"

- El sitio cambió su estructura HTML
- Usa `--show-browser` para ver qué pasa
- Revisa `debug-screenshot.png`
- Analiza `apis-detected.json`

### Error: "Navigation timeout"

- Internet lento
- Sitio caído
- Incrementa timeout en código:

```javascript
await page.goto(url, { timeout: 60000 }); // 60 seg
```

### No se extraen datos

1. Revisa `debug-screenshot.png`
2. Revisa `apis-detected.json`
3. Inspecciona el HTML guardado
4. Ajusta selectores en el código

## 🔮 Próximas Mejoras

- [ ] Paginación automática (múltiples páginas)
- [ ] Proxy rotation para scraping masivo
- [ ] Detección automática de captchas
- [ ] Notificaciones cuando hay nuevas propiedades
- [ ] Comparación de precios históricos
- [ ] Export directo a PropertyPageGenerator

## 📚 Referencias

- [Puppeteer Docs](https://pptr.dev/)
- [Web Scraping Best Practices](https://www.scrapehero.com/web-scraping-best-practices/)
- [robots.txt spec](https://www.robotstxt.org/)
