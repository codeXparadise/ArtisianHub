// Enhanced Authentication System for ArtisanHub
class EnhancedAuthSystem {
    constructor() {
        this.currentUser = null;
        this.db = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for database service to be ready
            if (window.databaseService) {
                await window.databaseService.initPromise;
                this.db = window.databaseService;
            }
            
            this.setupEventListeners();
            this.checkAuthState();
            this.setupPasswordToggles();
            this.setupFormValidation();
            this.isInitialized = true;
            
            console.log('🔐 Enhanced Auth System initialized');
        } catch (error) {
            console.error('Error initializing auth system:', error);
        }
    }

    setupEventListeners() {
        // Form toggles
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForm('register');
            });
        }
        
        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForm('login');
            });
        }

        if (loginTab) {
            loginTab.addEventListener('click', () => this.showForm('login'));
        }
        
        if (registerTab) {
            registerTab.addEventListener('click', () => this.showForm('register'));
        }

        // Form submissions
        const loginForm = document.getElementById('artist-login-form') || document.getElementById('user-login-form');
        const registerForm = document.getElementById('artist-register-form') || document.getElementById('user-register-form');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Social login buttons
        document.getElementById('google-login')?.addEventListener('click', () => this.handleSocialLogin('google'));
        document.getElementById('facebook-login')?.addEventListener('click', () => this.handleSocialLogin('facebook'));
    }

    showForm(formType) {
        // Handle different form layouts
        const loginSection = document.getElementById('artist-login-section') || document.getElementById('login-container');
        const registerSection = document.getElementById('artist-register-section') || document.getElementById('register-container');
        const loginToggle = document.getElementById('login-toggle') || document.getElementById('login-tab');
        const registerToggle = document.getElementById('register-toggle') || document.getElementById('register-tab');

        if (formType === 'login') {
            if (loginSection) loginSection.style.display = 'block';
            if (registerSection) registerSection.style.display = 'none';
            if (loginToggle) loginToggle.classList.add('active');
            if (registerToggle) registerToggle.classList.remove('active');
        } else {
            if (loginSection) loginSection.style.display = 'none';
            if (registerSection) registerSection.style.display = 'block';
            if (loginToggle) loginToggle.classList.remove('active');
            if (registerToggle) registerToggle.classList.add('active');
        }

        // Clear form errors
        this.clearFormErrors();
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email')?.trim();
        const password = formData.get('password');
        const remember = formData.get('remember');

        // Clear previous errors
        this.clearFormErrors();

        // Validate input
        if (!email || !password) {
            this.showFormError('Please fill in all fields');
            return;
        }

        // Show loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        submitButton.disabled = true;

        try {
            // Check localStorage first for demo purposes
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            let user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                // Try database if localStorage fails
                if (this.db) {
                    const userResult = await this.db.getUser(email);
                    if (userResult.success && userResult.data && userResult.data.password === password) {
                        user = userResult.data;
                    }
                }
            }

            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Set current user
            this.currentUser = user;

            // Save to storage
            if (remember) {
                localStorage.setItem('currentUser', JSON.stringify(user));
            } else {
                sessionStorage.setItem('currentUser', JSON.stringify(user));
            }

            // Use session manager if available
            if (window.sessionManager) {
                window.sessionManager.setUser(user, !!remember);
            }

            // Show success message
            this.showNotification('Login successful! Welcome back.', 'success');

            // Redirect based on user type
            setTimeout(() => {
                if (user.isArtisan || user.is_artisan) {
                    if (user.profileCompleted || user.profile_completed) {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'profile-setup.html';
                    }
                } else {
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '../index.html';
                    window.location.href = redirectUrl;
                }
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            this.showFormError(error.message);
        } finally {
            // Reset button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        
        // Get form data based on form type
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
                newsletter: formData.get('newsletter'),
                isArtisan: true
            };
        } else {
            userData = {
                fullName: formData.get('fullName')?.trim(),
                email: formData.get('email')?.trim(),
                phone: formData.get('phone')?.trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                terms: formData.get('terms'),
                newsletter: formData.get('newsletter'),
                isArtisan: false
            };
        }

        // Clear previous errors
        this.clearFormErrors();

        // Validate form
        if (!this.validateRegistrationForm(userData, isArtistForm)) {
            return;
        }

        // Show loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        submitButton.disabled = true;

        try {
            // Check if user already exists
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.find(u => u.email === userData.email)) {
                throw new Error('An account with this email already exists');
            }

            // Create user account
            const newUser = {
                id: this.generateId(),
                email: userData.email,
                password: userData.password, // In real app, this would be hashed
                fullName: isArtistForm ? `${userData.firstName} ${userData.lastName}` : userData.fullName,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                isArtisan: userData.isArtisan,
                craftSpecialty: userData.craftSpecialty,
                profileCompleted: !userData.isArtisan, // Customers don't need profile setup
                newsletter: !!userData.newsletter,
                created_at: new Date().toISOString()
            };

            // Save to localStorage
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            // Also try to save to database
            if (this.db) {
                await this.db.createUser(newUser);
            }

            // Set current user
            this.currentUser = newUser;
            localStorage.setItem('currentUser', JSON.stringify(newUser));

            // Use session manager if available
            if (window.sessionManager) {
                window.sessionManager.setUser(newUser, true);
            }

            // Show success message
            this.showNotification('Account created successfully! Welcome to ArtisanHub!', 'success');

            // Redirect based on user type
            setTimeout(() => {
                if (newUser.isArtisan) {
                    window.location.href = 'profile-setup.html';
                } else {
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '../index.html';
                    window.location.href = redirectUrl;
                }
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            this.showFormError(error.message);
        } finally {
            // Reset button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    validateRegistrationForm(data, isArtistForm) {
        let isValid = true;

        // Clear all errors first
        this.clearFormErrors();

        if (isArtistForm) {
            // Validate artist form
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
            // Validate user form
            if (!data.fullName || data.fullName.length < 2) {
                this.showFormError('Full name must be at least 2 characters');
                isValid = false;
            }
        }

        // Common validations
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

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async checkAuthState() {
        // Check for existing session
        const storedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                this.updateAuthUI();
            } catch (error) {
                console.error('Error parsing stored user:', error);
                this.logout();
            }
        }
    }

    updateAuthUI() {
        // Update authentication UI elements
        const authActions = document.getElementById('auth-actions');
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');

        if (this.currentUser) {
            // User is logged in
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (userName) userName.textContent = this.currentUser.fullName || this.currentUser.email;

            // Update auth actions if present
            if (authActions) {
                authActions.innerHTML = `
                    <div class="user-menu">
                        <button class="user-menu-toggle" id="user-menu-toggle">
                            <i class="fas fa-user"></i>
                            <span>${this.currentUser.fullName || this.currentUser.email}</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="user-dropdown" id="user-dropdown">
                            ${this.currentUser.isArtisan ? 
                                '<a href="dashboard.html" class="dropdown-item"><i class="fas fa-palette"></i> Dashboard</a>' : 
                                '<a href="become-artisan.html" class="dropdown-item"><i class="fas fa-palette"></i> Become Artisan</a>'
                            }
                            <a href="profile.html" class="dropdown-item"><i class="fas fa-user"></i> Profile</a>
                            <a href="orders.html" class="dropdown-item"><i class="fas fa-box"></i> Orders</a>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item logout-btn" onclick="enhancedAuthSystem.logout()">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                `;

                // Setup dropdown toggle
                const userMenuToggle = document.getElementById('user-menu-toggle');
                const userDropdown = document.getElementById('user-dropdown');
                
                if (userMenuToggle && userDropdown) {
                    userMenuToggle.addEventListener('click', (e) => {
                        e.stopPropagation();
                        userDropdown.classList.toggle('active');
                    });
                    
                    document.addEventListener('click', () => {
                        userDropdown.classList.remove('active');
                    });
                }
            }
        } else {
            // User is not logged in
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    setupPasswordToggles() {
        const toggles = document.querySelectorAll('.password-toggle');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
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
            });
        });
    }

    setupFormValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => this.validateEmail(input));
        });

        // Password strength validation
        const passwordInputs = document.querySelectorAll('input[name="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('input', () => this.checkPasswordStrength(input));
        });

        // Confirm password validation
        const confirmPasswordInputs = document.querySelectorAll('input[name="confirmPassword"]');
        confirmPasswordInputs.forEach(input => {
            input.addEventListener('input', () => this.validatePasswordMatch(input));
        });
    }

    validateEmail(input) {
        const email = input.value.trim();
        
        if (email && !this.isValidEmail(email)) {
            this.showFieldError(input, 'Please enter a valid email address');
            return false;
        } else {
            this.clearFieldError(input);
            return true;
        }
    }

    checkPasswordStrength(input) {
        const password = input.value;
        const strengthContainer = input.parentNode.parentNode.querySelector('.password-strength') || 
                                input.parentNode.querySelector('.password-strength');
        
        if (!strengthContainer) return;

        let strength = 0;
        let feedback = [];

        if (password.length >= 8) strength++;
        else if (password.length > 0) feedback.push('At least 8 characters');

        if (/[A-Z]/.test(password)) strength++;
        else if (password.length > 0) feedback.push('One uppercase letter');

        if (/[a-z]/.test(password)) strength++;
        else if (password.length > 0) feedback.push('One lowercase letter');

        if (/\d/.test(password)) strength++;
        else if (password.length > 0) feedback.push('One number');

        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
        else if (password.length > 0) feedback.push('One special character');

        if (password.length === 0) {
            strengthContainer.innerHTML = '';
            return;
        }

        const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['#ff4757', '#ff7675', '#fdcb6e', '#00b894', '#00cec9'];
        
        const level = Math.min(strength, 4);
        strengthContainer.innerHTML = `
            <div class="strength-indicator">
                <div class="strength-bar">
                    <div class="strength-fill" style="width: ${(strength / 5) * 100}%; background: ${strengthColors[level]};"></div>
                </div>
                <span style="color: ${strengthColors[level]}; font-size: 0.85rem;">${strengthLevels[level]}</span>
            </div>
        `;
        
        if (feedback.length > 0) {
            strengthContainer.innerHTML += `<small style="color: #666; font-size: 0.8rem;">Missing: ${feedback.join(', ')}</small>`;
        }
    }

    validatePasswordMatch(input) {
        const password = document.querySelector('input[name="password"]')?.value;
        const confirmPassword = input.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError(input, 'Passwords do not match');
            return false;
        } else {
            this.clearFieldError(input);
            return true;
        }
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.cssText = 'color: #e74c3c; font-size: 0.85rem; margin-top: 5px;';
        
        input.classList.add('error');
        input.parentNode.parentNode.appendChild(errorElement);
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const errorElement = input.parentNode.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
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

        const fieldErrors = document.querySelectorAll('.field-error');
        fieldErrors.forEach(error => error.remove());

        const errorInputs = document.querySelectorAll('.form-input.error');
        errorInputs.forEach(input => input.classList.remove('error'));
    }

    async handleSocialLogin(provider) {
        this.showNotification(`${provider} login coming soon!`, 'info');
    }

    async logout() {
        try {
            // Clear current user
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUser');
            
            // Use session manager if available
            if (window.sessionManager) {
                window.sessionManager.logout();
            }
            
            // Show success message
            this.showNotification('Logged out successfully', 'success');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Error during logout', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Use the global notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Create inline notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 400px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Public methods for other modules
    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    isArtisan() {
        return this.currentUser?.isArtisan || false;
    }
}

// Initialize enhanced auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedAuthSystem = new EnhancedAuthSystem();
    
    // Maintain backward compatibility
    window.authSystem = window.enhancedAuthSystem;
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedAuthSystem;
}