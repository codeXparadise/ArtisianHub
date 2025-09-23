// Supabase Client Configuration for ArtisanHub
class SupabaseClient {
    constructor() {
        this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        this.client = null;
        this.isInitialized = false;
        this.initPromise = this.init();
    }

    async init() {
        try {
            // Load Supabase library
            if (!window.supabase) {
                await this.loadSupabaseLibrary();
            }

            // Initialize client
            this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
            
            // Test connection
            await this.testConnection();
            
            this.isInitialized = true;
            console.log('✅ Supabase client initialized successfully');
            
            return this.client;
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
            throw error;
        }
    }

    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
            script.onload = () => {
                console.log('📦 Supabase library loaded');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Supabase library'));
            };
            document.head.appendChild(script);
        });
    }

    async testConnection() {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('count', { count: 'exact', head: true });
            
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            
            console.log('🔗 Database connection verified');
            return true;
        } catch (error) {
            console.warn('Database connection test failed, using fallback mode');
            return false;
        }
    }

    getClient() {
        return this.client;
    }

    isReady() {
        return this.isInitialized;
    }
}

// Initialize and export
window.supabaseClient = new SupabaseClient();

export default window.supabaseClient;