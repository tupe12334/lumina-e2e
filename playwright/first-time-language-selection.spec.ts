import { test, expect } from '@playwright/test';

test.describe('First-time Language Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to simulate first-time user
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('shows language selection modal for first-time users', async ({ page }) => {
    await page.goto('/');

    // Wait for the language selection modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Welcome to Lumina')).toBeVisible();
    await expect(page.getByText('Choose your preferred language to get started')).toBeVisible();
    
    // Take screenshot of the language selection modal
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/initial-modal-display.png',
      fullPage: true 
    });
    
    // Check that all language options are present
    await expect(page.getByText('English')).toBeVisible();
    await expect(page.getByText('עברית')).toBeVisible(); // Hebrew
    await expect(page.getByText('Español')).toBeVisible(); // Spanish
  });

  test('allows user to select English', async ({ page }) => {
    await page.goto('/');

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click on English option
    await page.getByRole('button', { name: /Select English/ }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Check that language preference was saved
    const languagePreference = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.language;
    });

    expect(languagePreference).toBe('en');
  });

  test('allows user to select Hebrew', async ({ page }) => {
    await page.goto('/');

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Take screenshot before selection
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/before-hebrew-selection.png',
      fullPage: true 
    });

    // Click on Hebrew option
    await page.getByRole('button', { name: /Select Hebrew/ }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Wait for UI to update to Hebrew
    await page.waitForTimeout(1000);

    // Take screenshot after Hebrew selection to show RTL layout
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/after-hebrew-selection-rtl.png',
      fullPage: true 
    });

    // Check that language preference was saved and UI switched to Hebrew
    const languagePreference = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.language;
    });

    expect(languagePreference).toBe('he');

    // Check that document direction changed to RTL
    const documentDirection = await page.evaluate(() => document.documentElement.dir);
    expect(documentDirection).toBe('rtl');
  });

  test('allows user to select Spanish', async ({ page }) => {
    await page.goto('/');

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click on Spanish option
    await page.getByRole('button', { name: /Select Spanish/ }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Check that language preference was saved
    const languagePreference = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.language;
    });

    expect(languagePreference).toBe('es');
  });

  test('supports keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // The first option should be focused by default
    const englishButton = page.getByRole('button', { name: /Select English/ });
    await expect(englishButton).toBeFocused();

    // Take screenshot showing focus state
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/keyboard-focus-english.png',
      fullPage: true 
    });

    // Navigate using Tab key
    await page.keyboard.press('Tab');
    const hebrewButton = page.getByRole('button', { name: /Select Hebrew/ });
    await expect(hebrewButton).toBeFocused();

    // Take screenshot showing focus moved to second option
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/keyboard-focus-hebrew.png',
      fullPage: true 
    });

    // Select using Enter key
    await page.keyboard.press('Enter');

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Check Hebrew was selected
    const languagePreference = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.language;
    });

    expect(languagePreference).toBe('he');
  });

  test('supports keyboard navigation with Space key', async ({ page }) => {
    await page.goto('/');

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Navigate to Spanish option
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const spanishButton = page.getByRole('button', { name: /Select Spanish/ });
    await expect(spanishButton).toBeFocused();

    // Select using Space key
    await page.keyboard.press(' ');

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Check Spanish was selected
    const languagePreference = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.language;
    });

    expect(languagePreference).toBe('es');
  });

  test('does not show modal for returning users', async ({ page }) => {
    // First visit - select a language
    await page.goto('/');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /Select English/ }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Navigate away and come back
    await page.reload();

    // Modal should not appear
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('does not show modal when user already has a language preference', async ({ page }) => {
    // Pre-set language preference in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const persistedState = {
        userSettings: JSON.stringify({
          data: { language: 'en' },
          error: null,
          lastSyncAt: null,
          isLoading: false,
        }),
        _persist: JSON.stringify({ version: -1, rehydrated: true }),
      };
      localStorage.setItem('persist:lumina-root', JSON.stringify(persistedState));
      localStorage.setItem('lumina-language-selection-seen', 'true');
    });

    await page.reload();

    // Modal should not appear
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('has proper ARIA attributes for accessibility', async ({ page }) => {
    await page.goto('/');

    // Wait for modal to appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Check dialog ARIA attributes
    await expect(dialog).toHaveAttribute('aria-labelledby', 'language-selection-title');
    await expect(dialog).toHaveAttribute('aria-describedby', 'language-selection-description');

    // Check listbox ARIA attributes
    const listbox = page.getByRole('listbox');
    await expect(listbox).toHaveAttribute('aria-label', 'Available languages');

    // Check that all options have proper ARIA labels
    const options = page.getByRole('option');
    await expect(options).toHaveCount(3);

    for (const option of await options.all()) {
      await expect(option).toHaveAttribute('aria-label');
    }
  });

  test('marks first visit and language selection as seen', async ({ page }) => {
    await page.goto('/');

    // Wait for modal and select a language
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /Select English/ }).click();

    // Check that localStorage flags are set
    const visitFlags = await page.evaluate(() => ({
      hasVisited: localStorage.getItem('lumina-has-visited'),
      languageSelectionSeen: localStorage.getItem('lumina-language-selection-seen'),
    }));

    expect(visitFlags.hasVisited).toBeTruthy();
    expect(visitFlags.languageSelectionSeen).toBe('true');
  });

  test('visual regression - language selection modal states', async ({ page }) => {
    await page.goto('/');

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // 1. Modal component isolation
    const modal = page.getByRole('dialog');
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-component-isolated.png' 
    });

    // 2. Full page with modal backdrop
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-with-backdrop.png',
      fullPage: true 
    });

    // 3. Individual language options (normal state)
    await page.getByRole('button', { name: /Select English/ }).screenshot({
      path: 'test-results/screenshots/first-time-language/button-english-normal.png'
    });

    await page.getByRole('button', { name: /Select Hebrew/ }).screenshot({
      path: 'test-results/screenshots/first-time-language/button-hebrew-rtl.png'
    });

    await page.getByRole('button', { name: /Select Spanish/ }).screenshot({
      path: 'test-results/screenshots/first-time-language/button-spanish-normal.png'
    });

    // 4. Hover states for each language option
    await page.getByRole('button', { name: /Select English/ }).hover();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-english-hovered.png' 
    });

    await page.getByRole('button', { name: /Select Hebrew/ }).hover();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-hebrew-hovered.png' 
    });

    await page.getByRole('button', { name: /Select Spanish/ }).hover();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-spanish-hovered.png' 
    });

    // 5. Focus states for accessibility testing
    await page.getByRole('button', { name: /Select English/ }).focus();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-english-focused.png' 
    });

    await page.getByRole('button', { name: /Select Hebrew/ }).focus();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-hebrew-focused.png' 
    });

    await page.getByRole('button', { name: /Select Spanish/ }).focus();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-spanish-focused.png' 
    });
  });

  test('visual documentation - complete user journey', async ({ page }) => {
    // Document the complete first-time user experience
    await page.goto('/');

    // Step 1: First load showing modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/journey-01-modal-appears.png',
      fullPage: true 
    });

    // Step 2: User considers Hebrew option
    await page.getByRole('button', { name: /Select Hebrew/ }).hover();
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/journey-02-considering-hebrew.png',
      fullPage: true 
    });

    // Step 3: User selects Hebrew
    await page.getByRole('button', { name: /Select Hebrew/ }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Step 4: Wait for language switch and RTL layout
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/journey-03-hebrew-selected-rtl.png',
      fullPage: true 
    });

    // Step 5: Verify no modal on reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/journey-04-no-modal-on-return.png',
      fullPage: true 
    });
  });
});