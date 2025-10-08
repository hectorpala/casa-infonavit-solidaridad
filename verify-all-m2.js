const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const properties = [
    {
        name: 'Mariano Escobedo',
        url: 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-mariano-escobedo-148050758.html',
        expectedConstruction: 252,
        expectedLand: 248.18
    },
    {
        name: 'La Cantera',
        url: 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-la-cantera-culiacan-147661732.html',
        expectedConstruction: 360,
        expectedLand: null
    },
    {
        name: 'Portalegre',
        url: 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-venta-de-casa-3-recamaras-en-portalegre-en-culiacan-145915393.html'
    },
    {
        name: 'Privada Mónaco',
        url: 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-privada-monaco-paseos-del-rey-147424326.html'
    },
    {
        name: 'Adolfo López Mateos',
        url: 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-adolfo-lopez-mateos-143635683.html'
    },
    {
        name: 'Las Américas',
        url: 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-las-americas-br56-146594849.html'
    },
    {
        name: 'Fraccionamiento Stanza',
        url: 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-fraccionamiento-stanza-147048897.html'
    },
    {
        name: 'Infonavit Barrancos',
        url: 'https://www.inmuebles24.com/propiedades/clasificado/veclcain-casa-en-venta-en-inf.-barrancos-146675321.html'
    }
];

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    console.log('\n========================================');
    console.log('VERIFICACIÓN DE M² - TODAS LAS PROPIEDADES');
    console.log('========================================\n');

    for (const property of properties) {
        console.log(`\n📍 PROPIEDAD: ${property.name}`);
        console.log(`🔗 URL: ${property.url}\n`);

        try {
            await page.goto(property.url, { waitUntil: 'networkidle2', timeout: 60000 });
            await new Promise(r => setTimeout(r, 3000));

            const data = await page.evaluate(() => {
                const result = {
                    construction_area: null,
                    land_area: null,
                    bedrooms: null,
                    bathrooms: null,
                    telefono: null,
                    fullText: ''
                };

                // PASO 1: Buscar datos en TODO el body text (incluyendo descripción)
                const bodyText = document.body.innerText;
                result.fullText = bodyText;

                // Buscar "Mts de terreno X.XX" en descripción
                const terrenoMatch = bodyText.match(/Mts?\s+de\s+terreno\s+([\d.,]+)/i);
                if (terrenoMatch) {
                    result.land_area = parseFloat(terrenoMatch[1].replace(',', '.'));
                    console.log('✅ TERRENO MATCH:', terrenoMatch[0], '→', result.land_area);
                }

                // Buscar "Construcción X" en descripción (después de terreno)
                const construccionMatch = bodyText.match(/Construcción\s+([\d.,]+)/i);
                if (construccionMatch) {
                    result.construction_area = parseFloat(construccionMatch[1].replace(',', '.'));
                    console.log('✅ CONSTRUCCIÓN MATCH:', construccionMatch[0], '→', result.construction_area);
                }

                // PASO 2: Si no encontró en descripción, buscar en features icons
                if (!result.construction_area || !result.land_area) {
                    const icons = document.querySelectorAll('.icon-feature');
                    icons.forEach(icon => {
                        const text = icon.textContent.trim();

                        // m² totales (terreno)
                        if (text.includes('m² totales') && !result.land_area) {
                            const match = text.match(/([\d.,]+)\s*m²/);
                            if (match) {
                                result.land_area = parseFloat(match[1].replace(',', '.'));
                                console.log('✅ ICON TERRENO:', text, '→', result.land_area);
                            }
                        }

                        // m² cubiertos (construcción)
                        if (text.includes('m² cubiertos') && !result.construction_area) {
                            const match = text.match(/([\d.,]+)\s*m²/);
                            if (match) {
                                result.construction_area = parseFloat(match[1].replace(',', '.'));
                                console.log('✅ ICON CONSTRUCCIÓN:', text, '→', result.construction_area);
                            }
                        }
                    });
                }

                // Buscar recámaras y baños en icons
                const icons = document.querySelectorAll('.icon-feature');
                icons.forEach(icon => {
                    const text = icon.textContent.trim().toLowerCase();
                    if (text.includes('dormitorio') || text.includes('recámara')) {
                        const match = text.match(/(\d+)/);
                        if (match) result.bedrooms = parseInt(match[1]);
                    }
                    if (text.includes('baño')) {
                        const match = text.match(/(\d+)/);
                        if (match) result.bathrooms = parseInt(match[1]);
                    }
                });

                // Buscar teléfono
                const html = document.documentElement.innerHTML;
                const phoneMatch = html.match(/(66[67]\d{7})/);
                if (phoneMatch) result.telefono = phoneMatch[1];

                return result;
            });

            // Mostrar resultados
            console.log('📊 DATOS EXTRAÍDOS:');
            console.log(`   m² Construcción: ${data.construction_area || 'N/A'}`);
            console.log(`   m² Terreno: ${data.land_area || 'N/A'}`);
            console.log(`   Recámaras: ${data.bedrooms || 'N/A'}`);
            console.log(`   Baños: ${data.bathrooms || 'N/A'}`);
            console.log(`   Teléfono: ${data.telefono || 'NO ENCONTRADO'}`);

            // Comparar con valores esperados si existen
            if (property.expectedConstruction !== undefined || property.expectedLand !== undefined) {
                console.log('\n🔍 COMPARACIÓN:');
                if (property.expectedConstruction !== undefined) {
                    const match = data.construction_area === property.expectedConstruction;
                    console.log(`   Construcción: ${match ? '✅' : '❌'} Esperado: ${property.expectedConstruction}, Obtenido: ${data.construction_area || 'N/A'}`);
                }
                if (property.expectedLand !== undefined) {
                    const match = data.land_area === property.expectedLand;
                    console.log(`   Terreno: ${match ? '✅' : '❌'} Esperado: ${property.expectedLand}, Obtenido: ${data.land_area || 'N/A'}`);
                }
            }

            // Mostrar snippet del texto para debugging
            console.log('\n📝 SNIPPET DEL TEXTO (primeros 500 caracteres):');
            console.log(data.fullText.substring(0, 500).replace(/\n+/g, ' '));

        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }

        console.log('\n' + '─'.repeat(80));
    }

    await browser.close();

    console.log('\n✅ VERIFICACIÓN COMPLETA\n');
})();
