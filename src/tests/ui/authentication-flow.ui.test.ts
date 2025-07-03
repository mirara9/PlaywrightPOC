import { test, expect } from '@playwright/test';

// Test server configuration
const TEST_APP_URL = process.env.TEST_APP_URL || 'http://localhost:3000';

test.describe('Authentication Flow Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        // Clear session storage before each test
        await page.goto(TEST_APP_URL);
        await page.evaluate(() => {
            sessionStorage.clear();
        });
    });

    // Test 1: Basic Login Flow
    test('should redirect to Sitecore Launchpad after successful login', async ({ page }) => {
        await page.goto(TEST_APP_URL);
        
        // Verify we're on login page
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
        await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
        
        // Login with valid credentials
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-submit"]');
        
        // Should redirect to Sitecore Launchpad
        await page.waitForURL('**/sitecore-launchpad');
        await expect(page.locator('[data-testid="launchpad-grid"]')).toBeVisible();
        
        // Verify user information is displayed
        await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="user-role"]')).toBeVisible();
    });

    // Test 2: Direct Access to Launchpad Without Authentication
    test('should redirect to login when accessing Launchpad without authentication', async ({ page }) => {
        // Try to access Sitecore Launchpad directly
        await page.goto(`${TEST_APP_URL}/sitecore-launchpad`);
        
        // Should redirect to login page
        await page.waitForTimeout(1000);
        expect(page.url()).not.toContain('sitecore-launchpad');
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    // Test 3: Session Persistence
    test('should maintain session when refreshing Launchpad', async ({ page }) => {
        // Login first
        await page.goto(TEST_APP_URL);
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-submit"]');
        await page.waitForURL('**/sitecore-launchpad');
        
        // Refresh the page
        await page.reload();
        
        // Should still be on Launchpad
        await expect(page.locator('[data-testid="launchpad-grid"]')).toBeVisible();
        expect(page.url()).toContain('sitecore-launchpad');
    });

    // Test 4: Logout Functionality
    test('should logout and redirect to login page', async ({ page }) => {
        // Login first
        await page.goto(TEST_APP_URL);
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-submit"]');
        await page.waitForURL('**/sitecore-launchpad');
        
        // Click logout
        await page.click('[data-testid="logout-btn"]');
        
        // Should redirect to login page
        await page.waitForTimeout(2000);
        expect(page.url()).not.toContain('sitecore-launchpad');
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    // Test 5: Multiple User Types
    test('should handle different user types correctly', async ({ page }) => {
        const users = [
            { email: 'test@example.com', password: 'password123', expectedRole: 'Content Author' },
            { email: 'admin@example.com', password: 'AdminPass789!', expectedRole: 'Administrator' },
            { email: 'john.doe@example.com', password: 'SecurePass123!', expectedRole: 'Content Author' }
        ];
        
        for (const user of users) {
            // Clear session
            await page.evaluate(() => sessionStorage.clear());
            
            // Go to login page
            await page.goto(TEST_APP_URL);
            
            // Login
            await page.fill('[data-testid="email-input"]', user.email);
            await page.fill('[data-testid="password-input"]', user.password);
            await page.click('[data-testid="login-submit"]');
            
            // Verify redirect to Launchpad
            await page.waitForURL('**/sitecore-launchpad');
            await expect(page.locator('[data-testid="launchpad-grid"]')).toBeVisible();
            
            // Verify user role
            const userRole = await page.locator('[data-testid="user-role"]').textContent();
            expect(userRole).toBe(user.expectedRole);
            
            // Logout
            await page.click('[data-testid="logout-btn"]');
            await page.waitForTimeout(1500);
        }
    });

    // Test 6: Invalid Credentials
    test('should show error for invalid credentials and not redirect', async ({ page }) => {
        await page.goto(TEST_APP_URL);
        
        // Try login with invalid credentials
        await page.fill('[data-testid="email-input"]', 'invalid@example.com');
        await page.fill('[data-testid="password-input"]', 'wrongpassword');
        await page.click('[data-testid="login-submit"]');
        
        // Should show error message
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        
        // Should remain on login page
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
        expect(page.url()).not.toContain('sitecore-launchpad');
    });

    // Test 7: Empty Fields Validation
    test('should show error for empty fields', async ({ page }) => {
        await page.goto(TEST_APP_URL);
        
        // Try to submit empty form
        await page.click('[data-testid="login-submit"]');
        
        // Should show error message
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        
        // Should remain on login page
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    // Test 8: Session Storage Management
    test('should properly manage session storage', async ({ page }) => {
        await page.goto(TEST_APP_URL);
        
        // Verify no session initially
        const initialUser = await page.evaluate(() => sessionStorage.getItem('currentUser'));
        expect(initialUser).toBeNull();
        
        // Login
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-submit"]');
        await page.waitForURL('**/sitecore-launchpad');
        
        // Verify session exists
        const sessionUser = await page.evaluate(() => sessionStorage.getItem('currentUser'));
        expect(sessionUser).toBeTruthy();
        
        const sessionToken = await page.evaluate(() => sessionStorage.getItem('authToken'));
        expect(sessionToken).toBeTruthy();
        
        // Logout
        await page.click('[data-testid="logout-btn"]');
        await page.waitForTimeout(2000);
        
        // Verify session cleared
        const clearedUser = await page.evaluate(() => sessionStorage.getItem('currentUser'));
        expect(clearedUser).toBeNull();
        
        const clearedToken = await page.evaluate(() => sessionStorage.getItem('authToken'));
        expect(clearedToken).toBeNull();
    });

    // Test 9: Authentication Loading States
    test('should show loading states during authentication', async ({ page }) => {
        await page.goto(TEST_APP_URL);
        
        // Fill credentials
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        
        // Click login and immediately check for loading state
        await page.click('[data-testid="login-submit"]');
        
        // Should show success message before redirect
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
        
        // Should eventually redirect
        await page.waitForURL('**/sitecore-launchpad');
    });

    // Test 10: Remember Previous Page (Future Enhancement)
    test('should handle direct URL access after authentication', async ({ page }) => {
        // Login first
        await page.goto(TEST_APP_URL);
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-submit"]');
        await page.waitForURL('**/sitecore-launchpad');
        
        // Navigate to dashboard directly
        await page.goto(`${TEST_APP_URL}/dashboard`);
        
        // Should be able to access dashboard when authenticated
        await expect(page.locator('[data-testid="overview-section"]')).toBeVisible();
    });

    // Test 11: Complete Authentication Workflow
    test('should complete full authentication workflow', async ({ page }) => {
        // 1. Start at login page
        await page.goto(TEST_APP_URL);
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
        
        // 2. Login with valid credentials
        await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
        await page.fill('[data-testid="password-input"]', 'SecurePass123!');
        await page.click('[data-testid="login-submit"]');
        
        // 3. Verify redirect to Launchpad
        await page.waitForURL('**/sitecore-launchpad');
        await expect(page.locator('[data-testid="launchpad-grid"]')).toBeVisible();
        
        // 4. Verify user information
        const userName = await page.locator('[data-testid="user-name"]').textContent();
        expect(userName).toBe('John Doe');
        
        const userRole = await page.locator('[data-testid="user-role"]').textContent();
        expect(userRole).toBe('Content Author');
        
        // 5. Test navigation to other pages
        await page.goto(`${TEST_APP_URL}/dashboard`);
        await expect(page.locator('[data-testid="overview-section"]')).toBeVisible();
        
        // 6. Return to Launchpad
        await page.goto(`${TEST_APP_URL}/sitecore-launchpad`);
        await expect(page.locator('[data-testid="launchpad-grid"]')).toBeVisible();
        
        // 7. Logout
        await page.click('[data-testid="logout-btn"]');
        await page.waitForTimeout(2000);
        
        // 8. Verify back at login
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
        expect(page.url()).not.toContain('sitecore-launchpad');
        
        // Workflow completed successfully
        expect(true).toBe(true);
    });
});