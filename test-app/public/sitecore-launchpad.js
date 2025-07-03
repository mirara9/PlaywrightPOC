/**
 * Sitecore Launchpad JavaScript functionality
 * Provides interactive features for the Sitecore-style test application
 */

class SitecoreLaunchpad {
    constructor() {
        this.currentUser = {
            name: 'Sitecore User',
            role: 'Content Author',
            avatar: 'SC'
        };
        
        this.stats = {
            contentItems: 1247,
            templates: 89,
            pages: 356,
            variants: 42,
            mediaItems: 2134,
            mediaSize: '12.4 GB',
            campaigns: 23,
            contacts: 8541,
            pageViews: '45.2K',
            visitors: '12.8K',
            users: 47,
            roles: 12
        };
        
        this.recentActivities = [
            {
                icon: '📝',
                text: 'Content item "Homepage Banner" was updated',
                time: '2 minutes ago'
            },
            {
                icon: '🖼️',
                text: 'New image "hero-banner.jpg" uploaded to Media Library',
                time: '15 minutes ago'
            },
            {
                icon: '🚀',
                text: 'Content published to web database',
                time: '1 hour ago'
            },
            {
                icon: '👥',
                text: 'New user "john.editor@company.com" was created',
                time: '3 hours ago'
            },
            {
                icon: '📊',
                text: 'Marketing campaign "Summer Sale" was activated',
                time: '1 day ago'
            }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDynamicContent();
        this.startPeriodicUpdates();
        this.animateCards();
    }
    
    setupEventListeners() {
        // Global search functionality
        const searchInput = document.querySelector('[data-testid="global-search"]');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleGlobalSearch.bind(this));
            searchInput.addEventListener('keypress', this.handleSearchKeypress.bind(this));
        }
        
        // User profile dropdown
        const userProfile = document.querySelector('[data-testid="user-profile"]');
        if (userProfile) {
            userProfile.addEventListener('click', this.toggleUserMenu.bind(this));
        }
        
        // Logout functionality
        const logoutBtn = document.querySelector('[data-testid="logout-btn"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
        
        // Launchpad card interactions
        this.setupCardEventListeners();
        
        // Quick actions
        this.setupQuickActionListeners();
        
        // Breadcrumb navigation
        const breadcrumbHome = document.querySelector('[data-testid="breadcrumb-home"]');
        if (breadcrumbHome) {
            breadcrumbHome.addEventListener('click', this.handleBreadcrumbNavigation.bind(this));
        }
    }
    
    setupCardEventListeners() {
        const cards = document.querySelectorAll('.launchpad-card');
        
        cards.forEach(card => {
            // Add hover effects
            card.addEventListener('mouseenter', this.handleCardHover.bind(this));
            card.addEventListener('mouseleave', this.handleCardLeave.bind(this));
            
            // Card click navigation
            card.addEventListener('click', this.handleCardClick.bind(this));
            
            // Button events within cards
            const openBtn = card.querySelector('[data-testid^="open-"]');
            const helpBtn = card.querySelector('[data-testid$="-help"]');
            
            if (openBtn) {
                openBtn.addEventListener('click', this.handleOpenApplication.bind(this));
            }
            
            if (helpBtn) {
                helpBtn.addEventListener('click', this.handleShowHelp.bind(this));
            }
        });
    }
    
    setupQuickActionListeners() {
        const quickActions = document.querySelectorAll('.quick-action');
        
        quickActions.forEach(action => {
            action.addEventListener('click', this.handleQuickAction.bind(this));
        });
    }
    
    handleGlobalSearch(event) {
        const query = event.target.value.toLowerCase();
        
        if (query.length > 2) {
            this.performSearch(query);
        } else {
            this.clearSearchResults();
        }
    }
    
    handleSearchKeypress(event) {
        if (event.key === 'Enter') {
            const query = event.target.value;
            if (query.trim()) {
                this.performFullSearch(query);
            }
        }
    }
    
    performSearch(query) {
        // Simulate search results
        const searchResults = [
            'Content Editor',
            'Experience Editor', 
            'Media Library',
            'Marketing Automation',
            'Experience Analytics',
            'User Manager'
        ].filter(item => item.toLowerCase().includes(query));
        
        this.showSearchSuggestions(searchResults);
    }
    
