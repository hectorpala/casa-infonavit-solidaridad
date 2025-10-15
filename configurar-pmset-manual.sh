#!/bin/bash

# ============================================================
# CONFIGURAR PMSET - WAKE AUTOMÁTICO
# ============================================================
#
# Este script configura el despertar automático
# Requiere contraseña de administrador
#
# Uso: ./configurar-pmset-manual.sh
#
# ============================================================

echo "🔧 CONFIGURANDO DESPERTAR AUTOMÁTICO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏰ Configurando Mac para despertar a las 12:15 PM"
echo ""
echo "🔐 Se te pedirá tu contraseña de administrador..."
echo ""

# Configurar wake para 12:15 PM (después del test de las 12:13)
sudo pmset repeat wake MTWRFSU 12:15:00

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CONFIGURACIÓN EXITOSA"
    echo ""
    echo "📅 Mac despertará a las 12:15 PM"
    echo ""
    echo "🔍 Verificación:"
    pmset -g sched
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🎯 SIGUIENTE PASO:"
    echo ""
    echo "OPCIÓN A (Test completo con despertar):"
    echo "1. Cierra la Mac ahora"
    echo "2. A las 12:15 PM despertará automáticamente"
    echo "3. El test ya habrá corrido a las 12:13 PM"
    echo "4. Ejecuta: ./verificar-test-result.sh"
    echo ""
    echo "OPCIÓN B (Test rápido sin cerrar):"
    echo "1. Deja la Mac despierta"
    echo "2. A las 12:13 PM el test se ejecutará"
    echo "3. A las 12:14 PM ejecuta: ./verificar-test-result.sh"
    echo ""
else
    echo ""
    echo "❌ Error configurando pmset"
    echo ""
    echo "Intenta ejecutar manualmente:"
    echo "sudo pmset repeat wake MTWRFSU 12:15:00"
    echo ""
fi
