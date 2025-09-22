# ArtisanHub Marketplace

ArtisanHub is a modern, responsive e-commerce platform designed for artisans and customers alike. It empowers artisans to showcase and sell their handcrafted creations while providing customers with a unique shopping experience.

## Teaser Video
[Watch the teaser video](media/teaser.mp4)

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

- [Node.js](https://nodejs.org/en/) for local development
- [Git](https://git-scm.com/) for version control
- [Supabase](https://supabase.io/) account for database integration

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/codeXparadise/ArtisianHub.git
   cd ArtisianHub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   (This project largely relies on HTML, CSS, and JavaScript, so dependencies might be minimal.)

3. **Configure Supabase:**
   - Update `js/supabase-config.js` with your Supabase credentials.

4. **Start a local development server:**
   ```bash
   npx http-server -p 3000
   ```
   Or use the VS Code Live Server extension to open `index.html`.

5. **Access the Application:**
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## Usage

- **Homepage:** Browse featured products and artisan listings.
- **User Authentication:** Use the Sign In/Register buttons to access your account.
- **Become an Artisan:** Register as an artisan to start uploading your handcrafted creations.
- **Shopping Cart:** Add products to your cart, update quantities, and proceed to checkout.

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

## Screenshots

![Screenshot 2025-09-23 010748](media/Screenshot%202025-09-23%20010748.png)
![Screenshot 2025-09-23 010823](media/Screenshot%202025-09-23%20010823.png)
![Screenshot 2025-09-23 010916](media/Screenshot%202025-09-23%20010916.png)

## Contributing

Contributions are welcome! Please:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

Please ensure your code adheres to the existing style and includes proper testing.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.