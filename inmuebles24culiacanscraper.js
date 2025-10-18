#!/usr/bin/env node

/**
 * SCRAPER Y PUBLICADOR AUTOMÁTICO - INMUEBLES24.COM + CRM VENDEDORES
 *
 * ✨ MULTI-CIUDAD: Detecta automáticamente la ciudad desde la URL y publica en la carpeta correcta
 *
 * USO SCRAPER:
 *   node inmuebles24-scraper-y-publicar.js "URL_DE_INMUEBLES24"
 *
 * USO CRM:
 *   node inmuebles24-scraper-y-publicar.js --crm-buscar <nombre|teléfono|tag>
 *   node inmuebles24-scraper-y-publicar.js --crm-lista
 *   node inmuebles24-scraper-y-publicar.js --crm-stats
 *
 * PROCESO COMPLETO:
 * 1. Detecta ciudad desde URL (Monterrey, Mazatlán, o Culiacán)
 * 2. Scrapea datos de Inmuebles24 (título, precio, fotos, descripción, características)
 * 3. Descarga todas las fotos automáticamente
 * 4. Genera página HTML con Master Template
 * 5. Agrega tarjeta a [ciudad]/index.html
 * 6. Commit y push automático a GitHub
 * 7. Actualiza CRM de vendedores automáticamente
 * 8. Listo en 2-3 minutos
 *
 * CIUDADES SOPORTADAS:
 * - Monterrey, Nuevo León → monterrey/
 * - Mazatlán, Sinaloa → mazatlan/
 * - Culiacán, Sinaloa → culiacan/ (default)
 *
 * EJEMPLOS:
 *   # Monterrey (detecta "monterrey" en URL)
 *   node inmuebles24-scraper-y-publicar.js "https://www.inmuebles24.com/propiedades/.../monterrey-..."
 *
 *   # Mazatlán (detecta "mazatlan" en URL)
 *   node inmuebles24-scraper-y-publicar.js "https://www.inmuebles24.com/propiedades/.../mazatlan-..."
 *
 *   # Culiacán (default si no detecta ciudad)
 *   node inmuebles24-scraper-y-publicar.js "https://www.inmuebles24.com/propiedades/.../culiacan-..."
 *
 * EJEMPLOS CRM:
 *   node inmuebles24-scraper-y-publicar.js --crm-buscar alejandra
 *   node inmuebles24-scraper-y-publicar.js --crm-buscar 6671603643
 *   node inmuebles24-scraper-y-publicar.js --crm-buscar centro-historico
 */

// Puppeteer con Stealth Plugin para evitar detección
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const readline = require('readline');

// ============================================
// CONFIGURACIÓN
// ============================================

require('dotenv').config();

const CONFIG = {
    googleMaps: {
        key: process.env.GOOGLE_MAPS_KEY || 'AIzaSyDKzdyJP29acUNCqHr9klrz-Hz_0tIu7sk'
    },
    baseUrl: 'https://casasenventa.info',
    timeout: 60000,
    headless: false, // Mostrar navegador para bypass de protecciones
    scraped_properties_file: 'inmuebles24-scraped-properties.json', // Registro de propiedades scrapeadas
    crm_vendedores_file: 'crm-vendedores.json' // CRM de vendedores
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Pregunta al usuario por confirmación
 * @param {string} question - Pregunta a hacer
 * @returns {Promise<string>} - Respuesta del usuario
 */
function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
}

/**
 * Detecta la ciudad desde la URL de Inmuebles24
 * @param {string} url - URL de la propiedad en Inmuebles24
 * @returns {string} - Ciudad detectada: 'monterrey', 'mazatlan', o 'culiacan' (default)
 */
function detectCityFromUrl(url) {
    const urlLower = url.toLowerCase();

    // Detectar Monterrey
    if (urlLower.includes('monterrey') || urlLower.includes('nuevo-leon') || urlLower.includes('nuevo-león')) {
        return 'monterrey';
    }

    // Detectar Mazatlán
    if (urlLower.includes('mazatlan') || urlLower.includes('mazatlán')) {
        return 'mazatlan';
    }

    // Default: Culiacán
    return 'culiacan';
}

/**
 * Detecta si es VENTA o RENTA desde la URL de Inmuebles24
 * @param {string} url - URL de la propiedad en Inmuebles24
 * @returns {string} - Tipo detectado: 'venta' o 'renta'
 */
function detectPropertyType(url) {
    const urlLower = url.toLowerCase();

    // Detectar RENTA (alquiler, renta, arrendar)
    if (urlLower.includes('alquiler') ||
        urlLower.includes('renta') ||
        urlLower.includes('arrendar') ||
        urlLower.includes('alquilar')) {
        return 'renta';
    }

    // Default: VENTA
    return 'venta';
}

/**
 * Confirma la ciudad con el usuario
 * @param {string} detectedCity - Ciudad detectada automáticamente
 * @returns {Promise<string>} - Ciudad confirmada por el usuario
 */
async function confirmCity(detectedCity) {
    const cityNames = {
        'monterrey': 'Monterrey, Nuevo León',
        'mazatlan': 'Mazatlán, Sinaloa',
        'culiacan': 'Culiacán, Sinaloa'
    };

    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║  🌆 CONFIRMACIÓN DE CIUDAD (IMPORTANTE)      ║');
    console.log('╚═══════════════════════════════════════════════╝\n');
    console.log(`📍 Ciudad detectada automáticamente: ${cityNames[detectedCity]}\n`);
    console.log('¿Es correcta esta ciudad?\n');
    console.log('  1️⃣  Culiacán, Sinaloa');
    console.log('  2️⃣  Monterrey, Nuevo León');
    console.log('  3️⃣  Mazatlán, Sinaloa\n');

    const answer = await askQuestion('👉 Selecciona el número (1/2/3) o presiona Enter para confirmar: ');

    if (answer === '' || answer === '1' && detectedCity === 'culiacan' || answer === '2' && detectedCity === 'monterrey' || answer === '3' && detectedCity === 'mazatlan') {
        console.log(`\n✅ Ciudad confirmada: ${cityNames[detectedCity]}\n`);
        return detectedCity;
    }

    // Usuario eligió diferente
    const cityMap = {
        '1': 'culiacan',
        '2': 'monterrey',
        '3': 'mazatlan'
    };

    const selectedCity = cityMap[answer];
    if (!selectedCity) {
        console.log('\n❌ Opción inválida. Usando ciudad detectada por defecto.\n');
        return detectedCity;
    }

    console.log(`\n✅ Ciudad corregida a: ${cityNames[selectedCity]}\n`);
    return selectedCity;
}

/**
 * Obtiene la configuración específica de la ciudad y tipo de propiedad
 * @param {string} city - Ciudad: 'monterrey', 'mazatlan', o 'culiacan'
 * @param {string} propertyType - Tipo: 'venta' o 'renta'
 * @returns {object} - Configuración de la ciudad
 */
function getCityConfig(city, propertyType = 'venta') {
    const configs = {
        monterrey: {
            city: 'monterrey',
            folder: 'monterrey',
            indexPath: 'monterrey/index.html',
            name: 'Monterrey',
            state: 'Nuevo León',
            stateShort: 'N.L.',
            coords: { lat: 25.6866, lng: -100.3161, name: 'Monterrey' },
            whatsapp: '528111652545',
            templatePath: propertyType === 'renta'
                ? 'automation/templates/master-template-rental.html'
                : 'culiacan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/index.html',
            stylesSource: 'culiacan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/styles.css',
            isRental: propertyType === 'renta'
        },
        mazatlan: {
            city: 'mazatlan',
            folder: 'mazatlan',
            indexPath: 'mazatlan/index.html',
            name: 'Mazatlán',
            state: 'Sinaloa',
            stateShort: 'Sin.',
            coords: { lat: 23.2494, lng: -106.4111, name: 'Mazatlán' },
            whatsapp: '526691652545',
            templatePath: propertyType === 'renta'
                ? 'automation/templates/master-template-rental.html'
                : 'culiacan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/index.html',
            stylesSource: 'culiacan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/styles.css',
            isRental: propertyType === 'renta'
        },
        culiacan: {
            city: 'culiacan',
            folder: 'culiacan',
            indexPath: 'culiacan/index.html',
            name: 'Culiacán',
            state: 'Sinaloa',
            stateShort: 'Sin.',
            coords: { lat: 24.8091, lng: -107.3940, name: 'Culiacán' },
            whatsapp: '526672317963',
            templatePath: propertyType === 'renta'
                ? 'automation/templates/master-template-rental.html'
                : 'culiacan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/index.html',
            stylesSource: 'culiacan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/styles.css',
            isRental: propertyType === 'renta'
        }
    };

    return configs[city] || configs.culiacan;
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60);
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

function extractPriceNumber(priceStr) {
    const cleaned = priceStr.replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
}

function formatPrice(price) {
    if (typeof price === 'string') {
        const match = price.match(/\$?\s*([0-9,\.]+)/);
        if (match) {
            const num = parseFloat(match[1].replace(/,/g, ''));
            return `$${num.toLocaleString('es-MX')}`;
        }
        return price;
    }
    return `$${price.toLocaleString('es-MX')}`;
}

/**
 * Convierte precio a formato corto para marcador (ej: $3,200,000 → 3.2M)
 */
function formatPriceShort(priceStr) {
    const num = typeof priceStr === 'string'
        ? parseFloat(priceStr.replace(/[^0-9]/g, ''))
        : priceStr;

    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
        return `${(num / 1000).toFixed(0)}K`;
    }
    return `${num}`;
}

/**
 * Detecta precisión de dirección y ajusta estrategia de marcador
 *
 * Retorna objeto con:
 * - level: 'exact' | 'street' | 'neighborhood' | 'generic'
 * - hasStreet: boolean
 * - hasNumber: boolean
 * - offsetNeeded: boolean (si necesita offset para múltiples propiedades en misma zona)
 */
function detectAddressPrecision(location) {
    const hasNumber = /\d+/.test(location.split(',')[0]); // Número en primera parte
    const hasStreet = /(calle|avenida|av\.|blvd|boulevard|privada|priv\.|paseo)/i.test(location);
    const hasFraccionamiento = /fraccionamiento/i.test(location);

    let level = 'generic';
    if (hasNumber && hasStreet) {
        level = 'exact'; // Calle + número
    } else if (hasStreet && !hasNumber) {
        level = 'street'; // Solo calle, sin número
    } else if (hasFraccionamiento || /colonia/i.test(location)) {
        level = 'neighborhood'; // Solo fraccionamiento/colonia
    }

    return {
        level,
        hasStreet,
        hasNumber,
        offsetNeeded: level === 'neighborhood' || level === 'generic'
    };
}

/**
 * Genera HTML de mapa interactivo con marcador personalizado naranja
 *
 * @param {Object} config
 * @param {string} config.location - Dirección completa
 * @param {string} config.price - Precio de la propiedad (ej: "$3,200,000")
 * @param {string} config.title - Título de la propiedad
 * @param {number} config.photoCount - Número total de fotos
 * @param {number} config.bedrooms - Número de recámaras
 * @param {number} config.bathrooms - Número de baños
 * @param {string} config.area - Área de construcción
 * @param {string} config.whatsapp - Número de WhatsApp
 * @param {string} [config.propertyIndex=0] - Índice para offset si hay múltiples en misma colonia
 * @returns {string} HTML del mapa con script
 */
