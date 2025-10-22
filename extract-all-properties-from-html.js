#!/usr/bin/env node

/**
 * Script para extraer TODAS las propiedades de culiacan/index.html
 * y crear una base de datos completa para detección de duplicados.
 *
 * Este script escanea el HTML y extrae:
 * - Slug
 * - Título
 * - Precio
 * - Ubicación
 * - Recámaras, baños, m²
 * - Tipo (venta/renta)
 *
 * Output: complete-properties-database.json
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, 'culiacan', 'index.html');
const OUTPUT_FILE = path.join(__dirname, 'complete-properties-database.json');

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║  🏠 EXTRACTOR DE PROPIEDADES - TODAS LAS 100+ PROPIEDADES   ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Leer HTML
console.log('📖 Leyendo culiacan/index.html...');
const html = fs.readFileSync(HTML_FILE, 'utf8');

// Extraer todas las tarjetas de propiedades (regex más flexible)
const cardRegex = /<!--\s*BEGIN CARD-ADV\s+([^\s]+)\s*-->([\s\S]*?)<!--\s*END CARD-ADV\s+\1\s*-->/g;
const cards = [];
let match;

console.log('🔍 Buscando tarjetas de propiedades...\n');

while ((match = cardRegex.exec(html)) !== null) {
    const slug = match[1].trim();
    const cardHtml = match[2];

    // Extraer datos de la tarjeta
    const property = {
        slug: slug,
        title: '',
        price: '',
        priceNumber: 0,
        location: '',
        bedrooms: 0,
        bathrooms: 0,
        constructionArea: 0,
        type: '',  // 'venta' o 'renta'
        href: '',
        extractedAt: new Date().toISOString()
    };

    // Detectar tipo (venta o renta) por badge color
    if (cardHtml.includes('bg-green-600')) {
        property.type = 'venta';
    } else if (cardHtml.includes('bg-orange-500')) {
        property.type = 'renta';
    }

    // Extraer data-href
    const hrefMatch = cardHtml.match(/data-href="([^"]+)"/);
    if (hrefMatch) {
        property.href = hrefMatch[1];
    }

    // Extraer precio del badge
    const priceMatch = cardHtml.match(/bg-(?:green|orange)-\d+[^>]*>\s*\$?([\d,]+(?:\/mes)?)/);
    if (priceMatch) {
        property.price = priceMatch[1];
        // Extraer número limpio (sin comas ni /mes)
        const priceClean = priceMatch[1].replace(/[,\/mes]/g, '');
        property.priceNumber = parseInt(priceClean) || 0;
    }

    // Extraer título y ubicación del <h3> y <p>
    const titleMatch = cardHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    if (titleMatch) {
        // El título dentro del h3 es el precio, buscar en el p siguiente
        const locationMatch = cardHtml.match(/<p class="text-gray-600[^>]*>(.*?)<\/p>/);
        if (locationMatch) {
            const fullText = locationMatch[1].trim();
            // Formato: "Casa en Venta Ubicación · Culiacán"
            property.title = fullText.split('·')[0].trim();
            property.location = fullText;
        }
    }

    // Extraer recámaras
    const bedroomsMatch = cardHtml.match(/(\d+)\s*Recámaras?/i);
    if (bedroomsMatch) {
        property.bedrooms = parseInt(bedroomsMatch[1]);
    }

    // Extraer baños
    const bathroomsMatch = cardHtml.match(/(\d+(?:\.\d+)?)\s*Baños?/i);
    if (bathroomsMatch) {
        property.bathrooms = parseFloat(bathroomsMatch[1]);
    }

    // Extraer m² de construcción
    const areaMatch = cardHtml.match(/(\d+(?:\.\d+)?)\s*m²/i);
    if (areaMatch) {
        property.constructionArea = parseFloat(areaMatch[1]);
    }

    cards.push(property);

    // Log progreso cada 20 propiedades
    if (cards.length % 20 === 0) {
        console.log(`   ✅ Extraídas ${cards.length} propiedades...`);
    }
}

console.log(`\n📊 TOTAL EXTRAÍDO: ${cards.length} propiedades\n`);

// Estadísticas
const ventas = cards.filter(p => p.type === 'venta').length;
const rentas = cards.filter(p => p.type === 'renta').length;
const sinTipo = cards.filter(p => !p.type).length;

console.log('📈 ESTADÍSTICAS:');
console.log(`   🟢 Ventas: ${ventas}`);
console.log(`   🟠 Rentas: ${rentas}`);
console.log(`   ⚪ Sin tipo: ${sinTipo}`);
console.log('');

// Guardar a JSON
console.log(`💾 Guardando en ${path.basename(OUTPUT_FILE)}...`);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2), 'utf8');
console.log('   ✅ Guardado exitosamente\n');

// Mostrar primeras 5 propiedades como ejemplo
console.log('📄 EJEMPLO (primeras 5 propiedades):\n');
cards.slice(0, 5).forEach((prop, idx) => {
    console.log(`${idx + 1}. ${prop.type.toUpperCase()} - ${prop.title || prop.slug}`);
    console.log(`   💰 ${prop.price}`);
    console.log(`   🛏️  ${prop.bedrooms} rec · 🚿 ${prop.bathrooms} baños · 📐 ${prop.constructionArea}m²`);
    console.log(`   🔗 ${prop.href}`);
    console.log('');
});

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  ✅ EXTRACCIÓN COMPLETADA                                    ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('📝 SIGUIENTE PASO:');
console.log('   Ahora necesitamos buscar property IDs en las páginas individuales');
console.log('   o en la base de datos inmuebles24-scraped-properties.json\n');
