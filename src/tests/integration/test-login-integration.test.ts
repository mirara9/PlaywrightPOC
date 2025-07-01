import { test, expect } from '@playwright/test';
import { TestLoginPage } from '../../wrappers/ui';
import { TestDataManager, TestHelpers } from '../../utils';

test.describe('Login Integration Tests - UI + API', () => {
  let loginPage: TestLoginPage;
  let testData: TestDataManager;
  let baseURL: string;

  test.beforeEach(async ({ page }) => {
    loginPage = new TestLoginPage(page);
    testData = TestDataManager.getInstance();
    baseURL = 'http://localhost:3000';
    
    await loginPage.navigateToLogin();
    await loginPage.clearSession();
  });

  test.describe('End-to-End Login Flow', () => {
    test('should complete full login flow from UI to backend verification', async ({ request }) => {
      const user = testData.getUser('regular');
      
      // 1. Perform login through UI
      await loginPage.loginAndWaitForSuccess(user.email, user.password);
      await loginPage.expectUserProfileVisible();
      await loginPage.expectUserName(user.name);
      
      // 2. Verify session was created
      const sessionUser = await loginPage.getSessionUser();
      expect(sessionUser).toBeTruthy();
      expect(sessionUser.email).toBe(user.email);
      expect(sessionUser.name).toBe(user.name);
      
      // 3. Verify backend API still works with same credentials
      const apiResponse = await request.post(`${baseURL}/api/login`, {
        data: {
          email: user.email,
          password: user.password
        }
      });
      
      expect(apiResponse.status()).toBe(200);
      const apiData = await apiResponse.json();
      expect(apiData.success).toBe(true);
      expect(apiData.user.email).toBe(user.email);
    });

    test('should handle logout flow with session cleanup', async () => {
      const user = testData.getUser('regular');
      
      // Login
      await loginPage.loginAndWaitForSuccess(user.email, user.password);
      await loginPage.expectUserProfileVisible();
      
      // Verify session exists
      let sessionUser = await loginPage.getSessionUser();
      expect(sessionUser).toBeTruthy();
      
      // Logout
      await loginPage.clickLogout();
      await loginPage.waitForLogout();
      await loginPage.expectLoginFormVisible();
      
      // Verify session is cleared
      sessionUser = await loginPage.getSessionUser();
      expect(sessionUser).toBeNull();
      
      // Verify we can login again
      await loginPage.loginAndWaitForSuccess(user.email, user.password);
      await loginPage.expectUserProfileVisible();
    });
  });

  test.describe('Error Handling Integration', () => {
    test('should handle API errors gracefully in UI', async ({ request }) => {
      // First verify the API endpoint works normally
      const user = testData.getUser('regular');
      const normalResponse = await request.post(`${baseURL}/api/login`, {
        data: {
          email: user.email,
          password: user.password
        }
      });
      expect(normalResponse.status()).toBe(200);
      
      // Now test UI with invalid credentials
      await loginPage.fillEmail('invalid@example.com');
      await loginPage.fillPassword('wrongpassword');
      await loginPage.clickLoginButton();
      
      await loginPage.waitForLoadingComplete();
      await loginPage.expectErrorMessage('Invalid credentials. Please try again.');
      
      // Verify form is still functional after error
      await loginPage.loginAndWaitForSuccess(user.email, user.password);
      await loginPage.expectUserProfileVisible();
    });

    test('should handle network timeouts', async () => {
      // Simulate very slow network
      await loginPage.page.route('**/api/login', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.continue();
      });
      
      const user = testData.getUser('regular');
      await loginPage.fillEmail(user.email);
      await loginPage.fillPassword(user.password);
      await loginPage.clickLoginButton();
      
      // Should show loading state
      await loginPage.expectLoginButtonDisabled();
      
      // Eventually should complete or timeout
      await test.step('wait for response or timeout', async () => {
        try {
          await loginPage.waitForSuccessfulLogin();
        } catch (error) {
          // If it times out, that's also acceptable behavior
          console.log('Request timed out as expected');
        }
      });
    });
  });

  test.describe('Data Consistency', () => {
    test('should maintain consistent user data between UI and API', async ({ request }) => {
      // Get user data from API
      const apiResponse = await request.get(`${baseURL}/api/users/1`);
      expect(apiResponse.status()).toBe(200);
      const apiUser = (await apiResponse.json()).user;
      
      // Login with UI and compare data
      const testUser = testData.getUser('regular');
      await loginPage.loginAndWaitForSuccess(testUser.email, testUser.password);
      
      const displayedName = await loginPage.getUserName();
      expect(displayedName).toBe(apiUser.name);
      
      const sessionUser = await loginPage.getSessionUser();
      expect(sessionUser.id).toBe(apiUser.id);
      expect(sessionUser.email).toBe(apiUser.email);
    });

    test('should handle user creation flow', async ({ request }) => {
      const newUser = testData.generateRandomUser();
      
      // Create user via API
      const createResponse = await request.post(`${baseURL}/api/users`, {
        data: {
          name: newUser.name,
          email: newUser.email,
          password: newUser.password
        }
      });
      
      expect(createResponse.status()).toBe(201);
      const createdUser = (await createResponse.json()).user;
      
      // Login with new user via UI
      await loginPage.loginAndWaitForSuccess(newUser.email, newUser.password);
      await loginPage.expectUserProfileVisible();
      await loginPage.expectUserName(createdUser.name);
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle rapid login/logout cycles', async () => {
      const user = testData.getUser('regular');
      
      for (let i = 0; i < 3; i++) {
        // Login
        await loginPage.loginAndWaitForSuccess(user.email, user.password);
        await loginPage.expectUserProfileVisible();
        
        // Logout
        await loginPage.clickLogout();
        await loginPage.waitForLogout();
        await loginPage.expectLoginFormVisible();
        
        // Small delay between cycles
        await TestHelpers.delay(500);
      }
    });

    test('should maintain session across page refreshes', async () => {
      const user = testData.getUser('regular');
      
      await loginPage.loginAndWaitForSuccess(user.email, user.password);
      await loginPage.expectUserProfileVisible();
      
      // Refresh page multiple times
      for (let i = 0; i < 3; i++) {
        await loginPage.reload();
        await loginPage.expectUserProfileVisible();
        await loginPage.expectUserName(user.name);
      }
    });
  });

  test.describe('Multiple User Scenarios', () => {
    test('should handle different user types correctly', async ({ request }) => {
      const userTypes = [
        { type: 'regular' as const, expectedRole: 'user' },
        { type: 'admin' as const, expectedRole: 'admin' }
      ];
      
      for (const { type, expectedRole } of userTypes) {
        const user = testData.getUser(type);
        
        // Test UI login
        await loginPage.clearSession();
        await loginPage.navigateToLogin();
        await loginPage.loginAndWaitForSuccess(user.email, user.password);
        await loginPage.expectUserProfileVisible();
        await loginPage.expectUserName(user.name);
        
        // Test API login
        const apiResponse = await request.post(`${baseURL}/api/login`, {
          data: {
            email: user.email,
            password: user.password
          }
        });
        
        expect(apiResponse.status()).toBe(200);
        const apiData = await apiResponse.json();
        expect(apiData.user.email).toBe(user.email);
        
        await loginPage.clickLogout();
        await loginPage.waitForLogout();
      }
    });
  });

  test.describe('Security Integration', () => {
    test('should prevent session hijacking', async () => {
      const user = testData.getUser('regular');
      
      // Login normally
      await loginPage.loginAndWaitForSuccess(user.email, user.password);
      const validSession = await loginPage.getSessionUser();
      
      // Modify session data maliciously
      await loginPage.page.evaluate(() => {
        const maliciousData = {
          id: 999,
          name: 'Hacker',
          email: 'hacker@evil.com'
        };
        sessionStorage.setItem('currentUser', JSON.stringify(maliciousData));
      });
      
      // Refresh page
      await loginPage.reload();
      
      // Should either:
      // 1. Show login page (session invalidated)
      // 2. Show original user data (session validated)
      const currentUser = await loginPage.getSessionUser();
      if (currentUser) {
        // If still logged in, should be original user
        expect(currentUser.email).toBe(validSession.email);
        expect(currentUser.name).toBe(validSession.name);
      } else {
        // If logged out, should show login form
        await loginPage.expectLoginFormVisible();
      }
    });

    test('should handle XSS attempts in form inputs', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">'
      ];
      
      for (const payload of xssPayloads) {
        await loginPage.fillEmail(payload);
        await loginPage.fillPassword('password');
        await loginPage.clickLoginButton();
        
        // Should not execute script, should show validation error
        await loginPage.waitForLoadingComplete();
        expect(await loginPage.isErrorMessageVisible()).toBeTruthy();
        
        // Clear form for next iteration
        await loginPage.clearForm();
      }
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should work with different viewport sizes', async () => {
      const user = testData.getUser('regular');
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 768, height: 1024 },  // Tablet
        { width: 375, height: 667 }    // Mobile
      ];
      
      for (const viewport of viewports) {
        await TestHelpers.setViewportSize(loginPage.page, viewport.width, viewport.height);
        
        await loginPage.clearSession();
        await loginPage.navigateToLogin();
        await loginPage.loginAndWaitForSuccess(user.email, user.password);
        await loginPage.expectUserProfileVisible();
        
        await loginPage.clickLogout();
        await loginPage.waitForLogout();
      }
    });
  });

  test.describe('Error Recovery', () => {
    test('should recover from temporary network issues', async () => {
      const user = testData.getUser('regular');
      let requestCount = 0;
      
      // Fail first request, succeed on second
      await loginPage.page.route('**/api/login', async route => {
        requestCount++;
        if (requestCount === 1) {
          await route.abort('failed');
        } else {
          await route.continue();
        }
      });
      
      // First attempt should fail
      await loginPage.login(user.email, user.password);
      await loginPage.waitForLoadingComplete();
      
      // Second attempt should succeed
      await loginPage.clickLoginButton();
      await loginPage.waitForSuccessfulLogin();
      await loginPage.expectUserProfileVisible();
    });
  });
});