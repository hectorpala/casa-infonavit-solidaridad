#!/usr/bin/env node

/**
 * SCRAPER Y PUBLICADOR AUTOMÁTICO - INMUEBLES24.COM + CRM VENDEDORES
 *
 * ✨ MULTI-CIUDAD: Detecta automáticamente la ciudad desde la URL y publica en la carpeta correcta
 * 🔍 DETECCIÓN DE DUPLICADOS: Sistema inteligente por Property ID de Inmuebles24
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * USO BÁSICO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SCRAPER:
 *   node inmuebles24culiacanscraper.js "URL_DE_INMUEBLES24"
 *   node inmuebles24culiacanscraper.js "URL" --auto-confirm  # Sin prompt de ciudad
 *
 * CRM:
 *   node inmuebles24culiacanscraper.js --crm-buscar <nombre|teléfono|tag>
 *   node inmuebles24culiacanscraper.js --crm-lista
 *   node inmuebles24culiacanscraper.js --crm-stats
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PROCESO COMPLETO (2-3 MINUTOS)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. 🔍 Extrae Property ID desde URL (ej: 144439344)
 * 2. 🛡️ Verifica duplicados en base de datos JSON
 *    - Si existe → ⚠️ Muestra advertencia, NO crea archivos
 *    - Si no existe → ✅ Continúa con scraping
 * 3. 🌆 Detecta ciudad desde URL (Monterrey, Mazatlán, o Culiacán)
 * 4. 📊 Scrapea datos de Inmuebles24 (título, precio, fotos, descripción)
 * 5. 📸 Descarga todas las fotos automáticamente
 * 6. 🎨 Genera página HTML con Master Template
 * 7. 📋 Agrega tarjeta a [ciudad]/index.html
 * 8. 💾 Guarda en inmuebles24-scraped-properties.json
 * 9. 🚀 Commit y push automático a GitHub
 * 10. 👤 Actualiza CRM de vendedores
 * 11. ✅ Listo - URL en casasenventa.info/[ciudad]/[slug]/
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SISTEMA DE DETECCIÓN DE DUPLICADOS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SCOPE: Solo propiedades de Inmuebles24
 * - 37 propiedades trackeadas con IDs únicos
 * - 130 propiedades manuales NO trackeadas (correcto - no vienen de Inmuebles24)
 * - Total sistema: 167 propiedades publicadas
 *
 * CÓMO FUNCIONA:
 * 1. Extrae ID desde URL: /-(\d+)\.html/
 *    ✅ .../casa-144439344.html
 *    ✅ .../casa-144439344.html?n_src=Listado&n_pg=3
 *
 * 2. Busca ID en inmuebles24-scraped-properties.json
 *
 * 3. Si encuentra coincidencia:
 *    ⚠️ Muestra advertencia con título y slug existente
 *    🛑 NO crea archivos nuevos
 *    ✅ Exit code 0 (sin error)
 *
 * 4. Si NO encuentra:
 *    ✅ Scrapea y publica normalmente
 *    💾 Agrega a base de datos con ID único
 *
 * BASES DE DATOS:
 * - inmuebles24-scraped-properties.json (Culiacán - 19 props)
 * - inmuebles24-scraped-properties-mazatlan.json (Mazatlán - 16 props)
 * - crm-propiedades.json (Vendedores - 0 props)
 * - culiacan/data/properties.json (Legacy - 2 props)
 * - complete-properties-database.json (Inventario completo - 167 props, solo referencia)
 *
 * INTERFAZ WEB:
 * - public/inmuebles24scraper.html
 * - scraper-server.js (Express + SSE)
 * - Muestra advertencia amarilla con ID y título si es duplicado
 * - Confetti verde si es nueva propiedad
 *
 * PRECISIÓN: 100% - 0 false positives (usa IDs únicos de Inmuebles24)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CIUDADES SOPORTADAS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - Monterrey, Nuevo León → monterrey/
 * - Mazatlán, Sinaloa → mazatlan/
 * - Culiacán, Sinaloa → culiacan/ (default)
 *
 * DETECCIÓN AUTOMÁTICA:
 * - "monterrey" en URL → Monterrey
 * - "mazatlan" en URL → Mazatlán
 * - Otros casos → Culiacán
 *
 * CONFIRMACIÓN MANUAL:
 * - Menú interactivo para confirmar ciudad detectada
 * - 5 segundos para seleccionar (1/2/3) o Enter para confirmar
 * - Flag --auto-confirm para saltar confirmación (interfaz web)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EJEMPLOS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * # Monterrey (detecta "monterrey" en URL)
 * node inmuebles24culiacanscraper.js "https://www.inmuebles24.com/.../monterrey-..."
 *
 * # Mazatlán (detecta "mazatlan" en URL)
 * node inmuebles24culiacanscraper.js "https://www.inmuebles24.com/.../mazatlan-..."
 *
 * # Culiacán (default si no detecta ciudad)
 * node inmuebles24culiacanscraper.js "https://www.inmuebles24.com/.../culiacan-..."
 *
 * # Auto-confirm (sin prompt de ciudad)
 * node inmuebles24culiacanscraper.js "https://www.inmuebles24.com/..." --auto-confirm
 *
 * # CRM Vendedores
 * node inmuebles24culiacanscraper.js --crm-buscar alejandra
 * node inmuebles24culiacanscraper.js --crm-buscar 6671603643
 * node inmuebles24culiacanscraper.js --crm-buscar centro-historico
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DOCUMENTACIÓN
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - DUPLICATE-DETECTION-README.md - Sistema completo de duplicados
 * - SCRAPER-UI-README.md - Interfaz web
 * - complete-properties-database.json - Inventario 167 propiedades
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * COMMITS IMPORTANTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - 639ba16: Fix regex property ID (soporte query params)
 * - cb89ffd: Detección duplicados en interfaz web
 * - 4ca33fc: Limpieza base de datos (extraer IDs de URLs)
 * - d2ecb88: Mejoras progreso scraper
 * - f8f8221: Extracción slug y título mejorada
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

// Geocoder V1.5 para Culiacán
const { geocoder } = require('./geo-geocoder-culiacan');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normaliza texto removiendo acentos para comparaciones insensibles a Unicode
 * Ejemplo: "Culiacán" → "culiacan", "Mazatlán" → "mazatlan"
 * @param {string} str - Texto a normalizar
 * @returns {string} Texto sin acentos en minúsculas
 */
function normalizeText(str) {
    return str
        .normalize('NFD')  // Descompone caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '')  // Elimina marcas diacríticas
        .toLowerCase()
        .trim();
}

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

geocoder.setGoogleMapsKey(CONFIG.googleMaps.key);

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
 * @param {boolean} autoConfirm - Si true, skip el prompt y auto-confirmar
 * @returns {Promise<string>} - Ciudad confirmada por el usuario
 */
