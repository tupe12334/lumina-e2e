import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for User Settings Management
 *
 * Phase 10.1: Test complete settings management user flow
 * Requirements: 8.3
 *
 * Tests cover:
 * - Navigating to settings page as authenticated user
 * - Changing theme and verifying UI updates
 * - Updating language and confirming persistence
 * - Testing font family changes across application
 * - Verifying settings persist across page reloads
 */

test.describe('User Settings Management E2E @settings', () => {
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

  test('should navigate to settings page and display current settings', async ({ page }) => {
    // Navigate to settings page (adjust selector based on actual navigation)
    // This assumes there's a settings link/button in the navigation
    await page.getByRole('link', { name: /settings|preferences/i }).click();

    // Wait for settings page to load
    await expect(page).toHaveURL(/\/settings/);

    // Verify settings page heading
    await expect(page.getByRole('heading', { name: /settings|preferences/i })).toBeVisible();

    // Verify all settings sections are visible
    await expect(page.getByText(/language|שפה/i)).toBeVisible();
    await expect(page.getByText(/theme|ערכת נושא/i)).toBeVisible();
    await expect(page.getByText(/font|גופן/i)).toBeVisible();

    // Take screenshot of settings page
    await page.screenshot({
      path: 'test-results/screenshots/settings/initial-state.png',
      fullPage: true
    });
  });

  test('should change theme and verify UI updates immediately', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: /settings|preferences/i }).click();
    await expect(page).toHaveURL(/\/settings/);

    // Get current theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    // Toggle theme
    const themeToggle = page.getByRole('button', { name: /theme|dark mode|light mode/i });
    await themeToggle.click();

    // Wait for theme to change
    await page.waitForTimeout(500);

    // Verify theme changed
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    expect(newTheme).not.toBe(initialTheme);

    // Take screenshots of both themes
    await page.screenshot({
      path: `test-results/screenshots/settings/theme-${newTheme}.png`,
      fullPage: true
    });

    // Verify theme persists in localStorage
    const storedTheme = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.theme;
    });

    expect(storedTheme).toBe(newTheme);
  });

  test('should update language and confirm persistence on page reload', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: /settings|preferences/i }).click();
    await expect(page).toHaveURL(/\/settings/);

    // Take screenshot before language change
    await page.screenshot({
      path: 'test-results/screenshots/settings/before-language-change.png',
      fullPage: true
    });

    // Change language to Hebrew
    const languageSelector = page.getByRole('combobox', { name: /language|שפה/i }).or(
      page.getByLabel(/language|שפה/i)
    );
    await languageSelector.click();
    await page.getByRole('option', { name: /hebrew|עברית/i }).click();

    // Wait for language change to propagate
    await page.waitForTimeout(1000);

    // Verify UI switched to Hebrew (RTL)
    const direction = await page.evaluate(() => document.documentElement.dir);
    expect(direction).toBe('rtl');

    // Verify Hebrew text is visible
    await expect(page.getByText(/הגדרות|שפה|ערכת נושא/)).toBeVisible();

    // Take screenshot after Hebrew selection
    await page.screenshot({
      path: 'test-results/screenshots/settings/after-hebrew-selection.png',
      fullPage: true
    });

    // Reload page and verify language persists
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify still in Hebrew
    const directionAfterReload = await page.evaluate(() => document.documentElement.dir);
    expect(directionAfterReload).toBe('rtl');

    // Verify language persists in localStorage
    const storedLanguage = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.language;
    });

    expect(storedLanguage).toBe('he');
  });

  test('should change font family and verify it applies across application', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: /settings|preferences/i }).click();
    await expect(page).toHaveURL(/\/settings/);

    // Get current font family
    const initialFont = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });

    // Change font family
    const fontSelector = page.getByRole('combobox', { name: /font|גופן/i }).or(
      page.getByLabel(/font|גופן/i)
    );
    await fontSelector.click();

    // Select a different font (e.g., Roboto)
    await page.getByRole('option', { name: /roboto/i }).click();

    // Wait for font change
    await page.waitForTimeout(500);

    // Verify font changed
    const newFont = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });

    expect(newFont.toLowerCase()).toContain('roboto');
    expect(newFont).not.toBe(initialFont);

    // Navigate to another page and verify font persists
    await page.getByRole('link', { name: /home|בית/i }).click();
    await page.waitForLoadState('networkidle');

    const fontOnHomePage = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });

    expect(fontOnHomePage.toLowerCase()).toContain('roboto');

    // Take screenshot showing font change
    await page.screenshot({
      path: 'test-results/screenshots/settings/roboto-font-applied.png',
      fullPage: true
    });
  });

  test('should persist all settings across browser session', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: /settings|preferences/i }).click();
    await expect(page).toHaveURL(/\/settings/);

    // Change multiple settings
    // 1. Change theme to dark
    const themeToggle = page.getByRole('button', { name: /theme|dark mode/i });
    await themeToggle.click();
    await page.waitForTimeout(300);

    // 2. Change language to Spanish
    const languageSelector = page.getByRole('combobox', { name: /language|שפה/i }).or(
      page.getByLabel(/language|שפה/i)
    );
    await languageSelector.click();
    await page.getByRole('option', { name: /spanish|español/i }).click();
    await page.waitForTimeout(500);

    // 3. Change font to Arial
    const fontSelector = page.getByRole('combobox', { name: /font|fuente/i }).or(
      page.getByLabel(/font|fuente/i)
    );
    await fontSelector.click();
    await page.getByRole('option', { name: /arial/i }).click();
    await page.waitForTimeout(300);

    // Verify all settings are stored
    const storedSettings = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return {
        theme: userSettings.data?.theme,
        language: userSettings.data?.language,
        fontFamily: userSettings.data?.fontFamily,
      };
    });

    expect(storedSettings?.theme).toBe('dark');
    expect(storedSettings?.language).toBe('es');
    expect(storedSettings?.fontFamily).toBe('Arial');

    // Reload page and verify all settings persist
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify theme is still dark
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
    expect(isDark).toBe(true);

    // Verify language is still Spanish
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(htmlLang).toBe('es');

    // Verify font is still Arial
    const currentFont = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    expect(currentFont.toLowerCase()).toContain('arial');

    // Take final screenshot
    await page.screenshot({
      path: 'test-results/screenshots/settings/all-settings-persisted.png',
      fullPage: true
    });
  });

  test('should toggle shuffle questions setting', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('link', { name: /settings|preferences/i }).click();
    await expect(page).toHaveURL(/\/settings/);

    // Find shuffle questions toggle
    const shuffleToggle = page.getByRole('checkbox', { name: /shuffle|random|mix/i }).or(
      page.getByLabel(/shuffle|random|mix/i)
    );

    // Get initial state
    const initialState = await shuffleToggle.isChecked();

    // Toggle the setting
    await shuffleToggle.click();
    await page.waitForTimeout(300);

    // Verify state changed
    const newState = await shuffleToggle.isChecked();
    expect(newState).toBe(!initialState);

    // Verify setting persists
    const storedShuffle = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.shuffleQuestions;
    });

    expect(storedShuffle).toBe(newState);
  });
});
