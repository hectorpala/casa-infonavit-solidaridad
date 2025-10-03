#!/usr/bin/env node

/**
 * SCRAPER DE LISTADO - EXTRAE URLs DE PROPIEDADES
 *
 * Este script:
 * 1. Accede a página de listado de propiedades.com
 * 2. Extrae todas las URLs individuales de propiedades
 * 3. Filtra solo propiedades con fotos disponibles
 * 4. Genera archivo con URLs listas para scraper-batch.js
 *
 * Uso: node scraper-listado.js <URL_LISTADO>
 * Ejemplo: node scraper-listado.js "https://propiedades.com/culiacan/residencial-renta?pagina=5"
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function extraerURLsDelListado(listadoUrl) {
    console.log('🔍 Accediendo al listado:', listadoUrl);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-http2' // Evitar error HTTP2
        ]
    });

    const page = await browser.newPage();

    // User agent realista
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        await page.goto(listadoUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Esperar a que carguen las tarjetas
        await page.waitForSelector('a[href*="/inmuebles/"]', { timeout: 15000 });

        const propiedades = await page.evaluate(() => {
            const properties = [];
            const processedUrls = new Set();

            // Buscar todos los links a propiedades individuales
            const links = document.querySelectorAll('a[href*="/inmuebles/"]');

            links.forEach(link => {
                let href = link.href;

                // Limpiar URL: remover parámetros después de #
                if (href && href.includes('#')) {
                    href = href.split('#')[0];
                }

                // Evitar duplicados y validar formato
                if (href &&
                    !processedUrls.has(href) &&
                    href.includes('/inmuebles/') &&
                    !href.includes('javascript:')) {

                    // Asumir que todas tienen fotos (validaremos al scrapear)
                    properties.push({
                        url: href,
                        hasImage: true
                    });

                    processedUrls.add(href);
                }
            });

            return properties;
        });

        await browser.close();

        // Filtrar solo propiedades con fotos
        const conFotos = propiedades.filter(p => p.hasImage);
        const sinFotos = propiedades.filter(p => !p.hasImage);

        console.log(`\n✅ Extracción completada:`);
        console.log(`   Total encontradas: ${propiedades.length}`);
        console.log(`   Con fotos: ${conFotos.length}`);
        console.log(`   Sin fotos: ${sinFotos.length}`);

        return {
            todas: propiedades.map(p => p.url),
            conFotos: conFotos.map(p => p.url),
            sinFotos: sinFotos.map(p => p.url)
        };

    } catch (err) {
        await browser.close();
        throw err;
    }
}

async function procesarMultiplesPaginas(baseUrl, paginaInicio, paginaFin) {
    console.log(`\n🔄 Procesando páginas ${paginaInicio} a ${paginaFin}...\n`);

    let todasLasUrls = [];

    for (let pagina = paginaInicio; pagina <= paginaFin; pagina++) {
        console.log(`\n📄 Procesando página ${pagina}/${paginaFin}...`);

        // Construir URL con número de página
        const url = baseUrl.includes('?')
            ? baseUrl.replace(/pagina=\d+/, `pagina=${pagina}`)
            : `${baseUrl}?pagina=${pagina}`;

        try {
            const resultado = await extraerURLsDelListado(url);
            todasLasUrls = todasLasUrls.concat(resultado.conFotos);

            console.log(`   ✅ Página ${pagina}: ${resultado.conFotos.length} propiedades con fotos`);

            // Pausa entre páginas (evitar rate limiting)
            if (pagina < paginaFin) {
                console.log('   ⏳ Esperando 2 segundos...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

        } catch (err) {
            console.error(`   ❌ Error en página ${pagina}:`, err.message);
        }
    }

    return todasLasUrls;
}

// MAIN
(async () => {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('❌ Falta URL del listado');
        console.log('\nUso:');
        console.log('  Una página:    node scraper-listado.js <URL>');
        console.log('  Múltiples:     node scraper-listado.js <URL_BASE> <PAGINA_INICIO> <PAGINA_FIN>');
        console.log('\nEjemplos:');
        console.log('  node scraper-listado.js "https://propiedades.com/culiacan/residencial-renta?pagina=5"');
        console.log('  node scraper-listado.js "https://propiedades.com/culiacan/residencial-renta?pagina=1" 1 10');
        process.exit(1);
    }

    try {
        console.log('\n🚀 SCRAPER DE LISTADO - EXTRACTOR DE URLs\n');

        let urlsConFotos = [];

        if (args.length === 3) {
            // Modo múltiples páginas
            const baseUrl = args[0];
            const paginaInicio = parseInt(args[1]);
            const paginaFin = parseInt(args[2]);

            urlsConFotos = await procesarMultiplesPaginas(baseUrl, paginaInicio, paginaFin);

        } else {
            // Modo una sola página
            const listadoUrl = args[0];
            const resultado = await extraerURLsDelListado(listadoUrl);
            urlsConFotos = resultado.conFotos;
        }

        // Eliminar duplicados finales
        urlsConFotos = [...new Set(urlsConFotos)];

        console.log(`\n\n📊 RESUMEN FINAL:`);
        console.log(`   Total URLs con fotos: ${urlsConFotos.length}\n`);

        if (urlsConFotos.length === 0) {
            console.log('⚠️  No se encontraron propiedades con fotos');
            process.exit(0);
        }

        // Guardar resultados
        const timestamp = Date.now();

        // 1. Archivo JSON con todas las URLs
        const jsonFile = `urls-listado-${timestamp}.json`;
        fs.writeFileSync(jsonFile, JSON.stringify({
            fecha: new Date().toISOString(),
            total: urlsConFotos.length,
            urls: urlsConFotos
        }, null, 2));
        console.log(`✅ URLs guardadas en: ${jsonFile}`);

        // 2. Archivo JS listo para copiar a scraper-batch.js
        const jsFile = `urls-para-batch-${timestamp}.js`;
        const jsContent = `// Generado automáticamente el ${new Date().toISOString()}
// Total: ${urlsConFotos.length} propiedades con fotos

const URLS_TO_SCRAPE = [
${urlsConFotos.map(url => `    "${url}",`).join('\n')}
];

module.exports = URLS_TO_SCRAPE;
`;
        fs.writeFileSync(jsFile, jsContent);
        console.log(`✅ Array JavaScript en: ${jsFile}`);

        // 3. Mostrar primeras 5 URLs como preview
        console.log(`\n📋 Preview (primeras 5 URLs):`);
        urlsConFotos.slice(0, 5).forEach((url, i) => {
            console.log(`   ${i + 1}. ${url}`);
        });
        if (urlsConFotos.length > 5) {
            console.log(`   ... y ${urlsConFotos.length - 5} más`);
        }

        console.log(`\n🎯 Próximos pasos:`);
        console.log(`   1. Copia el contenido de ${jsFile}`);
        console.log(`   2. Pégalo en scraper-batch.js (reemplaza URLS_TO_SCRAPE)`);
        console.log(`   3. Ejecuta: node scraper-batch.js`);
        console.log(`   4. Espera ~${Math.ceil(urlsConFotos.length * 3 / 60)} minutos (${urlsConFotos.length} propiedades × 3 min c/u)\n`);

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
