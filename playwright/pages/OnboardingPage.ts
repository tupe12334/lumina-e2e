import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the onboarding screen.
 */
export class OnboardingPage {
  private readonly page: Page;

  readonly universitySelect: Locator;

  readonly degreeSelect: Locator;

  readonly agreeCheckbox: Locator;

  readonly finishButton: Locator;

  readonly advancedSectionButton: Locator;

  readonly addAllDegreeCoursesCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.universitySelect = page.locator('#university-select');
    this.degreeSelect = page.locator('#degree-select');
    this.agreeCheckbox = page.getByRole('checkbox', { name: /i agree/i });
    this.finishButton = page.getByRole('button', { name: /finish/i });
    this.advancedSectionButton = page.getByRole('button', {
      name: /advanced/i,
    });
    this.addAllDegreeCoursesCheckbox = page.getByRole('checkbox', {
      name: /add all degree.*relevant courses/i,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/onboarding');
  }

  async selectUniversity(name: string): Promise<void> {
    await this.universitySelect.selectOption({ label: name });
  }

  async selectDegree(name: string): Promise<void> {
    await this.degreeSelect.selectOption({ label: name });
  }

  async agreeAndFinish(): Promise<void> {
    await this.agreeCheckbox.check();
    await this.finishButton.click();
  }

  async toggleAdvancedSection(): Promise<void> {
    await this.advancedSectionButton.click();
  }

  async setAddAllDegreeCourses(checked: boolean): Promise<void> {
    const isChecked = await this.addAllDegreeCoursesCheckbox.isChecked();
    if (isChecked !== checked) {
      await this.addAllDegreeCoursesCheckbox.click();
    }
  }
}
