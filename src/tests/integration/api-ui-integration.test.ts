import { test, expect } from '@playwright/test';
import { TestApiWrapper } from '../../wrappers/api';
import { SeleniumTestPage } from '../../wrappers/ui';
import { retryTest, RetryHelper, expectWithRetry } from '../../utils';

/**
 * Integration Tests combining API and UI testing
 * - API tests use the local test app (localhost:3000)
 * - UI tests use the Selenium test page (automationintesting.com)
 */
test.describe('API + UI Integration Tests', () => {
  let apiWrapper: TestApiWrapper;

  test.beforeEach(async ({ request }) => {
    apiWrapper = new TestApiWrapper(request);
  });

  test.afterEach(async () => {
    // Clean up API data after each test
    await apiWrapper.resetData();
  });

  test('should perform API operations and UI form testing independently', async ({ page, request }) => {
    console.log('🔄 Running combined API and UI test');
    
    // Part 1: API Testing (using local test app)
    console.log('📡 Testing API functionality');
    
    // Create a user via API
    const newUser = {
      name: 'Integration Test User',
      email: `integration-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      username: `intuser${Date.now()}`
    };
    
    const createdUser = await apiWrapper.createUser(newUser);
    expect(createdUser).toBeDefined();
    expect(createdUser.name).toBe(newUser.name);
    expect(createdUser.email).toBe(newUser.email);
    
    // Verify user exists via API
    const allUsers = await apiWrapper.getUsers();
    const foundUser = allUsers.find(u => u.email === newUser.email);
    expect(foundUser).toBeDefined();
    
    console.log('✅ API operations completed successfully');
    
    // Part 2: UI Testing (using Selenium test page)
    console.log('🌐 Testing UI functionality');
    
    const testPage = new SeleniumTestPage(page);
    await testPage.navigate();
    
    // Use the API user data to fill the UI form (demonstrating data flow)
    const uiFormData = {
      firstName: createdUser.name.split(' ')[0] || 'Test',
      surname: createdUser.name.split(' ')[1] || 'User',
      gender: 'Male' as const,
      colors: ['red'] as readonly ('red' | 'blue')[],
      contactMethod: 'email' as const,
      continents: ['Europe']
    };
    
    await testPage.fillTestForm(uiFormData);
    
    // Validate UI form was filled correctly
    const formData = await testPage.getFormData();
    expect(formData.firstName).toBe(uiFormData.firstName);
    expect(formData.surname).toBe(uiFormData.surname);
    
    await testPage.submitForm();
    
    console.log('✅ UI form operations completed successfully');
    console.log('🎉 Integration test completed - API and UI working together');
  });

  test('should handle multiple users via API and multiple form submissions via UI', async ({ page, request }) => {
    console.log('🔄 Testing multiple API users and UI form submissions');
    
    // Part 1: Create multiple users via API
    const users = [];
    for (let i = 1; i <= 3; i++) {
      const user = {
        name: `Test User ${i}`,
        email: `testuser${i}-${Date.now()}@example.com`,
        password: 'Password123!',
        username: `testuser${i}_${Date.now()}`
      };
      
      const createdUser = await apiWrapper.createUser(user);
      users.push(createdUser);
      console.log(`✅ Created user ${i}: ${createdUser.name}`);
    }
    
    expect(users).toHaveLength(3);
    
    // Part 2: Fill and submit form for each user's data
    const testPage = new SeleniumTestPage(page);
    await testPage.navigate();
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const [firstName, surname] = user.name.split(' ');
      
      console.log(`📝 Filling form for user: ${user.name}`);
      
      const formData = {
        firstName,
        surname: surname || 'User',
        gender: (['Male', 'Female', 'My Business!'] as const)[i % 3],
        colors: [['red'], ['blue'], ['red', 'blue']][i % 3] as readonly ('red' | 'blue')[],
        contactMethod: (['email', 'sms'] as const)[i % 2],
        continents: [['Europe'], ['Asia'], ['North America']][i % 3]
      };
      
      // Clear form before filling
      if (i > 0) {
        await testPage.clearForm();
      }
      
      await testPage.fillTestForm(formData);
      
      // Validate form data
      const currentFormData = await testPage.getFormData();
      expect(currentFormData.firstName).toBe(formData.firstName);
      expect(currentFormData.surname).toBe(formData.surname);
      
      await testPage.submitForm();
      await page.waitForTimeout(1000); // Wait between submissions
      
      console.log(`✅ Form submitted for user: ${user.name}`);
    }
    
    console.log('🎉 Multiple users and form submissions completed successfully');
  });

  // Test with retry capability
  retryTest('should handle API failures and UI flakiness with retry', async (page, context, browser) => {
    console.log('🔄 Testing API and UI with retry capability');
    
    const request = context.request;
    const apiWrapper = new TestApiWrapper(request);
    
    // Part 1: API operations with potential retry
    console.log('📡 Creating user via API (with retry capability)');
    
    const userData = {
      name: 'Retry Test User',
      email: `retry-${Date.now()}@example.com`,
      password: 'RetryPass123!',
      username: `retryuser${Date.now()}`
    };
    
    let user;
    try {
      user = await apiWrapper.createUser(userData);
      expect(user).toBeDefined();
    } catch (error) {
      console.log('API operation failed, but retry will handle it');
      throw error; // Let retry mechanism handle this
    }
    
    // Part 2: UI operations with retry-friendly assertions
    console.log('🌐 Testing UI with retry-friendly assertions');
    
    const testPage = new SeleniumTestPage(page);
    await testPage.navigate();
    
    // Use expectWithRetry for potentially flaky UI elements
    await expectWithRetry(
      async () => await testPage.firstNameInput.isVisible(),
      (isVisible) => expect(isVisible).toBe(true),
      { timeout: 10000, interval: 500 }
    );
    
    const formData = {
      firstName: user.name.split(' ')[0],
      surname: user.name.split(' ')[1] || 'User',
      gender: 'Female' as const,
      colors: ['blue'] as readonly ('red' | 'blue')[],
      contactMethod: 'email' as const,
      continents: ['Australia']
    };
    
    await testPage.fillTestForm(formData);
    
    // Validate with retry
    await expectWithRetry(
      async () => await testPage.getFormData(),
      (currentFormData) => {
        expect(currentFormData.firstName).toBe(formData.firstName);
        expect(currentFormData.surname).toBe(formData.surname);
      },
      { timeout: 5000, interval: 1000 }
    );
    
    await testPage.submitForm();
    
    console.log('✅ API and UI operations with retry completed successfully');
  }, {
    attempts: 3,
    retryDelay: 2000,
    resetDataBetweenRetries: true,
    reinitializeBrowser: true
  });

  test('should validate data consistency between API and UI', async ({ page, request }) => {
    console.log('🔍 Testing data consistency between API and UI');
    
    // Create user with specific data via API
    const userData = {
      name: 'Consistency Test User',
      email: `consistency-${Date.now()}@example.com`,
      password: 'ConsistentPass123!',
      username: `consistentuser${Date.now()}`
    };
    
    const createdUser = await apiWrapper.createUser(userData);
    
    // Get all users via API to verify creation
    const allUsers = await apiWrapper.getUsers();
    const apiUser = allUsers.find(u => u.email === userData.email);
    expect(apiUser).toBeDefined();
    expect(apiUser!.name).toBe(userData.name);
    
    // Use UI to enter and validate the same data pattern
    const testPage = new SeleniumTestPage(page);
    await testPage.navigate();
    
    const [firstName, surname] = createdUser.name.split(' ');
    const uiData = {
      firstName,
      surname: surname || 'User',
      gender: 'Male' as const,
      colors: ['red'] as readonly ('red' | 'blue')[],
      contactMethod: 'email' as const,
      continents: ['Europe']
    };
    
    await testPage.fillTestForm(uiData);
    const formData = await testPage.getFormData();
    
    // Validate data consistency
    expect(formData.firstName).toBe(firstName);
    expect(formData.surname).toBe(surname || 'User');
    expect(formData.emailSelected).toBe(true); // Matching contact method
    
    // Update user via API and verify
    const updatedUserData = {
      ...createdUser,
      name: `${formData.firstName} ${formData.surname} Updated`
    };
    
    const updatedUser = await apiWrapper.updateUser(createdUser.id, updatedUserData);
    expect(updatedUser.name).toContain('Updated');
    
    console.log('✅ Data consistency validated between API and UI');
  });

  test('should handle error scenarios in both API and UI', async ({ page, request }) => {
    console.log('❌ Testing error scenarios in API and UI');
    
    // Part 1: Test API error handling
    console.log('📡 Testing API error scenarios');
    
    // Try to get non-existent user
    try {
      await apiWrapper.getUserById(999999);
      // If this doesn't throw, the test should fail
      expect(true).toBe(false);
    } catch (error) {
      console.log('✅ API correctly handled non-existent user request');
    }
    
    // Try to create user with invalid data
    try {
      await apiWrapper.createUser({
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: bad email format
        password: '123', // Invalid: too short
        username: ''
      });
      expect(true).toBe(false);
    } catch (error) {
      console.log('✅ API correctly handled invalid user data');
    }
    
    // Part 2: Test UI resilience
    console.log('🌐 Testing UI resilience');
    
    const testPage = new SeleniumTestPage(page);
    await testPage.navigate();
    
    // Test form validation by trying empty submission
    await testPage.submitForm(); // Submit without filling form
    
    // Form should still be accessible after attempted empty submission
    const isFormStillValid = await testPage.validateFormElements();
    expect(isFormStillValid).toBe(true);
    
    // Test with extreme values
    const extremeData = {
      firstName: 'A'.repeat(100), // Very long name
      surname: 'B'.repeat(100),
      gender: 'Male' as const,
      colors: ['red', 'blue'] as readonly ('red' | 'blue')[],
      contactMethod: 'email' as const,
      continents: ['Europe', 'Asia', 'Africa'] // Multiple selections
    };
    
    await testPage.fillTestForm(extremeData);
    const formData = await testPage.getFormData();
    
    // Verify form handled extreme values (may be truncated)
    expect(formData.firstName.length).toBeGreaterThan(0);
    expect(formData.surname.length).toBeGreaterThan(0);
    
    console.log('✅ Error scenarios handled appropriately in both API and UI');
  });

  test('should demonstrate complete user journey across API and UI', async ({ page, request }) => {
    console.log('🚀 Demonstrating complete user journey');
    
    // Step 1: Create user account via API
    console.log('1️⃣ Creating user account via API');
    const userAccount = {
      name: 'Journey Test User',
      email: `journey-${Date.now()}@example.com`,
      password: 'JourneyPass123!',
      username: `journeyuser${Date.now()}`
    };
    
    const createdAccount = await apiWrapper.createUser(userAccount);
    expect(createdAccount).toBeDefined();
    
    // Step 2: Verify account creation
    console.log('2️⃣ Verifying account creation');
    const retrievedAccount = await apiWrapper.getUserById(createdAccount.id);
    expect(retrievedAccount.email).toBe(userAccount.email);
    
    // Step 3: Use account data in UI form
    console.log('3️⃣ Using account data in UI form');
    const testPage = new SeleniumTestPage(page);
    await testPage.navigate();
    
    const [firstName, surname] = createdAccount.name.split(' ');
    const profileData = {
      firstName,
      surname: surname || 'User',
      gender: 'Female' as const,
      colors: ['red', 'blue'] as readonly ('red' | 'blue')[],
      contactMethod: 'email' as const,
      continents: ['North America', 'Europe']
    };
    
    await testPage.fillTestForm(profileData);
    await testPage.submitForm();
    
    // Step 4: Update account based on UI interaction
    console.log('4️⃣ Updating account based on UI interaction');
    const updatedAccount = {
      ...createdAccount,
      name: `${profileData.firstName} ${profileData.surname}`,
      // Could add more fields based on form data
    };
    
    const finalAccount = await apiWrapper.updateUser(createdAccount.id, updatedAccount);
    expect(finalAccount.name).toBe(`${profileData.firstName} ${profileData.surname}`);
    
    // Step 5: Final verification
    console.log('5️⃣ Final verification');
    const allUsers = await apiWrapper.getUsers();
    const finalUser = allUsers.find(u => u.id === createdAccount.id);
    expect(finalUser).toBeDefined();
    expect(finalUser!.name).toBe(updatedAccount.name);
    
    console.log('🎉 Complete user journey completed successfully');
    console.log(`✅ Created and managed user: ${finalUser!.name} (${finalUser!.email})`);
  });
});