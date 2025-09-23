// Main Application Controller with Complete Database Integration
class AppController {
    constructor() {
        this.authService = null;
        this.cartService = null;
        this.databaseService = null;
        this.isInitialized = false;
        this.initPromise = this.init();
    }

    async init() {
        try {
            // Wait for services to be ready
            await this.waitForServices();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI
            this.initializeUI();
            
            // Load dynamic content
            await this.loadDynamicContent();
            
            this.isInitialized = true;
            console.log('🚀 App Controller initialized');
        } catch (error) {
            console.error('App Controller initialization failed:', error);
        }
    }

    async waitForServices() {
        return new Promise((resolve) => {
            const checkServices = () => {
                if (window.authService && window.cartService && window.databaseService) {
                    this.authService = window.authService;
                    this.cartService = window.cartService;
                    this.databaseService = window.databaseService;
                    resolve();
                } else {
                    setTimeout(checkServices, 100);
                }
            };
            checkServices();
        });
    }

    setupEventListeners() {
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'user-login-form' || e.target.id === 'artist-login-form') {
                this.handleLogin(e);
            } else if (e.target.id === 'user-register-form' || e.target.id === 'artist-register-form') {
                this.handleRegister(e);
            } else if (e.target.id === 'product-upload-form') {
                this.handleProductUpload(e);
            }
        });

        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.id === 'login-tab') {
                this.showForm('login');
            } else if (e.target.id === 'register-tab') {
                this.showForm('register');
            } else if (e.target.classList.contains('logout-btn')) {
                this.handleLogout();
            }
        });

        // Password toggles
        document.addEventListener('click', (e) => {
            if (e.target.closest('.password-toggle')) {
                this.togglePassword(e.target.closest('.password-toggle'));
            }
        });

        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.closest('#nav-toggle')) {
                this.toggleMobileMenu();
            }
        });
    }

    showForm(formType) {
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');

        if (formType === 'login') {
            if (loginContainer) loginContainer.style.display = 'block';
            if (registerContainer) registerContainer.style.display = 'none';
            if (loginTab) loginTab.classList.add('active');
            if (registerTab) registerTab.classList.remove('active');
        } else {
            if (loginContainer) loginContainer.style.display = 'none';
            if (registerContainer) registerContainer.style.display = 'block';
            if (loginTab) loginTab.classList.remove('active');
            if (registerTab) registerTab.classList.add('active');
        }

        this.clearFormErrors();
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email')?.trim();
        const password = formData.get('password');

        if (!email || !password) {
            this.showFormError('Please fill in all fields');
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitButton, 'Signing in...');

        try {
            const result = await this.authService.signIn(email, password);

            if (!result.success) {
                throw new Error(result.error);
            }

            this.showNotification('Login successful! Welcome back.', 'success');

            // Redirect based on user type
            setTimeout(() => {
                const user = this.authService.getCurrentUser();
                if (user?.is_artisan) {
                    window.location.href = user.profile_completed ? 'dashboard.html' : 'profile-setup.html';
                } else {
                    window.location.href = '../index.html';
                }
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            this.showFormError(error.message);
        } finally {
            this.resetButton(submitButton);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const isArtistForm = event.target.id === 'artist-register-form';
        
        let userData;
        if (isArtistForm) {
            userData = {
                firstName: formData.get('firstName')?.trim(),
                lastName: formData.get('lastName')?.trim(),
                email: formData.get('email')?.trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                craftSpecialty: formData.get('craftSpecialty'),
                terms: formData.get('terms'),
                isArtisan: true,
                fullName: `${formData.get('firstName')?.trim()} ${formData.get('lastName')?.trim()}`
            };
        } else {
            userData = {
                fullName: formData.get('fullName')?.trim(),
                email: formData.get('email')?.trim(),
                phone: formData.get('phone')?.trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                terms: formData.get('terms'),
                isArtisan: false
            };
        }

        if (!this.validateRegistrationForm(userData, isArtistForm)) {
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitButton, 'Creating account...');

        try {
            const result = await this.authService.signUp(userData.email, userData.password, userData);

            if (!result.success) {
                throw new Error(result.error);
            }

            this.showNotification('Account created successfully! Welcome to ArtisanHub!', 'success');

            // Redirect based on user type
            setTimeout(() => {
                if (userData.isArtisan) {
                    window.location.href = 'profile-setup.html';
                } else {
                    window.location.href = '../index.html';
                }
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            this.showFormError(error.message);
        } finally {
            this.resetButton(submitButton);
        }
    }

    async handleProductUpload(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const currentUser = this.authService.getCurrentUser();
        
        if (!currentUser?.is_artisan) {
            this.showNotification('Only artisans can upload products', 'error');
            return;
        }

        // Get artisan data
        const artisanResult = await this.databaseService.getArtisan(currentUser.id);
        if (!artisanResult.success || !artisanResult.data) {
            this.showNotification('Artisan profile not found', 'error');
            return;
        }

        const productData = {
            artisan_id: artisanResult.data.id,
            title: formData.get('title')?.trim(),
            description: formData.get('description')?.trim(),
            price: parseFloat(formData.get('price')),
            category: formData.get('category'),
            materials: formData.get('materials')?.trim(),
            dimensions: formData.get('dimensions')?.trim(),
            weight: formData.get('weight')?.trim(),
            care_instructions: formData.get('care')?.trim(),
            stock_quantity: parseInt(formData.get('quantity')) || 1,
            images: [], // Will be populated with uploaded images
            status: 'active'
        };

        const submitButton = event.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitButton, 'Publishing...');

        try {
            const result = await this.databaseService.createProduct(productData);

            if (!result.success) {
                throw new Error(result.error);
            }

            this.showNotification('Product published successfully! 🎉', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Product upload error:', error);
            this.showNotification(error.message || 'Failed to publish product', 'error');
        } finally {
            this.resetButton(submitButton);
        }
    }

    validateRegistrationForm(data, isArtistForm) {
        this.clearFormErrors();
        let isValid = true;

        if (isArtistForm) {
            if (!data.firstName || data.firstName.length < 2) {
                this.showFormError('First name must be at least 2 characters');
                isValid = false;
            }
            if (!data.lastName || data.lastName.length < 2) {
                this.showFormError('Last name must be at least 2 characters');
                isValid = false;
            }
            if (!data.craftSpecialty) {
                this.showFormError('Please select your primary craft specialty');
                isValid = false;
            }
        } else {
            if (!data.fullName || data.fullName.length < 2) {
                this.showFormError('Full name must be at least 2 characters');
                isValid = false;
            }
        }

        if (!this.isValidEmail(data.email)) {
            this.showFormError('Please enter a valid email address');
            isValid = false;
        }

        if (!data.password || data.password.length < 8) {
            this.showFormError('Password must be at least 8 characters long');
            isValid = false;
        }

        if (data.password !== data.confirmPassword) {
            this.showFormError('Passwords do not match');
            isValid = false;
        }

        if (!data.terms) {
            this.showFormError('You must agree to the Terms of Service');
            isValid = false;
        }

        return isValid;
    }

    async handleLogout() {
        try {
            await this.authService.signOut();
            this.showNotification('Logged out successfully', 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Error during logout', 'error');
        }
    }

    initializeUI() {
        // Setup animations
        this.setupScrollAnimations();
        
        // Initialize mobile menu
        this.setupMobileMenu();
    }

    async loadDynamicContent() {
        try {
            // Load products for marketplace and home page
            await this.loadProducts();
            
        } catch (error) {
            console.error('Error loading dynamic content:', error);
        }
    }

    async loadProducts() {
        const productsGrid = document.getElementById('featured-products-grid') || 
                           document.getElementById('products-grid');
        
        if (!productsGrid) return;

        try {
            // Show loading state
            productsGrid.innerHTML = `
                <div class="loading-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #8B4513;"></i>
                    <p style="margin-top: 1rem; color: #666;">Loading products...</p>
                </div>
            `;

            const result = await this.databaseService.getProducts({ 
                status: 'active',
                limit: 8
            });

            if (result.success && result.data.length > 0) {
                this.renderProducts(result.data, productsGrid);
            } else {
                productsGrid.innerHTML = `
                    <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                        <i class="fas fa-box-open" style="font-size: 2rem; color: #bdc3c7;"></i>
                        <p style="margin-top: 1rem; color: #7f8c8d;">No products available yet.</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error loading products:', error);
            productsGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #e74c3c;"></i>
                    <p style="margin-top: 1rem; color: #e74c3c;">Error loading products.</p>
                </div>
            `;
        }
    }

    renderProducts(products, container) {
        container.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product__image">
                    <img src="${product.images?.[0] || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'}" 
                         alt="${product.title}" loading="lazy">
                    <div class="product__actions">
                        <button class="btn-icon wishlist-btn" data-product-id="${product.id}">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="btn-icon quick-view-btn" data-product-id="${product.id}">
                            <i class="far fa-eye"></i>
                        </button>
                    </div>
                    ${product.featured ? '<span class="product__badge">Featured</span>' : ''}
                </div>
                <div class="product__info">
                    <div class="product__category">${this.formatCategory(product.category)}</div>
                    <h3 class="product__title">${product.title}</h3>
                    <p class="product__artisan">by ${product.artisans?.business_name || 'Unknown Artisan'}</p>
                    <div class="product__rating">
                        <div class="stars">
                            ${this.generateStars(5)}
                        </div>
                        <span class="rating-count">(${product.views || 0})</span>
                    </div>
                    <div class="product__price">
                        <span class="price-current">$${(product.price || 0).toFixed(2)}</span>
                    </div>
                    <button class="btn btn--primary btn--full add-to-cart-btn" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatCategory(category) {
        const categoryMap = {
            'pottery': 'Pottery',
            'textiles': 'Textiles',
            'woodwork': 'Woodwork',
            'jewelry': 'Jewelry',
            'paintings': 'Art',
            'leather': 'Leather'
        };
        return categoryMap[category] || (category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Uncategorized');
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        for (let i = fullStars; i < 5; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        const animatedElements = document.querySelectorAll('.category-card, .product-card, .artisan-card, .feature');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    setupMobileMenu() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('show');
                const icon = navToggle.querySelector('i');
                if (navMenu.classList.contains('show')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        }
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        
        if (navMenu && navToggle) {
            navMenu.classList.toggle('show');
            const icon = navToggle.querySelector('i');
            if (navMenu.classList.contains('show')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    }

    togglePassword(toggle) {
        const input = toggle.parentNode.querySelector('input');
        const icon = toggle.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    setButtonLoading(button, text) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        button.disabled = true;
    }

    resetButton(button) {
        button.innerHTML = button.dataset.originalText || button.innerHTML;
        button.disabled = false;
    }

    showFormError(message) {
        let errorElement = document.querySelector('.form-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            errorElement.style.cssText = `
                background: #ffebee;
                color: #c62828;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 20px;
                border-left: 4px solid #e74c3c;
                font-size: 0.9rem;
                display: block;
            `;
            
            const activeForm = document.querySelector('form:not([style*="none"])');
            if (activeForm) {
                activeForm.insertBefore(errorElement, activeForm.firstChild);
            }
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearFormErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Initialize and export
window.appController = new AppController();
export default window.appController;