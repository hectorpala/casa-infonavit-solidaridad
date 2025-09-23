document.addEventListener("DOMContentLoaded", function() {
    // GALLERY CAROUSEL (main gallery)
    let currentSlide = 0;
    const totalSlides = 9;
    let touchStartX = 0;
    let touchEndX = 0;
    
    function showSlide(n) {
        const slides = document.querySelectorAll('.gallery .carousel-slide');
        const dots = document.querySelectorAll('.gallery .carousel-dot');
        
        if (n >= totalSlides) currentSlide = 0;
        if (n < 0) currentSlide = totalSlides - 1;
        
        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            if (index === currentSlide) {
                slide.classList.add('active');
            }
        });
        
        dots.forEach((dot, index) => {
            dot.classList.remove('active');
            if (index === currentSlide) {
                dot.classList.add('active');
            }
        });
    }
    
    function changeSlide(direction) {
        currentSlide += direction;
        showSlide(currentSlide);
    }
    
    function goToSlide(n) {
        currentSlide = n;
        showSlide(currentSlide);
    }
    
    // Touch/swipe support for mobile - GALLERY CAROUSEL ONLY
    const carouselWrapper = document.querySelector('.gallery .carousel-wrapper');
    
    if (carouselWrapper) {
        carouselWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        carouselWrapper.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                changeSlide(1);
            } else {
                changeSlide(-1);
            }
        }
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            changeSlide(-1);
        } else if (e.key === 'ArrowRight') {
            changeSlide(1);
        }
    });

    // HERO CAROUSEL FUNCTIONS (separate from gallery carousel)
    let currentSlideHero = 0;
    const totalSlidesHero = 9;
    let touchStartXHero = 0;
    let touchEndXHero = 0;
    
    function showSlideHero(n) {
        const slides = document.querySelectorAll('.hero-image .carousel-slide');
        const dots = document.querySelectorAll('.hero-image .carousel-dot');
        
        if (n >= totalSlidesHero) currentSlideHero = 0;
        if (n < 0) currentSlideHero = totalSlidesHero - 1;
        
        slides.forEach((slide, index) => {
            slide.classList.remove('active');
            if (index === currentSlideHero) {
                slide.classList.add('active');
            }
        });
        
        dots.forEach((dot, index) => {
            dot.classList.remove('active');
            if (index === currentSlideHero) {
                dot.classList.add('active');
            }
        });
    }
    
    function changeSlideHero(direction) {
        currentSlideHero += direction;
        showSlideHero(currentSlideHero);
    }
    
    function goToSlideHero(n) {
        currentSlideHero = n;
        showSlideHero(currentSlideHero);
    }
    
    // Touch/swipe support for hero carousel
    const carouselWrapperHero = document.querySelector('.hero-image .carousel-wrapper');
    
    if (carouselWrapperHero) {
        carouselWrapperHero.addEventListener('touchstart', (e) => {
            touchStartXHero = e.changedTouches[0].screenX;
        });
        
        carouselWrapperHero.addEventListener('touchend', (e) => {
            touchEndXHero = e.changedTouches[0].screenX;
            handleSwipeHero();
        });
    }
    
    function handleSwipeHero() {
        const swipeThreshold = 50;
        const diff = touchStartXHero - touchEndXHero;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                changeSlideHero(1);
            } else {
                changeSlideHero(-1);
            }
        }
    }

    // Expose functions globally for onclick handlers
    window.changeSlide = changeSlide;
    window.goToSlide = goToSlide;
    window.changeSlideHero = changeSlideHero;
    window.goToSlideHero = goToSlideHero;
});

// Calculator functions
function updateEnganche() {
    const precio = document.getElementById('precio').value || 1300000;
    const porcentaje = document.getElementById('enganche').value;
    const monto = precio * (porcentaje / 100);
    document.getElementById('engancheDisplay').textContent = 
        porcentaje + '% = $' + monto.toLocaleString('es-MX');
}

function calcular() {
    const precio = parseFloat(document.getElementById('precio').value) || 1300000;
    const enganchePorcentaje = parseFloat(document.getElementById('enganche').value) || 5;
    const anos = parseInt(document.getElementById('anos').value) || 20;
    const tasaAnual = parseFloat(document.getElementById('banco').value) || 10.45;
    
    const engancheMonto = precio * (enganchePorcentaje / 100);
    const montoCredito = precio - engancheMonto;
    const tasaMensual = tasaAnual / 100 / 12;
    const numeroPageos = anos * 12;
    
    let pagoMensual;
    if (tasaMensual === 0) {
        pagoMensual = montoCredito / numeroPageos;
    } else {
        pagoMensual = montoCredito * 
            (tasaMensual * Math.pow(1 + tasaMensual, numeroPageos)) / 
            (Math.pow(1 + tasaMensual, numeroPageos) - 1);
    }
    
    const totalPagar = pagoMensual * numeroPageos;
    
    document.getElementById('resultado').textContent = '$' + Math.round(pagoMensual).toLocaleString('es-MX');
    document.getElementById('credito').textContent = '$' + Math.round(montoCredito).toLocaleString('es-MX');
    document.getElementById('tasa').textContent = tasaAnual + '%';
    document.getElementById('total').textContent = '$' + Math.round(totalPagar).toLocaleString('es-MX');
}

// Initialize calculator on load
window.addEventListener('load', function() {
    updateEnganche();
    calcular();
});