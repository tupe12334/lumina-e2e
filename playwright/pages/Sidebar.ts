import type { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for interacting with the sidebar navigation.
 */
export class Sidebar {
  private readonly page: Page;

  readonly universities: Locator;

  readonly courses: Locator;

  readonly dashboard: Locator;

  readonly languageSelector: Locator;

  readonly authButton: Locator;

  readonly degrees: Locator;

  constructor(page: Page) {
    this.page = page;
    this.universities = page.getByRole('link', {
      name: /universities|אוניברסיטאות/i,
    });
    this.courses = page.getByRole('link', { name: /courses|קורסים/i });
    this.dashboard = page.getByRole('link', { name: /dashboard|לוח/i });
    this.languageSelector = page.getByRole('combobox');
    this.authButton = page.getByRole('button', {
      name: /login|logout|התחברות|התנתקות/i,
    });
    this.degrees = page.getByRole('link', { name: /degrees|תארים/i });
  }

  async waitForFullyMounting() {
    await this.waitForCountryFlagToLoad();
  }

  async gotoUniversities(): Promise<void> {
    await this.universities.click();
  }

  async gotoCourses(): Promise<void> {
    await this.courses.click();
  }

  async gotoDashboard(): Promise<void> {
    await this.dashboard.click();
    await this.page.waitForLoadState('networkidle');
  }

  async gotoDegrees(): Promise<void> {
    await this.degrees.click();
    await this.page.waitForLoadState('networkidle');
  }

  private async waitForCountryFlagToLoad() {
    await this.page.waitForLoadState('networkidle');
    const svgSelector = 'img[src$="us.svg"], img[src$="il.svg"]';
    await this.page.$(svgSelector);
  }

  async selectLanguage(lang: 'en' | 'he'): Promise<void> {
    await this.languageSelector.click();
    const option = this.page.getByRole('option', { name: lang.toUpperCase() });
    await option.click();
    await this.page.waitForSelector(`option[value="${lang}"]`, {
      state: 'hidden',
    });
    await this.page.getByText('ENHE').waitFor({ state: 'detached' });
  }

  async clickAuth(): Promise<void> {
    await this.authButton.click();
  }
}
