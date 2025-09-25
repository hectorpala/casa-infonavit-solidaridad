#!/bin/bash

# 🖼️ SCRIPT AUTOMÁTICO DE OPTIMIZACIÓN DE FOTOS
# Uso: ./optimizar-fotos.sh [carpeta-origen] [carpeta-destino]
# Ejemplo: ./optimizar-fotos.sh "/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/mi-propiedad" "images/mi-propiedad"

if [ $# -ne 2 ]; then
    echo "❌ Error: Faltan parámetros"
    echo "📖 Uso: $0 [carpeta-origen] [carpeta-destino]"
    exit 1
fi

ORIGEN="$1"
DESTINO="$2"

echo "🎯 INICIANDO OPTIMIZACIÓN DE FOTOS"
echo "📂 Origen: $ORIGEN"
echo "📁 Destino: $DESTINO"

# Crear directorio destino si no existe
mkdir -p "$DESTINO"

# Contador de fotos optimizadas
CONTADOR=0

# Procesar cada imagen en el directorio origen
for archivo in "$ORIGEN"/*; do
    if [[ -f "$archivo" ]]; then
        nombre_archivo=$(basename "$archivo")
        extension="${nombre_archivo##*.}"
        nombre_sin_ext="${nombre_archivo%.*}"
        
        # Convertir a minúsculas para comparación
        ext_lower=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
        
        case $ext_lower in
            jpg|jpeg)
                echo "🔧 Optimizando JPG: $nombre_archivo"
                magick "$archivo" -quality 85 -resize 1200x "$DESTINO/$nombre_archivo"
                ((CONTADOR++))
                ;;
            png)
                echo "🔄 Convirtiendo PNG a JPG: $nombre_archivo"
                nuevo_nombre="${nombre_sin_ext}.jpg"
                magick "$archivo" -quality 85 -resize 1200x "$DESTINO/$nuevo_nombre"
                ((CONTADOR++))
                ;;
            webp)
                echo "🔄 Convirtiendo WebP a JPG: $nombre_archivo"
                nuevo_nombre="${nombre_sin_ext}.jpg"
                magick "$archivo" -quality 85 -resize 1200x "$DESTINO/$nuevo_nombre"
                ((CONTADOR++))
                ;;
            *)
                echo "⏭️  Saltando archivo no compatible: $nombre_archivo"
                ;;
        esac
    fi
done

echo ""
echo "✅ OPTIMIZACIÓN COMPLETADA"
echo "📊 Total de fotos optimizadas: $CONTADOR"
echo "📁 Ubicación: $DESTINO"
echo ""
echo "🎯 RESUMEN DE OPTIMIZACIONES APLICADAS:"
echo "   • Calidad: 85% (balance perfecto web/calidad)"
echo "   • Máximo ancho: 1200px (responsive)"
echo "   • PNG → JPG automático (reduce peso 70%)"
echo "   • WebP → JPG automático"
echo ""

# Mostrar tamaños antes/después si es posible
if [ -d "$ORIGEN" ] && [ -d "$DESTINO" ]; then
    echo "📏 ANÁLISIS DE TAMAÑO:"
    SIZE_ORIGEN=$(du -sh "$ORIGEN" | cut -f1)
    SIZE_DESTINO=$(du -sh "$DESTINO" | cut -f1)
    echo "   📂 Origen: $SIZE_ORIGEN"
    echo "   📁 Destino: $SIZE_DESTINO"
fi