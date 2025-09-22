// Dynamic Homepage Product System for ArtisanHub
class HomepageProductManager {
    constructor() {
        this.db = null;
        this.featuredProducts = [];
        this.categories = [];
        this.artisans = [];
        
        this.init();
    }

    async init() {
        try {
            // Wait for database service
            if (window.databaseService) {
                await window.databaseService.initPromise;
                this.db = window.databaseService;
            }
            
            // Load data
            await this.loadHomePageData();
            
            // Render dynamic content
            this.renderFeaturedProducts();
            this.renderCategoryStats();
            this.renderFeaturedArtisans();
            
            // Setup interactions
            this.setupEventListeners();
            
            console.log('🏠 Homepage Product Manager initialized');
        } catch (error) {
            console.error('Error initializing homepage manager:', error);
        }
    }

    async loadHomePageData() {
        try {
            // Load featured products
            const featuredResult = await this.db.getProducts({ 
                status: 'active', 
                featured: true, 
                limit: 8,
                sortBy: 'created_at',
                sortOrder: 'desc'
            });
            
            if (featuredResult.success) {
                this.featuredProducts = featuredResult.data;
            }

            // If no featured products, get recent products
            if (this.featuredProducts.length === 0) {
                const recentResult = await this.db.getProducts({ 
                    status: 'active', 
                    limit: 8,
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                });
                
                if (recentResult.success) {
                    this.featuredProducts = recentResult.data;
                }
            }

            // Load category statistics
            await this.loadCategoryStats();
            
            // Load featured artisans
            await this.loadFeaturedArtisans();

        } catch (error) {
            console.error('Error loading homepage data:', error);
        }
    }

    async loadCategoryStats() {
        try {
            const categories = ['pottery', 'textiles', 'woodwork', 'jewelry', 'paintings', 'leather'];
            this.categories = [];

            for (const category of categories) {
                const result = await this.db.getProducts({ 
                    status: 'active', 
                    category: category 
                });
                
                if (result.success) {
                    this.categories.push({
                        name: category,
                        count: result.data.length,
                        displayName: this.getCategoryDisplayName(category),
                        image: this.getCategoryImage(category)
                    });
                }
            }
        } catch (error) {
            console.error('Error loading category stats:', error);
        }
    }

