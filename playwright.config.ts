import { defineConfig, devices } from '@playwright/test';

// Configuration flag for headless mode
// Set to false to see browser UI, true to run headless
const HEADLESS_MODE = process.env.HEADLESS === 'true' ? true : false;

export default defineConfig({
  testDir: './src/tests',
  // Only run specific test files for main test command
  testMatch: [
    'src/tests/api/**/*.test.ts',                           // API tests (uses local server)
    'src/tests/ui/selenium-test-form.ui.test.ts',           // New UI tests (external site)
    'src/tests/integration/api-ui-integration.test.ts'      // New integration tests
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Enhanced retry configuration
  retries: process.env.RETRY_COUNT ? parseInt(process.env.RETRY_COUNT) : 3,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: HEADLESS_MODE,
    // Force browser restart between retries
    launchOptions: {
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'cd test-app && npm install && npm start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});