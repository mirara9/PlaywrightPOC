import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';
import { TestLoginPage } from '../../wrappers/ui';
import { TestDataManager, TestHelpers, retryTest, RetryHelper, expectWithRetry } from '../../utils';

/**
 * Login UI tests with retry capability
 * This demonstrates how to update existing tests to use retry functionality
 */
test.describe('Login UI Tests with Retry', () => {
  let testData: TestDataManager;

  test.beforeAll(async () => {
    testData = TestDataManager.getInstance();
  });

  // Example 1: Convert regular test to retry test
  retryTest('should display login page elements with retry', async (page: Page, context: BrowserContext, browser: Browser) => {
    const loginPage = new TestLoginPage(page);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Use expectWithRetry for potentially flaky element checks
    await expectWithRetry(
      async () => await loginPage.emailInputLocator.isVisible(),
      (isVisible) => expect(isVisible).toBe(true),
      { timeout: 10000, interval: 500 }
    );
    
    await expectWithRetry(
      async () => await loginPage.passwordInputLocator.isVisible(),
      (isVisible) => expect(isVisible).toBe(true),
      { timeout: 10000, interval: 500 }
    );
    
    await expectWithRetry(
      async () => await loginPage.loginButtonLocator.isVisible(),
      (isVisible) => expect(isVisible).toBe(true),
      { timeout: 10000, interval: 500 }
    );
    
    // Check page title
    await expect(page).toHaveTitle(/Test Login Application/);
  }, {
    attempts: 3,
    retryDelay: 2000,
    resetDataBetweenRetries: false,
    reinitializeBrowser: true
  });

  // Example 2: Retry test with data reset between attempts
  retryTest('should login with valid credentials with retry', async (page: Page, context: BrowserContext, browser: Browser) => {
    const loginPage = new TestLoginPage(page);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Login with valid credentials
    await loginPage.login('john.doe@example.com', 'SecurePass123!');
    
    // Wait for successful login with retry logic
    await expectWithRetry(
      async () => await loginPage.userProfileLocator.isVisible(),
      (isVisible) => expect(isVisible).toBe(true),
      { timeout: 15000, interval: 1000 }
    );
    
    // Verify user name
    const userName = await loginPage.getUserName();
    expect(userName).toBe('John Doe');
  }, {
    attempts: 3,
    retryDelay: 2000,
    resetDataBetweenRetries: true, // Reset data between retries
    reinitializeBrowser: true
  });

  // Example 3: Test with custom retry logic for error scenarios
  test('should show error for invalid credentials with custom retry', async ({ browser }) => {
    await RetryHelper.withRetry(async (page: Page, context: BrowserContext, browser: Browser) => {
      const loginPage = new TestLoginPage(page);
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Attempt login with invalid credentials
      await loginPage.login('invalid@example.com', 'wrongpassword');
      
      // Wait for error message with retry logic
      await expectWithRetry(
        async () => await loginPage.errorMessageLocator.isVisible(),
        (isVisible) => expect(isVisible).toBe(true),
        { timeout: 10000, interval: 500 }
      );
      
      // Verify error message text
      const errorText = await loginPage.errorMessageLocator.textContent();
      expect(errorText).toContain('Invalid credentials');
    }, {
      attempts: 2,
      retryDelay: 1000,
      resetDataBetweenRetries: false,
      reinitializeBrowser: true
    });
  });

  // Example 4: Complex workflow with multiple retry points
  retryTest('should handle complete login workflow with retry', async (page: Page, context: BrowserContext, browser: Browser) => {
    const loginPage = new TestLoginPage(page);
    
    // Step 1: Navigate to login page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Verify initial state
    await expectWithRetry(
      async () => await loginPage.loginButtonLocator.isEnabled(),
      (isEnabled) => expect(isEnabled).toBe(true),
      { timeout: 5000, interval: 500 }
    );
    
    // Step 3: Enter credentials
    await loginPage.emailInputLocator.fill('jane.smith@example.com');
    await loginPage.passwordInputLocator.fill('SecurePass456!');
    
    // Step 4: Submit form
    await loginPage.loginButtonLocator.click();
    
    // Step 5: Wait for success message
    await expectWithRetry(
      async () => await loginPage.successMessageLocator.isVisible(),
      (isVisible) => expect(isVisible).toBe(true),
      { timeout: 10000, interval: 1000 }
    );
    
    // Step 6: Wait for redirect to dashboard
    await expectWithRetry(
      async () => await loginPage.userProfileLocator.isVisible(),
      (isVisible) => expect(isVisible).toBe(true),
      { timeout: 15000, interval: 1000 }
    );
    
    // Step 7: Verify user information
    const userName = await loginPage.getUserName();
    expect(userName).toBe('Jane Smith');
    
    // Step 8: Test logout functionality
    await loginPage.logoutButtonLocator.click();
    
    await expectWithRetry(
      async () => await loginPage.emailInputLocator.isVisible(),
      (isVisible) => expect(isVisible).toBe(true),
      { timeout: 10000, interval: 500 }
    );
  }, {
    attempts: 3,
    retryDelay: 3000,
    resetDataBetweenRetries: true,
    reinitializeBrowser: true
  });

  // Example 5: Test with network conditions simulation
  test('should handle network issues with retry', async ({ browser }) => {
    await RetryHelper.withRetry(async (page: Page, context: BrowserContext, browser: Browser) => {
      const loginPage = new TestLoginPage(page);
      
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });
      
      await page.goto('/', { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      
      await loginPage.login('admin@example.com', 'AdminPass789!');
      
      // Verify login success despite network delays
      await expectWithRetry(
        async () => await loginPage.userProfileLocator.isVisible(),
        (isVisible) => expect(isVisible).toBe(true),
        { timeout: 20000, interval: 1000 }
      );
      
      const userName = await loginPage.getUserName();
      expect(userName).toBe('Admin User');
    }, {
      attempts: 3,
      retryDelay: 2000,
      resetDataBetweenRetries: true,
      reinitializeBrowser: true
    });
  });

  // Example 6: Stress test with retry capability
  retryTest('should handle rapid login attempts with retry', async (page: Page, context: BrowserContext, browser: Browser) => {
    const loginPage = new TestLoginPage(page);
    
    for (let i = 0; i < 3; i++) {
      console.log(`🔄 Login attempt ${i + 1}/3`);
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await loginPage.login('test@example.com', 'password123');
      
      await expectWithRetry(
        async () => await loginPage.userProfileLocator.isVisible(),
        (isVisible) => expect(isVisible).toBe(true),
        { timeout: 10000, interval: 500 }
      );
      
      // Logout
      await loginPage.logoutButtonLocator.click();
      
      await expectWithRetry(
        async () => await loginPage.emailInputLocator.isVisible(),
        (isVisible) => expect(isVisible).toBe(true),
        { timeout: 5000, interval: 500 }
      );
    }
    
    console.log('✅ Rapid login test completed');
  }, {
    attempts: 2,
    retryDelay: 2000,
    resetDataBetweenRetries: true,
    reinitializeBrowser: true
  });
});