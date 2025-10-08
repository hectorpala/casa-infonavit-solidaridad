const fs = require('fs');
const path = require('path');

// Tarjeta 1: Venta de Casa por Calle Mariano Escobedo
const card1 = `
            <!-- BEGIN CARD-ADV venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
                 data-href="venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/index.html">
                <div class="relative aspect-video">
                    <!-- PRICE BADGE VERDE OBLIGATORIO -->
                    <div class="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        $4,000,000
                    </div>

                    <!-- CAROUSEL con onclick="changeImage()" -->
                    <div class="carousel-container" data-current="0">
                        <img src="venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-1.jpg"
                             alt="Casa en Venta Sinaloa"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image active">
                        <img src="venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-2.jpg"
                             alt="Casa en Venta Sinaloa"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image hidden">
                        <img src="venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-3.jpg"
                             alt="Casa en Venta Sinaloa"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image hidden">
                        <img src="venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-4.jpg"
                             alt="Casa en Venta Sinaloa"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image hidden">
                        <img src="venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/images/foto-5.jpg"
                             alt="Casa en Venta Sinaloa"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image hidden">
                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    <!-- Favoritos SVG -->
                    <button class="favorite-btn absolute top-3 left-3 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors">
                        <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                    </button>
                </div>

                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">$4,000,000</h3>
                    <p class="text-gray-600 mb-4 font-poppins">Casa en Venta Sinaloa, Culiacán</p>

                    <!-- SVG ICONS (NO Font Awesome en tarjetas) -->
                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                            </svg>
                            5 Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                            </svg>
                            2 Baños
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                            </svg>
                            252m² construcción
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                            </svg>
                            248.18m² terreno
                        </div>
                    </div>

                    <!-- CTA VERDE -->
                    <a href="venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad/index.html"
                       class="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
                        Ver Detalles
                    </a>
                </div>
            </div>
            <!-- END CARD-ADV venta-de-casa-por-calle-mariano-escobedo-centro-de-la-ciudad -->
`;

// Tarjeta 2: Casa en Venta La Cantera
const card2 = `
            <!-- BEGIN CARD-ADV casa-en-venta-la-cantera-culiacan -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
                 data-href="casa-en-venta-la-cantera-culiacan/index.html">
                <div class="relative aspect-video">
                    <!-- PRICE BADGE VERDE OBLIGATORIO -->
                    <div class="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        $7,950,000
                    </div>

                    <!-- CAROUSEL con onclick="changeImage()" -->
                    <div class="carousel-container" data-current="0">
                        <img src="casa-en-venta-la-cantera-culiacan/images/foto-1.jpg"
                             alt="Casa en Venta La Cantera"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image active">
                        <img src="casa-en-venta-la-cantera-culiacan/images/foto-2.jpg"
                             alt="Casa en Venta La Cantera"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image hidden">
                        <img src="casa-en-venta-la-cantera-culiacan/images/foto-3.jpg"
                             alt="Casa en Venta La Cantera"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image hidden">
                        <img src="casa-en-venta-la-cantera-culiacan/images/foto-4.jpg"
                             alt="Casa en Venta La Cantera"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image hidden">
                        <img src="casa-en-venta-la-cantera-culiacan/images/foto-5.jpg"
                             alt="Casa en Venta La Cantera"
                             loading="lazy"
                             decoding="async"
                             class="w-full h-full object-cover carousel-image hidden">
                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    <!-- Favoritos SVG -->
                    <button class="favorite-btn absolute top-3 left-3 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors">
                        <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                    </button>
                </div>

                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">$7,950,000</h3>
                    <p class="text-gray-600 mb-4 font-poppins">Casa en Venta La Cantera, Culiacán</p>

                    <!-- SVG ICONS (NO Font Awesome en tarjetas) -->
                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                            </svg>
                            3 Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                            </svg>
                            3 Baños
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                            </svg>
                            360m² construcción
                        </div>
                    </div>

                    <!-- CTA VERDE -->
                    <a href="casa-en-venta-la-cantera-culiacan/index.html"
                       class="block w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
                        Ver Detalles
                    </a>
                </div>
            </div>
            <!-- END CARD-ADV casa-en-venta-la-cantera-culiacan -->
`;

// Leer culiacan/index.html
const indexPath = path.join(__dirname, 'culiacan', 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Insertar ANTES del comentario "Ver más propiedades"
const insertionPoint = '\n\n            <!-- Ver más propiedades (resto de propiedades como muestra) -->';
const replacement = `\n${card1}\n${card2}\n${insertionPoint}`;

indexHtml = indexHtml.replace(insertionPoint, replacement);

// Guardar
fs.writeFileSync(indexPath, indexHtml, 'utf8');

console.log('✅ Tarjetas agregadas exitosamente a culiacan/index.html');
console.log('   • Venta de Casa por Calle Mariano Escobedo - $4,000,000');
console.log('   • Casa en Venta La Cantera - $7,950,000');
