const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🗺️  Aplicando fix de mapa móvil a todas las propiedades...\n');

// Buscar todos los archivos index.html en culiacan/
const files = glob.sync('culiacan/*/index.html');

let updated = 0;
let skipped = 0;

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');

        // Verificar si tiene MARKER_CONFIG (tiene mapa)
        if (!content.includes('MARKER_CONFIG')) {
            skipped++;
            return;
        }

        // Verificar si ya tiene el fix aplicado (buscar el nuevo CSS)
        if (content.includes('/* Show map on mobile with adjusted height */')) {
            console.log(`⏭️  Ya aplicado: ${file}`);
            skipped++;
            return;
        }

        // Buscar el viejo CSS que oculta el mapa en móvil
        const oldMobileCss = /\/\* Hide map on mobile \*\/\s*@media \(max-width: 768px\) \{\s*\.location-map \{\s*display: none;\s*\}\s*\}/;

        if (content.match(oldMobileCss)) {
            // Reemplazar con el nuevo CSS que muestra el mapa
            const newMobileCss = `/* Show map on mobile with adjusted height */
        @media (max-width: 768px) {
            .location-map {
                padding: 2rem 0;
            }

            #map-container {
                height: 300px !important;
                border-radius: 8px;
            }

            .location-subtitle {
                font-size: 0.95rem;
                margin-bottom: 1.5rem;
            }
        }`;

            content = content.replace(oldMobileCss, newMobileCss);

            // Guardar archivo actualizado
            fs.writeFileSync(file, content, 'utf8');

            console.log(`✅ Actualizado: ${file}`);
            updated++;
        } else {
            console.log(`⚠️  No se encontró el patrón CSS en: ${file}`);
            skipped++;
        }

    } catch (error) {
        console.error(`❌ Error procesando ${file}:`, error.message);
        skipped++;
    }
});

console.log(`\n📊 Resumen:`);
console.log(`✅ Actualizados: ${updated}`);
console.log(`⏭️  Omitidos: ${skipped}`);
console.log(`📁 Total archivos: ${files.length}`);
console.log(`\n✨ Mapas ahora visibles en móvil con altura de 300px`);
