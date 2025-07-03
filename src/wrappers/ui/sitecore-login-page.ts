import { Page, Locator, expect } from '@playwright/test';
import { SitecoreBasePage, SitecorePageConfig } from './sitecore-base-page';

/**
 * Sitecore Login Page Object
 * Handles authentication for Sitecore Content Management
 */
export class SitecoreLoginPage extends SitecoreBasePage {
  // Login form elements
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly domainSelect: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  
  // Error and message elements
  readonly errorMessage: Locator;
  readonly loginForm: Locator;
  readonly forgotPasswordLink: Locator;
  
  // Loading and navigation elements
  readonly loginProgress: Locator;

  constructor(page: Page, config?: SitecorePageConfig) {
    super(page, '/sitecore/login', config);
    
    // Initialize form elements with multiple selector strategies
    this.usernameInput = page.locator('#UserName, [name="UserName"], [data-sc-id="UserName"], input[type="text"]:visible').first();
    this.passwordInput = page.locator('#Password, [name="Password"], [data-sc-id="Password"], input[type="password"]:visible').first();
    this.domainSelect = page.locator('#Domain, [name="Domain"], [data-sc-id="Domain"], select:visible').first();
    this.loginButton = page.locator('#LoginButton, [data-sc-id="LoginButton"], input[type="submit"], button[type="submit"]').first();
    this.rememberMeCheckbox = page.locator('#RememberMe, [name="RememberMe"], [data-sc-id="RememberMe"]').first();
    
    // Error and message elements
    this.errorMessage = page.locator('.error, .sc-error, .login-error, [data-sc-id="ErrorMessage"]');
    this.loginForm = page.locator('#LoginForm, .login-form, form').first();
    this.forgotPasswordLink = page.locator('a[href*="forgot"], a:has-text("Forgot")').first();
    
    // Loading indicators
    this.loginProgress = page.locator('.login-progress, .sc-progress, #LoginProgress');
  }

  /**
   * Navigate to login page and wait for form to load
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.baseURL + this.path);
    await this.waitForLoginForm();
  }

  /**
   * Wait for login form to be ready
   */
  async waitForLoginForm(): Promise<void> {
    console.log('⏳ Waiting for Sitecore login form...');
    
    // Wait for the form to be visible
    await this.loginForm.waitFor({ state: 'visible', timeout: 30000 });
    
    // Ensure required fields are present and enabled
    await this.usernameInput.waitFor({ state: 'visible' });
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.loginButton.waitFor({ state: 'visible' });
    
    // Wait for any loading to complete
    await this.page.waitForLoadState('networkidle');
    
    console.log('✅ Login form ready');
  }

  /**
   * Perform login with username and password
   */
  async login(username: string, password: string, domain: string = 'sitecore'): Promise<void> {
    console.log(`🔐 Logging into Sitecore as: ${domain}\\${username}`);
    
    await this.waitForLoginForm();
    
    // Clear and fill username
    await this.usernameInput.clear();
    await this.usernameInput.fill(username);
    
    // Clear and fill password
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
    
    // Select domain if dropdown is available
    if (await this.domainSelect.isVisible({ timeout: 2000 })) {
      await this.domainSelect.selectOption(domain);
    }
    
    // Click login button
    await this.loginButton.click();
    
    // Wait for login to complete
    await this.waitForLoginCompletion();
  }

  /**
   * Wait for login process to complete
   */
  async waitForLoginCompletion(): Promise<void> {
    console.log('⏳ Waiting for login to complete...');
    
    try {
      // Wait for either successful navigation or error message
      await Promise.race([
        // Success: redirected to Sitecore desktop/launchpad
        this.page.waitForURL('**/desktop**', { timeout: 30000 }),
        this.page.waitForURL('**/launchpad**', { timeout: 30000 }),
        this.page.waitForURL('**/shell/**', { timeout: 30000 }),
        // Error: error message appears
        this.errorMessage.waitFor({ state: 'visible', timeout: 30000 })
      ]);
      
      // Check if we have an error message
      if (await this.errorMessage.isVisible({ timeout: 2000 })) {
        const errorText = await this.errorMessage.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }
      
      // Additional wait for Sitecore to fully initialize
      await this.waitForSitecoreLoad();
      
      console.log('✅ Login successful');
      
    } catch (error) {
      // Check for specific login errors
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        const errorText = await this.getErrorMessage();
        throw new Error(`Login failed: ${errorText || 'Unknown login error'}`);
      }
      throw error;
    }
  }

  /**
   * Get current error message if any
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      if (await this.errorMessage.isVisible({ timeout: 2000 })) {
        return await this.errorMessage.textContent();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if login form is displayed (user not logged in)
   */
  async isLoginFormVisible(): Promise<boolean> {
    try {
      return await this.loginForm.isVisible({ timeout: 5000 });
    } catch (error) {
      return false;
    }
  }

  /**
   * Login with admin credentials (default Sitecore admin)
   */
  async loginAsAdmin(password: string = 'b'): Promise<void> {
    await this.login('admin', password, 'sitecore');
  }

  /**
   * Login with custom domain user
   */
  async loginWithDomain(username: string, password: string, domain: string): Promise<void> {
    await this.login(username, password, domain);
  }

  /**
   * Enable "Remember Me" option
   */
  async enableRememberMe(): Promise<void> {
    if (await this.rememberMeCheckbox.isVisible({ timeout: 2000 })) {
      await this.rememberMeCheckbox.check();
    }
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    if (await this.forgotPasswordLink.isVisible({ timeout: 2000 })) {
      await this.forgotPasswordLink.click();
      await this.page.waitForLoadState('networkidle');
    } else {
      throw new Error('Forgot password link not found');
    }
  }

  /**
   * Verify login page elements
   */
  async verifyLoginPageElements(): Promise<boolean> {
    try {
      await expect(this.loginForm).toBeVisible();
      await expect(this.usernameInput).toBeVisible();
      await expect(this.passwordInput).toBeVisible();
      await expect(this.loginButton).toBeVisible();
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available domains from dropdown
   */
  async getAvailableDomains(): Promise<string[]> {
    if (await this.domainSelect.isVisible({ timeout: 2000 })) {
      const options = await this.domainSelect.locator('option').allTextContents();
      return options.filter(option => option.trim() !== '');
    }
    return [];
  }

  /**
   * Quick login method for testing (with error handling)
   */
  async quickLogin(credentials: { username: string; password: string; domain?: string }): Promise<void> {
    const { username, password, domain = 'sitecore' } = credentials;
    
    try {
      await this.navigate();
      await this.login(username, password, domain);
    } catch (error) {
      // Take screenshot on login failure for debugging
      await this.takeScreenshot(`login-failure-${username}`);
      throw error;
    }
  }

  /**
   * Logout if currently logged in, then login with new credentials
   */
  async relogin(username: string, password: string, domain: string = 'sitecore'): Promise<void> {
    console.log('🔄 Performing relogin...');
    
    // Check if already logged in
    if (!(await this.isLoginFormVisible())) {
      await this.logout();
    }
    
    await this.login(username, password, domain);
  }

  /**
   * Validate successful login by checking for Sitecore elements
   */
  async validateLoginSuccess(): Promise<boolean> {
    try {
      // Should not be on login page anymore
      const onLoginPage = await this.isLoginFormVisible();
      if (onLoginPage) {
        return false;
      }
      
      // Should have Sitecore interface elements
      return await this.verifySitecoreElements();
      
    } catch (error) {
      return false;
    }
  }

}