import test, { expect } from '@playwright/test';
import { Sidebar } from './pages/Sidebar';

test.describe('Navigation Flow', () => {
  test('Navigate from home page to universities page via navbar', async ({
    page,
  }) => {
    // Start at the home page
    await page.goto('/');

    // Verify we're on the home page
    await expect(page).toHaveURL('/');

    // Use the sidebar to navigate to universities
    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.gotoUniversities();

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify we're now on the universities page
    await expect(page).toHaveURL('/universities');
    await page.waitForLoadState('networkidle');

    // Verify the universities page content is loaded by checking for the h2 heading
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  });
});
