#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Automated Property Page Generator
 * Generates optimized property pages based on Infonavit Solidaridad template
 */

class PropertyPageGenerator {
    constructor(isRental = false) {
        this.templatePath = isRental ? './automation/templates/rental-template.html' : './automation/templates/property-template.html';
        this.baseDirectory = './';
        this.imagesDirectory = './images/';
        this.isRental = isRental;
    }

    /**
     * Auto-detect photos source folder in PROYECTOS
     */
    detectPhotosSource(propertyKey, propertyTitle) {
        const proyectosBase = '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS';
        
        // Posibles nombres de carpeta basados en propertyKey y título
        const possibleNames = [
            propertyKey,
            propertyKey.replace(/-/g, ' '),
            propertyTitle.toLowerCase().replace(/casa|venta|renta/gi, '').trim(),
            // Nombres específicos conocidos
            'stanza-corcega',
            'barcelona',
            'infonavit-barrancos',
            'hacienda-de-la-mora',
            'villa-primavera',
            'zona-dorada'
        ];
        
        try {
            const directories = fs.readdirSync(proyectosBase);
            
            for (const possibleName of possibleNames) {
                const foundDir = directories.find(dir => 
                    dir.toLowerCase().includes(possibleName.toLowerCase()) ||
                    possibleName.toLowerCase().includes(dir.toLowerCase())
                );
                
                if (foundDir) {
                    return path.join(proyectosBase, foundDir);
                }
            }
        } catch (error) {
            console.warn('⚠️  No se puede acceder a carpeta PROYECTOS:', error.message);
        }
        
        return null;
    }

    /**
     * Auto-optimize photos from PROYECTOS folder
     */
    optimizePhotos(sourcePath, propertyKey) {
        console.log('🎯 INICIANDO OPTIMIZACIÓN AUTOMÁTICA DE FOTOS');
        
        const destinationPath = path.join(this.imagesDirectory, propertyKey);
        
        try {
            // Ejecutar script de optimización automática
            const optimizeScript = path.join(__dirname, 'optimizar-fotos.sh');
            execSync(`"${optimizeScript}" "${sourcePath}" "${destinationPath}"`, { 
                stdio: 'inherit',
                encoding: 'utf8'
            });
            console.log('✅ FOTOS OPTIMIZADAS AUTOMÁTICAMENTE');
            return true;
        } catch (error) {
            console.error('❌ Error al optimizar fotos:', error.message);
            return false;
        }
    }

    /**
     * Auto-detect facade photo from property folder
     * Returns the filename of the most likely facade photo
     */
    detectFacadePhoto(photosPath) {
        console.log('🏠 DETECTANDO FACHADA AUTOMÁTICAMENTE...');
        
        try {
            const files = fs.readdirSync(photosPath)
                .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
                .sort(); // Sort alphabetically first
            
            if (files.length === 0) {
                console.warn('⚠️  No se encontraron fotos en la carpeta');
                return null;
            }
            
            // Priority patterns for facade detection
            const facadePatterns = [
                /fachada/i,           // Contains "fachada"
                /exterior/i,          // Contains "exterior" 
                /frente/i,            // Contains "frente"
                /-01\./i,            // Ends with -01.
                /foto-01/i,          // Contains "foto-01"
                /^01/i,              // Starts with 01
                /privada.*foto.*01/i // Privada pattern like "privada-agua-marina-938...foto-..."
            ];
            
            // Try to find facade by pattern
            for (const pattern of facadePatterns) {
                const facadeFile = files.find(file => pattern.test(file));
                if (facadeFile) {
                    console.log(`✅ FACHADA DETECTADA POR PATRÓN: ${facadeFile}`);
                    return facadeFile;
                }
            }
            
            // If no pattern matches, use first file alphabetically (often the facade)
            const firstFile = files[0];
            console.log(`📍 USANDO PRIMERA FOTO COMO FACHADA: ${firstFile}`);
            return firstFile;
            
        } catch (error) {
            console.error('❌ Error al detectar fachada:', error.message);
            return null;
        }
    }

