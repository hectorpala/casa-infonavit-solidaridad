#!/bin/bash

# ============================================================
# CONFIGURACIÓN FINAL - PRODUCCIÓN 7 AM
# ============================================================
#
# Este script configura TODO para producción:
# - pmset wake 6:55 AM
# - Cron 7:00 AM
# - Scraper a 10 páginas
#
# Ejecutar UNA VEZ con tu contraseña
# ============================================================

echo "🚀 CONFIGURANDO PRODUCCIÓN - 7 AM DIARIO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Configurar wake 6:55 AM
echo "1️⃣  Configurando despertar a las 6:55 AM..."
echo ""
echo "🔐 Se te pedirá tu contraseña..."
sudo pmset repeat wake MTWRFSU 06:55:00

if [ $? -eq 0 ]; then
    echo "   ✅ Mac despertará a las 6:55 AM"
else
    echo "   ❌ Error configurando pmset"
    exit 1
fi

# 2. Configurar cron 7:00 AM
echo ""
echo "2️⃣  Configurando cron para 7:00 AM..."

SCRIPT_DIR="/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"

cat > /tmp/crontab-produccion.txt << EOF
0 7 * * * cd "$SCRIPT_DIR" && /usr/local/bin/node inmuebles24-scraper.js >> "$SCRIPT_DIR/logs/inmuebles24-\$(date +\%Y\%m\%d-\%H\%M).log" 2>&1
EOF

crontab /tmp/crontab-produccion.txt
echo "   ✅ Cron configurado para 7:00 AM"

# 3. Cambiar scraper a 10 páginas
echo ""
echo "3️⃣  Configurando scraper a 10 páginas..."

cd "$SCRIPT_DIR"
# Backup
cp inmuebles24-scraper.js inmuebles24-scraper.js.backup

# Cambiar TOTAL_PAGES de 2 a 10
sed -i '' 's/TOTAL_PAGES: 2/TOTAL_PAGES: 10/' inmuebles24-scraper.js
sed -i '' 's/DELAY_BETWEEN_PAGES: 3000/DELAY_BETWEEN_PAGES: 4000/' inmuebles24-scraper.js

echo "   ✅ Scraper configurado para 10 páginas"

# 4. Verificación
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CONFIGURACIÓN COMPLETA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📅 DESPERTAR:"
pmset -g sched | grep "6:55AM"
echo ""
echo "📅 CRON:"
crontab -l
echo ""
echo "📄 SCRAPER:"
grep "TOTAL_PAGES:" inmuebles24-scraper.js | head -1
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 SISTEMA LISTO PARA PRODUCCIÓN"
echo ""
echo "⏰ El scraper se ejecutará automáticamente:"
echo "   - Todos los días a las 7:00 AM"
echo "   - Mac despierta a las 6:55 AM"
echo "   - Scrapea 10 páginas (~300 propiedades)"
echo "   - Compara con histórico"
echo "   - Envía notificaciones si hay cambios"
echo ""
