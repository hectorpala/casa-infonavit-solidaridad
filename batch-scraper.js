#!/usr/bin/env node

const { execSync } = require('child_process');

const urls = [
    "https://propiedades.com/inmuebles/casa-en-venta-alejandria-vinoramas-sinaloa-28718607",
    "https://propiedades.com/inmuebles/casa-en-venta-rivallagigedo-la-campina-sinaloa-30181774",
    "https://propiedades.com/inmuebles/casa-en-venta-circuito-san-francisco-12-la-primavera-sinaloa-30181775",
    "https://propiedades.com/inmuebles/casa-en-venta-san-agustin-331-la-primavera-sinaloa-30206048",
    "https://propiedades.com/inmuebles/casa-en-venta-benevento-residencial-80014-culiacan-rosales-sin-sn-benevento-residencial-sinaloa-30238219",
    "https://propiedades.com/inmuebles/casa-en-venta-carr-a-imala-culiacan-rosales-sin-sn-benevento-residencial-sinaloa-30238202",
    "https://propiedades.com/inmuebles/casa-en-venta-carr-a-imala-culiacan-rosales-sin-sn-sfera-residencial-sinaloa-30237531",
    "https://propiedades.com/inmuebles/casa-en-venta-paseo-belcantto-sn-belcantto-sinaloa-29734195",
    "https://propiedades.com/inmuebles/casa-en-venta-paseo-belcantto-sn-belcantto-sinaloa-29706991",
    "https://propiedades.com/inmuebles/casa-en-venta-carretera-a-imala-sn-sfera-residencial-sinaloa-29880580",
    "https://propiedades.com/inmuebles/casa-en-condominio-en-venta-privada-arces-80058-culiacan-rosales-sin-sn-la-conquista-sinaloa-30347609",
    "https://propiedades.com/inmuebles/casa-en-venta-privanzas-sn-country-alamos-sinaloa-29470464",
    "https://propiedades.com/inmuebles/departamento-en-venta-cerro-del-vigia-655-colinas-de-san-miguel-sinaloa-29327025",
    "https://propiedades.com/inmuebles/terreno-habitacional-en-venta-la-primavera-80199-culiacan-rosales-sin-334-la-primavera-seccion-parque-industrial-sinaloa-30372524",
    "https://propiedades.com/inmuebles/departamento-en-venta-sta-maria-la-mayor-banus-sinaloa-28598936"
];

console.log(`\n🚀 BATCH SCRAPER - ${urls.length} PROPIEDADES\n`);

const results = [];
let successful = 0;
let failed = 0;

for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[${ i + 1}/${urls.length}] 🔍 Procesando: ${url.split('/').pop().substring(0, 50)}...`);
    
    try {
        execSync(`node scraper-y-publicar.js "${url}"`, { 
            stdio: 'inherit',
            timeout: 180000 
        });
        successful++;
        results.push({ url, status: 'SUCCESS' });
        
        // Esperar 10 segundos entre propiedades para no sobrecargar
        console.log('   ⏳ Esperando 10 segundos antes de la siguiente...');
        execSync('sleep 10');
        
    } catch (error) {
        failed++;
        results.push({ url, status: 'FAILED', error: error.message });
        console.error(`   ❌ Error procesando: ${error.message}`);
    }
}

console.log(`\n\n📊 RESUMEN BATCH SCRAPER:`);
console.log(`✅ Exitosas: ${successful}`);
console.log(`❌ Fallidas: ${failed}`);
console.log(`📦 Total: ${urls.length}`);

console.log(`\n📋 RESULTADOS DETALLADOS:`);
results.forEach((r, i) => {
    const icon = r.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${icon} ${i + 1}. ${r.url.split('/').pop().substring(0, 60)}`);
});

console.log(`\n🎯 Siguiente paso: Insertar tarjetas en culiacan/index.html y ejecutar "publica ya"`);
