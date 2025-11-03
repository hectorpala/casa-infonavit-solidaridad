# 🚀 Instrucciones de Deployment - Netlify

## ✨ MÉTODO RÁPIDO: Netlify Drop (5 minutos)

### **Opción 1: Drag & Drop (MÁS RÁPIDO)** ⭐

1. **Ir a Netlify Drop:**
   ```
   https://app.netlify.com/drop
   ```

2. **Arrastra la carpeta completa:**
   - Busca esta carpeta en Finder:
     ```
     /Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/formulario-inmueble
     ```
   - Arrastra la carpeta COMPLETA al área de Netlify Drop
   - ⚠️ Arrastra la CARPETA, no los archivos individuales

3. **Esperar deployment:**
   - Netlify sube todos los archivos automáticamente
   - Tarda 30-60 segundos
   - Te dará una URL temporal como: `https://random-name-123456.netlify.app`

4. **⚠️ IMPORTANTE - Configurar Variable de Entorno:**
   - Click en "Site settings"
   - Ir a "Environment variables"
   - Click "Add a variable"
   - Agregar:
     ```
     Key: GOOGLE_MAPS_API_KEY
     Value: AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk
     ```
   - Click "Save"
   - Volver a "Deploys" → "Trigger deploy" → "Deploy site"

5. **Cambiar nombre del sitio (opcional):**
   - Site settings → Domain management → Change site name
   - Nuevo nombre: `formulario-inmuebles-culiacan`
   - URL final: `https://formulario-inmuebles-culiacan.netlify.app`

6. **✅ LISTO - Probar:**
   ```
   https://formulario-inmuebles-culiacan.netlify.app
   ```

---

## 📋 MÉTODO 2: Netlify CLI (Avanzado)

### **Paso 1: Autenticar**
```bash
netlify login
```
- Se abre el navegador
- Autorizar Netlify
- Volver a la terminal

### **Paso 2: Deploy Inicial**
```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/formulario-inmueble"

netlify deploy
```

**Responder preguntas:**
- ❓ What would you like to do?
  → **+ Create & configure a new project**
- ❓ Team?
  → Seleccionar tu team
- ❓ Site name?
  → **formulario-inmuebles-culiacan**
- ❓ Publish directory?
  → **.** (punto - directorio actual)

**Resultado:**
```
✅ Draft deploy URL: https://unique-id--formulario-inmuebles-culiacan.netlify.app
```

### **Paso 3: Configurar Variable de Entorno**
```bash
netlify env:set GOOGLE_MAPS_API_KEY "AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk"
```

### **Paso 4: Deploy a Producción**
```bash
netlify deploy --prod
```

**Resultado:**
```
✅ Live URL: https://formulario-inmuebles-culiacan.netlify.app
```

---

## 🔧 MÉTODO 3: GitHub + Netlify (Automático)

### **Paso 1: Subir a GitHub**
```bash
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/formulario-inmueble"

git init
git add .
git commit -m "Initial commit: Formulario de valuación con geocodificación"

# Crear repo en GitHub primero: https://github.com/new
# Nombre: formulario-inmuebles-culiacan

git remote add origin https://github.com/TU_USUARIO/formulario-inmuebles-culiacan.git
git branch -M main
git push -u origin main
```

### **Paso 2: Conectar con Netlify**
1. Ir a https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Seleccionar "GitHub"
4. Buscar repo: `formulario-inmuebles-culiacan`
5. Configurar:
   ```
   Build command: (dejar vacío)
   Publish directory: .
   Functions directory: api
   ```
6. Click "Deploy site"

### **Paso 3: Configurar Variable de Entorno**
1. Site settings → Environment variables
2. Add variable:
   ```
   Key: GOOGLE_MAPS_API_KEY
   Value: AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk
   ```
3. Save
4. Deploys → Trigger deploy → Deploy site

---

## ✅ Verificación Post-Deployment

### **Test 1: Página Principal**
```
https://formulario-inmuebles-culiacan.netlify.app
```
- ✅ Formulario carga correctamente
- ✅ Estilos se ven bien
- ✅ Autocomplete de colonias funciona

### **Test 2: Backend Proxy**
Abrir consola del navegador (F12):
```javascript
fetch('/.netlify/functions/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        address: 'Calle Ébano 2609, Privanzas Natura, 80000, Culiacán, Sinaloa, México'
    })
})
.then(r => r.json())
.then(console.log);

// Debe retornar: { status: "OK", results: [...] }
```

### **Test 3: Geocodificación Completa**
1. Llenar formulario:
   - Colonia: "Privanzas Natura"
   - Calle: "Calle Ébano"
   - Número: "2609"
2. Enviar formulario
3. Verificar en consola:
   ```
   ✅ Coordenadas obtenidas con Google Maps (vía proxy seguro)
   ```

---

## 🔒 Restricciones de API Key (IMPORTANTE)

Después de publicar, configurar restricciones en Google Cloud:

1. Ir a https://console.cloud.google.com/apis/credentials
2. Seleccionar API key: `AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk`
3. Edit → Application restrictions
4. Agregar:
   ```
   https://formulario-inmuebles-culiacan.netlify.app/*
   http://localhost:8080/*
   ```
5. API restrictions → Restrict key
6. Seleccionar: **Geocoding API** solamente
7. Save

---

## 📱 URLs Finales

### **Producción:**
```
🌐 https://formulario-inmuebles-culiacan.netlify.app
📄 https://formulario-inmuebles-culiacan.netlify.app/test-geocoding.html
🔧 https://formulario-inmuebles-culiacan.netlify.app/.netlify/functions/geocode
```

### **Dashboard Netlify:**
```
📊 https://app.netlify.com/sites/formulario-inmuebles-culiacan
```

---

## 🎉 Resultado Final

```
✅ Formulario publicado en línea
✅ HTTPS seguro (certificado SSL automático)
✅ API key protegida (backend proxy funcionando)
✅ Geocodificación con Google Maps activa
✅ Autocomplete de 631 colonias
✅ Autocomplete de 6,438 calles
✅ Responsive (móvil + desktop)
✅ 100% GRATIS (Netlify plan gratuito)

🌐 URL: https://formulario-inmuebles-culiacan.netlify.app
💰 Costo: $0 USD/mes
```

---

**Última actualización:** Octubre 2025
**Método recomendado:** Netlify Drop (drag & drop)
**Tiempo estimado:** 5 minutos
