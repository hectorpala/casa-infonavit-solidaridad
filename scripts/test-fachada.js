#!/usr/bin/env node

/**
 * Test script para detección automática de fachada
 * Uso: npm run test:fachada
 */

require('dotenv').config();
const path = require('path');
const { setCoverFromBatch } = require('../automation/fachada-detector');

async function testFachada() {
    try {
        console.log('🧪 TEST: Detección Automática de Fachada\n');

        // Configuración de carpeta de prueba
        // Puedes cambiar esto a cualquier carpeta con fotos de prueba
        const testDir = process.argv[2] || './fixtures/fotos';

        console.log(`📂 Carpeta de prueba: ${testDir}\n`);

        // Ejecutar detección
        const result = await setCoverFromBatch(testDir, testDir);

        if (result) {
            console.log('\n✅ TEST EXITOSO\n');
            console.log('📊 RESULTADOS:');
            console.log(`   Cover generado: ${result.coverPath}`);
            console.log(`   Archivo seleccionado: ${result.winner.file}`);
            console.log(`   Score: ${result.winner.finalScore.toFixed(3)}`);
            console.log(`   Fallback: ${result.fallback ? 'Sí' : 'No'}`);
            console.log(`   Total imágenes analizadas: ${result.ranked.length}`);

            console.log('\n📸 TOP 5:');
            result.ranked.slice(0, 5).forEach((r, idx) => {
                console.log(`   ${idx + 1}. ${r.file} - Score: ${r.finalScore.toFixed(3)}`);
            });
        } else {
            console.log('\n⚠️  TEST FALLIDO: No se pudo generar cover\n');
        }

    } catch (error) {
        console.error('\n❌ ERROR EN TEST:', error.message);
        console.error('\n💡 POSIBLES CAUSAS:');
        console.error('   1. ANTHROPIC_API_KEY no configurada en .env');
        console.error('   2. Carpeta de fotos no existe');
        console.error('   3. No hay imágenes válidas en la carpeta\n');
        process.exit(1);
    }
}

// Ejecutar test
testFachada();
