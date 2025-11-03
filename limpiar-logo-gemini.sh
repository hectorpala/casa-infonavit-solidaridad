#!/bin/bash

##
# LIMPIADOR DE LOGO GEMINI
#
# Elimina el logo de Gemini de las imágenes generadas
#
# USO:
#   ./limpiar-logo-gemini.sh imagen.png
#   ./limpiar-logo-gemini.sh imagen.png output.png
#   ./limpiar-logo-gemini.sh *.png  (procesa todas las PNG)
##

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
PIXELS_TO_CROP=60  # Píxeles a recortar desde abajo (donde está el logo)

# Función para limpiar una imagen
clean_image() {
    local input="$1"
    local output="$2"

    if [ ! -f "$input" ]; then
        echo -e "${RED}❌ Error: Archivo no encontrado: $input${NC}"
        return 1
    fi

    echo -e "${YELLOW}🔧 Procesando: $input${NC}"

    # Obtener dimensiones originales
    local dimensions=$(sips -g pixelWidth -g pixelHeight "$input" | grep -E "pixelWidth|pixelHeight" | awk '{print $2}')
    local width=$(echo "$dimensions" | head -1)
    local height=$(echo "$dimensions" | tail -1)

    # Calcular nueva altura (sin el logo)
    local new_height=$((height - PIXELS_TO_CROP))

    echo "   📏 Dimensiones originales: ${width}x${height}"
    echo "   ✂️  Recortando ${PIXELS_TO_CROP} píxeles desde abajo"
    echo "   📐 Nuevas dimensiones: ${width}x${new_height}"

    # Recortar usando sips (nativo de macOS)
    sips -c "$new_height" "$width" "$input" --out "$output" > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Imagen limpia guardada: $output${NC}"

        # Mostrar tamaño de archivos
        local size_before=$(ls -lh "$input" | awk '{print $5}')
        local size_after=$(ls -lh "$output" | awk '{print $5}')
        echo "   📦 Tamaño antes: $size_before"
        echo "   📦 Tamaño después: $size_after"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Error al procesar la imagen${NC}"
        return 1
    fi
}

# Main
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║  🧹 LIMPIADOR DE LOGO GEMINI                                 ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""

    if [ $# -eq 0 ]; then
        echo -e "${RED}❌ Error: Debes proporcionar al menos un archivo de entrada${NC}"
        echo ""
        echo "Uso:"
        echo "  $0 imagen.png"
        echo "  $0 imagen.png salida.png"
        echo "  $0 *.png"
        echo ""
        exit 1
    fi

    local total=0
    local success=0
    local failed=0

    # Procesar cada archivo
    for input in "$@"; do
        # Saltar si es un archivo de salida (evitar procesar archivos ya limpios)
        if [[ "$input" == *"-clean.png" ]]; then
            continue
        fi

        total=$((total + 1))

        # Determinar archivo de salida
        local output
        if [ $# -eq 2 ] && [ ! -f "$2" ] && [[ "$2" != *.png ]]; then
            # Si se proporcionó nombre de salida específico
            output="$2"
        else
            # Generar nombre automático: imagen.png → imagen-clean.png
            local basename="${input%.png}"
            output="${basename}-clean.png"
        fi

        # Limpiar la imagen
        if clean_image "$input" "$output"; then
            success=$((success + 1))
        else
            failed=$((failed + 1))
        fi
    done

    # Resumen final
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║  📊 RESUMEN                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "   📊 Total procesadas: $total"
    echo -e "   ${GREEN}✅ Exitosas: $success${NC}"

    if [ $failed -gt 0 ]; then
        echo -e "   ${RED}❌ Fallidas: $failed${NC}"
    fi

    echo ""
}

# Ejecutar
main "$@"
