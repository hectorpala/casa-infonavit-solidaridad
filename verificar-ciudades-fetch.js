const https = require('https');
const fs = require('fs');

/**
 * Verificación ligera de ciudades usando solo HTTP fetch
 * Extrae JSON-LD o initialState sin usar Puppeteer
 */

function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });

        }).on('error', (err) => {
            reject(err);
        });
    });
}

function extractCityFromHTML(html) {
    const result = {
        city: null,
        state: null,
        method: null,
        cloudflare: false
    };

    // Verificar si es bloqueo de Cloudflare
    if (html.includes('cf-footer-item-ip') || html.includes('Cloudflare') || html.includes('Just a moment')) {
        result.cloudflare = true;
        return result;
    }

    // Método 1: Buscar JSON-LD
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
            const jsonData = JSON.parse(match[1]);

            // Buscar en address
            if (jsonData.address) {
                if (jsonData.address.addressLocality) {
                    result.city = jsonData.address.addressLocality;
                    result.method = 'JSON-LD address.addressLocality';
                }
                if (jsonData.address.addressRegion) {
                    result.state = jsonData.address.addressRegion;
                }
            }

            // Buscar en geo.addressCity o similar
            if (jsonData.geo) {
                if (jsonData.geo.addressCity) {
                    result.city = jsonData.geo.addressCity;
                    result.method = 'JSON-LD geo.addressCity';
                }
                if (jsonData.geo.addressRegion) {
                    result.state = jsonData.geo.addressRegion;
                }
            }

            if (result.city) break;
        } catch (e) {
            // Ignorar errores de parseo
        }
    }

    // Método 2: Buscar initialState o __PRELOADED_STATE__
    if (!result.city) {
        const initialStateRegex = /(?:initialState|__PRELOADED_STATE__|window\.__INITIAL_STATE__)\s*=\s*(\{[^;]+\});?/i;
        const stateMatch = html.match(initialStateRegex);

        if (stateMatch) {
            try {
                const stateData = JSON.parse(stateMatch[1]);

                // Buscar ciudad en diferentes paths del state
                const searchPaths = [
                    ['listing', 'location', 'city'],
                    ['listing', 'address', 'city'],
                    ['property', 'location', 'city'],
                    ['property', 'address', 'city'],
                    ['data', 'location', 'city'],
                    ['data', 'address', 'city']
                ];

                for (const path of searchPaths) {
                    let obj = stateData;
                    let found = true;

                    for (const key of path) {
                        if (obj && obj[key] !== undefined) {
                            obj = obj[key];
                        } else {
                            found = false;
                            break;
                        }
                    }

                    if (found && typeof obj === 'string') {
                        result.city = obj;
                        result.method = `initialState ${path.join('.')}`;
                        break;
                    }
                }
            } catch (e) {
                // Ignorar errores de parseo
            }
        }
    }

    // Método 3: Buscar en meta tags
    if (!result.city) {
        const cityMetaRegex = /<meta[^>]+(?:property|name)=["'](?:og:locality|geo\.placename|city)["'][^>]+content=["']([^"']+)["']/i;
        const cityMatch = html.match(cityMetaRegex);
        if (cityMatch) {
            result.city = cityMatch[1];
            result.method = 'Meta tag';
        }
    }

    // Método 4: Buscar en breadcrumbs o texto visible
    if (!result.city) {
        // Buscar patrones como "Culiacán, Sinaloa" o "Mazatlán, Sinaloa"
        const locationPatterns = [
            /(?:en|ubicado en|ubicación:?)\s+([A-Z][a-záéíóúñ\s]+),\s+(Sinaloa|Nuevo León|Sonora)/i,
            /(Culiacán|Mazatlán|Monterrey|Los Mochis|Guasave|Navolato),\s+(Sinaloa|Nuevo León|Sonora)/i
        ];

        for (const pattern of locationPatterns) {
            const locMatch = html.match(pattern);
            if (locMatch) {
                result.city = locMatch[1].trim();
                result.state = locMatch[2].trim();
                result.method = 'Pattern matching';
                break;
            }
        }
    }

    return result;
}

(async () => {
    console.log('🔍 VERIFICACIÓN LIGERA DE CIUDADES (HTTP FETCH)\n');
    console.log('═'.repeat(100));

    // Leer URLs del archivo
    const urlsContent = fs.readFileSync('urls-propiedades-recientes-culiacan.txt', 'utf8');
    const urls = urlsContent.split('\n').map(line => line.trim()).filter(line => line && line.startsWith('http'));

    console.log(`📋 Total de URLs a verificar: ${urls.length}\n`);

    const results = [];
    let culiacanCount = 0;
    let otrasCiudadesCount = 0;
    let cloudflareCount = 0;
    let noVerificadoCount = 0;

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const propertyIdMatch = url.match(/-(\d+)\.html/);
        const propertyId = propertyIdMatch ? propertyIdMatch[1] : 'UNKNOWN';

        console.log(`[${i + 1}/${urls.length}] ID: ${propertyId}`);

        try {
            // Fetch HTML
            const html = await fetchHTML(url);

            // Extraer ciudad
            const { city, state, method, cloudflare } = extractCityFromHTML(html);

            let status;
            let cityDisplay = 'No verificado';
            let stateDisplay = '';

            if (cloudflare) {
                status = '🔒 CLOUDFLARE';
                cityDisplay = 'Bloqueado por Cloudflare';
                cloudflareCount++;
            } else if (city) {
                stateDisplay = state || '';
                cityDisplay = stateDisplay ? `${city}, ${stateDisplay}` : city;

                const cityLower = city.toLowerCase();
                const isCuliacan = cityLower.includes('culiacán') || cityLower.includes('culiacan');

                if (isCuliacan) {
                    status = '✅ CULIACÁN';
                    culiacanCount++;
                } else {
                    status = '⚠️ OTRA';
                    otrasCiudadesCount++;
                }

                console.log(`   ${status} - ${cityDisplay} (${method})`);
            } else {
                status = '❓ NO VERIFICADO';
                noVerificadoCount++;
                console.log(`   ${status} - Sin datos encontrados`);
            }

            results.push({
                num: i + 1,
                id: propertyId,
                url,
                city: city || 'No verificado',
                state: state || '',
                status,
                method: method || 'N/A'
            });

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            results.push({
                num: i + 1,
                id: propertyId,
                url,
                city: 'ERROR',
                state: '',
                status: '❌ ERROR',
                method: error.message
            });
            noVerificadoCount++;
        }

        // Pequeño delay para no saturar
        await new Promise(r => setTimeout(r, 500));
    }

    // Generar reporte final
    console.log('\n' + '═'.repeat(100));
    console.log('📊 REPORTE FINAL\n');

    console.log('═'.repeat(100));
    console.log('NUM | ID         | CITY                     | STATE          | STATUS');
    console.log('═'.repeat(100));

    results.forEach(r => {
        const idShort = r.id.substring(0, 10).padEnd(10);
        const cityShort = r.city.substring(0, 24).padEnd(24);
        const stateShort = r.state.substring(0, 14).padEnd(14);
        const statusShort = r.status.padEnd(15);
        console.log(`${String(r.num).padStart(3)} | ${idShort} | ${cityShort} | ${stateShort} | ${statusShort}`);
    });

    console.log('═'.repeat(100));
    console.log(`\n📈 RESUMEN:`);
    console.log(`   ✅ Propiedades en CULIACÁN: ${culiacanCount}`);
    console.log(`   ⚠️  Propiedades en OTRAS CIUDADES: ${otrasCiudadesCount}`);
    console.log(`   🔒 Bloqueadas por CLOUDFLARE: ${cloudflareCount}`);
    console.log(`   ❓ NO VERIFICADAS: ${noVerificadoCount}`);
    console.log(`   📊 Total verificadas: ${results.length}`);

    // Guardar JSON
    fs.writeFileSync('/tmp/verificacion-fetch.json', JSON.stringify(results, null, 2));
    console.log(`\n💾 Reporte completo guardado en: /tmp/verificacion-fetch.json`);

    // Listar propiedades verificadas de Culiacán
    const culiacanProps = results.filter(r => r.status === '✅ CULIACÁN');
    if (culiacanProps.length > 0) {
        console.log(`\n✅ PROPIEDADES CONFIRMADAS DE CULIACÁN (${culiacanProps.length}):\n`);
        culiacanProps.forEach(r => {
            console.log(`   ${r.num}. ID ${r.id} - ${r.city}, ${r.state}`);
            console.log(`      ${r.url}`);
            console.log(`      Método: ${r.method}\n`);
        });
    }

    // Listar propiedades de otras ciudades
    const otrasProps = results.filter(r => r.status === '⚠️ OTRA');
    if (otrasProps.length > 0) {
        console.log(`\n⚠️  PROPIEDADES DE OTRAS CIUDADES (${otrasProps.length}):\n`);
        otrasProps.forEach(r => {
            console.log(`   ${r.num}. ID ${r.id} - ${r.city}, ${r.state}`);
            console.log(`      ${r.url}\n`);
        });
    }

    // Listar bloqueadas por Cloudflare
    if (cloudflareCount > 0) {
        console.log(`\n🔒 BLOQUEADAS POR CLOUDFLARE (${cloudflareCount}):`);
        console.log(`   Estas requieren OXYLABS para verificar\n`);
    }

    console.log('═'.repeat(100));

})().catch(e => {
    console.error('❌ Error fatal:', e.message);
    process.exit(1);
});
