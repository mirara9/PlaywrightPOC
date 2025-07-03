import { defineConfig, devices } from '@playwright/test';

// Configuration flag for headless mode
// Set to false to see browser UI, true to run headless
const HEADLESS_MODE = process.env.HEADLESS === 'true' ? true : false;

// Debug logging for headless mode
if (process.env.NODE_ENV !== 'test') {
  console.log(`🔧 Playwright Config: HEADLESS=${process.env.HEADLESS}, HEADLESS_MODE=${HEADLESS_MODE}`);
}

export default defineConfig({
  testDir: './src/tests',
  // Run all test files for main test command
  testMatch: [
    'src/tests/api/**/*.test.ts',                           // API tests (uses local server)
    'src/tests/ui/**/*.test.ts',                            // UI tests (including dashboard tests)
    'src/tests/integration/**/*.test.ts',                   // Integration tests
    'src/tests/unit/**/*.test.ts'                           // Unit tests
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
      use: { 
        ...devices['Desktop Chrome'],
        headless: HEADLESS_MODE,
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        headless: HEADLESS_MODE,
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        headless: HEADLESS_MODE,
      },
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        headless: HEADLESS_MODE,
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        headless: HEADLESS_MODE,
      },
    },
  ],

  webServer: {
    command: 'cd test-app && npm install && npm run start:enhanced',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});