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

    // Mortgage Calculator Functionality
    const mortgageCalculator = {
        init() {
            this.bindEvents();
            this.updateDownPaymentDisplay();
            this.calculate(); // Initial calculation
        },

        bindEvents() {
            const calculateBtn = document.getElementById('calculateBtn');
            const downPaymentSlider = document.getElementById('downPayment');
            const propertyPrice = document.getElementById('propertyPrice');
            const loanTerm = document.getElementById('loanTerm');
            const creditType = document.getElementById('creditType');

            if (calculateBtn) {
                calculateBtn.addEventListener('click', () => this.calculate());
            }

            if (downPaymentSlider) {
                downPaymentSlider.addEventListener('input', () => this.updateDownPaymentDisplay());
            }

            // Auto-calculate on input changes
            [propertyPrice, loanTerm, creditType].forEach(element => {
                if (element) {
                    element.addEventListener('change', () => this.calculate());
                }
            });

            if (propertyPrice) {
                propertyPrice.addEventListener('input', () => {
                    this.updateDownPaymentDisplay();
                    this.calculate();
                });
            }
        },

        updateDownPaymentDisplay() {
            const propertyPrice = parseFloat(document.getElementById('propertyPrice').value) || 0;
            const downPaymentPercent = parseFloat(document.getElementById('downPayment').value) || 20;
            const downPaymentAmount = propertyPrice * (downPaymentPercent / 100);

            document.getElementById('downPaymentDisplay').textContent = `${downPaymentPercent}%`;
            document.getElementById('downPaymentAmount').textContent = 
                `$${this.formatNumber(downPaymentAmount)} MXN`;
        },

        getInterestRate(creditType) {
            const rates = {
                'infonavit-bajo': 3.76,
                'infonavit-medio': 6.5,
                'infonavit-alto': 10.45,
                'fovissste': 9.90,
                'hsbc': 10.45,
                'banamex': 11.75,
                'santander': 13.25,
                'promedio': 11.65
            };
            return rates[creditType] || 11.65;
        },

        getCreditTypeName(creditType) {
            const names = {
                'infonavit-bajo': 'INFONAVIT (Ingresos bajos)',
                'infonavit-medio': 'INFONAVIT (Ingresos medios)',
                'infonavit-alto': 'INFONAVIT (Ingresos altos)',
                'fovissste': 'FOVISSSTE',
                'hsbc': 'HSBC',
                'banamex': 'Banamex',
                'santander': 'Santander',
                'promedio': 'Promedio Mercado'
            };
            return names[creditType] || 'Banco';
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
            const propertyPrice = parseFloat(document.getElementById('propertyPrice').value) || 0;
            const downPaymentPercent = parseFloat(document.getElementById('downPayment').value) || 20;
            const loanTermYears = parseInt(document.getElementById('loanTerm').value) || 20;
            const creditType = document.getElementById('creditType').value;

            if (propertyPrice <= 0) return;

            const downPaymentAmount = propertyPrice * (downPaymentPercent / 100);
            const loanAmount = propertyPrice - downPaymentAmount;
            const interestRate = this.getInterestRate(creditType);
            const monthlyPayment = this.calculateMonthlyPayment(loanAmount, interestRate, loanTermYears);
            const totalPayment = monthlyPayment * loanTermYears * 12;
            const totalInterest = totalPayment - loanAmount;

            // Update main results
            document.getElementById('monthlyPayment').textContent = `$${this.formatNumber(monthlyPayment)}`;
            document.getElementById('loanAmount').textContent = `$${this.formatNumber(loanAmount)}`;
            document.getElementById('downPaymentResult').textContent = `$${this.formatNumber(downPaymentAmount)}`;
            document.getElementById('interestRate').textContent = `${interestRate}%`;
            document.getElementById('totalPayment').textContent = `$${this.formatNumber(totalPayment)}`;
            document.getElementById('totalInterest').textContent = `$${this.formatNumber(totalInterest)}`;

            // Generate comparison
            this.generateComparison(loanAmount, loanTermYears);
        },

        generateComparison(loanAmount, years) {
            const comparisonGrid = document.getElementById('comparisonGrid');
            if (!comparisonGrid) return;

            const creditTypes = [
                'infonavit-bajo',
                'infonavit-medio', 
                'fovissste',
                'hsbc',
                'promedio'
            ];

            comparisonGrid.innerHTML = '';

            creditTypes.forEach(type => {
                const rate = this.getInterestRate(type);
                const payment = this.calculateMonthlyPayment(loanAmount, rate, years);
                const name = this.getCreditTypeName(type);

                const comparisonItem = document.createElement('div');
                comparisonItem.className = 'comparison-item';
                comparisonItem.innerHTML = `
                    <span class="comparison-name">${name}</span>
                    <span class="comparison-payment">$${this.formatNumber(payment)}</span>
                `;
                comparisonGrid.appendChild(comparisonItem);
            });
        },

        formatNumber(num) {
            return new Intl.NumberFormat('es-MX', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(Math.round(num));
        }
    };

    // Initialize mortgage calculator if elements exist
    if (document.getElementById('calculateBtn')) {
        mortgageCalculator.init();
    }

});