# Quick Start Guide

Get ArtisanHub up and running in 5 minutes!

## 🚀 Quick Setup

### 1. Install Dependencies (30 seconds)

```bash
git clone https://github.com/codeXparadise/ArtisianHub.git
cd ArtisianHub
npm install
```

### 2. Start Development Server (10 seconds)

```bash
npm run dev
```

Visit: http://localhost:3000

**That's it!** The app works in offline mode without any configuration.

---

## 🎯 Try These Features

### As a Customer:
1. Browse products on the homepage
2. Click "Marketplace" to see all products
3. Click "Add to Cart" on any product
4. Click the cart icon to view your cart
5. Click "Proceed to Checkout"
6. Fill in the form and complete checkout

### As an Artisan:
1. Click "Become an Artisan"
2. Fill in the registration form
3. Go to Dashboard (after login)
4. Click "Add Product"
5. Upload your handcrafted items

---

## 🔧 Optional: Enable Full Features

To enable authentication and database:

### 1. Create Supabase Account (5 minutes)
- Go to https://supabase.com
- Create a free account
- Create a new project

### 2. Configure Environment (1 minute)

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

### 3. Set Up Database (2 minutes)
- Copy SQL from `DEPLOYMENT.md`
- Paste in Supabase SQL Editor
- Run the query

### 4. Restart Server

```bash
npm run dev
```

Now you have:
- ✅ User authentication
- ✅ Real-time database
- ✅ Product uploads
- ✅ Order tracking

---

## 📱 Test on Mobile

```bash
npm run dev -- --host
```

Then visit from your phone using your computer's IP address.

---

## 🚢 Deploy to Production

### Vercel (Easiest):

```bash
npm install -g vercel
vercel --prod
```

Add environment variables in Vercel dashboard.

### Netlify:

```bash
npm run build
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## 🆘 Troubleshooting

**Port 3000 already in use?**
```bash
npm run dev -- --port 3001
```

**Changes not showing?**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache

**Images not loading?**
- External images may be blocked by adblockers
- This doesn't affect functionality

---

## 📚 Learn More

- [README.md](README.md) - Full documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute

---

## 💡 Pro Tips

1. **Offline First**: The app works completely offline - perfect for demos
2. **Cart Persistence**: Cart saves automatically to localStorage
3. **Responsive**: Try resizing your browser - works on all sizes
4. **Fast Development**: Vite provides instant hot reload

---

**Happy Building! 🎨**

Questions? Open an issue on GitHub!
