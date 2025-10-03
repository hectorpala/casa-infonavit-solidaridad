#!/usr/bin/env node

/**
 * SCRAPER Y PUBLICADOR AUTOMÁTICO
 *
 * Este script:
 * 1. Scrapea propiedad de propiedades.com
 * 2. Descarga fotos con curl
 * 3. Genera HTML con PropertyPageGenerator (template Solidaridad)
 * 4. Corrige TODOS los metadatos (title, description, Schema.org, Open Graph, hero)
 * 5. Genera tarjeta para culiacan/index.html
 * 6. Lista para "publica ya"
 *
 * Uso: node scraper-y-publicar.js <URL_PROPIEDADES_COM>
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const { execSync } = require('child_process');
const PropertyPageGenerator = require('./automation/property-page-generator');

async function scrapearPropiedad(url) {
    console.log('🔍 Scrapeando:', url);

    // Detectar si es RENTA o VENTA desde la URL
    const esRenta = url.includes('-renta-') || url.includes('/renta/');

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-http2'
        ]
    });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

    // Esperar más tiempo para que el JavaScript de la página cargue el carrusel
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Hacer scroll para cargar lazy loading images
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });

    // Esperar 2 segundos para que carguen las imágenes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Intentar hacer click en el botón "siguiente" 30 veces para cargar TODAS las fotos
    for (let i = 0; i < 30; i++) {
        try {
            // Buscar el botón "siguiente" con múltiples selectores
            const clicked = await page.evaluate(() => {
                const selectors = [
                    'button[aria-label*="next"]',
                    'button[aria-label*="siguiente"]',
                    'button[class*="next"]',
                    '[class*="slick-next"]',
                    '[class*="carousel-next"]',
                    'button:has(svg[data-icon="chevron-right"])',
                    'button:has([class*="arrow-right"])'
                ];

                for (let selector of selectors) {
                    const btn = document.querySelector(selector);
                    if (btn && !btn.disabled) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            });

            if (clicked) {
                await new Promise(resolve => setTimeout(resolve, 800));
            } else {
                break; // Si no encuentra más botones, salir
            }
        } catch (e) {
            // Continuar aunque falle un click
        }
    }

    // Esperar más tiempo para que carguen todas las imágenes (especialmente si hay 11+ fotos)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Extraer el ID de la propiedad de la URL para filtrar solo sus fotos
    const propertyIdMatch = url.match(/-(\d{7,9})$/);
    const propertyId = propertyIdMatch ? propertyIdMatch[1] : null;

    // MÉTODO ALTERNATIVO: Extraer URLs de fotos directamente del HTML source
    const htmlContent = await page.content();

    // Múltiples regex para capturar todos los formatos posibles
    const patterns = [
        /https?:\/\/cdn\.propiedades\.com\/files\/[^\s"'<>)]+\.(?:jpg|jpeg|png|webp)/gi,
        /cdn\.propiedades\.com\/files\/[^\s"'<>)]+\.jpg/gi,
        /"(https?:\/\/[^"]*propiedades\.com[^"]*\.jpg[^"]*)"/gi,
        /'(https?:\/\/[^']*propiedades\.com[^']*\.jpg[^']*)'/gi
    ];

    let allMatches = [];
    patterns.forEach(pattern => {
        const found = htmlContent.match(pattern) || [];
        allMatches.push(...found);
    });

    // Limpiar URLs que puedan estar incompletas o con prefijos
    const cleanedUrls = allMatches.map(url => {
        url = url.replace(/^["']|["']$/g, ''); // Quitar comillas
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        return url;
    });

    // Filtrar por ID de propiedad y eliminar duplicados
    let uniqueImages = [...new Set(cleanedUrls)]
        .filter(url => url.includes('cdn.propiedades.com'))
        .filter(url => url.includes('1200x') || url.includes('800x') || url.includes('files/'))
        .filter(url => !url.includes('logo') && !url.includes('avatar') && !url.includes('thumbnail'));

    // CRÍTICO: Filtrar solo fotos que contengan el ID de esta propiedad
    if (propertyId) {
        const propertyImages = uniqueImages.filter(url => url.includes(propertyId));
        if (propertyImages.length > 0) {
            uniqueImages = propertyImages;
            console.log(`   ✅ Filtradas ${uniqueImages.length} fotos de la propiedad ${propertyId}`);
        }
    }

    console.log(`   🔍 Total fotos encontradas: ${uniqueImages.length}`);

    // ESTRATEGIA ALTERNATIVA: Si encontró menos de 10 fotos, generar URLs basándose en el patrón
    if (uniqueImages.length > 0 && uniqueImages.length < 15 && propertyId) {
        console.log(`   ⚠️  Solo ${uniqueImages.length} fotos encontradas, intentando generar más...`);

        // Extraer el patrón de la primera foto (ej: valle-alto-culiacan-sinaloa-28481539-foto-01.jpg)
        const firstPhoto = uniqueImages[0];
        const basePattern = firstPhoto.match(/(.*-)\d{2}\.jpg/);

        if (basePattern) {
            const baseUrl = basePattern[1]; // "https://cdn.propiedades.com/.../valle-alto-culiacan-sinaloa-28481539-foto-"
            const generatedUrls = [];

            // Intentar generar URLs para fotos 01 hasta 15
            for (let i = 1; i <= 15; i++) {
                const photoNum = i.toString().padStart(2, '0');
                const generatedUrl = `${baseUrl}${photoNum}.jpg`;

                // Solo agregar si no existe ya
                if (!uniqueImages.includes(generatedUrl)) {
                    generatedUrls.push(generatedUrl);
                }
            }

            console.log(`   🔧 Generadas ${generatedUrls.length} URLs adicionales para verificar`);

            // Agregar las URLs generadas a la lista
            uniqueImages = [...uniqueImages, ...generatedUrls];
        }
    }

    const data = await page.evaluate(() => {
        const getText = (selector) => {
            const el = document.querySelector(selector);
            return el ? el.textContent.trim() : null;
        };

        const getImages = () => {
            const images = new Set();

            // 1. Buscar en src de imágenes
            document.querySelectorAll('img[src*="cdn.propiedades.com"]').forEach(img => {
                if (img.src) images.add(img.src);
            });

            // 2. Buscar en srcset
            document.querySelectorAll('img[srcset*="cdn.propiedades.com"]').forEach(img => {
                if (img.srcset) {
                    const urls = img.srcset.split(',').map(s => s.trim().split(' ')[0]);
                    urls.forEach(url => images.add(url));
                }
            });

            // 3. Buscar en data-src (lazy loading)
            document.querySelectorAll('[data-src*="cdn.propiedades.com"]').forEach(el => {
                if (el.dataset.src) images.add(el.dataset.src);
            });

            // 4. Buscar en backgrounds CSS
            document.querySelectorAll('[style*="cdn.propiedades.com"]').forEach(el => {
                const match = el.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
                if (match && match[1]) images.add(match[1]);
            });

            // Filtrar solo las imágenes de tamaño completo (1200x507 o similar)
            const fullSizeImages = Array.from(images).filter(url =>
                url.includes('1200x') || url.includes('files/') || !url.includes('thumbnail')
            );

            return fullSizeImages.length > 0 ? fullSizeImages : Array.from(images);
        };

        // Extraer características (recámaras, baños, m²)
        const getCharacteristics = () => {
            const chars = {};
            document.querySelectorAll('.characteristic').forEach(char => {
                const text = char.textContent.toLowerCase();

                // Recámaras
                if (text.includes('recámara') || text.includes('recamara')) {
                    const match = text.match(/(\d+)/);
                    if (match) chars.bedrooms = parseInt(match[1]);
                }

                // Baños
                if (text.includes('baño') || text.includes('bano')) {
                    const match = text.match(/(\d+)/);
                    if (match) chars.bathrooms = parseInt(match[1]);
                }

                // Construcción (m²)
                if (text.includes('construc') || text.includes('construida')) {
                    const match = text.match(/(\d+\.?\d*)\s*m/);
                    if (match) chars.construction = parseFloat(match[1]);
                }

                // Terreno (m²)
                if (text.includes('terreno')) {
                    const match = text.match(/(\d+\.?\d*)\s*m/);
                    if (match) chars.land = parseFloat(match[1]);
                }

                // Estacionamientos
                if (text.includes('estacionamiento') || text.includes('cochera')) {
                    const match = text.match(/(\d+)/);
                    if (match) chars.parking = parseInt(match[1]);
                }
            });
            return chars;
        };

        // Extraer datos de contacto del propietario (NO del agente inmobiliario)
        const getOwnerContact = () => {
            const contact = {};

            // Buscar código de propiedad
            const codeElements = document.querySelectorAll('[class*="code"], [class*="codigo"], [class*="reference"]');
            codeElements.forEach(el => {
                const text = el.textContent;
                if (text.includes('Código') || text.includes('código')) {
                    const match = text.match(/(\d+)/);
                    if (match) contact.propertyCode = match[1];
                }
            });

            // Buscar nombre del contacto (evitar "Hector" para no incluir datos propios)
            const nameElements = document.querySelectorAll('[class*="contact"] h3, [class*="contact"] h4, [class*="agent"] h3, [class*="seller"] h3');
            nameElements.forEach(el => {
                const name = el.textContent.trim();
                if (name && !name.toLowerCase().includes('hector') && name.length > 2 && name.length < 50) {
                    contact.ownerName = name;
                }
            });

            // Buscar teléfono del contacto (evitar 8111652545 que es el tuyo)
            const phoneElements = document.querySelectorAll('[href^="tel:"], [class*="phone"], [class*="telefono"], [class*="celular"]');
            phoneElements.forEach(el => {
                const text = el.textContent || el.getAttribute('href') || '';
                const phoneMatch = text.match(/(\d{10})/);
                if (phoneMatch && phoneMatch[1] !== '8111652545') {
                    contact.ownerPhone = phoneMatch[1];
                }
            });

            return contact;
        };

        // Extraer título y descripción del meta tag si no hay en DOM
        const getMetaContent = (name) => {
            const meta = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
            return meta ? meta.getAttribute('content') : null;
        };

        const title = getText('h1') || getMetaContent('og:title') || document.title;
        const description = getText('[class*="description"]') || getText('p[data-testid="property-description"]') || getMetaContent('og:description') || '';
        const price = getText('[class*="price"]') || getText('[class*="Price"]') || getText('strong') || '$20,000';

        return {
            title,
            price,
            location: getText('h2') || getText('[class*="location"]') || 'Culiacán, Sinaloa',
            description,
            images: getImages(),
            characteristics: getCharacteristics(),
            ownerContact: getOwnerContact()
        };
    });

    await browser.close();

    // COMBINAR: Usar las fotos del HTML source si encontró más que el método DOM
    if (uniqueImages.length > data.images.length) {
        console.log(`   ✅ Usando ${uniqueImages.length} fotos del HTML source (vs ${data.images.length} del DOM)`);
        data.images = uniqueImages;
    }

    console.log('✅ Datos scrapeados:', {
        title: data.title,
        price: data.price,
        fotos: data.images.length,
        tipo: esRenta ? 'RENTA' : 'VENTA',
        contacto: data.ownerContact
    });

    return { ...data, esRenta };
}

function extraerDatosPropiedad(scraped) {
    const esRenta = scraped.esRenta || false;

    // Extraer precio numérico
    const priceMatch = scraped.price.match(/[\d,]+/);
    const priceNumber = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;

    // Extraer ubicación y colonia del título
    const locationParts = scraped.location.split(',');
    const coloniaFromLocation = locationParts[0]?.replace('Municipio', '').trim() || 'Culiacán';

    // Extraer colonia del título (ej: "Renta de casa en Valle Alto" → "valle-alto")
    const titleMatch = scraped.title.match(/colonia\s+([^,]+)|en\s+([^,]{5,30})\s*,/i);
    const colonia = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : coloniaFromLocation;

    // Crear slug ÚNICO usando colonia + timestamp
    const tipo = esRenta ? 'renta' : 'venta';
    const coloniaSlug = colonia.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[áàäâã]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöôõ]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/[^a-z0-9-]/g, '');

    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos
    const slug = `casa-${tipo}-${coloniaSlug}-${timestamp}`;

    // Usar DESCRIPCIÓN como fuente primaria (más confiable que .characteristic del DOM)
    const chars = scraped.characteristics || {};
    const desc = scraped.description.toLowerCase();

    // Mejorar regex para capturar recámaras/baños con o sin acentos
    const bedroomsMatch = desc.match(/(\d+)\s*rec[aá]maras?/);
    const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : (chars.bedrooms || 2);

    const bathroomsMatch = desc.match(/(\d+)\s*ba[ñn]os?/);
    const bathrooms = bathroomsMatch ? parseInt(bathroomsMatch[1]) : (chars.bathrooms || 1);

    // Extraer m² de construcción de la descripción primero
    const construccionMatch = desc.match(/[\*\-\s]*construcci[oó]n:\s*(\d+\.?\d*)\s*m2?/) || desc.match(/(\d+\.?\d*)\s*m2?\s*de\s*construcci[oó]n/);
    const area = construccionMatch ? parseFloat(construccionMatch[1]) : (chars.construction || chars.land || 140);

    const landArea = chars.land || area;
    const parking = chars.parking || 2;

    return {
        title: `Casa en ${esRenta ? 'Renta' : 'Venta'} ${colonia}`,
        location: `${colonia}, Culiacán, Sinaloa`,
        price: scraped.price.includes('$') ? scraped.price.split(' ')[0] : `$${priceNumber.toLocaleString('es-MX')}`,
        priceNumber: priceNumber,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        parking: parking,
        area: area,
        landArea: landArea,
        yearBuilt: "2023",
        slug: slug,
        key: slug,
        propertyType: tipo,
        esRenta: esRenta,
        description: scraped.description,
        features: [
            `${bedrooms} Recámara${bedrooms > 1 ? 's' : ''}`,
            `${bathrooms} Baño${bathrooms > 1 ? 's' : ''} Completo${bathrooms > 1 ? 's' : ''}`,
            `${area} m² de ${chars.construction ? 'Construcción' : 'Terreno'}`,
            landArea !== area ? `${landArea} m² de Terreno` : null,
            parking ? `${parking} Estacionamiento${parking > 1 ? 's' : ''}` : null,
            "Patio Amplio"
        ].filter(Boolean),
        whatsappMessage: `Hola, me interesa la casa en ${tipo} en ${colonia} de ${scraped.price.split(' ')[0]}`,
        photoCount: scraped.images.length,
        imageUrls: scraped.images,
        ownerContact: scraped.ownerContact || {}
    };
}

function descargarFotos(propertyData) {
    console.log(`\n📸 Descargando ${propertyData.photoCount} fotos...`);

    const imageDir = `images/${propertyData.slug}`;
    if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
    }

    const successfulDownloads = [];

    for (let index = 0; index < propertyData.imageUrls.length; index++) {
        const url = propertyData.imageUrls[index];
        const filename = `${imageDir}/foto-${successfulDownloads.length + 1}.jpg`;

        try {
            // Verificar si la URL existe (HTTP HEAD request)
            const checkResult = execSync(`curl -s -I "${url}" | head -1`, { encoding: 'utf-8' });

            if (checkResult.includes('200')) {
                // La URL existe, descargar
                execSync(`curl -s "${url}" -o "${filename}"`, { stdio: 'inherit' });

                // Verificar que el archivo se descargó y no está vacío
                if (fs.existsSync(filename) && fs.statSync(filename).size > 1000) {
                    console.log(`   ✅ foto-${successfulDownloads.length + 1}.jpg`);
                    successfulDownloads.push(url);
                } else {
                    fs.unlinkSync(filename); // Eliminar archivo vacío
                }
            }
        } catch (err) {
            // URL no existe o error de descarga, continuar con la siguiente
        }
    }

    console.log(`✅ ${successfulDownloads.length} fotos descargadas en ${imageDir}`);

    // Actualizar photoCount con el número real de fotos descargadas
    propertyData.photoCount = successfulDownloads.length;
}

function generarHTML(propertyData) {
    console.log('\n📄 Generando HTML con PropertyPageGenerator...');

    let htmlContent;

    if (propertyData.esRenta) {
        // Para RENTA: usar casa-renta-privanzas-natura.html como base
        console.log('🏠 Usando template RENTA (Privanzas Natura)...');
        htmlContent = fs.readFileSync('casa-renta-privanzas-natura.html', 'utf-8');
    } else {
        // Para VENTA: usar template Solidaridad
        const generator = new PropertyPageGenerator(false);
        htmlContent = generator.generateFromSolidaridadTemplate(propertyData);
    }

    // CORRECCIONES AUTOMÁTICAS DE METADATOS
    console.log('🔧 Corrigiendo metadatos automáticamente...');

    const tipoPropiedad = propertyData.esRenta ? 'Renta' : 'Venta';
    const tipoLower = propertyData.esRenta ? 'renta' : 'venta';

    // Si es RENTA, reemplazar datos del template Privanzas Natura
    if (propertyData.esRenta) {
        // Precio - Reemplazar $27,000 por el precio real
        htmlContent = htmlContent.replace(/\$27,000/g, propertyData.price);
        htmlContent = htmlContent.replace(/27000/g, propertyData.priceNumber);

        // Título
        htmlContent = htmlContent.replace(/Casa en Renta Privanzas Natura/g, propertyData.title);

        // Ubicación
        htmlContent = htmlContent.replace(/Privanzas Natura, Culiacán/g, propertyData.location);
        htmlContent = htmlContent.replace(/Privanzas Natura/g, propertyData.location.split(',')[0]);

        // Características (template tiene 2 recámaras, no 3)
        htmlContent = htmlContent.replace(/2 recámaras/g, `${propertyData.bedrooms} recámara${propertyData.bedrooms > 1 ? 's' : ''}`);
        htmlContent = htmlContent.replace(/2 Recámaras/g, `${propertyData.bedrooms} Recámara${propertyData.bedrooms > 1 ? 's' : ''}`);

        htmlContent = htmlContent.replace(/2 baños/g, `${propertyData.bathrooms} baño${propertyData.bathrooms > 1 ? 's' : ''}`);
        htmlContent = htmlContent.replace(/2 Baños/g, `${propertyData.bathrooms} Baño${propertyData.bathrooms > 1 ? 's' : ''}`);

        // Reemplazar m² construcción (91.6 en template)
        htmlContent = htmlContent.replace(/91\.6 m²/g, `${propertyData.area} m²`);
        htmlContent = htmlContent.replace(/91\.60 mt²/g, `${propertyData.area} mt²`);

        // Badges naranjas (info-badges) - construcción y terreno
        htmlContent = htmlContent.replace(/91\.6 m² construcción/g, `${propertyData.area} m² construcción`);
        htmlContent = htmlContent.replace(/112\.5 m² terreno/g, `${propertyData.landArea} m² terreno`);

        // Feature-value badges (iconos naranjas superiores)
        htmlContent = htmlContent.replace(
            /(<i class="fas fa-bed"><\/i>\s*<span class="feature-value">)2(<\/span>)/,
            `$1${propertyData.bedrooms}$2`
        );
        htmlContent = htmlContent.replace(
            /(<i class="fas fa-bath"><\/i>\s*<span class="feature-value">)2(<\/span>)/,
            `$1${propertyData.bathrooms}$2`
        );
        htmlContent = htmlContent.replace(
            /(<i class="fas fa-ruler-combined"><\/i>\s*<span class="feature-value">)112\.5(<\/span>)/,
            `$1${propertyData.area}$2`
        );

        // Rutas de imágenes - reemplazar casa-renta-privanzas-natura por el slug
        htmlContent = htmlContent.replace(/images\/casa-renta-privanzas-natura\//g, `images/${propertyData.slug}/`);
        htmlContent = htmlContent.replace(/images\/privanzas-natura\//g, `images/${propertyData.slug}/`);

        // Reemplazar cover.jpg por foto-1.jpg (el scraper descarga como foto-1.jpg)
        htmlContent = htmlContent.replace(/\/cover\.jpg/g, '/foto-1.jpg');

        // Ajustar totalSlidesHero según número de fotos reales
        const photoCount = propertyData.photoCount || 5;
        htmlContent = htmlContent.replace(/const totalSlidesHero = \d+;/, `const totalSlidesHero = ${photoCount};`);

        // Ajustar slides del carrusel según número real de fotos
        if (photoCount < 9) {
            // ELIMINAR slides extras si hay menos de 9 fotos
            for (let i = photoCount + 1; i <= 9; i++) {
                const slideRegex = new RegExp(`<div class="carousel-slide"[^>]*data-slide="${i-1}"[^>]*>.*?</div>\\s*`, 's');
                htmlContent = htmlContent.replace(slideRegex, '');

                const dotRegex = new RegExp(`<button class="carousel-dot"[^>]*onclick="goToSlideHero\\(${i-1}\\)"[^>]*></button>\\s*`, 's');
                htmlContent = htmlContent.replace(dotRegex, '');
            }
        } else if (photoCount > 9) {
            // AGREGAR slides extras si hay más de 9 fotos
            const lastSlideMatch = htmlContent.match(/<div class="carousel-slide"[^>]*data-slide="8"[^>]*>.*?<\/div>/s);
            const lastDotMatch = htmlContent.match(/<button class="carousel-dot"[^>]*onclick="goToSlideHero\(8\)"[^>]*><\/button>/);

            if (lastSlideMatch && lastDotMatch) {
                let newSlidesHTML = '';
                let newDotsHTML = '';

                for (let i = 10; i <= photoCount; i++) {
                    newSlidesHTML += `
                    <div class="carousel-slide" data-slide="${i-1}">
                        <img src="images/${propertyData.slug}/foto-${i}.jpg" alt="Foto ${i}" class="carousel-image gallery-image main-image" loading="lazy" decoding="async" width="800" height="600" onclick="openLightbox(${i-1})">
                    </div>`;

                    newDotsHTML += `
                    <button class="carousel-dot" onclick="goToSlideHero(${i-1})" aria-label="Ir a foto ${i}"></button>`;
                }

                // Insertar nuevos slides después del último slide existente
                htmlContent = htmlContent.replace(lastSlideMatch[0], lastSlideMatch[0] + newSlidesHTML);

                // Insertar nuevos dots después del último dot existente
                htmlContent = htmlContent.replace(lastDotMatch[0], lastDotMatch[0] + newDotsHTML);
            }
        }

        // Limpiar lightboxImages array para que solo contenga las fotos reales
        const lightboxArrayMatch = htmlContent.match(/const lightboxImages = \[([\s\S]*?)\];/);
        if (lightboxArrayMatch) {
            const newLightboxItems = [];
            for (let i = 1; i <= photoCount; i++) {
                newLightboxItems.push(`
            { src: 'images/${propertyData.slug}/foto-${i}.jpg', alt: 'Foto ${i}' }`);
            }
            const newLightboxArray = `const lightboxImages = [${newLightboxItems.join(',')}\n        ];`;
            htmlContent = htmlContent.replace(/const lightboxImages = \[[\s\S]*?\];/, newLightboxArray);
        }

        // WhatsApp message
        htmlContent = htmlContent.replace(
            /Hola, me interesa la casa en renta en Privanzas Natura de \$27,000/g,
            propertyData.whatsappMessage
        );

        console.log('   ✅ Datos del template RENTA reemplazados');
    }

    // 1. Title tag
    htmlContent = htmlContent.replace(
        /<title>.*?<\/title>/,
        `<title>Casa en ${tipoPropiedad} ${propertyData.price} - ${propertyData.location.split(',')[0]}, Culiacán | Hector es Bienes Raíces</title>`
    );

    // 2. Meta description
    htmlContent = htmlContent.replace(
        /<meta name="description" content=".*?">/,
        `<meta name="description" content="Casa en ${tipoLower} en ${propertyData.location.split(',')[0]}, Culiacán. ${propertyData.bedrooms} recámaras, ${propertyData.bathrooms} baño${propertyData.bathrooms > 1 ? 's' : ''}, ${propertyData.area}m² terreno. ¡Contáctanos!">`
    );

    // 3. Keywords
    htmlContent = htmlContent.replace(
        /<meta name="keywords" content=".*?">/,
        `<meta name="keywords" content="casa venta Culiacán, ${propertyData.location.split(',')[0]}, ${propertyData.bedrooms} recámaras, patio amplio">`
    );

    // 4. Canonical
    htmlContent = htmlContent.replace(
        /<link rel="canonical" href=".*?">/,
        `<link rel="canonical" href="https://casasenventa.info/${propertyData.slug}.html">`
    );

    // 5. Open Graph
    htmlContent = htmlContent.replace(
        /<meta property="og:title" content=".*?">/,
        `<meta property="og:title" content="Casa en Venta ${propertyData.price} - ${propertyData.location.split(',')[0]}">`
    );

    htmlContent = htmlContent.replace(
        /<meta property="og:description" content=".*?">/,
        `<meta property="og:description" content="${propertyData.description.substring(0, 150)}...">`
    );

    htmlContent = htmlContent.replace(
        /<meta property="og:url" content=".*?">/,
        `<meta property="og:url" content="https://casasenventa.info/${propertyData.slug}.html">`
    );

    htmlContent = htmlContent.replace(
        /<meta property="og:image" content=".*?">/,
        `<meta property="og:image" content="https://casasenventa.info/images/${propertyData.slug}/foto-1.jpg">`
    );

    // 6. Schema.org - CORRECCIÓN COMPLETA
    const schemaRegex = /"@context":\s*"https:\/\/schema\.org"[\s\S]*?"offers":\s*{[\s\S]*?}/;
    const newSchema = `"@context": "https://schema.org",
      "@type": "SingleFamilyResidence",
      "name": "${propertyData.title}",
      "description": "${propertyData.description}",
      "url": "https://casasenventa.info/${propertyData.slug}.html",
      "image": [
        "https://casasenventa.info/images/${propertyData.slug}/foto-1.jpg",
        "https://casasenventa.info/images/${propertyData.slug}/foto-2.jpg",
        "https://casasenventa.info/images/${propertyData.slug}/foto-3.jpg"
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "${propertyData.location.split(',')[0]}",
        "addressLocality": "Culiacán",
        "addressRegion": "Sinaloa",
        "postalCode": "80000",
        "addressCountry": "MX"
      },
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": ${propertyData.area},
        "unitCode": "MTK"
      },
      "lotSize": {
        "@type": "QuantitativeValue",
        "value": ${propertyData.landArea},
        "unitCode": "MTK"
      },
      "numberOfBedrooms": ${propertyData.bedrooms},
      "numberOfBathroomsTotal": ${propertyData.bathrooms},
      "numberOfFullBathrooms": ${propertyData.bathrooms},
      "offers": {
        "@type": "Offer",
        "price": "${propertyData.priceNumber}",
        "priceCurrency": "MXN"`;

    htmlContent = htmlContent.replace(schemaRegex, newSchema);

    // 7. Hero section - TÍTULO Y DESCRIPCIÓN
    htmlContent = htmlContent.replace(
        /<h1 class="hero-title">.*?<\/h1>/,
        `<h1 class="hero-title">${propertyData.title}</h1>`
    );

    htmlContent = htmlContent.replace(
        /<p class="hero-subtitle">.*?<\/p>/,
        `<p class="hero-subtitle">${propertyData.description}</p>`
    );

    // 8. CALCULADORA - Ya está en el template de RENTA, solo skip
    if (propertyData.esRenta) {
        console.log('   ✅ Calculadora de RENTA ya incluida en template');
    }

    const filename = `${propertyData.slug}.html`;
    fs.writeFileSync(filename, htmlContent);

    console.log(`✅ HTML generado: ${filename}`);
    console.log('   ✅ Title corregido');
    console.log('   ✅ Meta description corregida');
    console.log('   ✅ Open Graph corregido');
    console.log('   ✅ Schema.org corregido');
    console.log('   ✅ Hero section corregido');
    if (propertyData.esRenta) {
        console.log('   ✅ Calculadora RENTA aplicada');
    }

    return filename;
}

function generarTarjeta(propertyData) {
    console.log('\n🎴 Generando tarjeta para culiacan/index.html...');

    const tarjeta = `
            <!-- BEGIN CARD-ADV ${propertyData.slug} -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
                 data-href="../${propertyData.slug}.html">
                <div class="relative aspect-video">
                    <div class="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        ${propertyData.price}
                    </div>
                    <div class="carousel-container" data-current="0">
${propertyData.imageUrls.slice(0, 5).map((url, i) => `                        <img src="../images/${propertyData.slug}/foto-${i + 1}.jpg"
                             alt="${propertyData.title} - Foto ${i + 1}"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image ${i === 0 ? 'active' : 'hidden'}">`).join('\n')}
                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)" aria-label="Imagen anterior">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)" aria-label="Siguiente imagen">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">${propertyData.price}</h3>
                    <p class="text-gray-600 mb-4 font-poppins">${propertyData.title} · Culiacán</p>
                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            </svg>
                            ${propertyData.bedrooms} Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M5 21h14a2 2 0 002-2v-9H3v9a2 2 0 002 2zm2-7h2m4 0h2m-6 4h2m4 0h2M7 3v4m10-4v4M5 7h14a2 2 0 012 2v0H3v0a2 2 0 012-2z"></path>
                            </svg>
                            ${propertyData.bathrooms} Baño${propertyData.bathrooms > 1 ? 's' : ''}
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                            ${propertyData.area} m²
                        </div>
                    </div>
                    <a href="https://wa.me/528111652545?text=${encodeURIComponent(propertyData.whatsappMessage)}"
                       class="w-full btn-primary text-center block"
                       target="_blank" rel="noopener noreferrer">
                        Contactar por WhatsApp
                    </a>
                </div>
            </div>
            <!-- END CARD-ADV ${propertyData.slug} -->
`;

    fs.writeFileSync(`tarjeta-${propertyData.slug}.html`, tarjeta);
    console.log(`✅ Tarjeta generada: tarjeta-${propertyData.slug}.html`);
}

// MAIN
(async () => {
    const url = process.argv[2];

    if (!url) {
        console.error('❌ Falta URL. Uso: node scraper-y-publicar.js <URL>');
        process.exit(1);
    }

    try {
        console.log('\n🚀 SCRAPER Y PUBLICADOR AUTOMÁTICO\n');

        // 1. Scrapear
        const scraped = await scrapearPropiedad(url);

        // 2. Procesar datos
        const propertyData = extraerDatosPropiedad(scraped);
        console.log('\n📋 Datos procesados:', JSON.stringify(propertyData, null, 2));

        // 3. Descargar fotos
        descargarFotos(propertyData);

        // 4. Generar HTML corregido
        const htmlFile = generarHTML(propertyData);

        // 5. Generar tarjeta
        generarTarjeta(propertyData);

        // 6. Guardar datos de contacto en JSON
        const contactFile = `contacto-${propertyData.slug}.json`;
        const contactData = {
            slug: propertyData.slug,
            property: propertyData.title,
            price: propertyData.price,
            ownerContact: propertyData.ownerContact,
            scrapedDate: new Date().toISOString()
        };
        fs.writeFileSync(contactFile, JSON.stringify(contactData, null, 2));
        console.log(`\n📞 Datos de contacto guardados: ${contactFile}`);
        if (propertyData.ownerContact.ownerName || propertyData.ownerContact.ownerPhone) {
            console.log(`   👤 Nombre: ${propertyData.ownerContact.ownerName || 'No encontrado'}`);
            console.log(`   📱 Teléfono: ${propertyData.ownerContact.ownerPhone || 'No encontrado'}`);
            console.log(`   🔢 Código: ${propertyData.ownerContact.propertyCode || 'No encontrado'}`);
        } else {
            console.log(`   ⚠️  No se encontraron datos de contacto del propietario`);
        }

        console.log('\n✅ PROCESO COMPLETADO');
        console.log('\n📦 Archivos generados:');
        console.log(`   - ${htmlFile}`);
        console.log(`   - tarjeta-${propertyData.slug}.html`);
        console.log(`   - ${contactFile}`);
        console.log(`   - images/${propertyData.slug}/ (${propertyData.photoCount} fotos)`);
        console.log('\n🎯 Próximo paso:');
        console.log(`   1. Revisar: open ${htmlFile}`);
        console.log(`   2. Publicar: dile "publica ya"`);

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
