#!/usr/bin/env node

/**
 * SCRAPER Y PUBLICADOR AUTOMÁTICO - INMUEBLES24.COM
 *
 * USO: node inmuebles24-scraper-y-publicar.js "URL_DE_INMUEBLES24"
 *
 * PROCESO COMPLETO:
 * 1. Scrapea datos de Inmuebles24 (título, precio, fotos, descripción, características)
 * 2. Descarga todas las fotos automáticamente
 * 3. Genera página HTML con Master Template
 * 4. Agrega tarjeta a culiacan/index.html
 * 5. Commit y push automático a GitHub
 * 6. Listo en 2-3 minutos
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
        key: process.env.GOOGLE_MAPS_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8'
    },
    baseUrl: 'https://casasenventa.info',
    timeout: 60000,
    headless: false // Mostrar navegador para bypass de protecciones
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
            const phoneMatch = html.match(/(66[67]\d{7})/);
            if (phoneMatch) {
                result.telefono = phoneMatch[1];
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
            vendedor: { nombre: '', telefono: '' }
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

        // Ubicación - extraer del breadcrumb o título
        const breadcrumbs = Array.from(document.querySelectorAll('a, span')).filter(el => {
            const text = el.textContent.toLowerCase();
            return (text.includes('sinaloa') || text.includes('culiacán')) && text.length < 150;
        });
        if (breadcrumbs.length > 0) {
            result.location = breadcrumbs[0].textContent.trim();
        } else {
            // Fallback: extraer del título de la página
            const titleText = document.querySelector('title');
            if (titleText) {
                const match = titleText.textContent.match(/Centro de La Ciudad,\s*([^-]+)/);
                if (match) {
                    result.location = match[1].trim();
                }
            }
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

        // PASO 1: Buscar datos en TODO el body text (incluyendo descripción)
        const bodyText = document.body.innerText;

        // Buscar "Mts de terreno X.XX" en descripción
        const terrenoMatch = bodyText.match(/Mts?\s+de\s+terreno\s+([\d.,]+)/i);
        if (terrenoMatch) {
            result.land_area = parseFloat(terrenoMatch[1].replace(',', '.'));
        }

        // Buscar "Construcción X" en descripción (después de terreno)
        const construccionMatch = bodyText.match(/Construcción\s+([\d.,]+)/i);
        if (construccionMatch) {
            result.construction_area = parseFloat(construccionMatch[1].replace(',', '.'));
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

        return result;
    });

    // Agregar datos del vendedor al objeto data
    data.vendedor = vendedorData;

    await browser.close();

    console.log('\n✅ Datos extraídos exitosamente:');
    console.log(`   📝 Título: ${data.title}`);
    console.log(`   💰 Precio: ${data.price}`);
    console.log(`   📍 Ubicación: ${data.location}`);
    console.log(`   🛏️  ${data.bedrooms} recámaras`);
    console.log(`   🛁 ${data.bathrooms} baños`);
    console.log(`   📸 ${data.images.length} imágenes encontradas`);
    if (data.vendedor.nombre || data.vendedor.telefono) {
        console.log(`   👤 Vendedor: ${data.vendedor.nombre || 'N/A'}`);
        console.log(`   📞 Tel: ${data.vendedor.telefono || 'N/A'}`);
    }
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
    const templatePath = 'culiacan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/index.html';
    let html = fs.readFileSync(templatePath, 'utf8');

    // Datos calculados
    const priceFormatted = formatPrice(data.price);
    const priceNumeric = extractPriceNumber(data.price);
    const neighborhood = data.location.split(',')[0].trim();
    const bedrooms = data.bedrooms || 3;
    const bathrooms = data.bathrooms || 2;
    const construction = data.construction_area || 150;
    const landArea = data.land_area || 200;
    const description = data.description || `${data.title}. ${bedrooms} recámaras, ${bathrooms} baños en ${neighborhood}.`;

    // REEMPLAZOS EN METADATA Y HEAD
    html = html.replace(/<title>.*?<\/title>/s,
        `<title>Casa en Venta ${priceFormatted} - ${neighborhood}, Culiacán | Hector es Bienes Raíces</title>`);

    html = html.replace(/<meta name="description" content=".*?">/,
        `<meta name="description" content="${data.title} en ${data.location}. ${bedrooms} recámaras, ${bathrooms} baños, ${construction}m² construcción. Agenda tu visita hoy.">`);

    html = html.replace(/<meta name="keywords" content=".*?">/,
        `<meta name="keywords" content="casa venta Culiacán, ${neighborhood}, casa remodelada, ${bedrooms} recámaras, cochera techada, ${data.location}">`);

    html = html.replace(/<link rel="canonical" href=".*?">/,
        `<link rel="canonical" href="https://casasenventa.info/culiacan/${slug}/">`);

    // Open Graph
    html = html.replace(/<meta property="og:title" content=".*?">/,
        `<meta property="og:title" content="Casa en Venta ${priceFormatted} - ${neighborhood}">`);

    html = html.replace(/<meta property="og:description" content=".*?">/s,
        `<meta property="og:description" content="${bedrooms} recámaras • ${bathrooms} baños • ${construction}m² construcción • ${landArea}m² terreno">`);

    html = html.replace(/<meta property="og:url" content=".*?">/,
        `<meta property="og:url" content="https://casasenventa.info/culiacan/${slug}/">`);

    html = html.replace(/<meta property="og:image" content=".*?">/,
        `<meta property="og:image" content="https://casasenventa.info/culiacan/${slug}/images/foto-1.jpg">`);

    // Schema.org - reemplazar bloque completo
    const schemaStart = html.indexOf('<script type="application/ld+json">');
    const schemaEnd = html.indexOf('</script>', schemaStart) + 9;
    const newSchema = `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SingleFamilyResidence",
      "name": "${data.title}",
      "description": "${description}",
      "url": "https://casasenventa.info/culiacan/${slug}/",
      "image": [
        ${Array.from({length: Math.min(photoCount, 10)}, (_, i) =>
            `"https://casasenventa.info/culiacan/${slug}/images/foto-${i+1}.jpg"`).join(',\n        ')}
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "${neighborhood}",
        "addressLocality": "${data.location}",
        "addressRegion": "Sinaloa",
        "postalCode": "80000",
        "addressCountry": "MX"
      },
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": ${construction},
        "unitCode": "MTK"
      },
      "lotSize": {
        "@type": "QuantitativeValue",
        "value": ${landArea},
        "unitCode": "MTK"
      },
      "numberOfBedrooms": ${bedrooms},
      "numberOfBathroomsTotal": ${bathrooms},
      "numberOfFullBathrooms": ${bathrooms},
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
    html = html.replace(/🛏️\s*\d+\s*recámaras?/g, `🛏️ ${bedrooms} recámaras`);
    html = html.replace(/🛁\s*\d+(\.\d+)?\s*baños?/g, `🛁 ${bathrooms} baños`);
    html = html.replace(/📐\s*\d+m²\s*construcción/g, `📐 ${construction}m² construcción`);
    html = html.replace(/🏞️\s*\d+m²\s*terreno/g, `🏞️ ${landArea}m² terreno`);

    // FEATURES COMPACT SECTION - iconos debajo del botón compartir (con parking)
    // Recámaras (icon bed)
    html = html.replace(/(<i class="fas fa-bed"><\/i>\s*<span class="feature-value">)\d+(<\/span>)/g,
        `$1${bedrooms}$2`);

    // Baños (icon bath)
    html = html.replace(/(<i class="fas fa-bath"><\/i>\s*<span class="feature-value">)\d+(\.\d+)?(<\/span>)/g,
        `$1${bathrooms}$3`);

    // Estacionamiento (icon car)
    html = html.replace(/(<i class="fas fa-car"><\/i>\s*<span class="feature-value">)\d+(<\/span>)/g,
        `$1${data.parking || 1}$2`);

    // m² Construcción (icon ruler-combined)
    html = html.replace(/(<i class="fas fa-ruler-combined"><\/i>\s*<span class="feature-value">)\d+(\.\d+)?(<\/span>)/g,
        `$1${construction}$3`);

    // m² Terreno (icon vector-square)
    html = html.replace(/(<i class="fas fa-vector-square"><\/i>\s*<span class="feature-value">)\d+(\.\d+)?(<\/span>)/g,
        `$1${landArea}$3`);

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

    // MAPA - actualizar ubicación con dirección correcta
    const locationEncoded = encodeURIComponent(`${data.title}, ${data.location}`);
    html = html.replace(
        /src="https:\/\/www\.google\.com\/maps\/embed\/v1\/place\?key=[^&]+&q=[^"]+"/g,
        `src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${locationEncoded}&zoom=15"`
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
        `Hola! Me interesa la propiedad:\n${data.title}\n${priceFormatted}\n${data.location}\nhttps://casasenventa.info/culiacan/${slug}/`
    );
    html = html.replace(/https:\/\/wa\.me\/528111652545\?text=[^"]+/g,
        `https://wa.me/528111652545?text=${whatsappMsg}`);

    // Copiar styles.css
    const stylesSource = 'culiacan/casa-en-venta-en-la-primavera-barrio-san-francisco-sur-01/styles.css';
    const stylesPath = `culiacan/${slug}/styles.css`;
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
    console.log('📝 Agregando tarjeta a culiacan/index.html...\n');

    const indexPath = 'culiacan/index.html';
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
                <img src="${slug}/images/foto-1.jpg" alt="${data.title}" class="carousel-image active">
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
                    ${data.bedrooms || 3} Recámaras
                </div>
                <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                    </svg>
                    ${data.bathrooms || 2} Baños
                </div>
                <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"/>
                    </svg>
                    ${data.construction_area || 150}m²
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

    // Insertar antes del cierre del grid
    const gridEndRegex = /<\/div>\s*<\/div>\s*<\/main>/;
    indexHtml = indexHtml.replace(gridEndRegex, `${card}\n        </div>\n    </div>\n</main>`);

    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log('   ✅ Tarjeta agregada a culiacan/index.html\n');
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

        // 2. Generar slug
        const slug = generateSlug(data.title);
        console.log(`🔗 Slug generado: ${slug}\n`);

        // 3. Crear directorios
        const propertyDir = `culiacan/${slug}`;
        const imagesDir = `${propertyDir}/images`;

        if (!fs.existsSync(propertyDir)) {
            fs.mkdirSync(propertyDir, { recursive: true });
        }

        // 4. Descargar fotos
        const photoCount = await downloadPhotos(data.images, imagesDir);

        if (photoCount === 0) {
            console.error('❌ ERROR: No se descargaron fotos\n');
            process.exit(1);
        }

        // 5. Generar HTML
        const html = generateHTML(data, slug, photoCount);
        const htmlPath = `${propertyDir}/index.html`;
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log(`✅ HTML generado: ${htmlPath}\n`);

        // 6. Agregar a index
        addToIndex(data, slug);

        // 7. Commit y push automático
        console.log('🚀 Publicando a GitHub...\n');
        execSync(`git add ${propertyDir} culiacan/index.html`, { stdio: 'inherit' });
        execSync(`git commit -m "Add: ${data.title} (Inmuebles24)

- Scrapeado de Inmuebles24
- ${photoCount} fotos descargadas
- Master Template aplicado
- Tarjeta agregada a culiacan/index.html

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"`, { stdio: 'inherit' });

        execSync('git push origin main', { stdio: 'inherit' });

        console.log('\n✅ ¡COMPLETADO!\n');
        console.log(`📍 URL local: ${propertyDir}/index.html`);
        console.log(`🌐 URL producción: ${CONFIG.baseUrl}/culiacan/${slug}/\n`);
        console.log('⏱️  La página estará disponible en 1-2 minutos en GitHub Pages\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Ejecutar
if (require.main === module) {
    main();
}

module.exports = { scrapeInmuebles24, downloadPhotos, generateHTML };
