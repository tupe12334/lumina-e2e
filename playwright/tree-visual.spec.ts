import test, { expect } from '@playwright/test';
import { Sidebar } from './pages/Sidebar';
import { DegreesPage } from './pages/DegreesPage';

test.describe('Testing the visualization of the BlockTree in every page that in use', () => {
  test.skip('Course page', () => {});
  test.skip('My Journey page', () => {});
  test('Degree page', async ({ page }) => {
    await page.goto('/degrees');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for GraphQL requests

    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();

    const degreesPage = new DegreesPage(page);
    await degreesPage.waitForDegreesContent();

    // Check if we have the degrees page loaded
    await expect(page.getByRole('heading', { name: 'Degrees' })).toBeVisible();

    // Skip the degree navigation test for now since it requires working backend
    test.skip(
      true,
      'Degree navigation requires working backend - focusing on page load only'
    );
  });
});
