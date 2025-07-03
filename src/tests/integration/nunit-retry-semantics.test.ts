import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';
import { retryTest, RetryHelper } from '../../utils';

/**
 * NUnit RetryAttribute Semantics Tests
 * These tests demonstrate the exact behavior of NUnit's RetryAttribute
 */

test.describe('NUnit RetryAttribute Semantics', () => {
  
  // Example 1: Retry(1) does nothing (NUnit behavior)
  retryTest('should not retry with attempts=1 (NUnit behavior)', async (page: Page, context: BrowserContext, browser: Browser) => {
    console.log('🧪 Testing NUnit [Retry(1)] behavior - should not retry');
    
    let attemptCount = 0;
    
    await page.goto('/');
    
    // This should fail on first attempt and NOT retry
    await page.evaluate(() => {
      // Use a global counter to track attempts
      if (!(window as any)._attemptCount) {
        (window as any)._attemptCount = 0;
      }
      (window as any)._attemptCount++;
      
      // Always fail to demonstrate no retry happens
      throw new Error(`Attempt ${(window as any)._attemptCount}: This always fails`);
    });
    
  }, {
    attempts: 1, // This should do nothing, just like NUnit [Retry(1)]
    retryDelay: 1000,
    resetDataBetweenRetries: false,
    reinitializeBrowser: false
  });

  // Example 2: Only assertion failures should trigger retries
  test('should only retry assertion failures, not unexpected exceptions', async ({ browser }) => {
    console.log('🧪 Testing assertion failure vs unexpected exception');
    
    let assertionFailureAttempts = 0;
    let unexpectedExceptionAttempts = 0;
    
    // Test 1: Assertion failure (should retry)
    try {
      await RetryHelper.withRetry(async (page: Page, context: BrowserContext, browser: Browser) => {
        assertionFailureAttempts++;
        console.log(`Assertion failure attempt: ${assertionFailureAttempts}`);
        
        await page.goto('/');
        
        // This should trigger retries because it's an assertion failure
        expect(false).toBe(true); // AssertionError
        
      }, {
        attempts: 3,
        retryDelay: 500,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
      });
    } catch (error) {
      console.log(`✅ Assertion failure attempted ${assertionFailureAttempts} times (expected: 3)`);
      expect(assertionFailureAttempts).toBe(3);
    }
    
    // Test 2: Unexpected exception (should NOT retry)
    try {
      await RetryHelper.withRetry(async (page: Page, context: BrowserContext, browser: Browser) => {
        unexpectedExceptionAttempts++;
        console.log(`Unexpected exception attempt: ${unexpectedExceptionAttempts}`);
        
        await page.goto('/');
        
        // This should NOT trigger retries because it's an unexpected exception
        throw new TypeError('This is an unexpected exception, not an assertion failure');
        
      }, {
        attempts: 3,
        retryDelay: 500,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
      });
    } catch (error) {
      console.log(`✅ Unexpected exception attempted ${unexpectedExceptionAttempts} times (expected: 1)`);
      expect(unexpectedExceptionAttempts).toBe(1);
    }
  });

  // Example 3: Demonstrate different assertion types that should retry
  retryTest('should retry different types of assertion failures', async (page: Page, context: BrowserContext, browser: Browser) => {
    console.log('🧪 Testing different assertion types that should trigger retries');
    
    await page.goto('/');
    
    // Simulate a test that fails first few attempts but eventually passes
    const attempts = await page.evaluate(() => {
      if (!(window as any)._testAttempts) {
        (window as any)._testAttempts = 0;
      }
      (window as any)._testAttempts++;
      return (window as any)._testAttempts;
    });
    
    console.log(`Current attempt: ${attempts}`);
    
    // Pass on the 3rd attempt (to demonstrate retries work)
    if (attempts < 3) {
      // This should trigger retry (assertion failure)
      expect(attempts).toBeGreaterThan(5); // Will fail first 2 attempts
    } else {
      // This should pass on 3rd attempt
      expect(attempts).toBe(3);
    }
    
  }, {
    attempts: 3,
    retryDelay: 500,
    resetDataBetweenRetries: false,
    reinitializeBrowser: true // Browser reinitialization should reset window._testAttempts
  });

  // Example 4: Browser reinitialization between retries
  retryTest('should reinitialize browser between retry attempts', async (page: Page, context: BrowserContext, browser: Browser) => {
    console.log('🧪 Testing browser reinitialization between retries');
    
    await page.goto('/');
    
    // Set a value in browser storage
    await page.evaluate(() => {
      localStorage.setItem('retry-test', 'attempt-marker');
    });
    
    // Check if storage was cleared (indicating browser reinitialization)
    const storageValue = await page.evaluate(() => {
      return localStorage.getItem('retry-test');
    });
    
    console.log(`Storage value: ${storageValue}`);
    
    // On first attempt, storage should be set, on retries it should be cleared
    const attemptCount = await page.evaluate(() => {
      if (!(window as any)._browserReinitTest) {
        (window as any)._browserReinitTest = 0;
      }
      (window as any)._browserReinitTest++;
      return (window as any)._browserReinitTest;
    });
    
    console.log(`Browser reinit test attempt: ${attemptCount}`);
    
    if (attemptCount < 2) {
      // Fail first attempt to trigger retry
      expect(attemptCount).toBeGreaterThan(5);
    } else {
      // Should pass on second attempt with fresh browser
      expect(attemptCount).toBe(1); // Should be 1 due to browser reinitialization
    }
    
  }, {
    attempts: 2,
    retryDelay: 1000,
    resetDataBetweenRetries: true,
    reinitializeBrowser: true
  });

  // Example 5: Demonstrate minimum attempts validation
  test('should handle attempts < 2 correctly (NUnit behavior)', async ({ browser }) => {
    console.log('🧪 Testing attempts < 2 validation');
    
    let actualAttempts = 0;
    
    try {
      await RetryHelper.withRetry(async (page: Page, context: BrowserContext, browser: Browser) => {
        actualAttempts++;
        console.log(`Attempt ${actualAttempts} with attempts=1`);
        
        await page.goto('/');
        
        // Always fail
        expect(false).toBe(true);
        
      }, {
        attempts: 1, // Should be treated as no-retry scenario
        retryDelay: 500,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
      });
    } catch (error) {
      console.log(`✅ With attempts=1, actual attempts: ${actualAttempts} (expected: 1)`);
      expect(actualAttempts).toBe(1);
    }
    
    // Test with attempts=0 (should default to minimum behavior)
    actualAttempts = 0;
    try {
      await RetryHelper.withRetry(async (page: Page, context: BrowserContext, browser: Browser) => {
        actualAttempts++;
        console.log(`Attempt ${actualAttempts} with attempts=0`);
        
        await page.goto('/');
        
        // Always fail
        expect(false).toBe(true);
        
      }, {
        attempts: 0, // Should be handled gracefully
        retryDelay: 500,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
      });
    } catch (error) {
      console.log(`✅ With attempts=0, actual attempts: ${actualAttempts} (expected: 1)`);
      expect(actualAttempts).toBe(1);
    }
  });

  // Example 6: Test exact NUnit retry pattern
  retryTest('should follow exact NUnit retry pattern (3 attempts = 1 initial + 2 retries)', async (page: Page, context: BrowserContext, browser: Browser) => {
    console.log('🧪 Testing exact NUnit retry pattern');
    
    await page.goto('/');
    
    const attemptNumber = await page.evaluate(() => {
      if (!(window as any)._nunitPatternTest) {
        (window as any)._nunitPatternTest = 0;
      }
      (window as any)._nunitPatternTest++;
      return (window as any)._nunitPatternTest;
    });
    
    console.log(`NUnit pattern test - attempt ${attemptNumber}/3`);
    
    if (attemptNumber <= 2) {
      // Fail first 2 attempts (initial + 1 retry)
      expect(attemptNumber).toBeGreaterThan(10);
    } else {
      // Pass on 3rd attempt (initial + 2 retries)
      expect(attemptNumber).toBe(1); // Should be 1 due to browser reinitialization
    }
    
  }, {
    attempts: 3, // NUnit [Retry(3)] = 1 initial attempt + 2 retries = 3 total attempts
    retryDelay: 1000,
    resetDataBetweenRetries: true,
    reinitializeBrowser: true
  });
});