function generateMapWithCustomMarker(config) {
    const { location, price, title, propertyIndex = 0, cityCoords = { lat: 24.8091, lng: -107.3940, name: 'Culiacán' }, photoCount = 1, bedrooms = 'N/A', bathrooms = 'N/A', area = 'N/D', whatsapp = '526681234567' } = config;
    const priceShort = formatPriceShort(price);
    const precision = detectAddressPrecision(location);

    // Calcular offset si hay múltiples propiedades en misma zona
    const latOffset = precision.offsetNeeded ? (propertyIndex * 0.002) : 0;
    const lngOffset = precision.offsetNeeded ? (propertyIndex * 0.002) : 0;

    // Generar array de fotos dinámicamente
    const photosArray = [];
    for (let i = 1; i <= photoCount; i++) {
        photosArray.push(`'images/foto-${i}.jpg'`);
    }

    return `
    <!-- Mapa con Marcador Personalizado -->
    <div id="map-container" style="width: 100%; height: 450px; border-radius: 12px; overflow: hidden;"></div>

    <script>
        // Variables globales para el mapa
        let map;
        let marker;
        let geocoder;

        // Configuración del marcador personalizado
        const MARKER_CONFIG = {
            location: "${location.replace(/"/g, '\\"')}",
            priceShort: "${priceShort}",
            title: "${title.replace(/"/g, '\\"')}",
            precision: "${precision.level}",
            latOffset: ${latOffset},
            lngOffset: ${lngOffset}
        };

        // Datos completos de la propiedad actual (para el InfoWindow con carrusel)
        const CURRENT_PROPERTY_DATA = {
            priceShort: "${priceShort}",
            priceFull: "${price}",
            title: "${title.replace(/"/g, '\\"')}",
            location: "${location.replace(/"/g, '\\"')}",
            bedrooms: ${bedrooms},
            bathrooms: ${bathrooms},
            area: "${area}",
            whatsapp: "${whatsapp}",
            url: "#", // URL a la página de detalles (# = página actual)
            photos: [${photosArray.join(', ')}]
        };

        // Array con TODAS las propiedades de Mazatlán
        const ALL_MAZATLAN_PROPERTIES = [
            { "slug": "casa-en-venta-real-del-valle", "priceShort": "$3.5M", "title": "Casa en Venta Real del Valle", "location": "Real del Valle", "image": "casa-en-venta-real-del-valle/images/foto-1.jpg" },
            { "slug": "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-", "priceShort": "$3.5M", "title": "Casa de Venta en Rincon de Los Girasoles en Fracc Rincon de Las Plazas", "location": "Casa de Venta en Rincon de Los Girasoles en Fracc Rincon de Las Plazas", "image": "casa-de-venta-en-rincon-de-los-girasoles-en-fracc-rincon-de-/images/foto-1.jpg" },
            { "slug": "casa-en-venta-en-mazatlan-cercana-a-marina-mazatlan-y-playas", "priceShort": "$2.6M", "title": "Casa en Venta en Mazatlán Cercana a Marina Mazatlán y Playas.", "location": "Mazatlán Cercana a Marina Mazatlán y Playas.", "image": "casa-en-venta-en-mazatlan-cercana-a-marina-mazatlan-y-playas/images/foto-1.jpg" },
            { "slug": "casa-en-venta-en-veredas-mazatlan-sin", "priceShort": "$3.3M", "title": "Casa en Venta en Veredas, Mazatlan, Sin.", "location": "Veredas, Mazatlan, Sin.", "image": "casa-en-venta-en-veredas-mazatlan-sin/images/foto-1.jpg" },
            { "slug": "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido", "priceShort": "$2.3M", "title": "Casa de 3 Recámaras y 160 m² en Venta, Valle del Ejido", "location": "Casa de 3 Recámaras y 160 m² en Venta, Valle del Ejido", "image": "casa-de-3-recamaras-y-160-m-en-venta-valle-del-ejido/images/foto-1.jpg" },
            { "slug": "casa-en-venta-de-real-del-valle-coto-14", "priceShort": "$3.0M", "title": "Casa en Venta de Real del Valle Coto 14", "location": "de Real del Valle Coto 14", "image": "casa-en-venta-de-real-del-valle-coto-14/images/foto-1.jpg" },
            { "slug": "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza", "priceShort": "$3.4M", "title": "Casa en Venta Residencial con Alberca en Real del Valle Mazatlan", "location": "Residencial con Alberca en Real del Valle Mazatlan", "image": "casa-en-venta-residencial-con-alberca-en-real-del-valle-maza/images/foto-1.jpg" },
            { "slug": "casa-en-venta-en-el-fracc-porto-molino-mazatlan-sinaloa", "priceShort": "$2.6M", "title": "Casa en Venta en El Fracc Porto Molino Mazatlan Sinaloa", "location": "El Fracc Porto Molino Mazatlan Sinaloa", "image": "casa-en-venta-en-el-fracc-porto-molino-mazatlan-sinaloa/images/foto-1.jpg" },
            { "slug": "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res", "priceShort": "$3.2M", "title": "Casa 113 m² con 3 Recámaras en Venta, Fraccionamiento Isla Residencial", "location": "Casa 113 m² con 3 Recámaras en Venta, Fraccionamiento Isla Residencial", "image": "casa-113-m-con-3-recamaras-en-venta-fraccionamiento-isla-res/images/foto-1.jpg" },
            { "slug": "casa-en-venta-en-mazatlan-fraccionamiento-real-pacifico", "priceShort": "$2.1M", "title": "Casa en Venta en Mazatlan, Fraccionamiento Real Pacifico", "location": "Mazatlan, Fraccionamiento Real Pacifico", "image": "casa-en-venta-en-mazatlan-fraccionamiento-real-pacifico/images/foto-1.jpg" },
            { "slug": "casa-en-venta-mazatlan-residencial-palmilla-super-precio", "priceShort": "$3.7M", "title": "Casa en Venta Mazatlan, Residencial Palmilla Super Precio!", "location": "Mazatlan, Residencial Palmilla Super Precio!", "image": "casa-en-venta-mazatlan-residencial-palmilla-super-precio/images/foto-1.jpg" },
            { "slug": "casa-en-venta-en-privada-con-alberca-en-mazatlan", "priceShort": "$3.3M", "title": "Casa en Venta en Privada con Alberca en Mazatlán", "location": "Privada con Alberca en Mazatlán", "image": "casa-en-venta-en-privada-con-alberca-en-mazatlan/images/foto-1.jpg" },
            { "slug": "casa-en-venta-en-mazatlan-sinaloa-villa-galaxia", "priceShort": "$2.0M", "title": "Casa en Venta en Mazatlan, Sinaloa (Villa Galaxia)", "location": "Mazatlan, Sinaloa (Villa Galaxia)", "image": "casa-en-venta-en-mazatlan-sinaloa-villa-galaxia/images/foto-1.jpg" },
            { "slug": "casa-en-venta-en-mazatlan-sinaloa-hacienda-del-seminario-fue", "priceShort": "$2.4M", "title": "Casa en Venta en Mazatlan, Sinaloa, Hacienda del Seminario (Fuera de Coto)", "location": "Mazatlan, Sinaloa, Hacienda del Seminario (Fuera de Coto)", "image": "casa-en-venta-en-mazatlan-sinaloa-hacienda-del-seminario-fue/images/foto-1.jpg" },
            { "slug": "casa-en-venta-en-mazatlan-en-coto-privado-camila-hills-model", "priceShort": "$2.7M", "title": "Casa en Venta en Mazatlán en Coto Privado Camila Hills Modelo Nova", "location": "Av Paseo del Pacífico, Mazatlán, Sinaloa", "image": "casa-en-venta-en-mazatlan-en-coto-privado-camila-hills-model/images/foto-1.jpg" },
            { "slug": "casa-en-venta-en-mazatlan", "priceShort": "$2.7M", "title": "Casa en Venta en Mazatlán.", "location": "Mazatlán", "image": "casa-en-venta-en-mazatlan/images/foto-1.jpg" },
            { "slug": "casa-en-venta-151-m-con-terraza-recamara-en-planta-baja-en-z", "priceShort": "$2.4M", "title": "Casa en Venta De Los Peces", "location": "De Los Peces, Fraccionamiento Tortugas, Mazatlán", "image": "casa-en-venta-151-m-con-terraza-recamara-en-planta-baja-en-z/images/foto-1.jpg" },
            { "slug": "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01", "priceShort": "$6.3M", "title": "Casa en Venta Barrio San Francisco", "location": "Barrio San Francisco, Barrio San Francisco, Mazatlán, Sinaloa", "image": "casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/images/foto-1.jpg" }
        ];

        // Variable global para el InfoWindow actual y el índice de foto
        let currentInfoWindow = null;
        let currentPhotoIndex = 0;

        // Función para mostrar tarjeta con carrusel de fotos completo (estilo Zillow)
        function showPropertyCard(property, position, map, isCurrent = false) {
            currentPhotoIndex = 0; // Resetear al abrir

            // Crear ID único para este carrusel
            const carouselId = 'carousel-prop-' + Date.now();

            // Generar HTML del carrusel con TODAS las fotos
            const cardContent = \`
                <div id="\${carouselId}" style="max-width: 320px; font-family: 'Poppins', sans-serif;">
                    <!-- Carrusel de fotos -->
                    <div style="position: relative; height: 200px; margin-bottom: 10px; overflow: hidden; border-radius: 8px 8px 0 0;">
                        <!-- Imagen actual -->
                        <img id="\${carouselId}-img"
                             src="\${property.photos[0]}"
                             alt="\${property.title}"
                             style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s ease;">

                        <!-- Flechas de navegación -->
                        <button id="\${carouselId}-prev"
                                style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; z-index: 10; transition: background 0.2s;"
                                onmouseover="this.style.background='rgba(0,0,0,0.8)'"
                                onmouseout="this.style.background='rgba(0,0,0,0.6)'">
                            ‹
                        </button>
                        <button id="\${carouselId}-next"
                                style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; z-index: 10; transition: background 0.2s;"
                                onmouseover="this.style.background='rgba(0,0,0,0.8)'"
                                onmouseout="this.style.background='rgba(0,0,0,0.6)'">
                            ›
                        </button>

                        <!-- Contador de fotos -->
                        <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; z-index: 10;">
                            <span id="\${carouselId}-counter">1</span> / \${property.photos.length}
                        </div>

                        <!-- Dots indicadores -->
                        <div id="\${carouselId}-dots" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10;">
                            \${property.photos.map((_, index) => \`
                                <div class="carousel-dot" data-index="\${index}"
                                     style="width: \${index === 0 ? '20px' : '8px'}; height: 8px; border-radius: 4px; background: \${index === 0 ? 'white' : 'rgba(255,255,255,0.5)'}; cursor: pointer; transition: all 0.3s;"></div>
                            \`).join('')}
                        </div>
                    </div>

                    <!-- Info de la propiedad -->
                    <div style="padding: 12px;">
                        <h3 style="margin: 0 0 8px 0; color: \${isCurrent ? '#FF6B35' : '#10b981'}; font-size: 20px; font-weight: 700;">\${property.priceFull}</h3>
                        <div style="display: flex; gap: 12px; margin-bottom: 8px; color: #6b7280; font-size: 14px;">
                            <span><i class="fas fa-bed"></i> \${property.bedrooms} rec</span>
                            <span><i class="fas fa-bath"></i> \${property.bathrooms} baños</span>
                            <span><i class="fas fa-ruler-combined"></i> \${property.area}</span>
                        </div>
                        <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 13px; line-height: 1.4;">\${property.location}</p>

                        <!-- Botones de acción -->
                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.open('\${property.url}', '_blank')"
                               style="flex: 1; background: #FF6A00; color: white; padding: 10px 16px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; text-align: center; cursor: pointer; font-family: 'Poppins', sans-serif;">
                                Ver Detalles
                            </button>
                            <button onclick="window.open('https://wa.me/\${property.whatsapp}?text=Hola,%20me%20interesa%20\${encodeURIComponent(property.title)}%20en%20\${encodeURIComponent(property.priceFull)}', '_blank')"
                               style="flex: 1; background: #25D366; color: white; padding: 10px 16px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; text-align: center; cursor: pointer; font-family: 'Poppins', sans-serif;">
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            \`;

            const infoWindow = new google.maps.InfoWindow({
                content: cardContent,
                maxWidth: 340
            });

            infoWindow.setPosition(position);
            infoWindow.open(map);

            // Guardar referencia al InfoWindow actual
            currentInfoWindow = infoWindow;

            // Esperar a que el contenido se renderice y agregar event listeners
            google.maps.event.addListenerOnce(infoWindow, 'domready', function() {
                const img = document.getElementById(\`\${carouselId}-img\`);
                const counter = document.getElementById(\`\${carouselId}-counter\`);
                const prevBtn = document.getElementById(\`\${carouselId}-prev\`);
                const nextBtn = document.getElementById(\`\${carouselId}-next\`);
                const dots = document.querySelectorAll(\`#\${carouselId}-dots .carousel-dot\`);

                // Función para actualizar la foto
                function updatePhoto(newIndex) {
                    if (newIndex < 0) newIndex = property.photos.length - 1;
                    if (newIndex >= property.photos.length) newIndex = 0;

                    currentPhotoIndex = newIndex;

                    // Fade effect
                    img.style.opacity = '0';
                    setTimeout(() => {
                        img.src = property.photos[newIndex];
                        img.style.opacity = '1';
                    }, 150);

                    // Actualizar contador
                    counter.textContent = newIndex + 1;

                    // Actualizar dots
                    dots.forEach((dot, index) => {
                        if (index === newIndex) {
                            dot.style.width = '20px';
                            dot.style.background = 'white';
                        } else {
                            dot.style.width = '8px';
                            dot.style.background = 'rgba(255,255,255,0.5)';
                        }
                    });
                }

                // Event listeners para flechas
                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updatePhoto(currentPhotoIndex - 1);
                });

                nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updatePhoto(currentPhotoIndex + 1);
                });

                // Event listeners para dots
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', (e) => {
                        e.stopPropagation();
                        updatePhoto(index);
                    });
                });

                // Soporte para teclado (flechas)
                document.addEventListener('keydown', function handleKeyPress(e) {
                    if (!currentInfoWindow) {
                        document.removeEventListener('keydown', handleKeyPress);
                        return;
                    }
                    if (e.key === 'ArrowLeft') updatePhoto(currentPhotoIndex - 1);
                    if (e.key === 'ArrowRight') updatePhoto(currentPhotoIndex + 1);
                });
            });

            // Limpiar al cerrar
            google.maps.event.addListener(infoWindow, 'closeclick', function() {
                currentInfoWindow = null;
                currentPhotoIndex = 0;
            });
        }

        // Función para crear marcador personalizado para otras propiedades
        function createPropertyMarker(property, map, isCurrent = false) {
            const markerHTML = \`
                <div style="
                    background: \${isCurrent ? 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
                    color: white;
                    padding: \${isCurrent ? '8px 14px' : '6px 10px'};
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: \${isCurrent ? '14px' : '12px'};
                    border: 3px solid white;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    cursor: pointer;
                    white-space: nowrap;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    \${property.priceShort}
                </div>
            \`;

            const CustomMarker = function(position, map, property, isCurrent) {
                this.position = position;
                this.property = property;
                this.isCurrent = isCurrent;
                this.div = null;
                this.setMap(map);
            };

            CustomMarker.prototype = new google.maps.OverlayView();

            CustomMarker.prototype.onAdd = function() {
                const div = document.createElement('div');
                div.style.position = 'absolute';
                div.innerHTML = markerHTML;

                div.addEventListener('click', () => {
                    // Cerrar el InfoWindow anterior si existe
                    if (currentInfoWindow) {
                        currentInfoWindow.close();
                    }
                    // Mostrar tarjeta con carrusel completo
                    showPropertyCard(this.property, this.position, map, this.isCurrent);
                });

                this.div = div;
                const panes = this.getPanes();
                panes.overlayMouseTarget.appendChild(div);
            };

            CustomMarker.prototype.draw = function() {
                const overlayProjection = this.getProjection();
                const position = overlayProjection.fromLatLngToDivPixel(this.position);
                const div = this.div;
                div.style.left = (position.x - (this.isCurrent ? 40 : 30)) + 'px';
                div.style.top = (position.y - (this.isCurrent ? 20 : 16)) + 'px';
            };

            CustomMarker.prototype.onRemove = function() {
                if (this.div) {
                    this.div.parentNode.removeChild(this.div);
                    this.div = null;
                }
            };

            return CustomMarker;
        }

        // Inicializar mapa
        function initMap() {
            geocoder = new google.maps.Geocoder();

            // Geocodificar la dirección
            geocoder.geocode({ address: MARKER_CONFIG.location }, function(results, status) {
                if (status === 'OK' && results[0]) {
                    const position = {
                        lat: results[0].geometry.location.lat() + MARKER_CONFIG.latOffset,
                        lng: results[0].geometry.location.lng() + MARKER_CONFIG.lngOffset
                    };

                    // Detectar si es propiedad de Mazatlán
                    const isMazatlan = window.location.href.includes('/mazatlan/');
                    const currentSlug = window.location.pathname.split('/').filter(p => p).pop();

                    // Crear mapa con zoom ajustado para Mazatlán
                    map = new google.maps.Map(document.getElementById('map-container'), {
                        center: position,
                        zoom: isMazatlan ? 13 : (MARKER_CONFIG.precision === 'exact' ? 17 :
                              MARKER_CONFIG.precision === 'street' ? 16 : 15),
                        mapTypeId: 'roadmap',
                        styles: [
                            {
                                featureType: 'poi',
                                elementType: 'labels',
                                stylers: [{ visibility: 'off' }]
                            }
                        ],
                        disableDefaultUI: false,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: true,
                        fullscreenControl: true
                    });

                    // Crear marcador de la propiedad actual (naranja) con datos completos
                    const currentProperty = isMazatlan
                        ? ALL_MAZATLAN_PROPERTIES.find(p => currentSlug.includes(p.slug) || p.slug.includes(currentSlug))
                        : CURRENT_PROPERTY_DATA;

                    if (currentProperty) {
                        const CustomMarkerClass = createPropertyMarker(currentProperty, map, true);
                        marker = new CustomMarkerClass(position, map, currentProperty, true);

                        // Si es Mazatlán, crear marcadores de TODAS las otras propiedades (verdes)
                        if (isMazatlan) {
                            ALL_MAZATLAN_PROPERTIES.forEach(property => {
                                if (property.slug !== currentProperty.slug) {
                                    geocoder.geocode({ address: property.location }, function(results, status) {
                                        if (status === 'OK' && results[0]) {
                                            const otherPosition = {
                                                lat: results[0].geometry.location.lat(),
                                                lng: results[0].geometry.location.lng()
                                            };
                                            const OtherMarkerClass = createPropertyMarker(property, map, false);
                                            new OtherMarkerClass(otherPosition, map, property, false);
                                        }
                                    });
                                }
                            });
                        }
                    }

                } else {
                    console.error('Geocode error:', status);
                    // Fallback: mostrar mapa en ubicación genérica
                    const fallbackCenter = { lat: ${cityCoords.lat}, lng: ${cityCoords.lng} }; // ${cityCoords.name} centro
                    map = new google.maps.Map(document.getElementById('map-container'), {
                        center: fallbackCenter,
                        zoom: 12
                    });
                }
            });
        }
    </script>

    <!-- Cargar Google Maps API -->
    <script src="https://maps.googleapis.com/maps/api/js?key=${CONFIG.googleMaps.key}&callback=initMap&libraries=places" async defer></script>
    `;
}