    /**
     * Get organized photo list with facade first
     */
    getOrganizedPhotoList(photosPath) {
        try {
            const allFiles = fs.readdirSync(photosPath)
                .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
                .sort();
            
            const facadeFile = this.detectFacadePhoto(photosPath);
            
            if (!facadeFile) {
                return allFiles;
            }
            
            // Put facade first, then the rest
            const otherFiles = allFiles.filter(file => file !== facadeFile);
            return [facadeFile, ...otherFiles];
            
        } catch (error) {
            console.error('❌ Error al organizar fotos:', error.message);
            return [];
        }
    }

    /**
     * Run automatic optimization check
     */
    runOptimizationCheck(filepath) {
        try {
            const filename = path.basename(filepath);
            const checkScript = path.join(__dirname, '..', 'verificar-optimizaciones.sh');
            
            console.log('🔍 EJECUTANDO VERIFICACIÓN AUTOMÁTICA...');
            const result = execSync(`"${checkScript}" "${filename}"`, { 
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            console.log(result);
            
            // Verificar si está listo para publicar
            if (result.includes('LISTO PARA PUBLICAR')) {
                console.log('✅ VERIFICACIÓN PASSED - READY TO PUBLISH');
            } else {
                console.warn('⚠️  VERIFICACIÓN FAILED - REVIEW REQUIRED');
            }
            
            return true;
        } catch (error) {
            console.warn('⚠️  Error en verificación automática:', error.message);
            return false;
        }
    }

    /**
     * Scan photo directory for property images
     */
    scanPropertyPhotos(propertyKey) {
        const photoDir = path.join(this.imagesDirectory, propertyKey);
        
        if (!fs.existsSync(photoDir)) {
            console.warn(`⚠️ Photo directory not found: ${photoDir}`);
            return [];
        }

        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const photos = fs.readdirSync(photoDir)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return allowedExtensions.includes(ext);
            })
            .map(file => ({
                filename: file,
                path: `images/${propertyKey}/${file}`,
                caption: this.generateCaption(file)
            }));

        console.log(`📸 Found ${photos.length} photos for ${propertyKey}`);
        return photos;
    }

    /**
     * Generate caption from filename
     */
    generateCaption(filename) {
        // Remove extension and clean filename
        const name = path.parse(filename).name;
        
        // Common caption mappings
        const captionMap = {
            'fachada': 'Fachada Principal',
            'sala': 'Sala',
            'comedor': 'Comedor',
            'cocina': 'Cocina',
            'recamara': 'Recámara',
            'bano': 'Baño',
            'bathroom': 'Baño',
            'kitchen': 'Cocina',
            'living': 'Sala',
            'bedroom': 'Recámara',
            'garage': 'Garage',
            'jardin': 'Jardín',
            'patio': 'Patio',
            'area_servicio': 'Área de Servicio',
            'estacionamiento': 'Estacionamiento'
        };

        // Try to match patterns in filename
        for (const [key, caption] of Object.entries(captionMap)) {
            if (name.toLowerCase().includes(key)) {
                return caption;
            }
        }

        // Default caption based on index
        if (name.includes('1') || name.includes('01')) return 'Vista Principal';
        if (name.includes('2') || name.includes('02')) return 'Vista Interior';
        if (name.includes('3') || name.includes('03')) return 'Área Common';
        
        return 'Vista General';
    }

