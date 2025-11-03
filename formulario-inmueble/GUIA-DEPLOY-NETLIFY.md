# 🚀 GUÍA DE DEPLOY EN NETLIFY - PASO A PASO

**Fecha:** 30 octubre 2025
**Proyecto:** Formulario Inmuebles - Clon TuHabi Pixel-Perfect

---

## 📦 PREPARACIÓN PRE-DEPLOY

### 1. Verificar Estructura de Archivos

Asegúrate de tener esta estructura:

```
formulario-inmueble/
├── index.html                  ← Página principal
├── netlify.toml                ← Configuración Netlify ✅
├── css/
│   ├── tokens.css              ← Variables CSS
│   ├── reset.css               ← Normalización
│   ├── layout.css              ← Estructura página
│   ├── components.css          ← Componentes UI
│   ├── form.css                ← Formularios
│   └── responsive.css          ← Media queries
├── js/
│   ├── form-validation.js      ← Validación inline
│   ├── autocomplete.js         ← Google Places
│   ├── geolocation.js          ← Geolocalización
│   ├── step-navigation.js      ← Multi-step
│   └── app.js                  ← Inicialización
├── assets/
│   ├── tuhabi-logo.svg         ← Logo del proyecto
│   └── icons/
│       └── svg/
│           ├── location.svg
│           ├── home.svg
│           ├── ruler.svg
│           └── user.svg
└── data/
    └── colonias-culiacan.js    ← Base datos colonias
```

**Comando para verificar:**
```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/formulario-inmueble"

tree -L 2 -I 'node_modules|.git'
```

### 2. Validar Archivos Clave

**Checklist:**

- [ ] `index.html` tiene el formulario completo (4 pasos)
- [ ] `netlify.toml` existe en la raíz
- [ ] Carpeta `css/` con 6 archivos CSS
- [ ] Carpeta `js/` con 5 archivos JavaScript
- [ ] Carpeta `assets/` con logo e iconos SVG
- [ ] Carpeta `data/` con colonias-culiacan.js

### 3. Probar Localmente

**Iniciar servidor HTTP:**
```bash
python3 -m http.server 8080
```

**Abrir en navegador:**
```
http://localhost:8080
```

**Verificar:**
- ✅ Formulario carga sin errores
- ✅ Progress bar funciona (25%, 50%, 75%, 100%)
- ✅ Inputs responden correctamente
- ✅ Validación inline aparece al blur
- ✅ Navegación entre pasos funciona
- ✅ Console sin errores JavaScript

---

## 🔧 INSTALACIÓN NETLIFY CLI

### Opción 1: npm (Recomendado)

```bash
npm install -g netlify-cli
```

### Opción 2: Homebrew (macOS)

```bash
brew install netlify-cli
```

### Verificar Instalación

```bash
netlify --version
# Debe mostrar: netlify-cli/17.x.x
```

---

## 🔐 AUTENTICACIÓN NETLIFY

### Paso 1: Login

```bash
netlify login
```

**Proceso:**
1. Se abre navegador automáticamente
2. Inicia sesión con tu cuenta Netlify
3. Autoriza la CLI
4. Cierra el navegador
5. Terminal muestra: `✓ You are now logged in as [tu-email]`

### Paso 2: Verificar Autenticación

```bash
netlify status
```

**Output esperado:**
```
✓ Logged in as tu-email@example.com
```

---

## 📤 DEPLOY INICIAL (DRAFT)

### Paso 1: Navegar a la Carpeta

```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/formulario-inmueble"
```

### Paso 2: Iniciar Deploy

```bash
netlify deploy
```

### Paso 3: Responder Preguntas Interactivas

**Pregunta 1:**
```
? What would you like to do?
  ❯ + Create & configure a new site
    Link this directory to an existing site
```
**Respuesta:** Selecciona `Create & configure a new site` (Enter)

**Pregunta 2:**
```
? Team:
  ❯ [Tu nombre/email]
```
**Respuesta:** Selecciona tu team (Enter)

**Pregunta 3:**
```
? Site name (leave blank for a random name):
```
**Respuesta:** Escribe `formulario-inmuebles-culiacan` (Enter)

**Pregunta 4:**
```
? Publish directory (. = current directory):
```
**Respuesta:** Escribe `.` (punto) o presiona Enter

### Paso 4: Esperar Deploy

**Output esperado:**
```
Deploy path:        /ruta/al/proyecto
Configuration path: /ruta/al/proyecto/netlify.toml
Deploying to draft URL...
✔ Finished hashing 15 files
✔ CDN requesting 15 files
✔ Finished uploading 15 assets
✔ Draft deploy is live!

Draft URL: https://[random-hash]--formulario-inmuebles-culiacan.netlify.app
```

### Paso 5: Probar Draft URL

