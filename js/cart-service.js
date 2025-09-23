// Shopping Cart Service with Supabase Integration
class CartService {
    constructor() {
        this.supabase = null;
        this.cart = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.initPromise = this.init();
    }

    async init() {
        try {
            // Wait for Supabase client
            if (window.supabaseClient) {
                await window.supabaseClient.initPromise;
                this.supabase = window.supabaseClient.getClient();
            }

            // Wait for auth service
            if (window.authService) {
                await window.authService.initPromise;
                this.currentUser = window.authService.getCurrentUser();
            }

            // Load cart data
            await this.loadCart();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update UI
            this.updateCartUI();
            
            this.isInitialized = true;
            console.log('🛒 Cart Service initialized');
        } catch (error) {
            console.error('Cart Service initialization failed:', error);
        }
    }

    async loadCart() {
        try {
            if (this.currentUser && this.supabase) {
                // Load from database
                const { data, error } = await this.supabase
                    .from('cart_items')
                    .select(`
                        *,
                        products (
                            id,
                            title,
                            price,
                            images,
                            artisans (
                                business_name
                            )
                        )
                    `)
                    .eq('user_id', this.currentUser.id);

                if (!error && data) {
                    this.cart = data.map(item => ({
                        id: item.product_id,
                        title: item.products.title,
                        price: item.products.price,
                        image: item.products.images[0] || '',
                        quantity: item.quantity,
                        artisan: item.products.artisans?.business_name || 'Unknown Artisan'
                    }));
                } else {
                    this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
                }
            } else {
                // Guest user - load from localStorage
                this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
        }
    }

    setupEventListeners() {
        // Cart button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#cart-btn')) {
                this.toggleCart();
            } else if (e.target.closest('#cart-close')) {
                this.closeCart();
            } else if (e.target.closest('#cart-overlay')) {
                this.closeCart();
            } else if (e.target.closest('.add-to-cart-btn')) {
                this.handleAddToCart(e);
            } else if (e.target.closest('.quantity-btn')) {
                this.handleQuantityChange(e);
            } else if (e.target.closest('.remove-item')) {
                this.handleRemoveItem(e);
            }
        });

        // Listen for auth changes
        window.addEventListener('authStateChange', (e) => {
            this.currentUser = e.detail.user || null;
            this.loadCart();
        });

        // Escape key to close cart
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCart();
            }
        });
    }

    async handleAddToCart(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.target.closest('.add-to-cart-btn');
        const productId = button.getAttribute('data-product-id');
        
        if (!productId) return;

        // Show loading state
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        button.disabled = true;

        try {
            // Get product data
            const product = await this.getProductData(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            // Add to cart
            await this.addToCart(product);
            
            // Success feedback
            button.innerHTML = '<i class="fas fa-check"></i> Added!';
            button.style.background = '#4caf50';
            
            this.showNotification(`${product.title} added to cart!`, 'success');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '';
                button.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Failed to add item to cart', 'error');
            
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    async getProductData(productId) {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('products')
                    .select(`
                        *,
                        artisans (
                            business_name
                        )
                    `)
                    .eq('id', productId)
                    .single();

                if (!error && data) {
                    return {
                        id: data.id,
                        title: data.title,
                        price: data.price,
                        image: data.images[0] || '',
                        artisan: data.artisans?.business_name || 'Unknown Artisan'
                    };
                }
            }

            // Fallback to static product data
            const staticProducts = [
                {
                    id: '1',
                    title: "Handcrafted Ceramic Bowl Set",
                    price: 89.99,
                    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
                    artisan: "Sarah Martinez"
                },
                {
                    id: '2',
                    title: "Traditional Handwoven Tapestry",
                    price: 245.00,
                    image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop",
                    artisan: "Elena Rossi"
                },
                {
                    id: '3',
                    title: "Modern Wood Sculpture",
                    price: 380.00,
                    image: "https://images.unsplash.com/photo-1596367407372-96cb88503db6?w=400&h=400&fit=crop",
                    artisan: "Marcus Chen"
                },
                {
                    id: '4',
                    title: "Sterling Silver Pendant Necklace",
                    price: 125.00,
                    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
                    artisan: "Luna Crafts"
                }
            ];

            return staticProducts.find(p => p.id === productId);
        } catch (error) {
            console.error('Error getting product data:', error);
            return null;
        }
    }

    async addToCart(product, quantity = 1) {
        try {
            const existingItem = this.cart.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                this.cart.push({ ...product, quantity });
            }

            // Save to database if user is logged in
            if (this.currentUser && this.supabase) {
                await this.supabase
                    .from('cart_items')
                    .upsert({
                        user_id: this.currentUser.id,
                        product_id: product.id,
                        quantity: existingItem ? existingItem.quantity : quantity
                    });
            }

            // Always save to localStorage as backup
            this.saveCartToStorage();
            this.updateCartUI();
            
            return { success: true };
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { success: false, error: error.message };
        }
    }

    async removeFromCart(productId) {
        try {
            this.cart = this.cart.filter(item => item.id !== productId);

            // Remove from database if user is logged in
            if (this.currentUser && this.supabase) {
                await this.supabase
                    .from('cart_items')
                    .delete()
                    .eq('user_id', this.currentUser.id)
                    .eq('product_id', productId);
            }

            this.saveCartToStorage();
            this.updateCartUI();
            this.renderCartItems();
            
            return { success: true };
        } catch (error) {
            console.error('Error removing from cart:', error);
            return { success: false, error: error.message };
        }
    }

    async updateQuantity(productId, newQuantity) {
        try {
            if (newQuantity <= 0) {
                return await this.removeFromCart(productId);
            }

            const item = this.cart.find(item => item.id === productId);
            if (item) {
                item.quantity = newQuantity;

                // Update database if user is logged in
                if (this.currentUser && this.supabase) {
                    await this.supabase
                        .from('cart_items')
                        .update({ quantity: newQuantity })
                        .eq('user_id', this.currentUser.id)
                        .eq('product_id', productId);
                }

                this.saveCartToStorage();
                this.updateCartUI();
                this.renderCartItems();
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error updating quantity:', error);
            return { success: false, error: error.message };
        }
    }

    handleQuantityChange(event) {
        const button = event.target.closest('.quantity-btn');
        const cartItem = button.closest('.cart-item');
        const productId = cartItem.dataset.productId;
        const currentQuantity = parseInt(cartItem.querySelector('.quantity').textContent);
        const isIncrease = button.querySelector('.fa-plus');
        
        const newQuantity = isIncrease ? currentQuantity + 1 : currentQuantity - 1;
        this.updateQuantity(productId, newQuantity);
    }

    handleRemoveItem(event) {
        const cartItem = event.target.closest('.cart-item');
        const productId = cartItem.dataset.productId;
        this.removeFromCart(productId);
        this.showNotification('Item removed from cart', 'info');
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (cartSidebar && cartOverlay) {
            const isOpen = cartSidebar.classList.contains('show');
            
            if (isOpen) {
                this.closeCart();
            } else {
                this.openCart();
            }
        }
    }

    openCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (cartSidebar && cartOverlay) {
            cartSidebar.classList.add('show');
            cartOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
            this.renderCartItems();
        }
    }

    closeCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (cartSidebar && cartOverlay) {
            cartSidebar.classList.remove('show');
            cartOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        const cartEmpty = document.getElementById('cart-empty');
        const cartItems = document.getElementById('cart-items');
        const cartFooter = document.getElementById('cart-footer');
        const cartTotal = document.getElementById('cart-total');
        
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Update cart count with animation
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
            
            if (totalItems > 0) {
                cartCount.style.animation = 'bounce 0.3s ease';
                setTimeout(() => {
                    cartCount.style.animation = '';
                }, 300);
            }
        }
        
        // Update cart content visibility
        if (this.cart.length === 0) {
            if (cartEmpty) cartEmpty.style.display = 'block';
            if (cartItems) cartItems.style.display = 'none';
            if (cartFooter) cartFooter.style.display = 'none';
        } else {
            if (cartEmpty) cartEmpty.style.display = 'none';
            if (cartItems) cartItems.style.display = 'block';
            if (cartFooter) cartFooter.style.display = 'block';
            
            if (cartTotal) cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
        }
    }

    renderCartItems() {
        const cartItemsContainer = document.getElementById('cart-items');
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = this.cart.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="cart-item__image">
                    <img src="${item.image || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100'}" alt="${item.title}">
                </div>
                <div class="cart-item__info">
                    <h4 class="cart-item__title">${item.title}</h4>
                    <p class="cart-item__artisan">by ${item.artisan}</p>
                    <div class="cart-item__controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn" type="button">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn" type="button">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div class="cart-item__price">$${(item.price * item.quantity).toFixed(2)}</div>
                        <button class="remove-item" type="button">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    saveCartToStorage() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Public API
    getCart() {
        return this.cart;
    }

    getCartCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
}

// Initialize and export
window.cartService = new CartService();
export default window.cartService;