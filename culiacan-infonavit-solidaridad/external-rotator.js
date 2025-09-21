// External Rotation Controls - Completely separated from images
class ExternalRotator {
    constructor() {
        this.rotations = this.loadRotations();
        this.init();
    }

    init() {
        // Apply saved rotations first
        this.applyRotations();
        
        // Create floating control panel
        this.createFloatingPanel();
        
        console.log('✅ External Rotator loaded - Controls separate from images');
        this.showNotification('🔄 Panel de rotación cargado - No toques las imágenes', 'success');
    }

    createFloatingPanel() {
        // Remove existing panel
        const existing = document.getElementById('external-rotation-panel');
        if (existing) existing.remove();

        // Create main panel
        const panel = document.createElement('div');
        panel.id = 'external-rotation-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.9);
            border-radius: 15px;
            padding: 20px;
            z-index: 99999;
            border: 2px solid rgba(255, 78, 0, 0.5);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            color: white;
            font-family: 'Poppins', sans-serif;
            min-width: 250px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        panel.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h3 style="color: #ff4e00; font-size: 16px; margin: 0;">🔄 ROTAR IMÁGENES</h3>
                <p style="font-size: 12px; color: #ccc; margin: 5px 0;">Panel independiente</p>
            </div>
            <div id="image-controls-list"></div>
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="window.externalRotator.togglePanel()" style="
                    background: rgba(255, 78, 0, 0.8);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 12px;
                ">Minimizar</button>
            </div>
        `;

        document.body.appendChild(panel);
        
        // Create controls for each image
        this.populateImageControls();
    }

    populateImageControls() {
        const container = document.getElementById('image-controls-list');
        if (!container) return;

        const images = document.querySelectorAll('.gallery-image, .main-image');
        container.innerHTML = '';

        images.forEach((img, index) => {
            const imageId = this.getImageId(img);
            const imageName = this.getImageName(img, index);
            
            const controlGroup = document.createElement('div');
            controlGroup.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
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
                    Ángulo actual: <span id="angle-${imageId}" style="color: #ff4e00; font-weight: 600;">${this.rotations[imageId] || 0}°</span>
                </div>
                <div style="display: flex; gap: 6px; justify-content: center;">
                    <button onclick="window.externalRotator.rotateImage('${imageId}', -90)" 
                            style="background: rgba(255, 78, 0, 0.8); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px; width: 35px; height: 35px;"
                            title="Rotar izquierda">
                        ⟲
                    </button>
                    <button onclick="window.externalRotator.rotateImage('${imageId}', 90)" 
                            style="background: rgba(255, 78, 0, 0.8); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px; width: 35px; height: 35px;"
                            title="Rotar derecha">
                        ⟳
                    </button>
                    <button onclick="window.externalRotator.rotateImage('${imageId}', 180)" 
                            style="background: rgba(40, 167, 69, 0.8); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px; width: 35px; height: 35px;"
                            title="Voltear 180°">
                        🔄
                    </button>
                    <button onclick="window.externalRotator.resetImage('${imageId}')" 
                            style="background: rgba(220, 53, 69, 0.8); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 11px; width: 35px; height: 35px;"
                            title="Restablecer">
                        ↺
                    </button>
                </div>
            `;

            container.appendChild(controlGroup);
        });
    }

    rotateImage(imageId, degrees) {
        const img = document.querySelector(`img[src*="${imageId}"]`);
        if (!img) {
            console.log(`❌ No se encontró imagen: ${imageId}`);
            return;
        }

        // Initialize rotation if not exists
        if (!this.rotations[imageId]) {
            this.rotations[imageId] = 0;
        }

        // Update rotation
        this.rotations[imageId] = (this.rotations[imageId] + degrees) % 360;
        
        // Handle negative values
        if (this.rotations[imageId] < 0) {
            this.rotations[imageId] += 360;
        }

        // Apply rotation
        img.style.transform = `rotate(${this.rotations[imageId]}deg)`;
        img.style.transition = 'transform 0.4s ease';

        // Update display
        const angleDisplay = document.getElementById(`angle-${imageId}`);
        if (angleDisplay) {
            angleDisplay.textContent = `${this.rotations[imageId]}°`;
        }

        // Auto-save
        this.saveRotations();

        // Show feedback
        this.showNotification(`🔄 Imagen rotada a ${this.rotations[imageId]}°`, 'success');
        
        console.log(`🔄 Rotated ${imageId} to ${this.rotations[imageId]}°`);
    }

    resetImage(imageId) {
        this.rotations[imageId] = 0;
        const img = document.querySelector(`img[src*="${imageId}"]`);
        if (img) {
            img.style.transform = 'rotate(0deg)';
            img.style.transition = 'transform 0.4s ease';
        }

        // Update display
        const angleDisplay = document.getElementById(`angle-${imageId}`);
        if (angleDisplay) {
            angleDisplay.textContent = '0°';
        }

        this.saveRotations();
        this.showNotification(`↺ Imagen restablecida`, 'success');
    }

    togglePanel() {
        const panel = document.getElementById('external-rotation-panel');
        if (!panel) return;

        const isMinimized = panel.style.height === '60px';
        
        if (isMinimized) {
            // Expand
            panel.style.height = 'auto';
            panel.style.maxHeight = '80vh';
            panel.querySelector('button').textContent = 'Minimizar';
            document.getElementById('image-controls-list').style.display = 'block';
        } else {
            // Minimize
            panel.style.height = '60px';
            panel.style.maxHeight = '60px';
            panel.querySelector('button').textContent = 'Expandir';
            document.getElementById('image-controls-list').style.display = 'none';
        }
    }

    getImageId(img) {
        const src = img.src || img.getAttribute('src') || '';
        const filename = src.split('/').pop().split('.')[0];
        return filename || `img-${Math.random().toString(36).substr(2, 9)}`;
    }

    getImageName(img, index) {
        const src = img.src || img.getAttribute('src') || '';
        const filename = src.split('/').pop().split('.')[0];
        
        // Try to get meaningful names
        if (filename.includes('exterior')) return 'Exterior';
        if (filename.includes('sala')) return 'Sala';
        if (filename.includes('cocina')) return 'Cocina';
        if (filename.includes('bano')) return 'Baño';
        if (filename.includes('recamara')) return 'Recámara';
        if (filename.includes('jardin')) return 'Jardín';
        if (filename === 'main-image') return 'Imagen Principal';
        
        return `Imagen ${index + 1}`;
    }

    applyRotations() {
        Object.keys(this.rotations).forEach(imageId => {
            const img = document.querySelector(`img[src*="${imageId}"]`);
            if (img) {
                img.style.transform = `rotate(${this.rotations[imageId]}deg)`;
                img.style.transition = 'transform 0.4s ease';
            }
        });
    }

    saveRotations() {
        localStorage.setItem('externalImageRotations', JSON.stringify(this.rotations));
    }

    loadRotations() {
        const saved = localStorage.getItem('externalImageRotations');
        return saved ? JSON.parse(saved) : {};
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.external-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'external-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: ${type === 'success' ? 'rgba(40, 167, 69, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 99998;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: slideInLeft 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInLeft {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    #external-rotation-panel::-webkit-scrollbar {
        width: 6px;
    }
    
    #external-rotation-panel::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.1);
        border-radius: 3px;
    }
    
    #external-rotation-panel::-webkit-scrollbar-thumb {
        background: rgba(255,78,0,0.8);
        border-radius: 3px;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.externalRotator = new ExternalRotator();
    console.log('🔄 External Image Rotator initialized');
});