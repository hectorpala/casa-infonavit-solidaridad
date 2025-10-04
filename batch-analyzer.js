const puppeteer = require('puppeteer');
const fs = require('fs');

// URLs encontradas en el listado - PÁGINA 2
const propertyUrls = [
    "https://propiedades.com/inmuebles/casa-en-venta-general-rosendo-rodriguez-4660-infonavit-barrancos-sinaloa-30263120",
    "https://propiedades.com/inmuebles/departamento-en-venta-c-francisco-villa-las-vegas-culiacan-rosales-sin-1190-las-vegas-sinaloa-30338371",
    "https://propiedades.com/inmuebles/casa-en-venta-avenida-aztlan-2264-industrial-el-palmito-sinaloa-30290582",
    "https://propiedades.com/inmuebles/departamento-en-venta-prolongacion-alvaro-obregon-tierra-blanca-sinaloa-28283577",
    "https://propiedades.com/inmuebles/casa-en-venta-calzada-del-ecuador-santa-fe-sinaloa-29384688",
    "https://propiedades.com/inmuebles/departamento-en-venta-guadalupe-victoria-sn-jorge-almada-sinaloa-30115051",
    "https://propiedades.com/inmuebles/casa-en-venta-islas-nicobar-sn-prados-del-sur-sinaloa-29082517",
    "https://propiedades.com/inmuebles/casa-en-venta-fuerte-san-fernando-2646-floresta-sinaloa-30261580",
    "https://propiedades.com/inmuebles/casa-en-venta-blvd-paseo-del-roble-urbivilla-del-cedro-80058-culiacan-rosales-sin-sn-stanza-castilla-sinaloa-30309397",
    "https://propiedades.com/inmuebles/casa-en-venta-barranca-del-cobre-184-renato-vega-alvarado-sinaloa-28846358",
    "https://propiedades.com/inmuebles/casa-en-venta-islas-frisias-sn-prados-del-sur-sinaloa-29464506",
    "https://propiedades.com/inmuebles/casa-en-venta-rinconada-del-principado-3697-rincon-real-sinaloa-30007332",
    "https://propiedades.com/inmuebles/casa-en-venta-san-luis-residencial-sinaloa-30388097",
    "https://propiedades.com/inmuebles/departamento-en-venta-virgo-los-alamitos-sinaloa-30075512",
    "https://propiedades.com/inmuebles/casa-en-venta-terranova-sinaloa-30360969",
    "https://propiedades.com/inmuebles/departamento-en-venta-vinorama-villa-del-roble-sinaloa-30315243",
    "https://propiedades.com/inmuebles/casa-en-venta-guadalupe-rojo-viuda-de-alvarado-el-mirador-culiacan-rosales-sin-el-mirador-sinaloa-30230098",
    "https://propiedades.com/inmuebles/casa-en-venta-culiacan-culiacan-sinaloa-30371612",
    "https://propiedades.com/inmuebles/casa-en-venta-camino-a-la-guasima-heraclio-bernal-sinaloa-30263107",
    "https://propiedades.com/inmuebles/departamento-en-venta-valle-de-chihuahua-sn-valle-alto-sinaloa-28960156"
];

// Propiedades existentes en nuestro sistema (extraídas de culiacan/index.html)
const existingProperties = [
    'valle-alto', 'circuito-san-francisco', 'benevento-residencial', 'rincon-colonial',
    'residencial-san-jose', 'colina-del-rey', 'tres-rios', 'belcantto', 'vinoramas',
    'la-campia', 'la-primavera', 'humaya', 'portalegre', 'banus', 'san-javier',
    'chapultepec', 'privada-perisur', 'centenario', 'privanzas-natura', 'natura-perisur',
    'portareal-camino-real', 'fracc-terracota', 'villa-andalucia', 'altluz', 'las-glorias',
    'hacienda-del-rio', 'santa-lourdes', 'la-campiña', 'privada-americana-perisur',
    'alamos-tec-monterrey', 'valle-alto-oaxaca', 'espacios-marsella', 'vinedos-vascos',
    'san-agustin-primavera', 'la-perla-premium', 'villas-del-rio-elite', 'bosque-monarca',
    'colinas-san-miguel', 'infonavit-solidaridad', 'portabelo-privada', 'espacios-barcelona',
    'barcelona-villa', 'circuito-canarias', 'los-pinos', '3-rios', 'urbivilla-del-roble',
    'cocotera-hacienda', 'privada-la-estancia', 'la-conquista-culiacan', 'los-angeles-culiacan',
    'valles-del-sol-culiacan', 'camino-real-portareal-culiacan', 'san-luis-residencial-culiacan',
    'infonavit-barrancos-culiacan', 'villa-del-cedro-2-culiacan', 'rincon-real-culiacan',
    'santa-fe-culiacan', 'villa-del-cedro-culiacan', 'tierra-blanca-culiacan',
    'stanza-toscana', 'portabelo', 'desarrollo-urbano-3-rios', 'la-altea-i',
    'villa-del-cedro', 'lazaro-cardenas', 'zona-dorada', 'acacia-zona-norte', 'stanza-corcega'
];

