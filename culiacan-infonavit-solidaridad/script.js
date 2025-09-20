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

    // Gallery image click handler
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

    // Modern Mortgage Calculator Functionality
    const modernCalculator = {
        init() {
            this.bindEvents();
            this.updateSliderDisplay();
            this.calculate(); // Initial calculation
        },

        bindEvents() {
            const slider = document.getElementById('downPaymentSlider');
            const priceInput = document.getElementById('housePrice');
            const loanYears = document.getElementById('loanYears');
            const bankType = document.getElementById('bankType');
            const calcButton = document.getElementById('calculateButton');

            // Button click event
            if (calcButton) {
                calcButton.addEventListener('click', () => {
                    this.calculate();
                    this.showCalculatingAnimation();
                });
            }

            // Slider events with better handling
            if (slider) {
                slider.addEventListener('input', (e) => {
                    console.log('Slider moved to:', e.target.value);
                    this.updateSliderDisplay();
                });
                
                slider.addEventListener('change', () => {
                    this.calculate();
                });
            }

            // Price input events
            if (priceInput) {
                priceInput.addEventListener('input', (e) => {
                    this.formatPriceInput(e.target);
                    this.updateSliderDisplay();
                });
                
                priceInput.addEventListener('blur', () => {
                    this.calculate();
                });
            }

            // Select change events
            if (loanYears) {
                loanYears.addEventListener('change', () => this.calculate());
            }

            if (bankType) {
                bankType.addEventListener('change', () => this.calculate());
            }
        },

        showCalculatingAnimation() {
            const button = document.getElementById('calculateButton');
            if (button) {
                const originalText = button.innerHTML;
                button.innerHTML = '<span class="calc-icon">⏳</span><span>Calculando...</span>';
                button.disabled = true;
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                }, 1000);
            }
        },

        formatPriceInput(input) {
            let value = input.value.replace(/[^\d]/g, '');
            if (value) {
                value = parseInt(value).toLocaleString('es-MX');
                input.value = value;
            }
        },

        updateSliderDisplay() {
            const priceInput = document.getElementById('housePrice');
            const slider = document.getElementById('downPaymentSlider');
            const percentSpan = document.getElementById('downPaymentPercent');
            const moneySpan = document.getElementById('downPaymentMoney');

            if (!priceInput || !slider || !percentSpan || !moneySpan) return;

            const price = parseFloat(priceInput.value.replace(/[^\d]/g, '')) || 0;
            const percent = parseFloat(slider.value) || 5;
            const amount = price * (percent / 100);

            percentSpan.textContent = `${percent}%`;
            moneySpan.textContent = `$${this.formatNumber(amount)}`;
        },

        getInterestRate(bankType) {
            const rates = {
                'infonavit-bajo': 3.76,
                'infonavit-medio': 6.5,
                'infonavit-alto': 10.45,
                'fovissste': 9.90,
                'hsbc': 10.45,
                'banamex': 11.75,
                'santander': 13.25
            };
            return rates[bankType] || 10.45;
        },

        getBankName(bankType) {
            const names = {
                'infonavit-bajo': '🏠 INFONAVIT Bajo',
                'infonavit-medio': '🏠 INFONAVIT Medio',
                'infonavit-alto': '🏠 INFONAVIT Alto',
                'fovissste': '🏛️ FOVISSSTE',
                'hsbc': '🏦 HSBC',
                'banamex': '🏦 Banamex',
                'santander': '🏦 Santander'
            };
            return names[bankType] || '🏦 Banco';
        },

        calculateMonthlyPayment(loanAmount, annualRate, years) {
            const monthlyRate = annualRate / 100 / 12;
            const numberOfPayments = years * 12;
            
            if (monthlyRate === 0) {
                return loanAmount / numberOfPayments;
            }
            
            const monthlyPayment = loanAmount * 
                (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
            
            return monthlyPayment;
        },

        calculate() {
            const priceInput = document.getElementById('housePrice');
            const slider = document.getElementById('downPaymentSlider');
            const loanYears = document.getElementById('loanYears');
            const bankType = document.getElementById('bankType');

            if (!priceInput || !slider || !loanYears || !bankType) return;

            const propertyPrice = parseFloat(priceInput.value.replace(/[^\d]/g, '')) || 0;
            const downPaymentPercent = parseFloat(slider.value) || 5;
            const years = parseInt(loanYears.value) || 20;
            const bank = bankType.value;

            if (propertyPrice <= 0) return;

            const downPaymentAmount = propertyPrice * (downPaymentPercent / 100);
            const loanAmount = propertyPrice - downPaymentAmount;
            const interestRate = this.getInterestRate(bank);
            const monthlyPayment = this.calculateMonthlyPayment(loanAmount, interestRate, years);
            const totalPayment = monthlyPayment * years * 12;

            // Update main result
            const monthlyResult = document.getElementById('monthlyResult');
            if (monthlyResult) {
                monthlyResult.textContent = `$${this.formatNumber(monthlyPayment)}`;
            }

            // Update detail cards
            const loanAmountResult = document.getElementById('loanAmountResult');
            const interestRateResult = document.getElementById('interestRateResult');
            const totalPaymentResult = document.getElementById('totalPaymentResult');

            if (loanAmountResult) loanAmountResult.textContent = `$${this.formatNumber(loanAmount)}`;
            if (interestRateResult) interestRateResult.textContent = `${interestRate}%`;
            if (totalPaymentResult) totalPaymentResult.textContent = `$${this.formatNumber(totalPayment)}`;

            // Generate comparison
            this.generateComparison(loanAmount, years);
        },

        generateComparison(loanAmount, years) {
            const comparisonCards = document.getElementById('comparisonCards');
            if (!comparisonCards) return;

            const banks = [
                'infonavit-bajo',
                'infonavit-medio',
                'fovissste',
                'hsbc',
                'banamex'
            ];

            comparisonCards.innerHTML = '';

            let bestPayment = Infinity;
            let bestIndex = 0;

            const payments = banks.map((bank, index) => {
                const rate = this.getInterestRate(bank);
                const payment = this.calculateMonthlyPayment(loanAmount, rate, years);
                if (payment < bestPayment) {
                    bestPayment = payment;
                    bestIndex = index;
                }
                return { bank, payment, rate };
            });

            payments.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = `comparison-card ${index === bestIndex ? 'best' : ''}`;
                card.innerHTML = `
                    <div class="comparison-name">${this.getBankName(item.bank)}</div>
                    <div class="comparison-payment">$${this.formatNumber(item.payment)}</div>
                `;
                comparisonCards.appendChild(card);
            });
        },

        formatNumber(num) {
            return new Intl.NumberFormat('es-MX', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(Math.round(num));
        }
    };

    // Initialize modern calculator if elements exist
    if (document.getElementById('housePrice')) {
        modernCalculator.init();
    }

});