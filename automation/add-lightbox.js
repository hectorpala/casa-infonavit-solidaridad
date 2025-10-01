const fs = require('fs');
const path = require('path');

// Lightbox HTML template
const lightboxHTML = `
    <!-- Lightbox Modal -->
    <div id="lightbox" class="lightbox">
        <button class="lightbox-close" onclick="closeLightbox()" aria-label="Cerrar galería">&times;</button>
        <button class="lightbox-prev" onclick="changeLightboxSlide(-1)" aria-label="Foto anterior">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button class="lightbox-next" onclick="changeLightboxSlide(1)" aria-label="Siguiente foto">
            <i class="fas fa-chevron-right"></i>
        </button>
        <div class="lightbox-content">
            <img id="lightbox-img" src="" alt="">
            <div class="lightbox-counter">
                <span id="lightbox-current">1</span> / <span id="lightbox-total">1</span>
            </div>
        </div>
    </div>

    <style>
        /* Lightbox Styles */
        .lightbox {
            display: none;
            position: fixed;
            z-index: 9999;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.95);
            animation: fadeIn 0.3s ease;
        }

        .lightbox.active {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .lightbox-content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .lightbox-content img {
            max-width: 100%;
            max-height: 85vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .lightbox-close {
            position: absolute;
            top: 20px;
            right: 30px;
            font-size: 40px;
            font-weight: 300;
            color: #fff;
            background: none;
            border: none;
            cursor: pointer;
            z-index: 10000;
            transition: transform 0.2s ease;
            padding: 10px;
            line-height: 1;
        }

        .lightbox-close:hover {
            transform: scale(1.2);
            color: #ddd;
        }

        .lightbox-prev,
        .lightbox-next {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            font-size: 30px;
            color: #fff;
            background-color: rgba(0, 0, 0, 0.5);
            border: none;
            padding: 20px 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 4px;
            z-index: 10000;
        }

        .lightbox-prev:hover,
        .lightbox-next:hover {
            background-color: rgba(0, 0, 0, 0.8);
        }

        .lightbox-prev {
            left: 20px;
        }

        .lightbox-next {
            right: 20px;
        }

        .lightbox-counter {
            color: #fff;
            font-size: 18px;
            margin-top: 15px;
            text-align: center;
            font-weight: 500;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        /* Cursor pointer for clickable images */
        .carousel-image {
            cursor: pointer;
            transition: transform 0.2s ease;
        }

        .carousel-image:hover {
            transform: scale(1.02);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
            .lightbox-prev,
            .lightbox-next {
                padding: 15px 10px;
                font-size: 24px;
            }

            .lightbox-prev {
                left: 10px;
            }

            .lightbox-next {
                right: 10px;
            }

            .lightbox-close {
                top: 10px;
                right: 15px;
                font-size: 35px;
            }

            .lightbox-counter {
                font-size: 16px;
                margin-top: 10px;
            }

            .lightbox-content {
                max-width: 95%;
            }
        }
    </style>

    <script>
        // Lightbox functionality
        let lightboxImages = [];
        let currentLightboxIndex = 0;

        // Initialize lightbox images from carousel
        function initLightbox() {
            lightboxImages = [];
            // Find all property images (include .slide img for properties without carousel-image class)
            const images = document.querySelectorAll('.carousel-image, .gallery-image, .slide img, .carousel img');
            images.forEach(img => {
                // Skip logos and non-property images
                if (img.src.includes('Logo') || img.classList.contains('logo')) {
                    return;
                }
                if (!lightboxImages.some(item => item.src === img.src)) {
                    lightboxImages.push({
                        src: img.src,
                        alt: img.alt
                    });
                }
            });
        }

        // Call init when page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initLightbox);
        } else {
            initLightbox();
        }

        function openLightbox(index) {
            if (lightboxImages.length === 0) initLightbox();

            currentLightboxIndex = index;
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            const lightboxCurrent = document.getElementById('lightbox-current');
            const lightboxTotal = document.getElementById('lightbox-total');

            lightboxImg.src = lightboxImages[index].src;
            lightboxImg.alt = lightboxImages[index].alt;
            lightboxCurrent.textContent = index + 1;
            lightboxTotal.textContent = lightboxImages.length;

            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            const lightbox = document.getElementById('lightbox');
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        function changeLightboxSlide(direction) {
            currentLightboxIndex += direction;

            if (currentLightboxIndex >= lightboxImages.length) {
                currentLightboxIndex = 0;
            } else if (currentLightboxIndex < 0) {
                currentLightboxIndex = lightboxImages.length - 1;
            }

            const lightboxImg = document.getElementById('lightbox-img');
            const lightboxCurrent = document.getElementById('lightbox-current');

            lightboxImg.src = lightboxImages[currentLightboxIndex].src;
            lightboxImg.alt = lightboxImages[currentLightboxIndex].alt;
            lightboxCurrent.textContent = currentLightboxIndex + 1;
        }

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            const lightbox = document.getElementById('lightbox');
            if (lightbox && lightbox.classList.contains('active')) {
                if (e.key === 'Escape') {
                    closeLightbox();
                } else if (e.key === 'ArrowLeft') {
                    changeLightboxSlide(-1);
                } else if (e.key === 'ArrowRight') {
                    changeLightboxSlide(1);
                }
            }
        });

        // Close lightbox when clicking outside the image
        if (document.getElementById('lightbox')) {
            document.getElementById('lightbox').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeLightbox();
                }
            });
        }

        // Open lightbox from carousel arrows
        function openLightboxFromCarousel() {
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                const activeSlide = heroSection.querySelector('.carousel-slide.active');
                if (activeSlide) {
                    const slideIndex = parseInt(activeSlide.getAttribute('data-slide'));
                    setTimeout(() => {
                        openLightbox(slideIndex);
                    }, 50);
                }
            }
        }

        function openLightboxFromGallery() {
            const gallerySection = document.querySelector('.gallery');
            if (gallerySection) {
                const activeSlide = gallerySection.querySelector('.carousel-slide.active');
                if (activeSlide) {
                    const slideIndex = parseInt(activeSlide.getAttribute('data-slide'));
                    setTimeout(() => {
                        openLightbox(slideIndex);
                    }, 50);
                }
            }
        }
    </script>
`;

