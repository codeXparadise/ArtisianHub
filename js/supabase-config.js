// Supabase Configuration for ArtisanHub
class SupabaseConfig {
    constructor() {
        // Get environment variables
        this.SUPABASE_URL = 'https://rpuuxlkphxjlunduymdg.supabase.co';
        this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdXV4bGtwaHhqbHVuZHV5bWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NTU4NzEsImV4cCI6MjA1MzIzMTg3MX0.VJxGJKJQXOJJQXOJJQXOJJQXOJJQXOJJQXOJJQXOJJQ';
        
        this.supabase = null;
        this.isConnected = false;
        this.initPromise = this.init();
    }

    async init() {
        try {
            // Load Supabase library
            await this.loadSupabaseLibrary();
            
            // Initialize client
            this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
            
            // Test connection with timeout
            const connectionTest = await Promise.race([
                this.testConnection(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
            ]);
            
            this.isConnected = true;
            console.log('✅ Supabase connected successfully');
            
        } catch (error) {
            console.error('❌ Supabase connection failed:', error);
            this.isConnected = false;
            this.supabase = null;
        }
    }

    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js';
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
            if (!this.supabase) {
                throw new Error('Supabase client not initialized');
            }
            
            // Simple connection test
            const { error } = await this.supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .limit(1);
            
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            
            console.log('🔗 Database connection verified');
            return true;
        } catch (error) {
            console.warn('Database connection test failed:', error);
            throw error;
        }
    }

    getClient() {
        return this.supabase;
    }

    isOnline() {
        return this.isConnected;
    }
}

// Initialize and make globally available
window.supabaseConfig = new SupabaseConfig();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseConfig;
}