    /**
     * Generate carousel HTML for photos
     */
    generateCarouselHTML(photos, isHero = false) {
        const slides = photos.map((photo, index) => `
                    <div class="carousel-slide${index === 0 ? ' active' : ''}" data-slide="${index}">
                        <picture>
                            <img src="${photo.path}" alt="${photo.caption}" class="carousel-image gallery-image${index === 0 && isHero ? ' main-image' : ''}" loading="lazy">
                        </picture>
                        <div class="image-caption">${photo.caption}</div>
                    </div>`).join('');

        const dots = photos.map((_, index) => 
            `<button class="carousel-dot${index === 0 ? ' active' : ''}" onclick="${isHero ? 'goToSlideHero' : 'goToSlide'}(${index})" aria-label="Ir a foto ${index + 1}"></button>`
        ).join('\n                    ');

        const arrowFunction = isHero ? 'changeSlideHero' : 'changeSlide';

        return `
                <div class="carousel-wrapper">
${slides}
                    
                    <!-- Navigation arrows -->
                    <button class="carousel-arrow carousel-prev" onclick="${arrowFunction}(-1)" aria-label="Foto anterior">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="carousel-arrow carousel-next" onclick="${arrowFunction}(1)" aria-label="Siguiente foto">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <!-- Dots indicators -->
                <div class="carousel-dots">
                    ${dots}
                </div>`;
    }

    /**
     * Generate JavaScript for carousels
     */
    generateCarouselJS(totalSlides) {
        return `
        // GALLERY CAROUSEL (main gallery)
        let currentSlide = 0;
        const totalSlides = ${totalSlides};
        let touchStartX = 0;
        let touchEndX = 0;
        
        function showSlide(n) {
            const slides = document.querySelectorAll('.gallery .carousel-slide');
            const dots = document.querySelectorAll('.gallery .carousel-dot');
            
            if (n >= totalSlides) currentSlide = 0;
            if (n < 0) currentSlide = totalSlides - 1;
            
            slides.forEach((slide, index) => {
                slide.classList.remove('active');
                if (index === currentSlide) {
                    slide.classList.add('active');
                }
            });
            
            dots.forEach((dot, index) => {
                dot.classList.remove('active');
                if (index === currentSlide) {
                    dot.classList.add('active');
                }
            });
        }
        
        function changeSlide(direction) {
            currentSlide += direction;
            showSlide(currentSlide);
        }
        
        function goToSlide(n) {
            currentSlide = n;
            showSlide(currentSlide);
        }
        
        // Touch/swipe support for mobile - GALLERY CAROUSEL ONLY
        const carouselWrapper = document.querySelector('.gallery .carousel-wrapper');
        
        if (carouselWrapper) {
            carouselWrapper.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            });
            
            carouselWrapper.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            });
        }
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    changeSlide(1);
                } else {
                    changeSlide(-1);
                }
            }
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                changeSlide(-1);
            } else if (e.key === 'ArrowRight') {
                changeSlide(1);
            }
        });

        // HERO CAROUSEL FUNCTIONS (separate from gallery carousel)
        let currentSlideHero = 0;
        const totalSlidesHero = ${totalSlides};
        let touchStartXHero = 0;
        let touchEndXHero = 0;
        
        function showSlideHero(n) {
            const slides = document.querySelectorAll('.hero-image .carousel-slide');
            const dots = document.querySelectorAll('.hero-image .carousel-dot');
            
            if (n >= totalSlidesHero) currentSlideHero = 0;
            if (n < 0) currentSlideHero = totalSlidesHero - 1;
            
            slides.forEach((slide, index) => {
                slide.classList.remove('active');
                if (index === currentSlideHero) {
                    slide.classList.add('active');
                }
            });
            
            dots.forEach((dot, index) => {
                dot.classList.remove('active');
                if (index === currentSlideHero) {
                    dot.classList.add('active');
                }
            });
        }
        
        function changeSlideHero(direction) {
            currentSlideHero += direction;
            showSlideHero(currentSlideHero);
        }
        
        function goToSlideHero(n) {
            currentSlideHero = n;
            showSlideHero(currentSlideHero);
        }
        
        // Touch/swipe support for hero carousel
        const carouselWrapperHero = document.querySelector('.hero-image .carousel-wrapper');
        
        if (carouselWrapperHero) {
            carouselWrapperHero.addEventListener('touchstart', (e) => {
                touchStartXHero = e.changedTouches[0].screenX;
            });
            
            carouselWrapperHero.addEventListener('touchend', (e) => {
                touchEndXHero = e.changedTouches[0].screenX;
                handleSwipeHero();
            });
        }
        
        function handleSwipeHero() {
            const swipeThreshold = 50;
            const diff = touchStartXHero - touchEndXHero;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    changeSlideHero(1);
                } else {
                    changeSlideHero(-1);
                }
            }
        }

        // Expose functions globally for onclick handlers
        window.changeSlide = changeSlide;
        window.goToSlide = goToSlide;
        window.changeSlideHero = changeSlideHero;
        window.goToSlideHero = goToSlideHero;`;
    }

