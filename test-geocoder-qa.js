#!/usr/bin/env node

/**
 * Script de QA - Test del sistema de geocodificación con gazetteer
 *
 * Prueba direcciones problemáticas y genera reporte de calidad
 */

const { geocoder } = require('./geo-geocoder-culiacan');

// ============================================
// DIRECCIONES DE PRUEBA (CASOS PROBLEMÁTICOS)
// ============================================

const testAddresses = [
    // Caso 1: Dirección con ruido y texto descriptivo
    "Privada en Sector Tres Rios, Culiacán, Sinaloa, Mexico, Zona comercial Desarrollo Urbano 3 Ríos",

    // Caso 2: Dirección completa bien formada
    "Internacional 2660, Fraccionamiento Del Humaya, Culiacán",

    // Caso 3: Solo colonia sin calle
    "Tres Ríos, Culiacán, Sinaloa",

    // Caso 4: Colonia con variante de nombre
    "Sector Tres Rios, Culiacán",

    // Caso 5: Dirección con número pero sin colonia
    "Blvd Elbert 2609, Culiacán, Sinaloa",

    // Caso 6: Dirección completa  con colonia válida
    "Blvd Elbert 2609, Fracc. Las Quintas, Culiacán, Sinaloa",

    // Caso 7: Colonia desconocida
    "Colonia XYZ Inexistente, Culiacán",

    // Caso 8: Dirección con abreviatura sin normalizar
    "Av. Universidad 1234, Frac Los Pinos, Culiacan",

    // Caso 9: Texto muy sucio con redundancias
    "Inmuebles24 Casa Venta Sinaloa Culiacán Tres Rios, cerca de, Tres Rios, Culiacán",

    // Caso 10: Solo ciudad (mínimo posible)
    "Culiacán, Sinaloa"
];

// ============================================
// EJECUCIÓN
// ============================================

async function main() {
    console.log('🧪 === TEST DE GEOCODIFICACIÓN CON GAZETTEER ===\n');
    console.log(`Probando ${testAddresses.length} direcciones problemáticas...\n`);
    console.log('='.repeat(80));

    // Geocodificar todas
    const results = await geocoder.geocodeBatch(testAddresses);

    // Generar reporte QA
    console.log('\n' + '='.repeat(80));
    const stats = geocoder.generateQAReport(results);

    // Mostrar casos destacados
    console.log('\n\n📌 === CASOS DESTACADOS ===\n');

    // Mejor match
    const bestMatches = results
        .filter(r => r.colonia && r.colonia.matchScore >= 0.9)
        .sort((a, b) => b.confidence - a.confidence);

    if (bestMatches.length > 0) {
        console.log('✅ MEJORES MATCHES:');
        bestMatches.slice(0, 3).forEach((r, i) => {
            console.log(`\n   ${i + 1}. "${r.address.original.substring(0, 60)}..."`);
            console.log(`      → ${r.colonia.nombre} (${r.colonia.tipo})`);
            console.log(`      Match: ${r.colonia.matchType} (${(r.colonia.matchScore * 100).toFixed(0)}%)`);
            console.log(`      Confianza: ${(r.confidence * 100).toFixed(0)}%`);
        });
    }

    // Fuzzy matches
    const fuzzyMatches = results.filter(r => r.colonia && r.colonia.matchType === 'fuzzy');

    if (fuzzyMatches.length > 0) {
        console.log('\n\n🔍 FUZZY MATCHES:');
        fuzzyMatches.forEach((r, i) => {
            console.log(`\n   ${i + 1}. "${r.address.original.substring(0, 60)}..."`);
            console.log(`      Detectado: "${r.address.components.neighborhood}"`);
            console.log(`      → Match: "${r.colonia.nombre}" (${(r.colonia.matchScore * 100).toFixed(0)}%)`);
        });
    }

    // Sin match de colonia
    const noMatch = results.filter(r => !r.colonia);

    if (noMatch.length > 0) {
        console.log('\n\n⚠️  SIN MATCH DE COLONIA:');
        noMatch.forEach((r, i) => {
            console.log(`\n   ${i + 1}. "${r.address.original.substring(0, 60)}..."`);
            console.log(`      Detectado: "${r.address.components.neighborhood || '(ninguno)'}"`);
            console.log(`      Precisión degradada a: ${r.precision}`);
        });
    }

    // Casos con warnings
    const withWarnings = results.filter(r => r.validation.warnings.length > 0);

    if (withWarnings.length > 0) {
        console.log('\n\n⚠️  ADVERTENCIAS:');
        withWarnings.forEach((r, i) => {
            console.log(`\n   ${i + 1}. "${r.address.original.substring(0, 60)}..."`);
            r.validation.warnings.forEach(w => console.log(`      - ${w}`));
        });
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ Test completado\n');

    return results;
}

// Ejecutar
main().catch(error => {
    console.error('❌ Error en test:', error);
    process.exit(1);
});
