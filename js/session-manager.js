// Session Management System for ArtisanHub
class SessionManager {
    constructor() {
        this.currentUser = null;
        this.sessionData = {
            cart: [],
            wishlist: [],
            searchHistory: [],
            preferences: {}
        };
        this.storageKey = 'artisanHub_session';
        this.userStorageKey = 'artisanHub_user';
        
        this.init();
    }

    init() {
        try {
            this.loadSession();
            this.loadUser();
            this.setupStorageListener();
            this.startSessionMonitoring();
            
            console.log('📱 Session Manager initialized');
        } catch (error) {
            console.error('Error initializing session manager:', error);
        }
    }

    // User Authentication Methods
    setUser(user, remember = true) {
        this.currentUser = user;
        
        if (remember) {
            localStorage.setItem(this.userStorageKey, JSON.stringify(user));
        } else {
            sessionStorage.setItem(this.userStorageKey, JSON.stringify(user));
            localStorage.removeItem(this.userStorageKey);
        }
        
        // Migrate guest data to user account
        this.migrateGuestData(user);
        
        // Update UI across all pages
        this.notifyAuthStateChange('login', user);
        
        console.log('👤 User session created:', user.fullName || user.email);
    }

    getUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    logout() {
        const user = this.currentUser;
        
        // Clear user data
        this.currentUser = null;
        localStorage.removeItem(this.userStorageKey);
        sessionStorage.removeItem(this.userStorageKey);
        
        // Keep guest cart but clear user-specific data
        this.sessionData.wishlist = [];
        this.sessionData.preferences = {};
        this.saveSession();
        
        // Update UI
        this.notifyAuthStateChange('logout', user);
        
        console.log('👤 User logged out');
    }

