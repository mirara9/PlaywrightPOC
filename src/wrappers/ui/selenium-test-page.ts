import { Page, Locator } from '@playwright/test';
import { BasePage, PageConfig } from './base-page';

/**
 * Page Object Model for the Selenium Test Page at automationintesting.com
 * This page contains a test form with various input types for automation practice
 */
export class SeleniumTestPage extends BasePage {
  // Form input locators
  readonly firstNameInput: Locator;
  readonly surnameInput: Locator;
  readonly genderDropdown: Locator;
  readonly redCheckbox: Locator;
  readonly blueCheckbox: Locator;
  readonly emailRadio: Locator;
  readonly smsRadio: Locator;
  readonly continentsSelect: Locator;
  readonly submitButton: Locator;
  
  // Result/feedback locators
  readonly resultMessage: Locator;
  readonly formContainer: Locator;

  constructor(page: Page, config?: PageConfig) {
    super(page, 'https://automationintesting.com/selenium/testpage/', config);
    
    // Initialize form input locators
    this.firstNameInput = page.locator('#first_name');
    this.surnameInput = page.locator('#surname');
    this.genderDropdown = page.locator('#gender');
    this.redCheckbox = page.locator('#red');
    this.blueCheckbox = page.locator('#blue');
    this.emailRadio = page.locator('#email');
    this.smsRadio = page.locator('#sms');
    this.continentsSelect = page.locator('#continents');
    this.submitButton = page.locator('#submit_button');
    
    // Result and container locators
    this.resultMessage = page.locator('#result_message, .result, .feedback');
    this.formContainer = page.locator('form, .form-container');
  }

  /**
   * Fill the complete test form with provided data
   */
  async fillTestForm(formData: {
    firstName: string;
    surname: string;
    gender: 'Male' | 'Female' | 'My Business!';
    colors: readonly ('red' | 'blue')[];
    contactMethod: 'email' | 'sms';
    continents: string[];
  }): Promise<void> {
    console.log('📝 Filling test form with data:', formData);
    
    // Fill text inputs
    await this.fillInput(this.firstNameInput, formData.firstName);
    await this.fillInput(this.surnameInput, formData.surname);
    
    // Select gender from dropdown
    await this.selectOption(this.genderDropdown, formData.gender);
    
    // Select color checkboxes
    if (formData.colors.includes('red')) {
      await this.redCheckbox.check();
    }
    if (formData.colors.includes('blue')) {
      await this.blueCheckbox.check();
    }
    
    // Select contact method
    if (formData.contactMethod === 'email') {
      await this.clickElement(this.emailRadio);
    } else {
      await this.clickElement(this.smsRadio);
    }
    
    // Select continents (multi-select)
    for (const continent of formData.continents) {
      await this.continentsSelect.selectOption(continent);
    }
  }

  /**
   * Submit the test form
   */
  async submitForm(): Promise<void> {
    console.log('🚀 Submitting test form');
    await this.clickElement(this.submitButton);
  }

  /**
   * Complete form fill and submit in one action
   */
  async completeTestForm(formData: {
    firstName: string;
    surname: string;
    gender: 'Male' | 'Female' | 'My Business!';
    colors: readonly ('red' | 'blue')[];
    contactMethod: 'email' | 'sms';
    continents: string[];
  }): Promise<void> {
    await this.fillTestForm(formData);
    await this.submitForm();
  }

  /**
   * Get the current form data (for validation)
   */
  async getFormData(): Promise<{
    firstName: string;
    surname: string;
    gender: string;
    redChecked: boolean;
    blueChecked: boolean;
    emailSelected: boolean;
    smsSelected: boolean;
  }> {
    const [firstName, surname, gender, redChecked, blueChecked, emailSelected, smsSelected] = await Promise.all([
      this.firstNameInput.inputValue(),
      this.surnameInput.inputValue(),
      this.genderDropdown.inputValue(),
      this.redCheckbox.isChecked(),
      this.blueCheckbox.isChecked(),
      this.emailRadio.isChecked(),
      this.smsRadio.isChecked()
    ]);

    return {
      firstName,
      surname,
      gender,
      redChecked,
      blueChecked,
      emailSelected,
      smsSelected
    };
  }

