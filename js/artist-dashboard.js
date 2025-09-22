// Artist Dashboard System for ArtisanHub
class ArtistDashboard {
    constructor() {
        this.currentArtisan = null;
        this.db = null;
        this.analytics = null;
        this.products = [];
        this.orders = [];
        
        this.init();
    }

    async init() {
        try {
            // Check authentication
            await this.checkArtisanAuth();
            
            // Wait for database service
            if (window.databaseService) {
                await window.databaseService.initPromise;
                this.db = window.databaseService;
            }
            
            // Load dashboard data
            await this.loadDashboardData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Render dashboard
            this.renderDashboard();
            
            console.log('🎨 Artist Dashboard initialized');
        } catch (error) {
            console.error('Error initializing artist dashboard:', error);
            this.showError('Please log in as an artisan to access the dashboard');
            setTimeout(() => {
                window.location.href = 'become-artisan.html';
            }, 2000);
        }
    }

    async checkArtisanAuth() {
        const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        
        if (!currentUser) {
            throw new Error('No user logged in');
        }
        
        try {
            this.currentArtisan = JSON.parse(currentUser);
            
            if (!this.currentArtisan.isArtisan) {
                throw new Error('User is not an artisan');
            }
            
        } catch (error) {
            throw new Error('Invalid user session');
        }
    }

