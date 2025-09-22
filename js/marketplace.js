// Marketplace System for ArtisanHub with Database Integration
class MarketplaceSystem {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.products = [];
        this.filteredProducts = [];
        this.currentFilters = {
            categories: [],
            priceRange: { min: 0, max: 1000 },
            rating: 0,
            sortBy: 'featured',
            searchTerm: ''
        };
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.init();
    }

    async init() {
        try {
            // Wait for database service to be ready
            if (window.databaseService) {
                await window.databaseService.initPromise;
                this.db = window.databaseService;
            }
            
            await this.loadProducts();
            this.setupEventListeners();
            this.setupFilters();
            this.updateCartDisplay();
            this.isInitialized = true;
            
            console.log('🛒 Marketplace System initialized');
        } catch (error) {
            console.error('Error initializing marketplace system:', error);
            this.showFallbackProducts();
        }
    }

    async loadProducts() {
        try {
            // Load products from database
            if (this.db) {
                const result = await this.db.getProducts({ status: 'active' });
                
                if (result.success && result.data && result.data.length > 0) {
                    this.products = result.data;
                    console.log(`Loaded ${this.products.length} products from database`);
                } else {
                    console.log('No products found in database, showing sample products');
                    this.showFallbackProducts();
                    return;
                }
            } else {
                this.showFallbackProducts();
                return;
            }
            
            // Apply initial filtering and sorting
            this.applyFiltersAndSort();
            this.renderProducts();
            this.updateProductCount();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showFallbackProducts();
        }
    }

    showFallbackProducts() {
        // Fallback products for demo when database is not available
        this.products = [
            {
                id: 1,
                title: "Handwoven Ceramic Bowl",
                description: "Beautiful ceramic bowl with intricate patterns, perfect for serving or display",
                price: 45.99,
                images: ["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400"],
                category: "pottery",
                artisan: { name: "Maria Santos", id: 1 },
                rating: 4.8,
                reviews: 24,
                featured: true,
                created_at: "2024-01-15"
            },
            {
                id: 2,
                title: "Silver Moon Necklace",
                description: "Elegant sterling silver necklace with moon pendant, handcrafted with love",
                price: 89.99,
                images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400"],
                category: "jewelry",
                artisan: { name: "David Kim", id: 2 },
                rating: 4.9,
                reviews: 31,
                featured: true,
                created_at: "2024-02-05"
            },
            {
                id: 3,
                title: "Wooden Coffee Table",
                description: "Rustic oak coffee table with live edge, perfect for modern and traditional homes",
                price: 299.99,
                images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400"],
                category: "woodwork",
                artisan: { name: "John Miller", id: 3 },
                rating: 4.7,
                reviews: 18,
                featured: false,
                created_at: "2024-01-22"
            },
            {
                id: 4,
                title: "Bohemian Macramé Wall Art",
                description: "Handwoven macramé wall hanging with intricate patterns and natural cotton",
                price: 78.50,
                images: ["https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400"],
                category: "textiles",
                artisan: { name: "Elena Rossi", id: 4 },
                rating: 4.6,
                reviews: 15,
                featured: false,
                created_at: "2024-01-30"
            },
            {
                id: 5,
                title: "Watercolor Landscape",
                description: "Original watercolor painting of mountain landscape, signed by the artist",
                price: 320.00,
                images: ["https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400"],
                category: "paintings",
                artisan: { name: "Isabella Art", id: 5 },
                rating: 5.0,
                reviews: 22,
                featured: true,
                created_at: "2024-02-12"
            },
            {
                id: 6,
                title: "Hand-blown Glass Vase",
                description: "Unique hand-blown glass vase with swirled colors, perfect centerpiece",
                price: 156.00,
                images: ["https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400"],
                category: "glasswork",
                artisan: { name: "Glass Studio Co", id: 6 },
                rating: 4.5,
                reviews: 12,
                featured: false,
                created_at: "2024-02-01"
            }
        ];
        
        this.applyFiltersAndSort();
        this.renderProducts();
        this.updateProductCount();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('.search__input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Sort dropdown
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sortBy = e.target.value;
                this.applyFiltersAndSort();
                this.renderProducts();
            });
        }

        // View toggle
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.toggleView(btn.dataset.view);
            });
        });

        // Cart button
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.toggleCart());
        }
    }

    setupFilters() {
        // Category filters
        const categoryFilters = document.querySelectorAll('input[name="category"]');
        categoryFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.updateCategoryFilters();
            });
        });

        // Filter toggle for mobile
        const filterToggle = document.getElementById('filter-toggle');
        if (filterToggle) {
            filterToggle.addEventListener('click', () => {
                const sidebar = document.getElementById('filters-sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('show');
                }
            });
        }
    }

    updateCategoryFilters() {
        const checkedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
            .map(input => input.value);
        
        this.currentFilters.categories = checkedCategories;
        this.applyFiltersAndSort();
        this.renderProducts();
        this.updateActiveFilters();
    }

    handleSearch(searchTerm) {
        this.currentFilters.searchTerm = searchTerm.toLowerCase();
        this.applyFiltersAndSort();
        this.renderProducts();
    }

    applyFiltersAndSort() {
        let filtered = [...this.products];

        // Apply search filter
        if (this.currentFilters.searchTerm) {
            filtered = filtered.filter(product => 
                product.title.toLowerCase().includes(this.currentFilters.searchTerm) ||
                product.description.toLowerCase().includes(this.currentFilters.searchTerm) ||
                product.category.toLowerCase().includes(this.currentFilters.searchTerm) ||
                (product.artisan?.name || product.artisan_name || '').toLowerCase().includes(this.currentFilters.searchTerm)
            );
        }

        // Apply category filter
        if (this.currentFilters.categories.length > 0) {
            filtered = filtered.filter(product => 
                this.currentFilters.categories.includes(product.category)
            );
        }

        // Apply price range filter
        filtered = filtered.filter(product => 
            product.price >= this.currentFilters.priceRange.min &&
            product.price <= this.currentFilters.priceRange.max
        );

        // Apply sorting
        switch (this.currentFilters.sortBy) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                break;
            case 'featured':
            default:
                filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
                break;
        }

        this.filteredProducts = filtered;
        this.updateProductCount();
    }

    renderProducts() {
        let productsGrid = document.querySelector('.products-grid');
        
        if (!productsGrid) {
            productsGrid = this.createProductsGrid();
        }
        
        if (this.filteredProducts.length === 0) {
            productsGrid.innerHTML = `
                <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 10px; color: #2c3e50;">No products found</h3>
                    <p style="color: #7f8c8d;">Try adjusting your filters or search terms</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = this.filteredProducts.map(product => this.createProductCard(product)).join('');
        
        // Add click listeners to product cards
        this.setupProductListeners();
    }

    createProductsGrid() {
        // Find the marketplace layout container
        let container = document.querySelector('.marketplace-layout');
        
        if (!container) {
            // If no marketplace layout, find a suitable container
            container = document.querySelector('.marketplace-products .container') || 
                       document.querySelector('.container');
            
            if (container && !container.querySelector('.marketplace-layout')) {
                const layout = document.createElement('div');
                layout.className = 'marketplace-layout';
                layout.style.cssText = 'display: grid; grid-template-columns: 280px 1fr; gap: 30px; margin-top: 30px;';
                
                // Move existing content to layout
                const existingContent = Array.from(container.children);
                existingContent.forEach(child => layout.appendChild(child));
                container.appendChild(layout);
                container = layout;
            }
        }
        
        const grid = document.createElement('div');
        grid.className = 'products-grid';
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 30px;
            padding: 0;
        `;
        
        container.appendChild(grid);
        return grid;
    }

    createProductCard(product) {
        const imageUrl = product.images && product.images[0] ? 
            (product.images[0].startsWith('data:') ? product.images[0] : product.images[0]) : 
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400';
            
        const artisanName = product.artisan?.name || product.artisan_name || 'Unknown Artisan';
        const rating = product.rating || 0;
        const reviews = product.reviews || 0;

        return `
            <div class="product-card" data-product-id="${product.id}" style="
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                cursor: pointer;
                border: 1px solid #f0f0f0;
            ">
                <div class="product-image" style="
                    position: relative;
                    width: 100%;
                    height: 250px;
                    overflow: hidden;
                ">
                    <img src="${imageUrl}" alt="${product.title}" style="
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        transition: transform 0.3s ease;
                    " loading="lazy">
                    <div class="product-overlay" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    ">
                        <button class="btn btn--sm btn--primary" onclick="event.stopPropagation(); marketplace.addToCart(${product.id})" style="
                            background: #3498db;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-size: 0.9rem;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        ">
                            <i class="fas fa-shopping-cart"></i>
                            Add to Cart
                        </button>
                        <button class="btn btn--sm btn--outline" onclick="event.stopPropagation(); marketplace.viewProduct(${product.id})" style="
                            background: transparent;
                            color: white;
                            border: 2px solid white;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-size: 0.9rem;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        ">
                            <i class="fas fa-eye"></i>
                            View
                        </button>
                    </div>
                    ${product.featured ? `<div class="product-badge" style="
                        position: absolute;
                        top: 15px;
                        left: 15px;
                        background: #e74c3c;
                        color: white;
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-size: 0.8rem;
                        font-weight: 600;
                    ">Featured</div>` : ''}
                </div>
                <div class="product-info" style="padding: 20px;">
                    <div class="product-meta" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span class="product-category" style="
                            background: #ecf0f1;
                            color: #7f8c8d;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 0.8rem;
                            text-transform: capitalize;
                        ">${this.formatCategory(product.category)}</span>
                        ${rating > 0 ? `<div class="product-rating" style="display: flex; align-items: center; gap: 5px;">
                            <span class="rating-stars" style="color: #f39c12;">${this.generateStars(rating)}</span>
                            <span class="rating-count" style="color: #7f8c8d; font-size: 0.9rem;">(${reviews})</span>
                        </div>` : ''}
                    </div>
                    <h3 class="product-title" style="
                        font-size: 1.1rem;
                        font-weight: 600;
                        margin-bottom: 8px;
                        color: #2c3e50;
                        line-height: 1.4;
                    ">${product.title}</h3>
                    <p class="product-description" style="
                        color: #7f8c8d;
                        font-size: 0.9rem;
                        line-height: 1.4;
                        margin-bottom: 15px;
                    ">${this.truncateText(product.description, 80)}</p>
                    <div class="product-footer" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="product-price" style="
                            font-size: 1.2rem;
                            font-weight: 700;
                            color: #2c3e50;
                        ">$${product.price}</div>
                        <div class="product-artisan" style="
                            color: #7f8c8d;
                            font-size: 0.9rem;
                        ">by ${artisanName}</div>
                    </div>
                </div>
            </div>
        `;
    }

    setupProductListeners() {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            // Hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
                
                const overlay = card.querySelector('.product-overlay');
                if (overlay) overlay.style.opacity = '1';
                
                const image = card.querySelector('.product-image img');
                if (image) image.style.transform = 'scale(1.05)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                
                const overlay = card.querySelector('.product-overlay');
                if (overlay) overlay.style.opacity = '0';
                
                const image = card.querySelector('.product-image img');
                if (image) image.style.transform = 'scale(1)';
            });
            
            // Click to view product
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const productId = card.dataset.productId;
                    this.viewProduct(productId);
                }
            });
        });
    }

    formatCategory(category) {
        return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Uncategorized';
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    truncateText(text, limit) {
        if (!text) return '';
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id == productId) || 
                      this.filteredProducts.find(p => p.id == productId);
        
        if (!product) return;

        const existingItem = this.cart.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.images?.[0] || '',
                quantity: 1,
                artisan: product.artisan?.name || product.artisan_name || 'Unknown'
            });
        }

        this.saveCart();
        this.updateCartDisplay();
        this.showNotification(`${product.title} added to cart!`, 'success');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id != productId);
        this.saveCart();
        this.updateCartDisplay();
        this.renderCartItems();
    }

    updateCartQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id == productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartDisplay();
                this.renderCartItems();
            }
        }
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    toggleCart() {
        let cartSidebar = document.getElementById('cart-sidebar');
        
        if (!cartSidebar) {
            cartSidebar = this.createCartSidebar();
        }
        
        cartSidebar.classList.toggle('active');
        this.renderCartItems();
    }

    createCartSidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'cart-sidebar';
        sidebar.className = 'cart-sidebar';
        sidebar.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: white;
            box-shadow: -5px 0 15px rgba(0,0,0,0.1);
            z-index: 10000;
            transition: right 0.3s ease;
            display: flex;
            flex-direction: column;
        `;
        
        sidebar.innerHTML = `
            <div class="cart-header" style="
                padding: 20px;
                border-bottom: 1px solid #ecf0f1;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0; color: #2c3e50;">Shopping Cart</h3>
                <button class="cart-close" onclick="marketplace.toggleCart()" style="
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    color: #7f8c8d;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="cart-items" id="cart-items" style="
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            "></div>
            <div class="cart-footer" style="
                padding: 20px;
                border-top: 1px solid #ecf0f1;
                background: #f8f9fa;
            ">
                <div class="cart-total" style="
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-bottom: 15px;
                    text-align: center;
                    color: #2c3e50;
                ">
                    Total: $<span id="cart-total">0.00</span>
                </div>
                <button class="btn btn--primary btn--full" onclick="marketplace.proceedToCheckout()" style="
                    width: 100%;
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                ">
                    Proceed to Checkout
                </button>
            </div>
        `;
        
        // Add active class style
        const style = document.createElement('style');
        style.textContent = `
            .cart-sidebar.active {
                right: 0 !important;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(sidebar);
        return sidebar;
    }

    renderCartItems() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartItems) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="cart-empty" style="
                    text-align: center;
                    padding: 40px 20px;
                    color: #7f8c8d;
                ">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            if (cartTotal) cartTotal.textContent = '0.00';
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item" style="
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px solid #ecf0f1;
            ">
                <img src="${item.image || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100'}" 
                     alt="${item.title}" 
                     style="
                        width: 60px;
                        height: 60px;
                        object-fit: cover;
                        border-radius: 8px;
                     ">
                <div class="cart-item-info" style="flex: 1;">
                    <h4 style="
                        margin: 0 0 5px 0;
                        font-size: 0.9rem;
                        color: #2c3e50;
                        line-height: 1.3;
                    ">${item.title}</h4>
                    <p style="
                        margin: 0 0 10px 0;
                        color: #7f8c8d;
                        font-size: 0.8rem;
                    ">by ${item.artisan || 'Unknown'}</p>
                    <div class="cart-item-controls" style="
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <button onclick="marketplace.updateCartQuantity(${item.id}, ${item.quantity - 1})" style="
                            width: 24px;
                            height: 24px;
                            border: 1px solid #ddd;
                            background: white;
                            border-radius: 4px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">-</button>
                        <span style="min-width: 20px; text-align: center;">${item.quantity}</span>
                        <button onclick="marketplace.updateCartQuantity(${item.id}, ${item.quantity + 1})" style="
                            width: 24px;
                            height: 24px;
                            border: 1px solid #ddd;
                            background: white;
                            border-radius: 4px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">+</button>
                        <div style="margin-left: auto; display: flex; align-items: center; gap: 10px;">
                            <span style="font-weight: 600; color: #2c3e50;">$${(item.price * item.quantity).toFixed(2)}</span>
                            <button onclick="marketplace.removeFromCart(${item.id})" style="
                                background: none;
                                border: none;
                                color: #e74c3c;
                                cursor: pointer;
                                padding: 4px;
                            ">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (cartTotal) cartTotal.textContent = total.toFixed(2);
    }

    viewProduct(productId) {
        const product = this.products.find(p => p.id == productId) || 
                      this.filteredProducts.find(p => p.id == productId);
        
        if (product) {
            this.showProductModal(product);
        }
    }

    showProductModal(product) {
        const modal = document.createElement('div');
        modal.className = 'product-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()" style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
            "></div>
            <div class="modal-content" style="
                position: relative;
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <button class="modal-close" onclick="this.closest('.product-modal').remove()" style="
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    cursor: pointer;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-body">
                    <div class="product-images" style="
                        width: 100%;
                        height: 300px;
                        overflow: hidden;
                        border-radius: 16px 16px 0 0;
                    ">
                        <img src="${product.images?.[0] || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500'}" 
                             alt="${product.title}"
                             style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="product-details" style="padding: 30px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <h2 style="margin: 0; color: #2c3e50; font-size: 1.5rem;">${product.title}</h2>
                            <p style="
                                margin: 0;
                                font-size: 1.3rem;
                                font-weight: 700;
                                color: #3498db;
                            ">$${product.price}</p>
                        </div>
                        <p style="
                            color: #7f8c8d;
                            margin-bottom: 15px;
                            font-size: 0.9rem;
                        ">by ${product.artisan?.name || product.artisan_name || 'Unknown Artisan'}</p>
                        <p style="
                            color: #2c3e50;
                            line-height: 1.6;
                            margin-bottom: 25px;
                        ">${product.description}</p>
                        ${product.rating ? `
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                                <span style="color: #f39c12;">${this.generateStars(product.rating)}</span>
                                <span style="color: #7f8c8d;">${product.rating} (${product.reviews || 0} reviews)</span>
                            </div>
                        ` : ''}
                        <div class="product-actions" style="
                            display: flex;
                            gap: 15px;
                            margin-top: 20px;
                        ">
                            <button onclick="marketplace.addToCart(${product.id}); this.closest('.product-modal').remove();" style="
                                flex: 1;
                                background: #3498db;
                                color: white;
                                border: none;
                                padding: 12px 20px;
                                border-radius: 8px;
                                font-size: 1rem;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-shopping-cart"></i>
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }
        
        // In a real app, this would navigate to checkout page
        this.showNotification('Checkout functionality coming soon!', 'info');
    }

    updateProductCount() {
        const count = this.filteredProducts.length;
        let countElement = document.querySelector('.results-count');
        
        if (!countElement) {
            // Create results count element
            const filtersSection = document.querySelector('.filters-section .container');
            if (filtersSection) {
                countElement = document.createElement('div');
                countElement.className = 'results-count';
                countElement.style.cssText = 'margin-top: 15px; color: #7f8c8d; font-size: 0.9rem;';
                filtersSection.appendChild(countElement);
            }
        }
        
        if (countElement) {
            countElement.textContent = `${count} product${count !== 1 ? 's' : ''} found`;
        }
    }

    updateActiveFilters() {
        const activeFiltersContainer = document.getElementById('active-filters');
        if (!activeFiltersContainer) return;

        const filters = [];
        
        // Add category filters
        this.currentFilters.categories.forEach(category => {
            filters.push({
                type: 'category',
                value: category,
                label: this.formatCategory(category)
            });
        });

        if (filters.length === 0) {
            activeFiltersContainer.innerHTML = '';
            return;
        }

        activeFiltersContainer.innerHTML = filters.map(filter => `
            <span class="active-filter" style="
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: #3498db;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8rem;
                margin-right: 8px;
            ">
                ${filter.label}
                <button onclick="marketplace.removeFilter('${filter.type}', '${filter.value}')" style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 3px;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
    }

    removeFilter(type, value) {
        if (type === 'category') {
            this.currentFilters.categories = this.currentFilters.categories.filter(cat => cat !== value);
            
            // Update checkbox
            const checkbox = document.querySelector(`input[name="category"][value="${value}"]`);
            if (checkbox) checkbox.checked = false;
        }

        this.applyFiltersAndSort();
        this.renderProducts();
        this.updateActiveFilters();
    }

    toggleView(view) {
        const productsGrid = document.querySelector('.products-grid');
        if (productsGrid) {
            if (view === 'list') {
                productsGrid.style.gridTemplateColumns = '1fr';
            } else {
                productsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
            }
        }
    }

    showNotification(message, type = 'info') {
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

    // Public methods
    getProducts() {
        return this.products;
    }

    getCart() {
        return this.cart;
    }

    getFilteredProducts() {
        return this.filteredProducts;
    }
}

// Initialize marketplace system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.marketplace = new MarketplaceSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketplaceSystem;
}