const fs = require('fs');
const path = require('path');

const newInitFunction = `        function initLightbox() {
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
        }`;

function updateLightboxInit(filePath) {
    try {
        let html = fs.readFileSync(filePath, 'utf8');
        const filename = path.basename(filePath);

        // Check if file has lightbox
        if (!html.includes('function initLightbox')) {
            console.log(`⏭️  ${filename} - No lightbox found`);
            return { status: 'skipped', file: filename };
        }

        // Replace old initLightbox function with new one
        const oldPattern = /function initLightbox\(\) \{[\s\S]*?\n        \}/;

        if (!oldPattern.test(html)) {
            console.log(`⚠️  ${filename} - Could not find initLightbox pattern`);
            return { status: 'failed', file: filename };
        }

        html = html.replace(oldPattern, newInitFunction);

        // Write updated HTML
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`✅ ${filename} - initLightbox updated`);

        return { status: 'success', file: filename };

    } catch (error) {
        console.error(`❌ ${path.basename(filePath)} - Error: ${error.message}`);
        return { status: 'error', file: path.basename(filePath), error: error.message };
    }
}

async function main() {
    console.log('🔧 Updating initLightbox function in all properties...\n');

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
        const result = await updateLightboxInit(filePath);

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
