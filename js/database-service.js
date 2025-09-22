// Database Service for ArtisanHub with Supabase Integration
class DatabaseService {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.initPromise = this.init();
    }

    async init() {
        try {
            // Wait for Supabase config to be ready
            if (window.supabaseConfig) {
                await new Promise(resolve => {
                    const checkConfig = () => {
                        if (window.supabaseConfig.getClient()) {
                            this.supabase = window.supabaseConfig.getClient();
                            this.isConnected = true;
                            resolve();
                        } else {
                            setTimeout(checkConfig, 100);
                        }
                    };
                    checkConfig();
                });
            }
            
            console.log('🗄️ Database Service initialized');
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.isConnected = false;
        }
    }

    // ==================== USER MANAGEMENT ====================

    async createUser(userData) {
        try {
            if (this.isConnected && this.supabase) {
                const { data, error } = await this.supabase
                    .from('users')
                    .insert([{
                        email: userData.email,
                        full_name: userData.fullName,
                        phone: userData.phone,
                        is_artisan: userData.isArtisan || false,
                        profile_completed: userData.profileCompleted || false,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data };
            } else {
                // Fallback to localStorage
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const newUser = {
                    id: this.generateId(),
                    ...userData,
                    created_at: new Date().toISOString()
                };
                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));
                return { success: true, data: newUser };
            }
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    async getUser(email) {
        try {
            if (this.isConnected && this.supabase) {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                return { success: true, data };
            } else {
                // Fallback to localStorage
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.email === email);
                return { success: true, data: user };
            }
        } catch (error) {
            console.error('Error getting user:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(userId, userData) {
        try {
            if (this.isConnected && this.supabase) {
                const { data, error } = await this.supabase
                    .from('users')
                    .update(userData)
                    .eq('id', userId)
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data };
            } else {
                // Fallback to localStorage
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const index = users.findIndex(u => u.id === userId);
                if (index !== -1) {
                    users[index] = { ...users[index], ...userData };
                    localStorage.setItem('users', JSON.stringify(users));
                    return { success: true, data: users[index] };
                }
                return { success: false, error: 'User not found' };
            }
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ARTISAN MANAGEMENT ====================

    async createArtisan(artisanData) {
        try {
            if (this.isConnected && this.supabase) {
                const { data, error } = await this.supabase
                    .from('artisans')
                    .insert([artisanData])
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data };
            } else {
                // Fallback to localStorage
                const artisans = JSON.parse(localStorage.getItem('artisans') || '[]');
                const newArtisan = {
                    id: this.generateId(),
                    ...artisanData,
                    created_at: new Date().toISOString()
                };
                artisans.push(newArtisan);
                localStorage.setItem('artisans', JSON.stringify(artisans));
                return { success: true, data: newArtisan };
            }
        } catch (error) {
            console.error('Error creating artisan:', error);
            return { success: false, error: error.message };
        }
    }

    async getArtisan(userId) {
        try {
            if (this.isConnected && this.supabase) {
                const { data, error } = await this.supabase
                    .from('artisans')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                return { success: true, data };
            } else {
                // Fallback to localStorage
                const artisans = JSON.parse(localStorage.getItem('artisans') || '[]');
                const artisan = artisans.find(a => a.user_id === userId);
                return { success: true, data: artisan };
            }
        } catch (error) {
            console.error('Error getting artisan:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== PRODUCT MANAGEMENT ====================

    async createProduct(productData) {
        try {
            if (this.isConnected && this.supabase) {
                const { data, error } = await this.supabase
                    .from('products')
                    .insert([{
                        artisan_id: productData.artisanId,
                        name: productData.title,
                        description: productData.description,
                        price: productData.price,
                        category: productData.category,
                        materials: productData.materials ? [productData.materials] : [],
                        dimensions: productData.dimensions,
                        weight: productData.weight,
                        images: productData.images || [],
                        stock_quantity: productData.quantity || 1,
                        status: productData.status || 'active',
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data };
            } else {
                // Fallback to localStorage
                const products = JSON.parse(localStorage.getItem('products') || '[]');
                const newProduct = {
                    id: this.generateId(),
                    ...productData,
                    created_at: new Date().toISOString()
                };
                products.push(newProduct);
                localStorage.setItem('products', JSON.stringify(products));
                return { success: true, data: newProduct };
            }
        } catch (error) {
            console.error('Error creating product:', error);
            return { success: false, error: error.message };
        }
    }

    async getProducts(filters = {}) {
        try {
            if (this.isConnected && this.supabase) {
                let query = this.supabase.from('products').select('*');

                if (filters.status) {
                    query = query.eq('status', filters.status);
                }
                if (filters.category) {
                    query = query.eq('category', filters.category);
                }
                if (filters.artisanId) {
                    query = query.eq('artisan_id', filters.artisanId);
                }
                if (filters.limit) {
                    query = query.limit(filters.limit);
                }

                const { data, error } = await query;
                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                let products = JSON.parse(localStorage.getItem('products') || '[]');
                
                // Apply filters
                if (filters.status) {
                    products = products.filter(p => p.status === filters.status);
                }
                if (filters.category) {
                    products = products.filter(p => p.category === filters.category);
                }
                if (filters.artisanId) {
                    products = products.filter(p => p.artisanId === filters.artisanId);
                }
                if (filters.limit) {
                    products = products.slice(0, filters.limit);
                }

                return { success: true, data: products };
            }
        } catch (error) {
            console.error('Error getting products:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== CART MANAGEMENT ====================

    async addToCart(userId, productId, quantity = 1) {
        try {
            if (this.isConnected && this.supabase) {
                // Check if item already exists
                const { data: existing } = await this.supabase
                    .from('cart_items')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('product_id', productId)
                    .single();

                if (existing) {
                    // Update quantity
                    const { data, error } = await this.supabase
                        .from('cart_items')
                        .update({ quantity: existing.quantity + quantity })
                        .eq('id', existing.id)
                        .select()
                        .single();

                    if (error) throw error;
                    return { success: true, data };
                } else {
                    // Insert new item
                    const { data, error } = await this.supabase
                        .from('cart_items')
                        .insert([{
                            user_id: userId,
                            product_id: productId,
                            quantity: quantity
                        }])
                        .select()
                        .single();

                    if (error) throw error;
                    return { success: true, data };
                }
            } else {
                // Fallback to localStorage
                const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
                const existingItem = cartItems.find(item => item.productId === productId);
                
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    cartItems.push({
                        id: this.generateId(),
                        userId: userId,
                        productId: productId,
                        quantity: quantity,
                        created_at: new Date().toISOString()
                    });
                }
                
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                return { success: true, data: cartItems };
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { success: false, error: error.message };
        }
    }

    async getCartItems(userId) {
        try {
            if (this.isConnected && this.supabase) {
                const { data, error } = await this.supabase
                    .from('cart_items')
                    .select(`
                        *,
                        products (
                            id,
                            name,
                            price,
                            images,
                            artisan_id
                        )
                    `)
                    .eq('user_id', userId);

                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
                const userItems = cartItems.filter(item => item.userId === userId);
                return { success: true, data: userItems };
            }
        } catch (error) {
            console.error('Error getting cart items:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ORDER MANAGEMENT ====================

    async getOrders(filters = {}) {
        try {
            if (this.isConnected && this.supabase) {
                let query = this.supabase.from('orders').select('*');

                if (filters.userId) {
                    query = query.eq('user_id', filters.userId);
                }
                if (filters.artisanId) {
                    query = query.eq('artisan_id', filters.artisanId);
                }

                const { data, error } = await query;
                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                let filteredOrders = orders;
                
                if (filters.userId) {
                    filteredOrders = filteredOrders.filter(o => o.userId === filters.userId);
                }
                if (filters.artisanId) {
                    filteredOrders = filteredOrders.filter(o => o.artisanId === filters.artisanId);
                }

                return { success: true, data: filteredOrders };
            }
        } catch (error) {
            console.error('Error getting orders:', error);
            return { success: false, error: error.message };
        }
    }

    async getArtisanAnalytics(artisanId) {
        try {
            // Mock analytics data for now
            const analytics = {
                products: {
                    total: 0,
                    active: 0,
                    totalViews: 0,
                    totalLikes: 0,
                    avgViews: 0
                },
                orders: {
                    total: 0,
                    pending: 0,
                    totalRevenue: 0,
                    avgOrderValue: 0
                },
                trends: {
                    viewsGrowth: Math.floor(Math.random() * 20) - 10,
                    salesGrowth: Math.floor(Math.random() * 15) - 5,
                    revenueGrowth: Math.floor(Math.random() * 25) - 10
                }
            };

            return { success: true, data: analytics };
        } catch (error) {
            console.error('Error getting analytics:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== UTILITY METHODS ====================

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    isOnline() {
        return this.isConnected;
    }
}

// Initialize database service
window.databaseService = new DatabaseService();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseService;
}