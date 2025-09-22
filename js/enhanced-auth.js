// Enhanced Authentication System for ArtisanHub with Supabase integration
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
        
        if (showRegister) {
            showRegister.addEventListener('click', () => this.showForm('register'));
        }
        
        if (showLogin) {
            showLogin.addEventListener('click', () => this.showForm('login'));
        }

        // Header auth buttons
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showForm('login'));
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showForm('register'));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Form submissions
        const loginForm = document.getElementById('artist-login-form');
        const registerForm = document.getElementById('artist-register-form');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    async checkAuthState() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                this.currentUser = JSON.parse(currentUser);
                this.updateAuthUI();
            } catch (error) {
                console.error('Error parsing current user:', error);
                localStorage.removeItem('currentUser');
            }
        }
    }

    showForm(formType) {
        const loginSection = document.getElementById('artist-login-section');
        const registerSection = document.getElementById('artist-register-section');
        const loginToggle = document.getElementById('login-toggle');
        const registerToggle = document.getElementById('register-toggle');

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
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email')?.trim();
        const password = formData.get('password');

        // Clear previous errors
        this.clearFormErrors();

        // Validate input
        if (!email || !password) {
            this.showFormError('Please fill in all fields');
            return;
        }

        // Show loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Signing in...';
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

            // Check if user is an artisan
            if (!user.is_artisan) {
                throw new Error('This login is for artisans only. Please use the regular login.');
            }

            // Get artisan profile if exists
            let artisanProfile = null;
            if (user.is_artisan) {
                const artisanResult = await this.db.getArtisan(user.id);
                if (artisanResult.success && artisanResult.data) {
                    artisanProfile = artisanResult.data;
                }
            }

            // Set current user
            this.currentUser = {
                ...user,
                artisanProfile: artisanProfile
            };

            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            // Show success message
            this.showNotification('Login successful! Welcome back.', 'success');

            // Redirect based on profile completion
            setTimeout(() => {
                if (artisanProfile && artisanProfile.profile_completed) {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'profile-setup.html';
                }
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            this.showFormError(error.message);
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const fullName = formData.get('fullName')?.trim();
        const email = formData.get('email')?.trim();
        const phone = formData.get('phone')?.trim();
        const craft = formData.get('craft');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        // Clear previous errors
        this.clearFormErrors();

        // Validate input
        if (!fullName || !email || !craft || !password || !confirmPassword) {
            this.showFormError('Please fill in all required fields');
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
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Creating account...';
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
                isArtisan: true,
                profileCompleted: false
            };

            const userResult = await this.db.createUser(userData);
            if (!userResult.success) {
                throw new Error(userResult.error || 'Failed to create user account');
            }

            // Create artisan profile
            const artisanData = {
                user_id: userResult.data.id,
                craft: craft,
                bio: '',
                location: '',
                shop_visible: true,
                email_notifications: true,
                marketing_emails: false,
                monthly_reports: true
            };

            const artisanResult = await this.db.createArtisan(artisanData);
            if (!artisanResult.success) {
                console.warn('Failed to create artisan profile:', artisanResult.error);
            }

            // Set current user
            this.currentUser = {
                ...userResult.data,
                artisanProfile: artisanResult.data
            };

            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            // Show success message
            this.showNotification('Account created successfully! Please complete your profile.', 'success');

            // Redirect to profile setup
            setTimeout(() => {
                window.location.href = 'profile-setup.html';
            }, 1500);

        } catch (error) {
            console.error('Registration error:', error);
            this.showFormError(error.message);
        } finally {
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
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
        const strengthIndicator = input.parentNode.querySelector('.password-strength');
        
        if (!strengthIndicator) return;

        let strength = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) strength++;
        else feedback.push('At least 8 characters');

        // Uppercase check
        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('One uppercase letter');

        // Lowercase check
        if (/[a-z]/.test(password)) strength++;
        else feedback.push('One lowercase letter');

        // Number check
        if (/\d/.test(password)) strength++;
        else feedback.push('One number');

        // Special character check
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
        else feedback.push('One special character');

        // Update strength indicator
        const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['#ff4757', '#ff7675', '#fdcb6e', '#00b894', '#00cec9'];
        
        const level = Math.min(strength, 4);
        strengthIndicator.textContent = `Password Strength: ${strengthLevels[level]}`;
        strengthIndicator.style.color = strengthColors[level];
        
        if (feedback.length > 0 && password.length > 0) {
            strengthIndicator.innerHTML += `<br><small>Missing: ${feedback.join(', ')}</small>`;
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
        input.parentNode.appendChild(errorElement);
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const errorElement = input.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    showFormError(message) {
        const errorElement = document.querySelector('.form-error') || this.createErrorElement();
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearFormErrors() {
        const errorElement = document.querySelector('.form-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    createErrorElement() {
        const errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.style.display = 'none';
        
        // Add to the active form
        const activeForm = document.querySelector('#artist-login-section:not([style*="none"]) form, #artist-register-section:not([style*="none"]) form');
        if (activeForm) {
            activeForm.insertBefore(errorElement, activeForm.firstChild);
        }
        
        return errorElement;
    }

    updateAuthUI() {
        if (this.currentUser) {
            // Update user display elements
            const userNameElements = document.querySelectorAll('.user-name, #user-name');
            userNameElements.forEach(element => {
                element.textContent = this.currentUser.fullName || this.currentUser.email;
            });

            // Update avatar if available
            const avatarElements = document.querySelectorAll('.avatar-img');
            if (this.currentUser.avatar_url) {
                avatarElements.forEach(avatar => {
                    avatar.src = this.currentUser.avatar_url;
                });
            }

            // Show/hide auth elements
            const loginButtons = document.querySelectorAll('#login-btn, #register-btn');
            const userMenus = document.querySelectorAll('.user-menu');
            
            loginButtons.forEach(btn => btn.style.display = 'none');
            userMenus.forEach(menu => menu.style.display = 'flex');
        }
    }

    async logout() {
        try {
            // Clear current user
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            
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

    isArtisan() {
        return this.currentUser?.is_artisan || false;
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