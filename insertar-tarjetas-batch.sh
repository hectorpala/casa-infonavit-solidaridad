#!/bin/bash

# Insertar 10 tarjetas válidas en culiacan/index.html

TARJETAS=(
  "tarjeta-casa-venta-vinoramas-390863.html"
  "tarjeta-casa-venta-la-campia-456286.html"
  "tarjeta-casa-venta-la-primavera-521867.html"
  "tarjeta-casa-venta-la-primavera-588180.html"
  "tarjeta-casa-venta-benevento-residencial-658194.html"
  "tarjeta-casa-venta-playa-linda-930407.html"
  "tarjeta-departamento-venta-temozon-norte-061873.html"
  "tarjeta-casa-venta-ciudad-bugambilia-130891.html"
  "tarjeta-casa-venta-satelite-200219.html"
  "tarjeta-casa-venta-satelite-268864.html"
)

# Leer el index actual
cp culiacan/index.html culiacan/index.html.backup

# Encontrar línea de inserción (antes de la primera tarjeta)
LINEA=$(grep -n "<!-- BEGIN CARD-ADV" culiacan/index.html | head -1 | cut -d: -f1)

echo "📍 Insertando en línea $LINEA de culiacan/index.html"

# Crear archivo temporal con las 10 tarjetas
TEMP_CARDS=$(mktemp)

for TARJETA in "${TARJETAS[@]}"; do
  if [ -f "$TARJETA" ]; then
    echo "   ✅ Insertando: $TARJETA"
    cat "$TARJETA" >> "$TEMP_CARDS"
    echo "" >> "$TEMP_CARDS"  # Nueva línea entre tarjetas
  else
    echo "   ⚠️  No encontrado: $TARJETA"
  fi
done

# Insertar tarjetas ANTES de la línea encontrada
head -n $((LINEA - 1)) culiacan/index.html > culiacan/index.html.tmp
cat "$TEMP_CARDS" >> culiacan/index.html.tmp
tail -n +${LINEA} culiacan/index.html >> culiacan/index.html.tmp
mv culiacan/index.html.tmp culiacan/index.html

rm "$TEMP_CARDS"

echo "✅ 10 tarjetas insertadas en culiacan/index.html"
