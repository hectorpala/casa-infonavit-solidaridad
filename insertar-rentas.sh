#!/bin/bash

TARJETAS=(
  "tarjeta-departamento-renta-tres-rios-085303.html"
  "tarjeta-casa-renta-belcantto-324200.html"
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
echo "✅ Total tarjetas: $TOTAL"
