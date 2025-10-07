const puppeteer = require('puppeteer');
const fs = require('fs');

const WIGGOT_EMAIL = 'hector.test.1759769906975@gmail.com';
const WIGGOT_PASSWORD = 'Wiggot2025!drm36';

async function scrapeWiggot(propertyId) {
    console.log('🚀 WIGGOT SCRAPER CON AUTO-LOGIN\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    try {
        // PASO 1: IR A LA PROPIEDAD DIRECTAMENTE
        console.log('📍 PASO 1: Navegando a la propiedad...');
        const url = `https://new.wiggot.com/search/property-detail/${propertyId}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // PASO 2: VERIFICAR SI NECESITA LOGIN
        console.log('🔍 PASO 2: Verificando si necesita login...');
        const needsLogin = await page.evaluate(() => {
            return document.body.innerText.includes('Iniciar sesión') ||
                   document.body.innerText.includes('Iniciar sesion');
        });

        if (needsLogin) {
            console.log('🔐 PASO 3: Login requerido, buscando formulario...\n');

            // Esperar un poco más
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Buscar TODOS los inputs
            const inputs = await page.$$('input');
            console.log(`   Encontrados ${inputs.length} campos input`);

            if (inputs.length >= 2) {
                // El primer input suele ser email, el segundo password
                console.log('   ✍️  Escribiendo email en primer campo...');
                await inputs[0].click();
                await page.keyboard.type(WIGGOT_EMAIL, { delay: 50 });

                console.log('   ✍️  Escribiendo password en segundo campo...');
                await inputs[1].click();
                await page.keyboard.type(WIGGOT_PASSWORD, { delay: 50 });

                // Buscar botón de submit
                await new Promise(resolve => setTimeout(resolve, 1000));
                const buttons = await page.$$('button');
                console.log(`   Encontrados ${buttons.length} botones`);

                // Buscar el botón que dice "Iniciar"
                for (const button of buttons) {
                    const text = await page.evaluate(el => el.innerText, button);
                    if (text.includes('Iniciar')) {
                        console.log('   🖱️  Clickeando botón "Iniciar sesión"...');
                        await button.click();
                        break;
                    }
                }

                // Esperar navegación
                console.log('   ⏳ Esperando login...');
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
                console.log('   ✅ Login exitoso!\n');

                // Guardar cookies
                const cookies = await page.cookies();
                fs.writeFileSync('./wiggot-cookies.json', JSON.stringify(cookies, null, 2));

                // Ir de nuevo a la propiedad
                console.log('📍 PASO 4: Navegando nuevamente a la propiedad...');
                await page.goto(url, { waitUntil: 'networkidle2' });
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } else {
            console.log('✅ Ya estamos logueados!\n');
        }

        // PASO 5: CARGAR TODAS LAS FOTOS
        console.log('📸 PASO 5: Cargando TODAS las fotos...\n');

        try {
            // CRÍTICO: Buscar y clickear "Ver más fotos" para abrir galería completa
            console.log('   🔍 Buscando botón "Ver más fotos"...');

            // Esperar a que la página cargue completamente
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Estrategia MEJORADA: Buscar por múltiples variantes
            const photoButtonFound = await page.evaluate(() => {
                // Lista de textos posibles
                const searchTexts = [
                    'ver más fotos',
                    'ver mas fotos',
                    'ver más',
                    'ver mas',
                    'más fotos',
                    'mas fotos',
                    'ver todas',
                    'ver todas las fotos',
                    'galería',
                    'galeria',
                    'fotos'
                ];

                // Buscar TODOS los elementos clickeables
                const allElements = document.querySelectorAll('button, a, div[role="button"], span[onclick], div[onclick]');

                for (const element of allElements) {
                    const text = element.textContent.trim().toLowerCase();

                    // Si contiene alguna de las palabras clave
                    for (const searchText of searchTexts) {
                        if (text.includes(searchText) && text.length < 50) {
                            console.log('Found button with text:', text);
                            element.click();
                            return true;
                        }
                    }
                }

                // Fallback: Buscar usando TreeWalker
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let node;
                while (node = walker.nextNode()) {
                    const text = node.textContent.trim().toLowerCase();
                    for (const searchText of searchTexts) {
                        if (text.includes(searchText) && text.length < 50) {
                            let parent = node.parentElement;
                            while (parent && parent !== document.body) {
                                const tag = parent.tagName.toLowerCase();
                                if (tag === 'button' || tag === 'a' || parent.onclick ||
                                    parent.getAttribute('role') === 'button') {
                                    console.log('Found clickable parent with text:', text);
                                    parent.click();
                                    return true;
                                }
                                parent = parent.parentElement;
                            }
                        }
                    }
                }
                return false;
            });

            if (photoButtonFound) {
                console.log('   ✅ Click en "Ver más fotos" exitoso');
                await new Promise(resolve => setTimeout(resolve, 7000)); // Esperar que abra el modal

                // Scroll dentro del modal/galería para cargar lazy loading
                console.log('   📜 Scrolling en galería completa...');
                for (let i = 0; i < 15; i++) {
                    await page.evaluate(() => {
                        // Scroll en el modal si existe, sino en la página
                        const modal = document.querySelector('[role="dialog"], .modal, .lightbox');
                        if (modal) {
                            modal.scrollBy(0, 300);
                        } else {
                            window.scrollBy(0, 300);
                        }
                    });
                    await new Promise(resolve => setTimeout(resolve, 800));
                }
                await new Promise(resolve => setTimeout(resolve, 5000));

            } else {
                console.log('   ⚠️  Botón "Ver más fotos" no encontrado');
                console.log('   📜 Haciendo scroll normal...');
                for (let i = 0; i < 8; i++) {
                    await page.evaluate(() => window.scrollBy(0, 400));
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
                await page.evaluate(() => window.scrollTo(0, 0));
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (e) {
            console.log('   ⚠️  Error cargando fotos:', e.message);
        }

        // PASO 6: EXTRAER DATOS
        console.log('📊 PASO 6: Extrayendo datos...\n');

        // Guardar HTML y screenshot DESPUÉS de expandir
        await page.screenshot({ path: `wiggot-${propertyId}.png`, fullPage: true });
        const html = await page.content();
        fs.writeFileSync(`wiggot-${propertyId}.html`, html);

        const datos = await page.evaluate(() => {
            const allText = document.body.innerText;
            const data = {
                title: '',
                price: '',
                location: '',
                bedrooms: '',
                bathrooms: '',
                area_construida: '',
                area_terreno: '',
                estacionamientos: '',
                niveles: '',
                description: '',
                agente: '',  // Nombre del agente (uso interno)
                inmobiliaria: '',  // Nombre de la inmobiliaria (uso interno)
                images: []
            };

            // Título
            const titleMatch = allText.match(/Casa\s+en\s+venta\s+en\s+([^\n]+)/i);
            if (titleMatch) data.title = 'Casa en Venta ' + titleMatch[1].trim();

            // Precio - Múltiples estrategias
            let priceMatch = allText.match(/Venta\s*\$([0-9,]+)/);
            if (!priceMatch) priceMatch = allText.match(/\$([0-9,]+)\s*MXN/);
            if (!priceMatch) priceMatch = allText.match(/\$\s*([0-9,]+)/);
            if (priceMatch) data.price = priceMatch[1];

            // Ubicación
            const locationMatch = allText.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s.]+\d+[^,]*),\s*([^,]+),\s*Culiacán/);
            if (locationMatch) {
                data.location = `${locationMatch[1]}, ${locationMatch[2]}, Culiacán`;
            }

            // Recámaras
            const bedroomsMatch = allText.match(/Recámaras?\s*(\d+)/i);
            if (bedroomsMatch) data.bedrooms = bedroomsMatch[1];

            // Baños
            const bathsMatch = allText.match(/Baños?\s*(\d+)/i);
            if (bathsMatch) data.bathrooms = bathsMatch[1];

            const halfBathsMatch = allText.match(/Medios?\s+baños?\s*(\d+)/i);
            if (halfBathsMatch) {
                const total = parseFloat(data.bathrooms || 0) + parseFloat(halfBathsMatch[1]) * 0.5;
                data.bathrooms = total.toString();
            }

            // Estacionamientos
            const parkingMatch = allText.match(/Estacionamientos?\s*(\d+)/i);
            if (parkingMatch) data.estacionamientos = parkingMatch[1];

            // Niveles
            const nivelesMatch = allText.match(/Niveles?\s*(\d+)/i);
            if (nivelesMatch) data.niveles = nivelesMatch[1];

            // Área construida (acepta decimales)
            const areaMatch = allText.match(/Área\s+construida\s*(\d+(?:\.\d+)?)\s*m/i);
            if (areaMatch) data.area_construida = areaMatch[1];

            // Terreno
            const terrenoMatch = allText.match(/Tamaño\s+del\s+terreno\s*(\d+)\s*m/i);
            if (terrenoMatch) data.area_terreno = terrenoMatch[1];

            // Descripción - Captura TODO hasta "Ver más" o siguiente sección
            const descMatch = allText.match(/Descripción\s*([\s\S]+?)(?:Ver más|Detalles de operación|Características del inmueble|$)/i);
            if (descMatch) {
                data.description = descMatch[1]
                    .trim()
                    .replace(/\n+/g, ' ')  // Reemplaza múltiples saltos de línea con espacios
                    .replace(/\s+/g, ' ')   // Normaliza espacios múltiples
                    .replace(/Ver más/g, '')
                    .trim();
            }

            // Agente e Inmobiliaria (USO INTERNO - NO SE PUBLICA)
            const agenteMatch = allText.match(/Asesor\s+inmobiliario\s+de\s+([^\n]+)/i);
            if (agenteMatch) {
                data.inmobiliaria = agenteMatch[1].trim();
            }

            // Buscar nombre del agente - suele estar antes de "Asesor inmobiliario"
            const nombreAgenteMatch = allText.match(/([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*Asesor\s+inmobiliario/i);
            if (nombreAgenteMatch) {
                data.agente = nombreAgenteMatch[1].trim();
            }

            // Imágenes - buscar en TODOS los elementos que puedan contener URLs
            const imgElements = document.querySelectorAll('img, [style*="background-image"]');
            const imageUrls = new Set();

            imgElements.forEach(el => {
                // Imágenes en src
                if (el.src && el.src.includes('media.wiggot.mx')) {
                    let imgUrl = el.src.replace(/-[mst]\.jpg/g, '-l.jpg');
                    imageUrls.add(imgUrl);
                }

                // Imágenes en background-image
                if (el.style.backgroundImage) {
                    const match = el.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
                    if (match && match[1].includes('media.wiggot.mx')) {
                        let imgUrl = match[1].replace(/-[mst]\.jpg/g, '-l.jpg');
                        imageUrls.add(imgUrl);
                    }
                }
            });

            // También buscar en el HTML por si hay URLs en data attributes
            const allElements = document.querySelectorAll('[data-src], [data-image]');
            allElements.forEach(el => {
                const dataSrc = el.getAttribute('data-src') || el.getAttribute('data-image');
                if (dataSrc && dataSrc.includes('media.wiggot.mx')) {
                    let imgUrl = dataSrc.replace(/-[mst]\.jpg/g, '-l.jpg');
                    imageUrls.add(imgUrl);
                }
            });

            data.images = Array.from(imageUrls);

            // Coordenadas del mapa (lat/lng)
            // Buscar en iframes de Google Maps
            const mapIframe = document.querySelector('iframe[src*="google.com/maps"]');
            if (mapIframe) {
                const src = mapIframe.src;
                // Extraer coordenadas de URL de Google Maps
                const coordMatch = src.match(/!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/);
                if (coordMatch) {
                    data.latitude = coordMatch[2];
                    data.longitude = coordMatch[1];
                }
                // Otro formato: @lat,lng,zoom
                const coordMatch2 = src.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (coordMatch2) {
                    data.latitude = coordMatch2[1];
                    data.longitude = coordMatch2[2];
                }
                // Formato q= con coordenadas
                const coordMatch3 = src.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (coordMatch3) {
                    data.latitude = coordMatch3[1];
                    data.longitude = coordMatch3[2];
                }
            }

            // También buscar en links de Google Maps
            const mapLink = document.querySelector('a[href*="google.com/maps"]');
            if (mapLink && !data.latitude) {
                const href = mapLink.href;
                const coordMatch = href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (coordMatch) {
                    data.latitude = coordMatch[1];
                    data.longitude = coordMatch[2];
                }
                const coordMatch2 = href.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (coordMatch2) {
                    data.latitude = coordMatch2[1];
                    data.longitude = coordMatch2[2];
                }
            }

            // NUEVO: Extraer datos del JSON embebido en scripts
            // Los datos del agente están en el JSON dentro de <script> tags
            try {
                const scriptTags = document.querySelectorAll('script');
                scriptTags.forEach(script => {
                    const content = script.textContent || script.innerHTML;

                    // Buscar el JSON que contiene assignedUser
                    if (content.includes('assignedUser') && content.includes('"name"')) {
                        // Extraer nombre del agente
                        const nameMatch = content.match(/"assignedUser":\{[^}]*"name":"([^"]+)"/);
                        if (nameMatch && nameMatch[1] && !data.agente) {
                            data.agente = nameMatch[1];
                        }

                        // Extraer agencyId para determinar si es inmobiliaria
                        const agencyMatch = content.match(/"agencyId":(\d+|null)/);
                        if (agencyMatch) {
                            // Si agencyId es null o 0, es asesor independiente
                            const agencyId = agencyMatch[1];
                            if (!agencyId || agencyId === 'null') {
                                // Es asesor independiente
                                if (!data.inmobiliaria) {
                                    data.inmobiliaria = '';
                                }
                            }
                        }
                    }
                });
            } catch (e) {
                console.log('  ⚠️  Error extrayendo datos de script JSON:', e.message);
            }

            return data;
        });

        console.log('✅ DATOS EXTRAÍDOS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📌 Título:', datos.title || '❌');
        console.log('💰 Precio: $' + (datos.price || '❌'));
        console.log('📍 Ubicación:', datos.location || '❌');
        console.log('🗺️  Coordenadas:', datos.latitude && datos.longitude ? `${datos.latitude}, ${datos.longitude}` : '❌');
        console.log('🛏️  Recámaras:', datos.bedrooms || '❌');
        console.log('🚿 Baños:', datos.bathrooms || '❌');
        console.log('🚗 Estacionamientos:', datos.estacionamientos || '❌');
        console.log('🏢 Niveles:', datos.niveles || '❌');
        console.log('📏 Área construida:', datos.area_construida ? `${datos.area_construida}m²` : '❌');
        console.log('📐 Área terreno:', datos.area_terreno ? `${datos.area_terreno}m²` : '❌');
        console.log('📝 Descripción:', datos.description ? datos.description.substring(0, 80) + '...' : '❌');
        console.log('👤 Agente:', datos.agente || '❌', '(INTERNO - NO SE PUBLICA)');
        console.log('🏢 Inmobiliaria:', datos.inmobiliaria || '❌', '(INTERNO - NO SE PUBLICA)');
        console.log('📸 Fotos:', datos.images.length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Guardar JSON
        const output = {
            propertyId,
            url,
            scrapedAt: new Date().toISOString(),
            data: datos
        };
        fs.writeFileSync(`wiggot-datos-${propertyId}.json`, JSON.stringify(output, null, 2));
        console.log(`💾 Datos guardados en: wiggot-datos-${propertyId}.json`);

        console.log('\n⏸️  Navegador abierto 15 seg para inspección...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        await browser.close();
        return datos;

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.log('\n⏸️  Navegador permanecerá abierto 30 seg para debug...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        await browser.close();
        throw error;
    }
}

const propertyId = process.argv[2] || 'pODipRm';
scrapeWiggot(propertyId)
    .then(() => {
        console.log('\n🎉 ¡SCRAPING COMPLETADO CON ÉXITO!');
        process.exit(0);
    })
    .catch(() => {
        console.log('\n💥 Scraping falló');
        process.exit(1);
    });
