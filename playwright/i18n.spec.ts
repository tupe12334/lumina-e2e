import { expect, test } from '@playwright/test';
import { Sidebar } from './pages/Sidebar';
test.describe('i18n', () => {
  test('should switch from English to Hebrew and back', async ({ page }) => {
    await page.goto('/');

    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('he');
    expect(await page.evaluate(() => document.documentElement.dir)).toBe('rtl');
    await sidebar.selectLanguage('en');
    expect(await page.evaluate(() => document.documentElement.dir)).toBe('ltr');
  });

  test.skip('should switch to user selected language', () => {});
});
