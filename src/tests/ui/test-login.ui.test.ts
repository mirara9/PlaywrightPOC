import { test, expect } from '@playwright/test';
import { TestLoginPage } from '../../wrappers/ui';
import { TestDataManager, TestHelpers } from '../../utils';

test.describe('Test Login Page - UI Tests', () => {
  let loginPage: TestLoginPage;
  let testData: TestDataManager;

  test.beforeEach(async ({ page }) => {
    loginPage = new TestLoginPage(page);
    testData = TestDataManager.getInstance();
    
    // Navigate first, then clear session
    await loginPage.navigateToLogin();
    await loginPage.clearSession();
  });

  test.describe('Page Layout and Elements', () => {
    test('should display all login form elements', async () => {
      await loginPage.expectLoginFormVisible();
      
      // Check that all form elements are present
      await expect(loginPage.emailInputLocator).toBeVisible();
      await expect(loginPage.passwordInputLocator).toBeVisible();
      await expect(loginPage.loginButtonLocator).toBeVisible();
      await expect(loginPage.forgotPasswordLinkLocator).toBeVisible();
    });

    test('should have correct page title', async () => {
      await loginPage.expectTitle(/Test Login Application/);
    });

    test('should have proper input placeholders', async () => {
      const emailPlaceholder = await loginPage.emailInputLocator.getAttribute('placeholder');
      const passwordPlaceholder = await loginPage.passwordInputLocator.getAttribute('placeholder');
      
      expect(emailPlaceholder).toBe('Enter your email');
      expect(passwordPlaceholder).toBe('Enter your password');
    });

    test('should have proper input types', async () => {
      const emailType = await loginPage.emailInputLocator.getAttribute('type');
      const passwordType = await loginPage.passwordInputLocator.getAttribute('type');
      
      expect(emailType).toBe('email');
      expect(passwordType).toBe('password');
    });
  });

  test.describe('Form Validation', () => {
    test('should show error for empty fields', async () => {
      await loginPage.clickLoginButton();
      await loginPage.expectErrorMessage('Please fill in all fields');
    });

    test('should show error for empty email', async () => {
      await loginPage.fillPassword('password123');
      await loginPage.clickLoginButton();
      await loginPage.expectErrorMessage('Please fill in all fields');
    });

    test('should show error for empty password', async () => {
      await loginPage.fillEmail('test@example.com');
      await loginPage.clickLoginButton();
      await loginPage.expectErrorMessage('Please fill in all fields');
    });

    test('should show error for invalid email format', async () => {
      await loginPage.fillEmail('invalid-email');
      await loginPage.fillPassword('password123');
      await loginPage.clickLoginButton();
      await loginPage.expectErrorMessage('Please enter a valid email address');
    });

    test('should show error for invalid credentials', async () => {
      await loginPage.fillEmail('nonexistent@example.com');
      await loginPage.fillPassword('wrongpassword');
      await loginPage.clickLoginButton();
      
      await loginPage.waitForLoadingComplete();
      await loginPage.expectErrorMessage('Invalid credentials');
    });
  });

  test.describe('Successful Login Flow', () => {
    test('should login successfully with valid credentials', async () => {
      const user = testData.getUser('regular');
      
      await loginPage.loginAndWaitForSuccess(user.email, user.password);
      
      await loginPage.expectUserProfileVisible();
      await loginPage.expectUserName(user.name);
      expect(await loginPage.isLoggedIn()).toBeTruthy();
    });

    test('should login with admin credentials', async () => {
      const adminUser = testData.getUser('admin');
      
      await loginPage.loginAndWaitForSuccess(adminUser.email, adminUser.password);
      
      await loginPage.expectUserProfileVisible();
      await loginPage.expectUserName(adminUser.name);
    });

    test('should show success message before redirecting', async () => {
      const user = testData.getUser('regular');
      
      await loginPage.login(user.email, user.password);
      await loginPage.waitForLoadingComplete();
      
      await loginPage.expectSuccessMessage('Login successful! Redirecting...');
    });
  });

  test.describe('Form Interactions', () => {
    test('should allow typing in email field', async () => {
      const testEmail = 'test@example.com';
      await loginPage.fillEmail(testEmail);
      await loginPage.expectEmailValue(testEmail);
    });

    test('should allow typing in password field', async () => {
      const testPassword = 'testpassword';
      await loginPage.fillPassword(testPassword);
      await loginPage.expectPasswordValue(testPassword);
    });

    test('should clear form properly', async () => {
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password');
      
      await loginPage.clearForm();
      
      await loginPage.expectEmailValue('');
      await loginPage.expectPasswordValue('');
    });

    test('should submit form with Enter key', async () => {
      const user = testData.getUser('regular');
      
      await loginPage.fillEmail(user.email);
      await loginPage.fillPassword(user.password);
      await loginPage.submitFormWithEnter();
      
      await loginPage.waitForSuccessfulLogin();
      expect(await loginPage.isLoggedIn()).toBeTruthy();
    });

    test('should handle tab navigation through form', async () => {
      await loginPage.tabThroughForm();
      
      // Check that focus moves correctly (this would need visual verification in real scenarios)
      const activeElement = await loginPage.page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(activeElement).toBe('login-submit');
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state during login', async () => {
      const user = testData.getUser('regular');
      
      await loginPage.fillEmail(user.email);
      await loginPage.fillPassword(user.password);
      await loginPage.clickLoginButton();
      
      // Check loading state
      await loginPage.expectLoginButtonDisabled();
      await loginPage.expectLoginButtonText(/Signing In.../);
      
      // Wait for completion
      await loginPage.waitForSuccessfulLogin();
    });

    test('should re-enable button after failed login', async () => {
      await loginPage.fillEmail('invalid@example.com');
      await loginPage.fillPassword('wrongpassword');
      await loginPage.clickLoginButton();
      
      await loginPage.waitForLoadingComplete();
      await loginPage.expectLoginButtonEnabled();
      await loginPage.expectLoginButtonText('Sign In');
    });
  });

  test.describe('Error Message Handling', () => {
    test('should clear error messages when user starts typing', async () => {
      // First trigger an error
      await loginPage.clickLoginButton();
      await loginPage.expectErrorMessage('Please fill in all fields');
      
      // Start typing in email field
      await loginPage.fillEmail('t');
      
      // Error message should disappear
      expect(await loginPage.isErrorMessageVisible()).toBeFalsy();
    });

    test('should clear error messages when typing in password field', async () => {
      await loginPage.clickLoginButton();
      await loginPage.expectErrorMessage('Please fill in all fields');
      
      await loginPage.fillPassword('p');
      
      expect(await loginPage.isErrorMessageVisible()).toBeFalsy();
    });
  });

  test.describe('Logout Functionality', () => {
    test('should logout successfully', async () => {
      const user = testData.getUser('regular');
      
      // Login first
      await loginPage.loginAndWaitForSuccess(user.email, user.password);
      await loginPage.expectUserProfileVisible();
      
      // Logout
      await loginPage.clickLogout();
      await loginPage.waitForLogout();
      
      await loginPage.expectLoginFormVisible();
      await loginPage.expectUserProfileHidden();
      expect(await loginPage.isLoggedIn()).toBeFalsy();
    });

    test('should clear session data on logout', async () => {
      const user = testData.getUser('regular');
      
      await loginPage.loginAndWaitForSuccess(user.email, user.password);
      
      // Verify session exists
      const sessionBefore = await loginPage.getSessionUser();
      expect(sessionBefore).toBeTruthy();
      
      await loginPage.clickLogout();
      await loginPage.waitForLogout();
      
      // Verify session is cleared
      const sessionAfter = await loginPage.getSessionUser();
      expect(sessionAfter).toBeNull();
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session after page refresh', async () => {
      const user = testData.getUser('regular');
      
      await loginPage.loginAndWaitForSuccess(user.email, user.password);
      await loginPage.expectUserProfileVisible();
      
      // Refresh page
      await loginPage.reload();
      
      // Should still be logged in
      await loginPage.expectUserProfileVisible();
      await loginPage.expectUserName(user.name);
    });

    test('should handle pre-existing session on page load', async () => {
      const user = { id: 1, name: 'Test User', email: 'test@example.com' };
      
      // Set session before navigating
      await loginPage.setSessionUser(user);
      await loginPage.navigateToLogin();
      
      // Should be logged in immediately
      await loginPage.expectUserProfileVisible();
      await loginPage.expectUserName(user.name);
    });
  });

  test.describe('Forgot Password', () => {
    test('should handle forgot password click', async () => {
      // Set up alert handler
      let alertMessage = '';
      loginPage.page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        await dialog.accept();
      });
      
      await loginPage.clickForgotPassword();
      
      // Verify alert was shown
      expect(alertMessage).toContain('Password reset functionality');
    });
  });

  test.describe('Network Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      await loginPage.simulateNetworkError();
      
      const user = testData.getUser('regular');
      await loginPage.fillEmail(user.email);
      await loginPage.fillPassword(user.password);
      await loginPage.clickLoginButton();
      
      // Should handle the network error appropriately
      await loginPage.waitForLoadingComplete();
      // Note: The specific error handling would depend on the implementation
    });

    test('should handle slow network conditions', async () => {
      await loginPage.simulateSlowNetwork();
      
      const user = testData.getUser('regular');
      await loginPage.fillEmail(user.email);
      await loginPage.fillPassword(user.password);
      await loginPage.clickLoginButton();
      
      // Should show loading state for extended period
      await loginPage.expectLoginButtonDisabled();
      
      // Eventually should complete
      await loginPage.waitForSuccessfulLogin();
    });
  });

  test.describe('Multiple User Types', () => {
    const userTypes = [
      { type: 'regular', testName: 'regular user' },
      { type: 'admin', testName: 'admin user' }
    ] as const;

    userTypes.forEach(({ type, testName }) => {
      test(`should login successfully with ${testName} credentials`, async () => {
        const user = testData.getUser(type);
        
        await loginPage.loginAndWaitForSuccess(user.email, user.password);
        
        await loginPage.expectUserProfileVisible();
        await loginPage.expectUserName(user.name);
      });
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels', async () => {
      const emailLabel = await loginPage.page.locator('label[for="email"]').textContent();
      const passwordLabel = await loginPage.page.locator('label[for="password"]').textContent();
      
      expect(emailLabel).toBe('Email Address');
      expect(passwordLabel).toBe('Password');
    });

    test('should have required attributes on inputs', async () => {
      const emailRequired = await loginPage.emailInputLocator.getAttribute('required');
      const passwordRequired = await loginPage.passwordInputLocator.getAttribute('required');
      
      expect(emailRequired).toBe('');
      expect(passwordRequired).toBe('');
    });
  });

  test.describe('Visual Validation', () => {
    test('should take screenshot on successful login', async () => {
      const user = testData.getUser('regular');
      
      await loginPage.loginAndWaitForSuccess(user.email, user.password);
      
      await loginPage.screenshot('successful-login', { fullPage: true });
    });

    test('should take screenshot on error state', async () => {
      await loginPage.fillEmail('invalid@example.com');
      await loginPage.fillPassword('wrongpassword');
      await loginPage.clickLoginButton();
      
      await loginPage.waitForLoadingComplete();
      await loginPage.waitForLoginError();
      
      await loginPage.screenshot('login-error', { fullPage: true });
    });
  });
});