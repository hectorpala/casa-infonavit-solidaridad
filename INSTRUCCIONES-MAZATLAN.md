# 🏖️ SCRAPER INMUEBLES24 - MAZATLÁN

## 🚀 USO RÁPIDO

```bash
# Scrapear propiedad de Mazatlán
node inmuebles24-scraper-mazatlan.js "URL_INMUEBLES24"
```

## 📋 DIFERENCIAS CON CULIACÁN

| Característica | Culiacán | Mazatlán |
|---------------|----------|----------|
| Carpeta destino | `culiacan/` | `mazatlan/` |
| Index principal | `culiacan/index.html` | `mazatlan/index.html` |
| URL producción | casasenventa.info/culiacan/ | casasenventa.info/mazatlan/ |
| CRM | `crm-vendedores.json` | `crm-vendedores-mazatlan.json` |
| Registro | `inmuebles24-scraped-properties.json` | `inmuebles24-scraped-properties-mazatlan.json` |

## 🔧 CONFIGURACIÓN

El scraper de Mazatlán (`inmuebles24-scraper-mazatlan.js`) funciona igual que el de Culiacán pero:
- ✅ Guarda propiedades en `mazatlan/[slug]/`
- ✅ Actualiza `mazatlan/index.html`
- ✅ CRM separado para vendedores de Mazatlán
- ✅ Registro independiente de duplicados

## 📊 EJEMPLO WORKFLOW

```bash
# 1. Scrapear casa en Mazatlán
node inmuebles24-scraper-mazatlan.js "https://www.inmuebles24.com/propiedades/..."

# 2. El sistema automáticamente:
#    - Descarga fotos
#    - Genera HTML
#    - Agrega tarjeta a mazatlan/index.html
#    - Actualiza CRM de Mazatlán
#    - Commit y push a GitHub

# 3. Disponible en: https://casasenventa.info/mazatlan/[slug]/
```

## 🗂️ ESTRUCTURA CREADA

```
mazatlan/
├── index.html (página principal Mazatlán)
├── casa-ejemplo-1/
│   ├── index.html
│   ├── styles.css
│   └── images/
│       ├── foto-1.jpg
│       └── ...
└── casa-ejemplo-2/
    └── ...
```

## ⚙️ ARCHIVOS AUXILIARES

- `crm-vendedores-mazatlan.json` - CRM vendedores Mazatlán
- `inmuebles24-scraped-properties-mazatlan.json` - Registro duplicados

## 🎯 PRÓXIMOS PASOS

1. Ejecuta el scraper con una propiedad de Mazatlán
2. Revisa que se genere correctamente
3. Publica con "publica ya"
4. Verifica en https://casasenventa.info/mazatlan/
