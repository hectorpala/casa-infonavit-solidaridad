const fs = require('fs');
const path = require('path');

const newOpenLightboxFunction = `        function openLightbox(clickedImg) {
            if (lightboxImages.length === 0) initLightbox();

            // If passed a number (old behavior), use it directly
            if (typeof clickedImg === 'number') {
                currentLightboxIndex = clickedImg;
            } else {
                // If passed an image element, find its index in the unique array
                const imgSrc = clickedImg.src;
                currentLightboxIndex = lightboxImages.findIndex(item => item.src === imgSrc);
                if (currentLightboxIndex === -1) currentLightboxIndex = 0;
            }

            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            const lightboxCurrent = document.getElementById('lightbox-current');
            const lightboxTotal = document.getElementById('lightbox-total');

            lightboxImg.src = lightboxImages[currentLightboxIndex].src;
            lightboxImg.alt = lightboxImages[currentLightboxIndex].alt;
            lightboxCurrent.textContent = currentLightboxIndex + 1;
            lightboxTotal.textContent = lightboxImages.length;

            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }`;

function fixLightboxFinal(filePath) {
    try {
        let html = fs.readFileSync(filePath, 'utf8');
        const filename = path.basename(filePath);

        // Check if file has lightbox
        if (!html.includes('function openLightbox')) {
            console.log(`⏭️  ${filename} - No lightbox found`);
            return { status: 'skipped', file: filename };
        }

        // Replace openLightbox function
        const openLightboxPattern = /function openLightbox\([^)]*\) \{[\s\S]*?document\.body\.style\.overflow = 'hidden';\s*\}/;

        if (!openLightboxPattern.test(html)) {
            console.log(`⚠️  ${filename} - Could not find openLightbox pattern`);
            return { status: 'failed', file: filename };
        }

        html = html.replace(openLightboxPattern, newOpenLightboxFunction);

        // Change all onclick="openLightbox(n)" to onclick="openLightbox(this)"
        html = html.replace(/onclick="openLightbox\(\d+\)"/g, 'onclick="openLightbox(this)"');

        // Write updated HTML
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`✅ ${filename} - Lightbox fixed (using this)`);

        return { status: 'success', file: filename };

    } catch (error) {
        console.error(`❌ ${path.basename(filePath)} - Error: ${error.message}`);
        return { status: 'error', file: path.basename(filePath), error: error.message };
    }
}

async function main() {
    console.log('🔧 Final lightbox fix - using this instead of indexes...\n');

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
        const result = await fixLightboxFinal(filePath);

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
