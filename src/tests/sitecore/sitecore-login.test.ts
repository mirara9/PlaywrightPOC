import { test, expect } from '@playwright/test';
import { SitecoreLoginPage, SitecoreContentEditor } from '../../wrappers/ui';
import { SitecoreAuthHelpers } from '../../utils/sitecore-auth';

/**
 * Sitecore Login Tests
 * Tests authentication functionality for Sitecore Content Management
 */
test.describe('Sitecore Login', () => {
  const baseUrl = process.env.SITECORE_CM_URL || 'https://xp0cm.localhost';
  
  test('should display login form correctly', async ({ page }) => {
    const loginPage = new SitecoreLoginPage(page, { baseURL: baseUrl });
    
    await loginPage.navigate();
    
    // Verify login form elements
    const elementsVisible = await loginPage.verifyLoginPageElements();
    expect(elementsVisible).toBe(true);
    
    // Check for required fields
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should login with admin credentials', async ({ page }) => {
    const loginPage = new SitecoreLoginPage(page, { baseURL: baseUrl });
    const adminPassword = process.env.SITECORE_ADMIN_PASSWORD || 'b';
    
    await loginPage.navigate();
    await loginPage.loginAsAdmin(adminPassword);
    
    // Verify successful login
    const loginSuccess = await loginPage.validateLoginSuccess();
    expect(loginSuccess).toBe(true);
    
    // Should not be on login page anymore
    const onLoginPage = await loginPage.isLoginFormVisible();
    expect(onLoginPage).toBe(false);
    
    // Should have Sitecore interface elements
    const sitecoreElementsPresent = await loginPage.verifySitecoreElements();
    expect(sitecoreElementsPresent).toBe(true);
  });

  test('should handle invalid credentials', async ({ page }) => {
    const loginPage = new SitecoreLoginPage(page, { baseURL: baseUrl });
    
    await loginPage.navigate();
    
    // Try login with invalid credentials
    await expect(async () => {
      await loginPage.login('invaliduser', 'invalidpass', 'sitecore');
    }).rejects.toThrow();
    
    // Should still be on login page
    const onLoginPage = await loginPage.isLoginFormVisible();
    expect(onLoginPage).toBe(true);
    
    // Should show error message
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test('should login with retry mechanism', async ({ page }) => {
    const loginPage = new SitecoreLoginPage(page, { baseURL: baseUrl });
    const adminPassword = process.env.SITECORE_ADMIN_PASSWORD || 'b';
    
    await loginPage.loginWithRetry('admin', adminPassword, 'sitecore', 2);
    
    // Verify successful login
    const loginSuccess = await loginPage.validateLoginSuccess();
    expect(loginSuccess).toBe(true);
  });

  test('should logout successfully', async ({ page }) => {
    const loginPage = new SitecoreLoginPage(page, { baseURL: baseUrl });
    const adminPassword = process.env.SITECORE_ADMIN_PASSWORD || 'b';
    
    // Login first
    await loginPage.navigate();
    await loginPage.loginAsAdmin(adminPassword);
    
    // Verify login
    expect(await loginPage.validateLoginSuccess()).toBe(true);
    
    // Logout
    await loginPage.logout();
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/.*login.*/);
    
    // Login form should be visible again
    const onLoginPage = await loginPage.isLoginFormVisible();
    expect(onLoginPage).toBe(true);
  });

  test('should navigate to Content Editor after login', async ({ page }) => {
    const loginPage = new SitecoreLoginPage(page, { baseURL: baseUrl });
    const contentEditor = new SitecoreContentEditor(page, { baseURL: baseUrl });
    const adminPassword = process.env.SITECORE_ADMIN_PASSWORD || 'b';
    
    // Login
    await loginPage.navigate();
    await loginPage.loginAsAdmin(adminPassword);
    
    // Navigate to Content Editor
    await contentEditor.navigate();
    
    // Verify Content Editor loaded
    const contentEditorLoaded = await contentEditor.verifyContentEditor();
    expect(contentEditorLoaded).toBe(true);
  });

  test('should handle session timeout', async ({ page }) => {
    const loginPage = new SitecoreLoginPage(page, { baseURL: baseUrl });
    const adminPassword = process.env.SITECORE_ADMIN_PASSWORD || 'b';
    
    // Login
    await loginPage.navigate();
    await loginPage.loginAsAdmin(adminPassword);
    
    // Verify login
    expect(await loginPage.validateLoginSuccess()).toBe(true);
    
    // Simulate session expiration by clearing cookies
    await page.context().clearCookies();
    
    // Try to access a protected page
    await page.goto(baseUrl + '/sitecore/shell/Applications/Content%20Manager/default.aspx');
    
    // Should be redirected to login
    await page.waitForURL(/.*login.*/);
    
    const onLoginPage = await loginPage.isLoginFormVisible();
    expect(onLoginPage).toBe(true);
  });

  test('should support different domains', async ({ page }) => {
    const loginPage = new SitecoreLoginPage(page, { baseURL: baseUrl });
    
    await loginPage.navigate();
    
    // Check available domains
    const domains = await loginPage.getAvailableDomains();
    expect(domains.length).toBeGreaterThan(0);
    expect(domains).toContain('sitecore');
  });

  test('should handle login with authentication manager', async ({ page }) => {
    const credentials = SitecoreAuthHelpers.getAdminCredentials(
      process.env.SITECORE_ADMIN_PASSWORD || 'b'
    );
    
    const config = SitecoreAuthHelpers.createConfig(baseUrl, credentials);
    const authManager = await SitecoreAuthHelpers.setupForTest(page, config);
    
    // Verify authentication
    const authStatus = authManager.getAuthStatus();
    expect(authStatus.isAuthenticated).toBe(true);
    expect(authStatus.username).toBe('admin');
    expect(authStatus.domain).toBe('sitecore');
    
    // Cleanup
    await authManager.logout();
  });
});