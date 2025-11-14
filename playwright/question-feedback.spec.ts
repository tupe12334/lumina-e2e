import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { faker } from '@faker-js/faker';
import { VisualHelpers } from './utils/visual-helpers';

test.describe('Question Feedback Functionality', () => {
  let visualHelpers: VisualHelpers;

  test.beforeEach(async ({ page }) => {
    visualHelpers = new VisualHelpers(page);
    // Navigate to the home page first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Authenticated User Feedback', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      const email = faker.internet.email();
      const password = faker.internet.password();
      await loginPage.login(email, password);

      // Complete onboarding if required
      try {
        // Wait for onboarding or check if we're redirected elsewhere
        const universitySelect = page.locator('#university-select');
        if (await universitySelect.isVisible({ timeout: 5000 })) {
          await universitySelect.click();
          // Select first option
          await page.locator('#university-select option').first().click();
          const continueButton = page.locator('button').filter({ hasText: /continue/i });
          if (await continueButton.isVisible({ timeout: 2000 })) {
            await continueButton.click();
          }
        }
      } catch (e) {
        // Onboarding may not be required, continue with test
      }

      // Navigate to a question page that we know exists
      await page.goto('/questions');
      await page.waitForLoadState('networkidle');

      // Find and click on the first question
      const firstQuestionLink = page.locator('a[href*="/questions/"]').first();
      await firstQuestionLink.waitFor({ state: 'visible', timeout: 10000 });
      await firstQuestionLink.click();
      await page.waitForLoadState('networkidle');
    });

    test('should display upvote and downvote buttons for authenticated users', async ({ page }) => {
      // Take initial screenshot of the question page
      await visualHelpers.prepareForScreenshot();
      await expect(page).toHaveScreenshot('question-page-authenticated.png');

      // Check that feedback buttons are visible
      const upvoteButton = page.locator('button[aria-label*="Upvote"], button[aria-label*="like"], button').filter({ hasText: /upvote|like/i });
      const downvoteButton = page.locator('button[aria-label*="Downvote"], button[aria-label*="dislike"], button').filter({ hasText: /downvote|dislike/i });

      await expect(upvoteButton.first()).toBeVisible();
      await expect(downvoteButton.first()).toBeVisible();

      // Take screenshot of feedback buttons
      if (await upvoteButton.first().isVisible() && await downvoteButton.first().isVisible()) {
        const feedbackSection = page.locator('button[aria-label*="Upvote"], button').filter({ hasText: /upvote|like/i }).first().locator('xpath=./..');
        await expect(feedbackSection).toHaveScreenshot('feedback-buttons-default.png');
      }
    });

    test('should allow user to upvote a question', async ({ page }) => {
      // Find the upvote button (arrow up or thumbs up icon)
      const upvoteButton = page.locator('button[aria-label*="Upvote"], button').filter({ hasText: /upvote|like/i }).first();

      // Take screenshot before clicking
      await visualHelpers.prepareForScreenshot();
      const feedbackSection = upvoteButton.locator('xpath=./..');
      await expect(feedbackSection).toHaveScreenshot('feedback-before-upvote.png');

      // Click upvote button
      await upvoteButton.click();

      // Wait for the API request to complete
      await page.waitForTimeout(1000);

      // Take screenshot after clicking (active state)
      await visualHelpers.prepareForScreenshot();
      await expect(feedbackSection).toHaveScreenshot('feedback-after-upvote.png');

      // Check that the button state has changed (could be highlighted, different color, etc.)
      // This will depend on the specific implementation
      const isActive = await upvoteButton.getAttribute('aria-pressed');
      expect(isActive).toBe('true');
    });

    test('should allow user to downvote a question', async ({ page }) => {
      // Find the downvote button
      const downvoteButton = page.locator('button[aria-label*="Downvote"], button').filter({ hasText: /downvote|dislike/i }).first();

      // Take screenshot before clicking
      await visualHelpers.prepareForScreenshot();
      const feedbackSection = downvoteButton.locator('xpath=./..');
      await expect(feedbackSection).toHaveScreenshot('feedback-before-downvote.png');

      // Click downvote button
      await downvoteButton.click();

      // Wait for the API request to complete
      await page.waitForTimeout(1000);

      // Take screenshot after clicking (active state)
      await visualHelpers.prepareForScreenshot();
      await expect(feedbackSection).toHaveScreenshot('feedback-after-downvote.png');

      // Check that the button state has changed
      const isActive = await downvoteButton.getAttribute('aria-pressed');
      expect(isActive).toBe('true');
    });

    test('should allow user to toggle feedback (remove vote)', async ({ page }) => {
      // Find and click upvote button
      const upvoteButton = page.locator('button[aria-label*="Upvote"], button').filter({ hasText: /upvote|like/i }).first();
      const feedbackSection = upvoteButton.locator('xpath=./..');

      await upvoteButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot of active state
      await visualHelpers.prepareForScreenshot();
      await expect(feedbackSection).toHaveScreenshot('feedback-toggle-active.png');

      // Click the same button again to remove the vote
      await upvoteButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot of inactive state after toggle
      await visualHelpers.prepareForScreenshot();
      await expect(feedbackSection).toHaveScreenshot('feedback-toggle-inactive.png');

      // Check that the button is no longer active
      const isActive = await upvoteButton.getAttribute('aria-pressed');
      expect(isActive).toBe('false');
    });

    test('should allow user to switch between upvote and downvote', async ({ page }) => {
      const upvoteButton = page.locator('button[aria-label*="Upvote"], button').filter({ hasText: /upvote|like/i }).first();
      const downvoteButton = page.locator('button[aria-label*="Downvote"], button').filter({ hasText: /downvote|dislike/i }).first();

      // First, upvote
      await upvoteButton.click();
      await page.waitForTimeout(1000);

      // Then switch to downvote
      await downvoteButton.click();
      await page.waitForTimeout(1000);

      // Check states
      const upvoteActive = await upvoteButton.getAttribute('aria-pressed');
      const downvoteActive = await downvoteButton.getAttribute('aria-pressed');

      expect(upvoteActive).toBe('false');
      expect(downvoteActive).toBe('true');
    });

    test('should update feedback count when voting', async ({ page }) => {
      // Look for feedback score/count display
      const scoreDisplay = page.locator('[data-testid="feedback-score"], .feedback-score, .vote-score').first();

      // Get initial score if visible
      let initialScore = '0';
      if (await scoreDisplay.isVisible()) {
        initialScore = await scoreDisplay.textContent() || '0';
      }

      // Click upvote
      const upvoteButton = page.locator('button[aria-label*="Upvote"], button').filter({ hasText: /upvote|like/i }).first();
      await upvoteButton.click();
      await page.waitForTimeout(2000);

      // Check if score updated (this might not always be visible depending on implementation)
      if (await scoreDisplay.isVisible()) {
        const newScore = await scoreDisplay.textContent() || '0';
        // Score should have changed (increased by 1 if starting from 0)
        expect(newScore).not.toBe(initialScore);
      }
    });

    test('should persist feedback across page reloads', async ({ page }) => {
      // Click upvote
      const upvoteButton = page.locator('button[aria-label*="Upvote"], button').filter({ hasText: /upvote|like/i }).first();
      await upvoteButton.click();
      await page.waitForTimeout(1000);

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check that the upvote is still active
      const reloadedUpvoteButton = page.locator('button[aria-label*="Upvote"], button').filter({ hasText: /upvote|like/i }).first();
      await reloadedUpvoteButton.waitFor({ state: 'visible' });

      const isActive = await reloadedUpvoteButton.getAttribute('aria-pressed');
      expect(isActive).toBe('true');
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock a network failure for feedback API
      await page.route('**/api/questions/*/likes', route => {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      });

      const upvoteButton = page.locator('button[aria-label*="Upvote"], button').filter({ hasText: /upvote|like/i }).first();
      await upvoteButton.click();

      // Wait for potential error message
      await page.waitForTimeout(2000);

      // Check that error feedback is shown (toast notification, error message, etc.)
      const errorMessage = page.locator('[data-testid="toast"], .sonner-toast, .error-message');
      const hasError = await errorMessage.count() > 0;

      // Either an error message should be shown, or the button state should remain unchanged
      if (hasError) {
        const errorText = await errorMessage.first().textContent();
        expect(errorText?.toLowerCase()).toContain('error');
      } else {
        // Button should not be in active state if request failed
        const isActive = await upvoteButton.getAttribute('aria-pressed');
        expect(isActive).not.toBe('true');
      }
    });
  });

  test.describe('Unauthenticated User Feedback', () => {
    test('should not display feedback buttons for unauthenticated users', async ({ page }) => {
      // Navigate to a question page without logging in
      await page.goto('/questions');
      await page.waitForLoadState('networkidle');

      // Find and click on the first question
      const firstQuestionLink = page.locator('a[href*="/questions/"]').first();
      if (await firstQuestionLink.isVisible({ timeout: 5000 })) {
        await firstQuestionLink.click();
        await page.waitForLoadState('networkidle');

        // Take screenshot of unauthenticated question page
        await visualHelpers.prepareForScreenshot();
        await expect(page).toHaveScreenshot('question-page-unauthenticated.png');

        // Check that feedback buttons are not visible or prompt user to login
        const upvoteButton = page.locator('button[aria-label*="Upvote"], button').filter({ hasText: /upvote|like/i });
        const downvoteButton = page.locator('button[aria-label*="Downvote"], button').filter({ hasText: /downvote|dislike/i });

        const upvoteVisible = await upvoteButton.count() > 0;
        const downvoteVisible = await downvoteButton.count() > 0;

        // Either buttons are not visible, or they prompt for login when clicked
        if (upvoteVisible && downvoteVisible) {
          // If buttons are visible, clicking should prompt for login
          await upvoteButton.first().click();
          await page.waitForTimeout(1000);

          // Take screenshot after clicking (should show login prompt or redirect)
          await expect(page).toHaveScreenshot('question-feedback-login-prompt.png');

          // Should redirect to login page or show login prompt
          const isOnLoginPage = page.url().includes('/login');
          const hasLoginPrompt = await page.locator('text=/login|sign in/i').count() > 0;

          expect(isOnLoginPage || hasLoginPrompt).toBeTruthy();
        } else {
          // Buttons should not be visible for unauthenticated users
          expect(upvoteVisible).toBeFalsy();
          expect(downvoteVisible).toBeFalsy();
        }
      }
    });

    test('should redirect to login when clicking feedback as unauthenticated user', async ({ page }) => {
      // Navigate directly to a question page
      await page.goto('/questions');
      await page.waitForLoadState('networkidle');

      const firstQuestionLink = page.locator('a[href*="/questions/"]').first();
      if (await firstQuestionLink.isVisible({ timeout: 5000 })) {
        await firstQuestionLink.click();
        await page.waitForLoadState('networkidle');

        // Try to find and click feedback buttons
        const feedbackButtons = page.locator('button').filter({ hasText: /upvote|downvote|like|dislike/i });

        if (await feedbackButtons.count() > 0) {
          const currentUrl = page.url();
          await feedbackButtons.first().click();
          await page.waitForTimeout(2000);

          // Should redirect to login with return URL
          const newUrl = page.url();
          const isOnLoginPage = newUrl.includes('/login');
          const hasReturnUrl = newUrl.includes('returnUrl') || newUrl.includes(encodeURIComponent(currentUrl));

          if (isOnLoginPage) {
            expect(hasReturnUrl).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Feedback UI States', () => {
    test.beforeEach(async ({ page }) => {
      // Login for UI state tests
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      const email = faker.internet.email();
      const password = faker.internet.password();
      await loginPage.login(email, password);

      // Navigate to question page
      await page.goto('/questions');
      await page.waitForLoadState('networkidle');
      const firstQuestionLink = page.locator('a[href*="/questions/"]').first();
      if (await firstQuestionLink.isVisible({ timeout: 5000 })) {
        await firstQuestionLink.click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should show loading state while submitting feedback', async ({ page }) => {
      // Slow down the network to see loading state
      await page.route('**/api/questions/*/likes', async route => {
        // Delay the response to see loading state
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });

      const upvoteButton = page.locator('button[aria-label*="Upvote"], button').filter({ hasText: /upvote|like/i }).first();
      const feedbackSection = upvoteButton.locator('xpath=./..');

      // Take screenshot before clicking
      await visualHelpers.prepareForScreenshot();
      await expect(feedbackSection).toHaveScreenshot('feedback-before-loading.png');

      // Click and immediately check for loading state
      await upvoteButton.click();

      // Wait a moment for loading state to appear
      await page.waitForTimeout(100);

      // Take screenshot of loading state
      await expect(feedbackSection).toHaveScreenshot('feedback-loading-state.png');

      // Look for loading indicators (spinner, disabled state, loading text)
      const hasLoadingIndicator = await Promise.race([
        page.locator('.animate-spin, [data-testid="loading"], .loading').count().then(count => count > 0),
        upvoteButton.isDisabled(),
        page.waitForTimeout(1000).then(() => false)
      ]);

      // At least one loading indicator should be present
      expect(hasLoadingIndicator).toBeTruthy();

      // Wait for loading to complete and take final screenshot
      await page.waitForTimeout(3000);
      await visualHelpers.prepareForScreenshot();
      await expect(feedbackSection).toHaveScreenshot('feedback-after-loading.png');
    });

    test('should display feedback statistics correctly', async ({ page }) => {
      // Look for feedback statistics display
      const statsSection = page.locator('[data-testid="feedback-stats"], .feedback-stats, .feedback-summary');

      if (await statsSection.isVisible({ timeout: 5000 })) {
        // Check that statistics are displayed with proper format
        const statsText = await statsSection.textContent();
        expect(statsText).toBeTruthy();

        // Should contain numbers or percentages
        expect(statsText).toMatch(/\d+%?|\d+\s*(votes?|likes?)/i);
      }
    });
  });
});