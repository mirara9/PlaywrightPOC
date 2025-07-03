# Playwright Test Framework

An extensible Playwright test framework with reusable API and UI wrappers, designed to be easily extensible for multiple test projects.

## Features

- **🌍 Cross-Platform Compatible**: Works seamlessly on Windows, Linux, macOS, and WSL
- **🔄 NUnit-Style Auto-Retry**: Complete RetryAttribute compatibility with assertion-only retries and browser reinitialization
- **🚀 Automatic Setup**: Zero-configuration setup with automatic dependency management
- **📦 Extensible API Wrapper**: Base classes for creating API test wrappers with built-in retry logic, response validation, and error handling
- **🎭 Extensible UI Wrapper**: Base page objects and components for UI testing with common operations and assertions
- **🐳 Docker Support**: Complete containerization with Docker and docker-compose
- **📝 TypeScript Support**: Full TypeScript support with proper typing and IntelliSense
- **🏗️ Modular Architecture**: Separated concerns with clear separation between API wrappers, UI wrappers, and test utilities
- **📊 Test Data Management**: Centralized test data generation and management
- **🛠️ Utility Functions**: Common test helpers for screenshots, network mocking, and more

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

## Quick Start

### 🚀 Automatic Setup (Recommended)

```bash
git clone <repository>
cd playwright-test-framework
npm install  # Automatically installs all dependencies including Playwright browsers
npm run verify  # Verify everything is working
npm test  # Run your first tests
```

**That's it!** The framework automatically handles:
- ✅ Node.js dependencies
- ✅ Playwright browser installation
- ✅ System dependencies (Linux/Ubuntu/WSL)
- ✅ Browser launch verification

### 🔧 Troubleshooting

If you encounter the "missing dependencies" error:

```bash
npm run setup:force  # Force fresh setup
# or
sudo npx playwright install-deps  # Manual dependency installation
```

For detailed setup instructions, see [SETUP.md](./SETUP.md).

### 🌍 Platform-Specific Guides
- **Windows**: See [WINDOWS-SETUP.md](./WINDOWS-SETUP.md)
- **Cross-Platform**: See [CROSS-PLATFORM.md](./CROSS-PLATFORM.md)

## Installation

1. Clone or copy this framework to your project
2. Install dependencies:
   ```bash
   npm install  # Now includes automatic Playwright setup!
   ```

   *(Browsers and system dependencies are installed automatically!)*

## Usage

### Running Tests

#### Headless Mode Configuration

You can control whether tests run with visible browser UI or in headless mode:

**Method 1: Environment Variable**
```bash
# Run tests in headless mode (no browser UI)
HEADLESS=true npm test

# Run tests with visible browser UI (default)
HEADLESS=false npm test
# or simply
npm test
```

**Method 2: Edit Configuration File**
Edit `playwright.config.ts` and change the HEADLESS_MODE constant:
```typescript
// Set to false to see browser UI, true to run headless
const HEADLESS_MODE = process.env.HEADLESS === 'true' ? true : false;

// Or force a specific mode by changing to:
const HEADLESS_MODE = false; // Always show browser UI
// or
const HEADLESS_MODE = true;  // Always run headless
```

#### Test Commands
```bash
# Run all tests (API + UI + Integration)
npm test

# Run tests in headless mode
npm run test:headless
# or
HEADLESS=true npm test

# Run specific test suites
npm run test:api              # API tests (local server)
npm run test:ui               # UI tests
npm run test:integration      # Integration tests

# Run specific test suites in headless mode
npm run test:api:headless              # API tests headless
npm run test:ui:headless               # UI tests headless
npm run test:integration:headless      # Integration tests headless

# Run tests with specific grep pattern
npm test -- --grep "form"
```

## 🎯 **Test Structure**

### **API Tests** (`npm run test:api`)
Tests the local test app server at `http://localhost:3000`:
- User CRUD operations
- Authentication workflows  
- Data validation and error handling
- Response format validation

### **UI Tests** (`npm run test:ui`)
Tests UI interactions using the base page object patterns:
- Form element interactions (inputs, dropdowns, checkboxes, radio buttons)
- Page navigation and element validation
- Cross-browser compatibility
- Realistic user workflows

### **Integration Tests** (`npm run test:integration`) 
Demonstrates patterns for combining API and UI testing:
- API and UI interaction patterns
- Data consistency validation approaches
- Error handling across multiple layers
- End-to-end workflow examples

For detailed information about the new test structure, see [NEW-TEST-STRUCTURE.md](./NEW-TEST-STRUCTURE.md).

## 🔄 NUnit-Style Retry Functionality

This framework implements **100% compatible** NUnit RetryAttribute semantics for robust test execution:

