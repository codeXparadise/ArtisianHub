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
            sortBy: 'featured'
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
            this.showFallbackProducts(); // Show fallback products if database fails
        }
    }

    async loadProducts() {
        try {
            // Load products from database
            const result = await this.db.getProducts({ status: 'active' });
            
            if (result.success && result.data && result.data.length > 0) {
                this.products = result.data;
                console.log(`Loaded ${this.products.length} products from database`);
            } else {
                console.log('No products found in database, showing sample products');
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
        // Use the existing static product data as fallback
        this.products = allProducts || [
    {
        id: 1,
        title: "Handcrafted Ceramic Bowl Set",
        artisan: "Sarah Martinez",
        price: 89.99,
        originalPrice: 119.99,
        category: "pottery",
        location: "usa",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
        rating: 5,
        reviews: 24,
        featured: true,
        createdAt: "2024-01-15"
    },
    {
        id: 2,
        title: "Traditional Handwoven Tapestry",
        artisan: "Elena Rossi",
        price: 245.00,
        category: "textiles",
        location: "europe",
        image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop",
        rating: 5,
        reviews: 18,
        featured: true,
        createdAt: "2024-02-10"
    },
    {
        id: 3,
        title: "Modern Wood Sculpture",
        artisan: "Marcus Chen",
        price: 380.00,
        category: "woodwork",
        location: "usa",
        image: "https://images.unsplash.com/photo-1596367407372-96cb88503db6?w=400&h=400&fit=crop",
        rating: 4,
        reviews: 12,
        featured: false,
        createdAt: "2024-01-22"
    },
    {
        id: 4,
        title: "Sterling Silver Pendant Necklace",
        artisan: "Luna Crafts",
        price: 125.00,
        category: "jewelry",
        location: "usa",
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
        rating: 5,
        reviews: 31,
        featured: true,
        createdAt: "2024-02-05"
    },
    {
        id: 5,
        title: "Bohemian Macramé Wall Hanging",
        artisan: "Desert Weaving Co.",
        price: 78.50,
        category: "textiles",
        location: "usa",
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
        rating: 4,
        reviews: 15,
        featured: false,
        createdAt: "2024-01-30"
    },
    {
        id: 6,
        title: "Rustic Pine Coffee Table",
        artisan: "Mountain Woodworks",
        price: 485.00,
        category: "woodwork",
        location: "usa",
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
        rating: 5,
        reviews: 8,
        featured: false,
        createdAt: "2024-02-12"
    },
    {
        id: 7,
        title: "Watercolor Landscape Painting",
        artisan: "Isabella Art Studio",
        price: 320.00,
        category: "art",
        location: "europe",
        image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop",
        rating: 5,
        reviews: 22,
        featured: true,
        createdAt: "2024-01-18"
    },
    {
        id: 8,
        title: "Handmade Leather Messenger Bag",
        artisan: "Artisan Leather Co.",
        price: 195.00,
        category: "leather",
        location: "usa",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
        rating: 4,
        reviews: 19,
        featured: false,
        createdAt: "2024-02-08"
    },
    {
        id: 9,
        title: "Ceramic Dinnerware Set",
        artisan: "Clay & Fire Studio",
        price: 156.00,
        originalPrice: 180.00,
        category: "pottery",
        location: "usa",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
        rating: 4,
        reviews: 27,
        featured: false,
        createdAt: "2024-01-25"
    },
    {
        id: 10,
        title: "Beaded Statement Earrings",
        artisan: "Tribal Treasures",
        price: 45.00,
        category: "jewelry",
        location: "america",
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
        rating: 5,
        reviews: 33,
        featured: true,
        createdAt: "2024-02-14"
    },
    {
        id: 11,
        title: "Bamboo Cutting Board Set",
        artisan: "Eco Craft Collective",
        price: 68.00,
        category: "woodwork",
        location: "asia",
        image: "https://images.unsplash.com/photo-1596367407372-96cb88503db6?w=400&h=400&fit=crop",
        rating: 4,
        reviews: 16,
        featured: false,
        createdAt: "2024-01-28"
    },
    {
        id: 12,
        title: "Vintage Style Leather Journal",
        artisan: "Heritage Bookbinding",
        price: 89.00,
        category: "leather",
        location: "europe",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
        rating: 5,
        reviews: 14,
        featured: false,
        createdAt: "2024-02-01"
    }
];

// Marketplace state
let currentFilters = {
    categories: [],
    priceMin: 0,
    priceMax: 1000,
    rating: null,
    locations: [],
    sortBy: 'featured'
};

let currentView = 'grid';
let currentPage = 1;
let productsPerPage = 12;

// DOM Elements
const filterToggle = document.getElementById('filter-toggle');
const filtersSidebar = document.getElementById('filters-sidebar');
const sortSelect = document.getElementById('sort-select');
const viewButtons = document.querySelectorAll('.view-btn');
const productsGrid = document.getElementById('products-grid');
const activeFiltersContainer = document.getElementById('active-filters');
const clearFiltersBtn = document.querySelector('.clear-filters');

// Initialize marketplace
document.addEventListener('DOMContentLoaded', function() {
    initializeMarketplace();
});

function initializeMarketplace() {
    setupMarketplaceEventListeners();
    renderProducts(allProducts);
    updateFiltersUI();
}

// Event Listeners
function setupMarketplaceEventListeners() {
    // Filter toggle for mobile
    if (filterToggle) {
        filterToggle.addEventListener('click', toggleFilters);
    }

    // Sort dropdown
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }

    // View toggle buttons
    viewButtons.forEach(btn => {
        btn.addEventListener('click', handleViewChange);
    });

    // Filter checkboxes and radio buttons
    const filterInputs = document.querySelectorAll('.filter-option input');
    filterInputs.forEach(input => {
        input.addEventListener('change', handleFilterChange);
    });

    // Price range inputs
    const priceInputs = document.querySelectorAll('.price-input');
    priceInputs.forEach(input => {
        input.addEventListener('input', handlePriceChange);
    });

    // Clear filters button
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }

    // Price sliders
    const sliders = document.querySelectorAll('.slider');
    sliders.forEach(slider => {
        slider.addEventListener('input', handleSliderChange);
    });
}

// Toggle filters sidebar for mobile
function toggleFilters() {
    filtersSidebar.classList.toggle('show');
    const icon = filterToggle.querySelector('i');
    if (filtersSidebar.classList.contains('show')) {
        icon.classList.remove('fa-filter');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-filter');
    }
}

// Handle sort change
function handleSortChange(e) {
    currentFilters.sortBy = e.target.value;
    const filteredProducts = filterProducts(allProducts);
    const sortedProducts = sortProducts(filteredProducts);
    renderProducts(sortedProducts);
}

// Handle view change
function handleViewChange(e) {
    const viewType = e.target.closest('.view-btn').getAttribute('data-view');
    currentView = viewType;
    
    // Update active view button
    viewButtons.forEach(btn => btn.classList.remove('active'));
    e.target.closest('.view-btn').classList.add('active');
    
    // Update products grid class
    productsGrid.className = `products__grid products__grid--${viewType}`;
    
    // Re-render products with new view
    const filteredProducts = filterProducts(allProducts);
    const sortedProducts = sortProducts(filteredProducts);
    renderProducts(sortedProducts);
}

// Handle filter changes
function handleFilterChange(e) {
    const filterType = e.target.name;
    const filterValue = e.target.value;
    const isChecked = e.target.checked;

    switch (filterType) {
        case 'category':
            if (isChecked) {
                currentFilters.categories.push(filterValue);
            } else {
                currentFilters.categories = currentFilters.categories.filter(cat => cat !== filterValue);
            }
            break;
            
        case 'location':
            if (isChecked) {
                currentFilters.locations.push(filterValue);
            } else {
                currentFilters.locations = currentFilters.locations.filter(loc => loc !== filterValue);
            }
            break;
            
        case 'rating':
            currentFilters.rating = isChecked ? parseInt(filterValue) : null;
            break;
    }

    applyFilters();
}

// Handle price input changes
function handlePriceChange(e) {
    const inputId = e.target.id;
    const value = parseInt(e.target.value) || 0;

    if (inputId === 'price-min') {
        currentFilters.priceMin = value;
        document.getElementById('slider-min').value = value;
    } else if (inputId === 'price-max') {
        currentFilters.priceMax = value;
        document.getElementById('slider-max').value = value;
    }

    applyFilters();
}

// Handle slider changes
function handleSliderChange(e) {
    const sliderId = e.target.id;
    const value = parseInt(e.target.value);

    if (sliderId === 'slider-min') {
        currentFilters.priceMin = value;
        document.getElementById('price-min').value = value;
    } else if (sliderId === 'slider-max') {
        currentFilters.priceMax = value;
        document.getElementById('price-max').value = value;
    }

    applyFilters();
}

// Apply current filters
function applyFilters() {
    const filteredProducts = filterProducts(allProducts);
    const sortedProducts = sortProducts(filteredProducts);
    renderProducts(sortedProducts);
    updateActiveFilters();
    updateResultsCount(filteredProducts.length);
}

// Filter products based on current filters
function filterProducts(products) {
    return products.filter(product => {
        // Category filter
        if (currentFilters.categories.length > 0 && !currentFilters.categories.includes(product.category)) {
            return false;
        }

        // Location filter
        if (currentFilters.locations.length > 0 && !currentFilters.locations.includes(product.location)) {
            return false;
        }

        // Price filter
        if (product.price < currentFilters.priceMin || product.price > currentFilters.priceMax) {
            return false;
        }

        // Rating filter
        if (currentFilters.rating && product.rating < currentFilters.rating) {
            return false;
        }

        return true;
    });
}

// Sort products
function sortProducts(products) {
    const sortedProducts = [...products];

    switch (currentFilters.sortBy) {
        case 'price-low':
            return sortedProducts.sort((a, b) => a.price - b.price);
        
        case 'price-high':
            return sortedProducts.sort((a, b) => b.price - a.price);
        
        case 'newest':
            return sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        case 'rating':
            return sortedProducts.sort((a, b) => b.rating - a.rating);
        
        case 'popular':
            return sortedProducts.sort((a, b) => b.reviews - a.reviews);
        
        case 'featured':
        default:
            return sortedProducts.sort((a, b) => {
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                return 0;
            });
    }
}

// Render products
function renderProducts(products) {
    if (!productsGrid) return;

    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search no-products__icon"></i>
                <h3 class="no-products__title">No products found</h3>
                <p class="no-products__text">Try adjusting your filters to see more results</p>
                <button class="btn btn--primary clear-filters-btn" onclick="clearAllFilters()">Clear All Filters</button>
            </div>
        `;
        return;
    }

    const productHTML = products.map(product => {
        const discountPercent = product.originalPrice 
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0;

        return `
            <div class="product-card ${currentView === 'list' ? 'product-card--list' : ''}">
                <div class="product__image">
                    <img src="${product.image}" alt="${product.title}" loading="lazy">
                    <div class="product__actions">
                        <button class="btn-icon wishlist-btn" data-product-id="${product.id}">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="btn-icon quick-view-btn" data-product-id="${product.id}">
                            <i class="far fa-eye"></i>
                        </button>
                    </div>
                    ${product.featured ? '<span class="product__badge">Featured</span>' : ''}
                    ${discountPercent > 0 ? `<span class="product__discount">-${discountPercent}%</span>` : ''}
                </div>
                <div class="product__info">
                    <div class="product__category">${formatCategory(product.category)}</div>
                    <h3 class="product__title">${product.title}</h3>
                    <p class="product__artisan">by ${product.artisan}</p>
                    <div class="product__rating">
                        <div class="stars">
                            ${generateStars(product.rating)}
                        </div>
                        <span class="rating-count">(${product.reviews})</span>
                    </div>
                    <div class="product__price">
                        <span class="price-current">$${product.price.toFixed(2)}</span>
                        ${product.originalPrice ? `<span class="price-original">$${product.originalPrice.toFixed(2)}</span>` : ''}
                    </div>
                    <button class="btn btn--primary btn--full add-to-cart-btn" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }).join('');

    productsGrid.innerHTML = productHTML;

    // Reattach event listeners for new elements
    attachProductEventListeners();
}

