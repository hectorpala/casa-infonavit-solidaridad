# 🔴 PROBLEMA ACTUAL - Google Apps Script No Accesible

## 📋 RESUMEN DEL PROBLEMA

Tenemos un formulario web en Netlify que necesita enviar datos a Google Sheets usando Google Apps Script, pero el script NO es accesible públicamente.

---

## 🏗️ ARQUITECTURA ACTUAL

```
Formulario Web (Netlify)
    ↓
Netlify Function (submit-form.js)
    ↓
Google Apps Script Web App
    ↓
Google Sheets + Email
```

---

## ❌ ERROR ACTUAL

Cuando hacemos POST al Google Apps Script:

```bash
curl -X POST "https://script.google.com/macros/s/AKfycbwOAjPIgzuPCmhOuw6VzLs_9re4b8s99KVRmw-LxUb2sXt2Bi0DtqE0A227KWSMFTkfbg/exec" \
  -H "Content-Type: application/json" \
  -d '{"tipoPropiedad":"Casa"}'
```

**Respuesta:**
```html
<!DOCTYPE html>
<html lang="es">
<head>
<title>No se encontró la página</title>
</head>
<body>
<p class="errorMessage">No se pudo abrir el archivo en este momento.</p>
<p>Verifica la dirección e inténtalo de nuevo.</p>
</body>
</html>
```

**Error HTTP:** 404 Not Found (o redirección)

**Error en Netlify Function:** Status 500

---

## ✅ LO QUE YA HICIMOS

1. ✅ **Creamos Google Apps Script** con función `doPost(e)`
2. ✅ **Implementamos como Web App** (2 veces)
   - Versión 1: `AKfycbx4ENxsDC5xHY2v_OoXNmcdP9dUTV5Z3PbZGdcdSCRuJT8_bmTeaRDc8fRR4qHa_VHZ4g`
   - Versión 2: `AKfycbwOAjPIgzuPCmhOuw6VzLs_9re4b8s99KVRmw-LxUb2sXt2Bi0DtqE0A227KWSMFTkfbg` (ACTUAL)
3. ✅ **Configuramos implementación:**
   - Ejecutar como: "Yo (hector.palazuelos@gmail.com)"
   - Usuarios con acceso: "Cualquiera"
4. ✅ **Autorizamos permisos:**
   - Google Sheets (lectura/escritura)
   - Gmail (enviar emails)
5. ✅ **Configuramos variable en Netlify:**
   - `GOOGLE_SCRIPT_URL` = URL del script

---

## 🔍 SÍNTOMAS

1. **Navegador del formulario:**
   - Error 500 al enviar formulario
   - Console: `Failed to load resource: the server responded with a status of 500`

2. **Curl directo al script:**
   - Respuesta: HTML de "No se encontró la página"
   - NO ejecuta la función `doPost(e)`

3. **Primera versión del script:**
   - Redirigía (HTTP 302)
   - Tampoco funcionaba

---

## 🤔 POSIBLES CAUSAS

1. **Permisos incorrectos:**
   - Puede que "Cualquiera" no sea suficiente
   - Necesitamos "Anyone, even anonymous"?

2. **Script no desplegado correctamente:**
   - La URL no apunta a la función correcta
   - Falta algún paso en el deployment

3. **Proyecto de Google Cloud:**
   - El script está usando proyecto incorrecto
   - Faltan permisos en GCP

4. **Método HTTP:**
   - El script no está configurado para recibir POST
   - Falta cabecera `Content-Type`

---

## 📄 CÓDIGO DEL GOOGLE APPS SCRIPT

```javascript
// ⚠️ CAMBIAR ESTE EMAIL POR EL TUYO ⚠️
const EMAIL_DESTINO = 'hector.palazuelos@gmail.com';

// Nombre de la hoja donde se guardarán los datos
const NOMBRE_HOJA = 'Hoja 1';

/**
 * Función principal que recibe datos del formulario (POST)
 * Se ejecuta automáticamente cuando Netlify envía los datos
 */
function doPost(e) {
  try {
    // Parsear datos JSON del formulario
    const data = JSON.parse(e.postData.contents);

    console.log('📥 Datos recibidos:', data);

    // Guardar en Google Sheets
    guardarEnSheet(data);

    // Enviar email de notificación
    enviarEmailNotificacion(data);

    // Retornar éxito
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Datos guardados y email enviado exitosamente'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('❌ Error en doPost:', error);

    // Retornar error
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function guardarEnSheet(data) { /* ... */ }
function enviarEmailNotificacion(data) { /* ... */ }
```

---

## 🎯 LO QUE NECESITAMOS

**Hacer que el Google Apps Script sea ACCESIBLE PÚBLICAMENTE para recibir POST requests desde Netlify.**

---

## 🔗 URLS IMPORTANTES

- **Formulario:** https://ubicacioncotizar.netlify.app/
- **Netlify Function:** https://ubicacioncotizar.netlify.app/.netlify/functions/submit-form
- **Google Apps Script (V2):** https://script.google.com/macros/s/AKfycbwOAjPIgzuPCmhOuw6VzLs_9re4b8s99KVRmw-LxUb2sXt2Bi0DtqE0A227KWSMFTkfbg/exec
- **Google Apps Script Home:** https://script.google.com/home

---

## ❓ PREGUNTAS PARA CHATGPT

1. **¿Qué configuración exacta necesitamos en "Usuarios con acceso"?**
   - ¿"Cualquiera" es suficiente?
   - ¿Necesitamos "Anyone, even anonymous"?

2. **¿Hay algún paso adicional para hacer el script público?**
   - ¿Configuración de Google Cloud Platform?
   - ¿Permisos adicionales?

3. **¿La URL del script es correcta?**
   - ¿Debería terminar en `/exec`?
   - ¿Hay alguna forma de verificar que esté desplegado?

4. **¿Cómo verificamos que el script está accesible públicamente?**
   - ¿Algún comando curl específico?
   - ¿Alguna herramienta para probar?

---

## 📊 INFORMACIÓN ADICIONAL

- **Google Account:** hector.palazuelos@gmail.com
- **Google Sheet:** "Formulario Inmuebles - Cotizaciones"
- **Netlify Site:** ubicacioncotizar.netlify.app
- **Tiempo intentando:** 2+ horas
- **Implementaciones intentadas:** 2

---

## 🆘 AYUDA URGENTE NECESARIA

Por favor ayúdanos a:
1. Identificar el problema exacto
2. Proveer pasos específicos para solucionarlo
3. Verificar que el script quede accesible públicamente

**¡Gracias!**
