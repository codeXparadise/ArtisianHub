// Authentication Service with Complete Supabase Integration
class AuthService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.initPromise = this.init();
    }

    async init() {
        try {
            // Wait for Supabase config
            if (window.supabaseConfig) {
                await window.supabaseConfig.initPromise;
                this.supabase = window.supabaseConfig.getClient();
            }

            // Check existing auth state
            await this.checkAuthState();
            
            // Setup auth state listener
            this.setupAuthListener();
            
            this.isInitialized = true;
            console.log('🔐 Auth Service initialized');
        } catch (error) {
            console.error('Auth Service initialization failed:', error);
        }
    }

    async checkAuthState() {
        try {
            if (this.supabase) {
                const { data: { session } } = await this.supabase.auth.getSession();
                
                if (session?.user) {
                    // Get user data from database
                    const { data: userData } = await this.supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    
                    if (userData) {
                        this.currentUser = userData;
                        this.updateAuthUI();
                    }
                }
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    }

    setupAuthListener() {
        if (this.supabase) {
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    await this.handleSignIn(session.user);
                } else if (event === 'SIGNED_OUT') {
                    this.handleSignOut();
                }
            });
        }
    }

    async handleSignIn(user) {
        try {
            // Get user data from database
            const { data: userData } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (userData) {
                this.currentUser = userData;
                this.updateAuthUI();
                
                // Dispatch auth event
                window.dispatchEvent(new CustomEvent('authStateChange', {
                    detail: { action: 'login', user: userData }
                }));
            }
        } catch (error) {
            console.error('Error handling sign in:', error);
        }
    }

    handleSignOut() {
        this.currentUser = null;
        this.updateAuthUI();
        
        // Dispatch auth event
        window.dispatchEvent(new CustomEvent('authStateChange', {
            detail: { action: 'logout' }
        }));
    }

    async signUp(email, password, userData) {
        try {
            // Sign up with Supabase Auth
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: userData.fullName,
                        is_artisan: userData.isArtisan || false
                    }
                }
            });

            if (authError) throw authError;

            // Create user record in database
            const { data: newUser, error: userError } = await this.supabase
                .from('users')
                .insert([{
                    id: authData.user.id,
                    email: email,
                    full_name: userData.fullName,
                    phone: userData.phone,
                    is_artisan: userData.isArtisan || false,
                    profile_completed: !userData.isArtisan
                }])
                .select()
                .single();

            if (userError) throw userError;

            // If artisan, create artisan profile
            if (userData.isArtisan) {
                const { error: artisanError } = await this.supabase
                    .from('artisans')
                    .insert([{
                        user_id: authData.user.id,
                        business_name: userData.fullName,
                        craft_specialty: userData.craftSpecialty || 'General'
                    }]);

                if (artisanError) throw artisanError;
            }

            return { success: true, data: newUser };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.updateAuthUI();
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    updateAuthUI() {
        const authActions = document.getElementById('auth-actions');
        
        if (!authActions) return;

        if (this.currentUser) {
            // User is logged in
            authActions.innerHTML = `
                <div class="user-menu">
                    <button class="user-menu-toggle" id="user-menu-toggle">
                        <img src="${this.currentUser.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}" 
                             alt="User" class="avatar-img">
                        <span class="user-name">${this.currentUser.full_name || this.currentUser.email}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown" id="user-dropdown">
                        ${this.currentUser.is_artisan ? 
                            '<a href="pages/dashboard.html" class="dropdown-item"><i class="fas fa-palette"></i> Dashboard</a>' : 
                            '<a href="pages/become-artisan.html" class="dropdown-item"><i class="fas fa-palette"></i> Become Artisan</a>'
                        }
                        <a href="pages/profile.html" class="dropdown-item"><i class="fas fa-user"></i> Profile</a>
                        <a href="pages/orders.html" class="dropdown-item"><i class="fas fa-box"></i> Orders</a>
                        <a href="pages/wishlist.html" class="dropdown-item"><i class="fas fa-heart"></i> Wishlist</a>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item logout-btn">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            `;

            this.setupUserMenuEvents();
        } else {
            // User is not logged in
            authActions.innerHTML = `
                <a href="pages/user-auth.html" class="btn btn--outline btn--sm auth-btn" id="sign-in-btn">
                    <i class="fas fa-sign-in-alt"></i>
                    Sign In
                </a>
            `;
        }
    }

    setupUserMenuEvents() {
        const userMenuToggle = document.getElementById('user-menu-toggle');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutBtn = document.querySelector('.logout-btn');

        if (userMenuToggle && userDropdown) {
            userMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                userDropdown.classList.remove('active');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.signOut());
        }
    }

    // Public API
    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return !!this.currentUser;
    }

    isArtisan() {
        return this.currentUser?.is_artisan || false;
    }
}

// Initialize and export
window.authService = new AuthService();
export default window.authService;