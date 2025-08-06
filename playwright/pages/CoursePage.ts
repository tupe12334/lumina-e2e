import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the course page.
 */
export class CoursePage {
  private readonly page: Page;

  readonly enrollButton: Locator;
  readonly withdrawButton: Locator;
  readonly markAsCompleteButton: Locator;
  readonly completedButton: Locator;
  readonly actionBox: Locator;
  readonly courseTitle: Locator;
  readonly loadingMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.enrollButton = page.getByRole('button', { name: /enroll/i });
    this.withdrawButton = page.getByRole('button', { name: /withdraw/i });
    this.markAsCompleteButton = page.getByRole('button', {
      name: /mark as complete/i,
    });
    this.completedButton = page.getByRole('button', { name: /completed/i });
    this.actionBox = page.locator('[data-testid="action-box"]');
    this.courseTitle = page.locator('h1, h2, h3').first();
    this.loadingMessage = page.getByText(/loading/i);
  }

  async goto(courseId: string): Promise<void> {
    await this.page.goto(`/courses/${courseId}`);
  }

  async waitForCourseToLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    // Wait for either the course title or loading to disappear
    await Promise.race([
      this.courseTitle.waitFor({ state: 'visible' }),
      this.loadingMessage.waitFor({ state: 'hidden' }),
    ]);
  }

  async isEnrollButtonVisible(): Promise<boolean> {
    return this.enrollButton.isVisible();
  }

  async isWithdrawButtonVisible(): Promise<boolean> {
    return this.withdrawButton.isVisible();
  }

  async isMarkAsCompleteButtonVisible(): Promise<boolean> {
    return this.markAsCompleteButton.isVisible();
  }

  async isCompletedButtonVisible(): Promise<boolean> {
    return this.completedButton.isVisible();
  }

  async isActionBoxVisible(): Promise<boolean> {
    return this.actionBox.isVisible();
  }

  async clickEnroll(): Promise<void> {
    await this.enrollButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickWithdraw(): Promise<void> {
    await this.withdrawButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickMarkAsComplete(): Promise<void> {
    await this.markAsCompleteButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getCourseTitle(): Promise<string | null> {
    return this.courseTitle.textContent();
  }
}
