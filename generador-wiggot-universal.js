const fs = require('fs');

/**
 * GENERADOR UNIVERSAL WIGGOT - MÉTODO OFICIAL PERMANENTE
 *
 * BASADO EN: generar-villa-bonita.js (MÉTODO QUE FUNCIONA)
 *
 * USO: node generador-wiggot-universal.js wiggot-datos-[ID].json
 *
 * PROCESO:
 * 1. Lee JSON de Wiggot
 * 2. Copia template de Portalegre (estructura que funciona)
 * 3. Buscar/Reemplazar TODOS los datos de Portalegre → Nueva propiedad
 * 4. Usuario descarga fotos manualmente O usa curl
 * 5. Resultado: Página idéntica a Portalegre pero con datos nuevos
 */

// Leer JSON del argumento
const jsonFile = process.argv[2];

if (!jsonFile) {
    console.log('❌ ERROR: Proporciona el archivo JSON de Wiggot');
    console.log('\nUSO: node generador-wiggot-universal.js wiggot-datos-pODipRm.json');
    process.exit(1);
}

if (!fs.existsSync(jsonFile)) {
    console.log('❌ ERROR: Archivo no encontrado:', jsonFile);
    process.exit(1);
}

// Leer datos del JSON
const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
const datos = jsonData.data;
const propertyId = jsonData.propertyId;

// Generar slug
function generarSlug(titulo) {
    return titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 40);
}

const slug = `casa-venta-${generarSlug(datos.title)}-${propertyId}`;
const carpetaDestino = `culiacan/${slug}`;

console.log('🏠 GENERADOR UNIVERSAL WIGGOT\n');
console.log('📋 DATOS DE LA PROPIEDAD:');
console.log('   ID:', propertyId);
console.log('   Título:', datos.title);
console.log('   Precio: $' + datos.price);
console.log('   Ubicación:', datos.location);
console.log('   Slug:', slug);
console.log('');

// Verificar si ya existe
if (fs.existsSync(carpetaDestino)) {
    console.log('⚠️  ADVERTENCIA: La carpeta ya existe:', carpetaDestino);
    console.log('   Se sobrescribirá el HTML pero NO las fotos');
    console.log('');
} else {
    // Copiar estructura de Portalegre
    console.log('📁 Copiando estructura desde Portalegre...');
    const { execSync } = require('child_process');
    execSync(`cp -r culiacan/casa-venta-portalegre-045360 "${carpetaDestino}"`);
    console.log('✅ Estructura copiada\n');
}

// Leer HTML de la copia
let html = fs.readFileSync(`${carpetaDestino}/index.html`, 'utf8');

console.log('🔧 Aplicando reemplazos...\n');

// DATOS DE PORTALEGRE (a reemplazar):
const PORTALEGRE = {
    precio: '1,750,000',
    precioNum: '1750000',
    titulo: 'Casa en Venta Portalegre',
    ubicacion: 'Avenida De Los Poetas 1435',
    direccionCorta: 'De Los Poetas 1435',
    fracc: 'Portalegre',
    slug: 'casa-venta-portalegre-045360',
    areaTerreno: '98',
    areaConstruccion: '65',
    banos: '1.5',
    recamaras: '2',
    plantas: '2'
};

// Extraer datos limpios de la nueva propiedad
const ubicacionParts = datos.location.split(',');
const calle = ubicacionParts[0].trim();
const fracc = ubicacionParts[1] ? ubicacionParts[1].trim() : datos.location;

