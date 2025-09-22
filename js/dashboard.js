// Dashboard functionality for ArtisanHub
class ArtistDashboard {
    constructor() {
        this.currentUser = null;
        this.products = [];
        this.orders = [];
        this.stats = {
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
            avgRating: 5.0
        };
        
        this.init();
    }

    init() {
        this.loadUserData();
        this.bindEvents();
        this.loadDashboardData();
        this.updateStats();
        this.checkProfileCompletion();
    }

    loadUserData() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (!this.currentUser.email || !this.currentUser.isArtist) {
            // Redirect to artist registration if not an artist
            window.location.href = 'become-artisan.html';
            return;
        }
        
        // Update UI with user data
        document.getElementById('user-name').textContent = this.currentUser.fullName || this.currentUser.email;
        document.getElementById('artist-name').textContent = (this.currentUser.fullName || this.currentUser.email).split(' ')[0];
        
        // Update avatar if available
        if (this.currentUser.profile && this.currentUser.profile.avatar) {
            document.querySelector('.avatar-img').src = this.currentUser.profile.avatar;
        }
    }

    bindEvents() {
        // Logout functionality
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (window.authSystem) {
                window.authSystem.logout();
            }
        });

        // User menu toggle
        const userMenu = document.getElementById('user-menu');
        const dropdownMenu = document.getElementById('dropdown-menu');
        
        if (userMenu && dropdownMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });
            
            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
            });
        }

        // Quick actions
        document.getElementById('promote-shop')?.addEventListener('click', () => this.openShareModal());
        document.getElementById('preview-shop')?.addEventListener('click', () => this.previewShop());
        document.getElementById('view-analytics')?.addEventListener('click', () => this.showAnalytics());
        document.getElementById('manage-inventory')?.addEventListener('click', () => this.manageInventory());
        document.getElementById('customer-messages')?.addEventListener('click', () => this.showMessages());

        // Filter events
        document.getElementById('product-filter')?.addEventListener('change', (e) => this.filterProducts(e.target.value));
        document.getElementById('performance-period')?.addEventListener('change', (e) => this.updatePerformanceMetrics(e.target.value));

        // Share modal events
        document.getElementById('close-share-modal')?.addEventListener('click', () => this.closeShareModal());
        document.getElementById('copy-link')?.addEventListener('click', () => this.copyShopLink());

        // Social share buttons
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.shareOnSocial(e.target.closest('.social-btn')));
        });

        // Modal close on backdrop click
        document.getElementById('share-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'share-modal') {
                this.closeShareModal();
            }
        });
    }

    loadDashboardData() {
        // Load products for this artist
        const allProducts = JSON.parse(localStorage.getItem('products') || '[]');
        this.products = allProducts.filter(product => product.artistEmail === this.currentUser.email);
        
        // Load orders for this artist
        const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        this.orders = allOrders.filter(order => 
            order.items && order.items.some(item => item.artistEmail === this.currentUser.email)
        );
        
        // Render products and orders
        this.renderProducts();
        this.renderOrders();
    }

    updateStats() {
        // Calculate stats
        this.stats.totalProducts = this.products.length;
        this.stats.totalOrders = this.orders.length;
        this.stats.totalRevenue = this.orders.reduce((total, order) => {
            const artistItems = order.items.filter(item => item.artistEmail === this.currentUser.email);
            return total + artistItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }, 0);
        
        // Calculate average rating (mock data for now)
        this.stats.avgRating = this.products.length > 0 ? 
            (this.products.reduce((sum, product) => sum + (product.rating || 5), 0) / this.products.length).toFixed(1) : 
            5.0;

        // Update UI
        document.getElementById('total-products').textContent = this.stats.totalProducts;
        document.getElementById('total-orders').textContent = this.stats.totalOrders;
        document.getElementById('total-revenue').textContent = `$${this.stats.totalRevenue.toFixed(2)}`;
        document.getElementById('avg-rating').textContent = this.stats.avgRating;
    }

    renderProducts() {
        const container = document.getElementById('products-list');
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>No products yet</h3>
                    <p>Start showcasing your beautiful creations</p>
                    <a href="add-product.html" class="btn btn--primary">Add Your First Product</a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.products.map(product => `
            <div class="product-item" data-status="${product.status || 'active'}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-status ${product.status || 'active'}">${(product.status || 'active').toUpperCase()}</div>
                </div>
                
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-price">$${product.price}</p>
                    <div class="product-meta">
                        <span class="product-views">
                            <i class="fas fa-eye"></i>
                            ${product.views || 0} views
                        </span>
                        <span class="product-stock">
                            <i class="fas fa-box"></i>
                            ${product.stock || 'In Stock'}
                        </span>
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="btn-icon" onclick="dashboard.editProduct('${product.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="dashboard.viewProduct('${product.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon danger" onclick="dashboard.deleteProduct('${product.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderOrders() {
        const container = document.getElementById('orders-list');
        if (!container) return;

        if (this.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>No orders yet</h3>
                    <p>Your first order will appear here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.orders.slice(0, 5).map(order => {
            const artistItems = order.items.filter(item => item.artistEmail === this.currentUser.email);
            const orderTotal = artistItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            return `
                <div class="order-item">
                    <div class="order-info">
                        <div class="order-id">#${order.id.toString().padStart(6, '0')}</div>
                        <div class="order-date">${new Date(order.date).toLocaleDateString()}</div>
                        <div class="order-customer">${order.customerName}</div>
                    </div>
                    
                    <div class="order-details">
                        <div class="order-items">
                            ${artistItems.map(item => `<span class="order-item-name">${item.name}</span>`).join(', ')}
                        </div>
                        <div class="order-total">$${orderTotal.toFixed(2)}</div>
                    </div>
                    
                    <div class="order-status">
                        <span class="status-badge ${order.status || 'pending'}">${(order.status || 'pending').toUpperCase()}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterProducts(filter) {
        const productItems = document.querySelectorAll('.product-item');
        
        productItems.forEach(item => {
            const status = item.dataset.status;
            let show = false;
            
            switch (filter) {
                case 'all':
                    show = true;
                    break;
                case 'active':
                    show = status === 'active';
                    break;
                case 'draft':
                    show = status === 'draft';
                    break;
                case 'low-stock':
                    // Mock low stock detection
                    const stockText = item.querySelector('.product-stock').textContent;
                    show = stockText.includes('Low') || stockText.includes('0');
                    break;
            }
            
            item.style.display = show ? 'flex' : 'none';
        });
    }

    checkProfileCompletion() {
        if (!this.currentUser.profile) {
            // Show profile completion prompt
            document.getElementById('profile-completion-card').style.display = 'block';
            return;
        }

        let completionItems = 0;
        let totalItems = 4;

        // Check completion items
        const checklistItems = document.querySelectorAll('.checklist-item');
        
        // Basic info (always completed if profile exists)
        completionItems++;
        
        // Profile photo
        if (this.currentUser.profile.avatar) {
            completionItems++;
        } else {
            checklistItems[1]?.classList.remove('completed');
        }
        
        // Portfolio images
        if (this.currentUser.profile.portfolioImages && this.currentUser.profile.portfolioImages.length > 0) {
            completionItems++;
            checklistItems[2]?.classList.add('completed');
            checklistItems[2]?.querySelector('i').className = 'fas fa-check';
        }
        
        // First product
        if (this.products.length > 0) {
            completionItems++;
            checklistItems[3]?.classList.add('completed');
            checklistItems[3]?.querySelector('i').className = 'fas fa-check';
        }

        // Update progress
        const percentage = Math.round((completionItems / totalItems) * 100);
        document.querySelector('.progress-percentage').textContent = `${percentage}%`;
        
        // Hide card if 100% complete
        if (percentage === 100) {
            document.getElementById('profile-completion-card').style.display = 'none';
        }
    }

    updatePerformanceMetrics(period) {
        // Mock performance data
        const metrics = {
            '7days': { views: 45, favorites: 8, sales: 2 },
            '30days': { views: 234, favorites: 42, sales: 15 },
            '90days': { views: 892, favorites: 156, sales: 67 }
        };

        const data = metrics[period] || metrics['7days'];
        
        document.querySelectorAll('.metric').forEach((metric, index) => {
            const valueEl = metric.querySelector('.metric-value');
            const changeEl = metric.querySelector('.metric-change');
            
            switch (index) {
                case 0:
                    valueEl.textContent = data.views;
                    break;
                case 1:
                    valueEl.textContent = data.favorites;
                    break;
                case 2:
                    valueEl.textContent = data.sales;
                    break;
            }
            
            // Mock change percentage
            const change = Math.floor(Math.random() * 30) + 1;
            changeEl.textContent = `+${change}%`;
        });
    }

    // Product management methods
    editProduct(productId) {
        // Redirect to edit product page
        window.location.href = `add-product.html?edit=${productId}`;
    }

    viewProduct(productId) {
        // Open product in new tab
        window.open(`../index.html#product-${productId}`, '_blank');
    }

    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            // Remove from products array
            const allProducts = JSON.parse(localStorage.getItem('products') || '[]');
            const updatedProducts = allProducts.filter(p => p.id !== productId);
            localStorage.setItem('products', JSON.stringify(updatedProducts));
            
            // Reload dashboard data
            this.loadDashboardData();
            this.updateStats();
            
            this.showNotification('Product deleted successfully', 'success');
        }
    }

    // Quick action methods
    previewShop() {
        const shopUrl = `../index.html?artist=${encodeURIComponent(this.currentUser.email)}`;
        window.open(shopUrl, '_blank');
    }

    showAnalytics() {
        this.showNotification('Advanced analytics coming soon!', 'info');
    }

    manageInventory() {
        this.showNotification('Inventory management features coming soon!', 'info');
    }

    showMessages() {
        this.showNotification('Customer messaging system coming soon!', 'info');
    }

    // Share modal methods
    openShareModal() {
        const modal = document.getElementById('share-modal');
        if (modal) {
            // Update shop link
            const shopLink = `https://artisanhub.com/shop/${this.currentUser.email.split('@')[0]}`;
            document.getElementById('shop-link').value = shopLink;
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeShareModal() {
        const modal = document.getElementById('share-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    copyShopLink() {
        const linkInput = document.getElementById('shop-link');
        if (linkInput) {
            linkInput.select();
            linkInput.setSelectionRange(0, 99999); // For mobile devices
            
            try {
                document.execCommand('copy');
                this.showNotification('Shop link copied to clipboard!', 'success');
            } catch (err) {
                this.showNotification('Could not copy link. Please copy manually.', 'error');
            }
        }
    }

    shareOnSocial(button) {
        const platform = button.classList[1]; // Get the second class (facebook, twitter, etc.)
        const shopLink = document.getElementById('shop-link').value;
        const text = `Check out my handcrafted creations on ArtisanHub!`;
        
        let shareUrl = '';
        
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shopLink)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shopLink)}`;
                break;
            case 'instagram':
                // Instagram doesn't support direct sharing, copy link instead
                this.copyShopLink();
                this.showNotification('Link copied! You can now paste it in your Instagram bio or post.', 'info');
                return;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shopLink)}`;
                break;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }

    showNotification(message, type = 'info') {
        // Use the global notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ArtistDashboard();
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.email || !currentUser.isArtist) {
        // Redirect to artist registration if not an artist
        window.location.href = 'become-artisan.html';
        return;
    }
    
    // If profile is not completed, suggest completing it
    if (!currentUser.profileCompleted) {
        if (confirm('Complete your profile to get the most out of ArtisanHub. Would you like to finish setting up your profile now?')) {
            window.location.href = 'profile-setup.html';
        }
    }
});