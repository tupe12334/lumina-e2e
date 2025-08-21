import test, { expect } from "@playwright/test";

test("Check API calls on degrees page @smoke", async ({ page }) => {
  console.log("Monitoring API calls...");

  // Monitor network requests
  const apiCalls: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("localhost") && !url.includes("5766")) {
      apiCalls.push(`${request.method()} ${url}`);
    }
  });

  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("localhost") && !url.includes("5766")) {
      console.log(`Response: ${response.status()} ${url}`);
    }
  });

  await page.goto("/degrees");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000); // Wait for any delayed requests

  console.log("API calls made:", apiCalls);

  // Check for any error messages
  const errorElements = await page
    .locator("text=/error|failed|loading/i")
    .allTextContents();
  console.log("Error/loading messages found:", errorElements);
});