// REEMPLAZOS GLOBALES (orden importa!)
const replacements = {
    // Precios
    '$1,750,000': `$${datos.price}`,
    '1750000': datos.price.replace(/,/g, ''),
    '1,750,000': datos.price,

    // Slug y URLs
    'casa-venta-portalegre-045360': slug,
    'portalegre-045360': slug.replace('casa-venta-', ''),

    // Títulos
    'Casa en Venta Portalegre': datos.title,
    'Portalegre': fracc,
    'portalegre': fracc.toLowerCase(),

    // Ubicación
    'Avenida De Los Poetas 1435': datos.location,
    'De Los Poetas 1435': calle,
    'Los Poetas 1435': calle,
    '1435': calle.match(/\d+/) ? calle.match(/\d+/)[0] : '',

    // Áreas (CRÍTICO - orden específico)
    '98 m² construcción': `${datos.area_construida} m² construcción`,
    '98m² construcción': `${datos.area_construida}m² construcción`,
    '98 m² terreno': `${datos.area_terreno} m² terreno`,
    '98m² terreno': `${datos.area_terreno}m² terreno`,
    '98 m²': `${datos.area_terreno} m²`, // Genérico último
    '98m²': `${datos.area_terreno}m²`,
    '65 m²': `${datos.area_construida} m²`,
    '65m²': `${datos.area_construida}m²`,

    // Features inline (valores específicos)
    '<span class="feature-value">98</span>': `<span class="feature-value">${datos.area_construida}</span>`,

    // Baños
    '1.5': datos.bathrooms,
    '1 baño': `${datos.bathrooms} baño${datos.bathrooms > 1 ? 's' : ''}`,

    // Recámaras
    '2 recámaras': `${datos.bedrooms} recámaras`,
    '2 recamaras': `${datos.bedrooms} recamaras`,
    '<span class="feature-value">2</span>\n                    <span class="feature-label">rec</span>': `<span class="feature-value">${datos.bedrooms}</span>\n                    <span class="feature-label">rec</span>`,

    // Estacionamientos
    'cochera para 2 autos': `cochera para ${datos.estacionamientos} autos`,

    // Plantas/Niveles
    '2 plantas': `${datos.niveles} planta${datos.niveles > 1 ? 's' : ''}`,

    // WhatsApp URLs
    'Hola,%20me%20interesa%20esta%20propiedad%20en%20Portalegre': `Hola,%20me%20interesa%20esta%20propiedad%20en%20${encodeURIComponent(fracc)}`,
    'casa%20en%20Portalegre': `casa%20en%20${encodeURIComponent(fracc)}`
};

// Aplicar reemplazos
for (const [buscar, reemplazar] of Object.entries(replacements)) {
    const regex = new RegExp(buscar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    html = html.replace(regex, reemplazar);
}

console.log('✅ Reemplazos aplicados');

// Guardar HTML
fs.writeFileSync(`${carpetaDestino}/index.html`, html);

console.log('✅ HTML generado:', `${carpetaDestino}/index.html`);
console.log('');
console.log('📸 SIGUIENTE PASO: Descargar fotos');
console.log('   Carpeta destino:', `${carpetaDestino}/images/`);
console.log('   Total de fotos:', datos.images.length);
console.log('');
console.log('💡 COMANDO PARA DESCARGAR FOTOS:');
console.log('');
console.log('cd "' + carpetaDestino + '/images" && \\');

datos.images.forEach((url, i) => {
    console.log(`curl -s "${url}" -o "foto-${i + 1}.jpg"${i < datos.images.length - 1 ? ' && \\' : ''}`);
});

console.log('');
console.log('📊 RESUMEN:');
console.log('   📁 Carpeta:', carpetaDestino);
console.log('   💰 Precio: $' + datos.price);
console.log('   🛏️  Recámaras:', datos.bedrooms);
console.log('   🚿 Baños:', datos.bathrooms);
console.log('   📏 Construcción:', datos.area_construida, 'm²');
console.log('   📐 Terreno:', datos.area_terreno, 'm²');
console.log('   🚗 Estacionamientos:', datos.estacionamientos);
console.log('   🏢 Niveles:', datos.niveles);
console.log('   📸 Fotos:', datos.images.length);
console.log('');
console.log('🌐 REVISAR LOCALMENTE:');
console.log(`   open "${carpetaDestino}/index.html"`);
console.log('');
console.log('✅ GENERACIÓN COMPLETADA');
