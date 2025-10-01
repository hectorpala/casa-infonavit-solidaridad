const fs = require('fs');
const path = require('path');

function fixLightboxIndexes(filePath) {
    try {
        let html = fs.readFileSync(filePath, 'utf8');
        const filename = path.basename(filePath);
        let modified = false;

        // Find all onclick="openLightbox(n)" and recalculate indexes starting from 0
        let imageIndex = 0;
        const propertyImagesPattern = /<img([^>]*?)src="images\/([^"]+)"([^>]*?)onclick="openLightbox\((\d+)\)"([^>]*?)>/g;

        html = html.replace(propertyImagesPattern, (match, before, imagePath, middle, oldIndex, after) => {
            // Skip if it's a logo
            if (imagePath.includes('Logo')) {
                return match;
            }

            const newIndex = imageIndex;
            imageIndex++;
            modified = true;

            return `<img${before}src="images/${imagePath}"${middle}onclick="openLightbox(${newIndex})"${after}>`;
        });

        if (!modified) {
            console.log(`⏭️  ${filename} - No changes needed`);
            return { status: 'skipped', file: filename };
        }

        // Write updated HTML
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`✅ ${filename} - Indexes corrected (0-based)`);

        return { status: 'success', file: filename };

    } catch (error) {
        console.error(`❌ ${path.basename(filePath)} - Error: ${error.message}`);
        return { status: 'error', file: path.basename(filePath), error: error.message };
    }
}

async function main() {
    console.log('🔧 Fixing lightbox indexes (converting to 0-based)...\n');

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
        const result = await fixLightboxIndexes(filePath);

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
