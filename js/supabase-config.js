// Supabase Configuration for ArtisanHub
class SupabaseConfig {
    constructor() {
        // Get environment variables from Vite
        this.SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        this.SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        this.supabase = null;
        this.isConnected = false;
        this.initPromise = this.init();
    }

    async init() {
        try {
            // Check if environment variables are available
            if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
                console.warn('⚠️ Supabase environment variables not found, running in offline mode');
                this.isConnected = false;
                return;
            }
            
            // Load Supabase library
            await this.loadSupabaseLibrary();
            
            // Initialize client
            this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
            
            // Mark as connected (we'll handle errors during actual operations)
            this.isConnected = true;
            console.log('✅ Supabase client initialized');
            
        } catch (error) {
            console.warn('⚠️ Supabase initialization failed, running in offline mode:', error.message);
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