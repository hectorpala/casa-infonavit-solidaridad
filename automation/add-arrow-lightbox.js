const fs = require('fs');
const path = require('path');

const helperFunctions = `
        // Open lightbox from carousel arrows
        function openLightboxFromCarousel() {
            const carousels = document.querySelectorAll('.carousel');
            for (let carousel of carousels) {
                const activeSlide = carousel.querySelector('.slide.active');
                if (activeSlide) {
                    const img = activeSlide.querySelector('img');
                    if (img && img.getAttribute('onclick')) {
                        const onclickStr = img.getAttribute('onclick');
                        const indexMatch = onclickStr.match(/openLightbox\\((\\d+)\\)/);
                        if (indexMatch) {
                            const slideIndex = parseInt(indexMatch[1]);
                            setTimeout(() => {
                                openLightbox(slideIndex);
                            }, 50);
                            return;
                        }
                    }
                }
            }
        }

        function openLightboxFromGallery() {
            const galleries = document.querySelectorAll('.carousel');
            let foundGallery = false;
            for (let i = 1; i < galleries.length; i++) { // Skip first (hero)
                const activeSlide = galleries[i].querySelector('.slide.active');
                if (activeSlide) {
                    const img = activeSlide.querySelector('img');
                    if (img && img.getAttribute('onclick')) {
                        const onclickStr = img.getAttribute('onclick');
                        const indexMatch = onclickStr.match(/openLightbox\\((\\d+)\\)/);
                        if (indexMatch) {
                            const slideIndex = parseInt(indexMatch[1]);
                            setTimeout(() => {
                                openLightbox(slideIndex);
                            }, 50);
                            return;
                        }
                    }
                }
            }
        }
`;

function addArrowLightbox(filePath) {
    try {
        let html = fs.readFileSync(filePath, 'utf8');
        const filename = path.basename(filePath);

        // Check if file has lightbox
        if (!html.includes('function openLightbox')) {
            console.log(`⏭️  ${filename} - No lightbox found`);
            return { status: 'skipped', file: filename };
        }

        // Check if helper functions already exist
        if (html.includes('function openLightboxFromCarousel')) {
            console.log(`⏭️  ${filename} - Already has helper functions`);
            return { status: 'skipped', file: filename };
        }

        // Add helper functions before closing script tag or before "Close lightbox when clicking"
        if (html.includes('// Close lightbox when clicking outside the image')) {
            html = html.replace(
                '        // Close lightbox when clicking outside the image',
                helperFunctions + '\n        // Close lightbox when clicking outside the image'
            );
        } else if (html.includes('    </script>')) {
            html = html.replace('    </script>', helperFunctions + '\n    </script>');
        }

        // Update all changeImage onclick calls to also call helper functions
        // Match patterns like: onclick="changeImage(document.getElementById('...'), -1)"
        html = html.replace(
            /onclick="changeImage\(([^)]+),\s*(-?1)\)"/g,
            (match, carouselId, direction) => {
                // Determine if it's first carousel (hero) or second (gallery)
                if (match.includes('hero') || match.includes('0')) {
                    return `onclick="changeImage(${carouselId}, ${direction}); openLightboxFromCarousel();"`;
                } else {
                    return `onclick="changeImage(${carouselId}, ${direction}); openLightboxFromGallery();"`;
                }
            }
        );

        // Also handle simpler patterns
        html = html.replace(
            /onclick="changeImage\(([^,]+),\s*(-?1)\)"/g,
            'onclick="changeImage($1, $2); openLightboxFromCarousel();"'
        );

        // Write updated HTML
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`✅ ${filename} - Arrow lightbox added`);

        return { status: 'success', file: filename };

    } catch (error) {
        console.error(`❌ ${path.basename(filePath)} - Error: ${error.message}`);
        return { status: 'error', file: path.basename(filePath), error: error.message };
    }
}

async function main() {
    console.log('🚀 Adding lightbox to carousel arrows...\n');

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
        const result = await addArrowLightbox(filePath);

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
