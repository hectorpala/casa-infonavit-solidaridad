#!/bin/bash

FILE="casa-venta-hacienda-del-rio.html"

echo "🏠 Actualizando Hacienda del Rio (método preciso)..."

# 1. PRECIO - Cambiar $1,750,000 a $1,200,000
sed -i '' 's/\$1,750,000/\$1,200,000/g' "$FILE"
sed -i '' 's/1750000/1200000/g' "$FILE"

# 2. TÍTULO Y UBICACIÓN
sed -i '' 's/Casa Infonavit Solidaridad/Casa Hacienda del Rio/g' "$FILE"
sed -i '' 's/Infonavit Solidaridad/Hacienda del Rio/g' "$FILE"
sed -i '' 's/Blvrd Elbert 2609/Corredor Imala/g' "$FILE"
sed -i '' 's/Solidaridad, 80058/Hacienda del Rio, 80200/g' "$FILE"

# 3. DESCRIPCIÓN HERO
sed -i '' 's|Se vende Casa en Hacienda del Rio, en Avenida principal\. 7\.5mt x 15mt = 112\.5 mt², 91\.60 mt² de construcción, 2 recámaras, 2 baños completos, cuarto tv una sola planta|Casa de 1 planta en Hacienda del Rio, Corredor Imala. 97.30 m² construcción, 1 recámara, 1 baño completo, cochera techada para 2 autos, cocina integral|' "$FILE"

# 4. FEATURES - Cambiar SOLO el primer "2" que es recámaras
sed -i '' '/<i class="fas fa-bed"><\/i>/,/<\/div>/ s/<span class="feature-value">2<\/span>/<span class="feature-value">1<\/span>/' "$FILE"

# 5. FEATURES - Cambiar SOLO el primer "2" de baños y cambiar "baños" a "baño"
sed -i '' '/<i class="fas fa-bath"><\/i>/,/<\/div>/ s/<span class="feature-value">2<\/span>/<span class="feature-value">1<\/span>/' "$FILE"
sed -i '' 's/<span class="feature-label">baños<\/span>/<span class="feature-label">baño<\/span>/' "$FILE"

# 6. M² - 112.5 → 97.3 y 91.6 → 97.3
sed -i '' 's/112\.5/97.3/g' "$FILE"
sed -i '' 's/91\.6/97.3/g' "$FILE"

# 7. CAMBIAR SOLO totalSlidesHero de 14 a 7
sed -i '' 's/const totalSlidesHero = 14;/const totalSlidesHero = 7;/' "$FILE"

# 8. RUTAS DE IMÁGENES - Cambiar TODAS las referencias
sed -i '' 's|src="images/fachada1\.jpg"|src="images/casa-venta-hacienda-del-rio/foto-1.jpg"|g' "$FILE"
sed -i '' 's|src="images/fachada2\.jpg"|src="images/casa-venta-hacienda-del-rio/foto-2.jpg"|g' "$FILE"
sed -i '' 's|src="images/fachada3\.jpg"|src="images/casa-venta-hacienda-del-rio/foto-3.jpg"|g' "$FILE"
sed -i '' 's|src="images/20250915_134401\.jpg"|src="images/casa-venta-hacienda-del-rio/foto-4.jpg"|g' "$FILE"
sed -i '' 's|src="images/20250915_134444\.jpg"|src="images/casa-venta-hacienda-del-rio/foto-5.jpg"|g' "$FILE"
sed -i '' 's|src="images/20250915_134455\.jpg"|src="images/casa-venta-hacienda-del-rio/foto-6.jpg"|g' "$FILE"
sed -i '' 's|src="images/20250915_134516\.jpg"|src="images/casa-venta-hacienda-del-rio/foto-7.jpg"|g' "$FILE"

# 9. LIGHTBOX ARRAY - Cambiar rutas
sed -i '' "s|{ src: 'images/fachada1\.jpg'|{ src: 'images/casa-venta-hacienda-del-rio/foto-1.jpg'|g" "$FILE"
sed -i '' "s|{ src: 'images/fachada2\.jpg'|{ src: 'images/casa-venta-hacienda-del-rio/foto-2.jpg'|g" "$FILE"
sed -i '' "s|{ src: 'images/fachada3\.jpg'|{ src: 'images/casa-venta-hacienda-del-rio/foto-3.jpg'|g" "$FILE"
sed -i '' "s|{ src: 'images/20250915_134401\.jpg'|{ src: 'images/casa-venta-hacienda-del-rio/foto-4.jpg'|g" "$FILE"
sed -i '' "s|{ src: 'images/20250915_134444\.jpg'|{ src: 'images/casa-venta-hacienda-del-rio/foto-5.jpg'|g" "$FILE"
sed -i '' "s|{ src: 'images/20250915_134455\.jpg'|{ src: 'images/casa-venta-hacienda-del-rio/foto-6.jpg'|g" "$FILE"
sed -i '' "s|{ src: 'images/20250915_134516\.jpg'|{ src: 'images/casa-venta-hacienda-del-rio/foto-7.jpg'|g" "$FILE"

