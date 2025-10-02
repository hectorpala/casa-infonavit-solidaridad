#!/bin/bash
FILE="casa-renta-privanzas-natura.html"

echo "🏠 Actualizando Casa Amplia Privanzas Natura..."

# 1. PRECIO - $1,750,000 → $27,000
sed -i '' 's/\$1,750,000/\$27,000/g' "$FILE"
sed -i '' 's/1750000/27000/g' "$FILE"

# 2. TÍTULO
sed -i '' 's/Casa Infonavit Solidaridad/Casa Amplia Privanzas Natura/g' "$FILE"

# 3. UBICACIÓN  
sed -i '' 's/Blvrd Elbert 2609, Infonavit Solidaridad/Vialidad del Congreso 2361, Privanzas Natura/g' "$FILE"
sed -i '' 's/Blvrd Elbert 2609/Vialidad del Congreso 2361/g' "$FILE"
sed -i '' 's/Infonavit Solidaridad, 80200/Privanzas Natura, 80200/g' "$FILE"

# 4. RECÁMARAS 2 → 3
sed -i '' 's/"feature-value">2<\/span> recámaras/"feature-value">3<\/span> recámaras/g' "$FILE"
sed -i '' 's/"numberOfBedrooms": 2/"numberOfBedrooms": 3/g' "$FILE"

# 5. BAÑOS 2 → 4.5
sed -i '' 's/"feature-value">2<\/span> baños/"feature-value">4.5<\/span> baños/g' "$FILE"
sed -i '' 's/"numberOfBathroomsTotal": 2/"numberOfBathroomsTotal": 4.5/g' "$FILE"

# 6. M² (mantener valores originales por ahora, ajustar si es necesario)
# Privanzas no tiene datos específicos de m² en el HTML original

# 7. totalSlidesHero 14 → 9
sed -i '' 's/const totalSlidesHero = 14;/const totalSlidesHero = 9;/g' "$FILE"

# 8. FOTOS
sed -i '' 's|href="styles\.css"|href="culiacan/infonavit-solidaridad/styles.css"|g' "$FILE"
sed -i '' 's|images/fachada1\.jpg|images/casa-renta-privanzas-natura/foto-1.jpg|g' "$FILE"
sed -i '' 's|images/fachada2\.jpg|images/casa-renta-privanzas-natura/foto-2.jpg|g' "$FILE"
sed -i '' 's|images/fachada3\.jpg|images/casa-renta-privanzas-natura/foto-3.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134401\.jpg|images/casa-renta-privanzas-natura/foto-4.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134444\.jpg|images/casa-renta-privanzas-natura/foto-5.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134455\.jpg|images/casa-renta-privanzas-natura/foto-6.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134516\.jpg|images/casa-renta-privanzas-natura/foto-7.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134535\.jpg|images/casa-renta-privanzas-natura/foto-8.jpg|g' "$FILE"
sed -i '' 's|images/20250915_134600\.jpg|images/casa-renta-privanzas-natura/foto-9.jpg|g' "$FILE"

echo "✅ Datos reemplazados"
