# 📊 Configuración Google Sheets + Email Automático

## 🎯 Resumen

Esta guía te mostrará cómo configurar Google Sheets para recibir los datos del formulario y enviar emails automáticos cada vez que alguien lo complete.

**Tiempo estimado:** 20-30 minutos
**Costo:** $0 USD (100% gratis e ilimitado)

---

## 📋 PASO 1: Crear Google Sheet

### **1.1 Crear la hoja de cálculo:**

1. Ir a https://sheets.google.com
2. Click en **"Blank"** (Hoja en blanco)
3. Nombrar la hoja: **"Formulario Valuación Inmuebles"**

### **1.2 Configurar encabezados (Primera fila):**

Copia y pega estos encabezados en la fila 1:

```
A1: Fecha
B1: Hora
C1: Estado
D1: Municipio
E1: Colonia
F1: Calle
G1: Número Exterior
H1: Número Interior
I1: Código Postal
J1: Tipo de Inmueble
K1: Recámaras
L1: Baños
M1: Estacionamientos
N1: Metros² Construcción
O1: Metros² Terreno
P1: Antigüedad
Q1: Nombre Completo
R1: Email
S1: Teléfono
T1: Comentarios
U1: Latitud
V1: Longitud
W1: Precisión GPS
X1: Servicio GPS
```

### **1.3 Dar formato a los encabezados:**

- Selecciona la fila 1 completa
- **Negrita** (Cmd+B o Ctrl+B)
- **Color de fondo:** Azul claro
- **Congelar fila:** View → Freeze → 1 row

---

## 📧 PASO 2: Crear Google Apps Script

### **2.1 Abrir el editor de scripts:**

1. En tu Google Sheet, ir a **Extensions** → **Apps Script**
2. Se abrirá una nueva pestaña con el editor
3. Verás un archivo llamado `Code.gs`

### **2.2 Reemplazar el código:**

Borra todo el código que aparece y pega este:

