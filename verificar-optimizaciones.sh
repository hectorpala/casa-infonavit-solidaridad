#!/bin/bash

# Función de verificación completa
verificar_optimizaciones() {
    local archivo=$1
    
    if [ ! -f "$archivo" ]; then
        echo "❌ Archivo no encontrado: $archivo"
        return 1
    fi
    
    echo "🔍 VERIFICANDO OPTIMIZACIONES: $archivo"
    echo "================================================"
    
    # 1. Lazy Loading
    local lazy_count=$(grep -c 'loading="lazy"' "$archivo")
    echo "📸 Lazy Loading: $lazy_count imágenes"
    
    # 2. Dimensiones
    local dim_count=$(grep -c 'width=".*" height=".*"' "$archivo")
    echo "📏 Dimensiones: $dim_count imágenes"
    
    # 3. Preload crítico
    local preload_count=$(grep -c 'rel="preload".*as="image"' "$archivo")
    echo "⚡ Preload imágenes: $preload_count"
    
    # 4. JavaScript defer
    local defer_count=$(grep -c 'defer' "$archivo")
    echo "⚙️  JavaScript defer: $defer_count scripts"
    
    # 5. Open Graph
    local og_count=$(grep -c 'property="og:' "$archivo")
    echo "🌐 Open Graph tags: $og_count"
    
    # 6. Alt text descriptivo
    local alt_count=$(grep -o 'alt="[^"]\{15,\}"' "$archivo" | wc -l)
    echo "🎨 Alt text descriptivo: $alt_count imágenes"
    
    echo "================================================"
    
    # Evaluación general
    local total_score=0
    
    if [ $lazy_count -gt 5 ]; then ((total_score++)); fi
    if [ $dim_count -gt 5 ]; then ((total_score++)); fi
    if [ $preload_count -gt 0 ]; then ((total_score++)); fi
    if [ $defer_count -gt 0 ]; then ((total_score++)); fi
    if [ $og_count -ge 4 ]; then ((total_score++)); fi
    if [ $alt_count -gt 3 ]; then ((total_score++)); fi
    
    echo "📊 PUNTUACIÓN: $total_score/6"
    
    if [ $total_score -ge 5 ]; then
        echo "✅ LISTO PARA PUBLICAR"
        return 0
    elif [ $total_score -ge 3 ]; then
        echo "⚠️  NECESITA MEJORAS MENORES"
        return 1
    else
        echo "❌ NECESITA OPTIMIZACIÓN MAYOR"
        return 1
    fi
}

# Uso del script
if [ $# -eq 0 ]; then
    echo "Uso: $0 <archivo.html>"
    echo "Ejemplo: $0 casa-venta-ejemplo.html"
    exit 1
fi

verificar_optimizaciones "$1"