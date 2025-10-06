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
            // Buscar botones con texto relacionado a fotos
            const buttons = await page.$$('button, a, div[role="button"]');
            let foundPhotoButton = false;

            for (const button of buttons) {
                const text = await page.evaluate(el => el.innerText, button).catch(() => '');
                if (text.includes('Ver todas') || text.includes('ver todas') ||
                    text.includes('Ver más fotos') || text.includes('todas las fotos')) {
                    console.log(`   🖱️  Click en: "${text}"`);
                    await button.click();
                    foundPhotoButton = true;
                    await new Promise(resolve => setTimeout(resolve, 4000));
                    break;
                }
            }

            if (!foundPhotoButton) {
                console.log('   📜 Haciendo scroll para lazy-load de imágenes...');
                // Scroll down y up para activar lazy loading
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await new Promise(resolve => setTimeout(resolve, 2000));
                await page.evaluate(() => window.scrollTo(0, 0));
                await new Promise(resolve => setTimeout(resolve, 2000));
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

            // Área construida
            const areaMatch = allText.match(/Área\s+construida\s*(\d+)\s*m/i);
            if (areaMatch) data.area_construida = areaMatch[1];

            // Terreno
            const terrenoMatch = allText.match(/Tamaño\s+del\s+terreno\s*(\d+)\s*m/i);
            if (terrenoMatch) data.area_terreno = terrenoMatch[1];

            // Descripción
            const descMatch = allText.match(/Descripción\s*([^\n]+(?:\n(?!Características|Superficie|Ver más)[^\n]+)*)/i);
            if (descMatch) {
                data.description = descMatch[1].trim().replace(/Ver más/g, '');
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

            return data;
        });

        console.log('✅ DATOS EXTRAÍDOS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📌 Título:', datos.title || '❌');
        console.log('💰 Precio: $' + (datos.price || '❌'));
        console.log('📍 Ubicación:', datos.location || '❌');
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
