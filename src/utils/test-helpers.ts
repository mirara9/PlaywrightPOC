import { Page, BrowserContext, APIRequestContext } from '@playwright/test';

export class TestHelpers {
  static async clearStorage(context: BrowserContext): Promise<void> {
    await context.clearCookies();
    await context.clearPermissions();
  }

  static async clearLocalStorage(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  static async waitForNetworkIdle(page: Page, timeout: number = 30000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
  }

  static async interceptNetworkRequests(
    page: Page, 
    urlPattern: string | RegExp, 
    mockResponse?: any
  ): Promise<void> {
    await page.route(urlPattern, async route => {
      if (mockResponse) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse)
        });
      } else {
        await route.continue();
      }
    });
  }

  static async mockApiResponse(
    page: Page,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string | RegExp,
    response: any,
    status: number = 200
  ): Promise<void> {
    await page.route(url, async route => {
      if (route.request().method() === method) {
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
      } else {
        await route.continue();
      }
    });
  }

  static async takeFullPageScreenshot(page: Page, name: string): Promise<void> {
    await page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  static async retryAction<T>(
    action: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await action();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries) {
          await this.delay(delay * (i + 1));
        }
      }
    }
    
    throw lastError!;
  }

  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async getEnvironmentVariable(key: string, defaultValue?: string): Promise<string> {
    return process.env[key] || defaultValue || '';
  }

  static async getCurrentTimestamp(): Promise<string> {
    return new Date().toISOString();
  }

  static async generateUniqueId(): Promise<string> {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  static async setViewportSize(page: Page, width: number, height: number): Promise<void> {
    await page.setViewportSize({ width, height });
  }

  static async scrollToBottom(page: Page): Promise<void> {
    await page.evaluate(() => {
      (window as any).scrollTo(0, (document as any).body.scrollHeight);
    });
  }

  static async scrollToTop(page: Page): Promise<void> {
    await page.evaluate(() => {
      (window as any).scrollTo(0, 0);
    });
  }

  static async downloadFile(page: Page, downloadTrigger: () => Promise<void>): Promise<string> {
    const downloadPromise = page.waitForEvent('download');
    await downloadTrigger();
    const download = await downloadPromise;
    const path = `downloads/${await download.suggestedFilename()}`;
    await download.saveAs(path);
    return path;
  }

  static async handleAlert(page: Page, accept: boolean = true, text?: string): Promise<void> {
    page.on('dialog', async dialog => {
      if (accept) {
        await dialog.accept(text);
      } else {
        await dialog.dismiss();
      }
    });
  }
}