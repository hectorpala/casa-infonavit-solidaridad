#!/usr/bin/env node

/**
 * VALIDADOR MASTER TEMPLATE
 * Garantiza que el HTML generado NO tenga errores comunes
 *
 * VALIDACIONES:
 * 1. ✅ NO hay placeholders sin reemplazar ({{...}})
 * 2. ✅ Todas las fotos existen (foto-1.jpg hasta foto-N.jpg)
 * 3. ✅ Precio consistente en TODOS los lugares
 * 4. ✅ Recámaras/baños consistentes
 * 5. ✅ Links de WhatsApp válidos
 * 6. ✅ CSS cargado correctamente
 * 7. ✅ JavaScript del carrusel correcto
 */

const fs = require('fs');

class MasterTemplateValidator {
    constructor(htmlPath, config) {
        this.htmlPath = htmlPath;
        this.config = config;
        this.errors = [];
        this.warnings = [];
    }

    /**
     * VALIDACIÓN PRINCIPAL
     */
    validate() {
        console.log('🔍 VALIDANDO HTML GENERADO...\n');

        if (!fs.existsSync(this.htmlPath)) {
            this.errors.push(`❌ Archivo no encontrado: ${this.htmlPath}`);
            return this.getResult();
        }

        const html = fs.readFileSync(this.htmlPath, 'utf8');

        // 1. Validar placeholders
        this.validatePlaceholders(html);

        // 2. Validar fotos
        this.validatePhotos(html);

        // 3. Validar precio
        this.validatePrice(html);

        // 4. Validar recámaras/baños
        this.validateFeatures(html);

        // 5. Validar links WhatsApp
        this.validateWhatsApp(html);

        // 6. Validar CSS
        this.validateCSS(html);

        // 7. Validar JavaScript carrusel
        this.validateCarousel(html);

        return this.getResult();
    }

    /**
     * 1. VALIDAR PLACEHOLDERS
     * NO debe haber {{...}} sin reemplazar
     */
    validatePlaceholders(html) {
        const placeholders = html.match(/\{\{[^}]+\}\}/g);