// ============================================
// DETECCIÓN DE DUPLICADOS
// ============================================

function loadScrapedProperties() {
    try {
        if (fs.existsSync(CONFIG.scraped_properties_file)) {
            const data = fs.readFileSync(CONFIG.scraped_properties_file, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('⚠️  Error leyendo archivo de propiedades:', error.message);
    }
    return [];
}

function saveScrapedProperty(propertyData) {
    try {
        const properties = loadScrapedProperties();
        properties.push({
            propertyId: propertyData.propertyId,
            title: propertyData.title,
            slug: propertyData.slug,
            price: propertyData.price,
            publishedDate: propertyData.publishedDate,
            scrapedAt: new Date().toISOString(),
            url: propertyData.url
        });
        fs.writeFileSync(CONFIG.scraped_properties_file, JSON.stringify(properties, null, 2), 'utf8');
        console.log(`   ✅ Propiedad guardada en registro (ID: ${propertyData.propertyId})\n`);
    } catch (error) {
        console.log('   ⚠️  Error guardando propiedad en registro:', error.message);
    }
}

function checkIfPropertyExists(propertyId) {
    const properties = loadScrapedProperties();
    const existing = properties.find(p => p.propertyId === propertyId);

    if (existing) {
        console.log('\n⚠️  ============================================');
        console.log('⚠️  PROPIEDAD DUPLICADA DETECTADA');
        console.log('⚠️  ============================================');
        console.log(`   🆔 ID: ${existing.propertyId}`);
        console.log(`   📝 Título: ${existing.title}`);
        console.log(`   💰 Precio: ${existing.price}`);
        console.log(`   📅 Publicada: ${existing.publishedDate}`);
        console.log(`   🕐 Scrapeada: ${existing.scrapedAt}`);
        console.log(`   🔗 Slug: ${existing.slug}`);
        console.log('\n   ❌ Esta propiedad ya fue scrapeada anteriormente.');
        console.log('   💡 Si quieres re-scrapear, elimina la entrada del archivo:');
        console.log(`      ${CONFIG.scraped_properties_file}\n`);
        return existing;
    }

    return null;
}

// ============================================
// CRM VENDEDORES
// ============================================

function loadCRM() {
    try {
        if (fs.existsSync(CONFIG.crm_vendedores_file)) {
            const data = fs.readFileSync(CONFIG.crm_vendedores_file, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('⚠️  Error leyendo CRM:', error.message);
    }
    return {
        vendedores: [],
        estadisticas: {
            totalVendedores: 0,
            totalPropiedades: 0,
            ultimaActualizacion: new Date().toISOString()
        }
    };
}

function saveCRM(crm) {
    try {
        fs.writeFileSync(CONFIG.crm_vendedores_file, JSON.stringify(crm, null, 2), 'utf8');
    } catch (error) {
        console.log('⚠️  Error guardando CRM:', error.message);
    }
}

function actualizarVendedorCRM(vendedorData, propertyData) {
    if (!vendedorData || (!vendedorData.nombre && !vendedorData.telefono)) {
        console.log('   ⚠️  No hay datos de vendedor para agregar al CRM\n');
        return;
    }

    const crm = loadCRM();

    // Buscar vendedor existente (primero por teléfono, luego por nombre)
    let vendedor = null;

    if (vendedorData.telefono && vendedorData.telefono !== 'NO ENCONTRADO') {
        // Buscar por teléfono (más confiable)
        vendedor = crm.vendedores.find(v => v.telefono === vendedorData.telefono);
    }

    if (!vendedor && vendedorData.nombre) {
        // Si no se encontró por teléfono, buscar por nombre exacto
        vendedor = crm.vendedores.find(v => v.nombre.toLowerCase() === vendedorData.nombre.toLowerCase());
    }

    if (vendedor) {
        // Actualizar vendedor existente
        console.log(`   📝 Vendedor encontrado en CRM: ${vendedor.nombre}`);

        // Actualizar teléfono si no lo tenía y ahora sí
        if (vendedorData.telefono && vendedorData.telefono !== 'NO ENCONTRADO' && !vendedor.telefono) {
            vendedor.telefono = vendedorData.telefono;
            vendedor.telefonoFormateado = vendedorData.telefono.length === 10 ?
                `${vendedorData.telefono.slice(0, 3)}-${vendedorData.telefono.slice(3, 6)}-${vendedorData.telefono.slice(6)}` :
                vendedorData.telefono;
            vendedor.whatsapp = `https://wa.me/52${vendedorData.telefono}`;
            console.log(`   📞 Teléfono actualizado: ${vendedor.telefonoFormateado}`);
        }

        // Agregar nueva propiedad si no existe
        const propExists = vendedor.propiedades.some(p => p.id === propertyData.propertyId);
        if (!propExists) {
            vendedor.propiedades.push({
                id: propertyData.propertyId,
                titulo: propertyData.title,
                precio: propertyData.price,
                ubicacion: propertyData.location,
                recamaras: propertyData.bedrooms || 0,
                banos: propertyData.bathrooms || 0,
                construccion: propertyData.construction_area || 0,
                terreno: propertyData.land_area || 0,
                url: propertyData.url,
                fechaScrapeo: new Date().toISOString().split('T')[0],
                fechaPublicacion: propertyData.publishedDate || 'No disponible',
                vistas: propertyData.views || 0
            });
            console.log(`   ✅ Propiedad vinculada: "${propertyData.title}"`);
            console.log(`   📅 Publicada en Inmuebles24: ${propertyData.publishedDate || 'No disponible'}`);
            console.log(`   📊 Total propiedades de ${vendedor.nombre}: ${vendedor.propiedades.length}`);
        } else {
            console.log(`   ℹ️  Esta propiedad ya está vinculada a ${vendedor.nombre}`);
        }

    } else {
        // Crear nuevo vendedor
        console.log(`   👤 Nuevo vendedor agregado al CRM: ${vendedorData.nombre || 'Sin nombre'}`);

        // Generar ID único
        const vendedorId = `v${String(crm.vendedores.length + 1).padStart(3, '0')}`;

        // Formatear teléfono
        const tel = vendedorData.telefono;
        const telefonoFormateado = tel.length === 10 ?
            `${tel.slice(0, 3)}-${tel.slice(3, 6)}-${tel.slice(6)}` :
            tel;

        // Extraer ubicación de la propiedad para tags
        const locationParts = propertyData.location.toLowerCase().split(',');
        const tags = ['inmuebles24'];
        locationParts.forEach(part => {
            const cleaned = part.trim().replace(/\s+/g, '-');
            if (cleaned && cleaned !== 'culiacán' && cleaned !== 'culiacan') {
                tags.push(cleaned);
            }
        });
        tags.push('culiacan');

        vendedor = {
            id: vendedorId,
            nombre: vendedorData.nombre || 'Sin nombre',
            telefono: tel,
            telefonoFormateado: telefonoFormateado,
            whatsapp: `https://wa.me/52${tel}`,
            fuente: 'Inmuebles24',
            propiedades: [{
                id: propertyData.propertyId,
                titulo: propertyData.title,
                precio: propertyData.price,
                ubicacion: propertyData.location,
                recamaras: propertyData.bedrooms || 0,
                banos: propertyData.bathrooms || 0,
                construccion: propertyData.construction_area || 0,
                terreno: propertyData.land_area || 0,
                url: propertyData.url,
                fechaScrapeo: new Date().toISOString().split('T')[0],
                fechaPublicacion: propertyData.publishedDate || 'No disponible',
                vistas: propertyData.views || 0
            }],
            notas: `Vendedor de ${propertyData.location}`,
            tags: tags,
            ultimoContacto: null,
            agregado: new Date().toISOString()
        };

        crm.vendedores.push(vendedor);
        console.log(`   📅 Propiedad publicada en Inmuebles24: ${propertyData.publishedDate || 'No disponible'}`);
    }

    // Actualizar estadísticas
    crm.estadisticas.totalVendedores = crm.vendedores.length;
    crm.estadisticas.totalPropiedades = crm.vendedores.reduce(
        (sum, v) => sum + v.propiedades.length, 0
    );
    crm.estadisticas.ultimaActualizacion = new Date().toISOString();

    saveCRM(crm);
    console.log(`   ✅ CRM actualizado: ${crm.estadisticas.totalVendedores} vendedores, ${crm.estadisticas.totalPropiedades} propiedades\n`);
}

function buscarVendedorCRM(query) {
    const crm = loadCRM();
    const queryLower = query.toLowerCase();

    const resultados = crm.vendedores.filter(v => {
        // Buscar en datos del vendedor
        const matchVendedor = (
            v.nombre.toLowerCase().includes(queryLower) ||
            v.telefono.includes(query) ||
            v.tags.some(tag => tag.toLowerCase().includes(queryLower))
        );

        // Buscar en propiedades (título, ID, URL)
        const matchPropiedad = v.propiedades.some(p =>
            p.titulo.toLowerCase().includes(queryLower) ||
            p.id.includes(query) ||
            (p.url && p.url.toLowerCase().includes(queryLower))
        );

        return matchVendedor || matchPropiedad;
    });

    return resultados;
}

function mostrarVendedorCRM(vendedor) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log(`║  👤 ${vendedor.nombre.padEnd(55)}║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  📞 Teléfono: ${vendedor.telefonoFormateado.padEnd(43)}║`);
    console.log(`║  💬 WhatsApp: ${vendedor.whatsapp.padEnd(43)}║`);
    console.log(`║  🏢 Fuente: ${vendedor.fuente.padEnd(47)}║`);
    console.log(`║  📝 Notas: ${vendedor.notas.substring(0, 48).padEnd(48)}║`);
    console.log(`║  🏷️  Tags: ${vendedor.tags.join(', ').substring(0, 48).padEnd(48)}║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  🏠 Propiedades: ${String(vendedor.propiedades.length).padEnd(40)}║`);

    vendedor.propiedades.forEach((prop, i) => {
        const titulo = prop.titulo.length > 52 ? prop.titulo.substring(0, 49) + '...' : prop.titulo;
        console.log(`║  ${String(i + 1).padStart(2)}. ${titulo.padEnd(52)}║`);
        console.log(`║      💰 ${prop.precio.padEnd(50)}║`);
    });

    console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// ============================================
// SCRAPER DE INMUEBLES24
// ============================================

async function scrapeInmuebles24(url, cityMeta = {}) {
    console.log('🚀 Iniciando scraper de Inmuebles24...\n');
    console.log(`📍 URL: ${url}\n`);

    const browser = await puppeteer.launch({
        headless: 'new', // Modo headless (invisible)
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-web-security',
            '--flag-switches-begin',
            '--disable-site-isolation-trials',
            '--flag-switches-end'
        ],
        ignoreDefaultArgs: ['--enable-automation']
    });

    const page = await browser.newPage();

    // Configurar viewport realista
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
    });

    // Headers realistas
    await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    });

    // User agent realista
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Evasiones adicionales (Stealth plugin hace la mayoría)
    await page.evaluateOnNewDocument(() => {
        // Override del lenguaje
        Object.defineProperty(navigator, 'language', {
            get: () => 'es-MX'
        });
        Object.defineProperty(navigator, 'languages', {
            get: () => ['es-MX', 'es', 'en-US', 'en']
        });

        // Chrome runtime
        window.chrome = {
            runtime: {}
        };

        // Permisos
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
    });

    console.log('🌐 Navegando a la página...');
    await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout
    });

    // Esperar a que cargue el contenido
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Hacer clic en "Ver todas las fotos" para cargar la galería completa
    console.log('📸 Buscando botón "Ver todas las fotos"...');
    try {
        const galleryButton = await page.evaluate(() => {
            // Buscar botón que contenga texto "ver todas" o "fotos"
            const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
            const galleryBtn = buttons.find(btn => {
                const text = btn.textContent.toLowerCase();
                return text.includes('ver todas') || text.includes('foto') || text.includes('galería');
            });

            if (galleryBtn) {
                galleryBtn.click();
                return true;
            }
            return false;
        });

        if (galleryButton) {
            console.log('   ✅ Clic en botón de galería');
            // Esperar a que cargue la galería
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            console.log('   ⚠️  Botón de galería no encontrado, continuando...');
        }
    } catch (error) {
        console.log('   ⚠️  Error al abrir galería:', error.message);
    }

    // ============================================
    // CAPTURAR DATOS DEL VENDEDOR (del HTML - SIN enviar datos)
    // ============================================
    console.log('👤 Capturando datos del vendedor...');

    let vendedorData = { nombre: '', telefono: '' };

    try {
        // Extraer nombre y teléfono directamente del HTML
        // El teléfono ya está visible en el código fuente, NO se envían datos
        vendedorData = await page.evaluate(() => {
            const result = { nombre: '', telefono: '' };

            // Buscar nombre del vendedor
            const nameEl = document.querySelector('.publisherCard-module__info-name___2T6ft, a[class*="info-name"]');
            if (nameEl) result.nombre = nameEl.textContent.trim();

            // Buscar teléfono en TODO el HTML (ya está visible, no requiere clic)
            const html = document.documentElement.innerHTML;

            // PRIORIDAD: Buscar primero teléfonos de Culiacán (667/668)
            const culiacanPhone = html.match(/((667|668)\d{7})/);
            if (culiacanPhone) {
                result.telefono = culiacanPhone[1];
            } else {
                // Fallback: buscar otros números de México (10 dígitos):
                // 669 = Mazatlán, 331 = Guadalajara, 81 = Monterrey, etc.
                const phoneMatch = html.match(/((669|331|33|81|55|686|664|618|612|614|656|662|871|222|442|461|477)\d{7,8})/);
                if (phoneMatch) {
                    result.telefono = phoneMatch[1];
                }
            }

            return result;
        });

        console.log(`   👤 Vendedor: ${vendedorData.nombre || 'NO ENCONTRADO'}`);
        console.log(`   📞 Teléfono: ${vendedorData.telefono || 'NO ENCONTRADO'}`);
        console.log(`   ✅ Datos capturados del HTML (sin enviar información personal)`);

    } catch (error) {
        console.log('   ⚠️  Error capturando vendedor:', error.message);
    }

    console.log('📊 Extrayendo datos...');

    const locationContext = {
        cityName: cityMeta.name || cityMeta.cityName || 'Culiacán',
        stateName: cityMeta.state || cityMeta.stateName || 'Sinaloa',
        fallbackLocation: cityMeta.fallbackLocation || `${cityMeta.name || cityMeta.cityName || 'Culiacán'}, ${cityMeta.state || cityMeta.stateName || 'Sinaloa'}`
    };

    const data = await page.evaluate((meta) => {
        const result = {
            title: '',
            price: '',
            location: '',
            description: '',
            bedrooms: 0,
            bathrooms: 0,
            parking: 0,
            construction_area: 0,
            land_area: 0,
            images: [],
            features: [],
            vendedor: { nombre: '', telefono: '' },
            latitude: null,
            longitude: null,
            addressSource: '',
            // Metadatos para detectar duplicados
            propertyId: '',
            publishedDate: '',
            views: 0
        };

        // Título - h1 funciona perfecto
        const titleEl = document.querySelector('h1');
        if (titleEl) result.title = titleEl.textContent.trim();

        // Precio - buscar SOLO el elemento <span> con "MN X,XXX,XXX" (debajo de foto)
        // Este es el precio oficial, NO usar el de la descripción
        const priceElements = Array.from(document.querySelectorAll('span, div')).filter(el => {
            const text = el.textContent.trim();
            return text.match(/^MN\s*[\d,]+$/) && el.children.length === 0;
        });
        if (priceElements.length > 0) {
            const priceText = priceElements[0].textContent.trim();
            const priceMatch = priceText.match(/([\d,]+)/);
            if (priceMatch) {
                result.price = `MN ${priceMatch[1]}`;
            }
        }

        // ============================================
        // SISTEMA INTELIGENTE DE DETECCIÓN DE DIRECCIÓN MÁS COMPLETA
        // ============================================
        // Detecta TODAS las direcciones posibles en la página y selecciona
        // la más completa usando un sistema de puntuación basado en componentes

        const bodyText = document.body.innerText;
        const lines = bodyText.split('\n');

        // Función para validar si una dirección es utilizable
        function usableAddress(addr) {
            return !!addr && addr.length > 10 && !/inmuebles24/i.test(addr) && !/^\s*casa\s*$/i.test(addr);
        }

        // Función para limpiar breadcrumbs
        function cleanBreadcrumb(breadcrumb) {
            const blacklist = ['Inmuebles24', 'Casa', 'Departamento', 'Venta', 'Renta', 'Clasificado', 'Propiedades'];
            const parts = breadcrumb.split(/\s{2,}|›|·|>/).map(p => p.trim()).filter(Boolean);
            const filtered = parts.filter(p => !blacklist.some(b => p.toLowerCase().includes(b.toLowerCase())));
            // Tomar últimos 3 segmentos (colonia, ciudad, estado)
            return filtered.slice(-3).join(', ');
        }

        // Función para calcular puntuación de completitud de dirección
        function scoreAddress(address) {
            let score = 0;
            const lower = address.toLowerCase();

            // +5 puntos: Tiene número de calle (ej: "2609", "#123")
            if (/\d+/.test(address)) score += 5;

            // +4 puntos: Tiene nombre de calle (ej: "Blvd", "Av", "Calle", "Privada")
            if (/(blvd|boulevard|avenida|av\.|calle|c\.|privada|priv\.|paseo|prol\.|prolongación)/i.test(address)) score += 4;

            // +3 puntos: Tiene colonia/fraccionamiento específico (ej: "Fracc. Las Quintas")
            if (/(fracc\.|fraccionamiento|colonia|col\.|residencial|priv\.|privada)/i.test(address)) score += 3;

            // +2 puntos: Tiene múltiples componentes (comas = separadores)
            const commaCount = (address.match(/,/g) || []).length;
            score += Math.min(commaCount * 2, 6); // Máximo 6 puntos por comas

            // +1 punto: Incluye municipio/ciudad
            if (/(culiacán|monterrey|mazatlán)/i.test(address)) score += 1;

            // +1 punto: Incluye estado
            if (/(sinaloa|nuevo león)/i.test(address)) score += 1;

            // Penalización -3: Dirección muy corta (probablemente incompleta)
            if (address.length < 30) score -= 3;

            // Penalización -5: Solo tiene ciudad y estado (ej: "Culiacán, Sinaloa")
            if (address.match(/^(culiacán|monterrey|mazatlán),?\s*(sinaloa|nuevo león)?$/i)) score -= 5;

            return score;
        }

        // Recolectar TODAS las direcciones candidatas de diferentes fuentes
        const addressCandidates = [];

        // ============================================
        // FUENTES PRIORITARIAS (ChatGPT - Octubre 2025)
        // ============================================

        // FUENTE PRIORITARIA 1: JSON-LD con datos estructurados
        function appendCityState(parts) {
            const lowerParts = parts.map(p => p.toLowerCase());
            if (meta?.cityName && !lowerParts.some(part => part.includes(meta.cityName.toLowerCase()))) {
                parts.push(meta.cityName);
            }
            if (meta?.stateName && !lowerParts.some(part => part.includes(meta.stateName.toLowerCase()))) {
                parts.push(meta.stateName);
            }
            return parts;
        }

        function registerAddressCandidate(address, baseScore, source) {
            if (!address) return;
            const cleaned = address
                .replace(/\s+,/g, ',')
                .replace(/,\s+/g, ', ')
                .replace(/,\s*,/g, ', ')
                .replace(/\s+/g, ' ')
                .trim();
            if (!usableAddress(cleaned)) return;
            const score = scoreAddress(cleaned) + (baseScore || 0);
            addressCandidates.push({
                address: cleaned,
                score,
                source
            });
            console.log(`   🎯 ${source} address found: ${cleaned} (score: ${score})`);
        }

        function extractJsonLdAddress(node) {
            if (!node || typeof node !== 'object') return;

            // Coordenadas
            if (node.geo && node.geo.latitude && node.geo.longitude) {
                const lat = parseFloat(node.geo.latitude);
                const lng = parseFloat(node.geo.longitude);
                if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                    result.latitude = lat;
                    result.longitude = lng;
                    console.log(`   📍 Coordenadas from JSON-LD: ${lat}, ${lng}`);
                }
            }

            // Direcciones anidadas
            if (node.address) {
                const addrNode = node.address;
                if (typeof addrNode === 'string') {
                    const parts = appendCityState([addrNode.trim()]);
                    registerAddressCandidate(parts.join(', '), 10, 'JSON-LD');
                } else if (typeof addrNode === 'object') {
                    const sanitizePart = (value) => {
                        if (!value || typeof value !== 'string') return null;
                        return value.replace(/\s+/g, ' ').replace(/,\s*$/, '').trim();
                    };

                    const parts = [];
                    const street = sanitizePart(addrNode.streetAddress);
                    const locality = sanitizePart(addrNode.addressLocality);
                    const region = sanitizePart(addrNode.addressRegion);
                    const postalCode = sanitizePart(addrNode.postalCode);

                    if (street) parts.push(street);
                    if (locality) parts.push(locality);
                    if (region) parts.push(region);
                    if (postalCode && /\d/.test(postalCode)) parts.push(postalCode);

                    if (parts.length) {
                        const uniqueParts = [];
                        parts.forEach(part => {
                            const normalized = part.toLowerCase();
                            if (!uniqueParts.some(existing => existing.toLowerCase() === normalized)) {
                                uniqueParts.push(part);
                            }
                        });
                        appendCityState(uniqueParts);
                        registerAddressCandidate(uniqueParts.join(', '), 10, 'JSON-LD');
                    }
                }
            }

            // Recursión en @graph o array de elementos anidados
            if (Array.isArray(node['@graph'])) {
                node['@graph'].forEach(extractJsonLdAddress);
            }
        }

        try {
            const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
            jsonLdScripts.forEach(script => {
                try {
                    const jsonContent = script.textContent.trim();
                    if (!jsonContent) return;
                    const parsed = JSON.parse(jsonContent);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(item => extractJsonLdAddress(item));
                    } else {
                        extractJsonLdAddress(parsed);
                    }
                } catch (err) {
                    console.log('   ⚠️  Error parsing JSON-LD snippet:', err.message);
                }
            });
        } catch (e) {
            console.log('   ⚠️  Error reading JSON-LD scripts:', e.message);
        }

        // FUENTE PRIORITARIA 2: data-testid="address-text"
        const addressTestId = document.querySelector('[data-testid="address-text"]');
        if (addressTestId) {
            const addr = addressTestId.textContent.trim();
            if (addr) {
                const parts = appendCityState([addr]);
                registerAddressCandidate(parts.join(', '), 8, 'data-testid');
            }
        }

        // FUENTE PRIORITARIA 3: #mapSection o section[data-testid="property-features"]
        const mapSection = document.querySelector('#mapSection li span, section[data-testid="property-features"] li span');
        if (mapSection) {
            const addr = mapSection.textContent.trim();
            if (addr) {
                const parts = appendCityState([addr]);
                registerAddressCandidate(parts.join(', '), 7, 'mapSection');
            }
        }

        // ============================================
        // FUENTES SECUNDARIAS (existentes)
        // ============================================

        // FUENTE 1: Líneas del body text con patrón de dirección
        lines.forEach(line => {
            const trimmed = line.trim();
            // Buscar líneas que contengan ciudad/estado y tengan longitud razonable
            if (trimmed.length > 15 && trimmed.length < 200 &&
                /(culiacán|monterrey|mazatlán|sinaloa|nuevo león)/i.test(trimmed)) {

                // Filtrar líneas que parecen direcciones (tienen comas o palabras clave)
                if (trimmed.match(/,/) ||
                    /(fracc|colonia|blvd|avenida|calle|privada)/i.test(trimmed)) {

                    const cleaned = trimmed.replace(/\s+,/g, ',').replace(/,\s+/g, ', ');
                    registerAddressCandidate(cleaned, 0, 'bodyText');
                }
            }
        });

        // FUENTE 2: Breadcrumbs y elementos de navegación
        const breadcrumbs = Array.from(document.querySelectorAll('a, span, div[class*="location"], div[class*="address"]')).filter(el => {
            const text = el.textContent.toLowerCase();
            return (text.includes('culiacán') || text.includes('monterrey') || text.includes('mazatlán') ||
                    text.includes('sinaloa') || text.includes('nuevo león')) &&
                   text.length > 15 && text.length < 200;
        });

        breadcrumbs.forEach(el => {
            const text = el.textContent.trim();
            if (text && text.match(/,/)) {
                // Aplicar cleanBreadcrumb si contiene palabras prohibidas
                const hasBlacklisted = /inmuebles24|clasificado|propiedades/i.test(text);
                const cleaned = hasBlacklisted ? cleanBreadcrumb(text) : text.replace(/\s+,/g, ',').replace(/,\s+/g, ', ');
                registerAddressCandidate(cleaned, hasBlacklisted ? 2 : 0, 'breadcrumbs' + (hasBlacklisted ? '-cleaned' : ''));
            }
        });

        // FUENTE 3: Meta tags y datos estructurados
        const metaLocation = document.querySelector('meta[property="og:street-address"], meta[name="address"]');
        if (metaLocation) {
            const address = metaLocation.getAttribute('content');
            if (address && address.length > 15) {
                registerAddressCandidate(address, 1, 'metaTags');
            }
        }

        // Eliminar duplicados (misma dirección de diferentes fuentes)
        const uniqueCandidates = [];
        const seenAddresses = new Set();

        addressCandidates.forEach(candidate => {
            const normalized = candidate.address.toLowerCase().replace(/\s+/g, '');
            if (!seenAddresses.has(normalized)) {
                seenAddresses.add(normalized);
                uniqueCandidates.push(candidate);
            }
        });

        // Ordenar por puntuación (mayor a menor)
        uniqueCandidates.sort((a, b) => b.score - a.score);

        // Debug: Mostrar todas las candidatas con puntuación
        if (uniqueCandidates.length > 0) {
            console.log('\n   📍 Direcciones detectadas (ordenadas por completitud):');
            uniqueCandidates.slice(0, 5).forEach((candidate, i) => {
                console.log(`   ${i + 1}. [${candidate.score} pts] ${candidate.address.substring(0, 80)}${candidate.address.length > 80 ? '...' : ''}`);
            });
        }

        // Seleccionar la dirección con mayor puntuación
        if (uniqueCandidates.length > 0 && uniqueCandidates[0].score >= 0) {
            let selectedAddress = uniqueCandidates[0].address;
            if (meta?.cityName && !selectedAddress.toLowerCase().includes(meta.cityName.toLowerCase())) {
                selectedAddress += `, ${meta.cityName}`;
            }
            if (meta?.stateName && !selectedAddress.toLowerCase().includes(meta.stateName.toLowerCase())) {
                selectedAddress += `, ${meta.stateName}`;
            }

            // Validación final: asegurar que la dirección es utilizable
            if (usableAddress(selectedAddress)) {
                result.location = selectedAddress;
                console.log(`   ✅ Dirección seleccionada: ${result.location} (${uniqueCandidates[0].source})`);
                result.addressSource = uniqueCandidates[0].source;
            } else {
                console.log(`   ⚠️  Dirección descartada (no utilizable): ${selectedAddress}`);
                result.location = meta?.fallbackLocation || 'Culiacán, Sinaloa';
                console.log('   ⚠️  Usando fallback: Culiacán, Sinaloa');
            }
        } else {
            // Fallback final: usar ciudad y estado detectados
            result.location = meta?.fallbackLocation || 'Culiacán, Sinaloa';
            console.log('   ⚠️  No se encontró dirección específica, usando fallback');
        }

        // Descripción - buscar en varios posibles contenedores
        const descSelectors = ['[class*="description"]', 'p[class*="detail"]', 'section p'];
        for (const selector of descSelectors) {
            const descEls = document.querySelectorAll(selector);
            for (const el of descEls) {
                if (el.textContent.length > 100 && el.textContent.length < 2000) {
                    result.description = el.textContent.trim();
                    break;
                }
            }
            if (result.description) break;
        }

        // Detección de "Amueblada/Sin amueblar" (para RENTAS)
        const fullText = bodyText + ' ' + (result.description || '');
        if (/amueblad[ao]/i.test(fullText)) {
            result.furnished = 'Amueblada';
        } else if (/semi(\s|-)?amueblad[ao]/i.test(fullText)) {
            result.furnished = 'Semi-amueblada';
        } else if (/(sin amueblar|no amueblad[ao]|sin muebles)/i.test(fullText)) {
            result.furnished = 'Sin amueblar';
        } else {
            result.furnished = 'Sin especificar';
        }

        // PASO 1: Buscar datos en TODO el body text (incluyendo descripción)
        // Reutilizar bodyText ya declarado arriba para ubicación

        // MÉTODO 1: Buscar patrón "X m² lote Y m² constr" (formato principal Inmuebles24)
        const loteConstruccionMatch = bodyText.match(/(\d+)\s*m²\s*lote\s+(\d+)\s*m²\s*constr/i);
        if (loteConstruccionMatch) {
            result.land_area = parseInt(loteConstruccionMatch[1]);
            result.construction_area = parseInt(loteConstruccionMatch[2]);
            console.log(`   ✅ M² detectados: ${result.land_area}m² lote, ${result.construction_area}m² construcción`);
        }

        // MÉTODO 2 (fallback): Buscar "Mts de terreno X.XX" en descripción
        if (!result.land_area) {
            const terrenoMatch = bodyText.match(/Mts?\s+de\s+terreno\s+([\d.,]+)/i);
            if (terrenoMatch) {
                result.land_area = parseFloat(terrenoMatch[1].replace(',', '.'));
            }
        }

        // MÉTODO 3 (fallback): Buscar "Construcción X" en descripción
        if (!result.construction_area) {
            const construccionMatch = bodyText.match(/Construcción\s+([\d.,]+)/i);
            if (construccionMatch) {
                result.construction_area = parseFloat(construccionMatch[1].replace(',', '.'));
            }
        }

        // PASO 2: Buscar características en elementos de texto corto (debajo del mapa)
        // Recorrer EN REVERSA para priorizar datos debajo del mapa (al final del HTML)
        const allTextElements = Array.from(document.querySelectorAll('li, span, div, p')).reverse();
        allTextElements.forEach(el => {
            const text = el.textContent.trim().toLowerCase();

            // Solo procesar textos cortos y sin hijos complejos
            if (text.length > 100 || el.children.length > 3) return;

            // Recámaras (buscar número + "recámara" o "dormitorio") - tomar ÚLTIMO match (más abajo)
            if (!result.bedrooms && (text.match(/(\d+)\s*(recámara|dormitorio)/i))) {
                const match = text.match(/(\d+)\s*(recámara|dormitorio)/i);
                if (match) result.bedrooms = parseInt(match[1]);
            }

            // Baños - tomar ÚLTIMO match
            if (!result.bathrooms && text.match(/(\d+)\s*baño/i)) {
                const match = text.match(/(\d+)\s*baño/i);
                if (match) result.bathrooms = parseInt(match[1]);
            }

            // Estacionamiento/Cochera - tomar ÚLTIMO match
            if (!result.parking && text.match(/(\d+)\s*(estacionamiento|cochera)/i)) {
                const match = text.match(/(\d+)\s*(estacionamiento|cochera)/i);
                if (match) result.parking = parseInt(match[1]);
            }

            // Guardar características relevantes (EXCEPTO edad/antigüedad)
            if ((text.includes('recámara') || text.includes('baño') || text.includes('m²') ||
                text.includes('cochera') || text.includes('estacionamiento')) &&
                !text.includes('año') && !text.includes('antigüedad') && text.length < 100) {
                result.features.push(text);
            }
        });

        // Imágenes - buscar URLs de naventcdn.com/avisos
        const imgElements = document.querySelectorAll('img');
        const imageUrls = new Set();

        imgElements.forEach(img => {
            const src = img.src || img.getAttribute('data-src') || img.getAttribute('srcset') || '';

            // Buscar imágenes de naventcdn.com/avisos
            if (src.includes('naventcdn.com/avisos/')) {
                // Convertir a versión 1200x1200 para alta resolución
                let highRes = src;
                if (src.includes('/360x266/')) {
                    highRes = src.replace('/360x266/', '/1200x1200/');
                } else if (src.includes('/720x532/')) {
                    highRes = src.replace('/720x532/', '/1200x1200/');
                }

                // Limpiar query params
                highRes = highRes.split('?')[0];
                imageUrls.add(highRes);
            }
        });

        result.images = Array.from(imageUrls);

        // ============================================
        // METADATOS PARA DETECCIÓN DE DUPLICADOS
        // ============================================

        // Fecha de publicación - buscar en elementos con clase userViews
        const dateEl = document.querySelector('.userViews-module__post-antiquity-views___8Zfch, [class*="post-antiquity"]');
        if (dateEl) {
            result.publishedDate = dateEl.textContent.trim();
        }

        // Visualizaciones - extraer número de "X visualizaciones"
        const viewsText = document.body.innerText.match(/(\d+)\s+visualizaciones?/i);
        if (viewsText) {
            result.views = parseInt(viewsText[1]);
        }

        return result;
    }, locationContext);

    // Agregar datos del vendedor al objeto data
    data.vendedor = vendedorData;

    // Extraer ID de propiedad de la URL
    const idMatch = url.match(/-(\d+)\.html$/);
    if (idMatch) {
        data.propertyId = idMatch[1];
    }

    await browser.close();

    console.log('\n✅ Datos extraídos exitosamente:');
    console.log(`   📝 Título: ${data.title}`);
    console.log(`   💰 Precio: ${data.price}`);
    console.log(`   📍 Ubicación: ${data.location}`);
    console.log(`   🛏️  ${data.bedrooms} recámaras`);
    console.log(`   🛁 ${data.bathrooms} baños`);
    console.log(`   📐 ${data.construction_area || 'N/A'}m² construcción`);
    console.log(`   🏞️  ${data.land_area || 'N/A'}m² terreno`);
    console.log(`   📸 ${data.images.length} imágenes encontradas`);
    if (data.vendedor.nombre || data.vendedor.telefono) {
        console.log(`   👤 Vendedor: ${data.vendedor.nombre || 'N/A'}`);
        console.log(`   📞 Tel: ${data.vendedor.telefono || 'N/A'}`);
    }
    console.log(`\n   🔍 METADATOS (para detección de duplicados):`);
    console.log(`   🆔 ID Propiedad: ${data.propertyId || 'NO ENCONTRADO'}`);
    console.log(`   📅 Fecha: ${data.publishedDate || 'NO ENCONTRADA'}`);
    console.log(`   👁️  Vistas: ${data.views || 0}`);
    console.log('');

    return data;
}

