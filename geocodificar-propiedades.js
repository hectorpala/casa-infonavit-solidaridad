const fs = require('fs');
const path = require('path');
const https = require('https');

// 🎯 CONFIGURACIÓN
const CONFIG = {
    SOURCE_HTML: 'culiacan/index.html',
    OUTPUT_JSON: 'culiacan-propiedades-geocodificadas.json',
    GOOGLE_API_KEY: 'AIzaSyBPqY9-hQ6JzqLNY9h9hU1DPCqU6Fuj-lw',
    BATCH_SIZE: 10,
    DELAY_BETWEEN_BATCHES: 2000 // 2 segundos entre batches
};

console.log('🗺️ GEOCODIFICANDO PROPIEDADES EN VENTA DE CULIACÁN\n');

// 1️⃣ Leer HTML y extraer propiedades
console.log('📂 Leyendo propiedades EN VENTA...');
const html = fs.readFileSync(CONFIG.SOURCE_HTML, 'utf8');

const propiedades = [];
const cardRegex = /<!-- BEGIN CARD-ADV (.*?) -->([\s\S]*?)<!-- END CARD-ADV.*?-->/g;
let match;
let count = 0;

while ((match = cardRegex.exec(html)) !== null) {
    const slug = match[1].trim();
    const cardHTML = match[2];

    // Extraer href
    const hrefMatch = cardHTML.match(/data-href="([^"]+)"/);
    const href = hrefMatch ? hrefMatch[1] : `${slug}/index.html`;

    // Extraer precio
    const precioMatch = cardHTML.match(/bg-(green|orange)-\d+[^>]*>(.*?)<\/div>/);
    const precio = precioMatch ? precioMatch[2].trim() : 'Consultar';
    const esRenta = cardHTML.includes('bg-orange-') || precio.includes('/mes');

    // Extraer ubicación
    const ubicacionMatch = cardHTML.match(/Casa en (Venta|Renta) ([^·]+)/);
    const ubicacionRaw = ubicacionMatch ? ubicacionMatch[2].trim() : '';

    // Limpiar ubicación y construir dirección completa
    const ubicacion = ubicacionRaw.replace(/,?\s*Culiacán.*$/i, '').trim();
    const direccionCompleta = `${ubicacion}, Culiacán, Sinaloa, México`;

    // Extraer características
    const recamarasMatch = cardHTML.match(/(\d+)\s*Recámaras?/i);
    const banosMatch = cardHTML.match(/(\d+(?:\.\d+)?)\s*Baños?/i);
    const m2Match = cardHTML.match(/(\d+(?:,\d+)?)\s*m²/i);

    const recamaras = recamarasMatch ? parseInt(recamarasMatch[1]) : 3;
    const banos = banosMatch ? parseFloat(banosMatch[1]) : 2;
    const m2 = m2Match ? parseInt(m2Match[1].replace(',', '')) : 200;

    // Extraer imagen
    const imagenMatch = cardHTML.match(/<img[^>]+src="([^"]+)"/);
    const imagen = imagenMatch ? imagenMatch[1] : '';

    // URL completa
    const urlCompleta = href.startsWith('http') ? href : `https://casasenventa.info/culiacan/${href}`;

    // ⚠️ SOLO AGREGAR PROPIEDADES EN VENTA
    if (!esRenta) {
        propiedades.push({
            id: `prop-${count + 1}`,
            slug: slug,
            titulo: slug.replace(/-/g, ' '),
            precio: precio,
            ubicacion: ubicacion,
            direccionCompleta: direccionCompleta,
            tipo: 'venta',
            recamaras: recamaras,
            banos: banos,
            m2: m2,
            imagen: imagen,
            url: urlCompleta,
            // Coordenadas a geocodificar
            lat: null,
            lng: null,
            geocodificada: false
        });

        count++;
    }
}

console.log(`✅ ${propiedades.length} propiedades EN VENTA extraídas\n`);

// 2️⃣ Función para geocodificar una dirección
function geocodificarDireccion(direccion) {
    return new Promise((resolve, reject) => {
        const encodedAddress = encodeURIComponent(direccion);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${CONFIG.GOOGLE_API_KEY}`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);

                    if (result.status === 'OK' && result.results.length > 0) {
                        const location = result.results[0].geometry.location;
                        resolve({
                            lat: location.lat,
                            lng: location.lng,
                            formatted_address: result.results[0].formatted_address,
                            success: true
                        });
                    } else {
                        resolve({
                            lat: null,
                            lng: null,
                            formatted_address: null,
                            success: false,
                            error: result.status
                        });
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// 3️⃣ Función para esperar (delay)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 4️⃣ Geocodificar en batches
async function geocodificarEnBatches() {
    console.log('🗺️ Iniciando geocodificación en batches de 10...\n');

    let geocodificadas = 0;
    let fallidas = 0;

    for (let i = 0; i < propiedades.length; i += CONFIG.BATCH_SIZE) {
        const batch = propiedades.slice(i, i + CONFIG.BATCH_SIZE);
        const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(propiedades.length / CONFIG.BATCH_SIZE);

        console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} propiedades)...`);

        // Procesar batch en paralelo
        const promises = batch.map(async (prop) => {
            try {
                const result = await geocodificarDireccion(prop.direccionCompleta);

                if (result.success) {
                    prop.lat = result.lat;
                    prop.lng = result.lng;
                    prop.geocodificada = true;
                    geocodificadas++;
                    console.log(`   ✅ ${prop.slug.substring(0, 40)} → (${result.lat.toFixed(6)}, ${result.lng.toFixed(6)})`);
                } else {
                    prop.geocodificada = false;
                    fallidas++;
                    console.log(`   ❌ ${prop.slug.substring(0, 40)} → Error: ${result.error}`);
                }
            } catch (error) {
                prop.geocodificada = false;
                fallidas++;
                console.log(`   ❌ ${prop.slug.substring(0, 40)} → Error: ${error.message}`);
            }
        });

        await Promise.all(promises);

        // Esperar entre batches (excepto el último)
        if (i + CONFIG.BATCH_SIZE < propiedades.length) {
            console.log(`   ⏱️  Esperando ${CONFIG.DELAY_BETWEEN_BATCHES / 1000}s antes del siguiente batch...\n`);
            await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ GEOCODIFICACIÓN COMPLETADA\n');
    console.log(`📊 Resultados:`);
    console.log(`   ✅ Exitosas: ${geocodificadas} (${((geocodificadas / propiedades.length) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Fallidas: ${fallidas} (${((fallidas / propiedades.length) * 100).toFixed(1)}%)`);
    console.log(`   📦 Total: ${propiedades.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Guardar resultados
    console.log('💾 Guardando resultados...');
    fs.writeFileSync(CONFIG.OUTPUT_JSON, JSON.stringify(propiedades, null, 2), 'utf8');
    console.log(`✅ Guardado en: ${CONFIG.OUTPUT_JSON}\n`);

    return propiedades;
}

// 5️⃣ EJECUTAR
geocodificarEnBatches()
    .then((propiedades) => {
        console.log('🎯 SIGUIENTE PASO:');
        console.log('   Ejecuta: node generar-culiacan-ghost-v2.js');
        console.log('   Para generar el HTML con las coordenadas reales\n');
    })
    .catch((error) => {
        console.error('❌ ERROR:', error);
        process.exit(1);
    });
