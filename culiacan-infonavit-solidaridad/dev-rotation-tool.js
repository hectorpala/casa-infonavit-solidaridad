// Development Rotation Tool - Always available for Hector
class DevRotationTool {
    constructor() {
        this.rotations = this.loadRotations();
        this.isDevMode = this.checkDevMode();
        
        if (this.isDevMode) {
            this.init();
        }
    }

    checkDevMode() {
        // Always enable dev mode for Hector - force it on
        return true;
    }

    init() {
        // Apply saved rotations first
        this.applyRotations();
        
        // Create permanent dev panel
        this.createDevPanel();
        
        console.log('🔧 DEV MODE: Rotation panel available for Hector');
        this.showNotification('🔧 Modo Desarrollo Activo - Panel de Rotación Disponible', 'dev');
    }

    createDevPanel() {
        // Remove existing panel
        const existing = document.getElementById('hector-dev-panel');
        if (existing) existing.remove();

        // Create dev panel
        const panel = document.createElement('div');
        panel.id = 'hector-dev-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            border-radius: 15px;
            padding: 20px;
            z-index: 99999;
            border: 3px solid #ff4e00;
            box-shadow: 0 10px 30px rgba(0,0,0,0.7);
            color: white;
            font-family: 'Poppins', sans-serif;
            min-width: 300px;
            max-height: 90vh;
            overflow-y: auto;
        `;

        panel.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #ff4e00; padding-bottom: 10px;">
                <h3 style="color: #ff4e00; font-size: 18px; margin: 0;">🔧 PANEL HECTOR</h3>
                <p style="font-size: 12px; color: #ccc; margin: 5px 0;">Modo Desarrollo Activo</p>
            </div>
            
            <div style="margin-bottom: 15px; text-align: center;">
                <button onclick="window.devRotator.clearAllRotations()" style="
                    background: linear-gradient(135deg, #dc3545, #c82333);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    width: 100%;
                    margin-bottom: 10px;
                ">🗑️ LIMPIAR TODO</button>
                
                <button onclick="window.devRotator.toggleMode()" id="dev-toggle-btn" style="
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    width: 100%;
                ">Activar Rotación</button>
            </div>
            
            <div id="dev-controls-container" style="display: none;">
                <div id="dev-image-list"></div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #444;">
                    <button onclick="window.devRotator.finalizeRotations()" style="
                        background: linear-gradient(135deg, #ff4e00, #ff6b2b);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 14px;
                        width: 100%;
                        margin-bottom: 10px;
                    ">✅ Finalizar y Aplicar Cambios</button>
                    
                    <button onclick="window.devRotator.exportRotations()" style="
                        background: linear-gradient(135deg, #6c757d, #495057);
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                        width: 100%;
                    ">📋 Exportar Rotaciones</button>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 10px;">
                <button onclick="window.devRotator.disableDevMode()" style="
                    background: rgba(220, 53, 69, 0.8);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 11px;
                ">Salir Modo Dev</button>
            </div>
        `;

        document.body.appendChild(panel);
    }

    toggleMode() {
        const container = document.getElementById('dev-controls-container');
        const btn = document.getElementById('dev-toggle-btn');
        
        const isVisible = container.style.display !== 'none';
        
        if (isVisible) {
            container.style.display = 'none';
            btn.textContent = 'Activar Rotación';
            btn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        } else {
            this.populateImageList();
            container.style.display = 'block';
            btn.textContent = 'Ocultar Controles';
            btn.style.background = 'linear-gradient(135deg, #ffc107, #e0a800)';
        }
    }

    populateImageList() {
        const container = document.getElementById('dev-image-list');
        if (!container) return;

        const images = document.querySelectorAll('.gallery-image, .main-image');
        container.innerHTML = '';

        images.forEach((img, index) => {
            const imageId = this.getImageId(img);
            const imageName = this.getImageName(img, index);
            
            const controlGroup = document.createElement('div');
            controlGroup.style.cssText = `
                background: rgba(255, 78, 0, 0.1);
                border-radius: 10px;
                padding: 12px;
                margin-bottom: 10px;
                border: 1px solid rgba(255, 78, 0, 0.3);
            `;

            controlGroup.innerHTML = `
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #ff4e00;">
                    📷 ${imageName}
                </div>
                <div style="font-size: 12px; color: #ccc; margin-bottom: 8px;">
                    Rotación: <span id="angle-${imageId}" style="color: #ff4e00; font-weight: 600;">${this.rotations[imageId] || 0}°</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 5px;">
                    <button onclick="window.devRotator.rotateImage('${imageId}', -90)" 
                            style="background: rgba(255, 78, 0, 0.8); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;"
                            title="⟲ Izquierda">
                        ⟲
                    </button>
                    <button onclick="window.devRotator.rotateImage('${imageId}', 90)" 
                            style="background: rgba(255, 78, 0, 0.8); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;"
                            title="⟳ Derecha">
                        ⟳
                    </button>
                    <button onclick="window.devRotator.rotateImage('${imageId}', 180)" 
                            style="background: rgba(40, 167, 69, 0.8); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;"
                            title="🔄 180°">
                        🔄
                    </button>
                    <button onclick="window.devRotator.resetImage('${imageId}')" 
                            style="background: rgba(220, 53, 69, 0.8); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;"
                            title="↺ Reset">
                        ↺
                    </button>
                </div>
            `;

            container.appendChild(controlGroup);
        });
    }