// Attach event listeners to product elements
function attachProductEventListeners() {
    // Add to cart buttons
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', handleAddToCartMarketplace);
    });

    // Wishlist buttons
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', handleWishlistMarketplace);
    });

    // Quick view buttons
    const quickViewBtns = document.querySelectorAll('.quick-view-btn');
    quickViewBtns.forEach(btn => {
        btn.addEventListener('click', handleQuickViewMarketplace);
    });
}

// Handle add to cart for marketplace
function handleAddToCartMarketplace(e) {
    e.preventDefault();
    const button = e.target;
    const productId = parseInt(button.getAttribute('data-product-id'));
    const product = allProducts.find(p => p.id === productId);
    
    if (product) {
        // Use the cart functionality from main script
        if (typeof addToCart === 'function') {
            addToCart(product);
        }
        
        // Visual feedback
        button.textContent = 'Added!';
        button.style.background = 'var(--success)';
        setTimeout(() => {
            button.textContent = 'Add to Cart';
            button.style.background = '';
        }, 2000);
        
        if (typeof showNotification === 'function') {
            showNotification(`${product.title} added to cart!`, 'success');
        }
    }
}

// Handle wishlist for marketplace
function handleWishlistMarketplace(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const icon = button.querySelector('i');
    const productId = parseInt(button.getAttribute('data-product-id'));
    
    let wishlist = JSON.parse(localStorage.getItem('artisanWishlist')) || [];
    
    if (icon.classList.contains('far')) {
        // Add to wishlist
        icon.classList.remove('far');
        icon.classList.add('fas');
        button.classList.add('active');
        wishlist.push(productId);
        if (typeof showNotification === 'function') {
            showNotification('Added to wishlist!', 'success');
        }
    } else {
        // Remove from wishlist
        icon.classList.remove('fas');
        icon.classList.add('far');
        button.classList.remove('active');
        wishlist = wishlist.filter(id => id !== productId);
        if (typeof showNotification === 'function') {
            showNotification('Removed from wishlist', 'info');
        }
    }
    
    localStorage.setItem('artisanWishlist', JSON.stringify(wishlist));
}

