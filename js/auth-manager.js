// Unified Authentication Manager for ArtisanHub
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.supabase = null;
        this.isInitialized = false;
        this.initPromise = this.init();
    }

    async init() {
        try {
            // Wait for Supabase to be ready
            await this.waitForSupabase();
            
            // Check existing auth state
            await this.checkAuthState();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update UI
            this.updateAuthUI();
            
            this.isInitialized = true;
            console.log('🔐 Auth Manager initialized');
        } catch (error) {
            console.error('Auth Manager initialization failed:', error);
        }
    }

    async waitForSupabase() {
        return new Promise((resolve) => {
            const checkSupabase = () => {
                if (window.supabaseConfig && window.supabaseConfig.getClient()) {
                    this.supabase = window.supabaseConfig.getClient();
                    resolve();
                } else {
                    setTimeout(checkSupabase, 100);
                }
            };
            checkSupabase();
        });
    }

    async checkAuthState() {
        try {
            // Check Supabase auth session
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session?.user) {
                // Get user data from database
                const { data: userData } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (userData) {
                    this.currentUser = userData;
                    this.saveUserSession(userData);
                }
            } else {
                // Check localStorage for fallback
                const storedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
                if (storedUser) {
                    try {
                        this.currentUser = JSON.parse(storedUser);
                    } catch (error) {
                        console.error('Error parsing stored user:', error);
                        this.clearUserSession();
                    }
                }
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    }

    setupEventListeners() {
        // Listen for Supabase auth changes
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                this.handleAuthChange(session.user);
            } else if (event === 'SIGNED_OUT') {
                this.handleSignOut();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'user-login-form' || e.target.id === 'artist-login-form') {
                this.handleLogin(e);
            } else if (e.target.id === 'user-register-form' || e.target.id === 'artist-register-form') {
                this.handleRegister(e);
            }
        });

        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.id === 'login-tab' || e.target.classList.contains('show-login')) {
                this.showForm('login');
            } else if (e.target.id === 'register-tab' || e.target.classList.contains('show-register')) {
                this.showForm('register');
            } else if (e.target.classList.contains('logout-btn') || e.target.id === 'logout-btn') {
                this.logout();
            }
        });

        // Password toggles
        document.addEventListener('click', (e) => {
            if (e.target.closest('.password-toggle')) {
                this.togglePassword(e.target.closest('.password-toggle'));
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
        const remember = formData.get('remember');

        if (!email || !password) {
            this.showFormError('Please fill in all fields');
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitButton, 'Signing in...');

        try {
            // Try Supabase auth first
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                // Fallback to localStorage for demo
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.email === email && u.password === password);
                
                if (!user) {
                    throw new Error('Invalid email or password');
                }

                this.currentUser = user;
                this.saveUserSession(user, !!remember);
            } else {
                // Get user data from database
                const { data: userData } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                
                this.currentUser = userData;
                this.saveUserSession(userData, !!remember);
            }

            this.showNotification('Login successful! Welcome back.', 'success');
            this.updateAuthUI();

            // Redirect based on user type
            setTimeout(() => {
                if (this.currentUser.is_artisan) {
                    window.location.href = this.currentUser.profile_completed ? 'dashboard.html' : 'profile-setup.html';
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

        if (!this.validateRegistrationForm(userData, isArtistForm)) {
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitButton, 'Creating account...');

        try {
            // Try Supabase auth first
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: isArtistForm ? `${userData.firstName} ${userData.lastName}` : userData.fullName,
                        is_artisan: userData.isArtisan
                    }
                }
            });

            if (authError) {
                // Fallback to localStorage for demo
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                
                if (users.find(u => u.email === userData.email)) {
                    throw new Error('An account with this email already exists');
                }

                const newUser = {
                    id: this.generateId(),
                    email: userData.email,
                    password: userData.password,
                    full_name: isArtistForm ? `${userData.firstName} ${userData.lastName}` : userData.fullName,
                    phone: userData.phone,
                    is_artisan: userData.isArtisan,
                    profile_completed: !userData.isArtisan,
                    created_at: new Date().toISOString()
                };

                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));
                
                this.currentUser = newUser;
                this.saveUserSession(newUser, true);
            } else {
                // Create user record in database
                const { data: newUser, error: userError } = await this.supabase
                    .from('users')
                    .insert([{
                        id: authData.user.id,
                        email: userData.email,
                        full_name: isArtistForm ? `${userData.firstName} ${userData.lastName}` : userData.fullName,
                        phone: userData.phone,
                        is_artisan: userData.isArtisan,
                        profile_completed: !userData.isArtisan
                    }])
                    .select()
                    .single();

                if (userError) throw userError;
                
                this.currentUser = newUser;
                this.saveUserSession(newUser, true);
            }

            this.showNotification('Account created successfully! Welcome to ArtisanHub!', 'success');
            this.updateAuthUI();

            // Redirect based on user type
            setTimeout(() => {
                if (this.currentUser.is_artisan) {
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

    async logout() {
        try {
            // Sign out from Supabase
            await this.supabase.auth.signOut();
            
            // Clear local data
            this.currentUser = null;
            this.clearUserSession();
            
            // Update UI
            this.updateAuthUI();
            
            this.showNotification('Logged out successfully', 'success');
            
            // Redirect to home
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Error during logout', 'error');
        }
    }

    saveUserSession(user, remember = true) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('currentUser', JSON.stringify(user));
        
        // Clear the other storage
        const otherStorage = remember ? sessionStorage : localStorage;
        otherStorage.removeItem('currentUser');
    }

    clearUserSession() {
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
    }

    updateAuthUI() {
        const authActions = document.getElementById('auth-actions');
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');

        if (this.currentUser) {
            // User is logged in
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (userName) userName.textContent = this.currentUser.full_name || this.currentUser.email;

            // Update auth actions
            if (authActions) {
                authActions.innerHTML = `
                    <div class="user-menu">
                        <button class="user-menu-toggle" id="user-menu-toggle">
                            <img src="${this.currentUser.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}" 
                                 alt="User" class="avatar-img">
                            <span class="user-name">${this.currentUser.full_name || this.currentUser.email}</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="user-dropdown" id="user-dropdown">
                            ${this.currentUser.is_artisan ? 
                                '<a href="pages/dashboard.html" class="dropdown-item"><i class="fas fa-palette"></i> Dashboard</a>' : 
                                '<a href="pages/become-artisan.html" class="dropdown-item"><i class="fas fa-palette"></i> Become Artisan</a>'
                            }
                            <a href="pages/profile.html" class="dropdown-item"><i class="fas fa-user"></i> Profile</a>
                            <a href="pages/orders.html" class="dropdown-item"><i class="fas fa-box"></i> Orders</a>
                            <a href="pages/wishlist.html" class="dropdown-item"><i class="fas fa-heart"></i> Wishlist</a>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item logout-btn">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                `;

                this.setupUserMenuToggle();
            }
        } else {
            // User is not logged in
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
            
            if (authActions) {
                authActions.innerHTML = `
                    <a href="pages/user-auth.html" class="btn btn--outline btn--sm">Sign In</a>
                `;
            }
        }
    }

    setupUserMenuToggle() {
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
        } else {
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

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Public API
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

// Initialize auth manager
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}