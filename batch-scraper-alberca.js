#!/usr/bin/env node

/**
 * BATCH SCRAPER - 15 PROPIEDADES CON ALBERCA
 *
 * Procesa propiedades una por una con delays
 */

const { execSync } = require('child_process');

const urls = [
    "https://propiedades.com/inmuebles/casa-en-venta-alejandria-vinoramas-sinaloa-28718607",
    "https://propiedades.com/inmuebles/casa-en-venta-rivallagigedo-la-campina-sinaloa-30181774",
    "https://propiedades.com/inmuebles/casa-en-venta-circuito-san-francisco-12-la-primavera-sinaloa-30181775",
    "https://propiedades.com/inmuebles/casa-en-venta-san-agustin-331-la-primavera-sinaloa-30206048",
    "https://propiedades.com/inmuebles/casa-en-venta-benevento-residencial-80014-culiacan-rosales-sin-benevento-residencial-sinaloa-30238219",
    "https://propiedades.com/inmuebles/casa-en-venta-morelos-y-san-joaquin-santa-fe-sinaloa-30263370",
    "https://propiedades.com/inmuebles/casa-en-venta-privada-andaluz-los-olivos-sinaloa-30263393",
    "https://propiedades.com/inmuebles/casa-en-venta-monte-rosa-privadas-del-valle-ii-sinaloa-30263503",
    "https://propiedades.com/inmuebles/casa-en-venta-aleli-villa-bonita-sinaloa-30263687",
    "https://propiedades.com/inmuebles/casa-en-venta-lago-baikal-jardines-del-valle-sinaloa-30264197",
    "https://propiedades.com/inmuebles/casa-en-venta-valle-florido-61-valle-bonito-sinaloa-30264282",
    "https://propiedades.com/inmuebles/casa-en-venta-calle-galeana-3-villas-del-rio-elite-sinaloa-30264497",
    "https://propiedades.com/inmuebles/casa-en-venta-tule-el-country-sinaloa-30264748",
    "https://propiedades.com/inmuebles/casa-en-venta-sierrasuerte-4-portal-del-country-sinaloa-30264750",
    "https://propiedades.com/inmuebles/casa-en-venta-la-piedra-pedregal-de-la-villa-sinaloa-30265026"
];

console.log(`\n🚀 BATCH SCRAPER - ${urls.length} PROPIEDADES\n`);

let successful = 0;
let failed = 0;

for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[${i + 1}/${urls.length}] 🔍 Procesando: ${url.split('/').pop().substring(0, 50)}...`);

    try {
        execSync(`node scraper-y-publicar.js "${url}"`, {
            stdio: 'inherit',
            timeout: 180000 // 3 minutos max
        });
        successful++;

        // Esperar 10 segundos entre propiedades (evitar ban)
        if (i < urls.length - 1) {
            console.log('   ⏳ Esperando 10 segundos antes de la siguiente...');
            execSync('sleep 10');
        }

    } catch (error) {
        failed++;
        console.error(`   ❌ Error procesando: ${error.message}`);

        // Continuar con la siguiente propiedad
        console.log('   🔄 Continuando con la siguiente propiedad...');
        if (i < urls.length - 1) {
            execSync('sleep 5');
        }
    }
}

console.log(`\n\n📊 RESUMEN BATCH SCRAPER:`);
console.log(`   ✅ Exitosas: ${successful}`);
console.log(`   ❌ Fallidas: ${failed}`);
console.log(`   📦 Total: ${urls.length}\n`);
