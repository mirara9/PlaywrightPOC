import { test, expect } from '@playwright/test';
import { ExampleApiWrapper, ExampleHomePage, ExampleLoginPage } from '../../index';
import { TestDataManager, TestHelpers } from '../../utils';

test.describe('User Workflow Integration Tests', () => {
  let apiWrapper: ExampleApiWrapper;
  let homePage: ExampleHomePage;
  let loginPage: ExampleLoginPage;
  let testData: TestDataManager;

  test.beforeEach(async ({ page, request }) => {
    apiWrapper = new ExampleApiWrapper(request);
    homePage = new ExampleHomePage(page);
    loginPage = new ExampleLoginPage(page);
    testData = TestDataManager.getInstance();
    
    await TestHelpers.clearLocalStorage(page);
  });

  test('should create user via API and login via UI', async ({ page }) => {
    const newUser = testData.generateRandomUser();
    
    const createdUser = await apiWrapper.createUser({
      name: newUser.name,
      email: newUser.email,
      username: newUser.username
    });
    
    expect(createdUser).toBeDefined();
    expect(createdUser.email).toBe(newUser.email);
    
    await loginPage.navigate();
    await loginPage.login(newUser.email, newUser.password);
    
    await homePage.waitForUrl(/.*\/dashboard.*/);
    expect(await homePage.isLoggedIn()).toBeTruthy();
  });

  test('should verify user data consistency between API and UI', async ({ page }) => {
    const userId = 1;
    const userFromApi = await apiWrapper.getUserById(userId);
    
    const user = testData.getUser('regular');
    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    await homePage.waitForUrl(/.*\/dashboard.*/);
    
    const userProfileText = await page.locator('[data-testid="user-profile-name"]').textContent();
    expect(userProfileText).toContain(userFromApi.name);
  });

  test('should update user via API and verify changes in UI', async ({ page }) => {
    const userId = 1;
    const updatedName = `Updated User ${testData.generateRandomString()}`;
    
    await apiWrapper.updateUser(userId, { name: updatedName });
    
    const user = testData.getUser('regular');
    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    await homePage.waitForUrl(/.*\/dashboard.*/);
    
    await page.reload();
    await TestHelpers.waitForNetworkIdle(page);
    
    const userProfileText = await page.locator('[data-testid="user-profile-name"]').textContent();
    expect(userProfileText).toContain(updatedName);
  });

  test('should handle user deletion workflow', async ({ page }) => {
    const newUser = testData.generateRandomUser();
    
    const createdUser = await apiWrapper.createUser({
      name: newUser.name,
      email: newUser.email,
      username: newUser.username
    });
    
    await loginPage.navigate();
    await loginPage.login(newUser.email, newUser.password);
    await homePage.waitForUrl(/.*\/dashboard.*/);
    
    await apiWrapper.deleteUser(createdUser.id);
    
    await page.reload();
    await loginPage.waitForUrl(/.*\/login.*/);
    
    await loginPage.expectErrorMessage('User not found');
  });

  test('should search users via API and verify results in UI', async ({ page }) => {
    const searchTerm = 'Leanne';
    const apiUsers = await apiWrapper.searchUsers(searchTerm);
    
    const user = testData.getUser('regular');
    await loginPage.navigate();
    await loginPage.login(user.email, user.password);
    await homePage.waitForUrl(/.*\/dashboard.*/);
    
    await homePage.search(searchTerm);
    await page.waitForSelector('[data-testid="search-results"]');
    
    const searchResults = await page.locator('[data-testid="search-result-item"]').count();
    expect(searchResults).toBeGreaterThanOrEqual(apiUsers.length);
  });

  test('should handle concurrent user operations', async ({ page, context }) => {
    const users = [
      testData.generateRandomUser(),
      testData.generateRandomUser(),
      testData.generateRandomUser()
    ];
    
    const createPromises = users.map(user => 
      apiWrapper.createUser({
        name: user.name,
        email: user.email,
        username: user.username
      })
    );
    
    const createdUsers = await Promise.all(createPromises);
    expect(createdUsers).toHaveLength(3);
    
    const allUsers = await apiWrapper.getUsers();
    expect(allUsers.length).toBeGreaterThanOrEqual(createdUsers.length);
    
    const loginUser = testData.getUser('regular');
    await loginPage.navigate();
    await loginPage.login(loginUser.email, loginUser.password);
    await homePage.waitForUrl(/.*\/dashboard.*/);
    
    await homePage.search('test');
    await page.waitForSelector('[data-testid="search-results"]');
    
    const searchResults = await page.locator('[data-testid="search-result-item"]').count();
    expect(searchResults).toBeGreaterThan(0);
  });

  test('should validate user permissions across API and UI', async ({ page }) => {
    const adminUser = testData.getUser('admin');
    
    const regularUser = await apiWrapper.getUserById(1);
    expect(regularUser).toBeDefined();
    
    await loginPage.navigate();
    await loginPage.login(adminUser.email, adminUser.password);
    await homePage.waitForUrl(/.*\/dashboard.*/);
    
    const adminPanel = page.locator('[data-testid="admin-panel"]');
    await expect(adminPanel).toBeVisible();
    
    const userManagementLink = page.locator('[data-testid="user-management"]');
    await expect(userManagementLink).toBeVisible();
  });
});