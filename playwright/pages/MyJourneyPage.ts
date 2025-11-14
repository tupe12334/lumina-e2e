import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the My Journey page.
 */
export class MyJourneyPage {
  private readonly page: Page;

  readonly courseNodes: Locator;
  readonly loadingMessage: Locator;
  readonly noCoursesMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // React Flow nodes are rendered as divs with role="treeitem"
    this.courseNodes = page.locator('[role="treeitem"]');
    this.loadingMessage = page.getByText(/loading/i);
    this.noCoursesMessage = page.getByText(/no courses/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/my-journey');
  }

  async waitForPageToLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    // Wait for either course nodes to appear or no courses message
    await Promise.race([
      this.courseNodes.first().waitFor({ state: 'visible' }),
      this.noCoursesMessage.waitFor({ state: 'visible' }),
    ]);
  }

  async getCourseNodes(): Promise<Locator[]> {
    const count = await this.courseNodes.count();
    const nodes: Locator[] = [];
    for (let i = 0; i < count; i++) {
      nodes.push(this.courseNodes.nth(i));
    }
    return nodes;
  }

  async getCourseNodeByCourseName(courseName: string): Promise<Locator> {
    // Find course node by its displayed name (which is what users see)
    return this.page.locator(`[role="treeitem"]:has-text("${courseName}")`);
  }

  async isCourseCompleted(courseName: string): Promise<boolean> {
    const courseNode = await this.getCourseNodeByCourseName(courseName);
    const nodeCount = await courseNode.count();
    if (nodeCount === 0) return false;
    const className = await courseNode.first().getAttribute('class');
    return className !== null && className !== undefined ? className.includes('tree-node--style-complete') : false;
  }

  async clickCourse(courseName: string): Promise<void> {
    const courseNode = await this.getCourseNodeByCourseName(courseName);
    await courseNode.click();
    await this.page.waitForLoadState('networkidle');
  }
}