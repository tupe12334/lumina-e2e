import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for the My Journey / Learning Path page
 */
export class LearningJourneyPage {
  private readonly page: Page;

  readonly pageTitle: Locator;
  readonly courseBlocks: Locator;
  readonly completedCourses: Locator;
  readonly inProgressCourses: Locator;
  readonly lockedCourses: Locator;
  readonly progressOverview: Locator;
  readonly achievementsBadges: Locator;
  readonly continueStudyingButton: Locator;
  readonly settingsButton: Locator;
  readonly searchCourses: Locator;
  readonly filterButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { name: /my journey|learning path/i });
    this.courseBlocks = page.locator('[data-testid="course-block"]');
    this.completedCourses = page.locator('[data-testid="course-block"][data-status="completed"]');
    this.inProgressCourses = page.locator('[data-testid="course-block"][data-status="in-progress"]');
    this.lockedCourses = page.locator('[data-testid="course-block"][data-status="locked"]');
    this.progressOverview = page.locator('[data-testid="progress-overview"]');
    this.achievementsBadges = page.locator('[data-testid="achievement-badge"]');
    this.continueStudyingButton = page.getByRole('button', { name: /continue studying|resume/i });
    this.settingsButton = page.getByRole('button', { name: /settings|preferences/i });
    this.searchCourses = page.getByPlaceholder(/search courses|find course/i);
    this.filterButtons = page.locator('[data-testid="filter-button"]');
  }

  /**
   * Navigate to the learning journey page
   */
  async goto(): Promise<void> {
    await this.page.goto('/my-journey');
    await this.waitForPageLoad();
  }

  /**
   * Wait for the learning journey page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.pageTitle.waitFor({ state: 'visible' });
    await this.courseBlocks.first().waitFor({ state: 'visible' });
  }

  /**
   * Get all available courses
   */
  async getAllCourses(): Promise<Array<{ name: string; status: string; element: Locator }>> {
    const blocks = await this.courseBlocks.all();
    const courses = [];

    for (const block of blocks) {
      const name = await block.locator('[data-testid="course-name"]').textContent() || '';
      const status = await block.getAttribute('data-status') || 'unknown';
      courses.push({ name, status, element: block });
    }

    return courses;
  }

  /**
   * Click on a course by name
   */
  async clickCourse(courseName: string): Promise<void> {
    const courseBlock = this.courseBlocks.filter({ hasText: courseName });
    await expect(courseBlock).toBeVisible();
    await courseBlock.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the overall progress percentage
   */
  async getOverallProgress(): Promise<number> {
    const progressText = await this.progressOverview.textContent();
    if (!progressText) return 0;

    const match = progressText.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get count of completed courses
   */
  async getCompletedCoursesCount(): Promise<number> {
    return await this.completedCourses.count();
  }

  /**
   * Get count of in-progress courses
   */
  async getInProgressCoursesCount(): Promise<number> {
    return await this.inProgressCourses.count();
  }

  /**
   * Get count of locked courses
   */
  async getLockedCoursesCount(): Promise<number> {
    return await this.lockedCourses.count();
  }

  /**
   * Continue studying (click the main CTA button)
   */
  async continueStudying(): Promise<void> {
    await this.continueStudyingButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search for courses
   */
  async searchForCourse(searchTerm: string): Promise<void> {
    await this.searchCourses.fill(searchTerm);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Apply a filter
   */
  async applyFilter(filterName: string): Promise<void> {
    const filterButton = this.filterButtons.filter({ hasText: filterName });
    await filterButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get all achievements earned
   */
  async getAchievements(): Promise<string[]> {
    const badges = await this.achievementsBadges.all();
    const achievements = [];

    for (const badge of badges) {
      const title = await badge.getAttribute('title') || await badge.textContent() || '';
      if (title) achievements.push(title);
    }

    return achievements;
  }

  /**
   * Open user settings
   */
  async openSettings(): Promise<void> {
    await this.settingsButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if a specific course is available and clickable
   */
  async isCourseAvailable(courseName: string): Promise<boolean> {
    const courseBlock = this.courseBlocks.filter({ hasText: courseName });
    try {
      await courseBlock.waitFor({ state: 'visible', timeout: 2000 });
      const status = await courseBlock.getAttribute('data-status');
      return status !== 'locked';
    } catch {
      return false;
    }
  }

  /**
   * Mark a course as complete (if there's a complete button)
   */
  async markCourseComplete(courseName: string): Promise<void> {
    const courseBlock = this.courseBlocks.filter({ hasText: courseName });
    const completeButton = courseBlock.getByRole('button', { name: /complete|mark complete/i });

    if (await completeButton.isVisible()) {
      await completeButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Get course completion status
   */
  async getCourseStatus(courseName: string): Promise<string> {
    const courseBlock = this.courseBlocks.filter({ hasText: courseName });
    return await courseBlock.getAttribute('data-status') || 'unknown';
  }

  /**
   * Verify that the journey shows expected progression
   */
  async verifyJourneyProgression(): Promise<void> {
    // Check that page loaded correctly
    await expect(this.pageTitle).toBeVisible();

    // Check that at least one course is visible
    await expect(this.courseBlocks.first()).toBeVisible();

    // Check that progress overview is shown
    await expect(this.progressOverview).toBeVisible();

    // Verify progress percentage is reasonable (0-100%)
    const progress = await this.getOverallProgress();
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  }
}