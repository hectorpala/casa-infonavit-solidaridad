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

            // Price
            const priceEl = document.querySelector('[data-qa="POSTING_CARD_PRICE"]') ||
                           document.querySelector('.price-tag') ||
                           document.querySelector('[class*="price"]');
            if (priceEl) result.price = priceEl.textContent.trim();

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

        console.log('\n✅ Datos scrapeados:');
        console.log(`   📝 Título: ${data.title}`);
        console.log(`   💰 Precio: ${data.price}`);
        console.log(`   📍 Ubicación: ${data.location}`);
        console.log(`   🛏️  Recámaras: ${data.bedrooms}`);
        console.log(`   🛁 Baños: ${data.bathrooms}`);
        console.log(`   📐 Área: ${data.area} m²`);
        console.log(`   📸 Fotos encontradas: ${data.photos.length}`);

        // Try to get more photos by clicking gallery
        if (data.photos.length < 5) {
            console.log('\n   🔄 Intentando obtener más fotos del carrusel...');

            try {
                // Click on first image to open gallery
                const firstImg = await page.$('img[src*="cloudfront"], img[src*="inmuebles24"]');
                if (firstImg) {
                    await firstImg.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Click next button multiple times
                    for (let i = 0; i < 20; i++) {
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
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }

                    console.log(`   ✅ Total fotos después del carrusel: ${data.photos.length}`);
                }
            } catch (e) {
                console.log('   ⚠️  No se pudo acceder al carrusel');
            }
        }

        await browser.close();
        return data;

    } catch (error) {
        console.error('❌ Error:', error.message);
        await browser.close();
        throw error;
    }
}

// Download photos
function downloadPhoto(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Main execution
(async () => {
    const url = process.argv[2];

    if (!url) {
        console.error('❌ Proporciona la URL de inmuebles24.com');
        process.exit(1);
    }

    try {
        const data = await scrapeInmuebles24(url);

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
            try {
                await downloadPhoto(data.photos[i], photoPath);
                console.log(`   ✅ foto-${i + 1}.jpg descargada`);
            } catch (e) {
                console.log(`   ❌ Error descargando foto-${i + 1}.jpg`);
            }
        }

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
