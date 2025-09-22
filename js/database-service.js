// Database Service for ArtisanHub with Supabase integration
class DatabaseService {
    constructor() {
        this.supabase = null;
        this.isOnline = false;
        this.initPromise = this.init();
    }

    async init() {
        // Wait for Supabase config to be ready
        if (window.supabaseConfig) {
            await window.supabaseConfig.initPromise;
            this.supabase = window.supabaseConfig.getClient();
            this.isOnline = window.supabaseConfig.isOnline();
        }
        
        console.log('🗄️ Database service initialized', this.isOnline ? '(Online)' : '(Offline)');
    }

    // ==================== USER MANAGEMENT ====================

    async createUser(userData) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('users')
                    .insert([{
                        email: userData.email,
                        full_name: userData.fullName,
                        phone: userData.phone,
                        is_artisan: userData.isArtisan || false,
                        profile_completed: userData.profileCompleted || false
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.createUserLocal(userData);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    async getUser(email) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.getUserLocal(email);
            }
        } catch (error) {
            console.error('Error getting user:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(userId, updates) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('users')
                    .update(updates)
                    .eq('id', userId)
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.updateUserLocal(userId, updates);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ARTISAN MANAGEMENT ====================

    async createArtisan(artisanData) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('artisans')
                    .insert([artisanData])
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.createArtisanLocal(artisanData);
            }
        } catch (error) {
            console.error('Error creating artisan:', error);
            return { success: false, error: error.message };
        }
    }

