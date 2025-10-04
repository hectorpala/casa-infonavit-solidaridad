const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

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

            // Bedrooms
            const bedroomEl = document.querySelector('[data-qa="POSTING_CARD_FEATURES"] [title*="dormitorio"]') ||
                             document.querySelector('[title*="recámara"]') ||
                             Array.from(document.querySelectorAll('[class*="feature"]')).find(el =>
                                 el.textContent.match(/(\d+)\s*(rec|dorm|hab)/i)
                             );
            if (bedroomEl) {
                const match = bedroomEl.textContent.match(/(\d+)/);
                if (match) result.bedrooms = parseInt(match[1]);
            }

            // Bathrooms
            const bathroomEl = document.querySelector('[data-qa="POSTING_CARD_FEATURES"] [title*="baño"]') ||
                              Array.from(document.querySelectorAll('[class*="feature"]')).find(el =>
                                  el.textContent.match(/(\d+)\s*baño/i)
                              );
            if (bathroomEl) {
                const match = bathroomEl.textContent.match(/(\d+)/);
                if (match) result.bathrooms = parseInt(match[1]);
            }

            // Area
            const areaEl = document.querySelector('[data-qa="POSTING_CARD_FEATURES"] [title*="m²"]') ||
                          document.querySelector('[title*="superficie"]') ||
                          Array.from(document.querySelectorAll('[class*="feature"]')).find(el =>
                              el.textContent.match(/(\d+)\s*m/i)
                          );
            if (areaEl) {
                const match = areaEl.textContent.match(/(\d+)/);
                if (match) result.area = parseInt(match[1]);
            }

            // Description
            const descEl = document.querySelector('[data-qa="POSTING_DESCRIPTION"]') ||
                          document.querySelector('.description') ||
                          document.querySelector('[class*="description"]');
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

        // Create slug
        const slug = `casa-venta-privada-perisur-${Date.now().toString().slice(-6)}`;
        const imagesDir = `images/${slug}`;

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

        // Save data for property generator
        const propertyData = {
            title: data.title.replace('Casa en Venta en ', ''),
            location: data.location,
            price: data.price,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            area: data.area,
            landArea: data.area,
            description: data.description,
            slug: slug,
            photoCount: data.photos.length
        };

        fs.writeFileSync(`${slug}-data.json`, JSON.stringify(propertyData, null, 2));

        console.log('\n✅ SCRAPING COMPLETADO');
        console.log(`\n📦 Archivos generados:`);
        console.log(`   - ${imagesDir}/ (${data.photos.length} fotos)`);
        console.log(`   - ${slug}-data.json`);
        console.log(`\n🎯 Datos guardados para generar la propiedad`);

    } catch (error) {
        console.error('❌ Error en el proceso:', error);
        process.exit(1);
    }
})();
