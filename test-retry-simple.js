#!/usr/bin/env node

/**
 * Simple test of retry logic without browser dependencies
 * Tests the core retry semantics independently
 */

// Simplified retry implementation for testing
class SimpleRetryHelper {
  static async withRetry(testFn, options = {}) {
    const opts = {
      attempts: 3,
      retryDelay: 1000,
      resetDataBetweenRetries: true,
      reinitializeBrowser: true,
      ...options
    };

    let lastError;
    let callCount = 0;

    // Validate attempts (must be >= 2 to have any effect, following NUnit behavior)
    if (opts.attempts < 2) {
      console.log(`⚠️ Retry attempts set to ${opts.attempts}, but minimum is 2 for retries to work (NUnit behavior)`);
      
      try {
        callCount++;
        return await testFn();
      } catch (error) {
        throw error;
      }
    }

    for (let attempt = 1; attempt <= opts.attempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${opts.attempts}`);
        
        callCount++;
        const result = await testFn();
        
        console.log(`✅ Test passed on attempt ${attempt}`);
        return result;

      } catch (error) {
        lastError = error;
        console.log(`❌ Attempt ${attempt} failed:`, error.message);

        // Check if this is an assertion failure (retryable) vs unexpected exception (not retryable)
        const isAssertionFailure = error && (
          error.name === 'AssertionError' ||
          error.message.includes('expect') ||
          error.message.includes('assertion') ||
          error.message.includes('toBe') ||
          error.message.includes('toEqual') ||
          error.message.includes('toContain')
        );
        
        // Additional check: if it's explicitly a TypeError, SyntaxError, ReferenceError, etc., it's not an assertion
        const isUnexpectedException = error && (
          error instanceof TypeError ||
          error instanceof SyntaxError ||
          error instanceof ReferenceError ||
          error.name === 'TypeError' ||
          error.name === 'SyntaxError' ||
          error.name === 'ReferenceError'
        );

        if (!isAssertionFailure || isUnexpectedException) {
          console.log(`💥 Unexpected exception (not retryable): ${error.message}`);
          throw error; // Don't retry unexpected exceptions (NUnit behavior)
        }

        // If this is the last attempt, don't wait
        if (attempt < opts.attempts) {
          console.log(`⏳ Waiting ${opts.retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
        }
      }
    }

