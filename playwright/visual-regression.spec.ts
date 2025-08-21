import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport and wait for fonts to load
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for fonts to load to ensure consistent rendering
    await page.waitForFunction(() => document.fonts.ready);
    
    // Wait for any animations or transitions to complete
    await page.waitForTimeout(500);
  });

  test('Home page visual appearance @visual', async ({ page }) => {
    await expect(page).toHaveScreenshot('home-page.png');
  });

  test('Degrees page visual appearance @visual', async ({ page }) => {
    await page.goto('/degrees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Wait for content to stabilize
    
    await expect(page).toHaveScreenshot('degrees-page.png');
  });

  test('Home page - different language @visual', async ({ page }) => {
    // Switch to Hebrew
    const languageSelector = page.locator('[data-testid="language-selector"], [aria-label="Language"], [role="combobox"]').first();
    if (await languageSelector.isVisible()) {
      await languageSelector.click();
      await page.locator('text=עברית').or(page.locator('[value="he"]')).click();
      await page.waitForTimeout(1000); // Wait for language change
    }
    
    await expect(page).toHaveScreenshot('home-page-hebrew.png');
  });

  test('Mobile viewport - home page @visual', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('home-page-mobile.png');
  });

  test('Mobile viewport - degrees page @visual', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/degrees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('degrees-page-mobile.png');
  });

  test('Tablet viewport - home page @visual', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('home-page-tablet.png');
  });

  test('Dark mode appearance @visual', async ({ page }) => {
    // Check if dark mode toggle exists and enable it
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"], [aria-label*="dark"], [aria-label*="theme"]');
    if (await darkModeToggle.first().isVisible()) {
      await darkModeToggle.first().click();
      await page.waitForTimeout(500); // Wait for theme change
    } else {
      // Manually set dark mode via localStorage if no toggle exists
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.add('dark');
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
    
    await expect(page).toHaveScreenshot('home-page-dark-mode.png');
  });

  test('Component-level screenshots @visual', async ({ page }) => {
    // Screenshot of main navigation area
    const navigation = page.locator('nav').or(page.locator('header')).first();
    if (await navigation.isVisible()) {
      await expect(navigation).toHaveScreenshot('navigation-component.png');
    }

    // Screenshot of main content area
    const mainContent = page.locator('main').or(page.locator('[role="main"]')).first();
    if (await mainContent.isVisible()) {
      await expect(mainContent).toHaveScreenshot('main-content-component.png');
    }

    // Screenshot of footer if present
    const footer = page.locator('footer');
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot('footer-component.png');
    }
  });

  test('Interactive elements hover states @visual', async ({ page }) => {
    // Test button hover states
    const getStartedButton = page.getByRole('link', { name: 'Get Started' });
    if (await getStartedButton.isVisible()) {
      await getStartedButton.hover();
      await page.waitForTimeout(300); // Wait for hover effect
      await expect(getStartedButton).toHaveScreenshot('get-started-button-hover.png');
    }

    const loginButton = page.getByRole('button', { name: 'Login' });
    if (await loginButton.isVisible()) {
      await loginButton.hover();
      await page.waitForTimeout(300);
      await expect(loginButton).toHaveScreenshot('login-button-hover.png');
    }
  });

  test('Error states visual appearance @visual', async ({ page }) => {
    // Navigate to a non-existent page to test 404 error
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Check if we get a 404 page or error message
    const errorIndicator = page.locator('text=/404|not found|error/i').first();
    if (await errorIndicator.isVisible()) {
      await expect(page).toHaveScreenshot('404-error-page.png');
    }
  });

  test('Loading states visual appearance @visual', async ({ page }) => {
    // Navigate to degrees page and capture loading state if possible
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/degrees') && response.status() === 200
    );
    
    await page.goto('/degrees');
    
    // Try to capture loading spinner or skeleton if present
    const loadingElement = page.locator('[data-testid="loading"], .loading, .spinner, [aria-label*="loading"]').first();
    if (await loadingElement.isVisible({ timeout: 1000 })) {
      await expect(loadingElement).toHaveScreenshot('loading-spinner.png');
    }
    
    await responsePromise;
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Cross-browser Visual Consistency', () => {
  test('Home page consistency across viewports @visual @cross-browser', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1280, height: 720, name: 'desktop-medium' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 414, height: 896, name: 'mobile-large' },
      { width: 375, height: 667, name: 'mobile-medium' },
      { width: 320, height: 568, name: 'mobile-small' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot(`home-page-${viewport.name}.png`);
    }
  });
});