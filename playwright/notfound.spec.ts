import { test, expect } from '@playwright/test';

test('displays 404 page content', async ({ page }) => {
  await page.goto('/404');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'Page not found'
  );
});