    async loadDashboardData() {
        try {
            // Load artisan's products
            const productsResult = await this.db.getProducts({ 
                artisanId: this.currentArtisan.id 
            });
            
            if (productsResult.success) {
                this.products = productsResult.data;
            }

            // Load artisan's orders
            const ordersResult = await this.db.getOrders({ 
                artisanId: this.currentArtisan.id 
            });
            
            if (ordersResult.success) {
                this.orders = ordersResult.data;
            }

            // Load analytics
            const analyticsResult = await this.db.getArtisanAnalytics(this.currentArtisan.id);
            
            if (analyticsResult.success) {
                this.analytics = analyticsResult.data;
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    setupEventListeners() {
        // Product management buttons
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                window.location.href = 'add-product.html';
            });
        }

        // Refresh data button
        const refreshBtn = document.getElementById('refresh-data-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }

        // View all products button
        const viewProductsBtn = document.getElementById('view-all-products-btn');
        if (viewProductsBtn) {
            viewProductsBtn.addEventListener('click', () => {
                this.showProductsModal();
            });
        }

        // Export data button
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
    }

    renderDashboard() {
        this.renderOverview();
        this.renderRecentProducts();
        this.renderRecentOrders();
        this.renderAnalytics();
        this.renderQuickActions();
    }

    renderOverview() {
        const overviewContainer = document.getElementById('dashboard-overview');
        if (!overviewContainer || !this.analytics) return;

        const { products, orders } = this.analytics;

        overviewContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${products.total}</h3>
                        <p>Total Products</p>
                        <span class="stat-change positive">+${products.active} active</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${orders.total}</h3>
                        <p>Total Orders</p>
                        <span class="stat-change ${orders.pending > 0 ? 'warning' : 'positive'}">
                            ${orders.pending} pending
                        </span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="stat-content">
                        <h3>$${orders.totalRevenue.toFixed(2)}</h3>
                        <p>Total Revenue</p>
                        <span class="stat-change ${this.analytics.trends.revenueGrowth >= 0 ? 'positive' : 'negative'}">
                            ${this.analytics.trends.revenueGrowth >= 0 ? '+' : ''}${this.analytics.trends.revenueGrowth}%
                        </span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-eye"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${products.totalViews}</h3>
                        <p>Total Views</p>
                        <span class="stat-change ${this.analytics.trends.viewsGrowth >= 0 ? 'positive' : 'negative'}">
                            ${this.analytics.trends.viewsGrowth >= 0 ? '+' : ''}${this.analytics.trends.viewsGrowth}%
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    renderRecentProducts() {
        const productsContainer = document.getElementById('recent-products');
        if (!productsContainer) return;

        const recentProducts = this.products
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 6);

        if (recentProducts.length === 0) {
            productsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <h3>No Products Yet</h3>
                    <p>Start showcasing your beautiful creations!</p>
                    <button class="btn btn--primary" onclick="window.location.href='add-product.html'">
                        Add Your First Product
                    </button>
                </div>
            `;
            return;
        }

        const productsHTML = recentProducts.map(product => `
            <div class="product-item">
                <div class="product-image">
                    <img src="${product.images[0] || 'https://via.placeholder.com/200x200'}" 
                         alt="${product.title}">
                    <div class="product-status status-${product.status}">${product.status}</div>
                </div>
                <div class="product-info">
                    <h4>${product.title}</h4>
                    <p class="product-price">$${product.price}</p>
                    <div class="product-stats">
                        <span><i class="fas fa-eye"></i> ${product.views || 0}</span>
                        <span><i class="fas fa-heart"></i> ${product.likes || 0}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn--outline btn--sm" onclick="artisanDashboard.editProduct('${product.id}')">
                            Edit
                        </button>
                        <button class="btn btn--outline btn--sm" onclick="artisanDashboard.viewProduct('${product.id}')">
                            View
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        productsContainer.innerHTML = `
            <div class="section-header">
                <h3>Recent Products</h3>
                <button class="btn btn--outline btn--sm" id="view-all-products-btn">
                    View All (${this.products.length})
                </button>
            </div>
            <div class="products-grid">
                ${productsHTML}
            </div>
        `;
    }

    renderRecentOrders() {
        const ordersContainer = document.getElementById('recent-orders');
        if (!ordersContainer) return;

        const recentOrders = this.orders
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        if (recentOrders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>No Orders Yet</h3>
                    <p>Orders will appear here when customers purchase your products.</p>
                </div>
            `;
            return;
        }

        const ordersHTML = recentOrders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-number">#${order.order_number}</span>
                    <span class="order-status status-${order.status}">${order.status}</span>
                </div>
                <div class="order-details">
                    <p class="order-total">$${order.total_amount}</p>
                    <p class="order-date">${new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div class="order-actions">
                    <button class="btn btn--outline btn--sm" onclick="artisanDashboard.viewOrder('${order.id}')">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');

        ordersContainer.innerHTML = `
            <div class="section-header">
                <h3>Recent Orders</h3>
                <button class="btn btn--outline btn--sm" onclick="artisanDashboard.showOrdersModal()">
                    View All (${this.orders.length})
                </button>
            </div>
            <div class="orders-list">
                ${ordersHTML}
            </div>
        `;
    }

    renderAnalytics() {
        const analyticsContainer = document.getElementById('analytics-section');
        if (!analyticsContainer || !this.analytics) return;

        const { products, orders, trends } = this.analytics;

        analyticsContainer.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h4>Product Performance</h4>
                    <div class="metric">
                        <span class="metric-label">Average Views per Product</span>
                        <span class="metric-value">${products.avgViews}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Total Likes</span>
                        <span class="metric-value">${products.totalLikes}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min((products.active / 10) * 100, 100)}%"></div>
                    </div>
                    <small>Active Products: ${products.active}/10 recommended</small>
                </div>

                <div class="analytics-card">
                    <h4>Sales Analytics</h4>
                    <div class="metric">
                        <span class="metric-label">Average Order Value</span>
                        <span class="metric-value">$${orders.avgOrderValue}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Conversion Rate</span>
                        <span class="metric-value">${products.totalViews > 0 ? ((orders.total / products.totalViews) * 100).toFixed(2) : 0}%</span>
                    </div>
                    <div class="trend-indicator ${trends.salesGrowth >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${trends.salesGrowth >= 0 ? 'up' : 'down'}"></i>
                        ${trends.salesGrowth >= 0 ? '+' : ''}${trends.salesGrowth}% this month
                    </div>
                </div>

                <div class="analytics-card">
                    <h4>Growth Trends</h4>
                    <div class="trends-list">
                        <div class="trend-item">
                            <span>Views</span>
                            <span class="${trends.viewsGrowth >= 0 ? 'positive' : 'negative'}">
                                ${trends.viewsGrowth >= 0 ? '+' : ''}${trends.viewsGrowth}%
                            </span>
                        </div>
                        <div class="trend-item">
                            <span>Sales</span>
                            <span class="${trends.salesGrowth >= 0 ? 'positive' : 'negative'}">
                                ${trends.salesGrowth >= 0 ? '+' : ''}${trends.salesGrowth}%
                            </span>
                        </div>
                        <div class="trend-item">
                            <span>Revenue</span>
                            <span class="${trends.revenueGrowth >= 0 ? 'positive' : 'negative'}">
                                ${trends.revenueGrowth >= 0 ? '+' : ''}${trends.revenueGrowth}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderQuickActions() {
        const actionsContainer = document.getElementById('quick-actions');
        if (!actionsContainer) return;

        actionsContainer.innerHTML = `
            <div class="quick-actions-grid">
                <button class="action-card" onclick="window.location.href='add-product.html'">
                    <i class="fas fa-plus"></i>
                    <span>Add Product</span>
                </button>
                
                <button class="action-card" onclick="artisanDashboard.showProductsModal()">
                    <i class="fas fa-box"></i>
                    <span>Manage Products</span>
                </button>
                
                <button class="action-card" onclick="artisanDashboard.showOrdersModal()">
                    <i class="fas fa-shopping-cart"></i>
                    <span>View Orders</span>
                </button>
                
                <button class="action-card" onclick="window.location.href='profile-setup.html'">
                    <i class="fas fa-user"></i>
                    <span>Edit Profile</span>
                </button>
                
                <button class="action-card" onclick="artisanDashboard.showAnalyticsModal()">
                    <i class="fas fa-chart-line"></i>
                    <span>Analytics</span>
                </button>
                
                <button class="action-card" onclick="artisanDashboard.exportData()">
                    <i class="fas fa-download"></i>
                    <span>Export Data</span>
                </button>
            </div>
        `;
    }

    async refreshDashboard() {
        try {
            const refreshBtn = document.getElementById('refresh-data-btn');
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
                refreshBtn.disabled = true;
            }

            await this.loadDashboardData();
            this.renderDashboard();
            
            this.showSuccess('Dashboard refreshed successfully!');
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            this.showError('Failed to refresh dashboard data');
        } finally {
            const refreshBtn = document.getElementById('refresh-data-btn');
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                refreshBtn.disabled = false;
            }
        }
    }

    editProduct(productId) {
        // Store product ID for editing
        localStorage.setItem('editProductId', productId);
        window.location.href = 'add-product.html?edit=' + productId;
    }

    viewProduct(productId) {
        // Open product page in new tab
        const product = this.products.find(p => p.id === productId);
        if (product) {
            window.open(`product-${productId}-${product.slug}.html`, '_blank');
        }
    }

    viewOrder(orderId) {
        // Show order details modal
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            this.showOrderDetailsModal(order);
        }
    }

    showProductsModal() {
        // Implementation for products management modal
        alert('Products management modal - Coming soon!');
    }

    showOrdersModal() {
        // Implementation for orders modal
        alert('Orders management modal - Coming soon!');
    }

    showAnalyticsModal() {
        // Implementation for detailed analytics modal
        alert('Detailed analytics modal - Coming soon!');
    }

    showOrderDetailsModal(order) {
        // Implementation for order details modal
        alert(`Order #${order.order_number} details - Coming soon!`);
    }

    exportData() {
        try {
            const data = {
                artisan: this.currentArtisan,
                products: this.products,
                orders: this.orders,
                analytics: this.analytics,
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `artisan-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.showSuccess('Data exported successfully!');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Failed to export data');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
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
}

// Initialize artist dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.artisanDashboard = new ArtistDashboard();
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}