// Shopping Cart Data - now managed by session manager
let cart = []; // Will be synced with session manager

// Product Data (in a real app, this would come from a database)
const products = [
    {
        id: 1,
        title: "Handcrafted Ceramic Bowl Set",
        artisan: "Sarah Martinez",
        price: 89.99,
        originalPrice: 119.99,
        category: "Pottery",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
        rating: 5,
        reviews: 24
    },
    {
        id: 2,
        title: "Traditional Handwoven Tapestry",
        artisan: "Elena Rossi",
        price: 245.00,
        category: "Textiles",
        image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop",
        rating: 5,
        reviews: 18
    },
    {
        id: 3,
        title: "Modern Wood Sculpture",
        artisan: "Marcus Chen",
        price: 380.00,
        category: "Woodwork",
        image: "https://images.unsplash.com/photo-1596367407372-96cb88503db6?w=400&h=400&fit=crop",
        rating: 4,
        reviews: 12
    },
    {
        id: 4,
        title: "Sterling Silver Pendant Necklace",
        artisan: "Luna Crafts",
        price: 125.00,
        category: "Jewelry",
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
        rating: 5,
        reviews: 31
    }
];

// DOM Elements
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const cartBtn = document.getElementById('cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartClose = document.getElementById('cart-close');
const cartCount = document.getElementById('cart-count');
const cartContent = document.getElementById('cart-content');
const cartItems = document.getElementById('cart-items');
const cartEmpty = document.getElementById('cart-empty');
const cartFooter = document.getElementById('cart-footer');
const cartTotal = document.getElementById('cart-total');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupSessionManager();
    updateCartUI();
    setupSmoothScrolling();
    setupAnimations();
    setupSearch();
    setupWishlist();
    updateAuthUI(); // Add authentication UI updates
    loadDynamicProducts(); // Load products from database
}

// Session Manager Integration
function setupSessionManager() {
    // Wait for session manager to be ready
    const checkSessionManager = () => {
        if (window.sessionManager) {
            // Sync cart with session manager
            cart = window.sessionManager.getCart();
            
            // Listen for auth state changes
            window.addEventListener('authStateChange', (e) => {
                updateAuthUI();
                if (e.detail.action === 'login') {
                    showNotification(`Welcome back, ${e.detail.user.fullName || e.detail.user.email}!`, 'success');
                }
            });
            
            // Listen for cart changes
            window.addEventListener('cartChange', (e) => {
                cart = e.detail.cart;
                updateCartUI();
            });
            
            console.log('🔄 Session manager integrated with main app');
        } else {
            // Retry in 100ms
            setTimeout(checkSessionManager, 100);
        }
    };
    
    checkSessionManager();
}
function setupEventListeners() {
    // Mobile navigation toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }

    // Cart functionality
    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // Add to cart buttons
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', handleAddToCart);
    });

    // Wishlist buttons
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', handleWishlist);
    });

    // Navigation links smooth scrolling
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    // Hero buttons
    const heroButtons = document.querySelectorAll('.hero__buttons .btn');
    heroButtons.forEach(btn => {
        btn.addEventListener('click', handleHeroButtonClick);
    });

    // Category cards
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', handleCategoryClick);
    });

    // Product quick view
    const quickViewBtns = document.querySelectorAll('.quick-view-btn');
    quickViewBtns.forEach(btn => {
        btn.addEventListener('click', handleQuickView);
    });

    // Window scroll for header effects
    window.addEventListener('scroll', handleScroll);

    // Escape key to close cart
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCart();
        }
    });
}

