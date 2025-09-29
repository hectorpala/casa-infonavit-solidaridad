#!/usr/bin/env node

/**
 * Debug Script: Extraction Function
 */

const fs = require('fs');

function debugExtractExistingProperties(htmlFilePath) {
    try {
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        const properties = [];
        
        console.log(`📄 File size: ${htmlContent.length} characters`);
        
        // Estructura clásica para index.html
        const propertyRegex = /<a href="([^"]+)"\s+class="property-card">(.*?)<\/a>/gs;
        let match;
        let matchCount = 0;

        while ((match = propertyRegex.exec(htmlContent)) !== null) {
            matchCount++;
            const href = match[1];
            const cardContent = match[2];
            
            // Extraer información de cada tarjeta
            const titleMatch = cardContent.match(/<h3[^>]*property-title[^>]*>([^<]+)<\/h3>/);
            
            if (titleMatch) {
                const title = titleMatch[1].trim();
                console.log(`${matchCount}. ${title} (href: ${href})`);
                
                properties.push({
                    href: href,
                    title: title,
                    fullCard: match[0]
                });
            } else {
                console.log(`${matchCount}. [NO TITLE FOUND] (href: ${href})`);
            }
        }

        console.log(`\n🔍 REGEX STATS:`);
        console.log(`   Total matches found: ${matchCount}`);
        console.log(`   Properties with titles: ${properties.length}`);
        
        return properties;

    } catch (error) {
        console.error(`❌ Error extracting properties from ${htmlFilePath}:`, error.message);
        return [];
    }
}

console.log('🔍 DEBUGGING: Property Extraction Function');
console.log('==========================================');

const results = debugExtractExistingProperties('./index.html');
console.log(`\n📊 FINAL RESULT: ${results.length} properties extracted`);