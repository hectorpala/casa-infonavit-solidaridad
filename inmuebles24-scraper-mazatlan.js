#!/usr/bin/env node

/**
 * SCRAPER Y PUBLICADOR AUTOMÁTICO - INMUEBLES24.COM + CRM VENDEDORES
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
 * 1. Scrapea datos de Inmuebles24 (título, precio, fotos, descripción, características)
 * 2. Descarga todas las fotos automáticamente
 * 3. Genera página HTML con Master Template
 * 4. Agrega tarjeta a mazatlan/index.html
 * 5. Commit y push automático a GitHub
 * 6. Actualiza CRM de vendedores automáticamente
 * 7. Listo en 2-3 minutos
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
    scraped_properties_file: 'inmuebles24-scraped-properties-mazatlan.json', // Registro de propiedades scrapeadas
    crm_vendedores_file: 'crm-vendedores-mazatlan.json' // CRM de vendedores
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

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
 * @param {string} [config.propertyIndex=0] - Índice para offset si hay múltiples en misma colonia
 * @returns {string} HTML del mapa con script
 */
function generateMapWithCustomMarker(config) {
    const { location, price, title, propertyIndex = 0 } = config;
    const priceShort = formatPriceShort(price);
    const precision = detectAddressPrecision(location);

    // Calcular offset si hay múltiples propiedades en misma zona
    const latOffset = precision.offsetNeeded ? (propertyIndex * 0.002) : 0;
    const lngOffset = precision.offsetNeeded ? (propertyIndex * 0.002) : 0;

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

                    // Crear mapa
                    map = new google.maps.Map(document.getElementById('map-container'), {
                        center: position,
                        zoom: MARKER_CONFIG.precision === 'exact' ? 17 :
                              MARKER_CONFIG.precision === 'street' ? 16 : 15,
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

                    // Crear marcador personalizado con precio
                    const markerHTML = \`
                        <div style="
                            background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
                            color: white;
                            padding: 8px 14px;
                            border-radius: 20px;
                            font-weight: bold;
                            font-size: 14px;
                            box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
                            position: relative;
                            white-space: nowrap;
                            font-family: 'Poppins', sans-serif;
                            border: 3px solid white;
                        ">
                            $\${MARKER_CONFIG.priceShort}
                            <div style="
                                position: absolute;
                                bottom: -8px;
                                left: 50%;
                                transform: translateX(-50%);
                                width: 0;
                                height: 0;
                                border-left: 8px solid transparent;
                                border-right: 8px solid transparent;
                                border-top: 8px solid #FF8C42;
                            "></div>
                        </div>
                    \`;

                    // Crear overlay personalizado
                    const CustomMarker = function(position, map) {
                        this.position = position;
                        this.div = null;
                        this.setMap(map);
                    };

                    CustomMarker.prototype = new google.maps.OverlayView();

                    CustomMarker.prototype.onAdd = function() {
                        const div = document.createElement('div');
                        div.style.position = 'absolute';
                        div.innerHTML = markerHTML;
                        div.style.cursor = 'pointer';

                        // Click en marcador: abrir info con foto
                        div.addEventListener('click', () => {
                            const infoWindow = new google.maps.InfoWindow({
                                content: \`
                                    <div style="font-family: 'Poppins', sans-serif; padding: 0; max-width: 260px;">
                                        <img src="images/foto-1.jpg"
                                             alt="\${MARKER_CONFIG.title}"
                                             style="width: 100%; height: 160px; object-fit: cover; display: block; border-radius: 4px 4px 0 0;">
                                        <div style="padding: 8px 10px;">
                                            <h4 style="margin: 0 0 4px 0; color: #FF6B35; font-size: 14px; font-weight: 600;">\${MARKER_CONFIG.priceShort}</h4>
                                            <h5 style="margin: 0 0 3px 0; color: #1f2937; font-size: 12px; font-weight: 600;">\${MARKER_CONFIG.title}</h5>
                                            <p style="margin: 0; color: #6b7280; font-size: 11px; line-height: 1.3;">\${MARKER_CONFIG.location}</p>
                                        </div>
                                    </div>
                                \`
                            });
                            infoWindow.setPosition(this.position);
                            infoWindow.open(map);
                        });

                        this.div = div;
                        const panes = this.getPanes();
                        panes.overlayMouseTarget.appendChild(div);
                    };

                    CustomMarker.prototype.draw = function() {
                        const overlayProjection = this.getProjection();
                        const position = overlayProjection.fromLatLngToDivPixel(this.position);

                        const div = this.div;
                        div.style.left = (position.x - 40) + 'px'; // Centrar (ajustar según ancho)
                        div.style.top = (position.y - 50) + 'px'; // Arriba del punto
                    };

                    CustomMarker.prototype.onRemove = function() {
                        if (this.div) {
                            this.div.parentNode.removeChild(this.div);
                            this.div = null;
                        }
                    };

                    // Agregar marcador al mapa
                    marker = new CustomMarker(position, map);

                } else {
                    console.error('Geocode error:', status);
                    // Fallback: mostrar mapa en ubicación genérica
                    const fallbackCenter = { lat: 23.2494, lng: -106.4111 }; // Mazatlán centro
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
            if (cleaned && cleaned !== 'culiacán' && cleaned !== 'mazatlan') {
                tags.push(cleaned);
            }
        });
        tags.push('mazatlan');

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

async function scrapeInmuebles24(url) {
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

    // Hacer clic en "Leer descripción completa" o "Ver más" para expandir descripción
    console.log('📝 Buscando botón "Leer más" en descripción...');
    try {
        const expandDescription = await page.evaluate(() => {
            // Buscar botón que contenga texto "leer más", "ver más", "leer descripción"
            const buttons = Array.from(document.querySelectorAll('button, a, span[role="button"], div[class*="more"], button[class*="more"]'));
            const expandBtn = buttons.find(btn => {
                const text = btn.textContent.toLowerCase();
                return text.includes('leer más') ||
                       text.includes('ver más') ||
                       text.includes('leer descripción') ||
                       text.includes('descripción completa') ||
                       text.includes('read more');
            });

            if (expandBtn) {
                expandBtn.click();
                return true;
            }
            return false;
        });

        if (expandDescription) {
            console.log('   ✅ Clic en "Leer más" - descripción expandida');
            // Esperar a que se expanda la descripción
            await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
            console.log('   ℹ️  Botón "Leer más" no encontrado (descripción ya completa)');
        }
    } catch (error) {
        console.log('   ⚠️  Error al expandir descripción:', error.message);
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

            // PRIORIDAD: Buscar primero teléfonos de Mazatlán (669)
            const mazatlanPhone = html.match(/(669\d{7})/);
            if (mazatlanPhone) {
                result.telefono = mazatlanPhone[1];
            } else {
                // Fallback: buscar otros números de México (10 dígitos):
                // 667/668 = Culiacán, 331 = Guadalajara, 81 = Monterrey, etc.
                const phoneMatch = html.match(/((667|668|331|33|81|55|686|664|618|612|614|656|662|871|222|442|461|477)\d{7,8})/);
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

    const data = await page.evaluate(() => {
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

        // Ubicación - extraer dirección específica que aparece arriba del mapa
        // Buscar en el texto completo de la página líneas con patrón: "Calle/Avenida/Fraccionamiento, ... Mazatlán"
        const bodyText = document.body.innerText;
        const lines = bodyText.split('\n');

        // Buscar líneas que contengan dirección + Mazatlán
        const addressLine = lines.find(line => {
            const trimmed = line.trim();
            // Buscar patrones: "XXX, XXX, Mazatlán" o "XXX, Fraccionamiento XXX, Mazatlán"
            return trimmed.length > 15 && trimmed.length < 150 &&
                   (trimmed.match(/[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*Mazatlán/i) ||
                    trimmed.match(/[A-Za-z\s]+,\s*Fraccionamiento\s+[A-Za-z\s]+,\s*Mazatlán/i));
        });

        if (addressLine) {
            // Limpiar espacios extra
            result.location = addressLine.trim().replace(/\s+,/g, ',').replace(/,\s+/g, ', ');
        } else {
            // Fallback: buscar en breadcrumbs como antes
            const breadcrumbs = Array.from(document.querySelectorAll('a, span')).filter(el => {
                const text = el.textContent.toLowerCase();
                return (text.includes('mazatlán') || text.includes('mazatlan') || text.includes('sinaloa')) && text.length < 150;
            });

            const mazatlanBreadcrumb = breadcrumbs.find(el =>
                el.textContent.toLowerCase().includes('mazatlán') ||
                el.textContent.toLowerCase().includes('mazatlan')
            );

            if (mazatlanBreadcrumb) {
                result.location = mazatlanBreadcrumb.textContent.trim();
            } else {
                // Fallback final: "Mazatlán, Sinaloa"
                result.location = 'Mazatlán, Sinaloa';
            }
        }

        // Descripción - buscar en varios posibles contenedores
        // Incrementado límite a 5000 caracteres para capturar descripciones completas
        const descSelectors = ['[class*="description"]', '[class*="Description"]', 'p[class*="detail"]', 'section p', 'div[class*="description"]'];
        for (const selector of descSelectors) {
            const descEls = document.querySelectorAll(selector);
            for (const el of descEls) {
                const text = el.textContent.trim();
                // Buscar descripción entre 100 y 5000 caracteres
                if (text.length > 100 && text.length < 5000) {
                    // Filtrar basura conocida
                    if (!text.includes('Calculamos el nivel') &&
                        !text.includes('Google Analytics') &&
                        !text.includes('cookies')) {
                        result.description = text;
                        break;
                    }
                }
            }
            if (result.description) break;
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

        // PASO 2: Buscar características SOLO en iconos/badges (NO en descripción NI menú navegación)
        // Estrategia: Buscar elementos pequeños con iconos (li, span cortos cerca de SVG/i/icons)
        const allTextElements = Array.from(document.querySelectorAll('li, span, div')).reverse();

        allTextElements.forEach(el => {
            const text = el.textContent.trim().toLowerCase();

            // FILTRO CRÍTICO: Solo textos MUY cortos (típico de iconos: "3 recámaras", "2 baños")
            // Ignorar textos largos que probablemente son descripción
            if (text.length > 50 || el.children.length > 3) return;

            // FILTRO ANTI-MENÚ: Excluir elementos que son parte del menú de navegación de Inmuebles24
            // Detectar si es un link del menú (href contiene "/inmuebles-en-venta-con-" o "/inmuebles-en-renta-con-")
            if (el.tagName === 'A' && el.href && (el.href.includes('/inmuebles-en-venta-con-') ||
                                                   el.href.includes('/inmuebles-en-renta-con-'))) {
                return; // Skip menu links
            }

            // También excluir <li> padres de estos links
            if (el.querySelector('a[href*="/inmuebles-en-venta-con-"], a[href*="/inmuebles-en-renta-con-"]')) {
                return; // Skip menu items
            }

            // FILTRO ADICIONAL: Verificar si el elemento o sus hijos tienen íconos
            const hasIcon = el.querySelector('svg, i, img[class*="icon"]') ||
                           el.parentElement?.querySelector('svg, i, img[class*="icon"]');

            // Si NO tiene ícono Y el texto es >20 chars, probablemente NO es un badge
            if (!hasIcon && text.length > 20) return;

            // Recámaras - solo actualizar si encontramos en contexto de ícono
            if (text.match(/(\d+)\s*(recámara|dormitorio)/i)) {
                const match = text.match(/(\d+)\s*(recámara|dormitorio)/i);
                if (match) {
                    result.bedrooms = parseInt(match[1]);
                }
            }

            // Baños - solo actualizar si encontramos en contexto de ícono
            if (text.match(/(\d+)\s*baño/i)) {
                const match = text.match(/(\d+)\s*baño/i);
                if (match) {
                    result.bathrooms = parseInt(match[1]);
                }
            }

            // Estacionamiento/Cochera
            if (text.match(/(\d+)\s*(estacionamiento|cochera)/i)) {
                const match = text.match(/(\d+)\s*(estacionamiento|cochera)/i);
                if (match) {
                    result.parking = parseInt(match[1]);
                }
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
    });

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

    // ============================================
    // 🔍 SISTEMA DE VALIDACIÓN AUTOMÁTICA
    // ============================================
    console.log('\n🔍 Validando datos scrapeados...\n');

    const validationIssues = [];
    const validationWarnings = [];

    // Validación 1: Recámaras (debe ser 1-6, típicamente 2-4)
    if (data.bedrooms === 0 || data.bedrooms > 6) {
        validationIssues.push(`⚠️  Recámaras sospechosas: ${data.bedrooms} (esperado: 1-6)`);
    }

    // Validación 2: Baños (debe ser 1-5, típicamente 1-3)
    if (data.bathrooms === 0 || data.bathrooms > 5) {
        validationIssues.push(`⚠️  Baños sospechosos: ${data.bathrooms} (esperado: 1-5)`);
    }

    // Validación 3: M² construcción (debe ser 40-500m² típicamente)
    if (data.construction_area && (data.construction_area < 40 || data.construction_area > 500)) {
        validationWarnings.push(`⚠️  M² construcción inusual: ${data.construction_area}m² (típico: 40-500m²)`);
    }

    // Validación 4: M² terreno >= M² construcción
    if (data.land_area && data.construction_area && data.land_area < data.construction_area) {
        validationIssues.push(`⚠️  Terreno (${data.land_area}m²) menor que construcción (${data.construction_area}m²)`);
    }

    // Validación 5: Precio válido
    if (!data.price || data.price === 'N/A') {
        validationIssues.push(`⚠️  Precio no capturado`);
    }

    // Validación 6: Título no vacío
    if (!data.title || data.title.trim().length < 10) {
        validationIssues.push(`⚠️  Título muy corto o vacío: "${data.title}"`);
    }

    // Validación 7: Al menos 5 fotos
    if (data.images.length < 5) {
        validationWarnings.push(`⚠️  Pocas fotos: ${data.images.length} (recomendado: 10+)`);
    }

    // Validación 8: Vendedor con teléfono
    if (!data.vendedor.telefono) {
        validationWarnings.push(`⚠️  Teléfono del vendedor no capturado`);
    }

    // Mostrar resultados de validación
    if (validationIssues.length === 0 && validationWarnings.length === 0) {
        console.log('   ✅ Todos los datos son coherentes\n');
    } else {
        if (validationIssues.length > 0) {
            console.log('   🚨 PROBLEMAS DETECTADOS:');
            validationIssues.forEach(issue => console.log(`      ${issue}`));
        }
        if (validationWarnings.length > 0) {
            console.log('   ⚠️  ADVERTENCIAS:');
            validationWarnings.forEach(warning => console.log(`      ${warning}`));
        }
        console.log('');
    }
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

function generateHTML(data, slug, photoCount) {
    console.log('📄 Generando HTML desde template La Primavera...\n');

    // Leer template completo de La Primavera
    const templatePath = 'mazatlan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/index.html';
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

    // Usar descripción scrapeada SI existe y es válida (>50 chars), sino auto-generar
    let description;
    if (data.description && data.description.length > 50) {
        description = data.description;
        console.log(`   ✅ Usando descripción scrapeada (${data.description.length} caracteres)`);
    } else {
        description = `${data.title}. ${bedrooms !== 'N/A' ? bedrooms + ' recámaras, ' : ''}${bathrooms !== 'N/A' ? bathrooms + ' baños, ' : ''}${constructionText} de construcción, ${landAreaText} de terreno en ${neighborhood}.`;
        console.log(`   ℹ️  Generando descripción automática (descripción scrapeada inválida)`);
    }

    // REEMPLAZOS EN METADATA Y HEAD
    html = html.replace(/<title>.*?<\/title>/s,
        `<title>Casa en Venta ${priceFormatted} - ${neighborhood}, Mazatlán | Hector es Bienes Raíces</title>`);

    html = html.replace(/<meta name="description" content=".*?">/,
        `<meta name="description" content="${data.title} en ${data.location}. ${bedrooms !== 'N/A' ? bedrooms + ' recámaras, ' : ''}${bathrooms !== 'N/A' ? bathrooms + ' baños, ' : ''}${constructionText} construcción. Agenda tu visita hoy.">`);

    html = html.replace(/<meta name="keywords" content=".*?">/,
        `<meta name="keywords" content="casa venta Mazatlán, ${neighborhood}, casa remodelada, ${bedrooms !== 'N/A' ? bedrooms + ' recámaras, ' : ''}cochera techada, ${data.location}">`);

    html = html.replace(/<link rel="canonical" href=".*?">/,
        `<link rel="canonical" href="https://casasenventa.info/mazatlan/${slug}/">`);

    // Open Graph
    html = html.replace(/<meta property="og:title" content=".*?">/,
        `<meta property="og:title" content="Casa en Venta ${priceFormatted} - ${neighborhood}">`);

    html = html.replace(/<meta property="og:description" content=".*?">/s,
        `<meta property="og:description" content="${bedrooms !== 'N/A' ? bedrooms + ' recámaras • ' : ''}${bathrooms !== 'N/A' ? bathrooms + ' baños • ' : ''}${constructionText} construcción • ${landAreaText} terreno">`);

    html = html.replace(/<meta property="og:url" content=".*?">/,
        `<meta property="og:url" content="https://casasenventa.info/mazatlan/${slug}/">`);

    html = html.replace(/<meta property="og:image" content=".*?">/,
        `<meta property="og:image" content="https://casasenventa.info/mazatlan/${slug}/images/foto-1.jpg">`);

    // Schema.org - reemplazar bloque completo
    const schemaStart = html.indexOf('<script type="application/ld+json">');
    const schemaEnd = html.indexOf('</script>', schemaStart) + 9;
    const newSchema = `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SingleFamilyResidence",
      "name": "${data.title}",
      "description": "${description}",
      "url": "https://casasenventa.info/mazatlan/${slug}/",
      "image": [
        ${Array.from({length: Math.min(photoCount, 10)}, (_, i) =>
            `"https://casasenventa.info/mazatlan/${slug}/images/foto-${i+1}.jpg"`).join(',\n        ')}
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "${neighborhood}",
        "addressLocality": "${data.location}",
        "addressRegion": "Sinaloa",
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
        propertyIndex: 0 // Por ahora siempre 0, luego se puede calcular por colonia
    });

    // Reemplazar toda la sección del mapa (iframe + container)
    html = html.replace(
        /<div class="map-container">[\s\S]*?<\/iframe>[\s\S]*?<\/div>/,
        customMapHTML
    );

    // LOCATION SUBTITLE - texto arriba del mapa
    html = html.replace(/<p class="location-subtitle">.*?<\/p>/g,
        `<p class="location-subtitle">${data.title}, ${data.location}</p>`);

    // STICKY BAR LABEL - nombre de la casa
    html = html.replace(/<span class="sticky-price-label">Casa [^<]+<\/span>/g,
        `<span class="sticky-price-label">Casa ${neighborhood}</span>`);

    // FOOTER - dirección completa
    html = html.replace(/<p><i class="fas fa-map-marker-alt"><\/i>\s*[^<]+<\/p>/g,
        `<p><i class="fas fa-map-marker-alt"></i> ${data.title}, ${data.location}</p>`);

    // SHARE TEXT - texto para compartir
    html = html.replace(/const text = encodeURIComponent\('¡Mira esta increíble casa en venta en [^']+'\);/g,
        `const text = encodeURIComponent('¡Mira esta increíble casa en venta en ${neighborhood}! ${priceFormatted}');`);

    // WHATSAPP LINKS - actualizar mensaje
    const whatsappMsg = encodeURIComponent(
        `Hola! Me interesa la propiedad:\n${data.title}\n${priceFormatted}\n${data.location}\nhttps://casasenventa.info/mazatlan/${slug}/`
    );
    html = html.replace(/https:\/\/wa\.me\/528111652545\?text=[^"]+/g,
        `https://wa.me/528111652545?text=${whatsappMsg}`);

    // CRÍTICO: Reemplazar API key vieja con la nueva
    const OLD_API_KEY = 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8';
    const NEW_API_KEY = CONFIG.googleMaps.key;
    html = html.replace(new RegExp(OLD_API_KEY, 'g'), NEW_API_KEY);
    console.log('   ✅ API key actualizada a nueva key');

    // Copiar styles.css
    const stylesSource = 'mazatlan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/styles.css';
    const stylesPath = `mazatlan/${slug}/styles.css`;
    if (fs.existsSync(stylesSource)) {
        fs.copyFileSync(stylesSource, stylesPath);
        console.log('   ✅ styles.css copiado');
    }

    console.log('   ✅ HTML generado con template La Primavera');
    return html;
}

// ============================================
// INTEGRACIÓN A CULIACÁN INDEX
// ============================================

function addToIndex(data, slug) {
    console.log('📝 Agregando tarjeta a mazatlan/index.html...\n');

    const indexPath = 'mazatlan/index.html';
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
        console.log('   ✅ Tarjeta agregada AL INICIO de mazatlan/index.html (más reciente)\n');
    } else {
        console.log('   ⚠️  No se encontró la primera tarjeta, agregando al final...');
        const gridEndRegex = /\n\n\s*<!-- Ver más propiedades \(resto de propiedades como muestra\) -->/;
        indexHtml = indexHtml.replace(gridEndRegex, `\n\n${card}\n\n            <!-- Ver más propiedades (resto de propiedades como muestra) -->`);
        console.log('   ✅ Tarjeta agregada al final de mazatlan/index.html\n');
    }

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
        // 1. Scrapear datos
        const data = await scrapeInmuebles24(url);

        // 1.1 Verificar duplicados por ID
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

        // 2. Generar slug
        const slug = generateSlug(data.title);
        console.log(`🔗 Slug generado: ${slug}\n`);

        // 3. Crear directorios
        const propertyDir = `mazatlan/${slug}`;
        const imagesDir = `${propertyDir}/images`;

        if (!fs.existsSync(propertyDir)) {
            fs.mkdirSync(propertyDir, { recursive: true });
        }

        // 4. CONFIRMACIÓN INTERACTIVA - Revisar datos antes de continuar
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMEN DE DATOS CAPTURADOS');
        console.log('='.repeat(60));
        console.log(`\n📝 Título:        ${data.title}`);
        console.log(`💰 Precio:        ${data.price}`);
        console.log(`🛏️  Recámaras:     ${data.bedrooms}`);
        console.log(`🛁 Baños:         ${data.bathrooms}`);
        console.log(`📐 Construcción:  ${data.construction_area || 'N/A'}m²`);
        console.log(`🏞️  Terreno:       ${data.land_area || 'N/A'}m²`);
        console.log(`📸 Fotos:         ${data.images.length}`);
        console.log(`👤 Vendedor:      ${data.vendedor.nombre || 'N/A'}`);
        console.log(`📞 Teléfono:      ${data.vendedor.telefono || 'N/A'}`);
        console.log(`📅 Publicada:     ${data.publishedDate}`);
        console.log(`👁️  Vistas:        ${data.views}`);
        console.log(`🆔 ID Propiedad:  ${data.propertyId}`);
        console.log(`\n` + '='.repeat(60));

        // Importar readline para confirmación interactiva
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const confirmed = await new Promise((resolve) => {
            rl.question('\n✅ ¿Los datos son correctos? (s/n): ', (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 's' || answer.toLowerCase() === 'si' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            });
        });

        if (!confirmed) {
            console.log('\n❌ Scraping cancelado por el usuario.');
            console.log('💡 Tip: Revisa la URL o reporta el problema si los datos están incorrectos.\n');
            process.exit(0);
        }

        console.log('\n✅ Continuando con descarga de fotos...\n');

        // 5. Descargar fotos
        const photoCount = await downloadPhotos(data.images, imagesDir);

        if (photoCount === 0) {
            console.error('❌ ERROR: No se descargaron fotos\n');
            process.exit(1);
        }

        // 6. Generar HTML
        const html = generateHTML(data, slug, photoCount);
        const htmlPath = `${propertyDir}/index.html`;
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log(`✅ HTML generado: ${htmlPath}\n`);

        // 7. Agregar a index
        addToIndex(data, slug);

        // 8. Commit y push automático
        console.log('🚀 Publicando a GitHub...\n');
        execSync(`git add ${propertyDir} mazatlan/index.html`, { stdio: 'inherit' });
        execSync(`git commit -m "Add: ${data.title} (Inmuebles24)

- Scrapeado de Inmuebles24
- ${photoCount} fotos descargadas
- Master Template aplicado
- Tarjeta agregada a mazatlan/index.html

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
        console.log(`   Producción: ${CONFIG.baseUrl}/mazatlan/${slug}/`);
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
