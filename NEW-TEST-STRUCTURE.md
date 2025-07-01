# New Test Structure

This document describes the updated test structure that separates API and UI testing to different endpoints.

## 🎯 **What Changed**

The testing framework now focuses on:
- **API Tests**: Continue to use the local test app server (localhost:3000)
- **UI Tests**: Now test the external Selenium Test Form (automationintesting.com)
- **Integration Tests**: Combine both API and UI testing in realistic workflows

## 📁 **New Test Files**

### 1. **UI Tests - Selenium Test Form**
**File**: `src/tests/ui/selenium-test-form.ui.test.ts`

Tests the form at https://automationintesting.com/selenium/testpage/ with:
- ✅ Form element validation (inputs, dropdowns, checkboxes, radio buttons)
- ✅ Form filling and submission
- ✅ Data validation and clearing
- ✅ Retry capability with NUnit-style retries
- ✅ Cross-browser compatibility
- ✅ Realistic user interactions (slow typing, multi-select)

### 2. **Integration Tests - API + UI Combined**
**File**: `src/tests/integration/api-ui-integration.test.ts`

Demonstrates realistic workflows combining:
- ✅ User creation via API (local test app)
- ✅ Form filling via UI (external test page)
- ✅ Data consistency validation
- ✅ Error handling scenarios
- ✅ Complete user journey workflows
- ✅ Retry functionality for both API and UI

### 3. **Page Object Model - Selenium Test Page**
**File**: `src/wrappers/ui/selenium-test-page.ts`

Complete page object for the automation testing form with:
- ✅ All form element locators
- ✅ Form interaction methods
- ✅ Data validation utilities
- ✅ Clear and submit functionality
- ✅ Element state checking
- ✅ Workflow automation methods

## 🔧 **Configuration Changes**

### Updated `playwright.config.ts`
```typescript
testMatch: [
  'src/tests/api/**/*.test.ts',                           // API tests (local server)
  'src/tests/ui/selenium-test-form.ui.test.ts',           // UI tests (external site)
  'src/tests/integration/api-ui-integration.test.ts'      // Integration tests
]
```

### New npm Scripts
```json
{
  "test:ui:selenium": "playwright test src/tests/ui/selenium-test-form.ui.test.ts",
  "test:integration": "playwright test src/tests/integration/api-ui-integration.test.ts",
  "test:all-old": "playwright test src/tests --ignore-pattern='**/selenium-test-form.ui.test.ts'"
}
```

## 🚀 **Running Tests**

### Main Test Command
```bash
npm test
```
**Runs**: API tests + New UI tests + New Integration tests

### Individual Test Suites
```bash
# API tests only (uses local server)
npm run test:api

# UI tests only (external site)
npm run test:ui:selenium

# Integration tests only
npm run test:integration

# All old tests (for comparison)
npm run test:all-old
```

## 🎭 **Test Examples**

### Basic Form Testing
```typescript
test('should fill and validate form inputs correctly', async ({ page }) => {
  const testPage = new SeleniumTestPage(page);
  await testPage.navigate();
  
  const testData = {
    firstName: 'Alice',
    surname: 'Johnson',
    gender: 'Female' as const,
    colors: ['red', 'blue'] as readonly ('red' | 'blue')[],
    contactMethod: 'email' as const,
    continents: ['Asia', 'Europe']
  };
  
  await testPage.fillTestForm(testData);
  const formData = await testPage.getFormData();
  
  expect(formData.firstName).toBe(testData.firstName);
  expect(formData.surname).toBe(testData.surname);
});
```

### API + UI Integration
```typescript
test('should create user via API and use data in UI form', async ({ page, request }) => {
  // Create user via API
  const apiWrapper = new TestApiWrapper(request);
  const newUser = await apiWrapper.createUser({
    name: 'Integration User',
    email: 'integration@example.com',
    password: 'SecurePass123!',
    username: 'intuser'
  });
  
  // Use API data in UI form
  const testPage = new SeleniumTestPage(page);
  await testPage.navigate();
  
  const [firstName, surname] = newUser.name.split(' ');
  await testPage.fillTestForm({
    firstName,
    surname: surname || 'User',
    gender: 'Male',
    colors: ['red'],
    contactMethod: 'email',
    continents: ['Europe']
  });
  
  await testPage.submitForm();
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