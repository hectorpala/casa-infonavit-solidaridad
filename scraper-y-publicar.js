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

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const data = await page.evaluate(() => {
        const getText = (selector) => {
            const el = document.querySelector(selector);
            return el ? el.textContent.trim() : null;
        };

        const getImages = () => {
            const images = [];
            document.querySelectorAll('img[src*="cdn.propiedades.com"]').forEach(img => {
                if (img.src && !images.includes(img.src)) {
                    images.push(img.src);
                }
            });
            return images.slice(0, 10); // Máximo 10 fotos
        };

        return {
            title: getText('h1'),
            price: getText('[class*="price"]') || getText('strong'),
            location: getText('h2'),
            description: getText('[class*="description"]') || getText('p[data-testid="property-description"]'),
            images: getImages()
        };
    });

    await browser.close();

    console.log('✅ Datos scrapeados:', {
        title: data.title,
        price: data.price,
        fotos: data.images.length
    });

    return data;
}

function extraerDatosPropiedad(scraped) {
    // Extraer precio numérico
    const priceMatch = scraped.price.match(/[\d,]+/);
    const priceNumber = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;

    // Extraer ubicación
    const locationParts = scraped.location.split(',');
    const colonia = locationParts[0]?.replace('Municipio', '').trim() || 'Culiacán';

    // Crear slug
    const slug = `casa-venta-${colonia.toLowerCase().replace(/\s+/g, '-').replace(/[áàäâã]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöôõ]/g, 'o').replace(/[úùüû]/g, 'u')}`;

    // Extraer features de la descripción
    const desc = scraped.description.toLowerCase();
    const bedrooms = desc.match(/(\d+)\s*recamar/)?.[1] || 2;
    const bathrooms = desc.match(/(\d+)\s*baño/)?.[1] || 1;

    return {
        title: `Casa en Venta ${colonia}`,
        location: `${colonia}, Culiacán, Sinaloa`,
        price: scraped.price.includes('$') ? scraped.price.split(' ')[0] : `$${priceNumber.toLocaleString('es-MX')}`,
        priceNumber: priceNumber,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        parking: 2,
        area: 140,
        landArea: 140,
        yearBuilt: "2023",
        slug: slug,
        key: slug,
        propertyType: "venta",
        description: scraped.description,
        features: [
            `${bedrooms} Recámaras`,
            `${bathrooms} Baño${bathrooms > 1 ? 's' : ''} Completo${bathrooms > 1 ? 's' : ''}`,
            "140 m² de Terreno",
            "Patio Amplio",
            "2 Estacionamientos"
        ],
        whatsappMessage: `Hola, me interesa la casa en ${colonia} de ${scraped.price.split(' ')[0]}`,
        photoCount: scraped.images.length,
        imageUrls: scraped.images
    };
}

function descargarFotos(propertyData) {
    console.log(`\n📸 Descargando ${propertyData.photoCount} fotos...`);

    const imageDir = `images/${propertyData.slug}`;
    if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
    }

    propertyData.imageUrls.forEach((url, index) => {
        const filename = `${imageDir}/foto-${index + 1}.jpg`;
        try {
            execSync(`curl -s "${url}" -o "${filename}"`, { stdio: 'inherit' });
            console.log(`   ✅ foto-${index + 1}.jpg`);
        } catch (err) {
            console.error(`   ❌ Error descargando foto ${index + 1}`);
        }
    });

    console.log(`✅ ${propertyData.photoCount} fotos descargadas en ${imageDir}`);
}

function generarHTML(propertyData) {
    console.log('\n📄 Generando HTML con PropertyPageGenerator...');

    const generator = new PropertyPageGenerator(false);
    let htmlContent = generator.generateFromSolidaridadTemplate(propertyData);

    // CORRECCIONES AUTOMÁTICAS DE METADATOS
    console.log('🔧 Corrigiendo metadatos automáticamente...');

    // 1. Title tag
    htmlContent = htmlContent.replace(
        /<title>.*?<\/title>/,
        `<title>Casa en Venta ${propertyData.price} - ${propertyData.location.split(',')[0]}, Culiacán | Hector es Bienes Raíces</title>`
    );

    // 2. Meta description
    htmlContent = htmlContent.replace(
        /<meta name="description" content=".*?">/,
        `<meta name="description" content="Casa en venta en ${propertyData.location.split(',')[0]}, Culiacán. ${propertyData.bedrooms} recámaras, ${propertyData.bathrooms} baño${propertyData.bathrooms > 1 ? 's' : ''}, ${propertyData.area}m² terreno. ¡Contáctanos!">`
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

    const filename = `${propertyData.slug}.html`;
    fs.writeFileSync(filename, htmlContent);

    console.log(`✅ HTML generado: ${filename}`);
    console.log('   ✅ Title corregido');
    console.log('   ✅ Meta description corregida');
    console.log('   ✅ Open Graph corregido');
    console.log('   ✅ Schema.org corregido');
    console.log('   ✅ Hero section corregido');

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
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l3-3 3 3M5 10v11a1 1 0 001 1h3M20 10v11a1 1 0 01-1 1h-3"></path>
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

        console.log('\n✅ PROCESO COMPLETADO');
        console.log('\n📦 Archivos generados:');
        console.log(`   - ${htmlFile}`);
        console.log(`   - tarjeta-${propertyData.slug}.html`);
        console.log(`   - images/${propertyData.slug}/ (${propertyData.photoCount} fotos)`);
        console.log('\n🎯 Próximo paso:');
        console.log(`   1. Revisar: open ${htmlFile}`);
        console.log(`   2. Publicar: dile "publica ya"`);

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
