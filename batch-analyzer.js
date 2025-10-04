const puppeteer = require('puppeteer');
const fs = require('fs');

// URLs encontradas en el listado - PÁGINA 4 (URLs 21-43 PENDIENTES - SIN TERRENOS)
const propertyUrls = [
    "https://propiedades.com/inmuebles/casa-en-venta-san-pedro-de-san-jose-7788-san-luis-residencial-ii-sinaloa-28729193",
    "https://propiedades.com/inmuebles/departamento-en-venta-desarrollo-urbano-3-rios-sinaloa-30283916",
    "https://propiedades.com/inmuebles/casa-en-venta-samoa-perisur-sinaloa-28840298",
    "https://propiedades.com/inmuebles/casa-en-venta-san-juan-bautista-4204-camino-real-sinaloa-30190659",
    "https://propiedades.com/inmuebles/casa-en-venta-villa-del-cedro-sinaloa-30371864",
    "https://propiedades.com/inmuebles/casa-en-venta-belisario-dominguez-sn-chulavista-sinaloa-30167651",
    "https://propiedades.com/inmuebles/casa-en-venta-camino-real-sinaloa-30179634",
    "https://propiedades.com/inmuebles/departamento-en-venta-sin-ubicacion--valle-alto-sinaloa-28704583",
    "https://propiedades.com/inmuebles/casa-en-venta-terrones-766-buenos-aires-sinaloa-27644510",
    "https://propiedades.com/inmuebles/casa-en-venta-espadin-459-los-mezcales-sinaloa-29728953",
    "https://propiedades.com/inmuebles/casa-en-venta-calle-salvador-elizondo-5839-finisterra-sinaloa-29780618",
    "https://propiedades.com/inmuebles/casa-en-venta-aurora-6-de-enero-sinaloa-28732962",
    "https://propiedades.com/inmuebles/departamento-en-venta-torres-portalegre-portalegre-sinaloa-27993167",
    "https://propiedades.com/inmuebles/departamento-en-venta-magnolia-bosques-del-rey-sinaloa-27593164",
    "https://propiedades.com/inmuebles/casa-en-venta-calle-camalotes-4765-centro-sinaloa-28763716",
    "https://propiedades.com/inmuebles/departamento-en-venta-virgo-los-alamitos-sinaloa-29997537",
    "https://propiedades.com/inmuebles/casa-en-venta-calle-monza-stanza-toscana-sinaloa-28498839",
    "https://propiedades.com/inmuebles/casa-en-venta-bosques-del-rio-sinaloa-30179613",
    "https://propiedades.com/inmuebles/departamento-en-venta-jose-limon-1015-tres-rios-sinaloa-27550379",
    "https://propiedades.com/inmuebles/casa-en-venta-21-de-marzo-sinaloa-30284213",
    "https://propiedades.com/inmuebles/departamento-en-venta-amado-nervo-1970-tierra-blanca-sinaloa-28298609",
    "https://propiedades.com/inmuebles/casa-en-venta-abeto-centro-sinaloa-28565859",
    "https://propiedades.com/inmuebles/casa-en-venta-manantial-san-agustin-sinaloa-25589090",
    "https://propiedades.com/inmuebles/casa-en-venta-valle-victoria-2444-valle-alto-sinaloa-28829316",
    "https://propiedades.com/inmuebles/casa-en-venta-81133-las-moras-sin-las-moras-sinaloa-30353053",
    "https://propiedades.com/inmuebles/casa-en-venta-calle-valle-sereno-norte-sn-la-rioja-sinaloa-29222458",
    "https://propiedades.com/inmuebles/casa-en-venta-av-siete-valles-4688-valle-alto-80050-culiacan-rosales-sin-4688-valle-alto-sinaloa-30358237"
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
