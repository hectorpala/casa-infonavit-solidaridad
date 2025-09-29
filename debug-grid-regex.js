#!/usr/bin/env node

/**
 * Debug Script: Property Grid Regex
 */

const fs = require('fs');

function debugPropertyGridRegex(htmlFilePath) {
    try {
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        
        console.log(`📄 File size: ${htmlContent.length} characters`);
        
        // Mi regex corregido
        const propertyGridRegex = /(<div[^>]*class="[^"]*property-grid[^"]*"[^>]*>)(.*?)(<\/div>\s*<\/div>\s*<\/section>)/s;
        const match = htmlContent.match(propertyGridRegex);
        
        if (!match) {
            console.log('❌ No property-grid match found!');
            return;
        }
        
        const beforeGrid = match[1];
        const gridContent = match[2];
        const afterGrid = match[3];
        
        console.log(`\n🔍 PROPERTY GRID REGEX RESULTS:`);
        console.log(`   Before grid: ${beforeGrid.length} characters`);
        console.log(`   Grid content: ${gridContent.length} characters`);
        console.log(`   After grid: ${afterGrid.length} characters`);
        
        console.log(`\n📋 BEFORE GRID (opening tag):`);
        console.log(beforeGrid);
        
        console.log(`\n📋 AFTER GRID (closing tag):`);
        console.log(afterGrid);
        
        console.log(`\n📋 GRID CONTENT (first 500 chars):`);
        console.log(gridContent.substring(0, 500) + '...');
        
        console.log(`\n📋 GRID CONTENT (last 500 chars):`);
        console.log('...' + gridContent.substring(gridContent.length - 500));
        
        // Contar property-cards en el content
        const cardMatches = gridContent.match(/property-card/g);
        console.log(`\n🎯 Property cards in grid content: ${cardMatches ? cardMatches.length : 0}`);

    } catch (error) {
        console.error(`❌ Error:`, error.message);
    }
}

console.log('🔍 DEBUGGING: Property Grid Regex');
console.log('=================================');

debugPropertyGridRegex('./index.html');