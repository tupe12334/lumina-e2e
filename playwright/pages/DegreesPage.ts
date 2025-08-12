import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the degrees page.
 * Handles both the degrees list page and individual degree pages.
 */
export class DegreesPage {
  private readonly page: Page;

  // Degrees list page elements
  readonly pageTitle: Locator;
  readonly degreesTable: Locator;
  readonly degreeRows: Locator;
  readonly noDegreesMessage: Locator;
  readonly loadingMessage: Locator;
  readonly errorMessage: Locator;

  // Table headers
  readonly degreeHeader: Locator;
  readonly universityHeader: Locator;
  readonly coursesHeader: Locator;

  // Individual degree page elements
  readonly degreeName: Locator;
  readonly universityName: Locator;
  readonly coursesCount: Locator;
  readonly noCoursesMessage: Locator;
  readonly degreeFlow: Locator;

  constructor(page: Page) {
    this.page = page;

    // Degrees list page elements
    this.pageTitle = page.getByRole("heading", { name: /degrees|תארים/i });
    this.degreesTable = page.getByRole("table");
    this.degreeRows = page.getByRole("row");
    this.noDegreesMessage = page.getByText(
      /no degrees available|אין תארים זמינים/i
    );
    this.loadingMessage = page.getByText(/loading|טוען/i);
    this.errorMessage = page.getByText(
      /error loading degrees|שגיאה בטעינת תארים/i
    );

    // Table headers
    this.degreeHeader = page.getByRole("columnheader", {
      name: /degree|תואר/i,
    });
    this.universityHeader = page.getByRole("columnheader", {
      name: /university|אוניברסיטה/i,
    });
    this.coursesHeader = page.getByRole("columnheader", {
      name: /courses|קורסים/i,
    });

    // Individual degree page elements
    this.degreeName = page.getByRole("heading", { level: 1 });
    this.universityName = page.getByRole("heading", { level: 2 });
    this.coursesCount = page.getByText(/degree courses|קורסי תואר/i);
    this.noCoursesMessage = page.getByText(
      /no courses available|אין קורסים זמינים/i
    );
    this.degreeFlow = page.getByTestId("degree-flow");
  }

  /**
   * Navigate to the degrees list page.
   */
  async goto(): Promise<void> {
    await this.page.goto("/degrees");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Navigate to a specific degree page by ID.
   */
  async gotoDegree(degreeId: string): Promise<void> {
    await this.page.goto(`/degrees/${degreeId}`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get all degree links from the table.
   */
  getDegreeLinks(): Locator {
    return this.page.locator('a[href^="/degrees/"]');
  }

  /**
   * Get a specific degree row by degree name.
   */
  getDegreeRow(degreeName: string): Locator {
    return this.page.getByRole("row").filter({ hasText: degreeName });
  }

  /**
   * Get the degree link within a specific row.
   */
  getDegreeLinkInRow(degreeName: string): Locator {
    return this.getDegreeRow(degreeName).getByRole("link");
  }

  /**
   * Get the university name for a specific degree.
   */
  getUniversityForDegree(degreeName: string): Locator {
    return this.getDegreeRow(degreeName).getByRole("cell").nth(1);
  }

  /**
   * Get the courses count for a specific degree.
   */
  getCoursesCountForDegree(degreeName: string): Locator {
    return this.getDegreeRow(degreeName).getByRole("cell").nth(2);
  }

  /**
   * Click on a degree link to navigate to its detail page.
   */
  async clickDegree(degreeName: string): Promise<void> {
    // First try to find the degree in a table row (original structure)
    const tableExists = (await this.degreesTable.count()) > 0;

    if (tableExists) {
      // Use the original table-based approach
      await this.getDegreeLinkInRow(degreeName).click();
    } else {
      // Use direct link approach for the current UI structure
      const degreeLink = this.page
        .getByRole("link")
        .filter({ hasText: degreeName });
      await degreeLink.click();
    }

    await this.page.waitForURL((url) => url.pathname.startsWith("/degrees/"));
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for the degrees content to be visible (either table or direct links).
   */
  async waitForDegreesContent(): Promise<void> {
    // Wait for either table or direct degree links to be present
    const tableExists = (await this.degreesTable.count()) > 0;

    if (tableExists) {
      await this.degreesTable.waitFor({ state: "visible" });
    } else {
      // Wait for the page title and at least one degree link
      await this.pageTitle.waitFor({ state: "visible" });
      await this.page.getByRole("link").first().waitFor({ state: "visible" });
    }
  }

  /**
   * Wait for the degrees table to be visible.
   */
  async waitForDegreesTable(): Promise<void> {
    await this.degreesTable.waitFor({ state: "visible" });
  }

  /**
   * Wait for the degree flow diagram to be visible.
   */
  async waitForDegreeFlow(): Promise<void> {
    await this.degreeFlow.waitFor({ state: "visible" });
  }

  /**
   * Check if the page is showing the loading state.
   */
  async isInLoadingState(): Promise<boolean> {
    return await this.loadingMessage.isVisible();
  }

  /**
   * Check if the page is showing an error state.
   */
  async isInErrorState(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Check if the page is showing the no degrees message.
   */
  async hasNoDegrees(): Promise<boolean> {
    return await this.noDegreesMessage.isVisible();
  }

  /**
   * Check if the page is showing the no courses message.
   */
  async hasNoCourses(): Promise<boolean> {
    return await this.noCoursesMessage.isVisible();
  }

  /**
   * Get the number of degrees displayed in the table.
   */
  async getDegreesCount(): Promise<number> {
    const rows = await this.degreeRows.count();
    // Subtract 1 for the header row
    return Math.max(0, rows - 1);
  }

  /**
   * Get all degree names from the table.
   */
  async getDegreeNames(): Promise<string[]> {
    const degreeLinks = this.getDegreeLinks();
    const count = await degreeLinks.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const name = await degreeLinks.nth(i).textContent();
      if (name) {
        names.push(name.trim());
      }
    }

    return names;
  }

  /**
   * Get the current degree name from the detail page.
   */
  async getCurrentDegreeName(): Promise<string | null> {
    return await this.degreeName.textContent();
  }

  /**
   * Get the current university name from the detail page.
   */
  async getCurrentUniversityName(): Promise<string | null> {
    return await this.universityName.textContent();
  }

  /**
   * Get the courses count text from the detail page.
   */
  async getCurrentCoursesCountText(): Promise<string | null> {
    return await this.coursesCount.textContent();
  }
}
