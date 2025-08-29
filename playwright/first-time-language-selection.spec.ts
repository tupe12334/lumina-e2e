import { test, expect } from '@playwright/test';

test.describe('First-time Language Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies first
    await page.context().clearCookies();
    
    // Navigate to page first to establish domain context
    await page.goto('/');
    
    // Then clear localStorage to simulate first-time user
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore localStorage errors in test environment
        console.log('LocalStorage clear failed:', e.message);
      }
    });
    
    // Reload page after clearing storage
    await page.reload();
  });

  test('shows language selection modal for first-time users', async ({ page }) => {
    // Page is already loaded and localStorage cleared in beforeEach

    // Wait for the language selection modal to appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Welcome to Lumina')).toBeVisible();
    await expect(dialog.getByText('Choose your preferred language to get started')).toBeVisible();
    
    // Take screenshot of the language selection modal
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/initial-modal-display.png',
      fullPage: true 
    });
    
    // Check that all language options are present as buttons
    await expect(page.getByRole('option', { name: /Select English .* as your language/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /Select Hebrew .* as your language/ })).toBeVisible(); 
    await expect(page.getByRole('option', { name: /Select Spanish .* as your language/ })).toBeVisible();
  });

  test('allows user to select English', async ({ page }) => {
    // Page is already loaded and localStorage cleared in beforeEach

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click on English option
    await page.getByRole('option', { name: /Select English .* as your language/ }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Wait for state to be persisted
    await page.waitForTimeout(1000);

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
    // Page is already loaded and localStorage cleared in beforeEach

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Take screenshot before selection
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/before-hebrew-selection.png',
      fullPage: true 
    });

    // Click on Hebrew option
    await page.getByRole('option', { name: /Select Hebrew .* as your language/ }).click();

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
    // Page is already loaded and localStorage cleared in beforeEach

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click on Spanish option
    await page.getByRole('option', { name: /Select Spanish .* as your language/ }).click();

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
    // Page is already loaded and localStorage cleared in beforeEach

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // The first option should be focused by default
    const englishOption = page.getByRole('option', { name: /Select English .* as your language/ });
    await expect(englishOption).toBeFocused();

    // Take screenshot showing focus state
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/keyboard-focus-english.png',
      fullPage: true 
    });

    // Navigate using Tab key
    await page.keyboard.press('Tab');
    const hebrewOption = page.getByRole('option', { name: /Select Hebrew .* as your language/ });
    await expect(hebrewOption).toBeFocused();

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
    // Page is already loaded and localStorage cleared in beforeEach

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Navigate to Spanish option
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const spanishOption = page.getByRole('option', { name: /Select Spanish .* as your language/ });
    await expect(spanishOption).toBeFocused();

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
    // First visit - select a language (page already loaded in beforeEach)
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('option', { name: /Select English .* as your language/ }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Navigate away and come back
    await page.reload();

    // Modal should not appear
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('does not show modal when user already has a language preference', async ({ page }) => {
    // Pre-set language preference in localStorage (page already loaded in beforeEach)
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
    // Page is already loaded and localStorage cleared in beforeEach

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
    // Page is already loaded and localStorage cleared in beforeEach

    // Wait for modal and select a language
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('option', { name: /Select English .* as your language/ }).click();

    // Check that localStorage flags are set
    const visitFlags = await page.evaluate(() => ({
      hasVisited: localStorage.getItem('lumina-has-visited'),
      languageSelectionSeen: localStorage.getItem('lumina-language-selection-seen'),
    }));

    expect(visitFlags.hasVisited).toBeTruthy();
    expect(visitFlags.languageSelectionSeen).toBe('true');
  });

  test('visual regression - language selection modal states', async ({ page }) => {
    // Page is already loaded and localStorage cleared in beforeEach

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
    await page.getByRole('option', { name: /Select English .* as your language/ }).screenshot({
      path: 'test-results/screenshots/first-time-language/button-english-normal.png'
    });

    await page.getByRole('option', { name: /Select Hebrew .* as your language/ }).screenshot({
      path: 'test-results/screenshots/first-time-language/button-hebrew-rtl.png'
    });

    await page.getByRole('option', { name: /Select Spanish .* as your language/ }).screenshot({
      path: 'test-results/screenshots/first-time-language/button-spanish-normal.png'
    });

    // 4. Hover states for each language option
    await page.getByRole('option', { name: /Select English .* as your language/ }).hover();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-english-hovered.png' 
    });

    await page.getByRole('option', { name: /Select Hebrew .* as your language/ }).hover();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-hebrew-hovered.png' 
    });

    await page.getByRole('option', { name: /Select Spanish .* as your language/ }).hover();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-spanish-hovered.png' 
    });

    // 5. Focus states for accessibility testing
    await page.getByRole('option', { name: /Select English .* as your language/ }).focus();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-english-focused.png' 
    });

    await page.getByRole('option', { name: /Select Hebrew .* as your language/ }).focus();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-hebrew-focused.png' 
    });

    await page.getByRole('option', { name: /Select Spanish .* as your language/ }).focus();
    await modal.screenshot({ 
      path: 'test-results/screenshots/first-time-language/modal-spanish-focused.png' 
    });
  });

  test('visual documentation - complete user journey', async ({ page }) => {
    // Document the complete first-time user experience (page already loaded in beforeEach)

    // Step 1: First load showing modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/journey-01-modal-appears.png',
      fullPage: true 
    });

    // Step 2: User considers Hebrew option
    await page.getByRole('option', { name: /Select Hebrew .* as your language/ }).hover();
    await page.screenshot({ 
      path: 'test-results/screenshots/first-time-language/journey-02-considering-hebrew.png',
      fullPage: true 
    });

    // Step 3: User selects Hebrew
    await page.getByRole('option', { name: /Select Hebrew .* as your language/ }).click();
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

  test('visual regression - comprehensive screenshot tests @visual', async ({ page }) => {
    // 1. Initial modal display
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveScreenshot('language-modal-initial.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // 2. Modal component isolation
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveScreenshot('language-modal-component.png', {
      animations: 'disabled'
    });

    // 3. Individual language option states
    const englishOption = page.getByRole('option', { name: /Select English .* as your language/ });
    const hebrewOption = page.getByRole('option', { name: /Select Hebrew .* as your language/ });
    const spanishOption = page.getByRole('option', { name: /Select Spanish .* as your language/ });

    // Normal states
    await expect(englishOption).toHaveScreenshot('english-option-normal.png');
    await expect(hebrewOption).toHaveScreenshot('hebrew-option-normal.png');
    await expect(spanishOption).toHaveScreenshot('spanish-option-normal.png');

    // 4. Hover states
    await englishOption.hover();
    await expect(dialog).toHaveScreenshot('modal-english-hover.png', {
      animations: 'disabled'
    });

    await hebrewOption.hover();
    await expect(dialog).toHaveScreenshot('modal-hebrew-hover.png', {
      animations: 'disabled'
    });

    await spanishOption.hover();
    await expect(dialog).toHaveScreenshot('modal-spanish-hover.png', {
      animations: 'disabled'
    });

    // 5. Focus states for accessibility
    await englishOption.focus();
    await expect(dialog).toHaveScreenshot('modal-english-focus.png', {
      animations: 'disabled'
    });

    await hebrewOption.focus();
    await expect(dialog).toHaveScreenshot('modal-hebrew-focus.png', {
      animations: 'disabled'
    });

    await spanishOption.focus();
    await expect(dialog).toHaveScreenshot('modal-spanish-focus.png', {
      animations: 'disabled'
    });
  });

  test('visual regression - language selection flow @visual', async ({ page }) => {
    // Step 1: Initial modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveScreenshot('flow-01-initial-modal.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Step 2: Select Hebrew to test RTL layout
    await page.getByRole('option', { name: /Select Hebrew .* as your language/ }).click();
    
    // Wait for modal to close and language to switch
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.waitForTimeout(1500); // Wait for RTL layout changes

    // Step 3: Hebrew interface with RTL layout
    await expect(page).toHaveScreenshot('flow-02-hebrew-rtl-layout.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Step 4: Reload to verify no modal appears
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('flow-03-no-modal-return.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('visual regression - mobile responsive modal @visual', async ({ page }) => {
    // Test different mobile viewport sizes
    const mobileViewports = [
      { name: 'mobile-small', width: 375, height: 667 },   // iPhone SE
      { name: 'mobile-large', width: 414, height: 896 },   // iPhone XR
      { name: 'tablet-portrait', width: 768, height: 1024 } // iPad
    ];

    for (const viewport of mobileViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Wait for modal to be visible
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Take screenshot for each viewport
      await expect(page).toHaveScreenshot(`modal-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('visual regression - dark theme modal @visual', async ({ page }) => {
    // Enable dark theme by setting system preference
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Wait for modal and theme to load
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.waitForTimeout(500); // Allow theme transition
    
    // Take screenshot of dark theme modal
    await expect(page).toHaveScreenshot('modal-dark-theme.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test dark theme with different language selections
    const dialog = page.getByRole('dialog');
    
    // Hover state in dark theme
    await page.getByRole('option', { name: /Select English .* as your language/ }).hover();
    await expect(dialog).toHaveScreenshot('modal-dark-english-hover.png', {
      animations: 'disabled'
    });
    
    // Focus state in dark theme  
    await page.getByRole('option', { name: /Select Hebrew .* as your language/ }).focus();
    await expect(dialog).toHaveScreenshot('modal-dark-hebrew-focus.png', {
      animations: 'disabled'
    });
  });

  test('visual regression - high contrast and accessibility @visual', async ({ page }) => {
    // Enable high contrast mode
    await page.emulateMedia({ 
      colorScheme: 'dark',
      reducedMotion: 'reduce' 
    });
    
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // High contrast modal
    await expect(page).toHaveScreenshot('modal-high-contrast.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test keyboard navigation visibility in high contrast
    await page.keyboard.press('Tab'); // Focus first option
    await expect(page.getByRole('dialog')).toHaveScreenshot('modal-high-contrast-focus.png', {
      animations: 'disabled'
    });
  });
});