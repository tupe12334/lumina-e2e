import test, { expect } from "@playwright/test";

test.describe("Protected Paths", () => {
  test("Login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL("/login");
    await expect(page).toHaveTitle(/Login/);
  });

  test("Home page is accessible without authentication", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page).toHaveTitle(/Home/);
  });

  test("Degrees page is accessible without authentication", async ({
    page,
  }) => {
    await page.goto("/degrees");
    await expect(page).toHaveURL("/degrees");
    // Should not redirect to login for public access
    await expect(page).not.toHaveURL(/\/login/);
  });
});