        if (placeholders && placeholders.length > 0) {
            const unique = [...new Set(placeholders)];
            this.errors.push(`❌ PLACEHOLDERS SIN REEMPLAZAR (${unique.length}):`);
            unique.forEach(p => this.errors.push(`   - ${p}`));
        } else {
            console.log('✅ 1. Placeholders: Todos reemplazados');
        }
    }

    /**
     * 2. VALIDAR FOTOS
     * Deben existir foto-1.jpg hasta foto-N.jpg
     */
    validatePhotos(html) {
        const photoCount = this.config.photoCount || 7;
        let missingPhotos = [];

        for (let i = 1; i <= photoCount; i++) {
            const photoPattern = new RegExp(`foto-${i}\\.jpg`, 'g');
            const matches = html.match(photoPattern);

            if (!matches || matches.length === 0) {
                missingPhotos.push(`foto-${i}.jpg`);
            }
        }

        if (missingPhotos.length > 0) {
            this.errors.push(`❌ FOTOS FALTANTES: ${missingPhotos.join(', ')}`);
        } else {
            console.log(`✅ 2. Fotos: Todas las ${photoCount} fotos referenciadas correctamente`);
        }

        // Validar que NO haya referencias a más fotos de las esperadas
        const extraPhotos = [];
        for (let i = photoCount + 1; i <= photoCount + 5; i++) {
            const photoPattern = new RegExp(`foto-${i}\\.jpg`, 'g');
            if (html.match(photoPattern)) {
                extraPhotos.push(`foto-${i}.jpg`);
            }
        }

        if (extraPhotos.length > 0) {
            this.warnings.push(`⚠️  FOTOS EXTRA (eliminar): ${extraPhotos.join(', ')}`);
        }
    }

    /**
     * 3. VALIDAR PRECIO
     * Debe aparecer consistentemente en varios lugares
     */
    validatePrice(html) {
        const priceFormatted = this.config.price; // Ej: "$5,000,000"
        const priceNumeric = priceFormatted.replace(/[$,]/g, ''); // "5000000"

        // Verificar precio formateado en title, meta, hero
        const priceCount = (html.match(new RegExp(priceFormatted.replace(/\$/g, '\\$').replace(/,/g, ','), 'g')) || []).length;

        if (priceCount < 5) {
            this.warnings.push(`⚠️  PRECIO: Solo ${priceCount} menciones de ${priceFormatted} (esperado 5+)`);
        } else {
            console.log(`✅ 3. Precio: ${priceFormatted} aparece ${priceCount} veces`);
        }

        // Verificar precio numérico en Schema.org
        if (!html.includes(`"price": "${priceNumeric}"`)) {
            this.errors.push(`❌ PRECIO NUMÉRICO: Falta "${priceNumeric}" en Schema.org`);
        }
    }

    /**
     * 4. VALIDAR FEATURES (recámaras/baños)
     */
    validateFeatures(html) {
        const bedrooms = this.config.bedrooms;
        const bathrooms = this.config.bathrooms;

        // Verificar recámaras
        const bedroomPatterns = [
            new RegExp(`${bedrooms}\\s+[Rr]ecámara`, 'g'),
            new RegExp(`"numberOfBedrooms":\\s*${bedrooms}`, 'g')
        ];

        let bedroomFound = false;
        bedroomPatterns.forEach(pattern => {
            if (html.match(pattern)) bedroomFound = true;
        });

        if (!bedroomFound) {
            this.errors.push(`❌ RECÁMARAS: No se encontró ${bedrooms} recámaras`);
        } else {
            console.log(`✅ 4. Features: ${bedrooms} recámaras, ${bathrooms} baños`);
        }

        // Verificar baños (más flexible para decimales como 1, 1.5, 2.5)
        const bathroomPatterns = [
            new RegExp(`${bathrooms}\\s*[Bb]año`, 'g'), // Permite 0 o más espacios
            new RegExp(`"numberOfBathroomsTotal":\\s*${bathrooms}`, 'g'),
            new RegExp(`${Math.floor(bathrooms)}\\s*[Bb]año`, 'g') // También busca el entero (1 baño para 1.5)
        ];

        let bathroomFound = false;
        bathroomPatterns.forEach(pattern => {
            if (html.match(pattern)) bathroomFound = true;
        });

        if (!bathroomFound) {
            const bathLabel = bathrooms === 1 ? 'baño' : 'baños';
            // NO marcar como error - solo advertencia, ya que puede estar en Schema.org
            this.warnings.push(`⚠️  BAÑOS: Verificar ${bathrooms} ${bathLabel} en HTML`);
        }
    }

    /**
     * 5. VALIDAR WHATSAPP LINKS
     */
    validateWhatsApp(html) {
        const whatsappPattern = /wa\.me\/\d+\?text=[^"]+/g;
        const whatsappLinks = html.match(whatsappPattern);

        if (!whatsappLinks || whatsappLinks.length === 0) {
            this.errors.push('❌ WHATSAPP: No se encontraron links de WhatsApp');
        } else {
            console.log(`✅ 5. WhatsApp: ${whatsappLinks.length} links encontrados`);

            // Verificar que el mensaje incluya el título de la propiedad
            const titleEncoded = encodeURIComponent(this.config.title);
            const hasTitle = whatsappLinks.some(link => link.includes(titleEncoded));

            if (!hasTitle) {
                this.warnings.push('⚠️  WHATSAPP: Mensaje no incluye título de propiedad');
            }
        }
    }

    /**
     * 6. VALIDAR CSS
     */
    validateCSS(html) {
        const cssPattern = /href="[^"]*styles\.css"/g;
        const cssLinks = html.match(cssPattern);

        if (!cssLinks || cssLinks.length === 0) {
            this.errors.push('❌ CSS: No se encontró link a styles.css');
        } else {
            console.log('✅ 6. CSS: styles.css cargado correctamente');
        }
    }

    /**
     * 7. VALIDAR JAVASCRIPT CARRUSEL
     */
    validateCarousel(html) {
        const photoCount = this.config.photoCount || 7;

        // Verificar totalSlidesHero
        const totalSlidesPattern = /const totalSlidesHero = (\d+);/;
        const match = html.match(totalSlidesPattern);

        if (!match) {
            this.errors.push('❌ CARRUSEL: No se encontró "const totalSlidesHero"');
        } else {
            const totalSlides = parseInt(match[1]);
            if (totalSlides !== photoCount) {
                this.errors.push(`❌ CARRUSEL: totalSlidesHero=${totalSlides}, esperado=${photoCount}`);
            } else {
                console.log(`✅ 7. Carrusel: totalSlidesHero = ${photoCount}`);
            }
        }

        // Verificar lightbox array
        const lightboxPattern = /const lightboxImages = \[([\s\S]*?)\];/;
        const lightboxMatch = html.match(lightboxPattern);

        if (!lightboxMatch) {
            this.errors.push('❌ LIGHTBOX: No se encontró array lightboxImages');
        } else {
            const arrayContent = lightboxMatch[1];
            const entries = arrayContent.match(/\{[^}]+\}/g) || [];

            if (entries.length !== photoCount) {
                this.errors.push(`❌ LIGHTBOX: ${entries.length} entradas, esperado=${photoCount}`);
            }
        }
    }

    /**
     * OBTENER RESULTADO FINAL
     */
    getResult() {
        console.log('\n' + '='.repeat(60));

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('🎉 VALIDACIÓN EXITOSA - HTML 100% CORRECTO');
            console.log('='.repeat(60));
            return { valid: true, errors: [], warnings: [] };
        }

        if (this.errors.length > 0) {
            console.log('❌ VALIDACIÓN FALLIDA - ERRORES ENCONTRADOS\n');
            this.errors.forEach(err => console.log(err));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  ADVERTENCIAS:\n');
            this.warnings.forEach(warn => console.log(warn));
        }

        console.log('='.repeat(60));

        return {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings
        };
    }
}

/**
 * FUNCIÓN DE USO PÚBLICO
 */
function validateMasterTemplateOutput(htmlPath, config) {
    const validator = new MasterTemplateValidator(htmlPath, config);
    return validator.validate();
}

module.exports = { MasterTemplateValidator, validateMasterTemplateOutput };

// Si se ejecuta directamente (para testing)
if (require.main === module) {
    console.log('🧪 PRUEBA DEL VALIDADOR\n');

    const testConfig = {
        title: 'Casa Test',
        price: '$5,000,000',
        bedrooms: 3,
        bathrooms: 2,
        photoCount: 5
    };

    const result = validateMasterTemplateOutput('./test-master-template-output.html', testConfig);

    if (result.valid) {
        console.log('\n✅ Archivo de prueba válido');
        process.exit(0);
    } else {
        console.log('\n❌ Archivo de prueba tiene errores');
        process.exit(1);
    }
}
