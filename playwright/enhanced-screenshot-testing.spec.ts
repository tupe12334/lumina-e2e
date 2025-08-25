import { test, expect } from '@playwright/test';
import { ScreenshotHelpers } from './utils/screenshot-helpers';

test.describe('Enhanced Screenshot Testing Suite', () => {
  let screenshotHelpers: ScreenshotHelpers;

  test.beforeEach(async ({ page }) => {
    screenshotHelpers = new ScreenshotHelpers(page);
    await page.goto('/');
    await screenshotHelpers.prepareForScreenshot();
  });

  test('Full page screenshots with annotations @screenshot', async ({ page }) => {
    // Take full page screenshot with metadata
    await screenshotHelpers.takeAnnotatedScreenshot('home-page-full', {
      description: 'Home page complete layout',
      testType: 'full-page',
      viewport: '1280x720'
    });

    // Take screenshot with element highlights
    const heroSection = page.locator('main, [data-testid="hero"]').first();
    if (await heroSection.isVisible()) {
      await screenshotHelpers.takeScreenshotWithHighlight(
        heroSection,
        'home-hero-highlighted',
        { borderColor: 'red', borderWidth: 3 }
      );
    }
  });

  test('Component-focused screenshots @screenshot', async ({ page }) => {
    const components = [
      { selector: 'nav, header', name: 'navigation', description: 'Main navigation bar' },
      { selector: 'main', name: 'main-content', description: 'Primary content area' },
      { selector: '[data-testid="hero"], .hero', name: 'hero-section', description: 'Hero banner section' },
      { selector: 'footer', name: 'footer', description: 'Site footer' }
    ];

    for (const component of components) {
      const element = page.locator(component.selector).first();
      if (await element.isVisible()) {
        await screenshotHelpers.takeComponentScreenshot(
          element,
          component.name,
          component.description
        );
      }
    }
  });

  test('Interactive state screenshots @screenshot', async ({ page }) => {
    // Button states
    const buttons = [
      { selector: '[role="button"], button', name: 'buttons' },
      { selector: 'a[href*="get-started"], [data-testid="get-started"]', name: 'get-started-link' },
      { selector: 'a[href*="login"], [data-testid="login"]', name: 'login-link' }
    ];

    for (const button of buttons) {
      const elements = page.locator(button.selector);
      const count = await elements.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const element = elements.nth(i);
        if (await element.isVisible()) {
          await screenshotHelpers.captureInteractionStates(
            element,
            `${button.name}-${i}`,
            ['default', 'hover', 'focus', 'active']
          );
        }
      }
    }
  });

  test('Responsive screenshots across breakpoints @screenshot', async ({ page }) => {
    const breakpoints = [
      { name: 'mobile-xs', width: 320, height: 568 },
      { name: 'mobile-sm', width: 375, height: 667 },
      { name: 'mobile-lg', width: 414, height: 896 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'desktop-sm', width: 1280, height: 720 },
      { name: 'desktop-md', width: 1440, height: 900 },
      { name: 'desktop-lg', width: 1920, height: 1080 },
      { name: 'desktop-xl', width: 2560, height: 1440 }
    ];

    for (const breakpoint of breakpoints) {
      await screenshotHelpers.takeResponsiveScreenshot(
        breakpoint.name,
        { width: breakpoint.width, height: breakpoint.height }
      );
    }
  });

  test('Form component screenshots @screenshot', async ({ page }) => {
    // Navigate to a form-heavy page
    await page.goto('/login');
    await screenshotHelpers.prepareForScreenshot();

    // Form field states
    const formInputs = [
      { selector: 'input[type="email"], input[name*="email"]', name: 'email-input' },
      { selector: 'input[type="password"], input[name*="password"]', name: 'password-input' },
      { selector: 'input[type="text"], input[name*="name"]', name: 'text-input' }
    ];

    for (const input of formInputs) {
      const element = page.locator(input.selector).first();
      if (await element.isVisible()) {
        await screenshotHelpers.captureFormFieldStates(element, input.name);
      }
    }

    // Form validation states
    const submitButton = page.locator('button[type="submit"], [type="submit"]').first();
    if (await submitButton.isVisible()) {
      // Try to trigger validation by submitting empty form
      await submitButton.click();
      await page.waitForTimeout(500);
      
      await screenshotHelpers.takeAnnotatedScreenshot('form-validation-errors', {
        description: 'Form with validation errors displayed',
        testType: 'validation',
        viewport: await screenshotHelpers.getCurrentViewport()
      });
    }
  });

  test('Loading and skeleton state screenshots @screenshot', async ({ page }) => {
    // Intercept slow responses to capture loading states
    await page.route('**/api/**', async (route) => {
      await page.waitForTimeout(2000); // Delay to capture loading state
      route.continue();
    });

    await page.goto('/degrees');
    
    // Try to capture loading state
    const loadingElements = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '[aria-label*="loading"]',
      '.skeleton',
      '[data-testid="skeleton"]'
    ];

    for (const selector of loadingElements) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        await screenshotHelpers.takeAnnotatedScreenshot(`loading-${selector.replace(/[[\]".#]/g, '')}`, {
          description: `Loading state for ${selector}`,
          testType: 'loading',
          viewport: await screenshotHelpers.getCurrentViewport()
        });
      }
    }

    await page.unroute('**/api/**');
  });

  test('Error state screenshots @screenshot', async ({ page }) => {
    // 404 Error page
    await page.goto('/non-existent-page-test-404');
    await screenshotHelpers.prepareForScreenshot();
    
    await screenshotHelpers.takeAnnotatedScreenshot('404-error-page', {
      description: 'Page not found (404) error state',
      testType: 'error',
      viewport: await screenshotHelpers.getCurrentViewport()
    });

    // Network error simulation
    await page.route('**/api/**', route => route.abort());
    await page.goto('/degrees');
    await page.waitForTimeout(2000);
    
    const errorElements = [
      '[data-testid="error"]',
      '.error',
      '[role="alert"]',
      '.error-message',
      '[aria-label*="error"]'
    ];

    for (const selector of errorElements) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await screenshotHelpers.takeAnnotatedScreenshot(`network-error-${selector.replace(/[[\]".#]/g, '')}`, {
          description: `Network error state for ${selector}`,
          testType: 'error',
          viewport: await screenshotHelpers.getCurrentViewport()
        });
      }
    }

    await page.unroute('**/api/**');
  });

  test('Accessibility focused screenshots @screenshot', async ({ page }) => {
    // Focus visible elements for accessibility testing
    const focusableElements = [
      'button',
      'a[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])'
    ];

    for (const selector of focusableElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = elements.nth(i);
        if (await element.isVisible()) {
          await element.focus();
          await page.waitForTimeout(300);
          
          await screenshotHelpers.takeAnnotatedScreenshot(`focus-state-${selector.replace(/[[\]":]/g, '')}-${i}`, {
            description: `Focus state for ${selector} element ${i}`,
            testType: 'accessibility',
            viewport: await screenshotHelpers.getCurrentViewport()
          });
        }
      }
    }
  });

  test('Theme variation screenshots @screenshot', async ({ page }) => {
    const themes = ['light', 'dark', 'system'];
    
    for (const theme of themes) {
      // Set theme
      await page.evaluate((themeName) => {
        localStorage.setItem('theme', themeName);
        document.documentElement.className = '';
        if (themeName !== 'system') {
          document.documentElement.classList.add(themeName);
        }
      }, theme);
      
      await page.reload();
      await screenshotHelpers.prepareForScreenshot();
      
      await screenshotHelpers.takeAnnotatedScreenshot(`home-page-${theme}-theme`, {
        description: `Home page with ${theme} theme applied`,
        testType: 'theme',
        viewport: await screenshotHelpers.getCurrentViewport()
      });
    }
  });

  test('Cross-browser comparison screenshots @screenshot', async ({ page, browserName }) => {
    // Take browser-specific screenshots for comparison
    await screenshotHelpers.takeAnnotatedScreenshot(`home-page-${browserName}`, {
      description: `Home page rendered in ${browserName}`,
      testType: 'cross-browser',
      viewport: await screenshotHelpers.getCurrentViewport(),
      browser: browserName
    });

    // Test key interactive elements across browsers
    const criticalElements = [
      'nav, header',
      'main',
      'button, [role="button"]',
      'form',
      'footer'
    ];

    for (const selector of criticalElements) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        await screenshotHelpers.takeComponentScreenshot(
          element,
          `${selector.replace(/[[\]":, ]/g, '-')}-${browserName}`,
          `${selector} component in ${browserName}`
        );
      }
    }
  });

  test('Animation and transition screenshots @screenshot', async ({ page }) => {
    // Look for animated elements and capture different states
    const animatedSelectors = [
      '[class*="animate"]',
      '[class*="transition"]',
      '.loading',
      '.spinner',
      '[data-testid*="animation"]'
    ];

    for (const selector of animatedSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const element = elements.nth(i);
        if (await element.isVisible()) {
          // Capture at different points in animation
          await screenshotHelpers.takeAnimationFrames(element, `animation-${selector.replace(/[[\]".#*]/g, '')}-${i}`);
        }
      }
    }
  });

  test('Content variation screenshots @screenshot', async ({ page }) => {
    const pages = [
      { url: '/', name: 'home', description: 'Home page' },
      { url: '/degrees', name: 'degrees', description: 'Degrees listing page' },
      { url: '/login', name: 'login', description: 'Login page' }
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await screenshotHelpers.prepareForScreenshot();
      
      // Full page screenshot
      await screenshotHelpers.takeAnnotatedScreenshot(`${pageInfo.name}-page-complete`, {
        description: pageInfo.description,
        testType: 'page',
        viewport: await screenshotHelpers.getCurrentViewport()
      });

      // Above-the-fold screenshot
      await screenshotHelpers.takeViewportScreenshot(`${pageInfo.name}-above-fold`);
    }
  });

  test.afterEach(async ({ page }) => {
    // Generate screenshot report
    if (screenshotHelpers) {
      await screenshotHelpers.generateReport();
    }
  });
});