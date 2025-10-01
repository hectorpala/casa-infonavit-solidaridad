const fs = require('fs');
const path = require('path');

function fixLightboxOnclick(filePath) {
    try {
        let html = fs.readFileSync(filePath, 'utf8');
        const filename = path.basename(filePath);
        let modified = false;

        // Add onclick to all carousel/gallery images that don't have it
        const originalHtml = html;

        // Match all img tags in carousel/gallery sections
        html = html.replace(
            /<img([^>]*?)src="images\/([^"]+)"([^>]*?)>/g,
            (match, before, imagePath, after) => {
                // Skip logo and non-property images
                if (imagePath.includes('Logo') || imagePath.includes('optimized/Logo')) {
                    return match;
                }

                // Skip if already has onclick
                if (match.includes('onclick=')) {
                    return match;
                }

                // Check if this image is inside a carousel/gallery section
                // We'll add onclick to all property images
                const imgIndex = html.substring(0, html.indexOf(match)).split(/<img[^>]*src="images\//).length - 1;

                modified = true;
                return `<img${before}src="images/${imagePath}"${after} onclick="openLightbox(${imgIndex})">`;
            }
        );

        if (!modified || html === originalHtml) {
            console.log(`⏭️  ${filename} - No changes needed`);
            return { status: 'skipped', file: filename };
        }

        // Write updated HTML
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`✅ ${filename} - onclick handlers added`);

        return { status: 'success', file: filename };

    } catch (error) {
        console.error(`❌ ${path.basename(filePath)} - Error: ${error.message}`);
        return { status: 'error', file: path.basename(filePath), error: error.message };
    }
}

async function main() {
    console.log('🔧 Fixing lightbox onclick handlers...\n');

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
        const result = await fixLightboxOnclick(filePath);

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
