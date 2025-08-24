import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the onboarding screen with enhanced select component support.
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
    // Enhanced select components use button elements with specific IDs
    this.universitySelect = page.locator('#profile-university-select');
    this.degreeSelect = page.locator('#profile-degree-select');
    this.agreeCheckbox = page.locator('#profile-terms-agreement');
    this.finishButton = page.getByRole('button', { name: /finish|סיים/i });
    this.advancedSectionButton = page.locator('#profile-advanced-toggle');
    this.addAllDegreeCoursesCheckbox = page.locator('#profile-add-all-courses');
  }

  async goto(): Promise<void> {
    await this.page.goto('/onboarding');
  }

  /**
   * Select institution using the enhanced select component.
   */
  async selectInstitution(name: string): Promise<void> {
    // Click to open dropdown
    await this.universitySelect.click();
    
    // Wait for dropdown to appear
    await this.page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    
    // Look for the university option and click it
    const option = this.page.locator('[role="option"]', { hasText: name });
    await option.click();
    
    // Wait for dropdown to close
    await this.page.locator('[role="listbox"]').waitFor({ state: 'hidden' });
  }

  /**
   * Select degree using the enhanced select component.
   */
  async selectDegree(name: string): Promise<void> {
    // Click to open dropdown
    await this.degreeSelect.click();
    
    // Wait for dropdown to appear
    await this.page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    
    // Look for the degree option and click it
    const option = this.page.locator('[role="option"]', { hasText: name });
    await option.click();
    
    // Wait for dropdown to close
    await this.page.locator('[role="listbox"]').waitFor({ state: 'hidden' });
  }

  /**
   * Search for university in the dropdown.
   */
  async searchUniversity(searchTerm: string): Promise<void> {
    await this.universitySelect.click();
    await this.page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    
    const searchInput = this.page.locator('input[placeholder*="search" i], input[placeholder*="חיפוש" i]');
    await searchInput.fill(searchTerm);
    
    // Wait for debounced search results
    await this.page.waitForTimeout(500);
  }

  /**
   * Search for degree in the dropdown.
   */
  async searchDegree(searchTerm: string): Promise<void> {
    await this.degreeSelect.click();
    await this.page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    
    const searchInput = this.page.locator('input[placeholder*="search" i], input[placeholder*="חיפוש" i]');
    await searchInput.fill(searchTerm);
    
    // Wait for debounced search results
    await this.page.waitForTimeout(500);
  }

  /**
   * Get all visible university options from dropdown.
   */
  async getUniversityOptions(): Promise<string[]> {
    await this.universitySelect.click();
    await this.page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    
    const options = this.page.locator('[role="option"]');
    const optionTexts = await options.allTextContents();
    
    // Close dropdown
    await this.page.keyboard.press('Escape');
    
    return optionTexts;
  }

  /**
   * Get all visible degree options from dropdown.
   */
  async getDegreeOptions(): Promise<string[]> {
    await this.degreeSelect.click();
    await this.page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    
    const options = this.page.locator('[role="option"]');
    const optionTexts = await options.allTextContents();
    
    // Close dropdown
    await this.page.keyboard.press('Escape');
    
    return optionTexts;
  }

  /**
   * Check if university dropdown is in loading state.
   */
  async isUniversityLoading(): Promise<boolean> {
    const loadingText = await this.universitySelect.textContent();
    return loadingText?.toLowerCase().includes('loading') || false;
  }

  /**
   * Check if degree dropdown is in loading state.
   */
  async isDegreeLoading(): Promise<boolean> {
    const loadingText = await this.degreeSelect.textContent();
    return loadingText?.toLowerCase().includes('loading') || false;
  }

  /**
   * Check if university dropdown shows error state.
   */
  async hasUniversityError(): Promise<boolean> {
    const errorMessage = this.page.locator('text=/failed to load.*university/i, text=/error.*university/i');
    return await errorMessage.isVisible();
  }

  /**
   * Check if degree dropdown shows error state.
   */
  async hasDegreeError(): Promise<boolean> {
    const errorMessage = this.page.locator('text=/failed to load.*degree/i, text=/error.*degree/i');
    return await errorMessage.isVisible();
  }

  /**
   * Complete the full onboarding flow.
   */
  async agreeAndFinish(): Promise<void> {
    await this.agreeCheckbox.check();
    await this.finishButton.click();
  }

  /**
   * Toggle the advanced options section.
   */
  async toggleAdvancedSection(): Promise<void> {
    await this.advancedSectionButton.click();
  }

  /**
   * Set the "add all degree courses" checkbox state.
   */
  async setAddAllDegreeCourses(checked: boolean): Promise<void> {
    const isChecked = await this.addAllDegreeCoursesCheckbox.isChecked();
    if (isChecked !== checked) {
      await this.addAllDegreeCoursesCheckbox.click();
    }
  }

  /**
   * Check if the no degree message is visible.
   */
  async isNoDegreeMessageVisible(): Promise<boolean> {
    const noDegreeMessage = this.page.locator('#profile-no-degree-message, text=/you can always add/i, text=/תוכל תמיד להוסיף/i');
    return await noDegreeMessage.isVisible();
  }

  /**
   * Check if advanced options section is visible.
   */
  async isAdvancedSectionVisible(): Promise<boolean> {
    return await this.advancedSectionButton.isVisible();
  }

  /**
   * Check if advanced options content (checkbox) is visible.
   */
  async isAdvancedOptionsContentVisible(): Promise<boolean> {
    return await this.addAllDegreeCoursesCheckbox.isVisible();
  }

  /**
   * Get validation error messages.
   */
  async getValidationErrors(): Promise<string[]> {
    const errorSelectors = [
      'text=/university.*required/i',
      'text=/degree.*required/i', 
      'text=/terms.*required/i',
      'text=/אוניברסיטה.*נדרש/i',
      'text=/תואר.*נדרש/i',
      'text=/הסכם.*נדרש/i'
    ];
    
    const errors: string[] = [];
    
    for (const selector of errorSelectors) {
      const errorElement = this.page.locator(selector);
      if (await errorElement.isVisible()) {
        const text = await errorElement.textContent();
        if (text) errors.push(text);
      }
    }
    
    return errors;
  }

  /**
   * Wait for the onboarding page to be fully loaded.
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.universitySelect.waitFor({ state: 'visible' });
    await this.agreeCheckbox.waitFor({ state: 'visible' });
    await this.finishButton.waitFor({ state: 'visible' });
  }

  /**
   * Check if the form can be submitted (finish button is enabled).
   */
  async canSubmit(): Promise<boolean> {
    return await this.finishButton.isEnabled();
  }
}
