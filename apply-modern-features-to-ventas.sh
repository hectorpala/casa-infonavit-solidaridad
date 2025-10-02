#!/bin/bash

echo "🚀 Aplicando Modern Features a propiedades de VENTA"
echo "=================================================="
echo ""

FEATURES_APPLIED=0
FEATURES_SKIPPED=0

# Leer el módulo de modern features
STICKY_BAR_HTML='
    <div id="sticky-price-bar" class="sticky-price-bar">
        <div class="sticky-price-content">
            <div class="sticky-price-info">
                <span class="sticky-price-label">__PROPERTY_TITLE__</span>
                <span class="sticky-price-amount">__PROPERTY_PRICE__</span>
            </div>
            <a href="https://wa.me/528111652545?text=__WA_MESSAGE__"
               class="sticky-whatsapp-btn" target="_blank" onclick="vibrate(50)">
                <i class="fab fa-whatsapp"></i>
                <span>Contactar</span>
            </a>
        </div>
    </div>'

# Iterar sobre todas las propiedades de venta
for FILE in casa-venta-*.html; do
    # Skip Hacienda del Rio (ya actualizada)
    if [[ "$FILE" == "casa-venta-hacienda-del-rio.html" ]]; then
        echo "⏭️  Skipping $FILE (ya actualizada)"
        FEATURES_SKIPPED=$((FEATURES_SKIPPED + 1))
        continue
    fi
    
    # Verificar si ya tiene modern features
    if grep -q "sticky-price-bar" "$FILE"; then
        echo "⏭️  Skipping $FILE (ya tiene modern features)"
        FEATURES_SKIPPED=$((FEATURES_SKIPPED + 1))
        continue
    fi
    
    echo "📝 Processing: $FILE"
    
    # Extraer título y precio de la propiedad
    TITLE=$(grep -o '<title>[^<]*</title>' "$FILE" | sed 's/<title>\(.*\)<\/title>/\1/' | head -1)
    PRICE=$(grep -o '\$[0-9,]*' "$FILE" | head -1)
    
    # Si no hay precio, skip
    if [ -z "$PRICE" ]; then
        echo "   ⚠️  No se encontró precio, skipping"
        FEATURES_SKIPPED=$((FEATURES_SKIPPED + 1))
        continue
    fi
    
    echo "   💰 Precio: $PRICE"
    echo "   📋 Título: $TITLE"
    
    # Crear mensaje WhatsApp encoded
    TITLE_CLEAN=$(echo "$TITLE" | sed 's/|.*//' | xargs)
    WA_MESSAGE=$(echo "Me%20interesa%20${TITLE_CLEAN}%20de%20${PRICE}" | sed 's/ /%20/g')
    
    # Reemplazar placeholders en sticky bar
    STICKY_BAR_CUSTOM=$(echo "$STICKY_BAR_HTML" | sed "s|__PROPERTY_TITLE__|$TITLE_CLEAN|g" | sed "s|__PROPERTY_PRICE__|$PRICE|g" | sed "s|__WA_MESSAGE__|$WA_MESSAGE|g")
    
    # 1. Inyectar Sticky Bar HTML antes de </body>
    if grep -q "</body>" "$FILE"; then
        # Crear archivo temporal con sticky bar
        awk -v sticky="$STICKY_BAR_CUSTOM" '{
            if ($0 ~ /<\/body>/) {
                print sticky
            }
            print $0
        }' "$FILE" > "${FILE}.tmp" && mv "${FILE}.tmp" "$FILE"
        echo "   ✅ Sticky bar HTML agregado"
    fi
    
    # 2. Inyectar CSS antes de </head>
    if grep -q "</head>" "$FILE"; then
        cat >> "${FILE}.css_inject" << 'CSS'
    <style>
        /* Sticky Price Bar */
        .sticky-price-bar {
            position: fixed;
            top: -100px;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 999;
            transition: top 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            padding: 12px 0;
        }
        
        .sticky-price-bar.visible {
            top: 0;
        }
        
        .sticky-price-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
        }
        
        .sticky-price-info {
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 1;
        }
        
        .sticky-price-label {
            font-size: 14px;
            color: #d1d5db;
            font-weight: 500;
            font-family: 'Poppins', sans-serif;
        }
        
        .sticky-price-amount {
            font-size: 20px;
            font-weight: 700;
            color: #ff4e00;
            font-family: 'Poppins', sans-serif;
        }
        
        .sticky-whatsapp-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #25d366;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            font-family: 'Poppins', sans-serif;
        }
        
        .sticky-whatsapp-btn:hover {
            background: #20ba5a;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(37, 211, 102, 0.3);
        }
        
        .sticky-whatsapp-btn i {
            font-size: 18px;
        }
        
        @media (max-width: 768px) {
            .sticky-price-label {
                display: none;
            }
            .sticky-price-amount {
                font-size: 18px;
            }
            .sticky-whatsapp-btn span {
                display: none;
            }
            .sticky-whatsapp-btn {
                padding: 10px 14px;
            }
        }
        
        /* Scroll Animations */
        .scroll-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .scroll-animate.animated {
            opacity: 1;
            transform: translateY(0);
        }
    </style>
CSS
        
        sed -i '' -e "/<\/head>/r ${FILE}.css_inject" "$FILE"
        rm "${FILE}.css_inject"
        echo "   ✅ CSS agregado"
    fi
    
    # 3. Inyectar JavaScript antes de </body>
    if grep -q "</body>" "$FILE"; then
        cat >> "${FILE}.js_inject" << 'JAVASCRIPT'
    <script>
        // Vibration API
        function vibrate(duration) {
            if ('vibrate' in navigator) {
                navigator.vibrate(duration);
            }
        }
        
        // Sticky price bar on scroll
        function initStickyPriceBar() {
            const stickyBar = document.getElementById('sticky-price-bar');
            if (!stickyBar) return;
            
            const heroSection = document.querySelector('.hero') || document.querySelector('section:first-of-type');
            let lastScroll = 0;
            
            window.addEventListener('scroll', () => {
                const currentScroll = window.pageYOffset;
                const heroHeight = heroSection ? heroSection.offsetHeight : 500;
                
                if (currentScroll > heroHeight && currentScroll > lastScroll) {
                    stickyBar.classList.add('visible');
                } else if (currentScroll < 100) {
                    stickyBar.classList.remove('visible');
                }
                
                lastScroll = currentScroll;
            });
        }
        
        // Scroll animations
        function initScrollAnimations() {
            const sections = document.querySelectorAll('section');
            sections.forEach(section => section.classList.add('scroll-animate'));
            
            const animatedElements = document.querySelectorAll('.scroll-animate');
            const observerOptions = {
                threshold: 0.15,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animated');
                        vibrate(20);
                    }
                });
            }, observerOptions);
            
            animatedElements.forEach(element => observer.observe(element));
        }
        
        // Initialize on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initStickyPriceBar();
                initScrollAnimations();
            });
        } else {
            initStickyPriceBar();
            initScrollAnimations();
        }
    </script>
JAVASCRIPT
        
        sed -i '' -e "/<\/body>/r ${FILE}.js_inject" "$FILE"
        rm "${FILE}.js_inject"
        echo "   ✅ JavaScript agregado"
    fi
    
    echo "   ✅ Modern features aplicadas a $FILE"
    echo ""
    FEATURES_APPLIED=$((FEATURES_APPLIED + 1))
done

echo "=================================================="
echo "✅ Completado!"
echo "   📊 Propiedades actualizadas: $FEATURES_APPLIED"
echo "   ⏭️  Propiedades omitidas: $FEATURES_SKIPPED"
echo "=================================================="
