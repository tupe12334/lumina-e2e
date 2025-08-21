import { test, expect } from '@playwright/test';
import { VisualHelpers } from './utils/visual-helpers';

test.describe('Component Screenshot Tests', () => {
  let visualHelpers: VisualHelpers;

  test.beforeEach(async ({ page }) => {
    visualHelpers = new VisualHelpers(page);
    await page.goto('/');
    await visualHelpers.prepareForScreenshot();
  });

  test('Navigation components @visual-component', async ({ page }) => {
    // Main navigation bar
    const navBar = page.locator('nav, header').first();
    if (await navBar.isVisible()) {
      await expect(navBar).toHaveScreenshot('navigation-bar.png');
    }

    // Language selector
    const languageSelector = page.locator('[data-testid="language-selector"], [aria-label="Language"], [role="combobox"]').first();
    if (await languageSelector.isVisible()) {
      await expect(languageSelector).toHaveScreenshot('language-selector.png');

      // Capture interaction states
      const states = await visualHelpers.captureInteractionStates(
        languageSelector,
        'language-selector',
        ['hover', 'focus']
      );
      console.log(`Captured ${states.length} language selector states`);
    }

    // Login button states
    const loginButton = page.getByRole('button', { name: 'Login' });
    if (await loginButton.isVisible()) {
      const loginStates = await visualHelpers.captureInteractionStates(
        loginButton,
        'login-button',
        ['hover', 'focus']
      );
      console.log(`Captured ${loginStates.length} login button states`);
    }
  });

  test('Hero section components @visual-component', async ({ page }) => {
    // Main hero section
    const heroSection = page.locator('main, [data-testid="hero"], .hero').first();
    if (await heroSection.isVisible()) {
      await expect(heroSection).toHaveScreenshot('hero-section.png');
    }

    // Get Started button in different states
    const getStartedButton = page.getByRole('link', { name: 'Get Started' });
    if (await getStartedButton.isVisible()) {
      const buttonStates = await visualHelpers.captureInteractionStates(
        getStartedButton,
        'get-started-button',
        ['hover', 'focus']
      );
      console.log(`Captured ${buttonStates.length} get started button states`);
    }

    // Main heading
    const mainHeading = page.locator('h1').first();
    if (await mainHeading.isVisible()) {
      await expect(mainHeading).toHaveScreenshot('main-heading.png');
    }
  });

  test('Content sections @visual-component', async ({ page }) => {
    // All major content sections
    const sections = page.locator('section, [role="region"]');
    const sectionCount = await sections.count();

    for (let i = 0; i < Math.min(sectionCount, 5); i++) {
      const section = sections.nth(i);
      if (await section.isVisible()) {
        await expect(section).toHaveScreenshot(`content-section-${i + 1}.png`);
      }
    }
  });

  test('Form components @visual-component', async ({ page }) => {
    // Navigate to a page with forms (login page)
    await page.goto('/login');
    await visualHelpers.prepareForScreenshot();

    // Login form if it exists
    const loginForm = page.locator('form, [data-testid="login-form"]').first();
    if (await loginForm.isVisible()) {
      await expect(loginForm).toHaveScreenshot('login-form.png');

      // Form input fields
      const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name*="password"]').first();

      if (await emailInput.isVisible()) {
        await expect(emailInput).toHaveScreenshot('email-input-default.png');
        
        await emailInput.focus();
        await page.waitForTimeout(200);
        await expect(emailInput).toHaveScreenshot('email-input-focused.png');

        await emailInput.fill('test@example.com');
        await expect(emailInput).toHaveScreenshot('email-input-filled.png');
      }

      if (await passwordInput.isVisible()) {
        await expect(passwordInput).toHaveScreenshot('password-input-default.png');
        
        await passwordInput.focus();
        await page.waitForTimeout(200);
        await expect(passwordInput).toHaveScreenshot('password-input-focused.png');
      }
    }
  });

  test('Responsive component behavior @visual-component', async ({ page }) => {
    const components = [
      { selector: 'nav, header', name: 'navigation' },
      { selector: 'main', name: 'main-content' },
      { selector: '.hero, [data-testid="hero"]', name: 'hero-section' },
    ];

    for (const component of components) {
      const element = page.locator(component.selector).first();
      if (await element.isVisible()) {
        const responsiveScreenshots = await visualHelpers.captureResponsiveBreakpoints(
          component.name,
          [
            { name: 'mobile', width: 375, height: 667 },
            { name: 'tablet', width: 768, height: 1024 },
            { name: 'desktop', width: 1280, height: 720 },
            { name: 'wide', width: 1920, height: 1080 },
          ]
        );
        console.log(`Captured ${responsiveScreenshots.length} responsive states for ${component.name}`);
      }
    }
  });

  test('Loading and empty states @visual-component', async ({ page }) => {
    // Navigate to degrees page to potentially see loading states
    const navigationPromise = page.waitForLoadState('domcontentloaded');
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
        await expect(element).toHaveScreenshot(`loading-${selector.replace(/[[\]".#]/g, '')}.png`);
        break;
      }
    }

    await navigationPromise;
    await visualHelpers.prepareForScreenshot();

    // Capture the final loaded state
    const mainContent = page.locator('main').first();
    if (await mainContent.isVisible()) {
      await expect(mainContent).toHaveScreenshot('degrees-page-loaded.png');
    }
  });

  test('Error state components @visual-component', async ({ page }) => {
    // Try to trigger some error states
    
    // 1. Network error simulation (if possible)
    await page.route('**/api/**', route => route.abort());
    await page.goto('/degrees');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for error messages or components
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
        await expect(element).toHaveScreenshot(`error-${selector.replace(/[[\]".#]/g, '')}.png`);
      }
    }

    // Reset network interception
    await page.unroute('**/api/**');

    // 2. 404 page
    await page.goto('/non-existent-page-12345');
    await page.waitForLoadState('domcontentloaded');
    await visualHelpers.prepareForScreenshot();

    const notFoundIndicators = page.locator('text=/404|not found|page not found/i');
    if (await notFoundIndicators.first().isVisible({ timeout: 1000 })) {
      await expect(page).toHaveScreenshot('404-page.png');
    }
  });

  test('Theme variations @visual-component', async ({ page }) => {
    const themeStates = [
      {
        name: 'light',
        setup: async () => {
          await page.evaluate(() => {
            localStorage.setItem('theme', 'light');
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          });
        }
      },
      {
        name: 'dark',
        setup: async () => {
          await page.evaluate(() => {
            localStorage.setItem('theme', 'dark');
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
          });
        }
      }
    ];

    for (const theme of themeStates) {
      await theme.setup();
      await page.reload();
      await visualHelpers.prepareForScreenshot();

      // Capture main components in this theme
      const mainContent = page.locator('main').first();
      if (await mainContent.isVisible()) {
        await expect(mainContent).toHaveScreenshot(`main-content-${theme.name}-theme.png`);
      }

      const navigation = page.locator('nav, header').first();
      if (await navigation.isVisible()) {
        await expect(navigation).toHaveScreenshot(`navigation-${theme.name}-theme.png`);
      }
    }
  });
});