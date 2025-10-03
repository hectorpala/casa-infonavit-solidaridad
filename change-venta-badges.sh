#!/bin/bash

# Crear backup
cp culiacan/index.html culiacan/index.html.bak

# Obtener lista de todas las tarjetas
grep "BEGIN CARD-ADV" culiacan/index.html | grep -o 'CARD-ADV [^>]*' | cut -d' ' -f2 > all-cards.txt

echo "🔧 Procesando badges..."

venta=0
renta=0

while read slug; do
  # Si NO es renta (no contiene "renta" en el slug)
  if [[ ! "$slug" =~ "renta" ]]; then
    # Cambiar bg-orange-500 a bg-green-600 en esta sección
    perl -i -pe "
      BEGIN { \$in_card = 0; }
      if (/BEGIN CARD-ADV \Q$slug\E/) { \$in_card = 1; }
      if (\$in_card && /bg-orange-500/) { s/bg-orange-500/bg-green-600/g; }
      if (/END CARD-ADV \Q$slug\E/) { \$in_card = 0; }
    " culiacan/index.html
    echo "✅ VENTA: $slug → verde"
    ((venta++))
  else
    ((renta++))
  fi
done < all-cards.txt

echo ""
echo "📊 Resumen:"
echo "   - VENTA (verde): $venta"
echo "   - RENTA (naranja): $renta"

rm all-cards.txt
