# 🎯 PASOS FINALES - Configuración Google Sheets + Email

## ✅ LO QUE YA ESTÁ LISTO

### Backend Netlify Functions (100% Completo):
1. ✅ **api/submit-form.js** - Recibe datos del formulario y los envía a Google Sheets
2. ✅ **api/geocode.js** - Proxy para Google Maps API (oculta API key)
3. ✅ **js/app.js** - Frontend actualizado para enviar a `/.netlify/functions/submit-form`

### Código Google Apps Script (100% Completo):
1. ✅ **google-apps-script/Code.gs** - Script completo listo para copiar y pegar

---

## 🚀 PASOS QUE DEBES COMPLETAR (30 MINUTOS)

### **PASO 1: Crear Google Sheet** (5 minutos)

1. **Ir a Google Sheets:**
   ```
   https://sheets.google.com/create
   ```

2. **Nombrar la hoja:**
   - Click en "Hoja de cálculo sin título"
   - Cambiar a: **"Formulario Inmuebles - Cotizaciones"**

3. **Agregar encabezados (Fila 1):**

   Copia y pega estos encabezados en la fila 1 (columnas A-X):

   ```
   Fecha	Tipo Propiedad	Antigüedad	M² Terreno	M² Construcción	Recámaras	Baños	Estacionamientos	Niveles	Calle	Número	Colonia	CP	Latitud	Longitud	Luz	Agua	Drenaje	Internet	Nombre	Teléfono	Email	Timestamp	User Agent
   ```

4. **Copiar URL de la hoja:**
   - Copiar URL completa de la barra del navegador
   - Ejemplo: `https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit`
   - **Guardar esta URL** - la necesitarás para el paso 6

---

### **PASO 2: Abrir Apps Script Editor** (2 minutos)

1. **En tu Google Sheet, ir a:**
   ```
   Extensiones → Apps Script
   ```

2. **Se abrirá el editor de código**
   - Verás un archivo llamado "Code.gs"
   - Tiene código de ejemplo (borrar todo)

---

### **PASO 3: Pegar el Código** (3 minutos)

1. **Abrir el archivo que creé:**
   ```
   google-apps-script/Code.gs
   ```
   (Está en la carpeta del formulario)

2. **Copiar TODO el contenido del archivo**
   - Desde la línea 1 hasta el final (300+ líneas)

3. **Pegar en el editor de Apps Script**
   - Seleccionar todo el código de ejemplo (Cmd+A)
   - Borrar (Backspace)
   - Pegar el código nuevo (Cmd+V)

4. **⚠️ CAMBIAR TU EMAIL (LÍNEA 12):**

   Buscar esta línea:
   ```javascript
   const EMAIL_DESTINO = 'tu-email@gmail.com';
   ```

   Cambiar a tu email real:
   ```javascript
   const EMAIL_DESTINO = 'hector@example.com';  // ← TU EMAIL AQUÍ
   ```

5. **Guardar (💾):**
   - Click en icono de disco (💾)
   - O: Cmd+S (Mac) / Ctrl+S (Windows)

---

### **PASO 4: Implementar como Web App** (5 minutos)

1. **Click en "Implementar" (esquina superior derecha)**
   - Seleccionar: **"Nueva implementación"**

2. **Configurar implementación:**

   **Tipo:**
   - Click en icono de engranaje ⚙️
   - Seleccionar: **"Aplicación web"**

   **Descripción (opcional):**
   - "API para formulario inmuebles"

   **Ejecutar como:**
   - Seleccionar: **"Yo (tu-email@gmail.com)"**

   **Quién tiene acceso:**
   - Seleccionar: **"Cualquier usuario"** ⚠️ IMPORTANTE

3. **Click en "Implementar"**

4. **Autorizar permisos:**

   Se abrirá una ventana pidiendo permisos:

   a. Click en **"Revisar permisos"**

   b. Seleccionar tu cuenta de Google

   c. **Advertencia de seguridad** (puede aparecer):
      - Click en "Configuración avanzada"
      - Click en "Ir a [nombre del proyecto] (no seguro)"
      - Esto es NORMAL - es tu propio script

   d. **Otorgar permisos:**
      - ✅ Ver, editar, crear y borrar todas tus hojas de cálculo
      - ✅ Enviar emails en tu nombre
      - Click en **"Permitir"**

