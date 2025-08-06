import test, { expect } from '@playwright/test';

test.describe('Protected Paths', () => {
  test('Dashboard is protected', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
