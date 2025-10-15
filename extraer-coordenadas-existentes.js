const fs = require('fs');
const path = require('path');

// 🎯 CONFIGURACIÓN
const CONFIG = {
    CULIACAN_DIR: 'culiacan',
    SOURCE_HTML: 'culiacan/index.html',
    OUTPUT_JSON: 'culiacan-propiedades-con-coordenadas.json'
};

console.log('🗺️ EXTRAYENDO COORDENADAS DE PROPIEDADES EN VENTA\n');

// 1️⃣ Leer HTML principal y extraer slugs de propiedades EN VENTA
console.log('📂 Leyendo culiacan/index.html...');
const indexHTML = fs.readFileSync(CONFIG.SOURCE_HTML, 'utf8');

const propiedades = [];
const cardRegex = /<!-- BEGIN CARD-ADV (.*?) -->([\s\S]*?)<!-- END CARD-ADV.*?-->/g;
let match;

while ((match = cardRegex.exec(indexHTML)) !== null) {
    const slug = match[1].trim();
    const cardHTML = match[2];

    // Verificar si es VENTA (no tiene bg-orange ni "/mes")
    const esRenta = cardHTML.includes('bg-orange-') || cardHTML.includes('/mes');

    if (!esRenta) {
        propiedades.push({ slug });
    }
}

console.log(`✅ ${propiedades.length} propiedades EN VENTA encontradas\n`);

// 2️⃣ Leer cada HTML individual y extraer coordenadas del iframe
console.log('🔍 Extrayendo coordenadas de cada propiedad...\n');

let exitosas = 0;
let fallidas = 0;

propiedades.forEach((prop, index) => {
    const htmlPath = path.join(CONFIG.CULIACAN_DIR, prop.slug, 'index.html');

    try {
        if (!fs.existsSync(htmlPath)) {
            console.log(`   ❌ [${index + 1}/${propiedades.length}] ${prop.slug} → Archivo no existe`);
            prop.lat = null;
            prop.lng = null;
            prop.tiene_coordenadas = false;
            fallidas++;
            return;
        }

        const html = fs.readFileSync(htmlPath, 'utf8');

        // Extraer coordenadas del iframe de Google Maps
        // Patrón: q=LAT,LNG o center=LAT,LNG o ll=LAT,LNG
        const patterns = [
            /[?&]q=([-\d.]+),([-\d.]+)/i,           // ?q=24.123,-107.456
            /[?&]center=([-\d.]+),([-\d.]+)/i,      // ?center=24.123,-107.456
            /[?&]ll=([-\d.]+),([-\d.]+)/i,          // ?ll=24.123,-107.456
            /@([-\d.]+),([-\d.]+),/i,                // @24.123,-107.456,15z
            /maps\/embed\?pb=.*!3d([-\d.]+)!4d([-\d.]+)/i // pb=...!3d24.123!4d-107.456
        ];

        let coordenadasEncontradas = false;

        for (const pattern of patterns) {
            const coordMatch = html.match(pattern);
            if (coordMatch) {
                const lat = parseFloat(coordMatch[1]);
                const lng = parseFloat(coordMatch[2]);

                // Validar que las coordenadas sean de Culiacán (aproximadamente)
                // Culiacán: lat ~24.8, lng ~-107.4
                if (lat >= 24.5 && lat <= 25.2 && lng >= -107.6 && lng <= -107.2) {
                    prop.lat = lat;
                    prop.lng = lng;
                    prop.tiene_coordenadas = true;
                    coordenadasEncontradas = true;
                    exitosas++;
                    console.log(`   ✅ [${index + 1}/${propiedades.length}] ${prop.slug.substring(0, 50)} → (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
                    break;
                }
            }
        }

        if (!coordenadasEncontradas) {
            prop.lat = null;
            prop.lng = null;
            prop.tiene_coordenadas = false;
            fallidas++;
            console.log(`   ❌ [${index + 1}/${propiedades.length}] ${prop.slug.substring(0, 50)} → Sin coordenadas válidas`);
        }

        // Extraer otros datos del HTML
        const precioMatch = html.match(/<meta\s+property="og:price:amount"\s+content="(\d+)"/i);
        const tituloMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
        const ubicacionMatch = html.match(/<meta\s+property="og:locality"\s+content="([^"]+)"/i) ||
                               html.match(/<address[^>]*>(.*?)<\/address>/i);

        prop.precio = precioMatch ? `$${parseInt(precioMatch[1]).toLocaleString()}` : null;
        prop.titulo = tituloMatch ? tituloMatch[1].replace(/<[^>]*>/g, '').trim() : prop.slug.replace(/-/g, ' ');
        prop.ubicacion = ubicacionMatch ? ubicacionMatch[1].trim() : 'Culiacán, Sinaloa';

    } catch (error) {
        prop.lat = null;
        prop.lng = null;
        prop.tiene_coordenadas = false;
        fallidas++;
        console.log(`   ❌ [${index + 1}/${propiedades.length}] ${prop.slug} → Error: ${error.message}`);
    }
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('✅ EXTRACCIÓN COMPLETADA\n');
console.log(`📊 Resultados:`);
console.log(`   ✅ Con coordenadas: ${exitosas} (${((exitosas / propiedades.length) * 100).toFixed(1)}%)`);
console.log(`   ❌ Sin coordenadas: ${fallidas} (${((fallidas / propiedades.length) * 100).toFixed(1)}%)`);
console.log(`   📦 Total: ${propiedades.length}`);
console.log('═══════════════════════════════════════════════════════════\n');

// 3️⃣ Guardar solo las propiedades CON coordenadas
const propiedadesConCoordenadas = propiedades.filter(p => p.tiene_coordenadas);

console.log(`💾 Guardando ${propiedadesConCoordenadas.length} propiedades con coordenadas...\n`);
fs.writeFileSync(CONFIG.OUTPUT_JSON, JSON.stringify(propiedadesConCoordenadas, null, 2), 'utf8');

console.log(`✅ Guardado en: ${CONFIG.OUTPUT_JSON}\n`);
console.log('🎯 SIGUIENTE PASO:');
console.log('   Ejecuta: node generar-culiacan-ghost-v2.js');
console.log('   Para generar el mapa con las coordenadas extraídas\n');
