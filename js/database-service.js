// Database Service for Complete Supabase Integration
class DatabaseService {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.initPromise = this.init();
    }

    async init() {
        try {
            // Wait for Supabase config
            if (window.supabaseConfig) {
                await window.supabaseConfig.initPromise;
                this.supabase = window.supabaseConfig.getClient();
                this.isConnected = window.supabaseConfig.isOnline();
                
                // Log connection status
                if (this.isConnected && this.supabase) {
                    console.log('🗄️ Database Service initialized with Supabase connection');
                } else {
                    console.log('🗄️ Database Service initialized in offline mode');
                }
            } else {
                console.warn('⚠️ Supabase config not available, running in offline mode');
                this.isConnected = false;
                this.supabase = null;
            }
            
        } catch (error) {
            console.warn('⚠️ Database initialization failed, running in offline mode:', error.message);
            this.isConnected = false;
            this.supabase = null;
        }
    }

    // ==================== USER MANAGEMENT ====================

    async createUser(userData) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .insert([{
                    id: userData.id,
                    email: userData.email,
                    full_name: userData.fullName || userData.full_name,
                    phone: userData.phone,
                    is_artisan: userData.isArtisan || userData.is_artisan || false,
                    profile_completed: userData.profileCompleted || userData.profile_completed || false
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    async getUser(userId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting user:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(userId, userData) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .update(userData)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ARTISAN MANAGEMENT ====================

    async createArtisan(artisanData) {
        try {
            const { data, error } = await this.supabase
                .from('artisans')
                .insert([artisanData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating artisan:', error);
            return { success: false, error: error.message };
        }
    }

    async getArtisan(userId) {
        try {
            const { data, error } = await this.supabase
                .from('artisans')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting artisan:', error);
            return { success: false, error: error.message };
        }
    }

    async updateArtisan(artisanId, artisanData) {
        try {
            const { data, error } = await this.supabase
                .from('artisans')
                .update(artisanData)
                .eq('id', artisanId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating artisan:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== PRODUCT MANAGEMENT ====================

    async createProduct(productData) {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .insert([productData])
                .select(`
                    *,
                    artisans (
                        business_name,
                        user_id
                    )
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating product:', error);
            return { success: false, error: error.message };
        }
    }

    async getProducts(filters = {}) {
        try {
            // Check if Supabase client is available
            if (!this.supabase || !this.isConnected) {
                console.warn('Supabase client not available, using fallback data');
                return this.getFallbackProducts();
            }
            
            let query = this.supabase
                .from('products')
                .select(`
                    *,
                    artisans (
                        business_name,
                        user_id,
                        rating
                    )
                `);

            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            if (filters.artisan_id) {
                query = query.eq('artisan_id', filters.artisan_id);
            }
            if (filters.featured) {
                query = query.eq('featured', filters.featured);
            }

            query = query.order('created_at', { ascending: false });

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.warn('Error getting products from database, using fallback:', error.message);
            console.warn('Falling back to sample data');
            return this.getFallbackProducts();
        }
    }

    async updateProduct(productId, productData) {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .update(productData)
                .eq('id', productId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating product:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteProduct(productId) {
        try {
            const { error } = await this.supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting product:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ORDER MANAGEMENT ====================

    async createOrder(orderData) {
        try {
            const { data, error } = await this.supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating order:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrders(filters = {}) {
        try {
            let query = this.supabase.from('orders').select('*');

            if (filters.userId) {
                query = query.eq('user_id', filters.userId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error getting orders:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== UTILITY METHODS ====================

    isOnline() {
        return this.isConnected;
    }

    // Fallback method to provide sample data when database is unavailable
    getFallbackProducts() {
        const sampleProducts = [
            {
                id: 'sample-1',
                title: 'Handcrafted Ceramic Vase',
                description: 'Beautiful handmade ceramic vase with unique glaze patterns.',
                price: 45.00,
                category: 'Ceramics',
                images: ['https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg'],
                artisans: {
                    business_name: 'Clay Creations',
                    rating: 4.8
                },
                status: 'active',
                featured: true
            },
            {
                id: 'sample-2',
                title: 'Wooden Cutting Board',
                description: 'Premium hardwood cutting board with natural finish.',
                price: 32.00,
                category: 'Woodwork',
                images: ['https://images.pexels.com/photos/4226796/pexels-photo-4226796.jpeg'],
                artisans: {
                    business_name: 'Wood Works Studio',
                    rating: 4.9
                },
                status: 'active',
                featured: false
            },
            {
                id: 'sample-3',
                title: 'Knitted Wool Scarf',
                description: 'Soft merino wool scarf in beautiful earth tones.',
                price: 28.00,
                category: 'Textiles',
                images: ['https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg'],
                artisans: {
                    business_name: 'Fiber Arts Co',
                    rating: 4.7
                },
                status: 'active',
                featured: true
            }
        ];

        return { success: true, data: sampleProducts };
    }
}

// Initialize and export
window.databaseService = new DatabaseService();
export default window.databaseService;