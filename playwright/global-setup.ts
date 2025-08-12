import { chromium } from '@playwright/test';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.context().clearCookies();
  await page.goto('http://localhost:5766');
  await page.evaluate(() => localStorage.clear());
  await browser.close();
}

export default globalSetup;
