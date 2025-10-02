/**
 * Calculadora de Affordability para Propiedades de Renta
 * ¿Puedo pagar esta renta?
 */

const rentalAffordabilityCalculator = {
    html: `
    <!-- Calculadora de Affordability - Rental -->
    <section class="zillow-calculator scroll-animate" id="calculadora" style="background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);">
        <div class="container" style="max-width: 600px;">
            <h2 style="text-align: center; font-size: 1.75rem; font-weight: 700; color: #1f2937; margin-bottom: 8px; font-family: 'Poppins', sans-serif;">
                ¿Puedo pagar esta renta?
            </h2>
            <p style="text-align: center; color: #6b7280; margin-bottom: 32px; font-size: 0.95rem; font-family: 'Poppins', sans-serif;">
                Calcula si esta propiedad está dentro de tu presupuesto
            </p>

            <div class="calc-zillow-card">
                <!-- Ingreso Mensual -->
                <div class="zil-input-group">
                    <label class="zil-label">Tu ingreso mensual neto</label>
                    <div class="zil-input-wrapper">
                        <input type="text" id="ingreso-mensual" value="$50,000" class="zil-input" oninput="formatPrecioRenta(this); calcularAffordability()">
                    </div>
                    <p style="font-size: 11px; color: #6b7280; margin-top: 4px;">Después de impuestos</p>
                </div>

                <!-- Porcentaje Recomendado Slider -->
                <div class="zil-input-group">
                    <div class="zil-label-row">
                        <label class="zil-label">% de ingreso para renta</label>
                        <span class="zil-value" id="porcentaje-display">30%</span>
                    </div>
                    <input type="range" id="porcentaje-renta" min="20" max="50" value="30" step="5" class="zil-slider" oninput="calcularAffordability()">
                    <div class="zil-slider-labels">
                        <span>20%</span>
                        <span>50%</span>
                    </div>
                    <p style="font-size: 11px; color: #6b7280; margin-top: 4px;">Recomendado: 30% máximo</p>
                </div>

                <!-- Gastos Adicionales -->
                <div class="zil-input-group">
                    <label class="zil-label">Gastos adicionales estimados</label>
                    <div class="zil-input-wrapper">
                        <input type="text" id="gastos-adicionales" value="$3,000" class="zil-input" oninput="formatPrecioRenta(this); calcularAffordability()">
                    </div>
                    <p style="font-size: 11px; color: #6b7280; margin-top: 4px;">Servicios (luz, agua, gas, internet)</p>
                </div>

                <!-- Resultado Principal -->
                <div class="zil-result-main" id="resultado-affordability" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05)); border: 1px solid rgba(34, 197, 94, 0.3);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div id="indicator-icon" style="font-size: 32px;">✅</div>
                        <div style="flex: 1;">
                            <div class="zil-result-label">Renta máxima recomendada</div>
                            <div class="zil-result-value" id="renta-maxima" style="font-size: 24px;">$15,000</div>
                        </div>
                    </div>
                    <div id="verdict-message" style="font-size: 14px; color: #059669; font-weight: 600; font-family: 'Poppins', sans-serif;">
                        ✓ Esta propiedad está dentro de tu presupuesto
                    </div>
                </div>

                <!-- Desglose -->
                <div class="zil-breakdown">
                    <div class="zil-breakdown-row">
                        <span>Renta de esta propiedad</span>
                        <span id="renta-propiedad-display">${{RENTAL_PRICE}}</span>
                    </div>
                    <div class="zil-breakdown-row">
                        <span>Gastos adicionales</span>
                        <span id="gastos-display">$3,000</span>
                    </div>
                    <div class="zil-breakdown-row" style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 8px; font-weight: 600;">
                        <span>Costo total mensual</span>
                        <span id="costo-total-display">$0</span>
                    </div>
                    <div class="zil-breakdown-row" style="color: #6b7280; font-size: 13px;">
                        <span>Te sobraría aproximadamente</span>
                        <span id="sobrante-display" style="color: #059669; font-weight: 600;">$0</span>
                    </div>
                </div>
            </div>
        </div>
    </section>`,

    javascript: `
    <script>
        // Variables globales para affordability
        const rentaPropiedadAffordability = {{RENTAL_PRICE_NUMBER}};

        function formatPrecioRenta(input) {
            let valor = input.value.replace(/[^0-9]/g, '');
            if (valor) {
                valor = parseInt(valor).toLocaleString('es-MX');
                input.value = '$' + valor;
            }
            vibrate(30);
        }

        function calcularAffordability() {
            // Obtener valores
            const ingresoStr = document.getElementById('ingreso-mensual').value.replace(/[^0-9]/g, '');
            const ingreso = parseInt(ingresoStr) || 0;
            
            const porcentaje = parseInt(document.getElementById('porcentaje-renta').value);
            document.getElementById('porcentaje-display').textContent = porcentaje + '%';
            
            const gastosStr = document.getElementById('gastos-adicionales').value.replace(/[^0-9]/g, '');
            const gastos = parseInt(gastosStr) || 0;

            // Calcular renta máxima recomendada
            const rentaMaxima = (ingreso * porcentaje) / 100;
            
            // Costo total de esta propiedad
            const costoTotal = rentaPropiedadAffordability + gastos;
            
            // Sobrante después de pagar renta y gastos
            const sobrante = ingreso - costoTotal;
            
            // Porcentaje que representa la renta de tu ingreso
            const porcentajeReal = (rentaPropiedadAffordability / ingreso) * 100;

            // Actualizar displays
            document.getElementById('renta-maxima').textContent = '$' + rentaMaxima.toLocaleString('es-MX', {maximumFractionDigits: 0});
            document.getElementById('renta-propiedad-display').textContent = '$' + rentaPropiedadAffordability.toLocaleString('es-MX');
            document.getElementById('gastos-display').textContent = '$' + gastos.toLocaleString('es-MX');
            document.getElementById('costo-total-display').textContent = '$' + costoTotal.toLocaleString('es-MX');
            document.getElementById('sobrante-display').textContent = '$' + sobrante.toLocaleString('es-MX');

            // Determinar veredicto
            const resultBox = document.getElementById('resultado-affordability');
            const icon = document.getElementById('indicator-icon');
            const message = document.getElementById('verdict-message');
            const sobranteDisplay = document.getElementById('sobrante-display');

            if (rentaPropiedadAffordability <= rentaMaxima && sobrante > 5000) {
                // VERDE - Puede pagar cómodamente
                resultBox.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))';
                resultBox.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                icon.textContent = '✅';
                message.textContent = '✓ Esta propiedad está dentro de tu presupuesto';
                message.style.color = '#059669';
                sobranteDisplay.style.color = '#059669';
            } else if (rentaPropiedadAffordability <= rentaMaxima * 1.1 && sobrante > 0) {
                // AMARILLO - Justo en el límite
                resultBox.style.background = 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))';
                resultBox.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                icon.textContent = '⚠️';
                message.textContent = '⚠ Esta propiedad está en el límite de tu presupuesto';
                message.style.color = '#d97706';
                sobranteDisplay.style.color = '#d97706';
            } else {
                // ROJO - No puede pagar
                resultBox.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))';
                resultBox.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                icon.textContent = '❌';
                message.textContent = '✗ Esta propiedad está fuera de tu presupuesto';
                message.style.color = '#dc2626';
                sobranteDisplay.style.color = '#dc2626';
            }

            vibrate(20);
        }

        // Calcular al cargar
        document.addEventListener('DOMContentLoaded', calcularAffordability);
    </script>`
};

module.exports = rentalAffordabilityCalculator;
