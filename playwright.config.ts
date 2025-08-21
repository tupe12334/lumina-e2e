import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:4174';

export default defineConfig({
  testDir: './playwright',
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 15000, // 15 seconds for assertions
  },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 3 : 2, // More retries in CI
  workers: isCI ? 2 : undefined, // Limit workers in CI
  reporter: [
    ['html', { open: 'never' }],
    ['json'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    isCI ? ['github'] : ['list'],
  ],
  globalSetup: './playwright/global-setup.ts',
  globalTeardown: './playwright/global-teardown.ts',

  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10000, // 10 seconds for actions
    navigationTimeout: 30000, // 30 seconds for navigation
    // Better error handling
    contextOptions: {
      recordVideo: isCI ? { dir: 'test-results/videos' } : undefined,
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
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: [
    {
      command: 'pnpm --dir ../../ run preview',
      port: 4174,
      reuseExistingServer: !isCI,
      timeout: 120000, // 2 minutes startup time
      env: {
        NODE_ENV: 'test',
      },
    },
  ],
});
