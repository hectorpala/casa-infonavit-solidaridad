const puppeteer = require('puppeteer');
const fs = require('fs');

// URLs encontradas en el listado
const propertyUrls = [
    "https://propiedades.com/inmuebles/casa-en-venta-alejandria-vinoramas-sinaloa-28718607",
    "https://propiedades.com/inmuebles/casa-en-venta-constituyente-andres-magallon-libertad-sinaloa-28817577",
    "https://propiedades.com/inmuebles/casa-en-venta-circuito-san-francisco-12-la-primavera-sinaloa-30181775",
    "https://propiedades.com/inmuebles/casa-en-venta-mariano-escobedo-356-centro-sinaloa-sinaloa-30263072",
    "https://propiedades.com/inmuebles/casa-en-venta-andador-agrapando-6138-bugambilias-sinaloa-30226154",
    "https://propiedades.com/inmuebles/casa-en-venta-rivallagigedo-la-campina-sinaloa-30181774",
    "https://propiedades.com/inmuebles/casa-en-venta-blvd-circuito-interior-espacios-barcelona-sinaloa-28718521",
    "https://propiedades.com/inmuebles/casa-en-venta-privada-riace-2956-residencial-san-jose-sinaloa-30154064",
    "https://propiedades.com/inmuebles/casa-en-venta-benevento-residencial-80014-culiacan-rosales-sin-sn-benevento-residencial-sinaloa-30238219",
    "https://propiedades.com/inmuebles/casa-en-venta-blvd-paseo-toscana-80050-culiacan-rosales-sin-sn-stanza-toscana-sinaloa-30255870"
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

    // Filtrar propiedades nuevas de Culiacán
    const newCuliacanProperties = results.filter(r =>
        r.isCuliacan && !r.alreadyExists && !r.error
    );

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTADOS DEL ANÁLISIS');
    console.log('='.repeat(80));
    console.log(`Total propiedades analizadas: ${results.length}`);
    console.log(`✅ De Culiacán: ${results.filter(r => r.isCuliacan).length}`);
    console.log(`❌ Fuera de Culiacán: ${results.filter(r => !r.isCuliacan).length}`);
    console.log(`🔁 Ya existen en sistema: ${results.filter(r => r.alreadyExists).length}`);
    console.log(`⭐ NUEVAS de Culiacán: ${newCuliacanProperties.length}`);
    console.log(`⚠️  Errores: ${results.filter(r => r.error).length}`);
    console.log('='.repeat(80) + '\n');

    // Mostrar propiedades nuevas de Culiacán
    if (newCuliacanProperties.length > 0) {
        console.log('🎯 PROPIEDADES NUEVAS DE CULIACÁN PARA SCRAPING:\n');
        newCuliacanProperties.forEach((prop, idx) => {
            console.log(`${idx + 1}. ${prop.data.title}`);
            console.log(`   📍 ${prop.data.location}`);
            console.log(`   💰 ${prop.data.price}`);
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
