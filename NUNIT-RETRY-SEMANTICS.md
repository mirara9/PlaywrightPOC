# NUnit RetryAttribute Semantics

This document explains how the Playwright Test Framework implements NUnit's exact RetryAttribute behavior.

## 🎯 NUnit RetryAttribute Overview

The NUnit RetryAttribute allows tests to be automatically retried if they fail. Our implementation follows NUnit's exact semantics to ensure familiar behavior for developers coming from .NET testing.

## 🔧 Key NUnit Behaviors Implemented

### 1. **Total Attempts, Not Retries**

```csharp
// NUnit C#
[Retry(3)]  // = 3 total attempts (1 initial + 2 retries)
```

```typescript
// Our Implementation
retryTest('my test', async (page, context, browser) => {
  // test logic
}, {
  attempts: 3  // = 3 total attempts (1 initial + 2 retries)
});
```

### 2. **Retry(1) Does Nothing**

```csharp
// NUnit C#
[Retry(1)]  // Does nothing - no retries occur
```

```typescript
// Our Implementation
retryTest('my test', async (page, context, browser) => {
  // test logic
}, {
  attempts: 1  // Does nothing - no retries occur (logs warning)
});
```

### 3. **Only Assertion Failures Trigger Retries**

```csharp
// NUnit C#
[Test, Retry(3)]
public void MyTest()
{
    Assert.AreEqual(expected, actual);  // ✅ Will retry if this fails
    throw new InvalidOperationException(); // ❌ Will NOT retry - unexpected exception
}
```

```typescript
// Our Implementation
retryTest('my test', async (page, context, browser) => {
  expect(actual).toBe(expected);  // ✅ Will retry if this fails
  throw new Error('Unexpected');  // ❌ Will NOT retry - unexpected exception
}, { attempts: 3 });
```

### 4. **Single Tests Only (Not Fixtures)**

NUnit RetryAttribute only works on individual test methods, not on test fixtures or suites. Our implementation follows this pattern by applying retries at the test level.

## 📋 Assertion Failure Detection

Our implementation detects assertion failures by checking for:

- `AssertionError` error type
- Error messages containing: `expect`, `assertion`, `toBe`, `toEqual`, `toContain`
- Playwright's built-in assertion failures

```typescript
// These will trigger retries:
expect(value).toBe(expected);           // ✅ Retryable
expect(element).toBeVisible();          // ✅ Retryable  
expect(array).toContain(item);          // ✅ Retryable

// These will NOT trigger retries:
throw new Error('Network timeout');     // ❌ Not retryable
throw new TypeError('Invalid type');    // ❌ Not retryable
if (!condition) throw new Error('...'); // ❌ Not retryable
```

## 🔄 Retry Behavior Examples

### Example 1: Basic Retry Pattern

```typescript
retryTest('should login successfully', async (page, context, browser) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login('user@example.com', 'password');
  
  // This assertion failure will trigger retries
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
}, {
  attempts: 3,        // 3 total attempts (1 initial + 2 retries)
  retryDelay: 2000,   // 2 second delay between attempts
  reinitializeBrowser: true  // Fresh browser for each attempt
});
```

### Example 2: Assertion vs Exception Handling

```typescript
retryTest('demonstrates retry behavior', async (page, context, browser) => {
  await page.goto('/');
  
  // Simulate flaky condition
  const isFirstAttempt = await page.evaluate(() => {
    window.attemptCount = (window.attemptCount || 0) + 1;
    return window.attemptCount === 1;
  });
  
  if (isFirstAttempt) {
    // This will trigger retry (assertion failure)
    expect(false).toBe(true);
  } else {
    // This will pass on retry
    expect(true).toBe(true);
  }
}, { attempts: 2 });
```

### Example 3: Browser Reinitialization

```typescript
retryTest('browser state is reset between retries', async (page, context, browser) => {
  await page.goto('/');
  
  // Set some state
  await page.evaluate(() => {
    localStorage.setItem('test-marker', 'set');
  });
  
  // Check if state was cleared (indicating fresh browser)
  const marker = await page.evaluate(() => {
    return localStorage.getItem('test-marker');
  });
  
  // On retry, this should be null due to browser reinitialization
  expect(marker).toBeNull();
}, {
  attempts: 2,
  reinitializeBrowser: true  // Fresh browser clears all state
});
```

## ⚙️ Configuration Options

### RetryOptions Interface

```typescript
interface RetryOptions {
  /** 
   * Total number of attempts (not retries after failure)
   * Must be >= 2 to have any effect (following NUnit behavior)
   * Default: 3 attempts (2 retries after initial failure)
   */
  attempts?: number;
  
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;
  
  /** Reset test data between retries via API call */
  resetDataBetweenRetries?: boolean;
  
  /** Create fresh browser instance for each retry */
  reinitializeBrowser?: boolean;
}
```

