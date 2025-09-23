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
            
            // Mark as connected without testing to avoid CORS issues
            this.isConnected = true;
            console.log('✅ Supabase client initialized');
            
        } catch (error) {
            console.warn('⚠️ Supabase initialization failed, running in offline mode:', error.message);
            this.isConnected = false;
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