    showSearchSuggestions(results) {
        // Remove existing suggestions
        this.clearSearchResults();
        
        if (results.length === 0) return;
        
        const searchContainer = document.querySelector('.search-container');
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'search-suggestions';
        suggestionsDiv.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 4px 4px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            z-index: 1001;
            max-height: 200px;
            overflow-y: auto;
        `;
        
        results.forEach(result => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'search-suggestion-item';
            suggestionItem.textContent = result;
            suggestionItem.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s ease;
            `;
            
            suggestionItem.addEventListener('mouseenter', () => {
                suggestionItem.style.backgroundColor = '#fef7f3';
                suggestionItem.style.color = '#eb6100';
            });
            
            suggestionItem.addEventListener('mouseleave', () => {
                suggestionItem.style.backgroundColor = 'white';
                suggestionItem.style.color = '#333';
            });
            
            suggestionItem.addEventListener('click', () => {
                this.selectSearchResult(result);
            });
            
            suggestionsDiv.appendChild(suggestionItem);
        });
        
        searchContainer.appendChild(suggestionsDiv);
    }
    
    clearSearchResults() {
        const suggestions = document.querySelector('.search-suggestions');
        if (suggestions) {
            suggestions.remove();
        }
    }
    
    selectSearchResult(result) {
        const searchInput = document.querySelector('[data-testid="global-search"]');
        searchInput.value = result;
        this.clearSearchResults();
        this.performFullSearch(result);
    }
    
    performFullSearch(query) {
        this.showNotification(`Searching for: ${query}`, 'info');
        // In a real application, this would navigate to search results
    }
    
    toggleUserMenu() {
        // Create or toggle user menu dropdown
        const existingMenu = document.querySelector('.user-menu-dropdown');
        
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const userProfile = document.querySelector('[data-testid="user-profile"]');
        const menuDiv = document.createElement('div');
        menuDiv.className = 'user-menu-dropdown';
        menuDiv.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1002;
            min-width: 200px;
            margin-top: 8px;
        `;
        
        const menuItems = [
            { text: 'Profile Settings', icon: '👤' },
            { text: 'Account Preferences', icon: '⚙️' },
            { text: 'Help & Support', icon: '❓' },
            { text: 'About Sitecore', icon: 'ℹ️' }
        ];
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'user-menu-item';
            menuItem.innerHTML = `<span>${item.icon}</span> ${item.text}`;
            menuItem.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.backgroundColor = '#fef7f3';
            });
            
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.backgroundColor = 'white';
            });
            
            menuItem.addEventListener('click', () => {
                this.handleUserMenuAction(item.text);
                menuDiv.remove();
            });
            
            menuDiv.appendChild(menuItem);
        });
        
        userProfile.style.position = 'relative';
        userProfile.appendChild(menuDiv);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!userProfile.contains(e.target)) {
                    menuDiv.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
    
    handleUserMenuAction(action) {
        this.showNotification(`${action} clicked`, 'info');
    }
    
    handleLogout() {
        this.showNotification('Signing out...', 'info');
        
        setTimeout(() => {
            // In a real application, this would redirect to login
            window.location.href = '/';
        }, 1500);
    }
    
    handleCardHover(event) {
        const card = event.currentTarget;
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
    }
    
    handleCardLeave(event) {
        const card = event.currentTarget;
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    }
    
    handleCardClick(event) {
        // Prevent double-firing if a button was clicked
        if (event.target.tagName === 'BUTTON') return;
        
        const card = event.currentTarget;
        const cardType = this.getCardType(card);
        
        this.animateCardClick(card);
        this.openApplication(cardType);
    }
    
    getCardType(card) {
        if (card.classList.contains('card-content-editor')) return 'content-editor';
        if (card.classList.contains('card-experience-editor')) return 'experience-editor';
        if (card.classList.contains('card-media-library')) return 'media-library';
        if (card.classList.contains('card-marketing')) return 'marketing-automation';
        if (card.classList.contains('card-analytics')) return 'analytics';
        if (card.classList.contains('card-users')) return 'user-manager';
        return 'unknown';
    }
    
    animateCardClick(card) {
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = 'translateY(-2px)';
        }, 150);
    }
    
    handleOpenApplication(event) {
        event.stopPropagation();
        const button = event.target;
        const card = button.closest('.launchpad-card');
        const cardType = this.getCardType(card);
        
        this.openApplication(cardType);
    }
    
    openApplication(appType) {
        const appNames = {
            'content-editor': 'Content Editor',
            'experience-editor': 'Experience Editor',
            'media-library': 'Media Library',
            'marketing-automation': 'Marketing Automation',
            'analytics': 'Experience Analytics',
            'user-manager': 'User Manager'
        };
        
        const appName = appNames[appType] || 'Application';
        this.showNotification(`Opening ${appName}...`, 'success');
        
        // Simulate application loading
        setTimeout(() => {
            // In a real Sitecore environment, this would navigate to the actual application
            this.showNotification(`${appName} loaded successfully`, 'success');
        }, 2000);
    }
    
    handleShowHelp(event) {
        event.stopPropagation();
        const button = event.target;
        const card = button.closest('.launchpad-card');
        const cardType = this.getCardType(card);
        
        this.showHelp(cardType);
    }
    
    showHelp(appType) {
        const helpContent = {
            'content-editor': 'The Content Editor provides a tree-based interface for managing content items, templates, and site structure.',
            'experience-editor': 'The Experience Editor allows you to edit content directly on your website with inline editing capabilities.',
            'media-library': 'The Media Library is where you manage all digital assets including images, videos, and documents.',
            'marketing-automation': 'Marketing Automation helps you create automated campaigns and track customer journeys.',
            'analytics': 'Experience Analytics provides insights into website performance and visitor behavior.',
            'user-manager': 'The User Manager allows you to create and manage user accounts, roles, and permissions.'
        };
        
        const content = helpContent[appType] || 'Help information is not available for this application.';
        this.showModal('Help', content);
    }
    
    handleQuickAction(event) {
        event.preventDefault();
        const action = event.currentTarget;
        const actionText = action.querySelector('.quick-action-text').textContent;
        
        this.performQuickAction(actionText);
    }
    
    performQuickAction(actionText) {
        const actions = {
            'Create Content Item': () => this.createContentItem(),
            'Upload Media': () => this.uploadMedia(),
            'Publish Content': () => this.publishContent(),
            'Preview Site': () => this.previewSite(),
            'View Reports': () => this.viewReports(),
            'System Settings': () => this.openSettings()
        };
        
        const actionFunction = actions[actionText];
        if (actionFunction) {
            actionFunction();
        } else {
            this.showNotification(`${actionText} clicked`, 'info');
        }
    }
    
    createContentItem() {
        this.showNotification('Opening content creation wizard...', 'info');
        // Simulate navigation to content creation
    }
    
    uploadMedia() {
        this.showNotification('Opening media upload dialog...', 'info');
        // Simulate file upload dialog
    }
    
    publishContent() {
        this.showNotification('Starting content publishing...', 'info');
        setTimeout(() => {
            this.showNotification('Content published successfully', 'success');
            this.updateStats();
        }, 2000);
    }
    
    previewSite() {
        this.showNotification('Opening site preview...', 'info');
        // In a real application, this would open the site in a new tab
    }
    
    viewReports() {
        this.showNotification('Loading analytics reports...', 'info');
        // Simulate navigation to reports
    }
    
    openSettings() {
        this.showNotification('Opening system settings...', 'info');
        // Simulate navigation to settings
    }
    
    handleBreadcrumbNavigation(event) {
        event.preventDefault();
        this.showNotification('Navigating to Sitecore home...', 'info');
    }
    
    updateDynamicContent() {
        // Update statistics with slight variations
        this.updateStats();
        
        // Update recent activities
        this.updateRecentActivities();
    }
    
    updateStats() {
        const statElements = {
            'content-items-count': () => this.stats.contentItems + Math.floor(Math.random() * 10),
            'templates-count': () => this.stats.templates,
            'pages-count': () => this.stats.pages + Math.floor(Math.random() * 5),
            'variants-count': () => this.stats.variants + Math.floor(Math.random() * 3),
            'media-items-count': () => this.stats.mediaItems + Math.floor(Math.random() * 20),
            'media-size': () => this.stats.mediaSize,
            'campaigns-count': () => this.stats.campaigns,
            'contacts-count': () => this.stats.contacts + Math.floor(Math.random() * 100),
            'page-views-count': () => this.formatNumber(45200 + Math.floor(Math.random() * 1000)),
            'visitors-count': () => this.formatNumber(12800 + Math.floor(Math.random() * 200)),
            'users-count': () => this.stats.users,
            'roles-count': () => this.stats.roles
        };
        
        Object.entries(statElements).forEach(([testId, valueFunction]) => {
            const element = document.querySelector(`[data-testid="${testId}"]`);
            if (element) {
                element.textContent = valueFunction();
            }
        });
    }
    
    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    updateRecentActivities() {
        const activityList = document.querySelector('[data-testid="activity-list"]');
        if (!activityList) return;
        
        // Add a new random activity occasionally
        if (Math.random() < 0.1) {
            this.addNewActivity();
        }
        
        // Update timestamps
        const timeElements = activityList.querySelectorAll('.activity-time');
        timeElements.forEach((element, index) => {
            if (this.recentActivities[index]) {
                element.textContent = this.recentActivities[index].time;
            }
        });
    }
    
    addNewActivity() {
        const newActivities = [
            { icon: '📝', text: 'Content item "Product Page" was created', time: 'Just now' },
            { icon: '🖼️', text: 'Image "product-hero.jpg" was uploaded', time: 'Just now' },
            { icon: '👥', text: 'User role "Content Reviewer" was updated', time: 'Just now' },
            { icon: '📊', text: 'Analytics report was generated', time: 'Just now' }
        ];
        
        const randomActivity = newActivities[Math.floor(Math.random() * newActivities.length)];
        this.recentActivities.unshift(randomActivity);
        this.recentActivities = this.recentActivities.slice(0, 5); // Keep only 5 activities
        
        this.renderRecentActivities();
    }
    
    renderRecentActivities() {
        const activityList = document.querySelector('[data-testid="activity-list"]');
        if (!activityList) return;
        
        activityList.innerHTML = '';
        
        this.recentActivities.forEach(activity => {
            const activityItem = document.createElement('li');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            `;
            activityList.appendChild(activityItem);
        });
    }
    
    startPeriodicUpdates() {
        // Update stats every 30 seconds
        setInterval(() => {
            this.updateStats();
        }, 30000);
        
        // Update activities every 2 minutes
        setInterval(() => {
            this.updateRecentActivities();
        }, 120000);
    }
    
    animateCards() {
        const cards = document.querySelectorAll('.launchpad-card');
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 100);
        });
    }
    
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.sitecore-notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `sitecore-notification notification-${type}`;
        
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 16px 24px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 2000;
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    showModal(title, content) {
        // Remove existing modals
        const existingModals = document.querySelectorAll('.sitecore-modal');
        existingModals.forEach(modal => modal.remove());
        
        const modal = document.createElement('div');
        modal.className = 'sitecore-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            animation: scaleIn 0.3s ease;
        `;
        
        modalContent.innerHTML = `
            <div style="padding: 24px; border-bottom: 1px solid #e5e5e5;">
                <h2 style="margin: 0; color: #333; font-size: 20px; font-weight: 600;">${title}</h2>
            </div>
            <div style="padding: 24px;">
                <p style="margin: 0; color: #666; line-height: 1.6;">${content}</p>
            </div>
            <div style="padding: 16px 24px; border-top: 1px solid #e5e5e5; text-align: right;">
                <button style="background: #eb6100; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 500;">Close</button>
            </div>
        `;
        
        const closeBtn = modalContent.querySelector('button');
        closeBtn.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => modal.remove(), 300);
            }
        });
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes scaleIn {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the Sitecore Launchpad when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sitecoreLaunchpad = new SitecoreLaunchpad();
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SitecoreLaunchpad;
}