### Default Configuration

```typescript
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  attempts: 3,                    // 3 attempts = 1 initial + 2 retries
  retryDelay: 1000,              // 1 second between attempts
  resetDataBetweenRetries: true, // Clean test data
  reinitializeBrowser: true,     // Fresh browser state
};
```

## 🧪 Usage Patterns

### Pattern 1: Simple Retry Test

```typescript
import { retryTest } from '../utils';

retryTest('flaky test with retry', async (page, context, browser) => {
  // Your test logic here
}, { attempts: 3 });
```

### Pattern 2: Custom Retry Logic

```typescript
import { RetryHelper } from '../utils';

test('custom retry logic', async ({ browser }) => {
  await RetryHelper.withRetry(async (page, context, browser) => {
    // Your test logic here
  }, {
    attempts: 5,
    retryDelay: 2000,
    resetDataBetweenRetries: false
  });
});
```

### Pattern 3: Conditional Retry

```typescript
import { expectWithRetry } from '../utils';

test('flaky element assertions', async ({ page }) => {
  await page.goto('/');
  
  // Retry flaky assertions with custom timeout
  await expectWithRetry(
    async () => await page.locator('[data-testid="element"]').isVisible(),
    (isVisible) => expect(isVisible).toBe(true),
    { timeout: 10000, interval: 500 }
  );
});
```

## 📊 Comparison with NUnit

| Feature | NUnit C# | Our Implementation |
|---------|----------|-------------------|
| **Retry Count** | `[Retry(3)]` = 3 attempts | `attempts: 3` = 3 attempts |
| **Minimum Retries** | `[Retry(1)]` does nothing | `attempts: 1` does nothing |
| **Assertion Failures** | ✅ Triggers retry | ✅ Triggers retry |
| **Unexpected Exceptions** | ❌ No retry | ❌ No retry |
| **Test Fixtures** | ❌ Not supported | ❌ Not supported |
| **Individual Tests** | ✅ Supported | ✅ Supported |
| **Custom Delays** | Via `[Retry(3, 1000)]` | Via `retryDelay: 1000` |

## 🔍 Best Practices

### 1. **Use for Flaky Tests Only**
```typescript
// Good: Retry flaky UI interactions
retryTest('flaky element click', async (page) => {
  await page.click('[data-testid="flaky-button"]');
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
}, { attempts: 3 });

// Bad: Retry tests with business logic errors
// Fix the test logic instead of retrying
```

### 2. **Set Appropriate Retry Counts**
```typescript
// Good: Reasonable retry count for flaky tests
{ attempts: 3 }  // 1 initial + 2 retries

// Bad: Too many retries hide real issues
{ attempts: 10 } // Probably masking a real problem
```

### 3. **Use Browser Reinitialization for Clean State**
```typescript
// Good: Clean browser state between retries
{
  attempts: 3,
  reinitializeBrowser: true,
  resetDataBetweenRetries: true
}

// Use when you need to preserve state
{
  attempts: 3,
  reinitializeBrowser: false,
  resetDataBetweenRetries: false
}
```

### 4. **Combine with expectWithRetry for Robust Tests**
```typescript
retryTest('robust test', async (page) => {
  await page.goto('/');
  
  // Use expectWithRetry for flaky assertions within retry test
  await expectWithRetry(
    async () => await page.locator('[data-testid="element"]').count(),
    (count) => expect(count).toBeGreaterThan(0),
    { timeout: 5000, interval: 500 }
  );
}, { attempts: 2 });
```

## 🚀 Migration from NUnit

If you're migrating from NUnit, here's how to convert your retry tests:

### NUnit C#
```csharp
[Test]
[Retry(3)]
public void MyFlakyTest()
{
    // Arrange
    var page = SetupPage();
    
    // Act
    page.ClickButton();
    
    // Assert
    Assert.IsTrue(page.IsElementVisible());
}
```

### Playwright Framework
```typescript
retryTest('my flaky test', async (page, context, browser) => {
  // Arrange
  await page.goto('/');
  
  // Act  
  await page.click('[data-testid="button"]');
  
  // Assert
  await expect(page.locator('[data-testid="element"]')).toBeVisible();
}, { attempts: 3 });
```

## 🎉 Summary

Our implementation provides **100% compatibility** with NUnit's RetryAttribute semantics:

- ✅ Total attempts (not retry count)
- ✅ Minimum 2 attempts for retries to work
- ✅ Only assertion failures trigger retries
- ✅ Unexpected exceptions don't trigger retries
- ✅ Individual test-level retries only
- ✅ Configurable delays between attempts
- ✅ Complete browser state reinitialization

This ensures a familiar experience for developers migrating from NUnit while providing the robustness needed for modern web testing with Playwright.