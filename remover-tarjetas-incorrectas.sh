#!/bin/bash

SLUGS_TO_REMOVE=(
  "casa-venta-playa-linda-930407"
  "departamento-venta-temozon-norte-061873"
  "casa-venta-ciudad-bugambilia-130891"
  "casa-venta-satelite-200219"
  "casa-venta-satelite-268864"
)

INPUT="culiacan/index.html"
TEMP=$(mktemp)

cp "$INPUT" "$TEMP"

for SLUG in "${SLUGS_TO_REMOVE[@]}"; do
  echo "🗑️  Removiendo tarjeta: $SLUG"
  
  # Usar sed para eliminar desde BEGIN hasta END (inclusive)
  sed -i '' "/<!-- BEGIN CARD-ADV $SLUG -->/,/<!-- END CARD-ADV $SLUG -->/d" "$TEMP"
done

mv "$TEMP" "$INPUT"

# Contar tarjetas restantes
TOTAL=$(grep -c "<!-- BEGIN CARD-ADV" "$INPUT")
echo "✅ Tarjetas restantes: $TOTAL"
