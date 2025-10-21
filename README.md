# ArtisanHub Marketplace

ArtisanHub is a modern, responsive e-commerce platform designed for artisans and customers alike. It empowers artisans to showcase and sell their handcrafted creations while providing customers with a unique shopping experience.

## Teaser Video
[Watch the teaser video](media/teaser.mp4)

## Preview

![Screenshot 2025-09-23 010748](media/Screenshot%202025-09-23%20010748.png)
![Screenshot 2025-09-23 010823](media/Screenshot%202025-09-23%20010823.png)
![Screenshot 2025-09-23 010916](media/Screenshot%202025-09-23%20010916.png)


## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Data Flow & Pipeline](#data-flow--pipeline)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Dynamic Artisan Marketplace:** Multiple artisans can create profiles, upload products, and the platform automatically generates product pages.
- **User Authentication:** Secure login and registration system with session management and persistent data.
- **Shopping Cart:** A fully functional shopping cart with real-time updates, persistent across sessions.
- **Database Integration:** Uses Supabase (PostgreSQL-based) for storing user data, products, orders, and more.
- **Responsive Design:** Mobile-first design ensuring a seamless experience on all devices.
- **Real-time Data Updates:** Dynamic content loading keeps the marketplace fresh and up-to-date.
- **Data Migration Pipeline:** Efficiently migrates guest data to authenticated user accounts.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v16 or higher) for local development
- [Git](https://git-scm.com/) for version control
- [Supabase](https://supabase.io/) account for database integration (optional - works offline without it)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/codeXparadise/ArtisianHub.git
   cd ArtisianHub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (Optional):**
   
   The app works in offline mode without configuration. To enable full features:
   
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at [http://localhost:3000](http://localhost:3000)

5. **Build for production:**
   ```bash
   npm run build
   ```
   
   The production-ready files will be in the `dist/` folder.

### Features Available in Different Modes

**Offline Mode (No Supabase):**
- ✅ Browse product catalog
- ✅ Add items to cart
- ✅ View all pages
- ✅ Complete UI walkthrough
- ❌ User authentication
- ❌ Artisan product uploads
- ❌ Real-time updates

**Online Mode (With Supabase):**
- ✅ All offline features
- ✅ User registration and login
- ✅ Artisan dashboard and product management
- ✅ Order history and tracking
- ✅ Real-time product updates
- ✅ Persistent cart across devices

### Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for various platforms (Vercel, Netlify, GitHub Pages, etc.).

## Usage

### For Customers

1. **Browse Products:** Visit the homepage or marketplace to discover handcrafted items
2. **Search & Filter:** Use the search bar and filters to find specific products
3. **Add to Cart:** Click "Add to Cart" on any product
4. **Checkout:** Click the cart icon, review items, and proceed to checkout
5. **Create Account:** Sign up to track orders and save favorites

### For Artisans

1. **Register:** Click "Become an Artisan" and complete the registration
2. **Set Up Profile:** Complete your artisan profile with bio and photos
3. **Upload Products:** Use the dashboard to add your handcrafted items
4. **Manage Orders:** Track sales and fulfill customer orders
5. **Build Portfolio:** Showcase your work to potential customers worldwide

### Key Features

- 🛍️ **Shopping Cart:** Persistent cart that saves across sessions
- 🔐 **User Authentication:** Secure login and registration
- 🎨 **Artisan Dashboard:** Complete product management system
- 💳 **Checkout Flow:** Streamlined checkout with multiple payment options
- 📱 **Responsive Design:** Works perfectly on all devices
- 🌐 **Offline Support:** Browse products even without database connection

## Project Structure

```
ArtisianHub/
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── script.js           # Core JavaScript functionality
│   ├── supabase-config.js  # Supabase configuration
│   ├── user-auth.js        # User authentication logic
│   ├── homepage-manager.js # Dynamic product loading
│   ├── session-manager.js  # Session and state management
│   └── enhanced-auth.js    # Advanced authentication and artisan onboarding
├── pages/
│   ├── marketplace.html    # Marketplace view
│   ├── user-auth.html      # Login/Register page
│   ├── become-artisan.html # Artisan registration page
│   └── [other pages]       # Additional feature pages
├── media/                  # Screenshots, videos, and media assets
│   ├── teaser.mp4          # Project teaser video
│   ├── Screenshot 2025-09-23 010748.png # Example screenshot
│   ├── Screenshot 2025-09-23 010823.png # Example screenshot
│   └── Screenshot 2025-09-23 010916.png # Example screenshot
├── index.html              # Main landing page
└── README.md               # Project documentation
```

## Technologies

- **Frontend:** HTML, CSS, JavaScript (ES6+)
- **Backend / Database:** Supabase (PostgreSQL-based)
- **Version Control:** Git & GitHub
- **Development Tools:** Node.js, http-server, VS Code Live Server

## Data Flow & Pipeline

1. **User Registration & Authentication:**
   - Secure signup/login forms with session management.
   - Guest data (cart, wishlist, preferences) migrates upon login.

2. **Artisan Product Upload:**
   - Artisans upload product details which are stored in the database.
   - Products are dynamically loaded onto the homepage and marketplace.

3. **Cart & Order Management:**
   - Products added to cart are persisted using a session management system.
   - Order data is tracked and synchronized with the database.

4. **Real-time Updates:**
   - Dynamic content loading ensures users always view the latest data.

## Pages Overview

- **Homepage (`index.html`):** Landing page with featured products and artisans
- **Marketplace (`pages/marketplace.html`):** Full product catalog with filters
- **User Authentication (`pages/user-auth.html`):** Login and registration
- **Artisan Registration (`pages/become-artisan.html`):** Artisan onboarding
- **Dashboard (`pages/dashboard.html`):** Artisan management dashboard
- **Product Upload (`pages/add-product.html`):** Add new products
- **Product Detail (`pages/product-detail.html`):** Detailed product view
- **Checkout (`pages/checkout.html`):** Complete purchase flow
- **Order Confirmation (`pages/order-confirmation.html`):** Order success page
- **Contact (`pages/contact.html`):** Contact form and information
- **Profile Setup (`pages/profile-setup.html`):** User profile management

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Code style and standards
- Commit message format
- Pull request process
- Bug reporting
- Feature requests

## Documentation

- 📖 [Deployment Guide](DEPLOYMENT.md) - Deploy to production
- 🤝 [Contributing Guide](CONTRIBUTING.md) - How to contribute
- 📊 [Data Pipeline](DATA_PIPELINE.md) - Data flow architecture
- ✅ [Test Summary](TEST_SUMMARY.md) - Testing overview

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Performance

- Fast initial load time
- Optimized images and assets
- Efficient code splitting
- Progressive enhancement

## Security

- Secure authentication with Supabase
- Row-level security on database
- HTTPS enforced in production
- Environment variables for sensitive data
- Input validation and sanitization

## Roadmap

- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Advanced search and filtering
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Email notifications
- [ ] Admin panel
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app (React Native)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- UI inspiration from modern e-commerce platforms
- Icons from Font Awesome
- Fonts from Google Fonts
- Database and Auth by Supabase

## Support

For support, please:
- Open an issue on GitHub
- Email: support@artisanhub.com
- Check the documentation

---

**Made with ❤️ for artisans worldwide**
