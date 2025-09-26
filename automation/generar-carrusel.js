#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { getOrganizedPhotoList } = require('./detectar-fachada');

/**
 * Carousel Structure Generator
 * Automatically generates HTML for property photo carousels
 */

/**
 * Generate smart alt text based on filename patterns
 */
function generateAltText(filename, propertyName, index) {
    const cleanName = propertyName.replace(/casa-renta-|casa-venta-/gi, '').replace(/-/g, ' ');
    const name = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    
    // Patterns for different room types based on filename
    const roomPatterns = [
        { pattern: /fachada|exterior|frente|privada.*foto.*a6d8/i, room: 'Fachada' },
        { pattern: /sala|living|stairs|escalera|8d225114/i, room: 'Sala' },
        { pattern: /cocina|kitchen|04468e80/i, room: 'Cocina' },
        { pattern: /recamara|bedroom|habitacion|038ac2f6|25a838c1|7dcc87af/i, room: 'Recámara' },
        { pattern: /baño|bathroom|06b6efa4/i, room: 'Baño' },
        { pattern: /comedor|dining|6546db55/i, room: 'Comedor' },
        { pattern: /garage|cochera|estacionamiento|7aeff357/i, room: 'Garage' },
        { pattern: /lavado|laundry|9c4f3d3e/i, room: 'Área de lavado' },
        { pattern: /jardin|garden|patio|af813104/i, room: 'Jardín' },
        { pattern: /alberca|pool|swimming/i, room: 'Alberca' },
        { pattern: /vista|view|exterior|e54f3398/i, room: 'Vista exterior' }
    ];
    
    // Try to match room type
    for (const { pattern, room } of roomPatterns) {
        if (pattern.test(filename)) {
            return `Casa ${name} - ${room}`;
        }
    }
    
    // If index is 0, it's definitely the facade
    if (index === 0) {
        return `Casa ${name} - Fachada`;
    }
    
    // Generic fallback
    return `Casa ${name} - Imagen ${index + 1}`;
}

/**
 * Generate carousel slides HTML
 */
function generateCarouselSlides(photos, propertyName, carouselType = 'hero') {
    const slides = photos.map((photo, index) => {
        const isFirst = index === 0;
        const altText = generateAltText(photo, propertyName, index);
        const activeClass = isFirst ? ' active' : '';
        const mainImageClass = isFirst ? ' main-image' : '';
        
        if (carouselType === 'hero') {
            return `                    <div class="carousel-slide${activeClass}" data-slide="${index}">
                        <picture>
                            <img src="images/${propertyName}/${photo}" alt="${altText}" class="carousel-image gallery-image${mainImageClass}" loading="lazy">
                        </picture>
                    </div>`;
        } else {
            return `                    <div class="carousel-slide${activeClass}">
                        <img src="images/${propertyName}/${photo}" alt="${altText}">
                    </div>`;
        }
    }).join('\n');
    
    return slides;
}

/**
 * Generate carousel dots HTML
 */
function generateCarouselDots(photoCount, functionName = 'goToSlideHero') {
    const dots = [];
    for (let i = 0; i < photoCount; i++) {
        const activeClass = i === 0 ? ' active' : '';
        dots.push(`                    <button class="carousel-dot${activeClass}" onclick="${functionName}(${i})" aria-label="Ir a foto ${i + 1}"></button>`);
    }
    return dots.join('\n');
}

/**
 * Generate complete hero carousel HTML
 */
function generateHeroCarousel(photosPath, propertyName) {
    try {
        const photos = getOrganizedPhotoList(photosPath);
        if (photos.length === 0) {
            throw new Error('No photos found');
        }
        
        console.log(`🎠 Generando carrusel HERO para ${propertyName} con ${photos.length} fotos`);
        
        const slides = generateCarouselSlides(photos, propertyName, 'hero');
        const dots = generateCarouselDots(photos.length, 'goToSlideHero');
        
        const carouselHTML = `            <div class="carousel-container">
                <div class="carousel-wrapper">
${slides}
                    
                    <!-- Navigation arrows -->
                    <button class="carousel-arrow carousel-prev" onclick="changeSlideHero(-1)" aria-label="Foto anterior">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="carousel-arrow carousel-next" onclick="changeSlideHero(1)" aria-label="Siguiente foto">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <!-- Price Badge -->
                <div class="price-badge">
                    <span class="price-amount">$[PRECIO]</span>
                    <span class="price-label">[VENTA/RENTA] Mensual</span>
                </div>
                
                <!-- Dots indicators -->
                <div class="carousel-dots">
${dots}
                </div>
            </div>`;
        
        return carouselHTML;
        
    } catch (error) {
        console.error('❌ Error generating hero carousel:', error.message);
        return null;
    }
}

