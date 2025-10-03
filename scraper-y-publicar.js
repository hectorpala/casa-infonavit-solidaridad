#!/usr/bin/env node

/**
 * SCRAPER Y PUBLICADOR AUTOMÁTICO
 *
 * Este script:
 * 1. Scrapea propiedad de propiedades.com
 *    - Copia título completo (h1, og:title, document.title)
 *    - Click en imagen más grande
 *    - Click en primera foto
 *    - Navega con flechas (40 clicks) para cargar TODAS las fotos
 *    - Click en "Mostrar más" para descripción completa
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
const PropertyPageGenerator = require('./automation/generador-de-propiedades'); // ✅ Actualizado a generador nuevo

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

    // NUEVA ESTRATEGIA: Click en imagen grande → primera foto → navegar con flechas
    console.log('   🔄 Cargando todas las fotos con clicks optimizados...');

    // PASO 1: Click en la imagen más grande (para abrir galería)
    console.log('   📸 PASO 1: Click en imagen grande...');
    const clickedMainImage = await page.evaluate(() => {
        const selectors = [
            'img[class*="main"]',
            'img[class*="hero"]',
            'img[class*="principal"]',
            'img[class*="large"]',
            'img[src*="1200x"]',
            'img[alt*="principal"]',
            '.carousel-image',
            '[class*="carousel"] img:first-child',
            '[class*="gallery"] img:first-child'
        ];

        for (let selector of selectors) {
            const img = document.querySelector(selector);
            if (img && img.offsetWidth > 400) { // Solo imágenes grandes
                img.click();
                console.log('Click en imagen grande:', selector);
                return true;
            }
        }
        return false;
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // PASO 2: Click en la primera foto del carrusel/galería
    console.log('   📸 PASO 2: Click en primera foto...');
    await page.evaluate(() => {
        const selectors = [
            '[class*="carousel"] img:first-child',
            '[class*="gallery"] img:first-child',
            '[class*="slider"] img:first-child',
            '.carousel-slide:first-child img',
            '[data-slide="0"] img'
        ];

        for (let selector of selectors) {
            const img = document.querySelector(selector);
            if (img) {
                img.click();
                console.log('Click en primera foto:', selector);
                break;
            }
        }
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    // PASO 3: Navegar con flechas para cargar TODAS las fotos
    console.log('   📸 PASO 3: Navegando con flechas (40 clicks)...');
    for (let i = 0; i < 40; i++) {
        try {
            // Buscar el botón "siguiente" con selectores expandidos
            const clicked = await page.evaluate(() => {
                const selectors = [
                    'button[aria-label*="next"]',
                    'button[aria-label*="siguiente"]',
                    'button[class*="next"]',
                    'button[class*="Next"]',
                    '[class*="slick-next"]',
                    '[class*="carousel-next"]',
                    'button:has(svg[data-icon="chevron-right"])',
                    'button:has([class*="arrow-right"])',
                    '[data-action="next"]',
                    '[class*="swiper-button-next"]',
                    // Selector más genérico para flechas
                    'button svg[class*="chevron"]',
                    'button svg[class*="arrow"]'
                ];

                for (let selector of selectors) {
                    try {
                        const btn = document.querySelector(selector);
                        if (btn) {
                            // Si es un SVG, hacer click en el botón padre
                            const button = btn.tagName === 'svg' ? btn.closest('button') : btn;
                            if (button && !button.disabled && !button.classList.contains('disabled')) {
                                button.click();
                                return true;
                            }
                        }
                    } catch (e) {
                        continue;
                    }
                }
                return false;
            });

            if (clicked) {
                await new Promise(resolve => setTimeout(resolve, 600));
            } else {
                // Si no encuentra botón, intentar con las teclas de navegación
                await page.keyboard.press('ArrowRight');
                await new Promise(resolve => setTimeout(resolve, 600));
            }
        } catch (e) {
            // Continuar aunque falle un click
        }
    }

    // Esperar más tiempo para que carguen todas las imágenes
    await new Promise(resolve => setTimeout(resolve, 8000));

    // PASO 4: Click en "Mostrar más" de la descripción para obtener texto completo
    console.log('   📝 PASO 4: Click en "Mostrar más" de la descripción...');
    const clickedShowMore = await page.evaluate(() => {
        const selectors = [
            'button:has-text("Mostrar más")',
            'button:has-text("Ver más")',
            'a:has-text("Mostrar más")',
            'a:has-text("Ver más")',
            '[class*="show-more"]',
            '[class*="read-more"]',
            '[class*="expand"]',
            'button[class*="description"] span',
            // Selectores más específicos
            'button[aria-label*="más"]',
            'button[aria-label*="expand"]'
        ];

        // Intentar con textContent también
        const buttons = document.querySelectorAll('button, a');
        for (let btn of buttons) {
            const text = btn.textContent.toLowerCase().trim();
            if (text.includes('mostrar más') || text.includes('ver más') || text.includes('leer más')) {
                btn.click();
                console.log('Click en botón "Mostrar más":', btn.textContent);
                return true;
            }
        }

        // Si no encuentra por texto, intentar selectores genéricos
        for (let selector of selectors) {
            try {
                const btn = document.querySelector(selector);
                if (btn) {
                    btn.click();
                    console.log('Click en botón "Mostrar más" con selector:', selector);
                    return true;
                }
            } catch (e) {
                continue;
            }
        }

        return false;
    });

    if (clickedShowMore) {
        console.log('   ✅ Click en "Mostrar más" exitoso, esperando contenido...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
        console.log('   ⚠️  No se encontró botón "Mostrar más" (puede que la descripción ya esté completa)');
    }

    // Extraer el ID de la propiedad de la URL para filtrar solo sus fotos
    const propertyIdMatch = url.match(/-(\d{7,9})$/);
    const propertyId = propertyIdMatch ? propertyIdMatch[1] : null;

    // MÉTODO MEJORADO: Extraer URLs del JavaScript/JSON embebido + HTML
    const htmlContent = await page.content();

    console.log('   🔍 Buscando fotos en JSON embebido...');

    // 1. BUSCAR EN NEXT_DATA (JSON embebido en el HTML)
    let nextDataPhotos = [];
    try {
        const nextDataMatch = htmlContent.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
        if (nextDataMatch) {
            const jsonData = JSON.parse(nextDataMatch[1]);

            // Buscar recursivamente todas las URLs de fotos en el JSON
            const findPhotos = (obj) => {
                if (typeof obj === 'string' && obj.includes('cdn.propiedades.com') && /\.(jpg|jpeg|png|webp)/.test(obj)) {
                    nextDataPhotos.push(obj);
                } else if (typeof obj === 'object' && obj !== null) {
                    Object.values(obj).forEach(findPhotos);
                }
            };

            findPhotos(jsonData);
            console.log(`   ✅ Encontradas ${nextDataPhotos.length} fotos en __NEXT_DATA__`);
        }
    } catch (e) {
        console.log(`   ⚠️  No se pudo parsear __NEXT_DATA__`);
    }

    // 2. BUSCAR EN SCRIPTS CON REGEX (fotos que puedan estar en otros scripts)
    const scriptMatches = htmlContent.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
    let scriptPhotos = [];

    scriptMatches.forEach(script => {
        const photoMatches = script.match(/https?:\/\/cdn\.propiedades\.com\/files\/[^\s"'<>)]+\.(?:jpg|jpeg|png|webp)/gi);
        if (photoMatches) {
            scriptPhotos.push(...photoMatches);
        }
    });

    console.log(`   ✅ Encontradas ${scriptPhotos.length} fotos en scripts`);

    // 3. BUSCAR EN HTML con múltiples regex
    const patterns = [
        /https?:\/\/cdn\.propiedades\.com\/files\/[^\s"'<>)]+\.(?:jpg|jpeg|png|webp)/gi,
        /cdn\.propiedades\.com\/files\/[^\s"'<>)]+\.jpg/gi,
        /"(https?:\/\/[^"]*propiedades\.com[^"]*\.jpg[^"]*)"/gi,
        /'(https?:\/\/[^']*propiedades\.com[^']*\.jpg[^']*)'/gi
    ];

    let htmlMatches = [];
    patterns.forEach(pattern => {
        const found = htmlContent.match(pattern) || [];
        htmlMatches.push(...found);
    });

    // Combinar todas las fuentes
    let allMatches = [...nextDataPhotos, ...scriptPhotos, ...htmlMatches];

    // Limpiar URLs que puedan estar incompletas o con prefijos
    const cleanedUrls = allMatches.map(url => {
        url = url.replace(/^["']|["']$/g, ''); // Quitar comillas
        url = url.replace(/\\"/g, ''); // Quitar escapes
        url = url.replace(/\\\//g, '/'); // Quitar escapes de slashes
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        return url;
    });

    // Filtrar por ID de propiedad y eliminar duplicados
    let uniqueImages = [...new Set(cleanedUrls)]
        .filter(url => url.includes('cdn.propiedades.com'))
        .filter(url => url.includes('1200x') || url.includes('800x') || url.includes('files/'))
        .filter(url => !url.includes('logo') && !url.includes('avatar') && !url.includes('thumbnail'))
        .filter(url => !url.includes('placeholder'));

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

        // Extraer título completo de múltiples fuentes
        const getTitleComplete = () => {
            // 1. H1 principal
            const h1 = document.querySelector('h1');
            if (h1 && h1.textContent.length > 10) return h1.textContent.trim();

            // 2. Meta tag og:title (más completo)
            const ogTitle = getMetaContent('og:title');
            if (ogTitle && ogTitle.length > 10) return ogTitle;

            // 3. Title del documento (sin "| Propiedades.com")
            const docTitle = document.title.split('|')[0].split('-')[0].trim();
            if (docTitle && docTitle.length > 10) return docTitle;

            // 4. Buscar en breadcrumbs
            const breadcrumb = document.querySelector('[class*="breadcrumb"] a:last-child');
            if (breadcrumb) return breadcrumb.textContent.trim();

            return 'Casa en Venta';
        };

        const title = getTitleComplete();
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

    // DETECTAR TIPO DE PROPIEDAD desde el título
    const isDepartamento = scraped.title.toLowerCase().includes('departamento');
    const tipoPropiedad = isDepartamento ? 'Departamento' : 'Casa';
    const tipoPropiedadLower = isDepartamento ? 'departamento' : 'casa';

    console.log(`   🏠 Tipo detectado: ${tipoPropiedad} (título: "${scraped.title}")`);

    // Extraer precio numérico
    const priceMatch = scraped.price.match(/[\d,]+/);
    const priceNumber = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;

    // Extraer ubicación y colonia del título
    const locationParts = scraped.location.split(',');
    const coloniaFromLocation = locationParts[0]?.replace('Municipio', '').trim() || 'Culiacán';

    // Extraer colonia/condominio/fraccionamiento del título
    // Ej: "Renta de casa en condominio , Colonia Portabelo" → "Portabelo"
    // Ej: "Renta de casa en Valle Alto" → "Valle Alto"
    const coloniaMatch = scraped.title.match(/colonia\s+([^,]+)/i);
    const fraccionamientoMatch = scraped.title.match(/fraccionamiento\s+([^,]+)/i);
    const genericMatch = scraped.title.match(/en\s+([^,]{5,30})\s*,/i);

    let colonia = coloniaMatch ? coloniaMatch[1].trim() :
                  fraccionamientoMatch ? fraccionamientoMatch[1].trim() :
                  genericMatch ? genericMatch[1].trim() :
                  coloniaFromLocation;

    // Extraer también el tipo de desarrollo (si no viene en el nombre ya)
    const developmentType = scraped.title.match(/(condominio|fraccionamiento|privada|residencial)/i)?.[1].toLowerCase() || '';

    // Solo agregar tipo si la colonia no lo incluye ya
    const fullLocationName = (developmentType && !colonia.toLowerCase().includes(developmentType))
        ? `${developmentType.charAt(0).toUpperCase() + developmentType.slice(1)} ${colonia}`
        : colonia;

    // Crear slug ÚNICO usando colonia + timestamp + TIPO DE PROPIEDAD
    const tipo = esRenta ? 'renta' : 'venta';
    const tipoSlug = isDepartamento ? 'departamento' : 'casa';
    const coloniaSlug = colonia.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[áàäâã]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöôõ]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/[^a-z0-9-]/g, '');

    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos
    const slug = `${tipoSlug}-${tipo}-${coloniaSlug}-${timestamp}`;

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

    // Generar descripción completa y profesional usando TIPO CORRECTO
    const fullDescription = scraped.description ||
        `Hermoso ${tipoPropiedadLower} en ${esRenta ? 'renta' : 'venta'} en ${fullLocationName}, Culiacán. ` +
        `Cuenta con ${bedrooms} recámara${bedrooms > 1 ? 's' : ''}, ${bathrooms} baño${bathrooms > 1 ? 's' : ''} completo${bathrooms > 1 ? 's' : ''}, ` +
        `${area} m² de construcción${landArea !== area ? ` y ${landArea} m² de terreno` : ''}. ` +
        `Excelente ubicación y acabados de calidad.`;

    return {
        title: `${tipoPropiedad} en ${esRenta ? 'Renta' : 'Venta'} ${fullLocationName}`,
        tipoPropiedad: tipoPropiedad,
        isDepartamento: isDepartamento,
        location: `${fullLocationName}, Culiacán, Sinaloa`,
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
        description: fullDescription,
        colonia: colonia,
        fullLocationName: fullLocationName,
        features: [
            `${bedrooms} Recámara${bedrooms > 1 ? 's' : ''}`,
            `${bathrooms} Baño${bathrooms > 1 ? 's' : ''} Completo${bathrooms > 1 ? 's' : ''}`,
            `${area} m² de ${chars.construction ? 'Construcción' : 'Terreno'}`,
            landArea !== area ? `${landArea} m² de Terreno` : null,
            parking ? `${parking} Estacionamiento${parking > 1 ? 's' : ''}` : null,
            "Patio Amplio"
        ].filter(Boolean),
        whatsappMessage: `Hola, me interesa el ${tipoPropiedadLower} en ${tipo} en ${colonia} de ${scraped.price.split(' ')[0]}`,
        photoCount: scraped.images.length,
        imageUrls: scraped.images,
        ownerContact: scraped.ownerContact || {}
    };
}

function descargarFotos(propertyData) {
    console.log(`\n📸 Descargando ${propertyData.photoCount} fotos...`);

    // ESTRUCTURA CORRECTA: culiacan/[slug]/images/ para VENTA, images/[slug]/ para RENTA
    const imageDir = propertyData.esRenta
        ? `images/${propertyData.slug}`
        : `culiacan/${propertyData.slug}/images`;

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
        // Para VENTA: usar MASTER TEMPLATE CON VALIDACIÓN ✅
        const generator = new PropertyPageGenerator(false);
        console.log('🛡️  Generando con validación automática...');
        try {
            htmlContent = generator.generateFromMasterTemplateWithValidation(propertyData);
            console.log('✅ HTML generado y validado (100% correcto)');
        } catch (error) {
            console.error('❌ Error en validación:', error.message);
            throw error;
        }
    }

    // CREAR ESTRUCTURA culiacan/[slug]/ para VENTA
    if (!propertyData.esRenta) {
        const propertyDir = `culiacan/${propertyData.slug}`;
        if (!fs.existsSync(propertyDir)) {
            fs.mkdirSync(propertyDir, { recursive: true });
        }
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

        // Reemplazar mensajes de compartir que digan "venta" por "renta"
        htmlContent = htmlContent.replace(/casa en venta/gi, 'casa en renta');
        htmlContent = htmlContent.replace(/Casa en Venta/g, 'Casa en Renta');
        htmlContent = htmlContent.replace(/En Venta/g, 'En Renta');
        htmlContent = htmlContent.replace(/en venta/g, 'en renta');
        htmlContent = htmlContent.replace(/Infonavit Solidaridad/g, propertyData.location.split(',')[0]);

        console.log('   ✅ Datos del template RENTA reemplazados');
    }

    // Detectar tipo de propiedad (Casa vs Departamento)
    const tipoInmueble = propertyData.isDepartamento ? 'Departamento' : 'Casa';
    const tipoInmuebleLower = propertyData.isDepartamento ? 'departamento' : 'casa';

    // 1. Title tag - CON TIPO CORRECTO
    htmlContent = htmlContent.replace(
        /<title>.*?<\/title>/,
        `<title>${tipoInmueble} en ${tipoPropiedad} ${propertyData.price} - ${propertyData.location.split(',')[0]}, Culiacán | Hector es Bienes Raíces</title>`
    );

    // 2. Meta description - CON TIPO CORRECTO
    htmlContent = htmlContent.replace(
        /<meta name="description" content=".*?">/,
        `<meta name="description" content="${tipoInmueble} en ${tipoLower} en ${propertyData.location.split(',')[0]}, Culiacán. ${propertyData.bedrooms} recámaras, ${propertyData.bathrooms} baño${propertyData.bathrooms > 1 ? 's' : ''}, ${propertyData.area}m² terreno. ¡Contáctanos!">`
    );

    // 3. Keywords - CON TIPO CORRECTO
    htmlContent = htmlContent.replace(
        /<meta name="keywords" content=".*?">/,
        `<meta name="keywords" content="${tipoInmuebleLower} ${tipoLower} Culiacán, ${propertyData.location.split(',')[0]}, ${propertyData.bedrooms} recámaras, patio amplio">`
    );

    // URLs para canonical, OG y Schema
    const canonicalUrl = propertyData.esRenta
        ? `https://casasenventa.info/${propertyData.slug}.html`
        : `https://casasenventa.info/culiacan/${propertyData.slug}/`;
    const imageUrl = propertyData.esRenta
        ? `https://casasenventa.info/images/${propertyData.slug}/foto-1.jpg`
        : `https://casasenventa.info/culiacan/${propertyData.slug}/images/foto-1.jpg`;

    // 4. Canonical
    htmlContent = htmlContent.replace(
        /<link rel="canonical" href=".*?">/,
        `<link rel="canonical" href="${canonicalUrl}">`
    );

    // 5. Open Graph - CON TIPO CORRECTO
    htmlContent = htmlContent.replace(
        /<meta property="og:title" content=".*?">/,
        `<meta property="og:title" content="${tipoInmueble} en ${tipoPropiedad} ${propertyData.price} - ${propertyData.location.split(',')[0]}">`
    );

    htmlContent = htmlContent.replace(
        /<meta property="og:description" content=".*?">/,
        `<meta property="og:description" content="${propertyData.description.substring(0, 150)}...">`
    );

    htmlContent = htmlContent.replace(
        /<meta property="og:url" content=".*?">/,
        `<meta property="og:url" content="${canonicalUrl}">`
    );

    htmlContent = htmlContent.replace(
        /<meta property="og:image" content=".*?">/,
        `<meta property="og:image" content="${imageUrl}">`
    );

    // 6. Schema.org - CORRECCIÓN COMPLETA CON TIPO CORRECTO
    const schemaRegex = /"@context":\s*"https:\/\/schema\.org"[\s\S]*?"offers":\s*{[\s\S]*?}/;
    const schemaType = propertyData.isDepartamento ? "Apartment" : "SingleFamilyResidence";
    const schemaImagePrefix = propertyData.esRenta
        ? `https://casasenventa.info/images/${propertyData.slug}/`
        : `https://casasenventa.info/culiacan/${propertyData.slug}/images/`;

    const newSchema = `"@context": "https://schema.org",
      "@type": "${schemaType}",
      "name": "${propertyData.title}",
      "description": "${propertyData.description}",
      "url": "${canonicalUrl}",
      "image": [
        "${schemaImagePrefix}foto-1.jpg",
        "${schemaImagePrefix}foto-2.jpg",
        "${schemaImagePrefix}foto-3.jpg"
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

    // GUARDAR EN ESTRUCTURA CORRECTA
    const filename = propertyData.esRenta
        ? `${propertyData.slug}.html`  // RENTA: ROOT
        : `culiacan/${propertyData.slug}/index.html`;  // VENTA: culiacan/[slug]/index.html

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

    // Detectar badge color y rutas según tipo
    const badgeColor = propertyData.esRenta ? 'bg-orange-500' : 'bg-green-600';
    const cardHref = propertyData.esRenta
        ? `../${propertyData.slug}.html`
        : `${propertyData.slug}/index.html`;
    const imagePathPrefix = propertyData.esRenta
        ? `../images/${propertyData.slug}/`
        : `${propertyData.slug}/images/`;

    const tarjeta = `
            <!-- BEGIN CARD-ADV ${propertyData.slug} -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
                 data-href="${cardHref}">
                <div class="relative aspect-video">
                    <div class="absolute top-3 right-3 ${badgeColor} text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        ${propertyData.price}
                    </div>
                    <div class="carousel-container" data-current="0">
${propertyData.imageUrls.slice(0, 5).map((url, i) => `                        <img src="${imagePathPrefix}foto-${i + 1}.jpg"
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
                    <a href="${cardHref}"
                       class="block w-full bg-gradient-to-r from-${propertyData.esRenta ? 'orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' : 'green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white text-center font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                        Ver Detalles
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
