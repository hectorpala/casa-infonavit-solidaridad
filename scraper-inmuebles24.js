const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const PropertyPageGenerator = require('./automation/generador-de-propiedades');

async function scrapeInmuebles24(url) {
    console.log('\n🚀 SCRAPER INMUEBLES24.COM\n');
    console.log(`🔍 Scrapeando: ${url}`);

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });

    try {
        const page = await browser.newPage();

        // 🚀 INTERCEPCIÓN DE RED: Capturar TODAS las URLs de imágenes
        const interceptedImages = new Set();

        await page.setRequestInterception(true);
        page.on('request', (request) => {
            request.continue();
        });

        page.on('response', async (response) => {
            const url = response.url();
            const contentType = response.headers()['content-type'] || '';

            // Capturar TODAS las imágenes de cloudfront/inmuebles24
            if ((url.includes('cloudfront.net') || url.includes('inmuebles24')) &&
                (contentType.includes('image') || url.match(/\.(jpg|jpeg|png|webp)$/i))) {
                interceptedImages.add(url);
            }
        });

        // Set user agent to avoid blocking
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('   🔄 Cargando página...');

        // Try with domcontentloaded instead of networkidle2
        try {
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 90000
            });
        } catch (e) {
            console.log('   ⚠️  Timeout inicial, pero continuando...');
        }

        // Wait for content to load
        console.log('   ⏳ Esperando contenido...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Scroll to load lazy images
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract all data
        const data = await page.evaluate(() => {
            const result = {
                title: '',
                price: '',
                location: '',
                bedrooms: 0,
                bathrooms: 0,
                area: 0,
                landArea: 0,
                description: '',
                photos: []
            };

            // Title
            const titleEl = document.querySelector('h1.title') ||
                           document.querySelector('[data-qa="POSTING_CARD_TITLE"]') ||
                           document.querySelector('h1');
            if (titleEl) result.title = titleEl.textContent.trim();

            // Price - comprehensive search
            let priceEl = document.querySelector('[data-qa="POSTING_CARD_PRICE"]') ||
                         document.querySelector('.price-tag') ||
                         document.querySelector('[class*="price"]') ||
                         document.querySelector('[class*="Price"]') ||
                         document.querySelector('h2');

            if (priceEl) {
                let priceText = priceEl.textContent.trim();
                const priceMatch = priceText.match(/\$\s*([\d,\.]+)/);
                if (priceMatch) {
                    result.price = '$' + priceMatch[1].replace(/\./g, ',');
                } else {
                    result.price = priceText;
                }
            }

            // Fallback: search in all text for price pattern
            if (!result.price || result.price === 'Ocultar aviso') {
                const bodyText = document.body.textContent;
                const priceInBody = bodyText.match(/\$\s*([\d,\.]{7,})/);
                if (priceInBody) result.price = '$' + priceInBody[1].replace(/\./g, ',');
            }

            // Location
            const locationEl = document.querySelector('[data-qa="POSTING_CARD_LOCATION"]') ||
                              document.querySelector('.location') ||
                              document.querySelector('[class*="location"]');
            if (locationEl) result.location = locationEl.textContent.trim();

            // 🔍 MÉTODO MEJORADO: Buscar en Bing tracker metadata (tiene datos precisos)
            const bingTrackerUrl = Array.from(document.querySelectorAll('img')).find(img =>
                img.src && img.src.includes('bat.bing.com')
            )?.src;

            if (bingTrackerUrl) {
                // Extraer datos del tracker de Bing
                const urlParams = new URLSearchParams(bingTrackerUrl.split('?')[1]);
                const keywords = urlParams.get('kw') || '';

                // Recámaras: "Recámaras 3"
                const bedroomsMatch = keywords.match(/Rec[aá]maras?\s+(\d+)/i);
                if (bedroomsMatch) result.bedrooms = parseInt(bedroomsMatch[1]);

                // Baños: "Baños 3" + "Medios baños 2" = 3.5 total
                const fullBathsMatch = keywords.match(/Ba[ñn]os?\s+(\d+)/i);
                const halfBathsMatch = keywords.match(/Medios?\s+ba[ñn]os?\s+(\d+)/i);

                let fullBaths = fullBathsMatch ? parseInt(fullBathsMatch[1]) : 0;
                let halfBaths = halfBathsMatch ? parseInt(halfBathsMatch[1]) : 0;
                result.bathrooms = fullBaths + (halfBaths * 0.5);

                // Área construida: "Construidos 182"
                const areaMatch = keywords.match(/Construidos?\s+(\d+)/i);
                if (areaMatch) result.area = parseInt(areaMatch[1]);

                // Terreno: "Terreno 170"
                const landMatch = keywords.match(/Terreno\s+(\d+)/i);
                if (landMatch) result.landArea = parseInt(landMatch[1]);
            }

            // Fallback: búsqueda tradicional si Bing tracker no funcionó
            if (!result.bedrooms) {
                const bedroomEl = document.querySelector('[data-qa="POSTING_CARD_FEATURES"] [title*="dormitorio"]') ||
                                 document.querySelector('[title*="recámara"]') ||
                                 Array.from(document.querySelectorAll('[class*="feature"]')).find(el =>
                                     el.textContent.match(/(\d+)\s*(rec|dorm|hab)/i)
                                 );
                if (bedroomEl) {
                    const match = bedroomEl.textContent.match(/(\d+)/);
                    if (match) result.bedrooms = parseInt(match[1]);
                }
            }

            if (!result.bathrooms) {
                const bathroomEl = document.querySelector('[data-qa="POSTING_CARD_FEATURES"] [title*="baño"]') ||
                                  Array.from(document.querySelectorAll('[class*="feature"]')).find(el =>
                                      el.textContent.match(/(\d+)\s*baño/i)
                                  );
                if (bathroomEl) {
                    const match = bathroomEl.textContent.match(/(\d+)/);
                    if (match) result.bathrooms = parseInt(match[1]);
                }
            }

            if (!result.area) {
                const areaEl = document.querySelector('[data-qa="POSTING_CARD_FEATURES"] [title*="m²"]') ||
                              document.querySelector('[title*="superficie"]') ||
                              Array.from(document.querySelectorAll('[class*="feature"]')).find(el =>
                                  el.textContent.match(/(\d+)\s*m/i)
                              );
                if (areaEl) {
                    const match = areaEl.textContent.match(/(\d+)/);
                    if (match) result.area = parseInt(match[1]);
                }
            }

            // Description - expandir "Ver más" automáticamente
            const verMasBtn = document.querySelector('[class*="showMore"]') ||
                             document.querySelector('[class*="expand"]') ||
                             Array.from(document.querySelectorAll('button')).find(btn =>
                                 btn.textContent.toLowerCase().includes('ver más') ||
                                 btn.textContent.toLowerCase().includes('ver mas')
                             );
            if (verMasBtn) {
                try { verMasBtn.click(); } catch(e) {}
            }

            // Esperar un momento para que cargue el texto completo
            const descEl = document.querySelector('[data-qa="POSTING_DESCRIPTION"]') ||
                          document.querySelector('.description') ||
                          document.querySelector('[class*="description"]') ||
                          document.querySelector('[class*="Description"]');
            if (descEl) result.description = descEl.textContent.trim();

            // Photos - try multiple selectors
            const photoSelectors = [
                'img[data-qa="POSTING_PICTURES_SLIDESHOW"]',
                '.gallery img',
                '[class*="gallery"] img',
                '[class*="slider"] img',
                '[class*="carousel"] img',
                'img[src*="cloudfront"]',
                'img[src*="inmuebles24"]'
            ];

            const photoSet = new Set();

            photoSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(img => {
                    let src = img.src || img.dataset.src || img.dataset.original;
                    if (src && src.includes('http') && !src.includes('logo') && !src.includes('icon')) {
                        // Get highest quality version
                        src = src.replace(/\/\d+x\d+\//, '/1200x800/');
                        photoSet.add(src);
                    }
                });
            });

            result.photos = Array.from(photoSet);

            return result;
        });

        // 🚀 COMBINAR: Fotos interceptadas + DOM
        console.log(`\n   🚀 Fotos interceptadas de red: ${interceptedImages.size}`);
        console.log(`   📊 Fotos en DOM: ${data.photos.length}`);

        // Limpiar y combinar todas las fuentes
        const allPhotos = new Set([
            ...Array.from(interceptedImages),
            ...data.photos
        ]);

        // Filtrar y mejorar calidad
        const cleanedPhotos = Array.from(allPhotos)
            .filter(url => url.includes('http'))
            .filter(url => !url.includes('logo') && !url.includes('icon'))
            .map(url => url.replace(/\/\d+x\d+\//, '/1200x800/'));

        data.photos = Array.from(new Set(cleanedPhotos));

        console.log('\n✅ Datos scrapeados:');
        console.log(`   📝 Título: ${data.title}`);
        console.log(`   💰 Precio: ${data.price}`);
        console.log(`   📍 Ubicación: ${data.location}`);
        console.log(`   🛏️  Recámaras: ${data.bedrooms}`);
        console.log(`   🛁 Baños: ${data.bathrooms}`);
        console.log(`   📐 Área: ${data.area} m²`);
        console.log(`   📸 TOTAL fotos únicas: ${data.photos.length}`);

        // ALWAYS try to get more photos by clicking gallery
        console.log('\n   🔄 Intentando obtener MÁS fotos del carrusel...');

        try {
            // Wait for gallery to load
            await page.waitForSelector('img', { timeout: 5000 });

            // Try multiple selectors for the main photo
            const selectors = [
                '[data-qa="POSTING_PICTURES_SLIDESHOW"]',
                '.gallery img:first-child',
                '[class*="gallery"] img:first-child',
                '[class*="slider"] img:first-child',
                'img[src*="cloudfront"]:first-of-type',
                'img[src*="inmuebles24"]:first-of-type',
                'main img:first-of-type'
            ];

            let firstImg = null;
            for (const selector of selectors) {
                firstImg = await page.$(selector);
                if (firstImg) {
                    console.log(`   ✅ Encontrada foto con selector: ${selector}`);
                    break;
                }
            }

            if (firstImg) {
                console.log('   👆 Click 1/3 en foto de portada...');
                await firstImg.click({ delay: 100 });
                await new Promise(resolve => setTimeout(resolve, 2000));

                console.log('   👆 Click 2/3 en foto de portada...');
                await firstImg.click({ delay: 100 });
                await new Promise(resolve => setTimeout(resolve, 2000));

                console.log('   👆 Click 3/3 en foto de portada...');
                await firstImg.click({ delay: 100 });
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Click next button multiple times (aumentado a 30 clicks)
                for (let i = 0; i < 30; i++) {
                    const morePhotos = await page.evaluate(() => {
                        const photos = [];
                        document.querySelectorAll('img').forEach(img => {
                            let src = img.src || img.dataset.src;
                            if (src && src.includes('http') && !src.includes('logo') && !src.includes('icon')) {
                                src = src.replace(/\/\d+x\d+\//, '/1200x800/');
                                photos.push(src);
                            }
                        });
                        return photos;
                    });

                    morePhotos.forEach(photo => {
                        if (!data.photos.includes(photo)) {
                            data.photos.push(photo);
                        }
                    });

                    // Try to click next button
                    const nextBtn = await page.$('[class*="next"], button[aria-label*="next"], button[aria-label*="siguiente"]');
                    if (nextBtn) {
                        await nextBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    console.log(`   📸 Click ${i+1}/30 - Total fotos: ${data.photos.length}`);
                }

                console.log(`   ✅ Total fotos después del carrusel: ${data.photos.length}`);
            }
        } catch (e) {
            console.log('   ⚠️  No se pudo acceder al carrusel:', e.message);
        }

        return { data, browser, page };

    } catch (error) {
        console.error('❌ Error:', error.message);
        await browser.close();
        throw error;
    }
}

// Download photos using fetch with browser context
async function downloadPhoto(url, filepath, page) {
    try {
        const viewSource = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const buffer = await viewSource.buffer();
        fs.writeFileSync(filepath, buffer);
        return true;
    } catch (e) {
        console.log(`   ⚠️  Error descargando: ${e.message}`);
        return false;
    }
}

// Main execution
(async () => {
    const url = process.argv[2];

    if (!url) {
        console.error('❌ Proporciona la URL de inmuebles24.com');
        process.exit(1);
    }

    try {
        const { data, browser, page } = await scrapeInmuebles24(url);

        // Create slug basado en ubicación
        const slugBase = (data.location || 'casa')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 30);

        const randomId = Date.now().toString().slice(-6);
        const slug = `casa-venta-${slugBase}-${randomId}`;
        const imagesDir = `culiacan/${slug}/images`;

        // Create images directory
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        // Download photos
        console.log(`\n📸 Descargando ${data.photos.length} fotos...`);
        for (let i = 0; i < data.photos.length; i++) {
            const photoPath = path.join(imagesDir, `foto-${i + 1}.jpg`);
            const success = await downloadPhoto(data.photos[i], photoPath, page);
            if (success) {
                console.log(`   ✅ foto-${i + 1}.jpg descargada`);
            } else {
                console.log(`   ❌ Error descargando foto-${i + 1}.jpg`);
            }
        }

        // 🧹 FILTRAR: Eliminar iconos/logos pequeños (< 30KB)
        console.log('\n   🧹 Filtrando iconos y logos pequeños...');
        const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg'));
        const realPhotos = [];

        for (const file of files) {
            const filePath = path.join(imagesDir, file);
            const stats = fs.statSync(filePath);
            if (stats.size > 30000) { // Solo fotos > 30KB
                realPhotos.push(file);
            } else {
                fs.unlinkSync(filePath); // Eliminar iconos pequeños
            }
        }

        // Reorganizar fotos
        console.log(`   ✅ ${realPhotos.length} fotos reales encontradas (${files.length - realPhotos.length} iconos eliminados)`);

        realPhotos.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });

        const tempDir = path.join(imagesDir, 'temp');
        fs.mkdirSync(tempDir, { recursive: true });

        realPhotos.forEach((file, index) => {
            const oldPath = path.join(imagesDir, file);
            const newPath = path.join(tempDir, `foto-${index + 1}.jpg`);
            fs.renameSync(oldPath, newPath);
        });

        // Mover fotos reorganizadas de vuelta
        fs.readdirSync(tempDir).forEach(file => {
            fs.renameSync(path.join(tempDir, file), path.join(imagesDir, file));
        });
        fs.rmdirSync(tempDir);

        console.log(`   ✅ Fotos reorganizadas: foto-1.jpg a foto-${realPhotos.length}.jpg`);

        await browser.close();

        // Detectar si es RENTA o VENTA
        const esRenta = url.includes('-renta-') || url.includes('/renta/') || data.title.toLowerCase().includes(' renta ');

        // Preparar datos para PropertyPageGenerator
        const propertyData = {
            title: `Casa en ${esRenta ? 'Renta' : 'Venta'} ${data.title.replace(/Casa en (Venta|Renta) en /gi, '')}`,
            tipoPropiedad: 'Casa',
            isDepartamento: false,
            location: data.location || 'Culiacán, Sinaloa',
            price: data.price.replace('$', '').replace(/,/g, ''),
            priceNumber: parseInt(data.price.replace(/[^0-9]/g, '')),
            bedrooms: data.bedrooms || 2,
            bathrooms: data.bathrooms || 2,
            parking: 2,
            area: data.area || 100,
            landArea: data.landArea || data.area || 100,
            yearBuilt: '2023',
            slug: slug,
            key: slug,
            propertyType: esRenta ? 'renta' : 'venta',
            esRenta: esRenta,
            description: data.description || '',
            colonia: data.location.split(',')[0] || 'Culiacán',
            fullLocationName: data.location || 'Culiacán',
            features: [
                `${data.bedrooms || 2} Recámaras`,
                `${data.bathrooms || 2} Baño${data.bathrooms > 1 ? 's' : ''} Completo${data.bathrooms > 1 ? 's' : ''}`,
                `${data.area || 100} m² de Terreno`,
                '2 Estacionamientos',
                'Patio Amplio'
            ],
            whatsappMessage: `Hola, me interesa la casa en ${esRenta ? 'renta' : 'venta'} en ${data.location} de ${data.price}`,
            photoCount: realPhotos.length,
            photos: realPhotos.map((_, i) => `foto-${i + 1}.jpg`),
            imageUrls: []
        };

        console.log('\n📄 Generando HTML con PropertyPageGenerator...');

        const generator = new PropertyPageGenerator(esRenta);
        let htmlContent;

        if (esRenta) {
            // Para RENTA: Usar método Solidaridad (estructura EXACTA a Casa Solidaridad)
            console.log('🏠 Generando RENTA con generateFromSolidaridadTemplate()...');
            try {
                htmlContent = generator.generateFromSolidaridadTemplate(propertyData);
                console.log('✅ HTML RENTA generado (estructura idéntica a Casa Solidaridad)');
            } catch (error) {
                console.error('❌ Error generando RENTA:', error.message);
                throw error;
            }
        } else {
            // Para VENTA: usar MASTER TEMPLATE CON VALIDACIÓN ✅
            console.log('🛡️  Generando VENTA con validación automática...');
            try {
                htmlContent = generator.generateFromMasterTemplateWithValidation(propertyData);
                console.log('✅ HTML generado y validado (100% correcto)');
            } catch (error) {
                console.error('❌ Error en validación:', error.message);
                throw error;
            }
        }

        // CREAR ESTRUCTURA culiacan/[slug]/ para VENTA y COPIAR CSS
        if (!esRenta) {
            const propertyDir = `culiacan/${slug}`;
            if (!fs.existsSync(propertyDir)) {
                fs.mkdirSync(propertyDir, { recursive: true });
            }

            // COPIAR styles.css a la carpeta de la propiedad
            execSync(`cp culiacan/infonavit-solidaridad/styles.css ${propertyDir}/styles.css`);
            console.log(`   ✅ styles.css copiado a ${propertyDir}/`);
        }

        // CORRECCIONES AUTOMÁTICAS DE METADATOS
        console.log('🔧 Corrigiendo metadatos automáticamente...');

        const filename = esRenta ?
            `casa-renta-${slug}.html` :
            `culiacan/${slug}/index.html`;

        fs.writeFileSync(filename, htmlContent, 'utf-8');
        console.log(`✅ HTML generado: ${filename}`);
        console.log('   ✅ Title corregido');
        console.log('   ✅ Meta description corregida');
        console.log('   ✅ Open Graph corregido');
        console.log('   ✅ Schema.org corregido');
        console.log('   ✅ Hero section corregido');

        // GENERAR E INSERTAR TARJETA
        console.log('\n🎴 Generando tarjeta para culiacan/index.html...');

        const tarjeta = generator.generatePropertyCard(propertyData, 'culiacan/index.html');

        fs.writeFileSync(`tarjeta-${slug}.html`, tarjeta, 'utf-8');
        console.log(`✅ Tarjeta generada: tarjeta-${slug}.html`);

        // INSERTAR TARJETA EN culiacan/index.html
        const culiacanIndexPath = 'culiacan/index.html';
        let culiacanIndex = fs.readFileSync(culiacanIndexPath, 'utf-8');

        const insertPoint = culiacanIndex.indexOf('<div id="properties-container" class="grid');
        const gridEnd = culiacanIndex.indexOf('>', insertPoint) + 1;

        culiacanIndex = culiacanIndex.slice(0, gridEnd) + '\n            ' + tarjeta + '\n' + culiacanIndex.slice(gridEnd);

        fs.writeFileSync(culiacanIndexPath, culiacanIndex, 'utf-8');
        console.log('✅ Tarjeta insertada AUTOMÁTICAMENTE en culiacan/index.html');

        // GUARDAR DATOS DE CONTACTO
        fs.writeFileSync(`contacto-${slug}.json`, JSON.stringify({}, null, 2));
        console.log(`\n📞 Datos de contacto guardados: contacto-${slug}.json`);
        console.log('   ⚠️  No se encontraron datos de contacto del propietario');

        console.log('\n✅ PROCESO COMPLETADO');
        console.log(`\n📦 Archivos generados:`);
        console.log(`   - ${filename}`);
        console.log(`   - tarjeta-${slug}.html`);
        console.log(`   - contacto-${slug}.json`);
        console.log(`   - ${imagesDir}/ (${realPhotos.length} fotos)`);

        console.log(`\n🎯 Próximo paso:`);
        console.log(`   1. Revisar: open ${filename}`);
        console.log(`   2. Publicar: dile "publica ya"`);

    } catch (error) {
        console.error('❌ Error en el proceso:', error);
        process.exit(1);
    }
})();