    async getArtisan(userId) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('artisans')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.getArtisanLocal(userId);
            }
        } catch (error) {
            console.error('Error getting artisan:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllArtisans() {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('artisans')
                    .select('*')
                    .eq('shop_visible', true)
                    .order('joined_date', { ascending: false });

                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                return this.getAllArtisansLocal();
            }
        } catch (error) {
            console.error('Error getting artisans:', error);
            return { success: false, error: error.message };
        }
    }

    async updateArtisan(artisanId, updates) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('artisans')
                    .update(updates)
                    .eq('id', artisanId)
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.updateArtisanLocal(artisanId, updates);
            }
        } catch (error) {
            console.error('Error updating artisan:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== PRODUCT MANAGEMENT ====================

    async createProduct(productData) {
        try {
            // Add auto-generated fields
            const enrichedData = {
                ...productData,
                id: productData.id || this.generateId(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                views: 0,
                likes: 0,
                sales_count: 0
            };

            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('products')
                    .insert([enrichedData])
                    .select()
                    .single();

                if (error) throw error;
                
                // Update artisan's product count
                await this.updateArtisanStats(enrichedData.artisanId);
                
                return { success: true, data: data, product: data };
            } else {
                // Fallback to localStorage
                return this.createProductLocal(enrichedData);
            }
        } catch (error) {
            console.error('Error creating product:', error);
            return { success: false, error: error.message };
        }
    }

    async getProducts(filters = {}) {
        try {
            if (this.isOnline) {
                let query = this.supabase.from('products').select('*');
                
                // Apply filters
                if (filters.status) {
                    query = query.eq('status', filters.status);
                }
                if (filters.category) {
                    query = query.eq('category', filters.category);
                }
                if (filters.artisanId) {
                    query = query.eq('artisanId', filters.artisanId);
                }
                if (filters.featured) {
                    query = query.eq('featured', filters.featured);
                }
                if (filters.minPrice) {
                    query = query.gte('price', filters.minPrice);
                }
                if (filters.maxPrice) {
                    query = query.lte('price', filters.maxPrice);
                }
                
                // Apply sorting
                const sortBy = filters.sortBy || 'created_at';
                const sortOrder = filters.sortOrder || 'desc';
                query = query.order(sortBy, { ascending: sortOrder === 'asc' });
                
                // Apply limit
                if (filters.limit) {
                    query = query.limit(filters.limit);
                }

                const { data, error } = await query;

                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                return this.getProductsLocal(filters);
            }
        } catch (error) {
            console.error('Error getting products:', error);
            return { success: false, error: error.message };
        }
    }

    async getProduct(productId) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                
                // Increment view count
                if (data) {
                    await this.incrementProductViews(productId);
                }
                
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.getProductLocal(productId);
            }
        } catch (error) {
            console.error('Error getting product:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProduct(productId, updates) {
        try {
            const enrichedUpdates = {
                ...updates,
                updated_at: new Date().toISOString()
            };

            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('products')
                    .update(enrichedUpdates)
                    .eq('id', productId)
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.updateProductLocal(productId, enrichedUpdates);
            }
        } catch (error) {
            console.error('Error updating product:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteProduct(productId) {
        try {
            if (this.isOnline) {
                const { error } = await this.supabase
                    .from('products')
                    .delete()
                    .eq('id', productId);

                if (error) throw error;
                return { success: true };
            } else {
                // Fallback to localStorage
                return this.deleteProductLocal(productId);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            return { success: false, error: error.message };
        }
    }

    async searchProducts(searchTerm, filters = {}) {
        try {
            if (this.isOnline) {
                let query = this.supabase
                    .from('products')
                    .select('*')
                    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
                    .eq('status', 'active');
                
                // Apply additional filters
                if (filters.category) {
                    query = query.eq('category', filters.category);
                }
                if (filters.minPrice) {
                    query = query.gte('price', filters.minPrice);
                }
                if (filters.maxPrice) {
                    query = query.lte('price', filters.maxPrice);
                }
                
                query = query.order('created_at', { ascending: false });
                
                if (filters.limit) {
                    query = query.limit(filters.limit);
                }

                const { data, error } = await query;

                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                return this.searchProductsLocal(searchTerm, filters);
            }
        } catch (error) {
            console.error('Error searching products:', error);
            return { success: false, error: error.message };
        }
    }

    async incrementProductViews(productId) {
        try {
            if (this.isOnline) {
                const { error } = await this.supabase.rpc('increment_product_views', {
                    product_id: productId
                });

                if (error) throw error;
                return { success: true };
            } else {
                // Fallback to localStorage
                return this.incrementProductViewsLocal(productId);
            }
        } catch (error) {
            console.error('Error incrementing product views:', error);
            return { success: false, error: error.message };
        }
    }

    async updateArtisanStats(artisanId) {
        try {
            if (this.isOnline) {
                // Get product count for artisan
                const { data: products } = await this.supabase
                    .from('products')
                    .select('id')
                    .eq('artisanId', artisanId)
                    .eq('status', 'active');

                const productCount = products ? products.length : 0;

                // Update artisan record
                const { error } = await this.supabase
                    .from('artisans')
                    .update({ product_count: productCount })
                    .eq('id', artisanId);

                if (error) throw error;
                return { success: true };
            }
        } catch (error) {
            console.error('Error updating artisan stats:', error);
        }
    }

    // ==================== ORDER MANAGEMENT ====================

    async createOrder(orderData) {
        try {
            const enrichedOrder = {
                ...orderData,
                id: this.generateId(),
                order_number: this.generateOrderNumber(),
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('orders')
                    .insert([enrichedOrder])
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.createOrderLocal(enrichedOrder);
            }
        } catch (error) {
            console.error('Error creating order:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrders(filters = {}) {
        try {
            if (this.isOnline) {
                let query = this.supabase.from('orders').select('*');
                
                if (filters.userId) {
                    query = query.eq('user_id', filters.userId);
                }
                if (filters.artisanId) {
                    query = query.eq('artisan_id', filters.artisanId);
                }
                if (filters.status) {
                    query = query.eq('status', filters.status);
                }
                
                query = query.order('created_at', { ascending: false });

                const { data, error } = await query;

                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                return this.getOrdersLocal(filters);
            }
        } catch (error) {
            console.error('Error getting orders:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ANALYTICS & REPORTING ====================

    async getArtisanAnalytics(artisanId) {
        try {
            if (this.isOnline) {
                // Get product analytics
                const { data: products } = await this.supabase
                    .from('products')
                    .select('*')
                    .eq('artisanId', artisanId);

                // Get order analytics
                const { data: orders } = await this.supabase
                    .from('orders')
                    .select('*')
                    .eq('artisan_id', artisanId);

                const analytics = this.calculateAnalytics(products, orders);
                return { success: true, data: analytics };
            } else {
                // Fallback to localStorage
                return this.getArtisanAnalyticsLocal(artisanId);
            }
        } catch (error) {
            console.error('Error getting artisan analytics:', error);
            return { success: false, error: error.message };
        }
    }

    calculateAnalytics(products = [], orders = []) {
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.status === 'active').length;
        const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
        const totalLikes = products.reduce((sum, p) => sum + (p.likes || 0), 0);
        
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const completedOrders = orders.filter(o => o.status === 'completed').length;

        // Calculate trends (mock data for now)
        const trends = {
            viewsGrowth: Math.floor(Math.random() * 20) - 10,
            salesGrowth: Math.floor(Math.random() * 30) - 15,
            revenueGrowth: Math.floor(Math.random() * 25) - 12
        };

        return {
            products: {
                total: totalProducts,
                active: activeProducts,
                draft: totalProducts - activeProducts,
                totalViews,
                totalLikes,
                avgViews: totalProducts > 0 ? Math.round(totalViews / totalProducts) : 0
            },
            orders: {
                total: totalOrders,
                pending: pendingOrders,
                completed: completedOrders,
                totalRevenue,
                avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
            },
            trends
        };
    }

    async getProduct(productId) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('products')
                    .select(`
                        *,
                        artisans (
                            user_id,
                            craft,
                            bio,
                            location,
                            rating,
                            users (full_name, avatar_url)
                        )
                    `)
                    .eq('id', productId)
                    .eq('status', 'active')
                    .single();

                if (error) throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.getProductLocal(productId);
            }
        } catch (error) {
            console.error('Error getting product:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllProducts(filters = {}) {
        try {
            if (this.isOnline) {
                let query = this.supabase
                    .from('products')
                    .select(`
                        *,
                        artisans (
                            user_id,
                            craft,
                            location,
                            rating,
                            users (full_name, avatar_url)
                        )
                    `)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                // Apply filters
                if (filters.category) {
                    query = query.eq('category', filters.category);
                }
                if (filters.artisanId) {
                    query = query.eq('artisan_id', filters.artisanId);
                }
                if (filters.minPrice) {
                    query = query.gte('price', filters.minPrice);
                }
                if (filters.maxPrice) {
                    query = query.lte('price', filters.maxPrice);
                }
                if (filters.search) {
                    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
                }

                const { data, error } = await query;

                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                return this.getAllProductsLocal(filters);
            }
        } catch (error) {
            console.error('Error getting products:', error);
            return { success: false, error: error.message };
        }
    }

    async getArtisanProducts(artisanId) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('products')
                    .select('*')
                    .eq('artisan_id', artisanId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                return this.getArtisanProductsLocal(artisanId);
            }
        } catch (error) {
            console.error('Error getting artisan products:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProduct(productId, updates) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('products')
                    .update(updates)
                    .eq('id', productId)
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.updateProductLocal(productId, updates);
            }
        } catch (error) {
            console.error('Error updating product:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteProduct(productId) {
        try {
            if (this.isOnline) {
                const { error } = await this.supabase
                    .from('products')
                    .delete()
                    .eq('id', productId);

                if (error) throw error;
                return { success: true };
            } else {
                // Fallback to localStorage
                return this.deleteProductLocal(productId);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== CART MANAGEMENT ====================

    async addToCart(userId, productId, quantity = 1, customizationNotes = '') {
        try {
            if (this.isOnline) {
                // Check if item already exists in cart
                const { data: existingItem } = await this.supabase
                    .from('cart_items')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('product_id', productId)
                    .single();

                if (existingItem) {
                    // Update quantity
                    const { data, error } = await this.supabase
                        .from('cart_items')
                        .update({ 
                            quantity: existingItem.quantity + quantity,
                            customization_notes: customizationNotes 
                        })
                        .eq('id', existingItem.id)
                        .select()
                        .single();

                    if (error) throw error;
                    return { success: true, data: data };
                } else {
                    // Create new cart item
                    const { data, error } = await this.supabase
                        .from('cart_items')
                        .insert([{
                            user_id: userId,
                            product_id: productId,
                            quantity: quantity,
                            customization_notes: customizationNotes
                        }])
                        .select()
                        .single();

                    if (error) throw error;
                    return { success: true, data: data };
                }
            } else {
                // Fallback to localStorage
                return this.addToCartLocal(userId, productId, quantity, customizationNotes);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { success: false, error: error.message };
        }
    }

    async getCartItems(userId) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('cart_items')
                    .select(`
                        *,
                        products (
                            id,
                            name,
                            price,
                            images,
                            artisans (
                                users (full_name)
                            )
                        )
                    `)
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                return this.getCartItemsLocal(userId);
            }
        } catch (error) {
            console.error('Error getting cart items:', error);
            return { success: false, error: error.message };
        }
    }

    async updateCartItem(cartItemId, updates) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('cart_items')
                    .update(updates)
                    .eq('id', cartItemId)
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.updateCartItemLocal(cartItemId, updates);
            }
        } catch (error) {
            console.error('Error updating cart item:', error);
            return { success: false, error: error.message };
        }
    }

    async removeFromCart(cartItemId) {
        try {
            if (this.isOnline) {
                const { error } = await this.supabase
                    .from('cart_items')
                    .delete()
                    .eq('id', cartItemId);

                if (error) throw error;
                return { success: true };
            } else {
                // Fallback to localStorage
                return this.removeFromCartLocal(cartItemId);
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            return { success: false, error: error.message };
        }
    }

    async clearCart(userId) {
        try {
            if (this.isOnline) {
                const { error } = await this.supabase
                    .from('cart_items')
                    .delete()
                    .eq('user_id', userId);

                if (error) throw error;
                return { success: true };
            } else {
                // Fallback to localStorage
                return this.clearCartLocal(userId);
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ORDER MANAGEMENT ====================

    async createOrder(orderData) {
        try {
            if (this.isOnline) {
                // Generate order number
                const orderNumber = 'AH' + Date.now().toString().slice(-8);
                
                const { data, error } = await this.supabase
                    .from('orders')
                    .insert([{
                        ...orderData,
                        order_number: orderNumber
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.createOrderLocal(orderData);
            }
        } catch (error) {
            console.error('Error creating order:', error);
            return { success: false, error: error.message };
        }
    }

    async createOrderItems(orderItems) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('order_items')
                    .insert(orderItems)
                    .select();

                if (error) throw error;
                return { success: true, data: data };
            } else {
                // Fallback to localStorage
                return this.createOrderItemsLocal(orderItems);
            }
        } catch (error) {
            console.error('Error creating order items:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserOrders(userId) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('orders')
                    .select(`
                        *,
                        order_items (
                            *,
                            products (name, images, price),
                            artisans (
                                users (full_name)
                            )
                        )
                    `)
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                return this.getUserOrdersLocal(userId);
            }
        } catch (error) {
            console.error('Error getting user orders:', error);
            return { success: false, error: error.message };
        }
    }

    async getArtisanOrders(artisanId) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase
                    .from('order_items')
                    .select(`
                        *,
                        orders (
                            id,
                            order_number,
                            status,
                            total_amount,
                            created_at,
                            users (full_name, email)
                        ),
                        products (name, images, price)
                    `)
                    .eq('artisan_id', artisanId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return { success: true, data: data || [] };
            } else {
                // Fallback to localStorage
                return this.getArtisanOrdersLocal(artisanId);
            }
        } catch (error) {
            console.error('Error getting artisan orders:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== FILE UPLOAD ====================

    async uploadFile(file, bucket, path) {
        try {
            if (this.isOnline) {
                const { data, error } = await this.supabase.storage
                    .from(bucket)
                    .upload(path, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) throw error;

                // Get public URL
                const { data: urlData } = this.supabase.storage
                    .from(bucket)
                    .getPublicUrl(path);

                return { success: true, data: { path: data.path, url: urlData.publicUrl } };
            } else {
                // Fallback to base64 for offline mode
                return this.uploadFileLocal(file);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== LOCALHOST FALLBACK METHODS ====================

    // User methods
    createUserLocal(userData) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            created_at: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return { success: true, data: newUser };
    }

    getUserLocal(email) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email);
        return { success: true, data: user };
    }

    updateUserLocal(userId, updates) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates, updated_at: new Date().toISOString() };
            localStorage.setItem('users', JSON.stringify(users));
            return { success: true, data: users[userIndex] };
        }
        return { success: false, error: 'User not found' };
    }

    // Artisan methods
    createArtisanLocal(artisanData) {
        const artisans = JSON.parse(localStorage.getItem('artisans') || '[]');
        const newArtisan = {
            id: Date.now().toString(),
            ...artisanData,
            joined_date: new Date().toISOString()
        };
        artisans.push(newArtisan);
        localStorage.setItem('artisans', JSON.stringify(artisans));
        return { success: true, data: newArtisan };
    }

    getArtisanLocal(userId) {
        const artisans = JSON.parse(localStorage.getItem('artisans') || '[]');
        const artisan = artisans.find(a => a.user_id === userId);
        return { success: true, data: artisan };
    }

    getAllArtisansLocal() {
        const artisans = JSON.parse(localStorage.getItem('artisans') || '[]');
        return { success: true, data: artisans.filter(a => a.shop_visible !== false) };
    }

    updateArtisanLocal(artisanId, updates) {
        const artisans = JSON.parse(localStorage.getItem('artisans') || '[]');
        const artisanIndex = artisans.findIndex(a => a.id === artisanId);
        if (artisanIndex !== -1) {
            artisans[artisanIndex] = { ...artisans[artisanIndex], ...updates, updated_at: new Date().toISOString() };
            localStorage.setItem('artisans', JSON.stringify(artisans));
            return { success: true, data: artisans[artisanIndex] };
        }
        return { success: false, error: 'Artisan not found' };
    }

    // Product methods
    createProductLocal(productData) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const newProduct = {
            id: Date.now().toString(),
            ...productData,
            created_at: new Date().toISOString()
        };
        products.push(newProduct);
        localStorage.setItem('products', JSON.stringify(products));
        return { success: true, data: newProduct };
    }

    getProductLocal(productId) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const product = products.find(p => p.id === productId);
        return { success: true, data: product };
    }

    getAllProductsLocal(filters = {}) {
        let products = JSON.parse(localStorage.getItem('products') || '[]');
        
        // Apply filters
        if (filters.category) {
            products = products.filter(p => p.category === filters.category);
        }
        if (filters.artisanId) {
            products = products.filter(p => p.artisan_id === filters.artisanId);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(search) || 
                p.description.toLowerCase().includes(search)
            );
        }
        
        return { success: true, data: products };
    }

    // Cart methods
    addToCartLocal(userId, productId, quantity, customizationNotes) {
        const cartItems = JSON.parse(localStorage.getItem('cart_items') || '[]');
        const existingItem = cartItems.find(item => item.user_id === userId && item.product_id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.customization_notes = customizationNotes;
        } else {
            cartItems.push({
                id: Date.now().toString(),
                user_id: userId,
                product_id: productId,
                quantity,
                customization_notes: customizationNotes,
                created_at: new Date().toISOString()
            });
        }
        
        localStorage.setItem('cart_items', JSON.stringify(cartItems));
        return { success: true };
    }

    getCartItemsLocal(userId) {
        const cartItems = JSON.parse(localStorage.getItem('cart_items') || '[]');
        const userCartItems = cartItems.filter(item => item.user_id === userId);
        return { success: true, data: userCartItems };
    }

    uploadFileLocal(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({ 
                    success: true, 
                    data: { 
                        path: `local/${Date.now()}_${file.name}`,
                        url: e.target.result 
                    } 
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // ==================== UTILITY FUNCTIONS ====================

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `AH${year}${month}${day}${random}`;
    }

    // ==================== PRODUCT HTML MANAGEMENT ====================

    async saveProductHTML(productId, htmlContent, fileName) {
        try {
            // Store in localStorage for now (in production, would save to server/storage)
            const productPages = JSON.parse(localStorage.getItem('productPages') || '{}');
            productPages[productId] = {
                html: htmlContent,
                fileName: fileName,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('productPages', JSON.stringify(productPages));
            
            return { success: true };
        } catch (error) {
            console.error('Error saving product HTML:', error);
            return { success: false, error: error.message };
        }
    }

    async getProductHTML(productId) {
        try {
            const productPages = JSON.parse(localStorage.getItem('productPages') || '{}');
            const pageData = productPages[productId];
            
            if (!pageData) {
                return { success: false, error: 'Product page not found' };
            }
            
            return { success: true, data: pageData };
        } catch (error) {
            console.error('Error getting product HTML:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ENHANCED LOCAL STORAGE METHODS ====================

    createProductLocal(productData) {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const newProduct = {
                ...productData,
                id: productData.id || this.generateId(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            products.push(newProduct);
            localStorage.setItem('products', JSON.stringify(products));
            
            return { success: true, data: newProduct, product: newProduct };
        } catch (error) {
            console.error('Error creating product locally:', error);
            return { success: false, error: error.message };
        }
    }

    getProductsLocal(filters = {}) {
        try {
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
            if (filters.featured) {
                products = products.filter(p => p.featured === filters.featured);
            }
            if (filters.minPrice) {
                products = products.filter(p => p.price >= filters.minPrice);
            }
            if (filters.maxPrice) {
                products = products.filter(p => p.price <= filters.maxPrice);
            }
            
            // Apply sorting
            const sortBy = filters.sortBy || 'created_at';
            const sortOrder = filters.sortOrder || 'desc';
            
            products.sort((a, b) => {
                const aVal = a[sortBy];
                const bVal = b[sortBy];
                
                if (sortOrder === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
            
            // Apply limit
            if (filters.limit) {
                products = products.slice(0, filters.limit);
            }
            
            return { success: true, data: products };
        } catch (error) {
            console.error('Error getting products locally:', error);
            return { success: false, error: error.message };
        }
    }

    getProductLocal(productId) {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const product = products.find(p => p.id === productId);
            
            if (product) {
                // Increment view count
                product.views = (product.views || 0) + 1;
                localStorage.setItem('products', JSON.stringify(products));
            }
            
            return { success: true, data: product };
        } catch (error) {
            console.error('Error getting product locally:', error);
            return { success: false, error: error.message };
        }
    }

    updateProductLocal(productId, updates) {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const index = products.findIndex(p => p.id === productId);
            
            if (index === -1) {
                return { success: false, error: 'Product not found' };
            }
            
            products[index] = {
                ...products[index],
                ...updates,
                updated_at: new Date().toISOString()
            };
            
            localStorage.setItem('products', JSON.stringify(products));
            
            return { success: true, data: products[index] };
        } catch (error) {
            console.error('Error updating product locally:', error);
            return { success: false, error: error.message };
        }
    }

    deleteProductLocal(productId) {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const filteredProducts = products.filter(p => p.id !== productId);
            
            localStorage.setItem('products', JSON.stringify(filteredProducts));
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting product locally:', error);
            return { success: false, error: error.message };
        }
    }

    searchProductsLocal(searchTerm, filters = {}) {
        try {
            let products = JSON.parse(localStorage.getItem('products') || '[]');
            
            // Filter by search term
            const lowerSearchTerm = searchTerm.toLowerCase();
            products = products.filter(p => 
                p.status === 'active' && (
                    p.title.toLowerCase().includes(lowerSearchTerm) ||
                    p.description.toLowerCase().includes(lowerSearchTerm) ||
                    p.category.toLowerCase().includes(lowerSearchTerm)
                )
            );
            
            // Apply additional filters
            if (filters.category) {
                products = products.filter(p => p.category === filters.category);
            }
            if (filters.minPrice) {
                products = products.filter(p => p.price >= filters.minPrice);
            }
            if (filters.maxPrice) {
                products = products.filter(p => p.price <= filters.maxPrice);
            }
            
            // Sort by relevance (created_at for now)
            products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            if (filters.limit) {
                products = products.slice(0, filters.limit);
            }
            
            return { success: true, data: products };
        } catch (error) {
            console.error('Error searching products locally:', error);
            return { success: false, error: error.message };
        }
    }

    incrementProductViewsLocal(productId) {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const index = products.findIndex(p => p.id === productId);
            
            if (index !== -1) {
                products[index].views = (products[index].views || 0) + 1;
                localStorage.setItem('products', JSON.stringify(products));
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error incrementing views locally:', error);
            return { success: false, error: error.message };
        }
    }

    createOrderLocal(orderData) {
        try {
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push(orderData);
            localStorage.setItem('orders', JSON.stringify(orders));
            
            return { success: true, data: orderData };
        } catch (error) {
            console.error('Error creating order locally:', error);
            return { success: false, error: error.message };
        }
    }

    getOrdersLocal(filters = {}) {
        try {
            let orders = JSON.parse(localStorage.getItem('orders') || '[]');
            
            if (filters.userId) {
                orders = orders.filter(o => o.user_id === filters.userId);
            }
            if (filters.artisanId) {
                orders = orders.filter(o => o.artisan_id === filters.artisanId);
            }
            if (filters.status) {
                orders = orders.filter(o => o.status === filters.status);
            }
            
            // Sort by created date
            orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            return { success: true, data: orders };
        } catch (error) {
            console.error('Error getting orders locally:', error);
            return { success: false, error: error.message };
        }
    }

    getArtisanAnalyticsLocal(artisanId) {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            
            const artisanProducts = products.filter(p => p.artisanId === artisanId);
            const artisanOrders = orders.filter(o => o.artisan_id === artisanId);
            
            const analytics = this.calculateAnalytics(artisanProducts, artisanOrders);
            return { success: true, data: analytics };
        } catch (error) {
            console.error('Error getting analytics locally:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize database service
window.databaseService = new DatabaseService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseService;
}