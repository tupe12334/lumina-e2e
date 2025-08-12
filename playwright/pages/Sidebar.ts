import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for interacting with the sidebar navigation.
 */
export class Sidebar {
  private readonly page: Page;

  readonly learningResources: Locator;

  readonly about: Locator;

  readonly contact: Locator;

  readonly languageSelector: Locator;

  readonly authButton: Locator;

  readonly degrees: Locator;

  readonly getStarted: Locator;

  constructor(page: Page) {
    this.page = page;
    this.learningResources = page.getByRole("link", {
      name: /learning resources/i,
    });
    this.about = page.getByRole("link", { name: /about/i });
    this.contact = page.getByRole("link", { name: /contact/i });
    this.languageSelector = page.getByRole("combobox");
    this.authButton = page.getByRole("button", {
      name: /login|logout|התחברות|התנתקות/i,
    });
    this.degrees = page.getByRole("link", { name: /degrees|תארים/i });
    this.getStarted = page.getByRole("link", { name: /get started/i });
  }

  async waitForFullyMounting() {
    await this.waitForCountryFlagToLoad();
  }

  async gotoLearningResources(): Promise<void> {
    await this.learningResources.click();
  }

  async gotoAbout(): Promise<void> {
    await this.about.click();
  }

  async gotoContact(): Promise<void> {
    await this.contact.click();
  }

  async gotoDegrees(): Promise<void> {
    await this.degrees.click();
    await this.page.waitForLoadState("networkidle");
  }

  async clickGetStarted(): Promise<void> {
    await this.getStarted.click();
    await this.page.waitForLoadState("networkidle");
  }

  private async waitForCountryFlagToLoad() {
    await this.page.waitForLoadState("networkidle");
    const svgSelector = 'img[src$="us.svg"], img[src$="il.svg"]';
    await this.page.$(svgSelector);
  }

  async selectLanguage(lang: "en" | "he"): Promise<void> {
    await this.languageSelector.click();
    const option = this.page.getByRole("option", { name: lang.toUpperCase() });
    await option.click();
    await this.page.waitForSelector(`option[value="${lang}"]`, {
      state: "hidden",
    });
    await this.page.getByText("ENHE").waitFor({ state: "detached" });
  }

  async clickAuth(): Promise<void> {
    await this.authButton.click();
  }
}