async function analyzeProperty(url) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security'
        ]
    });
    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

        // Extraer información básica para filtrar
        const data = await page.evaluate(() => {
            const getTextContent = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.textContent.trim() : '';
            };

            // Buscar ubicación en varios lugares posibles
            let location = getTextContent('.location') ||
                          getTextContent('[class*="ubicacion"]') ||
                          getTextContent('[class*="location"]') ||
                          getTextContent('h1') ||
                          document.title;

            // Buscar precio
            let price = getTextContent('.price') ||
                       getTextContent('[class*="precio"]') ||
                       getTextContent('[class*="price"]');

            return {
                location: location,
                price: price,
                title: document.title
            };
        });

        await browser.close();

        // Verificar si es de Culiacán
        const isCuliacan = data.location.toLowerCase().includes('culiacán') ||
                          data.location.toLowerCase().includes('culiacan') ||
                          data.title.toLowerCase().includes('culiacán') ||
                          data.title.toLowerCase().includes('culiacan');

        // ✅ FILTRO DE PRECIO: Extraer precio numérico y validar rango $1M-$2M
        let priceNumber = 0;
        const priceStr = data.price.replace(/[^0-9.]/g, '');

        if (data.price.includes('mil MN')) {
            // Formato: "$ 5.90 mil MN" = $5,900,000
            priceNumber = parseFloat(priceStr) * 100000;
        } else if (data.price.includes('MXN')) {
            // Formato: "$1,800,000 MXN"
            priceNumber = parseFloat(priceStr);
        }

        const inPriceRange = priceNumber >= 1000000 && priceNumber <= 2000000;

        // Generar slug simple para comparar
        const slug = url.split('/').pop().toLowerCase();

        // Verificar si ya existe (búsqueda flexible)
        const alreadyExists = existingProperties.some(existing =>
            slug.includes(existing.toLowerCase()) ||
            existing.toLowerCase().includes(slug.split('-')[0])
        );

        return {
            url,
            isCuliacan,
            alreadyExists,
            inPriceRange,
            priceNumber,
            data
        };

    } catch (error) {
        await browser.close();
        return {
            url,
            error: error.message
        };
    }
}

async function batchAnalyze() {
    console.log('🔍 Analizando propiedades del listado...\n');

    const results = [];

    for (let i = 0; i < propertyUrls.length; i++) {
        console.log(`[${i + 1}/${propertyUrls.length}] Analizando: ${propertyUrls[i]}`);
        const result = await analyzeProperty(propertyUrls[i]);
        results.push(result);

        // Delay entre requests
        await new Promise(r => setTimeout(r, 2000));
    }

    // ✅ Filtrar propiedades nuevas de Culiacán + en rango de precio $1M-$2M
    const newCuliacanProperties = results.filter(r =>
        r.isCuliacan && !r.alreadyExists && !r.error && r.inPriceRange
    );

    const outOfRangeProperties = results.filter(r =>
        r.isCuliacan && !r.alreadyExists && !r.error && !r.inPriceRange
    );

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTADOS DEL ANÁLISIS');
    console.log('='.repeat(80));
    console.log(`Total propiedades analizadas: ${results.length}`);
    console.log(`✅ De Culiacán: ${results.filter(r => r.isCuliacan).length}`);
    console.log(`❌ Fuera de Culiacán: ${results.filter(r => !r.isCuliacan).length}`);
    console.log(`🔁 Ya existen en sistema: ${results.filter(r => r.alreadyExists).length}`);
    console.log(`💰 En rango $1M-$2M: ${results.filter(r => r.inPriceRange).length}`);
    console.log(`⚠️  Fuera de rango precio: ${outOfRangeProperties.length}`);
    console.log(`⭐ NUEVAS de Culiacán (en rango): ${newCuliacanProperties.length}`);
    console.log(`⚠️  Errores: ${results.filter(r => r.error).length}`);
    console.log('='.repeat(80) + '\n');

    // Mostrar propiedades FUERA DE RANGO
    if (outOfRangeProperties.length > 0) {
        console.log('⚠️  PROPIEDADES FUERA DE RANGO ($1M-$2M) - IGNORADAS:\n');
        outOfRangeProperties.forEach((prop, idx) => {
            console.log(`${idx + 1}. ${prop.data.title}`);
            console.log(`   📍 ${prop.data.location}`);
            console.log(`   💰 ${prop.data.price} (${(prop.priceNumber / 1000000).toFixed(2)}M)`);
            console.log('');
        });
    }

    // Mostrar propiedades nuevas de Culiacán EN RANGO
    if (newCuliacanProperties.length > 0) {
        console.log('🎯 PROPIEDADES NUEVAS DE CULIACÁN PARA SCRAPING ($1M-$2M):\n');
        newCuliacanProperties.forEach((prop, idx) => {
            console.log(`${idx + 1}. ${prop.data.title}`);
            console.log(`   📍 ${prop.data.location}`);
            console.log(`   💰 ${prop.data.price} (${(prop.priceNumber / 1000000).toFixed(2)}M)`);
            console.log(`   🔗 ${prop.url}`);
            console.log('');
        });
    }

    // Guardar resultados
    fs.writeFileSync(
        'batch-analysis-results.json',
        JSON.stringify({ results, newCuliacanProperties }, null, 2)
    );

    console.log('💾 Resultados guardados en: batch-analysis-results.json\n');

    return newCuliacanProperties;
}

// Ejecutar
batchAnalyze().then(newProperties => {
    console.log(`✅ Análisis completado. ${newProperties.length} propiedades listas para scraping.`);
    process.exit(0);
}).catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
