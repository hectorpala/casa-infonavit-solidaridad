// Image Rotation Tool for Property Gallery
class ImageRotator {
    constructor() {
        this.rotations = this.loadRotations();
        this.editMode = false;
        this.init();
    }

    init() {
        this.createEditButton();
        this.applyRotations();
        this.bindEvents();
    }

    // Create the main edit button
    createEditButton() {
        const editBtn = document.createElement('div');
        editBtn.className = 'image-edit-btn';
        editBtn.innerHTML = `
            <button id="toggleEditMode" class="edit-mode-btn">
                <i class="fas fa-edit"></i>
                <span>Rotar Imágenes</span>
            </button>
        `;
        
        // Add to header or hero section
        const header = document.querySelector('.header .container');
        if (header) {
            header.appendChild(editBtn);
        }
    }

    // Create rotation controls for each image
    createRotationControls(imageContainer, imageId) {
        const controls = document.createElement('div');
        controls.className = 'rotation-controls';
        controls.innerHTML = `
            <div class="rotation-buttons">
                <button class="rotate-btn" data-action="rotate-left" data-image="${imageId}" title="Rotar izquierda (90°)">
                    <i class="fas fa-undo"></i>
                </button>
                <button class="rotate-btn" data-action="rotate-right" data-image="${imageId}" title="Rotar derecha (90°)">
                    <i class="fas fa-redo"></i>
                </button>
                <button class="rotate-btn" data-action="flip-horizontal" data-image="${imageId}" title="Voltear horizontal">
                    <i class="fas fa-arrows-alt-h"></i>
                </button>
                <button class="rotate-btn" data-action="flip-vertical" data-image="${imageId}" title="Voltear vertical">
                    <i class="fas fa-arrows-alt-v"></i>
                </button>
                <button class="rotate-btn reset-btn" data-action="reset" data-image="${imageId}" title="Restablecer">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
            <div class="rotation-info">
                <span class="current-rotation">0°</span>
            </div>
        `;
        
        imageContainer.appendChild(controls);
        return controls;
    }

    // Toggle edit mode
    toggleEditMode() {
        this.editMode = !this.editMode;
        const body = document.body;
        const editBtn = document.querySelector('#toggleEditMode');
        
        if (this.editMode) {
            body.classList.add('image-edit-mode');
            editBtn.innerHTML = '<i class="fas fa-save"></i><span>Guardar Cambios</span>';
            this.showAllControls();
        } else {
            body.classList.remove('image-edit-mode');
            editBtn.innerHTML = '<i class="fas fa-edit"></i><span>Rotar Imágenes</span>';
            this.hideAllControls();
            this.saveRotations();
        }
    }

    // Show rotation controls for all images
    showAllControls() {
        const galleryItems = document.querySelectorAll('.gallery-item, .hero-image');
        
        galleryItems.forEach((item, index) => {
            const img = item.querySelector('img');
            if (img) {
                const imageId = this.getImageId(img);
                
                // Only add controls if they don't exist
                if (!item.querySelector('.rotation-controls')) {
                    this.createRotationControls(item, imageId);
                    this.updateRotationDisplay(imageId);
                }
            }
        });
    }

    // Hide all rotation controls
    hideAllControls() {
        const controls = document.querySelectorAll('.rotation-controls');
        controls.forEach(control => control.remove());
    }

    // Get unique image ID
    getImageId(img) {
        const src = img.src;
        const filename = src.split('/').pop().split('.')[0];
        return filename;
    }

    // Apply rotation to image
    rotateImage(imageId, action) {
        const img = document.querySelector(`img[src*="${imageId}"]`);
        if (!img) return;

        if (!this.rotations[imageId]) {
            this.rotations[imageId] = { rotation: 0, flipH: false, flipV: false };
        }

        const current = this.rotations[imageId];

        switch (action) {
            case 'rotate-left':
                current.rotation = (current.rotation - 90) % 360;
                break;
            case 'rotate-right':
                current.rotation = (current.rotation + 90) % 360;
                break;
            case 'flip-horizontal':
                current.flipH = !current.flipH;
                break;
            case 'flip-vertical':
                current.flipV = !current.flipV;
                break;
            case 'reset':
                current.rotation = 0;
                current.flipH = false;
                current.flipV = false;
                break;
        }

        this.applyTransform(img, current);
        this.updateRotationDisplay(imageId);
    }

    // Apply CSS transform to image
    applyTransform(img, transform) {
        const { rotation, flipH, flipV } = transform;
        const scaleX = flipH ? -1 : 1;
        const scaleY = flipV ? -1 : 1;
        
        img.style.transform = `rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
        img.style.transition = 'transform 0.3s ease';
    }

    // Update rotation display
    updateRotationDisplay(imageId) {
        const rotationInfo = document.querySelector(`.rotation-controls [data-image="${imageId}"]`)?.closest('.rotation-controls')?.querySelector('.current-rotation');
        if (rotationInfo && this.rotations[imageId]) {
            const { rotation, flipH, flipV } = this.rotations[imageId];
            let display = `${rotation}°`;
            if (flipH) display += ' ↔';
            if (flipV) display += ' ↕';
            rotationInfo.textContent = display;
        }
    }

    // Apply all saved rotations
    applyRotations() {
        Object.keys(this.rotations).forEach(imageId => {
            const img = document.querySelector(`img[src*="${imageId}"]`);
            if (img) {
                this.applyTransform(img, this.rotations[imageId]);
            }
        });
    }

    // Save rotations to localStorage
    saveRotations() {
        localStorage.setItem('imageRotations', JSON.stringify(this.rotations));
        
        // Show save confirmation
        this.showNotification('Rotaciones guardadas correctamente', 'success');
    }

    // Load rotations from localStorage
    loadRotations() {
        const saved = localStorage.getItem('imageRotations');
        return saved ? JSON.parse(saved) : {};
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `rotation-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Bind all events
    bindEvents() {
        // Toggle edit mode
        document.addEventListener('click', (e) => {
            if (e.target.closest('#toggleEditMode')) {
                e.preventDefault();
                this.toggleEditMode();
            }
        });

        // Rotation controls
        document.addEventListener('click', (e) => {
            const rotateBtn = e.target.closest('.rotate-btn');
            if (rotateBtn) {
                e.preventDefault();
                const action = rotateBtn.dataset.action;
                const imageId = rotateBtn.dataset.image;
                this.rotateImage(imageId, action);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.editMode && e.target.closest('.gallery-item')) {
                const imageId = this.getImageId(e.target.querySelector('img'));
                
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.rotateImage(imageId, 'rotate-left');
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.rotateImage(imageId, 'rotate-right');
                        break;
                    case 'h':
                    case 'H':
                        e.preventDefault();
                        this.rotateImage(imageId, 'flip-horizontal');
                        break;
                    case 'v':
                    case 'V':
                        e.preventDefault();
                        this.rotateImage(imageId, 'flip-vertical');
                        break;
                    case 'r':
                    case 'R':
                        e.preventDefault();
                        this.rotateImage(imageId, 'reset');
                        break;
                }
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageRotator();
});