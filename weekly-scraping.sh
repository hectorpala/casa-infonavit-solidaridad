#!/bin/bash

##############################################################################
# SCRIPT DE SCRAPING SEMANAL - INMUEBLES24
##############################################################################
#
# Automatización completa del pipeline:
# 1. Extractor → 2. Auditor → 3. Lote Manager → 4. Orquestador → 5. Reporte
#
# Uso:
#   ./weekly-scraping.sh
#   ./weekly-scraping.sh --notify slack
#   ./weekly-scraping.sh --dry-run
#
# Configuración:
#   Editar las variables SEARCH_URL, PRICE_RANGE, etc. abajo
#
# Cron (ejecutar cada lunes a las 2 AM):
#   0 2 * * 1 cd /path/to/project && ./weekly-scraping.sh --notify slack
#
##############################################################################

set -e  # Exit on error

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

# URL de búsqueda en Inmuebles24
SEARCH_URL="https://www.inmuebles24.com/venta/casas/culiacan-sinaloa/3000000-4000000-pesos/"

# Metadata del lote
PRICE_RANGE="3M-4M"
CITY="Culiacán, Sinaloa"
PROPERTY_TYPE="Casas en Venta"
NOTES="Lote automático semanal - $(date +%Y-%m-%d)"

# Opciones
DRY_RUN=""
NOTIFY_TYPE=""

# Procesar argumentos
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN="--dry-run"
            echo "⚠️  MODO DRY RUN ACTIVADO"
            ;;
        --notify)
            shift
            NOTIFY_TYPE="--notify $1"
            echo "📬 Notificaciones activadas: $1"
            ;;
    esac
done

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_section() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  $1"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
}

# ============================================================================
# PIPELINE COMPLETO
# ============================================================================

log_section "🚀 INICIANDO PIPELINE DE SCRAPING SEMANAL"

# PASO 1: EXTRACTOR
log_section "📥 PASO 1: EXTRACTOR DE URLS"
log "Extrayendo URLs desde Inmuebles24..."

node 1extractorurlinmuebles24.js "$SEARCH_URL"

# Encontrar el archivo más reciente
LATEST_URLS=$(ls -t urls-inmuebles24-*-valid.txt 2>/dev/null | head -1)

if [ -z "$LATEST_URLS" ]; then
    log "❌ ERROR: No se generó archivo de URLs"
    exit 1
fi

log "✅ URLs extraídas: $LATEST_URLS"

# Contar URLs
URL_COUNT=$(wc -l < "$LATEST_URLS")
log "📊 Total de URLs extraídas: $URL_COUNT"

if [ "$URL_COUNT" -eq 0 ]; then
    log "⚠️  No se encontraron URLs nuevas. Terminando."
    exit 0
fi

# PASO 2: AUDITOR
log_section "🔍 PASO 2: AUDITOR DE URLS"
log "Auditando URLs y detectando duplicadas..."

node auditor-urls-inmuebles24.js "$LATEST_URLS"

# Encontrar archivo de nuevas URLs
LATEST_AUDIT=$(ls -t audit-*-nuevas.txt 2>/dev/null | head -1)

if [ -z "$LATEST_AUDIT" ]; then
    log "❌ ERROR: No se generó archivo de auditoría"
    exit 1
fi

log "✅ Auditoría completada: $LATEST_AUDIT"

# Contar nuevas URLs
NEW_URL_COUNT=$(wc -l < "$LATEST_AUDIT")
log "📊 URLs nuevas (no duplicadas): $NEW_URL_COUNT"

if [ "$NEW_URL_COUNT" -eq 0 ]; then
    log "⚠️  No hay URLs nuevas para procesar. Todas son duplicadas."
    exit 0
fi

# PASO 3: LOTE MANAGER
log_section "📦 PASO 3: GESTOR DE LOTES"
log "Creando lote con metadata..."

node lote-manager.js init "$LATEST_AUDIT" \
    --rango-precio "$PRICE_RANGE" \
    --ciudad "$CITY" \
    --tipo "$PROPERTY_TYPE" \
    --notas "$NOTES"

log "✅ Lote creado exitosamente"

# Mostrar status del lote
log "📊 Status del lote:"
node lote-manager.js status | grep -A 20 "PROGRESO:"

# PASO 4: ORQUESTADOR
log_section "🎯 PASO 4: ORQUESTADOR DE SCRAPING"
log "Iniciando scraping automático con reintentos..."

if [ -n "$DRY_RUN" ]; then
    log "⚠️  Ejecutando en modo DRY RUN (sin scrapear realmente)"
fi

node orchestrator.js $DRY_RUN $NOTIFY_TYPE

log "✅ Orquestación completada"

# PASO 5: REPORTE FINAL
log_section "📊 PASO 5: REPORTE FINAL"

# Encontrar último reporte del orquestador
LATEST_REPORT=$(ls -t reports/orchestrator-*.json 2>/dev/null | head -1)

if [ -z "$LATEST_REPORT" ]; then
    log "⚠️  No se encontró reporte del orquestador"
else
    log "📄 Reporte generado: $LATEST_REPORT"
    echo ""

    # Mostrar resumen usando jq
    if command -v jq &> /dev/null; then
        log "📈 Resumen de resultados:"
        jq -r '
            "  Total procesadas: \(.summary.totalUrls)",
            "  ✅ Exitosas: \(.summary.successful) (\(.summary.successRate))",
            "  ❌ Fallidas: \(.summary.failed)",
            "  🔄 Reintentos: \(.summary.totalRetries)",
            "  ⏱️  Duración: \(.metadata.totalDuration)"
        ' "$LATEST_REPORT"
    else
        log "📋 Instala 'jq' para ver el resumen: brew install jq"
    fi

    echo ""
    log "📁 Ver reporte completo: cat $LATEST_REPORT | jq ."
fi

# PASO 6: STATUS FINAL DEL LOTE
log_section "📋 PASO 6: STATUS FINAL DEL LOTE"
node lote-manager.js status

# OPCIONAL: Auto-commit y push (comentado por defecto)
# log_section "🚀 PASO 7: PUBLICACIÓN (OPCIONAL)"
# log "⚠️  Auto-publicación desactivada. Revisar propiedades manualmente."
# log "💡 Para publicar: git add . && git commit -m 'Propiedades semana $(date +%Y-%m-%d)' && git push"

# Descomentar las siguientes líneas para auto-publicar:
# if [ -z "$DRY_RUN" ]; then
#     log "📦 Creando commit..."
#     git add .
#     git commit -m "Propiedades semana $(date +%Y-%m-%d) - Auto-scraping"
#     git push
#     log "✅ Cambios publicados a GitHub"
# fi

# ============================================================================
# FINALIZACIÓN
# ============================================================================

log_section "✅ PIPELINE COMPLETADO EXITOSAMENTE"

log "📊 Archivos generados:"
log "  - URLs: $LATEST_URLS"
log "  - Auditoría: $LATEST_AUDIT"
log "  - Reporte: $LATEST_REPORT"
log ""
log "📅 Próxima ejecución: $(date -v+7d '+%Y-%m-%d %H:%M')"
log ""
log "🎉 ¡Listo! Revisar propiedades scrapeadas antes de publicar."

exit 0