    async loadFeaturedArtisans() {
        try {
            // Get unique artisan IDs from products
            const artisanIds = [...new Set(this.featuredProducts.map(p => p.artisanId))];
            
            this.artisans = [];
            
            for (const artisanId of artisanIds.slice(0, 3)) {
                // Get artisan products for statistics
                const productsResult = await this.db.getProducts({ 
                    artisanId: artisanId,
                    status: 'active'
                });

                if (productsResult.success && productsResult.data.length > 0) {
                    const products = productsResult.data;
                    const artisanName = products[0].artisanName;
                    const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
                    const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);
                    
                    this.artisans.push({
                        id: artisanId,
                        name: artisanName,
                        productCount: products.length,
                        totalViews: totalViews,
                        totalSales: totalSales,
                        rating: 4.5 + Math.random() * 0.5, // Mock rating
                        specialty: products[0].category,
                        location: this.getRandomLocation(),
                        avatar: `https://images.unsplash.com/photo-${this.getRandomAvatarId()}?w=200&h=200&fit=crop&crop=face`
                    });
                }
            }
        } catch (error) {
            console.error('Error loading featured artisans:', error);
        }
    }

    renderFeaturedProducts() {
        const productsContainer = document.querySelector('.products__grid');
        if (!productsContainer) return;

        if (this.featuredProducts.length === 0) {
            productsContainer.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <h3>No Products Available</h3>
                    <p>Be the first artisan to showcase your beautiful creations!</p>
                    <a href="pages/become-artisan.html" class="btn btn--primary">Become an Artisan</a>
                </div>
            `;
            return;
        }

        const productsHTML = this.featuredProducts.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product__image">
                    <img src="${product.images[0] || 'https://via.placeholder.com/400x400'}" 
                         alt="${product.title}" 
                         loading="lazy">
                    <div class="product__actions">
                        <button class="btn-icon wishlist-btn" onclick="homepageManager.toggleWishlist('${product.id}')">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="btn-icon quick-view-btn" onclick="homepageManager.quickView('${product.id}')">
                            <i class="far fa-eye"></i>
                        </button>
                    </div>
                    ${product.featured ? '<span class="product__badge">Featured</span>' : ''}
                    ${product.quantity <= 5 ? '<span class="product__badge product__badge--warning">Limited</span>' : ''}
                </div>
                <div class="product__info">
                    <div class="product__category">${this.getCategoryDisplayName(product.category)}</div>
                    <h3 class="product__title">${product.title}</h3>
                    <p class="product__artisan">by ${product.artisanName}</p>
                    <div class="product__rating">
                        <div class="stars">
                            ${'<i class="fas fa-star"></i>'.repeat(5)}
                        </div>
                        <span class="rating-count">(${Math.floor(Math.random() * 50) + 5})</span>
                    </div>
                    <div class="product__price">
                        <span class="price-current">$${product.price.toFixed(2)}</span>
                    </div>
                    <button class="btn btn--primary btn--full add-to-cart-btn" 
                            onclick="homepageManager.addToCart('${product.id}')"
                            data-product-id="${product.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');

        productsContainer.innerHTML = productsHTML;

        // Update section header
        const sectionHeader = document.querySelector('.featured-products .section__header h2');
        if (sectionHeader) {
            sectionHeader.textContent = `Featured Products (${this.featuredProducts.length})`;
        }
    }

    renderCategoryStats() {
        const categoryGrid = document.querySelector('.categories__grid');
        if (!categoryGrid || this.categories.length === 0) return;

        const categoriesHTML = this.categories.map(category => `
            <div class="category-card" onclick="homepageManager.browseCategory('${category.name}')">
                <div class="category__image">
                    <img src="${category.image}" alt="${category.displayName}" loading="lazy">
                    <div class="category__overlay">
                        <span class="category__count">${category.count}+ items</span>
                    </div>
                </div>
                <h3 class="category__title">${category.displayName}</h3>
                <p class="category__description">Handcrafted ${category.displayName.toLowerCase()} by talented artisans</p>
            </div>
        `).join('');

        categoryGrid.innerHTML = categoriesHTML;
    }

    renderFeaturedArtisans() {
        const artisansGrid = document.querySelector('.artisans__grid');
        if (!artisansGrid || this.artisans.length === 0) return;

        const artisansHTML = this.artisans.map(artisan => `
            <div class="artisan-card" onclick="homepageManager.viewArtisan('${artisan.id}')">
                <div class="artisan__image">
                    <img src="${artisan.avatar}" alt="${artisan.name}" loading="lazy">
                    <div class="artisan__badge">Verified</div>
                </div>
                <div class="artisan__info">
                    <h3 class="artisan__name">${artisan.name}</h3>
                    <p class="artisan__craft">${this.getCategoryDisplayName(artisan.specialty)} Artist</p>
                    <div class="artisan__location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${artisan.location}</span>
                    </div>
                    <p class="artisan__bio">Creating beautiful ${artisan.specialty} with passion and expertise.</p>
                    <div class="artisan__stats">
                        <div class="stat">
                            <span class="stat__number">${artisan.productCount}</span>
                            <span class="stat__label">Products</span>
                        </div>
                        <div class="stat">
                            <span class="stat__number">${artisan.rating.toFixed(1)}</span>
                            <span class="stat__label">Rating</span>
                        </div>
                        <div class="stat">
                            <span class="stat__number">${artisan.totalSales}</span>
                            <span class="stat__label">Sales</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        artisansGrid.innerHTML = artisansHTML;
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('.search__input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }

        const searchIcon = document.querySelector('.search__icon');
        if (searchIcon) {
            searchIcon.addEventListener('click', () => {
                const searchInput = document.querySelector('.search__input');
                if (searchInput) {
                    this.performSearch(searchInput.value);
                }
            });
        }

        // View All Products button
        const viewAllBtn = document.querySelector('.featured-products .btn--outline');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                window.location.href = 'pages/marketplace.html';
            });
        }
    }

    performSearch(searchTerm) {
        if (searchTerm.trim()) {
            window.location.href = `pages/marketplace.html?search=${encodeURIComponent(searchTerm)}`;
        }
    }

    browseCategory(category) {
        window.location.href = `pages/marketplace.html?category=${category}`;
    }

    viewArtisan(artisanId) {
        window.location.href = `pages/marketplace.html?artisan=${artisanId}`;
    }

    async addToCart(productId) {
        try {
            // Get current cart
            const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
            
            // Check if item already exists
            const existingItem = cartItems.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cartItems.push({
                    id: productId,
                    quantity: 1,
                    addedAt: new Date().toISOString()
                });
            }
            
            // Save to localStorage
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            
            // Update cart UI
            this.updateCartCount();
            
            // Show success message
            this.showNotification('Product added to cart!', 'success');
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Failed to add to cart', 'error');
        }
    }

    toggleWishlist(productId) {
        try {
            const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            const index = wishlist.indexOf(productId);
            
            if (index > -1) {
                wishlist.splice(index, 1);
                this.showNotification('Removed from wishlist', 'info');
            } else {
                wishlist.push(productId);
                this.showNotification('Added to wishlist!', 'success');
            }
            
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            
            // Update wishlist button visual state
            const wishlistBtn = document.querySelector(`[onclick="homepageManager.toggleWishlist('${productId}')"] i`);
            if (wishlistBtn) {
                wishlistBtn.className = index > -1 ? 'far fa-heart' : 'fas fa-heart';
            }
            
        } catch (error) {
            console.error('Error toggling wishlist:', error);
        }
    }

    quickView(productId) {
        const product = this.featuredProducts.find(p => p.id === productId);
        if (product) {
            // Generate and open product page
            window.open(`pages/product-${productId}-${product.slug}.html`, '_blank');
        }
    }

    updateCartCount() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCountElements = document.querySelectorAll('.cart-count, #cart-count');
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
        });
    }

    getCategoryDisplayName(category) {
        const categoryMap = {
            'pottery': 'Pottery & Ceramics',
            'textiles': 'Textiles & Fabrics',
            'woodwork': 'Woodwork & Furniture',
            'jewelry': 'Jewelry & Accessories',
            'paintings': 'Paintings & Art',
            'leather': 'Leather Goods',
            'glasswork': 'Glasswork',
            'metalwork': 'Metalwork',
            'sculptures': 'Sculptures'
        };
        
        return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
    }

    getCategoryImage(category) {
        const imageMap = {
            'pottery': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
            'textiles': 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=300&h=300&fit=crop',
            'woodwork': 'https://images.unsplash.com/photo-1596367407372-96cb88503db6?w=300&h=300&fit=crop',
            'jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop',
            'paintings': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=300&h=300&fit=crop',
            'leather': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop'
        };
        
        return imageMap[category] || 'https://via.placeholder.com/300x300';
    }

    getRandomLocation() {
        const locations = [
            'Santa Fe, New Mexico',
            'Portland, Oregon',
            'Florence, Italy',
            'Barcelona, Spain',
            'Tokyo, Japan',
            'Mumbai, India',
            'Cairo, Egypt',
            'Istanbul, Turkey',
            'Lima, Peru',
            'Melbourne, Australia'
        ];
        
        return locations[Math.floor(Math.random() * locations.length)];
    }

    getRandomAvatarId() {
        const avatarIds = [
            '1494790108755-2616b612b786',
            '1507003211169-0a1dd7228f2d',
            '1438761681033-6461ffad8d80',
            '1472099645785-5658abf4ff4e',
            '1500648767791-c0a3c1c40e67',
            '1554151228-544ea1906ebb'
        ];
        
        return avatarIds[Math.floor(Math.random() * avatarIds.length)];
    }

    showNotification(message, type = 'info') {
        // Create notification element
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
        }, 3000);
    }

    // Public method to refresh homepage data
    async refresh() {
        await this.loadHomePageData();
        this.renderFeaturedProducts();
        this.renderCategoryStats();
        this.renderFeaturedArtisans();
    }
}

// Initialize homepage manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.homepageManager = new HomepageProductManager();
    
    // Initialize cart count on page load
    if (window.homepageManager) {
        window.homepageManager.updateCartCount();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomepageProductManager;
}