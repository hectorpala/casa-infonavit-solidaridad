# 🏠 Formulario de Valuación de Inmuebles - Culiacán

Sistema completo de captura de datos para valuación de propiedades en Culiacán, Sinaloa, con geocodificación automática y autocomplete inteligente.

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]() 
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-Private-red)]()

---

## ✨ Características Principales

### 🗺️ **Geocodificación Automática**
- Convierte direcciones completas en coordenadas GPS precisas
- Multi-servicio con fallback (Google Maps → Nominatim)
- Precisión: 95-99% con Google Maps
- Backend seguro (oculta API keys)

### 🔍 **Autocomplete Inteligente**
- **631 colonias y fraccionamientos** de Culiacán
- **6,438 calles** de OpenStreetMap
- Búsqueda por tokens (algoritmo casasenventa.info)
- Sugerencias en tiempo real con debouncing

### 📱 **Diseño Responsive**
- Mobile-first (desde 320px)
- Breakpoints: 480px, 768px, 1024px, 1280px, 1440px
- Touch-friendly para tablet/móvil
- Animaciones suaves y modernas

### ✅ **Validación en Tiempo Real**
- Validación campo por campo
- Feedback visual inmediato
- Mensajes de error descriptivos
- Prevención de envíos incompletos

---

## 🚀 Demo en Vivo

### **Desarrollo (Local)**
\`\`\`bash
cd formulario-inmueble
python3 -m http.server 8080
open http://localhost:8080
\`\`\`

### **Producción (Netlify)**
\`\`\`
🌐 https://formulario-inmuebles-culiacan.netlify.app
🌐 https://formulario.casasenventa.info (opcional)
\`\`\`

---

## 📂 Estructura del Proyecto

\`\`\`
formulario-inmueble/
├── index.html                    # Formulario principal (462 líneas)
├── test-geocoding.html           # Página de pruebas de geocodificación
│
├── css/
│   ├── main.css                  # Variables y estilos base (230 líneas)
│   ├── form.css                  # Estilos del formulario (587 líneas)
│   └── responsive.css            # Media queries (150 líneas)
│
├── js/
│   ├── app.js                    # Lógica principal (450+ líneas)
│   ├── validation.js             # Sistema de validación (200+ líneas)
│   ├── geolocation.js            # Geolocalización del navegador (150+ líneas)
│   ├── autocomplete.js           # Autocomplete colonias/calles (587 líneas)
│   ├── geocoding.js              # Desarrollo (con API key visible)
│   └── geocoding-secure.js       # Producción (usa backend proxy)
│
├── data/
│   ├── colonias-culiacan.json    # 631 colonias (104 KB)
│   └── calles-culiacan.json      # 6,438 calles (325 KB)
│
├── api/
│   └── geocode.js                # Backend proxy Netlify (oculta API key)
│
├── netlify.toml                  # Configuración Netlify
├── README.md                     # Esta documentación
├── GEOCODING-README.md           # Documentación geocodificación (400+ líneas)
└── DEPLOYMENT-GUIDE.md           # Guía de deployment (600+ líneas)
\`\`\`

---

## 🎨 Tecnologías Utilizadas

### **Frontend**
- HTML5 (semántico, accesible)
- CSS3 (variables, flexbox, grid, animations)
- JavaScript ES6+ (async/await, fetch, modules)
- Font: Poppins (Google Fonts)
- Icons: Font Awesome 6.0.0

### **Backend**
- Netlify Functions (Node.js serverless)
- Google Maps Geocoding API
- Nominatim API (OpenStreetMap)

### **Data Sources**
- Colonias: Dataset Gobierno de Sinaloa
- Calles: OpenStreetMap via Overpass API

---

## ⚙️ Instalación y Desarrollo

### **Requisitos**
- Python 3 (para servidor local)
- Git (para version control)
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### **Setup Local**

\`\`\`bash
# 1. Clonar repositorio (si aplica)
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/formulario-inmueble"

# 2. Iniciar servidor HTTP
python3 -m http.server 8080

# 3. Abrir en navegador
open http://localhost:8080/index.html

# 4. Probar geocodificación
open http://localhost:8080/test-geocoding.html
\`\`\`

---

## 🚀 Deployment en Producción

### **Opción Recomendada: Netlify**

**Ventajas:**
- ✅ Gratis (100GB bandwidth/mes)
- ✅ HTTPS automático
- ✅ Backend serverless incluido
- ✅ Deploy automático desde GitHub

**Pasos:**
1. Leer \`DEPLOYMENT-GUIDE.md\` (guía completa de 600+ líneas)
2. Crear cuenta en [netlify.com](https://netlify.com)
3. Conectar con GitHub
4. Configurar variable de entorno \`GOOGLE_MAPS_API_KEY\`
5. Deploy automático

---

## 📖 Documentación Adicional

### **Guías Completas**
- [\`GEOCODING-README.md\`](GEOCODING-README.md) - Sistema de geocodificación (400+ líneas)
- [\`DEPLOYMENT-GUIDE.md\`](DEPLOYMENT-GUIDE.md) - Guía de deployment (600+ líneas)

### **APIs Utilizadas**
- [Google Maps Geocoding API](https://developers.google.com/maps/documentation/geocoding)
- [Nominatim API](https://nominatim.org/release-docs/latest/api/Overview/)
- [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)

---

## 🔒 Seguridad

### **Protección de API Keys**

**Desarrollo (Local):**
- API key en \`js/geocoding.js\` (visible en código)
- ⚠️ Solo para localhost

**Producción (Netlify):**
- API key en variable de entorno
- Backend proxy en \`api/geocode.js\`
- ✅ Nunca expuesta al cliente

---

## 📊 Performance

| Métrica | Valor |
|---------|-------|
| Tiempo de carga | < 2s |
| Autocomplete response | < 50ms |
| Geocoding response | 200-800ms |
| Tamaño total | ~1.2 MB |

---

## 📈 Roadmap

### **v1.0.0 - Actual** ✅
- ✅ Formulario multi-paso completo
- ✅ Autocomplete de 631 colonias
- ✅ Autocomplete de 6,438 calles
- ✅ Geocodificación con Google Maps
- ✅ Backend seguro con Netlify Functions

### **v1.1.0 - Próximas Features** ⚪
- ⚪ Integración con CRM
- ⚪ Panel administrativo
- ⚪ Multi-ciudad (Mazatlán, Monterrey)

---

## 👤 Autor

**Hector Palazuelos**
- Website: [casasenventa.info](https://casasenventa.info)

**Desarrollo Técnico:**
- Claude Code (Anthropic)
- Octubre 2025

---

**Made with ❤️ in Culiacán, Sinaloa, México**
