import { faker } from '@faker-js/faker';
import { test, expect, type Page } from '@playwright/test';
import { Sidebar } from './pages/Sidebar';

// Test data
const TEST_DEGREE_ID = 'test-degree-123';
const LOCALSTORAGE_KEY = 'lumina-degree-popup-dismissed';

async function createTestUserWithoutDegree(page: Page) {
  // Generate test user data
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email();
  const password = faker.internet.password({ length: 12, memorable: true });

  // Register user
  await page.goto('/register');
  await page.getByLabel('First Name').fill(firstName);
  await page.getByLabel('Last Name').fill(lastName);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('checkbox', { name: /terms/i }).check();
  await page.getByRole('button', { name: /create account|sign up/i }).click();

  // Skip onboarding without setting a degree
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });
  
  // Navigate directly to dashboard to bypass onboarding
  await page.goto('/');
  
  return { firstName, lastName, email };
}

async function loginWithoutDegree(page: Page) {
  // Use a mock logged-in state without a degree
  await page.addInitScript(() => {
    // Mock user state in Redux store
    window.localStorage.setItem('persist:lumina-root', JSON.stringify({
      user: JSON.stringify({
        data: {
          id: 'test-user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          learningDegreeId: null, // No degree set
        },
        isLoading: false,
        error: null,
      }),
      auth: JSON.stringify({
        token: 'mock-jwt-token',
        isAuthenticated: true,
      }),
    }));
  });
}

async function clearDegreePopupPreferences(page: Page) {
  await page.evaluate((key) => {
    window.localStorage.removeItem(key);
  }, LOCALSTORAGE_KEY);
}