    // All attempts failed
    console.log(`💥 All ${opts.attempts} attempts failed`);
    throw lastError || new Error('Test failed after all retry attempts');
  }
}

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  log('\n🚀 Testing NUnit RetryAttribute Semantics (Simplified)', 'blue');
  
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: attempts=1 should not retry
  totalTests++;
  try {
    log('\n🧪 Test 1: attempts=1 should not retry', 'blue');
    
    let callCount = 0;
    
    try {
      await SimpleRetryHelper.withRetry(() => {
        callCount++;
        const error = new Error('expect(false).toBe(true)');
        throw error;
      }, {
        attempts: 1,
        retryDelay: 100
      });
    } catch (error) {
      // Expected to fail
    }
    
    assert(callCount === 1, `Expected 1 call, got ${callCount}`);
    log('✅ Test 1 passed: attempts=1 executed only once', 'green');
    passedTests++;
    
  } catch (error) {
    log(`❌ Test 1 failed: ${error.message}`, 'red');
  }

  // Test 2: Assertion failures should retry
  totalTests++;
  try {
    log('\n🧪 Test 2: Assertion failures should retry', 'blue');
    
    let callCount = 0;
    
    try {
      await SimpleRetryHelper.withRetry(() => {
        callCount++;
        const error = new Error('expect(received).toBe(expected)');
        error.name = 'AssertionError';
        throw error;
      }, {
        attempts: 3,
        retryDelay: 50
      });
    } catch (error) {
      // Expected to fail after retries
    }
    
    assert(callCount === 3, `Expected 3 calls for assertion failure, got ${callCount}`);
    log('✅ Test 2 passed: Assertion failures trigger retries', 'green');
    passedTests++;
    
  } catch (error) {
    log(`❌ Test 2 failed: ${error.message}`, 'red');
  }

  // Test 3: Unexpected exceptions should not retry
  totalTests++;
  try {
    log('\n🧪 Test 3: Unexpected exceptions should not retry', 'blue');
    
    let callCount = 0;
    
    try {
      await SimpleRetryHelper.withRetry(() => {
        callCount++;
        throw new TypeError('Unexpected network error');
      }, {
        attempts: 3,
        retryDelay: 50
      });
    } catch (error) {
      // Expected to fail immediately
    }
    
    assert(callCount === 1, `Expected 1 call for unexpected exception, got ${callCount}`);
    log('✅ Test 3 passed: Unexpected exceptions do not trigger retries', 'green');
    passedTests++;
    
  } catch (error) {
    log(`❌ Test 3 failed: ${error.message}`, 'red');
  }

  // Test 4: Different assertion patterns should retry
  totalTests++;
  try {
    log('\n🧪 Test 4: Different assertion patterns should retry', 'blue');
    
    const patterns = [
      'expect(value).toBe(expected)',
      'assertion failed',
      'toEqual comparison failed', 
      'toContain matcher error'
    ];
    
    for (const pattern of patterns) {
      let callCount = 0;
      
      try {
        await SimpleRetryHelper.withRetry(() => {
          callCount++;
          throw new Error(pattern);
        }, {
          attempts: 2,
          retryDelay: 50
        });
      } catch (error) {
        // Expected to fail
      }
      
      assert(callCount === 2, `Pattern "${pattern}": Expected 2 calls, got ${callCount}`);
      log(`  ✅ Pattern "${pattern}" triggers retries`, 'green');
    }
    
    log('✅ Test 4 passed: All assertion patterns trigger retries', 'green');
    passedTests++;
    
  } catch (error) {
    log(`❌ Test 4 failed: ${error.message}`, 'red');
  }

  // Test 5: Successful test should not retry
  totalTests++;
  try {
    log('\n🧪 Test 5: Successful test should not retry', 'blue');
    
    let callCount = 0;
    let result;
    
    result = await SimpleRetryHelper.withRetry(() => {
      callCount++;
      return 'success';
    }, {
      attempts: 3,
      retryDelay: 50
    });
    
    assert(callCount === 1, `Expected 1 call for successful test, got ${callCount}`);
    assert(result === 'success', `Expected 'success', got ${result}`);
    log('✅ Test 5 passed: Successful tests do not retry', 'green');
    passedTests++;
    
  } catch (error) {
    log(`❌ Test 5 failed: ${error.message}`, 'red');
  }

  // Test 6: Retry delay timing
  totalTests++;
  try {
    log('\n🧪 Test 6: Retry delay timing', 'blue');
    
    const startTime = Date.now();
    let callCount = 0;
    const delayMs = 100;
    
    try {
      await SimpleRetryHelper.withRetry(() => {
        callCount++;
        throw new Error('expect(false).toBe(true)');
      }, {
        attempts: 3,
        retryDelay: delayMs
      });
    } catch (error) {
      // Expected to fail
    }
    
    const totalTime = Date.now() - startTime;
    const expectedMinTime = delayMs * 2; // 2 delays between 3 attempts
    
    assert(callCount === 3, `Expected 3 calls, got ${callCount}`);
    assert(totalTime >= expectedMinTime, `Expected minimum ${expectedMinTime}ms, got ${totalTime}ms`);
    log(`✅ Test 6 passed: Retry delay timing works (${totalTime}ms total)`, 'green');
    passedTests++;
    
  } catch (error) {
    log(`❌ Test 6 failed: ${error.message}`, 'red');
  }

  // Test 7: Edge case - attempts = 0
  totalTests++;
  try {
    log('\n🧪 Test 7: attempts=0 should behave like attempts=1', 'blue');
    
    let callCount = 0;
    
    try {
      await SimpleRetryHelper.withRetry(() => {
        callCount++;
        throw new Error('expect(false).toBe(true)');
      }, {
        attempts: 0,
        retryDelay: 50
      });
    } catch (error) {
      // Expected to fail
    }
    
    assert(callCount === 1, `Expected 1 call with attempts=0, got ${callCount}`);
    log('✅ Test 7 passed: attempts=0 executes once', 'green');
    passedTests++;
    
  } catch (error) {
    log(`❌ Test 7 failed: ${error.message}`, 'red');
  }

  // Test 8: Failing then succeeding test
  totalTests++;
  try {
    log('\n🧪 Test 8: Test that fails then succeeds', 'blue');
    
    let callCount = 0;
    let result;
    
    result = await SimpleRetryHelper.withRetry(() => {
      callCount++;
      if (callCount < 3) {
        throw new Error('expect(false).toBe(true)'); // Fail first 2 attempts
      }
      return 'success'; // Succeed on 3rd attempt
    }, {
      attempts: 3,
      retryDelay: 50
    });
    
    assert(callCount === 3, `Expected 3 calls, got ${callCount}`);
    assert(result === 'success', `Expected 'success', got ${result}`);
    log('✅ Test 8 passed: Test succeeds on final retry', 'green');
    passedTests++;
    
  } catch (error) {
    log(`❌ Test 8 failed: ${error.message}`, 'red');
  }

  // Test Summary
  log('\n' + '='.repeat(60), 'blue');
  log('🎯 NUnit RetryAttribute Semantics Test Results', 'blue');
  log('='.repeat(60), 'blue');
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'green' : 'red');
  log(`Success Rate: ${successRate}%`, successRate === 100 ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! NUnit RetryAttribute semantics working correctly.', 'green');
    log('\nKey behaviors verified:', 'blue');
    log('✅ [Retry(1)] does nothing (no retries)', 'green');
    log('✅ Only assertion failures trigger retries', 'green');
    log('✅ Unexpected exceptions do not trigger retries', 'green');
    log('✅ Retry delays work correctly', 'green');
    log('✅ Successful tests do not retry', 'green');
    log('✅ Tests can succeed on retry attempts', 'green');
    return true;
  } else {
    log('\n💥 Some tests failed! Check the implementation.', 'red');
    return false;
  }
}

// Run the tests
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Test runner failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runTests, SimpleRetryHelper };