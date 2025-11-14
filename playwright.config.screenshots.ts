import { defineConfig, devices } from '@playwright/test';
import { env } from 'process';

const isCI = Boolean(env.CI);
const baseURL = env.E2E_BASE_URL || 'http://localhost:5173';

/**
 * Configuration specifically optimized for screenshot testing
 */
export default defineConfig({
  testDir: './playwright',
  timeout: 120000, // 2 minutes per test (screenshot tests can be slower)
  expect: {
    timeout: 30000, // 30 seconds for assertions (screenshots take time)
    // Screenshot comparison settings optimized for stability
    toHaveScreenshot: {
      threshold: 0.15, // Allow 15% pixel difference
      maxDiffPixels: 2000, // Maximum number of different pixels
      mode: 'strict',
      animations: 'disabled', // Critical for consistent screenshots
    },
  },
  fullyParallel: false, // Disable for screenshot tests to avoid conflicts
  forbidOnly: isCI,
  retries: isCI ? 1 : 0, // Minimal retries for screenshot tests
  workers: 1, // Single worker for screenshot tests to avoid viewport conflicts
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/screenshot-results.json' }],
    ['junit', { outputFile: 'test-results/screenshot-junit.xml' }],
    isCI ? ['github'] : ['list'],
  ],

  use: {
    baseURL,
    // Screenshot-specific settings
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off', // Disable video for screenshot tests
    viewport: { width: 1280, height: 720 }, // Standard desktop viewport
    ignoreHTTPSErrors: true,
    actionTimeout: 15000, // Longer timeout for actions
    navigationTimeout: 60000, // Longer navigation timeout
    // Ensure consistent rendering
    contextOptions: {
      reducedMotion: 'reduce', // Reduce animations for consistent screenshots
    },
  },

  // Multiple browsers for cross-browser screenshot comparison
  projects: [
    {
      name: 'chromium-screenshots',
      use: {
        ...devices['Desktop Chrome'],
        // Chrome-specific screenshot settings
        launchOptions: {
          args: [
            '--disable-animations',
            '--disable-transitions',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-web-security'
          ]
        }
      },
    },
    {
      name: 'firefox-screenshots',
      use: {
        ...devices['Desktop Firefox'],
        // Firefox-specific settings for consistent screenshots
        launchOptions: {
          firefoxUserPrefs: {
            'ui.prefersReducedMotion': 1,
            'browser.animation.enabled': false,
          }
        }
      },
    },
    {
      name: 'webkit-screenshots',
      use: {
        ...devices['Desktop Safari'],
        // WebKit-specific settings
        launchOptions: {
          args: ['--disable-web-security']
        }
      },
    },
    // Mobile screenshot projects
    {
      name: 'mobile-chrome-screenshots',
      use: {
        ...devices['Pixel 5'],
        // Mobile-specific screenshot settings
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'mobile-safari-screenshots',
      use: {
        ...devices['iPhone 12'],
        hasTouch: true,
        isMobile: true,
      },
    },
  ],

  // No webServer for screenshot tests - expect it to be running
});