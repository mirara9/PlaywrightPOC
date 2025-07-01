# Playwright Test Framework

An extensible Playwright test framework with reusable API and UI wrappers, designed to be easily extensible for multiple test projects.

## Features

- **Extensible API Wrapper**: Base classes for creating API test wrappers with built-in retry logic, response validation, and error handling
- **Extensible UI Wrapper**: Base page objects and components for UI testing with common operations and assertions
- **TypeScript Support**: Full TypeScript support with proper typing and IntelliSense
- **Modular Architecture**: Separated concerns with clear separation between API wrappers, UI wrappers, and test utilities
- **Test Data Management**: Centralized test data generation and management
- **Utility Functions**: Common test helpers for screenshots, network mocking, and more

## Project Structure

```
playwright-test-framework/
├── src/
│   ├── wrappers/
│   │   ├── api/
│   │   │   ├── base-api.ts          # Base API wrapper class
│   │   │   ├── example-api.ts       # Example API implementation
│   │   │   └── index.ts             # API exports
│   │   └── ui/
│   │       ├── components/
│   │       │   └── base-component.ts # Base UI component class
│   │       ├── base-page.ts         # Base page object class
│   │       ├── example-page.ts      # Example page implementations
│   │       └── index.ts             # UI exports
│   ├── utils/
│   │   ├── test-data.ts            # Test data management
│   │   ├── test-helpers.ts         # Utility functions
│   │   └── index.ts                # Utils exports
│   ├── tests/
│   │   ├── api/                    # API tests
│   │   ├── ui/                     # UI tests
│   │   └── integration/            # Integration tests
│   └── index.ts                    # Main exports
├── config/                         # Configuration files
├── playwright.config.ts            # Playwright configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies and scripts
```

## Installation

1. Clone or copy this framework to your project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## Usage

### Creating API Wrappers

Extend the `BaseApiWrapper` class to create your API wrappers:

```typescript
import { APIRequestContext } from '@playwright/test';
import { BaseApiWrapper, ApiConfig } from './base-api';

export class MyApiWrapper extends BaseApiWrapper {
  constructor(request: APIRequestContext, config?: Partial<ApiConfig>) {
    const defaultConfig: ApiConfig = {
      baseURL: 'https://api.example.com',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
      retries: 3,
    };
    
    super(request, { ...defaultConfig, ...config });
  }

  async getResource(id: number): Promise<any> {
    const response = await this.get(`/resource/${id}`);
    await this.expectStatus(response, 200);
    return await this.expectJson(response);
  }
}
```

### Creating UI Page Objects

Extend the `BasePage` class to create your page objects:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage, PageConfig } from './base-page';

export class MyPage extends BasePage {
  private readonly submitButton: Locator;
  private readonly inputField: Locator;

  constructor(page: Page, config?: PageConfig) {
    super(page, '/my-page', config);
    
    this.submitButton = page.locator('[data-testid="submit"]');
    this.inputField = page.locator('[data-testid="input"]');
  }

  async submitForm(value: string): Promise<void> {
    await this.fillInput(this.inputField, value);
    await this.clickElement(this.submitButton);
  }
}
```

### Writing Tests

Use the wrappers in your tests:

```typescript
import { test, expect } from '@playwright/test';
import { MyApiWrapper, MyPage } from '../wrappers';

test.describe('My Tests', () => {
  test('should test API and UI together', async ({ page, request }) => {
    const apiWrapper = new MyApiWrapper(request);
    const myPage = new MyPage(page);
    
    // Test API
    const data = await apiWrapper.getResource(1);
    expect(data).toBeDefined();
    
    // Test UI
    await myPage.navigate();
    await myPage.submitForm('test data');
  });
});
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Types
```bash
npm run test:api          # Run API tests only
npm run test:ui           # Run UI tests only
npm run test:integration  # Run integration tests only
```

### Other Commands
```bash
npm run test:headed       # Run tests in headed mode
npm run test:debug        # Run tests in debug mode
npm run test:ui          # Run tests with UI mode
npm run test:report      # Show test report
```

## Configuration

### Playwright Configuration

Edit `playwright.config.ts` to customize:
- Test directory
- Browser configurations
- Base URL
- Timeouts
- Reporters

### Environment Variables

Set environment variables for different environments:
- `BASE_URL`: Base URL for UI tests
- `API_URL`: Base URL for API tests
- `TEST_ENV`: Environment (dev, staging, prod)

### Test Data

Customize test data in `src/utils/test-data.ts`:
- User credentials
- Environment configurations
- Test data generators

## Extensibility

This framework is designed to be easily extensible:

1. **New API Wrappers**: Create new classes extending `BaseApiWrapper`
2. **New Page Objects**: Create new classes extending `BasePage`
3. **New Components**: Create new classes extending `BaseComponent`
4. **Custom Utilities**: Add new utility functions to `src/utils/`
5. **Test Data**: Extend `TestDataManager` for custom test data

## Best Practices

1. **Page Object Pattern**: Use page objects for UI interactions
2. **API Wrapper Pattern**: Use API wrappers for API interactions
3. **Data-Driven Testing**: Use test data management for consistent test data
4. **Separation of Concerns**: Keep API, UI, and test logic separate
5. **Reusability**: Create reusable components and utilities
6. **Error Handling**: Use built-in retry logic and error handling
7. **Assertions**: Use built-in expectation methods for better error messages

## Contributing

1. Follow the existing code structure
2. Add tests for new functionality
3. Update documentation
4. Follow TypeScript best practices
5. Use meaningful commit messages

## License

MIT License - see LICENSE file for details