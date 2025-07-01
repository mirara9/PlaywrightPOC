import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';
import { retryTest, RetryHelper, expectWithRetry } from '../../utils';
import { TestApiWrapper } from '../../wrappers/api';
import { TestLoginPage } from '../../wrappers/ui';

/**
 * Example tests demonstrating the retry functionality
 * These tests show different ways to use the retry capabilities
 */

test.describe('Retry Functionality Examples', () => {
  let apiWrapper: TestApiWrapper;

  test.beforeEach(async ({ request }) => {
    apiWrapper = new TestApiWrapper(request);
  });

  test.afterEach(async () => {
    // Reset data after each test
    await apiWrapper.resetData();
  });

  // Example 1: Using retryTest function (recommended approach)
  retryTest('should login successfully with retry capability', async (page: Page, context: BrowserContext, browser: Browser) => {
    console.log('🧪 Testing login with automatic retry...');
    
    const loginPage = new TestLoginPage(page);
    
    // Navigate to login page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Perform login
    await loginPage.login('john.doe@example.com', 'SecurePass123!');
    
    // Verify login success
    await expect(loginPage.userProfileLocator).toBeVisible();
    const displayedName = await loginPage.getUserName();
    expect(displayedName).toBe('John Doe');
    
    console.log('✅ Login test passed');
  }, {
    maxRetries: 3,
    retryDelay: 2000,
    resetDataBetweenRetries: true,
    reinitializeBrowser: true
  });

  // Example 2: Using RetryHelper.withRetry for more control
  test('should handle flaky API with custom retry logic', async ({ browser }) => {
    await RetryHelper.withRetry(async (page: Page, context: BrowserContext, browser: Browser) => {
      console.log('🧪 Testing flaky API with custom retry...');
      
      // Navigate to page
      await page.goto('/');
      
      // Simulate a flaky operation that might fail
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/users/1');
        const data = await res.json();
        
        // Simulate random failure (remove this in real tests)
        if (Math.random() < 0.3) {
          throw new Error('Simulated network failure');
        }
        
        return data;
      });
      
      expect(response.success).toBe(true);
      expect(response.user).toBeDefined();
      expect(response.user.name).toBe('John Doe');
      
      console.log('✅ API test passed');
    }, {
      maxRetries: 5,
      retryDelay: 1500,
      resetDataBetweenRetries: false,
      reinitializeBrowser: true
    });
  });

  // Example 3: Using expectWithRetry for flaky assertions
  test('should handle flaky UI elements with expectWithRetry', async ({ page }) => {
    console.log('🧪 Testing flaky UI elements...');
    
    const loginPage = new TestLoginPage(page);
    await page.goto('/');
    
    // Use expectWithRetry for elements that might take time to appear
    await expectWithRetry(
      async () => await loginPage.emailInputLocator.isVisible(),
      (isVisible) => expect(isVisible).toBe(true),
      { timeout: 10000, interval: 500 }
    );
    
    await loginPage.login('jane.smith@example.com', 'SecurePass456!');
    
    // Wait for dashboard with retry logic
    await expectWithRetry(
      async () => await loginPage.getUserName(),
      (name) => expect(name).toBe('Jane Smith'),
      { timeout: 15000, interval: 1000 }
    );
    
    console.log('✅ Flaky UI test passed');
  });

  // Example 4: Demonstrating retry with API operations
  test('should retry failed API operations', async ({ request }) => {
    console.log('🧪 Testing API retry functionality...');
    
    await RetryHelper.withRetry(async (page: Page) => {
      // Test user creation
      const newUser = {
        name: 'Retry Test User',
        email: `retry-${Date.now()}@example.com`,
        password: 'RetryPass123!',
        username: `retryuser${Date.now()}`
      };
      
      const createdUser = await apiWrapper.createUser(newUser);
      expect(createdUser).toBeDefined();
      expect(createdUser.name).toBe(newUser.name);
      
      // Test user retrieval
      const allUsers = await apiWrapper.getUsers();
      expect(allUsers.length).toBeGreaterThan(0);
      const foundUser = allUsers.find(u => u.email === newUser.email);
      expect(foundUser).toBeDefined();
      expect(foundUser?.name).toBe(newUser.name);
      
      console.log('✅ API retry test passed');
    }, {
      maxRetries: 3,
      retryDelay: 1000,
      resetDataBetweenRetries: true,
      reinitializeBrowser: false // API tests don't need browser restart
    });
  });

  // Example 5: Testing browser recovery after crashes
  test('should recover from browser crashes', async ({ browser }) => {
    console.log('🧪 Testing browser crash recovery...');
    
    await RetryHelper.withRetry(async (page: Page, context: BrowserContext, browser: Browser) => {
      const loginPage = new TestLoginPage(page);
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Perform login
      await loginPage.login('admin@example.com', 'AdminPass789!');
      
      // Verify login success
      await expect(loginPage.userProfileLocator).toBeVisible();
      
      // Simulate potential browser instability
      await page.evaluate(() => {
        // Force a potential memory issue (commented out for safety)
        // while(true) { new Array(1000000).fill('memory'); }
      });
      
      const userName = await loginPage.getUserName();
      expect(userName).toBe('Admin User');
      
      console.log('✅ Browser recovery test passed');
    }, {
      maxRetries: 3,
      retryDelay: 2000,
      resetDataBetweenRetries: true,
      reinitializeBrowser: true // Force browser restart between retries
    });
  });

  // Example 6: Performance test with retries
  test('should handle performance issues with retries', async ({ browser }) => {
    console.log('🧪 Testing performance with retry...');
    
    await RetryHelper.withRetry(async (page: Page) => {
      const startTime = Date.now();
      
      await page.goto('/', { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Fail if page takes too long to load (simulate performance issue)
      if (loadTime > 10000) {
        throw new Error(`Page load too slow: ${loadTime}ms`);
      }
      
      expect(loadTime).toBeLessThan(10000);
      console.log(`✅ Page loaded in ${loadTime}ms`);
    }, {
      maxRetries: 3,
      retryDelay: 3000,
      resetDataBetweenRetries: false,
      reinitializeBrowser: true
    });
  });
});

// Example of a test class using the retry decorator (commented out due to decorator issues)
/*
class RetryTestClass {
  @RetryHelper.retry({ maxRetries: 3, retryDelay: 1500 })
  async performLoginTest(page: Page, context: BrowserContext, browser: Browser) {
    const loginPage = new TestLoginPage(page);
    await page.goto('/');
    await loginPage.login('test@example.com', 'password123');
    await expect(loginPage.userProfileLocator).toBeVisible();
  }
}
*/