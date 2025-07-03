import { Page, Locator } from '@playwright/test';
import { BasePage, PageConfig } from './base-page';

export class TestLoginPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;
  private readonly successMessage: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly loginForm: Locator;
  private readonly userProfile: Locator;
  private readonly userName: Locator;
  private readonly logoutButton: Locator;

  constructor(page: Page, config?: PageConfig) {
    super(page, '/', config);
    
    // Login form elements
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password"]');
    this.loginForm = page.locator('[data-testid="login-form"]');
    
    // Dashboard elements
    this.userProfile = page.locator('[data-testid="user-profile"]');
    this.userName = page.locator('[data-testid="user-name"]');
    this.logoutButton = page.locator('[data-testid="logout-btn"]');
  }

  // Navigation and setup methods
  async navigateToLogin(): Promise<void> {
    await this.navigate();
    await this.waitForPageLoad();
    await this.expectLoginFormVisible();
  }

  // Login form interaction methods
  async fillEmail(email: string): Promise<void> {
    await this.fillInput(this.emailInput, email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.fillInput(this.passwordInput, password);
  }

  async clickLoginButton(): Promise<void> {
    await this.clickElement(this.loginButton);
  }

  async clickForgotPassword(): Promise<void> {
    await this.clickElement(this.forgotPasswordLink);
  }

  async clickLogout(): Promise<void> {
    await this.clickElement(this.logoutButton);
  }

  // Combined login action
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLoginButton();
  }

  async loginAndWaitForSuccess(email: string, password: string): Promise<void> {
    await this.login(email, password);
    await this.waitForSuccessfulLogin();
  }

  async loginAndWaitForError(email: string, password: string): Promise<void> {
    await this.login(email, password);
    await this.waitForLoginError();
  }

  // Getters for form values and states
  async getEmailValue(): Promise<string> {
    return await this.emailInput.inputValue();
  }

  async getPasswordValue(): Promise<string> {
    return await this.passwordInput.inputValue();
  }

  async getErrorMessage(): Promise<string> {
    await this.waitForElement(this.errorMessage);
    return await this.getText(this.errorMessage);
  }

  async getSuccessMessage(): Promise<string> {
    await this.waitForElement(this.successMessage);
    return await this.getText(this.successMessage);
  }

  async getUserName(): Promise<string> {
    await this.waitForElement(this.userName);
    return await this.getText(this.userName);
  }

  async getLoginButtonText(): Promise<string> {
    return await this.getText(this.loginButton);
  }

  async isLoginButtonDisabled(): Promise<boolean> {
    return !(await this.isEnabled(this.loginButton));
  }

  async isLoginFormVisible(): Promise<boolean> {
    return await this.isVisible(this.loginForm);
  }

  async isUserProfileVisible(): Promise<boolean> {
    return await this.isVisible(this.userProfile);
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  async isSuccessMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.successMessage);
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.isUserProfileVisible();
  }

  // Wait methods
  async waitForLoginError(): Promise<void> {
    await this.waitForElement(this.errorMessage);
  }

  async waitForSuccessMessage(): Promise<void> {
    await this.waitForElement(this.successMessage);
  }

  async waitForSuccessfulLogin(): Promise<void> {
    await this.waitForElement(this.userProfile);
  }

  async waitForLogout(): Promise<void> {
    await this.waitForElement(this.loginForm);
  }

  async waitForLoadingState(): Promise<void> {
    // Wait for login button to be disabled (loading state)
    await this.page.waitForFunction(() => {
      const btn = document.querySelector('[data-testid="login-submit"]') as HTMLButtonElement;
      return btn?.disabled === true;
    }, { timeout: 5000 });
  }

  async waitForLoadingComplete(): Promise<void> {
    // Wait for login button to be enabled again (loading complete)
    await this.page.waitForFunction(() => {
      const btn = document.querySelector('[data-testid="login-submit"]') as HTMLButtonElement;
      return btn?.disabled === false;
    }, { timeout: 10000 });
  }

  // Expectation methods using the framework's built-in assertions
  async expectLoginFormVisible(): Promise<void> {
    await this.expectVisible(this.loginForm, 'Login form should be visible');
  }

  async expectUserProfileVisible(): Promise<void> {
    await this.expectVisible(this.userProfile, 'User profile should be visible');
  }

  async expectUserProfileHidden(): Promise<void> {
    await this.expectHidden(this.userProfile, 'User profile should be hidden');
  }

  async expectErrorMessage(expectedMessage: string): Promise<void> {
    await this.expectVisible(this.errorMessage, 'Error message should be visible');
    await this.expectText(this.errorMessage, expectedMessage, 'Error message should match expected text');
  }

  async expectSuccessMessage(expectedMessage: string): Promise<void> {
    await this.expectVisible(this.successMessage, 'Success message should be visible');
    await this.expectText(this.successMessage, expectedMessage, 'Success message should match expected text');
  }

  async expectUserName(expectedName: string): Promise<void> {
    await this.expectVisible(this.userName, 'User name should be visible');
    await this.expectText(this.userName, expectedName, 'User name should match expected name');
  }

  async expectEmailValue(expectedEmail: string): Promise<void> {
    await this.expectValue(this.emailInput, expectedEmail, 'Email input should have expected value');
  }

  async expectPasswordValue(expectedPassword: string): Promise<void> {
    await this.expectValue(this.passwordInput, expectedPassword, 'Password input should have expected value');
  }

  async expectLoginButtonText(expectedText: string | RegExp): Promise<void> {
    await this.expectText(this.loginButton, expectedText, 'Login button should have expected text');
  }

  async expectLoginButtonDisabled(): Promise<void> {
    await this.page.waitForFunction(() => {
      const btn = document.querySelector('[data-testid="login-submit"]') as HTMLButtonElement;
      return btn?.disabled === true;
    }, { timeout: 5000 });
  }

  async expectLoginButtonEnabled(): Promise<void> {
    await this.page.waitForFunction(() => {
      const btn = document.querySelector('[data-testid="login-submit"]') as HTMLButtonElement;
      return btn?.disabled === false;
    }, { timeout: 5000 });
  }

  // Utility methods for testing
  async clearForm(): Promise<void> {
    await this.fillEmail('');
    await this.fillPassword('');
  }

  async submitFormWithEnter(): Promise<void> {
    await this.passwordInput.press('Enter');
  }

  async tabThroughForm(): Promise<void> {
    await this.emailInput.focus();
    await this.emailInput.press('Tab');
    await this.passwordInput.press('Tab');
    // Should focus on login button
  }

  async dismissAlert(): Promise<void> {
    this.page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
  }

  async acceptAlert(): Promise<void> {
    this.page.on('dialog', async dialog => {
      await dialog.accept();
    });
  }

  // Session management helpers
  async clearSession(): Promise<void> {
    try {
      await this.page.evaluate(() => {
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
          }
        } catch (error) {
          // Ignore SecurityError for cross-origin restrictions
          console.log('Session storage not accessible:', (error as Error).message);
        }
      });
    } catch (error) {
      // Silently handle the error - session storage not available
      console.log('Session storage access denied');
    }
  }

  async setSessionUser(user: { id: number; name: string; email: string }): Promise<void> {
    try {
      await this.page.evaluate((userData) => {
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('currentUser', JSON.stringify(userData));
          }
        } catch (error) {
          // Ignore SecurityError for cross-origin restrictions
          console.log('Session storage not accessible:', (error as Error).message);
        }
      }, user);
    } catch (error) {
      // Silently handle the error - session storage not available
      console.log('Session storage access denied');
    }
  }

  async getSessionUser(): Promise<any> {
    try {
      return await this.page.evaluate(() => {
        try {
          if (typeof sessionStorage !== 'undefined') {
            const user = sessionStorage.getItem('currentUser');
            return user ? JSON.parse(user) : null;
          }
          return null;
        } catch (error) {
          // Ignore SecurityError for cross-origin restrictions
          console.log('Session storage not accessible:', (error as Error).message);
          return null;
        }
      });
    } catch (error) {
      // Silently handle the error - session storage not available
      console.log('Session storage access denied');
      return null;
    }
  }

  // Network simulation helpers
  async simulateSlowNetwork(): Promise<void> {
    await this.page.route('**/*', async route => {
      // Add 2 second delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
  }

  async simulateNetworkError(): Promise<void> {
    await this.page.route('**/api/login', async route => {
      await route.abort('failed');
    });
  }

  async mockLoginAPI(response: any, status: number = 200): Promise<void> {
    await this.page.route('**/api/login', async route => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  // Public getter methods for test access
  get emailInputLocator(): Locator {
    return this.emailInput;
  }

  get passwordInputLocator(): Locator {
    return this.passwordInput;
  }

  get loginButtonLocator(): Locator {
    return this.loginButton;
  }

  get forgotPasswordLinkLocator(): Locator {
    return this.forgotPasswordLink;
  }

  get errorMessageLocator(): Locator {
    return this.errorMessage;
  }

  get successMessageLocator(): Locator {
    return this.successMessage;
  }

  get userProfileLocator(): Locator {
    return this.userProfile;
  }

  get logoutButtonLocator(): Locator {
    return this.logoutButton;
  }
}