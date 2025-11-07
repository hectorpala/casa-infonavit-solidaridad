/**
 * NETLIFY FUNCTION: places-nearby
 * Busca puntos de interés cercanos usando Google Places API
 */

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

    try {
        const { lat, lng, radius = 1000, type } = JSON.parse(event.body);

        // Validar parámetros
        if (!lat || !lng) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Faltan parámetros: lat, lng' })
            };
        }

        // API Key desde variable de entorno
        const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

        if (!GOOGLE_API_KEY) {
            console.error('❌ GOOGLE_MAPS_API_KEY no configurada');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key no configurada' })
            };
        }

        // Construir URL de Google Places API - Nearby Search
        const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
        url.searchParams.append('location', `${lat},${lng}`);
        url.searchParams.append('radius', radius);
        if (type) {
            url.searchParams.append('type', type);
        }
        url.searchParams.append('key', GOOGLE_API_KEY);
        url.searchParams.append('language', 'es');

        console.log(`🔍 Buscando POIs: ${type || 'all'} en ${lat},${lng} (radio: ${radius}m)`);

        // Llamar a Google Places API
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('❌ Google Places API error:', data.status, data.error_message);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: `Google Places API error: ${data.status}`,
                    message: data.error_message
                })
            };
        }

        console.log(`✅ Encontrados ${data.results.length} POIs`);

        // Retornar resultados
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                status: data.status,
                count: data.results.length,
                results: data.results.map(place => ({
                    id: place.place_id,
                    name: place.name,
                    types: place.types,
                    vicinity: place.vicinity,
                    location: place.geometry.location,
                    rating: place.rating,
                    userRatingsTotal: place.user_ratings_total,
                    openNow: place.opening_hours?.open_now,
                    icon: place.icon
                }))
            })
        };

    } catch (error) {
        console.error('❌ Error en places-nearby:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Error interno del servidor',
                message: error.message
            })
        };
    }
};
