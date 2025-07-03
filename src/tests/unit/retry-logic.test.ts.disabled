import { test, expect } from '@playwright/test';
import { RetryHelper } from '../../utils';

/**
 * Unit tests for retry logic without browser dependencies
 * These tests verify the NUnit RetryAttribute semantics
 */

test.describe('Retry Logic Unit Tests', () => {
  
  test('should validate attempts parameter correctly', async () => {
    console.log('🧪 Testing attempts parameter validation');
    
    let callCount = 0;
    
    // Test with attempts = 1 (should not retry)
    try {
      await RetryHelper.withRetry(async (page, context, browser) => {
        callCount++;
        throw new Error('Always fails');
      }, {
        attempts: 1,
        retryDelay: 100,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
      });
    } catch (error) {
      // Expected to fail
    }
    
    console.log(`✅ With attempts=1, function called ${callCount} times (expected: 1)`);
    expect(callCount).toBe(1);
  });

  test('should distinguish assertion failures from unexpected exceptions', async () => {
    console.log('🧪 Testing assertion vs exception handling');
    
    // Mock function that simulates different error types
    const createMockTestFunction = (errorType: 'assertion' | 'unexpected') => {
      let callCount = 0;
      return async () => {
        callCount++;
        if (errorType === 'assertion') {
          // Simulate assertion failure
          const error = new Error('expect(received).toBe(expected)');
          error.name = 'AssertionError';
          throw error;
        } else {
          // Simulate unexpected exception
          throw new TypeError('Unexpected network error');
        }
      };
    };

    let assertionCallCount = 0;
    let unexpectedCallCount = 0;

    // Test assertion failure (should retry)
    const assertionTest = createMockTestFunction('assertion');
    try {
      await RetryHelper.withRetry(async (page, context, browser) => {
        assertionCallCount++;
        await assertionTest();
      }, {
        attempts: 3,
        retryDelay: 100,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
      });
    } catch (error) {
      // Expected to fail after retries
    }

    // Test unexpected exception (should not retry)  
    const unexpectedTest = createMockTestFunction('unexpected');
    try {
      await RetryHelper.withRetry(async (page, context, browser) => {
        unexpectedCallCount++;
        await unexpectedTest();
      }, {
        attempts: 3,
        retryDelay: 100,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
      });
    } catch (error) {
      // Expected to fail immediately
    }

    console.log(`✅ Assertion failure: ${assertionCallCount} calls (expected: 3)`);
    console.log(`✅ Unexpected exception: ${unexpectedCallCount} calls (expected: 1)`);
    
    expect(assertionCallCount).toBe(3); // Should retry assertion failures
    expect(unexpectedCallCount).toBe(1); // Should not retry unexpected exceptions
  });

  test('should handle different assertion error patterns', async () => {
    console.log('🧪 Testing different assertion error patterns');
    
    const assertionPatterns = [
      'expect(received).toBe(expected)',
      'assertion failed: values are not equal',
      'toEqual matcher failed',
      'toContain assertion error'
    ];

    for (const pattern of assertionPatterns) {
      let callCount = 0;
      
      try {
        await RetryHelper.withRetry(async (page, context, browser) => {
          callCount++;
          const error = new Error(pattern);
          throw error;
        }, {
          attempts: 2,
          retryDelay: 50,
          resetDataBetweenRetries: false,
          reinitializeBrowser: false
        });
      } catch (error) {
        // Expected to fail
      }
      
      console.log(`✅ Pattern "${pattern}": ${callCount} calls (expected: 2)`);
      expect(callCount).toBe(2);
    }
  });

  test('should respect retry delay timing', async () => {
    console.log('🧪 Testing retry delay timing');
    
    const startTime = Date.now();
    let callCount = 0;
    const expectedDelay = 200; // 200ms delay
    
    try {
      await RetryHelper.withRetry(async (page, context, browser) => {
        callCount++;
        expect(false).toBe(true); // Always fails
      }, {
        attempts: 3,
        retryDelay: expectedDelay,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
      });
    } catch (error) {
      // Expected to fail
    }
    
    const totalTime = Date.now() - startTime;
    const expectedMinTime = expectedDelay * 2; // 2 delays between 3 attempts
    
    console.log(`✅ Total time: ${totalTime}ms, expected minimum: ${expectedMinTime}ms`);
    console.log(`✅ Call count: ${callCount} (expected: 3)`);
    
    expect(callCount).toBe(3);
    expect(totalTime).toBeGreaterThanOrEqual(expectedMinTime);
  });

  test('should handle edge cases correctly', async () => {
    console.log('🧪 Testing edge cases');
    
    // Test with attempts = 0
    let callCount = 0;
    try {
      await RetryHelper.withRetry(async (page, context, browser) => {
        callCount++;
        expect(false).toBe(true);
      }, {
        attempts: 0,
        retryDelay: 100,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
      });
    } catch (error) {
      // Expected to fail
    }
    
    console.log(`✅ With attempts=0: ${callCount} calls (expected: 1)`);
    expect(callCount).toBe(1);
    
    // Test successful case (no retries needed)
    callCount = 0;
    let result;
    try {
      result = await RetryHelper.withRetry(async (page, context, browser) => {
        callCount++;
        return 'success';
      }, {
        attempts: 3,
        retryDelay: 100,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
      });
    } catch (error) {
      // Should not fail
    }
    
    console.log(`✅ Successful case: ${callCount} calls (expected: 1)`);
    console.log(`✅ Result: ${result} (expected: 'success')`);
    
    expect(callCount).toBe(1);
    expect(result).toBe('success');
  });
});