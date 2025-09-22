// Product Upload System for ArtisanHub
class ProductUploadSystem {
    constructor() {
        this.currentArtisan = null;
        this.db = null;
        this.isInitialized = false;
        this.selectedImages = [];
        this.maxImages = 5;
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.init();
    }

    async init() {
        try {
            // Check if artisan is logged in
            await this.checkArtisanAuth();
            
            // Wait for database service to be ready
            if (window.databaseService) {
                await window.databaseService.initPromise;
                this.db = window.databaseService;
            }
            
            this.setupEventListeners();
            this.setupImageUpload();
            this.isInitialized = true;
            
            console.log('📦 Product Upload System initialized');
        } catch (error) {
            console.error('Error initializing product upload system:', error);
            this.showNotification('Please log in as an artisan to upload products', 'error');
            setTimeout(() => {
                window.location.href = 'become-artisan.html';
            }, 2000);
        }
    }

    async checkArtisanAuth() {
        // Check if current user is an artisan
        const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        
        if (!currentUser) {
            throw new Error('No user logged in');
        }
        
        try {
            this.currentArtisan = JSON.parse(currentUser);
            
            if (!this.currentArtisan.isArtisan) {
                throw new Error('User is not an artisan');
            }
            
        } catch (error) {
            throw new Error('Invalid user session');
        }
    }

