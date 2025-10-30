import { faker } from '@faker-js/faker';
import { test, expect } from '@playwright/test';
import { Sidebar } from './pages/Sidebar';

/**
 * End-to-End Tests for Registration Flow with Settings Creation
 *
 * Phase 10.2: Test registration flow with settings creation
 * Requirements: 8.3
 *
 * Tests cover:
 * - Complete new user registration with language preference
 * - Verify settings page loads with correct language after registration
 * - Test settings values match registration preferences
 * - Validate onboarding redirect works with new settings
 */

test.describe('Registration Flow with Settings Creation @registration @settings', () => {
  test('should create user settings with selected language during registration', async ({ page }) => {
    // Generate test user data
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 12, memorable: true });

    // 1. Navigate to home and select Hebrew language
    await page.goto('/');

    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('he');

    // Verify language changed to Hebrew
    const direction = await page.evaluate(() => document.documentElement.dir);
    expect(direction).toBe('rtl');

    // Take screenshot after language selection
    await page.screenshot({
      path: 'test-results/screenshots/registration-settings/hebrew-language-selected.png',
      fullPage: true
    });

    // 2. Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveURL('/register');

    // 3. Fill out registration form
    await page.getByLabel(/שם פרטי|First Name/i).fill(firstName);
    await page.getByLabel(/שם משפחה|Last Name/i).fill(lastName);
    await page.getByLabel(/אימייל|Email/i).fill(email);
    await page.getByLabel(/סיסמה|Password/i).fill(password);

    // Accept terms
    await page.getByRole('checkbox', { name: /תנאים|terms/i }).check();

    // 4. Submit registration form
    await page.getByRole('button', { name: /הרשמה|create account|sign up/i }).click();

    // 5. Verify successful registration - should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });

    // Verify language persists in onboarding (should still be Hebrew)
    const onboardingDirection = await page.evaluate(() => document.documentElement.dir);
    expect(onboardingDirection).toBe('rtl');

    // Take screenshot of onboarding page in Hebrew
    await page.screenshot({
      path: 'test-results/screenshots/registration-settings/onboarding-hebrew.png',
      fullPage: true
    });

    // 6. Navigate to settings page to verify settings were created
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);

    // 7. Verify settings page displays in Hebrew
    const settingsDirection = await page.evaluate(() => document.documentElement.dir);
    expect(settingsDirection).toBe('rtl');

    // Verify Hebrew text is visible
    await expect(page.getByText(/הגדרות|שפה|ערכת נושא/)).toBeVisible();

    // 8. Verify language setting matches registration preference
    const storedLanguage = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.language;
    });

    expect(storedLanguage).toBe('he');

    // Take final screenshot
    await page.screenshot({
      path: 'test-results/screenshots/registration-settings/settings-page-verified.png',
      fullPage: true
    });
  });

  test('should create user settings with English during registration', async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 12, memorable: true });

    // 1. Navigate to home and select English
    await page.goto('/');

    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('en');

    // 2. Complete registration
    await page.goto('/register');
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('checkbox', { name: /terms/i }).check();
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    // 3. Wait for onboarding redirect
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });

    // 4. Navigate to settings and verify language
    await page.goto('/settings');

    const storedLanguage = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.language;
    });

    expect(storedLanguage).toBe('en');

    // Verify LTR direction
    const direction = await page.evaluate(() => document.documentElement.dir);
    expect(direction).not.toBe('rtl');
  });

  test('should create user settings with Spanish during registration', async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 12, memorable: true });

    // 1. Navigate to home and select Spanish
    await page.goto('/');

    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('es');

    // 2. Complete registration
    await page.goto('/register');
    await page.getByLabel(/Nombre|First Name/i).fill(firstName);
    await page.getByLabel(/Apellido|Last Name/i).fill(lastName);
    await page.getByLabel(/Correo|Email/i).fill(email);
    await page.getByLabel(/Contraseña|Password/i).fill(password);
    await page.getByRole('checkbox', { name: /términos|terms/i }).check();
    await page.getByRole('button', { name: /crear cuenta|registrarse|sign up/i }).click();

    // 3. Wait for onboarding redirect
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });

    // 4. Verify Spanish language in onboarding
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(htmlLang).toBe('es');

    // 5. Navigate to settings and verify
    await page.goto('/settings');

    const storedLanguage = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return userSettings.data?.language;
    });

    expect(storedLanguage).toBe('es');
  });

  test('should create default settings when no language is explicitly selected', async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 12, memorable: true });

    // 1. Navigate directly to registration without language selection
    await page.goto('/register');

    // Handle language modal if it appears
    const languageModal = page.getByRole('dialog');
    const isModalVisible = await languageModal.isVisible().catch(() => false);
    if (isModalVisible) {
      await page.getByRole('option', { name: /Select English/ }).click();
    }

    // 2. Fill and submit registration form
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('checkbox', { name: /terms/i }).check();
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    // 3. Wait for onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });

    // 4. Navigate to settings and verify default settings created
    await page.goto('/settings');

    const storedSettings = await page.evaluate(() => {
      const persistedState = localStorage.getItem('persist:lumina-root');
      if (!persistedState) return null;
      const parsed = JSON.parse(persistedState);
      if (!parsed.userSettings) return null;
      const userSettings = JSON.parse(parsed.userSettings);
      return {
        language: userSettings.data?.language,
        theme: userSettings.data?.theme,
        fontFamily: userSettings.data?.fontFamily,
        shuffleQuestions: userSettings.data?.shuffleQuestions,
      };
    });

    // Verify default settings
    expect(storedSettings?.language).toBe('en'); // Default language
    expect(storedSettings?.theme).toBe('light'); // Default theme
    expect(storedSettings?.fontFamily).toBe('Assistant'); // Default font
    expect(storedSettings?.shuffleQuestions).toBe(true); // Default shuffle
  });

  test('should allow changing settings after registration', async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 12, memorable: true });

    // 1. Register with English
    await page.goto('/');
    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('en');

    await page.goto('/register');
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('checkbox', { name: /terms/i }).check();
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });

    // 2. Navigate to settings
    await page.goto('/settings');

    // 3. Change language to Hebrew
    const languageSelector = page.getByRole('combobox', { name: /language/i }).or(
      page.getByLabel(/language/i)
    );
    await languageSelector.click();
    await page.getByRole('option', { name: /hebrew|עברית/i }).click();

    await page.waitForTimeout(1000);

    // 4. Verify language changed
    const direction = await page.evaluate(() => document.documentElement.dir);
    expect(direction).toBe('rtl');

    // 5. Reload and verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    const directionAfterReload = await page.evaluate(() => document.documentElement.dir);
    expect(directionAfterReload).toBe('rtl');

    // 6. Verify settings updated
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
});
