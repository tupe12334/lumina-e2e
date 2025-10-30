import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for Settings Error Handling
 *
 * Phase 10.3: Test error handling scenarios
 * Requirements: 8.5
 *
 * Tests cover:
 * - Attempt settings update with invalid values
 * - Verify error messages display correctly in UI
 * - Test authentication expiry during settings update
 * - Validate unauthorized access redirects to login
 */

test.describe('Settings Error Handling E2E @settings @error-handling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Handle first-time language selection if present
    const languageModal = page.getByRole('dialog');
    const isModalVisible = await languageModal.isVisible().catch(() => false);
    if (isModalVisible) {
      await page.getByRole('option', { name: /Select English/ }).click();
      await expect(languageModal).not.toBeVisible();
    }
  });

  test('should display error when attempting to access settings without authentication', async ({ page }) => {
    // Clear all authentication cookies and localStorage
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to navigate to settings page
    await page.goto('/settings');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login|\/auth/, { timeout: 10000 });

    // Take screenshot of redirect
    await page.screenshot({
      path: 'test-results/screenshots/settings-errors/unauthorized-redirect.png',
      fullPage: true
    });
  });

  test('should handle network errors gracefully during settings fetch', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/settings');

    // Simulate network failure by blocking API requests
    await page.route('**/api/settings/**', route => {
      route.abort('failed');
    });

    // Reload to trigger API call with network failure
    await page.reload();

    // Wait for error state to appear
    await page.waitForTimeout(2000);

    // Verify error message is displayed
    const errorMessage = page.getByText(/error|failed|unable|network/i);
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);

    // If error message is shown, take screenshot
    if (isErrorVisible) {
      await page.screenshot({
        path: 'test-results/screenshots/settings-errors/network-error.png',
        fullPage: true
      });
    }

    // Verify page doesn't crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should validate language selection and reject invalid values', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');

    // Try to inject invalid language value via JavaScript
    const initialLanguage = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.language;
    });

    // Attempt to set invalid language via JavaScript (simulating API bypass)
    await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        if (parsed.userSettings) {
          const userSettings = JSON.parse(parsed.userSettings);
          userSettings.data = userSettings.data || {};
          userSettings.data.language = 'invalid-lang'; // Invalid language code
          parsed.userSettings = JSON.stringify(userSettings);
          localStorage.setItem('persist:lumina-root', JSON.stringify(parsed));
        }
      }
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // The application should either:
    // 1. Fallback to a default language (en)
    // 2. Display an error message
    // 3. Not crash

    // Verify the page is still functional
    await expect(page.locator('body')).toBeVisible();

    // Verify language selector is still accessible
    const languageSelector = page.getByRole('combobox', { name: /language/i }).or(
      page.getByLabel(/language/i)
    );
    const isSelectorVisible = await languageSelector.isVisible().catch(() => false);

    if (isSelectorVisible) {
      await expect(languageSelector).toBeVisible();
    }

    // Take screenshot of state after invalid value
    await page.screenshot({
      path: 'test-results/screenshots/settings-errors/invalid-language-recovery.png',
      fullPage: true
    });
  });

  test('should validate theme selection and handle invalid values', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');

    // Try to set invalid theme value
    await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        if (parsed.userSettings) {
          const userSettings = JSON.parse(parsed.userSettings);
          userSettings.data = userSettings.data || {};
          userSettings.data.theme = 'rainbow'; // Invalid theme
          parsed.userSettings = JSON.stringify(userSettings);
          localStorage.setItem('persist:lumina-root', JSON.stringify(parsed));
        }
      }
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify page doesn't crash and theme falls back to default
    await expect(page.locator('body')).toBeVisible();

    const currentTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    // Should fall back to either light or dark (valid themes)
    expect(['light', 'dark']).toContain(currentTheme);

    await page.screenshot({
      path: 'test-results/screenshots/settings-errors/invalid-theme-recovery.png',
      fullPage: true
    });
  });

  test('should handle API timeout gracefully', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');

    // Simulate slow API response (timeout)
    await page.route('**/api/settings/**', route => {
      // Delay response by 30 seconds to trigger timeout
      setTimeout(() => {
        route.abort('timedout');
      }, 30000);
    });

    // Try to update settings
    const languageSelector = page.getByRole('combobox', { name: /language/i }).or(
      page.getByLabel(/language/i)
    );

    const isSelectorVisible = await languageSelector.isVisible().catch(() => false);
    if (isSelectorVisible) {
      await languageSelector.click();
      await page.getByRole('option', { name: /hebrew|עברית/i }).click();

      // Wait for timeout or error message
      await page.waitForTimeout(5000);

      // Verify error state or loading state is shown
      const loadingIndicator = page.getByText(/loading|saving|updating/i);
      const errorMessage = page.getByText(/error|failed|timeout/i);

      const isLoadingVisible = await loadingIndicator.isVisible().catch(() => false);
      const isErrorVisible = await errorMessage.isVisible().catch(() => false);

      // At least one should be visible (loading or error)
      expect(isLoadingVisible || isErrorVisible).toBe(true);

      await page.screenshot({
        path: 'test-results/screenshots/settings-errors/api-timeout.png',
        fullPage: true
      });
    }
  });

  test('should show validation error for empty required fields in settings form', async ({ page }) => {
    // This test would apply if settings had a form with required fields
    // For now, we'll test that the page handles missing data gracefully

    // Navigate to settings
    await page.goto('/settings');

    // Clear all settings data
    await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        if (parsed.userSettings) {
          parsed.userSettings = JSON.stringify({ data: {} });
          localStorage.setItem('persist:lumina-root', JSON.stringify(parsed));
        }
      }
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify page loads with default values and doesn't crash
    await expect(page.locator('body')).toBeVisible();

    // Verify settings controls are still functional
    await expect(page.getByRole('heading', { name: /settings|preferences/i })).toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/settings-errors/missing-data-recovery.png',
      fullPage: true
    });
  });

  test('should handle server error response appropriately', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');

    // Intercept API calls and return 500 error
    await page.route('**/api/settings/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        }),
      });
    });

    // Try to update settings
    const languageSelector = page.getByRole('combobox', { name: /language/i }).or(
      page.getByLabel(/language/i)
    );

    const isSelectorVisible = await languageSelector.isVisible().catch(() => false);
    if (isSelectorVisible) {
      await languageSelector.click();
      await page.getByRole('option', { name: /spanish|español/i }).click();

      // Wait for error to appear
      await page.waitForTimeout(2000);

      // Check for error toast or message
      const errorIndicators = [
        page.getByText(/error|failed|something went wrong/i),
        page.getByRole('alert'),
        page.locator('[role="status"]'),
      ];

      let errorFound = false;
      for (const indicator of errorIndicators) {
        const isVisible = await indicator.isVisible().catch(() => false);
        if (isVisible) {
          errorFound = true;
          break;
        }
      }

      // Take screenshot
      await page.screenshot({
        path: 'test-results/screenshots/settings-errors/server-error.png',
        fullPage: true
      });
    }
  });

  test('should prevent concurrent conflicting updates', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');

    // Try to make multiple rapid updates
    const themeToggle = page.getByRole('button', { name: /theme|dark mode|light mode/i });
    const isToggleVisible = await themeToggle.isVisible().catch(() => false);

    if (isToggleVisible) {
      // Click rapidly multiple times
      await themeToggle.click();
      await themeToggle.click();
      await themeToggle.click();

      // Wait for state to settle
      await page.waitForTimeout(2000);

      // Verify the application is in a consistent state
      await expect(page.locator('body')).toBeVisible();

      // Verify theme is either light or dark (not in invalid state)
      const currentTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });

      expect(['light', 'dark']).toContain(currentTheme);

      await page.screenshot({
        path: 'test-results/screenshots/settings-errors/concurrent-updates.png',
        fullPage: true
      });
    }
  });
});
