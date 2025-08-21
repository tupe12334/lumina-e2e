import { test, expect } from '@playwright/test';

test.describe('Basic Smoke Tests', () => {
  test('Home page loads correctly @smoke', async ({ page }) => {
    await page.goto('/');
    
    // Check basic page elements are present
    await expect(page.getByText('Welcome to Lumina')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
  });

  test('Navigation to degrees page works @smoke', async ({ page }) => {
    await page.goto('/');
    
    // Click Get Started
    await page.getByRole('link', { name: 'Get Started' }).click();
    
    // Verify we navigated to degrees page
    await expect(page).toHaveURL('/degrees');
  });

  test('Language selector is functional @smoke', async ({ page }) => {
    await page.goto('/');
    
    // Look for language selector
    const languageSelector = page.locator('[data-testid="language-selector"], [aria-label="Language"], [role="combobox"]').first();
    await expect(languageSelector).toBeVisible();
  });
});