import { Page, Locator } from '@playwright/test';
import { BasePage, PageConfig } from './base-page';

export class ExampleHomePage extends BasePage {
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly navigationMenu: Locator;
  private readonly loginButton: Locator;
  private readonly userProfile: Locator;

  constructor(page: Page, config?: PageConfig) {
    super(page, '/', config);
    
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.searchButton = page.locator('[data-testid="search-button"]');
    this.navigationMenu = page.locator('[data-testid="nav-menu"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.userProfile = page.locator('[data-testid="user-profile"]');
  }

  async search(query: string): Promise<void> {
    await this.fillInput(this.searchInput, query);
    await this.clickElement(this.searchButton);
  }

  async navigateToLogin(): Promise<void> {
    await this.clickElement(this.loginButton);
    await this.waitForUrl(/.*\/login.*/);
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.isVisible(this.userProfile);
  }

  async getSearchPlaceholder(): Promise<string | null> {
    return await this.getAttribute(this.searchInput, 'placeholder');
  }

  async expectSearchInputVisible(): Promise<void> {
    await this.expectVisible(this.searchInput, 'Search input should be visible');
  }

  async expectNavigationMenuVisible(): Promise<void> {
    await this.expectVisible(this.navigationMenu, 'Navigation menu should be visible');
  }
}

export class ExampleLoginPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;
  private readonly forgotPasswordLink: Locator;

  constructor(page: Page, config?: PageConfig) {
    super(page, '/login', config);
    
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password"]');
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.clickElement(this.loginButton);
  }

  async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  async clickForgotPassword(): Promise<void> {
    await this.clickElement(this.forgotPasswordLink);
  }

  async expectLoginFormVisible(): Promise<void> {
    await this.expectVisible(this.emailInput, 'Email input should be visible');
    await this.expectVisible(this.passwordInput, 'Password input should be visible');
    await this.expectVisible(this.loginButton, 'Login button should be visible');
  }

  async expectErrorMessage(message: string): Promise<void> {
    await this.expectVisible(this.errorMessage, 'Error message should be visible');
    await this.expectText(this.errorMessage, message, 'Error message should match expected text');
  }
}