**Abrir en navegador:**
```bash
open "https://[tu-draft-url].netlify.app"
```

**Verificar:**
- ✅ Página carga correctamente
- ✅ CSS aplicado (sin estilos rotos)
- ✅ JavaScript funciona (progress bar, validaciones)
- ✅ Imágenes/SVG cargan correctamente
- ✅ Formulario navegable (4 pasos)

---

## 🚀 DEPLOY A PRODUCCIÓN

### Solo si Draft está OK

```bash
netlify deploy --prod
```

**Output esperado:**
```
✔ Deploy is live!

Unique Deploy URL: https://[hash].netlify.app
Website URL:       https://formulario-inmuebles-culiacan.netlify.app
```

**URL Final:** https://formulario-inmuebles-culiacan.netlify.app

---

## 🔑 CONFIGURAR GOOGLE MAPS API KEY

### Paso 1: Obtener API Key

1. Ve a: https://console.cloud.google.com/
2. Crea un proyecto nuevo (ej: "Formulario Inmuebles")
3. Activa las APIs:
   - **Places API**
   - **Maps JavaScript API**
   - **Geocoding API**
4. Crea una API Key en "Credentials"
5. **Restringe la API Key:**
   - HTTP referrers: `formulario-inmuebles-culiacan.netlify.app/*`

### Paso 2: Agregar API Key a Netlify

**Opción 1: Netlify UI (Recomendado)**

1. Ve a: https://app.netlify.com/
2. Selecciona tu sitio: `formulario-inmuebles-culiacan`
3. Settings > Environment variables
4. Click "Add a variable"
5. Key: `GOOGLE_MAPS_API_KEY`
6. Value: `[tu-api-key]`
7. Scopes: "Same value for all deploy contexts"
8. Click "Create variable"

**Opción 2: Netlify CLI**

```bash
netlify env:set GOOGLE_MAPS_API_KEY "tu-api-key-aqui"
```

### Paso 3: Usar la Variable en HTML

**Editar `index.html` (línea de Google Maps):**

```html
<!-- ANTES (API key hardcodeada) -->
<script src="https://maps.googleapis.com/maps/api/js?key=TU_API_KEY&libraries=places"></script>

<!-- DESPUÉS (variable de entorno) -->
<script>
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'tu-api-key-fallback';
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
  document.head.appendChild(script);
</script>
```

### Paso 4: Re-deploy

```bash
netlify deploy --prod
```

---

## 📧 CONFIGURAR NETLIFY FORMS

### Ya está configurado automáticamente:

1. ✅ `netlify.toml` tiene sección `[forms]`
2. ✅ `index.html` tiene `<form name="property-form" netlify>`
3. ✅ Atributos `name` en todos los inputs

### Verificar Submissions:

1. Ve a: https://app.netlify.com/
2. Selecciona tu sitio
3. Click en "Forms"
4. Deberías ver: `property-form` (0 submissions)

### Probar el Formulario:

1. Abre tu sitio en producción
2. Llena el formulario completo (4 pasos)
3. Click en "Enviar"
4. Verifica en Netlify UI > Forms > `property-form`
5. Deberías ver 1 submission nueva

### Configurar Notificaciones Email:

1. Netlify UI > Forms > Form notifications
2. Click "Add notification"
3. Selecciona "Email notification"
4. Email: tu-email@example.com
5. Click "Save"

**Ahora recibirás un email por cada submission.**

---

## 🌐 DOMINIO PERSONALIZADO (Opcional)

### Agregar Dominio:

1. Netlify UI > Domain management
2. Click "Add domain"
3. Escribe tu dominio: `formulario.tudominio.com`
4. Click "Verify"
5. Netlify te dará records DNS para configurar

### Configurar DNS:

**En tu proveedor de dominio (ej: GoDaddy, Namecheap):**

**Opción A: CNAME (Subdominios)**
```
Type:  CNAME
Name:  formulario
Value: formulario-inmuebles-culiacan.netlify.app
TTL:   3600
```

**Opción B: A Record + AAAA (Dominio raíz)**
```
Type:  A
Name:  @
Value: 75.2.60.5
TTL:   3600

Type:  AAAA
Name:  @
Value: 2600:1f18:24ba:c700:e5ec:5694:65fc:db09
TTL:   3600
```

### Esperar Propagación DNS (15 min - 48 hrs)

**Verificar con:**
```bash
nslookup formulario.tudominio.com
```

### Habilitar HTTPS:

1. Netlify automáticamente detectará el dominio
2. SSL Certificate se emitirá en 1-2 minutos
3. HTTPS será obligatorio automáticamente

---

## 🔄 ACTUALIZAR EL SITIO

### Workflow para actualizaciones:

