#!/bin/bash

# ============================================================
# VERIFICACIÓN DE RESULTADOS DEL TEST
# ============================================================
#
# Ejecutar después de las 12:14 PM para ver resultados
#
# Uso: ./verificar-test-result.sh
#
# ============================================================

SCRIPT_DIR="/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"

echo "🔍 VERIFICACIÓN DE RESULTADOS - TEST AUTOMÁTICO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏰ Hora actual: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 1. Verificar si existe el log del test
echo "📝 LOGS DEL TEST:"
echo ""

LOG_FILE=$(find "$SCRIPT_DIR/logs" -name "TEST-20251014-12*.log" 2>/dev/null | tail -1)

if [ -z "$LOG_FILE" ]; then
    echo "   ❌ NO se encontró log del test"
    echo ""
    echo "   Posibles causas:"
    echo "   1. El test aún no se ha ejecutado (espera hasta 12:14 PM)"
    echo "   2. La Mac no despertó a las 12:10 PM"
    echo "   3. El cron no se ejecutó"
    echo ""
    echo "   🔍 Verificar programación de wake:"
    pmset -g sched
    echo ""
    echo "   🔍 Verificar cron:"
    crontab -l | grep inmuebles24
else
    echo "   ✅ Log encontrado: $(basename $LOG_FILE)"
    echo "   📏 Tamaño: $(ls -lh "$LOG_FILE" | awk '{print $5}')"
    echo ""
    echo "   📄 CONTENIDO:"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat "$LOG_FILE" | sed 's/^/   /'
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

echo ""

# 2. Verificar archivo de resultado JSON
echo "📊 RESULTADO JSON:"
echo ""

if [ -f "$SCRIPT_DIR/inmuebles24-TEST-result.json" ]; then
    echo "   ✅ Archivo de resultado existe"
    ls -lh "$SCRIPT_DIR/inmuebles24-TEST-result.json"
    echo ""

    # Parsear resultado
    SUCCESS=$(node -e "try { const r = require('$SCRIPT_DIR/inmuebles24-TEST-result.json'); console.log(r.success || false); } catch(e) { console.log('false'); }" 2>&1)
    PROPS=$(node -e "try { const r = require('$SCRIPT_DIR/inmuebles24-TEST-result.json'); console.log(r.propertiesFound || 0); } catch(e) { console.log('0'); }" 2>&1)
    DURATION=$(node -e "try { const r = require('$SCRIPT_DIR/inmuebles24-TEST-result.json'); console.log(r.duration || 'N/A'); } catch(e) { console.log('N/A'); }" 2>&1)

    echo "   🎯 Test exitoso: $SUCCESS"
    echo "   📊 Propiedades encontradas: $PROPS"
    echo "   ⏱️  Duración: ${DURATION}s"
    echo ""

    # Mostrar primeras propiedades
    if [ "$PROPS" -gt 0 ]; then
        echo "   📋 Primeras propiedades (títulos):"
        node -e "try { const r = require('$SCRIPT_DIR/inmuebles24-TEST-result.json'); r.properties.slice(0,3).forEach((p,i) => console.log('      ' + (i+1) + '. ' + p.title.substring(0,60) + '...')); } catch(e) { console.log('Error'); }" 2>&1
    fi
else
    echo "   ⚠️  Archivo de resultado NO existe"
    echo "   El scraper no completó la ejecución"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 3. RESUMEN FINAL
if [ -n "$LOG_FILE" ] && [ -f "$SCRIPT_DIR/inmuebles24-TEST-result.json" ] && [ "$SUCCESS" = "true" ]; then
    echo "✅ RESULTADO: TEST EXITOSO"
    echo ""
    echo "🎉 El sistema funciona correctamente:"
    echo "   ✅ Mac despertó a las 12:10 PM"
    echo "   ✅ WiFi se conectó automáticamente"
    echo "   ✅ Cron ejecutó el test a las 12:13 PM"
    echo "   ✅ Scraper completó exitosamente"
    echo "   ✅ Encontró $PROPS propiedades en ${DURATION}s"
    echo ""
    echo "🚀 PRÓXIMO PASO:"
    echo "   Restaurar configuración de producción:"
    echo "   ./restaurar-produccion.sh"
elif [ -n "$LOG_FILE" ]; then
    echo "⚠️  RESULTADO: TEST CON PROBLEMAS"
    echo ""
    echo "El cron se ejecutó pero hubo errores."
    echo "Revisa el log completo arriba."
else
    echo "❌ RESULTADO: TEST NO SE EJECUTÓ"
    echo ""
    echo "El cron NO se ejecutó. Posibles causas:"
    echo "1. La Mac no despertó (verificar pmset)"
    echo "2. Aún no son las 12:13 PM (espera más)"
    echo "3. El cron está mal configurado"
    echo ""
    echo "🔧 Verificar configuración:"
    echo "   pmset -g sched"
    echo "   crontab -l"
fi

echo ""
