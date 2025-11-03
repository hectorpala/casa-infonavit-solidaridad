# 🚀 Guía de Deployment - Formulario Inmuebles

## 📋 Resumen

Esta guía explica cómo publicar el formulario de inmuebles en línea de forma **SEGURA** y **GRATUITA**.

---

## ⚠️ PROBLEMA: API Key Expuesta

**Estado Actual:**
```javascript
// ❌ INSEGURO - API key visible en el código
apiKeys: {
    google: 'AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk'
}
```

**Riesgo:**
- Cualquiera puede ver tu API key en el código fuente
- Pueden usar tu cuota de Google Maps
- Costos inesperados si exceden límite gratuito

**Solución:**
- ✅ Backend proxy (oculta la API key)
- ✅ Netlify Functions (gratis, automático)

---

## 🎯 OPCIÓN RECOMENDADA: Netlify

### ✅ **Ventajas**
- **Gratis**: 100GB bandwidth/mes
- **Serverless Functions**: Backend gratuito incluido
- **HTTPS automático**: Certificado SSL gratis
- **Deploy automático**: Desde GitHub
- **Variables de entorno**: API keys seguras
- **CDN global**: Velocidad mundial

### 📂 **Archivos Preparados**

Ya están listos:
```
formulario-inmueble/
├── api/
│   └── geocode.js              ← Backend proxy (oculta API key)
├── netlify.toml                ← Configuración Netlify
├── js/
│   ├── geocoding.js            ← Desarrollo (con API key)
│   └── geocoding-secure.js     ← Producción (usa proxy)
└── DEPLOYMENT-GUIDE.md         ← Esta guía
```

---

## 🚀 Paso a Paso: Deployment en Netlify

### **PASO 1: Crear Cuenta en Netlify**

