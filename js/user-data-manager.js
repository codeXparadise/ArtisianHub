// User Data Management System for ArtisanHub
class UserDataManager {
    constructor() {
        this.db = null;
        this.currentUser = null;
        this.userPreferences = {};
        this.orderHistory = [];
        this.wishlist = [];
        this.cartItems = [];
        this.viewHistory = [];
        
        this.init();
    }

    async init() {
        try {
            // Wait for database service
            if (window.databaseService) {
                await window.databaseService.initPromise;
                this.db = window.databaseService;
            }
            
            // Load current user if logged in
            await this.loadCurrentUser();
            
            // Load user data
            if (this.currentUser) {
                await this.loadUserData();
            } else {
                // Load guest data from localStorage
                this.loadGuestData();
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('👤 User Data Manager initialized');
        } catch (error) {
            console.error('Error initializing user data manager:', error);
        }
    }

    async loadCurrentUser() {
        try {
            const userData = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
            
            if (userData) {
                this.currentUser = JSON.parse(userData);
                
                // Verify user in database
                if (this.db) {
                    const userResult = await this.db.getUser(this.currentUser.email);
                    if (userResult.success && userResult.data) {
                        // Update current user with latest data
                        this.currentUser = { ...this.currentUser, ...userResult.data };
                    }
                }
            }
        } catch (error) {
            console.error('Error loading current user:', error);
            this.currentUser = null;
        }
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            // Load user preferences
            await this.loadUserPreferences();
            
            // Load order history
            await this.loadOrderHistory();
            
            // Load wishlist
            await this.loadWishlist();
            
            // Load cart items
            await this.loadCartItems();
            
            // Load view history
            await this.loadViewHistory();
            
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    loadGuestData() {
        try {
            // Load data from localStorage for guest users
            this.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            this.cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
            this.viewHistory = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
            this.userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        } catch (error) {
            console.error('Error loading guest data:', error);
        }
    }

    async loadUserPreferences() {
        try {
            if (this.db && this.currentUser) {
                // In a real app, load from database
                // For now, use localStorage with user ID
                const key = `userPreferences_${this.currentUser.id}`;
                this.userPreferences = JSON.parse(localStorage.getItem(key) || '{}');
            }
            
            // Set default preferences if none exist
            if (Object.keys(this.userPreferences).length === 0) {
                this.userPreferences = {
                    currency: 'USD',
                    language: 'en',
                    emailNotifications: true,
                    marketingEmails: false,
                    favoriteCategories: [],
                    priceRange: { min: 0, max: 1000 },
                    theme: 'light'
                };
                
                await this.saveUserPreferences();
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    async loadOrderHistory() {
        try {
            if (this.db && this.currentUser) {
                const ordersResult = await this.db.getOrders({ 
                    userId: this.currentUser.id 
                });
                
                if (ordersResult.success) {
                    this.orderHistory = ordersResult.data;
                }
            }
        } catch (error) {
            console.error('Error loading order history:', error);
        }
    }

    async loadWishlist() {
        try {
            if (this.db && this.currentUser) {
                // In a real app, load from database
                const key = `wishlist_${this.currentUser.id}`;
                this.wishlist = JSON.parse(localStorage.getItem(key) || '[]');
            } else {
                this.wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            }
        } catch (error) {
            console.error('Error loading wishlist:', error);
        }
    }

    async loadCartItems() {
        try {
            if (this.db && this.currentUser) {
                const cartResult = await this.db.getCartItems(this.currentUser.id);
                
                if (cartResult.success) {
                    this.cartItems = cartResult.data;
                } else {
                    // Fallback to localStorage
                    const key = `cartItems_${this.currentUser.id}`;
                    this.cartItems = JSON.parse(localStorage.getItem(key) || '[]');
                }
            } else {
                this.cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
            }
        } catch (error) {
            console.error('Error loading cart items:', error);
        }
    }

    async loadViewHistory() {
        try {
            if (this.currentUser) {
                const key = `viewHistory_${this.currentUser.id}`;
                this.viewHistory = JSON.parse(localStorage.getItem(key) || '[]');
            } else {
                this.viewHistory = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
            }
        } catch (error) {
            console.error('Error loading view history:', error);
        }
    }

    setupEventListeners() {
        // Listen for user login/logout events
        document.addEventListener('userLoggedIn', (event) => {
            this.handleUserLogin(event.detail.user);
        });

        document.addEventListener('userLoggedOut', () => {
            this.handleUserLogout();
        });

        // Listen for cart updates
        document.addEventListener('cartUpdated', () => {
            this.syncCartData();
        });

        // Listen for wishlist updates
        document.addEventListener('wishlistUpdated', () => {
            this.syncWishlistData();
        });
    }

    async handleUserLogin(user) {
        this.currentUser = user;
        
        // Migrate guest data to user account
        await this.migrateGuestData();
        
        // Load user data
        await this.loadUserData();
        
        console.log('User logged in, data loaded');
    }

    async handleUserLogout() {
        // Save current data before logout
        if (this.currentUser) {
            await this.saveAllUserData();
        }
        
        this.currentUser = null;
        
        // Switch to guest mode
        this.loadGuestData();
        
        console.log('User logged out, switched to guest mode');
    }

    async migrateGuestData() {
        if (!this.currentUser) return;

        try {
            // Migrate guest cart items
            const guestCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
            if (guestCart.length > 0) {
                for (const item of guestCart) {
                    await this.addToCart(item.id, item.quantity, false);
                }
                localStorage.removeItem('cartItems');
            }

            // Migrate guest wishlist
            const guestWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            if (guestWishlist.length > 0) {
                this.wishlist = [...new Set([...this.wishlist, ...guestWishlist])];
                await this.saveWishlist();
                localStorage.removeItem('wishlist');
            }

            // Migrate view history
            const guestHistory = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
            if (guestHistory.length > 0) {
                this.viewHistory = [...new Set([...this.viewHistory, ...guestHistory])];
                await this.saveViewHistory();
                localStorage.removeItem('viewedProducts');
            }

        } catch (error) {
            console.error('Error migrating guest data:', error);
        }
    }

    // ==================== USER PREFERENCES ====================

    async updateUserPreferences(preferences) {
        try {
            this.userPreferences = { ...this.userPreferences, ...preferences };
            await this.saveUserPreferences();
            
            // Dispatch event for UI updates
            document.dispatchEvent(new CustomEvent('userPreferencesUpdated', {
                detail: { preferences: this.userPreferences }
            }));
            
            return { success: true };
        } catch (error) {
            console.error('Error updating user preferences:', error);
            return { success: false, error: error.message };
        }
    }

    async saveUserPreferences() {
        try {
            if (this.currentUser) {
                const key = `userPreferences_${this.currentUser.id}`;
                localStorage.setItem(key, JSON.stringify(this.userPreferences));
            } else {
                localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
            }
        } catch (error) {
            console.error('Error saving user preferences:', error);
        }
    }

    // ==================== CART MANAGEMENT ====================

    async addToCart(productId, quantity = 1, save = true) {
        try {
            const existingItem = this.cartItems.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity += quantity;
                existingItem.updatedAt = new Date().toISOString();
            } else {
                this.cartItems.push({
                    id: productId,
                    quantity: quantity,
                    addedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            
            if (save) {
                await this.saveCartItems();
            }
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('cartUpdated', {
                detail: { cartItems: this.cartItems }
            }));
            
            return { success: true };
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { success: false, error: error.message };
        }
    }

    async removeFromCart(productId) {
        try {
            this.cartItems = this.cartItems.filter(item => item.id !== productId);
            await this.saveCartItems();
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('cartUpdated', {
                detail: { cartItems: this.cartItems }
            }));
            
            return { success: true };
        } catch (error) {
            console.error('Error removing from cart:', error);
            return { success: false, error: error.message };
        }
    }

    async updateCartQuantity(productId, quantity) {
        try {
            const item = this.cartItems.find(item => item.id === productId);
            
            if (item) {
                if (quantity <= 0) {
                    return await this.removeFromCart(productId);
                } else {
                    item.quantity = quantity;
                    item.updatedAt = new Date().toISOString();
                    await this.saveCartItems();
                }
            }
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('cartUpdated', {
                detail: { cartItems: this.cartItems }
            }));
            
            return { success: true };
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            return { success: false, error: error.message };
        }
    }

    async clearCart() {
        try {
            this.cartItems = [];
            await this.saveCartItems();
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('cartUpdated', {
                detail: { cartItems: this.cartItems }
            }));
            
            return { success: true };
        } catch (error) {
            console.error('Error clearing cart:', error);
            return { success: false, error: error.message };
        }
    }

    async saveCartItems() {
        try {
            if (this.db && this.currentUser) {
                // Save to database for logged-in users
                for (const item of this.cartItems) {
                    await this.db.addToCart(this.currentUser.id, item.id, item.quantity);
                }
            }
            
            // Always save to localStorage as backup
            const key = this.currentUser ? `cartItems_${this.currentUser.id}` : 'cartItems';
            localStorage.setItem(key, JSON.stringify(this.cartItems));
            
        } catch (error) {
            console.error('Error saving cart items:', error);
        }
    }

    // ==================== WISHLIST MANAGEMENT ====================

    async addToWishlist(productId) {
        try {
            if (!this.wishlist.includes(productId)) {
                this.wishlist.push(productId);
                await this.saveWishlist();
                
                // Dispatch event
                document.dispatchEvent(new CustomEvent('wishlistUpdated', {
                    detail: { wishlist: this.wishlist, action: 'added', productId }
                }));
                
                return { success: true, action: 'added' };
            }
            
            return { success: true, action: 'already_exists' };
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            return { success: false, error: error.message };
        }
    }

    async removeFromWishlist(productId) {
        try {
            const index = this.wishlist.indexOf(productId);
            if (index > -1) {
                this.wishlist.splice(index, 1);
                await this.saveWishlist();
                
                // Dispatch event
                document.dispatchEvent(new CustomEvent('wishlistUpdated', {
                    detail: { wishlist: this.wishlist, action: 'removed', productId }
                }));
                
                return { success: true, action: 'removed' };
            }
            
            return { success: true, action: 'not_found' };
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            return { success: false, error: error.message };
        }
    }

    async toggleWishlist(productId) {
        if (this.wishlist.includes(productId)) {
            return await this.removeFromWishlist(productId);
        } else {
            return await this.addToWishlist(productId);
        }
    }

    async saveWishlist() {
        try {
            const key = this.currentUser ? `wishlist_${this.currentUser.id}` : 'wishlist';
            localStorage.setItem(key, JSON.stringify(this.wishlist));
        } catch (error) {
            console.error('Error saving wishlist:', error);
        }
    }

    // ==================== VIEW HISTORY ====================

    async addToViewHistory(productId) {
        try {
            // Remove if already exists (to move to front)
            const index = this.viewHistory.indexOf(productId);
            if (index > -1) {
                this.viewHistory.splice(index, 1);
            }
            
            // Add to beginning
            this.viewHistory.unshift(productId);
            
            // Keep only last 50 viewed items
            this.viewHistory = this.viewHistory.slice(0, 50);
            
            await this.saveViewHistory();
            
            return { success: true };
        } catch (error) {
            console.error('Error adding to view history:', error);
            return { success: false, error: error.message };
        }
    }

    async saveViewHistory() {
        try {
            const key = this.currentUser ? `viewHistory_${this.currentUser.id}` : 'viewedProducts';
            localStorage.setItem(key, JSON.stringify(this.viewHistory));
        } catch (error) {
            console.error('Error saving view history:', error);
        }
    }

    // ==================== DATA ANALYTICS ====================

    getUserAnalytics() {
        try {
            const analytics = {
                profile: {
                    isLoggedIn: !!this.currentUser,
                    userType: this.currentUser?.userType || 'guest',
                    joinDate: this.currentUser?.createdAt || null
                },
                shopping: {
                    cartItems: this.cartItems.length,
                    cartValue: this.calculateCartValue(),
                    wishlistItems: this.wishlist.length,
                    ordersCount: this.orderHistory.length,
                    totalSpent: this.calculateTotalSpent()
                },
                behavior: {
                    viewedProducts: this.viewHistory.length,
                    favoriteCategories: this.getFavoriteCategories(),
                    avgSessionTime: this.calculateAvgSessionTime(),
                    lastActivity: this.getLastActivity()
                },
                preferences: this.userPreferences
            };
            
            return analytics;
        } catch (error) {
            console.error('Error generating user analytics:', error);
            return null;
        }
    }

    calculateCartValue() {
        // This would require product price data
        // For now, return mock calculation
        return this.cartItems.length * 50; // Mock average price
    }

    calculateTotalSpent() {
        return this.orderHistory.reduce((total, order) => total + (order.total_amount || 0), 0);
    }

    getFavoriteCategories() {
        // Analyze view history and order history to determine favorite categories
        // For now, return user preference or empty array
        return this.userPreferences.favoriteCategories || [];
    }

    calculateAvgSessionTime() {
        // Mock calculation - in real app, track session times
        return Math.floor(Math.random() * 30) + 10; // 10-40 minutes
    }

    getLastActivity() {
        return new Date().toISOString();
    }

    // ==================== DATA EXPORT/IMPORT ====================

    async exportUserData() {
        try {
            const userData = {
                profile: this.currentUser,
                preferences: this.userPreferences,
                orderHistory: this.orderHistory,
                wishlist: this.wishlist,
                cartItems: this.cartItems,
                viewHistory: this.viewHistory,
                analytics: this.getUserAnalytics(),
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `artisanhub-user-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error) {
            console.error('Error exporting user data:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== SYNC AND BACKUP ====================

    async syncCartData() {
        await this.saveCartItems();
    }

    async syncWishlistData() {
        await this.saveWishlist();
    }

    async saveAllUserData() {
        try {
            await Promise.all([
                this.saveUserPreferences(),
                this.saveCartItems(),
                this.saveWishlist(),
                this.saveViewHistory()
            ]);
            
            return { success: true };
        } catch (error) {
            console.error('Error saving all user data:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== PUBLIC GETTERS ====================

    getCurrentUser() {
        return this.currentUser;
    }

    getUserPreferences() {
        return this.userPreferences;
    }

    getCartItems() {
        return this.cartItems;
    }

    getWishlist() {
        return this.wishlist;
    }

    getOrderHistory() {
        return this.orderHistory;
    }

    getViewHistory() {
        return this.viewHistory;
    }

    isInWishlist(productId) {
        return this.wishlist.includes(productId);
    }

    isInCart(productId) {
        return this.cartItems.some(item => item.id === productId);
    }

    getCartItemCount() {
        return this.cartItems.reduce((total, item) => total + item.quantity, 0);
    }
}

// Initialize user data manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userDataManager = new UserDataManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserDataManager;
}