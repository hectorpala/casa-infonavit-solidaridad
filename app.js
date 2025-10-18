// Non-critical JavaScript - Loaded with defer
document.addEventListener('DOMContentLoaded', function() {
    // Mobile hamburger menu functionality
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
        
        // Update aria-expanded attribute
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
    });
    
    // Close menu when clicking on nav links
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
            hamburger.setAttribute('aria-expanded', false);
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
            hamburger.setAttribute('aria-expanded', false);
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Header background on scroll
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registrado exitosamente:', registration.scope);
                
                // Verificar si hay actualizaciones
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nueva versión disponible
                            if (confirm('Nueva versión disponible. ¿Recargar página?')) {
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch(function(error) {
                console.log('ServiceWorker registro falló:', error);
            });
    }

    // PWA Install Prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA instalable detectada');
        e.preventDefault();
        deferredPrompt = e;
        
        // Mostrar botón de instalación personalizado después de 3 segundos
        setTimeout(() => {
            showInstallButton();
        }, 3000);
    });

    function showInstallButton() {
        if (deferredPrompt) {
            const installButton = document.createElement('div');
            installButton.innerHTML = `
                <div style="
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #ff4e00, #ff6b2b);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(255, 78, 0, 0.4);
                    z-index: 10000;
                    font-weight: 600;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                " onclick="installPWA()" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <i class="fas fa-download"></i>
                    Instalar App
                </div>
            `;
            document.body.appendChild(installButton);
            
            // Auto ocultar después de 10 segundos
            setTimeout(() => {
                if (installButton.parentNode) {
                    installButton.remove();
                }
            }, 10000);
        }
    }

    // Make installPWA function globally available
    window.installPWA = function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Usuario instaló la PWA');
                }
                deferredPrompt = null;
            });

            // Ocultar botón
            const installButton = document.querySelector('[onclick="installPWA()"]');
            if (installButton) {
                installButton.parentElement.remove();
            }
        }
    };

    // Property Type Filter (Venta/Renta)
    const propertyTypeFilter = document.getElementById('property-type-filter');
    if (propertyTypeFilter) {
        const propertyCards = document.querySelectorAll('#properties-grid .property-card');

        // Función para determinar el tipo de propiedad según el badge
        function getPropertyType(card) {
            const badge = card.querySelector('.absolute.top-3.right-3');
            if (!badge) return 'sale'; // Default a venta

            // RENTA tiene bg-orange-500, VENTA tiene bg-green-600
            if (badge.classList.contains('bg-orange-500')) {
                return 'rent';
            } else if (badge.classList.contains('bg-green-600')) {
                return 'sale';
            }
            return 'sale'; // Default
        }

        // Etiquetar cada tarjeta con su tipo
        propertyCards.forEach(card => {
            const type = getPropertyType(card);
            card.dataset.propertyType = type;
        });

        // Función para aplicar el filtro
        function applyPropertyFilter(selectedType) {
            propertyCards.forEach(card => {
                const cardType = card.dataset.propertyType;

                if (selectedType === 'all' || cardType === selectedType) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // Event listener para cambios en el selector
        propertyTypeFilter.addEventListener('change', function(e) {
            applyPropertyFilter(e.target.value);
        });

        // Aplicar filtro inicial (mostrar todas)
        applyPropertyFilter('all');
    }
});