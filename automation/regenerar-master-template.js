#!/usr/bin/env node

/**
 * REGENERAR MASTER TEMPLATE desde Casa Solidaridad (completa)
 * Casa Solidaridad tiene todas las features: lightbox, gallery, share buttons, etc.
 */

const fs = require('fs');

console.log('🔄 REGENERANDO MASTER TEMPLATE desde Casa Solidaridad...\n');

// Copiar Casa Solidaridad como base
const solidaridadPath = './culiacan/infonavit-solidaridad/index.html';
const masterTemplatePath = './automation/templates/master-template.html';

if (!fs.existsSync(solidaridadPath)) {
    console.error('❌ Casa Solidaridad no encontrada');
    process.exit(1);
}

console.log('📋 Copiando Casa Solidaridad como base...');
let html = fs.readFileSync(solidaridadPath, 'utf8');

console.log('🔧 Aplicando placeholders...\n');

// Ejecutar conversiones (Parte 1 y Parte 2)
console.log('Ejecutando convert-to-template.js (Parte 1 - HEAD)...');
require('./convert-to-template');

console.log('\n✅ Master template regenerado exitosamente');
console.log('📁 Ubicación: automation/templates/master-template.html');
console.log('\n🎯 Próximo paso: Ejecutar convert-to-template-PART2.js');
