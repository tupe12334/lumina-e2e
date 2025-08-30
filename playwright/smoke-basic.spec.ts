import { test, expect } from '@playwright/test';

test.describe('Basic Smoke Tests', () => {
  test('Home page loads correctly @smoke', async ({ page }) => {
    await page.goto('/');

    // Check that the language selection modal appears (first-time user flow)
    await expect(page.getByText('Welcome to Lumina').first()).toBeVisible();
    await expect(page.getByText('Choose your preferred language to get started')).toBeVisible();

    // Check that language options are available using more specific selectors
    await expect(page.locator('[role="option"]').filter({ hasText: 'English' }).first()).toBeVisible();
    await expect(page.locator('[role="option"]').filter({ hasText: 'עברית' })).toBeVisible();

    // Check that Login link is visible in sidebar
    await expect(page.getByText('Login')).toBeVisible();
  });

  test('Language selection works @smoke', async ({ page }) => {
    await page.goto('/');

    // Select English language by clicking on the option
    await page.locator('[role="option"]').filter({ hasText: 'English' }).first().click();

    // After language selection, we should be able to navigate
    // The modal should close and we should see main content
    await expect(page.getByText('Choose your preferred language to get started')).not.toBeVisible();
  });

  test('Login link is accessible @smoke', async ({ page }) => {
    await page.goto('/');

    // Check that Login link is visible and clickable
    const loginLink = page.getByText('Login');
    await expect(loginLink).toBeVisible();
  });
});