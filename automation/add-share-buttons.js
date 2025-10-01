const fs = require('fs');
const path = require('path');

// Action bar HTML template
const actionBarHTML = `
    <!-- Action Bar -->
    <section class="action-bar">
        <div class="container">
            <div class="action-bar-content">
                <button onclick="toggleShareOptions()" class="action-btn share-btn">
                    <i class="fas fa-share-alt"></i>
                    <span>Compartir</span>
                </button>
                <button onclick="window.print()" class="action-btn print-btn">
                    <i class="fas fa-print"></i>
                    <span>Imprimir</span>
                </button>
            </div>

            <!-- Share Options Dropdown -->
            <div id="shareOptions" class="share-dropdown" style="display: none;">
                <button onclick="shareWhatsApp()" class="share-option">
                    <i class="fab fa-whatsapp"></i>
                    <span>WhatsApp</span>
                </button>
                <button onclick="shareFacebook()" class="share-option">
                    <i class="fab fa-facebook-f"></i>
                    <span>Facebook</span>
                </button>
                <button onclick="shareEmail()" class="share-option">
                    <i class="fas fa-envelope"></i>
                    <span>Email</span>
                </button>
                <button onclick="copyLink()" class="share-option copy-link">
                    <i class="fas fa-link"></i>
                    <span>Copiar enlace</span>
                </button>
            </div>
        </div>
    </section>
`;

// Action bar CSS
const actionBarCSS = `
        /* Action Bar Styles - Professional Design */
        .action-bar {
            background: #ffffff;
            border-top: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
            padding: 16px 0;
            position: sticky;
            top: 80px;
            z-index: 100;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .action-bar .container {
            position: relative;
        }

        .action-bar-content {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
        }

        .action-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border: 1px solid #d1d5db;
            background: transparent;
            color: #6b7280;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            font-family: 'Poppins', sans-serif;
        }

        .action-btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
            color: #374151;
            transform: translateY(-1px);
        }

        .action-btn i {
            font-size: 16px;
        }

        .share-dropdown {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 12px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            padding: 8px;
            min-width: 220px;
            z-index: 1000;
            animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }

        .share-option {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 12px 16px;
            border: none;
            background: transparent;
            color: #333;
            cursor: pointer;
            transition: all 0.2s ease;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            text-align: left;
        }

        .share-option:hover {
            background: #f3f4f6;
        }

        .share-option i {
            font-size: 18px;
            width: 20px;
        }

        @media (max-width: 768px) {
            .action-btn {
                padding: 8px 14px;
                font-size: 14px;
            }

            .action-btn span {
                display: none;
            }

            .action-btn i {
                font-size: 18px;
            }
        }
`;

// Action bar JavaScript (will be customized per property)
function getActionBarJS(propertyTitle, propertyPrice, propertyUrl, propertyDetails) {
    return `
        // Share Button Functions
        // Get the correct URL (use production URL if local)
        function getShareUrl() {
            const currentUrl = window.location.href;
            if (currentUrl.includes('file://') || currentUrl.includes('localhost')) {
                return 'https://casasenventa.info/${propertyUrl}';
            }
            return currentUrl;
        }

        function toggleShareOptions() {
            const shareOptions = document.getElementById('shareOptions');
            if (shareOptions.style.display === 'none' || shareOptions.style.display === '') {
                shareOptions.style.display = 'block';
            } else {
                shareOptions.style.display = 'none';
            }
        }

        // Close share options when clicking outside
        document.addEventListener('click', function(event) {
            const shareBtn = document.querySelector('.share-btn');
            const shareOptions = document.getElementById('shareOptions');
            if (shareBtn && !shareBtn.contains(event.target) && !shareOptions.contains(event.target)) {
                shareOptions.style.display = 'none';
            }
        });

        function shareWhatsApp() {
            const url = encodeURIComponent(getShareUrl());
            const text = encodeURIComponent('¡Mira esta increíble casa ${propertyTitle}! ${propertyPrice}');
            window.open(\`https://wa.me/?text=\${text}%20\${url}\`, '_blank');
        }

        function shareFacebook() {
            const url = encodeURIComponent(getShareUrl());
            window.open(\`https://www.facebook.com/sharer/sharer.php?u=\${url}\`, '_blank', 'width=600,height=400');
        }

        function shareEmail() {
            const shareUrl = getShareUrl();
            const subject = encodeURIComponent('Casa ${propertyTitle}');
            const body = encodeURIComponent(\`Hola,\\n\\nQuiero compartir contigo esta casa:\\n\\n${propertyTitle}\\nPrecio: ${propertyPrice}\\n${propertyDetails}\\n\\nVer más detalles: \${shareUrl}\\n\\nSaludos!\`);
            window.location.href = \`mailto:?subject=\${subject}&body=\${body}\`;
        }

        function copyLink() {
            const url = getShareUrl();
            navigator.clipboard.writeText(url).then(function() {
                const copyBtn = document.querySelector('.share-option.copy-link');
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
                copyBtn.style.color = '#10b981';

                setTimeout(function() {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.color = '#333';
                }, 2000);
            }).catch(function(err) {
                alert('Error al copiar el enlace. Por favor, cópialo manualmente: ' + url);
            });
        }
`;
}

