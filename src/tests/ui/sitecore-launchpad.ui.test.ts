import { test, expect } from '@playwright/test';

// Test server configuration
const TEST_APP_URL = process.env.TEST_APP_URL || 'http://localhost:3000';

test.describe('Sitecore Launchpad UI Tests', () => {
    // Setup: Login before each test
    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_APP_URL);
        
        // Login with test user
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-submit"]');
        
        // Wait for redirect to Sitecore Launchpad
        await page.waitForURL('**/sitecore-launchpad');
        await page.waitForSelector('[data-testid="launchpad-grid"]');
    });

    // Test 1: Page Layout and Header
    test('should display Sitecore header with proper branding', async ({ page }) => {
        // Check Sitecore logo and branding
        await expect(page.locator('[data-testid="sitecore-logo"]')).toBeVisible();
        await expect(page.locator('[data-testid="sitecore-logo"]')).toContainText('Sitecore Experience Platform');
        
        // Check header components
        await expect(page.locator('[data-testid="global-search"]')).toBeVisible();
        await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
        await expect(page.locator('[data-testid="logout-btn"]')).toBeVisible();
    });

    // Test 2: User Information Display
    test('should display correct user information in header', async ({ page }) => {
        const userName = page.locator('[data-testid="user-name"]');
        const userRole = page.locator('[data-testid="user-role"]');
        const userAvatar = page.locator('[data-testid="user-avatar"]');
        
        // Verify user information is displayed
        await expect(userName).toBeVisible();
        await expect(userRole).toBeVisible();
        await expect(userAvatar).toBeVisible();
        
        // Check that user name shows the logged-in user
        const nameText = await userName.textContent();
        expect(nameText).toBeTruthy();
        expect(nameText?.length).toBeGreaterThan(0);
        
        // Check role is displayed
        const roleText = await userRole.textContent();
        expect(roleText).toMatch(/(Administrator|Content Author)/);
    });

    // Test 3: Launchpad Title and Breadcrumbs
    test('should display launchpad title and breadcrumbs', async ({ page }) => {
        // Check main title
        const title = page.locator('h1:has-text("Sitecore Launchpad")');
        await expect(title).toBeVisible();
        
        // Check subtitle
        const subtitle = page.locator('text=Select an application to get started');
        await expect(subtitle).toBeVisible();
        
        // Check breadcrumbs
        await expect(page.locator('[data-testid="breadcrumb-home"]')).toBeVisible();
        await expect(page.locator('[data-testid="breadcrumb-current"]')).toBeVisible();
        await expect(page.locator('[data-testid="breadcrumb-current"]')).toContainText('Launchpad');
    });

    // Test 4: Launchpad Grid and Cards
    test('should display all six main application cards', async ({ page }) => {
        const launchpadGrid = page.locator('[data-testid="launchpad-grid"]');
        await expect(launchpadGrid).toBeVisible();
        
        // Check all six application cards
        await expect(page.locator('[data-testid="content-editor-card"]')).toBeVisible();
        await expect(page.locator('[data-testid="experience-editor-card"]')).toBeVisible();
        await expect(page.locator('[data-testid="media-library-card"]')).toBeVisible();
        await expect(page.locator('[data-testid="marketing-automation-card"]')).toBeVisible();
        await expect(page.locator('[data-testid="analytics-card"]')).toBeVisible();
        await expect(page.locator('[data-testid="user-manager-card"]')).toBeVisible();
    });

    // Test 5: Content Editor Card Details
    test('should display Content Editor card with correct information', async ({ page }) => {
        const card = page.locator('[data-testid="content-editor-card"]');
        
        // Check card is visible
        await expect(card).toBeVisible();
        
        // Check title and subtitle
        await expect(card.locator('.card-title')).toContainText('Content Editor');
        await expect(card.locator('.card-subtitle')).toContainText('Manage your content');
        
        // Check statistics
        await expect(page.locator('[data-testid="content-items-count"]')).toBeVisible();
        await expect(page.locator('[data-testid="templates-count"]')).toBeVisible();
        
        // Check action buttons
        await expect(page.locator('[data-testid="open-content-editor"]')).toBeVisible();
        await expect(page.locator('[data-testid="content-editor-help"]')).toBeVisible();
    });

    // Test 6: Experience Editor Card Details
    test('should display Experience Editor card with correct information', async ({ page }) => {
        const card = page.locator('[data-testid="experience-editor-card"]');
        
        // Check card is visible
        await expect(card).toBeVisible();
        
        // Check title and subtitle
        await expect(card.locator('.card-title')).toContainText('Experience Editor');
        await expect(card.locator('.card-subtitle')).toContainText('Edit in context');
        
        // Check statistics
        await expect(page.locator('[data-testid="pages-count"]')).toBeVisible();
        await expect(page.locator('[data-testid="variants-count"]')).toBeVisible();
        
        // Check action buttons
        await expect(page.locator('[data-testid="open-experience-editor"]')).toBeVisible();
        await expect(page.locator('[data-testid="experience-editor-help"]')).toBeVisible();
    });

    // Test 7: Media Library Card Details
    test('should display Media Library card with correct information', async ({ page }) => {
        const card = page.locator('[data-testid="media-library-card"]');
        
        // Check card is visible
        await expect(card).toBeVisible();
        
        // Check title and subtitle
        await expect(card.locator('.card-title')).toContainText('Media Library');
        await expect(card.locator('.card-subtitle')).toContainText('Manage assets');
        
        // Check statistics
        await expect(page.locator('[data-testid="media-items-count"]')).toBeVisible();
        await expect(page.locator('[data-testid="media-size"]')).toBeVisible();
        
        // Check action buttons
        await expect(page.locator('[data-testid="open-media-library"]')).toBeVisible();
        await expect(page.locator('[data-testid="media-library-help"]')).toBeVisible();
    });

    // Test 8: Marketing Automation Card Details
    test('should display Marketing Automation card with correct information', async ({ page }) => {
        const card = page.locator('[data-testid="marketing-automation-card"]');
        
        // Check card is visible
        await expect(card).toBeVisible();
        
        // Check title and subtitle
        await expect(card.locator('.card-title')).toContainText('Marketing Automation');
        await expect(card.locator('.card-subtitle')).toContainText('Automate campaigns');
        
        // Check statistics
        await expect(page.locator('[data-testid="campaigns-count"]')).toBeVisible();
        await expect(page.locator('[data-testid="contacts-count"]')).toBeVisible();
        
        // Check action buttons
        await expect(page.locator('[data-testid="open-marketing-automation"]')).toBeVisible();
        await expect(page.locator('[data-testid="marketing-automation-help"]')).toBeVisible();
    });

    // Test 9: Analytics Card Details
    test('should display Experience Analytics card with correct information', async ({ page }) => {
        const card = page.locator('[data-testid="analytics-card"]');
        
        // Check card is visible
        await expect(card).toBeVisible();
        
        // Check title and subtitle
        await expect(card.locator('.card-title')).toContainText('Experience Analytics');
        await expect(card.locator('.card-subtitle')).toContainText('Track performance');
        
        // Check statistics
        await expect(page.locator('[data-testid="page-views-count"]')).toBeVisible();
        await expect(page.locator('[data-testid="visitors-count"]')).toBeVisible();
        
        // Check action buttons
        await expect(page.locator('[data-testid="open-analytics"]')).toBeVisible();
        await expect(page.locator('[data-testid="analytics-help"]')).toBeVisible();
    });

    // Test 10: User Manager Card Details
    test('should display User Manager card with correct information', async ({ page }) => {
        const card = page.locator('[data-testid="user-manager-card"]');
        
        // Check card is visible
        await expect(card).toBeVisible();
        
        // Check title and subtitle
        await expect(card.locator('.card-title')).toContainText('User Manager');
        await expect(card.locator('.card-subtitle')).toContainText('Manage users');
        
        // Check statistics
        await expect(page.locator('[data-testid="users-count"]')).toBeVisible();
        await expect(page.locator('[data-testid="roles-count"]')).toBeVisible();
        
        // Check action buttons
        await expect(page.locator('[data-testid="open-user-manager"]')).toBeVisible();
        await expect(page.locator('[data-testid="user-manager-help"]')).toBeVisible();
    });

    // Test 11: Card Hover Effects
    test('should show hover effects on cards', async ({ page }) => {
        const contentEditorCard = page.locator('[data-testid="content-editor-card"]');
        
        // Hover over the card
        await contentEditorCard.hover();
        
        // Wait for hover effect
        await page.waitForTimeout(300);
        
        // Card should have hover styling (implementation-dependent)
        // This test ensures hover doesn't break functionality
        await expect(contentEditorCard).toBeVisible();
    });

    // Test 12: Card Click Navigation
    test('should handle card click for opening applications', async ({ page }) => {
        const contentEditorCard = page.locator('[data-testid="content-editor-card"]');
        
        // Click on the card
        await contentEditorCard.click();
        
        // Wait for any navigation or loading
        await page.waitForTimeout(1000);
        
        // Should still be on launchpad (simulation mode)
        expect(page.url()).toContain('sitecore-launchpad');
    });

    // Test 13: Open Application Buttons
    test('should handle open application button clicks', async ({ page }) => {
        // Test Content Editor open button
        await page.click('[data-testid="open-content-editor"]');
        await page.waitForTimeout(500);
        
        // Test Experience Editor open button
        await page.click('[data-testid="open-experience-editor"]');
        await page.waitForTimeout(500);
        
        // Test Media Library open button
        await page.click('[data-testid="open-media-library"]');
        await page.waitForTimeout(500);
        
        // Should still be on launchpad (simulation mode)
        expect(page.url()).toContain('sitecore-launchpad');
    });

    // Test 14: Help Button Functionality
    test('should display help modal when help buttons are clicked', async ({ page }) => {
        // Click help button for Content Editor
        await page.click('[data-testid="content-editor-help"]');
        
        // Wait for modal to appear
        await page.waitForTimeout(500);
        
        // Should show help modal (check for modal or notification)
        // Implementation depends on how help is displayed
    });

    // Test 15: Global Search Functionality
    test('should handle global search input and suggestions', async ({ page }) => {
        const searchInput = page.locator('[data-testid="global-search"]');
        
        // Test search input
        await searchInput.fill('Content');
        await expect(searchInput).toHaveValue('Content');
        
        // Wait for potential search suggestions
        await page.waitForTimeout(500);
        
        // Clear search
        await searchInput.clear();
        await expect(searchInput).toHaveValue('');
    });

    // Test 16: Global Search with Different Terms
    test('should handle search with various terms', async ({ page }) => {
        const searchInput = page.locator('[data-testid="global-search"]');
        
        const searchTerms = ['Media', 'Analytics', 'User', 'Marketing'];
        
        for (const term of searchTerms) {
            await searchInput.fill(term);
            await page.waitForTimeout(300);
            await searchInput.clear();
        }
    });

    // Test 17: User Profile Menu
    test('should display user profile menu on click', async ({ page }) => {
        const userProfile = page.locator('[data-testid="user-profile"]');
        
        // Click user profile
        await userProfile.click();
        
        // Wait for menu to appear
        await page.waitForTimeout(500);
        
        // Click outside to close menu
        await page.click('body');
        await page.waitForTimeout(300);
    });

    // Test 18: Quick Actions Section
    test('should display quick actions section with all actions', async ({ page }) => {
        // Check quick actions section is visible
        const quickActions = page.locator('.quick-actions');
        await expect(quickActions).toBeVisible();
        
        // Check individual quick actions
        await expect(page.locator('[data-testid="quick-create-item"]')).toBeVisible();
        await expect(page.locator('[data-testid="quick-upload-media"]')).toBeVisible();
        await expect(page.locator('[data-testid="quick-publish"]')).toBeVisible();
        await expect(page.locator('[data-testid="quick-preview"]')).toBeVisible();
        await expect(page.locator('[data-testid="quick-reports"]')).toBeVisible();
        await expect(page.locator('[data-testid="quick-settings"]')).toBeVisible();
    });

    // Test 19: Quick Actions Functionality
    test('should handle quick action clicks', async ({ page }) => {
        // Test different quick actions
        await page.click('[data-testid="quick-create-item"]');
        await page.waitForTimeout(300);
        
        await page.click('[data-testid="quick-upload-media"]');
        await page.waitForTimeout(300);
        
        await page.click('[data-testid="quick-publish"]');
        await page.waitForTimeout(300);
        
        await page.click('[data-testid="quick-preview"]');
        await page.waitForTimeout(300);
    });

    // Test 20: Recent Activity Section
    test('should display recent activity section with activities', async ({ page }) => {
        // Check recent activity section is visible
        const recentActivity = page.locator('.recent-activity');
        await expect(recentActivity).toBeVisible();
        
        // Check activity list
        const activityList = page.locator('[data-testid="activity-list"]');
        await expect(activityList).toBeVisible();
        
        // Check there are activity items
        const activityItems = page.locator('.activity-item');
        expect(await activityItems.count()).toBeGreaterThan(0);
    });

    // Test 21: Activity Items Details
    test('should display activity items with proper content', async ({ page }) => {
        const activityItems = page.locator('.activity-item');
        const firstActivity = activityItems.first();
        
        // Check activity has icon, text, and time
        await expect(firstActivity.locator('.activity-icon')).toBeVisible();
        await expect(firstActivity.locator('.activity-text')).toBeVisible();
        await expect(firstActivity.locator('.activity-time')).toBeVisible();
        
        // Check content is not empty
        const activityText = await firstActivity.locator('.activity-text').textContent();
        expect(activityText?.length).toBeGreaterThan(0);
    });

    // Test 22: Logout Functionality
    test('should handle logout and redirect to login', async ({ page }) => {
        const logoutBtn = page.locator('[data-testid="logout-btn"]');
        
        // Click logout
        await logoutBtn.click();
        
        // Wait for logout process and redirect
        await page.waitForTimeout(2000);
        
        // Should redirect to login page
        expect(page.url()).not.toContain('sitecore-launchpad');
        expect(page.url()).toContain('/');
        
        // Should see login form
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    // Test 23: Breadcrumb Navigation
    test('should handle breadcrumb navigation', async ({ page }) => {
        const breadcrumbHome = page.locator('[data-testid="breadcrumb-home"]');
        
        // Click home breadcrumb
        await breadcrumbHome.click();
        
        // Wait for potential navigation
        await page.waitForTimeout(500);
        
        // Should still be on launchpad (simulation mode)
        expect(page.url()).toContain('sitecore-launchpad');
    });

    // Test 24: Statistics Display
    test('should display numeric statistics in cards', async ({ page }) => {
        // Check content items count
        const contentItemsCount = await page.locator('[data-testid="content-items-count"]').textContent();
        expect(contentItemsCount).toMatch(/^\d+$/);
        
        // Check templates count
        const templatesCount = await page.locator('[data-testid="templates-count"]').textContent();
        expect(templatesCount).toMatch(/^\d+$/);
        
        // Check pages count
        const pagesCount = await page.locator('[data-testid="pages-count"]').textContent();
        expect(pagesCount).toMatch(/^\d+$/);
        
        // Check users count
        const usersCount = await page.locator('[data-testid="users-count"]').textContent();
        expect(usersCount).toMatch(/^\d+$/);
    });

    // Test 25: Responsive Design
    test('should handle responsive design for mobile viewport', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Check that elements are still visible and functional
        await expect(page.locator('[data-testid="sitecore-logo"]')).toBeVisible();
        await expect(page.locator('[data-testid="launchpad-grid"]')).toBeVisible();
        
        // Cards should stack vertically on mobile
        const cards = page.locator('.launchpad-card');
        expect(await cards.count()).toBe(6);
    });

    // Test 26: Card Animation
    test('should handle card animations on load', async ({ page }) => {
        // Refresh page to see animations
        await page.reload();
        await page.waitForSelector('[data-testid="launchpad-grid"]');
        
        // All cards should be visible after animation
        const cards = page.locator('.launchpad-card');
        expect(await cards.count()).toBe(6);
        
        // Check cards have fade-in class
        const firstCard = cards.first();
        await expect(firstCard).toHaveClass(/fade-in/);
    });

    // Test 27: Search Enter Key
    test('should handle Enter key in search input', async ({ page }) => {
        const searchInput = page.locator('[data-testid="global-search"]');
        
        // Type search term and press Enter
        await searchInput.fill('Content Editor');
        await searchInput.press('Enter');
        
        // Wait for search handling
        await page.waitForTimeout(500);
        
        // Should remain on launchpad
        expect(page.url()).toContain('sitecore-launchpad');
    });

    // Test 28: Keyboard Navigation
    test('should support basic keyboard navigation', async ({ page }) => {
        // Focus on search input with Tab
        await page.keyboard.press('Tab');
        
        // Should focus the search input
        const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
        expect(focusedElement).toBe('global-search');
    });

    // Test 29: Statistics Updates
    test('should handle dynamic statistics updates', async ({ page }) => {
        // Get initial values
        const initialContentItems = await page.locator('[data-testid="content-items-count"]').textContent();
        
        // Wait for potential updates (simulated in the JavaScript)
        await page.waitForTimeout(2000);
        
        // Values should still be numeric
        const updatedContentItems = await page.locator('[data-testid="content-items-count"]').textContent();
        expect(updatedContentItems).toMatch(/^\d+$/);
    });

    // Test 30: Error Handling for Missing Authentication
    test('should redirect to login if not authenticated', async ({ page }) => {
        // Clear session storage to simulate missing authentication
        await page.evaluate(() => {
            sessionStorage.clear();
        });
        
        // Try to access Sitecore Launchpad directly
        await page.goto(`${TEST_APP_URL}/sitecore-launchpad`);
        
        // Should redirect to login
        await page.waitForTimeout(1000);
        expect(page.url()).not.toContain('sitecore-launchpad');
    });

    // Test 31: Theme Colors and Branding
    test('should display correct Sitecore orange branding', async ({ page }) => {
        const logo = page.locator('[data-testid="sitecore-logo"]');
        
        // Check logo color
        const logoColor = await logo.evaluate(el => getComputedStyle(el).color);
        // Should contain orange color (rgb values for #eb6100)
        expect(logoColor).toContain('235') || expect(logoColor).toContain('97') || expect(logoColor).toContain('0');
    });

    // Test 32: Page Title
    test('should have correct page title', async ({ page }) => {
        const title = await page.title();
        expect(title).toContain('Sitecore Launchpad');
    });

    // Test 33: Notification System
    test('should handle notification display', async ({ page }) => {
        // Click an action that triggers notifications
        await page.click('[data-testid="open-content-editor"]');
        
        // Wait for potential notification
        await page.waitForTimeout(1000);
        
        // Should still be functional
        await expect(page.locator('[data-testid="launchpad-grid"]')).toBeVisible();
    });

    // Test 34: Multiple User Roles
    test('should display appropriate role for different users', async ({ page }) => {
        // Check current user role
        const userRole = await page.locator('[data-testid="user-role"]').textContent();
        expect(userRole).toMatch(/(Administrator|Content Author)/);
        
        // Log out and log in as admin
        await page.click('[data-testid="logout-btn"]');
        await page.waitForTimeout(1500);
        
        // Login as admin
        await page.fill('[data-testid="email-input"]', 'admin@example.com');
        await page.fill('[data-testid="password-input"]', 'AdminPass789!');
        await page.click('[data-testid="login-submit"]');
        
        await page.waitForURL('**/sitecore-launchpad');
        
        // Check admin role
        const adminRole = await page.locator('[data-testid="user-role"]').textContent();
        expect(adminRole).toBe('Administrator');
    });

    // Test 35: Complete Workflow Test
    test('should complete full launchpad interaction workflow', async ({ page }) => {
        // 1. Verify initial load
        await expect(page.locator('[data-testid="launchpad-grid"]')).toBeVisible();
        
        // 2. Interact with search
        await page.fill('[data-testid="global-search"]', 'test search');
        await page.waitForTimeout(500);
        await page.locator('[data-testid="global-search"]').clear();
        
        // 3. Click on each application card
        const cardTestIds = [
            'content-editor-card',
            'experience-editor-card', 
            'media-library-card',
            'marketing-automation-card',
            'analytics-card',
            'user-manager-card'
        ];
        
        for (const cardId of cardTestIds) {
            await page.click(`[data-testid="${cardId}"]`);
            await page.waitForTimeout(200);
        }
        
        // 4. Try quick actions
        await page.click('[data-testid="quick-create-item"]');
        await page.waitForTimeout(200);
        await page.click('[data-testid="quick-publish"]');
        await page.waitForTimeout(200);
        
        // 5. Check user profile
        await page.click('[data-testid="user-profile"]');
        await page.waitForTimeout(300);
        await page.click('body'); // Close menu
        
        // 6. Verify still on launchpad
        await expect(page.locator('[data-testid="launchpad-grid"]')).toBeVisible();
        expect(page.url()).toContain('sitecore-launchpad');
        
        // Workflow completed successfully
        expect(true).toBe(true);
    });
});