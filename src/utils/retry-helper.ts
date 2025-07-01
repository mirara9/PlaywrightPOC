import { test, expect, Browser, BrowserContext, Page, TestInfo } from '@playwright/test';
import { TestHelpers } from './test-helpers';

export interface RetryOptions {
  /** 
   * Total number of attempts (not retries after failure)
   * Must be >= 2 to have any effect (following NUnit behavior)
   * Default: 3 attempts (2 retries after initial failure)
   */
  attempts?: number;
  retryDelay?: number;
  resetDataBetweenRetries?: boolean;
  reinitializeBrowser?: boolean;
}

export class RetryHelper {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    attempts: 3, // 3 attempts = 1 initial + 2 retries (matching NUnit default)
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

    // Validate attempts (must be >= 2 to have any effect, following NUnit behavior)
    if (opts.attempts < 2) {
      console.log(`⚠️ Retry attempts set to ${opts.attempts}, but minimum is 2 for retries to work (NUnit behavior)`);
      
      // For attempts < 2, just run once without retry logic
      const { chromium } = require('@playwright/test');
      const isHeadless = process.env.HEADLESS === 'true' ? true : false;
      browser = await chromium.launch({
        headless: isHeadless,
        slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
      });
      
      if (!browser) {
        throw new Error('Failed to launch browser');
      }
      
      context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
      });
      
      page = await context.newPage();
      
      try {
        const result = await testFn(page, context, browser);
        return result;
      } finally {
        if (page) await page.close().catch(() => {});
        if (context) await context.close().catch(() => {});
        if (browser) await browser.close().catch(() => {});
      }
    }

    for (let attempt = 1; attempt <= opts.attempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${opts.attempts}`);

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
          const isHeadless = process.env.HEADLESS === 'true' ? true : false;
          browser = await chromium.launch({
            headless: isHeadless,
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

        // Check if this is an assertion failure (retryable) vs unexpected exception (not retryable)
        const err = error as Error;
        const isAssertionFailure = err && (
          err.name === 'AssertionError' ||
          err.message.includes('expect') ||
          err.message.includes('assertion') ||
          err.message.includes('toBe') ||
          err.message.includes('toEqual') ||
          err.message.includes('toContain')
        );
        
        // Additional check: if it's explicitly a TypeError, SyntaxError, ReferenceError, etc., it's not an assertion
        const isUnexpectedException = err && (
          error instanceof TypeError ||
          error instanceof SyntaxError ||
          error instanceof ReferenceError ||
          err.name === 'TypeError' ||
          err.name === 'SyntaxError' ||
          err.name === 'ReferenceError'
        );

        if (!isAssertionFailure || isUnexpectedException) {
          console.log(`💥 Unexpected exception (not retryable): ${err.message}`);
          throw error; // Don't retry unexpected exceptions (NUnit behavior)
        }

        // If this is the last attempt, don't wait
        if (attempt < opts.attempts) {
          console.log(`⏳ Waiting ${opts.retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
        }
      } finally {
        // Clean up on final attempt or if successful
        if (attempt === opts.attempts || !lastError) {
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

    // All attempts failed
    console.log(`💥 All ${opts.attempts} attempts failed`);
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
        attempts: testInfo.retry < opts.attempts ? opts.attempts : 1,
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