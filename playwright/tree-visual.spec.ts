import test, { expect } from '@playwright/test';
import { Sidebar } from './pages/Sidebar';
import { DegreesPage } from './pages/DegreesPage';
test.describe('Testing the visualization of the BlockTree in every page that in use', () => {
  test.skip('Course page', () => {});
  test.skip('My Journey page', () => {});
  test('Degree page', async ({ page }) => {
    await page.goto('/degrees');
    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    const degreesPage = new DegreesPage(page);
    await degreesPage.clickDegree('Economics');
    await page.waitForTimeout(3000);
  });
});