function addLightboxToProperty(filePath) {
    try {
        let html = fs.readFileSync(filePath, 'utf8');
        const filename = path.basename(filePath);

        // Check if lightbox already exists
        if (html.includes('id="lightbox"') || html.includes('class="lightbox"')) {
            console.log(`⏭️  ${filename} - Already has lightbox`);
            return { status: 'skipped', file: filename };
        }

        // Add onclick to all carousel images
        html = html.replace(
            /<img([^>]*?)class="carousel-image([^"]*?)"([^>]*?)>/g,
            (match, before, classExtra, after) => {
                // Skip if already has onclick
                if (match.includes('onclick=')) {
                    return match;
                }

                // Extract data-slide if available, otherwise use 0
                const slideMatch = match.match(/data-slide="(\d+)"/);
                const slideIndex = slideMatch ? slideMatch[1] : '0';

                return `<img${before}class="carousel-image${classExtra}"${after} onclick="openLightbox(${slideIndex})">`;
            }
        );

        // Add onclick to carousel arrows to open lightbox
        html = html.replace(
            /onclick="changeSlide\((-?\d+)\)"/g,
            'onclick="changeSlide($1); openLightboxFromGallery();"'
        );

        html = html.replace(
            /onclick="changeSlideHero\((-?\d+)\)"/g,
            'onclick="changeSlideHero($1); openLightboxFromCarousel();"'
        );

        // Insert lightbox before </body>
        html = html.replace('</body>', `${lightboxHTML}\n</body>`);

        // Write updated HTML
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`✅ ${filename} - Lightbox added`);

        return { status: 'success', file: filename };

    } catch (error) {
        console.error(`❌ ${path.basename(filePath)} - Error: ${error.message}`);
        return { status: 'error', file: path.basename(filePath), error: error.message };
    }
}

async function main() {
    console.log('🚀 Adding lightbox to all properties...\n');

    const baseDir = path.join(__dirname, '..');
    const allFiles = fs.readdirSync(baseDir);
    const files = allFiles.filter(f => f.startsWith('casa-') && f.endsWith('.html'));

    const results = {
        success: [],
        skipped: [],
        failed: []
    };

    for (const file of files) {
        const filePath = path.join(baseDir, file);
        const result = await addLightboxToProperty(filePath);

        if (result.status === 'success') results.success.push(result.file);
        else if (result.status === 'skipped') results.skipped.push(result.file);
        else results.failed.push(result.file);
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Success: ${results.success.length}`);
    console.log(`⏭️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`📁 Total files processed: ${files.length}`);
}

main();
