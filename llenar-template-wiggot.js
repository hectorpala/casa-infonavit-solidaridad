const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * LLENADOR DE TEMPLATE WIGGOT - MÉTODO DE PLACEHOLDERS
 *
 * USO: node llenar-template-wiggot.js wiggot-datos-pODipRm.json
 *
 * - Lee template con {{PLACEHOLDERS}}
 * - Llena los huecos con datos del JSON
 * - Descarga fotos automáticamente
 * - Resultado: Página IDÉNTICA a Villa Bonita
 */

function generarSlug(titulo) {
    return titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 40);
}

async function llenarTemplate(jsonPath) {
    console.log('🏠 LLENADOR DE TEMPLATE WIGGOT\n');

    // 1. Leer JSON
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const datos = jsonData.data;
    const propertyId = jsonData.propertyId;

    const slug = `casa-venta-${generarSlug(datos.title)}-${propertyId}`;

    console.log('📋 DATOS:');
    console.log('   Título:', datos.title);
    console.log('   Precio: $' + datos.price);
    console.log('   Ubicación:', datos.location);
    console.log('   Slug:', slug);
    console.log('');

    // 2. Crear carpetas
    const carpetaPropiedad = path.join('culiacan', slug);
    const carpetaImagenes = path.join(carpetaPropiedad, 'images');

    if (!fs.existsSync(carpetaPropiedad)) {
        fs.mkdirSync(carpetaPropiedad, { recursive: true });
    }
    if (!fs.existsSync(carpetaImagenes)) {
        fs.mkdirSync(carpetaImagenes, { recursive: true });
    }

    console.log('📁 Carpeta:', carpetaPropiedad);

    // 3. Descargar fotos
    console.log(`📸 Descargando ${datos.images.length} fotos...`);
    for (let i = 0; i < datos.images.length; i++) {
        const url = datos.images[i];
        const filename = `foto-${i + 1}.jpg`;
        const filepath = path.join(carpetaImagenes, filename);
        await execPromise(`curl -s "${url}" -o "${filepath}"`);
        console.log(`   ✅ ${filename}`);
    }
    console.log('');

    // 4. Leer template
    const templatePath = 'automation/templates/template-wiggot-placeholders.html';
    let html = fs.readFileSync(templatePath, 'utf8');

    // 5. Generar componentes dinámicos
    const photoCount = datos.images.length;

    // Carrusel slides
    const carouselSlides = datos.images.map((img, i) => `
                <div class="carousel-slide${i === 0 ? ' active' : ''}" data-slide="${i}">
                    <img src="images/foto-${i + 1}.jpg" alt="Foto ${i + 1} - ${datos.title}">
                </div>`).join('');

    // Carrusel dots
    const carouselDots = datos.images.map((img, i) =>
        `<span class="carousel-dot${i === 0 ? ' active' : ''}" data-slide="${i}"></span>`
    ).join('');

    // Lightbox array
    const lightboxArray = datos.images.map((img, i) => `'images/foto-${i + 1}.jpg'`).join(', ');

    // Schema.org images
    const schemaImages = datos.images.map((img, i) =>
        `"https://casasenventa.info/culiacan/${slug}/images/foto-${i + 1}.jpg"`
    ).join(',\n        ');

    // 6. Calcular valores
    const precioSinComas = datos.price.replace(/,/g, '');
    const precioNum = parseInt(precioSinComas);
    const enganche20 = Math.round(precioNum * 0.2).toLocaleString();
    const descripcionCorta = datos.description.replace(/\n/g, ' ').substring(0, 150);
    const descripcionHTML = datos.description.replace(/\n/g, '<br>');
    const tituloURL = encodeURIComponent(datos.title);
    const nivelesTexto = datos.niveles > 1 ? 'Niveles' : 'Nivel';

    // 7. LLENAR TODOS LOS PLACEHOLDERS
    const replacements = {
        '{{SLUG}}': slug,
        '{{TITULO}}': datos.title,
        '{{PRECIO}}': datos.price,
        '{{PRECIO_SIN_COMAS}}': precioSinComas,
        '{{UBICACION}}': datos.location,
        '{{RECAMARAS}}': datos.bedrooms,
        '{{BANOS}}': datos.bathrooms,
        '{{AREA_CONSTRUIDA}}': datos.area_construida,
        '{{AREA_TERRENO}}': datos.area_terreno,
        '{{ESTACIONAMIENTOS}}': datos.estacionamientos,
        '{{NIVELES}}': datos.niveles,
        '{{NIVELES_TEXTO}}': nivelesTexto,
        '{{DESCRIPCION_CORTA}}': descripcionCorta,
        '{{DESCRIPCION_HTML}}': descripcionHTML,
        '{{TITULO_URL}}': tituloURL,
        '{{ENGANCHE_20}}': enganche20,
        '{{TOTAL_FOTOS}}': photoCount.toString(),
        '{{CAROUSEL_SLIDES}}': carouselSlides,
        '{{CAROUSEL_DOTS}}': carouselDots,
        '{{LIGHTBOX_ARRAY}}': lightboxArray,
        '{{SCHEMA_IMAGES}}': schemaImages
    };

    // Reemplazar todo
    for (const [placeholder, valor] of Object.entries(replacements)) {
        const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
        html = html.replace(regex, valor);
    }

    // 8. Guardar HTML
    const htmlPath = path.join(carpetaPropiedad, 'index.html');
    fs.writeFileSync(htmlPath, html);

    console.log('✅ HTML generado:', htmlPath);
    console.log('\n🎉 ¡PÁGINA LISTA!');
    console.log('\n📂 Archivos:');
    console.log(`   - ${htmlPath}`);
    console.log(`   - ${carpetaImagenes}/ (${photoCount} fotos)`);
    console.log('\n🌐 Revisar localmente:');
    console.log(`   open "${htmlPath}"`);

    // 9. Abrir automáticamente
    await execPromise(`open "${htmlPath}"`);
}

// Ejecutar
const jsonFile = process.argv[2];

if (!jsonFile) {
    console.log('❌ ERROR: Debes proporcionar el archivo JSON');
    console.log('\nUSO: node llenar-template-wiggot.js wiggot-datos-pODipRm.json');
    process.exit(1);
}

if (!fs.existsSync(jsonFile)) {
    console.log('❌ ERROR: Archivo no encontrado:', jsonFile);
    process.exit(1);
}

llenarTemplate(jsonFile)
    .then(() => {
        console.log('\n✅ Proceso completado');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    });
