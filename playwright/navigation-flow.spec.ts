import test, { expect } from "@playwright/test";
import { Sidebar } from "./pages/Sidebar";

test.describe("Navigation Flow", () => {
  test("Navigate from home page to degrees page via Get Started button", async ({
    page,
  }) => {
    // Start at the home page
    await page.goto("/");

    // Verify we're on the home page
    await expect(page).toHaveURL("/");

    // Use the sidebar to navigate to degrees via Get Started
    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.clickGetStarted();

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Verify we're now on the degrees page
    await expect(page).toHaveURL("/degrees");
    await page.waitForLoadState("networkidle");

    // Verify the degrees page content is loaded by checking for content
    await expect(page.getByText("Degrees")).toBeVisible();
  });

  test("Navigate to learning resources", async ({ page }) => {
    // Start at the home page
    await page.goto("/");

    // Use the sidebar to navigate to learning resources
    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.gotoLearningResources();

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Verify we're on the learning resources page
    await expect(page).toHaveURL("/learning-resources");
  });
});
