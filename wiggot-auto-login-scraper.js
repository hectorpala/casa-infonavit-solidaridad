const puppeteer = require('puppeteer');
const fs = require('fs');

// Credenciales desde wiggot-credentials.txt
const WIGGOT_EMAIL = 'hector.test.1759769906975@gmail.com';
const WIGGOT_PASSWORD = 'Wiggot2025!drm36';

async function scrapeWithAutoLogin(propertyId) {
    console.log('🚀 WIGGOT AUTO-LOGIN SCRAPER');
    console.log(`📌 Property ID: ${propertyId}\n`);

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    try {
        // BLOQUE 1: Ir a login
        console.log('🔐 BLOQUE 1/6: Iniciando sesión...');
        await page.goto('https://new.wiggot.com/login', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Buscar campo email con múltiples selectores
        let emailInput = await page.$('input[type="email"]') ||
                        await page.$('input[name="email"]') ||
                        await page.$('input[placeholder*="correo"]') ||
                        await page.$('input[placeholder*="Correo"]');

        if (!emailInput) {
            console.log('⚠️  No se encontró campo de email, esperando 10 seg más...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            emailInput = await page.$('input[type="email"]') ||
                        await page.$('input[name="email"]') ||
                        await page.$('input');
        }

        await emailInput.type(WIGGOT_EMAIL, { delay: 100 });
        console.log('✅ Email ingresado');

        // Buscar campo password
        await new Promise(resolve => setTimeout(resolve, 1000));
        const passwordInput = await page.$('input[type="password"]') ||
                             await page.$('input[name="password"]');
        await passwordInput.type(WIGGOT_PASSWORD, { delay: 100 });
        console.log('✅ Password ingresado');

        // Click en botón de login
        await new Promise(resolve => setTimeout(resolve, 1000));
        const submitBtn = await page.$('button[type="submit"]') ||
                         await page.$('button:contains("Iniciar")');
        await submitBtn.click();
        console.log('🔄 Enviando login...');

        // Esperar navegación después del login
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        console.log('✅ Login exitoso\n');

        // Guardar cookies para futuro uso
        const cookies = await page.cookies();
        fs.writeFileSync('./wiggot-cookies.json', JSON.stringify(cookies, null, 2));

        // BLOQUE 2: Navegar a la propiedad
        console.log('🌐 BLOQUE 2/6: Navegando a la propiedad...');
        const url = `https://new.wiggot.com/search/property-detail/${propertyId}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('✅ Propiedad cargada\n');

        // BLOQUE 3: Screenshot y HTML
        console.log('📸 BLOQUE 3/6: Guardando snapshot...');
        await page.screenshot({ path: `wiggot-property-${propertyId}.png`, fullPage: true });
        const html = await page.content();
        fs.writeFileSync(`wiggot-property-${propertyId}.html`, html);
        console.log('✅ Screenshot y HTML guardados\n');

        // BLOQUE 4: Extraer datos
        console.log('📊 BLOQUE 4/6: Extrayendo datos...');

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
                images: []
            };

            // Título - buscar "Casa en venta en..."
            const titleMatch = allText.match(/Casa\s+en\s+venta\s+en\s+([^\n]+)/i);
            if (titleMatch) data.title = 'Casa en Venta ' + titleMatch[1].trim();

            // Precio
            const priceMatch = allText.match(/Venta\s*\$([0-9,]+)/);
            if (priceMatch) data.price = priceMatch[1];

            // Ubicación - buscar dirección completa
            const locationMatch = allText.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+\d+[^,]*),\s*([^,]+),\s*Culiacán/);
            if (locationMatch) {
                data.location = `${locationMatch[1]}, ${locationMatch[2]}, Culiacán, Sinaloa`;
            }

            // Recámaras
            const bedroomsMatch = allText.match(/Recámaras?\s*(\d+)/i);
            if (bedroomsMatch) data.bedrooms = bedroomsMatch[1];

            // Baños completos
            const bathsMatch = allText.match(/Baños?\s*(\d+)/i);
            if (bathsMatch) data.bathrooms = bathsMatch[1];

            // Medios baños
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

            // Tamaño del terreno
            const terrenoMatch = allText.match(/Tamaño\s+del\s+terreno\s*(\d+)\s*m/i);
            if (terrenoMatch) data.area_terreno = terrenoMatch[1];

            // Descripción
            const descMatch = allText.match(/Descripción\s*([^\n]+(?:\n(?!Características|Superficie)[^\n]+)*)/i);
            if (descMatch) {
                data.description = descMatch[1].trim().replace(/Ver más/g, '');
            }

            // Imágenes - buscar todas las de media.wiggot.mx
            const imgElements = document.querySelectorAll('img');
            imgElements.forEach(img => {
                if (img.src && img.src.includes('media.wiggot.mx')) {
                    let imgUrl = img.src;
                    // Convertir a versión grande (-l.jpg)
                    if (!imgUrl.includes('-l.jpg')) {
                        imgUrl = imgUrl.replace(/-[mst]\.jpg/g, '-l.jpg');
                    }
                    if (!data.images.includes(imgUrl)) {
                        data.images.push(imgUrl);
                    }
                }
            });

            return data;
        });

        console.log('✅ DATOS EXTRAÍDOS:');
        console.log('📌 Título:', datos.title || '❌ No encontrado');
        console.log('💰 Precio: $' + (datos.price || '❌ No encontrado'));
        console.log('📍 Ubicación:', datos.location || '❌ No encontrado');
        console.log('🛏️  Recámaras:', datos.bedrooms || '❌');
        console.log('🚿 Baños:', datos.bathrooms || '❌');
        console.log('🚗 Estacionamientos:', datos.estacionamientos || '❌');
        console.log('🏢 Niveles:', datos.niveles || '❌');
        console.log('📏 Área construida:', datos.area_construida ? `${datos.area_construida}m²` : '❌');
        console.log('📐 Área terreno:', datos.area_terreno ? `${datos.area_terreno}m²` : '❌');
        console.log('📸 Fotos:', datos.images.length);
        console.log('');

        // BLOQUE 5: Guardar JSON
        console.log('💾 BLOQUE 5/6: Guardando datos JSON...');
        const output = {
            propertyId,
            url,
            scrapedAt: new Date().toISOString(),
            data: datos
        };
        fs.writeFileSync(`wiggot-datos-${propertyId}.json`, JSON.stringify(output, null, 2));
        console.log(`✅ Guardado en: wiggot-datos-${propertyId}.json\n`);

        // BLOQUE 6: Mantener navegador abierto 20 segundos
        console.log('⏸️  BLOQUE 6/6: Navegador abierto 20 seg para inspección...');
        await new Promise(resolve => setTimeout(resolve, 20000));

        await browser.close();
        return datos;

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        await browser.close();
        throw error;
    }
}

// Ejecutar
const propertyId = process.argv[2] || 'pODipRm';
scrapeWithAutoLogin(propertyId)
    .then(() => {
        console.log('\n🎉 SCRAPING COMPLETADO CON ÉXITO');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 SCRAPING FALLÓ:', error.message);
        process.exit(1);
    });
