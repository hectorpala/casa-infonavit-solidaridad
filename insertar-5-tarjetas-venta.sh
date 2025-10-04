#!/bin/bash

TARJETAS=(
  "tarjeta-casa-venta-vinoramas-390863.html"
  "tarjeta-casa-venta-la-campia-456286.html"
  "tarjeta-casa-venta-la-primavera-521867.html"
  "tarjeta-casa-venta-la-primavera-588180.html"
  "tarjeta-casa-venta-benevento-residencial-658194.html"
)

INDEX="culiacan/index.html"
LINEA=$(grep -n "<!-- BEGIN CARD-ADV" "$INDEX" | head -1 | cut -d: -f1)

echo "📍 Insertando en línea $LINEA de $INDEX"

TEMP_CARDS=$(mktemp)

for TARJETA in "${TARJETAS[@]}"; do
  if [ -f "$TARJETA" ]; then
    echo "   ✅ Insertando: $TARJETA"
    cat "$TARJETA" >> "$TEMP_CARDS"
    echo "" >> "$TEMP_CARDS"
  fi
done

head -n $((LINEA - 1)) "$INDEX" > "$INDEX.tmp"
cat "$TEMP_CARDS" >> "$INDEX.tmp"
tail -n +${LINEA} "$INDEX" >> "$INDEX.tmp"
mv "$INDEX.tmp" "$INDEX"

rm "$TEMP_CARDS"

TOTAL=$(grep -c "<!-- BEGIN CARD-ADV" "$INDEX")
echo "✅ Total tarjetas ahora: $TOTAL"
