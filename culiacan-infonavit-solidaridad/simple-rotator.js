// Simple Image Rotator - Direct approach
class SimpleImageRotator {
    constructor() {
        this.rotations = this.loadRotations();
        this.editMode = false;
        this.init();
    }

    init() {
        // Apply saved rotations first
        this.applyRotations();
        
        // Create main button
        this.createMainButton();
        
        // Always show controls on images
        this.showControlsOnAllImages();
        
        console.log('✅ Simple Image Rotator loaded');
    }

    createMainButton() {
        // Remove existing button if any
        const existing = document.querySelector('.simple-rotate-btn');
        if (existing) existing.remove();

        const btn = document.createElement('div');
        btn.className = 'simple-rotate-btn';
        btn.innerHTML = `
            <button onclick="window.simpleRotator.toggleMode()" style="
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                border: none;
                padding: 15px 25px;
                border-radius: 25px;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(40, 167, 69, 0.4);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 99999;
            ">
                <i class="fas fa-sync-alt"></i>
                <span id="rotate-btn-text">Activar Rotación</span>
            </button>
        `;
        
        document.body.appendChild(btn);
        
        // Also add to gallery
        const gallery = document.querySelector('.gallery .container');
        if (gallery) {
            const galleryBtn = document.createElement('div');
            galleryBtn.innerHTML = `
                <div style="text-align: center; margin: 20px 0; padding: 20px; background: rgba(40, 167, 69, 0.1); border-radius: 12px; border: 2px dashed rgba(40, 167, 69, 0.5);">
                    <button onclick="window.simpleRotator.toggleMode()" style="
                        background: linear-gradient(135deg, #28a745, #20c997);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 25px;
                        font-weight: 600;
                        font-size: 18px;
                        cursor: pointer;
                        box-shadow: 0 4px 20px rgba(40, 167, 69, 0.4);
                    ">
                        <i class="fas fa-sync-alt"></i>
                        🔄 ROTAR FOTOS
                    </button>
                    <p style="margin-top: 10px; color: #666; font-size: 14px;">Haz clic para activar/desactivar los controles de rotación</p>
                </div>
            `;
            
            const title = gallery.querySelector('.section-title');
            if (title) {
                title.after(galleryBtn);
            }
        }
    }

    showControlsOnAllImages() {
        const images = document.querySelectorAll('.gallery-image, .main-image');
        
        images.forEach((img, index) => {
            const container = img.closest('.gallery-item, .hero-image');
            if (!container) return;

            // Get image ID
            const imageId = this.getImageId(img);
            
            // Remove existing controls
            const existing = container.querySelector('.simple-controls');
            if (existing) existing.remove();

            // Create controls
            const controls = document.createElement('div');
            controls.className = 'simple-controls';
            controls.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 8px;
                padding: 8px;
                display: ${this.editMode ? 'flex' : 'none'};
                flex-direction: column;
                gap: 4px;
                z-index: 1000;
            `;

            controls.innerHTML = `
                <div style="display: flex; gap: 4px;">
                    <button onclick="window.simpleRotator.rotate('${imageId}', 'left')" 
                            style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 12px; width: 28px; height: 28px;"
                            title="Rotar izquierda">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button onclick="window.simpleRotator.rotate('${imageId}', 'right')" 
                            style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 12px; width: 28px; height: 28px;"
                            title="Rotar derecha">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button onclick="window.simpleRotator.rotate('${imageId}', 'flip')" 
                            style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 12px; width: 28px; height: 28px;"
                            title="Voltear 180°">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button onclick="window.simpleRotator.rotate('${imageId}', 'reset')" 
                            style="background: rgba(220,53,69,0.8); border: 1px solid #dc3545; color: white; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 12px; width: 28px; height: 28px;"
                            title="Restablecer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div style="text-align: center; margin-top: 4px;">
                    <span style="color: white; font-size: 10px; background: rgba(255,78,0,0.8); padding: 2px 6px; border-radius: 6px; display: inline-block;" 
                          id="rotation-${imageId}">0°</span>
                </div>
            `;

            container.appendChild(controls);
            
            // Ensure container is relative
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
        });
    }

    toggleMode() {
        this.editMode = !this.editMode;
        const btnText = document.getElementById('rotate-btn-text');
        
        if (this.editMode) {
            btnText.textContent = 'Guardar Cambios';
            document.body.classList.add('rotation-mode');
            this.showNotification('✅ Modo rotación activado. Usa los controles en cada imagen.', 'success');
        } else {
            btnText.textContent = 'Activar Rotación';
            document.body.classList.remove('rotation-mode');
            this.saveRotations();
            this.showNotification('💾 Rotaciones guardadas correctamente', 'success');
        }
        
        // Show/hide controls
        const controls = document.querySelectorAll('.simple-controls');
        controls.forEach(control => {
            control.style.display = this.editMode ? 'flex' : 'none';
        });
    }

    rotate(imageId, direction) {
        const img = document.querySelector(`img[src*="${imageId}"]`);
        if (!img) return;

        if (!this.rotations[imageId]) {
            this.rotations[imageId] = 0;
        }

        switch (direction) {
            case 'left':
                this.rotations[imageId] = (this.rotations[imageId] - 90) % 360;
                break;
            case 'right':
                this.rotations[imageId] = (this.rotations[imageId] + 90) % 360;
                break;
            case 'flip':
                this.rotations[imageId] = (this.rotations[imageId] + 180) % 360;
                break;
            case 'reset':
                this.rotations[imageId] = 0;
                break;
        }

        // Apply rotation
        img.style.transform = `rotate(${this.rotations[imageId]}deg)`;
        img.style.transition = 'transform 0.3s ease';

        // Update display
        const display = document.getElementById(`rotation-${imageId}`);
        if (display) {
            display.textContent = `${this.rotations[imageId]}°`;
        }

        console.log(`🔄 Rotated ${imageId} to ${this.rotations[imageId]}°`);
    }

    getImageId(img) {
        const src = img.src || img.getAttribute('src') || '';
        const filename = src.split('/').pop().split('.')[0];
        return filename || `img-${Math.random().toString(36).substr(2, 9)}`;
    }

    applyRotations() {
        Object.keys(this.rotations).forEach(imageId => {
            const img = document.querySelector(`img[src*="${imageId}"]`);
            if (img) {
                img.style.transform = `rotate(${this.rotations[imageId]}deg)`;
                img.style.transition = 'transform 0.3s ease';
            }
        });
    }

    saveRotations() {
        localStorage.setItem('simpleImageRotations', JSON.stringify(this.rotations));
        console.log('💾 Rotations saved:', this.rotations);
    }

    loadRotations() {
        const saved = localStorage.getItem('simpleImageRotations');
        return saved ? JSON.parse(saved) : {};
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.rotation-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'rotation-notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(40, 167, 69, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 99999;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 4000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.simpleRotator = new SimpleImageRotator();
    console.log('🔄 Simple Image Rotator initialized');
});