  /**
   * Clear all form inputs
   */
  async clearForm(): Promise<void> {
    console.log('🧹 Clearing test form');
    
    await this.firstNameInput.clear();
    await this.surnameInput.clear();
    
    // Reset dropdown to first option
    await this.genderDropdown.selectOption({ index: 0 });
    
    // Uncheck checkboxes if checked
    if (await this.redCheckbox.isChecked()) {
      await this.redCheckbox.uncheck();
    }
    if (await this.blueCheckbox.isChecked()) {
      await this.blueCheckbox.uncheck();
    }
    
    // Reset radio buttons (email is usually default)
    await this.emailRadio.check();
  }

  /**
   * Validate form is displayed correctly
   */
  async validateFormElements(): Promise<boolean> {
    console.log('✅ Validating form elements are present');
    
    const elements = [
      this.firstNameInput,
      this.surnameInput,
      this.genderDropdown,
      this.redCheckbox,
      this.blueCheckbox,
      this.emailRadio,
      this.smsRadio,
      this.continentsSelect,
      this.submitButton
    ];

    for (const element of elements) {
      if (!(await element.isVisible())) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if form submission was successful
   * (This might need adjustment based on actual page behavior)
   */
  async isFormSubmitted(): Promise<boolean> {
    try {
      // Look for any indication of successful submission
      const hasResult = await this.resultMessage.isVisible({ timeout: 5000 });
      return hasResult;
    } catch {
      // If no result message, check if form was cleared or URL changed
      const firstName = await this.firstNameInput.inputValue();
      return firstName === '';
    }
  }

  /**
   * Get available gender options
   */
  async getGenderOptions(): Promise<string[]> {
    const options = await this.genderDropdown.locator('option').allTextContents();
    return options.filter(option => option.trim() !== '');
  }

  /**
   * Get available continent options
   */
  async getContinentOptions(): Promise<string[]> {
    const options = await this.continentsSelect.locator('option').allTextContents();
    return options.filter(option => option.trim() !== '');
  }

  /**
   * Validate specific field values
   */
  async validateFieldValue(field: 'firstName' | 'surname', expectedValue: string): Promise<boolean> {
    const locator = field === 'firstName' ? this.firstNameInput : this.surnameInput;
    const actualValue = await locator.inputValue();
    return actualValue === expectedValue;
  }

  /**
   * Simulate user typing with delays (for realistic interaction)
   */
  async typeSlowly(locator: Locator, text: string, delay: number = 100): Promise<void> {
    await locator.clear();
    for (const char of text) {
      await locator.type(char, { delay });
    }
  }

  /**
   * Perform complete form validation workflow
   */
  async performFormValidationWorkflow(): Promise<{
    formElementsVisible: boolean;
    canFillForm: boolean;
    canSubmitForm: boolean;
    formData: any;
  }> {
    console.log('🔍 Performing complete form validation workflow');
    
    // Check all elements are visible
    const formElementsVisible = await this.validateFormElements();
    
    // Try to fill form with test data
    const testData = {
      firstName: 'John',
      surname: 'Doe',
      gender: 'Male' as const,
      colors: ['red'] as readonly ('red' | 'blue')[],
      contactMethod: 'email' as const,
      continents: ['Europe']
    };
    
    let canFillForm = true;
    let canSubmitForm = false;
    let formData = null;
    
    try {
      await this.fillTestForm(testData);
      formData = await this.getFormData();
      canFillForm = true;
      
      // Try to submit
      await this.submitForm();
      canSubmitForm = true;
      
    } catch (error) {
      console.warn('Form interaction failed:', error);
      canFillForm = false;
    }
    
    return {
      formElementsVisible,
      canFillForm,
      canSubmitForm,
      formData
    };
  }
}