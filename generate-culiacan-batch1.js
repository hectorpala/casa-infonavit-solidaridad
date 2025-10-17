const fs = require('fs');
const data = JSON.parse(fs.readFileSync('culiacan-batch1-final.json', 'utf-8'));

console.log('// ===== LOTE 1: 5 NUEVAS PROPIEDADES (Agregar después de stanzaProperty) =====\n');

data.forEach((p, i) => {
    const varName = p.slug.replace(/casa-en-venta-en-/g, '').replace(/casa-en-venta-/g, '').replace(/se-vende-casa-en-/g, '').replace(/-/g, '_').substring(0, 25);
    
    console.log(`            // Propiedad ${i + 6}: ${p.title}`);
    console.log(`            const ${varName}Property = {`);
    console.log(`                address: "${p.address}",`);
    console.log(`                priceShort: "${p.priceShort}",`);
    console.log(`                priceFull: "${p.priceFull}",`);
    console.log(`                title: "${p.title}",`);
    console.log(`                location: "${p.address.split(',')[0]}",`);
    console.log(`                bedrooms: ${p.bedrooms},`);
    console.log(`                bathrooms: ${p.bathrooms},`);
    console.log(`                area: "${p.area}",`);
    console.log(`                url: "https://casasenventa.info/culiacan/${p.slug}/",`);
    console.log(`                photos: [`);
    
    for (let j = 1; j <= p.photoCount; j++) {
        const comma = j < p.photoCount ? ',' : '';
        console.log(`                    "${p.slug}/images/foto-${j}.jpg"${comma}`);
    }
    
    console.log(`                ]`);
    console.log(`            };\n`);
});

console.log('\n// ===== GEOCODIFICACIONES (Agregar antes de window.mapCuliacanInitialized = true) =====\n');

data.forEach((p, i) => {
    const varName = p.slug.replace(/casa-en-venta-en-/g, '').replace(/casa-en-venta-/g, '').replace(/se-vende-casa-en-/g, '').replace(/-/g, '_').substring(0, 25);
    
    console.log(`            // Geocodificar ${p.title}`);
    console.log(`            geocoder.geocode({ address: ${varName}Property.address }, function(results, status) {`);
    console.log(`                if (status === 'OK' && results[0]) {`);
    console.log(`                    const position = results[0].geometry.location;`);
    console.log(`                    const CustomMarkerClass = createZillowPropertyMarker(${varName}Property, mapCuliacan);`);
    console.log(`                    const marker = new CustomMarkerClass(position, mapCuliacan, ${varName}Property);`);
    console.log(`                    culiacanMarkers.push(marker);`);
    console.log(`                    console.log('Marcador ${p.title} creado en:', position.lat(), position.lng());`);
    console.log(`                } else {`);
    console.log(`                    console.error('Geocode error ${p.title}:', status);`);
    console.log(`                }`);
    console.log(`            });\n`);
});