// ============================================
// DESCARGA DE FOTOS
// ============================================

async function downloadPhotos(images, outputDir) {
    console.log(`📥 Descargando ${images.length} fotos...\n`);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let downloadedCount = 0;

    for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        const filename = `foto-${i + 1}.jpg`;
        const filepath = path.join(outputDir, filename);

        try {
            await downloadImage(imageUrl, filepath);
            downloadedCount++;
            console.log(`   ✅ ${filename}`);
        } catch (error) {
            console.log(`   ❌ Error descargando foto ${i + 1}: ${error.message}`);
        }
    }

    console.log(`\n✅ ${downloadedCount}/${images.length} fotos descargadas\n`);
    return downloadedCount;
}

// ============================================
// GENERACIÓN DE HTML CON MASTER TEMPLATE
// ============================================

function generateHTML(data, slug, photoCount, cityConfig) {
    console.log(`📄 Generando HTML desde template La Primavera para ${cityConfig.name}...\n`);

    // Leer template completo de La Primavera
    const templatePath = cityConfig.templatePath;
    let html = fs.readFileSync(templatePath, 'utf8');

    // Datos calculados
    const priceFormatted = formatPrice(data.price);
    const priceNumeric = extractPriceNumber(data.price);
    const neighborhood = data.location.split(',')[0].trim();
    const bedrooms = data.bedrooms || 'N/A';
    const bathrooms = data.bathrooms || 'N/A';
    const construction = data.construction_area || null;
    const landArea = data.land_area || null;

    // Construcción condicional texto m²
    const constructionText = construction ? `${construction}m²` : 'N/A';
    const landAreaText = landArea ? `${landArea}m²` : 'N/A';

    const description = data.description || `${data.title}. ${bedrooms !== 'N/A' ? bedrooms + ' recámaras, ' : ''}${bathrooms !== 'N/A' ? bathrooms + ' baños ' : ''}en ${neighborhood}.`;

    // REEMPLAZOS EN METADATA Y HEAD
    html = html.replace(/<title>.*?<\/title>/s,
        `<title>Casa en Venta ${priceFormatted} - ${neighborhood}, ${cityConfig.name} | Hector es Bienes Raíces</title>`);

    html = html.replace(/<meta name="description" content=".*?">/,
        `<meta name="description" content="${data.title} en ${data.location}. ${bedrooms !== 'N/A' ? bedrooms + ' recámaras, ' : ''}${bathrooms !== 'N/A' ? bathrooms + ' baños, ' : ''}${constructionText} construcción. Agenda tu visita hoy.">`);

    html = html.replace(/<meta name="keywords" content=".*?">/,
        `<meta name="keywords" content="casa venta ${cityConfig.name}, ${neighborhood}, casa remodelada, ${bedrooms !== 'N/A' ? bedrooms + ' recámaras, ' : ''}cochera techada, ${data.location}">`);

    html = html.replace(/<link rel="canonical" href=".*?">/,
        `<link rel="canonical" href="https://casasenventa.info/${cityConfig.folder}/${slug}/">`);

    // Open Graph
    html = html.replace(/<meta property="og:title" content=".*?">/,
        `<meta property="og:title" content="Casa en Venta ${priceFormatted} - ${neighborhood}">`);

    html = html.replace(/<meta property="og:description" content=".*?">/s,
        `<meta property="og:description" content="${bedrooms !== 'N/A' ? bedrooms + ' recámaras • ' : ''}${bathrooms !== 'N/A' ? bathrooms + ' baños • ' : ''}${constructionText} construcción • ${landAreaText} terreno">`);

    html = html.replace(/<meta property="og:url" content=".*?">/,
        `<meta property="og:url" content="https://casasenventa.info/${cityConfig.folder}/${slug}/">`);

    html = html.replace(/<meta property="og:image" content=".*?">/,
        `<meta property="og:image" content="https://casasenventa.info/${cityConfig.folder}/${slug}/images/foto-1.jpg">`);

    // Schema.org - reemplazar bloque completo
    const schemaStart = html.indexOf('<script type="application/ld+json">');
    const schemaEnd = html.indexOf('</script>', schemaStart) + 9;
    const newSchema = `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SingleFamilyResidence",
      "name": "${data.title}",
      "description": "${description}",
      "url": "https://casasenventa.info/${cityConfig.folder}/${slug}/",
      "image": [
        ${Array.from({length: Math.min(photoCount, 10)}, (_, i) =>
            `"https://casasenventa.info/${cityConfig.folder}/${slug}/images/foto-${i+1}.jpg"`).join(',\n        ')}
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "${neighborhood}",
        "addressLocality": "${data.location}",
        "addressRegion": "${cityConfig.state}",
        "postalCode": "80000",
        "addressCountry": "MX"
      }${construction ? `,
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": ${construction},
        "unitCode": "MTK"
      }` : ''}${landArea ? `,
      "lotSize": {
        "@type": "QuantitativeValue",
        "value": ${landArea},
        "unitCode": "MTK"
      }` : ''},
      "numberOfBedrooms": ${bedrooms !== 'N/A' ? bedrooms : 3},
      "numberOfBathroomsTotal": ${bathrooms !== 'N/A' ? bathrooms : 2},
      "numberOfFullBathrooms": ${bathrooms !== 'N/A' ? bathrooms : 2},
      "offers": {
        "@type": "Offer",
        "price": "${priceNumeric}",
        "priceCurrency": "MXN"
      },
      "amenityFeature": [
          {
                    "@type": "LocationFeatureSpecification",
                    "name": "Estacionamiento",
                    "value": true
          },
          {
                    "@type": "LocationFeatureSpecification",
                    "name": "Jardín",
                    "value": true
          }
]
    }
    </script>`;
    html = html.substring(0, schemaStart) + newSchema + html.substring(schemaEnd);

    // HERO SECTION - Título y subtitle
    html = html.replace(/<h1 class="hero-title">.*?<\/h1>/s,
        `<h1 class="hero-title">${data.title}</h1>`);

    html = html.replace(/<p class="hero-subtitle">.*?<\/p>/,
        `<p class="hero-subtitle">${description}</p>`);

    // CAROUSEL SLIDES - reemplazar bloque completo de slides
    const carouselStart = html.indexOf('<div class="carousel-slide active"');
    const carouselEnd = html.lastIndexOf('</div>', html.indexOf('<!-- Navigation arrows -->')) + 6;

    let carouselSlides = '';
    for (let i = 0; i < photoCount; i++) {
        const activeClass = i === 0 ? ' active' : '';
        const loading = i === 0 ? 'eager' : 'lazy';
        carouselSlides += `
                <div class="carousel-slide${activeClass}" data-slide="${i}">
                    <img src="images/foto-${i + 1}.jpg"
                         alt="${slug} - Vista ${i + 1}"
                         loading="${loading}"
                         decoding="async"
                         onclick="openLightbox(${i})">
                </div>`;
    }
    html = html.substring(0, carouselStart) + carouselSlides.trim() + '\n                ' + html.substring(carouselEnd);

    // CAROUSEL DOTS
    const dotsStart = html.indexOf('<div class="carousel-dots">');
    const dotsEnd = html.indexOf('</div>', dotsStart) + 6;
    let carouselDots = '<div class="carousel-dots">\n';
    for (let i = 0; i < photoCount; i++) {
        const activeClass = i === 0 ? ' active' : '';
        carouselDots += `                    <span class="carousel-dot${activeClass}" onclick="goToSlide(${i})"></span>\n`;
    }
    carouselDots += '                </div>';
    html = html.substring(0, dotsStart) + carouselDots + html.substring(dotsEnd);

    // LIGHTBOX IMAGES ARRAY en JavaScript
    const lightboxArrayMatch = html.match(/const lightboxImages = \[[\s\S]*?\];/);
    if (lightboxArrayMatch) {
        const newLightboxArray = `const lightboxImages = [
        ${Array.from({length: photoCount}, (_, i) => `'images/foto-${i+1}.jpg'`).join(',\n        ')}
    ];`;
        html = html.replace(lightboxArrayMatch[0], newLightboxArray);
    }

    // TOTAL SLIDES en JavaScript
    html = html.replace(/const totalSlides = \d+;/, `const totalSlides = ${photoCount};`);

    // FEATURES SECTION - actualizar números (emojis)
    html = html.replace(/🛏️\s*\d+\s*recámaras?/g, `🛏️ ${bedrooms !== 'N/A' ? bedrooms : 'N/A'} recámaras`);
    html = html.replace(/🛁\s*\d+(\.\d+)?\s*baños?/g, `🛁 ${bathrooms !== 'N/A' ? bathrooms : 'N/A'} baños`);
    html = html.replace(/📐\s*\d+(\.\d+)?\s*m²\s*construcción/g, `📐 ${constructionText} construcción`);
    html = html.replace(/🏞️\s*\d+(\.\d+)?\s*m²\s*terreno/g, `🏞️ ${landAreaText} terreno`);

    // FEATURES COMPACT SECTION - iconos debajo del botón compartir (con parking)
    // Recámaras (icon bed)
    html = html.replace(/(<i class="fas fa-bed"><\/i>\s*<span class="feature-value">)\d+(<\/span>)/g,
        `$1${bedrooms !== 'N/A' ? bedrooms : 'N/A'}$2`);

    // Baños (icon bath)
    html = html.replace(/(<i class="fas fa-bath"><\/i>\s*<span class="feature-value">)\d+(\.\d+)?(<\/span>)/g,
        `$1${bathrooms !== 'N/A' ? bathrooms : 'N/A'}$3`);

    // Estacionamiento (icon car)
    html = html.replace(/(<i class="fas fa-car"><\/i>\s*<span class="feature-value">)\d+(<\/span>)/g,
        `$1${data.parking || 'N/A'}$2`);

    // m² Construcción (icon ruler-combined)
    html = html.replace(/(<i class="fas fa-ruler-combined"><\/i>\s*<span class="feature-value">)\d+(\.\d+)?(<\/span>)/g,
        `$1${construction || 'N/A'}$3`);

    // m² Terreno (icon vector-square)
    html = html.replace(/(<i class="fas fa-vector-square"><\/i>\s*<span class="feature-value">)\d+(\.\d+)?(<\/span>)/g,
        `$1${landArea || 'N/A'}$3`);

    // INFO BADGES - Badges horizontales debajo del héroe
    // m² Construcción (badge con ruler-combined)
    html = html.replace(/(<i class="fas fa-ruler-combined"><\/i>\s*<span>)\d+(\.\d+)?\s*m²\s*construcción(<\/span>)/g,
        `$1${constructionText} construcción$3`);

    // m² Terreno (badge con border-all)
    html = html.replace(/(<i class="fas fa-border-all"><\/i>\s*<span>)\d+(\.\d+)?\s*m²\s*terreno(<\/span>)/g,
        `$1${landAreaText} terreno$3`);

    // DETAILS SECTION - actualizar precio y ubicación
    html = html.replace(/<div class="detail-value price">\$[\d,]+<\/div>/g,
        `<div class="detail-value price">${priceFormatted}</div>`);

    html = html.replace(/<div class="detail-value">.*?<\/div>.*?<!-- ubicación -->/s,
        `<div class="detail-value">${data.location}</div> <!-- ubicación -->`);

    // PRICE BADGE en hero
    html = html.replace(/<span class="price-amount">\$[\d,]+<\/span>/g,
        `<span class="price-amount">${priceFormatted}</span>`);

    // PRICE CARD - precio value
    html = html.replace(/<span class="price-value">\$[\d,]+<\/span>/g,
        `<span class="price-value">${priceFormatted}</span>`);

    // STICKY PRICE BAR - precio
    html = html.replace(/<span class="sticky-price-amount">\$[\d,]+<\/span>/g,
        `<span class="sticky-price-amount">${priceFormatted}</span>`);

    // CALCULATOR - precio input value (buscar con espacios en el value)
    html = html.replace(/id="precio-zil"\s+value="[^"]+"/g, `id="precio-zil" value="${priceFormatted}"`);
    html = html.replace(/value="[^"]+"\s+id="precio-zil"/g, `value="${priceFormatted}" id="precio-zil"`);

    // CALCULATOR - default fallback en JavaScript
    html = html.replace(/const precio = parseFloat\(precioInput\.replace\(\/\[^\d\]\/g, ''\)\) \|\| \d+;/g,
        `const precio = parseFloat(precioInput.replace(/[^\\d]/g, '')) || ${priceNumeric};`);

    // MAPA - reemplazar iframe con mapa interactivo personalizado
    const customMapHTML = generateMapWithCustomMarker({
        location: data.location,
        price: data.price,
        title: data.title,
        photoCount: photoCount, // Total de fotos descargadas
        bedrooms: bedrooms !== 'N/A' ? bedrooms : 'N/A',
        bathrooms: bathrooms !== 'N/A' ? bathrooms : 'N/A',
        area: constructionText, // Área de construcción formateada
        whatsapp: cityConfig.whatsapp, // WhatsApp según ciudad
        propertyIndex: 0, // Por ahora siempre 0, luego se puede calcular por colonia
        cityCoords: cityConfig.coords // Coordenadas de la ciudad para fallback
    });

    // Reemplazar toda la sección del mapa (div + script completo + API script)
    // Buscar desde <div id="map-container"> hasta DESPUÉS del script del API de Google Maps
    html = html.replace(
        /<div id="map-container"[\s\S]*?<\/script>[\s\S]*?<!-- Cargar Google Maps API -->[\s\S]*?<script src="https:\/\/maps\.googleapis\.com\/maps\/api\/js[^>]*><\/script>/,
        customMapHTML
    );

    // LOCATION SUBTITLE - texto arriba del mapa (solo ubicación corta, como en Culiacán)
    // Extraer solo la colonia/fraccionamiento de la ubicación completa
    const locationShortForSubtitle = data.location.split(',')[0].trim(); // Primera parte antes de la coma
    html = html.replace(/<p class="location-subtitle">.*?<\/p>/g,
        `<p class="location-subtitle">${locationShortForSubtitle}, ${cityConfig.name}</p>`);

    // STICKY BAR LABEL - nombre de la casa
    html = html.replace(/<span class="sticky-price-label">Casa [^<]+<\/span>/g,
        `<span class="sticky-price-label">Casa ${neighborhood}</span>`);

    // FOOTER - dirección completa
    html = html.replace(/<p><i class="fas fa-map-marker-alt"><\/i>\s*[^<]+<\/p>/g,
        `<p><i class="fas fa-map-marker-alt"></i> ${data.title}, ${data.location}</p>`);

    // SHARE TEXT - texto para compartir
    html = html.replace(/const text = encodeURIComponent\('¡Mira esta increíble casa en venta en [^']+'\);/g,
        `const text = encodeURIComponent('¡Mira esta increíble casa en venta en ${neighborhood}! ${priceFormatted}');`);

    // WHATSAPP LINKS - actualizar mensaje con ciudad dinámica
    const whatsappMsg = encodeURIComponent(
        `Hola! Me interesa la propiedad:\n${data.title}\n${priceFormatted}\n${data.location}\nhttps://casasenventa.info/${cityConfig.folder}/${slug}/`
    );
    html = html.replace(/https:\/\/wa\.me\/52\d+\?text=[^"]+/g,
        `https://wa.me/${cityConfig.whatsapp}?text=${whatsappMsg}`);

    // CRÍTICO: Reemplazar API key vieja con la nueva
    const OLD_API_KEY = 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8';
    const NEW_API_KEY = CONFIG.googleMaps.key;
    html = html.replace(new RegExp(OLD_API_KEY, 'g'), NEW_API_KEY);
    console.log('   ✅ API key actualizada a nueva key');

    // Copiar styles.css con ruta dinámica
    const stylesSource = cityConfig.stylesSource;
    const stylesPath = `${cityConfig.folder}/${slug}/styles.css`;
    if (fs.existsSync(stylesSource)) {
        fs.copyFileSync(stylesSource, stylesPath);
        console.log('   ✅ styles.css copiado');
    }

    console.log(`   ✅ HTML generado con template La Primavera para ${cityConfig.name}`);
    return html;
}

