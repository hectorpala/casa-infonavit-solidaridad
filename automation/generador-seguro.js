#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * GENERADOR SEGURO DE PROPIEDADES
 * Versión corregida que NO modifica archivos existentes innecesariamente
 */
class GeneradorSeguro {
    constructor(options = {}) {
        this.isRental = options.isRental || false;
        this.templatePath = this.isRental ? 
            './automation/templates/rental-template.html' : 
            './automation/templates/property-template.html';
        this.baseDirectory = './';
        this.imagesDirectory = './images/';
        
        // Opciones de seguridad
        this.autoDetectFacade = options.autoDetectFacade !== false;
        this.autoRenamePhotos = options.autoRenamePhotos !== false;
        this.autoOptimize = options.autoOptimize !== false;
        this.includePriceBadge = options.includePriceBadge !== false;
        
        // 🚫 ELIMINADO: autoUpdateIndexes - Era la función problemática
        // 🚫 ELIMINADO: Modificación automática de archivos existentes
        
        // ✅ AGREGADO: Validaciones de seguridad
        this.allowedFiles = []; // Solo los archivos que está permitido crear/modificar
        this.changeLog = [];     // Log de cambios para rollback
        this.safeMode = true;    // Modo seguro por defecto
    }

    /**
     * ✅ AGREGADO: Validación de archivos seguros
     */
    validateSafeOperation(filepath) {
        const safePatterns = [
            /^casa-(venta|renta)-[a-z0-9-]+\.html$/, // Solo páginas de propiedades nuevas
            /^images\/[a-z0-9-]+\/.*\.(jpg|jpeg|png|webp)$/i, // Solo imágenes de la propiedad
            /^automation\/contactos-propiedades\.json$/ // Solo el archivo de contactos
        ];
        
        const relativePath = path.relative(this.baseDirectory, filepath);
        const isSafe = safePatterns.some(pattern => pattern.test(relativePath));
        
        if (!isSafe && this.safeMode) {
            console.warn(`⚠️ BLOCKED: Intento de modificar archivo no seguro: ${relativePath}`);
            return false;
        }
        
        return true;
    }

    /**
     * ✅ AGREGADO: Backup automático antes de cambios
     */
    createBackup(filepath) {
        if (fs.existsSync(filepath)) {
            const backupPath = `${filepath}.backup.${Date.now()}`;
            fs.copyFileSync(filepath, backupPath);
            this.changeLog.push({ action: 'backup', original: filepath, backup: backupPath });
            console.log(`💾 Backup creado: ${backupPath}`);
        }
    }

    /**
     * ✅ MANTENIDO Y MEJORADO: Auto-detect facade (sin modificar archivos existentes)
     */
    async autoDetectFacadePhoto(photos, propertyKey) {
        if (!this.autoDetectFacade) return photos;

        console.log('🔍 Auto-detecting facade photo...');
        
        // Strategy 1: Largest file size (usually exterior shots)
        const photosWithSize = photos.map(photo => {
            const fullPath = path.join(this.imagesDirectory, propertyKey, photo.filename);
            if (!fs.existsSync(fullPath)) {
                console.warn(`⚠️ Photo not found: ${fullPath}`);
                return { ...photo, size: 0 };
            }
            const stats = fs.statSync(fullPath);
            return { ...photo, size: stats.size };
        }).sort((a, b) => b.size - a.size);

        // Strategy 2: Look for exterior indicators in filename
        const facadeKeywords = ['fachada', 'exterior', 'frente', 'front', 'facade'];
        let facadePhoto = photosWithSize.find(photo => 
            facadeKeywords.some(keyword => 
                photo.filename.toLowerCase().includes(keyword)
            )
        );

        // If not found by keywords, use largest file (likely exterior)
        if (!facadePhoto) {
            facadePhoto = photosWithSize[0];
        }

        // Move facade to first position
        const otherPhotos = photosWithSize.filter(p => p.filename !== facadePhoto.filename);
        const reorderedPhotos = [facadePhoto, ...otherPhotos];

        console.log(`✅ Facade detected: ${facadePhoto.filename}`);
        return reorderedPhotos;
    }