async function confirmCity(detectedCity, autoConfirm = false) {
    const cityNames = {
        'monterrey': 'Monterrey, Nuevo León',
        'mazatlan': 'Mazatlán, Sinaloa',
        'culiacan': 'Culiacán, Sinaloa'
    };

    // Si autoConfirm está activo, skip el prompt
    if (autoConfirm) {
        console.log(`\n🤖 Auto-confirmado: ${cityNames[detectedCity]}\n`);
        return detectedCity;
    }

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

/**
 * Normaliza la cadena de ubicación para mapas y UI.
 * Elimina breadcrumbs de Inmuebles24 y genera versiones:
 *  - primary: nombre corto del fraccionamiento/colonia
 *  - display: versión amigable para la ficha (incluye ciudad si falta)
 *  - mapLocation: dirección apta para geocodificación (incluye ciudad y estado)
 * @param {string} rawLocation - Cadena original proveniente del scrape
 * @param {string} cityName - Nombre de la ciudad (ej. "Culiacán")
 * @param {string} stateName - Nombre del estado (ej. "Sinaloa")
 * @returns {{primary: string, display: string, mapLocation: string}}
 */
function normalizeLocationForCity(rawLocation, cityName, stateName) {
    const fallbackPrimary = cityName;
    const fallbackDisplay = cityName;
    const fallbackMap = stateName ? `${cityName}, ${stateName}` : cityName;

    if (!rawLocation || typeof rawLocation !== 'string') {
        return {
            primary: fallbackPrimary,
            display: fallbackDisplay,
            mapLocation: fallbackMap
        };
    }

    // Limpieza básica de breadcrumbs conocidos
    let location = rawLocation
        .replace(/Inmuebles24/gi, ' ')
        .replace(/Casa\s+Venta/gi, ' ')
        .replace(/Casa\s+Renta/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const lowerCity = cityName.toLowerCase();
    const lowerState = (stateName || '').toLowerCase();

    let primary = null;

    // 1) Si hay coma, tomar la primera sección (antes suele venir la colonia)
    if (location.includes(',')) {
        const [firstSection] = location.split(',');
        const candidate = firstSection.trim();
        if (candidate && !/^(casa|departamento|propiedad)\b/i.test(candidate)) {
            primary = candidate;
        }
    }

    // 2) Si aún no hay primary, intentar con separadores dobles (breadcrumbs sin comas)
    if (!primary) {
        const tokens = rawLocation
            .split(/\s{2,}/)
            .map(token => token.trim())
            .filter(Boolean);

        if (tokens.length) {
            const blacklist = new Set([
                'inmuebles24',
                'casa',
                'venta',
                'renta',
                lowerCity,
                lowerState,
                'mexico',
                'méxico'
            ]);

            const priorityKeywords = [
                'fraccionamiento',
                'colonia',
                'residencial',
                'privada',
                'coto',
                'zona',
                'sector',
                'villa',
                'plaza',
                'parque',
                'torre',
                'boulevard',
                'blvd',
                'avenida',
                'av'
            ];

            const findCandidate = (predicate) => tokens.find(token => {
                const lower = token.toLowerCase();
                if (!lower || blacklist.has(lower)) return false;
                if (lower.includes('casa ') || lower.includes('departamento ')) return false;
                return predicate(lower);
            });

            let candidate = findCandidate(lower =>
                priorityKeywords.some(keyword => lower.includes(keyword))
            );

            if (!candidate) {
                candidate = findCandidate(() => true);
            }

            if (candidate) {
                primary = candidate;
            }
        }
    }

    if (!primary) {
        primary = fallbackPrimary;
    }

    const primaryLower = primary.toLowerCase();
    const includesCity = primaryLower.includes(lowerCity);

    const display = includesCity ? primary : `${primary}, ${cityName}`;

    const mapParts = [];
    if (primary) mapParts.push(primary);
    if (!includesCity) mapParts.push(cityName);
    if (stateName) mapParts.push(stateName);
    const mapLocation = mapParts.join(', ');

    return {
        primary,
        display,
        mapLocation
    };
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

    let level = 'neighborhood'; // Default a 'neighborhood' para evitar clustering genérico
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
 * Genera el HTML completo del mapa interactivo con marcador personalizado
 * aprovechando la información normalizada de la propiedad.
 *
 * @param {Object} config
 * @param {string} config.mapLocation - Dirección geocodificable (incluye ciudad/estado)
 * @param {string} config.displayLocation - Dirección amigable mostrada en la ficha
 * @param {string} config.primaryLocation - Nombre corto del fraccionamiento/colonia
 * @param {string} config.price - Precio completo
 * @param {string} config.title - Título de la propiedad
 * @param {number} config.photoCount - Número total de fotos
 * @param {number|string} config.bedrooms - Número de recámaras
 * @param {number|string} config.bathrooms - Número de baños
 * @param {string} config.area - Área de construcción (texto)
 * @param {string} config.whatsapp - Número de WhatsApp de la ciudad
 * @param {number} [config.propertyIndex=0] - Offset en caso de varias propiedades en misma zona
 * @param {Object} [config.cityCoords] - Coordenadas de fallback para la ciudad
 * @param {string} [config.city] - Slug de la ciudad (culiacan|mazatlan|monterrey)
 * @param {string} [config.cityName] - Nombre legible de la ciudad
 * @param {string} [config.stateName] - Nombre del estado
 * @returns {string} HTML del mapa con script listo para incrustar
 */
function generateMapWithCustomMarker(config) {
    const {
        mapLocation,
        displayLocation,
        primaryLocation,
        price,
        title,
        propertyIndex = 0,
        cityCoords = { lat: 24.8091, lng: -107.3940, name: 'Culiacán' },
        photoCount = 1,
        bedrooms = 'N/A',
        bathrooms = 'N/A',
        area = 'N/D',
        whatsapp = '526681234567',
        city = 'culiacan',
        cityName = cityCoords.name || 'Culiacán',
        stateName = 'Sinaloa',
        lat = null, // ✅ Coordenadas de Geocoder V1.5
        lng = null  // ✅ Coordenadas de Geocoder V1.5
    } = config;

    const resolvedMapLocation = (mapLocation && mapLocation.trim()) ||
        [primaryLocation, cityName, stateName].filter(Boolean).join(', ');
    const resolvedDisplayLocation = (displayLocation && displayLocation.trim()) ||
        (primaryLocation ? `${primaryLocation}, ${cityName}` : cityName);

    const priceShort = formatPriceShort(price);
    const precision = detectAddressPrecision(resolvedMapLocation);

    // Calcular offset si hay múltiples propiedades en misma zona
    const latOffset = precision.offsetNeeded ? (propertyIndex * 0.002) : 0;
    const lngOffset = precision.offsetNeeded ? (propertyIndex * 0.002) : 0;

    // Fotos de fallback para tarjetas/markers
    const fallbackPhotos = Array.from({ length: photoCount }, (_, i) => `images/foto-${i + 1}.jpg`);
    const fallbackPhotosJSON = JSON.stringify(fallbackPhotos);

    const sanitizedTitle = (title || '').replace(/"/g, '\\"');
    const sanitizedArea = (area || '').replace(/"/g, '\\"');
    const sanitizedPrice = (price || '').replace(/"/g, '\\"');
    const sanitizedMapLocation = resolvedMapLocation.replace(/"/g, '\\"');
    const sanitizedDisplayLocation = resolvedDisplayLocation.replace(/"/g, '\\"');
    const fallbackBedroomsJSON = JSON.stringify(bedrooms);
    const fallbackBathroomsJSON = JSON.stringify(bathrooms);

    const mazatlanPropertiesBlock = city === 'mazatlan' ? `
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
    ` : `// TODO: Implementar ALL_${city.toUpperCase()}_PROPERTIES. Ver PROBLEMA-MAPA-CULIACAN.md para refactor completo.`;

    return `
    <!-- Mapa con Marcador Personalizado -->
    <div id="map-container" style="width: 100%; height: 450px; border-radius: 12px; overflow: hidden;"></div>

    <script>
        const CURRENT_CITY = "${city}";
        const DEFAULT_WHATSAPP = "${whatsapp}";
        const FALLBACK_URL = window.location.href;
        const FALLBACK_PHOTOS = ${fallbackPhotosJSON};
        const FALLBACK_PRICE_FULL = "${sanitizedPrice}";
        const FALLBACK_PRICE_SHORT = "${priceShort}";
        const FALLBACK_BEDROOMS = ${fallbackBedroomsJSON};
        const FALLBACK_BATHROOMS = ${fallbackBathroomsJSON};
        const FALLBACK_AREA = "${sanitizedArea}";
        const CITY_NAME = "${cityName}";
        const STATE_NAME = "${stateName || ''}";
${mazatlanPropertiesBlock}

        // Variables globales para el mapa
        let map;
        let marker;
        let geocoder;

        // Configuración del marcador personalizado
        const MARKER_CONFIG = {
            location: "${sanitizedMapLocation}",
            priceShort: "${priceShort}",
            title: "${sanitizedTitle}",
            precision: "${precision.level}",
            latOffset: ${latOffset},
            lngOffset: ${lngOffset},
            lat: ${lat !== null ? lat : 'null'}, // ✅ Coordenadas de Geocoder V1.5
            lng: ${lng !== null ? lng : 'null'}  // ✅ Coordenadas de Geocoder V1.5
        };

        // Datos completos de la propiedad actual (para el InfoWindow con carrusel)
        const CURRENT_PROPERTY_DATA = {
            priceShort: FALLBACK_PRICE_SHORT,
            priceFull: FALLBACK_PRICE_FULL,
            title: "${sanitizedTitle}",
            location: "${sanitizedDisplayLocation}",
            bedrooms: FALLBACK_BEDROOMS,
            bathrooms: FALLBACK_BATHROOMS,
            area: FALLBACK_AREA,
            whatsapp: DEFAULT_WHATSAPP,
            url: FALLBACK_URL,
            photos: FALLBACK_PHOTOS
        };

        function enrichProperty(property) {
            const source = property || {};
            const photos = Array.isArray(source.photos) && source.photos.length ? source.photos : FALLBACK_PHOTOS;

            return {
                ...CURRENT_PROPERTY_DATA,
                ...source,
                photos,
                priceFull: source.priceFull || CURRENT_PROPERTY_DATA.priceFull,
                priceShort: source.priceShort || CURRENT_PROPERTY_DATA.priceShort,
                bedrooms: source.bedrooms ?? CURRENT_PROPERTY_DATA.bedrooms,
                bathrooms: source.bathrooms ?? CURRENT_PROPERTY_DATA.bathrooms,
                area: source.area || CURRENT_PROPERTY_DATA.area,
                location: source.location || CURRENT_PROPERTY_DATA.location,
                whatsapp: source.whatsapp || DEFAULT_WHATSAPP,
                url: source.url || CURRENT_PROPERTY_DATA.url
            };
        }

        // Variable global para el InfoWindow actual y el índice de foto
        let currentInfoWindow = null;
        let currentPhotoIndex = 0;

        // Función para mostrar tarjeta con carrusel de fotos completo (estilo Zillow)
        function showPropertyCard(property, position, map, isCurrent = false) {
            currentPhotoIndex = 0; // Resetear al abrir

            const enrichedProperty = enrichProperty(property);
            const photos = Array.isArray(enrichedProperty.photos) && enrichedProperty.photos.length ? enrichedProperty.photos : FALLBACK_PHOTOS;
            const priceFull = enrichedProperty.priceFull || FALLBACK_PRICE_FULL;
            const bedroomsValue = enrichedProperty.bedrooms ?? FALLBACK_BEDROOMS;
            const bathroomsValue = enrichedProperty.bathrooms ?? FALLBACK_BATHROOMS;
            const areaValue = enrichedProperty.area || FALLBACK_AREA;
            const propertyLocation = enrichedProperty.location || CURRENT_PROPERTY_DATA.location;
            const propertyUrl = enrichedProperty.url || FALLBACK_URL;
            const whatsappNumber = enrichedProperty.whatsapp || DEFAULT_WHATSAPP;
            const markerTitle = enrichedProperty.title || "${sanitizedTitle}";

            // Crear ID único para este carrusel
            const carouselId = 'carousel-prop-' + Date.now();

            // Generar HTML del carrusel con TODAS las fotos
            const cardContent = \`
                <div id="\${carouselId}" style="max-width: 320px; font-family: 'Poppins', sans-serif;">
                    <!-- Carrusel de fotos -->
                    <div style="position: relative; height: 200px; margin-bottom: 10px; overflow: hidden; border-radius: 8px 8px 0 0;">
                        <!-- Imagen actual -->
                        <img id="\${carouselId}-img"
                             src="\${photos[0]}"
                             alt="\${markerTitle}"
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
                            <span id="\${carouselId}-counter">1</span> / \${photos.length}
                        </div>

                        <!-- Dots indicadores -->
                        <div id="\${carouselId}-dots" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10;">
                            \${photos.map((_, index) => \`
                                <div class="carousel-dot" data-index="\${index}"
                                     style="width: \${index === 0 ? '20px' : '8px'}; height: 8px; border-radius: 4px; background: \${index === 0 ? 'white' : 'rgba(255,255,255,0.5)'}; cursor: pointer; transition: all 0.3s;"></div>
                            \`).join('')}
                        </div>
                    </div>

                    <!-- Info de la propiedad -->
                    <div style="padding: 12px;">
                        <h3 style="margin: 0 0 8px 0; color: \${isCurrent ? '#FF6B35' : '#10b981'}; font-size: 20px; font-weight: 700;">\${priceFull}</h3>
                        <div style="display: flex; gap: 12px; margin-bottom: 8px; color: #6b7280; font-size: 14px;">
                            <span><i class="fas fa-bed"></i> \${bedroomsValue} rec</span>
                            <span><i class="fas fa-bath"></i> \${bathroomsValue} baños</span>
                            <span><i class="fas fa-ruler-combined"></i> \${areaValue}</span>
                        </div>
                        <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 13px; line-height: 1.4;">\${propertyLocation}</p>

                        <!-- Botones de acción -->
                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.open('\${propertyUrl}', '_blank')"
                               style="flex: 1; background: #FF6A00; color: white; padding: 10px 16px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; text-align: center; cursor: pointer; font-family: 'Poppins', sans-serif;">
                                Ver Detalles
                            </button>
                            <button onclick="window.open('https://wa.me/\${whatsappNumber}?text=Hola,%20me%20interesa%20\${encodeURIComponent(markerTitle)}%20en%20\${encodeURIComponent(priceFull)}', '_blank')"
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
                    if (newIndex < 0) newIndex = photos.length - 1;
                    if (newIndex >= photos.length) newIndex = 0;

                    currentPhotoIndex = newIndex;

                    // Fade effect
                    img.style.opacity = '0';
                    setTimeout(() => {
                        img.src = photos[newIndex];
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
            const displayPrice = property.priceShort || property.priceFull || FALLBACK_PRICE_SHORT;
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
                    \${displayPrice}
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

        // Helper: Inicializar mapa con coordenadas
        function initializeMapWithPosition(position) {
            // Detectar si es propiedad de Mazatlán
            const isMazatlan = CURRENT_CITY === 'mazatlan' || window.location.href.includes('/mazatlan/');
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

            let currentPropertySource = CURRENT_PROPERTY_DATA;
            if (isMazatlan && typeof ALL_MAZATLAN_PROPERTIES !== 'undefined') {
                const matched = ALL_MAZATLAN_PROPERTIES.find(p =>
                    currentSlug && (currentSlug.includes(p.slug) || p.slug.includes(currentSlug))
                );
                if (matched) {
                    currentPropertySource = { ...matched };
                }
            }

            const enrichedCurrent = enrichProperty(currentPropertySource);
            const CustomMarkerClass = createPropertyMarker(enrichedCurrent, map, true);
            marker = new CustomMarkerClass(position, map, enrichedCurrent, true);

            if (isMazatlan && typeof ALL_MAZATLAN_PROPERTIES !== 'undefined') {
                const referenceSlug = enrichedCurrent.slug || currentSlug;

                ALL_MAZATLAN_PROPERTIES.forEach(property => {
                    const enriched = enrichProperty(property);
                    const propertySlug = enriched.slug || property.slug;

                    if (referenceSlug && propertySlug && propertySlug === referenceSlug) {
                        return;
                    }

                    const baseLocation = enriched.location || property.location || CITY_NAME;
                    const geocodeAddress = baseLocation.toLowerCase().includes(CITY_NAME.toLowerCase())
                        ? baseLocation
                        : \`\${baseLocation}, \${CITY_NAME}, \${STATE_NAME}\`;

                    geocoder.geocode({ address: geocodeAddress }, function(results, status) {
                        if (status === 'OK' && results[0]) {
                            const otherPosition = {
                                lat: results[0].geometry.location.lat(),
                                lng: results[0].geometry.location.lng()
                            };

                            const OtherMarkerClass = createPropertyMarker(enriched, map, false);
                            new OtherMarkerClass(otherPosition, map, enriched, false);
                        }
                    });
                });
            }
        }

        // Inicializar mapa
        function initMap() {
            // Inicializar geocoder (necesario para Mazatlán properties)
            geocoder = new google.maps.Geocoder();

            // ✅ PRIORIDAD 1: Usar coordenadas de Geocoder V1.5 si están disponibles
            if (MARKER_CONFIG.lat !== null && MARKER_CONFIG.lng !== null) {
                console.log('📍 Usando coordenadas de Geocoder V1.5:', MARKER_CONFIG.lat, MARKER_CONFIG.lng);
                const position = {
                    lat: MARKER_CONFIG.lat + MARKER_CONFIG.latOffset,
                    lng: MARKER_CONFIG.lng + MARKER_CONFIG.lngOffset
                };

                initializeMapWithPosition(position);
                return;
            }

            // ✅ FALLBACK: Usar Google Maps Geocoder si no hay coordenadas de V1.5
            console.log('⚠️ Coordenadas V1.5 no disponibles, usando Google Maps API como fallback');

            // Geocodificar la dirección con Google Maps API
            geocoder.geocode({ address: MARKER_CONFIG.location }, function(results, status) {
                if (status === 'OK' && results[0]) {
                    const position = {
                        lat: results[0].geometry.location.lat() + MARKER_CONFIG.latOffset,
                        lng: results[0].geometry.location.lng() + MARKER_CONFIG.lngOffset
                    };

                    initializeMapWithPosition(position);

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
            ...propertyData,  // Guardar TODOS los campos recibidos
            scrapedAt: new Date().toISOString()  // Siempre actualizar fecha de scraping
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

    // Publicar cambios del CRM automáticamente
    try {
        console.log('📤 Publicando cambios del CRM a GitHub...\n');
        execSync('git add crm-vendedores.json inmuebles24-scraped-properties.json', { stdio: 'pipe' });

        // Verificar si hay cambios para hacer commit
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim()) {
            execSync(`git commit -m "CRM: Actualizar base de datos automáticamente

- Propiedad agregada/actualizada en el CRM
- Total: ${crm.estadisticas.totalVendedores} vendedores, ${crm.estadisticas.totalPropiedades} propiedades

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"`, { stdio: 'pipe' });

            execSync('git push origin main', { stdio: 'pipe' });
            console.log('   ✅ CRM publicado exitosamente a GitHub\n');
        } else {
            console.log('   ℹ️  No hay cambios nuevos en el CRM para publicar\n');
        }
    } catch (error) {
        console.log('   ⚠️  No se pudo publicar el CRM automáticamente (continuando...)\n');
    }
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
// FILTRO DE TÉRMINOS PROHIBIDOS
// ============================================

/**
 * Detecta términos prohibidos en la información de la propiedad.
 * Filtra propiedades relacionadas con remates, juicios, invasiones, etc.
 *
 * @param {Object} data - Datos scrapeados de la propiedad
 * @returns {string|null} - Término prohibido detectado o null si no hay ninguno
 */
function detectForbiddenTerm(data) {
    const FORBIDDEN_TERMS = [
        'remate',
        'remates',
        'juicio',
        'juicio bancario',
        'casa invadida',
        'invadida',
        'invadido',
        'embargo',
        'embargada',
        'adjudicada',
        'adjudicación'
    ];

    // Construir string con toda la información relevante
    const searchableText = [
        data.title || '',
        data.description || '',
        data.location || '',
        data.address_clean || '',
        ...(data.features || []),
        ...(data.tags || [])
    ].join(' ').toLowerCase();

    // Buscar cada término prohibido
    for (const term of FORBIDDEN_TERMS) {
        if (searchableText.includes(term.toLowerCase())) {
            return term;
        }
    }

    return null;
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

        function normalizeTextLocal(str) {
            return (str || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim();
        }

        const CITY_TOKENS = ['culiacan', 'monterrey', 'mazatlan'];
        const STATE_TOKENS = ['sinaloa', 'nuevo leon'];

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
            const normalized = normalizeTextLocal(address);

            // +5 puntos: Tiene número de calle (ej: "2609", "#123")
            if (/\d+/.test(address)) score += 5;

            // +4 puntos: Tiene nombre de calle (ej: "Blvd", "Av", "Calle", "Privada", "Internacional")
            if (/(blvd|boulevard|avenida|av\.|calle|c\.|privada|priv\.|paseo|prol\.|prolongación|internacional)/i.test(address)) score += 4;

            // +3 puntos: Tiene colonia/fraccionamiento específico (ej: "Fracc. Las Quintas")
            if (/(fracc\.|fraccionamiento|colonia|col\.|residencial|priv\.|privada)/i.test(address)) score += 3;

            // +2 puntos: Tiene múltiples componentes (comas = separadores)
            const commaCount = (address.match(/,/g) || []).length;
            score += Math.min(commaCount * 2, 6); // Máximo 6 puntos por comas

            // +1 punto: Incluye municipio/ciudad
            if (CITY_TOKENS.some(city => normalized.includes(city))) score += 1;

            // +1 punto: Incluye estado
            if (STATE_TOKENS.some(state => normalized.includes(state))) score += 1;

            // Penalización -3: Dirección muy corta (probablemente incompleta)
            if (address.length < 30) score -= 3;

            // Penalización -5: Solo tiene ciudad y estado (ej: "Culiacán, Sinaloa")
            const isOnlyCityOrState = CITY_TOKENS.some(city => {
                if (normalized === city) return true;
                if (normalized === `${city},`) return true;
                return STATE_TOKENS.some(state => normalized === `${city}, ${state}` || normalized === `${city} ${state}`);
            });
            if (isOnlyCityOrState) {
                score -= 5;
            }

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

        function escapeRegExp(value) {
            return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function isCityOrState(part) {
            if (!part) return false;
            const normalized = normalizeTextLocal(part);
            // Normalizadas para comparación insensible a acentos
            const knownCities = ['culiacan', 'mazatlan', 'monterrey'];
            const knownStates = ['sinaloa', 'nuevo leon'];
            const cityMatch = meta?.cityName ? normalized.includes(normalizeTextLocal(meta.cityName)) : false;
            const stateMatch = meta?.stateName ? normalized.includes(normalizeTextLocal(meta.stateName)) : false;
            return cityMatch || stateMatch ||
                knownCities.some(city => normalized.includes(city)) ||
                knownStates.some(state => normalized.includes(state));
        }

        function isStreetCandidate(address) {
            if (!address) return false;
            const lower = address.toLowerCase();
            const hasStreetKeyword = /(calle|avenida|av\.|blvd|boulevard|privada|priv\.|paseo|prol\.|prolongación|camino|carretera|andador|calz\.|calzada)/i.test(lower);
            const hasNumber = /\d+/.test(address);
            return hasStreetKeyword && hasNumber;
        }

        function isNeighborhoodCandidate(address) {
            if (!address) return false;
            const lower = address.toLowerCase();
            const hasNeighborhoodKeyword = /(fracc\.|fraccionamiento|colonia|col\.|residencial|privada|priv\.|barrio|sector|zona|parque)/i.test(lower);
            if (isStreetCandidate(address)) return false;

            const parts = address.split(',').map(part => part.trim()).filter(Boolean);
            if (!parts.length) return false;
            const firstPart = parts[0];
            const looksLikeNeighborhood = firstPart.length >= 4 && !/\d/.test(firstPart) && !isCityOrState(firstPart);
            const hasCityState = parts.some(part => isCityOrState(part));

            return (hasNeighborhoodKeyword || (looksLikeNeighborhood && hasCityState));
        }

        function getPrimaryNonCityPart(parts) {
            return parts.find(part => part && !isCityOrState(part)) || parts[0] || '';
        }

        function hasRomanNumeralSuffix(text) {
            if (!text) return false;
            return /\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b$/i.test(text.trim());
        }

        function decomposeNeighborhood(text) {
            if (!text) {
                return { prefix: '', core: '', base: '' };
            }
            const match = text.match(/^(Fracc\.|Fraccionamiento|Col\.|Colonia|Residencial)\s+/i);
            const prefix = match ? match[0].trim() : '';
            const core = match ? text.slice(match[0].length).trim() : text.trim();
            const base = core.replace(/\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b$/i, '').trim();
            return { prefix, core, base };
        }

        function normalizeNeighborhoodBase(text) {
            if (!text) return '';
            const { base } = decomposeNeighborhood(text);
            return base.toLowerCase();
        }

        function findRomanVariant(baseName, prefix, text) {
            if (!baseName || !text) return null;
            const escapedBase = escapeRegExp(baseName);
            const romanPattern = new RegExp(`\\b(${escapedBase})\\s+(i|ii|iii|iv|v|vi|vii|viii|ix|x)\\b`, 'i');
            const match = text.match(romanPattern);
            if (match) {
                const nameCore = `${match[1]} ${match[2].toUpperCase()}`.replace(/\s+/g, ' ').trim();
                return prefix ? `${prefix} ${nameCore}` : nameCore;
            }
            return null;
        }

        function createRomanEnhancedAddress(originalAddress) {
            if (!originalAddress) return null;
            const parts = originalAddress.split(',').map(part => part.trim()).filter(Boolean);
            if (!parts.length) return null;

            const primaryIndex = parts.findIndex(part => part && !isCityOrState(part));
            const primaryPart = primaryIndex >= 0 ? parts[primaryIndex] : parts[0];
            if (!primaryPart) return null;

            const { prefix, core, base } = decomposeNeighborhood(primaryPart);
            if (!base || hasRomanNumeralSuffix(core)) {
                return null;
            }

            const pageTitle = document.title || '';
            const romanVariant =
                findRomanVariant(base, prefix, result.title || '') ||
                findRomanVariant(base, prefix, pageTitle) ||
                findRomanVariant(base, prefix, bodyText) ||
                findRomanVariant(base, prefix, originalAddress);

            if (!romanVariant || romanVariant.toLowerCase() === primaryPart.toLowerCase()) {
                return null;
            }

            const enhancedParts = [...parts];
            if (primaryIndex >= 0) {
                enhancedParts[primaryIndex] = romanVariant;
            } else {
                enhancedParts.unshift(romanVariant);
            }

            appendCityState(enhancedParts);

            const enhancedAddress = enhancedParts.join(', ');
            return usableAddress(enhancedAddress) ? enhancedAddress : null;
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

        // 🎯 FUNCIÓN DE SCORING PARA DIRECCIONES ARRIBA DEL MAPA
        // Prioriza elementos de ENCABEZADO sobre texto en descripciones
        function scoreAddressCandidate(text, element, iframe, isDirectSibling) {
            let score = 0;

            // ⭐ MÁXIMA PRIORIDAD: Hermano directo del iframe
            if (isDirectSibling) {
                score += 20;
            }

            // 📍 PRIORIDAD ALTA: Elementos de encabezado
            const tagName = element.tagName.toLowerCase();
            if (tagName === 'h1') score += 15;
            else if (tagName === 'h2') score += 12;
            else if (tagName === 'h3') score += 10;
            else if (tagName === 'h4') score += 8;
            else if (tagName === 'h5') score += 6;
            else if (tagName === 'p' && text.length < 100) score += 8; // Párrafo corto
            else if (tagName === 'span' && text.length < 80) score += 5; // Span corto

            // 🏘️ BONUS: Tiene fraccionamiento o colonia
            if (/(fracc|fraccionamiento)/i.test(text)) score += 8;
            if (/(colonia|col\.)/i.test(text)) score += 6;
            if (/residencial/i.test(text)) score += 5;

            // 🗺️ BONUS: Múltiples componentes de dirección (comas)
            const commaCount = (text.match(/,/g) || []).length;
            score += commaCount * 3;

            // ⚠️ PENALIZACIÓN: Tiene número + nombre de calle (puede ser dirección de oficina)
            const hasStreetNumber = /\b\d+\b/.test(text);
            const hasStreetName = /(calle|avenida|av\.|blvd|boulevard|privada|prol\.|prolongación)/i.test(text);
            if (hasStreetNumber && hasStreetName) {
                score -= 8; // PENALIZAR direcciones completas (probablemente de oficina)
            }

            // ⚠️ PENALIZACIÓN FUERTE: Texto muy largo (probablemente descripción)
            if (text.length > 150) score -= 15;
            if (text.length > 200) score -= 25;

            // ⚠️ PENALIZACIÓN: Está dentro de un contenedor de descripción grande
            let parentElement = element.parentElement;
            let depth = 0;
            while (parentElement && depth < 5) {
                const parentText = parentElement.textContent || '';
                if (parentText.length > 500) {
                    score -= 10; // Probablemente está en un bloque de descripción
                    break;
                }
                parentElement = parentElement.parentElement;
                depth++;
            }

            // ✅ BONUS: Texto conciso y limpio
            if (text.length >= 20 && text.length <= 80) score += 5;

            return score;
        }

        // FUENTE PRIORITARIA 0: Texto arriba del mapa de Google (MÁXIMA PRIORIDAD)
        // Buscar texto completo cerca de iframes de Google Maps
        const mapCandidates = [];

        // Buscar iframes de Google Maps
        const googleMapIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe =>
            iframe.src && iframe.src.includes('google.com/maps')
        );

        googleMapIframes.forEach(iframe => {
            const src = iframe.src || '';

            if (src && (!result.latitude || !result.longitude)) {
                // Patrón estándar !2dLON!3dLAT
                const embedMatch = src.match(/!2d(-?\d+\.?\d*)!3d(-?\d+\.?\d*)/);
                if (embedMatch) {
                    const lng = parseFloat(embedMatch[1]);
                    const lat = parseFloat(embedMatch[2]);
                    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                        result.latitude = lat;
                        result.longitude = lng;
                        console.log(`   📍 Coordenadas detectadas en iframe: ${lat}, ${lng}`);
                    }
                }
            }

            if (src && (!result.latitude || !result.longitude)) {
                // Segundo intento: coordenadas en @lat,lng (modo mapa estático)
                const atMatch = src.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                if (atMatch) {
                    const lat = parseFloat(atMatch[1]);
                    const lng = parseFloat(atMatch[2]);
                    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                        result.latitude = lat;
                        result.longitude = lng;
                        console.log(`   📍 Coordenadas detectadas en iframe (@): ${lat}, ${lng}`);
                    }
                }
            }

            if (src && (!result.latitude || !result.longitude)) {
                // Último intento: parámetro q=lat,lng
                try {
                    const url = new URL(src, window.location.href);
                    const qParam = url.searchParams.get('q');
                    if (qParam && qParam.includes(',')) {
                        const [latStr, lngStr] = qParam.split(',').map(part => part.trim());
                        const lat = parseFloat(latStr);
                        const lng = parseFloat(lngStr);
                        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                            result.latitude = lat;
                            result.longitude = lng;
                            console.log(`   📍 Coordenadas detectadas en iframe (q=): ${lat}, ${lng}`);
                        }
                    }
                } catch (err) {
                    // Ignorar URLs inválidas
                }
            }

            // 🎯 SISTEMA INTELIGENTE DE SCORING PARA DIRECCIONES
            // Prioriza encabezados/títulos sobre texto en descripciones
            const addressCandidates = [];

            // Estrategia 1: Buscar hermano anterior directo (MÁXIMA PRIORIDAD)
            let previousSibling = iframe.previousElementSibling;
            if (previousSibling) {
                const text = previousSibling.textContent.trim();
                if (text.length > 15 && text.length < 300) {
                    const score = scoreAddressCandidate(text, previousSibling, iframe, true);
                    console.log(`   🔍 Hermano anterior del mapa: "${text}" (score: ${score})`);
                    addressCandidates.push({ text, score, source: 'hermano-directo' });
                }
            }

            // Estrategia 2: Buscar en el contenedor padre del mapa
            let current = iframe.parentElement;
            for (let i = 0; i < 3 && current; i++) {
                // Buscar TODOS los elementos de texto antes del iframe en este nivel
                const allTextElements = Array.from(current.querySelectorAll('h1, h2, h3, h4, h5, p, span, div, li'));

                allTextElements.forEach(el => {
                    // Solo considerar elementos que están ANTES del iframe en el DOM
                    if (el.compareDocumentPosition(iframe) & Node.DOCUMENT_POSITION_FOLLOWING) {
                        const text = el.textContent.trim();

                        // Filtros básicos
                        if (text.length < 15 || text.length > 300) return;

                        const hasNeighborhood = /(fracc|fraccionamiento|colonia|col\.|residencial)/i.test(text);
                        const hasTwoCommas = text.match(/,.*,/);

                        // Solo capturar si tiene indicios de dirección
                        if (hasNeighborhood || hasTwoCommas) {
                            const score = scoreAddressCandidate(text, el, iframe, false);
                            console.log(`   🔍 Texto encontrado antes del mapa: "${text}" (score: ${score})`);
                            addressCandidates.push({ text, score, source: el.tagName.toLowerCase() });
                        }
                    }
                });
                current = current.parentElement;
            }
        });

        // Ordenar por score descendente y tomar la mejor
        addressCandidates.sort((a, b) => b.score - a.score);

        // ⭐ PRIORIDAD ABSOLUTA: Si hay dirección arriba del mapa, usar SOLO esa
        if (addressCandidates.length > 0) {
            console.log(`   🗺️  Encontradas ${addressCandidates.length} dirección(es) cerca del mapa de Google`);
            console.log(`   📊 Ranking de candidatas:`);
            addressCandidates.slice(0, 5).forEach((candidate, idx) => {
                console.log(`      ${idx + 1}. [${candidate.score} pts] ${candidate.text.substring(0, 80)}${candidate.text.length > 80 ? '...' : ''}`);
            });

            // Tomar la dirección con MAYOR SCORE
            const selectedCandidate = addressCandidates[0];
            let selectedAddress = selectedCandidate.text;
            console.log(`   🏆 GANADORA: [${selectedCandidate.score} pts] ${selectedCandidate.source.toUpperCase()}`);

            // Agregar ciudad/estado si no están presentes
            const parts = [selectedAddress];
            if (meta?.cityName && !selectedAddress.toLowerCase().includes(meta.cityName.toLowerCase())) {
                parts.push(meta.cityName);
            }
            if (meta?.stateName && !selectedAddress.toLowerCase().includes(meta.stateName.toLowerCase())) {
                parts.push(meta.stateName);
            }

            result.location = parts.join(', ');
            console.log(`   ✅ Dirección seleccionada: "${result.location}"`);
            console.log(`   🔄 Esta dirección será procesada por geo-address-normalizer más adelante`);

            // Saltar análisis de otras fuentes (ya tenemos la dirección correcta del mapa)
        } else {
            // ⚠️ SOLO si NO hay dirección arriba del mapa, usar sistema inteligente
            console.log(`   ⚠️  No se encontró dirección arriba del mapa, usando sistema inteligente...`);

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
            const normalizedLine = normalizeTextLocal(trimmed);
            // Buscar líneas que contengan ciudad/estado y tengan longitud razonable
            if (trimmed.length > 15 && trimmed.length < 200 &&
                (CITY_TOKENS.some(city => normalizedLine.includes(city)) ||
                 STATE_TOKENS.some(state => normalizedLine.includes(state)))) {

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
            const normalized = normalizeTextLocal(el.textContent);
            return (CITY_TOKENS.some(city => normalized.includes(city)) ||
                    STATE_TOKENS.some(state => normalized.includes(state))) &&
                   normalized.length > 15 && normalized.length < 200;
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

        // Inject neighborhood variants that include Roman numerals (e.g., "Perisur II")
        const romanVariants = [];

        uniqueCandidates.forEach(candidate => {
            if (!isNeighborhoodCandidate(candidate.address)) return;
            const enhancedAddress = createRomanEnhancedAddress(candidate.address);
            if (!enhancedAddress) return;

            const normalized = enhancedAddress.toLowerCase().replace(/\s+/g, '');
            if (seenAddresses.has(normalized)) return;

            const enhancedScore = Math.max(scoreAddress(enhancedAddress) + 1, candidate.score + 1);
            romanVariants.push({
                address: enhancedAddress,
                score: enhancedScore,
                source: `${candidate.source}+roman`
            });
            seenAddresses.add(normalized);
        });

        if (romanVariants.length > 0) {
            romanVariants.forEach(variant => {
                uniqueCandidates.push(variant);
                console.log(`   🆙 Variante con numeral romano: ${variant.address} (score: ${variant.score})`);
            });
        }

        const streetCandidates = uniqueCandidates
            .filter(c => isStreetCandidate(c.address))
            .sort((a, b) => b.score - a.score);
        const streetCandidate = streetCandidates[0] || null;

        const neighborhoodCandidates = uniqueCandidates
            .filter(c => isNeighborhoodCandidate(c.address) &&
                (!streetCandidate || c.address !== streetCandidate.address))
            .sort((a, b) => b.score - a.score);
        let neighborhoodCandidate = neighborhoodCandidates[0] || null;

        if (neighborhoodCandidate) {
            const primaryParts = neighborhoodCandidate.address.split(',').map(part => part.trim()).filter(Boolean);
            const currentPrimary = getPrimaryNonCityPart(primaryParts);
            const baseName = normalizeNeighborhoodBase(currentPrimary);

            if (!hasRomanNumeralSuffix(currentPrimary)) {
                const romanEnhancedCandidate = neighborhoodCandidates.find(candidate => {
                    const parts = candidate.address.split(',').map(part => part.trim()).filter(Boolean);
                    const candidatePrimary = getPrimaryNonCityPart(parts);
                    return candidatePrimary &&
                        hasRomanNumeralSuffix(candidatePrimary) &&
                        normalizeNeighborhoodBase(candidatePrimary) === baseName;
                });

                if (romanEnhancedCandidate) {
                    neighborhoodCandidate = romanEnhancedCandidate;
                }
            }
        }

        if (streetCandidate && neighborhoodCandidate) {
            const streetParts = streetCandidate.address.split(',').map(part => part.trim()).filter(Boolean);
            const neighborhoodParts = neighborhoodCandidate.address.split(',').map(part => part.trim()).filter(Boolean);

            const streetPrimary = getPrimaryNonCityPart(streetParts);
            let neighborhoodPrimary = getPrimaryNonCityPart(neighborhoodParts);
            const { prefix, core, base } = decomposeNeighborhood(neighborhoodPrimary);

            if (!hasRomanNumeralSuffix(core)) {
                const romanVariant =
                    findRomanVariant(base, prefix, result.title || '') ||
                    findRomanVariant(base, prefix, document.title || '') ||
                    findRomanVariant(base, prefix, bodyText) ||
                    findRomanVariant(base, prefix, neighborhoodCandidate.address);
                if (romanVariant) {
                    neighborhoodPrimary = romanVariant;
                }
            }

            const combinedParts = [];
            if (streetPrimary) combinedParts.push(streetPrimary);
            if (neighborhoodPrimary &&
                !combinedParts.some(part => part.toLowerCase() === neighborhoodPrimary.toLowerCase()) &&
                !/\d/.test(neighborhoodPrimary)) {
                combinedParts.push(neighborhoodPrimary);
            }

            appendCityState(combinedParts);

            const combinedAddress = combinedParts.join(', ');
            const combinedNormalized = combinedAddress.toLowerCase().replace(/\s+/g, '');

            if (usableAddress(combinedAddress) && !seenAddresses.has(combinedNormalized)) {
                const combinedScore = Math.max(
                    scoreAddress(combinedAddress) + 2,
                    streetCandidate.score,
                    neighborhoodCandidate.score + 1
                );
                uniqueCandidates.push({
                    address: combinedAddress,
                    score: combinedScore,
                    source: 'street+neighborhood'
                });
                seenAddresses.add(combinedNormalized);
                console.log(`   🔗 Combinando calle + colonia: ${combinedAddress} (score: ${combinedScore})`);
            }
        }

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

                // ============================================
                // ENRIQUECIMIENTO CON NÚMERO ROMANO DEL TÍTULO
                // ============================================
                // Extraer número romano del título (ej: "Perisur II")
                const titleRomanMatch = result.title.match(/\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b/i);
                const titleRomanSuffix = titleRomanMatch ? titleRomanMatch[0].toUpperCase() : null;

                if (titleRomanSuffix && !result.location.toUpperCase().includes(titleRomanSuffix)) {
                    // La dirección NO contiene el número romano pero el título SÍ
                    console.log(`   🔍 Título contiene número romano "${titleRomanSuffix}" pero la ubicación no`);

                    // Buscar y enriquecer la colonia/fraccionamiento en la dirección
                    result.location = result.location.replace(
                        /(Fracc\.|Fraccionamiento|Col\.|Colonia|Residencial|Privada|Priv\.)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ ]+?)(?=,|$)/,
                        (match, prefix, name) => {
                            // Si el nombre ya tiene el número romano, no cambiar nada
                            if (name.toUpperCase().includes(titleRomanSuffix)) {
                                return match;
                            }
                            // Agregar el número romano al final del nombre
                            const enriched = `${prefix} ${name.trim()} ${titleRomanSuffix}`;
                            console.log(`   🆙 Enriqueciendo dirección: "${match}" → "${enriched}"`);
                            return enriched;
                        }
                    );
                }

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

        } // Fin del else - sistema inteligente (solo si NO hay dirección arriba del mapa)

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

        // Fecha de publicación - MÚLTIPLES SELECTORES DE RESPALDO
        let dateFound = false;

        // Método 1: Buscar por clase específica
        const dateEl = document.querySelector('.userViews-module__post-antiquity-views___8Zfch, [class*="post-antiquity"]');
        if (dateEl && dateEl.textContent.trim()) {
            result.publishedDate = dateEl.textContent.trim();
            dateFound = true;
        }

        // Método 2: Buscar por clase que contenga "antiquity" o "date"
        if (!dateFound) {
            const altDateEl = document.querySelector('[class*="antiquity"], [class*="publish"], [class*="fecha"]');
            if (altDateEl && altDateEl.textContent.match(/publicado|hace|días/i)) {
                result.publishedDate = altDateEl.textContent.trim();
                dateFound = true;
            }
        }

        // Método 3: Buscar en el body con regex
        if (!dateFound) {
            const bodyText = document.body.innerText;
            const dateMatch = bodyText.match(/Publicado\s+hace\s+(\d+)\s+(día|días|mes|meses|año|años)/i);
            if (dateMatch) {
                result.publishedDate = `Publicado hace ${dateMatch[1]} ${dateMatch[2]}`;
                dateFound = true;
            }
        }

        // Método 4: Buscar "hace X días" o similar
        if (!dateFound) {
            const bodyText = document.body.innerText;
            const haceMatch = bodyText.match(/hace\s+(\d+|hoy|ayer|más de \d+)\s+(día|días|mes|meses|año|años)?/i);
            if (haceMatch) {
                result.publishedDate = `Publicado ${haceMatch[0]}`;
                dateFound = true;
            }
        }

        // Si no se encuentra nada, dejar vacío (se capturará como "No disponible" en el CRM)
        if (!dateFound) {
            result.publishedDate = '';
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

    // Extraer ID de propiedad de la URL (funciona con o sin query params)
    const idMatch = url.match(/-(\d+)\.html/);
    if (idMatch) {
        data.propertyId = idMatch[1];
    }

    await browser.close();

    // ============================================
    // GEOCODIFICACIÓN V1.5 (CULIACÁN)
    // ============================================

    console.log('\n🌍 Geocodificando ubicación...');
    let geoResult = null;
    try {
        const hasEmbeddedCoords = typeof data.latitude === 'number' && typeof data.longitude === 'number' &&
            !Number.isNaN(data.latitude) && !Number.isNaN(data.longitude);
        const fallbackCoordinates = hasEmbeddedCoords
            ? { lat: data.latitude, lng: data.longitude }
            : null;

        if (fallbackCoordinates) {
            console.log(`   🔍 Coordenadas embebidas detectadas: ${fallbackCoordinates.lat}, ${fallbackCoordinates.lng}`);
        } else {
            console.log('   ℹ️  No se detectaron coordenadas embebidas');
        }

        geoResult = await geocoder.geocode(data.location, {
            fallbackCoordinates,
            googleMapsKey: CONFIG.googleMaps.key
        });

        // Agregar datos geocodificados al objeto data
        data.address_clean = geoResult.address.cleaned;
        data.lat = geoResult.coordinates.lat;
        data.lng = geoResult.coordinates.lng;
        data.locationPrecision = geoResult.precision;  // street|neighborhood|city
        data.locationConfidence = geoResult.confidence; // 0.0-1.0
        data.locationSource = geoResult.source || 'geocoder';  // geocoder|embedded|manual
        data.colonia = geoResult.colonia?.nombre || null;
        data.codigoPostal = geoResult.colonia?.codigoPostal || null;
        data.mapLink = `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`;
        data.directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`;

        // Log resultado geocodificación
        console.log(`   ✅ Geocodificación: ${data.locationPrecision} (${(data.locationConfidence * 100).toFixed(0)}%)`);
        if (data.colonia) {
            console.log(`   🏘️  Colonia: ${data.colonia} (CP: ${data.codigoPostal || 'N/A'})`);
        }
        console.log(`   📍 Coordenadas: ${data.lat}, ${data.lng}`);
    } catch (error) {
        console.warn(`   ⚠️  Error en geocodificación: ${error.message}`);
        // Fallback: agregar campos vacíos
        data.address_clean = data.location;
        data.lat = 24.8091;  // Centro de Culiacán
        data.lng = -107.3940;
        data.locationPrecision = 'city';
        data.locationConfidence = 0.3;
        data.locationSource = 'fallback';
        data.colonia = null;
        data.codigoPostal = null;
        data.mapLink = `https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`;
        data.directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`;
    }

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
    const normalizedLocation = normalizeLocationForCity(data.location, cityConfig.name, cityConfig.state);
    const neighborhood = normalizedLocation.primary;
    const locationDisplay = normalizedLocation.display;
    const mapLocation = normalizedLocation.mapLocation;
    const bedrooms = data.bedrooms || 'N/A';
    const bathrooms = data.bathrooms || 'N/A';
    const construction = data.construction_area || null;
    const landArea = data.land_area || null;

    // Construcción condicional texto m²
    const constructionText = construction ? `${construction}m²` : 'N/A';
    const landAreaText = landArea ? `${landArea}m²` : 'N/A';

    const description = data.description || `${data.title}. ${bedrooms !== 'N/A' ? bedrooms + ' recámaras, ' : ''}${bathrooms !== 'N/A' ? bathrooms + ' baños ' : ''}en ${neighborhood}.`;

    const normalizedCityToken = normalizeText(cityConfig.name);
    const normalizedStateToken = normalizeText(cityConfig.state);
    const addressSource = data.address_clean || mapLocation || '';
    const addressParts = addressSource.split(',').map(part => part.trim()).filter(Boolean);

    const cityTokens = [normalizedCityToken, 'culiacan', 'mazatlan', 'monterrey'];
    const stateTokens = [normalizedStateToken, 'sinaloa', 'nuevo leon'];

    const isCityOrStatePart = (part) => {
        if (!part) return false;
        const normalized = normalizeText(part);
        return cityTokens.some(city => normalized.includes(city)) ||
               stateTokens.some(state => normalized.includes(state));
    };

    const streetPart = addressParts.find(part => /\d+/.test(part)) ||
        addressParts.find(part => !isCityOrStatePart(part)) ||
        (mapLocation.split(',')[0] || '').trim();
    const colonyPart = data.colonia ||
        addressParts.find(part => part !== streetPart && !isCityOrStatePart(part)) ||
        neighborhood;

    const streetAddress = [streetPart, colonyPart]
        .filter((part, index, arr) => part && arr.indexOf(part) === index)
        .join(', ');
    const addressLocality = cityConfig.name;
    const addressRegion = cityConfig.state;
    const postalCode = data.codigoPostal || '80000';

    const sanitizedStreetAddress = streetAddress.replace(/"/g, '\\"');
    const sanitizedLocality = addressLocality.replace(/"/g, '\\"');
    const sanitizedRegion = addressRegion.replace(/"/g, '\\"');
    const sanitizedPostal = postalCode.replace(/"/g, '\\"');

    const geoBlock = (typeof data.lat === 'number' && typeof data.lng === 'number')
        ? `,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": ${data.lat},
        "longitude": ${data.lng}
      }`
        : '';

    // REEMPLAZOS EN METADATA Y HEAD
    html = html.replace(/<title>.*?<\/title>/s,
        `<title>Casa en Venta ${priceFormatted} - ${neighborhood}, ${cityConfig.name} | Hector es Bienes Raíces</title>`);

    html = html.replace(/<meta name="description" content=".*?">/,
        `<meta name="description" content="${data.title} en ${mapLocation}. ${bedrooms !== 'N/A' ? bedrooms + ' recámaras, ' : ''}${bathrooms !== 'N/A' ? bathrooms + ' baños, ' : ''}${constructionText} construcción. Agenda tu visita hoy.">`);

    html = html.replace(/<meta name="keywords" content=".*?">/,
        `<meta name="keywords" content="casa venta ${cityConfig.name}, ${neighborhood}, casa remodelada, ${bedrooms !== 'N/A' ? bedrooms + ' recámaras, ' : ''}cochera techada, ${mapLocation}">`);

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
        "streetAddress": "${sanitizedStreetAddress}",
        "addressLocality": "${sanitizedLocality}",
        "addressRegion": "${sanitizedRegion}",
        "postalCode": "${sanitizedPostal}",
        "addressCountry": "MX"
      }${geoBlock}${construction ? `,
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
        `<div class="detail-value">${locationDisplay}</div> <!-- ubicación -->`);

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
        mapLocation: mapLocation,
        displayLocation: locationDisplay,
        primaryLocation: neighborhood,
        price: data.price,
        title: data.title,
        photoCount: photoCount, // Total de fotos descargadas
        bedrooms: bedrooms !== 'N/A' ? bedrooms : 'N/A',
        bathrooms: bathrooms !== 'N/A' ? bathrooms : 'N/A',
        area: constructionText, // Área de construcción formateada
        whatsapp: cityConfig.whatsapp, // WhatsApp según ciudad
        propertyIndex: 0, // Por ahora siempre 0, luego se puede calcular por colonia
        cityCoords: cityConfig.coords, // Coordenadas de la ciudad para fallback
        city: cityConfig.city,
        cityName: cityConfig.name,
        stateName: cityConfig.state,
        lat: data.lat, // ✅ Coordenadas de Geocoder V1.5
        lng: data.lng  // ✅ Coordenadas de Geocoder V1.5
    });

    // Reemplazar toda la sección del mapa (div + script completo + API script)
    // Buscar desde <div id="map-container"> hasta DESPUÉS del script del API de Google Maps
    html = html.replace(
        /<div id="map-container"[\s\S]*?<\/script>[\s\S]*?<!-- Cargar Google Maps API -->[\s\S]*?<script src="https:\/\/maps\.googleapis\.com\/maps\/api\/js[^>]*><\/script>/,
        customMapHTML
    );

    // LOCATION SUBTITLE - texto arriba del mapa (solo ubicación corta, como en Culiacán)
    // Extraer solo la colonia/fraccionamiento de la ubicación completa
    html = html.replace(/<p class="location-subtitle">.*?<\/p>/g,
        `<p class="location-subtitle">${locationDisplay}</p>`);

    // STICKY BAR LABEL - nombre de la casa
    html = html.replace(/<span class="sticky-price-label">Casa [^<]+<\/span>/g,
        `<span class="sticky-price-label">Casa ${neighborhood}</span>`);

    // FOOTER - dirección completa
    html = html.replace(/<p><i class="fas fa-map-marker-alt"><\/i>\s*[^<]+<\/p>/g,
        `<p><i class="fas fa-map-marker-alt"></i> ${data.title}, ${mapLocation}</p>`);

    // SHARE TEXT - texto para compartir
    html = html.replace(/const text = encodeURIComponent\('¡Mira esta increíble casa en venta en [^']+'\);/g,
        `const text = encodeURIComponent('¡Mira esta increíble casa en venta en ${neighborhood}! ${priceFormatted}');`);

    // WHATSAPP LINKS - actualizar mensaje con ciudad dinámica
    const whatsappMsg = encodeURIComponent(
        `Hola! Me interesa la propiedad:\n${data.title}\n${priceFormatted}\n${mapLocation}\nhttps://casasenventa.info/${cityConfig.folder}/${slug}/`
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
         data-href="${slug}/index.html"
         data-published-date="${data.publishedDate || ''}">
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
            <p class="text-gray-600 mb-2 font-poppins">${data.title}</p>
            <p class="text-xs text-gray-500 mb-4 font-poppins published-date-text">
                ${data.publishedDate || ''}
            </p>

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

    // Determinar coordenadas finales (priorizar geocodificación V1.5 y fallback a JSON-LD)
    const latCandidates = [data.lat, data.latitude];
    const lngCandidates = [data.lng, data.longitude];

    const finalLat = latCandidates.find(value => typeof value === 'number' && !Number.isNaN(value));
    const finalLng = lngCandidates.find(value => typeof value === 'number' && !Number.isNaN(value));

    if (typeof finalLat !== 'number' || typeof finalLng !== 'number') {
        console.log(`   ⚠️  No se encontraron coordenadas válidas (geocoder/JSON-LD)`);
        console.log(`   ℹ️  La propiedad NO se agregará al mapa modal automáticamente`);
        console.log(`   ℹ️  Puedes agregarla manualmente después con coordenadas aproximadas\n`);
        return;
    }

    const coordSource = (typeof data.lat === 'number' && !Number.isNaN(data.lat)) ? 'geocoder' : 'JSON-LD';
    console.log(`   ✅ Coordenadas (${coordSource}): ${finalLat}, ${finalLng}`);

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

    const normalizedLocation = normalizeLocationForCity(data.location, cityConfig.name, cityConfig.state);
    const locationShort = normalizedLocation.primary;

    // Detectar tipo (RENTA o VENTA)
    const tipoPropiedad = data.price.toLowerCase().includes('renta') ||
                          data.title.toLowerCase().includes('renta') ? 'renta' : 'venta';

    // Variable name sanitizada
    const varName = slug.replace(/-/g, '_');

    // Código de la nueva propiedad para el mapa
    const newPropertyCode = `
            // ${tipoPropiedad.toUpperCase()}: ${data.title}
            const ${varName}Property = {
                address: "${normalizedLocation.mapLocation}",
                priceShort: "${priceShort}",
                priceFull: "${formatPrice(data.price)}",
                title: "${data.title}",
                location: "${normalizedLocation.display}",
                bedrooms: ${data.bedrooms || 'null'},
                bathrooms: ${data.bathrooms || 'null'},
                area: "${data.construction_area ? data.construction_area + 'm²' : 'N/D'}",
                type: "${tipoPropiedad}",
                url: "https://casasenventa.info/${cityConfig.folder}/${slug}/",
                whatsapp: "${cityConfig.whatsapp}",
                photos: [
                    ${photosArray.join(',\n                    ')}
                ]
            };
`;

    // Mapa variable name según ciudad
    const mapVarName = cityConfig.city === 'monterrey' ? 'mapMonterrey' :
                       cityConfig.city === 'mazatlan' ? 'mapMazatlan' :
                       'mapCuliacan';

    // Array de marcadores según ciudad (FIX: Multi-ciudad)
    const markersArrayName = cityConfig.city === 'monterrey' ? 'allMonterreyMarkers' :
                             cityConfig.city === 'mazatlan' ? 'allMazatlanMarkers' :
                             'allCuliacanMarkers';

    // Código con coordenadas FIJAS (más rápido y confiable que geocodificación)
    const newMarkerCode = `
            // ${data.title} - Coordenadas finales (${coordSource})
            const ${varName}Position = new google.maps.LatLng(${finalLat}, ${finalLng});
            const ${varName}MarkerClass = createZillowPropertyMarker(${varName}Property, window.${mapVarName});
            const ${varName}Marker = new ${varName}MarkerClass(${varName}Position, window.${mapVarName}, ${varName}Property);
            window.${markersArrayName}.push(${varName}Marker);
            console.log('Marcador ${data.title} (${tipoPropiedad.toUpperCase()}) creado en:', ${varName}Position.lat(), ${varName}Position.lng());
`;

    // Buscar dónde insertar la definición de la propiedad
    // Patrones genéricos que funcionan en TODAS las ciudades + fallback robusto
    const patterns = [
        // Patrón 1: Buscar cualquier propiedad existente (RENTA o VENTA)
        /(\s+)\/\/ (RENTA|VENTA):/,
        // Patrón 2: Buscar const *Property = {
        /(\s+)const \w+Property = \{/,
        // Patrón 3: Buscar comentario de geocodificación
        /(\s+)\/\/ Geocodificar/,
        // Patrón 4: Fallback - buscar window.all*Markers = []
        new RegExp(`(\\s+)window\\.${markersArrayName} = \\[\\];`)
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
    // Patrones genéricos que funcionan en TODAS las ciudades
    const markerPatterns = [
        // Patrón 1: Buscar cualquier console.log('Marcador ...')
        /(\s+)console\.log\('Marcador [^']*'\);/,
        // Patrón 2: Buscar window.all*Markers.push(...)
        new RegExp(`(\\s+)window\\.${markersArrayName}\\.push\\(`),
        // Patrón 3: Buscar comentario de filtros Zillow
        /(\s+)\/\/ Inicializar filtros Zillow cuando el mapa esté listo/,
        // Patrón 4: Fallback - buscar google.maps.event.addListener
        /(\s+)google\.maps\.event\.addListener\(/
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
    const autoConfirm = args.includes('--auto-confirm');

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

        // 2. Confirmar ciudad con el usuario (o auto-confirmar si flag está activo)
        const confirmedCity = await confirmCity(detectedCity, autoConfirm);
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

        // 2.1 Verificar términos prohibidos (remates, juicios, invasiones)
        const forbiddenTerm = detectForbiddenTerm(data);
        if (forbiddenTerm) {
            console.log('');
            console.log(`🛑 Propiedad descartada: se detectó la palabra "${forbiddenTerm}" en la información.`);
            console.log('   → No se generará contenido ni se harán commits.\n');
            process.exit(0);
        }

        // 2.2 Verificar duplicados por ID
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
        execSync(`git add ${propertyDir} ${cityConfig.indexPath} crm-vendedores.json`, { stdio: 'inherit' });
        execSync(`git commit -m "Add: ${data.title} (Inmuebles24 - ${cityConfig.name})

- Scrapeado de Inmuebles24
- ${photoCount} fotos descargadas
- Master Template aplicado
- Tarjeta agregada a ${cityConfig.indexPath}
- CRM actualizado automáticamente
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
            url: url,
            // Geolocalización V1.5
            lat: data.lat,
            lng: data.lng,
            locationPrecision: data.locationPrecision,
            locationSource: data.locationSource,
            colonia: data.colonia,
            codigoPostal: data.codigoPostal
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
