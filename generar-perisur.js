const fs = require('fs');
const PropertyPageGenerator = require('./automation/property-page-generator.js');

// Leer datos scrapeados
const data = JSON.parse(fs.readFileSync('casa-venta-privada-perisur-625303-data.json', 'utf8'));

// Configuración para PropertyPageGenerator
const config = {
    key: data.slug,
    title: data.title,
    price: data.price,
    location: data.location,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    construction_area: data.area,
    land_area: data.landArea,
    photoCount: data.photoCount,
    description: data.description
};

console.log('📄 Generando HTML con PropertyPageGenerator...');
console.log('Configuración:', JSON.stringify(config, null, 2));

const generator = new PropertyPageGenerator();
const html = generator.generateFromSolidaridadTemplate(config);

// Guardar HTML
const htmlFile = `culiacan/${data.slug}/index.html`;
fs.mkdirSync(`culiacan/${data.slug}`, { recursive: true });
fs.writeFileSync(htmlFile, html);

console.log(`✅ HTML generado: ${htmlFile}`);

// Mover fotos a la ubicación correcta
const sourceDir = `images/${data.slug}`;
const targetDir = `culiacan/${data.slug}/images`;

if (fs.existsSync(sourceDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    const files = fs.readdirSync(sourceDir);
    files.forEach(file => {
        fs.copyFileSync(`${sourceDir}/${file}`, `${targetDir}/${file}`);
    });
    console.log(`✅ ${files.length} fotos copiadas a ${targetDir}`);
}

// Generar tarjeta para index
console.log('\n🎴 Generando tarjeta para culiacan/index.html...');

const cardHtml = `
            <!-- BEGIN CARD-ADV ${data.slug} -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
                 data-href="${data.slug}/index.html">
                <div class="relative aspect-video">
                    <div class="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        VENTA ${data.price}
                    </div>

                    <div class="carousel-container" data-current="0">
                        ${Array.from({length: Math.min(data.photoCount, 5)}, (_, i) => `
                        <img src="${data.slug}/images/foto-${i+1}.jpg"
                 alt="${data.title} - Foto ${i+1}"
                 loading="lazy"
                 decoding="async"
                 class="w-full h-full object-cover carousel-image ${i === 0 ? 'active' : 'hidden'}">`).join('')}

                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)" aria-label="Imagen anterior">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)" aria-label="Siguiente imagen">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>

                    <button class="favorite-btn absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors z-20"
                            onclick="event.stopPropagation(); toggleFavorite(this)"
                            aria-label="Agregar a favoritos">
                        <svg class="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                </div>

                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">${data.price}</h3>
                    <p class="text-gray-600 mb-4 font-poppins">Casa en Venta ${data.title} · Culiacán</p>

                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                            </svg>
                            ${data.bedrooms} Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
                            </svg>
                            ${data.bathrooms} Baños
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                            </svg>
                            ${data.area} m²
                        </div>
                    </div>

                    <a href="${data.slug}/index.html"
                       class="block w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-center font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                        Ver Detalles
                    </a>
                </div>
            </div>
            <!-- END CARD-ADV ${data.slug} -->
`;

fs.writeFileSync(`tarjeta-${data.slug}.html`, cardHtml);
console.log(`✅ Tarjeta generada: tarjeta-${data.slug}.html`);

console.log('\n✅ GENERACIÓN COMPLETADA');
console.log('\n📦 Archivos generados:');
console.log(`   - ${htmlFile}`);
console.log(`   - ${targetDir}/ (${data.photoCount} fotos)`);
console.log(`   - tarjeta-${data.slug}.html`);
console.log('\n🎯 Próximo paso: Insertar tarjeta en culiacan/index.html y publicar');
