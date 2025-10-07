#!/bin/bash

# Script de monitoreo automático
# Ejecuta el monitor y guarda logs

# Directorio del proyecto
cd "/Users/hectorpc/Documents/Hector Palazuelos/Google My Business/landing casa solidaridad"

# Fecha para logs
FECHA=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_DIR="logs-monitor"
LOG_FILE="$LOG_DIR/monitor-$FECHA.log"

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# Ejecutar monitor
echo "=== Monitor ejecutado: $(date) ===" >> "$LOG_FILE"
node monitor-nuevas-propiedades.js "https://propiedades.com/culiacan/residencial-venta" >> "$LOG_FILE" 2>&1

# Guardar código de salida
EXIT_CODE=$?

# Si hubo nuevas propiedades, enviar notificación (opcional)
if grep -q "PROPIEDADES NUEVAS" "$LOG_FILE"; then
    echo "✨ NUEVAS PROPIEDADES DETECTADAS - Ver: $LOG_FILE" >> "$LOG_DIR/alertas.txt"

    # Opcional: Enviar notificación de escritorio (macOS)
    osascript -e 'display notification "Nuevas propiedades detectadas en propiedades.com" with title "Monitor Inmobiliario"'
fi

echo "Monitor completado con código: $EXIT_CODE" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Limpiar logs viejos (mantener solo últimos 30 días)
find "$LOG_DIR" -name "monitor-*.log" -mtime +30 -delete

exit $EXIT_CODE