    loadUser() {
        try {
            // Try localStorage first (remember me), then sessionStorage
            let userData = localStorage.getItem(this.userStorageKey) || 
                          sessionStorage.getItem(this.userStorageKey);
            
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log('👤 User session restored:', this.currentUser.fullName || this.currentUser.email);
            }
        } catch (error) {
            console.error('Error loading user session:', error);
            this.clearUserSession();
        }
    }

    clearUserSession() {
        localStorage.removeItem(this.userStorageKey);
        sessionStorage.removeItem(this.userStorageKey);
        this.currentUser = null;
    }

    // Session Data Methods
    loadSession() {
        try {
            const sessionData = localStorage.getItem(this.storageKey);
            if (sessionData) {
                this.sessionData = { ...this.sessionData, ...JSON.parse(sessionData) };
            }
        } catch (error) {
            console.error('Error loading session data:', error);
            this.resetSession();
        }
    }

    saveSession() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.sessionData));
        } catch (error) {
            console.error('Error saving session data:', error);
        }
    }

    resetSession() {
        this.sessionData = {
            cart: [],
            wishlist: [],
            searchHistory: [],
            preferences: {}
        };
        this.saveSession();
    }

    // Cart Management
    getCart() {
        return this.sessionData.cart || [];
    }

    setCart(cart) {
        this.sessionData.cart = cart;
        this.saveSession();
        this.notifyCartChange();
    }

    addToCart(product, quantity = 1) {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }
        
        this.setCart(cart);
        return cart;
    }

    removeFromCart(productId) {
        const cart = this.getCart();
        const updatedCart = cart.filter(item => item.id !== productId);
        this.setCart(updatedCart);
        return updatedCart;
    }

    updateCartQuantity(productId, quantity) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            if (quantity <= 0) {
                return this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.setCart(cart);
            }
        }
        
        return cart;
    }

    clearCart() {
        this.sessionData.cart = [];
        this.saveSession();
        this.notifyCartChange();
    }

    // Wishlist Management
    getWishlist() {
        return this.sessionData.wishlist || [];
    }

    addToWishlist(product) {
        const wishlist = this.getWishlist();
        const exists = wishlist.find(item => item.id === product.id);
        
        if (!exists) {
            wishlist.push(product);
            this.sessionData.wishlist = wishlist;
            this.saveSession();
        }
        
        return wishlist;
    }

    removeFromWishlist(productId) {
        const wishlist = this.getWishlist();
        this.sessionData.wishlist = wishlist.filter(item => item.id !== productId);
        this.saveSession();
        return this.sessionData.wishlist;
    }

    isInWishlist(productId) {
        return this.getWishlist().some(item => item.id === productId);
    }

    // Search History
    addSearchTerm(term) {
        if (!term || term.trim().length < 2) return;
        
        const history = this.sessionData.searchHistory || [];
        const cleanTerm = term.trim().toLowerCase();
        
        // Remove if already exists
        const filtered = history.filter(item => item !== cleanTerm);
        
        // Add to beginning and limit to 10 items
        this.sessionData.searchHistory = [cleanTerm, ...filtered].slice(0, 10);
        this.saveSession();
    }

    getSearchHistory() {
        return this.sessionData.searchHistory || [];
    }

    clearSearchHistory() {
        this.sessionData.searchHistory = [];
        this.saveSession();
    }

    // Preferences
    setPreference(key, value) {
        this.sessionData.preferences[key] = value;
        this.saveSession();
    }

    getPreference(key, defaultValue = null) {
        return this.sessionData.preferences[key] || defaultValue;
    }

    // Data Migration (Guest to User)
    migrateGuestData(user) {
        try {
            const guestCart = this.getCart();
            const guestWishlist = this.getWishlist();
            
            // If user has existing data, merge intelligently
            if (user.id && window.databaseService) {
                // In a real app, you'd sync with server data here
                console.log('🔄 Migrating guest data to user account...');
                
                // For now, just keep the guest data
                // In production, you'd merge server cart with local cart
            }
            
            console.log('✅ Guest data migration completed');
        } catch (error) {
            console.error('Error migrating guest data:', error);
        }
    }

    // Event System
    setupStorageListener() {
        // Listen for storage changes in other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.userStorageKey) {
                this.loadUser();
                this.notifyAuthStateChange('change', this.currentUser);
            } else if (e.key === this.storageKey) {
                this.loadSession();
                this.notifyCartChange();
            }
        });
    }

    notifyAuthStateChange(action, user) {
        // Custom event for auth state changes
        const event = new CustomEvent('authStateChange', {
            detail: { action, user, isLoggedIn: !!user }
        });
        window.dispatchEvent(event);
    }

    notifyCartChange() {
        // Custom event for cart changes
        const event = new CustomEvent('cartChange', {
            detail: { 
                cart: this.getCart(), 
                itemCount: this.getCartItemCount(),
                total: this.getCartTotal()
            }
        });
        window.dispatchEvent(event);
    }

    // Utility Methods
    getCartItemCount() {
        return this.getCart().reduce((total, item) => total + item.quantity, 0);
    }

    getCartTotal() {
        return this.getCart().reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Session Monitoring
    startSessionMonitoring() {
        // Update session timestamp periodically
        setInterval(() => {
            if (this.currentUser) {
                this.setPreference('lastActivity', Date.now());
            }
        }, 60000); // Every minute

        // Check for session timeout (optional)
        this.checkSessionTimeout();
    }

    checkSessionTimeout() {
        const timeout = 24 * 60 * 60 * 1000; // 24 hours
        const lastActivity = this.getPreference('lastActivity', Date.now());
        
        if (this.currentUser && Date.now() - lastActivity > timeout) {
            console.log('Session expired due to inactivity');
            this.logout();
        }
    }

    // Public API for other modules
    static getInstance() {
        if (!window.sessionManager) {
            window.sessionManager = new SessionManager();
        }
        return window.sessionManager;
    }
}

// Initialize session manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sessionManager = SessionManager.getInstance();
    
    // Make available globally for other scripts
    window.getSessionManager = () => window.sessionManager;
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}