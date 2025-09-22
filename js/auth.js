// Authentication System for ArtisanHub
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('artisanUsers')) || [];
        this.artists = JSON.parse(localStorage.getItem('artisanArtists')) || [];
        this.products = JSON.parse(localStorage.getItem('artisanProducts')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
        this.setupPasswordToggles();
        this.setupFormValidation();
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

        // User menu toggle
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', () => this.toggleUserMenu());
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('user-menu');
            const dropdownMenu = document.getElementById('dropdown-menu');
            
            if (userMenu && dropdownMenu && !userMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    showForm(formType) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (formType === 'register') {
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
        } else {
            if (registerForm) registerForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
        }
    }

    setupPasswordToggles() {
        const passwordToggles = document.querySelectorAll('.password-toggle');
        
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const targetId = toggle.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                const icon = toggle.querySelector('i');

                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    targetInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    setupFormValidation() {
        // Real-time password strength checking
        const passwordInput = document.getElementById('register-password');
        const passwordStrength = document.getElementById('password-strength');

        if (passwordInput && passwordStrength) {
            passwordInput.addEventListener('input', () => {
                const strength = this.checkPasswordStrength(passwordInput.value);
                this.displayPasswordStrength(strength, passwordStrength);
            });
        }

        // Real-time email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => this.validateEmail(input));
        });

        // Real-time password confirmation
        const confirmPassword = document.getElementById('confirm-password');
        if (confirmPassword && passwordInput) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch(passwordInput, confirmPassword);
            });
        }
    }

    checkPasswordStrength(password) {
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        strength = Object.values(checks).filter(Boolean).length;

        return {
            score: strength,
            checks: checks,
            text: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][Math.min(strength, 4)]
        };
    }

    displayPasswordStrength(strength, element) {
        const colors = ['#ff4444', '#ff8800', '#ffaa00', '#88aa00', '#00aa00'];
        const color = colors[Math.min(strength.score, 4)];

        element.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${(strength.score / 5) * 100}%; background: ${color};"></div>
            </div>
            <span class="strength-text" style="color: ${color};">${strength.text}</span>
        `;
    }

    validateEmail(input) {
        const email = input.value;
        const errorElement = document.getElementById(input.id + '-error');
        
        if (!email) {
            this.showError(errorElement, 'Email is required');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showError(errorElement, 'Please enter a valid email address');
            return false;
        }

        // Check if email already exists
        if (input.name === 'email' && input.form.id === 'artist-register-form') {
            if (this.emailExists(email)) {
                this.showError(errorElement, 'This email is already registered');
                return false;
            }
        }

        this.clearError(errorElement);
        return true;
    }

    validatePasswordMatch(passwordInput, confirmInput) {
        const errorElement = document.getElementById('confirm-password-error');
        
        if (passwordInput.value !== confirmInput.value) {
            this.showError(errorElement, 'Passwords do not match');
            return false;
        }

        this.clearError(errorElement);
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    emailExists(email) {
        return this.artists.some(artist => artist.email === email) || 
               this.users.some(user => user.email === email);
    }

    showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    clearError(element) {
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember');

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing In...';
        submitBtn.disabled = true;

        try {
            // Simulate API delay
            await this.delay(1000);

            const artist = this.artists.find(a => a.email === email && a.password === password);
            
            if (!artist) {
                this.showNotification('Invalid email or password', 'error');
                return;
            }

            // Set current user
            this.currentUser = { ...artist, type: 'artist' };
            
            // Store session
            if (remember) {
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            } else {
                sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }

            this.showNotification('Welcome back!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            this.showNotification('Login failed. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Validate form
        if (!this.validateRegistrationForm(data)) {
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Account...';
        submitBtn.disabled = true;

        try {
            // Simulate API delay
            await this.delay(1500);

            // Create new artist
            const newArtist = {
                id: this.generateId(),
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password, // In real app, this would be hashed
                craftSpecialty: data.craftSpecialty,
                createdAt: new Date().toISOString(),
                isVerified: false,
                profile: {
                    bio: '',
                    location: '',
                    phone: '',
                    website: '',
                    socialMedia: {
                        instagram: '',
                        facebook: '',
                        twitter: ''
                    },
                    avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
                    coverImage: '',
                    experience: '',
                    techniques: [],
                    achievements: []
                },
                stats: {
                    totalProducts: 0,
                    totalSales: 0,
                    totalRevenue: 0,
                    rating: 0,
                    reviews: 0
                },
                settings: {
                    newsletter: data.newsletter === 'on',
                    emailNotifications: true,
                    publicProfile: true
                }
            };

            // Save to storage
            this.artists.push(newArtist);
            localStorage.setItem('artisanArtists', JSON.stringify(this.artists));

            // Auto login
            this.currentUser = { ...newArtist, type: 'artist' };
            sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            this.showNotification('Account created successfully! Welcome to ArtisanHub!', 'success');

            // Redirect to profile setup
            setTimeout(() => {
                window.location.href = 'profile-setup.html';
            }, 2000);

        } catch (error) {
            this.showNotification('Registration failed. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateRegistrationForm(data) {
        let isValid = true;

        // Clear all errors first
        document.querySelectorAll('.form-error').forEach(error => {
            error.style.display = 'none';
        });

        // Validate first name
        if (!data.firstName || data.firstName.trim().length < 2) {
            this.showError(document.getElementById('register-first-name-error'), 'First name must be at least 2 characters');
            isValid = false;
        }

        // Validate last name
        if (!data.lastName || data.lastName.trim().length < 2) {
            this.showError(document.getElementById('register-last-name-error'), 'Last name must be at least 2 characters');
            isValid = false;
        }

        // Validate email
        if (!this.isValidEmail(data.email)) {
            this.showError(document.getElementById('register-email-error'), 'Please enter a valid email address');
            isValid = false;
        } else if (this.emailExists(data.email)) {
            this.showError(document.getElementById('register-email-error'), 'This email is already registered');
            isValid = false;
        }

        // Validate password
        const passwordStrength = this.checkPasswordStrength(data.password);
        if (passwordStrength.score < 3) {
            this.showError(document.getElementById('register-password-error'), 'Password is too weak. Please choose a stronger password.');
            isValid = false;
        }

        // Validate password confirmation
        if (data.password !== data.confirmPassword) {
            this.showError(document.getElementById('confirm-password-error'), 'Passwords do not match');
            isValid = false;
        }

        // Validate craft specialty
        if (!data.craftSpecialty) {
            this.showError(document.getElementById('craft-specialty-error'), 'Please select your primary craft specialty');
            isValid = false;
        }

        // Validate terms
        if (!data.terms) {
            this.showError(document.getElementById('terms-error'), 'You must agree to the Terms of Service');
            isValid = false;
        }

        return isValid;
    }

    checkAuthState() {
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
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');

        if (this.currentUser) {
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (userName) userName.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    toggleUserMenu() {
        const dropdownMenu = document.getElementById('dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.classList.toggle('show');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        
        this.showNotification('You have been logged out', 'info');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1000);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showNotification(message, type = 'info') {
        // Use the existing notification system from script.js
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Public methods for other components
    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    isArtist() {
        return this.currentUser && this.currentUser.type === 'artist';
    }

    getArtistById(id) {
        return this.artists.find(artist => artist.id === id);
    }

    updateArtist(artistData) {
        const index = this.artists.findIndex(artist => artist.id === artistData.id);
        if (index !== -1) {
            this.artists[index] = { ...this.artists[index], ...artistData };
            localStorage.setItem('artisanArtists', JSON.stringify(this.artists));
            
            // Update current user if it's the same artist
            if (this.currentUser && this.currentUser.id === artistData.id) {
                this.currentUser = { ...this.currentUser, ...artistData };
                const storage = localStorage.getItem('currentUser') ? localStorage : sessionStorage;
                storage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
            
            return true;
        }
        return false;
    }

    getAllArtists() {
        return this.artists;
    }

    addProduct(productData) {
        const newProduct = {
            id: this.generateId(),
            ...productData,
            artistId: this.currentUser.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            views: 0,
            sales: 0
        };

        this.products.push(newProduct);
        localStorage.setItem('artisanProducts', JSON.stringify(this.products));
        
        // Update artist stats
        const artist = this.getArtistById(this.currentUser.id);
        if (artist) {
            artist.stats.totalProducts += 1;
            this.updateArtist(artist);
        }

        return newProduct;
    }

    getProductsByArtist(artistId) {
        return this.products.filter(product => product.artistId === artistId);
    }

    getAllProducts() {
        return this.products;
    }

    updateProduct(productData) {
        const index = this.products.findIndex(product => product.id === productData.id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...productData, updatedAt: new Date().toISOString() };
            localStorage.setItem('artisanProducts', JSON.stringify(this.products));
            return true;
        }
        return false;
    }

    deleteProduct(productId) {
        const index = this.products.findIndex(product => product.id === productId);
        if (index !== -1) {
            this.products.splice(index, 1);
            localStorage.setItem('artisanProducts', JSON.stringify(this.products));
            
            // Update artist stats
            const artist = this.getArtistById(this.currentUser.id);
            if (artist) {
                artist.stats.totalProducts = Math.max(0, artist.stats.totalProducts - 1);
                this.updateArtist(artist);
            }
            
            return true;
        }
        return false;
    }
}

// Initialize the auth system
const authSystem = new AuthSystem();

// Make auth system globally available
window.authSystem = authSystem;

// Add CSS for auth components
const authStyles = document.createElement('style');
authStyles.textContent = `
    /* Auth Hero Section */
    .auth-hero {
        background: linear-gradient(135deg, var(--cream) 0%, #FFF3E0 100%);
        padding: var(--space-2xl) 0;
        margin-top: 80px;
        text-align: center;
    }
    
    .auth-hero__title {
        font-family: var(--font-display);
        font-size: 3rem;
        font-weight: 700;
        color: var(--text-dark);
        margin-bottom: var(--space-md);
    }
    
    .auth-hero__description {
        font-size: 1.2rem;
        color: var(--text-medium);
        margin-bottom: var(--space-xl);
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .auth-hero__features {
        display: flex;
        justify-content: center;
        gap: var(--space-xl);
        flex-wrap: wrap;
    }
    
    .feature-item {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        color: var(--primary-color);
        font-weight: 500;
    }
    
    .feature-item i {
        font-size: 1.2rem;
    }

    /* Auth Section */
    .auth-section {
        padding: var(--space-2xl) 0;
        background: var(--white);
    }
    
    .auth-container {
        max-width: 500px;
        margin: 0 auto;
    }
    
    .auth-form {
        background: var(--white);
        border-radius: var(--radius-xl);
        padding: var(--space-2xl);
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--gray);
    }
    
    .auth-form__header {
        text-align: center;
        margin-bottom: var(--space-xl);
    }
    
    .auth-form__title {
        font-family: var(--font-display);
        font-size: 2rem;
        color: var(--text-dark);
        margin-bottom: var(--space-sm);
    }
    
    .auth-form__subtitle {
        color: var(--text-medium);
        font-size: 1rem;
    }
    
    .auth-form__footer {
        text-align: center;
        margin-top: var(--space-lg);
        padding-top: var(--space-lg);
        border-top: 1px solid var(--gray);
    }

    /* Form Styles */
    .form {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-md);
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
    }
    
    .form-label {
        font-weight: 500;
        color: var(--text-dark);
        font-size: 0.9rem;
    }
    
    .form-input {
        padding: 12px 16px;
        border: 2px solid var(--gray);
        border-radius: var(--radius-md);
        font-size: 1rem;
        transition: all var(--transition-fast);
        background: var(--white);
    }
    
    .form-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
    }
    
    .form-input:invalid {
        border-color: var(--error);
    }
    
    .form-error {
        color: var(--error);
        font-size: 0.85rem;
        display: none;
    }
    
    .password-input {
        position: relative;
    }
    
    .password-toggle {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-light);
        cursor: pointer;
        padding: 4px;
        border-radius: var(--radius-sm);
        transition: color var(--transition-fast);
    }
    
    .password-toggle:hover {
        color: var(--text-dark);
    }
    
    .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: var(--space-sm);
        cursor: pointer;
        font-size: 0.9rem;
        line-height: 1.5;
    }
    
    .checkbox-input {
        display: none;
    }
    
    .checkbox-label .checkmark {
        width: 18px;
        height: 18px;
        border: 2px solid var(--gray);
        border-radius: var(--radius-sm);
        position: relative;
        transition: all var(--transition-fast);
        flex-shrink: 0;
        margin-top: 2px;
    }
    
    .checkbox-input:checked + .checkmark {
        background: var(--primary-color);
        border-color: var(--primary-color);
    }
    
    .checkbox-input:checked + .checkmark::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--white);
        font-size: 0.8rem;
        font-weight: bold;
    }
    
    .link-btn {
        background: none;
        border: none;
        color: var(--primary-color);
        cursor: pointer;
        text-decoration: underline;
        font-size: inherit;
        transition: color var(--transition-fast);
    }
    
    .link-btn:hover {
        color: var(--primary-dark);
    }
    
    .link {
        color: var(--primary-color);
        text-decoration: none;
        transition: color var(--transition-fast);
    }
    
    .link:hover {
        color: var(--primary-dark);
        text-decoration: underline;
    }

    /* Password Strength */
    .password-strength {
        margin-top: var(--space-xs);
    }
    
    .strength-bar {
        height: 4px;
        background: var(--gray);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: var(--space-xs);
    }
    
    .strength-fill {
        height: 100%;
        transition: all var(--transition-normal);
        border-radius: 2px;
    }
    
    .strength-text {
        font-size: 0.8rem;
        font-weight: 500;
    }

    /* User Menu */
    .user-menu {
        position: relative;
    }
    
    .user-avatar {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        cursor: pointer;
        padding: 8px;
        border-radius: var(--radius-md);
        transition: background var(--transition-fast);
    }
    
    .user-avatar:hover {
        background: var(--light-gray);
    }
    
    .avatar-img {
        width: 32px;
        height: 32px;
        border-radius: var(--radius-full);
        object-fit: cover;
    }
    
    .user-name {
        font-weight: 500;
        color: var(--text-dark);
    }
    
    .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--white);
        border: 1px solid var(--gray);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        min-width: 200px;
        padding: var(--space-sm) 0;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all var(--transition-fast);
    }
    
    .dropdown-menu.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }
    
    .dropdown-item {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: 10px 16px;
        color: var(--text-dark);
        text-decoration: none;
        font-size: 0.9rem;
        cursor: pointer;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        transition: background var(--transition-fast);
    }
    
    .dropdown-item:hover {
        background: var(--light-gray);
    }
    
    .dropdown-divider {
        height: 1px;
        background: var(--gray);
        margin: var(--space-sm) 0;
    }

    /* Benefits Section */
    .benefits-section {
        padding: var(--space-2xl) 0;
        background: var(--light-gray);
    }
    
    .benefits-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--space-xl);
        margin-top: var(--space-xl);
    }
    
    .benefit-card {
        background: var(--white);
        padding: var(--space-xl);
        border-radius: var(--radius-xl);
        text-align: center;
        box-shadow: var(--shadow-md);
        transition: transform var(--transition-normal);
    }
    
    .benefit-card:hover {
        transform: translateY(-5px);
    }
    
    .benefit-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto var(--space-lg) auto;
    }
    
    .benefit-icon i {
        font-size: 2rem;
        color: var(--white);
    }
    
    .benefit-title {
        font-family: var(--font-display);
        font-size: 1.3rem;
        color: var(--text-dark);
        margin-bottom: var(--space-md);
    }
    
    .benefit-description {
        color: var(--text-medium);
        line-height: 1.6;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
        .auth-hero__title {
            font-size: 2.5rem;
        }
        
        .auth-hero__features {
            flex-direction: column;
            align-items: center;
            gap: var(--space-md);
        }
        
        .auth-form {
            padding: var(--space-lg);
            margin: 0 var(--space-md);
        }
        
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .benefits-grid {
            grid-template-columns: 1fr;
            gap: var(--space-lg);
        }
        
        .user-name {
            display: none;
        }
    }
    
    @media (max-width: 480px) {
        .auth-hero__title {
            font-size: 2rem;
        }
        
        .auth-form__title {
            font-size: 1.5rem;
        }
        
        .benefit-card {
            padding: var(--space-lg);
        }
    }
`;
document.head.appendChild(authStyles);