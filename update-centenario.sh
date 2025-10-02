#!/bin/bash

FILE="casa-renta-centenario.html"

echo "🏠 Actualizando Casa Colonia Centenario..."

# 1. PRECIO - $1,750,000 → $18,000
sed -i '' 's/\$1,750,000/\$18,000/g' "$FILE"
sed -i '' 's/1750000/18000/g' "$FILE"

# 2. TÍTULO - Casa Infonavit Solidaridad → Casa en Renta Colonia Centenario
sed -i '' 's/Casa Infonavit Solidaridad/Casa en Renta Colonia Centenario/g' "$FILE"
sed -i '' 's/Casa en Venta/Casa en Renta/g' "$FILE"
sed -i '' 's/En Venta/En Renta/g' "$FILE"

# 3. UBICACIÓN
sed -i '' 's/Blvrd Elbert 2609, Infonavit Solidaridad/Privada Habitanía, Av\. Astral, Colonia Centenario/g' "$FILE"
sed -i '' 's/Blvrd Elbert 2609/Privada Habitanía/g' "$FILE"
sed -i '' 's/Infonavit Solidaridad, 80200/Colonia Centenario, 80200/g' "$FILE"
sed -i '' 's/Infonavit Solidaridad, Solidaridad, 80058/Colonia Centenario, 80200/g' "$FILE"

# 4. RECÁMARAS - 2 → 3
sed -i '' 's/<span class="feature-value">2<\/span>[[:space:]]*recámaras\?/<span class="feature-value">3<\/span> recámaras/gi' "$FILE"
sed -i '' 's/numberOfBedrooms": 2/numberOfBedrooms": 3/g' "$FILE"

# 5. BAÑOS - 2 → 2.5
sed -i '' 's/<span class="feature-value">2<\/span>[[:space:]]*baños\?/<span class="feature-value">2.5<\/span> baños/gi' "$FILE"
sed -i '' 's/numberOfBathroomsTotal": 2/numberOfBathroomsTotal": 2.5/g' "$FILE"
sed -i '' 's/numberOfFullBathrooms": 2/numberOfFullBathrooms": 2/g' "$FILE"

# 6. M² CONSTRUCCIÓN - 91.6 → 183
sed -i '' 's/91\.6 m²/183 m²/g' "$FILE"
sed -i '' 's/91\.60/183/g' "$FILE"

# 7. M² TERRENO - 112.5 → 105
sed -i '' 's/112\.5 m²/105 m²/g' "$FILE"
sed -i '' 's/112\.5/105/g' "$FILE"

# 8. CARRUSEL - totalSlidesHero 14 → 8
sed -i '' 's/const totalSlidesHero = 14;/const totalSlidesHero = 8;/g' "$FILE"

# 9. FOTOS - Reemplazar rutas
for i in {1..8}; do
    sed -i '' "s|images/fachada${i}\.jpg|images/casa-renta-centenario/foto-${i}.jpg|g" "$FILE"
done

# Mapeo específico de fotos antiguas
sed -i '' 's|images/fachada1\.jpg|images/casa-renta-centenario/foto-1.jpg|g' "$FILE"
sed -i '' 's|images/fachada2\.jpg|images/casa-renta-centenario/foto-2.jpg|g' "$FILE"
sed -i '' 's|images/fachada3\.jpg|images/casa-renta-centenario/foto-3.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134401\.jpg|images/casa-renta-centenario/foto-4.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134444\.jpg|images/casa-renta-centenario/foto-5.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134455\.jpg|images/casa-renta-centenario/foto-6.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134516\.jpg|images/casa-renta-centenario/foto-7.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134535\.jpg|images/casa-renta-centenario/foto-8.jpg|g' "$FILE"

# 10. WHATSAPP MESSAGES
sed -i '' 's/Me%20interesa%20Casa%20Infonavit%20Solidaridad%20de%20.*"/Me%20interesa%20Casa%20en%20Renta%20Colonia%20Centenario%20de%20%2418%2C000"/g' "$FILE"
sed -i '' 's/Hola,%20me%20interesa%20.*%20¿Podría%20agendar%20una%20visita?/Hola,%20me%20interesa%20Casa%20en%20Renta%20Colonia%20Centenario%20por%20%2418,000.%20¿Podría%20agendar%20una%20visita?/g' "$FILE"

echo "✅ Cambios de datos aplicados"
echo "🗑️  Eliminando slides 9-14..."

# Eliminar slides 8-13 manualmente con perl
perl -i -0pe 's/<div class="carousel-slide" data-slide="8">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow"|<!-- Navigation)//gs' "$FILE"
perl -i -0pe 's/<div class="carousel-slide" data-slide="9">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow"|<!-- Navigation)//gs' "$FILE"
perl -i -0pe 's/<div class="carousel-slide" data-slide="10">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow"|<!-- Navigation)//gs' "$FILE"
perl -i -0pe 's/<div class="carousel-slide" data-slide="11">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow"|<!-- Navigation)//gs' "$FILE"
perl -i -0pe 's/<div class="carousel-slide" data-slide="12">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow"|<!-- Navigation)//gs' "$FILE"
perl -i -0pe 's/<div class="carousel-slide" data-slide="13">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow"|<!-- Navigation)//gs' "$FILE"

# Eliminar dots 8-13
for i in {8..13}; do
    perl -i -0pe "s/<button class=\"carousel-dot\"[^>]*onclick=\"goToSlideHero\\($i\\)\"[^>]*>.*?<\/button>\\s*//gs" "$FILE"
done

# Limpiar array lightbox (solo primeras 8 imágenes)
perl -i -0pe 's/const galleryImages = \[.*?\];/const galleryImages = [\n            { src: "images\/casa-renta-centenario\/foto-1.jpg", alt: "Fachada Principal" },\n            { src: "images\/casa-renta-centenario\/foto-2.jpg", alt: "Vista 2" },\n            { src: "images\/casa-renta-centenario\/foto-3.jpg", alt: "Vista 3" },\n            { src: "images\/casa-renta-centenario\/foto-4.jpg", alt: "Interior 1" },\n            { src: "images\/casa-renta-centenario\/foto-5.jpg", alt: "Interior 2" },\n            { src: "images\/casa-renta-centenario\/foto-6.jpg", alt: "Interior 3" },\n            { src: "images\/casa-renta-centenario\/foto-7.jpg", alt: "Interior 4" },\n            { src: "images\/casa-renta-centenario\/foto-8.jpg", alt: "Interior 5" }\n        ];/gs' "$FILE"

# Actualizar contador lightbox
sed -i '' 's/<span id="lightbox-total">14<\/span>/<span id="lightbox-total">8<\/span>/g' "$FILE"

echo "✅ Casa Colonia Centenario actualizada"
echo "   💰 Precio: \$18,000"
echo "   🛏️  Recámaras: 3"
echo "   🛁 Baños: 2.5"
echo "   📏 M² construcción: 183"
echo "   📏 M² terreno: 105"
echo "   📸 Fotos: 8"
echo "   🎡 totalSlidesHero: 8"
