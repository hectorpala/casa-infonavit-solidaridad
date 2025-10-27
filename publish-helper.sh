#!/bin/bash

##############################################################################
# HELPER DE PUBLICACIÓN - COMMITS CENTRALIZADOS Y SEGUROS
##############################################################################
#
# Script centralizado para commits con protección de geolocalización.
#
# Uso:
#   ./publish-helper.sh                    # Modo interactivo
#   ./publish-helper.sh "mensaje"          # Commit directo
#   ./publish-helper.sh --template         # Usar template
#   ./publish-helper.sh --verify           # Solo verificar geolocalización
#   ./publish-helper.sh --update-geo       # Actualizar hashes de geo
#
##############################################################################

set -e  # Exit on error

# ============================================================================
# COLORES
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ============================================================================
# FUNCIONES
# ============================================================================

log_header() {
    echo ""
    echo -e "${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║  $1${NC}"
    echo -e "${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_section() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================================
# VERIFICACIÓN DE GEOLOCALIZACIÓN
# ============================================================================

verify_geolocation() {
    log_section "VERIFICACIÓN DE GEOLOCALIZACIÓN"

    if node verify-geolocation.js; then
        log_success "Geolocalización verificada - Sin modificaciones"
        return 0
    else
        log_error "Se detectaron modificaciones en geolocalización"
        echo ""
        echo -e "${YELLOW}Opciones:${NC}"
        echo "  1. Revertir cambios: git checkout -- <archivo>"
        echo "  2. Auto-restaurar: ./publish-helper.sh --restore-geo"
        echo "  3. Si son cambios intencionales: ./publish-helper.sh --update-geo"
        echo ""
        return 1
    fi
}

# ============================================================================
# RESTAURAR GEOLOCALIZACIÓN
# ============================================================================

restore_geolocation() {
    log_section "RESTAURAR GEOLOCALIZACIÓN DESDE BACKUPS"

    if node verify-geolocation.js --fix; then
        log_success "Geolocalización restaurada desde backups"

        # Agregar cambios restaurados
        git add culiacan/index.html monterrey/index.html mazatlan/index.html 2>/dev/null || true

        log_info "Archivos restaurados agregados al stage"
        return 0
    else
        log_error "Error restaurando geolocalización"
        return 1
    fi
}

# ============================================================================
# ACTUALIZAR HASHES DE GEOLOCALIZACIÓN
# ============================================================================

update_geolocation_hashes() {
    log_section "ACTUALIZAR HASHES DE GEOLOCALIZACIÓN"

    log_warning "Esta acción actualizará los hashes de protección."
    log_warning "Solo ejecutar si los cambios son INTENCIONADOS."
    echo ""
    read -p "¿Continuar? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "Operación cancelada"
        return 1
    fi

    if node verify-geolocation.js --update; then
        log_success "Hashes de geolocalización actualizados"

        # Agregar archivo de hashes
        git add .geolocation-hashes.json 2>/dev/null || true

        log_info "Archivo de hashes agregado al stage"
        return 0
    else
        log_error "Error actualizando hashes"
        return 1
    fi
}

# ============================================================================
# MOSTRAR TEMPLATE
# ============================================================================

show_template() {
    if [ -f ".commit-templates/publish-template.txt" ]; then
        cat .commit-templates/publish-template.txt
    else
        log_error "Template no encontrado: .commit-templates/publish-template.txt"
    fi
}

# ============================================================================
# COMMIT INTERACTIVO
# ============================================================================

interactive_commit() {
    log_header "🚀 PUBLICACIÓN INTERACTIVA"

    # 1. Verificar geolocalización
    if ! verify_geolocation; then
        log_error "Abortando: Geolocalización modificada"
        exit 1
    fi

    # 2. Mostrar status
    log_section "GIT STATUS"
    git status

    # 3. Pedir tipo de commit
    echo ""
    echo -e "${CYAN}Tipo de commit:${NC}"
    echo "  1) feat     - Nueva propiedad o característica"
    echo "  2) fix      - Corrección de bug"
    echo "  3) docs     - Cambios en documentación"
    echo "  4) style    - Cambios de formato"
    echo "  5) refactor - Refactorización"
    echo "  6) perf     - Mejoras de rendimiento"
    echo "  7) chore    - Mantenimiento"
    echo ""
    read -p "Selecciona tipo (1-7): " tipo_num

    case $tipo_num in
        1) tipo="feat" ;;
        2) tipo="fix" ;;
        3) tipo="docs" ;;
        4) tipo="style" ;;
        5) tipo="refactor" ;;
        6) tipo="perf" ;;
        7) tipo="chore" ;;
        *) tipo="feat" ;;
    esac

    # 4. Pedir mensaje
    echo ""
    read -p "Mensaje del commit: " mensaje

    if [ -z "$mensaje" ]; then
        log_error "Mensaje no puede estar vacío"
        exit 1
    fi

    # 5. Construir mensaje completo
    commit_msg="${tipo}: ${mensaje}"

    # 6. Pedir cuerpo opcional
    echo ""
    read -p "¿Agregar cuerpo del mensaje? (y/n): " add_body

    if [ "$add_body" = "y" ]; then
        echo ""
        echo "Ingresa el cuerpo (líneas con '-', Enter vacío para terminar):"
        body=""
        while IFS= read -r line; do
            [ -z "$line" ] && break
            body="${body}\n${line}"
        done

        if [ ! -z "$body" ]; then
            commit_msg="${commit_msg}${body}"
        fi
    fi

    # 7. Mostrar preview
    log_section "PREVIEW DEL COMMIT"
    echo -e "${GRAY}${commit_msg}${NC}"

    # 8. Confirmar
    echo ""
    read -p "¿Crear commit? (y/n): " confirm

    if [ "$confirm" != "y" ]; then
        log_info "Commit cancelado"
        exit 0
    fi

    # 9. Crear commit
    if git commit -m "$commit_msg"; then
        log_success "Commit creado exitosamente"

        # 10. Preguntar si hacer push
        echo ""
        read -p "¿Hacer push a GitHub? (y/n): " do_push

        if [ "$do_push" = "y" ]; then
            if git push origin main; then
                log_success "Cambios publicados a GitHub"
            else
                log_error "Error haciendo push"
                exit 1
            fi
        fi
    else
        log_error "Error creando commit"
        exit 1
    fi
}

