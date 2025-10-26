#!/bin/bash

#####################################################################
# 🤖 SISTEMA DE SCRAPING AUTOMÁTICO DIARIO
# Culiacán - Inmuebles24 - Propiedades Recientes (≤20 días)
#####################################################################

# Configuración
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Archivo de log
LOG_FILE="logs/daily-scraping-$(date +%Y%m%d).log"
mkdir -p logs

# Función de logging
log() {
    echo -e "${2}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    log "✅ $1" "$GREEN"
}

log_error() {
    log "❌ $1" "$RED"
}

log_warning() {
    log "⚠️  $1" "$YELLOW"
}

log_info() {
    log "ℹ️  $1" "$BLUE"
}

#####################################################################
# MODO DE OPERACIÓN
#####################################################################

# Detectar si hay proxies configurados
MODE="manual"
if [ -f ".env" ] && grep -q "SCRAPERAPI_KEY=" .env && grep -v "^#" .env | grep "SCRAPERAPI_KEY" | grep -q "=."; then
    MODE="auto"
    log_info "Modo AUTO detectado (ScraperAPI configurado)"
elif [ -f ".env" ] && (grep -q "OXYLABS_USER=" .env || grep -q "BRIGHTDATA_USER=" .env); then
    MODE="auto"
    log_info "Modo AUTO detectado (Proxies configurados)"
else
    log_warning "Modo MANUAL (Sin proxies configurados)"
    log_info "Para automatización completa, configura proxies en .env"
fi

#####################################################################
# PASO 1: EXTRACCIÓN DE URLs
#####################################################################

log_info "=========================================="
log_info "PASO 1: Extrayendo URLs de propiedades"
log_info "=========================================="

if [ "$MODE" = "auto" ]; then
    # Modo automático con extractor
    log_info "Ejecutando extractor automático..."
    
    if ! node extraer-urls-stealth.js >> "$LOG_FILE" 2>&1; then
        log_error "Extractor falló. Continuando con URLs existentes (si las hay)..."
    else
        log_success "Extractor completado"
    fi
else
    # Modo manual - verificar que exista el archivo de URLs
    if [ ! -f "urls-propiedades-recientes-culiacan.txt" ]; then
        log_error "Archivo urls-propiedades-recientes-culiacan.txt no encontrado"
        log_warning "SOLUCIÓN: Copiar URLs manualmente en ese archivo"
        log_info "Instrucciones:"
        log_info "  1. nano urls-propiedades-recientes-culiacan.txt"
        log_info "  2. Pegar URLs de Inmuebles24"
        log_info "  3. Guardar (Ctrl+X, Y, Enter)"
        exit 1
    fi
    
    URL_COUNT=$(grep -c "^http" urls-propiedades-recientes-culiacan.txt || echo "0")
    log_success "Archivo de URLs encontrado: $URL_COUNT URLs"
fi

#####################################################################
# PASO 2: LIMPIEZA DEL HISTÓRICO
#####################################################################

log_info "=========================================="
log_info "PASO 2: Limpiando histórico antiguo"
log_info "=========================================="

# Limpiar propiedades no vistas en 30+ días
node -e "
const PropertyHistory = require('./property-history');
const history = new PropertyHistory();
const removed = history.cleanOldProperties(30);
console.log(\`Propiedades antiguas eliminadas: \${removed}\`);
" >> "$LOG_FILE" 2>&1

log_success "Histórico limpio"

#####################################################################
# PASO 3: PROCESAMIENTO BATCH
#####################################################################

log_info "=========================================="
log_info "PASO 3: Procesando URLs con batch processor"
log_info "=========================================="

# Determinar concurrencia según modo
if [ "$MODE" = "auto" ]; then
    CONCURRENCY=3
    log_info "Concurrencia: $CONCURRENCY workers (modo AUTO)"
else
    CONCURRENCY=1
    log_info "Concurrencia: $CONCURRENCY worker (modo MANUAL)"
fi

# Ejecutar batch processor con concurrencia
if node scrapear-batch-urls.js --concurrency $CONCURRENCY >> "$LOG_FILE" 2>&1; then
    log_success "Batch processing completado"
else
    log_error "Batch processing falló (ver log para detalles)"
    EXIT_CODE=1
fi

#####################################################################
# PASO 4: ESTADÍSTICAS
#####################################################################

log_info "=========================================="
log_info "PASO 4: Generando estadísticas"
log_info "=========================================="

# Obtener estadísticas del histórico
node -e "
const PropertyHistory = require('./property-history');
const history = new PropertyHistory();
const stats = history.getStats();

console.log('📊 ESTADÍSTICAS FINALES');
console.log('═'.repeat(50));
console.log(\`Total propiedades: \${stats.total}\`);
console.log(\`Recientes (≤20 días): \${stats.recent20}\`);
console.log(\`Recientes (≤15 días): \${stats.recent15}\`);
console.log(\`Cambios de precio: \${stats.priceChanges}\`);
console.log(\`Scrapeadas: \${stats.scraped}\`);
console.log(\`Pendientes: \${stats.unscraped}\`);
console.log('═'.repeat(50));
" | tee -a "$LOG_FILE"

# Analizar log de batch
if [ -f "batch-scraping-log.txt" ]; then
    SUCCESS_COUNT=$(grep -c "SUCCESS" batch-scraping-log.txt || echo "0")
    ERROR_COUNT=$(grep -c "ERROR" batch-scraping-log.txt || echo "0")
    
    log_info "Resultados del batch:"
    log_success "  Exitosas: $SUCCESS_COUNT"
    if [ "$ERROR_COUNT" -gt 0 ]; then
        log_error "  Errores: $ERROR_COUNT"
    else
        log_success "  Errores: 0"
    fi
fi

#####################################################################
# PASO 5: NOTIFICACIONES (Opcional)
#####################################################################

if [ -f ".env" ] && grep -q "NOTIFICATION_WEBHOOK=" .env; then
    WEBHOOK=$(grep "NOTIFICATION_WEBHOOK=" .env | cut -d '=' -f2)
    
    if [ -n "$WEBHOOK" ]; then
        log_info "Enviando notificación webhook..."
        
        # Enviar notificación
        curl -X POST "$WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"✅ Scraping diario completado: $SUCCESS_COUNT exitosas, $ERROR_COUNT errores\"}" \
            >> "$LOG_FILE" 2>&1
        
        log_success "Notificación enviada"
    fi
fi

#####################################################################
# RESUMEN FINAL
#####################################################################

log_info "=========================================="
log_success "SCRAPING DIARIO COMPLETADO"
log_info "=========================================="
log_info "Log completo: $LOG_FILE"
log_info "Próxima ejecución: Configurar en crontab"

exit ${EXIT_CODE:-0}
