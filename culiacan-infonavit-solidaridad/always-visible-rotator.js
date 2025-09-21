// Always Visible Image Rotator - Controls on every image
class AlwaysVisibleRotator {
    constructor() {
        this.rotations = this.loadRotations();
        this.init();
    }

    init() {
        // Apply saved rotations first
        this.applyRotations();
        
        // Add controls to all images immediately
        this.addControlsToAllImages();
        
        console.log('✅ Always Visible Rotator loaded - Controls on every image');
        
        // Show confirmation
        this.showNotification('🔄 Controles de rotación listos en cada imagen', 'success');
    }

    addControlsToAllImages() {
        // Wait a bit for images to load
        setTimeout(() => {
            const images = document.querySelectorAll('.gallery-image, .main-image');
            
            images.forEach((img, index) => {
                this.addControlsToImage(img);
            });
        }, 500);
    }

    addControlsToImage(img) {
        const container = img.closest('.gallery-item, .hero-image');
        if (!container) return;

        // Get image ID
        const imageId = this.getImageId(img);
        
        // Remove existing controls if any
        const existing = container.querySelector('.always-controls');
        if (existing) existing.remove();

        // Create permanent controls
        const controls = document.createElement('div');
        controls.className = 'always-controls';
        controls.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            gap: 4px;
            z-index: 1000;
            opacity: 0.8;
            transition: opacity 0.3s ease;
        `;

        // Show on hover
        controls.onmouseenter = () => controls.style.opacity = '1';
        controls.onmouseleave = () => controls.style.opacity = '0.8';

        // Create buttons with proper event handling
        const leftButton = document.createElement('button');
        leftButton.innerHTML = '<i class="fas fa-undo"></i>';
        leftButton.title = 'Rotar izquierda (90°)';
        leftButton.style.cssText = `
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid rgba(255, 255, 255, 0.8);
            color: white;
            padding: 8px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        const rightButton = document.createElement('button');
        rightButton.innerHTML = '<i class="fas fa-redo"></i>';
        rightButton.title = 'Rotar derecha (90°)';
        rightButton.style.cssText = `
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid rgba(255, 255, 255, 0.8);
            color: white;
            padding: 8px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;

        // Add event listeners with stopPropagation
        leftButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            window.alwaysRotator.rotateLeft(imageId);
        });

        rightButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            window.alwaysRotator.rotateRight(imageId);
        });

        // Add hover effects
        [leftButton, rightButton].forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(255, 78, 0, 0.9)';
                btn.style.transform = 'scale(1.1)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(0, 0, 0, 0.7)';
                btn.style.transform = 'scale(1)';
            });
        });

        controls.appendChild(leftButton);
        controls.appendChild(rightButton);

        container.appendChild(controls);
        
        // Ensure container is relative
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        // Add hover effect to container
        container.onmouseenter = () => {
            controls.style.opacity = '1';
        };
        container.onmouseleave = () => {
            controls.style.opacity = '0.8';
        };
    }

    rotateLeft(imageId) {
        this.rotate(imageId, -90);
    }

    rotateRight(imageId) {
        this.rotate(imageId, 90);
    }

    rotate(imageId, degrees) {
        const img = document.querySelector(`img[src*="${imageId}"]`);
        if (!img) {
            console.log(`❌ No se encontró imagen con ID: ${imageId}`);
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

        // Apply rotation immediately while preserving size and position
        img.style.transform = `rotate(${this.rotations[imageId]}deg)`;
        img.style.transition = 'transform 0.3s ease';
        
        // Ensure image maintains its original size and position
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.objectFit = 'cover';
        img.style.transformOrigin = 'center center';

        // Auto-save immediately
        this.saveRotations();

        // Show feedback
        const direction = degrees > 0 ? 'derecha' : 'izquierda';
        console.log(`🔄 Rotated ${imageId} ${direction} to ${this.rotations[imageId]}°`);
        
        // Brief visual feedback
        this.showBriefFeedback(img, `${this.rotations[imageId]}°`);
    }

    showBriefFeedback(img, text) {
        const container = img.closest('.gallery-item, .hero-image');
        if (!container) return;

        // Remove existing feedback
        const existing = container.querySelector('.rotation-feedback');
        if (existing) existing.remove();

        // Create feedback
        const feedback = document.createElement('div');
        feedback.className = 'rotation-feedback';
        feedback.style.cssText = `
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 78, 0, 0.9);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            z-index: 1001;
            animation: fadeInOut 1.5s ease;
        `;
        
        feedback.textContent = text;
        container.appendChild(feedback);

        // Auto remove
        setTimeout(() => feedback.remove(), 1500);
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
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.objectFit = 'cover';
                img.style.transformOrigin = 'center center';
            }
        });
    }

    saveRotations() {
        localStorage.setItem('alwaysImageRotations', JSON.stringify(this.rotations));
    }

    loadRotations() {
        const saved = localStorage.getItem('alwaysImageRotations');
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
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(40, 167, 69, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 99999;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: slideInUp 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }

    // Add observer for dynamically loaded images
    observeNewImages() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const images = node.querySelectorAll ? node.querySelectorAll('img') : [];
                        images.forEach(img => {
                            if (img.classList.contains('gallery-image') || img.classList.contains('main-image')) {
                                this.addControlsToImage(img);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
        50% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    }
    
    @keyframes slideInUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .gallery-image, .main-image {
        transform-origin: center center;
        will-change: transform;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.alwaysRotator = new AlwaysVisibleRotator();
    console.log('🔄 Always Visible Image Rotator initialized');
});