// Extract property info from HTML
function extractPropertyInfo(html, filename) {
    // Extract title
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'esta propiedad';

    // Extract price
    const priceMatch = html.match(/\$[\d,]+(?:\.\d{2})?/);
    const price = priceMatch ? priceMatch[0] : '';

    // Extract bedrooms and bathrooms
    const bedroomsMatch = html.match(/(\d+)\s*recámaras?/i);
    const bathroomsMatch = html.match(/(\d+(?:\.\d+)?)\s*baños?/i);

    const bedrooms = bedroomsMatch ? bedroomsMatch[1] : '';
    const bathrooms = bathroomsMatch ? bathroomsMatch[1] : '';

    let details = '';
    if (bedrooms) details += `${bedrooms} recámaras`;
    if (bathrooms) details += details ? `, ${bathrooms} baños` : `${bathrooms} baños`;

    // Property URL (filename without extension)
    const propertyUrl = filename.replace('.html', '.html');

    return { title, price, details, propertyUrl };
}

async function addShareButtonsToProperty(filePath) {
    try {
        let html = fs.readFileSync(filePath, 'utf8');
        const filename = path.basename(filePath);

        // Check if action bar already exists
        if (html.includes('class="action-bar"')) {
            console.log(`⏭️  ${filename} - Already has action bar`);
            return { status: 'skipped', file: filename };
        }

        // Extract property info
        const propertyInfo = extractPropertyInfo(html, filename);

        // Find where to insert action bar (after hero carousel, before features)
        const insertionRegex = /<\/section>\s*\n\s*<!-- Features Section -->/;
        const match = html.match(insertionRegex);

        if (!match) {
            console.log(`⚠️  ${filename} - Could not find insertion point`);
            return { status: 'failed', file: filename, reason: 'No insertion point' };
        }

        // Insert action bar HTML
        html = html.replace(insertionRegex, `</section>\n${actionBarHTML}\n    <!-- Features Section -->`);

        // Add CSS before </style>
        if (html.includes('</style>')) {
            html = html.replace('</style>', `${actionBarCSS}\n    </style>`);
        }

        // Add JavaScript before </script> or before </body>
        const jsCode = getActionBarJS(
            propertyInfo.title,
            propertyInfo.price,
            propertyInfo.propertyUrl,
            propertyInfo.details
        );

        if (html.includes('<script>')) {
            html = html.replace('</script>', `${jsCode}\n    </script>`);
        } else if (html.includes('</body>')) {
            html = html.replace('</body>', `    <script>${jsCode}\n    </script>\n</body>`);
        }

        // Write updated HTML
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`✅ ${filename} - Share buttons added`);

        return { status: 'success', file: filename };

    } catch (error) {
        console.error(`❌ ${path.basename(filePath)} - Error: ${error.message}`);
        return { status: 'error', file: path.basename(filePath), error: error.message };
    }
}

async function main() {
    console.log('🚀 Adding share buttons to all properties...\n');

    // Get all casa-*.html files using fs
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
        const result = await addShareButtonsToProperty(filePath);

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
