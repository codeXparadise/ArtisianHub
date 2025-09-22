/*
  # ArtisanHub Database Schema

  1. New Tables
    - `users` - User accounts and profiles
    - `artisans` - Artisan-specific data and shop information
    - `products` - Product catalog with full metadata
    - `orders` - Order management and tracking
    - `order_items` - Individual items within orders
    - `cart_items` - Shopping cart persistence
    - `reviews` - Product reviews and ratings
    - `favorites` - User wishlist/favorites

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure data access based on user roles

  3. Features
    - Full user authentication
    - Artisan shop management
    - Product catalog with images
    - Shopping cart and orders
    - Review system
*/

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    full_name text,
    phone text,
    address text,
    city text,
    country text,
    postal_code text,
    is_artisan boolean DEFAULT false,
    profile_completed boolean DEFAULT false,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create Artisans table
CREATE TABLE IF NOT EXISTS artisans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    business_name text,
    craft_specialty text,
    bio text,
    location text,
    website text,
    instagram text,
    facebook text,
    twitter text,
    experience_level text,
    techniques text[],
    achievements jsonb,
    portfolio_images text[],
    cover_image_url text,
    shop_visible boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    marketing_emails boolean DEFAULT false,
    monthly_reports boolean DEFAULT true,
    shipping_policy text,
    return_policy text,
    custom_orders text,
    rating decimal(3,2) DEFAULT 5.0,
    total_sales integer DEFAULT 0,
    total_revenue decimal(10,2) DEFAULT 0,
    joined_date timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create Products table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artisan_id uuid REFERENCES artisans(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    price decimal(10,2) NOT NULL,
    category text,
    subcategory text,
    materials text[],
    dimensions text,
    weight text,
    care_instructions text,
    images text[],
    video_url text,
    stock_quantity integer DEFAULT 1,
    is_custom_order boolean DEFAULT false,
    processing_time text,
    shipping_info text,
    status text DEFAULT 'active',
    featured boolean DEFAULT false,
    views integer DEFAULT 0,
    favorites integer DEFAULT 0,
    rating decimal(3,2) DEFAULT 5.0,
    review_count integer DEFAULT 0,
    tags text[],
    slug text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    order_number text UNIQUE NOT NULL,
    status text DEFAULT 'pending',
    total_amount decimal(10,2) NOT NULL,
    shipping_address jsonb,
    billing_address jsonb,
    payment_method text,
    payment_status text DEFAULT 'pending',
    shipping_method text,
    shipping_cost decimal(10,2) DEFAULT 0,
    tax_amount decimal(10,2) DEFAULT 0,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    artisan_id uuid REFERENCES artisans(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    unit_price decimal(10,2) NOT NULL,
    total_price decimal(10,2) NOT NULL,
    customization_notes text,
    created_at timestamptz DEFAULT now()
);

-- Create Cart Items table
CREATE TABLE IF NOT EXISTS cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    customization_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Create Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    artisan_id uuid REFERENCES artisans(id) ON DELETE CASCADE,
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title text,
    comment text,
    images text[],
    helpful_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

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
CREATE POLICY "Anyone can create user account" ON users FOR INSERT WITH CHECK (true);

-- Create RLS policies for artisans table
CREATE POLICY "Artisans visible to all" ON artisans FOR SELECT TO public USING (shop_visible = true);
CREATE POLICY "Artisans can manage own profile" ON artisans FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for products table
CREATE POLICY "Products visible to all" ON products FOR SELECT TO public USING (status = 'active');
CREATE POLICY "Artisans can manage own products" ON products FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM artisans WHERE id = artisan_id)
);

-- Create RLS policies for orders table
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for cart_items table
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for reviews table
CREATE POLICY "Reviews visible to all" ON reviews FOR SELECT TO public USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for favorites table
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Create function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
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

-- Insert sample data for testing
INSERT INTO users (id, email, full_name, is_artisan, profile_completed) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'sarah@example.com', 'Sarah Martinez', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'elena@example.com', 'Elena Rossi', true, true),
('550e8400-e29b-41d4-a716-446655440003', 'marcus@example.com', 'Marcus Chen', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'luna@example.com', 'Luna Crafts', true, true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO artisans (id, user_id, business_name, craft_specialty, bio, location) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Sarah''s Pottery', 'pottery', 'Creating beautiful ceramics inspired by Southwestern traditions for over 15 years.', 'Santa Fe, New Mexico'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Elena Textiles', 'textiles', 'Hand-weaving traditional Italian fabrics using techniques passed down through generations.', 'Florence, Italy'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Wood & Wonders', 'woodwork', 'Specializing in sustainable wood art and furniture with modern minimalist design.', 'Portland, Oregon'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Luna Crafts', 'jewelry', 'Handcrafted jewelry with natural stones and precious metals.', 'Austin, Texas')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO products (id, artisan_id, title, description, price, category, images, stock_quantity, featured) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Handcrafted Ceramic Bowl Set', 'Beautiful ceramic bowl set with intricate patterns, perfect for serving or display', 89.99, 'pottery', ARRAY['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop'], 5, true),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Traditional Handwoven Tapestry', 'Elegant handwoven tapestry using traditional Italian techniques', 245.00, 'textiles', ARRAY['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop'], 3, true),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'Modern Wood Sculpture', 'Contemporary wood sculpture crafted from sustainable oak', 380.00, 'woodwork', ARRAY['https://images.unsplash.com/photo-1596367407372-96cb88503db6?w=400&h=400&fit=crop'], 1, false),
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', 'Sterling Silver Pendant Necklace', 'Handcrafted sterling silver necklace with natural stone pendant', 125.00, 'jewelry', ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop'], 8, true)
ON CONFLICT (id) DO NOTHING;