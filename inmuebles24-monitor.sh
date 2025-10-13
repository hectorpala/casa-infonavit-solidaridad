#!/bin/bash

# ============================================================
# INMUEBLES24 MONITOR - CON NOTIFICACIONES
# ============================================================
#
# Ejecuta el scraper y muestra un resumen de cambios
# Uso: ./inmuebles24-monitor.sh
#
# ============================================================

SCRIPT_DIR="/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"
LOG_FILE="$SCRIPT_DIR/logs/monitor-$(date +%Y%m%d-%H%M%S).log"

# Crear directorio de logs si no existe
mkdir -p "$SCRIPT_DIR/logs"

echo "🚀 INMUEBLES24 MONITOR - $(date)" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Ejecutar scraper
cd "$SCRIPT_DIR"
node inmuebles24-scraper.js 2>&1 | tee -a "$LOG_FILE"

# Extraer resumen del log
echo "" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"
echo "📊 RESUMEN EJECUTADO A LAS $(date +%H:%M:%S)" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"

# Buscar estadísticas en el log
TOTAL=$(grep "Total propiedades actuales:" "$LOG_FILE" | tail -1 | grep -o '[0-9]*')
NUEVAS=$(grep "PROPIEDADES NUEVAS" "$LOG_FILE" | tail -1 | grep -o '([0-9]*)' | tr -d '()')
ELIMINADAS=$(grep "PROPIEDADES ELIMINADAS" "$LOG_FILE" | tail -1 | grep -o '([0-9]*)' | tr -d '()')

echo "📈 Total propiedades: $TOTAL" | tee -a "$LOG_FILE"
echo "✨ Nuevas: ${NUEVAS:-0}" | tee -a "$LOG_FILE"
echo "❌ Eliminadas: ${ELIMINADAS:-0}" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Enviar notificación de macOS si hay cambios
if [ "${NUEVAS:-0}" -gt 0 ] || [ "${ELIMINADAS:-0}" -gt 0 ]; then
    osascript -e "display notification \"Nuevas: ${NUEVAS:-0}, Eliminadas: ${ELIMINADAS:-0}\" with title \"Inmuebles24 Monitor\" sound name \"Ping\""
    echo "🔔 Notificación enviada" | tee -a "$LOG_FILE"
fi

echo "✅ Log guardado en: $LOG_FILE" | tee -a "$LOG_FILE"
echo ""