// ============================================
// INTEGRACIÓN A INDEX DE CIUDAD
// ============================================

function addToIndex(data, slug, cityConfig) {
    console.log(`📝 Agregando tarjeta a ${cityConfig.indexPath}...\n`);

    const indexPath = cityConfig.indexPath;
    let indexHtml = fs.readFileSync(indexPath, 'utf8');

    const card = `
    <!-- BEGIN CARD-ADV ${slug} -->
    <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
         data-href="${slug}/index.html">
        <div class="relative aspect-video">
            <div class="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                ${formatPrice(data.price)}
            </div>

            <div class="carousel-container" data-current="0">
                <img src="${slug}/images/foto-1.jpg"
                     alt="${data.title}"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image active">
                <img src="${slug}/images/foto-2.jpg"
                     alt="${data.title}"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image hidden">
                <img src="${slug}/images/foto-3.jpg"
                     alt="${data.title}"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image hidden">
                <img src="${slug}/images/foto-4.jpg"
                     alt="${data.title}"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image hidden">
                <img src="${slug}/images/foto-5.jpg"
                     alt="${data.title}"
                     loading="lazy"
                     decoding="async"
                     class="w-full h-full object-cover carousel-image hidden">
                <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <button class="favorite-btn absolute top-3 left-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors z-20">
                <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
            </button>
        </div>

        <div class="p-6">
            <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">${formatPrice(data.price)}</h3>
            <p class="text-gray-600 mb-4 font-poppins">${data.title}</p>

            <div class="flex flex-wrap gap-3 mb-6">
                <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    ${data.bedrooms || 'N/A'} Recámaras
                </div>
                <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                    </svg>
                    ${data.bathrooms || 'N/A'} Baños
                </div>
                <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"/>
                    </svg>
                    ${data.construction_area ? data.construction_area + 'm²' : 'N/A'}
                </div>
            </div>

            <a href="${slug}/index.html"
               class="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center font-semibold py-3 px-6 rounded-lg transition-all duration-200">
                Ver Detalles
            </a>
        </div>
    </div>
    <!-- END CARD-ADV ${slug} -->
`;

    // Insertar AL INICIO (después del primer <!-- BEGIN CARD-ADV)
    // Esto hace que las propiedades nuevas aparezcan PRIMERO (más recientes arriba)
    const firstCardMatch = indexHtml.match(/<!-- BEGIN CARD-ADV [a-z0-9-]+ -->/);

    if (firstCardMatch) {
        const firstCardIndex = indexHtml.indexOf(firstCardMatch[0]);
        indexHtml = indexHtml.substring(0, firstCardIndex) + card + '\n\n            ' + indexHtml.substring(firstCardIndex);
        console.log(`   ✅ Tarjeta agregada AL INICIO de ${cityConfig.indexPath} (más reciente)\n`);
    } else {
        console.log('   ⚠️  No se encontró la primera tarjeta, agregando al final...');
        const gridEndRegex = /\n\n\s*<!-- Ver más propiedades \(resto de propiedades como muestra\) -->/;
        indexHtml = indexHtml.replace(gridEndRegex, `\n\n${card}\n\n            <!-- Ver más propiedades (resto de propiedades como muestra) -->`);
        console.log(`   ✅ Tarjeta agregada al final de ${cityConfig.indexPath}\n`);
    }

    fs.writeFileSync(indexPath, indexHtml, 'utf8');
}

