/**
 * GOOGLE APPS SCRIPT - Recibir datos del formulario y enviar emails
 *
 * INSTRUCCIONES:
 * 1. Abrir Google Sheets donde quieres guardar los datos
 * 2. Ir a: Extensiones → Apps Script
 * 3. Pegar todo este código
 * 4. CAMBIAR el email en la línea 12
 * 5. Guardar (💾)
 * 6. Implementar → Nueva implementación → Aplicación web
 * 7. Copiar URL y agregarla a Netlify como GOOGLE_SCRIPT_URL
 */

// ⚠️ CAMBIAR ESTE EMAIL POR EL TUYO ⚠️
const EMAIL_DESTINO = 'tu-email@gmail.com';

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

/**
 * Guardar datos en Google Sheets
 */
function guardarEnSheet(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);

    if (!sheet) {
      throw new Error(`No se encontró la hoja "${NOMBRE_HOJA}"`);
    }

    // Preparar fila con todos los datos
    const fecha = new Date();

    const fila = [
      // Columna A: Timestamp
      fecha,

      // Columnas B-E: Datos de la propiedad
      data.tipoPropiedad || '',
      data.antiguedad || '',
      data.m2_terreno || '',
      data.m2_construccion || '',

      // Columnas F-I: Características
      data.recamaras || '',
      data.banos || '',
      data.estacionamientos || '',
      data.niveles || '',

      // Columnas J-M: Ubicación
      data.calle || '',
      data.numero || '',
      data.colonia || '',
      data.codigoPostal || '',

      // Columnas N-O: Coordenadas GPS
      data.latitud || '',
      data.longitud || '',

      // Columnas P-S: Instalaciones
      data.luz || '',
      data.agua || '',
      data.drenaje || '',
      data.internet || '',

      // Columnas T-V: Datos del contacto
      data.nombre || '',
      data.telefono || '',
      data.email || '',

      // Columnas W-X: Metadata
      data.timestamp || fecha.toISOString(),
      data.userAgent || ''
    ];

    // Agregar fila al final de la hoja
    sheet.appendRow(fila);

    console.log('✅ Datos guardados en Sheet');

  } catch (error) {
    console.error('❌ Error al guardar en Sheet:', error);
    throw error;
  }
}

/**
 * Enviar email de notificación
 */