    /**
     * ✅ MANTENIDO Y MEJORADO: Auto-rename photos (solo para la propiedad nueva)
     */
    async renamePhotosIntelligently(photos, propertyKey) {
        if (!this.autoRenamePhotos) return photos;

        console.log('🏷️ Auto-renaming photos...');
        
        const descriptiveNames = [
            '01_fachada', '02_exterior', '03_sala', '04_recamara_principal',
            '05_recamara_secundaria', '06_bano', '07_cocina', '08_comedor',
            '09_cochera', '10_patio'
        ];

        const renamedPhotos = [];
        const photoDir = path.join(this.imagesDirectory, propertyKey);

        // ✅ VALIDACIÓN: Solo trabajar en la carpeta de la nueva propiedad
        if (!this.validateSafeOperation(photoDir)) {
            console.log('🚫 SKIPPED: Photo renaming blocked by safety check');
            return photos;
        }

        photos.forEach((photo, index) => {
            if (index < descriptiveNames.length) {
                const oldPath = path.join(photoDir, photo.filename);
                const newFilename = `${descriptiveNames[index]}.jpg`;
                const newPath = path.join(photoDir, newFilename);

                // Rename file
                if (fs.existsSync(oldPath)) {
                    fs.renameSync(oldPath, newPath);
                    console.log(`📄 Renamed: ${photo.filename} → ${newFilename}`);
                    
                    this.changeLog.push({ 
                        action: 'rename', 
                        from: oldPath, 
                        to: newPath,
                        property: propertyKey 
                    });
                    
                    renamedPhotos.push({
                        ...photo,
                        filename: newFilename,
                        path: `images/${propertyKey}/${newFilename}`
                    });
                }
            }
        });

        return renamedPhotos;
    }

    /**
     * ✅ MANTENIDO: Smart captions (sin cambios, es segura)
     */
    generateIntelligentCaption(filename, index, total) {
        const name = path.parse(filename).name.toLowerCase();
        
        const smartCaptions = {
            0: 'Fachada Principal',
            fachada: 'Fachada Principal',
            exterior: 'Vista Exterior',
            cochera: 'Cochera y Estacionamiento',
            garage: 'Cochera y Estacionamiento',
            sala: 'Sala de Estar',
            living: 'Sala de Estar',
            recamara: 'Recámara',
            bedroom: 'Recámara',
            'recamara_principal': 'Recámara Principal',
            'recamara_secundaria': 'Recámara Secundaria',
            bano: 'Baño Completo',
            bathroom: 'Baño Completo',
            cocina: 'Cocina Integral',
            kitchen: 'Cocina Integral',
            comedor: 'Comedor',
            dining: 'Comedor',
            patio: 'Patio y Área Exterior',
            jardin: 'Jardín',
            area_servicio: 'Área de Servicio',
            lavanderia: 'Área de Lavado'
        };

        // Check position first
        if (index === 0) return smartCaptions[0];

        // Check for keywords
        for (const [keyword, caption] of Object.entries(smartCaptions)) {
            if (name.includes(keyword)) {
                return caption;
            }
        }

        // Fallback based on position
        const fallbackCaptions = [
            'Fachada Principal', 'Vista Exterior', 'Sala de Estar', 'Recámara Principal',
            'Recámara Secundaria', 'Baño Completo', 'Cocina', 'Área Interior',
            'Cochera', 'Patio Posterior'
        ];

        return fallbackCaptions[index] || 'Vista Interior';
    }

