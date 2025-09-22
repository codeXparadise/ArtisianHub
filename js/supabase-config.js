// Supabase Configuration for ArtisanHub
class SupabaseConfig {
    constructor() {
        // Supabase project configuration
        this.SUPABASE_URL = 'https://rpuuxlkphxjlunduymd.supabase.co';
        this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdXV4bGtwaHhqbHVuZHV5bWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTkxODEsImV4cCI6MjA3NDEzNTE4MX0.g_N2h8l7TbUED1pEfd23FUWtyPKjYqTyhfGz6X2Z6oY';
        
        // Initialize Supabase client
        this.supabase = null;
        this.isConnected = false;
        
        this.init();
    }

    async init() {
        try {
            // Load Supabase library dynamically
            await this.loadSupabaseLibrary();
            
            // Initialize Supabase client
            this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
            
            // Test connection
            await this.testConnection();
            
            this.isConnected = true;
            console.log('✅ Supabase connected successfully');
            
            // Initialize database tables if needed
            await this.initializeTables();
            
        } catch (error) {
            console.error('❌ Supabase connection failed:', error);
            this.isConnected = false;
            
            // Fallback to localStorage for offline functionality
            this.initializeLocalStorage();
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
            const { data, error } = await this.supabase
                .from('users')
                .select('count', { count: 'exact', head: true });
            
            if (error && error.code !== 'PGRST116') { // PGRST116 means table doesn't exist yet
                throw error;
            }
            
            console.log('🔗 Database connection test successful');
            return true;
        } catch (error) {
            console.error('Database connection test failed:', error);
            throw error;
        }
    }

    async initializeTables() {
        try {
            // Check if tables exist, if not, we'll create them via SQL
            const tables = ['users', 'artisans', 'products', 'orders', 'cart_items'];
            
            for (const table of tables) {
                const { error } = await this.supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                
                if (error && error.code === 'PGRST116') {
                    console.log(`⚠️ Table '${table}' doesn't exist. Please create database schema.`);
                }
            }
            
            console.log('📋 Database tables check completed');
        } catch (error) {
            console.error('Error checking tables:', error);
        }
    }

    initializeLocalStorage() {
        console.log('🔄 Initializing localStorage fallback');
        
        // Initialize localStorage with empty arrays if they don't exist
        const stores = ['users', 'artisans', 'products', 'orders', 'cart_items'];
        
        stores.forEach(store => {
            if (!localStorage.getItem(store)) {
                localStorage.setItem(store, JSON.stringify([]));
            }
        });
    }

    // Database schema creation SQL (to be run in Supabase SQL editor)
    getDatabaseSchema() {
        return `
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'ww358zYuUoCJbRmZNYToDviPZe+fZIJjth+PzFeG7GxYDeA11DEt+mV/GpxpJE0iVHwoeUMLy0TWmvxg9f6rmw==';

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    is_artisan BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Artisans table
CREATE TABLE IF NOT EXISTS artisans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    craft VARCHAR(100),
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    instagram VARCHAR(100),
    facebook VARCHAR(255),
    twitter VARCHAR(100),
    experience_level VARCHAR(50),
    techniques TEXT[], -- Array of techniques
    achievements JSONB, -- JSON array of achievements
    portfolio_images TEXT[], -- Array of image URLs
    cover_image_url TEXT,
    shop_visible BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    monthly_reports BOOLEAN DEFAULT TRUE,
    shipping_policy TEXT,
    return_policy TEXT,
    custom_orders TEXT,
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_sales INTEGER DEFAULT 0,
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artisan_id UUID REFERENCES artisans(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    materials TEXT[],
    dimensions VARCHAR(255),
    weight VARCHAR(100),
    images TEXT[], -- Array of image URLs
    video_url TEXT,
    stock_quantity INTEGER DEFAULT 1,
    is_custom_order BOOLEAN DEFAULT FALSE,
    processing_time VARCHAR(100),
    shipping_info TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, draft, sold, inactive
    views INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 5.0,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'pending',
    shipping_method VARCHAR(100),
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    artisan_id UUID REFERENCES artisans(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    customization_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Cart Items table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    customization_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    artisan_id UUID REFERENCES artisans(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images TEXT[],
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_artisans_user_id ON artisans(user_id);
CREATE INDEX IF NOT EXISTS idx_products_artisan_id ON products(artisan_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for artisans table
CREATE POLICY "Artisans visible to all" ON artisans FOR SELECT TO public USING (shop_visible = true);
CREATE POLICY "Artisans can update own profile" ON artisans FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for products table
CREATE POLICY "Products visible to all" ON products FOR SELECT TO public USING (status = 'active');
CREATE POLICY "Artisans can manage own products" ON products FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM artisans WHERE id = artisan_id)
);

-- Create RLS policies for orders table
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Artisans can view orders containing their products" ON orders FOR SELECT USING (
    id IN (SELECT DISTINCT order_id FROM order_items WHERE artisan_id IN (
        SELECT id FROM artisans WHERE user_id = auth.uid()
    ))
);

-- Create RLS policies for order_items table
CREATE POLICY "Order items visible to order owner and artisan" ON order_items FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM orders WHERE id = order_id
        UNION
        SELECT user_id FROM artisans WHERE id = artisan_id
    )
);

-- Create RLS policies for cart_items table
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for reviews table
CREATE POLICY "Reviews visible to all" ON reviews FOR SELECT TO public USING (true);
CREATE POLICY "Users can create reviews for purchased products" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for favorites table
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artisans_updated_at BEFORE UPDATE ON artisans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `;
    }

    // Get the client instance
    getClient() {
        return this.supabase;
    }

    // Check if connected to Supabase
    isOnline() {
        return this.isConnected;
    }

    // Get storage bucket URL for file uploads
    getStorageUrl(bucket, path) {
        if (!this.isConnected) return null;
        return `${this.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    }
}

// Initialize Supabase configuration
window.supabaseConfig = new SupabaseConfig();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseConfig;
}