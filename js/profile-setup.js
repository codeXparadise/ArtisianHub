// Profile Setup functionality for ArtisanHub
class ProfileSetup {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.profileData = {};
        this.techniques = [];
        this.achievements = [];
        this.portfolioImages = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUserData();
        this.setupImageUploads();
        this.setupTags();
    }

    bindEvents() {
        // Step navigation
        document.getElementById('next-step-1')?.addEventListener('click', () => this.nextStep(1));
        document.getElementById('next-step-2')?.addEventListener('click', () => this.nextStep(2));
        document.getElementById('prev-step-2')?.addEventListener('click', () => this.prevStep(2));
        document.getElementById('prev-step-3')?.addEventListener('click', () => this.prevStep(3));
        document.getElementById('complete-setup')?.addEventListener('click', () => this.completeSetup());

        // Form validation
        this.setupFormValidation();
        
        // Achievement management
        document.getElementById('add-achievement')?.addEventListener('click', () => this.addAchievement());
        
        // Character counting
        const bioTextarea = document.getElementById('bio');
        if (bioTextarea) {
            bioTextarea.addEventListener('input', () => this.updateCharCount());
        }
        
        // Portfolio upload
        const portfolioArea = document.getElementById('portfolio-upload-area');
        const portfolioInput = document.getElementById('portfolio-input');
        
        if (portfolioArea && portfolioInput) {
            portfolioArea.addEventListener('click', () => portfolioInput.click());
            portfolioArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            portfolioArea.addEventListener('drop', (e) => this.handleDrop(e));
            portfolioInput.addEventListener('change', (e) => this.handlePortfolioUpload(e));
        }
        
        // Logout functionality
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (window.authSystem) {
                window.authSystem.logout();
            }
        });
    }

    loadUserData() {
        // Load current user data if available
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser.email) {
            document.getElementById('user-name').textContent = currentUser.fullName || currentUser.email;
            
            // Pre-fill any existing profile data
            if (currentUser.profile) {
                this.populateForm(currentUser.profile);
            }
        }
    }

    populateForm(profileData) {
        // Basic info
        if (profileData.bio) document.getElementById('bio').value = profileData.bio;
        if (profileData.location) document.getElementById('location').value = profileData.location;
        if (profileData.phone) document.getElementById('phone').value = profileData.phone;
        if (profileData.website) document.getElementById('website').value = profileData.website;
        if (profileData.instagram) document.getElementById('instagram').value = profileData.instagram;
        if (profileData.facebook) document.getElementById('facebook').value = profileData.facebook;
        if (profileData.twitter) document.getElementById('twitter').value = profileData.twitter;
        
        // Portfolio
        if (profileData.experience) document.getElementById('experience').value = profileData.experience;
        if (profileData.techniques) {
            this.techniques = profileData.techniques;
            this.renderTechniques();
        }
        
        this.updateCharCount();
    }

    setupImageUploads() {
        // Avatar upload
        const avatarPreview = document.getElementById('avatar-preview');
        const avatarInput = document.getElementById('avatar-input');
        
        if (avatarPreview && avatarInput) {
            avatarPreview.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }
        
        // Cover upload
        const coverUpload = document.getElementById('cover-upload');
        const coverInput = document.getElementById('cover-input');
        
        if (coverUpload && coverInput) {
            coverUpload.addEventListener('click', () => coverInput.click());
            coverInput.addEventListener('change', (e) => this.handleCoverUpload(e));
        }
    }

    setupTags() {
        const input = document.getElementById('techniques-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTechnique(input.value.trim());
                    input.value = '';
                }
            });
        }
    }

    setupFormValidation() {
        // Real-time validation for required fields
        const requiredFields = ['bio', 'location'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => this.clearFieldError(field));
            }
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldGroup = field.closest('.form-group');
        
        // Remove existing error
        this.clearFieldError(field);
        
        if (!value && field.hasAttribute('required')) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // Specific validations
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid email address');
                return false;
            }
        }
        
        if (field.type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                this.showFieldError(field, 'Please enter a valid URL');
                return false;
            }
        }
        
        return true;
    }

    showFieldError(field, message) {
        const fieldGroup = field.closest('.form-group');
        if (fieldGroup) {
            field.classList.add('error');
            
            let errorElement = fieldGroup.querySelector('.field-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                fieldGroup.appendChild(errorElement);
            }
            errorElement.textContent = message;
        }
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const fieldGroup = field.closest('.form-group');
        const errorElement = fieldGroup?.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    updateCharCount() {
        const bioTextarea = document.getElementById('bio');
        const countElement = document.getElementById('bio-count');
        
        if (bioTextarea && countElement) {
            const count = bioTextarea.value.length;
            countElement.textContent = count;
            
            if (count > 500) {
                countElement.parentElement.classList.add('over-limit');
                bioTextarea.classList.add('error');
            } else {
                countElement.parentElement.classList.remove('over-limit');
                bioTextarea.classList.remove('error');
            }
        }
    }

    addTechnique(technique) {
        if (technique && !this.techniques.includes(technique) && this.techniques.length < 10) {
            this.techniques.push(technique);
            this.renderTechniques();
        }
    }

    removeTechnique(technique) {
        this.techniques = this.techniques.filter(t => t !== technique);
        this.renderTechniques();
    }

    renderTechniques() {
        const container = document.getElementById('techniques-list');
        if (!container) return;
        
        container.innerHTML = this.techniques.map(technique => `
            <span class="tag">
                ${technique}
                <button type="button" class="tag-remove" onclick="profileSetup.removeTechnique('${technique}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
    }

    addAchievement() {
        const container = document.getElementById('achievement-list');
        if (!container) return;
        
        const achievementItem = document.createElement('div');
        achievementItem.className = 'achievement-item';
        achievementItem.innerHTML = `
            <input type="text" class="form-input" placeholder="Achievement title" name="achievement-title[]">
            <input type="text" class="form-input" placeholder="Year" name="achievement-year[]">
            <button type="button" class="btn-icon remove-achievement" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(achievementItem);
    }

    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const avatarImage = document.getElementById('avatar-image');
                if (avatarImage) {
                    avatarImage.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    handleCoverUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const coverPreview = document.getElementById('cover-preview');
                if (coverPreview) {
                    coverPreview.innerHTML = `
                        <img src="${e.target.result}" alt="Cover photo" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                        <div class="cover-overlay">
                            <i class="fas fa-camera"></i>
                            <span>Change Cover</span>
                        </div>
                    `;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        const files = Array.from(event.dataTransfer.files);
        this.processPortfolioFiles(files);
    }

    handlePortfolioUpload(event) {
        const files = Array.from(event.target.files);
        this.processPortfolioFiles(files);
    }

    processPortfolioFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        const maxFiles = 10;
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (this.portfolioImages.length + imageFiles.length > maxFiles) {
            this.showNotification('You can upload maximum 10 portfolio images', 'error');
            return;
        }
        
        imageFiles.forEach(file => {
            if (file.size > maxSize) {
                this.showNotification(`File ${file.name} is too large. Maximum size is 5MB`, 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.portfolioImages.push({
                    name: file.name,
                    url: e.target.result,
                    size: file.size
                });
                this.renderPortfolioPreview();
            };
            reader.readAsDataURL(file);
        });
    }

    renderPortfolioPreview() {
        const container = document.getElementById('portfolio-preview');
        if (!container) return;
        
        container.innerHTML = this.portfolioImages.map((image, index) => `
            <div class="portfolio-item">
                <img src="${image.url}" alt="${image.name}">
                <div class="portfolio-overlay">
                    <button type="button" class="btn-icon" onclick="profileSetup.removePortfolioImage(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    removePortfolioImage(index) {
        this.portfolioImages.splice(index, 1);
        this.renderPortfolioPreview();
    }

    nextStep(currentStep) {
        if (this.validateCurrentStep(currentStep)) {
            this.goToStep(currentStep + 1);
        }
    }

    prevStep(currentStep) {
        this.goToStep(currentStep - 1);
    }

    goToStep(step) {
        // Hide current step
        document.getElementById(`step-${this.currentStep}`).style.display = 'none';
        
        // Show new step
        document.getElementById(`step-${step}`).style.display = 'block';
        
        // Update progress bar
        this.updateProgressBar(step);
        
        // Update current step
        this.currentStep = step;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateProgressBar(step) {
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach((stepElement, index) => {
            if (index < step) {
                stepElement.classList.add('active');
            } else {
                stepElement.classList.remove('active');
            }
        });
    }

    validateCurrentStep(step) {
        if (step === 1) {
            return this.validateBasicInfo();
        } else if (step === 2) {
            return this.validatePortfolio();
        }
        return true;
    }

    validateBasicInfo() {
        const bio = document.getElementById('bio').value.trim();
        const location = document.getElementById('location').value.trim();
        
        let isValid = true;
        
        if (!bio) {
            this.showFieldError(document.getElementById('bio'), 'Bio is required');
            isValid = false;
        } else if (bio.length > 500) {
            this.showFieldError(document.getElementById('bio'), 'Bio must be 500 characters or less');
            isValid = false;
        }
        
        if (!location) {
            this.showFieldError(document.getElementById('location'), 'Location is required');
            isValid = false;
        }
        
        return isValid;
    }

    validatePortfolio() {
        // Portfolio validation is optional, always return true
        return true;
    }

    async completeSetup() {
        try {
            // Collect all form data
            const profileData = this.collectFormData();
            
            // Save profile data
            await this.saveProfile(profileData);
            
            // Show completion step
            this.showCompletion();
            
        } catch (error) {
            console.error('Error completing setup:', error);
            this.showNotification('Error saving profile. Please try again.', 'error');
        }
    }

    collectFormData() {
        const formData = {
            // Basic info
            bio: document.getElementById('bio')?.value.trim(),
            location: document.getElementById('location')?.value.trim(),
            phone: document.getElementById('phone')?.value.trim(),
            website: document.getElementById('website')?.value.trim(),
            instagram: document.getElementById('instagram')?.value.trim(),
            facebook: document.getElementById('facebook')?.value.trim(),
            twitter: document.getElementById('twitter')?.value.trim(),
            
            // Portfolio
            experience: document.getElementById('experience')?.value,
            techniques: this.techniques,
            achievements: this.collectAchievements(),
            portfolioImages: this.portfolioImages,
            
            // Shop settings
            publicProfile: document.querySelector('input[name="publicProfile"]')?.checked,
            emailNotifications: document.querySelector('input[name="emailNotifications"]')?.checked,
            marketingEmails: document.querySelector('input[name="marketingEmails"]')?.checked,
            monthlyReport: document.querySelector('input[name="monthlyReport"]')?.checked,
            shippingPolicy: document.getElementById('shipping-policy')?.value.trim(),
            returnPolicy: document.getElementById('return-policy')?.value.trim(),
            customOrders: document.getElementById('custom-orders')?.value.trim(),
            
            // Metadata
            profileCompleted: true,
            completedAt: new Date().toISOString()
        };
        
        return formData;
    }

    collectAchievements() {
        const achievements = [];
        const achievementItems = document.querySelectorAll('.achievement-item');
        
        achievementItems.forEach(item => {
            const title = item.querySelector('input[name="achievement-title[]"]')?.value.trim();
            const year = item.querySelector('input[name="achievement-year[]"]')?.value.trim();
            
            if (title && year) {
                achievements.push({ title, year });
            }
        });
        
        return achievements;
    }

    async saveProfile(profileData) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (!currentUser.email) {
            throw new Error('No user logged in');
        }
        
        // Update user profile
        currentUser.profile = profileData;
        currentUser.isArtist = true;
        currentUser.profileCompleted = true;
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update users database
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        // Create artist profile in artists database
        const artists = JSON.parse(localStorage.getItem('artists') || '[]');
        const existingArtistIndex = artists.findIndex(a => a.email === currentUser.email);
        
        const artistProfile = {
            id: existingArtistIndex !== -1 ? artists[existingArtistIndex].id : Date.now(),
            email: currentUser.email,
            name: currentUser.fullName,
            craft: currentUser.craft,
            ...profileData,
            joinedDate: existingArtistIndex !== -1 ? artists[existingArtistIndex].joinedDate : new Date().toISOString()
        };
        
        if (existingArtistIndex !== -1) {
            artists[existingArtistIndex] = artistProfile;
        } else {
            artists.push(artistProfile);
        }
        
        localStorage.setItem('artists', JSON.stringify(artists));
    }

    showCompletion() {
        // Hide current step
        document.getElementById(`step-${this.currentStep}`).style.display = 'none';
        
        // Show completion
        document.getElementById('completion-step').style.display = 'block';
        
        // Update progress bar to show all complete
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach(step => step.classList.add('active'));
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showNotification(message, type = 'info') {
        // Use the global notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize profile setup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileSetup = new ProfileSetup();
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.email || !currentUser.isArtist) {
        // Redirect to artist registration if not an artist
        window.location.href = 'become-artisan.html';
        return;
    }
    
    // If profile is already completed, redirect to dashboard
    if (currentUser.profileCompleted) {
        if (confirm('Your profile is already complete. Would you like to go to your dashboard?')) {
            window.location.href = 'dashboard.html';
        }
    }
});