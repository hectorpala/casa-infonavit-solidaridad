#!/bin/bash
FILE="casa-renta-centenario.html"

# 1. PRECIO
sed -i '' 's/\$1,750,000/\$18,000/g' "$FILE"
sed -i '' 's/1750000/18000/g' "$FILE"

# 2. TÍTULO
sed -i '' 's/Casa Infonavit Solidaridad/Casa en Renta Colonia Centenario/g' "$FILE"

# 3. UBICACIÓN  
sed -i '' 's/Blvrd Elbert 2609, Infonavit Solidaridad/Privada Habitanía, Av. Astral, Colonia Centenario/g' "$FILE"
sed -i '' 's/Blvrd Elbert 2609/Privada Habitanía/g' "$FILE"
sed -i '' 's/Infonavit Solidaridad, 80200/Colonia Centenario, 80200/g' "$FILE"

# 4. RECÁMARAS 2 → 3
sed -i '' 's/"feature-value">2<\/span> recámaras/"feature-value">3<\/span> recámaras/g' "$FILE"
sed -i '' 's/"numberOfBedrooms": 2/"numberOfBedrooms": 3/g' "$FILE"

# 5. BAÑOS 2 → 2.5
sed -i '' 's/"feature-value">2<\/span> baños/"feature-value">2.5<\/span> baños/g' "$FILE"
sed -i '' 's/"numberOfBathroomsTotal": 2/"numberOfBathroomsTotal": 2.5/g' "$FILE"

# 6. M² 91.6 → 183
sed -i '' 's/91\.6/183/g' "$FILE"

# 7. M² 112.5 → 105
sed -i '' 's/112\.5/105/g' "$FILE"

# 8. totalSlidesHero 14 → 8
sed -i '' 's/const totalSlidesHero = 14;/const totalSlidesHero = 8;/g' "$FILE"

# 9. FOTOS - Solo cambiar paths, NO tocar HTML structure
sed -i '' 's|images/fachada1\.jpg|images/casa-renta-centenario/foto-1.jpg|g' "$FILE"
sed -i '' 's|images/fachada2\.jpg|images/casa-renta-centenario/foto-2.jpg|g' "$FILE"
sed -i '' 's|images/fachada3\.jpg|images/casa-renta-centenario/foto-3.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134401\.jpg|images/casa-renta-centenario/foto-4.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134444\.jpg|images/casa-renta-centenario/foto-5.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134455\.jpg|images/casa-renta-centenario/foto-6.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134516\.jpg|images/casa-renta-centenario/foto-7.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134535\.jpg|images/casa-renta-centenario/foto-8.jpg|g' "$FILE"

echo "✅ Datos reemplazados (estructura HTML intacta)"