function enviarEmailNotificacion(data) {
  try {
    // Crear URL de Google Maps con las coordenadas
    const mapsUrl = data.latitud && data.longitud
      ? `https://www.google.com/maps?q=${data.latitud},${data.longitud}`
      : 'No disponible';

    // Crear dirección completa
    const direccionCompleta = [
      data.calle,
      data.numero,
      data.colonia,
      'Culiacán, Sinaloa',
      data.codigoPostal
    ].filter(Boolean).join(', ');

    // Construir mensaje HTML
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
            border-radius: 0 0 10px 10px;
          }
          .section {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }
          .section h2 {
            margin-top: 0;
            color: #667eea;
            font-size: 18px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 140px 1fr;
            gap: 10px;
          }
          .label {
            font-weight: 600;
            color: #555;
          }
          .value {
            color: #333;
          }
          .map-button {
            display: inline-block;
            background: #34a853;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #777;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏠 Nueva Solicitud de Cotización</h1>
        </div>

        <div class="content">
          <!-- Datos de la Propiedad -->
          <div class="section">
            <h2>📋 Datos de la Propiedad</h2>
            <div class="info-grid">
              <span class="label">Tipo:</span>
              <span class="value">${data.tipoPropiedad || 'No especificado'}</span>

              <span class="label">Antigüedad:</span>
              <span class="value">${data.antiguedad || 'No especificado'}</span>

              <span class="label">M² Terreno:</span>
              <span class="value">${data.m2_terreno || 'No especificado'} m²</span>

              <span class="label">M² Construcción:</span>
              <span class="value">${data.m2_construccion || 'No especificado'} m²</span>
            </div>
          </div>

          <!-- Características -->
          <div class="section">
            <h2>🛏️ Características</h2>
            <div class="info-grid">
              <span class="label">Recámaras:</span>
              <span class="value">${data.recamaras || '0'}</span>

              <span class="label">Baños:</span>
              <span class="value">${data.banos || '0'}</span>

              <span class="label">Estacionamientos:</span>
              <span class="value">${data.estacionamientos || '0'}</span>

              <span class="label">Niveles:</span>
              <span class="value">${data.niveles || '0'}</span>
            </div>
          </div>

          <!-- Ubicación -->
          <div class="section">
            <h2>📍 Ubicación</h2>
            <div class="info-grid">
              <span class="label">Dirección:</span>
              <span class="value">${direccionCompleta}</span>

              <span class="label">Coordenadas GPS:</span>
              <span class="value">${data.latitud || 'N/A'}, ${data.longitud || 'N/A'}</span>
            </div>

            ${data.latitud && data.longitud ? `
              <a href="${mapsUrl}" class="map-button" target="_blank">
                📍 Ver en Google Maps
              </a>
            ` : ''}
          </div>

          <!-- Instalaciones -->
          <div class="section">
            <h2>🔌 Instalaciones</h2>
            <div class="info-grid">
              <span class="label">Luz:</span>
              <span class="value">${data.luz === 'si' ? '✅ Sí' : '❌ No'}</span>

              <span class="label">Agua:</span>
              <span class="value">${data.agua === 'si' ? '✅ Sí' : '❌ No'}</span>

              <span class="label">Drenaje:</span>
              <span class="value">${data.drenaje === 'si' ? '✅ Sí' : '❌ No'}</span>

              <span class="label">Internet:</span>
              <span class="value">${data.internet === 'si' ? '✅ Sí' : '❌ No'}</span>
            </div>
          </div>

          <!-- Datos del Contacto -->
          <div class="section">
            <h2>👤 Datos del Contacto</h2>
            <div class="info-grid">
              <span class="label">Nombre:</span>
              <span class="value">${data.nombre || 'No especificado'}</span>

              <span class="label">Teléfono:</span>
              <span class="value">${data.telefono || 'No especificado'}</span>

              <span class="label">Email:</span>
              <span class="value">${data.email || 'No especificado'}</span>
            </div>
          </div>

          <div class="footer">
            <p>Este email fue generado automáticamente por el formulario de cotización.</p>
            <p>Fecha de envío: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mazatlan' })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email
    MailApp.sendEmail({
      to: EMAIL_DESTINO,
      subject: `🏠 Nueva Cotización - ${data.tipoPropiedad || 'Propiedad'} en ${data.colonia || 'Culiacán'}`,
      htmlBody: htmlBody
    });

    console.log('✅ Email enviado a:', EMAIL_DESTINO);

  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    // No lanzar error - queremos guardar los datos aunque falle el email
  }
}

/**
 * Función de prueba (opcional)
 * Ejecuta esto manualmente para probar el email
 */
function probarEmail() {
  const datosEjemplo = {
    tipoPropiedad: 'Casa',
    antiguedad: '5-10 años',
    m2_terreno: '200',
    m2_construccion: '150',
    recamaras: '3',
    banos: '2',
    estacionamientos: '2',
    niveles: '2',
    calle: 'Calle Ébano',
    numero: '2609',
    colonia: 'Privanzas Natura',
    codigoPostal: '80000',
    latitud: '24.8045',
    longitud: '-107.3940',
    luz: 'si',
    agua: 'si',
    drenaje: 'si',
    internet: 'si',
    nombre: 'Juan Pérez',
    telefono: '6671234567',
    email: 'juan@example.com'
  };

  enviarEmailNotificacion(datosEjemplo);
  Logger.log('✅ Email de prueba enviado');
}