// ============================================
// AGREGAR PROPIEDAD AL MAPA MODAL
// ============================================

function addPropertyToMap(data, slug, photoCount, cityConfig) {
    console.log(`🗺️  Agregando propiedad al mapa modal de ${cityConfig.name}...\n`);

    const indexPath = cityConfig.indexPath;
    let indexHtml = fs.readFileSync(indexPath, 'utf8');

    // Verificar si tenemos coordenadas del JSON-LD
    if (!data.latitude || !data.longitude) {
        console.log(`   ⚠️  No se encontraron coordenadas en JSON-LD`);
        console.log(`   ℹ️  La propiedad NO se agregará al mapa modal automáticamente`);
        console.log(`   ℹ️  Puedes agregarla manualmente después con coordenadas aproximadas\n`);
        return;
    }

    console.log(`   ✅ Coordenadas encontradas: ${data.latitude}, ${data.longitude}`);

    // Generar array de fotos dinámicamente
    const photosArray = [];
    for (let i = 1; i <= photoCount; i++) {
        photosArray.push(`"${slug}/images/foto-${i}.jpg"`);
    }

    // Formato del precio corto (ej: $3.55M)
    const priceNum = parseFloat(data.price.replace(/[^0-9.]/g, ''));
    const priceShort = priceNum >= 1000000
        ? `$${(priceNum / 1000000).toFixed(2)}M`.replace('.00M', 'M')
        : `$${(priceNum / 1000).toFixed(0)}K`;

    // Extraer primera parte de la ubicación (antes de la primera coma)
    const locationShort = data.location.split(',')[0].trim();

    // Detectar tipo (RENTA o VENTA)
    const tipoPropiedad = data.price.toLowerCase().includes('renta') ||
                          data.title.toLowerCase().includes('renta') ? 'renta' : 'venta';

    // Variable name sanitizada
    const varName = slug.replace(/-/g, '_');

    // Código de la nueva propiedad para el mapa
    const newPropertyCode = `
            // ${tipoPropiedad.toUpperCase()}: ${data.title}
            const ${varName}Property = {
                address: "${data.location}",
                priceShort: "${priceShort}",
                priceFull: "${formatPrice(data.price)}",
                title: "${data.title}",
                location: "${locationShort}, ${cityConfig.name}",
                bedrooms: ${data.bedrooms || 'null'},
                bathrooms: ${data.bathrooms || 'null'},
                area: "${data.construction_area ? data.construction_area + 'm²' : 'N/D'}",
                type: "${tipoPropiedad}",
                url: "https://casasenventa.info/${cityConfig.folder}/${slug}/",
                photos: [
                    ${photosArray.join(',\n                    ')}
                ]
            };
`;

    // Mapa variable name según ciudad
    const mapVarName = cityConfig.city === 'monterrey' ? 'mapMonterrey' :
                       cityConfig.city === 'mazatlan' ? 'mapMazatlan' :
                       'mapCuliacan';

    // Código con coordenadas FIJAS (más rápido y confiable que geocodificación)
    const newMarkerCode = `
            // ${data.title} - Coordenadas exactas del JSON-LD
            const ${varName}Position = new google.maps.LatLng(${data.latitude}, ${data.longitude});
            const ${varName}MarkerClass = createZillowPropertyMarker(${varName}Property, window.${mapVarName});
            const ${varName}Marker = new ${varName}MarkerClass(${varName}Position, window.${mapVarName}, ${varName}Property);
            window.allCuliacanMarkers.push(${varName}Marker);
            console.log('Marcador ${data.title} (${tipoPropiedad.toUpperCase()}) creado en:', ${varName}Position.lat(), ${varName}Position.lng());
`;

    // Buscar dónde insertar la definición de la propiedad
    // Intentar múltiples patrones para máxima compatibilidad
    const patterns = [
        /(\s+)\/\/ RENTA: Casa Riberas de Tamazula/,
        /(\s+)\/\/ RENTA: Casa Bosques del Río/,
        /(\s+)const circuitoTabachinesProperty = \{/,
        /(\s+)\/\/ Geocodificar solidaridad/
    ];

    let insertionPoint = null;
    for (const pattern of patterns) {
        const match = indexHtml.match(pattern);
        if (match) {
            insertionPoint = indexHtml.indexOf(match[0]);
            console.log(`   ✅ Punto de inserción encontrado (definición)`);
            break;
        }
    }

    if (!insertionPoint) {
        console.log(`   ⚠️  No se encontró punto de inserción para la definición\n`);
        return;
    }

    // Insertar definición de propiedad
    indexHtml = indexHtml.substring(0, insertionPoint) +
                newPropertyCode +
                indexHtml.substring(insertionPoint);

    console.log(`   ✅ Definición de propiedad agregada al mapa`);

    // Buscar dónde insertar el código del marcador
    // Buscar después de Riberas de Tamazula o Bosques del Río
    const markerPatterns = [
        /(\s+)\/\/ Bosques del Río \(RENTA\) - Coordenadas exactas[\s\S]*?console\.log\('Marcador Bosques del Río[^']*'\);/,
        /(\s+)\/\/ Riberas de Tamazula \(RENTA\) - Coordenadas exactas[\s\S]*?console\.log\('Marcador Riberas de Tamazula[^']*'\);/,
        /(\s+)\/\/ Inicializar filtros Zillow cuando el mapa esté listo/
    ];

    let markerInsertionPoint = null;
    for (const pattern of markerPatterns) {
        const match = indexHtml.match(pattern);
        if (match) {
            markerInsertionPoint = indexHtml.indexOf(match[0]) + match[0].length;
            console.log(`   ✅ Punto de inserción encontrado (marcador)`);
            break;
        }
    }

    if (!markerInsertionPoint) {
        console.log(`   ⚠️  No se encontró punto de inserción para el marcador\n`);
        return;
    }

    // Insertar código del marcador
    indexHtml = indexHtml.substring(0, markerInsertionPoint) +
                newMarkerCode +
                indexHtml.substring(markerInsertionPoint);

    console.log(`   ✅ Marcador con coordenadas exactas agregado al mapa de ${cityConfig.name}\n`);

    fs.writeFileSync(indexPath, indexHtml, 'utf8');
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('\n❌ ERROR: Falta la URL de Inmuebles24\n');
        console.log('USO: node inmuebles24-scraper-y-publicar.js "URL"\n');
        console.log('EJEMPLO:');
        console.log('  node inmuebles24-scraper-y-publicar.js "https://www.inmuebles24.com/propiedades/clasificado/..."\n');
        process.exit(1);
    }

    const url = args[0];

    // Validar URL
    if (!url.includes('inmuebles24.com')) {
        console.error('\n❌ ERROR: La URL debe ser de Inmuebles24\n');
        process.exit(1);
    }

    try {
        // 1. Detectar ciudad y tipo de propiedad desde URL
        const detectedCity = detectCityFromUrl(url);
        const propertyType = detectPropertyType(url);

        // Mostrar tipo detectado
        const typeIcon = propertyType === 'renta' ? '🏘️' : '🏠';
        const typeLabel = propertyType === 'renta' ? 'RENTA' : 'VENTA';
        console.log(`${typeIcon} Tipo detectado: ${typeLabel}\n`);

        // 2. Confirmar ciudad con el usuario
        const confirmedCity = await confirmCity(detectedCity);
        const cityConfig = getCityConfig(confirmedCity, propertyType);
        console.log(`🚀 Iniciando scraper para: ${typeLabel} en ${cityConfig.name}, ${cityConfig.state}\n`);

        // 2. Scrapear datos
        const data = await scrapeInmuebles24(url, {
            name: cityConfig.name,
            state: cityConfig.state,
            stateShort: cityConfig.stateShort,
            fallbackLocation: `${cityConfig.name}, ${cityConfig.state}`,
            cityName: cityConfig.name,
            stateName: cityConfig.state
        });

        // 2.1 Verificar duplicados por ID
        if (data.propertyId) {
            const existing = checkIfPropertyExists(data.propertyId);
            if (existing) {
                console.log('   🛑 Scraper detenido para evitar duplicados.\n');
                process.exit(0);
            }
        } else {
            console.log('   ⚠️  Advertencia: No se pudo extraer ID de propiedad de la URL');
            console.log('   ⚠️  No se puede verificar si la propiedad ya existe\n');
        }

        // 3. Generar slug
        const slug = generateSlug(data.title);
        console.log(`🔗 Slug generado: ${slug}\n`);

        // 4. Crear directorios con ciudad dinámica
        const propertyDir = `${cityConfig.folder}/${slug}`;
        const imagesDir = `${propertyDir}/images`;

        if (!fs.existsSync(propertyDir)) {
            fs.mkdirSync(propertyDir, { recursive: true });
        }

        // 5. Descargar fotos
        const photoCount = await downloadPhotos(data.images, imagesDir);

        if (photoCount === 0) {
            console.error('❌ ERROR: No se descargaron fotos\n');
            process.exit(1);
        }

        // 6. Generar HTML con ciudad dinámica
        const html = generateHTML(data, slug, photoCount, cityConfig);
        const htmlPath = `${propertyDir}/index.html`;
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log(`✅ HTML generado: ${htmlPath}\n`);

        // 7. Agregar a index con ciudad dinámica
        addToIndex(data, slug, cityConfig);

        // 7.5 Agregar al mapa modal
        addPropertyToMap(data, slug, photoCount, cityConfig);

        // 8. Commit y push automático
        console.log('🚀 Publicando a GitHub...\n');
        execSync(`git add ${propertyDir} ${cityConfig.indexPath}`, { stdio: 'inherit' });
        execSync(`git commit -m "Add: ${data.title} (Inmuebles24 - ${cityConfig.name})

- Scrapeado de Inmuebles24
- ${photoCount} fotos descargadas
- Master Template aplicado
- Tarjeta agregada a ${cityConfig.indexPath}
- Ciudad: ${cityConfig.name}, ${cityConfig.state}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"`, { stdio: 'inherit' });

        execSync('git push origin main', { stdio: 'inherit' });

        // 8. Guardar propiedad en registro para evitar duplicados futuros
        saveScrapedProperty({
            propertyId: data.propertyId,
            title: data.title,
            slug: slug,
            price: data.price,
            publishedDate: data.publishedDate,
            url: url
        });

        // 9. Actualizar CRM de vendedores
        actualizarVendedorCRM(data.vendedor, {
            propertyId: data.propertyId,
            title: data.title,
            price: data.price,
            location: data.location,
            url: url,
            publishedDate: data.publishedDate
        });

        console.log('\n' + '='.repeat(60));
        console.log('✅ ¡COMPLETADO!');
        console.log('='.repeat(60));
        console.log(`\n📊 RESUMEN FINAL:`);
        console.log(`   🏠 ${data.title}`);
        console.log(`   💰 ${data.price}`);
        console.log(`   🛏️  ${data.bedrooms} recámaras • 🛁 ${data.bathrooms} baños`);
        console.log(`   📐 ${data.construction_area}m² construcción • 🏞️  ${data.land_area}m² terreno`);
        console.log(`   📸 ${data.images.length} fotos descargadas`);
        console.log(`\n👤 VENDEDOR:`);
        console.log(`   Nombre: ${data.vendedor.nombre || 'N/A'}`);
        console.log(`   📞 Tel: ${data.vendedor.telefono || 'N/A'}`);
        console.log(`\n📅 PUBLICACIÓN:`);
        console.log(`   Fecha: ${data.publishedDate}`);
        console.log(`   👁️  Vistas: ${data.views}`);
        console.log(`\n🌐 URLs:`);
        console.log(`   Local: ${propertyDir}/index.html`);
        console.log(`   Producción: ${CONFIG.baseUrl}/${cityConfig.folder}/${slug}/`);
        console.log('');

        // 10. Esperar para que GitHub Pages complete el deployment
        console.log('⏳ Esperando 30 segundos para que GitHub Pages actualice...');
        console.log('   (Esto evita problemas de cache y deployments cancelados)\n');
        await new Promise(resolve => setTimeout(resolve, 30000));

        console.log('✅ Deployment completado. La página ya debe estar visible.\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// ============================================
// CLI - COMANDOS ESPECIALES CRM
// ============================================

function ejecutarComandoCRM() {
    const args = process.argv.slice(2);

    // Comando: node inmuebles24-scraper-y-publicar.js --crm-buscar <query>
    if (args[0] === '--crm-buscar' && args[1]) {
        const query = args[1];
        console.log(`\n🔍 Buscando vendedor: "${query}"\n`);

        const resultados = buscarVendedorCRM(query);

        if (resultados.length === 0) {
            console.log(`❌ No se encontraron vendedores con: "${query}"\n`);
            console.log('💡 Intenta con:');
            console.log('   - Nombre (ej: alejandra)');
            console.log('   - Teléfono (ej: 6671603643)');
            console.log('   - Tag (ej: centro-historico)\n');
        } else {
            console.log(`✅ Encontrados ${resultados.length} vendedor(es):\n`);
            resultados.forEach(mostrarVendedorCRM);
        }
        return true;
    }

    // Comando: node inmuebles24-scraper-y-publicar.js --crm-lista
    if (args[0] === '--crm-lista') {
        const crm = loadCRM();
        console.log('\n📋 LISTA DE VENDEDORES\n');
        console.log('═'.repeat(70));

        crm.vendedores.forEach((v, i) => {
            console.log(`\n${i + 1}. ${v.nombre}`);
            console.log(`   📞 ${v.telefonoFormateado}`);
            console.log(`   🏠 ${v.propiedades.length} propiedad(es)`);
            console.log(`   🏷️  ${v.tags.join(', ')}`);
        });

        console.log('\n' + '═'.repeat(70));
        console.log(`\nTotal: ${crm.vendedores.length} vendedores\n`);
        return true;
    }

    // Comando: node inmuebles24-scraper-y-publicar.js --crm-stats
    if (args[0] === '--crm-stats') {
        const crm = loadCRM();
        console.log('\n📊 ESTADÍSTICAS CRM\n');
        console.log('═'.repeat(50));
        console.log(`Total Vendedores: ${crm.estadisticas.totalVendedores}`);
        console.log(`Total Propiedades: ${crm.estadisticas.totalPropiedades}`);
        console.log(`Última Actualización: ${crm.estadisticas.ultimaActualizacion}`);

        // Agrupar por fuente
        const porFuente = {};
        crm.vendedores.forEach(v => {
            porFuente[v.fuente] = (porFuente[v.fuente] || 0) + 1;
        });

        console.log('\n📌 Por Fuente:');
        Object.entries(porFuente).forEach(([fuente, count]) => {
            console.log(`   ${fuente}: ${count}`);
        });

        // Top vendedores
        const ordenados = [...crm.vendedores].sort((a, b) =>
            b.propiedades.length - a.propiedades.length
        );

        console.log('\n🏆 Top Vendedores (por propiedades):');
        ordenados.slice(0, 5).forEach((v, i) => {
            console.log(`   ${i + 1}. ${v.nombre} - ${v.propiedades.length} propiedad(es)`);
        });

        console.log('\n' + '═'.repeat(50) + '\n');
        return true;
    }

    return false; // No es comando CRM
}

// Ejecutar
if (require.main === module) {
    // Verificar si es comando CRM
    const esCRM = ejecutarComandoCRM();

    // Si no es comando CRM, ejecutar scraper normal
    if (!esCRM) {
        main();
    }
}

module.exports = { scrapeInmuebles24, downloadPhotos, generateHTML, buscarVendedorCRM, loadCRM };
