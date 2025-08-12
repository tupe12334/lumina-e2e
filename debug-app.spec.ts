import test, { expect } from "@playwright/test";

test("Check available routes", async ({ page }) => {
  console.log("Testing home page...");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  console.log("Home page title:", await page.title());
  console.log("Home page URL:", page.url());

  console.log("Testing /degrees...");
  await page.goto("/degrees");
  await page.waitForLoadState("networkidle");
  console.log("Degrees page title:", await page.title());
  console.log("Degrees page URL:", page.url());

  console.log("Testing /login...");
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  console.log("Login page title:", await page.title());
  console.log("Login page URL:", page.url());

  console.log("Testing /dashboard...");
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  console.log("Dashboard page title:", await page.title());
  console.log("Dashboard page URL:", page.url());
});
