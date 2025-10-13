#!/bin/bash

# ============================================================
# SETUP CRON JOB - INMUEBLES24 SCRAPER AUTOMÁTICO
# ============================================================
#
# Este script configura un cron job para ejecutar el scraper
# automáticamente todos los días a las 6:00 AM
#
# Uso:
# chmod +x setup-cron-inmuebles24.sh
# ./setup-cron-inmuebles24.sh
#
# ============================================================

SCRIPT_DIR="/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"
SCRIPT_NAME="inmuebles24-scraper.js"
LOG_DIR="$SCRIPT_DIR/logs"
CRON_COMMAND="0 6 * * * cd \"$SCRIPT_DIR\" && /usr/local/bin/node $SCRIPT_NAME >> \"$LOG_DIR/inmuebles24-$(date +\%Y\%m\%d-\%H\%M).log\" 2>&1"

echo "🔧 Configurando cron job para Inmuebles24 Scraper..."
echo ""

# Crear directorio de logs si no existe
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    echo "✅ Directorio de logs creado: $LOG_DIR"
fi

# Verificar que Node.js existe
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no encontrado. Instala Node.js primero."
    exit 1
fi

NODE_PATH=$(which node)
echo "✅ Node.js encontrado en: $NODE_PATH"

# Verificar que el script existe
if [ ! -f "$SCRIPT_DIR/$SCRIPT_NAME" ]; then
    echo "❌ Script no encontrado: $SCRIPT_DIR/$SCRIPT_NAME"
    exit 1
fi

echo "✅ Script encontrado: $SCRIPT_NAME"
echo ""

# Mostrar el comando que se agregará al cron
echo "📋 Comando cron que se agregará:"
echo "$CRON_COMMAND"
echo ""

# Verificar si ya existe el cron job
if crontab -l 2>/dev/null | grep -q "inmuebles24-scraper.js"; then
    echo "⚠️  Ya existe un cron job para inmuebles24-scraper.js"
    echo ""
    read -p "¿Deseas reemplazarlo? (s/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Operación cancelada"
        exit 0
    fi

    # Eliminar el cron job existente
    crontab -l 2>/dev/null | grep -v "inmuebles24-scraper.js" | crontab -
    echo "✅ Cron job anterior eliminado"
fi

# Agregar el nuevo cron job
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

echo ""
echo "✅ ¡Cron job configurado exitosamente!"
echo ""
echo "📅 El scraper se ejecutará:"
echo "   - Todos los días a las 6:00 AM"
echo "   - Logs en: $LOG_DIR/"
echo ""
echo "🔍 Para ver los cron jobs actuales:"
echo "   crontab -l"
echo ""
echo "🗑️  Para eliminar el cron job:"
echo "   crontab -e"
echo "   (y eliminar la línea que contiene 'inmuebles24-scraper.js')"
echo ""
echo "📊 Para ver los logs:"
echo "   ls -lh $LOG_DIR/"
echo "   tail -f $LOG_DIR/inmuebles24-*.log"
echo ""
