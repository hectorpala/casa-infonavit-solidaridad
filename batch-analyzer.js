const puppeteer = require('puppeteer');
const fs = require('fs');

// URLs encontradas en el listado - PÁGINA 2 (URLs 21-36 PENDIENTES)
const propertyUrls = [
    "https://propiedades.com/inmuebles/casa-en-venta-mision-urbi-villa-del-sol-sinaloa-30053177",
    "https://propiedades.com/inmuebles/departamento-en-venta-psicologos-557-chapultepec-sinaloa-29945316",
    "https://propiedades.com/inmuebles/casa-en-venta-avenida-vinoramas-4686-infonavit-barrancos-iv-sinaloa-30123612",
    "https://propiedades.com/inmuebles/casa-en-venta-avenida-san-antonio-providencia-sinaloa-27809272",
    "https://propiedades.com/inmuebles/casa-en-venta-6-de-enero-sinaloa-30284093",
    "https://propiedades.com/inmuebles/casa-en-venta-urbivilla-del-cedro-80058-culiacan-rosales-sin-sn-villa-del-cedro-sinaloa-30367066",
    "https://propiedades.com/inmuebles/casa-en-venta-av-de-los-tules-2161-bonaterra-sinaloa-29696553",
    "https://propiedades.com/inmuebles/casa-en-venta-primera--issstesin-sinaloa-26881569",
    "https://propiedades.com/inmuebles/casa-en-venta-calle-mariano-paredes--568-francisco-i-madero-sinaloa-28865012",
    "https://propiedades.com/inmuebles/casa-en-venta-av-noche-buena-terranova-80143-culiacan-rosales-sin-terranova-sinaloa-30383674",
    "https://propiedades.com/inmuebles/casa-en-venta-el-mirador-sinaloa-30284085",
    "https://propiedades.com/inmuebles/casa-en-venta-cerro-algodones-buenos-aires-sinaloa-28864962",
    "https://propiedades.com/inmuebles/casa-en-venta-olmecas-sn-valle-bonito-sinaloa-29931876",
    "https://propiedades.com/inmuebles/casa-en-venta-jardin-de-las-orquideas-3115-laureles-sinaloa-28865008",
    "https://propiedades.com/inmuebles/casa-en-venta-manantial-de-sanalona-7970-real-san-angel-sinaloa-30154051",
    "https://propiedades.com/inmuebles/casa-en-venta-el-vallado-sinaloa-30283990"
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
