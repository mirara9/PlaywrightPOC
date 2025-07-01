import { test, expect } from '@playwright/test';
import { ExampleHomePage, ExampleLoginPage } from '../../wrappers/ui';
import { TestDataManager, TestHelpers } from '../../utils';

test.describe('Login UI Tests', () => {
  let homePage: ExampleHomePage;
  let loginPage: ExampleLoginPage;
  let testData: TestDataManager;

  test.beforeEach(async ({ page }) => {
    homePage = new ExampleHomePage(page);
    loginPage = new ExampleLoginPage(page);
    testData = TestDataManager.getInstance();
    
    await TestHelpers.clearLocalStorage(page);
  });

  test('should display login page elements', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.expectLoginFormVisible();
    await loginPage.expectTitle(/login/i);
  });

  test('should login with valid credentials', async ({ page }) => {
    const user = testData.getUser('regular');
    
    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    
    await homePage.waitForUrl(/.*\/dashboard.*/);
    expect(await homePage.isLoggedIn()).toBeTruthy();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const invalidUser = {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    };
    
    await loginPage.navigate();
    await loginPage.login(invalidUser.email, invalidUser.password);
    
    await loginPage.expectErrorMessage('Invalid credentials');
  });

  test('should show error for empty fields', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.login('', '');
    
    await loginPage.expectErrorMessage('Please fill in all fields');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.clickForgotPassword();
    
    await loginPage.waitForUrl(/.*\/forgot-password.*/);
  });

  test('should redirect to home page when already logged in', async ({ page }) => {
    const user = testData.getUser('regular');
    
    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    await homePage.waitForUrl(/.*\/dashboard.*/);
    
    await loginPage.navigate();
    await homePage.waitForUrl(/.*\/dashboard.*/);
  });

  test('should maintain session after page refresh', async ({ page }) => {
    const user = testData.getUser('regular');
    
    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    await homePage.waitForUrl(/.*\/dashboard.*/);
    
    await page.reload();
    await TestHelpers.waitForNetworkIdle(page);
    
    expect(await homePage.isLoggedIn()).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await TestHelpers.mockApiResponse(
      page,
      'POST',
      '**/api/login',
      { error: 'Network error' },
      500
    );
    
    const user = testData.getUser('regular');
    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    
    await loginPage.expectErrorMessage('Network error occurred');
  });

  test('should validate email format', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.login('invalid-email', 'password123');
    
    await loginPage.expectErrorMessage('Please enter a valid email address');
  });

  test('should remember user preference', async ({ page, context }) => {
    const user = testData.getUser('regular');
    
    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    await homePage.waitForUrl(/.*\/dashboard.*/);
    
    const cookies = await context.cookies();
    const rememberCookie = cookies.find(cookie => cookie.name === 'remember_user');
    expect(rememberCookie).toBeDefined();
  });
});