5. **Copiar URL del Web App:**

   Después de autorizar, verás:
   ```
   ✅ Implementación exitosa

   URL de la aplicación web:
   https://script.google.com/macros/s/ABC123.../exec
   ```

   **⚠️ COPIAR ESTA URL COMPLETA** - La necesitas para el siguiente paso

---

### **PASO 5: Configurar Variable de Entorno en Netlify** (5 minutos)

1. **Ir al dashboard de Netlify:**
   ```
   https://app.netlify.com/sites/ubicacioncotizar/configuration/env
   ```
   (O navegar: Sites → ubicacioncotizar → Site settings → Environment variables)

2. **Agregar nueva variable:**

   - Click en **"Add a variable"** o **"Add environment variable"**

   - **Key (Clave):**
     ```
     GOOGLE_SCRIPT_URL
     ```

   - **Value (Valor):**
     ```
     https://script.google.com/macros/s/ABC123.../exec
     ```
     (La URL que copiaste en el paso anterior)

   - Click **"Save"**

3. **Verificar que las 2 variables estén configuradas:**
   ```
   ✅ GOOGLE_MAPS_API_KEY    (ya configurada)
   ✅ GOOGLE_SCRIPT_URL       (recién agregada)
   ```

---

### **PASO 6: Re-deploy del Sitio** (3 minutos)

1. **Ir a la pestaña "Deploys":**
   ```
   https://app.netlify.com/sites/ubicacioncotizar/deploys
   ```

2. **Hacer re-deploy:**
   - Click en **"Trigger deploy"** (botón arriba a la derecha)
   - Seleccionar: **"Deploy site"**

3. **Esperar 30-60 segundos**
   - Verás "Building..." → "Published"
   - ✅ Cuando diga "Published", está listo

---

### **PASO 7: Probar Todo el Sistema** (7 minutos)

#### Test 1: Formulario Completo

1. **Ir al formulario:**
   ```
   https://ubicacioncotizar.netlify.app/
   ```

2. **Llenar todos los pasos:**
   - Paso 1: Seleccionar "Casa" y "Menos de 5 años"
   - Paso 2: Llenar m² (ej: 150 terreno, 120 construcción)
   - Paso 3: Características (3 recámaras, 2 baños, etc.)
   - Paso 4: Ubicación con autocomplete
     - Escribir "Privanzas" → seleccionar "Privanzas Natura"
     - Escribir "Ébano" → seleccionar una calle
     - Número: 2609
     - CP: 80000
   - Paso 5: Luz, agua, drenaje, internet (seleccionar "Sí")
   - Paso 6: Tus datos (nombre, teléfono, email)

3. **Click en "Enviar Cotización"**

4. **Verificar éxito:**
   - Debe aparecer mensaje: "✅ Formulario enviado exitosamente"
   - NO debe aparecer error

#### Test 2: Verificar Google Sheets

1. **Abrir tu Google Sheet**
   ```
   https://docs.google.com/spreadsheets/d/...
   ```

2. **Verificar datos:**
   - Debe haber una nueva fila (fila 2)
   - Debe tener todos los datos que llenaste
   - Columna A: Fecha actual
   - Columnas B-X: Todos tus datos

#### Test 3: Verificar Email

1. **Abrir tu bandeja de entrada**
   - Gmail, Outlook, etc.

2. **Buscar email nuevo:**
   - **Asunto:** "🏠 Nueva Cotización - Casa en Privanzas Natura"
   - **De:** tu-email@gmail.com (enviado por ti mismo)

3. **Verificar contenido:**
   - Debe tener todos los datos del formulario
   - Formato HTML bonito con secciones
   - Botón "Ver en Google Maps" (si hay coordenadas)

---

## 🎉 SI TODO FUNCIONÓ

**¡FELICIDADES! El sistema está 100% operativo:**

