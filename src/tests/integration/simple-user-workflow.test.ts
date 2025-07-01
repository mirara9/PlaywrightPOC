import { test, expect } from '@playwright/test';
import { TestApiWrapper } from '../../wrappers/api';
import { TestLoginPage } from '../../wrappers/ui';
import { TestDataManager, TestHelpers } from '../../utils';

test.describe('Simple User Workflow Integration Tests', () => {
  let apiWrapper: TestApiWrapper;
  let loginPage: TestLoginPage;
  let testData: TestDataManager;

  test.beforeEach(async ({ page, request }) => {
    apiWrapper = new TestApiWrapper(request);
    loginPage = new TestLoginPage(page);
    testData = TestDataManager.getInstance();
    
    // Reset server data for test isolation
    await apiWrapper.resetData();
    
    await TestHelpers.clearLocalStorage(page);
  });

  test('should create user via API and login via UI', async ({ page }) => {
    const newUser = testData.generateRandomUser();
    
    const createdUser = await apiWrapper.createUser({
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      password: newUser.password
    });
    
    expect(createdUser).toBeDefined();
    expect(createdUser.email).toBe(newUser.email);
    
    await loginPage.navigateToLogin();
    await loginPage.loginAndWaitForSuccess(newUser.email, newUser.password);
    
    // Verify login success by checking user profile is visible
    await loginPage.expectUserProfileVisible();
    await loginPage.expectUserName(createdUser.name);
  });

  test('should verify user data consistency between API and UI', async ({ page }) => {
    const userId = 1;
    const userFromApi = await apiWrapper.getUserById(userId);
    
    const user = testData.getUser('regular');
    await loginPage.navigateToLogin();
    await loginPage.loginAndWaitForSuccess(user.email, user.password);
    
    // Verify the displayed user name matches API data
    await loginPage.expectUserName(userFromApi.name);
    
    // Also verify session data consistency
    const sessionUser = await loginPage.getSessionUser();
    expect(sessionUser.name).toBe(userFromApi.name);
    expect(sessionUser.email).toBe(userFromApi.email);
  });

  test('should update user via API and verify changes in UI', async ({ page }) => {
    const userId = 1;
    const updatedName = `Updated User ${testData.generateRandomString()}`;
    
    // Update user via API
    await apiWrapper.updateUser(userId, { name: updatedName });
    
    // Login as the updated user
    const user = testData.getUser('regular');
    await loginPage.navigateToLogin();
    await loginPage.loginAndWaitForSuccess(user.email, user.password);
    
    // Verify the updated name is displayed
    await loginPage.expectUserName(updatedName);
  });

  test('should handle user creation and immediate login', async ({ page }) => {
    const newUser = testData.generateRandomUser();
    
    // Create user via API
    const createdUser = await apiWrapper.createUser({
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      password: newUser.password
    });
    
    // Immediately try to login with the new user
    await loginPage.navigateToLogin();
    await loginPage.loginAndWaitForSuccess(createdUser.email, newUser.password);
    
    // Verify successful login
    await loginPage.expectUserProfileVisible();
    await loginPage.expectUserName(createdUser.name);
    
    // Verify session contains correct user data
    const sessionUser = await loginPage.getSessionUser();
    expect(sessionUser.email).toBe(createdUser.email);
    expect(sessionUser.name).toBe(createdUser.name);
  });

  test('should handle logout and re-login workflow', async ({ page }) => {
    const user = testData.getUser('regular');
    
    // Login
    await loginPage.navigateToLogin();
    await loginPage.loginAndWaitForSuccess(user.email, user.password);
    await loginPage.expectUserProfileVisible();
    
    // Logout
    await loginPage.clickLogout();
    await loginPage.waitForLogout();
    await loginPage.expectLoginFormVisible();
    
    // Verify session is cleared
    const sessionAfterLogout = await loginPage.getSessionUser();
    expect(sessionAfterLogout).toBeNull();
    
    // Login again
    await loginPage.loginAndWaitForSuccess(user.email, user.password);
    await loginPage.expectUserProfileVisible();
    await loginPage.expectUserName(user.name);
  });

  test('should validate API and UI error handling', async ({ page }) => {
    // Test with non-existent user
    await loginPage.navigateToLogin();
    await loginPage.fillEmail('nonexistent@example.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.clickLoginButton();
    
    // Should show error from API
    await loginPage.waitForLoadingComplete();
    await loginPage.expectErrorMessage('Invalid credentials');
    
    // Verify login form is still visible
    await loginPage.expectLoginFormVisible();
    
    // Now login with valid credentials
    const user = testData.getUser('regular');
    await loginPage.clearForm();
    await loginPage.loginAndWaitForSuccess(user.email, user.password);
    await loginPage.expectUserProfileVisible();
  });

  test('should handle concurrent API operations with UI validation', async ({ page }) => {
    // Create multiple users via API
    const users = [
      testData.generateRandomUser(),
      testData.generateRandomUser()
    ];
    
    const createPromises = users.map(user => 
      apiWrapper.createUser({
        name: user.name,
        email: user.email,
        username: user.username,
        password: user.password
      })
    );
    
    const createdUsers = await Promise.all(createPromises);
    expect(createdUsers).toHaveLength(2);
    
    // Verify all users can login via UI
    for (let i = 0; i < createdUsers.length; i++) {
      await loginPage.navigateToLogin();
      await loginPage.clearSession();
      
      await loginPage.loginAndWaitForSuccess(createdUsers[i].email, users[i].password);
      await loginPage.expectUserProfileVisible();
      await loginPage.expectUserName(createdUsers[i].name);
      
      await loginPage.clickLogout();
      await loginPage.waitForLogout();
    }
  });
});