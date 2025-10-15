#!/bin/bash

# ============================================================
# CONFIGURACIÓN AUTOMÁTICA - TEST EN 10 MINUTOS
# ============================================================
#
# Este script configura:
# 1. Mac despierta a las 12:10 PM
# 2. Cron ejecuta test a las 12:13 PM
# 3. Script de verificación listo
#
# EJECUTAR ANTES DE CERRAR LA COMPU
# ============================================================

echo "🚀 CONFIGURANDO TEST AUTOMÁTICO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏰ Hora actual: $(date '+%H:%M:%S')"
echo ""

# 1. CONFIGURAR MAC PARA DESPERTAR
echo "1️⃣  Configurando Mac para despertar a las 12:10 PM..."
sudo pmset repeat wake MTWRFSU 12:10:00

if [ $? -eq 0 ]; then
    echo "   ✅ Mac despertará a las 12:10 PM"
else
    echo "   ❌ Error configurando pmset"
    exit 1
fi

# 2. CONFIGURAR CRON PARA TEST (12:13 PM)
echo ""
echo "2️⃣  Configurando cron para ejecutar test a las 12:13 PM..."

SCRIPT_DIR="/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"

# Backup cron actual
crontab -l > /tmp/crontab-backup-$(date +%Y%m%d-%H%M).txt 2>/dev/null

# Remover cron anterior de inmuebles24
crontab -l 2>/dev/null | grep -v "inmuebles24" > /tmp/crontab-new.txt

# Agregar cron de TEST
echo "13 12 * * * cd \"$SCRIPT_DIR\" && /usr/local/bin/node inmuebles24-scraper-TEST.js >> \"$SCRIPT_DIR/logs/TEST-$(date +\%Y\%m\%d-\%H\%M).log\" 2>&1" >> /tmp/crontab-new.txt

# Instalar nuevo crontab
crontab /tmp/crontab-new.txt

echo "   ✅ Cron configurado para 12:13 PM"

# 3. VERIFICAR CONFIGURACIÓN
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CONFIGURACIÓN COMPLETA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📅 PROGRAMACIÓN:"
echo ""
echo "   12:10 PM  🌅 Mac despierta automáticamente"
echo "   12:13 PM  🚀 Cron ejecuta test (1 página)"
echo "   12:14 PM  ✅ Test completo"
echo ""
echo "🔍 VERIFICACIÓN (pmset):"
pmset -g sched
echo ""
echo "🔍 VERIFICACIÓN (cron):"
crontab -l | grep inmuebles24
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 SIGUIENTE PASO:"
echo ""
echo "1. CIERRA tu Mac (put to sleep)"
echo "2. A las 12:14 PM, despierta la Mac"
echo "3. Ejecuta: ./verificar-test-result.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
