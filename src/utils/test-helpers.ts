import { Page, BrowserContext, APIRequestContext } from '@playwright/test';

export class TestHelpers {
  static async clearStorage(context: BrowserContext): Promise<void> {
    await context.clearCookies();
    await context.clearPermissions();
  }

  static async clearLocalStorage(page: Page): Promise<void> {
    try {
      await page.evaluate(() => {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
        } catch (error) {
          // Ignore SecurityError for cross-origin restrictions
          console.log('Storage not accessible:', (error as Error).message);
        }
      });
    } catch (error) {
      // Silently handle the error - storage not available
      console.log('Storage access denied');
    }
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
    const path = require('path');
    const screenshotPath = path.join('test-results', 'screenshots', `${name}-${Date.now()}.png`);
    await page.screenshot({
      path: screenshotPath,
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
    const path = require('path');
    const downloadPromise = page.waitForEvent('download');
    await downloadTrigger();
    const download = await downloadPromise;
    const downloadPath = path.join('downloads', await download.suggestedFilename());
    await download.saveAs(downloadPath);
    return downloadPath;
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

  /**
   * Resets test data by calling the API reset endpoint
   */
  static async resetTestData(baseUrl: string = 'http://localhost:3000'): Promise<void> {
    try {
      const response = await fetch(`${baseUrl}/api/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn('Failed to reset test data:', response.statusText);
      } else {
        const result = await response.json();
        console.log('Test data reset:', result.message);
      }
    } catch (error) {
      console.warn('Error resetting test data:', (error as Error).message);
    }
  }

  /**
   * Clears all browser storage (localStorage, sessionStorage, cookies)
   */
  static async clearBrowserStorage(page: Page): Promise<void> {
    try {
      // Clear local and session storage
      await this.clearLocalStorage(page);
      
      // Clear cookies through context
      const context = page.context();
      await this.clearStorage(context);
      
      // Clear IndexedDB and WebSQL if available
      await page.evaluate(() => {
        try {
          // Clear IndexedDB
          if ('indexedDB' in window) {
            indexedDB.databases().then(databases => {
              databases.forEach(db => {
                if (db.name) {
                  indexedDB.deleteDatabase(db.name);
                }
              });
            }).catch(() => {});
          }
        } catch (error) {
          // Ignore errors
        }
      });
    } catch (error) {
      console.warn('Error clearing browser storage:', (error as Error).message);
    }
  }
}