### Key Features
- ✅ **Total Attempts**: `attempts: 3` = 3 total attempts (1 initial + 2 retries)
- ✅ **Minimum Validation**: `attempts: 1` does nothing (just like NUnit's `[Retry(1)]`)
- ✅ **Assertion-Only Retries**: Only assertion failures trigger retries, not unexpected exceptions
- ✅ **Browser Reinitialization**: Fresh browser state for each retry attempt
- ✅ **Test Data Reset**: Optional data cleanup between attempts

### Quick Examples

#### Basic Retry Test
```typescript
import { retryTest } from './src/utils';

retryTest('flaky login test', async (page, context, browser) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  
  // This assertion will trigger retries if it fails
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
}, {
  attempts: 3,        // 3 total attempts (1 initial + 2 retries)
  retryDelay: 2000,   // 2 second delay between attempts
  reinitializeBrowser: true,  // Fresh browser for each attempt
  resetDataBetweenRetries: true  // Clean test data between attempts
});
```

#### Custom Retry Logic
```typescript
import { RetryHelper } from './src/utils';

test('API test with retry', async ({ browser }) => {
  await RetryHelper.withRetry(async (page, context, browser) => {
    await page.goto('/api-test');
    
    // Only assertion failures will trigger retries
    const response = await page.evaluate(() => fetch('/api/users').then(r => r.json()));
    expect(response.users).toHaveLength(5);  // ✅ Will retry if this fails
    
    // Unexpected exceptions will NOT trigger retries (NUnit behavior)
    // throw new TypeError('Network error');  // ❌ Would fail immediately
  }, {
    attempts: 5,
    retryDelay: 1000,
    reinitializeBrowser: false  // Keep same browser for API tests
  });
});
```

#### Flaky Element Assertions
```typescript
import { expectWithRetry } from './src/utils';

test('robust element testing', async ({ page }) => {
  await page.goto('/');
  
  // Retry flaky element assertions with custom timeout
  await expectWithRetry(
    async () => await page.locator('[data-testid="dynamic-content"]').isVisible(),
    (isVisible) => expect(isVisible).toBe(true),
    { timeout: 10000, interval: 500 }
  );
});
```

### NUnit Compatibility

| NUnit C# | This Framework | Behavior |
|----------|---------------|----------|
| `[Retry(3)]` | `attempts: 3` | 3 total attempts |
| `[Retry(1)]` | `attempts: 1` | Does nothing (no retries) |
| Assertion failures | ✅ | Triggers retries |
| Unexpected exceptions | ❌ | No retry (fails immediately) |

For complete documentation, see [NUNIT-RETRY-SEMANTICS.md](./NUNIT-RETRY-SEMANTICS.md).

### Testing the Retry Logic

Run the retry validation tests:
```bash
# Test retry functionality with real tests
npm run test:retry

# Test retry semantics without browser dependencies
node test-retry-simple.js
```

## Docker Setup

### Quick Start with Docker

1. **Build and setup everything:**
   ```bash
   ./build.sh
   ```

2. **Run tests in Docker:**
   ```bash
   ./docker-run.sh test
   ```

### Docker Commands

#### Setup and Build
```bash
# Build Docker image and install all dependencies
./build.sh

# Install dependencies locally AND build Docker image
./build.sh --local

# Install only local dependencies (skip Docker)
./build.sh --local --skip-docker
```

#### Running Tests
```bash
# Run all tests in headless mode
./docker-run.sh test

# Run tests with visible browser UI (requires X11 forwarding)
./docker-run.sh test --ui

# Run specific test suites
./docker-run.sh test-api           # API tests only
./docker-run.sh test-ui            # UI tests only  
./docker-run.sh test-integration   # Integration tests only

# Run tests with grep pattern
./docker-run.sh test --grep "login"
```

#### Development and Debugging
```bash
# Open bash shell in container
./docker-run.sh shell

# View test reports
./docker-run.sh report

# View container logs
./docker-run.sh logs

# Clean up containers and volumes
./docker-run.sh clean
```

#### NPM Scripts (Alternative)
```bash
# Setup scripts
npm run setup:all          # Install locally + build Docker
npm run setup:docker       # Build Docker image only
npm run setup:local        # Install locally only

# Docker test scripts
npm run docker:test         # Run all tests
npm run docker:test:api     # Run API tests
npm run docker:test:ui      # Run UI tests with visible browser
npm run docker:test:integration # Run integration tests

# Docker utility scripts
npm run docker:shell        # Open container shell
npm run docker:clean        # Clean up Docker resources
npm run docker:report       # View test reports
```

### Docker Compose (Advanced)

```bash
# Run tests in headless mode
docker-compose up

# Run tests with UI (requires X11 forwarding setup)
docker-compose --profile ui-tests up

# Development mode with file watching
docker-compose --profile development up

# Clean up
docker-compose down -v
```

### Docker Configuration

The Docker setup includes:

- **Multi-stage builds** for optimized image size
- **Pre-installed Playwright browsers** and system dependencies
- **Volume mounts** for test results, reports, and screenshots
- **Environment variable support** for headless/UI modes
- **Health checks** to ensure containers are ready
- **Network isolation** for test consistency

### X11 Forwarding for UI Tests

To run tests with visible browser UI on Linux:

```bash
# Allow X11 forwarding
xhost +local:docker

# Run UI tests
./docker-run.sh test --ui

# Restore X11 security
xhost -local:docker
```

## GitHub Actions Integration

### Automated CI/CD Pipeline

The framework includes comprehensive GitHub Actions workflows for automated testing and deployment:

#### 🔄 **Main Test Workflow** (`.github/workflows/playwright-tests.yml`)
- **Triggers**: Push to main/develop, Pull Requests, Manual dispatch
- **Jobs**: API tests, UI tests, Integration tests, Docker tests
- **Features**: Parallel execution, artifact uploads, test reports
- **Manual Control**: Choose test suite (all/api/ui/integration) and headless mode

```bash
# Workflow runs automatically on:
git push origin main
git push origin develop

# Manual trigger with options:
# 1. Go to Actions tab in GitHub
# 2. Select "Playwright Tests" workflow  
# 3. Click "Run workflow"
# 4. Choose test suite and headless mode
```

#### 🐳 **Docker Build Workflow** (`.github/workflows/docker-build.yml`)
- **Purpose**: Build and test Docker images
- **Registry**: GitHub Container Registry (ghcr.io)
- **Security**: Trivy vulnerability scanning
- **Triggers**: Push to main/develop, tags, manual dispatch

#### 📦 **Dependency Updates** (`.github/workflows/dependency-update.yml`)
- **Schedule**: Weekly on Mondays at 9 AM UTC
- **Scope**: npm packages, Playwright browsers, security fixes
- **Automation**: Creates PRs with updated dependencies
- **Safety**: Runs API tests before creating PR

#### 🚀 **Release Workflow** (`.github/workflows/release.yml`)
- **Triggers**: Git tags (v*), manual dispatch
- **Features**: Full test suite, Docker images, GitHub releases, npm publishing
- **Artifacts**: Deployment packages, changelogs, Docker images

### Workflow Status Badges

Add these badges to your fork's README:

```markdown
![Tests](https://github.com/YOUR_USERNAME/PlaywrightPOC/workflows/Playwright%20Tests/badge.svg)
![Docker](https://github.com/YOUR_USERNAME/PlaywrightPOC/workflows/Docker%20Build%20&%20Test/badge.svg)
![Release](https://github.com/YOUR_USERNAME/PlaywrightPOC/workflows/Release/badge.svg)
```

### Using in Your Projects

#### 1. **Fork Integration**
```bash
# Fork the repository
gh repo fork mirara9/PlaywrightPOC

# Clone your fork
git clone https://github.com/YOUR_USERNAME/PlaywrightPOC.git

# GitHub Actions will automatically run on your fork
```

#### 2. **Custom Configuration**
Create `.github/workflows/custom-tests.yml`:
```yaml
name: Custom Tests
on:
  push:
    branches: [ main ]
jobs:
  custom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci && cd test-app && npm ci
      - run: npx playwright install --with-deps
      - run: cd test-app && npm start &
      - run: npm test src/tests/api/
```

#### 3. **Environment Variables**
Set these in GitHub repository settings → Secrets and variables → Actions:

```bash
# Optional secrets:
NPM_TOKEN          # For npm publishing
SLACK_WEBHOOK      # For notifications
CUSTOM_API_KEY     # For external integrations
```

#### 4. **Manual Test Execution**
```bash
# Run specific test suites manually:
# 1. Go to Actions tab
# 2. Select "Playwright Tests"
# 3. Click "Run workflow"
# 4. Choose options:
#    - Test suite: all/api/ui/integration
#    - Headless mode: true/false
```

### Docker Image Usage

GitHub Actions automatically builds and publishes Docker images:

```bash
# Pull latest image
docker pull ghcr.io/mirara9/playwrightpoc:latest

# Run tests
docker run --rm ghcr.io/mirara9/playwrightpoc:latest npm test

# Use in your CI
docker run --rm \
  -v $(pwd)/test-results:/app/test-results \
  ghcr.io/mirara9/playwrightpoc:latest \
  npm test src/tests/api/
```

### Advanced Features

#### **Dependabot Integration**
- Automated dependency updates via `.github/dependabot.yml`
- Weekly updates for npm, Docker, and GitHub Actions
- Automatic PR creation with test validation

#### **Security Scanning**
- Trivy vulnerability scanning for Docker images
- npm audit for dependency vulnerabilities
- SARIF reports uploaded to GitHub Security tab

#### **Release Automation**
```bash
# Create a release
git tag v1.0.0
git push origin v1.0.0

# This triggers:
# 1. Full test suite
# 2. Docker image build and push
# 3. GitHub release creation
# 4. npm package publishing (if configured)
# 5. Deployment artifact creation
```

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