    setupEventListeners() {
        // Form submission
        const uploadForm = document.getElementById('product-upload-form');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleProductUpload(e));
        }

        // Save draft button
        const saveDraftBtn = document.getElementById('save-draft-btn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft());
        }

        // Form validation
        this.setupFormValidation();
    }

    setupImageUpload() {
        const uploadArea = document.getElementById('image-upload-area');
        const imageInput = document.getElementById('image-input');
        
        if (!uploadArea || !imageInput) return;

        // Click to upload
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleImageSelection(files);
        });

        // File input change
        imageInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleImageSelection(files);
        });
    }

    handleImageSelection(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        // Check file limits
        if (this.selectedImages.length + imageFiles.length > this.maxImages) {
            this.showNotification(`Maximum ${this.maxImages} images allowed`, 'error');
            return;
        }

        // Process each image
        imageFiles.forEach(file => {
            if (file.size > this.maxFileSize) {
                this.showNotification(`${file.name} is too large (max 5MB)`, 'error');
                return;
            }

            this.addImageToPreview(file);
        });
    }

    addImageToPreview(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const imageData = {
                file: file,
                url: e.target.result,
                id: Date.now() + Math.random()
            };
            
            this.selectedImages.push(imageData);
            this.renderImagePreview();
        };
        
        reader.readAsDataURL(file);
    }

    renderImagePreview() {
        const previewContainer = document.getElementById('image-preview');
        if (!previewContainer) return;

        previewContainer.innerHTML = '';

        this.selectedImages.forEach((imageData, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            previewItem.innerHTML = `
                <img src="${imageData.url}" alt="Preview ${index + 1}" class="preview-image">
                <button type="button" class="preview-remove" onclick="productUpload.removeImage(${imageData.id})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            previewContainer.appendChild(previewItem);
        });
    }

    removeImage(imageId) {
        this.selectedImages = this.selectedImages.filter(img => img.id !== imageId);
        this.renderImagePreview();
    }

    async handleProductUpload(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        
        // Validate form
        if (!this.validateForm(formData)) {
            return;
        }

        // Show loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
        submitButton.disabled = true;

        try {
            // Upload images first
            const imageUrls = await this.uploadImages();
            
            // Prepare product data with full metadata
            const productData = {
                title: formData.get('title').trim(),
                description: formData.get('description').trim(),
                price: parseFloat(formData.get('price')),
                quantity: parseInt(formData.get('quantity')),
                category: formData.get('category'),
                materials: formData.get('materials')?.trim() || null,
                dimensions: formData.get('dimensions')?.trim() || null,
                weight: formData.get('weight')?.trim() || null,
                care: formData.get('care')?.trim() || null,
                images: imageUrls,
                artisanId: this.currentArtisan.id,
                artisanName: this.currentArtisan.businessName || this.currentArtisan.fullName || this.currentArtisan.name,
                status: 'active',
                featured: false,
                views: 0,
                likes: 0,
                sales: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                slug: this.generateSlug(formData.get('title').trim())
            };

            // Save to database
            const result = await this.db.createProduct(productData);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to create product');
            }

            // Generate individual product HTML page
            await this.generateProductPage(result.product || productData);
            
            // Update marketplace and main page
            await this.updateMarketplace();

            // Show success message
            this.showNotification('Product published successfully! 🎉', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('Product upload error:', error);
            this.showNotification(error.message || 'Failed to publish product', 'error');
        } finally {
            // Reset button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    // Generate a URL-friendly slug from product title
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    // Generate individual product HTML page
    async generateProductPage(product) {
        const htmlContent = this.generateProductHTML(product);
        
        try {
            // Store HTML content in localStorage for now (in production, save to server/database)
            const productPages = JSON.parse(localStorage.getItem('productPages') || '{}');
            productPages[product.id] = {
                html: htmlContent,
                slug: product.slug,
                title: product.title,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('productPages', JSON.stringify(productPages));
            
            console.log(`Generated product page for: ${product.title}`);
        } catch (error) {
            console.error('Failed to save product page:', error);
        }
    }

    // Generate HTML content for individual product page
    generateProductHTML(product) {
        const imageGallery = product.images.length > 1 ? `
            <div class="image-thumbnails">
                ${product.images.map((img, index) => `
                    <img src="${img}" alt="${product.title}" class="thumbnail ${index === 0 ? 'active' : ''}" 
                         onclick="changeMainImage('${img}', this)">
                `).join('')}
            </div>
        ` : '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${product.title} - ArtisanHub</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <meta name="description" content="${product.description.substring(0, 160)}">
    <meta property="og:title" content="${product.title}">
    <meta property="og:description" content="${product.description}">
    <meta property="og:image" content="${product.images[0]}">
    <meta property="og:type" content="product">
    
    <style>
        .product-detail-container { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }
        .product-detail { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 3rem; }
        .product-images { display: flex; flex-direction: column; gap: 1rem; }
        .main-image img { width: 100%; height: 500px; object-fit: cover; border-radius: 12px; }
        .image-thumbnails { display: flex; gap: 0.5rem; }
        .thumbnail { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; cursor: pointer; opacity: 0.7; transition: all 0.3s; }
        .thumbnail.active, .thumbnail:hover { opacity: 1; border: 2px solid var(--primary-color); }
        .product-info { padding: 1rem 0; }
        .product-title { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-dark); }
        .product-artist { color: var(--primary-color); margin-bottom: 1rem; font-weight: 500; }
        .product-price { font-size: 1.5rem; font-weight: 700; color: var(--primary-color); margin: 1rem 0; }
        .product-description { margin: 1.5rem 0; line-height: 1.6; }
        .product-details { background: var(--light-gray); padding: 1.5rem; border-radius: 12px; margin: 1.5rem 0; }
        .product-details h3 { margin-bottom: 1rem; }
        .product-details p { margin: 0.5rem 0; }
        .quantity-selector { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0; }
        .quantity-controls { display: flex; align-items: center; border: 1px solid var(--gray); border-radius: 8px; }
        .quantity-controls button { border: none; background: none; padding: 0.5rem 1rem; cursor: pointer; }
        .quantity-controls input { border: none; text-align: center; width: 60px; padding: 0.5rem; }
        .product-actions { display: flex; flex-direction: column; gap: 1rem; margin: 2rem 0; }
        .shipping-info { background: var(--cream); padding: 1.5rem; border-radius: 12px; margin-top: 2rem; }
        .shipping-info h3 { margin-bottom: 1rem; }
        .shipping-info p { margin: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem; }
        .breadcrumb { margin: 1rem 0; display: flex; align-items: center; gap: 0.5rem; color: var(--text-light); }
        .breadcrumb a { color: var(--primary-color); text-decoration: none; }
        .artist-info { background: white; border-radius: 16px; padding: 2rem; box-shadow: var(--shadow-md); }
        .artist-card { display: flex; align-items: center; gap: 1.5rem; }
        .artist-avatar img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
        @media (max-width: 768px) {
            .product-detail { grid-template-columns: 1fr; gap: 2rem; }
            .product-detail-container { padding: 1rem; }
            .main-image img { height: 300px; }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav container">
            <div class="nav__brand">
                <a href="../index.html" style="text-decoration: none; color: inherit;">
                    <h1 class="brand__logo">ArtisanHub</h1>
                    <span class="brand__tagline">Handcrafted with Love</span>
                </a>
            </div>
            <div class="nav__menu">
                <a href="../index.html" class="nav__link">Home</a>
                <a href="marketplace.html" class="nav__link">Marketplace</a>
                <a href="user-auth.html" class="nav__link">Sign In</a>
            </div>
        </nav>
    </header>

    <main class="main">
        <div class="product-detail-container">
            <nav class="breadcrumb">
                <a href="../index.html">Home</a> / 
                <a href="marketplace.html">Marketplace</a> / 
                <a href="marketplace.html?category=${product.category}">${product.category}</a> / 
                <span>${product.title}</span>
            </nav>

            <div class="product-detail">
                <div class="product-images">
                    <div class="main-image">
                        <img src="${product.images[0]}" alt="${product.title}" id="main-product-image">
                    </div>
                    ${imageGallery}
                </div>

                <div class="product-info">
                    <h1 class="product-title">${product.title}</h1>
                    <p class="product-artist">by ${product.artisanName}</p>
                    
                    <div class="product-rating">
                        <div class="stars">
                            ${'<i class="fas fa-star"></i>'.repeat(5)}
                        </div>
                        <span class="rating-count">(New Product)</span>
                    </div>

                    <div class="product-price">$${product.price.toFixed(2)}</div>

                    <div class="product-description">
                        <p>${product.description}</p>
                    </div>

                    ${product.materials || product.dimensions || product.weight || product.care ? `
                    <div class="product-details">
                        <h3>Product Details</h3>
                        ${product.materials ? `<p><strong>Materials:</strong> ${product.materials}</p>` : ''}
                        ${product.dimensions ? `<p><strong>Dimensions:</strong> ${product.dimensions}</p>` : ''}
                        ${product.weight ? `<p><strong>Weight:</strong> ${product.weight}</p>` : ''}
                        ${product.care ? `<p><strong>Care Instructions:</strong> ${product.care}</p>` : ''}
                    </div>
                    ` : ''}

                    <div class="quantity-selector">
                        <label for="quantity">Quantity:</label>
                        <div class="quantity-controls">
                            <button type="button" onclick="changeQuantity(-1)">-</button>
                            <input type="number" id="quantity" value="1" min="1" max="${product.quantity}">
                            <button type="button" onclick="changeQuantity(1)">+</button>
                        </div>
                        <span>${product.quantity} available</span>
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn btn--primary btn--full" onclick="addToCart('${product.id}')">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="btn btn--outline" onclick="toggleWishlist('${product.id}')">
                            <i class="far fa-heart"></i> Add to Wishlist
                        </button>
                    </div>

                    <div class="shipping-info">
                        <h3>Shipping & Returns</h3>
                        <p><i class="fas fa-truck"></i> Free shipping on orders over $50</p>
                        <p><i class="fas fa-undo"></i> 30-day return policy</p>
                        <p><i class="fas fa-shield-alt"></i> Secure payment & buyer protection</p>
                    </div>
                </div>
            </div>

            <div class="artist-info">
                <h2>About the Artist</h2>
                <div class="artist-card">
                    <div class="artist-avatar">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" alt="${product.artisanName}">
                    </div>
                    <div class="artist-details">
                        <h3>${product.artisanName}</h3>
                        <p>Passionate artisan creating beautiful handcrafted items with attention to detail and quality.</p>
                        <a href="artist-profile.html?id=${product.artisanId}" class="btn btn--outline btn--sm">View Artist Profile</a>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer__content">
                <div class="footer__section">
                    <h3 class="footer__title">ArtisanHub</h3>
                    <p class="footer__description">Connecting artisans with the world through beautiful handcrafted creations.</p>
                </div>
            </div>
            <div class="footer__bottom">
                <p class="footer__copyright">© 2025 ArtisanHub. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="../js/supabase-config.js"></script>
    <script src="../js/database-service.js"></script>
    <script src="../js/script.js"></script>
    <script>
        function changeMainImage(imageSrc, thumbnail) {
            document.getElementById('main-product-image').src = imageSrc;
            document.querySelectorAll('.thumbnail').forEach(thumb => thumb.classList.remove('active'));
            thumbnail.classList.add('active');
        }

        function changeQuantity(delta) {
            const quantityInput = document.getElementById('quantity');
            const currentValue = parseInt(quantityInput.value);
            const newValue = currentValue + delta;
            const max = parseInt(quantityInput.max);
            
            if (newValue >= 1 && newValue <= max) {
                quantityInput.value = newValue;
            }
        }

        async function addToCart(productId) {
            const quantity = parseInt(document.getElementById('quantity').value);
            try {
                // Add to cart functionality
                const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
                const existingItem = cartItems.find(item => item.id === productId);
                
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    cartItems.push({ id: productId, quantity: quantity, addedAt: new Date().toISOString() });
                }
                
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                alert('Product added to cart!');
            } catch (error) {
                console.error('Add to cart failed:', error);
                alert('Failed to add to cart. Please try again.');
            }
        }

        function toggleWishlist(productId) {
            try {
                const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                const index = wishlist.indexOf(productId);
                
                if (index > -1) {
                    wishlist.splice(index, 1);
                    alert('Removed from wishlist');
                } else {
                    wishlist.push(productId);
                    alert('Added to wishlist!');
                }
                
                localStorage.setItem('wishlist', JSON.stringify(wishlist));
            } catch (error) {
                console.error('Wishlist error:', error);
            }
        }

        // Track product view
        document.addEventListener('DOMContentLoaded', () => {
            const productId = '${product.id}';
            try {
                const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
                if (!viewedProducts.includes(productId)) {
                    viewedProducts.push(productId);
                    localStorage.setItem('viewedProducts', JSON.stringify(viewedProducts));
                }
            } catch (error) {
                console.error('View tracking error:', error);
            }
        });
    </script>
</body>
</html>`;
    }

    // Update marketplace with new products
    async updateMarketplace() {
        try {
            // Get all active products
            const products = await this.db.getProducts({ status: 'active' });
            
            if (products.success && products.data) {
                // Store updated product list for marketplace
                localStorage.setItem('marketplaceProducts', JSON.stringify(products.data));
                console.log('Marketplace updated with new products');
            }
        } catch (error) {
            console.error('Failed to update marketplace:', error);
        }
    }

    async uploadImages() {
        const imageUrls = [];
        
        for (const imageData of this.selectedImages) {
            try {
                // For now, convert to base64 for storage
                // In a real app, you'd upload to Supabase Storage or a CDN
                const base64 = await this.fileToBase64(imageData.file);
                imageUrls.push(base64);
            } catch (error) {
                console.error('Error processing image:', error);
                // Continue with other images
            }
        }
        
        return imageUrls;
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async saveDraft() {
        const form = document.getElementById('product-upload-form');
        const formData = new FormData(form);
        
        // Basic validation for draft
        if (!formData.get('title')?.trim()) {
            this.showNotification('Please enter a product title to save draft', 'error');
            return;
        }

        try {
            // Upload images
            const imageUrls = await this.uploadImages();
            
            // Prepare draft data
            const draftData = {
                title: formData.get('title').trim(),
                description: formData.get('description')?.trim() || '',
                price: formData.get('price') ? parseFloat(formData.get('price')) : 0,
                quantity: formData.get('quantity') ? parseInt(formData.get('quantity')) : 1,
                category: formData.get('category') || null,
                materials: formData.get('materials')?.trim() || null,
                dimensions: formData.get('dimensions')?.trim() || null,
                weight: formData.get('weight')?.trim() || null,
                care: formData.get('care')?.trim() || null,
                images: imageUrls,
                artisanId: this.currentArtisan.id,
                status: 'draft',
                featured: false
            };

            // Save draft to database
            const result = await this.db.createProduct(draftData);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to save draft');
            }

            this.showNotification('Draft saved successfully! 💾', 'success');
            
        } catch (error) {
            console.error('Save draft error:', error);
            this.showNotification(error.message || 'Failed to save draft', 'error');
        }
    }

    validateForm(formData) {
        const title = formData.get('title')?.trim();
        const description = formData.get('description')?.trim();
        const price = formData.get('price');
        const quantity = formData.get('quantity');
        const category = formData.get('category');

        // Clear previous errors
        this.clearFormErrors();

        // Required field validation
        if (!title) {
            this.showFormError('Product title is required');
            return false;
        }

        if (!description) {
            this.showFormError('Product description is required');
            return false;
        }

        if (!price || parseFloat(price) <= 0) {
            this.showFormError('Please enter a valid price');
            return false;
        }

        if (!quantity || parseInt(quantity) <= 0) {
            this.showFormError('Please enter a valid quantity');
            return false;
        }

        if (!category) {
            this.showFormError('Please select a category');
            return false;
        }

        // Image validation
        if (this.selectedImages.length === 0) {
            this.showFormError('Please add at least one product image');
            return false;
        }

        return true;
    }

    setupFormValidation() {
        // Price validation
        const priceInput = document.getElementById('product-price');
        if (priceInput) {
            priceInput.addEventListener('input', () => {
                const value = parseFloat(priceInput.value);
                if (value < 0) {
                    priceInput.value = 0;
                }
            });
        }

        // Quantity validation
        const quantityInput = document.getElementById('product-quantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => {
                const value = parseInt(quantityInput.value);
                if (value < 1) {
                    quantityInput.value = 1;
                }
            });
        }
    }

    showFormError(message) {
        const errorElement = document.querySelector('.form-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    clearFormErrors() {
        const errorElement = document.querySelector('.form-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Use the global notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Create inline notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 400px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }
    }

    // Public methods
    getCurrentArtisan() {
        return this.currentArtisan;
    }

    getSelectedImages() {
        return this.selectedImages;
    }
}

// Initialize product upload system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productUpload = new ProductUploadSystem();
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductUploadSystem;
}