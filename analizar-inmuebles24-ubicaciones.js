const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🔍 ANÁLISIS PROFUNDO: Inmuebles24 - Sistema de Ubicaciones\n');
    console.log('═'.repeat(80) + '\n');

    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Interceptar peticiones de red
    const networkRequests = [];
    page.on('request', request => {
        const url = request.url();
        if (url.includes('maps') || url.includes('geocod') || url.includes('location') || url.includes('coordinates')) {
            networkRequests.push({
                url: url.substring(0, 200),
                method: request.method(),
                type: request.resourceType()
            });
        }
    });

    // URL de ejemplo - propiedad de Culiacán que sabemos existe
    const url = 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-se-vende-casa-en-perisur-ii-culiacan-147711585.html';

    console.log('📄 Cargando página de Inmuebles24...');
    console.log(`   URL: ${url}\n`);

    await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    console.log('✅ Página cargada\n');
    console.log('═'.repeat(80) + '\n');

    // ========================================
    // 1. ANÁLISIS DE DIRECCIONES EN HTML
    // ========================================
    console.log('📍 1️⃣  ANÁLISIS DE DIRECCIONES EN HTML\n');

    const addressData = await page.evaluate(() => {
        const data = {
            breadcrumbs: [],
            metaTags: [],
            headings: [],
            bodyText: [],
            spans: [],
            divs: []
        };

        // Breadcrumbs
        const breadcrumbElements = document.querySelectorAll('[class*="breadcrumb"], nav a, .breadcrumb a');
        breadcrumbElements.forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length < 100) {
                data.breadcrumbs.push(text);
            }
        });

        // Meta tags
        const metaSelectors = [
            'meta[property="og:street-address"]',
            'meta[property="og:locality"]',
            'meta[name="address"]',
            'meta[name="geo.position"]',
            'meta[property="place:location:latitude"]',
            'meta[property="place:location:longitude"]'
        ];
        metaSelectors.forEach(sel => {
            const meta = document.querySelector(sel);
            if (meta) {
                data.metaTags.push({
                    name: meta.getAttribute('name') || meta.getAttribute('property'),
                    content: meta.getAttribute('content')
                });
            }
        });

        // Headings (h1, h2, h3)
        const headings = document.querySelectorAll('h1, h2, h3');
        headings.forEach(h => {
            const text = h.textContent.trim();
            if (text && text.length < 200) {
                data.headings.push(text);
            }
        });

        // Buscar elementos con clases relacionadas con ubicación
        const locationClasses = [
            '[class*="location"]',
            '[class*="address"]',
            '[class*="place"]',
            '[class*="ubicacion"]',
            '[class*="direccion"]'
        ];

        locationClasses.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const text = el.textContent.trim();
                    if (text && text.length > 5 && text.length < 200) {
                        if (el.tagName === 'SPAN') {
                            data.spans.push({ class: el.className, text });
                        } else if (el.tagName === 'DIV') {
                            data.divs.push({ class: el.className, text: text.substring(0, 100) });
                        }
                    }
                });
            } catch (e) {}
        });

        // Buscar en body text líneas que parezcan direcciones
        const bodyHTML = document.body.innerHTML;
        const addressPatterns = [
            /(?:Calle|Av\.|Avenida|Blvd|Boulevard|Privada|Priv\.)\s+[^<]+(?:,\s*[^<]+){0,3}/gi,
            /(?:Fracc\.|Fraccionamiento|Colonia|Col\.)\s+[^<,]+,\s*[^<]+/gi
        ];

        addressPatterns.forEach(pattern => {
            const matches = bodyHTML.match(pattern);
            if (matches) {
                matches.slice(0, 10).forEach(m => {
                    const clean = m.replace(/<[^>]*>/g, '').trim();
                    if (clean.length > 10 && clean.length < 200) {
                        data.bodyText.push(clean);
                    }
                });
            }
        });

        return data;
    });

    console.log('🔹 Breadcrumbs encontrados:', addressData.breadcrumbs.length);
    addressData.breadcrumbs.slice(0, 5).forEach((b, i) => console.log(`   ${i + 1}. ${b}`));

    console.log('\n🔹 Meta tags de ubicación:', addressData.metaTags.length);
    addressData.metaTags.forEach(m => console.log(`   ${m.name}: ${m.content}`));

    console.log('\n🔹 Headings con ubicación:', addressData.headings.length);
    addressData.headings.slice(0, 3).forEach((h, i) => console.log(`   ${i + 1}. ${h.substring(0, 80)}`));

    console.log('\n🔹 Spans con clases de ubicación:', addressData.spans.length);
    [...new Set(addressData.spans.map(s => s.text))].slice(0, 5).forEach((text, i) => {
        console.log(`   ${i + 1}. ${text}`);
    });

    console.log('\n🔹 Patrones de dirección en body text:', addressData.bodyText.length);
    [...new Set(addressData.bodyText)].slice(0, 5).forEach((text, i) => {
        console.log(`   ${i + 1}. ${text.substring(0, 80)}`);
    });

    console.log('\n' + '═'.repeat(80) + '\n');

    // ========================================
    // 2. ANÁLISIS DE JSON-LD
    // ========================================
    console.log('📋 2️⃣  ANÁLISIS DE JSON-LD STRUCTURED DATA\n');

    const jsonLdData = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const results = [];

        scripts.forEach((script, index) => {
            try {
                const data = JSON.parse(script.textContent);
                results.push({
                    index,
                    type: data['@type'],
                    hasAddress: !!data.address,
                    address: data.address,
                    hasGeo: !!data.geo,
                    geo: data.geo,
                    name: data.name,
                    raw: script.textContent.substring(0, 500)
                });
            } catch (e) {
                results.push({
                    index,
                    error: e.message
                });
            }
        });

        return results;
    });

    console.log(`🔹 Scripts JSON-LD encontrados: ${jsonLdData.length}\n`);

    jsonLdData.forEach((item, i) => {
        console.log(`   Script ${i + 1}:`);
        console.log(`   - @type: ${item.type || 'N/A'}`);
        console.log(`   - Tiene address: ${item.hasAddress ? '✅' : '❌'}`);
        if (item.address) {
            console.log(`   - streetAddress: "${item.address.streetAddress || 'N/A'}"`);
            console.log(`   - addressLocality: "${item.address.addressLocality || 'N/A'}"`);
            console.log(`   - addressRegion: "${item.address.addressRegion || 'N/A'}"`);
            console.log(`   - postalCode: "${item.address.postalCode || 'N/A'}"`);
        }
        console.log(`   - Tiene geo: ${item.hasGeo ? '✅' : '❌'}`);
        if (item.geo) {
            console.log(`   - latitude: ${item.geo.latitude}`);
            console.log(`   - longitude: ${item.geo.longitude}`);
        }
        console.log('');
    });

    console.log('═'.repeat(80) + '\n');

    // ========================================
    // 3. ANÁLISIS DE MAPAS (IFRAME/EMBED)
    // ========================================
    console.log('🗺️  3️⃣  ANÁLISIS DE MAPAS (IFRAME/EMBED)\n');

    const mapData = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        const mapIframes = [];

        iframes.forEach((iframe, index) => {
            const src = iframe.src;
            if (src && (src.includes('maps') || src.includes('google'))) {
                // Extraer coordenadas del src
                const coordMatch = src.match(/[?&]q=([0-9.-]+),([0-9.-]+)/);
                const embedMatch = src.match(/@([0-9.-]+),([0-9.-]+)/);
                const placeMatch = src.match(/place\/([^/]+)/);

                mapIframes.push({
                    index,
                    src: src.substring(0, 300),
                    hasCoordinates: !!(coordMatch || embedMatch),
                    coordinates: coordMatch ? {
                        lat: parseFloat(coordMatch[1]),
                        lng: parseFloat(coordMatch[2]),
                        method: 'q parameter'
                    } : embedMatch ? {
                        lat: parseFloat(embedMatch[1]),
                        lng: parseFloat(embedMatch[2]),
                        method: '@ notation'
                    } : null,
                    hasPlace: !!placeMatch,
                    place: placeMatch ? decodeURIComponent(placeMatch[1]) : null
                });
            }
        });

        return mapIframes;
    });

    console.log(`🔹 Iframes de mapas encontrados: ${mapData.length}\n`);

    mapData.forEach((map, i) => {
        console.log(`   Iframe ${i + 1}:`);
        console.log(`   - Tiene coordenadas: ${map.hasCoordinates ? '✅' : '❌'}`);
        if (map.coordinates) {
            console.log(`   - Latitud: ${map.coordinates.lat}`);
            console.log(`   - Longitud: ${map.coordinates.lng}`);
            console.log(`   - Método: ${map.coordinates.method}`);
        }
        console.log(`   - Tiene place: ${map.hasPlace ? '✅' : '❌'}`);
        if (map.place) {
            console.log(`   - Place: ${map.place}`);
        }
        console.log(`   - Src: ${map.src.substring(0, 150)}...`);
        console.log('');
    });

    console.log('═'.repeat(80) + '\n');

    // ========================================
    // 4. ANÁLISIS DE SCRIPTS JAVASCRIPT
    // ========================================
    console.log('💻 4️⃣  ANÁLISIS DE SCRIPTS JAVASCRIPT\n');

    const scriptData = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        const results = {
            googleMapsAPI: false,
            inlineScriptsWithCoords: [],
            variablesWithLocation: []
        };

        scripts.forEach((script, index) => {
            const src = script.src;
            const content = script.textContent;

            // Detectar Google Maps API
            if (src && src.includes('maps.googleapis.com')) {
                results.googleMapsAPI = true;
            }

            // Buscar coordenadas en scripts inline
            if (!src && content) {
                const latLngPattern = /(?:lat|latitude)[\s:=]+([0-9.-]+)[\s,;]+(?:lng|longitude)[\s:=]+([0-9.-]+)/gi;
                const matches = content.match(latLngPattern);

                if (matches) {
                    results.inlineScriptsWithCoords.push({
                        index,
                        matches: matches.slice(0, 3),
                        snippet: content.substring(0, 200)
                    });
                }

                // Buscar variables con nombres de ubicación
                const locationVars = [
                    /(?:var|let|const)\s+(location|address|coordinates|position|place)[^;]{0,100}/gi,
                    /(?:location|address|coordinates)[\s]*[:=][\s]*[{"\[]/gi
                ];

                locationVars.forEach(pattern => {
                    const varMatches = content.match(pattern);
                    if (varMatches) {
                        varMatches.slice(0, 3).forEach(m => {
                            results.variablesWithLocation.push(m.substring(0, 80));
                        });
                    }
                });
            }
        });

        return results;
    });

    console.log(`🔹 Google Maps API cargado: ${scriptData.googleMapsAPI ? '✅' : '❌'}`);
    console.log(`🔹 Scripts inline con coordenadas: ${scriptData.inlineScriptsWithCoords.length}\n`);

    scriptData.inlineScriptsWithCoords.slice(0, 3).forEach((script, i) => {
        console.log(`   Script ${i + 1}:`);
        console.log(`   - Coincidencias: ${script.matches.length}`);
        script.matches.forEach(m => console.log(`     * ${m}`));
        console.log('');
    });

    console.log(`🔹 Variables de ubicación encontradas: ${scriptData.variablesWithLocation.length}\n`);
    [...new Set(scriptData.variablesWithLocation)].slice(0, 5).forEach((v, i) => {
        console.log(`   ${i + 1}. ${v}`);
    });

    console.log('\n' + '═'.repeat(80) + '\n');

    // ========================================
    // 5. PETICIONES DE RED
    // ========================================
    console.log('🌐 5️⃣  PETICIONES DE RED (MAPS/GEOCODING)\n');

    console.log(`🔹 Peticiones interceptadas relacionadas con ubicación: ${networkRequests.length}\n`);

    [...new Set(networkRequests.map(r => r.url))].slice(0, 10).forEach((url, i) => {
        console.log(`   ${i + 1}. ${url}`);
    });

    console.log('\n' + '═'.repeat(80) + '\n');

    // ========================================
    // 6. ANÁLISIS DE WINDOW VARIABLES
    // ========================================
    console.log('🪟 6️⃣  VARIABLES GLOBALES (window)\n');

    const windowVars = await page.evaluate(() => {
        const results = {
            hasGoogleMaps: typeof google !== 'undefined' && typeof google.maps !== 'undefined',
            locationVars: []
        };

        // Buscar variables globales relacionadas con ubicación
        const locationKeys = [
            'location', 'address', 'coordinates', 'latitude', 'longitude',
            'propertyLocation', 'propertyAddress', 'mapCenter', 'mapConfig'
        ];

        locationKeys.forEach(key => {
            if (window[key] !== undefined) {
                try {
                    const value = JSON.stringify(window[key]).substring(0, 100);
                    results.locationVars.push({ key, value });
                } catch (e) {
                    results.locationVars.push({ key, value: '[object]' });
                }
            }
        });

        // Buscar en __NEXT_DATA__ (si usan Next.js)
        if (window.__NEXT_DATA__) {
            results.hasNextData = true;
            try {
                const str = JSON.stringify(window.__NEXT_DATA__);
                results.hasLocationInNextData = str.includes('location') || str.includes('address');
            } catch (e) {}
        }

        return results;
    });

    console.log(`🔹 Google Maps disponible en window: ${windowVars.hasGoogleMaps ? '✅' : '❌'}`);
    console.log(`🔹 __NEXT_DATA__ encontrado: ${windowVars.hasNextData ? '✅' : '❌'}`);
    if (windowVars.hasLocationInNextData) {
        console.log(`   - Contiene datos de ubicación: ✅`);
    }

    console.log(`\n🔹 Variables globales de ubicación: ${windowVars.locationVars.length}\n`);
    windowVars.locationVars.forEach((v, i) => {
        console.log(`   ${i + 1}. window.${v.key} = ${v.value}`);
    });

    console.log('\n' + '═'.repeat(80) + '\n');

    // ========================================
    // 7. EXTRAER COORDENADAS FINALES
    // ========================================
    console.log('🎯 7️⃣  COORDENADAS FINALES DETECTADAS\n');

    const finalCoords = {
        jsonLd: jsonLdData.find(d => d.geo)?.geo || null,
        iframe: mapData.find(m => m.coordinates)?.coordinates || null,
        meta: addressData.metaTags.find(m => m.name?.includes('geo'))?.content || null
    };

    console.log('🔹 Fuentes de coordenadas:\n');
    console.log(`   JSON-LD geo: ${finalCoords.jsonLd ? `✅ (${finalCoords.jsonLd.latitude}, ${finalCoords.jsonLd.longitude})` : '❌'}`);
    console.log(`   Iframe maps: ${finalCoords.iframe ? `✅ (${finalCoords.iframe.lat}, ${finalCoords.iframe.lng})` : '❌'}`);
    console.log(`   Meta tags: ${finalCoords.meta ? `✅ (${finalCoords.meta})` : '❌'}`);

    // Determinar coordenadas "oficiales"
    let officialCoords = finalCoords.jsonLd || finalCoords.iframe || null;
    if (officialCoords) {
        const lat = officialCoords.latitude || officialCoords.lat;
        const lng = officialCoords.longitude || officialCoords.lng;
        console.log(`\n✅ Coordenadas oficiales: ${lat}, ${lng}`);
    } else {
        console.log(`\n❌ No se encontraron coordenadas`);
    }

    console.log('\n' + '═'.repeat(80) + '\n');

    // ========================================
    // GUARDAR REPORTE
    // ========================================
    const report = {
        timestamp: new Date().toISOString(),
        url,
        addressData,
        jsonLdData,
        mapData,
        scriptData,
        networkRequests: networkRequests.slice(0, 20),
        windowVars,
        finalCoords
    };

    fs.writeFileSync(
        '/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/inmuebles24-location-analysis.json',
        JSON.stringify(report, null, 2)
    );

    console.log('📊 REPORTE COMPLETO\n');
    console.log('✅ Análisis guardado en: inmuebles24-location-analysis.json\n');
    console.log('⏸️  Navegador abierto para inspección manual (30 segundos)...\n');

    await new Promise(resolve => setTimeout(resolve, 30000));

    await browser.close();

    console.log('✅ Análisis completado.\n');

})().catch(e => console.error('❌ Error fatal:', e.message));
