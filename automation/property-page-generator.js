#!/usr/bin/env node

/**
 * Property Page Generator - Opción 1: Integración Inteligente
 * Genera páginas individuales y actualiza listados existentes preservando todo el contenido
 */

const fs = require('fs');
const path = require('path');
const { setCoverFromBatch } = require('./fachada-detector-clip');

class PropertyPageGenerator {
    constructor(isRental = false) {
        this.isRental = isRental;
        this.templatesDir = './automation/templates';
        this.imagesDir = './images';
        this.projectsDir = '/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS';
    }

    /**
     * OPCIÓN 1: Función para extraer propiedades existentes de archivos HTML
     */
    extractExistingProperties(htmlFilePath) {
        try {
            if (!fs.existsSync(htmlFilePath)) {
                console.log(`⚠️  File ${htmlFilePath} not found, starting with empty property list`);
                return [];
            }

            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
            const properties = [];
            
            // Detectar tipo de estructura
            const isCuliacanPage = htmlFilePath.includes('culiacan');
            
            if (isCuliacanPage) {
                // Estructura Tailwind CSS para culiacan/index.html
                const propertyRegex = /<!-- BEGIN CARD-ADV [^>]+ -->(.*?)<!-- END CARD-ADV [^>]+ -->/gs;
                let match;

                while ((match = propertyRegex.exec(htmlContent)) !== null) {
                    const cardContent = match[1];
                    
                    // Extraer información de cada tarjeta Tailwind
                    const imageMatch = cardContent.match(/src="([^"]+)"/);
                    const titleMatch = cardContent.match(/<h3[^>]*>([^<]+)<\/h3>/);
                    const hrefMatch = cardContent.match(/data-href="([^"]+)"/);
                    const priceMatch = cardContent.match(/>\$([^<]+)<\/div>/);
                    
                    if (titleMatch) {
                        properties.push({
                            href: hrefMatch ? hrefMatch[1] : '',
                            title: titleMatch[1].trim(),
                            image: imageMatch ? imageMatch[1] : '',
                            price: priceMatch ? `$${priceMatch[1]}` : '',
                            fullCard: match[0] // Guardamos la tarjeta completa
                        });
                    }
                }
            } else {
                // Estructura clásica para index.html
                const propertyRegex = /<a href="([^"]+)"\s+class="property-card">(.*?)<\/a>/gs;
                let match;

                while ((match = propertyRegex.exec(htmlContent)) !== null) {
                    const href = match[1];
                    const cardContent = match[2];
                    
                    // Extraer información de cada tarjeta
                    const imageMatch = cardContent.match(/src="([^"]+)"/);
                    const titleMatch = cardContent.match(/<h3[^>]*property-title[^>]*>([^<]+)<\/h3>/);
                    const locationMatch = cardContent.match(/<p[^>]*property-location[^>]*>(.*?)<\/p>/s);
                    const priceMatch = cardContent.match(/<div[^>]*property-price[^>]*>([^<]+)/);
                    const badgeMatch = cardContent.match(/<div[^>]*property-badge[^>]*>([^<]+)<\/div>/);
                    
                    if (titleMatch) {
                        properties.push({
                            href: href,
                            title: titleMatch[1].trim(),
                            image: imageMatch ? imageMatch[1] : '',
                            location: locationMatch ? locationMatch[1].replace(/<[^>]*>/g, '').trim() : '',
                            price: priceMatch ? priceMatch[1].trim() : '',
                            badge: badgeMatch ? badgeMatch[1].trim() : '',
                            fullCard: match[0] // Guardamos la tarjeta completa para preservar formato
                        });
                    }
                }
            }

            console.log(`✅ Extracted ${properties.length} existing properties from ${htmlFilePath}`);
            return properties;

        } catch (error) {
            console.error(`❌ Error extracting properties from ${htmlFilePath}:`, error.message);
            return [];
        }
    }

    /**
     * Función para generar nueva property card manteniendo el formato existente
     */
    generatePropertyCard(config, isForCuliacan = false) {
        const priceForUrl = config.price ? `-${config.price}` : '';
        const href = this.isRental ?
            `casa-renta-${config.key}${priceForUrl}.html` :
            `casa-venta-${config.key}${priceForUrl}.html`;
        
        const badge = this.isRental ? 'RENTA' : 'VENTA';
        const badgeClass = this.isRental ? 'rent' : 'sale';
        
        // Buscar la primera imagen disponible
        const photos = this.scanPropertyPhotos(config.key);
        const mainImage = photos.length > 0 ? 
            (isForCuliacan ? `../images/${config.key}/${photos[0]}` : `images/${config.key}/${photos[0]}`) : 
            (isForCuliacan ? `../images/${config.key}/fachada.jpg` : `images/${config.key}/fachada.jpg`);

        // Formato de precio
        const priceDisplay = this.isRental ? 
            `$${config.price.toLocaleString('es-MX')}/mes` :
            `$${config.price.toLocaleString('es-MX')}`;

        if (isForCuliacan) {
            // Estructura Tailwind CSS para culiacan/index.html que coincide EXACTAMENTE con Casa La Campiña
            const hrefPath = href.startsWith('casa-') ? `../${href}` : href;
            
            // Generar múltiples imágenes del carousel si existen (estructura EXACTA La Campiña)
            let carouselImages = '';
            if (photos.length > 0) {
                carouselImages = photos.map((photo, index) => {
                    const isActive = index === 0 ? ' active' : ' hidden';
                    return `                        <img src="../images/${config.key}/${photo}" 
                 alt="${config.title} - Foto ${index + 1}" 
                 loading="lazy" 
                 decoding="async"
                 class="w-full h-full object-cover carousel-image${isActive}">`;
                }).join('\n');
            } else {
                carouselImages = `                        <img src="${mainImage}" 
                 alt="${config.title}" 
                 loading="lazy" 
                 decoding="async"
                 class="w-full h-full object-cover carousel-image active">`;
            }
            
            // Generar navigation arrows solo si hay múltiples fotos (estructura EXACTA La Campiña)
            const navigationArrows = photos.length > 1 ? `
                        
                        <!-- Navigation arrows - FUNCIONES EXISTENTES -->
                        <button class="carousel-arrow carousel-prev" onclick="changeImage(this.parentElement, -1)" aria-label="Imagen anterior">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="carousel-arrow carousel-next" onclick="changeImage(this.parentElement, 1)" aria-label="Siguiente imagen">
                            <i class="fas fa-chevron-right"></i>
                        </button>` : '';
            
            return `            <!-- BEGIN CARD-ADV ${config.key} -->
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow property-card relative" 
                 data-href="${hrefPath}">
                <div class="relative aspect-video">
                    <!-- PRICE BADGE OBLIGATORIO (estructura EXACTA La Campiña) -->
                    <div class="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold z-20">
                        ${priceDisplay}
                    </div>
                    
                    <!-- CAROUSEL CONTAINER - ESTRUCTURA COMPATIBLE CON JS EXISTENTE -->
                    <div class="carousel-container" data-current="0">
${carouselImages}${navigationArrows}
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
                    <h3 class="text-2xl font-bold text-gray-900 mb-1 font-poppins">${priceDisplay}</h3>
                    <p class="text-gray-600 mb-4 font-poppins">${config.title} · Culiacán</p>
                    
                    <!-- PROPERTY DETAILS CON SVG ICONS (estructura EXACTA La Campiña) -->
                    <div class="flex flex-wrap gap-3 mb-6">
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            </svg>
                            ${config.bedrooms} Recámaras
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l3-3 3 3M5 10v11a1 1 0 001 1h3M20 10v11a1 1 0 01-1 1h-3"></path>
                            </svg>
                            ${config.bathrooms} Baños
                        </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-5H8z"></path>
                                </svg>
                                ${config.features && config.features.length > 0 ? config.features[0] : '2 pisos'}
                            </div>
                        <div class="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                </svg>
                                ${config.features && config.features.length > 1 ? config.features[1] : 'Aire acondicionado'}
                            </div>
                    </div>
                    
                    <!-- WHATSAPP BUTTON (estructura EXACTA La Campiña) -->
                    <a href="https://wa.me/528111652545?text=${encodeURIComponent(`Hola, me interesa la ${config.title} por ${priceDisplay}. ¿Podría darme más información?`)}" 
                       class="w-full btn-primary text-center block" 
                       target="_blank" rel="noopener noreferrer">
                        <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"></path>
                        </svg>
                        Solicitar tour
                    </a>
                </div>
            </div>
            <!-- END CARD-ADV ${config.key} -->`;
        } else {
            // Estructura clásica para index.html
            // Generar features basadas en la configuración
            let featuresHtml = '';
            if (config.bedrooms) {
                featuresHtml += `<span>🛏️ ${config.bedrooms} Recámaras</span>\n                            `;
            }
            if (config.bathrooms) {
                featuresHtml += `<span>🚿 ${config.bathrooms} Baños</span>\n                            `;
            }
            if (config.features && config.features.length > 0) {
                // Agregar las primeras 2 características adicionales
                const additionalFeatures = config.features.slice(0, 2);
                additionalFeatures.forEach(feature => {
                    featuresHtml += `<span>${feature}</span>\n                            `;
                });
            }

            // Template de property card que coincide con el formato existente
            return `                <!-- ${config.title} -->
                <a href="${href}" class="property-card">
                    <img src="${mainImage}" alt="${config.title}" class="property-image" loading="lazy">
                    <div class="property-content">
                        <div class="property-badge ${badgeClass}">${badge}</div>
                        <h3 class="property-title">${config.title}</h3>
                        <p class="property-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${config.location}
                        </p>
                        <div class="property-price">${priceDisplay}</div>
                        <div class="property-features">
                            ${featuresHtml.trim()}
                        </div>
                        <div class="property-description">${config.description}</div>
                    </div>
                </a>`;
        }
    }

    /**
     * OPCIÓN 1: Función para generar listado integrado preservando contenido existente
     */
    generateIntegratedListing(newProperty, existingProperties, htmlFilePath) {
        try {
            // Leer el archivo HTML completo
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
            
            // Detectar tipo de estructura
            const isCuliacanPage = htmlFilePath.includes('culiacan');
            
            // Generar nueva property card
            const newPropertyCard = this.generatePropertyCard(newProperty, isCuliacanPage);
            
            let match, beforeGrid, afterGrid, newGridContent, updatedHtml;
            
            if (isCuliacanPage) {
                // Para culiacan/index.html, usar un enfoque más seguro que evite duplicaciones
                // Verificar si la propiedad ya existe antes de agregarla
                const propertyKey = newProperty.key;
                const existingPropertyIndex = existingProperties.findIndex(prop => 
                    prop.fullCard && prop.fullCard.includes(`BEGIN CARD-ADV ${propertyKey}`)
                );
                
                if (existingPropertyIndex !== -1) {
                    console.log(`⚠️  Property ${propertyKey} already exists in Culiacán, updating existing entry...`);
                    // Reemplazar la propiedad existente en lugar de agregar una nueva
                    existingProperties[existingPropertyIndex].fullCard = newPropertyCard;
                    
                    // Reconstruir con propiedades existentes (incluye la actualizada)
                    const allPropertyCards = [];
                    existingProperties.forEach(prop => {
                        allPropertyCards.push(prop.fullCard);
                    });
                    
                    // Encontrar límites de las tarjetas
                    const firstCardRegex = /<!-- BEGIN CARD-ADV [^>]+ -->/;
                    const lastCardRegex = /<!-- END CARD-ADV [^>]+ -->/g;
                    
                    const firstCardMatch = htmlContent.match(firstCardRegex);
                    let lastCardMatch;
                    let match;
                    while ((match = lastCardRegex.exec(htmlContent)) !== null) {
                        lastCardMatch = match;
                    }
                    
                    if (firstCardMatch && lastCardMatch) {
                        const startIndex = firstCardMatch.index;
                        const endIndex = lastCardMatch.index + lastCardMatch[0].length;
                        
                        updatedHtml = htmlContent.substring(0, startIndex) +
                                     allPropertyCards.join('\n            ') +
                                     htmlContent.substring(endIndex);
                    } else {
                        throw new Error('Could not find property cards section in Culiacán HTML');
                    }
                } else {
                    console.log(`✅ Adding new property ${propertyKey} to Culiacán...`);
                    // Agregar nueva propiedad al principio
                    const firstCardRegex = /<!-- BEGIN CARD-ADV [^>]+ -->/;
                    const lastCardRegex = /<!-- END CARD-ADV [^>]+ -->/g;
                    
                    const firstCardMatch = htmlContent.match(firstCardRegex);
                    let lastCardMatch;
                    let match;
                    while ((match = lastCardRegex.exec(htmlContent)) !== null) {
                        lastCardMatch = match;
                    }
                    
                    if (firstCardMatch && lastCardMatch) {
                        const startIndex = firstCardMatch.index;
                        const endIndex = lastCardMatch.index + lastCardMatch[0].length;
                        
                        // Combinar nueva propiedad con existentes
                        const allPropertyCards = [newPropertyCard];
                        existingProperties.forEach(prop => {
                            allPropertyCards.push(prop.fullCard);
                        });
                        
                        updatedHtml = htmlContent.substring(0, startIndex) +
                                     allPropertyCards.join('\n            ') +
                                     htmlContent.substring(endIndex);
                    } else {
                        throw new Error('Could not find property cards section in Culiacán HTML');
                    }
                }
            } else {
                // Para index.html, estructura property-grid - aplicar misma lógica anti-duplicación
                const propertyKey = newProperty.key;
                const priceForUrl = newProperty.price ? `-${newProperty.price}` : '';
                const propertyHref = this.isRental ?
                    `casa-renta-${propertyKey}${priceForUrl}.html` :
                    `casa-venta-${propertyKey}${priceForUrl}.html`;
                    
                const existingPropertyIndex = existingProperties.findIndex(prop => 
                    prop.href && prop.href.includes(propertyHref)
                );
                
                const gridStartMarker = '<div class="property-grid">';
                const gridEndMarker = '            </div>\n        </div>\n    </section>';
                
                const startIndex = htmlContent.indexOf(gridStartMarker);
                const endIndex = htmlContent.indexOf(gridEndMarker, startIndex);
                
                if (startIndex === -1 || endIndex === -1) {
                    throw new Error('Property grid boundaries not found in HTML');
                }
                
                let allPropertyCards;
                
                if (existingPropertyIndex !== -1) {
                    console.log(`⚠️  Property ${propertyKey} already exists in main index, updating existing entry...`);
                    // Reemplazar la propiedad existente
                    existingProperties[existingPropertyIndex].fullCard = newPropertyCard;
                    
                    allPropertyCards = [];
                    existingProperties.forEach(prop => {
                        allPropertyCards.push(prop.fullCard);
                    });
                } else {
                    console.log(`✅ Adding new property ${propertyKey} to main index...`);
                    // Agregar nueva propiedad al principio
                    allPropertyCards = [newPropertyCard];
                    existingProperties.forEach(prop => {
                        allPropertyCards.push(prop.fullCard);
                    });
                }
                
                const newGridSection = gridStartMarker + '\n' +
                    allPropertyCards.join('\n\n') + '\n\n' +
                    '            </div>';
                
                // Reemplazar la sección completa del grid
                updatedHtml = htmlContent.substring(0, startIndex) +
                             newGridSection +
                             htmlContent.substring(endIndex);
            }

            // Escribir archivo actualizado
            fs.writeFileSync(htmlFilePath, updatedHtml, 'utf8');
            
            // Calcular total correcto basado en si se agregó o actualizó
            const propertyKey = newProperty.key;
            const priceForUrl = newProperty.price ? `-${newProperty.price}` : '';
            const wasUpdated = isCuliacanPage ?
                existingProperties.some(prop => prop.fullCard && prop.fullCard.includes(`BEGIN CARD-ADV ${propertyKey}`)) :
                existingProperties.some(prop => {
                    const propertyHref = this.isRental ? `casa-renta-${propertyKey}${priceForUrl}.html` : `casa-venta-${propertyKey}${priceForUrl}.html`;
                    return prop.href && prop.href.includes(propertyHref);
                });
            
            const totalProperties = wasUpdated ? existingProperties.length : existingProperties.length + 1;
            const actionText = wasUpdated ? 'updated existing' : `${existingProperties.length} existing + 1 new`;
            console.log(`✅ Updated ${htmlFilePath} with ${totalProperties} properties (${actionText})`);
            
            return totalProperties;

        } catch (error) {
            console.error(`❌ Error updating ${htmlFilePath}:`, error.message);
            throw error;
        }
    }

    /**
     * Validación pre-deploy: verificar que el número de propiedades sea correcto
     */
    validatePropertyCount(htmlFilePath, expectedCount) {
        try {
            const properties = this.extractExistingProperties(htmlFilePath);
            const actualCount = properties.length;
            
            if (actualCount === expectedCount) {
                console.log(`✅ Validation passed: ${htmlFilePath} has ${actualCount} properties (expected ${expectedCount})`);
                return true;
            } else {
                console.error(`❌ Validation failed: ${htmlFilePath} has ${actualCount} properties, expected ${expectedCount}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error validating ${htmlFilePath}:`, error.message);
            return false;
        }
    }

    /**
     * Función principal de generación con integración inteligente
     */
    async generate(config) {
        console.log(`🏠 Generating property with intelligent integration: ${config.title}`);

        // 1. Extraer propiedades existentes de ambos archivos
        console.log('\n📖 Step 1: Reading existing properties...');
        const existingIndexProperties = this.extractExistingProperties('./index.html');
        const existingCuliacanProperties = this.extractExistingProperties('./culiacan/index.html');

        // 2. Generar página individual (con detección automática de fachada)
        console.log('\n📄 Step 2: Generating individual property page...');
        const individualPagePath = await this.generateIndividualPage(config);
        
        // 3. Actualizar listados preservando contenido existente
        console.log('\n🔗 Step 3: Updating property listings...');
        
        try {
            // Actualizar index.html principal
            const newIndexCount = this.generateIntegratedListing(
                config, 
                existingIndexProperties, 
                './index.html'
            );
            
            // Actualizar culiacan/index.html
            const newCuliacanCount = this.generateIntegratedListing(
                config, 
                existingCuliacanProperties, 
                './culiacan/index.html'
            );
            
            // 4. Validación pre-deploy
            console.log('\n✅ Step 4: Pre-deploy validation...');
            const indexValid = this.validatePropertyCount('./index.html', newIndexCount);
            const culiacanValid = this.validatePropertyCount('./culiacan/index.html', newCuliacanCount);
            
            if (indexValid && culiacanValid) {
                console.log('\n🎉 SUCCESS: Property integration completed successfully!');
                console.log(`📊 Statistics:`);
                console.log(`   - Individual page: ${individualPagePath}`);
                console.log(`   - Index properties: ${newIndexCount} total`);
                console.log(`   - Culiacán properties: ${newCuliacanCount} total`);
                console.log('   - All validations passed ✅');
                console.log('\n🚀 READY TO PUBLISH - All existing properties preserved');
                
                return individualPagePath;
            } else {
                throw new Error('Pre-deploy validation failed');
            }
            
        } catch (error) {
            console.error('❌ Error during integration:', error.message);
            throw error;
        }
    }

    /**
     * Generar página individual de la propiedad
     */
    async generateIndividualPage(config) {
        // Procesar fotos primero (ahora con detección automática de fachada)
        await this.processPropertyPhotos(config);
        
        // Generar página individual usando template PERFECTO
        const template = this.isRental ? 'rental-template-perfect.html' : 'property-template.html';
        const templatePath = path.join(this.templatesDir, template);
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }
        
        let htmlContent = fs.readFileSync(templatePath, 'utf8');
        
        // Reemplazar placeholders
        htmlContent = this.replaceTemplatePlaceholders(htmlContent, config);
        
        // Generar filename con precio incluido
        const priceForUrl = config.price ? `-${config.price}` : '';
        const filename = this.isRental ?
            `casa-renta-${config.key}${priceForUrl}.html` :
            `casa-venta-${config.key}${priceForUrl}.html`;
        
        // Escribir archivo
        fs.writeFileSync(filename, htmlContent, 'utf8');
        
        console.log(`✅ Individual page generated: ${filename}`);
        return filename;
    }

    /**
     * Procesar fotos de la propiedad (auto-detección y optimización)
     */
    async processPropertyPhotos(config) {
        const sourceDir = config.fotos_origen || path.join(this.projectsDir, config.key);
        const targetDir = path.join(this.imagesDir, config.key);

        console.log(`📸 Processing photos: ${sourceDir} → ${targetDir}`);

        // Crear directorio destino si no existe
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Auto-detectar y copiar fotos (simplificado por ahora)
        if (fs.existsSync(sourceDir)) {
            const files = fs.readdirSync(sourceDir)
                .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

            console.log(`📸 Found ${files.length} photos to process`);

            files.forEach(file => {
                const sourcePath = path.join(sourceDir, file);
                const targetPath = path.join(targetDir, file);

                if (!fs.existsSync(targetPath)) {
                    fs.copyFileSync(sourcePath, targetPath);
                    console.log(`   ✅ Copied: ${file}`);
                }
            });

            // 🤖 DETECCIÓN AUTOMÁTICA DE FACHADA (CLIP OFFLINE)
            // Ejecutar después de copiar todas las fotos
            if (files.length > 0) {
                try {
                    console.log('\n🤖 Iniciando detección automática de fachada (CLIP offline)...');
                    await setCoverFromBatch(targetDir, targetDir);
                    console.log('✅ Detección de fachada completada\n');
                } catch (error) {
                    console.warn(`⚠️  No se pudo ejecutar detección de fachada: ${error.message}`);
                    console.warn('💡 Asegúrate de tener instalado: npm install @xenova/transformers\n');
                }
            }
        }
    }

    /**
     * Escanear fotos de la propiedad
     * Prioriza cover.jpg (generado por CLIP) como primera foto
     */
    scanPropertyPhotos(propertyKey) {
        const photosDir = path.join(this.imagesDir, propertyKey);

        if (!fs.existsSync(photosDir)) {
            return [];
        }

        const allPhotos = fs.readdirSync(photosDir)
            .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
            .sort();

        // Si existe cover.jpg (generado por CLIP), ponerlo primero
        const coverIndex = allPhotos.findIndex(f => f.toLowerCase() === 'cover.jpg');
        if (coverIndex > 0) {
            const cover = allPhotos.splice(coverIndex, 1)[0];
            allPhotos.unshift(cover);
        }

        return allPhotos;
    }

    /**
     * Reemplazar placeholders en template
     */
    replaceTemplatePlaceholders(content, config) {
        const photos = this.scanPropertyPhotos(config.key);
        const mainPhoto = photos.length > 0 ? `images/${config.key}/${photos[0]}` : '';
        
        const replacements = {
            '{{PROPERTY_TITLE}}': config.title || '',
            '{{PROPERTY_SUBTITLE}}': config.subtitle || '',
            '{{PROPERTY_DESCRIPTION}}': config.description || '',
            '{{PROPERTY_LOCATION}}': config.location || '',
            '{{PROPERTY_BEDROOMS}}': config.bedrooms || 0,
            '{{PROPERTY_BATHROOMS}}': config.bathrooms || 0,
            '{{PROPERTY_PRICE}}': this.isRental ? 
                `$${config.price.toLocaleString('es-MX')}/mes` :
                `$${config.price.toLocaleString('es-MX')}`,
            '{{PROPERTY_PRICE_NUMBER}}': config.price || 0,
            '{{PROPERTY_FEATURES}}': config.features ? config.features.join(', ') : '',
            '{{CANONICAL_URL}}': config.canonicalURL || '',
            '{{PROPERTY_KEY}}': config.key || '',
            '{{OG_IMAGE}}': mainPhoto,
            '{{WHATSAPP_URL}}': this.generateWhatsAppURL(config),
            '{{HERO_CAROUSEL}}': this.generateCarousel(photos, config.key, 'hero'),
            '{{GALLERY_CAROUSEL}}': this.generateCarousel(photos, config.key, 'gallery'),
            '{{CAROUSEL_JAVASCRIPT}}': this.generateCarouselJS(),
            '{{TOTAL_IMAGES}}': photos.length
        };
        
        let result = content;
        for (const [placeholder, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(placeholder, 'g'), value);
        }
        
        return result;
    }

    /**
     * Generar URL de WhatsApp
     */
    generateWhatsAppURL(config) {
        const phone = config.whatsapp_e164 || '+528111652545';
        const message = this.isRental ?
            `Hola! Me interesa la casa en renta "${config.title}" por $${config.price.toLocaleString('es-MX')}/mes en ${config.location}. ¿Podrían darme más información?` :
            `Hola! Me interesa la casa en venta "${config.title}" por $${config.price.toLocaleString('es-MX')} en ${config.location}. ¿Podrían darme más información?`;
        
        return `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    }

    /**
     * Generar HTML del carousel
     */
    generateCarousel(photos, propertyKey, type = 'gallery') {
        if (photos.length === 0) {
            return '<p>No hay fotos disponibles</p>';
        }

        const carouselId = `${type}-carousel-${propertyKey}`;
        let html = `<div class="carousel" id="${carouselId}">\n`;
        html += `    <div class="carousel-track">\n`;
        
        photos.forEach((photo, index) => {
            const isActive = index === 0 ? ' active' : '';
            html += `        <div class="slide${isActive}">\n`;
            html += `            <img src="images/${propertyKey}/${photo}" alt="Foto ${index + 1}" loading="${index === 0 ? 'eager' : 'lazy'}">\n`;
            html += `        </div>\n`;
        });
        
        html += `    </div>\n`;
        
        if (photos.length > 1) {
            html += `    <button class="carousel-btn prev" onclick="changeImage(document.getElementById('${carouselId}'), -1)">‹</button>\n`;
            html += `    <button class="carousel-btn next" onclick="changeImage(document.getElementById('${carouselId}'), 1)">›</button>\n`;
            html += `    <div class="carousel-indicators">\n`;
            
            photos.forEach((_, index) => {
                const isActive = index === 0 ? ' active' : '';
                html += `        <span class="indicator${isActive}" onclick="goToSlide(document.getElementById('${carouselId}'), ${index})"></span>\n`;
            });
            
            html += `    </div>\n`;
        }
        
        html += `</div>`;
        return html;
    }

    /**
     * Generar JavaScript del carousel
     */
    generateCarouselJS() {
        return `    // Carousel functionality
    function changeImage(carousel, direction) {
        const track = carousel.querySelector('.carousel-track');
        const slides = carousel.querySelectorAll('.slide');
        const indicators = carousel.querySelectorAll('.indicator');
        const currentSlide = carousel.querySelector('.slide.active');
        const currentIndex = Array.from(slides).indexOf(currentSlide);
        
        let newIndex = currentIndex + direction;
        if (newIndex >= slides.length) newIndex = 0;
        if (newIndex < 0) newIndex = slides.length - 1;
        
        // Update slides
        slides.forEach(slide => slide.classList.remove('active'));
        slides[newIndex].classList.add('active');
        
        // Update indicators
        if (indicators.length > 0) {
            indicators.forEach(indicator => indicator.classList.remove('active'));
            indicators[newIndex].classList.add('active');
        }
        
        // Move track
        const translateX = -newIndex * 100;
        track.style.transform = \`translateX(\${translateX}%)\`;
    }
    
    function goToSlide(carousel, index) {
        const track = carousel.querySelector('.carousel-track');
        const slides = carousel.querySelectorAll('.slide');
        const indicators = carousel.querySelectorAll('.indicator');
        
        // Update slides
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
        
        // Update indicators
        if (indicators.length > 0) {
            indicators.forEach(indicator => indicator.classList.remove('active'));
            indicators[index].classList.add('active');
        }
        
        // Move track
        const translateX = -index * 100;
        track.style.transform = \`translateX(\${translateX}%)\`;
    }

    // Auto-advance carousel every 5 seconds
    document.querySelectorAll('.carousel').forEach(carousel => {
        setInterval(() => {
            changeImage(carousel, 1);
        }, 5000);
    });`;
    }
}

module.exports = PropertyPageGenerator;