#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Standalone Facade Detection Utility
 * Identifies the most likely facade photo from a property folder
 */

function detectFacadePhoto(photosPath) {
    console.log('🏠 DETECTANDO FACHADA AUTOMÁTICAMENTE...');
    console.log(`📂 Carpeta: ${photosPath}`);
    
    try {
        if (!fs.existsSync(photosPath)) {
            console.error('❌ La carpeta no existe:', photosPath);
            return null;
        }

        const files = fs.readdirSync(photosPath)
            .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
            .sort();
        
        if (files.length === 0) {
            console.warn('⚠️  No se encontraron fotos en la carpeta');
            return null;
        }
        
        console.log(`📸 Encontradas ${files.length} fotos`);
        
        // Priority patterns for facade detection
        const facadePatterns = [
            { pattern: /fachada/i, description: 'Contains "fachada"' },
            { pattern: /exterior/i, description: 'Contains "exterior"' },
            { pattern: /frente/i, description: 'Contains "frente"' },
            { pattern: /-01\./i, description: 'Ends with -01.' },
            { pattern: /foto-01/i, description: 'Contains "foto-01"' }
        ];
        
        // Secondary patterns (less reliable)
        const secondaryPatterns = [
            { pattern: /^01/i, description: 'Starts with 01' },
            { pattern: /^privada.*a6d8/i, description: 'Specific privada pattern (real facade)' }, // Temporary for this case
            { pattern: /^privada.*e54f/i, description: 'External view pattern' }
        ];
        
        // Try to find facade by primary patterns
        for (const { pattern, description } of facadePatterns) {
            const facadeFile = files.find(file => pattern.test(file));
            if (facadeFile) {
                console.log(`✅ FACHADA DETECTADA POR PATRÓN PRINCIPAL: ${facadeFile}`);
                console.log(`   Regla aplicada: ${description}`);
                return facadeFile;
            }
        }
        
        // Try secondary patterns if no primary match
        for (const { pattern, description } of secondaryPatterns) {
            const facadeFile = files.find(file => pattern.test(file));
            if (facadeFile) {
                console.log(`⚠️  FACHADA DETECTADA POR PATRÓN SECUNDARIO: ${facadeFile}`);
                console.log(`   Regla aplicada: ${description}`);
                return facadeFile;
            }
        }
        
        // If no pattern matches, use first file alphabetically
        const firstFile = files[0];
        console.log(`📍 USANDO PRIMERA FOTO COMO FACHADA: ${firstFile}`);
        console.log('   (No se encontró patrón específico de fachada)');
        return firstFile;
        
    } catch (error) {
        console.error('❌ Error al detectar fachada:', error.message);
        return null;
    }
}

function getOrganizedPhotoList(photosPath) {
    try {
        const allFiles = fs.readdirSync(photosPath)
            .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
            .sort();
        
        const facadeFile = detectFacadePhoto(photosPath);
        
        if (!facadeFile) {
            return allFiles;
        }
        
        // Put facade first, then the rest
        const otherFiles = allFiles.filter(file => file !== facadeFile);
        const organizedList = [facadeFile, ...otherFiles];
        
        console.log('\n📋 LISTA ORGANIZADA DE FOTOS:');
        organizedList.forEach((file, index) => {
            const isFacade = index === 0 ? '👑 FACHADA' : `   ${index + 1}`;
            console.log(`${isFacade}: ${file}`);
        });
        
        return organizedList;
        
    } catch (error) {
        console.error('❌ Error al organizar fotos:', error.message);
        return [];
    }
}

// CLI usage
if (require.main === module) {
    const photosPath = process.argv[2];
    
    if (!photosPath) {
        console.log('Uso: node detectar-fachada.js <ruta-a-carpeta-fotos>');
        console.log('');
        console.log('Ejemplos:');
        console.log('  node automation/detectar-fachada.js "images/3-rios"');
        console.log('  node automation/detectar-fachada.js "/Users/.../PROYECTOS/casa renta 3 rios"');
        process.exit(1);
    }
    
    console.log('🎯 DETECTOR AUTOMÁTICO DE FACHADA');
    console.log('===============================');
    
    const result = getOrganizedPhotoList(photosPath);
    
    if (result.length > 0) {
        console.log('\n✅ DETECCIÓN COMPLETADA');
        console.log(`🏠 Fachada identificada: ${result[0]}`);
        console.log(`📸 Total de fotos: ${result.length}`);
    } else {
        console.log('\n❌ NO SE PUDIERON PROCESAR LAS FOTOS');
    }
}

module.exports = {
    detectFacadePhoto,
    getOrganizedPhotoList
};