# ArtisanHub Deployment Guide

This guide will help you deploy ArtisanHub to production.

## Prerequisites

- Node.js 16+ and npm
- A Supabase account (for database and authentication)
- A hosting service (Vercel, Netlify, or similar)

## Environment Setup

### 1. Supabase Configuration

1. Create a free account at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to Project Settings > API
4. Copy your project URL and anon/public key

### 2. Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Database Schema Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  is_artisan BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Products are viewable by everyone" 
  ON public.products FOR SELECT USING (true);

CREATE POLICY "Artisans can insert own products" 
  ON public.products FOR INSERT 
  WITH CHECK (auth.uid() = artisan_id);

CREATE POLICY "Artisans can update own products" 
  ON public.products FOR UPDATE 
  USING (auth.uid() = artisan_id);

-- Orders policies
CREATE POLICY "Users can view own orders" 
  ON public.orders FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" 
  ON public.orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view own order items" 
  ON public.order_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Option 2: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. Add environment variables in Netlify dashboard:
   - Go to Site settings > Build & deploy > Environment
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Option 3: GitHub Pages

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "deploy": "vite build && gh-pages -d dist"
     }
   }
   ```

3. Update `vite.config.js`:
   ```js
   export default defineConfig({
     base: '/ArtisianHub/',
     // ... rest of config
   })
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

### Option 4: Traditional Web Host

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the contents of `dist/` folder to your web host

3. Configure environment variables on your hosting platform

4. Ensure your server redirects all routes to `index.html` for SPA routing

## Post-Deployment Setup

### 1. Configure Allowed URLs in Supabase

In your Supabase project settings:
- Go to Authentication > URL Configuration
- Add your production domain to allowed redirect URLs
- Add your production domain to allowed site URLs

### 2. Test the Deployment

1. Visit your deployed URL
2. Test user registration and login
3. Test product browsing and cart functionality
4. Test artisan product upload (if applicable)
5. Test checkout flow

### 3. Configure Email Templates (Optional)

In Supabase:
- Go to Authentication > Email Templates
- Customize confirmation and reset password emails

## Performance Optimization

### Enable Caching

Add this to your hosting platform's configuration:

```
# Cache static assets for 1 year
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Cache images for 1 month
/images/*
  Cache-Control: public, max-age=2592000

# Don't cache HTML
/*.html
  Cache-Control: no-cache
```

### Image Optimization

Consider using a CDN or image optimization service like:
- Cloudinary
- ImageKit
- Imgix

Update image URLs in your code to use the CDN.

## Monitoring and Maintenance

### 1. Set Up Error Tracking

Consider integrating services like:
- Sentry
- LogRocket
- Bugsnag

### 2. Analytics

Add Google Analytics or similar:

```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-GA-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-GA-ID');
</script>
```

### 3. Regular Backups

- Enable Supabase automatic backups (available in paid plans)
- Export database periodically
- Keep backup of environment variables

## Security Checklist

- [ ] Environment variables are properly configured
- [ ] Supabase RLS policies are enabled
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] API keys are not exposed in client code
- [ ] Regular security updates for dependencies

## Troubleshooting

### Issue: "Supabase environment variables not found"

**Solution**: Make sure you've created a `.env` file with the correct variables.

### Issue: Cart not persisting

**Solution**: Check browser local storage settings and ensure cookies are enabled.

### Issue: Images not loading

**Solution**: 
1. Check if external image URLs are accessible
2. Verify CORS settings
3. Consider using a CDN for images

### Issue: Authentication not working

**Solution**:
1. Verify Supabase credentials
2. Check allowed URLs in Supabase settings
3. Ensure redirect URLs are correctly configured

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/codeXparadise/ArtisianHub/issues)
- Email: support@artisanhub.com

## License

This project is licensed under the MIT License.
