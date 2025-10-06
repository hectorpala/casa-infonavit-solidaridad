const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeWiggotProperty(propertyId) {
    console.log('🚀 INICIANDO SCRAPER AUTOMÁTICO DE WIGGOT');
    console.log(`📌 Property ID: ${propertyId}`);

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        // BLOQUE 1: Cargar cookies guardadas
        console.log('\n📦 BLOQUE 1/5: Cargando cookies de sesión...');
        const cookiesPath = './wiggot-cookies.json';
        if (fs.existsSync(cookiesPath)) {
            const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
            await page.setCookie(...cookies);
            console.log('✅ Cookies cargadas:', cookies.length);
        } else {
            console.log('⚠️  No hay cookies guardadas');
        }

        // BLOQUE 2: Navegar a la propiedad
        console.log('\n🌐 BLOQUE 2/5: Navegando a la propiedad...');
        const url = `https://new.wiggot.com/search/property-detail/${propertyId}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('✅ Página cargada');

        // Esperar 3 segundos para asegurar que todo cargue
        await new Promise(resolve => setTimeout(resolve, 3000));

        // BLOQUE 3: Verificar si estamos en login o en la propiedad
        console.log('\n🔍 BLOQUE 3/5: Verificando acceso...');
        const isLoginPage = await page.evaluate(() => {
            return document.body.innerText.includes('Iniciar sesión') ||
                   document.body.innerText.includes('Correo electrónico');
        });

        if (isLoginPage) {
            console.log('⚠️  Detectada página de login - Intentando login manual...');
            console.log('🔴 POR FAVOR INICIA SESIÓN MANUALMENTE EN LA VENTANA DEL NAVEGADOR');
            console.log('⏳ Esperando 60 segundos para que hagas login...');

            // Esperar 60 segundos para que el usuario haga login manualmente
            await new Promise(resolve => setTimeout(resolve, 60000));

            // Verificar si ya hicimos login
            const stillInLogin = await page.evaluate(() => {
                return document.body.innerText.includes('Iniciar sesión');
            });

            if (stillInLogin) {
                throw new Error('No se completó el login en 60 segundos');
            }

            console.log('✅ Login completado, continuando...');

            // Navegar de nuevo a la propiedad
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log('✅ Acceso verificado');

        // BLOQUE 4: Extraer datos de la propiedad
        console.log('\n📊 BLOQUE 4/5: Extrayendo datos...');

        const datos = await page.evaluate(() => {
            const data = {
                title: '',
                price: '',
                location: '',
                bedrooms: '',
                bathrooms: '',
                area_construida: '',
                area_terreno: '',
                description: '',
                images: []
            };

            // Título
            const titleEl = document.querySelector('h1') ||
                           document.querySelector('[class*="title"]') ||
                           document.querySelector('[class*="Title"]');
            if (titleEl) data.title = titleEl.innerText.trim();

            // Precio - buscar en el texto completo
            const priceMatch = document.body.innerText.match(/Venta\s*\$([0-9,]+)/);
            if (priceMatch) {
                data.price = priceMatch[1];
            }

            // Ubicación
            const locationEl = document.querySelector('[class*="address"]') ||
                              document.querySelector('[class*="location"]') ||
                              document.querySelector('[class*="Address"]');
            if (locationEl) data.location = locationEl.innerText.trim();

            // Características - buscar recámaras, baños, etc.
            const allText = document.body.innerText;

            const bedroomsMatch = allText.match(/Recámaras?\s*(\d+)/i);
            if (bedroomsMatch) data.bedrooms = bedroomsMatch[1];

            const bathsMatch = allText.match(/Baños?\s*(\d+)/i);
            if (bathsMatch) data.bathrooms = bathsMatch[1];

            const halfBathsMatch = allText.match(/Medios?\s+baños?\s*(\d+)/i);
            if (halfBathsMatch) {
                const halfBaths = parseFloat(halfBathsMatch[1]) * 0.5;
                data.bathrooms = (parseFloat(data.bathrooms || 0) + halfBaths).toString();
            }

            const areaMatch = allText.match(/Área\s+construida\s*(\d+)\s*m/i);
            if (areaMatch) data.area_construida = areaMatch[1];

            const terrenoMatch = allText.match(/Tamaño\s+del\s+terreno\s*(\d+)\s*m/i);
            if (terrenoMatch) data.area_terreno = terrenoMatch[1];

            // Descripción - buscar en el texto que contenga "Descripción"
            const descMatch = allText.match(/Descripción\s*([^]+?)(?=Características|Superficie|$)/i);
            if (descMatch) {
                data.description = descMatch[1].trim();
            }

            // Imágenes - buscar todas las imágenes de Wiggot media
            const imgElements = document.querySelectorAll('img');
            imgElements.forEach(img => {
                if (img.src && img.src.includes('media.wiggot.mx')) {
                    // Asegurar que sea la versión grande (-l.jpg)
                    let imgUrl = img.src;
                    if (!imgUrl.includes('-l.jpg')) {
                        imgUrl = imgUrl.replace(/-[mst]\.jpg/, '-l.jpg');
                    }
                    if (!data.images.includes(imgUrl)) {
                        data.images.push(imgUrl);
                    }
                }
            });

            return data;
        });

        console.log('\n✅ DATOS EXTRAÍDOS:');
        console.log('📌 Título:', datos.title || '❌ No encontrado');
        console.log('💰 Precio: $' + datos.price || '❌ No encontrado');
        console.log('📍 Ubicación:', datos.location || '❌ No encontrado');
        console.log('🛏️  Recámaras:', datos.bedrooms || '❌ No encontrado');
        console.log('🚿 Baños:', datos.bathrooms || '❌ No encontrado');
        console.log('📏 Área construida:', datos.area_construida ? `${datos.area_construida}m²` : '❌ No encontrado');
        console.log('📐 Área terreno:', datos.area_terreno ? `${datos.area_terreno}m²` : '❌ No encontrado');
        console.log('📸 Fotos encontradas:', datos.images.length);

        // BLOQUE 5: Guardar datos
        console.log('\n💾 BLOQUE 5/5: Guardando datos...');
        const outputPath = `./wiggot-datos-${propertyId}.json`;
        fs.writeFileSync(outputPath, JSON.stringify({
            propertyId,
            url,
            scrapedAt: new Date().toISOString(),
            data: datos
        }, null, 2));

        console.log('✅ Datos guardados en:', outputPath);

        // Guardar cookies actualizadas
        const cookies = await page.cookies();
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
        console.log('✅ Cookies actualizadas');

        await browser.close();

        return datos;

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        await browser.close();
        throw error;
    }
}

// Ejecutar
const propertyId = process.argv[2] || 'pODipRm';
scrapeWiggotProperty(propertyId)
    .then(() => {
        console.log('\n🎉 SCRAPING COMPLETADO CON ÉXITO');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 SCRAPING FALLÓ:', error.message);
        process.exit(1);
    });
