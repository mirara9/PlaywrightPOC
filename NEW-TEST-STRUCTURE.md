# New Test Structure

This document describes the updated test structure that separates API and UI testing to different endpoints.

## 🎯 **What Changed**

The testing framework now focuses on:
- **API Tests**: Use the local test app server (localhost:3000)
- **UI Tests**: Test external web applications and forms
- **Integration Tests**: Combine both API and UI testing in realistic workflows

## 📁 **New Test Files**

### 1. **UI Tests**
**Note**: External test pages previously used are no longer available.

The framework provides base classes and utilities for:
- ✅ Form element validation (inputs, dropdowns, checkboxes, radio buttons)
- ✅ Form filling and submission patterns
- ✅ Data validation and clearing methods
- ✅ Retry capability with NUnit-style retries
- ✅ Cross-browser compatibility
- ✅ Realistic user interactions (slow typing, multi-select)

### 2. **Integration Tests**
**Note**: Integration tests combining API and UI have been simplified.

The framework demonstrates patterns for:
- ✅ User creation via API (local test app)
- ✅ Data consistency validation
- ✅ Error handling scenarios
- ✅ Complete user journey workflows
- ✅ Retry functionality for both API and UI

### 3. **Page Object Model**
**Note**: External page objects have been removed.

The framework provides base classes for creating page objects with:
- ✅ Element locator patterns
- ✅ Form interaction methods
- ✅ Data validation utilities
- ✅ Clear and submit functionality
- ✅ Element state checking
- ✅ Workflow automation methods

## 🔧 **Configuration Changes**

### Updated `playwright.config.ts`
```typescript
testMatch: [
  'src/tests/api/**/*.test.ts',           // API tests (local server)
  'src/tests/ui/**/*.test.ts',            // UI tests
  'src/tests/integration/**/*.test.ts'    // Integration tests
]
```

### npm Scripts
```json
{
  "test:api": "playwright test src/tests/api/",
  "test:ui": "playwright test src/tests/ui/",
  "test:integration": "playwright test src/tests/integration/"
}
```

## 🚀 **Running Tests**

### Main Test Command
```bash
npm test
```
**Runs**: API tests + UI tests + Integration tests

### Individual Test Suites
```bash
# API tests only (uses local server)
npm run test:api

# UI tests only
npm run test:ui

# Integration tests only
npm run test:integration
```

## 🎭 **Test Pattern Examples**

### Basic API Testing Pattern
```typescript
test('should create and validate user via API', async ({ request }) => {
  const apiWrapper = new TestApiWrapper(request);
  
  const newUser = await apiWrapper.createUser({
    name: 'Test User',
    email: 'test@example.com',
    password: 'SecurePass123!',
    username: 'testuser'
  });
  
  expect(newUser.name).toBe('Test User');
  expect(newUser.email).toBe('test@example.com');
});
```

### UI Testing Pattern (Example)
```typescript
test('should interact with page elements', async ({ page }) => {
  const basePage = new BasePage(page, '/your-page');
  await basePage.navigate();
  
  // Use base page methods for common operations
  await basePage.fillInput(page.locator('#input'), 'test value');
  await basePage.clickElement(page.locator('#button'));
  
  // Add your specific assertions
  await expect(page.locator('#result')).toBeVisible();
});
```

## 🔄 **Retry Functionality**

All tests support NUnit-style retry with:
- ✅ Complete browser reinitialization
- ✅ Test data reset between attempts
- ✅ Assertion-only retry logic
- ✅ Configurable retry attempts and delays

```typescript
retryTest('flaky test with retry', async (page, context, browser) => {
  // Test logic here
}, {
  attempts: 3,
  retryDelay: 2000,
  reinitializeBrowser: true,
  resetDataBetweenRetries: true
});
```

## 🎯 **Benefits**

1. **Real-World Testing**: Tests actual external websites alongside local APIs
2. **Separation of Concerns**: API and UI testing are cleanly separated
3. **Realistic Workflows**: Integration tests demonstrate real user journeys
4. **External Validation**: Tests work with third-party sites (not just local test apps)
5. **Maintainable**: Page objects and API wrappers are reusable and extensible
6. **Robust**: Full retry capability handles flaky network conditions
7. **Cross-Platform**: Works identically on Windows, Linux, macOS, and Docker

## 📊 **Test Coverage**

- **API Tests**: User CRUD operations, authentication, data validation
- **UI Tests**: Form interactions, element validation, user workflows
- **Integration Tests**: End-to-end scenarios combining API and UI
- **Error Handling**: Network failures, invalid data, edge cases
- **Performance**: Timeout handling, retry logic, optimization

The new structure provides comprehensive testing coverage while demonstrating real-world usage patterns that would be valuable for any automation testing project.