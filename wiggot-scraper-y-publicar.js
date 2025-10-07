#!/usr/bin/env node

/**
 * SCRAPER Y PUBLICADOR AUTOMÁTICO DE PROPIEDADES
 *
 * USO: node scraper-y-publicar.js "URL_DE_WIGGOT"
 *
 * PROCESO COMPLETO:
 * 1. Scrapea datos de Wiggot (título, precio, fotos, descripción)
 * 2. Descarga todas las fotos
 * 3. Genera página HTML desde template La Rioja
 * 4. Agrega tarjeta a culiacan/index.html
 * 5. Listo para "publica ya"
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

// Credenciales Wiggot
const WIGGOT_EMAIL = 'hector.test.1759769906975@gmail.com';
const WIGGOT_PASSWORD = 'Wiggot2025!drm36';

async function main() {
    const url = process.argv[2];

    if (!url || !url.includes('wiggot.com')) {
        console.error('❌ ERROR: Debes proporcionar una URL de Wiggot');
        console.log('💡 USO: node scraper-y-publicar.js "https://new.wiggot.com/search/property-detail/XXXXX"');
        process.exit(1);
    }

    console.log('🚀 INICIANDO SCRAPER Y PUBLICADOR AUTOMÁTICO');
    console.log('📍 URL:', url);
    console.log('');

    // PASO 1: Scrapear datos de Wiggot
    console.log('📥 PASO 1/6: Scrapeando datos de Wiggot...');
    const datos = await scrapearWiggot(url);
    console.log('✅ Datos scrapeados:', datos.title);
    console.log('   💰 Precio:', datos.price);
    console.log('   📸 Fotos encontradas:', datos.images.length);
    console.log('');

    // PASO 2: Verificar duplicados
    console.log('🔍 PASO 2/6: Verificando duplicados...');
    const slug = generarSlug(datos.title);
    const carpetaPropiedad = `culiacan/${slug}`;

    const duplicado = await verificarDuplicado(datos, slug);
    if (duplicado) {
        console.log('⚠️  ADVERTENCIA: Propiedad ya existe!');
        console.log('   📁 Carpeta:', duplicado.carpeta);
        console.log('   💰 Precio existente:', duplicado.precio);
        console.log('   📍 URL:', `https://casasenventa.info/${duplicado.carpeta}/`);
        console.log('');

        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const respuesta = await new Promise(resolve => {
            readline.question('¿Deseas continuar y SOBRESCRIBIR? (s/N): ', resolve);
        });
        readline.close();

        if (respuesta.toLowerCase() !== 's') {
            console.log('❌ Proceso cancelado. No se crearon duplicados.');
            process.exit(0);
        }

        console.log('⚡ Continuando... se sobrescribirá la propiedad existente');
        console.log('');
    } else {
        console.log('✅ No se encontraron duplicados');
        console.log('');
    }

    // PASO 3: Crear carpeta
    console.log('📁 PASO 3/6: Creando estructura de carpetas...');
    const carpetaImagenes = `${carpetaPropiedad}/images`;

    if (!fs.existsSync(carpetaPropiedad)) {
        fs.mkdirSync(carpetaPropiedad, { recursive: true });
    }
    if (!fs.existsSync(carpetaImagenes)) {
        fs.mkdirSync(carpetaImagenes, { recursive: true });
    }
    if (!fs.existsSync(`${carpetaImagenes}/webp`)) {
        fs.mkdirSync(`${carpetaImagenes}/webp`, { recursive: true });
    }
    if (!fs.existsSync(`${carpetaImagenes}/optimized`)) {
        fs.mkdirSync(`${carpetaImagenes}/optimized`, { recursive: true });
    }
    console.log('✅ Carpeta creada:', carpetaPropiedad);
    console.log('');

    // PASO 4: Descargar fotos
    console.log('📸 PASO 4/6: Descargando fotos...');
    await descargarFotos(datos.images, carpetaImagenes);
    console.log('✅ Fotos descargadas:', datos.images.length);
    console.log('');

    // PASO 5: Generar página HTML
    console.log('📄 PASO 5/6: Generando página HTML...');
    const config = {
        slug: slug,
        title: datos.title,
        price: datos.price,
        location: datos.location,
        bedrooms: parseInt(datos.bedrooms) || 2,
        bathrooms: parseFloat(datos.bathrooms) || 1.5,
        construction_area: parseInt(datos.construction_area) || 100,
        land_area: parseInt(datos.land_area) || 100,
        description: datos.description,
        photoCount: datos.images.length
    };
    await generarPaginaHTML(config, carpetaPropiedad);
    console.log('✅ Página HTML generada:', `${carpetaPropiedad}/index.html`);
    console.log('');

    // PASO 6: Agregar tarjeta a culiacan/index.html
    console.log('🎴 PASO 6/6: Agregando tarjeta a culiacan/index.html...');
    await agregarTarjeta(config);
    console.log('✅ Tarjeta agregada a culiacan/index.html');
    console.log('');

    console.log('🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!');
    console.log('');
    console.log('📋 RESUMEN:');
    console.log('   🏠 Propiedad:', datos.title);
    console.log('   💰 Precio:', datos.price);
    console.log('   📍 Ubicación:', datos.location);
    console.log('   📁 Carpeta:', carpetaPropiedad);
    console.log('   📸 Fotos:', datos.images.length);
    console.log('');
    console.log('🚀 SIGUIENTE PASO: Ejecuta "publica ya" para deployment');
}

async function scrapearWiggot(url) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    // Cargar cookies si existen
    const cookiesPath = 'wiggot-cookies.json';
    if (fs.existsSync(cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath));
        await page.setCookie(...cookies);
    }

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Auto-login si aparece modal
    await new Promise(resolve => setTimeout(resolve, 3000));

    const loginVisible = await page.evaluate(() => {
        const loginText = document.body.innerText.toLowerCase();
        return loginText.includes('iniciar sesión') || loginText.includes('login');
    });

    if (loginVisible) {
        console.log('   🔐 Login detectado, iniciando sesión...');
        await page.type('input[type="email"]', WIGGOT_EMAIL);
        await page.type('input[type="password"]', WIGGOT_PASSWORD);

        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            for (const btn of buttons) {
                const text = (btn.textContent || '').toLowerCase();
                if (text.includes('login') || text.includes('entrar') || text.includes('iniciar')) {
                    btn.click();
                    return true;
                }
            }
        });

        await new Promise(resolve => setTimeout(resolve, 5000));

        const cookies = await page.cookies();
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies));
    }

    // Abrir galería
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
        for (const btn of buttons) {
            const text = (btn.textContent || '').toLowerCase();
            if (text.includes('ver todas') || text.includes('ver fotos')) {
                btn.click();
                return true;
            }
        }
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extraer datos
    const datos = await page.evaluate(() => {
        const data = {
            title: '',
            price: '',
            location: '',
            bedrooms: '',
            bathrooms: '',
            construction_area: '',
            land_area: '',
            description: '',
            images: []
        };

        // Título
        const titleEl = document.querySelector('h1, h2, .title, [class*="title"]');
        if (titleEl) data.title = titleEl.textContent.trim();

        // Precio
        const priceEl = document.querySelector('[class*="price"], [class*="Price"]');
        if (priceEl) data.price = priceEl.textContent.match(/[\d,]+/)?.[0] || '';

        // Ubicación
        const locationEl = document.querySelector('[class*="location"], [class*="address"]');
        if (locationEl) data.location = locationEl.textContent.trim();

        // Características
        const allText = document.body.innerText;
        const bedroomsMatch = allText.match(/Recámaras?\s*(\d+)/i);
        const bathroomsMatch = allText.match(/Baños?\s*(\d+\.?\d*)/i);

        // Buscar m² construcción y terreno
        const constructionMatch = allText.match(/(?:Área construida|Construcción|Const\.?)\s*:?\s*(\d+)\s*m²/i);
        const landMatch = allText.match(/(?:Área de terreno|Terreno|Lote)\s*:?\s*(\d+)\s*m²/i);

        // Si no encuentra separados, busca cualquier m²
        const anyAreaMatches = allText.match(/(\d+)\s*m²/gi);

        if (bedroomsMatch) data.bedrooms = bedroomsMatch[1];
        if (bathroomsMatch) data.bathrooms = bathroomsMatch[1];
        if (constructionMatch) data.construction_area = constructionMatch[1];
        if (landMatch) data.land_area = landMatch[1];

        // Si no encontró valores separados pero hay m², tomar los primeros dos
        if (!data.construction_area && anyAreaMatches && anyAreaMatches.length > 0) {
            data.construction_area = anyAreaMatches[0].match(/(\d+)/)[1];
        }
        if (!data.land_area && anyAreaMatches && anyAreaMatches.length > 1) {
            data.land_area = anyAreaMatches[1].match(/(\d+)/)[1];
        }
        // Si solo hay uno, usar el mismo para ambos
        if (!data.land_area && data.construction_area) {
            data.land_area = data.construction_area;
        }

        // Descripción - Captura TODO hasta "Ver más" o siguiente sección
        const descMatch = allText.match(/Descripción\s*([\s\S]+?)(?:Ver más|Detalles de operación|Características del inmueble|$)/i);
        if (descMatch) {
            data.description = descMatch[1]
                .trim()
                .replace(/\n+/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/Ver más/g, '')
                .trim();
        }

        // Imágenes
        const imageUrls = new Set();

        document.querySelectorAll('img').forEach(img => {
            const src = img.src || img.getAttribute('data-src');
            if (src && src.includes('wiggot')) imageUrls.add(src);
        });

        document.querySelectorAll('div, section').forEach(el => {
            const bg = window.getComputedStyle(el).backgroundImage;
            if (bg && bg !== 'none') {
                const match = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match && match[1] && match[1].includes('wiggot')) {
                    imageUrls.add(match[1]);
                }
            }
        });

        data.images = Array.from(imageUrls);
        return data;
    });

    await browser.close();
    return datos;
}

async function descargarFotos(imageUrls, carpeta) {
    for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const filename = `foto-${i + 1}.jpg`;
        const filepath = path.join(carpeta, filename);

        await descargarImagen(url, filepath);
        console.log(`   ✅ Descargada: ${filename}`);
    }
}

function descargarImagen(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        protocol.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => reject(err));
        });
    });
}

async function generarPaginaHTML(config, carpeta) {
    // Leer template de Bugambilias (template que funciona correctamente)
    let html = fs.readFileSync('culiacan/casa-venta-casa-en-venta-bugambilias-zona-aeropuert-pYowL0a/index.html', 'utf8');

    // Reemplazar datos básicos (desde template Bugambilias)
    html = html.replace(/casa-venta-casa-en-venta-bugambilias-zona-aeropuert-pYowL0a/g, config.slug);
    html = html.replace(/Bugambilias/g, config.location.split(',')[0]);
    html = html.replace(/\$1,800,000/g, `$${config.price}`);
    html = html.replace(/"1800000"/g, `"${config.price.replace(/,/g, '')}"`);
    html = html.replace(/1,800,000/g, config.price);

    // Actualizar título y descripción
    html = html.replace(
        /<h1 class="hero-title">.*?<\/h1>/,
        `<h1 class="hero-title">${config.title}</h1>`
    );
    html = html.replace(
        /<p class="hero-subtitle">.*?<\/p>/s,
        `<p class="hero-subtitle">${config.description}</p>`
    );

    // Reemplazar m² del template Bugambilias (98 construcción, 118 terreno)
    // con los valores correctos de la propiedad
    html = html.replace(/"value": 98,/g, `"value": ${config.construction_area},`);
    html = html.replace(/"value": 118,/g, `"value": ${config.land_area},`);
    html = html.replace(/98m² terreno/g, `${config.land_area}m² terreno`);
    html = html.replace(/125\.81 m² construcción/g, `${config.construction_area} m² construcción`);
    html = html.replace(/133 m² terreno/g, `${config.land_area} m² terreno`);
    html = html.replace(/<span class="feature-value">N\/D<\/span>/g, `<span class="feature-value">${config.construction_area}</span>`);
    html = html.replace(/<span class="feature-value">133<\/span>/g, `<span class="feature-value">${config.land_area}</span>`);

    // Agregar slides para todas las fotos
    if (config.photoCount > 5) {
        let slidesExtra = '';
        for (let i = 5; i < config.photoCount; i++) {
            slidesExtra += `
                <div class="carousel-slide" data-slide="${i}">
                    <img src="images/foto-${i + 1}.jpg"
                         alt="${config.slug} - Vista ${i + 1}"
                         loading="lazy"
                         decoding="async"
                         onclick="openLightbox(${i})">
                </div>`;
        }

        html = html.replace(
            /(<div class="carousel-slide" data-slide="4">[\s\S]*?<\/div>)\s*<!-- Navigation arrows -->/,
            `$1${slidesExtra}\n                    <!-- Navigation arrows -->`
        );

        // Agregar dots extras
        let dotsExtra = '';
        for (let i = 5; i < config.photoCount; i++) {
            dotsExtra += `\n                <button class="carousel-dot" onclick="goToSlideHero(${i})" aria-label="Foto ${i + 1}"></button>`;
        }

        html = html.replace(
            /(<button class="carousel-dot" onclick="goToSlideHero\(4\)" aria-label="Foto 5"><\/button>)/,
            `$1${dotsExtra}`
        );

        // Actualizar JavaScript
        html = html.replace(/const totalSlidesHero = 5;/, `const totalSlidesHero = ${config.photoCount};`);

        // Actualizar lightbox array
        let lightboxArray = 'const lightboxImages = [\n';
        for (let i = 0; i < config.photoCount; i++) {
            lightboxArray += `        'images/foto-${i + 1}.jpg'`;
            if (i < config.photoCount - 1) lightboxArray += ',';
            lightboxArray += '\n';
        }
        lightboxArray += '    ];';

        html = html.replace(/const lightboxImages = \[[\s\S]*?\];/, lightboxArray);

        // Actualizar Schema.org
        let schemaImages = '"image": [\n';
        for (let i = 0; i < config.photoCount; i++) {
            schemaImages += `        "https://casasenventa.info/culiacan/${config.slug}/images/foto-${i + 1}.jpg"`;
            if (i < config.photoCount - 1) schemaImages += ',';
            schemaImages += '\n';
        }
        schemaImages += '      ],';

        html = html.replace(/"image": \[[\s\S]*?\],/, schemaImages);
    }

    // Copiar logos
    const logoSrc = 'culiacan/infonavit-solidaridad/images';
    fs.copyFileSync(
        `${logoSrc}/optimized/Logo-hector-es-bienes-raices.jpg`,
        `${carpeta}/images/optimized/Logo-hector-es-bienes-raices.jpg`
    );
    fs.copyFileSync(
        `${logoSrc}/webp/Logo-hector-es-bienes-raices.webp`,
        `${carpeta}/images/webp/Logo-hector-es-bienes-raices.webp`
    );

    // Copiar styles.css
    fs.copyFileSync(
        'culiacan/casa-venta-la-rioja-477140/styles.css',
        `${carpeta}/styles.css`
    );

    // Guardar HTML
    fs.writeFileSync(`${carpeta}/index.html`, html);
}

async function agregarTarjeta(config) {
    let html = fs.readFileSync('culiacan/index.html', 'utf8');

    const tarjeta = `
    <!-- BEGIN CARD-ADV ${config.slug} -->
    <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
         data-href="${config.slug}/index.html">
        <div class="relative aspect-video">
            <div class="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                $${config.price}
            </div>

            <div class="carousel-container" data-current="0">
                <img src="${config.slug}/images/foto-1.jpg" alt="${config.title}" class="carousel-image active" loading="lazy">
                <img src="${config.slug}/images/foto-2.jpg" alt="${config.title}" class="carousel-image" loading="lazy">
                <img src="${config.slug}/images/foto-3.jpg" alt="${config.title}" class="carousel-image" loading="lazy">

                <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1); event.stopPropagation();">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1); event.stopPropagation();">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <button class="favorite-btn absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors z-20" onclick="event.stopPropagation();">
                <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
            </button>
        </div>

        <div class="p-6">
            <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">$${config.price}</h3>
            <p class="text-gray-600 mb-4 font-poppins">${config.title} · Culiacán</p>

            <div class="flex flex-wrap gap-3 mb-6">
                <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
                    ${config.bedrooms} Recámaras
                </div>
                <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" clip-rule="evenodd"></path></svg>
                    ${config.bathrooms} Baños
                </div>
                <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>
                    ${config.construction_area} m²
                </div>
            </div>

            <a href="${config.slug}/index.html"
               class="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                Ver Detalles
            </a>
        </div>
    </div>
    <!-- END CARD-ADV ${config.slug} -->
`;

    // Insertar antes del cierre del grid
    html = html.replace(
        /(<!-- Properties Grid -->[\s\S]*?<div class="properties-grid">)/,
        `$1\n${tarjeta}`
    );

    fs.writeFileSync('culiacan/index.html', html);
}

function generarSlug(titulo) {
    return titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function verificarDuplicado(datos, slug) {
    // Verificar 3 tipos de duplicados:
    // 1. Carpeta ya existe con mismo slug
    // 2. Precio exacto en culiacan/index.html
    // 3. Ubicación/dirección similar

    const carpetaPropiedad = `culiacan/${slug}`;

    // 1. Verificar si la carpeta ya existe
    if (fs.existsSync(carpetaPropiedad)) {
        const indexPath = `${carpetaPropiedad}/index.html`;
        if (fs.existsSync(indexPath)) {
            const html = fs.readFileSync(indexPath, 'utf8');
            const precioMatch = html.match(/\$([0-9,]+)/);
            const precio = precioMatch ? precioMatch[1] : 'Desconocido';

            return {
                carpeta: carpetaPropiedad,
                precio: `$${precio}`,
                tipo: 'carpeta'
            };
        }
    }

    // 2. Verificar precio exacto en culiacan/index.html
    if (fs.existsSync('culiacan/index.html')) {
        const html = fs.readFileSync('culiacan/index.html', 'utf8');
        const precioNormalizado = datos.price.replace(/[^0-9]/g, '');

        // Buscar tarjetas con el mismo precio
        const regexPrecio = new RegExp(`\\$${datos.price}[^0-9]`, 'g');
        const matches = html.match(regexPrecio);

        if (matches && matches.length > 0) {
            // Buscar la carpeta asociada al precio
            const regexCarpeta = new RegExp(`data-href="([^"]+)"[\\s\\S]{0,500}\\$${datos.price.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
            const carpetaMatch = html.match(regexCarpeta);

            if (carpetaMatch) {
                return {
                    carpeta: carpetaMatch[1].replace('/index.html', ''),
                    precio: `$${datos.price}`,
                    tipo: 'precio'
                };
            }
        }
    }

    // 3. Verificar ubicación similar (primeras 20 letras)
    if (datos.location && fs.existsSync('culiacan/index.html')) {
        const html = fs.readFileSync('culiacan/index.html', 'utf8');
        const ubicacionCorta = datos.location.substring(0, 20).toLowerCase();

        const regexUbicacion = new RegExp(ubicacionCorta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        if (regexUbicacion.test(html)) {
            // Intentar encontrar la carpeta asociada
            const lineas = html.split('\n');
            for (let i = 0; i < lineas.length; i++) {
                if (regexUbicacion.test(lineas[i])) {
                    // Buscar hacia atrás para encontrar data-href
                    for (let j = i; j >= Math.max(0, i - 20); j--) {
                        const hrefMatch = lineas[j].match(/data-href="([^"]+)"/);
                        if (hrefMatch) {
                            return {
                                carpeta: hrefMatch[1].replace('/index.html', ''),
                                precio: 'Verificar manualmente',
                                tipo: 'ubicacion'
                            };
                        }
                    }
                }
            }
        }
    }

    return null;
}

// Ejecutar
main().catch(console.error);