    /**
     * ✅ MANTENIDO Y MEJORADO: Auto-optimize (sin cambios masivos)
     */
    addAutoOptimizations(htmlContent, photos, propertyData) {
        if (!this.autoOptimize) return htmlContent;

        console.log('⚡ Adding auto-optimizations...');

        // Get image dimensions
        const firstImagePath = path.join(this.imagesDirectory, propertyData.key, photos[0].filename);
        let imageDimensions = { width: 960, height: 960 }; // Default

        try {
            const identify = execSync(`identify "${firstImagePath}"`, { encoding: 'utf8' });
            const match = identify.match(/(\d+)x(\d+)/);
            if (match) {
                imageDimensions = { width: parseInt(match[1]), height: parseInt(match[2]) };
            }
        } catch (error) {
            console.warn('⚠️ Could not get image dimensions, using defaults');
        }

        // Add image dimensions to all carousel images
        htmlContent = htmlContent.replace(
            /class="carousel-image gallery-image[^"]*" loading="lazy"/g,
            `class="carousel-image gallery-image" loading="lazy" width="${imageDimensions.width}" height="${imageDimensions.height}"`
        );

        // Add preload for critical image
        const preloadTag = `    <link rel="preload" href="images/${propertyData.key}/${photos[0].filename}" as="image">`;
        htmlContent = htmlContent.replace(
            '</head>',
            `    ${preloadTag}\n</head>`
        );

        // Add defer to script tags
        htmlContent = htmlContent.replace(
            '<script>',
            '<script defer>'
        );

