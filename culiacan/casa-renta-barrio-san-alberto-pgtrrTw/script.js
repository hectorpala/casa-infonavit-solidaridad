// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe sections for animation
    const sections = document.querySelectorAll('.features, .gallery, .details, .contact');
    sections.forEach(section => {
        observer.observe(section);
    });

    // Gallery image click handler - DISABLED for rotation functionality
    // Images now use rotation controls instead of modal lightbox
    console.log('ℹ️ Gallery modal disabled - using rotation controls instead');
    
    /* MODAL FUNCTIONALITY DISABLED - REPLACED WITH ROTATION CONTROLS
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const img = this.querySelector('img');
            if (img.src) {
                // Create modal for full-size image view
                const modal = document.createElement('div');
                modal.className = 'image-modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <img src="${img.src}" alt="${img.alt}">
                    </div>
                `;
                
                // Modal styles
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.9);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                `;
                
                const modalContent = modal.querySelector('.modal-content');
                modalContent.style.cssText = `
                    position: relative;
                    max-width: 90%;
                    max-height: 90%;
                `;
                
                const modalImg = modal.querySelector('img');
                modalImg.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    border-radius: 8px;
                `;
                
                const closeBtn = modal.querySelector('.close-modal');
                closeBtn.style.cssText = `
                    position: absolute;
                    top: -40px;
                    right: 0;
                    color: white;
                    font-size: 30px;
                    cursor: pointer;
                    z-index: 2001;
                `;
                
                document.body.appendChild(modal);
                
                // Animate in
                setTimeout(() => {
                    modal.style.opacity = '1';
                }, 10);
                
                // Close modal handlers
                const closeModal = () => {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(modal);
                    }, 300);
                };
                
                closeBtn.addEventListener('click', closeModal);
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        closeModal();
                    }
                });
                
                // Close on escape key
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        closeModal();
                    }
                });
            }
        });
    });
    END COMMENTED MODAL CODE */

    // Header background change on scroll
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
    });

    // WhatsApp button analytics (optional)
    const whatsappBtn = document.querySelector('.whatsapp-button');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', function() {
            // Track WhatsApp click if you have analytics
            console.log('WhatsApp contact initiated');
        });
    }

    // Form submission handler (if you add a contact form later)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Handle form submission
            alert('Gracias por tu interés. Te contactaremos pronto.');
        });
    });

    // Simple and Working Mortgage Calculator
    function initMortgageCalculator() {
        console.log('Initializing mortgage calculator...');
        
        // Get all elements
        const priceInput = document.getElementById('housePrice');
        const slider = document.getElementById('downPaymentSlider');
        const percentDisplay = document.getElementById('downPaymentPercent');
        const moneyDisplay = document.getElementById('downPaymentMoney');
        const yearsSelect = document.getElementById('loanYears');
        const bankSelect = document.getElementById('bankType');
        const calcButton = document.getElementById('calculateButton');
        const monthlyResult = document.getElementById('monthlyResult');
        const loanAmountResult = document.getElementById('loanAmountResult');
        const interestRateResult = document.getElementById('interestRateResult');
        const totalPaymentResult = document.getElementById('totalPaymentResult');
        const comparisonCards = document.getElementById('comparisonCards');

        console.log('Elements found:', {
            priceInput: !!priceInput,
            slider: !!slider,
            calcButton: !!calcButton,
            monthlyResult: !!monthlyResult
        });

        // Interest rates
        const rates = {
            'infonavit-bajo': 3.76,
            'infonavit-medio': 6.5,
            'infonavit-alto': 10.45,
            'fovissste': 9.90,
            'hsbc': 10.45,
            'banamex': 11.75,
            'santander': 13.25
        };

        // Bank names
        const bankNames = {
            'infonavit-bajo': '🏠 INFONAVIT Bajo',
            'infonavit-medio': '🏠 INFONAVIT Medio',
            'infonavit-alto': '🏠 INFONAVIT Alto',
            'fovissste': '🏛️ FOVISSSTE',
            'hsbc': '🏦 HSBC',
            'banamex': '🏦 Banamex',
            'santander': '🏦 Santander'
        };

        // Format number function
        function formatNumber(num) {
            return new Intl.NumberFormat('es-MX', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(Math.round(num));
        }

        // Update slider display
        function updateSliderDisplay() {
            if (!priceInput || !slider || !percentDisplay || !moneyDisplay) return;
            
            const price = parseFloat(priceInput.value.replace(/[^\d]/g, '')) || 1750000;
            const percent = parseFloat(slider.value) || 5;
            const amount = price * (percent / 100);

            percentDisplay.textContent = `${percent}%`;
            moneyDisplay.textContent = `$${formatNumber(amount)}`;
            
            console.log(`Slider updated: ${percent}% = $${formatNumber(amount)}`);
        }

        // Calculate monthly payment
        function calculateMonthlyPayment(loanAmount, annualRate, years) {
            const monthlyRate = annualRate / 100 / 12;
            const numberOfPayments = years * 12;
            
            if (monthlyRate === 0) {
                return loanAmount / numberOfPayments;
            }
            
            const monthlyPayment = loanAmount * 
                (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
            
            return monthlyPayment;
        }

        // Main calculation function
        function calculate() {
            console.log('Starting calculation...');
            
            if (!priceInput || !slider || !yearsSelect || !bankSelect) {
                console.log('Missing required elements');
                return;
            }

            const propertyPrice = parseFloat(priceInput.value.replace(/[^\d]/g, '')) || 1750000;
            const downPaymentPercent = parseFloat(slider.value) || 5;
            const years = parseInt(yearsSelect.value) || 20;
            const bank = bankSelect.value || 'hsbc';

            console.log('Input values:', { propertyPrice, downPaymentPercent, years, bank });

            const downPaymentAmount = propertyPrice * (downPaymentPercent / 100);
            const loanAmount = propertyPrice - downPaymentAmount;
            const interestRate = rates[bank] || 10.45;
            const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, years);
            const totalPayment = monthlyPayment * years * 12;

            console.log('Calculated values:', { 
                loanAmount, 
                interestRate, 
                monthlyPayment: formatNumber(monthlyPayment) 
            });

            // Update results
            if (monthlyResult) {
                monthlyResult.textContent = `$${formatNumber(monthlyPayment)}`;
                console.log('Updated monthly result');
            }

            if (loanAmountResult) {
                loanAmountResult.textContent = `$${formatNumber(loanAmount)}`;
            }

            if (interestRateResult) {
                interestRateResult.textContent = `${interestRate}%`;
            }

            if (totalPaymentResult) {
                totalPaymentResult.textContent = `$${formatNumber(totalPayment)}`;
            }

            // Update comparison
            updateComparison(loanAmount, years);
        }

        // Update comparison cards
        function updateComparison(loanAmount, years) {
            if (!comparisonCards) return;

            const banks = ['infonavit-bajo', 'infonavit-medio', 'fovissste', 'hsbc', 'banamex'];
            comparisonCards.innerHTML = '';

            banks.forEach(bank => {
                const rate = rates[bank];
                const payment = calculateMonthlyPayment(loanAmount, rate, years);
                
                const card = document.createElement('div');
                card.className = 'comparison-card';
                card.innerHTML = `
                    <div class="comparison-name">${bankNames[bank]}</div>
                    <div class="comparison-payment">$${formatNumber(payment)}</div>
                `;
                comparisonCards.appendChild(card);
            });
        }

        // Add event listeners
        if (slider) {
            slider.addEventListener('input', function() {
                console.log('Slider input:', this.value);
                updateSliderDisplay();
            });
            
            slider.addEventListener('change', function() {
                console.log('Slider change:', this.value);
                calculate();
            });
        }

        if (calcButton) {
            calcButton.addEventListener('click', function() {
                console.log('Calculate button clicked');
                calculate();
            });
        }

        if (priceInput) {
            priceInput.addEventListener('input', function() {
                updateSliderDisplay();
            });
        }

        if (yearsSelect) {
            yearsSelect.addEventListener('change', calculate);
        }

        if (bankSelect) {
            bankSelect.addEventListener('change', calculate);
        }

        // Initial setup
        console.log('Running initial setup...');
        updateSliderDisplay();
        calculate();
    }

    // Initialize when DOM is ready
    if (document.getElementById('housePrice')) {
        console.log('Mortgage calculator elements found, initializing...');
        initMortgageCalculator();
    } else {
        console.log('Mortgage calculator elements not found');
    }

});