1. Ir a [netlify.com](https://netlify.com)
2. Sign up con GitHub (recomendado)
3. Autorizar acceso a repositorios

### **PASO 2: Preparar Archivos**

```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"

# Renombrar archivo para producción
cd formulario-inmueble
mv js/geocoding.js js/geocoding-dev.js.backup
mv js/geocoding-secure.js js/geocoding.js

# Actualizar index.html para usar versión segura
# (Ya está configurado correctamente)
```

### **PASO 3: Subir a GitHub**

**Opción A: Crear Nuevo Repositorio**
```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/formulario-inmueble"

git init
git add .
git commit -m "Initial commit: Formulario Inmuebles Culiacán"

# Crear repo en GitHub: https://github.com/new
# Nombre: formulario-inmuebles-culiacan

git remote add origin https://github.com/TU_USUARIO/formulario-inmuebles-culiacan.git
git branch -M main
git push -u origin main
```

**Opción B: Agregar al Repo Existente (casasenventa.info)**
```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"

# Copiar carpeta a repo principal
cp -r formulario-inmueble ../

cd ..
git add formulario-inmueble/
git commit -m "Add: Formulario de valuación de inmuebles con geocodificación"
git push origin main
```

### **PASO 4: Conectar Netlify con GitHub**

1. En Netlify dashboard, click **"Add new site"** → **"Import an existing project"**
2. Seleccionar **GitHub**
3. Buscar y seleccionar tu repositorio
4. Configurar build settings:
   ```
   Build command: (dejar vacío)
   Publish directory: . (o formulario-inmueble si está en subdirectorio)
   Functions directory: api
   ```
5. Click **"Deploy site"**

### **PASO 5: Configurar Variables de Entorno**

1. En Netlify dashboard, ir a **Site settings** → **Environment variables**
2. Agregar variable:
   ```
   Key: GOOGLE_MAPS_API_KEY
   Value: AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk
   ```
3. Click **"Save"**
4. Volver a **Deploys** → **Trigger deploy** → **Deploy site**

### **PASO 6: Configurar Dominio (Opcional)**

**Opción A: Subdominio Netlify (Gratis)**
```
https://formulario-inmuebles-culiacan.netlify.app
```
1. En Netlify dashboard, ir a **Site settings** → **Domain management**
2. Click **"Change site name"**
3. Escribir: `formulario-inmuebles-culiacan`
4. Listo

**Opción B: Subdominio Personalizado (Gratis)**
```
https://formulario.casasenventa.info
```
1. En Netlify dashboard, ir a **Domain management** → **Add custom domain**
2. Escribir: `formulario.casasenventa.info`
3. Agregar registro DNS en tu proveedor:
   ```
   Type: CNAME
   Name: formulario
   Value: formulario-inmuebles-culiacan.netlify.app
   ```
4. Esperar propagación DNS (5-30 minutos)
5. Netlify agregará HTTPS automáticamente

---

## 🔒 Seguridad: Restricciones de API Key

### **Paso 7: Restringir API Key de Google Maps**

1. Ir a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Seleccionar tu API key: `AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk`
3. Click **"Edit API key"**
4. Configurar restricciones:

#### **Application restrictions**
```
HTTP referrers (web sites)

Agregar:
- https://formulario-inmuebles-culiacan.netlify.app/*
- https://formulario.casasenventa.info/*
- http://localhost:8080/* (para desarrollo)
```

#### **API restrictions**
```
Restrict key

APIs permitidas:
- Geocoding API ✅ (SOLO esta)
```

5. Click **"Save"**

### **⚠️ Importante:**
- La API key ahora SOLO funciona desde tus dominios
- No funcionará si alguien copia el código
- El backend proxy protege la key del cliente

---

## 🧪 Verificación Post-Deployment

### **Test 1: Verificar Deployment**
```
https://formulario-inmuebles-culiacan.netlify.app
```
- ✅ Página carga correctamente
- ✅ Estilos se ven bien
- ✅ Autocomplete de colonias funciona
- ✅ Autocomplete de calles funciona

### **Test 2: Verificar Backend Proxy**
```javascript
// Abrir consola del navegador (F12)
fetch('/.netlify/functions/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        address: 'Calle Ébano 2609, Privanzas Natura, 80000, Culiacán, Sinaloa, México'
    })
})
.then(r => r.json())
.then(console.log);

// Debe retornar:
// { status: "OK", results: [...] }
```

### **Test 3: Verificar Geocodificación Completa**
1. Llenar formulario completo
2. Colonia: "Privanzas Natura"
3. Calle: "Calle Ébano"
4. Número: "2609"
5. Click "Enviar Formulario"
6. Verificar en consola:
   ```
   🗺️ Geocodificando dirección completa...
   📍 Dirección a geocodificar: Calle Ébano 2609...
   ✅ Coordenadas obtenidas con Google Maps (vía proxy seguro)
   ```

---

## 📊 Monitoreo y Mantenimiento

### **Netlify Analytics (Gratis)**
- Dashboard: [app.netlify.com](https://app.netlify.com)
- Ver: Visitas, bandwidth, errores
- Logs de funciones serverless

### **Google Maps API Usage**
1. Ir a [Console Usage Report](https://console.cloud.google.com/apis/api/geocoding-backend.googleapis.com/quotas)
2. Ver: Requests/día, cuota restante
3. Configurar alertas si llegas a 80%

### **Límites Gratuitos**
```
Netlify:
- 100GB bandwidth/mes
- 125k function invocations/mes
- Ilimitado sitios

Google Maps:
- 40,000 requests/mes gratis
- $5 USD por 1,000 adicionales
```

---

## 🔄 Actualizaciones Futuras

### **Actualizar Código**
```bash
# Hacer cambios en archivos
git add .
git commit -m "Update: descripción del cambio"
git push origin main

# Netlify detecta cambios y re-deploy automáticamente (30-60 segundos)
```

### **Rollback a Versión Anterior**
1. Netlify dashboard → **Deploys**
2. Buscar deploy anterior
3. Click **"Publish deploy"**
4. Listo - rollback en 30 segundos

---

## 📱 URLs Finales

### **Desarrollo (Local)**
```
http://localhost:8080/index.html
http://localhost:8080/test-geocoding.html
```

### **Producción (Netlify)**
```
https://formulario-inmuebles-culiacan.netlify.app
https://formulario.casasenventa.info (opcional)
```

### **Backend API**
```
https://formulario-inmuebles-culiacan.netlify.app/.netlify/functions/geocode
```

---

## 🎉 Resultado Final

### ✅ **Sistema Completamente Funcional**
- ✅ Formulario en línea 24/7
- ✅ HTTPS seguro (certificado SSL)
- ✅ API key protegida (backend proxy)
- ✅ Geocodificación con Google Maps
- ✅ Fallback a Nominatim (gratis)
- ✅ 631 colonias con autocomplete
- ✅ 6,438 calles con autocomplete
- ✅ Responsive (móvil + desktop)
- ✅ Deploy automático desde GitHub

### 💰 **Costo Total: $0 USD**
- Netlify: Gratis (plan gratuito)
- Google Maps: Gratis (40k requests/mes)
- Hosting: Gratis (GitHub Pages como backup)
- SSL: Gratis (Let's Encrypt automático)
- Dominio: Ya tienes (casasenventa.info)

---

## 🆘 Troubleshooting

### **Problema: "Function geocode not found"**
**Causa:** Netlify no detectó la carpeta `api/`
**Solución:**
1. Verificar que `netlify.toml` está en la raíz
2. Verificar que carpeta se llama `api/` (no `functions/`)
3. Re-deploy manualmente

### **Problema: "CORS error"**
**Causa:** Headers no configurados correctamente
**Solución:**
1. Verificar `netlify.toml` tiene sección `[[headers]]`
2. Agregar `Access-Control-Allow-Origin: *`
3. Re-deploy

### **Problema: "API key not working"**
**Causa:** Variable de entorno no configurada
**Solución:**
1. Netlify dashboard → Site settings → Environment variables
2. Verificar `GOOGLE_MAPS_API_KEY` existe
3. Re-deploy después de agregar variable

### **Problema: "403 Forbidden" en Google Maps**
**Causa:** API key restringida por dominio
**Solución:**
1. Google Cloud Console → Credentials
2. Edit API key → Application restrictions
3. Agregar dominio de Netlify
4. Guardar y esperar 5 minutos

---

## 📞 Soporte

### **Netlify Support**
- Docs: [docs.netlify.com](https://docs.netlify.com)
- Community: [answers.netlify.com](https://answers.netlify.com)
- Status: [status.netlify.com](https://status.netlify.com)

### **Google Maps API**
- Docs: [developers.google.com/maps](https://developers.google.com/maps/documentation/geocoding)
- Support: [console.cloud.google.com/support](https://console.cloud.google.com/support)

---

## ✅ Checklist Final

Antes de publicar, verificar:

- [ ] Archivos preparados (geocoding-secure.js)
- [ ] netlify.toml configurado
- [ ] Código subido a GitHub
- [ ] Netlify conectado a repo
- [ ] Variable de entorno `GOOGLE_MAPS_API_KEY` configurada
- [ ] API key de Google Maps restringida por dominio
- [ ] Test de geocodificación funciona
- [ ] Autocomplete de colonias funciona
- [ ] Autocomplete de calles funciona
- [ ] Formulario completo se envía correctamente
- [ ] Responsive funciona en móvil

---

**Última actualización:** Octubre 2025
**Versión:** 1.0.0
**Autor:** Claude Code + Hector Palazuelos
