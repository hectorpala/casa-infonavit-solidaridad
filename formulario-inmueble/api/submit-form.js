/**
 * NETLIFY SERVERLESS FUNCTION - Submit Form to Google Sheets
 * Envía los datos del formulario a Google Sheets
 *
 * Deploy: Netlify Functions (automático)
 * URL: /.netlify/functions/submit-form
 */

exports.handler = async (event, context) => {
    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parsear body
        const formData = JSON.parse(event.body);

        console.log('📥 Datos recibidos:', formData);

        // URL del Google Apps Script Web App
        // NOTA: Necesitarás reemplazar esto con tu URL real después de crear el script
        const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || '';

        if (!GOOGLE_SCRIPT_URL) {
            console.warn('⚠️ GOOGLE_SCRIPT_URL no configurada. Los datos solo se loguean.');
            console.log('📊 Datos del formulario:', JSON.stringify(formData, null, 2));

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Datos recibidos (modo desarrollo - sin Google Sheets configurado)'
                })
            };
        }

        // Enviar a Google Sheets
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(`Google Sheets error: ${result.error || 'Unknown error'}`);
        }

        console.log('✅ Datos enviados a Google Sheets exitosamente');

        // Retornar éxito
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({
                success: true,
                message: 'Formulario enviado exitosamente',
                sheetResponse: result
            })
        };

    } catch (error) {
        console.error('❌ Error al procesar formulario:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({
                success: false,
                error: 'Error al procesar el formulario',
                details: error.message
            })
        };
    }
};
