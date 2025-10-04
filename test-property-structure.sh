#!/bin/bash
# TEST AUTOMÁTICO: Verifica que propiedades generadas estén correctas

echo "🧪 TEST: Verificando estructura de propiedades..."

PROPERTY_DIR=$1

if [ -z "$PROPERTY_DIR" ]; then
    echo "❌ Uso: ./test-property-structure.sh culiacan/casa-venta-slug"
    exit 1
fi

ERRORS=0

# 1. Verificar que exista index.html
if [ ! -f "$PROPERTY_DIR/index.html" ]; then
    echo "❌ FALTA: $PROPERTY_DIR/index.html"
    ERRORS=$((ERRORS + 1))
fi

# 2. Verificar que exista styles.css
if [ ! -f "$PROPERTY_DIR/styles.css" ]; then
    echo "❌ FALTA: $PROPERTY_DIR/styles.css"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ styles.css existe"
fi

# 3. Verificar que exista carpeta images/
if [ ! -d "$PROPERTY_DIR/images" ]; then
    echo "❌ FALTA: $PROPERTY_DIR/images/"
    ERRORS=$((ERRORS + 1))
else
    FOTO_COUNT=$(ls -1 "$PROPERTY_DIR/images/"*.jpg 2>/dev/null | wc -l)
    echo "✅ $FOTO_COUNT fotos en images/"
fi

# 4. Verificar rutas de imágenes en HTML (NO deben tener slug)
BAD_PATHS=$(grep -c 'src="images/.*-.*/' "$PROPERTY_DIR/index.html" 2>/dev/null)
if [ "$BAD_PATHS" -gt 0 ]; then
    echo "❌ RUTAS INCORRECTAS: Encontradas $BAD_PATHS rutas con slug (images/casa-venta-*/)"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Rutas de imágenes correctas (images/foto-X.jpg)"
fi

# 5. Verificar que lightbox array tenga rutas correctas
if grep -q "images/.*-.*/" "$PROPERTY_DIR/index.html" 2>/dev/null; then
    echo "❌ LIGHTBOX: Array tiene rutas con slug"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Lightbox array correcto"
fi

# 6. Verificar que CSS se cargue
if ! grep -q 'href="styles.css"' "$PROPERTY_DIR/index.html" 2>/dev/null; then
    echo "❌ CSS: No apunta a styles.css"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ CSS link correcto"
fi

# RESULTADO
echo ""
if [ $ERRORS -eq 0 ]; then
    echo "🎉 TODOS LOS TESTS PASARON"
    exit 0
else
    echo "❌ $ERRORS ERRORES ENCONTRADOS"
    exit 1
fi
