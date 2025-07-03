import { Page, Locator } from '@playwright/test';

export abstract class BaseComponent {
  protected page: Page;
  protected rootLocator: Locator;

  constructor(page: Page, rootSelector: string) {
    this.page = page;
    this.rootLocator = page.locator(rootSelector);
  }

  async isVisible(): Promise<boolean> {
    try {
      await this.rootLocator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async waitForVisible(timeout?: number): Promise<void> {
    await this.rootLocator.waitFor({ state: 'visible', timeout });
  }

  async waitForHidden(timeout?: number): Promise<void> {
    await this.rootLocator.waitFor({ state: 'hidden', timeout });
  }

  protected getChildLocator(selector: string): Locator {
    return this.rootLocator.locator(selector);
  }

  protected async clickChild(selector: string): Promise<void> {
    await this.getChildLocator(selector).click();
  }

  protected async fillChild(selector: string, value: string): Promise<void> {
    await this.getChildLocator(selector).fill(value);
  }

  protected async getChildText(selector: string): Promise<string> {
    return await this.getChildLocator(selector).textContent() || '';
  }
}