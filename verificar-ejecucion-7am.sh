#!/bin/bash

# ============================================================
# VERIFICACIÓN POST-EJECUCIÓN 7 AM
# ============================================================
#
# Ejecuta este script después de las 7:05 AM para verificar
# que el cron se ejecutó correctamente
#
# Uso:
# ./verificar-ejecucion-7am.sh
#
# ============================================================

SCRIPT_DIR="/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"

echo "🔍 VERIFICACIÓN DE EJECUCIÓN - 7:00 AM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏰ Hora actual: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 1. Verificar si existe el log de las 7 AM
echo "📝 LOGS GENERADOS:"
echo ""

LOG_FILES=$(find "$SCRIPT_DIR/logs" -name "inmuebles24-20251014-07*.log" 2>/dev/null)

if [ -z "$LOG_FILES" ]; then
    echo "   ❌ NO se encontró log de las 7 AM"
    echo ""
    echo "   Posibles causas:"
    echo "   1. El cron aún no se ha ejecutado (espera hasta las 7:01 AM)"
    echo "   2. Problema de permisos en macOS"
    echo "   3. El scraper falló antes de crear el log"
    echo ""
    echo "   📂 Logs disponibles:"
    ls -lh "$SCRIPT_DIR/logs/"*.log 2>/dev/null || echo "      (ninguno)"
else
    echo "   ✅ Log encontrado:"
    ls -lh $LOG_FILES
    echo ""
    echo "   📄 CONTENIDO (últimas 50 líneas):"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    tail -50 $LOG_FILES | sed 's/^/   /'
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

echo ""

# 2. Verificar histórico JSON
echo "📊 HISTÓRICO JSON:"
echo ""

if [ -f "$SCRIPT_DIR/inmuebles24-culiacan-historico.json" ]; then
    echo "   ✅ Histórico existe:"
    ls -lh "$SCRIPT_DIR/inmuebles24-culiacan-historico.json"
    echo ""

    # Extraer última revisión y estadísticas
    LAST_CHECK=$(node -e "try { const h = require('$SCRIPT_DIR/inmuebles24-culiacan-historico.json'); console.log(h.lastCheck || 'N/A'); } catch(e) { console.log('Error: ' + e.message); }" 2>&1)
    TOTAL_PROPS=$(node -e "try { const h = require('$SCRIPT_DIR/inmuebles24-culiacan-historico.json'); console.log(h.stats?.totalProperties || 'N/A'); } catch(e) { console.log('Error: ' + e.message); }" 2>&1)
    NUEVAS=$(node -e "try { const h = require('$SCRIPT_DIR/inmuebles24-culiacan-historico.json'); console.log(h.stats?.nuevasDetectadas || 'N/A'); } catch(e) { console.log('Error: ' + e.message); }" 2>&1)
    ELIMINADAS=$(node -e "try { const h = require('$SCRIPT_DIR/inmuebles24-culiacan-historico.json'); console.log(h.stats?.eliminadasDetectadas || 'N/A'); } catch(e) { console.log('Error: ' + e.message); }" 2>&1)

    echo "   📅 Última revisión: $LAST_CHECK"
    echo "   📊 Total propiedades: $TOTAL_PROPS"
    echo "   ✨ Nuevas detectadas: $NUEVAS"
    echo "   ❌ Eliminadas: $ELIMINADAS"
else
    echo "   ⚠️  Histórico NO existe aún"
    echo "   (Se creará en la primera ejecución)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 3. Verificar estado del cron
echo "⚙️  CONFIGURACIÓN CRON:"
echo ""
crontab -l | grep inmuebles24 | sed 's/^/   /'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 4. Resumen final
if [ -n "$LOG_FILES" ]; then
    # Verificar si el log contiene errores
    if grep -q "Error fatal\|❌" $LOG_FILES 2>/dev/null; then
        echo "⚠️  RESULTADO: EJECUCIÓN CON ERRORES"
        echo ""
        echo "El scraper se ejecutó pero hubo problemas."
        echo "Revisa el log completo: $LOG_FILES"
    else
        echo "✅ RESULTADO: EJECUCIÓN EXITOSA"
        echo ""
        echo "El cron job funcionó correctamente a las 7 AM."
        echo "El scraper completó su tarea sin errores."
    fi
else
    echo "❌ RESULTADO: NO SE EJECUTÓ"
    echo ""
    echo "El cron job NO se ejecutó a las 7 AM."
    echo ""
    echo "📋 PRÓXIMOS PASOS:"
    echo "1. Espera hasta las 7:01 AM y ejecuta este script de nuevo"
    echo "2. Si sigue sin funcionar, ejecuta test manual:"
    echo "   ./test-inmuebles24-manual.sh"
    echo "3. Considera implementar LaunchAgent (ver DIAGNOSTICO-CRON-INMUEBLES24.md)"
fi

echo ""
