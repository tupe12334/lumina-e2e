import type { Page, Locator } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Page Object Model for the login screen.
 */
export class LoginPage {
  private readonly page: Page;

  readonly email: Locator;

  readonly password: Locator;

  readonly submit: Locator;

  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: /continue|sign in/i });
    this.error = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.waitFor({ state: 'visible' });
    await this.password.waitFor({ state: 'visible' });
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
    // In SPA, route changes may not trigger a full navigation. Wait for either onboarding UI or URL change.
    try {
      await Promise.race([
        this.page
          .locator('#university-select')
          .waitFor({ state: 'visible', timeout: 15000 }),
        this.page.waitForURL(/\/(onboarding|my-journey|degrees)(\/|$)/, {
          timeout: 15000,
        }),
      ]);
    } catch {
      // Fallback to a network idle to reduce flakiness, but don't hard fail here.
      await this.page.waitForLoadState('networkidle').catch(() => null);
    }
  }

  async autoLogin(): Promise<{ email: string; password: string }> {
    const email = faker.internet.email();
    const password = faker.internet.password();
    await this.login(email, password);
    return { email, password };
  }
}
