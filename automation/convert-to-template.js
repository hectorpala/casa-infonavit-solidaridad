const fs = require('fs');

console.log('🔧 Convirtiendo Casa San Javier a Master Template con placeholders...\n');

let html = fs.readFileSync('automation/templates/master-template.html', 'utf8');

// ============================================
// PASO 1: HEAD - Meta Tags y SEO
// ============================================

// Title
html = html.replace(
    /<title>Casa en Venta \$13,859,000 - San Javier La Primavera, Culiacán \| Hector es Bienes Raíces<\/title>/,
    '<title>Casa en Venta {{PRECIO}} - {{LOCATION_FULL}}, Culiacán | Hector es Bienes Raíces</title>'
);

// Meta description
html = html.replace(
    /<meta name="description" content="Casa nueva en venta en San Javier La Primavera, Culiacán\. 3 recámaras, 3 baños, cochera techada\. 362m² construcción\. ¡Contáctanos!">/,
    '<meta name="description" content="{{META_DESCRIPTION}}">'
);

// Meta keywords
html = html.replace(
    /<meta name="keywords" content="casa venta Culiacán, San Javier La Primavera, casa nueva, 3 recámaras, cochera techada">/,
    '<meta name="keywords" content="{{META_KEYWORDS}}">'
);

// Canonical URL
html = html.replace(
    /https:\/\/casasenventa\.info\/culiacan\/casa-venta-san-javier\//g,
    'https://casasenventa.info/culiacan/{{SLUG}}/'
);

// Open Graph title
html = html.replace(
    /<meta property="og:title" content="Casa en Venta \$13,859,000 - San Javier La Primavera">/,
    '<meta property="og:title" content="Casa en Venta {{PRECIO}} - {{LOCATION_SHORT}}">'
);

// Open Graph description
html = html.replace(
    /<meta property="og:description" content="Casa nueva con 3 recámaras, 3 baños y cochera techada para 2 autos\.">/,
    '<meta property="og:description" content="{{OG_DESCRIPTION}}">'
);

// Open Graph image (foto-1.jpg siempre)
html = html.replace(
    /https:\/\/casasenventa\.info\/culiacan\/casa-venta-san-javier\/images\/foto-1\.jpg/g,
    'https://casasenventa.info/culiacan/{{SLUG}}/images/foto-1.jpg'
);

// ============================================
// PASO 2: Schema.org JSON-LD
// ============================================

// Schema.org name
html = html.replace(
    /"name": "Casa Nueva en San Javier La Primavera"/,
    '"name": "{{SCHEMA_NAME}}"'
);

// Schema.org description
html = html.replace(
    /"description": "Casa nueva en venta en San Javier La Primavera, Culiacán\. 3 recámaras, 3 baños, cochera techada\. 362m² construcción\."/,
    '"description": "{{SCHEMA_DESCRIPTION}}"'
);

// Schema.org images (las primeras 3)
html = html.replace(
    /"image": \[\s*"https:\/\/casasenventa\.info\/culiacan\/casa-venta-san-javier\/images\/foto-1\.jpg",\s*"https:\/\/casasenventa\.info\/culiacan\/casa-venta-san-javier\/images\/foto-2\.jpg",\s*"https:\/\/casasenventa\.info\/culiacan\/casa-venta-san-javier\/images\/foto-3\.jpg"\s*\]/,
    `"image": [
        "https://casasenventa.info/culiacan/{{SLUG}}/images/foto-1.jpg",
        "https://casasenventa.info/culiacan/{{SLUG}}/images/foto-2.jpg",
        "https://casasenventa.info/culiacan/{{SLUG}}/images/foto-3.jpg"
      ]`
);

// Schema.org address
html = html.replace(
    /"streetAddress": "Barrio San Javier"/,
    '"streetAddress": "{{STREET_ADDRESS}}"'
);

html = html.replace(
    /"addressLocality": "La Primavera"/,
    '"addressLocality": "{{LOCALITY}}"'
);

html = html.replace(
    /"postalCode": "80199"/,
    '"postalCode": "{{POSTAL_CODE}}"'
);

// Schema.org geo coordinates
html = html.replace(
    /"latitude": 24\.824491/,
    '"latitude": {{LATITUDE}}'
);

html = html.replace(
    /"longitude": -107\.4287297/,
    '"longitude": {{LONGITUDE}}'
);

// Schema.org floorSize (construcción)
html = html.replace(
    /"floorSize": \{\s*"@type": "QuantitativeValue",\s*"value": 362,\s*"unitCode": "MTK"\s*\}/,
    `"floorSize": {
        "@type": "QuantitativeValue",
        "value": {{CONSTRUCTION_AREA}},
        "unitCode": "MTK"
      }`
);

// Schema.org lotSize (terreno)
html = html.replace(
    /"lotSize": \{\s*"@type": "QuantitativeValue",\s*"value": 362,\s*"unitCode": "MTK"\s*\}/,
    `"lotSize": {
        "@type": "QuantitativeValue",
        "value": {{LAND_AREA}},
        "unitCode": "MTK"
      }`
);

// Schema.org numberOfRooms
html = html.replace(
    /"numberOfRooms": 6/,
    '"numberOfRooms": {{TOTAL_ROOMS}}'
);

// Schema.org numberOfBedrooms
html = html.replace(
    /"numberOfBedrooms": 3/g,
    '"numberOfBedrooms": {{BEDROOMS}}'
);

// Schema.org numberOfBathroomsTotal
html = html.replace(
    /"numberOfBathroomsTotal": 3/g,
    '"numberOfBathroomsTotal": {{BATHROOMS}}'
);

// Schema.org numberOfFullBathrooms
html = html.replace(
    /"numberOfFullBathrooms": 3/,
    '"numberOfFullBathrooms": {{FULL_BATHROOMS}}'
);

// Schema.org yearBuilt
html = html.replace(
    /"yearBuilt": 2024/,
    '"yearBuilt": {{YEAR_BUILT}}'
);

// Schema.org price
html = html.replace(
    /"price": "13859000"/,
    '"price": "{{PRICE_NUMERIC}}"'
);

// Schema.org amenityFeature (se reemplazará completo)
html = html.replace(
    /"amenityFeature": \[\s*\{\s*"@type": "LocationFeatureSpecification",\s*"name": "Cochera techada",\s*"value": "2 autos"\s*\},\s*\{\s*"@type": "LocationFeatureSpecification",\s*"name": "Cuarto TV",\s*"value": true\s*\},\s*\{\s*"@type": "LocationFeatureSpecification",\s*"name": "Una planta",\s*"value": true\s*\}\s*\]/,
    '"amenityFeature": {{AMENITIES_JSON}}'
);

console.log('✅ Paso 1: HEAD y Schema.org convertidos\n');

// Guardar archivo parcial para verificar
fs.writeFileSync('automation/templates/master-template.html', html);

console.log('📝 Template parcial guardado. Continuando...\n');
