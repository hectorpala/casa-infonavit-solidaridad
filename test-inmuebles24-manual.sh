#!/bin/bash

# ============================================================
# TEST MANUAL - INMUEBLES24 SCRAPER
# ============================================================
#
# Este script ejecuta el scraper manualmente simulando el
# entorno de cron para verificar que todo funciona
#
# Uso:
# chmod +x test-inmuebles24-manual.sh
# ./test-inmuebles24-manual.sh
#
# ============================================================

SCRIPT_DIR="/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"
LOG_FILE="$SCRIPT_DIR/logs/test-manual-$(date +%Y%m%d-%H%M).log"

echo "🧪 TEST MANUAL - INMUEBLES24 SCRAPER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Directorio: $SCRIPT_DIR"
echo "📝 Log file: $LOG_FILE"
echo ""

# Crear directorio logs si no existe
mkdir -p "$SCRIPT_DIR/logs"

# Ejecutar el scraper (simulando entorno cron)
echo "▶️  Ejecutando scraper..."
echo ""

cd "$SCRIPT_DIR" && /usr/local/bin/node inmuebles24-scraper.js 2>&1 | tee "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Test completado exitosamente"
    echo "📊 Revisa el log en: $LOG_FILE"
else
    echo "❌ Test falló con código: $EXIT_CODE"
    echo "🔍 Revisa el log para más detalles: $LOG_FILE"
fi

echo ""
echo "📂 Archivos generados:"
ls -lh "$SCRIPT_DIR/inmuebles24-culiacan-historico.json" 2>/dev/null || echo "   ❌ Histórico no generado"
ls -lh "$LOG_FILE" 2>/dev/null || echo "   ❌ Log no generado"
echo ""
