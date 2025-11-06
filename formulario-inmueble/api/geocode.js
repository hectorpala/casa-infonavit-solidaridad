/**
 * Netlify Function - Geocode Proxy
 * Oculta la API key de Google Maps del cliente
 * Solo permite requests desde el dominio permitido
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk';
const ALLOWED_ORIGINS = [
    'https://ubicacioncotizar.netlify.app',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
];

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Verificar origen (opcional pero recomendado)
    const origin = event.headers.origin || event.headers.referer;
    const isAllowedOrigin = ALLOWED_ORIGINS.some(allowed =>
        origin && origin.startsWith(allowed)
    );

    if (!isAllowedOrigin && process.env.NODE_ENV === 'production') {
        console.log('❌ Origen no permitido:', origin);
        return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Origin not allowed' })
        };
    }

    try {
        // Parse request body
        const { address } = JSON.parse(event.body);

        if (!address) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Address is required' })
            };
        }

        // Call Google Maps Geocoding API
        const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        url.searchParams.append('address', address);
        url.searchParams.append('key', GOOGLE_MAPS_API_KEY);
        url.searchParams.append('language', 'es');
        url.searchParams.append('region', 'mx');

        console.log('🗺️ Geocoding address:', address);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status !== 'OK') {
            console.log('⚠️ Google Maps error:', data.status);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Geocoding failed',
                    status: data.status,
                    message: data.error_message || 'No results found'
                })
            };
        }

        // Return successful geocoding result (todos los resultados para evaluación)
        console.log(`✅ Geocoding successful - ${data.results.length} resultados`);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                results: data.results, // Retornar todos los resultados
                result: data.results[0], // Mantener retrocompatibilidad
                status: data.status
            })
        };

    } catch (error) {
        console.error('❌ Error in geocode function:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