\`\`\`javascript
// ==========================================
// CONFIGURACIÓN - EDITAR ESTAS VARIABLES
// ==========================================

// Tu email donde recibirás las notificaciones
const EMAIL_DESTINO = 'tu-email@gmail.com'; // ⚠️ CAMBIAR ESTO

// Nombre de la hoja donde se guardarán los datos
const NOMBRE_HOJA = 'Hoja 1';

// ==========================================
// FUNCIÓN PRINCIPAL - NO EDITAR
// ==========================================

function doPost(e) {
  try {
    // Parsear datos recibidos
    const data = JSON.parse(e.postData.contents);

    // Guardar en Google Sheets
    guardarEnSheet(data);

    // Enviar email de notificación
    enviarEmailNotificacion(data);

    // Retornar éxito
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Datos guardados y email enviado'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log del error
    console.error('Error en doPost:', error);

    // Retornar error
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function guardarEnSheet(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);

  if (!sheet) {
    throw new Error(\`Hoja "\${NOMBRE_HOJA}" no encontrada\`);
  }

  // Preparar datos en el orden correcto
  const fecha = new Date();
  const fila = [
    // Fecha y hora
    Utilities.formatDate(fecha, 'America/Mexico_City', 'yyyy-MM-dd'),
    Utilities.formatDate(fecha, 'America/Mexico_City', 'HH:mm:ss'),

    // Ubicación
    data.estado || '',
    data.municipio || '',
    data.colonia || '',
    data.calle || '',
    data.numeroExterior || '',
    data.numeroInterior || '',
    data.codigoPostal || '',

    // Características
    data.tipoInmueble || '',
    data.recamaras || '',
    data.banos || '',
    data.estacionamientos || '',
    data.metrosConstruccion || '',
    data.metrosTerreno || '',
    data.antiguedad || '',

    // Contacto
    data.nombreCompleto || '',
    data.email || '',
    data.telefono || '',
    data.comentarios || '',

    // Coordenadas GPS
    data.coordinates?.latitude || '',
    data.coordinates?.longitude || '',
    data.coordinates?.accuracy || '',
    data.coordinates?.service || ''
  ];

  // Agregar fila
  sheet.appendRow(fila);

  console.log('✅ Datos guardados en Sheet');
}

function enviarEmailNotificacion(data) {
  const asunto = \`🏠 Nuevo Formulario de Valuación - \${data.colonia || 'Sin colonia'}\`;

  const cuerpo = \`
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2A9D8F; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 16px; font-weight: bold; color: #2A9D8F; margin-bottom: 10px; border-bottom: 2px solid #2A9D8F; padding-bottom: 5px; }
    .field { margin: 8px 0; }
    .label { font-weight: bold; color: #555; }
    .value { color: #333; }
    .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    .map-link { display: inline-block; background: #E76F51; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">🏠 Nueva Solicitud de Valuación</h2>
      <p style="margin: 5px 0 0 0;">Formulario recibido el \${new Date().toLocaleString('es-MX')}</p>
    </div>

    <div class="content">
      <!-- Ubicación -->
      <div class="section">
        <div class="section-title">📍 Ubicación</div>
        <div class="field"><span class="label">Estado:</span> <span class="value">\${data.estado || 'N/A'}</span></div>
        <div class="field"><span class="label">Municipio:</span> <span class="value">\${data.municipio || 'N/A'}</span></div>
        <div class="field"><span class="label">Colonia:</span> <span class="value">\${data.colonia || 'N/A'}</span></div>
        <div class="field"><span class="label">Calle:</span> <span class="value">\${data.calle || 'N/A'}</span></div>
        <div class="field"><span class="label">Número:</span> <span class="value">\${data.numeroExterior || 'N/A'}\${data.numeroInterior ? \` Int. \${data.numeroInterior}\` : ''}</span></div>
        <div class="field"><span class="label">Código Postal:</span> <span class="value">\${data.codigoPostal || 'N/A'}</span></div>
      </div>

      <!-- Características -->
      <div class="section">
        <div class="section-title">🏡 Características del Inmueble</div>
        <div class="field"><span class="label">Tipo:</span> <span class="value">\${data.tipoInmueble || 'N/A'}</span></div>
        <div class="field"><span class="label">Recámaras:</span> <span class="value">\${data.recamaras || 'N/A'}</span></div>
        <div class="field"><span class="label">Baños:</span> <span class="value">\${data.banos || 'N/A'}</span></div>
        <div class="field"><span class="label">Estacionamientos:</span> <span class="value">\${data.estacionamientos || 'N/A'}</span></div>
        <div class="field"><span class="label">Metros² Construcción:</span> <span class="value">\${data.metrosConstruccion || 'N/A'} m²</span></div>
        <div class="field"><span class="label">Metros² Terreno:</span> <span class="value">\${data.metrosTerreno || 'N/A'} m²</span></div>
        <div class="field"><span class="label">Antigüedad:</span> <span class="value">\${data.antiguedad || 'N/A'}</span></div>
      </div>

      <!-- Datos de Contacto -->
      <div class="section">
        <div class="section-title">👤 Datos de Contacto</div>
        <div class="field"><span class="label">Nombre:</span> <span class="value">\${data.nombreCompleto || 'N/A'}</span></div>
        <div class="field"><span class="label">Email:</span> <span class="value"><a href="mailto:\${data.email}">\${data.email || 'N/A'}</a></span></div>
        <div class="field"><span class="label">Teléfono:</span> <span class="value"><a href="tel:\${data.telefono}">\${data.telefono || 'N/A'}</a></span></div>
        \${data.comentarios ? \`<div class="field"><span class="label">Comentarios:</span><br><span class="value">\${data.comentarios}</span></div>\` : ''}
      </div>

      <!-- Coordenadas GPS -->
      \${data.coordinates ? \`
      <div class="section">
        <div class="section-title">🗺️ Ubicación GPS</div>
        <div class="field"><span class="label">Latitud:</span> <span class="value">\${data.coordinates.latitude}</span></div>
        <div class="field"><span class="label">Longitud:</span> <span class="value">\${data.coordinates.longitude}</span></div>
        <div class="field"><span class="label">Precisión:</span> <span class="value">\${data.coordinates.accuracy}</span></div>
        <div class="field"><span class="label">Servicio:</span> <span class="value">\${data.coordinates.service}</span></div>
        <a href="https://www.google.com/maps?q=\${data.coordinates.latitude},\${data.coordinates.longitude}" class="map-link" target="_blank">📍 Ver en Google Maps</a>
      </div>
      \` : ''}
    </div>

    <div class="footer">
      <p>Este email fue generado automáticamente por el formulario de valuación de inmuebles.</p>
      <p><a href="https://ubicacioncotizar.netlify.app">https://ubicacioncotizar.netlify.app</a></p>
    </div>
  </div>
</body>
</html>
  \`;

  // Enviar email
  MailApp.sendEmail({
    to: EMAIL_DESTINO,
    subject: asunto,
    htmlBody: cuerpo
  });

  console.log(\`✅ Email enviado a \${EMAIL_DESTINO}\`);
}

// Función de prueba (opcional)
function testEmail() {
  const dataTest = {
    estado: 'Sinaloa',
    municipio: 'Culiacán',
    colonia: 'Privanzas Natura',
    calle: 'Calle Ébano',
    numeroExterior: '2609',
    numeroInterior: '5',
    codigoPostal: '80000',
    tipoInmueble: 'Casa',
    recamaras: '3',
    banos: '2',
    estacionamientos: '2',
    metrosConstruccion: '180',
    metrosTerreno: '200',
    antiguedad: '5-10 años',
    nombreCompleto: 'Juan Pérez',
    email: 'juan.perez@example.com',
    telefono: '6671234567',
    comentarios: 'Esto es una prueba del formulario',
    coordinates: {
      latitude: 24.8091,
      longitude: -107.3940,
      accuracy: 'Exacta',
      service: 'Google Maps'
    }
  };

  enviarEmailNotificacion(dataTest);
  Logger.log('✅ Email de prueba enviado');
}
\`\`\`

### **2.3 Configurar tu email:**

**⚠️ IMPORTANTE:** En la línea 6 del código, cambiar:

\`\`\`javascript
const EMAIL_DESTINO = 'tu-email@gmail.com'; // ⚠️ CAMBIAR ESTO
\`\`\`

Por tu email real, por ejemplo:

\`\`\`javascript
const EMAIL_DESTINO = 'hector@casasenventa.info';
\`\`\`

### **2.4 Guardar el script:**

- Click en el ícono de **"Guardar"** (💾) o presiona Cmd+S / Ctrl+S
- Nombra el proyecto: **"Formulario Valuación - Backend"**

---

## 🚀 PASO 3: Publicar el Script como Web App

### **3.1 Desplegar:**

1. En el editor de Apps Script, click en **"Deploy"** → **"New deployment"**
2. Click en el ícono de engranaje ⚙️ junto a "Select type"
3. Seleccionar **"Web app"**

### **3.2 Configurar el deployment:**

- **Description:** "Formulario Valuación API"
- **Execute as:** **Me** (tu cuenta)
- **Who has access:** **Anyone** ⚠️ IMPORTANTE

### **3.3 Autorizar:**

1. Click **"Deploy"**
2. Te pedirá autorización → Click **"Authorize access"**
3. Selecciona tu cuenta de Google
4. Si aparece "Google hasn't verified this app":
   - Click **"Advanced"**
   - Click **"Go to [Nombre del Proyecto] (unsafe)"**
   - Es seguro porque TÚ creaste el script
5. Click **"Allow"** para dar permisos

### **3.4 Copiar la URL:**

Después de autorizar, verás una pantalla con:

\`\`\`
Web app URL: https://script.google.com/macros/s/AKfy...Hg/exec
\`\`\`

**⚠️ COPIA ESTA URL COMPLETA** - La necesitarás en el siguiente paso.

---

## 🔧 PASO 4: Configurar Variable de Entorno en Netlify

### **4.1 Ir a configuración:**

1. Abrir https://app.netlify.com/sites/ubicacioncotizar/configuration/env
2. Click en **"Add a variable"**

### **4.2 Agregar la URL del script:**

\`\`\`
Key:   GOOGLE_SCRIPT_URL
Value: https://script.google.com/macros/s/AKfy...Hg/exec
\`\`\`

(Pega la URL completa que copiaste en el paso 3.4)

### **4.3 Guardar:**

- Click **"Create variable"**
- La variable se guardará automáticamente

---

## 🔄 PASO 5: Re-Deployar el Sitio

### **5.1 Hacer re-deploy:**

1. Ir a https://app.netlify.com/sites/ubicacioncotizar/deploys
2. Arrastra la carpeta `formulario-inmueble` de nuevo al área de upload
3. Esperar 30-60 segundos hasta que diga "Published"

---

## ✅ PASO 6: Probar el Sistema

### **6.1 Llenar el formulario:**

1. Ir a https://ubicacioncotizar.netlify.app/
2. Llenar todos los campos del formulario
3. Click en "Enviar Formulario"
4. Deberías ver mensaje de éxito

### **6.2 Verificar Google Sheets:**

1. Abrir tu Google Sheet
2. Deberías ver una nueva fila con los datos

### **6.3 Verificar Email:**

1. Revisar tu bandeja de entrada
2. Deberías tener un email con el título: **"🏠 Nuevo Formulario de Valuación"**

---

## 🐛 Troubleshooting

### **Problema: No llega el email**

**Soluciones:**
1. Revisar carpeta de SPAM
2. Verificar que el email en `EMAIL_DESTINO` sea correcto
3. Ejecutar función de prueba:
   - En Apps Script, ir a **"Select function"** → **"testEmail"**
   - Click **"Run"**
   - Verificar que llegue el email de prueba

### **Problema: No se guardan los datos en Sheet**

**Soluciones:**
1. Verificar que el nombre de la hoja sea **"Hoja 1"** (o cambiar `NOMBRE_HOJA` en el script)
2. Verificar que los encabezados estén en la fila 1
3. Ver logs en Apps Script:
   - **"Executions"** (menú izquierdo)
   - Revisar errores

### **Problema: Error 403 o 401**

**Causa:** Permisos incorrectos

**Solución:**
1. En Apps Script, ir a **"Deploy"** → **"Manage deployments"**
2. Click en el ícono de lápiz ✏️
3. Verificar **"Who has access" = Anyone**
4. Click **"Deploy"**

---

## 📊 Resultado Final

### **✅ Lo que tendrás:**

\`\`\`
📧 Email automático con cada formulario
📊 Todos los datos en Google Sheets
🗺️ Coordenadas GPS incluidas
📱 Link directo a Google Maps
💰 100% Gratis e ilimitado
\`\`\`

### **📧 Formato del Email:**

Recibirás un email HTML con:
- ✅ Sección de ubicación
- ✅ Características del inmueble
- ✅ Datos de contacto clickeables
- ✅ Coordenadas GPS con botón "Ver en Google Maps"
- ✅ Diseño profesional y responsive

---

## 📞 Soporte

Si tienes problemas durante la configuración, revisa:
1. Los logs en Google Apps Script (Executions)
2. Los logs en Netlify Functions (Functions tab)
3. La consola del navegador (F12) al enviar el formulario

---

**Última actualización:** Octubre 2025
**Tiempo estimado:** 20-30 minutos
**Costo:** $0 USD (gratis e ilimitado)