// Handle quick view for marketplace
function handleQuickViewMarketplace(e) {
    e.preventDefault();
    const productId = parseInt(e.target.closest('.quick-view-btn').getAttribute('data-product-id'));
    const product = allProducts.find(p => p.id === productId);
    
    if (product && typeof showNotification === 'function') {
        showNotification(`Quick view for "${product.title}" would open here!`, 'info');
    }
}

// Generate star rating HTML
function generateStars(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    return starsHTML;
}

// Format category name
function formatCategory(category) {
    const categoryMap = {
        'pottery': 'Pottery & Ceramics',
        'textiles': 'Textiles & Fabrics',
        'woodwork': 'Woodwork & Furniture',
        'jewelry': 'Jewelry & Accessories',
        'art': 'Paintings & Art',
        'leather': 'Leather Goods'
    };
    return categoryMap[category] || category;
}

// Update active filters display
function updateActiveFilters() {
    if (!activeFiltersContainer) return;

    const activeFilters = [];

    // Add category filters
    currentFilters.categories.forEach(category => {
        activeFilters.push({
            type: 'category',
            value: category,
            label: formatCategory(category)
        });
    });

    // Add location filters
    currentFilters.locations.forEach(location => {
        activeFilters.push({
            type: 'location',
            value: location,
            label: formatLocation(location)
        });
    });

    // Add price filter
    if (currentFilters.priceMin > 0 || currentFilters.priceMax < 1000) {
        activeFilters.push({
            type: 'price',
            value: 'price',
            label: `$${currentFilters.priceMin} - $${currentFilters.priceMax}`
        });
    }

    // Add rating filter
    if (currentFilters.rating) {
        activeFilters.push({
            type: 'rating',
            value: currentFilters.rating,
            label: `${currentFilters.rating}+ Stars`
        });
    }

    if (activeFilters.length === 0) {
        activeFiltersContainer.innerHTML = '';
        return;
    }

    const filtersHTML = activeFilters.map(filter => `
        <div class="active-filter" data-type="${filter.type}" data-value="${filter.value}">
            <span class="active-filter__label">${filter.label}</span>
            <button class="active-filter__remove" onclick="removeFilter('${filter.type}', '${filter.value}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    activeFiltersContainer.innerHTML = filtersHTML;
}

// Format location name
function formatLocation(location) {
    const locationMap = {
        'usa': 'United States',
        'europe': 'Europe',
        'asia': 'Asia',
        'america': 'South America'
    };
    return locationMap[location] || location;
}

// Remove individual filter
function removeFilter(type, value) {
    switch (type) {
        case 'category':
            currentFilters.categories = currentFilters.categories.filter(cat => cat !== value);
            document.querySelector(`input[name="category"][value="${value}"]`).checked = false;
            break;
        
        case 'location':
            currentFilters.locations = currentFilters.locations.filter(loc => loc !== value);
            document.querySelector(`input[name="location"][value="${value}"]`).checked = false;
            break;
        
        case 'price':
            currentFilters.priceMin = 0;
            currentFilters.priceMax = 1000;
            document.getElementById('price-min').value = '';
            document.getElementById('price-max').value = '';
            document.getElementById('slider-min').value = 0;
            document.getElementById('slider-max').value = 1000;
            break;
        
        case 'rating':
            currentFilters.rating = null;
            document.querySelector(`input[name="rating"][value="${value}"]`).checked = false;
            break;
    }

    applyFilters();
}

// Clear all filters
function clearAllFilters() {
    currentFilters = {
        categories: [],
        priceMin: 0,
        priceMax: 1000,
        rating: null,
        locations: [],
        sortBy: 'featured'
    };

    // Clear all form inputs
    const filterInputs = document.querySelectorAll('.filter-option input');
    filterInputs.forEach(input => {
        input.checked = false;
    });

    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('slider-min').value = 0;
    document.getElementById('slider-max').value = 1000;
    
    sortSelect.value = 'featured';

    applyFilters();
}

// Update results count
function updateResultsCount(count) {
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
        const startResult = (currentPage - 1) * productsPerPage + 1;
        const endResult = Math.min(currentPage * productsPerPage, count);
        resultsCount.textContent = `Showing ${startResult}-${endResult} of ${count} products`;
    }
}

// Update filters UI
function updateFiltersUI() {
    // Update category counts (in a real app, this would be dynamic)
    const categoryCounts = {
        pottery: 45,
        textiles: 32,
        woodwork: 28,
        jewelry: 67,
        art: 23,
        leather: 19
    };

    // Update rating counts
    const ratingCounts = {
        5: 12,
        4: 28,
        3: 45
    };

    // Update location counts
    const locationCounts = {
        usa: 89,
        europe: 67,
        asia: 45,
        america: 23
    };
}

// Add CSS for marketplace specific styles
const marketplaceStyles = document.createElement('style');
marketplaceStyles.textContent = `
    /* Page Header */
    .page-header {
        background: linear-gradient(135deg, var(--cream) 0%, #FFF3E0 100%);
        padding: var(--space-xl) 0;
        margin-top: 80px;
    }
    
    .breadcrumb {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        margin-bottom: var(--space-md);
        font-size: 0.9rem;
    }
    
    .breadcrumb__link {
        color: var(--text-medium);
        text-decoration: none;
        transition: color var(--transition-fast);
    }
    
    .breadcrumb__link:hover {
        color: var(--primary-color);
    }
    
    .breadcrumb__separator {
        color: var(--text-light);
    }
    
    .breadcrumb__current {
        color: var(--primary-color);
        font-weight: 500;
    }
    
    .page-title {
        font-family: var(--font-display);
        font-size: 3rem;
        font-weight: 700;
        color: var(--text-dark);
        margin-bottom: var(--space-md);
    }
    
    .page-subtitle {
        font-size: 1.2rem;
        color: var(--text-medium);
        max-width: 600px;
    }

    /* Filters Section */
    .filters-section {
        background: var(--white);
        padding: var(--space-lg) 0;
        border-bottom: 1px solid var(--gray);
    }
    
    .filters-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-lg);
    }
    
    .filters-left {
        display: flex;
        align-items: center;
        gap: var(--space-lg);
    }
    
    .filter-toggle {
        display: none;
        background: var(--light-gray);
        border: none;
        padding: 10px 16px;
        border-radius: var(--radius-md);
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .filter-toggle:hover {
        background: var(--primary-color);
        color: var(--white);
    }
    
    .active-filters {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
    }
    
    .active-filter {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        background: var(--primary-color);
        color: var(--white);
        padding: 6px 12px;
        border-radius: var(--radius-lg);
        font-size: 0.85rem;
    }
    
    .active-filter__remove {
        background: none;
        border: none;
        color: var(--white);
        cursor: pointer;
        padding: 2px;
        border-radius: var(--radius-sm);
        transition: background var(--transition-fast);
    }
    
    .active-filter__remove:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .filters-right {
        display: flex;
        align-items: center;
        gap: var(--space-md);
    }
    
    .sort-select {
        padding: 8px 12px;
        border: 2px solid var(--gray);
        border-radius: var(--radius-md);
        background: var(--white);
        font-size: 0.9rem;
        cursor: pointer;
    }
    
    .view-toggle {
        display: flex;
        background: var(--light-gray);
        border-radius: var(--radius-md);
        overflow: hidden;
    }
    
    .view-btn {
        background: none;
        border: none;
        padding: 10px 12px;
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .view-btn.active {
        background: var(--primary-color);
        color: var(--white);
    }

    /* Marketplace Layout */
    .marketplace-layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: var(--space-xl);
        align-items: start;
    }
    
    .marketplace-products {
        padding: var(--space-xl) 0;
    }

    /* Filters Sidebar */
    .filters-sidebar {
        background: var(--white);
        border: 1px solid var(--gray);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        position: sticky;
        top: 100px;
        max-height: calc(100vh - 120px);
        overflow-y: auto;
    }
    
    .filter-group {
        margin-bottom: var(--space-xl);
        padding-bottom: var(--space-lg);
        border-bottom: 1px solid var(--gray);
    }
    
    .filter-group:last-child {
        border-bottom: none;
        margin-bottom: 0;
    }
    
    .filter-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-dark);
        margin-bottom: var(--space-md);
    }
    
    .filter-options {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }
    
    .filter-option {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        cursor: pointer;
        font-size: 0.9rem;
        color: var(--text-medium);
        transition: color var(--transition-fast);
    }
    
    .filter-option:hover {
        color: var(--text-dark);
    }
    
    .filter-option input {
        display: none;
    }
    
    .checkmark {
        width: 18px;
        height: 18px;
        border: 2px solid var(--gray);
        border-radius: var(--radius-sm);
        position: relative;
        transition: all var(--transition-fast);
    }
    
    .filter-option input:checked + .checkmark {
        background: var(--primary-color);
        border-color: var(--primary-color);
    }
    
    .filter-option input:checked + .checkmark::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--white);
        font-size: 0.8rem;
        font-weight: bold;
    }
    
    .count {
        color: var(--text-light);
        font-size: 0.8rem;
        margin-left: auto;
    }

    /* Price Range */
    .price-range {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
    }
    
    .price-inputs {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }
    
    .price-input {
        flex: 1;
        padding: 8px 12px;
        border: 2px solid var(--gray);
        border-radius: var(--radius-md);
        font-size: 0.9rem;
    }
    
    .price-separator {
        color: var(--text-light);
    }
    
    .price-slider {
        position: relative;
        height: 6px;
        background: var(--gray);
        border-radius: 3px;
    }
    
    .slider {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 6px;
        background: none;
        appearance: none;
        pointer-events: none;
    }
    
    .slider::-webkit-slider-thumb {
        appearance: none;
        width: 18px;
        height: 18px;
        background: var(--primary-color);
        border-radius: 50%;
        cursor: pointer;
        pointer-events: auto;
    }

    /* Products Grid */
    .products-main {
        min-height: 600px;
    }
    
    .products-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-lg);
    }
    
    .results-count {
        color: var(--text-medium);
        font-size: 0.9rem;
    }
    
    .products__grid--list .product-card {
        display: flex;
        gap: var(--space-lg);
        align-items: center;
    }
    
    .products__grid--list .product__image {
        width: 200px;
        height: 150px;
        flex-shrink: 0;
    }
    
    .products__grid--list .product__info {
        flex: 1;
    }

    /* No Products */
    .no-products {
        grid-column: 1 / -1;
        text-align: center;
        padding: var(--space-2xl);
    }
    
    .no-products__icon {
        font-size: 4rem;
        color: var(--text-light);
        margin-bottom: var(--space-lg);
    }
    
    .no-products__title {
        font-size: 1.5rem;
        color: var(--text-dark);
        margin-bottom: var(--space-md);
    }
    
    .no-products__text {
        color: var(--text-medium);
        margin-bottom: var(--space-lg);
    }

    /* Pagination */
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--space-sm);
        margin-top: var(--space-2xl);
    }
    
    .pagination__btn {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        padding: 10px 16px;
        border: 2px solid var(--gray);
        background: var(--white);
        color: var(--text-medium);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .pagination__btn:hover:not(:disabled) {
        background: var(--primary-color);
        color: var(--white);
        border-color: var(--primary-color);
    }
    
    .pagination__btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .pagination__numbers {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        margin: 0 var(--space-md);
    }
    
    .pagination__number {
        width: 40px;
        height: 40px;
        border: 2px solid var(--gray);
        background: var(--white);
        color: var(--text-medium);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .pagination__number.active {
        background: var(--primary-color);
        color: var(--white);
        border-color: var(--primary-color);
    }
    
    .pagination__number:hover:not(.active) {
        background: var(--light-gray);
    }
    
    .pagination__dots {
        color: var(--text-light);
        padding: 0 var(--space-xs);
    }

    /* Mobile Responsive */
    @media (max-width: 1024px) {
        .marketplace-layout {
            grid-template-columns: 1fr;
        }
        
        .filters-sidebar {
            position: fixed;
            top: 80px;
            left: -300px;
            width: 280px;
            height: calc(100vh - 80px);
            z-index: 1500;
            transition: left var(--transition-normal);
            box-shadow: var(--shadow-xl);
        }
        
        .filters-sidebar.show {
            left: 0;
        }
        
        .filter-toggle {
            display: flex;
        }
    }
    
    @media (max-width: 768px) {
        .page-title {
            font-size: 2.5rem;
        }
        
        .filters-wrapper {
            flex-direction: column;
            gap: var(--space-md);
            align-items: stretch;
        }
        
        .filters-left,
        .filters-right {
            justify-content: space-between;
        }
        
        .view-toggle {
            order: -1;
        }
        
        .products__grid--list .product-card {
            flex-direction: column;
            text-align: center;
        }
        
        .products__grid--list .product__image {
            width: 100%;
            height: 200px;
        }
        
        .pagination__numbers {
            margin: 0 var(--space-sm);
        }
        
        .pagination__btn {
            padding: 8px 12px;
            font-size: 0.9rem;
        }
    }
    
    @media (max-width: 480px) {
        .filters-sidebar {
            width: 100vw;
            left: -100vw;
        }
        
        .pagination {
            gap: 4px;
        }
        
        .pagination__number {
            width: 35px;
            height: 35px;
            font-size: 0.9rem;
        }
    }
`;
document.head.appendChild(marketplaceStyles);