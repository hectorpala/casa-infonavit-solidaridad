#!/usr/bin/env node

/**
 * CRM BÚSQUEDA RÁPIDA DE VENDEDORES
 *
 * USO:
 *   node crm-buscar.js alejandra
 *   node crm-buscar.js 6671603643
 *   node crm-buscar.js invictus
 *   node crm-buscar.js --lista
 *   node crm-buscar.js --stats
 */

const fs = require('fs');
const path = require('path');

const CRM_FILE = 'crm-vendedores.json';

// ============================================
// FUNCIONES
// ============================================

function loadCRM() {
    try {
        if (fs.existsSync(CRM_FILE)) {
            const data = fs.readFileSync(CRM_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('❌ Error leyendo CRM:', error.message);
    }
    return { vendedores: [], estadisticas: {} };
}

function buscarVendedor(query) {
    const crm = loadCRM();
    const queryLower = query.toLowerCase();

    // Buscar por nombre, teléfono, o tag
    const resultados = crm.vendedores.filter(v => {
        return (
            v.nombre.toLowerCase().includes(queryLower) ||
            v.telefono.includes(query) ||
            v.tags.some(tag => tag.toLowerCase().includes(queryLower))
        );
    });

    return resultados;
}

function mostrarVendedor(vendedor) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log(`║  👤 ${vendedor.nombre.padEnd(55)}║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  📞 Teléfono: ${vendedor.telefonoFormateado.padEnd(43)}║`);
    console.log(`║  💬 WhatsApp: ${vendedor.whatsapp.padEnd(43)}║`);
    console.log(`║  🏢 Fuente: ${vendedor.fuente.padEnd(47)}║`);
    console.log(`║  📝 Notas: ${vendedor.notas.padEnd(48)}║`);
    console.log(`║  🏷️  Tags: ${vendedor.tags.join(', ').padEnd(48)}║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  🏠 Propiedades: ${vendedor.propiedades.length.toString().padEnd(40)}║`);

    vendedor.propiedades.forEach((prop, i) => {
        console.log(`║  ${(i + 1).toString().padStart(2)}. ${prop.titulo.substring(0, 52).padEnd(52)}║`);
        console.log(`║      💰 ${prop.precio.padEnd(50)}║`);
        console.log(`║      🆔 ${prop.id.padEnd(50)}║`);
    });

    console.log('╚════════════════════════════════════════════════════════════╝\n');
}

function listarTodos() {
    const crm = loadCRM();

    console.log('\n📋 LISTA DE VENDEDORES\n');
    console.log('═'.repeat(70));

    crm.vendedores.forEach((v, i) => {
        console.log(`\n${i + 1}. ${v.nombre}`);
        console.log(`   📞 ${v.telefonoFormateado}`);
        console.log(`   🏠 ${v.propiedades.length} propiedad(es)`);
        console.log(`   🏷️  ${v.tags.join(', ')}`);
    });

    console.log('\n' + '═'.repeat(70));
    console.log(`\nTotal: ${crm.vendedores.length} vendedores\n`);
}

function mostrarStats() {
    const crm = loadCRM();

    console.log('\n📊 ESTADÍSTICAS CRM\n');
    console.log('═'.repeat(50));
    console.log(`Total Vendedores: ${crm.estadisticas.totalVendedores}`);
    console.log(`Total Propiedades: ${crm.estadisticas.totalPropiedades}`);
    console.log(`Última Actualización: ${crm.estadisticas.ultimaActualizacion}`);

    // Agrupar por fuente
    const porFuente = {};
    crm.vendedores.forEach(v => {
        porFuente[v.fuente] = (porFuente[v.fuente] || 0) + 1;
    });

    console.log('\n📌 Por Fuente:');
    Object.entries(porFuente).forEach(([fuente, count]) => {
        console.log(`   ${fuente}: ${count}`);
    });

    // Top vendedores por propiedades
    const ordenados = [...crm.vendedores].sort((a, b) =>
        b.propiedades.length - a.propiedades.length
    );

    console.log('\n🏆 Top Vendedores (por propiedades):');
    ordenados.slice(0, 5).forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.nombre} - ${v.propiedades.length} propiedad(es)`);
    });

    console.log('\n' + '═'.repeat(50) + '\n');
}

function mostrarAyuda() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              CRM BÚSQUEDA RÁPIDA DE VENDEDORES                ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  USO:                                                         ║
║    node crm-buscar.js <búsqueda>                             ║
║    node crm-buscar.js --lista                                ║
║    node crm-buscar.js --stats                                ║
║                                                               ║
║  EJEMPLOS:                                                    ║
║    node crm-buscar.js alejandra                              ║
║    node crm-buscar.js 6671603643                             ║
║    node crm-buscar.js invictus                               ║
║    node crm-buscar.js centro-historico                       ║
║                                                               ║
║  COMANDOS ESPECIALES:                                         ║
║    --lista    Muestra todos los vendedores                    ║
║    --stats    Muestra estadísticas del CRM                    ║
║    --help     Muestra esta ayuda                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

// ============================================
// MAIN
// ============================================

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help') {
        mostrarAyuda();
        return;
    }

    const comando = args[0];

    if (comando === '--lista') {
        listarTodos();
        return;
    }

    if (comando === '--stats') {
        mostrarStats();
        return;
    }

    // Búsqueda
    const resultados = buscarVendedor(comando);

    if (resultados.length === 0) {
        console.log(`\n❌ No se encontraron vendedores con: "${comando}"\n`);
        console.log('💡 Intenta con:');
        console.log('   - Nombre del vendedor (ej: alejandra)');
        console.log('   - Teléfono (ej: 6671603643)');
        console.log('   - Tag (ej: inmuebles24, centro-historico)\n');
        return;
    }

    console.log(`\n✅ Encontrados ${resultados.length} vendedor(es):`);
    resultados.forEach(mostrarVendedor);
}

if (require.main === module) {
    main();
}

module.exports = { loadCRM, buscarVendedor };
