#!/bin/bash

SOURCE_DIR="/Users/hectorpc/Documents/Hector Palazuelos/PROYECTOS/casa venta paseo toscana"
DEST_DIR="images/casa-venta-stanza-toscana"

mkdir -p "$DEST_DIR"

cd "$SOURCE_DIR"
i=1
for f in *.jpeg; do
    destino="/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad/$DEST_DIR/foto-$i.jpg"
    sips -s format jpeg -s formatOptions 85 --resampleWidth 1200 "$f" --out "$destino" 2>&1 | grep -v "Warning"
    echo "✓ foto-$i.jpg"
    i=$((i + 1))
done

cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"
echo ""
echo "📊 Resumen:"
ls -lh "$DEST_DIR"