✅ Formulario publicado en: https://ubicacioncotizar.netlify.app/
✅ Datos se guardan en Google Sheets automáticamente
✅ Recibes email automático en cada envío
✅ Geocodificación funcionando (coordenadas GPS)
✅ Autocomplete de 631 colonias funcionando
✅ Autocomplete de 6,438 calles funcionando
✅ 100% gratis e ilimitado

---

## ❌ SI ALGO FALLÓ - TROUBLESHOOTING

### Error: "Error al enviar formulario"

**Posibles causas:**

1. **GOOGLE_SCRIPT_URL mal configurada:**
   - Verificar que copiaste la URL completa de Apps Script
   - Debe terminar en `/exec`
   - Verificar que hiciste re-deploy después de agregar la variable

2. **Apps Script no implementado correctamente:**
   - Volver al editor de Apps Script
   - Verificar que esté "Implementado como aplicación web"
   - Verificar acceso: "Cualquier usuario"

3. **Permisos de Apps Script no otorgados:**
   - Ir a: https://script.google.com/home
   - Buscar tu proyecto
   - Click en 3 puntos → "Implementaciones"
   - Verificar que existe una implementación activa

### Error: Email no llega

**Posibles causas:**

1. **Email destino incorrecto:**
   - Abrir Apps Script
   - Verificar línea 12: `const EMAIL_DESTINO = 'tu-email@gmail.com';`
   - Debe tener tu email correcto

2. **Email en spam:**
   - Revisar carpeta de spam/correo no deseado
   - El email viene de tu propia cuenta, puede parecer sospechoso

3. **Error en función de email:**
   - Abrir Apps Script
   - Ir a "Ejecuciones" (en menú izquierdo)
   - Verificar si hay errores
   - Si hay errores, revisar logs

### Datos no aparecen en Google Sheets

**Posibles causas:**

1. **Nombre de hoja incorrecto:**
   - Apps Script busca hoja llamada "Hoja 1"
   - Verificar que tu hoja se llame exactamente "Hoja 1" (con espacio)
   - O cambiar línea 15 en Apps Script: `const NOMBRE_HOJA = 'Tu Nombre';`

2. **Error en función doPost:**
   - Abrir Apps Script
   - Click en "Ejecuciones"
   - Revisar logs de errores

---

## 📞 SOPORTE ADICIONAL

### Archivos de Documentación:

1. **GOOGLE-SHEETS-SETUP.md** - Guía detallada completa (400+ líneas)
2. **CONFIGURACION-FINAL.md** - Configuración inicial del sitio
3. **GEOCODING-README.md** - Sistema de geocodificación
4. **README.md** - Documentación general del formulario

### Comandos Útiles:

**Revisar logs de Netlify Functions:**
```
https://app.netlify.com/sites/ubicacioncotizar/functions
```
Click en "submit-form" → Ver logs en tiempo real

**Probar función manualmente:**
```javascript
// Abrir consola del navegador (F12) en:
// https://ubicacioncotizar.netlify.app/

fetch('/.netlify/functions/submit-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        tipoPropiedad: 'Casa',
        nombre: 'Test',
        telefono: '1234567890',
        email: 'test@test.com'
    })
})
.then(r => r.json())
.then(console.log);
```

---

## ✅ CHECKLIST FINAL

Marca cada paso al completarlo:

- [ ] Google Sheet creada con 24 columnas
- [ ] Apps Script pegado y guardado
- [ ] Email destino actualizado (línea 12)
- [ ] Apps Script implementado como Web App
- [ ] Permisos otorgados (Sheets + Email)
- [ ] URL del Web App copiada
- [ ] Variable GOOGLE_SCRIPT_URL agregada en Netlify
- [ ] Re-deploy realizado
- [ ] Formulario probado (test completo)
- [ ] Datos aparecen en Google Sheet
- [ ] Email recibido correctamente

---

**Última actualización:** Octubre 2025
**Estado:** ✅ Backend completo - Listo para configurar
**Tiempo estimado:** 30 minutos

**¡Mucha suerte con la configuración! 🚀**
