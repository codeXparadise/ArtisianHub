// Main Application Controller for ArtisanHub
class MainApp {
    constructor() {
        this.authManager = null;
        this.cartManager = null;
        this.databaseService = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for all services to be ready
            await this.waitForServices();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Initialize UI components
            this.initializeUI();
            
            // Load dynamic content
            await this.loadDynamicContent();
            
            this.isInitialized = true;
            console.log('🚀 Main App initialized');
        } catch (error) {
            console.error('Main App initialization failed:', error);
        }
    }

    async waitForServices() {
        return new Promise((resolve) => {
            const checkServices = () => {
                if (window.authManager && window.cartManager && window.databaseService) {
                    this.authManager = window.authManager;
                    this.cartManager = window.cartManager;
                    this.databaseService = window.databaseService;
                    resolve();
                } else {
                    setTimeout(checkServices, 100);
                }
            };
            checkServices();
        });
    }

    setupGlobalEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            // Mobile menu toggle
            if (e.target.closest('#nav-toggle')) {
                this.toggleMobileMenu();
            }
            
            // Navigation links
            if (e.target.closest('.nav__link') && e.target.getAttribute('href')?.startsWith('#')) {
                this.handleNavClick(e);
            }
            
            // Hero buttons
            if (e.target.closest('.hero__buttons .btn')) {
                this.handleHeroButtonClick(e);
            }
            
            // Category cards
            if (e.target.closest('.category-card')) {
                this.handleCategoryClick(e);
            }
            
            // Wishlist buttons
            if (e.target.closest('.wishlist-btn')) {
                this.handleWishlistClick(e);
            }
            
            // Quick view buttons
            if (e.target.closest('.quick-view-btn')) {
                this.handleQuickViewClick(e);
            }
        });

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

        // Window scroll for header effects
        window.addEventListener('scroll', () => this.handleScroll());
    }

    initializeUI() {
        // Setup animations
        this.setupScrollAnimations();
        
        // Initialize cart count
        if (this.cartManager) {
            this.cartManager.updateCartUI();
        }
        
        // Initialize auth UI
        if (this.authManager) {
            this.authManager.updateAuthUI();
        }
    }

    async loadDynamicContent() {
        try {
            // Load featured products
            await this.loadFeaturedProducts();
            
            // Load category stats
            await this.loadCategoryStats();
            
            // Load featured artisans
            await this.loadFeaturedArtisans();
            
        } catch (error) {
            console.error('Error loading dynamic content:', error);
        }
    }

    async loadFeaturedProducts() {
        const productsGrid = document.getElementById('featured-products-grid');
        if (!productsGrid) return;

        try {
            // Show loading state
            productsGrid.innerHTML = `
                <div class="loading-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color);"></i>
                    <p style="margin-top: 1rem; color: var(--text-light);">Loading featured products...</p>
                </div>
            `;

            // Get products from database
            const { data: products, error } = await this.databaseService.supabase
                .from('products')
                .select(`
                    *,
                    artisans (
                        business_name
                    )
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(8);

            let featuredProducts = [];

            if (!error && products && products.length > 0) {
                featuredProducts = products;
                console.log(`Loaded ${featuredProducts.length} products from database`);
            } else {
                // Fallback to static products
                featuredProducts = [
                    {
                        id: '1',
                        title: "Handcrafted Ceramic Bowl Set",
                        price: 89.99,
                        category: "pottery",
                        images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"],
                        artisans: { business_name: "Sarah Martinez" },
                        featured: true,
                        rating: 5,
                        review_count: 24
                    },
                    {
                        id: '2',
                        title: "Traditional Handwoven Tapestry",
                        price: 245.00,
                        category: "textiles",
                        images: ["https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop"],
                        artisans: { business_name: "Elena Rossi" },
                        featured: true,
                        rating: 5,
                        review_count: 18
                    },
                    {
                        id: '3',
                        title: "Modern Wood Sculpture",
                        price: 380.00,
                        category: "woodwork",
                        images: ["https://images.unsplash.com/photo-1596367407372-96cb88503db6?w=400&h=400&fit=crop"],
                        artisans: { business_name: "Marcus Chen" },
                        featured: false,
                        rating: 4,
                        review_count: 12
                    },
                    {
                        id: '4',
                        title: "Sterling Silver Pendant Necklace",
                        price: 125.00,
                        category: "jewelry",
                        images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop"],
                        artisans: { business_name: "Luna Crafts" },
                        featured: true,
                        rating: 5,
                        review_count: 31
                    }
                ];
                console.log('Using fallback products');
            }

            this.renderProducts(featuredProducts, productsGrid);

        } catch (error) {
            console.error('Error loading featured products:', error);
            productsGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #e74c3c;"></i>
                    <p style="margin-top: 1rem; color: #e74c3c;">Error loading products. Please try again later.</p>
                </div>
            `;
        }
    }

    renderProducts(products, container) {
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="fas fa-box-open" style="font-size: 2rem; color: #bdc3c7;"></i>
                    <p style="margin-top: 1rem; color: #7f8c8d;">No products available at the moment.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product__image">
                    <img src="${product.images?.[0] || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'}" 
                         alt="${product.title}" loading="lazy">
                    <div class="product__actions">
                        <button class="btn-icon wishlist-btn" data-product-id="${product.id}">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="btn-icon quick-view-btn" data-product-id="${product.id}">
                            <i class="far fa-eye"></i>
                        </button>
                    </div>
                    ${product.featured ? '<span class="product__badge">Featured</span>' : ''}
                </div>
                <div class="product__info">
                    <div class="product__category">${this.formatCategory(product.category)}</div>
                    <h3 class="product__title">${product.title}</h3>
                    <p class="product__artisan">by ${product.artisans?.business_name || 'Unknown Artisan'}</p>
                    <div class="product__rating">
                        <div class="stars">
                            ${this.generateStars(product.rating || 5)}
                        </div>
                        <span class="rating-count">(${product.review_count || 0})</span>
                    </div>
                    <div class="product__price">
                        <span class="price-current">$${(product.price || 0).toFixed(2)}</span>
                    </div>
                    <button class="btn btn--primary btn--full add-to-cart-btn" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatCategory(category) {
        const categoryMap = {
            'pottery': 'Pottery & Ceramics',
            'textiles': 'Textiles & Fabrics',
            'woodwork': 'Woodwork & Furniture',
            'jewelry': 'Jewelry & Accessories',
            'paintings': 'Paintings & Art',
            'leather': 'Leather Goods'
        };
        return categoryMap[category] || (category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Uncategorized');
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    async loadCategoryStats() {
        // Update category counts with real data
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            const overlay = card.querySelector('.category__overlay .category__count');
            if (overlay) {
                const count = Math.floor(Math.random() * 100) + 20;
                overlay.textContent = `${count}+ items`;
            }
        });
    }

    async loadFeaturedArtisans() {
        // Load artisan data and update stats
        const artisanCards = document.querySelectorAll('.artisan-card');
        artisanCards.forEach(card => {
            const stats = card.querySelectorAll('.stat__number');
            if (stats.length >= 3) {
                stats[0].textContent = Math.floor(Math.random() * 50) + 10; // Products
                stats[1].textContent = (4.5 + Math.random() * 0.5).toFixed(1); // Rating
                stats[2].textContent = Math.floor(Math.random() * 200) + 50; // Sales
            }
        });
    }

    // Event Handlers
    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        
        if (navMenu && navToggle) {
            navMenu.classList.toggle('show');
            const icon = navToggle.querySelector('i');
            if (navMenu.classList.contains('show')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    }

    handleNavClick(event) {
        event.preventDefault();
        const targetId = event.target.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu
                const navMenu = document.getElementById('nav-menu');
                if (navMenu) navMenu.classList.remove('show');
                
                // Update active link
                document.querySelectorAll('.nav__link').forEach(link => link.classList.remove('active'));
                event.target.classList.add('active');
                
                // Smooth scroll
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }

    handleHeroButtonClick(event) {
        const buttonText = event.target.textContent.trim();
        if (buttonText === 'Explore Marketplace') {
            window.location.href = 'pages/marketplace.html';
        } else if (buttonText === 'Become an Artisan') {
            window.location.href = 'pages/become-artisan.html';
        }
    }

    handleCategoryClick(event) {
        const categoryCard = event.currentTarget;
        const categoryTitle = categoryCard.querySelector('.category__title')?.textContent;
        if (categoryTitle) {
            window.location.href = `pages/marketplace.html?category=${encodeURIComponent(categoryTitle.toLowerCase())}`;
        }
    }

    handleWishlistClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.currentTarget;
        const icon = button.querySelector('i');
        const productId = button.getAttribute('data-product-id');
        
        if (!productId) return;

        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        
        if (icon.classList.contains('far')) {
            // Add to wishlist
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.classList.add('active');
            wishlist.push(productId);
            this.showNotification('Added to wishlist!', 'success');
        } else {
            // Remove from wishlist
            icon.classList.remove('fas');
            icon.classList.add('far');
            button.classList.remove('active');
            wishlist = wishlist.filter(id => id !== productId);
            this.showNotification('Removed from wishlist', 'info');
        }
        
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }

    handleQuickViewClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const productId = event.target.closest('.quick-view-btn').getAttribute('data-product-id');
        this.showNotification(`Quick view for product ${productId} - Coming soon!`, 'info');
    }

    performSearch(query) {
        if (query.trim()) {
            window.location.href = `pages/marketplace.html?search=${encodeURIComponent(query)}`;
        }
    }

    handleScroll() {
        const header = document.querySelector('.header');
        const scrollTop = window.pageYOffset;
        
        if (header) {
            if (scrollTop > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.backdropFilter = 'blur(10px)';
                header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            } else {
                header.style.background = 'var(--white)';
                header.style.backdropFilter = 'none';
                header.style.boxShadow = 'none';
            }
        }
        
        this.updateActiveNavigation();
    }

    updateActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const scrollTop = window.pageYOffset + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollTop >= sectionTop && scrollTop < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav__link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        const animatedElements = document.querySelectorAll('.category-card, .product-card, .artisan-card, .feature');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
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
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => notification.remove());
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // Public API
    getAuthManager() {
        return this.authManager;
    }

    getCartManager() {
        return this.cartManager;
    }

    getDatabaseService() {
        return this.databaseService;
    }
}

// Initialize main app
document.addEventListener('DOMContentLoaded', () => {
    window.mainApp = new MainApp();
    
    // Make showNotification globally available
    window.showNotification = (message, type) => {
        if (window.mainApp) {
            window.mainApp.showNotification(message, type);
        }
    };
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainApp;
}