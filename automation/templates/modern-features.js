/**
 * Modern Features Snippets - Para inyectar en property-page-generator.js
 * Contiene todas las mejoras aplicadas a Casa Solidaridad
 */

module.exports = {
    // Sticky Price Bar HTML
    stickyPriceBarHTML: `
    <!-- Sticky Price Bar (hidden by default, shows on scroll) -->
    <div id="sticky-price-bar" class="sticky-price-bar">
        <div class="sticky-price-content">
            <div class="sticky-price-info">
                <span class="sticky-price-label">{{PROPERTY_TITLE}}</span>
                <span class="sticky-price-amount">{{PROPERTY_PRICE}}</span>
            </div>
            <a href="https://wa.me/528111652545?text=Me%20interesa%20{{PROPERTY_TITLE_ENCODED}}%20de%20{{PROPERTY_PRICE_ENCODED}}"
               class="sticky-whatsapp-btn" target="_blank" onclick="vibrate(50)">
                <i class="fab fa-whatsapp"></i>
                <span>Contactar</span>
            </a>
        </div>
    </div>
`,

    // Sticky Price Bar CSS
    stickyPriceBarCSS: `
    <style>
        /* Sticky Price Bar */
        .sticky-price-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #ff4e00, #ff6b2b);
            padding: 12px 16px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateY(-100%);
            transition: transform 0.3s ease-in-out;
        }

        .sticky-price-bar.visible {
            transform: translateY(0);
        }

        .sticky-price-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
        }

        .sticky-price-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .sticky-price-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
            font-family: 'Poppins', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .sticky-price-amount {
            font-size: 20px;
            color: #ffffff;
            font-weight: 700;
            font-family: 'Poppins', sans-serif;
        }

        .sticky-whatsapp-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #25D366;
            color: #ffffff;
            padding: 10px 20px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            font-family: 'Poppins', sans-serif;
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(37, 211, 102, 0.3);
            white-space: nowrap;
        }

        .sticky-whatsapp-btn:hover {
            background: #20ba5a;
            transform: scale(1.05);
            box-shadow: 0 6px 12px rgba(37, 211, 102, 0.4);
        }

        .sticky-whatsapp-btn i {
            font-size: 18px;
        }

        @media (max-width: 640px) {
            .sticky-price-bar {
                padding: 10px 12px;
            }

            .sticky-price-label {
                font-size: 9px;
            }

            .sticky-price-amount {
                font-size: 16px;
            }

            .sticky-whatsapp-btn {
                padding: 8px 16px;
                font-size: 13px;
            }

            .sticky-whatsapp-btn span {
                display: none;
            }

            .sticky-whatsapp-btn i {
                font-size: 20px;
            }
        }
    </style>
`,

    // Scroll Animations CSS
    scrollAnimationsCSS: `
    <style>
        /* Scroll Animations */
        .scroll-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }

        .scroll-animate.animated {
            opacity: 1;
            transform: translateY(0);
        }

        /* Staggered animation for feature items */
        .features-compact.animated .feature-item {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.5s ease-out forwards;
        }

        .features-compact.animated .feature-item:nth-child(1) { animation-delay: 0.1s; }
        .features-compact.animated .feature-item:nth-child(2) { animation-delay: 0.2s; }
        .features-compact.animated .feature-item:nth-child(3) { animation-delay: 0.3s; }
        .features-compact.animated .feature-item:nth-child(4) { animation-delay: 0.4s; }

        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Badge items staggered animation */
        .details-zillow.animated .badge-item {
            opacity: 0;
            transform: scale(0.9);
            animation: scaleIn 0.4s ease-out forwards;
        }

        .details-zillow.animated .badge-item:nth-child(1) { animation-delay: 0.05s; }
        .details-zillow.animated .badge-item:nth-child(2) { animation-delay: 0.1s; }
        .details-zillow.animated .badge-item:nth-child(3) { animation-delay: 0.15s; }
        .details-zillow.animated .badge-item:nth-child(4) { animation-delay: 0.2s; }
        .details-zillow.animated .badge-item:nth-child(5) { animation-delay: 0.25s; }
        .details-zillow.animated .badge-item:nth-child(6) { animation-delay: 0.3s; }

        @keyframes scaleIn {
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    </style>
`,

    // Haptic Feedback + Animations JavaScript
    modernFeaturesJS: `
    <script>
        // Haptic feedback helper function
        function vibrate(duration = 50) {
            if (navigator.vibrate) {
                navigator.vibrate(duration);
            }
        }

        // Scroll animations with Intersection Observer
        function initScrollAnimations() {
            const animatedElements = document.querySelectorAll('.scroll-animate');

            const observerOptions = {
                threshold: 0.15,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animated');
                        // Vibrate when section comes into view
                        vibrate(20);
                    }
                });
            }, observerOptions);

            animatedElements.forEach(element => {
                observer.observe(element);
            });
        }

        // Sticky price bar on scroll
        function initStickyPriceBar() {
            const stickyBar = document.getElementById('sticky-price-bar');
            const heroSection = document.querySelector('.hero');
            let lastScroll = 0;

            window.addEventListener('scroll', () => {
                const currentScroll = window.pageYOffset;
                const heroHeight = heroSection ? heroSection.offsetHeight : 500;

                // Show sticky bar after scrolling past hero section
                if (currentScroll > heroHeight && currentScroll > lastScroll) {
                    stickyBar.classList.add('visible');
                } else if (currentScroll < 100) {
                    stickyBar.classList.remove('visible');
                }

                lastScroll = currentScroll;
            });
        }

        // Add vibration to carousel navigation
        function addCarouselVibration() {
            // Override changeSlideHero to add vibration
            const originalChangeSlideHero = window.changeSlideHero;
            window.changeSlideHero = function(direction) {
                vibrate(40);
                if (originalChangeSlideHero) originalChangeSlideHero(direction);
            };

            const originalGoToSlideHero = window.goToSlideHero;
            window.goToSlideHero = function(n) {
                vibrate(40);
                if (originalGoToSlideHero) originalGoToSlideHero(n);
            };

            // Lightbox vibrations
            const originalOpenLightbox = window.openLightbox;
            if (originalOpenLightbox) {
                window.openLightbox = function(index) {
                    vibrate(50);
                    originalOpenLightbox(index);
                };
            }

            const originalChangeLightboxSlide = window.changeLightboxSlide;
            if (originalChangeLightboxSlide) {
                window.changeLightboxSlide = function(direction) {
                    vibrate(40);
                    originalChangeLightboxSlide(direction);
                };
            }

            const originalCloseLightbox = window.closeLightbox;
            if (originalCloseLightbox) {
                window.closeLightbox = function() {
                    vibrate(30);
                    originalCloseLightbox();
                };
            }
        }

        // Initialize modern features on page load
        window.addEventListener('DOMContentLoaded', () => {
            initScrollAnimations();
            initStickyPriceBar();
            addCarouselVibration();
        });
    </script>
`,

    // Reduced Hero Content CSS (50% smaller)
    reducedHeroCSS: `
    <style>
        /* Reduced Hero Content - 50% */
        .hero-content {
            padding: 1.5rem 1rem !important;
            border-radius: 10px !important;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1) !important;
        }

        .hero-title {
            font-size: 2rem !important;
            margin-bottom: 0.75rem !important;
            text-shadow: 0 1px 10px rgba(255, 78, 0, 0.3) !important;
        }

        .hero-subtitle {
            font-size: 0.65rem !important;
            margin-bottom: 1.25rem !important;
            letter-spacing: 0.25px !important;
            text-shadow: 0 0.5px 1.5px rgba(255, 255, 255, 0.8) !important;
        }

        .hero-cta {
            padding: 0.6rem 1.25rem !important;
            border-radius: 8px !important;
            font-size: 0.55rem !important;
            box-shadow: 0 5px 15px rgba(255, 78, 0, 0.4) !important;
        }
    </style>
`,

    // Compact Features with 15% larger icons
    compactFeaturesCSS: `
    <style>
        .features-compact {
            padding: 20px 0;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }

        .features-inline {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 24px;
            flex-wrap: wrap;
        }

        .feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Poppins', sans-serif;
        }

        .feature-item i {
            font-size: 20.7px; /* 15% larger */
            color: #ff4e00;
        }

        .feature-value {
            font-size: 18.4px; /* 15% larger */
            font-weight: 600;
            color: #1f2937;
        }

        .feature-label {
            font-size: 16.1px; /* 15% larger */
            color: #6b7280;
        }

        @media (max-width: 640px) {
            .features-inline {
                gap: 16px;
            }

            .feature-item {
                gap: 6px;
            }

            .feature-item i {
                font-size: 18.4px;
            }

            .feature-value {
                font-size: 17.25px;
            }

            .feature-label {
                font-size: 14.95px;
            }
        }
    </style>
`
};