**Paso 1: Hacer cambios locales**
```bash
# Editar archivos (HTML, CSS, JS)
# Probar localmente:
python3 -m http.server 8080
```

**Paso 2: Deploy a Draft (opcional)**
```bash
netlify deploy
# Probar en draft URL antes de producción
```

**Paso 3: Deploy a Producción**
```bash
netlify deploy --prod
```

**Paso 4: Verificar cambios**
```bash
# Abre tu sitio
open "https://formulario-inmuebles-culiacan.netlify.app"

# Verifica con cache bypass:
# Cmd + Shift + R (macOS)
# Ctrl + Shift + R (Windows/Linux)
```

---

## 🐛 TROUBLESHOOTING

### Problema 1: CSS No Carga

**Síntoma:** Página sin estilos, texto negro sin formato

**Solución:**
```bash
# Verificar rutas CSS en index.html:
<link rel="stylesheet" href="css/tokens.css">
<!-- NO: href="/css/tokens.css" (barra inicial) -->
```

### Problema 2: JavaScript No Funciona

**Síntoma:** Botones no responden, formulario no avanza

**Verificar:**
1. Console del navegador (F12)
2. Buscar errores rojos
3. Verificar que Google Maps API key esté configurada

**Solución:**
```bash
# Configurar API key si no está:
netlify env:set GOOGLE_MAPS_API_KEY "tu-api-key"
netlify deploy --prod
```

### Problema 3: Formulario No Envía

**Síntoma:** Click en "Enviar" no hace nada

**Verificar:**
```html
<!-- index.html debe tener: -->
<form name="property-form" method="POST" netlify>
  <!-- inputs con name="" -->
</form>
```

**Solución:**
```bash
# Re-deploy:
netlify deploy --prod
```

### Problema 4: Deploy Falla

**Síntoma:** Error al hacer `netlify deploy`

**Solución común:**
```bash
# Re-autenticar:
netlify logout
netlify login

# Verificar directorio:
pwd
# Debe mostrar la carpeta del proyecto

# Re-intentar:
netlify deploy
```

### Problema 5: API Key Expuesta

**Síntoma:** API key visible en código fuente

**Solución:**
```bash
# NO hardcodear la API key en HTML
# Usar variables de entorno:
netlify env:set GOOGLE_MAPS_API_KEY "tu-api-key"

# Actualizar index.html para usar variable
# Re-deploy
netlify deploy --prod
```

---

## 📊 MONITOREO POST-DEPLOY

### 1. Analytics

**Netlify Analytics (Pago):**
- Site settings > Analytics
- $9/mes por sitio
- Sin cookies, sin scripts externos

**Google Analytics (Gratis):**
```html
<!-- Agregar en index.html antes de </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 2. Uptime Monitoring

**Opciones:**
- UptimeRobot (gratis): https://uptimerobot.com/
- Pingdom (pago): https://www.pingdom.com/
- Netlify Status (incluido): https://www.netlifystatus.com/

### 3. Error Tracking

**Sentry (Recomendado):**
1. Crea cuenta en https://sentry.io/
2. Crea proyecto "formulario-inmuebles"
3. Copia DSN
4. Agrega script en `index.html`:

```html
<script src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"></script>
<script>
  Sentry.init({
    dsn: 'tu-sentry-dsn',
    environment: 'production'
  });
</script>
```

---

## ✅ CHECKLIST POST-DEPLOY

Después de hacer deploy a producción:

- [ ] Sitio carga en URL de producción
- [ ] CSS aplicado correctamente
- [ ] JavaScript funciona (progress bar, validaciones)
- [ ] Google Maps API responde (autocomplete funciona)
- [ ] Geolocalización solicita permisos
- [ ] Formulario se puede completar (4 pasos)
- [ ] Enviar formulario funciona
- [ ] Submission aparece en Netlify UI > Forms
- [ ] Email de notificación llega (si configurado)
- [ ] Lighthouse scores 90+ (performance, a11y, SEO)
- [ ] Mobile responsive (probar en dispositivo real)
- [ ] HTTPS activo (candado verde en navegador)

---

## 📞 SOPORTE

### Recursos Oficiales:

- **Netlify Docs:** https://docs.netlify.com/
- **Netlify Support:** https://support.netlify.com/
- **Community Forum:** https://answers.netlify.com/
- **Status Page:** https://www.netlifystatus.com/

### Comandos Útiles:

```bash
# Ver logs del sitio:
netlify logs

# Ver deployments:
netlify deploys:list

# Ver variables de entorno:
netlify env:list

# Ver sitios en tu cuenta:
netlify sites:list

# Unlink el proyecto:
netlify unlink
```

---

**Última actualización:** 30 octubre 2025
**Versión:** 1.0
**Tiempo estimado deploy:** 15-20 minutos
