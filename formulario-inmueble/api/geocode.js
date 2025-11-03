/**
 * NETLIFY SERVERLESS FUNCTION - Geocoding Proxy
 * Oculta la API key de Google Maps del cliente
 *
 * Deploy: Netlify Functions (automático)
 * URL: /.netlify/functions/geocode
 *
 * Usa fetch nativo de Node.js 22+ (no requiere dependencias)
 */

// API Key guardada en variables de entorno de Netlify
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk';

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
        const { address } = JSON.parse(event.body);

        if (!address) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Address is required' })
            };
        }

        // Llamar a Google Maps API (desde el servidor)
        const encodedAddress = encodeURIComponent(address);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        // Retornar resultado
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Ajustar en producción
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error en geocoding:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
