#!/usr/bin/env node

/**
 * Independent test script to verify retry logic without browser dependencies
 * This script tests the core NUnit RetryAttribute semantics
 */

const { RetryHelper } = require('./dist/utils/retry-helper');

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Mock page, context, browser objects for testing
const mockBrowser = { close: async () => {} };
const mockContext = { close: async () => {} };
const mockPage = { close: async () => {} };

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
  log('\n🚀 Testing NUnit RetryAttribute Semantics', 'blue');
  
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: attempts=1 should not retry
  totalTests++;
  try {
    log('\n🧪 Test 1: attempts=1 should not retry', 'blue');
    
    let callCount = 0;
    
    try {
      await RetryHelper.withRetry(async (page, context, browser) => {
        callCount++;
        const error = new Error('expect(false).toBe(true)');
        throw error;
      }, {
        attempts: 1,
        retryDelay: 100,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
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
      await RetryHelper.withRetry(async (page, context, browser) => {
        callCount++;
        const error = new Error('expect(received).toBe(expected)');
        error.name = 'AssertionError';
        throw error;
      }, {
        attempts: 3,
        retryDelay: 50,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
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
      await RetryHelper.withRetry(async (page, context, browser) => {
        callCount++;
        throw new TypeError('Unexpected network error');
      }, {
        attempts: 3,
        retryDelay: 50,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
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
        await RetryHelper.withRetry(async (page, context, browser) => {
          callCount++;
          throw new Error(pattern);
        }, {
          attempts: 2,
          retryDelay: 50,
          resetDataBetweenRetries: false,
          reinitializeBrowser: false
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
    
    result = await RetryHelper.withRetry(async (page, context, browser) => {
      callCount++;
      return 'success';
    }, {
      attempts: 3,
      retryDelay: 50,
      resetDataBetweenRetries: false,
      reinitializeBrowser: false
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
      await RetryHelper.withRetry(async (page, context, browser) => {
        callCount++;
        throw new Error('expect(false).toBe(true)');
      }, {
        attempts: 3,
        retryDelay: delayMs,
        resetDataBetweenRetries: false,
        reinitializeBrowser: false
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

module.exports = { runTests };