        console.log('✅ Auto-optimizations applied');
        return htmlContent;
    }

    /**
     * ✅ MANTENIDO: Price badge (sin cambios, es segura)
     */
    addPriceBadge(htmlContent, propertyData) {
        if (!this.includePriceBadge) return htmlContent;

        console.log('🏷️ Adding price badge...');
        
        const priceBadgeHTML = `
                <!-- Price Badge -->
                <div class="price-badge">
                    <span class="price-amount">$${propertyData.price.toLocaleString('es-MX')}</span>
                    <span class="price-label">${this.isRental ? 'En Renta' : 'En Venta'}</span>
                </div>
                `;

        // Insert price badge after hero carousel wrapper
        htmlContent = htmlContent.replace(
            /(onclick="changeSlideHero\(1\)"[^>]*>\s*<i class="fas fa-chevron-right"><\/i>\s*<\/button>\s*<\/div>)/,
            `$1${priceBadgeHTML}`
        );

        console.log('✅ Price badge added');
        return htmlContent;
    }

    /**
     * 🚫 ELIMINADO: updateIndexFiles() - Era la función que causaba problemas
     * ✅ REEMPLAZADO: Generar reporte de actualizaciones manuales
     */
    generateIndexUpdateReport(propertyData) {
        console.log('📋 Generando reporte de actualizaciones manuales...');
        
        const propertyCardHTML = this.generatePropertyCardHTML(propertyData);
        
        const report = `
🏠 REPORTE DE ACTUALIZACIÓN MANUAL DE ÍNDICES
=============================================

Nueva propiedad generada: ${propertyData.title}
Archivo creado: casa-${this.isRental ? 'renta' : 'venta'}-${propertyData.key}.html

📝 ARCHIVOS QUE NECESITAN ACTUALIZACIÓN MANUAL:

1. culiacan/index.html
2. index.html (si existe)

🔧 HTML A AGREGAR:
${propertyCardHTML}

⚠️ INSTRUCCIONES:
1. Abrir cada archivo de índice
2. Buscar la sección de propiedades
3. Agregar el HTML de arriba después de la última propiedad
4. Guardar y verificar

✅ SEGURIDAD: Esta propiedad NO modificará archivos existentes automáticamente.
`;

        console.log(report);
        
        // Guardar reporte en archivo
        const reportPath = `./reporte-actualizacion-${propertyData.key}.txt`;
        fs.writeFileSync(reportPath, report, 'utf8');
        console.log(`📄 Reporte guardado en: ${reportPath}`);
        
        return reportPath;
    }

    generatePropertyCardHTML(propertyData) {
        return `
                <!-- Casa ${propertyData.title} -->
                <a href="casa-${this.isRental ? 'renta' : 'venta'}-${propertyData.key}.html" class="property-card">
                    <img src="images/${propertyData.key}/01_fachada.jpg" alt="${propertyData.title}" class="property-image" loading="lazy">
                    <div class="property-content">
                        <div class="property-badge ${this.isRental ? 'rent' : 'sale'}">${this.isRental ? 'RENTA' : 'VENTA'}</div>
                        <h3 class="property-title">${propertyData.subtitle}</h3>
                        <p class="property-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${propertyData.location}
                        </p>
                        <div class="property-price">$${propertyData.price.toLocaleString('es-MX')}${this.isRental ? '/mes' : ''}</div>
                        <div class="property-features">
                            <span class="feature">${propertyData.bedrooms} Recámaras</span>
                            <span class="feature">${propertyData.bathrooms} Baño${propertyData.bathrooms > 1 ? 's' : ''}</span>
                            ${propertyData.features.slice(0, 2).map(f => `<span class="feature">${f}</span>`).join('')}
                        </div>
                        <div class="property-cta">Ver Detalles Completos</div>
                    </div>
                </a>`;
    }

    /**
     * ✅ SIMPLIFICADO: Save contact info (versión básica sin gestor)
     */
    async savePropertyContact(propertyConfig) {
        try {
            const contactsFile = './automation/contactos-propiedades.json';
            
            // ✅ VALIDACIÓN: Solo modificar archivo de contactos
            if (!this.validateSafeOperation(contactsFile)) {
                console.log('🚫 SKIPPED: Contact saving blocked by safety check');
                return;
            }

            // Crear backup antes de modificar
            this.createBackup(contactsFile);

            // Leer archivo de contactos existente
            let contactsData = { propiedades: {}, ultima_actualizacion: new Date().toISOString() };
            if (fs.existsSync(contactsFile)) {
                contactsData = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
            }

            // Agregar nueva propiedad
            const propiedadData = {
                titulo: propertyConfig.title || propertyConfig.subtitle,
                precio: typeof propertyConfig.price === 'number' ? 
                    `$${propertyConfig.price.toLocaleString('es-MX')}` : 
                    propertyConfig.price,
                ubicacion: propertyConfig.location,
                contacto: {
                    propietario: propertyConfig.contacto?.propietario || 'Por especificar',
                    telefono: propertyConfig.contacto?.telefono || 'Por especificar',
                    telefono_whatsapp: propertyConfig.contacto?.telefono_whatsapp || propertyConfig.contacto?.telefono || 'Por especificar',
                    email: propertyConfig.contacto?.email || 'Por especificar',
                    notas: propertyConfig.contacto?.notas || ''
                },
                detalles: {
                    recamaras: propertyConfig.bedrooms,
                    banos: propertyConfig.bathrooms,
                    tipo: this.isRental ? 'renta' : 'venta',
                    comision: propertyConfig.contacto?.comision || (this.isRental ? '1 mes' : '3%'),
                    disponible: true
                },
                fecha_agregada: new Date().toISOString().split('T')[0]
            };

            contactsData.propiedades[propertyConfig.key] = propiedadData;
            contactsData.ultima_actualizacion = new Date().toISOString();

            // Guardar archivo actualizado
            fs.writeFileSync(contactsFile, JSON.stringify(contactsData, null, 2), 'utf8');
            
            console.log('📞 Información de contacto guardada automáticamente');
            this.changeLog.push({ 
                action: 'contact_save', 
                property: propertyConfig.key,
                file: contactsFile 
            });

        } catch (error) {
            console.warn('⚠️ No se pudo guardar la información de contacto:', error.message);
        }
    }

    /**
     * ✅ NUEVO MÉTODO PRINCIPAL SEGURO
     */
    async generarConSeguridad(propertyConfig) {
        try {
            console.log(`🚀 GENERACIÓN SEGURA: ${propertyConfig.title}`);
            console.log('🛡️ Modo seguro activado - Solo archivos específicos serán modificados');
            
            // Validar que solo vamos a crear archivos seguros
            const newPageFile = `casa-${this.isRental ? 'renta' : 'venta'}-${propertyConfig.key}.html`;
            const newPagePath = path.join(this.baseDirectory, newPageFile);
            
            if (!this.validateSafeOperation(newPagePath)) {
                throw new Error('Operación bloqueada por validaciones de seguridad');
            }

            // 1. Scan and auto-organize photos
            let photos = this.scanPropertyPhotos(propertyConfig.key);
            
            // 2. Auto-detect facade
            photos = await this.autoDetectFacadePhoto(photos, propertyConfig.key);
            
            // 3. Auto-rename photos (solo para esta propiedad)
            photos = await this.renamePhotosIntelligently(photos, propertyConfig.key);
            
            // 4. Generate captions intelligently
            photos = photos.map((photo, index) => ({
                ...photo,
                caption: this.generateIntelligentCaption(photo.filename, index, photos.length)
            }));

            // 5. Generate HTML with basic template
            const PropertyPageGenerator = require('./property-page-generator.js');
            const basicGenerator = new PropertyPageGenerator(this.isRental);
            let htmlContent = basicGenerator.generatePropertyPage({
                ...propertyConfig,
                photos: photos // Use our enhanced photos
            });

            // 6. Add auto-optimizations
            htmlContent = this.addAutoOptimizations(htmlContent, photos, propertyConfig);
            
            // 7. Add price badge
            htmlContent = this.addPriceBadge(htmlContent, propertyConfig);

            // 8. Save the enhanced page (único archivo nuevo creado)
            this.createBackup(newPagePath); // Backup si existe
            fs.writeFileSync(newPagePath, htmlContent, 'utf8');
            this.changeLog.push({ action: 'create_page', file: newPagePath });

            // 9. 🚫 NO auto-update indexes - Generar reporte en su lugar
            const reportPath = this.generateIndexUpdateReport(propertyConfig);

            // 10. Save contact information (solo archivo de contactos)
            await this.savePropertyContact(propertyConfig);

            console.log(`🎉 GENERACIÓN SEGURA COMPLETADA!`);
            console.log(`📁 Archivo creado: ${newPagePath}`);
            console.log(`📸 Fotos: ${photos.length} optimized images`);
            console.log(`🔧 Optimizaciones: Applied automatically`);
            console.log(`📋 Reporte de actualización: ${reportPath}`);
            console.log(`📞 Contact info: Saved automatically`);
            console.log(`🛡️ Archivos seguros modificados: ${this.changeLog.length}`);
            
            return { 
                filepath: newPagePath, 
                reportPath: reportPath,
                changeLog: this.changeLog
            };

        } catch (error) {
            console.error(`❌ Generación segura falló: ${error.message}`);
            this.rollbackChanges();
            throw error;
        }
    }

    /**
     * ✅ AGREGADO: Rollback automático en caso de error
     */
    rollbackChanges() {
        console.log('🔄 Iniciando rollback de cambios...');
        
        this.changeLog.reverse().forEach(change => {
            try {
                switch (change.action) {
                    case 'backup':
                        if (fs.existsSync(change.backup)) {
                            fs.copyFileSync(change.backup, change.original);
                            fs.unlinkSync(change.backup);
                            console.log(`↶ Restored: ${change.original}`);
                        }
                        break;
                    case 'create_page':
                        if (fs.existsSync(change.file)) {
                            fs.unlinkSync(change.file);
                            console.log(`🗑️ Removed: ${change.file}`);
                        }
                        break;
                    case 'rename':
                        if (fs.existsSync(change.to)) {
                            fs.renameSync(change.to, change.from);
                            console.log(`↶ Renamed back: ${change.to} → ${change.from}`);
                        }
                        break;
                }
            } catch (error) {
                console.warn(`⚠️ Rollback failed for: ${change.action}`, error.message);
            }
        });
        
        console.log('✅ Rollback completed');
    }

    // Compatibility methods
    scanPropertyPhotos(propertyKey) {
        const PropertyPageGenerator = require('./property-page-generator.js');
        const basicGenerator = new PropertyPageGenerator(this.isRental);
        return basicGenerator.scanPropertyPhotos(propertyKey);
    }
}

// CLI Usage
if (require.main === module) {
    console.log('🛡️ Generador Seguro de Propiedades');
    console.log('Versión corregida que NO modifica archivos existentes');
    console.log('Usage: node generador-seguro.js');
}

module.exports = GeneradorSeguro;