test.describe('Degree Popup Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await clearDegreePopupPreferences(page);
    
    // Set up sidebar
    const sidebar = new Sidebar(page);
    await page.goto('/');
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('en');
  });

  test('shows popup for logged-in user without degree on first visit', async ({ page }) => {
    // Mock logged-in user without degree
    await loginWithoutDegree(page);
    
    // Navigate to a degree page
    await page.goto('/degrees/computer-science-bsc');
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // Verify popup appears after delay
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('Set Your Degree')).toBeVisible();
    await expect(page.getByText(/Would you like to set.*as your degree/)).toBeVisible();
    
    // Verify popup buttons are present
    await expect(page.getByRole('button', { name: 'Yes, Set as My Degree' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'No, Thanks' })).toBeVisible();
  });

  test('does not show popup for users who already have a degree', async ({ page }) => {
    // Mock logged-in user WITH a degree
    await page.addInitScript(() => {
      window.localStorage.setItem('persist:lumina-root', JSON.stringify({
        user: JSON.stringify({
          data: {
            id: 'test-user-123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            learningDegreeId: 'existing-degree-456', // User already has a degree
          },
          isLoading: false,
          error: null,
        }),
        auth: JSON.stringify({
          token: 'mock-jwt-token',
          isAuthenticated: true,
        }),
      }));
    });
    
    await page.goto('/degrees/computer-science-bsc');
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // Verify popup does not appear
    await page.waitForTimeout(1500); // Wait longer than popup delay
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Set Your Degree')).not.toBeVisible();
  });

  test('does not show popup for unauthenticated users', async ({ page }) => {
    // Ensure user is not logged in
    await page.addInitScript(() => {
      window.localStorage.removeItem('persist:lumina-root');
    });
    
    await page.goto('/degrees/computer-science-bsc');
    
    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // Verify popup does not appear
    await page.waitForTimeout(1500); // Wait longer than popup delay
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Set Your Degree')).not.toBeVisible();
  });

  test('confirms degree selection when user clicks "Yes"', async ({ page }) => {
    await loginWithoutDegree(page);
    
    // Mock the GraphQL mutation response
    await page.route('**/graphql', async route => {
      const body = await route.request().text();
      if (body.includes('updateMyProfile')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              updateMyProfile: {
                id: 'test-user-123',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                learningDegreeId: 'computer-science-bsc',
                __typename: 'User'
              }
            }
          })
        });
      } else {
        await route.continue();
      }
    });
    
    await page.goto('/degrees/computer-science-bsc');
    
    // Wait for popup to appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    
    // Click "Yes, Set as My Degree"
    await page.getByRole('button', { name: 'Yes, Set as My Degree' }).click();
    
    // Verify popup closes
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    
    // Verify success - could check for updated UI state
    // Note: In a real test, you'd verify the user's degree was updated in the UI
  });

  test('dismisses popup and remembers preference when user clicks "No"', async ({ page }) => {
    await loginWithoutDegree(page);
    
    await page.goto('/degrees/computer-science-bsc');
    
    // Wait for popup to appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    
    // Click "No, Thanks"
    await page.getByRole('button', { name: 'No, Thanks' }).click();
    
    // Verify popup closes
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 1000 });
    
    // Verify localStorage preference is set
    const dismissedPrefs = await page.evaluate((key) => {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    }, LOCALSTORAGE_KEY);
    
    expect(dismissedPrefs).toHaveProperty('computer-science-bsc', true);
    
    // Refresh page to verify popup doesn't appear again
    await page.reload();
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    await page.waitForTimeout(1500); // Wait longer than popup delay
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('shows popup for different degrees even after dismissing one', async ({ page }) => {
    await loginWithoutDegree(page);
    
    // Visit first degree and dismiss popup
    await page.goto('/degrees/computer-science-bsc');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    await page.getByRole('button', { name: 'No, Thanks' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Visit different degree - popup should appear again
    await page.goto('/degrees/mathematics-bsc');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // Verify popup appears for the new degree
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('Set Your Degree')).toBeVisible();
  });

  test('shows loading state during degree confirmation', async ({ page }) => {
    await loginWithoutDegree(page);
    
    // Mock slow GraphQL response
    await page.route('**/graphql', async route => {
      const body = await route.request().text();
      if (body.includes('updateMyProfile')) {
        // Delay response to test loading state
        await page.waitForTimeout(2000);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              updateMyProfile: {
                id: 'test-user-123',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                learningDegreeId: 'computer-science-bsc',
                __typename: 'User'
              }
            }
          })
        });
      } else {
        await route.continue();
      }
    });
    
    await page.goto('/degrees/computer-science-bsc');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    
    // Click confirm button
    await page.getByRole('button', { name: 'Yes, Set as My Degree' }).click();
    
    // Verify loading state
    await expect(page.getByRole('button', { name: 'Loading...' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'No, Thanks' })).toBeDisabled();
    
    // Wait for request to complete
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });

  test('handles errors gracefully during degree confirmation', async ({ page }) => {
    await loginWithoutDegree(page);
    
    // Mock GraphQL error response
    await page.route('**/graphql', async route => {
      const body = await route.request().text();
      if (body.includes('updateMyProfile')) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'Internal server error' }]
          })
        });
      } else {
        await route.continue();
      }
    });
    
    await page.goto('/degrees/computer-science-bsc');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    
    // Click confirm button
    await page.getByRole('button', { name: 'Yes, Set as My Degree' }).click();
    
    // Wait for error handling
    await page.waitForTimeout(1000);
    
    // Verify popup remains open on error (for retry)
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Yes, Set as My Degree' })).toBeVisible();
  });
});

test.describe('Degree Popup Translations', () => {
  test('displays correct translations in Hebrew', async ({ page }) => {
    await page.goto('/');
    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('he');
    
    await loginWithoutDegree(page);
    await page.goto('/degrees/computer-science-bsc');
    
    // Wait for popup to appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    
    // Verify Hebrew translations
    await expect(page.getByText('הגדר את התואר שלך')).toBeVisible();
    await expect(page.getByRole('button', { name: 'כן, הגדר כתואר שלי' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'לא, תודה' })).toBeVisible();
  });

  test('displays correct translations in Spanish', async ({ page }) => {
    await page.goto('/');
    const sidebar = new Sidebar(page);
    await sidebar.waitForFullyMounting();
    await sidebar.selectLanguage('es');
    
    await loginWithoutDegree(page);
    await page.goto('/degrees/computer-science-bsc');
    
    // Wait for popup to appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    
    // Verify Spanish translations
    await expect(page.getByText('Establecer Tu Título')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sí, Establecer como Mi Título' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'No, Gracias' })).toBeVisible();
  });
});