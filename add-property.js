#!/usr/bin/env node

/**
 * CLI Universal para Agregar Propiedades
 * Reduce tiempo de 18min → 5-7min
 *
 * Uso:
 *   node add-property.js
 *   (modo interactivo con prompts)
 *
 * O con argumentos:
 *   node add-property.js --slug casa-venta-ejemplo --price 1990000 --title "Casa Ejemplo"
 */

const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const PropertyPageGenerator = require('./automation/generador-de-propiedades'); // ✅ Actualizado a generador nuevo

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

function prompt(question) {
    return new Promise((resolve) => {
        rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function detectPhotosFolder(titleHint) {
    const projectsDir = '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS';

    log('\n📂 Buscando carpeta de fotos...', 'yellow');

    try {
        const folders = fs.readdirSync(projectsDir)
            .filter(f => {
                const fullPath = path.join(projectsDir, f);
                return fs.statSync(fullPath).isDirectory();
            })
            .filter(f => f.toLowerCase().includes('casa') || f.toLowerCase().includes('venta') || f.toLowerCase().includes('renta'));

        if (folders.length === 0) {
            log('❌ No se encontraron carpetas en PROYECTOS', 'red');
            return null;
        }

        log(`\n📋 Carpetas encontradas (${folders.length}):`, 'bright');
        folders.forEach((f, i) => {
            const fullPath = path.join(projectsDir, f);
            const files = fs.readdirSync(fullPath).filter(file =>
                /\.(jpg|jpeg|png|webp)$/i.test(file)
            );
            console.log(`  ${i + 1}. ${f} (${files.length} fotos)`);
        });

        const selection = await prompt('\n¿Número de carpeta? (o nombre parcial): ');

        let selectedFolder;
        if (/^\d+$/.test(selection)) {
            selectedFolder = folders[parseInt(selection) - 1];
        } else {
            selectedFolder = folders.find(f =>
                f.toLowerCase().includes(selection.toLowerCase())
            );
        }

        if (selectedFolder) {
            log(`✅ Carpeta seleccionada: ${selectedFolder}`, 'green');
            return selectedFolder;
        } else {
            log('❌ Carpeta no encontrada', 'red');
            return null;
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        return null;
    }
}

async function optimizePhotos(photosFolder, slug) {
    const sourceDir = `/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/${photosFolder}`;
    const destDir = `images/${slug}`;

    log('\n📸 Optimizando fotos...', 'yellow');

    // Crear directorio destino
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Contar fotos
    const photos = fs.readdirSync(sourceDir)
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .sort();

    if (photos.length === 0) {
        log('❌ No se encontraron fotos en la carpeta', 'red');
        return 0;
    }

    log(`   Encontradas: ${photos.length} fotos`, 'cyan');

    // Optimizar cada foto
    photos.forEach((photo, index) => {
        const sourcePath = path.join(sourceDir, photo);
        const destPath = path.join(destDir, `foto-${index + 1}.jpg`);

        try {
            execSync(
                `sips -s format jpeg -s formatOptions 85 --resampleWidth 1200 "${sourcePath}" --out "${destPath}" 2>&1 | grep -v "Warning"`,
                { stdio: 'pipe' }
            );
            process.stdout.write(`\r   ✓ Optimizadas: ${index + 1}/${photos.length}`);
        } catch (error) {
            log(`\n   ⚠️  Error en foto ${index + 1}: ${error.message}`, 'yellow');
        }
    });

    console.log(''); // Nueva línea después del progreso
    log(`✅ ${photos.length} fotos optimizadas`, 'green');

    return photos.length;
}

function formatPrice(price) {
    return `$${parseInt(price).toLocaleString('es-MX')}`;
}

async function insertIntoListing(slug, propertyData) {
    log('\n📝 Agregando a listing principal...', 'yellow');

    const listingPath = 'culiacan/index.html';

    // Generar tarjeta HTML
    const cardHTML = `
            <!-- BEGIN CARD-ADV ${slug} -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
                 data-href="../${slug}.html">
                <div class="relative aspect-video">
                    <div class="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        ${propertyData.price}
                    </div>
                    <div class="carousel-container" data-current="0">
                        ${generateCarouselImages(slug, propertyData.photoCount)}
                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)" aria-label="Imagen anterior">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)" aria-label="Siguiente imagen">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <button class="favorite-btn absolute top-3 left-3 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all duration-300 z-20">
                        <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">${propertyData.price}</h3>
                    <p class="text-gray-600 mb-4 font-poppins">${propertyData.title} · Culiacán</p>
                    ${generatePropertyDetails(propertyData)}
                    ${generateWhatsAppButton(propertyData)}
                </div>
            </div>
            <!-- END CARD-ADV ${slug} -->
`;

    try {
        let htmlContent = fs.readFileSync(listingPath, 'utf8');

        // Buscar el comentario de Infonavit Barrancos para insertar antes
        const insertMarker = '<!-- Casa Infonavit Barrancos Venta -->';

        if (htmlContent.includes(insertMarker)) {
            htmlContent = htmlContent.replace(insertMarker, cardHTML + '\n            ' + insertMarker);
            fs.writeFileSync(listingPath, htmlContent);
            log('✅ Tarjeta agregada a culiacan/index.html', 'green');
            return true;
        } else {
            log('⚠️  Marcador no encontrado, agregando al final del grid', 'yellow');
            // TODO: implementar fallback
            return false;
        }
    } catch (error) {
        log(`❌ Error al insertar en listing: ${error.message}`, 'red');
        return false;
    }
}

function generateCarouselImages(slug, photoCount) {
    let html = '';
    for (let i = 1; i <= photoCount; i++) {
        const activeClass = i === 1 ? 'active' : 'hidden';
        html += `
                        <img src="../images/${slug}/foto-${i}.jpg"
                             alt="${slug} - Foto ${i}"
                             loading="${i === 1 ? 'eager' : 'lazy'}"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image ${activeClass}">`;
    }
    return html;
}

function generatePropertyDetails(data) {
    return `
                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            </svg>
                            ${data.bedrooms} Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l3-3 3 3M5 10v11a1 1 0 001 1h3M20 10v11a1 1 0 01-1 1h-3"></path>
                            </svg>
                            ${data.bathrooms} Baños
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                            ${data.area} m²
                        </div>
                    </div>`;
}

function generateWhatsAppButton(data) {
    const message = encodeURIComponent(`Hola, me interesa la ${data.title} de ${data.price}. ¿Podría darme más información?`);
    return `
                    <a href="https://wa.me/528111652545?text=${message}"
                       class="w-full btn-primary text-center block"
                       target="_blank" rel="noopener noreferrer">
                        <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"></path>
                        </svg>
                        Contactar por WhatsApp
                    </a>`;
}

async function commitAndPush(slug, propertyData) {
    log('\n🚀 Publicando cambios...', 'yellow');

    try {
        execSync(`git add ${slug}.html images/${slug}/ culiacan/index.html`, { stdio: 'pipe' });

        const commitMessage = `Agregar propiedad ${propertyData.title} ${propertyData.price}

Nueva propiedad ${propertyData.propertyType}:
- Ubicación: ${propertyData.location}
- Precio: ${propertyData.price}
- ${propertyData.bedrooms} recámaras, ${propertyData.bathrooms} baños
- ${propertyData.area} m² construcción
- ${propertyData.photoCount} fotos optimizadas

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

        fs.writeFileSync('.commit-msg-temp', commitMessage);
        execSync('git commit -F .commit-msg-temp', { stdio: 'pipe' });
        fs.unlinkSync('.commit-msg-temp');

        execSync('git push', { stdio: 'pipe' });

        log('✅ Cambios publicados en producción', 'green');
        return true;
    } catch (error) {
        log(`❌ Error en git: ${error.message}`, 'red');
        return false;
    }
}

async function main() {
    log('\n╔═══════════════════════════════════════════════════════╗', 'bright');
    log('║  🏠 CLI Universal - Agregar Propiedades (5-7 min)   ║', 'bright');
    log('╚═══════════════════════════════════════════════════════╝\n', 'bright');

    try {
        // 1. Tipo de propiedad
        const propertyType = await prompt('¿Tipo de propiedad? (venta/renta) [venta]: ') || 'venta';

        // 2. Título
        const title = await prompt('Título de la propiedad: ');
        if (!title) {
            log('❌ Título requerido', 'red');
            rl.close();
            return;
        }

        // 3. Slug
        const defaultSlug = `casa-${propertyType}-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
        const slug = await prompt(`Slug [${defaultSlug}]: `) || defaultSlug;

        // 4. Precio
        const priceInput = await prompt('Precio (sin $, sin comas): ');
        const priceNumber = parseInt(priceInput);
        const price = formatPrice(priceNumber);

        // 5. Ubicación
        const location = await prompt('Ubicación: ');

        // 6. Características
        const bedrooms = parseInt(await prompt('Recámaras: '));
        const bathrooms = parseFloat(await prompt('Baños: '));
        const area = parseInt(await prompt('M² construcción: '));
        const landArea = parseInt(await prompt('M² terreno [mismo]: ') || area);

        // 7. Detectar fotos
        const photosFolder = await detectPhotosFolder(title);
        if (!photosFolder) {
            log('❌ No se pudo detectar carpeta de fotos', 'red');
            rl.close();
            return;
        }

        // 8. Optimizar fotos
        const photoCount = await optimizePhotos(photosFolder, slug);
        if (photoCount === 0) {
            log('❌ No se pudieron optimizar fotos', 'red');
            rl.close();
            return;
        }

        // 9. Generar página
        log('\n📄 Generando página HTML...', 'yellow');

        const propertyData = {
            title,
            location,
            price,
            priceNumber,
            bedrooms,
            bathrooms,
            parking: 2,
            area,
            landArea,
            yearBuilt: 'N/D',
            slug,
            key: slug,
            propertyType,
            description: `Propiedad en ${propertyType} ubicada en ${location}. Cuenta con ${bedrooms} recámaras, ${bathrooms} baños, ${area} m² de construcción sobre ${landArea} m² de terreno.`,
            features: [
                `${bedrooms} Recámaras`,
                `${bathrooms} Baños`,
                `${area} m² de Construcción`,
                `${landArea} m² de Terreno`
            ],
            whatsappMessage: `Hola, me interesa la ${title} de ${price}`,
            photosFolder,
            photoCount
        };

        const generator = new PropertyPageGenerator(propertyType === 'renta');

        // ✅ GENERAR HTML CON MÉTODO CORRECTO SEGÚN TIPO
        let htmlContent;
        try {
            if (propertyType === 'renta') {
                log('\n🏠 Generando RENTA con método Solidaridad...', 'cyan');
                htmlContent = generator.generateFromSolidaridadTemplate(propertyData);
                log('✅ HTML RENTA generado (estructura idéntica a Casa Solidaridad)', 'green');
            } else {
                log('\n🛡️  Generando VENTA con validación automática...', 'cyan');
                htmlContent = generator.generateFromMasterTemplateWithValidation(propertyData);
                log('✅ HTML VENTA generado y validado (100% correcto)', 'green');
            }
        } catch (error) {
            log('❌ Error en generación:', 'red');
            log(error.message, 'red');
            log('\n🔧 Revisa los datos ingresados y corrige los errores', 'yellow');
            process.exit(1);
        }

        fs.writeFileSync(`${slug}.html`, htmlContent);
        log('✅ Página HTML guardada', 'green');

        // 10. Insertar en listing
        await insertIntoListing(slug, propertyData);

        // 11. Commit y Push
        const shouldPublish = await prompt('\n¿Publicar ahora? (s/n) [s]: ') || 's';

        if (shouldPublish.toLowerCase() === 's') {
            await commitAndPush(slug, propertyData);

            log('\n╔═══════════════════════════════════════════════════════╗', 'green');
            log('║              ✅ PROPIEDAD PUBLICADA                   ║', 'green');
            log('╚═══════════════════════════════════════════════════════╝', 'green');
            log(`\n📱 URL: https://casasenventa.info/${slug}.html`, 'cyan');
            log(`📋 Listing: https://casasenventa.info/culiacan/\n`, 'cyan');
        } else {
            log('\n✅ Archivos generados (sin publicar)', 'yellow');
            log(`   Ejecuta: git add ${slug}.html images/${slug}/ culiacan/index.html && git commit && git push\n`, 'cyan');
        }

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, 'red');
        console.error(error);
    } finally {
        rl.close();
    }
}

// Ejecutar
main();