# 10. ELIMINAR slides 8-14 del HTML (mantener estructura intacta)
# Eliminar cada slide completa línea por línea
perl -i -0pe 's/<div class="carousel-slide" data-slide="7">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow")//gs' "$FILE"
perl -i -0pe 's/<div class="carousel-slide" data-slide="8">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow")//gs' "$FILE"
perl -i -0pe 's/<div class="carousel-slide" data-slide="9">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow")//gs' "$FILE"
perl -i -0pe 's/<div class="carousel-slide" data-slide="10">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow")//gs' "$FILE"
perl -i -0pe 's/<div class="carousel-slide" data-slide="11">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow")//gs' "$FILE"
perl -i -0pe 's/<div class="carousel-slide" data-slide="12">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow")//gs' "$FILE"
perl -i -0pe 's/<div class="carousel-slide" data-slide="13">.*?<\/div>\s*(?=<div class="carousel-slide"|<button class="carousel-arrow")//gs' "$FILE"

# 11. ELIMINAR dots 8-14
sed -i '' '/<button class="carousel-dot" onclick="goToSlideHero(7)"/d' "$FILE"
sed -i '' '/<button class="carousel-dot" onclick="goToSlideHero(8)"/d' "$FILE"
sed -i '' '/<button class="carousel-dot" onclick="goToSlideHero(9)"/d' "$FILE"
sed -i '' '/<button class="carousel-dot" onclick="goToSlideHero(10)"/d' "$FILE"
sed -i '' '/<button class="carousel-dot" onclick="goToSlideHero(11)"/d' "$FILE"
sed -i '' '/<button class="carousel-dot" onclick="goToSlideHero(12)"/d' "$FILE"
sed -i '' '/<button class="carousel-dot" onclick="goToSlideHero(13)"/d' "$FILE"

# 12. ELIMINAR del lightbox array (fotos 8-14)
sed -i '' "/{ src: 'images\/20250915_134637\.jpg'/d" "$FILE"
sed -i '' "/{ src: 'images\/20250915_134648\.jpg'/d" "$FILE"
sed -i '' "/{ src: 'images\/20250915_134702\.jpg'/d" "$FILE"
sed -i '' "/{ src: 'images\/20250915_134718\.jpg'/d" "$FILE"
sed -i '' "/{ src: 'images\/20250915_134734\.jpg'/d" "$FILE"
sed -i '' "/{ src: 'images\/20250915_134752\.jpg'/d" "$FILE"
sed -i '' "/{ src: 'images\/20250915_134815\.jpg'/d" "$FILE"

# 13. CANONICAL URL y referencias
sed -i '' 's|https://casasenventa\.info/culiacan/infonavit-solidaridad/|https://casasenventa.info/casa-venta-hacienda-del-rio.html|g' "$FILE"
sed -i '' 's|culiacan/infonavit-solidaridad/images/|images/casa-venta-hacienda-del-rio/|g' "$FILE"

# 14. Arreglar favicon/css paths (remover ../)
sed -i '' 's|href="../favicon|href="favicon|g' "$FILE"
sed -i '' 's|href="../pwa-icon|href="pwa-icon|g' "$FILE"
sed -i '' 's|href="../manifest\.json"|href="manifest.json"|g' "$FILE"
sed -i '' 's|<link rel="stylesheet" href="styles\.css">|<link rel="stylesheet" href="culiacan/infonavit-solidaridad/styles.css">|' "$FILE"

# 15. WHATSAPP en sticky bar y mensajes
sed -i '' 's|Me%20interesa%20la%20casa%20en%20Hacienda%20del%20Rio.*%2C000|Me%20interesa%20la%20casa%20en%20Hacienda%20del%20Rio%20de%20%241%2C200%2C000|g' "$FILE"

# 16. META DESCRIPTIONS
sed -i '' 's|2 recámaras, 2 baños|1 recámara, 1 baño|g' "$FILE"

echo "✅ Hacienda del Rio actualizada precisamente"
echo "   💰 Precio: \$1,200,000"
echo "   🛏️  Recámaras: 1"
echo "   🛁 Baños: 1"
echo "   📏 M²: 97.3"
echo "   📸 Fotos: 7"
echo "   🎡 Carrusel: totalSlidesHero = 7"
