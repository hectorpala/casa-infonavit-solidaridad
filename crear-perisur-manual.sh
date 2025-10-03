#!/bin/bash

# Datos de la propiedad
SLUG="casa-venta-privada-perisur"
PRICE="\$3,200,000"
TITLE="Casa Privada Perisur"
LOCATION="Boulevard Perisur, Fraccionamiento Perisur, Culiacán"
BEDROOMS=3
BATHROOMS=3.5
AREA=140
PHOTOS=8

echo "🏗️  Creando Casa Privada Perisur..."

# 1. Crear directorio
mkdir -p "culiacan/$SLUG/images"

# 2. Copiar fotos
cp images/casa-venta-privada-perisur-115168/*.jpg "culiacan/$SLUG/images/"
echo "✅ $PHOTOS fotos copiadas"

# 3. Generar HTML con Node.js
node -e "
const fs = require('fs');
const PropertyPageGenerator = require('./automation/property-page-generator.js');

const config = {
    key: '$SLUG',
    title: '$TITLE',
    price: '$PRICE',
    location: '$LOCATION',
    bedrooms: $BEDROOMS,
    bathrooms: $BATHROOMS,
    construction_area: $AREA,
    land_area: $AREA,
    photoCount: $PHOTOS
};

const generator = new PropertyPageGenerator();
const html = generator.generateFromSolidaridadTemplate(config);
fs.writeFileSync('culiacan/$SLUG/index.html', html);
console.log('✅ HTML generado');
"

echo "✅ Propiedad creada en culiacan/$SLUG/"
