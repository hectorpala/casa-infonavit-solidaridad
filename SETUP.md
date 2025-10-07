# Setup - Wiggot Scraper y Publicador

## 📦 Requisitos Previos

1. **Node.js** instalado
2. **npm** instalado

## 🚀 Instalación Rápida (Repo Limpio)

El script ahora puede ejecutarse en un repositorio completamente vacío. Creará automáticamente toda la estructura necesaria.

### 1️⃣ Clonar el repositorio

```bash
git clone <repo-url>
cd landing-casa-solidaridad
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Wiggot Credentials
WIGGOT_EMAIL=tu-email@gmail.com
WIGGOT_PASSWORD=tu-password

# Google Maps API Key
GOOGLE_MAPS_KEY=tu-google-maps-api-key

# Anthropic API Key (opcional - para detección de fachada)
ANTHROPIC_API_KEY=tu-anthropic-api-key
```

### 4️⃣ Ejecutar el scraper

```bash
# Modo producción (default)
node wiggot-scraper-y-publicar.js "https://new.wiggot.com/search/property-detail/XXXXX"

# Modo test (solo genera archivos, no publica)
node wiggot-scraper-y-publicar.js "URL" --mode=test

# Modo shadow (publica + guarda JSON en carpeta test)
node wiggot-scraper-y-publicar.js "URL" --mode=shadow
```

## 📁 Estructura de Carpetas (Auto-generada)

El script crea automáticamente esta estructura al ejecutarse:

```
.
├── data/
│   ├── items/              # JSON de propiedades (modo prod)
│   ├── items_test/         # JSON de propiedades (modo test/shadow)
│   ├── media/              # Medios (reservado para futuro uso)
│   ├── media_test/         # Medios test (modo test)
│   └── html_test/          # HTML test (modo test)
├── culiacan/
│   ├── index.html          # Página principal (auto-generada si no existe)
│   └── [slug]/             # Carpeta por propiedad
│       ├── index.html
│       └── images/
├── images/                 # Imágenes globales
└── css/                    # Estilos globales
```

## 🎯 Modos de Ejecución

### PROD (Producción - Default)
- Publica HTML en `culiacan/{slug}/`
- Guarda JSON en `data/items/{slug}.json`
- Agrega tarjeta a `culiacan/index.html`
- ✅ Listo para deploy con "publica ya"

### TEST (Testing)
- Genera archivos en carpetas `_test`
- NO agrega tarjeta a `culiacan/index.html`
- ⚠️ Archivos NO se publican

### SHADOW (Shadow Mode)
- Publica HTML normalmente en `culiacan/{slug}/`
- Guarda JSON en `data/items_test/{slug}.json` (carpeta test)
- Agrega tarjeta a `culiacan/index.html`
- 💡 Útil para migración gradual

## 🛡️ Fallbacks Implementados

### 1. Template HTML Mínimo
Si no existe el template completo de Bugambilias, el script usa un template HTML mínimo embebido con:
- Hero section
- Features básicas
- Botón WhatsApp
- Responsive design

### 2. culiacan/index.html Mínimo
Si no existe, se crea automáticamente con:
- Grid de propiedades responsive
- Estilos Tailwind CSS
- Sistema de tarjetas clickeables

### 3. Carpetas Auto-creadas
Todas las carpetas necesarias se crean al ejecutar el script por primera vez.

## 🔧 Troubleshooting

### "ERROR: Template Bugambilias no encontrado"
✅ **NORMAL** - El script usará el template mínimo embebido automáticamente.

### "ERROR: culiacan/index.html no existe"
✅ **NORMAL** - El script creará uno mínimo automáticamente.

### "ERROR: Credenciales Wiggot no encontradas"
❌ **PROBLEMA** - Verifica que `.env` exista y contenga `WIGGOT_EMAIL` y `WIGGOT_PASSWORD`.

### "ERROR: Google Maps API key no encontrada"
⚠️ **ADVERTENCIA** - Los mapas no se cargarán, pero el script continuará.

## 📋 Checklist Pre-Deploy

1. ✅ `.env` configurado con credenciales
2. ✅ `npm install` ejecutado
3. ✅ Scraper ejecutado sin errores
4. ✅ Verificar archivos generados en `culiacan/{slug}/`
5. ✅ Revisar tarjeta agregada en `culiacan/index.html`
6. ✅ Ejecutar "publica ya" para deployment

## 🚀 Deployment

```bash
# Ejecutar desde Claude Code
"publica ya"
```

El sistema `gitops-publicador` hará:
- Commit automático
- Push a main
- Deploy a GitHub Pages
- Verificación de deployment

## 📚 Documentación Adicional

- `WIGGOT-WORKFLOW-AUTOMATICO.md` - Workflow completo del scraper
- `INSTRUCCIONES_SCRAPER.md` - Instrucciones detalladas del scraper
- `CLAUDE.md` - Configuración del proyecto para Claude

## 🆘 Soporte

Si encuentras problemas:
1. Verifica que `.env` esté configurado correctamente
2. Ejecuta `npm install` nuevamente
3. Prueba con `--mode=test` para verificar sin publicar
4. Revisa los logs de consola para errores específicos
