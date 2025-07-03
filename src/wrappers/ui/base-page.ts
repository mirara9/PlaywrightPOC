import { Page, Locator, expect, BrowserContext } from '@playwright/test';

export interface PageConfig {
  timeout?: number;
  baseURL?: string;
  viewport?: { width: number; height: number };
}

export abstract class BasePage {
  public page: Page;
  protected context: BrowserContext;
  protected config: PageConfig;
  public readonly url: string;

  constructor(page: Page, url: string, config?: PageConfig) {
    this.page = page;
    this.context = page.context();
    this.url = url;
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  async navigate(): Promise<void> {
    const fullUrl = this.config.baseURL ? `${this.config.baseURL}${this.url}` : this.url;
    await this.page.goto(fullUrl);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  protected async waitForElement(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ 
      state: 'visible', 
      timeout: timeout || this.config.timeout 
    });
  }

  protected async clickElement(locator: Locator, options?: { timeout?: number; force?: boolean }): Promise<void> {
    await this.waitForElement(locator, options?.timeout);
    await locator.click({ force: options?.force });
  }

  protected async fillInput(locator: Locator, value: string, options?: { timeout?: number }): Promise<void> {
    await this.waitForElement(locator, options?.timeout);
    await locator.fill(value);
  }

  protected async selectOption(locator: Locator, value: string | string[], options?: { timeout?: number }): Promise<void> {
    await this.waitForElement(locator, options?.timeout);
    await locator.selectOption(value);
  }

  protected async getText(locator: Locator, options?: { timeout?: number }): Promise<string> {
    await this.waitForElement(locator, options?.timeout);
    return await locator.textContent() || '';
  }

  protected async getAttribute(locator: Locator, attribute: string, options?: { timeout?: number }): Promise<string | null> {
    await this.waitForElement(locator, options?.timeout);
    return await locator.getAttribute(attribute);
  }

  protected async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  protected async isEnabled(locator: Locator): Promise<boolean> {
    return await locator.isEnabled();
  }

  async waitForUrl(url: string | RegExp, timeout?: number): Promise<void> {
    await this.page.waitForURL(url, { timeout: timeout || this.config.timeout });
  }

  async screenshot(name: string, options?: { fullPage?: boolean }): Promise<void> {
    await this.page.screenshot({ 
      path: `screenshots/${name}.png`, 
      fullPage: options?.fullPage || false 
    });
  }

  protected async expectVisible(locator: Locator, message?: string): Promise<void> {
    await expect(locator, message).toBeVisible();
  }

  protected async expectHidden(locator: Locator, message?: string): Promise<void> {
    await expect(locator, message).toBeHidden();
  }

  protected async expectText(locator: Locator, text: string | RegExp, message?: string): Promise<void> {
    await expect(locator, message).toHaveText(text);
  }

  protected async expectValue(locator: Locator, value: string | RegExp, message?: string): Promise<void> {
    await expect(locator, message).toHaveValue(value);
  }

  protected async expectUrl(url: string | RegExp, message?: string): Promise<void> {
    await expect(this.page, message).toHaveURL(url);
  }

  async expectTitle(title: string | RegExp, message?: string): Promise<void> {
    await expect(this.page, message).toHaveTitle(title);
  }

  protected async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  protected async hover(locator: Locator): Promise<void> {
    await locator.hover();
  }

  protected async doubleClick(locator: Locator): Promise<void> {
    await locator.dblclick();
  }

  protected async rightClick(locator: Locator): Promise<void> {
    await locator.click({ button: 'right' });
  }

  protected async dragAndDrop(source: Locator, target: Locator): Promise<void> {
    await source.dragTo(target);
  }

  protected async uploadFile(locator: Locator, filePath: string): Promise<void> {
    await locator.setInputFiles(filePath);
  }

  protected async handleDialog(accept: boolean = true, promptText?: string): Promise<void> {
    this.page.on('dialog', async dialog => {
      if (accept) {
        await dialog.accept(promptText);
      } else {
        await dialog.dismiss();
      }
    });
  }

  protected async waitForResponse(urlPattern: string | RegExp, timeout?: number): Promise<void> {
    await this.page.waitForResponse(urlPattern, { timeout: timeout || this.config.timeout });
  }

  protected async waitForRequest(urlPattern: string | RegExp, timeout?: number): Promise<void> {
    await this.page.waitForRequest(urlPattern, { timeout: timeout || this.config.timeout });
  }
}