#!/usr/bin/env node

const fs = require('fs');

// Leer argumentos
const query = process.argv.slice(2).join(' ').toLowerCase();

if (!query) {
    console.log('');
    console.log('🔍 USO: node consultar-crm.js [búsqueda]');
    console.log('');
    console.log('Ejemplos:');
    console.log('  node consultar-crm.js punta azul');
    console.log('  node consultar-crm.js marcela');
    console.log('  node consultar-crm.js 1,750,000');
    console.log('  node consultar-crm.js lomas');
    console.log('');
    process.exit(1);
}

// Leer CRM
const crm = JSON.parse(fs.readFileSync('crm-propiedades.json', 'utf8'));

console.log('');
console.log('🔍 BUSCANDO:', query);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Filtrar propiedades
const resultados = crm.propiedades.filter(prop => {
    const searchText = [
        prop.titulo,
        prop.ubicacion,
        prop.precio,
        prop.agente || '',
        prop.inmobiliaria || '',
        prop.slug
    ].join(' ').toLowerCase();

    return searchText.includes(query);
});

if (resultados.length === 0) {
    console.log('❌ No se encontraron propiedades');
    console.log('');
    process.exit(0);
}

console.log(`✅ ${resultados.length} resultado(s) encontrado(s):\n`);

resultados.forEach((prop, index) => {
    console.log(`${index + 1}. 🏠 ${prop.titulo}`);
    console.log(`   💰 Precio: $${prop.precio}`);
    console.log(`   📍 Ubicación: ${prop.ubicacion}`);
    console.log(`   📏 ${prop.areaConstruccion}m² construcción | ${prop.areaTerreno}m² terreno`);
    console.log(`   🛏️  ${prop.recamaras} rec | 🚿 ${prop.banos} baños | 🚗 ${prop.estacionamientos} autos`);

    if (prop.agente || prop.inmobiliaria) {
        console.log(`   👤 VENDEDOR:`);
        if (prop.agente) console.log(`      Agente: ${prop.agente}`);
        if (prop.inmobiliaria) console.log(`      Inmobiliaria: ${prop.inmobiliaria}`);
    }

    console.log(`   🔗 Slug: ${prop.slug}`);
    console.log(`   📅 Agregada: ${prop.fechaAgregada}`);
    console.log('');
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
