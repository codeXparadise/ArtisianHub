// Main Application Controller
class AppController {
    constructor() {
        this.authService = null;
        this.cartService = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for services to initialize
            await this.waitForServices();
            
            // Setup global event listeners
            this.setupGlobalEvents();
            
            // Initialize UI components
            this.initializeUI();
            
            // Setup scroll animations
            this.setupScrollAnimations();
            
            this.isInitialized = true;
            console.log('🚀 App Controller initialized');
        } catch (error) {
            console.error('App Controller initialization failed:', error);
        }
    }

    async waitForServices() {
        return new Promise((resolve) => {
            const checkServices = () => {
                if (window.authService && window.cartService) {
                    this.authService = window.authService;
                    this.cartService = window.cartService;
                    resolve();
                } else {
                    setTimeout(checkServices, 100);
                }
            };
            checkServices();
        });
    }

    setupGlobalEvents() {
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'user-login-form' || e.target.id === 'artist-login-form') {
                this.handleLogin(e);
            } else if (e.target.id === 'user-register-form' || e.target.id === 'artist-register-form') {
                this.handleRegister(e);
            }
        });

        // Button clicks
        document.addEventListener('click', (e) => {
            // Auth tab switching
            if (e.target.id === 'login-tab' || e.target.classList.contains('show-login')) {
                this.showAuthForm('login');
            } else if (e.target.id === 'register-tab' || e.target.classList.contains('show-register')) {
                this.showAuthForm('register');
            }
            
            // Navigation
            if (e.target.closest('#nav-toggle')) {
                this.toggleMobileMenu();
            }
            
            // Password toggles
            if (e.target.closest('.password-toggle')) {
                this.togglePassword(e.target.closest('.password-toggle'));
            }
        });

        // Listen for auth state changes
        window.addEventListener('authStateChange', (e) => {
            this.handleAuthStateChange(e.detail);
        });

        // Window scroll for header effects
        window.addEventListener('scroll', () => this.handleScroll());
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email')?.trim();
        const password = formData.get('password');
        const remember = formData.get('remember');

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
                    window.location.href = user.profile_completed ? 'pages/dashboard.html' : 'pages/profile-setup.html';
                } else {
                    window.location.href = 'index.html';
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
                fullName: `${formData.get('firstName')} ${formData.get('lastName')}`,
                email: formData.get('email')?.trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                craftSpecialty: formData.get('craftSpecialty'),
                isArtisan: true
            };
        } else {
            userData = {
                fullName: formData.get('fullName')?.trim(),
                email: formData.get('email')?.trim(),
                phone: formData.get('phone')?.trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                isArtisan: false
            };
        }

        if (!this.validateRegistrationForm(userData)) {
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
                    window.location.href = 'pages/profile-setup.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            this.showFormError(error.message);
        } finally {
            this.resetButton(submitButton);
        }
    }

    validateRegistrationForm(data) {
        this.clearFormErrors();
        let isValid = true;

        if (!data.fullName || data.fullName.length < 2) {
            this.showFormError('Full name must be at least 2 characters');
            isValid = false;
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

        return isValid;
    }

    showAuthForm(formType) {
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');

        if (formType === 'login') {
            if (loginContainer) {
                loginContainer.style.display = 'block';
                loginContainer.style.animation = 'fadeInLeft 0.3s ease';
            }
            if (registerContainer) {
                registerContainer.style.display = 'none';
            }
            if (loginTab) loginTab.classList.add('active');
            if (registerTab) registerTab.classList.remove('active');
        } else {
            if (loginContainer) {
                loginContainer.style.display = 'none';
            }
            if (registerContainer) {
                registerContainer.style.display = 'block';
                registerContainer.style.animation = 'fadeInRight 0.3s ease';
            }
            if (loginTab) loginTab.classList.remove('active');
            if (registerTab) registerTab.classList.add('active');
        }

        this.clearFormErrors();
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

    handleScroll() {
        const header = document.querySelector('.header');
        const scrollTop = window.pageYOffset;
        
        if (header) {
            if (scrollTop > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.backdropFilter = 'blur(10px)';
                header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            } else {
                header.style.background = 'var(--white)';
                header.style.backdropFilter = 'none';
                header.style.boxShadow = 'var(--shadow-sm)';
            }
        }
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);
        
        const animatedElements = document.querySelectorAll('.category-card, .product-card, .artisan-card, .feature');
        animatedElements.forEach(el => {
            el.classList.add('scroll-animate');
            observer.observe(el);
        });
    }

    initializeUI() {
        // Update auth UI
        if (this.authService) {
            this.authService.updateAuthUI();
        }
        
        // Update cart UI
        if (this.cartService) {
            this.cartService.updateCartUI();
        }
    }

    handleAuthStateChange(detail) {
        if (detail.action === 'login') {
            this.showNotification(`Welcome back, ${detail.user.full_name || detail.user.email}!`, 'success');
        } else if (detail.action === 'logout') {
            this.showNotification('Logged out successfully', 'info');
        }
    }

    setButtonLoading(button, text) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `<div class="loading-spinner"></div> ${text}`;
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
            errorElement.className = 'form-error error-message';
            
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
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Initialize app controller
document.addEventListener('DOMContentLoaded', () => {
    window.appController = new AppController();
    
    // Make showNotification globally available
    window.showNotification = (message, type) => {
        if (window.appController) {
            window.appController.showNotification(message, type);
        }
    };
});

// Add enhanced animations CSS
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes fadeInLeft {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeInRight {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: var(--space-xs);
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
        opacity: 0.7;
    }
    
    .notification-close:hover {
        opacity: 1;
        background: rgba(0,0,0,0.1);
    }
`;
document.head.appendChild(animationStyles);

export default AppController;