# ============================================================================
# COMMIT DIRECTO
# ============================================================================

direct_commit() {
    local mensaje="$1"

    log_header "🚀 PUBLICACIÓN DIRECTA"

    # 1. Verificar geolocalización
    if ! verify_geolocation; then
        log_error "Abortando: Geolocalización modificada"
        exit 1
    fi

    # 2. Crear commit
    if git commit -m "$mensaje"; then
        log_success "Commit creado: $mensaje"

        # 3. Push automático
        if git push origin main; then
            log_success "Cambios publicados a GitHub"
        else
            log_error "Error haciendo push"
            exit 1
        fi
    else
        log_error "Error creando commit"
        exit 1
    fi
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    # Verificar que estamos en un repositorio git
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "No estás en un repositorio git"
        exit 1
    fi

    # Procesar argumentos
    case "$1" in
        --verify)
            verify_geolocation
            ;;
        --restore-geo)
            restore_geolocation
            ;;
        --update-geo)
            update_geolocation_hashes
            ;;
        --template)
            show_template
            ;;
        --help|-h)
            cat << 'EOF'
HELPER DE PUBLICACIÓN
=====================

Script centralizado para commits seguros con protección de geolocalización.

USO:
  ./publish-helper.sh                    Modo interactivo
  ./publish-helper.sh "mensaje"          Commit directo
  ./publish-helper.sh --verify           Solo verificar geolocalización
  ./publish-helper.sh --restore-geo      Restaurar geo desde backups
  ./publish-helper.sh --update-geo       Actualizar hashes de geo
  ./publish-helper.sh --template         Mostrar template de commits
  ./publish-helper.sh --help             Mostrar esta ayuda

EJEMPLOS:
  # Modo interactivo (recomendado)
  ./publish-helper.sh

  # Commit directo
  ./publish-helper.sh "feat: Nueva propiedad Casa Tres Ríos"

  # Verificar antes de commit
  ./publish-helper.sh --verify

  # Restaurar geo si se modificó accidentalmente
  ./publish-helper.sh --restore-geo

TIPOS DE COMMIT:
  feat      Nueva propiedad o característica
  fix       Corrección de bug
  docs      Cambios en documentación
  style     Cambios de formato
  refactor  Refactorización
  perf      Mejoras de rendimiento
  chore     Mantenimiento

PROTECCIÓN:
  El script verifica automáticamente que las secciones de geolocalización
  no hayan sido modificadas accidentalmente antes de cada commit.

EOF
            ;;
        "")
            # Modo interactivo
            interactive_commit
            ;;
        *)
            # Commit directo con mensaje
            direct_commit "$1"
            ;;
    esac
}

# ============================================================================
# ENTRY POINT
# ============================================================================

main "$@"
