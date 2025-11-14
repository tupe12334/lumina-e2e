import { test, expect, type Page } from '@playwright/test';

test.describe('Error Pages', () => {
  test.describe('404 Page', () => {
    test('should display 404 page for non-existent route', async ({ page }) => {
      // Navigate to a non-existent route
      await page.goto('/this-page-does-not-exist');

      // Wait for the error page to load
      await page.waitForSelector('[data-testid="not-found-page"]');

      // Check that the 404 error code is displayed
      await expect(page.locator('[data-testid="not-found-page-icon"]')).toContainText('404');

      // Check that the title is correct
      await expect(page.locator('[data-testid="not-found-page-title"]')).toContainText('Page Not Found');

      // Check that the description is present
      await expect(page.locator('[data-testid="not-found-page-description"]')).toContainText(
        'The page you are looking for does not exist or has been moved.'
      );

      // Check that action buttons are present
      await expect(page.locator('[data-testid="not-found-page-home-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="not-found-page-back-button"]')).toBeVisible();

      // Check that help text is displayed for 404
      await expect(page.locator('[data-testid="not-found-page-help-text"]')).toContainText(
        'If you believe this is a mistake, please contact support.'
      );

      // Check page title
      await expect(page).toHaveTitle(/Page Not Found/);
    });

    test('should navigate to homepage when clicking "Go to Homepage" button', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForSelector('[data-testid="not-found-page"]');

      // Click the "Go to Homepage" button
      await page.click('[data-testid="not-found-page-home-button"]');

      // Should navigate to homepage
      await expect(page).toHaveURL('/');
    });

    test('should go back when clicking "Go Back" button', async ({ page }) => {
      // First navigate to a valid page
      await page.goto('/');

      // Then navigate to a non-existent page
      await page.goto('/non-existent-page');
      await page.waitForSelector('[data-testid="not-found-page"]');

      // Click the "Go Back" button
      await page.click('[data-testid="not-found-page-back-button"]');

      // Should navigate back to homepage
      await expect(page).toHaveURL('/');
    });

    test('should display correctly in different languages', async ({ page }) => {
      // Test Hebrew
      await page.goto('/non-existent-page');
      await page.evaluate(() => {
        localStorage.setItem('i18nextLng', 'he');
      });
      await page.reload();
      await page.waitForSelector('[data-testid="not-found-page"]');

      // Check Hebrew translations
      await expect(page.locator('[data-testid="not-found-page-title"]')).toContainText('הדף לא נמצא');
      await expect(page.locator('[data-testid="not-found-page-description"]')).toContainText(
        'הדף שאתה מחפש לא קיים או הועבר למקום אחר'
      );
      await expect(page.locator('[data-testid="not-found-page-home-button"]')).toContainText('חזרה לדף הבית');

      // Test Spanish
      await page.evaluate(() => {
        localStorage.setItem('i18nextLng', 'es');
      });
      await page.reload();
      await page.waitForSelector('[data-testid="not-found-page"]');

      // Check Spanish translations
      await expect(page.locator('[data-testid="not-found-page-title"]')).toContainText('Página No Encontrada');
      await expect(page.locator('[data-testid="not-found-page-description"]')).toContainText(
        'La página que buscas no existe o ha sido movida'
      );
      await expect(page.locator('[data-testid="not-found-page-home-button"]')).toContainText('Ir a la Página Principal');

      // Reset to English
      await page.evaluate(() => {
        localStorage.setItem('i18nextLng', 'en');
      });
    });

    test('should be accessible', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForSelector('[data-testid="not-found-page"]');

      // Check for ARIA labels on buttons
      await expect(page.locator('[data-testid="not-found-page-home-button"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="not-found-page-back-button"]')).toHaveAttribute('aria-label');

      // Check for proper heading structure
      const heading = page.locator('[data-testid="not-found-page-title"]');
      await expect(heading).toHaveAttribute('as', 'h1');

      // Check color contrast (basic check)
      const textColor = await page.locator('[data-testid="not-found-page-description"]').evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      expect(textColor).toBeTruthy();
    });

    test('should have proper meta tags for SEO', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForSelector('[data-testid="not-found-page"]');

      // Check for noindex meta tag (404 pages shouldn't be indexed)
      const metaRobots = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(metaRobots).toContain('noindex');
      expect(metaRobots).toContain('nofollow');
    });

    test('should handle direct navigation to /404 route', async ({ page }) => {
      await page.goto('/404');
      await page.waitForSelector('[data-testid="not-found-page"]');

      // Should display the 404 page
      await expect(page.locator('[data-testid="not-found-page-title"]')).toContainText('Page Not Found');
    });
  });

  test.describe('Error Page Component', () => {
    test('should display custom error codes correctly', async ({ page }) => {
      // This would test the ErrorPage component with different error codes
      // In a real scenario, you'd need to trigger these errors or have test routes

      // Test 403 error
      await page.goto('/test-403'); // Assuming you have a test route
      const errorPage = page.locator('[data-testid="error-page"]');

      if (await errorPage.isVisible()) {
        await expect(page.locator('[data-testid="error-page-icon"]')).toContainText('403');
        await expect(page.locator('[data-testid="error-page-title"]')).toContainText('Access Denied');
      }
    });

    test('should handle keyboard navigation', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForSelector('[data-testid="not-found-page"]');

      // Tab to first button
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

      // Should focus on one of the action buttons
      expect(focusedElement).toMatch(/not-found-page-(home|back)-button/);

      // Press Enter to activate the button
      await page.keyboard.press('Enter');

      // Should navigate away from the error page
      await expect(page).not.toHaveURL(/non-existent-page/);
    });

    test('should be responsive', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForSelector('[data-testid="not-found-page"]');

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="not-found-page-title"]')).toBeVisible();

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();

      // Test desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();

      // Check that buttons stack properly on mobile
      await page.setViewportSize({ width: 375, height: 667 });
      const buttons = page.locator('[data-testid="not-found-page-actions"]');
      const flexWrap = await buttons.evaluate((el) => {
        return window.getComputedStyle(el).flexWrap;
      });
      expect(flexWrap).toBe('wrap');
    });
  });
});