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
            console.error('Error getting products:', error);
            return { success: false, error: error.message };
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
}

// Initialize and export
window.databaseService = new DatabaseService();
export default window.databaseService;