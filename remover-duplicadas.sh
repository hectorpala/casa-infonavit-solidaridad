#!/bin/bash

DUPLICADAS=(
  "casa-venta-vinoramas-390863"
  "casa-venta-la-campia-456286"
  "casa-venta-la-primavera-521867"
  "casa-venta-la-primavera-588180"
  "casa-venta-benevento-residencial-658194"
)

INDEX="culiacan/index.html"

for SLUG in "${DUPLICADAS[@]}"; do
  echo "🔍 Procesando: $SLUG"
  
  # Contar cuántas veces aparece
  COUNT=$(grep -c "BEGIN CARD-ADV $SLUG" "$INDEX")
  
  if [ "$COUNT" -gt 1 ]; then
    echo "   ⚠️  Duplicada $COUNT veces, removiendo primera ocurrencia..."
    
    # Remover SOLO la primera ocurrencia
    sed -i '' "0,/<!-- BEGIN CARD-ADV $SLUG -->/,/<!-- END CARD-ADV $SLUG -->/d" "$INDEX"
    echo "   ✅ Primera ocurrencia removida"
  else
    echo "   ✓ No duplicada"
  fi
done

TOTAL=$(grep -c "BEGIN CARD-ADV" "$INDEX")
echo ""
echo "✅ Total tarjetas: $TOTAL"
