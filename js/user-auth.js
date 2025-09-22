// User Authentication System for ArtisanHub customers
class UserAuthSystem {
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
            
            console.log('👤 User Auth System initialized');
        } catch (error) {
            console.error('Error initializing user auth system:', error);
        }
    }

    setupEventListeners() {
        // Tab switching
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        
        if (loginTab) {
            loginTab.addEventListener('click', () => this.showForm('login'));
        }
        
        if (registerTab) {
            registerTab.addEventListener('click', () => this.showForm('register'));
        }
        
        // Form submissions
        const loginForm = document.getElementById('user-login-form');
        const registerForm = document.getElementById('user-register-form');

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
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');

        if (formType === 'login') {
            loginContainer.style.display = 'block';
            registerContainer.style.display = 'none';
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
        } else {
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
            loginTab.classList.remove('active');
            registerTab.classList.add('active');
        }

        // Clear any previous errors
        this.clearFormErrors();
    }

    async checkAuthState() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        if (currentUser) {
            try {
                this.currentUser = JSON.parse(currentUser);
                console.log('👤 User already logged in:', this.currentUser.fullName || this.currentUser.email);
            } catch (error) {
                console.error('Error parsing current user:', error);
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentUser');
            }
        }
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
            // Get user from database
            const userResult = await this.db.getUser(email);
            
            if (!userResult.success || !userResult.data) {
                throw new Error('Invalid email or password');
            }

            const user = userResult.data;

            // Verify password (in real app, this would be hashed)
            if (user.password !== password) {
                throw new Error('Invalid email or password');
            }

            // Set current user
            this.currentUser = user;

            // Use session manager if available, otherwise fallback to direct storage
            if (window.sessionManager) {
                window.sessionManager.setUser(user, !!remember);
            } else {
                // Fallback to direct storage
                if (remember) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                } else {
                    sessionStorage.setItem('currentUser', JSON.stringify(user));
                }
            }

            // Show success message
            this.showNotification('Welcome back! Login successful.', 'success');

            // Redirect to previous page or home
            setTimeout(() => {
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '../index.html';
                window.location.href = redirectUrl;
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
        const fullName = formData.get('fullName')?.trim();
        const email = formData.get('email')?.trim();
        const phone = formData.get('phone')?.trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const newsletter = formData.get('newsletter');
        const terms = formData.get('terms');

        // Clear previous errors
        this.clearFormErrors();

        // Validate input
        if (!fullName || !email || !password || !confirmPassword) {
            this.showFormError('Please fill in all required fields');
            return;
        }

        if (!terms) {
            this.showFormError('Please agree to the terms of service');
            return;
        }

        if (password !== confirmPassword) {
            this.showFormError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            this.showFormError('Password must be at least 8 characters long');
            return;
        }

        // Show loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        submitButton.disabled = true;

        try {
            // Check if user already exists
            const existingUserResult = await this.db.getUser(email);
            if (existingUserResult.success && existingUserResult.data) {
                throw new Error('An account with this email already exists');
            }

            // Create user account
            const userData = {
                fullName,
                email,
                phone,
                password, // In real app, this would be hashed
                isArtisan: false,
                profileCompleted: true,
                newsletter: !!newsletter
            };

            const userResult = await this.db.createUser(userData);
            if (!userResult.success) {
                throw new Error(userResult.error || 'Failed to create user account');
            }

            // Set current user
            this.currentUser = userResult.data;

            // Use session manager if available
            if (window.sessionManager) {
                window.sessionManager.setUser(this.currentUser, true);
            } else {
                // Fallback to direct storage
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }

            // Show success message
            this.showNotification('Account created successfully! Welcome to ArtisanHub.', 'success');

            // Send welcome email (placeholder)
            if (newsletter) {
                console.log('📧 User subscribed to newsletter');
            }

            // Redirect to previous page or home
            setTimeout(() => {
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '../index.html';
                window.location.href = redirectUrl;
            }, 1500);

        } catch (error) {
            console.error('Registration error:', error);
            this.showFormError(error.message);
        } finally {
            // Reset button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    async handleSocialLogin(provider) {
        try {
            this.showNotification(`${provider} login coming soon!`, 'info');
            
            // In a real implementation, this would handle OAuth flow
            console.log(`Initiating ${provider} login...`);
            
        } catch (error) {
            console.error(`${provider} login error:`, error);
            this.showNotification(`Error with ${provider} login`, 'error');
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            this.showFieldError(input, 'Please enter a valid email address');
            return false;
        } else {
            this.clearFieldError(input);
            return true;
        }
    }

    checkPasswordStrength(input) {
        const password = input.value;
        const strengthIndicator = input.parentNode.parentNode.querySelector('.password-strength');
        
        if (!strengthIndicator) return;

        let strength = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) strength++;
        else if (password.length > 0) feedback.push('At least 8 characters');

        // Uppercase check
        if (/[A-Z]/.test(password)) strength++;
        else if (password.length > 0) feedback.push('One uppercase letter');

        // Lowercase check
        if (/[a-z]/.test(password)) strength++;
        else if (password.length > 0) feedback.push('One lowercase letter');

        // Number check
        if (/\d/.test(password)) strength++;
        else if (password.length > 0) feedback.push('One number');

        // Special character check
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
        else if (password.length > 0) feedback.push('One special character');

        if (password.length === 0) {
            strengthIndicator.innerHTML = '';
            return;
        }

        // Update strength indicator
        const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['#ff4757', '#ff7675', '#fdcb6e', '#00b894', '#00cec9'];
        
        const level = Math.min(strength, 4);
        strengthIndicator.innerHTML = `Password Strength: <span style="color: ${strengthColors[level]}">${strengthLevels[level]}</span>`;
        
        if (feedback.length > 0) {
            strengthIndicator.innerHTML += `<br><small style="color: #666;">Missing: ${feedback.join(', ')}</small>`;
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
        const errorElement = document.querySelector('.form-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearFormErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.style.display = 'none';
        });

        // Clear field errors
        const fieldErrors = document.querySelectorAll('.field-error');
        fieldErrors.forEach(error => error.remove());

        const errorInputs = document.querySelectorAll('.form-input.error');
        errorInputs.forEach(input => input.classList.remove('error'));
    }

    showNotification(message, type = 'info') {
        // Use the global notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback to simple alert
            alert(message);
        }
    }

    // Public methods for other modules
    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    async logout() {
        try {
            // Clear current user
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUser');
            
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
}

// Initialize user auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userAuth = new UserAuthSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserAuthSystem;
}