    /**
     * Generate personalized WhatsApp message
     */
    generateWhatsAppMessage(propertyData) {
        const priceText = this.isRental ? 
            `%24${propertyData.price.toLocaleString('es-MX').replace(/,/g, '%2C')}%20mensuales` :
            `%24${propertyData.price.toLocaleString('es-MX').replace(/,/g, '%2C')}`;
        const actionText = this.isRental ? 'renta' : 'venta';
        
        const message = `Hola%2C%20me%20interesa%20la%20casa%20en%20${actionText}%20en%20${encodeURIComponent(propertyData.location)}%20por%20${priceText}.%20%C2%BFPodr%C3%ADa%20darme%20m%C3%A1s%20informaci%C3%B3n%3F`;
        return `https://wa.me/528111652545?text=${message}`;
    }

    /**
     * Load and process template
     */
    loadTemplate() {
        if (!fs.existsSync(this.templatePath)) {
            throw new Error(`Template file not found: ${this.templatePath}`);
        }
        return fs.readFileSync(this.templatePath, 'utf8');
    }

    /**
     * Generate complete property page
     */
    generatePropertyPage(propertyData) {
        console.log(`🏗️ Generating property page for: ${propertyData.title}`);

        // Scan photos
        const photos = this.scanPropertyPhotos(propertyData.key);
        
        if (photos.length === 0) {
            throw new Error(`No photos found for property: ${propertyData.key}`);
        }

        // Load template
        const template = this.loadTemplate();

        // Generate carousel HTML
        const heroCarousel = this.generateCarouselHTML(photos, true);
        const galleryCarousel = this.generateCarouselHTML(photos, false);

        // Generate JavaScript
        const carouselJS = this.generateCarouselJS(photos.length);

        // Generate WhatsApp URL
        const whatsappURL = this.generateWhatsAppMessage(propertyData);

        // Replace template placeholders
        let htmlContent = template
            .replace(/{{PROPERTY_TITLE}}/g, propertyData.title)
            .replace(/{{PROPERTY_SUBTITLE}}/g, propertyData.subtitle)
            .replace(/{{PROPERTY_DESCRIPTION}}/g, propertyData.description)
            .replace(/{{PROPERTY_PRICE}}/g, `$${propertyData.price.toLocaleString('es-MX')}`)
            .replace(/{{PROPERTY_PRICE_NUMBER}}/g, propertyData.price.toString())
            .replace(/{{PROPERTY_LOCATION}}/g, propertyData.location)
            .replace(/{{PROPERTY_BEDROOMS}}/g, propertyData.bedrooms.toString())
            .replace(/{{PROPERTY_BATHROOMS}}/g, propertyData.bathrooms.toString())
            .replace(/{{PROPERTY_FEATURES}}/g, propertyData.features.join(', '))
            .replace(/{{HERO_CAROUSEL}}/g, heroCarousel)
            .replace(/{{GALLERY_CAROUSEL}}/g, galleryCarousel)
            .replace(/{{CAROUSEL_JAVASCRIPT}}/g, carouselJS)
            .replace(/{{WHATSAPP_URL}}/g, whatsappURL)
            .replace(/{{CANONICAL_URL}}/g, propertyData.canonicalURL)
            .replace(/{{OG_IMAGE}}/g, photos[0].path)
            .replace(/{{PROPERTY_KEY}}/g, propertyData.key);

        // Add performance optimizations
        htmlContent = this.addPerformanceOptimizations(htmlContent);

        return htmlContent;
    }

