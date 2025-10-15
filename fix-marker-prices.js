#!/usr/bin/env node

/**
 * Script para corregir marcadores de mapas sin precio
 * Extrae precio de meta tags y lo agrega al MARKER_CONFIG.priceShort
 */

const fs = require('fs');
const path = require('path');

function extractPriceFromHTML(html) {
    // Intentar extraer de og:price:amount
    let match = html.match(/property="og:price:amount"\s+content="([^"]+)"/);
    if (match) {
        const rawPrice = match[1];
        return formatPrice(rawPrice);
    }

    // Intentar extraer del título de la página
    match = html.match(/<title>.*?\$([0-9,]+).*?<\/title>/);
    if (match) {
        const rawPrice = match[1].replace(/,/g, '');
        return formatPrice(rawPrice);
    }

    // Intentar extraer del Schema.org
    match = html.match(/"price":\s*"([0-9]+)"/);
    if (match) {
        const rawPrice = match[1];
        return formatPrice(rawPrice);
    }

    return null;
}

function formatPrice(rawPrice) {
    // Limpiar y convertir a número
    const numPrice = parseInt(rawPrice.toString().replace(/[^0-9]/g, ''));

    if (isNaN(numPrice)) return null;

    // Formatear según el rango
    if (numPrice >= 1000000) {
        const millions = numPrice / 1000000;
        return `$${millions.toFixed(1)}M`.replace('.0M', 'M');
    } else if (numPrice >= 1000) {
        const thousands = numPrice / 1000;
        return `$${thousands.toFixed(0)}K`;
    } else {
        return `$${numPrice.toLocaleString('en-US')}`;
    }
}

function fixMarkerPrice(htmlPath) {
    const html = fs.readFileSync(htmlPath, 'utf-8');

    // Verificar si ya tiene precio en el marcador
    const currentPriceMatch = html.match(/priceShort:\s*"([^"]*)"/);
    const currentPrice = currentPriceMatch ? currentPriceMatch[1] : '';

    // Considerar como "sin precio" si:
    // - Está vacío
    // - Es $0K o $0M
    // - No empieza con $
    const needsFix = !currentPrice ||
                     currentPrice === '$0K' ||
                     currentPrice === '$0M' ||
                     !currentPrice.startsWith('$');

    if (!needsFix && currentPrice.length > 2) {
        return { fixed: false, reason: 'already-has-price', price: currentPrice };
    }

    // Extraer precio del HTML
    const price = extractPriceFromHTML(html);
    if (!price) {
        return { fixed: false, reason: 'no-price-found', price: null };
    }

    // Reemplazar en MARKER_CONFIG
    const updatedHTML = html.replace(
        /priceShort:\s*"[^"]*"/,
        `priceShort: "${price}"`
    );

    // Verificar que el cambio se hizo
    if (updatedHTML === html) {
        return { fixed: false, reason: 'no-marker-config', price };
    }

    // Guardar archivo
    fs.writeFileSync(htmlPath, updatedHTML, 'utf-8');
    return { fixed: true, reason: 'success', price };
}

function main() {
    const culiacanDir = path.join(__dirname, 'culiacan');
    const properties = fs.readdirSync(culiacanDir)
        .filter(dir => fs.statSync(path.join(culiacanDir, dir)).isDirectory());

    console.log(`🔍 Escaneando ${properties.length} propiedades...\n`);

    const results = {
        fixed: [],
        alreadyHasPrice: [],
        noPriceFound: [],
        noMarkerConfig: []
    };

    properties.forEach(prop => {
        const htmlPath = path.join(culiacanDir, prop, 'index.html');

        if (!fs.existsSync(htmlPath)) {
            return;
        }

        const result = fixMarkerPrice(htmlPath);

        if (result.fixed) {
            results.fixed.push({ prop, price: result.price });
            console.log(`✅ ${prop} → ${result.price}`);
        } else if (result.reason === 'already-has-price') {
            results.alreadyHasPrice.push({ prop, price: result.price });
        } else if (result.reason === 'no-price-found') {
            results.noPriceFound.push(prop);
            console.log(`⚠️  ${prop} → No se encontró precio`);
        } else if (result.reason === 'no-marker-config') {
            results.noMarkerConfig.push({ prop, price: result.price });
            console.log(`❌ ${prop} → No tiene MARKER_CONFIG`);
        }
    });

    console.log('\n📊 RESUMEN:');
    console.log(`✅ Corregidas: ${results.fixed.length}`);
    console.log(`⏭️  Ya tenían precio: ${results.alreadyHasPrice.length}`);
    console.log(`⚠️  Sin precio en HTML: ${results.noPriceFound.length}`);
    console.log(`❌ Sin MARKER_CONFIG: ${results.noMarkerConfig.length}`);

    if (results.noPriceFound.length > 0) {
        console.log('\n⚠️  Propiedades sin precio detectado:');
        results.noPriceFound.forEach(prop => console.log(`   - ${prop}`));
    }

    if (results.noMarkerConfig.length > 0) {
        console.log('\n❌ Propiedades sin MARKER_CONFIG:');
        results.noMarkerConfig.forEach(item => console.log(`   - ${item.prop} (precio: ${item.price})`));
    }
}

main();