// Mobile Menu Toggle
function toggleMobileMenu() {
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

// Navigation Click Handler
function handleNavClick(e) {
    e.preventDefault();
    const targetId = e.target.getAttribute('href');
    if (targetId && targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            // Close mobile menu if open
            navMenu.classList.remove('show');
            const icon = navToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');

            // Update active link
            document.querySelectorAll('.nav__link').forEach(link => link.classList.remove('active'));
            e.target.classList.add('active');

            // Smooth scroll to target
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

// Hero Button Click Handler
function handleHeroButtonClick(e) {
    const buttonText = e.target.textContent.trim();
    if (buttonText === 'Explore Marketplace') {
        document.querySelector('#marketplace').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    } else if (buttonText === 'Become an Artisan') {
        // In a real app, this would redirect to a registration page
        showNotification('Artisan registration page would open here!', 'info');
    }
}

// Category Click Handler
function handleCategoryClick(e) {
    const categoryCard = e.currentTarget;
    const categoryTitle = categoryCard.querySelector('.category__title').textContent;
    showNotification(`Browsing ${categoryTitle} category`, 'info');
    
    // In a real app, this would filter products or navigate to category page
    document.querySelector('#marketplace').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Cart Management
function openCart() {
    cartSidebar.classList.add('show');
    cartOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartSidebar.classList.remove('show');
    cartOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

function handleAddToCart(e) {
    e.preventDefault();
    const button = e.target;
    const productId = parseInt(button.getAttribute('data-product-id'));
    const product = products.find(p => p.id === productId);
    
    if (product) {
        addToCart(product);
        
        // Visual feedback
        button.textContent = 'Added!';
        button.style.background = 'var(--success)';
        setTimeout(() => {
            button.textContent = 'Add to Cart';
            button.style.background = '';
        }, 2000);
        
        showNotification(`${product.title} added to cart!`, 'success');
    }
}

function addToCart(product) {
    if (window.sessionManager) {
        cart = window.sessionManager.addToCart(product);
    } else {
        // Fallback to old method
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        saveCart();
    }
    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showNotification('Item removed from cart', 'info');
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('artisanCart', JSON.stringify(cart));
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update cart count
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    
    // Update cart content
    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartItems.style.display = 'none';
        cartFooter.style.display = 'none';
    } else {
        cartEmpty.style.display = 'none';
        cartItems.style.display = 'block';
        cartFooter.style.display = 'block';
        
        renderCartItems();
        cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
    }
}

function renderCartItems() {
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item__image">
                <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="cart-item__info">
                <h4 class="cart-item__title">${item.title}</h4>
                <p class="cart-item__artisan">by ${item.artisan}</p>
                <div class="cart-item__controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="cart-item__price">$${(item.price * item.quantity).toFixed(2)}</div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Wishlist Management
function setupWishlist() {
    const wishlist = JSON.parse(localStorage.getItem('artisanWishlist')) || [];
    
    // Update wishlist UI based on saved data
    wishlist.forEach(productId => {
        const button = document.querySelector(`[data-product-id="${productId}"] + .product__actions .wishlist-btn`);
        if (button) {
            const icon = button.querySelector('i');
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.classList.add('active');
        }
    });
}

function handleWishlist(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const icon = button.querySelector('i');
    const productCard = button.closest('.product-card');
    const productId = productCard.querySelector('.add-to-cart-btn').getAttribute('data-product-id');
    
    let wishlist = JSON.parse(localStorage.getItem('artisanWishlist')) || [];
    
    if (icon.classList.contains('far')) {
        // Add to wishlist
        icon.classList.remove('far');
        icon.classList.add('fas');
        button.classList.add('active');
        wishlist.push(parseInt(productId));
        showNotification('Added to wishlist!', 'success');
    } else {
        // Remove from wishlist
        icon.classList.remove('fas');
        icon.classList.add('far');
        button.classList.remove('active');
        wishlist = wishlist.filter(id => id !== parseInt(productId));
        showNotification('Removed from wishlist', 'info');
    }
    
    localStorage.setItem('artisanWishlist', JSON.stringify(wishlist));
}

// Quick View Handler
function handleQuickView(e) {
    e.preventDefault();
    const productCard = e.target.closest('.product-card');
    const productTitle = productCard.querySelector('.product__title').textContent;
    
    // In a real app, this would open a modal with product details
    showNotification(`Quick view for "${productTitle}" would open here!`, 'info');
}

// Search Functionality
function setupSearch() {
    const searchInput = document.querySelector('.search__input');
    const searchIcon = document.querySelector('.search__icon');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
    }
    
    if (searchIcon) {
        searchIcon.addEventListener('click', function() {
            const searchValue = searchInput.value;
            performSearch(searchValue);
        });
    }
}

function performSearch(query) {
    if (query.trim()) {
        showNotification(`Searching for "${query}"...`, 'info');
        // In a real app, this would filter products based on the search query
        document.querySelector('#marketplace').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Smooth Scrolling Setup
function setupSmoothScrolling() {
    // Already handled in handleNavClick function
}

// Animations Setup
function setupAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.category-card, .product-card, .artisan-card, .feature');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Scroll Handler for Header Effects
function handleScroll() {
    const header = document.querySelector('.header');
    const scrollTop = window.pageYOffset;
    
    if (scrollTop > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'var(--white)';
        header.style.backdropFilter = 'none';
    }
    
    // Update active navigation based on scroll position
    updateActiveNavigation();
}

function updateActiveNavigation() {
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

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification__content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span class="notification__message">${message}</span>
        </div>
        <button class="notification__close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 3000;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        max-width: 300px;
        animation: slideIn 0.3s ease;
        font-family: var(--font-primary);
    `;
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification__close');
    closeBtn.addEventListener('click', () => notification.remove());
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
        info: '#2196F3'
    };
    return colors[type] || colors.info;
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification__content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .notification__close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
    }
    
    .notification__close:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(notificationStyles);

// Loading Animation Helper
function showLoading(element) {
    const originalContent = element.innerHTML;
    element.innerHTML = '<div class="loading"></div>';
    element.disabled = true;
    
    return function hideLoading() {
        element.innerHTML = originalContent;
        element.disabled = false;
    };
}

// Image Lazy Loading
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Form Validation Helper
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Local Storage Helper
function getFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

function setToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error writing to localStorage:', error);
    }
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    // In production, you might want to send this to an error tracking service
});

// Performance Monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart + 'ms');
        }, 0);
    });
}

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addToCart,
        removeFromCart,
        updateQuantity,
        showNotification,
        validateEmail,
        getFromStorage,
        setToStorage
    };
}

// Authentication Management
function updateAuthUI() {
    const authActions = document.getElementById('auth-actions');
    const currentUser = getCurrentUser();
    
    if (!authActions) return;
    
    if (currentUser) {
        // User is logged in
        authActions.innerHTML = `
            <div class="user-menu">
                <button class="user-menu-toggle" id="user-menu-toggle">
                    <i class="fas fa-user"></i>
                    <span>${currentUser.fullName || currentUser.email}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="user-dropdown" id="user-dropdown">
                    <a href="pages/profile.html" class="dropdown-item">
                        <i class="fas fa-user"></i> Profile
                    </a>
                    <a href="pages/orders.html" class="dropdown-item">
                        <i class="fas fa-box"></i> Orders
                    </a>
                    <a href="pages/wishlist.html" class="dropdown-item">
                        <i class="fas fa-heart"></i> Wishlist
                    </a>
                    ${currentUser.isArtisan || currentUser.is_artisan ? 
                        '<a href="pages/artist-dashboard.html" class="dropdown-item"><i class="fas fa-palette"></i> Dashboard</a>' : 
                        '<a href="pages/become-artisan.html" class="dropdown-item"><i class="fas fa-palette"></i> Become Artisan</a>'
                    }
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item logout-btn" id="logout-btn">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        `;
        
        // Setup user menu toggle
        const userMenuToggle = document.getElementById('user-menu-toggle');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (userMenuToggle && userDropdown) {
            userMenuToggle.addEventListener('click', () => {
                userDropdown.classList.toggle('active');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenuToggle.contains(e.target)) {
                    userDropdown.classList.remove('active');
                }
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
    } else {
        // User is not logged in
        authActions.innerHTML = `
            <a href="pages/user-auth.html" class="btn btn--outline btn--sm" id="sign-in-btn">Sign In</a>
        `;
    }
}

function getCurrentUser() {
    if (window.sessionManager) {
        return window.sessionManager.getUser();
    } else {
        // Fallback to direct localStorage check
        try {
            const user = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
}

function handleLogout() {
    try {
        if (window.sessionManager) {
            window.sessionManager.logout();
        } else {
            // Fallback to old method
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUser');
            
            // Show success message
            showNotification('Logged out successfully', 'success');
            
            // Update UI
            updateAuthUI();
        }
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error during logout', 'error');
    }
}

// Dynamic Product Loading
async function loadDynamicProducts() {
    const productGrid = document.getElementById('featured-products-grid');
    
    if (!productGrid) return;
    
    try {
        // Show loading state
        productGrid.innerHTML = `
            <div class="loading-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color);"></i>
                <p style="margin-top: 1rem; color: var(--text-light);">Loading featured products...</p>
            </div>
        `;
        
        let featuredProducts = [];
        
        // Wait for database service to be ready
        if (window.databaseService) {
            // Try to get products from database
            try {
                await window.databaseService.initPromise;
                const result = await window.databaseService.getProducts({ 
                    status: 'active', 
                    limit: 8,
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                });
                
                if (result.success && result.data && result.data.length > 0) {
                    featuredProducts = result.data;
                    console.log('📦 Loaded', featuredProducts.length, 'products from database');
                }
            } catch (dbError) {
                console.warn('Error loading products from database:', dbError.message);
            }
        }
        
        // Fallback to static products if no database products found
        if (featuredProducts.length === 0) {
            console.log('📦 Using fallback products (database unavailable or no products found)');
            featuredProducts = [
                {
                    id: 1,
                    title: "Handcrafted Ceramic Bowl Set",
                    artist_name: "Sarah Martinez",
                    price: 89.99,
                    original_price: 119.99,
                    category: "Pottery",
                    image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
                    rating: 5,
                    review_count: 24,
                    is_featured: true
                },
                {
                    id: 2,
                    title: "Traditional Handwoven Tapestry",
                    artist_name: "Elena Rossi",
                    price: 245.00,
                    category: "Textiles",
                    image_url: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop",
                    rating: 5,
                    review_count: 18,
                    is_featured: false
                },
                {
                    id: 3,
                    title: "Modern Wood Sculpture",
                    artist_name: "Marcus Chen",
                    price: 380.00,
                    category: "Woodwork",
                    image_url: "https://images.unsplash.com/photo-1596367407372-96cb88503db6?w=400&h=400&fit=crop",
                    rating: 4,
                    review_count: 12,
                    is_featured: false,
                    is_new: true
                },
                {
                    id: 4,
                    title: "Sterling Silver Pendant Necklace",
                    artist_name: "Luna Crafts",
                    price: 125.00,
                    category: "Jewelry",
                    image_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
                    rating: 5,
                    review_count: 31,
                    is_featured: false
                }
            ];
        }
        
        // Update global products array for cart functionality
        products.length = 0; // Clear existing
        products.push(...featuredProducts.map(p => ({
            id: p.id,
            title: p.title,
            artisan: p.artist_name,
            price: p.price,
            originalPrice: p.original_price,
            category: p.category,
            image: p.image_url,
            rating: p.rating || 5,
            reviews: p.review_count || 0
        })));
        
        // Render products
        renderProducts(featuredProducts);
        
        // Setup event listeners for new products
        setupProductEventListeners();
        
    } catch (error) {
        console.warn('Error in loadDynamicProducts, showing fallback products:', error.message);
        
        // Directly show fallback products on any error
        const fallbackProducts = [
            {
                id: 1,
                title: "Handcrafted Ceramic Bowl Set",
                artist_name: "Sarah Martinez",
                price: 89.99,
                original_price: 119.99,
                category: "Pottery",
                image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
                rating: 5,
                review_count: 24,
                is_featured: true
            },
            {
                id: 2,
                title: "Traditional Handwoven Tapestry",
                artist_name: "Elena Rossi",
                price: 245.00,
                category: "Textiles",
                image_url: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop",
                rating: 5,
                review_count: 18,
                is_featured: false
            },
            {
                id: 3,
                title: "Modern Wood Sculpture",
                artist_name: "Marcus Chen",
                price: 380.00,
                category: "Woodwork",
                image_url: "https://images.unsplash.com/photo-1596367407372-96cb88503db6?w=400&h=400&fit=crop",
                rating: 4,
                review_count: 12,
                is_featured: false,
                is_new: true
            },
            {
                id: 4,
                title: "Sterling Silver Pendant Necklace",
                artist_name: "Luna Crafts",
                price: 125.00,
                category: "Jewelry",
                image_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
                rating: 5,
                review_count: 31,
                is_featured: false
            }
        ];
        
        renderProducts(fallbackProducts);
        setupProductEventListeners();
    }
}

function renderProducts(products) {
    const productGrid = document.getElementById('featured-products-grid');
    
    if (!productGrid || !products || products.length === 0) {
        productGrid.innerHTML = `
            <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <i class="fas fa-box-open" style="font-size: 2rem; color: var(--text-light);"></i>
                <p style="margin-top: 1rem; color: var(--text-light);">No products available at the moment.</p>
            </div>
        `;
        return;
    }
    
    productGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product__image">
                <img src="${product.image_url || product.image}" alt="${product.title}" loading="lazy">
                <div class="product__actions">
                    <button class="btn-icon wishlist-btn" data-product-id="${product.id}">
                        <i class="far fa-heart"></i>
                    </button>
                    <button class="btn-icon quick-view-btn" data-product-id="${product.id}">
                        <i class="far fa-eye"></i>
                    </button>
                </div>
                ${product.is_featured ? '<span class="product__badge">Featured</span>' : ''}
                ${product.is_new ? '<span class="product__badge">New</span>' : ''}
            </div>
            <div class="product__info">
                <div class="product__category">${product.category}</div>
                <h3 class="product__title">${product.title}</h3>
                <p class="product__artisan">by ${product.artist_name || product.artisan}</p>
                <div class="product__rating">
                    <div class="stars">
                        ${generateStars(product.rating || 5)}
                    </div>
                    <span class="rating__count">(${product.review_count || product.reviews || 0} reviews)</span>
                </div>
                <div class="product__price">
                    <span class="price__current">$${(product.price || 0).toFixed(2)}</span>
                    ${product.original_price ? `<span class="price__original">$${product.original_price.toFixed(2)}</span>` : ''}
                </div>
                <button class="btn btn--primary btn--full add-to-cart-btn" data-product-id="${product.id}">
                    <i class="fas fa-shopping-cart"></i>
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function setupProductEventListeners() {
    // Re-setup add to cart buttons
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', handleAddToCart);
    });

    // Re-setup wishlist buttons
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', handleWishlist);
    });
}