    /**
     * Add performance optimizations to HTML
     */
    addPerformanceOptimizations(html) {
        // Add DNS prefetch and preload
        const headOptimizations = `
    <!-- Performance Optimizations -->
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="dns-prefetch" href="//wa.me">
    <link rel="dns-prefetch" href="//api.whatsapp.com">
    
    <!-- Preload critical resources -->
    <link rel="preload" href="culiacan/infonavit-solidaridad/styles.css" as="style">
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" as="style">
    
    <!-- Optimized font loading -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet" media="print" onload="this.media='all'; this.onload=null;">
    <noscript>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet">
    </noscript>`;

        // Insert optimizations in head
        html = html.replace('</head>', `    ${headOptimizations}\n</head>`);

        // Wrap JavaScript in DOMContentLoaded
        html = html.replace('<script>', '<script>\ndocument.addEventListener("DOMContentLoaded", function() {');
        html = html.replace('</script>', '\n});\n</script>');

        return html;
    }

    /**
     * Save generated page to file
     */
    savePropertyPage(propertyData, htmlContent) {
        const filename = `casa-venta-${propertyData.key}.html`;
        const filepath = path.join(this.baseDirectory, filename);
        
        fs.writeFileSync(filepath, htmlContent, 'utf8');
        console.log(`✅ Property page saved: ${filepath}`);
        
        return filepath;
    }

    /**
     * Generate property page from configuration
     */
    generate(propertyConfig) {
        try {
            // 🎯 OPTIMIZACIÓN AUTOMÁTICA OBLIGATORIA
            console.log('🔄 INICIANDO PROCESO AUTOMÁTICO DE OPTIMIZACIÓN...');
            
            // 1. Auto-detectar carpeta de fotos en PROYECTOS
            const sourcePath = this.detectPhotosSource(propertyConfig.key, propertyConfig.title);
            if (sourcePath) {
                console.log(`📂 Fotos detectadas en: ${sourcePath}`);
                
                // 2. Optimizar fotos automáticamente
                const optimized = this.optimizePhotos(sourcePath, propertyConfig.key);
                if (optimized) {
                    console.log('✅ FOTOS OPTIMIZADAS AUTOMÁTICAMENTE');
                } else {
                    console.warn('⚠️  Error en optimización automática, continuando...');
                }
            } else {
                console.warn('⚠️  No se encontró carpeta de fotos en PROYECTOS, verificar manualmente');
            }
            
            // 3. Generar página HTML
            const htmlContent = this.generatePropertyPage(propertyConfig);
            const filepath = this.savePropertyPage(propertyConfig, htmlContent);
            
            // 4. Ejecutar verificación automática
            this.runOptimizationCheck(filepath);
            
            console.log(`🎉 Successfully generated property page for ${propertyConfig.title}`);
            console.log(`📁 File: ${filepath}`);
            console.log(`📸 Photos: ${this.scanPropertyPhotos(propertyConfig.key).length} images`);
            console.log('✅ PROCESO AUTOMÁTICO COMPLETADO - READY TO PUBLISH');
            
            return filepath;
        } catch (error) {
            console.error(`❌ Error generating property page: ${error.message}`);
            throw error;
        }
    }
}

// CLI Usage
if (require.main === module) {
    const generator = new PropertyPageGenerator();
    
    // Example property configuration
    const exampleProperty = {
        key: 'nueva-propiedad',
        title: 'Casa en Venta - Nueva Propiedad',
        subtitle: 'Hermosa casa en excelente ubicación',
        description: 'Casa funcional con todas las comodidades en zona privilegiada.',
        price: 1500000,
        location: 'Culiacán, Sinaloa',
        bedrooms: 3,
        bathrooms: 2,
        features: ['Cochera', 'Jardín', 'Cocina integral'],
        canonicalURL: 'https://casasenventa.info/casa-venta-nueva-propiedad/'
    };
    
    console.log('🚀 Property Page Generator');
    console.log('Usage: node property-page-generator.js');
    console.log('Edit the example configuration and run to generate a new property page.');
    
    // Uncomment to generate example page
    // generator.generate(exampleProperty);
}

module.exports = PropertyPageGenerator;