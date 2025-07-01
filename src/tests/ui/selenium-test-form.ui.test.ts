import { test, expect } from '@playwright/test';
import { SeleniumTestPage } from '../../wrappers/ui';
import { retryTest, expectWithRetry } from '../../utils';

/**
 * UI Tests for the Selenium Test Form
 * Tests the form at https://automationintesting.com/selenium/testpage/
 */
test.describe('Selenium Test Form - UI Tests', () => {
  
  test('should display all form elements correctly', async ({ page }) => {
    const testPage = new SeleniumTestPage(page);
    
    console.log('🌐 Navigating to Selenium test page');
    await testPage.navigate();
    
    console.log('✅ Validating all form elements are visible');
    await expect(testPage.firstNameInput).toBeVisible();
    await expect(testPage.surnameInput).toBeVisible();
    await expect(testPage.genderDropdown).toBeVisible();
    await expect(testPage.redCheckbox).toBeVisible();
    await expect(testPage.blueCheckbox).toBeVisible();
    await expect(testPage.emailRadio).toBeVisible();
    await expect(testPage.smsRadio).toBeVisible();
    await expect(testPage.continentsSelect).toBeVisible();
    await expect(testPage.submitButton).toBeVisible();
    
    // Validate form elements are functional
    const isFormValid = await testPage.validateFormElements();
    expect(isFormValid).toBe(true);
    
    console.log('✅ All form elements are visible and accessible');
  });

  test('should fill and validate form inputs correctly', async ({ page }) => {
    const testPage = new SeleniumTestPage(page);
    
    await testPage.navigate();
    
    const testData = {
      firstName: 'Alice',
      surname: 'Johnson',
      gender: 'Female' as const,
      colors: ['red', 'blue'] as readonly ('red' | 'blue')[],
      contactMethod: 'email' as const,
      continents: ['Asia', 'Europe']
    };
    
    console.log('📝 Filling form with test data');
    await testPage.fillTestForm(testData);
    
    // Validate form was filled correctly
    const formData = await testPage.getFormData();
    expect(formData.firstName).toBe(testData.firstName);
    expect(formData.surname).toBe(testData.surname);
    expect(formData.gender).toBe(testData.gender);
    expect(formData.redChecked).toBe(true);
    expect(formData.blueChecked).toBe(true);
    expect(formData.emailSelected).toBe(true);
    
    console.log('✅ Form data validated successfully');
  });

  test('should handle gender dropdown selection', async ({ page }) => {
    const testPage = new SeleniumTestPage(page);
    
    await testPage.navigate();
    
    // Test all gender options
    const genderOptions = ['Male', 'Female', 'My Business!'];
    
    for (const gender of genderOptions) {
      console.log(`🔄 Testing gender selection: ${gender}`);
      await testPage.genderDropdown.selectOption(gender);
      
      const selectedValue = await testPage.genderDropdown.inputValue();
      expect(selectedValue).toBe(gender);
    }
    
    console.log('✅ Gender dropdown functionality verified');
  });

  test('should handle checkbox interactions correctly', async ({ page }) => {
    const testPage = new SeleniumTestPage(page);
    
    await testPage.navigate();
    
    // Test red checkbox
    console.log('🔴 Testing red checkbox');
    await testPage.redCheckbox.check();
    expect(await testPage.redCheckbox.isChecked()).toBe(true);
    
    await testPage.redCheckbox.uncheck();
    expect(await testPage.redCheckbox.isChecked()).toBe(false);
    
    // Test blue checkbox
    console.log('🔵 Testing blue checkbox');
    await testPage.blueCheckbox.check();
    expect(await testPage.blueCheckbox.isChecked()).toBe(true);
    
    // Test both checkboxes can be selected simultaneously
    await testPage.redCheckbox.check();
    expect(await testPage.redCheckbox.isChecked()).toBe(true);
    expect(await testPage.blueCheckbox.isChecked()).toBe(true);
    
    console.log('✅ Checkbox interactions verified');
  });

  test('should handle radio button selection', async ({ page }) => {
    const testPage = new SeleniumTestPage(page);
    
    await testPage.navigate();
    
    // Test email radio button
    console.log('📧 Testing email radio button');
    await testPage.emailRadio.check();
    expect(await testPage.emailRadio.isChecked()).toBe(true);
    expect(await testPage.smsRadio.isChecked()).toBe(false);
    
    // Test SMS radio button
    console.log('📱 Testing SMS radio button');
    await testPage.smsRadio.check();
    expect(await testPage.smsRadio.isChecked()).toBe(true);
    expect(await testPage.emailRadio.isChecked()).toBe(false);
    
    console.log('✅ Radio button functionality verified');
  });

  test('should submit form successfully', async ({ page }) => {
    const testPage = new SeleniumTestPage(page);
    
    await testPage.navigate();
    
    const testData = {
      firstName: 'Bob',
      surname: 'Smith',
      gender: 'Male' as const,
      colors: ['red'] as readonly ('red' | 'blue')[],
      contactMethod: 'sms' as const,
      continents: ['North America']
    };
    
    console.log('📝 Filling and submitting form');
    await testPage.completeTestForm(testData);
    
    // Wait a moment for any submission processing
    await page.waitForTimeout(1000);
    
    console.log('✅ Form submission completed');
    // Note: The actual behavior after submission depends on the page implementation
    // We'll validate that the form interaction completed without errors
  });

  // Test with retry functionality for potentially flaky elements
  retryTest('should handle form interactions with retry capability', async (page, context, browser) => {
    const testPage = new SeleniumTestPage(page);
    
    console.log('🔄 Testing form with retry capability');
    await testPage.navigate();
    
    // Use expectWithRetry for potentially flaky form elements
    await expectWithRetry(
      async () => await testPage.firstNameInput.isVisible(),
      (isVisible) => expect(isVisible).toBe(true),
      { timeout: 10000, interval: 500 }
    );
    
    await expectWithRetry(
      async () => await testPage.submitButton.isEnabled(),
      (isEnabled) => expect(isEnabled).toBe(true),
      { timeout: 5000, interval: 500 }
    );
    
    // Fill form with retry capability
    const testData = {
      firstName: 'Charlie',
      surname: 'Brown',
      gender: 'Male' as const,
      colors: ['blue'] as readonly ('red' | 'blue')[],
      contactMethod: 'email' as const,
      continents: ['Australia']
    };
    
    await testPage.fillTestForm(testData);
    
    // Validate with retry
    await expectWithRetry(
      async () => await testPage.getFormData(),
      (formData) => {
        expect(formData.firstName).toBe(testData.firstName);
        expect(formData.surname).toBe(testData.surname);
      },
      { timeout: 5000, interval: 1000 }
    );
    
    console.log('✅ Form interactions with retry completed successfully');
  }, {
    attempts: 3,
    retryDelay: 2000,
    reinitializeBrowser: true,
    resetDataBetweenRetries: false
  });

  test('should clear form correctly', async ({ page }) => {
    const testPage = new SeleniumTestPage(page);
    
    await testPage.navigate();
    
    // Fill form first
    const testData = {
      firstName: 'David',
      surname: 'Wilson',
      gender: 'Male' as const,
      colors: ['red', 'blue'] as readonly ('red' | 'blue')[],
      contactMethod: 'sms' as const,
      continents: ['Africa']
    };
    
    await testPage.fillTestForm(testData);
    
    // Verify form is filled
    let formData = await testPage.getFormData();
    expect(formData.firstName).toBe(testData.firstName);
    expect(formData.surname).toBe(testData.surname);
    
    console.log('🧹 Clearing form');
    await testPage.clearForm();
    
    // Verify form is cleared
    formData = await testPage.getFormData();
    expect(formData.firstName).toBe('');
    expect(formData.surname).toBe('');
    expect(formData.redChecked).toBe(false);
    expect(formData.blueChecked).toBe(false);
    
    console.log('✅ Form cleared successfully');
  });

  test('should handle slow typing simulation', async ({ page }) => {
    const testPage = new SeleniumTestPage(page);
    
    await testPage.navigate();
    
    console.log('⌨️ Testing slow typing simulation');
    await testPage.typeSlowly(testPage.firstNameInput, 'Slow', 150);
    await testPage.typeSlowly(testPage.surnameInput, 'Typer', 150);
    
    const formData = await testPage.getFormData();
    expect(formData.firstName).toBe('Slow');
    expect(formData.surname).toBe('Typer');
    
    console.log('✅ Slow typing simulation completed');
  });

  test('should validate form workflow end-to-end', async ({ page }) => {
    const testPage = new SeleniumTestPage(page);
    
    await testPage.navigate();
    
    console.log('🔄 Performing complete form validation workflow');
    const workflowResult = await testPage.performFormValidationWorkflow();
    
    expect(workflowResult.formElementsVisible).toBe(true);
    expect(workflowResult.canFillForm).toBe(true);
    expect(workflowResult.formData).toBeDefined();
    expect(workflowResult.formData.firstName).toBe('John');
    expect(workflowResult.formData.surname).toBe('Doe');
    
    console.log('✅ Complete form workflow validated successfully');
  });
});