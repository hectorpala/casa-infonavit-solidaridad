#!/bin/bash

# Nueva tarjeta Toscana en formato Tailwind CSS para culiacan/index.html
TOSCANA_CARD='
            <!-- BEGIN CARD-ADV casa-venta-stanza-toscana -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative"
                 data-href="../casa-venta-stanza-toscana.html">
                <div class="relative aspect-video">
                    <!-- PRICE BADGE OBLIGATORIO (estructura EXACTA La Campiña) -->
                    <div class="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        $1,990,000
                    </div>

                    <!-- CAROUSEL CONTAINER - ESTRUCTURA COMPATIBLE CON JS EXISTENTE -->
                    <div class="carousel-container" data-current="0">
                        <img src="../images/casa-venta-stanza-toscana/foto-1.jpg"
                 alt="Casa Stanza Toscana - Foto 1"
                 loading="lazy"
                 decoding="async"
                 class="w-full h-full object-cover carousel-image active">
                        <img src="../images/casa-venta-stanza-toscana/foto-2.jpg"
                 alt="Casa Stanza Toscana - Foto 2"
                 loading="lazy"
                 decoding="async"
                 class="w-full h-full object-cover carousel-image hidden">
                        <img src="../images/casa-venta-stanza-toscana/foto-3.jpg"
                 alt="Casa Stanza Toscana - Foto 3"
                 loading="lazy"
                 decoding="async"
                 class="w-full h-full object-cover carousel-image hidden">
                        <img src="../images/casa-venta-stanza-toscana/foto-4.jpg"
                 alt="Casa Stanza Toscana - Foto 4"
                 loading="lazy"
                 decoding="async"
                 class="w-full h-full object-cover carousel-image hidden">
                        <img src="../images/casa-venta-stanza-toscana/foto-5.jpg"
                 alt="Casa Stanza Toscana - Foto 5"
                 loading="lazy"
                 decoding="async"
                 class="w-full h-full object-cover carousel-image hidden">
                        <img src="../images/casa-venta-stanza-toscana/foto-6.jpg"
                 alt="Casa Stanza Toscana - Foto 6"
                 loading="lazy"
                 decoding="async"
                 class="w-full h-full object-cover carousel-image hidden">
                        <img src="../images/casa-venta-stanza-toscana/foto-7.jpg"
                 alt="Casa Stanza Toscana - Foto 7"
                 loading="lazy"
                 decoding="async"
                 class="w-full h-full object-cover carousel-image hidden">

                        <!-- Navigation arrows - FUNCIONES EXISTENTES -->
                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)" aria-label="Imagen anterior">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)" aria-label="Siguiente imagen">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    <!-- Favoritos button -->
                    <button class="favorite-btn absolute top-3 left-3 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all duration-300 z-20">
                        <svg class="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                </div>

                <!-- CONTENT SECTION -->
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">$1,990,000</h3>
                    <p class="text-gray-600 mb-4 font-poppins">Casa en Venta Stanza Toscana · Culiacán</p>

                    <!-- PROPERTY DETAILS CON SVG ICONS (estructura EXACTA La Campiña) -->
                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            </svg>
                            3 Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l3-3 3 3M5 10v11a1 1 0 001 1h3M20 10v11a1 1 0 01-1 1h-3"></path>
                            </svg>
                            1.5 Baños
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                            78 m²
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                            </svg>
                            Terreno 110 m²
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                            2 Pisos
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            2 Estacionamientos
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                            </svg>
                            Privada
                        </div>
                    </div>

                    <!-- WHATSAPP BUTTON (estructura EXACTA La Campiña) -->
                    <a href="https://wa.me/528111652545?text=Hola%2C%20me%20interesa%20la%20Casa%20en%20Venta%20Stanza%20Toscana%20de%20%241%2C990%2C000.%20%C2%BFPodr%C3%ADa%20darme%20m%C3%A1s%20informaci%C3%B3n%3F"
                       class="w-full btn-primary text-center block"
                       target="_blank" rel="noopener noreferrer">
                        <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"></path>
                        </svg>
                        Contactar por WhatsApp
                    </a>
                </div>
            </div>
            <!-- END CARD-ADV casa-venta-stanza-toscana -->'

# Insertar antes de la línea que contiene "</div>" y está después de la última property-card
# Buscar la línea del cierre del grid (aproximadamente línea 4800)
awk -v card="$TOSCANA_CARD" '
/<!-- Casa Infonavit Barrancos Venta -->/ {found=1}
found && /<\/div>/ && !/property-card/ && !/carousel/ && !/aspect/ && !/relative/ {
    if (!inserted) {
        print card
        inserted=1
    }
}
{print}
' culiacan/index.html > culiacan/index.html.tmp && mv culiacan/index.html.tmp culiacan/index.html

echo "✅ Tarjeta Toscana agregada a culiacan/index.html"