/**
 * Generate complete gallery carousel HTML
 */
function generateGalleryCarousel(photosPath, propertyName) {
    try {
        const photos = getOrganizedPhotoList(photosPath);
        if (photos.length === 0) {
            throw new Error('No photos found');
        }
        
        console.log(`🖼️ Generando carrusel GALLERY para ${propertyName} con ${photos.length} fotos`);
        
        const slides = generateCarouselSlides(photos, propertyName, 'gallery');
        const dots = generateCarouselDots(photos.length, 'goToSlide');
        
        const carouselHTML = `            <div class="carousel-container">
                <div class="carousel-wrapper">
${slides}
                </div>
                    <!-- Navigation arrows -->
                    <button class="carousel-arrow carousel-prev" onclick="changeSlide(-1)" aria-label="Foto anterior">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="carousel-arrow carousel-next" onclick="changeSlide(1)" aria-label="Siguiente foto">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                <!-- Dots indicators -->
                <div class="carousel-dots">
${dots}
                </div>
            </div>`;
        
        return carouselHTML;
        
    } catch (error) {
        console.error('❌ Error generating gallery carousel:', error.message);
        return null;
    }
}

/**
 * Generate Culiacán page carousel HTML (advanced cards)
 */
function generateCuliacanCarousel(photosPath, propertyName, maxPhotos = 6) {
    try {
        const allPhotos = getOrganizedPhotoList(photosPath);
        const photos = allPhotos.slice(0, maxPhotos); // Limit for performance
        
        console.log(`🏛️ Generando carrusel CULIACÁN para ${propertyName} con ${photos.length} fotos`);
        
        const images = photos.map((photo, index) => {
            const isFirst = index === 0;
            const altText = generateAltText(photo, propertyName, index);
            const activeClass = isFirst ? ' active' : '';
            const hiddenClass = isFirst ? '' : ' hidden';
            
            return `                        <img src="../images/${propertyName}/${photo}" 
                             alt="${altText}" 
                             loading="lazy" 
                             decoding="async"
                             class="w-full h-full object-cover carousel-image${activeClass}${hiddenClass}">`;
        }).join('\n');
        
        return {
            images: images,
            imageCount: photos.length,
            facadeAlt: generateAltText(photos[0], propertyName, 0)
        };
        
    } catch (error) {
        console.error('❌ Error generating Culiacán carousel:', error.message);
        return null;
    }
}

// CLI usage
if (require.main === module) {
    const photosPath = process.argv[2];
    const propertyName = process.argv[3];
    const carouselType = process.argv[4] || 'hero';
    
    if (!photosPath || !propertyName) {
        console.log('Uso: node generar-carrusel.js <ruta-fotos> <nombre-propiedad> [tipo]');
        console.log('');
        console.log('Parámetros:');
        console.log('  ruta-fotos: Ruta a la carpeta de fotos');
        console.log('  nombre-propiedad: Nombre de la propiedad (ej: 3-rios)');
        console.log('  tipo: hero | gallery | culiacan (default: hero)');
        console.log('');
        console.log('Ejemplos:');
        console.log('  node automation/generar-carrusel.js "images/3-rios" "3-rios" hero');
        console.log('  node automation/generar-carrusel.js "images/circuito-canarias" "circuito-canarias" gallery');
        process.exit(1);
    }
    
    console.log('🎠 GENERADOR AUTOMÁTICO DE CARRUSEL');
    console.log('==================================');
    
    let result;
    switch (carouselType) {
        case 'hero':
            result = generateHeroCarousel(photosPath, propertyName);
            break;
        case 'gallery':
            result = generateGalleryCarousel(photosPath, propertyName);
            break;
        case 'culiacan':
            result = generateCuliacanCarousel(photosPath, propertyName);
            console.log('📋 RESULTADO CULIACÁN:');
            if (result) {
                console.log('🖼️ Imágenes generadas:', result.imageCount);
                console.log('🏠 Fachada alt text:', result.facadeAlt);
                console.log('\n📄 HTML para insertar:');
                console.log(result.images);
            }
            return;
        default:
            console.error('❌ Tipo de carrusel no válido. Use: hero, gallery, culiacan');
            process.exit(1);
    }
    
    if (result) {
        console.log('✅ CARRUSEL GENERADO EXITOSAMENTE');
        console.log('\n📄 HTML PARA INSERTAR:');
        console.log('========================');
        console.log(result);
    } else {
        console.log('❌ ERROR AL GENERAR CARRUSEL');
    }
}

module.exports = {
    generateHeroCarousel,
    generateGalleryCarousel,
    generateCuliacanCarousel,
    generateAltText
};