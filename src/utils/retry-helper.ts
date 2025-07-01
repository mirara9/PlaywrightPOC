import { test, expect, Browser, BrowserContext, Page, TestInfo } from '@playwright/test';
import { TestHelpers } from './test-helpers';

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  resetDataBetweenRetries?: boolean;
  reinitializeBrowser?: boolean;
}

export class RetryHelper {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    resetDataBetweenRetries: true,
    reinitializeBrowser: true,
  };

  /**
   * Executes a test function with retry capability and full browser reinitialization
   * Similar to NUnit's Retry attribute
   */
  static async withRetry<T>(
    testFn: (page: Page, context: BrowserContext, browser: Browser) => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    let lastError: Error | undefined;
    let browser: Browser | undefined;
    let context: BrowserContext | undefined;
    let page: Page | undefined;

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        console.log(`🔄 Retry attempt ${attempt}/${opts.maxRetries}`);

        // Clean up previous attempt
        if (page) {
          await page.close().catch(() => {});
        }
        if (context) {
          await context.close().catch(() => {});
        }
        if (browser && opts.reinitializeBrowser) {
          await browser.close().catch(() => {});
          browser = undefined;
        }

        // Reset test data if requested
        if (opts.resetDataBetweenRetries && attempt > 1) {
          await TestHelpers.resetTestData();
        }

        // Initialize fresh browser/context/page
        if (!browser || opts.reinitializeBrowser) {
          const { chromium } = require('@playwright/test');
          browser = await chromium.launch({
            headless: process.env.HEADLESS === 'true',
            slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
          });
        }

        if (!browser) {
          throw new Error('Failed to initialize browser');
        }

        context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
          ignoreHTTPSErrors: true,
        });

        page = await context.newPage();

        // Clear storage before test
        await TestHelpers.clearBrowserStorage(page);

        // Execute the test function
        const result = await testFn(page, context, browser);
        
        console.log(`✅ Test passed on attempt ${attempt}`);
        return result;

      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Attempt ${attempt} failed:`, (error as Error).message);

        // If this is the last attempt, don't wait
        if (attempt < opts.maxRetries) {
          console.log(`⏳ Waiting ${opts.retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
        }
      } finally {
        // Clean up on final attempt or if successful
        if (attempt === opts.maxRetries || !lastError) {
          if (page) {
            await page.close().catch(() => {});
          }
          if (context) {
            await context.close().catch(() => {});
          }
          if (browser) {
            await browser.close().catch(() => {});
          }
        }
      }
    }

    // All retries failed
    console.log(`💥 All ${opts.maxRetries} attempts failed`);
    throw lastError || new Error('Test failed after all retry attempts');
  }

  /**
   * Creates a test wrapper that automatically retries with browser reinitialization
   */
  static createRetryTest(title: string, testFn: (page: Page, context: BrowserContext, browser: Browser) => Promise<void>, options: RetryOptions = {}) {
    return test(title, async ({ browser: originalBrowser }, testInfo: TestInfo) => {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      
      // Override Playwright's built-in retry to use our custom logic
      await this.withRetry(testFn, {
        ...opts,
        maxRetries: testInfo.retry < opts.maxRetries ? opts.maxRetries : 1,
      });
    });
  }

  /**
   * Decorator-style retry wrapper for existing test functions
   */
  static retry(options: RetryOptions = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        return RetryHelper.withRetry(
          async (page: Page, context: BrowserContext, browser: Browser) => {
            return await originalMethod.apply(this, [page, context, browser, ...args.slice(3)]);
          },
          options
        );
      };
      
      return descriptor;
    };
  }

  /**
   * Enhanced expect with retry logic for flaky assertions
   */
  static async expectWithRetry<T>(
    getValue: () => Promise<T> | T,
    assertion: (value: T) => void | Promise<void>,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout || 10000;
    const interval = options.interval || 500;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const value = await getValue();
        await assertion(value);
        return; // Success
      } catch (error) {
        if (Date.now() - startTime + interval >= timeout) {
          throw error; // Final attempt failed
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }
}

/**
 * Global retry test function that can be used like the standard test() function
 * but with automatic retry capability
 */
export function retryTest(
  title: string, 
  testFn: (page: Page, context: BrowserContext, browser: Browser) => Promise<void>, 
  options: RetryOptions = {}
) {
  return RetryHelper.createRetryTest(title, testFn, options);
}

/**
 * Retry decorator for class methods
 */
export const Retry = RetryHelper.retry;

/**
 * Enhanced expect with retry logic
 */
export const expectWithRetry = RetryHelper.expectWithRetry;