    rotateImage(imageId, degrees) {
        const img = document.querySelector(`img[src*="${imageId}"]`);
        if (!img) return;

        if (!this.rotations[imageId]) {
            this.rotations[imageId] = 0;
        }

        this.rotations[imageId] = (this.rotations[imageId] + degrees) % 360;
        
        if (this.rotations[imageId] < 0) {
            this.rotations[imageId] += 360;
        }

        img.style.transform = \`rotate(\${this.rotations[imageId]}deg)\`;
        img.style.transition = 'transform 0.4s ease';

        const angleDisplay = document.getElementById(\`angle-\${imageId}\`);
        if (angleDisplay) {
            angleDisplay.textContent = \`\${this.rotations[imageId]}°\`;
        }

        this.saveRotations();
        this.showNotification(\`🔄 \${this.getImageName(img)} rotada a \${this.rotations[imageId]}°\`, 'success');
    }

    resetImage(imageId) {
        this.rotations[imageId] = 0;
        const img = document.querySelector(\`img[src*="\${imageId}"]\`);
        if (img) {
            img.style.transform = 'rotate(0deg)';
            img.style.transition = 'transform 0.4s ease';
        }

        const angleDisplay = document.getElementById(\`angle-\${imageId}\`);
        if (angleDisplay) {
            angleDisplay.textContent = '0°';
        }

        this.saveRotations();
        this.showNotification('↺ Imagen restablecida', 'success');
    }

    finalizeRotations() {
        if (confirm('¿Estás seguro de que quieres finalizar estos cambios? Esto marcará las rotaciones como permanentes.')) {
            // Mark as finalized
            localStorage.setItem('rotations-finalized', 'true');
            localStorage.setItem('final-rotations', JSON.stringify(this.rotations));
            
            this.showNotification('✅ Rotaciones finalizadas. Dile a Claude que aplique los cambios.', 'success');
            
            // Show instructions
            this.showFinalizeInstructions();
        }
    }

    showFinalizeInstructions() {
        const instructions = document.createElement('div');
        instructions.style.cssText = \`
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 30px;
            border-radius: 15px;
            border: 3px solid #ff4e00;
            z-index: 100000;
            text-align: center;
            max-width: 400px;
        \`;

        instructions.innerHTML = \`
            <h3 style="color: #ff4e00; margin-bottom: 20px;">✅ Rotaciones Finalizadas</h3>
            <p style="margin-bottom: 20px;">Ahora dile a Claude:</p>
            <div style="background: #2d2d2d; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-family: monospace;">
                "Las imágenes están bien, aplica los cambios sin el panel"
            </div>
            <button onclick="this.parentElement.remove()" style="
                background: #ff4e00;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
            ">Entendido</button>
        \`;

        document.body.appendChild(instructions);
    }

    exportRotations() {
        const rotations = JSON.stringify(this.rotations, null, 2);
        navigator.clipboard.writeText(rotations).then(() => {
            this.showNotification('📋 Rotaciones copiadas al portapapeles', 'success');
        });
    }

    clearAllRotations() {
        if (confirm('¿Borrar TODAS las rotaciones y empezar de cero? Esto restablecerá todas las imágenes a 0°.')) {
            // Clear all rotations
            this.rotations = {};
            
            // Clear localStorage
            localStorage.removeItem('hector-dev-rotations');
            localStorage.removeItem('final-rotations');
            localStorage.removeItem('rotations-finalized');
            
            // Reset all images visually
            const images = document.querySelectorAll('.gallery-image, .main-image');
            images.forEach(img => {
                img.style.transform = 'rotate(0deg)';
                img.style.transition = 'transform 0.4s ease';
            });
            
            // Refresh the panel if open
            const container = document.getElementById('dev-controls-container');
            if (container && container.style.display !== 'none') {
                this.populateImageList();
            }
            
            this.showNotification('🗑️ Todas las rotaciones eliminadas - Empezando de cero', 'success');
        }
    }

    disableDevMode() {
        if (confirm('¿Salir del modo desarrollo? El panel desaparecerá.')) {
            localStorage.setItem('hector-dev-mode', 'false');
            location.reload();
        }
    }

    // Helper methods (same as before)
    getImageId(img) {
        const src = img.src || img.getAttribute('src') || '';
        const filename = src.split('/').pop().split('.')[0];
        return filename || \`img-\${Math.random().toString(36).substr(2, 9)}\`;
    }

    getImageName(img, index) {
        const src = img.src || img.getAttribute('src') || '';
        const filename = src.split('/').pop().split('.')[0];
        
        if (filename.includes('exterior')) return 'Exterior';
        if (filename.includes('sala')) return 'Sala';
        if (filename.includes('cocina')) return 'Cocina';
        if (filename.includes('bano')) return 'Baño';
        if (filename.includes('recamara')) return 'Recámara';
        if (filename.includes('jardin')) return 'Jardín';
        
        return \`Imagen \${index + 1}\`;
    }

    applyRotations() {
        Object.keys(this.rotations).forEach(imageId => {
            const img = document.querySelector(\`img[src*="\${imageId}"]\`);
            if (img) {
                img.style.transform = \`rotate(\${this.rotations[imageId]}deg)\`;
                img.style.transition = 'transform 0.4s ease';
            }
        });
    }

    saveRotations() {
        localStorage.setItem('hector-dev-rotations', JSON.stringify(this.rotations));
    }

    loadRotations() {
        const saved = localStorage.getItem('hector-dev-rotations');
        return saved ? JSON.parse(saved) : {};
    }

    showNotification(message, type = 'info') {
        const existing = document.querySelector('.dev-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'dev-notification';
        notification.style.cssText = \`
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: \${type === 'success' ? 'rgba(40, 167, 69, 0.95)' : type === 'dev' ? 'rgba(255, 78, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 99998;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        \`;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 4000);
    }
}

// Auto-enable dev mode for Hector
localStorage.setItem('hector-dev-mode', 'true');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.devRotator = new DevRotationTool();
});